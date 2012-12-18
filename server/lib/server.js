/**
 *
 * The server object binds redis storage and socket io layer. Server takes in HTTP requests and conduct proper business logic.
 * because redis has only one basic data type - string, the type of any field of returned data by http api and sio push will be string.
 */

var assert = require('assert');
var util = require('util');
var url = require("url");
var fs = require("fs");
var path = require('path');
var querystring = require('querystring');


var express = require('express');
var RedisStore = require('connect-redis')(express);
//in 20121128 install node.js env, occur err:  Cannot find module 'connect-form'. Not found reason. but as connect-form not be used, so just comment it.
//var connect_form = require('connect-form');

var nodemailer = require('nodemailer');
var i18n = require("i18n");

var config = require('./config');
var redis = require('./redis');
var notification = require('./notification');
var solr = require('./solr');
var auth = require('./auth');

var handy = require('./handy');
var tool = require("./tool");
var shuffle = require('./shuffle');
var logger = require('./logger');
var cloudStorage = require('./cloudStorage');

exports = module.exports = Server;


function Server () {
  logger.logDebug("server Server entered");
  var self = this;

  self.threadPeriodicCheckIntervalId = null;

  var envSpecialConfig = config.getEnvConfig();
  self.store = redis.create(envSpecialConfig.dataRedisPort);
  self.auth = auth.create();
  self.notification = notification.create();
  self.notification.init({store:self.store});
  //self.solrClient = solr.create({host:config.config.solrHost, port:config.config.solrPort, commitWithin:config.config.solrCommitWithin, threadInterval:config.config.solrPeriodicThreadInterval});
//  self.mailTransport = nodemailer.createTransport("SMTP", {
//      //host: 'localhost'
//      service: 'Gmail', // use well known service
//      auth: {
//          user: config.config.noreplyMailAccount,
//          pass: handy.decrypt(config.config.noreplyMailAccountPwd)
//      }
//    });
  self.mailTransport = nodemailer.createTransport("SMTP", {
        host: config.config.noreplyMailHost,
        port: config.config.noreplyMailHostPort,
        secureConnection : false,
        auth: {
            user: config.config.noreplyMailAccount,
            pass: handy.decrypt(config.config.noreplyMailAccountPwd)
        }
    });

  self.sessionRedisStore = new RedisStore({port:envSpecialConfig.webSessionRedisPort});
  var expressSessionOptions = {secret:'keyboard cat',
      cookie:{maxAge:config.config.webSessionAge},
      store:self.sessionRedisStore };

  i18n.configure({
    // setup some locales - other locales default to en silently
    locales:[config.config.defaultLocale.language,'en'],
    // where to register __() and __n() to, might be "global" if you know what you are doing
    register: "global",
    updateFiles : false // auto generate local file is hard to control
  });

  var httpsOptions = {
      key: fs.readFileSync(config.config.https_keyFilePath),
      cert: fs.readFileSync(config.config.https_certFilePath)
    };
  self.secureApp = express.createServer(httpsOptions);
  self.secureApp.use(express.cookieParser());
  self.secureApp.use(express.session(expressSessionOptions));
  self.secureApp.use(express.bodyParser());
  self.secureApp.use(i18n.init);


  self.app = express.createServer(
      // connect-form (http://github.com/visionmedia/connect-form)
      // middleware uses the formidable middleware to parse urlencoded
      // and multipart form data
      //connect_form({ keepExtensions: true })
  );

//  self.sio = sio.create();
//  self.sio.store = self.store;
//  self.sio.listen(self.app);

  self.app.use(express.cookieParser());
  self.app.use(express.session(expressSessionOptions));
  //self.app.use(express.bodyParser({uploadDir:'/home/yu1/runtmp',keepExtensions:true}));//Could not locate file /home/yu1/runtmp/5a74a98c7167be13523a5d3503d3c005.png
  self.app.use(express.bodyParser({uploadDir:config.config.apacheTmpPicDir,keepExtensions:true}));
  self.app.use(i18n.init);

  self.app.set('views', path.join( __dirname,'../views'));
  self.app.get('/css/:fileName(*)', function (req, res) {self.staticHandler(req, res);});
  self.secureApp.get('/css/:fileName(*)', function (req, res) {self.staticHandler(req, res);});

  self.secureApp.post('/user/register',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.register(req, res);});
  self.secureApp.post('/user/logIn',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.logIn(req, res);});
  self.secureApp.post('/user/logInFromRenRen',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.logInFromRenRen(req, res);});
  self.secureApp.post('/user/resetPassword',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.resetPassword(req, res);} );
  self.app.post('/user/logOut',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.logOut(req, res);} );
  self.secureApp.get('/admin/getConfig',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.getConfig(req, res);});

  self.app.post('/user/generateInviteCodeD',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      //function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.generateInviteCode(req, res);});
  self.app.post('/user/likePhotoD',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.likePhotoD(req, res);});
  self.app.post('/user/getUser',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.getUser(req, res);});
  self.app.post('/user/updateProfile',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.updateProfile(req, res);});
  self.app.post('/user/updateProfileWithPhoto',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.updateProfileWithPhoto(req, res);});
  self.app.post('/user/getPhotos',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.getPhotos(req, res);});
  self.app.post('/user/getPhoto',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.getPhoto(req, res);});
  self.app.post('/user/reportUser',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.reportUser(req, res);});
  self.app.post('/user/createDateD',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.createDate(req, res);});
  self.app.post('/user/createDateWithPhoto',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.createDateWithPhoto(req, res);});
  self.app.post('/user/getDates',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.getDates(req, res);});
  self.app.post('/user/getNearbyDates',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionAllowAnonymous(req, res, next);},
      function (req, res) { self.getNearbyDates(req, res);});
  self.app.post('/user/getDateConversations',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.getDateConversations(req, res);});
  self.app.post('/user/getMessageHistory',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.getMessageHistory(req, res);});
  self.app.post('/user/getMessage',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.getMessage(req, res);});
  self.app.post('/user/sendMessage',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.sendMessage(req, res);});
  self.app.post('/user/setDateConversationViewed',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.setDateConversationViewed(req, res);});
  self.app.post('/user/confirmDate',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.confirmDate(req, res);});
  self.app.post('/user/stopDateD',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.stopDate(req, res);});
  self.app.post('/user/rate',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.rate(req, res);});
  self.app.post('/user/updateLocationD',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.updateLocation(req, res);});
  self.app.post('/user/uploadPhoto',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.uploadPhoto(req, res);});
  self.app.post('/user/deletePhoto',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.deletePhoto(req, res);});
  self.app.post('/user/setPrimaryPhoto',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.setPrimaryPhoto(req, res);});
  self.app.post('/user/signIn',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.signIn(req, res);});
  self.app.post('/user/updateAppToken',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.updateAppToken(req, res);});
  self.app.post('/user/getSentingSMS',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.getSentingSMS(req, res);});
  self.app.post('/user/getActivityTypes',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkLogInSessionStrict(req, res, next);},
      function (req, res) { self.getActivityTypes(req, res);});

  self.app.post('/admin/getData',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.adminGetData(req, res);});
  self.app.get('/admin/getData',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.adminGetData(req, res);});
  self.app.post('/admin/getRawDataByQuery',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.adminGetRawDataByQuery(req, res);});
  self.app.get('/admin/getRawDataByQuery',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.adminGetRawDataByQuery(req, res);});
  self.app.post('/admin/getStat',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.adminGetStat(req, res);});
  self.app.get('/admin/getStat',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.adminGetStat(req, res);});
  self.app.post('/admin/getConfig',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.getConfig(req, res);});
  self.app.get('/admin/getConfig',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.getConfig(req, res);});
  self.app.post('/admin/changeUserCredit',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.adminChangeUserCredit(req, res);});
  self.app.post('/admin/setAppUsage',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.adminSetAppUsage(req, res);});
  self.app.post('/admin/runMethod',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.adminRunMethod(req, res);});

  //web for admin
  self.secureApp.get('/adminWeb/logIn',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.viewAdminLogIn(req, res);});
  self.secureApp.post('/adminWeb/logIn',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.viewAdminLogIn(req, res);});
  self.app.get('/adminWeb/functionList',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkAdminWebSession(req, res, next);},
      function (req, res) { self.viewFunctionList(req, res);});
  self.app.post('/adminWeb/functionList',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkAdminWebSession(req, res, next);},
      function (req, res) { self.viewFunctionList(req, res);});
  self.app.get('/adminWeb/logOut',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.adminWebLogOut(req, res);});
  self.app.post('/adminWeb/logOut',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.adminWebLogOut(req, res);});

  self.app.get('/web/regionList',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkAdminWebSession(req, res, next);},
      function (req, res) { self.viewRegionList(req, res);});

  self.app.get('/web/regionStatePhotoList',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkAdminWebSession(req, res, next);},
      function (req, res) { self.viewRegionStatePhotoList(req, res);});
  self.app.post('/web/regionStatePhotoList',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkAdminWebSession(req, res, next);},
      function (req, res) { self.viewRegionStatePhotoList(req, res);});
  self.app.post('/web/singleAuditPhoto',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkAdminWebSession(req, res, next);},
      function (req, res) { self.webAuditPhoto(req, res);});
  self.app.post('/web/auditPhoto',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkAdminWebSession(req, res, next);},
      function (req, res) { self.webBatchAuditPhoto(req, res);});
  self.app.get('/web/broadcastSystemMessage',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkAdminWebSession(req, res, next);},
      function (req, res) { self.viewBroadcastSystemMessage(req, res);});
  self.app.post('/web/broadcastSystemMessage',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkAdminWebSession(req, res, next);},
      function (req, res) { self.viewBroadcastSystemMessage(req, res);});

  self.app.get('/web/disableUser',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkAdminWebSession(req, res, next);},
      function (req, res) { self.viewDisableUser(req, res);});
  self.app.post('/web/disableUser',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res, next) { self._checkAdminWebSession(req, res, next);},
      function (req, res) { self.viewDisableUser(req, res);});

  //web for normal user
  self.secureApp.get('/web/resetPassword',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.viewResetPassword(req, res);});
  self.secureApp.post('/web/resetPassword',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.viewResetPassword(req, res);});
  self.app.get('/web/resetPassword',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.viewResetPassword(req, res);});
  self.app.post('/web/resetPassword',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.viewResetPassword(req, res);});

  self.app.get('/web/requestResetPassword',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.viewRequestResetPassword(req, res);});
  self.app.post('/web/requestResetPassword',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      function (req, res) { self.viewRequestResetPassword(req, res);});

  self.app.get('/web/queryUserData',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      //function (req, res, next) { self._checkAdminWebSession(req, res, next);},
      function (req, res) { self.viewQueryUserData(req, res);});
  self.app.post('/web/queryUserData',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      //function (req, res, next) { self._checkAdminWebSession(req, res, next);},
      function (req, res) { self.viewQueryUserData(req, res);});

  self.app.get('/web/runMethod',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      //function (req, res, next) { self._checkAdminWebSession(req, res, next);},
      function (req, res) { self.viewRunMethod(req, res);});
  self.app.post('/web/runMethod',
      function (req, res, next) { self._commonPreConfig(req, res, next);},
      //function (req, res, next) { self._checkAdminWebSession(req, res, next);},
      function (req, res) { self.viewRunMethod(req, res);});

  var expressErrorHander = function(err, req, res, next){
    //console.log('error caught by server: ' + util.inspect(err,false,100) + ', error stack=' + util.inspect(err.stack,false,100));
    logger.logError("error caught by express.");
    self.handleError({err:err, req:req, res:res});
    //if (res.writable) res.json({status:'fail', result:{error:err}});//handleError have res.json
    //res.end();
    if (config.config.usage == "dev"){
      process.exit(123);
    }
    if (next) next(err);
  };
  self.app.error(expressErrorHander);
  self.secureApp.error(expressErrorHander);
};//Server constructor

Server.prototype.listen = function (port,securePort) {
  var self = this;
  logger.logDebug("server listen entered, port="+port+", securePort="+securePort);
  self.app.listen(port);
  self.secureApp.listen(securePort);
  logger.logInfo("server starts listening at port " + self.app.address().port+", securePort "+self.secureApp.address().port);
  self.startThreadPeriodicCheck();
};

Server.prototype.close = function () {
  logger.logDebug("server close entered");
  var self = this;
  self.mailTransport.close();
  self.sessionRedisStore.client.quit();
  self.store.quit(function(err){
    if (err) self.handleError({err:err});
    //self.sio.close();
    self.notification.quit();
    //self.solrClient.close();
    self.app.close();
    self.secureApp.close();
    self.stopThreadPeriodicCheck();
  });//store.quit
};




Server.prototype.startThreadPeriodicCheck = function () {
  var self = this;
  logger.logDebug("Server.startThreadPeriodicCheck entered");
  function doWork(){
    if (!config.config.diableThreadWorker){
      self.checkAndNotifyDaters({}, function(){});
    }
  };//doWork

  var threadInterval = config.config.periodicThreadInterval;
  if (self.threadPeriodicCheckIntervalId == null){
    self.threadPeriodicCheckIntervalId = setInterval(function(){
      doWork();
    },threadInterval);//setInterval
  }else{
    logger.logWarning("ThreadPeriodicCheck already started");
  }
};//startThreadPeriodicCheck
Server.prototype.stopThreadPeriodicCheck = function () {
  var self = this;
  logger.logDebug("stopThreadPeriodicCheck entered");
  if (self.threadPeriodicCheckIntervalId != null){
    clearInterval(self.threadPeriodicCheckIntervalId);
    self.threadPeriodicCheckIntervalId = null;
  }
};//stopThreadPeriodicCheck

/**
 *
 * @param params - contains req, data
 */
Server.prototype.logWithWebRequestInfo = function(params){
  var self = this;
  var req = params.req;
  var data = params.data;
  var reqInParams = handy.getRequestInParams(req,{hidePassword:true});
  var debugText = "in logWithWebRequestInfo, reqInParams=\n"+util.inspect(reqInParams,false,100) +
    "\n, info data=\n"+util.inspect(data,false,100);
  logger.logDebug(debugText);
};//logWithWebRequestInfo


/**
 *
 * @param params - contains res, req, data, format(json|justwrite|formatJsonText,default be json)
 */
Server.prototype.returnDataFromResponse = function(params){
  var self = this;
  var res = params.res;
  var req = params.req;
  var data = params.data;
  var format = params.format;//json|justwrite,default be json
  assert.ok(res);

  self.logWithWebRequestInfo(params);

  if (format == 'justwrite'){
    res.send(data);
  }else if (format == 'formatJsonText'){
    var text = util.inspect(data,false,100);
    res.send(text);
  }else{
    res.json(data);
  }
  return;
};//returnDataFromResponse

/**
 * TODO upgrade to handleErrors or handleInfo
 * @param params
 */
Server.prototype.logErrors = function(params){
  var self = this;
  var messagePrefix = 'in Server.handleError, ';
  //replace assert.ok(..) to below check codes because the error thrown by assert can not be handled

  var errors = params.errors;
  var req = params.req;

  var reqInParams = handy.getRequestInParams(req,{hidePassword:true});

  //any error will write to log, because you can not rely that front side can see the error info.
  var debugText = "error handled in serverside layer" + ', reqInParams=\n'+util.inspect(reqInParams,false,100);
  logger.logError(debugText);
  handy.handleErrors(params);

  handy.handleError({err:err, nestlevel:0});
  return;
};



/**
 * log error and return error message though http response
 * as a private function
 * @param params - contains err, req, res
 *   err may contain innerError
 */
Server.prototype.handleError = function(params){
  var self = this;
  var messagePrefix = 'in Server.handleError, ';
  //replace assert.ok(..) to below check codes because the error thrown by assert can not be handled
  if (!params.err){
    var err = self.newError({errorKey:'needParameter',messageParams:['err'],messagePrefix:messagePrefix,req:req});
    handy.handleError({err:err, nestlevel:0});
    return;
  }

  var err = params.err;
  var req = params.req;
  var res = params.res;
  var libraryErrorInfo = config.config.errors['libraryError'];

  var reqInParams = handy.getRequestInParams(req,{hidePassword:true});

//  if (!err.code || err.code==libraryErrorInfo.code || !(req && res)){
//    //if err has code, it is a logic error we already consider and can handle. if has no code or already known from low level, we should study it carefully
//    logger.logError('error handled in serverside layer');
//    handy.handleError({err:err, nestlevel:0});
//  }
  //any error will write to log, because you can not rely that front side can see the error info.
  var debugText = "error handled in serverside layer";
  if (!handy.objectHasNoField(reqInParams)){
    debugText += ', reqInParams=\n'+util.inspect(reqInParams,false,100);
  }
  logger.logError(debugText);
  handy.handleError({err:err, nestlevel:0});

  //console.log("in Server.handleError, before if (req && res)");
  if (req && res){
    //console.log("in Server.handleError, in if (req && res)");
    var httpRet = {
        status:'fail', code:err.code, message:err.message,
        result:{
          request:{url:req.url}
        }
      };
    if (!handy.objectHasNoField(reqInParams))
      httpRet.result.reqInParams = reqInParams;
    if (config.config.logLevel == 3){
      httpRet.result.err = err;//for debug
    }
    if (res.writable) res.json(httpRet);
    //res.end();//after session support added, it seems that res.end will cause unfound error.
    return;
  }
  return;
};//handleError

/**
 * log warning and return warning message though http response
 * the structure of warning is like error
 * as a private function
 * @param params - contains warning, req, res
 */
Server.prototype.handleWarning = function(params){
  var self = this;
  var messagePrefix = 'in Server.handleWarning, ';
  //replace assert.ok(..) to below check codes because the error thrown by assert can not be handled
  if (!params.warning){
    var err = self.newError({errorKey:'needParameter',messageParams:['warning'],messagePrefix:messagePrefix,req:req});
    handy.handleError({err:err, nestlevel:0});
    return;
  }

  var warning = params.warning;
  var req = params.req;
  var res = params.res;

  var reqInParams = handy.getRequestInParams(req);

//  if (!warning.code || !(req && res)){
//    //if err has code, it is a logic error we already consider and can handle. if has no code, we should study it carefully
//    logger.logWarning('warning handled in serverside layer');
//    handy.handleWarning({warning:warning, nestlevel:0});
//  }

  var debugText = "warning handled in serverside layer";
  if (!handy.objectHasNoField(reqInParams)){
    debugText += ', reqInParams=\n'+util.inspect(reqInParams,false,100);
  }
  logger.logWarning(debugText);
  handy.handleWarning({err:err, nestlevel:0});

  if (req && res){
    var httpRet = {
        status:'success', code:warning.code, message:warning.message,
        result:{
          request:{url:req.url}
        }
      };
    if (!handy.objectHasNoField(reqInParams))
      httpRet.result.reqInParams = reqInParams;
    if (config.config.logLevel == 3){
      httpRet.result.warning = warning;//for debug
    }
    res.json(httpRet);
    //res.end();
  }
  return;
};//handleWarning

/**
 * new error with config defined. also can customize
 * as a private function
 * @param {Object} params - contains code,message,messagePrefix,errorKey, req.
 *   errorKey is used to get predefined error info in config.
 *   they all can be optional, at this time, the stack info is still useful.
 */
Server.prototype.newError = function(params) {
  if(!params.messagePrefix) params.messagePrefix = 'error in serverside function: ';
  return handy.newError(params);
};//newError
Server.prototype.newWarning = function(params) {
  if(!params.messagePrefix) params.messagePrefix = 'warning in serverside function: ';
  return handy.newError(params);
};//newWarning



/**
*
* @param req - contains count(optional).
* @param res
* @returns
*   {status:success|fail, result:{inviteCode, inviteCodes}}
*/
Server.prototype.generateInviteCodeD = function(req, res) {
  var self = this;
  //logger.logDebug("Server.generateInviteCode entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.generateInviteCode, ';
  var count = req.body.count;
  if (!count) count = 1;

  var expireDays = req.body.expireDays;
  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront && userId && userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!userId){
    if (!expireDays){
      var err = self.newError({errorKey:'needParameter',messageParams:['expireDays'],messagePrefix:messagePrefix,req:req});
      return self.handleError({err:err,req:req,res:res});
    }
    userId = config.config.users.system.userId;
  }


  var expireTime = null;
  if (expireDays){
    expireDays = handy.convertToNumber(expireDays);
    var nowUTCTime = handy.getNowOfUTCdate().getTime();
    expireTime = nowUTCTime + expireDays*24*3600*1000;
  }

  self.store.generateInviteCode({req:req,count:count,userId:userId,expireTime:expireTime},function(err,inviteCodes){
    if (err) return self.handleError({err:err,req:req,res:res});
    var httpRetData = {status:'success',result:{}};
    if (inviteCodes.length == 1) httpRetData.result.inviteCode = inviteCodes[0];
    else httpRetData.result.inviteCodes = inviteCodes;
    self.returnDataFromResponse({res:res,req:req,data:httpRetData});
    return;
  });//generateInviteCode
};//generateInviteCode


