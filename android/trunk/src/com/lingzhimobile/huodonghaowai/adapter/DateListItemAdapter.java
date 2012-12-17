package com.lingzhimobile.huodonghaowai.adapter;

import java.util.List;

import android.content.Context;
import android.content.Intent;
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
import com.lingzhimobile.huodonghaowai.activity.DateDetail;
import com.lingzhimobile.huodonghaowai.fragment.ProfileFragment;
import com.lingzhimobile.huodonghaowai.model.DateListItem;
import com.lingzhimobile.huodonghaowai.util.AppInfo;
import com.lingzhimobile.huodonghaowai.util.AppUtil;
import com.lingzhimobile.huodonghaowai.util.ImageLoadUtil;
import com.lingzhimobile.huodonghaowai.util.MethodHandler;

public class DateListItemAdapter extends BaseAdapter {
    private List<DateListItem> messageItems;
    private Context context;
    private Fragment frag;
    private LayoutInflater inflater;
    public boolean isBusy;
    public boolean needRemoveBitmap;
    private String type;

    public DateListItemAdapter(Context context, Fragment frag, String type,
            List<DateListItem> messageItems) {
        this.context = context;
        this.frag = frag;
        this.type = type;
        this.messageItems = messageItems;
        inflater = (LayoutInflater) context
                .getSystemService(Context.LAYOUT_INFLATER_SERVICE);
    }

    @Override
    public int getCount() {
        return messageItems.size();
    }

    @Override
    public Object getItem(int position) {
        return messageItems.get(position);
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public View getView(final int position, View convertView, ViewGroup parent) {
        final DateListItem tempItem = messageItems.get(position);
        final ViewHolder viewHolder;
        boolean needNewInitThread = true;
        if (convertView == null) {
            convertView = inflater.inflate(R.layout.datelistitem, null);
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

            convertView.setTag(viewHolder);
        } else {
            viewHolder = (ViewHolder) convertView.getTag();
        }
        viewHolder.tvDateTitle.setText(tempItem.getDateTitle());
        viewHolder.tvDateBodyInfo.setText(tempItem.getResponses().get(0)
                .getLatestMessage().getMessageText());
        viewHolder.tvUserName.setText(tempItem.getSender().getName());
        viewHolder.tvDateTime.setText(AppUtil.formatSimpleTime(context,
                tempItem.getDateDate()));
        if (tempItem.getSender() != null) {
            if (needRemoveBitmap) {
                viewHolder.ivUserPhoto.setImageBitmap(null);
            } else {
                Bitmap senderBm = tempItem.getSender().getSmallBitmap();
                if (senderBm != null) {
                    viewHolder.ivUserPhoto.setImageBitmap(senderBm);
                    viewHolder.ivUserPhoto.setTag(null);
                } else {
                    viewHolder.ivUserPhoto
                            .setImageResource(R.drawable.profile_photo);
                    if (!isBusy) {
                        String user_image = tempItem.getSender()
                                .getPrimaryPhotoPath();
                        if (viewHolder.ivUserPhoto.getTag() != null) {
                            if (user_image.equals(viewHolder.ivUserPhoto
                                    .getTag().toString())) {
                                needNewInitThread = false;
                            } else {
                                ImageLoadUtil
                                        .removeThread(viewHolder.ivUserPhoto
                                                .getTag().toString());
                            }
                        }
                        if (needNewInitThread
                                && !ImageLoadUtil.urlPool
                                        .containsKey(user_image)) {
                            viewHolder.ivUserPhoto.setTag(user_image);
                            tempItem.getSender().getSmallPostBitmapAsync(
                                    new MethodHandler<Bitmap>() {
                                        public void process(Bitmap para) {
                                            Message msg = refreshImgHandler
                                                    .obtainMessage(
                                                            position,
                                                            viewHolder.ivUserPhoto);
                                            refreshImgHandler.sendMessage(msg);
                                        }
                                    });
                        }
                    }
                }

            }
            viewHolder.ivUserPhoto
                    .setOnClickListener(new View.OnClickListener() {

                        @Override
                        public void onClick(View v) {
                            ProfileFragment newFragment = ProfileFragment
                                    .newInstance(tempItem.getSender()
                                            .getUserId(), R.string.my_dates);
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
            viewHolder.tvUserName.setOnClickListener(new View.OnClickListener() {
                
                @Override
                public void onClick(View v) {
                    ProfileFragment newFragment = ProfileFragment
                            .newInstance(tempItem.getSender()
                                    .getUserId(), R.string.my_dates);
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
        }
        viewHolder.tvDateTitle.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                Intent intent = new Intent();
                intent.setClass(context, DateDetail.class);
                intent.putExtra("position", position);
                intent.putExtra("type", type);
                context.startActivity(intent);
            }
        });
        return convertView;
    }

    Handler refreshImgHandler = new Handler() {
        public void handleMessage(android.os.Message msg) {
            ImageView iv = (ImageView) msg.obj;
            int position = msg.what;
            if (messageItems == null || position >= messageItems.size()
                    || position < 0)
                return;
            DateListItem dli = messageItems.get(position);
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
    }

}
