package com.lingzhimobile.tongqu.activity;

import android.os.Bundle;
import android.support.v4.app.FragmentTransaction;
import android.view.KeyEvent;

import com.lingzhimobile.tongqu.R;
import com.lingzhimobile.tongqu.fragment.NearbyDateList;
import com.lingzhimobile.tongqu.fragment.PreLogin;
import com.umeng.analytics.MobclickAgent;

public class Nearby extends TongQuActivity {

    private boolean isLogin;


    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
         setContentView(R.layout.fragment);
         isLogin = getIntent().getBooleanExtra("isLogin", false);
         if (isLogin) {
            NearbyDateList newFragment = NearbyDateList.newInstance();
            FragmentTransaction ft = this.getSupportFragmentManager()
                    .beginTransaction();
            ft.add(R.id.fragment01, newFragment);
            ft.commit();
        }else{
            PreLogin newFragment = PreLogin.newInstance();
            FragmentTransaction ft = this.getSupportFragmentManager()
                    .beginTransaction();
            ft.add(R.id.fragment01, newFragment);
            ft.commit();
        }

    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && event.getAction() == KeyEvent.ACTION_DOWN) {
            if(getSupportFragmentManager().getBackStackEntryCount() > 0){
                getSupportFragmentManager().popBackStack();
                return true;
            }else if(!isLogin){
                finish();
            }
            
        }
        return false;
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