/**
*
* @param req - contains emailAccount, password, inviteCode, name, gender, school, deviceType,
*   latlng, region(is a object)(optional), geolibType(optional)
* @param res
* @returns
*   {status:success|fail, result:{userId, credit }}
*/
Server.prototype.register = function(req, res) {
  var self = this;
  //logger.logDebug("Server.register entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.register, ';
  if (!req.body.emailAccount){
    var err = self.newError({errorKey:'needParameter',messageParams:['emailAccount'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.password){
    var err = self.newError({errorKey:'needParameter',messageParams:['password'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
//  if (!req.body.inviteCode){
//    var err = self.newError({errorKey:'needParameter',messageParams:['inviteCode'],messagePrefix:messagePrefix,req:req});
//    return self.handleError({err:err,req:req,res:res});
//  }
  if (!req.body.name){
    var err = self.newError({errorKey:'needParameter',messageParams:['name'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.gender){
    var err = self.newError({errorKey:'needParameter',messageParams:['gender'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.school){
    var err = self.newError({errorKey:'needParameter',messageParams:['school'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
//  if (!req.body.studentNO){
//    var err = self.newError({errorKey:'needParameter',messageParams:['studentNO'],messagePrefix:messagePrefix,req:req});
//    return self.handleError({err:err,req:req,res:res});
//  }
  if (!req.body.deviceType){
    var err = self.newError({errorKey:'needParameter',messageParams:['deviceType'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.deviceId){
    var err = self.newError({errorKey:'needParameter',messageParams:['deviceId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
//  if (req.body.region){
//    if (!req.body.geolibType){
//      var err = self.newError({errorKey:'needParameter',messageParams:['geolibType'],messagePrefix:messagePrefix,req:req});
//      return self.handleError({err:err,req:req,res:res});
//    }
//  }
  if (req.body.accountRenRen){
    if (!req.body.accessTokenRenRen){
      var err = self.newError({errorKey:'needParameter',messageParams:['accessTokenRenRen'],messagePrefix:messagePrefix,req:req});
      return self.handleError({err:err,req:req,res:res});
    }
  }
  var emailAccount = req.body.emailAccount;
  var password = req.body.password;
  //var inviteCode = req.body.inviteCode;
  var name = req.body.name;
  var gender = req.body.gender;
  var school = req.body.school;
  //var studentNO = req.body.studentNO;
  var deviceType = req.body.deviceType;
  var deviceId = req.body.deviceId;
  var accountRenRen = req.body.accountRenRen;
  var accessTokenRenRen = req.body.accessTokenRenRen;
  var accountInfoJson = req.body.accountInfoJson;
  var hometown = req.body.hometown;
//  var latlng = req.body.latlng;
//  var region = req.body.region;
//  var geolibType = req.body.geolibType;
//  var regionJSONstr = null;
//  var centainLevelRegion = null;
//  if (!region) region = config.config.defaultRegion;


    gender = gender.toLowerCase();
    self.store.registerEmailAccount({req:req,emailAccount:emailAccount,password:password,
    name:name,gender:gender,school:school, accountRenRen:accountRenRen, accessTokenRenRen:accessTokenRenRen, accountInfoJson:accountInfoJson,
    deviceType:deviceType, deviceId:deviceId, hometown:hometown},function(err,userObj){
      if (err) return self.handleError({err:err,req:req,res:res});
      var userId = userObj.userId;
      self.store.updateUserStat({req:req,userId:userId,gender:gender},function(err){
        var statErr = err;
        var httpRetData = {status:'success',result:{userId:userId}};
        if (statErr)  httpRetData.result.statErr = statErr;

        var oldSessionUserId = req.session.userId;
        req.session.userId = userId;

        sendWelcomeEmail(function(err){

          //self.solrClient.addUserToQueue({userObj:userObj},function(){});

          if (oldSessionUserId && oldSessionUserId != userId){
            self._logOut({req:req,userId:oldSessionUserId},function(err){
              if (err) return self.handleError({err:err,req:req,res:res});
              self.returnDataFromResponse({res:res,req:req,data:httpRetData});
              return;
            });//_logOut
            return;
          }

          self.returnDataFromResponse({res:res,req:req,data:httpRetData});
          return;
        });//sendWelcomeEmail
      });//updateUserStat
    });//store.registerEmailAccount


  function sendWelcomeEmail(cbFun){
    var mailMessage = {
        from: '"'+config.config.productName+'" <'+config.config.noreplyMailAccount+'>',
        to: emailAccount,
        subject: '欢迎使用活动号外应用', //
        headers: {
            'X-Laziness-level': 1000
        },
        //text: 'Hello to myself!'
        // HTML body
//        html:'<p>Hello '+name+'</p>' +
//        '<p>Welcome in PrettyRich</p>'
        html:'<h4>亲爱的同学，'+name+'，您好：</h4>' +
        '<p>欢迎你加入和使用我们的手机应用，活动号外，中国第一个同校大学生活动交友的手机平台。 希望通过活动号外这个平台，你可以结识到更多本校同学。<br/></p>' +
        '<p>我们倾听你的建议，欢迎发信到 support@huodonghaowai.com。<br/></p>' +
        '<p>活动号外开发团队</p>'
    };

    self.mailTransport.sendMail(mailMessage, function(err){
      if(err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['mail'],messagePrefix:messagePrefix,req:req,innerError:err});
        return cbFun(err2);
      }
      return cbFun(null);
    });//sendMail
  }
};//register


/**
*
* @param req - contains userId, oldPassword, newPassword
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.resetPassword = function(req, res) {
  var self = this;
  //logger.logDebug("Server.resetPassword entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.logIn, ';
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.oldPassword){
    var err = self.newError({errorKey:'needParameter',messageParams:['oldPassword'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.newPassword){
    var err = self.newError({errorKey:'needParameter',messageParams:['newPassword'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }

  var oldPassword = req.body.oldPassword;
  var newPassword = req.body.newPassword;
  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }

  self.store.resetPassword({req:req,userId:userId,oldPassword:oldPassword,newPassword:newPassword},function(err){
    if (err) return self.handleError({err:err,req:req,res:res});
    var httpRetData = {status:'success'};
    self.returnDataFromResponse({res:res,req:req,data:httpRetData});
    return;
  });//store.resetPassword
};//resetPassword


/**
 * @param params - contains emailAccount
 * @param callback - is function(err)
 */
Server.prototype._requestResetPassword = function(params, callback) {
  var self = this;
  logger.logDebug("Server._requestResetPassword entered, params="+handy.inspectWithoutBig(params));
  var messagePrefix = i18n.__("in Server._requestResetPassword, ");
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.emailAccount){
    var err = self.newError({errorKey:'needParameter',messageParams:['emailAccount'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.fromUrl){
    var err = self.newError({errorKey:'needParameter',messageParams:['fromUrl'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }

  var emailAccount = params.emailAccount;
  var fromUrl = params.fromUrl;
  var fromUrlInfo = url.parse(fromUrl);
  //logger.logDebug("in Server._requestResetPassword entered, fromUrlInfo="+util.inspect(fromUrlInfo,false,100));
  self.store.getUserIdByEmailAccount({req:req,emailAccount:emailAccount},function(err,userId){
    if (err) return callback(err);
    if (!userId){
      var err = self.newError({errorKey:'emailNotRegistered',messageParams:[emailAccount],messagePrefix:messagePrefix,req:req});
      return callback(err);
    }
    var timeNowUtc = handy.getNowOfUTCdate().getTime();
    var timeExpire = timeNowUtc + 60*60*1000;
    var resetPwdInfo = ""+timeExpire+"M"+emailAccount;
    resetPwdInfo = handy.encrypt(resetPwdInfo);

//    var mailMessage = {
//        from: 'noreply@prettyrich.com',
//        to: emailAccount,
//        subject: 'reset password request', //
//        headers: {
//            'X-Laziness-level': 1000
//        },
//        //text: 'Hello to myself!'
//        // HTML body
//        html:'<p>to reset password, use below link</p>'+
//             '<p><a href="https://localhost:4010/web/resetPassword?rpi='+resetPwdInfo+'">reset password</a></p>'
//    };

    var resetPwdUrlInfo = tool.cloneObject(fromUrlInfo);
    tool.copyFields({overrideSameName:true,destObj:resetPwdUrlInfo,srcObj:{
      protocol:"http", host:null, port:config.config.port, pathname:"/web/resetPassword",search:"?rpi="+resetPwdInfo,query:null
    }});
    delete resetPwdUrlInfo.host;//if host exist, hostname no use. even host be null, hostname no use.
    delete resetPwdUrlInfo.query;
    var resetPwdUrl = url.format(resetPwdUrlInfo);
    if (!resetPwdUrlInfo.hostname){
      var serverHost = config.getHost();
      //resetPwdUrl = "https://"+serverHost+":4010/web/resetPassword?rpi="+resetPwdInfo;
      resetPwdUrl = "http://"+serverHost+":"+config.config.port+"/web/resetPassword?rpi="+resetPwdInfo;
    }

    //logger.logDebug("in Server._requestResetPassword entered, resetPwdUrl="+util.inspect(resetPwdUrl,false,100));
    var mailMessage = {
        from: '"'+config.config.productName+'" <'+config.config.noreplyMailAccount+'>',
        to: emailAccount,
        subject: '重置密码', //
        headers: {
            'X-Laziness-level': 1000
        },
        //text: 'Hello to myself!'
        // HTML body
        html:'<h4>尊敬的用户，您好:</h4>'+
             '<p>您在同去网点击了“忘记密码”按钮，故系统自动为您发送了这封邮件。您可以点击以下链接修改您的密码：</p>'+
             '<p><a href="'+resetPwdUrl+'">'+resetPwdUrl+'</a></p>'+
             '<p>如果您不需要修改密码，或者您从未点击过“忘记密码”按钮，请忽略本邮件。 </p>'
    };

    self.mailTransport.sendMail(mailMessage, function(err){
      if(err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['mail'],messagePrefix:messagePrefix,req:req,innerError:err});
        return callback(err2);
      }
      return callback(null);
    });//sendMail
  });//store.getUserIdByEmailAccount
};//_requestResetPassword



/**
*
* @param req - contains emailAccount, password, deviceType
* @param res
* @returns
*   {status:success|fail, result:{userId, name, height, gender, primaryPhotoId, primaryPhotoPath}}
*/
Server.prototype.logIn = function(req, res) {
  var self = this;
  //logger.logDebug("Server.logIn entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.logIn, ';
  if (!req.body.emailAccount){
    var err = self.newError({errorKey:'needParameter',messageParams:['emailAccount'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.password){
    var err = self.newError({errorKey:'needParameter',messageParams:['password'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.deviceType){
    var err = self.newError({errorKey:'needParameter',messageParams:['deviceType'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.deviceId){
    var err = self.newError({errorKey:'needParameter',messageParams:['deviceId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var emailAccount = req.body.emailAccount;
  var password = req.body.password;
  var deviceType = req.body.deviceType;
  var deviceId = req.body.deviceId;
  self.store.emailLogIn({req:req,emailAccount:emailAccount,password:password,deviceType:deviceType,deviceId:deviceId,
  userFields:['userId','name','gender','primaryPhotoId','height', 'school', 'studentNO', 'department', 'bloodGroup',
              'constellation', 'hometown', 'educationalStatus', 'description', 'goodRateCount'],
  needPrimaryPhoto:true,primaryPhotoFields:['userId','photoPath']},function(err,userObj){
    if (err) return self.handleError({err:err,req:req,res:res});
    var userId = userObj.userId;
    var retUserObj = tool.cloneObject(userObj);
    var httpRetData = {status:'success',result:retUserObj};
//    var httpRetData = {status:'success',result:{
//        userId:userId, name:userObj.name, height:userObj.height, gender:userObj.gender
//      }};
//    if (userObj.primaryPhotoId){
//      httpRetData.result.primaryPhotoId = userObj.primaryPhotoId;
//      httpRetData.result.primaryPhotoPath = userObj.primaryPhotoPath;
//    }
    var dtActionTime = handy.getNowOfUTCdate();
    self.store.updateUserStatDailyActive({req:req,userId:userId,updateTime:dtActionTime.getTime()},function(err,alreadyUpdateThisDay){
      var statErr = err;
      var beDailyFirst = !alreadyUpdateThisDay;
      if (statErr) httpRetData.result.statErr = statErr;
      //httpRetData.result.beDailyFirst = beDailyFirst;
      //logger.logDebug("Server.logIn before http return, httpRetData="+util.inspect(httpRetData,false,100)+",\n userObj="+util.inspect(userObj,false,100));
      var oldSessionUserId = req.session.userId;
      req.session.userId = userId;
      if (oldSessionUserId && oldSessionUserId != userId){
        self._logOut({req:req,userId:oldSessionUserId},function(err){
          if (err) return self.handleError({err:err,req:req,res:res});
          self.returnDataFromResponse({res:res,req:req,data:httpRetData});
          return;
        });//_logOut
        return;
      }
      self.returnDataFromResponse({res:res,req:req,data:httpRetData});
      return;
    });//updateUserStatDailyActive
  });//emailLogIn
};//logIn



/**
*
* @param req - contains emailAccount, password, deviceType
* @param res
* @returns
*   {status:success|fail, result:{userId, name, height, gender, primaryPhotoId, primaryPhotoPath}}
*/
Server.prototype.logInFromRenRen = function(req, res) {
  var self = this;
  //logger.logDebug("Server.logInFromRenRen entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.logInFromRenRen, ';
  if (!req.body.accountRenRen){
    var err = self.newError({errorKey:'needParameter',messageParams:['accountRenRen'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.accessTokenRenRen){
    var err = self.newError({errorKey:'needParameter',messageParams:['accessTokenRenRen'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.deviceType){
    var err = self.newError({errorKey:'needParameter',messageParams:['deviceType'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.deviceId){
    var err = self.newError({errorKey:'needParameter',messageParams:['deviceId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var accountRenRen = req.body.accountRenRen;
  var accessTokenRenRen = req.body.accessTokenRenRen;
  var deviceType = req.body.deviceType;
  var deviceId = req.body.deviceId;
  self.store.renrenAccountLogIn({req:req,accountRenRen:accountRenRen,accessTokenRenRen:accessTokenRenRen,deviceType:deviceType,deviceId:deviceId,
  userFields:['userId','emailAccount','name','gender','primaryPhotoId','height', 'school', 'studentNO', 'department', 'bloodGroup',
              'constellation', 'hometown', 'educationalStatus', 'description', 'goodRateCount'],
  needPrimaryPhoto:true,primaryPhotoFields:['userId','photoPath']},function(err,userInfo){
    if (err) return self.handleError({err:err,req:req,res:res});
    var httpRetData = {status:'success',result:userInfo};
    if (!userInfo.userExist){
      self.returnDataFromResponse({res:res,req:req,data:httpRetData});
      return;
    }
    var userId = userInfo.user.userId;
    var dtActionTime = handy.getNowOfUTCdate();
    self.store.updateUserStatDailyActive({req:req,userId:userId,updateTime:dtActionTime.getTime()},function(err,alreadyUpdateThisDay){
      var statErr = err;
      var beDailyFirst = !alreadyUpdateThisDay;
      if (statErr) httpRetData.result.statErr = statErr;
      var oldSessionUserId = req.session.userId;
      req.session.userId = userId;
      if (oldSessionUserId && oldSessionUserId != userId){
        self._logOut({req:req,userId:oldSessionUserId},function(err){
          if (err) return self.handleError({err:err,req:req,res:res});
          self.returnDataFromResponse({res:res,req:req,data:httpRetData});
          return;
        });//_logOut
        return;
      }
      self.returnDataFromResponse({res:res,req:req,data:httpRetData});
      return;
    });//updateUserStatDailyActive
  });//renrenAccountLogIn
};//logInFromRenRen



/**
*
* @param req - contains userId
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.logOut = function(req, res) {
  var self = this;
  //logger.logDebug("Server.logOut entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.logOut, ';
  var userId = req.session.userId;
  req.session.destroy();
  self._logOut({req:req,userId:userId},function(err){
    if (err) return self.handleError({err:err,req:req,res:res});
    var httpRetData = {status:'success'};
    self.returnDataFromResponse({res:res,req:req,data:httpRetData});
    return;
  });//_logOut
};//logOut

Server.prototype._logOut = function(params, callback) {
  var self = this;
  //logger.logDebug("Server._logOut entered, params="+util.inspect(params,false,100));
  var messagePrefix = 'in Server.logOut, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }

  var userId = params.userId;
  self.store.logOut({req:req,userId:userId},function(err){
    if (err) return callback(err);
    return callback(null);
  });//store.logOut
};//_logOut


Server.prototype._checkLogInSessionAllowAnonymous = function(req, res, next) {
  var self = this;
  var messagePrefix = 'in Server._checkLogInSessionAllowAnonymous, ';
  req.session.cookie.maxAge = config.config.sessionAge;//TODO use expression session
  return next();

//  if (!req.body.userId){
//    return next();
//  }
//  var userId = req.body.userId;
//  self.store.checkAndRenewLogInSession({req:req,userId:userId},function(err){
//    if (err) return self.handleError({err:err,req:req,res:res});
//    return next();
//  });
};//_checkLogInSessionAllowAnonymous

Server.prototype._checkLocale = function(req, cbFun) {
  var self = this;
  var lang = handy.getLocaleLanguage({req:req});
  i18n.setLocale(req, lang);
  return cbFun();
};//_checkLocale

Server.prototype._commonPreConfig = function(req, res, next) {
  var self = this;
  //console.log("_commonPreConfig entered");
  var reqInParams = handy.getRequestInParams(req,{hidePassword:true});
  var debugText = "server api enter, "+req.path+ " " +req.method + ",\nreqInParams=\n"+util.inspect(reqInParams,false,100);
  logger.logDebug(debugText);

  self._checkLocale(req, function(){
    return next();
  });//_checkLocale
};//_commonPreConfig

Server.prototype._checkLogInSessionStrict = function(req, res, next) {
  var self = this;
  var messagePrefix = 'in Server._checkLogInSessionStrict, ';
  console.log("_checkLogInSessionStrict enter");
  //console.log("req.headers="+util.inspect(req.headers,false,100));
  if (!req.session.userId){
    var err = self.newError({errorKey:'userNotLogin',messageParams:[],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  req.session.cookie.maxAge = config.config.sessionAge;
  return next();

//  if (!req.body.userId){
//    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
//    return self.handleError({err:err,req:req,res:res});
//  }
//  var userId = req.body.userId;
//  self.store.checkAndRenewLogInSession({req:req,userId:userId},function(err){
//    if (err) return self.handleError({err:err,req:req,res:res});
//    return next();
//  });
};//_checkLogInSessionStrict

Server.prototype._checkAdminWebSession = function(req, res, next) {
  var self = this;
  var messagePrefix = 'in Server._checkAdminWebSession, ';
  if (!req.session || !req.session.userName){
    var err = self.newError({errorKey:'simpleError',messageParams:['admin please logIn'],messagePrefix:messagePrefix,req:req});
    if (req.body && req.body.returnFormat == 'json'){
      return self.handleError({err:err,req:req,res:res});
    }else{
      self.handleError({err:err,req:req});
    }
    var urlInfo = shuffle.generateWebUrl({req:req, needSecure:true,path:'/adminWeb/logIn'});
    var redirectUrl = urlInfo.url;
    res.redirect(redirectUrl);
    return;
  }
  return next();
};//_checkAdminWebSession

/**
*
*
* @param req - contains userId, width,height, notUploadReally(for quick testing), setPrimary
*
* @param res
* @returns
*   {status:success|fail, result:{photoId}}
*/
Server.prototype.uploadPhoto = function(req, res) {
  var self = this;
  //logger.logDebug("Server.uploadPhoto entered, req.body="+util.inspect(req.body,false,100)+" \nreq.files="+util.inspect(req.files,false,100));
  var messagePrefix = 'in Server.uploadPhoto, ';

  if (!req.body.width){
    var err = self.newError({errorKey:'needParameter',messageParams:['width'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.height){
    var err = self.newError({errorKey:'needParameter',messageParams:['height'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (req.files == null || req.files.image == null){
    var err = self.newError({errorKey:'needUploadFile',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }

  var width = req.body.width;
  var height = req.body.height;
  var imageFile = req.files.image;
  var setPrimary = req.body.setPrimary;
  setPrimary = handy.convertToBool(setPrimary);
  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }

  var notUploadReally = req.body.notUploadReally;
  notUploadReally = handy.convertToBool(notUploadReally);
  self._uploadPhoto({req:req,allowNoFile:false,imageFile:imageFile,userId:userId,width:width,height:height,setPrimary:setPrimary,notUploadReally:notUploadReally}, function(err,uploadPhotoInfo){
    if (err) return self.handleError({err:err,req:req,res:res});
    var httpRetData = {status:'success', result:uploadPhotoInfo};
    logger.logDebug("Server.uploadPhoto exited, httpRetData="+util.inspect(httpRetData,false,100));
    self.returnDataFromResponse({res:res,req:req,data:httpRetData});
    return;
  });//_uploadPhoto
};//uploadPhoto



/**
 * @param params - contains allowNoFile, imageFile, userId, width, height, setPrimary, notUploadReally
 * @param cbFun - is function(err, uploadPhotoInfo)
 *   uploadPhotoInfo can be null or contains photoId, photoPath, statErr, auditId
 */
Server.prototype._uploadPhoto = function(params, cbFun) {
  var self = this;
  var messagePrefix = 'in Server._uploadPhoto, ';
  var req = params.req;
  logger.logDebug("Server._uploadPhoto entered, params="+handy.inspectWithoutBig(params));
  var allowNoFile = params.allowNoFile;
  var imageFile = params.imageFile;
  if (allowNoFile && !imageFile){
    return cbFun(null,null);
  }
  var userId = params.userId;
  var width = params.width;
  var height = params.height;

  if (!imageFile){
    var err = self.newError({errorKey:'needParameter',messageParams:['imageFile'],messagePrefix:messagePrefix,req:req});
    return cbFun(err);
  }
  if (!userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return cbFun(err);
  }
  if (!width){
    var err = self.newError({errorKey:'needParameter',messageParams:['width'],messagePrefix:messagePrefix,req:req});
    return cbFun(err);
  }
  if (!height){
    var err = self.newError({errorKey:'needParameter',messageParams:['height'],messagePrefix:messagePrefix,req:req});
    return cbFun(err);
  }
  var setPrimary = params.setPrimary;
  setPrimary = handy.convertToBool(setPrimary);
  var notUploadReally = params.notUploadReally;
  notUploadReally = handy.convertToBool(notUploadReally);
  //logger.logDebug("Server._uploadPhoto entered, notUploadReally="+util.inspect(notUploadReally,false,100));

  var fileName = imageFile.name;
  var filePath = imageFile.path;
  var fileSize = imageFile.size;

  self.store.getUser({req:req,userId:userId,needPhotoCount:false,userFields:['userId','gender']},function(err,userObj){
    if (err) return cbFun(err);
    if (!userObj || !userObj.userId){
      var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
      if (err) return cbFun(err);
    }
    var gender = userObj.gender;
    if(!gender){
      var err = self.newError({errorKey:'userNoGender',messageParams:[],messagePrefix:messagePrefix,req:req});
      if (err) return cbFun(err);
    }

    var bucketName = config.getCloudStorageInfo().bucketName;
    var objectFolderPath = config.getCloudStorageInfo().objectFolderPath_prod;// 'folder1';
    if (config.config.usage == 'dev'){
      objectFolderPath = config.getCloudStorageInfo().objectFolderPath_dev;
    }
    var nowTime = handy.getNowOfUTCdate().getTime()+'';
    var objectName = ''+userId+'_'+nowTime+'_' +fileName;
    cloudStorage.uploadFileToCloudStorage({
      bucket:bucketName,objectFolderPath:objectFolderPath,objectName:objectName,
      filePath:filePath,fileSize:fileSize,
      notUploadReally:notUploadReally},function(err, data){
        logger.logDebug('uploadFileToS3 callback entered');
        if (err){
          var err = self.newError({errorKey:'libraryError',messageParams:['s3'],messagePrefix:messagePrefix,req:req,innerError:err});
          return cbFun(err);
        }
        var objectPath = path.join(objectFolderPath,objectName);
        var photoPath = objectPath;

        //image process in outside php server
        cloudStorage.resizeAndUploadPhotoByPhpSide({bucketName:bucketName,objectFolderPath:objectFolderPath,filePath:filePath,objectName:objectName,
        notUploadReally:notUploadReally},function(err){
          if (err) return cbFun(err);

          self.store.createPhoto({req:req,userId:userId,gender:gender,photoPath:photoPath,width:width,height:height,setPrimary:setPrimary},function(err,createdPhoto){
            if (err) return cbFun(err);
            var photoId = createdPhoto.photoId;

            self.store.updatePhotoStat({req:req,photoId:photoId,photoOwnerGender:gender,uploadTime:createdPhoto.createTime,isDelete:false},function(err){
              var statErr = err;
              var outData = {photoId:photoId, photoPath:photoPath};
              if(statErr) outData.statErr = statErr;
              logger.logDebug("Server._uploadPhoto exited, outData="+util.inspect(outData,false,100));
              return cbFun(null,outData);
//              if(!config.config.autoAuditPhoto){
//                logger.logDebug("Server._uploadPhoto exited, httpRetData="+util.inspect(httpRetData,false,100));
//                return cbFun(null,outData);
//              }
//              self._auditPhoto({req:req,photoId:photoId,auditPass:true,description:"config auto audit"}, function(err,auditInfo){
//                if (err) return cbFun(err);
//                if (auditInfo && auditInfo.auditObj)  outData.auditId = auditInfo.auditObj.auditId;
//                if (!setPrimary){
//                  logger.logDebug("Server._uploadPhoto exited, outData="+util.inspect(outData,false,100));
//                  return cbFun(null,outData);
//                }
//                self.store.setUserPrimaryPhoto({req:req,userId:userId,photoId:photoId},function(err){
//                  if (err) return self.handleError({err:err,req:req,res:res});
//                  logger.logDebug("Server._uploadPhoto exited, outData="+util.inspect(outData,false,100));
//                  return cbFun(null,outData);
//                });//store.setUserPrimaryPhoto
//              });//_auditPhoto
            });//updatePhotoStat
            return;
          });//createPhoto
          fs.unlink(filePath,function(err){
            if (err){
              var err = self.newError({errorKey:'libraryError',messageParams:['fs.unlink'],messagePrefix:messagePrefix,req:req,innerError:err});
              self.handleError({err:err});
            }
          });//fs.unlink
          return;
        });//resizeAndUploadPhotoByPhpSide
    });//uploadFileToS3
  });//store.getUser
};//_uploadPhoto










/**
*
*
* @param params - contains photoId, auditPass(boolean),description(optional)
* @param callback(err, auditInfo)
*   auditInfo contains auditObj, bePrimaryPhoto, firstApprovedUserPhoto, photoTimeBeEarly, feedLastUpdateTime, primaryPhotoChanged, newPrimaryPhotoId,
*   notificationErr, creditTransactionObj.
*   auditInfo can be null when re-auditPass a photo.
*/
Server.prototype._auditPhotoD = function(params, callback) {
  var self = this;
  //logger.logDebug("Server._auditPhoto entered, params="+util.inspect(params,false,100));
  var messagePrefix = 'in Server._auditPhoto, ';
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.photoId){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (params.auditPass == null){
    var err = self.newError({errorKey:'needParameter',messageParams:['auditPass'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var photoId = params.photoId;
  var auditPass = handy.convertToBool(params.auditPass);
  var description = params.description;
  self.store.getPhoto({req:req,photoId:photoId,photoFields:['photoId','state','userId','createTime']},function(err,photoObj){
    if (err) return callback(err);
    if (!photoObj || !photoObj.photoId){
      var err = self.newError({errorKey:'photoNotExist',messageParams:[photoId],messagePrefix:messagePrefix,req:req});
      if (err) return callback(err);
    }
    if(photoObj.state == "deleted"){
      var err = self.newError({errorKey:'photoAlreadyDeleted',messageParams:[photoId],messagePrefix:messagePrefix,req:req});
      if (err) return callback(err);
    }else if((photoObj.state == "auditPassed" && auditPass)||(photoObj.state == "auditDenied" && !auditPass)){
      return callback(null,null);
    }

    var userId = photoObj.userId;
    self.store.getUser({req:req,userId:userId,needPhotoCount:false,userFields:['userId','gender','primaryPhotoId']},function(err,userObj){
        if (err) return callback(err);
        if (!userObj || !userObj.userId){
          var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
          if (err) return callback(err);
        }
//        var region = JSON.parse(userObj.region);
//        userObj.region = region;

        //logger.logDebug("self.store.auditPhoto entering");
        self.store.auditPhoto({req:req,auditUserId:config.config.users.system.userId, photoId:photoId,passed:auditPass,photoTime:photoObj.createTime,
        oldPhotoState:photoObj.state,description:description,photoOwner:userObj},function(err,auditInfo){
          if (err) return callback(err);
          //maybe image process ......
          return callback(null,auditInfo);
        });//store.auditPhoto
    });//store.getUser
  });//store.getPhoto
};//_auditPhoto

/**
*
*
* @param params - contains photosData
*   photosData is an array. each item of it should contains photoId, passed(boolean),description(optional)
* @param callback(errors, auditInfos)
*   auditInfos is an array. each item of it
*     contains auditObj, bePrimaryPhoto, firstApprovedUserPhoto, notificationErr.
*     auditInfo can be null when re-auditPass a photo.
*/
Server.prototype._auditPhotos = function(params, callback) {
  var self = this;
  //logger.logDebug("Server._auditPhotos entered, params="+util.inspect(params,false,100));
  var messagePrefix = 'in Server._auditPhotos, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  var photosData = params.photosData;
  if(!photosData || photosData.length==0){
    return callback(null,null);
  }

  //photosData.length>0
  var finishedCallCount = 0;
  var retAuditInfos = [], retErrors = [];
  for(var i=0; i<photosData.length; i++){
    var photoData = photosData[i];
    self._auditPhoto({req:req,photoId:photoData.photoId, auditPass:photoData.passed, description:photoData.description}, function(err,auditInfo){
      finishedCallCount++;
      if(err) retErrors.push(err);
      else retAuditInfos.push(auditInfo);
      if(finishedCallCount == photosData.length){
        if(retAuditInfos.length==0) retAuditInfos = null;
        if(retErrors.length==0) retErrors = null;
        return callback(retErrors,retAuditInfos);
      }
    });//_auditPhoto
  }//for
};//_auditPhotos





/**
*
* @param req - contains userId, targetUserId
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.getUser = function(req, res) {
  var self = this;
  //logger.logDebug("Server.getUser entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.getUser, ';
  if (!req.body.targetUserId){
    var err = self.newError({errorKey:'needParameter',messageParams:['targetUserId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var targetUserId = req.body.targetUserId;

  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }

  var getSelf = false;
  if (userId == targetUserId)
    getSelf = true;

  var photoCount = config.config.userPhotosCount;
  self.store.getUser({req:req,userId:targetUserId,getSelf:getSelf,
    userFields:['userId','gender','name','height','school','studentNO','department','bloodGroup','constellation','hometown','educationalStatus','description','primaryPhotoId','goodRateCount'],
    needPhotoCount:true,needPrimaryPhoto:true,primaryPhotoFields:['photoId','photoPath']},function(err,userObj){
      if (err) return self.handleError({err:err,req:req,res:res});
      if (!userObj || !userObj.userId){
        var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
        if (err) return self.handleError({err:err,req:req,res:res});
      }
      var httpRetData = {status:'success',result:userObj};
      logger.logDebug("Server.getUser exited, httpRetData="+util.inspect(httpRetData,false,100));
      self.returnDataFromResponse({res:res,req:req,data:httpRetData});
      return;

//      self.store.getUserPhotos({req:req,userId:targetUserId,getSelf:getSelf,cutOffTime:null,count:photoCount,
//      photoFields:['photoId', 'photoPath', 'width','height', 'createTime'],userIdToCheckAlreadyLikedPhoto:userId},function(err,photos){
//        if (err) return self.handleError({err:err,req:req,res:res});
//        if (photos && photos.length > 0){
//          userObj.photos = photos;
//        }
//        var httpRetData = {status:'success',result:userObj};
//        logger.logDebug("Server.getUser exited, httpRetData="+util.inspect(httpRetData,false,100));
//        self.returnDataFromResponse({res:res,req:req,data:httpRetData});
//        return;
//      });//store.getUserPhotos
  });//store.getUser
};//getUser

/**
*
* @param req - contains height, studentNO, department, description, educationalStatus, bloodGroup, constellation, hometown
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.updateProfile = function(req, res) {
  var self = this;
  //logger.logDebug("Server.updateProfile entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.updateProfile, ';
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }

  var params = {userId:userId};
  tool.copyFields({srcObj:req.body, destObj:params});
  params.req = req;
  self._updateProfileForTextField(params, function(err){
    if (err) return self.handleError({err:err,req:req,res:res});
    var httpRetData = {status:'success'};
    self.returnDataFromResponse({res:res,req:req,data:httpRetData});
    return;
  });//_updateProfileForTextField
};//updateProfile

Server.prototype._updateProfileForTextField = function(params, callback) {
  var self = this;
  var req = params.req;
  logger.logDebug("Server._updateProfileForTextField entered, params="+handy.inspectWithoutBig(params));
  var messagePrefix = 'in Server._updateProfileForTextField, ';
  var userId = params.userId;
  var height = params.height;
  //var studentNO = params.studentNO;
  var department = params.department;
  var description = params.description;
  var educationalStatus = params.educationalStatus;
  var bloodGroup = params.bloodGroup;
  var constellation = params.constellation;
  var hometown = params.hometown;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  self.store.getUser({req:req,userId:userId,userFields:['userId','gender','studentNO']},function(err,userObj){
      if (err) return callback(err);
      if (!userObj || !userObj.userId){
        var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
        return callback(err);
      }
//      if (studentNO && userObj.studentNO && (studentNO != userObj.studentNO)){
//        var err = self.newError({errorKey:'studentNOCanNotChange',messageParams:[],messagePrefix:messagePrefix,req:req});
//        return self.handleError({err:err,req:req,res:res});
//      }
      var updUser = {};
      if (height !== undefined) updUser.height = height;
      //if (studentNO !== undefined) updUser.studentNO = studentNO;
      if (department !== undefined) updUser.department = department;
      if (description !== undefined) updUser.description = description;
      if (educationalStatus !== undefined) updUser.educationalStatus = educationalStatus;
      if (bloodGroup !== undefined) updUser.bloodGroup = bloodGroup;
      if (constellation !== undefined) updUser.constellation = constellation;
      if (hometown !== undefined) updUser.hometown = hometown;

      if (handy.objectHasNoField(updUser))  return callback(null);

      self.store.updateUser({req:req,userId:userId,updateFields:updUser},function(err){
        if (err) return callback(err);
        return callback(null);
      });//updateUser
  });//store.getUser
};//_updateProfileForTextField




/**
*
* @param req - contains userId, latlng, region, dateDate, whoPay, money, monetaryunit, description,
* @param res
* @returns
*   {status:success|fail,result:{dateId}}
*/
Server.prototype.updateProfileWithPhoto = function(req, res) {
  var self = this;
  //logger.logDebug("Server.updateProfileWithPhoto entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.updateProfileWithPhoto, ';

  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }

  var imgWidth = req.body.imgWidth;
  var imgHeight  = req.body.imgHeight ;
  var imageFile = null;
  if (req.files && req.files.image) imageFile = req.files.image;
  var notUploadReally = req.body.notUploadReally;
  notUploadReally = handy.convertToBool(notUploadReally);
  self._uploadPhoto({allowNoFile:true,imageFile:imageFile,userId:userId,
  width:imgWidth,height:imgHeight ,notUploadReally:notUploadReally,setPrimary:true}, function(err,uploadPhotoInfo){
    if (err) return self.handleError({err:err,req:req,res:res});
    //var photoId = null;
    //if (uploadPhotoInfo) photoId = uploadPhotoInfo.photoId;
    var paramsUpdateProfile =  {userId:userId};
    tool.copyFields({srcObj:req.body, destObj:paramsUpdateProfile});
    paramsUpdateProfile.req = req;
    self._updateProfileForTextField(paramsUpdateProfile, function(err){
      if (err) return self.handleError({err:err,req:req,res:res});
      var httpRetData = {status:'success'};
      if (uploadPhotoInfo && uploadPhotoInfo.photoId) httpRetData.result = uploadPhotoInfo;
      self.returnDataFromResponse({res:res,req:req,data:httpRetData});
      return;
    });//_updateProfileForTextField
  });//_uploadPhoto
};//updateProfileWithPhoto


/**
*
* @param req - contains userId, targetUserId, cutOffTime(optional), count(optional)
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.getPhotos = function(req, res) {
  var self = this;
  //logger.logDebug("Server.getPhotos entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.getPhotos, ';
  if (!req.body.targetUserId){
    var err = self.newError({errorKey:'needParameter',messageParams:['targetUserId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var targetUserId = req.body.targetUserId;
  var cutOffTime = req.body.cutOffTime;
  var count = req.body.count;
  if (count == null)
    count = config.config.photosCount;

  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }

  var getSelf = false;
  if (userId == targetUserId)
    getSelf = true;
  self.store.getUser({req:req,userId:userId,userFields:['userId']},function(err,userObj){
    if (err) return self.handleError({err:err,req:req,res:res});
    if (!userObj || !userObj.userId){
      var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
      if (err) return self.handleError({err:err,req:req,res:res});
    }
    self.store.getUserPhotos({req:req,userId:targetUserId,getSelf:getSelf,cutOffTime:cutOffTime,count:count,
      photoFields:['photoId', 'photoPath','width','height', 'likeCount', 'createTime','state'],userIdToCheckAlreadyLikedPhoto:userId},function(err,photos){
        if (err) return self.handleError({err:err,req:req,res:res});
        var httpRetData = {status:'success'};
        if (!photos || photos.length == 0){
          self.returnDataFromResponse({res:res,req:req,data:httpRetData});
          return;
        }
        httpRetData.result = {photos:photos};
        logger.logDebug("Server.getPhotos exited, httpRetData="+util.inspect(httpRetData,false,100));
        self.returnDataFromResponse({res:res,req:req,data:httpRetData});
        return;
      });//store.getUserPhotos
  });//getUser
};//getPhotos

/**
*
* @param req - contains userId, photoId
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.getPhoto = function(req, res) {
  var self = this;
  //logger.logDebug("Server.getPhoto entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.getPhoto, ';
  if (!req.body.photoId){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var photoId = req.body.photoId;
  self.store.getPhoto({req:req,photoId:photoId,photoFields:['photoId', 'photoPath','width','height', 'likeCount', 'state']},function(err, photoObj){
    if (err) return self.handleError({err:err,req:req,res:res});
    if (!photoObj || !photoObj.photoId){
      var err = self.newError({errorKey:'photoNotExist',messageParams:[photoId],messagePrefix:messagePrefix,req:req});
      if (err) return self.handleError({err:err,req:req,res:res});
    }
    self.store.alreadyLikedPhoto({req:req,photoId:photoId,userId:userId},function(err,alreadyLiked){
      if (err) return self.handleError({err:err,req:req,res:res});
      photoObj.alreadyLiked = alreadyLiked;
      var httpRetData = {status:'success',result:photoObj};
      self.returnDataFromResponse({res:res,req:req,data:httpRetData});
      return;
    });//store.alreadyLikedPhoto
  });//store.getPhoto
};//getPhoto


/**
*
* @param req - contains userId, targetUserId, description
* @param res
* @returns
*   {status:success|fail,result:{reportId}}
*/
Server.prototype.reportUser = function(req, res) {
  var self = this;
  //logger.logDebug("Server.reportUser entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.reportUser, ';
  if (!req.body.targetUserId){
    var err = self.newError({errorKey:'needParameter',messageParams:['targetUserId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.description){
    var err = self.newError({errorKey:'needParameter',messageParams:['description'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var targetUserId = req.body.targetUserId;
  var description = req.body.description;
  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  self.store.getUsers({req:req,userIds:[userId,targetUserId],userFields:['userId']},function(err,users){
    if (err) return self.handleError({err:err,req:req,res:res});
    var userObj = users[0];
    var targetUserObj = users[1];
    if (!userObj || !userObj.userId){
      var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
      if (err) return self.handleError({err:err,req:req,res:res});
    }
    if (!targetUserObj || !targetUserObj.userId){
      var err = self.newError({errorKey:'userNotExist',messageParams:[targetUserId],messagePrefix:messagePrefix,req:req});
      if (err) return self.handleError({err:err,req:req,res:res});
    }
    self.store.createReport({req:req,reporterId:userId,reporteeId:targetUserId,description:description},function(err, reportObj){
      if (err) return self.handleError({err:err,req:req,res:res});
      var httpRetData = {status:'success',result:{reportId:reportObj.reportId}};
      self.returnDataFromResponse({res:res,req:req,data:httpRetData});
      return;
    });//store.createReport
  });//getUsers
};//reportUser





/**
*
* @param req - contains userId, latlng, region, dateDate, whoPay, money, monetaryunit, description,
* @param res
* @returns
*   {status:success|fail,result:{dateId}}
*/
Server.prototype.createDate = function(req, res) {
  var self = this;
  //logger.logDebug("Server.createDate entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.createDate, ';
  var userId = req.session.userId;
  var params = {req:req,userId:userId};
  tool.copyFields({srcObj:req.body, destObj:params});
  self._createDate(params,function(err,createDateInfo){
    if (err) return self.handleError({err:err,req:req,res:res});
    var httpRetData = {status:'success',result:createDateInfo};
    self.returnDataFromResponse({res:res,req:req,data:httpRetData});
  });//_createDate
};//createDate


/**
*
* @param params - contains userId, dateDate, address, whoPay, wantPersonCount, title, description, photoId.
* @param callback - is function(err,createDateInfo)
*   createDateInfo contains dateId, notificationErrInfo, statErr
*/
Server.prototype._createDate = function(params, callback) {
  var self = this;
  logger.logDebug("Server._createDate entered, params="+util.inspect(params,false,100));
  var messagePrefix = 'in Server._createDate, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
//  if (!params.geolibType){
//    var err = self.newError({errorKey:'needParameter',messageParams:['geolibType'],messagePrefix:messagePrefix,req:req});
//    return callback(err);
//  }
//  if (!params.latlng){
//    var err = self.newError({errorKey:'needParameter',messageParams:['latlng'],messagePrefix:messagePrefix,req:req});
//    return callback(err);
//  }
//  if (!params.region){
//    var err = self.newError({errorKey:'needParameter',messageParams:['region'],messagePrefix:messagePrefix,req:req});
//    return callback(err);
//  }
  if (!params.dateDate){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateDate'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.address){
    var err = self.newError({errorKey:'needParameter',messageParams:['address'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (params.whoPay == null){
    var err = self.newError({errorKey:'needParameter',messageParams:['whoPay'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.wantPersonCount){
    var err = self.newError({errorKey:'needParameter',messageParams:['wantPersonCount'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.existPersonCount){
    var err = self.newError({errorKey:'needParameter',messageParams:['existPersonCount'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.title){
    var err = self.newError({errorKey:'needParameter',messageParams:['title'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.description){
    var err = self.newError({errorKey:'needParameter',messageParams:['description'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }

  var userId = params.userId;
//  var geolibType = params.geolibType;
//  var latlng = params.latlng;
//  var region = params.region;
  var dateDate = params.dateDate;
  var address = params.address;
  var whoPay = params.whoPay;
  var wantPersonCount = params.wantPersonCount;
  var existPersonCount = params.existPersonCount;
  var title = params.title;
  var description = params.description;
  var photoId = params.photoId;
  self.store.getUser({req:req,userId:userId,userFields:['userId','primaryPhotoId','name','gender','school','beMade']},function(err,userObj){
    if (err) return self.handleError({err:err,req:req,res:res});
    if (!userObj || !userObj.userId){
      var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
      return callback(err);
    }
    if (!userObj.primaryPhotoId){
      var err = self.newError({errorKey:'noPriviledgeForNoAuditPassedPhoto',messageParams:[],messagePrefix:messagePrefix,req:req});
      return callback(err);
    }
    var userBeMade = handy.convertToBool(userObj.beMade);

//    self._updateLocation({req:req,userId:userId,userBeMade:userBeMade,latlng:latlng,region:region,geolibType:geolibType}, function(err,updateLocationRelateInfo){
//      if (err) return callback(err);

      var createTime = handy.getNowOfUTCdate().getTime();
      self.store.createDate({req:req,senderId:userId, //latlng:latlng, region:region, geolibType:geolibType,
      dateDate:dateDate, address:address, whoPay:whoPay, wantPersonCount:wantPersonCount, existPersonCount:existPersonCount,
      title:title, description:description, userGender:userObj.gender, userBeMade:userBeMade, photoId:photoId,
      school:userObj.school},function(err, dateObj){
        if (err) return callback(err);
        var dateId = dateObj.dateId;
        var outData = {dateId:dateId};
        if (userBeMade){
          //not add to solr, not update stat
          return callback(null,outData);
        }

        //as the range of nearby become to same school, solr search Not needed
        //self.solrClient.addDateToQueue({dateObj:dateObj,userObj:userObj},function(){});

        function sendNotificationToNearbyUser(params,cbFun){
          return cbFun(null,null);//may not need this function
//          var dateObj = params.dateObj;
//          var userObj = params.userObj;
//          var distance = config.config.distanceForNearbyUserToSendNotification;
//          var countForNearbyUser = config.config.countForNearbyUserToSendNotification;
//          var targetGender = handy.getTargetGender(userObj.gender);
//          self.solrClient.queryNearbyUserIdsInDistance({pointLatLon:latlng, distance:distance, gender:targetGender,
//          start:0, count:countForNearbyUser, region:region,geolibType:geolibType},function(err,usersInfo){
//            if (err) return cbFun(err);
//            if (!usersInfo || !usersInfo.userIds) return cbFun(null);
//            var userIds = usersInfo.userIds;
//            self.notification.sendNotificationForSendDate({userIds:userIds,dateId:dateObj.dateId,senderId:dateObj.senderId,senderName:userObj.name},function(errorInfo,sendInfos){
//              var outData = {userIds:userIds};
//              if (errorInfo)  outData.notificationErrInfo = errorInfo;
//              return cbFun(null,outData);
//            });//notification.sendNotificationForSendDate
//          });//queryNearbyUserIdsInDistance
        };//sendNotificationToNearbyUser

        sendNotificationToNearbyUser({dateObj:dateObj,userObj:userObj},function(err,sendInfo){
          if (err) return callback(err);
          if (sendInfo && sendInfo.notificationErrInfo) outData.notificationErr = sendInfo.notificationErrInfo;

          //update date stat for create date
          self.store.updateDateStat({req:req,createUserGender:userObj.gender, createTime:createTime},function(err){
            //logger.logDebug("Server.createDate , after updateDateStat");
            var statErr = err;
            if (statErr) outData.statErr = statErr;
            //logger.logDebug("Server.createDate , after updateDateStat, httpRetData="+util.inspect(httpRetData,false,100));
            return callback(null,outData);
          });//updateDateStat
          return;
        });//sendNotificationToNearbyUser
      });//store.createDate
//    });//_updateLocation
  });//getUser
};//_createDate


/**
*
* @param req - contains userId, latlng, region, dateDate, whoPay, money, monetaryunit, description,
* @param res
* @returns
*   {status:success|fail,result:{dateId}}
*/
Server.prototype.createDateWithPhoto = function(req, res) {
  var self = this;
  //logger.logDebug("Server.createDateWithPhoto entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.createDateWithPhoto, ';
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }

  var width = req.body.width;
  var height = req.body.height;
  var imageFile = null;
  if (req.files && req.files.image) imageFile = req.files.image;
  var notUploadReally = req.body.notUploadReally;
  notUploadReally = handy.convertToBool(notUploadReally);
  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  self._uploadPhoto({allowNoFile:true,imageFile:imageFile,userId:userId,width:width,height:height,notUploadReally:notUploadReally}, function(err,uploadPhotoInfo){
    if (err) return self.handleError({err:err,req:req,res:res});
    var photoId = null;
    if (uploadPhotoInfo) photoId = uploadPhotoInfo.photoId;
    var paramsCreateDate = {userId:userId, photoId:photoId};
    tool.copyFields({srcObj:req.body, destObj:paramsCreateDate});
    self._createDate(paramsCreateDate,function(err,createDateInfo){
      if (err) return self.handleError({err:err,req:req,res:res});
      var resultObj = tool.cloneObject(createDateInfo);
      if (uploadPhotoInfo) resultObj.photoId = photoId;

      var httpRetData = {status:'success',result:resultObj};
      self.returnDataFromResponse({res:res,req:req,data:httpRetData});
    });//_createDate
  });//_uploadPhoto
};//createDateWithPhoto


/**
*
* @param req - contains userId, type(onlyActiveSend| applying| invited),
*   getDataDirection(optional, fromEarlyToLate | fromLateToEarly, default value is fromLateToEarly),
*   cutOffTime(optional), count
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.getDates = function(req, res) {
  var self = this;
  //logger.logDebug("Server.getDates entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.getDates, ';
  if (!req.body.type){
    var err = self.newError({errorKey:'needParameter',messageParams:['type'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var type = req.body.type;
  var count = req.body.count;
  var getDataDirection = req.body.getDataDirection;
  var cutOffTime = req.body.cutOffTime;
  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }

  if (!count)  count = config.config.datesCount;
  if (!getDataDirection) getDataDirection = 'fromLateToEarly';
  if (type != 'onlyActiveSend' && type != 'applying' && type != 'invited'){
    var err = self.newError({errorKey:'unsupportedValueForParam',messageParams:[type,'type'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (type == 'invited'){
    getDataDirection = 'fromEarlyToLate';
  }

  self.store.getUser({req:req,userId:userId,userFields:['userId','name','primaryPhotoId'],needPrimaryPhoto:true},function(err,userObj){
    if (err) return self.handleError({err:err,req:req,res:res});
    if (!userObj || !userObj.userId){
      var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
      if (err) return self.handleError({err:err,req:req,res:res});
    }
    self.store.getUserDatesWithDetail({req:req,userId:userId, dateType:type,
      count:count,cutOffTime:cutOffTime,start:null,
      getDataDirection:getDataDirection,excludeExpired:null,
      dateFields:['dateId', 'createTime', 'senderId', 'dateDate', 'whoPay',//'latlng', 'region', 'countyLocation',
                  'address', 'wantPersonCount', 'existPersonCount', 'title', 'description'],
      needPhoto:true, needSender:true, sendUserFields:['userId', 'name', 'primaryPhotoId'],
      needDateResponderCount:true, needResponders:true,
      responderFields:['dateId','responderId','senderConfirmed'],responderUserFields:['userId', 'name', 'primaryPhotoId'],
      needRespondTime:null,
      needLatestMessage:true, messageFields:['messageId',  'messageText', 'senderId', 'receiverId', 'createTime'],
      needPrimaryPhoto:true, primaryPhotoFields:['photoId','photoPath']
      },
      function(err,dates){
        if (err) return self.handleError({err:err,req:req,res:res});
        var dateCount = 0;
        if (!dates || dates.length == 0){
          var httpRetData = {status:'success',result:{user:userObj,dateCount:dateCount}};
          self.returnDataFromResponse({res:res,req:req,data:httpRetData});
          return;
        }
        dateCount = dates.length;
        var httpRetData = {status:'success',result:{user:{userId:userId,primaryPhotoPath:userObj.primaryPhotoPath},dates:dates,dateCount:dateCount}};
        logger.logDebug("Server.getDates exited, httpRetData="+util.inspect(httpRetData,false,100));
        self.returnDataFromResponse({res:res,req:req,data:httpRetData});
        return;
    });//store.getUserDatesWithDetail
  });//getUser
};//getDates




/**
*
* @param req - contains latlng, region, geolibType, targetGender(optional), start, count,
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.getNearbyDates = function(req, res) {
  var self = this;
  //logger.logDebug("Server.getNearbyDates entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.getNearbyDates, ';

//  if (!req.body.latlng){
//    var err = self.newError({errorKey:'needParameter',messageParams:['latlng'],messagePrefix:messagePrefix,req:req});
//    return self.handleError({err:err,req:req,res:res});
//  }
//  if (!req.body.region){
//    var err = self.newError({errorKey:'needParameter',messageParams:['region'],messagePrefix:messagePrefix,req:req});
//    return self.handleError({err:err,req:req,res:res});
//  }
//  if (!req.body.geolibType){
//    var err = self.newError({errorKey:'needParameter',messageParams:['geolibType'],messagePrefix:messagePrefix,req:req});
//    return self.handleError({err:err,req:req,res:res});
//  }
  if (req.body.start == null){
    var err = self.newError({errorKey:'needParameter',messageParams:['start'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.count){
    var err = self.newError({errorKey:'needParameter',messageParams:['count'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }

//  var latlng = req.body.latlng;
//  var region = req.body.region;
//  var geolibType = req.body.geolibType;
//  var targetGender = req.body.targetGender;
  var cutOffTime = req.body.cutOffTime;
  var start = req.body.start;
  var count = req.body.count;

  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront && userId && userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }

  if (!userId){
      self.store.getSchoolDates({req:req,school:null,gender:null,
      cutOffTime:cutOffTime,start:start,count:count,getDataDirection:'fromEarlyToLate',excludeExpired:true,scoreBeInflectionTime:true,
      dateFields:['dateId', 'senderId', 'createTime', //'latlng', 'region', 'geolibType', 'countyLocation',
                  'dateDate', 'whoPay', 'address', 'wantPersonCount', 'existPersonCount', 'title', 'description'],
      needPhoto:true,
      needSender:true,sendUserFields:['userId', 'name', 'primaryPhotoId'],
      needResponders:false,needRespondTime:false,needLatestMessage:false,
      needPrimaryPhoto:true,primaryPhotoFields:['photoId','photoPath']},function(err,dates){
        if (err) return self.handleError({err:err,req:req,res:res});
        var httpRetData = {status:'success'};
        var dateCount = 0;
        if (dates && dates.length>0){
          dateCount = dates.length;
          httpRetData.result = {dates:dates,dateCount:dateCount};
        }
        //logger.logDebug("Server.getNearbyDates exited, httpRetData="+util.inspect(httpRetData,false,100));
        self.returnDataFromResponse({res:res,req:req,data:httpRetData});
        return;
      });//getSchoolDates
      return;
  }else{
    self.store.getUser({req:req,userId:userId,userFields:['userId','name','gender','school'],needPrimaryPhoto:true},function(err,userObj){
      if (err) return self.handleError({err:err,req:req,res:res});
      if (!userObj || !userObj.userId){
        var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
        return self.handleError({err:err,req:req,res:res});
      }
      //targetGender = handy.getTargetGender(userObj.gender);
      var school = userObj.school;
      self.store.getSchoolDates({req:req,school:school,gender:null,
      cutOffTime:cutOffTime,start:start,count:count,getDataDirection:'fromEarlyToLate',excludeExpired:true,scoreBeInflectionTime:true,
      dateFields:['dateId', 'senderId', 'createTime', 'latlng', 'region', 'geolibType', 'countyLocation',
                  'dateDate', 'whoPay', 'address', 'wantPersonCount', 'existPersonCount', 'title', 'description'],
      needPhoto:true,
      needSender:true,sendUserFields:['userId', 'name', 'primaryPhotoId'],
      needResponders:false,needRespondTime:false,needLatestMessage:false,
      needPrimaryPhoto:true,primaryPhotoFields:['photoId','photoPath']},function(err,dates){
        if (err) return self.handleError({err:err,req:req,res:res});
        var httpRetData = {status:'success'};
        var dateCount = 0;
        if (dates && dates.length>0){
          dateCount = dates.length;
          httpRetData.result = {dates:dates,dateCount:dateCount};
        }
        //logger.logDebug("Server.getNearbyDates exited, httpRetData="+util.inspect(httpRetData,false,100));
        self.returnDataFromResponse({res:res,req:req,data:httpRetData});
        return;
      });//getSchoolDates
    });//getUser
    return;
  }
};//getNearbyDates


/**
*
* @param req - contains cutOffTime(optional), count, getDataDirection(optional, fromEarlyToLate | fromLateToEarly, default be fromLateToEarly)
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.getDateConversations = function(req, res) {
  var self = this;
  //logger.logDebug("Server.getDateConversations entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.getDateConversations, ';

  if (!(req.body.count>0)){
    var err = self.newError({errorKey:'needParameter',messageParams:['count>0'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var count = req.body.count;
  var cutOffTime = req.body.cutOffTime;
  var getDataDirection = req.body.getDataDirection;
  if (!getDataDirection) getDataDirection = 'fromLateToEarly';

  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  self.store.getUser({req:req,userId:userId,userFields:['userId','primaryPhotoId'],
  needPrimaryPhoto:true,primaryPhotoFields:['userId','photoPath']},function(err,userObj){
    if (err) return self.handleError({err:err,req:req,res:res});
     if (!userObj || !userObj.userId){
       var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
       if (err) return self.handleError({err:err,req:req,res:res});
     }
     self.store.getUserDateConversations({req:req,userId:userId, count:count, cutOffTime:cutOffTime, start:null, getDataDirection:getDataDirection, excludeExpired:null,
     dateFields:['dateId','senderId','createTime','latlng','region', 'geolibType', 'countyLocation',
                 'dateDate', 'whoPay', 'money', 'monetaryunit', 'title', 'description', 'finalCandidateId'],
     userFields:['userId','name','primaryPhotoId'],
     messageFields:['messageId',  'messageText', 'senderId', 'createTime', 'receiverId'],
     needPrimaryPhoto:true,primaryPhotoFields:['userId','photoPath']},function(err,conversations){
       if (err) return self.handleError({err:err,req:req,res:res});
       var httpRetData = {status:'success'};
       if (!conversations || conversations.length == 0){
         self.returnDataFromResponse({res:res,req:req,data:httpRetData});
         return;
       }
       httpRetData.result = {conversations:conversations};
       logger.logDebug("Server.getDateConversations exited, httpRetData="+util.inspect(httpRetData,false,100));
       self.returnDataFromResponse({res:res,req:req,data:httpRetData});
       return;
     });//getUserDateConversations
  });//getUsers
};//getDateConversations



/**
*
* @param req - contains userId, dateId, targetUserId, cutOffTime(optional), count(optional),
*     getDataDirection(optional, fromEarlyToLate | fromLateToEarly, default be fromLateToEarly)
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.getMessageHistory = function(req, res) {
  var self = this;
  //logger.logDebug("Server.getMessageHistory entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.getMessageHistory, ';
  if (!req.body.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.targetUserId){
    var err = self.newError({errorKey:'needParameter',messageParams:['targetUserId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }

  var dateId = req.body.dateId;
  var targetUserId = req.body.targetUserId;
  var cutOffTime = req.body.cutOffTime;
  var getDataDirection = req.body.getDataDirection;
  var count = req.body.count;
  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (count == null)
    count = config.config.messagesCount;
  if (!getDataDirection) getDataDirection = 'fromLateToEarly';
  self.store.getUsers({req:req,userIds:[userId,targetUserId],userFields:['userId']},function(err,userObjs){
    if (err) return self.handleError({err:err,req:req,res:res});
    var userObj = userObjs[0];
    var targetUserObj = userObjs[1];
     if (!userObj || !userObj.userId){
       var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
       if (err) return self.handleError({err:err,req:req,res:res});
     }
     if (!targetUserObj || !targetUserObj.userId){
       var err = self.newError({errorKey:'userNotExist',messageParams:[targetUserId],messagePrefix:messagePrefix,req:req});
       if (err) return self.handleError({err:err,req:req,res:res});
     }
     self.store.getDate({req:req,dateId:dateId,dateFields:['dateId', 'senderId']},function(err,dateObj){
       if (err) return self.handleError({err:err,req:req,res:res});
       if (!dateObj || !dateObj.dateId){
         var err = self.newError({errorKey:'dateNotExist',messageParams:[dateId],messagePrefix:messagePrefix,req:req});
         if (err) return self.handleError({err:err,req:req,res:res});
       }
       var dateSenderId, dateResponderId;
       if (userId == dateObj.senderId){
         dateSenderId = userId;
         dateResponderId = targetUserId;
       }else{
         dateSenderId = targetUserId;
         dateResponderId = userId;
       }
       self.store.getDateMessages({req:req,userId:userId,dateId:dateId,targetUserId:targetUserId,cutOffTime:cutOffTime,count:count,
         getDataDirection:getDataDirection, resultOrderType:"natural",
         messageFields:['messageId',  'messageText', 'senderId', 'createTime'],
         userFields:['userId','name','primaryPhotoId'],needPrimaryPhoto:true,primaryPhotoFields:['userId','photoPath']
         },
         function(err,messages){
           if (err) return self.handleError({err:err,req:req,res:res});
           self.store.setDateConversationViewed({req:req,dateId:dateId, userId:userId, targetUserId:targetUserId, dateSenderId:dateSenderId, dateResponderId:dateResponderId},function(err){
             if (err) return self.handleError({err:err,req:req,res:res});

             var httpRetData = {status:'success'};
             if (messages && messages.length > 0){
               httpRetData.result = {messages:messages};
             }
             logger.logDebug("Server.getMessageHistory exited, httpRetData="+util.inspect(httpRetData,false,100));
             self.returnDataFromResponse({res:res,req:req,data:httpRetData});
             return;
           });//store.setDateConversationViewed
       });//store.getDateMessages
     });//getDate
  });//getUsers
};//getMessageHistory


/**
*
*
* @param req - contains userId, dateId, targetUserId, messageId
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.getMessage = function(req, res) {
  var self = this;
  //logger.logDebug("Server.getMessage entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.getMessage, ';
  if (!req.body.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.targetUserId){
    var err = self.newError({errorKey:'needParameter',messageParams:['targetUserId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.messageId){
    var err = self.newError({errorKey:'needParameter',messageParams:['messageId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var dateId = req.body.dateId;
  var targetUserId = req.body.targetUserId;
  var messageId = req.body.messageId;
  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  self.store.getUsers({req:req,userIds:[userId,targetUserId],userFields:['userId']},function(err,userObjs){
    if (err) return self.handleError({err:err,req:req,res:res});
    var userObj = userObjs[0];
    var targetUserObj = userObjs[1];
     if (!userObj || !userObj.userId){
       var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
       if (err) return self.handleError({err:err,req:req,res:res});
     }
     if (!targetUserObj || !targetUserObj.userId){
       var err = self.newError({errorKey:'userNotExist',messageParams:[targetUserId],messagePrefix:messagePrefix,req:req});
       if (err) return self.handleError({err:err,req:req,res:res});
     }
     self.store.getDate({req:req,dateId:dateId,dateFields:['dateId']},function(err,dateObj){
       if (err) return self.handleError({err:err,req:req,res:res});
       if (!dateObj || !dateObj.dateId){
         var err = self.newError({errorKey:'dateNotExist',messageParams:[dateId],messagePrefix:messagePrefix,req:req});
         if (err) return self.handleError({err:err,req:req,res:res});
       }

       self.store.getDateMessages({req:req,userId:userId,dateId:dateId,targetUserId:targetUserId,givenMessageIds:[messageId],
         messageFields:['messageId',  'messageText', 'senderId', 'createTime'],
         userFields:['userId','name','primaryPhotoId'],needPrimaryPhoto:true,primaryPhotoFields:['userId','photoPath']
         },
         function(err,messages){
           if (err) return self.handleError({err:err,req:req,res:res});
           if (!messages || messages.length == 0){
             var err = self.newError({errorKey:'noSuchIdMessage',messageParams:[messageId],messagePrefix:messagePrefix,req:req});
             return self.handleError({err:err,req:req,res:res});
           }
           var httpRetData = {status:'success',result:messages[0]};
           logger.logDebug("Server.getMessage exited, httpRetData="+util.inspect(httpRetData,false,100));
           self.returnDataFromResponse({res:res,req:req,data:httpRetData});
           return;
       });//store.getDateMessages
     });//getDate
  });//getUsers
};//getMessage



/**
*
*
* @param req - contains userId, dateId, targetUserId, messageText
* @param res
* @returns
*   {status:success|fail,result:{messageId,createTime, notificationErr,  }}
*/
Server.prototype.sendMessage = function(req, res) {
  var self = this;
  //logger.logDebug("Server.sendMessage entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.sendMessage, ';
  if (!req.body.messageText){
    var err = self.newError({errorKey:'needParameter',messageParams:['messageText'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.targetUserId){
    var err = self.newError({errorKey:'needParameter',messageParams:['targetUserId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var messageText = req.body.messageText;
  var dateId = req.body.dateId;
  var targetUserId = req.body.targetUserId;
  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (userId == targetUserId){
    var err = self.newError({errorKey:'canNotSendMessageToSelf',messageParams:[],messagePrefix:messagePrefix,req:req});
    if (err) return self.handleError({err:err,req:req,res:res});
  }
  self.store.getUsers({req:req,userIds:[userId,targetUserId],userFields:['userId','name','gender'],needAuditPassedPhotoCount:true},function(err,userObjs){
    if (err) return self.handleError({err:err,req:req,res:res});
    var userObj = userObjs[0];
    var targetUserObj = userObjs[1];
    if (!userObj || !userObj.userId){
      var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
      if (err) return self.handleError({err:err,req:req,res:res});
    }
    if (!targetUserObj || !targetUserObj.userId){
      var err = self.newError({errorKey:'userNotExist',messageParams:[targetUserId],messagePrefix:messagePrefix,req:req});
      if (err) return self.handleError({err:err,req:req,res:res});
    }
    if (userObj.auditPassedPhotoCount == 0){
      var err = self.newError({errorKey:'noPriviledgeForNoAuditPassedPhoto',messageParams:[],messagePrefix:messagePrefix,req:req});
      return self.handleError({err:err,req:req,res:res});
    }
    self.store.getDate({req:req,dateId:dateId,dateFields:['dateId','senderId']},function(err,dateObj){
      if (err) return self.handleError({err:err,req:req,res:res});
      if (!dateObj || !dateObj.dateId){
        var err = self.newError({errorKey:'dateNotExist',messageParams:[dateId],messagePrefix:messagePrefix,req:req});
        if (err) return self.handleError({err:err,req:req,res:res});
      }
      if (dateObj.senderId != userId && dateObj.senderId!=targetUserId){
        var err = self.newError({errorKey:'dateCreatorNotInConversation',messageParams:[],messagePrefix:messagePrefix,req:req});
        if (err) return self.handleError({err:err,req:req,res:res});
      }
//      var alreadyStopped = handy.convertToBool(dateObj.alreadyStopped);
//      if (alreadyStopped){
//        var err = self.newError({errorKey:'dateAlreadyStopped',messageParams:[],messagePrefix:messagePrefix,req:req});
//        return self.handleError({err:err,req:req,res:res});
//      }
      var dateSenderId, dateResponderId;
      if (userId == dateObj.senderId){
        dateSenderId = userId;
        dateResponderId = targetUserId;
      }else{
        dateSenderId = targetUserId;
        dateResponderId = userId;
      }
      self.store.sendMessageBusiness({req:req,messageText:messageText,dateId:dateId,userId:userId,targetUserId:targetUserId,
      dateSenderId:dateSenderId,dateResponderId:dateResponderId}, function(err,sendMsgInfo){
          if (err) return self.handleError({err:err,req:req,res:res});
          var messageId = sendMsgInfo.messageObj.messageId;
          var createTime = sendMsgInfo.messageObj.createTime;
          self.store.setDateConversationViewed({req:req,dateId:dateId, userId:userId, targetUserId:targetUserId, dateSenderId:dateSenderId, dateResponderId:dateResponderId},function(err){
            if (err) return self.handleError({err:err,req:req,res:res});
            var httpRetData = {status:'success',result:{messageId:messageId,createTime:createTime}};
            self.notification.sendNotificationForSendMessage({targetUserId:targetUserId,dateId:dateId,
              dateSenderId:dateSenderId, dateResponderId:dateResponderId,
              senderId:userId,senderName:userObj.name,
              messageId:messageId,createTime:createTime,messageText:messageText},function(err,sendNotificationInfo){
              if (err)  httpRetData.result.notificationErr = err;
              //logger.logDebug("Server.sendMessage exited, httpRetData="+util.inspect(httpRetData,false,100));
              self.returnDataFromResponse({res:res,req:req,data:httpRetData});
              return;
            });//notification.sendNotificationForSendMessage
            return;
          });//store.setDateConversationViewed
          return;
      });//store.sendMessageBusiness
      return;
    });//getDate
  });//getUsers
};//sendMessage





/**
*
*
* @param req - contains userId, dateId, targetUserId
* @param res
* @returns
*   {status:success|fail,result:{}}
*/
Server.prototype.setDateConversationViewed = function(req, res) {
  var self = this;
  //logger.logDebug("Server.setDateConversationViewed entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.setDateConversationViewed, ';
  if (!req.body.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.targetUserId){
    var err = self.newError({errorKey:'needParameter',messageParams:['targetUserId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var dateId = req.body.dateId;
  var targetUserId = req.body.targetUserId;
  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  self.store.getUsers({req:req,userIds:[userId,targetUserId],userFields:['userId','primaryPhotoId','name','gender','credit']},function(err,userObjs){
    if (err) return self.handleError({err:err,req:req,res:res});
    var userObj = userObjs[0];
    var targetUserObj = userObjs[1];
    if (!userObj || !userObj.userId){
      var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
      if (err) return self.handleError({err:err,req:req,res:res});
    }
    if (!targetUserObj || !targetUserObj.userId){
      var err = self.newError({errorKey:'userNotExist',messageParams:[targetUserId],messagePrefix:messagePrefix,req:req});
      if (err) return self.handleError({err:err,req:req,res:res});
    }
    if (!userObj.primaryPhotoId){
      var err = self.newError({errorKey:'noPriviledgeForNoAuditPassedPhoto',messageParams:[],messagePrefix:messagePrefix,req:req});
      return self.handleError({err:err,req:req,res:res});
    }
    self.store.getDateAndResponderInfo({req:req,dateId:dateId, userId:userId, targetUserId:targetUserId},function(err,dateAndResponderInfo){
      if (err) return self.handleError({err:err,req:req,res:res});
      var dateSenderId = dateAndResponderInfo.dateObj.senderId;
      var dateResponderId = dateAndResponderInfo.repsonderObj.responderId;
      self.store.setDateConversationViewed({req:req,dateId:dateId, userId:userId, targetUserId:targetUserId, dateSenderId:dateSenderId, dateResponderId:dateResponderId},function(err){
        if (err) return self.handleError({err:err,req:req,res:res});
        var httpRetData = {status:'success'};
        self.returnDataFromResponse({res:res,req:req,data:httpRetData});
        return;
      });//store.setDateConversationViewed
      return;
    });//store.getDateAndResponderInfo
  });//getUsers
};//setDateConversationViewed






/**
*
*
* @param req - contains userId, dateId, targetUserId
* @param res
* @returns
*   {status:success|fail, result:{confirmTime,
*     notificationErr, sysMessageToResponder:{messageId,createTime} } }
*/
Server.prototype.confirmDate = function(req, res) {
  var self = this;
  //logger.logDebug("Server.confirmDate entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.confirmDate, ';
  if (!req.body.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.targetUserId){
    var err = self.newError({errorKey:'needParameter',messageParams:['targetUserId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var dateId = req.body.dateId;
  var targetUserId = req.body.targetUserId;
  var beCancel = req.body.beCancel;
  beCancel = handy.convertToBool(beCancel);
  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (beCancel){
    self._cancelConfirmDate({req:req,dateId:dateId,userId:userId,targetUserId:targetUserId}, function(err,cancelInfo){
      if (err) return self.handleError({err:err,req:req,res:res});
      var httpRetData = {status:'success',result:cancelInfo};
      self.returnDataFromResponse({res:res,req:req,data:httpRetData});
      return;
    });//_cancelConfirmDate
    return;
  }

  var systemUserId = config.config.users.system.userId;
  self.store.getUsers({req:req,userIds:[userId,targetUserId],userFields:['userId','name','gender','primaryPhotoId']},function(err,users){
      if (err) return self.handleError({err:err,req:req,res:res});
      var userObj = users[0];
      var targetUserObj = users[1];
      if (!userObj || !userObj.userId){
        var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
        if (err) return self.handleError({err:err,req:req,res:res});
      }
      if (!targetUserObj || !targetUserObj.userId){
        var err = self.newError({errorKey:'userNotExist',messageParams:[targetUserId],messagePrefix:messagePrefix,req:req});
        if (err) return self.handleError({err:err,req:req,res:res});
      }
      if (!userObj.primaryPhotoId){
        var err = self.newError({errorKey:'noPriviledgeForNoAuditPassedPhoto',messageParams:[],messagePrefix:messagePrefix,req:req});
        return self.handleError({err:err,req:req,res:res});
      }

      self.store.getDateAndResponderInfo({req:req,dateId:dateId,userId:userId,targetUserId:targetUserId},function(err,dateAndResponderInfo){
        if (err) return self.handleError({err:err,req:req,res:res});
        var dateObj = dateAndResponderInfo.dateObj;
        var repsonderObj = dateAndResponderInfo.repsonderObj;
        if (dateObj.senderId != userId){
          var err = self.newError({errorKey:'onlyCreatorCanConfirmDate',messageParams:[],messagePrefix:messagePrefix,req:req});
          return self.handleError({err:err,req:req,res:res});
        }
        if(repsonderObj && repsonderObj.senderConfirmed){
          var err = self.newError({errorKey:'alreadyConfirmDateResponder',messageParams:[],messagePrefix:messagePrefix,req:req});
          return self.handleError({err:err,req:req,res:res});
        }
        var dateSenderId, dateResponderId;
        dateSenderId = userId;
        dateResponderId = targetUserId;
        //not confirmed yet
        self.store.ConfirmDateByCreator({req:req,dateId:dateId, senderId:userId, responderId:targetUserId,dateDate:dateObj.dateDate},function(err,confirmInfo){
            if (err) return self.handleError({err:err,req:req,res:res});
            var informMessageObjToResponder = shuffle.formatInformMessageDateConfirmToResponder({senderName:userObj.name, responderName:targetUserObj.name});
            if (informMessageObjToResponder.err) return self.handleError({err:informMessageObjToResponder.err,req:req,res:res});
            self.store.sendMessageBusiness({req:req,messageText:informMessageObjToResponder.message, dateId:dateId, userId:systemUserId, targetUserId:targetUserId,
            dateSenderId:dateSenderId,dateResponderId:dateResponderId}, function(err,sendSysMsgInfoToResponder){
              if (err) return self.handleError({err:err,req:req,res:res});

              self.store.updateDateStat({req:req,confirmType:"confirm",confirmTime:confirmInfo.confirmTime},function(err){
                var statErr = err;
                self.notification.sendNotificationForConfirmDate({targetUserId:targetUserId,dateId:dateId,
                  dateSenderId:dateSenderId,
                  senderId:userId,senderName:userObj.name,
                  messageText:informMessageObjToResponder.message, messageId:sendSysMsgInfoToResponder.messageObj.messageId, createTime:sendSysMsgInfoToResponder.messageObj.createTime},function(err,sendInfo){
                    var httpRetData = {status:'success',result:{confirmTime:confirmInfo.confirmTime,
                          sysMessageToResponder:{messageId:sendSysMsgInfoToResponder.messageObj.messageId, createTime:sendSysMsgInfoToResponder.messageObj.createTime}
                        }};
                    if (err)  httpRetData.result.notificationErr = err;
                    if (statErr)  httpRetData.result.statErr = statErr;
                    self.returnDataFromResponse({res:res,req:req,data:httpRetData});
                    return;
                });//notification.sendNotificationForConfirmDate
              });//store.updateDateStat
              return;
            });//store.sendMessageBusiness
            return;
        });//store.ConfirmDateByCreator
        return;
      });//getDateAndResponderInfo
  });//store.getUsers
};//confirmDate


Server.prototype._cancelConfirmDate = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Server._cancelConfirmDate, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.targetUserId){
    var err = self.newError({errorKey:'needParameter',messageParams:['targetUserId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['targetUserId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var userId = params.userId;
  var dateId = params.dateId;
  var targetUserId = params.targetUserId;
  var systemUserId = config.config.users.system.userId;

  self.store.getUsers({req:req,userIds:[userId,targetUserId],userFields:['userId','name','gender','primaryPhotoId']},function(err,users){
      if (err) return callback(err);
      var userObj = users[0];
      var targetUserObj = users[1];
      if (!userObj || !userObj.userId){
        var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
        if (err) return callback(err);
      }
      if (!targetUserObj || !targetUserObj.userId){
        var err = self.newError({errorKey:'userNotExist',messageParams:[targetUserId],messagePrefix:messagePrefix,req:req});
        if (err) return callback(err);
      }
      if (!userObj.primaryPhotoId){
        var err = self.newError({errorKey:'noPriviledgeForNoAuditPassedPhoto',messageParams:[],messagePrefix:messagePrefix,req:req});
        return callback(err);
      }

      self.store.getDateAndResponderInfo({req:req,dateId:dateId,userId:userId,targetUserId:targetUserId},function(err,dateAndResponderInfo){
        if (err) return callback(err);
        var dateObj = dateAndResponderInfo.dateObj;
        var repsonderObj = dateAndResponderInfo.repsonderObj;
        if (dateObj.senderId != userId){
          var err = self.newError({errorKey:'onlyCreatorCanCancelDate',messageParams:[],messagePrefix:messagePrefix,req:req});
          return callback(err);
        }
        if(repsonderObj && !repsonderObj.senderConfirmed){
          var err = self.newError({errorKey:'NotConfirmDateResponder',messageParams:[],messagePrefix:messagePrefix,req:req});
          return callback(err);
        }
        var dateSenderId, dateResponderId;
        dateSenderId = userId;
        dateResponderId = targetUserId;

        self.store.CancelConfirmDateByCreator({req:req,dateId:dateId, senderId:userId, responderId:targetUserId},function(err,confirmInfo){
            if (err) return callback(err);
            var informMessageObjToResponder = shuffle.formatInformMessageDateCancelToResponder({senderName:userObj.name, responderName:targetUserObj.name});
            if (informMessageObjToResponder.err) return callback(informMessageObjToResponder.err);
            self.store.sendMessageBusiness({req:req,messageText:informMessageObjToResponder.message, dateId:dateId, userId:systemUserId, targetUserId:targetUserId,
            dateSenderId:dateSenderId,dateResponderId:dateResponderId}, function(err,sendSysMsgInfoToResponder){
              if (err) return callback(err);

              self.store.updateDateStat({req:req,confirmType:"cancel"},function(err){
                var statErr = err;
                self.notification.sendNotificationForCancelDate({targetUserId:targetUserId,dateId:dateId,
                  senderId:userId,senderName:userObj.name,
                  messageText:informMessageObjToResponder.message, messageId:sendSysMsgInfoToResponder.messageObj.messageId, createTime:sendSysMsgInfoToResponder.messageObj.createTime},function(err,sendInfo){
                    var outData = {
                        sysMessageToResponder:{messageId:sendSysMsgInfoToResponder.messageObj.messageId, createTime:sendSysMsgInfoToResponder.messageObj.createTime}
                    };
                    if (err)  outData.notificationErr = err;
                    if (statErr)  outData.statErr = statErr;

                    return callback(null,outData);
                });//notification.sendNotificationForCancelDate
              });//store.updateDateStat
              return;
            });//store.sendMessageBusiness
            return;
        });//store.ConfirmDateByCreator
        return;
      });//getDateAndResponderInfo
  });//store.getUsers
};//_cancelConfirmDate


/**
*
*
* @param req - contains dateId
* @param res
* @returns
*   {status:success|fail, result:{ } }
*/
Server.prototype.stopDateD = function(req, res) {
  var self = this;
  //logger.logDebug("Server.stopDate entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.stopDate, ';
  if (!req.body.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var userId = req.session.userId;
  var dateId = req.body.dateId;
  self.store.getUser({req:req,userId:userId,userFields:['userId','name','gender','primaryPhotoId']},function(err,userObj){
    if (err) return self.handleError({err:err,req:req,res:res});
    if (!userObj || !userObj.userId){
      var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
      return self.handleError({err:err,req:req,res:res});
    }
    self.store.getDate({req:req,dateId:dateId,dateFields:['dateId','senderId','alreadyStopped']},function(err,dateObj){
      if (err) return self.handleError({err:err,req:req,res:res});
      if (!dateObj || !dateObj.dateId){
        var err = self.newError({errorKey:'dateNotExist',messageParams:[dateId],messagePrefix:messagePrefix,req:req});
        return self.handleError({err:err,req:req,res:res});
      }
      if (userId != dateObj.senderId){
        var err = self.newError({errorKey:'dateNotCreatedByYou',messageParams:[],messagePrefix:messagePrefix,req:req});
        return self.handleError({err:err,req:req,res:res});
      }
      var alreadyStopped = handy.convertToBool(dateObj.alreadyStopped);
      if (alreadyStopped){
        var err = self.newError({errorKey:'dateAlreadyStopped',messageParams:[],messagePrefix:messagePrefix,req:req});
        return self.handleError({err:err,req:req,res:res});
      }
      self.store.stopDate({req:req,dateId:dateId},function(err){
        if (err) return self.handleError({err:err,req:req,res:res});
        var httpRetData = {status:'success'};
        self.returnDataFromResponse({res:res,req:req,data:httpRetData});
        return;
      });//stopDate
    });//getDate
  });//store.getUsers
};//stopDate



/**
*
*
* @param req - contains dateId, targetUserId, type
* @param res
* @returns
*   {status:success|fail, result:{ targetUserGoodRateCount } }
*/
Server.prototype.rate = function(req, res) {
  var self = this;
  //logger.logDebug("Server.rate entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.rate, ';
  if (!req.body.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.targetUserId){
    var err = self.newError({errorKey:'needParameter',messageParams:['targetUserId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.type){
    var err = self.newError({errorKey:'needParameter',messageParams:['type'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var dateId = req.body.dateId;
  var targetUserId = req.body.targetUserId;
  var type = req.body.type;
  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var systemUserId = config.config.users.system.userId;
  self.store.getUsers({req:req,userIds:[userId,targetUserId],userFields:['userId','gender','primaryPhotoId']},function(err,users){
      if (err) return self.handleError({err:err,req:req,res:res});
      var userObj = users[0];
      var targetUserObj = users[1];
      if (!userObj || !userObj.userId){
        var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
        return self.handleError({err:err,req:req,res:res});
      }
      if (!targetUserObj || !targetUserObj.userId){
        var err = self.newError({errorKey:'userNotExist',messageParams:[targetUserId],messagePrefix:messagePrefix,req:req});
        return self.handleError({err:err,req:req,res:res});
      }
      if (!userObj.primaryPhotoId){
        var err = self.newError({errorKey:'noPriviledgeForNoAuditPassedPhoto',messageParams:[],messagePrefix:messagePrefix,req:req});
        return self.handleError({err:err,req:req,res:res});
      }

      self.store.getDateAndResponderInfo({req:req,dateId:dateId,userId:userId,targetUserId:targetUserId},function(err,dateAndResponderInfo){
        if (err) return self.handleError({err:err,req:req,res:res});
        var dateObj = dateAndResponderInfo.dateObj;
        var repsonderObj = dateAndResponderInfo.repsonderObj;
        if (dateObj.senderId != userId && dateObj.senderId!=targetUserId){
          var err = self.newError({errorKey:'dateCreatorNeedInvolve',messageParams:[],messagePrefix:messagePrefix,req:req});
          if (err) return self.handleError({err:err,req:req,res:res});
        }
        if (userId == dateObj.senderId){
          if (repsonderObj.haveBeenRated){
            var err = self.newError({errorKey:'alreadyRateDateResponder',messageParams:[targetUserId],messagePrefix:messagePrefix,req:req});
            return self.handleError({err:err,req:req,res:res});
          }
        }else{//user is date responder
          if (repsonderObj.haveRate){
            var err = self.newError({errorKey:'alreadyRateDateCreator',messageParams:[],messagePrefix:messagePrefix,req:req});
            return self.handleError({err:err,req:req,res:res});
          }
        }
        self.store.RateByDateParticipant({req:req,dateId:dateId,userId:userId,targetUserId:targetUserId,senderId:dateObj.senderId,type:type},function(err,rateInfo){
          if (err) return self.handleError({err:err,req:req,res:res});
          var httpRetData = {status:'success',result:{targetUserGoodRateCount:rateInfo.targetUserGoodRateCount}};
          self.returnDataFromResponse({res:res,req:req,data:httpRetData});
          return;
        });//RateByDateParticipant
      });//getDateAndResponderInfo
  });//store.getUsers
};//rate



/**
*  body parser can support json object with more than 1 level
*
* @param req - contains userId, region, geolibType
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.updateLocationD = function(req, res) {
  var self = this;
  //logger.logDebug("Server.updateLocation entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.updateLocation, ';

  if (!req.body.latlng){
    var err = self.newError({errorKey:'needParameter',messageParams:['latlng'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.region){
    var err = self.newError({errorKey:'needParameter',messageParams:['region'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.geolibType){
    var err = self.newError({errorKey:'needParameter',messageParams:['geolibType'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var userId = req.session.userId;
  var latlng = req.body.latlng;
  var region = req.body.region;
  var geolibType = req.body.geolibType;
  self._updateLocation({req:req,userId:userId,latlng:latlng,region:region,geolibType:geolibType}, function(err,updateLocationRelateInfo){
    if (err) return self.handleError({err:err,req:req,res:res});
    var httpRetData = {status:'success'};
    self.returnDataFromResponse({res:res,req:req,data:httpRetData});
    return;
  });//_updateLocation
};//updateLocation



/**
*
* @param {Object} params - contains userId, latlng, region, geolibType, userBeMade TODO
* @param {Function} callback - is function(err,updateLocationRelateInfo)
*   updateLocationRelateInfo contains regionObj,regions,countyLocation,cityLocation
*/
Server.prototype._updateLocation = function(params, callback) {
  var messagePrefix = 'in Server._updateLocation, ';
  var self = this;
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  return callback(null,null);//location not needed from this time
//  if (!params.userId){
//    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
//    return callback(err);
//  }
//  if (!params.latlng){
//    var err = self.newError({errorKey:'needParameter',messageParams:['latlng'],messagePrefix:messagePrefix,req:req});
//    return callback(err);
//  }
//  if (!params.region){
//    var err = self.newError({errorKey:'needParameter',messageParams:['region'],messagePrefix:messagePrefix,req:req});
//    return callback(err);
//  }
//  if (!params.geolibType){
//    var err = self.newError({errorKey:'needParameter',messageParams:['geolibType'],messagePrefix:messagePrefix,req:req});
//    return callback(err);
//  }
//  var userId = params.userId;
//  var latlng = params.latlng;
//  var region = params.region;
//  var geolibType = params.geolibType;
//  self.store.updateUserLocation({req:req,userId:userId,latlng:latlng,region:region,geolibType:geolibType},function(err,updateInfo){
//    if (err) return callback(err);
//    var outData = updateInfo;
//    self.store.getUser({req:req,userId:userId,
//    userFields:['userId', 'latlng', 'region', 'geolibType', 'gender', 'createTime', 'emailAccount', 'name', 'school','studentNO','department','constellation','hometown','educationalStatus', 'deviceType', 'disabled','likeCount','goodRateCount']},function(err,userObj){
//      if (err) return callback(err);
//      self.solrClient.addUserToQueue({userObj:userObj},function(){});
//      return callback(null,outData);
//    });//getUser
//  });//store.updateUserLocation
};//_updateLocation

/**
*
* @param req - contains userId, photoId
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.deletePhoto = function(req, res) {
  var self = this;
  //logger.logDebug("Server.deletePhoto entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.deletePhoto, ';
  if (!req.body.photoId){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }

  var photoId = req.body.photoId;
  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  self.store.getUser({req:req,userId:userId,userFields:['userId','gender','primaryPhotoId']},function(err,userObj){
    if (err) return self.handleError({err:err,req:req,res:res});
    if (!userObj || !userObj.userId){
      var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
      if (err) return self.handleError({err:err,req:req,res:res});
    }
    self.store.getPhoto({req:req,photoId:photoId,photoFields:['photoId','userId','state','createTime']},function(err,photoObj){
      if (err) return self.handleError({err:err,req:req,res:res});
      if (!photoObj || !photoObj.photoId){
        var err = self.newError({errorKey:'photoNotExist',messageParams:[photoId],messagePrefix:messagePrefix,req:req});
        if (err) return self.handleError({err:err,req:req,res:res});
      }
      if (photoObj.userId != userId){
        var err = self.newError({errorKey:'onlyOwnerCanDeletePhoto',messageParams:[photoId],messagePrefix:messagePrefix,req:req});
        return self.handleError({err:err,req:req,res:res});
      }
      if (userObj.primaryPhotoId==photoId){
        var err = self.newError({errorKey:'canNotDeletePrimaryPhoto',messageParams:[photoId],messagePrefix:messagePrefix,req:req});
        return self.handleError({err:err,req:req,res:res});
      }
      if (photoObj.state == 'deleted'){
        var err = self.newError({errorKey:'photoAlreadyDeleted',messageParams:[photoId],messagePrefix:messagePrefix,req:req});
        return self.handleError({err:err,req:req,res:res});
      }
      self.store.deletePhotoLogically({req:req,photoId:photoId, photoOwnerId:photoObj.userId,
      createTime:photoObj.createTime,state:photoObj.state},function(err){
        if (err) return self.handleError({err:err,req:req,res:res});
        self.store.updatePhotoStat({req:req,photoId:photoId,photoOwnerGender:userObj.gender,uploadTime:null,isDelete:true},function(err){
          var statErr = err;
          var httpRetData = {status:'success'};
          if (statErr) httpRetData.result = {statErr:statErr};
          self.returnDataFromResponse({res:res,req:req,data:httpRetData});
          return;
        });//updatePhotoStat
      });//store.deletePhotoLogically
    });//getPhoto
  });//getUser
};//deletePhoto



/**
*
*
* @param req - contains userId, photoId
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.setPrimaryPhoto = function(req, res) {
  var self = this;
  //logger.logDebug("Server.setPrimaryPhoto entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.setPrimaryPhoto, ';
  if (!req.body.photoId){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }

  var photoId = req.body.photoId;
  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  self.store.getUser({req:req,userId:userId,userFields:['userId','primaryPhotoId']},function(err,userObj){
    if (err) return self.handleError({err:err,req:req,res:res});
    if (!userObj || !userObj.userId){
      var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
      if (err) return self.handleError({err:err,req:req,res:res});
    }
    self.store.getPhoto({req:req,photoId:photoId,photoFields:['photoId','userId','state']},function(err,photoObj){
      if (err) return self.handleError({err:err,req:req,res:res});
      if (!photoObj || !photoObj.photoId){
        var err = self.newError({errorKey:'photoNotExist',messageParams:[photoId],messagePrefix:messagePrefix,req:req});
        if (err) return self.handleError({err:err,req:req,res:res});
      }
      if (userId != photoObj.userId){
        var err = self.newError({errorKey:'onlyOwnerCanSetPrimaryPhoto',messageParams:[photoId],messagePrefix:messagePrefix,req:req});
        return self.handleError({err:err,req:req,res:res});
      }
      if(userObj.primaryPhotoId == photoId){
        //set again, success
        var httpRetData = {status:'success'};
        self.returnDataFromResponse({res:res,req:req,data:httpRetData});
        return;
      }
      if (photoObj.state=="created"){
        var err = self.newError({errorKey:'photoCreatedAndNeedAudit',messageParams:[photoId],messagePrefix:messagePrefix,req:req});
        return self.handleError({err:err,req:req,res:res});
      }
      if (photoObj.state=="deleted"){
        var err = self.newError({errorKey:'photoAlreadyDeleted',messageParams:[photoId],messagePrefix:messagePrefix,req:req});
        return self.handleError({err:err,req:req,res:res});
      }
      if (photoObj.state=="auditDenied"){
        var err = self.newError({errorKey:'photoAuditDenied',messageParams:[photoId],messagePrefix:messagePrefix,req:req});
        return self.handleError({err:err,req:req,res:res});
      }
      self.store.setUserPrimaryPhoto({req:req,userId:userId,photoId:photoId},function(err){
        if (err) return self.handleError({err:err,req:req,res:res});
        var httpRetData = {status:'success'};
        self.returnDataFromResponse({res:res,req:req,data:httpRetData});
        return;
      });//store.setUserPrimaryPhoto
      return;
    });//store.getPhoto
  });//getUser
};//setPrimaryPhoto



/**
*
* @param req - contains userId
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.signIn = function(req, res) {
  var self = this;
  //logger.logDebug("Server.signIn entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.signIn, ';
  var userId = req.session.userId;
  self.store.getUser({req:req,userId:userId,userFields:['userId']},function(err,userObj){
    if (err) return self.handleError({err:err,req:req,res:res});
    if (!userObj || !userObj.userId){
      var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
      if (err) return self.handleError({err:err,req:req,res:res});
    }
    var nowUtcTime = handy.getNowOfUTCdate().getTime();
    self.store.updateUserStatDailyActive({req:req,userId:userId,updateTime:nowUtcTime},function(err,alreadyUpdateThisDay){
      var statErr = err;
      var beDailyFirst = !alreadyUpdateThisDay;
      var httpRetData = {status:'success',result:{beDailyFirst:beDailyFirst}};
      if (statErr) httpRetData.result.statErr = statErr;
      self.returnDataFromResponse({res:res,req:req,data:httpRetData});
      return;
    });//updateUserStatDailyActive
    return;
  });//getUser
};//signIn





/**
 *
 * @param req - contains userId, appToken(registrationId)
 *   registrationId can be empty, empty means delete
 * @param res
 * @returns {status:'success'}
 */
Server.prototype.updateAppToken = function (req, res) {
  var self = this;
  //logger.logDebug("Server.updateAppToken entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.updateAppToken, ';
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }

  var appToken = req.body.appToken;
  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  self.store.getUser({req:req,userId:userId,userFields:['userId']},function(err,userObj){
    if (err) return self.handleError({err:err,req:req,res:res});
    if (!userObj || !userObj.userId){
      var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
      return self.handleError({err:err,req:req,res:res});
    }
    self.notification.updateUserAppToken({userId:userId,appToken:appToken},function(err){
      if (err) return self.handleError({err:err,req:req,res:res});
      var httpRetData = {status:'success'};
      self.returnDataFromResponse({res:res,req:req,data:httpRetData});
      //res.end();
      return;
    });//notification.updateUserAppToken
  });//getUser
};//updateAppToken




/**
 *
 * @param req - contains type(optional, can be 'invite', default be 'invite')
 * @param res
 * @returns {status:'success'}
 */
Server.prototype.getSentingSMS = function (req, res) {
  var self = this;
  //logger.logDebug("Server.getSentingSMS entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.getSentingSMS, ';
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.type){
    var err = self.newError({errorKey:'needParameter',messageParams:['type'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var type = req.body.type;
  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (type=='invite'){
    var downUrlForAndroid = config.config.downUrlForAndroid;
    var downUrlForApple = config.config.downUrlForApple;
    //var text = "我正在使用同去应用，很有趣。你也来用吧。\n\n安卓应用的下载地址:"+downUrlForAndroid+"\n\n苹果应用的下载地址:"+downUrlForApple;
    var text = "我正在使用同去应用，很有趣。你也来用吧。\n\n安卓应用的下载地址:"+downUrlForAndroid;
    var httpRetData = {status:'success',result:{text:text}};
    self.returnDataFromResponse({res:res,req:req,data:httpRetData});
    return;
  }else{
    var err = self.newError({errorKey:'unsupportedValueForParam',messageParams:[type,'type'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
//  var text = "to be defined or discussed";
//  var httpRetData = {status:'success',result:{text:text}};
//  self.returnDataFromResponse({res:res,req:req,data:httpRetData});
//  return;
};//getSentingSMS




/**
*
* @param req - contains language(chinese | english , default be english)
* @param res
* @returns {status:'success',result:{types:[{level1:'a', level2:['a1','a2']}, {level1:'b', level2:['b1','b2']}]}}
*/
Server.prototype.getActivityTypes = function (req, res) {
  var self = this;
  //logger.logDebug("Server.getActivityTypes entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.getActivityTypes, ';
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var userIdFront = req.body.userId;
  var userId = req.session.userId;
  if (userIdFront != userId){
    var err = self.newError({errorKey:'sessionNotConsistent',messageParams:[''],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
//  var types = [
//      {level1:'体育类', level2:['我想一起跑步。','我想一起打羽毛球。','我想一起打网球。']},
//      {level1:'购物类', level2:['我想买件礼物，找热心人咨询。',' 我想买件东西，几个人一起买可以打折。']},
//      {level1:'娱乐类', level2:['我想找人唱卡拉OK','我想找人三国杀','我想找人去看展览。','我想一起旅游。']},
//      {level1:'交通类', level2:['我想找人一起拼车回家。']},
//      {level1:'学习类', level2:['我想找人一起做作业。',' 我想找人一起考试复习。']},
//      {level1:'爱心类', level2:['我想找人救助小猫，小狗。']}
//    ];
  var types = [
         {level1:'自定义', level2:['自定义活动，招人，爱干嘛干嘛！'],
             level2Autotext:['自定义活动，招人，爱干嘛干嘛！']
         },
         {level1:'热门活动', level2:['跑步','上自习','听讲座','聚会k歌','逛街购物',
                                 '打牌'],
           level2Autotext:['找人一起跑步健身','征人一起上自习','找人一起去听讲座','一起去high歌吧','一起去逛街购物吧',
                           '打牌三缺一，你来么']
         },
         {level1:'休闲娱乐', level2:['卡拉OK','桌游','看电影','吃货天地','购物',
                                 '台球','演出展览','博物馆','游乐园','舞伴',
                                 '酒吧夜店'],
             level2Autotext:['找人一起去K歌','征人一起桌游','找人一起看电影','一起当个快乐的吃货','有人一起购物吗',
               '我要找人打台球','想看演出展览','一起参观博物馆','游乐园一起玩儿吧','我要征舞伴',
               '我想去泡吧']
         },
         {level1:'知性感性', level2:['鹊桥','毕业旅行','郊游旅游','聊天','喝酒'],
             level2Autotext:['征男/女友','毕业一起旅行吧','我要组人同游','我想找人聊天','找人陪我喝酒']
         },
         {level1:'体育修身', level2:['跑步','羽毛球','网球','乒乓球','健身','滑雪'],
             level2Autotext:['征人一起跑步','征人打羽毛球','征人打网球','征人打乒乓球','征人一起健身','我们一起滑雪吧']},
         {level1:'乡情校谊', level2:['上自习','拼车','征人同行','二手市场','同乡会'],
             level2Autotext:['征人一起上自习','有人一起拼车么','有人一起同行么','二手信息发布','我要找同乡的同学']}
       ];
  var httpRetData = {status:'success',result:{types:types}};
  self.returnDataFromResponse({res:res,req:req,data:httpRetData});
  return;
};//getActivityTypes


/**
*
*
* @param req - contains photoId, passed(boolean), description(optional), normalApiReturn(optional)
*   normalApiReturn is used to support normal api calling for test codes
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.webAuditPhoto = function(req, res) {
  var self = this;
  //logger.logDebug("Server.webAuditPhoto entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.webAuditPhoto, ';
  if (!req.body.photoId){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (req.body.passed == null){
    var err = self.newError({errorKey:'needParameter',messageParams:['passed'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.region){
    var err = self.newError({errorKey:'needParameter',messageParams:['region'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var photoId = req.body.photoId;
  var passed = req.body.passed;
  var description = req.body.description;
  var region = req.body.region;
  var normalApiReturn = req.body.normalApiReturn;
  passed = handy.convertToBool(passed);

  self._auditPhoto({req:req,photoId:photoId,auditPass:passed,description:description},function(err,auditInfo){
    if (!normalApiReturn){
      if (err){
        var photoAlreadyDeletedErrorInfo = config.config.errors["photoAlreadyDeleted"];
        var photoAuditDeniedErrorInfo = config.config.errors["photoAuditDenied"];
        if (err.code == photoAlreadyDeletedErrorInfo.code || err.code == photoAuditDeniedErrorInfo.code){
          //normal return for now
        }else{
          return self.handleError({err:err,req:req,res:res});
        }
      }
      //it is web page return
      var queryObj = {region:region};
      var queryStr = querystring.stringify(queryObj);
      res.redirect('/web/regionCreatedPhotoList?'+queryStr);
      return;
    }else{//normalApiReturn == true
      if (err) return self.handleError({err:err,req:req,res:res});
      var httpRetData = {status:'success'};
      if(auditInfo){
        httpRetData.result = {auditId:auditInfo.auditObj.auditId};
        if (auditInfo.bePrimaryPhoto)  httpRetData.result.bePrimaryPhoto = auditInfo.bePrimaryPhoto;
        if (auditInfo.firstApprovedUserPhoto)  httpRetData.result.firstApprovedUserPhoto = auditInfo.firstApprovedUserPhoto;
        if (auditInfo.notificationErr)  httpRetData.result.notificationErr = auditInfo.notificationErr;
      }
      self.returnDataFromResponse({res:res,req:req,data:httpRetData});
      return;
    }
  });//_auditPhoto
};//webAuditPhoto


/**
*  TODO delete the function
*
* @param req - contains photoId, passed(boolean), description(optional), normalApiReturn(optional)
*   normalApiReturn is used to support normal api calling for test codes
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.webBatchAuditPhoto = function(req, res) {
  var self = this;
  //logger.logDebug("Server.webBatchAuditPhoto entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.webBatchAuditPhoto, ';
  if (!req.body.region){
    var err = self.newError({errorKey:'needParameter',messageParams:['region'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var region = req.body.region;

  var photoIdData = req.body.photoId;//because of form post, it may be array
  var checkedPhotoIdData = req.body.checkedPhotoId;
  var passedData = req.body.passed;
  var descriptionData = req.body.description;
  var photoIds, checkedPhotoIds, passedValues, descriptions;
  var photoObjs, checkedPhotos;
  if (photoIdData){
    if (photoIdData instanceof Array){
      photoIds = photoIdData;
      passedValues = passedData;
      descriptions = descriptionData;
    }else{
      photoIds = [photoIdData];
      passedValues = [passedData];
      descriptions = [descriptionData];
    }
  }//if
  if(checkedPhotoIdData){
    if (checkedPhotoIdData instanceof Array){
      checkedPhotoIds = checkedPhotoIdData;
    }else{
      checkedPhotoIds = [checkedPhotoIdData];
    }
  }

  if(photoIds){
    photoObjs = [];
    for(var i=0; i<photoIds.length; i++){
      var photoId = photoIds[i];
      var passed = passedValues[i];
      passed = handy.convertToBool(passed);
      var description = descriptions[i];
      var photoObj = {photoId:photoId,passed:passed,description:description};
      photoObjs.push(photoObj);
    }//for

    if(checkedPhotoIds){
      checkedPhotos = [];
      for(var i=0; i<photoIds.length; i++){
        var photoObj = photoObjs[i];
        for(var j=0; j<checkedPhotoIds.length; j++){
          var checkedPhotoId = checkedPhotoIds[j];
          if(photoObj.photoId == checkedPhotoId){
            checkedPhotos.push(photoObj);
            break ;
          }
        }//for j
      }//for i
    }//if(checkedPhotoIds)
  }//if(photoIds)
  logger.logDebug("in Server.webBatchAuditPhoto, photoObjs="+util.inspect(photoObjs,false,100)+",\n  checkedPhotos="+util.inspect(checkedPhotos,false,100));
  var redirectQueryObj = {region:region};
  var redirectQueryStr = querystring.stringify(redirectQueryObj);
  var redirectUrl = '/web/regionStatePhotoList?'+redirectQueryStr;//TODO MAKE PARAMS...........
  if(!checkedPhotos || checkedPhotos.length==0){
    res.redirect(redirectUrl);
    return;
  }
  //checkedPhotos.length>0
  self._auditPhotos({req:req,photosData:checkedPhotos,req:req},function(errors,auditInfos){
      if(errors){
        res.render('errorPage.ejs', {layout:false, util:util, err:null,errors:errors,redirectUrl:redirectUrl});
        return;
      }
      res.redirect(redirectUrl);
      return;
  });//_auditPhotos
  return;
};//webBatchAuditPhoto






/**
*
*
* @param req - contains
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.adminGetData = function(req, res) {
  var self = this;
  //logger.logDebug("Server.adminGetData entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.adminGetData, ';
  // check http incoming data

  var params = handy.getRequestInParams(req);
  if (!params.filterType) params.filterType = 'regexRedis';
  if (!params.filterValue) params.filterValue = '*';
  params.req = req;
  var outFormat = params.outFormat;
  var format = params.format;

  self.store.getData(params,function(err,kvHash){
    if (err) return self.handleError({err:err,req:req,res:res});
    var httpRetData = {status:'success',result:kvHash};
    if (!format){
      if (outFormat=="directText" || outFormat=="formatJsonText"){
        format = "formatJsonText";
      }
    }
    self.returnDataFromResponse({res:res,req:req,data:httpRetData,format:format});
    return;
  });//store.getData
};//adminGetData

/**
*
*
* @param req - contains
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.adminGetRawDataByQuery = function(req, res) {
  var self = this;
  //logger.logDebug("Server.adminGetRawDataByQuery entered, params="+util.inspect(params,false,100));
  var messagePrefix = 'in Server.adminGetRawDataByQuery, ';
  var params = handy.getRequestInParams(req);
  var format = params.format;
  params.req = req;
  self.store.getRawDataByQuery(params,function(err,dataArray){
    if (err) return self.handleError({err:err,req:req,res:res});
    var httpRetData = {status:'success',result:dataArray};
    self.returnDataFromResponse({res:res,req:req,data:httpRetData,format:format});
    return;
  });//store.getRawDataByQuery
};//adminGetRawDataByQuery

/**
*
*
* @param req - contains
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.adminGetStat = function(req, res) {
  var self = this;
  //logger.logDebug("Server.adminGetStat entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.adminGetStat, ';
  var params = handy.getRequestInParams(req);
  var format = params.format;
  self.store.getStat({req:req},function(err,statData){
    if (err) return self.handleError({err:err,req:req,res:res});
    var httpRetData = {status:'success',result:statData};
    self.returnDataFromResponse({res:res,req:req,data:httpRetData,format:format});
    return;
  });//store.getStat
};//adminGetStat

/**
*
*
* @param req - contains
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.viewRegionList = function(req, res) {
  var self = this;
  //logger.logDebug("Server.viewRegionList entered");
  var messagePrefix = 'in Server.viewRegionList, ';
  var pageLibs = {util:util, handy:handy};
  var pageParams = {libs:pageLibs, err:null, layout:false, regions:null,regionsCreatedPhotoCount:null};
  self.store.getRegions({req:req,needCreatedPhotoCount:true},function(err,regionsInfo){
    if (err) return self.handleError({err:err,req:req,res:res});
    //logger.logDebug("Server.viewRegionList getRegions callback, regionsInfo="+util.inspect(regionsInfo,false,100));
    var regions = null, regionsCreatedPhotoCount = null;
    if (regionsInfo){
      regions = regionsInfo.regions;
      regionsCreatedPhotoCount = regionsInfo.regionsCreatedPhotoCount;
    }
    tool.copyFields({srcObj:{regions:regions, regionsCreatedPhotoCount:regionsCreatedPhotoCount},
      destObj:pageParams, overrideSameName:true});
    res.render('audit/regionList.ejs', pageParams);
    return;
  });//store.getRegions
};//viewRegionList





/**
* the order is from early to late. [startDate, endDate).
*
* @param req - contains region, photoStateType, startDate, endDate, pageIndex, pageSize
*   startDate, endDate are UTC date, should be of the format YYYY-MM-DD
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.viewRegionStatePhotoList = function(req, res) {
  var self = this;
  var messagePrefix = 'in Server.viewRegionStatePhotoList, ';
  var params = {} , pageParams = {};

  function handleErrorForPage(errInfo){
    //logger.logDebug("Server.viewRegionStatePhotoList, handleErrorForPage");
    if (errInfo){
      if (errInfo instanceof Array){
        var errors = errInfo;
        pageParams.errors = errors;
      }else{
        var err = errInfo;
        pageParams.err = err;
      }
    }
    self.handleError({err:errInfo});
    return res.render('audit/regionStatePhotoList.ejs', pageParams);
  };

  function handleParams(cbFun){
    logger.logDebug("Server.viewRegionStatePhotoList, handleParams, req.query="+util.inspect(req.query,false,100)+",\nreq.body="+util.inspect(req.body,false,100));
    params = {};
    tool.copyFields({srcObj:req.query,destObj:params,overrideSameName:true});
    tool.copyFields({srcObj:req.body,destObj:params,overrideSameName:true});
    logger.logDebug("Server.viewRegionStatePhotoList entered, params="+util.inspect(params,false,100));
    var pageLibs = {util:util};
    pageParams = {layout:false, libs:pageLibs, err:null,errors:null, redirectUrl:null,
        photos:null,totalCount:0,rootUrl:config.getCloudStorageInfo().toBucketUrl,
        region:null, photoStateType:null, startDate:null, endDate:null, pageIndex:null, pageSize:null};

    if (!params.region){
      var err = self.newError({errorKey:'needParameter',messageParams:['region'],messagePrefix:messagePrefix,req:req});
      return cbFun(err);
    }
    if (!params.photoStateType){
      var err = self.newError({errorKey:'needParameter',messageParams:['photoStateType'],messagePrefix:messagePrefix,req:req});
      return cbFun(err);
    }
    var region = params.region;
    var photoStateType = params.photoStateType;
    var startDate = params.startDate;
    var endDate = params.endDate;
    var pageIndex = params.pageIndex;
    var pageSize = params.pageSize;

    if (!startDate) startDate = '';
    if (!endDate) endDate = '';
    if (!pageIndex) pageIndex = 0;
    else pageIndex = Number(pageIndex);
    if (!pageSize) pageSize = 20;//config.config....
    else pageSize = Number(pageSize);
    if (params.prevPage){
      pageIndex--;
      if (pageIndex < 0) pageIndex = 0;
    }else if(params.nextPage){
      pageIndex++;
    }

    tool.copyFields({srcObj:{region:region, photoStateType:photoStateType, startDate:startDate, endDate:endDate, pageIndex:pageIndex, pageSize:pageSize},
      destObj:pageParams, overrideSameName:true});
    return cbFun(null);
  };//handleParams

  function renderPage(cbFun){
    //logger.logDebug("Server.viewRegionStatePhotoList, renderPage");
    var region = params.region;
    var photoStateType = params.photoStateType;
    var startDate = params.startDate;
    var endDate = params.endDate;
    var startPhotoTime = null, endPhotoTime = null;
    if (startDate){
      var timep = Date.parse(startDate);
      if (isNaN(timep)){
        var err = self.newError({errorKey:'invalidValueForParam',messageParams:[startDate,'startDate'],messagePrefix:messagePrefix,req:req});
        return cbFun(err);
      }
      startPhotoTime = new Date(timep).getTime();
    }else startDate='';
    if (endDate){
      var timep = Date.parse(endDate);
      if (isNaN(timep)){
        var err = self.newError({errorKey:'invalidValueForParam',messageParams:[endDate,'endDate'],messagePrefix:messagePrefix,req:req});
        return cbFun(err);
      }
      endPhotoTime = new Date(timep).getTime();
    }else endDate='';

    var pageIndex = pageParams.pageIndex;
    var pageSize = pageParams.pageSize;
    var offset = pageIndex * pageSize;
    var count = pageSize;
    var getDataDirection = "fromEarlyToLate";
    self.store.getRegionalStatePhotos({req:req,region:region, photoStateType:photoStateType, getDataDirection:getDataDirection,
    startPhotoTime:startPhotoTime, endPhotoTime:endPhotoTime, offset:offset, count:count,
    photoFields:['photoId','photoPath','state']},function(err,photosInfo){
      if (err) return cbFun(err);
      var photos = [], totalCount = 0;
      if (photosInfo){
        var photosRet = photosInfo.photos;
        totalCount = Number(photosInfo.totalCount);
        if(photosRet && photosRet.length>0){
          for(var i=0; i<photosRet.length; i++){
            var photoRet = photosRet[i];
            if(photoRet && photoRet.photoId && photoRet.photoPath){
              var photoResizedPathes = config.getResizedPhotoPathFromOriginal(photoRet.photoPath);
              var photoObj = photoRet;
              photoObj.photoPaths = photoResizedPathes.s;
              photoObj.photoPathfw = photoResizedPathes.fw;
              photos.push(photoObj);
            }
          }//for
        }//if(photosRet && photosRet.length>0)
        pageParams.totalCount = totalCount;
        pageParams.photos = photos;
      }
      res.render('audit/regionStatePhotoList.ejs', pageParams);
      return cbFun(null);
    });//store.getRegionalStatePhotos
  };//renderPage

  function batchAudit(cbFun){
    if (!params.batchAudit){
      //browser user not click batchAudit button on the page, so not do batchAudit
      return cbFun(null);
    }
    var region = params.region;

    var photoIdData = req.body.photoId;//because of form post, it may be array
    var checkedPhotoIdData = req.body.checkedPhotoId;
    var passedData = req.body.passed;
    var descriptionData = req.body.description;
    var photoIds, checkedPhotoIds, passedValues, descriptions;
    var photoObjs, checkedPhotos;
    if (photoIdData){
      if (photoIdData instanceof Array){
        photoIds = photoIdData;
        passedValues = passedData;
        descriptions = descriptionData;
      }else{
        photoIds = [photoIdData];
        passedValues = [passedData];
        descriptions = [descriptionData];
      }
    }//if
    if(checkedPhotoIdData){
      if (checkedPhotoIdData instanceof Array){
        checkedPhotoIds = checkedPhotoIdData;
      }else{
        checkedPhotoIds = [checkedPhotoIdData];
      }
    }

    if(photoIds){
      photoObjs = [];
      for(var i=0; i<photoIds.length; i++){
        var photoId = photoIds[i];
        var passed = passedValues[i];
        passed = handy.convertToBool(passed);
        var description = descriptions[i];
        var photoObj = {photoId:photoId,passed:passed,description:description};
        photoObjs.push(photoObj);
      }//for

      if(checkedPhotoIds){
        checkedPhotos = [];
        for(var i=0; i<photoIds.length; i++){
          var photoObj = photoObjs[i];
          for(var j=0; j<checkedPhotoIds.length; j++){
            var checkedPhotoId = checkedPhotoIds[j];
            if(photoObj.photoId == checkedPhotoId){
              checkedPhotos.push(photoObj);
              break ;
            }
          }//for j
        }//for i
      }//if(checkedPhotoIds)
    }//if(photoIds)
    //logger.logDebug("in Server.viewRegionStatePhotoList, batchAudit, photoObjs="+util.inspect(photoObjs,false,100)+",\n  checkedPhotos="+util.inspect(checkedPhotos,false,100));
    if(!checkedPhotos || checkedPhotos.length==0){
      return cbFun(null);
    }
    //checkedPhotos.length>0
    self._auditPhotos({req:req,photosData:checkedPhotos},function(errors,auditInfos){
        if(errors){
          return cbFun(errors);
        }
        return cbFun(null);
    });//_auditPhotos
  };//batchAudit

  handleParams(function(err){
    if (err) return handleErrorForPage(err);
    batchAudit(function(errInfo){
      if (errInfo) return handleErrorForPage(errInfo);
      renderPage(function(err){
        if (err) return handleErrorForPage(err);
        //no err, page render already be done
      });//renderPage
    });//batchAudit
  });//handleParams
};//viewRegionStatePhotoList



/**
*
*
* @param req - contains
*
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.viewBroadcastSystemMessage = function(req, res) {
  var self = this;
  var messagePrefix = 'in Server.viewBroadcastSystemMessage, ';
  var params = {} , pageParams = {};

  function handleErrorForPage(errInfo){
    logger.logDebug("Server.viewBroadcastSystemMessage, handleErrorForPage, errInfo="+util.inspect(errInfo,false,100));
    if (errInfo){
      if (errInfo instanceof Array){
        var errors = errInfo;
        pageParams.errors = errors;
        self.logErrors({errors:errors,req:req});
      }else{
        var err = errInfo;
        pageParams.err = err;
        self.handleError({err:err,req:req});
      }
    }
    return res.render('audit/broadcastSystemMessage.ejs', pageParams);
  };

  function handleParams(cbFun){
    params = {};
    tool.copyFields({srcObj:req.query,destObj:params,overrideSameName:true});
    tool.copyFields({srcObj:req.body,destObj:params,overrideSameName:true});
    //logger.logDebug("Server.viewBroadcastSystemMessage entered, params="+handy.inspectWithoutBig(params));
    var pageLibs = {util:util};
    pageParams = {layout:false, libs:pageLibs, err:null,errors:null, redirectUrl:null,
        actionedInfo:null};
    return cbFun(null);
  };//handleParams

  function renderPage(cbFun){
    self.logWithWebRequestInfo({req:req, data:pageParams.actionedInfo});
    //logger.logDebug("Server.viewBroadcastSystemMessage, renderPage, actionedInfo="+util.inspect(pageParams.actionedInfo,false,100));
    res.render('audit/broadcastSystemMessage.ejs', pageParams);
    return cbFun(null);
  };//renderPage

  function doBroadcast(cbFun){
    if (!params.btnBroadCast){
      //browser user not click btnBroadCast button on the page, so not do action
      return cbFun(null);
    }
    if (!params.messageText){
      var err = self.newError({errorKey:'needParameter',messageParams:['messageText'],messagePrefix:messagePrefix,req:req});
      return cbFun(err);
    }
    var messageText = params.messageText;
    var notSendReally = params.notSendReally;
    notSendReally = handy.convertToBool(notSendReally);

    var gender = params.gender;
    var deviceType = params.deviceType;
    var school = params.school;
    var schoolId = params.schoolId;
    var emails = params.emails;

    var userFieldInfos = [];
    if (gender && gender!=config.constants.filterAllFlag){
      var userFieldInfo = {fieldName:"gender", fieldValueRegexp:gender};
      userFieldInfos.push(userFieldInfo);
    }
    if (deviceType && deviceType!=config.constants.filterAllFlag){
      var userFieldInfo = {fieldName:"deviceType", fieldValueRegexp:deviceType};
      userFieldInfos.push(userFieldInfo);
    }
    if (school && school!=config.constants.filterAllFlag){
      var userFieldInfo = {fieldName:"school", fieldValueRegexp:school};
      userFieldInfos.push(userFieldInfo);
    }
    if (schoolId && schoolId!=config.constants.filterAllFlag){
      var userFieldInfo = {fieldName:"schoolId", fieldValueRegexp:schoolId};
      userFieldInfos.push(userFieldInfo);
    }

    if(!emails) emails = null;
    else{
      emails = emails.split(/[,; ]/);
      var nonEmptyEmails = [];
      for(var i=0; i<emails.length; i++){
        var email = emails[i];
        if (email) nonEmptyEmails.push(email);
      }
      if (nonEmptyEmails.length==0) emails = null;
      else emails = nonEmptyEmails;
    }
    var queryParams = {userFieldInfos:userFieldInfos, needCaseInsensitive:true, emails:emails,req:req};
    logger.logDebug("Server.viewBroadcastSystemMessage doBroadcast, queryParams="+handy.inspectWithoutBig(queryParams));
    self.store.getUserIdsByQuery2(queryParams,function(err,userIds){
      if (err) return cbFun(err);
      logger.logDebug("Server.viewBroadcastSystemMessage doBroadcast, userIds="+util.inspect(userIds,false,100));
      if (!userIds || userIds.length==0){
        var err = self.newError({errorKey:'simpleError',message:'not find any user to broadcast message',messageParams:[],messagePrefix:messagePrefix,req:req});
        return cbFun(err);
      }
      if (notSendReally){
        return cbFun(null,null);
      }
      delete queryParams.req;
      self.store.createBroadcast({req:req,messageText:messageText,userFilters:JSON.stringify(queryParams)},function(err,broadcastObj){
        if (err) return cbFun(err);
        self.notification.sendNotificationForSystemBroadMessage({userIds:userIds, messageText:messageText},function(err,sendInfo){
          if (err) return cbFun(err);
          var broadcastInfo = {broadcastId:broadcastObj.broadcastId};
          tool.copyFields({srcObj:sendInfo,destObj:broadcastInfo});
          return cbFun(null,broadcastInfo);
        });//sendNotificationForSystemBroadMessage
      });//createBroadcast
    });//store.getUserIdsByQuery
  };//doBroadcast

  handleParams(function(err){
    if (err) return handleErrorForPage(err);
    doBroadcast(function(err,broadcastInfo){
      if (err) return handleErrorForPage(err);
      if (broadcastInfo){
        pageParams.actionedInfo = {};
        if (broadcastInfo.failUserInfos)
          pageParams.actionedInfo.failUserCount = broadcastInfo.failUserInfos.length;
        else pageParams.actionedInfo.failUserCount = 0;
        if (broadcastInfo.successUserInfos)
          pageParams.actionedInfo.successUserCount = broadcastInfo.successUserInfos.length;
        else pageParams.actionedInfo.successUserCount = 0;
        if (config.config.logLevel == config.constants.LogLevelDebug){
          pageParams.actionedInfo.detailData = broadcastInfo;
        }
      }//if (broadcastInfo)
      renderPage(function(err){
        if (err) return handleErrorForPage(err);
        //no err, page render already be done
      });//renderPage
    });//doBroadcast
  });//handleParams
};//viewBroadcastSystemMessage



/**
*
*
* @param req - contains
*
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.viewResetPassword = function(req, res) {
  var self = this;
  var messagePrefix = i18n.__('in Server.viewResetPassword, ');
  var requestParams = {} , pageParams = {};

  function handleErrorForPage(errInfo){
    //logger.logDebug("Server.viewResetPassword, handleErrorForPage");
    if (errInfo){
      if (errInfo instanceof Array){
        var errors = errInfo;
        pageParams.errors = errors;
      }else{
        var err = errInfo;
        pageParams.err = err;
      }
    }
    self.handleError({err:errInfo});
    return res.render('user/resetPassword.ejs', pageParams);
  };

  function parseRequestParams(cbFun){
    requestParams = {};
    tool.copyFields({srcObj:req.query,destObj:requestParams,overrideSameName:true});
    tool.copyFields({srcObj:req.body,destObj:requestParams,overrideSameName:true});
    //logger.logDebug("Server.viewResetPassword entered, requestParams="+util.inspect(requestParams,false,100));
    var pageLibs = {util:util};
    pageParams = {layout:false, libs:pageLibs, err:null,errors:null, redirectUrl:null,
        emailAccount:null, successfullyReset:false};

    return cbFun(null);
  };//parseRequestParams

  function renderPage(cbFun){
    //logger.logDebug("Server.viewResetPassword, renderPage");
    res.render('user/resetPassword.ejs', pageParams);
    return cbFun(null);
  };//renderPage

  function doAction(cbFun){
    function parseAndCheckRpi(cbFun){
      //browser user not click btnResetPassword button on the page, so just show page
      var resetPwdInfo = requestParams.rpi;
      if (resetPwdInfo){
        resetPwdInfo = handy.decrypt(resetPwdInfo);
      }
      if (!resetPwdInfo){
        var err = self.newError({errorKey:'invalidResetPasswordCode',messageParams:[],messagePrefix:messagePrefix,req:req});
        return cbFun(err);
      }
      var sepIdx = resetPwdInfo.indexOf("M");
      if (sepIdx <= 0){
        var err = self.newError({errorKey:'invalidResetPasswordInfo',messageParams:[],messagePrefix:messagePrefix,req:req});
        return cbFun(err);
      }
      var expireTime = resetPwdInfo.substring(0,sepIdx);
      expireTime = Number(expireTime);
      var timeNowUtc = handy.getNowOfUTCdate();
      var emailAccount = resetPwdInfo.substring(sepIdx+1);
      if (expireTime < timeNowUtc){
        var err = self.newError({errorKey:'expireResetPasswordInfo',messageParams:[],messagePrefix:messagePrefix,req:req});
        return cbFun(err);
      }
      self.store.getUserIdByEmailAccount({req:req,emailAccount:emailAccount},function(err,userId){
         if (err) return cbFun(err);
         if (!userId){
           var err = self.newError({errorKey:'emailNotRegistered',messageParams:[emailAccount],messagePrefix:messagePrefix,req:req});
           return cbFun(err);
         }
         pageParams.emailAccount = emailAccount;

         return cbFun(null);
      });//store.getUserIdByEmailAccount
      return;
    };//parseAndCheckRpi

    if (!requestParams.btnResetPassword){
      parseAndCheckRpi(cbFun);
      return;
    }
    //do submit action
    parseAndCheckRpi(function(err){
      if (err) return cbFun(err);
      //do submit action
      if (!requestParams.emailAccount){
        var err = self.newError({errorKey:'needParameter',messageParams:['emailAccount'],messagePrefix:messagePrefix,req:req});
        return cbFun(err);
      }
      if (!requestParams.password){
        var err = self.newError({errorKey:'needParameter',messageParams:['password'],messagePrefix:messagePrefix,req:req});
        return cbFun(err);
      }
      if (!requestParams.password2){
        var err = self.newError({errorKey:'needParameter',messageParams:['password2'],messagePrefix:messagePrefix,req:req});
        return cbFun(err);
      }
      var emailAccount = requestParams.emailAccount;
      var password = requestParams.password;
      var password2 = requestParams.password2;
      pageParams.emailAccount = emailAccount;
      if (password != password2){
        var err = self.newError({errorKey:'passwordNotMatch',messageParams:[],messagePrefix:messagePrefix,req:req});
        return cbFun(err);
      }
      if(!password || password.length<config.config.passwordMinLength){
        var err = self.newError({errorKey:'passwordTooShort',messageParams:[],messagePrefix:messagePrefix,req:req});
        return cbFun(err);
      }
      self.store.getUserIdByEmailAccount({req:req,emailAccount:emailAccount},function(err,userId){
        if (err) return cbFun(err);
        if (!userId){
          var err = self.newError({errorKey:'emailNotRegistered',messageParams:[emailAccount],messagePrefix:messagePrefix,req:req});
          return cbFun(err);
        }
        pageParams.emailAccount = emailAccount;
        self.store.resetPassword({req:req,userId:userId,newPassword:password,justUpdate:true},function(err){
          if (err) return cbFun(err);
          pageParams.successfullyReset = true;
          return cbFun(null);
        });//store.resetPassword
      });//store.getUserIdByEmailAccount
      return;
    });//parseAndCheckRpi
  };//doAction

  parseRequestParams(function(err){
    if (err) return handleErrorForPage(err);
    doAction(function(err){
      if (err) return handleErrorForPage(err);
      renderPage(function(err){
        if (err) return handleErrorForPage(err);
        //no err, page render already be done
      });//renderPage
    });//batchAudit
  });//parseRequestParams
};//viewResetPassword




/**
*
*
* @param req - contains emailAccount, returnFormat(page|json, default be page)
*   when returnFormat be json, it means it is a api call.
*
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.viewRequestResetPassword = function(req, res) {
  var self = this;
  var messagePrefix = i18n.__('in Server.viewRequestResetPassword, ');
  var requestParams = {} , pageParams = {};

  function parseRequestParams(cbFun){
    requestParams = {};
    tool.copyFields({srcObj:req.query,destObj:requestParams,overrideSameName:true});
    tool.copyFields({srcObj:req.body,destObj:requestParams,overrideSameName:true});
    logger.logDebug("Server.viewRequestResetPassword parseRequestParams, requestParams="+util.inspect(requestParams,false,100));
    var pageLibs = {util:util};
    pageParams = {layout:false, libs:pageLibs, err:null,errors:null, redirectUrl:null,
        actionRetInfo : null, actionSuccess:null};

    return cbFun(null);
  };//parseRequestParams

  function renderPage(){
    //logger.logDebug("Server.viewRequestResetPassword, renderPage");
    if (requestParams.returnFormat == 'json'){
      if (pageParams.err)  return self.handleError({err:pageParams.err,req:req,res:res});
      var httpRetData = {status:"success"};
      if (pageParams.actionRetInfo)  httpRetData.result = pageParams.actionRetInfo;
      self.returnDataFromResponse({res:res,req:req,data:httpRetData});
      return;
    }else{
      if (pageParams.err)  self.handleError({err:pageParams.err,req:req});
      //not handle pageParams.errors because self.handleError can not handle errors TODO
      res.render('user/requestResetPassword.ejs', pageParams);
      return;
    }
  };//renderPage
  function handleErrorForPage(errInfo){
    //just do parse error
    if (errInfo){
      if (errInfo instanceof Array){
        var errors = errInfo;
        pageParams.errors = errors;
      }else{
        var err = errInfo;
        pageParams.err = err;
      }
    }
    return renderPage();
  };//handleErrorForPage

  function doAction(cbFun){
    if (requestParams.returnFormat != 'json' && !requestParams.btnRequesetReset){
      //not api call and page submit button not be clicked, so just show page
      return cbFun(null);
    }
    //do submit action
    if (!requestParams.emailAccount){
      var err = self.newError({errorKey:'needParameter',messageParams:['emailAccount'],messagePrefix:messagePrefix,req:req});
      return cbFun(err);
    }
    var emailAccount = requestParams.emailAccount;
    pageParams.emailAccount = emailAccount;
    //console.log("in viewRequestResetPassword, req="+util.inspect(req,false,100));
    //var fromUrl = req.url;//some case , the url only be path
    var fromUrl = req.headers.referer;
    self._requestResetPassword({req:req,emailAccount:emailAccount,fromUrl:fromUrl}, function(err){
      if (err) return cbFun(err);
      pageParams.actionSuccess = true;
      return cbFun(null);
    });//_requestResetPassword
  };//doAction

  parseRequestParams(function(err){
    if (err) return handleErrorForPage(err);
    doAction(function(err){
      if (err) return handleErrorForPage(err);
      renderPage();//renderPage
    });//batchAudit
  });//parseRequestParams
};//viewRequestResetPassword



/**
*
*
* @param req - contains emailAccount, returnFormat(page|json, default be page)
*   when returnFormat be json, it means it is a api call.
*
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.viewDisableUser = function(req, res) {
  var self = this;
  var messagePrefix = 'in Server.viewDisableUser, ';
  var requestParams = {} , pageParams = {};

  function parseRequestParams(cbFun){
    requestParams = {};
    tool.copyFields({srcObj:req.query,destObj:requestParams,overrideSameName:true});
    tool.copyFields({srcObj:req.body,destObj:requestParams,overrideSameName:true});
    logger.logDebug("Server.viewDisableUser parseRequestParams, requestParams="+util.inspect(requestParams,false,100));
    var pageLibs = {util:util};
    pageParams = {layout:false, libs:pageLibs, err:null,errors:null, redirectUrl:null, rootUrl:config.getCloudStorageInfo().toBucketUrl,
        actionRetInfo : null, actionSuccess:null,
        emailAccount:'', userId:'',
        user:null, photos:null};

    return cbFun(null);
  };//parseRequestParams

  function renderPage(){
    //logger.logDebug("Server.viewDisableUser, renderPage");
    //logger.logDebug("Server.viewDisableUser renderPage, pageParams="+util.inspect(pageParams,false,100));
    if (requestParams.returnFormat == 'json'){
      if (pageParams.err)  return self.handleError({err:pageParams.err,req:req,res:res});
      var httpRetData = {};
      if (pageParams.actionSuccess) httpRetData.status = 'success';
      else httpRetData.status = 'fail';
      if (pageParams.actionRetInfo){
        httpRetData.result = pageParams.actionRetInfo;
      }
      self.returnDataFromResponse({res:res,req:req,data:httpRetData});
      return;
    }else{
      if (pageParams.err)  self.handleError({err:pageParams.err});
      //not handle pageParams.errors because self.handleError can not handle errors
      res.render('user/disableUser.ejs', pageParams);
      return;
    }
  };//renderPage
  function handleErrorForPage(errInfo){
    //just do parse error
    if (errInfo){
      if (errInfo instanceof Array){
        var errors = errInfo;
        pageParams.errors = errors;
      }else{
        var err = errInfo;
        pageParams.err = err;
      }
    }
    return renderPage();
  };//handleErrorForPage
  function getUserId(cbFun){
    if (requestParams.userId)  return cbFun(null,requestParams.userId);
    else if (requestParams.emailAccount){
      self.store.getUserIdByEmailAccount({req:req,emailAccount:requestParams.emailAccount}, function(err,userId){
        if (err)  return cbFun(err);
        if (!userId){
          var err = self.newError({errorKey:'emailNotRegistered',messageParams:[emailAccount],messagePrefix:messagePrefix,req:req});
          return cbFun(err);
        }
        requestParams.userId = userId;
        pageParams.userId = userId;
        return cbFun(null);
      });//getUserIdByEmailAccount
      return;
    }else return cbFun(null,null);
  };//getUserId
  function getUserAndPhotos(cbFun){
    var userId = requestParams.userId;
    if (!userId) return cbFun(null);
    self.store.getUser({req:req,userId:userId,userFields:['userId','emailAccount','name','gender','height','deviceType','cityLocation','primaryPhotoId','disabled'],
    needPrimaryPhoto:true, primaryPhotoFields:['photoId','photoPath']},function(err,userObj){
      if (err) return cbFun(err);
      if (!userObj || !userObj.userId){
        var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
        return cbFun(err);
      }
      if (userObj && userObj.primaryPhotoId){
        var photoResizedPathes = config.getResizedPhotoPathFromOriginal(userObj.primaryPhotoPath);
        userObj.primaryPhotoPaths = photoResizedPathes.s;
        userObj.primaryPhotoPathfw = photoResizedPathes.fw;
      }
      tool.copyFields({srcObj:{userId:userObj.userId, emailAccount:userObj.emailAccount, user:userObj},
        destObj:pageParams, overrideSameName:true});
      self.store.getUserPhotos({req:req,userId:userId, getSelf:true, count:config.config.userPhotoLooseLimit,
      photoFields:['photoId','state','photoPath']},function(err,photos){
        if (err) return cbFun(err);
        if (!photos || photos.length==0)  return cbFun(null);
        for(var i=0; i<photos.length; i++){
          var photoObj = photos[i];
          var photoResizedPathes = config.getResizedPhotoPathFromOriginal(photoObj.photoPath);
          photoObj.photoPaths = photoResizedPathes.s;
          photoObj.photoPathfw = photoResizedPathes.fw;
        }//for
        tool.copyFields({srcObj:{photos:photos}, destObj:pageParams, overrideSameName:true});
        return cbFun(null);
      });//getUserPhotos
    });//getUser
  };//getUserAndPhotos

  function doAction(cbFun){
    if (!requestParams.showUser && !requestParams.disableUser && !requestParams.enableUser){
      //not any submit button in page be clicked or not privide any action type, just show page
      //logger.logDebug("Server.viewDisableUser renderPage,doAction, (!requestParams.showUser && !requestParams.disableUser && !requestParams.enableUser) BE TRUE");
      return cbFun(null);
    }
    //do action

    if (!requestParams.emailAccount && !requestParams.userId){
      var err = self.newError({errorKey:'needParameter',messageParams:['emailAccount or userId'],messagePrefix:messagePrefix,req:req});
      return cbFun(err);
    }
    getUserId(function(err){
      if (err)  return cbFun(err);
      var userId = requestParams.userId;//it should be a valid userId, or else, there is err to indicate this.
      if (requestParams.showUser){
        //logger.logDebug("Server.viewDisableUser renderPage,doAction, (requestParams.showUser) BE TRUE");
        getUserAndPhotos(function(err){
          if (err)  return cbFun(err);
          pageParams.actionRetInfo = {user:pageParams.user, photos:pageParams.photos};
          pageParams.actionSuccess = true;
          return cbFun(null);
        });//getUserAndPhotos
        return;
      }else if(requestParams.disableUser){
        //logger.logDebug("Server.viewDisableUser renderPage,doAction, (requestParams.disableUser) BE TRUE");
        self.store.disableUser({req:req,userId:userId},function(err){
          if (err)  return cbFun(err);
          getUserAndPhotos(function(err){
            if (err)  return cbFun(err);
            pageParams.actionSuccess = true;
            return cbFun(null);
          });//getUserAndPhotos
        });//disableUser
        return;
      }else if(requestParams.enableUser){
        //logger.logDebug("Server.viewDisableUser renderPage,doAction, (requestParams.enableUser) BE TRUE");
        self.store.enableUser({req:req,userId:userId},function(err){
          if (err)  return cbFun(err);
          getUserAndPhotos(function(err){
            if (err)  return cbFun(err);
            pageParams.actionSuccess = true;
            return cbFun(null);
          });//getUserAndPhotos
        });//enableUser
        return;
      }else{//no possible else
        //logger.logDebug("Server.viewDisableUser renderPage,doAction, else BE TRUE");
        return cbFun(null);
      }
    });//getUserId
  };//doAction

  parseRequestParams(function(err){
    if (err) return handleErrorForPage(err);
    doAction(function(err){
      if (err) return handleErrorForPage(err);
      renderPage();//renderPage
    });//batchAudit
  });//parseRequestParams
};//viewDisableUser






/**
*
*
* @param req - contains emailAccount, returnFormat(page|json, default be page)
*   when returnFormat be json, it means it is a api call.
*
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.viewAdminLogIn = function(req, res) {
  var self = this;
  var messagePrefix = 'in Server.viewAdminLogIn, ';
  var requestParams = {} , pageParams = {};
  //logger.logDebug("Server.viewAdminLogIn req="+util.inspect(req,false,100));

  function parseRequestParams(cbFun){
    requestParams = {};
    tool.copyFields({srcObj:req.query,destObj:requestParams,overrideSameName:true});
    tool.copyFields({srcObj:req.body,destObj:requestParams,overrideSameName:true});
    //logger.logDebug("Server.viewAdminLogIn parseRequestParams, requestParams="+util.inspect(requestParams,false,100));
    var pageLibs = {util:util};
    pageParams = {layout:false, libs:pageLibs, err:null,errors:null, redirectUrl:null, rootUrl:config.getCloudStorageInfo().toBucketUrl,
        actionRetInfo : null, loginSuccess:null, alreadyLogin:null};

    return cbFun(null);
  };//parseRequestParams

  function renderPage(){
    //logger.logDebug("Server.viewAdminLogIn renderPage, pageParams="+util.inspect(pageParams,false,100));
    if (requestParams.returnFormat == 'json'){
      if (pageParams.alreadyLogin){
        var httpRetData = {status:'success'};
        self.returnDataFromResponse({res:res,req:req,data:httpRetData});
        return;
      }

      if (pageParams.err)  return self.handleError({err:pageParams.err,req:req,res:res});
      var httpRetData = {};
      if (pageParams.loginSuccess) httpRetData.status = 'success';
      else httpRetData.status = 'fail';
      if (pageParams.actionRetInfo){
        httpRetData.result = pageParams.actionRetInfo;
      }
      self.returnDataFromResponse({res:res,req:req,data:httpRetData});
      return;
    }else{
      if (pageParams.alreadyLogin){
        var urlInfo = shuffle.generateWebUrl({req:req, needSecure:false,path:'/adminWeb/functionList'});
        var redirectUrl = urlInfo.url;
        res.redirect(redirectUrl);
        return;
      }

      if (pageParams.err)  self.handleError({err:pageParams.err});
      //not handle pageParams.errors because self.handleError can not handle errors

      if (pageParams.loginSuccess){
        var urlInfo = shuffle.generateWebUrl({req:req, needSecure:false,path:'/adminWeb/functionList'});
        var redirectUrl = urlInfo.url;
        res.redirect(redirectUrl);
        return;
      }else{
        res.render('admin/logIn.ejs', pageParams);
        return;
      }
      return;
    }
  };//renderPage
  function handleErrorForPage(errInfo){
    //just do parse error
    if (errInfo){
      if (errInfo instanceof Array){
        var errors = errInfo;
        pageParams.errors = errors;
      }else{
        var err = errInfo;
        pageParams.err = err;
      }
    }
    return renderPage();
  };//handleErrorForPage

  function doAction(cbFun){
    if (req.session && req.session.userName){
      pageParams.alreadyLogin = true;
      return cbFun(null);
    }

    if (!requestParams.login){
      //not any submit button in page be clicked or not privide any action type, just show page
      return cbFun(null);
    }
    //do action
    if (!requestParams.userName){
      var err = self.newError({errorKey:'needParameter',messageParams:['userName'],messagePrefix:messagePrefix,req:req});
      return cbFun(err);
    }
    if (!requestParams.password){
      var err = self.newError({errorKey:'needParameter',messageParams:['password'],messagePrefix:messagePrefix,req:req});
      return cbFun(err);
    }
    var userName = requestParams.userName;
    var password = requestParams.password;
    self.auth.doAuth({userName:userName,password:password},function(err,authOK){
      if (err)  return cbFun(err);
      if (authOK){
        pageParams.loginSuccess = true;
        req.session.userName = userName;
        return cbFun(null);
      }else{
        var err = self.newError({errorKey:'simpleError',messageParams:[],messagePrefix:messagePrefix,req:req,message:'login failed'});
        return cbFun(err);
      }
      return;
    });//doAuth
  };//doAction

  parseRequestParams(function(err){
    if (err) return handleErrorForPage(err);
    doAction(function(err){
      if (err) return handleErrorForPage(err);
      renderPage();//renderPage
    });//doAction
  });//parseRequestParams
};//viewAdminLogIn





/**
*
*
* @param req - contains returnFormat(page|json, default be page)
*   when returnFormat be json, it means it is a api call.
*
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.viewFunctionList = function(req, res) {
  var self = this;
  var messagePrefix = 'in Server.viewFunctionList, ';
  var requestParams = {} , pageParams = {};

  function parseRequestParams(cbFun){
    requestParams = {};
    tool.copyFields({srcObj:req.query,destObj:requestParams,overrideSameName:true});
    tool.copyFields({srcObj:req.body,destObj:requestParams,overrideSameName:true});
    logger.logDebug("Server.viewFunctionList parseRequestParams, requestParams="+util.inspect(requestParams,false,100));
    var pageLibs = {util:util};
    pageParams = {layout:false, libs:pageLibs, err:null,errors:null, redirectUrl:null, rootUrl:config.getCloudStorageInfo().toBucketUrl,
        userName : ''};
    if (req.session && req.session.userName){
      pageParams.userName = req.session.userName;
    }

    return cbFun(null);
  };//parseRequestParams

  function renderPage(){
    //logger.logDebug("Server.viewFunctionList, renderPage");
    //logger.logDebug("Server.viewFunctionList renderPage, pageParams="+util.inspect(pageParams,false,100));
    if (requestParams.returnFormat == 'json'){
      if (pageParams.err)  return self.handleError({err:pageParams.err,req:req,res:res});
      var httpRetData = {};
      if (!pageParams.err) httpRetData.status = 'success';
      else httpRetData.status = 'fail';
      self.returnDataFromResponse({res:res,req:req,data:httpRetData});
      return;
    }else{
      if (pageParams.err)  self.handleError({err:pageParams.err});
      //not handle pageParams.errors because self.handleError can not handle errors
      res.render('admin/functionList.ejs', pageParams);
      return;
    }
  };//renderPage
  function handleErrorForPage(errInfo){
    //just do parse error
    if (errInfo){
      if (errInfo instanceof Array){
        var errors = errInfo;
        pageParams.errors = errors;
      }else{
        var err = errInfo;
        pageParams.err = err;
      }
    }
    return renderPage();
  };//handleErrorForPage

  function doAction(cbFun){
    return cbFun(null);
  };//doAction

  parseRequestParams(function(err){
    if (err) return handleErrorForPage(err);
    doAction(function(err){
      if (err) return handleErrorForPage(err);
      renderPage();//renderPage
    });//doAction
  });//parseRequestParams
};//viewFunctionList


Server.prototype.viewQueryUserData = function(req, res) {
  var self = this;
  var messagePrefix = i18n.__('in Server.viewQueryUserData, ');
  var requestParams = {} , pageParams = {};

  function handleErrorForPage(errInfo){
    //logger.logDebug("Server.viewQueryUserData, handleErrorForPage");
    if (errInfo){
      if (errInfo instanceof Array){
        var errors = errInfo;
        pageParams.errors = errors;
      }else{
        var err = errInfo;
        pageParams.err = err;
      }
    }
    self.handleError({err:errInfo});
    return res.render('admin/queryUserData.ejs', pageParams);
  };

  function parseRequestParams(cbFun){
    requestParams = handy.getRequestInParams(req);
    //logger.logDebug("Server.viewQueryUserData entered, requestParams="+util.inspect(requestParams,false,100));
    var pageLibs = {util:util};
    pageParams = {layout:false, libs:pageLibs, err:null,errors:null, redirectUrl:null,
        emailAccount:null, successfullyReset:false, textInPre:""};

    return cbFun(null);
  };//parseRequestParams

  function renderPage(cbFun){
    //logger.logDebug("Server.viewQueryUserData, renderPage");
    res.render('admin/queryUserData.ejs', pageParams);
    return cbFun(null);
  };//renderPage

  function doAction(cbFun){
    var params = tool.cloneObject(requestParams);
    params.req = req;
    self.store.getBusinessUsersDataByQuery(params,function(err,users){
      if (err) return cbFun(err);
      var usersLen = 0;
      if (users) usersLen = users.length;
      var textInPre = "users Data length: "+usersLen+"\n"+util.inspect(users,false,100);
      pageParams.textInPre = textInPre;
      return cbFun(null);
    });//getBusinessUsersDataByQuery
  };//doAction

  parseRequestParams(function(err){
    if (err) return handleErrorForPage(err);
    doAction(function(err){
      if (err) return handleErrorForPage(err);
      renderPage(function(err){
        if (err) return handleErrorForPage(err);
        //no err, page render already be done
      });//renderPage
    });//batchAudit
  });//parseRequestParams
};//viewQueryUserData


Server.prototype.viewRunMethod = function(req, res) {
  var self = this;
  var messagePrefix = i18n.__('in Server.viewRunMethod, ');
  var requestParams = {} , pageParams = {};

  function handleErrorForPage(errInfo){
    //logger.logDebug("Server.viewRunMethod, handleErrorForPage");
    if (errInfo){
      if (errInfo instanceof Array){
        var errors = errInfo;
        pageParams.errors = errors;
      }else{
        var err = errInfo;
        pageParams.err = err;
      }
    }
    self.handleError({err:errInfo});
    return res.render('admin/runMethod.ejs', pageParams);
  };

  function parseRequestParams(cbFun){
    requestParams = handy.getRequestInParams(req);
    //logger.logDebug("Server.viewRunMethod entered, requestParams="+util.inspect(requestParams,false,100));
    var pageLibs = {util:util};
    pageParams = {layout:false, libs:pageLibs, err:null,errors:null, redirectUrl:null,
        emailAccount:null, successfullyReset:false, textInPre:""};

    return cbFun(null);
  };//parseRequestParams

  function renderPage(cbFun){
    //logger.logDebug("Server.viewRunMethod, renderPage");
    res.render('admin/runMethod.ejs', pageParams);
    return cbFun(null);
  };//renderPage

  function doAction(cbFun){
    var params = tool.cloneObject(requestParams);
    params.req = req;
    self._runMethod(params, function(err,retInfo){
      if (err) return cbFun(err);
      var textInPre = "\n";
      if (retInfo && retInfo.length) textInPre = textInPre + "\ntop object len="+retInfo.length;
      textInPre = textInPre + "\n"+util.inspect(retInfo,false,100);
      pageParams.textInPre = textInPre;
      return cbFun(null);
    });//_runMethod
  };//doAction

  parseRequestParams(function(err){
    if (err) return handleErrorForPage(err);
    doAction(function(err){
      if (err) return handleErrorForPage(err);
      renderPage(function(err){
        if (err) return handleErrorForPage(err);
        //no err, page render already be done
      });//renderPage
    });//batchAudit
  });//parseRequestParams
};//viewRunMethod


/**
*
*
* @param req - contains returnFormat(page|json, default be page)
*   when returnFormat be json, it means it is a api call.
*
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.adminWebLogOut = function(req, res) {
  var self = this;
  var messagePrefix = 'in Server.adminWebLogOut, ';
  var requestParams = {} , pageParams = {};

  function parseRequestParams(cbFun){
    requestParams = {};
    tool.copyFields({srcObj:req.query,destObj:requestParams,overrideSameName:true});
    tool.copyFields({srcObj:req.body,destObj:requestParams,overrideSameName:true});
    logger.logDebug("Server.adminWebLogOut parseRequestParams, requestParams="+util.inspect(requestParams,false,100));
    var pageLibs = {util:util};
    pageParams = {layout:false, libs:pageLibs, err:null,errors:null, redirectUrl:null};

    return cbFun(null);
  };//parseRequestParams

  function renderPage(){
    //logger.logDebug("Server.adminWebLogOut renderPage, pageParams="+util.inspect(pageParams,false,100));
    if (requestParams.returnFormat == 'json'){
      if (pageParams.err)  return self.handleError({err:pageParams.err,req:req,res:res});
      var httpRetData = {};
      if (!pageParams.err) httpRetData.status = 'success';
      else httpRetData.status = 'fail';
      self.returnDataFromResponse({res:res,req:req,data:httpRetData});
      return;
    }else{
      if (pageParams.err)  self.handleError({err:pageParams.err});
      //not handle pageParams.errors because self.handleError can not handle errors
      var urlInfo = shuffle.generateWebUrl({req:req, needSecure:true,path:'/adminWeb/logIn'});
      var redirectUrl = urlInfo.url;
      res.redirect(redirectUrl);
      return;
    }
  };//renderPage
  function handleErrorForPage(errInfo){
    //just do parse error
    if (errInfo){
      if (errInfo instanceof Array){
        var errors = errInfo;
        pageParams.errors = errors;
      }else{
        var err = errInfo;
        pageParams.err = err;
      }
    }
    return renderPage();
  };//handleErrorForPage

  function doAction(cbFun){
    if (req.session){
      req.session.destroy(function(err){
        return cbFun(err);
      });//session.destroy
      return;
    }
    return cbFun(null);
  };//doAction

  parseRequestParams(function(err){
    if (err) return handleErrorForPage(err);
    doAction(function(err){
      if (err) return handleErrorForPage(err);
      renderPage();//renderPage
    });//doAction
  });//parseRequestParams
};//adminWebLogOut



/**
*
*
* @param req - contains
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.adminChangeUserCredit = function(req, res) {
  var self = this;
  //logger.logDebug("Server.adminChangeUserCredit entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.adminChangeUserCredit, ';
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  if (!req.body.delta){
    var err = self.newError({errorKey:'needParameter',messageParams:['delta'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var userId = req.body.userId;
  var delta = req.body.delta;
  self.store.doCreditTransaction({req:req,userId:userId,delta:delta,reason:"admin change"},function(err){
    if (err) return self.handleError({err:err,req:req,res:res});
    var httpRetData = {status:'success'};
    self.returnDataFromResponse({res:res,req:req,data:httpRetData});
  });//store.adminChangeUserCredit
};//adminChangeUserCredit

/**
*
*
* @param req - contains
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.adminSetAppUsage = function(req, res) {
  var self = this;
  //logger.logDebug("Server.adminSetAppUsage entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.adminSetAppUsage, ';
  if (!req.body.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }

  var usage = req.body.usage;
  if (usage == 'prod'){
    config.config.usage = usage;
  }else if (usage == 'dev'){
    config.config.usage = usage;
  }else{
    var err = self.newError({errorKey:'unsupportedValueForParam',messageParams:[usage,'usage'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var httpRetData = {status:'success'};
  self.returnDataFromResponse({res:res,req:req,data:httpRetData});
  return;
};//adminSetAppUsage

/**
*
*
* @param req - contains
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.getConfig = function(req, res) {
  var self = this;
  //logger.logDebug("Server.getConfig entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.getConfig, ';

  //console.log("in getConfig, config.usage="+util.inspect(config.config.usage,false,2));

  var getAll = null;
  if (req.body)  getAll = req.body.getAll;
  if (getAll == null)  getAll = req.query.getAll;
  getAll = handy.convertToBool(getAll);
  var config2 = tool.cloneObject(config.config);
  if (getAll){
    var httpRetData = {status:'success',result:config2};
    self.returnDataFromResponse({res:res,req:req,data:httpRetData});
    return;
  }else{
    delete config2.errors;
    delete config2.c2dmMailAccount;
    delete config2.c2dmMailPwd;
    delete config2.apnsSslPassphrase;
    var httpRetData = {status:'success',result:config2};
    self.returnDataFromResponse({res:res,req:req,data:httpRetData});
    return;
  }
};//getConfig


/**
*
*
* @param req - contains methodName, libName(optional) and others
* @param res
* @returns
*   {status:success|fail}
*/
Server.prototype.adminRunMethod = function(req, res) {
  var self = this;
  var messagePrefix = 'in Server.adminRunMethod, ';
  var params = handy.getRequestInParams(req);
   //logger.logDebug("Server.adminRunMethod entered, params="+util.inspect(params,false,100));
  if (!params.methodName){
    var err = self.newError({errorKey:'needParameter',messageParams:['methodName'],messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err,req:req,res:res});
  }
  var methodName = params.methodName;
  var libName = params.libName;
  var format = params.format;

  var httpRetData = {status:'success'};
  if (!libName){
    if (methodName=='checkAndNotifyDaters'){
      self.checkAndNotifyDaters({}, function(err){
        if (err) return self.handleError({err:err,req:req,res:res});
        self.returnDataFromResponse({res:res,req:req,data:httpRetData,format:format});
        return;
      });//checkAndNotifyDaters
      return;
    }else if(methodName=='storeGetUserIdsByQuery'){
      return self.storeGetUserIdsByQuery(req,res);
    }else if(methodName=='disableUser'){
      return self.disableUser(req,res);
    }
  }else{
    self._runMethod(params, function(err,retInfo){
      if (err) return self.handleError({err:err,req:req,res:res});
      if (retInfo) httpRetData.result = retInfo;
      self.returnDataFromResponse({res:res,req:req,data:httpRetData,format:format});
      return;
    });//_runMethod
    return;
  }
  self.returnDataFromResponse({res:res,req:req,data:httpRetData,format:format});
  return;
};//adminRunMethod

Server.prototype._runMethod = function(params,cbFun) {
  var self = this;
  var messagePrefix = 'in Server._runMethod, ';
  var req = params.req;
  if(!cbFun){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  //logger.logDebug("Server._runMethod entered, params="+handy.inspectWithoutBig(params));
  if (!params.methodName){
    var err = self.newError({errorKey:'needParameter',messageParams:['methodName'],messagePrefix:messagePrefix,req:req});
    return cbFun(err);
  }
  if (!params.libName){
    var err = self.newError({errorKey:'needParameter',messageParams:['libName'],messagePrefix:messagePrefix,req:req});
    return cbFun(err);
  }
  var methodName = params.methodName;
  var libName = params.libName;
  function commonCallback(err,data){
    if (err) return cbFun(err);
    return cbFun(null,data);
  };//commonCallback
  var evalCodes = "self."+libName+"."+methodName+"(params,commonCallback);";
  eval(evalCodes);
  return;
};//_runMethod



Server.prototype.storeGetUserIdsByQuery = function(req, res) {
  var self = this;
  //logger.logDebug("Server.storeGetUserIdsByQuery entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.storeGetUserIdsByQuery, ';
  var params = tool.cloneObject(req.body);
  params.req = req;
  self.store.getUserIdsByQuery(params,function(err,userIds){
    if (err) return self.handleError({err:err,req:req,res:res});
    //logger.logDebug("Server.storeGetUserIdsByQuery getUserIdsByQuery callback, userIds="+util.inspect(userIds,false,100));
    var httpRetData = {status:'success',result:{userIds:userIds}};
    self.returnDataFromResponse({res:res,req:req,data:httpRetData});
    return;
  });//store.getUserIdsByQuery
};//storeGetUserIdsByQuery
/**
 *
 * @param req - contains userId, disableUser(bool)
 * @param res
 */
Server.prototype.disableUser = function(req, res) {
  var self = this;
  //logger.logDebug("Server.disableUser entered, params in body="+util.inspect(req.body,false,100));
  var messagePrefix = 'in Server.disableUser, ';
  var params = tool.cloneObject(req.body);
  var userId = params.userId;
  if (params.disableUser){
    self.store.disableUser({req:req,userId:userId},function(err){
      if (err) return self.handleError({err:err,req:req,res:res});
      var httpRetData = {status:'success'};
      self.returnDataFromResponse({res:res,req:req,data:httpRetData});
      return;
    });//disableUser
    return;
  }else{
    self.store.enableUser({req:req,userId:userId},function(err){
      if (err)  return self.handleError({err:err,req:req,res:res});
      var httpRetData = {status:'success'};
      self.returnDataFromResponse({res:res,req:req,data:httpRetData});
      return;
    });//enableUser
    return;
  }
  return;
};//disableUser


/**
 *
 * @param params - contains nothing for now
 * @param callback - have little use
 * @returns
 */
Server.prototype.checkAndNotifyDaters = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Server.checkAndNotifyDaters, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  var timeNowUtc = handy.getNowOfUTCdate().getTime();
  var notifyDaterUpLimitTime = timeNowUtc + config.config.notifyDaterAdvanceTime;
  var batchCount = config.config.notifyDaterBatchCount;
  var recursiveLevel = 0;

  /**
   *
   * @param cbFun is function(err,dealInfo)
   *   dealInfo always have value. contains needDealNext
   */
  function dealOneBatch(cbFun){
    recursiveLevel ++;
    self.store.shiftToNotifyDate({req:req,fromTime:timeNowUtc, toTime:notifyDaterUpLimitTime, batchCount:batchCount},function(err,dateIds){
      if (err) return cbFun(err);
      var dealInfo = {needDealNext:false};
      if (!dateIds || dateIds.length==0){
        dealInfo.needDealNext = false;
        return cbFun(null,dealInfo);
      }
      if (dateIds.length == batchCount) dealInfo.needDealNext = true;
      else dealInfo.needDealNext = false;
      self.store.getDates({req:req,dateIds:dateIds,dateFields:['dateId','senderId','finalCandidateId','haveSendNotificationForBothSide']},function(err,dates){
        if (err) return cbFun(err,dealInfo);
        self.notification.sendNotificationForNotifyDaters({dates:dates},function(err, notifyInfo){
          if (err) return cbFun(err,dealInfo);
          var datesNotifyInfo = [];
          var failDates = notifyInfo.failDates;
          if (failDates && failDates.length>0){
            //just log error here
            logger.logError("Server.checkAndNotifyDaters, dealOneBatch level="+recursiveLevel+", sendNotificationForNotifyDaters callback, failDates=\n"+util.inspect(failDates,false,100));
            for(var i=0; i<failDates.length; i++){
              var failDate = failDates[i];
              var dateNotifyInfo = {dateId:failDate.date.dateId, haveSendNotificationForSender:!failDate.senderErr, haveSendNotificationForResponder:!failDate.responderErr};
              datesNotifyInfo.push(dateNotifyInfo);
            }//for
          }
          var successDates = notifyInfo.successDates;
          logger.logDebug("Server.checkAndNotifyDaters, dealOneBatch level="+recursiveLevel+", sendNotificationForNotifyDaters callback, successDates=\n"+util.inspect(successDates,false,100));
          if (successDates && successDates.length>0){
            for(var i=0; i<successDates.length; i++){
              var successDate = successDates[i];
              var dateNotifyInfo = {dateId:successDate.date.dateId, haveSendNotificationForSender:true, haveSendNotificationForResponder:true};
              datesNotifyInfo.push(dateNotifyInfo);
            }//for
          }
          self.store.markDatesNotifyInfo({req:req,datesNotifyInfo:datesNotifyInfo},function(err){
            if (err) return cbFun(err,dealInfo);
            return cbFun(null,dealInfo);
          });//markDatesNotifyInfo
        });//notification.sendNotificationForNotifyDaters
      });//store.getDates
    });//store.shiftToNotifyDate
  };//dealOneBatch

  function dealOneBatchCallback(err,dealInfo){
      if (err){
        self.handleError({err:err});
      }
      if (dealInfo.needDealNext){
        process.nextTick(function(){
          dealOneBatch(dealOneBatchCallback);
        });
        return;
      }else return callback(null);
  };//dealOneBatchCallback
  dealOneBatch(dealOneBatchCallback);
};//checkAndNotifyDaters



Server.prototype.staticHandler = function(req,res){
  logger.logDebug("Server.staticHandler entered, url="+req.url);
  var pathname = url.parse(req.url).pathname;
  var cssFlag = "/css/";
  var jsFlag = "/js/";
  var htmlResourcePath = path.join( __dirname,'../views/resource');
  var physicalFilePath = "";
  if (pathname.indexOf(cssFlag) == 0 || pathname.indexOf(jsFlag) == 0){
    physicalFilePath = path.join(htmlResourcePath,pathname);
  }
  //TODO CHECK physicalFilePath in htmlResourcePath
  if (!physicalFilePath){
    res.writeHead(404);
    res.end();
    return;
  }
  var extname = path.extname(pathname);
  var content_type = handy.getMimeFromExtName(extname);
  fs.readFile(physicalFilePath, function (err, data) {
    if (err) return self.handleError({err:err,req:req,res:res});
    var body = data;
    headers = { "Content-Type": content_type
            , "Content-Length": body.length
            , "Cache-Control": "public"
            };
    res.writeHead(200, headers);
    res.end(body);
    return;
  });//readFile
  return;
};//staticHandler














