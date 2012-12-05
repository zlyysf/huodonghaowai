/**
 *
 * this file contains helper functions for now
 */

var assert = require('assert');
var util = require('util');
var handy = require('./handy');
var logger = require('./logger');
var config = require('./config');


/**
 * modified on users
 * can be a static function
 *
 * @param params - contain photos and users array
 * @returns - contains err or nothing
 */
var bindUserWithPrimaryPhotoPath = exports.bindUserWithPrimaryPhotoPath = function(params){
  var self = this;
  var messagePrefix = 'in shuffle.bindUserWithPrimaryPhotoPath, ';
  if (!params.photos){
    var err = handy.newError({errorKey:'needParameter',messageParams:['photos'],messagePrefix:messagePrefix});
    return {err:err};
  }
  if (!params.users){
    var err = handy.newError({errorKey:'needParameter',messageParams:['users'],messagePrefix:messagePrefix});
    return {err:err};
  }
  var photos = params.photos;
  var users = params.users;
  var photoIdx = 0;
  for(var i=0;i<users.length;i++){
    var user = users[i];
    if (user.primaryPhotoId){
      var primaryPhoto = photos[photoIdx];
      user.primaryPhotoPath = primaryPhoto.photoPath;
      photoIdx ++;
    }
  }//for users
};//bindUserWithPrimaryPhotoPath

/**
 * modified on photos
 * can be a static function
 *
 * @param params - contain photos and users array
 * @returns - contains err or nothing
 */
var bindPhotoWithUser = exports.bindPhotoWithUser = function(params){
  var self = this;
  var messagePrefix = 'in shuffle.bindPhotoWithUser, ';
  if (!params.photos){
    var err = handy.newError({errorKey:'needParameter',messageParams:['photos'],messagePrefix:messagePrefix});
    return {err:err};
  }
  if (!params.users){
    var err = handy.newError({errorKey:'needParameter',messageParams:['users'],messagePrefix:messagePrefix});
    return {err:err};
  }
  var photos = params.photos;
  var users = params.users;
  for(var i=0;i<photos.length;i++){
    var photo = photos[i];
    for(var j=0; j<users.length; j++){
      var user = users[j];
      if (photo.userId == user.userId){
        photo.user = user;
        delete photo.userId;
        break;
      }
    }//for users
  }//for photos
};//bindPhotoWithUser

/**
 * modified on feeds
 * can be a static function
 *
 * @param params - contain feeds and users array
 * @returns - contains err or nothing
 */
var bindFeedWithUser = exports.bindFeedWithUser = function(params){
  var self = this;
  var messagePrefix = 'in shuffle.bindFeedWithUser, ';
  if (!params.feeds){
    var err = handy.newError({errorKey:'needParameter',messageParams:['feeds'],messagePrefix:messagePrefix});
    return {err:err};
  }
  if (!params.users){
    var err = handy.newError({errorKey:'needParameter',messageParams:['users'],messagePrefix:messagePrefix});
    return {err:err};
  }
  var feeds = params.feeds;
  var users = params.users;
  for(var i=0;i<feeds.length;i++){
    var feed = feeds[i];
    for(var j=0; j<users.length; j++){
      var user = users[j];
      if (feed.userId == user.userId){
        feed.user = user;
        delete feed.userId;
        break;
      }
    }//for users
  }//for feeds
};//bindFeedWithUser


var bindFeedWithPhoto = exports.bindFeedWithPhoto = function(params){
  //logger.logDebug("shuffle.bindFeedWithPhoto entered, params="+util.inspect(params,false,100));
  var self = this;
  var messagePrefix = 'in shuffle.bindFeedWithPhoto, ';
  if (!params.photos){
    var err = handy.newError({errorKey:'needParameter',messageParams:['photos'],messagePrefix:messagePrefix});
    return {err:err};
  }
  if (!params.feeds){
    var err = handy.newError({errorKey:'needParameter',messageParams:['feeds'],messagePrefix:messagePrefix});
    return {err:err};
  }
  var photos = params.photos;
  var feeds = params.feeds;
  var offset = 0;
  for(var i=0; i<feeds.length; i++){
    var feed = feeds[i];
    var photoLen = 0;
    if (feed.photoIds && feed.photoIds.length > 0)
      photoLen = feed.photoIds.length;
    if (photoLen > 0){
      var partPhotos = photos.slice(offset,offset+photoLen);
      feed.photos = partPhotos;
      offset += photoLen;
      //delete feed.photoIds;
    }
  }//for feeds
};//bindFeedWithPhoto




