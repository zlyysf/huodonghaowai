

var assert = require('assert');
var util = require('util');
var querystring = require('querystring');

var handy = require('./handy');
var logger = require('./logger');
var config = require('./config');

exports = module.exports = SolrClient;

exports.create = function(params) {
  return new SolrClient(params);
};

var defaultHost = 'localhost';
var defaultPort = 8983;

/**
 *
 * @param params - contains host(optional), port(optional), commitWithin(optional), threadInterval(optional)
 * @returns {SolrClient}
 */
function SolrClient(params) {
  var self = this;
  if (!params) params = {};
  if (params.host)  self.host = params.host;
  else self.host = defaultHost;
  if (params.port)  self.port = params.port;
  else self.port = defaultPort;

  self.commitWithin = params.commitWithin;

  if (params.threadInterval)  self.threadInterval = params.threadInterval;
  else self.threadInterval = config.config.solrPeriodicThreadInterval;

  self.threadPeriodicCheckIntervalId = null;
  self.docs = [];
  self.startThreadPeriodicCheck();
};


SolrClient.prototype.close = function () {
  logger.logDebug("SolrClient close entered");
  var self = this;
  self.stopThreadPeriodicCheck();
};



/**
 * only log error if can not return error through callback function
 * as a private function
 * @param params - contains err
 */
SolrClient.prototype.handleError = function(params){
  var self = this;
  var messagePrefix = 'in SolrClient.handleError, ';
  //replace assert.ok(..) to below check codes because the error thrown by assert can not be handled
  if (!params.err){
    var err = self.newError({errorKey:'needParameter',messageParams:['err'],messagePrefix:messagePrefix});
    handy.handleError({err:err, nestlevel:0});
    return;
  }

  var err = params.err;
  logger.logError('error handled in solr layer');
  handy.handleError({err:params.err, nestlevel:0});
};

/**
 * new error with config defined. also can customize
 * as a private function
 * @param {Object} params - contains code,message,messagePrefix,errorKey.
 *   errorKey is used to get predefined error info in config.
 *   they all can be optional, at this time, the stack info is still useful.
 */
SolrClient.prototype.newError = function(params) {
  if(!params.messagePrefix) params.messagePrefix = 'error in solr function: ';
  return handy.newError(params);
};//newError



/**
 * insert or update
 * @param params - contains items, commitWithin(optional, if not passed here, use that in constructor; if still empty, default be 0),
 * @param callback - is function(err)
 */
SolrClient.prototype.setArrayByJson = function (params,callback){
  var messagePrefix = 'in SolrClient.setArrayByJson, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }

  if (!params.items || !params.items instanceof Array){
    var err = self.newError({errorKey:'needParameter',messageParams:['items be array'],messagePrefix:messagePrefix});
    return callback(err);
  }
  var items = params.items;
  var commitWithin = params.commitWithin;
  var path = null;
  if (!commitWithin) commitWithin = self.commitWithin;
  if (!commitWithin || commitWithin == 0){
    path = "/solr/update/json?wt=json&commit=true";
  }else{
    path = "/solr/update/json?wt=json&commitWithin="+commitWithin;
  }

  handy.doHttpPostJson({host:self.host,port:self.port,path:path,postDataObj:items},function(err,retDataObj){
    if (err) return callback(err);
    return callback(null,retDataObj);
  });//doHttpPostJson
};//setArrayByJson


/**
 * need id field exist in solr server
 * @param params - contains nothing
 * @param callback - is function(err)
 */
SolrClient.prototype.deleteAllByJson = function(params,callback){
  var messagePrefix = 'in SolrClient.deleteAllByJson, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  var path = "/solr/update/json?commit=true&wt=json";
  var postDataObj = {'delete':{query:'id:*'}};
  handy.doHttpPostJson({host:self.host,port:self.port,path:path,postDataObj:postDataObj},function(err,retDataObj){
    if (err) return callback(err);
    return callback(null,retDataObj);
  });//doHttpPostJson
};//deleteAllByJson


/**
 * @param params - contains nothing
 * @param callback - is function(err,count)
 */
SolrClient.prototype.getCount = function(params,callback){
  var messagePrefix = 'in SolrClient.getCount, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  var path = '/solr/select/?rows=0&wt=json&q=*:*&facet=true&facet.field=id';
  handy.doHttpGet({host:self.host,port:self.port,path:path},function(err,retDataObj){
    if (err) return callback(err);
    var dataObj = JSON.parse(retDataObj.data);
    var count = dataObj.response.numFound;
    return callback(null,count);
  });//doHttpGet
};//getCount




