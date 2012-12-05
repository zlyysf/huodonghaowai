/**
 * This file is a place to hold misc helpful functions.
 */

var http = require('http');
var https = require('https');
var util = require('util');
var fs = require("fs");
var path = require('path');
var assert = require('assert');
var crypto = require('crypto');

var config = require('./config');
var logger = require('./logger');
var tool = require('./tool');

var to_array = exports.to_array = function(obj) {
  //logDebug("handy to_array entered");
  var len = obj.length, arr = new Array(len);
  for ( var i = 0; i < len; ++i) {
    arr[i] = obj[i];
  }
  return arr;
};

var pipelineArray = exports.pipelineArray = function(functions) {
  //logDebug("handy pipelineArray entered");
  var next = function() {
    var newfunc = functions.shift();
    if (typeof newfunc == "function") {
      newfunc(next);
    }
  };
  next();
};
var pipeline = exports.pipeline = function() {
  //logDebug("handy pipeline entered");
  var functions = to_array(arguments);
  pipelineArray(functions);
};

var doLocalPost = exports.doLocalPost = function(port, postPath, postData, callback) {
  logDebug("handy doLocalPost entered");
  return exports.doHttpPost('localhost', port, postPath, postData, callback);
};

/**
*
* @param params - contains postForm, host,port,path,headers,
*   others @see doHttpRequestGeneral or http.request
* @param callback - is a function(err,retDataObj)
*   retDataObj contains data,responseInfo .
*     responseInfo contains statusCode,headers,httpVersion. data is a string
*/
var doHttpPostForm = exports.doHttpPostForm = function(params, callback) {
 logDebug("handy doHttpPostForm entered");
 if (!params.headers) params.headers = {};
 params.headers['Content-Type'] = 'application/x-www-form-urlencoded';
 params.postStrData = encodeFormData(params.postForm);
 params.method = 'POST';
 return doHttpRequestGeneral(params,callback);
};//doHttpPostXml

/**
 *
 * @param params - contains postXml, host,port,path,headers,
 *   others @see doHttpRequestGeneral or http.request
 * @param callback - is a function(err,retDataObj)
 *   retDataObj contains data,responseInfo .
 *     responseInfo contains statusCode,headers,httpVersion. data is a string
 */
var doHttpPostXml = exports.doHttpPostXml = function(params, callback) {
  logDebug("handy doHttpPostXml entered");
  if (!params.headers) params.headers = {};
  params.headers['Content-Type'] = 'application/xml';
  params.postStrData = params.postXml;
  params.method = 'POST';
  return doHttpRequestGeneral(params,callback);
};//doHttpPostXml
/**
 * TODO replace doHttpPost
 * @param params - contains needHttps, postDataObj, host,port,path,headers,
 *   others @see doHttpRequestGeneral or http.request
 * @param callback - is a function(err,retDataObj)
 *   retDataObj contains data,responseInfo .
 *     responseInfo contains statusCode,headers,httpVersion. data is a string
 */
var doHttpPostJson = exports.doHttpPostJson = function(params, callback) {
  //logDebug("handy doHttpPostJson entered");
  if (!params.headers) params.headers = {};
  params.headers['Content-Type'] = 'application/json';
  if(params.postDataObj) params.postStrData = JSON.stringify(params.postDataObj);
  params.method = 'POST';
  return doHttpRequestGeneral(params,callback);
};//doHttpPostJson
/**
 *
 * @param params - contains host,port,path,headers,
 *   others @see doHttpRequestGeneral or http.request
 * @param callback - is a function(err,retDataObj)
 *   retDataObj contains data,responseInfo .
 *     responseInfo contains statusCode,headers,httpVersion. data is a string
 */
var doHttpGet = exports.doHttpGet = function(params, callback) {
  logDebug("handy doHttpGet entered");
  params.method = 'GET';
  return doHttpRequestGeneral(params,callback);
};//doHttpGet

/**
 *
 * @param params - contains needHttps, postStrData, host,port,path,method,headers, others @see http.request
 * @param callback - is a function(err,retDataObj)
 *   retDataObj contains data,responseInfo .
 *     responseInfo contains statusCode,headers,httpVersion. data is a string
 */
var doHttpRequestGeneral = exports.doHttpRequestGeneral = function(params, callback) {
  var messagePrefix = 'in handy.doHttpRequestGeneral, ';
  var postStrData = params.postStrData;
  var headers = params.headers ? params.headers : {};
  var options = {
    host : params.host,
    port : params.port,
    path : params.path,
    method : params.method,
    headers : headers
  };

  var httpLib = http;
  if (params.needHttps)  httpLib = https;
  var req = httpLib.request(options, function(res) {
    res.setEncoding('utf8');
    req.receivedData = '';
    var alreadyReturn = false;

    res.on('data', function (data) {
      //logDebug("res on data event, data="+data);
      req.receivedData += data;
    });
    res.on('end', function () {
      //logDebug("res on end event, receivedData="+req.receivedData);
      if (!alreadyReturn) {
        alreadyReturn = true;
        var responseInfo = {httpVersion:res.httpVersion, headers:res.headers, statusCode:res.statusCode};
        callback(null, {data:req.receivedData, responseInfo:responseInfo});
      }
    });
    res.on('close', function (err) {
      if (err) logDebug("res on close event, err="+util.inspect(err,false,100));
      else logDebug("res on close event");
      if (err) {
        var err2 = newError({errorKey:'libraryError',messageParams:['http'],messagePrefix:messagePrefix,innerError:err});
        callback(err2);
      }
      if (!alreadyReturn) {
        alreadyReturn = true;
        var responseInfo = {httpVersion:res.httpVersion, headers:res.headers, statusCode:res.statusCode};
        callback(null, {data:req.receivedData, responseInfo:responseInfo});
      }
    });//on close event
  });
  req.optionsData = options;
  req.on('error', function(err) {
    logError("req on error event, err="+util.inspect(err,false,100)+", optionsData="+util.inspect(req.optionsData,false,100)
        +", receivedData="+util.inspect(req.receivedData,false,100));
    var err2 = newError({errorKey:'libraryError',messageParams:['http'],messagePrefix:messagePrefix,innerError:err});
    callback(err2);
  });
  if(postStrData)  req.write(postStrData);
  req.end();
};//doHttpRequestGeneral

var doHttpPost = exports.doHttpPost = function(host, port, postPath, postData, callback) {
  var messagePrefix = 'in handy.doHttpPost, ';
  var options = {
    host : host,
    port : port,
    path : postPath,
    method : "POST",
    headers : {
      'content-type' : 'application/json'
    }
  };

  var req = http.request(options, function(res) {
    res.setEncoding('utf8');
    var buf = '';
    var alreadyReturn = false;
    res.on('data', function (data) {
      logDebug("res on data event, data="+data);
      buf += data;
    });
    res.on('end', function () {
      logDebug("res on end event, buf="+buf);
      if (!alreadyReturn) {
        alreadyReturn = true;
        var dataObj = JSON.parse(buf);
        callback(null, dataObj);
      }
    });
    res.on('close', function (err) {
      logDebug("res on close event, err="+util.inspect(err,false,100));
      if (err) {
        var err2 = newError({errorKey:'libraryError',messageParams:['http'],messagePrefix:messagePrefix,innerError:err});
        callback(err2);
      }
      if (!alreadyReturn) {
        alreadyReturn = true;
        var dataObj = JSON.parse(buf);
        callback(null, dataObj);
      }
    });//on close event
  });
  req.on('error', function(err) {
    logError("req on error event, err="+util.inspect(err,false,100));
    var err2 = newError({errorKey:'libraryError',messageParams:['http'],messagePrefix:messagePrefix,innerError:err});
    callback(err2);
  });

  var postBody = JSON.stringify(postData);
  req.write(postBody + "\n");
  req.end();
};//doHttpPost

/**
 *
 * @param params - contains postDataObj, postDataAsStr, host,port,path,key,cert,ca,headers.Authorization
 *   @see https.request
 *   postDataAsStr has high priority over postDataObj.
 * @param callback
 * @returns - contains err, retDataObj
 *   retDataObj contains data,responseInfo . responseInfo contains statusCode,headers,httpVersion
 */
