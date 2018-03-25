var express = require('express');
var router = express.Router();
var config = require('../bin/config');
var canvas = require('../models/canvas')
var mongo = require('../models/mongo')
var asyncStuff=require('async')
var auth = require('../bin/auth')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('admin', { title: 'Express' });
});

//Get Home Page Updates 
router.get('/home', function(req, res, next) {
  mongo.getHomeUpdates(function(home_updates){
    res.render('admin/home',{
      title: 'home',
      home_updates: home_updates,
    });
  });
});

//Get Home Page Updates 
router.post('/home', function(req, res, next) {
  mongo.updateData('info',{'name':'Home Updates'},req.body,function(err,result){
    res.redirect('/admin');
  })
});

//Get Modules Home Page (Table of all modules + edit buttons)
router.get('/modules', function(req, res, next) {
  mongo.getData('modules',function(err,modulesInfo){
    res.render('admin/modules',{
      title: 'Modules',
      modules: modulesInfo,
    });
  });
});

//Get Page to Edit Module Content
router.get('/modules/:id/edit', function(req, res, next) {
  mongo.getModule(req.params.id,function(err,moduleInfo){
    res.render('admin/moduleEdit',{
      title: 'Edit Module',
      module: moduleInfo,
    });
  });
});

//POST handler for Module Edits
router.post('/modules/:id/edit', function(req, res, next) {
  mongo.updateData('modules',{_id:parseInt(req.params.id)},req.body,
   function(err,result){
    res.redirect('/admin/modules');
  })
});

//router.post('/modules/delete/:id', function(req, res, next) {
//  console.log(req.body);
//  res.redirect('/admin/modules');
//});

//GET page to add video to module
router.get('/modules/:id/videos/add', function(req,res){
  res.render('admin/moduleVideoAdd', {
    moduleID: req.params.id
  })
})

//POST handler to add video to module
router.post('/modules/:id/videos/add', function(req,res){
  vidObject = req.body
  //generate ID for new video
  function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for (var i = 0; i < 16; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
  }
  vidObject._id = makeid()

  mongo.getModule(req.params.id,function(err,modulesInfo){
    //set position of new video to 1+(POSITION OF LAST VIDEO)
    vidObject.position = modulesInfo.videos[modulesInfo.videos.length-1].position+1;
    mongo.addVideo(req.params.id, vidObject, function(err,result){
      res.redirect('/admin/modules/'+req.params.id+'/edit');
    });
  });
})

//POST handler to delete video from module
router.post('/modules/:module_id/edit/videos/delete/:video_id', function(req,res){
  console.log(req.body);
  res.redirect('/admin/modules/edit/'+req.params.id);
})

router.get('/badges',function(req,res,next){
  mongo.getData('badges',function(err,badges_data){
    res.render('admin/badges',{
      title:'Badges',
      badges:badges_data
    });
  })
})

router.get('/badges/edit/:id',function(req,res,next){
  mongo.getData('badges',function(err,badges_data){
    badge_data = badges_data.find(element => element._id == req.params.id)
    res.render('admin/badgeEdit',{
      title:'Badges',
      badge:badge_data
    });
  })
})

router.post('/badges/edit/:id',function(req,res,next){
  //update badges info
  mongo.updateData('badges',{_id:parseInt(req.params.id)},{
    Title: req.body.title,
    Points: req.body.badge_points,
    Portrait: req.body.portrait,
    Description: req.body.description
  }, function(err,result){
    res.redirect('/admin/badges')
  })
})

router.get('/:adminRoute', function(req, res, next) {
  res.render('admin/'+req.params.adminRoute, { title: 'Express' });
});

router.post('/', function(req, res, next) { 
  res.render('admin', { title: 'Express' });
});


module.exports = router;
