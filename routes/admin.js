var express = require('express');
var router = express.Router();
var config = require('../bin/config');
var canvas = require('../models/canvas')
var queries = require('../models/queries')
var mongo = require('../models/mongo')
var asyncStuff = require('async')
var auth = require('../bin/auth')

//generate ID for new video entries
function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (var i = 0; i < 16; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('admin', { title: 'Express' });
});

/* POST home page. */
router.post('/', function (req, res, next) {
  res.render('admin', { title: 'Express' });
});


//Get Home Page Updates 
router.get('/home', function (req, res, next) {
  console.log("Hi! admin.js router.get('/home)");
  mongo.getHomeContent(function (err, home_updates, home_vids) {
    res.render('admin/home', {
      title: 'home',
      home_updates: home_updates,
      home_vids: home_vids,
    });
  });
});

//Get Home Page Updates 
router.post('/home', function (req, res, next) {
  console.log("Hi! admin.js router.post('/home)");
  mongo.updateData('home', { "type": "updates" }, req.body, function (err, result) {
    res.redirect('/admin')
  });
});

//add home video
router.get('/home/videos/add', function (req, res, next) {
  res.render('admin/homeVidAdd', {
    title: 'Add Home Video',
  });
});

//add home video
router.post('/home/videos/add', function (req, res, next) {
  vidData = req.body;
  vidData._id = makeid();
  vidData.type = 'video';
  mongo.insertData('home', vidData, function (err, result) {
    res.redirect('/admin/home');
  });
});

//edit home video
router.get('/home/videos/edit/:id', function (req, res, next) {
  mongo.getHomeContent(function (err, home_updates, home_vids) {
    home_vid = home_vids.find(video => video._id == req.params.id);
    if (home_vid) {
      res.render('admin/homeVidEdit', {
        title: 'Edit Home Video',
        video: home_vid,
      });
    }
    else {
      res.send('ERROR: Video Not Found')
    }
  });
});

//POST handler to edit home video
router.post('/home/videos/edit/:id', function (req, res, next) {
  mongo.updateData('home', { _id: req.params.id }, req.body, function (err, result) {
    res.redirect('/admin/home');
  })
});

//delete home video
router.post('/home/videos/delete/:id', function (req, res, next) {
  mongo.deleteData('home', { _id: req.params.id }, function (err, result) {
    res.redirect('/admin/home')
  })
});


//Get Modules Home Page (Table of all modules + edit buttons)
router.get('/modules', function (req, res, next) {
  mongo.getData('modules', function (err, modulesInfo) {
    res.render('admin/modules', {
      title: 'Modules',
      modules: modulesInfo,
    });
  });
});

//Get Page to Edit Module Content
router.get('/modules/:id/edit', function (req, res, next) {
  mongo.getModule(req.params.id, function (err, moduleInfo) {
    res.render('admin/moduleEdit', {
      title: 'Edit Module',
      module: moduleInfo,
    });
  });
});

//POST handler for Module Edits
router.post('/modules/:id/edit', function (req, res, next) {
  mongo.updateData('modules', { _id: parseInt(req.params.id) }, req.body,
    function (err, result) {
      res.redirect('/admin/modules');
    });
})

//GET page to add video to module
router.get('/modules/:id/videos/add', function (req, res) {
  res.render('admin/moduleVideoAdd', {
    moduleID: req.params.id
  })
})

//POST handler to add video to module
router.post('/modules/:id/videos/add', function (req, res) {
  vidObject = req.body
  vidObject._id = makeid()
  mongo.getModule(req.params.id, function (err, moduleInfo) {
    //set position of new video to 1+(POSITION OF LAST VIDEO)
    vidObject.position = moduleInfo.videos[moduleInfo.videos.length - 1].position + 1;
    moduleInfo.videos.push(vidObject);
    mongo.updateData('modules', { _id: parseInt(req.params.id) }, moduleInfo,
      function (err, result) {
        res.redirect('/admin/modules/' + req.params.id + '/edit');
      });
  });
})

