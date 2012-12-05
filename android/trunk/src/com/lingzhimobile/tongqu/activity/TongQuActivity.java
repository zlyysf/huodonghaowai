package com.lingzhimobile.tongqu.activity;

import android.os.Bundle;
import android.support.v4.app.FragmentActivity;

import com.lingzhimobile.tongqu.util.AppInfo;

public class TongQuActivity extends FragmentActivity{

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        AppInfo.init(this.getApplicationContext());
    }
    

}