var doHttpsPostByForm = exports.doHttpsPostByForm = function(params, callback) {
  var messagePrefix = 'in handy.doHttpsPostByForm, ';
  var postBody = "";
  if (params.postDataObj){
    postBody = encodeFormData(params.postDataObj);
  }
  if (params.postDataAsStr)
    postBody = params.postDataAsStr;
  console.log("postBody len="+postBody.length+", content="+postBody);
  var sendContentLength = postBody.length;

  var options = {
    host : params.host ? params.host : 'localhost',
    port : params.port ? params.port : 443,
    method : "POST",
    path : params.path ? params.path : '/',
    key : params.key,
    cert : params.cert,
    ca : params.ca,
    headers : {
      'Content-Length' : sendContentLength,
      'Content-Type' : 'application/x-www-form-urlencoded'
    }
  };
  if (params.headers && params.headers.Authorization)
    options.headers.Authorization = params.headers.Authorization;

  //logDebug("doHttpsPostByForm enter, options="+util.inspect(options,false,100));

  var req = https.request(options, function(res) {
    res.setEncoding('utf8');
    req.receivedData = '';
    var alreadyReturn = false;

    res.on('data', function (data) {
      //logDebug("res on data event, data="+util.inspect(data,false,100));
      req.receivedData += data;
    });
    res.on('end', function () {
      logDebug("res on end event, receivedData="+util.inspect(req.receivedData,false,100));
      if (!alreadyReturn) {
        alreadyReturn = true;
        var responseInfo = {httpVersion:res.httpVersion, headers:res.headers, statusCode:res.statusCode};
        callback(null, {data:req.receivedData, responseInfo:responseInfo});
      }
    });
    res.on('close', function (err) {
      if (err) logDebug("res on close event, err="+util.inspect(err,false,100));
      else logDebug("res on close event");
      if (err){
        var err2 = newError({errorKey:'libraryError',messageParams:['https'],messagePrefix:messagePrefix,innerError:err});
        callback(err2);
      }
      if (!alreadyReturn) {
        alreadyReturn = true;
        var responseInfo = {httpVersion:res.httpVersion, headers:res.headers, statusCode:res.statusCode};
        callback(null, {data:req.receivedData, responseInfo:responseInfo});
      }
    });//on close event
  });//https.request
  req.optionsData = options;
  req.on('error', function(err) {
//    logDebug("req on error event, err="+util.inspect(err,false,100)+", optionsData="+util.inspect(req.optionsData,false,100)
//        +", receivedData="+util.inspect(req.receivedData,false,100));
    var err2;
    if (err.code == 'ECONNREFUSED'){
      err2 = newError({errorKey:'socketECONNREFUSED',messageParams:[],messagePrefix:messagePrefix,innerError:err});
    }else if (err.code == 'ECONNRESET'){
      err2 = newError({errorKey:'socketECONNRESET',messageParams:[],messagePrefix:messagePrefix,innerError:err});
    }else{
      err2 = newError({errorKey:'libraryError',messageParams:['https'],messagePrefix:messagePrefix,innerError:err});
    }
    callback(err2);
  });

  req.write(postBody);
  req.end();
  logDebug("req.write done, len="+postBody.length+", data="+postBody);
};//doHttpsPostByForm

/**
 * from internet
 *
 * Encode the property name/value pairs of an object as if they were from
 * an HTML form, using application/x-www-form-urlencoded format
 */
var encodeFormData = exports.encodeFormData = function(data) {
    var pairs = [];
    var regexp = /%20/g; // A regular expression to match an encoded space

    for(var name in data) {
        var value = data[name].toString();
        // Create a name/value pair, but encode name and value first
        // The global function encodeURIComponent does almost what we want,
        // but it encodes spaces as %20 instead of as "+". We have to
        // fix that with String.replace()

//        var pair = encodeURIComponent(name).replace(regexp,"+") + '=' +
//            encodeURIComponent(value).replace(regexp,"+");
        var pair = encodeURI(name).replace(regexp,"+") + '=' +
        encodeURI(value).replace(regexp,"+");

        pairs.push(pair);
    }

    // Concatenate all the name/value pairs, separating them with &
    return pairs.join('&');
};
exports.encodeFormData = encodeFormData;

var randomItem = exports.randomItem = function(items) {
  logDebug("handy randomItem entered");
  if (items && items.length>0){
    var r = Math.floor(Math.random() * items.length);
    if (r >= items.length)
      r = items.length - 1;
    var item = items[r];
    return item;
  }
  return null;
};

var AlphabetNumberChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
var randomAlphabetNumberString = exports.randomAlphabetNumberString = function(len) {
  if(!len) return null;
  var totalLen = AlphabetNumberChars.length;
  var randomStr = "";
  for(var i=0; i<len; i++){
    var randomIdx = Math.floor(Math.random() * totalLen);
    var randomChar = AlphabetNumberChars.charAt(randomIdx);
    randomStr += randomChar;
  }//for
  return randomStr;
};


/**
 * this function is for redis command hmset, hmset need an array like redisKey, field1, value1, field2, value2 ...
 * obj contains some field=value pair
 * this function will convert to an array as such format: key, field1, value1, field2, value2 ...
 * @param key
 * @param obj
 * @returns
 */
var toArray = exports.toArray = function(key,obj){
  //logDebug("handy toArray entered");
  var ary = [];
  for(var fld in obj){
    ary.push(fld);
    ary.push(obj[fld]);
  }
  var ary2 = [key].concat(ary);
  return ary2;
};

Pile = function() {
  logDebug("handy Pile entered");
  this.pile = [];
  this.concurrency = 0;
  this.done = null;
  this.max_concurrency = 1;
};
exports.Pile = Pile;

Pile.prototype = {
  add : function(callback) {
    this.pile.push(callback);
  },

  run : function(done, max_concurrency) {
    this.done = done || this.done;
    this.max_concurrency = max_concurrency || this.max_concurrency;
    var target = this.pile.length;
    var that = this;
    var next = function() {
      that.concurrency--;
      (--target == 0 ? that.done() : that.run());
    };
    while (this.concurrency < this.max_concurrency && this.pile.length > 0) {
      this.concurrency++;
      var callback = this.pile.shift();
      callback(next);
    }
  }
};

/**
 *
 * @param params - contains number, length, complementInRight, complementChar, needCutWhenExceed, cutInLow
 *   number can be a number or a string. when being a string, is number expression.
 * @returns
 */
var formatNumberWithGivenLength = exports.formatNumberWithGivenLength = function(params){
  var number = params.number;
  var length = params.length;
  var complementInRight = params.complementInRight;
  var complementChar = params.complementChar;
  var needCutWhenExceed = params.needCutWhenExceed;
  var cutInLow = params.cutInLow;
  assert.ok(number != null);
  assert.ok(length);
  number = Number(number);
  if (complementInRight == null)  complementInRight = false;
  if (complementChar == null) complementChar = '0';
  var numberStr = number + '';
  var difLen = length - numberStr.length;
  if (difLen == 0){
    return numberStr;
  }else if (difLen > 0){
    var difStr = '';
    for(var i=0; i<difLen; i++)
      difStr += complementChar;
    if (complementInRight){
      numberStr = numberStr + difStr;
    }else{
      numberStr = difStr + numberStr;
    }
    return numberStr;
  }else{
    //difLen < 0
    if (needCutWhenExceed){

      if (cutInLow){
        //digit low be string right  , string right be string high
        numberStr = numberStr.substring(0, length);
      }else{
        numberStr = numberStr.substring(difLen*-1,numberStr.length);
      }
    }
    return numberStr;
  }
};

/**
 *
 * @param params - contains dt,needUTC,needSeparateChar,onlyDatePart,onlyTimePart,needSecondPart,needMsPart
 *   dt can be a Date object or a number. the number is milliseconds for Date constructor.
 * @returns
 */
var formatDate = exports.formatDate = function(params){
  var dt = params.dt;
  var needUTC = params.needUTC;
  var needSeparateChar = params.needSeparateChar;
  var onlyDatePart = params.onlyDatePart;
  var onlyTimePart = params.onlyTimePart;
  var needSecondPart = params.needSecondPart;
  var needMsPart = params.needMsPart;
  assert.ok(dt);
  dt = convertToDate(dt);
  var year, month, day, minute, second, millisecond;
  if (needUTC){
    year = dt.getUTCFullYear() + '';
    month = formatNumberWithGivenLength({number:dt.getUTCMonth()+1,length:2,complementInRight:false,complementChar:'0'});
    day = formatNumberWithGivenLength({number:dt.getUTCDate(),length:2,complementInRight:false,complementChar:'0'});
    hour = formatNumberWithGivenLength({number:dt.getUTCHours(),length:2,complementInRight:false,complementChar:'0'});
    minute = formatNumberWithGivenLength({number:dt.getUTCMinutes(),length:2,complementInRight:false,complementChar:'0'});
    second = formatNumberWithGivenLength({number:dt.getUTCSeconds(),length:2,complementInRight:false,complementChar:'0'});
    millisecond =  formatNumberWithGivenLength({number:dt.getUTCMilliseconds(),length:3,complementInRight:true,complementChar:'0'});
  }else{
    year = dt.getFullYear() + '';
    month = formatNumberWithGivenLength({number:dt.getMonth()+1,length:2,complementInRight:false,complementChar:'0'});
    day = formatNumberWithGivenLength({number:dt.getDate(),length:2,complementInRight:false,complementChar:'0'});
    hour = formatNumberWithGivenLength({number:dt.getHours(),length:2,complementInRight:false,complementChar:'0'});
    minute = formatNumberWithGivenLength({number:dt.getMinutes(),length:2,complementInRight:false,complementChar:'0'});
    second = formatNumberWithGivenLength({number:dt.getSeconds(),length:2,complementInRight:false,complementChar:'0'});
    millisecond =  formatNumberWithGivenLength({number:dt.getMilliseconds(),length:3,complementInRight:true,complementChar:'0'});
  }

  var datePart, timePart, dtStr;
  if (needSeparateChar){
    datePart = year+"-"+month+"-"+day;
    timePart = hour+":"+minute;
    if (needSecondPart){
      timePart += ":"+second;
      if (needMsPart)  timePart += "."+millisecond;
    }
    dtStr = datePart+" "+timePart;
  }else{
    datePart = year+month+day;
    timePart = hour+minute;
    if (needSecondPart){
      timePart += second;
      if (needMsPart)  timePart += millisecond;
    }
    dtStr = datePart+timePart;
  }

  if (onlyDatePart){
    return datePart;
  }
  if (onlyTimePart){
    return timePart;
  }
  return dtStr;
};//formatDate






