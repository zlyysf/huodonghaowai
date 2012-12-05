package com.lingzhimobile.tongqu.activity;

import java.lang.reflect.Method;

import android.app.ActivityGroup;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.SharedPreferences.Editor;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.view.KeyEvent;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.RadioButton;

import com.google.android.c2dm.C2DMessaging;
import com.lingzhimobile.tongqu.R;
import com.lingzhimobile.tongqu.cons.MessageID;
import com.lingzhimobile.tongqu.cons.MessageType;
import com.lingzhimobile.tongqu.log.LogTag;
import com.lingzhimobile.tongqu.log.LogUtils;
import com.lingzhimobile.tongqu.net.NetProtocol;
import com.lingzhimobile.tongqu.util.AppInfo;
import com.lingzhimobile.tongqu.util.GlobalValue;
import com.umeng.analytics.MobclickAgent;
import com.umeng.update.UmengUpdateAgent;

public class MainTabActivity extends ActivityGroup {
    public static final String APP_ID = "336893939727736";
    private String currentTabType;

    public static final String LOCAL_PUSH_FLAG = "LOCAL_PUSH_FLAG";
    private boolean registered;
    public static MainTabActivity instance;
    private boolean isInit = false;
    public static boolean pushAvailable;
    public static Object selectedAccount;

    public static final String STRING_NEARBY = "nearby";
    public static final String STRING_DATE = "date";
    public static final String STRING_PROFILE = "profile";
    public static final String STRING_PROPOSEDATE = "proposedate";

    private LinearLayout llViewsContainer;
    private RadioButton rbNearby, rbDate, rbProfile, rbPublish;

    public static String userAgent;

    SharedPreferences userInfo;
    private int needRefreshInDateList;

    public Handler myHanlder = new Handler() {

        @Override
        public void handleMessage(Message msg) {
            switch (msg.what) {
            case MessageID.LOGOUT_OK:
                instance.getSharedPreferences("UserInfo", 0).edit()
                        .remove("userId").commit();
                instance.getSharedPreferences("UserInfo", 0).edit()
                        .remove("sessionToken").commit();
                AppInfo.userId = null;
                AppInfo.sessionToken = null;
                GlobalValue.applyDates.clear();
                GlobalValue.sendDates.clear();
                GlobalValue.invitedDates.clear();
                GlobalValue.nearbyDates.clear();
                Intent intent = new Intent();
                intent.setClass(MainTabActivity.this, Nearby.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                startActivity(intent);
                instance.finish();
                break;
            }
        }

    };

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        MobclickAgent.onError(this);
        LogUtils.Loge("newIntent", "onCreate");
        setContentView(R.layout.main);
        instance = this;
        AppInfo.init(this.getApplicationContext());
        UmengUpdateAgent.update(this);
        UmengUpdateAgent.setUpdateOnlyWifi(false);
        // UmengUpdateAgent.setUpdateListener(new UmengUpdateListener() {
        // @Override
        // public void onUpdateReturned(int updateStatus,UpdateResponse
        // updateInfo) {
        // switch (updateStatus) {
        // case 0: // has update
        // Toast.makeText(MainTabActivity.this, "有更新", Toast.LENGTH_SHORT)
        // .show();
        // UmengUpdateAgent.showUpdateDialog(MainTabActivity.this, updateInfo);
        // break;
        // case 1: // has no update
        // Toast.makeText(MainTabActivity.this, "没有更新", Toast.LENGTH_SHORT)
        // .show();
        // break;
        // case 2: // none wifi
        // Toast.makeText(MainTabActivity.this, "没有wifi连接， 只在wifi下更新",
        // Toast.LENGTH_SHORT)
        // .show();
        // break;
        // case 3: // time out
        // Toast.makeText(MainTabActivity.this, "超时", Toast.LENGTH_SHORT)
        // .show();
        // break;
        // }
        // }
        // });
        pushAvailable = getPackageManager().resolveService(
                new Intent("com.google.android.c2dm.intent.REGISTER"), 0) != null;
        this.delayRegister();
        llViewsContainer = (LinearLayout) findViewById(R.id.llViewsContainer);
        rbNearby = (RadioButton) findViewById(R.id.RadioButton01);
        rbPublish = (RadioButton) findViewById(R.id.RadioButton02);
        rbDate = (RadioButton) findViewById(R.id.RadioButton03);
        rbProfile = (RadioButton) findViewById(R.id.RadioButton04);
        setListener();
        userInfo = getSharedPreferences("UserInfo", Context.MODE_PRIVATE);
        AppInfo.userId = userInfo.getString("userId", "");
        AppInfo.userName = userInfo.getString("userName", "");
        AppInfo.userPhoto = userInfo.getString("userPhoto", "");
        AppInfo.gender = userInfo.getString("userGender", "");
        AppInfo.bloodType = userInfo.getString("bloodType", "");
        AppInfo.constellation = userInfo.getString("constellation", "");
        AppInfo.hometown = userInfo.getString("hometown", "");
        AppInfo.department = userInfo.getString("department", "");
        AppInfo.school = userInfo.getString("school", "");
        AppInfo.description = userInfo.getString("description", "");
        AppInfo.educationalStatus = userInfo.getString("educationalStatus", "");
        AppInfo.height = userInfo.getInt("height", 0);
        processExtraData(getIntent());
        // rbNearby.performClick();
    }

