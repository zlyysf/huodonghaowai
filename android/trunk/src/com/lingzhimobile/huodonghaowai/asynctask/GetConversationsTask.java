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
import com.lingzhimobile.huodonghaowai.model.ConversationItem;
import com.lingzhimobile.huodonghaowai.net.HttpManager;
import com.lingzhimobile.huodonghaowai.net.NetProtocol;
import com.lingzhimobile.huodonghaowai.util.GlobalValue;
import com.lingzhimobile.huodonghaowai.util.JSONParser;

public class GetConversationsTask extends AsyncTask<Void, Void, String> {
    HttpPost httpRequest;
    Message msg;
    private final String requestURL = NetProtocol.HTTP_REQUEST_URL
            + "user/getDateConversations";
    private long cutOffTime;
    private int count;
    private String loadType;
    
    public GetConversationsTask(long cutOffTime, int count, String loadType, Message msg){
        this.cutOffTime = cutOffTime;
        this.count = count;
        this.loadType = loadType;
        this.msg = msg;
    }

    @Override
    protected String doInBackground(Void... params) {
        String result = null;
        httpRequest = new HttpPost(requestURL);
        JSONObject parameters = new JSONObject();
        try {
            if (cutOffTime != -1) {
                parameters.put("cutOffTime", cutOffTime);
            }
            parameters.put("count", count);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        result = HttpManager.postAPI(httpRequest, requestURL, parameters);
        LogUtils.Logi(LogTag.TASK, "The result of API request: " + result);
        return result;
    }
    
    @Override
    protected void onCancelled() {
        LogUtils.Logi(LogTag.TASK, "GetDatesTask onCancelled");
        if (httpRequest != null) {
            httpRequest.abort();
            LogUtils.Logi(LogTag.TASK, "http request abort");
        }
        super.onCancelled();
    }

    @Override
    protected void onPostExecute(String result) {
        super.onPostExecute(result);
        ArrayList<ConversationItem> conversations = null;
        try {
            conversations = JSONParser.getConversations(result);
        } catch (JSONParseException e) {
            msg.what = MessageID.SERVER_RETURN_NULL;
            msg.obj = e.getCode();
        }
        if(conversations != null){
            if("refresh".equals(loadType)){
                GlobalValue.conversationList.clear();
            }
            GlobalValue.conversationList.addAll(conversations);
            msg.what = MessageID.GET_CONVERSATIONS_OK;
            msg.getData().putString("loadType", loadType);
        }
        msg.sendToTarget();
    }

}
