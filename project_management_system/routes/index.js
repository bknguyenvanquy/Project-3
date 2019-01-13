var express = require('express');
var router = express.Router();
var passport = require('passport');
var validator = require('express-validator');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');
var async = require('async');
var cookieParser = require('cookie-parser');
var session = require('express-session');

var crypto = require('crypto');
var User = require('../models/user');
var secret = require('../secret/secret');

/* GET home page. */
router.get('/', function (req, res, next) {


  if (req.session.cookie.originalMaxAge !== null) {
    res.redirect('/home');
  }
  else {
    res.render('index', { title: 'Index || PMS' });
  }
});

router.get('/signup', function (req, res, next) {
  var errors = req.flash('error');
  res.render('user/signup', { title: 'Sign Up || PMS', messages: errors, hasErrors: errors.length > 0 });
});

router.post('/signup', validate, passport.authenticate('local.signup', {
  successRedirect: '/',
  failureRedirect: '/signup',
  failureFlash: true
}));

router.get('/login', function (req, res, next) {
  var errors = req.flash('error');
  res.render('user/login', { title: 'Log In || PMS', messages: errors, hasErrors: errors.length > 0 });
});

router.post('/login', loginValidation, passport.authenticate('local.login', {
  // successRedirect: '/home',
  failureRedirect: '/login',
  failureFlash: true
}), (req, res) => {
  if (req.body.rememberme) {
    req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; //30 days
  } else {
    req.session.cookie.maxAge = null;
  }
  res.redirect('/home');
});

router.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));

router.get('/auth/facebook/callback', passport.authenticate('facebook', {
  successRedirect: '/home',
  failureRedirect: '/login',
  failureFlash: true
}));

router.get('/home', function (req, res, next) {
  res.render('home', { title: 'Home || PMS' , user: req.user});
});

router.get('/forgot', function (req, res, next) {
  var errors = req.flash('error');
  var info = req.flash('info');
  res.render('user/forgot', { title: 'Forgot Password || PMS', messages: errors, hasErrors: errors.length > 0, info: info, noErrors: info.length > 0 });
});

router.post('/forgot', (req, res, next) => {
  async.waterfall([
    function (callback) {
      crypto.randomBytes(20, (err, buf) => {
        var rand = buf.toString('hex');
        callback(err, rand);
      });
    },

    function (rand, callback) {
      User.findOne({ 'email': req.body.email }, (err, user) => {
        if (!user) {
          req.flash('error', 'No Account With That Email Exist Or Email is Invalid');
          return res.redirect('/forgot');
        }
        user.passwordResetToken = rand;
        user.passwordResetExpires = Date.now() + 60 * 60 * 1000;

        user.save((err) => {
          callback(err, rand, user)
        });

      })
    },
    function (rand, user, callback) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: secret.auth.user,
          pass: secret.auth.pass

        }
      });

      var mailOptions = {
        to: user.email,
        from: 'PSM' + '<' + secret.auth.user + '>',
        subject: 'PSM Application Password Reset Token',
        text: 'You have requested for password reset token \n\n' + 'Please click on the link to complete the process: \n\n' + 'http://localhost:3000/reset/' + rand + '\n\n'

      };

      smtpTransport.sendMail(mailOptions, (err, response) => {
        req.flash('info', 'A password reset token has been send to ' + user.email);
        return callback(err, user);
      });
    }

  ], (err) => {
    if (err) {
      return next(err);
    }

    res.redirect('/forgot');
  })
});

router.get('/reset/:token', function (req, res, next) {
  User.findOne({ passwordResetToken: req.params.token, passwordResetExpires: { $gt: Date.now() } }, (err, user) => {
    if (!user) {
      req.flash('error', 'Password reset token has expired or is invalid. Enter your email agian to get a new token');
      return res.redirect('/forgot');
    }
    var errors = req.flash('error');
    var success = req.flash('success');

    res.render('user/reset', { title: 'Reset || PMS', messages: errors, hasErrors: errors.length > 0, succsess: success, noErrors: success.length > 0 });
  });

});

