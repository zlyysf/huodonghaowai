/*
 * test codes common part
 */

var assert = require('assert');
var util = require('util');
var child_process = require('child_process');


var needle = require('needle');


var handy = require('../lib/handy');
var gconfig = require('../lib/config');

var server = require('../lib/server');
var redis = require('../lib/redis');
var solr = require('../lib/solr');
//var common = require('./lib/common');
//var notificationMock = require('./lib/notification');








//THIS need some browsers connect to the server to provide client sockets

var gconfigSimpleBack = null;

var config = exports.config = {
    gC2dmAuth : 'abcd',

    waitMsTimeOfServerStart : 1000,
    waitMsTimeOfServerStop : 100,

    waitMsTimeOfUserBind : 20,
    waitMsTimeForApiBackground: 10,

    waitMsTimeOfClientClose : 50,
    waitMsTimeOfClientsClose : 1000

};

var setLocalWaitTime = exports.setLocalWaitTime = function (){
  config.waitMsTimeOfServerStart = 1000;
  config.waitMsTimeOfServerStop = 100;

  config.waitMsTimeOfUserBind = 20;

  config.waitMsTimeOfClientClose = 50;
  config.waitMsTimeOfClientsClose = 1000;
};//setLocalWaitTime

var backConfigDefaultValue = exports.backConfigDefaultValue = function (){
  if (gconfigSimpleBack != null){
    throw new Error("gconfigSimpleBack != null");
  }
  gconfigSimpleBack = {};
  handy.copyFields({srcObj:gconfig.config,destObj:gconfigSimpleBack,overrideSameName:true});
};

var setConfigDefaultValue = exports.setConfigDefaultValue = function (){
  if (gconfigSimpleBack == null){
    throw new Error("gconfigSimpleBack == null");
  }else{
    handy.copyFields({srcObj:gconfigSimpleBack,destObj:gconfig.config,overrideSameName:true});
  }
};


var previousHttpOrHttpsHeaders = null;
var clearPreviousHttpOrHttpsHeaders = exports.clearPreviousHttpOrHttpsHeaders = function(){
  previousHttpOrHttpsHeaders = null;
};

function getSessionIdFromHeaders(headers) {
  if (!headers || headers.length==0)  return null;
  if (!headers['set-cookie'] || headers['set-cookie'].length==0)  return null;
  var sidData = /^connect\.sid=([^;]+);/.exec(headers['set-cookie'][0]);
  if (!sidData || sidData.length<2) return null;
  return sidData[1];
};
function generateHeaderOptionOfSession(sessionId){
  return { Cookie: 'connect.sid=' + sessionId };
};
function setHeaderOptionOfSession(headerOption,previousHeaders){
  if (!previousHeaders) return headerOption;
  var sessionId = getSessionIdFromHeaders(previousHeaders);
  if (!sessionId) return headerOption;
  var sessionHeaderOption = generateHeaderOptionOfSession(sessionId);
  if (!headerOption)  return sessionHeaderOption;
  handy.copyFields({srcObj:sessionHeaderOption, destObj:headerOption, overrideSameName:true});
  return headerOption;
};
function setHeaderOptionOfSessionFromPrevious(headerOption){
  return setHeaderOptionOfSession(headerOption,previousHttpOrHttpsHeaders);
};




///*
// * this need every item in functions be a function(next)
// */
//var pipelineArray = exports.pipelineArray = function(functions) {
//  var getNextFun = function() {
//    var funcItem = functions.shift();
//    if (typeof funcItem == "function") {
//      funcItem(getNextFun);
//    }
//  };
//  getNextFun();
//};

/**
 * to clear redis db and set some value
 * @param params - contains keepC2dmAuth, setDefaultC2dmAuth
 * @param cbFun - is a function(err,outData)
 *   outData contains nothing
 */
