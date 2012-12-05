<?php
/**
* $Id$
*
* S3 class usage
*/

if (!class_exists('S3')) require_once 'S3.php';
if (!class_exists('Image_moo')) require_once 'image_moo.php';


function getFileNameAndExt($filePath) {
    $path_parts = pathinfo($filePath);
    $fileFullName = $path_parts["basename"];
    $extPart = $path_parts["extension"];
    $fileNameWithoutExt = basename($fileFullName,'.'.$extPart);
    return array($fileNameWithoutExt,$extPart);
}

class handleLocalPhotoToS3{
    private $s3;

    public function __construct($accessKey, $secretKey, $s3Acl, $tmpDir = NULL)
    {
        $this->s3 = new S3($accessKey, $secretKey);
        $this->s3Acl = $s3Acl;
        $this->tmpDir = $tmpDir;
        if ($this->tmpDir == NULL) $this->tmpDir = "/tmp";
    }

    //$s3->putObjectFile($filePath, $bucketName, $objectPath, S3::ACL_PUBLIC_READ)
    public function uploadFileToS3($filePath, $bucketName, $objectPath, $s3Acl)
    {
        //echo "filePath = $filePath,\n bucketName=$bucketName, objectPath=$objectPath";
        // Put our file (also with public read access)
        $r = $this->s3->putObjectFile($filePath, $bucketName, $objectPath, $s3Acl);
        if ($r) {
            //echo "S3::putObjectFile(): File copied to {$bucketName}/".$objectPath.PHP_EOL;
        } else {
            //echo "S3::putObjectFile(): Failed to copy file\n";
        }
        return $r;
    }

    public function resizeLocalPhotoAllToS3($filePath, $targetName, $bucketName, $objectFolderPath, $notUploadReally){
        //echo "DEBUG. resizeLocalPhotoAllToS3 enter."."filePath=$filePath, targetName=$targetName, bucketName=$bucketName, objectFolderPath=$objectFolderPath";
        $resizeRetData = $this->_resizeLocalFileByPredefinedSizes($filePath, $targetName, $objectFolderPath);
        if(!empty($resizeRetData["err"])){
            return array("err" => $resizeRetData["err"]);
        }
        $differentSizePhotoInfo = $resizeRetData["differentSizePhotoInfo"];
        $differentSizePhotoInfo["bucketName"] = $bucketName;
        $differentSizePhotoInfo["objectFolderPath"] = $objectFolderPath;
        $differentSizePhotoInfo["notUploadReally"] = $notUploadReally;
        //echo "DEBUG. resizeLocalPhotoAllToS3 begin upload 1.";
        if (!$notUploadReally){
            $r = $this->uploadFileToS3($differentSizePhotoInfo["path_s"],$bucketName,$differentSizePhotoInfo["objectPath_s"],$this->s3Acl);
            if (!$r){
                unlink($differentSizePhotoInfo["path_s"]);
                if ($resizeRetData["fixWidthFileExist"]) unlink($differentSizePhotoInfo["path_fw"]);
                $errMsg = "fail to upload file ".$differentSizePhotoInfo["path_s"]." to ".$differentSizePhotoInfo["objectPath_s"].".\n";
                return array("err" => $errMsg);
            }
            if ($resizeRetData["fixWidthFileExist"]){
                $r = $this->uploadFileToS3($differentSizePhotoInfo["path_fw"],$bucketName,$differentSizePhotoInfo["objectPath_fw"],$this->s3Acl);
                if (!$r){
                    unlink($differentSizePhotoInfo["path_s"]);
                    unlink($differentSizePhotoInfo["path_fw"]);
                    $errMsg = "fail to upload file ".$differentSizePhotoInfo["path_fw"]." to ".$differentSizePhotoInfo["objectPath_fw"].".\n";
                    return array("err" => $errMsg);
                }
            }
        }
        unlink($differentSizePhotoInfo["path_s"]);
        if ($resizeRetData["fixWidthFileExist"]) unlink($differentSizePhotoInfo["path_fw"]);
        //echo "DEBUG. resizeLocalPhotoAllToS3 exit.";
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



