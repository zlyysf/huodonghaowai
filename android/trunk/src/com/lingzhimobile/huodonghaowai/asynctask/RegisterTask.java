package com.lingzhimobile.huodonghaowai.asynctask;

import org.apache.http.client.methods.HttpPost;
import org.json.JSONException;
import org.json.JSONObject;

import android.os.AsyncTask;
import android.os.Message;
import android.text.TextUtils;

import com.lingzhimobile.huodonghaowai.cons.MessageID;
import com.lingzhimobile.huodonghaowai.exception.JSONParseException;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.net.HttpManager;
import com.lingzhimobile.huodonghaowai.net.NetProtocol;
import com.lingzhimobile.huodonghaowai.util.AppInfo;
import com.lingzhimobile.huodonghaowai.util.AppUtil;
import com.lingzhimobile.huodonghaowai.util.JSONParser;

public class RegisterTask extends AsyncTask<Void, Void, String> {
    HttpPost httpRequest;
    private final String requestURL = NetProtocol.HTTPS_REQUEST_URL
            + "user/register";
    private final String email, password,name,gender,school,hometown,accountRenRen;
    private final JSONObject renrenAuthObj;
    private final Message msg;

    public RegisterTask(String email, String password, String name, String school, String gender, String hometown,
    		String accountRenRen, JSONObject renrenAuthObj,  Message msg){
        this.email = email;
        this.password = password;
        this.name = name;
        this.school = school;
        this.gender = gender;
        this.hometown = hometown;
        this.msg = msg;
        this.accountRenRen = accountRenRen;
        this.renrenAuthObj = renrenAuthObj;
    }

    @Override
    protected String doInBackground(Void... params) {
        String result = null;
        httpRequest = new HttpPost(requestURL);
        JSONObject parameters = new JSONObject();
        try {
            parameters.put("emailAccount", email);
            parameters.put("password", password);
            parameters.put("name", name);
            parameters.put("gender", gender);
            parameters.put("school", school);
            parameters.put("hometown", hometown);
            parameters.put("deviceType", "android");
            parameters.put("deviceId", AppInfo.getDeviceId());
            if (!TextUtils.isEmpty(accountRenRen)){
                parameters.put("accountRenRen", accountRenRen);
            }
            if (renrenAuthObj!=null){
                parameters.put("renrenAuthObj", renrenAuthObj);
            }
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
            JSONObject resJsonObject = JSONParser.checkSucceed(result);
            String userId = resJsonObject.getJSONObject("result").optString("userId");
            AppInfo.userId = userId;
            msg.what = MessageID.REGISTER_OK;
            msg.obj = userId;
        } catch (JSONParseException e) {
            msg.what = MessageID.SERVER_RETURN_NULL;
            msg.obj = e.getCode();
        } catch (JSONException e) {
            msg.what = MessageID.SERVER_RETURN_NULL;
            msg.obj = AppUtil.getJSONParseExceptionError();
        }
        msg.sendToTarget();

    }

    @Override
    protected void onCancelled() {
        LogUtils.Logi(LogTag.TASK, "RegisterTask onCancelled");
        if (httpRequest != null) {
            httpRequest.abort();
            LogUtils.Logi(LogTag.TASK, "http request abort");
        }
        super.onCancelled();
    }

}
