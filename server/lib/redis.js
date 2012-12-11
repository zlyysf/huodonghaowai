
var assert = require('assert');
var util = require('util');

var redis = require("redis");

var handy = require("./handy");
var tool = require("./tool");
var logger = require('./logger');
var config = require('./config');
var shuffle = require('./shuffle');


exports = module.exports = Redis;

exports.create = function(port) {
  return new Redis(port);
};

function Redis(port) {
  this.client = redis.createClient(port);
};

Redis.prototype.client = null;

Redis.prototype.quit = function (callback) {
  logger.logDebug("redis quit entered");
  var self = this;
  var messagePrefix = 'in Redis.quit, ';
  self.client.quit(function(err){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    if (callback) return callback(null);
    return;
  });
};//quit

/**
 *
 * @param params - contains all(bool) , excludeFilter(string)
 *   excludeFilter only can be string for now, TODO regex support
 * @param callback
 * @returns
 */
Redis.prototype.clean = function (params,callback) {
  logger.logDebug("redis clean entered");
  var self = this;
  var messagePrefix = 'in Redis.clean, ';
  var req = params.req;
  if (!params){
    //may show help
    if (callback) return callback(null);
    return;
  }

  if (params.all === true){
    self.client.flushdb(function(err){
      if (err){
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      if (callback) return callback(null);
      return;
    });//flushdb
    return;
  }//if (params.all === true)

  if (params.excludeFilter != null){
    var excludeFilter = params.excludeFilter;
    self.client.keys('*',function(err,retKeys){
      if (err){
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      if (!retKeys || retKeys.length == 0){
        if (callback) return callback(null);
        return;
      }
      //retKeys.length>0
      var multi = self.client.multi();
      for (var i=0; i<retKeys.length; i++) {
        var key = retKeys[i];
        if (key==excludeFilter)
          continue;
        multi.del(key);
      }
      multi.exec(function(err) {
        if (err){
          var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
          if (callback) return callback(err2);
          else return self.handleError({err:err2});
        }
        if (callback) return callback(null);
        return;
      });//multi.exec
    });//keys
  }//if (params.excludeFilter != null)
};//clean

/**
 * just support single filter, not filter array. but support exclude some from conditions.
 * can support redis regex grammar, only ?,*,[chars] supported.
 * also support javascript regex grammar.
 * @param params - contains contains filterType, filterValue, excludeRegex, includeRegexAttributes, excludeRegexAttributes
 *   filterType = regexRedis|regexJs|busUser|busTopic
 *     when filterType be regexRedis|regexJs, exclude param is valid, it is a js regex.
 *
 * @param callback - is a function(err,keys)
 */
Redis.prototype.getKeys = function (params,callback) {
  var self = this;
  var messagePrefix = 'in Redis.getKeys, ';
  if (!params.filterType){
    var err = self.newError({errorKey:'needParameter',messageParams:['filterType'],messagePrefix:messagePrefix});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.filterValue){
    var err = self.newError({errorKey:'needParameter',messageParams:['filterValue'],messagePrefix:messagePrefix});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var filterType = params.filterType;
  var filterValue = params.filterValue;
  var excludeRegex = params.excludeRegex;
  var includeRegexAttributes = params.includeRegexAttributes;
  var excludeRegexAttributes = params.excludeRegexAttributes;

  /**
   * @param params - contains contains keys, excludeRegex, excludeRegexAttributes
   * @returns - filtered keys
   */
  function excludeKeys(params){
    var keys = params.keys;
    var excludeRegex = params.excludeRegex;
    var excludeRegexAttributes = params.excludeRegexAttributes;
    if (keys == null || keys.length == 0)
      return null;
    if (excludeRegex==null || excludeRegex=='')
      return keys;
    var regexExclude = new RegExp(excludeRegex,excludeRegexAttributes);
    var retKeys = [];
    for(var i=0; i<keys.length; i++){
      var key = keys[i];
      if(regexExclude.test(key)){
        continue;
      }
      retKeys.push(key);
    }//for
    if (retKeys == null || retKeys.length == 0)
      return null;
    return retKeys;
  };//excludeKeys

  /**
   * first do include filtering, then do exclude filtering
   * @param params - contains contains keys, includeRegex, includeRegexAttributes, excludeRegex, excludeRegexAttributes
   * @returns - filtered keys
   */
  function filterKeys(params){
    var keys = params.keys;
    var includeRegex = params.includeRegex;
    var includeRegexAttributes = params.includeRegexAttributes;
    var excludeRegex = params.excludeRegex;
    var excludeRegexAttributes = params.excludeRegexAttributes;
    if (keys == null || keys.length == 0)
      return null;
    if (includeRegex == null || includeRegex == '')
      return null;
    var regexInclude = new RegExp(includeRegex,includeRegexAttributes);
    var regexExclude = null;
    if ( excludeRegex != null && excludeRegex != ''){
      regexExclude = new RegExp(excludeRegex,excludeRegexAttributes);
    }
    var retKeys = [];
    for(var i=0; i<keys.length; i++){
      var key = keys[i];
      if (regexInclude.test(key)){
        if(regexExclude && regexExclude.test(key)){
          continue;
        }
        retKeys.push(key);
      }
    }//for
    if (retKeys == null || retKeys.length == 0)
      return null;
    return retKeys;
  };//filterKeys

  if(filterType=='regexRedis'){
    self.client.keys(filterValue,function(err,retKeys){
      if (err){
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      var filteredKeys = excludeKeys({keys:retKeys, excludeRegex:excludeRegex, excludeRegexAttributes:excludeRegexAttributes});
      if (callback) return callback(null,filteredKeys);
      return;
    });//client.keys
  }else if(filterType=='regexJs'){
    self.client.keys('*',function(err,retKeys){
      if (err){
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      var filteredKeys = filterKeys({keys:retKeys, includeRegex:filterValue, includeRegexAttributes:includeRegexAttributes, excludeRegex:excludeRegex, excludeRegexAttributes:excludeRegexAttributes});
      if (callback) return callback(null,filteredKeys);
      return;
    });//client.keys
  }
  else{
    var err = self.newError({errorKey:'unsupportedFilterType',messageParams:['filterType'],messagePrefix:messagePrefix});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
};//getKeys



/**
 * get redis key types from redis keys
 * @param params - contains keys
 * @param callback - is a function(err,types)
 */
Redis.prototype.getKeysTypes = function (params,callback) {
  var self = this;
  var messagePrefix = 'in Redis.getKeysTypes, ';
  var keys = params.keys;
  if (!keys || keys.length == 0){
    if (callback) return callback(null,null);
    return;
  }
  var multi = self.client.multi();
  for (var i=0; i<keys.length; i++) {
    var key = keys[i];
    multi.type(key);
  }
  multi.exec(function(err,types){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    //replace assert.ok(..) to below check codes because the error thrown by assert can not be returned to caller
    if(!(types.length > 0)){
      var err = self.newError({errorKey:'needVariableMeetCondition',messageParams:['types.length > 0'],messagePrefix:messagePrefix});
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (callback) return callback(null,types);
    return;
  });//exec
};//getKeysTypes


/**
 *
 * @param params - contains keys, types
 * @param callback - is a function(err, kvHash)
 *   kvHash is a hash object include key-value pairs
 */
Redis.prototype.getDataByKeysAndTypes = function(params,callback){
  var self = this;
  var messagePrefix = 'in Redis.getDataByKeysAndTypes, ';
  var keys = params.keys;
  var types = params.types;
  if (!keys || keys.length == 0 || !types || types.length == 0){
    if (callback) return callback(null,null);
    return;
  }
  //length > 0
  //replace assert.ok(..) to below check codes because the error thrown by assert can not be returned to caller
  if(!(keys.length == types.length)){
    var err = self.newError({errorKey:'needVariableMeetCondition',messageParams:['keys.length == types.length'],messagePrefix:messagePrefix});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var multi = self.client.multi();
  for(var i=0; i<keys.length; i++){
    var key = keys[i];
    var type = types[i];
    if (type=='string'){
      multi.get(key);
    }else if (type=='list'){
      multi.lrange(key,0,-1);
    }else if (type=='set'){
      multi.smembers(key);
    }else if (type=='zset'){
      multi.zrange(key,0,-1);
    }else if (type=='hash'){
      multi.hgetall(key);
    }else{
      multi.get(key);
    }
  }//for
  multi.exec(function(err,retValues){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    //replace assert.ok(..) to below check codes because the error thrown by assert can not be returned to caller
    if(!(retValues.length > 0)){
      var err = self.newError({errorKey:'needVariableMeetCondition',messageParams:['retValues.length > 0'],messagePrefix:messagePrefix});
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    var kvHash = {};
    for(var i=0; i<keys.length; i++){
      var key = keys[i];
      var val = retValues[i];
      kvHash[key] = val;
    }//for
    if (callback) return callback(null,kvHash);
    return;
  });//exec
};//getDataByKeysAndTypes

/**
 * just support single filter, not filter array. but support exclude some from conditions.
 * can support redis regex grammar, only ?,*,[chars] supported.
 * also support javascript regex grammar.
 * @param params - contains contains filterType, filterValue, excludeRegex, includeRegexAttributes, excludeRegexAttributes
 *   filterType = regexRedis|regexJs | busUser|busDate|busPhoto
 *     when filterType be regexRedis|regexJs, exclude param is valid, it is a js regex.
 *   @see Redis.prototype.getKeys
 * @param callback - is a function(err, data)
 *   when filterType = regexRedis|regexJs, data is a Hash which contains redis key-value pairs.
 *   when filterType = busUser|busDate|busPhoto, data is an array.
 *
 *
 *
 */
Redis.prototype.getData = function (params,callback) {
  var self = this;
  var messagePrefix = 'in Redis.getData, ';
  var filterType = params.filterType;
  if (filterType == 'regexRedis' || regexRedis == 'regexJs'){
    self.getKeys(params, function(err,keys){
      if (err){
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      if (!keys || keys.length == 0){
        if (callback) return callback(null,null);
        return;
      }
      keys.sort();
      logger.logInfo("keys got="+util.inspect(keys));
      self.getKeysTypes({keys:keys},function(err,types){
        if (err){
          if (callback) return callback(err);
          else return self.handleError({err:err});
        }
        self.getDataByKeysAndTypes({keys:keys,types:types},function(err,kvHash){
          if (err){
            if (callback) return callback(err);
            else return self.handleError({err:err});
          }
          if (callback) return callback(null,kvHash);
          return;
        });//getDataByKeysAndTypes
      });//getKeysTypes
    });//getKeys
  }else{
    if (callback) return callback(null,null);
    return;
  }
};//getData



/**
*
* @param {Object} params - contains userIds
* @param {Function} callback - is function(err,usersAllData)
*   each item of usersAllData contains those possible fields:
*   user, userPhotoIds, userPhotoIdsLen, userAuditPassedPhotoIds, userAuditPassedPhotoIdsLen, userDeletedPhotoIds, userDeletedPhotoIdsLen,
*   userDateIds, userDateIdsLen, userSendDateIds, userSendDateIdsLen, userActiveDateIds, userActiveDateIdsLen,
*   followingUserIds, followingUserIdsLen, followerUserIds, followerUserIdsLen, allPossibleFollowerUserIds, allPossibleFollowerUserIdsLen, followingFeedIds, followingFeedIdsLen,
*   userCredit, userCreditTransactionIds, userCreditTransactionIdsLen,
*   userPhotos, userAuditPassedPhotos, userDeletedPhotos, userDates, userSendDates, userActiveDates, userDateObjs,
*   followingUsers, followerUsers, allPossibleFollowerUsers, followingFeeds, userCreditTransactions
*/
Redis.prototype.getRawUsersLevelAll = function(params, callback) {
  var messagePrefix = 'in Redis.getRawUsersLevelAll, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  var userIds = params.userIds;
  if (!userIds || userIds.length == 0)
    return callback(null, null);

  self.getRawUsersLevel1({userIds:userIds}, function(err,usersAllData){
    if (err) return callback(err);
    self.getRawUsersLevel2({usersAllData:usersAllData}, function(err,usersAllData){
      if (err) return callback(err);
      return callback(null,usersAllData);
    });//getRawUsersLevel2
  });//getRawUsersLevel1
};//getRawUsersLevelAll


/**
*
* @param {Object} params - contains userIds
* @param {Function} callback - is function(err,usersAllData)
*   each item of usersAllData contains those possible fields:
*   user, userPhotoIds, userPhotoIdsLen, userAuditPassedPhotoIds, userAuditPassedPhotoIdsLen, userDeletedPhotoIds, userDeletedPhotoIdsLen,
*   userDateIds, userDateIdsLen, userSendDateIds, userSendDateIdsLen, userActiveDateIds, userActiveDateIdsLen,
*   followingUserIds, followingUserIdsLen, followerUserIds, followerUserIdsLen, allPossibleFollowerUserIds, allPossibleFollowerUserIdsLen, followingFeedIds, followingFeedIdsLen,
*   userCredit, userCreditTransactionIds, userCreditTransactionIdsLen
*/
Redis.prototype.getRawUsersLevel1 = function(params, callback) {
  var messagePrefix = 'in Redis.getRawUsersLevel1, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  var userIds = params.userIds;
  if (!userIds || userIds.length == 0)
    return callback(null, null);

  var multi = self.client.multi();

  for (idx in userIds) {
    var userId = userIds[idx];
    var userKey = 'user:'+userId;
    multi.hgetall(userKey);

    var userPhotosKey = 'user:'+userId+':photos';
    var userAuditPassedPhotosKey = 'user:'+userId+':auditPassedPhotos';
    var userDeletedPhotosKey = 'user:'+userId+':deletedPhotos';
    multi.zrange(userPhotosKey,0,-1);
    multi.zrange(userAuditPassedPhotosKey,0,-1);
    multi.zrange(userDeletedPhotosKey,0,-1);

    var userDatesKey = 'user:'+userId+':dates';
    var userDoubleConfirmDatesKey = 'user:'+userId+':doubleConfirmDates';
    var userScheduleDatesKey = 'user:'+userId+':scheduleDates';
    var userInvitedDatesKey = 'user:'+userId+':invitedDates';
    var userSendDatesKey = 'user:'+userId+':sendDates';
    var userReceiveDatesKey = 'user:'+userId+':receiveDates';
    var userActiveDatesKey = 'user:'+userId+':activeDates';
    var userActiveSendDatesKey = 'user:'+userId+':activeSendDates';
    var userActiveReceiveDatesKey = 'user:'+userId+':receiveSendDates';
    var userActiveRespondDatesKey = 'user:'+userId+':activeRespondDates';
    var userActiveApplyingDatesKey = 'user:'+userId+':activeApplyingDates';

    multi.zrange(userDatesKey,0,-1);
    multi.zrange(userDoubleConfirmDatesKey,0,-1);
    multi.zrange(userScheduleDatesKey,0,-1);
    multi.zrange(userInvitedDatesKey,0,-1);
    multi.zrange(userSendDatesKey,0,-1);
    multi.zrange(userReceiveDatesKey,0,-1);
    multi.zrange(userActiveDatesKey,0,-1);
    multi.zrange(userActiveSendDatesKey,0,-1);
    multi.zrange(userActiveReceiveDatesKey,0,-1);
    multi.zrange(userActiveRespondDatesKey,0,-1);
    multi.zrange(userActiveApplyingDatesKey,0,-1);

    var followingKey = 'following:user:'+userId;
    var followerKey = 'follower:user:'+userId;
    var allPossibleFollowerKey = 'allPossibleFollower:user:'+userId;
    var followingFeedsKey = "user:"+userId+":feeds";
    multi.smembers(followingKey);
    multi.smembers(followerKey);
    multi.smembers(allPossibleFollowerKey);
    multi.zrange(followingFeedsKey,0,-1);

    var userCreditKey = "userCredit:"+userId;
    var userCreditTransactionKey = "userCreditTransaction:"+userId;
    multi.hgetall(userCreditKey);
    multi.lrange(userCreditTransactionKey,0,-1);

    var userReceiveDatesKey = 'user:'+userId+':receiveDates';
    multi.zrange(userReceiveDatesKey,0,-1);

    var userDateConversationsKey = 'user:'+userId+':dateConversations';
    multi.zrange(userDateConversationsKey,0,-1);
  }//for
  var itemCmdCount = 23;
  multi.exec(function(err, multiRetData) {
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,innerError:err});
      return callback(err2);
    }
    var usersAllData = [];
    for(var i=0; i<multiRetData.length; i+=itemCmdCount){
      var userObj = multiRetData[i+0];

      var userPhotoIds = multiRetData[i+1];
      var userAuditPassedPhotoIds = multiRetData[i+2];
      var userDeletedPhotoIds = multiRetData[i+3];

      var userDateIds = multiRetData[i+4];
      var userDoubleConfirmDateIds = multiRetData[i+5];
      var userScheduleDateIds = multiRetData[i+6];
      var userInvitedDateIds = multiRetData[i+7];
      var userSendDateIds = multiRetData[i+8];
      var userReceiveDateIds = multiRetData[i+9];
      var userActiveDateIds = multiRetData[i+10];
      var userActiveSendDateIds = multiRetData[i+11];
      var userActiveReceiveDateIds = multiRetData[i+12];
      var userActiveRespondDateIds = multiRetData[i+13];
      var userActiveApplyingDateIds = multiRetData[i+14];

      var followingUserIds = multiRetData[i+15];
      var followerUserIds = multiRetData[i+16];
      var allPossibleFollowerUserIds = multiRetData[i+17];
      var followingFeedIds = multiRetData[i+18];

      var userCreditObj = multiRetData[i+19];
      var userCreditTransactionIds = multiRetData[i+20];

      var userReceiveDateIds = multiRetData[i+21];

      var userDateConversationTokens = multiRetData[i+22];

      var userAllData = {};
      userAllData.user = userObj;

      userAllData.userPhotoIds = userPhotoIds;
      if (userPhotoIds) userAllData.userPhotoIdsLen = userPhotoIds.length;
      userAllData.userAuditPassedPhotoIds = userAuditPassedPhotoIds;
      if (userAuditPassedPhotoIds) userAllData.userAuditPassedPhotoIdsLen = userAuditPassedPhotoIds.length;
      userAllData.userDeletedPhotoIds = userDeletedPhotoIds;
      if (userDeletedPhotoIds) userAllData.userDeletedPhotoIdsLen = userDeletedPhotoIds.length;

      userAllData.userDateIds = userDateIds;
      if (userDateIds) userAllData.userDateIdsLen = userDateIds.length;
      userAllData.userDoubleConfirmDateIds = userDoubleConfirmDateIds;
      if (userDoubleConfirmDateIds) userAllData.userDoubleConfirmDateIdsLen = userDoubleConfirmDateIds.length;
      userAllData.userScheduleDateIds = userScheduleDateIds;
      if (userScheduleDateIds) userAllData.userScheduleDateIdsLen = userScheduleDateIds.length;
      userAllData.userInvitedDateIds = userInvitedDateIds;
      if (userInvitedDateIds) userAllData.userInvitedDateIdsLen = userInvitedDateIds.length;
      userAllData.userSendDateIds = userSendDateIds;
      if (userSendDateIds) userAllData.userSendDateIdsLen = userSendDateIds.length;
      userAllData.userReceiveDateIds = userReceiveDateIds;
      if (userReceiveDateIds) userAllData.userReceiveDateIdsLen = userReceiveDateIds.length;
      userAllData.userActiveDateIds = userActiveDateIds;
      if (userActiveDateIds) userAllData.userActiveDateIdsLen = userActiveDateIds.length;
      userAllData.userActiveSendDateIds = userActiveSendDateIds;
      if (userActiveSendDateIds) userAllData.userActiveSendDateIdsLen = userActiveSendDateIds.length;
      userAllData.userActiveReceiveDateIds = userActiveReceiveDateIds;
      if (userActiveReceiveDateIds) userAllData.userActiveReceiveDateIdsLen = userActiveReceiveDateIds.length;
      userAllData.userActiveRespondDateIds = userActiveRespondDateIds;
      if (userActiveRespondDateIds) userAllData.userActiveRespondDateIdsLen = userActiveRespondDateIds.length;
      userAllData.userActiveApplyingDateIds = userActiveApplyingDateIds;
      if (userActiveApplyingDateIds) userAllData.userActiveApplyingDateIdsLen = userActiveApplyingDateIds.length;

      userAllData.followingUserIds = followingUserIds;
      if (followingUserIds) userAllData.followingUserIdsLen = followingUserIds.length;
      userAllData.followerUserIds = followerUserIds;
      if (followerUserIds) userAllData.followerUserIdsLen = followerUserIds.length;
      userAllData.allPossibleFollowerUserIds = allPossibleFollowerUserIds;
      if (allPossibleFollowerUserIds) userAllData.allPossibleFollowerUserIdsLen = allPossibleFollowerUserIds.length;
      userAllData.followingFeedIds = followingFeedIds;
      if (followingFeedIds) userAllData.followingFeedIdsLen = followingFeedIds.length;

      userAllData.userCredit = userCreditObj;
      userAllData.userCreditTransactionIds = userCreditTransactionIds;
      if (userCreditTransactionIds) userAllData.userCreditTransactionIdsLen = userCreditTransactionIds.length;

      userAllData.userReceiveDateIds = userReceiveDateIds;
      if (userReceiveDateIds) userAllData.userReceiveDateIdsLen = userReceiveDateIds.length;

      userAllData.userDateConversationTokens = userDateConversationTokens;
      if (userDateConversationTokens) userAllData.userDateConversationTokensLen = userDateConversationTokens.length;

      usersAllData.push(userAllData);
    }//for
    return callback(null,usersAllData);
  });//multi.exec
};//getRawUsersLevel1


/**
*
* @param {Object} params - contains usersAllData
*   each item of usersAllData contains those possible fields:
*   user, userPhotoIds, userPhotoIdsLen, userAuditPassedPhotoIds, userAuditPassedPhotoIdsLen, userDeletedPhotoIds, userDeletedPhotoIdsLen,
*   userDateIds, userDateIdsLen, userSendDateIds, userSendDateIdsLen, userActiveDateIds, userActiveDateIdsLen,
*   followingUserIds, followingUserIdsLen, followerUserIds, followerUserIdsLen, allPossibleFollowerUserIds, allPossibleFollowerUserIdsLen, followingFeedIds, followingFeedIdsLen,
*   userCredit, userCreditTransactionIds, userCreditTransactionIdsLen
* @param {Function} callback - is function(err,usersAllData)
*   each item of usersAllData will be added those possible fields:
*     userPhotos, userAuditPassedPhotos, userDeletedPhotos, userDates, userSendDates, userActiveDates, userDateObjs,
*     followingUsers, followerUsers, allPossibleFollowerUsers, followingFeeds, userCreditTransactions
*
*/
Redis.prototype.getRawUsersLevel2 = function(params, callback) {
  var messagePrefix = 'in Redis.getRawUsersLevel2, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  var usersAllData = params.usersAllData;
  if (!usersAllData || usersAllData.length == 0)
    return callback(null, null);
  var allPhotoIds = [];
  var allDateIds = [];
  var allFollowSomeUserIds = [];
  var allFeedIds = [];
  var allCreditTransactionIds = [];
  for(var i=0; i<usersAllData.length; i++){
    var userAllData = usersAllData[i];
    var userPhotoIds = userAllData.userPhotoIds;
    //var userAuditPassedPhotoIds = userAllData.userAuditPassedPhotoIds;
    var userDeletedPhotoIds = userAllData.userDeletedPhotoIds;
    var userAllPhotoIds = [];
    userAllPhotoIds = handy.concatArray({ary1:userAllPhotoIds,ary2:userPhotoIds});
    //userAllPhotoIds = handy.concatArray({ary1:userAllPhotoIds,ary2:userAuditPassedPhotoIds});
    userAllPhotoIds = handy.concatArray({ary1:userAllPhotoIds,ary2:userDeletedPhotoIds});
    allPhotoIds = handy.concatArray({ary1:allPhotoIds,ary2:userAllPhotoIds});

    var userDateIds = userAllData.userDateIds;
    //var userSendDateIds = userAllData.userSendDateIds;
    var userActiveDateIds = userAllData.userActiveDateIds;
    var userAllDateIds = [];
    userAllDateIds = handy.concatArray({ary1:userAllDateIds,ary2:userDateIds});
    //userAllDateIds = handy.concatArray({ary1:userAllDateIds,ary2:userSendDateIds});
    userAllDateIds = handy.concatArray({ary1:userAllDateIds,ary2:userActiveDateIds});
    allDateIds = handy.concatArray({ary1:allDateIds,ary2:userAllDateIds});

    var followingUserIds = userAllData.followingUserIds;
    var followerUserIds = userAllData.followerUserIds;
    //var allPossibleFollowerUserIds = userAllData.allPossibleFollowerUserIds;
    var userAllFollowSomeUserIds = [];
    userAllFollowSomeUserIds = handy.concatArray({ary1:followingUserIds,ary2:followerUserIds});
    //userAllFollowSomeUserIds = handy.concatArray({ary1:userAllFollowSomeUserIds,ary2:allPossibleFollowerUserIds});
    allFollowSomeUserIds = handy.concatArray({ary1:allFollowSomeUserIds,ary2:userAllFollowSomeUserIds});

    var followingFeedIds = userAllData.followingFeedIds;
    allFeedIds = handy.concatArray({ary1:allFeedIds,ary2:followingFeedIds});
    var userCreditTransactionIds = userAllData.userCreditTransactionIds;
    allCreditTransactionIds = handy.concatArray({ary1:allCreditTransactionIds,ary2:userCreditTransactionIds});
  }//for i

  function getAllPhotos(cbFun){
    if (!allPhotoIds || allPhotoIds.length==0){
      return cbFun(null);
    }
    self.getRawPhotosLevel1({photoIds:allPhotoIds}, function(err,photosAllData){
      if (err) return cbFun(err);
      var itemIdx = 0;
      for(var i=0; i<usersAllData.length; i++){
        var userAllData = usersAllData[i];
        var userPhotoIds = userAllData.userPhotoIds;
        //var userAuditPassedPhotoIds = userAllData.userAuditPassedPhotoIds;
        var userDeletedPhotoIds = userAllData.userDeletedPhotoIds;
        if (userPhotoIds && userPhotoIds.length>0){
          var userPhotos = photosAllData.slice(itemIdx,itemIdx+userPhotoIds.length);
          itemIdx += userPhotoIds.length;
          userAllData.userPhotos = userPhotos;
        }
//        if (userAuditPassedPhotoIds && userAuditPassedPhotoIds.length>0){
//          var userAuditPassedPhotos = photosAllData.slice(itemIdx,itemIdx+userAuditPassedPhotoIds.length);
//          itemIdx += userAuditPassedPhotoIds.length;
//          userAllData.userAuditPassedPhotos = userAuditPassedPhotos;
//        }
        if (userDeletedPhotoIds && userDeletedPhotoIds.length>0){
          var userDeletedPhotos = photosAllData.slice(itemIdx,itemIdx+userDeletedPhotoIds.length);
          itemIdx += userDeletedPhotoIds.length;
          userAllData.userDeletedPhotos = userDeletedPhotos;
        }
      }//for i
      return cbFun(null);
    });//getRawPhotosLevelAll
  };//getAllPhotos

  function getAllDates(cbFun){
    if (!allDateIds || allDateIds.length==0){
      return cbFun(null);
    }
    self.getRawDatesLevel1({dateIds:allDateIds}, function(err,datesAllData){
      if (err) return cbFun(err);
      var itemIdx = 0;
      for(var i=0; i<usersAllData.length; i++){
        var userAllData = usersAllData[i];
        var userDateIds = userAllData.userDateIds;
        //var userSendDateIds = userAllData.userSendDateIds;
        var userActiveDateIds = userAllData.userActiveDateIds;
        if (userDateIds && userDateIds.length>0){
          var userDates = datesAllData.slice(itemIdx,itemIdx+userDateIds.length);
          itemIdx += userDateIds.length;
          userAllData.userDates = userDates;
        }
//        if (userSendDateIds && userSendDateIds.length>0){
//          var userSendDates = datesAllData.slice(itemIdx,itemIdx+userSendDateIds.length);
//          itemIdx += userSendDateIds.length;
//          userAllData.userSendDates = userSendDates;
//        }
        if (userActiveDateIds && userActiveDateIds.length>0){
          var userActiveDates = datesAllData.slice(itemIdx,itemIdx+userActiveDateIds.length);
          itemIdx += userActiveDateIds.length;
          userAllData.userActiveDates = userActiveDates;
        }
      }//for i

      var multi = self.client.multi();
      var multiCmdCnt = 0;
      for(var i=0; i<usersAllData.length; i++){
        var userAllData = usersAllData[i];
        var userObj = userAllData.user;

        var userDateIds = userAllData.userDateIds;
        if (userObj && userObj.userId && userDateIds && userDateIds.length>0){
          var userId = userObj.userId;
          for(var i2=0; i2<userDateIds.length; i2++){
            var dateId = userDateIds[i2];
            var userDateKey = "user:"+userId+":date:"+dateId;
            multi.hgetall(userDateKey);
            multiCmdCnt++;
          }//for i2
        }
      }//for i
      if (multiCmdCnt == 0)
        return cbFun(null);
      multi.exec(function(err, multiRetData) {
        if (err){
          var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,innerError:err});
          return callback(err2);
        }
        var multiRetItemIdx = 0;
        //same for loop and if struct used here to get right position
        for(var i=0; i<usersAllData.length; i++){
          var userAllData = usersAllData[i];
          var userObj = userAllData.user;
          var userDateIds = userAllData.userDateIds;
          if (userObj && userObj.userId && userDateIds && userDateIds.length>0){
            var userId = userObj.userId;
            var userDateObjs = {};
            for(var i2=0; i2<userDateIds.length; i2++){
              var dateId = userDateIds[i2];
              var userDateKey = "user:"+userId+":date:"+dateId;
              var userDateObj = multiRetData[multiRetItemIdx];
              multiRetItemIdx++;
              userDateObjs[userDateKey] = userDateObj;
            }//for i2
            userAllData.userDateObjs = userDateObjs;
          }
        }//for i
        return cbFun(null);
      });//multi.exec
    });//getRawDatesLevelAll
  };//getAllDates


  function getAllFollowSomeUsers(cbFun){
    if (!allFollowSomeUserIds || allFollowSomeUserIds.length==0){
      return cbFun(null);
    }
    self.getRawUsersLevel1({userIds:allFollowSomeUserIds}, function(err,usersAllData){
      if (err) return cbFun(err);
      var itemIdx = 0;
      for(var i=0; i<usersAllData.length; i++){
        var userAllData = usersAllData[i];
        var followingUserIds = userAllData.followingUserIds;
        var followerUserIds = userAllData.followerUserIds;
        //var allPossibleFollowerUserIds = userAllData.allPossibleFollowerUserIds;
        if (followingUserIds && followingUserIds.length>0){
          var followingUsers = usersAllData.slice(itemIdx,itemIdx+followingUserIds.length);
          itemIdx += followingUserIds.length;
          userAllData.followingUsers = followingUsers;
        }
        if (followerUserIds && followerUserIds.length>0){
          var followerUsers = usersAllData.slice(itemIdx,itemIdx+followerUserIds.length);
          itemIdx += followerUserIds.length;
          userAllData.followerUsers = followerUsers;
        }
//        if (allPossibleFollowerUserIds && allPossibleFollowerUserIds.length>0){
//          var allPossibleFollowerUsers = usersAllData.slice(itemIdx,itemIdx+allPossibleFollowerUserIds.length);
//          itemIdx += allPossibleFollowerUserIds.length;
//          userAllData.allPossibleFollowerUsers = allPossibleFollowerUsers;
//        }
      }//for i
      return cbFun(null);
    });//getRawFollowSomeUsersLevelAll
  };//getAllFollowSomeUsers

  function getAllFeeds(cbFun){
    if (!allFeedIds || allFeedIds.length==0){
      return cbFun(null);
    }
    self.getRawFeedsLevelAll({feedIds:allFeedIds}, function(err,feedsAllData){
      if (err) return cbFun(err);
      var itemIdx = 0;
      for(var i=0; i<usersAllData.length; i++){
        var userAllData = usersAllData[i];
        var followingFeedIds = userAllData.followingFeedIds;
        if (followingFeedIds && followingFeedIds.length>0){
          var followingFeeds = feedsAllData.slice(itemIdx,itemIdx+followingFeedIds.length);
          itemIdx += followingFeedIds.length;
          userAllData.followingFeeds = followingFeeds;
        }
      }//for i
      return cbFun(null);
    });//getRawFeedsLevelAll
  };//getAllFeeds

  function getAllCreditTransactions(cbFun){
    if (!allCreditTransactionIds || allCreditTransactionIds.length==0){
      return cbFun(null);
    }
    self.getRawCreditTransactionsLevelAll({creditTransactionIds:allCreditTransactionIds}, function(err,creditTransactionsAllData){
      if (err) return cbFun(err);
      var itemIdx = 0;
      for(var i=0; i<usersAllData.length; i++){
        var userAllData = usersAllData[i];
        var userCreditTransactionIds = userAllData.userCreditTransactionIds;
        if (userCreditTransactionIds && userCreditTransactionIds.length>0){
          var userCreditTransactions = creditTransactionsAllData.slice(itemIdx,itemIdx+userCreditTransactionIds.length);
          itemIdx += userCreditTransactionIds.length;
          userAllData.userCreditTransactions = userCreditTransactions;
        }
      }//for i
      return cbFun(null);
    });//getRawCreditTransactionsLevelAll
  };//getAllCreditTransactions

  getAllPhotos(function(err){
    if (err) return callback(err);
    getAllDates(function(err){
      if (err) return callback(err);
      getAllFollowSomeUsers(function(err){
        if (err) return callback(err);
        getAllFeeds(function(err){
          if (err) return callback(err);
          getAllCreditTransactions(function(err){
            if (err) return callback(err);

            return callback(null,usersAllData);
          });//getAllCreditTransactions
        });//getAllFeeds
      });//getAllFollowSomeUsers
    });//getAllDates
  });//getAllPhotos
};//getRawUsersLevel2


/**
*
* @param {Object} params - contains photoIds
* @param {Function} callback - is function(err,photosAllData)
*   each item of photosAllData contains those possible fields:
*     photo, likePhotoUserIds, user, feed
*/
Redis.prototype.getRawPhotosLevelAll = function(params, callback) {
  var messagePrefix = 'in Redis.getRawPhotosLevelAll, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  var photoIds = params.photoIds;
  if (!photoIds || photoIds.length == 0)
    return callback(null, null);

  self.getRawPhotosLevel1({photoIds:photoIds}, function(err,photosAllData){
    if (err) return callback(err);
    self.getRawPhotosLevel2({photosAllData:photosAllData}, function(err,photosAllData){
      if (err) return callback(err);
      return callback(null,photosAllData);
    });//getRawPhotosLevel2
  });//getRawPhotosLevel1
};//getRawPhotosLevelAll


/**
*
* @param {Object} params - contains photoIds
* @param {Function} callback - is function(err,photosAllData)
*/
Redis.prototype.getRawPhotosLevel1 = function(params, callback) {
  var messagePrefix = 'in Redis.getRawPhotosLevel1, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  var photoIds = params.photoIds;
  if (!photoIds || photoIds.length == 0)
    return callback(null, null);
  var multi = self.client.multi();
  for (idx in photoIds) {
    var photoId = photoIds[idx];
    var photoKey = 'photo:'+photoId;
    multi.hgetall(photoKey);

    var likeKey = "like:photo:"+photoId;
    multi.smembers(likeKey);
  }//for
  var itemCmdCount = 2;
  multi.exec(function(err, multiRetData) {
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,innerError:err});
      return callback(err2);
    }
    var photosAllData = [];
    for(var i=0; i<multiRetData.length; i+=itemCmdCount){
      var photoObj = multiRetData[i+0];
      var likePhotoUserIds = multiRetData[i+1];
      var photoAllData = {};
      photoAllData.photo = photoObj;
      photoAllData.likePhotoUserIds = likePhotoUserIds;
      photosAllData.push(photoAllData);
    }//for
    return callback(null,photosAllData);
  });//multi.exec
};//getRawPhotosLevel1


/**
*
* @param {Object} params - contains photosAllData
*   each item of photosAllData contains those fields: photo, likePhotoUserIds
* @param {Function} callback - is function(err,photosAllData)
*   each item of photosAllData will be added those fields: user, feed
*/
Redis.prototype.getRawPhotosLevel2 = function(params, callback) {
  var messagePrefix = 'in Redis.getRawPhotosLevel2, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  var photosAllData = params.photosAllData;
  if (!photosAllData || photosAllData.length == 0)
    return callback(null, null);
  var multi = self.client.multi();
  var multiCmdCnt = 0;
  for (var i=0; i<photosAllData.length; i++) {
    var photoAllData = photosAllData[i];
    var photoObj = photoAllData.photo;
    if (photoObj && photoObj.photoId){
      var userId = photoObj.userId;
      var feedId = photoObj.feedId;
      var userKey = 'user:'+userId;
      multi.hgetall(userKey);
      multiCmdCnt++;
      var feedKey = 'feed:'+feedId;
      multi.hgetall(feedKey);
      multiCmdCnt++;
    }//if (photoObj && photoObj.photoId)
  }//for
  if (multiCmdCnt==0){
    return callback(null, photosAllData);
  }

  multi.exec(function(err, multiRetData) {
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,innerError:err});
      return callback(err2);
    }
    var multiRetItemIdx = 0;
    //same for loop and if struct used here to get right position
    for (var i=0; i<photosAllData.length; i++) {
      var photoAllData = photosAllData[i];
      var photoObj = photoAllData.photo;
      if (photoObj && photoObj.photoId){
        var user = multiRetData[multiRetItemIdx];
        multiRetItemIdx++;
        photoAllData.user = user;
        var feed = multiRetData[multiRetItemIdx];
        multiRetItemIdx++;
        photoAllData.feed = feed;
      }//if (photoObj && photoObj.photoId)
    }//for
    return callback(null,photosAllData);
  });//multi.exec
};//getRawPhotosLevel2

/**
*
* @param {Object} params - contains feedIds
* @param {Function} callback - is function(err,feedsAllData)
*   each item of feedsAllData contains those possible fields:
*     feed, user, photos
*/
Redis.prototype.getRawFeedsLevelAll = function(params, callback) {
  var messagePrefix = 'in Redis.getRawFeedsLevelAll, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  var feedIds = params.feedIds;
  if (!feedIds || feedIds.length == 0)
    return callback(null, null);

  self.getRawFeedsLevel1({feedIds:feedIds}, function(err,feedsAllData){
    if (err) return callback(err);
    self.getRawFeedsLevel2({feedsAllData:feedsAllData}, function(err,feedsAllData){
      if (err) return callback(err);
      return callback(null,feedsAllData);
    });//getRawFeedsLevel2
  });//getRawFeedsLevel1
};//getRawFeedsLevelAll


