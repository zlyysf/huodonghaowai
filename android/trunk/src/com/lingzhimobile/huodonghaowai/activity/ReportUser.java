package com.lingzhimobile.huodonghaowai.activity;

import java.util.Timer;
import java.util.TimerTask;

import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.asynctask.ReportUserTask;
import com.lingzhimobile.huodonghaowai.cons.MessageID;
import com.lingzhimobile.huodonghaowai.util.AppInfo;
import com.lingzhimobile.huodonghaowai.util.AppUtil;

import com.lingzhimobile.huodonghaowai.view.myProgressDialog;
import com.umeng.analytics.MobclickAgent;

public class ReportUser extends Activity {
    private Button btnCancel, btnSend;
    private EditText etMessage;
    private String targetUserId;
    private myProgressDialog mProgressDialog;
    private InputMethodManager imm;
    private TextView tvTextNum;

    public Handler myHandler = new Handler() {

        @Override
        public void handleMessage(Message msg) {
            super.handleMessage(msg);
            if (mProgressDialog != null) {
                mProgressDialog.dismiss();
            }
            switch (msg.what) {
            case MessageID.SERVER_RETURN_NULL:
                AppUtil.handleErrorCode(msg.obj.toString(), ReportUser.this);
                break;
            case MessageID.SEND_MESSAGE_OK:
                finish();
                break;
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.reportuser);
        btnCancel = (Button) findViewById(R.id.btnCancel);
        btnSend = (Button) findViewById(R.id.btnSend);
        etMessage = (EditText) findViewById(R.id.etMessage);
        tvTextNum = (TextView) findViewById(R.id.tvTextNum);
        targetUserId = getIntent().getStringExtra("targetUserId");
        btnCancel.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });
        btnSend.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String message = etMessage.getText().toString();
                if (TextUtils.isEmpty(message)) {
                    return;
                }
                mProgressDialog = myProgressDialog.show(ReportUser.this, null, R.string.loading);
                ReportUserTask taskObj = new ReportUserTask(AppInfo.userId, message,
                		targetUserId,
                        myHandler.obtainMessage());
                taskObj.execute();
            }
        });
        etMessage.setFocusable(true);
        imm = (InputMethodManager) this.getSystemService(Context.INPUT_METHOD_SERVICE);
        Timer timer = new Timer();
        timer.schedule(new TimerTask(){
            @Override
            public void run() {
             imm.toggleSoftInput(0, InputMethodManager.HIDE_NOT_ALWAYS);
            }
        }, 100);
        etMessage.addTextChangedListener(new TextWatcher() {
            private CharSequence temp;
            private int selectionStart ;
            private int selectionEnd ;
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
            }

            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {
                temp = s;
            }

            @Override
            public void afterTextChanged(Editable s) {
                selectionStart = etMessage.getSelectionStart();
                selectionEnd = etMessage.getSelectionEnd();
                if (temp.length() > 140) {
                    s.delete(selectionStart-1, selectionEnd);
                    int tempSelection = selectionEnd;
                    etMessage.setText(s);
                    etMessage.setSelection(tempSelection);
                }
                tvTextNum.setText(s.length()+"/140");
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

}
