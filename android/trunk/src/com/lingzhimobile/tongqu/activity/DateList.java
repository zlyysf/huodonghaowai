package com.lingzhimobile.tongqu.activity;

import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.support.v4.app.FragmentTransaction;
import android.view.KeyEvent;

import com.lingzhimobile.tongqu.R;
import com.lingzhimobile.tongqu.cons.MessageID;
import com.lingzhimobile.tongqu.fragment.DateListFragment;

public class DateList extends TongQuActivity {
    public static DateList instance;
    private DateListFragment newFragment;
    public Handler myHandler = new Handler() {

        @Override
        public void handleMessage(Message msg) {
            switch (msg.what) {
            case MessageID.CONFIRM_DATE_OK:
                newFragment.refreshDateList(msg.arg1);
                break;

            }
        }

    };

    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.fragment);
        int dateType = getIntent().getIntExtra("dateType", 0);
        newFragment = DateListFragment.newInstance(dateType);
        FragmentTransaction ft = this.getSupportFragmentManager()
                .beginTransaction();
        ft.add(R.id.fragment01, newFragment);
        ft.commit();
        instance = this;
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && event.getAction() == KeyEvent.ACTION_DOWN) {
            if (getSupportFragmentManager().getBackStackEntryCount() > 0) {
                getSupportFragmentManager().popBackStack();
                return true;
            }

        }
        return false;
    }

}