/**
*
* @param {Object} params - contains feedIds
* @param {Function} callback - is function(err,feedsAllData)
*   each item of feedsAllData contains those fields: feed.
*     feed contains photoIds.
*/
Redis.prototype.getRawFeedsLevel1 = function(params, callback) {
  var messagePrefix = 'in Redis.getRawFeedsLevel1, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  var feedIds = params.feedIds;
  if (!feedIds || feedIds.length == 0)
    return callback(null, null);
  var multi = self.client.multi();
  for (idx in feedIds) {
    var feedId = feedIds[idx];
    var feedKey = 'feed:'+feedId;
    multi.hgetall(feedKey);
  }//for
  var itemCmdCount = 1;
  multi.exec(function(err, multiRetData) {
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,innerError:err});
      return callback(err2);
    }
    var feedsAllData = [];
    for(var i=0; i<multiRetData.length; i+=itemCmdCount){
      var feedObj = multiRetData[i+0];
      var strPhotoIds = feedObj.photoIds;
      if (strPhotoIds)
        feedObj.photoIds = strPhotoIds.split(',');

      var feedAllData = {};
      feedAllData.feed = feedObj;
      feedsAllData.push(feedAllData);
    }//for
    return callback(null,feedsAllData);
  });//multi.exec
};//getRawFeedsLevel1


/**
*
* @param {Object} params - contains feedsAllData
*   each item of feedsAllData contains those fields: feed.
*     feed contains photoIds.
* @param {Function} callback - is function(err,feedsAllData)
*   each item of feedsAllData will be added those fields: user, photos
*/
Redis.prototype.getRawFeedsLevel2 = function(params, callback) {
  var messagePrefix = 'in Redis.getRawFeedsLevel2, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  var feedsAllData = params.feedsAllData;
  if (!feedsAllData || feedsAllData.length == 0)
    return callback(null, null);
  var multi = self.client.multi();
  var multiCmdCnt = 0;
  for (var i=0; i<feedsAllData.length; i++) {
    var feedAllData = feedsAllData[i];
    var feedObj = feedAllData.feed;
    if (feedObj && feedObj.feedId){
      var userId = feedObj.userId;
      var photoIds = feedObj.photoIds;
      var userKey = 'user:'+userId;
      multi.hgetall(userKey);
      multiCmdCnt++;
      if (photoIds && photoIds.length>0){
        for(var i2=0; i2<photoIds.length; i2++){
          var photoId = photoIds[i2];
          var photoKey = 'photo:'+photoId;
          multi.hgetall(photoKey);
          multiCmdCnt++;
        }//for i2
      }//if (photoIds && photoIds.length>0)
    }//if (feedObj && feedObj.feedId)
  }//for
  if (multiCmdCnt==0){
    return callback(null, feedsAllData);
  }

  multi.exec(function(err, multiRetData) {
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,innerError:err});
      return callback(err2);
    }
    var multiRetItemIdx = 0;
    //same for loop and if struct used here to get right position
    for (var i=0; i<feedsAllData.length; i++) {
      var feedAllData = feedsAllData[i];
      var feedObj = feedAllData.feed;
      if (feedObj && feedObj.feedId){
        var userId = feedObj.userId;
        var photoIds = feedObj.photoIds;
        var user = multiRetData[multiRetItemIdx];
        multiRetItemIdx++;
        feedAllData.user = user;
        if (photoIds && photoIds.length>0){
          var photos = [];
          for(var i2=0; i2<photoIds.length; i2++){
            var photo = multiRetData[multiRetItemIdx];
            multiRetItemIdx++;
            photos.push(photo);
          }//for i2
          feedAllData.photos = photos;
        }//if (photoIds && photoIds.length>0)
      }//if (feedObj && feedObj.feedId)
    }//for
    return callback(null,feedsAllData);
  });//multi.exec
};//getRawFeedsLevel2


/**
*
* @param {Object} params - contains dateIds
* @param {Function} callback - is function(err,datesAllData)
*   each item of datesAllData contains those possible fields:
*     date, dateReceiverIds, dateResponderIds, "user:"+senderId, "date:"+dateId+":responder:"+dateResponderId,
*     "chat:date:"+dateId+":user:"+senderId+":targetUser:"+dateResponderId, "chat:date:"+dateId+":user:"+senderId+":targetUser:"+dateResponderId+"-Len",
*     "chat:date:"+dateId+":user:"+dateResponderId+":targetUser:"+senderId, "chat:date:"+dateId+":user:"+dateResponderId+":targetUser:"+senderId+"-Len",
*     "chat:date:"+dateId+":user:"+senderId+":targetUser:"+dateResponderId+"-Messages", "chat:date:"+dateId+":user:"+dateResponderId+":targetUser:"+senderId+"-Messages"
*/
Redis.prototype.getRawDatesLevelAll = function(params, callback) {
  var messagePrefix = 'in Redis.getRawDatesLevelAll, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  var dateIds = params.dateIds;
  if (!dateIds || dateIds.length == 0)
    return callback(null, null);

  self.getRawDatesLevel1({dateIds:dateIds}, function(err,datesAllData){
    if (err) return callback(err);
    self.getRawDatesLevel2({datesAllData:datesAllData}, function(err,datesAllData){
      if (err) return callback(err);
      self.getRawDatesLevel3({datesAllData:datesAllData}, function(err,datesAllData){
        if (err) return callback(err);
        return callback(null,datesAllData);
      });//getRawDatesLevel3
    });//getRawDatesLevel2
  });//getRawDatesLevel1
};//getRawDatesLevelAll


/**
*
* @param {Object} params - contains dateIds
* @param {Function} callback - is function(err,datesAllData)
*   each item of datesAllData contains date, dateReceiverIds, dateResponderIds
*/
Redis.prototype.getRawDatesLevel1 = function(params, callback) {
  var messagePrefix = 'in Redis.getRawDatesLevel1, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  var dateIds = params.dateIds;
  if (!dateIds || dateIds.length == 0)
    return callback(null, null);

  var multi = self.client.multi();
  for (idx in dateIds) {
    var dateId = dateIds[idx];
    var dateKey = 'date:'+dateId;
    multi.hgetall(dateKey);

    var dateReceiversKey = 'date:'+dateId+':receivers';
    var dateRespondersKey = 'date:'+dateId+':responders';
    var dateActiveRespondersKey = 'date:'+dateId+':activeResponders';
    multi.smembers(dateReceiversKey);
    multi.smembers(dateRespondersKey);
    multi.zrevrange(dateActiveRespondersKey,0,-1);
  }//for
  var itemCmdCount = 4;
  multi.exec(function(err, multiRetData) {
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,innerError:err});
      return callback(err2);
    }
    var datesAllData = [];
    for(var i=0; i<multiRetData.length; i+=itemCmdCount){
      var dateObj = multiRetData[i+0];

      var dateReceiverIds = multiRetData[i+1];
      var dateResponderIds = multiRetData[i+2];
      var dateActiveResponderIds = multiRetData[i+3];

      var dateAllData = {};
      dateAllData.date = dateObj;

      dateAllData.dateReceiverIds = dateReceiverIds;
      if (dateReceiverIds) dateAllData.dateReceiverIdsLen = dateReceiverIds.length;
      dateAllData.dateResponderIds = dateResponderIds;
      if (dateResponderIds) dateAllData.dateResponderIdsLen = dateResponderIds.length;
      dateAllData.dateActiveResponderIds = dateActiveResponderIds;
      if (dateActiveResponderIds) dateAllData.dateActiveResponderIdsLen = dateActiveResponderIds.length;

      datesAllData.push(dateAllData);
    }//for
    return callback(null,datesAllData);
  });//multi.exec
};//getRawDatesLevel1



/**
*
* @param {Object} params - contains datesAllData
*   each item of datesAllData contains date, dateReceiverIds, dateResponderIds
* @param {Function} callback - is function(err,datesAllData)
*   each item of datesAllData will be added those possible fields:
*     "user:"+senderId, "date:"+dateId+":responder:"+dateResponderId,
*     "chat:date:"+dateId+":user:"+senderId+":targetUser:"+dateResponderId, "chat:date:"+dateId+":user:"+senderId+":targetUser:"+dateResponderId+"-Len",
*     "chat:date:"+dateId+":user:"+dateResponderId+":targetUser:"+senderId, "chat:date:"+dateId+":user:"+dateResponderId+":targetUser:"+senderId+"-Len"
*
*/
Redis.prototype.getRawDatesLevel2 = function(params, callback) {
  var messagePrefix = 'in Redis.getRawDatesLevel2, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  var datesAllData = params.datesAllData;
  if (!datesAllData || datesAllData.length == 0)
    return callback(null, datesAllData);

  var multi = self.client.multi();
  var multiCmdCnt = 0;
  for (var i=0; i<datesAllData.length; i++) {
    var dateAllData = datesAllData[i];
    var dateObj = dateAllData.date;
    var dateResponderIds = dateAllData.dateResponderIds;
    var dateId = null;
    var senderId = null;
    if (dateObj && dateObj.dateId){
      dateId = dateObj.dateId;
      senderId = dateObj.senderId;
      var senderUserKey = "user:"+senderId;
      multi.hgetall(senderUserKey);
      multiCmdCnt++;
      if (dateObj.finalCandidateId){
        var finalCandidateUserKey = "user:"+dateObj.finalCandidateId;
        multi.hgetall(finalCandidateUserKey);
        multiCmdCnt++;
      }
      if (dateResponderIds && dateResponderIds.length>0){
        for(var i2=0; i2<dateResponderIds.length; i2++){
          var dateResponderId = dateResponderIds[i2];
          var dateResponderKey = "date:"+dateId+":responder:"+dateResponderId;
          multi.hgetall(dateResponderKey);
          multiCmdCnt++;
          var senderDateMessagesKey = "chat:date:"+dateId+":user:"+senderId+":targetUser:"+dateResponderId;
          var responderDateMessagesKey = "chat:date:"+dateId+":user:"+dateResponderId+":targetUser:"+senderId;
          multi.zrange(senderDateMessagesKey,0,-1);
          multiCmdCnt++;
          multi.zrange(responderDateMessagesKey,0,-1);
          multiCmdCnt++;
        }//for
      }//if (dateResponderIds && dateResponderIds.length>0)
    }//if (dateObj && dateObj.dateId)
  }//for
  if (multiCmdCnt==0){
    return callback(null, datesAllData);
  }
  multi.exec(function(err, multiRetData) {
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,innerError:err});
      return callback(err2);
    }
    var multiRetItemIdx = 0;
    //same for loop and if struct used here to get right position
    for (var i=0; i<datesAllData.length; i++) {
      var dateAllData = datesAllData[i];
      var dateObj = dateAllData.date;
      var dateResponderIds = dateAllData.dateResponderIds;
      var dateId = null;
      var senderId = null;
      if (dateObj && dateObj.dateId){
        dateId = dateObj.dateId;
        senderId = dateObj.senderId;
        var senderUserKey = "user:"+senderId;
        var sender = multiRetData[multiRetItemIdx];
        multiRetItemIdx++;
        dateAllData['sender'] = sender;
        if (dateObj.finalCandidateId){
          var finalCandidateUserKey = "user:"+dateObj.finalCandidateId;
          var finalCandidateUser = multiRetData[multiRetItemIdx];
          multiRetItemIdx++;
          dateAllData['finalCandidate'] = finalCandidateUser;
        }
        if (dateResponderIds && dateResponderIds.length>0){
          dateAllData.dateResponderIdsLen = dateResponderIds.length;
          for(var i2=0; i2<dateResponderIds.length; i2++){
            var dateResponderId = dateResponderIds[i2];
            var dateResponderKey = "date:"+dateId+":responder:"+dateResponderId;
            var dateResponder = multiRetData[multiRetItemIdx];
            multiRetItemIdx++;
            dateAllData[dateResponderKey] = dateResponder;

            var senderDateMessagesKey = "chat:date:"+dateId+":user:"+senderId+":targetUser:"+dateResponderId;
            var responderDateMessagesKey = "chat:date:"+dateId+":user:"+dateResponderId+":targetUser:"+senderId;
            var senderDateMessageIds = multiRetData[multiRetItemIdx];
            multiRetItemIdx++;
            var responderDateMessageIds = multiRetData[multiRetItemIdx];
            multiRetItemIdx++;
            dateAllData[senderDateMessagesKey] = senderDateMessageIds;
            if(senderDateMessageIds) dateAllData[senderDateMessagesKey+"-Len"] = senderDateMessageIds.length;
            dateAllData[responderDateMessagesKey] = responderDateMessageIds;
            if(responderDateMessageIds) dateAllData[responderDateMessagesKey+"-Len"] = responderDateMessageIds.length;
          }//for
        }//if (dateResponderIds && dateResponderIds.length>0)
      }//if (dateObj && dateObj.dateId)
    }//for
    return callback(null,datesAllData);
  });//multi.exec
};//getRawDatesLevel2





/**
*
* @param {Object} params - contains datesAllData
*   each item of datesAllData contains those possible fields:
*     date, dateReceiverIds, dateResponderIds, "user:"+senderId, "date:"+dateId+":responder:"+dateResponderId,
*     "chat:date:"+dateId+":user:"+senderId+":targetUser:"+dateResponderId, "chat:date:"+dateId+":user:"+senderId+":targetUser:"+dateResponderId+"-Len",
*     "chat:date:"+dateId+":user:"+dateResponderId+":targetUser:"+senderId, "chat:date:"+dateId+":user:"+dateResponderId+":targetUser:"+senderId+"-Len"
* @param {Function} callback - is function(err,datesAllData)
*   each item of datesAllData will be added those possible fields:
*     "chat:date:"+dateId+":user:"+senderId+":targetUser:"+dateResponderId+"-Messages", "chat:date:"+dateId+":user:"+dateResponderId+":targetUser:"+senderId+"-Messages"
*
*
*/
Redis.prototype.getRawDatesLevel3 = function(params, callback) {
  var messagePrefix = 'in Redis.getRawDatesLevel3, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  var datesAllData = params.datesAllData;
  if (!datesAllData || datesAllData.length == 0)
    return callback(null, datesAllData);

  var multi = self.client.multi();
  var multiCmdCnt = 0;
  for (var i=0; i<datesAllData.length; i++) {
    var dateAllData = datesAllData[i];
    var dateObj = dateAllData.date;
    var dateResponderIds = dateAllData.dateResponderIds;
    var dateId = null;
    var senderId = null;
    if (dateObj && dateObj.dateId){
      dateId = dateObj.dateId;
      senderId = dateObj.senderId;

      if (dateResponderIds && dateResponderIds.length>0){
        for(var i2=0; i2<dateResponderIds.length; i2++){
          var dateResponderId = dateResponderIds[i2];
          var senderDateMessagesKey = "chat:date:"+dateId+":user:"+senderId+":targetUser:"+dateResponderId;
          var responderDateMessagesKey = "chat:date:"+dateId+":user:"+dateResponderId+":targetUser:"+senderId;
          var senderDateMessageIds = dateAllData[senderDateMessagesKey];
          var responderDateMessageIds = dateAllData[responderDateMessagesKey];
          if (senderDateMessageIds && senderDateMessageIds.length>0){
            for(var i3=0; i3<senderDateMessageIds.length; i3++){
              var messageId = senderDateMessageIds[i3];
              var messageKey = "message:"+messageId;
              multi.hgetall(messageKey);
              multiCmdCnt++;
            }//for i3
          }
          if (responderDateMessageIds && responderDateMessageIds.length>0){
            for(var i3=0; i3<responderDateMessageIds.length; i3++){
              var messageId = responderDateMessageIds[i3];
              var messageKey = "message:"+messageId;
              multi.hgetall(messageKey);
              multiCmdCnt++;
            }//for i3
          }
        }//for i2
      }//if (dateResponderIds && dateResponderIds.length>0)
    }//if (dateObj && dateObj.dateId)
  }//for
  if (multiCmdCnt==0){
    return callback(null, datesAllData);
  }
  multi.exec(function(err, multiRetData) {
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,innerError:err});
      return callback(err2);
    }
    var multiRetItemIdx = 0;
    //same for loop and if struct used here to get right position

    for (var i=0; i<datesAllData.length; i++) {
      var dateAllData = datesAllData[i];
      var dateObj = dateAllData.date;
      var dateResponderIds = dateAllData.dateResponderIds;
      var dateId = null;
      var senderId = null;
      if (dateObj && dateObj.dateId){
        dateId = dateObj.dateId;
        senderId = dateObj.senderId;

        if (dateResponderIds && dateResponderIds.length>0){
          for(var i2=0; i2<dateResponderIds.length; i2++){
            var dateResponderId = dateResponderIds[i2];
            var senderDateMessagesKey = "chat:date:"+dateId+":user:"+senderId+":targetUser:"+dateResponderId;
            var responderDateMessagesKey = "chat:date:"+dateId+":user:"+dateResponderId+":targetUser:"+senderId;
            var senderDateMessageIds = dateAllData[senderDateMessagesKey];
            var responderDateMessageIds = dateAllData[responderDateMessagesKey];
            if (senderDateMessageIds && senderDateMessageIds.length>0){
              var senderDateMessages = [];
              for(var i3=0; i3<senderDateMessageIds.length; i3++){
                var message = multiRetData[multiRetItemIdx];
                multiRetItemIdx++;
                senderDateMessages.push(message);
              }//for i3
              dateAllData[senderDateMessagesKey+"-Messages"] = senderDateMessages;
            }
            if (responderDateMessageIds && responderDateMessageIds.length>0){
              var responderDateMessages = [];
              for(var i3=0; i3<responderDateMessageIds.length; i3++){
                var message = multiRetData[multiRetItemIdx];
                multiRetItemIdx++;
                responderDateMessages.push(message);
              }//for i3
              dateAllData[responderDateMessagesKey+"-Messages"] = responderDateMessages;
            }
          }//for i2
        }//if (dateResponderIds && dateResponderIds.length>0)
      }//if (dateObj && dateObj.dateId)
    }//for
    return callback(null,datesAllData);
  });//multi.exec
};//getRawDatesLevel3

/**
*
* @param {Object} params - contains creditTransactionIds
* @param {Function} callback - is function(err,creditTransactionsAllData)
*   each item of creditTransactionsAllData contains those possible fields:
*     creditTransaction, photo, date
*/
Redis.prototype.getRawCreditTransactionsLevelAll = function(params, callback) {
  var messagePrefix = 'in Redis.getRawCreditTransactionsLevelAll, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  var creditTransactionIds = params.creditTransactionIds;
  if (!creditTransactionIds || creditTransactionIds.length == 0)
    return callback(null, null);

  self.getRawCreditTransactionsLevel1({creditTransactionIds:creditTransactionIds}, function(err,creditTransactionsAllData){
    if (err) return callback(err);
    self.getRawCreditTransactionsLevel2({creditTransactionsAllData:creditTransactionsAllData}, function(err,creditTransactionsAllData){
      if (err) return callback(err);
      return callback(null,creditTransactionsAllData);
    });//getRawCreditTransactionsLevel2
  });//getRawCreditTransactionsLevel1
};//getRawCreditTransactionsLevelAll

/**
*
* @param {Object} params - contains creditTransactionIds
* @param {Function} callback - is function(err,creditTransactionsAllData)
*   each item of creditTransactionsAllData contains those fields: creditTransaction
*/
Redis.prototype.getRawCreditTransactionsLevel1 = function(params, callback) {
  var messagePrefix = 'in Redis.getRawCreditTransactionsLevel1, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  var creditTransactionIds = params.creditTransactionIds;
  if (!creditTransactionIds || creditTransactionIds.length == 0)
    return callback(null, null);
  var multi = self.client.multi();
  for (var i=0; i<creditTransactionIds.length; i++) {
    var creditTransactionId = creditTransactionIds[i];
    var creditTransactionKey = 'creditTransaction:'+creditTransactionId;
    multi.hgetall(creditTransactionKey);
  }//for
  var itemCmdCount = 1;
  multi.exec(function(err, multiRetData) {
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,innerError:err});
      return callback(err2);
    }
    var creditTransactionsAllData = [];
    for(var i=0; i<multiRetData.length; i+=itemCmdCount){
      var creditTransactionObj = multiRetData[i+0];
      var creditTransactionAllData = {};
      creditTransactionAllData.creditTransaction = creditTransactionObj;
      creditTransactionsAllData.push(creditTransactionAllData);
    }//for
    return callback(null,creditTransactionsAllData);
  });//multi.exec
};//getRawCreditTransactionsLevel1


/**
*
* @param {Object} params - contains creditTransactionsAllData
*   each item of creditTransactionsAllData contains those fields: creditTransaction
* @param {Function} callback - is function(err,creditTransactionsAllData)
*   each item of creditTransactionsAllData will be added those fields: photo, date
*/
Redis.prototype.getRawCreditTransactionsLevel2 = function(params, callback) {
  var messagePrefix = 'in Redis.getRawCreditTransactionsLevel2, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  var creditTransactionsAllData = params.creditTransactionsAllData;
  if (!creditTransactionsAllData || creditTransactionsAllData.length == 0)
    return callback(null, null);
  var multi = self.client.multi();
  var multiCmdCnt = 0;
  for (var i=0; i<creditTransactionsAllData.length; i++) {
    var creditTransactionAllData = creditTransactionsAllData[i];
    var creditTransactionObj = creditTransactionAllData.creditTransaction;
    if (creditTransactionObj && creditTransactionObj.creditTransactionId){
      var photoId = creditTransactionObj.photoId;
      var dateId = creditTransactionObj.dateId;
      if (photoId){
        var photoKey = 'photo:'+photoId;
        multi.hgetall(photoKey);
        multiCmdCnt++;
      }
      if (dateId){
        var dateKey = 'date:'+dateId;
        multi.hgetall(dateKey);
        multiCmdCnt++;
      }
    }//if (creditTransactionObj && creditTransactionObj.creditTransactionId)
  }//for
  if (multiCmdCnt==0){
    return callback(null, creditTransactionsAllData);
  }

  multi.exec(function(err, multiRetData) {
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,innerError:err});
      return callback(err2);
    }
    var multiRetItemIdx = 0;
    //same for loop and if struct used here to get right position
    for (var i=0; i<creditTransactionsAllData.length; i++) {
      var creditTransactionAllData = creditTransactionsAllData[i];
      var creditTransactionObj = creditTransactionAllData.creditTransaction;
      if (creditTransactionObj && creditTransactionObj.creditTransactionId){
        var photoId = creditTransactionObj.photoId;
        var dateId = creditTransactionObj.dateId;
        if (photoId){
          var photo = multiRetData[multiRetItemIdx];
          multiRetItemIdx++;
          creditTransactionAllData.photo = photo;
        }
        if (dateId){
          var date = multiRetData[multiRetItemIdx];
          multiRetItemIdx++;
          creditTransactionAllData.date = date;
        }
      }//if (creditTransactionObj && creditTransactionObj.creditTransactionId)
    }//for
    return callback(null,creditTransactionsAllData);
  });//multi.exec
};//getRawCreditTransactionsLevel2




/**
*
* @param {Object} params - contains cityLocations
* @param {Function} callback - is function(err,regionsAllData)
*/
Redis.prototype.getRawRegionsLevel1 = function(params, callback) {
  var messagePrefix = 'in Redis.getRawRegionsLevel1, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  var cityLocations = params.cityLocations;
  if (!cityLocations || cityLocations.length == 0)
    return callback(null, null);
  var multi = self.client.multi();
  for (var i=0; i<cityLocations.length; i++) {
    var cityLocation = cityLocations[i];
    var maleRegionNormalUsersKey = "region:"+cityLocation+":normalUsers:male";
    multi.zrange(maleRegionNormalUsersKey,0,-1);
    var femaleRegionNormalUsersKey = "region:"+cityLocation+":normalUsers:female";
    multi.zrange(femaleRegionNormalUsersKey,0,-1);
    var regionCreatedPhotosKey = "region:"+cityLocation+":createdPhotos";
    multi.zrange(regionCreatedPhotosKey,0,-1);
    var regionAuditDeniedPhotosKey = "region:"+cityLocation+":auditDeniedPhotos";
    multi.zrange(regionAuditDeniedPhotosKey,0,-1);
    var maleRegionNewPhotosKey = "region:"+cityLocation+":newPhotos:male";
    multi.zrange(maleRegionNewPhotosKey,0,-1);
    var femaleRegionNewPhotosKey = "region:"+cityLocation+":newPhotos:female";
    multi.zrange(femaleRegionNewPhotosKey,0,-1);
    var maleRegionHotPhotosKey = "region:"+cityLocation+":hotPhotos:male";
    multi.zrange(maleRegionHotPhotosKey,0,-1,"WITHSCORES");
    var femaleRegionHotPhotosKey = "region:"+cityLocation+":hotPhotos:female";
    multi.zrange(femaleRegionHotPhotosKey,0,-1,"WITHSCORES");
  }//for
  var itemCmdCount = 8;
  multi.exec(function(err, multiRetData) {
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,innerError:err});
      return callback(err2);
    }
    var regionsAllData = [];
    var multiRetDataIdx = 0;
    for (var i=0; i<cityLocations.length; i++) {
      var cityLocation = cityLocations[i];
      multiRetDataIdx = i * itemCmdCount;
      var regionAllData = {};
      var maleRegionNormalUsersKey = "region:"+cityLocation+":normalUsers:male";
      var maleRegionNormalUserIds = multiRetData[multiRetDataIdx+0];
      regionAllData[maleRegionNormalUsersKey] = maleRegionNormalUserIds;

      var femaleRegionNormalUsersKey = "region:"+cityLocation+":normalUsers:female";
      var femaleRegionNormalUserIds = multiRetData[multiRetDataIdx+1];
      regionAllData[femaleRegionNormalUsersKey] = femaleRegionNormalUserIds;

      var regionCreatedPhotosKey = "region:"+cityLocation+":createdPhotos";
      var regionCreatedPhotoIds = multiRetData[multiRetDataIdx+2];
      regionAllData[regionCreatedPhotosKey] = regionCreatedPhotoIds;

      var regionAuditDeniedPhotosKey = "region:"+cityLocation+":auditDeniedPhotos";
      var regionAuditDeniedPhotoIds = multiRetData[multiRetDataIdx+3];
      regionAllData[regionAuditDeniedPhotosKey] = regionAuditDeniedPhotoIds;

      var maleRegionNewPhotosKey = "region:"+cityLocation+":newPhotos:male";
      var maleRegionNewPhotoIds = multiRetData[multiRetDataIdx+4];
      regionAllData[maleRegionNewPhotosKey] = maleRegionNewPhotoIds;

      var femaleRegionNewPhotosKey = "region:"+cityLocation+":newPhotos:female";
      var femaleRegionNewPhotoIds = multiRetData[multiRetDataIdx+5];
      regionAllData[femaleRegionNewPhotosKey] = femaleRegionNewPhotoIds;

      var maleRegionHotPhotosKey = "region:"+cityLocation+":hotPhotos:male";
      var maleRegionHotPhotoIds = multiRetData[multiRetDataIdx+6];
      regionAllData[maleRegionHotPhotosKey] = maleRegionHotPhotoIds;

      var femaleRegionHotPhotosKey = "region:"+cityLocation+":hotPhotos:female";
      var femaleRegionHotPhotoIds = multiRetData[multiRetDataIdx+7];
      regionAllData[femaleRegionHotPhotosKey] = femaleRegionHotPhotoIds;

      regionsAllData.push(regionAllData);
    }
    return callback(null,regionsAllData);
  });//multi.exec
};//getRawRegionsLevel1


/**
 *
 * @param params - contains valueRegexp, needCaseInsensitive
 *   valueRegexp is a javascript regular expression
 * @param callback - is a function(err,regions)
 */
