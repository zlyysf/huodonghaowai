

var assert = require('assert');
var util = require('util');
var path = require('path');

var handy = require('../lib/handy');
var tool = require("../lib/tool");
var config = require('../lib/config');
var server = require('../lib/server');
var redis = require('../lib/redis');
var auth = require('../lib/auth');
var notification = require('../lib/notification');


var testlib = require('./testlib');



var gPassword = "password";
var gC2dmAuth = "DQAAALsAAABL_JFHfd303zDBZlUdx7RwRYBYJRoJOU67TDgMBC-R2Qp2j5G6o1m92bVJNIKAmPjdShe-lhOlDREQJ_aZznU6_yvnlIUV9zFGu1ZP9jNHYQ0kZi6BktIx6kqgDTBshTKP084Eg3C3JJv_e0TJtjEuArmWZ3NJJ-PhL9ASDKbL0nFIoEQ1-2cclqU6vRDe4iggv2w0TxpdJYdW-GEQlfCryRNXFR--qlbPF9tgSaKr5niJ6ibITfUkP2H3AFME8yw";

var gRegistrationId  = "APA91bF_02mUEIo9Y95EE05jkAxaq0t7crOydnTAW1Fh6ykRP0J-ZRNlsGCWS7qzoWDE6L50JVCC00KUzf-fsUaTEwcrDvgF3vBlGVlmzqrothupB64zLBiViWY_9HLARUKkCg42IUxp_aPpaKL67_cN3yWufSpYCgJ9F6PhPj7Ag9V1LFtgSLc";//gf moniqi
//var gRegistrationId  = "APA91bF_02mUEIo9Y95EE05jkAxaq0t7crOydnTAW1Fh6ykRP0J-ZRNlsGCWS7qzoWDE6L50JVCC00KUzf-fsUaTEwcrDvgF3vBlGVlmzqrothupB64zLBiViWY_9HLARUKkCg42IUxp_aPpaKL67_cN3yWufSpYCgJ9F6PhPj7Ag9V1LFtgSLc";//gf
var gRegistrationId2 = "";
var gRegistrationId3 = "";
//var gDeviceToken = "c45681705981607ea76f57ec166405b2231db1c5fed020c1abd6024563b08cb7";
var gDeviceToken = "f2c96f7246dbaa7ad155ba5714287b62a10417392fc5b4157c1f060b77c8777a";//  -- lm
var gDeviceToken2 = "ec0a620af3b17a0a8350dfa6a67ef1f88e43f8b3d4deb94593fca1e9170d3c49";//  -- bj


var gLatlng1 = "39.976684,116.339936";
var gLatlng2 = "39.631936,118.188";

var gRegionByGoogle1 = {"address_components":[{"long_name" : "Haidian", "types" : [ "sublocality", "political" ]},
                                              {"long_name" : "Beijing", "types" : [ "locality", "political" ]},{"long_name" : "Beijing", "types" : [ "administrative_area_level_1", "political" ]},
                                              {"long_name" : "China","short_name" : "CN","types" : [ "country", "political" ]}]};
var gRegionByGoogle2 = {"address_components":[{"long_name" : "Lubei", "types" : [ "sublocality", "political" ]},
                                              {"long_name" : "Tangshan", "types" : [ "locality", "political" ]},{"long_name" : "Hebei", "types" : [ "administrative_area_level_1", "political" ]},
                                              {"long_name" : "China","short_name" : "CN","types" : [ "country", "political" ]}]};
//var gRegionByIos1 = {CountryCode:'CN',State:'Beijing',City:'Beijing'};
//var gRegionByIos2 = {CountryCode:'CN',State:'Hebei',City:'Tangshan'};
var gRegionByAndroid1 = {countryCode:'CN',admin:'Beijing',locality:'Beijing', countryName:'China', addressLines:["101 hao Zhongguancun East Rd","Haidian, Beijing","China"]};
var gRegionByAndroid2 = {countryCode:'CN',admin:'Hebei',locality:'Tangshan'};
var gCityLocation1 = "CN+Beijing+Beijing";
var gCityLocation2 = "CN+Hebei+Tangshan";
//var gGeolibTypeIos = 'ios';
var gGeolibTypeGoogle = 'googleV3';
var gGeolibTypeAndroid = 'android';

var gDeviceType = 'iphone';
var gDeviceTypeIphone = 'iphone';
var gDeviceTypeAndroid = 'android';

var gDeviceId = "deviceId";

var gMailHostPart = "@abc.com";
var gSchool = "北京大学";

var gUploadPhotoPath = path.join(__dirname,"./resourceFile/draw.png");

//THIS need some browsers connect to the server to provide client sockets


var host = 'localhost';
//var host = 'ec2-50-17-172-94.compute-1.amazonaws.com';
var envSpecialConfig = config.getEnvConfig();
var port = envSpecialConfig.port;//4000;
var securePort = envSpecialConfig.securePort;//4010;

var waitMsTimeOfSoon = 10;
var waitMsTimeOfConnectApns = 3000;
var waitMsTimeOfSendNotification = 3000;
var waitMsTimeOfSendApnsNotification = 3000;
var waitMsTimeOfSendC2dmNotification = 3000;


var setAmazonWaitTime = function (){
  //testlib.config.waitMsTimeOfServerStart = 1000;
  //testlib.config.waitMsTimeOfServerStop = 100;

  testlib.config.waitMsTimeOfUserBind = 200;
  testlib.config.waitMsTimeOfUserRegister = 100;
  testlib.config.waitMsTimeOfUserCreateTopic = 200;
  testlib.config.waitMsTimeOfUserDeleteTopic = 200;
  testlib.config.waitMsTimeOfUserJoinTopic = 200;
  testlib.config.waitMsTimeOfUserPostMessage = 200;
  testlib.config.waitMsTimeOfUserGetTopic = 1;
  testlib.config.waitMsTimeOfTopicGetChatters = 1;
  testlib.config.waitMsTimeOfTopicGetMessages = 1;
  testlib.config.waitMsTimeOfUserGetInfo = 1;
  testlib.config.waitMsTimeOfUserUpdateAppToken = 10;

  testlib.config.waitMsTimeOfClientClose = 100;
  testlib.config.waitMsTimeOfClientsClose = 1000;

  testlib.config.waitMsTimeOfExpireTopics = 1000;
};//setAmazonWaitTime




function testJustStartStopServer(params,next){
  handy.log('blue', "running testJustStartStopServer");
  testlib.provideServerLifeCycle(
    {port:port,securePort:securePort,needInitStore:false, NeedSetConfigDefault:true},
    function(cbNext){
      util.log("in server lifecycle");
      if (cbNext) cbNext();
    },
    next
  );
};//testJustStartStopServer







/**
*
* @param params - contains (optional)port, ..
*     @see busRegister1
* @param next - is function(next)
*/
function testRegister1LocalBothSides(params,next){
  handy.log('blue', "running testRegister1LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testRegister1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testRegister1LocalBothSides

/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busRegister1
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testRegister1ClientSide(params,cbFun){
  handy.log('blue', "testRegister1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busRegister1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busRegister1
}//testRegister1ClientSide

/**
 *
 * @param params - contains host,port; (optional) emailAccount,password,name,height,gender
 * @param cbFun - is function(outData)
 *   outData contains deviceId,addDeviceOutData,addUserOutData
 */
function busRegister1(params,cbFun){
    handy.log('blue', "busRegister1 enter");
    assert.ok(params.host);
    assert.ok(params.port);
    assert.ok(params.securePort);
    var host = params.host;
    var port = params.port;
    var securePort = params.securePort;
    var uploadReally = params.uploadReally;


    var emailAccount = params.emailAccount;
    var password = params.password;
    var name = params.name;
    var height = params.height;
    var gender = params.gender;
    var deviceType = params.deviceType;
    var deviceId = "deviceId";

    var inviteCode = null, inviteCode2 = null;

    var nowTime = handy.getNowOfUTCdate().getTime();
    var name = "name"+nowTime;
    var emailAccount = name+gMailHostPart;
    var password = gPassword;
    var gender = 'male';
    var school = gSchool;
    var deviceType = gDeviceType;
    //var studentNO = 'studentNO';
    var height = 1.61;
    var height1_2 = 1.62;
    var bloodGroup = "bloodGroup";

    var passwordNew = password+"2";

    var name2 = "name2"+nowTime;
    var emailAccount2 = name2+gMailHostPart;
    var password2 = gPassword;
    var gender2 = 'female';
    var school2 = gSchool;
    var height2 = 1.72;
    var deviceType2 = gDeviceTypeAndroid;

    var name3 = "name3"+nowTime;
    var emailAccount3 = name3+gMailHostPart;
    var password3 = gPassword;
    var gender3 = 'female';
    var school3 = gSchool;
    var height3 = 1.73;
    var deviceType3 = gDeviceTypeAndroid;

    var userId = null,userId1_2, userId2, userId3;
    var photoIdU1_2;
    var notExistUserId = 'notExistUserId';
    handy.pipeline(

        function(next){
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/register',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount, password:password, name:name,gender:gender,
          school:school, deviceType:deviceType, deviceId:deviceId}},function(err,outData){
            assert.ok(outData.status=="success");
            userId = outData.result.userId;
            next();
          });
        },

        function(next){
          console.log("\nnormal logout 1, should ok.");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/logOut',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },
        function(next){
          console.log("\nlogout again, should fail.");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/logOut',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            assert.ok(outData.status=="fail");
            next();
          });
        },

        function(next){
          console.log("\nlogIn with blank pwd, should fail.");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount, password:'',deviceType:deviceType,deviceId:deviceId}},function(err,outData){
            assert.ok(outData.status=="fail");
            next();
          });
        },
        function(next){
          console.log("\nlogIn with wrong pwd, should fail.");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount, password:password+"wrong",deviceType:deviceType,deviceId:deviceId}},function(err,outData){
            assert.ok(outData.status=="fail");
            next();
          });
        },
        function(next){
          console.log("\nlogIn with right pwd, should ok.");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount, password:password,deviceType:deviceType,deviceId:deviceId}},function(err,outData){
            assert.ok(outData.status=="success");
            userId1_2 = outData.result.userId;
            assert.ok(userId == userId1_2);
            next();
          });
        },

        function(next){
          console.log("\nnormal update profile, should ok.");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/updateProfile',notLogResponseHere:null,
          postDataObj:{userId:userId,height:height1_2, bloodGroup:bloodGroup, department:null, educationalStatus:'educationalStatus', constellation:'', hometown:'hometown'}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },
        function(next){
          console.log("\nget user after normal update profile");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/getUser',notLogResponseHere:null,
          postDataObj:{userId:userId,targetUserId:userId}},function(err,outData){
            assert.ok(outData.status=="success");
            assert.ok(outData.result.height==height1_2);
            assert.ok(outData.result.bloodGroup==bloodGroup);
            next();
          });
        },
        function(next){
          console.log("\nupdate profile without param, still success.");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/updateProfile',notLogResponseHere:null,
          postDataObj:{userId:userId}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },


        function(next){
          testlib.runPRApiUploadPhoto({host:host,port:port,waitMsTimeForApiBackground:null,notLogResponseHere:null,
            postDataObj:{userId:userId,notUploadReally:!uploadReally, image:gUploadPhotoPath,width:900,height:800}},function(err,outData){
              assert.ifError(err);
              assert.ok(outData.status=="success");
              if (next) next();
            });//runCurlCmdForUploadPhoto
        },
        function(next){
          console.log("\nlogIn , should return many user fields include primaryPhoto.");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount, password:password,deviceType:deviceType,deviceId:deviceId}},function(err,outData){
            assert.ok(outData.status=="success");
            assert.ok(outData.result.name);
            assert.ok(outData.result.primaryPhotoId);
            assert.ok(outData.result.primaryPhotoPath);
            assert.ok(outData.result.school);
            next();
          });
        },

        function(next){
          console.log("\nupdate profile with photo, should ok.");
          //Notice!!! can not pass null value param in postDataObj
          testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/updateProfileWithPhoto',notLogResponseHere:null,
          postDataObj:{
            userId:userId,height:height1_2, bloodGroup:bloodGroup, department:"", educationalStatus:'educationalStatus', constellation:'', hometown:'hometown',
            notUploadReally:!uploadReally, image:gUploadPhotoPath,imgWidth:900,imgHeight:800
          }},function(err,outData){
            assert.ok(outData.status=="success");
            photoIdU1_2 = outData.result.photoId;
            assert.ok(photoIdU1_2);
            next();
          });
        },
        function(next){
          console.log("\nget user after update profile with photo");
          testlib.runPRApi({host:host,port:port,path:'/user/getUser',notLogResponseHere:null,
          postDataObj:{userId:userId,targetUserId:userId}},function(err,outData){
            assert.ok(outData.status=="success");
            assert.ok(outData.result.name);
            assert.ok(outData.result.gender);
            assert.ok(outData.result.primaryPhotoId);
            assert.ok(outData.result.primaryPhotoPath);
            assert.ok(outData.result.primaryPhotoId == photoIdU1_2);
            assert.ok(outData.result.height == height1_2);
            next();
          });
        },

        function(next){
          console.log("\nresetPassword with wrong pwd, should fail.");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/resetPassword',notLogResponseHere:null,
          postDataObj:{userId:userId,oldPassword:password+"wrong", newPassword:passwordNew}},function(err,outData){
            assert.ok(outData.status=="fail");
            next();
          });
        },
        function(next){
          console.log("\nresetPassword with right pwd, should ok.");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/resetPassword',notLogResponseHere:null,
          postDataObj:{userId:userId,oldPassword:password, newPassword:passwordNew}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },

        function(next){
          console.log("\nlogIn with new pwd, should ok.");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount, password:passwordNew,deviceType:deviceType,deviceId:deviceId}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },

        function(next){
          console.log("\nnormal logout 2, should ok.");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/logOut',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },

        function(next){
          console.log("\n user normal logIn , should ok.");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount, password:passwordNew,deviceType:deviceType,deviceId:deviceId}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },

        function(next){
          console.log("\ndiable 2nd user , should ok.");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/admin/runMethod',notLogResponseHere:null,
          postDataObj:{methodName:'disableUser', userId:userId, disableUser:true}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },
        function(next){
          console.log("\ndisabled user logIn 21, should fail.");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount, password:passwordNew,deviceType:deviceType,deviceId:deviceId}},function(err,outData){
            assert.ok(outData.status=="fail");
            next();
          });
        },


        function(next){
          console.log("\nenable user , should ok.");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/admin/runMethod',notLogResponseHere:null,
          postDataObj:{methodName:'disableUser', userId:userId, disableUser:false}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },
        function(next){
          console.log("\nenabled user logIn 22, should ok.");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount, password:passwordNew,deviceType:deviceType,deviceId:deviceId}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },

        function(next){
          console.log("\ntest logout clear apptoken, first set it.");
          testlib.runPRApi({host:host,port:port,path:'/user/updateAppToken',notLogResponseHere:null,
          postDataObj:{userId:userId, appToken:gDeviceToken}},
          function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },
        function(next){
          console.log("\nuser has the apptoken");
          testlib.runPRApi({host:host,port:port,path:'/admin/runMethod',notLogResponseHere:null,
          postDataObj:{libName:'store',methodName:'getUserAppToken', userId:userId}},
          function(err,outData){
            assert.ok(outData.status=="success");
            assert.ok(outData.result==gDeviceToken);
            next();
          });
        },

        function(next){
          console.log("\n user normal logout 21, should ok.");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/logOut',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },
        function(next){
          console.log("\nuser should have not the apptoken");
          testlib.runPRApi({host:host,port:port,path:'/admin/runMethod',notLogResponseHere:null,
          postDataObj:{libName:'store',methodName:'getUserAppToken', userId:userId}},
          function(err,outData){
            assert.ok(outData.status=="success");
            assert.ok(!outData.result || !outData.result.data);
            next();
          });
        },



        function(next){
          //DoAssert
          next();
        },
        function(){
          var outData = {};
          if (cbFun) cbFun(outData);
        }
    );//handy.pipeline
}//busRegister1




/**
*
* @param params - contains (optional)port, ..
*     @see busRenRenRegisterAndLogin1
* @param next - is function(next)
*/
function testRenRenRegisterAndLogin1LocalBothSides(params,next){
  handy.log('blue', "running testRenRenRegisterAndLogin1LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testRenRenRegisterAndLogin1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testRenRenRegisterAndLogin1LocalBothSides

/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busRenRenRegisterAndLogin1
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testRenRenRegisterAndLogin1ClientSide(params,cbFun){
  handy.log('blue', "testRenRenRegisterAndLogin1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busRenRenRegisterAndLogin1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busRenRenRegisterAndLogin1
}//testRenRenRegisterAndLogin1ClientSide

/**
 *
 * @param params - contains host,port; (optional) emailAccount,password,name,height,gender
 * @param cbFun - is function(outData)
 *   outData contains deviceId,addDeviceOutData,addUserOutData
 */
function busRenRenRegisterAndLogin1(params,cbFun){
    handy.log('blue', "busRenRenRegisterAndLogin1 enter");
    assert.ok(params.host);
    assert.ok(params.port);
    assert.ok(params.securePort);
    var host = params.host;
    var port = params.port;
    var securePort = params.securePort;
    var uploadReally = params.uploadReally;

    var nowTime = handy.getNowOfUTCdate().getTime();
    var name = "name"+nowTime;
    var emailAccount = name+gMailHostPart;
    var password = gPassword;
    var accountRenRen = "accountRenRen";
    var accessTokenRenRen = "accessTokenRenRen";
    var accountInfoJson = "accountInfoJson";
    var gender = 'male';
    var school = gSchool;
    var deviceType = gDeviceType;
    var deviceId = "deviceId";
    var hometown = "hometown";
    //var studentNO = 'studentNO';
    var height = 1.61;
    var height1_2 = 1.62;
    var bloodGroup = "bloodGroup";


    var userId = null;
    var photoIdU1_2;

    handy.pipeline(
        function(next){
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/register',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount, password:password, name:name, gender:gender,
          school:school, deviceType:deviceType, deviceId:deviceId, hometown:hometown,
          accountRenRen:accountRenRen, accessTokenRenRen:accessTokenRenRen, accountInfoJson:accountInfoJson}},function(err,outData){
            assert.ok(outData.status=="success");
            userId = outData.result.userId;
            next();
          });
        },
        function(next){
          console.log("\nnormal logout 1, should ok.");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/logOut',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },

        function(next){
          console.log("\nnormal logIn, should ok.");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount, password:password,deviceType:deviceType,deviceId:deviceId}},function(err,outData){
            assert.ok(outData.status=="success");
            assert.ok(userId == outData.result.userId);
            next();
          });
        },
        function(next){
          console.log("\nnormal logout 2, should ok.");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/logOut',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },

        function(next){
          console.log("\nnormal logInFromRenRen, should ok.");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logInFromRenRen',notLogResponseHere:null,
          postDataObj:{accountRenRen:accountRenRen, accessTokenRenRen:accessTokenRenRen,deviceType:deviceType,deviceId:deviceId}},function(err,outData){
            assert.ok(outData.status=="success");
            assert.ok(outData.result.userExist);
            assert.ok(userId == outData.result.user.userId);
            next();
          });
        },

        function(next){
          console.log("\nlogInFromRenRen with not registered renren user, should ok but return user not exist.");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logInFromRenRen',notLogResponseHere:null,
          postDataObj:{accountRenRen:accountRenRen+"XX", accessTokenRenRen:accessTokenRenRen,deviceType:deviceType,deviceId:deviceId}},function(err,outData){
            assert.ok(outData.status=="success");
            assert.ok(!outData.result.userExist);
            next();
          });
        },


        function(next){
          //DoAssert
          next();
        },
        function(){
          var outData = {};
          if (cbFun) cbFun(outData);
        }
    );//handy.pipeline
}//busRenRenRegisterAndLogin1




/**
*
* @param params - contains (optional)port, ..
*     @see busUploadPhoto1
* @param next - is function(next)
*/
function testUploadPhoto1LocalBothSides(params,next){
  handy.log('blue', "running testUploadPhoto1LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testUploadPhoto1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testUploadPhoto1LocalBothSides

/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busUploadPhoto1
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testUploadPhoto1ClientSide(params,cbFun){
  handy.log('blue', "testUploadPhoto1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busUploadPhoto1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busUploadPhoto1
}//testUploadPhoto1ClientSide

/**
 *
 * @param params - contains host,port; (optional) emailAccount,password,name,height,gender
 * @param cbFun - is function(outData)
 *   outData contains deviceId,addDeviceOutData,addUserOutData
 */
function busUploadPhoto1(params,cbFun){
    handy.log('blue', "busUploadPhoto1 enter");
    assert.ok(params.host);
    assert.ok(params.port);
    assert.ok(params.securePort);
    var host = params.host;
    var port = params.port;
    var securePort = params.securePort;
    var uploadReally = params.uploadReally;


    var emailAccount = params.emailAccount;
    var password = params.password;
    var name = params.name;
    var height = params.height;
    var gender = params.gender;
    var deviceType = params.deviceType;
    var deviceId = "deviceId";

    var inviteCode = null, inviteCode2 = null;

    var nowTime = handy.getNowOfUTCdate().getTime();
    var name = "name"+nowTime;
    var emailAccount = name+gMailHostPart;
    var password = gPassword;
    var gender = 'male';
    var school = gSchool;
    var deviceType = gDeviceType;
    //var studentNO = 'studentNO';
    var height = 1.61;
    var bloodGroup = "bloodGroup";

    var userId = null;
    handy.pipeline(
        function(next){
          console.log("\nnormal get invite code");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/generateInviteCode',notLogResponseHere:null,
          postDataObj:{expireDays:1}},function(err,outData){
            assert.ok(outData.status=="success");
            inviteCode = outData.result.inviteCode;
            next();
          });
        },

        function(next){
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/register',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount, inviteCode:inviteCode, password:password, name:name,gender:gender,
          school:school, deviceType:deviceType, deviceId:deviceId}},function(err,outData){
            assert.ok(outData.status=="success");
            userId = outData.result.userId;
            next();
          });
        },


        function(next){
          testlib.runPRApiUploadPhoto({host:host,port:port,waitMsTimeForApiBackground:null,notLogResponseHere:null,
            postDataObj:{userId:userId,notUploadReally:!uploadReally, image:gUploadPhotoPath,width:900,height:800}},function(err,outData){
              assert.ifError(err);
              assert.ok(outData.status=="success");
              if (next) next();
            });//runCurlCmdForUploadPhoto
        },
        function(next){
          console.log("\nlogIn , should return many user fields include primaryPhoto.");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount, password:password,deviceType:deviceType,deviceId:deviceId}},function(err,outData){
            assert.ok(outData.status=="success");
            assert.ok(outData.result.name);
            assert.ok(outData.result.primaryPhotoId);
            assert.ok(outData.result.primaryPhotoPath);
            next();
          });
        },


        function(next){
          //DoAssert
          next();
        },
        function(){
          var outData = {};
          if (cbFun) cbFun(outData);
        }
    );//handy.pipeline
}//busUploadPhoto1






/**
*
* @param params - contains (optional)port, ..
*     @see busSession1
* @param next - is function(next)
*/
function testSession1LocalBothSides(params,next){
  handy.log('blue', "running testSession1LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testSession1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testSession1LocalBothSides

/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busSession1
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testSession1ClientSide(params,cbFun){
  handy.log('blue', "testSession1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busSession1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busSession1
}//testSession1ClientSide

/**
 *
 * @param params - contains host,port; (optional) emailAccount,password,name,height,gender
 * @param cbFun - is function(outData)
 *   outData contains deviceId,addDeviceOutData,addUserOutData
 */
function busSession1(params,cbFun){
    handy.log('blue', "busSession1 enter");
    assert.ok(params.host);
    assert.ok(params.port);
    assert.ok(params.securePort);
    var host = params.host;
    var port = params.port;
    var securePort = params.securePort;
    var uploadReally = params.uploadReally;

    var emailAccount = params.emailAccount;
    var password = params.password;
    var name = params.name;
    var height = params.height;
    var gender = params.gender;
    var deviceType = params.deviceType;

    var nowTime = handy.getNowOfUTCdate().getTime();
    var name = "name"+nowTime;
    var emailAccount = "lianyu.zhang+t1@yasofon.com"; //name+gMailHostPart;
    var password = 'password';
    var height = 175;
    var gender = 'male';
    var deviceType = gDeviceType;
    var school = "北京大学";

    var passwordNew = password+"2";

    var name2 = "name2"+nowTime;
    var emailAccount2 = name2+gMailHostPart;
    var password2 = 'password';
    var height2 = 175;
    var gender2 = 'female';
    var deviceType2 = gDeviceTypeAndroid;

    var userId = null,userId1_2, userId2;
    var notExistUserId = 'notExistUserId';
    handy.pipeline(
        function(next){
          console.log("\ntry not logIn user to logOut, should fail");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/logOut',notLogResponseHere:null,
          postDataObj:{userId:notExistUserId}},function(err,outData){
            assert.ok(outData.status=="fail");
            next();
          });
        },

        function(next){
          console.log("\nnormal register, should succeed");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/register',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount, password:password, name:name,height:height,gender:gender,deviceType:deviceType,deviceId:gDeviceId, school:school}},function(err,outData){
            assert.ok(outData.status=="success");
            userId = outData.result.userId;
            next();
          });
        },

        function(next){
          console.log("\ntry already logIn user to logOut,, not provide userId, should succeed.");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/logOut',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },

        function(next){
          console.log("\nlogout again, should fail.");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/logOut',notLogResponseHere:null,
          postDataObj:{userId:userId}},function(err,outData){
            assert.ok(outData.status=="fail");
            next();
          });
        },

        function(next){
          console.log("\nlogIn with blank pwd, should fail.");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount, password:'',deviceType:deviceType,deviceId:gDeviceId}},function(err,outData){
            assert.ok(outData.status=="fail");
            next();
          });
        },
        function(next){
          console.log("\nlogIn with wrong pwd, should fail.");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount, password:password+"wrong",deviceType:deviceType,deviceId:gDeviceId}},function(err,outData){
            assert.ok(outData.status=="fail");
            next();
          });
        },
        function(next){
          console.log("\nlogIn with right pwd, should ok.");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount, password:password,deviceType:deviceType,deviceId:gDeviceId}},function(err,outData){
            assert.ok(outData.status=="success");
            userId1_2 = outData.result.userId;
            assert.ok(userId == userId1_2);
            next();
          });
        },

        function(next){
          console.log("\nresetPassword with wrong pwd, should fail.");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/resetPassword',notLogResponseHere:null,
          postDataObj:{userId:userId, oldPassword:password+"wrong", newPassword:passwordNew}},function(err,outData){
            assert.ok(outData.status=="fail");
            next();
          });
        },
        function(next){
          console.log("\nresetPassword with right pwd, should ok.");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/resetPassword',notLogResponseHere:null,
          postDataObj:{userId:userId, oldPassword:password, newPassword:passwordNew}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },

        function(next){
          console.log("\nlogIn with new pwd, should ok.");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount, password:passwordNew,deviceType:deviceType,deviceId:gDeviceId}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },

        function(next){
          console.log("\nnormal logout 2, should ok.");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/logOut',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },

        function(next){
          //DoAssert
          next();
        },
        function(){
          var outData = {};
          if (cbFun) cbFun(outData);
        }
    );//handy.pipeline
}//busSession1



