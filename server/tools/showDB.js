
var assert = require('assert');
var util = require('util');

var redis = require('../lib/redis');
var handy = require('../lib/handy');

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

node showDB.js help
node showDB.js all excludeRegex=c2dmAuth

node showDB.js filterType=regexRedis filterValue=* excludeRegex=c2dmAuth
node showDB.js filterType=regexRedis filterValue=user:*
node showDB.js filterType=regexRedis filterValue=*user:*
node showDB.js filterType=regexRedis filterValue=user:201*
node showDB.js filterType=regexRedis filterValue=*user:201*
node showDB.js filterType=regexJs filterValue=.* excludeRegex=c2dmAuth excludeRegexAttributes=i
node showDB.js filterType=regexJs filterValue=topic includeRegexAttributes=i
node showDB.js filterType=regexJs filterValue=topic\: includeRegexAttributes=i
node showDB.js filterType=regexJs filterValue=topic\:1
node showDB.js filterType=regexJs "filterValue=topic\:1|topic\:2"
node showDB.js filterType=busUser filterValue=201
node showDB.js filterType=busTopic filterValue=1
   */
  var helpTxt = getMultiLine(showHelp);
  console.log(helpTxt);
}


var filterTypeSign = "filterType=";
var filterValueSign = "filterValue=";
var excludeRegexSign = "excludeRegex=";
var includeRegexAttributesSign = "includeRegexAttributes=";
var excludeRegexAttributesSign = "excludeRegexAttributes=";
var helpSign = "help";
var allSign = "all";

var filterType,filterValue,excludeRegex,includeRegexAttributes,excludeRegexAttributes;
var needHelp=false,isAll=false;

if (process.argv.length <= 2){
  showHelp();
  return;
}

for(var i=2; i<process.argv.length; i++){
  var arg = process.argv[i];
  if(arg.indexOf(filterTypeSign) >= 0){
    filterType = arg.substring(filterTypeSign.length);
  }else if(arg.indexOf(filterValueSign) >= 0){
    filterValue = arg.substring(filterValueSign.length);
  }else if(arg.indexOf(excludeRegexSign) >= 0){
    excludeRegex = arg.substring(excludeRegexSign.length);
  }else if(arg.indexOf(includeRegexAttributesSign) >= 0){
    includeRegexAttributes = arg.substring(includeRegexAttributesSign.length);
  }else if(arg.indexOf(excludeRegexAttributesSign) >= 0){
    excludeRegexAttributes = arg.substring(excludeRegexAttributesSign.length);
  }
  else if(arg==helpSign){
    needHelp = true;
  }else if(arg==allSign){
    isAll = true;
  }
}

if (needHelp){
  showHelp();
  return;
}

var params = {filterType:filterType, filterValue:filterValue, excludeRegex:excludeRegex, includeRegexAttributes:includeRegexAttributes, excludeRegexAttributes:excludeRegexAttributes};

if(isAll){
  params.filterType = 'regexRedis';
  params.filterValue = '*';
}else{
  if (!filterType && !filterValue){
    showHelp();
    return;
  }
}

var store = redis.create();
store.getData(params,function(err,kvHash){
  if (err) {
    handy.handleError({err:err});
  }else{
    console.log("getData is below\n"+util.inspect(kvHash,false,100));
  }
  store.quit();
  console.log("getData end.");
});//store.getData



