<?php
/**
*/


if (!class_exists('Image_moo')) require_once 'image_moo.php';

require_once './oss_php_sdk_20121011/sdk.class.php';





function getFileNameAndExt($filePath) {
    $path_parts = pathinfo($filePath);
    $fileFullName = $path_parts["basename"];
    $extPart = $path_parts["extension"];
    $fileNameWithoutExt = basename($fileFullName,'.'.$extPart);
    return array($fileNameWithoutExt,$extPart);
}

class handleLocalPhotoToAliyunOss{
    private $oss_sdk_service;

    public function __construct($accessKey, $secretKey, $host = NULL, $tmpDir = NULL)
    {
        //$accessKeyId = 'HNhptJzwZfzgTW6z';//'HNhptJzwZfzgTW6z';
        //$secretAccessKey = '0qgyHuS5n1nU3xe4rxLP8aPrkaRQQd';
        if ($host == NULL)  $host = 'oss.aliyuncs.com';// 'oss-internal.aliyuncs.com'
        $this->oss_sdk_service = new ALIOSS($accessKey,$secretKey,$host);
        $this->oss_sdk_service->set_debug_mode(FALSE);

        $this->tmpDir = $tmpDir;
        if ($this->tmpDir == NULL) $this->tmpDir = "/tmp";
    }

    public function uploadFileToAliyunOss($filePath, $bucketName, $objectPath)
    {
        //echo "DEBUG: uploadFileToAliyunOss filePath = $filePath,\n bucketName=$bucketName, objectPath=$objectPath \n";
        try{
          $response = $this->oss_sdk_service->upload_file_by_file($bucketName,$objectPath,$filePath);
        }catch (Exception $ex){
            $r = array(
                "success" => FALSE,
                "errMessage" => $ex->getMessage()
            );
            return $r;
        }
        //echo "DEBUG: uploadFileToAliyunOss oss_sdk_service->upload_file_by_file after";
        $success = ($response->status==200);
        if ($success){
            //echo "DEBUG: in uploadFileToAliyunOss, upload_file_by_file: File successfully copied to {$bucketName}/".$objectPath.PHP_EOL;
        }else{
            //echo "DEBUG: in uploadFileToAliyunOss, upload_file_by_file: Failed to copy file {$filePath}".$objectPath.PHP_EOL;
        }
        //var_dump($response);

        $r = array(
            "success" => $success,
            "response" => $response
        );
        return $r;
    }

    public function resizeLocalPhotoAllToAliyunOss($filePath, $targetName, $bucketName, $aliyunOssFolderPath, $notUploadReally){
        //echo "DEBUG. resizeLocalPhotoAllToAliyunOss enter."."filePath=$filePath, targetName=$targetName, bucketName=$bucketName, aliyunOssFolderPath=$aliyunOssFolderPath \n";
        $resizeRetData = $this->_resizeLocalFileByPredefinedSizes($filePath, $targetName, $aliyunOssFolderPath);
        if(!empty($resizeRetData["err"])){
            return array("err" => $resizeRetData["err"]);
        }
        $differentSizePhotoInfo = $resizeRetData["differentSizePhotoInfo"];
        $differentSizePhotoInfo["bucketName"] = $bucketName;
        $differentSizePhotoInfo["aliyunOssFolderPath"] = $aliyunOssFolderPath;
        $differentSizePhotoInfo["notUploadReally"] = $notUploadReally;
        //echo "DEBUG. resizeLocalPhotoAllToAliyunOss begin upload 1.";
        if (!$notUploadReally){
            $r = $this->uploadFileToAliyunOss($differentSizePhotoInfo["path_s"],$bucketName,$differentSizePhotoInfo["objectPath_s"]);
            if (!$r["success"]){
                unlink($differentSizePhotoInfo["path_s"]);
                if ($resizeRetData["fixWidthFileExist"]) unlink($differentSizePhotoInfo["path_fw"]);
                $errMsg = "fail to upload file ".$differentSizePhotoInfo["path_s"]." to ".$differentSizePhotoInfo["objectPath_s"].".\n"
                    .print_r($r,true);
                return array("err" => $errMsg);
            }
            if ($resizeRetData["fixWidthFileExist"]){
                $r = $this->uploadFileToAliyunOss($differentSizePhotoInfo["path_fw"],$bucketName,$differentSizePhotoInfo["objectPath_fw"]);
                if (!$r["success"]){
                    unlink($differentSizePhotoInfo["path_s"]);
                    unlink($differentSizePhotoInfo["path_fw"]);
                    $errMsg = "fail to upload file ".$differentSizePhotoInfo["path_fw"]." to ".$differentSizePhotoInfo["objectPath_fw"].".\n"
                        .print_r($r,true);
                    return array("err" => $errMsg);
                }
            }
        }
        unlink($differentSizePhotoInfo["path_s"]);
        if ($resizeRetData["fixWidthFileExist"]) unlink($differentSizePhotoInfo["path_fw"]);
        //echo "DEBUG. resizeLocalPhotoAllToAliyunOss exit.";
        return array("success" => true,
            "differentSizePhotoInfo" => $differentSizePhotoInfo,
        );
    }

