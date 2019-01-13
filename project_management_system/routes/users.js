var express = require('express');
var router = express.Router();
var Project = require('../models/project');
var User = require('../models/user');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});


router.get('/add-project', function(req, res, next) {
  res.render('project/add-project',{title: 'Add Project || PMS', user: req.user});
});


router.post('/add-project', function(req, res, next) {
  var newProject = new Project();
  newProject.nameProject = req.body.projectname;
  newProject.descripProject = req.body.projectdescrip;

  newProject.save(function (err, project) {
    if (err){
      return console.error(err);
    }
    console.log(project.nameProject + " saved to project collection.");
  });
  res.redirect('/users/add-project');
});


router.get('/list-project', function(req, res, next) {
  Project.find({}, function(err, projects) {
    // console.log(projects);
    res.render('project/list-project', {title: 'List Projects || PMS', projects: projects, user: req.user});
  });
});

router.get('/delete-project/:idproject', function(req, res, next) {
  var idproject = req.params.idproject;
  // console.log(idproject);
  Project.findByIdAndRemove(idproject, (err, project) => {
    if(!err){
      res.redirect('/users/list-project');
    }
  })
  // Project.findByIdAndDelete(idproject, (err) => {
  //   if(!err){
  //     res.redirect('/users/list-project');
  //   }
  // })
});

router.get('/update-project/:idproject', function(req, res, next) {
  var idproject = req.params.idproject;
  // console.log(idproject);
  Project.findById(idproject, (err, project) => {
    if(project){
      res.render('project/update-project',{title: 'Update Project || PMS', project: project, user: req.user});
      // if(!err){
      //   project.nameProject = req.body.projectname;
      //   project.descripProject = req.body.projectdescrip;
      //   project.save(function (err, project) {
      //     if (err){
      //       return console.error(err);
      //     }
      //     console.log(project.nameProject + " saved to project collection.");
      //   });
      // }
      // res.redirect('/users/update-project/:idproject');
    }
  });
});

router.post('/update-project/:idproject', function(req, res, next) {
  var idproject = req.params.idproject;
  // Project.findById(idproject, (err, project) => {
  //   if(project){
  //     if(!err){
  //       project.nameProject = req.body.projectname;
  //       project.descripProject = req.body.projectdescrip;
  //       project.save(function (err, project) {
  //         if (err){
  //           return console.error(err);
  //         }
  //         console.log(project.nameProject + " saved to project collection.");
  //       });
  //       res.redirect('/users/update-project/:idproject');
  //     }
      
  //   }else{
  //     console.log('No data');
  //   }
  // });
  Project.findByIdAndUpdate(idproject, {nameProject: req.body.projectname, descripProject: req.body.projectdescrip}, (err, project) => {
    if(!err){
      res.redirect('/users/update-project/'+idproject);
    }
  })
});


//USERS
router.get('/admin/list-user-json', function(req, res, next) {
  User.find({}, function(err, users) {
    res.json(users);
  });
});
router.get('/admin/list-user', function(req, res, next) {
  User.find({}, function(err, users) {
    // console.log(users);
    // res.json(users);
    if(!err){
      if(req.user.role === 'master'){
        res.render('admin/list-user', {title: 'List Users || PMS', users: users, user: req.user});
      }
      else{
        res.render('admin/not-admin',{title: 'Update User || PMS', user: req.user});
      }
    }
    
    
  });
});
router.get('/admin/update-user/:iduser', function(req, res, next) {
  var iduser = req.params.iduser;
  // console.log(iduser);
  User.findById(iduser, (err, user) => {
    if(!err){
      if(req.user.role === 'master'){
        res.render('admin/update-user',{title: 'Update User || PMS', user: user});
      }
      
      else{
        res.render('admin/not-admin',{title: 'Not Found || PMS', user: user});
      }
      
    }
  });
});

router.post('/admin/update-user/:iduser', function(req, res, next) {
  var iduser = req.params.iduser;
  // User.findById(iduser, (err, user) => {
  //   if(user){
  //     if(!err){
  //       user.fullname = req.body.fullname;
  //       user.role = req.body.roleuser;
  //       user.save(function (err, user) {
  //         if (err){
  //           return console.error(err);
  //         }
  //         console.log(user.fullname + " saved to user collection.");
  //       });
  //       res.redirect('/users/admin/update-user/:iduser');
  //     }
      
  //   }else{
  //     console.log('No data');
  //   }
  // });


  User.findByIdAndUpdate(iduser, {fullname: user.fullname, role: user.roleuser}, (err, user) => {
    if(!err){
      if(req.user.role === 'master'){
        res.redirect('/users/admin/update-user/'+iduser);
      }
      else{
        // res.redirect('/users/admin/not-admin');
        res.render('admin/not-admin',{title: 'Not Found || PMS', user: req.user});
      }
      
    }
  })
});
module.exports = router;
