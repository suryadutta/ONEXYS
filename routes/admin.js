const router = require("express").Router(),
  mongo = require("../models/mongo"),
  canvas = require("../models/canvas"),
  config = require('../bin/config'),
  assert = require('assert');

// AJAX uses this route to dynamically apply video reordering support
router.post('/updateVideo', (req, res) => {
  try {
    assert(/[A-Z\d]{16}/.test(req.body.id)); // IDs must be a 16 character alphanumeric string
    assert(/\d+/.test(req.body.position)); // Positions consist at least 1 digit, and nothing else
    if (req.session.admin) { // If the user is an admin, fulfill the req
      mongo.updateData(req.session.course_id, "home", { type: "video", _id: req.body.id }, { position: parseInt(req.body.position) }, (err, result) => {
        if (err) {
          res.status(500);
          res.send("500 - Internal Server Error. Encountered error saving video info.");
        } else {
          res.status(200);
          res.send("200 - OK");
        }
      });
    } else { // If the user is not an admin, terminate the req with status 401
      res.status(401);
      res.send("401 - Unauthorized. In order to change videos, you must be a system administrator.");
    }
  } catch (e) {
    res.status(406);
    res.send("406 - Not acceptable. You must provide querystring arguments 'id' (a 16 character alphanumberic string) and 'position' (an integer / string consisting of at least 1 digit and nothing else).");
  }
});

// AJAX uses this route to dynamically open/close and mark modules as due
router.post('/updateModule', (req, res) => {

  try {
    assert(/\d+/.test(req.body.id)); // IDs must be an integer

    var updates = {};
    if (req.body.open) {
      assert(/(true|false)/.test(req.body.open)); // Open must be a valid boolean
      updates.open = req.body.open;
    }
    if (req.body.due) {
      assert(/(true|false)/.test(req.body.due)); // Due must be a valid boolean
      updates.due = req.body.due;
    }

    if (req.session.admin) {
      mongo.updateData(req.session.course_id, "modules", { _id: parseInt(req.body.id) }, updates, (err, data) => {
        console.log('/updateModule updates:')
        console.log(updates)
        if (err) {
          res.status(500);
          res.send("500 - Internal Server Error. Encountered error saving module info.");
        } else {
          res.status(200);
          res.send("200 - OK");
        }
      });
    } else {
      res.status(401);
      res.send("401 - Unauthorized. In order to change modules, you must be a system administrator.");
    }
  } catch (e) {
    res.status(406);
    res.send("406 - Not acceptable. You must provide POST body parameters 'id' (a positive integer), and 'open' and/or 'due' (booleans).")
  }
});

//
router.use("/liveview", (req, res, next) => {
  console.log("Loading liveview");
  mongo.getModules(req.session.course_id, (err, modulesInfo, post_test, post_test_filename, post_test_button_background, pre_test_button_background) => {
    res.render("admin/liveview", {
      title: "Live View",
      course_title: req.session.course_title,
      course_id: req.session.course_id,
      user_id: req.session.user_id,
      modules: modulesInfo,
      test_app: config.testApp
    });
  });
});

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
  mongo.getHomeContent(req.session.course_id, (err, home_updates, home_vids) => {
    res.render("admin/home", {
      title: "home",
      course_title: req.session.course_title,
      course_id: req.session.course_id,
      user_id: req.session.user_id,
      home_updates,
      home_vids,
      heroku_app: config.herokuAppName
    });
  });
});

