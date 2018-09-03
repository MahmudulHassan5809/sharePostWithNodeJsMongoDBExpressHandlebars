const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

//Load Comments Model
require('../models/Comment');
const Comment = mongoose.model('comments');

//Load Posts Model
require('../models/Post');
const Post = mongoose.model('posts');

//Comment Form Process
router.post('/add/:postId',(req , res) => {

  Post.findOne({ _id : req.params.postId})
  .then(post => {
	  const postId = req.params.postId;
	  let errors = false;

	  if(!req.body.commentBody){
	  	errors = true;
	  }
	  if(errors === true){
        req.flash('error_msg', 'Please Add A Comment Body');
	  	res.redirect(`/posts/singlepost/${post.slug}`);
	  }else{
	  	//res.send('Passed');
	  	const newComment = {
	  		user: req.user.id,
	  		post: postId,
	  		body: req.body.commentBody
	  	}
	  	new Comment(newComment)
	  	.save()
	  	.then(comment => {
	  		req.flash('success_msg','Comment Added Successfully..');
	  		res.redirect(`/posts/singlepost/${post.slug}`);
	  	})
	  }
  });

});


module.exports = router;
