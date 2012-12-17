package com.lingzhimobile.huodonghaowai.asynctask;

import java.util.ArrayList;

import org.apache.http.client.methods.HttpPost;
import org.json.JSONException;
import org.json.JSONObject;

import android.os.AsyncTask;
import android.os.Message;

import com.lingzhimobile.huodonghaowai.cons.MessageID;
import com.lingzhimobile.huodonghaowai.exception.JSONParseException;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.model.SubjectItem;
import com.lingzhimobile.huodonghaowai.net.HttpManager;
import com.lingzhimobile.huodonghaowai.net.NetProtocol;
import com.lingzhimobile.huodonghaowai.util.GlobalValue;
import com.lingzhimobile.huodonghaowai.util.JSONParser;

public class GetDateSubjectsTask extends AsyncTask<Void, Void, String> {
    
    String language;
    HttpPost httpRequest;
    Message msg;
    String userId;
    private final String requestURL = NetProtocol.HTTP_REQUEST_URL
            + "user/getActivityTypes";
    
    public GetDateSubjectsTask(String userId, String language,Message msg){
        this.userId = userId;
        this.language = language;
        this.msg = msg;
    }

    @Override
    protected String doInBackground(Void... params) {
        String result = null;
        httpRequest = new HttpPost(requestURL);
        JSONObject parameters = new JSONObject();
        try {
            parameters.put("userId", userId);
            parameters.put("language", language);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        result = HttpManager.postAPI(httpRequest, requestURL, parameters);
        LogUtils.Logi(LogTag.TASK, "The result of API request: " + result);
        return result;
    }

    @Override
    protected void onCancelled() {
        LogUtils.Logi(LogTag.TASK, "GetDateSubjectTask onCancelled");
        if (httpRequest != null) {
            httpRequest.abort();
            LogUtils.Logi(LogTag.TASK, "http request abort");
        }
        super.onCancelled();
    }

    @Override
    protected void onPostExecute(String result) {
        super.onPostExecute(result);
        ArrayList<SubjectItem> event = null;
        try {
            event = JSONParser.getDateSubjects(result);
        } catch (JSONParseException e) {
            msg.what = MessageID.SERVER_RETURN_NULL;
            msg.obj = e.getCode();
        }
        if (event != null) {
            msg.what = MessageID.GET_DATE_SUBJECT_OK;
            GlobalValue.dateTitleList.clear();
            GlobalValue.dateTitleList.addAll(event);
        }
        msg.sendToTarget();
    }
}
