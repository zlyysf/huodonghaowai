package com.lingzhimobile.huodonghaowai.view;

import java.util.Date;

import android.content.Context;
import android.util.AttributeSet;
import android.view.GestureDetector;
import android.view.GestureDetector.OnGestureListener;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.LinearInterpolator;
import android.view.animation.RotateAnimation;
import android.widget.BaseAdapter;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ListView;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.log.LogUtils;

public class BouncyRefreshListView extends FrameLayout implements OnGestureListener {

    GestureDetector mGestureDetector;

    public ListView mListView;

    private static final String TAG = "PullDownView";

    private final static int RELEASE_To_REFRESH = 0;
    private final static int PULL_To_REFRESH = 1;
    private final static int REFRESHING = 2;
    private final static int DONE = 3;
    private final static int LOADING = 4;

    // ratio between padding distance and offset
    private final static int RATIO = 3;

    private LayoutInflater mInflater;

    private LinearLayout mHeadView;

    private TextView mTipsTextview;
    private TextView mLastUpdatedTextView;
    private ImageView mArrowImageView;
    private ProgressBar mProgressBar;

    private RotateAnimation animation;
    private RotateAnimation reverseAnimation;

    // make sure the value of startY will be recorded just once in a whole touch
    // event
    private boolean isRecored;

    private int headContentWidth;
    private int headContentHeight;

    private int startX;
    private int startY;
    private int firstItemIndex;

    boolean shouldSuperOnScroll;
    boolean shouldInnerOnScroll;

    private int state;

    private boolean isBack;

    private OnRefreshListener refreshListener;

    private boolean isRefreshable;

    public BouncyRefreshListView(Context context) {
        super(context);
        mGestureDetector = new GestureDetector(this);
    }

    public BouncyRefreshListView(Context context, AttributeSet attrs) {
        super(context, attrs);
        mGestureDetector = new GestureDetector(this);
    }

    public void init(Context context) {
        mListView.setCacheColorHint(context.getResources().getColor(
                R.color.transparent));
        mInflater = LayoutInflater.from(context);

        mHeadView = (LinearLayout) mInflater.inflate(R.layout.mylistview_head,
                null);

        mArrowImageView = (ImageView) mHeadView
                .findViewById(R.id.head_arrowImageView);
        mArrowImageView.setMinimumWidth(70);
        mArrowImageView.setMinimumHeight(50);
        mProgressBar = (ProgressBar) mHeadView
                .findViewById(R.id.head_progressBar);
        mTipsTextview = (TextView) mHeadView
                .findViewById(R.id.head_tipsTextView);
        mLastUpdatedTextView = (TextView) mHeadView
                .findViewById(R.id.head_lastUpdatedTextView);

        measureView(mHeadView);
        headContentHeight = mHeadView.getMeasuredHeight();
        headContentWidth = mHeadView.getMeasuredWidth();

        mHeadView.setPadding(0, -1 * headContentHeight, 0, 0);
        mHeadView.invalidate();

        LogUtils.Logv("size", "width:" + headContentWidth + " height:"
                + headContentHeight);

        mListView.addHeaderView(mHeadView, null, false);

        animation = new RotateAnimation(0, -180,
                RotateAnimation.RELATIVE_TO_SELF, 0.5f,
                RotateAnimation.RELATIVE_TO_SELF, 0.5f);
        animation.setInterpolator(new LinearInterpolator());
        animation.setDuration(250);
        animation.setFillAfter(true);

        reverseAnimation = new RotateAnimation(-180, 0,
                RotateAnimation.RELATIVE_TO_SELF, 0.5f,
                RotateAnimation.RELATIVE_TO_SELF, 0.5f);
        reverseAnimation.setInterpolator(new LinearInterpolator());
        reverseAnimation.setDuration(200);
        reverseAnimation.setFillAfter(true);

        state = DONE;
        isRefreshable = true;
        
        mLastUpdatedTextView.setText("Last update: "
                + new Date().toLocaleString());

    }

