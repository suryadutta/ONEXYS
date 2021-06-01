const router = require("express").Router(),
  mongo = require("../models/mongo"),
  canvas = require("../models/canvas"),
  config = require("../bin/config"),
  async = require("async"),
  assert = require("assert");

// Set return headers to prevent XSS data leakage
const access = "Access-Control-Allow-Origin";
function getDst(hostname) {
  return `https://${hostname}`;
}

function authorize(req) {
  if (req.query.courseID === "" && config.NODE_ENV === "development") {
    req.body.courseID = "3559";
    req.query.courseID = "3559";
    req.session.course_id[3559] = "CONEX Development Course";
  }
}

router.get("/authorize/getCourseTitle", (req, res) => {
  try {
    authorize(req);
    assert(req.query.hostname);
    assert(req.query.courseID);
    assert(req.session.course_id);
    let title = req.session.course_id[req.query.courseID];
    if (title) res.status(200).header(access, getDst(req.query.hostname)).send(title);
    else
      res
        .status(403)
        .send("403 - Forbidden. You have not been authorized to access that courseID.");
  } catch (e) {
    console.log(e);
    res.status(400).send("400 - Bad Request.");
  }
});

// Retrieves home update information
/** Requires the following input:
 * @hostname
 * @courseID
 **/
router.get("/home/updates", (req, res) => {
  if (!req.session.user_id)
    res.status(403).send("403 - Forbidden. You must be logged in to make this request.");
  else {
    try {
      authorize(req);
      assert(Object.keys(req.session.course_id).includes(req.query.courseID)); // prevent cross track cookie usage
      assert(req.query.hostname);
      async.parallel(
        [
          async.reflect((callback) => {
            mongo.getHomepageUpdates(req.query.courseID, (err, data) => {
              callback(err, data);
            });
          }),
          async.reflect((callback) => {
            canvas.getDailyTask(req.query.courseID, (err, data) => {
              callback(null, data);
            });
            //callback(null, {id: 123});
          }),
        ],
        (err, data) => {
          if (err)
            res.status(500).send("500 - Internal Server Error. Home data could not be retrieved.");
          else
            res.status(200).header(access, getDst(req.query.hostname)).send({
              updates: data[0].value,
              daily: data[1].value,
            });
        }
      );
    } catch (e) {
      console.log("E", e);
      res.status(406).send("406 - Your request could not be processed.");
    }
  }
});

router.get("/home/videos", (req, res) => {
  if (!req.session.user_id)
    res.status(403).send("403 - Forbidden. You must be logged in to make this request.");
  else {
    try {
      authorize(req);
      assert(Object.keys(req.session.course_id).includes(req.query.courseID)); // prevent cross track cookie usage
      assert(req.query.hostname);
      mongo.getHomepageVideos(req.query.courseID, (err, data) => {
        if (err)
          res.status(500).send("500 - Internal Server Error. Home data could not be retrieved.");
        else res.status(200).header(access, getDst(req.query.hostname)).send(data);
      });
    } catch (e) {
      console.log(e);
      res.status(406).send("406 - Your request could not be processed.");
    }
  }
});

router.get("/modules", (req, res) => {
  if (!req.session.user_id)
    res.status(403).send("403 - Forbidden. You must be logged in to make this request.");
  else {
    try {
      authorize(req);
      assert(Object.keys(req.session.course_id).includes(req.query.courseID)); // prevent cross track cookie usage
      assert(req.query.hostname);
      mongo.getModules(req.query.courseID, (err, data) => {
        if (err)
          res.status(500).send("500 - Internal Server Error. Home data could not be retrieved.");
        else res.status(200).header(access, getDst(req.query.hostname)).send(data);
      });
    } catch (e) {
      console.log(e);
      res.status(406).send("406 - Your request could not be processed.");
    }
  }
});

