

var assert = require('assert');
var util = require('util');

var easyimage = require('easyimage');

var handy = require('../lib/handy');
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

var gMailHostPart = "@abc.com";


var gSchool = "北京大学";

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





var latlngNS0 = "39.835564,116.370964";//Gongyixiqiao
var latlngNS1 = "39.907366,116.356716";//Fuxingmen
var latlngNS2 = "39.923429,116.355343";//Fuchengmen
var latlngNS3 = "39.932644,116.355515";//Chegongzhuang
var latlngNS4 = "39.940278,116.355171";//Xizhimen
var latlngNS5 = "39.669935,116.319466";//Tiangongyuan

/**
 *
 * @param params - contains dataTypeKey,uploadReally,userNamePostfix,region.
 * @returns
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
          {}],
    "userPhotosAryMade1": [
         { user:{  emailAccount:'lianyu.zhang+Am1'+userNamePostfix+'@yasofon.com', password:gPassword, name:'Abe'+userNamePostfix,height:176,gender:'male',
                   deviceType:gDeviceTypeIphone,
                   latlng:gLatlng1,geolibType:gGeolibTypeGoogle,region:region},
           photos:[{image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/male/Abe/Abe1.jpeg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'},
                   {image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/male/Abe/Abe2.jpeg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'},
                   {image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/male/Abe/Abe3.jpeg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'}
                  ],
           dates:[]
         },
         { user:{  emailAccount:'lianyu.zhang+Am2'+userNamePostfix+'@yasofon.com', password:gPassword, name:'Bruce'+userNamePostfix,height:181,gender:'male',
           deviceType:gDeviceTypeIphone,
           latlng:gLatlng1,geolibType:gGeolibTypeGoogle,region:region  },
           photos:[{image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/male/Bruce/Bruce1.jpeg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'},
                   {image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/male/Bruce/Bruce2.jpeg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'},
                   {image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/male/Bruce/Bruce3.jpeg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'}
                  ]
         },
         { user:{  emailAccount:'lianyu.zhang+Am3'+userNamePostfix+'@yasofon.com', password:gPassword, name:'Carl'+userNamePostfix,height:177,gender:'male',
           deviceType:gDeviceTypeIphone,
           latlng:gLatlng1,geolibType:gGeolibTypeGoogle,region:region },
           photos:[{image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/male/Carl/Carl1.jpg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'},
                   {image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/male/Carl/Carl2.jpg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'},
                   {image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/male/Carl/Carl3.jpg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'}
                  ]
         },
         { user:{  emailAccount:'lianyu.zhang+Am4'+userNamePostfix+'@yasofon.com', password:gPassword, name:'David'+userNamePostfix,height:180,gender:'male',
           deviceType:gDeviceTypeIphone,
           latlng:gLatlng1,geolibType:gGeolibTypeGoogle,region:region},
           photos:[{image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/male/David/David1.jpg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'},
                   {image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/male/David/David2.jpg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'},
                   {image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/male/David/David3.jpg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'},
                   {image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/male/David/David4.jpg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'}
                  ]
         },

         { user:{  emailAccount:'lianyu.zhang+Af1'+userNamePostfix+'@yasofon.com', password:gPassword, name:'Alice'+userNamePostfix,height:167,gender:'female',
           deviceType:gDeviceTypeIphone,
           latlng:gLatlng1,geolibType:gGeolibTypeGoogle,region:region },
           photos:[{image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/female/Alice/Alice1.jpg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'},
                   {image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/female/Alice/Alice2.jpeg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'},
                   {image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/female/Alice/Alice3.jpeg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'},
                   {image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/female/Alice/Alice4.jpeg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'}
                  ]
         },
         { user:{  emailAccount:'lianyu.zhang+Af2'+userNamePostfix+'@yasofon.com', password:gPassword, name:'Betty'+userNamePostfix,height:172,gender:'female',
           deviceType:gDeviceTypeIphone,
           latlng:gLatlng1,geolibType:gGeolibTypeGoogle,region:region },
           photos:[{image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/female/Betty/Betty1.jpg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'},
                   {image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/female/Betty/Betty2.jpg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'},
                   {image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/female/Betty/Betty3.jpg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'}
                  ]
         },
         { user:{  emailAccount:'lianyu.zhang+Af3'+userNamePostfix+'@yasofon.com', password:gPassword, name:'Cathy'+userNamePostfix,height:170,gender:'female',
           deviceType:gDeviceTypeIphone,
           latlng:gLatlng1,geolibType:gGeolibTypeGoogle,region:region },
           photos:[{image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/female/Cathy/Cathy1.jpeg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'},
                   {image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/female/Cathy/Cathy2.jpeg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'}
                  ]
         },
         { user:{  emailAccount:'lianyu.zhang+Af4'+userNamePostfix+'@yasofon.com', password:gPassword, name:'Daisy'+userNamePostfix,height:164,gender:'female',
           deviceType:gDeviceTypeIphone,
           latlng:gLatlng1,geolibType:gGeolibTypeGoogle,region:region },
           photos:[{image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/female/Daisy/Daisy1.jpg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'},
                   {image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/female/Daisy/Daisy2.jpeg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'},
                   {image:"/mnt/hgfs/zly/work/prettyRich/other/makedata/user/female/Daisy/Daisy3.jpeg",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'}
                  ]
         },
         {}],
    "userPhotoDatesAryMade1":[
          { user:{  emailAccount:'lianyu.zhang+Am1'+userNamePostfix+'@yasofon.com', password:gPassword, name:'Abe'+userNamePostfix,height:176,gender:'male',school:gSchool,
                    deviceType:gDeviceTypeIphone},
            photos:[{image:"/mnt/hgfs/zly/t/tpic/draw3.png",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'}],
            dates:[{
                    dateDate:dateDate30,address:"address",wantPersonCount:1,existPersonCount:1,existPersonCount:1,whoPay:0,money:100,monetaryunit:"$",title:"title",description:"description"}]
          },
          { user:{  emailAccount:'lianyu.zhang+Am2'+userNamePostfix+'@yasofon.com', password:gPassword, name:'Bruce'+userNamePostfix,height:181,gender:'male',school:gSchool,
                    deviceType:gDeviceTypeIphone},
            photos:[{image:"/mnt/hgfs/zly/t/tpic/draw3.png",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'}],
            dates:[{
                    dateDate:dateDate30,address:"address",wantPersonCount:1,existPersonCount:1,whoPay:0,money:100,monetaryunit:"$",title:"title",description:"description"}]
          },
          { user:{  emailAccount:'lianyu.zhang+Am3'+userNamePostfix+'@yasofon.com', password:gPassword, name:'Carl'+userNamePostfix,height:177,gender:'male',school:gSchool,
                    deviceType:gDeviceTypeIphone},
            photos:[{image:"/mnt/hgfs/zly/t/tpic/draw3.png",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'}],
            dates:[{
                    dateDate:dateDate30,address:"address",wantPersonCount:1,existPersonCount:1,whoPay:0,money:100,monetaryunit:"$",title:"title",description:"description"}]
          },
          { user:{  emailAccount:'lianyu.zhang+Am4'+userNamePostfix+'@yasofon.com', password:gPassword, name:'David'+userNamePostfix,height:180,gender:'male',school:gSchool,
                    deviceType:gDeviceTypeIphone},
            photos:[{image:"/mnt/hgfs/zly/t/tpic/draw3.png",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'}],
            dates:[{
                    dateDate:dateDate30,address:"address",wantPersonCount:1,existPersonCount:1,whoPay:0,money:100,monetaryunit:"$",title:"title",description:"description"}]
          },
          { user:{  emailAccount:'lianyu.zhang+Am5'+userNamePostfix+'@yasofon.com', password:gPassword, name:'Edward'+userNamePostfix,height:180,gender:'male',school:gSchool,
                    deviceType:gDeviceTypeIphone},
            photos:[{image:"/mnt/hgfs/zly/t/tpic/draw3.png",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'}],
            dates:[{
                    dateDate:dateDate30,address:"address",wantPersonCount:1,existPersonCount:1,whoPay:0,money:100,monetaryunit:"$",title:"title",description:"description"}]
          },

          { user:{  emailAccount:'lianyu.zhang+Af1'+userNamePostfix+'@yasofon.com', password:gPassword, name:'Alice'+userNamePostfix,height:167,gender:'female',school:gSchool,
                    deviceType:gDeviceTypeIphone},
            photos:[{image:"/mnt/hgfs/zly/t/tpic/draw3.png",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'}],
            dates:[{
                    dateDate:dateDate30,address:"address",wantPersonCount:1,existPersonCount:1,whoPay:0,money:100,monetaryunit:"$",title:"title",description:"description"}]
          },
          { user:{  emailAccount:'lianyu.zhang+Af2'+userNamePostfix+'@yasofon.com', password:gPassword, name:'Betty'+userNamePostfix,height:172,gender:'female',school:gSchool,
                    deviceType:gDeviceTypeIphone},
            photos:[{image:"/mnt/hgfs/zly/t/tpic/draw3.png",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'}],
            dates:[{
                    dateDate:dateDate30,address:"address",wantPersonCount:1,existPersonCount:1,whoPay:0,money:100,monetaryunit:"$",title:"title",description:"description"}]
          },
          { user:{  emailAccount:'lianyu.zhang+Af3'+userNamePostfix+'@yasofon.com', password:gPassword, name:'Cathy'+userNamePostfix,height:170,gender:'female',school:gSchool,
                    deviceType:gDeviceTypeIphone},
            photos:[{image:"/mnt/hgfs/zly/t/tpic/draw3.png",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'}],
            dates:[{
                    dateDate:dateDate30,address:"address",wantPersonCount:1,existPersonCount:1,whoPay:0,money:100,monetaryunit:"$",title:"title",description:"description"}]
          },
          { user:{  emailAccount:'lianyu.zhang+Af4'+userNamePostfix+'@yasofon.com', password:gPassword, name:'Daisy'+userNamePostfix,height:164,gender:'female',school:gSchool,
                    deviceType:gDeviceTypeIphone},
            photos:[{image:"/mnt/hgfs/zly/t/tpic/draw3.png",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'}],
            dates:[{
                    dateDate:dateDate30,address:"address",wantPersonCount:1,existPersonCount:1,whoPay:0,money:100,monetaryunit:"$",title:"title",description:"description"}]
          },
          { user:{  emailAccount:'lianyu.zhang+Af5'+userNamePostfix+'@yasofon.com', password:gPassword, name:'Eileen'+userNamePostfix,height:164,gender:'female',school:gSchool,
                    deviceType:gDeviceTypeIphone},
            photos:[{image:"/mnt/hgfs/zly/t/tpic/draw3.png",notUploadReally:!uploadReally,userId:'no need set',width:'no need set',height:'no need set'}],
            dates:[{
                    dateDate:dateDate30,address:"address",wantPersonCount:1,existPersonCount:1,whoPay:0,money:100,monetaryunit:"$",title:"title",description:"description"}]
          },
          {}]
  };
  var dataAry = dataSet[dataTypeKey];
  assert.ok(dataAry);
  return dataAry;
};//getToBeMadeData







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



function addWidthHeightToUserPhotos(userPhotosAry,cbFun){
  //console.log("addWidthHeightToUserPhotos enter ");
  var totalToBeDealed = 0;
  var finishCount = 0;
  if (userPhotosAry){
    //console.log("if (userPhotosAry) true part");
    for(var i=0; i<userPhotosAry.length; i++){
      //console.log("i="+i);
      var userPhotosItem = userPhotosAry[i];
      var photos = userPhotosItem.photos;
      if (photos){
        for(var j=0; j<photos.length; j++){
          //console.log("j="+j);
          var photo = photos[j];
          if (photo && photo.image){
            totalToBeDealed ++;
          }
        }//for j
      }
    }//for i
  }
  console.log("totalToBeDealed="+totalToBeDealed);
  if (totalToBeDealed==0) return cbFun(null,null);
  for(var i=0; i<userPhotosAry.length; i++){
    var userPhotosItem = userPhotosAry[i];
    var photos = userPhotosItem.photos;
    if (photos){
      for(var j=0; j<photos.length; j++){
        var photo = photos[j];
        if (photo && photo.image){
          var imagePath = photo.image;
          getImageWidthHeight(imagePath,photo,function(err){
            finishCount ++;
            if (finishCount == totalToBeDealed){
              return cbFun(null,null);
            }
          });//getImageWidthHeight
        }
      }//for j
    }
  }//for i
};//addWidthHeightToUserPhotos


function addWidthHeightToUserPhotos2(userPhotosAry,cbFun){
  //console.log("addWidthHeightToUserPhotos enter ");
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
};//addWidthHeightToUserPhotos


function getImageWidthHeight(imagePath, destObj, cbFun){
  //console.log("getImageWidthHeight enter, destObj=",destObj);
  easyimage.info(imagePath, function(err, stdoutOrInfoObj, stderr) {
    if (err) return cbFun(err);
    destObj.width = stdoutOrInfoObj.width;
    destObj.height = stdoutOrInfoObj.height;
    return cbFun(null);
  });
};


//addWidthHeightToUserPhotos(userPhotosAry,function(){
//  console.log(util.inspect(userPhotosAry,false,100));
//});
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
function doMakeUsersPhotos1LocalBothSides(params,next){
  handy.log('blue', "running doMakeUsersPhotos1LocalBothSides");
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
      doMakeUsersPhotos1ClientSide(params,function(outData){
        if (cbNext) cbNext();
      });
    },
    next
  );//provideServerLifeCycle
}//doMakeUsersPhotos1LocalBothSides

/**
 * as there is no socket.io, no complicate logic
 * @param params - contains host,port; ..
 *     @see busMakeUsersPhotos1
 * @param cbFun - is function(outData)
 *   outData contains ..
 */
