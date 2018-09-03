const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');

const { isEmpty,uploadDir } = require('../helpers/upload-helpers');

//Load Helpers
const {ensureAuthenticated} = require('../helpers/auth');

//Load Posts Model
require('../models/Post');
const Post = mongoose.model('posts');

//Load Comment Model
require('../models/Comment');
const Comment = mongoose.model('comments');

//Welcome Page
router.get('/',(req , res) => {
  Post.find({status:'public'})
  .populate('user')
  .sort({date:'desc'})
  .then(posts => {
    res.render('posts/index',{
    	posts: posts
    });
  });
});

//Create Post Page
router.get('/create',ensureAuthenticated,(req , res) => {
   res.render('posts/create');
});


//Post From Process
router.post('/create',ensureAuthenticated,(req , res) => {
  let errors = [];
  if(!req.body.title){
    errors.push({err_msg:"Please add a title"});
  }
  if(!req.files.file){
    errors.push({err_msg:"Please add a File"});
  }
  if(!req.body.body){
    errors.push({err_msg:"Please add a Body"});
  }
  if(errors.length > 0){
    res.render('posts/create',{
      errors : errors,
      title : req.body.title,
      body  : req.body.body
    })
  }
  else{
  let fileName = '';
  if(!isEmpty(req.files)){
    let file = req.files.file;
    fileName = Date.now() + file.name;
    let dirUploads = './public/uploads/';
    file.mv(dirUploads + fileName,(err)=>{
       if(err) throw err;
    });
  }

  let allowComments;
  if(req.body.allowComments){
    allowComments = true;
  } else {
    allowComments = false;
  }

   const newPost = {
     user: req.user.id,
   	 title: req.body.title,
   	 body: req.body.body,
   	 status: req.body.status,
   	 allowComments: allowComments,
	 file: fileName
   };

  //Create Story
  new Post(newPost)
  .save()
  .then(post => {
     req.flash('success_msg','Post Created SuccessFully...');
     res.redirect('/posts');
  });
 }

});

//Get The Single Posts
router.get('/singlepost/:slug',(req , res) => {
  Post.findOne({
    slug : req.params.slug
  })
  .populate('user')
  .then(post => {
    if(post.status == 'public'){
      Comment.find({post : post.id})
      .populate('user')
      .then(comments => {
          res.render('posts/show',{
          post : post,
          comments : comments
        });
      })
    }else{
      if(req.user){
         if(req.user.id == post.user._id){
            res.render('posts/show',{
            post : post
          });
         }else{
           res.redirect('/posts');
        }
      }else{
        res.redirect('/posts');
      }
    }
  });
});


//Edit Posts Form
router.get('/edit/:id',ensureAuthenticated,(req , res) => {
  Post.findOne({
    _id : req.params.id
  })
  .then(post => {
    if(!req.user){
      res.redirect('/user/login');
    }
    else if(post.user != req.user.id){
      res.redirect('/posts');
    }else{
      res.render('posts/edit',{
      post : post
      });
    }

  });
});

//Edit Post Form Process
router.put('/edit/:id',ensureAuthenticated,(req , res) => {
  Post.findOne({
    _id : req.params.id
  })
  .then(post => {

    let allowComments;

    if(req.body.allowComments){
      allowComments = true;
    } else {
      allowComments = false;
    }

    //New values
     post.user = req.user.id;
     post.title = req.body.title;
     post.status = req.body.status;
     post.allowComments = allowComments;
     post.body = req.body.body;


    if(!isEmpty(req.files)){
    let file = req.files.file;
    fileName = Date.now() + file.name;
    post.file = fileName;
    let dirUploads = './public/uploads/';
    file.mv(dirUploads + fileName,(err)=>{
       if(err) throw err;
    });
   }

    post.save()
    .then(post => {
       req.flash("success_msg","Post Updated SuccessFully..");
       res.redirect('/posts');
    });
   });
});


//my All Posts
router.get('/my_posts',ensureAuthenticated,(req , res) => {
  Post.find({user : req.user.id})
  .sort({date:'desc'})
  .then(posts => {
    res.render('posts/my_posts',{
      posts: posts
    });
  });
});

//Post From Specific User
router.get('/allposts/:userId',ensureAuthenticated,(req , res) => {
  Post.find({user : req.params.userId , status: 'public'})
  .populate('user')
  .sort({date:'desc'})
  .then(posts => {
    res.render('posts/index',{
      posts: posts
    });
  });
})


//Delete Post With Comments
router.delete('/delete/:id',(req , res) => {
   Post.remove({_id: req.params.id})
   .then(()=>{
     Comment.remove({post: req.params.id})
     .then(() => {
        req.flash('success_msg','Post Deleted SuccessFully...');
        res.redirect('/posts');
     });
   });
});

module.exports = router;
