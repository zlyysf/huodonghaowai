var util = require('util');
var assert = require('assert');
var handy = require('../lib/handy');
var redis = require('../lib/redis');
var logger = require('../lib/logger');
var config = require('../lib/config');

var printExit = function (err, data) {
  handy.log('blue', data);
  redis.quit();
};





var clearDB = function (next) {
  var r = redis.create();
  r.client.flushdb(function(){
    //quit must be nested in
    r.quit();
    if(next) next();
  });
};




var utestGetRegionalRecentPhotoIds = function (params,next) {
  handy.log('blue', "running utestGetRegionalRecentPhotoIds");


  var r = redis.create();
  r.getRegionalRecentPhotoIds({cityLocation:"CN+Beijing+Beijing",count:100,cutOffTime:null,targetGender:'male',type:'new'},function(err,photoIds){
    assert.ifError(err);

    logger.logDebug("getRegionalRecentPhotoIds callback, photoIds="+util.inspect(photoIds,false,100));

    r.quit();
    if(next) next();

  });//getRegionalRecentPhotoIds
};//utestGetRegionalRecentPhotoIds

var utestGetRegionalHotPhotoIds = function (params,next) {
  handy.log('blue', "running utestGetRegionalHotPhotoIds");

  //var paramsGet = {cityLocation:"CN+Beijing+Beijing",count:10,start:'11',targetGender:'male',type:'hot'};
  var paramsGet = {cityLocation:"CN+Beijing+Beijing",count:3,start:'1',targetGender:'male',type:'hot'};

  var r = redis.create();
  r.getRegionalHotPhotoIds(paramsGet,function(err,photoIds){
    assert.ifError(err);

    logger.logDebug("getRegionalHotPhotoIds callback, photoIds="+util.inspect(photoIds,false,100));

    r.quit();
    if(next) next();

  });//getRegionalHotPhotoIds
};//utestGetRegionalHotPhotoIds


