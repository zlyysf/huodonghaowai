package com.lingzhimobile.huodonghaowai.view;

import java.util.Date;

import android.content.Context;
import android.os.Handler;
import android.os.Message;
import android.util.AttributeSet;
import android.view.LayoutInflater;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.LinearInterpolator;
import android.view.animation.RotateAnimation;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.util.AppUtil;

public class BouncyRefreshLazyScrollView extends ScrollView {
    private static final String TAG = "ElasticScrollView";
    private final static int RELEASE_To_REFRESH = 0;
    private final static int PULL_To_REFRESH = 1;
    private final static int REFRESHING = 2;
    private final static int DONE = 3;
    private final static int LOADING = 4;
    // 实际的padding的距离与界面上偏移距离的比例
    private final static int RATIO = 3;

    private int headContentWidth;
    private int headContentHeight;

    private LinearLayout innerLayout;
    private LinearLayout headView;
    private LinearLayout containner;
    private ImageView arrowImageView;
    private ProgressBar progressBar;
    private TextView tipsTextview;
    private TextView lastUpdatedTextView;
    private OnRefreshListener refreshListener;
    private boolean isRefreshable;
    private int state;
    private boolean isBack;

    private RotateAnimation animation;
    private RotateAnimation reverseAnimation;

    private boolean canReturn;
    private boolean isRecored;
    private int startY;

    private String mPullLabel;
    private String mRefreshingLabel;
    private String mReleaseLabel;

    @Override
    protected void onScrollChanged(int l, int t, int oldl, int oldt) {
        super.onScrollChanged(l, t, oldl, oldt);
        if (t > 0) {
            onScrollListener.onAutoScroll(l, t, oldl, oldt);
        }
    }

    private static final String tag = "LazyScrollView";
    private Handler handler;
    private View view;

    public BouncyRefreshLazyScrollView(Context context) {
        super(context);
        init(context);
    }

