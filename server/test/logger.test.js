/*
 * unit tests for notification.js
 */

var assert = require('assert');
var util = require('util');

var config = require('../lib/config');
//var handy = require('../lib/handy');
var logger = require('../lib/logger');


function test_logDebug(){
  var nowTime = new Date().getTime();
  logger.logError("PrettyRich-TongQu logDebug "+nowTime);
}//test_logDebug

function test_logInfo(){
  var nowTime = new Date().getTime();
  logger.logError("PrettyRich-TongQu logInfo "+nowTime);
}//test_logInfo

function test_logError(){
  var nowTime = new Date().getTime();
  logger.logError("PrettyRich-TongQu logError "+nowTime);
}//test_logError


//if you delete all the file local1* , you should restart syslog, or else you can not see local1.log be generated.


test_logDebug();
test_logInfo();
test_logError();