/**
*
* @param params - contains (optional)port, ..
* @param next - is function(next)
*/
function testCountInvitingUser1LocalBothSides(params,next){
  handy.log('blue', "running testCountInvitingUser1LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testCountInvitingUser1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testCountInvitingUser1LocalBothSides

/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busCountInvitingUser1
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testCountInvitingUser1ClientSide(params,cbFun){
  handy.log('blue', "testCountInvitingUser1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busCountInvitingUser1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busCountInvitingUser1
}//testCountInvitingUser1ClientSide

/**
 *
 * @param params - contains host,port; (optional) emailAccount,password,name,height,gender
 * @param cbFun - is function(outData)
 *   outData contains deviceId,addDeviceOutData,addUserOutData
 */
function busCountInvitingUser1(params,cbFun){
    handy.log('blue', "busCountInvitingUser1 enter");
    assert.ok(params.host);
    assert.ok(params.port);
    assert.ok(params.securePort);
    var host = params.host;
    var port = params.port;
    var securePort = params.securePort;
    var uploadReally = params.uploadReally;

    var emailAccount = params.emailAccount;
    var password = params.password;
    var name = params.name;
    var height = params.height;
    var gender = params.gender;
    var deviceType = params.deviceType;

    var nowTime = handy.getNowOfUTCdate().getTime();

    var height = 175;
    var gender = 'male';
    var deviceType = gDeviceType;
    var school = "北京大学";

    var name1 = "name1";
    var emailAccount1 = "lianyu.zhang+test1@yasofon.com";
    var deviceId1 = "deviceId1";

    var name2 = "name2";
    var emailAccount2 = "lianyu.zhang+test2@yasofon.com";
    var deviceId2 = "deviceId2";

    var name3 = "name3";
    var emailAccount3 = "lianyu.zhang+test3@yasofon.com";
    var deviceId3 = "deviceId3";

    var name4 = "name4";
    var emailAccount4 = "lianyu.zhang+test4@yasofon.com";
    var deviceId4 = "deviceId45";

    var name5 = "name5";
    var emailAccount5 = "lianyu.zhang+test5@yasofon.com";
    var deviceId5 = "deviceId45";

    var name6 = "name6";
    var emailAccount6 = "lianyu.zhang+test6@yasofon.com";
    var deviceId6 = "deviceId6";

    var name7 = "name7";
    var emailAccount7 = "lianyu.zhang+test7@yasofon.com";
    var deviceId7 = "deviceId7";

    var name8 = "name8";
    var emailAccount8 = "lianyu.zhang+test8@yasofon.com";
    var deviceId8 = "deviceId8";

    var name9 = "name9";
    var emailAccount9 = "lianyu.zhang+test9@yasofon.com";
    var deviceId9 = "deviceId9";

    var name10 = "name10";
    var emailAccount10 = "lianyu.zhang+test10@yasofon.com";
    var deviceId10 = "deviceId10_11";

    var name11 = "name11";
    var emailAccount11 = "lianyu.zhang+test11@yasofon.com";
    var deviceId11 = "deviceId10_11";

    var userId1, userId2_bySys, userId3_bySys, userId4_byu1, userId5_byu1, userId6_byu2, userId7_byu2, userId8_byu2,
      userId9_byu2, userId10_byu2, userId11_byu2;

    var inviteCode_sys1, inviteCodes_u1, inviteCodes_u2, inviteCodes_u3;

    handy.pipeline(
        function(next){
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/generateInviteCode',notLogResponseHere:null,
          postDataObj:{expireDays:1}},function(err,outData){
            assert.ok(outData.status=="success");
            inviteCode_sys1 = outData.result.inviteCode;
            next();
          });
        },

        function(next){
          console.log("\nnormal register, should succeed");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/register',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount1, password:gPassword, name:name1, height:height,gender:gender,deviceType:deviceType,deviceId:deviceId1, school:school}},function(err,outData){
            assert.ok(outData.status=="success");
            userId1 = outData.result.userId;
            next();
          });
        },
        function(next){
          console.log("\nnormal register, should succeed");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/register',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount2, password:gPassword, name:name2, inviteCode:inviteCode_sys1, height:height,gender:gender,deviceType:deviceType,deviceId:deviceId2, school:school}},function(err,outData){
            assert.ok(outData.status=="success");
            userId2_bySys = outData.result.userId;
            next();
          });
        },
        function(next){
          console.log("\nnormal register, should succeed");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/register',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount3, password:gPassword, name:name3, inviteCode:inviteCode_sys1, height:height,gender:gender,deviceType:deviceType,deviceId:deviceId3, school:school}},function(err,outData){
            assert.ok(outData.status=="success");
            userId3_bySys = outData.result.userId;
            next();
          });
        },

        function(next){
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/logOut',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },

        function(next){
          console.log("\nuserId1 logIn");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount1, password:gPassword,deviceType:deviceType,deviceId:deviceId1}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },
        function(next){
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/generateInviteCode',notLogResponseHere:null,
          postDataObj:{count:10}},function(err,outData){
            assert.ok(outData.status=="success");
            inviteCodes_u1 = outData.result.inviteCodes;
            next();
          });
        },
        function(next){
          console.log("\nnormal register, should succeed");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/register',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount4, password:gPassword, name:name4, inviteCode:inviteCodes_u1[0], height:height,gender:gender,deviceType:deviceType,deviceId:deviceId4, school:school}},function(err,outData){
            assert.ok(outData.status=="success");
            userId4_byu1 = outData.result.userId;
            next();
          });
        },
        function(next){
          console.log("\nnormal register, should succeed");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/register',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount5, password:gPassword, name:name5, inviteCode:inviteCodes_u1[1], height:height,gender:gender,deviceType:deviceType,deviceId:deviceId5, school:school}},function(err,outData){
            assert.ok(outData.status=="success");
            userId5_byu1 = outData.result.userId;
            next();
          });
        },

        function(next){
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/logOut',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },

        function(next){
          console.log("\nuserId2 logIn");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount2, password:gPassword,deviceType:deviceType,deviceId:deviceId2}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },
        function(next){
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/generateInviteCode',notLogResponseHere:null,
          postDataObj:{count:10}},function(err,outData){
            assert.ok(outData.status=="success");
            inviteCodes_u2 = outData.result.inviteCodes;
            next();
          });
        },
        function(next){
          console.log("\nnormal register, should succeed");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/register',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount6, password:gPassword, name:name6, inviteCode:inviteCodes_u2[0], height:height,gender:gender,deviceType:deviceType,deviceId:deviceId6, school:school}},function(err,outData){
            assert.ok(outData.status=="success");
            userId6_byu2 = outData.result.userId;
            next();
          });
        },
        function(next){
          console.log("\nnormal register, should succeed");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/register',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount7, password:gPassword, name:name7, inviteCode:inviteCodes_u2[1], height:height,gender:gender,deviceType:deviceType,deviceId:deviceId7, school:school}},function(err,outData){
            assert.ok(outData.status=="success");
            userId7_byu2 = outData.result.userId;
            next();
          });
        },
        function(next){
          console.log("\nnormal register, should succeed");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/register',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount8, password:gPassword, name:name8, inviteCode:inviteCodes_u2[2], height:height,gender:gender,deviceType:deviceType,deviceId:deviceId8, school:school}},function(err,outData){
            assert.ok(outData.status=="success");
            userId8_byu2 = outData.result.userId;
            next();
          });
        },


        function(next){
          console.log("\nuserId3 logIn");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount3, password:gPassword,deviceType:deviceType,deviceId:deviceId3}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },
        function(next){
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/generateInviteCode',notLogResponseHere:null,
          postDataObj:{count:10}},function(err,outData){
            assert.ok(outData.status=="success");
            inviteCodes_u3 = outData.result.inviteCodes;
            next();
          });
        },
        function(next){
          console.log("\nnormal register, should succeed");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/register',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount9, password:gPassword, name:name9, inviteCode:inviteCodes_u3[0], height:height,gender:gender,deviceType:deviceType,deviceId:deviceId9, school:school}},function(err,outData){
            assert.ok(outData.status=="success");
            userId9_byu3 = outData.result.userId;
            next();
          });
        },
        function(next){
          console.log("\nnormal register, should succeed");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/register',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount10, password:gPassword, name:name10, inviteCode:inviteCodes_u3[1], height:height,gender:gender,deviceType:deviceType,deviceId:deviceId10, school:school}},function(err,outData){
            assert.ok(outData.status=="success");
            userId10_byu3 = outData.result.userId;
            next();
          });
        },
        function(next){
          console.log("\nnormal register, should succeed");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/register',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount11, password:gPassword, name:name11, inviteCode:inviteCodes_u3[2], height:height,gender:gender,deviceType:deviceType,deviceId:deviceId11, school:school}},function(err,outData){
            assert.ok(outData.status=="success");
            userId11_byu3 = outData.result.userId;
            next();
          });
        },

        function(next){
          console.log("\nadmin/runMethod");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/admin/runMethod',notLogResponseHere:null,
          postDataObj:{libName:"store", methodName:"countInvitingUser"}},function(err,outData){
            assert.ok(outData.status=="success");

            next();
          });
        },

        function(next){
          //DoAssert
          next();
        },
        function(){
          var outData = {};
          if (cbFun) cbFun(outData);
        }
    );//handy.pipeline
}//busCountInvitingUser1




/**
*
* @param params - contains (optional)port, ..
*     @see busSession1AdminWeb
* @param next - is function(next)
*/
function testSession1AdminWebLocalBothSides(params,next){
  handy.log('blue', "running testSession1AdminWebLocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testSession1AdminWebClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testSession1AdminWebLocalBothSides

/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busSession1AdminWeb
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testSession1AdminWebClientSide(params,cbFun){
  handy.log('blue', "testSession1AdminWebClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busSession1AdminWeb(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busSession1AdminWeb
}//testSession1AdminWebClientSide

/**
 *
 * @param params - contains host,port; (optional) emailAccount,password,name,height,gender
 * @param cbFun - is function(outData)
 *   outData contains deviceId,addDeviceOutData,addUserOutData
 */
function busSession1AdminWeb(params,cbFun){
    handy.log('blue', "busSession1AdminWeb enter");
    assert.ok(params.host);
    assert.ok(params.port);
    assert.ok(params.securePort);
    var host = params.host;
    var port = params.port;
    var securePort = params.securePort;
    var uploadReally = params.uploadReally;

    var emailAccount = params.emailAccount;
    var password = params.password;
    var name = params.name;
    var height = params.height;
    var gender = params.gender;
    var deviceType = params.deviceType;

    var nowTime = handy.getNowOfUTCdate().getTime();
    var name = "name"+nowTime;
    var emailAccount = name+gMailHostPart;
    var password = 'password';
    var height = 175;
    var gender = 'male';
    var deviceType = gDeviceType;

    var passwordNew = password+"2";

    var name2 = "name2"+nowTime;
    var emailAccount2 = name2+gMailHostPart;
    var password2 = 'password';
    var height2 = 175;
    var gender2 = 'female';
    var deviceType2 = gDeviceTypeAndroid;

    var userId = null,userId1_2, userId2;
    var notExistUserId = 'notExistUserId';
    handy.pipeline(
        function(next){
          console.log("\naccess viewFunctionList before log in, should fail");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/adminWeb/functionList',notLogResponseHere:null,
          postDataObj:{returnFormat:'json'}},function(err,outData){
            assert.ok(outData.status=="fail");
            next();
          });
        },

        function(next){
          console.log("\nadmin logIn with wrong info, should fail");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/adminWeb/logIn',notLogResponseHere:null,
          postDataObj:{returnFormat:'json',login:'1',userName:'user1',password:'pwd'}},function(err,outData){
            assert.ok(outData.status=="fail");
            next();
          });
        },

        function(next){
          console.log("\nadmin logIn normal, should success");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/adminWeb/logIn',notLogResponseHere:null,
          postDataObj:{returnFormat:'json',login:'1',userName:auth.config.userPwds[0].name,password: handy.decrypt(auth.config.userPwds[0].pwd)}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },

        function(next){
          console.log("\naccess viewFunctionList after log in, should success");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/adminWeb/functionList',notLogResponseHere:null,
          postDataObj:{returnFormat:'json'}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },

        function(next){
          console.log("\nnormal logout, should success");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/adminWeb/logOut',notLogResponseHere:null,
          postDataObj:{returnFormat:'json'}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },

        function(next){
          console.log("\naccess viewFunctionList after log out, should fail");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/adminWeb/functionList',notLogResponseHere:null,
          postDataObj:{returnFormat:'json'}},function(err,outData){
            assert.ok(outData.status=="fail");
            next();
          });
        },

        function(next){
          //DoAssert
          next();
        },
        function(){
          var outData = {};
          if (cbFun) cbFun(outData);
        }
    );//handy.pipeline
}//busSession1AdminWeb




/**
*
* @param params - contains (optional)port, ..
*     @see busAddDeviceAndUser
* @param next - is function(next)
*/
function testDateBasic1LocalBothSides(params,next){
  handy.log('blue', "running testDateBasic1LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testDateBasic1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testDateBasic1LocalBothSides
/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busAddDeviceAndUser
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testDateBasic1ClientSide(params,cbFun){
  handy.log('blue', "testDateBasic1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busDateBasic1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busDateBasic1
}//testDateBasic1ClientSide

function busDateBasic1(params,cbFun){
  handy.log('blue', "busDateBasic1 enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  var host = params.host;
  var port = params.port;
  var securePort = params.securePort;
  var uploadReally = params.uploadReally;
  var user4Info1 = null, user4Info2 = null;
  var userIdM1, userIdM2, userIdF3, userIdF4, userIdF7, userIdF8;
  var emailAccountM1, emailAccountM2, emailAccountF3, emailAccountF4, emailAccountF7, emailAccountF8;
  var dateIdUM1_1, dateIdUM1_2, dateIdUM1_3, dateIdUM1_4, dateIdUM2_1;
  var messageIdM1D1_F3_1, messageIdM1D2_F3_1, messageIdM1D2_M1_1, messageIdM1D3_F3_1;
  var dateDate0 = handy.getNowOfUTCdate().getTime();
  var dateDate1 = dateDate0+1*24*60*60*1000;
  var dateDate2 = dateDate0+2*24*60*60*1000;
  var dateDate4 = dateDate0+4*24*60*60*1000;
  handy.pipeline(
      function(next){
        var lparams = tool.cloneObject(params);
        tool.copyFields({srcObj:{name1:'Adam',name2:'Bob',name3:'Clara',name4:'Daisy'},destObj:lparams});
        busPrepare4User(lparams,function(outData){
          user4Info1 = outData;
          userIdM1 = outData.userInfoMale1.registerOutData.result.userId;
          userIdM2 = outData.userInfoMale2.registerOutData.result.userId;
          userIdF3 = outData.userInfoFemale3.registerOutData.result.userId;
          userIdF4 = outData.userInfoFemale4.registerOutData.result.userId;
          emailAccountM1 = outData.userInfoMale1.userParams.emailAccount;
          emailAccountM2 = outData.userInfoMale2.userParams.emailAccount;
          emailAccountF3 = outData.userInfoFemale3.userParams.emailAccount;
          emailAccountF4 = outData.userInfoFemale4.userParams.emailAccount;
          if (next) next();
        });//busPrepare4User
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM1, password:gPassword,deviceType:user4Info1.userInfoMale1.userParams.deviceType,deviceId:gDeviceId}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 1 get 0 created dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,type:'onlyActiveSend',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

//      function(next){
//        console.log("\nuser1 create 1st date.");
//        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
//        postDataObj:{latlng:user4Info1.userInfoMale1.userParams.latlng, region:user4Info1.userInfoMale1.userParams.region, geolibType:user4Info1.userInfoMale1.userParams.geolibType,
//        dateDate:dateDate2,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_1",description:"i want to do something"}},function(err,outData){
//          assert.ok(outData.status=="success");
//          dateIdUM1_1 = outData.result.dateId;
//          next();
//        });
//      },
//      function(next){
//        console.log("\nuser1 create 2nd date.");
//        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
//        postDataObj:{latlng:user4Info1.userInfoMale1.userParams.latlng, region:user4Info1.userInfoMale1.userParams.region, geolibType:user4Info1.userInfoMale1.userParams.geolibType,
//        dateDate:dateDate4,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_2",description:"i want to do something"}},function(err,outData){
//          assert.ok(outData.status=="success");
//          dateIdUM1_2 = outData.result.dateId;
//          next();
//        });
//      },
//      function(next){
//        console.log("\nuser1 create 3rd date.");
//        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
//        postDataObj:{latlng:user4Info1.userInfoMale1.userParams.latlng, region:user4Info1.userInfoMale1.userParams.region, geolibType:user4Info1.userInfoMale1.userParams.geolibType,
//        dateDate:dateDate1,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_3",description:"i want to do something"}},function(err,outData){
//          assert.ok(outData.status=="success");
//          dateIdUM1_3 = outData.result.dateId;
//          next();
//        });
//      },
//      function(next){
//        console.log("\nuser1 create 4th date.");
//        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
//        postDataObj:{latlng:user4Info1.userInfoMale1.userParams.latlng, region:user4Info1.userInfoMale1.userParams.region, geolibType:user4Info1.userInfoMale1.userParams.geolibType,
//        dateDate:dateDate1,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_4",description:"i want to do something"}},function(err,outData){
//          assert.ok(outData.status=="success");
//          dateIdUM1_4 = outData.result.dateId;
//          next();
//        });
//      },

      function(next){
        console.log("\nuser1 create 1st date.");
        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,
        dateDate:dateDate2,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_1",description:"i want to do something"
        }},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM1_1 = outData.result.dateId;
          next();
        });
      },
      function(next){
        console.log("\nuser1 create 2nd date.");
        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,
        dateDate:dateDate4,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_2",description:"i want to do something"
        }},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM1_2 = outData.result.dateId;
          next();
        });
      },
      function(next){
        console.log("\nuser1 create 3rd date.");
        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,
        dateDate:dateDate1,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_3",description:"i want to do something"
        }},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM1_3 = outData.result.dateId;
          next();
        });
      },
      function(next){
        console.log("\nuser1 create 4th date.");
        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,
        dateDate:dateDate1,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_4",description:"i want to do something"
        }},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM1_4 = outData.result.dateId;
          next();
        });
      },

      function(next){
        console.log("\nuser 1 get 4 created dates when just created");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,type:'onlyActiveSend',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 1 get 4 nearby self dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getNearbyDates',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,start:0,count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length==4);
          next();
        });
      },

      function(next){
        console.log("\nuser1 logout");
        testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/logOut',notLogResponseHere:null,
        postDataObj:{userId:userIdM1}},function(err,outData){
          next();
        });
      },

      function(next){
        console.log("\nanonymous user get 4 nearby self dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getNearbyDates',notLogResponseHere:null,
        postDataObj:{start:0,count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length==4);
          next();
        });
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountF3, password:gPassword,deviceType:user4Info1.userInfoFemale3.userParams.deviceType,deviceId:gDeviceId}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 3 get 4 nearby dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getNearbyDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,start:0,count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length>0);
          next();
        });
      },

      function(next){
        console.log("\nuser 3 get 0 respond dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,type:'applying',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 3 respond message-1 to dateU1_1");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1,messageText:'msg_M1D1_F3-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          messageIdM1D1_F3_1 = outData.result.messageId;

          next();
        });
      },
      function(next){
        console.log("\nuser 3 respond message-1 to dateU1_2");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_2,messageText:'msg_M1D2_F3-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          messageIdM1D2_F3_1 = outData.result.messageId;

          next();
        });
      },
      function(next){
        console.log("\nuser 3 respond message-1 to dateU1_3");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_3,messageText:'msg_M1D3_F3-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          messageIdM1D3_F3_1 = outData.result.messageId;

          next();
        });
      },

      function(next){
        console.log("\nuser 3 get 3 respond dates when just respond");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,type:'applying',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length==3);
          assert.ok(outData.result.dates[0].responders.length==1);
          next();
        });
      },

      function(next){
        console.log("\nuser 3 get conversations when just respond");
        testlib.runPRApi({host:host,port:port,path:'/user/getDateConversations',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountF4, password:gPassword,deviceType:user4Info1.userInfoFemale3.userParams.deviceType,deviceId:gDeviceId}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 4 respond message-1 to dateU1_3");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdF4,targetUserId:userIdM1,dateId:dateIdUM1_3,messageText:'msg_M1D3_F4-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          messageIdM1D3_F4_1 = outData.result.messageId;

          next();
        });
      },
      function(next){
        console.log("\nuser 4 get 1 respond dates when just respond");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF4,type:'applying',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },


      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM1, password:gPassword,deviceType:user4Info1.userInfoMale1.userParams.deviceType,deviceId:gDeviceId}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 1 get conversations when some user responded");
        testlib.runPRApi({host:host,port:port,path:'/user/getDateConversations',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 1 respond message-1 to dateU1_2");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_2,messageText:'msg_M1D2_M1-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          messageIdM1D2_M1_1 = outData.result.messageId;

          next();
        });
      },
      function(next){
        console.log("\nuser 1 respond message-1 to dateU1_3");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_3,messageText:'msg_M1D3_M1-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          messageIdM1D3_M1_1 = outData.result.messageId;

          next();
        });
      },

      function(next){
        console.log("\nuser 1 get 4 created dates when some user responded and self reply");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,type:'onlyActiveSend',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 1 get conversations when some user responded and self reply");
        testlib.runPRApi({host:host,port:port,path:'/user/getDateConversations',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountF3, password:gPassword,deviceType:user4Info1.userInfoFemale3.userParams.deviceType,deviceId:gDeviceId}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 3 get conversations when after chat");
        testlib.runPRApi({host:host,port:port,path:'/user/getDateConversations',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 3 respond message-2 to dateU1_3");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_3,messageText:'msg_M1D3_F3-M2'}},function(err,outData){
          assert.ok(outData.status=="success");
          messageIdM1D3_F3_2 = outData.result.messageId;

          next();
        });
      },
      function(next){
        console.log("\nuser 3 get 3 respond dates when chat");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,type:'applying',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },


      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM1, password:gPassword,deviceType:user4Info1.userInfoMale1.userParams.deviceType,deviceId:gDeviceId}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 1 confirm 1st date");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1}},function(err,outData){
          assert.ok(outData.status=="success");
          messageIdM1D1_F3_sys =  outData.result.sysMessageToResponder.messageId;
          next();
        });
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountF3, password:gPassword,deviceType:user4Info1.userInfoFemale3.userParams.deviceType,deviceId:gDeviceId}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nT1 user 3 get 2 applying dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,type:'applying',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length==2);
          next();
        });
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM1, password:gPassword,deviceType:user4Info1.userInfoMale1.userParams.deviceType,deviceId:gDeviceId}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_3}},function(err,outData){
          assert.ok(outData.status=="success");
          messageIdM1D3_F3_sys =  outData.result.sysMessageToResponder.messageId;
          next();
        });
      },

      function(next){
        console.log("\nafter confirm dates, user 1 get self 3 dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,type:'onlyActiveSend',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          var dates = outData.result.dates;
          assert.ok(dates[0].confirmedPersonCount == 1);
          next();
        });
      },

//      function(next){
//        console.log("\nuser 1 get 2 schedule dates");
//        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
//        postDataObj:{type:'schedule',count:10}},function(err,outData){
//          assert.ok(outData.status=="success");
//          next();
//        });
//      },

      function(next){
        console.log("\nuser 1 getMessageHistory");
        testlib.runPRApi({host:host,port:port,path:'/user/getMessageHistory',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,dateId:dateIdUM1_2,targetUserId:userIdF3,count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountF3, password:gPassword,deviceType:user4Info1.userInfoFemale3.userParams.deviceType,deviceId:gDeviceId}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 3 get 2 invited dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,type:'invited',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length==2);
          next();
        });
      },

      function(next){
        console.log("\nuser 3 get 1 applying dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,type:'applying',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length==1);
          next();
        });
      },

      function(next){
        console.log("\nuser 3 getMessageHistory");
        testlib.runPRApi({host:host,port:port,path:'/user/getMessageHistory',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,dateId:dateIdUM1_2,targetUserId:userIdM1,count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 3 rate user1");
        testlib.runPRApi({host:host,port:port,path:'/user/rate',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,dateId:dateIdUM1_2,targetUserId:userIdM1,type:"good"}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 3 rate user1 again, should fail");
        testlib.runPRApi({host:host,port:port,path:'/user/rate',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,dateId:dateIdUM1_2,targetUserId:userIdM1,type:"good"}},function(err,outData){
          assert.ok(outData.status=="fail");
          next();
        });
      },
      function(next){
        console.log("\nuser 3 get user1");
        testlib.runPRApi({host:host,port:port,path:'/user/getUser',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM1, password:gPassword,deviceType:user4Info1.userInfoMale1.userParams.deviceType,deviceId:gDeviceId}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 1 rate user3");
        testlib.runPRApi({host:host,port:port,path:'/user/rate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,dateId:dateIdUM1_2,targetUserId:userIdF3,type:"good"}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 1 rate user3 again, should fail");
        testlib.runPRApi({host:host,port:port,path:'/user/rate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,dateId:dateIdUM1_2,targetUserId:userIdF3,type:"good"}},function(err,outData){
          assert.ok(outData.status=="fail");
          next();
        });
      },
      function(next){
        console.log("\nuser 1 get user3");
        testlib.runPRApi({host:host,port:port,path:'/user/getUser',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1,beCancel:true}},function(err,outData){
          //messageIdM1D1_F3_sys2 =  outData.result.sysMessageToResponder.messageId;
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nafter cancel confirm dates, user self get dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,type:'onlyActiveSend',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          var dates = outData.result.dates;
          assert.ok(dates[0].confirmedPersonCount == 0);
          next();
        });
      },

      function(next){
        console.log("\nafter cancel confirm date, confirm it again");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1}},function(err,outData){
          //messageIdM1D1_F3_sys2 =  outData.result.sysMessageToResponder.messageId;
          assert.ok(outData.status=="success");
          next();
        });
      },

//      function(next){
//        console.log("\nuser 1 stop date");
//        testlib.runPRApi({host:host,port:port,path:'/user/stopDate',notLogResponseHere:null,
//        postDataObj:{dateId:dateIdUM1_2}},function(err,outData){
//          assert.ok(outData.status=="success");
//          next();
//        });
//      },
//      function(next){
//        console.log("\nafter stop date, should not send message");
//        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
//        postDataObj:{targetUserId:userIdF3,dateId:dateIdUM1_2,messageText:'send message should fail after stop date'}},function(err,outData){
//          assert.ok(outData.status=="fail");
//          next();
//        });
//      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM2, password:gPassword,deviceType:user4Info1.userInfoMale2.userParams.deviceType,deviceId:gDeviceId}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser2 create 1st date with photo.");
        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
        postDataObj:{userId:userIdM2,latlng:user4Info1.userInfoMale2.userParams.latlng, region:user4Info1.userInfoMale2.userParams.region, geolibType:user4Info1.userInfoMale2.userParams.geolibType,
        dateDate:dateDate2,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU2_1",description:"i want to do something",
        notUploadReally:!uploadReally, image:gUploadPhotoPath,width:900,height:800}},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM2_1 = outData.result.dateId;
          next();
        });
      },
      function(next){
        console.log("\nuser 2 get dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdM2,type:'onlyActiveSend',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        //DoAssert
        if (next) next();
      },
      function(){
        if (cbFun) cbFun(null);
      }
  );//handy.pipeline
};//busDateBasic1