/**
 * modified on dates
 * can be a static function
 *
 * @param params - contain dates and users array
 * @returns - contains err or nothing
 */
var bindDateWithSender = exports.bindDateWithSender = function(params){
  var self = this;
  var messagePrefix = 'in shuffle.bindDateWithSender, ';
  if (!params.dates){
    var err = handy.newError({errorKey:'needParameter',messageParams:['dates'],messagePrefix:messagePrefix});
    return {err:err};
  }
  if (!params.users){
    var err = handy.newError({errorKey:'needParameter',messageParams:['users'],messagePrefix:messagePrefix});
    return {err:err};
  }
  var dates = params.dates;
  var users = params.users;
  for(var i=0;i<dates.length;i++){
    var date = dates[i];
    for(var j=0; j<users.length; j++){
      var user = users[j];
      if (date && user && date.senderId == user.userId){
        date.sender = user;
        //delete date.senderId;
        break;
      }
    }//for users
  }//for dates
};//bindDateWithSender



/**
 * modified on dates
 * can be a static function
 *
 * @param params - contain dates and photos array
 * @returns - contains err or nothing
 */
var bindDateWithPhoto = exports.bindDateWithPhoto = function(params){
  var self = this;
  var messagePrefix = 'in shuffle.bindDateWithPhoto, ';
  if (!params.dates){
    var err = handy.newError({errorKey:'needParameter',messageParams:['dates'],messagePrefix:messagePrefix});
    return {err:err};
  }
  if (!params.photos){
    var err = handy.newError({errorKey:'needParameter',messageParams:['photos'],messagePrefix:messagePrefix});
    return {err:err};
  }
  var dates = params.dates;
  var photos = params.photos;
  for(var i=0;i<dates.length;i++){
    var date = dates[i];
    for(var j=0; j<photos.length; j++){
      var photo = photos[j];
      if (date && photo && date.photoId == photo.photoId){
        date.photoPath = photo.photoPath;
        //delete date.senderId;
        break;
      }
    }//for users
  }//for dates
};//bindDateWithPhoto



var bindDatesResponderWithLatestMessage = exports.bindDatesResponderWithLatestMessage = function(params){
  var self = this;
  var messagePrefix = 'in shuffle.bindDatesResponderWithLatestMessage, ';
  if (!params.dateResponders){
    var err = handy.newError({errorKey:'needParameter',messageParams:['dateResponders'],messagePrefix:messagePrefix});
    return {err:err};
  }
  if (!params.messages){
    var err = handy.newError({errorKey:'needParameter',messageParams:['messages'],messagePrefix:messagePrefix});
    return {err:err};
  }
  if (!params.dateOwnerId){
    var err = handy.newError({errorKey:'needParameter',messageParams:['dateOwnerId'],messagePrefix:messagePrefix});
    return {err:err};
  }
  var dateResponders = params.dateResponders;
  var messages = params.messages;
  var dateOwnerId = params.dateOwnerId;
  if (dateResponders.length == 0 || messages.length == 0)
    return;
  var messageIdx = 0;
  for(var i=0; i<dateResponders.length; i++){
    var dateResponder = dateResponders[i];
    if (dateResponder && dateResponder.latestMessageId != null){
      var message = messages[messageIdx];
      assert.ok(dateResponder.latestMessageId == message.messageId);
      dateResponder.latestMessage = message;
      messageIdx ++;

      var userLastViewChatTime = null;
      if(dateOwnerId == dateResponder.responderId){
        //the date owner is responder of the date
        userLastViewChatTime = dateResponder.responderLastViewChatTime;
      }else{
        //the date owner is sender of the date
        userLastViewChatTime = dateResponder.senderLastViewChatTime;
      }
      if (userLastViewChatTime){
        if( Number(message.createTime) <= Number(userLastViewChatTime) ){
          //the latest message has been viewed
          dateResponder.haveUnViewedMessage = false;
        }else{
          //at least the latest message has not been viewed
          dateResponder.haveUnViewedMessage = true;
        }
      }else{
        //not viewed any and exist at least 1 message
        dateResponder.haveUnViewedMessage = true;
      }
    }
  }//for dateResponders

};//bindDatesResponderWithLatestMessage



