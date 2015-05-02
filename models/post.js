var  mongodb = require("./db");
var markdown = require("markdown").markdown;

function Post(name,title,tags,post){
	this.name = name;
	this.title = title;
	this.tags = tags;
	this.post = post;
	};

module.exports = Post;

///存储博文相关db操作


Post.prototype.save = function(callback){
	var date = new Date();
	var time = {
		date:date,
		year:date.getFullYear(),
		month:date.getFullYear()+"-"+(date.getMonth() + 1),
		day:date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate(),
		minute:date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" " + date.getHours() + ":"+(date.getMinutes() < 10 ? '0'+date.getMinutes():date.getMinutes())
	}

	var post = {
		name:this.name,
		time:time,
		title:this.title,
		tags:this.tags,
		post:this.post,
		comments:[],
		pv:0
	};

    mongodb.open(function(err,db){
    	if (err) {
    		return callback(err);
    	};

    	db.collection('posts',function(err,collection){
    		if (err) {
    			mongodb.close();
    			return callback(err);
    		}
    		collection.insert(post,{
    			safe:true
    		},function(err){
    			if(err){
    				return callback(err);//失败！ 返回 err
    			}
    			callback(null);//返回err 为 null
    		});

    	});


    });

}

Post.get = function(name,callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		//查询posts集合

		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}

			var query = {};
			if(name){
				query.name = name;
			}

			collection.find(query).sort({
				time:-1
			}).toArray(function(err,docs){
				mongodb.close();
				if (err) {
					return callback(err);
				};
				docs.forEach(function(doc){
					doc.post = markdown.toHTML(doc.post);
				});
				callback(null,docs);//成功 以数组的形式返回
			});


		});


	});
}


//查询篇文章
Post.getone = function(name,day,title,callback){

	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}

		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(error);
			};

			collection.findOne({"name":name,"time.day":day,"title":title},function(err,doc){
				if (err) {
					mongodb.close();
					return callback(err);
				};

				if (doc) {

					//增加访问次数
					collection.update({
						"name":name,
						"time.day":day,
						"title":title
					},{$inc:{"pv":1}},function(err){
						mongodb.close();
						if(err){
							return callback(err);
						}
					});

					doc.post = markdown.toHTML(doc.post);
					doc.comments.forEach(function(comment){

						comment.comtent = markdown.toHTML(comment.comtent);
					});
				}
				callback(null,doc);
			});


		});
	});

}

Post.edit = function(name,day,title,callback){

	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
	db.collection('posts',function(err,collection){
		if(err){
			mongodb.close();
			return callback(err);
		}
		collection.findOne(
			{"name":name,"time.day":day,"title":title},function(err,doc){
				mongodb.close();
				if(err){
					return callback(err);
				}

				callback(null,doc);
		});
	});
	});

}


Post.update = function(name,day,title,post,callback){

		mongodb.open(function(err,db){
			if (err) {
				return callback(err);
			}
			db.collection('posts',function(err,collection){
				if (err) {
					mongodb.close();
					return callback(err);
				}
				collection.update({
					"name":name,
					"time.day":day,
					"title":title
				},{
					$set:{post:post}
				},function(err){
					mongodb.close();
					if (err) {return callback(err)};
					callback(null);
				});
			});
		});

}


Post.remove = function(name,day,title,callback){
	console.log(name+"----"+day+"----"+title);
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.remove({
				"name":name,
				"time.day":day,
				"title":title
			},{safe:true},function(err){
				mongodb.close();
				if(err){
					return callback(err);
				}
				console.log('delete--------------');
				return callback(null);
			});
		});
	});
}

Post.getArchive = function(callback){
	mongodb.open(function(err,db){

		if(err){
			return callback(err);
		}

		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}

			collection.find({},{
				"name":1,
				"time":1,
				"title":1
			}).sort({time:-1}).toArray(function(err,docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,docs);
			});

		});

	});
}

Post.getTags = function(callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}

			collection.distinct("tags",function(err,docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,docs);
			});

		});
	});
}


Post.getTag = function(tag,callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.find({
				"tags":tag
			},{
				"name":1,
				"time":1,
				"title":1,
			}).toArray(function(err,docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,docs);
			});
		});
	});
}

Post.search = function(keyword,callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}

		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}

			var pattern = new RegExp("^.*" + keyword + ".*$","i");
			collection.find({
				"title":pattern
			},
			{
				"name":1,
				"time":1,
				"title":1
			}).sort({
				time:-1
			}).toArray(function (err,docs){

				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,docs);
			});
		});

	});
}


/////转载
Post.reprint = function(reprint_form,reprint_to,callback){

	mongodb.opne(function(err,db){
		if(err){
			return callback(err);
		}

		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}

			collection.findOne({
				"name":reprint_form.name,
				"time.day":reprint_from.day,
				"title":reprint_from.title
			},function(err,doc){
				if(err){
					mongodb.close();
					return callback(err);
				}

				var date = new Date();
				var time = {
						date:date,
						year:date.getFullYear(),
						month:date.getFullYear()+"-"+(date.getMonth() + 1),
						day:date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate(),
						minute:date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()+" " + date.getHours() + ":"+(date.getMinutes() < 10 ? '0'+date.getMinutes():date.getMinutes())
					}
					delete doc_id;//删除原来的id

					doc.name = reprint_to.name;
					doc.time = time;
					doc.title = (doc.title.search(/[转载]/) > -1) ? doc.title:"[转载]"+ doc.title;
					doc.comments = [];
					doc.reprint_info = {"reprint_from":reprint_from};
					doc.pv = 0;
					//更新原来的文档

					collection.update({
						"name":reprint_from.name,
						"time.day":reprint_from.day,
						"title":reprint_from.title
					},{
						$push:{
							"reprint_info.reprint_to":{
								"name":doc.name,
								"day":time.day,
								"title":doc.title
							}
						}
					},function(err){
						mongodb.close();
						return callback(err);
					});

			    //插入转载的

			    collection.insert(doc,{
			    	safe:true
			    },function(err,post){
			    	mongodb.close();
			    	if(err){
			    		return callback(err);
			    	}
			    	callback(err,post[0]);
			    });

			});
		});
	});




}
	



