package com.lingzhimobile.tongqu.fragment;

import java.util.ArrayList;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import com.lingzhimobile.tongqu.R;
import com.lingzhimobile.tongqu.activity.AskInfo;
import com.lingzhimobile.tongqu.activity.Login;
import com.lingzhimobile.tongqu.activity.MainTabActivity;
import com.lingzhimobile.tongqu.adapter.PageSwitchAdapter;
import com.lingzhimobile.tongqu.asynctask.GetNearbyDateTask;
import com.lingzhimobile.tongqu.cons.MessageID;
import com.lingzhimobile.tongqu.model.DateListItem;
import com.lingzhimobile.tongqu.util.AppUtil;
import com.lingzhimobile.tongqu.view.ViewFlow;
import com.lingzhimobile.tongqu.view.myProgressDialog;

public class PreLogin extends Fragment {

    private Activity myAcitivity;
    private View currentView;

    public static final int LOGIN = 100;
    public static final int SIGNUP = 101;

    private ArrayList<DateListItem> dates = new ArrayList<DateListItem>();
    private ViewFlow vf;
    private PageSwitchAdapter myPreloginPageSwitchAdapter;
    private Button btnLogin, btnSignup;
    private myProgressDialog mProgressDialog;

    public Handler myHandler = new Handler() {

        @Override
        public void handleMessage(Message msg) {
            super.handleMessage(msg);
            if(myAcitivity.isFinishing()){
                return;
            }
            mProgressDialog.dismiss();
            switch (msg.what) {
            case MessageID.GET_NEARBY_DATE_OK:
                ArrayList<DateListItem> result = (ArrayList<DateListItem>) msg.obj;
                dates.addAll(result);
                myPreloginPageSwitchAdapter.notifyDataSetChanged();
                break;
            case MessageID.SERVER_RETURN_NULL:
                AppUtil.handleErrorCode(msg.obj.toString(), myAcitivity);
                break;
            }

        }

    };

    public static PreLogin newInstance() {
        PreLogin f = new PreLogin();
        Bundle args = new Bundle();
        f.setArguments(args);

        return f;
    }

    @Override
    public void onAttach(Activity activity) {
        super.onAttach(activity);
        this.myAcitivity = activity;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
            Bundle savedInstanceState) {
        currentView = inflater.inflate(R.layout.prelogin, container, false);
        initView();
        initData();
        mProgressDialog = myProgressDialog.show(myAcitivity, null, R.string.loading);
        new GetNearbyDateTask(1, 0, myHandler.obtainMessage()).execute();
        return currentView;
    }

    private void initView() {
        myPreloginPageSwitchAdapter = new PageSwitchAdapter(myAcitivity,
                dates);
        btnLogin = (Button) currentView.findViewById(R.id.btnLogin);
        btnSignup = (Button) currentView.findViewById(R.id.btnSignup);
        vf = (ViewFlow) currentView.findViewById(R.id.viewflow);
        vf.setAdapter(myPreloginPageSwitchAdapter);
    }

    private void initData() {
        btnLogin.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                Intent intent = new Intent();
                intent.setClass(myAcitivity, Login.class);
                startActivityForResult(intent, LOGIN);
            }
        });
        btnSignup.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                Intent intent = new Intent();
                intent.setClass(myAcitivity, AskInfo.class);
                startActivityForResult(intent, SIGNUP);
            }
        });
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        switch (requestCode) {
        case LOGIN:
        case SIGNUP:
            if (resultCode == MessageID.LOGIN_OK || resultCode == MessageID.REGISTER_OK) {
                Intent intent = new Intent();
                intent.setClass(myAcitivity, MainTabActivity.class);
                intent.putExtra("isLogin", true);
                startActivity(intent);
                myAcitivity.finish();
            }
            break;
        }
    }

}
