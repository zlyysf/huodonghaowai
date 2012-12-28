package com.lingzhimobile.huodonghaowai.fragment;

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

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.activity.AskInfo;
import com.lingzhimobile.huodonghaowai.activity.Login;
import com.lingzhimobile.huodonghaowai.activity.MainTabActivity;
import com.lingzhimobile.huodonghaowai.adapter.PageSwitchAdapter;
import com.lingzhimobile.huodonghaowai.asynctask.GetNearbyDateTask;
import com.lingzhimobile.huodonghaowai.cons.MessageID;
import com.lingzhimobile.huodonghaowai.cons.RenRenLibConst;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.model.DateListItem;
import com.lingzhimobile.huodonghaowai.util.AppUtil;
import com.lingzhimobile.huodonghaowai.view.ViewFlow;
import com.lingzhimobile.huodonghaowai.view.myProgressDialog;
import com.renren.api.connect.android.Renren;

public class PreLogin extends Fragment {

    private Activity myAcitivity;
    private View currentView;

    public static final int LOGIN = 100;
    public static final int SIGNUP = 101;

    private static final String LocalLogTag = LogTag.ACTIVITY + " PreLogin";

    private final ArrayList<DateListItem> dates = new ArrayList<DateListItem>();
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
        //Renren renren = new Renren(RenRenLibConst.APP_API_KEY, RenRenLibConst.APP_SECRET_KEY, RenRenLibConst.APP_ID, myAcitivity);
        Renren renren = AppUtil.getRenrenSdkInstance(myAcitivity);
        if (renren.getCurrentUid() != 0){
          //to avoid possible mix-up that old renren auth be taken as the current to-be-login-or-register user
            renren.logout(myAcitivity);
        }


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
        LogUtils.Logd(LocalLogTag, "PreLogin onActivityResult enter");
        switch (requestCode) {
        case LOGIN:
        case SIGNUP:
            LogUtils.Logd(LocalLogTag, "PreLogin onActivityResult LOGIN|SIGNUP enter");
            if (resultCode == MessageID.LOGIN_OK || resultCode == MessageID.REGISTER_OK) {
                LogUtils.Logd(LocalLogTag, "PreLogin onActivityResult LOGIN|SIGNUP LOGIN_OK|REGISTER_OK enter");
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
