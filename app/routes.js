var Post=require("../app/models/post");
var moment=require('moment');
var User=require("../app/models/user")
var paginate = require('express-paginate')
var marked=require('marked')
var truncate = require('truncate');
module.exports = function(app, passport) {
	app.use(function(req,res,next){
		res.locals.user=req.user;
		res.locals.message="";
	        next();
});
	app.locals.marked=function(content){
	return marked(content);
}
	app.locals.moment=function(time){
	return moment(time).fromNow();
}
	app.locals.truncate=function(str,length){
	return truncate(str,length);
}
	app.locals.join=function(arr){
	return arr.join(" ");
}
	app.use(getMostusedTags);
	app.use(getRecentPassages);
	app.use(paginate.middleware(5, 50));
// normal routes ===============================================================

	// show the home page (will also have our login links)
	app.get('/',function(req, res) {
		Post.paginate({}, req.query.page, req.query.limit, function(err, pageCount, posts, itemCount) {
		res.render('index.ejs',{message: req.flash('alert'), pageCount: pageCount, itemCount: itemCount, posts: posts, currentPage: req.query.page
});
	},{sortBy: {created_at: -1}});
});

	// LOGOUT ==============================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

	// locally --------------------------------
		// LOGIN ===============================
		// show the login form
		app.get('/login', function(req, res) {
			if(req.isAuthenticated()){
			req.flash('alert','you have been logged in')
			res.redirect('/')}
			else{		
		res.render('login.ejs', {message: req.flash('alert')});
}
		});

		// process the login form
		app.post('/login', passport.authenticate('local-login', {
			successRedirect : '/', // redirect to the secure profile section
			failureRedirect : '/login', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

		// SIGNUP =================================
		// show the signup form
		app.get('/signup',getRecentPassages, function(req, res) {
			checkLoggedIn;
			res.render('signup.ejs', {message: req.flash('signupMessage') });
		});

		// process the signup form
		app.post('/signup', passport.authenticate('local-signup', {
			successRedirect : '/', // redirect to the secure profile section
			failureRedirect : '/signup', // redirect back to the signup page if there is an error
			failureFlash : true // allow flash messages
		}));

	// facebook -------------------------------

		// send to facebook to do the authentication
		app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

		// handle the callback after facebook has authenticated the user
		app.get('/auth/facebook/callback', 
			passport.authenticate('facebook', {
				successRedirect : '/',
				failureRedirect : '/login'
			}));

	// twitter --------------------------------

		// send to twitter to do the authentication
		app.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));

		// handle the callback after twitter has authenticated the user
		app.get('/auth/twitter/callback',
			passport.authenticate('twitter', {
				successRedirect : '/',
				failureRedirect : '/login'
			}));

	// weibo --------------------------------

		// send to twitter to do the authentication
		app.get('/auth/weibo', passport.authenticate('weibo', { scope : 'email' }));

		// handle the callback after twitter has authenticated the user
		app.get('/auth/weibo/callback',
			passport.authenticate('weibo', {
				successRedirect : '/',
				failureRedirect : '/login'
			}));



	// google ---------------------------------

		// send to google to do the authentication
		app.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));

		// the callback after google has authenticated the user
		app.get('/auth/google/callback',
			passport.authenticate('google', {
				successRedirect : '/',
				failureRedirect : '/login'
			}));
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

	// new/edit/update/reate passage-----------
	app.get('/posts/:id',function(req,res){
        Post.findById(req.params.id, function(err, post) {
	    if(post==null)
		res.redirect('back')
            else{
		res.render('posts.ejs', {post : post});
	}
        });
});
	app.get('/new',isLoggedIn,function(req,res){
       		res.render('new.ejs', {message: req.flash('wrong')});
         }

);
	app.post('/new',isLoggedIn,function(req,res){
		var post=new Post();
		post.author=req.user._id;
		post.username=req.user.name;
		post.title=req.body.title;
		post.content=req.body.content;
		post.tags=req.body.tags.split(' ');
		post.save(function(err){
			if(err){
			req.flash('wrong',"title or content should not be null");
			res.redirect('/new');
			}
			else{
			req.flash('notice',"创建成功");
			res.redirect('/posts/'+String(post._id));
			}		
});
		console.log(post)

		
         }

);
	app.get('/userinfo',isLoggedIn,function(req,res){
		res.render('userinfo.ejs');
	
});
	app.post('/userinfo',function(req,res){
		var user=req.user;
		user.name=req.body.name;
		user.save(function(err){
        	res.redirect('/');
});	
});

	app.get('/logout',function(req,res){
	req.logout();
	res.redirect('/');
})
       //get by tags
	app.get('/tags/:tag',function(req,res){
	var tag=req.params.tag
		Post.paginate({tags:tag}, req.query.page, req.query.limit, function(err, pageCount, posts, itemCount) {
		res.render('tags.ejs',{taglists:posts, pageCount: pageCount, itemCount: itemCount, currentPage: req.query.page,tag: tag });
},{sortBy: {created_at: -1}});	
})
	//edit passage
	app.get('/edit/:id',isLoggedIn,function(req,res){
	 	Post.findById(req.params.id,function(err,post){
		if(err)
		{ res.redirect("/")}
		else{
		if(req.user._id!=String(post.author)){
		req.flash('alert','不能编辑别人的文章')
		res.redirect("back")}
		else{
		 res.render("edit.ejs",{post:post, message:req.flash('alert')})
	}
		}
});
})
	
	//update passage
	app.route('/edit',isLoggedIn).post(function(req,res){
		var id=req.body.id
		var newmodel={title: req.body.title, content: req.body.content, tags: req.body.tags.split(' '), updated_at: Date.now()}
		Post.update({_id: id},{$set: newmodel},function(err){
		if(err)
		res.redirct("back");
		else
		res.redirect("/posts/"+id);
})

})
		app.get('/admin',isLoggedIn,function(req,res){
		Post.paginate({author:req.user._id}, req.query.page, req.query.limit, function(err, pageCount, posts, itemCount) {
		res.render('admin.ejs',{posts:posts, pageCount: pageCount, itemCount: itemCount, currentPage: req.query.page, message:req.flash('alert')});
},{sortBy: {created_at: -1}});					
})
		//delete
		app.route('/delete/:id',isLoggedIn).get(function(req,res){
		Post.findOneAndRemove({_id: req.params.id,username: req.user.name}, function(err){
		if(err){
		req.flash('alert','删除失败')
		res.redirect('back');}
		else{
		res.redirect('back');

}
})		

})
};
	
// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();

	
	req.flash('alert',"请先登录")
	res.redirect('/login');
}
function checkLoggedIn(req, res, next) {
	if (req.isAuthenticated()){
		req.flash('alert',"你已经登录")
		res.redirect('/');}

}

function getRecentPassages(req,res,next){
		Post.find({},{},{sort:{created_at: -1}, limit:5 },function(err,docs){
		res.locals.passages=docs;
		return next();		
});
}
function getMostusedTags(req,res,next){
Post.aggregate([
    // Unwind the array
    { "$unwind": "$tags" },

    // Group on tags with a count
    { "$group": {
        "_id": "$tags",
        "count": { "$sum": 1 }
    }},

    // Optionally sort the tags by count descending
    { "$sort": { "_id": -1 } },

    // Optionally limit to the top "n" results. Using 10 results here
    { "$limit": 10 }
],function(err,result){
	res.locals.tags=result;
	return next();
})
}