    // when the status changes, call this function to update UI
    private void changeHeaderViewByState() {
        switch (state) {
        case RELEASE_To_REFRESH:
            mArrowImageView.setVisibility(View.VISIBLE);
            mProgressBar.setVisibility(View.GONE);
            mTipsTextview.setVisibility(View.VISIBLE);
            mLastUpdatedTextView.setVisibility(View.VISIBLE);

            mArrowImageView.clearAnimation();
            mArrowImageView.startAnimation(animation);

            mTipsTextview.setText("RELEASE To REFRESH");

            LogUtils.Logv(TAG, "Current status: RELEASE_To_REFRESH");
            break;
        case PULL_To_REFRESH:
            mProgressBar.setVisibility(View.GONE);
            mTipsTextview.setVisibility(View.VISIBLE);
            mLastUpdatedTextView.setVisibility(View.VISIBLE);
            mArrowImageView.clearAnimation();
            mArrowImageView.setVisibility(View.VISIBLE);
            // change from RELEASE_To_REFRESH
            if (isBack) {
                isBack = false;
                mArrowImageView.clearAnimation();
                mArrowImageView.startAnimation(reverseAnimation);

                mTipsTextview.setText(R.string.pull_to_refresh_pull_label);
            } else {
                mTipsTextview.setText(R.string.pull_to_refresh_pull_label);
            }
            LogUtils.Logv(TAG, "Current status: PULL_To_REFRESH");
            break;

        case REFRESHING:

            mHeadView.setPadding(0, 0, 0, 0);

            mProgressBar.setVisibility(View.VISIBLE);
            mArrowImageView.clearAnimation();
            mArrowImageView.setVisibility(View.GONE);
            mTipsTextview.setText("REFRESHING");
            mLastUpdatedTextView.setVisibility(View.VISIBLE);

            LogUtils.Logv(TAG, "Current status: REFRESHING");
            break;
        case DONE:
            mHeadView.setPadding(0, -1 * headContentHeight, 0, 0);

            mProgressBar.setVisibility(View.GONE);
            mArrowImageView.clearAnimation();
            mArrowImageView.setImageResource(R.drawable.ic_pulltorefresh_arrow);
            mTipsTextview.setText("PULL To REFRESH");
            mLastUpdatedTextView.setVisibility(View.VISIBLE);

            LogUtils.Logv(TAG, "Current status: done");
            break;
        }
    }

    public void setonRefreshListener(OnRefreshListener refreshListener) {
        this.refreshListener = refreshListener;
        isRefreshable = true;
    }

    public interface OnRefreshListener {
        public void onRefresh();
    }

    public void onRefreshComplete() {
        state = DONE;
        mLastUpdatedTextView.setText("Last update: "
                + new Date().toLocaleString());
        changeHeaderViewByState();
    }

    private void onRefresh() {
        if (refreshListener != null) {
            refreshListener.onRefresh();
        }
    }

    // estimate the width and height of the headView
    private void measureView(View child) {
        ViewGroup.LayoutParams p = child.getLayoutParams();
        if (p == null) {
            p = new ViewGroup.LayoutParams(ViewGroup.LayoutParams.FILL_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT);
        }
        int childWidthSpec = ViewGroup.getChildMeasureSpec(0, 0 + 0, p.width);
        int lpHeight = p.height;
        int childHeightSpec;
        if (lpHeight > 0) {
            childHeightSpec = MeasureSpec.makeMeasureSpec(lpHeight,
                    MeasureSpec.EXACTLY);
        } else {
            childHeightSpec = MeasureSpec.makeMeasureSpec(0,
                    MeasureSpec.UNSPECIFIED);
        }
        child.measure(childWidthSpec, childHeightSpec);
    }

    public void setAdapter(BaseAdapter adapter) {
        mLastUpdatedTextView.setText("Last update: "
                + new Date().toLocaleString());
        mListView.setAdapter(adapter);
    }

    // ////////////////////////////////////////////////////////////////////////////////////