/**
*
* @param params - contains (optional)port, ..
*     @see busAddDeviceAndUser
* @param next - is function(next)
*/
function testActiveApplyingDates1LocalBothSides(params,next){
  handy.log('blue', "running testActiveApplyingDates1LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testActiveApplyingDates1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testActiveApplyingDates1LocalBothSides
/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busAddDeviceAndUser
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testActiveApplyingDates1ClientSide(params,cbFun){
  handy.log('blue', "testActiveApplyingDates1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busActiveApplyingDates1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busActiveApplyingDates1
}//testActiveApplyingDates1ClientSide

function busActiveApplyingDates1(params,cbFun){
  handy.log('blue', "busActiveApplyingDates1 enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  var host = params.host;
  var port = params.port;
  var securePort = params.securePort;
  var uploadReally = params.uploadReally;
  var user4Info1 = null, user4Info2 = null;
  var userIdM1, userIdM2, userIdF3, userIdF4, userIdF7, userIdF8;
  var emailAccountM1, emailAccountM2, emailAccountF3, emailAccountF4, emailAccountF7, emailAccountF8;
  var dateIdUM1_1, dateIdUM1_2, dateIdUM1_3, dateIdUM1_4, dateIdUM2_1;
  var messageIdM1D1_F3_1, messageIdM1D2_F3_1, messageIdM1D2_M1_1, messageIdM1D3_F3_1;
  var dateDate0 = handy.getNowOfUTCdate().getTime();
  var dateDate1 = dateDate0+1*24*60*60*1000;
  var dateDate2 = dateDate0+2*24*60*60*1000;
  var dateDate4 = dateDate0+4*24*60*60*1000;
  handy.pipeline(
      function(next){
        var lparams = tool.cloneObject(params);
        tool.copyFields({srcObj:{name1:'Adam',name2:'Bob',name3:'Clara',name4:'Daisy'},destObj:lparams});
        busPrepare4User(lparams,function(outData){
          user4Info1 = outData;
          userIdM1 = outData.userInfoMale1.registerOutData.result.userId;
          userIdM2 = outData.userInfoMale2.registerOutData.result.userId;
          userIdF3 = outData.userInfoFemale3.registerOutData.result.userId;
          userIdF4 = outData.userInfoFemale4.registerOutData.result.userId;
          emailAccountM1 = outData.userInfoMale1.userParams.emailAccount;
          emailAccountM2 = outData.userInfoMale2.userParams.emailAccount;
          emailAccountF3 = outData.userInfoFemale3.userParams.emailAccount;
          emailAccountF4 = outData.userInfoFemale4.userParams.emailAccount;
          if (next) next();
        });//busPrepare4User
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM1, password:gPassword,deviceType:user4Info1.userInfoMale1.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 1 get 0 created dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'onlyActiveSend',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser1 create 1st date.");
        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
        postDataObj:{
        dateDate:dateDate2,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_1",description:"i want to do something"
        }},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM1_1 = outData.result.dateId;
          next();
        });
      },
      function(next){
        console.log("\nuser1 create 2nd date.");
        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
        postDataObj:{
        dateDate:dateDate4,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_2",description:"i want to do something"
        }},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM1_2 = outData.result.dateId;
          next();
        });
      },
      function(next){
        console.log("\nuser1 create 3rd date.");
        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
        postDataObj:{
        dateDate:dateDate1,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_3",description:"i want to do something"
        }},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM1_3 = outData.result.dateId;
          next();
        });
      },
      function(next){
        console.log("\nuser1 create 4th date.");
        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
        postDataObj:{
        dateDate:dateDate1,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_4",description:"i want to do something"
        }},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM1_4 = outData.result.dateId;
          next();
        });
      },

      function(next){
        console.log("\nuser 1 get 4 created dates when just created");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'onlyActiveSend',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser1 logout");
        testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/logOut',notLogResponseHere:null,
        postDataObj:{userId:userIdM1}},function(err,outData){
          next();
        });
      },


      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountF3, password:gPassword,deviceType:user4Info1.userInfoFemale3.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 3 get 4 nearby dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getNearbyDates',notLogResponseHere:null,
        postDataObj:{start:0,count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length>0);
          next();
        });
      },

      function(next){
        console.log("\nuser 3 respond message-1 to dateU1_1");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdM1,dateId:dateIdUM1_1,messageText:'msg_M1D1_F3-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          messageIdM1D1_F3_1 = outData.result.messageId;

          next();
        });
      },
      function(next){
        console.log("\nuser 3 respond message-1 to dateU1_2");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdM1,dateId:dateIdUM1_2,messageText:'msg_M1D2_F3-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          messageIdM1D2_F3_1 = outData.result.messageId;

          next();
        });
      },
      function(next){
        console.log("\nuser 3 respond message-1 to dateU1_3");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdM1,dateId:dateIdUM1_3,messageText:'msg_M1D3_F3-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          messageIdM1D3_F3_1 = outData.result.messageId;

          next();
        });
      },

      function(next){
        console.log("\nuser 3 get 3 respond dates when just respond");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'applying',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length==3);
          assert.ok(outData.result.dates[0].responders.length==1);
          next();
        });
      },

      function(next){
        console.log("\nuser 3 get conversations when just respond");
        testlib.runPRApi({host:host,port:port,path:'/user/getDateConversations',notLogResponseHere:null,
        postDataObj:{count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountF4, password:gPassword,deviceType:user4Info1.userInfoFemale3.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 4 respond message-1 to dateU1_1");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdM1,dateId:dateIdUM1_1,messageText:'msg_M1D1_F4-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 4 respond message-1 to dateU1_2");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdM1,dateId:dateIdUM1_2,messageText:'msg_M1D2_F4-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },



      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM1, password:gPassword,deviceType:user4Info1.userInfoMale1.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 1 get conversations when some user responded");
        testlib.runPRApi({host:host,port:port,path:'/user/getDateConversations',notLogResponseHere:null,
        postDataObj:{count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 1 respond message-1 to user 3 in dateU1_1");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdF3,dateId:dateIdUM1_1,messageText:'msg_D1_M1_F3-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 1 respond message-1 to user 4 in dateU1_1");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdF4,dateId:dateIdUM1_1,messageText:'msg_D1_M1_F4-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 1 respond message-1 to user 3 in dateU1_2");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdF3,dateId:dateIdUM1_2,messageText:'msg_D2_M1_F3-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },


      function(next){
        console.log("\nuser 1 get 4 created dates when some user responded and self reply");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'onlyActiveSend',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 1 get conversations when some user responded and self reply");
        testlib.runPRApi({host:host,port:port,path:'/user/getDateConversations',notLogResponseHere:null,
        postDataObj:{count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountF3, password:gPassword,deviceType:user4Info1.userInfoFemale3.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 3 get conversations when after chat");
        testlib.runPRApi({host:host,port:port,path:'/user/getDateConversations',notLogResponseHere:null,
        postDataObj:{count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 3 respond message-2 to dateU1_1");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdM1,dateId:dateIdUM1_1,messageText:'msg_D1_F3_M1-M2'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 3 get 3 respond dates when chat");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'applying',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },


      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM1, password:gPassword,deviceType:user4Info1.userInfoMale1.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 1 confirm user 3 in date 1");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdF3,dateId:dateIdUM1_1}},function(err,outData){
          assert.ok(outData.status=="success");
          messageIdM1D1_F3_sys =  outData.result.sysMessageToResponder.messageId;
          next();
        });
      },
      function(next){
        console.log("\nuser 1 confirm user 3 in date 3");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdF3,dateId:dateIdUM1_3}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountF3, password:gPassword,deviceType:user4Info1.userInfoFemale3.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nafter user 1 confirm 2 dates, user 3 get 1 applying dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'applying',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length==1);
          next();
        });
      },
      function(next){
        console.log("\nafter user 1 confirm 2 dates, user 3 get 2 invited dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'invited',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length==2);
          next();
        });
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM1, password:gPassword,deviceType:user4Info1.userInfoMale1.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 1 cancel confirm user 3 in date 3");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdF3,dateId:dateIdUM1_3,beCancel:true}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountF3, password:gPassword,deviceType:user4Info1.userInfoFemale3.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nafter user 1 cancel user 3 in date 3, user 3 get 1 invited dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'invited',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length==1);
          next();
        });
      },

      function(next){
        console.log("\nafter user 1 cancel user 3 in date 3, user 3 get 2 applying dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'applying',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length==2);
          next();
        });
      },

      function(next){
        console.log("\nuser 3 respond message-2 for canceled date 3");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdM1,dateId:dateIdUM1_3,messageText:'msg_D3_F3_M1-M2'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nafter user 3 reply canceled date, user 3 get 1 invited dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'invited',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length==1);
          next();
        });
      },

      function(next){
        console.log("\nafter user 3 reply canceled date, user 3 get 2 applying dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'applying',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length==2);
          next();
        });
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM1, password:gPassword,deviceType:user4Info1.userInfoMale1.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 1 respond message-2 to user 3 for canceled date 3");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdF3,dateId:dateIdUM1_3,messageText:'msg_D3_M1_F3-M2'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountF3, password:gPassword,deviceType:user4Info1.userInfoFemale3.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },


      function(next){
        console.log("\nafter user 1 reply canceled date, user 3 get 1 invited dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'invited',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length==1);
          next();
        });
      },

      function(next){
        console.log("\nafter user 1 reply canceled date, user 3 get 2 applying dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'applying',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length==2);
          next();
        });
      },




      function(next){
        //DoAssert
        if (next) next();
      },
      function(){
        if (cbFun) cbFun(null);
      }
  );//handy.pipeline
};//busActiveApplyingDates1




/**
*
* @param params - contains (optional)port, ..
*     @see busAddDeviceAndUser
* @param next - is function(next)
*/
function testDateActiveResponders1LocalBothSides(params,next){
  handy.log('blue', "running testDateActiveResponders1LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testDateActiveResponders1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testDateActiveResponders1LocalBothSides
/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busAddDeviceAndUser
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testDateActiveResponders1ClientSide(params,cbFun){
  handy.log('blue', "testDateActiveResponders1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busDateActiveResponders1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busDateActiveResponders1
}//testDateActiveResponders1ClientSide

function busDateActiveResponders1(params,cbFun){
  handy.log('blue', "busDateActiveResponders1 enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  var host = params.host;
  var port = params.port;
  var securePort = params.securePort;
  var uploadReally = params.uploadReally;
  var user4Info1 = null, user4Info2 = null;
  var userIdM1, userIdM2, userIdF3, userIdF4, userIdF7, userIdF8;
  var emailAccountM1, emailAccountM2, emailAccountF3, emailAccountF4, emailAccountF7, emailAccountF8;
  var dateIdUM1_1, dateIdUM1_2, dateIdUM1_3, dateIdUM1_4, dateIdUM2_1;
  var messageIdM1D1_F3_1, messageIdM1D2_F3_1, messageIdM1D2_M1_1, messageIdM1D3_F3_1;
  var dateDate0 = handy.getNowOfUTCdate().getTime();
  var dateDate1 = dateDate0+1*24*60*60*1000;
  var dateDate2 = dateDate0+2*24*60*60*1000;
  var dateDate4 = dateDate0+4*24*60*60*1000;
  handy.pipeline(
      function(next){
        var lparams = tool.cloneObject(params);
        tool.copyFields({srcObj:{name1:'Adam',name2:'Bob',name3:'Clara',name4:'Daisy'},destObj:lparams});
        busPrepare4User(lparams,function(outData){
          user4Info1 = outData;
          userIdM1 = outData.userInfoMale1.registerOutData.result.userId;
          userIdM2 = outData.userInfoMale2.registerOutData.result.userId;
          userIdF3 = outData.userInfoFemale3.registerOutData.result.userId;
          userIdF4 = outData.userInfoFemale4.registerOutData.result.userId;
          emailAccountM1 = outData.userInfoMale1.userParams.emailAccount;
          emailAccountM2 = outData.userInfoMale2.userParams.emailAccount;
          emailAccountF3 = outData.userInfoFemale3.userParams.emailAccount;
          emailAccountF4 = outData.userInfoFemale4.userParams.emailAccount;
          if (next) next();
        });//busPrepare4User
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM1, password:gPassword,deviceType:user4Info1.userInfoMale1.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 1 get 0 created dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'onlyActiveSend',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser1 create 1st date.");
        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
        postDataObj:{
        dateDate:dateDate2,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_1",description:"i want to do something"
        }},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM1_1 = outData.result.dateId;
          next();
        });
      },
      function(next){
        console.log("\nuser1 create 2nd date.");
        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
        postDataObj:{
        dateDate:dateDate4,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_2",description:"i want to do something"
        }},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM1_2 = outData.result.dateId;
          next();
        });
      },
      function(next){
        console.log("\nuser1 create 3rd date.");
        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
        postDataObj:{
        dateDate:dateDate1,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_3",description:"i want to do something"
        }},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM1_3 = outData.result.dateId;
          next();
        });
      },
      function(next){
        console.log("\nuser1 create 4th date.");
        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
        postDataObj:{
        dateDate:dateDate1,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_4",description:"i want to do something"
        }},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM1_4 = outData.result.dateId;
          next();
        });
      },

      function(next){
        console.log("\nuser 1 get 4 created dates when just created");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'onlyActiveSend',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser1 logout");
        testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/logOut',notLogResponseHere:null,
        postDataObj:{userId:userIdM1}},function(err,outData){
          next();
        });
      },


      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountF3, password:gPassword,deviceType:user4Info1.userInfoFemale3.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 3 respond message-1 to dateU1_1");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdM1,dateId:dateIdUM1_1,messageText:'msg_D1_F3_M1-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 3 respond message-1 to dateU1_2");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdM1,dateId:dateIdUM1_2,messageText:'msg_D2_F3_M1-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 3 respond message-2 to dateU1_2");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdM1,dateId:dateIdUM1_2,messageText:'msg_D2_F3_M1-M2'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 3 respond message-1 to dateU1_3");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdM1,dateId:dateIdUM1_3,messageText:'msg_D3_F3_M1-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 3 get 3 respond dates when just respond");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'applying',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length==3);
          assert.ok(outData.result.dates[0].responders.length==1);
          assert.ok(outData.result.dates[1].responders.length==1);
          assert.ok(outData.result.dates[2].responders.length==1);
          next();
        });
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountF4, password:gPassword,deviceType:user4Info1.userInfoFemale3.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 4 respond message-1 to dateU1_1");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdM1,dateId:dateIdUM1_1,messageText:'msg_D1_F4_M1-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 4 respond message-1 to dateU1_2");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdM1,dateId:dateIdUM1_2,messageText:'msg_D2_F4_M1-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 4 get 2 respond dates when just respond");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'applying',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length==2);
          assert.ok(outData.result.dates[0].responders.length==1);
          assert.ok(outData.result.dates[1].responders.length==1);
          next();
        });
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM1, password:gPassword,deviceType:user4Info1.userInfoMale1.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 1 get 4 self dates after others respond");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'onlyActiveSend',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length==4);
          assert.ok(outData.result.dates[0].responders.length==2);
          assert.ok(outData.result.dates[1].responders.length==2);
          assert.ok(outData.result.dates[2].responders.length==1);
          assert.ok(outData.result.dates[3].responders == null);
          next();
        });
      },

      function(next){
        console.log("\nuser 1 respond message-1 to user 3 in dateU1_1");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdF3,dateId:dateIdUM1_1,messageText:'msg_D1_M1_F3-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 1 respond message-1 to user 4 in dateU1_1");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdF4,dateId:dateIdUM1_1,messageText:'msg_D1_M1_F4-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 1 respond message-1 to user 3 in dateU1_2");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdF3,dateId:dateIdUM1_2,messageText:'msg_D2_M1_F3-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 1 respond message-1 to user 3 in dateU1_3");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdF3,dateId:dateIdUM1_3,messageText:'msg_D3_M1_F3-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 1 get 4 self dates after others respond");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'onlyActiveSend',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length==4);
          assert.ok(outData.result.dates[0].responders.length==1);
          assert.ok(outData.result.dates[1].responders.length==2);
          assert.ok(outData.result.dates[2].responders.length==2);
          assert.ok(outData.result.dates[3].responders == null);
          next();
        });
      },




      function(next){
        //DoAssert
        if (next) next();
      },
      function(){
        if (cbFun) cbFun(null);
      }
  );//handy.pipeline
};//busDateActiveResponders1



/**
*
* @param params - contains (optional)port, ..
*     @see busAddDeviceAndUser
* @param next - is function(next)
*/
function testDateActiveResponders2LocalBothSides(params,next){
  handy.log('blue', "running testDateActiveResponders2LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testDateActiveResponders2ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testDateActiveResponders2LocalBothSides
/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busAddDeviceAndUser
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testDateActiveResponders2ClientSide(params,cbFun){
  handy.log('blue', "testDateActiveResponders2ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busDateActiveResponders2(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busDateActiveResponders2
}//testDateActiveResponders2ClientSide

function busDateActiveResponders2(params,cbFun){
  handy.log('blue', "busDateActiveResponders2 enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  var host = params.host;
  var port = params.port;
  var securePort = params.securePort;
  var uploadReally = params.uploadReally;
  var user4Info1 = null, user4Info2 = null;
  var userIdM1, userIdM2, userIdF3, userIdF4, userIdF7, userIdF8;
  var emailAccountM1, emailAccountM2, emailAccountF3, emailAccountF4, emailAccountF7, emailAccountF8;
  var dateIdUM1_1, dateIdUM1_2, dateIdUM1_3, dateIdUM1_4, dateIdUM2_1;
  var messageIdM1D1_F3_1, messageIdM1D2_F3_1, messageIdM1D2_M1_1, messageIdM1D3_F3_1;
  var dateDate0 = handy.getNowOfUTCdate().getTime();
  var dateDate1 = dateDate0+1*24*60*60*1000;
  var dateDate2 = dateDate0+2*24*60*60*1000;
  var dateDate4 = dateDate0+4*24*60*60*1000;
  handy.pipeline(
      function(next){
        var lparams = tool.cloneObject(params);
        tool.copyFields({srcObj:{name1:'Adam',name2:'Bob',name3:'Clara',name4:'Daisy'},destObj:lparams});
        busPrepare4User(lparams,function(outData){
          user4Info1 = outData;
          userIdM1 = outData.userInfoMale1.registerOutData.result.userId;
          userIdM2 = outData.userInfoMale2.registerOutData.result.userId;
          userIdF3 = outData.userInfoFemale3.registerOutData.result.userId;
          userIdF4 = outData.userInfoFemale4.registerOutData.result.userId;
          emailAccountM1 = outData.userInfoMale1.userParams.emailAccount;
          emailAccountM2 = outData.userInfoMale2.userParams.emailAccount;
          emailAccountF3 = outData.userInfoFemale3.userParams.emailAccount;
          emailAccountF4 = outData.userInfoFemale4.userParams.emailAccount;
          if (next) next();
        });//busPrepare4User
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM1, password:gPassword,deviceType:user4Info1.userInfoMale1.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 1 get 0 created dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'onlyActiveSend',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser1 create 1st date.");
        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
        postDataObj:{
        dateDate:dateDate2,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_1",description:"i want to do something"
        }},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM1_1 = outData.result.dateId;
          next();
        });
      },


      function(next){
        console.log("\nuser1 logout");
        testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/logOut',notLogResponseHere:null,
        postDataObj:{userId:userIdM1}},function(err,outData){
          next();
        });
      },


      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountF3, password:gPassword,deviceType:user4Info1.userInfoFemale3.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 3 respond message-1 to dateU1_1");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdM1,dateId:dateIdUM1_1,messageText:'msg_D1_F3_M1-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },


      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountF4, password:gPassword,deviceType:user4Info1.userInfoFemale3.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 4 respond message-1 to dateU1_1");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdM1,dateId:dateIdUM1_1,messageText:'msg_D1_F4_M1-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },


      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM1, password:gPassword,deviceType:user4Info1.userInfoMale1.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 1 get 1 self dates after others respond");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'onlyActiveSend',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length==1);
          assert.ok(outData.result.dates[0].responders.length==2);

          next();
        });
      },

//      function(next){
//        console.log("\nuser 1 respond message-1 to user 3 in dateU1_1");
//        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
//        postDataObj:{targetUserId:userIdF3,dateId:dateIdUM1_1,messageText:'msg_D1_M1_F3-M1'}},function(err,outData){
//          assert.ok(outData.status=="success");
//          next();
//        });
//      },
//      function(next){
//        console.log("\nuser 1 respond message-1 to user 4 in dateU1_1");
//        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
//        postDataObj:{targetUserId:userIdF4,dateId:dateIdUM1_1,messageText:'msg_D1_M1_F4-M1'}},function(err,outData){
//          assert.ok(outData.status=="success");
//          next();
//        });
//      },
//
//      function(next){
//        console.log("\nuser 1 respond message-1 to user 3 in dateU1_2");
//        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
//        postDataObj:{targetUserId:userIdF3,dateId:dateIdUM1_2,messageText:'msg_D2_M1_F3-M1'}},function(err,outData){
//          assert.ok(outData.status=="success");
//          next();
//        });
//      },
//
//      function(next){
//        console.log("\nuser 1 respond message-1 to user 3 in dateU1_3");
//        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
//        postDataObj:{targetUserId:userIdF3,dateId:dateIdUM1_3,messageText:'msg_D3_M1_F3-M1'}},function(err,outData){
//          assert.ok(outData.status=="success");
//          next();
//        });
//      },
//
//      function(next){
//        console.log("\nuser 1 get 4 self dates after others respond");
//        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
//        postDataObj:{type:'onlyActiveSend',count:10}},function(err,outData){
//          assert.ok(outData.status=="success");
//          assert.ok(outData.result.dates.length==4);
//          assert.ok(outData.result.dates[0].responders.length==1);
//          assert.ok(outData.result.dates[1].responders.length==2);
//          assert.ok(outData.result.dates[2].responders.length==2);
//          assert.ok(outData.result.dates[3].responders == null);
//          next();
//        });
//      },




      function(next){
        //DoAssert
        if (next) next();
      },
      function(){
        if (cbFun) cbFun(null);
      }
  );//handy.pipeline
};//busDateActiveResponders2





/**
*
* @param params - contains (optional)port, ..
*     @see busAddDeviceAndUser
* @param next - is function(next)
*/
function testGetNearbyDatesA1LocalBothSides(params,next){
  handy.log('blue', "running testGetNearbyDatesA1LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testGetNearbyDatesA1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testGetNearbyDatesA1LocalBothSides
/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busAddDeviceAndUser
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testGetNearbyDatesA1ClientSide(params,cbFun){
  handy.log('blue', "testGetNearbyDatesA1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busGetNearbyDatesA1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busGetNearbyDatesA1
}//testGetNearbyDatesA1ClientSide

function busGetNearbyDatesA1(params,cbFun){
  handy.log('blue', "busGetNearbyDatesA1 enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  var host = params.host;
  var port = params.port;
  var securePort = params.securePort;
  var uploadReally = params.uploadReally;
  var user4Info1 = null, user4Info2 = null;
  var userIdM1, userIdM2, userIdF3, userIdF4, userIdF7, userIdF8;
  var emailAccountM1, emailAccountM2, emailAccountF3, emailAccountF4, emailAccountF7, emailAccountF8;
  var dateIdUM1_1, dateIdUM1_2, dateIdUM1_3, dateIdUM1_4, dateIdUM2_1;
  var messageIdM1D1_F3_1, messageIdM1D2_F3_1, messageIdM1D2_M1_1, messageIdM1D3_F3_1;
  var dateDate0 = handy.getNowOfUTCdate().getTime();
  var dateDateA1 = dateDate0+1*24*60*60*1000;
  var dateDateA2 = dateDate0+2*24*60*60*1000;
  var dateDateA4 = dateDate0+4*24*60*60*1000;
  var dateDate_1 = dateDate0-1*24*60*60*1000;
  var dateDate_2 = dateDate0-2*24*60*60*1000;
  var dateDate_4 = dateDate0-4*24*60*60*1000;
  handy.pipeline(
      function(next){
        var lparams = tool.cloneObject(params);
        tool.copyFields({srcObj:{name1:'Adam',name2:'Bob',name3:'Clara',name4:'Daisy'},destObj:lparams});
        busPrepare4User(lparams,function(outData){
          user4Info1 = outData;
          userIdM1 = outData.userInfoMale1.registerOutData.result.userId;
          userIdM2 = outData.userInfoMale2.registerOutData.result.userId;
          userIdF3 = outData.userInfoFemale3.registerOutData.result.userId;
          userIdF4 = outData.userInfoFemale4.registerOutData.result.userId;
          emailAccountM1 = outData.userInfoMale1.userParams.emailAccount;
          emailAccountM2 = outData.userInfoMale2.userParams.emailAccount;
          emailAccountF3 = outData.userInfoFemale3.userParams.emailAccount;
          emailAccountF4 = outData.userInfoFemale4.userParams.emailAccount;
          if (next) next();
        });//busPrepare4User
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM1, password:gPassword,deviceType:user4Info1.userInfoMale1.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 1 get 0 created dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'onlyActiveSend',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser1 create date d-1.");
        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
        postDataObj:{
        dateDate:dateDate_1,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_3",description:"i want to do something"
        }},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 1 get 0 nearby self dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getNearbyDates',notLogResponseHere:null,
        postDataObj:{start:0,count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result==null || outData.result.dates==null || outData.result.dates.length==0);
          //assert.ok(outData.result.dates.length==3);
          next();
        });
      },


      function(next){
        console.log("\nuser1 create date d+2.");
        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
        postDataObj:{
        dateDate:dateDateA2,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_1",description:"i want to do something"
        }},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM1_1 = outData.result.dateId;
          next();
        });
      },

      function(next){
        console.log("\nuser 1 get 1 nearby self dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getNearbyDates',notLogResponseHere:null,
        postDataObj:{start:0,count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length==1);
          next();
        });
      },
//      function(next){
//        console.log("\nuser1 create date d+4.");
//        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
//        postDataObj:{
//        dateDate:dateDateA4,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_2",description:"i want to do something"
//        }},function(err,outData){
//          assert.ok(outData.status=="success");
//          dateIdUM1_2 = outData.result.dateId;
//          next();
//        });
//      },
//      function(next){
//        console.log("\nuser1 create date d+1.");
//        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
//        postDataObj:{
//        dateDate:dateDateA1,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_3",description:"i want to do something"
//        }},function(err,outData){
//          assert.ok(outData.status=="success");
//          dateIdUM1_3 = outData.result.dateId;
//          next();
//        });
//      },
//      function(next){
//        console.log("\nuser1 create date now.");
//        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
//        postDataObj:{
//        dateDate:dateDate0,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_4",description:"i want to do something"
//        }},function(err,outData){
//          assert.ok(outData.status=="success");
//          dateIdUM1_4 = outData.result.dateId;
//          next();
//        });
//      },


      function(next){
        console.log("\nuser1 logout");
        testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/logOut',notLogResponseHere:null,
        postDataObj:{userId:userIdM1}},function(err,outData){
          next();
        });
      },

//
//      function(next){
//        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
//        postDataObj:{emailAccount:emailAccountF3, password:gPassword,deviceType:user4Info1.userInfoFemale3.userParams.deviceType}},function(err,outData){
//          assert.ok(outData.status=="success");
//          next();
//        });
//      },
//
//      function(next){
//        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
//        postDataObj:{emailAccount:emailAccountF4, password:gPassword,deviceType:user4Info1.userInfoFemale3.userParams.deviceType}},function(err,outData){
//          assert.ok(outData.status=="success");
//          next();
//        });
//      },
//
//      function(next){
//        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
//        postDataObj:{emailAccount:emailAccountM1, password:gPassword,deviceType:user4Info1.userInfoMale1.userParams.deviceType}},function(err,outData){
//          assert.ok(outData.status=="success");
//          next();
//        });
//      },




      function(next){
        //DoAssert
        if (next) next();
      },
      function(){
        if (cbFun) cbFun(null);
      }
  );//handy.pipeline
};//busGetNearbyDatesA1