router.get("/progress", (req, res) => {
  if (!req.session.user_id)
    res.status(403).send("403 - Forbidden. You must be logged in to make this request.");
  else {
    try {
      authorize(req);
      assert(Object.keys(req.session.course_id).includes(req.query.courseID)); // prevent cross track cookie usage
      assert(req.query.hostname);
      mongo.getProgress(req.query.courseID, (err, data) => {
        if (err)
          res.status(500).send("500 - Internal Server Error. Home data could not be retrieved.");
        else res.status(200).header(access, getDst(req.query.hostname)).send(data);
      });
    } catch (e) {
      console.log(e);
      res.status(406).send("406 - Your request could not be processed.");
    }
  }
});

router.get("/dailies", (req, res) => {
  if (!req.session.user_id)
    res.status(403).send("403 - Forbidden. You must be logged in to make this request.");
  else {
    try {
      authorize(req);
      assert(Object.keys(req.session.course_id).includes(req.query.courseID)); // prevent cross track cookie usage
      assert(req.query.hostname);
      mongo.getDailyTasks(req.query.courseID, (err, data) => {
        if (err)
          res.status(500).send("500 - Internal Server Error. Home data could not be retrieved.");
        else res.status(200).header(access, getDst(req.query.hostname)).send(data);
      });
    } catch (e) {
      console.log(e);
      res.status(406).send("406 - Your request could not be processed.");
    }
  }
});

router.get("/lucky", (req, res) => {
  if (!req.session.user_id)
    res.status(403).send("403 - Forbidden. You must be logged in to make this request.");
  else {
    try {
      authorize(req);
      assert(Object.keys(req.session.course_id).includes(req.query.courseID)); // prevent cross track cookie usage
      assert(req.query.hostname);
      mongo.getLuckyBonuses(req.query.courseID, (err, data) => {
        if (err)
          res.status(500).send("500 - Internal Server Error. Home data could not be retrieved.");
        else res.status(200).header(access, getDst(req.query.hostname)).send(data);
      });
    } catch (e) {
      console.log(e);
      res.status(406).send("406 - Your request could not be processed.");
    }
  }
});

router.use("/badges", (req, res) => {
  if (!req.session.user_id) {
    console.log("id :" + req.session.user_id);
    res.status(403).send("403 - Forbidden. You must be logged in to make this reques");
  } else {
    try {
      authorize(req);
      assert(Object.keys(req.session.course_id).includes(req.query.courseID)); // prevent cross track cookie usage
      assert(req.query.hostname);
      mongo.getBadges(req.query.courseID, (err, data) => {
        console.log(data);
        if (err)
          res.status(500).send("500 - Internal Server Error. Home data could not be retrieved.");
        else res.status(200).header(access, getDst(req.query.hostname)).send(data);
      });
    } catch (e) {
      console.log(e);
      res.status(406).send("406 - Your request could not be processed.");
    }
  }
});

router.get("/users/progress", (req, res) => {
  if (!req.session.user_id)
    res.status(403).send("403 - Forbidden. You must be logged in to make this request.");
  else {
    try {
      authorize(req);
      assert(Object.keys(req.session.course_id).includes(req.query.courseID)); // prevent cross track cookie usage
      assert(req.query.hostname);
      mongo.getUserProgress(req.query.courseID, req.session.user_id, (err, data) => {
        if (err)
          res.status(500).send("500 - Internal Server Error. Home data could not be retrieved.");
        else res.status(200).header(access, getDst(req.query.hostname)).send(data);
      });
    } catch (e) {
      console.log(e);
      res.status(406).send("406 - Your request could not be processed.");
    }
  }
});

router.get("/navigation", (req, res) => {
  if (!req.session.user_id)
    res.status(403).send("403 - Forbidden. You must be logged in to make this request.");
  else {
    try {
      authorize(req);
      assert(Object.keys(req.session.course_id).includes(req.query.courseID)); // prevent cross track cookie usage
      assert(req.query.hostname);
      mongo.getNavigationData(req.query.courseID, (err, data) => {
        if (err)
          res.status(500).send("500 - Internal Server Error. Home data could not be retrieved.");
        else res.status(200).header(access, getDst(req.query.hostname)).send(data);
      });
    } catch (e) {
      console.log(e);
      res.status(406).send("406 - Your request could not be processed.");
    }
  }
});

