var assert = require('assert');
var util = require('util');
var redis = require('../lib/redis');
var handy = require('../lib/handy');
var config = require('../lib/config');

/**
 * to get multi-line string value in the comment in the fun's codes
 * @param fun
 * @returns {String}
 */
function getMultiLine (fun) {
  var lines = new String(fun);
  lines = lines.substring(lines.indexOf("/*") + 3, lines.lastIndexOf("*/"));
  return lines;
}


function showHelp(){
  /*
node cleanDB.js all
node cleanDB.js exclude=c2dmAuth
  */
  var helpTxt = getMultiLine(showHelp);
  console.log(helpTxt);
}


var excludeSign = "exclude=";
var excludeFilter = null;

var allSign = "all";
var isClearAll = null;

if (process.argv.length <= 2){
  showHelp();
  return;
}

for(var i=2; i<process.argv.length; i++){
  var arg = process.argv[i];
  if(arg.indexOf(excludeSign) >=0){
    excludeFilter = arg.substring(excludeSign.length);
  }
  if(arg==allSign){
    isClearAll = true;
  }
}

var envSpecialConfig = config.getEnvConfig();
var store = redis.create(envSpecialConfig.dataRedisPort);
var params = {};
if (isClearAll){
  params.all = true;
}
if (excludeFilter != null){
  params.excludeFilter = excludeFilter;
}

store.clean(params,function(err){
  if (err) {
    handy.handleError({err:err});
  }
  store.quit();
  console.log("cleanDB end.");
});//store.clean