var initStore = exports.initStore = function(params,cbFun){
  var keepC2dmAuth = params.keepC2dmAuth;
  var cleanAll = !keepC2dmAuth;//if not keep, then clean all
  var excludeFilter = keepC2dmAuth?'cachedValue':null;
  var c2dmAuth = params.c2dmAuth;// gconfig.gC2dmAuth;

  var store = redis.create();
  store.clean({all:cleanAll, excludeFilter:excludeFilter},function(err){
    assert.ifError(err);
    if(keepC2dmAuth){
      store.quit(function(err){
        assert.ifError(err);
        if (cbFun) cbFun(null,null);
        return;
      });//quit
      return;
    }
    //not keep c2dm Auth, e.g., old auth is cleaned. And need set default auth
    if (c2dmAuth){
      store.setC2dmAuth({auth:c2dmAuth},function(err){
        assert.ifError(err);
        store.quit(function(err){
          assert.ifError(err);
          if (cbFun) cbFun(null,null);
          return;
        });//quit
      });//setC2dmAuth
      return;
    }
    if (cbFun) cbFun(null,null);
    return;
  });//clean
};//initStore

/**
 *
 * @param params - contains port, cleanStore, notKeepC2dmAuth, useRealNotify
 * @param cbFun - is a function(err,outData)
 *   outData contains server
 */
var startServer = exports.startServer = function(params,cbFun) {
  util.log("startServer begin");
  assert.ok(params.port);
  assert.ok(params.securePort);
  var port = params.port;
  var securePort = params.securePort;
  var cleanStore = params.cleanStore;
  var notKeepC2dmAuth = params.notKeepC2dmAuth;
  var useRealNotify = params.useRealNotify;

  gconfig.config.logLevel = 3;//3;//debug

  var s = new server ();
  s.listen(port,securePort);
  if(cleanStore){
    var cleanStoreAll = !!notKeepC2dmAuth;
    var cleanStoreExcludeFilter = notKeepC2dmAuth? null:'cachedValue';
    s.store.clean({all:cleanStoreAll, excludeFilter:cleanStoreExcludeFilter},function(){});
  }

  //if (! useRealNotify) s.notification = notificationMock.create();

  setTimeout(function(){
    util.log("startServer finished");
    if (cbFun) cbFun(null,{server:s});
  },config.waitMsTimeOfServerStart);//setTimeout
};//startServer


//TODO find out why process not exit when stopServer called
/**
 *
 * @param params - contains server
 * @param cbFun - is a function(err,outData)
 *   outData contains nothing
 */
var stopServer = exports.stopServer = function(params,cbFun){
  util.log("stopServer begin");
  assert.ok(params);
  assert.ok(params.server);
  var s = params.server;
  s.close();
  setTimeout(function(){
    util.log("stopServer finished");
    if (cbFun) cbFun(null,null);
  },config.waitMsTimeOfServerStop);//setTimeout
};//stopServer




/**
 *
 * @param params - contains needHttps, host,port,path,waitMsTimeForApiBackground,notLogResponseHere,postDataObj
 * @param cbFun - is a function(err,outData)
 *   outData contains res
 *     res is httpResponse of api
 */
var runPRApi = exports.runPRApi = function(params,cbFun){
  assert.ok(params.host);
  assert.ok(params.port);
  var needHttps = params.needHttps;
  var host = params.host;
  var port = params.port;
  var path = params.path;
  var waitMsTimeForApiBackground = params.waitMsTimeForApiBackground;
  var notLogResponseHere = params.notLogResponseHere;
  var postDataObj = params.postDataObj;

  if (waitMsTimeForApiBackground == null){
    waitMsTimeForApiBackground = config.waitMsTimeForApiBackground;
  }

  var headerOption = setHeaderOptionOfSessionFromPrevious(null);
  console.log(path+' postDataObj='+util.inspect(postDataObj,false,100)+'\nheaderOption='+util.inspect(headerOption));
  handy.doHttpPostJson({needHttps:needHttps,host:host,port:port,path:path,headers:headerOption,postDataObj:postDataObj},function(err,httpRetDataObj){
    previousHttpOrHttpsHeaders = httpRetDataObj.responseInfo.headers;
    util.log('  http ret headers='+util.inspect(httpRetDataObj.responseInfo.headers,false,100));
    assert.ifError(err);
    var httpApiRetDataObj = null;
    try{
      httpApiRetDataObj = JSON.parse(httpRetDataObj.data);
    }catch(errt){
      util.log(path+' occur JSON.parse error:'+util.inspect(errt,false,100)+'\nhttpRetDataObj='+util.inspect(httpRetDataObj,false,100));
    }

    if (!notLogResponseHere){
      util.log(path+' httpApiRetDataObj='+util.inspect(httpApiRetDataObj,false,100));
    }
    setTimeout(function(){
      if (cbFun) return cbFun(null,httpApiRetDataObj);
      return;
    },config.waitMsTimeForApiBackground);//setTimeout
    return;
  });//doHttpPostJson
};//runPRApi