router.get("/webhooks/create", (req, res) => {
  canvas.registerWebhook(3559, (err, body) => {
    //console.log("Body", body);
    res.send(body);
  });
});

// Access static information about the given site (track)
router.get("/site-info", (req, res) => {
  try {
    assert(req.query.hostname); // Verify hostname exists
    assert(/^\d+$/.test(req.query.course)); // Verify course number exists and is valid
    mongo.getCourseInfo({ hostname: req.query.hostname, course: req.query.course }, (err, data) => {
      if (err)
        res.status(500).send("Encountered a database error. Information could not be retrieved.");
      else
        res
          .status(200)
          .header("Access-Control-Allow-Origin", "https://" + req.query.hostname)
          .send(data);
    });
  } catch (e) {
    console.log(e);
    res.status(500).send("API request could not be processed.");
  }
});

/////////////////////////////////////////////////////////////////////////////////////////
// ADMIN PANEL ROUTES
// / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / / /

// Update homepage data
const validHomeElements = [
  "main_header",
  "main_text",
  "header2",
  "text2",
  "header3",
  "text3",
  "badges_link",
  "daily_task_img",
  "post_test",
  "post_test_filename",
  "pre_test_button_background",
  "post_test_button_background",
  "life_on_grounds_link",
  "life_on_grounds_title",
  "life_on_grounds_thumbnail",
];

router.post("/admin/updateHome", (req, res) => {
  if (req.session.admin) {
    try {
      authorize(req);
      assert(Object.keys(req.session.course_id).includes(req.body.courseID));
      assert(validHomeElements.includes(req.body.field));
      assert(req.body.value);
      mongo.updateHomepageUpdates(req.body.courseID, req.body.field, req.body.value, (err) => {
        if (err) res.status(500).send("500. Update failed.");
        else res.status(200).send("200 - OK. Update succeeded.");
      });
    } catch (e) {
      console.log(e);
      res.status(406);
      res.send("406 - Not acceptable. You must provide a valid field and a value.");
    }
  } else res.status(403).send("403 - Forbidden. You are not authorized to make requests here.");
});

// AJAX uses this route to dynamically apply video reordering support
router.post("/admin/updateVideo", (req, res) => {
  if (req.session.admin) {
    try {
      authorize(req);
      assert(Object.keys(req.session.course_id).includes(req.body.courseID));
      assert(/[A-Z\d]{16}/.test(req.body.id)); // IDs must be a 16 character alphanumeric string
      assert(/\d+/.test(req.body.position)); // Positions consist at least 1 digit, and nothing else
      assert(/.+/.test(req.body.description)); // Description must be provided
      assert(/.*/.test(req.body.thumbnail)); // Thumbnail may not be provided
      // res.send("pass"); return;

      mongo.updateVideo(
        req.body.courseID,
        req.body.id,
        {
          src: req.body.src,
          description: req.body.description,
          thumbnail: req.body.thumbnail,
          position: parseInt(req.body.position),
        },
        (err) => {
          if (err)
            res
              .status(500)
              .send("500 - Internal Server Error. Encountered error saving video info.");
          else res.status(200).send("200 - OK");
        }
      );
    } catch (e) {
      res
        .status(406)
        .send(
          "406 - Not acceptable. You must provide body arguments 'id' (a 16 character alphanumberic string) and 'position' (an integer / string consisting of at least 1 digit and nothing else). " +
            e
        );
    }
  } else res.status(403).send("403 - Forbidden. You are not authorized to make requests here.");
});

