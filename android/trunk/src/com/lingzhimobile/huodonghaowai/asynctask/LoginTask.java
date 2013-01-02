package com.lingzhimobile.huodonghaowai.asynctask;

import org.apache.http.client.methods.HttpPost;
import org.json.JSONException;
import org.json.JSONObject;

import android.os.AsyncTask;
import android.os.Message;

import com.lingzhimobile.huodonghaowai.cons.MessageID;
import com.lingzhimobile.huodonghaowai.exception.JSONParseException;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.net.HttpManager;
import com.lingzhimobile.huodonghaowai.net.NetProtocol;
import com.lingzhimobile.huodonghaowai.util.AppInfo;
import com.lingzhimobile.huodonghaowai.util.JSONParser;

public class LoginTask extends AsyncTask<Void, Void, String> {
    HttpPost httpRequest;
    private static final String LocalLogTag = LogTag.TASK + " LoginTask";
    private final String requestURL = NetProtocol.HTTPS_REQUEST_URL
            + "user/logIn";
    private final String email, password;
    private final Message msg;

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
        JSONObject jsonResult = JSONParser.getJsonObject(result);
        if (jsonResult == null){
            msg.what = MessageID.LOGIN_Fail;
            msg.obj = null;
        }else{
            boolean isSucceed = JSONParser.checkServerApiSucceed(jsonResult);
            if (isSucceed){
                msg.what = MessageID.LOGIN_OK;
                msg.obj = jsonResult;
                AppInfo.clearUserInfo();
                JSONParser.saveLoginInfo(jsonResult);
            }else{
                msg.what = MessageID.LOGIN_Fail;
                int errCode = jsonResult.optInt("code");//TODO refractor to make code as string
                String errMsg = jsonResult.optString("message");
                msg.obj = errCode;
                LogUtils.Loge(LocalLogTag, errMsg);
            }
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