var utest_shiftToNotifyDate = function (params,next) {
  handy.log('blue', "running utest_shiftToNotifyDate");
  var r = redis.create();
  var span1Hour = 60*60*1000;
  var span2Hour = 2*60*60*1000;
  var timeNowUtc = handy.getNowOfUTCdate().getTime();
  var timeNow1h = timeNowUtc + span1Hour;
  var timeNow1h1 = timeNowUtc + span1Hour+1;
  var timeNow1h_1 = timeNowUtc + span1Hour-1;
  var timeNow2h = timeNowUtc + span2Hour;
  var timeNow2h1 = timeNowUtc + span2Hour+1;
  var timeNow2h_1 = timeNowUtc + span2Hour-1;
  var timeNow_1h = timeNowUtc - span1Hour;
  var timeNow_1h1 = timeNowUtc - span1Hour+1;
  var batchCount = 3;
  var fromToSpan = span2Hour;
  var fromTime = timeNowUtc, toTime = fromTime+fromToSpan;
  var allDoubleConfirmDatesKey = 'allDoubleConfirmDates';
  handy.pipeline(
      function(next){
        console.log("\nclean db.");
        r.clean({all:true, excludeFilter:null},function(err){
          assert.ifError(err);
          return next();
        });//clean
      },

      function(next){
        console.log("\nprepareData");
        function prepareData(cbFun){
          var multi = r.client.multi();
          multi.zadd(allDoubleConfirmDatesKey,timeNowUtc,timeNowUtc);
          multi.zadd(allDoubleConfirmDatesKey,timeNow1h,timeNow1h);
          multi.zadd(allDoubleConfirmDatesKey,timeNow1h1,timeNow1h1);
          multi.zadd(allDoubleConfirmDatesKey,timeNow1h_1,timeNow1h_1);
          multi.zadd(allDoubleConfirmDatesKey,timeNow2h,timeNow2h);
          multi.zadd(allDoubleConfirmDatesKey,timeNow2h1,timeNow2h1);
          multi.zadd(allDoubleConfirmDatesKey,timeNow2h_1,timeNow2h_1);
          multi.zadd(allDoubleConfirmDatesKey,timeNow_1h,timeNow_1h);
          multi.zadd(allDoubleConfirmDatesKey,timeNow_1h1,timeNow_1h1);
          multi.exec(function(err){
            if (err)  return cbFun(err);
            return cbFun(null);
          });//multiMark.exec
        };//prepareData

        prepareData(function(err){
          assert.ifError(err);
          return next();
        });//prepareData
      },

      function(next){
        console.log("\ncheck db data init");
        var multi = r.client.multi();
        multi.zrange(allDoubleConfirmDatesKey,0,-1);
        multi.exec(function(err,multiRetData){
          assert.ifError(err);
          //console.log("multiRetData="+util.inspect(multiRetData,false,100));
          var dcDateIds = multiRetData[0];
          assert.ok(dcDateIds.length==9);
          assert.ok(dcDateIds[0]==timeNow_1h);
          assert.ok(dcDateIds[1]==timeNow_1h1);
          assert.ok(dcDateIds[2]==timeNowUtc);
          assert.ok(dcDateIds[3]==timeNow1h_1);
          assert.ok(dcDateIds[4]==timeNow1h);
          assert.ok(dcDateIds[5]==timeNow1h1);
          assert.ok(dcDateIds[6]==timeNow2h_1);
          assert.ok(dcDateIds[7]==timeNow2h);
          assert.ok(dcDateIds[8]==timeNow2h1);
          return next();
        });//multiMark.exec
      },
      function(next){
        console.log("\nshiftToNotifyDate run 1st time.");
        r.shiftToNotifyDate({fromTime:fromTime, toTime:toTime, batchCount:batchCount},function(err,dateIds){
          assert.ifError(err);
          assert.ok(dateIds.length==batchCount);
          assert.ok(dateIds[0]==timeNowUtc);
          assert.ok(dateIds[1]==timeNow1h_1);
          assert.ok(dateIds[2]==timeNow1h);
          return next();
        });//shiftToNotifyDate
      },
      function(next){
        console.log("\ncheck db data 1st");
        var multi = r.client.multi();
        multi.zrange(allDoubleConfirmDatesKey,0,-1);
        multi.exec(function(err,multiRetData){
          assert.ifError(err);
          var dcDateIds = multiRetData[0];
          assert.ok(dcDateIds.length==4);
          assert.ok(dcDateIds[0]==timeNow1h1);
          assert.ok(dcDateIds[1]==timeNow2h_1);
          assert.ok(dcDateIds[2]==timeNow2h);
          assert.ok(dcDateIds[3]==timeNow2h1);
          return next();
        });//multiMark.exec
      },
      function(next){
        console.log("\nshiftToNotifyDate run 2nd time.");
        r.shiftToNotifyDate({fromTime:fromTime, toTime:toTime, batchCount:batchCount},function(err,dateIds){
          assert.ifError(err);
          assert.ok(dateIds.length==batchCount);
          assert.ok(dateIds[0]==timeNow1h1);
          assert.ok(dateIds[1]==timeNow2h_1);
          assert.ok(dateIds[2]==timeNow2h);
          return next();
        });//shiftToNotifyDate
      },
      function(next){
        console.log("\ncheck db data 2nd");
        var multi = r.client.multi();
        multi.zrange(allDoubleConfirmDatesKey,0,-1);
        multi.exec(function(err,multiRetData){
          assert.ifError(err);
          var dcDateIds = multiRetData[0];
          assert.ok(dcDateIds.length==1);
          assert.ok(dcDateIds[0]==timeNow2h1);
          return next();
        });//multiMark.exec
      },

      function(next){
        console.log("\nshiftToNotifyDate run 3rd time.");
        r.shiftToNotifyDate({fromTime:fromTime, toTime:toTime, batchCount:batchCount},function(err,dateIds){
          assert.ifError(err);
          assert.ok(dateIds==null || dateIds.length==0);
          return next();
        });//shiftToNotifyDate
      },
      function(next){
        console.log("\ncheck db data 3rd");
        var multi = r.client.multi();
        multi.zrange(allDoubleConfirmDatesKey,0,-1);
        multi.exec(function(err,multiRetData){
          assert.ifError(err);
          var dcDateIds = multiRetData[0];
          assert.ok(dcDateIds.length==1);
          assert.ok(dcDateIds[0]==timeNow2h1);
          return next();
        });//multiMark.exec
      },

      function(next){
        //DoAssert
        return next();
      },
      function(){
        r.quit();
      }
  );//handy.pipeline
};//utest_shiftToNotifyDate


