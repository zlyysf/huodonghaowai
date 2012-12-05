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
import com.lingzhimobile.tongqu.model.PhotoItem;
import com.lingzhimobile.tongqu.net.HttpManager;
import com.lingzhimobile.tongqu.net.NetProtocol;
import com.lingzhimobile.tongqu.util.JSONParser;

public class GetPhotosTask extends AsyncTask<Void, Void, String> {
	private String userId;
	private String targetUserId;
	private long cutOffTime;
	private int count;
	private Message msg;
	HttpPost httpRequest;
	private final String requestURL = NetProtocol.HTTP_REQUEST_URL
			+ "user/getPhotos";
	
	public GetPhotosTask(String userId, String targetUserId, long cutOffTime, int count, Message msg){
		this.msg = msg;
		this.userId = userId;
		this.cutOffTime = cutOffTime;
		this.count = count;
		this.targetUserId = targetUserId;
	}

	@Override
	protected String doInBackground(Void... params) {
		String result = null;
		httpRequest = new HttpPost(requestURL);
		JSONObject parameters = new JSONObject();
		try {
			parameters.put("userId", userId);
			parameters.put("targetUserId", targetUserId);
			parameters.put("cutOffTime", cutOffTime);
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
	    LogUtils.Logi(LogTag.TASK, "GetPhotosTask onCancelled");
		if (httpRequest != null) {
			httpRequest.abort();
			LogUtils.Logi(LogTag.TASK, "http request abort");
		}
		super.onCancelled();
	}
	
	@Override
    protected void onPostExecute(String result) {
        super.onPostExecute(result);
        ArrayList<PhotoItem> photos = null;
        try {
            photos = JSONParser.getPhotos(result);
        } catch (JSONParseException e) {
            msg.what = MessageID.SERVER_RETURN_NULL;
            msg.obj = e.getCode();
        }
        if(photos != null){
            msg.what = MessageID.GET_PHOTOS_OK;
            msg.obj = photos;
        }
        msg.sendToTarget();
        
    }


}
