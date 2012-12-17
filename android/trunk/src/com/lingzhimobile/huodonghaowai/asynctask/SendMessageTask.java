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
import com.lingzhimobile.huodonghaowai.net.HttpManager;
import com.lingzhimobile.huodonghaowai.net.NetProtocol;
import com.lingzhimobile.huodonghaowai.util.JSONParser;

public class SendMessageTask extends AsyncTask<Void, Void, String> {
	HttpPost httpRequest;
	Message msg;
	private final String requestURL = NetProtocol.HTTP_REQUEST_URL
			+ "user/sendMessage";
	private String messageText;
	private String dateId;
	private String targetUserId;
	private int itemIndex;
	private String userId;
	
	public SendMessageTask(String userId, String messageText, String dateId, String targetUserId, int itemIndex, Message msg){
		this.messageText = messageText;
		this.dateId = dateId;
		this.targetUserId = targetUserId;
		this.itemIndex = itemIndex;
		this.userId = userId;
		this.msg = msg;
	}

	@Override
	protected String doInBackground(Void... params) {
		String result = null;
		httpRequest = new HttpPost(requestURL);
		JSONObject parameters = new JSONObject();
		try {
		    parameters.put("userId", userId);
			parameters.put("messageText", messageText);
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
	    LogUtils.Logi(LogTag.TASK, "SendMessageTask onCancelled");
		if (httpRequest != null) {
			httpRequest.abort();
			LogUtils.Logi(LogTag.TASK, "http request abort");
		}
		super.onCancelled();
	}
	
	@Override
	protected void onPostExecute(String result) {
		super.onPostExecute(result);
		ArrayList<String> al = null;
        try {
            al = (ArrayList<String>) JSONParser.getSendMessageResult(result);
        } catch (JSONParseException e) {
            msg.what = MessageID.SERVER_RETURN_NULL;
            msg.obj = e.getCode();
        }
		if(al != null && al.size() >1){
			msg.what = MessageID.SEND_MESSAGE_OK;
			msg.arg1 = itemIndex;
			msg.obj = al;
		}
		msg.sendToTarget();
	}

}
