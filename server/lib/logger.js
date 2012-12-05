var util = require('util');
var assert = require('assert');
var Syslog = require('node-syslog');


var config = require('./config');

//let handy ref logger, but something still need ref handy. and recursive ref proved to OK.
var handy = require("./handy");


/*
 * to use syslog, need to do below things
 * vi /etc/syslog.conf
 * add one line as below:
 *   local1.*                               -/var/log/local1.log
 * modify one line as below, mainly add local1.none, to let only 1 file be written to improve performance
 *   *.info;mail.none;news.none;authpriv.none;cron.none;local1.none          /var/log/messages
 *
 * after modified syslog.conf, restart the service:
 * /etc/init.d/syslog restart
 *
 *
 *

 *
 *
 *
 * then you can look at the content in /var/log/local1.log .
 *
 * to use logrotate,
 * create a file /etc/logrotate.d/local1 with below content
/var/log/local1.log {
    rotate 5
    size 10M
    sharedscripts
    postrotate
        killall -HUP syslogd
    endscript
}




 * size 10M means > 10M
 * you can run below command to test
 * /usr/sbin/logrotate -v /etc/logrotate.conf
 *
 * There is a PROBLEM that the real size of the log file can exceed much than defined,
 * because logrotate is executed by crontab, can not response immediately.
 *
 * create a file cronLogrotate.txt , content as below, SHOULD USE vi, CAN NOT EDIT IN WINDOWS
 * this is every minute
 */
//  */1 * * * * /usr/sbin/logrotate /etc/logrotate.conf
/*
 * then run :  crontab cronLogrotate.txt
 *
 */

/*
 * on ubuntu linux
 * /etc/rsyslog.conf
 * /etc/rsyslog.d/50-default.conf
 *
 * service rsyslog restart
 * /etc/init.d/rsyslog restart
 *
 * /etc/logrotate.d/local1

/var/log/local1.log {
    rotate 5
    size 10M
    sharedscripts
    postrotate
        killall -HUP rsyslogd
    endscript
}

on amazon centOs linux
TODO do more testing
 * vi /etc/rsyslog.conf
 * /etc/init.d/rsyslog restart

/var/log/local1.log {
    rotate 5
    size 10M
    sharedscripts
    postrotate
        killall -HUP syslogd
    endscript
}

/var/log/local1.log {
    rotate 5
    size 10M
    sharedscripts
    postrotate
        killall -HUP rsyslogd
    endscript
}
 *
 *
 */








/**
 * here only 1 instance can be created
 * @param params - contains logToConsole, logToSyslog
 *   if logToConsole, logToSyslog not provided here, the values in config will be used.
 *
 */
function Logger(params) {
  if (params != null && params.logToConsole != null){
    this.logToConsole = params.logToConsole;
  }else{
    this.logToConsole = config.config.logToConsole;
  }

  if (params != null && params.logToSyslog != null){
    this.logToSyslog = params.logToSyslog;
  }else{
    this.logToSyslog = config.config.logToSyslog;
  }

  if (params != null && params.logLevel != null){
    this.logLevel = params.logLevel;
  }else{
    this.logLevel = config.config.logLevel;
  }

  Syslog.init("p1server", Syslog.LOG_ODELAY, Syslog.LOG_LOCAL1);
};//Logger
exports.Logger = Logger;

Logger.prototype.logError = function (message) {
  if (this.logLevel < config.constants.LogLevelError)
    return;
  if (this.logToConsole)
    consoleLogError(message);
  if (this.logToSyslog)
    Syslog.log(Syslog.LOG_ERR, message);
};//logError


Logger.prototype.logWarning = function (message) {
  if (this.logLevel < config.constants.LogLevelWarning)
    return;
  if (this.logToConsole)
    consoleLogWarning(message);
  if (this.logToSyslog)
    Syslog.log(Syslog.LOG_WARNING, message);
};//logWarning


Logger.prototype.logInfo = function (message) {
  if (this.logLevel < config.constants.LogLevelInfo)
    return;
  if (this.logToConsole)
    consoleLogInfo(message);
  if (this.logToSyslog)
    Syslog.log(Syslog.LOG_INFO, message);
};//logInfo


Logger.prototype.logDebug = function (message) {
  if (this.logLevel < config.constants.LogLevelDebug)
    return;
  if (this.logToConsole)
    consoleLogDebug(message);
  if (this.logToSyslog)
    Syslog.log(Syslog.LOG_DEBUG, message);
};//logDebug


var gLogger = null;
var getLogger = exports.getLogger = function(){
  if (gLogger == null)
    gLogger = new Logger();
  return gLogger;
};
var logError = exports.logError = function(message){
  getLogger().logError(message);
};

var logWarning = exports.logWarning = function(message){
  getLogger().logWarning(message);
};

var logInfo = exports.logInfo = function(message){
  getLogger().logInfo(message);
};

var logDebug = exports.logDebug = function(message){
  getLogger().logDebug(message);
};



var consoleLogLevel = exports.consoleLogLevel = function(level,pick,message){
  var colors = config.colors;
  if (level <= config.config.logLevel){
    var color = colors[pick] == undefined ? colors['yellow'] : colors[pick];
    var dt = handy.getNowOfUTCdate();
    var dtMsStr = dt.getUTCFullYear()+"-"+dt.getUTCMonth()+"-"+dt.getUTCDate()+ " "+dt.getUTCHours()+":"+dt.getUTCMinutes()+":"+dt.getUTCSeconds()+"."+dt.getMilliseconds();
    var msg = dtMsStr+' (UTC) '+message;
    util.print('\033[' + color[0] + 'm');
    if (config.config.logToStderr)
      console.error(msg);
    else
      console.log(msg);
    util.print('\033[' + color[1] + 'm');
  }
};

var consoleLogError = exports.consoleLogError = function(message){
  var errorLevel = 0;
  consoleLogLevel(errorLevel,'red',message);
};

var consoleLogWarning = exports.consoleLogWarning = function(message){
  var warningLevel = 1;
  consoleLogLevel(warningLevel,'yellow',message);
};

var consoleLogInfo = exports.consoleLogInfo = function(message){
  var infoLevel = 2;
  consoleLogLevel(infoLevel,'green',message);
};

var consoleLogDebug = exports.consoleLogDebug = function(message){
  var debugLevel = 3;
  consoleLogLevel(debugLevel,'blue',message);
};







