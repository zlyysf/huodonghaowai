package com.lingzhimobile.tongqu.view;

import android.content.Context;
import android.graphics.Bitmap;
import android.os.Handler;
import android.os.Message;
import android.util.AttributeSet;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.TextView;

import com.lingzhimobile.tongqu.R;
import com.lingzhimobile.tongqu.log.LogTag;
import com.lingzhimobile.tongqu.log.LogUtils;
import com.lingzhimobile.tongqu.model.DateListItem;
import com.lingzhimobile.tongqu.util.AppUtil;
import com.lingzhimobile.tongqu.util.ImageLoadUtil;
import com.lingzhimobile.tongqu.util.MethodHandler;

public class PreLoginViewPagerItemView extends FrameLayout{
    private Bitmap senderBm;

    public TextView tvDateBodyInfo;
    public TextView tvDateTitle;
    public ImageView ivUserProfilePhoto;
    public TextView tvTreat;
    public TextView tvLocation;
    public TextView tvDateTimeInfo;
    public TextView tvUserName;
    private Context context;
    
    boolean needNewInitThread = true;
    private DateListItem tempItem;
    private int mPosition;

    public PreLoginViewPagerItemView(Context context) {
        super(context);
        this.context = context;
        setupViews();
    }

    public PreLoginViewPagerItemView(Context context, AttributeSet attrs) {
        super(context, attrs);
        this.context = context;
        setupViews();
    }

    // 初始化View.
    private void setupViews() {
        LayoutInflater inflater = LayoutInflater.from(getContext());
        View view = inflater.inflate(R.layout.prelogin_date_item, null);
        tvDateBodyInfo = (TextView) view.findViewById(R.id.tvDateBodyInfo);
        tvDateTitle = (TextView) view.findViewById(R.id.tvDateTitle);
        tvDateTimeInfo = (TextView) view.findViewById(R.id.tvDateTimeInfo);
        tvLocation = (TextView) view.findViewById(R.id.tvDateLocationInfo);
        ivUserProfilePhoto = (ImageView) view
                .findViewById(R.id.ivUserProfilePhoto);
        tvUserName = (TextView) view.findViewById(R.id.tvUserName);
        tvTreat = (TextView) view.findViewById(R.id.tvTreat);

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
        tvUserName.setText(tempItem.getSender().getName());
        tvDateBodyInfo.setText(tempItem.getDateDescription());
        tvDateTitle.setText(tempItem.getDateTitle());
//        tvTreat.setText(AppUtil.getStringFromId(R.string.Treat)
//                + tempItem.getMonetaryunit() + tempItem.getDateMoney());
//        int plusIndex = tempItem.getCityLocation().lastIndexOf("+");
//        String cityName = "";
//        if (plusIndex != -1) {
//            cityName = tempItem.getCityLocation().substring(plusIndex + 1);
//        }
//        tvLocation.setText(cityName);
        tvDateTimeInfo.setText(AppUtil.formatTime(context,
                tempItem.getDateDate()));
        senderBm = tempItem.getSender().getBitmap();
        if (senderBm != null) {
            ivUserProfilePhoto.setImageBitmap(senderBm);
            ivUserProfilePhoto.setTag(null);
        } else {

            String user_image = tempItem.getSender().getPrimaryPhotoPath();
            if (ivUserProfilePhoto.getTag() != null) {
                if (user_image.equals(ivUserProfilePhoto.getTag().toString())) {
                    needNewInitThread = false;
                } else {
                    ImageLoadUtil.removeThread(ivUserProfilePhoto.getTag()
                            .toString());
                }
            }
            if (needNewInitThread
                    && !ImageLoadUtil.urlPool.containsKey(user_image)) {
                ivUserProfilePhoto.setTag(user_image);
                tempItem.getSender().getPostBitmapAsync(
                        new MethodHandler<Bitmap>() {
                            public void process(Bitmap para) {
                                Message msg = refreshImgHandler.obtainMessage(
                                        mPosition, ivUserProfilePhoto);
                                refreshImgHandler.sendMessage(msg);
                            }
                        });
            }
        }
    }

    /**
     * 内存回收.外部调用.
     */
    public void recycle() {
        LogUtils.Logd(LogTag.LOADIMAGE, mPosition+"--recycle");
        ivUserProfilePhoto.setImageBitmap(null);
        if ((this.senderBm == null) || (this.senderBm.isRecycled()))
            return;
        this.senderBm.recycle();
        this.senderBm = null;
    }

    /**
     * 重新加载.外部调用.
     */
    public void reload() {
        senderBm = tempItem.getSender().getBitmap();
        if (senderBm != null) {
            ivUserProfilePhoto.setImageBitmap(senderBm);
            ivUserProfilePhoto.setTag(null);
        } else {

            String user_image = tempItem.getSender().getPrimaryPhotoPath();
            if (ivUserProfilePhoto.getTag() != null) {
                if (user_image.equals(ivUserProfilePhoto.getTag().toString())) {
                    needNewInitThread = false;
                } else {
                    ImageLoadUtil.removeThread(ivUserProfilePhoto.getTag()
                            .toString());
                }
            }
            if (needNewInitThread
                    && !ImageLoadUtil.urlPool.containsKey(user_image)) {
                ivUserProfilePhoto.setTag(user_image);
                tempItem.getSender().getPostBitmapAsync(
                        new MethodHandler<Bitmap>() {
                            public void process(Bitmap para) {
                                Message msg = refreshImgHandler.obtainMessage(
                                        mPosition, ivUserProfilePhoto);
                                refreshImgHandler.sendMessage(msg);
                            }
                        });
            }
        }
    }
    
    Handler refreshImgHandler = new Handler() {
        public void handleMessage(android.os.Message msg) {
            ImageView iv = (ImageView) msg.obj;
            if (iv != null
                    && tempItem != null
                    && tempItem.getSender() != null
                    && tempItem.getSender().getPrimaryPhotoPath() != null
                    && tempItem.getSender().getPrimaryPhotoPath()
                            .equals(iv.getTag())) {
                senderBm = tempItem.getSender().getBitmap();
                iv.setImageBitmap(senderBm);
                iv.setTag(null);
            }
        };
    };

}
