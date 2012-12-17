package com.lingzhimobile.huodonghaowai.util;

import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.Bitmap.Config;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Matrix;
import android.graphics.Paint;
import android.graphics.PorterDuff.Mode;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.graphics.RectF;
import android.location.Address;
import android.location.Criteria;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.Looper;
import android.os.Message;
import android.provider.Settings;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ExpandableListAdapter;
import android.widget.ExpandableListView;
import android.widget.TextView;
import android.widget.Toast;

import com.facebook.android.AsyncFacebookRunner;
import com.facebook.android.Facebook;
import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.activity.MainTabActivity;
import com.lingzhimobile.huodonghaowai.activity.Nearby;
import com.lingzhimobile.huodonghaowai.cons.MessageID;
import com.lingzhimobile.huodonghaowai.exception.ErrorCode;
import com.lingzhimobile.huodonghaowai.exception.JSONParseException;
import com.lingzhimobile.huodonghaowai.gps.AddressTask;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.model.ChatItem;

public class AppUtil {
    public static Facebook facebook;
    public static AsyncFacebookRunner mAsyncRunner;

    static String bestProvider;
    public static Location m_location;
    static boolean location_flag = true;
    static Criteria criteria;
    static LocationListener mLocationListener = null;
    private static Resources mResources;
    private static Toast toast;
    private static Dialog dialog;
    private static Context tempContext;
    private static Context context;
    static {
        if (mLocationListener == null) {
            mLocationListener = new LocationListener() {
                @Override
                public void onStatusChanged(String provider, int status,
                        Bundle extras) {
                }

                @Override
                public void onProviderEnabled(String provider) {
                }

                @Override
                public void onProviderDisabled(String provider) {
                }

                @Override
                public void onLocationChanged(Location location) {
                    // m_location = location;
                }
            };
        }
    }

    public static void init(Context context) {
        if (AppUtil.context != null) {
            return;
        }
        AppUtil.context = context;
        mResources = context.getResources();
        toast = new Toast(context);
        // getUserPreferLanguageIndex();
    }

    public static int[] convertMeterToFootAndInch(int height) {
        // 1 Inch = 2.54 cm, 1 Feet = 30.48 cm, 1 Feet = 12 Inch
        int feet = (int) (height / 30.48);
        int inch = (int) ((height - feet * 30.48) / 2.54);
        int[] result = new int[2];
        result[0] = feet;
        result[1] = inch;
        return result;
    }

    public static void setListViewHeightBasedOnChildren(
            ExpandableListView listView, boolean inExpand) {
        ExpandableListAdapter listAdapter = listView.getExpandableListAdapter();
        if (listAdapter == null) {
            // pre-condition
            return;
        }

        int totalHeight = 0;
        if (inExpand) {
            for (int i = 0; i < listAdapter.getChildrenCount(0); i++) {
                View listItem = listAdapter.getChildView(0, i, false, null,
                        listView);
                listItem.measure(0, 0);
                totalHeight += listItem.getMeasuredHeight();
                // totalHeight += listItem.getPaddingBottom();
                // totalHeight += listItem.getPaddingTop();
                totalHeight += 1;
            }
        }
        View groupitem = listAdapter.getGroupView(0, inExpand, null, listView);
        groupitem.measure(0, 0);

        ViewGroup.LayoutParams params = listView.getLayoutParams();
        params.height = totalHeight
                + (listView.getDividerHeight() * (listAdapter
                        .getChildrenCount(0) - 1));
        params.height = totalHeight + groupitem.getMeasuredHeight();
        listView.setLayoutParams(params);
    }

