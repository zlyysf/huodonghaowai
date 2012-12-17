package com.lingzhimobile.huodonghaowai.activity;

import java.util.ArrayList;
import java.util.List;

import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.support.v4.view.ViewPager;
import android.support.v4.view.ViewPager.OnPageChangeListener;
import android.view.View;
import android.view.ViewGroup.LayoutParams;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.ImageView.ScaleType;
import android.widget.LinearLayout;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.adapter.HelpViewPagerAdapter;


public class HelpView extends HuoDongHaoWaiActivity {
    private ViewPager vpHelpView;
    private List<View> viewPagerViews;
    private HelpViewPagerAdapter vpAdapter;
    private LinearLayout mPagePoint;
    private int[] viewIds = {R.drawable.help1,R.drawable.help2,R.drawable.help3};
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.helpview);
        vpHelpView = (ViewPager) findViewById(R.id.vpHelpView);
        viewPagerViews = new ArrayList<View>();
        for(int i=0;i<3;i++){
            ImageView iv = new ImageView(this);
            LayoutParams lp = new LayoutParams(LayoutParams.MATCH_PARENT,
                    LayoutParams.MATCH_PARENT);
            iv.setLayoutParams(lp);
            iv.setScaleType(ScaleType.CENTER_CROP);
            iv.setImageResource(viewIds[i]);
            viewPagerViews.add(iv);
        }
        View start = this.getLayoutInflater().inflate(R.layout.helpviewitem, null);
        ImageView iv = (ImageView) start.findViewById(R.id.ivHelpView);
        iv.setImageResource(R.drawable.help4);
        Button btnStart = (Button) start.findViewById(R.id.btnStart);
        btnStart.setOnClickListener(new View.OnClickListener() {
            
            @Override
            public void onClick(View v) {
                Intent intent = new Intent();
                intent.setClass(HelpView.this, Nearby.class);
                intent.putExtra("isLogin", false);
                startActivity(intent);
                SharedPreferences sp = getSharedPreferences("UserInfo", 0);
                sp.edit().putBoolean("isFirstOpenApp", false).commit();;
                finish();
            }
        });
        viewPagerViews.add(start);
        vpAdapter = new HelpViewPagerAdapter(viewPagerViews);
        vpHelpView.setAdapter(vpAdapter);
        mPagePoint = (LinearLayout) findViewById(R.id.llPagePoint);
        for(int j=0;j<4;j++){
            ImageView item = new ImageView(this);
            item.setBackgroundResource(R.drawable.helpview);
            mPagePoint.addView(item, j);
        }
        setPointView(0);
        vpHelpView.setOnPageChangeListener(new OnPageChangeListener() {
            
            @Override
            public void onPageSelected(int arg0) {
                setPointView(arg0);
            }
            
            @Override
            public void onPageScrolled(int arg0, float arg1, int arg2) {
                
            }
            
            @Override
            public void onPageScrollStateChanged(int arg0) {
                
            }
        });
    }
    
    public void setPointView(int currentPointView){
        int pointCount = mPagePoint.getChildCount();
        for (int i = 0; i < pointCount; i++) {
            ImageView v = (ImageView) mPagePoint.getChildAt(i);
            if (i == currentPointView) {
                v.setEnabled(true);
            } else {
                v.setEnabled(false);
            }
        }
    }
    
    

}