var utest_shiftToNotifyDate2 = function (params,next) {
  handy.log('blue', "running utest_shiftToNotifyDate2");
  var r = redis.create();
  var span1Hour = 60*60*1000;
  var span2Hour = 2*60*60*1000;
  var timeNowUtc = handy.getNowOfUTCdate().getTime();
  var timeNow1h = timeNowUtc + span1Hour;
  var timeNow1h1 = timeNowUtc + span1Hour+1;
  var timeNow1h_1 = timeNowUtc + span1Hour-1;
  var timeNow2h = timeNowUtc + span2Hour;
  var timeNow2h1 = timeNowUtc + span2Hour+1;
  var timeNow2h_1 = timeNowUtc + span2Hour-1;
  var timeNow_1h = timeNowUtc - span1Hour;
  var timeNow_1h1 = timeNowUtc - span1Hour+1;
  var batchCount = 3;
  var fromToSpan = span2Hour;
  var fromTime = timeNowUtc, toTime = fromTime+fromToSpan;
  var allDoubleConfirmDatesKey = 'allDoubleConfirmDates';
  handy.pipeline(
      function(next){
        console.log("\nclean db.");
        r.clean({all:true, excludeFilter:null},function(err){
          assert.ifError(err);
          return next();
        });//clean
      },

      function(next){
        console.log("\nprepareData");
        function prepareData(cbFun){
          var multi = r.client.multi();
          multi.zadd(allDoubleConfirmDatesKey,timeNowUtc,timeNowUtc);
          multi.zadd(allDoubleConfirmDatesKey,timeNow1h,timeNow1h);
          multi.zadd(allDoubleConfirmDatesKey,timeNow1h1,timeNow1h1);
          multi.zadd(allDoubleConfirmDatesKey,timeNow1h_1,timeNow1h_1);
          multi.zadd(allDoubleConfirmDatesKey,timeNow2h,timeNow2h+''+'1');
          multi.zadd(allDoubleConfirmDatesKey,timeNow2h,timeNow2h+''+'2');
          multi.zadd(allDoubleConfirmDatesKey,timeNow2h1,timeNow2h1);
          multi.zadd(allDoubleConfirmDatesKey,timeNow2h_1,timeNow2h_1);
          multi.zadd(allDoubleConfirmDatesKey,timeNow_1h,timeNow_1h);
          multi.zadd(allDoubleConfirmDatesKey,timeNow_1h1,timeNow_1h1);
          multi.exec(function(err){
            if (err)  return cbFun(err);
            return cbFun(null);
          });//multiMark.exec
        };//prepareData

        prepareData(function(err){
          assert.ifError(err);
          return next();
        });//prepareData
      },

      function(next){
        console.log("\ncheck db data init");
        var multi = r.client.multi();
        multi.zrange(allDoubleConfirmDatesKey,0,-1);
        multi.exec(function(err,multiRetData){
          assert.ifError(err);
          //console.log("multiRetData="+util.inspect(multiRetData,false,100));
          var dcDateIds = multiRetData[0];
          assert.ok(dcDateIds.length==10);
          assert.ok(dcDateIds[0]==timeNow_1h);
          assert.ok(dcDateIds[1]==timeNow_1h1);
          assert.ok(dcDateIds[2]==timeNowUtc);
          assert.ok(dcDateIds[3]==timeNow1h_1);
          assert.ok(dcDateIds[4]==timeNow1h);
          assert.ok(dcDateIds[5]==timeNow1h1);
          assert.ok(dcDateIds[6]==timeNow2h_1);
          var extId = dcDateIds[7];
          assert.ok(Number(extId.substring(0,extId.length-1))==timeNow2h);
          extId = dcDateIds[8];
          assert.ok(Number(extId.substring(0,extId.length-1))==timeNow2h);
          assert.ok(dcDateIds[7]==timeNow2h+''+'1');//no doc defined...
          assert.ok(dcDateIds[8]==timeNow2h+''+'2');//no doc defined...
          assert.ok(dcDateIds[9]==timeNow2h1);
          return next();
        });//multiMark.exec
      },
      function(next){
        console.log("\nshiftToNotifyDate run 1st time.");
        r.shiftToNotifyDate({fromTime:fromTime, toTime:toTime, batchCount:batchCount},function(err,dateIds){
          assert.ifError(err);
          assert.ok(dateIds.length==batchCount);
          assert.ok(dateIds[0]==timeNowUtc);
          assert.ok(dateIds[1]==timeNow1h_1);
          assert.ok(dateIds[2]==timeNow1h);
          return next();
        });//shiftToNotifyDate
      },
      function(next){
        console.log("\ncheck db data 1st");
        var multi = r.client.multi();
        multi.zrange(allDoubleConfirmDatesKey,0,-1);
        multi.exec(function(err,multiRetData){
          assert.ifError(err);
          var dcDateIds = multiRetData[0];
          assert.ok(dcDateIds.length==5);
          assert.ok(dcDateIds[0]==timeNow1h1);
          assert.ok(dcDateIds[1]==timeNow2h_1);
          assert.ok(dcDateIds[2]==timeNow2h+''+'1');
          assert.ok(dcDateIds[3]==timeNow2h+''+'2');
          assert.ok(dcDateIds[4]==timeNow2h1);
          return next();
        });//multiMark.exec
      },
      function(next){
        console.log("\nshiftToNotifyDate run 2nd time.");
        r.shiftToNotifyDate({fromTime:fromTime, toTime:toTime, batchCount:batchCount},function(err,dateIds){
          assert.ifError(err);
          assert.ok(dateIds.length==batchCount);
          assert.ok(dateIds[0]==timeNow1h1);
          assert.ok(dateIds[1]==timeNow2h_1);
          assert.ok(dateIds[2]==timeNow2h+''+'1');
          return next();
        });//shiftToNotifyDate
      },
      function(next){
        console.log("\ncheck db data 2nd");
        var multi = r.client.multi();
        multi.zrange(allDoubleConfirmDatesKey,0,-1);
        multi.exec(function(err,multiRetData){
          assert.ifError(err);
          var dcDateIds = multiRetData[0];
          assert.ok(dcDateIds.length==2);
          assert.ok(dcDateIds[0]==timeNow2h+''+'2');
          assert.ok(dcDateIds[1]==timeNow2h1);
          return next();
        });//multiMark.exec
      },

      function(next){
        console.log("\nshiftToNotifyDate run 3rd time.");
        r.shiftToNotifyDate({fromTime:fromTime, toTime:toTime, batchCount:batchCount},function(err,dateIds){
          assert.ifError(err);
          assert.ok(dateIds.length==1);
          assert.ok(dateIds[0]==timeNow2h+''+'2');
          return next();
        });//shiftToNotifyDate
      },
      function(next){
        console.log("\ncheck db data 3rd");
        var multi = r.client.multi();
        multi.zrange(allDoubleConfirmDatesKey,0,-1);
        multi.exec(function(err,multiRetData){
          assert.ifError(err);
          var dcDateIds = multiRetData[0];
          assert.ok(dcDateIds.length==1);
          assert.ok(dcDateIds[0]==timeNow2h1);
          return next();
        });//multiMark.exec
      },

      function(next){
        //DoAssert
        return next();
      },
      function(){
        r.quit();
      }
  );//handy.pipeline
};//utest_shiftToNotifyDate2



