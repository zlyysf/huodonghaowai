package com.lingzhimobile.huodonghaowai.activity;

import java.util.ArrayList;
import java.util.Timer;
import java.util.TimerTask;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.KeyEvent;
import android.view.View;
import android.view.View.OnKeyListener;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.Toast;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.asynctask.LoginTask;
import com.lingzhimobile.huodonghaowai.cons.MessageID;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.net.NetProtocol;
import com.lingzhimobile.huodonghaowai.util.AppInfo;
import com.lingzhimobile.huodonghaowai.util.AppUtil;
import com.lingzhimobile.huodonghaowai.view.myProgressDialog;
import com.renren.api.connect.android.AsyncRenren;
import com.renren.api.connect.android.Renren;
import com.renren.api.connect.android.common.AbstractRequestListener;
import com.renren.api.connect.android.exception.RenrenAuthError;
import com.renren.api.connect.android.exception.RenrenError;
import com.renren.api.connect.android.users.UserInfo;
import com.renren.api.connect.android.users.UserInfo.HomeTownLocation;
import com.renren.api.connect.android.users.UserInfo.UniversityInfo;
import com.renren.api.connect.android.users.UsersGetInfoRequestParam;
import com.renren.api.connect.android.view.RenrenAuthListener;
import com.renren.api.connect.android.users.UsersGetInfoResponseBean;
import com.umeng.analytics.MobclickAgent;

public class Login extends Activity {

	private static final String RENREN_API_KEY = "9990cedd27604053936093cc8774b604";
	private static final String RENREN_SECRET_KEY = "7c35df3722cc4263bc5f62f0bc1343be";
	private static final String RENREN_APP_ID = "221243";
	public static final int RENRENSIGNUP = 110;

	private static final String LocalLogTag = LogTag.ACTIVITY + " Login";

    private EditText etEmail, etPassword;
    private Button btnLogin,btnBack,btnRenRenLogin;
    private LinearLayout llForgotPassword;
    private LoginTask loginTask;
    private InputMethodManager imm;
    private String email;
    private myProgressDialog prgressDialog;
    private Renren renren;

    public Handler myHandler = new Handler() {

        @Override
        public void handleMessage(Message msg) {
            super.handleMessage(msg);
            switch (msg.what) {
            case MessageID.SERVER_RETURN_NULL:
                prgressDialog.dismiss();
                AppUtil.handleErrorCode(msg.obj.toString(), Login.this);
                break;
            case MessageID.LOGIN_OK:
                prgressDialog.dismiss();
                savePrefrerence();
                setResult(MessageID.LOGIN_OK);
                finish();
                break;
            }
        }
    };


    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LogUtils.Logi(LogTag.ACTIVITY, "Login onCreate");
        renren = new Renren(RENREN_API_KEY, RENREN_SECRET_KEY, RENREN_APP_ID, this);

