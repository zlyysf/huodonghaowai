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
import com.lingzhimobile.huodonghaowai.util.JSONParser;

public class UnbindRenRenAccountTask extends AsyncTask<Void, Void, String> {
    private final String userId;
    private final Message msg;
    HttpPost httpRequest;
    private final String requestURL = NetProtocol.HTTP_REQUEST_URL
            + "user/unbindRenRenAccount";

    public UnbindRenRenAccountTask(String userId, Message msg){
        this.msg = msg;
        this.userId = userId;
    }

    @Override
    protected String doInBackground(Void... params) {
        String result = null;
        httpRequest = new HttpPost(requestURL);
        JSONObject parameters = new JSONObject();
        try {
            parameters.put("userId", userId);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        result = HttpManager.postAPI(httpRequest, requestURL, parameters);
        LogUtils.Logi(LogTag.TASK, "The result of API request: " + result);
        return result;
    }

    @Override
    protected void onPostExecute(String result) {
        super.onPostExecute(result);
        try {
            JSONParser.checkSucceed(result);
            msg.what = MessageID.UnbindRenRenAccount_OK;
        } catch (JSONParseException e) {
            msg.what = MessageID.UnbindRenRenAccount_FAIL;
            msg.obj = e.getCode();
        }
        msg.sendToTarget();
    }

    @Override
    protected void onCancelled() {
        LogUtils.Logi(LogTag.TASK, "UnbindRenRenAccountTask onCancelled");
        if (httpRequest != null) {
            httpRequest.abort();
            LogUtils.Logi(LogTag.TASK, "http request abort");
        }
        super.onCancelled();
    }


}
