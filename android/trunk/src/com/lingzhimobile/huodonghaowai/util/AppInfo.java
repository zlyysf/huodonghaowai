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
    public static String accountRenRen;
    private static boolean isInit = false;
    public static String sessionToken = null;

  //renren auth info just be in memory, to be find if necessary in SharedPreferences
//    public static String renrenSessionUserId = null;
//    public static String renrenAccessToken = null;
//    public static String renrenExpirationDate = null; //in ms
//    public static String renrenSessionKey = null;
//    public static String renrenSecretKey = null;
//    //private static Context renrenRelatedContext = null;
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
        editor.putString("accountRenRen", AppInfo.accountRenRen);
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

    public static void clearUserInfo(){
        userId = null;
        //emailAccount = null;

        gender = null;
        userName = null;
        userPhoto = null;
        school = null;
        bloodType = null;
        department = null;
        constellation = null;
        hometown = null;
        educationalStatus = null;
        description = null;
        height = 0;
        accountRenRen = null;
    }

    private static final String RenrenKeyName_API_KEY = "api_key";
    private static final String RenrenKeyName_SECRET = "secret";
    private static final String RenrenKeyName_APP_ID = "appid";
    private static final String RenrenKeyName_ACCESS_TOKEN = "renren_token_manager_access_token";
    private static final String RenrenKeyName_SESSION_KEY = "renren_token_manager_session_key";
    private static final String RenrenKeyName_SESSION_SECRET = "renren_token_manager_session_secret";
    private static final String RenrenKeyName_UID = "renren_token_manager_user_id";
    private static final String RenrenKeyName_SESSION_KEY_EXPIRE_TIME = "renren_token_manager_session_key_expire_time";

