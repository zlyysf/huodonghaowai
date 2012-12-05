package com.lingzhimobile.tongqu.adapter;

import java.util.List;

import android.content.Context;
import android.graphics.Bitmap;
import android.os.Handler;
import android.os.Message;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.ImageView;
import android.widget.TextView;

import com.lingzhimobile.tongqu.R;
import com.lingzhimobile.tongqu.model.DateListItem;
import com.lingzhimobile.tongqu.util.AppUtil;
import com.lingzhimobile.tongqu.util.ImageLoadUtil;
import com.lingzhimobile.tongqu.util.MethodHandler;

public class PreLoginDateAdapter extends BaseAdapter {
    private List<DateListItem> dateItems;
    private Context context;
    private LayoutInflater inflater;
    public boolean needRemoveBitmap;

    public PreLoginDateAdapter(Context context, List<DateListItem> dateItems) {
        this.context = context;
        this.dateItems = dateItems;
        inflater = (LayoutInflater) context
                .getSystemService(Context.LAYOUT_INFLATER_SERVICE);
    }
    
    public void setData(List<DateListItem> dateItems){
        this.dateItems = dateItems;
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
            convertView = inflater.inflate(R.layout.prelogin_date_item, null);
            viewHolder = new ViewHolder();
            viewHolder.tvDateBodyInfo = (TextView) convertView
                    .findViewById(R.id.tvDateBodyInfo);
            viewHolder.tvDateTitle = (TextView) convertView
                    .findViewById(R.id.tvDateTitle);
            viewHolder.tvDateTimeInfo = (TextView) convertView
                    .findViewById(R.id.tvDateTimeInfo);
            viewHolder.tvLocation = (TextView) convertView
                    .findViewById(R.id.tvDateLocationInfo);
            viewHolder.ivUserProfilePhoto = (ImageView) convertView
                    .findViewById(R.id.ivUserProfilePhoto);
            viewHolder.tvUserName = (TextView) convertView
                    .findViewById(R.id.tvUserName);
            viewHolder.tvTreat = (TextView) convertView
                    .findViewById(R.id.tvTreat);
            convertView.setTag(viewHolder);
        } else {
            viewHolder = (ViewHolder) convertView.getTag();
        }
        viewHolder.tvUserName.setText(tempItem.getSender().getName());
        viewHolder.tvDateBodyInfo.setText(tempItem.getDateDescription());
        viewHolder.tvDateTitle.setText(tempItem.getDateTitle());
//        viewHolder.tvTreat.setText(AppUtil.getStringFromId(R.string.Treat)
//                + tempItem.getMonetaryunit() + tempItem.getDateMoney());
//        int plusIndex = tempItem.getCityLocation().lastIndexOf("+");
//        String cityName = "";
//        if (plusIndex != -1) {
//            cityName = tempItem.getCityLocation().substring(plusIndex + 1);
//        }
//        viewHolder.tvLocation.setText(cityName);
        viewHolder.tvDateTimeInfo.setText(AppUtil.formatTime(context,
                tempItem.getDateDate()));
        if (needRemoveBitmap) {
            viewHolder.ivUserProfilePhoto.setImageBitmap(null);
        } else {
            Bitmap senderBm = tempItem.getSender().getBitmap();
            if (senderBm != null) {
                viewHolder.ivUserProfilePhoto.setImageBitmap(senderBm);
                viewHolder.ivUserProfilePhoto.setTag(null);
            } else {

                String user_image = tempItem.getSender().getPrimaryPhotoPath();
                if (viewHolder.ivUserProfilePhoto.getTag() != null) {
                    if (user_image.equals(viewHolder.ivUserProfilePhoto
                            .getTag().toString())) {
                        needNewInitThread = false;
                    } else {
                        ImageLoadUtil
                                .removeThread(viewHolder.ivUserProfilePhoto
                                        .getTag().toString());
                    }
                }
                if (needNewInitThread
                        && !ImageLoadUtil.urlPool.containsKey(user_image)) {
                    viewHolder.ivUserProfilePhoto.setTag(user_image);
                    tempItem.getSender().getPostBitmapAsync(
                            new MethodHandler<Bitmap>() {
                                public void process(Bitmap para) {
                                    Message msg = refreshImgHandler
                                            .obtainMessage(
                                                    position,
                                                    viewHolder.ivUserProfilePhoto);
                                    refreshImgHandler.sendMessage(msg);
                                }
                            });
                }
            }
        }
        return convertView;
    }

    class ViewHolder {
        public TextView tvDateBodyInfo;
        public TextView tvDateTitle;
        public ImageView ivUserProfilePhoto;
        public TextView tvTreat;
        public TextView tvLocation;
        public TextView tvDateTimeInfo;
        public TextView tvUserName;

    }

    Handler refreshImgHandler = new Handler() {
        public void handleMessage(android.os.Message msg) {
            ImageView iv = (ImageView) msg.obj;
            int position = msg.what;
            if (dateItems == null || position >= dateItems.size()
                    || position < 0)
                return;
            DateListItem dli = dateItems.get(position);
            if (iv != null
                    && dli != null
                    && dli.getSender() != null
                    && dli.getSender().getPrimaryPhotoPath() != null
                    && dli.getSender().getPrimaryPhotoPath()
                            .equals(iv.getTag())) {
                iv.setImageBitmap(dli.getSender().getBitmap());
                iv.setTag(null);
            }
        };
    };

}
