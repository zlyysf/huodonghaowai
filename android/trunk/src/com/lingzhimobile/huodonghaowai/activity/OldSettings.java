package com.lingzhimobile.huodonghaowai.activity;

import java.util.HashMap;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.ProgressDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.view.View;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.CompoundButton;
import android.widget.CompoundButton.OnCheckedChangeListener;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.asynctask.LogoutTask;
import com.lingzhimobile.huodonghaowai.cons.MessageID;
import com.lingzhimobile.huodonghaowai.util.AppInfo;
import com.lingzhimobile.huodonghaowai.util.AppUtil;
import com.lingzhimobile.huodonghaowai.util.GlobalValue;
import com.lingzhimobile.huodonghaowai.util.SessionStore;
import com.weibo.net.AccessToken;
import com.weibo.net.Weibo;
import com.weibo.net.WeiboDialogListener;
import com.weibo.net.WeiboException;

public class OldSettings extends Activity {
    final int AUTHORIZE_ACTIVITY_RESULT_CODE = 100;

    private ImageView ivBack;
    private LinearLayout llFacebook, llLogout, llSinaWeibo;
    String[] permissions = { "offline_access", "publish_stream", "user_photos",
            "publish_checkins", "photo_upload" };
    private LogoutTask logoutTask;
    private ProgressDialog progressDialog;
    private CheckBox cbSinaweibo;
    private EditText etStudentNO,etDepartment,etDescription,etHomeTown;
    private TextView tvConstellation, tvEduStatus;
    private Button btnSave;

    private String tempStuNO,tempDepartment,tempDescription,tempEduStatus,tempConstellation,tempHomeTown;
    private final HashMap<String,String> values = new HashMap<String,String>();

