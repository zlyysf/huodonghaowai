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
import com.lingzhimobile.tongqu.model.MessageItem;
import com.lingzhimobile.tongqu.net.HttpManager;
import com.lingzhimobile.tongqu.net.NetProtocol;
import com.lingzhimobile.tongqu.util.JSONParser;

public class ConfirmDateTask extends AsyncTask<Void, Void, String> {
	HttpPost httpRequest;
	Message msg;
	private final String requestURL = NetProtocol.HTTP_REQUEST_URL
			+ "user/confirmDate";
	private String dateId;
	private boolean beCancel;
	private String targetUserId;
	private String userId;
	
	public ConfirmDateTask(String userId, String dateId, String targetUserId, boolean beCancel, Message msg){
	    this.userId = userId;
		this.dateId = dateId;
		this.beCancel = beCancel;
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
			parameters.put("dateId", dateId);
			parameters.put("beCancel", beCancel);
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
	    LogUtils.Logi(LogTag.TASK, "ConfirmDateTask onCancelled");
		if (httpRequest != null) {
			httpRequest.abort();
			LogUtils.Logi(LogTag.TASK, "http request abort");
		}
		super.onCancelled();
	}
	
	@Override
	protected void onPostExecute(String result) {
		super.onPostExecute(result);
		MessageItem messageItem = null;
        try {
            messageItem = JSONParser.getConfirmDateResult(result);
        } catch (JSONParseException e) {
            msg.what = MessageID.SERVER_RETURN_NULL;
            msg.obj = e.getCode();
        }
		if(messageItem != null){
			msg.what = MessageID.CONFIRM_DATE_OK;
			msg.obj = beCancel;
		}
		msg.sendToTarget();
	}


}