//Go back to home page with recent edits
router.post("/home", (req, res, next) => {
  mongo.getHomeContent(req.session.course_id, (err, home_updates, home_vids) => {
    res.render("admin/home", {
      title: "home",
      course_title: req.session.course_title,
      course_id: req.session.course_id,
      user_id: req.session.user_id,
      home_updates: req.body,
      home_vids,
      heroku_app: config.herokuAppName
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
  });
});

//Update changes to MongoDB
router.post("/home/confirmUpdates", (req, res, next) => {
  mongo.updateData(req.session.course_id, "home", { type: "updates" }, req.body, (err, result) => {
    res.redirect("/admin");
  });
});

//add home video
router.get("/home/videos/add", (req, res, next) => {
  res.render("admin/homeVidAdd", {
    title: "Add Home Video",
    course_title: req.session.course_title,
    course_id: req.session.course_id,
    user_id: req.session.user_id
  });
});

//add home video
router.post("/home/videos/add", (req, res, next) => {
  vidData = req.body;
  vidData._id = makeid();
  vidData.type = "video";
  vidData.position = -1; // New videos will start at the top of the list
  console.log("New video_img: " + vidData.vid_img);
  mongo.insertData(req.session.course_id, "home", vidData, (err, result) => {
    res.redirect("/admin/home");
  });
});

//edit home video
router.get("/home/videos/edit/:id", (req, res, next) => {
  mongo.getHomeContent(req.session.course_id, (err, home_updates, home_vids) => {
    home_vid = home_vids.find(video => video._id == req.params.id);
    if (home_vid) {
      res.render("admin/homeVidEdit", {
        title: "Edit Home Video",
        course_title: req.session.course_title,
        course_id: req.session.course_id,
        user_id: req.session.user_id,
        video: home_vid,
        life_on_grounds_title: req.query.life_on_grounds_title,
        life_on_grounds_thumbnail: req.query.life_on_grounds_thumbnail
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
    video: home_vid,
    life_on_grounds_title: req.query.life_on_grounds_title,
    life_on_grounds_thumbnail: req.query.life_on_grounds_thumbnail
  });
});

//POST handler to preview video changes
router.post('/home/videos/preview/:id', (req, res, next) => {
  res.render("admin/homeConfirmVideos", {
    title: "Edit Home Video",
    course_title: req.session.course_title,
    course_id: req.session.course_id,
    user_id: req.session.user_id,
    video: req.body,
    video_id: req.params.id,
    heroku_app: config.herokuAppName
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

//Get Navigation page
router.get("/navigation", (req, res, next) => {
  mongo.getNavigationData(req.session.course_id, (err, nav_info) => {
    res.render("admin/navigation", {
      title: "Navigation",
      course_title: req.session.course_title,
      course_id: req.session.course_id,
      user_id: req.session.user_id,
      nav_info: nav_info
    });
  });
});

//Post Navigation information
router.post("/navigation", (req, res, next) => {
  mongo.updateData(req.session.course_id, "navigation", { type: "navigation" },
    //Build navigation object to be saved in Mongo
    {
      welcome_page: req.body.welcome_page,
      coach_information: req.body.coach_information,
      life_on_grounds: req.body.life_on_grounds,
      post_test: req.body.post_test
    },
    //Redirect user to admin page
    (err, result) => {
      res.redirect("/admin");
    });
});

//Get Modules Home Page (Table of all modules + edit buttons)
router.get("/modules", (req, res, next) => {
  mongo.getModules(req.session.course_id, (err, modulesInfo, post_test, post_test_filename, post_test_button_background, pre_test_button_background) => {
    res.render("admin/modules", {
      title: "Modules",
      course_title: req.session.course_title,
      course_id: req.session.course_id,
      user_id: req.session.user_id,
      modules: modulesInfo,
      post_test: post_test,
      post_test_filename: post_test_filename,
      post_test_button_background: post_test_button_background,
      pre_test_button_background: pre_test_button_background,
      heroku_app: config.herokuAppName,
    });
  });
});

//Post Modules Home Page (for changing if the post-test is available)
router.post("/modules", (req, res, next) => {
  mongo.updateData(req.session.course_id, "navigation", { type: "navigation" }, { post_test: req.body.post_test_filename }, (err, result) => {
    mongo.updateData(req.session.course_id, "home", { type: "updates" }, req.body, (err, result) => {
      res.redirect("/admin");
    });
  });
});

//Get Page to Edit Module Content
router.get("/modules/:id/edit", (req, res, next) => {
  mongo.getModule(req.session.course_id, req.params.id, (err, moduleInfo) => {
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
  mongo.getModule(req.session.course_id, req.params.id, (err, moduleInfo) => {
    merged_data = Object.assign(moduleInfo, bodyInfo);
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
  mongo.getModule(req.session.course_id, req.params.id, (err, moduleInfo) => {
    merged_data = Object.assign(moduleInfo, bodyInfo)
    res.set('X-XSS-Protection', 0);
    res.render('admin/moduleConfirmUpdate', {
      course_title: req.session.course_title,
      course_id: req.session.course_id,
      user_id: req.session.user_id,
      canvas_url: config.canvasURL,
      // This is a duplicate, but the two variables are used for different things
      // and the pug templates are already hard enough to read.
      course_number: req.session.course_id,
      data: merged_data,
    });
  });
});

//POST handler for Module Edits
router.post("/modules/:id/confirmUpdates", (req, res, next) => {
  mongo.updateData(req.session.course_id,
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
  mongo.getModule(req.session.course_id, req.params.id, (err, moduleInfo) => {
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

//get to badge edit from badges list
router.get("/badges/edit/:id", (req, res, next) => {
  mongo.getData(req.session.course_id, "badges", (err, badges_data) => {
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

//Go back to badge edit with recent edits
router.post("/badges/edit/:id", (req, res, next) => {
  res.render("admin/badgeEdit", {
    title: "Badges",
    course_title: req.session.course_title,
    course_id: req.session.course_id,
    user_id: req.session.user_id,
    badge: req.body
  });
});

//go to confirmation page
router.post("/badges/preview", (req, res, next) => {
  res.render("admin/badgeConfirmUpdates", {
    title: "Badges",
    course_title: req.session.course_title,
    course_id: req.session.course_id,
    user_id: req.session.user_id,
    heroku_app: config.herokuAppName,
    badge: req.body
  });
});

//post badge edits
router.post("/badges/confirmUpdates", (req, res, next) => {
  //update badges info
  console.log("Description: " + req.body.Description);
  console.log("Course id: " + req.session.course_id);
  var updates = {
    Title: req.body.Title,
    Description: req.body.Description,
    Points: req.body.Points,
    Portrait: req.body.Portrait,
    PortraitDescription: req.body.PortraitDescription,
    UnearnedURL: req.body.UnearnedURL,
    EarnedURL: req.body.EarnedURL,
    EarnedHoverURL: req.body.EarnedHoverURL
  };
  if (req.body.badge_id == 32) updates.assignment_id = parseInt(req.body.assignment_id);
  mongo.updateData(req.session.course_id, "badges", { _id: parseInt(req.body.badge_id) }, updates, () => {
    res.redirect("/admin/badges");
  }
  );
});

router.get("/dailies", (req, res, next) => {
  mongo.getData(req.session.course_id, "dailies", (err, dailies_data) => {
    // Reset session variables for next time
    var fixed = req.session.fixed_id;
    var last = req.session.last_edited;
    req.session.fixed_id = false;
    req.session.last_edited = -1;

    res.render("admin/dailies", {
      title: "Dailies",
      course_title: req.session.course_title,
      course_id: req.session.course_id,
      user_id: req.session.user_id,
      dailies: dailies_data,
      fixed_id: fixed,
      last_edited: last,
      heroku_app: config.herokuAppName
    });
  });
});

router.get("/dailies/edit/:id", (req, res, next) => {
  mongo.getData(req.session.course_id, "dailies", (err, dailies_data) => {
    daily_data = dailies_data.find(element => element._id == req.params.id);

    // Reset session variables
    req.session.fixed_id = false;
    req.session.last_edited = -1;

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
  var valid_assignment_ids = [];
  var valid_quiz_ids = [];
  canvas.getAdminRequest(canvas.daily_task_url(req.session.course_id), function (err, assignment_list) {
    assignment_list.forEach(function (assignment) {
      valid_assignment_ids.push(parseInt(assignment.id));
      if (assignment.quiz_id != undefined) {
        valid_quiz_ids.push(parseInt(assignment.quiz_id));
      } else {
        valid_quiz_ids.push(-1);
      }
    });

    var fixed_id = false;
    var dex = valid_quiz_ids.indexOf(parseInt(req.body.assignment_id));
    if (dex > -1) {
      req.body.assignment_id = valid_assignment_ids[dex];
      fixed_id = true;
    }

    //update badges info
    mongo.updateData(
      req.session.course_id,
      "dailies",
      { _id: parseInt(req.params.id) },
      {
        assignment_id: req.body.assignment_id,
      },
      (err, result) => {
        req.session.fixed_id = fixed_id;
        req.session.last_edited = parseInt(req.params.id);
        res.redirect("/admin/dailies");
      }
    );
  });
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
  mongo.getData(req.session.course_id, "lucky_bulldogs", (err, lucky_data) => {
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
    {
      time: req.body.date_time,
      point_value: req.body.point_value,
      image_name: req.body.image_name
    },
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
  mongo.getData(req.session.course_id, "lucky_bulldogs", (err, lucky_data) => {
    if (lucky_data.length > 0) {
      // ... is a JS operator which splits array into list of parameters
      // so that it is compatable with Math.max
      new_id = Math.max(...lucky_data.map(data => data._id)) + 1;
    } else {
      new_id = 1;
    }
    mongo.insertData(
      req.session.course_id,
      "lucky_bulldogs",
      {
        _id: new_id,
        time: req.body.date_time,
        point_value: req.body.point_value,
        image_name: req.body.image_name,
        awarded_ids: []
      },
      (err, result) => {
        res.redirect("/admin/lucky");
      }
    );
  });
});

router.get('/gradebook', (req, res, next) => {
  canvas.getGradebook(req.session.course_id, req.session.course_title, (gradebook_data) => {
    res.render("admin/gradebook", {
      title: 'Unified Gradebook',
      course_title: req.session.course_title,
      course_id: req.session.course_id,
      user_id: req.session.user_id,
      gradebook: gradebook_data,
    });
  });
});

module.exports = router;
