const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');


//Welcome Page
router.get('/',(req , res) => {
   res.render('index/welcome');
});


router.get('/about',(req , res) => {
   //res.send('About');
   res.render('index/about');
});


module.exports = router;
