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
        
    })
});

router.get("/navigation", (req, res) => {

});

router.get("/modules", (req, res) => {

});

router.get("/badges", (req, res) => {

});

router.get("/dailyTasks", (req, res) => {

});

router.get("/luckyBonuses", (req, res) => {

});

router.get("/unifiedGradebook", (req, res) => {

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