router.post('/reset/:token', function (req, res, next) {
  async.waterfall([
    function (callback) {
      User.findOne({ passwordResetToken: req.params.token, passwordResetExpires: { $gt: Date.now() } }, (err, user) => {
        if (!user) {
          req.flash('error', 'Password reset token has expired or is invalid. Enter your email agian to get a new token');
          return res.redirect('/forgot');
        }

        req.checkBody('password', 'Password is Required').notEmpty();
        req.checkBody('password', 'Password Must Not Be Less than 5 Characters').isLength({ min: 5 });
        req.check("password", "Password Must Contain at least 1 Number And Characters.").matches(/^(?=.*\d)(?=.*[a-z])[0-9a-z]{5,}$/, "i");

        var errors = req.validationErrors();

        if (req.body.password == req.body.cpassword) {
          if (errors) {
            var messages = [];
            errors.forEach((error) => {
              messages.push(error.msg);
            })

            var errors = req.flash('error');
            res.redirect('/reset/' + req.params.token);

          } else {
            user.password = user.encryptPassword(req.body.password);
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;

            user.save((err) => {
              req.flash('success', 'Your password has been successfully updated.');
              callback(err, user);
            })

          }
        } else {
          req.flash('error', 'Password and confirm password are not equal.');
          res.redirect('/reset/' + req.params.token);
        }


      });
    },
    function (user, callback) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: secret.auth.user,
          pass: secret.auth.pass

        }
      });

      var mailOptions = {
        to: user.email,
        from: 'PSM' + '<' + secret.auth.user + '>',
        subject: 'Your password has been updated ',
        text: 'This is a confirmation that you updated the password for ' + user.email

      };

      smtpTransport.sendMail(mailOptions, (err, response) => {
        callback(err, user);

        var error = req.flash('error');
        var success = req.flash('success');

        res.render('user/reset', { title: 'Reset || PMS', messages: error, hasErrors: error.length > 0, success: success, noErrors: success.length > 0 });

      });
    }
  ]);
});

router.get('/logout', (req, res) => {
  req.logout();
  req.session.destroy((err) => {
    res.redirect('/');
  });
})


function validate(req, res, next) {
  req.checkBody('fullname', 'Full name is Required').notEmpty();
  req.checkBody('fullname', 'Full name Must Not Be Less than 5 Characters').isLength({ min: 5 });
  req.checkBody('email', 'Email is Required').notEmpty();
  req.checkBody('email', 'Email is Invalid').isEmail();
  req.checkBody('password', 'Password is Required').notEmpty();
  req.checkBody('password', 'Password Must Not Be Less than 5 Characters').isLength({ min: 5 });
  req.check("password", "Password Must Contain at least 1 Number And Characters.").matches(/^(?=.*\d)(?=.*[a-z])[0-9a-z]{5,}$/, "i");

  var errors = req.validationErrors();

  if (errors) {
    var messages = [];
    errors.forEach(error => {
      messages.push(error.msg);
    });

    req.flash('error', messages);
    res.redirect('/signup');
  }
  else {
    return next();
  }


}

function loginValidation(req, res, next) {
  req.checkBody('email', 'Email is Required').notEmpty();
  req.checkBody('email', 'Email is Invalid').isEmail();
  req.checkBody('password', 'Password is Required').notEmpty();
  req.checkBody('password', 'Password Must Not Be Less than 5 Characters').isLength({ min: 5 });
  req.check("password", "Password Must Contain at least 1 Number And Characters.").matches(/^(?=.*\d)(?=.*[a-z])[0-9a-z]{5,}$/, "i");

  var loginErrors = req.validationErrors();

  if (loginErrors) {
    var messages = [];
    loginErrors.forEach(error => {
      messages.push(error.msg);
    });

    req.flash('error', messages);
    res.redirect('/login');
  }
  else {
    return next();
  }


}


module.exports = router;