/**
*
* @param params - contains host,port,waitMsTimeForApiBackground,notLogResponseHere,postDataObj
*   postDataObj contains notUploadReally, userId, width, height, feedId, image(a picture file path)
* @param cbFun - is a function(err,outData)
*   outData contains res
*     res is httpResponse of api
*/
var runPRApiUploadPhoto = exports.runPRApiUploadPhoto = function(params,cbFun){
  assert.ok(params.host);
  assert.ok(params.port);
  var host = params.host;
  var port = params.port;
  var path = "/user/uploadPhoto"; //params.path;//  "/user/uploadPhoto"
  var url = "http://"+host+":"+port+path;

  var waitMsTimeForApiBackground = params.waitMsTimeForApiBackground;
  var notLogResponseHere = params.notLogResponseHere;
  if (waitMsTimeForApiBackground == null){
    waitMsTimeForApiBackground = config.waitMsTimeForApiBackground;
  }

  var postDataObj = params.postDataObj;
  var notUploadReally = handy.convertToBool(postDataObj.notUploadReally);
  //var notAutoAudit = postDataObj.notAutoAudit;
  var userId = postDataObj.userId;
  var width = postDataObj.width;
  var height = postDataObj.height;
  var feedId = postDataObj.feedId;
  var imageFilePath = postDataObj.image;

  var jsonData = {
      userId : userId,
      width: width,
      height: height,
      notUploadReally : notUploadReally,
      image: { file: imageFilePath, content_type: 'application/octet-stream' }
    };
  if (feedId) jsonData.feedId = feedId;
  var needleOptions = {
      multipart: true,
      timeout: 10*60*1000
    };
  var headerOption = setHeaderOptionOfSessionFromPrevious(null);
  needleOptions.headers = headerOption;
  util.log("runPRApiUploadPhoto before needle.post, url="+util.inspect(url,false,100)+
      ",\nneedleOptions="+util.inspect(needleOptions,false,100)+", jsonData="+util.inspect(jsonData,false,100));
  needle.post(url, jsonData, needleOptions, function(err, resp, body){
    util.log("runPRApiUploadPhoto needle.post callback ret");
    previousHttpOrHttpsHeaders = resp.headers;
    if (err) {
      util.log('err in runPRApiUploadPhoto, needle.post:' + util.inspect(err,false,100)+ ',\n stack=' + err.stack);
    }
    if (!notLogResponseHere){
      util.log(path+' returned body='+util.inspect(body,false,100));
    }
    var httpApiRetDataObj = null;
    if (Buffer.isBuffer(body)){
      httpApiRetDataObj = JSON.parse(body+'');
    }else if (body instanceof Object){
      httpApiRetDataObj = body;
    }else{
      httpApiRetDataObj = JSON.parse(body+'');
    }
    setTimeout(function(){
      if (cbFun) return cbFun(null,httpApiRetDataObj);
      return;
    },config.waitMsTimeForApiBackground);//setTimeout
  });//needle.post
};//runPRApiUploadPhoto