/**
*
* @param params - contains (optional)port, ..
*     @see busAddDeviceAndUser
* @param next - is function(next)
*/
function testGetDates1LocalBothSides(params,next){
  handy.log('blue', "running testGetDates1LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testGetDates1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testGetDates1LocalBothSides
/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busAddDeviceAndUser
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testGetDates1ClientSide(params,cbFun){
  handy.log('blue', "testGetDates1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busGetDates1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busGetDates1
}//testGetDates1ClientSide

function busGetDates1(params,cbFun){
  handy.log('blue', "busGetDates1 enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  var host = params.host;
  var port = params.port;
  var securePort = params.securePort;
  var uploadReally = params.uploadReally;
  var user4Info1 = null, user4Info2 = null;
  var userIdM1, userIdM2, userIdF3, userIdF4, userIdF7, userIdF8;
  var emailAccountM1, emailAccountM2, emailAccountF3, emailAccountF4, emailAccountF7, emailAccountF8;
  var dateIdUM1_1, dateIdUM1_2, dateIdUM1_3, dateIdUM1_4, dateIdUM2_1;
  var messageIdM1D1_F3_1, messageIdM1D2_F3_1, messageIdM1D2_M1_1, messageIdM1D3_F3_1;
  var dateDate0 = handy.getNowOfUTCdate().getTime();
  var dateDateA1 = dateDate0+1*24*60*60*1000;
  var dateDateA2 = dateDate0+2*24*60*60*1000;
  var dateDateA4 = dateDate0+4*24*60*60*1000;
  var dateDate_1 = dateDate0-1*24*60*60*1000;
  var dateDate_2 = dateDate0-2*24*60*60*1000;
  var dateDate_4 = dateDate0-4*24*60*60*1000;
  handy.pipeline(
      function(next){
        var lparams = tool.cloneObject(params);
        tool.copyFields({srcObj:{name1:'Adam',name2:'Bob',name3:'Clara',name4:'Daisy'},destObj:lparams});
        busPrepare4User(lparams,function(outData){
          user4Info1 = outData;
          userIdM1 = outData.userInfoMale1.registerOutData.result.userId;
          userIdM2 = outData.userInfoMale2.registerOutData.result.userId;
          userIdF3 = outData.userInfoFemale3.registerOutData.result.userId;
          userIdF4 = outData.userInfoFemale4.registerOutData.result.userId;
          emailAccountM1 = outData.userInfoMale1.userParams.emailAccount;
          emailAccountM2 = outData.userInfoMale2.userParams.emailAccount;
          emailAccountF3 = outData.userInfoFemale3.userParams.emailAccount;
          emailAccountF4 = outData.userInfoFemale4.userParams.emailAccount;
          if (next) next();
        });//busPrepare4User
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM1, password:gPassword,deviceType:user4Info1.userInfoMale1.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },



      function(next){
        console.log("\nuser1 create date d+2.");
        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
        postDataObj:{
        dateDate:dateDateA2,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_1",description:"DateA2"
        }},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM1_1 = outData.result.dateId;
          next();
        });
      },

      function(next){
        console.log("\nuser1 create date d+4.");
        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
        postDataObj:{
        dateDate:dateDateA4,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_2",description:"DateA4"
        }},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM1_2 = outData.result.dateId;
          next();
        });
      },
      function(next){
        console.log("\nuser1 create date d+1.");
        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
        postDataObj:{
        dateDate:dateDateA1,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_3",description:"DateA1"
        }},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM1_3 = outData.result.dateId;
          next();
        });
      },

      function(next){
        console.log("\nuser1 create date d-1.");
        testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
        postDataObj:{
        dateDate:dateDate_1,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_4",description:"Date_1"
        }},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser1 logout");
        testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/logOut',notLogResponseHere:null,
        postDataObj:{userId:userIdM1}},function(err,outData){
          next();
        });
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountF3, password:gPassword,deviceType:user4Info1.userInfoFemale3.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 3 respond message-1 to dateU1_1");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdM1,dateId:dateIdUM1_1,messageText:'msg_M1D1_F3-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 3 respond message-1 to dateU1_2");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdM1,dateId:dateIdUM1_2,messageText:'msg_M1D2_F3-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 3 respond message-1 to dateU1_3");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdM1,dateId:dateIdUM1_3,messageText:'msg_M1D3_F3-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

//
//      function(next){
//        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
//        postDataObj:{emailAccount:emailAccountF4, password:gPassword,deviceType:user4Info1.userInfoFemale3.userParams.deviceType}},function(err,outData){
//          assert.ok(outData.status=="success");
//          next();
//        });
//      },
//
      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM1, password:gPassword,deviceType:user4Info1.userInfoMale1.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 1 confirm 1st date");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdF3,dateId:dateIdUM1_1}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 1 confirm 2nd date");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdF3,dateId:dateIdUM1_2}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 1 confirm 3rd date");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{targetUserId:userIdF3,dateId:dateIdUM1_3}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountF3, password:gPassword,deviceType:user4Info1.userInfoFemale3.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nuser 3 get 3 invited dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{type:'invited',count:10}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.dates.length==3);
          assert.ok(outData.result.dates[0].dateDate - 0 < outData.result.dates[1].dateDate - 0);
          assert.ok(outData.result.dates[1].dateDate - 0 < outData.result.dates[2].dateDate - 0);
          next();
        });
      },

      function(next){
        //DoAssert
        if (next) next();
      },
      function(){
        if (cbFun) cbFun(null);
      }
  );//handy.pipeline
};//busGetDates1














/**
*
* @param params - contains (optional)port, ..
* @param next - is function(next)
*/
function testGetNearbyDates1LocalBothSidesOld(params,next){
  handy.log('blue', "running testGetNearbyDates1LocalBothSidesOld");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, needClearSolr:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testGetNearbyDates1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testGetNearbyDates1LocalBothSidesOld
/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testGetNearbyDates1ClientSide(params,cbFun){
  handy.log('blue', "testGetNearbyDates1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busGetNearbyDates1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busGetNearbyDates1
}//testGetNearbyDates1ClientSide

function busGetNearbyDates1(params,cbFun){
  handy.log('blue', "busGetNearbyDates1 enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  var host = params.host;
  var port = params.port;
  var securePort = params.securePort;
  var latlngNS1 = "39.907366,116.356716";//Fuxingmen
  var latlngNS2 = "39.923429,116.355343";//Fuchengmen
  var latlngNS3 = "39.932644,116.355515";//Chegongzhuang
  var latlngNS4 = "39.940278,116.355171";//Xizhimen

  var user4Info1 = null, user4Info2 = null;
  var userIdM1, userIdM2, userIdF3, userIdF4, userIdM5, userIdM6, userIdF7, userIdF8;
  var emailAccountM1, emailAccountM2, emailAccountF3, emailAccountF4, emailAccountM5, emailAccountM6, emailAccountF7, emailAccountF8;
  var dateIdUM1_1, dateIdUM1_2, dateIdUM1_3, dateIdUM1_4;

  var dateDate0 = handy.getNowOfUTCdate().getTime();
  var dateDate1 = dateDate0+1*24*60*60*1000;
  handy.pipeline(
      function(next){
        var lparams = tool.cloneObject(params);
        tool.copyFields({srcObj:{name1:'Adam',name2:'Bob',name3:'Clara',name4:'Daisy',
          latlng1:latlngNS1,latlng2:latlngNS2,latlng3:latlngNS1,latlng4:latlngNS2},destObj:lparams});
        busPrepare4User(lparams,function(outData){
          user4Info1 = outData;
          userIdM1 = outData.userInfoMale1.registerOutData.result.userId;
          userIdM2 = outData.userInfoMale2.registerOutData.result.userId;
          userIdF3 = outData.userInfoFemale3.registerOutData.result.userId;
          userIdF4 = outData.userInfoFemale4.registerOutData.result.userId;
          emailAccountM1 = outData.userInfoMale1.userParams.emailAccount;
          emailAccountM2 = outData.userInfoMale2.userParams.emailAccount;
          emailAccountF3 = outData.userInfoFemale3.userParams.emailAccount;
          emailAccountF4 = outData.userInfoFemale4.userParams.emailAccount;
          if (next) next();
        });//busPrepare4User
      },
      function(next){
        var lparams = tool.cloneObject(params);
        tool.copyFields({srcObj:{name1:'Edward',name2:'Ford',name3:'Georgia',name4:'Helen',
          latlng1:latlngNS3,latlng2:latlngNS4,latlng3:latlngNS3,latlng4:latlngNS4},destObj:lparams});
        busPrepare4User(lparams,function(outData){
          user4Info2 = outData;
          userIdM5 = outData.userInfoMale1.registerOutData.result.userId;
          userIdM6 = outData.userInfoMale2.registerOutData.result.userId;
          userIdF7 = outData.userInfoFemale3.registerOutData.result.userId;
          userIdF8 = outData.userInfoFemale4.registerOutData.result.userId;
          emailAccountM5 = outData.userInfoMale1.userParams.emailAccount;
          emailAccountM6 = outData.userInfoMale2.userParams.emailAccount;
          emailAccountF7 = outData.userInfoFemale3.userParams.emailAccount;
          emailAccountF8 = outData.userInfoFemale4.userParams.emailAccount;
          if (next) next();
        });//busPrepare4User
      },

      function(next){
        var userInfo = user4Info1.userInfoMale1;
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM1, password:gPassword,deviceType:userInfo.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuserM1 create 1st date.");
        var userInfo = user4Info1.userInfoMale1;
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{latlng:userInfo.userParams.latlng, region:userInfo.userParams.region, geolibType:userInfo.userParams.geolibType,
        dateDate:dateDate1,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_1_Fuxingmen",description:"i want to do something"}},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM1_1 = outData.result.dateId;
          next();
        });
      },

      function(next){
        var userInfo = user4Info1.userInfoMale2;
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM2, password:gPassword,deviceType:userInfo.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuserM2 create 1st date.");
        var userInfo = user4Info1.userInfoMale2;
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{latlng:userInfo.userParams.latlng, region:userInfo.userParams.region, geolibType:userInfo.userParams.geolibType,
        dateDate:dateDate1,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU2_1_Fuchengmen",description:"i want to do something"}},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM2_1 = outData.result.dateId;
          next();
        });
      },

      function(next){
        var userInfo = user4Info2.userInfoMale1;
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM5, password:gPassword,deviceType:userInfo.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuserM5 create 1st date.");
        var userInfo = user4Info2.userInfoMale1;
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{latlng:userInfo.userParams.latlng, region:userInfo.userParams.region, geolibType:userInfo.userParams.geolibType,
        dateDate:dateDate1,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU5_1_Chegongzhuang",description:"i want to do something"}},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM5_1 = outData.result.dateId;
          next();
        });
      },

      function(next){
        var userInfo = user4Info2.userInfoMale2;
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM6, password:gPassword,deviceType:userInfo.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuserM6 create 1st date.");
        var userInfo = user4Info2.userInfoMale2;
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{latlng:userInfo.userParams.latlng, region:userInfo.userParams.region, geolibType:userInfo.userParams.geolibType,
        dateDate:dateDate1,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU6_1_Xizhimen",description:"i want to do something"}},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM5_1 = outData.result.dateId;
          next();
        });
      },

      function(next){
        var waitMs = config.config.solrCommitWithin*2+config.config.solrPeriodicThreadInterval*2;
        console.log("wait to let dates to solr, ms="+waitMs);
        setTimeout(function(){
          next();
        },waitMs);//setTimeout
      },

      function(next){
        var userInfo = user4Info1.userInfoFemale3;
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountF3, password:gPassword,deviceType:userInfo.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 3 get 4 NearbyDates");
        var userInfo = user4Info1.userInfoFemale3;
        testlib.runPRApi({host:host,port:port,path:'/user/getNearbyDates',notLogResponseHere:null,
          postDataObj:{start:0,count:10,
            latlng:userInfo.userParams.latlng, region:userInfo.userParams.region, geolibType:userInfo.userParams.geolibType}},function(err,outData){
                assert.ok(outData.status=="success");
                assert.ok(outData.result.dates.length == 4);
                next();
        });
      },
      function(next){
        console.log("\nuser3 logout");
        testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/logOut',notLogResponseHere:null,
        postDataObj:{userId:userIdF3}},function(err,outData){
          next();
        });
      },
//      function(next){
//        console.log("\nanonymous get 0 Nearby Dates");
//        var userInfo = user4Info1.userInfoFemale3;
//        testlib.runPRApi({host:host,port:port,path:'/user/getNearbyDates',notLogResponseHere:null,
//          postDataObj:{start:0,count:10,
//            latlng:userInfo.userParams.latlng, region:userInfo.userParams.region, geolibType:userInfo.userParams.geolibType}},function(err,outData){
//                assert.ok(outData.status=="success");
//                assert.ok(!outData.result.dates || outData.result.dates.length == 0);
//                next();
//        });
//      },
//      function(next){
//        console.log("\nanonymous get 4 Nearby Dates");
//        var userInfo = user4Info1.userInfoFemale3;
//        testlib.runPRApi({host:host,port:port,path:'/user/getNearbyDates',notLogResponseHere:null,
//          postDataObj:{start:0,count:10, targetGender:"male",
//            latlng:userInfo.userParams.latlng, region:userInfo.userParams.region, geolibType:userInfo.userParams.geolibType}},function(err,outData){
//                assert.ok(outData.status=="success");
//                assert.ok(outData.result.dates.length == 4);
//                next();
//        });
//      },

      function(next){
        var userInfo = user4Info2.userInfoFemale4;
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountF8, password:gPassword,deviceType:userInfo.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuser 8 get 4 NearbyDates with rev order, BUT why NOT?");
        var userInfo = user4Info2.userInfoFemale4;
        testlib.runPRApi({host:host,port:port,path:'/user/getNearbyDates',notLogResponseHere:null,
          postDataObj:{start:0,count:10,
            latlng:userInfo.userParams.latlng, region:userInfo.userParams.region, geolibType:userInfo.userParams.geolibType}},function(err,outData){
                assert.ok(outData.status=="success");
                assert.ok(outData.result.dates.length == 4);
                next();
        });
      },


      function(next){
        //DoAssert
        if (next) next();
      },
      function(){
        if (cbFun) cbFun(null);
      }
  );//handy.pipeline
};//busGetNearbyDates1




/**
*
* @param params - contains (optional)port, ..
* @param next - is function(next)
*/
function testCreateDateAndSendToNearbyUser1LocalBothSides(params,next){
  handy.log('blue', "running testCreateDateAndSendToNearbyUser1LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, needClearSolr:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testCreateDateAndSendToNearbyUser1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testCreateDateAndSendToNearbyUser1LocalBothSides
/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testCreateDateAndSendToNearbyUser1ClientSide(params,cbFun){
  handy.log('blue', "testCreateDateAndSendToNearbyUser1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busCreateDateAndSendToNearbyUser1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busCreateDateAndSendToNearbyUser1
}//testCreateDateAndSendToNearbyUser1ClientSide

function busCreateDateAndSendToNearbyUser1(params,cbFun){
  handy.log('blue', "busCreateDateAndSendToNearbyUser1 enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  var host = params.host;
  var port = params.port;
  var securePort = params.securePort;
  var latlngNS1 = "39.907366,116.356716";//Fuxingmen
  var latlngNS2 = "39.923429,116.355343";//Fuchengmen
  var latlngNS3 = "39.932644,116.355515";//Chegongzhuang
  var latlngNS4 = "39.940278,116.355171";//Xizhimen

  var user4Info1 = null, user4Info2 = null;
  var userIdM1, userIdM2, userIdF3, userIdF4, userIdM5, userIdM6, userIdF7, userIdF8;
  var emailAccountM1, emailAccountM2, emailAccountF3, emailAccountF4, emailAccountM5, emailAccountM6, emailAccountF7, emailAccountF8;
  var dateIdUM1_1, dateIdUM1_2, dateIdUM1_3, dateIdUM1_4;

  var dateDate0 = handy.getNowOfUTCdate().getTime();
  var dateDate1 = dateDate0+1*24*60*60*1000;
  handy.pipeline(
      function(next){
        var lparams = tool.cloneObject(params);
        tool.copyFields({srcObj:{name1:'Adam',name2:'Bob',name3:'Clara',name4:'Daisy',
          latlng1:latlngNS1,latlng2:latlngNS2,latlng3:latlngNS1,latlng4:latlngNS2},destObj:lparams});
        busPrepare4User(lparams,function(outData){
          user4Info1 = outData;
          userIdM1 = outData.userInfoMale1.registerOutData.result.userId;
          userIdM2 = outData.userInfoMale2.registerOutData.result.userId;
          userIdF3 = outData.userInfoFemale3.registerOutData.result.userId;
          userIdF4 = outData.userInfoFemale4.registerOutData.result.userId;
          emailAccountM1 = outData.userInfoMale1.userParams.emailAccount;
          emailAccountM2 = outData.userInfoMale2.userParams.emailAccount;
          emailAccountF3 = outData.userInfoFemale3.userParams.emailAccount;
          emailAccountF4 = outData.userInfoFemale4.userParams.emailAccount;
          if (next) next();
        });//busPrepare4User
      },
      function(next){
        var lparams = tool.cloneObject(params);
        tool.copyFields({srcObj:{name1:'Edward',name2:'Ford',name3:'Georgia',name4:'Helen',
          latlng1:latlngNS3,latlng2:latlngNS4,latlng3:latlngNS3,latlng4:latlngNS4},destObj:lparams});
        busPrepare4User(lparams,function(outData){
          user4Info2 = outData;
          userIdM5 = outData.userInfoMale1.registerOutData.result.userId;
          userIdM6 = outData.userInfoMale2.registerOutData.result.userId;
          userIdF7 = outData.userInfoFemale3.registerOutData.result.userId;
          userIdF8 = outData.userInfoFemale4.registerOutData.result.userId;
          emailAccountM5 = outData.userInfoMale1.userParams.emailAccount;
          emailAccountM6 = outData.userInfoMale2.userParams.emailAccount;
          emailAccountF7 = outData.userInfoFemale3.userParams.emailAccount;
          emailAccountF8 = outData.userInfoFemale4.userParams.emailAccount;
          if (next) next();
        });//busPrepare4User
      },

      function(next){
        var waitMs = config.config.solrCommitWithin*2+config.config.solrPeriodicThreadInterval*2;
        console.log("wait to let users to solr, ms="+waitMs);
        setTimeout(function(){
          next();
        },waitMs);//setTimeout
      },

      function(next){
        var userInfo = user4Info1.userInfoMale1;
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:userInfo.userParams.emailAccount, password:userInfo.userParams.password, deviceType:userInfo.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuserM1 create 1st date.");
        var userInfo = user4Info1.userInfoMale1;
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{latlng:userInfo.userParams.latlng, region:userInfo.userParams.region, geolibType:userInfo.userParams.geolibType,
        dateDate:dateDate1,whoPay:0,wantPersonCount:1,existPersonCount:1,address:'address',title:"dateU1_1_Fuxingmen",description:"i want to do something"}},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM1_1 = outData.result.dateId;
          next();
        });
      },


      function(next){
        //DoAssert
        if (next) next();
      },
      function(){
        if (cbFun) cbFun(null);
      }
  );//handy.pipeline
};//busCreateDateAndSendToNearbyUser1





/**
*
* @param params - contains (optional)port, ..
*     @see busAddDeviceAndUser
* @param next - is function(next)
*/
function testGetMadeDatesLocalBothSides(params,next){
  handy.log('blue', "running testGetMadeDatesLocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testGetMadeDatesClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testGetMadeDatesLocalBothSides
/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busAddDeviceAndUser
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testGetMadeDatesClientSide(params,cbFun){
  handy.log('blue', "testGetMadeDatesClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busGetMadeDates(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busGetMadeDates
}//testGetMadeDatesClientSide

function busGetMadeDates(params,cbFun){
  handy.log('blue', "busGetMadeDates enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  var host = params.host;
  var port = params.port;
  var securePort = params.securePort;
  var user4Info1 = null, user4Info2 = null;
  var userIdM1, userIdM2, userIdF3, userIdF4, userIdM5, userIdM6, userIdF7, userIdF8;
  var emailAccountM1, emailAccountM2, emailAccountF3, emailAccountF4, emailAccountM5, emailAccountM6, emailAccountF7, emailAccountF8;
  var madeRegion = config.config.madeRegion;
  var dateDate0 = handy.getNowOfUTCdate().getTime();
  var dateDate1 = dateDate0+1*24*60*60*1000;
  var dateDate2 = dateDate0+2*24*60*60*1000;
  var dateDate4 = dateDate0+4*24*60*60*1000;
  handy.pipeline(
      function(next){
        console.log("\nmade users 1 batch");
        var lparams = tool.cloneObject(params);
        tool.copyFields({srcObj:{name1:'Adam',name2:'Bob',name3:'Clara',name4:'Daisy',
          region1:madeRegion,region2:madeRegion,region3:madeRegion,region4:madeRegion},destObj:lparams});
        busPrepare4User(lparams,function(outData){
          user4Info1 = outData;
          userIdM1 = outData.userInfoMale1.registerOutData.result.userId;
          userIdM2 = outData.userInfoMale2.registerOutData.result.userId;
          userIdF3 = outData.userInfoFemale3.registerOutData.result.userId;
          userIdF4 = outData.userInfoFemale4.registerOutData.result.userId;
          emailAccountM1 = outData.userInfoMale1.userParams.emailAccount;
          emailAccountM2 = outData.userInfoMale2.userParams.emailAccount;
          emailAccountF3 = outData.userInfoFemale3.userParams.emailAccount;
          emailAccountF4 = outData.userInfoFemale4.userParams.emailAccount;
          if (next) next();
        });//busPrepare4User
      },
      function(next){
        console.log("\nmade users 2 batch");
        var lparams = tool.cloneObject(params);
        tool.copyFields({srcObj:{name1:'Edward',name2:'Ford',name3:'Georgia',name4:'Helen',
          region1:madeRegion,region2:madeRegion,region3:madeRegion,region4:madeRegion},destObj:lparams});
        busPrepare4User(lparams,function(outData){
          user4Info2 = outData;
          userIdM5 = outData.userInfoMale1.registerOutData.result.userId;
          userIdM6 = outData.userInfoMale2.registerOutData.result.userId;
          userIdF7 = outData.userInfoFemale3.registerOutData.result.userId;
          userIdF8 = outData.userInfoFemale4.registerOutData.result.userId;
          emailAccountM5 = outData.userInfoMale1.userParams.emailAccount;
          emailAccountM6 = outData.userInfoMale2.userParams.emailAccount;
          emailAccountF7 = outData.userInfoFemale3.userParams.emailAccount;
          emailAccountF8 = outData.userInfoFemale4.userParams.emailAccount;
          if (next) next();
        });//busPrepare4User
      },

      function(next){
        console.log("\nmade dates of male");
        var userInfo = user4Info1.userInfoMale1;
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:userInfo.userParams.emailAccount, password:gPassword,deviceType:userInfo.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuserM1 create 1st date.");
        var userInfo = user4Info1.userInfoMale1;
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{latlng:userInfo.userParams.latlng, region:madeRegion, geolibType:userInfo.userParams.geolibType,
        dateDate:dateDate2,whoPay:0,wantPersonCount:1,address:'address',title:"date title",description:"i want to do something"}},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM1_1 = outData.result.dateId;
          next();
        });
      },

      function(next){
        var userInfo = user4Info1.userInfoMale2;
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:userInfo.userParams.emailAccount, password:gPassword,deviceType:userInfo.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuserM2 create 1st date.");
        var userInfo = user4Info1.userInfoMale2;
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{latlng:userInfo.userParams.latlng, region:madeRegion, geolibType:userInfo.userParams.geolibType,
        dateDate:dateDate2,whoPay:0,wantPersonCount:1,address:'address',title:"date title",description:"i want to do something"}},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM2_1 = outData.result.dateId;
          next();
        });
      },

      function(next){
        var userInfo = user4Info2.userInfoMale1;
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:userInfo.userParams.emailAccount, password:gPassword,deviceType:userInfo.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuserM5 create 1st date.");
        var userInfo = user4Info2.userInfoMale1;
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{latlng:userInfo.userParams.latlng, region:madeRegion, geolibType:userInfo.userParams.geolibType,
        dateDate:dateDate2,whoPay:0,wantPersonCount:1,address:'address',title:"date title",description:"i want to do something"}},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM5_1 = outData.result.dateId;
          next();
        });
      },

      function(next){
        var userInfo = user4Info2.userInfoMale2;
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:userInfo.userParams.emailAccount, password:gPassword,deviceType:userInfo.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuserM6 create 1st date.");
        var userInfo = user4Info2.userInfoMale2;
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{latlng:userInfo.userParams.latlng, region:madeRegion, geolibType:userInfo.userParams.geolibType,
        dateDate:dateDate2,whoPay:0,wantPersonCount:1,address:'address',title:"date title",description:"i want to do something"}},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM6_1 = outData.result.dateId;
          next();
        });
      },

      function(next){
        console.log("\nmade dates of female");
        var userInfo = user4Info1.userInfoFemale3;
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:userInfo.userParams.emailAccount, password:gPassword,deviceType:userInfo.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuserF3 create 1st date.");
        var userInfo = user4Info1.userInfoFemale3;
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{latlng:userInfo.userParams.latlng, region:madeRegion, geolibType:userInfo.userParams.geolibType,
        dateDate:dateDate2,whoPay:0,wantPersonCount:1,address:'address',title:"date title",description:"i want to do something"}},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUF3_1 = outData.result.dateId;
          next();
        });
      },


      function(next){
        var userInfo = user4Info1.userInfoFemale4;
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:userInfo.userParams.emailAccount, password:gPassword,deviceType:userInfo.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuserF3 create 1st date.");
        var userInfo = user4Info1.userInfoFemale4;
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{latlng:userInfo.userParams.latlng, region:madeRegion, geolibType:userInfo.userParams.geolibType,
        dateDate:dateDate2,whoPay:0,wantPersonCount:1,address:'address',title:"date title",description:"i want to do something"}},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUF4_1 = outData.result.dateId;
          next();
        });
      },

      function(next){
        var userInfo = user4Info2.userInfoFemale3;
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:userInfo.userParams.emailAccount, password:gPassword,deviceType:userInfo.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuserF7 create 1st date.");
        var userInfo = user4Info2.userInfoFemale3;
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{latlng:userInfo.userParams.latlng, region:madeRegion, geolibType:userInfo.userParams.geolibType,
        dateDate:dateDate2,whoPay:0,wantPersonCount:1,address:'address',title:"date title",description:"i want to do something"}},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUF7_1 = outData.result.dateId;
          next();
        });
      },

      function(next){
        var userInfo = user4Info2.userInfoFemale4;
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:userInfo.userParams.emailAccount, password:gPassword,deviceType:userInfo.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nuserF8 create 1st date.");
        var userInfo = user4Info2.userInfoFemale4;
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{latlng:userInfo.userParams.latlng, region:madeRegion, geolibType:userInfo.userParams.geolibType,
        dateDate:dateDate2,whoPay:0,wantPersonCount:1,address:'address',title:"date title",description:"i want to do something"}},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUF8_1 = outData.result.dateId;
          next();
        });
      },

      function(next){
        console.log("\nuser logout");
        var userInfo = user4Info2.userInfoFemale4;
        testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/logOut',notLogResponseHere:null,
        postDataObj:{userId:"aaa"}},function(err,outData){
          next();
        });
      },
      function(next){
        console.log("\nanonymous get Nearby Dates, default gender");
        var userInfo = user4Info2.userInfoFemale4;
        testlib.runPRApi({host:host,port:port,path:'/user/getNearbyDates',notLogResponseHere:null,
          postDataObj:{start:0,count:10,
            latlng:userInfo.userParams.latlng, region:madeRegion, geolibType:userInfo.userParams.geolibType}},function(err,outData){
                assert.ok(outData.status=="success");
                assert.ok(outData.result.dates.length == 4);
                next();
        });
      },
      function(next){
        console.log("\nanonymous get Nearby Dates, for male");
        var userInfo = user4Info2.userInfoFemale4;
        testlib.runPRApi({host:host,port:port,path:'/user/getNearbyDates',notLogResponseHere:null,
          postDataObj:{start:0,count:10,targetGender:'male',
            latlng:userInfo.userParams.latlng, region:madeRegion, geolibType:userInfo.userParams.geolibType}},function(err,outData){
                assert.ok(outData.status=="success");
                assert.ok(outData.result.dates.length == 4);
                next();
        });
      },

      function(next){
        console.log("\nuser logIn");
        var userInfo = user4Info1.userInfoFemale4;
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:userInfo.userParams.emailAccount, password:gPassword,deviceType:userInfo.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nlogin user get 0 Nearby Dates");
        var userInfo = user4Info2.userInfoFemale4;
        testlib.runPRApi({host:host,port:port,path:'/user/getNearbyDates',notLogResponseHere:null,
          postDataObj:{start:0,count:10,
            latlng:userInfo.userParams.latlng, region:madeRegion, geolibType:userInfo.userParams.geolibType}},function(err,outData){
                assert.ok(outData.status=="success");
                assert.ok(!outData.result.dates || outData.result.dates.length == 0);
                next();
        });
      },

      function(next){
        //DoAssert
        if (next) next();
      },
      function(){
        if (cbFun) cbFun(null);
      }
  );//handy.pipeline
};//busGetMadeDates