var utest_markDatesNotifyInfo = function (params,next) {
  handy.log('blue', "running utest_markDatesNotifyInfo");
  var r = redis.create();
  var params = {datesNotifyInfo:[
        {dateId:1, haveSendNotificationForSender:false, haveSendNotificationForResponder:false},
        {dateId:2, haveSendNotificationForSender:false},
        {dateId:3, haveSendNotificationForResponder:false},
        {dateId:4},
        {dateId:5, haveSendNotificationForSender:true, haveSendNotificationForResponder:true},
        {dateId:6, haveSendNotificationForSender:true},
        {dateId:7, haveSendNotificationForResponder:true},
      ]};

  handy.pipeline(
      function(next){
        console.log("\nclean db.");
        r.clean({all:true, excludeFilter:null},function(err){
          assert.ifError(err);
          return next();
        });//clean
      },
      function(next){
        console.log("\nmarkDatesNotifyInfo run 1");
        r.markDatesNotifyInfo(params,function(err){
          assert.ifError(err);
          return next();
        });//markDatesNotifyInfo
      },



      function(next){
        console.log("\ncheck db data 1st");
        var multi = r.client.multi();
        var dateKey1 = 'date:'+1;
        var dateKey2 = 'date:'+2;
        var dateKey3 = 'date:'+3;
        var dateKey4 = 'date:'+4;
        var dateKey5 = 'date:'+5;
        var dateKey6 = 'date:'+6;
        var dateKey7 = 'date:'+7;
        multi.hgetall(dateKey1);
        multi.hgetall(dateKey2);
        multi.hgetall(dateKey3);
        multi.hgetall(dateKey4);
        multi.hgetall(dateKey5);
        multi.hgetall(dateKey6);
        multi.hgetall(dateKey7);
        multi.exec(function(err,multiRetData){
          assert.ifError(err);
          var dateObj1 = multiRetData[0];
          var dateObj2 = multiRetData[1];
          var dateObj3 = multiRetData[2];
          var dateObj4 = multiRetData[3];
          var dateObj5 = multiRetData[4];
          var dateObj6 = multiRetData[5];
          var dateObj7 = multiRetData[6];

          assert.ok(dateObj1.haveSendNotificationForSender=='0');
          assert.ok(dateObj1.haveSendNotificationForResponder=='0');
          assert.ok(dateObj1.haveSendNotificationForBothSide=='0');

          assert.ok(dateObj2.haveSendNotificationForSender=='0');
          assert.ok(dateObj2.haveSendNotificationForResponder=='0');
          assert.ok(dateObj2.haveSendNotificationForBothSide=='0');

          assert.ok(dateObj3.haveSendNotificationForSender=='0');
          assert.ok(dateObj3.haveSendNotificationForResponder=='0');
          assert.ok(dateObj3.haveSendNotificationForBothSide=='0');

          assert.ok(dateObj4.haveSendNotificationForSender=='0');
          assert.ok(dateObj4.haveSendNotificationForResponder=='0');
          assert.ok(dateObj4.haveSendNotificationForBothSide=='0');

          assert.ok(dateObj5.haveSendNotificationForSender=='1');
          assert.ok(dateObj5.haveSendNotificationForResponder=='1');
          assert.ok(dateObj5.haveSendNotificationForBothSide=='1');

          assert.ok(dateObj6.haveSendNotificationForSender=='1');
          assert.ok(dateObj6.haveSendNotificationForResponder=='0');
          assert.ok(dateObj6.haveSendNotificationForBothSide=='0');

          assert.ok(dateObj7.haveSendNotificationForSender=='0');
          assert.ok(dateObj7.haveSendNotificationForResponder=='1');
          assert.ok(dateObj7.haveSendNotificationForBothSide=='0');

          return next();
        });//multiMark.exec
      },


      function(next){
        //DoAssert
        return next();
      },
      function(){
        r.quit();
      }
  );//handy.pipeline
};//utest_markDatesNotifyInfo





