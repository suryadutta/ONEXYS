const router = require("express").Router();
const mongo = require("../models/mongo");

/* GET home page. */
router.get("/", (req, res, next) => {
  res.render("admin", {
    title: "Express",
    course_title: req.session.course_title,
    course_id: req.session.course_id,
    user_id: req.session.user_id
  });
});

/* POST home page. */
router.post("/", (req, res, next) => {
  res.render("admin", {
    title: "Express",
    course_title: req.session.course_title,
    course_id: req.session.course_id,
    user_id: req.session.user_id
  });
});

//Get Home Page Updates
router.get("/home", (req, res, next) => {
  mongo.getHomeContent(req.session.course_id,(err, home_updates, home_vids) => {
    res.render("admin/home", {
      title: "home",
      course_title: req.session.course_title,
      course_id: req.session.course_id,
      user_id: req.session.user_id,
      home_updates,
      home_vids
    });
  });
});

//Go back to home page with recent edits
router.post("/home", (req, res, next) => {
  mongo.getHomeContent(req.session.course_id,(err, home_updates, home_vids) => {
    res.render("admin/home", {
      title: "home",
      course_title: req.session.course_title,
      course_id: req.session.course_id,
      user_id: req.session.user_id,
      home_updates: req.body,
      home_vids
    });
  });
});

//Preview Home Page Updates
router.post("/home/preview", (req, res, next) => {
  res.render('admin/homeConfirmUpdates', {
    course_title: req.session.course_title,
    course_id: req.session.course_id,
    user_id: req.session.user_id,
    home_updates: req.body
  })
});

//Update changes to MongoDB
router.post("/home/confirmUpdates", (req, res, next) => {
  mongo.updateData(req.session.course_id,"home", { type: "updates" }, req.body, (err, result) => {
    res.redirect("/admin");
  });
});

//add home video
router.get("/home/videos/add", (req, res, next) => {
  res.render("admin/homeVidAdd", {
    title: "Add Home Video",
    course_title: req.session.course_title,
    course_id: req.session.course_id,
    user_id: req.session.user_id,
  });
});

//add home video
router.post("/home/videos/add", (req, res, next) => {
  vidData = req.body;
  vidData._id = makeid();
  vidData.type = "video";
  mongo.insertData(req.session.course_id,"home", vidData, (err, result) => {
    res.redirect("/admin/home");
  });
});

//edit home video
router.get("/home/videos/edit/:id", (req, res, next) => {
  mongo.getHomeContent(req.session.course_id,(err, home_updates, home_vids) => {
    home_vid = home_vids.find(video => video._id == req.params.id);
    if (home_vid) {
      res.render("admin/homeVidEdit", {
        title: "Edit Home Video",
        course_title: req.session.course_title,
        course_id: req.session.course_id,
        user_id: req.session.user_id,
        video: home_vid
      });
    } else {
      res.send("ERROR: Video Not Found");
    }
  });
});

//POST handler to edit home video
router.post("/home/videos/edit/:id", (req, res, next) => {
  home_vid = req.body
  home_vid._id = req.params.id
  res.render("admin/homeVidEdit", {
    title: "Edit Home Video",
    course_title: req.session.course_title,
    course_id: req.session.course_id,
    user_id: req.session.user_id,
    video: home_vid
  });
});

//POST handler to preview video changes
router.post('/home/videos/preview/:id', (req,res,next) => {
  res.render("admin/homeConfirmVideos", {
    title: "Edit Home Video",
    course_title: req.session.course_title,
    course_id: req.session.course_id,
    user_id: req.session.user_id,
    video: req.body,
    video_id: req.params.id
  });
});

//POST handler to confirm videos updates
router.post("/home/videos/confirmUpdates/:id", (req, res, next) => {
  mongo.updateData(req.session.course_id, "home", { _id: req.params.id }, req.body, (err, result) => {
    res.redirect("/admin/home");
  });
});

//delete home video
router.post("/home/videos/delete/:id", (req, res, next) => {
  mongo.deleteData(req.session.course_id, "home", { _id: req.params.id }, (err, result) => {
    res.redirect("/admin/home");
  });
});

//Get Modules Home Page (Table of all modules + edit buttons)
router.get("/modules", (req, res, next) => {
  mongo.getModules(req.session.course_id, (err, modulesInfo, post_test) => {
    res.render("admin/modules", {
      title: "Modules",
      course_title: req.session.course_title,
      course_id: req.session.course_id,
      user_id: req.session.user_id,
      modules: modulesInfo,
      post_test: post_test
    });
  });
});

//Get Page to Edit Module Content
router.get("/modules/:id/edit", (req, res, next) => {
  mongo.getModule(req.session.course_id,req.params.id, (err, moduleInfo) => {
    res.render("admin/moduleEdit", {
      title: "Edit Module",
      course_title: req.session.course_title,
      course_id: req.session.course_id,
      user_id: req.session.user_id,
      module: moduleInfo
    });
  });
});