    public Handler myHandler = new Handler() {

        @Override
        public void handleMessage(Message msg) {
            if (OldSettings.this.isFinishing()) {
                return;
            }
            progressDialog.dismiss();
            switch (msg.what) {
            case MessageID.LOGOUT_OK:
                getSharedPreferences("UserInfo", 0).edit().remove("userId")
                        .commit();
                getSharedPreferences("UserInfo", 0).edit().remove("email")
                        .commit();
                AppInfo.userId = null;
                Intent intent = new Intent();
                intent.setClass(OldSettings.this, Nearby.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                startActivity(intent);
                OldSettings.this.finish();
//                Profile.instance.finish();
                break;
            case MessageID.SERVER_RETURN_NULL:
                AppUtil.handleErrorCode(msg.obj.toString(), OldSettings.this);
                break;
            case MessageID.UPDATE_PROFILE_OK:
//                Profile.instance.currentUser.setConstellation(tempConstellation);
//                Profile.instance.currentUser.setDepartment(tempDepartment);
//                Profile.instance.currentUser.setEducationalStatus(tempEduStatus);
//                Profile.instance.currentUser.setStudentNo(tempStuNO);
//                Profile.instance.currentUser.setDescription(tempDescription);
//                Profile.instance.currentUser.setHometown(tempHomeTown);
//                Profile.instance.myHandler.sendEmptyMessage(MessageID.UPDATE_PROFILE_OK);
                break;
            }
        }

    };

    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.oldsetting);
        findView();
        setListener();
        initData();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if(Weibo.getInstance().isSessionValid()){
            cbSinaweibo.setChecked(true);
        }else{
            cbSinaweibo.setChecked(false);
        }
    }

    private void findView() {
        ivBack = (ImageView) findViewById(R.id.ivBack);
        llFacebook = (LinearLayout) findViewById(R.id.llFacebook);
        llLogout = (LinearLayout) findViewById(R.id.llLogout);
        llSinaWeibo = (LinearLayout) findViewById(R.id.llWeibo);
        cbSinaweibo = (CheckBox) findViewById(R.id.cbSinaWeibo);
        tvConstellation = (TextView) findViewById(R.id.constellationTextView);
        etDepartment = (EditText) findViewById(R.id.departmentEditText);
        etDescription = (EditText) findViewById(R.id.descriptionEditText);
        tvEduStatus = (TextView) findViewById(R.id.eduStatusTextView);
        etHomeTown = (EditText) findViewById(R.id.homeTownEditText);
        etStudentNO = (EditText) findViewById(R.id.stuNOEditText);
        btnSave = (Button) findViewById(R.id.btnSave);
    }
    private void initData(){
//        tvConstellation.setText(Profile.instance.currentUser.getConstellation());
//        etDepartment.setText(Profile.instance.currentUser.getDepartment());
//        etDescription.setText(Profile.instance.currentUser.getDescription());
//        tvEduStatus.setText(Profile.instance.currentUser.getEducationalStatus());
//        etHomeTown.setText(Profile.instance.currentUser.getHometown());
//        etStudentNO.setText(Profile.instance.currentUser.getStudentNo());
//        if(!TextUtils.isEmpty(Profile.instance.currentUser.getStudentNo())){
//            etStudentNO.setEnabled(false);
//        }
        tvEduStatus.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                AlertDialog dialog = new AlertDialog.Builder(OldSettings.this)
                .setTitle(R.string.educationalStatus)
                .setSingleChoiceItems(R.array.edu_status_values, 0,
                        new DialogInterface.OnClickListener() {

                            @Override
                            public void onClick(DialogInterface dialog,
                                    int which) {
                                tempEduStatus = getResources().getStringArray(R.array.edu_status_values)[which];
                            }
                        })
                .setPositiveButton(R.string.OK,
                        new DialogInterface.OnClickListener() {

                            @Override
                            public void onClick(DialogInterface dialog,
                                    int which) {
                                tvEduStatus.setText(tempEduStatus);
                            }
                        }).setNegativeButton(R.string.Cancel, null).create();
                dialog.show();
            }
        });
        tvConstellation.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                AlertDialog dialog = new AlertDialog.Builder(OldSettings.this)
                .setTitle(R.string.constellation)
                .setSingleChoiceItems(R.array.constellation_values, 0,
                        new DialogInterface.OnClickListener() {

                            @Override
                            public void onClick(DialogInterface dialog,
                                    int which) {
                                tempConstellation = getResources().getStringArray(R.array.constellation_values)[which];
                            }
                        })
                .setPositiveButton(R.string.OK,
                        new DialogInterface.OnClickListener() {

                            @Override
                            public void onClick(DialogInterface dialog,
                                    int which) {
                                tvConstellation.setText(tempConstellation);
                            }
                        }).setNegativeButton(R.string.Cancel, null).create();
                dialog.show();

            }
        });
    }

    private void setListener() {
        ivBack.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                finish();
            }
        });

//        llFacebook.setOnClickListener(new View.OnClickListener() {
//
//            @Override
//            public void onClick(View v) {
//                if (AppUtil.facebook == null) {
//                    AppUtil.facebook = new Facebook(GlobalValue.APP_ID);
//                }
//                if (!AppUtil.facebook.isSessionValid()) {
//
//                    AppUtil.facebook.authorize(Settings.this, permissions,
//                            AUTHORIZE_ACTIVITY_RESULT_CODE,
//                            new DialogListener() {
//                                @Override
//                                public void onComplete(Bundle values) {
//                                    SessionStore.saveFacebook(AppUtil.facebook,
//                                            Settings.this);
//                                }
//
//                                @Override
//                                public void onCancel() {
//                                }
//
//                                @Override
//                                public void onFacebookError(FacebookError e) {
//                                    // TODO Auto-generated method stub
//
//                                }
//
//                                @Override
//                                public void onError(DialogError e) {
//                                    // TODO Auto-generated method stub
//
//                                }
//                            });
//                } else {
//                    Intent intent = new Intent();
//                    intent.setClass(Settings.this, OptionsFacebook.class);
//                    startActivity(intent);
//                }
//            }
//        });

        llLogout.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                progressDialog = ProgressDialog.show(OldSettings.this, null,
                        "Loading...");
                logoutTask = new LogoutTask(AppInfo.userId, myHandler
                        .obtainMessage());
                logoutTask.execute();
            }
        });
        cbSinaweibo.setOnCheckedChangeListener(new OnCheckedChangeListener() {

            @Override
            public void onCheckedChanged(CompoundButton buttonView,
                    boolean isChecked) {
                if(isChecked){
                    Weibo weibo = Weibo.getInstance();
                    SessionStore.restoreSinaWeibo(weibo, OldSettings.this);
                    if (!weibo.isSessionValid()) {
                        weibo.setupConsumerConfig(GlobalValue.CONSUMER_KEY,
                                GlobalValue.CONSUMER_SECRET);
                        weibo.setRedirectUrl(GlobalValue.REDIRECT_RUL);
                        weibo.authorize(OldSettings.this, new AuthDialogListener());
                    }
                }else{
                    SessionStore.clearSinaWeibo(OldSettings.this);
                }
            }
        });
        llSinaWeibo.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
               cbSinaweibo.performClick();
            }
        });
