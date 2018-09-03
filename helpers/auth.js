module.exports = {
  ensureAuthenticated: function(req, res, next){
    if(req.isAuthenticated()){
      return next();
    }
    req.flash('error_msg', 'Not Authorized');
    res.redirect('/user/login');
  },
  checkLogin: function(req, res , next){
    if(req.isAuthenticated()){
      req.flash('success_msg', 'You Are Already Loggedin..');
      res.redirect('/posts');
    }else{
    	return next();
    }
  },


}