SolrClient.prototype.addDocToQueue = function (doc) {
  var self = this;
  self.docs.push(doc);
};//addDocToQueue

SolrClient.prototype.flushQueue = function (callback) {
  var messagePrefix = 'in SolrClient.flushQueue, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  if (self.docs.length == 0)
    return callback(null);
  var docs = self.docs.splice(0);
  logger.logDebug("SolrClient.flushQueue , docs.len="+docs.length);
  self.setArrayByJson({items:docs}, function(err,retDataObj){
    if (err) return callback(err);
    logger.logDebug("SolrClient.flushQueue exiting");
    return callback(null,retDataObj);
  });//setArrayByJson
};//addDocToQueue

SolrClient.prototype.startThreadPeriodicCheck = function () {
  var self = this;
  logger.logDebug("startThreadPeriodicCheck entered");
  function doWork(){
    self.flushQueue(function(err){
      if(err) logger.logError("error in solr client thread:"+util.inspect(err,false,100));
    });//flushQueue
  };//doWork

  var threadInterval = self.threadInterval;
  if (self.threadPeriodicCheckIntervalId == null){
    self.threadPeriodicCheckIntervalId = setInterval(function(){
      doWork();
    },threadInterval);//setInterval
  }else{
    logger.logWarning("ThreadPeriodicCheck already started");
  }
};//startThreadPeriodicCheck
SolrClient.prototype.stopThreadPeriodicCheck = function () {
  var self = this;
  logger.logDebug("SolrClient.stopThreadPeriodicCheck entered");
  if (self.threadPeriodicCheckIntervalId != null){
    clearInterval(self.threadPeriodicCheckIntervalId);
    self.threadPeriodicCheckIntervalId = null;
  }
};//stopThreadPeriodicCheck

/**
 *
 * @param params - contains dateObj,userObj
 *   dateObj contains dateId, latlng, region, geolibType, dateDate, finalConfirmed. (title,userId,createTime).
 *   userObj contains gender.
 * @param callback - is function(err)
 */
SolrClient.prototype.addDateToQueue = function (params,callback) {
  var messagePrefix = 'in SolrClient.addDateToQueue, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  if (!params.dateObj){
    var err = self.newError({errorKey:'needParameter',messageParams:['dateObj'],messagePrefix:messagePrefix});
    return callback(err);
  }
  if (!params.userObj){
    var err = self.newError({errorKey:'needParameter',messageParams:['userObj'],messagePrefix:messagePrefix});
    return callback(err);
  }
  var dateObj = params.dateObj;
  var userObj = params.userObj;

  var regionInfo = handy.getAllLevelRegion({region:dateObj.region,geolibType:dateObj.geolibType});
  if (regionInfo.err) return callback(regionInfo.err);
  var regions = regionInfo.regions;

  var finalConfirmed = handy.convertToBool(dateObj.finalConfirmed);
  var docId = "date:"+dateObj.dateId;
  var doc = {id:docId, type:"date", pointLatLon:dateObj.latlng,
        gender:userObj.gender, dateDate:dateObj.dateDate,
        finalConfirmed:finalConfirmed};
//  var doc = {id:dateObj.dateId, type:"date", title:dateObj.title, pointLatLon:dateObj.latlng,
//      gender:userObj.gender, userId:dateObj.senderId, dateDate:dateObj.dateDate, createTime:dateObj.createTime,
//      finalConfirmed:finalConfirmed};
//  if (dateObj.finalCandidateId) doc.candidateId = dateObj.finalCandidateId;
//  if (dateObj.description) doc.description = description;
//  if (regions.length >= 1) doc.countryCode = regions[0];
//  if (regions.length >= 2) doc.state = regions[1];
//  if (regions.length >= 3) doc.city = regions[2];
//  if (regions.length >= 4) doc.county = regions[3];
//  if (regionInfo.country) doc.country = regionInfo.country;

  self.docs.push(doc);
};//addDateToQueue


