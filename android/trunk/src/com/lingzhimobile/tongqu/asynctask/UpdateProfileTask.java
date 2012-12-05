package com.lingzhimobile.tongqu.asynctask;

import java.io.File;
import java.util.HashMap;
import java.util.Iterator;

import org.apache.http.client.methods.HttpPost;
import org.json.JSONException;
import org.json.JSONObject;

import android.os.AsyncTask;
import android.os.Bundle;
import android.os.Message;

import com.lingzhimobile.tongqu.cons.MessageID;
import com.lingzhimobile.tongqu.exception.JSONParseException;
import com.lingzhimobile.tongqu.log.LogTag;
import com.lingzhimobile.tongqu.log.LogUtils;
import com.lingzhimobile.tongqu.net.HttpManager;
import com.lingzhimobile.tongqu.net.NetProtocol;
import com.lingzhimobile.tongqu.util.JSONParser;

public class UpdateProfileTask extends AsyncTask<Void, Void, String> {
    HashMap<String,String> values;
    String studentNo,department,description,educationaStatus,constellation,hometown;
    HttpPost httpRequest;
    Message msg;
    private String userId;
    private int width;
    private int height;
    private File photoFile;
    private final String requestURL = NetProtocol.HTTP_REQUEST_URL
            + "user/updateProfile";
    private final String requestURLWithPhoto = NetProtocol.HTTP_REQUEST_URL
            + "user/updateProfileWithPhoto";
    
    public UpdateProfileTask(String userId, HashMap<String,String> values, int width, int height,
            File photoFile,Message msg){
        this.userId = userId;
        this.values = values;
        this.msg = msg;
        this.width = width;
        this.height = height;
        this.photoFile = photoFile;
    }

    @Override
    protected String doInBackground(Void... params) {
        String result = null;
       
        JSONObject parameters;
        if (photoFile == null) 
        {
            httpRequest = new HttpPost(requestURL);
            parameters = new JSONObject();
            try {
                Iterator<String> keys = values.keySet().iterator();
                while (keys.hasNext()) {
                    String key = keys.next();
                    String value = values.get(key);
                    parameters.put(key, value);
                }
                parameters.put("userId", userId);
            } catch (JSONException e) {
                e.printStackTrace();
            }
            result = HttpManager.postAPI(httpRequest, requestURL, parameters);
        }else{
            httpRequest = new HttpPost(requestURLWithPhoto);
            try {
                result = HttpManager.updateProfileWithPhoto(userId, values, photoFile, String.valueOf(height), String.valueOf(width), httpRequest);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        LogUtils.Logi(LogTag.TASK, "The result of API request: " + result);
        return result;
    }

    @Override
    protected void onCancelled() {
        LogUtils.Logi(LogTag.TASK, "UpdateProfileTask onCancelled");
        if (httpRequest != null) {
            httpRequest.abort();
            LogUtils.Logi(LogTag.TASK, "http request abort");
        }
        super.onCancelled();
    }

    @Override
    protected void onPostExecute(String result) {
        super.onPostExecute(result);
        try {
            HashMap<String, String> values = new HashMap<String, String>();
            JSONParser.getUploadPhotoResult(result, values);
            msg.what = MessageID.UPDATE_PROFILE_OK;
            Bundle data = new Bundle();
            if (values.containsKey("photoId")) {
                data.putString("photoId", values.get("photoId"));
            }
            if (values.containsKey("photoPath")) {
                data.putString("photoPath", values.get("photoPath"));
            }
            msg.setData(data);
        } catch (JSONParseException e) {
            msg.what = MessageID.SERVER_RETURN_NULL;
            msg.obj = e.getCode();
        }
        msg.sendToTarget();
    }

}
