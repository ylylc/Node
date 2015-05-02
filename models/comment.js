var  mongodb = require("./db");
function Comment(name,day,title,comment){
	this.name = name,
	this.day = day,
	this.title = title,
	this.comment = comment
}

module.exports = Comment;

Comment.prototype.save = function(callback){
	var post  = {
		name: this.name,
		day:this.day,
		title:this.title,
		comment:this.comment
	}
console.log(post.name+"---"+post.day+"----"+post.title);
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.update({
				'name':post.name,
				'time.day':post.day,
				'title':post.title
			},
			{
				$push:{'comments':post.comment}
		     },function(err){
		    				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);
			});
		})


	});

}