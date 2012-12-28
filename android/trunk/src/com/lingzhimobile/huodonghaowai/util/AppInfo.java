package com.lingzhimobile.huodonghaowai.util;

import java.util.Random;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.provider.Settings.Secure;
import android.telephony.TelephonyManager;

public class AppInfo {
    public static Context context;
    private static String deviceId;
    public static String userId;


    public static String gender;
    public static String userName;
    public static String userPhoto;
    public static String school;
    public static String bloodType;
    public static String department;
    public static String constellation;
    public static String hometown;
    public static String educationalStatus;
    public static String description;
    public static int height;
    private static boolean isInit = false;
    public static String sessionToken = null;

    public static String renrenSessionUserId = null;
    public static String renrenAccessToken = null;
    public static String renrenExpirationDate = null; //in ms
    public static String renrenSessionKey = null;
    public static String renrenSecretKey = null;

    // public static String userId;

    public static String getDeviceId() {
        if (deviceId == null) {
            SharedPreferences sp = context.getSharedPreferences("INFO", 0);
            deviceId = sp.getString("deviceId", null);
        }
        return deviceId;
    }
    public static String getSessionToken(){
        if (sessionToken == null) {
            SharedPreferences sp = context.getSharedPreferences("UserInfo", 0);
            sessionToken = sp.getString("sessionToken", null);
        }
        return sessionToken;
    }
    public static boolean isInit() {
        return isInit;
    }

    public static void init(Context context) {
        if(AppInfo.context == null){
            AppInfo.context = context;
        }
        if (!isInit) {
            if (deviceId == null) {
                AppInfo.context = context;
                initPhoneInfo(context);
            }
            FileManager.init(context);
            AppUtil.init(context);
            isInit = true;
        }
    }

    private static void initPhoneInfo(Context context) {
        if (getDeviceId() != null)
            return;
        TelephonyManager tm = (TelephonyManager) context
                .getSystemService(Context.TELEPHONY_SERVICE);
        deviceId = tm.getDeviceId();
        if (deviceId == null)
            deviceId = Secure.getString(context.getContentResolver(),
                    Secure.ANDROID_ID);
        if (deviceId.equals("000000000000000"))
              deviceId = String.valueOf(new Random().nextDouble());
        SharedPreferences sp = context.getSharedPreferences("INFO", 0);
        Editor editor = sp.edit();
        editor.putString("deviceId", deviceId);
        editor.commit();
    }

}
