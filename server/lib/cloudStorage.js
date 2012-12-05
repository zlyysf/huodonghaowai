var assert = require('assert');
var util = require('util');
var url = require("url");
var fs = require("fs");
var path = require('path');
var querystring = require('querystring');

var awssum = require('awssum');
var amazon = awssum.load('amazon/amazon');
var S3 = awssum.load('amazon/s3').S3;

var handy = require("./handy");
var logger = require('./logger');
var config = require('./config');
var aliyunOssClient3rdPart = require('./aliyunOssClient3rdPart.js');



var uploadFileToCloudStorage = exports.uploadFileToCloudStorage = function(params,cbFun){
  if (config.config.cloudStorage.currentStorage == 'amazonS3'){
    uploadFileToS3(params,cbFun);
    return;
  }else{
    uploadFileToAliyunOss(params,cbFun);
    return;
  }
};//uploadFileToCloudStorage


/**
 *
 * @param params- contains accessKeyId(optional),secretAccessKey(optional),
 *     bucket, objectFolderPath, objectName, filePath, fileSize(optional), notUploadReally(optional).
 * @param cbFun
 * @returns
 */
var uploadFileToAliyunOss = exports.uploadFileToAliyunOss = function(params,cbFun){
  var accessKeyId = params.accessKeyId;
  var secretAccessKey = params.secretAccessKey;
  var host = params.host;

  var bucket = params.bucket;
  var objectFolderPath = params.objectFolderPath;
  var objectName = params.objectName;
  var filePath = params.filePath;
  var fileSize = params.fileSize;
  var notUploadReally = params.notUploadReally;

  var objectPath = path.join(objectFolderPath,objectName);
  if (!accessKeyId) accessKeyId = config.config.cloudStorage.aliyunOss.accessKeyId;
  if (!secretAccessKey) secretAccessKey = config.config.cloudStorage.aliyunOss.secretAccessKey;
  if (!host) host = config.getCloudStorageHost();
  var aliyunOssClientOption = {
      accessId: accessKeyId,
      accessKey: secretAccessKey,
      host: host
    };

  if (notUploadReally){
    return cbFun(null,null);
  }
  var aliyunOssClient = new aliyunOssClient3rdPart.OssClient(aliyunOssClientOption);
  var beginTime = new Date().getTime();
  aliyunOssClient.putObject(bucket, objectPath, filePath, function(err){
    //console.log('upload file callback, err:' + err);
    if (!err){
      var endTime = new Date().getTime();
      var spanInMs = endTime - beginTime;
      logger.logDebug('uploadFileToAliyunOss succeed. fileSize='+fileSize+', time(ms)='+spanInMs);
    }
    return cbFun(err);
  });
};//uploadFileToAliyunOss







/**
 *
 * @param params - contains accessKeyId(optional),secretAccessKey(optional),
 *     bucket, objectFolderPath, objectName, filePath, fileSize, notUploadReally(optional).
 * @param cbFun
 * @returns
 */
var uploadFileToS3 = exports.uploadFileToS3 = function(params,cbFun){
  var accessKeyId = params.accessKeyId;
  var secretAccessKey = params.secretAccessKey;

  var bucket = params.bucket;
  var objectFolderPath = params.objectFolderPath;
  var objectName = params.objectName;
  var filePath = params.filePath;
  var fileSize = params.fileSize;
  var notUploadReally = params.notUploadReally;

  var objectPath = path.join(objectFolderPath,objectName);
  if (!accessKeyId) accessKeyId = config.config.cloudStorage.amazonS3.accessKeyId;
  if (!secretAccessKey) secretAccessKey = config.config.cloudStorage.amazonS3.secretAccessKey;

  var s3 = new S3({'accessKeyId' : accessKeyId,'secretAccessKey' : secretAccessKey,
    'region' : amazon.US_EAST_1});
  var bodyStream = fs.createReadStream( filePath );
  var options = {
      BucketName    : bucket,
      ObjectName    : objectPath,
      ContentLength : fileSize,
      Body          : bodyStream,
      Acl : 'public-read'
  };

  if (notUploadReally){
    return cbFun(null,null);
  }
  var beginTime = new Date().getTime();
  s3.PutObject(options, function(err, data) {
    if (!err){
      var endTime = new Date().getTime();
      var spanInMs = endTime - beginTime;
      logger.logDebug('uploadFileToS3 suceed. fileSize='+fileSize+', time(ms)='+spanInMs);
    }
    return cbFun(err,data);
  });//s3.PutObject
};//uploadFileToS3


