router.post("/admin/updateVideoDefaults", (req, res) => {
  if (req.session.admin) {
    try {
      authorize(req);
      assert(/https?:\/\/.*/.test(req.body.thumbnail)); // Verify some sort of url-ness
      assert(/https?:\/\/.*/.test(req.body.playbutton)); // ''

      mongo.updateData(
        req.session.course_id,
        "home",
        { type: "all_vids" },
        {
          thumbnail: req.body.thumbnail,
          playbutton: req.body.playbutton,
        },
        (err, result) => {
          if (err)
            res
              .status(500)
              .send("500 - Internal Server Error. Encountered error saving video info.");
          else res.status(200).send("200 - OK");
        }
      );
    } catch (e) {
      res
        .status(400)
        .send(
          "400 - Bad request. You must provide body arguments 'thumbnail' and 'playbutton', both strings, which are URLs to image assets."
        );
    }
  } else res.status(403).send("403 - Forbidden. You are not authorized to make requests here.");
});

// AJAX uses this route to dynamically open/close and mark modules as due
// TODO: refactor to remove :id
router.post("/admin/updateModule/:id", (req, res) => {
  if (req.session.admin) {
    try {
      authorize(req);
      if (req.body.open) assert(/(true|false)/.test(req.body.open)); // Open must be a valid boolean
      if (req.body.due) assert(/(true|false)/.test(req.body.due)); // Due must be a valid boolean
      if (req.body.practice_id_bool) assert(/(true|false)/.test(req.body.practice_id_bool)); // Open must be a valid boolean

      assert(/\d+/.test(parseInt(req.params.id))); // IDs must be an integer
      assert(req.body.primary_title);
      assert(req.body.secondary_title);
      assert(req.body.practice_link);
      assert(req.body.practice_cutoff);
      assert(req.body.multiple_practice_cutoff);
      assert(req.body.quiz_link);
      assert(req.body.quiz_cutoff);
      assert(req.body.reflection_link);
      assert(req.body.background_image);
      assert(req.body.background_name);
      assert(req.body.background_desc);
      assert(req.body.overview);
      assert(req.body.apply_description);
      assert(req.body.apply_read_src);
      assert(req.body.explore);
      assert(req.body.button_background_image);
      assert(req.body.practice_url_redirect);

      let submit = {
        _id: parseInt(req.params.id),
        primary_title: req.body.primary_title,
        secondary_title: req.body.secondary_title,
        practice_link: req.body.practice_link,
        practice_cutoff: req.body.practice_cutoff,
        multiple_practice_cutoff: req.body.multiple_practice_cutoff,
        quiz_link: req.body.quiz_link,
        quiz_cutoff: req.body.quiz_cutoff,
        reflection_link: req.body.reflection_link,
        background_image: req.body.background_image,
        background_name: req.body.background_name,
        background_desc: req.body.background_desc,
        overview: req.body.overview,
        apply_description: req.body.apply_description,
        apply_read_src: req.body.apply_read_src,
        explore: req.body.explore,
        button_background_image: req.body.button_background_image,
        practice_url_redirect: req.body.practice_url_redirect,
        open: req.body.open,
        due: req.body.due,
        practice_id_bool: req.body.practice_id_bool,
      };

      mongo.updateModule(req.body.courseID, submit, (err, data) => {
        if (err) {
          res
            .status(500)
            .send("500 - Internal Server Error. Encountered error saving module info.");
        } else res.status(200).send("200 - OK");
      });
    } catch (e) {
      res
        .status(406)
        .send(
          "406 - Not acceptable. You must provide POST body parameters 'id' (a positive integer), and 'open' and/or 'due' (booleans)."
        );
    }
  } else res.status(403).send("403 - Forbidden. You are not authorized to make requests here.");
});

