package com.lingzhimobile.huodonghaowai.fragment;


import java.util.Locale;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentTransaction;
import android.support.v4.app.LoaderManager.LoaderCallbacks;
import android.support.v4.content.Loader;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.Button;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.adapter.DateSubjectListAdapter;
import com.lingzhimobile.huodonghaowai.asyncloader.GetInviteCodeLoader;
import com.lingzhimobile.huodonghaowai.asynctask.GetDateSubjectsTask;
import com.lingzhimobile.huodonghaowai.cons.MessageID;
import com.lingzhimobile.huodonghaowai.pulltorefresh.PullToRefreshListView;
import com.lingzhimobile.huodonghaowai.pulltorefresh.PullToRefreshBase.OnRefreshListener;
import com.lingzhimobile.huodonghaowai.util.AppInfo;
import com.lingzhimobile.huodonghaowai.util.AppUtil;
import com.lingzhimobile.huodonghaowai.util.GlobalValue;
import com.lingzhimobile.huodonghaowai.view.myProgressDialog;

public class DateSubjects extends Fragment implements LoaderCallbacks<String>{
    private Activity myAcitivity;
    private View currentView;
    private PullToRefreshListView lvDateTitle;
    private Button btnInvite;
    private DateSubjectListAdapter titleAdapter;
    private myProgressDialog mProgressDialog;
    
    public Handler myHandler = new Handler() {

        @Override
        public void handleMessage(Message msg) {
            super.handleMessage(msg);
            if(myAcitivity.isFinishing()){
                return;
            }
            if (mProgressDialog != null) {
                mProgressDialog.dismiss();
            }
            switch (msg.what) {
            case MessageID.GET_DATE_SUBJECT_OK:
                lvDateTitle.onRefreshComplete();
                titleAdapter.notifyDataSetChanged();
                break;
            case MessageID.SERVER_RETURN_NULL:
                AppUtil.handleErrorCode(msg.obj.toString(), myAcitivity);
                break;
            }
        }
    };
    
    public static DateSubjects newInstance() {
        DateSubjects f = new DateSubjects();
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
        currentView = inflater.inflate(R.layout.datetitlelist, container,
                false);
        initView();
        initData();
        if(GlobalValue.dateTitleList.size() == 0){
            new GetDateSubjectsTask(AppInfo.userId,Locale.getDefault().getLanguage(), myHandler.obtainMessage()).execute();
            mProgressDialog = myProgressDialog.show(myAcitivity, null, R.string.loading);
        }
        return currentView;
    }
    
    private void initView(){
        lvDateTitle = (PullToRefreshListView) currentView.findViewById(R.id.lvDateTitleList);
        btnInvite = (Button) currentView.findViewById(R.id.btnInvite);
    }
    private void initData(){
        titleAdapter = new DateSubjectListAdapter(myAcitivity, GlobalValue.dateTitleList);
        lvDateTitle.getRefreshableView().setAdapter(titleAdapter);
        lvDateTitle.getRefreshableView().setOnItemClickListener(new OnItemClickListener() {

            @Override
            public void onItemClick(AdapterView<?> parent, View view,
                    int position, long id) {
//                Intent intent = new Intent();
//                intent.putExtra("position", position);
//                intent.setClass(myAcitivity, ProposeDate.class);
//                startActivityForResult(intent, 100);
                PublishDate newFragment = PublishDate.newInstance(position-1);
                FragmentTransaction ft = getFragmentManager().beginTransaction();
                
                ft.setCustomAnimations(R.anim.push_left_in, 
                        R.anim.push_left_out,  
                        R.anim.push_right_in,  
                        R.anim.push_right_out);
                ft.replace(R.id.fragment01, newFragment);
//                ft.setTransition(FragmentTransaction.TRANSIT_FRAGMENT_OPEN);
                ft.addToBackStack(null);
                ft.commit();
            }
        });
        lvDateTitle.setOnRefreshListener(new OnRefreshListener() {

            @Override
            public void onRefresh() {
                new GetDateSubjectsTask(AppInfo.userId, Locale.getDefault().getLanguage(), myHandler.obtainMessage()).execute();
            }
        });
        btnInvite.setOnClickListener(new View.OnClickListener() {
            
            @Override
            public void onClick(View v) {
                mProgressDialog = myProgressDialog.show(myAcitivity, null, R.string.get_invite_code);
                getLoaderManager().initLoader(0, null, DateSubjects.this);
            }
        });
    }

    @Override
    public void onStart() {
        super.onStart();
    }

    @Override
    public void onStop() {
        super.onStop();
    }

    @Override
    public Loader<String> onCreateLoader(int arg0, Bundle arg1) {
        GetInviteCodeLoader getInviteCodeLoader = new GetInviteCodeLoader(myAcitivity, AppInfo.userId); 
        return getInviteCodeLoader;
    }

    @Override
    public void onLoadFinished(Loader<String> arg0, String arg1) {
        if(!isResumed()){
            return;
        }
        mProgressDialog.dismiss();
        if (arg1 != null) {
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.putExtra("sms_body", arg1);
            intent.setType("vnd.android-dir/mms-sms");
            startActivity(intent);
            getLoaderManager().destroyLoader(0);
        }
    }

    @Override
    public void onLoaderReset(Loader<String> arg0) {
        
    }


}
