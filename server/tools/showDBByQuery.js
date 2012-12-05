
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

node showDBByQuery.js help
node showDBByQuery.js topEntityType=user userIds=1,2
node showDBByQuery.js topEntityType=user fieldName=name fieldValueRegexp=Adam needCaseInsensitive=true

node showDBByQuery.js topEntityType=date dateIds=1,2
node showDBByQuery.js topEntityType=date fieldName=description fieldValueRegexp=date needCaseInsensitive=true

node showDBByQuery.js topEntityType=region regions=CN+Beijing+Beijing,CN+Hebei+Tangshan
node showDBByQuery.js topEntityType=region valueRegexp=beijing needCaseInsensitive=true
   */
  var helpTxt = getMultiLine(showHelp);
  console.log(helpTxt);
}



var helpSign = "help";


var filterType,filterValue,excludeRegex,includeRegexAttributes,excludeRegexAttributes;
var needHelp=false,isAll=false;

if (process.argv.length <= 2){
  showHelp();
  return;
}
var arg3 = process.argv[2];
if (arg3 == helpSign){
  showHelp();
  return;
}

var nameValuePairs = {};
for(var i=2; i<process.argv.length; i++){
  var arg = process.argv[i];
  var sepIdx = null;
  if (arg){
    sepIdx = arg.indexOf("=");
    if (sepIdx>0){
      var name = arg.substring(0,sepIdx);
      var value = arg.substring(sepIdx+1);
      //no need to check below because we handle it in inner functions
//      if (name == "userIds" || name == "dateIds"){
//        value = value.split(",");
//      }
      nameValuePairs[name] = value;
    }
  }
}//for


var params = nameValuePairs;
console.log("params="+util.inspect(params,false,100));
var envSpecialConfig = config.getEnvConfig();
var store = redis.create(envSpecialConfig.dataRedisPort);
store.getRawDataByQuery(params,function(err,dataArray){
  if (err) {
    handy.handleError({err:err});
  }else{
    console.log("getRawDataByQuery is below\n"+util.inspect(dataArray,false,100));
  }
  store.quit();
  console.log("getRawDataByQuery end.");
});//store.getRawDataByQuery



