package com.lingzhimobile.tongqu.view;

import java.lang.reflect.Field;

import android.content.Context;
import android.util.AttributeSet;
import android.view.MotionEvent;
import android.view.View;
import android.widget.Gallery;

import com.lingzhimobile.tongqu.model.DateListItem;

public class NoCenterLockGallery extends Gallery {

    public DateListItem dateItem;
    
    public NoCenterLockGallery(Context context, AttributeSet attrs) {
        super(context, attrs);
        // TODO Auto-generated constructor stub
    }

    public boolean onFling(MotionEvent e1, MotionEvent e2, float velocityX, float velocityY) {
        boolean result = super.onFling(e1, e2, velocityX/3, velocityY/3);
        dateItem.selectedIndex = this.getSelectedItemPosition();
        return result;
    }
    
    public boolean onSingleTapUp(MotionEvent e) {

        int mDownTouchPosition = 0;
        View mDownTouchView = null;
        
        try {
            Gallery g = (Gallery) this;
            Class classGallery = Class.forName("android.widget.Gallery");
            Field fieldmDownTouchPosition = classGallery
                    .getDeclaredField("mDownTouchPosition");
            fieldmDownTouchPosition.setAccessible(true);
            mDownTouchPosition = ((Integer) fieldmDownTouchPosition.get(g)).intValue();

            Field fieldmDownTouchView = classGallery
            .getDeclaredField("mDownTouchView");
            fieldmDownTouchView.setAccessible(true);
            mDownTouchView = (View) fieldmDownTouchView.get(g);

        }catch(Exception ee){
            
        }
            
        if (mDownTouchPosition >= 0) {
            
            // An item tap should make it selected, so scroll to this child.
//            scrollToChild(mDownTouchPosition - mFirstPosition);

            // Also pass the click so the client knows, if it wants to.
//            if (mShouldCallbackOnUnselectedItemClick || mDownTouchPosition == mSelectedPosition) {
                performItemClick(mDownTouchView, mDownTouchPosition, this.getAdapter()
                        .getItemId(mDownTouchPosition));
//            }
            
            return true;
        }
        
        return false;
    }
    
}