//    public static Renren getRenrenSdkInstance(Context context){
//        LogUtils.Logd(LocalLogTag, "getRenrenSdkInstance renrenAccessToken="+AppInfo.renrenAccessToken+
//                ", renrenSessionKey="+AppInfo.renrenSessionKey+
//                ", renrenSecretKey="+AppInfo.renrenSecretKey+
//                ", renrenSessionUserId="+AppInfo.renrenSessionUserId+
//                ", renrenExpirationDate="+AppInfo.renrenExpirationDate+
//                ", renrenSdkObj!=null?="+(renrenSdkObj!=null));
//        if (renrenSdkObj != null){
//            LogUtils.Logd(LocalLogTag,"getRenrenSdkInstance renrenSdkObj!=null getCurrentUid()="+renrenSdkObj.getCurrentUid());
//            return renrenSdkObj;
//        }
//
//        if (!TextUtils.isEmpty(AppInfo.renrenSessionUserId)){
//            Bundle bd1 = new Bundle();
//            bd1.putString(RenrenKeyName_API_KEY, RenRenLibConst.APP_API_KEY);
//            bd1.putString(RenrenKeyName_SECRET, RenRenLibConst.APP_SECRET_KEY);
//            bd1.putString(RenrenKeyName_APP_ID, RenRenLibConst.APP_ID);
//            Bundle bd2 = new Bundle();
//            bd2.putString(RenrenKeyName_ACCESS_TOKEN, AppInfo.renrenAccessToken);
//            bd2.putString(RenrenKeyName_SESSION_KEY, AppInfo.renrenSessionKey);
//            bd2.putString(RenrenKeyName_SESSION_SECRET, AppInfo.renrenSecretKey);
//            bd2.putLong(RenrenKeyName_UID, Long.parseLong(AppInfo.renrenSessionUserId));
//            bd2.putLong(RenrenKeyName_SESSION_KEY_EXPIRE_TIME, Long.parseLong(AppInfo.renrenExpirationDate));
//            Parcel parcel = Parcel.obtain();
//            bd1.writeToParcel(parcel, 0);
//            bd2.writeToParcel(parcel, 0);
//            parcel.setDataPosition(0);//it is IMPORTANT to reset dataPosition
//            renrenSdkObj = new Renren(parcel);
//            LogUtils.Logd(LocalLogTag,"getRenrenSdkInstance after new Renren(parcel), getCurrentUid()="+renrenSdkObj.getCurrentUid());
//        }else{
//            renrenSdkObj = new Renren(RenRenLibConst.APP_API_KEY, RenRenLibConst.APP_SECRET_KEY, RenRenLibConst.APP_ID, context);
//            renrenRelatedContext = context;
//            LogUtils.Logd(LocalLogTag,"getRenrenSdkInstance after new Renren with context, getCurrentUid()="+renrenSdkObj.getCurrentUid());
//        }
//        return renrenSdkObj;
//    }
    public static Renren getNonEmptyRenrenSdkInstance(Context context){
//        LogUtils.Logd(LocalLogTag, "getNonEmptyRenrenSdkInstance begin, renrenAccessToken="+AppInfo.renrenAccessToken+
//                ", renrenSessionKey="+AppInfo.renrenSessionKey+
//                ", renrenSecretKey="+AppInfo.renrenSecretKey+
//                ", renrenSessionUserId="+AppInfo.renrenSessionUserId+
//                ", renrenExpirationDate="+AppInfo.renrenExpirationDate+
//                ", renrenSdkObj!=null?="+(renrenSdkObj!=null));
        if (renrenSdkObj != null){
            LogUtils.Logd(LocalLogTag,"getNonEmptyRenrenSdkInstance renrenSdkObj!=null getCurrentUid()="+renrenSdkObj.getCurrentUid());
            if (context != null)
                renrenSdkObj.init(context);
            return renrenSdkObj;
        }
        if (context == null)
            throw new RuntimeException("in getNonEmptyRenrenSdkInstance, need provide context param");
        renrenSdkObj = new Renren(RenRenLibConst.APP_API_KEY, RenRenLibConst.APP_SECRET_KEY, RenRenLibConst.APP_ID, context);
        LogUtils.Logd(LocalLogTag,"getNonEmptyRenrenSdkInstance after new Renren with context, getCurrentUid()="+renrenSdkObj.getCurrentUid());
        return renrenSdkObj;
    }

    /**
     *
     * if renren sdk have auth info and does not match the user, then renren sdk should clear auth info.
     * so the return renren sdk may have sync info, may have no auth info.
     * @param context
     * @return
     */
    public static Renren getRenrenSdkInstanceForCurrentUser(Context context){
        Renren renren = getNonEmptyRenrenSdkInstance(context);
        LogUtils.Logd(LocalLogTag,"getRenrenSdkInstanceForCurrentUser enter"
                  +", userId="+userId+", accountRenRen="+accountRenRen+", renren.getCurrentUid="+renren.getCurrentUid());
        if (isRenrenAuthInfoMatchCurrentUser(context, false))
            return renren;
        else{
            LogUtils.Logd(LocalLogTag,"getRenrenSdkInstanceForCurrentUser , before renren.logout");
            renren.logout(context);
        }
        return renren;
    }
    /**
     * if all exist, then must be equal. if not exist any, can be match.
     * if user exist but renren auth info not exist, can do auth to achieve be match, but if strict, be not match.
     * @param context
     */
    public static boolean isRenrenAuthInfoMatchCurrentUser(Context context, boolean isStrict){
        Renren renren = getNonEmptyRenrenSdkInstance(context);
        boolean beMatch = false;
        if (!TextUtils.isEmpty(userId)){//user exist
            if (renren.getCurrentUid() !=0){//renren auth info exist
                String sCurrentUid = renren.getCurrentUid()+"";
                if (sCurrentUid.equals(accountRenRen)){
                    beMatch = true;
                }else{
                    beMatch = false;
                }
            }else {//no renren auth info
                if (isStrict) beMatch = false;
                else beMatch = true;
            }
        }else{//TextUtils.isEmpty(userId)--no user
            if (renren.getCurrentUid() !=0){//renren auth info exist
                beMatch = false;
            }else{//no renren auth info
                beMatch = true;
            }
        }
        LogUtils.Logd(LocalLogTag,"isRenrenAuthInfoMatchCurrentUser exit"+", beMatch="+beMatch
                +", userId="+userId+", accountRenRen="+accountRenRen+", renren.getCurrentUid="+renren.getCurrentUid());
        return beMatch;
    }

    public static Renren getRenrenSdkInstanceAtMostPossibleMatchUser(Context context){
        Renren renren = getNonEmptyRenrenSdkInstance(context);
        LogUtils.Logd(LocalLogTag,"getRenrenSdkInstanceAtMostPossibleMatchUser enter"
                +", userId="+userId+", accountRenRen="+accountRenRen+", renren.getCurrentUid="+renren.getCurrentUid());
        if (isRenrenAuthInfoMatchCurrentUserAtMostPossible(context))
            return renren;
        else{
            LogUtils.Logd(LocalLogTag,"getRenrenSdkInstanceAtMostPossibleMatchUser , before renren.logout");
            renren.logout(context);
        }
        return renren;
    }
    /**
     * if current user exist and current user have accountRenren,
     *   and if current renren auth info exist, and if they are not match,
     *     then we judge not match, because it obvious not match.
     * if current renren auth info not exist,
     *     we consider can be match if later do auth.
     * if current user exist but have not accountRenren--not bind with renren, and current renren auth info exist,
     *     if user1 with renren1 login and logout, and user2 login by email, at this time user2 should not match renren1,
     *     but we consider it is seldom that normal user need to switch renren account or user email. so just let them match in later actions.
     * if current user not exist, and current renren auth info exist,
     *     same consider as "if current user exist but have not accountRenren--not bind with renren, and current renren auth info exist".
     * @param context
     */
    public static boolean isRenrenAuthInfoMatchCurrentUserAtMostPossible(Context context){
        Renren renren = getNonEmptyRenrenSdkInstance(context);
        boolean beMatch = true;
        if (!TextUtils.isEmpty(userId) && !TextUtils.isEmpty(accountRenRen) && renren.getCurrentUid() !=0){
            if (!accountRenRen.equals(renren.getCurrentUid()+"")){
                beMatch = false;
            }
        }
        LogUtils.Logd(LocalLogTag,"isRenrenAuthInfoMatchCurrentUserAtMostPossible exit"+", beMatch="+beMatch
                +", userId="+userId+", accountRenRen="+accountRenRen+", renren.getCurrentUid="+renren.getCurrentUid());
        return beMatch;
    }



    /**
     * only check exist any renren auth info, not consider the relation with current user
     * @param context
     * @return
     */
    public static boolean existRenrenAuthInfo(Context context){
        Renren renren = getNonEmptyRenrenSdkInstance(context);
        boolean exist = false;
        long lCurrentUid = renren.getCurrentUid();
        if (lCurrentUid != 0){
            exist = true;
        }
        LogUtils.Logd(LocalLogTag,"existRenrenAuthInfo exist="+exist+
                ", CurrentUid="+lCurrentUid+", accountRenRen"+accountRenRen);
        return exist;
    }
    public static void clearRenrenAuthInfo(Context context){
        Renren renren = getNonEmptyRenrenSdkInstance(context);
        long lCurrentUid = renren.getCurrentUid();
        LogUtils.Logd(LocalLogTag,"clearRenrenSdkAuthInfo , getCurrentUid="+lCurrentUid);
        if (lCurrentUid != 0){
            renren.logout(context);
        }
    }


