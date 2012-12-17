package com.lingzhimobile.huodonghaowai.adapter;

import java.util.ArrayList;
import java.util.List;

import android.content.Context;
import android.graphics.Bitmap;
import android.os.Handler;
import android.os.Message;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.model.DateListItem;
import com.lingzhimobile.huodonghaowai.util.AppUtil;
import com.lingzhimobile.huodonghaowai.util.ImageLoadUtil;
import com.lingzhimobile.huodonghaowai.util.MethodHandler;

public class PageSwitchAdapter extends BaseAdapter {
    private List<DateListItem> dateItems;
    private Context context;
    private LayoutInflater inflater;
    public boolean needRemoveBitmap;

    public PageSwitchAdapter(Context context, List<DateListItem> dateItems) {
        this.context = context;
        this.dateItems = dateItems;
        inflater = (LayoutInflater) context
                .getSystemService(Context.LAYOUT_INFLATER_SERVICE);
    }

    @Override
    public int getCount() {
        return dateItems.size();
    }

    @Override
    public Object getItem(int position) {
        return dateItems.get(position);
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public View getView(final int position, View convertView, ViewGroup parent) {
        if (position < 0 || position >= getCount()) {
            return null;
        }
        final DateListItem tempItem = dateItems.get(position);
        final ViewHolder viewHolder;
        boolean needNewInitThread = true;
        if (convertView == null) {
            convertView = inflater.inflate(R.layout.nearby_date_item, null);
            viewHolder = new ViewHolder();
            viewHolder.tvDateBodyInfo = (TextView) convertView
                    .findViewById(R.id.tvDateBodyInfo);
            viewHolder.tvDateTitle = (TextView) convertView
                    .findViewById(R.id.tvDateTitle);
            viewHolder.tvDateTimeInfo = (TextView) convertView
                    .findViewById(R.id.tvDateTimeInfo);
            viewHolder.tvLocation = (TextView) convertView
                    .findViewById(R.id.tvDateLocationInfo);
            viewHolder.ivDatePhoto = (ImageView) convertView
                    .findViewById(R.id.ivDatePhoto);
            viewHolder.tvTreat = (TextView) convertView
                    .findViewById(R.id.tvDateWhoPay);
            viewHolder.tvPersonNum = (TextView) convertView
                    .findViewById(R.id.tvDatePersonNum);
            viewHolder.pbLoadImage = (ProgressBar) convertView
                    .findViewById(R.id.pbLoadImage);
            convertView.setTag(viewHolder);
        } else {
            viewHolder = (ViewHolder) convertView.getTag();
        }
        viewHolder.tvDateBodyInfo.setText(tempItem.getDateDescription());
        viewHolder.tvDateTitle.setText(tempItem.getDateTitle());
        viewHolder.tvPersonNum.setText(tempItem.getExistPersonCount() + "+"
                + tempItem.getWantPersonCount());
        viewHolder.tvDateTimeInfo.setText(AppUtil.formatTime(context,
                tempItem.getDateDate()));
        viewHolder.tvLocation.setText(tempItem.getAddress());
        switch (tempItem.getWhoPay()) {
        case 0:
            viewHolder.tvTreat.setText(AppUtil
                    .getStringFromId(R.string.my_treat));
            break;
        case 2:
            viewHolder.tvTreat.setText(AppUtil.getStringFromId(R.string.aa));
            break;
        case 3:
            viewHolder.tvTreat.setText(AppUtil.getStringFromId(R.string.free));
        }
        if (needRemoveBitmap) {
            viewHolder.ivDatePhoto.setImageBitmap(null);
        } else if (!TextUtils.isEmpty(tempItem.getPhotoPath())) {
            Bitmap dateBm = tempItem.getBitmap();
            if (dateBm != null) {
                viewHolder.ivDatePhoto.setImageBitmap(dateBm);
                viewHolder.ivDatePhoto.setTag(null);
            } else {
                viewHolder.ivDatePhoto.setImageBitmap(null);
                viewHolder.pbLoadImage.setVisibility(View.VISIBLE);
                String user_image = tempItem.getPhotoPath();
                if (viewHolder.ivDatePhoto.getTag() != null) {
                    if (user_image.equals(viewHolder.ivDatePhoto.getTag()
                            .toString())) {
                        needNewInitThread = false;
                    } else {
                        ImageLoadUtil.removeThread(viewHolder.ivDatePhoto.getTag()
                                .toString());
                    }
                }
                if (needNewInitThread
                        && !ImageLoadUtil.urlPool.containsKey(user_image)) {
                    viewHolder.ivDatePhoto.setTag(user_image);
                    tempItem.getPostBitmapAsync(new MethodHandler<Bitmap>() {
                        public void process(Bitmap para) {
                            Message msg = refreshImgHandler.obtainMessage(
                                    position, viewHolder.ivDatePhoto);
                            refreshImgHandler.sendMessage(msg);
                        }
                    });
                }
            }
        } else if (!TextUtils.isEmpty(tempItem.getSender()
                .getPrimaryPhotoPath())) {
            Bitmap senderBm = tempItem.getSender().getBitmap();
            if (senderBm != null) {
                viewHolder.ivDatePhoto.setImageBitmap(senderBm);
                viewHolder.ivDatePhoto.setTag(null);
            } else {
                viewHolder.ivDatePhoto.setImageBitmap(null);
                viewHolder.pbLoadImage.setVisibility(View.VISIBLE);
                String user_image = tempItem.getSender().getPrimaryPhotoPath();
                if (viewHolder.ivDatePhoto.getTag() != null) {
                    if (user_image.equals(viewHolder.ivDatePhoto.getTag().toString())) {
                        needNewInitThread = false;
                    } else {
                        ImageLoadUtil.removeThread(viewHolder.ivDatePhoto.getTag()
                                .toString());
                    }
                }
                if (needNewInitThread
                        && !ImageLoadUtil.urlPool.containsKey(user_image)) {
                    viewHolder.ivDatePhoto.setTag(user_image);
                    tempItem.getSender().getPostBitmapAsync(
                            new MethodHandler<Bitmap>() {
                                public void process(Bitmap para) {
                                    Message msg = refreshImgHandler1
                                            .obtainMessage(position, viewHolder.ivDatePhoto);
                                    refreshImgHandler.sendMessage(msg);
                                }
                            });
                }
            }
        } else {
            viewHolder.ivDatePhoto.setImageResource(R.drawable.date_pre_bg1);
        }
        return convertView;
    }

    class ViewHolder {
        public TextView tvDateBodyInfo;
        public TextView tvDateTitle;
        public ImageView ivDatePhoto;
        public TextView tvTreat;
        public TextView tvLocation;
        public TextView tvDateTimeInfo;
        public TextView tvPersonNum;
        public ProgressBar pbLoadImage;

    }

    Handler refreshImgHandler = new Handler() {
        public void handleMessage(android.os.Message msg) {
            ImageView iv = (ImageView) msg.obj;
            int position = msg.what;
            if (dateItems == null || position >= dateItems.size()
                    || position < 0)
                return;
            DateListItem dli = dateItems.get(position);
            if (dli != null && dli.getPhotoPath() != null
                    && dli.getPhotoPath().equals(iv.getTag().toString())) {
                iv.setImageBitmap(dli.getBitmap());
                iv.setTag(null);
            }
        };
    };
    Handler refreshImgHandler1 = new Handler() {
        public void handleMessage(android.os.Message msg) {
            ImageView iv = (ImageView) msg.obj;
            int position = msg.what;
            if (dateItems == null || position >= dateItems.size()
                    || position < 0)
                return;
            DateListItem dli = dateItems.get(position);
            if (dli != null
                    && dli.getSender() != null
                    && dli.getSender().getPrimaryPhotoPath() != null
                    && dli.getSender().getPrimaryPhotoPath()
                            .equals(iv.getTag().toString())) {
                iv.setImageBitmap(dli.getSender().getBitmap());
                iv.setTag(null);
            }
        };
    };

}
