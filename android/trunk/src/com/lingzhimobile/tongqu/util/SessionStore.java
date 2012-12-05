/*
 * Copyright 2010 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.lingzhimobile.tongqu.util;

import android.content.Context;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;

import com.facebook.android.Facebook;
import com.weibo.net.AccessToken;
import com.weibo.net.Weibo;

public class SessionStore {

    private static final String TOKEN = "access_token";
    private static final String EXPIRES = "expires_in";
    private static String KEY;
    private static String TYPE_FACEBOOK = "facebook";
    private static String TYPE_SINA_WEIBO = "sinaweibo";

    /*
     * Save the access token and expiry date so you don't have to fetch it each
     * time
     */

    public static boolean saveFacebook(Facebook session, Context context) {
        KEY = context.getSharedPreferences("UserInfo",0).getString("email", null);
        if(KEY == null){
            return false;
        }
        Editor editor = context.getSharedPreferences(KEY+TYPE_FACEBOOK, Context.MODE_PRIVATE).edit();
        editor.putString(TOKEN, session.getAccessToken());
        editor.putLong(EXPIRES, session.getAccessExpires());
        return editor.commit();
    }

    /*
     * Restore the access token and the expiry date from the shared preferences.
     */
    public static boolean restoreFacebook(Facebook session, Context context) {
        KEY = context.getSharedPreferences("UserInfo",0).getString("email", null);
        if(KEY == null){
            return false;
        }
        SharedPreferences savedSession = context.getSharedPreferences(KEY+TYPE_FACEBOOK, Context.MODE_PRIVATE);
        session.setAccessToken(savedSession.getString(TOKEN, null));
        session.setAccessExpires(savedSession.getLong(EXPIRES, 0));
        return session.isSessionValid();
    }

    public static void clearFacebook(Context context) {
        KEY = context.getSharedPreferences("UserInfo",0).getString("email", null);
        if(KEY == null){
            return;
        }
        Editor editor = context.getSharedPreferences(KEY+TYPE_FACEBOOK, Context.MODE_PRIVATE).edit();
        editor.clear();
        editor.commit();
    }
    
    public static boolean saveSinaWeibo(Weibo session, Context context) {
        KEY = context.getSharedPreferences("UserInfo",0).getString("email", null);
        if(KEY == null){
            return false;
        }
        Editor editor = context.getSharedPreferences(KEY+TYPE_SINA_WEIBO, Context.MODE_PRIVATE).edit();
        editor.putString(TOKEN, session.getAccessToken().getToken());
        editor.putLong(EXPIRES, session.getAccessToken().getExpiresIn());
        return editor.commit();
    }

    /*
     * Restore the access token and the expiry date from the shared preferences.
     */
    public static boolean restoreSinaWeibo(Weibo session, Context context) {
        KEY = context.getSharedPreferences("UserInfo",0).getString("email", null);
        if(KEY == null){
            return false;
        }
        SharedPreferences savedSession = context.getSharedPreferences(KEY+TYPE_SINA_WEIBO, Context.MODE_PRIVATE);
        AccessToken accessToken = new AccessToken(savedSession.getString(TOKEN, null), GlobalValue.CONSUMER_SECRET);
        accessToken.setExpiresIn(savedSession.getLong(EXPIRES, 0));
        session.setAccessToken(accessToken);
        return session.isSessionValid();
    }

    public static void clearSinaWeibo(Context context) {
        KEY = context.getSharedPreferences("UserInfo",0).getString("email", null);
        if(KEY == null){
            return;
        }
        Editor editor = context.getSharedPreferences(KEY+TYPE_SINA_WEIBO, Context.MODE_PRIVATE).edit();
        editor.clear();
        editor.commit();
    }
    
    

}