    private function _genDifferentSizePhotoInfo($photoPath,$targetName,$objectFolderPath){
        //$dirPath = dirname($photoPath);
        //$photoName = basename($photoPath);
        list($fileNameWithoutExt,$fileNameExt) = getFileNameAndExt($targetName);
        $name_s = $fileNameWithoutExt.'s.'.$fileNameExt;
        $name_m = $fileNameWithoutExt.'m.'.$fileNameExt;
        $name_fw = $fileNameWithoutExt.'fw.'.$fileNameExt;
        $r = array(
            "name_original" => $targetName,
            //"dirPath" => $dirPath,
            "name_s" => $name_s,
            "name_m" => $name_m,
            "name_fw" => $name_fw,//fix width
            "path_s" => $this->tmpDir .'/'. $name_s,
            "path_m" => $this->tmpDir .'/'. $name_m,
            "path_fw" => $this->tmpDir .'/'. $name_fw,

            "path_original" => $photoPath,
            "objectPath_original" => $objectFolderPath.'/'. $targetName,
            "objectPath_s" => $objectFolderPath.'/'. $name_s,
            "objectPath_m" => $objectFolderPath.'/'. $name_m,
            "objectPath_fw" => $objectFolderPath.'/'. $name_fw,

            "path_0" => $this->tmpDir .'/'. $targetName,
        );
        return $r;
    }

    private function _resizeLocalFileByPredefinedSizes($filePath,$targetName,$objectFolderPath)
    {
        //echo "DEBUG. _resizeLocalFileByPredefinedSizes enter."."filePath=$filePath, targetName=$targetName, objectFolderPath=$objectFolderPath";;
        $differentSizePhotoInfo = $this->_genDifferentSizePhotoInfo($filePath,$targetName,$objectFolderPath);

        //if (!copy($filePath, $differentSizePhotoInfo["path_0"])) {//even file in /tmp dir and mode be 777 will fail. only can succeed when in apache web dir
        //    $err = "failed to copy $filePath to {$differentSizePhotoInfo["path_0"]}...\n";
        //    return array("err" => $err);
        //}

        $image_mooObj = new Image_moo();
        $image_mooObj->load($filePath);//even file in /tmp dir and mode be 777 , file accessing will fail. only can succeed when in apache web dir
        $errInfo = $image_mooObj->display_errors();
        if(!empty($errInfo)){
            return array("err" => $errInfo);
        }

        $image_mooObj->resize_crop(128,128);
        $image_mooObj->save($differentSizePhotoInfo["path_s"]);
        $errInfo = $image_mooObj->display_errors();
        if(!empty($errInfo)){
            return array("err" => $errInfo);
        }

        $fixWidth = 208;
        $fixWidthFileExist = false;
        if ($image_mooObj->width > $fixWidth){
            $fixWidthFileExist = true;
            $image_mooObj->resizeToWidth($fixWidth);
            $image_mooObj->save($differentSizePhotoInfo["path_fw"]);
            $errInfo = $image_mooObj->display_errors();
            if(!empty($errInfo)){
                return array("err" => $errInfo);
            }
        }

        //echo "DEBUG. _resizeLocalFileByPredefinedSizes end.";
        return array("differentSizePhotoInfo" => $differentSizePhotoInfo,
            "fixWidthFileExist" => $fixWidthFileExist,
        );
    }
}//class

?>



