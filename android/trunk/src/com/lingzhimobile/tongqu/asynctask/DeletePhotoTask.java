package com.lingzhimobile.tongqu.asynctask;

import org.apache.http.client.methods.HttpPost;
import org.json.JSONException;
import org.json.JSONObject;

import android.os.AsyncTask;
import android.os.Message;
import android.view.View;

import com.lingzhimobile.tongqu.cons.MessageID;
import com.lingzhimobile.tongqu.exception.JSONParseException;
import com.lingzhimobile.tongqu.log.LogTag;
import com.lingzhimobile.tongqu.log.LogUtils;
import com.lingzhimobile.tongqu.net.HttpManager;
import com.lingzhimobile.tongqu.net.NetProtocol;
import com.lingzhimobile.tongqu.util.JSONParser;

public class DeletePhotoTask extends AsyncTask<Void, Void, String> {
	HttpPost httpRequest;
	Message msg;
	private final String requestURL = NetProtocol.HTTP_REQUEST_URL
			+ "user/deletePhoto";
	private String userId;
	private String photoId;
	private int index;
	private View photoView;
	
	public DeletePhotoTask(String userId, String photoId, View photoView,int index, Message msg){
		this.userId = userId;
		this.photoId = photoId;
		this.photoView = photoView;
		this.index = index;
		this.msg = msg;
	}

	@Override
	protected String doInBackground(Void... params) {
		String result = null;
		httpRequest = new HttpPost(requestURL);
		JSONObject parameters = new JSONObject();
		try {
			parameters.put("userId", userId);
			parameters.put("photoId", photoId);
		} catch (JSONException e) {
			e.printStackTrace();
		}
		result = HttpManager.postAPI(httpRequest, requestURL, parameters);
		LogUtils.Logi(LogTag.TASK, "The result of API request: " + result);
		return result;
	}
	
	@Override
	protected void onCancelled() {
	    LogUtils.Logi(LogTag.TASK, "DeletePhotoTask onCancelled");
		if (httpRequest != null) {
			httpRequest.abort();
			LogUtils.Logi(LogTag.TASK, "http request abort");
		}
		super.onCancelled();
	}
	
	@Override
	protected void onPostExecute(String result) {
		super.onPostExecute(result);
		try {
            JSONParser.checkSucceed(result);
            msg.what = MessageID.DELETE_PHOTO_OK;
            msg.arg1 = index;
            msg.obj = photoView;
        } catch (JSONParseException e) {
            msg.what = MessageID.SERVER_RETURN_NULL;
            msg.obj = e.getCode();
        }
			
		msg.sendToTarget();
	}
	

}
