const mongoose = require('mongoose');
const Schema = mongoose.Schema;


//Create Schema
const CommentSchema = new Schema({
  user:{
     type:Schema.Types.ObjectId,
     ref: 'users'
  },
  post:{
     type:Schema.Types.ObjectId,
     ref: 'posts'
  },
  body:{
    type: String,
    required: true
  },
  date: {
  	type: Date,
  	default: Date.now
  }
});

mongoose.model('comments',CommentSchema);