var beNthPowerOf2 = exports.beNthPowerOf2 = function(i){
  function log10(x) { return Math.LOG10E * Math.log(x); }
  function log2(x) { return  Math.LOG2E * Math.log(x); }
  var lg = Math.round(log2(i));
  var p = Math.pow(2,lg);
  var beNthPow = (i==p);
  var nth = null;
  if (beNthPow) nth = lg;
  return {beNthPow:beNthPow,nth:nth};
};//beNthPowerOf2



var log = exports.log = function(pick, args) {
  var colors = config.colors;
  var color = colors[pick] == undefined ? colors['yellow'] : colors[pick];

  util.print('\033[' + color[0] + 'm');
  util.log(util.inspect(args, true, 10));
  util.print('\033[' + color[1] + 'm');
};

/**
 * convert an array to hash-like object.
 * the value of the item keyField in the array is the key in the hash
 *
 * @param itemArray, keyField - the element must contain keyField field
 * @returns - the hash of items
 */
var toHash = exports.toHash = function(params){
  assert.ok(params.itemArray);
  assert.ok(params.keyField);
  var itemArray = params.itemArray;
  var keyField = params.keyField;
  var itemHash = {};
  for(var i=0; i<itemArray.length; i++){
    var item = itemArray[i];
    var keyVal = item[keyField];
    itemHash[keyVal] = item;
  }//for
  return itemHash;
};//toHash

var toHashWith2Array = exports.toHashWith2Array = function(params){
  assert.ok(params.valueArray);
  assert.ok(params.keyArray);
  //logDebug("handy.toHashWith2Array entered, params="+util.inspect(params,false,100));
  var valueArray = params.valueArray;
  var keyArray = params.keyArray;
  assert.ok(valueArray.length == keyArray.length);
  if (valueArray.length==0)
    return null;
  var objHash = {};
  for(var i=0; i<valueArray.length; i++){
    var key = keyArray[i];
    var value = valueArray[i];
    objHash[key] = value;
  }//for
  return objHash;
};//toHashWith2Array


/**
 * convert an array to hash-like object.
 * the value of the item keyField in the array is the key in the hash
 *
 * @param params - contains needKey, needValue, hash, excludeKey
 * @returns - a hash, contains 2 fields, keys and values.
 */
var hashToArray = exports.hashToArray = function(params){
  if (!params || !(params.needKey || params.needValue) ){
    return null;
  }
  if (!params.hash)  return null;
  var hash = params.hash;
  var excludeKey = params.excludeKey;
  var keys = [], values = [];
  for(key in hash){
    if (!excludeKey || excludeKey && excludeKey!=key){
      if (params.needKey){
        keys.push(key);
      }
      if (params.needValue){
        var val = hash[key];
        values.push(val);
      }
    }
  }//for
  var retData = {keys:keys, values:values};
  return retData;
};//hashToArray

/**
 * only support the element type is basic for now. in fact, here use == to compare.
 * @param params - contains ary, item
 * @returns - a value >=0 when found, -1 when not found
 */
var arrayIndexOf = exports.arrayIndexOf = function(params){
  var ary = params.ary;
  var item = params.item;
  if(ary && ary.length>0){
    for(var i=0; i<ary.length; i++){
      if (item == ary[i]){
        return i;
      }
    }//for
  }//if
  return -1;
};//arrayIndexOf

/**
 *
 * @param params - contains ary,
 * @returns - a value >=0 when found, -1 when not found
 */
var getArrayWithNonEmptyItem = exports.getArrayWithNonEmptyItem = function(params){
  var ary = params.ary;
  if(ary){
    var destAry = [];
    for(var i=0; i<ary.length; i++){
      var item = ary[i];
      if (item!=null && item!="") destAry.push(item);
    }//for
    return destAry;
  }//if
  return null;
};//getArrayWithNonEmptyItem

var cloneArray = exports.cloneArray = function(srcAry){
  if (!srcAry) return null;
  if (srcAry.length == 0) return [];
  var ary2 = [].concat(srcAry);
  return ary2;
};//cloneArray

var concatArray = exports.concatArray = function(params){
  var ary1 = params.ary1;
  var ary2 = params.ary2;
  if (!ary1 && !ary2)
    return null;
  var concatAry = [];
  if (!ary1){
    concatAry = cloneArray(ary2);
    return concatAry;
  }
  if (!ary2){
    concatAry = cloneArray(ary1);
    return concatAry;
  }
  concatAry = ary1.concat(ary2);
  return concatAry;
};//concatArray

var unionArray = exports.unionArray = function(params){
  var ary1 = params.ary1;
  var ary2 = params.ary2;
  if (!ary1 && !ary2)
    return null;
  var unionAry = [];
  if (!ary1){
    unionAry = cloneArray(ary2);
    return unionAry;
  }
  if (!ary2){
    unionAry = cloneArray(ary1);
    return unionAry;
  }
  unionAry = cloneArray(ary1);
  for(var i=0; i<ary2.length; i++){
    var item = ary2[i];
    if(arrayIndexOf({ary:ary1,item:item}) < 0){
      unionAry.push(item);
    }
  }//for
  return unionAry;
};//unionArray

var existIntersectionForArray = exports.existIntersectionForArray = function(params){
  var ary1 = params.ary1;
  var ary2 = params.ary2;
  if (!ary1 || !ary2)
    return false;
  if (ary1.length==0 || ary2.length==0)
    return false;
  for(var i=0; i<ary1.length; i++){
    var item = ary1[i];
    if(arrayIndexOf({ary:ary2,item:item}) >= 0){
      return true;
    }
  }//for
  return false;
};//existIntersectionForArray

var beSuperSetForArray = exports.beSuperSetForArray = function(params){
  var arySuper = params.arySuper;
  var ary = params.ary;
  if (!ary || ary.length==0)
    return true;
  //below ary.length > 0
  if (!arySuper || arySuper.length<ary.length)
    return false;
  //below arySuper.length >= ary.length > 0
  for(var i=0; i<ary.length; i++){
    var item = ary[i];
    if(arrayIndexOf({ary:arySuper,item:item}) < 0){
      return false;
    }
  }//for
  return true;
};//beSuperSetForArray


/**
 * aryDiff = arrayLeft - arrayRight -  hashRight - itemRight
 * @param params - contains arrayLeft, hashRight, itemRight
 * @returns - aryDiff
 */
var doDiffArray = exports.doDiffArray = function(params){
  //logDebug("handy doDiffArray entered, params="+util.inspect(params,false,100));
  var arrayLeft = params.arrayLeft;
  var hashRight = params.hashRight;
  var arrayRight = params.arrayRight;
  var itemRight = params.itemRight;
  var aryDiff;
  var aryRet = arrayLeft;
  if (aryRet == null)
    return aryRet;
  if (hashRight != null){
    aryDiff = [];
    for(var i=0; i<aryRet.length; i++){
      var itm = aryRet[i];
      if(hashRight[itm] != null){
        aryDiff.push(itm);
      }
    }//for
    aryRet = aryDiff;
  }

  if (arrayRight != null){
    aryDiff = [];
    for(var i=0; i<aryRet.length; i++){
      var itm = aryRet[i];
      var itemExistInRight = false;
      for(var j=0; j<arrayRight.length; j++){
        if (itm == arrayRight[j]){
          itemExistInRight = true;
          break;
        }
      }//for j
      if (!itemExistInRight){
        aryDiff.push(itm);
      }
    }//for i
    aryRet = aryDiff;
  }

  if (itemRight != null){
    aryDiff = [];
    for(var i=0; i<aryRet.length; i++){
      var itm = aryRet[i];
      if (itm != itemRight){
        aryDiff.push(itm);
      }
    }//for i
    aryRet = aryDiff;
  }
  return aryRet;
};//doDiffArray

/**
 * only support the id field value type is basic for now. in fact, here use == to compare.
 * @param params - contains objectAry, idFieldName, idValue
 * @returns - a value >=0 when found, -1 when not found
 */
var objectArrayIndexOfId = exports.objectArrayIndexOfId = function(params){
  var objectAry = params.objectAry;
  var idFieldName = params.idFieldName;
  var idValue = params.idValue;
  if(objectAry && objectAry.length>0){
    for(var i=0; i<objectAry.length; i++){
      var objectItem = objectAry[i];
      if (objectItem){
        if (idValue == objectItem[idFieldName])
          return i;
      }
    }//for
  }//if
  return -1;
};//objectArrayIndexOfId

/**
 *
 * @param params - contains objectAry, idFieldName
 * @returns - hash with each value being object item with key being object[idFieldName]
 */
