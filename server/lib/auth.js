var util = require('util');
var assert = require('assert');
var path = require('path');
var tls = require('tls');
var fs = require('fs');

var handy = require('./handy');
var logger = require('./logger');
var config = require('./config');
exports = module.exports = Auth;

exports.create = function () {
  //logger.logDebug("Auth create entered");
  return new Auth ();
};

function Auth() {
  //logger.logDebug("Auth function entered");
  var self = this;
};

var localConfig = exports.config = {
      //passwordFile : path.join(__dirname,'../data/password'),
      userPwds : [{name:'sys',pwd:'a930d1490289a2ecbbe27f2ceb71b6c5'},//lz@y
                  {name:'sysL',pwd:'a930d1490289a2ecbbe27f2ceb71b6c5'},
                  {name:'sysB',pwd:'a930d1490289a2ecbbe27f2ceb71b6c5'},
                  {name:'sysS',pwd:'a930d1490289a2ecbbe27f2ceb71b6c5'},
                  {name:'sysW',pwd:'a930d1490289a2ecbbe27f2ceb71b6c5'},
                  {name:'sysZ',pwd:'a930d1490289a2ecbbe27f2ceb71b6c5'}]
};


/**
 *
 * @param params - contains userName, password
 * @param callback - is function(err, authOK)
 *   authOK is boolean
 */
Auth.prototype.doAuth = function(params, callback){
  //logger.logDebug("Auth.doAuth entered");
  var messagePrefix = 'in Auth.doAuth, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  if(!params.userName){
    var err = self.newError({errorKey:'needParameter',messageParams:['userName'],messagePrefix:messagePrefix});
    return callback(err);
  }
  var userName = params.userName;
  var password = params.password;
  if (!password)  password = '';
  var ePwd = handy.encrypt(password);
  var userPwds = localConfig.userPwds;
  var authOK = false;
  for(var i=0; i<userPwds.length; i++){
    var userPwdObj = userPwds[i];
    if (userPwdObj.name == userName && userPwdObj.pwd == ePwd){
      authOK = true;
      break;
    }
  }//for
  return callback(null,authOK);
};//doAuth







