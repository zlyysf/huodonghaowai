package com.lingzhimobile.tongqu.asynctask;

import java.util.HashMap;

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

public class SignInTask extends AsyncTask<Void, Void, String> {
	private String userId;
	private Message msg;
	HttpPost httpRequest;
	private final String requestURL = NetProtocol.HTTP_REQUEST_URL
			+ "user/signIn";
	
	public SignInTask(String userId, Message msg){
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
		} catch (JSONException e) {
			e.printStackTrace();
		}
		result = HttpManager.postAPI(httpRequest, requestURL, parameters);
		LogUtils.Logi(LogTag.TASK, "The result of API request: " + result);
		return result;
	}
	
	@Override
	protected void onCancelled() {
	    LogUtils.Logi(LogTag.TASK, "SignInTask onCancelled");
		if (httpRequest != null) {
			httpRequest.abort();
			LogUtils.Logi(LogTag.TASK, "http request abort");
		}
		super.onCancelled();
	}

	@Override
	protected void onPostExecute(String result) {
		super.onPostExecute(result);
		HashMap<String, Integer> redit = null;
        try {
            redit = JSONParser.getCreditDelta(result);
        } catch (JSONParseException e) {
            msg.what = MessageID.SERVER_RETURN_NULL;
            msg.obj = e.getCode();
        }
		if(redit != null && redit.size() > 0){
			msg.what = MessageID.SIGN_IN_OK;
			msg.obj = redit;
		}
		msg.sendToTarget();
	}

}
