package com.lingzhimobile.huodonghaowai.view;

import android.content.Context;
import android.graphics.Bitmap;
import android.os.Handler;
import android.os.Message;
import android.text.TextUtils;
import android.util.AttributeSet;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.model.DateListItem;
import com.lingzhimobile.huodonghaowai.util.AppUtil;
import com.lingzhimobile.huodonghaowai.util.ImageLoadUtil;
import com.lingzhimobile.huodonghaowai.util.MethodHandler;

public class ViewPagerItemView extends FrameLayout {

    private Bitmap datePhotoBm;

    public TextView tvDateBodyInfo;
    public TextView tvDateTitle;
    public ImageView ivDatePhoto;
    public TextView tvTreat;
    public TextView tvLocation;
    public TextView tvDateTimeInfo;
    public TextView tvPersonNum;
    public ProgressBar pbLoadImage;
    private Context context;
    
    boolean needNewInitThread = true;
    private DateListItem tempItem;
    private int mPosition;

    public ViewPagerItemView(Context context) {
        super(context);
        this.context = context;
        setupViews();
    }

    public ViewPagerItemView(Context context, AttributeSet attrs) {
        super(context, attrs);
        this.context = context;
        setupViews();
    }

    // 初始化View.
    private void setupViews() {
        LayoutInflater inflater = LayoutInflater.from(this.context);
        View view = inflater.inflate(R.layout.nearby_date_item, null);
        tvDateBodyInfo = (TextView) view
                .findViewById(R.id.tvDateBodyInfo);
        tvDateTitle = (TextView) view
                .findViewById(R.id.tvDateTitle);
        tvDateTimeInfo = (TextView) view
                .findViewById(R.id.tvDateTimeInfo);
        tvLocation = (TextView) view
                .findViewById(R.id.tvDateLocationInfo);
        ivDatePhoto = (ImageView) view
                .findViewById(R.id.ivDatePhoto);
        tvTreat = (TextView) view
                .findViewById(R.id.tvDateWhoPay);
        tvPersonNum = (TextView) view
                .findViewById(R.id.tvDatePersonNum);
        pbLoadImage = (ProgressBar) view
                .findViewById(R.id.pbLoadImage);

        addView(view);
    }

    /**
     * 填充数据，供外部调用.
     * 
     * @param object
     */
    public void setData(DateListItem tempItem, int position) {
        this.tempItem = tempItem;
        this.mPosition = position;
        tvDateBodyInfo.setText(tempItem.getDateDescription());
        tvDateTitle.setText(tempItem.getDateTitle());
        tvPersonNum.setText(tempItem.getExistPersonCount() + "+"
                + tempItem.getWantPersonCount());
        tvDateTimeInfo.setText(AppUtil.formatTime(context,
                tempItem.getDateDate()));
        tvLocation.setText(tempItem.getAddress());
        switch (tempItem.getWhoPay()) {
        case 0:
            tvTreat.setText(AppUtil
                    .getStringFromId(R.string.my_treat));
            break;
        case 2:
            tvTreat.setText(AppUtil.getStringFromId(R.string.aa));
            break;
        case 3:
            tvTreat.setText(AppUtil.getStringFromId(R.string.free));
        }
        if (!TextUtils.isEmpty(tempItem.getPhotoPath())) {
            datePhotoBm = tempItem.getBitmap();
            if (datePhotoBm != null) {
                ivDatePhoto.setImageBitmap(datePhotoBm);
                ivDatePhoto.setTag(null);
            } else {
                ivDatePhoto.setImageBitmap(null);
                pbLoadImage.setVisibility(View.VISIBLE);
                String user_image = tempItem.getPhotoPath();
                if (ivDatePhoto.getTag() != null) {
                    if (user_image.equals(ivDatePhoto.getTag()
                            .toString())) {
                        needNewInitThread = false;
                    } else {
                        ImageLoadUtil.removeThread(ivDatePhoto.getTag()
                                .toString());
                    }
                }
                if (needNewInitThread
                        && !ImageLoadUtil.urlPool.containsKey(user_image)) {
                    ivDatePhoto.setTag(user_image);
                    tempItem.getPostBitmapAsync(new MethodHandler<Bitmap>() {
                        public void process(Bitmap para) {
                            Message msg = refreshImgHandler.obtainMessage(
                                    0, ivDatePhoto);
                            refreshImgHandler.sendMessage(msg);
                        }
                    });
                }
            }
        } else if (!TextUtils.isEmpty(tempItem.getSender()
                .getPrimaryPhotoPath())) {
            datePhotoBm = tempItem.getSender().getBitmap();
            if (datePhotoBm != null) {
                ivDatePhoto.setImageBitmap(datePhotoBm);
                ivDatePhoto.setTag(null);
            } else {
                ivDatePhoto.setImageBitmap(null);
                pbLoadImage.setVisibility(View.VISIBLE);
                String user_image = tempItem.getSender().getPrimaryPhotoPath();
                if (ivDatePhoto.getTag() != null) {
                    if (user_image.equals(ivDatePhoto.getTag().toString())) {
                        needNewInitThread = false;
                    } else {
                        ImageLoadUtil.removeThread(ivDatePhoto.getTag()
                                .toString());
                    }
                }
                if (needNewInitThread
                        && !ImageLoadUtil.urlPool.containsKey(user_image)) {
                    ivDatePhoto.setTag(user_image);
                    tempItem.getSender().getPostBitmapAsync(
                            new MethodHandler<Bitmap>() {
                                public void process(Bitmap para) {
                                    Message msg = refreshImgHandler1
                                            .obtainMessage(0, ivDatePhoto);
                                    refreshImgHandler.sendMessage(msg);
                                }
                            });
                }
            }
        } else {
            ivDatePhoto.setImageResource(R.drawable.date_pre_bg1);
        }
    }