/**
 *   here will remove the null item in dateResponders
 * @param params - contains dates and dateResponders
 *   dateResponders may contain null item.
 * @returns
 */
var bindDateWithResponder = exports.bindDateWithResponder = function(params){
  var self = this;
  var messagePrefix = 'in shuffle.bindDateWithResponder, ';
  if (!params.dates){
    var err = handy.newError({errorKey:'needParameter',messageParams:['dates'],messagePrefix:messagePrefix});
    return {err:err};
  }
  if (!params.dateResponders){
    var err = handy.newError({errorKey:'needParameter',messageParams:['dateResponders'],messagePrefix:messagePrefix});
    return {err:err};
  }
  var dates = params.dates;
  var dateResponders = params.dateResponders;
  var offset = 0;
  for(var i=0; i<dates.length; i++){
    var date = dates[i];
    var responderLen = 0;
    if (date.responderIds && date.responderIds.length > 0)
      responderLen = date.responderIds.length;
    if (responderLen > 0){
      date.responders = dateResponders.slice(offset,offset+responderLen);
      for(var j=date.responders.length-1; j>=0; j--){
        var dateResponder = date.responders[j];
        if (dateResponder == null || dateResponder.dateId == null || dateResponder.responderId == null){
          date.responders.splice(j,1);
        }
      }
      var unViewedConversationCount = 0;
      var confirmedPersonCount = 0;
      for(var j=date.responders.length-1; j>=0; j--){
        var dateResponder = date.responders[j];
        if (dateResponder && dateResponder.haveUnViewedMessage) unViewedConversationCount++;
        if (dateResponder && dateResponder.senderConfirmed){
          var senderConfirmed = handy.convertToBool(dateResponder.senderConfirmed);
          if (senderConfirmed) confirmedPersonCount++;
        }
      }
      date.unViewedConversationCount = unViewedConversationCount + '';
      date.confirmedPersonCount = confirmedPersonCount + '';
      if (date.responders.length == 0)
        delete date.responders;
      offset += responderLen;
      //delete date.responderIds;
    }
  }//for dates
};//bindDateWithResponder




/**
 * modified on messages
 * can be a static function
 *
 * @param params - contain messages and users array
 * @returns - contains err or nothing
 */
var bindMessageSender = exports.bindMessageSender = function(params){
  var self = this;
  var messagePrefix = 'in shuffle.bindMessageSender, ';
  if (!params.messages){
    var err = handy.newError({errorKey:'needParameter',messageParams:['messages'],messagePrefix:messagePrefix});
    return {err:err};
  }
  if (!params.users){
    var err = handy.newError({errorKey:'needParameter',messageParams:['users'],messagePrefix:messagePrefix});
    return {err:err};
  }
  var messages = params.messages;
  var users = params.users;
  for(var i=0;i<messages.length;i++){
    var message = messages[i];
    for(var j=0; j<users.length; j++){
      var user = users[j];
      if (message.senderId == user.userId){
        message.sender = user;
        delete message.senderId;
        break;
      }else if (message.senderId == config.config.users.system.userId){
        message.sender = {userId:config.config.users.system.userId, name:config.config.users.system.name};
        delete message.senderId;
        break;
      }
    }//for users
  }//for messages
};//bindMessageSender

/**
 * date in 10 minutes will be 7 len digit, low seq part be 9 len digit. so total len will be 16 len digit.
 * @param params - contains dateInMs, lowSeqPart, lowSeqDefaultMax(bool)
 * @returns 17 len digit
 */
