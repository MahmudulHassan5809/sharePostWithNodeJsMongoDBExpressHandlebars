const express = require('express');
const exphbs  = require('express-handlebars');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const flash = require('connect-flash');
const path = require('path');



const app = express();


//HandleBars Helpers
const {
  truncate,
  stripTags,
  formatDate,
  select,
  owner,
 } = require('./helpers/hbs');

 //HandleBars MiddleWare
app.engine('handlebars', exphbs({
  helpers:{
    truncate: truncate,
    stripTags: stripTags,
    formatDate: formatDate,
    select: select,
    owner: owner
  },
  defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// default options
app.use(fileUpload());


//Body Parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


//Method Override
app.use(methodOverride('_method'))

//Passport Config
require('./config/passport')(passport);

//Session Express
app.use(session({
  secret: 'screet',
  resave: false,
  saveUninitialized: true,
}));


//passport middleware
app.use(passport.initialize());
app.use(passport.session())

//Connect
app.use(flash());


//Global Variable
app.use(function(req , res , next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null;
  next();
});

//Static Folder
app.use(express.static(path.join(__dirname,'public')));



//DB Config
const db = require('./config/database');

//Map Gloabal Promise -get rid of warning
mongoose.Promise = global.Promise;

//Connect To Mongoose
mongoose.connect(db.mongoURI,{
    useNewUrlParser: true
})
.then(() => { console.log('mongodb Connected');})
.catch(err => console.log(err));


//Load Routes
const index = require('./routes/index');
const user = require('./routes/user');
const posts = require('./routes/posts');
const comments = require('./routes/comments');






//Index Routes
app.use('/',index);
//User Routes
app.use('/user',user);
//Post Routes
app.use('/posts',posts);
//Comment Routes
app.use('/comments',comments);

const port = process.env.PORT || 4545;
app.listen(port,() => {
	console.log(`Sever Started on port ${port}`);
});
