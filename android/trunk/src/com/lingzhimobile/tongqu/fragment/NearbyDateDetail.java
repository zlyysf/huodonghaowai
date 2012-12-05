package com.lingzhimobile.tongqu.fragment;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.support.v4.view.ViewPager;
import android.support.v4.view.ViewPager.OnPageChangeListener;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;

import com.lingzhimobile.tongqu.R;
import com.lingzhimobile.tongqu.activity.WantIn;
import com.lingzhimobile.tongqu.adapter.NearbyDateViewPagerAdapter;
import com.lingzhimobile.tongqu.model.DateListItem;
import com.lingzhimobile.tongqu.util.AppInfo;
import com.lingzhimobile.tongqu.util.GlobalValue;

public class NearbyDateDetail extends Fragment {
    
    private Activity myAcitivity;
    private View currentView;
    
//    private ViewFlow vf;
//    private PageSwitchAdapter myPageSwitchAdapter;
    private ViewPager vp;
    private NearbyDateViewPagerAdapter myPageAdapter;
    
    private Button btnWant,btnCancel;
    private int currentItemIndex;
    private DateListItem tempItem;


    public static NearbyDateDetail newInstance(int position) {
        NearbyDateDetail f = new NearbyDateDetail();
        Bundle args = new Bundle();
        args.putInt("position", position);
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
        currentView = inflater.inflate(R.layout.nearby, container, false);
        initView();
        initData();
        return currentView;
    }

    private void initView() {
//        myPageSwitchAdapter = new PageSwitchAdapter(myAcitivity,
//                GlobalValue.nearbyDates);
//        vf = (ViewFlow) currentView.findViewById(R.id.viewflow);
//        vf.setAdapter(myPageSwitchAdapter);
        myPageAdapter = new NearbyDateViewPagerAdapter(myAcitivity,GlobalValue.nearbyDates);
        vp = (ViewPager) currentView.findViewById(R.id.vpNearbyDate);
        vp.setAdapter(myPageAdapter);
        currentItemIndex = this.getArguments().getInt("position", 0);
        vp.setCurrentItem(currentItemIndex);
        btnCancel = (Button) currentView.findViewById(R.id.btnCancel);
        btnWant = (Button) currentView.findViewById(R.id.btnWant);
        tempItem = GlobalValue.nearbyDates.get(currentItemIndex);
        if(tempItem.getSender().getUserId().equals(AppInfo.userId)){
            btnWant.setEnabled(false);
        }
    }
    
    private void initData(){
        btnCancel.setOnClickListener(new View.OnClickListener() {
            
            @Override
            public void onClick(View v) {
                getFragmentManager().popBackStack();
            }
        });
//        vf.setOnViewSwitchListener(new ViewSwitchListener() {
//            
//            @Override
//            public void onSwitched(View view, int position) {
//                currentItemIndex = position;
//            }
//        });
        vp.setOnPageChangeListener(new OnPageChangeListener() {
            
            @Override
            public void onPageSelected(int arg0) {
                currentItemIndex = arg0;
                tempItem = GlobalValue.nearbyDates.get(currentItemIndex);
                if(tempItem.getSender().getUserId().equals(AppInfo.userId)){
                    btnWant.setEnabled(false);
                }else{
                    btnWant.setEnabled(true);
                }
            }
            
            @Override
            public void onPageScrolled(int arg0, float arg1, int arg2) {
                
            }
            
            @Override
            public void onPageScrollStateChanged(int arg0) {
                
            }
        });
        btnWant.setOnClickListener(new View.OnClickListener() {
            
            @Override
            public void onClick(View v) {
                Intent intent = new Intent();
                intent.setClass(myAcitivity, WantIn.class);
                intent.putExtra("position", currentItemIndex);
                startActivity(intent);
            }
        });
    }


}
