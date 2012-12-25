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
import com.lingzhimobile.huodonghaowai.model.DateListItem;
import com.lingzhimobile.huodonghaowai.net.HttpManager;
import com.lingzhimobile.huodonghaowai.net.NetProtocol;
import com.lingzhimobile.huodonghaowai.util.JSONParser;

public class GetNearbyDateTask extends AsyncTask<Void, Void, String> {

    private final int count;
    private final Message msg;
    private final int start;

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
            //e.printStackTrace();
        	LogUtils.Loge(LogTag.TASK, e.getMessage(), e);
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