var objectArrayToHashWithIdBeKey = exports.objectArrayToHashWithIdBeKey = function(params){
  var objectAry = params.objectAry;
  var idFieldName = params.idFieldName;
  if (objectAry == null) return null;
  var hash = {};
  for(var i=0; i<objectAry.length; i++){
    var objectItem = objectAry[i];
    if (objectItem){
      var idValue = objectItem[idFieldName];
      if (idValue) hash[idValue+''] = objectItem;
    }
  }//for
  return hash;
};//objectArrayIndexOfId

var getSubObjectArrayFromIds = exports.getSubObjectArrayFromIds = function(params){
  var objectAry = params.objectAry;
  var ids = params.ids;
  var idFieldName = params.idFieldName;
  if (!objectAry) return null;
  if (!ids) return null;
  if (!idFieldName) return null;
  var subAry = [];
  for(var i=0; i<ids.length; i++){
    var id = ids[i];
    var idx = objectArrayIndexOfId({objectAry:objectAry,idFieldName:idFieldName,idValue:id});
    if (idx>=0){
      subAry.push(objectAry[idx]);
    }
  }//for
  return subAry;
};//getSubObjectArrayFromIds


var objectHasNoField = exports.objectHasNoField = function(obj){
  if (obj==null)  return true;
  var fieldCount = 0;
  for(idx in obj){
    fieldCount ++;
    break;
  }
  return (fieldCount==0);
};
var objectFieldCount = exports.objectFieldCount = function(obj){
  if (obj==null)  return 0;
  var fieldCount = 0;
  for(idx in obj){
    fieldCount ++;
  }
  return fieldCount;
};
var getFieldsOfObject = exports.getFieldsOfObject = function(obj){
  if (obj==null)  return null;
  var fields = [];
  for(idx in obj){
    fields.push(idx);
  }
  return fields;
};

/**
 * return the Mime of inputfile's extname
 *
 * Done by MengXiaojun
 *
 * @param the extname of file, like: .png
 * @returns - the Mime of file
 */
var getMime = exports.getMime = {
  // returns MIME type
  lookupExtension : function(ext, fallback) {
    return getMime.TYPES[ext.toLowerCase()] || fallback || 'application/octet-stream';
  },
  // List of most common mime-types.
  TYPES : { ".3gp"   : "video/3gpp"
          , ".doc"   : "application/msword"
          , ".htm"   : "text/html"
          , ".html"  : "text/html"
          , ".jpeg"  : "image/jpeg"
          , ".jpg"   : "image/jpeg"
          , ".js"    : "application/javascript"
          , ".json"  : "application/json"
          , ".png"   : "image/png"
          , ".ps"    : "application/postscript"
          , ".zip"   : "application/zip"
          }
};

/*
 * the event list is obtain from source code of node.js of version 0.4.12.
 * the events decriptions refer to refer to http://www.chemie.fu-berlin.de/chemnet/use/info/libc/libc_21.html.
 *
 * the lists of signals comparison. From below, we can see the signal list in node contains that in centOS5.5 except SIGRTMAX and SIGRTMIN and related.
 * kill -l in centOs5.5       node_constants.cc in node-v0.4.12
 * SIGABRT        SIGABRT
 * SIGALRM        SIGALRM
 * SIGBUS       SIGBUS
 * SIGCHLD        SIGCHLD
 * SIGCONT        SIGCONT
 * SIGFPE       SIGFPE
 * SIGHUP       SIGHUP
 * SIGILL       SIGILL
 * SIGINT       SIGINT
 * SIGIO        SIGIO
 *        SIGIOT
 * SIGKILL        SIGKILL
 *        SIGLOST
 * SIGPIPE        SIGPIPE
 *        SIGPOLL
 * SIGPROF        SIGPROF
 * SIGPWR       SIGPWR
 * SIGQUIT        SIGQUIT
 * SIGSEGV        SIGSEGV
 * SIGSTKFLT        SIGSTKFLT
 * SIGSTOP        SIGSTOP
 * SIGSYS       SIGSYS
 * SIGTERM        SIGTERM
 * SIGTRAP        SIGTRAP
 * SIGTSTP        SIGTSTP
 * SIGTTIN        SIGTTIN
 * SIGTTOU        SIGTTOU
 *        SIGUNUSED
 * SIGURG       SIGURG
 * SIGUSR1        SIGUSR1
 * SIGUSR2        SIGUSR2
 * SIGVTALRM        SIGVTALRM
 * SIGWINCH       SIGWINCH
 * SIGXCPU        SIGXCPU
 * SIGXFSZ        SIGXFSZ
 * SIGRTMAX
 * SIGRTMAX-1
 * SIGRTMAX-10
 * SIGRTMAX-11
 * SIGRTMAX-12
 * SIGRTMAX-13
 * SIGRTMAX-14
 * SIGRTMAX-2
 * SIGRTMAX-3
 * SIGRTMAX-4
 * SIGRTMAX-5
 * SIGRTMAX-6
 * SIGRTMAX-7
 * SIGRTMAX-8
 * SIGRTMAX-9
 * SIGRTMIN
 * SIGRTMIN+1
 * SIGRTMIN+10
 * SIGRTMIN+11
 * SIGRTMIN+12
 * SIGRTMIN+13
 * SIGRTMIN+14
 * SIGRTMIN+15
 * SIGRTMIN+2
 * SIGRTMIN+3
 * SIGRTMIN+4
 * SIGRTMIN+5
 * SIGRTMIN+6
 * SIGRTMIN+7
 * SIGRTMIN+8
 * SIGRTMIN+9
 *
 */
