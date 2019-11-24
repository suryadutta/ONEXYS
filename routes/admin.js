const router = require("express").Router(),
      mongo = require("../models/mongo"),
      canvas = require("../models/canvas"),
      config = require('../bin/config'),
      auth = require("../bin/auth"),
      assert = require('assert');

function requireAdmin(req, res, next) {
    if(req.session.admin) next();
    else res.redirect("/home");
}

router.get("/homepageEdit", (req, res) => {
    res.render("admin/homepageEdit", {
        heroku: config.herokuAppName,
    })
});

router.get("/navigation", (req, res) => {
    res.render("admin/navigation", {
        heroku: config.herokuAppName,
    });
});

router.get("/modules", (req, res) => {
    res.send("This page has not yet been implemented.");
    // res.render("admin/modules", {
    //     heroku: config.herokuAppName,
    // });
});

router.get("/badges", (req, res) => {
    res.render("admin/badges", {
        heroku: config.herokuAppName,
    });
});

router.get("/badges/edit/:id", (req, res) => {
    res.render("admin/badgeEdit", {
        heroku: config.herokuAppName,
        id: req.params.id
    })
});

router.get("/dailyTasks", (req, res) => {
    res.send("This page has not yet been implemented.");
});

router.get("/luckyBonuses", (req, res) => {
    res.send("This page has not yet been implemented.");
});

router.get("/unifiedGradebook", (req, res) => {
    res.send("This page has not yet been implemented.");
});

router.post("/", (req, res) => {
    res.redirect("/admin");
});

router.get("/", (req, res) => {
    res.render("admin/index");
});

module.exports = {
    router,
    requireAdmin,
};
