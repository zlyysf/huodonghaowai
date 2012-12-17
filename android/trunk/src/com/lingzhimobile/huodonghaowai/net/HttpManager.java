package com.lingzhimobile.huodonghaowai.net;

import java.io.File;
import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.nio.charset.Charset;
import java.security.KeyStore;
import java.util.HashMap;
import java.util.Iterator;

import org.apache.http.Header;
import org.apache.http.HttpResponse;
import org.apache.http.HttpVersion;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.conn.ClientConnectionManager;
import org.apache.http.conn.params.ConnManagerPNames;
import org.apache.http.conn.params.ConnPerRouteBean;
import org.apache.http.conn.scheme.PlainSocketFactory;
import org.apache.http.conn.scheme.Scheme;
import org.apache.http.conn.scheme.SchemeRegistry;
import org.apache.http.conn.ssl.SSLSocketFactory;
import org.apache.http.entity.StringEntity;
import org.apache.http.entity.mime.MultipartEntity;
import org.apache.http.entity.mime.content.FileBody;
import org.apache.http.entity.mime.content.StringBody;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.impl.conn.tsccm.ThreadSafeClientConnManager;
import org.apache.http.params.BasicHttpParams;
import org.apache.http.params.HttpConnectionParams;
import org.apache.http.params.HttpParams;
import org.apache.http.params.HttpProtocolParams;
import org.apache.http.protocol.HTTP;
import org.apache.http.util.EntityUtils;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Intent;
import android.os.Looper;

import com.lingzhimobile.huodonghaowai.activity.MainTabActivity;
import com.lingzhimobile.huodonghaowai.activity.Splash;
import com.lingzhimobile.huodonghaowai.cons.MessageID;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.util.AppInfo;
import com.lingzhimobile.huodonghaowai.util.AppUtil;

public class HttpManager {
    public static int timeoutConnection = 60000;
    private static int timeoutSocket = 60000;

    private static HttpParams httpParameters;
    static {
        httpParameters = new BasicHttpParams();
        HttpConnectionParams.setConnectionTimeout(httpParameters,
                timeoutConnection);
        HttpConnectionParams.setSoTimeout(httpParameters, timeoutSocket);
        httpParameters
                .setParameter(ConnManagerPNames.MAX_TOTAL_CONNECTIONS, 30);
        httpParameters.setParameter(
                ConnManagerPNames.MAX_CONNECTIONS_PER_ROUTE,
                new ConnPerRouteBean(30));
        httpParameters.setParameter(HttpProtocolParams.USE_EXPECT_CONTINUE,
                false);
        HttpProtocolParams.setVersion(httpParameters, HttpVersion.HTTP_1_1);
    }

    public static void cancelRequest(HttpPost httpRequest) {
        httpRequest.abort();
    }