/**
*
* @param params - contains host,port,path,waitMsTimeForApiBackground,notLogResponseHere,postDataObj
*   postDataObj contains image(a picture file path), with other non-file fields
* @param cbFun - is a function(err,outData)
*   outData contains res
*     res is httpResponse of api
*/
var runPRApiWithUploadPhoto = exports.runPRApiWithUploadPhoto = function(params,cbFun){
  assert.ok(params.host);
  assert.ok(params.port);
  var host = params.host;
  var port = params.port;
  var path = params.path;
  var url = "http://"+host+":"+port+path;

  var waitMsTimeForApiBackground = params.waitMsTimeForApiBackground;
  var notLogResponseHere = params.notLogResponseHere;
  if (waitMsTimeForApiBackground == null){
    waitMsTimeForApiBackground = config.waitMsTimeForApiBackground;
  }

  var postDataObj = params.postDataObj;
  var imageFilePath = postDataObj.image;
  var jsonData = handy.cloneObject(postDataObj);
  delete jsonData.image;
  if(imageFilePath) jsonData.image = {file: imageFilePath, content_type: 'application/octet-stream'};

  var needleOptions = {
      multipart: true,
      timeout: 10*60*1000
    };
  var headerOption = setHeaderOptionOfSessionFromPrevious(null);
  needleOptions.headers = headerOption;
  util.log("runPRApiWithUploadPhoto before needle.post, url="+util.inspect(url,false,100)+
      ",\nneedleOptions="+util.inspect(needleOptions,false,100)+", jsonData="+util.inspect(jsonData,false,100));
  needle.post(url, jsonData, needleOptions, function(err, resp, body){
    util.log("runPRApiWithUploadPhoto needle.post callback ret");
    previousHttpOrHttpsHeaders = resp.headers;
    if (err) {
      util.log('err in runPRApiWithUploadPhoto, needle.post:' + util.inspect(err,false,100)+ ',\n stack=' + err.stack);
    }
    if (!notLogResponseHere){
      util.log(path+' returned body='+util.inspect(body,false,100));
    }
    var httpApiRetDataObj = null;
    if (Buffer.isBuffer(body)){
      httpApiRetDataObj = JSON.parse(body+'');
    }else if (body instanceof Object){
      httpApiRetDataObj = body;
    }else{
      httpApiRetDataObj = JSON.parse(body+'');
    }
    setTimeout(function(){
      if (cbFun) return cbFun(null,httpApiRetDataObj);
      return;
    },config.waitMsTimeForApiBackground);//setTimeout
  });//needle.post
};//runPRApiWithUploadPhoto



/**
*
* @param params - contains needHttps, host,port,path,waitMsTimeForApiBackground,notLogResponseHere,postDataObj
* @param cbFun - is a function(err,outData)
*   outData contains res
*     res is httpResponse of api
*/
var runPRApiWithoutSession = exports.runPRApiWithoutSession = function(params,cbFun){
 assert.ok(params.host);
 assert.ok(params.port);
 var needHttps = params.needHttps;
 var host = params.host;
 var port = params.port;
 var path = params.path;
 var waitMsTimeForApiBackground = params.waitMsTimeForApiBackground;
 var notLogResponseHere = params.notLogResponseHere;
 var postDataObj = params.postDataObj;

 if (waitMsTimeForApiBackground == null){
   waitMsTimeForApiBackground = config.waitMsTimeForApiBackground;
 }

 console.log(path+' postDataObj='+util.inspect(postDataObj));
 handy.doHttpPostJson({needHttps:needHttps,host:host,port:port,path:path,headers:{},postDataObj:postDataObj},function(err,httpRetDataObj){
   assert.ifError(err);
   var httpApiRetDataObj = JSON.parse(httpRetDataObj.data);
   if (!notLogResponseHere){
     util.log(path+' httpApiRetDataObj='+util.inspect(httpApiRetDataObj,false,100));
   }
   setTimeout(function(){
     if (cbFun) return cbFun(null,httpApiRetDataObj);
     return;
   },config.waitMsTimeForApiBackground);//setTimeout
   return;
 });//doHttpPostJson
};//runPRApiWithoutSession


