var util = require('util');
var assert = require('assert');
var path = require('path');
var tls = require('tls');
var fs = require('fs');

var handy = require('./handy');
var tool = require("./tool");
var logger = require('./logger');
var config = require('./config');
exports = module.exports = Notification;

exports.create = function () {
  //logger.logDebug("Notification create entered");
  return new Notification ();
};

function Notification() {
  //logger.logDebug("Notification function entered");
  var self = this;

  self.store = null;//self.userRegistrationIds = {};//userId --> registrationId

  //here just simply control, if 1 notification can not send because of not meeting the flags condition, then it will be simply discarded.
  self.spanInMsToDisableGetC2dmAuth = 60 * 1000;//1 minute
  self.spanInMsToDisableSendC2dmNotification = 60 * 1000;//1 minute
  self.spanInMsToDisabledDevice = 60 * 1000;//1 minute

  //from Chinese to c2dm, many error is about connection. I found that if wait about 1 second, it worked again often.
  //from American Amazon to c2dm, the network is fast and the error occur very few.
  self.spanInMsToDisabledDeviceForConnectError = 1000; //1 second

  self.isRefreshingC2dmAuth = false;//as a control flag
  self.needTemporaryDisableGetC2dmAuth = false;//as a control flag, when error, set this flag, and use timer to unset the flag.
  self.timerIdForDisableGetC2dmAuth = null;
  self.needTemporaryDisableSendC2dmNotification = false;//as a control flag, when error, set this flag, and use timer to unset the flag.
  self.timerIdForDisableSendC2dmNotification = null;
  self.TemporaryDisabledDevices = {};//field is c2dm device registrationId, value is timer id. check condition is value==null

  self.apnsConnection = null; //to reuse apns connection
  if (!localConfig.finelyEnableFlag || !localConfig.bigEnableFlag){
    return;
  }
};

var localConfig = exports.config = {
    finelyEnableFlag: true, //when the notification codes not completed, use it to not to affect other modules.
    bigEnableFlag: true,
    types:{
      'sendDate' : {message:'%s sent you a date.', messageParameters:['userName']},
      'confirmDate' : {message:'%s', messageParameters:['messageText']},
      'cancelDate' : {message:'%s', messageParameters:['messageText']},
      'sendMessage' : {message:'%s 给你发了一条消息', messageParameters:['userName']},

      'notifyDateInAdvance' : {message:"Hi %s, you have a date with %s in 2 hours. Don't forget it!", messageParameters:['userName','targetUserName']},
      'systemBroadMessage' : {message:'%s', messageParameters:['messageText']}
    }
};

/**
 * @param params - contains type, userName(optional), dateDescription(optional), messageText(optional)
 * @returns - contains message, err
 */
Notification.prototype.formatNotificationMessage = function(params){
  var messagePrefix = 'in Notification.formatNotificationMessage, ';
  var self = this;
  var req = params.req;
  if(!params.type){
    var err = self.newError({errorKey:'needParameter',messageParams:['type'],messagePrefix:messagePrefix,req:req});
    return {err:err};
  }
  var type = params.type;
  if(type == 'sendDate'){
    if(!params.userName){
      var err = self.newError({errorKey:'needParameter',messageParams:['userName'],messagePrefix:messagePrefix,req:req});
      return {err:err};
    }
    var userName = params.userName;
    var msg = util.format(localConfig.types[type].message,userName);
    return {message:msg};
  }else if(type == 'confirmDate' || type == 'cancelDate' || type == 'systemBroadMessage'){
    if(!params.messageText){
      var err = self.newError({errorKey:'needParameter',messageParams:['messageText'],messagePrefix:messagePrefix,req:req});
      return {err:err};
    }
    var messageText = params.messageText;
    var msg = util.format(localConfig.types[type].message,messageText);
    return {message:msg};
  }else if(type == 'doubleConfirmDate'){
    var msg = localConfig.types[type].message;
    return {message:msg};
  }else if(type == 'sendMessage'){
    if(!params.userName){
      var err = self.newError({errorKey:'needParameter',messageParams:['userName'],messagePrefix:messagePrefix,req:req});
      return {err:err};
    }
    var userName = params.userName;
    var msg = util.format(localConfig.types[type].message,userName);
    return {message:msg};
  }else if(type == 'notifyDateInAdvance'){
    if(!params.userName){
      var err = self.newError({errorKey:'needParameter',messageParams:['userName'],messagePrefix:messagePrefix,req:req});
      return {err:err};
    }
    if(!params.targetUserName){
      var err = self.newError({errorKey:'needParameter',messageParams:['targetUserName'],messagePrefix:messagePrefix,req:req});
      return {err:err};
    }
    var userName = params.userName;
    var targetUserName = params.targetUserName;
    var msg = util.format(localConfig.types[type].message,userName,targetUserName);
    return {message:msg};
  }else{
    var err = self.newError({errorKey:'unsupportedValueForParam',messageParams:[type,'type'],messagePrefix:messagePrefix,req:req});
    return {err:err};
  }
};//formatNotificationMessage


/**
 * here will assure the auth to exist
 * @param params - contains store
 * @param callback - after init finished, will invoke callback function
 */
Notification.prototype.init = function(params,callback){
  logger.logDebug("Notification init entered");
  var self = this;
  self.store = params.store;
  if (self.store){
    self.getC2dmAuth({},callback);
    return;
  }else{
    if(callback) callback();
  }
};

/**
 * when a process need exit naturally (not call process.exit) and immediately, need clear some timer.
 * this is mainly for test codes.
 */
Notification.prototype.quit = function(){
  logger.logDebug("Notification quit entered");
  var self = this;
  if (!localConfig.finelyEnableFlag || !localConfig.bigEnableFlag){
    return;
  }
  if (self.timerIdForDisableGetC2dmAuth){
    clearTimeout(self.timerIdForDisableGetC2dmAuth);
    self.timerIdForDisableGetC2dmAuth = null;
    self.needTemporaryDisableGetC2dmAuth = false;
  }
  if (self.timerIdForDisableSendC2dmNotification){
    clearTimeout(self.timerIdForDisableSendC2dmNotification);
    self.timerIdForDisableSendC2dmNotification = null;
    self.needTemporaryDisableSendC2dmNotification = false;
  }
  for(var fld in self.TemporaryDisabledDevices){
    var val = self.TemporaryDisabledDevices[fld];
    if (val != null && val !== true){
      //here can judge it is a timer id
      clearTimeout(val);
    }
  }

};

/**
 * only log error if can not return error through callback function
 * as a private function
 * @param params - contains err, or errors, showTrace
 */
Notification.prototype.handleError = function(params){
  var self = this;
  var req = params.req;
  var messagePrefix = 'in Notification.handleError, ';
  //replace assert.ok(..) to below check codes because the error thrown by assert can not be handled
  if (!params.err && !params.errors){
    var err = self.newError({errorKey:'needParameter',messageParams:['err or errors'],messagePrefix:messagePrefix,req:req});
    handy.handleError({err:err, nestlevel:0});
    return;
  }

  logger.logError('error handled in Notification layer');
  if (params.err)  handy.handleError({err:params.err, nestlevel:0});
  if (params.errors)  handy.handleErrors({errors:params.errors});
};

/**
 * new error with config defined. also can customize
 * as a private function
 * @param {Object} params - contains code,message,messagePrefix,errorKey.
 *   errorKey is used to get predefined error info in config.
 *   they all can be optional, at this time, the stack info is still useful.
 */
Notification.prototype.newError = function(params) {
  params.messagePrefix = 'error in notification function: ';
  return handy.newError(params);
};//newError

/*
 * according to http://code.google.com/intl/zh-CN/apis/accounts/docs/AuthForInstalledApps.html
 * In response to a login request, Google returns either an HTTP 200, if login succeeded, or an HTTP 403, if login failed.
 * when 200, a success response contains the authorization token, labeled "Auth", in the body of the response.
 * when 403, below Error codes table
 *   Error code            Description
 *   BadAuthentication     The login request used a username or password that is not recognized.
 *   NotVerified           The account email address has not been verified. The user will need to access their Google account directly to resolve the issue before logging in using a non-Google application.
 *   TermsNotAgreed        The user has not agreed to terms. The user will need to access their Google account directly to resolve the issue before logging in using a non-Google application.
 *   CaptchaRequired       A CAPTCHA is required. (A response with this error code will also contain an image URL and a CAPTCHA token.)
 *   Unknown               The error is unknown or unspecified; the request contained invalid input or was malformed.
 *   AccountDeleted        The user account has been deleted.
 *   AccountDisabled       The user account has been disabled.
 *   ServiceDisabled       The user's access to the specified service has been disabled. (The user account may still be valid.)
 *   ServiceUnavailable    The service is not available; try again later.
 *
 * @returns - contains err, authData
 *   authData contains Auth,SID,LSID
 */
