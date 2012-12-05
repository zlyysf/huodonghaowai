<?php

/*
 * error log info is in the file /var/log/httpd/error_log
 */
//echo "DEBUG. page enter.";


// AWS access info
if (!defined('awsAccessKey')) define('awsAccessKey', 'AKIAJRXAW33HC3IZJIVA');
if (!defined('awsSecretKey')) define('awsSecretKey', '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');


// If you want to use PECL Fileinfo for MIME types:
//if (!extension_loaded('fileinfo') && @dl('fileinfo.so')) $_ENV['MAGIC'] = '/usr/share/file/magic';


//echo "DEBUG. curl check before.";
// Check for CURL
if (!extension_loaded('curl') && !@dl(PHP_SHLIB_SUFFIX == 'so' ? 'curl.so' : 'php_curl.dll'))
	exit("\nERROR: CURL extension not loaded\n\n");
//echo "DEBUG. curl check after.";


// Pointless without your keys!
if (awsAccessKey == 'change-this' || awsSecretKey == 'change-this')
	exit("\nERROR: AWS access information required\n\nPlease edit the following lines in this file:\n\n".
	"define('awsAccessKey', 'change-me');\ndefine('awsSecretKey', 'change-me');\n\n");

//echo "DEBUG. classes load before.";


if (!class_exists('S3')) require_once 'S3.php';
if (!class_exists('Image_moo')) require_once 'image_moo.php';
if (!class_exists('handleLocalPhotoToS3')) require_once 'handleLocalPhotoToS3.php';


//echo "DEBUG. classes load after.";


$handleS3Photo = new handleLocalPhotoToS3(awsAccessKey, awsSecretKey, S3::ACL_PUBLIC_READ, '/tmp');

$bucketName = $_REQUEST['bucketName'];//$_REQUEST['bucketName']//'ysf1';//ysf1';//'ysfPhotos';
$objectFolderPath = $_REQUEST['objectFolderPath']; //$_REQUEST['objectFolderPath'];//'folder1'; //'folder1';//'user';
$filePath = $_REQUEST['filePath'];//'/var/www/html/imageDeal/a1.png';//'/tmp/a1.png';// $_REQUEST['filePath']; //'draw2.png';//   '/var/www/html/imageDeal/draw2.png';//
$objectName = $_REQUEST['objectName'];//'ta1.png';// $_REQUEST['objectName']; //'draw2.png';//
$notUploadReally = $_REQUEST['notUploadReally']; //true; //$_REQUEST['notUploadReally'];
//var_dump("notUploadReally=",$notUploadReally);
if ($notUploadReally == 'false')
  $notUploadReally = false;
else
  $notUploadReally = (bool)$notUploadReally;

if (empty($bucketName)){
    echo 'error: bucketName is empty.';
    return;
}
if (empty($objectFolderPath)){
    echo 'error: objectFolderPath is empty.';
    return;
}
if (empty($filePath)){
    echo 'error: filePath is empty.';
    return;
}
if (empty($objectName)){
    echo 'error: objectName is empty.';
    return;
}

$s3Acl = S3::ACL_PUBLIC_READ;
$resizeRetDataArray = $handleS3Photo->resizeLocalPhotoAllToS3($filePath, $objectName, $bucketName, $objectFolderPath, $notUploadReally);
if(!empty($resizeRetDataArray["err"])){
    error_log("imageResizeAndToS3Error:".$resizeRetDataArray["err"]);
    echo "error: ".$resizeRetDataArray["err"];
}else{
    echo "success\n";
    var_dump($resizeRetDataArray["differentSizePhotoInfo"]);
    //echo "objectPath_s=".$resizeRetDataArray["differentSizePhotoInfo"]["objectPath_s"]."\n";
    //echo "objectPath_m=".$resizeRetDataArray["differentSizePhotoInfo"]["objectPath_m"]."\n";
}


//  http://zlyysfcentos55/imageDeal/pgHandleLocalPhotoToS3.php?bucketName=ysf1&objectFolderPath=folder1&filePath=/var/www/html/imageDeal/draw2.png&objectName=draw2.png
//  curl http://zlyysfcentos55/imageDeal/pgHandleLocalPhotoToS3.php --data "bucketName=ysf1&objectFolderPath=folder1&filePath=/var/www/html/imageDeal/draw2.png&objectName=draw2.png"

?>