var generateDateDateScore = exports.generateDateDateScore = function(params){
  var dateInMs = params.dateInMs;
  var lowSeqPart = params.lowSeqPart;
  var lowSeqDefaultMax = params.lowSeqDefaultMax;
  var precisionInMs = 10*60*1000; //10 minute
  var digitLenOfLowOrderSeq = 9;
  if (lowSeqPart == null){
    if (lowSeqDefaultMax){
      lowSeqPart = Math.pow(10,digitLenOfLowOrderSeq)-1;
    }else{
      lowSeqPart = 0;
    }
  }
  var r = handy.generateZsetScoreFromDate({timeInMs:dateInMs, precisionInMs:precisionInMs, lowOrderSeq:lowSeqPart, digitLenOfLowOrderSeq:digitLenOfLowOrderSeq});
  return r;
};//generateDateDateScore



var bindDateAndScore = exports.bindDateAndScore = function(params){
  var self = this;
  var messagePrefix = 'in shuffle.bindDateAndScore, ';
  if (!params.dates){
    var err = handy.newError({errorKey:'needParameter',messageParams:['dates'],messagePrefix:messagePrefix});
    return {err:err};
  }
  if (!params.scores){
    var err = handy.newError({errorKey:'needParameter',messageParams:['scores'],messagePrefix:messagePrefix});
    return {err:err};
  }
  var dates = params.dates;
  var scores = params.scores;
  for(var i=0; i<dates.length; i++){
    var date = dates[i];
    var score = scores[i];
    date.orderScore = score;
  }//for dateResponders
};//bindFeedWithPhoto




/**
 * @param params - contains dateSenderName, dateResponderName
 * @returns - contains message, err
 */
var formatInformMessageWhenDateSenderFirstChat = exports.formatInformMessageWhenDateSenderFirstChat = function(params){
  var messagePrefix = 'in shuffle.formatInformMessageWhenDateSenderFirstChat, ';
  var self = this;
  if(!params.dateSenderName){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateSenderName'],messagePrefix:messagePrefix});
    return {err:err};
  }
  if(!params.dateResponderName){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateResponderName'],messagePrefix:messagePrefix});
    return {err:err};
  }
  var dateSenderName = params.dateSenderName;
  var dateResponderName = params.dateResponderName;
  var msg = util.format(config.config.messages["informDateSenderWhenFirstChat"].text,dateSenderName,dateResponderName,dateResponderName,dateResponderName);
  return {message:msg};
};//formatInformMessageWhenDateSenderFirstChat



/**
 * @param params - contains confirmUserName, oppositeUserName
 * @returns - contains message, err
 */
var formatInformMessageDateConfirmSinglyToOppositeD = exports.formatInformMessageDateConfirmSinglyToOpposite = function(params){
  var messagePrefix = 'in shuffle.formatInformMessageDateConfirmSinglyToOpposite, ';
  var self = this;
  if(!params.confirmUserName){
    var err = self.newError({errorKey:'needParameter',messageParams:['confirmUserName'],messagePrefix:messagePrefix});
    return {err:err};
  }
  if(!params.oppositeUserName){
    var err = self.newError({errorKey:'needParameter',messageParams:['oppositeUserName'],messagePrefix:messagePrefix});
    return {err:err};
  }
  var confirmUserName = params.confirmUserName;
  var oppositeUserName = params.oppositeUserName;
  var msg = util.format(config.config.messages["informDateConfirmSinglyToOpposite"].text,oppositeUserName,confirmUserName);
  return {message:msg};
};//formatInformMessageDateConfirmSinglyToOpposite

/**
 * @param params - contains oppositeUserName
 * @returns - contains message, err
 */
var formatInformMessageDateConfirmSinglyToSelfD = exports.formatInformMessageDateConfirmSinglyToSelf = function(params){
  var messagePrefix = 'in shuffle.formatInformMessageDateConfirmSinglyToSelf, ';
  var self = this;
  if(!params.oppositeUserName){
    var err = self.newError({errorKey:'needParameter',messageParams:['oppositeUserName'],messagePrefix:messagePrefix});
    return {err:err};
  }
  var oppositeUserName = params.oppositeUserName;
  var msg = util.format(config.config.messages["informDateConfirmSinglyToSelf"].text,oppositeUserName,oppositeUserName);
  return {message:msg};
};//formatInformMessageDateConfirmSinglyToSelf


/**
 * @param params - contains confirmUserName, oppositeUserName
 * @returns - contains message, err
 */