/**
*
* @param params - contains (optional)port, ..
*
* @param next - is function(next)
*/
function testUploadPhotoLocalBothSides(params,next){
  handy.log('blue', "running testUploadPhotoLocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testUploadPhotoClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testUploadPhotoLocalBothSides

/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testUploadPhotoClientSide(params,cbFun){
  handy.log('blue', "testUploadPhotoClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  busUploadPhoto(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busUploadPhoto
}//testUploadPhotoClientSide

function busUploadPhoto(params,cbFun){
  handy.log('blue', "busUploadPhoto enter");
  assert.ok(params.host);
  assert.ok(params.port);
  var host = params.host;
  var port = params.port;

  var userId = null;
  var addDeviceUserPhotoOutData = null;
  handy.pipeline(
      function(next){
        busAddDeviceAndUser(params,function(deviceAndUserInfo){
          userId = deviceAndUserInfo.addDeviceOutData.result.userId;
          addDeviceUserPhotoOutData = deviceAndUserInfo;
          if (next) next();
        });//busAddDeviceAndUser
      },
      function(next){
        testlib.runCurlCmdForUploadPhoto({host:host,port:port,notLogResponseHere:null,
          postDataObj:{image:"/mnt/hgfs/zly/t/tpic/IMG_0087-moo-s.JPG",notUploadReally:true,userId:userId,width:100,height:74}},function(err,uploadPhotoOutData){
            assert.ifError(err);
            //util.log('testRunCurlCmdForUploadPhoto postDataObj outData='+util.inspect(outData,false,100));
            addDeviceUserPhotoOutData.uploadPhotoOutData = uploadPhotoOutData;
            if (next) next();
          });//runCurlCmdForUploadPhoto
      },
      function(next){
        //DoAssert
        if (next) next();
      },
      function(){
        if (cbFun) cbFun(addDeviceUserPhotoOutData);
      }
  );//handy.pipeline
};//busUploadPhoto


function testRunCurlCmdForUploadPhoto(params,next){
  handy.log('blue', "running testRunCurlCmdForUploadPhoto");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  testlib.setConfigDefaultValue();
  testlib.provideServerLifeCycle(
    {port:params.port, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testlib.runCurlCmdForUploadPhoto({host:host,port:port,notLogResponseHere:null,
        postDataObj:{image:"/mnt/hgfs/zly/t/tpic/IMG_0087-moo-s.JPG",notUploadReally:true,userId:1,width:100,height:74}},function(err,outData){
          util.log('testRunCurlCmdForUploadPhoto postDataObj outData='+util.inspect(outData,false,100));
          if (cbNext) cbNext();
        });//runCurlCmdForUploadPhoto
    },
    next
  );//provideServerLifeCycle
};//testRunCurlCmdForUploadPhoto








/**
*
* @param params - contains (optional)port,securePort, uploadReally ..
*     @see busAddDeviceAndUser
* @param next - is function(next)
*/
function testInitUserPhotoLocalBothSides(params,next){
  handy.log('blue', "running testInitUserPhotoLocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testInitUserPhotoClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testInitUserPhotoLocalBothSides
/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; uploadReally ..
 *     @see busAddDeviceAndUser
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testInitUserPhotoClientSide(params,cbFun){
  handy.log('blue', "testInitUserPhotoClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busInitUserPhoto(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busInitUserPhoto
}//testInitUserPhotoClientSide

/**
 *
 * @param params - contains host,port,securePort; (optional) uploadReally, notAutoAudit,
 *   emailAccount,password,name,height,gender, deviceType, region, geolibType
 * @param cbFun - is function(outData)
 *   outData contains registerOutData,updateLocationOutData,uploadPhotoOutData
 */
function busInitUserPhoto(params,cbFun){
    handy.log('blue', "busInitUserPhoto enter");
    assert.ok(params.host);
    assert.ok(params.port);
    assert.ok(params.securePort);
    var host = params.host;
    var port = params.port;
    var securePort = params.securePort;
    var uploadReally = params.uploadReally;
    var notAutoAudit = params.notAutoAudit;
    var notUploadPhoto = params.notUploadPhoto;

    var emailAccount = params.emailAccount;
    var password = params.password;
    var name = params.name;
    var school = params.school;
    //var studentNO = params.studentNO;
    var gender = params.gender;
    var deviceType = params.deviceType;
    var deviceId = params.deviceId;
    var latlng = params.latlng;
    var region = params.region;
    var geolibType = params.geolibType;
    var nowTime = handy.getNowOfUTCdate().getTime();
    if (!emailAccount) emailAccount = "emailAccount@abc."+nowTime;
    if (!password) password = 'password';
    if (!name) name = "name"+nowTime;
    if (!school) school = gSchool; //'school';
    //if (!studentNO) studentNO = "studentNO";
    if (!gender) gender = 'male';
    if (!deviceType) deviceType = gDeviceType;
    if (!deviceId) deviceId = gDeviceId;
    var userId, photoId;
    var registerOutData, updateLocationOutData, uploadPhotoOutData;
    var inviteCode;
    testlib.setConfigDefaultValue();
    handy.pipeline(
//        function(next){
//          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/generateInviteCode',notLogResponseHere:null,
//          postDataObj:{expireDays:1}},function(err,outData){
//            assert.ok(outData.status=="success");
//            inviteCode = outData.result.inviteCode;
//            next();
//          });
//        },

        function(next){
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/register',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount, password:password, name:name,school:school,gender:gender,
          deviceType:deviceType,deviceId:gDeviceId,latlng:latlng,region:region,geolibType:geolibType}},function(err,outData){
            registerOutData = outData;
            userId = outData.result.userId;
            return next();
          });
        },

        function(next){
          return next();
//          if (region) return next();
//          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/updateLocation',notLogResponseHere:null,
//          postDataObj:{userId:userId,geolibType:'ios',region:gRegionByIos1}},function(err,outData){
//            updateLocationOutData = outData;
//            return next();
//          });
        },
        function(next){
          if (notUploadPhoto) return next();
//          testlib.runCurlCmdForUploadPhoto({host:host,port:port,notLogResponseHere:null,
//            //postDataObj:{image:"/mnt/hgfs/zly/t/a1.log",notUploadReally:!uploadReally,userId:userId,width:900,height:800}},function(err,outData){
//            postDataObj:{image:gUploadPhotoPath,notUploadReally:!uploadReally,userId:userId,width:900,height:800}},function(err,outData){
//              assert.ifError(err);
//              //util.log('testRunCurlCmdForUploadPhoto postDataObj outData='+util.inspect(outData,false,100));
//              uploadPhotoOutData = outData;
//              photoId = outData.result.photoId;
//              return next();
//            });//runCurlCmdForUploadPhoto
          testlib.runPRApiUploadPhoto({host:host,port:port,waitMsTimeForApiBackground:null,notLogResponseHere:null,
            postDataObj:{userId:userId,notUploadReally:!uploadReally, image:gUploadPhotoPath,userId:userId,width:900,height:800}},function(err,outData){
              assert.ifError(err);
              uploadPhotoOutData = outData;
              photoId = outData.result.photoId;
              return next();
            });//runCurlCmdForUploadPhoto
        },
//        function(next){
//          if (notAutoAudit){
//            return next();
//          }else{// need auto audit
//            testlib.runPRApi({host:host,port:port,path:'/web/singleAuditPhoto',notLogResponseHere:null,
//            postDataObj:{photoId:photoId,passed:true,description:'call by test codes',normalApiReturn:true,region:'abc'}},function(err,outData){
//              return next();
//            });
//            return;
//          }
//        },
        function(next){
          //DoAssert
          if (next)  return next();
        },
        function(){
          var outData = {registerOutData:registerOutData, updateLocationOutData:updateLocationOutData, uploadPhotoOutData:uploadPhotoOutData};
          if (cbFun) cbFun(outData);
        }
    );//handy.pipeline
}//busInitUserPhoto






/**
*
* @param params - contains host,port,securePort; (optional) uploadReally, notAutoAudit,
*     name1, name2, name3, name4, gender1, gender2, ..
* @param cbFun - is function(outData)
*   outData contains userInfoMale1 , userInfoMale2, userInfoFemale3, userInfoFemale4
*     userInfoMale1 contains registerOutData,updateLocationOutData,uploadPhotoOutData
*/
function busPrepare4User(params,cbFun){
  handy.log('blue', "busPrepare4User enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  var host = params.host;
  var port = params.port;
  var securePort = params.securePort;
  var uploadReally = params.uploadReally;
  var notAutoAudit = params.notAutoAudit;
  var notUploadPhoto = params.notUploadPhoto;

  var now = new Date();
  var nowDtStr = handy.formatDate({dt:now, needUTC:false, needSeparateChar:false, needSecondPart:true,needMsPart:true});
  var mailHostPart = gMailHostPart;

  var name1 = params.name1;
  var name2 = params.name2;
  var name3 = params.name3;
  var name4 = params.name4;
  var emailAccount1 = params.emailAccount1;
  var emailAccount2 = params.emailAccount2;
  var emailAccount3 = params.emailAccount3;
  var emailAccount4 = params.emailAccount4;
  var gender1 = params.gender1;
  var gender2 = params.gender2;
  var gender3 = params.gender3;
  var gender4 = params.gender4;
  var deviceType1 = params.deviceType1;
  var deviceType2 = params.deviceType2;
  var deviceType3 = params.deviceType3;
  var deviceType4 = params.deviceType4;
  var deviceId1 = params.deviceId1;
  var deviceId2 = params.deviceId2;
  var deviceId3 = params.deviceId3;
  var deviceId4 = params.deviceId4;
  var latlng1 = params.latlng1;
  var latlng2 = params.latlng2;
  var latlng3 = params.latlng3;
  var latlng4 = params.latlng4;
  var region1 = params.region1;
  var region2 = params.region2;
  var region3 = params.region3;
  var region4 = params.region4;
  var geolibType1 = params.geolibType1;
  var geolibType2 = params.geolibType2;
  var geolibType3 = params.geolibType3;
  var geolibType4 = params.geolibType4;
  if (!name1) name1 = 'Adam '+nowDtStr;
  if (!name2) name2 = 'Bob '+nowDtStr;
  if (!name3) name3 = 'Clara '+nowDtStr;
  if (!name4) name4 = 'Daisy '+nowDtStr;
  if (!emailAccount1) emailAccount1=name1+mailHostPart;
  if (!emailAccount2) emailAccount2=name2+mailHostPart;
  if (!emailAccount3) emailAccount3=name3+mailHostPart;
  if (!emailAccount4) emailAccount4=name4+mailHostPart;
  var password1 = gPassword, password2 = gPassword, password3 = gPassword, password4 = gPassword;
  var height1 = 181, height2 = 182, height3 = 163, height4 = 164 ;
  if (!gender1) gender1 = 'male';
  if (!gender2) gender2 = 'male';
  if (!gender3) gender3 = 'female';
  if (!gender4) gender4 = 'female';
  if (!deviceType1) deviceType1 = 'android';
  if (!deviceType2) deviceType2 = 'iphone';
  if (!deviceType3) deviceType3 = 'android';
  if (!deviceType4) deviceType4 = 'iphone' ;
  if (!deviceId1) deviceId1 = gDeviceId;
  if (!deviceId2) deviceId2 = gDeviceId;
  if (!deviceId3) deviceId3 = gDeviceId;
  if (!deviceId4) deviceId4 = gDeviceId;
  if (!latlng1) latlng1 = gLatlng1;
  if (!latlng2) latlng2 = gLatlng1;
  if (!latlng3) latlng3 = gLatlng1;
  if (!latlng4) latlng4 = gLatlng1;
  if (!region1) region1 = gRegionByGoogle1;
  if (!region2) region2 = gRegionByGoogle1;
  if (!region3) region3 = gRegionByGoogle1;
  if (!region4) region4 = gRegionByGoogle1;
  if (!geolibType1) geolibType1 = gGeolibTypeGoogle;
  if (!geolibType2) geolibType2 = gGeolibTypeGoogle;
  if (!geolibType3) geolibType3 = gGeolibTypeGoogle;
  if (!geolibType4) geolibType4 = gGeolibTypeGoogle ;

  var userInfoMale1 , userInfoMale2, userInfoFemale3, userInfoFemale4 ;
  handy.pipeline(
      function(next){
        var lParams = {host:host,port:port,securePort:securePort, emailAccount:emailAccount1,password:password1,name:name1,gender:gender1,height:height1,
              deviceType:deviceType1,deviceId:deviceId1,latlng:latlng1,region:region1,geolibType:geolibType1,
              uploadReally:uploadReally,notAutoAudit:notAutoAudit,notUploadPhoto:notUploadPhoto};
        busInitUserPhoto(lParams,function(outData){
          userInfoMale1 = outData;
          userInfoMale1.userParams = lParams;
          if (next) next();
        });//busInitUserPhoto
      },
      function(next){
        var lParams = {host:host,port:port,securePort:securePort, emailAccount:emailAccount2,password:password2,name:name2,gender:gender2,height:height2,
              deviceType:deviceType2,deviceId:deviceId2,latlng:latlng2,region:region2,geolibType:geolibType2,
              uploadReally:uploadReally,notAutoAudit:notAutoAudit,notUploadPhoto:notUploadPhoto};
        busInitUserPhoto(lParams,function(outData){
          userInfoMale2 = outData;
          userInfoMale2.userParams = lParams;
          if (next) next();
        });//busInitUserPhoto
      },
      function(next){
        var lParams = {host:host,port:port,securePort:securePort, emailAccount:emailAccount3,password:password3,name:name3,gender:gender3,height:height3,
              deviceType:deviceType3,deviceId:deviceId3,latlng:latlng3,region:region3,geolibType:geolibType3,
              uploadReally:uploadReally,notAutoAudit:notAutoAudit,notUploadPhoto:notUploadPhoto};
        busInitUserPhoto(lParams,function(outData){
          userInfoFemale3 = outData;
          userInfoFemale3.userParams = lParams;
          if (next) next();
        });//busInitUserPhoto
      },
      function(next){
        var lParams = {host:host,port:port,securePort:securePort, emailAccount:emailAccount4,password:password4,name:name4,gender:gender4,height:height4,
              deviceType:deviceType4,deviceId:deviceId4,latlng:latlng4,region:region4,geolibType:geolibType4,
              uploadReally:uploadReally,notAutoAudit:notAutoAudit,notUploadPhoto:notUploadPhoto};
        busInitUserPhoto(lParams,function(outData){
          userInfoFemale4 = outData;
          userInfoFemale4.userParams = lParams;
          if (next) next();
        });//busInitUserPhoto
      },

      function(next){
        //DoAssert
        if (next) next();
      },
      function(){
        var user4Info = {userInfoMale1:userInfoMale1, userInfoMale2:userInfoMale2, userInfoFemale3:userInfoFemale3, userInfoFemale4:userInfoFemale4};
        if (cbFun) cbFun(user4Info);
      }
  );//handy.pipeline
};//busPrepare4User























/**
*
* @param params - contains (optional)port, ..
*     @see busAddDeviceAndUser
* @param next - is function(next)
*/
function testDateLatestMessageAndViewed1LocalBothSides(params,next){
  handy.log('blue', "running testDateLatestMessageAndViewed1LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testDateLatestMessageAndViewed1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testDateLatestMessageAndViewed1LocalBothSides
/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busAddDeviceAndUser
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testDateLatestMessageAndViewed1ClientSide(params,cbFun){
  handy.log('blue', "testDateLatestMessageAndViewed1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busDateLatestMessageAndViewed1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busDateLatestMessageAndViewed1
}//testDateLatestMessageAndViewed1ClientSide

function busDateLatestMessageAndViewed1(params,cbFun){
  handy.log('blue', "busDateLatestMessageAndViewed1 enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  var host = params.host;
  var port = params.port;
  var securePort = params.securePort;
  var user4Info1 = null, user4Info2 = null;
  var userIdM1, userIdM2, userIdF3, userIdF4, userIdF7, userIdF8;
  var dateIdUM1_1, dateIdUM3_1, dateIdUM1_2;
  var messageIdDM1_UF3_1, messageIdDM1_UF3_1sys, messageIdDM1_UM1_1, messageIdDM1_UM3_2,
      messageIdDM1_UM1_2sys, messageIdDM1_UF3_2sys, messageIdDM1_UM1_3sys, messageIdDM1_UF3_3sys;
  var dateDate0 = handy.getNowOfUTCdate().getTime();
  var dateDate1 = dateDate0+1*24*60*60*1000;
  var dateDate2 = dateDate0+2*24*60*60*1000;
  var dateDate3 = dateDate0+3*24*60*60*1000;
  handy.pipeline(
      function(next){
        busPrepare4User(params,function(outData){
          user4Info1 = outData;
          userIdM1 = outData.userInfoMale1.registerOutData.result.userId;
          userIdM2 = outData.userInfoMale2.registerOutData.result.userId;
          userIdF3 = outData.userInfoFemale3.registerOutData.result.userId;
          userIdF4 = outData.userInfoFemale4.registerOutData.result.userId;
          if (next) next();
        });//busPrepare4User
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
        dateDate:dateDate1,whoPay:0,wantPersonCount:1,address:'address',description:"i want to do something",
        credit:3}},function(err,outData){
          dateIdUM1_1 = outData.result.dateId;
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
        dateDate:dateDate2,whoPay:0,wantPersonCount:1,address:'address',description:"i want to do something",
        credit:3}},function(err,outData){
          dateIdUM3_1 = outData.result.dateId;
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
        dateDate:dateDate3,whoPay:0,wantPersonCount:1,address:'address',description:"i want to do something",
        credit:3}},function(err,outData){
          dateIdUM1_2 = outData.result.dateId;
          next();
        });
      },

//      function(next){
//        busPrepare4User(params,function(outData){
//          user4Info2 = outData;
//          userIdF7 = outData.userInfoFemale3.registerOutData.result.userId;
//          userIdF8 = outData.userInfoFemale4.registerOutData.result.userId;
//          if (next) next();
//        });//busPrepare4User
//      },

      function(next){
        console.log("\nuser 1 getDates init");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,count:10}},function(err,outData){
          var dates = outData.result.dates;
          for(var i=0; i<dates.length; i++){
            var date = dates[i];

          }
          next();
        });
      },
      function(next){
        console.log("\nuser 3 getDates init");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:10}},function(err,outData){
          next();
        });
      },
      function(next){
        console.log("\nuser 4 getDates init");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF4,count:10}},function(err,outData){
          next();
        });
      },

      function(next){
        console.log("\nsetDateConversationViewed when no message");
        testlib.runPRApi({host:host,port:port,path:'/user/setDateConversationViewed',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1}},function(err,outData){
          next();
        });
      },
      function(next){
        console.log("\nuser 1 getDates after setDateConversationViewed when no message");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,count:10}},function(err,outData){
          next();
        });
      },
      function(next){
        console.log("\nuser 3 getDates after setDateConversationViewed when no message");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:10}},function(err,outData){
          next();
        });
      },

      function(next){
        console.log("\nuser 3 respond 1st message");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1,messageText:'msgF3-M1'}},function(err,outData){
          messageIdDM1_UF3_1 = outData.result.messageId;
          messageIdDM1_UF3_1sys = outData.result.sysMessage.messageId;
          next();
        });
      },
      function(next){
        console.log("\nafter user 3 respond 1 message, user 1 getdates, should have unviewed message, latestmessageId be "+messageIdDM1_UF3_1);
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,count:10}},function(err,outData){
          next();
        });
      },
      function(next){
        console.log("\nafter user 3 respond 1 message, user 3 getdates, should have NO unviewed message, latestmessageId be "+messageIdDM1_UF3_1);
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:10}},function(err,outData){
          next();
        });
      },

      function(next){
        console.log("\nuser 1 setDateConversationViewed after user 3 respond 1 message");
        testlib.runPRApi({host:host,port:port,path:'/user/setDateConversationViewed',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1}},function(err,outData){
          next();
        });
      },
      function(next){
        console.log("\nuser 1 getDates after user 1 setDateConversationViewed after user 3 respond 1 message, should have NO unviewed message");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,count:10}},function(err,outData){
          next();
        });
      },
      function(next){
        console.log("\nuser 3 getDates after user 1 setDateConversationViewed after user 3 respond 1 message, should still have NO unviewed message");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:10}},function(err,outData){
          next();
        });
      },

      function(next){
        console.log("\nuser 1 send UpdateLocation1-2nd-normal message");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1,messageText:'msgM1-F3'}},function(err,outData){
          messageIdDM1_UM1_1 = outData.result.messageId;
          next();
        });
      },
      function(next){
        console.log("\nafter user 1 respond session1-2nd-normal message, user 1 getdates, should have NO unviewed message, latestmessageId be "+messageIdDM1_UM1_1);
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,count:10}},function(err,outData){
          next();
        });
      },
      function(next){
        console.log("\nafter user 1 respond session1-2nd-normal message, user 3 getdates, should have unviewed message, latestmessageId be "+messageIdDM1_UM1_1);
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:10}},function(err,outData){
          next();
        });
      },


      function(next){
        console.log("\nuser 4 respond 1st message");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdF4,targetUserId:userIdM1,dateId:dateIdUM1_1,messageText:'msgF4-M1'}},function(err,outData){
          next();
        });
      },

      function(next){
        console.log("\nuser 3 send session1-3rd-normal message");
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1,messageText:'msgF3-M1'}},function(err,outData){
          messageIdDM1_UM3_2 = outData.result.messageId;
          next();
        });
      },
      function(next){
        console.log("\nafter user 3 send session1-3rd-normal message, user 1 getdates, session1 should have unviewed message, latestmessageId be "+messageIdDM1_UM1_1);
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,count:10}},function(err,outData){
          next();
        });
      },
      function(next){
        console.log("\nafter user 3 send session1-3rd-normal message, user 3 getdates, session1 should have NO unviewed message, latestmessageId be "+messageIdDM1_UM1_1);
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:10}},function(err,outData){
          next();
        });
      },

      function(next){
        console.log("\nuser 1 setDateConversationViewed after user 3 send session1-3rd-normal message");
        testlib.runPRApi({host:host,port:port,path:'/user/setDateConversationViewed',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1}},function(err,outData){
          next();
        });
      },
      function(next){
        console.log("\nuser 1 getDates after user 1 setDateConversationViewed after user 3 send session1-3rd-normal message, session1 should have NO unviewed message");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,count:10}},function(err,outData){
          next();
        });
      },

      function(next){
        //DoAssert
        if (next) next();
      },
      function(){
        if (cbFun) cbFun(null);
      }
  );//handy.pipeline
};//busDateLatestMessageAndViewed1






