package com.lingzhimobile.huodonghaowai.asyncloader;

import java.util.ArrayList;
import java.util.List;

import org.apache.http.client.methods.HttpPost;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.os.Looper;
import android.support.v4.content.AsyncTaskLoader;

import com.lingzhimobile.huodonghaowai.exception.JSONParseException;
import com.lingzhimobile.huodonghaowai.model.DateListItem;
import com.lingzhimobile.huodonghaowai.net.HttpManager;
import com.lingzhimobile.huodonghaowai.net.NetProtocol;
import com.lingzhimobile.huodonghaowai.util.AppUtil;
import com.lingzhimobile.huodonghaowai.util.JSONParser;

public class GetDateLoader extends AsyncTaskLoader<List<DateListItem>> {
    private List<DateListItem> dateListItems;
    private int count;
    private long cutOffTime;
    private String type;
    private String userId;
    HttpPost httpRequest;
    private final String requestURL = NetProtocol.HTTP_REQUEST_URL
            + "user/getDates";

    public GetDateLoader(Context context) {
        super(context);
    }

    public GetDateLoader(Context context, String userId, long cutOffTime,
            int count, String type) {
        super(context);
        this.userId = userId;
        this.count = count;
        this.type = type;
        this.cutOffTime = cutOffTime;
    }

    @Override
    public List<DateListItem> loadInBackground() {
        String result = null;
        httpRequest = new HttpPost(requestURL);
        JSONObject parameters = new JSONObject();
        try {
            if (cutOffTime != 0) {
                parameters.put("cutOffTime", cutOffTime);
            }
            parameters.put("type", type);
            parameters.put("userId", userId);
            parameters.put("count", count);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        result = HttpManager.postAPI(httpRequest, requestURL, parameters);
        ArrayList<DateListItem> event = null;
        try {
            event = JSONParser.getDateItems(result);
        } catch (final JSONParseException e) {
            new Thread(new Runnable() {

                @Override
                public void run() {
                    Looper.prepare();
                    AppUtil.handleErrorCode(String.valueOf(e.getCode()),
                            getContext());
                    Looper.loop();
                }
            }).start();
        }
        return event;
    }

    @Override
    public void deliverResult(List<DateListItem> data) {
        if (isReset()) {
            // An async query came in while the loader is stopped. We
            // don't need the result.
            if (data != null) {
                onReleaseResources(data);
            }
        }
        List<DateListItem> olddata = data;
        dateListItems = data;

        if (isStarted()) {
            // If the Loader is currently started, we can immediately
            // deliver its results.
            super.deliverResult(data);
        }

        // At this point we can release the resources associated with
        // 'oldApps' if needed; now that the new result is delivered we
        // know that it is no longer in use.
        if (olddata != null) {
            onReleaseResources(olddata);
        }
    }

    @Override
    public void reset() {
        // TODO Auto-generated method stub
        super.reset();
    }

    /**
     * Handles a request to start the Loader.
     */
    @Override
    protected void onStartLoading() {
        if (dateListItems != null) {
            // If we currently have a result available, deliver it
            // immediately.
            deliverResult(dateListItems);
        }

        if (dateListItems == null) {
            // If the data has changed since the last time it was loaded
            // or is not currently available, start a load.
            forceLoad();
        }
    }

    /**
     * Handles a request to stop the Loader.
     */
    @Override
    protected void onStopLoading() {
        // Attempt to cancel the current load task if possible.
        cancelLoad();
    }

    /**
     * Handles a request to cancel a load.
     */
    @Override
    public void onCanceled(List<DateListItem> data) {
        super.onCanceled(data);

        // At this point we can release the resources associated with 'apps'
        // if needed.
        onReleaseResources(data);
    }

    /**
     * Handles a request to completely reset the Loader.
     */
    @Override
    protected void onReset() {
        super.onReset();

        // Ensure the loader is stopped
        onStopLoading();

        if (dateListItems != null) {
            onReleaseResources(dateListItems);
            dateListItems = null;
        }

    }

    /**
     * Helper function to take care of releasing resources associated with an
     * actively loaded data set.
     */
    protected void onReleaseResources(List<DateListItem> apps) {
        // For a simple List<> there is nothing to do. For something
        // like a Cursor, we would close it here.
        apps = null;
    }

}
