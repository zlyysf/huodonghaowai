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
import com.lingzhimobile.tongqu.model.UserItem;
import com.lingzhimobile.tongqu.net.HttpManager;
import com.lingzhimobile.tongqu.net.NetProtocol;
import com.lingzhimobile.tongqu.util.JSONParser;

public class GetUserTask extends AsyncTask<Void, Void, String> {
	private String targetUserId;
	private String userId;
	private Message msg;
	HttpPost httpRequest;
	private final String requestURL = NetProtocol.HTTP_REQUEST_URL
			+ "user/getUser";
	
	public GetUserTask(String userId, String targetUserId, Message msg){
		this.msg = msg;
		this.userId = userId;
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
		} catch (JSONException e) {
			e.printStackTrace();
		}
		result = HttpManager.postAPI(httpRequest, requestURL, parameters);
		LogUtils.Logi(LogTag.TASK, "The result of API request: " + result);
		return result;
	}
	

	@Override
	protected void onCancelled() {
	    LogUtils.Logi(LogTag.TASK, "GetUserTask onCancelled");
		if (httpRequest != null) {
			httpRequest.abort();
			LogUtils.Logi(LogTag.TASK, "http request abort");
		}
		super.onCancelled();
	}
	
	@Override
	protected void onPostExecute(String result) {
		super.onPostExecute(result);
		UserItem user = null;
        try {
            user = JSONParser.getUser(result);
        } catch (JSONParseException e) {
            msg.what = MessageID.SERVER_RETURN_NULL;
            msg.obj = e.getCode();
        }
		if(user != null){
			msg.what = MessageID.GET_PROFILE_OK;
			msg.obj = user;
		}
		msg.sendToTarget();
		
	}

}
