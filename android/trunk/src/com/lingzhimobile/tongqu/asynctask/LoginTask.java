package com.lingzhimobile.tongqu.asynctask;

import org.apache.http.client.methods.HttpPost;
import org.json.JSONException;
import org.json.JSONObject;

import android.os.AsyncTask;
import android.os.Message;

import com.lingzhimobile.tongqu.cons.MessageID;
import com.lingzhimobile.tongqu.exception.JSONParseException;
import com.lingzhimobile.tongqu.log.LogTag;
import com.lingzhimobile.tongqu.log.LogUtils;
import com.lingzhimobile.tongqu.net.HttpManager;
import com.lingzhimobile.tongqu.net.NetProtocol;
import com.lingzhimobile.tongqu.util.AppInfo;
import com.lingzhimobile.tongqu.util.JSONParser;

public class LoginTask extends AsyncTask<Void, Void, String> {
    HttpPost httpRequest;
    private final String requestURL = NetProtocol.HTTPS_REQUEST_URL
            + "user/logIn";
    private String email, password;
    private Message msg;
    
    public LoginTask(String email, String password, Message msg){
        this.email = email;
        this.password = password;
        this.msg = msg;
    }

    @Override
    protected String doInBackground(Void... params) {
        String result = null;
        httpRequest = new HttpPost(requestURL);
        JSONObject parameters = new JSONObject();
        try {
            parameters.put("emailAccount", email);
            parameters.put("password", password);
            parameters.put("deviceType", "android");
            parameters.put("deviceId", AppInfo.getDeviceId());
        } catch (JSONException e) {
            e.printStackTrace();
        }
        result = HttpManager.postAnonymousAPI(httpRequest, requestURL, parameters);
        LogUtils.Logi(LogTag.TASK, "The result of API request: " + result);
        return result;
    }

    @Override
    protected void onPostExecute(String result) {
        super.onPostExecute(result);
        try {
            JSONParser.getUserInfo(result);
            msg.what = MessageID.LOGIN_OK;
        } catch (JSONParseException e) {
            msg.what = MessageID.SERVER_RETURN_NULL;
            msg.obj = e.getCode();
        } 
        msg.sendToTarget();
    }

    @Override
    protected void onCancelled() {
        LogUtils.Logi(LogTag.TASK, "LoginTask onCancelled");
        if (httpRequest != null) {
            httpRequest.abort();
            LogUtils.Logi(LogTag.TASK, "http request abort");
        }
        super.onCancelled();
    }
    
    

}