/**
*
* @param params - contains host,port,waitMsTimeForApiBackground,notLogResponseHere,postDataObj
*   postDataObj contains notUploadReally, userId, width, height, feedId, image(a picture file path)
* @param cbFun - is a function(err,outData)
*   outData contains res
*     res is httpResponse of api
*/
var runCurlCmdForUploadPhoto = exports.runCurlCmdForUploadPhoto = function(params,cbFun){
  assert.ok(params.host);
  assert.ok(params.port);
  var host = params.host;
  var port = params.port;
  var path = "/user/uploadPhoto"; //params.path;//  "/user/uploadPhoto"
  var url = "http://"+host+":"+port+path;
  var waitMsTimeForApiBackground = params.waitMsTimeForApiBackground;
  var notLogResponseHere = params.notLogResponseHere;
  if (waitMsTimeForApiBackground == null){
    waitMsTimeForApiBackground = config.waitMsTimeForApiBackground;
  }

  var postDataObj = params.postDataObj;
  var notUploadReally = postDataObj.notUploadReally;
  //var notAutoAudit = postDataObj.notAutoAudit;
  var userId = postDataObj.userId;
  var width = postDataObj.width;
  var height = postDataObj.height;
  var feedId = postDataObj.feedId;
  var image = postDataObj.image;

  var cmdStr = 'curl '+' -F "image=@'+image+'" '
    + ' --form-string "userId='+userId+'"' + ' --form-string "width='+width+'"' + ' --form-string "height='+height+'"'
    + ' --form-string "notUploadReally='+notUploadReally+'"' ;
  if(feedId != null)
    cmdStr += ' --form-string "feedId='+feedId+'"';
  cmdStr += ' --url "'+url+'"';

//  var cmdCurl = "curl";
//  var cmdArgs = [];
//  cmdArgs.push('-F');
//  cmdArgs.push('image=@'+image);
//  cmdArgs.push('--form-string');
//  cmdArgs.push('userId='+userId);
//  cmdArgs.push('--form-string');
//  cmdArgs.push('width='+width);
//  cmdArgs.push('--form-string');
//  cmdArgs.push('height='+height);
//  if(feedId != null){
//    cmdArgs.push('--form-string');
//    cmdArgs.push('feedId='+feedId);
//  }
//  cmdArgs.push('--url');
//  cmdArgs.push(url);
//
//  //var curlProc = child_process.spawn(cmdStr);//X
//  var curlProc = child_process.spawn(cmdCurl,cmdArgs);
//  //util.log("curlProc="+util.inspect(curlProc,false,100));
//  var strBuf = "";
//
//  console.log(path+' curlCmdStr='+cmdStr);
//  curlProc.stdout.on('data', function (data) {
//    strBuf += data;
//  });
//  var childAlreadyWriteToErr = false;
//  curlProc.stderr.on('data', function (data) {
//    if (childAlreadyWriteToErr){
//      childAlreadyWriteToErr = true;
//      console.error('curl cmd stderr: \n');
//    }
//    console.error(data);
//  });
//  curlProc.on('exit', function (code) {
//    console.log('child process exited with code ' + code);
//    if (!notLogResponseHere){
//      util.log(path+' curlCmdRet='+strBuf);
//    }
//    var httpApiRetDataObj = JSON.parse(strBuf);
//    setTimeout(function(){
//      if (cbFun) return cbFun(null,httpApiRetDataObj);
//      return;
//    },config.waitMsTimeForApiBackground);//setTimeout
//    return;
//  });

  var curlProc = child_process.exec(cmdStr, function (error, stdout, stderr) {
    //console.log('stdout: ' + stdout);
    //console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
    if (!notLogResponseHere){
      util.log(path+' curlCmd stdout='+stdout);
    }
    var httpApiRetDataObj = JSON.parse(stdout+'');
    setTimeout(function(){
      if (cbFun) return cbFun(null,httpApiRetDataObj);
      return;
    },config.waitMsTimeForApiBackground);//setTimeout
    return;
  });
};//runCurlCmdForUploadPhoto


/**
 * TODO DEFINE PARAMS
 * @param params
 * @param cbInServerLife - is a function(next)
 * @param cbAfterServerStop - is a function(next)
 */
var provideServerLifeCycle = exports.provideServerLifeCycle = function (params,cbInServerLife,cbAfterServerStop){
  handy.log('blue', "provideServerLifeCycle enter");
  assert.ok(params);
  assert.ok(cbInServerLife);
  assert.ok(params.port);
  assert.ok(params.securePort);
  var port = params.port;
  var securePort = params.securePort;
  var needInitStore = params.needInitStore;
  var notKeepC2dmAuth = params.notKeepC2dmAuth;
  var c2dmAuth = params.c2dmAuth;
  var needClearSolr = params.needClearSolr;

  var outDataS;
  var server = null;
  if (params.NeedSetConfigDefault) setConfigDefaultValue();
  handy.pipeline(
      function(next){
        if (needInitStore){
          initStore({keepC2dmAuth:!notKeepC2dmAuth, c2dmAuth:c2dmAuth},function(){
            next();
          });//initStore
          return;
        }else{
          next();
        }
      },
      function(next){
        if (needClearSolr){
          var solrClient = solr.create({});
          solrClient.deleteAllByJson({},function(err){
            assert.ifError(err);
            solrClient.getCount({},function(err,count){
              assert.ifError(err);
              assert.ok(count == 0);
              solrClient.close();
              next();
            });//getCount
          });//deleteAllByJson
          return;
        }else{
          next();
        }
      },
      function(next){
        startServer({port:port,securePort:securePort,cleanStore:false},function(err, outDataStartServer){
          outDataS = outDataStartServer;
          server = outDataS.server;
          next();
        });//startServer
      },
      cbInServerLife,
      function(next){
        stopServer({server:server},function(){
          handy.log('blue', "provideServerLifeCycle exit");
          if (next) next();
        });//stopServer
      },
      cbAfterServerStop
  );//handy.pipeline
};//provideServerLifeCycle