router.post("/modules/:id/edit", (req, res, next) => {
  var bodyInfo = req.body;
  mongo.getModule(req.session.course_id,req.params.id, (err, moduleInfo) => {
    merged_data = Object.assign(moduleInfo,bodyInfo);
    res.render('admin/moduleEdit', {
      title: "Edit Module",
      course_title: req.session.course_title,
      course_id: req.session.course_id,
      user_id: req.session.user_id,
      module: merged_data,
    });
  });
});

//POST handler for Previewing Module Edits
router.post("/modules/:id/preview", (req, res, next) => {
  var bodyInfo = req.body;
  mongo.getModule(req.session.course_id,req.params.id, (err, moduleInfo) => {
    merged_data = Object.assign(moduleInfo,bodyInfo)
    res.set('X-XSS-Protection', 0);
    res.render('admin/moduleConfirmUpdate', {
      course_title: req.session.course_title,
      course_id: req.session.course_id,
      user_id: req.session.user_id,
      data: merged_data,
    });
  });
});

//POST handler for Module Edits
router.post("/modules/:id/confirmUpdates", (req, res, next) => {
  mongo.updateData(
    req.session.course_id,
    "modules",
    { _id: parseInt(req.params.id) },
    req.body,
    (err, result) => {
      res.redirect("/admin/modules");
    }
  );
});

//GET page to add video to module
router.get("/modules/:id/videos/add", (req, res, next) => {
  res.render("admin/moduleVideoAdd", {
    course_title: req.session.course_title,
    course_id: req.session.course_id,
    user_id: req.session.user_id,
    moduleID: req.params.id
  });
});


//generate ID for new video entries
const makeid = () => {
  const POSSIBLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const TEXTLENGTH = 16;
  let text = "";
  let i = 0;
  for (i = 0; i < TEXTLENGTH; i++) {
    text += POSSIBLE.charAt(Math.floor(Math.random() * POSSIBLE.length));
  }
  return text;
};

//POST handler to add video to module
router.post("/modules/:id/videos/add", (req, res, next) => {
  vidObject = req.body;
  vidObject._id = makeid();
  mongo.getModule(req.session.course_id,req.params.id, (err, moduleInfo) => {
    //set position of new video to 1+(POSITION OF LAST VIDEO)
    vidObject.position =
      moduleInfo.videos[moduleInfo.videos.length - 1].position + 1;
    moduleInfo.videos.push(vidObject);
    mongo.updateData(
      req.session.course_id,
      "modules",
      { _id: parseInt(req.params.id) },
      moduleInfo,
      (err, result) => {
        res.redirect("/admin/modules/" + req.params.id + "/edit");
      }
    );
  });
});

//GET page to edit video from module
router.get("/modules/:module_id/videos/edit/:video_id", (req, res, next) => {
  mongo.getModule(req.session.course_id, req.params.module_id, (err, moduleInfo) => {
    vidObject = moduleInfo.videos.find(
      video => video._id == req.params.video_id
    );
    res.render("admin/moduleVideoEdit", {
      title: "Edit Module Video",
      course_title: req.session.course_title,
      course_id: req.session.course_id,
      user_id: req.session.user_id,
      moduleID: req.params.module_id,
      video: vidObject
    });
  });
});

//POST handler to edit video from module
router.post("/modules/:module_id/videos/edit/:video_id", (req, res) => {
  mongo.getModule(req.session.course_id, req.params.module_id, (err, moduleInfo) => {
    vid_index = moduleInfo.videos.findIndex(
      video => video._id == req.params.video_id
    );
    vidObject = req.body;
    vidObject._id = req.params.video_id;
    vidObject.position = moduleInfo.videos[vid_index].position;
    moduleInfo.videos[vid_index] = vidObject;
    mongo.updateData(
      req.session.course_id,
      "modules",
      { _id: parseInt(req.params.module_id) },
      moduleInfo,
      (err, result) => {
        res.redirect("/admin/modules/" + req.params.module_id + "/edit");
      }
    );
  });
});

//POST handler to delete video from module
router.post("/modules/:module_id/videos/delete/:video_id", (req, res) => {
  mongo.getModule(req.session.course_id, req.params.module_id, (err, moduleInfo) => {
    vid_index = moduleInfo.videos.findIndex(
      video => video._id == req.params.video_id
    );
    if (vid_index > -1) {
      moduleInfo.videos.splice(vid_index, 1);
    }
    mongo.updateData(
      req.session.course_id,
      "modules",
      { _id: parseInt(req.params.module_id) },
      moduleInfo,
      (err, result) => {
        res.redirect("/admin/modules/" + req.params.module_id + "/edit");
      }
    );
  });
});

