package com.lingzhimobile.tongqu.activity;

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

import com.lingzhimobile.tongqu.R;
import com.lingzhimobile.tongqu.asynctask.SendMessageTask;
import com.lingzhimobile.tongqu.cons.MessageID;
import com.lingzhimobile.tongqu.util.AppInfo;
import com.lingzhimobile.tongqu.util.AppUtil;
import com.lingzhimobile.tongqu.util.GlobalValue;
import com.lingzhimobile.tongqu.view.myProgressDialog;
import com.umeng.analytics.MobclickAgent;

public class WantIn extends Activity {
    private Button btnCancel, btnReply;
    private EditText etMessage;
    private int position;
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
                AppUtil.handleErrorCode(msg.obj.toString(), WantIn.this);
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
        setContentView(R.layout.wantin);
        btnCancel = (Button) findViewById(R.id.btnCancel);
        btnReply = (Button) findViewById(R.id.btnReply);
        etMessage = (EditText) findViewById(R.id.etMessage);
        tvTextNum = (TextView) findViewById(R.id.tvTextNum);
        position = getIntent().getIntExtra("position", 0);
        btnCancel.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                finish();
            }
        });
        btnReply.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                String message = etMessage.getText().toString();
                if (TextUtils.isEmpty(message)) {
                    return;
                }
                mProgressDialog = myProgressDialog.show(WantIn.this, null,
                        R.string.loading);
                new SendMessageTask(AppInfo.userId, message, GlobalValue.nearbyDates.get(
                        position).getDateId(), GlobalValue.nearbyDates
                        .get(position).getSender().getUserId(), position,
                        myHandler.obtainMessage()).execute();
            }
        });
        etMessage.setFocusable(true);
        imm = (InputMethodManager) this
                .getSystemService(Context.INPUT_METHOD_SERVICE);
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
            public void beforeTextChanged(CharSequence s, int start, int count,
                    int after) {
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