Notification.prototype.parseGoogleC2dmAuthResponse = function (responseData) {
  var self = this;
  var req = responseData.req;
  var messagePrefix = 'in Notification.parseGoogleC2dmAuthResponse, ';
  if(responseData && responseData.responseInfo){
    var data = responseData.data;
    if (responseData.responseInfo.statusCode==200){
      if(!data){
        var err = self.newError({errorKey:'HttpsEmptyResponse',messageParams:['https://www.google.com/accounts/ClientLogin'],messagePrefix:messagePrefix,req:req});
        return {err:err};
      }

      var startPosOfSID = data.indexOf("SID=");
      var startPosOfLSID = data.indexOf("LSID=");
      var startPosOfAuth = data.indexOf("Auth=");
      //replace assert.ok(..) to below check codes because the error thrown by assert can not be returned to caller
      if(!(startPosOfSID+4<startPosOfLSID)){
        var err = self.newError({errorKey:'needVariableMeetCondition',messageParams:['startPosOfSID+4<startPosOfLSID'],messagePrefix:messagePrefix,req:req});
        return {err:err};
      }
      if(!(startPosOfLSID+5<startPosOfAuth)){
        var err = self.newError({errorKey:'needVariableMeetCondition',messageParams:['startPosOfLSID+5<startPosOfAuth'],messagePrefix:messagePrefix,req:req});
        return {err:err};
      }
      var partSID = data.substring(startPosOfSID+4,startPosOfLSID);
      partSID = self.removeLastLinefeedChar(partSID);
      var partLSID = data.substring(startPosOfLSID+5,startPosOfAuth);
      partLSID = self.removeLastLinefeedChar(partLSID);
      var partAuth = data.substring(startPosOfAuth+5,data.length);
      partAuth = self.removeLastLinefeedChar(partAuth);
      //replace assert.ok(..) to below check codes because the error thrown by assert can not be returned to caller
      if(!(partAuth != null && partAuth != "")){
        var err = self.newError({errorKey:'needVariableMeetCondition',messageParams:['partAuth != null && partAuth != ""'],messagePrefix:messagePrefix,req:req});
        return {err:err};
      }
      var authData = {SID:partSID, LSID:partLSID, Auth:partAuth};
      return {authData:authData};
    }//statusCode==200

    if (responseData.responseInfo.statusCode==403){
      if( data.indexOf("Error=BadAuthentication") >=0 ){
        var err = self.newError({errorKey:'c2dmAuthErrorBadAuthentication',messageParams:[],messagePrefix:messagePrefix,req:req});
        return {err:err};
      }else if( data.indexOf("Error=NotVerified") >=0 ){
        var err = self.newError({errorKey:'c2dmAuthErrorNotVerified',messageParams:[],messagePrefix:messagePrefix,req:req});
        return {err:err};
      }else if( data.indexOf("Error=TermsNotAgreed") >=0 ){
        var err = self.newError({errorKey:'c2dmAuthErrorTermsNotAgreed',messageParams:[],messagePrefix:messagePrefix,req:req});
        return {err:err};
      }else if( data.indexOf("Error=CaptchaRequired") >=0 ){
        var err = self.newError({errorKey:'c2dmAuthErrorCaptchaRequired',messageParams:[],messagePrefix:messagePrefix,req:req});
        return {err:err};
      }else if( data.indexOf("Error=Unknown") >=0 ){
        var err = self.newError({errorKey:'c2dmAuthErrorUnknown',messageParams:[],messagePrefix:messagePrefix,req:req});
        return {err:err};
      }else if( data.indexOf("Error=AccountDeleted") >=0 ){
        var err = self.newError({errorKey:'c2dmAuthErrorAccountDeleted',messageParams:[],messagePrefix:messagePrefix,req:req});
        return {err:err};
      }else if( data.indexOf("Error=AccountDisabled") >=0 ){
        var err = self.newError({errorKey:'c2dmAuthErrorAccountDisabled',messageParams:[],messagePrefix:messagePrefix,req:req});
        return {err:err};
      }else if( data.indexOf("Error=ServiceDisabled") >=0 ){
        var err = self.newError({errorKey:'c2dmAuthErrorServiceDisabled',messageParams:[],messagePrefix:messagePrefix,req:req});
        return {err:err};
      }else if( data.indexOf("Error=ServiceUnavailable") >=0 ){
        var err = self.newError({errorKey:'c2dmAuthErrorServiceUnavailable',messageParams:[],messagePrefix:messagePrefix,req:req});
        return {err:err};
      }
    }//statusCode==403
  }//if(responseData && responseData.responseInfo)

  var responseDataStr = util.inspect(responseData,false,100);
  var err = self.newError({errorKey:'c2dmAuthUnknownResponse',messageParams:[responseDataStr],messagePrefix:messagePrefix,req:req});
  return {err:err};
};
/**
 * according to http://code.google.com/intl/zh-CN/android/c2dm/
 * below table lists the possible response codes:
 * Response   Description
 * 200        Includes body containing:
 *             id=[ID of sent message]
 *             Error=[error code]
 *               QuotaExceeded — Too many messages sent by the sender. Retry after a while.
 *               DeviceQuotaExceeded — Too many messages sent by the sender to a specific device. Retry after a while.
 *               MissingRegistration — Missing registration_id. Sender should always add the registration_id to the request.
 *               InvalidRegistration — Bad registration_id. Sender should remove this registration_id.
 *               MismatchSenderId — The sender_id contained in the registration_id does not match the sender id used to register with the C2DM servers.
 *               NotRegistered — The user has uninstalled the application or turned off notifications. Sender should stop sending messages to this device and delete the registration_id. The client needs to re-register with the c2dm servers to receive notifications again.
 *               MessageTooBig — The payload of the message is too big, see the limitations. Reduce the size of the message.
 *               MissingCollapseKey — Collapse key is required. Include collapse key in the request.
 * 503        Indicates that the server is temporarily unavailable (i.e., because of timeouts, etc ). Sender must retry later, honoring any Retry-After header included in the response. Application servers must implement exponential back off. Senders that create problems risk being blacklisted.
 * 401        Indicates that the ClientLogin AUTH_TOKEN used to validate the sender is invalid.
 *
 * @returns - contains err, id
 */
Notification.prototype.parseGoogleC2dmSendResponse = function (responseData) {
  var self = this;
  var req = responseData.req;
  var messagePrefix = 'in Notification.parseGoogleC2dmSendResponse, ';
  if(responseData && responseData.responseInfo){
    var data = responseData.data;
    if (responseData.responseInfo.statusCode==200){
      if(!data){
        var err = self.newError({errorKey:'HttpsEmptyResponse',messageParams:['https://android.apis.google.com/c2dm/send'],messagePrefix:messagePrefix,req:req});
        return {err:err};
      }
      var startPosOfId = data.indexOf("id=");
      if(startPosOfId >= 0){
        var partId = data.substring(startPosOfId+3);
        partId = self.removeLastLinefeedChar(partId);
        return {id:partId};
      }//id exist

      if( data.indexOf("Error=QuotaExceeded") >=0 ){
        var err = self.newError({errorKey:'c2dmSendErrorQuotaExceeded',messageParams:[],messagePrefix:messagePrefix,req:req});
        return {err:err};
      }else if( data.indexOf("Error=DeviceQuotaExceeded") >=0 ){
        var err = self.newError({errorKey:'c2dmSendErrorDeviceQuotaExceeded',messageParams:[],messagePrefix:messagePrefix,req:req});
        return {err:err};
      }else if( data.indexOf("Error=MissingRegistration") >=0 ){
        var err = self.newError({errorKey:'c2dmSendErrorMissingRegistration',messageParams:[],messagePrefix:messagePrefix,req:req});
        return {err:err};
      }else if( data.indexOf("Error=InvalidRegistration") >=0 ){
        var err = self.newError({errorKey:'c2dmSendErrorInvalidRegistration',messageParams:[],messagePrefix:messagePrefix,req:req});
        return {err:err};
      }else if( data.indexOf("Error=MismatchSenderId") >=0 ){
        var err = self.newError({errorKey:'c2dmSendErrorMismatchSenderId',messageParams:[],messagePrefix:messagePrefix,req:req});
        return {err:err};
      }else if( data.indexOf("Error=NotRegistered") >=0 ){
        var err = self.newError({errorKey:'c2dmSendErrorNotRegistered',messageParams:[],messagePrefix:messagePrefix,req:req});
        return {err:err};
      }else if( data.indexOf("Error=MessageTooBig") >=0 ){
        var err = self.newError({errorKey:'c2dmSendErrorMessageTooBig',messageParams:[],messagePrefix:messagePrefix,req:req});
        return {err:err};
      }else if( data.indexOf("Error=MissingCollapseKey") >=0 ){
        var err = self.newError({errorKey:'c2dmSendErrorMissingCollapseKey',messageParams:[],messagePrefix:messagePrefix,req:req});
        return {err:err};
      }
    }//statusCode==200

    if (responseData.responseInfo.statusCode==401){
    //data = '<HTML>\n<HEAD>\n<TITLE>Unauthorized</TITLE>\n</HEAD>\n<BODY BGCOLOR="#FFFFFF" TEXT="#000000">\n<H1>Unauthorized</H1>\n<H2>Error 401</H2>\n</BODY>\n</HTML>\n'
    //should clear or refresh auth, let it done in sendC2dmNotification
      var err = self.newError({errorKey:'c2dmSendError401Unauthorized',messageParams:[],messagePrefix:messagePrefix,req:req});
      return {err:err};
    }//statusCode==401

    if (responseData.responseInfo.statusCode==503){
      var err = self.newError({errorKey:'c2dmSendError503ServerUnavailable',messageParams:[],messagePrefix:messagePrefix,req:req});
      return {err:err};
    }//statusCode==503
  }//if(responseData && responseData.responseInfo)

  var responseDataStr = util.inspect(responseData,false,100);
  var err = self.newError({errorKey:'c2dmSendUnknownResponse',messageParams:[responseDataStr],messagePrefix:messagePrefix,req:req});
  return {err:err};
};//parseGoogleC2dmSendResponse

Notification.prototype.removeLastLinefeedChar = function (str) {
  if( str != null && str.length > 0 ){
    if ( str.charAt(str.length-1) == '\n' ){
      str = str.substring(0,str.length-1);
    }
  }
  return str;
};

/**
 * set control flag and timer to wait 1 minute then get auth again
 */
Notification.prototype.temporaryDisableGetGoogleC2dmAuth = function(params){
  var self = this;
  var req = params.req;
  logger.logDebug("Notification temporaryDisableGetGoogleC2dmAuth entered");
  var waitTime = params.waitTime;
  if (waitTime == null)
    waitTime = self.spanInMsToDisableGetC2dmAuth;

  self.needTemporaryDisableGetC2dmAuth = true;//set flag to disable get action
  var timeoutId = setTimeout(function(){
    logger.logDebug("Notification temporaryDisableGetGoogleC2dmAuth timer-callback entered");
    //after wait period, enable get action
    self.needTemporaryDisableGetC2dmAuth = false;
    self.timerIdForDisableGetC2dmAuth = null;
  },waitTime);
  self.timerIdForDisableGetC2dmAuth = timeoutId;
};//temporaryDisableGetGoogleC2dmAuth

/**
 * set control flag and timer to wait 1 minute then get auth again
 */