    public static String postAPI(HttpPost httpRequest, String urlStr,
            JSONObject params) {
        String strResult = null;
        if (urlStr == null || params == null) {
            return null;
        }

        LogUtils.LogdWithIndentSpaces(LogTag.HTTPREQUEST, params);
        LogUtils.Logd(LogTag.HTTPREQUEST, AppInfo.getSessionToken());
        if (AppInfo.getSessionToken() == null
                || "".equals(AppInfo.getSessionToken())) {
           try {
            MainTabActivity.instance.myHanlder.obtainMessage(MessageID.LOGOUT_OK).sendToTarget();
        } catch (Exception e) {
            return null;
        }
            
        }
        try {
            httpRequest.setHeader("Content-Type", "application/json");
            httpRequest.setHeader("Cookie",
                    "connect.sid={1}".replace("{1}", AppInfo.sessionToken));
            httpRequest.setEntity(new StringEntity(params.toString(),
                    HTTP.UTF_8));
            HttpResponse httpResponse = getNewHttpClient().execute(httpRequest);
            strResult = EntityUtils.toString(httpResponse.getEntity(),
                    HTTP.UTF_8);
            LogUtils.LogdWithIndentSpaces(LogTag.HTTPREQUEST, strResult);
            return strResult;
        } catch (UnsupportedEncodingException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } catch (ClientProtocolException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
        return strResult;
    }

    public static String postAnonymousAPI(HttpPost httpRequest, String urlStr,
            JSONObject params) {
        String strResult = null;
        if (urlStr == null || params == null) {
            return null;
        }

        LogUtils.LogdWithIndentSpaces(LogTag.HTTPREQUEST, params);

        try {
            httpRequest.setHeader("Content-Type", "application/json");
            httpRequest.setEntity(new StringEntity(params.toString(),
                    HTTP.UTF_8));
            HttpResponse httpResponse = getNewHttpClient().execute(httpRequest);
            strResult = EntityUtils.toString(httpResponse.getEntity(),
                    HTTP.UTF_8);
            LogUtils.LogdWithIndentSpaces(LogTag.HTTPREQUEST, strResult);
            Header[] headers = httpResponse.getHeaders("Set-Cookie");
            String session_token = null;
            for (int i = 0; i < headers.length; i++) {
                if (headers[i].getValue().startsWith("connect.sid")) {
                    session_token = headers[i].getValue().substring(12,
                            headers[i].getValue().indexOf(";"));
                    LogUtils.Logd(LogTag.TASK, " session++: " + headers[i].getValue());
                }
            }
            if (session_token == null || "".equals(session_token)) {
                AppInfo.sessionToken = "";// session_token;
            } else {
                AppInfo.sessionToken = session_token;// session_token;
                LogUtils.Logd(LogTag.TASK, " session: " + AppInfo.sessionToken);
            }
            return strResult;
        } catch (UnsupportedEncodingException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } catch (ClientProtocolException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
        return strResult;
    }

    public static String uploadPhoto(File imgFile, boolean setPrimary,
            String height, String width, HttpPost httpRequest, String urlStr)
            throws Exception {
        String strResult = null;
        if (urlStr == null) {
            return null;
        }

        MultipartEntity reqEntity;
        reqEntity = new MultipartEntity();

        FileBody fileBody = new FileBody(imgFile, "image/jpeg");
        reqEntity.addPart("image", fileBody);
        reqEntity.addPart("userId", new StringBody(AppInfo.userId));
        reqEntity.addPart("height", new StringBody(height));
        reqEntity.addPart("width", new StringBody(width));
        reqEntity.addPart("setPrimary", new StringBody(String.valueOf(setPrimary)));
        if (AppInfo.getSessionToken() == null
                || "".equals(AppInfo.getSessionToken())) {
            Intent intent = new Intent(AppInfo.context, Splash.class);
            AppInfo.context.startActivity(intent);
        }
        try {
            httpRequest.setEntity(reqEntity);
            httpRequest.setHeader("Cookie",
                    "connect.sid={1}".replace("{1}", AppInfo.sessionToken));
            HttpResponse httpResponse = new DefaultHttpClient(httpParameters)
                    .execute(httpRequest);
            strResult = EntityUtils.toString(httpResponse.getEntity(),
                    HTTP.UTF_8);
            LogUtils.LogdWithIndentSpaces(LogTag.HTTPREQUEST, strResult);
            return strResult;
        } catch (UnsupportedEncodingException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } catch (ClientProtocolException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
        return strResult;
    }
    public static String updateProfileWithPhoto(String userId, HashMap<String,String> values,File imgFile, 
            String height, String width, HttpPost httpRequest)
            throws Exception {
        String strResult = null;
        if (httpRequest == null) {
            return null;
        }

        MultipartEntity reqEntity;
        reqEntity = new MultipartEntity();

        FileBody fileBody = new FileBody(imgFile, "image/jpeg");
        reqEntity.addPart("image", fileBody);
        reqEntity.addPart("userId", new StringBody(userId));
        reqEntity.addPart("imgHeight", new StringBody(height));
        reqEntity.addPart("imgWidth", new StringBody(width));
        Iterator<String> keys = values.keySet().iterator();
        while(keys.hasNext()){
            String key = keys.next();
            String value = values.get(key);
            reqEntity.addPart(key, new StringBody(value,Charset.forName(HTTP.UTF_8)));
        }
        if (AppInfo.getSessionToken() == null
                || "".equals(AppInfo.getSessionToken())) {
            Intent intent = new Intent(AppInfo.context, Splash.class);
            AppInfo.context.startActivity(intent);
        }
        try {
            httpRequest.setEntity(reqEntity);
            httpRequest.setHeader("Cookie",
                    "connect.sid={1}".replace("{1}", AppInfo.sessionToken));
            HttpResponse httpResponse = new DefaultHttpClient(httpParameters)
                    .execute(httpRequest);
            strResult = EntityUtils.toString(httpResponse.getEntity(),
                    HTTP.UTF_8);
            LogUtils.LogdWithIndentSpaces(LogTag.HTTPREQUEST, strResult);
            return strResult;
        } catch (UnsupportedEncodingException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } catch (ClientProtocolException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
        return strResult;
    }
    
    public static String createDate(HttpPost httpRequest, String urlStr,MultipartEntity reqEntity)
            throws Exception {
        String strResult = null;
        if (urlStr == null) {
            return null;
        }
       
        if (AppInfo.getSessionToken() == null
                || "".equals(AppInfo.getSessionToken())) {
            Intent intent = new Intent(AppInfo.context, Splash.class);
            AppInfo.context.startActivity(intent);
        }
        try {
            httpRequest.setEntity(reqEntity);
            httpRequest.setHeader("Cookie",
                    "connect.sid={1}".replace("{1}", AppInfo.sessionToken));
            HttpResponse httpResponse = new DefaultHttpClient(httpParameters)
                    .execute(httpRequest);
            strResult = EntityUtils.toString(httpResponse.getEntity(),
                    HTTP.UTF_8);
            LogUtils.LogdWithIndentSpaces(LogTag.HTTPREQUEST, strResult);
            return strResult;
        } catch (UnsupportedEncodingException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } catch (ClientProtocolException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        } catch (IOException e) {
            // TODO Auto-generated catch block
            e.printStackTrace();
        }
        return strResult;
    }

    public static String registerDeviceToken(String userId, String deviceToken) {
        String result = null;
        final String requestURL = NetProtocol.HTTP_REQUEST_URL
                + "user/updateAppToken";
        HttpPost httpRequest = new HttpPost(requestURL);
        JSONObject parameters = new JSONObject();
        try {
            parameters.put("userId", userId);
            parameters.put("appToken", deviceToken);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        result = postAPI(httpRequest, requestURL, parameters);
        return result;
    }

    public static HttpClient getNewHttpClient() {
        try {
            KeyStore trustStore = KeyStore.getInstance(KeyStore
                    .getDefaultType());
            trustStore.load(null, null);

            SSLSocketFactory sf = new SSLSocketFactoryEx(trustStore);
            sf.setHostnameVerifier(SSLSocketFactory.ALLOW_ALL_HOSTNAME_VERIFIER);

            HttpParams params = new BasicHttpParams();
            HttpProtocolParams.setVersion(params, HttpVersion.HTTP_1_1);
            HttpProtocolParams.setContentCharset(params, HTTP.UTF_8);

            SchemeRegistry registry = new SchemeRegistry();
            registry.register(new Scheme("http", PlainSocketFactory
                    .getSocketFactory(), 80));
            registry.register(new Scheme("https", sf, 443));

            ClientConnectionManager ccm = new ThreadSafeClientConnManager(
                    params, registry);

            return new DefaultHttpClient(ccm, params);
        } catch (Exception e) {
            return new DefaultHttpClient();
        }
    }

}
