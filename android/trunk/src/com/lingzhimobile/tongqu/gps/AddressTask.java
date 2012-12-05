package com.lingzhimobile.tongqu.gps;

import org.apache.http.HttpHost;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.conn.params.ConnRouteParams;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.params.HttpConnectionParams;

import android.content.Context;
import android.net.Proxy;


public class AddressTask extends IAddressTask {

	public static final int DO_APN = 0;
	public static final int DO_WIFI = 1;
	public static final int DO_GPS = 2;
	private int postType = -1;
	
	public AddressTask(Context context, int postType) {
		super(context);
		this.postType = postType;
	}
	
	@Override
	public HttpResponse execute(String params) throws Exception {
		HttpClient httpClient = new DefaultHttpClient();

		HttpConnectionParams.setConnectionTimeout(httpClient.getParams(),
				20 * 1000);
		HttpConnectionParams.setSoTimeout(httpClient.getParams(), 20 * 1000);

		HttpGet httpRequest = new HttpGet("http://maps.googleapis.com/maps/api/geocode/json?"+params);
		if (postType == DO_APN) {
			String proxyHost = Proxy.getDefaultHost();
			if(proxyHost != null) {
				HttpHost proxy = new HttpHost(proxyHost, 80);
				httpClient.getParams().setParameter(
						ConnRouteParams.DEFAULT_PROXY, proxy);
			}
		}
		
		HttpResponse response = httpClient.execute(httpRequest);
		return response;
	}

}
