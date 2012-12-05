/*
 * unit tests for notification.js
 */

var assert = require('assert');
var util = require('util');

var config = require('../lib/config');
var handy = require('../lib/handy');
var logger = require('../lib/logger');
var shuffle = require('../lib/shuffle');




function test_generateDateDateScore(){
  util.log("test_generateDateDateScore entered.");
  var dateInMs = new Date().getTime();
  var lowSeqPart = 1234;
  var r = shuffle.generateDateDateScore({dateInMs:dateInMs, lowSeqPart:lowSeqPart});
  console.log("r="+r);

  var r = shuffle.generateDateDateScore({dateInMs:dateInMs, lowSeqDefaultMax:true});
  console.log("r="+r);
};//test_generateDateDateScore













test_generateDateDateScore();



