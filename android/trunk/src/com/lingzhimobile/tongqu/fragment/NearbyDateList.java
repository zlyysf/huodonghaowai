package com.lingzhimobile.tongqu.fragment;

import java.util.Date;
import java.util.List;

import android.app.Activity;
import android.graphics.drawable.ColorDrawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentTransaction;
import android.support.v4.app.LoaderManager.LoaderCallbacks;
import android.support.v4.content.Loader;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;

import com.lingzhimobile.tongqu.R;
import com.lingzhimobile.tongqu.adapter.NearbyDateListAdapter;
import com.lingzhimobile.tongqu.asyncloader.GetNearbyDateLoader;
import com.lingzhimobile.tongqu.model.DateListItem;
import com.lingzhimobile.tongqu.pulltorefresh.PullToRefreshListView;
import com.lingzhimobile.tongqu.pulltorefresh.PullToRefreshBase.Mode;
import com.lingzhimobile.tongqu.pulltorefresh.PullToRefreshBase.OnRefreshListener2;
import com.lingzhimobile.tongqu.util.AppInfo;
import com.lingzhimobile.tongqu.util.GlobalValue;
import com.lingzhimobile.tongqu.view.myProgressDialog;

public class NearbyDateList extends Fragment implements
        LoaderCallbacks<List<DateListItem>> {

    private Activity myAcitivity;
    private View currentView;
    private myProgressDialog mProgressDialog;
    private PullToRefreshListView nearbyDateList;
    private NearbyDateListAdapter nearbyDateListAdapter;

    public Handler myHandler = new Handler() {

        @Override
        public void handleMessage(Message msg) {
            super.handleMessage(msg);
            nearbyDateList.onRefreshComplete();
        }

    };

    public static NearbyDateList newInstance() {
        NearbyDateList f = new NearbyDateList();
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
        currentView = inflater.inflate(R.layout.nearbydatelist, container,
                false);
        initView();
        initData();
        if (GlobalValue.nearbyDates.size() == 0) {
            getLoaderManager().initLoader(0, null, this);
            mProgressDialog = myProgressDialog.show(myAcitivity, null,
                    R.string.loading);
        }else{
            nearbyDateListAdapter.notifyDataSetChanged();
        }

        return currentView;
    }


    private void initView() {
        nearbyDateList = (PullToRefreshListView) currentView
                .findViewById(R.id.lvNearbyDate);
        nearbyDateList.setMode(Mode.BOTH);
    }

    private void initData() {
        nearbyDateListAdapter = new NearbyDateListAdapter(myAcitivity,this,
                GlobalValue.nearbyDates);
        nearbyDateList.getRefreshableView().setAdapter(nearbyDateListAdapter);
        nearbyDateList.getRefreshableView().setDividerHeight(0);
        nearbyDateList.setLastUpdatedLabel(getString(R.string.last_update)
                + new Date().toLocaleString());
        nearbyDateList.setLoadingLayoutBg(R.color.white);
        nearbyDateList.setOnRefreshListener(new OnRefreshListener2() {

            @Override
            public void onPullDownToRefresh() {
                getLoaderManager().restartLoader(0, null, NearbyDateList.this);
            }

            @Override
            public void onPullUpToRefresh() {
                if (GlobalValue.nearbyDates.size() > 0) {
                    getLoaderManager().restartLoader(1, null,
                            NearbyDateList.this);
                } else {
                    nearbyDateList.onRefreshComplete();
                }
            }
        });
        nearbyDateList.getRefreshableView().setOnItemClickListener(
                new OnItemClickListener() {

                    @Override
                    public void onItemClick(AdapterView<?> parent, View view,
                            int position, long id) {
                        NearbyDateDetail newFragment = NearbyDateDetail
                                .newInstance(position-1);
                        FragmentTransaction ft = getFragmentManager()
                                .beginTransaction();

                        ft.setCustomAnimations(R.anim.push_left_in,
                                R.anim.push_left_out, R.anim.push_right_in,
                                R.anim.push_right_out);
                        ft.replace(R.id.fragment01, newFragment);
                        ft.addToBackStack(null);
                        ft.commit();
                    }
                });

    }

    @Override
    public Loader<List<DateListItem>> onCreateLoader(int arg0, Bundle arg1) {
        Log.e("Loader", "onCreateLoader");
        GetNearbyDateLoader nearbyDateLoader = null;
        switch (arg0) {
        case 0:
            nearbyDateLoader = new GetNearbyDateLoader(myAcitivity,AppInfo.userId, 0, 10, 0);
            break;
        case 1:
            nearbyDateLoader = new GetNearbyDateLoader(myAcitivity,AppInfo.userId,
                    GlobalValue.nearbyDates.get(GlobalValue.nearbyDates.size()-1)
                            .getOrderScore() + 1, 10, 0);
        }
        return nearbyDateLoader;
    }

    @Override
    public void onLoadFinished(Loader<List<DateListItem>> arg0,
            List<DateListItem> arg1) {
        Log.e("LoaderId", arg0.getId() + "");
        if(!isResumed()){
            return;
        }
        if (mProgressDialog != null) {
            mProgressDialog.dismiss();
        }
        myHandler.sendEmptyMessage(0);
        if (arg1 != null) {
            if (arg0.getId() == 0) {
                GlobalValue.nearbyDates.clear();
            }
            GlobalValue.nearbyDates.addAll(arg1);
            nearbyDateListAdapter.notifyDataSetChanged();

        }
    }

    @Override
    public void onLoaderReset(Loader<List<DateListItem>> arg0) {

    }

}
