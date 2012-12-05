package com.lingzhimobile.tongqu.activity;

import android.os.Bundle;
import android.support.v4.app.FragmentTransaction;
import android.view.KeyEvent;

import com.lingzhimobile.tongqu.R;
import com.lingzhimobile.tongqu.fragment.ProfileFragment;
import com.lingzhimobile.tongqu.util.AppInfo;
import com.umeng.analytics.MobclickAgent;

public class Profile extends TongQuActivity {

    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.fragment);
        ProfileFragment newFragment = ProfileFragment.newInstance(AppInfo.userId,R.string.logout);
        FragmentTransaction ft = this.getSupportFragmentManager().beginTransaction();
        ft.add(R.id.fragment01, newFragment);
        ft.commit();

    }
    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && event.getAction() == KeyEvent.ACTION_DOWN) {
            if(getSupportFragmentManager().getBackStackEntryCount() > 0){
                getSupportFragmentManager().popBackStack();
                return true;
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
