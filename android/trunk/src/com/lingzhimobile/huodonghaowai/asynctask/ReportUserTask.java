package com.lingzhimobile.huodonghaowai.asynctask;

import org.apache.http.client.methods.HttpPost;
import org.json.JSONException;
import org.json.JSONObject;

import android.os.AsyncTask;
import android.os.Message;
import android.text.TextUtils;

import com.lingzhimobile.huodonghaowai.cons.MessageID;
import com.lingzhimobile.huodonghaowai.exception.JSONParseException;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.net.HttpManager;
import com.lingzhimobile.huodonghaowai.net.NetProtocol;
import com.lingzhimobile.huodonghaowai.util.JSONParser;

public class ReportUserTask extends AsyncTask<Void, Void, String> {
	HttpPost httpRequest;
	Message msg;

	private final String requestPath = "user/reportUser";
	private final String requestURL = NetProtocol.HTTP_REQUEST_URL + requestPath;
	private final String messageText;
	private final String targetUserId;
	private final String userId;
	private final String localLogTag = LogTag.TASK + requestPath;

	public ReportUserTask(String userId, String messageText, String targetUserId, Message msg){
		this.messageText = messageText;
		this.targetUserId = targetUserId;
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
			parameters.put("description", messageText);
			parameters.put("targetUserId", targetUserId);
		} catch (JSONException e) {
			e.printStackTrace();
		}
		result = HttpManager.postAPI(httpRequest, requestURL, parameters);
		LogUtils.Logi(localLogTag, "The result of API request: " + result);
		return result;
	}

	@Override
	protected void onCancelled() {
	    LogUtils.Logi(localLogTag, "SendMessageTask onCancelled");
		if (httpRequest != null) {
			httpRequest.abort();
			LogUtils.Logi(localLogTag, "http request abort");
		}
		super.onCancelled();
	}

	@Override
	protected void onPostExecute(String result) {
		super.onPostExecute(result);
		String s = null;
        try {
            s = JSONParser.getReportUserResult(result);
        } catch (JSONParseException e) {
            msg.what = MessageID.SERVER_RETURN_NULL;
            msg.obj = e.getCode();
        }
        if (!TextUtils.isEmpty(s)){
			msg.what = MessageID.SEND_MESSAGE_OK;
			msg.obj = s;
		}
		msg.sendToTarget();
	}

}
