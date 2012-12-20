var path = require('path');
var util = require('util');
var tool = require("./tool");

var constants = exports.constants = {
    noLimit : 0, // =0 means no limit, >0 means limit existing
    LogLevelError : 0,
    LogLevelWarning : 1,
    LogLevelInfo : 2,
    LogLevelDebug : 3,
    filterAllFlag : 'all'
};

var colors = exports.colors = {
    'inverse' : [7, 27],
    'white' : [37, 39],
    'grey' : [90, 39],
    'black' : [30, 39],
    'blue' : [34, 39],
    'cyan' : [36, 39],
    'green' : [32, 39],
    'magenta' : [35, 39],
    'red' : [31, 39],
    'yellow' : [33, 39]
  };

var config = exports.config = {
    usage: 'prod', //'dev'  // affect applePushNotificationServiceHost and apnsCertFilePath
    productName : '活动号外',//'同去',//'PrettyRich',

    prodEnv:{
      host:'42.121.122.47',//'ec2-23-23-144-110.compute-1.amazonaws.com',
      port:3000,
      securePort:3010,
      applePushNotificationServiceHost : 'gateway.push.apple.com',
      apnsCertFilePath : path.join(__dirname,'../static/cert/apns_product.pem'),
      dataRedisPort : 6479,
      webSessionRedisPort : 6480
    },
    devEnv:{
      host:'42.121.122.47',//'ec2-23-23-144-110.compute-1.amazonaws.com',
      port:4000,
      securePort:4010,
      applePushNotificationServiceHost : 'gateway.sandbox.push.apple.com',
      apnsCertFilePath : path.join(__dirname,'../static/cert/apns_development.pem'),
      dataRedisPort : 6379,
      webSessionRedisPort : 6380
    },
//    host_prod:'ec2-23-23-144-110.compute-1.amazonaws.com',
//    host_dev:'ec2-23-21-136-120.compute-1.amazonaws.com',
//    port:4000,
//    securePort:4010,
    cloudStorage:{
      currentStorage : 'aliyunOss',//'aliyunOss',//'amazonS3',
      isInCloud : true,//false,

      amazonS3 : {
        //s3url : "http://s3.amazonaws.com/ysf1",
        toBucketUrl : "http://s3.amazonaws.com/ysf1",
        host: 's3.amazonaws.com',
        bucketName : 'ysf1',
        objectFolderPath_prod : "folderp",
        objectFolderPath_dev : "folder1",//"fold1",//"folder1",
        accessKeyId : 'AKIAJRXAW33HC3IZJIVA',
        secretAccessKey : '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'
      },
      aliyunOss : {
        toBucketUrl : "http://oss.aliyuncs.com/ysf1",
        hostInner : 'oss-internal.aliyuncs.com', //storage.aliyun.com
        hostOutside : 'oss.aliyuncs.com',
        bucketName : 'ysf1',
        objectFolderPath_prod : "folderp",
        objectFolderPath_dev : "folder1",
        accessKeyId : 'HNhptJzwZfzgTW6z',
        secretAccessKey : '0qgyHuS5n1nU3xe4rxLP8aPrkaRQQd'
      }
    },

    https_keyFilePath : path.join(__dirname,'../static/https/privatekey.pem'),
    https_certFilePath : path.join(__dirname,'../static/https/certificate.pem'),

    sessionAge : 30*24*60*60*1000,  // app session age. in milliseconds
    webSessionAge : 30*60*1000,  // in milliseconds
//    webSessionRedisPort : 6380,

    //autoAuditPhoto : true,
    autoComplementNearbyHotPhotos : true,
    needNotCheckInviteCode : true,

    feedsCount : 20,
    photosCount : 20,
    datesCount : 20,
    userPhotosCount : 20,//5
    messagesCount : 20,

    feedPhotosLimit : 8,
    userPhotoLooseLimit: 10000,
    userCreateInviteCodeLimit: 1000,
    inviteCodeLength : 5,
    timeSpanSameFeedPhotos : 1000*60*60, //in microseconds

    creditDeltaForFirstSignUp : 100,
    creditDeltaForUploadPhoto : 1,
    creditDeltaForPhotoBeLiked : "log2n",
    creditDeltaForDailySignIn : 1,

    creditDeltaForBatchSendDate : "rule",
    creditDeltaForSingleSendDate : -1,
    creditDeltaForFirstRespondDate : -1,
    creditDeltaForConfirmDate : -10,//-10,

    apacheTmpPicDir : "/var/www/html/tpic",


    logLevel : 3,//0 error, 1 warning, 2 info, 3 debug
    logToConsole : true,
    logToSyslog : true,

    /*
     * if stderr is redirected to a file, the output to stderr will be put in to the file without losing.
     * So when we redirect output to file and do not want to lose data, we can let the output to stderr.
     */
    logToStderr : true,

    periodicThreadInterval : 60*1000,//in microseconds
    diableThreadWorker : false,
    notifyDaterAdvanceTime : 2*60*60*1000, //in microseconds
    notifyDaterBatchCount : 1000,

    solrHost : 'localhost',
    solrPort : 8983,
    solrCommitWithin : 1*1000,//in microseconds
    solrPeriodicThreadInterval : 500,//in microseconds

    users:{
      //system:'system'
      system:{userId:'system',name:'PrettyRich'}
    },

    defaultRegion : 'globalRegion',//when region info is not ready when register, use this value
    madeRegion : 'madeRegion',//used to indicate the user is a false user when register

    geoLibTypes:{
      //ios : 'ios',
      android : 'android',
      //google : 'google',
      googleV3 : 'googleV3'
    },

    defaultLocale: {// en-us , zh-cn , all lower case , will be split to language and region -- 2 parts.
      language: 'zh',  //can be en(English) or zh(Chinese)
      region:'cn'
    },
    forceLocale:{
      language: 'zh',
      region:'cn'
    },

    errors:{
      'simpleError': {code:'11001', message:'error: {0}',
          msg_zh:"有错误:"},
      'needParameter' : {code:'11010', message:'need parameter {0}',
          msg_zh:"需要参数{0}"},
      'needDirectParameter' : {code:'11011', message:'need {0} parameter',
          msg_zh:"需要直接参数{0}"},
      'needParameterMeetCondition' : {code:'11012', message:'the parameter(s) must meet the condition: {0}',
          msg_zh:"参数需要符合这样的条件{0}"},
      'needVariableMeetCondition' : {code:'11013', message:'the variable(s) must meet the condition: {0}',
          msg_zh:"变量需要符合这样的条件{0}"},
      'needCallbackFunction' : {code:'11014', message:'need callback function',
          msg_zh:"需要回调函数"},

      'unknownValueForParam' : {code:'11020', message:'unknown value({0}) for the parameter({1})',
          msg_zh:"未知的参数值({0})，对于参数({1})来说"},
      'unsupportedValueForParam' : {code:'11021', message:'unsupported value({0}) for the parameter({1})',
          msg_zh:"不支持的参数值({0})，对于参数({1})来说"},
      'unsupportedCase' : {code:'11022', message:'unsupported case',
          msg_zh:"不支持的情况"},
      'impossibleToGoHere' : {code:'11025', message:'it is impossible to run here',
          msg_zh:"应该不可能运行到这里"},
      'invalidValueForParam' : {code:'11026', message:'invalid value({0}) for the parameter({1})',
          msg_zh:"无效的参数值({0})，对于参数({1})来说"},

      'errorFromPhpWhenResizeToS3' : {code:'11030', message:'error from php server when resize photo and upload to s3: {0}',
          msg_zh:"从php服务器来的错误，当改变照片大小及传到S3时:\n{0}"},
      'errorFromPhpWhenResizeToAliyunOss' : {code:'11031', message:'error from php server when resize photo and upload to AliyunOss: {0}',
          msg_zh:"从php服务器来的错误，当改变照片大小及传到AliyunOss时:\n{0}"},

      'HttpsEmptyResponse' : {code:'11100', message:'the response of {0} is empty',
          msg_zh:"{0}的https响应是空的"},
      'libraryError' : {code:'11101', message:'library {0} error, see innerError',
          msg_zh:"调用库{0}出错，参见内部错误"},
      'socketECONNREFUSED' : {code:'11102', message:'socket ECONNREFUSED error, see innerError',
          msg_zh:"套接字出现ECONNREFUSED错误，参见内部错误"},
      'socketECONNRESET' : {code:'11103', message:'socket ECONNRESET error, see innerError',
          msg_zh:"套接字出现ECONNRESET错误，参见内部错误"},

      'notFindC2dmRegistrationIdOrApnsDeviceToken' : {code:'11110', message:'could not find C2dm RegistrationId or Apns device token of user {0}',
          msg_zh:"找不到用户({0})C2dm的注册标识或Apns的设备码"},
      'isRefreshingC2dmAuth' : {code:'11115', message:'another invocation is refreshing c2dm auth',
          msg_zh:"另一个调用在刷新c2dm的认证信息"},
      'temporaryDisableGetC2dmAuth' : {code:'11116', message:'should wait some time to get c2dm auth',
          msg_zh:"需要等一会去取c2dm的认证信息"},
      'temporaryDisableSendC2dmNotification' : {code:'11117', message:'should wait some time to send c2dm notification, maybe quota exceeds.',
          msg_zh:"需要等一会再发送c2dm的通知，可能超过了限额"},
      'temporaryDisableC2dmDevice' : {code:'11118', message:'to send to the c2dm device is disabled for some time, maybe because c2dm device quota exceeds. ({0})',
          msg_zh:"暂且不对这个c2dm设备发通知，可能是由于超过了这个设备的限额.({0})"},

      'c2dmSendErrorQuotaExceeded' : {code:'11120', message:'QuotaExceeded Error of c2dm send',
          msg_zh:"发送c2dm通知错误，超过了限额"},
      'c2dmSendErrorDeviceQuotaExceeded' : {code:'11121', message:'DeviceQuotaExceeded Error of c2dm send',
          msg_zh:"发送c2dm通知错误，超过了设备限额"},
      'c2dmSendErrorMissingRegistration' : {code:'11122', message:'MissingRegistration Error of c2dm send',
          msg_zh:"发送c2dm通知错误，缺少注册"},
      'c2dmSendErrorInvalidRegistration' : {code:'11123', message:'InvalidRegistration Error of c2dm send',
          msg_zh:"发送c2dm通知错误，注册无效"},
      'c2dmSendErrorMismatchSenderId' : {code:'11124', message:'MismatchSenderId Error of c2dm send',
          msg_zh:"发送c2dm通知错误，发送者id不匹配"},
      'c2dmSendErrorNotRegistered' : {code:'11125', message:'NotRegistered Error of c2dm send',
          msg_zh:"发送c2dm通知错误，未注册"},
      'c2dmSendErrorMessageTooBig' : {code:'11126', message:'MessageTooBig Error of c2dm send',
          msg_zh:"发送c2dm通知错误，消息体太大"},
      'c2dmSendErrorMissingCollapseKey' : {code:'11127', message:'MissingCollapseKey Error of c2dm send',
          msg_zh:"发送c2dm通知错误，没有重叠键"},
      'c2dmSendError401Unauthorized' : {code:'11128', message:'c2dm send Error 401 Unauthorized',
          msg_zh:"发送c2dm通知错误，401未授权"},
      'c2dmSendError503ServerUnavailable' : {code:'11129', message:'c2dm send Error 503. Indicates that the server is temporarily unavailable (i.e., because of timeouts, etc ). Sender must retry later, honoring any Retry-After header included in the response. Application servers must implement exponential back off. Senders that create problems risk being blacklisted.',
          msg_zh:"发送c2dm通知错误，503，表示服务器暂时不可用"},
      'c2dmSendUnknownResponse' : {code:'11130', message:'c2dm send unknown response, ={0}',
          msg_zh:"发送c2dm通知错误，未知响应：{0}"},
      'c2dmAuthUnknownResponse' : {code:'11131', message:'c2dm auth unknown response, ={0}',
          msg_zh:"认证c2dm错误，未知响应：{0}"},
      'c2dmAuthErrorBadAuthentication' : {code:'11132', message:'BadAuthentication Error of c2dm auth',
          msg_zh:"认证c2dm错误，不好的认证信息"},
      'c2dmAuthErrorNotVerified' : {code:'11133', message:'NotVerified Error of c2dm auth',
          msg_zh:"认证c2dm错误，还没核实"},
      'c2dmAuthErrorTermsNotAgreed' : {code:'11134', message:'TermsNotAgreed Error of c2dm auth',
          msg_zh:"认证c2dm错误，不同意条款"},
      'c2dmAuthErrorCaptchaRequired' : {code:'11135', message:'CaptchaRequired Error of c2dm auth',
          msg_zh:"认证c2dm错误，需要验证码"},
      'c2dmAuthErrorUnknown' : {code:'11136', message:'Unknown Error of c2dm auth',
          msg_zh:"认证c2dm错误，未知错误"},
      'c2dmAuthErrorAccountDeleted' : {code:'11137', message:'AccountDeleted Error of c2dm auth',
          msg_zh:"认证c2dm错误，帐号已删除"},
      'c2dmAuthErrorAccountDisabled' : {code:'11138', message:'AccountDisabled Error of c2dm auth',
          msg_zh:"认证c2dm错误，帐号已被禁用"},
      'c2dmAuthErrorServiceDisabled' : {code:'11139', message:'ServiceDisabled Error of c2dm auth',
          msg_zh:"认证c2dm错误，服务已禁用"},
      'c2dmAuthErrorServiceUnavailable' : {code:'11140', message:'ServiceUnavailable Error of c2dm auth',
          msg_zh:"认证c2dm错误，服务不可用"},

      'dataTooLongToSendToC2dm' : {code:'11150', message:'the data is too long to send to c2dm, len={0}, content={1}, \n origin obj={2}',
          msg_zh:"发往c2dm的数据太长，长度为 {0}，内容为 {1}，\n原始数据对象为 {2}"},

      'apnsInvalidLengthDeviceToken' : {code:'11160', message:'Apple Push Notification Service: invalid length of device token {0}',
          msg_zh:"发往apns出错，设备码长度不对{0}"},
      'apnsPayLoadExceedLimit' : {code:'11161', message:'Apple Push Notification Service: payload exceeds limit. len={0}, data={1}',
          msg_zh:"发往apns出错，数据负荷超长，长度为 {0}，数据为 {1}"},
      'apnsConnectionEnd' : {code:'11162', message:'got end event of the connection to Apple Push Notification Service',
          msg_zh:"发往apns出错，得到连接的结束事件"},
      'apnsConnectionClose' : {code:'11163', message:'got close event of the connection to Apple Push Notification Service',
          msg_zh:"发往apns出错，得到连接的关闭事件"},
      'apnsNoConnection' : {code:'11164', message:'no connection to Apple Push Notification Service',
          msg_zh:"没有到apns的连接"},

      'canNotSupportSystemUser' : {code:'11200', message:'Can not support system user here.',
          msg_zh:"这里不支持系统用户"},

      'needUploadFile' : {code:'11210', message:'need upload a file with key=image',
          msg_zh:"上传的文件需要是键值为image"},
      'regionObjNeedField' : {code:'11211', message:'need field {0} in the region object',
          msg_zh:"区域对象中需要这个属性 {0}"},
      'needUserCityLocation' : {code:'11212', message:"You have no cityLocation, you should updateLocation first",
          msg_zh:""},
      'cityLocationNotEqual' : {code:'11213', message:'the cityLocation from front app was not equal to which the backend calculated out.',
          msg_zh:""},




      'creditNotEnoughForSend1' : {code:'21010', message:'user credit not enough to send date to 1 user', msg_zh:""},
      'creditNotEnoughForSendN' : {code:'21011', message:'user credit not enough to send date to multiple users', msg_zh:""},
      'creditNotEnoughForRespond' : {code:'21012', message:'user credit not enough to respond date', msg_zh:""},
      'creditNotEnoughForConfirm' : {code:'21013', message:'user credit not enough to confirm date', msg_zh:""},

      'dateAlreadyBothConfirmedD' : {code:'21020', message:'the date ({0}) already be confirmed by both sides.'},
      'senderAlreadyConfirmDateOnceD' : {code:'21021', message:'the date ({0}) already be confirmed by sender once.'},
      'responderAlreadyBeConfirmedInDateD' : {code:'21022', message:'you already confirmed the date ({0}) with the responder. you can not change or do anything except for waiting the other side to confirm for now',
          msg_zh:""},
      'dateAlreadyConfirmedByResponderD' : {code:'21023', message:'you already confirmed the date ({0}) as responder.'},
      'dateAlreadyConfirmedWithOtherResponderD' : {code:'21024', message:'the date ({0}) has been already confirmed with other responder.'},

      'dateAlreadySentD' : {code:'21030', message:'the date ({0}) already be sent to the user ({1}).', msg_zh:""},
      'notFindUsersToSendD' : {code:'21031', message:'not find valid recceivers for the date({0}) in the region.', msg_zh:""},
      'dateNotExist' : {code:'21032', message:'date({0}) does not exist',
          msg_zh:"这个聚会({0})不存在"},
      'canNotSendDateForNotCreatorD' : {code:'21033', message:'you can not send the date because you are not the creator', msg_zh:""},
      'canNotSendDoubleConfirmedDateD' : {code:'21034', message:'you can not send the date because it is already double confirmed.', msg_zh:""},
      'canNotSendSelfSingleConfirmedDateD' : {code:'21035', message:'you can not send the date because you already confirmed it for someone.', msg_zh:""},
      'dateResponderNotExist' : {code:'21036', message:'date({0}) responder({1}) does not exist',
          msg_zh:"这个聚会({0})不存在这个响应者({1})"},

      'canNotDeletePrimaryPhoto' : {code:'21040', message:'the photo({0}) is primary photo and can not be deleted.',
          msg_zh:"不能删除主照片({0})"},
      'photoAlreadyDeleted' : {code:'21041', message:'the photo({0}) is already deleted.',
          msg_zh:"照片已经被删除({0})"},
      'onlyOwnerCanDeletePhoto' : {code:'21042', message:'You can not delete the photo({0}) because you are not the owner.',
          msg_zh:"只有照片所有人才能删除这照片({0})"},
      'onlyOwnerCanSetPrimaryPhoto' : {code:'21043', message:'You can not set the photo({0}) to be your profile photo because you are not the owner.',
          msg_zh:"你不是照片({0})的所有人，不能把它设置为主照片"},
      'photoAuditDenied' : {code:'21044', message:'the photo({0}) is denied.',
          msg_zh:"这张照片({0})是被审核拒绝的。"},
      'photoCreatedAndNeedAudit' : {code:'21045', message:'the photo({0}) is just created and need be audited.',
          msg_zh:"这张照片({0})刚被创建，需要被审核。"},
      'photoAlreadyAuditPassed' : {code:'21046', message:'the photo({0}) is already audited and passed.',
          msg_zh:"这张照片({0})是已被审核通过的。"},

      'alreadyFollowedD' : {code:'21050', message:'you have already followed the user.', msg_zh:""},
      'notFollowedYetD' : {code:'21051', message:'you do not follow the user.', msg_zh:""},

      'noPriviledgeForNoAuditPassedPhoto':{code:'21060', message:'you can not do this because your priviledge is limited for you have no audit passed photoes.',
          msg_zh:"你没有权限做这个操作，因为你没有审核通过的照片"},

      'canNotLikeSelfPhoto' : {code:'21070', message:'You can not like photo of self.', msg_zh:""},
      'photoAlreadyLiked' : {code:'21071', message:'You already liked the photo.', msg_zh:""},
      'photoNotLiked' : {code:'21072', message:'You have not liked the photo.', msg_zh:""},
      'photoNotExist' : {code:'21073', message:'photo({0}) does not exist',
          msg_zh:"此照片({0})不存在"},


      'userNoGender' : {code:'21080', message:'You have no gender information. You must first sign up',
          msg_zh:"取不到用户性别信息，请登录"},
      'userNotExist' : {code:'21081', message:'user({0}) does not exist',
          msg_zh:"此用户({0})不存在"},
      'emailAlreadyRegistered' : {code:'21082', message:'the email({0}) has already been registered.',
          msg_zh:"这个邮件地址({0})已经被注册"},
      'emailNotRegistered' : {code:'21083', message:'the email({0}) has not been registered.',
          msg_zh:"这个邮件地址({0})尚未注册"},
      'passwordNotMatch' : {code:'21084', message:'password not match.',
          msg_zh:"密码不匹配"},
      'userNotLogin' : {code:'21085', message:'user not log in',
          msg_zh:"用户未登录"},
      'sessionExpire' : {code:'21086', message:'session expired',
          msg_zh:"会话过期"},
      'userDisabled' : {code:'21087', message:'the user is diabled',
          msg_zh:"用户被禁"},
      'sessionNotConsistent' : {code:'21088', message:'session not consistent, front app userId not be same as backend session stored',
          msg_zh:"前后端session不一致，用户Id不一致"},

      'noSuchIdMessage' : {code:'21090', message:'Not found the message({0})',
          msg_zh:"不存在这条消息({0})"},
      'canNotSendMessageToSelf' : {code:'21091', message:'can not send message to self',
          msg_zh:"不能自己给自己发消息"},
      'dateCreatorNotInConversation' : {code:'21092', message:'date creator need to be in the conversation',
          msg_zh:"对话中不能没有聚会的创建者"},
      'dateCreatorNeedInvolve' : {code:'21093', message:'date creator need to be involved',
          msg_zh:"两方用户间需要有聚会的创建者"},

      'passwordTooShort' : {code:'21100', message:'password too short.',
          msg_zh:"密码太短"},

      'onlyCreatorCanConfirmDate' : {code:'21200', message:'only date creator can confirm date.',
          msg_zh:"只有聚会的发起者才能批准对方加入"},
      'dateConfirmedToSameResponderD' : {code:'21201', message:'You have already confirmed the date ({0}) to the same responder.',
          msg_zh:"你已经批准了同一个响应者加入这个聚会"},
      'dateConfirmedToOtherResponderD' : {code:'21202', message:'You have already confirmed the date ({0}) to other responder.',
          msg_zh:""},
      'onlyCreatorCanCancelDate' : {code:'21203', message:'only date creator can cancel date.',
          msg_zh:"只有聚会的发起者才能取消对方加入"},

      'invalidInviteCode' : {code:'21210', message:'invalid invite code',
          msg_zh:"邀请码无效"},
      'errorInviteCode' : {code:'21211', message:'error invite code',
          msg_zh:"邀请码错误"},
      'expiredInviteCode' : {code:'21212', message:'expired invite code',
          msg_zh:"邀请码过期"},

      'alreadyRateDateResponder' : {code:'21220', message:'You have already rate the date responder({0})',
          msg_zh:"你已经评价了聚会的参与者({0})"},
      'alreadyRateDateCreator' : {code:'21221', message:'You have already rate the date creator',
          msg_zh:"你已经评价了聚会的发起者"},

      'alreadyConfirmDateResponder' : {code:'21230', message:'You have already confirmed the date responder',
          msg_zh:"你已经批准了这个响应者加入这个聚会"},
      'dateAlreadyStopped' : {code:'21231', message:'Date already stopped',
          msg_zh:"聚会已经停止"},
      'dateNotCreatedByYou' : {code:'21232', message:'The date is not created by you.',
          msg_zh:"你不是聚会的发起者"},
      'NotConfirmDateResponder' : {code:'21233', message:'You have not confirmed the date responder',
          msg_zh:"你还没有批准这个聚会响应者"},

      'studentNOCanNotChange' : {code:'21240', message:'studentNO can not be changed.',
          msg_zh:"不能修改学号"},

      'NOthisSchool' : {code:'21250', message:'NO this school {0}',
          msg_zh:"没有这个学校"},

      'canNotExceedUserCreateInviteCodeLimit' : {code:'21260', message:'You can not exceed invite code creating count limit.',
          msg_zh:"你超过了邀请码创建数量限额"},

      'renrenAccountAlreadyRegistered' : {code:'21300', message:'the renren account({0}) has already been registered.',
          msg_zh:"这个人人帐号({0})已经被注册"},

      'userAlreadyBindThisRenRenAccount' : {code:'21301', message:'the user has already been bound with this renren account.',
          msg_zh:"用户已经与这个人人帐号绑定"},
      'userAlreadyBindOtherRenRenAccount' : {code:'21302', message:'the user has already been bound with other renren account.',
          msg_zh:"用户已经与其它的人人帐号绑定"},
      'theRenRenAccountAlreadyBindThisUser' : {code:'21303', message:'the renren account has already been bound with this user.',
          msg_zh:"这个人人帐号已经与这个用户绑定"},
      'theRenRenAccountAlreadyBindOtherUser' : {code:'21304', message:'the renren account has already been bound with other user.',
          msg_zh:"这个人人帐号已经与其他的用户绑定"},
      'theRenRenAccountNotBindAnyUser' : {code:'21305', message:'the renren account has not been bound with any user.',
          msg_zh:"这个人人帐号尚未与任何用户绑定"},
      'userNotBindRenRenAccount' : {code:'21306', message:'the user has not bound with any renren account.',
        msg_zh:"这个用户没有绑定任何人人帐号"},


      'invalidResetPasswordCode' : {code:'30000', message:'invalid reset password code',
          msg_zh:"不正确的重置密码编码"},
      'invalidResetPasswordInfo' : {code:'30001', message:'invalid reset password info',
          msg_zh:"不正确的重置密码信息"},
      'expireResetPasswordInfo' : {code:'30002', message:'url expired',
          msg_zh:"过期的重置密码信息"},

      '':{code:0, message:'', msg_zh:""}
    },
    messages:{
      'informDateSenderWhenFirstChatD' : {text:'Hi, %s. Please chat well with %s before picking your date. When you click "Confirm" button, we will tell %s you are serious about this date and ask %s to confirm as well.'},
      'informDateConfirmSinglyToOppositeD' : {text:'Hi, %s. %s has confirmed this date. Are you also serious? Please click Confirm button.'},
      'informDateConfirmSinglyToSelfD' : {text:'You have confirmed this date with %s. We will ask %s to confirm back as well, then your date will be on!'},
      'informDateConfirmDoubleToOppositeD' : {text:'Hi, %s. Congratulations. %s has also confirmed. Your date is on! Please dress neat and be on time.'},
      'informDateConfirmDoubleToSelfD' : {text:'Congratulations. Your date is on! Please dress neat and be on time.'},

      'informDateConfirmToResponder' : {text:'恭喜，你已被发起人批准参加此项活动。'},
      'informDateCancelToResponder' : {text:'发起人取消了你参加此项活动的资格。'}

    },
    c2dmMailAccount : 'lingzhimobile@gmail.com',
    c2dmMailPwd : '0e83439cad8e8462d6273d5021aa6126',  //encrypted
    c2dmMessageSizeLimit : 1024,

//    applePushNotificationServiceHost_dev : 'gateway.sandbox.push.apple.com',
//    apnsCertFilePath_dev : path.join(__dirname,'../static/cert/apns_development.pem'),
//    applePushNotificationServiceHost_prod : 'gateway.push.apple.com',
//    apnsCertFilePath_prod : path.join(__dirname,'../static/cert/apns_product.pem'),
    applePushNotificationServicePort : 2195,
    apnsSslPassphrase : 'VVDk12@a',
    apnsPayloadLengthLimit : 256, //in bytes
    apnsDeviceTokenLength : 32,

//    noreplyMailAccount : 'tongqusupport@yasofon.com',
//    noreplyMailAccountPwd : 'fa1f95f259b0e23dc333f317e6777384',//encrypted
//    noreplyMailAccount : 'noreply@prettyri.ch',
//    noreplyMailAccountPwd : '76bc5d9c9ceb4e22b72d752e8294a5b4',//encrypted
    noreplyMailAccount : 'support@huodonghaowai.com',
    noreplyMailAccountPwd : '63028f51304840723449b62337880441',//encrypted
    noreplyMailHost : 'smtp.exmail.qq.com',
    noreplyMailHostPort : 25,

    passwordMinLength : 6,

    distanceForNearbyUserToSendNotification : 10, //in km
    countForNearbyUserToSendNotification : 100,

    //downUrlForAndroid :  "http://t.cn/zjLa55G",// "hmu107145.chinaw3.com",
    //downUrlForAndroid :  "http://t.cn/zjLSwyF",// http://hmu107145.chinaw3.com/PrettyRich.apk
    downUrlForAndroid :  "http://t.cn/zjLjlP5",// http://hmu107145.chinaw3.com/tongqu.apk
    downUrlForApple : "tinyurl.com/aan5yxs", //"https://itunes.apple.com/cn/app/prettyrich/id543114421?l=en&mt=8",


    //schools : ['北京大学','清华大学']
    schools : [{id:'BeiJingDaXue',name:'北京大学'},{id:'QingHuaDaXue',name:'清华大学'}]

};