/**
*
* @param params - contains (optional)port, ..
*     @see
* @param next - is function(next)
*/
function testGetDatesByPage3WithActiveSortLocalBothSides(params,next){
  handy.log('blue', "running testGetDatesByPage3WithActiveSortLocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testGetDatesByPage3WithActiveSortClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testGetDatesByPage3WithActiveSortLocalBothSides
/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busAddDeviceAndUser
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testGetDatesByPage3WithActiveSortClientSide(params,cbFun){
  handy.log('blue', "testGetDatesByPage3WithActiveSortClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busGetDatesByPage3WithActiveSort(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busGetDatesByPage3WithActiveSort
}//testGetDatesByPage3WithActiveSortClientSide

function busGetDatesByPage3WithActiveSort(params,cbFun){
  handy.log('blue', "busGetDatesByPage3WithActiveSort enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  var host = params.host;
  var port = params.port;
  var securePort = params.securePort;
  //var dateDate1 = new Date(9999999999999).getTime();// +3 wei, ge wei shang require step 2 //2286-10-21 1:46:39.999
  //var dateDate1 = new Date(4899999999999).getTime();//+3 wei, ge wei shang ok for step 1 // 2125-3-11 7:6:39.999
  //var dateDate1 = handy.getNowOfUTCdate().getTime();// +4 wei, not OK, for step seems to be 2.
  var dt = handy.getNowOfUTCdate().getTime();
  var tenMinInMs = 10*60*1000;
  var offset = tenMinInMs *10000;
  var dateDate1 = dt + offset;
  var dateDate2 = dateDate1 - tenMinInMs*2;
  var dateDate3 = dateDate1 - tenMinInMs*3;
  var dateDate4 = dateDate1 - tenMinInMs*4;
  var dateDate_1 = dt - offset;
  var user4Info1 ;
  var userIdM1, userIdM2, userIdF3, userIdF4, userIdM5, userIdM6, userIdF7, userIdF8;
  var dateIdUM1_1, dateIdUM3_1, dateIdUM1_2, dateIdUM3_2, dateIdUM1_3, dateIdUM3_3, dateIdUM2_1, dateIdUM3_4;
  //all to user3,
  //[dateIdUM1_1],  [dateIdUM3_1] , [dateIdUM3_2, dateIdUM1_2], [dateIdUM1_3, dateIdUM3_3, dateIdUM2_1]
  var getLastDate1, getLastDate2, getLastDateAsc1, getLastDateAsc2, getLastDateAsc21, getLastDateAsc22;
  var count = 3;//4;//3;
  handy.pipeline(
      function(next){
        busPrepare4User(params,function(outData){
          //userId = outData.addDeviceOutData.result.userId;
          user4Info1 = outData;
          userIdM1 = outData.userInfoMale1.registerOutData.result.userId;
          userIdM2 = outData.userInfoMale2.registerOutData.result.userId;
          userIdF3 = outData.userInfoFemale3.registerOutData.result.userId;
          userIdF4 = outData.userInfoFemale4.registerOutData.result.userId;
          if (next) next();
        });//busPrepare4User
      },
//      function(next){
//        busPrepare4User(params,function(outData){
//          userIdM5 = outData.userInfoMale1.addDeviceOutData.result.userId;
//          userIdM6 = outData.userInfoMale2.addDeviceOutData.result.userId;
//          userIdF7 = outData.userInfoFemale3.addDeviceOutData.result.userId;
//          userIdF8 = outData.userInfoFemale4.addDeviceOutData.result.userId;
//          if (next) next();
//        });//busPrepare4User
//      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
        dateDate:dateDate1,whoPay:0,wantPersonCount:1,address:'address',description:"date_t1_u1_1",
        credit:3}},function(err,outData){
          dateIdUM1_1 = outData.result.dateId;
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
        dateDate:dateDate2,whoPay:0,wantPersonCount:1,address:'address',description:"date_t2_u3_1",
        credit:3}},function(err,outData){
          dateIdUM3_1 = outData.result.dateId;
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
        dateDate:dateDate3,whoPay:0,wantPersonCount:1,address:'address',description:"date_t3_u1_2",
        credit:3}},function(err,outData){
          dateIdUM1_2 = outData.result.dateId;
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
        dateDate:dateDate3,whoPay:0,wantPersonCount:1,address:'address',description:"date_t3_u3_2",
        credit:3}},function(err,outData){
          dateIdUM3_2 = outData.result.dateId;
          next();
        });
      },


      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
        dateDate:dateDate4,whoPay:0,wantPersonCount:1,address:'address',description:"date_t4_u1_3",
        credit:3}},function(err,outData){
          dateIdUM1_3 = outData.result.dateId;
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
        dateDate:dateDate4,whoPay:0,wantPersonCount:1,address:'address',description:"date_t4_u3_3",
        credit:3}},function(err,outData){
          dateIdUM3_3 = outData.result.dateId;
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM2,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
        dateDate:dateDate4,whoPay:0,wantPersonCount:1,address:'address',description:"date_t4_u2_1",
        credit:3}},function(err,outData){
          dateIdUM2_1 = outData.result.dateId;
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
        dateDate:dateDate_1,whoPay:0,wantPersonCount:1,address:'address',description:"date_t_1_u3_4",
        credit:3}},function(err,outData){
          dateIdUM3_4 = outData.result.dateId;
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1,messageText:'msg1'}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM3_1,messageText:'msg2'}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_2,messageText:'msg3'}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM3_2,messageText:'msg4'}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_3,messageText:'msg5'}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM3_3,messageText:'msg6'}},function(err,outData){
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM2,dateId:dateIdUM2_1,messageText:'msg7'}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM3_4,messageText:'msg8'}},function(err,outData){
          next();
        });
      },

      function(next){
        console.log("\nuser 3 1st get 3 dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:count,type:"all",getDataDirection:"fromLateToEarly"}},function(err,outData){
          var dates = outData.result.dates;
          assert.ok(dates.length==count);
          assert.ok(dates[0].dateId == dateIdUM3_4);
          assert.ok(dates[1].dateId == dateIdUM2_1);
          assert.ok(dates[2].dateId == dateIdUM3_3);
          getLastDate1 = dates[dates.length-1];
          next();
        });
      },
      function(next){
        console.log("\nuser 3 2nd get 3 dates");
        var zsetScore = getLastDate1.orderScore-1;
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:count,cutOffTime:zsetScore,type:"all",getDataDirection:"fromLateToEarly"}},function(err,outData){
          var dates = outData.result.dates;
          assert.ok(dates.length==count);
          assert.ok(dates[0].dateId == dateIdUM1_3);
          assert.ok(dates[1].dateId == dateIdUM3_2);
          assert.ok(dates[2].dateId == dateIdUM1_2);
          getLastDate2 = dates[dates.length-1];
          next();
        });
      },
      function(next){
        console.log("\nuser 3 3rd get 2 dates");
        var zsetScore = getLastDate2.orderScore-1;
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:count,cutOffTime:zsetScore,type:"all",getDataDirection:"fromLateToEarly"}},function(err,outData){
          var dates = outData.result.dates;
          assert.ok(dates.length==2);
          assert.ok(dates[0].dateId == dateIdUM3_1);
          assert.ok(dates[1].dateId == dateIdUM1_1);
          next();
        });
      },

      function(next){
        console.log("\nuser 3 asc 1st get 3 dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:count,type:"all",getDataDirection:"fromEarlyToLate"}},function(err,outData){
          var dates = outData.result.dates;
          assert.ok(dates.length==count);
          assert.ok(dates[0].dateId == dateIdUM1_1);
          assert.ok(dates[1].dateId == dateIdUM3_1);
          assert.ok(dates[2].dateId == dateIdUM1_2);
          getLastDateAsc1 = dates[dates.length-1];
          next();
        });
      },
      function(next){
        console.log("\nuser 3 asc 2nd get 3 dates");
        var zsetScore = getLastDateAsc1.orderScore-0+1;
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:count,cutOffTime:zsetScore,type:"all",getDataDirection:"fromEarlyToLate"}},function(err,outData){
          var dates = outData.result.dates;
          assert.ok(dates.length==count);
          assert.ok(dates[0].dateId == dateIdUM3_2);
          assert.ok(dates[1].dateId == dateIdUM1_3);
          assert.ok(dates[2].dateId == dateIdUM3_3);
          getLastDateAsc2 = dates[dates.length-1];
          next();
        });
      },
      function(next){
        console.log("\nuser 3 asc 3rd get 2 dates");
        var zsetScore = getLastDateAsc2.orderScore-0+1;
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:count,cutOffTime:zsetScore,type:"all",getDataDirection:"fromEarlyToLate"}},function(err,outData){
          var dates = outData.result.dates;
          assert.ok(dates.length==2);
          assert.ok(dates[0].dateId == dateIdUM2_1);
          assert.ok(dates[1].dateId == dateIdUM3_4);
          next();
        });
      },

//      function(next){
//        console.log("\nuser 3 asc 1st get 3 valid dates, should no dateId="+dateIdUM3_4);
//        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
//        postDataObj:{userId:userIdF3,count:count,type:"all",getDataDirection:"fromEarlyToLate",excludeExpired:true}},function(err,outData){
//          var dates = outData.result.dates;
//          assert.ok(dates.length==count);
//          assert.ok(dates[0].dateDate == dateDate4);
//          assert.ok(dates[1].dateDate == dateDate4);
//          assert.ok(dates[2].dateDate == dateDate4);
//          getLastDateAsc21 = dates[dates.length-1];
//          next();
//        });
//      },
//      function(next){
//        console.log("\nuser 3 asc 2nd get 3 valid dates");
//        var zsetScore = getLastDateAsc21.orderScore-0+1;
//        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
//        postDataObj:{userId:userIdF3,count:count,type:"all",cutOffTime:zsetScore,getDataDirection:"fromEarlyToLate"}},function(err,outData){
//          var dates = outData.result.dates;
//          assert.ok(dates.length==count);
//          assert.ok(dates[0].dateDate == dateDate3);
//          assert.ok(dates[1].dateDate == dateDate3);
//          assert.ok(dates[2].dateDate == dateDate2);
//          getLastDateAsc22 = dates[dates.length-1];
//          next();
//        });
//      },
//      function(next){
//        console.log("\nuser 3 asc 3rd get 1 valid dates");
//        var zsetScore = getLastDateAsc22.orderScore-0+1;
//        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
//        postDataObj:{userId:userIdF3,count:count,type:"all",cutOffTime:zsetScore,getDataDirection:"fromEarlyToLate"}},function(err,outData){
//          var dates = outData.result.dates;
//          assert.ok(dates.length==1);
//          assert.ok(dates[0].dateDate == dateDate1);
//          next();
//        });
//      },

      function(next){
        console.log("\nuser 3 get onlySend 1st get 3 dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:count,type:"onlySend",getDataDirection:"fromLateToEarly"}},function(err,outData){
          var dates = outData.result.dates;
          assert.ok(dates.length==count);
          assert.ok(dates[0].dateId == dateIdUM3_4);
          assert.ok(dates[1].dateId == dateIdUM3_3);
          assert.ok(dates[2].dateId == dateIdUM3_2);
          getLastDate1 = dates[dates.length-1];
          next();
        });
      },
      function(next){
        console.log("\nuser 3 get onlySend 2nd get 1 dates");
        var zsetScore = getLastDate1.orderScore-1;
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:count,cutOffTime:zsetScore,type:"onlySend",getDataDirection:"fromLateToEarly"}},function(err,outData){
          var dates = outData.result.dates;
          assert.ok(dates.length==1);
          assert.ok(dates[0].dateId == dateIdUM3_1);
          next();
        });
      },

      function(next){
        console.log("\nuser 3 get onlyReceive 1st get 3 dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:count,type:"onlyReceive",getDataDirection:"fromLateToEarly"}},function(err,outData){
          var dates = outData.result.dates;
          assert.ok(dates.length==count);
          assert.ok(dates[0].dateId == dateIdUM2_1);
          assert.ok(dates[1].dateId == dateIdUM1_3);
          assert.ok(dates[2].dateId == dateIdUM1_2);
          getLastDate1 = dates[dates.length-1];
          next();
        });
      },
      function(next){
        console.log("\nuser 3 get onlyReceive 2nd get 1 dates");
        var zsetScore = getLastDate1.orderScore-1;
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:count,cutOffTime:zsetScore,type:"onlyReceive",getDataDirection:"fromLateToEarly"}},function(err,outData){
          var dates = outData.result.dates;
          assert.ok(dates.length==1);
          assert.ok(dates[0].dateId == dateIdUM1_1);
          next();
        });
      },

      function(next){
        console.log("\nuser 3 get doubleConfirm 1st get 0 dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:count,type:"doubleConfirm",getDataDirection:"fromLateToEarly"}},function(err,outData){
          var dates = outData.result.dates;
          assert.ok(!dates || dates.length==0);
          next();
        });
      },

      //confirm all date for user 3 to test getDate with type=doubleConfirm
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF4,dateId:dateIdUM1_1}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF4,targetUserId:userIdM1,dateId:dateIdUM1_1}},function(err,outData){
          next();
        });
      },

      function(next){
        console.log("\nuser 3 get doubleConfirm 2nd get 0 dates, after the received date doubleCconfirmed by others");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:count,type:"doubleConfirm",getDataDirection:"fromLateToEarly"}},function(err,outData){
          var dates = outData.result.dates;
          assert.ok(!dates || dates.length==0);
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM3_1}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM3_1}},function(err,outData){
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_2}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_2}},function(err,outData){
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM3_2}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM3_2}},function(err,outData){
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_3}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_3}},function(err,outData){
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM3_3}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM3_3}},function(err,outData){
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM2,targetUserId:userIdF3,dateId:dateIdUM2_1}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM2,dateId:dateIdUM2_1}},function(err,outData){
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM3_4}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM3_4}},function(err,outData){
          next();
        });
      },


      function(next){
        console.log("\nuser 3 get doubleConfirm B1 get 3 dates");
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:count,type:"doubleConfirm",getDataDirection:"fromLateToEarly"}},function(err,outData){
          var dates = outData.result.dates;
          assert.ok(dates.length==count);
          assert.ok(dates[0].dateId == dateIdUM3_4);
          assert.ok(dates[1].dateId == dateIdUM2_1);
          assert.ok(dates[2].dateId == dateIdUM3_3);
          getLastDate1 = dates[dates.length-1];
          next();
        });
      },
      function(next){
        console.log("\nuser 3 get doubleConfirm B2 get 1 dates");
        var zsetScore = getLastDate1.orderScore-1;
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:count,cutOffTime:zsetScore,type:"doubleConfirm",getDataDirection:"fromLateToEarly"}},function(err,outData){
          var dates = outData.result.dates;
          assert.ok(dates.length==count);
          assert.ok(dates[0].dateId == dateIdUM1_3);
          assert.ok(dates[1].dateId == dateIdUM3_2);
          assert.ok(dates[2].dateId == dateIdUM1_2);
          getLastDate2 = dates[dates.length-1];
          next();
        });
      },
      function(next){
        console.log("\nuser 3 get doubleConfirm B2 get 1 dates");
        var zsetScore = getLastDate2.orderScore-1;
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:count,cutOffTime:zsetScore,type:"doubleConfirm",getDataDirection:"fromLateToEarly"}},function(err,outData){
          var dates = outData.result.dates;
          assert.ok(dates.length==1);
          assert.ok(dates[0].dateId == dateIdUM3_1);
          next();
        });
      },

      function(next){
        //DoAssert
        if (next) next();
      },
      function(){
        if (cbFun) cbFun(null);
      }
  );//handy.pipeline
};//busGetDatesByPage3WithActiveSort



/**
*
* @param params - contains (optional)port, ..
*     @see busAddDeviceAndUser
* @param next - is function(next)
*/
function testConfirmDateChecks1LocalBothSides(params,next){
  handy.log('blue', "running testConfirmDateChecks1LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testConfirmDateChecks1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testConfirmDateChecks1LocalBothSides
/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busAddDeviceAndUser
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testConfirmDateChecks1ClientSide(params,cbFun){
  handy.log('blue', "testConfirmDateChecks1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  busConfirmDateChecks1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busConfirmDateChecks1
}//testConfirmDateChecks1ClientSide

function busConfirmDateChecks1(params,cbFun){
  handy.log('blue', "busConfirmDateChecks1 enter");
  assert.ok(params.host);
  assert.ok(params.port);
  var host = params.host;
  var port = params.port;
  var user4Info1;
//  var createDateOutData, getDatesOutDataUM1_1, sendDateOutDataUM1_1, getDatesOutDataUM1_2, getDatesOutDataUM1_3, getDatesOutDataUF3_1, getDatesOutDataUF7_1;
//  var sendMessageOutData1, sendMessageOutData2, sendMessageOutData3, getMessageHistoryOutData1;
//  var confirmDateOutData1, confirmDateOutData2;
  var userIdM1, userIdF3, userIdF4, userIdF7, userIdF8;
  var dateIdUM1_1, dateIdUM1_2;
  handy.pipeline(
      function(next){
        busPrepare4User(params,function(outData){
          user4Info1 = outData;
          userIdM1 = outData.userInfoMale1.addDeviceOutData.result.userId;
          userIdF3 = outData.userInfoFemale3.addDeviceOutData.result.userId;
          userIdF4 = outData.userInfoFemale4.addDeviceOutData.result.userId;
          if (next) next();
        });//busPrepare4User
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/updateLocation',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,geolibType:'ios',region:gRegionByIos1}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/updateLocation',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,geolibType:'ios',region:gRegionByIos1}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/updateLocation',notLogResponseHere:null,
        postDataObj:{userId:userIdF4,geolibType:'ios',region:gRegionByIos1}},function(err,outData){
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
        dateDate:1337539249633,whoPay:0,wantPersonCount:1,address:'address',description:"i want to do something",
        credit:3}},function(err,outData){
          //createDateOutData = outData;
          dateIdUM1_1 = outData.result.dateId;
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
        dateDate:1337539249633,whoPay:0,money:234,address:'address',description:"i want to do something2",
        credit:3}},function(err,outData){
          dateIdUM1_2 = outData.result.dateId;
          next();
        });
      },

      function(next){
        busPrepare4User(params,function(outData){
          user4Info2 = outData;
          userIdF7 = outData.userInfoFemale3.addDeviceOutData.result.userId;
          userIdF8 = outData.userInfoFemale4.addDeviceOutData.result.userId;
          if (next) next();
        });//busPrepare4User
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/updateLocation',notLogResponseHere:null,
        postDataObj:{userId:userIdF7,geolibType:'ios',region:gRegionByIos1}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/updateLocation',notLogResponseHere:null,
        postDataObj:{userId:userIdF8,geolibType:'ios',region:gRegionByIos1}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,dateId:dateIdUM1_1,credit:3}},function(err,outData){
          next();
        });
      },

      //date1, sender first confirm
      function(next){//sender confirm responder1
        console.log("date1, sender first confirm");
        console.log("sender confirm responder1, should succ");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1}},function(err,outData){
          next();
        });
      },
      function(next){//sender re-confirm responder1
        console.log("sender re-confirm responder1, should fail");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1}},function(err,outData){
          next();
        });
      },
      function(next){//sender confirm other-responder2
        console.log("sender confirm other-responder2, should fail for now");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF4,dateId:dateIdUM1_1}},function(err,outData){
          next();
        });
      },

      function(next){//responder1 confirm sender
        console.log("responder1 confirm sender, should succ");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1}},function(err,outData){
          next();
        });
      },
      function(next){//responder1 re-confirm sender
        console.log("responder1 re-confirm sender, should fail");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1}},function(err,outData){
          next();
        });
      },
      function(next){//other-responder2 confirm sender
        console.log("other-responder2 confirm sender, should fail");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF4,targetUserId:userIdM1,dateId:dateIdUM1_1}},function(err,outData){
          next();
        });
      },


      //date2, responder first confirm
      function(next){//responder1 confirm
        console.log("date2, responder first confirm");
        console.log("responder1 confirm, should succ");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_2}},function(err,outData){
          next();
        });
      },
      function(next){//responder1 re-confirm
        console.log("responder1 re-confirm, should fail");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_2}},function(err,outData){
          next();
        });
      },
      function(next){//responder2 confirm
        console.log("responder2 confirm, should succ");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF4,targetUserId:userIdM1,dateId:dateIdUM1_2}},function(err,outData){
          next();
        });
      },

      function(next){//sender confirm responder1
        console.log("sender confirm responder1, should succ");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_2}},function(err,outData){
          next();
        });
      },
      function(next){//sender re-confirm responder1
        console.log("sender re-confirm responder1, should fail");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_2}},function(err,outData){
          next();
        });
      },
      function(next){//sender confirm other-responder2
        console.log("sender confirm other-responder2, should fail");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF4,dateId:dateIdUM1_2}},function(err,outData){
          next();
        });
      },
      function(next){//responder3 confirm
        console.log("responder3 confirm, should fail");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF7,targetUserId:userIdM1,dateId:dateIdUM1_2}},function(err,outData){
          next();
        });
      },
      function(next){
        //DoAssert
        if (next) next();
      },
      function(){
        if (cbFun) cbFun(null);
      }
  );//handy.pipeline
};//busConfirmDateChecks1



/**
*
* @param params - contains (optional)port, ..
*     @see busAddDeviceAndUser
* @param next - is function(next)
*/
function testConfirmDate2LocalBothSides(params,next){
  handy.log('blue', "running testConfirmDate2LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testConfirmDate2ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testConfirmDate2LocalBothSides
/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busAddDeviceAndUser
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testConfirmDate2ClientSide(params,cbFun){
  handy.log('blue', "testConfirmDate2ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  busConfirmDate2(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busConfirmDate2
}//testConfirmDate2ClientSide

function busConfirmDate2(params,cbFun){
  handy.log('blue', "busConfirmDate2 enter");
  assert.ok(params.host);
  assert.ok(params.port);
  var host = params.host;
  var port = params.port;
  var user4Info1;
//  var createDateOutData, getDatesOutDataUM1_1, sendDateOutDataUM1_1, getDatesOutDataUM1_2, getDatesOutDataUM1_3, getDatesOutDataUF3_1, getDatesOutDataUF7_1;
//  var sendMessageOutData1, sendMessageOutData2, sendMessageOutData3, getMessageHistoryOutData1;
//  var confirmDateOutData1, confirmDateOutData2;
  var userIdM1, userIdF3, userIdF4, userIdF7, userIdF8;
  var dateIdUM1_1, dateIdUM1_2;
  handy.pipeline(
      function(next){
        busPrepare4User(params,function(outData){
          user4Info1 = outData;
          userIdM1 = outData.userInfoMale1.addDeviceOutData.result.userId;
          userIdF3 = outData.userInfoFemale3.addDeviceOutData.result.userId;
          userIdF4 = outData.userInfoFemale4.addDeviceOutData.result.userId;
          if (next) next();
        });//busPrepare4User
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
        dateDate:1337539249633,whoPay:0,wantPersonCount:1,address:'address',description:"i want to do something",
        credit:3}},function(err,outData){
          //createDateOutData = outData;
          dateIdUM1_1 = outData.result.dateId;
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
        dateDate:1337539249633,whoPay:0,money:234,address:'address',description:"i want to do something2",
        credit:3}},function(err,outData){
          dateIdUM1_2 = outData.result.dateId;
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,dateId:dateIdUM1_1,credit:3}},function(err,outData){
          next();
        });
      },


      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1,messageText:'msgF3-M1'}},function(err,outData){
          sendMessageOutData1 = outData;
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1,messageText:'msgM1-F3'}},function(err,outData){
          sendMessageOutData2 = outData;
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdF4,targetUserId:userIdM1,dateId:dateIdUM1_1,messageText:'msgF4-M1'}},function(err,outData){
          sendMessageOutData3 = outData;
          next();
        });
      },


      function(next){//sender confirm responder1
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1}},function(err,outData){
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,count:10}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:10}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF4,count:10}},function(err,outData){
          next();
        });
      },

      function(next){//sender confirm responder1
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1}},function(err,outData){
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,count:10}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:10}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF4,count:10}},function(err,outData){
          next();
        });
      },


      function(next){
        //DoAssert
        if (next) next();
      },
      function(){
        if (cbFun) cbFun(null);
      }
  );//handy.pipeline
};//busConfirmDate2








/**
*
* @param params - contains (optional)port, ..
*     @see busAddDeviceAndUser
* @param next - is function(next)
*/
function testNotification1LocalBothSides(params,next){
  handy.log('blue', "running testNotification1LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testNotification1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    function(){
      //if (next) next();
      process.exit(0);//because some unfound reason , process not exit by itself. so here just manual exit process.
    }
  );//provideServerLifeCycle
}//testNotification1LocalBothSides
/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busAddDeviceAndUser
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testNotification1ClientSide(params,cbFun){
  handy.log('blue', "testNotification1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busNotification1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busNotification1
}//testNotification1ClientSide

function busNotification1(params,cbFun){
  handy.log('blue', "busNotification1 enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  var host = params.host;
  var port = params.port;
  var securePort = params.securePort;
  var user4Info1 = null, user4Info2 = null;
  var sendDate1OutData, sendDate2OutData;
  var userIdM1,userIdM2, userIdF3,userIdF4, userIdM5,userIdM6, userIdF7,userIdF8;
  var photoIdUM1_1, photoIdUF3_1;
  var dateIdUM1_1;
  handy.pipeline(
      function(next){
        busPrepare4User(params,function(outData){
          user4Info1 = outData;
          userIdM1 = outData.userInfoMale1.registerOutData.result.userId;
          userIdM2 = outData.userInfoMale2.registerOutData.result.userId;
          userIdF3 = outData.userInfoFemale3.registerOutData.result.userId;
          userIdF4 = outData.userInfoFemale4.registerOutData.result.userId;

          photoIdUM1_1 = outData.userInfoMale1.uploadPhotoOutData.result.photoId;
          photoIdUF3_1 = outData.userInfoFemale3.uploadPhotoOutData.result.photoId;

          if (next) next();
        });//busPrepare4User
      },
      function(next){
        busPrepare4User(params,function(outData){
          user4Info2 = outData;
          userIdM5 = outData.userInfoMale1.registerOutData.result.userId;
          userIdM6 = outData.userInfoMale2.registerOutData.result.userId;
          userIdF7 = outData.userInfoFemale3.registerOutData.result.userId;
          userIdF8 = outData.userInfoFemale4.registerOutData.result.userId;

          if (next) next();
        });//busPrepare4User
      },

//      function(next){
//        testlib.runPRApi({host:host,port:port,path:'/user/updateAppToken',notLogResponseHere:null,
//        postDataObj:{userId:userIdM1, appToken:""}},
//        function(err,outData){
//          next();
//        });
//      },
//      function(next){
//        testlib.runPRApi({host:host,port:port,path:'/user/updateAppToken',notLogResponseHere:null,
//        postDataObj:{userId:userIdF3, appToken:""}},
//        function(err,outData){
//          next();
//        });
//      },
//      function(next){
//        testlib.runPRApi({host:host,port:port,path:'/user/updateAppToken',notLogResponseHere:null,
//        postDataObj:{userId:userIdF4, appToken:""}},
//        function(err,outData){
//          next();
//        });
//      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/updateAppToken',notLogResponseHere:null,
        postDataObj:{userId:userIdM1, appToken:gDeviceToken}},
        function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/updateAppToken',notLogResponseHere:null,
        postDataObj:{userId:userIdF3, appToken:gRegistrationId}},
        function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/updateAppToken',notLogResponseHere:null,
        postDataObj:{userId:userIdF4, appToken:gDeviceToken2}},
        function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nthe photo of user 3 is first like, no credit no notification");
        testlib.runPRApi({host:host,port:port,path:'/user/likePhoto',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,photoId:photoIdUF3_1,type:'like'}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(!outData.result || outData.result.photoOwnerCreditDelta==null);
          next();
        });
      },
      function(next){
        console.log("\nthe photo of user 1 is first like, no credit no notification");
        testlib.runPRApi({host:host,port:port,path:'/user/likePhoto',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,photoId:photoIdUM1_1,type:'like'}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(!outData.result || outData.result.photoOwnerCreditDelta==null);
          next();
        });
      },

      function(next){
        console.log("\nthe photo of user 3 is like for 2 times, 1 credit 1 notification");
        testlib.runPRApi({host:host,port:port,path:'/user/likePhoto',notLogResponseHere:null,
        postDataObj:{userId:userIdM2,photoId:photoIdUF3_1,type:'like'}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.photoOwnerCreditDelta==1);
          next();
        });
      },
      function(next){
        console.log("\nthe photo of user 1 is like for 2 times, 1 credit 1 notification");
        testlib.runPRApi({host:host,port:port,path:'/user/likePhoto',notLogResponseHere:null,
        postDataObj:{userId:userIdF4,photoId:photoIdUM1_1,type:'like'}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.photoOwnerCreditDelta==1);
          next();
        });
      },

      function(next){
        console.log("\nthe photo of user 3 is like for 3 times, no credit no notification");
        testlib.runPRApi({host:host,port:port,path:'/user/likePhoto',notLogResponseHere:null,
        postDataObj:{userId:userIdM5,photoId:photoIdUF3_1,type:'like'}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(!outData.result || outData.result.photoOwnerCreditDelta==null);
          next();
        });
      },
      function(next){
        console.log("\nthe photo of user 1 is like for 3 times, no credit no notification");
        testlib.runPRApi({host:host,port:port,path:'/user/likePhoto',notLogResponseHere:null,
        postDataObj:{userId:userIdF7,photoId:photoIdUM1_1,type:'like'}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(!outData.result || outData.result.photoOwnerCreditDelta==null);
          next();
        });
      },

      function(next){
        console.log("\nthe photo of user 3 is like for 4 times, 1 credit no notification");
        testlib.runPRApi({host:host,port:port,path:'/user/likePhoto',notLogResponseHere:null,
        postDataObj:{userId:userIdM6,photoId:photoIdUF3_1,type:'like'}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.photoOwnerCreditDelta==1);
          next();
        });
      },
      function(next){
        console.log("\nthe photo of user 1 is like for 4 times, 1 credit no notification");
        testlib.runPRApi({host:host,port:port,path:'/user/likePhoto',notLogResponseHere:null,
        postDataObj:{userId:userIdF8,photoId:photoIdUM1_1,type:'like'}},function(err,outData){
          assert.ok(outData.status=="success");
          assert.ok(outData.result.photoOwnerCreditDelta==1);
          next();
        });
      },


      function(next){
        setTimeout(function(){
          if (next) next();
        },waitMsTimeOfSendNotification);
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
        dateDate:handy.getNowOfUTCdate().getTime()+2000000,whoPay:0,wantPersonCount:1,address:'address',description:"i want to do something"
        }},function(err,outData){
          assert.ok(outData.status=="success");
          dateIdUM1_1 = outData.result.dateId;
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        setTimeout(function(){
          if (next) next();
        },waitMsTimeOfSendNotification);
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF4,dateId:dateIdUM1_1}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        setTimeout(function(){
          if (next) next();
        },waitMsTimeOfSendNotification);
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1,messageText:'msgF3-M1'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1,messageText:'msgM1-F3'}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        setTimeout(function(){
          if (next) next();
        },waitMsTimeOfSendNotification);
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        setTimeout(function(){
          if (next) next();
        },waitMsTimeOfSendNotification);
      },
      function(next){
        //DoAssert
        if (next) next();
      },
      function(){
        if (cbFun) cbFun(null);
      }
  );//handy.pipeline
};//busNotification1






