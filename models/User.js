const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const path = require('path');

const avatar = '/avatar/avatar.png';

//Create Schema
const UserSchema = new Schema({
  firstName:{
    type: String,
    required: true
  },
  lastName:{
    type: String,
    required: true
  },
  email:{
  	type: String,
  	required: true
  },
  password:{
    type: String,
    required: true
  },
  resetPasswordToken:{
    type: String,

  },
  resetPasswordExpires:{
    type: Date,

  },
  image:{
    type: String,
    default: avatar

  },
  date: {
  	type: Date,
  	default: Date.now
  }
});



mongoose.model('users',UserSchema);