var getEnvConfig = exports.getEnvConfig = function(){
  if (config.usage == 'prod'){
    return config.prodEnv;
  }else{
    return config.devEnv;
  }
};

var getHost = exports.getHost = function(){
  return getEnvConfig().host;
};

var getCloudStorageInfo = exports.getCloudStorageInfo = function(){
  if (config.cloudStorage.currentStorage == 'amazonS3'){
    return config.cloudStorage.amazonS3;
  }else{
    return config.cloudStorage.aliyunOss;
  }
};
var getCloudStorageHost = exports.getCloudStorageHost = function(){
  var cloudStorageInfo = null;
  if (config.cloudStorage.currentStorage == 'amazonS3'){
    cloudStorageInfo = config.cloudStorage.amazonS3;
    return cloudStorageInfo.host;
  }else{
    cloudStorageInfo = config.cloudStorage.aliyunOss;
    if (config.cloudStorage.isInCloud){
      return cloudStorageInfo.hostInner;
    }else{
      return cloudStorageInfo.hostOutside;
    }
  }
};//getCloudStorageHost

var getSendCountFromCredit = exports.getSendCountFromCredit = function(params){
  var credit = params.credit;
  var sendCount,err=null;
  if (credit == 3)
    sendCount = 10;
  else if (credit == 5)
    sendCount = 20;
  else if (credit == 7)
    sendCount = 40;
  else{
    err = new Error('invalid credit to calculate sendCount, should be 3 , 5, 7');
    return {err:err};
  }
  return {sendCount:sendCount};
};//getSendCountFromCredit