    public static void getLocation(Context context, Message msg) {
        location_flag = true;
        final LocationManager locationManager = (LocationManager) context
                .getSystemService(Context.LOCATION_SERVICE);
        criteria = new Criteria();
        criteria.setAccuracy(Criteria.ACCURACY_COARSE);
        criteria.setAltitudeRequired(false);
        criteria.setBearingRequired(false);
        criteria.setCostAllowed(true);
        criteria.setPowerRequirement(Criteria.POWER_MEDIUM);
        bestProvider = locationManager.getBestProvider(criteria, true);
        if (bestProvider == null) {
            msg.sendToTarget();
            return;
        }
        locationManager.requestLocationUpdates(bestProvider, 60000, 0,
                mLocationListener);
        int i = 0;
        m_location = locationManager.getLastKnownLocation(bestProvider);
        while (m_location == null && location_flag) {
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                LogUtils.Logd(LogTag.LOCATION, e.getMessage());
            }
            i++;
            if (i == 5) {
                location_flag = false;
                msg.what = MessageID.GET_LOCATION_FAIL;
                locationManager.removeUpdates(mLocationListener);
            }
            m_location = locationManager.getLastKnownLocation(bestProvider);
        }
        if (location_flag) {
            if (m_location != null) {
                LogUtils.Loge(LogTag.LOCATION, m_location.getLatitude()
                        + "----" + m_location.getLongitude());

                Geocoder gc = new Geocoder(context, Locale.US);
                try {
                    List<Address> lstAddress = gc.getFromLocation(
                            m_location.getLatitude(),
                            m_location.getLongitude(), 1);
                    if (lstAddress.size() == 0) {
                        Toast.makeText(context,
                                R.string.failed_retreive_location_alert,
                                Toast.LENGTH_SHORT).show();
                    } else {
                        LogUtils.Loge(LogTag.LOCATION, lstAddress.get(0)
                                .getAdminArea());
                        JSONObject jo = new JSONObject();
                        JSONArray ja = new JSONArray();
                        for (int x = 0; x <= lstAddress.get(0)
                                .getMaxAddressLineIndex(); x++) {
                            ja.put(lstAddress.get(0).getAddressLine(x));
                        }
                        try {
                            jo.put("addressLines", ja);
                            jo.put("admin", lstAddress.get(0).getAdminArea());
                            jo.put("sub-admin", lstAddress.get(0)
                                    .getSubAdminArea());
                            jo.put("locality", lstAddress.get(0).getLocality());
                            jo.put("postalCode", lstAddress.get(0)
                                    .getPostalCode());
                            jo.put("countryCode", lstAddress.get(0)
                                    .getCountryCode());
                            jo.put("countryName", lstAddress.get(0)
                                    .getCountryName());
                            jo.put("latitude", lstAddress.get(0).getLatitude());
                            jo.put("longitude", lstAddress.get(0)
                                    .getLongitude());
                        } catch (JSONException e) {
                            e.printStackTrace();
                        }
                        msg.obj = jo;
                        msg.what = MessageID.GET_LOCATION_OK;
                        msg.arg1 = 100;

                    }
                    LogUtils.Loge(LogTag.LOCATION, lstAddress.toString());
                    locationManager.removeUpdates(mLocationListener);
                } catch (IOException e) {
                    LogUtils.Logd(LogTag.LOCATION, e.getMessage(), e);
                }
                if (msg.obj == null) {
                    try {
                        msg.obj = new AddressTask(context, 2).doGpsPost(
                                m_location.getLatitude(),
                                m_location.getLongitude());
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                    if (msg.obj != null) {
                        msg.what = MessageID.GET_LOCATION_OK;
                        msg.arg1 = 101;
                    }
                    locationManager.removeUpdates(mLocationListener);
                }
                msg.sendToTarget();
            }
        }

    }

    public static boolean openGPSSettings(final Context context,
            final Message msg) {
        final LocationManager locationManager = (LocationManager) context
                .getSystemService(Context.LOCATION_SERVICE);
        if (locationManager
                .isProviderEnabled(android.location.LocationManager.GPS_PROVIDER)
                || locationManager
                        .isProviderEnabled(android.location.LocationManager.NETWORK_PROVIDER)) {
            Thread getLocThread = new Thread() {
                public void run() {
                    Looper.prepare();
                    getLocation(context, msg);
                    Looper.loop();
                }
            };
            getLocThread.start();
            return true;
        }
        LogUtils.Loge(LogTag.LOCATION, "open Setting");
        new AlertDialog.Builder(context)
                .setTitle(R.string.change_setting)
                .setMessage(R.string.failed_retreive_location_alert)
                .setPositiveButton(R.string.OK,
                        new DialogInterface.OnClickListener() {

                            @Override
                            public void onClick(DialogInterface dialog,
                                    int which) {
                                Intent intent = new Intent(
                                        Settings.ACTION_LOCATION_SOURCE_SETTINGS);
                                ((Activity) context).startActivityForResult(
                                        intent, 10);
                            }
                        })
                .setNegativeButton(R.string.Cancel,
                        new DialogInterface.OnClickListener() {

                            @Override
                            public void onClick(DialogInterface dialog,
                                    int which) {
                                msg.sendToTarget();
                            }
                        }).create().show();

        return false;
    }