function doMakeUsersPhotos1ClientSide(params,cbFun){
  handy.log('blue', "doMakeUsersPhotos1ClientSide enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.securePort);
  busMakeUsersPhotos1(params,function(outDataBus){
    if (cbFun) cbFun(outDataBus);
  });//busMakeUsersPhotos1
}//doMakeUsersPhotos1ClientSide

/**
 *
 * @param params - contains host,port; (optional) emailAccount,password,name,height,gender
 * @param cbFun - is function(outData)
 *   outData contains deviceId,addDeviceOutData,addUserOutData
 */
function busMakeUsersPhotos1(params,cbFun){
    handy.log('blue', "busMakeUsersPhotos1 enter");
    assert.ok(params.host);
    assert.ok(params.port);
    assert.ok(params.securePort);
    var host = params.host;
    var port = params.port;
    var securePort = params.securePort;
    var uploadReally = params.uploadReally;
    var dataTypeKey = params.dataTypeKey;
    if (!dataTypeKey) dataTypeKey = "userPhotosAryT1";
    var userNamePostfix = params.userNamePostfix;
    var region = params.region;
    var madeDataAry = getToBeMadeData({dataTypeKey:dataTypeKey,uploadReally:uploadReally,userNamePostfix:userNamePostfix,region:region});

    var level1Count = 0, level2Count = 0;
    var finishLevel1Count = 0, finishLevel2Count = 0;
    function checkFinished(){
      if (finishLevel2Count==level2Count && finishLevel2Count==level2Count){
        return cbFun(null,null);
      }
    };//checkFinished

    addWidthHeightToUserPhotos2(madeDataAry,function(){
      if (madeDataAry){
        madeDataAry.forEach(function (userPhotosItem, index, array) {
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
          }//if (userPhotosItem.user)
        });//madeDataAry.forEach
      }
      console.log("level1Count="+level1Count+", level2Count="+level2Count);
      if (level1Count==0 && level2Count==0) return cbFun(null,null);
      madeDataAry.forEach(function (userPhotosItem, index, array) {
        if (userPhotosItem.user && userPhotosItem.user.name){
          testlib.runPRApi({needHttps:true, host:host,port:securePort,path:'/user/register',notLogResponseHere:null,
          postDataObj:userPhotosItem.user},function(err,outData){
              assert.ok(outData.status=="success");
              var userId = outData.result.userId;
              finishLevel1Count ++;

              var photos = userPhotosItem.photos;
              if (photos){
                photos.forEach(function (photoItem, index, array) {
                  if (photoItem && photoItem.image){
                    photoItem.userId = userId;
                    testlib.runPRApiUploadPhoto({host:host,port:port,notLogResponseHere:null,
                    postDataObj:photoItem},function(err,outData){
                        assert.ok(outData.status=="success");
                        var photoId = outData.result.photoId;
                        finishLevel2Count ++;
                        checkFinished();
                    });
                  }//if (photoItem && photoItem.image)
                });//photos.forEach
              }else{
                checkFinished();
              }
          });//testlib.runPRApi
        }//if (userPhotosItem.user && userPhotosItem.user.name)
      });//madeDataAry.forEach
    });//addWidthHeightToUserPhotos2
}//busMakeUsersPhotos1



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
    var uploadReally = params.uploadReally;
    var dataTypeKey = params.dataTypeKey;
    if (!dataTypeKey) dataTypeKey = "userPhotoDatesAryT1";
    var userNamePostfix = params.userNamePostfix;
    var region = params.region;
    var madeDataAry = getToBeMadeData({dataTypeKey:dataTypeKey,uploadReally:uploadReally,userNamePostfix:userNamePostfix,region:region});
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
//                    testlib.runPRApi({host:host,port:port,path:'/user/createDate',notLogResponseHere:null,
//                    postDataObj:dateItem},function(err,outData){
//                        assert.ok(outData.status=="success");
//                        if (next) return next();
//                        //var dateId = outData.result.dateId;//no need
//                    });//testlib.runPRApi
                    testlib.runPRApiWithUploadPhoto({host:host,port:port,path:'/user/createDateWithPhoto',notLogResponseHere:null,
                    postDataObj:dateItem},function(err,outData){
                      assert.ok(outData.status=="success");
                      if (next) return next();
                    });
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




