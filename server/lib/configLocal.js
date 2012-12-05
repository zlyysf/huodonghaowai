/*
the values here will override values with same name in config.js

 */



var path = require('path');

var config = exports.config = {
    usage: 'dev', //'dev', 'prod'  // affect applePushNotificationServiceHost and apnsCertFilePath
    cloudStorage:{
      currentStorage : 'aliyunOss',//'aliyunOss',//'amazonS3',
      isInCloud : true//false,
    }
};




