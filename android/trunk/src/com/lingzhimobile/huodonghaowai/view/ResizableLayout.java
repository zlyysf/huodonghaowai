package com.lingzhimobile.huodonghaowai.view;

import android.content.Context;
import android.util.AttributeSet;
import android.widget.LinearLayout;

public class ResizableLayout extends LinearLayout{
    private OnResizeListener mListner;

    public void setOnResizeListener(OnResizeListener l){
        mListner = l;
    }
    
    public ResizableLayout(Context context, AttributeSet attrs) {
        super(context, attrs);
    }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        super.onSizeChanged(w, h, oldw, oldh);
        if(mListner != null){
            mListner.OnActionResize();
        }
    }
    
    public interface OnResizeListener{
        void OnActionResize();
    }
}