        setContentView(R.layout.login);
        imm = (InputMethodManager)getSystemService(Context.INPUT_METHOD_SERVICE);
        etEmail = (EditText) findViewById(R.id.emailEditText);
        SharedPreferences sp = getSharedPreferences("UserInfo", 0);
        etEmail.setText(sp.getString("email", ""));
        etPassword = (EditText) findViewById(R.id.passwordEditText);
        etEmail.addTextChangedListener(new TextWatcher() {

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {

            }

            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {

            }

            @Override
            public void afterTextChanged(Editable s) {
                if(!TextUtils.isEmpty(s.toString().trim()) && !TextUtils.isEmpty(etPassword.getText().toString())){
                    btnLogin.setEnabled(true);
                }else{
                    btnLogin.setEnabled(false);
                }
            }
        });
        etPassword.addTextChangedListener(new TextWatcher() {

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {

            }

            @Override
            public void beforeTextChanged(CharSequence s, int start, int count,
                    int after) {

            }

            @Override
            public void afterTextChanged(Editable s) {
                if(!TextUtils.isEmpty(s.toString().trim()) && !TextUtils.isEmpty(etPassword.getText().toString())){
                    btnLogin.setEnabled(true);
                }else{
                    btnLogin.setEnabled(false);
                }
            }
        });
        btnLogin = (Button) findViewById(R.id.enterButton);
        btnLogin.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                email = etEmail.getText().toString().trim();
                String password = etPassword.getText().toString().trim();
                if("".equals(email) || "".equals(password)){
                    return;
                }
                imm.hideSoftInputFromWindow(getCurrentFocus().getWindowToken(), 0);
                loginTask = new LoginTask(email, password, myHandler.obtainMessage());
                loginTask.execute();
                prgressDialog = myProgressDialog.show(Login.this, null, R.string.loading);
            }
        });

        final RenrenAuthListener rrAuthlistener = new RenrenAuthListener() {
			@Override
			public void onComplete(Bundle values) {
				LogUtils.Logd(LogTag.RENREN, "RenrenAuthListener.onComplete values=" + values.toString());
				String currentUid = renren.getCurrentUid()+"";
				AsyncRenren asyncRenren = new AsyncRenren(renren);
				String[] uids = new String[1];
				uids[0] = currentUid;
				UsersGetInfoRequestParam param = new UsersGetInfoRequestParam(uids,UsersGetInfoRequestParam.FIELDS_ALL);
				AbstractRequestListener<UsersGetInfoResponseBean> renrenCallApiListener = new AbstractRequestListener<UsersGetInfoResponseBean>() {

					@Override
					public void onComplete(final UsersGetInfoResponseBean bean) {
						runOnUiThread(new Runnable() {
							@Override
							public void run() {
								//LogUtils.Logd(LogTag.RENREN, "AbstractRequestListener<UsersGetInfoResponseBean>.onComplete bean=" + bean.toString());
								Intent intent = new Intent(Login.this, AskInfo.class);
						    	intent.putExtra(Renren.RENREN_LABEL, renren);

						    	ArrayList<UserInfo> aryUser = bean.getUsersInfo();
								UserInfo renrenUser = aryUser.get(0);
								LogUtils.Logd(LogTag.RENREN, "AbstractRequestListener<UsersGetInfoResponseBean>.onComplete user0=" + renrenUser.toString()  );
						    	String renrenUserName, renrenSex, renrenUserHometown=null, renrenUnverseName=null;
						    	renrenUserName = renrenUser.getName();
						    	intent.putExtra("renrenUserName", renrenUserName);
						    	renrenSex = renrenUser.getSex()+"";
						    	intent.putExtra("renrenSex", renrenSex);
						    	ArrayList<HomeTownLocation> homeTownLocAry = renrenUser.getHomeTownLocation();
						    	if (homeTownLocAry != null && homeTownLocAry.size()>0){
						    		HomeTownLocation homeTownLoc = homeTownLocAry.get(0);
						    		renrenUserHometown = homeTownLoc.getProvince();
						    		intent.putExtra("renrenHometown", renrenUserHometown);
						    	}
						    	ArrayList<UniversityInfo> aryUnv = renrenUser.getUniversityInfo();
						    	if (aryUnv != null && aryUnv.size() > 0){
						    		UniversityInfo unv = aryUnv.get(aryUnv.size()-1);
						    		renrenUnverseName = unv.getName();
						    		intent.putExtra("renrenUnverseName", renrenUnverseName);
						    	}

						    	startActivityForResult(intent, RENRENSIGNUP);
							}
						});
					}

					@Override
					public void onRenrenError(final RenrenError renrenError) {
						runOnUiThread(new Runnable() {

							@Override
							public void run() {
								LogUtils.Logd(LogTag.RENREN, "AbstractRequestListener<UsersGetInfoResponseBean>.onRenrenError err=" + renrenError.toString());
								Toast.makeText(Login.this, "renren api err",Toast.LENGTH_SHORT).show();
							}
						});
					}

					@Override
					public void onFault(final Throwable fault) {
						runOnUiThread(new Runnable() {

							@Override
							public void run() {
								LogUtils.Logd(LogTag.RENREN, "AbstractRequestListener<UsersGetInfoResponseBean>.onFault fault=" + fault.toString());
								Toast.makeText(Login.this, "renren api fault",Toast.LENGTH_SHORT).show();
							}
						});
					}
				};
				asyncRenren.getUsersInfo(param, renrenCallApiListener);
			}

			@Override
			public void onRenrenAuthError(RenrenAuthError renrenAuthError) {
				renrenAuthError.printStackTrace();
				LogUtils.Loge(LogTag.RENREN, "onRenrenAuthError err=" + renrenAuthError.toString());
				Toast.makeText(Login.this, "renren auth failed",Toast.LENGTH_SHORT).show();
                return;
			}

			@Override
			public void onCancelLogin() {
			}

			@Override
			public void onCancelAuth(Bundle values) {
			}

		};

        btnRenRenLogin = (Button) findViewById(R.id.renrenLoginButton);
        btnRenRenLogin.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
            	LogUtils.Loge(LogTag.RENREN, "btnRenRenLogin onclick enter");
            	renren.logout(Login.this);
            	renren.authorize(Login.this, rrAuthlistener);
            	LogUtils.Loge(LogTag.RENREN, "btnRenRenLogin onclick exit");
            }
        });

        etPassword.setOnKeyListener(new OnKeyListener() {

            @Override
            public boolean onKey(View arg0, int arg1, KeyEvent arg2) {
                if (arg1 == KeyEvent.KEYCODE_ENTER
                        && arg2.getAction() == KeyEvent.ACTION_UP) {
                    btnLogin.performClick();
                }
                return false;
            }
        });
        btnBack = (Button) findViewById(R.id.btnCancel);
        btnBack.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                finish();
            }
        });
        etEmail.setFocusable(true);
        Timer timer = new Timer();
        timer.schedule(new TimerTask(){
            @Override
            public void run() {
             imm.toggleSoftInput(0, InputMethodManager.HIDE_NOT_ALWAYS);
            }
        }, 300);
        llForgotPassword = (LinearLayout) findViewById(R.id.llForgotPassword);
        llForgotPassword.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                Uri uri = Uri.parse(NetProtocol.HTTP_REQUEST_URL+"web/requestResetPassword");
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                startActivity(intent);
            }
        });

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
        renren.init(this);
    }

    protected void savePrefrerence() {
        SharedPreferences userInfo = getSharedPreferences("UserInfo",Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = userInfo.edit();
        editor.putString("userName", AppInfo.userName);
        editor.putString("userId", AppInfo.userId);
        editor.putString("userGender", AppInfo.gender);
        editor.putString("userPhoto", AppInfo.userPhoto);
        editor.putString("constellation", AppInfo.constellation);
        editor.putString("hometown", AppInfo.hometown);
        editor.putString("bloodType", AppInfo.bloodType);
        editor.putString("department", AppInfo.department);
        editor.putString("school", AppInfo.school);
        editor.putInt("height", AppInfo.height);
        editor.putString("educationalStatus", AppInfo.educationalStatus);
        editor.putString("description", AppInfo.description);
        editor.putString("email", email);
        editor.putString("sessionToken", AppInfo.sessionToken);
        editor.commit();
        LogUtils.Logd(LocalLogTag, "Login.savePrefrerence AppInfo.userId="+AppInfo.userId);
    }




    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        switch (requestCode) {
         case RENRENSIGNUP:
            if (resultCode == MessageID.REGISTER_OK) {
//                Intent intent = new Intent();
//                intent.setClass(this, MainTabActivity.class);
//                intent.putExtra("isLogin", true);
//                startActivity(intent);

                savePrefrerence();
                setResult(MessageID.REGISTER_OK);
                finish();
            }
            break;
        }
    }

}