/**
*
* @param params - contains userObj
*   userObj contains userId, latlng, region, geolibType, gender, createTime, emailAccount, name, height, deviceType, disabled.
* @param callback - is function(err)
*/
SolrClient.prototype.addUserToQueue = function (params,callback) {
  var messagePrefix = 'in SolrClient.addUserToQueue, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }
  if (!params.userObj){
    var err = self.newError({errorKey:'needParameter',messageParams:['userObj'],messagePrefix:messagePrefix});
    return callback(err);
  }
  var userObj = params.userObj;

  var regionInfo = handy.getAllLevelRegion({region:userObj.region,geolibType:userObj.geolibType});
  //logger.logDebug("SolrClient.addUserToQueue inner, regionInfo="+util.inspect(regionInfo,false,100));
  //console.trace();
  if (regionInfo.err) return callback(regionInfo.err);
  var regions = regionInfo.regions;
  var disabled = handy.convertToBool(userObj.disabled);
  //logger.logDebug("SolrClient.addUserToQueue inner, regions="+util.inspect(regions,false,100));

  var docId = "user:"+userObj.userId;
  var doc = {id:docId, type:"user", pointLatLon:userObj.latlng,
          gender:userObj.gender, emailAccount:userObj.emailAccount, name:userObj.name,
          height:userObj.height, deviceType:userObj.deviceType, disabled:disabled, createTime:userObj.createTime
        };
  if (regions.length >= 1) doc.countryCode = regions[0];
  if (regions.length >= 2) doc.state = regions[1];
  if (regions.length >= 3) doc.city = regions[2];
  if (regions.length >= 4) doc.county = regions[3];
  if (regionInfo.country) doc.country = regionInfo.country;

  //logger.logDebug("SolrClient.addUserToQueue exiting, regions="+util.inspect(regions,false,100));
  //logger.logDebug("SolrClient.addUserToQueue exiting, doc="+util.inspect(doc,false,100));
  self.docs.push(doc);
};//addUserToQueue


/**
* no need use excludeUserId for now because the gender is different from the user and will exclude the user.
*
* @param params - contains pointLatLon, start(optional), count(optional), gender(optional)
* @param callback - is function(err,datesInfo)
*   datesInfo contains dateIds,totalCount
*/
SolrClient.prototype.queryNearbyDateIds = function (params,callback) {
  var messagePrefix = 'in SolrClient.queryNearbyDateIds, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }

  if (!params.pointLatLon){
    var err = self.newError({errorKey:'needParameter',messageParams:['pointLatLon'],messagePrefix:messagePrefix});
    return callback(err);
  }
  var pointLatLon = params.pointLatLon;
  var start = params.start;
  var count = params.count;
  var gender = params.gender;
  if (!gender) gender = 'female';
  var nowUtcTime = handy.getNowOfUTCdate().getTime();//for excludeExpired
  var min10byMs = 10*60*1000;
  var nowUtcTimeBy10Min = Math.floor(nowUtcTime / min10byMs) * min10byMs;
  var paramsDetail = {pointLatLon:pointLatLon, start:start, count:count,
        gender:gender, excludeUserId:null, dateDateStart:nowUtcTimeBy10Min, finalConfirmed:null,
        strFields:"id"
      };
  self.queryDateSortByDistance(paramsDetail, function(err,solrRetObj){
    if (err) return callback(err);
    var docs = solrRetObj.response.docs;
    if (docs && docs.length>0){
      var dateIds = [];
      var idPrefix = "date:";
      for(var i=0; i<docs.length; i++){
        var doc = docs[i];
        var docId = doc.id;
        var dateId = docId.substring(idPrefix.length);
        dateIds.push(dateId);
      }//for
      var totalCount = solrRetObj.response.numFound;
      return callback(null,{dateIds:dateIds,totalCount:totalCount});
    }
    return callback(null,null);
  });//queryDateSortByDistance
};//queryNearbyDateIds




