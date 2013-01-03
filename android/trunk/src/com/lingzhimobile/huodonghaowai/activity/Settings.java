package com.lingzhimobile.huodonghaowai.activity;

import java.io.File;
import java.util.Date;
import java.util.regex.Matcher;

import org.json.JSONException;
import org.json.JSONObject;

import android.R.anim;
import android.app.AlertDialog;
import android.app.Dialog;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.support.v4.app.FragmentTransaction;
import android.view.KeyEvent;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.asynctask.Bind3rdPartAccountTask;
import com.lingzhimobile.huodonghaowai.asynctask.LogoutTask;
import com.lingzhimobile.huodonghaowai.asynctask.UnbindRenRenAccountTask;
import com.lingzhimobile.huodonghaowai.asynctask.UploadPhotoTask;
import com.lingzhimobile.huodonghaowai.cons.MessageID;
import com.lingzhimobile.huodonghaowai.cons.RenRenLibConst;
import com.lingzhimobile.huodonghaowai.fragment.ProfileFragment;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.util.AppInfo;
import com.lingzhimobile.huodonghaowai.util.AppUtil;
import com.lingzhimobile.huodonghaowai.util.BitmapManager;
import com.lingzhimobile.huodonghaowai.util.FileManager;
import com.lingzhimobile.huodonghaowai.util.GlobalValue;
import com.lingzhimobile.huodonghaowai.view.myProgressDialog;
import com.renren.api.connect.android.Renren;
import com.renren.api.connect.android.exception.RenrenAuthError;
import com.renren.api.connect.android.view.RenrenAuthListener;
import com.umeng.analytics.MobclickAgent;

public class Settings extends HuoDongHaoWaiActivity {

    private Button btnCancel,btnLogout;
    private LinearLayout layoutRenrenBindState;
    private TextView tvRenrenBindState;

    private static final String LocalLogTag = LogTag.ACTIVITY + " Settings";

    private LogoutTask logoutTask;
    private Dialog dialogAskLogout, dialogAskChangeBindWithRenren;
    private myProgressDialog mProgressDialog;