var handleProcessEvents = exports.handleProcessEvents = function(params){
  process.setMaxListeners(100);
  process.on('uncaughtException', function (err) {
    logError('error caught by process: ' + util.inspect(err,false,100) +  ',\n stack=' + err.stack);
    console.trace();
  });
  process.on('exit', function (code, signal) {
    console.error('process exit event entered.');
    console.trace();
    //process.nextTick(function () { process.exit(11111); });//will cause stack overflow!
  });

  /*
   * Termination Signals. These signals are all used to tell a process to terminate, in one way or another.
   *
   * The SIGINT ("program interrupt") signal is sent when the user types the INTR character (normally C-c).
   * See section Special Characters, for information about terminal driver support for C-c.
   *
   * I found that Ctrl+C, kill command can cause this event.
   */
  process.on('SIGINT', function () {
    console.error('process SIGINT event entered.');
    console.trace();
    process.nextTick(function () { process.exit(11111); });
  });

  /*
   * Termination Signals. These signals are all used to tell a process to terminate, in one way or another.
   *
   * The SIGHUP ("hang-up") signal is used to report that the user's terminal is disconnected, perhaps because a network or telephone connection was broken.
   * For more information about this, see section Control Modes.
   * This signal is also used to report the termination of the controlling process on a terminal to jobs associated with that session;
   * this termination effectively disconnects all processes in the session from the controlling terminal.
   * For more information, see section Termination Internals.
   *
   * If ssh client console closed, the opened process will be closed is because of it.
   *
   * here use this event.
   *   open a ssh client and run the process, then close ssh client window.
   *   to redirect stderr and stdout to file or not makes different.
   *     if not redirect stderr and stdout to file, then the process will be sleeping.
   *     if redirect them to file, then the process will work normally. So it seems that the process becomes sleeping because of no valid output dest.
   *
   */
  process.on('SIGHUP', function () {
    console.error('process SIGHUP event entered.');
  });
  /*
   * Termination Signals. These signals are all used to tell a process to terminate, in one way or another.
   *
   * The SIGQUIT signal is similar to SIGINT, except that it's controlled by a different key--the QUIT character,
   * usually C-\---and produces a core dump when it terminates the process, just like a program error signal.
   * You can think of this as a program error condition "detected" by the user.
   */
  process.on('SIGQUIT', function () {
    console.error('process SIGQUIT event entered.');
    process.nextTick(function () { process.exit(11111); });
  });
  /*
   * Program Error Signals. The default action for all of these signals is to cause the process to terminate.
   *
   * The name of this signal is derived from "illegal instruction";
   * it usually means your program is trying to execute garbage or a privileged instruction.
   * Since the C compiler generates only valid instructions, SIGILL typically indicates that the executable file is corrupted, or that you are trying to execute data.
   * Some common ways of getting into the latter situation are by passing an invalid object where a pointer to a function was expected,
   * or by writing past the end of an automatic array (or similar problems with pointers to automatic variables) and corrupting other data on the stack such as the return address of a stack frame.
   * SIGILL can also be generated when the stack overflows, or when the system has trouble running the handler for a signal.
   */
  process.on('SIGILL', function () {
    console.error('process SIGILL event entered.');
    process.nextTick(function () { process.exit(11111); });
  });
  /*
   * Program Error Signals. The default action for all of these signals is to cause the process to terminate.
   *
   * Generated by the machine's breakpoint instruction, and possibly other trap instructions.
   * This signal is used by debuggers.
   * Your program will probably only see SIGTRAP if it is somehow executing bad instructions.
   */
  process.on('SIGTRAP', function () {
    console.error('process SIGTRAP event entered.');
  });
  /*
   * Program Error Signals. The default action for all of these signals is to cause the process to terminate.
   * SIGEMT
   * Emulator trap; this results from certain unimplemented instructions which might be emulated in software, or the operating system's failure to properly emulate them.
   */

  /*
   * Program Error Signals. The default action for all of these signals is to cause the process to terminate.
   *
   * This signal indicates an error detected by the program itself and reported by calling abort.
   */
  process.on('SIGABRT', function () {
    console.error('process SIGABRT event entered.');
    process.nextTick(function () { process.exit(11111); });
  });
  /*
   * Program Error Signals. The default action for all of these signals is to cause the process to terminate.
   * SIGIOT .
   * Generated by the PDP-11 "iot" instruction. On most machines, this is just another name for SIGABRT.
   */

  /*
   * Program Error Signals. The default action for all of these signals is to cause the process to terminate.
   *
   * This signal is generated when an invalid pointer is dereferenced.
   * Like SIGSEGV, this signal is typically the result of dereferencing an uninitialized pointer.
   * The difference between the two is that SIGSEGV indicates an invalid access to valid memory,
   * while SIGBUS indicates an access to an invalid address.
   * In particular, SIGBUS signals often result from dereferencing a misaligned pointer,
   * such as referring to a four-word integer at an address not divisible by four.
   * (Each kind of computer has its own requirements for address alignment.)
   * The name of this signal is an abbreviation for "bus error".
   */
  process.on('SIGBUS', function () {
    console.error('process SIGBUS event entered.');
    process.nextTick(function () { process.exit(11111); });
  });
  /*
   * Program Error Signals. The default action for all of these signals is to cause the process to terminate.
   *
   * The SIGFPE signal reports a fatal arithmetic error.
   * Although the name is derived from "floating-point exception", this signal actually covers all arithmetic errors, including division by zero and overflow.
   * BSD systems provide the SIGFPE handler with an extra argument that distinguishes various causes of the exception.
   */
  process.on('SIGFPE', function () {
    console.error('process SIGFPE event entered.');
    process.nextTick(function () { process.exit(11111); });
  });
  /*
   * Termination Signals. These signals are all used to tell a process to terminate, in one way or another.
   *
   * The SIGKILL signal is used to cause immediate program termination. It cannot be handled or ignored, and is therefore always fatal.
   * It is also not possible to block this signal.
   * This signal is usually generated only by explicit request.
   * Since it cannot be handled, you should generate it only as a last resort, after first trying a less drastic method such as C-c or SIGTERM.
   * If a process does not respond to any other termination signals, sending it a SIGKILL signal will almost always cause it to go away.
   * In fact, if SIGKILL fails to terminate a process, that by itself constitutes an operating system bug which you should report.
   * The system will generate SIGKILL for a process itself under some unusual conditions where the program cannot possible continue to run (even to run a signal handler).
   *
   * I found that if other process send SIGKILL to the process, the console output will show "Killed" message. But if stderr is redirected to a file, the file does not contain the message.
   * And using SIGKILL has other problem. The process may be still in processes list.
   */
  process.on('SIGKILL', function () {
    console.error('process SIGKILL event entered.');
    process.nextTick(function () { process.exit(11111); });
  });
  /*
   * The SIGUSR1 and SIGUSR2 signals are set aside for you to use any way you want.
   * They're useful for simple interprocess communication, if you write a signal handler for them in the program that receives the signal.
   * There is an example showing the use of SIGUSR1 and SIGUSR2 in section Signaling Another Process.
   * The default action is to terminate the process.
   */
  process.on('SIGUSR1', function () {
    console.error('process SIGUSR1 event entered.');
    process.nextTick(function () { process.exit(11111); });
  });
  /*
   * This signal is generated when a program tries to read or write outside the memory that is allocated for it,
   * or to write memory that can only be read.
   * (Actually, the signals only occur when the program goes far enough outside to be detected by the system's memory protection mechanism.)
   * The name is an abbreviation for "segmentation violation".
   * Common ways of getting a SIGSEGV condition include dereferencing a null or uninitialized pointer,
   * or when you use a pointer to step through an array, but fail to check for the end of the array.
   * It varies among systems whether dereferencing a null pointer generates SIGSEGV or SIGBUS.
   */
  process.on('SIGSEGV', function () {
    console.error('process SIGSEGV event entered.');
    process.nextTick(function () { process.exit(11111); });
  });
  /*
   * The SIGUSR1 and SIGUSR2 signals are set aside for you to use any way you want.
   * They're useful for simple interprocess communication, if you write a signal handler for them in the program that receives the signal.
   * There is an example showing the use of SIGUSR1 and SIGUSR2 in section Signaling Another Process.
   * The default action is to terminate the process.
   */
  process.on('SIGUSR2', function () {
    console.error('process SIGUSR2 event entered.');
    process.nextTick(function () { process.exit(11111); });
  });
  /*
   * The default action for all of them is to cause the process to terminate.
   * Broken pipe. If you use pipes or FIFOs, you have to design your application so that one process opens the pipe for reading before another starts writing.
   * If the reading process never starts, or terminates unexpectedly, writing to the pipe or FIFO raises a SIGPIPE signal.
   * If SIGPIPE is blocked, handled or ignored, the offending call fails with EPIPE instead.
   * Pipes and FIFO special files are discussed in more detail in section Pipes and FIFOs.
   * Another cause of SIGPIPE is when you try to output to a socket that isn't connected. See section Sending Data.
   */
  process.on('SIGPIPE', function () {
    //BUT I found that the process will not terminate by default when received this signal! SO here not terminate it.
    console.error('process SIGPIPE event entered.');
  });
  /*
   * The default behavior for these signals is to cause program termination.
   * This signal typically indicates expiration of a timer that measures real or clock time. It is used by the alarm function, for example.
   */
  process.on('SIGALRM', function () {
    console.error('process SIGALRM event entered.');
    process.nextTick(function () { process.exit(11111); });
  });
  /*
   * Termination Signals. These signals are all used to tell a process to terminate, in one way or another.
   *
   * The (obvious) default action for all of these signals is to cause the process to terminate.
   * The SIGTERM signal is a generic signal used to cause program termination.
   * Unlike SIGKILL, this signal can be blocked, handled, and ignored.
   * It is the normal way to politely ask a program to terminate.
   * The shell command kill generates SIGTERM by default.
   */
  process.on('SIGTERM', function () {
    console.error('process SIGTERM event entered.');
    process.nextTick(function () { process.exit(11111); });
  });
  /*
   * This signal is sent to a parent process whenever one of its child processes terminates or stops.
   * The default action for this signal is to ignore it.
   * If you establish a handler for this signal while there are child processes that have terminated but not reported their status via wait or waitpid (see section Process Completion),
   * whether your new handler applies to those processes or not depends on the particular operating system.
   */
  //process.on('SIGCHLD', function () {
  //  console.error('process SIGCHLD event entered.');
  //});
  process.on('SIGSTKFLT', function () {
    console.error('process SIGSTKFLT event entered.');
  });

  /*
   * You can send a SIGCONT signal to a process to make it continue.
   * This signal is special--it always makes the process continue if it is stopped, before the signal is delivered.
   * The default behavior is to do nothing else. You cannot block this signal.
   * You can set a handler, but SIGCONT always makes the process continue regardless.
   * Most programs have no reason to handle SIGCONT; they simply resume execution without realizing they were ever stopped.
   * You can use a handler for SIGCONT to make a program do something special when it is stopped and continued--for example, to reprint a prompt when it is suspended while waiting for input.
   *
   * from stopped to background will fire the event.
   */
  process.on('SIGCONT', function () {
    console.error('process SIGCONT event entered.');
  });
  /*
   * The SIGSTOP signal stops the process. It cannot be handled, ignored, or blocked.
   */
  process.on('SIGSTOP', function () {
    console.error('process SIGSTOP event entered.');
    process.nextTick(function () { process.exit(11111); });
  });

  /*
   * The SIGTSTP signal is an interactive stop signal. Unlike SIGSTOP, this signal can be handled and ignored.
   * Your program should handle this signal if you have a special need to leave files or system tables in a secure state when a process is stopped.
   * For example, programs that turn off echoing should handle SIGTSTP so they can turn echoing back on before stopping.
   * This signal is generated when the user types the SUSP character (normally C-z).
   * Ctrl+Z will cause the event.
   */
  //process.on('SIGTSTP', function () {
  //  console.error('process SIGTSTP event entered.');
  //});
  /*
   * A process cannot read from the the user's terminal while it is running as a background job.
   * When any process in a background job tries to read from the terminal, all of the processes in the job are sent a SIGTTIN signal.
   * The default action for this signal is to stop the process. -- like Ctrl+Z
   * For more information about how this interacts with the terminal driver, see section Access to the Controlling Terminal.
   */
  //process.on('SIGTTIN', function () {
  //  console.error('process SIGTTIN event entered.');
  //});
  /*
   * This is similar to SIGTTIN, but is generated when a process in a background job attempts to write to the terminal or set its modes.
   * Again, the default action is to stop the process.
   * SIGTTOU is only generated for an attempt to write to the terminal if the TOSTOP output mode is set; see section Output Modes.
   */
  process.on('SIGTTOU', function () {
    console.error('process SIGTTOU event entered.');
  });
  /*
   * This signal is sent when "urgent" or out-of-band data arrives on a socket. See section Out-of-Band Data.
   */
  //process.on('SIGURG', function () {
  //  console.error('process SIGURG event entered.');
  //});
  /*
   * The default action for all of them is to cause the process to terminate.
   *
   * CPU time limit exceeded. This signal is generated when the process exceeds its soft resource limit on CPU time. See section Limiting Resource Usage.
   */
  process.on('SIGXCPU', function () {
    console.error('process SIGXCPU event entered.');
    process.nextTick(function () { process.exit(11111); });
  });
  /*
   * The default action for all of them is to cause the process to terminate.
   *
   * File size limit exceeded. This signal is generated when the process attempts to extend a file so it exceeds the process's soft resource limit on file size. See section Limiting Resource Usage.
   */
  process.on('SIGXFSZ', function () {
    console.error('process SIGXFSZ event entered.');
    process.nextTick(function () { process.exit(11111); });
  });
  /*
   * The default behavior for these signals is to cause program termination.
   * This signal typically indicates expiration of a timer that measures CPU time used by the current process. The name is an abbreviation for "virtual time alarm".
   */
  process.on('SIGVTALRM', function () {
    console.error('process SIGVTALRM event entered.');
    process.nextTick(function () { process.exit(11111); });
  });
  /*
   * The default behavior for these signals is to cause program termination.
   * This signal is typically indicates expiration of a timer that measures both CPU time used by the current process,
   * and CPU time expended on behalf of the process by the system.
   * Such a timer is used to implement code profiling facilities, hence the name of this signal.
   */
  process.on('SIGPROF', function () {
    console.error('process SIGPROF event entered.');
    process.nextTick(function () { process.exit(11111); });
  });
  /*
   * Window size change. This is generated on some systems (including GNU) when the terminal driver's record of the number of rows and columns on the screen is changed.
   * The default action is to ignore it.
   * If a program does full-screen display, it should handle SIGWINCH.
   * When the signal arrives, it should fetch the new screen size and reformat its display accordingly.
   */
  process.on('SIGWINCH', function () {
    console.error('process SIGWINCH event entered.');
  });
  /*
   * This signal is sent when a file descriptor is ready to perform input or output.
   * On most operating systems, terminals and sockets are the only kinds of files that can generate SIGIO; other kinds, including ordinary files, never generate SIGIO even if you ask them to.
   * In the GNU system SIGIO will always be generated properly if you successfully set asynchronous mode with fcntl.
   */
  //process.on('SIGIO', function () {
  //  console.error('process SIGIO event entered.');
  //});
  /*
   * This is a System V signal name, more or less similar to SIGIO. It is defined only for compatibility.
   */
  //process.on('SIGPOLL', function () {
  //  console.error('process SIGPOLL event entered.');
  //});
  /*
   * The default action for all of them is to cause the process to terminate.
   *
   * Resource lost. This signal is generated when you have an advisory lock on an NFS file, and the NFS server reboots and forgets about your lock.
   * In the GNU system, SIGLOST is generated when any server program dies unexpectedly.
   * It is usually fine to ignore the signal; whatever call was made to the server that died just returns an error.
   */
  process.on('SIGLOST', function () {
    console.error('process SIGLOST event entered.');
    process.nextTick(function () { process.exit(11111); });
  });
  process.on('SIGPWR', function () {
    console.error('process SIGPWR event entered.');
    process.nextTick(function () { process.exit(11111); });
  });
  /*
   * Program Error Signals. The default action for all of these signals is to cause the process to terminate.
   *
   * Bad system call; that is to say, the instruction to trap to the operating system was executed,
   * but the code number for the system call to perform was invalid.
   */
  process.on('SIGSYS', function () {
    console.error('process SIGSYS event entered.');
    process.nextTick(function () { process.exit(11111); });
  });
  process.on('SIGUNUSED', function () {
    console.error('process SIGUNUSED event entered.');
    process.nextTick(function () { process.exit(11111); });
  });
};//handleProcessEvents

