package com.lingzhimobile.huodonghaowai.util;

import java.util.Random;

import org.json.JSONObject;

import com.lingzhimobile.huodonghaowai.cons.RenRenLibConst;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.renren.api.connect.android.Renren;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.os.Bundle;
import android.os.Parcel;
import android.provider.Settings.Secure;
import android.telephony.TelephonyManager;
import android.text.TextUtils;

public class AppInfo {
    private static final String LocalLogTag = LogTag.UTIL + " AppInfo";

    public static Context context;
    private static String deviceId;
    public static String userId;
    public static String emailAccount;

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

  //renren auth info just be in memory, to be find if necessary in SharedPreferences
    public static String renrenSessionUserId = null;
    public static String renrenAccessToken = null;
    public static String renrenExpirationDate = null; //in ms
    public static String renrenSessionKey = null;
    public static String renrenSecretKey = null;
    private static Context renrenRelatedContext = null;
    private static Renren renrenSdkObj = null;//just sigleton

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

    /**
     * save to SharedPreferences from memory
     * @param context
     * @param paramsOverride - may contain emailAccount, sessionToken
     */
    public static void persistLoginInfo(Context context, Bundle paramsOverride){
        persistLoginUserInfo(context,paramsOverride);
        //saveRenrenAccountInfo(context);
    }

