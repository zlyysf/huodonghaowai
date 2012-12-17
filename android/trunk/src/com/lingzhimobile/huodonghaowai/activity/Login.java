package com.lingzhimobile.huodonghaowai.activity;

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

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.asynctask.LoginTask;
import com.lingzhimobile.huodonghaowai.cons.MessageID;
import com.lingzhimobile.huodonghaowai.net.NetProtocol;
import com.lingzhimobile.huodonghaowai.util.AppInfo;
import com.lingzhimobile.huodonghaowai.util.AppUtil;
import com.lingzhimobile.huodonghaowai.view.myProgressDialog;
import com.umeng.analytics.MobclickAgent;

public class Login extends Activity {
    private EditText etEmail, etPassword;
    private Button btnLogin,btnBack;
    private LinearLayout llForgotPassword;
    private LoginTask loginTask;
    private InputMethodManager imm;
    private String email;
    private myProgressDialog prgressDialog;

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
    }

    protected void savePrefrerence() {
        SharedPreferences userInfo = getSharedPreferences("UserInfo",
                Context.MODE_PRIVATE);
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
    }

}