/*
 * new error with config defined. also can customize
 *
 * @param {Object} params - contains code,message,messageParams(optional),messagePrefix,errorKey,innerError, req.
 *   errorKey is used to get predefined error info in config.
 *   error message can be got from ErrorInConfig.message, but if message param provided, message param has priority
 *   messageParams is like params for string.Format, message contains possible format, such as "hell {0} world {1}"
 *   messagePrefix does not join format
 *   they all can be optional, at this time, the stack info is still useful.
 */
var newError = exports.newError = function(params) {
  var self = this;
  var code = params.code;
  var messagePrefix = params.messagePrefix;

  var message;
  if (params.errorKey){
    var errorKey = params.errorKey;
    var errorInfo = config.config.errors[errorKey];
    assert.ok(errorInfo);
    if (errorInfo){
      message = errorInfo.message;
      var lang = getLocaleLanguage(params);
      var msgByLangField = "msg_"+lang;
      var msgByLang = errorInfo[msgByLangField];
      if (msgByLang) message = msgByLang;
      code = errorInfo.code;
    }
  }
  //message param has priority
  if (params.message){
    message = params.message;
  }
  if (params.messageParams)  message = formatString({trunk:message, pieces:params.messageParams});
  if (config.config.logLevel == config.constants.LogLevelDebug)
    message = messagePrefix + message;
  var err = new Error(message);
  err.code = errorInfo.code;

  if(params.innerError) err.innerError = params.innerError;

  err.toJSON = function(){
    var jsonObj = {code:err.code, message:err.message};
    if (config.config.logLevel >= config.constants.LogLevelDebug){
      jsonObj.stack = err.stack;
    }
    if (err.innerError){
      jsonObj.innerError = err.innerError.toJSON();
    }
    return jsonObj;
  };

  return err;
};//newError

//TODO be tested and used
var handleErrorInfo = exports.handleErrorInfo = function(params){
  var self = this;
  var messagePrefix = 'in handy.handleErrorInfo, ';
  if (params.errors){
    handleErrors(params);
  }
  if (params.err){
    handleError(params);
  }
};//handleErrorInfo

/**
 * here not consider that innerError be an array
 * @param params - contains errors
 * @returns
 */
var handleErrors = exports.handleErrors = function(params){
  var self = this;
  var messagePrefix = 'in handy.handleErrors, ';

  var errors = params.errors;
  if (!errors){
    var err = self.newError({errorKey:'needParameter',messageParams:['errors'],messagePrefix:messagePrefix});
    handleError({err:err});
  }
  for(var i=0; i<errors.length; i++){
    var err = errors[i];
    handleError({err:err});
  }//for
};//handleErrors

var handleError = exports.handleError = function(params){
  var self = this;
  var messagePrefix = 'in handy.handleError, ';

  var err = params.err;
  //replace assert.ok(..) to below check codes because the error thrown by assert can not be handled
  if (!err){
    err = self.newError({errorKey:'needParameter',messageParams:['err'],messagePrefix:messagePrefix});
  }

  var nestlevel = params.nestlevel;
  if (nestlevel == undefined || nestlevel == null)
    nestlevel = 0;
  if(nestlevel>0){
    //the error is an inner error with some level
    logError('  inner error level='+nestlevel+', err=' +util.inspect(err,false,100) + ',\n stack=' + err.stack);
  }else{
    //outermost error
    logError('error=' +util.inspect(err,false,100) + ',\n stack=' + err.stack);
  }
  if (err.innerError){
    var innerError = err.innerError;
    handleError({err:err.innerError, nestlevel:nestlevel+1});
  }
};//handleError

var handleWarning = exports.handleWarning = function(params){
  assert.ok(params.warning);
  var warning = params.warning;
  var nestlevel = params.nestlevel;
  if (nestlevel == undefined || nestlevel == null)
    nestlevel = 0;
  if(nestlevel>0){
    //the error is an inner error with some level
    logWarning('  inner warning level='+nestlevel+', warning=' +util.inspect(err,false,100) + ',\n stack=' + warning.stack);
  }else{
    //outermost error
    logWarning('warning=' +util.inspect(warning,false,100) + ',\n stack=' + warning.stack);
  }
  if (warning.innerWarning){
    var innerWarning = warning.innerWarning;
    handleWarning({warning:warning.innerWarning, nestlevel:nestlevel+1});
  }
};//handleWarning

var formatString = exports.formatString = function(params) {
  var self = this;
  var trunk = params.trunk;
  var pieces = params.pieces;
  if(pieces && pieces.length > 0){
    for(var i=0; i<pieces.length; i++) {
      var re = new RegExp('\\{' + (i) + '\\}','gm');
      trunk = trunk.replace(re, pieces[i]);
    }
  }
  return trunk;
};//formatString




var cryptoAlgorithm = 'aes192';
var cryptoPasswd = 'YsfSecretKey1';

var encrypt = exports.encrypt = function(plaintext){
  var cipher = crypto.createCipher(cryptoAlgorithm, cryptoPasswd);
  //encrypt plaintext which is in utf8 format  to a ciphertext which will be in hex
  var ciph = cipher.update(plaintext, 'utf8', 'hex');
  //Only use binary or hex, not base64.
  ciph += cipher.final('hex');
  return ciph;
};

var decrypt = exports.decrypt = function(encryptedText){
  var decipher = crypto.createDecipher(cryptoAlgorithm, cryptoPasswd);
  var txt = decipher.update(encryptedText, 'hex', 'utf8');
  txt += decipher.final('utf8');
  return txt;
};


