/*
 * unit tests for notification.js
 */

var assert = require('assert');
var util = require('util');

var config = require('../lib/config');
var redis = require('../lib/redis');
var handy = require('../lib/handy');
var logger = require('../lib/logger');
var notification = require('../lib/notification');
var server = require('../lib/server');

var testlib = require('./testlib');

var waitMsTimeOfSoon = 10;
var waitMsTimeOfConnectApns = 3000;
var waitMsTimeOfSendApnsNotification = 3000;
var waitMsTimeOfSendC2dmNotification = 3000;

var gC2dmAuth = "DQAAALsAAABL_JFHfd303zDBZlUdx7RwRYBYJRoJOU67TDgMBC-R2Qp2j5G6o1m92bVJNIKAmPjdShe-lhOlDREQJ_aZznU6_yvnlIUV9zFGu1ZP9jNHYQ0kZi6BktIx6kqgDTBshTKP084Eg3C3JJv_e0TJtjEuArmWZ3NJJ-PhL9ASDKbL0nFIoEQ1-2cclqU6vRDe4iggv2w0TxpdJYdW-GEQlfCryRNXFR--qlbPF9tgSaKr5niJ6ibITfUkP2H3AFME8yw";

//var gRegistrationId  = "APA91bEz37bHlufpeMlMazmZOY4Dze820SQg0H5VhscNd5pbo5pvgv6GNomOwBK0D2oh4Y2pDM-Gwz40MpHIxzz6H6Z-FW8OkidcT9HZWL5VvuGFQH-McyJ-9GkXyfqvHbJ2UaN_dipjDU3ZNgeS4DqNL6kC7u8egQ";
var gRegistrationId  = "APA91bF_02mUEIo9Y95EE05jkAxaq0t7crOydnTAW1Fh6ykRP0J-ZRNlsGCWS7qzoWDE6L50JVCC00KUzf-fsUaTEwcrDvgF3vBlGVlmzqrothupB64zLBiViWY_9HLARUKkCg42IUxp_aPpaKL67_cN3yWufSpYCgJ9F6PhPj7Ag9V1LFtgSLc";//gf
var gRegistrationId2 = "";
var gRegistrationId3 = "";
//var gDeviceToken = "c45681705981607ea76f57ec166405b2231db1c5fed020c1abd6024563b08cb7";
var gDeviceToken = "ec0a620af3b17a0a8350dfa6a67ef1f88e43f8b3d4deb94593fca1e9170d3c49";//  -- bj
var gDeviceToken = "f2c96f7246dbaa7ad155ba5714287b62a10417392fc5b4157c1f060b77c8777a";//  -- lm


/*
 * c2dm auth is assured to exist after notifyWorker.init called.
 * cbFun is function(err,outData)
 */

function initWorker(params,cbFun) {
  var clearAuth = params.clearAuth;
  config.config.logLevel = 3;//debug //2;//info

  var redisStore = redis.create();
  if(clearAuth){
    redisStore.setC2dmAuth({auth:null});
  }

  var notifyWorker = notification.create();
  notifyWorker.init({store:redisStore},function(){
    setTimeout(function(){
      console.log("initWorker finish");
      if (cbFun) return cbFun(null,{notifyWorker:notifyWorker});
      return;
    },waitMsTimeOfSoon);//setTimeout
  });//notifyWorker.init
}//initWorker


function runSendC2dmNotification(params,cbFun){
  handy.log('blue', "runSendC2dmNotification begin");
  assert.ok(cbFun);
  assert.ok(params.notifyWorker);
  assert.ok(params.userId);
  assert.ok(params.registrationId);
  assert.ok(params.collapseKey);

  var notDealError = params.notDealError;

  var notifyWorker = params.notifyWorker;
  var userId=params.userId;
  var registrationId = params.registrationId;
  //var dataMessageStr = params.dataMessageStr;
  var dataMessageObj = params.dataMessageObj;
  var collapseKey = params.collapseKey;
  //if(!dataMessageStr) dataMessageStr = "pushA"+new Date().getTime();
  if(!dataMessageObj) dataMessageObj = {dt:"notify "+new Date().getTime()+" "+new Date().toUTCString()};
  var params2 = {userId:userId, registrationId:registrationId, dataMessageObj:dataMessageObj, collapseKey:collapseKey};
  notifyWorker.sendC2dmNotification(params2,function(err,sendInfo){
    if (err){
      if (notDealError){
        return cbFun(err);
      }else{
        handy.logError('error handled in notifyWorker.sendC2dmNotification');
        handy.handleError({err:err, nestlevel:0});
        return cbFun(err);
      }
    }
    cbFun(null,sendInfo);
    return;
  });//sendC2dmNotification
}//runSendC2dmNotification

function runSendToApns(params,cbFun){
  handy.log('blue', "runSendToApns begin");
  assert.ok(cbFun);
  assert.ok(params.notifyWorker);
  assert.ok(params.deviceToken);
  assert.ok(params.payloadData);

  var notDealError = params.notDealError;

  var notifyWorker = params.notifyWorker;
  var deviceToken = params.deviceToken;
  var payloadData = params.payloadData;

  var params2 = {deviceToken:deviceToken, payloadData:payloadData};
  notifyWorker.sendToApns(params2,function(err){
    if (err){
      if (notDealError){
        return cbFun(err);
      }else{
        handy.logError('error handled in notifyWorker.sendToApns');
        handy.handleError({err:err, nestlevel:0});
        return cbFun(err);
      }
    }
    setTimeout(function(){
      cbFun(null);
      return;
    },waitMsTimeOfSendApnsNotification);
  });//sendToApns
}//runSendToApns


/*
 * only test function can work
 */
function testSendC2dmNotification1(next){
  handy.log('blue', "running testSendC2dmNotification1");
  //if (!next) next = function(){};
  var userId = '201';
  var registrationId = gRegistrationId;
  var collapseKey = 'ckey'+ new Date().getTime();

  var outDataSc={};
  var notifyWorker;
  handy.pipeline(
      function(next2){
        initWorker({clearAuth:false},function(err,outData){
          assert.ifError(err);
          notifyWorker = outData.notifyWorker;
          next2();
        });//initWorker
      },
      function(next2){
        runSendC2dmNotification({notifyWorker:notifyWorker, userId:userId, registrationId:registrationId, collapseKey:collapseKey},function(err,outData){
          assert.ifError(err);
          next2();
        });//runSendC2dmNotification
      },
//      function(next2){
//        //maybe do check or assert
//      },
      function(next2){
        if (!next) process.exit();
        else next();
      }
  );//pipeline
}//testSendC2dmNotification1




/*
 * only test function can work
 */
function testSendToApns1(next){
  handy.log('blue', "running testSendToApns1");
  //if (!next) next = function(){};
  var deviceToken = gDeviceToken;
  //var payloadData = {aps:{alert:'utest'+new Date().toTimeString(),badge:1,sound:'default'}};
  var payloadData = {aps:{alert:'justSend',badge:1,sound:'default'}};//ok

  var notifyWorker;
  handy.pipeline(
      function(next2){
        initWorker({clearAuth:false},function(err,outData){
          assert.ifError(err);
          notifyWorker = outData.notifyWorker;
          next2();
        });//initWorker
      },
      function(next2){
        runSendToApns({notifyWorker:notifyWorker, deviceToken:deviceToken, payloadData:payloadData},function(err){
          assert.ifError(err);
          next2();
        });//runSendToApns
      },
      function(next2){
        if (!next) process.exit();
        else next();
      }
  );//pipeline
}//testSendToApns1







//directly invoke functions

testSendC2dmNotification1();
//testSendToApns1();






