package com.lingzhimobile.tongqu.adapter;

import java.util.List;

import android.support.v4.view.PagerAdapter;
import android.support.v4.view.ViewPager;
import android.view.View;
import android.view.ViewGroup;

public class HelpViewPagerAdapter extends PagerAdapter {
    private List<View> mListViews;

    public List<View> getmListViews() {
        return mListViews;
    }

    public void setmListViews(List<View> mListViews) {
        this.mListViews = mListViews;
    }

    public HelpViewPagerAdapter(List<View> mListViews) {
        this.mListViews = mListViews;
    }

    @Override
    public int getCount() {
        return mListViews.size();
    }

    @Override
    public int getItemPosition(Object object) {
        return POSITION_NONE;
    }

    @Override
    public boolean isViewFromObject(View arg0, Object arg1) {
        return (arg0 == arg1);
    }

    @Override
    public void destroyItem(View arg0, int arg1, Object arg2) {
        if (arg1 < mListViews.size()) {
            ((ViewPager) arg0).removeView(mListViews.get(arg1));
        }
    }

    @Override
    public Object instantiateItem(View container, int position) {
        View fv = mListViews.get(position);
        ViewGroup parent = (ViewGroup) fv.getParent();
        if (parent!=null){
            parent.removeView(fv);
        }
        ((ViewPager) container).addView(fv, 0);
        return mListViews.get(position);

    }


}
