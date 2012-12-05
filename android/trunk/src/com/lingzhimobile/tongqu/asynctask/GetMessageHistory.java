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
import com.lingzhimobile.tongqu.model.MessageItem;
import com.lingzhimobile.tongqu.net.HttpManager;
import com.lingzhimobile.tongqu.net.NetProtocol;
import com.lingzhimobile.tongqu.util.JSONParser;

public class GetMessageHistory extends AsyncTask<Void, Void, String> {
	HttpPost httpRequest;
	Message msg;
	private final String requestURL = NetProtocol.HTTP_REQUEST_URL
			+ "user/getMessageHistory";
	private String userId;
	private long cutOffTime;
	private int count;
	private String dateId;
	private String targetUserId;
	
	public GetMessageHistory(String userId, long cutOffTime, int count, String dateId, String targetUserId, Message msg){
		this.userId = userId;
		this.cutOffTime = cutOffTime;
		this.count = count;
		this.dateId = dateId;
		this.targetUserId = targetUserId;
		this.msg = msg;
	}

	@Override
	protected String doInBackground(Void... params) {
		String result = null;
		httpRequest = new HttpPost(requestURL);
		JSONObject parameters = new JSONObject();
		try {
			parameters.put("userId", userId);
			if (cutOffTime>0){
			    parameters.put("cutOffTime", cutOffTime);
			}
			parameters.put("count", count);
			parameters.put("dateId", dateId);
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
	    LogUtils.Logi(LogTag.TASK, "GetMessageHistory onCancelled");
		if (httpRequest != null) {
			httpRequest.abort();
			LogUtils.Logi(LogTag.TASK, "http request abort");
		}
		super.onCancelled();
	}

	@Override
	protected void onPostExecute(String result) {
		super.onPostExecute(result);
		ArrayList<MessageItem> messages = null;
        try {
            messages = JSONParser.getHistoryMessage(result);
        } catch (JSONParseException e) {
            msg.what = MessageID.SERVER_RETURN_NULL;
            msg.obj = e.getCode();
        }
		if(messages != null){
			msg.what = MessageID.GET_HISTORY_MESSAGES_OK;
			msg.obj = messages;
		}else{
		    msg.what = MessageID.SERVER_RETURN_NULL;
		    msg.obj="";
		}
		msg.sendToTarget();
	}
	
	

}