Notification.prototype.temporaryDisableSendC2dmNotification = function(params){
  var self = this;
  var req = params.req;
  logger.logDebug("Notification temporaryDisableSendC2dmNotification entered");
  var waitTime = params.waitTime;
  if (waitTime == null)
    waitTime = self.spanInMsToDisableSendC2dmNotification;
  self.needTemporaryDisableSendC2dmNotification = true;//set flag to disable get action
  var timeoutId = setTimeout(function(){
    logger.logDebug("Notification temporaryDisableSendC2dmNotification timer-callback entered");
    //after wait period, enable get action
    self.needTemporaryDisableSendC2dmNotification = false;
    self.timerIdForDisableSendC2dmNotification = null;
  },waitTime);
  self.timerIdForDisableSendC2dmNotification = timeoutId;
};//temporaryDisableSendC2dmNotification

/**
 * set control flag and timer to wait 1 minute then get auth again
 */
Notification.prototype.temporaryDisableDevice = function(params){
  var self = this;
  var req = params.req;
  logger.logDebug("Notification temporaryDisableDevice entered");
  var registrationId = params.registrationId;
  var waitTime = params.waitTime;
  if (!registrationId)
    return;
  if (waitTime == null)
    waitTime = self.spanInMsToDisabledDevice;
  self.TemporaryDisabledDevices[registrationId] = true;//set flag to disable get action
  var timeoutId = setTimeout(function(){
    logger.logDebug("Notification temporaryDisableDevice timer-callback entered");
    //after wait period, enable get action
    self.TemporaryDisabledDevices[registrationId] = null;
  },waitTime);
  self.TemporaryDisabledDevices[registrationId] = timeoutId;
};//temporaryDisableDevice

/**
 * only do get, let save auth in cache in other place, e.g. refreshC2dmAuth
 * @returns - contains err,auth
 */
