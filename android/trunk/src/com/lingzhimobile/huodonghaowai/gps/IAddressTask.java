package com.lingzhimobile.huodonghaowai.gps;

import java.io.BufferedReader;
import java.io.IOException;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.ParseException;
import org.apache.http.protocol.HTTP;
import org.apache.http.util.EntityUtils;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.net.wifi.WifiManager;
import android.telephony.TelephonyManager;
import android.telephony.gsm.GsmCellLocation;
import android.util.Log;

public abstract class IAddressTask {

	protected Context context;

	public IAddressTask(Context context) {
		this.context = context;
	}

	public abstract HttpResponse execute(String params) throws Exception;

//	public JSONObject doWifiPost() throws Exception {
//		return transResponse(execute(doWifi()));
//	}
//
//	public JSONObject doApnPost() throws Exception {
//		return transResponse(execute(doApn()));
//	}

	public JSONObject doGpsPost(double lat, double lng) throws Exception {
		return transResponse(execute(doGps(lat, lng)));
	}

	private JSONObject transResponse(HttpResponse response) {
		JSONObject lca = null;
		JSONObject json = null;
		if (response.getStatusLine().getStatusCode() == 200) {
			HttpEntity entity = response.getEntity();
			BufferedReader br;
			String results;
            try {
                results = EntityUtils.toString(response.getEntity(),
                        HTTP.UTF_8);
                json = new JSONObject(results);
                if("OK".equals(json.getString("status"))){
                    lca = json.getJSONArray("results").getJSONObject(0);
                    Log.e("result", lca.toString());
                }
                
            } catch (ParseException e) {
                e.printStackTrace();
            } catch (IOException e) {
                e.printStackTrace();
            } catch (JSONException e) {
                e.printStackTrace();
            }
		}
		return lca;
	}

	private String doGps(double lat, double lng) throws Exception {
	    String params = "latlng="+lat+","+lng+"&sensor=true&language=en_US";

        return params;
	}

	private JSONObject doApn() throws Exception {
		JSONObject holder = new JSONObject();
		holder.put("version", "1.1.0");
		holder.put("host", "maps.google.com");
		holder.put("address_language", "en_US");
		holder.put("request_address", true);

		TelephonyManager tm = (TelephonyManager) context
				.getSystemService(Context.TELEPHONY_SERVICE);
		GsmCellLocation gcl = (GsmCellLocation) tm.getCellLocation();
		int cid = gcl.getCid();
		int lac = gcl.getLac();
		int mcc = Integer.valueOf(tm.getNetworkOperator().substring(0, 3));
		int mnc = Integer.valueOf(tm.getNetworkOperator().substring(3, 5));

		JSONArray array = new JSONArray();
		JSONObject data = new JSONObject();
		data.put("cell_id", cid);
		data.put("location_area_code", lac);
		data.put("mobile_country_code", mcc);
		data.put("mobile_network_code", mnc);
		array.put(data);
		holder.put("cell_towers", array);

		return holder;
	}

	private JSONObject doWifi() throws Exception {
		JSONObject holder = new JSONObject();
		holder.put("version", "1.1.0");
		holder.put("host", "maps.google.com");
		holder.put("address_language", "en_US");
		holder.put("request_address", true);

		WifiManager wifiManager = (WifiManager) context
				.getSystemService(Context.WIFI_SERVICE);

		if (wifiManager.getConnectionInfo().getBSSID() == null) {
			throw new RuntimeException("bssid is null");
		}

		JSONArray array = new JSONArray();
		JSONObject data = new JSONObject();
		data.put("mac_address", wifiManager.getConnectionInfo().getBSSID());
		data.put("signal_strength", 8);
		data.put("age", 0);
		array.put(data);
		holder.put("wifi_towers", array);

		return holder;
	}

}
