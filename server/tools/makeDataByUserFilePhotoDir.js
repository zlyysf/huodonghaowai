  // node makeDataByUserFilePhotoDir.js userNameUtf8.txt /mnt/hgfs/zly/t/t2
  // node makeDataByUserFilePhotoDir.js /mnt/hgfs/zly/work/prettyRich/other/userName1utf8noDuplicated.txt /mnt/hgfs/zly/workTemp/momoPicByUser



var assert = require('assert');
var util = require('util');
var fs = require('fs');
var path = require('path');

var easyimage = require('easyimage');

var handy = require('../lib/handy');
var config = require('../lib/config');
var server = require('../lib/server');
var redis = require('../lib/redis');
var auth = require('../lib/auth');
var notification = require('../lib/notification');


var testlib = require('../test/testlib');




var emailAddressPrefix = "made";
var gMailHostPart = "@abc.com";
//var name : from in file
var gPassword = "password";
var gC2dmAuth = "DQAAALsAAABL_JFHfd303zDBZlUdx7RwRYBYJRoJOU67TDgMBC-R2Qp2j5G6o1m92bVJNIKAmPjdShe-lhOlDREQJ_aZznU6_yvnlIUV9zFGu1ZP9jNHYQ0kZi6BktIx6kqgDTBshTKP084Eg3C3JJv_e0TJtjEuArmWZ3NJJ-PhL9ASDKbL0nFIoEQ1-2cclqU6vRDe4iggv2w0TxpdJYdW-GEQlfCryRNXFR--qlbPF9tgSaKr5niJ6ibITfUkP2H3AFME8yw";

//var height ;//random from range
//var gender = 'female';
var gDeviceType = 'iphone';
var gLatlng = "39.976684,116.339936";
var gMadeRegion = config.config.madeRegion;
var gGeolibType = 'googleV3';

var gUploadReally = false;

var dateDate0 = handy.getNowOfUTCdate().getTime();
var dateDate30 = dateDate0+30*24*60*60*1000;

//THIS need some browsers connect to the server to provide client sockets


var host = 'localhost';
//var host = 'ec2-50-17-172-94.compute-1.amazonaws.com';
var port = config.config.port;//4000;
var securePort = config.config.securePort;//4010;

var waitMsTimeOfSoon = 10;
var waitMsTimeOfConnectApns = 3000;
var waitMsTimeOfSendNotification = 3000;
var waitMsTimeOfSendApnsNotification = 3000;
var waitMsTimeOfSendC2dmNotification = 3000;




var femaleLowHeight = 1.6;
var femaleUpHeight = 1.75;
var getRandomUserHeight = function(lowHeight, upHeight){
  var r = Math.random();
  var h1 = lowHeight + r*(upHeight - lowHeight);
  var h2 = Math.round( h1*100 ) / 100.0;
  //console.log(h1);
  //console.log(h2);
  return h2;
};//getRandomUserHeight



if (process.argv.length <4){
  console.log("help: node "+__filename+" nameFilePath photoRootDir");
  process.exit();
}

var inNameFilePath = process.argv[2];
var photoRootDirPath = process.argv[3];


var encoding = null;
var nameFileBinaryContent = fs.readFileSync(inNameFilePath, null);  // FE FF to UTF-8 will be EF BB BF
//var nameFileUtf8Content = fs.readFileSync(inNameFilePath, 'utf8');
//console.log("nameFileBinaryContent="+util.inspect(nameFileBinaryContent,false,100));

var ui0 = nameFileBinaryContent.readUInt8(0);
var ui1 = nameFileBinaryContent.readUInt8(1);
var ui2 = nameFileBinaryContent.readUInt8(2);
//console.log("ui0="+util.inspect(ui0,false,100)+", ui1="+util.inspect(ui1,false,100)+", ui2="+util.inspect(ui2,false,100));
if (ui0 == 0xEF && ui1 == 0xBB && ui2 == 0xBF){
  nameFileBinaryContent = nameFileBinaryContent.slice(3);
  //console.log("remove prefix utf8 flag");
}

var nameFileContentStr = nameFileBinaryContent.toString('utf8');
var names = nameFileContentStr.split(/\n|\n\r/);
var nonEmptyNames = handy.getArrayWithNonEmptyItem({ary:names});
if (!nonEmptyNames) nonEmptyNames = [];

