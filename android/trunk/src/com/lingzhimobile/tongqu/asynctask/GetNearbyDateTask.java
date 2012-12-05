package com.lingzhimobile.tongqu.asynctask;

import java.util.ArrayList;

import org.apache.http.client.methods.HttpPost;
import org.json.JSONException;
import org.json.JSONObject;

import android.os.AsyncTask;
import android.os.Message;

import com.lingzhimobile.tongqu.cons.MessageID;
import com.lingzhimobile.tongqu.exception.JSONParseException;
import com.lingzhimobile.tongqu.log.LogTag;
import com.lingzhimobile.tongqu.log.LogUtils;
import com.lingzhimobile.tongqu.model.DateListItem;
import com.lingzhimobile.tongqu.net.HttpManager;
import com.lingzhimobile.tongqu.net.NetProtocol;
import com.lingzhimobile.tongqu.util.JSONParser;

public class GetNearbyDateTask extends AsyncTask<Void, Void, String> {
    
    private int count;
    private Message msg;
    private int start;
    
    HttpPost httpRequest;
    private final String requestURL = NetProtocol.HTTP_REQUEST_URL
            + "user/getNearbyDates";
    
    public GetNearbyDateTask(int count, int start, Message msg){
        this.count = count;
        this.start = start;
        this.msg = msg;
    }

    @Override
    protected String doInBackground(Void... params) {
        String result = null;
        httpRequest = new HttpPost(requestURL);
        JSONObject parameters = new JSONObject();
        try {
            parameters.put("start", start);
            parameters.put("count", count);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        result = HttpManager.postAnonymousAPI(httpRequest, requestURL,
                parameters);
        LogUtils.Logi(LogTag.TASK, "The result of API request: " + result);
        return result;
    }
    
    @Override
    protected void onPostExecute(String result) {
        super.onPostExecute(result);
        ArrayList<DateListItem> event = null;
        try {
            event = JSONParser.getDateItems(result);
        } catch (JSONParseException e) {
            msg.what = MessageID.SERVER_RETURN_NULL;
            msg.obj = e.getCode();
        }
        if(event != null){
            msg.what = MessageID.GET_NEARBY_DATE_OK;
            msg.obj = event;
        }
        msg.sendToTarget();
    }

    @Override
    protected void onCancelled() {
        LogUtils.Logi(LogTag.TASK, "GetNearbyDatesTask onCancelled");
        if (httpRequest != null) {
            httpRequest.abort();
            LogUtils.Logi(LogTag.TASK, "http request abort");
        }
        super.onCancelled();
    }

}