/**
* no need use excludeUserId for now because the gender is different from the user and will exclude the user.
*
* @param params - contains pointLatLon, distance(in kilometer), gender, start(optional), count(optional),
*   region(optional), geolibType(optional).
* @param callback - is function(err,usersInfo)
*   usersInfo contains userIds,totalCount
*/
SolrClient.prototype.queryNearbyUserIdsInDistance = function (params,callback) {
  var messagePrefix = 'in SolrClient.queryNearbyUserIdsInDistance, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }

  if (!params.pointLatLon){
    var err = self.newError({errorKey:'needParameter',messageParams:['pointLatLon'],messagePrefix:messagePrefix});
    return callback(err);
  }
  if (!params.distance){
    var err = self.newError({errorKey:'needParameter',messageParams:['distance'],messagePrefix:messagePrefix});
    return callback(err);
  }
  if (!params.gender){
    var err = self.newError({errorKey:'needParameter',messageParams:['gender'],messagePrefix:messagePrefix});
    return callback(err);
  }
  var pointLatLon = params.pointLatLon;
  var distance = params.distance;
  var gender = params.gender;
  var start = params.start;
  var count = params.count;

  var region = params.region;
  var geolibType = params.geolibType;
  var regions = [];
  var countryCode = null;

  if (region && geolibType){
    var regionInfo = handy.getAllLevelRegion({region:region,geolibType:geolibType});
    if (regionInfo.err) return callback(regionInfo.err);
    if (regionInfo.regions && regionInfo.regions.length > 0) regions = regionInfo.regions;
    if (regions.length >= 1) countryCode = regions[0];
  }

  var paramsDetail = {pointLatLon:pointLatLon, distance:distance, start:start, count:count,
        gender:gender, countryCode:countryCode,
        strFields:"id"
      };
  self.queryUserInDistance(paramsDetail, function(err,solrRetObj){
    if (err) return callback(err);
    var docs = solrRetObj.response.docs;
    if (docs && docs.length>0){
      var userIds = [];
      var idPrefix = "user:";
      for(var i=0; i<docs.length; i++){
        var doc = docs[i];
        var docId = doc.id;
        var userId = docId.substring(idPrefix.length);
        userIds.push(userId);
      }//for
      var totalCount = solrRetObj.response.numFound;
      return callback(null,{userIds:userIds,totalCount:totalCount});
    }
    return callback(null,null);
  });//queryUserInDistance
};//queryNearbyUserIdsInDistance



/**
 * the example url is : http://localhost:8983/solr/select/?wt=json&indent=true&start=0&rows=20&q=*.*&sfield=pointLatLon&pt=39.907366%2C116.356716&sort=geodist()%20asc
 *
 * @param params - contains pointLatLon, start(optional), count(optional),
 *   gender(optional), excludeUserId(optional), dateDateStart(optional), dateDateEnd(optional),
 *   countryCode(optional), country(optional), state(optional), city(optional), county(optional),
 *   finalConfirmed(optional), excludeCandidateId(optional),
 *   strFields(optional), fields(optional)
 * @param callback - is function(err,solrRetObj)
 */
SolrClient.prototype.queryDateSortByDistance = function (params,callback) {
  var messagePrefix = 'in SolrClient.queryDateSortByDistance, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }

  if (!params.pointLatLon){
    var err = self.newError({errorKey:'needParameter',messageParams:['pointLatLon'],messagePrefix:messagePrefix});
    return callback(err);
  }

  var pointLatLon = params.pointLatLon;
  var start = params.start;
  var count = params.count;

  var gender = params.gender;
  var excludeUserId = params.excludeUserId;
  var dateDateStart = params.dateDateStart;
  var dateDateEnd = params.dateDateEnd;
  var countryCode = params.countryCode;
  var country = params.country;
  var state = params.state;
  var city = params.city;
  var county = params.county;
  var finalConfirmed = params.finalConfirmed;
  var excludeCandidateId = params.excludeCandidateId;
  var strFields = params.strFields;
  var fields = params.fields;

  var fqConditions = [];
  fqConditions.push("type:date");
  if (gender) fqConditions.push("gender:"+gender);
  if (excludeUserId) fqConditions.push("NOT userId:"+excludeUserId);
  if (dateDateStart || dateDateEnd){
    if (!dateDateStart) dateDateStart = "*";
    if (!dateDateEnd) dateDateEnd = "*";
    fqConditions.push("dateDate:["+dateDateStart+" TO "+dateDateEnd+"]");
  }
  if (countryCode) fqConditions.push("countryCode:"+countryCode);
  if (country) fqConditions.push("country:"+country);
  if (state) fqConditions.push("state:"+state);
  if (city) fqConditions.push("city:"+city);
  if (county) fqConditions.push("county:"+county);
  if (finalConfirmed != null) fqConditions.push("finalConfirmed:"+handy.convertToBool(finalConfirmed));
  if (excludeCandidateId) fqConditions.push("NOT candidateId:"+excludeCandidateId);
  var strFqConditions = '';
  if (fqConditions.length > 0) strFqConditions = fqConditions.join(" AND ");

  var query = {wt:'json', indent:'true'};
  if (start!=null) query.start = start;
  if (count) query.rows = count;
  query.q = '*:*';
  query.sfield = 'pointLatLon';
  query.pt = pointLatLon;
  if (strFqConditions) query.fq = strFqConditions;
  if (strFields){
    query.fl = strFields;
  }else if (fields && fields.length > 0){
    query.fl = fields.join(",");
  }
  query.sort = "geodist() asc";

  var queryStr = querystring.stringify(query);
  var path = '/solr/select/?'+queryStr;
  logger.logDebug("in queryDateSortByDistance, path="+path+"\n  query="+util.inspect(query,false,100));
  handy.doHttpGet({host:self.host,port:self.port,path:path},function(err,retDataObj){
    if (err) return callback(err);
    logger.logDebug("in queryDateSortByDistance, retDataObj="+util.inspect(retDataObj,false,100));
    var dataObj = JSON.parse(retDataObj.data);
    return callback(null,dataObj);
  });//doHttpGet
};//queryDateSortByDistance