var users = [];
var nowTime = new Date().getTime();
var batchEmailRandomPart = ""+nowTime;
for(var i=0; i<nonEmptyNames.length; i++){
  var name = nonEmptyNames[i];

  var emailAccount = emailAddressPrefix + batchEmailRandomPart + "i" + i + gMailHostPart;
  var height = getRandomUserHeight(femaleLowHeight,femaleUpHeight);
  var user = {emailAccount:emailAccount, name:name, password:gPassword, height:height, gender:'female',
      deviceType:gDeviceType, latlng:gLatlng, region:gMadeRegion,geolibType:gGeolibType};
  users.push(user);
}//for
//console.log("users=\n"+util.inspect(users,false,100));

//we think that all photos in a dir in root dir are related to 1 user, 1 photo in root dir is related to 1 user.
var photoDirOrFiles = fs.readdirSync(photoRootDirPath);
var photosArray = [];
if (photoDirOrFiles){
  for(var i=0; i<photoDirOrFiles.length; i++){
    var photoDirOrFile = photoDirOrFiles[i];
    var path1level = path.join(photoRootDirPath,photoDirOrFile);
    var fileStatObj1Level = fs.statSync(path1level);
    if (fileStatObj1Level.isFile()){
      var photo = {image:path1level, notUploadReally:!gUploadReally};
      var photos = [photo];
      photosArray.push(photos);
    }else if(fileStatObj1Level.isDirectory()){
      var photoDirPath = path.join(photoRootDirPath,photoDirOrFile);
      var photoFiles = fs.readdirSync(photoDirPath);
      if (photoFiles){
        var photos = [];
        for(var j=0; j<photoFiles.length; j++){
          var photoFileName = photoFiles[j];
          var path2level = path.join(photoRootDirPath,photoDirOrFile,photoFileName);
          var fileStatObj2Level = fs.statSync(path2level);
          if (fileStatObj2Level.isFile()){
            var photo = {image:path2level, notUploadReally:!gUploadReally};
            photos.push(photo);
          }
        }//for j
        if (photos.length > 0) photosArray.push(photos);
      }//if (photoFiles)
    }
  }//for i
}//if (photoDirOrFiles)
console.log("photosArray=\n"+util.inspect(photosArray,false,100));

var minLen = Math.min(users.length, photosArray.length);
if (minLen == 0) return;
var userInfoArray = [];
for(var i=0; i<minLen; i++){
  var user = users[i];
  var photos = photosArray[i];
  var userInfo = {user:user, photos:photos};
  userInfoArray.push(userInfo);
}//for
console.log("userInfoArray=\n"+util.inspect(userInfoArray,false,100));

/**
 *
 * just show data format
 */