router.get("/badges", (req, res, next) => {
  mongo.getData(req.session.course_id, "badges", (err, badges_data) => {
    res.render("admin/badges", {
      title: "Badges",
      course_title: req.session.course_title,
      course_id: req.session.course_id,
      user_id: req.session.user_id,
      badges: badges_data
    });
  });
});

router.get("/badges/edit/:id", (req, res, next) => {
  mongo.getData(req.session.course_id,"badges", (err, badges_data) => {
    badge_data = badges_data.find(element => element._id == req.params.id);
    res.render("admin/badgeEdit", {
      title: "Badges",
      course_title: req.session.course_title,
      course_id: req.session.course_id,
      user_id: req.session.user_id,
      badge: badge_data
    });
  });
});

router.post("/badges/edit/:id", (req, res, next) => {
  //update badges info
  mongo.updateData(
    req.session.course_id,
    "badges",
    { _id: parseInt(req.params.id) },
    {
      Title: req.body.title,
      Description: req.body.description,
      Points: req.body.badge_points,
      Portrait: req.body.portrait,
      PortraitDescription: req.body.portraitdescription,
      UnearnedURL: req.body.unearned_url,
      EarnedURL: req.body.earned_url,
      EarnedHoverURL: req.body.earned_hover_url
    },
    (err, result) => {
      res.redirect("/admin/badges");
    }
  );
});

router.get("/dailies", (req, res, next) => {
  mongo.getData(req.session.course_id, "dailies", (err, dailies_data) => {
    res.render("admin/dailies", {
      title: "Dailies",
      course_title: req.session.course_title,
      course_id: req.session.course_id,
      user_id: req.session.user_id,
      dailies: dailies_data
    });
  });
});

router.get("/dailies/edit/:id", (req, res, next) => {
  mongo.getData(req.session.course_id, "dailies", (err, dailies_data) => {
    daily_data = dailies_data.find(element => element._id == req.params.id);
    res.render("admin/dailyEdit", {
      title: "Dailies",
      course_title: req.session.course_title,
      course_id: req.session.course_id,
      user_id: req.session.user_id,
      daily: daily_data
    });
  });
});

router.post("/dailies/edit/:id", (req, res, next) => {
  //update badges info
  mongo.updateData(
    req.session.course_id,
    "dailies",
    { _id: parseInt(req.params.id) },
    {
      assignment_id: req.body.assignment_id,
    },
    (err, result) => {
      res.redirect("/admin/dailies");
    }
  );
});

router.get("/lucky", (req, res, next) => {
  mongo.getData(
    req.session.course_id,
    "lucky_bulldogs", (err, lucky_data) => {
    res.render("admin/lucky", {
      title: "Lucky Bulldog",
      course_title: req.session.course_title,
      course_id: req.session.course_id,
      user_id: req.session.user_id,
      lucky_data: lucky_data
    });
  });
});

router.get("/lucky/edit/:id", (req, res, next) => {
  mongo.getData(req.session.course_id,"lucky_bulldogs", (err, lucky_data) => {
    lucky_bonus = lucky_data.find(x => x._id == req.params.id);
    res.render("admin/luckyEdit", {
      title: "Lucky Bonus",
      course_title: req.session.course_title,
      course_id: req.session.course_id,
      user_id: req.session.user_id,
      lucky_bonus: lucky_bonus,
      id: req.params.id
    });
  });
});

router.post("/lucky/edit/:id", (req, res, next) => {
  mongo.updateData(
    req.session.course_id,
    "lucky_bulldogs",
    { _id: parseInt(req.params.id) },
    { time: req.body.date_time },
    (err, result) => {
      res.redirect("/admin/lucky");
    }
  );
});

router.post("/lucky/delete/:id", (req, res, next) => {
  mongo.deleteData(
    req.session.course_id,
    "lucky_bulldogs",
    { _id: parseInt(req.params.id) },
    (err, result) => {
      res.redirect("/admin/lucky");
    }
  );
});

router.get("/lucky/add", (req, res, next) => {
  res.render("admin/luckyAdd", {
    title: "Lucky Bonuses",
    course_title: req.session.course_title,
    course_id: req.session.course_id,
    user_id: req.session.user_id,
  });
});

router.post("/lucky/add", (req, res, next) => {
  mongo.getData(req.session.course_id,"lucky_bulldogs", (err, lucky_data) => {
    if (lucky_data.length > 0) {
      new_id = Math.max(lucky_data.map(data => data._id)) + 1;
    } else {
      new_id = 1;
    }
    mongo.insertData(
      req.session.course_id,
      "lucky_bulldogs",
      {
        _id: new_id,
        time: req.body.date_time,
        awarded_ids: []
      },
      (err, result) => {
        res.redirect("/admin/lucky");
      }
    );
  });
});

module.exports = router;