    /**
     * save to SharedPreferences from memory
     * @param context
     * @param paramsOverride - may contain emailAccount, sessionToken
     */
    public static void persistLoginUserInfo(Context context, Bundle paramsOverride){
        if (context == null) return;
        String emailAccountOverride = null, sessionTokenOverride = null;
        if (paramsOverride != null){
            emailAccountOverride = paramsOverride.getString("emailAccount");
            sessionTokenOverride = paramsOverride.getString("sessionToken");
        }
        SharedPreferences userInfo = context.getSharedPreferences("UserInfo",Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = userInfo.edit();
        editor.putString("userId", AppInfo.userId);
        editor.putString("userGender", AppInfo.gender);
        editor.putString("userName", AppInfo.userName);
        editor.putString("userPhoto", AppInfo.userPhoto);
        editor.putString("constellation", AppInfo.constellation);
        editor.putString("hometown", AppInfo.hometown);
        editor.putString("bloodType", AppInfo.bloodType);
        editor.putString("department", AppInfo.department);
        editor.putString("school", AppInfo.school);
        editor.putString("description", AppInfo.description);
        editor.putString("educationalStatus", AppInfo.educationalStatus);
        editor.putInt("height", AppInfo.height);
        if (emailAccountOverride != null)
            editor.putString("email", emailAccountOverride);
        else editor.putString("email", AppInfo.emailAccount);
        if (sessionTokenOverride != null)
            editor.putString("sessionToken", sessionTokenOverride);
        else editor.putString("sessionToken", AppInfo.sessionToken);
        editor.commit();
    }
//    /**
//     * save to SharedPreferences from memory
//     * @param context
//     */
//    public static void saveRenrenAccountInfo(Context context){
//        if (context == null) return;
//        SharedPreferences userInfo = context.getSharedPreferences("UserInfo",Context.MODE_PRIVATE);
//        SharedPreferences.Editor editor = userInfo.edit();
//        editor.putString("renrenSessionUserId", AppInfo.renrenSessionUserId);
//        editor.putString("renrenAccessToken", AppInfo.renrenAccessToken);
//        editor.putString("renrenExpirationDate", AppInfo.renrenExpirationDate);
//        editor.putString("renrenSessionKey", AppInfo.renrenSessionKey);
//        editor.putString("renrenSecretKey", AppInfo.renrenSecretKey);
//        editor.commit();
//    }


    private static final String RenrenKeyName_API_KEY = "api_key";
    private static final String RenrenKeyName_SECRET = "secret";
    private static final String RenrenKeyName_APP_ID = "appid";
    private static final String RenrenKeyName_ACCESS_TOKEN = "renren_token_manager_access_token";
    private static final String RenrenKeyName_SESSION_KEY = "renren_token_manager_session_key";
    private static final String RenrenKeyName_SESSION_SECRET = "renren_token_manager_session_secret";
    private static final String RenrenKeyName_UID = "renren_token_manager_user_id";
    private static final String RenrenKeyName_SESSION_KEY_EXPIRE_TIME = "renren_token_manager_session_key_expire_time";

    public static Renren getRenrenSdkInstance(Context context){
        LogUtils.Logd(LocalLogTag, "getRenrenSdkInstance renrenAccessToken="+AppInfo.renrenAccessToken+
                ", renrenSessionKey="+AppInfo.renrenSessionKey+
                ", renrenSecretKey="+AppInfo.renrenSecretKey+
                ", renrenSessionUserId="+AppInfo.renrenSessionUserId+
                ", renrenExpirationDate="+AppInfo.renrenExpirationDate+
                ", renrenSdkObj!=null?="+(renrenSdkObj!=null));
        if (renrenSdkObj != null){
            LogUtils.Logd(LocalLogTag,"getRenrenSdkInstance renrenSdkObj!=null getCurrentUid()="+renrenSdkObj.getCurrentUid());
            return renrenSdkObj;
        }

//        Renren renren = null;
//        renren = new Renren(RenRenLibConst.APP_API_KEY, RenRenLibConst.APP_SECRET_KEY, RenRenLibConst.APP_ID, context);
//        if (renren.getCurrentUid() == 0){
//            if (!TextUtils.isEmpty(AppInfo.renrenSessionUserId)){
//                AccessTokenManager accessTokenManager =  renren.getAccessTokenManager();
//                accessTokenManager.accessToken = AppInfo.renrenAccessToken;
//                accessTokenManager.expireTime = Long.parseLong(AppInfo.renrenExpirationDate);
//                accessTokenManager.sessionKey = AppInfo.renrenSessionKey;
//                accessTokenManager.sessionSecret = AppInfo.renrenSecretKey;
//                accessTokenManager.uid = Long.parseLong(AppInfo.renrenSessionUserId);
//            }
//        }

        if (!TextUtils.isEmpty(AppInfo.renrenSessionUserId)){
            Bundle bd1 = new Bundle();
            bd1.putString(RenrenKeyName_API_KEY, RenRenLibConst.APP_API_KEY);
            bd1.putString(RenrenKeyName_SECRET, RenRenLibConst.APP_SECRET_KEY);
            bd1.putString(RenrenKeyName_APP_ID, RenRenLibConst.APP_ID);
            Bundle bd2 = new Bundle();
            bd2.putString(RenrenKeyName_ACCESS_TOKEN, AppInfo.renrenAccessToken);
            bd2.putString(RenrenKeyName_SESSION_KEY, AppInfo.renrenSessionKey);
            bd2.putString(RenrenKeyName_SESSION_SECRET, AppInfo.renrenSecretKey);
            bd2.putLong(RenrenKeyName_UID, Long.parseLong(AppInfo.renrenSessionUserId));
            bd2.putLong(RenrenKeyName_SESSION_KEY_EXPIRE_TIME, Long.parseLong(AppInfo.renrenExpirationDate));
            Parcel parcel = Parcel.obtain();
            bd1.writeToParcel(parcel, 0);
            bd2.writeToParcel(parcel, 0);
            parcel.setDataPosition(0);//it is IMPORTANT to reset dataPosition
            renrenSdkObj = new Renren(parcel);
            LogUtils.Logd(LocalLogTag,"getRenrenSdkInstance after new Renren(parcel), getCurrentUid()="+renrenSdkObj.getCurrentUid());
        }else{
            renrenSdkObj = new Renren(RenRenLibConst.APP_API_KEY, RenRenLibConst.APP_SECRET_KEY, RenRenLibConst.APP_ID, context);
            renrenRelatedContext = context;
            LogUtils.Logd(LocalLogTag,"getRenrenSdkInstance after new Renren with context, getCurrentUid()="+renrenSdkObj.getCurrentUid());
        }
        return renrenSdkObj;
    }
    //TODO if need to syncronize?
    public static void clearRenrenAuthInfo(){
        renrenSessionUserId = null;
        renrenAccessToken = null;
        renrenExpirationDate = null;
        renrenSessionKey = null;
        renrenSecretKey = null;
        clearRenrenSdkAuthInfo();
    }
    public static void clearRenrenSdkAuthInfo(){
        LogUtils.Logd(LocalLogTag,"clearRenrenSdkAuthInfo renrenSdkObj == null?="+(renrenSdkObj == null));
        if (renrenSdkObj == null)
            return;
        LogUtils.Logd(LocalLogTag,"clearRenrenSdkAuthInfo getCurrentUid="+renrenSdkObj.getCurrentUid()+
                ", renrenRelatedContext==null?"+(renrenRelatedContext==null));
        if (renrenSdkObj.getCurrentUid() != 0){
            if (renrenRelatedContext != null){
                renrenSdkObj.logout(renrenRelatedContext);
            }else{
                //renrenSdkObj.setCurrentUid(null);//to see if needed
            }
        }
        renrenSdkObj = null;
        renrenRelatedContext = null;
    }
    public static void syncRenrenAuthInfoToMemory(){
        Renren renren = renrenSdkObj;
        String currentUid=null, sessionKey=null, accessToken=null, secret=null, expireTime=null;
        if (existRenrenAuthInfo()){
            currentUid = renren.getCurrentUid()+"";
            sessionKey = renren.getSessionKey();
            accessToken = renren.getAccessToken();
            secret = renren.getSecret();
            expireTime = renren.getExpireTime()+"";

        }
        AppInfo.renrenSessionUserId = currentUid;
        AppInfo.renrenAccessToken = accessToken;
        AppInfo.renrenExpirationDate = expireTime;
        AppInfo.renrenSessionKey = sessionKey;
        AppInfo.renrenSecretKey = secret;
    }
    public static void syncMemoryToRenrenAuthInfo(){
        LogUtils.Logd(LocalLogTag,"syncMemoryToRenrenAuthInfo renrenSdkObj == null?="+(renrenSdkObj == null)+", renrenSessionUserId="+renrenSessionUserId);
        if (renrenSdkObj == null) return;
        String currentUid=null, sessionKey=null, accessToken=null, secret=null, expireTime=null;
        Renren renren = renrenSdkObj;
        currentUid = renren.getCurrentUid()+"";
        sessionKey = renren.getSessionKey();
        accessToken = renren.getAccessToken();
        secret = renren.getSecret();
        expireTime = renren.getExpireTime()+"";
        boolean allSame = true;
        if (currentUid.equals(renrenSessionUserId) || (currentUid.equals("0")&&TextUtils.isEmpty(renrenSessionUserId))) {
            //uid be same
            if (!currentUid.equals("0")){//renren have auth info
                if (!expireTime.equals(renrenExpirationDate)) allSame = false;
                if (!sessionKey.equals(renrenSessionKey)) allSame = false;
                if (!accessToken.equals(renrenAccessToken)) allSame = false;
                if (!secret.equals(renrenSecretKey)) allSame = false;
            }
        }
        else{
            allSame = false;
        }
        LogUtils.Logd(LocalLogTag,"syncMemoryToRenrenAuthInfo allSame="+allSame);
        if(!allSame) clearRenrenSdkAuthInfo();
    }
    public static boolean existRenrenAuthInfo(){
        boolean exist = false;
        LogUtils.Logd(LocalLogTag,"existRenrenAuthInfo begin, renrenSdkObj==null?="+(renrenSdkObj == null)
                +", renrenSessionUserId="+renrenSessionUserId);
        Renren renren = null;
        if (renrenSdkObj == null && TextUtils.isEmpty(renrenSessionUserId)){
            //no need to create a renren instance. not to call getRenrenSdkInstance(null) to avoid error
        }else{
            renren = getRenrenSdkInstance(null);
        }

        if (renren != null && renren.getCurrentUid() != 0)
            exist = true;
        LogUtils.Logd(LocalLogTag,"existRenrenAuthInfo exist="+exist);
        return exist;
    }

}
