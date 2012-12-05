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
import com.lingzhimobile.tongqu.util.JSONParser;

public class RateUserTask extends AsyncTask<Void, Void, String> {
    
    HttpPost httpRequest;
    Message msg;
    String dateId;
    String targetUserId;
    String type;
    String userId;
    private final String requestURL = NetProtocol.HTTP_REQUEST_URL
            + "user/rate";

    public RateUserTask(String userId, String dateId, String targetUserId, String type, Message msg) {
        this.userId = userId;
        this.dateId = dateId;
        this.targetUserId = targetUserId;
        this.type = type;
        this.msg = msg;
    }

    @Override
    protected String doInBackground(Void... params) {
        String result = null;
        httpRequest = new HttpPost(requestURL);
        JSONObject parameters = new JSONObject();
        try {
            parameters.put("userId", userId);
            parameters.put("dateId", dateId);
            parameters.put("targetUserId", targetUserId);
            parameters.put("type", type);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        result = HttpManager.postAPI(httpRequest, requestURL, parameters);
        LogUtils.Logi(LogTag.TASK, "The result of API request: " + result);
        return result;
    }

    @Override
    protected void onCancelled() {
        LogUtils.Logi(LogTag.TASK, "RateUserTask onCancelled");
        if (httpRequest != null) {
            httpRequest.abort();
            LogUtils.Logi(LogTag.TASK, "http request abort");
        }
        super.onCancelled();
    }

    @Override
    protected void onPostExecute(String result) {
        super.onPostExecute(result);
        int targetUserGoodRateCount;
        try {
            targetUserGoodRateCount = JSONParser.getRateResult(result);
            msg.what = MessageID.RATE_USER_OK;
            msg.obj = targetUserGoodRateCount;
        } catch (JSONParseException e) {
            msg.what = MessageID.SERVER_RETURN_NULL;
            msg.obj = e.getCode();
        }
        msg.sendToTarget();
    }

}