var utest_getDateIdsOnZset = function (params,next) {
  handy.log('blue', "running utest_getDateIdsOnZset");
  var r = redis.create();
  var span1Hour = 60*60*1000;
  var span2Hour = 2*60*60*1000;
  var timeNowUtc = handy.getNowOfUTCdate().getTime();
  var timeNow1h = timeNowUtc + span1Hour;
  var timeNow1h1 = timeNowUtc + span1Hour+1;
  var timeNow1h_1 = timeNowUtc + span1Hour-1;
  var timeNow2h = timeNowUtc + span2Hour;
  var timeNow2h1 = timeNowUtc + span2Hour+1;
  var timeNow2h_1 = timeNowUtc + span2Hour-1;
  var timeNow_1h = timeNowUtc - span1Hour;
  var timeNow_1h1 = timeNowUtc - span1Hour+1;

  var fromToSpan = span2Hour;
  var fromTime = timeNowUtc, toTime = fromTime+fromToSpan;

  var pageSize = 3;


  var zsetKey = "zsetKey";
  handy.pipeline(
      function(next){
        console.log("\nclean db.");
        r.clean({all:true, excludeFilter:null},function(err){
          assert.ifError(err);
          return next();
        });//clean
      },

      function(next){
        console.log("\nprepareData");
        function prepareData(cbFun){
          var multi = r.client.multi();
          multi.zadd(zsetKey,timeNowUtc,timeNowUtc);
          multi.zadd(zsetKey,timeNow1h,timeNow1h);
          multi.zadd(zsetKey,timeNow1h1,timeNow1h1);
          multi.zadd(zsetKey,timeNow1h_1,timeNow1h_1);
          multi.zadd(zsetKey,timeNow2h,timeNow2h+''+'1');
          multi.zadd(zsetKey,timeNow2h,timeNow2h+''+'2');
          multi.zadd(zsetKey,timeNow2h1,timeNow2h1);
          multi.zadd(zsetKey,timeNow2h_1,timeNow2h_1);
          multi.zadd(zsetKey,timeNow_1h,timeNow_1h);
          multi.zadd(zsetKey,timeNow_1h1,timeNow_1h1);
          multi.exec(function(err){
            if (err)  return cbFun(err);
            return cbFun(null);
          });//multiMark.exec
        };//prepareData

        prepareData(function(err){
          assert.ifError(err);
          return next();
        });//prepareData
      },
      function(next){
        console.log("\ncheck db data init with score");
        var multi = r.client.multi();
        multi.zrange(zsetKey,0,-1,'WITHSCORES');
        multi.exec(function(err,multiRetData){
          assert.ifError(err);
          //console.log("multiRetData="+util.inspect(multiRetData,false,100));
          var dcDateIds = multiRetData[0];
          assert.ok(dcDateIds.length==10*2);
          assert.ok(dcDateIds[0*2+1]==timeNow_1h);
          assert.ok(dcDateIds[1*2+1]==timeNow_1h1);
          assert.ok(dcDateIds[2*2+1]==timeNowUtc);
          assert.ok(dcDateIds[3*2+1]==timeNow1h_1);
          assert.ok(dcDateIds[4*2+1]==timeNow1h);
          assert.ok(dcDateIds[5*2+1]==timeNow1h1);
          assert.ok(dcDateIds[6*2+1]==timeNow2h_1);
          assert.ok(dcDateIds[7*2+1]==timeNow2h);
          assert.ok(dcDateIds[8*2+1]==timeNow2h);
          assert.ok(dcDateIds[9*2+1]==timeNow2h1);

          assert.ok(dcDateIds[0*2]==timeNow_1h);
          assert.ok(dcDateIds[1*2]==timeNow_1h1);
          assert.ok(dcDateIds[2*2]==timeNowUtc);
          assert.ok(dcDateIds[3*2]==timeNow1h_1);
          assert.ok(dcDateIds[4*2]==timeNow1h);
          assert.ok(dcDateIds[5*2]==timeNow1h1);
          assert.ok(dcDateIds[6*2]==timeNow2h_1);
          var extId = dcDateIds[7*2];
          assert.ok(Number(extId.substring(0,extId.length-1))==timeNow2h);
          extId = dcDateIds[8*2];
          assert.ok(Number(extId.substring(0,extId.length-1))==timeNow2h);
          assert.ok(dcDateIds[7*2]==timeNow2h+''+'1');//no doc defined...
          assert.ok(dcDateIds[8*2]==timeNow2h+''+'2');//no doc defined...
          assert.ok(dcDateIds[9*2]==timeNow2h1);
          return next();
        });//multiMark.exec
      },

      function(next){
        console.log("\ngetDateIdsOnZset run, no cutOffTime, default fromLateToEarly, default start.");
        r.getDateIdsOnZset({zsetKey:zsetKey, count:pageSize},function(err,dateIdAndScoreData){
          assert.ifError(err);
          var scores = dateIdAndScoreData.scores;
          assert.ok(scores.length==pageSize);
          assert.ok(scores[0]==timeNow2h1);
          assert.ok(scores[1]==timeNow2h);
          assert.ok(scores[2]==timeNow2h);
          return next();
        });//shiftToNotifyDate
      },
      function(next){
        console.log("\ngetDateIdsOnZset run, no cutOffTime, default fromLateToEarly, start=0.");
        r.getDateIdsOnZset({zsetKey:zsetKey, count:pageSize, start:pageSize*0},function(err,dateIdAndScoreData){
          assert.ifError(err);
          var scores = dateIdAndScoreData.scores;
          assert.ok(scores.length==pageSize);
          assert.ok(scores[0]==timeNow2h1);
          assert.ok(scores[1]==timeNow2h);
          assert.ok(scores[2]==timeNow2h);
          return next();
        });//shiftToNotifyDate
      },
      function(next){
        console.log("\ngetDateIdsOnZset run, no cutOffTime, default fromLateToEarly, page 2nd.");
        r.getDateIdsOnZset({zsetKey:zsetKey, count:pageSize, start:pageSize*1},function(err,dateIdAndScoreData){
          assert.ifError(err);
          var scores = dateIdAndScoreData.scores;
          assert.ok(scores.length==pageSize);
          assert.ok(scores[0]==timeNow2h_1);
          assert.ok(scores[1]==timeNow1h1);
          assert.ok(scores[2]==timeNow1h);
          return next();
        });//shiftToNotifyDate
      },
      function(next){
        console.log("\ngetDateIdsOnZset run, no cutOffTime, fromLateToEarly, page 2nd.");
        r.getDateIdsOnZset({zsetKey:zsetKey, getDataDirection:'fromLateToEarly', count:pageSize, start:pageSize*1},function(err,dateIdAndScoreData){
          assert.ifError(err);
          var scores = dateIdAndScoreData.scores;
          assert.ok(scores.length==pageSize);
          assert.ok(scores[0]==timeNow2h_1);
          assert.ok(scores[1]==timeNow1h1);
          assert.ok(scores[2]==timeNow1h);
          return next();
        });//shiftToNotifyDate
      },

      function(next){
        console.log("\ngetDateIdsOnZset run, no cutOffTime, fromEarlyToLate, page 1st.");
        r.getDateIdsOnZset({zsetKey:zsetKey, getDataDirection:'fromEarlyToLate', count:pageSize, start:pageSize*0},function(err,dateIdAndScoreData){
          assert.ifError(err);
          var scores = dateIdAndScoreData.scores;
          assert.ok(scores.length==pageSize);
          assert.ok(scores[0]==timeNow_1h);
          assert.ok(scores[1]==timeNow_1h1);
          assert.ok(scores[2]==timeNowUtc);
          return next();
        });//shiftToNotifyDate
      },
      function(next){
        console.log("\ngetDateIdsOnZset run, no cutOffTime, fromEarlyToLate, page 2nd.");
        r.getDateIdsOnZset({zsetKey:zsetKey, getDataDirection:'fromEarlyToLate', count:pageSize, start:pageSize*1},function(err,dateIdAndScoreData){
          assert.ifError(err);
          var scores = dateIdAndScoreData.scores;
          assert.ok(scores.length==pageSize);
          assert.ok(scores[0]==timeNow1h_1);
          assert.ok(scores[1]==timeNow1h);
          assert.ok(scores[2]==timeNow1h1);
          return next();
        });//shiftToNotifyDate
      },

      function(next){
        console.log("\ngetDateIdsOnZset run, have cutOffTime, default fromLateToEarly, default start.");
        r.getDateIdsOnZset({zsetKey:zsetKey, cutOffTime:(timeNow2h1-1), count:pageSize},function(err,dateIdAndScoreData){
          assert.ifError(err);
          var scores = dateIdAndScoreData.scores;
          assert.ok(scores.length==pageSize);
          assert.ok(scores[0]==timeNow2h);
          assert.ok(scores[1]==timeNow2h);
          assert.ok(scores[2]==timeNow2h_1);
          return next();
        });//shiftToNotifyDate
      },
      function(next){
        console.log("\ngetDateIdsOnZset run, have cutOffTime, default fromLateToEarly, default start. next page");
        r.getDateIdsOnZset({zsetKey:zsetKey, cutOffTime:(timeNow2h_1-1), count:pageSize},function(err,dateIdAndScoreData){
          assert.ifError(err);
          var scores = dateIdAndScoreData.scores;
          assert.ok(scores.length==pageSize);
          assert.ok(scores[0]==timeNow1h1);
          assert.ok(scores[1]==timeNow1h);
          assert.ok(scores[2]==timeNow1h_1);
          return next();
        });//shiftToNotifyDate
      },

      function(next){
        console.log("\ngetDateIdsOnZset run, have cutOffTime, fromEarlyToLate, default start.");
        r.getDateIdsOnZset({zsetKey:zsetKey, getDataDirection:'fromEarlyToLate', cutOffTime:(timeNow_1h+1), count:pageSize},function(err,dateIdAndScoreData){
          assert.ifError(err);
          var scores = dateIdAndScoreData.scores;
          assert.ok(scores.length==pageSize);
          assert.ok(scores[0]==timeNow_1h1);
          assert.ok(scores[1]==timeNowUtc);
          assert.ok(scores[2]==timeNow1h_1);
          return next();
        });//shiftToNotifyDate
      },
      function(next){
        console.log("\ngetDateIdsOnZset run, have cutOffTime, fromEarlyToLate, default start. next page");
        r.getDateIdsOnZset({zsetKey:zsetKey, getDataDirection:'fromEarlyToLate', cutOffTime:(timeNow1h_1+1), count:pageSize},function(err,dateIdAndScoreData){
          assert.ifError(err);
          var scores = dateIdAndScoreData.scores;
          assert.ok(scores.length==pageSize);
          assert.ok(scores[0]==timeNow1h);
          assert.ok(scores[1]==timeNow1h1);
          assert.ok(scores[2]==timeNow2h_1);
          return next();
        });//shiftToNotifyDate
      },

      function(next){
        //DoAssert
        return next();
      },
      function(){
        r.quit();
      }
  );//handy.pipeline
};//utest_getDateIdsOnZset