    public static String formatTime(Context context, long ltime) {
        Resources res = context.getResources();
        Date now = new Date();
        Date time = new Date(ltime);
        SimpleDateFormat df;
        if (now.getYear() == time.getYear()
                && now.getMonth() == time.getMonth()
                && now.getDate() == time.getDate()) {// same day
            df = new SimpleDateFormat(res.getString(R.string.time_sameday));
        } else {// other day
            df = new SimpleDateFormat(
                    res.getString(R.string.time_differentday_withminutes));
        }
        return df.format(new Date(ltime));
    }

    public static String formatSimpleTime(Context context, long ltime) {
        Resources res = context.getResources();
        Date now = new Date();
        Date time = new Date(ltime);
        SimpleDateFormat df;
        if (now.getYear() == time.getYear()
                && now.getMonth() == time.getMonth()
                && now.getDate() == time.getDate()) {// same day
            df = new SimpleDateFormat(res.getString(R.string.time_sameday));
        } else {// other day
            df = new SimpleDateFormat(res.getString(R.string.time_proposedate));
        }
        return df.format(new Date(ltime));
    }

    public static void showErrToast(Context context, int strId, int duration) {
        if (context == null) {
            return;
        }
        LayoutInflater inflater = LayoutInflater.from(context);
        View view = inflater.inflate(R.layout.errtoast, null);
        TextView tvToast = (TextView) view.findViewById(R.id.tvToast);
        tvToast.setText(strId);
        toast.cancel();
        toast = new Toast(context);
        toast.setDuration(duration);
        toast.setView(view);
        toast.setGravity(Gravity.CENTER, 0, 0);
        toast.show();
    }

