package com.lingzhimobile.huodonghaowai.adapter;

import java.util.List;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Handler;
import android.os.Message;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentTransaction;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.ImageView;
import android.widget.TextView;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.fragment.ProfileFragment;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.model.DateListItem;
import com.lingzhimobile.huodonghaowai.util.AppInfo;
import com.lingzhimobile.huodonghaowai.util.AppUtil;
import com.lingzhimobile.huodonghaowai.util.ImageLoadUtil;
import com.lingzhimobile.huodonghaowai.util.MethodHandler;

public class NearbyDateListAdapter extends BaseAdapter {

    private static final String LocalLogTag = LogTag.ACTIVITY + " NearbyDateListAdapter";

    private final List<DateListItem> dateItems;
    private final Context context;
    private final Fragment frag;
    private final LayoutInflater inflater;

    public NearbyDateListAdapter(Context context, Fragment frag,
            List<DateListItem> dateItems) {
        this.context = context;
        this.frag = frag;
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
        final DateListItem tempItem = dateItems.get(position);
        final ViewHolder viewHolder;
        boolean needNewInitThread = true;
        if (convertView == null) {
            convertView = inflater.inflate(R.layout.nearbydatelistitem, null);
            viewHolder = new ViewHolder();
            viewHolder.ivUserPhoto = (ImageView) convertView
                    .findViewById(R.id.ivUserProfilePhoto);
            viewHolder.tvDateBodyInfo = (TextView) convertView
                    .findViewById(R.id.tvDateBodyInfo);
            viewHolder.tvUserName = (TextView) convertView
                    .findViewById(R.id.tvUserName);
            viewHolder.tvDateTitle = (TextView) convertView
                    .findViewById(R.id.tvDateTitle);
            viewHolder.tvDateTime = (TextView) convertView
                    .findViewById(R.id.tvDateTimeInfo);
            viewHolder.tvDatePersonNum = (TextView) convertView
                    .findViewById(R.id.tvDatePersonNum);
            viewHolder.tvDateTreat = (TextView) convertView
                    .findViewById(R.id.tvTreat);
            convertView.setTag(viewHolder);
        } else {
            viewHolder = (ViewHolder) convertView.getTag();
        }
        Bitmap senderBm = tempItem.getSender().getSmallBitmap();
        if (senderBm != null) {
            LogUtils.Logd(LocalLogTag, "NearbyDateListAdapter.getView, senderBm != null, getPhotoPath="+tempItem.getPhotoPath());
            viewHolder.ivUserPhoto.setImageBitmap(senderBm);
            viewHolder.ivUserPhoto.setTag(null);
        } else {
            viewHolder.ivUserPhoto.setImageResource(R.drawable.profile_photo);
            String user_image = tempItem.getSender().getSmallPhotoPath();

            if (viewHolder.ivUserPhoto.getTag() != null) {
                if (user_image.equals(viewHolder.ivUserPhoto.getTag()
                        .toString())) {
                    needNewInitThread = false;
                } else {
                    ImageLoadUtil.removeThread(viewHolder.ivUserPhoto.getTag()
                            .toString());
                }
            }
            if (needNewInitThread
                    && !ImageLoadUtil.urlPool.containsKey(user_image)) {
                viewHolder.ivUserPhoto.setTag(user_image);
                LogUtils.Logd(LocalLogTag, "NearbyDateListAdapter.getView, before getSmallPostBitmapAsync, user_image="+user_image);
                tempItem.getSender().getSmallPostBitmapAsync(
                        new MethodHandler<Bitmap>() {
                            @Override
                            public void process(Bitmap para) {
                                Message msg = refreshImgHandler.obtainMessage(
                                        position, viewHolder.ivUserPhoto);
                                refreshImgHandler.sendMessage(msg);
                            }
                        });
            }
        }
        viewHolder.ivUserPhoto.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                ProfileFragment newFragment = ProfileFragment.newInstance(
                        tempItem.getSender().getUserId(),
                        R.string.latest_activity);
                FragmentTransaction ft = frag.getFragmentManager()
                        .beginTransaction();

                ft.setCustomAnimations(R.anim.push_left_in,
                        R.anim.push_left_out, R.anim.push_right_in,
                        R.anim.push_right_out);
                ft.replace(R.id.fragment01, newFragment);
                ft.addToBackStack(null);
                ft.commit();
            }
        });
        viewHolder.tvUserName.setText(tempItem.getSender().getName());
        viewHolder.tvUserName.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                ProfileFragment newFragment = ProfileFragment.newInstance(
                        tempItem.getSender().getUserId(),
                        R.string.latest_activity);
                FragmentTransaction ft = frag.getFragmentManager()
                        .beginTransaction();

                ft.setCustomAnimations(R.anim.push_left_in,
                        R.anim.push_left_out, R.anim.push_right_in,
                        R.anim.push_right_out);
                ft.replace(R.id.fragment01, newFragment);
                ft.addToBackStack(null);
                ft.commit();
            }
        });
        viewHolder.tvDateTitle.setText(tempItem.getDateTitle());
        viewHolder.tvDateBodyInfo.setText(tempItem.getDateDescription());
        viewHolder.tvDatePersonNum.setText(tempItem.getExistPersonCount() + "+"
                + tempItem.getWantPersonCount());
        viewHolder.tvDateTime.setText(AppUtil.formatSimpleTime(context,
                tempItem.getDateDate()));
        switch (tempItem.getWhoPay()) {
        case 0:
            viewHolder.tvDateTreat.setText(AppUtil
                    .getStringFromId(R.string.my_treat));
            break;
        case 2:
            viewHolder.tvDateTreat
                    .setText(AppUtil.getStringFromId(R.string.aa));
            break;
        case 3:
            viewHolder.tvDateTreat.setText(AppUtil
                    .getStringFromId(R.string.free));
        }
        return convertView;
    }

    Handler refreshImgHandler = new Handler() {
        @Override
        public void handleMessage(android.os.Message msg) {
            ImageView iv = (ImageView) msg.obj;
            int position = msg.what;
            if (dateItems == null || position >= dateItems.size()
                    || position < 0)
                return;
            DateListItem dli = dateItems.get(position);
            if (iv != null && dli != null && dli.getSender() != null
                    && dli.getSender().getSmallPhotoPath() != null
                    && dli.getSender().getSmallPhotoPath().equals(iv.getTag())) {
                iv.setImageBitmap(dli.getSender().getSmallBitmap());
                iv.setTag(null);
            }
        };
    };

    class ViewHolder {
        public TextView tvDateBodyInfo;
        public ImageView ivUserPhoto;
        public TextView tvUserName;
        public TextView tvDateTitle;
        public TextView tvDateTime;
        public TextView tvDatePersonNum;
        public TextView tvDateTreat;
    }

}