/**
 * it is specially used for stat
 * @param params
 * @returns
 */
var getSendCountInfoFromCredit = exports.getSendCountInfoFromCredit = function(params){
  var countInfo = getSendCountFromCredit(params);
  if (countInfo.err) return countInfo;
  var sendCount = countInfo.sendCount;
  if (sendCount == 10){
    return {beSendTo10:true};
  }else if (sendCount == 20){
    return {beSendTo20:true};
  }else if (sendCount == 40){
    return {beSendTo40:true};
  }else{
    err = new Error('unsupported sendCount '+sendCount);
    return {err:err};
  }
};//getSendCountInfoFromCredit


var getResizedPhotoPathFromOriginal = exports.getResizedPhotoPathFromOriginal = function(photoPathOriginal){
  if (!photoPathOriginal)  return null;
  var extnameWithDot = path.extname(photoPathOriginal);
  var basenameWithoutExtDot = path.basename(photoPathOriginal,extnameWithDot);
  var photoname_s = basenameWithoutExtDot+"s"+extnameWithDot;
  var photoname_fw = basenameWithoutExtDot+"fw"+extnameWithDot;
  var dirname = path.dirname(photoPathOriginal);
  var photoPath_s = path.join(dirname,photoname_s);
  var photoPath_fw = path.join(dirname,photoname_fw);
  return {s:photoPath_s, fw:photoPath_fw};
};//getResizedPhotoPathFromOriginal



var configLocalPath = path.join(__dirname,'./configLocal.js');
if (path.existsSync(configLocalPath)){
  var configLocal = require(configLocalPath);

  console.log("before config.usage="+util.inspect(config.usage,false,2));
  tool.copyFieldsDeepOnlyForObject({destObj:config, srcObj:configLocal.config, overrideSameName:true});
  console.log("after copyFields, config.usage="+util.inspect(config.usage,false,2));
}//if (path.existsSync(configLocalPath))









