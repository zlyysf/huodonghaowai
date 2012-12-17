package com.lingzhimobile.huodonghaowai.activity;

import android.content.Context;
import android.os.Bundle;
import android.support.v4.app.FragmentTransaction;
import android.view.KeyEvent;
import android.view.inputmethod.InputMethodManager;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.fragment.DateSubjects;
import com.umeng.analytics.MobclickAgent;

public class DateTitleList extends HuoDongHaoWaiActivity {
    private InputMethodManager imm;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // TODO Auto-generated method stub
        super.onCreate(savedInstanceState);
        setContentView(R.layout.fragment);
        DateSubjects newFragment = DateSubjects.newInstance();
        FragmentTransaction ft = this.getSupportFragmentManager()
                .beginTransaction();
        ft.add(R.id.fragment01, newFragment);
        ft.commit();
        imm = (InputMethodManager) this
                .getSystemService(Context.INPUT_METHOD_SERVICE);

    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK  && event.getAction() == KeyEvent.ACTION_DOWN) {
            if (imm.isActive()) {
                return false;
            }
            if (getSupportFragmentManager().getBackStackEntryCount() > 0) {
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
