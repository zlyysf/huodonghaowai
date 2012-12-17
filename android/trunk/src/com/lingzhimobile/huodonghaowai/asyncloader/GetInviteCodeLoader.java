package com.lingzhimobile.huodonghaowai.asyncloader;

import org.apache.http.client.methods.HttpPost;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.os.Looper;
import android.support.v4.content.AsyncTaskLoader;
import android.util.Log;

import com.lingzhimobile.huodonghaowai.exception.JSONParseException;
import com.lingzhimobile.huodonghaowai.net.HttpManager;
import com.lingzhimobile.huodonghaowai.net.NetProtocol;
import com.lingzhimobile.huodonghaowai.util.AppUtil;
import com.lingzhimobile.huodonghaowai.util.JSONParser;

public class GetInviteCodeLoader extends AsyncTaskLoader<String> {
    String result;
    HttpPost httpRequest;
    String userId;
    private final String requestURL = NetProtocol.HTTP_REQUEST_URL
            + "user/getSentingSMS";
    public GetInviteCodeLoader(Context context) {
        super(context);
    }
    
    public GetInviteCodeLoader(Context context, String userId) {
        super(context);
        this.userId = userId;
    }

    @Override
    public String loadInBackground() {
        Log.e("Loader", "loadInBackground");
        String result = null;
        httpRequest = new HttpPost(requestURL);
        JSONObject parameters = new JSONObject();
        try {
            parameters.put("type", "invite");
            parameters.put("userId", userId);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        result = HttpManager.postAPI(httpRequest, requestURL, parameters);
        String event = null;
        try {
            event = JSONParser.getInviteCode(result);
        } catch (final JSONParseException e) {
            new Thread(new Runnable() {
                
                @Override
                public void run() {
                    Looper.prepare();
                    AppUtil.handleErrorCode(String.valueOf(e.getCode()), getContext());
                    Looper.loop();
                }
            }).start();
            
        }
        return event;
    }

    @Override
    public void reset() {
        super.reset();
    }

    @Override
    protected void onStartLoading() {

        if (result == null) {
            forceLoad();
        }
    }

    @Override
    protected void onStopLoading() {
        cancelLoad();
    }

}