/**
 * the example url is : http://localhost:8983/solr/select?wt=json&indent=true&start=0&rows=20&fl=*,score&q={!func}geodist()&fq={!geofilt}&fq=county:Xicheng&sfield=pointLatLon&pt=39.907366,116.356716&d=4&sort=score asc
 * sort by distance is internal built behavior.
 * @param params - contains pointLatLon, distance(in kilometer), start(optional), count(optional),
 *   gender(optional), excludeUserId(optional), dateDateStart(optional), dateDateEnd(optional),
 *   countryCode(optional), country(optional), state(optional), city(optional), county(optional),
 *   finalConfirmed(optional), excludeCandidateId(optional),
 *   strFields(optional), fields(optional).
 *   strFields can be *,score.
 * @param callback - is function(err,solrRetObj)
 */
SolrClient.prototype.queryDateInDistance = function (params,callback) {
  var messagePrefix = 'in SolrClient.queryDateInDistance, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }

  if (!params.pointLatLon){
    var err = self.newError({errorKey:'needParameter',messageParams:['pointLatLon'],messagePrefix:messagePrefix});
    return callback(err);
  }
  if (!params.distance){
    var err = self.newError({errorKey:'needParameter',messageParams:['distance'],messagePrefix:messagePrefix});
    return callback(err);
  }
  var pointLatLon = params.pointLatLon;
  var distance = params.distance;
  var start = params.start;
  var count = params.count;

  var gender = params.gender;
  var excludeUserId = params.excludeUserId;
  var dateDateStart = params.dateDateStart;
  var dateDateEnd = params.dateDateEnd;
  var countryCode = params.countryCode;
  var country = params.country;
  var state = params.state;
  var city = params.city;
  var county = params.county;
  var finalConfirmed = params.finalConfirmed;
  var excludeCandidateId = params.excludeCandidateId;
  var strFields = params.strFields;
  var fields = params.fields;

  var fqConditions = [];
  fqConditions.push("type:date");
  if (gender) fqConditions.push("gender:"+gender);
  if (excludeUserId) fqConditions.push("NOT userId:"+excludeUserId);
  if (dateDateStart || dateDateEnd){
    if (!dateDateStart) dateDateStart = "*";
    if (!dateDateEnd) dateDateEnd = "*";
    fqConditions.push("dateDate:["+dateDateStart+" TO "+dateDateEnd+"]");
  }
  if (countryCode) fqConditions.push("countryCode:"+countryCode);
  if (country) fqConditions.push("country:"+country);
  if (state) fqConditions.push("state:"+state);
  if (city) fqConditions.push("city:"+city);
  if (county) fqConditions.push("county:"+county);
  if (finalConfirmed != null) fqConditions.push("finalConfirmed:"+handy.convertToBool(finalConfirmed));
  if (excludeCandidateId) fqConditions.push("NOT candidateId:"+excludeCandidateId);
  var strFqConditions = '';
  if (fqConditions.length > 0) strFqConditions = fqConditions.join(" AND ");
  var fqAry = ['{!geofilt}'];
  if (strFqConditions) fqAry.push(strFqConditions);

  var query = {wt:'json', indent:'true'};
  if (start!=null) query.start = start;
  if (count) query.rows = count;
  query.q = '{!func}geodist()';
  query.fq = fqAry;
  query.d = distance;
  query.sfield = 'pointLatLon';
  query.pt = pointLatLon;

  if (strFields){
    query.fl = strFields;
  }else if (fields && fields.length > 0){
    query.fl = fields.join(",");
  }else{
    query.fl = "*,score";
  }
  query.sort = "score asc";

  var queryStr = querystring.stringify(query);
  var path = '/solr/select/?'+queryStr;
  logger.logDebug("in queryDateInDistance, path="+path+"\n  query="+util.inspect(query,false,100));
  handy.doHttpGet({host:self.host,port:self.port,path:path},function(err,retDataObj){
    if (err) return callback(err);
    logger.logDebug("in queryDateInDistance, retDataObj="+util.inspect(retDataObj,false,100));
    var dataObj = JSON.parse(retDataObj.data);
    return callback(null,dataObj);
  });//doHttpGet
};//queryDateInDistance