//------------------------------------



/**
 *
 * @param params - contains host, port
 * @param cbFuns - contains cbFunOnOpen, cbFunOnClose, cbFunOnMessage, cbFunOnData, cbFunOnWserror, cbFunOnce
 *   cbFunOnOpen  is a function(openedInfo), openedInfo contains client,webSocket
 *   cbFunOnClose  is a function(closedInfo), closedInfo contains client,webSocket
 *   cbFunOnMessage  is a function(onMessageInfo), onMessageInfo contains client,webSocket,messageData
 *   cbFunOnData  is a function(onDataInfo), onDataInfo contains client,webSocket,data
 *   cbFunOnWserror  is a function(onWserrorInfo), onWserrorInfo contains client,webSocket,err
 *   cbFunOnce  is a function(retInfo), retInfo contains eventType, client,webSocket,err. OnOpen, OnClose, OnWserror may call this function.
 */
var createClientSocketDetail = exports.createClientSocketDetail = function (params,cbFuns){
  assert.ok(params);
  assert.ok(cbFuns);
  assert.ok(params.host);
  assert.ok(params.port);
  var host = params.host;
  var port = params.port;
  var cbFunOnOpen = cbFuns.cbFunOnOpen;
  var cbFunOnClose = cbFuns.cbFunOnClose;
  var cbFunOnMessage = cbFuns.cbFunOnMessage;
  var cbFunOnData = cbFuns.cbFunOnData;
  var cbFunOnWserror = cbFuns.cbFunOnWserror;
  var cbFunOnce = cbFuns.cbFunOnce;

  var client1 = common.client(port,host);
  client1.handshake(function (sid) {
      var socketId = sid;
      var websocket1 = common.websocket(client1, socketId, null, host);
      var alreadyCalledOnceFun = false;
      var closeEventTriggered = false;
      websocket1.on('message', function(msgData) {
        var userId = websocket1.userId ? websocket1.userId : 'NOuserId';
        handy.log('yellow', "ws on message event entered, userId="+userId+ ", msgData is below:\n");
        handy.log('yellow', msgData);//util.inspect(msgData,false,100));
        if (cbFunOnMessage) return cbFunOnMessage({client:client1,webSocket:websocket1,messageData:messageData});
      });//on message

      websocket1.on('data', function(recData) {
        var userId = websocket1.userId ? websocket1.userId : 'NOuserId';
        handy.log('yellow', "ws on data event entered, userId="+userId+ ", recData is below:\n");
        handy.log('yellow', recData);//util.inspect(recData,false,100));
        if (cbFunOnData) return cbFunOnData({client:client1,webSocket:websocket1,data:recData});
      });//on data

      websocket1.on('wserror', function(err) {
        if (closeEventTriggered){
          handy.log('black', "ws on wserror event entered, but it is after close event. Don't worry. It is because of bad source code.");
          return;
        }

        var userId = websocket1.userId ? websocket1.userId : 'NOuserId';
        handy.log('yellow', "ws on wserror event entered, userId="+userId+", err is below:\n");
        handy.log('yellow', err);//util.inspect(err,false,100));
        handy.log('yellow', "stack=" +err.stack);
        if (cbFunOnWserror) cbFunOnWserror({client:client1,webSocket:websocket1,err:err});
        if (!alreadyCalledOnceFun){
          if (cbFunOnce){
            alreadyCalledOnceFun = true;
            cbFunOnce({eventType:'wserror',client:client1,webSocket:websocket1,err:err});
          }
        }
        return;
      });//on wserror

      websocket1.on('close', function() {
        closeEventTriggered = true;
        var userId = websocket1.userId ? websocket1.userId : 'NOuserId';
        handy.log('yellow', "ws on close event entered, userId="+userId);
        if (cbFunOnClose) cbFunOnClose({client:client1,webSocket:websocket1});
        if (!alreadyCalledOnceFun){
          if (cbFunOnce){
            alreadyCalledOnceFun = true;
            cbFunOnce({eventType:'close',client:client1,webSocket:websocket1});
          }
        }
        return;
      });//on close

      websocket1.on('open', function() {
        var userId = websocket1.userId ? websocket1.userId : 'NOuserId';
        handy.log('yellow', "ws on open event entered, userId="+userId);

        if (cbFunOnOpen) cbFunOnOpen({client:client1,webSocket:websocket1});
        if (!alreadyCalledOnceFun){
          if (cbFunOnce){
            alreadyCalledOnceFun = true;
            cbFunOnce({eventType:'open',client:client1,webSocket:websocket1});
          }
        }
        return;
      });//on open
  });//client1.handshake
};//createClientSocketDetail
/**
 *
 * @param params - contains host, port
 * @param cbFun - is a function(retInfo), retInfo contains eventType, client,webSocket,err.
 *
 */
