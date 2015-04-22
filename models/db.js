var settings = require('../setting'),
	Db = require('mongodb').Db,
	Connenction = require('mongodb').Connenction,
	Server = require('mongodb').Server;
module.exports = new Db(settings.db,new Server(settings.host,27017),{safe:true});

/***
数据库连接**/