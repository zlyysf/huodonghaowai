package com.lingzhimobile.huodonghaowai.asynctask;

import java.io.File;
import java.util.HashMap;

import org.apache.http.client.methods.HttpPost;

import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Message;

import com.lingzhimobile.huodonghaowai.cons.MessageID;
import com.lingzhimobile.huodonghaowai.exception.JSONParseException;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.net.HttpManager;
import com.lingzhimobile.huodonghaowai.net.NetProtocol;
import com.lingzhimobile.huodonghaowai.util.JSONParser;

public class UploadPhotoTask extends AsyncTask<Void, Void, String> {
    HttpPost httpRequest;
    Message msg;
    private final String requestURL = NetProtocol.HTTP_REQUEST_URL
            + "user/uploadPhoto";
    private int width;
    private int height;
    private File photoFile;
    private boolean setPrimary;

    public UploadPhotoTask(int width, int height,
            File photoFile, boolean setPrimary, Message msg) {
        this.width = width;
        this.height = height;
        this.photoFile = photoFile;
        this.setPrimary = setPrimary;
        this.msg = msg;
    }

    @Override
    protected String doInBackground(Void... params) {
        String result = null;
        httpRequest = new HttpPost(requestURL);

        try {
            result = HttpManager.uploadPhoto(photoFile, setPrimary,
                    String.valueOf(height), String.valueOf(width), httpRequest,
                    requestURL);
        } catch (Exception e) {
            e.printStackTrace();
        }
        LogUtils.Logi(LogTag.TASK, "The result of API request: " + result);
        return result;
    }

    @Override
    protected void onPostExecute(String result) {
        super.onPostExecute(result);
        try {
            HashMap<String, String> values = new HashMap<String, String>();
            JSONParser.getUploadPhotoResult(result, values);
            msg.what = MessageID.UPLOAD_PHOTO_OK;
            Bundle data = new Bundle();
            data.putString("photoId", values.get("photoId"));
            data.putString("photoPath", values.get("photoPath"));
            msg.setData(data);
        } catch (JSONParseException e) {
            msg.what = MessageID.SERVER_RETURN_NULL;
            msg.obj = e.getCode();
        }
        msg.sendToTarget();
    }

    @Override
    protected void onCancelled() {
        LogUtils.Logi(LogTag.TASK, "UploadPhotosTask onCancelled");
        if (httpRequest != null) {
            httpRequest.abort();
            LogUtils.Logi(LogTag.TASK, "http request abort");
        }
        super.onCancelled();
    }

}
