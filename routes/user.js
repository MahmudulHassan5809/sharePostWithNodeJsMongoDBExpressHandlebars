const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const async = require('async');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const passport = require('passport');

//Load Helpers
const {checkLogin , ensureAuthenticated} = require('../helpers/auth');

//Load User Model
require('../models/User');
const User = mongoose.model('users');

//Welcome Page
router.get('/register',checkLogin,(req , res) => {
   res.render('user/register');
});


//Registartion Process
router.post('/register',checkLogin,(req , res) => {
  let errors = [];

  if(req.body.password !== req.body.confirmPassword){
  	errors.push({text : 'Password Do Not Match'});
  }if(req.body.password.length < 4){
  	errors.push({text : 'Password Must Be At least 4 Charecters'});
  }

  if(errors.length > 0){
  	res.render('user/register',{
  		errors: errors,
  		firstName : req.body.firstName,
  		lastName : req.body.lastName,
  		email : req.body.email,
  		password : req.body.password,
  		confirmPassword : req.body.confirmPassword
  	});
  }else{
  	User.findOne({email: req.body.email})
  	.then(user => {
       if(user){
         req.flash('error_msg','Email Already Registered');
         res.redirect('/user/register');
       }else{
	      const newUser = {
		    firstName : req.body.firstName,
		    lastName  : req.body.lastName,
			  email : req.body.email,
			  password : req.body.password,
		  	}
		  	bcrypt.genSalt(10 , (err , salt) => {
		       bcrypt.hash(newUser.password , salt , (err , hash) => {
		           if(err) throw err;
		           newUser.password = hash;
		           new User(newUser)
		           .save()
		           .then(user => {
		           	 req.flash('success_msg','You Are Now Registered');
		           	 res.redirect('/user/login');
		           })
		           .catch(err => {
		             console.log(err);
		             return;
		           });
		       });
		  	});
		       }
		});
  	}
});

//Login Page
router.get('/login',checkLogin,(req , res) => {
   res.render('user/login');
});

//Login Form Process
router.post('/login',checkLogin,(req, res, next) => {
  passport.authenticate('local', {
    successRedirect:'/posts/my_posts',
    failureRedirect: '/user/login',
    failureFlash: true
  })(req, res, next);
});


//Logout User

router.get('/logout',(req , res) => {
   req.logout();
   req.flash('success_msg','You Are Logged Out');
   res.redirect('/user/login');
});


//Get Profile
router.get('/profile',ensureAuthenticated,(req , res) => {
   User.find({ _id : req.user.id})
  .then(user => {
    res.render('user/profile',{
      userProfile: user
    });
  });
});

//Change Password Page
router.get('/change_password',ensureAuthenticated,(req , res) => {
   res.render('user/change_password');
});

//Change Password Process
router.post('/change_password',ensureAuthenticated,(req , res) => {
  let errors = [];

  let currentPassword = req.body.current_password;
  if(req.body.new_password !== req.body.new_password1){
    errors.push({text : 'Password Do Not Match'});
  }if(req.body.new_password.length < 4){
    errors.push({text : 'Password Must Be At least 4 Charecters'});
  }

  bcrypt.compare(currentPassword , req.user.password, (err , isMatch) => {
        if(err) throw  err;
        if(isMatch){
            if(errors.length > 0){
                res.render('user/change_password',{
                  errors: errors,
                 });
            }else{
                bcrypt.genSalt(10 , (err , salt) => {
                bcrypt.hash(req.body.new_password , salt , (err , hash) => {
                     if(err) throw err;
                     let new_password = hash;
                     User.findByIdAndUpdate(req.user.id,{$set: {password: new_password}},(err , result)=>{
                        if(err) return err;
                        req.flash('success_msg','Password Change SuccessFully...');
                        res.redirect('/user/profile');
                      });
                  });
             });
          }
        }else{
          req.flash('error_msg','Your Current Password Does Not match');
          res.redirect('/user/change_password');
        }
      })

});

router.get('/update_profile',ensureAuthenticated,(req , res) => {
  res.render('user/profile');
})

router.post('/update_profile',ensureAuthenticated,(req , res) => {
  let errors = [];

  if(!req.body.firstName){
    errors.push({text : 'Enter The First Name'});
  }if(!req.body.lastName){
    errors.push({text : 'Enter The last Name'});
  }if(!req.body.email){
    errors.push({text : 'Enter The email'});
  }

  if(errors.length > 0){
    res.render('user/profile',{
      errors : errors,
      firstName : req.body.firstChild,
      lastName  : req.body.lastName,
      email     : req.body.email
    })
  }else{

     User.findByIdAndUpdate(req.user.id,{$set:
      {firstName: req.body.firstName ,
      lastName : req.body.lastName ,
      email : req.body.email }},(err , result) => {
      if(err) return err;
      req.flash('success_msg','Profile Updated SuccessFully...');
      res.redirect('/user/profile');
    });
  }


});

router.get('/forget_password',(req , res) => {
  res.render('user/forget_password');
});

router.post('/forget_password',(req , res , next) => {
   async.waterfall([
     function(done) {
      crypto.randomBytes(20 ,(err , buf) => {
        const token = buf.toString('hex');
        done(err , token);
      });
     },
     function(token , done) {
       User.findOne({email: req.body.email})
        .then(user => {
           if(!user){
             req.flash('error_msg','Email Does Not Exists');
             res.redirect('/user/forget_password');
           }
           user.resetPasswordToken = token;
           user.resetPasswordExpires = Date.now() + 3600000;

           user.save( (err) => {
              done(err, token , user);
           });

        });
      },
      function(token , user , done){
        var smtpTransport = nodemailer.createTransport({
           service: 'Gmail',
           auth: {
             user: 'your mail',
             pass: 'your password'
           }
        });
        var mailOptions = {
            to: user.email,
            from: 'yourmail@gmail.com',
            subject: 'Password Reset',
            text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
              'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
              'http://' + req.headers.host + '/user/reset/' + token + '\n\n' +
              'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success_msg', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
         });

      }
    ] , function(err){
       if(err) return next(err);
       res.redirect('/user/forget_password');
    });
});



router.get('/reset/:token', (req, res) => {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, (err, user) => {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/user/forget_password');
    }
    res.render('user/reset', {
      token: req.params.token
    });
  });
});


router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm_password) {
          bcrypt.genSalt(10 , (err , salt) => {
                bcrypt.hash(req.body.password , salt , (err , hash) => {
                     if(err) throw err;
                     let new_password = hash;
                     User.findOneAndUpdate(req.params.token,{$set: {password: new_password ,resetPasswordToken : undefined , resetPasswordExpires : undefined }},(err , user)=>{
                        if(err) return err;


                        req.logIn(user, function(err) {
                          done(err, user);
                        });
                    });

                  });
             });

        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: 'your mail',
          pass: 'your password'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'yourmail@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success_msg', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/posts/my_posts');
  });
});


module.exports = router;