var utest_getUserIdByFieldsValueRegexp = function (params,next) {
  handy.log('blue', "running utest_getUserIdByFieldsValueRegexp");
  var r = redis.create();


  handy.pipeline(
      function(next){
        console.log("\nclean db.");
        r.clean({all:true, excludeFilter:null},function(err){
          assert.ifError(err);
          return next();
        });//clean
      },

      function(next){
        console.log("\nprepareData");
        config.config.needNotCheckInviteCode = true;
        r.registerEmailAccount({emailAccount:"m1@abc.com",password:"111111",inviteCode:null,
        name:"m1",gender:"male",school:"北京大学",deviceType:"android"},function(err){
          assert.ifError(err);
          return next();
        });
      },
      function(next){
        console.log("\nprepareData");
        config.config.needNotCheckInviteCode = true;
        r.registerEmailAccount({emailAccount:"m2@abc.com",password:"111111",inviteCode:null,
        name:"m2",gender:"male",school:"北京大学",deviceType:"iphone"},function(err){
          assert.ifError(err);
          return next();
        });
      },
      function(next){
        console.log("\nprepareData");
        config.config.needNotCheckInviteCode = true;
        r.registerEmailAccount({emailAccount:"f1@abc.com",password:"111111",inviteCode:null,
        name:"f1",gender:"female",school:"北京大学",deviceType:"android"},function(err){
          assert.ifError(err);
          return next();
        });
      },
      function(next){
        console.log("\nprepareData");
        config.config.needNotCheckInviteCode = true;
        r.registerEmailAccount({emailAccount:"f2@abc.com",password:"111111",inviteCode:null,
        name:"f2",gender:"female",school:"北京大学",deviceType:"iphone"},function(err){
          assert.ifError(err);
          return next();
        });
      },

      function(next){
        console.log("\ngetUserIdByFieldsValueRegexp male");
        r.getUserIdByFieldsValueRegexp({userFieldInfos:[{fieldName:"gender", fieldValueRegexp:"\\bmale"}]},function(err,userIds){
          assert.ifError(err);
          console.log("userIds="+util.inspect(userIds,false,100));
          return next();
        });
      },
      function(next){
        console.log("\ngetUserIdByFieldsValueRegexp female");
        r.getUserIdByFieldsValueRegexp({userFieldInfos:[{fieldName:"gender", fieldValueRegexp:"female"}]},function(err,userIds){
          assert.ifError(err);
          console.log("userIds="+util.inspect(userIds,false,100));
          return next();
        });
      },
      function(next){
        console.log("\ngetUserIdByFieldsValueRegexp iphone");
        r.getUserIdByFieldsValueRegexp({userFieldInfos:[{fieldName:"deviceType", fieldValueRegexp:"iphone"}]},function(err,userIds){
          assert.ifError(err);
          console.log("userIds="+util.inspect(userIds,false,100));
          return next();
        });
      },
      function(next){
        console.log("\ngetUserIdByFieldsValueRegexp female iphone");
        r.getUserIdByFieldsValueRegexp({userFieldInfos:[{fieldName:"gender", fieldValueRegexp:"female"},{fieldName:"deviceType", fieldValueRegexp:"iphone"}]},function(err,userIds){
          assert.ifError(err);
          console.log("userIds="+util.inspect(userIds,false,100));
          return next();
        });
      },


      function(next){
        //DoAssert
        return next();
      },
      function(){
        r.quit();
      }
  );//handy.pipeline
};//utest_getUserIdByFieldsValueRegexp













//utestGetRegionalRecentPhotoIds(null,null);
//utestGetRegionalHotPhotoIds(null,null);
//utest_shiftToNotifyDate(null,null);
//utest_shiftToNotifyDate2(null,null);
//utest_markDatesNotifyInfo(null,null);
//utest_getDateIdsOnZset();
utest_getUserIdByFieldsValueRegexp();