var copyFile = exports.copyFile = function(params,cbFun){
  var srcFilePath = params.srcFilePath;
  var dstFilePath = params.dstFilePath;
  fs.readFile(srcFilePath, function (err, data) {
    if (err) cbFun(err);
    fs.writeFile(dstFilePath,data,function(err){
      if (err) cbFun(err);
      else cbFun(null);
    });//fs.writeFile
  });//fs.readFile
};//copyFile

var convertToBool = exports.convertToBool = function(src){
  if (src === 'false' || src === '0' || src === 'undefined' || src === 'null')
    return false;
  return Boolean(src);
};//convertToBool

var convertToNumber = exports.convertToNumber = function(src){
  if (src == null || src === 'undefined' || src === 'null' || src == '')
    return 0;
  return Number(src);
};//convertToBool

/**
 *
 * @param src - can be Date or number or string
 *   if be a string, the string should be a digit string to express milliseconds like Date.getTime
 * @returns Date object
 */
var convertToDate = exports.convertToDate = function(src){
  if (!src) return new Date(0);
  if (src instanceof Date) return src;
  if (typeof src == "number")  return new Date(src);
  if (typeof src == "string")  return new Date(Number(src));
  return null;
};//convertToDate

/**
 *
 * @param dt - can be Date or number or string
 *   if be a string, the string should be a digit string to express milliseconds like Date.getTime
 * @returns Date object
 */
var dateLocalToUTC = exports.dateLocalToUTC = function(dt){
  if (!dt) return null;
  dt = convertToDate(dt);
  var dtUtc = new Date(dt.getTime() + dt.getTimezoneOffset() * 60000);
  return dtUtc;
};//dateLocalToUTC
/**
 *
 * @param dtUTC - can be Date or number or string
 *   if be a string, the string should be a digit string to express milliseconds like Date.getTime
 * @returns Date object
 */
var dateUTCtoLocal = exports.dateUTCtoLocal = function(dtUTC){
  if (!dtUTC) return null;
  dtUTC = convertToDate(dtUTC);
  var dtLocal = new Date(dtUTC.getTime() - dtUTC.getTimezoneOffset() * 60000);
  return dtLocal;
};//dateUTCtoLocal

var getNowOfUTCdate = exports.getNowOfUTCdate = function(){
  var dtNowLocal = new Date();
  var dtNowUTC = dateLocalToUTC(dtNowLocal);
  return dtNowUTC;
};//getNowOfUTCdate

/**
 * simply do that if a field is null, it should be removed for easy of iphone codes.
 * only do 1 level, not do nested level or tree level.
 *
 * not do when a object contains no field, it should be removed.
 * not do when an array contains no element, it should be removed
 *
 * @param obj
 * @returns - if all fields of the obj is removed, return null, else return obj itself.
 */
var removeNullFieldFor1Level = exports.removeNullFieldFor1Level = function(obj){
  var toBeDelFields = [];
  var fieldCount = 0;
  for(var idx in obj){
    fieldCount ++;
    if (obj[idx] == null){
      toBeDelFields.push(idx);
    }
  }//for
  if (toBeDelFields.length == fieldCount){
    return null;
  }
  for(var i=0; i<toBeDelFields.length; i++){
    var delFld = toBeDelFields[i];
    delete obj[delFld];
  }//for
  return obj;
};//removeNullFieldFor1Level


var getTargetGender = exports.getTargetGender = function(gender1){
  if (!gender1) return null;
  gender1 = gender1.toLowerCase();
  if (gender1 == 'male')
    return 'female';
  else if (gender1 == 'female')
    return 'male';
  else
    return null;
};

/**
 *
 * @param params - contains timeInMs, precisionInMs, lowOrderSeq, digitLenOfLowOrderSeq
 * @returns int number
 */
var generateZsetScoreFromDate = exports.generateZsetScoreFromDate = function(params){
  var timeInMs = Number(params.timeInMs);
  var precisionInMs = Number(params.precisionInMs);
  var lowOrderSeq = Number(params.lowOrderSeq);
  var digitLenOfLowOrderSeq = Number(params.digitLenOfLowOrderSeq);
  //var digitLenOfHighOrderTime = params.digitLenOfHighOrderTime;

  var timeInGivenPrecision = Math.floor(timeInMs/precisionInMs);
  var digitForModOfLowOrderSeq = Math.pow(10,digitLenOfLowOrderSeq);
  var lowOrderSeqAfterMod = lowOrderSeq % digitForModOfLowOrderSeq;
  var r = timeInGivenPrecision * digitForModOfLowOrderSeq + lowOrderSeqAfterMod;
  //console.log("params="+util.inspect(params)+", timeInGivenPrecision="+timeInGivenPrecision+", digitForModOfLowOrderSeq="+digitForModOfLowOrderSeq+", lowOrderSeqAfterMod="+lowOrderSeqAfterMod+", r="+r);
  return r;
};//generateZsetScoreFromDate



/**
*
* @param params - contains region, geolibType.
*   region is object or a json string.
* @returns regionsInfo. it contains err, regions as array, regionObj, country.
*   regions have at most 4 elements, also possible 0 element if the region not belong to any country.
*     here will remove element if it be of same value with next element.
*     and will remove tailing null element.
*   regionObj is an object, but is possible to be string when be config.defaultRegion.
*
*/
var getAllLevelRegion = exports.getAllLevelRegion = function(params){
  var self = this;
  var messagePrefix = 'in handy.getAllLevelRegion, ';
  //console.log("getAllLevelRegion enter, params="+util.inspect(params,false,100));
  if (!params.region){
    var err = newError({errorKey:'needParameter',messageParams:['region'],messagePrefix:messagePrefix});
    return {err:err};
  }
  var region = params.region;
  var regionObj = null;
  if (typeof region == "string"){
    //console.log("typeof region == string");
    if (region == config.config.defaultRegion || region == config.config.madeRegion){
      return {regions:[region], regionObj:region};
    }else{
      try{
        regionObj = JSON.parse(region);
        //console.log("typeof region == string, after parse, regionObj="+util.inspect(regionObj,false,100));
      }catch(err){
        return {err:err};
      }
      if (typeof regionObj == "string" && (regionObj == config.config.defaultRegion || regionObj == config.config.madeRegion)){
        return {regions:[regionObj], regionObj:region};
      }
    }
  }else{
    //console.log("typeof region != string");
    regionObj = region;
  }

  if (!params.geolibType){
    var err = newError({errorKey:'needParameter',messageParams:['geolibType'],messagePrefix:messagePrefix});
    return {err:err};
  }
  var geolibType = params.geolibType;
  var regionLevel1 = null, regionLevel2 = null, regionLevel3 = null, regionLevel4 = null;
  var country = null;
  if(geolibType == config.config.geoLibTypes.googleV3){
  //below is example format
//   {
//      "address_components" : [
//         {
//            "long_name" : "10026",
//            "short_name" : "10026",
//            "types" : [ "postal_code" ]
//         },
//         {
//            "long_name" : "Manhattan",
//            "short_name" : "Manhattan",
//            "types" : [ "sublocality", "political" ]
//         },
//         {
//            "long_name" : "New York",
//            "short_name" : "New York",
//            "types" : [ "locality", "political" ]
//         },
//         {
//            "long_name" : "New York",
//            "short_name" : "New York",
//            "types" : [ "administrative_area_level_2", "political" ]
//         },
//         {
//            "long_name" : "New York",
//            "short_name" : "NY",
//            "types" : [ "administrative_area_level_1", "political" ]
//         },
//         {
//            "long_name" : "United States",
//            "short_name" : "US",
//            "types" : [ "country", "political" ]
//         }
//      ],
//      "formatted_address" : "Manhattan, NY 10026, USA",
//      "geometry" : {
//         "bounds" : {
//            "northeast" : {
//               "lat" : 40.81126390,
//               "lng" : -73.94466690
//            },
//            "southwest" : {
//               "lat" : 40.79364190,
//               "lng" : -73.9610770
//            }
//         },
//         "location" : {
//            "lat" : 40.80174230,
//            "lng" : -73.95508570
//         },
//         "location_type" : "APPROXIMATE",
//         "viewport" : {
//            "northeast" : {
//               "lat" : 40.81126390,
//               "lng" : -73.94466690
//            },
//            "southwest" : {
//               "lat" : 40.79364190,
//               "lng" : -73.9610770
//            }
//         }
//      },
//      "types" : [ "postal_code" ]
//   }
    if (regionObj.address_components && regionObj.address_components.length>0){
      for(var i=0; i<regionObj.address_components.length; i++){
        var address_component = regionObj.address_components[i];
        if (arrayIndexOf({ary:address_component.types,item:"country"})>=0){
          regionLevel1 = address_component.short_name;
          country = address_component.long_name;
        }else if (arrayIndexOf({ary:address_component.types,item:"administrative_area_level_1"})>=0){
          regionLevel2 = address_component.long_name;
        }else if (arrayIndexOf({ary:address_component.types,item:"locality"})>=0){
          regionLevel3 = address_component.long_name;
        }else if (arrayIndexOf({ary:address_component.types,item:"sublocality"})>=0){
          regionLevel4 = address_component.long_name;
        }
      }//for
    }
  }else if (geolibType == config.config.geoLibTypes.android){
    //countryCode , admin , locality, Address.addressLines[1].split(',')[0]. when New York, level3region be null. when Beijing, level2region=level3region.
    //below is example format
//    {
//      addressLines:[],
//      admin,
//      sub-admin,
//      locality,
//      postalCode,
//      countryCode,
//      countryName,
//      latitude,
//      longitude
//    }
    //it is according to below original data
//    [Address
//     [addressLines=
//         [0:"3620 Norton Pl NW",1:"Washington, DC 20016",2:"USA"],
//      feature=3620,admin=District of Columbia,sub-admin=null,locality=Washington,thoroughfare=Norton Pl NW,postalCode=20016,
//      countryCode=US,countryName=United States,hasLatitude=true,latitude=38.935342,hasLongitude=true,longitude=-77.071962,
//      phone=null,url=null,extras=null]]
    regionLevel1 = regionObj.countryCode;
    country = regionObj.countryName;
    regionLevel2 = regionObj.admin;
    regionLevel3 = regionObj.locality;
    if (regionObj.addressLines && regionObj.addressLines.length>=2){
      var region4 = regionObj.addressLines[1];
      var region4ary = region4.split(",");
      regionLevel4 = region4ary[0];
      if (regionLevel4 == regionLevel3){//handle a special common case, because we found sometimes regionLevel4 == regionLevel3
        regionLevel4 = null;
      }
    }
  }else{
    var err = newError({errorKey:'unsupportedValueForParam',messageParams:[geolibType,'geolibType'],messagePrefix:messagePrefix});
    return {err:err};
  }
  var regions = [regionLevel1,regionLevel2,regionLevel3,regionLevel4];
  //remove trailing null element
  for(var i=regions.length-1; i>=0; i--){
    if (regions[i]==null)  regions.pop();
    else break;
  }
  //remove same value element
  if (regions.length >= 2){
    for(var i=regions.length-2; i>=0; i--){
      if (regions[i]==regions[i+1])  regions.splice(i+1,1);
      else break;
    }
  }
  var retData = {regions:regions, regionObj:regionObj};
  //console.log("getAllLevelRegion return, retData="+util.inspect(retData,false,100));
  //console.trace();
  return retData;
 };//getAllLevelRegion