var resizeAndUploadPhotoByPhpSide = exports.resizeAndUploadPhotoByPhpSide = function(params,cbFun){
  if (config.config.cloudStorage.currentStorage == 'amazonS3'){
    resizeAndUploadPhotoToS3ByPhpSide(params,cbFun);
    return;
  }else{
    resizeAndUploadPhotoToAliyunOssByPhpSide(params,cbFun);
    return;
  }
};//resizeAndUploadPhotoByPhpSide


var resizeAndUploadPhotoToS3ByPhpSide = exports.resizeAndUploadPhotoToS3ByPhpSide = function(params,cbFun){
  var messagePrefix = 'in cloudStorage.resizeAndUploadPhotoToS3ByPhpSide, ';
  var bucketName = params.bucketName;
  var objectFolderPath = params.objectFolderPath;
  var filePath = params.filePath;
  var objectName = params.objectName;
  var notUploadReally = params.notUploadReally;
  var req = params.req;
  logger.logDebug("resizeAndUploadPhotoToS3ByPhpSide entered, params="+handy.inspectWithoutBig(params));
  handy.doHttpPostForm({host:'localhost',port:80,path:'/imageDeal/pgHandleLocalPhotoToS3.php',
    postForm:{bucketName:bucketName,objectFolderPath:objectFolderPath,filePath:filePath,objectName:objectName,
    notUploadReally:notUploadReally}},function(err, retDataObj){
      if (err) return cbFun(err);
      logger.logDebug("resizeAndUploadPhotoToS3ByPhpSide, doHttpPostForm, retDataObj.data=\n"+retDataObj.data);
      var retStrData = retDataObj.data+'';
      retStrData = retStrData.trim();
      //if (retStrData && retStrData.indexOf('error:')>=0){
      var isRetSuccess = (  retStrData.indexOf('success')==0  );//must start with success because error message also can contain 'success' text
      if (! isRetSuccess ){
        var err = handy.newError({errorKey:'errorFromPhpWhenResizeToS3',messageParams:[retStrData],messagePrefix:messagePrefix,req:req});
        return cbFun(err);
      }

      return cbFun(null);
  });//doHttpPostForm
};//resizeAndUploadPhotoToS3ByPhpSide


var resizeAndUploadPhotoToAliyunOssByPhpSide = exports.resizeAndUploadPhotoToAliyunOssByPhpSide = function(params,cbFun){
  var messagePrefix = 'in cloudStorage.resizeAndUploadPhotoToAliyunOssByPhpSide, ';
  var bucketName = params.bucketName;
  var objectFolderPath = params.objectFolderPath;
  var filePath = params.filePath;
  var objectName = params.objectName;
  var notUploadReally = params.notUploadReally;
  var req = params.req;
  logger.logDebug("resizeAndUploadPhotoToAliyunOssByPhpSide entered, params="+handy.inspectWithoutBig(params));
  handy.doHttpPostForm({host:'localhost',port:80,path:'/imageDeal/pgHandleLocalPhotoToAliyunOss.php',
    postForm:{bucketName:bucketName,objectFolderPath:objectFolderPath,filePath:filePath,objectName:objectName,
    host:config.getCloudStorageHost(),
    notUploadReally:notUploadReally}},function(err, retDataObj){
      if (err) return cbFun(err);
      logger.logDebug("resizeAndUploadPhotoToAliyunOssByPhpSide, doHttpPostForm, retDataObj.data=\n"+retDataObj.data);
      var retStrData = retDataObj.data+'';
      retStrData = retStrData.trim();
      //if (retStrData && retStrData.indexOf('error:')>=0){
      var isRetSuccess = (  retStrData.indexOf('success')==0  );//must start with success because error message also can contain 'success' text
      //logger.logDebug("resizeAndUploadPhotoToAliyunOssByPhpSide, doHttpPostForm, isRetSuccess="+isRetSuccess+", retStrData=\n"+retStrData);
      if (! isRetSuccess ){
        //logger.logDebug("resizeAndUploadPhotoToAliyunOssByPhpSide error return");
        var err = handy.newError({errorKey:'errorFromPhpWhenResizeToAliyunOss',messageParams:[retStrData],messagePrefix:messagePrefix,req:req});
        return cbFun(err);
      }
      //logger.logDebug("resizeAndUploadPhotoToAliyunOssByPhpSide ok return");
      return cbFun(null);
  });//doHttpPostForm
};//resizeAndUploadPhotoToAliyunOssByPhpSide

















