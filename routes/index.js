var express = require('express');
var router = express.Router();
var crypto = require('crypto');//node.js核心模块在这里利用它生成散列值来加密密码
var fs = require('fs');
var User = require('../models/user.js');
var Post = require('../models/post.js');
var multer  = require('multer');//上传组件


// /* GET home page. */
// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

// module.exports = router;

module.exports = function(app){

	app.get('/',function(req,res){
		Post.get(null,function(err,posts){
			if(err){
				posts = [];
			}

			res.render('index',{
				title:'主页',
				user:req.session.user,
				posts:posts,
				success:req.flash('success').toString(),
				error:req.flash('error').toString()
			});
		});
	});

	app.get('/reg',checkNotLogin);
	app.get('/reg',function(req,res){
		res.render(
			'reg',{title:'注册',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
	});
	});
	app.post('/reg',checkNotLogin);
	app.post('/reg',function(req,res){
		var  name = req.body.name,
			 password = req.body.password,
			 password_re = req.body['password-repeat'];
		if (password != password_re) {
			req.flash('error','两次输入的密码不一致!');
			return res.redirect('/reg');
		};	 
		//生成md5值
		var md5 = crypto.createHash('md5'),
		    password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			name: req.body.name,
			password:password,
			email:req.body.email
		});  


		User.get(newUser.name,function(err,user){
			if (user) {
				req.flash('error','用户已经存在');
				return res.redirect('/reg');//返回重新注册
			};

			//如果不存在，则注册新用户
			newUser.save(function(err,user){
				if (err) {
					req.flash('error',err);
					return res.redirect('/reg');//注册报错
				};
			});
			req.session.user = user;
			req.flash('success','注册成功！');
			res.redirect('/');
		});



	});	
	app.get('/login',checkNotLogin);
	app.get('/login',function(req,res){
			res.render(
			'login',{title:'登陆',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
	});
	});

	app.post('/login',checkNotLogin);
	app.post('/login',function(req,res){
		var md5 = crypto.createHash('md5');
		    password = md5.update(req.body.password).digest('hex');
		User.get(req.body.name,function(err,user){
			if(!user){
				req.flash('error','用户不存在');
				return res.redirect('/login');
			}

			///密码错误
			if (user.password != password) {
				req.flash('error','密码错误');
				return res.redirect('/login');
			};

			req.session.user = user;
			req.flash('success','登陆成功');
			res.redirect('/');

		});
	});

	app.get('/post',checkLogin);
	app.get('/post',function(req,res){
		res.render(
			'post',{
					title:'发表',
					user:req.session.user,
					success:req.flash('success').toString(),
					error:req.flash('error').toString()
				});
	});

	app.post('/post',checkLogin);
	app.post('/post',function(req,res){
		var currentUser = req.session.user,
		    post = new Post(currentUser.name,req.body.title,req.body.post);
		post.save(function(err){
			console.log(err);
			if(err){
				req.flash('error',err);
				return res.redirect('/');
			}

			req.flash('success','发布成功');
			res.redirect('/');
		});
	});

	app.get('/logout',checkLogin);
	app.get('/logout',function(req,res){
		req.session.user = null;
		req.flash('success','退出成功');
		res.redirect('/');
	});

	app.get('/upload',checkLogin);
	app.get('/upload',function(req,res){
			res.render(
			'upload',{title:'上传',
			user:req.session.user,
			success:req.flash('success').toString(),
			error:req.flash('error').toString()
	});	
	});

	var mwMulter1 = multer({ dest: '../public/images',
			rename: function (fieldname, filename, req, res) {
	  		return filename
			},
			onFileUploadComplete: function (file, req, res) {
 				 console.log(file.fieldname + ' uploaded to  ' + file.path)
			},
			onError: function (error, next) {
  				console.log(error)
 				 next(error)
			},
			onFileSizeLimit: function (file) {
 				 console.log('Failed: ', file.originalname)
  				fs.unlink('./' + file.path) // delete the partially written file
			}

	});
	app.post('/upload',checkLogin);
	app.post('/upload',mwMulter1,function(req,res){

		 console.log('IN POST (/files1)');
        console.log(req.body)

        var filesUploaded = 0;

        if ( Object.keys(req.files).length === 0 ) {
            console.log('no files uploaded');
        } else {
            console.log(req.files)
        }

		req.flash('success','上传文件成功');
		res.redirect('/upload');
		
	});
	



		/*optional stuff to do after success */

	///////利用路由中间件实现控制权限

	function checkLogin(req,res,next){
		if(!req.session.user){
			req.flash('error','未登录');
			res.rediect('/login');
		}
		next();
	}

	function checkNotLogin(req,res,next){
		if(req.session.user){
			req.flash('error','已登录');
			res.rediect('back');//返回之前页面
		}
		next();
	}



}
