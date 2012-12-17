package com.lingzhimobile.huodonghaowai.log;

import java.util.HashMap;
import java.util.List;
import java.util.Map.Entry;

import org.apache.http.NameValuePair;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.util.Log;

/*
 * 
 */
public class LogUtils {

	/* enable or disable log */
	private static final boolean enableLog = true;
    public static Object logLock = new Object();

	/* Log.d */
    public static void Logd(String tag, List<? extends NameValuePair> params) {
        if (enableLog) {
            synchronized (logLock) {
                for (NameValuePair tempNameValuePair : params) {
                    LogUtils.Logd(tag, tempNameValuePair.getName() + "\t\t\t"
                            + tempNameValuePair.getValue());
                }
            }
        }
    }

    /* Log.d */
    public static void Logd(String tag,
            HashMap<Integer, List<? extends NameValuePair>> params) {
        if (enableLog) {
            for (Entry<Integer, List<? extends NameValuePair>> entry : params
                    .entrySet()) {
                LogUtils.Logd(tag, entry.getValue());
            }
        }
    }
    /* Log.d */
	public static void Logd(String tag, String msg) {
		if (enableLog)
			Log.d(tag.toString(), msg == null ? "null" : msg);
	}

    /* Log.d */
    public static void Logd(String tag, String msg, Throwable e) {
        if (enableLog)
            Log.d(tag.toString(), msg == null ? "null" : msg, e);
    }

    /* Log.e */
	public static void Loge(String tag, String msg) {
		if (enableLog)
			Log.e(tag.toString(), msg == null ? "null" : msg);
	}

    /* Log.e */
    public static void Loge(String tag, String msg, Throwable e) {
        if (enableLog)
            Log.e(tag.toString(), msg == null ? "null" : msg, e);
    }

    /* Log.i */
	public static void Logi(String tag, String msg) {
		if (enableLog)
			Log.i(tag.toString(), msg == null ? "null" : msg);
	}

	/* Log.v */
	public static void Logv(String tag, String msg) {
		if (enableLog)
			Log.v(tag.toString(), msg == null ? "null" : msg);
	}

	/* Log.w */
	public static void Logw(String tag, String msg) {
		if (enableLog)
			Log.w(tag.toString(), msg == null ? "null" : msg);
	}

    public static void LogdWithIndentSpaces(String tag,
            String msg) {
        if (enableLog)
            try {
                Log.d(tag.toString(), msg == null ? "null" : new JSONObject(msg).toString(5));
            } catch (JSONException e) {
                Log.d(tag.toString(), msg == null ? "null" : msg);
            }
    }

    public static void LogdWithIndentSpaces(String tag,
            JSONObject msg) {
            if (enableLog)
            try {
                Log.d(tag.toString(), msg == null ? "null" : msg.toString(5));
            } catch (JSONException e) {
                Log.d(tag.toString(), msg == null ? "null" : msg.toString());
            }
    }

    public static void LogdMultiple(String tag, String msg) {
        if (enableLog) {
            JSONArray ja;
            try {
                ja = new JSONArray(msg);
                String strJo = "";
                for (int i = 0; i < ja.length(); i++) {
                    strJo = ja.getString(i);
                    LogUtils.LogdWithIndentSpaces(
                            "", strJo);
                }
            } catch (JSONException e) {
            }
        }
    }

}