Redis.prototype.getRegionByRegexp = function (params,callback) {
  var self = this;
  var messagePrefix = 'in Redis.getRegionByRegexp, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.valueRegexp){
    var err = self.newError({errorKey:'needParameter',messageParams:['valueRegexp'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var valueRegexp = params.valueRegexp;
  var needCaseInsensitive = params.needCaseInsensitive;
  needCaseInsensitive = handy.convertToBool(needCaseInsensitive);
  var regexpAttributes = "";
  if (needCaseInsensitive) regexpAttributes += "i";
  var valueRegexpObj = new RegExp(valueRegexp, regexpAttributes);
  self.getRegions({req:req}, function(err,regionsInfo){
    if (err) return callback(err);
    var regions = regionsInfo.regions;
    var retRegions = [];
    if (regions && regions.length>0){
      for(var i=0; i<regions.length; i++){
        var region = regions[i];
        if (valueRegexpObj.test(region)){
          retRegions.push(region);
        }
      }//for
    }
    return callback(null,retRegions);
  });//getRegions
};//getRegionByRegexp




/**
 *
 * @param params - contains fieldName, fieldValueRegexp, needCaseInsensitive
 *   fieldName can be name, or cityLocation, region, deviceId
 *   fieldValueRegexp is a javascript regular expression
 * @param callback - is a function(err,userIds)
 */
Redis.prototype.getUserIdByFieldValueRegexp = function (params,callback) {
  var self = this;
  var messagePrefix = 'in Redis.getUserIdByFieldValueRegexp, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.fieldName){
    var err = self.newError({errorKey:'needParameter',messageParams:['fieldName'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.fieldValueRegexp){
    var err = self.newError({errorKey:'needParameter',messageParams:['fieldValueRegexp'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var fieldName = params.fieldName;
  var fieldValueRegexp = params.fieldValueRegexp;
  var needCaseInsensitive = params.needCaseInsensitive;
  needCaseInsensitive = handy.convertToBool(needCaseInsensitive);
  var regexpAttributes = "";
  if (needCaseInsensitive) regexpAttributes += "i";
  var fieldValueRegexpObj = new RegExp(fieldValueRegexp, regexpAttributes);
  self.client.get("user",function(err,maxId){
    if (err) return callback(err);
    if (!maxId) return callback(null,null);
    maxId = Number(maxId);
    var multi = self.client.multi();
    for(var i=1; i<=maxId; i++){
      var userId = i;
      var userKey = "user:"+userId;
      multi.hmget(userKey,"userId",fieldName);
    }//for
    multi.exec(function(err, multiRetData) {
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        return callback(err2);
      }
      var userIds = [];
      for(var i=0; i<multiRetData.length; i++){
        var userFieldValues = multiRetData[i];
        if (userFieldValues && userFieldValues.length==2){
          var userId = userFieldValues[0];
          var fieldValue = userFieldValues[1];
          if (fieldValueRegexpObj.test(fieldValue)){
            userIds.push(userId);
          }
        }
      }//for
      return callback(null,userIds);
    });//multi.exec
  });//client.get
};//getUserIdByFieldValueRegexp



/**
 *
 * @param params - contains userFieldInfos, needCaseInsensitive.
 *   each userFieldInfo contains  fieldName, fieldValueRegexp.
 *   fieldName can be name, or cityLocation, region, deviceId
 *   fieldValueRegexp is a javascript regular expression
 * @param callback - is a function(err,userIds)
 */
Redis.prototype.getUserIdByFieldsValueRegexp = function (params,callback) {
  var self = this;
  var messagePrefix = 'in Redis.getUserIdByFieldsValueRegexp, ';
  logger.logDebug("Redis.getUserIdByFieldsValueRegexp entered, params="+handy.inspectWithoutBig(params));
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  var userFieldInfos = params.userFieldInfos;
  var needCaseInsensitive = params.needCaseInsensitive;
  needCaseInsensitive = handy.convertToBool(needCaseInsensitive);
  var regexpAttributes = "";
  if (needCaseInsensitive) regexpAttributes += "i";
  var regexpAry = [];
  var fieldNames = [];
  var fieldsLength = 0;
  if (userFieldInfos){
    fieldsLength = userFieldInfos.length;
    for(var i=0; i<userFieldInfos.length; i++){
      var fieldObj = userFieldInfos[i];
      if (!fieldObj.fieldName){
        var err = self.newError({errorKey:'needParameter',messageParams:['fieldName'],messagePrefix:messagePrefix,req:req});
        return callback(err);
      }
      if (!fieldObj.fieldValueRegexp){
        var err = self.newError({errorKey:'needParameter',messageParams:['fieldValueRegexp'],messagePrefix:messagePrefix,req:req});
        return callback(err);
      }
      var fieldName = fieldObj.fieldName;
      var fieldValueRegexp = fieldObj.fieldValueRegexp;
      var fieldValueRegexpObj = new RegExp(fieldValueRegexp, regexpAttributes);
      regexpAry.push(fieldValueRegexpObj);
      fieldNames.push(fieldName);
    }//for
  }

  self.client.get("user",function(err,maxId){
    if (err) return callback(err);
    if (!maxId) return callback(null,null);
    maxId = Number(maxId);
    var multi = self.client.multi();
    for(var i=1; i<=maxId; i++){
      var userId = i;
      var userKey = "user:"+userId;
      var getUserFields = fieldNames.slice(0);
      getUserFields.unshift(userKey,"userId");
      multi.hmget(getUserFields);
    }//for
    multi.exec(function(err, multiRetData) {
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        return callback(err2);
      }
      var userIds = [];
      for(var i=0; i<multiRetData.length; i++){
        var userFieldValues = multiRetData[i];
        if (userFieldValues && userFieldValues.length>=1){
          var userId = userFieldValues[0];
          var beMatch = true;
          for(var j=1; j<=fieldsLength; j++){
            var fieldValue = userFieldValues[j];
            var fieldValueRegexpObj = regexpAry[j-1];
            if (!fieldValueRegexpObj.test(fieldValue)){
              beMatch = false;
              break;
            }
          }//for j
          if (beMatch){
            userIds.push(userId);
          }
        }
      }//for
      return callback(null,userIds);
    });//multi.exec
  });//client.get
};//getUserIdByFieldsValueRegexp


/**
*
* @param params - contains fieldName, fieldValueRegexp, needCaseInsensitive
*   fieldName can be description, or cityLocation, region
*   fieldValueRegexp is a javascript regular expression
* @param callback - is a function(err,dateIds)
*/
Redis.prototype.getDateIdByFieldValueRegexp = function (params,callback) {
 var self = this;
 var messagePrefix = 'in Redis.getDateIdByFieldValueRegexp, ';
 var req = params.req;
 if(!callback){
   var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
   return self.handleError({err:err});
 }
 if (!params.fieldName){
   var err = self.newError({errorKey:'needParameter',messageParams:['fieldName'],messagePrefix:messagePrefix,req:req});
   return callback(err);
 }
 if (!params.fieldValueRegexp){
   var err = self.newError({errorKey:'needParameter',messageParams:['fieldValueRegexp'],messagePrefix:messagePrefix,req:req});
   return callback(err);
 }
 var fieldName = params.fieldName;
 var fieldValueRegexp = params.fieldValueRegexp;
 var needCaseInsensitive = params.needCaseInsensitive;
 needCaseInsensitive = handy.convertToBool(needCaseInsensitive);
 var regexpAttributes = "";
 if (needCaseInsensitive) regexpAttributes += "i";
 var fieldValueRegexpObj = new RegExp(fieldValueRegexp, regexpAttributes);
 self.client.get("date",function(err,maxId){
   if (err) return callback(err);
   if (!maxId) return callback(null,null);
   maxId = Number(maxId);
   var multi = self.client.multi();
   for(var i=1; i<=maxId; i++){
     var dateId = i;
     var dateKey = "date:"+dateId;
     multi.hmget(dateKey,"dateId",fieldName);
   }//for
   multi.exec(function(err, multiRetData) {
     if (err){
       var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
       return callback(err2);
     }
     var dateIds = [];
     for(var i=0; i<multiRetData.length; i++){
       var dateFieldValues = multiRetData[i];
       if (dateFieldValues && dateFieldValues.length==2){
         var dateId = dateFieldValues[0];
         var fieldValue = dateFieldValues[1];
         if (fieldValueRegexpObj.test(fieldValue)){
           dateIds.push(dateId);
         }
       }
     }//for
     return callback(null,dateIds);
   });//multi.exec
 });//client.get
};//getDateIdByFieldValueRegexp



/**
 *
 * @param params - contains fieldName, fieldValueRegexp, needCaseInsensitive
 *   fieldName can be name, or cityLocation, region, deviceId
 *   fieldValueRegexp is a javascript regular expression
 * @param callback - is a function(err,userIds)
 */
Redis.prototype.getPhotoIdByFieldValueRegexp = function (params,callback) {
  var self = this;
  var messagePrefix = 'in Redis.getPhotoIdByFieldValueRegexp, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.fieldName){
    var err = self.newError({errorKey:'needParameter',messageParams:['fieldName'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.fieldValueRegexp){
    var err = self.newError({errorKey:'needParameter',messageParams:['fieldValueRegexp'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var fieldName = params.fieldName;
  var fieldValueRegexp = params.fieldValueRegexp;
  var needCaseInsensitive = params.needCaseInsensitive;
  needCaseInsensitive = handy.convertToBool(needCaseInsensitive);
  var regexpAttributes = "";
  if (needCaseInsensitive) regexpAttributes += "i";
  var fieldValueRegexpObj = new RegExp(fieldValueRegexp, regexpAttributes);
  self.client.get("photo",function(err,maxId){
    if (err) return callback(err);
    if (!maxId) return callback(null,null);
    maxId = Number(maxId);
    var multi = self.client.multi();
    for(var i=1; i<=maxId; i++){
      var photoId = i;
      var photoKey = "photo:"+photoId;
      multi.hmget(photoKey,"photoId",fieldName);
    }//for
    multi.exec(function(err, multiRetData) {
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        return callback(err2);
      }
      var photoIds = [];
      for(var i=0; i<multiRetData.length; i++){
        var photoFieldValues = multiRetData[i];
        if (photoFieldValues && photoFieldValues.length==2){
          var photoId = photoFieldValues[0];
          var fieldValue = photoFieldValues[1];
          if (fieldValueRegexpObj.test(fieldValue)){
            photoIds.push(photoId);
          }
        }
      }//for
      return callback(null,photoIds);
    });//multi.exec
  });//client.get
};//getPhotoIdByFieldValueRegexp



/**
 *
 * @param params - contains fieldName, fieldValueRegexp, needCaseInsensitive
 *   fieldName can be name, or cityLocation, region, deviceId
 *   fieldValueRegexp is a javascript regular expression
 * @param callback - is a function(err,userIds)
 */
Redis.prototype.getMessageIdByFieldValueRegexp = function (params,callback) {
  var self = this;
  var messagePrefix = 'in Redis.getMessageIdByFieldValueRegexp, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.fieldName){
    var err = self.newError({errorKey:'needParameter',messageParams:['fieldName'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.fieldValueRegexp){
    var err = self.newError({errorKey:'needParameter',messageParams:['fieldValueRegexp'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var fieldName = params.fieldName;
  var fieldValueRegexp = params.fieldValueRegexp;
  var needCaseInsensitive = params.needCaseInsensitive;
  needCaseInsensitive = handy.convertToBool(needCaseInsensitive);
  var regexpAttributes = "";
  if (needCaseInsensitive) regexpAttributes += "i";
  var fieldValueRegexpObj = new RegExp(fieldValueRegexp, regexpAttributes);
  self.client.get("message",function(err,maxId){
    if (err) return callback(err);
    if (!maxId) return callback(null,null);
    maxId = Number(maxId);
    var multi = self.client.multi();
    for(var i=1; i<=maxId; i++){
      var messageId = i;
      var messageKey = "message:"+messageId;
      multi.hmget(messageKey,"messageId",fieldName);
    }//for
    multi.exec(function(err, multiRetData) {
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        return callback(err2);
      }
      var messageIds = [];
      for(var i=0; i<multiRetData.length; i++){
        var messageFieldValues = multiRetData[i];
        if (messageFieldValues && messageFieldValues.length==2){
          var messageId = messageFieldValues[0];
          var fieldValue = messageFieldValues[1];
          if (fieldValueRegexpObj.test(fieldValue)){
            messageIds.push(messageId);
          }
        }
      }//for
      return callback(null,messageIds);
    });//multi.exec
  });//client.get
};//getMessageIdByFieldValueRegexp




/**
 *
 * @param params - contains dateId, userId1, userId2
 * @param callback - is a function(err,messageIds)
 */
Redis.prototype.getMessageIdsByDate2Users = function (params,callback) {
  var self = this;
  var messagePrefix = 'in Redis.getMessageIdsByDate2Users, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.userId1){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId1'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.userId2){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId2'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var dateId = params.dateId;
  var userId1 = params.userId1;
  var userId2 = params.userId2;
  var systemUserId = config.config.users.system.userId;

  self.client.get("message",function(err,maxId){
    if (err) return callback(err);
    if (!maxId) return callback(null,null);
    maxId = Number(maxId);
    var multi = self.client.multi();
    for(var i=1; i<=maxId; i++){
      var messageId = i;
      var messageKey = "message:"+messageId;
      multi.hmget(messageKey,"messageId","dateId","senderId","receiverId");
    }//for
    multi.exec(function(err, multiRetData) {
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        return callback(err2);
      }
      var messageIds = [];
      for(var i=0; i<multiRetData.length; i++){
        var messageFieldValues = multiRetData[i];
        var messageId = messageFieldValues[0];
        var msg_dateId = messageFieldValues[1];
        var senderId = messageFieldValues[2];
        var receiverId = messageFieldValues[3];
        if (msg_dateId == dateId ){
          if ((senderId == userId1 && receiverId == userId2)||(senderId == userId2 && receiverId == userId1)){
            messageIds.push(messageId);
          }else if ( (senderId == systemUserId && receiverId == userId2)||(senderId == systemUserId && receiverId == userId1) ){
            messageIds.push(messageId); // here may get system message to sender in other conversation in same date
          }
        }
      }//for
      return callback(null,messageIds);
    });//multi.exec
  });//client.get
};//getMessageIdsByDate2Users


/**
*
* @param params - contains dateId, userId1, userId2
* @param callback - is a function(err,messages)
*/
Redis.prototype.getMessagesByDate2Users = function (params,callback) {
  var self = this;
  var messagePrefix = 'in Redis.getMessagesByDate2Users, ';
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }

  self.getMessageIdsByDate2Users(params,function(err,messageIds){
    if (err) return callback(err);
    if (!messageIds || messageIds.length==0)  return callback(null,null);
    self.getMessages({messageIds:messageIds}, function(err,messages){
      if (err) return callback(err);
      return callback(null,messages);
    });
  });//getMessageIdsByDate2Users
};//getMessagesByDate2Users

/**
*
* @param params - contains userIds or fieldName, fieldValueRegexp, needCaseInsensitive
*   if userIds exists, just use userIds. userIds can be array or comma seperated string
*   fieldName can be name, or cityLocation, region, deviceId
*   fieldValueRegexp is a javascript regular expression
* @param callback - is a function(err,usersAllData)
*/
Redis.prototype.getRawMessagesDataByQuery = function (params,callback) {
  var self = this;
  var messagePrefix = 'in Redis.getRawMessagesDataByQuery, ';
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  function getMessageIds(cbFun){
    if (params.messageIds){
      var messageIds = params.messageIds;
      if (typeof messageIds == "string"){
        messageIds = messageIds.split(",");
      }
      return cbFun(null,messageIds);
    }
    self.getMessageIdByFieldValueRegexp(params, function(err,messageIds){
      if (err) return cbFun(err);
      return cbFun(null,messageIds);
    });//getMessageIdByFieldValueRegexp
  };//getMessageIds

  getMessageIds(function(err,messageIds){
    if (err) return callback(err);
    if (!messageIds || messageIds.length==0)  return callback(null,null);
    self.getMessages({messageIds:messageIds}, function(err,messagesAllData){
      if (err) return callback(err);
      return callback(null,messagesAllData);
    });
  });//getMessageIds
};//getRawMessagesDataByQuery


/**
*
* @param params - contains userIds or fieldName, fieldValueRegexp, needCaseInsensitive
*   if userIds exists, just use userIds. userIds can be array or comma seperated string
*   fieldName can be name, or cityLocation, region, deviceId
*   fieldValueRegexp is a javascript regular expression
* @param callback - is a function(err,usersAllData)
*/
Redis.prototype.getRawUsersDataByQuery = function (params,callback) {
  var self = this;
  var messagePrefix = 'in Redis.getRawUsersDataByQuery, ';
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  function getUserIds(cbFun){
    if (params.userIds){
      var userIds = params.userIds;
      if (typeof userIds == "string"){
        userIds = userIds.split(",");
      }
      return cbFun(null,userIds);
    }
    self.getUserIdByFieldValueRegexp(params, function(err,userIds){
      if (err) return cbFun(err);
      return cbFun(null,userIds);
    });//getUserIdByFieldValueRegexp
  };//getUserIds

  getUserIds(function(err,userIds){
    if (err) return callback(err);
    if (!userIds || userIds.length==0)  return callback(null,null);
    self.getRawUsersLevelAll({userIds:userIds}, function(err,usersAllData){
      if (err) return callback(err);
      return callback(null,usersAllData);
    });
  });//getUserIds
};//getRawUsersDataByQuery

/**
*
* @param params - contains dateIds or fieldName, fieldValueRegexp, needCaseInsensitive
*   if dateIds exists, just use dateIds. dateIds can be array or comma seperated string
*   fieldName can be description, or cityLocation, region
*   fieldValueRegexp is a javascript regular expression
* @param callback - is a function(err,datesAllData)
*/
Redis.prototype.getRawDatesDataByQuery = function (params,callback) {
  var self = this;
  var messagePrefix = 'in Redis.getRawDatesDataByQuery, ';
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  function getDateIds(cbFun){
    if (params.dateIds){
      var dateIds = params.dateIds;
      if (typeof dateIds == "string"){
        dateIds = dateIds.split(",");
      }
      return cbFun(null,dateIds);
    }
    self.getDateIdByFieldValueRegexp(params, function(err,dateIds){
      if (err) return cbFun(err);
      return cbFun(null,dateIds);
    });//getDateIdByFieldValueRegexp
  };//getDateIds

  getDateIds(function(err,dateIds){
    if (err) return callback(err);
    if (!dateIds || dateIds.length==0)  return callback(null,null);
    self.getRawDatesLevelAll({dateIds:dateIds}, function(err,datesAllData){
      if (err) return callback(err);
      return callback(null,datesAllData);
    });
  });//getDateIds
};//getRawDatesDataByQuery


/**
*
* @param params - contains regions or valueRegexp, needCaseInsensitive
*   if regions exists, just use regions. regions can be array or comma seperated string
*   valueRegexp is a javascript regular expression
* @param callback - is a function(err,regionsAllData)
*/
Redis.prototype.getRawRegionsDataByQuery = function (params,callback) {
  var self = this;
  var messagePrefix = 'in Redis.getRawRegionsDataByQuery, ';
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  function getRegions(cbFun){
    if (params.regions){
      var regions = params.regions;
      if (typeof regions == "string"){
        regions = regions.split(",");
      }
      return cbFun(null,regions);
    }
    self.getRegionByRegexp(params, function(err,regions){
      if (err) return cbFun(err);
      return cbFun(null,regions);
    });//getRegionByRegexp
  };//getRegions

  getRegions(function(err,regions){
    if (err) return callback(err);
    if (!regions || regions.length==0)  return callback(null,null);
    self.getRawRegionsLevel1({cityLocations:regions}, function(err,regionsAllData){
      if (err) return callback(err);
      return callback(null,regionsAllData);
    });
  });//getRegions
};//getRawRegionsDataByQuery



/**
*
* @param params - contains topEntityType, other fields according to the value of topEntityType
*   topEntityType can be user or date or region
* @param callback - is a function(err,dataArray)
*/
Redis.prototype.getRawDataByQuery = function (params,callback) {
  var self = this;
  var messagePrefix = 'in Redis.getRawDataByQuery, ';
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  if (!params.topEntityType){
    var err = self.newError({errorKey:'needParameter',messageParams:['topEntityType'],messagePrefix:messagePrefix});
    return callback(err);
  }
  var topEntityType = params.topEntityType;
  if (topEntityType == "user"){
    self.getRawUsersDataByQuery(params, function(err,usersAllData){
      return callback(err,usersAllData);
    });//getRawUsersDataByQuery
    return;
  }else if(topEntityType == "date"){
    self.getRawDatesDataByQuery(params, function(err,datesAllData){
      return callback(err,datesAllData);
    });//getRawDatesDataByQuery
    return;
  }else if(topEntityType == "message"){
    self.getRawMessagesDataByQuery(params, function(err,messagesAllData){
      return callback(err,messagesAllData);
    });//getRawDatesDataByQuery
    return;
  }else if(topEntityType == "messageByDate2Users"){
    self.getMessagesByDate2Users(params, function(err,messages){
      return callback(err,messages);
    });//getRawDatesDataByQuery
    return;
  }else if(topEntityType == "region"){
    self.getRawRegionsDataByQuery(params, function(err,regionsAllData){
      return callback(err,regionsAllData);
    });//getRawRegionsDataByQuery
    return;
  }else{
    return callback(null,null);
  }
};//getRawDataByQuery




/**
*
* @param params - contains topEntityType, other fields according to the value of topEntityType
*   topEntityType can be user or date or region
* @param callback - is a function(err,data)
*   data may be an array
*/
Redis.prototype.getBusinessDataByQuery = function (params,callback) {
  var self = this;
  var messagePrefix = 'in Redis.getBusinessDataByQuery, ';
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  if (!params.topEntityType){
    var err = self.newError({errorKey:'needParameter',messageParams:['topEntityType'],messagePrefix:messagePrefix});
    return callback(err);
  }
  var topEntityType = params.topEntityType;
  if (topEntityType == "user"){
    self.getBusinessUsersDataByQuery(params, function(err,usersAllData){
      return callback(err,usersAllData);
    });//getBusinessUsersDataByQuery
    return;
  }
//  else if(topEntityType == "date"){
//    self.getBusinessDatesDataByQuery(params, function(err,datesAllData){
//      return callback(err,datesAllData);
//    });//getRawDatesDataByQuery
//    return;
//  }
  else{
    return callback(null,null);
  }
};//getBusinessDataByQuery



/**
*
* @param params - contains
*   userIds or fieldName, fieldValueRegexp, needCaseInsensitive; dataType(raw | business | busByDevice. default be business); .
*     if userIds exists, just use userIds. userIds can be array or comma seperated string
*     fieldName can be name, or gender, deviceType and other fields belong to user.
*     fieldValueRegexp is a javascript regular expression.
*
* @param callback - is a function(err,users)
*/
Redis.prototype.getBusinessUsersDataByQuery = function (params,callback) {
  var self = this;
  var messagePrefix = 'in Redis.getBusinessUsersDataByQuery, ';
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }

  function getUserIds(cbFun){
    if (params.userIds){
      var userIds = params.userIds;
      if (typeof userIds == "string"){
        userIds = userIds.split(",");
      }
      return cbFun(null,userIds);
    }
    if (params.fieldName){//has field query
      self.getUserIdByFieldValueRegexp(params, function(err,userIds){
        if (err) return cbFun(err);
        return cbFun(null,userIds);
      });//getUserIdByFieldValueRegexp
      return;
    }

    if (params.dataType=='busByDevice'){
      self.getDistinctDeviceLastUserIds(params,function(err,userIds){
        if (err) return cbFun(err);
        //logger.logDebug("Redis.getBusinessUsersDataByQuery getDistinctDeviceLastUserIds callback, userIds="+util.inspect(userIds,false,100));
        return cbFun(null,userIds);
      });//getDistinctDeviceLastUserIds
      return;
    }

    //no field query, then need all
    self.getAllUserIds(params, function(err,userIds){
      if (err)  return callback(err);
      if (!userIds || userIds.length==0){
        return callback(null,null);
      }
      return cbFun(null,userIds);
    });//getAllUserIds
  };//getUserIds

  getUserIds(function(err,userIds){
    if (err) return callback(err);
    if (!userIds || userIds.length==0)  return callback(null,null);
    if (params.dataType=='raw'){
      self.getRawUsersLevelAll({userIds:userIds}, function(err,usersAllData){
        if (err) return callback(err);
        return callback(null,usersAllData);
      });
      return;
    }else{//business | busByDevice
      self.getUsers({userIds:userIds}, function(err,users){
        if (err) return callback(err);
        return callback(null,users);
      });//getUsers
      return;
    }
  });//getUserIds
};//getBusinessUsersDataByQuery






/**
 * only log error if can not return error through callback function
 * as a private function
 * @param params - contains err
 */
Redis.prototype.handleError = function(params){
  var self = this;
  var req = params.req;
  var messagePrefix = 'in Redis.handleError, ';
  //replace assert.ok(..) to below check codes because the error thrown by assert can not be handled
  if (!params.err){
    var err = self.newError({errorKey:'needParameter',messageParams:['err'],messagePrefix:messagePrefix,req:req});
    handy.handleError({err:err, nestlevel:0});
    return;
  }

  var err = params.err;
  logger.logError('error handled in redis layer');
  handy.handleError({err:params.err, nestlevel:0});
};

/**
 * new error with config defined. also can customize
 * as a private function
 * @param {Object} params - contains code,message,messagePrefix,errorKey.
 *   errorKey is used to get predefined error info in config.
 *   they all can be optional, at this time, the stack info is still useful.
 */
Redis.prototype.newError = function(params) {
  if(!params.messagePrefix) params.messagePrefix = 'error in redis function: ';
  return handy.newError(params);
};//newError








/**
*
* @param {Object} params - contains userId,updateFields
*   updateFields contains field-value pair, in fact it is a hash object
* @param {Function} callback - is function(err)
*/
Redis.prototype.updateUser = function(params, callback) {
 var self = this;
 var messagePrefix = 'in Redis.updateUser, ';
 var req = params.req;
 if (!params.userId){
   var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
   if (callback) return callback(err);
   else return self.handleError({err:err});
 }
 if (!params.updateFields){
   var err = self.newError({errorKey:'needParameter',messageParams:['updateFields'],messagePrefix:messagePrefix,req:req});
   if (callback) return callback(err);
   else return self.handleError({err:err});
 }

 var userId = params.userId;
 var updateFields = params.updateFields;
 var userKey = 'user:'+userId;
 var paramsUser = handy.toArray(userKey,updateFields);
 self.client.hmset(paramsUser,function(err){
   if (err){
     var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
     if (callback) return callback(err2);
     else return self.handleError({err:err2});
   }
   if (callback) return callback(null);
 });
};//updateUser

/**
 *
 *
 * @param {Object} params - contains userId, userFields(optional),
 *   needPhotoCount(optional), getSelf(optional),
 *   needPrimaryPhoto(optional),primaryPhotoFields(optional).
 * @param {Function} callback - is function(err,userObj)
 */
Redis.prototype.getUser = function(params, callback) {
  var messagePrefix = 'in Redis.getUser, ';
  var self = this;
  var req = params.req;
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var userId = params.userId;
  var paramsForGetUsers = tool.cloneObject(params);
  delete paramsForGetUsers.userId;
  paramsForGetUsers.userIds = [userId];
  paramsForGetUsers.req = req;
  self.getUsers(paramsForGetUsers, function(err,users){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (callback) return callback(null, users[0]);
    return;
  });//getUsers
};//getUser


/**
*
*
* @param {Object} params - contains userIds, userFields(optional), needKeepEmpty(optional),
*   needPhotoCount(optional), getSelf(simplify),
*   needPrimaryPhoto(optional),primaryPhotoFields(optional).
*       getSelf is used to control photos got.
*       if needPrimaryPhoto, just add 1 field user.primaryPhotoPath
* @param {Function} callback - is function(err,users)
*   if not needKeepEmpty, users length may not be equal to userIds length
*/
Redis.prototype.getUsers = function(params, callback) {
  //logger.logDebug("Redis.getUsers entered, params="+util.inspect(params,false,100));
  var messagePrefix = 'in Redis.getUsers, ';
  var self = this;
  var req = params.req;
  if (!params.userIds){
    var err = self.newError({errorKey:'needParameter',messageParams:['userIds'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var userIds = params.userIds;
  var userFields = params.userFields;
  var needKeepEmpty = params.needKeepEmpty;
  var needPhotoCount = params.needPhotoCount;
  //var needAuditPassedPhotoCount = params.needAuditPassedPhotoCount;
  var getSelf = params.getSelf;
  var needPrimaryPhoto = params.needPrimaryPhoto;
  var primaryPhotoFields = params.primaryPhotoFields;
  if (userIds.length == 0){
    if (callback) return callback(null, null);
    return;
  }
  var multi = self.client.multi();
  var itemCmdCount = 1, photoCountIndex; //auditPassedPhotoCountIndex;
  if (needPhotoCount){
    photoCountIndex = itemCmdCount;
    itemCmdCount++;
  }
//  if (needAuditPassedPhotoCount){
//    auditPassedPhotoCountIndex = itemCmdCount;
//    itemCmdCount++;
//  }
  var followingKey = null;
  for (var i=0; i<userIds.length; i++) {
    var userId = userIds[i];
    var userKey = 'user:'+userId;
    if (!needKeepEmpty){
      var field = "userId";
      if(userFields && handy.arrayIndexOf({ary:userFields,item:field})<0){
        userFields.push(field);
      }
    }
    if(userFields && userFields.length > 0){
      var getUserFields = userFields.slice(0);
      getUserFields.unshift(userKey);
      multi.hmget(getUserFields);
    }else{
      multi.hgetall(userKey);
    }
    var userPhotosKey = 'user:'+userId+':photos';
    //var userAuditPassedPhotos = 'user:'+userId+':auditPassedPhotos';
    if (needPhotoCount){
      multi.zcard(userPhotosKey);
//      if (getSelf){
//        multi.zcard(userPhotosKey);
//      }else{
//        multi.zcard(userAuditPassedPhotos);
//      }
    }
//    if (needAuditPassedPhotoCount){
//      multi.zcard(userAuditPassedPhotos);
//    }
  }//for
  multi.exec(function(err, retData) {
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    var users = [];
    for(var i=0; i<retData.length; i+=itemCmdCount){
      var userInfo = retData[i];
      var userHash;
      if (userFields && userFields.length > 0){
        userHash = handy.toHashWith2Array({keyArray:userFields, valueArray:userInfo});
      }else{
        userHash = userInfo;
      }
      if (userHash && needPhotoCount){
        var photoCount = retData[i+photoCountIndex];
        userHash.photoCount = photoCount + '';
      }
//      if (userHash && needAuditPassedPhotoCount){
//        var auditPassedPhotoCount = retData[i+auditPassedPhotoCountIndex];
//        userHash.auditPassedPhotoCount = auditPassedPhotoCount + '';
//      }
      userHash = handy.removeNullFieldFor1Level(userHash);
      if (!needKeepEmpty && userHash && userHash.userId || needKeepEmpty){
        users.push(userHash);
      }
    }//for
    //logger.logDebug("Redis.getUsers , after multi.exec, users="+util.inspect(users,false,100));
    if(users.length == 0){
      if (callback) return callback(null, null);
      return;
    }
    if(!needPrimaryPhoto){
      if (callback) return callback(null, users);
      return ;
    }
    var primaryPhotoIds = [];
    for(var i=0; i<users.length; i++){
      var user = users[i];
      if (user && user.primaryPhotoId)  primaryPhotoIds.push(user.primaryPhotoId);
    }
    if (primaryPhotoIds.length == 0){
      if (callback) return callback(null, users);
      return ;
    }
    self.getPhotos({req:req,photoIds:primaryPhotoIds,photoFields:primaryPhotoFields,
    userIdToCheckAlreadyLikedPhoto:null}, function(err,primaryPhotos){
      if (err){
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      shuffle.bindUserWithPrimaryPhotoPath({users:users,photos:primaryPhotos});
      if (callback) return callback(null, users);
      return ;
    });//self.getPhotos
    return;
  });//multi.exec
};//getUsers

/**
*
* @param {Object} params - contains emailAccount
* @param {Function} callback - is function(err,userId)
*   if the emailAccount has no correspond user, userId will be null.
*/
Redis.prototype.getUserIdByEmailAccount = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.getUserIdByEmailAccount, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  if (!params.emailAccount){
    var err = self.newError({errorKey:'needParameter',messageParams:['emailAccount'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var emailAccount = params.emailAccount;
  var emailToUserKey = 'emailToUser';
  var field = emailAccount;
  self.client.hget(emailToUserKey,field,function(err,userId){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      return callback(err2);
    }
    return callback(null,userId);
  });//client.hget
};//getUserIdByEmailAccount

/**
*
* @param {Object} params - contains accountRenRen
* @param {Function} callback - is function(err,userId)
*   if the accountRenRen has no correspond user, userId will be null.
*
*/
Redis.prototype.getUserIdByRenRenAccount = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.getUserIdByRenRenAccount, ';
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  var req = params.req;
  if (!params.accountRenRen){
    var err = self.newError({errorKey:'needParameter',messageParams:['accountRenRen'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var accountRenRen = params.accountRenRen;
  var uerRenRenKey = 'userRenRen:'+accountRenRen;
  self.client.hget(uerRenRenKey,"userId",function(err,userId){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      return callback(err2);
    }
    return callback(null,userId);
  });//client.hget
};//getUserIdByRenRenAccount

/**
*
* @param {Object} params - contains count, userId, expireTime
* @param {Function} callback - is function(err,inviteCodes)
*
*/
Redis.prototype.generateInviteCodeD = function(params, callback){
  var self = this;
  var messagePrefix = 'in Redis.generateInviteCode, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!(params.count > 0)){
    var err = self.newError({errorKey:'needParameter',messageParams:['count > 0'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var count = params.count;
  var userId = params.userId;
  var expireTime = params.expireTime;
  var inviteCodeKey = 'inviteCode';
  var userKey = "user:"+userId;
  var nowUtcTime = handy.getNowOfUTCdate().getTime();
  var multi = self.client.multi();
  multi.hget(userKey,'createInviteCodeCount');
  multi.exec(function(err,multiRetValues){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      return callback(err2);
    }
    var userCreateInviteCodeCount = multiRetValues[0];
    userCreateInviteCodeCount = handy.convertToNumber(userCreateInviteCodeCount);
    if (userId != config.config.users.system.userId &&
          (userCreateInviteCodeCount + count > config.config.userCreateInviteCodeLimit) ){
      var err2 = self.newError({errorKey:'canNotExceedUserCreateInviteCodeLimit',messageParams:[],messagePrefix:messagePrefix,req:req,innerError:err});
      return callback(err2);
    }

    var inviteCodes = [];
    for(var i=1; i<=count; i++){
      var inviteCode = handy.randomAlphabetNumberString(config.config.inviteCodeLength);
      inviteCodes.push(inviteCode);
    }//for
    //TODO check if the just created codes are all not be same as any already created.
    var multiSetCodes = self.client.multi();
    for(var i=0; i<inviteCodes.length; i++){
      var inviteCode = inviteCodes[i];
      multiSetCodes.hset(inviteCodeKey,inviteCode.toUpperCase()+"Valid",1);
      multiSetCodes.hset(inviteCodeKey,inviteCode.toUpperCase()+"User",userId);
      if (expireTime)  multiSetCodes.hset(inviteCodeKey,inviteCode.toUpperCase()+"ExpireTime",expireTime);
    }
    multiSetCodes.hincrby(userKey,'createInviteCodeCount', count);
    multiSetCodes.hincrby(inviteCodeKey,'codeCount', count);
    multiSetCodes.exec(function(err,multiRetValues){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        return callback(err2);
      }

      if (callback) return callback(null, inviteCodes);
      return;
    });//multiSetCodes.exec
  });//multi.exec
};//generateInviteCode


/**
*
* @param {Object} params - contains inviteCode
* @param {Function} callback - is function(err,codeInfo)
*   codeInfo contains userId, isValid
*
*/
Redis.prototype.getInviteCodeInfoD = function(params, callback){
  var self = this;
  var messagePrefix = 'in Redis.getInviteCodeInfo, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.inviteCode){
    if (config.config.needNotCheckInviteCode){
      var nowUTCTime = handy.getNowOfUTCdate().getTime();
      return callback(null,{userId:config.config.users.system.userId, generateTime:nowUTCTime, isValid:true});
    }else{
      var err = self.newError({errorKey:'needParameter',messageParams:['inviteCode'],messagePrefix:messagePrefix,req:req});
      return callback(err);
    }
  }
  var inviteCode = params.inviteCode;
  var multi = self.client.multi();
  var inviteCodeKey = 'inviteCode';
  multi.hget(inviteCodeKey,inviteCode.toUpperCase()+"Valid");
  multi.hget(inviteCodeKey,inviteCode.toUpperCase()+"User");
  multi.hget(inviteCodeKey,inviteCode.toUpperCase()+"ExpireTime");
  multi.exec(function(err,multiRetValues){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      return callback(err2);
    }
    var isValid = handy.convertToBool(multiRetValues[0]);
    var userId = multiRetValues[1];
    var expireTime = multiRetValues[2];

    var outData = {userId:userId, isValid:isValid, expireTime:expireTime};
    return callback(null,outData);
  });//multi.exec
};//getInviteCodeInfo


/**
 * if provided accountRenRen, will store renren.com account info.
 * @param {Object} params - contains emailAccount, password, inviteCode, name, gender, school, schoolId(optional),
 *   deviceType, deviceId, accountRenRen(optional), accessTokenRenRen(optional), accountInfoJson(optional), hometown(optional).
 * @param {Function} callback - is function(err,userObj)
 *   userObj contains userId,createTime,...
 */
Redis.prototype.registerEmailAccount = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.registerEmailAccount, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.emailAccount){
    var err = self.newError({errorKey:'needParameter',messageParams:['emailAccount'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
//  if (!params.inviteCode){
//    var err = self.newError({errorKey:'needParameter',messageParams:['inviteCode'],messagePrefix:messagePrefix,req:req});
//    return callback(err);
//  }
  if (!params.name){
    var err = self.newError({errorKey:'needParameter',messageParams:['name'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.gender){
    var err = self.newError({errorKey:'needParameter',messageParams:['gender'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.school){
    var err = self.newError({errorKey:'needParameter',messageParams:['school'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
//  if (!params.studentNO){
//    var err = self.newError({errorKey:'needParameter',messageParams:['studentNO'],messagePrefix:messagePrefix,req:req});
//    return callback(err);
//  }
  if (!params.deviceType){
    var err = self.newError({errorKey:'needParameter',messageParams:['deviceType'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.deviceId){
    var err = self.newError({errorKey:'needParameter',messageParams:['deviceId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
//  if (!params.latlng){
//    var err = self.newError({errorKey:'needParameter',messageParams:['latlng'],messagePrefix:messagePrefix,req:req});
//    if (callback) return callback(err);
//    else return self.handleError({err:err});
//  }
//  if (!params.region){
//    var err = self.newError({errorKey:'needParameter',messageParams:['region'],messagePrefix:messagePrefix,req:req});
//    return callback(err);
//  }

  var emailAccount = params.emailAccount;
  var inviteCode = params.inviteCode;
  var name = params.name;
  var gender = params.gender;
  var school = params.school;
  //var studentNO = params.studentNO;
  var deviceType = params.deviceType;
  var deviceId = params.deviceId;
  var accountRenRen = params.accountRenRen;
  var accessTokenRenRen = params.accessTokenRenRen;
  var accountInfoJson = params.accountInfoJson;
//  var latlng = params.latlng;
//  var region = params.region;
//  var geolibType = params.geolibType;
  var hometown = params.hometown;
  var password = params.password;
  var encryptedPwd = '';
  if (password) encryptedPwd = handy.encrypt(password);

  function checkAccountRenRen(cbFun){
    if (!accountRenRen) return cbFun(null);
    //TODO access renren.com to verify accessTokenRenRen and accountRenRen
    self.getUserIdByRenRenAccount({accountRenRen:accountRenRen},function(err,userId){
      if (err) return cbFun(err);
      if (userId){
        var err = self.newError({errorKey:'renrenAccountAlreadyRegistered',messageParams:[emailAccount],messagePrefix:messagePrefix,req:req});
        return callback(err);
      }
      return cbFun(null);
    });//getUserIdByRenRenAccount
  };//checkAccountRenRen

  function checkAccountEmail(cbFun){
    self.getUserIdByEmailAccount({req:req,emailAccount:emailAccount}, function(err,userId){
      if (err) return callback(err);
      if (userId){
        var err = self.newError({errorKey:'emailAlreadyRegistered',messageParams:[emailAccount],messagePrefix:messagePrefix,req:req});
        return callback(err);
      }
      return cbFun(null);
    });//getUserIdByEmailAccount
  };//checkAccountEmail

  checkAccountRenRen(function(err){
    if (err) return callback(err);
    checkAccountEmail(function(err){
      if (err) return callback(err);

      self.client.incr('user', function(err, newId) {
        if (err){
          var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
          return callback(err2);
        }
        userId = newId+'';
        var multi = self.client.multi();
        var createTime = handy.getNowOfUTCdate().getTime();
        var userKey = 'user:'+userId;
        var userObj = {userId:userId, emailAccount:emailAccount, password:encryptedPwd, name:name, gender:gender,
            school:school, deviceType:deviceType, regDeviceId:deviceId, currentDeviceId:deviceId,
            createTime:createTime+'', lastLoginTime:createTime+''};//region:regionJSONstr,
        //if (latlng) userObj.latlng = latlng;
        //if (geolibType) userObj.geolibType = geolibType;
        //if (countyLocation) userObj.countyLocation = countyLocation;
        if (accountRenRen) userObj.accountRenRen = accountRenRen;
        if (hometown) userObj.accountRenRen = hometown;

        var paramsUser = handy.toArray(userKey,userObj);
        multi.hmset(paramsUser);
        var emailToUserKey = 'emailToUser';
        multi.hset(emailToUserKey,emailAccount,userId);
        if (accountRenRen){
          var userRenRenKey = 'userRenRen:'+accountRenRen;
          var userRenRenObj = {userId:userId, accountRenRen:accountRenRen, createTime:createTime+'', accessTokenRenRen:accessTokenRenRen};
          if (accountInfoJson) userRenRenObj.accountInfoJson = accountInfoJson;
          var paramsUserRenRen = handy.toArray(userRenRenKey,userRenRenObj);
          multi.hmset(paramsUserRenRen);
          multi.incr('userRenRenCount');
        }

        multi.exec(function(err){
          if (err){
            var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
            return callback(err2);
          }
          return callback(null, userObj);
        });//multi.exec
        return;
      });//client.incr
    });//checkAccountEmail
  });//checkAccountRenRen
};//registerEmailAccount


/**
 *
 * @param {Object} params - contains emailAccount, password, deviceType, deviceId, userFields, needPrimaryPhoto, primaryPhotoFields
 * @param {Function} callback - is function(err,userObj)
 *
 */
Redis.prototype.emailLogIn = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.emailLogIn, ';
  var req = params.req;
  //logger.logDebug("Redis.emailLogIn entered, params="+util.inspect(params,false,100));
  if (!params.emailAccount){
    var err = self.newError({errorKey:'needParameter',messageParams:['emailAccount'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.deviceType){
    var err = self.newError({errorKey:'needParameter',messageParams:['deviceType'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.deviceId){
    var err = self.newError({errorKey:'needParameter',messageParams:['deviceId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var emailAccount = params.emailAccount;
  var password = params.password;
  var deviceType = params.deviceType;
  var deviceId = params.deviceId;
  var userFields = params.userFields;
  var needPrimaryPhoto = params.needPrimaryPhoto;
  var primaryPhotoFields = params.primaryPhotoFields;
  var encryptedPwd = '';
  if (password) encryptedPwd = handy.encrypt(password);
  var nowTime = handy.getNowOfUTCdate().getTime();
  self.getUserIdByEmailAccount({req:req,emailAccount:emailAccount}, function(err,userId){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (!userId){
      var err = self.newError({errorKey:'emailNotRegistered',messageParams:[emailAccount],messagePrefix:messagePrefix,req:req});
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (userFields){
      var shouldExistFields = ['userId','password','disabled'];
      userFields = handy.unionArray({ary1:userFields, ary2:shouldExistFields});
    }

    self.getUser({req:req,userId:userId,userFields:userFields,needPrimaryPhoto:needPrimaryPhoto,primaryPhotoFields:primaryPhotoFields}, function(err,userObj){
      if (err){
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      //inconsistent data, should take care ! ......
      if (!userObj || !userObj.userId){
        var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      var userDisabled = handy.convertToBool(userObj.disabled);
      if (userDisabled){
        var err = self.newError({errorKey:'userDisabled',messageParams:[],messagePrefix:messagePrefix,req:req});
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      var pwdEqual = handy.comparePassword({pwd1:encryptedPwd, pwd2:userObj.password});
      if (!pwdEqual){
        var err = self.newError({errorKey:'passwordNotMatch',messageParams:[],messagePrefix:messagePrefix,req:req});
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      self.updateUser({req:req,userId:userId,updateFields:{deviceType:deviceType,currentDeviceId:deviceId,lastLoginTime:nowTime+''}}, function(err){
        if (err){
          if (callback) return callback(err);
          else return self.handleError({err:err});
        }
        if (callback) return callback(null, userObj);
        return;
      });//self.updateUser
    });//getUser
  });//getUserIdByEmailAccount
};//emailLogIn


/**
*
* @param {Object} params - contains accountRenRen, accessTokenRenRen, deviceType, deviceId, userFields, needPrimaryPhoto, primaryPhotoFields
* @param {Function} callback - is function(err,userInfo)
*   userInfo contains userExist, user.
*
*/
Redis.prototype.renrenAccountLogIn = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.renrenAccountLogIn, ';
  var req = params.req;
  //logger.logDebug("Redis.renrenAccountLogIn entered, params="+util.inspect(params,false,100));
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  if (!params.accountRenRen){
    var err = self.newError({errorKey:'needParameter',messageParams:['accountRenRen'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.accessTokenRenRen){
    var err = self.newError({errorKey:'needParameter',messageParams:['accessTokenRenRen'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.deviceType){
    var err = self.newError({errorKey:'needParameter',messageParams:['deviceType'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.deviceId){
    var err = self.newError({errorKey:'needParameter',messageParams:['deviceId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var accountRenRen = params.accountRenRen;
  var accessTokenRenRen = params.accessTokenRenRen;
  var deviceType = params.deviceType;
  var deviceId = params.deviceId;
  var userFields = params.userFields;
  var needPrimaryPhoto = params.needPrimaryPhoto;
  var primaryPhotoFields = params.primaryPhotoFields;
  //TODO verify accessTokenRenRen with renren api

  var nowTime = handy.getNowOfUTCdate().getTime();
  self.getUserIdByRenRenAccount({req:req, accountRenRen:accountRenRen}, function(err,userId){
    if (err) return callback(err);
    if (!userId){
      return callback(null,{userExist:false});
    }
    if (userFields){
      var shouldExistFields = ['userId','disabled'];
      userFields = handy.unionArray({ary1:userFields, ary2:shouldExistFields});
    }

    self.getUser({req:req,userId:userId,userFields:userFields,needPrimaryPhoto:needPrimaryPhoto,primaryPhotoFields:primaryPhotoFields}, function(err,userObj){
      if (err) return callback(err);
      //inconsistent data, should take care ! ......
      if (!userObj || !userObj.userId){
        var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
        return callback(err);
      }
      var userDisabled = handy.convertToBool(userObj.disabled);
      if (userDisabled){
        var err = self.newError({errorKey:'userDisabled',messageParams:[],messagePrefix:messagePrefix,req:req});
        return callback(err);
      }
      self.updateUser({req:req,userId:userId,updateFields:{deviceType:deviceType,currentDeviceId:deviceId,lastLoginTime:nowTime+''}}, function(err){
        if (err) return callback(err);
        return callback(null, {userExist:true, user:userObj});
      });//self.updateUser
    });//getUser
  });//getUserIdByRenRenAccount
};//renrenAccountLogIn



/**
* a business function, check user in app.
* should check user existence, if user disabled, if session expired.
* just check, no renew needs from v1.2.
* @param {Object} params - contains userId
* @param {Function} callback - is function(err)
*
*/
Redis.prototype.checkAndRenewLogInSession = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.checkAndRenewLogInSession, ';
  var req = params.req;
  //logger.logDebug("Redis.checkAndRenewLogInSession entered, params="+util.inspect(params,false,100));
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var userId = params.userId;
  self.getUser({req:req,userId:userId,userFields:['userId','disabled']}, function(err,userObj){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (!userObj || !userObj.userId){
      var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    var userDisabled = handy.convertToBool(userObj.disabled);
    if (userDisabled){
      var err = self.newError({errorKey:'userDisabled',messageParams:[userId],messagePrefix:messagePrefix,req:req});
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    //clearSessionRelated can not be called here when find session expired because of cookie session, but where to call ......
    if (callback) return callback(null);
    return;
  });//getUser
};//checkAndRenewLogInSession


/**
*
* @param {Object} params - contains userId
* @param {Function} callback - is function(err)
*
*/
Redis.prototype.logOut = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.logOut, ';
  var req = params.req;
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var userId = params.userId;
  self.getUser({req:req,userId:userId,userFields:['userId']}, function(err,userObj){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (!userObj || !userObj.userId){
      var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    self.clearSessionRelated({req:req,userId:userId}, function(err){
      if (err){
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      if (callback) return callback(null);
      return;
    });//clearSessionRelated
  });//getUser
};//logOut

/**
*
* @param {Object} params - contains userId
* @param {Function} callback - is function(err)
*
*/
Redis.prototype.clearSessionRelated = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.clearSessionRelated, ';
  var req = params.req;
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var userId = params.userId;
  var nowTime = handy.getNowOfUTCdate().getTime();
  self.updateUser({req:req,userId:userId,updateFields:{appToken:'',lastLogoutTime:nowTime+''}}, function(err){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (callback) return callback(null);
    return;
  });//self.updateUser
};//clearSessionRelated

/**
 *
 * @param {Object} params - contains userId, oldPassword(optional), newPassword, justUpdate(optional)
 * @param {Function} callback - is function(err)
 *
 */
Redis.prototype.resetPassword = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.resetPassword, ';
  var req = params.req;
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.newPassword){
    var err = self.newError({errorKey:'needParameter',messageParams:['newPassword'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var userId = params.userId;
  var oldPassword = params.oldPassword;
  var newPassword = params.newPassword;
  var justUpdate = params.justUpdate;
  var encryptedOldPwd = '';
  var encryptedNewPwd = '';
  if (!justUpdate){
    if (!params.oldPassword){
      var err = self.newError({errorKey:'needParameter',messageParams:['oldPassword'],messagePrefix:messagePrefix,req:req});
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (oldPassword) encryptedOldPwd = handy.encrypt(oldPassword);
  }
  if (newPassword) encryptedNewPwd = handy.encrypt(newPassword);
  self.getUser({req:req,userId:userId,userFields:['userId','password']}, function(err,userObj){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (!userObj || !userObj.userId){
      var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (!justUpdate){
      var pwdEqual = handy.comparePassword({pwd1:encryptedOldPwd, pwd2:userObj.password});
      if (!pwdEqual){
        var err = self.newError({errorKey:'passwordNotMatch',messageParams:[],messagePrefix:messagePrefix,req:req});
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
    }
    var userKey = "user:"+userId;
    self.client.hset(userKey,'password',encryptedNewPwd,function(err){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        if (callback) return callback(err2);
        else return self.handleError({err:err2});
      }
      if (callback) return callback(null);
    });//client.hset
  });//getUser
};//resetPassword







/**
 * with some business. when first photo, will be set as primary photo.
 *
 * @param {Object} params - contains userId,gender,photoPath,width,height, setPrimary
 *     when first photo, will be set as primary photo. if setPrimary, will also be setPrimary.
 * @param {Function} callback - is function(err,photoObj)
 *   photoObj contains bePrimaryPhoto and others.
 */
Redis.prototype.createPhoto = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.createPhoto, ';
  var req = params.req;
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.gender){
    var err = self.newError({errorKey:'needParameter',messageParams:['gender'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.photoPath){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoPath'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.width){
    var err = self.newError({errorKey:'needParameter',messageParams:['width'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.height){
    var err = self.newError({errorKey:'needParameter',messageParams:['height'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var userId = params.userId;
  var gender = params.gender;
  var photoPath = params.photoPath;
  var width = params.width;
  var height = params.height;
  var setPrimary = params.setPrimary;
  var createTime = handy.getNowOfUTCdate().getTime();
  self.client.incr('photo', function(err, newId) {
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    var photoId = newId+'';
    var photoKey = 'photo:'+photoId;
    var photoObj = {photoId:photoId, userId:userId, photoPath:photoPath, width:width, height:height,
        state:'created', createTime:createTime+'', likeCount:0+''};
    var paramsPhoto = handy.toArray(photoKey,photoObj);
    var multi = self.client.multi();
    multi.hmset(paramsPhoto);

    var userKey = 'user:'+userId;
    if (setPrimary){
      multi.hset(userKey,'primaryPhotoId',photoId);// according to setUserPrimaryPhoto, not complicate logic for now, so here only update.
    }else{
      multi.hsetnx(userKey,'primaryPhotoId',photoId);
    }

    var userPhotosKey = 'user:'+userId+':photos';
    multi.zadd(userPhotosKey,photoObj.createTime,photoId);
    var allCreatedPhotosKey = 'allCreatedPhotos';
    multi.zadd(allCreatedPhotosKey,photoObj.createTime,photoId);
    multi.exec(function(err,multiRetValues){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        if (callback) return callback(err2);
        else return self.handleError({err:err2});
      }
      var bePrimaryPhoto = false;
      if (setPrimary){
        bePrimaryPhoto = setPrimary;
      }else{
        bePrimaryPhoto = handy.convertToBool(multiRetValues[1]);
      }
      photoObj.bePrimaryPhoto = bePrimaryPhoto;
      if (callback) return callback(null, photoObj);
      return;
    });//multi.exec
  });//client.incr
};//createPhoto



/**
 *
 * @param {Object} params - contains photoId,updateFields
 *   updateFields contains field-value pair, in fact it is a hash object
 * @param {Function} callback - is function(err)
 */
Redis.prototype.updatePhoto = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.updatePhoto, ';
  var req = params.req;
  if (!params.photoId){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.updateFields){
    var err = self.newError({errorKey:'needParameter',messageParams:['updateFields'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }

  var photoId = params.photoId;
  var updateFields = params.updateFields;
  var photoKey = 'photo:'+photoId;
  var paramsPhoto = handy.toArray(photoKey,updateFields);
  self.client.hmset(paramsPhoto,function(err){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    if (callback) return callback(null);
  });
};//updatePhoto


Redis.prototype.getMaxIdsD = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.getMaxIds, ';
  var req = params.req;
  var idKeys = ['user','photo','message'];
  var multi = self.client.multi();
  for(var i=0; i<idKeys.length; i++){
    var idKey = idKeys[i];
    multi.get(idKey);
  }
  multi.exec(function(err,multiRetValues){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    var kvPair = {};
    for(var i=0; i<idKeys.length; i++){
      var idKey = idKeys[i];
      kvPair[idKey] = multiRetValues[i];
    }
    if (callback) return callback(null, kvPair);
    return;
  });//multi.exec
};//getMaxIds

/**
 * with some business logic.
 *   will set or change user primary photo when condition meet.
 *
 * @param {Object} params - contains auditUserId,photoId,passed,photoTime,oldPhotoState,description,photoOwner.
 *       photoOwner contains userId, primaryPhotoId(can be null), gender, region, geolibType.
 * @param {Function} callback - is function(err,auditInfo)
 *   auditInfo contains auditObj, bePrimaryPhoto,
 *       primaryPhotoChanged, newPrimaryPhotoId,
 *     only when passed be true,  bePrimaryPhoto have meaningful values.
 *     when not passed, primaryPhotoChanged, newPrimaryPhotoId have meaningful values
 */
Redis.prototype.auditPhoto = function(params, callback) {
  //logger.logDebug("Redis.auditPhoto entered, params="+util.inspect(params,false,100));
  var self = this;
  var messagePrefix = 'in Redis.auditPhoto, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.auditUserId){
    var err = self.newError({errorKey:'needParameter',messageParams:['auditUserId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.photoId){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (params.passed == null){
    var err = self.newError({errorKey:'needParameter',messageParams:['passed'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.photoTime){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoTime'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.oldPhotoState){
    var err = self.newError({errorKey:'needParameter',messageParams:['oldPhotoState'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.photoOwner){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoOwner'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.photoOwner.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoOwner.userId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.photoOwner.gender){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoOwner.gender'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
//  if (!params.photoOwner.region){
//    var err = self.newError({errorKey:'needParameter',messageParams:['photoOwner.region'],messagePrefix:messagePrefix,req:req});
//    return callback(err);
//  }
//  if (!params.photoOwner.geolibType){
//    var err = self.newError({errorKey:'needParameter',messageParams:['photoOwner.geolibType'],messagePrefix:messagePrefix,req:req});
//    return callback(err);
//  }
  var auditUserId = params.auditUserId;
  var photoId = params.photoId;
  var passed = params.passed;
  var photoTime = params.photoTime;
  var oldPhotoState = params.oldPhotoState;
  var description = params.description;
  var photoOwner = params.photoOwner;

  var state ;
  if (passed)
    state = 'auditPassed';
  else
    state = 'auditDenied';
  var auditTime = handy.getNowOfUTCdate().getTime();

//  var regionInfo = handy.getCentainLevelRegion({region:photoOwner.region,geolibType:photoOwner.geolibType,regionLevel:4});
//  if (regionInfo.err){
//    return self.handleError({err:regionInfo.err});
//  }
//  var regionJSONstr = JSON.stringify(regionInfo.regionObj);
//  var countyLocation = regionInfo.centainLevelRegion;
//  var regionInfo2 = handy.getCentainLevelRegion({regions:regionInfo.regions,regionLevel:3});
//  var cityLocation = regionInfo2.centainLevelRegion;

  if(oldPhotoState == "deleted"){
    var err = self.newError({errorKey:'photoAlreadyDeleted',messageParams:[photoId],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }else if((oldPhotoState == "auditPassed" && passed)||(oldPhotoState == "auditDenied" && !passed)){
    //no need to re-audit-pass or re-audit-deny
    return callback(null,null);
  }

  self.client.incr('audit', function(err, newId) {
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      return callback(err2);
    }
    var auditId = newId+'';
    var multi = self.client.multi();
    var auditKey = 'audit:'+auditId;
    var auditObj = {auditId:auditId, photoId:photoId, createTime:auditTime+'', photoOwnerId:photoOwner.userId, auditUserId:auditUserId, state:state, description:description};
    var paramsAudit = handy.toArray(auditKey,auditObj);
    multi.hmset(paramsAudit);
    var photoKey = 'photo:'+photoId;
    multi.hset(photoKey,'state',state);
    var userAuditPassedPhotosKey = 'user:'+photoOwner.userId+':auditPassedPhotos';
    multi.zcard(userAuditPassedPhotosKey);
    var allCreatedPhotosKey = 'allCreatedPhotos';
    multi.zrem(allCreatedPhotosKey,photoId);
    var allAuditPassedPhotosKey = 'allAuditPassedPhotos';
    var allAuditDeniedPhotosKey = 'allAuditDeniedPhotos';

    //var regionNormalUsersKey = 'region:'+cityLocation+':normalUsers:'+photoOwner.gender;
    //var countyregionNormalUsersKey = 'countyregion:'+countyLocation+':normalUsers:'+photoOwner.gender;
    if (passed){
      multi.zadd(userAuditPassedPhotosKey,photoTime,photoId);
      multi.zadd(allAuditPassedPhotosKey,photoTime,photoId);
      multi.zrem(allAuditDeniedPhotosKey,photoId);
      //multi.zadd(regionNormalUsersKey,photoTime,photoOwner.userId);
      //multi.zadd(countyregionNormalUsersKey,photoTime,photoOwner.userId);
    }else{//not passed
      //no userAuditDeniedPhotosKey
      if (oldPhotoState == "created"){
        //nothing to do
      }else if(oldPhotoState == "auditPassed"){
        multi.zrange(userAuditPassedPhotosKey,0,2);//for possible primaryPhoto change
        multi.zrem(userAuditPassedPhotosKey,photoId);
        multi.zrem(allAuditPassedPhotosKey,photoId);
      }else{
        //no possible else
      }
      multi.zadd(allAuditDeniedPhotosKey,photoTime,photoId);
    }
    multi.exec(function(err,multiRetData){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        return callback(err2);
      }
      var auditPassedPhotoCountBefore = Number(multiRetData[2]);
      var outAuditInfo = {auditObj:auditObj};

      var primaryPhotoIdBackingAry = null;
      if (passed){
      }else{//!passed
        if (oldPhotoState == "created"){
          //nothing to get
        }else if(oldPhotoState == "auditPassed"){
          primaryPhotoIdBackingAry = multiRetData[4];
        }else{
          //no possible else
        }
      }

      function checkToClearRegionNormalUsers(cbFun){
        return cbFun(null);
//        if (!passed && oldPhotoState == "auditPassed"){
//          if (auditPassedPhotoCountBefore <= 1){//here no transaction, so have little possible that data inconsistent
//            //remove this photo, the user will have no auditpassed photos, so should remove the user from normal user list to prevent to be able to be searched out
//            var multiRnu = self.client.multi();
//            multiRnu.zrem(regionNormalUsersKey,photoOwner.userId);
//            multiRnu.zrem(countyregionNormalUsersKey,photoOwner.userId);
//            multiRnu.exec(function(err){
//              if (err){
//                var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
//                return cbFun(err2);
//              }
//              return cbFun(null);
//            });//multi.exec
//            return;
//          }//if (auditPassedPhotoCountBefore <= 1)
//          return cbFun(null);
//        }//if (!passed && oldPhotoState == "auditPassed")
//        return cbFun(null);
      };//checkToClearRegionNormalUsers

      /**
       * cbFun is function(err,setPrimaryPhotoInfo)
       *   setPrimaryPhotoInfo contains bePrimaryPhoto(when auditPassed), primaryPhotoChanged, newPrimaryPhotoId(when auditDenied)
       */
      function checkToSetUserPrimaryPhoto(cbFun){
        if(passed){
          var bePrimaryPhoto = false;
          if (auditPassedPhotoCountBefore == 0){
            self.setUserPrimaryPhoto({req:req,userId:photoOwner.userId,photoId:photoId}, function(err){
              if (err) return cbFun(err);
              bePrimaryPhoto = true;
              return cbFun(null,{bePrimaryPhoto:bePrimaryPhoto});
            });//setUserPrimaryPhoto
            return;
          }//if (auditPassedPhotoCountBefore == 0)
          return cbFun(null,{bePrimaryPhoto:bePrimaryPhoto});
        }else{//!passed
          if (photoOwner.primaryPhotoId && (photoOwner.primaryPhotoId == photoId)){
            //need change primaryPhotoId. for now, any other auditPassed photo can be primaryPhoto
            var newPrimaryPhotoId = null;
            if (primaryPhotoIdBackingAry && primaryPhotoIdBackingAry.length>0){
              for(var i=0; i<primaryPhotoIdBackingAry.length; i++){
                var primaryPhotoIdBacking = primaryPhotoIdBackingAry[i];
                if (primaryPhotoIdBacking && (primaryPhotoIdBacking != photoOwner.primaryPhotoId)){
                  newPrimaryPhotoId = primaryPhotoIdBacking;
                  break;
                }
              }//for
            }//if (primaryPhotoIdBackingAry && primaryPhotoIdBackingAry.length>0)
            if (newPrimaryPhotoId){
              //change primaryPhotoId
            }else{
              //clear primaryPhotoId
            }
            self.setUserPrimaryPhoto({req:req,userId:photoOwner.userId,photoId:newPrimaryPhotoId?newPrimaryPhotoId:""}, function(err){
              if (err) return cbFun(err);
              return cbFun(null,{primaryPhotoChanged:true,newPrimaryPhotoId:newPrimaryPhotoId});
            });//setUserPrimaryPhoto
            return;
          }//if (photoOwner.primaryPhotoId && (photoOwner.primaryPhotoId == photoId))
          return cbFun(null,{primaryPhotoChanged:false});
        }
        return;
      };//checkToSetUserPrimaryPhoto

      checkToClearRegionNormalUsers(function(err){
        if (err) return callback(err);
        checkToSetUserPrimaryPhoto(function(err,setPrimaryPhotoInfo){
          if (err) return callback(err);
          outAuditInfo.bePrimaryPhoto = setPrimaryPhotoInfo.bePrimaryPhoto;
          outAuditInfo.primaryPhotoChanged = setPrimaryPhotoInfo.primaryPhotoChanged;
          outAuditInfo.newPrimaryPhotoId = setPrimaryPhotoInfo.newPrimaryPhotoId;

          return callback(null, outAuditInfo);
        });//checkToSetUserPrimaryPhoto
      });//checkToClearRegionNormalUsers
      return;
    });//multi.exec
  });//client.incr
};//auditPhoto



/**
 * the photo should not be deleted before. should not be primary photo.
 * these need outside do check. so the photo should not be the only 1 audit passed photo because such photo should be primary photo.
 * @param {Object} params - contains photoId,  photoOwnerId,feedId,createTime,state
 *
 * @param {Function} callback - is function(err)
 */
Redis.prototype.deletePhotoLogically = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.deletePhotoLogically, ';
  var req = params.req;
  if (!params.photoId){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.photoOwnerId){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoOwnerId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.createTime){
    var err = self.newError({errorKey:'needParameter',messageParams:['createTime'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.state){
    var err = self.newError({errorKey:'needParameter',messageParams:['state'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var photoId = params.photoId;
  var photoOwnerId = params.photoOwnerId;
  var createTime = params.createTime;
  var state = params.state;

  var multi = self.client.multi();
  var photoKey = 'photo:'+photoId;
  multi.hset(photoKey,'state','deleted');
  var userPhotosKey = 'user:'+photoOwnerId+':photos';
  multi.zrem(userPhotosKey,photoId);
//  var userAuditPassedPhotosKey = 'user:'+photoOwnerId+':auditPassedPhotos';
//  multi.zrem(userAuditPassedPhotosKey,photoId);
  var userDeletedPhotosKey = 'user:'+photoOwnerId+':deletedPhotos';
  multi.zadd(userDeletedPhotosKey,createTime,photoId);

  var allCreatedPhotosKey = 'allCreatedPhotos';
  multi.zrem(allCreatedPhotosKey,photoId);
  var allAuditPassedPhotosKey = 'allAuditPassedPhotos';
  multi.zrem(allAuditPassedPhotosKey,photoId);
  var allAuditDeniedPhotosKey = 'allAuditDeniedPhotos';
  multi.zrem(allAuditDeniedPhotosKey,photoId);

  //if deleting the only 1 auditPassed photo, this should not occur because the only 1 auditPassed photo should be user primary photo and this should be checked outside and be prevented.
  multi.exec(function(err){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    if (callback) return callback(null);
    return;
  });//multi.exec
};//deletePhotoLogically

/**
*
* @param {Object} params - contains userId, photoId
*   photoId can be null, it means to clear.
* @param {Function} callback - is function(err)
*/
Redis.prototype.setUserPrimaryPhoto = function(params, callback) {
  var messagePrefix = 'in Redis.setUserPrimaryPhoto, ';
  var self = this;
  var req = params.req;
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var userId = params.userId;
  var photoId = params.photoId;
  var userKey = 'user:'+userId;
  if (!photoId) photoId = '';
  self.client.hset(userKey,'primaryPhotoId',photoId,function(err){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    if (callback) return callback(null);
    return;
  });//client.hset
};//setUserPrimaryPhoto


///**
//*
//*
//* redis data types:
//*
//*
//* @param {Object} params - contains photoId, userId
//* @param {Function} callback - is function(err,photoInfo)
//*   photoInfo contains state,userIsOwner,isUserPrimaryPhoto
//*/
//Redis.prototype.getPhotoUserInfo = function(params, callback) {
//  var messagePrefix = 'in Redis.getPhotoUserInfo, ';
//  var self = this;
//  if (!params.photoId){
//    var err = self.newError({errorKey:'needParameter',messageParams:['photoId'],messagePrefix:messagePrefix,req:req});
//    if (callback) return callback(err);
//    else return self.handleError({err:err});
//  }
//  if (!params.userId){
//    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
//    if (callback) return callback(err);
//    else return self.handleError({err:err});
//  }
//  var photoId = params.photoId;
//  var userId = params.userId;
//  var photoKey = 'photo:'+photoId;
//  var userKey = 'user:'+userId;
//  var multi = self.client.multi();
//  multi.hmget(photoKey,'photoId','userId','state');
//  multi.hmget(userKey,'userId','primaryPhotoId');
//
//};//getPhotoUserInfo

/**
*
* @param {Object} params - contains photoId, photoFields(optional),userIdToCheckAlreadyLikedPhoto(optional)
* @param {Function} callback - is function(err,photoObj)
*/
Redis.prototype.getPhoto = function(params, callback) {
  var messagePrefix = 'in Redis.getPhoto, ';
  var self = this;
  var req = params.req;
  if (!params.photoId){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var photoId = params.photoId;
  var photoFields = params.photoFields;
  var userIdToCheckAlreadyLikedPhoto = params.userIdToCheckAlreadyLikedPhoto;
  self.getPhotos({req:req,photoIds:[photoId],photoFields:photoFields,userIdToCheckAlreadyLikedPhoto:userIdToCheckAlreadyLikedPhoto}, function(err,photos){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (callback) return callback(null, photos[0]);
    return;
  });//getPhotos
};//getPhoto

/**
*
* @param {Object} params - contains photoIds, photoFields(optional), userIdToCheckAlreadyLikedPhoto(optional)
*   if userIdToCheckAlreadyLikedPhoto be true, alreadyLiked field will set to photo obj
* @param {Function} callback - is function(err,photos)
*
*/
Redis.prototype.getPhotos = function(params, callback) {
  var messagePrefix = 'in Redis.getPhotos, ';
  var self = this;
  var req = params.req;
  if (!params.photoIds){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoIds'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var photoIds = params.photoIds;
  if (photoIds.length == 0){
    if (callback) return callback(null, null);
    return;
  }
  var photoFields = params.photoFields;
  var userIdToCheckAlreadyLikedPhoto = params.userIdToCheckAlreadyLikedPhoto;
  var itemCmdCount = 1;
  if (userIdToCheckAlreadyLikedPhoto != null){
    itemCmdCount ++;
  }

  var multi = self.client.multi();
  for (idx in photoIds) {
    var photoId = photoIds[idx];
    var photoKey = 'photo:'+photoId;
    if(photoFields && photoFields.length > 0){
      var getPhotoFields = photoFields.slice(0);
      getPhotoFields.unshift(photoKey);
      multi.hmget(getPhotoFields);
    }else{
      multi.hgetall(photoKey);
    }
    if (userIdToCheckAlreadyLikedPhoto != null){
      var likePhotoKey = 'like:photo:'+photoId;
      multi.sismember(likePhotoKey,userIdToCheckAlreadyLikedPhoto);
    }
  }//for
  multi.exec(function(err, retData) {
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    var photos = [];
    for(var i=0; i<retData.length; i+=itemCmdCount){
      var photoInfo = retData[i];
      var photoHash;
      if (photoFields && photoFields.length > 0){
        photoHash = handy.toHashWith2Array({keyArray:photoFields, valueArray:photoInfo});
      }else{
        photoHash = photoInfo;
      }
      if (userIdToCheckAlreadyLikedPhoto != null){
        var alreadyLiked = Boolean(retData[i+1]);
        photoHash.alreadyLiked = alreadyLiked;
      }
      photoHash = handy.removeNullFieldFor1Level(photoHash);
      photos.push(photoHash);
    }//for
    if (photos && photos.length > 0) {
      if (callback) return callback(null, photos);
    }else{
      if (callback) return callback(null, null);
    }
    return ;
  });//multi.exec
};//getPhotos


/**
*
*
* redis data types:
*
*
* @param {Object} params - contains photoIds, photoFields(optional), userFields(optional),
*   needPrimaryPhoto,primaryPhotoFields, userIdToCheckAlreadyLikedPhoto(optional)
* @param {Function} callback - is function(err,photos)
*/
Redis.prototype.getPhotosWithUser = function(params, callback) {
  var messagePrefix = 'in Redis.getPhotosWithUser, ';
  var self = this;
  var req = params.req;
  if (!params.photoIds){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoIds'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var photoIds = params.photoIds;
  var photoFields = params.photoFields;
  var userFields = params.userFields;
  var needPrimaryPhoto = params.needPrimaryPhoto;
  var primaryPhotoFields = params.primaryPhotoFields;
  var userIdToCheckAlreadyLikedPhoto = params.userIdToCheckAlreadyLikedPhoto;
  self.getPhotos({req:req,photoIds:photoIds,photoFields:photoFields,
  userIdToCheckAlreadyLikedPhoto:userIdToCheckAlreadyLikedPhoto}, function(err,photos){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (!photos || photos.length == 0){
      if (callback) return callback(null, null);
      return;
    }
    var userIdSet = {};
    for(var i=0; i<photos.length; i++){
      var photo = photos[i];
      var userId = photo.userId;
      userIdSet[userId] = userId;
    }
    var userIds = [];
    for(idx in userIdSet){
      userIds.push(userIdSet[idx]);
    }
    self.getUsers({req:req,userIds:userIds,userFields:userFields,needPhotoCount:false,getSelf:false,
      needPrimaryPhoto:needPrimaryPhoto,primaryPhotoFields:primaryPhotoFields}, function(err,users){
        if (err){
          if (callback) return callback(err);
          else return self.handleError({err:err});
        }
        shuffle.bindPhotoWithUser({photos:photos,users:users});
        if (callback) return callback(null, photos);
        return;
    });//getUsers
  });//getPhotos
};//getPhotosWithUser

/**
*
* @param {Object} params - contains userId, getSelf, count, cutOffTime(optional)
* @param {Function} callback - is function(err,photoIds)
*/
Redis.prototype.getUserPhotoIds = function(params, callback) {
  var messagePrefix = 'in Redis.getUserPhotoIds, ';
  var self = this;
  var req = params.req;
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (params.getSelf == null){
    var err = self.newError({errorKey:'needParameter',messageParams:['getSelf'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if ( !(params.count != null && params.count > 0) ){
    var err = self.newError({errorKey:'needParameter',messageParams:['count > 0'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var userId = params.userId;
  var getSelf = params.getSelf;

  var getUserPhotoIdsKey = null;
  var userPhotosKey = 'user:'+userId+':photos';
  //var userAuditPassedPhotosKey = 'user:'+userId+':auditPassedPhotos';
  getUserPhotoIdsKey = userPhotosKey;
//  if (getSelf){
//    getUserPhotoIdsKey = userPhotosKey;
//  }else{
//    getUserPhotoIdsKey = userAuditPassedPhotosKey;
//  }

  var lparams = tool.cloneObject(params);
  delete lparams.userId;
  delete lparams.getSelf;
  lparams.zsetKey = getUserPhotoIdsKey;
  lparams.req = req;
  self.getValuesOnSortedSetByTime(lparams, function(err,valueAndScoreData){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (!valueAndScoreData) {
      if (callback) return callback(null,null);
      else return ;
    }
    var photoIds = valueAndScoreData.values;

    if (!photoIds || photoIds.length == 0)
      photoIds = null;

    if (callback) return callback(null,photoIds);
    else return ;
  });//getValuesOnSortedSetByTime
};//getUserPhotoIds

/**
*
* @param {Object} params - contains userId, getSelf, count, cutOffTime(optional),
*   photoFields(optional), userIdToCheckAlreadyLikedPhoto(optional)
* @param {Function} callback - is function(err,photos)
*/
Redis.prototype.getUserPhotos = function(params, callback) {
  var messagePrefix = 'in Redis.getUserPhotos, ';
  var self = this;
  var req = params.req;
  var photoFields = params.photoFields;
  var userIdToCheckAlreadyLikedPhoto = params.userIdToCheckAlreadyLikedPhoto;
  self.getUserPhotoIds(params, function(err,photoIds){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (!photoIds || photoIds.length == 0){
      if (callback) return callback(null, null);
      return;
    }
    self.getPhotos({req:req,photoIds:photoIds,
    photoFields:photoFields,userIdToCheckAlreadyLikedPhoto:userIdToCheckAlreadyLikedPhoto}, function(err,photos){
      if (err){
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      if (!photos || photos.length == 0){
        if (callback) return callback(null, null);
        return;
      }
      if (callback) return callback(null, photos);
      return;
    });//getPhotos
  });//getUserPhotoIds
};//getUserPhotos

/**
 * with some business.
 * the photo state should only be auditPassed and should be checked outside.
 *
 * @param {Object} params - contains userId, photoId, type=like|unlike,likeCount, photoOwnerId
 *   likeCount is previous like count of photo
 * @param {Function} callback - is function(err,likeInfo)
 *   likeInfo contains photoLikeCount(current),userLikeCount(current),
 */
Redis.prototype.likePhoto = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.likePhoto, ';
  var req = params.req;

  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.photoId){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.type){
    var err = self.newError({errorKey:'needParameter',messageParams:['type'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (params.likeCount == null){
    var err = self.newError({errorKey:'needParameter',messageParams:['likeCount'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.photoOwnerId){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoOwnerId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }

  var userId = params.userId;
  var photoId = params.photoId;
  var type = params.type;
  var likeCount = params.likeCount;
  var photoOwnerId = params.photoOwnerId;

  likeCount = Number(likeCount);
  var delta = 1;
  if (type == 'unlike'){
    delta = -1;
  }
  var photoKey = 'photo:'+photoId;
  var likePhotoKey = 'like:photo:'+photoId;
  var photoOwnerUserKey = 'user:'+photoOwnerId;
  var multi = self.client.multi();
  multi.hincrby(photoKey,'likeCount',delta);
  multi.hget(photoKey,'likeCount');
  multi.hincrby(photoOwnerUserKey,'likeCount',delta);
  multi.hget(photoOwnerUserKey,'likeCount');
  var semiCurrentLikeCount ;
  semiCurrentLikeCount = likeCount-0+delta;
  if (type == 'like'){
    multi.sadd(likePhotoKey,userId);
  }else if (type == 'unlike'){
    multi.srem(likePhotoKey,userId);
  }

  multi.exec(function(err,multiRetValues){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    //logger.logDebug("in Redis.likePhoto multi.exec, multiRetValues="+util.inspect(multiRetValues,false,100));
    var photoLikeCount = multiRetValues[1];
    var userLikeCount = multiRetValues[3];
    //TODO check photoLikeCount ==? semiCurrentLikeCount
    var outData = {photoLikeCount:photoLikeCount,userLikeCount:userLikeCount};
    if (callback) return callback(null,outData);
    return;
  });//multi.exec
};//likePhoto

/**
*
*
* redis data types:
*
* @param {Object} params - contains userId, photoId
* @param {Function} callback - is function(err,alreadyLiked)
*/
Redis.prototype.alreadyLikedPhoto = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.alreadyLikedPhoto, ';
  var req = params.req;
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.photoId){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var userId = params.userId;
  var photoId = params.photoId;
  var likePhotoKey = 'like:photo:'+photoId;
  var multi = self.client.multi();
  multi.sismember(likePhotoKey,userId);
  multi.exec(function(err,retData){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    var alreadyLiked = Boolean(retData[0]);
    if (callback) return callback(null,alreadyLiked);
    return;
  });//multi.exec
};//alreadyLikedPhoto

/**
 *
 *
 * redis data types:
 *
 * @param {Object} params - contains userId, targetUserId, type=follow|unfollow
 * @param {Function} callback - is function(err,userObj)
 */
Redis.prototype.followUser = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.followUser, ';
  var req = params.req;
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.targetUserId){
    var err = self.newError({errorKey:'needParameter',messageParams:['targetUserId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.type){
    var err = self.newError({errorKey:'needParameter',messageParams:['type'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var userId = params.userId;
  var targetUserId = params.targetUserId;
  var type = params.type;
  var delta = 1;
  if (type == 'unfollow'){
    delta = -1;
  }
  var userKey = 'user:'+userId;
  var targetUserKey = 'user:'+targetUserId;
  var followingKey = 'following:user:'+userId;
  var followerKey = 'follower:user:'+targetUserId;
  var allPossibleFollowerKey = 'allPossibleFollower:user:'+targetUserId;
  var multi = self.client.multi();
  multi.hincrby(userKey,'followingCount',delta);
  multi.hincrby(targetUserKey,'followerCount',delta);
  if (type == 'follow'){
    multi.sadd(followingKey,targetUserId);
    multi.sadd(followerKey,userId);
    multi.sadd(allPossibleFollowerKey,userId);
  }else if (type == 'unfollow'){
    multi.srem(followingKey,targetUserId);
    multi.srem(followerKey,userId);
  }
  multi.exec(function(err){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    if (callback) return callback(null);
    return;
  });//multi.exec
};//followUser






















/**
*
*
* @param {Object} params - contains region(usually be cityLocation),
*   photoStateType(created|auditPassed|auditDenied), getDataDirection(fromEarlyToLate | fromLateToEarly),
*   startPhotoTime, endPhotoTime, (here use photo.createTime)
*     when getDataDirection==fromEarlyToLate, should startPhotoTime<=endPhotoTime;
*     when getDataDirection==fromLateToEarly, should startPhotoTime>=endPhotoTime.
*     startPhotoTime is included, endPhotoTime is not included.
*     startPhotoTime and endPhotoTime can be null, it means positive infinite or negative infinite according to the context.
*   offset, count,
*   photoFields
* @param {Function} callback - is function(err,photosInfo)
*   photosInfo contains photos, totalCount
*/
Redis.prototype.getRegionalStatePhotos = function(params, callback) {
  var messagePrefix = 'in Redis.getRegionalStatePhotoIds, ';
  var self = this;
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.region){
    var err = self.newError({errorKey:'needParameter',messageParams:['region'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.photoStateType){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoStateType'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.getDataDirection){
    var err = self.newError({errorKey:'needParameter',messageParams:['getDataDirection'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if ( !(params.offset != null) ){
    var err = self.newError({errorKey:'needParameter',messageParams:['offset'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if ( !(params.count != null && params.count > 0) ){
    var err = self.newError({errorKey:'needParameter',messageParams:['count > 0'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var region = params.region;
  var photoStateType = params.photoStateType;
  var getDataDirection = params.getDataDirection;
  var startPhotoTime = params.startPhotoTime;
  var endPhotoTime = params.endPhotoTime;
  var offset = parseInt(params.offset);
  var count = parseInt(params.count);
  var photoFields = params.photoFields;

  var getRegionalStatePhotosKey;
  var regionCreatedPhotosKey = 'region:'+region+':createdPhotos';
//  var regionAuditPassedPhotosKey = 'region:'+region+':auditPassedPhotos';
//  var regionAuditDeniedPhotosKey = 'region:'+region+':auditDeniedPhotos';
  if (photoStateType == 'created'){
    getRegionalStatePhotosKey = regionCreatedPhotosKey;
  }
//  else if (photoStateType == 'auditPassed'){
//    getRegionalStatePhotosKey = regionAuditPassedPhotosKey;
//  }else if (photoStateType == 'auditDenied'){
//    getRegionalStatePhotosKey = regionAuditDeniedPhotosKey;
//  }
  else{
    getRegionalStatePhotosKey = regionCreatedPhotosKey;
  }
  var multi = self.client.multi();

  if(getDataDirection=='fromLateToEarly'){
    if (startPhotoTime && endPhotoTime){
      if (Number(startPhotoTime) < Number(endPhotoTime)){
        var err = self.newError({errorKey:'simpleError',messageParams:[],messagePrefix:messagePrefix,req:req,message:'need startPhotoTime >= endPhotoTime'});
        return callback(err);
      }
    }
    if(!startPhotoTime) startPhotoTime = '+inf';
    if(!endPhotoTime) endPhotoTime = '-inf';
    else endPhotoTime = '('+endPhotoTime;//not included
    multi.zcount(getRegionalStatePhotosKey,endPhotoTime,startPhotoTime);
    multi.zrevrangebyscore(getRegionalStatePhotosKey,startPhotoTime,endPhotoTime,'LIMIT',offset,count);
  }else{//getDataDirection be fromEarlyToLate
    if (startPhotoTime && endPhotoTime){
      if (Number(startPhotoTime) > Number(endPhotoTime)){
        var err = self.newError({errorKey:'simpleError',messageParams:[],messagePrefix:messagePrefix,req:req,message:'need startPhotoTime <= endPhotoTime'});
        return callback(err);
      }
    }
    if(!startPhotoTime) startPhotoTime = '-inf';
    if(!endPhotoTime) endPhotoTime = '+inf';
    else endPhotoTime = '('+endPhotoTime;//not included
    multi.zcount(getRegionalStatePhotosKey,startPhotoTime,endPhotoTime);
    multi.zrangebyscore(getRegionalStatePhotosKey,startPhotoTime,endPhotoTime,'LIMIT',offset,count);
    //console.log("in Redis.getRegionalStatePhotos, zrangebyscore, getRegionalStatePhotosKey="+getRegionalStatePhotosKey+",startPhotoTime="+startPhotoTime+",endPhotoTime="+endPhotoTime+",offset="+offset+",count="+count);
  }//if(getDataDirection

  multi.exec(function(err,multiRetData){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      return callback(err2);
    }
    var totalCount = multiRetData[0];
    var photoIds = multiRetData[1];
    var outData = {totalCount:totalCount};
    if (!photoIds || photoIds.length==0){
      return callback(null,outData);
    }
    self.getPhotos({req:req,photoIds:photoIds,photoFields:photoFields}, function(err,photos){
      if (err) return callback(err);
      outData.photos = photos;
      return callback(null,outData);
    });//getPhotos
  });//multi.exec
  return;
};//getRegionalStatePhotos


/**
 *
 * @param {Object} params - contains needCreatedPhotoCount(optional)
 * @param {Function} callback - is function(err,regionsInfo)
 *   regionsInfo contains regions, regionsCreatedPhotoCount
 */
Redis.prototype.getRegions = function(params, callback){
  var self = this;
  var messagePrefix = 'in Redis.getRegions, ';
  var req = params.req;
  var needCreatedPhotoCount = params.needCreatedPhotoCount;
  var regionKey = 'region';
  var multi = self.client.multi();
  multi.smembers(regionKey);
  multi.exec(function(err,multiRetData){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    var regions = multiRetData[0];
    if (!regions || regions.length == 0){
      if (callback) return callback(null,null);
      return;
    }
    if (!needCreatedPhotoCount){
      if (callback) return callback(null,{regions:regions});
      return;
    }
    var multi2 = self.client.multi();
    for(var i=0; i<regions.length; i++){
      var region = regions[i];
      var regionCreatedPhotosKey = 'region:'+region+':createdPhotos';
      multi2.zcard(regionCreatedPhotosKey);
    }//for
    multi2.exec(function(err,multi2RetData){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        if (callback) return callback(err2);
        else return self.handleError({err:err2});
      }
      var regionsCreatedPhotoCount = multi2RetData;
      if (callback) return callback(null,{regions:regions,regionsCreatedPhotoCount:regionsCreatedPhotoCount});
      return;
    });//multi2.exec
    return;
  });//multi.exec
  return;
};//getRegions



/**
 * simply create
 *
 * redis data types:
 *
 * @param {Object} params - contains reporterId,reporteeId,description
 * @param {Function} callback - is function(err,reportObj)
 */
Redis.prototype.createReport = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.createReport, ';
  var req = params.req;
  if (!params.reporterId){
    var err = self.newError({errorKey:'needParameter',messageParams:['reporterId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.reporteeId){
    var err = self.newError({errorKey:'needParameter',messageParams:['reporteeId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.description){
    var err = self.newError({errorKey:'needParameter',messageParams:['description'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var reporterId = params.reporterId;
  var reporteeId = params.reporteeId;
  var description = params.description;
  var createTime = handy.getNowOfUTCdate().getTime();
  self.client.incr('report', function(err, newId) {
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    var reportId = newId+'';
    var reportKey = 'report:'+reportId;
    var reportObj = {reportId:reportId, reporterId:reporterId, reporteeId:reporteeId, description:description, createTime:createTime+''};
    var paramsReport = handy.toArray(reportKey,reportObj);
    var multi = self.client.multi();
    multi.hmset(paramsReport);
    multi.exec(function(err){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        if (callback) return callback(err2);
        else return self.handleError({err:err2});
      }
      if (callback) return callback(null, reportObj);
      return;
    });//multi.exec
  });//client.incr
};//createReport



/**
 *
 * @param {Object} params - contains senderId, latlng, region, geolibType, dateDate, address, whoPay, wantPersonCount,
 *   title, description, photoId, userGender, userBeMade.
 * @param {Function} callback - is function(err,dateObj)
 */
Redis.prototype.createDate = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.createDate, ';
  var req = params.req;
  if (!params.senderId){
    var err = self.newError({errorKey:'needParameter',messageParams:['senderId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
//  if (!params.latlng){
//    var err = self.newError({errorKey:'needParameter',messageParams:['latlng'],messagePrefix:messagePrefix,req:req});
//    if (callback) return callback(err);
//    else return self.handleError({err:err});
//  }
//  if (!params.region){
//    var err = self.newError({errorKey:'needParameter',messageParams:['region'],messagePrefix:messagePrefix,req:req});
//    if (callback) return callback(err);
//    else return self.handleError({err:err});
//  }
//  if (!params.geolibType){
//    var err = self.newError({errorKey:'needParameter',messageParams:['geolibType'],messagePrefix:messagePrefix,req:req});
//    if (callback) return callback(err);
//    else return self.handleError({err:err});
//  }
  if (!params.dateDate){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateDate'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.address){
    var err = self.newError({errorKey:'needParameter',messageParams:['address'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (params.whoPay == null){
    var err = self.newError({errorKey:'needParameter',messageParams:['whoPay'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.wantPersonCount){
    var err = self.newError({errorKey:'needParameter',messageParams:['wantPersonCount'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.existPersonCount){
    var err = self.newError({errorKey:'needParameter',messageParams:['existPersonCount'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.title){
    var err = self.newError({errorKey:'needParameter',messageParams:['title'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.description){
    var err = self.newError({errorKey:'needParameter',messageParams:['description'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.userGender){
    var err = self.newError({errorKey:'needParameter',messageParams:['userGender'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.school){
    var err = self.newError({errorKey:'needParameter',messageParams:['school'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }

  var senderId = params.senderId;
//  var latlng = params.latlng;
//  var region = params.region;
//  var geolibType = params.geolibType;
  var dateDate = params.dateDate;
  var address = params.address;
  var whoPay = params.whoPay;
  var wantPersonCount = params.wantPersonCount;
  var existPersonCount = params.existPersonCount;
  var title = params.title;
  var description = params.description;
  var photoId = params.photoId;
  var userGender = params.userGender;
  var school = params.school;
  var userBeMade = params.userBeMade;
  var createTime = handy.getNowOfUTCdate().getTime()+'';

//  var regionInfo = handy.getCentainLevelRegion({region:region,geolibType:geolibType,regionLevel:4});
//  if (regionInfo.err){
//    return self.handleError({err:regionInfo.err});
//  }
//  var regionJSONstr = JSON.stringify(regionInfo.regionObj);
//  var countyLocation = regionInfo.centainLevelRegion;
//  var regionInfo2 = handy.getCentainLevelRegion({regions:regionInfo.regions,regionLevel:3});
//  var cityLocation = regionInfo2.centainLevelRegion;

  self.client.incr('date', function(err, newId) {
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    var dateId = newId+'';
    var orderScore = shuffle.generateDateDateScore({dateInMs:dateDate, lowSeqPart:senderId});
    var dateKey = 'date:'+dateId;
    var dateObj = {dateId:dateId, senderId:senderId, createTime:createTime,
            //region:regionJSONstr, geolibType:geolibType, countyLocation:countyLocation,
            dateDate:dateDate, address:address, whoPay:whoPay, wantPersonCount:wantPersonCount, existPersonCount:existPersonCount,
            title:title, description:description};
    if (photoId) dateObj.photoId = photoId;
    var paramsDate = handy.toArray(dateKey,dateObj);
    var userDatesKey = 'user:'+senderId+':dates';
    var userActiveSendDatesKey = 'user:'+senderId+':activeSendDates';
    var userDateKey = 'user:'+senderId+':date:'+dateId;
    var userDateObj = {userId:senderId, dateId:dateId, type:'send', createTime:createTime};
    var paramsUserDate = handy.toArray(userDateKey,userDateObj);
    var multi = self.client.multi();
    multi.hmset(paramsDate);
    multi.zadd(userDatesKey,orderScore,dateId);//to be noticed here can not use createTime
    multi.zadd(userActiveSendDatesKey,userDateObj.createTime,dateId);
    multi.hmset(paramsUserDate);
    if (userBeMade){
      var madeDatesKey = 'madeDates:' + userGender;
      multi.zadd(madeDatesKey,dateObj.createTime,dateId);
    }
    //var schoolDatesGivenGenderKey = 'school:'+schoolId+':dates:'+userGender;
    //multi.zadd(schoolDatesGivenGenderKey,orderScore,dateId);
    var schoolDatesKey = 'school:'+school+':dates:all';
    multi.zadd(schoolDatesKey,orderScore,dateId);
    var allDatesKey = 'alldates:all';
    multi.zadd(allDatesKey,orderScore,dateId);

    multi.exec(function(err){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        if (callback) return callback(err2);
        else return self.handleError({err:err2});
      }
      if (callback) return callback(null, dateObj);
      return;
    });//multi.exec
  });//client.incr
};//createDate


/**
 *
 * @param {Object} params - contains dateId,senderId,receiverIds,dateDate,
 * @param {Function} callback - is function(err)
 */
Redis.prototype.sendDateByReceiverIds = function(params, callback) {
  //logger.logDebug("Redis.sendDateByReceiverIds entered, params="+util.inspect(params,false,100));
  var self = this;
  var messagePrefix = 'in Redis.sendDateByReceiverIds, ';
  var req = params.req;
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
  if (!params.receiverIds || params.receiverIds.length == 0){
    var err = self.newError({errorKey:'needParameter',messageParams:['receiverIds'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.dateDate){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateDate'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var dateId = params.dateId;
  var senderId = params.senderId;
  var dateDate = params.dateDate;
  var receiverIds = params.receiverIds;
  var createTime = handy.getNowOfUTCdate().getTime()+"";
  var dateReceiversKey = 'date:'+dateId+':receivers';
  var orderScore = shuffle.generateDateDateScore({dateInMs:dateDate, lowSeqPart:senderId});
  var multi = self.client.multi();
  var sendUserActiveDatesKey = 'user:'+senderId+':activeDates';
  multi.zadd(sendUserActiveDatesKey,createTime,dateId);
  for(var i=0; i<receiverIds.length; i++){
    var receiverId = receiverIds[i];
    var userDatesKey = 'user:'+receiverId+':dates';
    var userReceiveDatesKey = 'user:'+receiverId+':receiveDates';
    var userActiveDatesKey = 'user:'+receiverId+':activeDates';
    var userDateKey = 'user:'+receiverId+':date:'+dateId;
    var userDateObj = {userId:receiverId, dateId:dateId, type:'receive', createTime:createTime};
    var paramsUserDate = handy.toArray(userDateKey,userDateObj);
    multi.sadd(dateReceiversKey,receiverId);
    multi.zadd(userDatesKey,orderScore,dateId);
    multi.zadd(userReceiveDatesKey,orderScore,dateId);
    multi.zadd(userActiveDatesKey,userDateObj.createTime,dateId);
    multi.hmset(paramsUserDate);
  }
  multi.exec(function(err){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    if (callback) return callback(null);
    return;
  });//multi.exec
};//sendDateByReceiverIds


/**
 *
 *
 * redis data types:
 *
 *
 * @param {Object} params - contains dateId,receiverId
 *
 * @param {Function} callback - is function(err,alreadySent)
 */
Redis.prototype.alreadySendDate = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.alreadySendDate, ';
  var req = params.req;
  if (!params.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.receiverId){
    var err = self.newError({errorKey:'needParameter',messageParams:['receiverId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var dateId = params.dateId;
  var receiverId = params.receiverId;
  var dateReceiversKey = 'date:'+dateId+':receivers';
  var multi = self.client.multi();
  multi.sismember(dateReceiversKey,receiverId);
  multi.exec(function(err,retData){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    var alreadySent = Boolean(retData[0]);
    if (callback) return callback(null,alreadySent);
    return;
  });//multi.exec
};//alreadySendDate

/**
 * TODO find NOT REPEAT receiver, and improve Performance
 * already exclude self
 * redis data types:
 *
 *
 * @param {Object} params - contains userId,dateId,cityLocation,count(=-1 means all), targetGender
 *
 * @param {Function} callback - is function(err,userIds)
 */
Redis.prototype.findDateNewReceiverIds = function(params, callback) {
  //logger.logDebug("Redis.findDateNewReceiverIds entered, params="+util.inspect(params,false,100));
  var self = this;
  var messagePrefix = 'in Redis.findDateNewReceiverIds, ';
  var req = params.req;
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.cityLocation){
    var err = self.newError({errorKey:'needParameter',messageParams:['cityLocation'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.targetGender){
    var err = self.newError({errorKey:'needParameter',messageParams:['targetGender'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var userId = params.userId;
  var dateId = params.dateId;
  var cityLocation = params.cityLocation;
  var targetGender = params.targetGender;
  var count = parseInt(params.count);
  if (count == 0){
    if (callback) return callback(null,null);
    return;
  }
  var regionNormalUsersKey = 'region:'+cityLocation+':normalUsers:'+targetGender;
  var dateReceiversKey = 'date:'+dateId+':receivers';
  var multi = self.client.multi();
  //multi.sdif(regionNormalUsersKey,dateReceiversKey);
  multi.zrevrange(regionNormalUsersKey,0,-1);
  multi.smembers(dateReceiversKey);
  multi.exec(function(err, retData){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    var regionUserIds = retData[0];
    var dateReceiverIds = retData[1];
    var newUserIds = handy.doDiffArray({arrayLeft:regionUserIds,arrayRight:dateReceiverIds});
    if (!newUserIds || newUserIds.length == 0){
      if (callback) return callback(null,null);
      return;
    }
    var retUserIds = [];
    //to exclude self
    for(var i=0; i<newUserIds.length; i++){
      var userId2 = newUserIds[i];
      if (userId2 != userId){
        retUserIds.push(userId2);
        if (count > 0 && retUserIds.length >= count){
          break;
        }
      }
    }
    if (callback) return callback(null,retUserIds);
    return;
  });//multi.exec
};//findDateNewReceiverIds








/**
*
*
* @param {Object} params - contains gender, count
* @param {Function} callback - is function(err,dateIdAndScoreData)
*   dateIdAndScoreData contains dateIds, scores
*/
Redis.prototype.getMadeDateIdsD = function(params, callback) {
  var messagePrefix = 'in Redis.getMadeDateIds, ';
  var self = this;
  if (!params.gender){
    var err = self.newError({errorKey:'needParameter',messageParams:['gender'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var gender = params.gender;
  var madeDatesKey = "madeDates:"+gender;
  var paramsSub = tool.cloneObject(params);
  delete paramsSub.gender;
  paramsSub.zsetKey = madeDatesKey;
  self.getDateIdsOnZset(paramsSub,function(err,dateIdAndScoreData){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (callback) callback(null, dateIdAndScoreData);
    return;
  });//getDateIdsOnZset
};//getMadeDateIds


/**
*
*
* @param {Object} params - contains userId, dateType(onlyActiveSend|applying|invited),
*   count, cutOffTime(optional), start(optional),
*   getDataDirection(optional, fromEarlyToLate | fromLateToEarly, default be fromLateToEarly),
*   excludeExpired.
*     here only 1 combination for excludeExpired=true when getDataDirection==fromEarlyToLate && cutOffTime==null.
* @param {Function} callback - is function(err,dateIdAndScoreData)
*   dateIdAndScoreData contains dateIds, scores
*/
Redis.prototype.getUserDateIds = function(params, callback) {
  var messagePrefix = 'in Redis.getUserDateIds, ';
  var self = this;
  var req = params.req;
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.dateType){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateType'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }

  var userId = params.userId;
  var dateType = params.dateType;

  var getUserDatesKey;
  var userActiveSendDatesKey = 'user:'+userId+':activeSendDates';
//  var userActiveRespondDatesKey = 'user:'+userId+':activeRespondDates';
  var userActiveApplyingDatesKey = "user:"+userId+":activeApplyingDates";
//  //var userScheduleDatesKey = 'user:'+userId+':scheduleDates';
  var userInvitedDatesKey = 'user:'+userId+':invitedDates';
  if (dateType == 'onlyActiveSend'){
    getUserDatesKey = userActiveSendDatesKey;
  }else if (dateType == 'applying'){
    getUserDatesKey = userActiveApplyingDatesKey;
  }
//  else if (dateType == 'schedule'){
//    getUserDatesKey = userScheduleDatesKey;
//  }
  else if (dateType == 'invited'){
    getUserDatesKey = userInvitedDatesKey;
  }else{//err
    var err = self.newError({errorKey:'unsupportedValueForParam',messageParams:[dateType,'dateType'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var paramsSub = tool.cloneObject(params);
  delete paramsSub.userId;
  delete paramsSub.dateType;
  paramsSub.zsetKey = getUserDatesKey;
  self.getDateIdsOnZset(paramsSub,function(err,dateIdAndScoreData){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (callback) callback(null, dateIdAndScoreData);
    return;
  });//getDateIdsOnZset
};//getUserDateIds


/**
*
*
* @param {Object} params - contains school, gender,
*   count, cutOffTime(optional), start(optional),
*   getDataDirection(optional, fromEarlyToLate | fromLateToEarly, default be fromLateToEarly),
*   excludeExpired, scoreBeInflectionTime
*     here only 1 combination for excludeExpired=true when getDataDirection==fromEarlyToLate && cutOffTime==null.
* @param {Function} callback - is function(err,dateIdAndScoreData)
*   dateIdAndScoreData contains dateIds, scores
*/
Redis.prototype.getSchoolDateIds = function(params, callback) {
  var messagePrefix = 'in Redis.getSchoolDateIds, ';
  var self = this;
  var req = params.req;
//  if (!params.schoolId){
//    var err = self.newError({errorKey:'needParameter',messageParams:['schoolId'],messagePrefix:messagePrefix,req:req});
//    if (callback) return callback(err);
//    else return self.handleError({err:err});
//  }
//  if (!params.gender){
//    var err = self.newError({errorKey:'needParameter',messageParams:['gender'],messagePrefix:messagePrefix,req:req});
//    if (callback) return callback(err);
//    else return self.handleError({err:err});
//  }
  var school = params.school;
  var gender = params.gender;
  var paramsSub = tool.cloneObject(params);
  delete paramsSub.schoolId;
  delete paramsSub.gender;
  if (school){
    var schoolDatesKey = 'school:'+school+':dates:all';
    if (gender) schoolDatesKey = 'school:'+school+':dates:'+gender;
    paramsSub.zsetKey = schoolDatesKey;
  }else{
    var allDatesKey = 'alldates:all';
    paramsSub.zsetKey = allDatesKey;
  }

  self.getDateIdsOnZset(paramsSub,function(err,dateIdAndScoreData){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (callback) callback(null, dateIdAndScoreData);
    return;
  });//getDateIdsOnZset
};//getSchoolDateIds


/**
*
* @param {Object} params - contains school, gender,
*   count, cutOffTime(optional), start(optional),
*   getDataDirection(optional, fromEarlyToLate | fromLateToEarly, default be fromLateToEarly),
*   excludeExpired,scoreBeInflectionTime.
*     here only 1 combination for excludeExpired=true when getDataDirection==fromEarlyToLate && cutOffTime==null.
*
*   dateFields(optional), needPhoto(optional),
*   needSender(optional), sendUserFields(optional), needDateResponderCount(optional),
*   needResponders(optional), responderFields(optional),responderUserFields(optional),
*   needRespondTime(optional),
*   needLatestMessage(optional), messageFields(optional),
*   needPrimaryPhoto,primaryPhotoFields
*
* @param {Function} callback - is function(err,dates)
*/
Redis.prototype.getSchoolDates = function(params, callback) {
  var messagePrefix = 'in Redis.getSchoolDates, ';
  var self = this;
  var req = params.req;
  var paramsGetDateIds = {req:req,school:params.school, gender:params.gender,
      count:params.count, cutOffTime:params.cutOffTime, start:params.start,
      getDataDirection:params.getDataDirection, excludeExpired:params.excludeExpired,
      scoreBeInflectionTime:params.scoreBeInflectionTime};
  self.getSchoolDateIds(paramsGetDateIds, function(err,dateIdAndScoreData){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }

    //logger.logDebug("in Redis.getSchoolDates , dateIds="+util.inspect(dateIds,false,100));
    if (!dateIdAndScoreData){
      if (callback) return callback(null,null);
      return;
    }
    var dateIds = dateIdAndScoreData.dateIds;
    var scores = dateIdAndScoreData.scores;
    if (!dateIds || dateIds.length == 0){
      if (callback) return callback(null,null);
      return;
    }

    var getDatesWithDetailParams = tool.cloneObject(params);
    getDatesWithDetailParams.dateIds = dateIds;
    delete getDatesWithDetailParams.school;
    delete getDatesWithDetailParams.gender;
    delete getDatesWithDetailParams.count;
    delete getDatesWithDetailParams.cutOffTime;
    delete getDatesWithDetailParams.start;
    delete getDatesWithDetailParams.getDataDirection;
    delete getDatesWithDetailParams.excludeExpired;
    self.getDatesWithDetail(getDatesWithDetailParams, function(err,dates){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        if (callback) return callback(err2);
        else return self.handleError({err:err2});
      }
      shuffle.bindDateAndScore({dates:dates,scores:scores});
      if (callback) return callback(null,dates);
      return;
    });//getDatesWithDetail
  });//getSchoolDateIds
};//getSchoolDates



/**
*
*
* @param {Object} params - contains zsetKey, count, cutOffTime(optional), start(optional),
*   getDataDirection(optional, fromEarlyToLate | fromLateToEarly, default be fromLateToEarly),
*   excludeExpired, scoreBeInflectionTime.
*     here only 1 combination for excludeExpired=true when getDataDirection==fromEarlyToLate && cutOffTime==null.
* @param {Function} callback - is function(err,dateIdAndScoreData)
*   dateIdAndScoreData contains dateIds, scores
*/
Redis.prototype.getDateIdsOnZset = function(params, callback) {
  var self = this;
  var req = params.req;
  self.getValuesOnSortedSetByTime(params, function(err,valueAndScoreData){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (!valueAndScoreData) {
      if (callback) return callback(null,null);
      else return ;
    }
    var dateIds = valueAndScoreData.values;
    var scores = valueAndScoreData.scores;
    if (callback) return callback(null,{dateIds:dateIds,scores:scores});
    else return ;
  });//getValuesOnSortedSetByTime
};//getDateIdsOnZset





/**
*
*
* @param {Object} params - contains zsetKey, count, cutOffTime(optional), start(optional),
*   getDataDirection(optional, fromEarlyToLate | fromLateToEarly, default be fromLateToEarly),
*   excludeExpired, scoreBeInflectionTime.
*     here only 1 combination for excludeExpired=true when getDataDirection==fromEarlyToLate && cutOffTime==null.
* @param {Function} callback - is function(err,valueAndScoreData)
*   valueAndScoreData contains values, scores
*/
Redis.prototype.getValuesOnSortedSetByTime = function(params, callback) {
  var messagePrefix = 'in Redis.getValuesOnSortedSetByTime, ';
  var self = this;
  var req = params.req;
  if (!params.zsetKey){
    var err = self.newError({errorKey:'needParameter',messageParams:['zsetKey'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if ( !(params.count != null && params.count > 0) ){
    var err = self.newError({errorKey:'needParameter',messageParams:['count > 0'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var zsetKey = params.zsetKey;
  var count = params.count;
  var cutOffTime = params.cutOffTime;
  var start = params.start;
  var getDataDirection = params.getDataDirection;
  var excludeExpired = params.excludeExpired;
  var scoreBeInflectionTime = params.scoreBeInflectionTime;

  var count = parseInt(params.count);
  if (!start) start = 0;
  var directionFromLateToEarly = true;
  if (getDataDirection == 'fromEarlyToLate')
    directionFromLateToEarly = false;
  if (cutOffTime == null){
    if (!directionFromLateToEarly && excludeExpired){
      var nowTime = handy.getNowOfUTCdate().getTime();
      var score;
      if (scoreBeInflectionTime) score = shuffle.generateDateDateScore({dateInMs:nowTime, lowSeqPart:0});
      else score = nowTime;
      cutOffTime = score;
    }
  }

  function parseValuesAndScores(valueAndScoreData){
    if (!valueAndScoreData || valueAndScoreData.length == 0){
      return null;
    }
    var values = [], scores = [];
    for(var i=0; i<valueAndScoreData.length; i+=2){
      var value = valueAndScoreData[i];
      var score = valueAndScoreData[i+1];
      values.push(value);
      scores.push(score);
    }//for
    return {values:values,scores:scores};
  };//parseValuesAndScores

  if (cutOffTime == null){
    //just get the most recent
    var startIdx = start;
    var stopIdx = startIdx + count - 1;
    var redisFunZrangeOrRev = null;
    if (directionFromLateToEarly){//from late to early
      redisFunZrangeOrRev = self.client.zrevrange;
    }else{
      redisFunZrangeOrRev = self.client.zrange;
    }
    redisFunZrangeOrRev.call(self.client,zsetKey,startIdx,stopIdx,'WITHSCORES',function(err,valueAndScoreData){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        if (callback) return callback(err2);
        else return self.handleError({err:err2});
      }
      var valuesAndScores = parseValuesAndScores(valueAndScoreData);
      if (callback) callback(null, valuesAndScores);
      return;
    });//redisFunZrangeOrRev.call
    return;
  }//if (cutOffTime == null)
  //cutOffTime != null
  //get from cutOffTime to earlier
  var getScore = cutOffTime+'';
  var getOffset = start;
  var getCount = count;//the caller will let cutOffTime dif 1ms to avoid repeated data
  if (directionFromLateToEarly){//from late to early
    self.client.zrevrangebyscore(zsetKey,getScore,'-inf','WITHSCORES','LIMIT',getOffset,getCount,function(err,valueAndScoreData){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        if (callback) return callback(err2);
        else return self.handleError({err:err2});
      }
      var valuesAndScores = parseValuesAndScores(valueAndScoreData);
      if (callback) callback(null, valuesAndScores);
      return;
    });//client.zrevrangebyscore
    return;
  }else{//fromEarlyToLate
    self.client.zrangebyscore(zsetKey,getScore,'+inf','WITHSCORES','LIMIT',getOffset,getCount,function(err,valueAndScoreData){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        if (callback) return callback(err2);
        else return self.handleError({err:err2});
      }
      //logger.logDebug("Redis.getUserDateIds getScore="+getScore+",directionFromLateToEarly="+directionFromLateToEarly+", valueAndScoreData="+util.inspect(valueAndScoreData,false,100));
      var valuesAndScores = parseValuesAndScores(valueAndScoreData);
      if (callback) callback(null, valuesAndScores);
      return;
    });//client.zrevrangebyscore
    return;
  }
  return;
};//getValuesOnSortedSetByTime







/**
*
*
* @param {Object} params - contains userId, count, cutOffTime(optional),
*     cutOffTime is orderScore in fact.
*   dateSortType(active,dateDate, default be active),
*   dateOwnerType(all|onlySend|onlyReceive, default be all),
*   dateConfirmType(all|doubleConfirm|notDoubleConfirm, default be all),
*     if dateConfirmType be doubleConfirm, it imply a compulsory condition that the user should be in the 2 daters.
*   getDataDirection(optional, fromEarlyToLate | fromLateToEarly, default be fromLateToEarly), excludeExpired
*     here only 1 combination for excludeExpired=true when getDataDirection==fromEarlyToLate && cutOffTime==null.
*
* @param {Function} callback - is function(err,dateIdAndScoreData)
*   dateIdAndScoreData contains dateIds, scores
*/
Redis.prototype.getUserDateIdsByFieldCompare = function(params, callback) {
  var messagePrefix = 'in Redis.getUserDateIdsByFieldCompare, ';
  var self = this;
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if ( !(params.count != null && params.count > 0) ){
    var err = self.newError({errorKey:'needParameter',messageParams:['count > 0'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var userId = params.userId;
  var count = parseInt(params.count);
  var cutOffTime = params.cutOffTime;
  var dateSortType = params.dateSortType;
  var dateOwnerType = params.dateOwnerType;
  var dateConfirmType = params.dateConfirmType;
  var getDataDirection = params.getDataDirection;
  var excludeExpired = params.excludeExpired;

  if (!dateOwnerType || dateOwnerType=='all') dateOwnerType = null;
  if (!dateConfirmType || dateConfirmType=='all') dateConfirmType = null;

  var directionFromLateToEarly = true;
  if (getDataDirection == 'fromEarlyToLate')
    directionFromLateToEarly = false;

  var getUserDatesKey;
  var userDatesKey = 'user:'+userId+':dates';
  var userActiveDatesKey = 'user:'+userId+':activeDates';
  if (dateSortType == 'dateDate'){
    getUserDatesKey = userDatesKey;
  }else{
    getUserDatesKey = userActiveDatesKey;
  }

  function parseDateIdsAndScores(dateIdAndScoreData){
    if (!dateIdAndScoreData || dateIdAndScoreData.length == 0){
      return null;
    }
    var dateIds = [], scores = [];
    for(var i=0; i<dateIdAndScoreData.length; i+=2){
      var dateId = dateIdAndScoreData[i];
      var score = dateIdAndScoreData[i+1];
      dateIds.push(dateId);
      scores.push(score);
    }//for
    return {dateIds:dateIds,scores:scores};
  };//parseDateIdsAndScores

  function getDataItemsForCount(dateIdsAndScoresData,count){
    if (!dateIdsAndScoresData || !dateIdsAndScoresData.dateIds || dateIdsAndScoresData.dateIds.length == 0) return null;
    if (dateIdsAndScoresData.dateIds.length <= count)  return dateIdsAndScoresData;
    var dateIds = dateIdsAndScoresData.dateIds.slice(0,count);
    var scores = dateIdsAndScoresData.scores.slice(0,count);
    return {dateIds:dateIds,scores:scores};
  };//getDataItemsForCount

  //TODO improve performance
  function getAllDateIds(cbFun){
    var getFromScore ;
    var getToScore ;
    //logger.logDebug("in Redis.getUserDateIdsByFieldCompare, getAllDateIds , directionFromLateToEarly="+util.inspect(directionFromLateToEarly,false,100));
    if (directionFromLateToEarly){//from late to early , get from cutOffTime to earlier
      if (!cutOffTime){
        getFromScore = '+inf';
      }else{
        getFromScore = cutOffTime + '';
      }
      getToScore = '-inf';
      if (excludeExpired){
        var nowUTCTime = handy.getNowOfUTCdate().getTime();
        if (dateSortType == 'dateDate'){
          getToScore = shuffle.generateDateDateScore({dateInMs:nowUTCTime, lowSeqPart:0});
        }else{
          getToScore = nowUTCTime+'';
        }
      }
      //logger.logDebug("in Redis.getUserDateIdsByFieldCompare, getAllDateIds zrevrangebyscore "+getUserDatesKey+" "+getFromScore+" "+getToScore+" WITHSCORES");
      self.client.zrevrangebyscore(getUserDatesKey,getFromScore,getToScore,'WITHSCORES',function(err,dateIdAndScoreData){
        if (err){
          var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
          return cbFun(err2);
        }
        //logger.logDebug("in Redis.getUserDateIdsByFieldCompare, getAllDateIds zrevrangebyscore, dateIdAndScoreData="+util.inspect(dateIdAndScoreData,false,100));
        var dateIdsAndScores = parseDateIdsAndScores(dateIdAndScoreData);
        return cbFun(null, dateIdsAndScores);
      });//client.zrevrangebyscore
      return;
    }else{//fromEarlyToLate
      if (!cutOffTime){
        getFromScore = '-inf';
      }else{
        getFromScore = cutOffTime + '';
      }
      if (excludeExpired){
        var nowUTCTime = handy.getNowOfUTCdate().getTime();
        if (dateSortType == 'dateDate'){
          nowUTCTimeScore = shuffle.generateDateDateScore({dateInMs:nowUTCTime, lowSeqPart:0});
        }else{
          nowUTCTimeScore = nowUTCTime+'';
        }
        if (!cutOffTime){
          getFromScore = nowUTCTimeScore;
        }else{
          if (Number(nowUTCTimeScore)>Number(cutOffTime)){
            getFromScore = nowUTCTimeScore;
          }
        }
      }//if (excludeExpired)

      getToScore = '+inf';
      self.client.zrangebyscore(getUserDatesKey,getFromScore,getToScore,'WITHSCORES',function(err,dateIdAndScoreData){
        if (err){
          var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
          return cbFun(err2);
        }
        var dateIdsAndScores = parseDateIdsAndScores(dateIdAndScoreData);
        return cbFun(null, dateIdsAndScores);
      });//client.zrevrangebyscore
      return;
    }
  };//getAllDateIds

  getAllDateIds(function(err,dateIdsAndScoresData){
    if (err) return callback(err);
    //logger.logDebug("in Redis.getUserDateIdsByFieldCompare, getAllDateIds callback, dateIdsAndScoresData="+util.inspect(dateIdsAndScoresData,false,100));
    if (!dateIdsAndScoresData || !dateIdsAndScoresData.dateIds || dateIdsAndScoresData.dateIds.length==0) return callback(null,null);
    if (!dateOwnerType && !dateConfirmType){//it means no filter
      var validDateIdsAndScoresData = getDataItemsForCount(dateIdsAndScoresData,count);
      return callback(null,validDateIdsAndScoresData);
    }
    self.getDates({req:req,dateIds:dateIdsAndScoresData.dateIds, dateFields:['dateId','senderId','doubleConfirmed','finalCandidateId']}, function(err,dates){
      if (err) return callback(err);
      var validDateIndexAry = [];
      for(var i=0; i<dates.length; i++){
        var date = dates[i];
        var userBeSender = (userId == date.senderId);
        if (dateOwnerType=='onlySend' && !userBeSender){
          continue;
        }else if(dateOwnerType=='onlyReceive' && userBeSender){
          continue;
        }
        var dateDoubleConfirmed = handy.convertToBool(date.doubleConfirmed);
        if (dateConfirmType=='doubleConfirm'){
          if (!dateDoubleConfirmed) continue;
          if ((userId != date.senderId) && (userId != date.finalCandidateId)) continue;
        }else if (dateConfirmType=='notDoubleConfirm'){
          if (dateDoubleConfirmed) continue;
          if (!userBeSender) continue;
        }
        validDateIndexAry.push(i);
      }//for
      if (validDateIndexAry.length==0) return callback(null,null);
      var retDateIndexAry = null;
      if (validDateIndexAry.length > count) retDateIndexAry = validDateIndexAry.slice(0,count);
      else retDateIndexAry = validDateIndexAry;;
      var validDateIds = [], validScores = [];
      for(i=0; i<retDateIndexAry.length; i++){
        var idx = retDateIndexAry[i];
        var dateId = dateIdsAndScoresData.dateIds[idx];
        var score = dateIdsAndScoresData.scores[idx];
        validDateIds.push(dateId);
        validScores.push(score);
      }//for
      var retDateIdsAndScoresData = {dateIds:validDateIds, scores:validScores};
      return callback(null,retDateIdsAndScoresData);
    });//getDates
  });//getAllDateIds
};//getUserDateIdsByFieldCompare



/**
*
* @param {Object} params - contains userId, count, cutOffTime(optional),
*     cutOffTime is orderScore in fact.
*   dateSortType(active,dateDate, default be active),
*   dateOwnerType(all|onlySend|onlyReceive, default be all),
*   dateConfirmType(all|doubleConfirm|notDoubleConfirm, default be all),
*   getDataDirection(optional, fromEarlyToLate | fromLateToEarly, default be fromLateToEarly), excludeExpired,
*
*   dateFields(optional), needPhoto(optional), needResponderAndSender(optional),
*   dateOwnerId(usually be self)(when date's sender not be this id, then need to get sendInfo), sendUserFields(optional),
*   responderFields(optional),responderUserFields(optional),
*   needLatestMessage(optional)(this requires responderFields contain latestMessageId...),messageFields(optional),
*   needPrimaryPhoto,primaryPhotoFields
* @param {Function} callback - is function(err,dates)
*/
Redis.prototype.getUserDatesWithDetailByFieldCompare = function(params, callback) {
  var messagePrefix = 'in Redis.getUserDatesWithDetailByFieldCompare, ';
  var self = this;
  var req = params.req;
  self.getUserDateIdsByFieldCompare(params, function(err,dateIdAndScoreData){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }

    //logger.logDebug("in Redis.getUserDatesWithDetailByFieldCompare , dateIdAndScoreData="+util.inspect(dateIdAndScoreData,false,100));
    if (!dateIdAndScoreData || !dateIdAndScoreData.dateIds || dateIdAndScoreData.dateIds.length==0){
      if (callback) return callback(null,null);
      return;
    }
    var dateIds = dateIdAndScoreData.dateIds;
    var scores = dateIdAndScoreData.scores;

    var getDatesWithDetailParams = tool.cloneObject(params);
    delete getDatesWithDetailParams.userId;
    delete getDatesWithDetailParams.count;
    delete getDatesWithDetailParams.cutOffTime;
    delete getDatesWithDetailParams.dateSortType;
    delete getDatesWithDetailParams.dateOwnerType;
    delete getDatesWithDetailParams.dateConfirmType;
    getDatesWithDetailParams.dateIds = dateIds;
    getDatesWithDetailParams.needRespondTime = true;//TODO as a param
    getDatesWithDetailParams.receiverId = params.userId;
    self.getDatesWithDetail(getDatesWithDetailParams, function(err,dates){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        if (callback) return callback(err2);
        else return self.handleError({err:err2});
      }
      shuffle.bindDateAndScore({dates:dates,scores:scores});
      if (callback) return callback(null,dates);
      return;
    });//getDatesWithDetail
  });//getUserDateIdsByFieldCompare
};//getUserDatesWithDetailByFieldCompare




/**
*
*
* redis data types:
*
*
* @param {Object} params - contains dateId, dateFields(optional),
*   needResponderIds(optional), dateOwnerId(optional), needDateResponderCount(optional),
*   needRespondTime(optional), receiverId(optional)
* @param {Function} callback - is function(err,dateObj)
*/
Redis.prototype.getDate = function(params, callback) {
  var messagePrefix = 'in Redis.getDate, ';
  var self = this;
  var req = params.req;
  if (!params.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var dateId = params.dateId;
  var dateIds = [dateId];
  params.dateIds = dateIds;
  self.getDates(params, function(err,dates){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (callback) return callback(null, dates[0]);
    return;
  });//getDates
};//getDate

/**
*
* @param {Object} params - contains dateIds, dateFields(optional), needKeepEmpty(optional),
*   needResponderIds(optional), dateOwnerId(optional), needDateResponderCount(optional)
*   needRespondTime(optional), responderId(optional)
*     the dateOwnerId is used to support a responder in a date can not see other responders info.
*       when a user get related dates, the dateOwnerId should be the userId.
*       when dateOwnerId exist and date.senderId != dateOwnerId, it means the getting-date user is responder in the date, then must NOT get other responderIds.
*     needRespondTime, responderId will cause date.respondTime as user:userId:date:dateId.createTime if existed and responderId is in fact the date responder
* @param {Function} callback - is function(err,dates)
*/
Redis.prototype.getDates = function(params, callback) {
  var messagePrefix = 'in Redis.getDates, ';
  var self = this;
  var req = params.req;
  //logger.logDebug("Redis.getDates entered, params="+util.inspect(params,false,100));
  if (!params.dateIds){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateIds'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var dateIds = params.dateIds;
  var dateFields = params.dateFields;
  var needKeepEmpty = params.needKeepEmpty;
  var needResponderIds = params.needResponderIds;
  var needDateResponderCount = params.needDateResponderCount;
  var dateOwnerId = params.dateOwnerId;
  var needRespondTime = params.needRespondTime;
  var responderId = params.responderId;
  if (dateIds.length == 0){
    if (callback) return callback(null, null);
    return;
  }

  var multi = self.client.multi();
  var itemCmdCount = 1, varItemIndex=1, responderIdsIndex, dateResponderCountIndex, respondTimeIndex;
  if (needResponderIds){
    itemCmdCount ++;
    responderIdsIndex = varItemIndex;
    varItemIndex ++;
  }
  if (needDateResponderCount){
    itemCmdCount ++;
    dateResponderCountIndex = varItemIndex;
    varItemIndex ++;
  }
  if (needRespondTime){
    itemCmdCount ++;
    respondTimeIndex = varItemIndex;
    varItemIndex ++;
  }
  for (var i=0; i<dateIds.length; i++) {
    var dateId = dateIds[i];
    var dateKey = 'date:'+dateId;
    if (!needKeepEmpty){
      var field = "dateId";
      if(dateFields && handy.arrayIndexOf({ary:dateFields,item:field})<0){
        dateFields.push(field);
      }
    }

    if(dateFields && dateFields.length > 0){
      var getDateFields = dateFields.slice(0);
      getDateFields.unshift(dateKey);
      multi.hmget(getDateFields);
    }else{
      multi.hgetall(dateKey);
    }
    //var dateRespondersKey = 'date:'+dateId+':responders';
    var dateActiveRespondersKey = 'date:'+dateId+':activeResponders';
    if (needResponderIds){
      //multi.smembers(dateRespondersKey);
      multi.zrevrange(dateActiveRespondersKey,0,-1);
    }
    if (needDateResponderCount){
      //multi.scard(dateRespondersKey);
      multi.zcard(dateActiveRespondersKey);
    }
    if (needRespondTime){
      var userDateKey = 'user:'+responderId+':date:'+dateId;
      multi.hmget(userDateKey,'userId','dateId','type','createTime');//...... in this version, deleted date is not supported
    }
  }//for
  multi.exec(function(err, retData) {
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    var dates = [];
    for(var i=0; i<retData.length; i+=itemCmdCount){
      var dateInfo = retData[i];
      var dateHash;
      if (dateFields && dateFields.length > 0){
        dateHash = handy.toHashWith2Array({keyArray:dateFields, valueArray:dateInfo});
      }else{
        dateHash = dateInfo;
      }
//      if ("alreadyStopped" in dateHash){
//        dateHash.alreadyStopped =  handy.convertToBool(dateHash.alreadyStopped);
//      }
      if (needResponderIds){
        var responderIds = retData[i+responderIdsIndex];
        if (responderIds && responderIds.length > 0){
          dateHash.responderIds = responderIds;
        }
        if(dateOwnerId != null && dateHash.senderId != dateOwnerId){
          //the user with the dateOwnerId is a responder to the user with dateHash.senderId
          dateHash.responderIds = [dateOwnerId];
        }
      }
      if (needDateResponderCount){
        var dateResponderCount = retData[i+dateResponderCountIndex];
        dateHash.dateResponderCount = dateResponderCount+"";
      }
      if (needRespondTime){
        var userDateInfo = retData[i+respondTimeIndex];
        //logger.logDebug("in Redis.getDates , userDateInfo="+util.inspect(userDateInfo,false,100));
        var userDateType = (userDateInfo) ? userDateInfo[2] : null;
        var userDateCreateTime = (userDateInfo) ? userDateInfo[3] : null;
        if (userDateCreateTime != null){
          if (userDateType=='receive'){
            dateHash.respondTime = userDateCreateTime;
          }
        }
      }
      if (dateHash.region) dateHash.region = JSON.parse(dateHash.region);
      dateHash = handy.removeNullFieldFor1Level(dateHash);
      if (!needKeepEmpty && dateHash && dateHash.dateId || needKeepEmpty){
        dates.push(dateHash);
      }
    }//for
    if (dates.length == 0){
      if (callback) return callback(null, null);
      return;
    }

    if (callback) return callback(null, dates);
    return ;
  });//multi.exec
};//getDates



/**
* if the user received a date, then other responders info in the date should not be got, only keep info of the user and the date sender.
*   it is supported in getDates with dateOwnerId param.
*
* @param {Object} params - contains userId, dateType(onlyActiveSend|applying|invited),
*   count, cutOffTime(optional), start(optional),
*   getDataDirection(optional, fromEarlyToLate | fromLateToEarly, default be fromLateToEarly),
*   excludeExpired.
*     here only 1 combination for excludeExpired=true when getDataDirection==fromEarlyToLate && cutOffTime==null.
*
*   dateFields(optional), needPhoto(optional),
*   needSender(optional), sendUserFields(optional), needDateResponderCount(optional),
*   needResponders(optional), responderFields(optional),responderUserFields(optional),
*   needRespondTime(optional),
*   needLatestMessage(optional), messageFields(optional),
*   needPrimaryPhoto,primaryPhotoFields
*
* @param {Function} callback - is function(err,dates)
*/
Redis.prototype.getUserDatesWithDetail = function(params, callback) {
  var messagePrefix = 'in Redis.getUserDatesWithDetail, ';
  var self = this;
  var req = params.req;
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var userId = params.userId;
  var paramsGetDateIds = {req:req,userId:userId, dateType:params.dateType, count:params.count, cutOffTime:params.cutOffTime, start:params.start,
      getDataDirection:params.getDataDirection, excludeExpired:params.excludeExpired};
  self.getUserDateIds(paramsGetDateIds, function(err,dateIdAndScoreData){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }

    //logger.logDebug("in Redis.getUserDatesWithDetail , dateIds="+util.inspect(dateIds,false,100));
    if (!dateIdAndScoreData){
      if (callback) return callback(null,null);
      return;
    }
    var dateIds = dateIdAndScoreData.dateIds;
    var scores = dateIdAndScoreData.scores;
    if (!dateIds || dateIds.length == 0){
      if (callback) return callback(null,null);
      return;
    }

    var getDatesWithDetailParams = {req:req,dateIds:dateIds, dateFields:params.dateFields, needPhoto:params.needPhoto,
          needSender:params.needSender, sendUserFields:params.sendUserFields,
          needDateResponderCount:params.needDateResponderCount,
          needResponders:params.needResponders, dateOwnerId:userId, responderFields:params.responderFields, responderUserFields:params.responderUserFields,
          needRespondTime:params.needRespondTime, responderId:userId,
          needLatestMessage:params.needLatestMessage, messageFields:params.messageFields,
          needPrimaryPhoto:params.needPrimaryPhoto, primaryPhotoFields:params.primaryPhotoFields};
    self.getDatesWithDetail(getDatesWithDetailParams, function(err,dates){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        if (callback) return callback(err2);
        else return self.handleError({err:err2});
      }
      shuffle.bindDateAndScore({dates:dates,scores:scores});
      if (callback) return callback(null,dates);
      return;
    });//getDatesWithDetail
  });//getUserDateIds
};//getUserDatesWithDetail

/**
*
*
* @param {Object} params - contains dateIds, dateFields(optional),
*   needPhoto(optional),
*   needSender(optional), sendUserFields(optional), needDateResponderCount(optional),
*   needResponders(optional), dateOwnerId(optional), responderFields(optional),responderUserFields(optional),
*   needRespondTime(optional), responderId(optional)
*   needLatestMessage(optional), messageFields(optional),
*   needPrimaryPhoto,primaryPhotoFields
*
* @param {Function} callback - is function(err,dates)
*/
Redis.prototype.getDatesWithDetail = function(params, callback) {
  //logger.logDebug("Redis.getDatesWithDetail entered, params="+util.inspect(params,false,100));
  var messagePrefix = 'in Redis.getDatesWithDetail, ';
  var self = this;
  var req = params.req;
  if (!params.dateIds){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateIds'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var dateIds = params.dateIds;
  var dateFields = params.dateFields;//if set dateFields, must contain senderId,
  var needPhoto = params.needPhoto;
  var needSender = params.needSender;
  var sendUserFields = params.sendUserFields;
  var needDateResponderCount = params.needDateResponderCount;
  var needResponders = params.needResponders;
  var dateOwnerId = params.dateOwnerId;
  var responderFields = params.responderFields;
  var responderUserFields = params.responderUserFields;
  var needRespondTime = params.needRespondTime;
  var responderId = params.responderId;
  var needLatestMessage = params.needLatestMessage;
  var messageFields = params.messageFields;
  var needPrimaryPhoto = params.needPrimaryPhoto;
  var primaryPhotoFields = params.primaryPhotoFields;

  if (needPhoto){
    if(dateFields && dateFields.length > 0){
      var field = 'photoId';
      if(handy.arrayIndexOf({ary:dateFields,item:field})<0){
        dateFields.push(field);
      }
    }
  }
  self.getDates({req:req,dateIds:dateIds,dateFields:dateFields,
    needResponderIds:needResponders,dateOwnerId:dateOwnerId,needDateResponderCount:needDateResponderCount,
    needRespondTime:needRespondTime,responderId:responderId}, function(err,dates){
      if (err){
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      //logger.logDebug("Redis.getDatesWithDetail, getDates, callback, dates="+util.inspect(dates,false,100));
      if (!dates || dates.length == 0){
        if (callback) return callback(null, null);
        return;
      }

      function getDatesPhotosAndBind(cbFun){
        if (!needSender) return cbFun(null);
        self.getDatesPhotosAndBind({req:req,dates:dates}, function(err,dates){
            if (err) return cbFun(err);
            return cbFun(null);
        });//getDatesPhotosAndBind
      };//getDatesPhotosAndBind

      function getDatesSendersAndBind(cbFun){
        if (!needSender) return cbFun(null);
        self.getDatesSendersAndBind({req:req,dates:dates,dateOwnerId:dateOwnerId,sendUserFields:sendUserFields,
          needPrimaryPhoto:needPrimaryPhoto,primaryPhotoFields:primaryPhotoFields}, function(err,dates){
            if (err) return cbFun(err);
            return cbFun(null);
        });//getDatesSendersAndBind
      };//getDatesSendersAndBind

      function getDatesRespondersAndBind(cbFun){
        if (!needResponders) return cbFun(null);
        self.getDatesRespondersAndBind({req:req,dates:dates,responderFields:responderFields,responderUserFields:responderUserFields,
          needLatestMessage:needLatestMessage,messageFields:messageFields,dateOwnerId:dateOwnerId,
          needPrimaryPhoto:needPrimaryPhoto,primaryPhotoFields:primaryPhotoFields}, function(err,dateResponders){
            if (err) return cbFun(err);
            return cbFun(null);
        });//getDatesRespondersAndBind
      };//getDatesRespondersAndBind

      getDatesPhotosAndBind(function(err){
        if (err){
          if (callback) return callback(err);
          else return self.handleError({err:err});
        }
        getDatesSendersAndBind(function(err){
          if (err){
            if (callback) return callback(err);
            else return self.handleError({err:err});
          }
          getDatesRespondersAndBind(function(err,dateResponders){
              if (err){
                if (callback) return callback(err);
                else return self.handleError({err:err});
              }
              if (callback) return callback(null,dates);
              return;
          });//getDatesRespondersAndBind
        });//getDatesSendersAndBind
      });//getDatesPhotosAndBind
  });//getDates
};//getDatesWithDetail



/**
*
* @param {Object} params - contains dates
*
* @param {Function} callback - is function(err,dates)
*/
Redis.prototype.getDatesPhotosAndBind = function(params, callback) {
  //logger.logDebug("Redis.getDatesPhotosAndBind params="+util.inspect(params,false,100));
  var messagePrefix = 'in Redis.getDatesPhotosAndBind, ';
  var self = this;
  var req = params.req;
  if (!params.dates){
    var err = self.newError({errorKey:'needParameter',messageParams:['dates'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var dates = params.dates;
  if (!dates || dates.length == 0){
    if (callback) return callback(null, null);
    return;
  }
  var photoIdSet = {};
  for(var i=0; i<dates.length; i++){
    var date = dates[i];
    if (date){
      var photoId = date.photoId;
      if (photoId) photoIdSet[photoId] = photoId;
    }
  }
  var photoIds = [];
  for(idx in photoIdSet){
    photoIds.push(photoIdSet[idx]);
  }
  //logger.logDebug("Redis.getDatesPhotosAndBind, photoIds="+util.inspect(photoIds,false,100));
  if (photoIds.length == 0){
    if (callback) return callback(null, dates);
    return;
  }
  self.getPhotos({req:req,photoIds:photoIds,photoFields:['photoId','photoPath'],userIdToCheckAlreadyLikedPhoto:null}, function(err,photos){
      if (err){
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      shuffle.bindDateWithPhoto({dates:dates,photos:photos});
      if (callback) return callback(null, dates);
      return;
  });//getPhotos
};//getDatesPhotosAndBind



/**
*
* @param {Object} params - contains dates, dateOwnerId(optional)(usually be self), sendUserFields(optional),
*   needPrimaryPhoto,primaryPhotoFields
*
* @param {Function} callback - is function(err,dates)
*/
Redis.prototype.getDatesSendersAndBind = function(params, callback) {
  //logger.logDebug("Redis.getDatesSendersAndBind params="+util.inspect(params,false,100));
  var messagePrefix = 'in Redis.getDatesSendersAndBind, ';
  var self = this;
  var req = params.req;
  if (!params.dates){
    var err = self.newError({errorKey:'needParameter',messageParams:['dates'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var dates = params.dates;
  var dateOwnerId = params.dateOwnerId;
  var sendUserFields = params.sendUserFields;
  var needPrimaryPhoto = params.needPrimaryPhoto;
  var primaryPhotoFields = params.primaryPhotoFields;
  if (!dates || dates.length == 0){
    if (callback) return callback(null, null);
    return;
  }
  var senderIdSet = {};
  for(var i=0; i<dates.length; i++){
    var date = dates[i];
    if (date){
      var senderId = date.senderId;
      if (dateOwnerId == null){
        senderIdSet[senderId] = senderId;
      }else{//dateOwnerId != null
        if (senderId != dateOwnerId){
          senderIdSet[senderId] = senderId;
        }
      }
    }
  }
  var senderIds = [];
  for(idx in senderIdSet){
    senderIds.push(senderIdSet[idx]);
  }
  //logger.logDebug("Redis.getDatesSendersAndBind, senderIds="+util.inspect(senderIds,false,100));
  if (senderIds.length == 0){
    if (callback) return callback(null, dates);
    return;
  }
  self.getUsers({req:req,userIds:senderIds,userFields:sendUserFields,needPhotoCount:false,getSelf:false,
    needPrimaryPhoto:needPrimaryPhoto,primaryPhotoFields:primaryPhotoFields}, function(err,senders){
      if (err){
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      shuffle.bindDateWithSender({dates:dates,users:senders});
      if (callback) return callback(null, dates);
      return;
  });//getUsers
};//getDatesSendersAndBind



/**
* will add unViewedConversationCount field to each date
*
* @param {Object} params - contains dates(need with responderIds),
*   responderFields(optional), responderUserFields(optional), here need responderFields merge with responderUserFields.
*   needLatestMessage(optional),messageFields(optional),dateOwnerId(only required when needLatestMessage=true),
*   needPrimaryPhoto,primaryPhotoFields
* @param {Function} callback - is function(err,dates)
*
*/
Redis.prototype.getDatesRespondersAndBind = function(params, callback) {
  var messagePrefix = 'in Redis.getDatesRespondersAndBind, ';
  var self = this;
  var req = params.req;
  var dates = params.dates;
  self.getDatesResponders(params, function(err,dateResponders){
      if (err){
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      //logger.logDebug("in Redis.getDatesRespondersAndBind getDatesResponders callback, dateResponders="+util.inspect(dateResponders,false,100));
      shuffle.bindDateWithResponder({dates:dates,dateResponders:dateResponders});
      if (callback) return callback(null,dates);
      return;
  });//getDatesResponders
};//getDatesRespondersAndBind




/**
* here auto check rate status
* @param {Object} params - contains dates(need with responderIds),
*   responderFields(optional), responderUserFields(optional), here need responderFields merge with responderUserFields.
*   needLatestMessage(optional),messageFields(optional),dateOwnerId(only required when needLatestMessage=true),
*     when a user sends a date or receives a date, we say that the user owns the date. so date owner can be sender in one date, and responder in another date.
*     needLatestMessage=true also requires date.senderId exists
*   needPrimaryPhoto,primaryPhotoFields
* @param {Function} callback - is function(err,dateResponders)
*   dateResponders may contain null item
*/
Redis.prototype.getDatesResponders = function(params, callback) {
  //logger.logDebug("Redis.getDatesResponders entered, params="+util.inspect(params,false,100));
  var messagePrefix = 'in Redis.getDatesResponders, ';
  var self = this;
  var req = params.req;
  if (!params.dates){
    var err = self.newError({errorKey:'needParameter',messageParams:['dates'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var dates = params.dates;
  var responderFields = params.responderFields;
  var responderUserFields = params.responderUserFields;
  var needLatestMessage = params.needLatestMessage;
  if (needLatestMessage){
    if (!params.dateOwnerId){
      var err = self.newError({errorKey:'needParameter',messageParams:['dateOwnerId'],messagePrefix:messagePrefix,req:req});
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    for(var i=0; i<dates.length; i++){
      var date = dates[i];
      if (date && date.dateId){
        if (!date.senderId){
          var err = self.newError({errorKey:'needVariableMeetCondition',messageParams:['every date.senderId exist'],messagePrefix:messagePrefix,req:req});
          if (callback) return callback(err);
          else return self.handleError({err:err});
        }
      }
    }//for
  }
  var messageFields = params.messageFields;
  var dateOwnerId = params.dateOwnerId;
  var needPrimaryPhoto = params.needPrimaryPhoto;
  var primaryPhotoFields = params.primaryPhotoFields;
  if (dates.length == 0){
    if (callback) return callback(null, null);
    return;
  }
  var allDateResponderIds = [];
  for (var i=0; i<dates.length; i++) {
    var date = dates[i];
    var dateId = date.dateId;
    var dateResponderIds = date.responderIds;
    if (dateResponderIds && dateResponderIds.length > 0){
      allDateResponderIds = allDateResponderIds.concat(dateResponderIds);
    }
  }//for i
  if (allDateResponderIds.length == 0){
    if (callback) return callback(null, null);
    return;
  }
  self.getUsers({req:req,userIds:allDateResponderIds,userFields:responderUserFields
    ,needPrimaryPhoto:needPrimaryPhoto,primaryPhotoFields:primaryPhotoFields}, function(err,responderUsers){
      if (err){
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }

      var itemCmdCount = 1;
      if(needLatestMessage){
        itemCmdCount++;
      }

      if(needLatestMessage){
        if(responderFields && responderFields.length > 0){
          var field = 'senderLastViewChatTime';
          if(handy.arrayIndexOf({ary:responderFields,item:field})<0){
            responderFields.push(field);
          }
          field = 'responderLastViewChatTime';
          if(handy.arrayIndexOf({ary:responderFields,item:field})<0){
            responderFields.push(field);
          }
        }
        if(messageFields && messageFields.length > 0){
          var field = 'createTime';
          if(handy.arrayIndexOf({ary:messageFields,item:field})<0){
            messageFields.push(field);
          }
        }
      }//needLatestMessage

      if(responderFields && responderFields.length > 0){
        //responderFields need contain id-some fields
        if(handy.arrayIndexOf({ary:responderFields,item:'dateId'})<0){
          responderFields.push('dateId');
        }
        if(handy.arrayIndexOf({ary:responderFields,item:'responderId'})<0){
          responderFields.push('responderId');
        }

        if(handy.arrayIndexOf({ary:responderFields,item:'badRate'})<0){
          responderFields.push('badRate');
        }
        if(handy.arrayIndexOf({ary:responderFields,item:'goodRate'})<0){
          responderFields.push('goodRate');
        }
        if(handy.arrayIndexOf({ary:responderFields,item:'badRateSender'})<0){
          responderFields.push('badRateSender');
        }
        if(handy.arrayIndexOf({ary:responderFields,item:'goodRateSender'})<0){
          responderFields.push('goodRateSender');
        }
      }
      //logger.logDebug("in Redis.getDatesResponders , responderFields="+util.inspect(responderFields,false,100));

      var multi = self.client.multi();
      for (var i=0; i<dates.length; i++) {
        var date = dates[i];
        var dateId = date.dateId;
        var dateResponderIds = date.responderIds;
        if (dateResponderIds && dateResponderIds.length > 0){
          for(var j=0; j<dateResponderIds.length; j++){
            var responderId = dateResponderIds[j];
            var dateResponderKey = 'date:'+dateId+':responder:'+responderId;
            if(responderFields && responderFields.length > 0){
              var getReponderFields = responderFields.slice(0);
              //responderFields need contain id-some fields
              getReponderFields.unshift(dateResponderKey);
              multi.hmget(getReponderFields);
            }else{
              multi.hgetall(dateResponderKey);
            }
            if(needLatestMessage){
              var getOwnerLatestMessageIdKey = 'chat:date:dateId:user:userId:targetUser:targetUserId';
              if(date.senderId == dateOwnerId){
                getOwnerLatestMessageIdKey = 'chat:date:'+dateId+':user:'+dateOwnerId+':targetUser:'+responderId;
              }else{
                getOwnerLatestMessageIdKey = 'chat:date:'+dateId+':user:'+dateOwnerId+':targetUser:'+date.senderId;
              }
              //logger.logDebug("in Redis.getDatesResponders , getOwnerLatestMessageIdKey="+getOwnerLatestMessageIdKey+", date.senderId==dateOwnerId?"+(date.senderId == dateOwnerId));
              multi.zrevrange(getOwnerLatestMessageIdKey,0,0);
            }
          }//for j
        }
      }//for i

      multi.exec(function(err, retData) {
        if (err){
          var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
          if (callback) return callback(err2);
          else return self.handleError({err:err2});
        }
        //logger.logDebug("in Redis.getDatesResponders, multi.exec, retData="+util.inspect(retData,false,100));
        var dateResponders = [];
        for(var i=0; i<retData.length; i+=itemCmdCount){
          var responderInfo = retData[i];
          var responderHash;
          if (responderFields && responderFields.length > 0){
            responderHash = handy.toHashWith2Array({keyArray:responderFields, valueArray:responderInfo});
            if (!responderHash.dateId){
              responderHash = null;
            }
          }else{
            responderHash = responderInfo;
          }
          if (responderHash){
            var responderUserIdx = i/itemCmdCount;
            var responderUser = responderUsers[responderUserIdx];
            tool.copyFields({srcObj:responderUser,destObj:responderHash});
            if ("senderConfirmed" in responderHash){
              responderHash.senderConfirmed = handy.convertToBool(responderHash.senderConfirmed);
            }
            var haveBeenRated  = handy.convertToBool(responderHash.badRate) || handy.convertToBool(responderHash.goodRate);
            var haveRate = handy.convertToBool(responderHash.badRateSender) || handy.convertToBool(responderHash.goodRateSender);
            responderHash.haveBeenRated = haveBeenRated;
            responderHash.haveRate = haveRate;

            responderHash = handy.removeNullFieldFor1Level(responderHash);

            if(needLatestMessage){
              var messageIdAry = retData[i+1];
              if (messageIdAry && messageIdAry.length>0){
                var latestMessageId = messageIdAry[0];
                responderHash.latestMessageId = latestMessageId;
              }
            }
          }

          dateResponders.push(responderHash);
        }//for
        //logger.logDebug("in Redis.getDatesResponders , dateResponders="+util.inspect(dateResponders,false,100));
        if (!needLatestMessage){
          if (callback) return callback(null, dateResponders);
          return ;
        }
        //dateResponders.length should > 0
        self.getDatesRespondersLatestMessage({req:req,dateResponders:dateResponders,messageFields:messageFields,dateOwnerId:dateOwnerId}, function(err,dateResponders){
          if (err){
            if (callback) return callback(err);
            else return self.handleError({err:err});
          }
          if (callback) return callback(null, dateResponders);
          return ;
        });//getDatesRespondersLatestMessage
        return;
      });//multi.exec
  });//getUsers
};//getDatesResponders

/**
* directly modify on the param dateResponders with messages
* will add latestMessage object, haveUnViewedMessage field to each responder,
*
* @param {Object} params - contains dateResponders, messageFields(optional), dateOwnerId
*
* @param {Function} callback - is function(err,dateResponders)
*/
Redis.prototype.getDatesRespondersLatestMessage = function(params, callback) {
  var messagePrefix = 'in Redis.getDatesRespondersLatestMessage, ';
  var self = this;
  var req = params.req;
  //logger.logDebug("Redis.getDatesRespondersLatestMessage entered, params="+util.inspect(params,false,100));
  if (!params.dateResponders){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateResponders'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.dateOwnerId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateOwnerId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var dateResponders = params.dateResponders;
  var messageFields = params.messageFields;
  var dateOwnerId = params.dateOwnerId;
  var multi = self.client.multi();

  var messageIdCount = 0;
  for (var i=0; i<dateResponders.length; i++) {
    var dateResponder = dateResponders[i];
    if (dateResponder && dateResponder.latestMessageId != null){
      messageIdCount ++;
      var latestMessageId = dateResponder.latestMessageId;
      var messageKey = 'message:'+latestMessageId;
      if(messageFields && messageFields.length > 0){
        var getMessageFields = messageFields.slice(0);
        getMessageFields.unshift(messageKey);
        multi.hmget(getMessageFields);
      }else{
        multi.hgetall(messageKey);
      }
    }
  }//for i
  if (messageIdCount == 0){
    if (callback) return callback(null, dateResponders);
    return ;
  }
  multi.exec(function(err, retData) {
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    var messages = [];
    for(var i=0; i<retData.length; i++){
      var messageInfo = retData[i];
      var messageHash;
      if (messageFields && messageFields.length > 0){
        messageHash = handy.toHashWith2Array({keyArray:messageFields, valueArray:messageInfo});
      }else{
        messageHash = messageInfo;
      }
      messageHash = handy.removeNullFieldFor1Level(messageHash);
      messages.push(messageHash);
    }//for
    shuffle.bindDatesResponderWithLatestMessage({dateResponders:dateResponders,messages:messages,dateOwnerId:dateOwnerId});
    if (callback) return callback(null, dateResponders);
    return ;
  });//multi.exec
};//getDatesRespondersLatestMessage


/**
*
*
* @param {Object} params - contains userId, count, cutOffTime(optional), start(optional),
*   getDataDirection(optional, fromEarlyToLate | fromLateToEarly, default be fromLateToEarly),
*   excludeExpired.
*     here only 1 combination for excludeExpired=true when getDataDirection==fromEarlyToLate && cutOffTime==null.
* @param {Function} callback - is function(err,dateUserPairAndScoreData)
*   dateUserPairAndScoreData contains dateIdUserIdPairs, scores
*     each element of dateIdUserIdPairs contains dateId,targetUserId.
*/
Redis.prototype.getUserDateConversationRefs = function(params, callback) {
  var messagePrefix = 'in Redis.getUserDateConversationRefs, ';
  var self = this;
  var req = params.req;
  //logger.logDebug("Redis.getUserDateConversationRefs entered, params="+util.inspect(params,false,100));
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var userId = params.userId;
  var userDateConversationsKey = "user:"+userId+":dateConversations";
  var lparams = tool.cloneObject(params);
  delete lparams.userId;
  lparams.zsetKey = userDateConversationsKey;
  self.getValuesOnSortedSetByTime(lparams, function(err,valueAndScoreData){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (!valueAndScoreData) {
      if (callback) return callback(null,null);
      else return ;
    }
    //logger.logDebug("Redis.getUserDateConversationRefs getValuesOnSortedSetByTime callback, valueAndScoreData="+util.inspect(valueAndScoreData,false,100));
    var dateWithUsers = valueAndScoreData.values;
    var scores = valueAndScoreData.scores;
    var dateIdUserIdPairs = [];
    for(var i=0; i<dateWithUsers.length; i++){
      var dateIdWithUserIdStr = dateWithUsers[i];
      var Ids = dateIdWithUserIdStr.split("+");
      assert.ok(Ids.length == 2);
      var dateId = Ids[0];
      var userId = Ids[1];
      dateIdUserIdPairs.push({dateId:dateId, userId:userId});
    }
    if (callback) return callback(null,{dateIdUserIdPairs:dateIdUserIdPairs,scores:scores});
    else return ;
  });//getValuesOnSortedSetByTime
};//getUserDateConversationRefs


Redis.prototype._getDistinctDateIdsAndUserIdsFromDateIdUserIdPairs = function(dateIdUserIdPairs) {
  if (dateIdUserIdPairs == null) return null;
  var dateIdHash = {}, userIdHash = {};
  for(var i=0; i<dateIdUserIdPairs.length; i++){
    var dateIdUserIdPair = dateIdUserIdPairs[i];
    var dateId = dateIdUserIdPair.dateId;
    var userId = dateIdUserIdPair.userId;
    dateIdHash[dateId] = dateId;
    userIdHash[userId] = userId;
  }
  var distinctDateIds = handy.getFieldsOfObject(dateIdHash);
  var distinctUserIds = handy.getFieldsOfObject(userIdHash);
  return {distinctDateIds:distinctDateIds,distinctUserIds:distinctUserIds};
};//_getDistinctDateIdsAndUserIdsFromDateIdUserIdPairs



/**
* get date conversations of one given user
*
* @param {Object} params - contains userId, dateIdUserIdPairs,scores,
*   dateFields, userFields, messageFields,
*   needPrimaryPhoto,primaryPhotoFields
* @param {Function} callback - is function(err,conversations)
*   each item of conversations contains dateId, date, targetUserId, targetUser, latestMessage, haveUnViewedMessage
*/
Redis.prototype.getDateConversationsOfUser = function(params, callback) {
  var messagePrefix = 'in Redis.getDateConversationsOfUser, ';
  var self = this;
  var req = params.req;
  //logger.logDebug("Redis.getDateConversationsOfUser entered, params="+util.inspect(params,false,100));
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.dateIdUserIdPairs){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateIdUserIdPairs'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var userId = params.userId;
  var dateIdUserIdPairs = params.dateIdUserIdPairs;
  var scores = params.scores;
  var dateFields = params.dateFields;
  var userFields = params.userFields;
  var messageFields = params.messageFields;
  var needPrimaryPhoto = params.needPrimaryPhoto;
  var primaryPhotoFields = params.primaryPhotoFields;

  if (dateIdUserIdPairs == null || dateIdUserIdPairs.length == 0){
    return callback(null,null);
  }
  var distinctIdsData = self._getDistinctDateIdsAndUserIdsFromDateIdUserIdPairs(dateIdUserIdPairs);
  var distinctDateIds = distinctIdsData.distinctDateIds;
  var distinctUserIds = distinctIdsData.distinctUserIds;

  if (dateFields != null){
    var item = "id";
    if (handy.arrayIndexOf({ary:dateFields, item:item})<0){
      dateFields.push(item);
    }
    item = "senderId";
    if (handy.arrayIndexOf({ary:dateFields, item:item})<0){
      dateFields.push(item);
    }
  }
  if (userFields != null){
    var item = "id";
    if (handy.arrayIndexOf({ary:userFields, item:item})<0){
      userFields.push(item);
    }
  }
  if (messageFields != null){
    var item = "id";
    if (handy.arrayIndexOf({ary:messageFields, item:item})<0){
      messageFields.push(item);
    }
    item = "createTime";
    if (handy.arrayIndexOf({ary:messageFields, item:item})<0){
      messageFields.push(item);
    }
  }
  self.getDates({req:req,dateIds:distinctDateIds, dateFields:dateFields}, function(err,dates){
    if (err) return callback(err);
    var datesHash = handy.objectArrayToHashWithIdBeKey({objectAry:dates, idFieldName:"dateId"});
    var allUserIds = [userId].concat(distinctUserIds);
    self.getUsers({req:req,userIds:allUserIds,userFields:userFields,needPrimaryPhoto:needPrimaryPhoto,primaryPhotoFields:primaryPhotoFields}, function(err,users){
      if (err) return callback(err);
      var usersHash = handy.objectArrayToHashWithIdBeKey({objectAry:users, idFieldName:"userId"});

      var multi = self.client.multi();
      for(var i=0; i<dateIdUserIdPairs.length; i++){
        var dateIdUserIdPair = dateIdUserIdPairs[i];
        var dateId = dateIdUserIdPair.dateId;
        var targetUserId = dateIdUserIdPair.userId;
        var dateObj = datesHash[dateId];
        var dateResponderId;
        if (userId == dateObj.senderId) dateResponderId = targetUserId;
        else dateResponderId = userId;
        var dateResponderKey = "date:"+dateId+":responder:"+dateResponderId;
        //console.log("dateResponderKey = "+dateResponderKey);
        multi.hgetall(dateResponderKey);
        var userDateConversationMessagesKey = "chat:date:"+dateId+":user:"+userId+":targetUser:"+targetUserId;
        //console.log("userDateConversationMessagesKey = "+userDateConversationMessagesKey);
        multi.zrevrange(userDateConversationMessagesKey,0,0);
      }//for
      multi.exec(function(err, retData) {
        if (err){
          var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
          return callback(err2);
        }
        //logger.logDebug("Redis.getDateConversationsOfUser multi.exec, retData="+util.inspect(retData,false,100));
        var dateResponderAry = [];
        var messageIdsWithPossibleNull = [], messageIdsWithoutNull = [];
        for(var i=0; i<dateIdUserIdPairs.length; i++){
          var dateResponder = retData[i*2+0];
          var latestMessageIdAry = retData[i*2+1];
          dateResponderAry.push(dateResponder);
          var latestMessageId = null;
          if (latestMessageIdAry != null && latestMessageIdAry.length > 0){
            latestMessageId = latestMessageIdAry[0];
          }
          messageIdsWithPossibleNull.push(latestMessageId);
          if (latestMessageId != null) messageIdsWithoutNull.push(latestMessageId);
        }//for

        self.getMessages({req:req,messageIds:messageIdsWithoutNull}, function(err,messages){
          if (err) return callback(err);
          var messagesHash = handy.objectArrayToHashWithIdBeKey({objectAry:messages, idFieldName:"messageId"});

          var conversations = [];
          for(var i=0; i<dateIdUserIdPairs.length; i++){

            var dateIdUserIdPair = dateIdUserIdPairs[i];
            var dateId = dateIdUserIdPair.dateId;
            var targetUserId = dateIdUserIdPair.userId;
            var dateObj = datesHash[dateId];
            var targetUserObj = usersHash[targetUserId];
            var dateResponder = dateResponderAry[i];
            var latestMessageId = messageIdsWithPossibleNull[i];
            var latestMessageObj = null;
            if (latestMessageId != null) latestMessageObj = messagesHash[latestMessageId];

            var userLastViewChatTime = null, senderConfirmed = false, haveBeenRated = false, haveRate = false;
            if (dateResponder){
              if (userId = dateObj.sender){
                userLastViewChatTime = dateResponder.senderLastViewChatTime;
              }else{
                userLastViewChatTime = dateResponder.responderLastViewChatTime;
              }

              if ("senderConfirmed" in dateResponder){
                senderConfirmed = handy.convertToBool(dateResponder.senderConfirmed);
              }
              haveBeenRated  = handy.convertToBool(dateResponder.badRate) || handy.convertToBool(dateResponder.goodRate);
              haveRate = handy.convertToBool(dateResponder.badRateSender) || handy.convertToBool(dateResponder.goodRateSender);
            }
            var haveUnViewedMessage = false;
            if (latestMessageObj != null){
              if (userLastViewChatTime == null || Number(latestMessageObj.createTime) > Number(userLastViewChatTime)){
                haveUnViewedMessage = true;
              }
            }
            var conversation = {dateId:dateId, date:dateObj, targetUserId:targetUserId, targetUser:targetUserObj, latestMessage:latestMessageObj,
                haveUnViewedMessage:haveUnViewedMessage, senderConfirmed:senderConfirmed, haveBeenRated:haveBeenRated, haveRate:haveRate};
            conversations.push(conversation);
          }//for
          return callback(null,conversations);
        });//getMessages
      });//multi.exec
    });//getUsers
  });//getDates
};//getDateConversationsOfUser


/**
*
*
* @param {Object} params - contains userId, count, cutOffTime(optional), start(optional),
*   getDataDirection(optional, fromEarlyToLate | fromLateToEarly, default be fromLateToEarly),
*   excludeExpired.
*   dateFields, userFields, messageFields,
*   needPrimaryPhoto,primaryPhotoFields.
*     here only 1 combination for excludeExpired=true when getDataDirection==fromEarlyToLate && cutOffTime==null.
* @param {Function} callback - is function(err,conversations)
*   each item of conversations contains dateId, date, targetUserId, targetUser, latestMessage, haveUnViewedMessage
*/
Redis.prototype.getUserDateConversations = function(params, callback) {
  var messagePrefix = 'in Redis.getUserDateConversations, ';
  var self = this;
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  self.getUserDateConversationRefs(params, function(err,dateUserPairAndScoreData){
    if (err) return callback(err);
    if (!dateUserPairAndScoreData) {
      if (callback) return callback(null,null);
      else return ;
    }
    var lparams = tool.cloneObject(params);
    delete lparams.count;
    delete lparams.cutOffTime;
    delete lparams.start;
    delete lparams.getDataDirection;
    delete lparams.excludeExpired;
    tool.copyFields({srcObj:dateUserPairAndScoreData, destObj:lparams, overrideSameName:null});
    self.getDateConversationsOfUser(lparams,function(err,conversations){
      if (err) return callback(err);
      return callback(null,conversations);
    });//getDateConversationsOfUser
  });//getUserDateConversationRefs
};//getUserDateConversations




/**
*
* @param {Object} params - contains userId, dateId, targetUserId, count, cutOffTime(optional),
*   getDataDirection(optional, fromEarlyToLate | fromLateToEarly, default be fromLateToEarly), resultOrderType(natural| fromEarlyToLate | fromLateToEarly)
* @param {Function} callback - is function(err,messageIds)
*/
Redis.prototype.getDateMessageIds = function(params, callback) {
  var messagePrefix = 'in Redis.getDateMessageIds, ';
  var self = this;
  var req = params.req;
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.targetUserId){
    var err = self.newError({errorKey:'needParameter',messageParams:['targetUserId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if ( !(params.count != null && params.count > 0) ){
    var err = self.newError({errorKey:'needParameter',messageParams:['count > 0'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.resultOrderType){
    var err = self.newError({errorKey:'needParameter',messageParams:['resultOrderType'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var userId = params.userId;
  var dateId = params.dateId;
  var targetUserId = params.targetUserId;
  var resultOrderType = params.resultOrderType;
  var getDataDirection = params.getDataDirection;
  var directionFromLateToEarly = true;
  if (getDataDirection == 'fromEarlyToLate')
    directionFromLateToEarly = false;
  var dateMessagesKey = 'chat:date:'+dateId+':user:'+userId+':targetUser:'+targetUserId;

  var lparams = tool.cloneObject(params);
  delete lparams.dateId;
  delete lparams.userId;
  delete lparams.targetUserId;
  delete lparams.resultOrderType;
  lparams.zsetKey = dateMessagesKey;
  self.getValuesOnSortedSetByTime(lparams, function(err,valueAndScoreData){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (!valueAndScoreData) {
      if (callback) return callback(null,null);
      else return ;
    }

    var messageIds = valueAndScoreData.values;
    if (!messageIds || messageIds.length == 0)
      messageIds = null;
    else{
      if (directionFromLateToEarly){
        if (resultOrderType == 'fromEarlyToLate'){
          messageIds.reverse();
        }
      }else{//direction be fromEarlyToLate
        if (resultOrderType == 'fromLateToEarly'){
          messageIds.reverse();
        }
      }
    }

    if (callback) return callback(null,messageIds);
    else return ;
  });//getValuesOnSortedSetByTime
};//getDateMessageIds


/**
*
*
* @param {Object} params - contains userId, dateId, targetUserId, count, cutOffTime(optional), messageFields(optional),
*   getDataDirection(optional, fromEarlyToLate | fromLateToEarly, default be fromLateToEarly), resultOrderType(natural| fromEarlyToLate | fromLateToEarly),
*   userFields,needPrimaryPhoto,primaryPhotoFields,
*   givenMessageIds
* @param {Function} callback - is function(err,messages)
*/
Redis.prototype.getDateMessages = function(params, callback) {
  var messagePrefix = 'in Redis.getDateMessages, ';
  var self = this;
  var req = params.req;
  var messageFields = params.messageFields;

  function getMessageIds(params,cbFun){
    var givenMessageIds = params.givenMessageIds;
    if (givenMessageIds && givenMessageIds.length > 0){
      return cbFun(null,givenMessageIds);
    }
    self.getDateMessageIds(params, function(err,messageIds){
      if (err){
        return cbFun(err);
      }
      if (!messageIds || messageIds.length == 0){
        return cbFun(null, null);
      }
      return cbFun(null, messageIds);
    });//getDateMessageIds
  };//getMessageIds

  getMessageIds(params, function(err,messageIds){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (!messageIds || messageIds.length == 0){
      if (callback) return callback(null, null);
      return;
    }
    var userIds = [params.userId, params.targetUserId];
    var userFields = params.userFields;
    var needPrimaryPhoto = params.needPrimaryPhoto;
    var primaryPhotoFields = params.primaryPhotoFields;
    self.getUsers({req:req,userIds:userIds,userFields:userFields,needPhotoCount:false,
    needPrimaryPhoto:needPrimaryPhoto,primaryPhotoFields:primaryPhotoFields}, function(err,users){
      if (err){
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      self.getMessages({req:req,messageIds:messageIds,messageFields:messageFields}, function(err,messages){
        if (err){
          if (callback) return callback(err);
          else return self.handleError({err:err});
        }
        if (!messages || messages.length == 0){
          if (callback) return callback(null, null);
          return;
        }
        shuffle.bindMessageSender({messages:messages,users:users});
        if (callback) return callback(null, messages);
        return;
      });//getMessages
    });//getUsers
  });//getMessageIds
};//getDateMessages


/**
*
*
* @param {Object} params - contains messageIds, messageFields(optional)
* @param {Function} callback - is function(err,messages)
*/
Redis.prototype.getMessages = function(params, callback) {
  var messagePrefix = 'in Redis.getMessages, ';
  var self = this;
  var req = params.req;
  if (!params.messageIds){
    var err = self.newError({errorKey:'needParameter',messageParams:['messageIds'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var messageIds = params.messageIds;
  if (messageIds.length == 0){
    if (callback) return callback(null, null);
    return;
  }
  var messageFields = params.messageFields;
  var multi = self.client.multi();
  for (var i=0; i<messageIds.length; i++) {
    var messageId = messageIds[i];
    var messageKey = 'message:'+messageId;
    if(messageFields && messageFields.length > 0){
      var getMessageFields = messageFields.slice(0);
      getMessageFields.unshift(messageKey);
      multi.hmget(getMessageFields);
    }else{
      multi.hgetall(messageKey);
    }
  }//for
  multi.exec(function(err, retData) {
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    var messages = [];
    for(var i=0; i<retData.length; i++){
      var messageInfo = retData[i];

      var messageHash;
      if (messageFields && messageFields.length > 0){
        messageHash = handy.toHashWith2Array({keyArray:messageFields, valueArray:messageInfo});
      }else{
        messageHash = messageInfo;
      }
      messageHash = handy.removeNullFieldFor1Level(messageHash);
      messages.push(messageHash);
    }//for
    if (messages && messages.length > 0) {
      if (callback) return callback(null, messages);
    }else{
      if (callback) return callback(null, null);
    }
    return ;
  });//multi.exec
};//getMessages




/**
 *
 *
 * @param {Object} params - contains messageText, dateId, senderId, receiverId, dateSenderId, dateResponderId, onlySendToSingle(optional)
 *   senderId always be creator.
 *   when onlySendToSingle be true,  senderId would be a system user id, and receiverId would be a real user id in the date chat,
 *     and we need the other user id in the date chat, here use dateSenderId, dateResponderId.
 * @param {Function} callback - is function(err,messageObj)
 *   messageObj contains responderFirstReplied and others.
 */
Redis.prototype.createMessage = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.createMessage, ';
  var req = params.req;
  if (!params.messageText){
    var err = self.newError({errorKey:'needParameter',messageParams:['messageText'],messagePrefix:messagePrefix,req:req});
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
  if (!params.receiverId){
    var err = self.newError({errorKey:'needParameter',messageParams:['receiverId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.dateSenderId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateSenderId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.dateResponderId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateResponderId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var messageText = params.messageText;
  var dateId = params.dateId;
  var senderId = params.senderId;
  var receiverId = params.receiverId;
  var dateSenderId = params.dateSenderId;
  var dateResponderId = params.dateResponderId;
  var onlySendToSingle = params.onlySendToSingle;

  var createTime = handy.getNowOfUTCdate().getTime()+'';
  self.client.incr('message', function(err, newId) {
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    var messageId = newId+'';
    var messageKey = 'message:'+messageId;
    var messageObj = {messageId:messageId, createTime:createTime, messageText:messageText, dateId:dateId, senderId:senderId, receiverId:receiverId};
    var paramsMessage = handy.toArray(messageKey,messageObj);
    var multi = self.client.multi();
    multi.hmset(paramsMessage);
    var dateSendUserActiveSendDatesKey = 'user:'+dateSenderId+':activeSendDates';
    var dateRespondUserActiveRespondDatesKey = 'user:'+dateResponderId+':activeRespondDates';
    var dateSendUserDateConversationsKey = 'user:'+dateSenderId+':dateConversations';
    var dateRespondUserDateConversationsKey = 'user:'+dateResponderId+':dateConversations';
    var dateResponderKey = 'date:'+dateId+':responder:'+dateResponderId;
    var dateRespondersKey = 'date:'+dateId+':responders';
    var dateActiveRespondersKey = 'date:'+dateId+':activeResponders';

    var curMultiRetDataIdx = 1;
    var responderAlreadyInApplySetIdx = -1;
    if (!onlySendToSingle || onlySendToSingle && receiverId ==dateResponderId){
      var responderActiveApplyingDatesKey = "user:"+dateResponderId+":activeApplyingDates";
      multi.zscore(responderActiveApplyingDatesKey,dateId);
      responderAlreadyInApplySetIdx = curMultiRetDataIdx;
      curMultiRetDataIdx++;
    }
    var responderFirstRepliedIdx = -1;
    if (!onlySendToSingle && senderId == dateResponderId){
      multi.hsetnx(dateResponderKey,'responderFirstReplied',1);
      responderFirstRepliedIdx = curMultiRetDataIdx;
      curMultiRetDataIdx++;
    }

    if (!onlySendToSingle){//normal case, no system user
      //only need once, but can do again
      multi.hmset(dateResponderKey,'dateId',dateId,'responderId',dateResponderId);
      if (senderId == dateResponderId){
        multi.sadd(dateRespondersKey,dateResponderId);
      }

      var sendUserDateMessagesKey = 'chat:date:'+dateId+':user:'+senderId+':targetUser:'+receiverId;
      multi.zadd(sendUserDateMessagesKey,createTime,messageId);
      var receiveUserDateMessagesKey = 'chat:date:'+dateId+':user:'+receiverId+':targetUser:'+senderId;
      multi.zadd(receiveUserDateMessagesKey,createTime,messageId);

      multi.zadd(dateSendUserActiveSendDatesKey,createTime,dateId);
      multi.zadd(dateRespondUserActiveRespondDatesKey,createTime,dateId);

      multi.zadd(dateSendUserDateConversationsKey,createTime,dateId+"+"+dateResponderId);
      multi.zadd(dateRespondUserDateConversationsKey,createTime,dateId+"+"+dateSenderId);
    }else{//onlySendToSingle be true, senderId should be a system user, some effect only take on the receiver
      var dateChatOtherUserId;
      if (receiverId == dateSenderId) dateChatOtherUserId = dateResponderId;
      else dateChatOtherUserId = dateSenderId;
      //only send to the receiver
      var receiveUserDateMessagesKey = 'chat:date:'+dateId+':user:'+receiverId+':targetUser:'+dateChatOtherUserId;
      multi.zadd(receiveUserDateMessagesKey,createTime,messageId);

      if (receiverId == dateSenderId){
        multi.zadd(dateSendUserActiveSendDatesKey,createTime,dateId);
        multi.zadd(dateSendUserDateConversationsKey,createTime,dateId+"+"+dateResponderId);
      }else{
        multi.zadd(dateRespondUserActiveRespondDatesKey,createTime,dateId);
        multi.zadd(dateRespondUserDateConversationsKey,createTime,dateId+"+"+dateSenderId);
      }
      //no need to set dateResponder because according to current v1.2 business logic, system message can not be first message to sender or responder.
    }//onlySendToSingle

    //any message caused by any action will refresh DateActiveResponders
    multi.zadd(dateActiveRespondersKey,createTime,dateResponderId);

    multi.exec(function(err,multiRetData){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        if (callback) return callback(err2);
        else return self.handleError({err:err2});
      }

      var responderAlreadyInApplySet = false;
      if (responderAlreadyInApplySetIdx >= 0){
        responderAlreadyInApplySet = !!multiRetData[responderAlreadyInApplySetIdx];
      }

      var responderFirstReplied = false;
      if (responderFirstRepliedIdx >= 0){
        responderFirstReplied = handy.convertToBool(multiRetData[responderFirstRepliedIdx]);
        messageObj.responderFirstReplied = responderFirstReplied;
      }

      if (!responderAlreadyInApplySet && !responderFirstReplied){//when do cancel confirm can cause such condition
        if (callback) return callback(null, messageObj);
        return;
      }

      var multi2 = self.client.multi();
      if (responderFirstReplied || !responderFirstReplied && responderAlreadyInApplySet){
        multi2.zadd(responderActiveApplyingDatesKey,createTime,dateId);
      }
      multi2.exec(function(err){
        if (err){
          var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
          if (callback) return callback(err2);
          else return self.handleError({err:err2});
        }
        if (callback) return callback(null, messageObj);
        return;
      });//multi2.exec
    });//multi.exec
  });//client.incr
};//createMessage



/**
 *
 *
 * @param {Object} params - contains messageText, dateId, userId, targetUserId, dateSenderId, dateResponderId,
 *   when userId be system user, responderId required
 *
 * @param {Function} callback - is function(err,sendMessageInfo)
 *   sendMessageInfo contains messageObj, modifyCreditInfo, responderFirstReplied
 *       modifyCreditInfo contains doneThisTime,creditTransactionObj
 */
Redis.prototype.sendMessageBusiness = function(params, callback) {
  //logger.logDebug("Redis.sendMessageBusiness entered, params="+util.inspect(params,false,100));
  var self = this;
  var messagePrefix = 'in Redis.sendMessageBusiness, ';
  var req = params.req;
  if (!params.messageText){
    var err = self.newError({errorKey:'needParameter',messageParams:['messageText'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.targetUserId){
    var err = self.newError({errorKey:'needParameter',messageParams:['targetUserId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.dateSenderId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateSenderId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.dateResponderId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateResponderId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var messageText = params.messageText;
  var dateId = params.dateId;
  var userId = params.userId;
  var targetUserId = params.targetUserId;
  var dateSenderId = params.dateSenderId;
  var dateResponderId = params.dateResponderId;
  if (userId == config.config.users.system.userId){//system user send to normal user case. NO any user send to system user case.
    self.createMessage({req:req,messageText:messageText, dateId:dateId, senderId:userId, receiverId:targetUserId,
    dateSenderId:dateSenderId, dateResponderId:dateResponderId, onlySendToSingle:true}, function(err,messageObj){
      if (err){
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      if (callback) return callback(null, {messageObj:messageObj});
      return;
    });//createMessage
    return;
  }

  self.createMessage({req:req,messageText:messageText, dateId:dateId, senderId:userId, receiverId:targetUserId,
  dateSenderId:dateSenderId, dateResponderId:dateResponderId, onlySendToSingle:false}, function(err,messageObj){
      if (err){
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      if (callback) return callback(null, {messageObj:messageObj});
      return;
  });//createMessage
  return;
};//sendMessageBusiness



Redis.prototype.setDateConversationViewed = function(params, callback) {
  //logger.logDebug("Redis.setDateConversationViewed entered, params="+util.inspect(params,false,100));
  var self = this;
  var messagePrefix = 'in Redis.setDateConversationViewed, ';
  var req = params.req;
  if (!params.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.targetUserId){
    var err = self.newError({errorKey:'needParameter',messageParams:['targetUserId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.dateSenderId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateSenderId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.dateResponderId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateResponderId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var dateId = params.dateId;
  var userId = params.userId;
  var targetUserId = params.targetUserId;
  var dateSenderId = params.dateSenderId;
  var dateResponderId = params.dateResponderId;
  var nowUtcTime = handy.getNowOfUTCdate().getTime();
  var userLastViewChatTimeFieldName = null;
  if(userId == dateSenderId){
    userLastViewChatTimeFieldName = "senderLastViewChatTime";
  }else{
    userLastViewChatTimeFieldName = "responderLastViewChatTime";
  }
  var dateResponderKey = "date:"+dateId+":responder:"+dateResponderId;
  var multi = self.client.multi();
  multi.hset(dateResponderKey,userLastViewChatTimeFieldName,nowUtcTime);
  multi.exec(function(err,multiRetData){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    if (callback) return callback(null);
    return;
  });//multi.exec
  return;
};//setDateConversationViewed


/**
* simply do. assume some checks have been done outside before calling this function.
* @param {Object} params - contains responderId, dateId, responderGender, respondTime
*   responderGender and respondTime are used for credit stat
* @param {Function} callback - is function(err,modifyCreditInfo).
*     modifyCreditInfo contains doneThisTime,creditTransactionObj.
*   if no err returned in callback, it means can go on to respond by sending message.
*/
Redis.prototype.chargeCreditForFirstRespond = function(params, callback) {
  //logger.logDebug("Redis.chargeCreditForFirstRespond entered, params="+util.inspect(params,false,100));
  var self = this;
  var messagePrefix = 'in Redis.chargeCreditForFirstRespond, ';
  var req = params.req;
  if (!params.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.responderId){
    var err = self.newError({errorKey:'needParameter',messageParams:['responderId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.responderGender){
    var err = self.newError({errorKey:'needParameter',messageParams:['responderGender'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.respondTime){
    var err = self.newError({errorKey:'needParameter',messageParams:['respondTime'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var dateId = params.dateId;
  var responderId = params.responderId;
  var responderGender = params.responderGender;
  var respondTime = params.respondTime;
  //user is responder and is possibly the first time to respond
  //should try to modify credit for firstRespondDate
  self.getUserCurrentCredit({req:req,userId:responderId}, function(err,responderCredit){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (responderCredit-0+config.config.creditDeltaForFirstRespondDate < 0){
      var err = self.newError({errorKey:'creditNotEnoughForRespond',messageParams:[''],messagePrefix:messagePrefix,req:req});
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    self.modifyCreditForFirstRespondDate({req:req,dateId:dateId,responderId:responderId, responderGender:responderGender, respondTime:respondTime}, function(err,modifyCreditInfo){
      if (err){
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      if (callback) return callback(null, modifyCreditInfo);
      return;
    });//modifyCreditForFirstRespondDate
  });//getUserCurrentCredit
  return;
};//chargeCreditForFirstRespond

/**
 * ASSUME that system user be not userId nor targetUserId, or else responderId may not be got
 * @param {Object} params - contains dateId, userId, targetUserId
 * @param {Function} callback - is function(err,dateAndResponderInfo)
 *   dateAndResponderInfo contains dateObj, repsonderObj
 *     dateObj contains dateId, senderId, dateDate,
 *     repsonderObj contains responderId, senderConfirmed, senderConfirmTime, badRate,goodRate,badRateSender,goodRateSender, haveBeenRated, haveRate
 *   here we do not check userId and targetUserId did have date relation when responderHasReplied=false
 *
 */
Redis.prototype.getDateAndResponderInfo = function(params, callback) {
  //logger.logDebug("Redis.getDateAndResponderInfo entered, params="+util.inspect(params,false,100));
  var self = this;
  var messagePrefix = 'in Redis.getDateAndResponderInfo, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.targetUserId){
    var err = self.newError({errorKey:'needParameter',messageParams:['targetUserId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var dateId = params.dateId;
  var userId = params.userId;
  var targetUserId = params.targetUserId;

  if (userId == config.config.users.system.userId || targetUserId == config.config.users.system.userId){
    var err = self.newError({errorKey:'canNotSupportSystemUser',messageParams:[],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var multi = self.client.multi();
  var dateKey = 'date:'+dateId;
  multi.hmget(dateKey,'dateId','senderId','dateDate');
  var dateResponderKey1 = 'date:'+dateId+':responder:'+userId;
  var dateResponderKey2 = 'date:'+dateId+':responder:'+targetUserId;
  multi.hmget(dateResponderKey1,'dateId','responderId','senderConfirmed','senderConfirmTime','badRate','goodRate','badRateSender','goodRateSender');
  multi.hmget(dateResponderKey2,'dateId','responderId','senderConfirmed','senderConfirmTime','badRate','goodRate','badRateSender','goodRateSender');
  multi.exec(function(err,multiRetData){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      return callback(err2);
    }
    var dateInfo = multiRetData[0];
    if (!dateInfo || dateInfo.length==0 || !dateInfo[0]){
      var err = self.newError({errorKey:'dateNotExist',messageParams:[dateId],messagePrefix:messagePrefix,req:req});
      return callback(err2);
    }
    var gotDateId = dateInfo[0];
    var senderId = dateInfo[1];
    var dateDate = dateInfo[2];
//    var senderLastConfirmTime = dateInfo[3];
//    var alreadyStopped = handy.convertToBool(dateInfo[4]);
    var dateObj = {dateId:gotDateId, senderId:senderId, dateDate:dateDate};

    var userAsResponderInfo = multiRetData[1];
    var targetUserAsResponderInfo = multiRetData[2];
    var responderId, repsonderInfo;
    if (senderId == userId){
      responderId = targetUserId;
      repsonderInfo = targetUserAsResponderInfo;
    }else{
      responderId = userId;
      repsonderInfo = userAsResponderInfo;
    }
    if (!repsonderInfo || repsonderInfo.length==0 || !repsonderInfo[0]){
      var err = self.newError({errorKey:'dateResponderNotExist',messageParams:[dateId,responderId],messagePrefix:messagePrefix,req:req});
      return callback(err2);
    }
    //here we can not use repsonderInfo.latestMessageId to judge responderHasReplied because the 1st and only one message may be created by sender
    var senderConfirmed = handy.convertToBool(repsonderInfo[2]);
    var senderConfirmTime = repsonderInfo[3];
    var badRate = repsonderInfo[4];
    var goodRate = repsonderInfo[5];
    var badRateSender = repsonderInfo[6];
    var goodRateSender = repsonderInfo[7];
    var haveBeenRated  = handy.convertToBool(badRate) || handy.convertToBool(goodRate);
    var haveRate = handy.convertToBool(badRateSender) || handy.convertToBool(goodRateSender);

    var repsonderObj = {responderId:responderId, senderConfirmed:senderConfirmed, senderConfirmTime:senderConfirmTime,
          badRate:badRate, goodRate:goodRate, badRateSender:badRateSender, goodRateSender:goodRateSender,
          haveBeenRated:haveBeenRated, haveRate:haveRate};
    var outData = {dateObj:dateObj, repsonderObj:repsonderObj};
    if (callback) return callback(null, outData);
    return;
  });//multi.exec
  return;
};//getDateAndResponderInfo



/**
 * ASSUME that system user be not userId nor targetUserId, or else responderId may not be got
 *
 * @param {Object} params - contains dateId, userId, targetUserId
 * @param {Function} callback - is function(err,dateConfirmInfo)
 *   dateConfirmInfo contains dateId,senderId,responderId, finalCandidateId
 *
 * here we do not check userId and targetUserId did have date relation
 *
 */
Redis.prototype.getDateConfirmInfo = function(params, callback) {
  //logger.logDebug("Redis.getDateConfirmInfo entered, params="+util.inspect(params,false,100));
  var self = this;
  var messagePrefix = 'in Redis.getDateConfirmInfo, ';
  var req = params.req;
  if (!params.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.targetUserId){
    var err = self.newError({errorKey:'needParameter',messageParams:['targetUserId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var dateId = params.dateId;
  var userId = params.userId;
  var targetUserId = params.targetUserId;
  if (userId == config.config.users.system.userId || targetUserId == config.config.users.system.userId){
    if (callback) return callback(null, null);
    return;
  }
  var multi = self.client.multi();
  var dateKey = 'date:'+dateId;
  multi.hmget(dateKey,'dateId','senderId','finalCandidateId');
  multi.exec(function(err,multiRetData){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    var dateInfoAry = multiRetData[0];
    var senderId = dateInfoAry[1];
    var finalCandidateId = dateInfoAry[2];

    var responderId;
    if (senderId == userId){
      responderId = targetUserId;
    }else{
      responderId = userId;
    }

    var outData = {dateId:dateId,senderId:senderId,responderId:responderId};
    if (finalCandidateId) outData.finalCandidateId = finalCandidateId;
    if (callback) return callback(null, outData);
    return;
  });//multi.exec
};//getDateConfirmInfo


/**
*
*
* redis data types:
*
* @param {Object} params - contains dateId
* @param {Function} callback - is function(err,bothConfirmed)
*/
Redis.prototype.IsBothConfirmDateD = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.IsBothConfirmDate, ';
  var self = this;
  if (!params.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var dateId = params.dateId;
  var dateKey = 'date:'+dateId;
  var multi = self.client.multi();
  multi.hmget(dateKey,'senderConfirmed','candidateConfirmed');
  multi.exec(function(err,retData){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    var confirmInfoAry = retData[0];
    var senderConfirmed = Boolean(confirmInfoAry[0]);
    var candidateConfirmed = Boolean(confirmInfoAry[1]);
    var bothConfirmed = senderConfirmed && candidateConfirmed;
    if (callback) return callback(null,bothConfirmed);
    return;
  });//multi.exec
};//IsBothConfirmDate





/**
 *
 *
 * @param {Object} params - contains dateId, senderId, responderId, dateDate
 * @param {Function} callback - is function(err,confirmInfo)
 *   confirmInfo contain confirmTime.
 *
 */
Redis.prototype.ConfirmDateByCreator = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.ConfirmDateByCreator, ';
  var req = params.req;
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
  if (!params.responderId){
    var err = self.newError({errorKey:'needParameter',messageParams:['responderId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.dateDate){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateDate'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var dateId = params.dateId;
  var senderId = params.senderId;
  var responderId = params.responderId;
  var dateDate = params.dateDate;
  var orderScore = shuffle.generateDateDateScore({dateInMs:dateDate, lowSeqPart:senderId});

  var nowTime = handy.getNowOfUTCdate().getTime()+'';
  var multi = self.client.multi();
  var dateKey = 'date:'+dateId;
  //multi.hset(dateKey,'senderLastConfirmTime',nowTime);

  var dateResponderKey = 'date:'+dateId+':responder:'+responderId;
  multi.hset(dateResponderKey,'senderConfirmed',true);
  multi.hset(dateResponderKey,'senderConfirmTime',nowTime);

//  var sendUserScheduleDatesKey = 'user:'+senderId+':scheduleDates';
//  var respondUserScheduleDatesKey = 'user:'+responderId+':scheduleDates';
//  multi.zadd(sendUserScheduleDatesKey,dateDate,dateId);
//  multi.zadd(respondUserScheduleDatesKey,dateDate,dateId);
//  var allScheduleDatesKey = 'allScheduleDates';
//  multi.zadd(allScheduleDatesKey,dateDate,dateId);
  var respondUserInvitedDatesKey = 'user:'+responderId+':invitedDates';
  multi.zadd(respondUserInvitedDatesKey,dateDate,dateId);
  var userActiveApplyingDatesKey = "user:"+responderId+":activeApplyingDates";
  multi.zrem(userActiveApplyingDatesKey,dateId);

  var sendUserActiveSendDatesKey = 'user:'+senderId+':activeSendDates';
  var respondUserActiveRespondDatesKey = 'user:'+responderId+':activeRespondDates';
  multi.zadd(sendUserActiveSendDatesKey,nowTime,dateId);
  multi.zadd(respondUserActiveRespondDatesKey,nowTime,dateId);

  multi.exec(function(err,retData){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    if (callback) return callback(null,{confirmTime:nowTime});
    return;
  });//multi.exec
};//ConfirmDateByCreator

/**
*
*
* @param {Object} params - contains dateId, senderId, responderId
* @param {Function} callback - is function(err,cancelInfo)
*   cancelInfo contain nothing.
*
*/
Redis.prototype.CancelConfirmDateByCreator = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.CancelConfirmDateByCreator, ';
  var req = params.req;
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
  if (!params.responderId){
    var err = self.newError({errorKey:'needParameter',messageParams:['responderId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var dateId = params.dateId;
  var senderId = params.senderId;
  var responderId = params.responderId;

  var nowTime = handy.getNowOfUTCdate().getTime()+'';
  var multi = self.client.multi();
  var dateKey = 'date:'+dateId;

  var dateResponderKey = 'date:'+dateId+':responder:'+responderId;
  multi.hset(dateResponderKey,'senderConfirmed',false);
  multi.hdel(dateResponderKey,'senderConfirmTime');

  var respondUserInvitedDatesKey = 'user:'+responderId+':invitedDates';
  multi.zrem(respondUserInvitedDatesKey,dateId);
  var userActiveApplyingDatesKey = "user:"+responderId+":activeApplyingDates";
  multi.zadd(userActiveApplyingDatesKey,nowTime,dateId);

  var sendUserActiveSendDatesKey = 'user:'+senderId+':activeSendDates';
  var respondUserActiveRespondDatesKey = 'user:'+responderId+':activeRespondDates';
  multi.zadd(sendUserActiveSendDatesKey,nowTime,dateId);
  multi.zadd(respondUserActiveRespondDatesKey,nowTime,dateId);
  multi.exec(function(err,retData){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    if (callback) return callback(null,{});
    return;
  });//multi.exec
};//CancelConfirmDateByCreator


/**
 *
 *
 * @param {Object} params - contains dateId
 * @param {Function} callback - is function(err,stopInfo)
 *   stopInfo contain .
 *
 */
Redis.prototype.stopDateD = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.stopDate, ';
  var req = params.req;
  if (!params.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var dateId = params.dateId;
  var multi = self.client.multi();
  var dateKey = 'date:'+dateId;
  multi.hset(dateKey,'alreadyStopped',1);
  multi.exec(function(err,retData){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    if (callback) return callback(null,null);
    return;
  });//multi.exec
};//stopDate


/**
* all check should be done outside
*
* @param {Object} params - contains dateId, senderId, responderId, type=good|bad
* @param {Function} callback - is function(err,rateInfo)
*   rateInfo contains targetUserGoodRateCount
*/
Redis.prototype.RateByDateSender = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.RateByDateSender, ';
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.senderId){
    var err = self.newError({errorKey:'needParameter',messageParams:['senderId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.responderId){
    var err = self.newError({errorKey:'needParameter',messageParams:['responderId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.type){
    var err = self.newError({errorKey:'needParameter',messageParams:['type'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var dateId = params.dateId;
  var senderId = params.senderId;
  var responderId = params.responderId;
  var type = params.type;

  var nowTime = handy.getNowOfUTCdate().getTime()+'';
  var multi = self.client.multi();
  var dateKey = "date:"+dateId;
  var responderUserKey = "user:"+responderId;
  var dateResponderKey = "date:"+dateId+":responder:"+responderId;

  if (type == "good"){
    multi.hincrby(responderUserKey,'goodRateCount',1);
    multi.hincrby(dateResponderKey,'goodRate',1);
  }else{
    multi.hincrby(responderUserKey,'badRateCount',1);
    multi.hincrby(dateResponderKey,'badRate',1);
  }
  multi.hget(responderUserKey,'goodRateCount');
  multi.exec(function(err,multiRetData){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      return callback(err2);
    }
    var targetUserGoodRateCount = multiRetData[2];
    return callback(null,{targetUserGoodRateCount:targetUserGoodRateCount});
  });//multi.exec
};//RateByDateSender


/**
* all check should be done outside
*
* @param {Object} params - contains dateId, senderId, responderId, type=good|bad
* @param {Function} callback - is function(err,rateInfo)
*   rateInfo contains targetUserGoodRateCount
*/
Redis.prototype.RateByDateResponder = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.RateByDateResponder, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.senderId){
    var err = self.newError({errorKey:'needParameter',messageParams:['senderId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.responderId){
    var err = self.newError({errorKey:'needParameter',messageParams:['responderId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.type){
    var err = self.newError({errorKey:'needParameter',messageParams:['type'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var dateId = params.dateId;
  var senderId = params.senderId;
  var responderId = params.responderId;
  var type = params.type;

  var nowTime = handy.getNowOfUTCdate().getTime()+'';
  var multi = self.client.multi();
  var dateKey = "date:"+dateId;
  var senderUserKey = "user:"+senderId;
  var dateResponderKey = "date:"+dateId+":responder:"+responderId;
  if (type == "good"){
    multi.hincrby(senderUserKey,'goodRateCount',1);
    multi.hincrby(dateResponderKey,'goodRateSender',1);
    multi.hincrby(dateKey,'goodRateCount',1);
  }else{
    multi.hincrby(senderUserKey,'badRateCount',1);
    multi.hincrby(dateResponderKey,'badRateSender',1);
    multi.hincrby(dateKey,'badRateCount',1);
  }
  multi.hget(senderUserKey,'goodRateCount');
  multi.exec(function(err,multiRetData){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      return callback(err2);
    }
    var targetUserGoodRateCount = multiRetData[3];
    return callback(null,{targetUserGoodRateCount:targetUserGoodRateCount});
  });//multi.exec
};//RateByDateResponder


/**
* all check should be done outside
*
* @param {Object} params - contains dateId, userId, targetUserId, senderId, type=good|bad
* @param {Function} callback - is function(err,rateInfo)
*   rateInfo contains targetUserGoodRateCount
*
*/
Redis.prototype.RateByDateParticipant = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.RateByDateParticipant, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.dateId){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.targetUserId){
    var err = self.newError({errorKey:'needParameter',messageParams:['targetUserId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.senderId){
    var err = self.newError({errorKey:'needParameter',messageParams:['senderId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.type){
    var err = self.newError({errorKey:'needParameter',messageParams:['type'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var dateId = params.dateId;
  var userId = params.userId;
  var targetUserId = params.targetUserId;
  var senderId = params.senderId;
  var type = params.type;
  var responderId;

  if (userId == senderId){
    responderId = targetUserId;
    self.RateByDateSender({req:req,dateId:dateId, senderId:senderId, responderId:responderId, type:type}, function(err,rateInfo){
      if (err) return callback(err);
      return callback(null,rateInfo);
    });//RateByDateSender
    return;
  }else{
    responderId = userId;
    self.RateByDateResponder({req:req,dateId:dateId, senderId:senderId, responderId:responderId, type:type}, function(err,rateInfo){
      if (err) return callback(err);
      return callback(null,rateInfo);
    });//RateByDateResponder
    return;
  }
};//RateByDateParticipant



/**
 * business function. NOT needed from this time.
 * when user change location, all user photos should change location
 *
 * @param {Object} params - contains userId, latlng, region, geolibType
 * @param {Function} callback - is function(err,updateInfo)
 *   updateInfo contains updated, regionObj,regions,countyLocation,cityLocation
 */
Redis.prototype.updateUserLocationD = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.updateUserLocation, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.latlng){
    var err = self.newError({errorKey:'needParameter',messageParams:['latlng'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.region){
    var err = self.newError({errorKey:'needParameter',messageParams:['region'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.geolibType){
    var err = self.newError({errorKey:'needParameter',messageParams:['geolibType'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var userId = params.userId;
  var latlng = params.latlng;
  var region = params.region;
  var geolibType = params.geolibType;

  var regionInfo = handy.getCentainLevelRegion({region:region,geolibType:geolibType,regionLevel:4});
  if (regionInfo.err){
    return callback(regionInfo.err);
  }
  var regionJSONstr = JSON.stringify(regionInfo.regionObj);
  var countyLocation = regionInfo.centainLevelRegion;
  var regionInfo2 = handy.getCentainLevelRegion({regions:regionInfo.regions,regionLevel:3});
  var cityLocation = regionInfo2.centainLevelRegion;

  var nowTime = handy.getNowOfUTCdate().getTime()+'';

  self.getUser({req:req,userId:userId,userFields:['userId','gender','latlng','region','geolibType','deviceType','countyLocation']}, function(err,userObj){
    if (err){
      return callback(err);
    }
    if (!userObj || !userObj.userId){
      var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
      return callback(err);
    }
    if(userObj.latlng == latlng){
      //need not update for not change
      if (callback) return callback(null,{updated:false,regionObj:regionInfo.regionObj,regions:regionInfo.regions,countyLocation:countyLocation,cityLocation:cityLocation});
      return;
    }
    var oldRegionInfo = handy.getCentainLevelRegion({region:userObj.region,geolibType:userObj.geolibType,regionLevel:4});
    if (oldRegionInfo.err){
      return callback(oldRegionInfo.err);
    }
    var oldCountyLocation = oldRegionInfo.centainLevelRegion;
    var oldRegionInfo2 = handy.getCentainLevelRegion({regions:oldRegionInfo.regions,regionLevel:3});
    var oldCityLocation = oldRegionInfo2.centainLevelRegion;

    var countyLocationChanged = (oldCountyLocation != countyLocation);
    var gender = userObj.gender;
    var userBeNormal = (userObj.auditPassedPhotoCount > 0);
    self.updateUser({req:req,userId:userId,updateFields:{latlng:latlng, region:regionJSONstr, geolibType:geolibType, countyLocation:countyLocation, lastRegionUpdateTime:nowTime}}, function(err){
      if (err){
        return callback(err);
      }

      var multi = self.client.multi();
      var regionToCountyKey = 'regionToCounty';
      var regionToCityKey = 'regionToCity';
      multi.sadd(regionToCountyKey,countyLocation);
      multi.sadd(regionToCityKey,cityLocation);
      if (countyLocationChanged){
        //because photo has no relation to location for now, so need not deal about photo
        if (userBeNormal){
          var oldRegionNormalUsersKey = 'region:'+oldCityLocation+':normalUsers:'+gender;
          var oldCountyregionNormalUsersKey = 'countyregion:'+oldCountyLocation+':normalUsers:'+gender;
          var regionNormalUsersKey = 'region:'+cityLocation+':normalUsers:'+gender;
          var countyregionNormalUsersKey = 'countyregion:'+countyLocation+':normalUsers:'+gender;
          multi.zrem(oldRegionNormalUsersKey,userId);
          multi.zrem(oldCountyregionNormalUsersKey,userId);
          multi.zadd(regionNormalUsersKey,nowTime,userId);
          multi.zadd(countyregionNormalUsersKey,nowTime,userId);
        }
      }
      multi.exec(function(err){
        if (err){
          var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
          return callback(err2);
        }
        if (callback) return callback(null, {regionObj:regionInfo.regionObj,regions:regionInfo.regions,countyLocation:countyLocation,cityLocation:cityLocation});
        return;
      });//multi.exec
    });//self.updateUser

  });//getUser
};//updateUserLocation


/**
 *
 * @param params - contains userId, deviceRegIdToken
 * @param callback
 * @returns
 */
Redis.prototype.updateUserAppToken = function(params, callback){
  var self = this;
  var messagePrefix = 'in Redis.updateUserAppToken, ';
  var req = params.req;
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (params.deviceRegIdToken == null){
    var err = self.newError({errorKey:'needParameter',messageParams:['deviceRegIdToken'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var userId = params.userId;
  var deviceRegIdToken = params.deviceRegIdToken;
  var userKey = 'user:'+userId;
  if (deviceRegIdToken){
    self.client.hset(userKey,'appToken',deviceRegIdToken,function(err){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        if (callback) return callback(err2);
        else return self.handleError({err:err2});
      }
      if (callback) return callback(null);
    });
    return;
  }else{
    self.client.hdel(userKey,'appToken',function(err){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        if (callback) return callback(err2);
        else return self.handleError({err:err2});
      }
      if (callback) return callback(null);
    });
    return;
  }
};//updateUserAppToken


Redis.prototype.getUserAppTokens = function(params, callback){
  var self = this;
  var messagePrefix = 'in Redis.getUserAppTokens, ';
  var req = params.req;
  if (!params.userIds){
    var err = self.newError({errorKey:'needParameter',messageParams:['userIds'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var userIds = params.userIds;
  if (userIds.length==0){
    if (callback) return callback(null, {});
    return;
  }
  var multi = self.client.multi();
  for(var i=0; i<userIds.length; i++){
    var userId = userIds[i];
    var userKey = 'user:'+userId;
    multi.hget(userKey,'appToken');
  }//for
  multi.exec(function(err,regIdTokens){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    if (callback) return callback(null, regIdTokens);
    return;
  });//multi.exec
};//getUserAppTokens

Redis.prototype.getUserAppToken = function(params, callback){
  var self = this;
  var req = params.req;
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var userId = params.userId;
  self.getUserAppTokens({req:req,userIds:[userId]}, function(err,regIdTokens){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    var regIdToken = regIdTokens[0];
    if (callback) return callback(null, regIdToken);
    return;
  });//getUserAppTokens
};//getUserAppToken

Redis.prototype.getC2dmAuth = function(params,callback){
  var self = this;
  var req = params.req;
  var cachedValueKey = 'cachedValue';
  var c2dmAuthField = 'c2dmAuth';
  self.client.hget(cachedValueKey,c2dmAuthField,function(err,c2dmAuth){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    if (callback) return callback(null, c2dmAuth);
    return;
  });//client.get
};//getC2dmAuth

/**
 *
 * @param params - contains auth
 *   if auth is empty, it means to del
 * @param callback
 * @returns
 */
Redis.prototype.setC2dmAuth = function(params, callback){
  var self = this;
  var req = params.req;
  var auth = params.auth;
  var cachedValueKey = 'cachedValue';
  var c2dmAuthField = 'c2dmAuth';
  if (auth){
    self.client.hset(cachedValueKey,c2dmAuthField,auth,function(err){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        if (callback) return callback(err2);
        else return self.handleError({err:err2});
      }
      if (callback) return callback(null);
    });//set
    return;
  }else{
    self.client.hdel(cachedValueKey,c2dmAuthField,function(err){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        if (callback) return callback(err2);
        else return self.handleError({err:err2});
      }
      if (callback) return callback(null);
    });
    return;
  }
};//setC2dmAuth




/**
* here just update about male count, female count, newDaily count
*
* @param {Object} params - contains userId, gender, updateTime
* @param {Function} callback - is function(err)
*
*/
Redis.prototype.updateUserStat = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.updateUserStat, ';
  var req = params.req;
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.gender){
    var err = self.newError({errorKey:'needParameter',messageParams:['gender'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var userId = params.userId;
  var gender = params.gender;
  var updateTime = params.updateTime;
  if (!updateTime) updateTime = handy.getNowOfUTCdate().getTime();
  var newDailyField = 'newDaily' + handy.formatDate({dt:updateTime,needUTC:false,needSeparateChar:false,onlyDatePart:true}) ;
  var userStatKey = 'userStat';
  var multi = self.client.multi();
  if(gender.toLowerCase() == 'male')  multi.hincrby(userStatKey,'male',1);
  else multi.hincrby(userStatKey,'female',1);
  multi.hincrby(userStatKey,newDailyField,1);
  multi.exec(function(err){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    if (callback) return callback(null);
    return;
  });//multi.exec
};//updateUserStat


/**
* here just update about activeDaily count
*
* @param {Object} params - contains userId, updateTime
* @param {Function} callback - is function(err,alreadyUpdateThisDay)
*
*/
Redis.prototype.updateUserStatDailyActive = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.updateUserStatDailyActive, ';
  var req = params.req;
  if (!params.userId){
    var err = self.newError({errorKey:'needParameter',messageParams:['userId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var userId = params.userId;
  var updateTime = params.updateTime;
  if (!updateTime) updateTime = handy.getNowOfUTCdate().getTime();
  var datePart = handy.formatDate({dt:updateTime,needUTC:false,needSeparateChar:false,onlyDatePart:true});
  var activeDailyField = 'activeDaily' + datePart ;
  var userStatKey = 'userStat';
  var userActiveDailyKey = 'userActiveDaily' + datePart ;
  self.client.sismember(userActiveDailyKey,userId,function(err,isMemberFlag){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    var isMember = handy.convertToBool(isMemberFlag);
    var alreadyUpdateThisDay = isMember;
    if (alreadyUpdateThisDay){
      if (callback) return callback(null,alreadyUpdateThisDay);
      return;
    }
    var multi = self.client.multi();
    multi.sadd(userActiveDailyKey,userId);
    multi.hincrby(userStatKey,activeDailyField,1);
    multi.exec(function(err){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        if (callback) return callback(err2);
        else return self.handleError({err:err2});
      }
      if (callback) return callback(null,alreadyUpdateThisDay);
      return;
    });//multi.exec
  });//client.sismember
};//updateUserStatDailyActive



/**
*
*
* @param {Object} params - contains photoId, photoOwnerGender, uploadTime, isDelete
*   if uploadTime exists, will update uploadDaily count
* @param {Function} callback - is function(err)
*
*/
Redis.prototype.updatePhotoStat = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.updatePhotoStat, ';
  var req = params.req;
  if (!params.photoId){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoId'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.photoOwnerGender){
    var err = self.newError({errorKey:'needParameter',messageParams:['photoOwnerGender'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var photoId = params.photoId;
  var photoOwnerGender = params.photoOwnerGender;
  var uploadTime = params.uploadTime;
  var isDelete = params.isDelete;
  var countDelta = 1;
  if (isDelete) countDelta = countDelta * -1;
  var photoStatKey = 'photoStat';
  var multi = self.client.multi();
  if(photoOwnerGender.toLowerCase() == 'male')  multi.hincrby(photoStatKey,'male',countDelta);
  else multi.hincrby(photoStatKey,'female',countDelta);
  if (uploadTime){
    var uploadDailyField = 'uploadDaily' + handy.formatDate({dt:uploadTime,needUTC:false,needSeparateChar:false,onlyDatePart:true}) ;
    multi.hincrby(photoStatKey,uploadDailyField,1);
  }
  multi.exec(function(err){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    if (callback) return callback(null);
    return;
  });//multi.exec
};//updatePhotoStat



/**
*
* @param {Object} params - contains likeType, likeTime
* @param {Function} callback - is function(err)
*
*/
Redis.prototype.updateLikeStat = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.updateLikeStat, ';
  var req = params.req;
  if (!params.likeType){
    var err = self.newError({errorKey:'needParameter',messageParams:['likeType'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.likeTime){
    var err = self.newError({errorKey:'needParameter',messageParams:['likeTime'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var likeType = params.likeType;
  var likeTime = params.likeTime;
  var likeStatKey = 'likeStat';
  var multi = self.client.multi();
  if (likeType.toLowerCase() == "like"){
    multi.hincrby(likeStatKey,'like',1);
    var likeDailyField = 'likeDaily' + handy.formatDate({dt:likeTime,needUTC:false,needSeparateChar:false,onlyDatePart:true}) ;
    multi.hincrby(likeStatKey,likeDailyField,1);
  }else{
    multi.hincrby(likeStatKey,'unlike',1);
    var unlikeDailyField = 'unlikeDaily' + handy.formatDate({dt:likeTime,needUTC:false,needSeparateChar:false,onlyDatePart:true}) ;
    multi.hincrby(likeStatKey,unlikeDailyField,1);
  }
  multi.exec(function(err){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    if (callback) return callback(null);
    return;
  });//multi.exec
};//updateLikeStat



/**
*
* @param {Object} params - contains
*     directReturn,
*     createUserGender(optional), createTime(optional),
*     confirmType(optional confirm|cancel), confirmTime(optional)
* @param {Function} callback - is function(err)
*
*/
Redis.prototype.updateDateStat = function(params, callback) {
  //logger.logDebug("Redis.updateDateStat entered, params="+util.inspect(params,false,100));
  var messagePrefix = 'in Redis.updateDateStat, ';
  var self = this;
  var req = params.req;
  var directReturn = params.directReturn;
  if (directReturn){
    if (callback) return callback(null);
    return;
  }

  var createUserGender = params.createUserGender;
  var createTime = params.createTime;
  var whoPay = params.whoPay;

  var confirmType = params.confirmType;
  var confirmTime = params.confirmTime;

  var dateStatKey = 'dateStat';
  var multi = self.client.multi();
  if(createUserGender){
    if (!createTime){
      var err = self.newError({errorKey:'needParameter',messageParams:['createTime'],messagePrefix:messagePrefix,req:req});
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }

    if(createUserGender.toLowerCase() == "male"){
      multi.hincrby(dateStatKey,'maleCreate',1);
    }else{
      multi.hincrby(dateStatKey,'femaleCreate',1);
    }
    var newDailyField = 'newDaily' + handy.formatDate({dt:createTime,needUTC:false,needSeparateChar:false,onlyDatePart:true}) ;
    multi.hincrby(dateStatKey,newDailyField,1);
//    if(whoPay-0 == 0){
//      multi.hincrby(dateStatKey,'treat',1);
//    }else{
//      multi.hincrby(dateStatKey,'wish',1);
//    }
  }
  if(confirmType){
    if (confirmType == "confirm" && !confirmTime){
      var err = self.newError({errorKey:'needParameter',messageParams:['confirmTime'],messagePrefix:messagePrefix,req:req});
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (confirmType == "confirm"){
      multi.hincrby(dateStatKey,'confirmed',1);

      var confirmedDailyField = 'confirmedDaily' + handy.formatDate({dt:confirmTime,needUTC:false,needSeparateChar:false,onlyDatePart:true}) ;
      multi.hincrby(dateStatKey,confirmedDailyField,1);
    }else{
      multi.hincrby(dateStatKey,'confirmed',-1);
    }
  }
  multi.exec(function(err){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    if (callback) return callback(null);
    return;
  });//multi.exec
};//updateDateStat


/**
*
* @param {Object} params - contains none
* @param {Function} callback - is function(err)
*
*/
Redis.prototype.updateDateStatForAtLeastOneResponseD = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.updateDateStatForAtLeastOneResponse, ';
  var req = params.req;

  var dateStatKey = 'dateStat';
  var multi = self.client.multi();
  multi.hincrby(dateStatKey,'respondedDateCount',1);
  multi.exec(function(err){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    if (callback) return callback(null);
    return;
  });//multi.exec
};//updateDateStatForAtLeastOneResponse




/**
*
* @param params - contains nothing
* @param callback - is a function(err, statData)
*/
Redis.prototype.getStat = function(params, callback){
  var self = this;
  var messagePrefix = 'in Redis.getStat, ';
  var req = params.req;

  var multi = self.client.multi();
  var userStatKey = 'userStat';
  var photoStatKey = 'photoStat';
  var likeStatKey = 'likeStat';
  var dateStatKey = 'dateStat';
  var followStatKey = 'followStat';
  var creditStatKey = 'creditStat';
  multi.hgetall(userStatKey);
  multi.hgetall(photoStatKey);
  multi.hgetall(likeStatKey);
  multi.hgetall(dateStatKey);
  multi.hgetall(followStatKey);
  multi.hgetall(creditStatKey);
  multi.exec(function(err,multiRetData){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    var userStatData = multiRetData[0];
    var photoStatData = multiRetData[1];
    var likeStatData = multiRetData[2];
    var dateStatData = multiRetData[3];
    var followStatData = multiRetData[4];
    var creditStatData = multiRetData[5];
    self.getMaxLikeCount({req:req}, function(err, maxLikeCount){
      if (err){
        if (callback) return callback(err);
        else return self.handleError({err:err});
      }
      if (maxLikeCount > 0){
        if (likeStatData == null) likeStatData = {};
        likeStatData.maxLikeCount = maxLikeCount;
      }
      if (callback){
        return callback(null, {userStat:userStatData, photoStat:photoStatData, likeStat:likeStatData,
          dateStat:dateStatData, followStat:followStatData, creditStat:creditStatData});
      }
      return;
    });//getMaxLikeCount
  });//multi.exec
};//getStat

/**
*
* @param params - contains nothing
* @param callback - is a function(err, maxLikeCount)
*/
Redis.prototype.getMaxLikeCount = function(params, callback){
  var self = this;
  var messagePrefix = 'in Redis.getMaxLikeCount, ';
  var req = params.req;
  self.getRegions({req:req},function(err,regionsInfo){
    if (err){
      if (callback) return callback(err);
      else return self.handleError({err:err});
    }
    if (!regionsInfo){
      if (callback) return callback(null,0);
      return;
    }
    var regions = regionsInfo.regions;
    if(!regions || regions.length==0){
      if (callback) return callback(null,0);
      return;
    }

    var multi = self.client.multi();
    for(var i=0; i<regions.length; i++){
      var region = regions[i];
      var regionHotPhotosMaleKey = 'region:'+region+':hotPhotos:male';
      var regionHotPhotosFemaleKey = 'region:'+region+':hotPhotos:female';
      multi.zrevrange(regionHotPhotosMaleKey,0,0,'WITHSCORES');
      multi.zrevrange(regionHotPhotosFemaleKey,0,0,'WITHSCORES');
    }//for
    multi.exec(function(err,multiRetValues){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        if (callback) return callback(err2);
        else return self.handleError({err:err2});
      }
      //logger.logDebug("in Redis.getMaxLikeCount, multiRetValues="+util.inspect(multiRetValues,false,100));
      var maxLikeCount = 0;
      var malePhotoMaxLikeCount = null;
      var femalePhotoMaxLikeCount = null;
      for(var i=0; i<multiRetValues.length; i+=2){
        var regionHotestMalePhotoInfo = multiRetValues[i+0];
        var regionHotestFemalePhotoInfo = multiRetValues[i+1];

        if (regionHotestMalePhotoInfo && regionHotestMalePhotoInfo.length>0){
          malePhotoMaxLikeCount = Number(regionHotestMalePhotoInfo[1]);
          if (maxLikeCount < malePhotoMaxLikeCount){
            maxLikeCount = malePhotoMaxLikeCount;
          }
        }
        if (regionHotestFemalePhotoInfo && regionHotestFemalePhotoInfo.length>0){
          femalePhotoMaxLikeCount = Number(regionHotestFemalePhotoInfo[1]);
          if (maxLikeCount < femalePhotoMaxLikeCount){
            maxLikeCount = femalePhotoMaxLikeCount;
          }
        }
      }//for
      if (callback) return callback(null,maxLikeCount);
      return;
    });//multi.exec
  });//getRegions
};//getMaxLikeCount





/**
* those dateIds got will be removed from the queue.
* and will clear those before fromTime.
*
* @param params - contains fromTime, toTime, batchCount
* @param callback - is a function(err, dateIds)
*
*/
Redis.prototype.shiftToNotifyDate = function(params, callback){
  var self = this;
  var messagePrefix = 'in Redis.shiftToNotifyDate, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.fromTime){
    var err = self.newError({errorKey:'needParameter',messageParams:['fromTime'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.toTime){
    var err = self.newError({errorKey:'needParameter',messageParams:['toTime'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.batchCount || params.batchCount <= 0 ){
    var err = self.newError({errorKey:'needParameter',messageParams:['batchCount > 0'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var fromTime = params.fromTime;
  var toTime = params.toTime;
  var batchCount = params.batchCount;

  var allDoubleConfirmDatesKey = 'allDoubleConfirmDates';
  var multiGet = self.client.multi();
  multiGet.zrangebyscore(allDoubleConfirmDatesKey,fromTime,toTime,'LIMIT',0,batchCount);
  multiGet.exec(function(err,multiRetValues){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    var dateIds = multiRetValues[0];
    if (!dateIds || dateIds.length==0){
      dateIds = null;
    }
    var multiMark = self.client.multi();
    multiMark.zremrangebyscore(allDoubleConfirmDatesKey,'-inf','('+fromTime);//remove expired
    if (dateIds){
      //here only remove the dateIds from the zset. not change the flag date.haveSendNotificationForBothSide
      for(var i=0; i<dateIds.length; i++){
        var dateId = dateIds[i];
        multiMark.zrem(allDoubleConfirmDatesKey,dateId);
      }//for
    }
    multiMark.exec(function(err,multiMarkRetValues){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        if (callback) return callback(err2);
        else return self.handleError({err:err2});
      }
      return callback(null,dateIds);
    });//multiMark.exec
  });//multiGet.exec
};//shiftToNotifyDate




/**
*
* @param params - contains datesNotifyInfo
*   each item of datesNotifyInfo contains dateId, haveSendNotificationForSender, haveSendNotificationForResponder
* @param callback - is a function(err)
*
*/
Redis.prototype.markDatesNotifyInfo = function(params, callback){
  var self = this;
  var messagePrefix = 'in Redis.markDatesNotifyInfo, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  var datesNotifyInfo = params.datesNotifyInfo;
  if (!datesNotifyInfo || datesNotifyInfo.length == 0){
    return callback(null);
  }
  var multi = self.client.multi();
  for(var i=0; i<datesNotifyInfo.length; i++){
    var dateNotifyInfo = datesNotifyInfo[i];
    var dateId = dateNotifyInfo.dateId;
    var haveSendNotificationForSender = dateNotifyInfo.haveSendNotificationForSender? 1:0;
    var haveSendNotificationForResponder = dateNotifyInfo.haveSendNotificationForResponder? 1:0;
    var haveSendNotificationForBothSide = 0;
    if (dateNotifyInfo.haveSendNotificationForSender && dateNotifyInfo.haveSendNotificationForResponder)
      haveSendNotificationForBothSide = 1;
    var dateKey = 'date:'+dateId;
    var updateDateFields = {haveSendNotificationForSender:haveSendNotificationForSender, haveSendNotificationForResponder:haveSendNotificationForResponder, haveSendNotificationForBothSide:haveSendNotificationForBothSide};
    var paramsUpdateDate = handy.toArray(dateKey,updateDateFields);
    multi.hmset(paramsUpdateDate);
  }//for
  multi.exec(function(err){
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    return callback(null);
  });//multi.exec
};//markDatesNotifyInfo





/**
* there is a default filter, onlyValidUser(it means who has a valid primary photo)
*
* @param params - contains
*   emails(if this exist, all other filters not work).
*   limitType(limited,normal,all. default be all),
*   regions(if regions be null or length==0, means all region), gender(male,female,all. default be all),
*   deviceType(iphone,android,all. default be all).
*     when limitType=normal, can use RegionNormalUsers zset to improve some performance
*
* @param callback - is a function(err,userIds)
*
*/
Redis.prototype.getUserIdsByQuery = function(params, callback){
  var self = this;
  var messagePrefix = 'in Redis.getUserIdsByQuery, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  var emails = params.emails;
  var limitType = params.limitType;
  var regions = params.regions;
  var gender = params.gender;
  var deviceType = params.deviceType;

  /*
   * cbFun is function(err,getInfo)
   *   getInfo contains needNextGet, userIds
   */
  function getUserIdsByUniqueFilter(cbFun){
    if (emails && emails.length>0){
      var multi = self.client.multi();
      var emailToUserKey = 'emailToUser';
      var getFields = [emailToUserKey].concat(emails);
      multi.hmget(getFields);
      multi.exec(function(err,multiRetData){
        if (err){
          var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
          return cbFun(err2);
        }
        var userIds = multiRetData[0];
        var validUserIds = [];
        for(var i=0; i<userIds.length; i++){
          var userId = userIds[i];
          if (userId)  validUserIds.push(userId);
        }//for
        return cbFun(null,{needNextGet:false, userIds:validUserIds});
      });//multi.exec
      return;
    }//if (emails && emails.length>0)
    return cbFun(null,{needNextGet:true});
  };//getUserIdsByUniqueFilter

  function parseRegions(cbFun){
    if (limitType=='normal'){
      //when limitType be normal, need get region real values when regions means all,e.g.,regions be null,
      //because we need retrieve region related set, and this need real region value.
      if (regions && regions.length>0)  return cbFun(null);
      self.getRegions({req:req}, function(err,regionsInfo){
        if (err)  return cbFun(err);
        regions = regionsInfo.regions;//here null means 0 count.
        return cbFun(null);
      });//getRegions
      return;
    }else{
      //when limitType not be normal, we can keep the special meaning all when region be null or length==0
      return cbFun(null);
    }
    return;
  };//parseRegions

  function getUserIdsByRegionAndGender(cbFun){
    if (limitType!='normal'){
      var err = self.newError({errorKey:'simpleError',messageParams:[],messagePrefix:messagePrefix,req:req,
        message:'this function can be called only limitType==normal'});
      return cbFun(err);
    }
    //limitType=='normal', here region being null means 0 count.
    parseRegions(function(err){
      if (err)  return cbFun(err);
      if (!regions || regions.length==0)
        return cbFun(null,null);
      var multi = self.client.multi();
      for(var i=0; i<regions.length; i++){
        var region = regions[i];
        var maleRegionNormalUsersKey = "region:"+region+":normalUsers:male";
        var femaleRegionNormalUsersKey = "region:"+region+":normalUsers:female";
        if (gender == 'male'){
          multi.zrange(maleRegionNormalUsersKey,0,-1);
        }else if(gender == 'female'){
          multi.zrange(femaleRegionNormalUsersKey,0,-1);
        }else{
          multi.zrange(maleRegionNormalUsersKey,0,-1);
          multi.zrange(femaleRegionNormalUsersKey,0,-1);
        }
      }//for
      multi.exec(function(err,userIdsAry){
        if (err){
          var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
          return cbFun(err2);
        }
        var allUserIds = null;
        for(var i=0; i<userIdsAry.length; i++){
          var userIds = userIdsAry[i];
          allUserIds = handy.concatArray({ary1:allUserIds, ary2:userIds});
        }//for
        if (allUserIds && allUserIds.length==0) allUserIds = null;
        return cbFun(null,allUserIds);
      });//multi.exec
    });//parseRegions
  };//getUserIdsByRegionAndGender

  /*
   * when limitType=normal, can use RegionNormalUsers zset to improve some performance
   * cbFun is function(err,userIds)
   */
  function getUserIdsByPossibleGoodFilter(cbFun){
    if (limitType=='normal'){
      getUserIdsByRegionAndGender(cbFun);
      return;
    }else{
      self.client.get('user',function(err,userMaxId){
        if (err)  return cbFun(err);
        if (!userMaxId) userMaxId = 0;
        else userMaxId = Number(userMaxId);
        var userIds = null;
        if (userMaxId > 0){
          userIds = new Array(userMaxId);
          for(var i=1; i<=userMaxId; i++){
            userIds[i-1] = i;
          }//for
        }
        return cbFun(null,userIds);
      });//client.get
      return;
    }
    return;
  };//getUserIdsByPossibleGoodFilter

  function doFilterAboutUserField(params,cbFun){
    var userIds = params.userIds;
    if (!userIds || userIds.length==0) return cbFun(null,null);
    var multi = self.client.multi();
    var fields = [];
    var index=0, deviceTypeIndex = null, genderIndex = null, cityLocationIndex = null, primaryPhotoIdIndex = null;
    if (limitType=='normal'){
      //limitType and region and gender filter is already used. only need apply remain filters: deviceType.
      if (!deviceType || deviceType == config.constants.filterAllFlag){
        return cbFun(null,userIds);
      }
      for(var i=0; i<userIds.length; i++){
        var userId = userIds[i];
        var userKey = 'user:'+userId;
        multi.hmget(userKey,'deviceType');
      }//for
    }else{
      //when a field means all, no need to get it
      if (deviceType && deviceType != config.constants.filterAllFlag){
        fields.push('deviceType');
        deviceTypeIndex = index;
        index++;
      }
      if (gender && gender != config.constants.filterAllFlag){
        fields.push('gender');
        genderIndex = index;
        index++;
      }
      if (regions && regions.length>0){
        fields.push('cityLocation');
        cityLocationIndex = index;
        index++;
      }
      if (limitType && limitType != config.constants.filterAllFlag){
        fields.push('primaryPhotoId');
        primaryPhotoIdIndex = index;
        index++;
      }
      if (fields.length == 0){//which means those filter all be all
        return cbFun(null,userIds);
      }

      //need apply all the filters: limitType, region, gender, deviceType.
      for(var i=0; i<userIds.length; i++){
        var userId = userIds[i];
        var userKey = 'user:'+userId;
        var getFields = [userKey].concat(fields);
        multi.hmget(getFields);
      }//for
    }
    //logger.logDebug("Redis.getUserIdsByQuery doFilterAboutUserField, deviceTypeIndex="+deviceTypeIndex+", genderIndex="+genderIndex+", cityLocationIndex="+cityLocationIndex+", primaryPhotoIdIndex="+primaryPhotoIdIndex);
    //logger.logDebug("Redis.getUserIdsByQuery doFilterAboutUserField, deviceType="+deviceType+", gender="+gender+", regions="+util.inspect(regions)+", limitType="+limitType);
    multi.exec(function(err,userFieldsAry){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        return cbFun(err2);
      }
      //logger.logDebug("Redis.getUserIdsByQuery doFilterAboutUserField, multi.exec, userFieldsAry=\n"+util.inspect(userFieldsAry,false,100));
      var filteredUserIds = [];
      for(var i=0; i<userFieldsAry.length; i++){
        var userFields = userFieldsAry[i];
        if (limitType=='normal'){
          var userDeviceType = userFields[0];
          if (userDeviceType == deviceType){
            filteredUserIds.push(userIds[i]);
          }
        }else{
          if (deviceTypeIndex!=null){
            var deviceTypeItem = userFields[deviceTypeIndex];
            //console.log("i="+i+", deviceType="+deviceType+", deviceTypeItem="+deviceTypeItem+", (deviceType!=deviceTypeItem)="+(deviceType!=deviceTypeItem));
            if (deviceType!=deviceTypeItem)
              continue;
          }
          if (genderIndex!=null){
            var genderItem = userFields[genderIndex];
            //console.log("i="+i+", gender="+gender+", genderItem="+genderItem+", (gender!=genderItem)="+(gender!=genderItem));
            if (gender!=genderItem)
              continue;
          }
          if (cityLocationIndex!=null){
            var cityLocationItem = userFields[cityLocationIndex];
            var itemPos = handy.arrayIndexOf({ary:regions,item:cityLocationItem});
            //console.log("i="+i+", cityLocationItem="+cityLocationItem+", itemPos="+itemPos);
            if (itemPos<0)
              continue;
          }
          if (primaryPhotoIdIndex!=null){// limitType can not be all, so only can be limited
            var primaryPhotoIdItem = userFields[primaryPhotoIdIndex];
            //console.log("i="+i+", primaryPhotoIdItem="+primaryPhotoIdItem);
            //limitType only can be limited, and this need primaryPhotoId be empty
            if (primaryPhotoIdItem)
              continue;
          }
          filteredUserIds.push(userIds[i]);
        }
      }//for
      if (filteredUserIds && filteredUserIds.length==0) filteredUserIds = null;
      return cbFun(null,filteredUserIds);
    });//multi.exec
  };//doFilterAboutUserField

  getUserIdsByUniqueFilter(function(err,getInfo){
    if (err)  return callback(err);
    if (!getInfo.needNextGet){
      return callback(null,getInfo.userIds);
    }
    //needNextGet
    getUserIdsByPossibleGoodFilter(function(err,userIds){
      if (err)  return callback(err);
      doFilterAboutUserField({userIds:userIds},function(err,filteredUserIds){
        if (err)  return callback(err);
        return callback(null,filteredUserIds);
      });//doFilterAboutUserField
    });//getUserIdsByPossibleGoodFilter
  });//getUserIdsByUniqueFilter
};//getUserIdsByQuery



/**
* there is a default filter, onlyValidUser(it means who has a valid primary photo)
*
* @param params - contains
*   emails(if this exist, all other filters not work).
*   userFieldInfos, needCaseInsensitive.
*     each userFieldInfo contains fieldName, fieldValueRegexp.
*
* @param callback - is a function(err,userIds)
*
*/
Redis.prototype.getUserIdsByQuery2 = function(params, callback){
  var self = this;
  var messagePrefix = 'in Redis.getUserIdsByQuery, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  var emails = params.emails;
  var userFieldInfos = params.userFieldInfos;

  /*
   * cbFun is function(err,getInfo)
   *   getInfo contains needNextGet, userIds
   */
  function getUserIdsByUniqueFilter(cbFun){
    if (emails && emails.length>0){
      var multi = self.client.multi();
      var emailToUserKey = 'emailToUser';
      var getFields = [emailToUserKey].concat(emails);
      multi.hmget(getFields);
      multi.exec(function(err,multiRetData){
        if (err){
          var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
          return cbFun(err2);
        }
        var userIds = multiRetData[0];
        var validUserIds = [];
        for(var i=0; i<userIds.length; i++){
          var userId = userIds[i];
          if (userId)  validUserIds.push(userId);
        }//for
        return cbFun(null,{needNextGet:false, userIds:validUserIds});
      });//multi.exec
      return;
    }//if (emails && emails.length>0)
    return cbFun(null,{needNextGet:true});
  };//getUserIdsByUniqueFilter

  getUserIdsByUniqueFilter(function(err,getInfo){
    if (err)  return callback(err);
    if (!getInfo.needNextGet){
      return callback(null,getInfo.userIds);
    }
    //needNextGet
    self.getUserIdByFieldsValueRegexp(params, function(err,userIds){
      if (err)  return callback(err);
      return callback(null,userIds);
    });//getUserIdByFieldsValueRegexp
  });//getUserIdsByUniqueFilter
};//getUserIdsByQuery2



/**
 * simply create
 *
 *
 * @param {Object} params - contains messageText,userFilters
 * @param {Function} callback - is function(err,broadcastObj)
 */
Redis.prototype.createBroadcast = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.createBroadcast, ';
  var req = params.req;
  if (!params.messageText){
    var err = self.newError({errorKey:'needParameter',messageParams:['messageText'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  if (!params.userFilters){
    var err = self.newError({errorKey:'needParameter',messageParams:['userFilters'],messagePrefix:messagePrefix,req:req});
    if (callback) return callback(err);
    else return self.handleError({err:err});
  }
  var messageText = params.messageText;
  var userFilters = params.userFilters;
  var createTime = handy.getNowOfUTCdate().getTime();
  self.client.incr('broadcast', function(err, newId) {
    if (err){
      var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
      if (callback) return callback(err2);
      else return self.handleError({err:err2});
    }
    var broadcastId = newId+'';
    var broadcastKey = 'broadcast:'+broadcastId;
    var broadcastObj = {broadcastId:broadcastId, messageText:messageText, userFilters:userFilters, createTime:createTime+''};
    var paramsBroadcast = handy.toArray(broadcastKey,broadcastObj);
    var multi = self.client.multi();
    multi.hmset(paramsBroadcast);
    multi.exec(function(err){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        if (callback) return callback(err2);
        else return self.handleError({err:err2});
      }
      if (callback) return callback(null, broadcastObj);
      return;
    });//multi.exec
  });//client.incr
};//createBroadcast





/**
 * to disable a user, we just set disabled flag for now and not let the user log in.
 * we do not remove the userId and the photoIds from various reference sets.
 * @param {Object} params - contains
 * @param {Function} callback - is function(err)
 */
Redis.prototype.disableUser = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.disableUser, ';
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
  self.getUser({req:req,userId:userId,userFields:['userId','disabled','gender','cityLocation','primaryPhotoId']}, function(err,userObj){
    if (err)  return callback(err);
    if (!userObj || !userObj.userId){
      var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
      return callback(err);
    }
    var userDisabled = handy.convertToBool(userObj.disabled);
    //console.log()
    if (userDisabled)  return callback(null);
    var multi = self.client.multi();
    var userKey = 'user:'+userId;
    multi.hset(userKey,'disabled','1');
    multi.exec(function(err){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        return callback(err2);
      }
      return callback(null);
    });//multi.exec
  });//getUser
};//disableUser



/**
 * @see disableUser
 * here we just open disabled flag
 * @param {Object} params - contains
 * @param {Function} callback - is function(err)
 */
Redis.prototype.enableUser = function(params, callback) {
  var self = this;
  var messagePrefix = 'in Redis.enableUser, ';
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
  self.getUser({req:req,userId:userId,userFields:['userId','disabled','gender','cityLocation','primaryPhotoId']}, function(err,userObj){
    if (err)  return callback(err);
    if (!userObj || !userObj.userId){
      var err = self.newError({errorKey:'userNotExist',messageParams:[userId],messagePrefix:messagePrefix,req:req});
      return callback(err);
    }
    var userDisabled = handy.convertToBool(userObj.disabled);
    if (!userDisabled)  return callback(null);
    var multi = self.client.multi();
    var userKey = 'user:'+userId;
    multi.hset(userKey,'disabled','0');
    multi.exec(function(err){
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        return callback(err2);
      }
      return callback(null);
    });//multi.exec
  });//getUser
};//enableUser




/**
 * prepare for send notification to nearby n users
 * @param {Object} params - contains count,countyLocation,cityLocation,gender
 * @param {Function} callback - is function(err,photoIds)
 */
Redis.prototype.getNearbyUserIds = function(params, callback){
  var self = this;
  //logger.logDebug("Redis.getNearbyUserIds entered, params="+util.inspect(params,false,100));
  var messagePrefix = 'in Redis.getNearbyUserIds, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if ( !(params.count != null && params.count > 0) ){
    var err = self.newError({errorKey:'needParameter',messageParams:['count > 0'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.countyLocation){
    var err = self.newError({errorKey:'needParameter',messageParams:['countyLocation'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.cityLocation){
    var err = self.newError({errorKey:'needParameter',messageParams:['cityLocation'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  if (!params.gender){
    var err = self.newError({errorKey:'needParameter',messageParams:['gender'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
  var count = parseInt(params.count);
  var countyLocation = params.countyLocation;
  var cityLocation = params.cityLocation;
  var gender = params.gender;
  var regionNormalUsersKey = 'region:'+cityLocation+':normalUsers:'+gender;
  var countyregionNormalUsersKey = 'countyregion:'+countyLocation+':normalUsers:'+gender;
  self.getValuesOnSortedSetByTime({req:req,zsetKey:countyregionNormalUsersKey,count:count}, function(err,valueAndScoreData){
    if (err) return callback(err);
    var userIdsInCounty = [];
    if (valueAndScoreData && valueAndScoreData.values) userIdsInCounty = valueAndScoreData.values;
    if (userIdsInCounty.length == count){
      return callback(null,userIdsInCounty);
    }
    self.getValuesOnSortedSetByTime({req:req,zsetKey:regionNormalUsersKey,count:count}, function(err,valueAndScoreData){
      if (err) return callback(err);
      var userIdsInCity = [];
      if (valueAndScoreData && valueAndScoreData.values) userIdsInCity = valueAndScoreData.values;
      var allUserIds = handy.unionArray({ary1:userIdsInCounty,ary2:userIdsInCity});
      if (allUserIds.length > count) allUserIds = allUserIds.slice(0,count);
      return callback(null,allUserIds);
    });//getValuesOnSortedSetByTime city
  });//getValuesOnSortedSetByTime county
};//getNearbyUserIds





/**
 * not use schoolId because too many schoolName, just use schoolName in UTF8 encoding as id.
 * @param {Object} params - contains schoolName
 * @param {Function} callback - is function(err,id)
 */
Redis.prototype.getSchoolIdD = function(params, callback){
  var self = this;
  //logger.logDebug("Redis.getSchoolId entered, params="+util.inspect(params,false,100));
  var messagePrefix = 'in Redis.getSchoolId, ';
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  if (!params.schoolName){
    var err = self.newError({errorKey:'needParameter',messageParams:['schoolName'],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }

  var schoolName = params.schoolName;
  var allSchool = config.config.schools;
  var foundSchool = null;
  for(var i=0; i<allSchool.length; i++){
    var schoolObj = allSchool[i];
    //logger.logDebug("in Redis.getSchoolId entered, i="+i+", schoolObj="+util.inspect(schoolObj,false,100));
    if (schoolName == schoolObj.name){
      foundSchool = schoolObj;
      break;
    }
  }//for
  if (foundSchool){
    return callback(null,foundSchool.id);
  }else{
    var err = self.newError({errorKey:'NOthisSchool',messageParams:[schoolName],messagePrefix:messagePrefix,req:req});
    return callback(err);
  }
};//getSchoolId


Redis.prototype.getMaxUserId = function(params, callback){
  var self = this;
  var req = params.req;
  self.client.get('user',function(err,userMaxId){
    if (err)  return callback(err);
    userMaxId = handy.convertToNumber(userMaxId);
    if (userMaxId < 0){
      var err = self.newError({errorKey:'simpleError',message:" userMaxId < 0",messageParams:[],messagePrefix:messagePrefix,req:req});
      return callback(err);
    }
    return callback(null,userMaxId);
  });//client.get
};//getMaxUserId

/**
 *
 * @param params - contains nothing but req(optional)
 * @param callback - is function(err,userIds)
 */
Redis.prototype.getAllUserIds = function(params, callback){
  var self = this;
  var req = params.req;
  self.getMaxUserId(params,function(err,userMaxId){
    if (err)  return callback(err);
    if (userMaxId <= 0){
      return callback(null,null);
    }
    var userIds = new Array(userMaxId);
    for(var i=1; i<=userMaxId; i++){
      userIds[i-1] = i;
    }//for
    return callback(null,userIds);
  });//getMaxUserId
};//getAllUserIds

/**
*
* userId  refId deviceId
* select refId,count(userId) from T1 group by refId  各邀请者分别邀请了多少用户
* select refId,count(deviceId) from (select distinct refId, deviceId from T1) T2 group by refId  各邀请者分别邀请了多少device
* select deviceId,count(userId) from T1 group by deviceId  一个device由多少user使用
*
* @param params - contains nothing but req(optional)
* @param callback - is function(err,users)
*/
Redis.prototype.countInvitingUser = function(params, callback){
  var self = this;
  //logger.logDebug("Redis.countInvitingUser entered, params="+util.inspect(params,false,100));
  var messagePrefix = 'in Redis.countInvitingUser, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  var systemUserId = config.config.users.system.userId;
  self.getAllUserIds(params, function(err,userIds){
    if (err)  return callback(err);
    if (!userIds || userIds.length==0){
      return callback(null,null);
    }
    self.getUsers({userIds:userIds,userFields:['userId','referrerId','currentDeviceId']}, function(err,users){
      if (err)  return callback(err);
      var invitedUserCountHash = {};
      var invitedDeviceSetHash = {};
      for(var i=0; i<users.length; i++){
        var userObj = users[i];
        if (userObj && userObj.userId){
          var userId = userObj.userId;
          var referrerId = userObj.referrerId;
          var deviceId = userObj.currentDeviceId;
          if (!deviceId) deviceId = userId;//may have possiblity that deviceId be empty, here we take as an unique device, and userId is unique.
          if (referrerId){
            invitedUserCountHash[referrerId] = handy.convertToNumber(invitedUserCountHash[referrerId])+1;
            var deviceIdSet = invitedDeviceSetHash[referrerId];
            if (!deviceIdSet) deviceIdSet = {};
            deviceIdSet[deviceId] = 1;
            invitedDeviceSetHash[referrerId] = deviceIdSet;
          }
        }
      }//for
      //console.log("\ninvitedUserCountHash=\n"+util.inspect(invitedUserCountHash,false,100));
      //console.log("\ninvitedDeviceSetHash=\n"+util.inspect(invitedDeviceSetHash,false,100));
      var hToAData = handy.hashToArray({needKey:true, excludeKey:systemUserId, hash:invitedUserCountHash});
      var referrerIds = hToAData.keys;

      var systemAsRefUser = {userId:systemUserId};
      var invitedUserCount = invitedUserCountHash[systemUserId];
      systemAsRefUser.invitedUserCount = invitedUserCount;
      var invitedDeviceSet = invitedDeviceSetHash[systemUserId];
      systemAsRefUser.invitedDeviceCount = handy.objectFieldCount(invitedDeviceSet);

      if (!referrerIds || referrerIds.length==0){
        return callback(null,[systemAsRefUser]);
      }
      self.getUsers({userIds:referrerIds,userFields:['userId','emailAccount','name','gender','deviceType','currentDeviceId','disabled']},function(err,referrers){
        if(err)  return callback(err);
        for(var i=0; i<referrers.length; i++){
          var referrer = referrers[i];
          if (!referrer.userId){
            var err = self.newError({errorKey:'simpleError',messageParams:['referrer.userId be empty'],messagePrefix:messagePrefix,req:req});
            return self.handleError({err:err});
          }
          var referrerId = referrer.userId;
          var invitedUserCount = invitedUserCountHash[referrerId];
          referrer.invitedUserCount = invitedUserCount;
          var invitedDeviceSet = invitedDeviceSetHash[referrerId];
          referrer.invitedDeviceCount = handy.objectFieldCount(invitedDeviceSet);
        }//for
        referrers.push(systemAsRefUser);
        //console.log("\nreferrers=\n"+util.inspect(referrers,false,100));
        return callback(null,referrers);
      });//getUsers--referrer
    });//getUsers--all user
  });//getAllUserIds
};//countInvitingUser



/**
 * get in-session user by device.
 * a device may correspond to multi users, get the last one.
 *
 * @param params - contains req.
 * @param callback - is a function(err,userIds)
 */
Redis.prototype.getDistinctDeviceLastUserIds = function (params,callback) {
  var self = this;
  var messagePrefix = 'in Redis.getDistinctDeviceLastUserIds, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  self.getAllUserIds(params, function(err,allUserIds){
    if (err) return callback(err);
    if (!allUserIds || allUserIds.length==0)
      return callback(null,null);

    var multi = self.client.multi();
    for(var i=0; i<allUserIds.length; i++){
      var userId = allUserIds[i];
      var userKey = "user:"+userId;
      multi.hmget(userKey,"userId","currentDeviceId","lastLoginTime","lastLogoutTime");
    }//for
    multi.exec(function(err, multiRetData) {
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        return callback(err2);
      }
      var deviceLastUserHash = {};
      var userIds = [];
      for(var i=0; i<multiRetData.length; i++){
        var userFieldValues = multiRetData[i];
        if (userFieldValues){
          var userId = userFieldValues[0];
          var currentDeviceId = userFieldValues[1];
          var lastLoginTime = handy.convertToNumber(userFieldValues[2]);
          var lastLogoutTime = handy.convertToNumber(userFieldValues[3]);
          if (userId && currentDeviceId){//this user data is valid
            if (lastLogoutTime>0 && lastLogoutTime>lastLoginTime){
              //user is logout, do nothing
            }else{
              //user is in-session
              var userObj = {userId:userId, currentDeviceId:currentDeviceId, lastLoginTime:lastLoginTime, lastLogoutTime:lastLogoutTime};
              var deviceLastUser = deviceLastUserHash[currentDeviceId];
              if (!deviceLastUser) deviceLastUserHash[currentDeviceId] = userObj;
              else{
                if (userObj.lastLoginTime > deviceLastUser.lastLoginTime){
                  deviceLastUserHash[currentDeviceId] = userObj;
                }
              }
            }
          }//if (userId && currentDeviceId)
        }//if (userFieldValues)
      }//for i
      var distinctDeviceLastUserIds = [];
      for(idx in deviceLastUserHash){
        var userObj = deviceLastUserHash[idx];
        distinctDeviceLastUserIds.push(userObj.userId);
      }//for idx
      return callback(null,distinctDeviceLastUserIds);
    });//multi.exec
  });//getAllUserIds
};//getDistinctDeviceLastUserIds




/**
 * the user is using android device, and is in-session.
 *
 * @param params - contains req.
 * @param callback - is a function(err,userIds)
 */
Redis.prototype.getStatOfCanNotReceiveC2dmUser = function (params,callback) {
  var self = this;
  var messagePrefix = 'in Redis.getStatOfCanNotReceiveC2dmUser, ';
  var req = params.req;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix,req:req});
    return self.handleError({err:err});
  }
  self.getAllUserIds(params, function(err,allUserIds){
    if (err) return callback(err);
    if (!allUserIds || allUserIds.length==0)
      return callback(null,null);

    var multi = self.client.multi();
    for(var i=0; i<allUserIds.length; i++){
      var userId = allUserIds[i];
      var userKey = "user:"+userId;
      multi.hmget(userKey,"userId","deviceType","appToken","lastLoginTime","lastLogoutTime");
    }//for
    multi.exec(function(err, multiRetData) {
      if (err){
        var err2 = self.newError({errorKey:'libraryError',messageParams:['redis'],messagePrefix:messagePrefix,req:req,innerError:err});
        return callback(err2);
      }

      var useAndroidUserCount = 0;
      var useAndroidSureLogOutUserCount = 0;
      var useAndroidMayLogInUserCount = 0;
      var mayLogInUserCanNotReceiveC2dmCount = 0;
      for(var i=0; i<multiRetData.length; i++){
        var userFieldValues = multiRetData[i];
        if (userFieldValues){
          var userId = userFieldValues[0];
          var deviceType = userFieldValues[1];
          var appToken = userFieldValues[2];
          var lastLoginTime = handy.convertToNumber(userFieldValues[3]);
          var lastLogoutTime = handy.convertToNumber(userFieldValues[4]);
          if (userId){
            if (deviceType == "android"){
              useAndroidUserCount ++;
              if (lastLogoutTime>0 && lastLogoutTime>lastLoginTime){
                useAndroidSureLogOutUserCount++;
              }else{
                useAndroidMayLogInUserCount++;
                if (!appToken){
                  mayLogInUserCanNotReceiveC2dmCount++;
                }
              }
            }//if (deviceType == "android")
          }//if (userId)
        }//if (userFieldValues)
      }//for i
      var outData = {totalUserCount:allUserIds.length,
            useAndroidUserCount:useAndroidUserCount, useIphoneUserCount:allUserIds.length-useAndroidUserCount,
            useAndroidSureLogOutUserCount:useAndroidSureLogOutUserCount, mayLogInUserCanNotReceiveC2dmCount:mayLogInUserCanNotReceiveC2dmCount,
            mayLogInUserCanReceiveC2dmCount:useAndroidMayLogInUserCount-mayLogInUserCanNotReceiveC2dmCount};
      return callback(null,outData);
    });//multi.exec
  });//getAllUserIds
};//getStatOfCanNotReceiveC2dmUser




