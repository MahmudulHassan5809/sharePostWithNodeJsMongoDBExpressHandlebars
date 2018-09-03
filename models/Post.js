const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const URLSlugs = require('mongoose-url-slugs');

//Create Schema
const PostSchema = new Schema({
  user:{
     type:Schema.Types.ObjectId,
     ref: 'users'
  },
  title:{
    type: String,
    required: true
  },
  slug:{
    type: String
  },
  body:{
    type: String,
    required: true
  },
  status:{
  	type: String,
  	default: 'public'
  },
  allowComments:{
   type: Boolean,
   required: true
  },
  file:{
   type: String

  },
  date: {
  	type: Date,
  	default: Date.now
  }
});

PostSchema.plugin(URLSlugs('title',{field: 'slug'}));

mongoose.model('posts',PostSchema);