    public Handler myHandler = new Handler() {

        @Override
        public void handleMessage(Message msg) {
            if (Settings.this.isFinishing()) {
                return;
            }
            if (mProgressDialog != null) {
                mProgressDialog.dismiss();
            }
            super.handleMessage(msg);
            int errCode;
            switch (msg.what) {
            case MessageID.LOGOUT_OK:
                getSharedPreferences("UserInfo", 0).edit().remove("userId").commit();
                getSharedPreferences("UserInfo", 0).edit().remove("sessionToken").commit();
                AppInfo.userId = null;
                AppInfo.sessionToken = null;
                GlobalValue.applyDates.clear();
                GlobalValue.sendDates.clear();
                GlobalValue.invitedDates.clear();
                GlobalValue.nearbyDates.clear();
                Intent intent = new Intent();
                intent.setClass(Settings.this, Nearby.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                startActivity(intent);
                setResult(MessageID.LOGOUT_OK);
                finish();
                break;
            case MessageID.Bind3rdPartAccount_OK:
                refreshBindStatusView();
                break;
            case MessageID.Bind3rdPartAccount_FAIL:

                errCode = ((Integer)msg.obj).intValue();
                if (errCode == 21301){//userAlreadyBindThisRenRenAccount

                }else{
                    //not clear renren auth info in AppInfo, let it be done in get
                }
                refreshBindStatusView();
                break;
            case MessageID.UnbindRenRenAccount_OK:

              //not clear renren auth info in AppInfo, let it be done in get
                refreshBindStatusView();
                break;
            case MessageID.UnbindRenRenAccount_FAIL:

                errCode = ((Integer)msg.obj).intValue();
                if (errCode == 21306){//userNotBindRenRenAccount
                  //not clear renren auth info in AppInfo, let it be done in get
                }else{
                    AppUtil.handleErrorCode(msg.obj.toString(), Settings.this);
                }
                refreshBindStatusView();
                break;
            case MessageID.SERVER_RETURN_NULL:
                AppUtil.handleErrorCode(msg.obj.toString(), Settings.this);
                break;
            }
        }
    };

    private void refreshBindStatusView(){
        if (isUserBindWithRenren()){
            tvRenrenBindState.setText(R.string.alreadyBindWithAction);
        }else{
            tvRenrenBindState.setText(R.string.notyetBindWithAction);
        }
    }



    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.settings);
        initViewFields();
        setListener();
        setViewData();
    }


    private boolean isUserBindWithRenren(){
        LogUtils.Logd(LocalLogTag, "Settings isUserBindWithRenren, AppInfo.accountRenRen="+AppInfo.accountRenRen);
        boolean isBind = AppInfo.accountRenRen != null;//TODO MODIFY LOGIC
        return isBind;
    }

    void initViewFields() {
        btnCancel = (Button) findViewById(R.id.btnCancel);
        btnLogout = (Button) findViewById(R.id.btnLogout);
        layoutRenrenBindState = (LinearLayout) findViewById(R.id.layoutRenrenBindState);
        tvRenrenBindState = (TextView) findViewById(R.id.tvRenrenBindState);
        dialogAskLogout = new Dialog(this, R.style.AlertDialog);
        dialogAskChangeBindWithRenren = new Dialog(this, R.style.AlertDialog);


    }
    void setViewData() {
        refreshBindStatusView();
    }
    void setListener() {
        btnCancel.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
        btnLogout.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                showLogoutAlertDialog();
            }
        });
        layoutRenrenBindState.setOnClickListener(new View.OnClickListener(){
            @Override
            public void onClick(View v) {
                showChangeBindDialog();
            }
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
    }

    @Override
    protected void onPause() {
        super.onPause();
        MobclickAgent.onPause(this);
    }

    @Override
    protected void onResume() {
        super.onResume();
        MobclickAgent.onResume(this);
    }


    public void showLogoutAlertDialog() {
        View dialogview = getLayoutInflater().inflate(
                R.layout.spendcreditsdialog, null);
        TextView tvNotify = (TextView) dialogview
                .findViewById(R.id.tvNotifyText);
        tvNotify.setText(R.string.logout_alert);
        Button btnOK = (Button) dialogview.findViewById(R.id.btnOk);
        Button btnCancel = (Button) dialogview.findViewById(R.id.btnCancel);
        btnOK.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                LogUtils.Logd(LocalLogTag, "LogoutAlertDialog btnOK onClick enter");
              //not clear renren auth info in AppInfo, let it be done in get

                logoutTask = new LogoutTask(AppInfo.userId, myHandler
                        .obtainMessage());
                logoutTask.execute();
                dialogAskLogout.dismiss();

                mProgressDialog = myProgressDialog.show(Settings.this, null,
                        R.string.loading);
            }
        });
        btnCancel.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                dialogAskLogout.dismiss();
            }
        });
        if (!dialogAskLogout.isShowing()) {
            dialogAskLogout.setContentView(dialogview);
            dialogAskLogout.show();
        }
    }//showLogoutAlertDialog


    public void showChangeBindDialog() {
        View dialogview = getLayoutInflater().inflate(R.layout.spendcreditsdialog, null);
        TextView tvNotify = (TextView) dialogview.findViewById(R.id.tvNotifyText);
        Button btnOK = (Button) dialogview.findViewById(R.id.btnOk);
        Button btnCancel = (Button) dialogview.findViewById(R.id.btnCancel);
        if (isUserBindWithRenren()){
            tvNotify.setText(R.string.to_unbind_renren_alert);
        }else{
            tvNotify.setText(R.string.to_bind_renren_alert);
            btnOK.setText(R.string.bindNow);
            btnCancel.setText(R.string.notBindNow);
        }

        btnOK.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                dialogAskChangeBindWithRenren.dismiss();

                if (isUserBindWithRenren()){
                    UnbindRenRenAccountTask unbindRenRenAccountTask = new UnbindRenRenAccountTask(AppInfo.userId,myHandler.obtainMessage());
                    unbindRenRenAccountTask.execute();
                    mProgressDialog = myProgressDialog.show(Settings.this, null, R.string.loading);
                }else{
                    final RenrenAuthListener rrAuthlistener = new RenrenAuthListener() {
                        @Override
                        public void onComplete(Bundle values) {
                            LogUtils.Logd(LogTag.RENREN, "RenrenAuthListener.onComplete values=" + values.toString());
                            //can not use getRenrenSdkInstanceForCurrentUser because renren.logout in this function according to not-yet sync data
                            Renren renren = AppInfo.getNonEmptyRenrenSdkInstance(Settings.this);//just get existing renren instance
                            String currentUid = renren.getCurrentUid()+"";
                            String sessionKey = renren.getSessionKey();
                            String accessToken = renren.getAccessToken();
                            String secret = renren.getSecret();
                            String expireTime = renren.getExpireTime()+"";
                            JSONObject renrenAuthObj = new JSONObject();
                            try {
                                renrenAuthObj.put(RenRenLibConst.fieldcommon_session_userId, currentUid);
                                renrenAuthObj.put(RenRenLibConst.fieldcommon_session_key, sessionKey);
                                renrenAuthObj.put(RenRenLibConst.fieldcommon_access_token, accessToken);
                                renrenAuthObj.put(RenRenLibConst.fieldcommon_secret_key, secret);
                                renrenAuthObj.put(RenRenLibConst.fieldcommon_expiration_date, expireTime);
                            } catch (JSONException e) {
                                LogUtils.Loge(LogTag.RENREN,e.getMessage(), e);
                                renrenAuthObj = null;
                            }
                            Bind3rdPartAccountTask bind3rdPartAccountTask = new Bind3rdPartAccountTask(AppInfo.userId, currentUid,renrenAuthObj, myHandler.obtainMessage());
                            bind3rdPartAccountTask.execute();
                            mProgressDialog = myProgressDialog.show(Settings.this, null, R.string.loading);
                        }

                        @Override
                        public void onRenrenAuthError(RenrenAuthError err) {
                            LogUtils.Loge(LogTag.RENREN, "onRenrenAuthError err=" + err.getMessage(),err);
                            dialogAskChangeBindWithRenren.dismiss();
                            runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    Toast.makeText(Settings.this, "renren auth failed",Toast.LENGTH_SHORT).show();
                                }
                            });
                            return;
                        }

                        @Override
                        public void onCancelLogin() {
                            LogUtils.Loge(LogTag.RENREN, "onCancelLogin");
                            dialogAskChangeBindWithRenren.dismiss();
                        }

                        @Override
                        public void onCancelAuth(Bundle values) {
                            LogUtils.Loge(LogTag.RENREN, "onCancelAuth values="+values.toString());
                            dialogAskChangeBindWithRenren.dismiss();
                        }
                    };//rrAuthlistener
                    Renren renren = AppInfo.getRenrenSdkInstanceAtMostPossibleMatchUser(Settings.this);//if renren auth info exist, just use the old
                    renren.authorize(Settings.this, rrAuthlistener);
                }
            }//onClick
        });//btnOK.setOnClickListener
        btnCancel.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                dialogAskChangeBindWithRenren.dismiss();
            }
        });
        if (!dialogAskChangeBindWithRenren.isShowing()) {
            dialogAskChangeBindWithRenren.setContentView(dialogview);
            dialogAskChangeBindWithRenren.show();
        }
    }//showChangeBindDialog

}