var formatInformMessageDateConfirmDoubleToOppositeD = exports.formatInformMessageDateConfirmDoubleToOpposite = function(params){
  var messagePrefix = 'in shuffle.formatInformMessageDateConfirmDoubleToOpposite, ';
  var self = this;
  if(!params.confirmUserName){
    var err = self.newError({errorKey:'needParameter',messageParams:['confirmUserName'],messagePrefix:messagePrefix});
    return {err:err};
  }
  if(!params.oppositeUserName){
    var err = self.newError({errorKey:'needParameter',messageParams:['oppositeUserName'],messagePrefix:messagePrefix});
    return {err:err};
  }
  var confirmUserName = params.confirmUserName;
  var oppositeUserName = params.oppositeUserName;
  var msg = util.format(config.config.messages["informDateConfirmDoubleToOpposite"].text,oppositeUserName,confirmUserName);
  return {message:msg};
};//formatInformMessageDateConfirmDoubleToOpposite


/**
 * @param params - contains userName
 * @returns - contains message, err
 */
var formatInformMessageDateConfirmDoubleToSelfD = exports.formatInformMessageDateConfirmDoubleToSelf = function(params){
  var messagePrefix = 'in shuffle.formatInformMessageDateConfirmDoubleToSelf, ';
  var self = this;
  var msg = util.format(config.config.messages["informDateConfirmDoubleToSelf"].text);
  return {message:msg};
};//formatInformMessageDateConfirmDoubleToSelf


/**
 * @param params - contains senderName, responderName
 * @returns - contains message, err
 */
var formatInformMessageDateConfirmToResponder = exports.formatInformMessageDateConfirmToResponder = function(params){
  var messagePrefix = 'in shuffle.formatInformMessageDateConfirmToResponder, ';
  var self = this;
//  if(!params.senderName){
//    var err = self.newError({errorKey:'needParameter',messageParams:['senderName'],messagePrefix:messagePrefix});
//    return {err:err};
//  }
//  if(!params.responderName){
//    var err = self.newError({errorKey:'needParameter',messageParams:['responderName'],messagePrefix:messagePrefix});
//    return {err:err};
//  }
//  var senderName = params.senderName;
//  var responderName = params.responderName;
  var msg = util.format(config.config.messages["informDateConfirmToResponder"].text);
  return {message:msg};
};//formatInformMessageDateConfirmToResponder

/**
 * @param params - contains senderName, responderName
 * @returns - contains message, err
 */
var formatInformMessageDateCancelToResponder = exports.formatInformMessageDateCancelToResponder = function(params){
  var messagePrefix = 'in shuffle.formatInformMessageDateCancelToResponder, ';
  var self = this;
//  if(!params.senderName){
//    var err = self.newError({errorKey:'needParameter',messageParams:['senderName'],messagePrefix:messagePrefix});
//    return {err:err};
//  }
//  if(!params.responderName){
//    var err = self.newError({errorKey:'needParameter',messageParams:['responderName'],messagePrefix:messagePrefix});
//    return {err:err};
//  }
//  var senderName = params.senderName;
//  var responderName = params.responderName;
  var msg = util.format(config.config.messages["informDateCancelToResponder"].text);
  return {message:msg};
};//formatInformMessageDateCancelToResponder

/**
 *
 * @param params - contains req,needSecure,path
 *   if path exist, it should begin with '/', such as /p1/p2.
 * @returns {err,url},  url is without path part, such as http://host:port or https://host:port
 */
var generateWebUrl = exports.generateWebUrl = function(params){
  if(!params.req){
    var err = self.newError({errorKey:'needParameter',messageParams:['req'],messagePrefix:messagePrefix});
    return {err:err};
  }
  var req = params.req;
  var needSecure = params.needSecure;
  var path = params.path;
  if (!path) path = '';

  var host = config.getHost();
  var port = needSecure ? config.config.securePort : config.config.port;
  var protocol = needSecure ? 'https' : 'http';
  if (req.headers && req.headers.host){
    var hostPortPart = req.headers.host;
    var hostPortObj = handy.parseHostPort(hostPortPart);
    host = hostPortObj.host;
  }
  var url = protocol +'://'+host+':'+port+path;
  return {url:url};
};//generateWebUrl