    private void setListener() {

        rbNearby.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                if (currentTabType == STRING_NEARBY) {
                    return;
                }
                llViewsContainer.removeAllViews();
                llViewsContainer
                        .addView(getLocalActivityManager()
                                .startActivity(
                                        STRING_NEARBY,
                                        new Intent(MainTabActivity.this,
                                                Nearby.class)
                                                .putExtra("isLogin", true)
                                                .addFlags(
                                                        Intent.FLAG_ACTIVITY_SINGLE_TOP))
                                .getDecorView());
                // getLocalActivityManager().destroyActivity(currentTabType,
                // true);
                currentTabType = STRING_NEARBY;
            }
        });

        rbProfile.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                if (currentTabType == STRING_PROFILE) {
                    return;
                }
                llViewsContainer.removeAllViews();
                Intent intent = new Intent(MainTabActivity.this, Profile.class)
                        .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
                llViewsContainer.addView(getLocalActivityManager()
                        .startActivity(STRING_PROFILE, intent).getDecorView());
                // getLocalActivityManager().destroyActivity(currentTabType,
                // true);
                currentTabType = STRING_PROFILE;
            }
        });

        rbDate.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                if (currentTabType == STRING_DATE) {
                    return;
                }
                llViewsContainer.removeAllViews();
                Intent intent = new Intent(MainTabActivity.this, DateList.class)
                        .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
                intent.putExtra("dateType", needRefreshInDateList);
                llViewsContainer.addView(getLocalActivityManager()
                        .startActivity(STRING_DATE, intent).getDecorView());
                needRefreshInDateList = -1;
                // getLocalActivityManager().destroyActivity(currentTabType,
                // true);
                currentTabType = STRING_DATE;
            }
        });

        rbPublish.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                if (currentTabType == STRING_PROPOSEDATE) {
                    return;
                }
                llViewsContainer.removeAllViews();
                Intent intent = new Intent(MainTabActivity.this,
                        DateTitleList.class)
                        .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP);
                llViewsContainer.addView(getLocalActivityManager()
                        .startActivity(STRING_PROPOSEDATE, intent)
                        .getDecorView());
                // getLocalActivityManager().destroyActivity(currentTabType,
                // true);
                currentTabType = STRING_PROPOSEDATE;
            }
        });

    }

    private void unregister() {
        if (registered) {
            LogUtils.Logd(LogTag.PUSH, "unregister()");
            C2DMessaging.unregister(this);
            LogUtils.Logd(LogTag.PUSH, "unregister() done");
        }
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (getLocalActivityManager().getCurrentActivity().onKeyDown(
                event.getKeyCode(), event)) {
            return true;
        } else {
            return super.dispatchKeyEvent(event);
        }

    }

    public void onRegistered() {
        LogUtils.Logd(LogTag.PUSH, "onRegistered");
        registered = true;
    }

    public void onUnregistered() {
        LogUtils.Logd(LogTag.PUSH, "onUnregistered");
        registered = false;
    }

    private void register() {
        if (registered)
            return;
        else {
            LogUtils.Logd(LogTag.PUSH, "register()");
            C2DMessaging.register(this, NetProtocol.C2DM_SENDER);
            GlobalValue.pushFlag = true;
            savePushFlag();
            LogUtils.Logd(LogTag.PUSH, "register() done");

        }
    }

    private void savePushFlag() {
        SharedPreferences sp = getSharedPreferences(LOCAL_PUSH_FLAG, 0);
        Editor editor = sp.edit();
        editor.putBoolean("pushFlag", GlobalValue.pushFlag);
        editor.commit();
    }

    private void delayRegister() {
        if (myHanlder == null) {
            return;
        }
        myHanlder.postDelayed(new Runnable() {
            public void run() {
                if (!isInit) {
                    if (pushAvailable) {
                        AppInfo.init(instance);
                        selectedAccount = getFirstAccount();
                        if (selectedAccount != null) {
                            register();
                        }
                    }
                    isInit = true;
                }
            };
        }, 500);
    }

    private Object getFirstAccount() {
        Object accountManager = null;
        try {
            Class AccountManager = Class
                    .forName("android.accounts.AccountManager");
            Method getMethod = AccountManager.getMethod("get", Context.class);
            accountManager = getMethod.invoke(null, this);

            Method getAccountsMethod = AccountManager.getMethod(
                    "getAccountsByType", String.class);
            Object accounts[] = (Object[]) getAccountsMethod.invoke(
                    accountManager, "com.google");
            if (accounts.length <= 0) {
                return null;
            }
            return accounts[0];
        } catch (Exception e) {
            LogUtils.Logd(LogTag.EXCEPTION, e.getMessage(), e);
        }
        return null;
    }

    @Override
    protected void onNewIntent(Intent intent) {
        LogUtils.Loge("newIntent", "onNewIntent");
        super.onNewIntent(intent);
        processExtraData(intent);

    }

    private void processExtraData(Intent intent) {
        // AppUtil.facebook = new Facebook(APP_ID);
        // AppUtil.mAsyncRunner = new AsyncFacebookRunner(AppUtil.facebook);
        // SessionStore.restoreFacebook(AppUtil.facebook, this);
        if (intent != null
                && intent.getBooleanExtra("isJumpFromNotification", false)) {
            LogUtils.Logi("dateType_mainTab",
                    intent.getIntExtra("dateType", -1) + "");
            int notificationType = intent.getIntExtra("notificationType", -1);
            if (notificationType == MessageType.PUSH_CONFRIMDATE
                    || notificationType == MessageType.PUSH_CANCELDATE) {
                if (currentTabType != STRING_DATE) {
                    needRefreshInDateList = intent.getIntExtra("dateType", -1);
                    rbDate.performClick();
                } else {
                    DateList.instance.myHandler.obtainMessage(
                            MessageID.CONFIRM_DATE_OK,
                            intent.getIntExtra("dateType", -1), 0)
                            .sendToTarget();
                }

            } else {
                rbDate.performClick();
            }
        } else {
            rbNearby.performClick();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        // if(AppUtil.facebook != null) {
        // if (AppUtil.facebook.isSessionValid()) {
        // AppUtil.facebook.extendAccessTokenIfNeeded(this, null);
        // }
        // }
    }

}
