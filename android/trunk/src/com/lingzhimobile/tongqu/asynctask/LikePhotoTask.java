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

public class LikePhotoTask extends AsyncTask<Void, Void, String> {
	private String userId;
	private String photoId;
	private String type;
	private Message msg;
	HttpPost httpRequest;
	private final String requestURL = NetProtocol.HTTP_REQUEST_URL
			+ "user/likePhoto";
	
	public LikePhotoTask(String userId, String photoId, String type, Message msg){
		this.msg = msg;
		this.userId = userId;
		this.type = type;
		this.photoId = photoId;
	}

	@Override
	protected String doInBackground(Void... params) {
		String result = null;
		httpRequest = new HttpPost(requestURL);
		JSONObject parameters = new JSONObject();
		try {
			parameters.put("userId", userId);
			parameters.put("photoId", photoId);
			parameters.put("type", type);
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
            msg.what = MessageID.PHOTO_OPERATE_OK;
        } catch (JSONParseException e) {
            msg.what = MessageID.PHOTO_OPERATE_FAIL;
            msg.obj = e.getCode();
        }
		msg.sendToTarget();
		
	}

	@Override
	protected void onCancelled() {
	    LogUtils.Logi(LogTag.TASK, "LikePhotoTask onCancelled");
		if (httpRequest != null) {
			httpRequest.abort();
			LogUtils.Logi(LogTag.TASK, "http request abort");
		}
		super.onCancelled();
	}
	

}
