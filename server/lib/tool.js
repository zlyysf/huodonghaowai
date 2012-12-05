/**
 * This file is a place to hold misc helpful functions.
 * compare to handy, it is independant, not dependant on config or other file in this project. only dependant on standard lib.
 */

var http = require('http');
var https = require('https');
var util = require('util');
var fs = require("fs");
var path = require('path');
var assert = require('assert');
var crypto = require('crypto');





var copyFieldsDeepOnlyForObject = exports.copyFieldsDeepOnlyForObject = function(params){
  var srcObj = params.srcObj;
  var destObj = params.destObj;
  var overrideSameName = params.overrideSameName;
  if (!srcObj || !destObj)
    return ;
  for(field in srcObj){
    var srcFieldVal = srcObj[field];//should not be undefined value
    var destFieldVal = destObj[field];
    if (destFieldVal === undefined){//destObj have no this field
      destObj[field] = srcFieldVal;
    }else{//destObj have this field
      var destFieldIsObject = (destFieldVal instanceof Object);
      var destFieldIsArray = (destFieldVal instanceof Array);
      var destFieldType = typeof destFieldVal;
      //Array and Function be Object type, but we only deal pure object
      var destFieldIsPureObject = (destFieldIsObject && !destFieldIsArray && destFieldType != "function");
      if (!destFieldIsObject){
        if (overrideSameName){
          destObj[field] = srcFieldVal;
        }else{
          //do nothing
        }
      }else{//destFieldIsObject
        if (destFieldIsPureObject){
          var srcFieldIsObject = (srcFieldVal instanceof Object);
          var srcFieldIsArray = (srcFieldVal instanceof Array);
          var srcFieldType = typeof srcFieldVal;
          var srcFieldIsPureObject = (srcFieldIsObject && !srcFieldIsArray && srcFieldType != "function");
          if (srcFieldIsPureObject){
            copyFieldsDeepOnlyForObject({srcObj:srcFieldVal,destObj:destFieldVal,overrideSameName:overrideSameName});
          }else{//!srcFieldIsPureObject
            //value type not match, do nothing for now, not report ERROR
          }
        }else{//!destFieldIsPureObject
          //do nothing about semi object, such as array and function
        }
      }//}else{//destFieldIsObject
    }//}else{//destObj have this field
  }//for
};//copyFieldsDeepOnlyForObject


/**
 * copy fields to destObj from srcObj, when there are same fields both in srcObj and destObj, use flag overrideSameName to control
 * @param params - contains srcObj, destObj, overrideSameName
 */
var copyFields = exports.copyFields = function(params){
  var srcObj = params.srcObj;
  var destObj = params.destObj;
  var overrideSameName = params.overrideSameName;
  if (!srcObj || !destObj)
    return ;
  for(field in srcObj){
    var val = srcObj[field];
    if (destObj[field] !== undefined && !overrideSameName){
      continue;
    }else{
      destObj[field] = val;
    }
  }
};//copyFields

var cloneObject = exports.cloneObject = function(obj){
  if (obj==null)  return null;
  var o2 = {};
  copyFields({srcObj:obj,destObj:o2});
  return o2;
};



