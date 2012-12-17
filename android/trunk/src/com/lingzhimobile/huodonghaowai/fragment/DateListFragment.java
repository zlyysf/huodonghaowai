package com.lingzhimobile.huodonghaowai.fragment;

import java.util.Date;
import java.util.List;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentTransaction;
import android.support.v4.app.LoaderManager.LoaderCallbacks;
import android.support.v4.content.Loader;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.RadioButton;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.activity.DateChat;
import com.lingzhimobile.huodonghaowai.adapter.DateListItemAdapter;
import com.lingzhimobile.huodonghaowai.adapter.SentDateListItemAdapter;
import com.lingzhimobile.huodonghaowai.asyncloader.GetDateLoader;
import com.lingzhimobile.huodonghaowai.model.DateListItem;
import com.lingzhimobile.huodonghaowai.pulltorefresh.PullToRefreshListView;
import com.lingzhimobile.huodonghaowai.pulltorefresh.PullToRefreshBase.Mode;
import com.lingzhimobile.huodonghaowai.pulltorefresh.PullToRefreshBase.OnRefreshListener2;
import com.lingzhimobile.huodonghaowai.util.AppInfo;
import com.lingzhimobile.huodonghaowai.util.GlobalValue;
import com.lingzhimobile.huodonghaowai.view.myProgressDialog;