    /**
     * 内存回收.外部调用.
     */
    public void recycle() {
        LogUtils.Logd(LogTag.LOADIMAGE, mPosition+"--recycle");
        ivDatePhoto.setImageBitmap(null);
        if ((this.datePhotoBm == null) || (this.datePhotoBm.isRecycled()))
            return;
        this.datePhotoBm.recycle();
        this.datePhotoBm = null;
    }

    /**
     * 重新加载.外部调用.
     */
    public void reload() {
        if (!TextUtils.isEmpty(tempItem.getPhotoPath())) {
            datePhotoBm = tempItem.getBitmap();
            if (datePhotoBm != null) {
                ivDatePhoto.setImageBitmap(datePhotoBm);
                ivDatePhoto.setTag(null);
            } else {
                ivDatePhoto.setImageBitmap(null);
                pbLoadImage.setVisibility(View.VISIBLE);
                String user_image = tempItem.getPhotoPath();
                if (ivDatePhoto.getTag() != null) {
                    if (user_image.equals(ivDatePhoto.getTag()
                            .toString())) {
                        needNewInitThread = false;
                    } else {
                        ImageLoadUtil.removeThread(ivDatePhoto.getTag()
                                .toString());
                    }
                }
                if (needNewInitThread
                        && !ImageLoadUtil.urlPool.containsKey(user_image)) {
                    ivDatePhoto.setTag(user_image);
                    tempItem.getPostBitmapAsync(new MethodHandler<Bitmap>() {
                        public void process(Bitmap para) {
                            Message msg = refreshImgHandler.obtainMessage(
                                    0, ivDatePhoto);
                            refreshImgHandler.sendMessage(msg);
                        }
                    });
                }
            }
        } else if (!TextUtils.isEmpty(tempItem.getSender()
                .getPrimaryPhotoPath())) {
            datePhotoBm = tempItem.getSender().getBitmap();
            if (datePhotoBm != null) {
                ivDatePhoto.setImageBitmap(datePhotoBm);
                ivDatePhoto.setTag(null);
            } else {
                ivDatePhoto.setImageBitmap(null);
                pbLoadImage.setVisibility(View.VISIBLE);
                String user_image = tempItem.getSender().getPrimaryPhotoPath();
                if (ivDatePhoto.getTag() != null) {
                    if (user_image.equals(ivDatePhoto.getTag().toString())) {
                        needNewInitThread = false;
                    } else {
                        ImageLoadUtil.removeThread(ivDatePhoto.getTag()
                                .toString());
                    }
                }
                if (needNewInitThread
                        && !ImageLoadUtil.urlPool.containsKey(user_image)) {
                    ivDatePhoto.setTag(user_image);
                    tempItem.getSender().getPostBitmapAsync(
                            new MethodHandler<Bitmap>() {
                                public void process(Bitmap para) {
                                    Message msg = refreshImgHandler1
                                            .obtainMessage(0, ivDatePhoto);
                                    refreshImgHandler.sendMessage(msg);
                                }
                            });
                }
            }
        } else {
            ivDatePhoto.setImageResource(R.drawable.date_pre_bg1);
        }
    }
    
    Handler refreshImgHandler1 = new Handler() {
        public void handleMessage(android.os.Message msg) {
            ImageView iv = (ImageView) msg.obj;
            if (iv != null
                    && tempItem != null
                    && tempItem.getSender() != null
                    && tempItem.getSender().getPrimaryPhotoPath() != null
                    && tempItem.getSender().getPrimaryPhotoPath()
                            .equals(iv.getTag())) {
                datePhotoBm = tempItem.getSender().getBitmap();
                iv.setImageBitmap(datePhotoBm);
                iv.setTag(null);
            }
        };
    };
    Handler refreshImgHandler = new Handler() {
        public void handleMessage(android.os.Message msg) {
            ImageView iv = (ImageView) msg.obj;
            if (iv != null
                    && tempItem != null
                    && tempItem.getPhotoPath().equals(iv.getTag())) {
                datePhotoBm = tempItem.getBitmap();
                iv.setImageBitmap(datePhotoBm);
                iv.setTag(null);
            }
        };
    };

}