    public BouncyRefreshLazyScrollView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init(context);

    }

    public BouncyRefreshLazyScrollView(Context context, AttributeSet attrs,
            int defStyle) {
        super(context, attrs, defStyle);
        init(context);
    }

    private void init(Context context) {
        LayoutInflater inflater = LayoutInflater.from(context);
        innerLayout = new LinearLayout(context);
        innerLayout.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.FILL_PARENT,
                LinearLayout.LayoutParams.FILL_PARENT));
        innerLayout.setOrientation(LinearLayout.VERTICAL);

        headView = (LinearLayout) inflater.inflate(R.layout.mylistview_head,
                null);

        arrowImageView = (ImageView) headView
                .findViewById(R.id.head_arrowImageView);
        arrowImageView.setMinimumWidth(50);
        arrowImageView.setMinimumHeight(45);
        progressBar = (ProgressBar) headView
                .findViewById(R.id.head_progressBar);
        tipsTextview = (TextView) headView.findViewById(R.id.head_tipsTextView);
        tipsTextview.setTextSize(14);
        lastUpdatedTextView = (TextView) headView
                .findViewById(R.id.head_lastUpdatedTextView);
        measureView(headView);

        headContentHeight = headView.getMeasuredHeight();
        headContentWidth = headView.getMeasuredWidth();
        headView.setPadding(0, -1 * headContentHeight, 0, 0);
        headView.invalidate();

        LogUtils.Logi("size", "width:" + headContentWidth + " height:"
                + headContentHeight);

        innerLayout.addView(headView);

        containner = new LinearLayout(context);
        containner.setLayoutParams(new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.FILL_PARENT,
                LinearLayout.LayoutParams.FILL_PARENT));
        innerLayout.addView(containner);
        addView(innerLayout);

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
        
        mPullLabel = context.getString(R.string.pull_to_refresh_pull_label);
        mRefreshingLabel = context
                .getString(R.string.pull_to_refresh_refreshing_label);
        mReleaseLabel = context.getString(R.string.pull_to_refresh_release_label);

        state = DONE;
        isRefreshable = true;
        canReturn = false;
        
        lastUpdatedTextView.setText(context.getString(R.string.last_update)
                + new Date().toLocaleString());

    }

    // 这个获得总的高度
    public int computeVerticalScrollRange() {
        return super.computeHorizontalScrollRange();
    }

    public int computeVerticalScrollOffset() {
        return super.computeVerticalScrollOffset();
    }

    private void init() {

        this.setOnTouchListener(onTouchListener);
        handler = new Handler() {
            @Override
            public void handleMessage(Message msg) {
                // process incoming messages here
                super.handleMessage(msg);
                switch (msg.what) {
                case 1:
                    if (view.getMeasuredHeight() - 20 <= getScrollY()
                            + getHeight()) {
                        if (onScrollListener != null) {
                            onScrollListener.onBottom();
                        }

                    } else if (getScrollY() == 0) {
                        if (onScrollListener != null) {
                            onScrollListener.onTop();
                        }
                    } else {
                        if (onScrollListener != null) {
                            onScrollListener.onScroll();
                        }
                    }
                    break;
                default:
                    break;
                }
            }
        };

    }

    OnTouchListener onTouchListener = new OnTouchListener() {

        @Override
        public boolean onTouch(View v, MotionEvent event) {
            if (isRefreshable) {
                switch (event.getAction()) {
                case MotionEvent.ACTION_DOWN:
                    if (getScrollY() == 0 && !isRecored) {
                        isRecored = true;
                        startY = (int) event.getY();
                        LogUtils.Logi(TAG, "在down时候记录当前位置‘");
                    }
                    break;
                case MotionEvent.ACTION_UP:
                    if (state != REFRESHING && state != LOADING) {
                        if (state == DONE) {
                            // 什么都不做
                        }
                        if (state == PULL_To_REFRESH) {
                            state = DONE;
                            changeHeaderViewByState();
                            LogUtils.Logi(TAG, "由下拉刷新状态，到done状态");
                        }
                        if (state == RELEASE_To_REFRESH) {
                            state = REFRESHING;
                            changeHeaderViewByState();
                            onRefresh();
                            LogUtils.Logi(TAG, "由松开刷新状态，到done状态");
                        }
                    }
                    isRecored = false;
                    isBack = false;

                    break;
                case MotionEvent.ACTION_MOVE:
                    int tempY = (int) event.getY();
                    if (!isRecored && getScrollY() == 0) {
                        LogUtils.Logi(TAG, "在move时候记录下位置");
                        isRecored = true;
                        startY = tempY;
                    }

                    if (state != REFRESHING && isRecored && state != LOADING) {
                        // 可以松手去刷新了
                        if (state == RELEASE_To_REFRESH) {
                            canReturn = true;

                            if (((tempY - startY) / RATIO < headContentHeight)
                                    && (tempY - startY) > 0) {
                                state = PULL_To_REFRESH;
                                changeHeaderViewByState();
                                LogUtils.Logi(TAG, "由松开刷新状态转变到下拉刷新状态");
                            }
                            // 一下子推到顶了
                            else if (tempY - startY <= 0) {
                                state = DONE;
                                changeHeaderViewByState();
                                LogUtils.Logi(TAG, "由松开刷新状态转变到done状态");
                            } else {
                                // 不用进行特别的操作，只用更新paddingTop的值就行了
                            }
                        }
                        // 还没有到达显示松开刷新的时候,DONE或者是PULL_To_REFRESH状态
                        if (state == PULL_To_REFRESH) {
                            canReturn = true;

                            // 下拉到可以进入RELEASE_TO_REFRESH的状态
                            if ((tempY - startY) / RATIO >= headContentHeight) {
                                state = RELEASE_To_REFRESH;
                                isBack = true;
                                changeHeaderViewByState();
                                LogUtils.Logi(TAG, "由done或者下拉刷新状态转变到松开刷新");
                            }
                            // 上推到顶了
                            else if (tempY - startY <= 0) {
                                state = DONE;
                                changeHeaderViewByState();
                                LogUtils.Logi(TAG, "由DOne或者下拉刷新状态转变到done状态");
                            }
                        }

                        // done状态下
                        if (state == DONE) {
                            if (tempY - startY > 0) {
                                state = PULL_To_REFRESH;
                                changeHeaderViewByState();
                            }
                        }

                        // 更新headView的size
                        if (state == PULL_To_REFRESH) {
                            headView.setPadding(0, -1 * headContentHeight
                                    + (tempY - startY) / RATIO, 0, 0);

                        }

                        // 更新headView的paddingTop
                        if (state == RELEASE_To_REFRESH) {
                            headView.setPadding(0, (tempY - startY) / RATIO
                                    - headContentHeight, 0, 0);
                        }
                        if (canReturn) {
                            canReturn = false;
                            return true;
                        }
                    }
                    break;
                }
            }

            switch (event.getAction()) {
            case MotionEvent.ACTION_DOWN:
                break;
            case MotionEvent.ACTION_UP:
                if (view != null && onScrollListener != null) {
                    handler.sendMessageDelayed(handler.obtainMessage(1), 200);
                }
                break;

            default:
                break;
            }
            return false;
        }

    };

    /**
     * 获得参考的View，主要是为了获得它的MeasuredHeight，然后和滚动条的ScrollY+getHeight作比较。
     */
    public void getView() {
        this.view = getChildAt(0);
        if (view != null) {
            init();
        }
    }

    /**
     * 定义接口
     * 
     * @author admin
     * 
     */
    public interface OnScrollListener {
        void onBottom();

        void onTop();

        void onScroll();

        void onAutoScroll(int l, int t, int oldl, int oldt);
    }

    private OnScrollListener onScrollListener;

    public void setOnScrollListener(OnScrollListener onScrollListener) {
        this.onScrollListener = onScrollListener;
    }

    // 当状态改变时候，调用该方法，以更新界面
    private void changeHeaderViewByState() {
        switch (state) {
        case RELEASE_To_REFRESH:
            arrowImageView.setVisibility(View.VISIBLE);
            progressBar.setVisibility(View.GONE);
            tipsTextview.setVisibility(View.VISIBLE);
            lastUpdatedTextView.setVisibility(View.VISIBLE);

            arrowImageView.clearAnimation();
            arrowImageView.startAnimation(animation);

            tipsTextview.setText(mReleaseLabel);

            LogUtils.Logi(TAG, "当前状态，松开刷新");
            break;
        case PULL_To_REFRESH:
            progressBar.setVisibility(View.GONE);
            tipsTextview.setVisibility(View.VISIBLE);
            lastUpdatedTextView.setVisibility(View.VISIBLE);
            arrowImageView.clearAnimation();
            arrowImageView.setVisibility(View.VISIBLE);
            // 是由RELEASE_To_REFRESH状态转变来的
            if (isBack) {
                isBack = false;
                arrowImageView.clearAnimation();
                arrowImageView.startAnimation(reverseAnimation);

                tipsTextview.setText(mPullLabel);
            } else {
                tipsTextview.setText(mPullLabel);
            }
            LogUtils.Logi(TAG, "当前状态，下拉刷新");
            break;

        case REFRESHING:

            headView.setPadding(0, 0, 0, 0);

            progressBar.setVisibility(View.VISIBLE);
            arrowImageView.clearAnimation();
            arrowImageView.setVisibility(View.GONE);
            tipsTextview.setText(mRefreshingLabel);
            lastUpdatedTextView.setVisibility(View.GONE);

            LogUtils.Logi(TAG, "当前状态,正在刷新...");
            break;
        case DONE:
            headView.setPadding(0, -1 * headContentHeight, 0, 0);

            progressBar.setVisibility(View.GONE);
            arrowImageView.clearAnimation();
            arrowImageView.setImageResource(R.drawable.ic_pulltorefresh_arrow);
            tipsTextview.setText(mPullLabel);
            lastUpdatedTextView.setVisibility(View.VISIBLE);

            LogUtils.Logi(TAG, "当前状态，done");
            break;
        }
    }

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

    public void setonRefreshListener(OnRefreshListener refreshListener) {
        this.refreshListener = refreshListener;
        isRefreshable = true;
    }

    public interface OnRefreshListener {
        public void onRefresh();
    }

    public void onRefreshComplete() {
        state = DONE;
        lastUpdatedTextView.setText(AppUtil.getStringFromId(R.string.last_update)
                + new Date().toLocaleString());
        changeHeaderViewByState();
        invalidate();
        scrollTo(0, 0);
    }

    private void onRefresh() {
        if (refreshListener != null) {
            refreshListener.onRefresh();
        }
    }

    public void addChild(View child) {
        containner.addView(child);
    }

    public void addChild(View child, int position) {
        containner.addView(child, position);
    }
    
    public void setPullLabel(String pullLabel) {
        mPullLabel = pullLabel;
    }
    public void setReleaseLabel(String releaseLabel) {
        mReleaseLabel = releaseLabel;
    }
}