    public static void shwoNotifyDialog(Context context, final Dialog dialog,
            String str) {
        if (context == null || str == null) {
            return;
        }
        LayoutInflater inflater = LayoutInflater.from(context);
        View view = inflater.inflate(R.layout.notifydialog, null);
        TextView text = (TextView) view.findViewById(R.id.tvNotifyText);
        text.setText(str);
        Button btnOk = (Button) view.findViewById(R.id.btnOk);
        btnOk.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                dialog.dismiss();
            }
        });
        dialog.setContentView(view);
        if (!dialog.isShowing()) {
            dialog.show();
        }
    }

    public static String getSmallPhoto(String url) {
        if (url == null) {
            return null;
        }
        int index = url.lastIndexOf(".");
        if (index != -1) {
            String s1 = url.substring(0, index);
            String s2 = url.substring(index);
            return s1 + "s" + s2;
        }
        return null;
    }

    public static String getFixWidthPhoto(String url) {
        if (url == null) {
            return null;
        }
        int index = url.lastIndexOf(".");
        if (index != -1) {
            String s1 = url.substring(0, index);
            String s2 = url.substring(index);
            LogUtils.Loge("fw", s1 + "fw" + s2);
            return s1 + "fw" + s2;
        }
        return null;
    }

    public static String getInterval(String time) {
        return getInterval(time, String.valueOf(new Date().getTime()));
    }

    /**
     * 
     * @param time
     *            the time in second( not millisecond)
     * @return
     */
    public static String getInterval(String time, String currentTime) {
        if (time == null || time.equals("")) {
            return "none";
        }
        if (time.length() > 10) {
            time = time.substring(0, 10);
        }
        long ltime;
        try {
            ltime = Long.parseLong(time);
        } catch (NumberFormatException e) {
            LogUtils.Logd("Exception", e.getMessage(), e);
            return "none";
        }
        if (ltime == 0)
            return "none";

        long date = Long.parseLong(currentTime) / 1000;
        long timeInterval = date - ltime;

        String timeStr = "";
        // in terms of minutes
        long minutes = Math.round(timeInterval / 60.0);

        if (minutes < 60) {
            if (minutes <= 1) {
                timeStr = getStringFromId(R.string.minute_ago);
            } else {
                timeStr = getStringFromIdWithParams(R.string.d_minute_ago,
                        minutes);
            }
            return timeStr;
        }

        // in terms of hours
        long hours = Math.round(minutes / 60.0);

        if (hours < 24) {
            if (hours <= 1) {
                timeStr = getStringFromId(R.string.hour_ago);
            } else {
                timeStr = getStringFromIdWithParams(R.string.d_hour_ago, hours);
            }
            return timeStr;
        }

        // in terms of days or months
        int days = (int) (Math.round(hours / 24.0));

        if (days < 30) {
            if (days <= 1) {
                timeStr = getStringFromId(R.string.day_ago);
            } else if (days < 30) {
                timeStr = getStringFromIdWithParams(R.string.d_day_ago, days);
            }
            return timeStr;
        }

        int months = days / 30;

        if (months <= 1) {
            timeStr = getStringFromId(R.string.mount_ago);
        } else {
            timeStr = getStringFromIdWithParams(R.string.d_mount_ago, months);
        }

        return timeStr;
    }

    /**
     * getStringFromId
     * 
     * @param srcid
     * @return
     */
    public static String getStringFromId(int srcid) {
        return mResources.getString(srcid);
    }

    /**
     * getStringFromIdWithParams
     * 
     * @param srcid
     * @param params
     * @return
     */
    public static String getStringFromIdWithParams(int srcid, Object... params) {
        return mResources.getString(srcid, params);
    }

    public static String subString(String from) {
        if (from.length() > 110) {
            from = from.substring(0, 110);
            from = from + "...";
        }
        return from;
    }

    public static JSONParseException getJSONParseExceptionError() {
        return new JSONParseException(ErrorCode.SERVER_RETURN_ERROR,
                getStringFromId(R.string.error_please_try_again_later));
    }

    public static void handleErrorCode(String errCode, final Context context) {
        int code;
        if (errCode != null && !"".equals(errCode)) {
            try {
                code = Integer.parseInt(errCode);
            } catch (NumberFormatException e) {
                return;
            }
            if (ErrorCode.errorMap.get(code) != null) {
                if (code == 21060) {

                    if (dialog == null || !tempContext.equals(context)) {
                        dialog = new Dialog(context, R.style.AlertDialog);
                        tempContext = context;
                    }
                    shwoNotifyDialog(context, dialog,
                            getStringFromId(R.string.err21060));
                } else {
                    showErrToast(context, ErrorCode.errorMap.get(code),
                            Toast.LENGTH_LONG);
                }
            } else {
                if (code == 21086 || code == 21085) {
                    context.getSharedPreferences("UserInfo", 0).edit()
                            .remove("userId").commit();
                    context.getSharedPreferences("UserInfo", 0).edit()
                            .remove("email").commit();
                    AppInfo.userId = null;
                    Intent intent = new Intent();
                    intent.setClass(context, Nearby.class);
                    intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                    context.startActivity(intent);
                    return;
                } else if (code != 21031 && code != 1100) {
                    showErrToast(context, R.string.errMessage,
                            Toast.LENGTH_SHORT);
                } else if (code == 21088) {
                    if (dialog == null || !tempContext.equals(context)) {
                        dialog = new Dialog(context, R.style.AlertDialog);
                        tempContext = context;
                    }
                    LayoutInflater inflater = LayoutInflater.from(context);
                    View view = inflater.inflate(R.layout.notifydialog, null);
                    TextView text = (TextView) view
                            .findViewById(R.id.tvNotifyText);
                    text.setText(R.string.err21212);
                    Button btnOk = (Button) view.findViewById(R.id.btnOk);
                    btnOk.setOnClickListener(new View.OnClickListener() {

                        @Override
                        public void onClick(View v) {
                            context.getSharedPreferences("UserInfo", 0)
                                    .edit().remove("userId").commit();
                            context.getSharedPreferences("UserInfo", 0)
                                    .edit().remove("sessionToken").commit();
                            AppInfo.userId = null;
                            AppInfo.sessionToken = null;
                            GlobalValue.applyDates.clear();
                            GlobalValue.sendDates.clear();
                            GlobalValue.invitedDates.clear();
                            GlobalValue.nearbyDates.clear();
                            Intent intent = new Intent();
                            intent.setClass(context, Nearby.class);
                            intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                            context.startActivity(intent);
                            MainTabActivity.instance.finish();
                            dialog.dismiss();
                        }
                    });
                    dialog.setContentView(view);
                    if (!dialog.isShowing()) {
                        dialog.show();
                    }
                }
            }
        }
    }

    public static String getLocationStr(JSONObject Jo, String Type) {
        if (Jo == null || Type == null) {
            return null;
        }
        String CountryCode = null;
        String Admin = null;
        String City = null;
        try {
            JSONArray ja = Jo.getJSONArray("address_components");
            for (int i = 0; i < ja.length(); i++) {
                JSONArray types = ja.getJSONObject(i).getJSONArray("types");
                if ("locality".equals(types.get(0).toString())) {
                    City = ja.getJSONObject(i).getString("long_name");
                } else if ("administrative_area_level_1".equals(types.get(0)
                        .toString())) {
                    Admin = ja.getJSONObject(i).getString("long_name");
                } else if ("country".equals(types.get(0).toString())) {
                    CountryCode = ja.getJSONObject(i).getString("short_name");
                }
            }
            if ("long".equals(Type)) {
                return CountryCode + Admin + City;
            } else if ("short".equals(Type)) {
                return City;
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return null;
    }

    public static Bitmap getRoundedCornerBitmap(Bitmap bitmap) {
        if (bitmap == null) {
            return null;
        }
        Bitmap output = Bitmap.createBitmap(bitmap.getWidth(),
                bitmap.getHeight(), Config.ARGB_8888);
        Canvas canvas = new Canvas(output);

        final int color = 0xff424242;
        final Paint paint = new Paint();
        final Rect rect = new Rect(0, 0, bitmap.getWidth(), bitmap.getHeight());
        final RectF rectF = new RectF(rect);
        final float roundPx = 12;

        paint.setAntiAlias(true);
        canvas.drawARGB(0, 0, 0, 0);
        paint.setColor(color);
        canvas.drawRoundRect(rectF, roundPx, roundPx, paint);

        paint.setXfermode(new PorterDuffXfermode(Mode.SRC_IN));
        canvas.drawBitmap(bitmap, rect, rect, paint);

        return output;
    }

    public static Bitmap getRotationBitmap(Context context, int resId) {
        Resources res = context.getResources();
        Bitmap img = BitmapFactory.decodeResource(res, resId);
        Matrix matrix = new Matrix();
        matrix.postRotate(180);
        int width = img.getWidth();
        int height = img.getHeight();
        img = Bitmap.createBitmap(img, 0, 0, width, height, matrix, true);
        return img;
    }

    public static List<ArrayList<ChatItem>> sortConversationList(
            List<ChatItem> messages) {
        List<ArrayList<ChatItem>> result = new ArrayList<ArrayList<ChatItem>>();
        ArrayList<ChatItem> confirmed = new ArrayList<ChatItem>();
        ArrayList<ChatItem> unConfirmed = new ArrayList<ChatItem>();
        for (int i = 0; i < messages.size(); i++) {
            if (messages.get(i).isSenderConfirmed()) {
                confirmed.add(messages.get(i));
            } else {
                unConfirmed.add(messages.get(i));
            }
        }
        result.add(0, confirmed);
        result.add(1, unConfirmed);
        return result;
    }

}