//        btnSave.setOnClickListener(new View.OnClickListener() {
//
//            @Override
//            public void onClick(View v) {
//                tempStuNO = etStudentNO.getText().toString();
//                if(!tempStuNO.equals(Profile.instance.currentUser.getStudentNo())){
//                    values.put("studentNO", tempStuNO);
//                }
//                tempConstellation = tvConstellation.getText().toString();
//                if(!tempConstellation.equals(Profile.instance.currentUser.getConstellation())){
//                    values.put("constellation", tempConstellation);
//                }
//                tempDepartment = etDepartment.getText().toString();
//                if(!tempDepartment.equals(Profile.instance.currentUser.getDepartment())){
//                    values.put("department", tempDepartment);
//                }
//                tempDescription = etDescription.getText().toString();
//                if(!tempDescription.equals(Profile.instance.currentUser.getDescription())){
//                    values.put("description", tempDescription);
//                }
//                tempEduStatus = tvEduStatus.getText().toString();
//                if(!tempEduStatus.equals(Profile.instance.currentUser.getEducationalStatus())){
//                    values.put("educationalStatus", tempEduStatus);
//                }
//                tempHomeTown = etHomeTown.getText().toString();
//                if(!tempHomeTown.equals(Profile.instance.currentUser.getHometown())){
//                    values.put("hometown", tempHomeTown);
//                }
//                if(values.isEmpty()){
//                    return;
//                }
//                progressDialog = ProgressDialog.show(Settings.this, null,
//                        "Loading...");
//                UpdateProfileTask updateProfileTask = new UpdateProfileTask(values, myHandler.obtainMessage());
//                updateProfileTask.execute();
//            }
//        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == AUTHORIZE_ACTIVITY_RESULT_CODE) {
            AppUtil.facebook.authorizeCallback(requestCode, resultCode, data);
        }

    }

    class AuthDialogListener implements WeiboDialogListener {

        @Override
        public void onComplete(Bundle values) {
            String token = values.getString("access_token");
            String expires_in = values.getString("expires_in");
            AccessToken accessToken = new AccessToken(token,
                    GlobalValue.CONSUMER_SECRET);
            accessToken.setExpiresIn(expires_in);
            Weibo.getInstance().setAccessToken(accessToken);
            SessionStore.saveSinaWeibo(Weibo.getInstance(), OldSettings.this);
        }

        @Override
        public void onCancel() {
            cbSinaweibo.setChecked(false);
        }

        @Override
        public void onWeiboException(WeiboException e) {
            Toast.makeText(getApplicationContext(),
                    "Auth exception : " + e.getMessage(), Toast.LENGTH_SHORT)
                    .show();
        }

        @Override
        public void onError(com.weibo.net.DialogError e) {

        }


    }

}
