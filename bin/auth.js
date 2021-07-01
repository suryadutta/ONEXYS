const config = require("./config"),
  Queue = require("better-queue"),
  mongo = require("../models/mongo"),
  assert = require("assert"),
  request = require("request"),
  canvas = require("../models/canvas"),
  lti = require("ims-lti"),
  RedisNonceStore = require("../node_modules/ims-lti/lib/redis-nonce-store.js"),
  redis = require("redis"),
  redis_client = redis.createClient(config.redisURL),
  store = new RedisNonceStore(config.client_id, redis_client);

if (!provider) {
  console.log("Generating new provider...");
  var provider = new lti.Provider(config.client_id, config.client_secret);
  console.log("Provider generated.");
}

// Set the configuration settings
let credentials = {
  client: {
    id: config.client_id,
    secret: config.client_secret,
  },
  auth: {
    tokenHost: config.canvasURL,
    tokenPath: "login/oauth2/token",
    authorizePath: "login/oauth2/auth",
  },
};

let oauth2 = require("simple-oauth2").create(credentials);

//queue to callback Auth Token (prevents multiple calls)
var authTokenQueue = new Queue(function (user_id, callback) {
  console.log("Redis Key");
  console.log("token_" + String(user_id));
  redis_client.get("token_" + String(user_id), async function (err, token_string) {
    if (err) {
      console.log(err);
      callback(false);
    } else {
      token_obj = JSON.parse(token_string);
      let accessToken = await oauth2.accessToken.create(token_obj.token);
      // Check if the token is expired. If expired it is refreshed.
      if (accessToken.expired()) {
        try {
          // save refresh token to add later
          let refresh_token = accessToken.token.refresh_token;
          // get new access token from Canvas API
          accessToken = await accessToken.refresh(credentials.client);
          // add back the previous refresh token to use again
          accessToken.token.refresh_token = refresh_token;
          // save new access token to Redis store
          redis_client.set("token_" + String(user_id), JSON.stringify(accessToken));
          callback(accessToken.token.access_token);
        } catch (error) {
          console.log("Error refreshing access token: ", error.message);
          callback(false);
        }
      } else {
        callback(accessToken.token.access_token);
      }
    }
  });
});

//path for oauth2 callback from Canvas server
var oath2_callback = async function (req, res, next) {
  let code = req.query.code;
  let options = { code };
  console.log(options);
  try {
    let result = await oauth2.authorizationCode.getToken(options); // create new access token from Canvas API
    let accessToken = await oauth2.accessToken.create(result);
    redis_client.set("token_" + req.query.state, JSON.stringify(accessToken)); // save access token to Redis
    return res.redirect("/home?login_success=1");
  } catch (e) {
    console.log("Auth failed in /bin/auth.js/oauth2_callback", e);
    return res.status(500).send("Authentication failed in oauth2_callback.");
  }
};

//middleware to update course information
var updateCookies = function (req, res, next) {
  // Manages cookies for other pages
  if (req.body.custom_canvas_course_id && req.query.login_success != 1) {
    console.log(`Validating access to course ${req.body.custom_canvas_course_id}`);
    if (typeof req.session.course_id !== Object) req.session.course_id = {};
    req.session.course_id[req.body.custom_canvas_course_id] = req.body.context_title;
    req.session.user_id = req.body.custom_canvas_user_id;
    req.session.admin =
      req.body.roles.includes("Instructor") ||
      req.body.roles.includes("TeachingAssistant") ||
      req.body.roles.includes("Administrator") ||
      req.body.roles.includes("ContentDeveloper"); // Mark either Teachers or TAs as admins, which enables them to modify certain things in the Admin Panel
    next();
  } else if (!req.session.course_id) {
    console.log("ERROR: COOKIES NOT SET");
    res.status(500).render("cookieError");
  } else {
    next();
  }
};

//middleware to check user and launch lti
var checkUser = function (req, res, next) {
  console.log("", req.session.course_id);
  if (req.session.course_id) {
    req.connection.encrypted = true;
    if (req.query.login_success == "1") {
      next();
    } else {
      provider.valid_request(req, function (err, is_valid) {
        // Request is INVALID iff the provider expressed invalidity and we're not in development mode
        if (!is_valid && process.env.NODE_ENV !== "development") {
          res.status(401).send("401 - Unauthorized. User was unable to be authorized by Canvas");
        } else {
          //check if auth token already exists in Redis
          console.log("Redis Key (Check User)");
          console.log("token_" + String(req.session.user_id));
          redis_client.exists("token_" + String(req.session.user_id), function (err, token_exists) {
            if (token_exists == 0) {
              let authorizationUri = oauth2.authorizationCode.authorizeURL({
                // generate auth token
                redirect_uri: config.redirectURL,
                state: String(req.session.user_id),
              });
              res.redirect(authorizationUri);
            } else next(); // auth token exists
          });
        }
      });
    }
  } else {
    console.log("No course ID cookie");
    res.status(500).send("Course ID cookie was not set");
  }
};

const userExists = async function (req, res, next) {
  try {
    assert(req.session.course_id);
    assert(req.session.user_id);
    const user = await mongo.findUser(Object.keys(req.session.course_id)[0], req.session.user_id);

    // If user does not exist in MongoDB, create user
    if (!user || Object.keys(user).length !== 6)
      await mongo.initUser(Object.keys(req.session.course_id)[0], req.session.user_id);

    if (!user || user.team === "") {
      // e.g [{name: "Test1", students: [...]}, {name: "Test2", students: [...]}]
      const sections = await canvas.getSections(
        Object.keys(req.session.course_id)[0],
        "include=students"
      );
      // Find section with user in it
      const userSection = sections.find(
        (section) =>
          section.students && // Check not null
          section.students.find(
            (student) => student.id.toString() === req.session.user_id.toString()
          )
      );
      if (typeof userSection !== "undefined") {
        await mongo.updateUserProgressField(
          Object.keys(req.session.course_id)[0],
          req.session.user_id,
          "$set",
          "team",
          userSection.name
        );
        console.log(
          `User ${req.session.user_id} created in ${Object.keys(req.session.course_id)[0]}`
        );
      } else console.log("User not in a section");
    }
  } catch (e) {
    console.log(e);
    res
      .status(406)
      .send(
        "Could not process request. Try refreshing the page or contact your Canvas instructor for help."
      );
  }
  next();
};

module.exports = {
  oath2_callback,
  updateCookies,
  authTokenQueue,
  checkUser,
  userExists,
};