//GET page to edit video from module
router.get('/modules/:module_id/videos/edit/:video_id', function (req, res) {
  mongo.getModule(req.params.module_id, function (err, moduleInfo) {
    vidObject = moduleInfo.videos.find(video => video._id == req.params.video_id);
    res.render('admin/moduleVideoEdit', {
      title: 'Edit Module Video',
      moduleID: req.params.module_id,
      video: vidObject,
    });
  });
})

//POST handler to edit video from module
router.post('/modules/:module_id/videos/edit/:video_id', function (req, res) {
  mongo.getModule(req.params.module_id, function (err, moduleInfo) {
    vid_index = moduleInfo.videos.findIndex(video => video._id == req.params.video_id);
    vidObject = req.body;
    vidObject._id = req.params.video_id;
    vidObject.position = moduleInfo.videos[vid_index].position;
    moduleInfo.videos[vid_index] = vidObject
    mongo.updateData('modules', { _id: parseInt(req.params.module_id) }, moduleInfo,
      function (err, result) {
        res.redirect('/admin/modules/' + req.params.module_id + '/edit');
      });
  });
})

//POST handler to delete video from module
router.post('/modules/:module_id/videos/delete/:video_id', function (req, res) {
  mongo.getModule(req.params.module_id, function (err, moduleInfo) {
    vid_index = moduleInfo.videos.findIndex(video => video._id == req.params.video_id);
    if (vid_index > -1) {
      moduleInfo.videos.splice(vid_index, 1);
    }
    mongo.updateData('modules', { _id: parseInt(req.params.module_id) }, moduleInfo,
      function (err, result) {
        res.redirect('/admin/modules/' + req.params.module_id + '/edit');
      });
  });
})

router.get('/badges', function (req, res, next) {
  mongo.getData('badges', function (err, badges_data) {
    res.render('admin/badges', {
      title: 'Badges',
      badges: badges_data
    });
  })
})

router.get('/badges/edit/:id', function (req, res, next) {
  mongo.getData('badges', function (err, badges_data) {
    badge_data = badges_data.find(element => element._id == req.params.id)
    res.render('admin/badgeEdit', {
      title: 'Badges',
      badge: badge_data
    });
  })
})

router.post('/badges/edit/:id', function (req, res, next) {
  //update badges info
  mongo.updateData('badges', { _id: parseInt(req.params.id) }, {
    Title: req.body.title,
    Description: req.body.description,
    Points: req.body.badge_points,
    Portrait: req.body.portrait,
    PortraitDescription: req.body.portraitdescription
  }, function (err, result) {
    res.redirect('/admin/badges')
  })
})

router.get('/lucky', function (req, res, next) {
  mongo.getData('lucky_bulldogs', function (err, lucky_data) {
    res.render('admin/lucky', {
      title: 'Lucky Bulldog',
      lucky_data: lucky_data,
    });
  });
})

router.get('/lucky/edit/:id', function (req, res, next) {
  mongo.getData('lucky_bulldogs', function (err, lucky_data) {
    lucky_bulldog = lucky_data.find(x => x._id == req.params.id)
    res.render('admin/luckyEdit', {
      title: 'Lucky Bulldog',
      lucky_bulldog: lucky_bulldog,
    });
  });
})

router.post('/lucky/edit/:id', function (req, res, next) {
  mongo.updateData('lucky_bulldogs',{ _id: parseInt(req.params.id) },{time: req.body.date_time}, function(err,result){
    res.redirect('/admin/lucky');
  });
})

router.post('/lucky/delete/:id', function (req, res, next) {
  mongo.deleteData('lucky_bulldogs', { _id: parseInt(req.params.id) }, function (err, result) {
    res.redirect('/admin/lucky');
  })
})

router.get('/lucky/add', function (req, res, next) {
  res.render('admin/luckyAdd', {
    title: 'Lucky Bulldog'
  });
})

router.post('/lucky/add', function (req, res, next) {
  mongo.getData('lucky_bulldogs', function(err, lucky_data){
    if (lucky_data.length>0){
      new_id = Math.max(lucky_data.map(data => data._id))+1;
    } else{
      new_id=1;
    }
    mongo.insertData('lucky_bulldogs', {
      _id: new_id,
      time: req.body.date_time,
      awarded_ids: [],
    }, function(err,result){
      res.redirect('/admin/lucky');
    })
  })
})


module.exports = router;
