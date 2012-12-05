package com.lingzhimobile.tongqu.activity;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.os.CountDownTimer;
import android.text.TextUtils;

import com.lingzhimobile.tongqu.R;
import com.lingzhimobile.tongqu.util.AppInfo;

public class Splash extends TongQuActivity {
    // private AddDeviceTask addDeviceTask;

    // public Handler myHandler = new Handler() {
    //
    // @SuppressWarnings("unchecked")
    // @Override
    // public void handleMessage(Message msg) {
    // switch (msg.what) {
    // case MessageID.SERVER_RETURN_NULL:
    // AppUtil.handleErrorCode(msg.obj.toString(), Splash.this);
    // break;
    // case MessageID.DEVICEID_EXISTED:
    // savePrefrerence((ArrayList<Object>) msg.obj);
    // if (getPrefrerence()) {
    // gotoMainTabActivity();
    // } else {
    // gotoAskInfo();
    // }
    // break;
    // case MessageID.DEVICEID_NOT_EXIST:
    // savePrefrerence((ArrayList<Object>) msg.obj);
    // gotoAskInfo();
    // break;
    // }
    // }
    //
    // };

    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.splash);
        new CountDownTimer(1000, 100) {
            @Override
            public void onTick(long millisUntilFinished) {
            }

            @Override
            public void onFinish() {
                if (isFirstOpenApp()) {
                    gotoHelpView();
                } else {
                    if (getPrefrerence()) {
                        gotoMainTabActivity();
                    } else {
                        gotoNearby();
                    }
                }
            }
        }.start();
    }

    // protected void savePrefrerence(ArrayList<Object> result) {
    // SharedPreferences userInfo = getSharedPreferences("UserInfo",
    // Context.MODE_PRIVATE);
    // SharedPreferences.Editor editor = userInfo.edit();
    // editor.putString("userId", result.get(1).toString());
    // AppInfo.userId = result.get(1).toString();
    // if (result.get(2) != null && !"null".equals(result.get(2))) {
    // editor.putString("userName", result.get(2).toString());
    // editor.putString("userGender", result.get(3).toString());
    // editor.putString("userHeight", result.get(4).toString());
    // AppInfo.gender = result.get(3).toString();
    // }
    // editor.commit();
    // }

    protected boolean getPrefrerence() {
        SharedPreferences sp = getSharedPreferences("UserInfo", 0);
        String sessionToken = sp.getString("sessionToken", null);
        String userId = sp.getString("userId", null);
        if (!TextUtils.isEmpty(sessionToken) && !TextUtils.isEmpty(userId)) {
            AppInfo.sessionToken = sessionToken;
            AppInfo.userId = userId;
            AppInfo.gender = sp.getString("userGender", "male");
            AppInfo.userName = sp.getString("userName", "");
            AppInfo.userPhoto = sp.getString("userPhoto", "");
            // AppInfo.setUserCreditCount(sp.getInt("userCreditCount", 0));
            return true;
        } else {
            return false;
        }
    }

    private boolean isFirstOpenApp() {
        SharedPreferences sp = getSharedPreferences("UserInfo", 0);
        return sp.getBoolean("isFirstOpenApp", true);
    }

    private void gotoNearby() {
        Intent intent = new Intent();
        intent.setClass(this, Nearby.class);
        intent.putExtra("isLogin", false);
        startActivity(intent);
        finish();
    }

    private void gotoMainTabActivity() {
        Intent intent = new Intent();
        intent.setClass(this, MainTabActivity.class);
        startActivity(intent);
        finish();
    }

    private void gotoHelpView() {
        Intent intent = new Intent();
        intent.setClass(this, HelpView.class);
        startActivity(intent);
        finish();
    }

    // @Override
    // protected void onDestroy() {
    // super.onDestroy();
    // if (addDeviceTask != null) {
    // addDeviceTask.cancel(true);
    // addDeviceTask = null;
    // }
    // }

}