/**
 * the example url is : http://localhost:8983/solr/select?wt=json&indent=true&start=0&rows=20&fl=*,score&q={!func}geodist()&fq={!geofilt}&fq=county:Xicheng&sfield=pointLatLon&pt=39.907366,116.356716&d=4&sort=score asc
 * sort by distance is internal built behavior.
 * @param params - contains pointLatLon, distance(in kilometer), start(optional), count(optional),
 *   gender(optional), emailAccount(optional), name(optional), heightStart(optional), heightEnd(optional), deviceType(optional),
 *   countryCode(optional), country(optional), state(optional), city(optional), county(optional),
 *   disabled(optional),
 *   strFields(optional), fields(optional).
 *   strFields can be *,score.
 * @param callback - is function(err,solrRetObj)
 */
SolrClient.prototype.queryUserInDistance = function (params,callback) {
  var messagePrefix = 'in SolrClient.queryUserInDistance, ';
  var self = this;
  if(!callback){
    var err = self.newError({errorKey:'needCallbackFunction',messagePrefix:messagePrefix});
    return self.handleError({err:err});
  }

  if (!params.pointLatLon){
    var err = self.newError({errorKey:'needParameter',messageParams:['pointLatLon'],messagePrefix:messagePrefix});
    return callback(err);
  }
  if (!params.distance){
    var err = self.newError({errorKey:'needParameter',messageParams:['distance'],messagePrefix:messagePrefix});
    return callback(err);
  }

  var pointLatLon = params.pointLatLon;
  var distance = params.distance;
  var start = params.start;
  var count = params.count;
  var gender = params.gender;
  var emailAccount = params.emailAccount;
  var name = params.name;
  var heightStart = params.heightStart;
  var heightEnd = params.heightEnd;
  var deviceType = params.deviceType;
  var countryCode = params.countryCode;
  var country = params.country;
  var state = params.state;
  var city = params.city;
  var county = params.county;
  var disabled = params.disabled;

  var strFields = params.strFields;
  var fields = params.fields;

  var fqConditions = [];
  fqConditions.push("type:user");
  if (gender) fqConditions.push("gender:"+gender);
  if (emailAccount) fqConditions.push("emailAccount:"+emailAccount);
  if (name) fqConditions.push("name:"+name);
  if (heightStart || heightEnd){
    if (!heightStart) heightStart = "*";
    if (!heightEnd) heightEnd = "*";
    fqConditions.push("height:["+heightStart+" TO "+heightEnd+"]");
  }
  if (deviceType) fqConditions.push("deviceType:"+deviceType);
  if (countryCode) fqConditions.push("countryCode:"+countryCode);
  if (country) fqConditions.push("country:"+country);
  if (state) fqConditions.push("state:"+state);
  if (city) fqConditions.push("city:"+city);
  if (county) fqConditions.push("county:"+county);
  if (disabled != null) fqConditions.push("disabled:"+handy.convertToBool(disabled));

  var strFqConditions = '';
  if (fqConditions.length > 0) strFqConditions = fqConditions.join(" AND ");
  var fqAry = ['{!geofilt}'];
  if (strFqConditions) fqAry.push(strFqConditions);

  var query = {wt:'json', indent:'true'};
  if (start!=null) query.start = start;
  if (count) query.rows = count;
  query.q = '{!func}geodist()';
  query.fq = fqAry;
  query.d = distance;
  query.sfield = 'pointLatLon';
  query.pt = pointLatLon;

  if (strFields){
    query.fl = strFields;
  }else if (fields && fields.length > 0){
    query.fl = fields.join(",");
  }else{
    query.fl = "*,score";
  }
  query.sort = "score asc";

  var queryStr = querystring.stringify(query);
  var path = '/solr/select/?'+queryStr;
  logger.logDebug("in queryUserInDistance, path="+path+"\n  query="+util.inspect(query,false,100));
  handy.doHttpGet({host:self.host,port:self.port,path:path},function(err,retDataObj){
    if (err) return callback(err);
    logger.logDebug("in queryUserInDistance, retDataObj="+util.inspect(retDataObj,false,100));
    var dataObj = JSON.parse(retDataObj.data);
    return callback(null,dataObj);
  });//doHttpGet
};//queryUserInDistance