//    public static void clearAllRelateRenrenAuth(){
//        accountRenRen = null;
//        clearRenrenAuthInfo();
//    }
//
//    public static void clearRenrenAuthInfo(){
//        renrenSessionUserId = null;
//        renrenAccessToken = null;
//        renrenExpirationDate = null;
//        renrenSessionKey = null;
//        renrenSecretKey = null;
//        clearRenrenSdkAuthInfo();
//    }
//    public static void clearRenrenSdkAuthInfo(){
//        LogUtils.Logd(LocalLogTag,"clearRenrenSdkAuthInfo renrenSdkObj == null?="+(renrenSdkObj == null));
//        if (renrenSdkObj == null)
//            return;
//        LogUtils.Logd(LocalLogTag,"clearRenrenSdkAuthInfo getCurrentUid="+renrenSdkObj.getCurrentUid()+
//                ", renrenRelatedContext==null?"+(renrenRelatedContext==null));
//        if (renrenSdkObj.getCurrentUid() != 0){
//            if (renrenRelatedContext != null){
//                renrenSdkObj.logout(renrenRelatedContext);
//            }else{
//                //renrenSdkObj.setCurrentUid(null);//to see if needed
//            }
//        }
//        renrenSdkObj = null;
//        renrenRelatedContext = null;
//    }
//    public static void syncRenrenAuthInfoToMemory(){
//        Renren renren = renrenSdkObj;
//        String currentUid=null, sessionKey=null, accessToken=null, secret=null, expireTime=null;
//        if (existRenrenAuthInfo()){
//            currentUid = renren.getCurrentUid()+"";
//            sessionKey = renren.getSessionKey();
//            accessToken = renren.getAccessToken();
//            secret = renren.getSecret();
//            expireTime = renren.getExpireTime()+"";
//
//        }
//        AppInfo.renrenSessionUserId = currentUid;
//        AppInfo.renrenAccessToken = accessToken;
//        AppInfo.renrenExpirationDate = expireTime;
//        AppInfo.renrenSessionKey = sessionKey;
//        AppInfo.renrenSecretKey = secret;
//
//        AppInfo.accountRenRen = currentUid;
//    }
//    public static void syncMemoryToRenrenAuthInfo(){
//        LogUtils.Logd(LocalLogTag,"syncMemoryToRenrenAuthInfo renrenSdkObj == null?="+(renrenSdkObj == null)+", renrenSessionUserId="+renrenSessionUserId);
//        if (renrenSdkObj == null) return;
//        String currentUid=null, sessionKey=null, accessToken=null, secret=null, expireTime=null;
//        Renren renren = renrenSdkObj;
//        currentUid = renren.getCurrentUid()+"";
//        sessionKey = renren.getSessionKey();
//        accessToken = renren.getAccessToken();
//        secret = renren.getSecret();
//        expireTime = renren.getExpireTime()+"";
//        boolean allSame = true;
//        if (currentUid.equals(renrenSessionUserId) || (currentUid.equals("0")&&TextUtils.isEmpty(renrenSessionUserId))) {
//            //uid be same
//            if (!currentUid.equals("0")){//renren have auth info
//                if (!expireTime.equals(renrenExpirationDate)) allSame = false;
//                if (!sessionKey.equals(renrenSessionKey)) allSame = false;
//                if (!accessToken.equals(renrenAccessToken)) allSame = false;
//                if (!secret.equals(renrenSecretKey)) allSame = false;
//            }
//        }
//        else{
//            allSame = false;
//        }
//        LogUtils.Logd(LocalLogTag,"syncMemoryToRenrenAuthInfo allSame="+allSame);
//        if(!allSame) clearRenrenSdkAuthInfo();
//    }
//    public static boolean existRenrenAuthInfo(){
//        boolean exist = false;
//        LogUtils.Logd(LocalLogTag,"existRenrenAuthInfo begin, renrenSdkObj==null?="+(renrenSdkObj == null)
//                +", renrenSessionUserId="+renrenSessionUserId);
//        Renren renren = null;
//        if (renrenSdkObj == null && TextUtils.isEmpty(renrenSessionUserId)){
//            //no need to create a renren instance. not to call getRenrenSdkInstance(null) to avoid error
//        }else{
//            renren = getRenrenSdkInstance(null);
//        }
//
//        if (renren != null && renren.getCurrentUid() != 0)
//            exist = true;
//        LogUtils.Logd(LocalLogTag,"existRenrenAuthInfo exist="+exist);
//        return exist;
//    }

}