//start both server and client
testlib.backConfigDefaultValue();

//doClearRedisAndSolrData({uploadReally:false,disableNotification:true},null);

//doMakeUsersPhotos1LocalBothSides({uploadReally:false,disableNotification:true},null);
//doMakeUsersPhotos1LocalBothSides({uploadReally:true,disableNotification:true},null);
//doMakeUsersPhotos1ClientSide({host:host,port:port,securePort:securePort, uploadReally:true,disableNotification:true},null);
//doMakeUsersPhotos1ClientSide({host:host,port:port,securePort:securePort, dataTypeKey:"userPhotosAryMade1", uploadReally:true,disableNotification:true},null);

//doMakeUsersPhotos2SequenceLocalBothSides({uploadReally:false,disableNotification:true},null);
//doMakeUsersPhotos2SequenceLocalBothSides({uploadReally:true,disableNotification:true},null);
//doMakeUsersPhotos2SequenceClientSide({host:host,port:port,securePort:securePort, uploadReally:true,disableNotification:true},null);
//doMakeUsersPhotos2SequenceClientSide({host:host,port:port,securePort:securePort, dataTypeKey:"userPhotoDatesAryT1",userNamePostfix:"1", region:config.config.madeRegion, uploadReally:false,disableNotification:true},null);
//doMakeUsersPhotos2SequenceClientSide({host:host,port:port,securePort:securePort, dataTypeKey:"userPhotoDatesAryT1",userNamePostfix:"", region:null, uploadReally:false,disableNotification:true},null);




//doMakeUsersPhotos2SequenceLocalBothSides({dataTypeKey:"userPhotoDatesAryMade1",userNamePostfix:(new Date().getTime())+"", uploadReally:false,disableNotification:true},null);

//doMakeUsersPhotos2SequenceClientSide({host:host,port:port,securePort:securePort, dataTypeKey:"userPhotoDatesAryMade1",userNamePostfix:"", region:config.config.madeRegion, uploadReally:false,disableNotification:true},null);
//doMakeUsersPhotos2SequenceClientSide({host:host,port:port,securePort:securePort, dataTypeKey:"userPhotoDatesAryMade1",userNamePostfix:"", region:null, uploadReally:false,disableNotification:true},null);


host = 'ec2-23-21-136-120.compute-1.amazonaws.com';
doMakeUsersPhotos2SequenceClientSide({host:host,port:port,securePort:securePort, dataTypeKey:"userPhotoDatesAryMade1",userNamePostfix:"a2", uploadReally:true,disableNotification:true},null);
//doMakeUsersPhotos2SequenceClientSide({host:host,port:port,securePort:securePort, dataTypeKey:"userPhotoDatesAryMade1",userNamePostfix:(new Date().getTime())+"", uploadReally:true,disableNotification:true},null);

