router.post("/admin/updateModuleVid", (req, res) => {
  if (req.session.admin) {
    try {
      authorize(req);
      assert(req.body.courseID);
      assert(req.body.video_src);
      assert(req.body.video_image_src);
      assert(req.body.video_desc);
      assert(/\d+/.test(req.body.position));
      assert(req.body.videoID);
      assert(req.body.moduleID);

      const submit = {
        video_src: req.body.video_src,
        video_image_src: req.body.video_image_src,
        video_desc: req.body.video_desc,
        video_desc_helper: req.body.video_desc_helper,
        position: parseInt(req.body.position),
        _id: req.body.moduleID,
      };

      mongo.updateModuleVid(
        req.body.courseID,
        submit,
        req.body.moduleID,
        req.body.videoID,
        (err, data) => {
          if (err) {
            res
              .status(500)
              .send("500 - Internal Server Error. Encountered error saving module video info.");
          } else res.status(200).send("200 - OK");
        }
      );
    } catch (e) {
      res
        .status(406)
        .send(
          "406 - Not acceptable. You must provide POST body parameters videoID, moduleID, and video attributes."
        );
    }
  } else res.status(403).send("403 - Forbidden. You are not authorized to make requests here.");
});

// Asynchronously update navigation options
const navigationLocations = ["welcome", "coach_information", "life_on_grounds", "post_test"];
router.post("/admin/updateNavigation", (req, res) => {
  if (req.session.admin) {
    try {
      authorize(req);
      assert(navigationLocations.includes(req.body.location));
      // assert(/https?:\/\/.+/.test(req.body.link)); uncomment after switching to cloud stored files

      mongo.updateNavigation(req.body.courseID, req.body.location, req.body.link, (err) => {
        if (err)
          res.status(500).send("500 - Internal Server Error. Request could not be processed.");
        else res.status(200).send("200 - OK");
      });
    } catch (e) {
      res.status(406);
      res.send(
        "406 - Not acceptable. You must provide POST body parameters 'location' (a valid navigation location), and link (a url)."
      );
    }
  } else res.status(403).send("403 - Forbidden. You are not authorized to make requests here.");
});

router.post("/admin/updateBadge/:id", (req, res) => {
  if (req.session.admin) {
    try {
      req.query.courseID = req.body.courseID;
      authorize(req);
      console.log(Object.keys(req.session.course_id));
      assert(Object.keys(req.session.course_id).includes(req.body.courseID));
      let id = parseInt(req.params.id);
      assert(id > -1 && id < 33); // The ID should be between 0 and 32 (inclusive)
      // If the badge ID (req.params.id) is 32, we need an assignment id also, which should be only digits.
      assert(
        (id !== 32 && !req.body.assignment_id) || (id === 32 && parseInt(req.body.assignment_id))
      );
      assert(req.body.title); // Title should exist
      assert(req.body.description); // Description should exist
      assert(/\d+/.test(req.body.points)); // Points should be only digits.
      assert(req.body.portrait); // Portrait name should exist
      assert(req.body.portraitdescription); // Portrait description should exist
      assert(/https?:\/\/.+/.test(req.body.unearned_url)); // Unearned_url should be a URL
      assert(/https?:\/\/.+/.test(req.body.earned_url)); // Earned_url should be a URL
      assert(/https?:\/\/.+/.test(req.body.earned_hover_url)); // Unearned_hover_url should be a URL

      let submit = {
        _id: id,
        Title: req.body.title,
        Description: req.body.description,
        Points: req.body.points,
        Portrait: req.body.portrait,
        PortraitDescription: req.body.portraitdescription,
        EarnedHoverURL: req.body.earned_hover_url,
        EarnedURL: req.body.earned_url,
        UnearnedURL: req.body.unearned_url,
      };
      if (id === 32) submit.assignment_id = parseInt(req.body.assignment_id);

      mongo.updateBadge(req.sessions.courseID, submit, (err) => {
        if (err)
          res.status(500).send("500 - Internal Server Error. Request could not be processed.");
        else res.status(200).send("200 - OK");
      });
    } catch (e) {
      res.status(406);
      res.send("406 - Not acceptable. You must provide all fields of a badge in POST parameters. ");
      console.log(e);
    }
  } else res.status(403).send("403 - Forbidden. You are not authorized to make requests here.");
});

module.exports = router;
