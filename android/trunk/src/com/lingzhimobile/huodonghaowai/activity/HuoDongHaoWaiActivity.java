package com.lingzhimobile.huodonghaowai.activity;

import android.os.Bundle;
import android.support.v4.app.FragmentActivity;

import com.lingzhimobile.huodonghaowai.util.AppInfo;

public class HuoDongHaoWaiActivity extends FragmentActivity{

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        AppInfo.init(this.getApplicationContext());
    }
    

}