    @Override
    public boolean dispatchTouchEvent(MotionEvent event) {

        if (isRefreshable) {
            switch (event.getAction()) {
            case MotionEvent.ACTION_DOWN:
                if (firstItemIndex == 0 && !isRecored) {
                    isRecored = true;
                    startX = (int) event.getX();
                    startY = (int) event.getY();
                    LogUtils.Logv(TAG, "Record current position in Down status");
                }
                super.dispatchTouchEvent(event);
                break;

            case MotionEvent.ACTION_UP:

                if (state != REFRESHING && state != LOADING) {
                    if (state == DONE) {
                        // Nothing to do
                    }
                    if (state == PULL_To_REFRESH) {
                        state = DONE;
                        changeHeaderViewByState();

                        LogUtils.Logv(TAG, "Change status from PULL_To_REFRESH to Done");
                    }
                    if (state == RELEASE_To_REFRESH) {
                        state = REFRESHING;
                        changeHeaderViewByState();
                        onRefresh();

                        LogUtils.Logv(TAG,
                                "Change status from RELEASE_To_REFRESH to Done");
                    }
                }

                isRecored = false;
                isBack = false;

                super.dispatchTouchEvent(event);
                break;

            case MotionEvent.ACTION_MOVE:
                mGestureDetector.onTouchEvent(event);
                if (shouldSuperOnScroll) {
                    super.dispatchTouchEvent(event);
                    shouldSuperOnScroll = false;
                } else if (shouldInnerOnScroll) {
                    mListView.dispatchTouchEvent(event);
                    shouldInnerOnScroll = false;
                }
                break;
            }
        }
        return true;
    }

    // ////////////////////////////////////////////////////////////////////////////////////

    @Override
    public boolean onScroll(MotionEvent e1, MotionEvent e2, float distanceX,
            float distanceY) {

        float deltaX = Math.abs(e2.getX() - startX);
        float deltaY = Math.abs(e2.getY() - startY);

        if (deltaX > 10 && deltaX > 3 * deltaY) {
            LogUtils.Loge(TAG, "deltaX> 10 && deltaX>3*deltaY");
            shouldSuperOnScroll = true;
            return false;
        }

        int tempY = (int) e2.getY();

        if (state != REFRESHING && isRecored && state != LOADING) {

            if (state == RELEASE_To_REFRESH) {

//                mListView.setSelection(0);

                // pull up, and the head is covered partly
                if (((tempY - startY) / RATIO < headContentHeight)
                        && (tempY - startY) > 0) {
                    state = PULL_To_REFRESH;
                    changeHeaderViewByState();

                    LogUtils.Logv(TAG,
                            "Change status from RELEASE_To_REFRESH to PULL_To_REFRESH");
                }
                // Pull up, and the head is covered
                else if (tempY - startY <= 0) {
                    state = DONE;
                    changeHeaderViewByState();

                    LogUtils.Logv(TAG, "Change status from RELEASE_To_REFRESH to Done");
                }
            }
            if (state == PULL_To_REFRESH) {

//                mListView.setSelection(0);

                if ((tempY - startY) / RATIO >= headContentHeight) {
                    state = RELEASE_To_REFRESH;
                    isBack = true;
                    changeHeaderViewByState();

                    LogUtils.Logv(TAG,
                            "Change status from Done/PULL_To_REFRESH to RELEASE_To_REFRESH");
                } else if (tempY - startY <= 0) {
                    state = DONE;
                    changeHeaderViewByState();

                    LogUtils.Logv(TAG,
                            "Change status from Done/PULL_To_REFRESH to Done");
                }
            }

            if (state == DONE) {
                if (tempY - startY > 0
                        && mListView.getFirstVisiblePosition() == 0
                        || tempY - startY < 0
                        && mListView.getLastVisiblePosition() == mListView.getAdapter().getCount()-1-1) {
                    state = PULL_To_REFRESH;
                    changeHeaderViewByState();
                } else {
                    shouldInnerOnScroll = true;
                    return false;
                }
            }

            if (state == PULL_To_REFRESH) {
                mHeadView.setPadding(0, -1 * headContentHeight
                        + (tempY - startY) / RATIO, 0, 0);

            }

            if (state == RELEASE_To_REFRESH) {
                mHeadView.setPadding(0, (tempY - startY) / RATIO
                        - headContentHeight, 0, 0);
            }

        }
        return true;
    }

    @Override
    public boolean onDown(MotionEvent e) {
        return false;
    }

    @Override
    public boolean onFling(MotionEvent e1, MotionEvent e2, float velocityX,
            float velocityY) {
        return false;
    }

    @Override
    public void onLongPress(MotionEvent e) {
    }

    @Override
    public void onShowPress(MotionEvent e) {
    }

    @Override
    public boolean onSingleTapUp(MotionEvent e) {
        return false;
    }

}
