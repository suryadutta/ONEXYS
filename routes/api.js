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
router.get("/home/updates", async (req, res) => {
  if (!req.session.user_id)
    res.status(403).send("403 - Forbidden. You must be logged in to make this request.");
  else {
    try {
      authorize(req);
      assert(Object.keys(req.session.course_id).includes(req.query.courseID)); // prevent cross track cookie usage
      assert(req.query.hostname);
      const updates = await mongo.getHomepageUpdates(req.query.courseID);
      if (updates) res.status(200).header(access, getDst(req.query.hostname)).send(updates);
      else res.status(500).send("500 - Internal Server Error. Home data could not be retrieved.");
    } catch (e) {
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

router.post("/home/updateLuckyProgress", async (req, res) => {
  try {
    authorize(req);
    assert(req.body.userID);
    assert(req.body.luckyID);
    assert(req.body.lucky_score);
    const userID = req.body.userID;
    const luckyID = req.body.luckyID;
    const lucky_score = req.body.lucky_score;
    await mongo.updateUserProgressField(req.body.courseID, userID, "$set", "badges.27", {
      has: true,
    });
    await mongo.updateUserProgressField(
      req.body.courseID,
      userID,
      "$set",
      "luckies." + parseInt(luckyID),
      {
        has: true,
      }
    );
    await mongo.updateUserProgressField(
      req.body.courseID,
      userID,
      "$inc",
      "score",
      parseInt(lucky_score)
    );

    //}

    res.status(200).send("200 - OK");
  } catch (e) {
    res
      .status(406)
      .send(
        "406 - Not acceptable. You must provide POST body parameters 'id' (a positive integer), a valid date/time, points, and image name"
      );
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

router.get("/dailies", async (req, res) => {
  if (!req.session.user_id)
    res.status(403).send("403 - Forbidden. You must be logged in to make this request.");
  else {
    try {
      authorize(req);
      assert(Object.keys(req.session.course_id).includes(req.query.courseID)); // prevent cross track cookie usage
      assert(req.query.hostname);
      const dailyTasks = await mongo.getDailyTasks(req.query.courseID);
      if (dailyTasks) res.status(200).header(access, getDst(req.query.hostname)).send(dailyTasks);
      else res.status(500).send("500 - Internal Server Error. Home data could not be retrieved.");
    } catch (e) {
      console.log(e);
      res.status(406).send("406 - Your request could not be processed.");
    }
  }
});

router.get("/todaysDaily", async (req, res) => {
  if (req.session.user_id) {
    try {
      authorize(req);
      assert(Object.keys(req.session.course_id).includes(req.query.courseID));
      assert(req.query.hostname);
      const todaysDaily = await mongo.getTodaysDaily(req.query.courseID);
      res.status(200).header(access, getDst(req.query.hostname)).send(todaysDaily);
    } catch (e) {
      console.log(e);
      res.status(406).send("406 - Your request could not be processed.");
    }
  }
});

router.get("/lucky", async (req, res) => {
  if (!req.session.user_id)
    res.status(403).send("403 - Forbidden. You must be logged in to make this request.");
  else {
    try {
      authorize(req);
      assert(Object.keys(req.session.course_id).includes(req.query.courseID)); // prevent cross track cookie usage
      assert(req.query.hostname);
      const luckys = await mongo.getLuckyBonuses(req.query.courseID);
      if (luckys) res.status(200).header(access, getDst(req.query.hostname)).send(luckys);
      else res.status(500).send("500 - Internal Server Error. Home data could not be retrieved.");
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
        if (err)
          res.status(500).send("500 - Internal Server Error. Badges data could not be retrieved.");
        else res.status(200).header(access, getDst(req.query.hostname)).send(data);
      });
    } catch (e) {
      console.log(e);
      res.status(406).send("406 - Your request could not be processed.");
    }
  }
});

router.get("/users/progress", async (req, res) => {
  if (!req.session.user_id)
    res.status(403).send("403 - Forbidden. You must be logged in to make this request.");
  else {
    try {
      authorize(req);
      assert(Object.keys(req.session.course_id).includes(req.query.courseID)); // prevent cross track cookie usage
      assert(req.query.hostname);
      const progress = await mongo.getUserProgress(req.query.courseID, req.session.user_id);
      if (progress) res.status(200).header(access, getDst(req.query.hostname)).send(progress);
      else res.status(500).send("500 - Internal Server Error. Home data could not be retrieved.");
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
      assert(/[A-Z\d]/.test(req.body.id)); // IDs must be an alphanumeric string
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

router.post("/admin/addHomeVid", (req, res) => {
  if (req.session.admin) {
    try {
      authorize(req);
      assert(Object.keys(req.session.course_id).includes(req.body.courseID));
      assert(/\d+/.test(req.body.position)); // Positions consist at least 1 digit, and nothing else
      assert(/.+/.test(req.body.description)); // Description must be provided
      assert(/.*/.test(req.body.thumbnail)); // Thumbnail may not be provided
      // res.send("pass"); return;

      mongo.addHomeVid(
        req.body.courseID,
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

router.post("/admin/updateLucky", async (req, res) => {
  if (req.session.admin) {
    try {
      authorize(req);
      assert(req.body.date_time);
      assert(req.body.point_value);
      assert(req.body.image_name);
      const luckyID = parseInt(req.body.id);
      const submit = {
        time: req.body.date_time,
        point_value: req.body.point_value,
        image_name: req.body.image_name,
      };
      await mongo.updateLucky(req.body.courseID, luckyID, submit);
      res.status(200).send("200 - OK");
    } catch (e) {
      res
        .status(406)
        .send(
          "406 - Not acceptable. You must provide POST body parameters 'id' (a positive integer), a valid date/time, points, and image name"
        );
    }
  } else res.status(403).send("403 - Forbidden. You are not authorized to make requests here.");
});

router.post("/admin/addLucky", async (req, res) => {
  if (req.session.admin) {
    try {
      authorize(req);
      assert(req.body.date_time);
      assert(req.body.point_value);
      assert(req.body.image_name);
      const luckyID = parseInt(req.body.id);
      let submit = {
        time: req.body.date_time,
        point_value: req.body.point_value,
        image_name: req.body.image_name,
      };
      await mongo.addLucky(req.body.courseID, luckyID, submit);
      res.status(200).send("200 - OK");
    } catch (e) {
      res
        .status(406)
        .send(
          "406 - Not acceptable. You must provide POST body parameters 'id' (a positive integer), a valid date/time, points, and image name"
        );
    }
  } else res.status(403).send("403 - Forbidden. You are not authorized to make requests here.");
});

router.delete("/admin/deleteLucky", async (req, res) => {
  if (req.session.admin) {
    try {
      authorize(req);
      assert(req.body.luckyID);
      await mongo.deleteLucky(req.body.courseID, req.body.luckyID);
      res.status(200).send("200 - OK");
    } catch (e) {
      res
        .status(406)
        .send(
          "406 - Not acceptable. You must provide body arguments 'id' (a positive integer) " + e
        );
    }
  } else res.status(403).send("403 - Forbidden. You are not authorized to make requests here.");
});

router.post("/admin/modules", async (req, res) => {
  if (req.session.admin) {
    try {
      req.body.modules = JSON.parse(req.body.modules);
      const uniqueIDs = new Set();
      assert(Object.keys(req.session.course_id).includes(req.body.courseID));
      Object.entries(req.body.modules).map(([oldID, { newID, due, open }]) => {
        assert(parseInt(oldID));
        assert(parseInt(newID));
        assert(/(true|false)/.test(due));
        assert(/(true|false)/.test(open));
        uniqueIDs.add(newID);
      });
      assert(uniqueIDs.size === Object.keys(req.body.modules).length);
      await mongo.updateModules(req.body.courseID, req.body.modules);
      res.status(200).send("200 - OK");
    } catch (e) {
      console.error(e);
      res
        .status(406)
        .send(
          "406 - Not acceptable. You must provide POST body parameters courseID and modules, an Object of module ids to a new id, 'open', and 'due' (booleans)."
        );
    }
  } else res.status(403).send("403 - Forbidden. You are not authorized to make requests here.");
});

router.post("/admin/addModule/:id", async (req, res) => {
  if (req.session.admin) {
    try {
      authorize(req);
      Object.values(req.body).map((field) => assert(typeof field === "string"));
      if (req.body.open) assert(/(true|false)/.test(req.body.open)); // Open must be a valid boolean
      if (req.body.due) assert(/(true|false)/.test(req.body.due)); // Due must be a valid boolean
      if (req.body.practice_id_bool) assert(/(true|false)/.test(req.body.practice_id_bool)); // Open must be a valid boolean
      assert(/\d+/.test(parseInt(req.params.id))); // IDs must be an integer
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
        subject: req.body.subject,
      };
      await mongo.addModule(req.body.courseID, submit);
      res.status(200).send("200 - OK");
    } catch (e) {
      res
        .status(406)
        .send(
          "406 - Not acceptable. You must provide POST body parameters 'id' (a positive integer), and 'open' and/or 'due' (booleans)."
        );
    }
  } else res.status(403).send("403 - Forbidden. You are not authorized to make requests here.");
});

router.delete("/admin/deleteHomeVid", (req, res) => {
  if (req.session.admin) {
    try {
      authorize(req);
      assert(Object.keys(req.session.course_id).includes(req.body.courseID));
      mongo.deleteHomeVid(req.body.courseID, req.body.vidId, (err) => {
        if (err)
          res.status(500).send("500 - Internal Server Error. Encountered error deleting video.");
        else res.status(200).send("200 - OK");
      });
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
router.delete("/admin/deleteModule", async (req, res) => {
  if (req.session.admin) {
    try {
      authorize(req);
      assert(Object.keys(req.session.course_id).includes(req.body.courseID));
      assert(req.body.moduleID);
      await mongo.deleteModule(req.body.courseID, req.body.moduleID);
      res.status(200).send("200 - OK");
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

router.delete("/admin/deleteModuleVid", async (req, res) => {
  if (req.session.admin) {
    try {
      authorize(req);
      assert(Object.keys(req.session.course_id).includes(req.body.courseID));
      assert(req.body.moduleID);
      assert(req.body.vidID);
      await mongo.deleteModuleVid(req.body.courseID, req.body.moduleID, req.body.vidID);
      res.status(200).send("200 - OK");
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

router.post("/admin/updateVideoDefaults", async (req, res) => {
  if (req.session.admin) {
    try {
      authorize(req);
      assert(/https?:\/\/.*/.test(req.body.thumbnail)); // Verify some sort of url-ness
      assert(/https?:\/\/.*/.test(req.body.playbutton)); // ''

      await mongo.updateVideoDefaults(req.body.courseID, req.body.thumbnail, req.body.playbutton);
      res.status(200).send("200 - OK");
    } catch (e) {
      res
        .status(400)
        .send(
          "400 - Bad request. You must provide body arguments 'thumbnail' and 'playbutton', both strings, which are URLs to image assets."
        );
    }
  } else res.status(403).send("403 - Forbidden. You are not authorized to make requests here.");
});

router.post("/admin/updateDaily/:id", (req, res) => {
  if (req.session.admin) {
    try {
      authorize(req);
      assert(req.body.assignment_id);
      let submit = {
        _id: parseInt(req.params.id),
        assignment_id: req.body.assignment_id,
      };
      mongo.updateDaily(req.body.courseID, submit, (err, data) => {
        if (err) {
          res.status(500).send("500 - Internal Server Error. Encountered error updating daily.");
        } else res.status(200).send("200 - OK");
      });
    } catch (e) {
      res
        .status(406)
        .send(
          "406 - Not acceptable. You must provide POST body parameters 'id' (a positive integer), and an assignment_id."
        );
    }
  } else res.status(403).send("403 - Forbidden. You are not authorized to make requests here.");
});

// Not used
router.post("/admin/updateTodaysDaily", (req, res) => {
  if (req.session.admin) {
    try {
      authorize(req);
      assert(typeof parseInt(req.body.position) === "number");
      assert(req.body.courseID);
      mongo.updateTodaysDaily(req.body.courseID, req.body.position, (err, data) => {
        if (err) {
          res
            .status(500)
            .send("500 - Internal Server Error. Encountered error saving todays daily.");
        } else res.status(200).send("200 - OK");
      });
    } catch (e) {
      res
        .status(406)
        .send(
          "406 - Not acceptable. You must provide POST body parameters 'id' (a positive integer), and a position number)."
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
      Object.values(req.body).map((field) => assert(typeof field === "string"));
      if (req.body.open) assert(/(true|false)/.test(req.body.open)); // Open must be a valid boolean
      if (req.body.due) assert(/(true|false)/.test(req.body.due)); // Due must be a valid boolean
      if (req.body.practice_id_bool) assert(/(true|false)/.test(req.body.practice_id_bool)); // Open must be a valid boolean
      assert(/\d+/.test(parseInt(req.params.id))); // IDs must be an integer

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
        subject: req.body.subject,
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
        _id: req.body.videoID,
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

router.post("/admin/addModuleVid", async (req, res) => {
  if (req.session.admin) {
    try {
      authorize(req);
      assert(req.body.courseID);
      assert(req.body.video_src);
      assert(req.body.video_image_src);
      assert(req.body.video_desc);
      assert(/\d+/.test(req.body.position));
      assert(req.body.moduleID);
      const submit = {
        video_src: req.body.video_src,
        video_image_src: req.body.video_image_src,
        video_desc: req.body.video_desc,
        video_desc_helper: req.body.video_desc_helper,
        position: parseInt(req.body.position),
      };
      await mongo.addModuleVid(req.body.courseID, submit, req.body.moduleID);
      res.status(200).send("200 - OK");
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
const navigationLocations = ["welcome", "coach_info", "life_on_grounds"];
router.post("/admin/updateNavigation", (req, res) => {
  if (req.session.admin) {
    try {
      authorize(req);
      assert(Object.keys(req.session.course_id).includes(req.body.courseID));
      // assert(/https?:\/\/.+/.test(req.body.link)); uncomment after switching to cloud stored file
      navigationLocations.map(async (location) => {
        assert(location in req.body);
        const navigation = await mongo.updateNavigation(
          req.body.courseID,
          location,
          req.body[location]
        );
        if (!navigation)
          res.status(500).send("500 - Internal Server Error. Request could not be processed.");
      });
      res.status(200).send("200 - OK");
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
      authorize(req);
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
      // assert(/https?:\/\/.+/.test(req.body.unearned_url)); // Unearned_url should be a URL
      // assert(/https?:\/\/.+/.test(req.body.earned_url)); // Earned_url should be a URL
      // assert(/https?:\/\/.+/.test(req.body.earned_hover_url)); // Unearned_hover_url should be a URL

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

      mongo.updateBadge(req.body.courseID, submit, (err) => {
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

router.get("/admin/unifiedGradebook", async (req, res) => {
  if (req.session.admin) {
    try {
      const courseID = 8376,
        gradebook = {},
        assignmentIdToType = {},
        moduleIDs = [],
        modules = await mongo.client
          .db(config.mongoDBs[courseID])
          .collection("modules")
          .find()
          .toArray(),
        sections = await canvas.getSections(courseID, "include[]=students"),
        submissions = await canvas.getSubmissions(
          courseID,
          "student_ids[]=all&workflow_state=graded&per_page=1000"
        );

      // Map assignement id to module type and ID
      modules.map((module) => {
        assignmentIdToType[module.practice_link] = {
          type: "practice",
          moduleID: module._id,
        };
        assignmentIdToType[module.quiz_link] = {
          type: "apply",
          moduleID: module._id,
        };
        moduleIDs.push(module._id);
      });

      // Add each student to gradebook with name, team, and initialize modules empty scores
      for (const section of sections) {
        if (!section.students || section.name === Object.values(req.session.course_id)[0]) continue;
        section.students.map((student) => {
          gradebook[student.id] = {
            modules: {},
            team: section.name,
            name: student.short_name,
          };
          moduleIDs.map((id) => {
            gradebook[student.id].modules[id] = { practice: "-", apply: "-" };
          });
        });
      }

      // Fill in empty scores
      for (const submission of submissions) {
        const userID = submission.user_id.toString();
        const assignmentType = assignmentIdToType[submission.assignment_id];

        if (userID in gradebook && assignmentType) {
          gradebook[userID].modules[assignmentType.moduleID][assignmentType.type] =
            submission.score;
        }
      }
      res.status(200).send(gradebook);
    } catch (e) {
      console.log(e);
      res.send("406 - Not acceptable.");
    }
  } else res.status(403).send("403 - Forbidden. You are not authorized to make requests here.");
});

// --------------------------
//     Canvas Live Event
// --------------------------
// TODO: assert inputs
router.post("/gradeChangeEvent", (req, res) => {
  try {
    // assert(req.metadata.event_name === "grade_change");
    // assert(req.metadata.context_id);
    // assert(req.metadata.user_id);
    // assert(req.body.grade);
    /**
     * Get Canvas course id from Canvas Live Event context_id
     * https://community.canvaslms.com/t5/Question-Forum/Get-course-id-from-context-id/td-p/159753
     * https://canvas.instructure.com/doc/api/file.data_service_canvas_grade.html
     */
    console.log(req.body);
    // const courseID = (await canvas.getCourseID(req.)).data;
    // canvas.updateScore(courseBody.id, req.body.user_id, parseInt(req.body.grade), (err) => {
    //   if (err) console.log(err);
    //   else console.log(`User ${req.body.user_id} score successfully updated.`);
    // });
    // canvas.updateModuleProgress(courseBody.id, req.body.user_id, req.body, (err) => {
    //   if (err) console.log(err);
    //   else console.log(`User ${req.body.user_id} badges successfully updated.`);
    // });
    // canvas.updateBadgeProgress(courseBody.id, req.body.user_id, (err) => console.log(err));
  } catch (e) {
    console.log("Invalid or uneccessary Canvas Live Event received.", e);
  }
});

module.exports = router;