function getToBeMadeData(params){

  var uploadReally = params.uploadReally;
  var dataTypeKey = params.dataTypeKey;
  var userNamePostfix = params.userNamePostfix;
  var region = params.region;
  console.log("getToBeMadeData params="+util.inspect(params,false,100)+". region="+util.inspect(region,false,100));
  if (!userNamePostfix) userNamePostfix = "";
  if (!region) region = gRegionByGoogle1;
  var dataSet = {
    "userPhotosAryT1" : [
         { user:{  emailAccount:'email1@abc.com', password:gPassword, name:'user1'+userNamePostfix,height:171,gender:'female',
                   deviceType:gDeviceTypeIphone,
                   latlng:gLatlng1,geolibType:gGeolibTypeGoogle,region:region  },
           photos:[{image:"/mnt/hgfs/zly/t/tpic/draw.png",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'},
                   {image:"/mnt/hgfs/zly/t/tpic/draw2.png",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'}
                  ],
           dates:[{latlng:gLatlng1,geolibType:gGeolibTypeGoogle,region:region,
                   dateDate:dateDate30,whoPay:0,money:100,monetaryunit:"$",title:"title",description:"description"}
                  ]
         },
         { user:{  emailAccount:'email2@abc.com', password:gPassword, name:'user2'+userNamePostfix,height:172,gender:'female',
                   deviceType:gDeviceTypeIphone,
                   latlng:gLatlng1,geolibType:gGeolibTypeGoogle,region:region  },
           photos:[{image:"/mnt/hgfs/zly/work/prettyRich/png1/chat ongoing date discussion.png",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'}
                  ],
           dates:[{latlng:gLatlng1,geolibType:gGeolibTypeGoogle,region:region,
                   dateDate:dateDate30,whoPay:0,money:100,monetaryunit:"$",title:"title",description:"description"}
                  ]
         },
         { user:{},
           photos:[{},{}]},
         { user:{},
           photos:[{},{}]},
         { user:{},
           photos:[{},{}]},
         {}],
    "userPhotoDatesAryT1":[
          { user:{  emailAccount:'email1@abc.com', password:gPassword, name:'user1'+userNamePostfix,height:171,gender:'female',
                    deviceType:gDeviceTypeIphone,
                    latlng:gLatlng1,geolibType:gGeolibTypeGoogle,region:region  },
            photos:[{image:"/mnt/hgfs/zly/t/tpic/draw.png",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'},
                    {image:"/mnt/hgfs/zly/t/tpic/draw2.png",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'}
                   ],
            dates:[{latlng:gLatlng1,geolibType:gGeolibTypeGoogle,region:region,
                     dateDate:dateDate30,whoPay:0,money:100,monetaryunit:"$",title:"title",description:"description"}
                   ]
          },
          { user:{  emailAccount:'email2@abc.com', password:gPassword, name:'user2'+userNamePostfix,height:172,gender:'female',
                    deviceType:gDeviceTypeIphone,
                    latlng:gLatlng1,geolibType:gGeolibTypeGoogle,region:region  },
            photos:[{image:"/mnt/hgfs/zly/work/prettyRich/png1/chat ongoing date discussion.png",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'}
                   ],
            dates:[{latlng:gLatlng1,geolibType:gGeolibTypeGoogle,region:region,
                     dateDate:dateDate30,whoPay:0,money:100,monetaryunit:"$",title:"title",description:"description"},
                   {latlng:gLatlng1,geolibType:gGeolibTypeGoogle,region:region,
                     dateDate:dateDate30,whoPay:0,money:100,monetaryunit:"$",title:"title",description:"description"}
                   ]
          },
          { user:{},
            photos:[{},{}]},
          { user:{},
            photos:[{},{}]},
          { user:{},
            photos:[{},{}]},
          {}]
  };
  var dataAry = dataSet[dataTypeKey];
  assert.ok(dataAry);
  return dataAry;
};//getToBeMadeData








function addWidthHeightToUserPhotos2(userPhotosAry,cbFun){
  //console.log("addWidthHeightToUserPhotos2 enter ");
  var level1Count = 0, level2Count = 0;
  var finishLevel1Count = 0, finishLevel2Count = 0;
  if (userPhotosAry){
    userPhotosAry.forEach(function (userPhotosItem, index, array) {
      if (userPhotosItem.user && userPhotosItem.user.name){
        level1Count ++;
        var photos = userPhotosItem.photos;
        if (photos){
          photos.forEach(function (photoItem, index, array) {
            if (photoItem && photoItem.image){
              level2Count ++;
            }//if (photoItem && photoItem.image)
          });//photos.forEach
        }//if (photos)
      }//if (userPhotosItem.user && userPhotosItem.user.name)
    });//userPhotosAry.forEach
  }
  console.log("level1Count="+level1Count+", level2Count="+level2Count);
  if (level1Count==0 && level2Count==0) return cbFun(null,null);
  userPhotosAry.forEach(function (userPhotosItem, index, array) {
    if (userPhotosItem.user){
      finishLevel1Count ++;
      var photos = userPhotosItem.photos;
      if (photos){
        photos.forEach(function (photoItem, index, array) {
          if (photoItem && photoItem.image){
            var imagePath = photoItem.image;
            getImageWidthHeight(imagePath,photoItem,function(err){
              finishLevel2Count ++;
              checkFinished();
            });//getImageWidthHeight
          }//if (photoItem && photoItem.image)
        });//photos.forEach
      }else{
        checkFinished();
      }
    }//if (userPhotosItem.user)
  });//userPhotosAry.forEach

  function checkFinished(){
    if (finishLevel2Count==level2Count && finishLevel2Count==level2Count){
      return cbFun(null,null);
    }
  };//checkFinished
};//addWidthHeightToUserPhotos2


function getImageWidthHeight(imagePath, destObj, cbFun){
  //console.log("getImageWidthHeight enter, destObj=",destObj);
  easyimage.info(imagePath, function(err, stdoutOrInfoObj, stderr) {
    if (err) return cbFun(err);
    destObj.width = stdoutOrInfoObj.width;
    destObj.height = stdoutOrInfoObj.height;
    return cbFun(null);
  });
};



//addWidthHeightToUserPhotos2(userPhotosAry,function(){
//  console.log(util.inspect(userPhotosAry,false,100));
//});







/**
*
* @param params - contains (optional)port, ..
* @param next - is function(next)
*/
function doClearRedisAndSolrData(params,next){
  handy.log('blue', "running doClearRedisAndSolrData");
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
      if (cbNext) cbNext();
    },
    next
  );//provideServerLifeCycle
}//doClearRedisAndSolrData




/**
*
* @param params - contains (optional)port, ..
*     @see busMakeUsersPhotos1
* @param next - is function(next)
*/
function doMakeUsersPhotos2SequenceLocalBothSides(params,next){
  handy.log('blue', "running doMakeUsersPhotos2SequenceLocalBothSides");
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
      doMakeUsersPhotos2SequenceClientSide(params,function(outData){
        var waitMs = config.config.solrCommitWithin*2+config.config.solrPeriodicThreadInterval*2;
        setTimeout(function(){
          if (cbNext) cbNext();
        },waitMs);//setTimeout
      });
    },
    next
  );//provideServerLifeCycle
}//doMakeUsersPhotos2SequenceLocalBothSides

/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busMakeUsersPhotos2Sequence
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function doMakeUsersPhotos2SequenceClientSide(params,cbFun){
  handy.log('blue', "doMakeUsersPhotos2SequenceClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busMakeUsersPhotos2Sequence(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busMakeUsersPhotos2Sequence
}//doMakeUsersPhotos2SequenceClientSide

/**
 *
 * @param params - contains host,port; (optional) emailAccount,password,name,height,gender
 * @param cbFun - is function(err)
 *
 */
function busMakeUsersPhotos2Sequence(params,cbFun){
    handy.log('blue', "busMakeUsersPhotos2Sequence enter");
    assert.ok(params.host);
    assert.ok(params.port);
    assert.ok(params.securePort);
    var host = params.host;
    var port = params.port;
    var securePort = params.securePort;
    var madeDataAry = params.madeDataAry;
    var funcAry = [];
    addWidthHeightToUserPhotos2(madeDataAry,function(){
      madeDataAry.forEach(function (userPhotosItem, indexU, array) {
        if (userPhotosItem.user && userPhotosItem.user.name){
          var funcAddUser = function(next){
              testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/register',notLogResponseHere:null,
              postDataObj:userPhotosItem.user},function(err,outData){
                  assert.ok(outData.status=="success");
                  if (next) return next();
                  //var userId = outData.result.userId;//no need
              });//testlib.runPRApi
          };//funcAddUser
          funcAry.push(funcAddUser);

          var photos = userPhotosItem.photos;
          if (photos){
            photos.forEach(function (photoItem, indexP, array) {
              if (photoItem && photoItem.image){
                //photoItem.userId = userId;//no need
                var funcAddPhoto = function(next){
                    testlib.runPRApiUploadPhoto({host:host,port:port,notLogResponseHere:null,
                    postDataObj:photoItem},function(err,outData){
                        assert.ok(outData.status=="success");
                        //var photoId = outData.result.photoId;
                        if (next) return next();
                    });
                };//funcAddPhoto
                funcAry.push(funcAddPhoto);
              }//if (photoItem && photoItem.image)
            });//photos.forEach
          }//if (photos)
          var dates = userPhotosItem.dates;
          if (dates){
            dates.forEach(function (dateItem, indexD, array) {
              if (dateItem && dateItem.dateDate){
                //dateItem.userId = userId;//no need
                var postfix = "_U"+indexU+"_D"+indexD;
                dateItem.title = dateItem.title+postfix;
                var funcAddDate = function(next){
                    testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
                    postDataObj:dateItem},function(err,outData){
                        assert.ok(outData.status=="success");
                        if (next) return next();
                        //var dateId = outData.result.dateId;//no need
                    });//testlib.runPRApi
                };//funcAddDate
                funcAry.push(funcAddDate);
              }//if (dateItem && dateItem.dateDate)
            });//dates.forEach
          }//if (dates)
        }//if (userPhotosItem.user && userPhotosItem.user.name)
      });//madeDataAry.forEach

      if (funcAry.length > 0){
        var retFun = function(next){
          return cbFun(null,null);
        };
        funcAry.push(retFun);
        handy.pipelineArray(funcAry);
        return;
      }else{
        return cbFun(null,null);
      }
    });//addWidthHeightToUserPhotos2
}//busMakeUsersPhotos2Sequence



testlib.backConfigDefaultValue();

//doClearRedisAndSolrData({uploadReally:false,disableNotification:true},null);


doMakeUsersPhotos2SequenceLocalBothSides({madeDataAry:userInfoArray, disableNotification:true},null);
////host = 'ec2-23-21-136-120.compute-1.amazonaws.com';
//doMakeUsersPhotos2SequenceClientSide({host:host,port:port,securePort:securePort, madeDataAry:userInfoArray, disableNotification:true},null);

















