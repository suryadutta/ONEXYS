if (process.env.NODE_ENV !== "production") {
  require("dotenv").load();
}

const express = require("express"),
  config = require("./bin/config"),
  redis = require("redis").createClient(config.redisURL),
  modules = require("./routes/modules"),
  session = require("express-session"),
  canvas = require("./models/canvas"),
  bodyParser = require("body-parser"),
  index = require("./routes/index"),
  admin = require("./routes/admin"),
  mongo = require("./models/mongo"),
  api = require("./routes/api"),
  auth = require("./bin/auth"),
  assert = require("assert"),
  http = require("http");
require("./bin/cron"); // initialize cron jobs
app = express();

app.set("port", process.env.PORT || "3000");
app.set("view engine", "pug");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.set("trust proxy", true);

app.use(
  session({
    cookieName: "session",
    secret: config.client_secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      path: "/",
      sameSite: "none",
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use("/api", api);
app.use("/admin", [auth.updateCookies, auth.checkUser, admin.requireAdmin], admin.router);
app.use("/modules", modules);
app.get("/callback", auth.oath2_callback);
app.use("/", index);

redis.on("ready", (success) => {
  console.log("Redis is ready");
});

redis.on("error", (err) => {
  console.log("Redis error:", err);
});

var server = http.createServer(app);
mongo.client.connect((err) => {
  assert(!err);
  console.log("Mongo is ready");
  server.listen(process.env.PORT || "3000");
});