Notification.prototype.getGoogleC2dmAuth = function (params,callback){
  var self = this;
  var messagePrefix = 'in Notification.getGoogleC2dmAuth, ';
  //logger.logDebug("getGoogleC2dmAuth enter");
  var req = params.req;

  //first check control flag
  if (self.needTemporaryDisableGetC2dmAuth){
    var err = self.newError({errorKey:'temporaryDisableGetC2dmAuth',messageParams:[],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
    return;
  }

  var mail = config.config.c2dmMailAccount;
  var mailpasswd = config.config.c2dmMailPwd;
  mailpasswd = handy.decrypt(mailpasswd);

  var postDataObj = {Email:mail, Passwd:mailpasswd, accountType:"GOOGLE", source:"curltest", service:"ac2dm"};
  var postParams = {host:"www.google.com",path:"/accounts/ClientLogin",
      postDataAsStr:"Email="+mail+"&Passwd="+mailpasswd+"&accountType=GOOGLE&source=curltest&service=ac2dm"
      //postDataObj:postDataObj
  };

  if (!localConfig.finelyEnableFlag){
    if (callback) return callback(null,'falseAuth');
    return;
  }

  handy.doHttpsPostByForm(postParams,function(err,authResData){
    if (err){
      //the stack trace can not contain the function outside the callback function in this node version.
      err2 = self.newError({errorKey:'libraryError',messageParams:['notification'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    var authRetData = self.parseGoogleC2dmAuthResponse(authResData);
    if (authRetData.err){
      logger.logDebug("getGoogleC2dmAuth failed, err="+util.inspect(authRetData.err,false,100));
      if (callback) return callback(authRetData.err);
      return;
    }
    //replace assert.ok(..) to below check codes because the error thrown by assert can not be returned to caller
    if(!(authRetData.authData != null)){
      var err = self.newError({errorKey:'needVariableMeetCondition',messageParams:['authRetData.authData != null'],messagePrefix:messagePrefix,req:req});
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    var authData = authRetData.authData;
    var auth = authData.Auth;
    logger.logInfo("Auth got="+util.inspect(auth,false,100));

    if (callback) callback(null,auth);
  });//doHttpsPostByForm
};//getGoogleC2dmAuth

/**
 * get auth from google c2dm and save in cache.
 *
 * @returns - contains err,auth
 */
Notification.prototype.refreshC2dmAuth = function (params,callback) {
  var self = this;
  var req = params.req;
  var messagePrefix = 'in Notification.refreshC2dmAuth, ';
  logger.logDebug("notification refreshC2dmAuth entered");
  //only let 1 to post to google c2dm to get the auth
  if (self.isRefreshingC2dmAuth){
    var err = self.newError({errorKey:'isRefreshingC2dmAuth',messageParams:[],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  self.isRefreshingC2dmAuth = true;
  self.getGoogleC2dmAuth({req:req},function(err,auth){
    self.isRefreshingC2dmAuth = false;
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    //replace assert.ok(..) to below check codes because the error thrown by assert can not be returned to caller
    if(!(auth != null)){
      var err = self.newError({errorKey:'needVariableMeetCondition',messageParams:['auth != null'],messagePrefix:messagePrefix,req:req});
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    self.store.getC2dmAuth({req:req},function(err,oldAuth){
      if (err){
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      if (auth==oldAuth){
        logger.logInfo("refreshC2dmAuth, got auth==old auth");
        if (callback) return callback(null,auth);
        return;
      }else{
        logger.logInfo("refreshC2dmAuth, got auth!=old auth");
        //after got, store it for reuse
        self.store.setC2dmAuth({req:req,auth:auth});//store.setC2dmAuth
        if (callback) return callback(null,auth);
        return;
      }
      return;
    });//store.getC2dmAuth
  });//getGoogleC2dmAuth
};//refreshC2dmAuth

/**
 * get auth from cache at first, if no auth in cache, then get from google c2dm and save in cache
 * @returns - contains err,auth
 */
Notification.prototype.getC2dmAuth = function (params,callback) {
  var self = this;
  var messagePrefix = 'in Notification.getC2dmAuth, ';
  var req = params.req;
  //logger.logDebug("notification getC2dmAuth entered");

  self.store.getC2dmAuth({req:req},function(err,c2dmAuth){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (c2dmAuth){
      if (callback) return callback(null,c2dmAuth);
      return;
    }

    self.refreshC2dmAuth({req:req},function(err,auth){
      if (err){
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      //replace assert.ok(..) to below check codes because the error thrown by assert can not be returned to caller
      if(!(auth != null)){
        var err = self.newError({errorKey:'needVariableMeetCondition',messageParams:['auth != null'],messagePrefix:messagePrefix,req:req});
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }

      if (callback) return callback(null,auth);
      return;
    });//refreshC2dmAuth
  });//store.getC2dmAuth
};//getC2dmAuth


/**
 * as google c2dm has message size limit, http://code.google.com/intl/zh-CN/android/c2dm/index.html#limitations
 * here should be body size, TODO to be confirmed
 * @params - contains dataMessageObj
 *   here not support dataMessageStr as param for now, so all outer functions not support dataMessageStr for now
 * @returns - contains err or dataMessageStr
 */
Notification.prototype.getLimitedC2dmPostData = function (params){
  var self = this;
  var messagePrefix = 'in Notification.getLimitedC2dmPostData, ';
  var req = params.req;
  //replace assert.ok(..) to below check codes because the error thrown by assert can not be handled
  if (!params.dataMessageObj){
    var err = self.newError({errorKey:'needParameter',messageParams:['dataMessageObj'],messagePrefix:messagePrefix,req:req});
    return {err:err};
  }
  if (!params.registrationId){
    var err = self.newError({errorKey:'needParameter',messageParams:['registrationId'],messagePrefix:messagePrefix,req:req});
    return {err:err};
  }
  if (!params.collapseKey){
    var err = self.newError({errorKey:'needParameter',messageParams:['collapseKey'],messagePrefix:messagePrefix,req:req});
    return {err:err};
  }
  var dataMessageObj = params.dataMessageObj;
  var registrationId = params.registrationId;
  var collapseKey = params.collapseKey;

  var bodySizeLimit = config.config.c2dmMessageSizeLimit;

  var dataMessageStr,postDataObj,realPostBody,realPostBodyByteLen,exceedLength;
  var calculatePostDataSize = function(){
    dataMessageStr = JSON.stringify(dataMessageObj);
    postDataObj = {registration_id:registrationId, collapse_key:collapseKey, "data.message":dataMessageStr};
    realPostBody = handy.encodeFormData(postDataObj);
    realPostBodyByteLen = Buffer.byteLength(realPostBody);
    exceedLength = realPostBodyByteLen - bodySizeLimit;
    util.log("exceedLength="+exceedLength+", realPostBodyByteLen="+realPostBodyByteLen+", data="+realPostBody);
    if (dataMessageObj.message) util.log("dataMessageObj.message len="+dataMessageObj.message.length+",data="+dataMessageObj.message);
  };
  //here these length calculations are not good for Chinese text.
  //because 1 cn char take 1 length in a normal string, but when it is encoded, it take about 9 length.
  //so when dataMessageObj.text contains 50 cn chars, after encoded, realPostBody.length will be 943.
  //when dataMessageObj.text contains 500 cn chars, after encoded, realPostBody.length will be 4994, exceedLength=3970, this cause all cn text be cut off and it is flaw.
  var shortenField = function(dataObj,fieldName,exceedLength){
    assert.ok(dataObj);
    assert.ok(fieldName);
    var fldval = dataObj[fieldName];
    if (fldval != null){
      if (fldval.length > exceedLength){
        dataObj[fieldName] = fldval.substring(0,fldval.length-exceedLength);
      }else{
        dataObj[fieldName] = null;
      }
    }
  };//shortenField

  calculatePostDataSize();
  if (exceedLength <= 0) return {postDataObj:postDataObj};

  // exceedLength > 0, shorten some field
  var messageText1 = dataMessageObj.messageText;
  shortenField(dataMessageObj,"messageText",exceedLength);
  calculatePostDataSize();
  if (exceedLength <= 0){
    if (!dataMessageObj.messageText){//if this field is cut totally, let messageText length be 10 and try
      dataMessageObj.messageText = text1.substring(0,10);
      calculatePostDataSize();
      if (exceedLength <= 0) return {postDataObj:postDataObj};
      // exceedLength > 0, clear this field
      dataMessageObj.messageText = null;
      calculatePostDataSize();
    }else{
      return {postDataObj:postDataObj};
    }
  }

  // exceedLength > 0, shorten some field
  var message1 = dataMessageObj.message;
  shortenField(dataMessageObj,"message",exceedLength);
  calculatePostDataSize();
  if (exceedLength <= 0){
    if (!dataMessageObj.message){//if this field is cut totally, let text length be 10 and try
      dataMessageObj.message = message1.substring(0,10);
      calculatePostDataSize();
      if (exceedLength <= 0) return {postDataObj:postDataObj};
      // exceedLength > 0, clear this field
      dataMessageObj.message = null;
      calculatePostDataSize();
    }else{
      return {postDataObj:postDataObj};
    }
  }



  //still exceedLength > 0
  var err = self.newError({errorKey:'dataTooLongToSendToC2dm',messageParams:[realPostBody.length,realPostBody,postDataObj],messagePrefix:messagePrefix,req:req});
  return {err:err};
};//getLimitedC2dmPostData

/**
 * as a private function, just do send, all necessary data need to pass from params
 *
 * @param params - contains auth, registrationId, collapseKey, dataMessageStr, dataMessageObj
 * @param callback
 */
Notification.prototype.sendToGoogleC2dm = function (params,callback){
  var self = this;
  var req = params.req;
  var messagePrefix = 'in Notification.sendToGoogleC2dm, ';
  //logger.logDebug("sendToGoogleC2dm enter");

  var auth = params.auth;
  var registrationId = params.registrationId;
  var collapseKey = params.collapseKey;
  if (!collapseKey && dataMessageObj && dataMessageObj.type){
    collapseKey = dataMessageObj.type;
    if (dataMessageObj.userId) collapseKey += '_'+dataMessageObj.userId;
    //collapseKey += '_'+(new Date().getTime());
  }

  if (!collapseKey)  collapseKey = "foo";
  var dataMessageStr = params.dataMessageStr;
  var dataMessageObj = params.dataMessageObj;
//  if (!dataMessageStr && dataMessageObj)
//    dataMessageStr = JSON.stringify(params.dataMessageObj);

  //first check control flag
  if (self.needTemporaryDisableSendC2dmNotification){
    var err = self.newError({errorKey:'temporaryDisableSendC2dmNotification',messageParams:[],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
    return;
  }
  if (self.TemporaryDisabledDevices[registrationId]){
    var err = self.newError({errorKey:'temporaryDisableC2dmDevice',messageParams:[registrationId],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
    return;
  }

  //c2dm has send message size limit , check and shorten
  var limitPostDataInfo = self.getLimitedC2dmPostData({dataMessageStr:dataMessageStr, dataMessageObj:dataMessageObj, registrationId:registrationId, collapseKey:collapseKey});
  if (limitPostDataInfo.err){
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var postDataObj = limitPostDataInfo.postDataObj;
  //var postDataObj = {registration_id:registrationId, collapse_key:collapseKey, "data.message":dataMessageStr};
  logger.logDebug("in Notification.sendToGoogleC2dm, before send, postDataObj[data.message]="+util.inspect(postDataObj["data.message"],false,100));
  var postParams = {host:"android.apis.google.com",path:"/c2dm/send",
      //postDataAsStr:"registration_id="+regId+"&collapse_key=foo&data.message=dt"+dataMessageStr,
      postDataObj:postDataObj,
      headers:{
          //'Connection': 'keep-alive',//not found its usage
          Authorization:"GoogleLogin auth=" + auth
        }
    };

  if (!localConfig.finelyEnableFlag){
    if (callback) return callback(null,{id:'12345'});
    return;
  }

  handy.doHttpsPostByForm(postParams,function(err,resData){
    if (err){
      //the stack trace can not contain the function outside the callback function in this node version.
      err2 = self.newError({errorKey:'libraryError',messageParams:['notification'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }

    var sendRetIdData = self.parseGoogleC2dmSendResponse(resData);
    if (sendRetIdData.err){
      logger.logInfo("sendToGoogleC2dm failed, err="+util.inspect(sendRetIdData.err,false,100));
      if (callback) return callback(sendRetIdData.err);
      return;
    }

    logger.logInfo("sendToGoogleC2dm succeed, ret id="+util.inspect(sendRetIdData.id,false,100));
    if (callback) return callback(null,{id:sendRetIdData.id});
    return;
  });//doHttpsPostByForm
};//sendToGoogleC2dm



/**
 * half interface function for outside
 * get c2dmAuth first, then send c2dmNotification with the auth
 * should deal all returned errors here. such as, if send fail, see fail reason to refresh auth or clear registration
 * @param params - contains registrationId, collapseKey, dataMessageStr, dataMessageObj, userId
 *   userId only need when certain error occur and need clear the registrationId of the user
 * @param callback
 */
Notification.prototype.sendC2dmNotification = function (params,callback){
  var self = this;
  var req = params.req;
  var messagePrefix = 'in Notification.sendC2dmNotification, ';
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var userId = params.userId;

  self.getC2dmAuth({req:req},function(err,auth){
    if (err){
      var socketECONNREFUSEDErrorInfo = config.config.errors['socketECONNREFUSED'];//dealed
      var socketECONNRESETErrorInfo = config.config.errors['socketECONNRESET'];//dealed
      var c2dmAuthUnknownResponseErrorInfo = config.config.errors['c2dmAuthUnknownResponse'];//should inform someone, such as sendmail
      var c2dmAuthErrorBadAuthenticationErrorInfo = config.config.errors['c2dmAuthErrorBadAuthentication'];//should inform someone, such as sendmail
      var c2dmAuthErrorNotVerifiedErrorInfo = config.config.errors['c2dmAuthErrorNotVerified'];//should inform someone, such as sendmail
      var c2dmAuthErrorTermsNotAgreedErrorInfo = config.config.errors['c2dmAuthErrorTermsNotAgreed'];//should inform someone, such as sendmail
      var c2dmAuthErrorCaptchaRequiredErrorInfo = config.config.errors['c2dmAuthErrorCaptchaRequired'];//should inform someone, such as sendmail
      var c2dmAuthErrorUnknownErrorInfo = config.config.errors['c2dmAuthErrorUnknown'];//should inform someone, such as sendmail
      var c2dmAuthErrorAccountDeletedErrorInfo = config.config.errors['c2dmAuthErrorAccountDeleted'];//should inform someone, such as sendmail
      var c2dmAuthErrorAccountDisabledErrorInfo = config.config.errors['c2dmAuthErrorAccountDisabled'];//should inform someone, such as sendmail
      var c2dmAuthErrorServiceDisabledErrorInfo = config.config.errors['c2dmAuthErrorServiceDisabled'];//dealed
      var c2dmAuthErrorServiceUnavailableErrorInfo = config.config.errors['c2dmAuthErrorServiceUnavailable'];//dealed
      if (err.innerError && (socketECONNREFUSEDErrorInfo.code == err.innerError.code || socketECONNRESETErrorInfo.code == err.innerError.code)){
        self.temporaryDisableGetGoogleC2dmAuth({req:req});
      }else if(c2dmAuthErrorServiceDisabledErrorInfo.code == err.code || c2dmAuthErrorServiceUnavailableErrorInfo.code == err.code){
        self.temporaryDisableGetGoogleC2dmAuth({req:req});
      }

      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    //replace assert.ok(..) to below check codes because the error thrown by assert can not be returned to caller
    if(!(auth != null)){
      var err = self.newError({errorKey:'needVariableMeetCondition',messageParams:['auth != null'],messagePrefix:messagePrefix,req:req});
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }

    params.auth = auth;
    self.sendToGoogleC2dm(params, function(err,sendInfo){
      if (err){
        var socketECONNREFUSEDErrorInfo = config.config.errors['socketECONNREFUSED'];//dealed
        var socketECONNRESETErrorInfo = config.config.errors['socketECONNRESET'];//dealed
        var c2dmSendErrorQuotaExceededErrorInfo = config.config.errors['c2dmSendErrorQuotaExceeded'];//dealed
        var c2dmSendErrorDeviceQuotaExceededErrorInfo = config.config.errors['c2dmSendErrorDeviceQuotaExceeded'];//dealed
        var c2dmSendErrorMissingRegistrationErrorInfo = config.config.errors['c2dmSendErrorMissingRegistration'];
        var c2dmSendErrorInvalidRegistrationErrorInfo = config.config.errors['c2dmSendErrorInvalidRegistration'];//dealed
        var c2dmSendErrorMismatchSenderIdErrorInfo = config.config.errors['c2dmSendErrorMismatchSenderId'];
        var c2dmSendErrorNotRegisteredErrorInfo = config.config.errors['c2dmSendErrorNotRegistered'];//dealed
        var c2dmSendErrorMessageTooBigErrorInfo = config.config.errors['c2dmSendErrorMessageTooBig'];//should not occur here because message is shortened
        var c2dmSendErrorMissingCollapseKeyErrorInfo = config.config.errors['c2dmSendErrorMissingCollapseKey'];
        var c2dmSendError401UnauthorizedErrorInfo = config.config.errors['c2dmSendError401Unauthorized'];//dealed
        var c2dmSendError503ServerUnavailableErrorInfo = config.config.errors['c2dmSendError503ServerUnavailable'];//dealed
        var c2dmSendUnknownResponseErrorInfo = config.config.errors['c2dmSendUnknownResponse'];

        if (err.innerError && (socketECONNREFUSEDErrorInfo.code == err.innerError.code || socketECONNRESETErrorInfo.code == err.innerError.code)){
          self.temporaryDisableDevice({req:req,registrationId:params.registrationId, waitTime:self.spanInMsToDisabledDeviceForConnectError});
        }else if (c2dmSendError401UnauthorizedErrorInfo.code == err.code){
          //here do refresh auth as asynchronous call
          process.nextTick(function(){
            self.refreshC2dmAuth({req:req});
          });//nextTick
        }else if (c2dmSendErrorInvalidRegistrationErrorInfo.code == err.code || c2dmSendErrorNotRegisteredErrorInfo.code == err.code){
          //here clear user's registrationId as asynchronous call
          process.nextTick(function(){
            self.updateUserAppToken({req:req,userId:userId, appToken:null});
          });//nextTick
        }else if(c2dmSendErrorQuotaExceededErrorInfo.code == err.code || c2dmSendError503ServerUnavailableErrorInfo.code == err.code){
          self.temporaryDisableSendC2dmNotification({req:req});
        }else if(c2dmSendErrorDeviceQuotaExceededErrorInfo.code == err.code){
          self.temporaryDisableDevice({req:req,registrationId:params.registrationId});
        }

        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      if (callback) return callback(null,{id:sendInfo.id});
      return;
    });//sendToGoogleC2dm
  });//getC2dmAuth
};//sendC2dmNotification


/**
 * interface function for outside
 * @param params - contains userId or userIds, data
 * @param callback - is function(errorInfo,sendInfos).
 *   errInfo can be single error or error array. sendInfos can be empty array. errInfo and sendInfos can have value at same time.
 */
Notification.prototype.sendNotification = function (params,callback){
  var self = this;
  var req = params.req;
  var messagePrefix = 'in Notification.sendNotification, ';
  logger.logDebug("notification sendNotification entered, params="+util.inspect(params,false,100));
  if (!(params.userId || params.userIds)){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId or userIds'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }

  var userId = params.userId;
  var userIds = params.userIds;
  if(!userIds)  userIds = [];
  if(userId) userIds.push(userId);
  var data = params.data;
  self.store.getUserAppTokens({req:req,userIds:userIds},function(err,appTokens){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }

    var validAppTokensWithUser  = [], errors = [];
    for(var i=0; i<appTokens.length; i++){
      var appToken = appTokens[i];
      var userId = userIds[i];
      if (appToken){
        validAppTokensWithUser.push({userId:userId, appToken:appToken});
      }else{
        var err = self.newError({errorKey:'notFindC2dmRegistrationIdOrApnsDeviceToken',messageParams:[userId],messagePrefix:messagePrefix,req:req});
        errors.push(err);
      }
    }//for
    if (validAppTokensWithUser.length == 0){
      var retErrors=null;
      if(errors && errors.length>0) retErrors = errors;
      if(callback) return callback(retErrors);
      return;
    }

    var finishCount = 0;
    var sendInfos = [];
    //its function is to let callback return when all send return
    function finishedOneSend(err,sendInfo){
      finishCount ++;
      if(err)  errors.push(err);
      if(sendInfo)  sendInfos.push(sendInfo);
      if (finishCount == validAppTokensWithUser.length){
        if (sendInfos.length > 0){
          logger.logDebug("Notification.sendNotification returned sendInfos="+util.inspect(sendInfos,false,100));
        }
        if (errors.length > 0){
          self.handleError({errors:errors});
        }
        var retErrors=null, retSendInfos=null;
        if(errors && errors.length>0) retErrors = errors;
        if(sendInfos && sendInfos.length>0) retSendInfos = sendInfos;
        if(callback) return callback(retErrors,retSendInfos);
        return;
      }
    };//finishedOneSend
    var apnsDeviceTokenHexLength = config.config.apnsDeviceTokenLength * 2;
    for(var i=0; i<validAppTokensWithUser.length; i++){
      var validUserAppToken = validAppTokensWithUser[i];
      var appToken = validUserAppToken.appToken;
      var userId = validUserAppToken.userId;

      function SendOneTime(params){
        var userId = params.userId;
        var appToken = params.appToken;
        if (appToken.length == apnsDeviceTokenHexLength){
          var deviceToken = appToken;
          var paramsSend = {req:req,userId:userId,deviceToken:deviceToken,dataObj:data};
          self.sendApnsNotification(paramsSend, function(err){
            paramsSend.notifyType = 'apns';
            if (err){
              err.environmentVar = paramsSend;
            }else{
              var sendInfo = {};
              sendInfo.environmentVar = paramsSend;
            }
            finishedOneSend(err,sendInfo);
            return;
          });//sendApnsNotification
        }else{
          var registrationId = appToken;
          var paramsSend = {req:req,userId:userId,registrationId:registrationId,dataMessageObj:data};
          self.sendC2dmNotification(paramsSend, function(err,sendInfo){
            paramsSend.notifyType = 'c2dm';
            if (err){
              err.environmentVar = paramsSend;
            }else{
              if (!sendInfo) sendInfo = {};
              sendInfo.environmentVar = paramsSend;
            }
            finishedOneSend(err,sendInfo);
            return;
          });//sendC2dmNotification
        }
      };//SendOneTime

      SendOneTime({appToken:appToken,userId:userId});
    }//for
    return;
  });//store.getUserAppTokens
};//sendNotification


/**
 * interface function for outside
 * @param params - contains userIds, data
 * @param callback - is function(err,sendInfo).
 *   sendInfo contain failUserInfos, successUserInfos.
 *     each item of failUserInfos contains userId, err.
 *     each item of successUserInfos contains userId, other to be defined.
 *
 */
Notification.prototype.sendNotification2 = function (params,callback){
  var self = this;
  var req = params.req;
  var messagePrefix = 'in Notification.sendNotification2, ';
  //logger.logDebug("notification sendNotification entered, params="+util.inspect(params,false,100));
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  var userIds = params.userIds;
  if (!params.userIds || userIds.length == 0){
    return callback(null,null);
  }

  var data = params.data;
  self.store.getUserAppTokens({req:req,userIds:userIds},function(err,appTokens){
    if (err) return callback(err);
    var failUserInfos = [], successUserInfos = [];

    var validAppTokensWithUser  = [], errors = [];
    for(var i=0; i<appTokens.length; i++){
      var appToken = appTokens[i];
      var userId = userIds[i];
      if (appToken){
        validAppTokensWithUser.push({userId:userId, appToken:appToken});
      }else{
        var err = self.newError({errorKey:'notFindC2dmRegistrationIdOrApnsDeviceToken',messageParams:[userId],messagePrefix:messagePrefix,req:req});
        var failUserInfo = {userId:userId, err:err};
        failUserInfos.push(failUserInfo);
      }
    }//for
    if (validAppTokensWithUser.length == 0){
      return callback(null,{failUserInfos:failUserInfos});
    }

    var finishCount = 0;
    //its function is to let callback return when all send return
    function finishedOneSend(err,oneSendParams){
      finishCount ++;
      var userId = oneSendParams.userId;
      if(err){
        var failUserInfo = {userId:userId, err:err};
        failUserInfos.push(failUserInfo);
      }else{
        var successUserInfo = {userId:userId};
        successUserInfos.push(successUserInfo);
      }
      if (finishCount == validAppTokensWithUser.length){
        var sendInfo = {};
        if (failUserInfos.length > 0) sendInfo.failUserInfos = failUserInfos;
        if (successUserInfos.length > 0) sendInfo.successUserInfos = successUserInfos;
        return callback(null,sendInfo);
      }
    };//finishedOneSend

    var apnsDeviceTokenHexLength = config.config.apnsDeviceTokenLength * 2;
    for(var i=0; i<validAppTokensWithUser.length; i++){
      var validUserAppToken = validAppTokensWithUser[i];
      var appToken = validUserAppToken.appToken;
      var userId = validUserAppToken.userId;

      function SendOneTime(params){
        var userId = params.userId;
        var appToken = params.appToken;
        if (appToken.length == apnsDeviceTokenHexLength){
          var deviceToken = appToken;
          var paramsSend = {req:req,userId:userId,deviceToken:deviceToken,dataObj:data};
          self.sendApnsNotification(paramsSend, function(err){
            paramsSend.notifyType = 'apns';
            if (err){
              err.environmentVar = paramsSend;
            }
            return finishedOneSend(err,params);
          });//sendApnsNotification
        }else{
          var registrationId = appToken;
          var paramsSend = {req:req,userId:userId,registrationId:registrationId,dataMessageObj:data};
          self.sendC2dmNotification(paramsSend, function(err,sendInfo){
            paramsSend.notifyType = 'c2dm';
            if (err){
              err.environmentVar = paramsSend;
            }
            return finishedOneSend(err,params);
          });//sendC2dmNotification
        }
      };//SendOneTime

      SendOneTime({appToken:appToken,userId:userId});
    }//for
    return;
  });//store.getUserAppTokens
};//sendNotification2

/**
 * interface function for outside
 * @param params - contains userIds, dateId, senderId, senderName
 * @param callback - is function(errorInfo,sendInfos).
 *   errInfo can be single error or error array. sendInfos can be empty array. errInfo and sendInfos can have value at same time.
 */
Notification.prototype.sendNotificationForSendDate = function (params,callback){
  var messagePrefix = 'in Notification.sendNotificationForSendDate, ';
  var self = this;
  var req = params.req;
  logger.logDebug("Notification.sendNotificationForSendDate entered, params="+util.inspect(params,false,100));
  if (!localConfig.bigEnableFlag){
    if (callback) return callback(null);
    return;
  }

  if (!params.userIds){
    var err = self.newError({errorKey:'needParameter',messageParams:['userIds'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.senderId){
    var err = self.newError({errorKey:'needParameter',messageParams:['senderId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.senderName){
    var err = self.newError({errorKey:'needParameter',messageParams:['senderName'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var userIds = params.userIds;
  var dateId = params.dateId;
  var senderId = params.senderId;
  var senderName = params.senderName;
  var type = "sendDate";
  var messageInfo = self.formatNotificationMessage({type:type,userName:senderName});
  if (messageInfo.err){
    if (callback) return callback(messageInfo.err);
    else return self.handleError({err:messageInfo.err});
  }
  var message = messageInfo.message;
  self.sendNotification({req:req,userIds:userIds,data:{type:type,dateId:dateId, userId:senderId,userName:senderName, message:message}},callback);
};//sendNotificationForSendDate


/**
 * interface function for outside
 * @param params - contains targetUserId, dateId, senderName, messageId, messageText
 *   dateSenderId, dateResponderId,
 *     when doubleConfirmed be true, dateSenderId should not be in the notification;
 *     when doubleConfirmed be false, dateSenderId should be in the notification and doubleConfirmed should not.
 *
 * @param callback - is function(err,sendInfo)
 *
 */
Notification.prototype.sendNotificationForSendMessage = function (params,callback){
  var messagePrefix = 'in Notification.sendNotificationForSendMessage, ';
  var self = this;
  var req = params.req;
  if (!localConfig.bigEnableFlag){
    if (callback) return callback(null);
    return;
  }

  if (!params.targetUserId){
    var err = self.newError({errorKey:'needParameter',messageParams:['targetUserId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.senderId){
    var err = self.newError({errorKey:'needParameter',messageParams:['senderId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.senderName){
    var err = self.newError({errorKey:'needParameter',messageParams:['senderName'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.messageId){
    var err = self.newError({errorKey:'needParameter',messageParams:['messageId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.createTime){
    var err = self.newError({errorKey:'needParameter',messageParams:['createTime'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.messageText){
    var err = self.newError({errorKey:'needParameter',messageParams:['messageText'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.dateSenderId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateSenderId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var targetUserId = params.targetUserId;
  var dateId = params.dateId;
  var senderId = params.senderId;
  var senderName = params.senderName;
  var messageId = params.messageId;
  var createTime = params.createTime;
  var messageText = params.messageText;
  var dateSenderId = params.dateSenderId;
  var dateResponderId = params.dateResponderId;
  //var doubleConfirmed = params.doubleConfirmed;
  var type = "sendMessage";
  var messageInfo = self.formatNotificationMessage({req:req,type:type,userName:senderName});
  if (messageInfo.err){
    if (callback) return callback(messageInfo.err);
    else return self.handleError({err:messageInfo.err});
  }
  var message = messageInfo.message;
  var data = {type:type,dateId:dateId,userId:senderId,userName:senderName,
      messageId:messageId,createTime:createTime,messageText:messageText,message:message,
      dateSenderId:dateSenderId};
//  if (doubleConfirmed) data.doubleConfirmed = doubleConfirmed;
//  else data.dateSenderId = dateSenderId;
  if (dateResponderId) data.dateResponderId = dateResponderId;
  self.sendNotification({req:req,userIds:[targetUserId],data:data},function(errorInfo,sendInfos){
    //because here only send 1 user, so if have errorInfo,  sendInfos must be empty
    if (errorInfo){
      var err = null;
      if (errorInfo instanceof Array){
        assert.ok(errorInfo.length == 1);
        err = errorInfo[0];
      }else{
        err = errorInfo;
      }
      if (callback) return callback(err);
      return;
    }
    var sendInfo = null;
    if (sendInfos && sendInfos.length>0){
      assert.ok(sendInfos.length == 1);
      sendInfo = sendInfos[0];
    }
    if (callback) return callback(null,sendInfo);
    return;
  });//sendNotification
};//sendNotificationForSendMessage



/**
 * interface function for outside
 * @param params - contains targetUserId, dateId, senderId, senderName, messageText,
 *   dateSenderId,
 *     when doubleConfirmed be true, dateSenderId should not be in the notification;
 *     when doubleConfirmed be false, dateSenderId should be in the notification and doubleConfirmed should not.
 *     messageText is system message text, this message is generated when confirm date action done
 * @param callback - is function(err,sendInfo)
 *
 */
Notification.prototype.sendNotificationForConfirmDate = function (params,callback){
  var messagePrefix = 'in Notification.sendNotificationForConfirmDate, ';
  var self = this;
  var req = params.req;
  if (!localConfig.bigEnableFlag){
    if (callback) return callback(null);
    return;
  }

  if (!params.targetUserId){
    var err = self.newError({errorKey:'needParameter',messageParams:['targetUserId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.senderId){
    var err = self.newError({errorKey:'needParameter',messageParams:['senderId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.senderName){
    var err = self.newError({errorKey:'needParameter',messageParams:['senderName'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.messageText){
    var err = self.newError({errorKey:'needParameter',messageParams:['messageText'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.messageId){
    var err = self.newError({errorKey:'needParameter',messageParams:['messageId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.createTime){
    var err = self.newError({errorKey:'needParameter',messageParams:['createTime'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.dateSenderId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateSenderId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var targetUserId = params.targetUserId;
  var dateId = params.dateId;
  var senderId = params.senderId;
  var senderName = params.senderName;
  var messageText = params.messageText;
  var messageId = params.messageId;
  var createTime = params.createTime;
  var dateSenderId = params.dateSenderId;
  //var doubleConfirmed = params.doubleConfirmed;
  var type = "confirmDate";
  var messageInfo = self.formatNotificationMessage({req:req,type:type,messageText:messageText});
  if (messageInfo.err){
    if (callback) return callback(messageInfo.err);
    else return self.handleError({err:messageInfo.err});
  }
  var message = messageInfo.message;
  var data = {type:type,dateId:dateId,userId:senderId,userName:senderName,message:message,messageId:messageId,createTime:createTime,
          dateSenderId:dateSenderId};
//  if (doubleConfirmed) data.doubleConfirmed = doubleConfirmed;
//  else data.dateSenderId = dateSenderId;
  self.sendNotification({req:req,userIds:[targetUserId],data:data},function(errorInfo,sendInfos){
    //because here only send 1 user, so if have errorInfo,  sendInfos must be empty
    if (errorInfo){
      var err = null;
      if (errorInfo instanceof Array){
        assert.ok(errorInfo.length == 1);
        err = errorInfo[0];
      }else{
        err = errorInfo;
      }
      if (callback) return callback(err);
      return;
    }
    var sendInfo = null;
    if (sendInfos && sendInfos.length>0){
      assert.ok(sendInfos.length == 1);
      sendInfo = sendInfos[0];
    }
    if (callback) return callback(null,sendInfo);
    return;
  });//sendNotification
};//sendNotificationForConfirmDate


/**
 * interface function for outside
 * @param params - contains targetUserId, dateId, senderId, senderName, messageText,
 *   dateSenderId, doubleConfirmed,
 *     when doubleConfirmed be true, dateSenderId should not be in the notification;
 *     when doubleConfirmed be false, dateSenderId should be in the notification and doubleConfirmed should not.
 *     messageText is system message text, this message is generated when confirm date action done
 * @param callback - is function(err,sendInfo)
 *
 */
Notification.prototype.sendNotificationForCancelDate = function (params,callback){
  var messagePrefix = 'in Notification.sendNotificationForCancelDate, ';
  var self = this;
  var req = params.req;
  if (!localConfig.bigEnableFlag){
    if (callback) return callback(null);
    return;
  }

  if (!params.targetUserId){
    var err = self.newError({errorKey:'needParameter',messageParams:['targetUserId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.senderId){
    var err = self.newError({errorKey:'needParameter',messageParams:['senderId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.senderName){
    var err = self.newError({errorKey:'needParameter',messageParams:['senderName'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.messageText){
    var err = self.newError({errorKey:'needParameter',messageParams:['messageText'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.messageId){
    var err = self.newError({errorKey:'needParameter',messageParams:['messageId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.createTime){
    var err = self.newError({errorKey:'needParameter',messageParams:['createTime'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var targetUserId = params.targetUserId;
  var dateId = params.dateId;
  var senderId = params.senderId;
  var senderName = params.senderName;
  var messageText = params.messageText;
  var messageId = params.messageId;
  var createTime = params.createTime;
  var type = "cancelDate";
  var messageInfo = self.formatNotificationMessage({req:req,type:type,messageText:messageText});
  if (messageInfo.err){
    if (callback) return callback(messageInfo.err);
    else return self.handleError({err:messageInfo.err});
  }
  var message = messageInfo.message;
  var data = {type:type,dateId:dateId,userId:senderId,userName:senderName,message:message,messageId:messageId,createTime:createTime};
  self.sendNotification({req:req,userIds:[targetUserId],data:data},function(errorInfo,sendInfos){
    //because here only send 1 user, so if have errorInfo,  sendInfos must be empty
    if (errorInfo){
      var err = null;
      if (errorInfo instanceof Array){
        assert.ok(errorInfo.length == 1);
        err = errorInfo[0];
      }else{
        err = errorInfo;
      }
      if (callback) return callback(err);
      return;
    }
    var sendInfo = null;
    if (sendInfos && sendInfos.length>0){
      assert.ok(sendInfos.length == 1);
      sendInfo = sendInfos[0];
    }
    if (callback) return callback(null,sendInfo);
    return;
  });//sendNotification
};//sendNotificationForCancelDate




/**
 * interface function for outside
 * @param params - contains dates
 * @param callback - is function(err, notifyInfo).
 *   notifyInfo contains failDates,successDates
 *     each item of failDates contain date(dateObj), err, senderErr, responderErr.
 *     each item of successDates contain date(dateObj).
 *
 */
Notification.prototype.sendNotificationForNotifyDaters = function (params,callback){
  var messagePrefix = 'in Notification.sendNotificationForNotifyDaters, ';
  var self = this;
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!localConfig.bigEnableFlag){
    return callback(null);
  }
  if (!params.dates){
    var err = self.newError({errorKey:'needParameter',messageParams:['dates'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var dates = params.dates;
  if(dates.length == 0){
    return callback(null,null);
  }
  var type = "notifyDateInAdvance";
//  var messageInfo = self.formatNotificationMessage({req:req,type:type});
//  if (messageInfo.err){
//    return callback(messageInfo.err);
//  }
//  var message = messageInfo.message;
  var failDates = [], successDates = [];
  var finishedCallbackCount = 0;

  function sendForOneDate(params){
    var dateObj = params.dateObj;
    var dateId = dateObj.dateId;
    var dateSenderId = dateObj.senderId;
    var dateResponderId = dateObj.finalCandidateId;
    self.store.getUsers({req:req,userIds:[dateSenderId,dateResponderId],userFields:['userId','name']},function(err,users){
      if (err){
        var failDate = {date:dateObj, err:err};
        failDates.push(failDate);
        return;
      }
      var sender = users[0];
      var responder = users[1];
      var dateSenderName = sender.name;
      var dateResponderName = responder.name;
      var messageInfoToSender = self.formatNotificationMessage({req:req,type:type,userName:dateSenderName,targetUserName:dateResponderName});
      if (messageInfoToSender.err){
        var failDate = {date:dateObj, err:messageInfoToSender.err};
        failDates.push(failDate);
        return;
      }
      var messageInfoToResponder = self.formatNotificationMessage({req:req,type:type,userName:dateResponderName,targetUserName:dateSenderName});
      if (messageInfoToResponder.err){
        var failDate = {date:dateObj, err:messageInfoToResponder.err};
        failDates.push(failDate);
        return;
      }
      var messageToSender = messageInfoToSender.message;
      var messageToResponder = messageInfoToResponder.message;
      self.sendNotification({req:req,userId:dateSenderId,data:{type:type,message:messageToSender,dateId:dateId}}, function(errorInfoOfSender,sendInfosOfSender){
        self.sendNotification({req:req,userId:dateResponderId,data:{type:type,message:messageToResponder,dateId:dateId}}, function(errorInfoOfResponder,sendInfosOfResponder){
          if (errorInfoOfSender || errorInfoOfResponder){
            var failDate = {date:dateObj};
            if (errorInfoOfSender){
              failDate.senderErr = errorInfoOfSender;
            }
            if (errorInfoOfResponder){
              failDate.responderErr = errorInfoOfResponder;
            }
            failDates.push(failDate);
          }else{
            var successDate = {date:dateObj};
            successDates.push(successDate);
          }
          finishedCallbackCount ++;
          if (finishedCallbackCount == dates.length){
            var notifyInfo = {};
            if (failDates.length > 0) notifyInfo.failDates = failDates;
            if (successDates.length > 0) notifyInfo.successDates = successDates;
            return callback(null,notifyInfo);
          }else{
            return;
          }
        });//sendNotification
      });//sendNotification
    });//store.getUsers
  };//sendForOneDate

  for(var i=0; i<dates.length; i++){
    var dateObj = dates[i];
    sendForOneDate({dateObj:dateObj});
  }//for
};//sendNotificationForNotifyDaters




/**
 * interface function for outside
 * @param params - contains userIds, messageText
 *   messageText is system message text, this message is generated when confirm date action done
 * @param callback - is function(err,sendInfo)
 *   sendInfo contain failUserInfos, successUserInfos.
 *     each item of failUserInfos contains userId, err.
 *     each item of successUserInfos contains userId, other to be defined.
 *
 */
Notification.prototype.sendNotificationForSystemBroadMessage = function (params,callback){
  var messagePrefix = 'in Notification.sendNotificationForSystemBroadMessage, ';
  var self = this;
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!localConfig.bigEnableFlag){
    return callback(null);
  }
  if (!params.messageText){
    var err = self.newError({errorKey:'needParameter',messageParams:['messageText'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var userIds = params.userIds;
  if (!userIds || userIds.length==0)
    return callback(null,null);
  var messageText = params.messageText;
  var type = "systemBroadMessage";
  var messageInfo = self.formatNotificationMessage({req:req,type:type,messageText:messageText});
  if (messageInfo.err){
    return callback(messageInfo.err);
  }
  var message = messageInfo.message;
  self.sendNotification2({req:req,userIds:userIds,data:{type:type,message:message}},function(err,sendInfo){
    if (err)  return callback(err);
    return callback(null,sendInfo);
  });//sendNotification
};//sendNotificationForSystemBroadMessage


/**
 * make a connection to Apple Push Notification Service
 * @param callback - is a function(err,conn)
 * @returns
 */
Notification.prototype.connectApns = function(params,callback){
  var messagePrefix = 'in Notification.connectApns, ';
  var self = this;
  var req = params.req;

  if (!localConfig.finelyEnableFlag){
    if (callback) return callback(null,{field:'mockConnection'});
    return;
  }

  if (self.apnsConnection != null){
    if (self.apnsConnection.writable){
      if (callback) return callback(null,self.apnsConnection);
      return;
    }else{
      self.apnsConnection.destroy();//try-catch......
      self.apnsConnection = null;
    }
  }

  var specialEnvConfig = config.getEnvConfig();
  var applePushNotificationServiceHost = specialEnvConfig.applePushNotificationServiceHost;
  var apnsCertFilePath = specialEnvConfig.apnsCertFilePath;

  var applePushNotificationServicePort = config.config.applePushNotificationServicePort;
  var apnsSslPassphrase = config.config.apnsSslPassphrase;

  var apnsCertFileContent;
  try{
    apnsCertFileContent = fs.readFileSync(apnsCertFilePath);
  }catch(err){
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }

  var options = {
      passphrase: apnsSslPassphrase,
      key: apnsCertFileContent,
      cert: apnsCertFileContent
  };

  var connLocal = null;
  try{
    connLocal = tls.connect(applePushNotificationServicePort,applePushNotificationServiceHost, options, function() {
      self.apnsConnection = connLocal;
      logger.logDebug("Apple Push Notification Service connection.authorized="+connLocal.authorized+", authorizationError="+connLocal.authorizationError);

      if (callback){
        connLocal.alreadyCallback = true;
        return callback(null,connLocal);
      }
      return;
    });//connect
  }catch(err){
    var err2 = self.newError({errorKey:'libraryError',messageParams:['notification'],messagePrefix:messagePrefix,req:req,innerError:err});
    if (callback) return callback(err2);
    else return self.handleError({err:err2});
  }//catch

  //can not receive data or error event when fail to send push, do not know why
  connLocal.on("data", function (data) {
    logger.logDebug('tls connection on data event enter, data=' + data);
  });// on data
  connLocal.on("error", function (err) {//need to study if the callback will return err
    logger.logDebug('tls connection on error event enter, err=' + util.inspect(err,false,100));
    var err2;
    if (err) err2 = self.newError({errorKey:'libraryError',messageParams:['notification'],messagePrefix:messagePrefix,req:req,innerError:err});
    if (!connLocal.alreadyCallback){
      if (callback){
        connLocal.alreadyCallback = true;
        return callback(err2);
      }
    }
    return self.handleError({err:err2});
  });// on error

  //it can occur that connect, end event, close event
  connLocal.on('end', function() {
    logger.logDebug('tls connection on end event enter');
    if (self.apnsConnection != null) self.apnsConnection = null;

    var err = self.newError({errorKey:'apnsConnectionEnd',messageParams:[],messagePrefix:messagePrefix,req:req});
    if (!connLocal.alreadyCallback){
      if (callback){
        connLocal.alreadyCallback = true;
        return callback(err);
      }
    }
    return self.handleError({err:err});
  });// on end
  connLocal.on('close', function() {
    logger.logDebug('tls connection on close event enter');
    if (self.apnsConnection != null) self.apnsConnection = null;
    var err = self.newError({errorKey:'apnsConnectionClose',messageParams:[],messagePrefix:messagePrefix,req:req});
    if (!connLocal.alreadyCallback){
      if (callback){
        connLocal.alreadyCallback = true;
        return callback(err);
      }
    }
    return self.handleError({err:err});
  });//on close
};//connectApns

/**
 * convert dataObj to payloadObj and shorten some fields when exceed limit
 * @param params - contains dataObj
 *   dataObj is almost same as sio-push message object, besides it have event field
 * @returns - payloadObj
 */
Notification.prototype.buildApnsPayloadData = function (params){
  var messagePrefix = 'in Notification.buildApnsPayloadData, ';
  var self = this;
  var req = params.req;
  if (!params.dataObj){
    var err = self.newError({errorKey:'needParameter',messageParams:['dataObj'],messagePrefix:messagePrefix,req:req});
    return {err:err};
  }
  var dataObj = params.dataObj;

  var apnsPayloadLengthLimit = config.config.apnsPayloadLengthLimit; //in bytes

//  var obj = {aps:{alert:"",badge:1,sound:'default'},data:{type:"systemBroadMessage"}};
//  var jsonStr = JSON.stringify(obj);
//  var byteLen = Buffer.byteLength(jsonStr);
//  console.log("jsonStr.len="+jsonStr.length+", byteLen="+byteLen+", jsonStr="+jsonStr);//85 , 85
//  //(256-85)/3 = 57
//  obj = {aps:{alert:"一二三四五六七八九十二二三四五六七八九十三二三四五六七八九十四二三四五六七八九十五二三四五六七八九十六二三四五六七",badge:1,sound:'default'},data:{type:"systemBroadMessage"}};
//  jsonStr = JSON.stringify(obj);
//  byteLen = Buffer.byteLength(jsonStr);
//  console.log("jsonStr.len="+jsonStr.length+", byteLen="+byteLen+", jsonStr="+jsonStr);//142, 256

  function calculateJsonBufferLength(obj){
    var jsonStr = JSON.stringify(obj);
    var byteLen = Buffer.byteLength(jsonStr);
    return byteLen;
  }

  function getShortenedPayload(dataObj,shortenLevel){
    var payloadObj;

    var alertText = null; //dataObj.message is used for aps.alert
    var payloadCustomObjWithoutMessage = tool.cloneObject(dataObj);
    if (payloadCustomObjWithoutMessage.message){
      alertText = payloadCustomObjWithoutMessage.message;
      delete payloadCustomObjWithoutMessage.message;
    }
    alertText += '';

    if (shortenLevel==0){//no short
      payloadObj = {aps:{alert:alertText,badge:1,sound:'default'},data:payloadCustomObjWithoutMessage};
      return payloadObj;
    }

    var payloadCustomObjWithoutMessageText = tool.cloneObject(payloadCustomObjWithoutMessage);
    var messageText = null;
    if (payloadCustomObjWithoutMessageText.messageText){
      messageText = payloadCustomObjWithoutMessageText.messageText;
      delete payloadCustomObjWithoutMessageText.messageText;
    }
    if (!messageText){
      if (shortenLevel==1){//mainly to short text to 100
        var alertText = alertText.substring(0,100)+'...';
        payloadObj = {aps:{alert:alertText,badge:1,sound:'default'},data:payloadCustomObjWithoutMessageText};
      }else if (shortenLevel==2){//mainly to short text to 40
        var alertText = alertText.substring(0,40)+'...';
        payloadObj = {aps:{alert:alertText,badge:1,sound:'default'},data:payloadCustomObjWithoutMessageText};
      }else if (shortenLevel==3){//mainly to short text to 20
        var alertText = alertText.substring(0,20)+'...';
        payloadObj = {aps:{alert:alertText,badge:1,sound:'default'},data:payloadCustomObjWithoutMessageText};
      }else if (shortenLevel==4){//mainly to short text to 10
        var alertText = alertText.substring(0,10)+'...';
        payloadObj = {aps:{alert:alertText,badge:1,sound:'default'},data:payloadCustomObjWithoutMessageText};
      }else if (shortenLevel==5){//mainly to short text to 10
        var alertText = alertText.substring(0,10)+'...';
        payloadObj = {aps:{alert:alertText,badge:1,sound:'default'}};
      }else{//shortenLevel>=6
        payloadObj = {aps:{alert:dataObj.type,badge:1,sound:'default'}};
      }
    }else{
      if (shortenLevel==1){//mainly to short text to 10
        var msgText = messageText.substring(0,100)+'...';
        payloadCustomObjWithoutMessageText.messageText = msgText;
        payloadObj = {aps:{alert:alertText,badge:1,sound:'default'},data:payloadCustomObjWithoutMessageText};
      }else if (shortenLevel==2){//mainly to short text to 10
        var msgText = messageText.substring(0,40)+'...';
        payloadCustomObjWithoutMessageText.messageText = msgText;
        payloadObj = {aps:{alert:alertText,badge:1,sound:'default'},data:payloadCustomObjWithoutMessageText};
      }else if (shortenLevel==3){//mainly to short text to 10
        var msgText = messageText.substring(0,20)+'...';
        payloadCustomObjWithoutMessageText.messageText = msgText;
        payloadObj = {aps:{alert:alertText,badge:1,sound:'default'},data:payloadCustomObjWithoutMessageText};
      }else if (shortenLevel==4){//mainly to short text to 10
        var msgText = messageText.substring(0,10)+'...';
        payloadCustomObjWithoutMessageText.messageText = msgText;
        payloadObj = {aps:{alert:alertText,badge:1,sound:'default'},data:payloadCustomObjWithoutMessageText};
      }else if (shortenLevel==5){//mainly to short text to 10
        payloadObj = {aps:{alert:alertText,badge:1,sound:'default'},data:payloadCustomObjWithoutMessageText};
      }else if (shortenLevel==6){//mainly to short text to 10
        payloadObj = {aps:{alert:alertText,badge:1,sound:'default'}};
      }else{//shortenLevel>=7
        payloadObj = {aps:{alert:dataObj.type,badge:1,sound:'default'}};
      }
    }
    return payloadObj;
  }//getShortenedPayload

  for(var i=0; i<=7; i++){
    var payloadObj = getShortenedPayload(dataObj,i);
    if (payloadObj.data == null){
      return payloadObj;
    }
    var payloadJsonBufferLength = calculateJsonBufferLength(payloadObj);
    if (payloadJsonBufferLength <= apnsPayloadLengthLimit){
      return payloadObj;
    }
  }//for
  return {aps:{alert:dataObj.type,badge:1,sound:'default'}};
};//buildApnsPayloadData

/**
 *
 * @param params - contains payloadData, deviceToken
 * @returns - contains err, postBuffer
 */
Notification.prototype.buildApnsPostBuffer = function (params){
  var messagePrefix = 'in Notification.buildApnsPostBuffer, ';
  var self = this;
  var req = params.req;
  var apnsPayloadLengthLimit = config.config.apnsPayloadLengthLimit; //in bytes
  var apnsDeviceTokenLength = config.config.apnsDeviceTokenLength;

  var notificationCmd = 1;
  var notificationIdentifier = 1234; // 1; //4 bytes. Identifier — An arbitrary value that identifies this notification. This same identifier is returned in a error-response packet if APNs cannot interpret a notification.
  var notificationExpiry = 0; //4 bytes. Expiry — A fixed UNIX epoch date expressed in seconds (UTC) that identifies when the notification is no longer valid and can be discarded. The expiry value should be in network order (big endian). If the expiry value is positive, APNs tries to deliver the notification at least once. You can specify zero or a value less than zero to request that APNs not store the notification at all.

  if (!params.payloadData){
    var err = self.newError({errorKey:'needParameter',messageParams:['payloadData'],messagePrefix:messagePrefix,req:req});
    return {err:err};
  }
  if (!params.deviceToken){
    var err = self.newError({errorKey:'needParameter',messageParams:['deviceToken'],messagePrefix:messagePrefix,req:req});
    return {err:err};
  }
  var payloadData = params.payloadData;
  var deviceToken = params.deviceToken;
  deviceToken = deviceToken.replace(' ','');
  var deviceTokenBuffer = new Buffer(deviceToken,'hex');
  if (deviceTokenBuffer.length != apnsDeviceTokenLength){
    var err = self.newError({errorKey:'apnsInvalidLengthDeviceToken',messageParams:[deviceToken],messagePrefix:messagePrefix,req:req});
    return {err:err};
  }

  if(!payloadData) return null;
  var payloadJson = JSON.stringify(payloadData);
  var payloadJsonBuffer = new Buffer(payloadJson);
  if (payloadJsonBuffer.length > apnsPayloadLengthLimit){
    var err = self.newError({errorKey:'apnsPayLoadExceedLimit',messageParams:[payloadJsonBuffer.length,payloadJson],messagePrefix:messagePrefix,req:req});
    return {err:err};
  }
  var postLen = 1+4+4+2+apnsDeviceTokenLength+2+payloadJsonBuffer.length;
  var postBuffer = new Buffer(postLen);
  var offset = 0;
  postBuffer.writeUInt8(notificationCmd,offset);
  offset = offset + 1;
  postBuffer.writeUInt32BE(notificationIdentifier,offset);
  offset = offset + 4;
  postBuffer.writeUInt32BE(notificationExpiry,offset);
  offset = offset + 4;
  postBuffer.writeUInt16BE(apnsDeviceTokenLength,offset);
  offset = offset + 2;
  deviceTokenBuffer.copy(postBuffer,offset,0,apnsDeviceTokenLength);
  offset = offset + apnsDeviceTokenLength;
  postBuffer.writeUInt16BE(payloadJsonBuffer.length,offset);
  offset = offset + 2;
  payloadJsonBuffer.copy(postBuffer,offset,0);

  return {postBuffer:postBuffer};
};//buildApnsPostBuffer

/**
 * as a private function, just do send, all necessary data need to pass from params
 * notice: after the callback successfully returned, the connection should be kept for several seconds,
 * or else, the Apple Push Notification Service can not receive the send data and your device can not receive the push.
 * @param params - contains payloadData, deviceToken
 *   the format of payloadData need to refer to https://developer.apple.com/library/ios/#documentation/NetworkingInternet/Conceptual/RemoteNotificationsPG/ApplePushService/ApplePushService.html,
 *   for example, {aps:{alert:'message1',badge:1,sound:'default'}};
 * @param callback - is a function(err)
 *
 */
Notification.prototype.sendToApns = function (params,callback){
  var messagePrefix = 'in Notification.sendToApns, ';
  var self = this;
  var req = params.req;
  if (!params.payloadData){
    var err = self.newError({errorKey:'needParameter',messageParams:['payloadData'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.deviceToken){
    var err = self.newError({errorKey:'needParameter',messageParams:['deviceToken'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var payloadData = params.payloadData;
  var deviceToken = params.deviceToken;

  self.connectApns({},function(err,conn){
    if(err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (conn != null){
      var buildData = self.buildApnsPostBuffer({req:req,payloadData:payloadData, deviceToken:deviceToken});
      if(buildData && buildData.err){
        var err = buildData.err;
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      var postBuffer = buildData.postBuffer;
      logger.logDebug("before write apns conn,payloadData="+util.inspect(payloadData,false,100)+", postBuffer in hex="+postBuffer.toString('hex'));//util.inspect(postBuffer,false,1000));

      if (!localConfig.finelyEnableFlag){
        if (callback) return callback(null);
        return;
      }

      conn.write(postBuffer,function(err){
        if (err){
          var err2 = self.newError({errorKey:'libraryError',messageParams:['notification'],messagePrefix:messagePrefix,req:req,innerError:err});
          if (callback) return callback(err2);
          else return self.handleError({err:err2});
        }
        //even run here, the data are not assured to send to target if the socket is closed immediately or the process exits.
        //at least, you can not receive the push from apple. but if you use setTimeout to wait several seconds, then all be ok.
        if (callback) return callback(null);
        return;
      });//conn.write
      return;
    }
    var err = self.newError({errorKey:'applePushNoConnection',messageParams:[],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  });//connectApns
};//sendToApns

/**
 * half interface function for outside
 *
 * @see Notification.prototype.sendToApns
 * @param params - contains deviceToken, dataObj
 *   userId only need when certain error occur and need clear the deviceToken of the user
 * @param callback - is function (err).
 *
 */
Notification.prototype.sendApnsNotification = function(params,callback){
  var messagePrefix = 'in Notification.sendApnsNotification, ';
  var self = this;
  var req = params.req;
  if (!params.deviceToken){
    var err = self.newError({errorKey:'needParameter',messageParams:['deviceToken'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.dataObj){
    var err = self.newError({errorKey:'needParameter',messageParams:['dataObj'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var deviceToken = params.deviceToken;
  var dataObj = params.dataObj;
  var payloadData = self.buildApnsPayloadData({req:req,dataObj:dataObj});
  self.sendToApns({req:req,deviceToken:deviceToken, payloadData:payloadData},function(err){
    if (callback) return callback(err);
    if (err) return self.handleError({err:err});
    return;
  });//sendToApns
  return;
};//sendApnsNotification



/**
*
* @param params - contains userId,registrationId
* @param callback
* @returns - contains err
*/
Notification.prototype.updateUserAppToken = function (params,callback) {
 var self = this;
 var req = params.req;
 var messagePrefix = 'in Notification.updateUserAppToken, ';
 //logger.logDebug("Notification.updateUserAppToken entered, params="+util.inspect(params,false,100));
 if (!params.userId){
   var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
   return self.handleError({err:err});
 }
 var userId = params.userId;
 var appToken = params.appToken;
 if (appToken == null) appToken = "";
 self.store.updateUserAppToken({req:req,userId:userId,deviceRegIdToken:appToken},function(err){
   if (err){
     if (callback) return callback(err);
     else return self.handleError({err:err});
   }
   if (callback) return callback(null);
 });//updateUserAppToken
};//updateUserAppToken