public class DateListFragment extends Fragment implements
        LoaderCallbacks<List<DateListItem>> {
    public static final String TYPE_SEND = "onlyActiveSend";
    public static final String TYPE_INVITED = "invited";
    public static final String TYPE_APPLY = "applying";
    public static final int SEND_LOADER_ID = 1;
    public static final int INVITED_LOADER_ID = 2;
    public static final int APPLY_LOADER_ID = 3;
    public static final int SEND_MORE_LOADER_ID = 4;
    public static final int INVITED_MORE_LOADER_ID = 5;
    public static final int APPLY_MORE_LOADER_ID = 6;

    private int needRreshDateType = -1;
    private String filterType;

    private Activity myAcitivity;
    private View currentView;
    private myProgressDialog mProgressDialog;

    private RadioButton rbFilterLeft, rbFilterMiddle, rbFilterRight;
    private PullToRefreshListView bouncyRefreshViewSend;
    private PullToRefreshListView bouncyRefreshViewInvited;
    private PullToRefreshListView bouncyRefreshViewApply;

    private SentDateListItemAdapter sentDateListItemAdapter;
    private DateListItemAdapter invitedDateListItemAdapter;
    private DateListItemAdapter applyDateListItemAdapter;
    
    private int scrollTop = 0;
    private int scrollPos = 0;

//    @Override
//    public void onSaveInstanceState(Bundle outState) {
//        super.onSaveInstanceState(outState);
//        scrollPos = bouncyRefreshViewSend.getRefreshableView().getFirstVisiblePosition();
//        View v = bouncyRefreshViewSend.getRefreshableView().getChildAt(0);
//        scrollTop = (v == null) ? 0 : v.getTop();
//        outState.putInt("scrollTop", scrollTop);
//        outState.putInt("scrollPos", scrollPos);
//    }

    public static DateListFragment newInstance(int dateType) {
        DateListFragment f = new DateListFragment();
        Bundle args = new Bundle();
        args.putInt("dateType", dateType);
        f.setArguments(args);

        return f;
    }

    @Override
    public void onAttach(Activity activity) {
        super.onAttach(activity);
        this.myAcitivity = activity;
    }
    

    @Override
    public void onDestroyView() {
        scrollPos = bouncyRefreshViewSend.getRefreshableView().getFirstVisiblePosition();
        View v = bouncyRefreshViewSend.getRefreshableView().getChildAt(0);
        scrollTop = (v == null) ? 0 : v.getTop();
        super.onDestroyView();
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
            Bundle savedInstanceState) {
        currentView = inflater.inflate(R.layout.message, container, false);
        initView();
        initData();
        if (filterType == null) {
            switch (getArguments().getInt("dateType", 0)) {
            case 3:
                GlobalValue.applyDates.clear();
                rbFilterRight.performClick();
                break;
            case 1:
                GlobalValue.sendDates.clear();
                rbFilterLeft.performClick();
                break;
            case 2:
                GlobalValue.invitedDates.clear();
                rbFilterMiddle.performClick();
                break;
            default:
                rbFilterLeft.performClick();
                break;
            }
        } else {
//            if (filterType.equals(TYPE_SEND)) {
//                bouncyRefreshViewSend.setVisibility(View.VISIBLE);
//                bouncyRefreshViewInvited.setVisibility(View.GONE);
//                bouncyRefreshViewApply.setVisibility(View.GONE);
//                sentDateListItemAdapter.notifyDataSetChanged();
//            } else if (filterType.equals(TYPE_INVITED)) {
//                bouncyRefreshViewSend.setVisibility(View.GONE);
//                bouncyRefreshViewInvited.setVisibility(View.VISIBLE);
//                bouncyRefreshViewApply.setVisibility(View.GONE);
//                invitedDateListItemAdapter.notifyDataSetChanged();
//            } else {
//                bouncyRefreshViewSend.setVisibility(View.GONE);
//                bouncyRefreshViewInvited.setVisibility(View.GONE);
//                bouncyRefreshViewApply.setVisibility(View.VISIBLE);
//                applyDateListItemAdapter.notifyDataSetChanged();
//            }
//            
        }
        
        return currentView;
    }

    @Override
    public void onResume() {
        super.onResume();
        if (filterType.equals(TYPE_SEND)) {
            bouncyRefreshViewSend.setVisibility(View.VISIBLE);
            bouncyRefreshViewInvited.setVisibility(View.GONE);
            bouncyRefreshViewApply.setVisibility(View.GONE);
            sentDateListItemAdapter.notifyDataSetChanged();
            bouncyRefreshViewSend.getRefreshableView().setSelectionFromTop(scrollPos, scrollTop);
        } else if (filterType.equals(TYPE_INVITED)) {
            bouncyRefreshViewSend.setVisibility(View.GONE);
            bouncyRefreshViewInvited.setVisibility(View.VISIBLE);
            bouncyRefreshViewApply.setVisibility(View.GONE);
            invitedDateListItemAdapter.notifyDataSetChanged();
        } else {
            bouncyRefreshViewSend.setVisibility(View.GONE);
            bouncyRefreshViewInvited.setVisibility(View.GONE);
            bouncyRefreshViewApply.setVisibility(View.VISIBLE);
            applyDateListItemAdapter.notifyDataSetChanged();
        }
    }

    private void initView() {
        rbFilterLeft = (RadioButton) currentView
                .findViewById(R.id.rbDateFilterLeft);
        rbFilterMiddle = (RadioButton) currentView
                .findViewById(R.id.rbDateFilterMiddle);
        rbFilterRight = (RadioButton) currentView
                .findViewById(R.id.rbDateFilterRight);
        bouncyRefreshViewSend = (PullToRefreshListView) currentView
                .findViewById(R.id.bouncyRefreshViewSend);
        bouncyRefreshViewInvited = (PullToRefreshListView) currentView
                .findViewById(R.id.bouncyRefreshViewInvited);
        bouncyRefreshViewApply = (PullToRefreshListView) currentView
                .findViewById(R.id.bouncyRefreshViewApply);
        bouncyRefreshViewSend.setMode(Mode.BOTH);
        bouncyRefreshViewInvited.setMode(Mode.BOTH);
        bouncyRefreshViewApply.setMode(Mode.BOTH);
        bouncyRefreshViewSend.setPullLabel(
                getString(R.string.pull_to_refresh_pull_label),
                getString(R.string.pull_up_to_load_pull_label), Mode.BOTH);
        bouncyRefreshViewInvited.setPullLabel(
                getString(R.string.pull_to_refresh_pull_label),
                getString(R.string.pull_up_to_load_pull_label), Mode.BOTH);
        bouncyRefreshViewApply.setPullLabel(
                getString(R.string.pull_to_refresh_pull_label),
                getString(R.string.pull_up_to_load_pull_label), Mode.BOTH);
        sentDateListItemAdapter = new SentDateListItemAdapter(myAcitivity,
                GlobalValue.sendDates);
        invitedDateListItemAdapter = new DateListItemAdapter(myAcitivity, this,
                TYPE_INVITED, GlobalValue.invitedDates);
        applyDateListItemAdapter = new DateListItemAdapter(myAcitivity, this,
                TYPE_APPLY, GlobalValue.applyDates);
        bouncyRefreshViewSend.getRefreshableView().setAdapter(
                sentDateListItemAdapter);
        bouncyRefreshViewInvited.getRefreshableView().setAdapter(
                invitedDateListItemAdapter);
        bouncyRefreshViewApply.getRefreshableView().setAdapter(
                applyDateListItemAdapter);
        //
        // bouncyRefreshViewSend.getRefreshableView().setDivider(new
        // ColorDrawable(R.color.gray));
        // bouncyRefreshViewInvited.getRefreshableView().setDivider(new
        // ColorDrawable(R.color.gray));
        // bouncyRefreshViewApply.getRefreshableView().setDivider(new
        // ColorDrawable(R.color.gray));
        bouncyRefreshViewSend.getRefreshableView().setDividerHeight(0);
        bouncyRefreshViewInvited.getRefreshableView().setDividerHeight(0);
        bouncyRefreshViewApply.getRefreshableView().setDividerHeight(0);
    }

    private void initData() {
        rbFilterLeft.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                showSendDates();
            }
        });
        rbFilterMiddle.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                showInvitedDates();
            }
        });
        rbFilterRight.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                showApplyDates();
            }
        });
        bouncyRefreshViewSend.setOnRefreshListener(new OnRefreshListener2() {

            @Override
            public void onPullDownToRefresh() {
                bouncyRefreshViewSend
                        .setLastUpdatedLabel(getString(R.string.last_update)
                                + new Date().toLocaleString());
                getLoaderManager().restartLoader(SEND_LOADER_ID, null,
                        DateListFragment.this);
            }

            @Override
            public void onPullUpToRefresh() {
                if (GlobalValue.sendDates.size() > 0) {
                    getLoaderManager().restartLoader(SEND_MORE_LOADER_ID, null,
                            DateListFragment.this);
                } else {
                    bouncyRefreshViewSend.onRefreshComplete();
                }

            }

        });
        bouncyRefreshViewSend.getRefreshableView().setOnItemClickListener(
                new OnItemClickListener() {

                    @Override
                    public void onItemClick(AdapterView<?> parent, View view,
                            int position, long id) {

                        DateResponderList newFragment = DateResponderList
                                .newInstance(position - 1);
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
        bouncyRefreshViewInvited.setOnRefreshListener(new OnRefreshListener2() {

            @Override
            public void onPullDownToRefresh() {
                bouncyRefreshViewInvited
                        .setLastUpdatedLabel(getString(R.string.last_update)
                                + new Date().toLocaleString());
                getLoaderManager().restartLoader(INVITED_LOADER_ID, null,
                        DateListFragment.this);
            }

            @Override
            public void onPullUpToRefresh() {
                if (GlobalValue.invitedDates.size() > 0) {
                    getLoaderManager().restartLoader(INVITED_MORE_LOADER_ID,
                            null, DateListFragment.this);
                } else {
                    bouncyRefreshViewInvited.onRefreshComplete();
                }
            }
        });
        bouncyRefreshViewInvited.getRefreshableView().setOnItemClickListener(
                new OnItemClickListener() {

                    @Override
                    public void onItemClick(AdapterView<?> parent, View view,
                            int position, long id) {
                        Intent intent = new Intent();
                        intent.setClass(myAcitivity, DateChat.class);
                        intent.putExtra("itemIndex", position - 1);
                        intent.putExtra("fromType", TYPE_INVITED);
                        startActivity(intent);

                    }
                });
        bouncyRefreshViewApply.setOnRefreshListener(new OnRefreshListener2() {

            @Override
            public void onPullDownToRefresh() {
                bouncyRefreshViewApply
                        .setLastUpdatedLabel(getString(R.string.last_update)
                                + new Date().toLocaleString());
                getLoaderManager().restartLoader(APPLY_LOADER_ID, null,
                        DateListFragment.this);
            }

            @Override
            public void onPullUpToRefresh() {
                if (GlobalValue.applyDates.size() > 0) {
                    getLoaderManager().restartLoader(APPLY_MORE_LOADER_ID,
                            null, DateListFragment.this);
                } else {
                    bouncyRefreshViewApply.onRefreshComplete();
                }
            }
        });
        bouncyRefreshViewApply.getRefreshableView().setOnItemClickListener(
                new OnItemClickListener() {

                    @Override
                    public void onItemClick(AdapterView<?> parent, View view,
                            int position, long id) {
                        Intent intent = new Intent();
                        intent.setClass(myAcitivity, DateChat.class);
                        intent.putExtra("itemIndex", position - 1);
                        intent.putExtra("fromType", TYPE_APPLY);
                        startActivity(intent);
                    }
                });
    }

    private void showSendDates() {
        if (TYPE_SEND.equals(filterType)) {
            return;
        }
        filterType = TYPE_SEND;
        bouncyRefreshViewSend.setVisibility(View.VISIBLE);
        bouncyRefreshViewInvited.setVisibility(View.GONE);
        bouncyRefreshViewApply.setVisibility(View.GONE);
        if (GlobalValue.sendDates.size() == 0 || needRreshDateType != -1) {
            getLoaderManager().restartLoader(SEND_LOADER_ID, null, this);
            mProgressDialog = myProgressDialog.show(myAcitivity, null,
                    R.string.loading);
        } else {
            sentDateListItemAdapter.notifyDataSetChanged();
        }
    }

    private void showInvitedDates() {
        if (TYPE_INVITED.equals(filterType)) {
            return;
        }
        filterType = TYPE_INVITED;
        bouncyRefreshViewSend.setVisibility(View.GONE);
        bouncyRefreshViewInvited.setVisibility(View.VISIBLE);
        bouncyRefreshViewApply.setVisibility(View.GONE);
        if (GlobalValue.invitedDates.size() == 0 || needRreshDateType != -1) {
            getLoaderManager().restartLoader(INVITED_LOADER_ID, null, this);
            mProgressDialog = myProgressDialog.show(myAcitivity, null,
                    R.string.loading);
        } else {
            invitedDateListItemAdapter.notifyDataSetChanged();
        }
    }

    private void showApplyDates() {
        if (TYPE_APPLY.equals(filterType)) {
            return;
        }
        filterType = TYPE_APPLY;
        bouncyRefreshViewSend.setVisibility(View.GONE);
        bouncyRefreshViewInvited.setVisibility(View.GONE);
        bouncyRefreshViewApply.setVisibility(View.VISIBLE);
        if (GlobalValue.applyDates.size() == 0 || needRreshDateType != -1) {
            getLoaderManager().restartLoader(APPLY_LOADER_ID, null, this);
            mProgressDialog = myProgressDialog.show(myAcitivity, null,
                    R.string.loading);
        } else {
            applyDateListItemAdapter.notifyDataSetChanged();
        }
    }

    @Override
    public Loader<List<DateListItem>> onCreateLoader(int arg0, Bundle arg1) {
        GetDateLoader getDateLoader = null;
        switch (arg0) {
        case SEND_LOADER_ID:
            getDateLoader = new GetDateLoader(myAcitivity, AppInfo.userId, 0, 10, TYPE_SEND);
            break;
        case INVITED_LOADER_ID:
            getDateLoader = new GetDateLoader(myAcitivity, AppInfo.userId,0, 10, TYPE_INVITED);
            break;
        case APPLY_LOADER_ID:
            getDateLoader = new GetDateLoader(myAcitivity, AppInfo.userId,0, 10, TYPE_APPLY);
            break;
        case SEND_MORE_LOADER_ID:
            getDateLoader = new GetDateLoader(myAcitivity, AppInfo.userId,
                    GlobalValue.sendDates.get(GlobalValue.sendDates.size() - 1)
                            .getOrderScore() - 1, 10, TYPE_SEND);
            break;
        case INVITED_MORE_LOADER_ID:
            getDateLoader = new GetDateLoader(myAcitivity, AppInfo.userId,
                    GlobalValue.invitedDates.get(
                            GlobalValue.invitedDates.size() - 1)
                            .getOrderScore() + 1, 10, TYPE_INVITED);
            break;
        case APPLY_MORE_LOADER_ID:
            getDateLoader = new GetDateLoader(
                    myAcitivity, AppInfo.userId,
                    GlobalValue.applyDates.get(
                            GlobalValue.applyDates.size() - 1).getOrderScore() - 1,
                    10, TYPE_APPLY);
        }
        return getDateLoader;
    }

    @Override
    public void onLoadFinished(Loader<List<DateListItem>> arg0,
            List<DateListItem> arg1) {
        if (!isResumed()) {
            return;
        }
        if (mProgressDialog != null) {
            mProgressDialog.dismiss();
        }
        if (arg1 == null) {
            bouncyRefreshViewSend.onRefreshComplete();
            bouncyRefreshViewInvited.onRefreshComplete();
            bouncyRefreshViewApply.onRefreshComplete();
            return;
        }
        switch (arg0.getId()) {
        case SEND_LOADER_ID:
            GlobalValue.sendDates.clear();
            GlobalValue.sendDates.addAll(arg1);
            bouncyRefreshViewSend.onRefreshComplete();
            sentDateListItemAdapter.notifyDataSetChanged();
            break;
        case INVITED_LOADER_ID:
            GlobalValue.invitedDates.clear();
            GlobalValue.invitedDates.addAll(arg1);
            bouncyRefreshViewInvited.onRefreshComplete();
            invitedDateListItemAdapter.notifyDataSetChanged();
            break;
        case APPLY_LOADER_ID:
            GlobalValue.applyDates.clear();
            GlobalValue.applyDates.addAll(arg1);
            bouncyRefreshViewApply.onRefreshComplete();
            applyDateListItemAdapter.notifyDataSetChanged();
            break;
        case APPLY_MORE_LOADER_ID:
            GlobalValue.applyDates.addAll(arg1);
            bouncyRefreshViewApply.onRefreshComplete();
            applyDateListItemAdapter.notifyDataSetChanged();
            break;
        case SEND_MORE_LOADER_ID:
            GlobalValue.sendDates.addAll(arg1);
            bouncyRefreshViewSend.onRefreshComplete();
            sentDateListItemAdapter.notifyDataSetChanged();
            break;
        case INVITED_MORE_LOADER_ID:
            GlobalValue.invitedDates.addAll(arg1);
            bouncyRefreshViewInvited.onRefreshComplete();
            invitedDateListItemAdapter.notifyDataSetChanged();
            break;

        }

    }

    @Override
    public void onLoaderReset(Loader<List<DateListItem>> arg0) {

    }

    public void refreshDateList(int dateType) {
        switch (dateType) {
        case 3:
            needRreshDateType = dateType;
            rbFilterRight.performClick();
            break;
        case 1:
            needRreshDateType = dateType;
            rbFilterLeft.performClick();
            break;
        case 2:
            needRreshDateType = dateType;
            rbFilterMiddle.performClick();
            break;
        default:
            rbFilterLeft.performClick();
            break;
        }
    }

}
