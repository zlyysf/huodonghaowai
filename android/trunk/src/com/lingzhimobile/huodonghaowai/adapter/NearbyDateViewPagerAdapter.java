package com.lingzhimobile.huodonghaowai.adapter;

import java.util.List;

import android.content.Context;
import android.os.Parcelable;
import android.support.v4.view.PagerAdapter;
import android.support.v4.view.ViewPager;
import android.util.SparseArray;
import android.view.View;

import com.lingzhimobile.huodonghaowai.model.DateListItem;
import com.lingzhimobile.huodonghaowai.view.ViewPagerItemView;

public class NearbyDateViewPagerAdapter extends PagerAdapter {

    private SparseArray<ViewPagerItemView> mSparseArray;
    private List<DateListItem> mNearbyDateList;
    private Context context;

    public NearbyDateViewPagerAdapter(Context context,
            List<DateListItem> mNearbyDateList) {
        this.context = context;
        this.mNearbyDateList = mNearbyDateList;
        mSparseArray = new SparseArray<ViewPagerItemView>();
    }

    @Override
    public int getCount() {
        return mNearbyDateList.size();
    }

    public void setData(List<DateListItem> mNearbyDateList) {
        this.mNearbyDateList = mNearbyDateList;
    }

    @Override
    public boolean isViewFromObject(View view, Object object) {
        return view == object;
    }

    @Override
    public void restoreState(Parcelable arg0, ClassLoader arg1) {

    }

    @Override
    public Parcelable saveState() {
        return null;
    }

    @Override
    public void startUpdate(View view) {

    }

    @Override
    public void destroyItem(View arg0, int arg1, Object arg2) {
        ViewPagerItemView itemView = (ViewPagerItemView) arg2;
        itemView.recycle();
    }

    @Override
    public Object instantiateItem(View container, int position) {
        ViewPagerItemView itemView;
        if (mSparseArray.get(position) != null) {
            itemView = mSparseArray.get(position);
            itemView.reload();
        } else {
            itemView = new ViewPagerItemView(context);
            itemView.setData(mNearbyDateList.get(position), position);
            mSparseArray.put(position, itemView);
            ((ViewPager) container).addView(itemView);
        }
        return itemView;
    }

}