var createClientSocket = exports.createClientSocket = function (params,cbFun){
  createClientSocketDetail(params, {cbFunOnce:cbFun});
};//createClientSocket

/**
 *
 * @param params - contains host, port, count
 * @param cbFun - is a function(retInfoArray), each retInfo contains eventType, client,webSocket,err.
 *
 */
var createClientSockets = exports.createClientSockets = function (params,cbFun){
  handy.log('blue', "createClientSockets enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.count > 0);
  var host = params.host;
  var port = params.port;
  var count = params.count;

  var createNClientSocket = function(params,cbF){
    var n = params.n;
    var outAry = params.outAry;
    assert.ok(outAry);
    if (n>0) {
      createClientSocket({host:host,port:port},function(retInfo){
        outAry.push(retInfo);
        n -- ;
        createNClientSocket({n:n,outAry:outAry},cbF); //recursive calling
      });//createClientSocket
    }else{
      if (cbF) cbF();
    }
  };//createNClientSocket

  var outAry = [];
  createNClientSocket({n:count, outAry:outAry},function(){
    assert.ok(outAry.length == count);
    handy.log('blue', "createClientSockets exit");
    if (cbFun) cbFun(outAry);
    return;
  });//createNClientSocket
};//createClientSockets



/**
 *
 * @param params - host, port, userId
 * @param cbFun  - is a function(retInfo), retInfo contains eventType, client,webSocket,err , res
 * @returns
 */
var createClientSocketWithBindUser = exports.createClientSocketWithBindUser = function (params,cbFun){
  handy.log('blue', "createClientSocketWithBindUser enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.userId);
  var host = params.host;
  var port = params.port;
  var userId = params.userId;
  createClientSocket({host:host,port:port},function(retClientWebsocketInfo){
    if (retClientWebsocketInfo && retClientWebsocketInfo.eventType == 'open'){
      var socketId = retClientWebsocketInfo.webSocket.sid;
      runUserBind({host:host,port:port, userId:userId,socketId:socketId},function(outDataUserBind){
        var outData = {};
        handy.copyFields({srcObj:retClientWebsocketInfo, destObj:outData, overrideSameName:false});
        handy.copyFields({srcObj:outDataUserBind, destObj:outData, overrideSameName:false});
        handy.log('blue', "createClientSocketWithBindUser exit");
        if (cbFun) cbFun(outData);
        return;
      });//runUserBind
      return;
    }else{
      throw new Error('in createClientSocketWithBindUser, client socket connect failed.');
    }
  });//createClientSocket
};//createClientSocketWithBindUser


/**
 *
 * @param params - host, port, userIds
 * @param cbFun  - is a function(clientWsBindInfoAry), each clientWsBindInfo contains eventType, client,webSocket,err , res
 * @returns
 */
var createClientSocketsWithBindUsers = exports.createClientSocketsWithBindUsers = function (params,cbFun){
  handy.log('blue', "createClientSocketsWithBindUsers enter");
  assert.ok(params.host);
  assert.ok(params.port);
  assert.ok(params.userIds && params.userIds.length > 0);
  var host = params.host;
  var port = params.port;
  var userIds = params.userIds;
  var createNthClientSocketWithBindUser = function(params,cbF){
    var idx = params.idx;
    var userIds = params.userIds;
    var outAry = params.outAry;
    assert.ok(outAry);
    if (idx < userIds.length) {
      var userId = userIds[idx];
      createClientSocketWithBindUser({host:host,port:port,userId:userId},function(clientWsBindInfo){
        outAry.push(clientWsBindInfo);
        params.idx++;
        createNthClientSocketWithBindUser(params,cbF); //recursive calling
      });//createClientSocketWithBindUser
    }else{
      if (cbF) cbF();
    }
  };//createNthClientSocketWithBindUser
  var outAry = [];
  createNthClientSocketWithBindUser({idx:0, userIds:userIds, outAry:outAry},function(){
    assert.ok(outAry.length == userIds.length);
    handy.log('blue', "createClientSocketsWithBindUsers exit");
    if (cbFun) cbFun(outAry);
    return;
  });//createNthClientSocketWithBindUser
};//createClientSocketsWithBindUsers





/**
 *
 * @param params - contains client,webSocket
 * @param cbFun - is a function()
 */
var closeClient = exports.closeClient = function (params,cbFun){
  handy.log('red', "closeClient entered");
  assert.ok(params.client);
  assert.ok(params.webSocket);
  var c = params.client;
  var ws = params.webSocket;
  //ws.close(0);  not good as finishClose
  ws.finishClose();
  setTimeout(function () {
    c.end();
    setTimeout(function () {
      handy.log('red', "closeClient exit");
      if (cbFun) cbFun();
    }, config.waitMsTimeOfClientClose);
  }, 10);
};//closeClient
/**
 *
 * @param params contains clientWebSocketArray, each item contains client,webSocket
 * @param cbFun - is a function()
 */
var closeClients = exports.closeClients = function (params,cbFun){
  handy.log('red', "closeClients entered");
  assert.ok(params.clientWebSocketArray);

  var closeNClient = function() {
    var clientWsInfo = params.clientWebSocketArray.shift();
    if (clientWsInfo != null){
      closeClient(clientWsInfo,function(){
        closeNClient();//recursively invoke
      });//closeClient
      return;
    }else{
      setTimeout(function () {
        handy.log('red', "closeClients exit");
        if (cbFun) cbFun();
      }, config.waitMsTimeOfClientsClose);
      return;
    }
  };
  closeNClient();
};//closeClients


/**
 * @param paramsInOut - contains (in) host,port,userIds; (out) clientWsBindInfoArray.
 * @param cbInClientLife - is a function(next)
 * @param cbAfterClientClose - is a function(next)
 */
var provideClientSioSocketsLifeCycle = exports.provideClientSioSocketsLifeCycle = function (paramsInOut,cbInClientLife,cbAfterClientClose){
  handy.log('blue', "provideClientSioSocketsLifeCycle enter");
  assert.ok(paramsInOut);
  assert.ok(cbInClientLife);
  assert.ok(paramsInOut.host);
  assert.ok(paramsInOut.port);
  assert.ok(paramsInOut.userIds && paramsInOut.userIds.length>0);
  var host = paramsInOut.host;
  var port = paramsInOut.port;
  var userIds = paramsInOut.userIds;

  var clientWsBindInfoArray ;
  handy.pipeline(
      function(next){
        createClientSocketsWithBindUsers({host:host,port:port,userIds:userIds},function(clientWsBindInfoAry){
          clientWsBindInfoArray = clientWsBindInfoAry;
          paramsInOut.clientWsBindInfoArray = clientWsBindInfoArray;
          next();
        });//createClientSocketsWithBindUsers
      },
      cbInClientLife,
      function(next){
        closeClients({clientWebSocketArray:clientWsBindInfoArray},function(){
          handy.log('blue', "provideClientSioSocketsLifeCycle exit");
          if (next) next();
        });//closeClients
      },
      cbAfterClientClose
  );//handy.pipeline
};//provideClientSioSocketsLifeCycle





var arrayAllItemToRealNumber = exports.arrayAllItemToRealNumber = function (ary){
  if (!ary) return;
  for(var i=0; i<ary.length; i++){
    var item = ary[i];
    ary[i] = Number(item);
  }
};//arrayAllItemToRealNumber

var sortByNumberOrderAsc = exports.sortByNumberOrderAsc = function (a, b){
  return Number(a) - Number(b);
};//sortByNumberOrderAsc











