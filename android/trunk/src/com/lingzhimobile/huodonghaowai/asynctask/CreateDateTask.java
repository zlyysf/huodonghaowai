package com.lingzhimobile.huodonghaowai.asynctask;

import java.io.File;
import java.io.UnsupportedEncodingException;
import java.nio.charset.Charset;

import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.mime.MultipartEntity;
import org.apache.http.entity.mime.content.FileBody;
import org.apache.http.entity.mime.content.StringBody;

import android.os.AsyncTask;
import android.os.Message;

import com.lingzhimobile.huodonghaowai.cons.MessageID;
import com.lingzhimobile.huodonghaowai.exception.JSONParseException;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.net.HttpManager;
import com.lingzhimobile.huodonghaowai.net.NetProtocol;
import com.lingzhimobile.huodonghaowai.util.JSONParser;

public class CreateDateTask extends AsyncTask<Void, Void, String> {
	HttpPost httpRequest;
	Message msg;
	private final String requestURL = NetProtocol.HTTP_REQUEST_URL
			+ "user/createDateWithPhoto";
	private long dateDate;
	private String title;
	private int whoPay;
	private int wantPersonCount;
	private int existPersonCount;
	private String address;
	private String description;
	private File imgFile;
	private int width;
	private int height;
	private String userId;

	public CreateDateTask(String userId, long dateDate,
			 String title, String address, int whoPay, int wantPersonCount, int existPersonCount,
			String description, File imgFile, int width,int height,Message msg) {
	    this.userId = userId;
		this.dateDate = dateDate;
		this.title = title;
		this.whoPay = whoPay;
		this.wantPersonCount = wantPersonCount;
		this.existPersonCount = existPersonCount;
		this.address = address;
		this.description = description;
		this.imgFile = imgFile;
		this.width = width;
		this.height = height;
		this.msg = msg;
	}

	@Override
	protected String doInBackground(Void... params) {
		String result = null;
		httpRequest = new HttpPost(requestURL);
		 MultipartEntity reqEntity;
	        reqEntity = new MultipartEntity();

	        
		try {
		    if (imgFile != null) {
                FileBody fileBody = new FileBody(imgFile, "image/jpeg");
                reqEntity.addPart("image", fileBody);
                reqEntity.addPart("height", new StringBody(String.valueOf(height)));
                reqEntity.addPart("width", new StringBody(String.valueOf(width)));
            }
		    reqEntity.addPart("userId", new StringBody(userId));
            reqEntity.addPart("dateDate", new StringBody(String.valueOf(dateDate)));
            reqEntity.addPart("whoPay", new StringBody(String.valueOf(whoPay)));
            reqEntity.addPart("wantPersonCount", new StringBody(String.valueOf(wantPersonCount)));
            reqEntity.addPart("existPersonCount", new StringBody(String.valueOf(existPersonCount)));
            reqEntity.addPart("address", new StringBody(address,Charset.forName("utf-8")));
            reqEntity.addPart("title", new StringBody(title,Charset.forName("utf-8")));
            reqEntity.addPart("description", new StringBody(description,Charset.forName("utf-8")));
            result = HttpManager.createDate(httpRequest, requestURL, reqEntity);
		}catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        } catch (Exception e) {
            e.printStackTrace();
        }
		LogUtils.Logi(LogTag.TASK, "The result of API request: " + result);
		return result;
	}

	@Override
	protected void onCancelled() {
	    LogUtils.Logi(LogTag.TASK, "CreateDateTask onCancelled");
		if (httpRequest != null) {
			httpRequest.abort();
			LogUtils.Logi(LogTag.TASK, "http request abort");
		}
		super.onCancelled();
	}

	@Override
	protected void onPostExecute(String result) {
		super.onPostExecute(result);
		String dateId = null;
        try {
            dateId = JSONParser.getCreateDateResult(result);
        } catch (JSONParseException e) {
            msg.what = MessageID.SERVER_RETURN_NULL;
            msg.obj = e.getCode();
        }
		if (dateId != null) {
			msg.what = MessageID.CREATE_DATE_OK;
			msg.obj = dateId;
		}
		msg.sendToTarget();
	}

}
