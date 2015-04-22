var express = require("express");
var router = express.Router();

router.get("/",function(req,res,next){
   res.render("first",{user:"liuchao"});
});

module.exports = router;