/**
*
* @param params - contains (optional)port, ..
*     @see busAddDeviceAndUser
* @param next - is function(next)
*/
function testPagedMessage1LocalBothSides(params,next){
  handy.log('blue', "running testPagedMessage1LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }

  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testPagedMessage1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    function(){
      //if (next) next();
      process.exit(0);//because some unfound reason , process not exit by itself. so here just manual exit process.
    }
  );//provideServerLifeCycle
}//testPagedMessage1LocalBothSides
/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busAddDeviceAndUser
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testPagedMessage1ClientSide(params,cbFun){
  handy.log('blue', "testPagedMessage1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  busPagedMessage1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busPagedMessage1
}//testPagedMessage1ClientSide

function busPagedMessage1(params,cbFun){
  handy.log('blue', "busPagedMessage1 enter");
  assert.ok(params.host);
  assert.ok(params.port);
  var host = params.host;
  var port = params.port;
  var user4Info1 = null, user4Info2 = null;
  var sendDate1OutData, sendDate2OutData;
  var userIdM1,userIdM2, userIdF3,userIdF4;
  var dateIdUM1_1;
  var pageCount = 2;
  var dateDate1 = handy.getNowOfUTCdate().getTime();
  var createTimeOfPageLast1, createTimeOfPageLast2, createTimeOfPageLastB1, createTimeOfPageLastB2;
  handy.pipeline(
      function(next){
        busPrepare4User(params,function(outData){
          user4Info1 = outData;
          userIdM1 = outData.userInfoMale1.addDeviceOutData.result.userId;
          userIdM2 = outData.userInfoMale2.addDeviceOutData.result.userId;
          userIdF3 = outData.userInfoFemale3.addDeviceOutData.result.userId;
          userIdF4 = outData.userInfoFemale4.addDeviceOutData.result.userId;

          if (next) next();
        });//busPrepare4User
      },


      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
        dateDate:dateDate1,whoPay:0,wantPersonCount:1,address:'address',description:"i want to do something"
        }},function(err,outData){
          dateIdUM1_1 = outData.result.dateId;
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1}},function(err,outData){
          sendDate1OutData = outData;
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1,messageText:'msgF3-M1-1'}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1,messageText:'msgM1-F3-1'}},function(err,outData){
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1,messageText:'msgF3-M1-2'}},function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1,messageText:'msgM1-F3-2'}},function(err,outData){
          next();
        });
      },

      function(next){
        console.log("normal page 1");
        testlib.runPRApi({host:host,port:port,path:'/user/getMessageHistory',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1,count:pageCount}},function(err,outData){
          var messages = outData.result.messages;
          createTimeOfPageLast1 = Number(messages[messages.length-1].createTime);
          next();
        });
      },
      function(next){
        console.log("normal page 2");
        testlib.runPRApi({host:host,port:port,path:'/user/getMessageHistory',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1,count:pageCount,cutOffTime:(createTimeOfPageLast1-1)+''}},function(err,outData){
          var messages = outData.result.messages;
          createTimeOfPageLast2 = Number(messages[messages.length-1].createTime);
          next();
        });
      },
      function(next){
        console.log("normal page 3");
        testlib.runPRApi({host:host,port:port,path:'/user/getMessageHistory',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1,count:pageCount,cutOffTime:(createTimeOfPageLast2-1)+''}},function(err,outData){
          next();
        });
      },


      function(next){
        console.log("early to late, page 1");
        testlib.runPRApi({host:host,port:port,path:'/user/getMessageHistory',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1,count:pageCount,getDataDirection:'fromEarlyToLate'}},function(err,outData){
          var messages = outData.result.messages;
          createTimeOfPageLastB1 = Number(messages[messages.length-1].createTime);
          next();
        });
      },
      function(next){
        console.log("early to late, page 2");
        testlib.runPRApi({host:host,port:port,path:'/user/getMessageHistory',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1,count:pageCount,getDataDirection:'fromEarlyToLate',cutOffTime:(createTimeOfPageLastB1+1)+''}},function(err,outData){
          var messages = outData.result.messages;
          createTimeOfPageLastB2 = Number(messages[messages.length-1].createTime);
          next();
        });
      },
      function(next){
        console.log("early to late, page 3");
        testlib.runPRApi({host:host,port:port,path:'/user/getMessageHistory',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1,count:pageCount,getDataDirection:'fromEarlyToLate',cutOffTime:(createTimeOfPageLastB2+1)+''}},function(err,outData){
          next();
        });
      },


      function(next){
        //DoAssert
        if (next) next();
      },
      function(){
        if (cbFun) cbFun(null);
      }
  );//handy.pipeline
};//busPagedMessage1





/**
*
* @param params - contains (optional)port, ..
*     @see busAddDeviceAndUser
* @param next - is function(next)
*/
function testGetMessageRespective2LocalBothSides(params,next){
  handy.log('blue', "running testGetMessageRespective2LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }

  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testGetMessageRespective2ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    function(){
      //if (next) next();
      process.exit(0);//because some unfound reason , process not exit by itself. so here just manual exit process.
    }
  );//provideServerLifeCycle
}//testGetMessageRespective2LocalBothSides
/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busAddDeviceAndUser
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testGetMessageRespective2ClientSide(params,cbFun){
  handy.log('blue', "testGetMessageRespective2ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  busGetMessageRespective2(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busGetMessageRespective2
}//testGetMessageRespective2ClientSide

function busGetMessageRespective2(params,cbFun){
  handy.log('blue', "busGetMessageRespective2 enter");
  assert.ok(params.host);
  assert.ok(params.port);
  var host = params.host;
  var port = params.port;
  var user4Info1 = null, user4Info2 = null;
  var sendDate1OutData, sendDate2OutData;
  var userIdM1,userIdM2, userIdF3,userIdF4;
  var dateIdUM1_1;
  var messageIdU3_U1_1, messageIdU3_U1_1sys, messageIdU1_U3_1, messageIdU3_U1_2;
  var pageCount = 10;
  var dateDate1 = handy.getNowOfUTCdate().getTime();
  var createTimeOfPageLast1, createTimeOfPageLast2, createTimeOfPageLastB1, createTimeOfPageLastB2;
  handy.pipeline(
      function(next){
        busPrepare4User(params,function(outData){
          user4Info1 = outData;
          userIdM1 = outData.userInfoMale1.addDeviceOutData.result.userId;
          userIdM2 = outData.userInfoMale2.addDeviceOutData.result.userId;
          userIdF3 = outData.userInfoFemale3.addDeviceOutData.result.userId;
          userIdF4 = outData.userInfoFemale4.addDeviceOutData.result.userId;

          if (next) next();
        });//busPrepare4User
      },


      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
        dateDate:dateDate1,whoPay:0,wantPersonCount:1,address:'address',description:"i want to do something"
        }},function(err,outData){
          dateIdUM1_1 = outData.result.dateId;
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1}},function(err,outData){
          sendDate1OutData = outData;
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1,messageText:'msgF3-M1-1'}},function(err,outData){
          messageIdU3_U1_1 = outData.result.messageId;
          messageIdU3_U1_1sys = outData.result.sysMessage.messageId;
          next();
        });
      },

      function(next){
        console.log("\nsender getDates after responder first reply, latestMessageId should be "+messageIdU3_U1_1);
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,count:10}},function(err,outData){
          next();
        });
      },
      function(next){
        console.log("\nresponder getDates after responder first reply, latestMessageId should be "+messageIdU3_U1_1);
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:10}},function(err,outData){
          next();
        });
      },

      function(next){
        console.log("\nsender getMessageHistory after responder first reply, should get 2 messages");
        testlib.runPRApi({host:host,port:port,path:'/user/getMessageHistory',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1,count:pageCount}},function(err,outData){
          var messages = outData.result.messages;
          next();
        });
      },
      function(next){
        console.log("\nresponder getMessageHistory after responder first reply, should get 1 messages");
        testlib.runPRApi({host:host,port:port,path:'/user/getMessageHistory',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1,count:pageCount}},function(err,outData){
          var messages = outData.result.messages;
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1,messageText:'msgM1-F3-1'}},function(err,outData){
          messageIdU1_U3_1 = outData.result.messageId;
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1,messageText:'msgF3-M1-2'}},function(err,outData){
          messageIdU3_U1_2 = outData.result.messageId;
          next();
        });
      },

      function(next){
        console.log("\nconfirm date for first, generate 2 system message to both side, 1 notification to opposite");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1}},function(err,outData){
          messageIdU1_U3_1sys = outData.result.sysMessageToTarget.messageId;
          messageIdU3_U1_2sys = outData.result.sysMessageToSelf.messageId;
          next();
        });
      },
      function(next){
        console.log("\nsender getDates after sender first confirm, latestMessageId should be "+messageIdU3_U1_2sys);
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,count:10}},function(err,outData){
          next();
        });
      },
      function(next){
        console.log("\nresponder getDates after sender first confirm, latestMessageId should be "+messageIdU1_U3_1sys);
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:10}},function(err,outData){
          next();
        });
      },

      function(next){
        console.log("\nsender getMessageHistory after sender first confirm, should get 2 sys messages");
        testlib.runPRApi({host:host,port:port,path:'/user/getMessageHistory',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1,count:pageCount}},function(err,outData){
          var messages = outData.result.messages;
          next();
        });
      },
      function(next){
        console.log("\nresponder getMessageHistory after sender first confirm, should get 1 sys messages");
        testlib.runPRApi({host:host,port:port,path:'/user/getMessageHistory',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1,count:pageCount}},function(err,outData){
          var messages = outData.result.messages;
          next();
        });
      },

      function(next){
        console.log("\nconfirm date for second, generate 2 system message to both side, 1 notification to opposite");
        testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1}},function(err,outData){
          messageIdU1_U3_2sys = outData.result.sysMessageToSelf.messageId;
          messageIdU3_U1_3sys = outData.result.sysMessageToTarget.messageId;
          next();
        });
      },
      function(next){
        console.log("\nsender getDates after responder second confirm, latestMessageId should be "+messageIdU3_U1_3sys);
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,count:10}},function(err,outData){
          next();
        });
      },
      function(next){
        console.log("\nresponder getDates after responder second confirm, latestMessageId should be "+messageIdU1_U3_2sys);
        testlib.runPRApi({host:host,port:port,path:'/user/getDates',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,count:10}},function(err,outData){
          next();
        });
      },

      function(next){
        console.log("\nsender getMessageHistory after responder second confirm, should get 3 sys messages");
        testlib.runPRApi({host:host,port:port,path:'/user/getMessageHistory',notLogResponseHere:null,
        postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1,count:pageCount}},function(err,outData){
          var messages = outData.result.messages;
          next();
        });
      },
      function(next){
        console.log("\nresponder getMessageHistory after responder second confirm, should get 2 sys messages");
        testlib.runPRApi({host:host,port:port,path:'/user/getMessageHistory',notLogResponseHere:null,
        postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1,count:pageCount}},function(err,outData){
          var messages = outData.result.messages;
          next();
        });
      },



      function(next){
        //DoAssert
        if (next) next();
      },
      function(){
        if (cbFun) cbFun(null);
      }
  );//handy.pipeline
};//busGetMessageRespective2












/**
*
* @param params - contains (optional)port, ..
*     @see busAddDeviceAndUser
* @param next - is function(next)
*/
function testStat1LocalBothSides(params,next){
  handy.log('blue', "running testStat1LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testStat1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testStat1LocalBothSides
/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busAddDeviceAndUser
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testStat1ClientSide(params,cbFun){
  handy.log('blue', "testStat1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  busStat1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busStat1
}//testStat1ClientSide

/**
 *
 * @param params - contains host,port; (optional) deviceId,name,height,gender
 * @param cbFun - is function(outData)
 *   outData contains deviceId,addDeviceOutData,addUserOutData,uploadPhotoOutData
 */
function busStat1(params,cbFun){
    handy.log('blue', "busStat1 enter");
    assert.ok(params.host);
    assert.ok(params.port);
    var host = params.host;
    var port = params.port;
    var uploadReally = params.uploadReally;
    var user4Info = null;
    var userIdM1, userIdM2, userIdF3, userIdF4;
    var photoIdUM1_1, photoIdUM2_1, photoIdUF3_1 , photoIdUF4_1, photoIdUM1_2;
    var dtNow = handy.getNowOfUTCdate().getTime();
    var tenMinInMs = 10*60*1000;
    var offset = tenMinInMs *10000;
    var dateDate1 = dtNow + offset;

    handy.pipeline(
        function(next){
          busPrepare4User(params,function(outData){
            user4Info = outData;
            userIdM1 = outData.userInfoMale1.addDeviceOutData.result.userId;
            userIdM2 = outData.userInfoMale2.addDeviceOutData.result.userId;
            userIdF3 = outData.userInfoFemale3.addDeviceOutData.result.userId;
            userIdF4 = outData.userInfoFemale4.addDeviceOutData.result.userId;
            photoIdUM1_1 = outData.userInfoMale1.uploadPhotoOutData.result.photoId;
            photoIdUM2_1 = outData.userInfoMale2.uploadPhotoOutData.result.photoId;
            photoIdUF3_1 = outData.userInfoFemale3.uploadPhotoOutData.result.photoId;
            photoIdUF4_1 = outData.userInfoFemale4.uploadPhotoOutData.result.photoId;
            if (next) next();
          });//busPrepare4User
        },

        function(next){
          console.log("\ngetStat init2, should see 2 male user, 2 female user, 4 new user, 2 male photo, 2 female photo, 4 new photo today, 404 giveSum");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },

        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/signIn',notLogResponseHere:null,
          postDataObj:{userId:userIdM1}},function(err,outData){
            next();
          });
        },
        function(next){
          console.log("\ngetStat si1 about active, should see 1 active, 405 giveSum");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },
        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/signIn',notLogResponseHere:null,
          postDataObj:{userId:userIdM1}},function(err,outData){
            next();
          });
        },
        function(next){
          console.log("\ngetStat si2 about active, should see 1 active, 405 giveSum");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },
        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/signIn',notLogResponseHere:null,
          postDataObj:{userId:userIdM2}},function(err,outData){
            next();
          });
        },
        function(next){
          console.log("\ngetStat si3 about active, should see 2 active, 406 giveSum");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },

        function(next){
          testlib.runCurlCmdForUploadPhoto({host:host,port:port,notLogResponseHere:null,
            postDataObj:{image:gUploadPhotoPath,notUploadReally:!uploadReally,userId:userIdM1,width:900,height:800}},function(err,outData){
              assert.ifError(err);
              photoIdUM1_2 = outData.result.photoId;
              if (next) next();
            });//runCurlCmdForUploadPhoto
        },
        function(next){
          console.log("\ngetStat up1 about upload photo, should see 3 male photo, 2 femal photo, 5 new photo today, 406 giveSum");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },

        function(next){
          testlib.runPRApi({host:host,port:port,path:'/web/singleAuditPhoto',notLogResponseHere:null,
          postDataObj:{photoId:photoIdUM1_2,passed:true,description:'manual',normalApiReturn:true,region:'abc'}},function(err,outData){
            next();
          });
        },
        function(next){
          console.log("\ngetStat aup1 about audit photo and credit, should see 3 male photo, 2 femal photo, 5 new photo today, 407 giveSum");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },

        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/deletePhoto',notLogResponseHere:null,
          postDataObj:{userId:userIdM1,photoId:photoIdUM1_2}},function(err,outData){
            //getPhotosOutData1 = outData;
            next();
          });
        },
        function(next){
          console.log("\ngetStat dp1 about delete photo and credit, should see 2 male photo, 2 femal photo, 5 new photo today, 406 giveSum");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },

        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/likePhoto',notLogResponseHere:null,
          postDataObj:{userId:userIdM1,photoId:photoIdUF3_1,type:'like'}},function(err,outData){
            next();
          });
        },
        function(next){
          console.log("\ngetStat lp1 about like photo, should see 1 like, 1 dailylike , 406 giveSum");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },
        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/likePhoto',notLogResponseHere:null,
          postDataObj:{userId:userIdM2,photoId:photoIdUF3_1,type:'like'}},function(err,outData){
            next();
          });
        },
        function(next){
          console.log("\ngetStat lp2 about like photo and credit, should see 2 like, 2 dailylike , 407 giveSum");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },
        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/likePhoto',notLogResponseHere:null,
          postDataObj:{userId:userIdM2,photoId:photoIdUF3_1,type:'unlike'}},function(err,outData){
            next();
          });
        },
        function(next){
          console.log("\ngetStat lp3 about like photo, should see 2 like, 2 dailylike, 1 unlike, 1 dailyUnlike, 407 giveSum ");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },
        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/likePhoto',notLogResponseHere:null,
          postDataObj:{userId:userIdM1,photoId:photoIdUF4_1,type:'like'}},function(err,outData){
            next();
          });
        },
        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/likePhoto',notLogResponseHere:null,
          postDataObj:{userId:userIdM2,photoId:photoIdUF4_1,type:'like'}},function(err,outData){
            next();
          });
        },
        function(next){
          console.log("\ngetStat lp4 about like photo, should see 4 like, 4 dailylike, 1 unlike, 1 dailyUnlike, 2 maxLikeCount, 408 giveSum ");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },

        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
          postDataObj:{userId:userIdM1,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
          dateDate:dateDate1,whoPay:0,wantPersonCount:1,address:'address',description:"i want to do something",
          targetUserId:userIdF3}},function(err,outData){
            dateIdUM1_1 = outData.result.dateId;
            next();
          });
        },
        function(next){
          console.log("\ngetStat cd1 about create date, should see 1 maleCreate, 1 newDaily, 1 sendTo1, 1 treat, 408 giveSum, 1 maleExpend, 1 expendDaily");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },
        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
          postDataObj:{userId:userIdF4,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
          dateDate:dateDate1,whoPay:1,wantPersonCount:1,address:'address',description:"i want to do something",
          credit:3}},function(err,outData){
            dateIdUF4_1 = outData.result.dateId;
            next();
          });
        },
        function(next){
          console.log("\ngetStat cd2 about create date, should see 1 maleCreate, 1 femaleCreate, 2 newDaily, 1 sendTo1, 1 sendTo10,  1 treat, 1 wish, 408 giveSum, 1 maleExpend, 3 femaleExpend, 4 expendDaily");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },

        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/sendDate',notLogResponseHere:null,
          postDataObj:{userId:userIdM1,credit:3,dateId:dateIdUM1_1}},function(err,outData){
            next();
          });
        },
        function(next){
          console.log("\ngetStat sd1 about send date, should see 1 maleCreate, 1 femaleCreate, 1 sendTo1, 2 newDaily, 2 sendTo10,  1 treat, 1 wish, 408 giveSum, 4 maleExpend, 3 femaleExpend, 7 expendDaily");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },

        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
          postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1,messageText:'msgF3-M1-1'}},function(err,outData){
            next();
          });
        },
        function(next){
          console.log("\ngetStat sm1 about respond date, should see 1 maleCreate, 1 femaleCreate, 1 sendTo1, 2 newDaily, 2 sendTo10,  1 treat, 1 wish, 408 giveSum, 4 maleExpend, 3 femaleExpend, 7 expendDaily, 1 respondedDateCount");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },
        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
          postDataObj:{userId:userIdM1,targetUserId:userIdF3 ,dateId:dateIdUM1_1,messageText:'msgM1-F3-1'}},function(err,outData){
            next();
          });
        },
        function(next){
          console.log("\ngetStat sm2 about respond date, should see 1 maleCreate, 1 femaleCreate, 1 sendTo1, 2 newDaily, 2 sendTo10,  1 treat, 1 wish, 408 giveSum, 4 maleExpend, 3 femaleExpend, 7 expendDaily, 1 respondedDateCount");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },
        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
          postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1,messageText:'msgF3-M1-2'}},function(err,outData){
            next();
          });
        },
        function(next){
          console.log("\ngetStat sm3 about respond date, should see 1 maleCreate, 1 femaleCreate, 1 sendTo1, 2 newDaily, 2 sendTo10,  1 treat, 1 wish, 408 giveSum, 4 maleExpend, 3 femaleExpend, 7 expendDaily, 1 respondedDateCount");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },

        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
          postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1}},function(err,outData){
            next();
          });
        },
        function(next){
          console.log("\ngetStat cmd1 about confirm date, single confirm, should still see 1 maleCreate, 1 femaleCreate, 2 newDaily, 1 sendTo1, 2 sendTo10,  1 treat, 1 wish, 408 giveSum, 4 maleExpend, 3 femaleExpend, 7 expendDaily");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },
        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
          postDataObj:{userId:userIdM1,targetUserId:userIdF3,dateId:dateIdUM1_1}},function(err,outData){
            next();
          });
        },
        function(next){
          console.log("\ngetStat cmd2 about confirm date, double confirm, should see 1 maleCreate, 1 femaleCreate, 2 newDaily, 1 sendTo1, 2 sendTo10,  1 treat, 1 wish, 1 doubleConfirmed, 1 doubleConfirmedDaily-today, 408 giveSum, 14 maleExpend, 13 femaleExpend, 27 expendDaily");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },


        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/sendMessage',notLogResponseHere:null,
          postDataObj:{userId:userIdM2,targetUserId:userIdF4,dateId:dateIdUF4_1,messageText:'msgM2-F4-1'}},function(err,outData){
            next();
          });
        },
        function(next){
          console.log("\ngetStat sm4 about respond date, double confirm, should see 1 maleCreate, 1 femaleCreate, 2 newDaily, 1 sendTo1, 2 sendTo10,  1 treat, 1 wish, 1 doubleConfirmed, 1 doubleConfirmedDaily-today, 408 giveSum, 14 maleExpend, 13 femaleExpend, 27 expendDaily, 2 respondedDateCount");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },

        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
          postDataObj:{userId:userIdM2,targetUserId:userIdF4,dateId:dateIdUF4_1}},function(err,outData){
            next();
          });
        },
        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
          postDataObj:{userId:userIdF4,targetUserId:userIdM2,dateId:dateIdUF4_1}},function(err,outData){
            next();
          });
        },
        function(next){
          console.log("\ngetStat cmd3 about confirm date, should see 1 maleCreate, 1 femaleCreate, 2 newDaily, 1 sendTo1, 2 sendTo10,  1 treat, 1 wish, 2 doubleConfirmed, 2 doubleConfirmedDaily-today, 408 giveSum, 24 maleExpend, 23 femaleExpend, 47 expendDaily");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },

        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/followUser',notLogResponseHere:null,
          postDataObj:{userId:userIdM1,targetUserId:userIdF3,type:'follow'}},function(err,outData){
            next();
          });
        },
        function(next){
          console.log("\ngetStat fu1 about follow, should see 1 allSum");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },
        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/followUser',notLogResponseHere:null,
          postDataObj:{userId:userIdM2,targetUserId:userIdF3,type:'follow'}},function(err,outData){
            next();
          });
        },
        function(next){
          console.log("\ngetStat fu2 about follow, should see 2 allSum");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },
        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/followUser',notLogResponseHere:null,
          postDataObj:{userId:userIdM2,targetUserId:userIdF3,type:'unfollow'}},function(err,outData){
            next();
          });
        },
        function(next){
          console.log("\ngetStat fu3 about follow, should see 1 allSum");
          testlib.runPRApi({host:host,port:port,path:'/admin/getStat',notLogResponseHere:null,
          postDataObj:{}},function(err,outData){
            next();
          });
        },

        function(next){
          //DoAssert
          if (next) next();
        },
        function(){
          if (cbFun) cbFun(null);
        }
    );//handy.pipeline
}//busStat1









/**
*
* @param params - contains (optional)port, ..
*     @see
* @param next - is function(next)
*/
function testCheckAndNotifyDaters1LocalBothSides(params,next){
  handy.log('blue', "running testCheckAndNotifyDaters1LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testCheckAndNotifyDaters1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testCheckAndNotifyDaters1LocalBothSides

/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busCheckAndNotifyDaters1
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testCheckAndNotifyDaters1ClientSide(params,cbFun){
  handy.log('blue', "testCheckAndNotifyDaters1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busCheckAndNotifyDaters1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busCheckAndNotifyDaters1
}//testCheckAndNotifyDaters1ClientSide

/**
 *
 * @param params - contains host,port;
 * @param cbFun - is function(outData)
 *   outData contains
 */
function busCheckAndNotifyDaters1(params,cbFun){
    handy.log('blue', "busCheckAndNotifyDaters1 enter");
    assert.ok(params.host);
    assert.ok(params.port);
    assert.ok(params.securePort);
    var host = params.host;
    var port = params.port;
    var securePort = params.securePort;
    var uploadReally = params.uploadReally;

    var span1Hour = 60*60*1000;
    var span2Hour = 2*span1Hour;
    var timeNowUtc = handy.getNowOfUTCdate().getTime();
    var timeNow1h = timeNowUtc + span1Hour;
    var timeNow1h_1 = timeNowUtc + span1Hour-1;
    var timeNow1h_2 = timeNowUtc + span1Hour-2;
    var timeNow2h = timeNowUtc + span2Hour;
    var timeNow2h_1 = timeNowUtc + span2Hour-1;
    var timeNow2h_2 = timeNowUtc + span2Hour-2;
    var timeNow_1h = timeNowUtc - span1Hour;

    var userIdM1, userIdM2, userIdF3, userIdF4, userIdM5, userIdM6, userIdF7, userIdF8;
    var dateIdUM1_1, dateIdUM2_1, dateIdUM5_1, dateIdUM6_1;
    handy.pipeline(
        function(next){
          busPrepare4User(params,function(outData){
            userIdM1 = outData.userInfoMale1.registerOutData.result.userId;
            userIdM2 = outData.userInfoMale2.registerOutData.result.userId;
            userIdF3 = outData.userInfoFemale3.registerOutData.result.userId;
            userIdF4 = outData.userInfoFemale4.registerOutData.result.userId;
            if (next) next();
          });//busPrepare4User
        },
        function(next){
          busPrepare4User(params,function(outData){
            userIdM5 = outData.userInfoMale1.registerOutData.result.userId;
            userIdM6 = outData.userInfoMale2.registerOutData.result.userId;
            userIdF7 = outData.userInfoFemale3.registerOutData.result.userId;
            userIdF8 = outData.userInfoFemale4.registerOutData.result.userId;
            if (next) next();
          });//busPrepare4User
        },

        function(next){
          config.config.diableThreadWorker = true;
          config.config.notifyDaterAdvanceTime = span1Hour;
          config.config.notifyDaterBatchCount = 1;
          next();
        },

        function(next){
          console.log("\ncreate 1 expire date, 2 need notify, 1 not need notify");
          console.log("\ncreate 1 expire date");
          testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
          postDataObj:{userId:userIdM1,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
          dateDate:timeNow_1h,whoPay:0,wantPersonCount:1,address:'address',description:"date_t1_u1_1",
          targetUserId:userIdF3}},function(err,outData){
            dateIdUM1_1 = outData.result.dateId;
            next();
          });
        },
        function(next){
          console.log("\ncreate 2 need notify date, 1st");
          testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
          postDataObj:{userId:userIdM2,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
          dateDate:timeNow1h_1,whoPay:0,wantPersonCount:1,address:'address',description:"date_t1_u1_1",
          targetUserId:userIdF4}},function(err,outData){
            dateIdUM2_1 = outData.result.dateId;
            next();
          });
        },
        function(next){
          console.log("\ncreate 2 need notify date, 2nd");
          testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
          postDataObj:{userId:userIdM5,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
          dateDate:timeNow1h_2,whoPay:0,wantPersonCount:1,address:'address',description:"date_t1_u1_1",
          targetUserId:userIdF7}},function(err,outData){
            dateIdUM5_1 = outData.result.dateId;
            next();
          });
        },
        function(next){
          console.log("\ncreate 1 not need notify date");
          testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
          postDataObj:{userId:userIdM6,geolibType:'ios',region:gRegionByIos1,cityLocation:gCityLocation1,
          dateDate:timeNow2h_1,whoPay:0,wantPersonCount:1,address:'address',description:"date_t1_u1_1",
          targetUserId:userIdF8}},function(err,outData){
            dateIdUM6_1 = outData.result.dateId;
            next();
          });
        },

        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/updateAppToken',notLogResponseHere:null,
          postDataObj:{userId:userIdM2, appToken:gDeviceToken}},
          function(err,outData){
            next();
          });
        },
        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/updateAppToken',notLogResponseHere:null,
          postDataObj:{userId:userIdF4, appToken:gRegistrationId}},
          function(err,outData){
            next();
          });
        },

        function(next){
          console.log("\nconfirm all dates");
          testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
          postDataObj:{userId:userIdM1 ,targetUserId:userIdF3,dateId:dateIdUM1_1}},function(err,outData){
            next();
          });
        },
        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
          postDataObj:{userId:userIdF3,targetUserId:userIdM1,dateId:dateIdUM1_1}},function(err,outData){
            next();
          });
        },
        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
          postDataObj:{userId:userIdM2 ,targetUserId:userIdF4,dateId:dateIdUM2_1}},function(err,outData){
            next();
          });
        },
        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
          postDataObj:{userId:userIdF4,targetUserId:userIdM2,dateId:dateIdUM2_1}},function(err,outData){
            next();
          });
        },
        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
          postDataObj:{userId:userIdM5 ,targetUserId:userIdF7,dateId:dateIdUM5_1}},function(err,outData){
            next();
          });
        },
        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
          postDataObj:{userId:userIdF7,targetUserId:userIdM5,dateId:dateIdUM5_1}},function(err,outData){
            next();
          });
        },
        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
          postDataObj:{userId:userIdM6 ,targetUserId:userIdF8,dateId:dateIdUM6_1}},function(err,outData){
            next();
          });
        },
        function(next){
          testlib.runPRApi({host:host,port:port,path:'/user/confirmDate',notLogResponseHere:null,
          postDataObj:{userId:userIdF8,targetUserId:userIdM6,dateId:dateIdUM6_1}},function(err,outData){
            next();
          });
        },

        function(next){
          console.log("\ncheckAndNotifyDaters run 1");
          testlib.runPRApi({host:host,port:port,path:'/admin/runMethod',notLogResponseHere:null,
          postDataObj:{methodName:'checkAndNotifyDaters'}},function(err,outData){
            next();
          });
        },

        function(next){
          testlib.setConfigDefaultValue();
          next();
        },
        function(next){
          //DoAssert
          next();
        },
        function(){
          var outData = {};
          if (cbFun) cbFun(outData);
        }
    );//handy.pipeline
}//busCheckAndNotifyDaters1