/**
*
* @param params - contains region(optional), geolibType(optional), regionLevel, regions(optional)
*   region is object or a json string.
*   regionLevel can be 1,2,3,4, default be 4.
*   if regions exists, region and geolibType not needed
* @returns locationInfo. it contains err, centainLevelRegion as string, regionObj
*   centainLevelRegion is a string with regions concatenated by + sign and it may contains region count less than regionLevel.
*   regionObj is an object, but is possible to be string when be config.defaultRegion.
*/
var getCentainLevelRegion = exports.getCentainLevelRegion = function(params){
  var self = this;
  var messagePrefix = 'in handy.getCentainLevelRegion, ';

  var regionLevel = params.regionLevel;
  if (!regionLevel)  regionLevel = 4;
  var regions = null, regionsInfo = null;
  if (params.regions){
    regions = params.regions;
  }else{
    if (!params.region){
      var err = newError({errorKey:'needParameter',messageParams:['region'],messagePrefix:messagePrefix});
      return {err:err};
    }
    var region = params.region;
    var geolibType = params.geolibType;

    //check geolibType in getAllLevelRegion
    regionsInfo = getAllLevelRegion({region:region,geolibType:geolibType});
    if (regionsInfo.err) return {err:regionsInfo.err};

    regions = regionsInfo.regions;
  }

  if (regions && regions.length > regionLevel){
    regions = regions.slice(0,regionLevel);
  }
  var centainLevelRegion = '';
  if (regions && regions.length > 0) centainLevelRegion = regions.join("+");
  var retData = {centainLevelRegion:centainLevelRegion};
  if (regionsInfo){
    retData.regionObj = regionsInfo.regionObj;
    retData.regions = regionsInfo.regions;
  }
  return retData;
};//getCentainLevelRegion

/**
*
* @param params - contains pwd1, pwd2
* @returns boolean
*
*/
var comparePassword = exports.comparePassword = function(params){
  var self = this;
  var messagePrefix = 'in handy.comparePassword, ';
  var pwd1 = params.pwd1;
  var pwd2 = params.pwd2;
  if (!pwd1 && !pwd2)  return true;
  if (pwd1 && pwd2){
    return (pwd1 == pwd2);
  }
  return false;
};//comparePassword

/**
 *
 * @param hostPortStr - is a simple string like host:123 or host
 * @returns parsedObj, which contains host, port
 */
var parseHostPort = exports.parseHostPort = function(hostPortStr){
  if (!hostPortStr)  return null;
  var tokenAry = hostPortStr.split(':');
  var host = tokenAry[0];
  var parsedObj = {host:host};
  if (tokenAry.length>=2){
    var port = tokenAry[1];
    parsedObj.port = port;
  }
  return parsedObj;
};//parseHostPort

var hashExtNameToMime = { ".3gp"   : "video/3gpp"
  , ".doc"   : "application/msword"
    , ".htm"   : "text/html"
    , ".html"  : "text/html"
    , ".css"   : "text/css"
    , ".jpeg"  : "image/jpeg"
    , ".jpg"   : "image/jpeg"
    , ".js"    : "application/javascript"
    , ".json"  : "application/json"
    , ".png"   : "image/png"
    , ".ps"    : "application/postscript"
    , ".zip"   : "application/zip"
    };
var getMimeFromExtName = exports.getMimeFromExtName = function(ext) {
  var mime = 'application/octet-stream';
  var mime2 = hashExtNameToMime[ext];
  if (mime2) mime = mime2;
  return mime;
};

/**
 *
 * @param params - contains req.
 * @returns
 */
var getLocaleLanguage = exports.getLocaleLanguage = function(params) {
  var retLang = config.config.defaultLocale.language;
  if (config.config.forceLocale && config.config.forceLocale.language){
    retLang = config.config.forceLocale.language;
    return retLang;
  }
  if (params && params.req){
    if (params.req.body && params.req.body.localeLanguage){
      retLang = getLanguageFromLocale(params.req.body.localeLanguage);
    }else if (params.req.query && params.req.query.localeLanguage){
      retLang = getLanguageFromLocale(params.req.query.localeLanguage);
    }else if (params.req.headers){
      var acceptLanguage = params.req.headers['accept-language'];
      console.log("acceptLanguage="+acceptLanguage);
      if (acceptLanguage){
        var acceptLanguageParts = acceptLanguage.split(','); // zh-cn;q=1,en-GB;q=0.8
//        var acceptLanguagePart1 = acceptLanguageParts[0];
//        var localeAndQ = acceptLanguagePart1.split(';');
//        var locale = localeAndQ[0];
//        var languageAndRegion = locale.split('-');
//        var language = languageAndRegion[0];
//        if (language) retLang = language;
        var langAry = [];
        for(var i=0; i<acceptLanguageParts.length; i++){
          var acceptLanguagePart = acceptLanguageParts[i];
          var localeAndQ = acceptLanguagePart.split(';');
          var locale = localeAndQ[0];
          var language = getLanguageFromLocale(locale);
          langAry.push(language);
        }//for
        if (arrayIndexOf({ary:langAry, item:config.config.defaultLocale.language})>=0){
          retLang = config.config.defaultLocale.language;
        }else{
          retLang = langAry[0];
        }
      }
    }
  }
  console.log("retLang="+retLang);
  return retLang;
};//getLocaleLanguage

var getLanguageFromLocale = exports.getLanguageFromLocale = function(localStr) {
  var retLang = "";
  if (localStr){
    var languageAndRegion = localStr.split('-');
    var language = languageAndRegion[0];
    retLang = language;
  }
  return retLang;
};//getLanguageFromLocale

var inspect = exports.inspect = function(data,options){
  var ldata = tool.cloneObject(data);
  if (ldata && options && options.notShowBigData){
    delete ldata.req;
  }
  return util.inspect(ldata,false,100);
};

var inspectWithoutBig = exports.inspectWithoutBig = function(data,options){
  var loptions = {};
  tool.copyFields({srcObj:options, destObj:loptions});
  loptions.notShowBigData = true;
  return inspect(data,loptions);
};



var logError = exports.logError = function(message){
  logger.logError(message);
};
var logWarning = exports.logWarning = function(message){
  logger.logWarning(message);
};
var logInfo = exports.logInfo = function(message){
  logger.logInfo(message);
};
var logDebug = exports.logDebug = function(message){
  logger.logDebug(message);
};


var getRequestInParams = exports.getRequestInParams = function(req, options){
  if (!req) return null;
  var inParams = {};
  if (req.query){
    tool.copyFields({srcObj:req.query,destObj:inParams,overrideSameName:true});
  }
  if (req.body){
    tool.copyFields({srcObj:req.body,destObj:inParams,overrideSameName:true});
  }
  inParams.reqPathInUrl = req.path;

  if (options && options.hidePassword){
    if (inParams.password) inParams.password='xxx';
  }

  return inParams;
};//getRequestInParams