/**
*
* @param params - contains (optional)port, ..
*
* @param next - is function(next)
*/
function testStoreGetUserIdsByQuery1LocalBothSides(params,next){
  handy.log('blue', "running testStoreGetUserIdsByQuery1LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testStoreGetUserIdsByQuery1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testStoreGetUserIdsByQuery1LocalBothSides

/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busStoreGetUserIdsByQuery1
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testStoreGetUserIdsByQuery1ClientSide(params,cbFun){
  handy.log('blue', "testStoreGetUserIdsByQuery1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busStoreGetUserIdsByQuery1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busStoreGetUserIdsByQuery1
}//testStoreGetUserIdsByQuery1ClientSide

/**
 *
 * @param params - contains host,port; (optional) emailAccount,password,name,height,gender,deviceType,
 * @param cbFun - is function(outData)
 *   outData contains deviceId,addDeviceOutData,addUserOutData
 */
function busStoreGetUserIdsByQuery1(params,cbFun){
  handy.log('blue', "busStoreGetUserIdsByQuery1 enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  var host = params.host;
  var port = params.port;
  var securePort = params.securePort;

/*
limitType regions gender  deviceType
nm  r1  m i
nm  r1  m a
nm  r1  f i
nm  r1  f a
nm  r2  m i
nm  r2  m a
nm  r2  f i
nm  r2  f a
l r1  m i
l r1  m a
l r1  f i
l r2  f a

 */

  var p4userParams1 = {
        name1:'Adam',name2:'Bob',name3:'Cathy',name4:'Daisy',
        gender1:'male',gender2:'male',gender3:'female',gender4:'female',
        deviceType1:gDeviceTypeIphone, deviceType2:gDeviceTypeAndroid, deviceType3:gDeviceTypeIphone, deviceType4:gDeviceTypeAndroid,
        region1:gRegionByIos1, region2:gRegionByAndroid1, region3:gRegionByIos1, region4:gRegionByAndroid1,
        geolibType1:gGeolibTypeIos, geolibType2:gGeolibTypeAndroid, geolibType3:gGeolibTypeIos, geolibType4:gGeolibTypeAndroid
      };
  var p4userParams2 = {
      name1:'Edward',name2:'Ford',name3:'Georgia',name4:'Helen',
      gender1:'male',gender2:'male',gender3:'female',gender4:'female',
      deviceType1:gDeviceTypeIphone, deviceType2:gDeviceTypeAndroid, deviceType3:gDeviceTypeIphone, deviceType4:gDeviceTypeAndroid,
      region1:gRegionByIos2, region2:gRegionByAndroid2, region3:gRegionByIos2, region4:gRegionByAndroid2,
      geolibType1:gGeolibTypeIos, geolibType2:gGeolibTypeAndroid, geolibType3:gGeolibTypeIos, geolibType4:gGeolibTypeAndroid
    };
  var p4userParams3 = {
      name1:'Jack',name2:'Karl',name3:'Lucy',name4:'Mary',
      gender1:'male',gender2:'male',gender3:'female',gender4:'female',
      deviceType1:gDeviceTypeIphone, deviceType2:gDeviceTypeAndroid, deviceType3:gDeviceTypeIphone, deviceType4:gDeviceTypeAndroid,
      region1:gRegionByIos1, region2:gRegionByAndroid1, region3:gRegionByIos1, region4:gRegionByAndroid2,
      geolibType1:gGeolibTypeIos, geolibType2:gGeolibTypeAndroid, geolibType3:gGeolibTypeIos, geolibType4:gGeolibTypeAndroid
    };

  var userIdM1, userIdM2, userIdF3, userIdF4, userIdM5, userIdM6, userIdF7, userIdF8,
    userIdM9, userIdM10, userIdF11, userIdF12, userIdM13, userIdM14, userIdF15, userIdF16;


  handy.pipeline(
      function(next){
        var localParams = {};
        tool.copyFields({srcObj:params,destObj:localParams});
        tool.copyFields({srcObj:p4userParams1,destObj:localParams});
        busPrepare4User(localParams,function(outData){
          userIdM1 = outData.userInfoMale1.registerOutData.result.userId;
          userIdM2 = outData.userInfoMale2.registerOutData.result.userId;
          userIdF3 = outData.userInfoFemale3.registerOutData.result.userId;
          userIdF4 = outData.userInfoFemale4.registerOutData.result.userId;
          if (next) next();
        });//busPrepare4User
      },
      function(next){
        var localParams = {};
        tool.copyFields({srcObj:params,destObj:localParams});
        tool.copyFields({srcObj:p4userParams2,destObj:localParams});
        busPrepare4User(localParams,function(outData){
          userIdM5 = outData.userInfoMale1.registerOutData.result.userId;
          userIdM6 = outData.userInfoMale2.registerOutData.result.userId;
          userIdF7 = outData.userInfoFemale3.registerOutData.result.userId;
          userIdF8 = outData.userInfoFemale4.registerOutData.result.userId;
          if (next) next();
        });//busPrepare4User
      },
      function(next){
        var localParams = {notUploadPhoto:true};
        tool.copyFields({srcObj:params,destObj:localParams});
        tool.copyFields({srcObj:p4userParams3,destObj:localParams});
        busPrepare4User(localParams,function(outData){
          userIdM9 = outData.userInfoMale1.registerOutData.result.userId;
          userIdM10 = outData.userInfoMale2.registerOutData.result.userId;
          userIdF11 = outData.userInfoFemale3.registerOutData.result.userId;
          userIdF12 = outData.userInfoFemale4.registerOutData.result.userId;
          if (next) next();
        });//busPrepare4User
      },


      function(next){
        testlib.runPRApi({host:host,port:port,path:'/admin/runMethod',notLogResponseHere:null,
        postDataObj:{methodName:'storeGetUserIdsByQuery',
        limitType:'normal', regions:[gCityLocation1], gender:'male', deviceType:gDeviceTypeIphone}},function(err,outData){
          var userIds = outData.result.userIds;
          assert.ok(userIds.length==1);
          assert.ok(userIds[0]==userIdM1);
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/admin/runMethod',notLogResponseHere:null,
        postDataObj:{methodName:'storeGetUserIdsByQuery',
        limitType:'normal', regions:null, gender:'all', deviceType:null}},function(err,outData){
          var userIds = outData.result.userIds;
          assert.ok(userIds.length==8);
          userIds.sort(testlib.sortByNumberOrderAsc);
          assert.ok(userIds[0]==userIdM1);
          assert.ok(userIds[1]==userIdM2);
          assert.ok(userIds[2]==userIdF3);
          assert.ok(userIds[3]==userIdF4);
          assert.ok(userIds[4]==userIdM5);
          assert.ok(userIds[5]==userIdM6);
          assert.ok(userIds[6]==userIdF7);
          assert.ok(userIds[7]==userIdF8);
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/admin/runMethod',notLogResponseHere:null,
        postDataObj:{methodName:'storeGetUserIdsByQuery',
        limitType:'all', regions:[gCityLocation2], gender:'female', deviceType:gDeviceTypeAndroid}},function(err,outData){
          var userIds = outData.result.userIds;
          assert.ok(userIds.length==2);
          userIds.sort(testlib.sortByNumberOrderAsc);
          //console.log("userIds="+util.inspect(userIds)+", userIdF8="+userIdF8+", userIdF12="+userIdF12);
          assert.ok(userIds[0]==userIdF8);
          assert.ok(userIds[1]==userIdF12);
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/admin/runMethod',notLogResponseHere:null,
        postDataObj:{methodName:'storeGetUserIdsByQuery',
        limitType:'limited', regions:null, gender:'all', deviceType:null}},function(err,outData){
          var userIds = outData.result.userIds;
          assert.ok(userIds.length==4);
          userIds.sort(testlib.sortByNumberOrderAsc);
          assert.ok(userIds[0]==userIdM9);
          assert.ok(userIds[1]==userIdM10);
          assert.ok(userIds[2]==userIdF11);
          assert.ok(userIds[3]==userIdF12);
          next();
        });
      },

      function(next){
        testlib.runPRApi({host:host,port:port,path:'/admin/runMethod',notLogResponseHere:null,
        postDataObj:{methodName:'storeGetUserIdsByQuery',
        emails:[p4userParams1.name1+gMailHostPart,p4userParams3.name1+gMailHostPart],
        limitType:'all', regions:null, gender:'all', deviceType:null}},function(err,outData){
          var userIds = outData.result.userIds;
          assert.ok(userIds.length==2);
          userIds.sort(testlib.sortByNumberOrderAsc);
          assert.ok(userIds[0]==userIdM1);
          assert.ok(userIds[1]==userIdM9);
          next();
        });
      },




      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/updateAppToken',notLogResponseHere:null,
        postDataObj:{userId:userIdM1, appToken:gDeviceToken}},
        function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/updateAppToken',notLogResponseHere:null,
        postDataObj:{userId:userIdM2, appToken:gRegistrationId}},
        function(err,outData){
          next();
        });
      },
      function(next){
        testlib.runPRApi({host:host,port:port,path:'/user/updateAppToken',notLogResponseHere:null,
        postDataObj:{userId:userIdF3, appToken:gDeviceToken2}},
        function(err,outData){
          next();
        });
      },


      function(next){
        //DoAssert
        next();
      },
      function(){
        var outData = {};
        if (cbFun) cbFun(outData);
      }
  );//handy.pipeline
}//busStoreGetUserIdsByQuery1




/**
*
* @param params - contains (optional)port, ..
*     @see busUpdateLocation1
* @param next - is function(next)
*/
function testUpdateLocation1LocalBothSides(params,next){
  handy.log('blue', "running testUpdateLocation1LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testUpdateLocation1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testUpdateLocation1LocalBothSides

/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busUpdateLocation1
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testUpdateLocation1ClientSide(params,cbFun){
  handy.log('blue', "testUpdateLocation1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busUpdateLocation1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busUpdateLocation1
}//testUpdateLocation1ClientSide

/**
 *
 * @param params - contains host,port; (optional) emailAccount,password,name,height,gender
 * @param cbFun - is function(outData)
 *   outData contains deviceId,addDeviceOutData,addUserOutData
 */
function busUpdateLocation1(params,cbFun){
    handy.log('blue', "busUpdateLocation1 enter");
    assert.ok(params.host);
    assert.ok(params.port);
    assert.ok(params.securePort);
    var host = params.host;
    var port = params.port;
    var securePort = params.securePort;
    var uploadReally = params.uploadReally;

    var emailAccount = params.emailAccount;
    var password = params.password;
    var name = params.name;
    var height = params.height;
    var gender = params.gender;
    var deviceType = params.deviceType;

    var nowTime = handy.getNowOfUTCdate().getTime();
    var name = "Adam";
    var emailAccount = name+gMailHostPart;
    var password = gPassword;
    var height = 175;
    var gender = 'male';
    var deviceType = gDeviceType;

    var name2 = "Clara";
    var emailAccount2 = name2+gMailHostPart;
    var password2 = gPassword;
    var height2 = 175;
    var gender2 = 'female';
    var deviceType2 = gDeviceTypeAndroid;

    var userId, userId2;

    handy.pipeline(
        function(next){
          console.log("\nnormal register, should succeed");
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/register',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccount, password:password, name:name,height:height,gender:gender,deviceType:deviceType}},function(err,outData){
            assert.ok(outData.status=="success");
            userId = outData.result.userId;
            next();
          });
        },

//        function(next){
//          console.log("\nnormal logIn, should ok.");
//          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
//          postDataObj:{emailAccount:emailAccount, password:password,deviceType:deviceType}},function(err,outData){
//            assert.ok(outData.status=="success");
//            userId1_2 = outData.result.userId;
//            assert.ok(userId == userId1_2);
//            next();
//          });
//        },


        function(next){
          console.log("\nupdateLocation by google type, should success");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/updateLocation',notLogResponseHere:null,
          postDataObj:{latlng:gLatlng1,geolibType:gGeolibTypeGoogle,region:gRegionByGoogle1}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },
        function(next){
          console.log("\nupdateLocation by android type, should success");
          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/updateLocation',notLogResponseHere:null,
          postDataObj:{latlng:gLatlng1,geolibType:gGeolibTypeAndroid,region:gRegionByAndroid1}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },


//        function(next){
//          console.log("\nnormal logout , should ok.");
//          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/logOut',notLogResponseHere:null,
//          postDataObj:{}},function(err,outData){
//            assert.ok(outData.status=="success");
//            next();
//          });
//        },

        function(next){
          //DoAssert
          next();
        },
        function(){
          var outData = {};
          if (cbFun) cbFun(outData);
        }
    );//handy.pipeline
}//busUpdateLocation1





/**
*
* @param params - contains (optional)port, ..
*     @see busUpdateLocation1
* @param next - is function(next)
*/
function testDealPhoto1LocalBothSides(params,next){
  handy.log('blue', "running testDealPhoto1LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testDealPhoto1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testDealPhoto1LocalBothSides

/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busDealPhoto1
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testDealPhoto1ClientSide(params,cbFun){
  handy.log('blue', "testDealPhoto1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busDealPhoto1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busDealPhoto1
}//testDealPhoto1ClientSide

/**
 *
 * @param params - contains host,port; (optional) emailAccount,password,name,height,gender
 * @param cbFun - is function(outData)
 *   outData contains deviceId,addDeviceOutData,addUserOutData
 */
function busDealPhoto1(params,cbFun){
    handy.log('blue', "busDealPhoto1 enter");
    assert.ok(params.host);
    assert.ok(params.port);
    assert.ok(params.securePort);
    var host = params.host;
    var port = params.port;
    var securePort = params.securePort;
    var uploadReally = params.uploadReally;

    var user4Info1 = null, user4Info2 = null;
    var userIdM1, userIdM2, userIdF3, userIdF4, userIdF7, userIdF8;
    var emailAccountM1, emailAccountM2, emailAccountF3, emailAccountF4, emailAccountF7, emailAccountF8;
    var photoIdU1_1, photoIdU2_1, photoIdU3_1, photoIdU4_1, photoIdU1_2, photoIdU1_3;
    handy.pipeline(
        function(next){
          var lparams = tool.cloneObject(params);
          tool.copyFields({srcObj:{name1:'Adam',name2:'Bob',name3:'Clara',name4:'Daisy'},destObj:lparams});
          busPrepare4User(lparams,function(outData){
            user4Info1 = outData;
            userIdM1 = outData.userInfoMale1.registerOutData.result.userId;
            userIdM2 = outData.userInfoMale2.registerOutData.result.userId;
            userIdF3 = outData.userInfoFemale3.registerOutData.result.userId;
            userIdF4 = outData.userInfoFemale4.registerOutData.result.userId;
            emailAccountM1 = outData.userInfoMale1.userParams.emailAccount;
            emailAccountM2 = outData.userInfoMale2.userParams.emailAccount;
            emailAccountF3 = outData.userInfoFemale3.userParams.emailAccount;
            emailAccountF4 = outData.userInfoFemale4.userParams.emailAccount;
            photoIdU1_1 = outData.userInfoMale1.uploadPhotoOutData.result.photoId;
            photoIdU2_1 = outData.userInfoMale2.uploadPhotoOutData.result.photoId;
            photoIdU3_1 = outData.userInfoFemale3.uploadPhotoOutData.result.photoId;
            photoIdU4_1 = outData.userInfoFemale4.uploadPhotoOutData.result.photoId;
            if (next) next();
          });//busPrepare4User
        },

        function(next){
          var userInfo = user4Info1.userInfoMale1;
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccountM1, password:gPassword,deviceType:userInfo.userParams.deviceType}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },

        function(next){
          console.log("\nuser1 normal upload 2nd photo");
          testlib.runPRApiUploadPhoto({host:host,port:port,waitMsTimeForApiBackground:null,notLogResponseHere:null,
            postDataObj:{notUploadReally:!uploadReally,userId:userIdM1, image:gUploadPhotoPath,width:900,height:800}},function(err,outData){
              assert.ifError(err);
              assert.ok(outData.status=="success");
              photoIdU1_2 = outData.result.photoId;
              return next();
            });//runPRApiUploadPhoto
        },

        function(next){
          console.log("\nuser1 normal upload 3rd photo");
          testlib.runPRApiUploadPhoto({host:host,port:port,waitMsTimeForApiBackground:null,notLogResponseHere:null,
            postDataObj:{notUploadReally:!uploadReally, image:gUploadPhotoPath,width:900,height:800}},function(err,outData){
              assert.ifError(err);
              assert.ok(outData.status=="success");
              photoIdU1_3 = outData.result.photoId;
              return next();
            });//runPRApiUploadPhoto
        },

        function(next){
          console.log("\nuser1 normal setPrimaryPhoto");
          testlib.runPRApi({host:host,port:port,path:'/user/setPrimaryPhoto',notLogResponseHere:null,
          postDataObj:{photoId:photoIdU1_2}},function(err,outData){
            next();
          });
        },

        function(next){
          var userInfo = user4Info1.userInfoFemale3;
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccountF3, password:gPassword,deviceType:userInfo.userParams.deviceType}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },
        function(next){
          console.log("\nget unliked photo");
          testlib.runPRApi({host:host,port:port,path:'/user/getPhoto',notLogResponseHere:null,
          postDataObj:{photoId:photoIdU1_1}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },
        function(next){
          console.log("\nnormal like photo");
          testlib.runPRApi({host:host,port:port,path:'/user/likePhoto',notLogResponseHere:null,
          postDataObj:{photoId:photoIdU1_1,type:'like'}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },
        function(next){
          console.log("\nget liked photo");
          testlib.runPRApi({host:host,port:port,path:'/user/getPhoto',notLogResponseHere:null,
          postDataObj:{photoId:photoIdU1_1}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },
        function(next){
          console.log("\nget 3 Photos of others");
          testlib.runPRApi({host:host,port:port,path:'/user/getPhotos',notLogResponseHere:null,
          postDataObj:{targetUserId:userIdM1,count:10}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },

        function(next){
          var userInfo = user4Info1.userInfoMale1;
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
          postDataObj:{emailAccount:emailAccountM1, password:gPassword,deviceType:userInfo.userParams.deviceType}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },

        function(next){
          console.log("\nget 3 Photos of self");
          testlib.runPRApi({host:host,port:port,path:'/user/getPhotos',notLogResponseHere:null,
          postDataObj:{targetUserId:userIdM1,count:10}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },

        function(next){
          console.log("\nnormal delete photo");
          testlib.runPRApi({host:host,port:port,path:'/user/deletePhoto',notLogResponseHere:null,
          postDataObj:{photoId:photoIdU1_3}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },

        function(next){
          console.log("\nget 2 Photos of self");
          testlib.runPRApi({host:host,port:port,path:'/user/getPhotos',notLogResponseHere:null,
          postDataObj:{targetUserId:userIdM1,count:10}},function(err,outData){
            assert.ok(outData.status=="success");
            next();
          });
        },

//        function(next){
//          console.log("\nnormal logout , should ok.");
//          testlib.runPRApi({needHttps:false, host:host,port:port,path:'/user/logOut',notLogResponseHere:null,
//          postDataObj:{}},function(err,outData){
//            assert.ok(outData.status=="success");
//            next();
//          });
//        },

        function(next){
          //DoAssert
          next();
        },
        function(){
          var outData = {};
          if (cbFun) cbFun(outData);
        }
    );//handy.pipeline
}//busDealPhoto1




/**
*
* @param params - contains (optional)port, ..
*     @see busAddDeviceAndUser
* @param next - is function(next)
*/
function testMiscellaneousApis1LocalBothSides(params,next){
  handy.log('blue', "running testMiscellaneousApis1LocalBothSides");
  if (!params) params = {};
  params.host = 'localhost';
  if (!params.port) params.port = port;
  if (!params.securePort) params.securePort = securePort;
  testlib.setConfigDefaultValue();
  if (params.disableNotification){
    notification.config.finelyEnableFlag = false;
    waitMsTimeOfSendNotification = 10;
  }
  testlib.provideServerLifeCycle(
    {port:params.port,securePort:params.securePort, needInitStore:true, NeedSetConfigDefault:false, notKeepC2dmAuth:true, c2dmAuth:gC2dmAuth},
    function(cbNext){
      testMiscellaneousApis1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//testMiscellaneousApis1LocalBothSides
/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busAddDeviceAndUser
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function testMiscellaneousApis1ClientSide(params,cbFun){
  handy.log('blue', "testMiscellaneousApis1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busMiscellaneousApis1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busMiscellaneousApis1
}//testMiscellaneousApis1ClientSide

function busMiscellaneousApis1(params,cbFun){
  handy.log('blue', "busMiscellaneousApis1 enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  var host = params.host;
  var port = params.port;
  var securePort = params.securePort;
  var user4Info1 = null;
  var userIdM1, userIdM2, userIdF3, userIdF4;
  var emailAccountM1, emailAccountM2, emailAccountF3, emailAccountF4;
  handy.pipeline(
      function(next){
        var lparams = tool.cloneObject(params);
        tool.copyFields({srcObj:{name1:'Adam',name2:'Bob',name3:'Clara',name4:'Daisy'},destObj:lparams});
        busPrepare4User(lparams,function(outData){
          user4Info1 = outData;
          userIdM1 = outData.userInfoMale1.registerOutData.result.userId;
          userIdM2 = outData.userInfoMale2.registerOutData.result.userId;
          userIdF3 = outData.userInfoFemale3.registerOutData.result.userId;
          userIdF4 = outData.userInfoFemale4.registerOutData.result.userId;
          emailAccountM1 = outData.userInfoMale1.userParams.emailAccount;
          emailAccountM2 = outData.userInfoMale2.userParams.emailAccount;
          emailAccountF3 = outData.userInfoFemale3.userParams.emailAccount;
          emailAccountF4 = outData.userInfoFemale4.userParams.emailAccount;
          if (next) next();
        });//busPrepare4User
      },

      function(next){
        testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/logIn',notLogResponseHere:null,
        postDataObj:{emailAccount:emailAccountM1, password:gPassword,deviceType:user4Info1.userInfoMale1.userParams.deviceType}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },
      function(next){
        console.log("\nnormal updateAppToken");
        testlib.runPRApi({host:host,port:port,path:'/user/updateAppToken',notLogResponseHere:null,
        postDataObj:{appToken:"aaa"}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nnormal signIn");
        testlib.runPRApi({host:host,port:port,path:'/user/signIn',notLogResponseHere:null,
        postDataObj:{userId:userIdM1}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },

      function(next){
        console.log("\nnormal getSentingSMS");
        testlib.runPRApi({host:host,port:port,path:'/user/getSentingSMS',notLogResponseHere:null,
        postDataObj:{type:"invite"}},function(err,outData){
          assert.ok(outData.status=="success");
          next();
        });
      },





      function(next){
        //DoAssert
        if (next) next();
      },
      function(){
        if (cbFun) cbFun(null);
      }
  );//handy.pipeline
};//busMiscellaneousApis1







//TODO NEED SET usage=prod or usage=dev







//start both server and client
testlib.backConfigDefaultValue();


//testSession1AdminWebLocalBothSides({disableNotification:true},null);
//testRunCurlCmdForUploadPhoto({disableNotification:true},null);
//testUploadPhotoLocalBothSides({disableNotification:true},null);
//testAddDeviceUserPhotoLocalBothSides({disableNotification:true},null);
//testAddDeviceUserPhotoLocalBothSides({disableNotification:true,uploadReally:true},null);
//testAddDeviceUserPhotoLocalBothSides({disableNotification:true,uploadReally:false},null);


//testDateLatestMessageAndViewed1LocalBothSides({disableNotification:true},null);
//testGetDatesByPage3WithActiveSortLocalBothSides({disableNotification:true},null);
//testConfirmDateChecks1LocalBothSides({disableNotification:true},null);
//testConfirmDate2LocalBothSides({disableNotification:true},null);

//testNotification1LocalBothSides({disableNotification:true},null);
//testNotification1LocalBothSides({disableNotification:false},null);

//testPagedMessage1LocalBothSides({disableNotification:true},null);
//testGetMessageRespective2LocalBothSides({disableNotification:true},null);

//testStat1LocalBothSides({disableNotification:true},null);
//testCheckAndNotifyDaters1LocalBothSides({disableNotification:true},null);
//testStoreGetUserIdsByQuery1LocalBothSides({disableNotification:true},null);




////when server is already started
//host = 'localhost';//'ysfCentSrv';//'ec2-23-21-136-120.compute-1.amazonaws.com';//test
//host = 'ec2-23-23-144-110.compute-1.amazonaws.com';//prod
//setAmazonWaitTime();


//testAddDeviceUserPhotoClientSide({host:host,port:port, uploadReally:true},null);





//testJustStartStopServer();
//testRegister1LocalBothSides({disableNotification:true,uploadReally:false},null);
//testRenRenRegisterAndLogin1LocalBothSides({disableNotification:true,uploadReally:false},null);
//testUploadPhoto1LocalBothSides({disableNotification:true,uploadReally:false},null);

//testSession1LocalBothSides({disableNotification:true,uploadReally:false},null);
//testCountInvitingUser1LocalBothSides({disableNotification:true},null);
//testUpdateLocation1LocalBothSides({disableNotification:true},null);
//testMiscellaneousApis1LocalBothSides({disableNotification:true},null);
testDateBasic1LocalBothSides({disableNotification:true,uploadReally:false},null);
//testActiveApplyingDates1LocalBothSides({disableNotification:true},null);
//testDateActiveResponders1LocalBothSides({disableNotification:true},null);
//testDateActiveResponders2LocalBothSides({disableNotification:true},null);
//testGetNearbyDatesA1LocalBothSides({disableNotification:true},null);
//testGetDates1LocalBothSides({disableNotification:true},null);

//testGetNearbyDates1LocalBothSidesOld({disableNotification:true},null);
//testCreateDateAndSendToNearbyUser1LocalBothSides({disableNotification:true},null);
//testGetMadeDatesLocalBothSides({disableNotification:true},null);
//testDealPhoto1LocalBothSides({disableNotification:true},null);








