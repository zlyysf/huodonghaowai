package com.lingzhimobile.huodonghaowai.adapter;

import java.util.ArrayList;
import java.util.List;

import android.content.Context;
import android.graphics.Bitmap;
import android.os.Handler;
import android.os.Message;
import android.support.v4.app.Fragment;
import android.support.v4.app.FragmentTransaction;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseExpandableListAdapter;
import android.widget.ImageView;
import android.widget.TextView;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.fragment.ProfileFragment;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.model.ChatItem;
import com.lingzhimobile.huodonghaowai.util.AppUtil;
import com.lingzhimobile.huodonghaowai.util.ImageLoadUtil;
import com.lingzhimobile.huodonghaowai.util.MethodHandler;

public class DateResponderAdapter extends BaseExpandableListAdapter {
    private static final String LocalLogTag = LogTag.ACTIVITY + " DateResponderAdapter";

    private List<ArrayList<ChatItem>> dateList;
    private final Context context;
    private final Fragment frag;
    private final LayoutInflater inflater;
    private final int[] group = {R.string.have_add,R.string.have_apply};

    public DateResponderAdapter(Context context, Fragment frag, List<ArrayList<ChatItem>> dateList){
        this.dateList = dateList;
        this.context = context;
        this.frag = frag;
        inflater = (LayoutInflater) context
                .getSystemService(Context.LAYOUT_INFLATER_SERVICE);
    }
    public void setListData(List<ArrayList<ChatItem>> dateList){
        this.dateList = dateList;
    }

    @Override
    public int getGroupCount() {
        return 2;
    }

    @Override
    public int getChildrenCount(int groupPosition) {
        return dateList.get(groupPosition).size();
    }

    @Override
    public Object getGroup(int groupPosition) {
        return null;
    }

    @Override
    public Object getChild(int groupPosition, int childPosition) {
        return dateList.get(groupPosition).get(childPosition);
    }

    @Override
    public long getGroupId(int groupPosition) {
        return groupPosition;
    }

    @Override
    public long getChildId(int groupPosition, int childPosition) {
        return childPosition;
    }

    @Override
    public boolean hasStableIds() {
        return true;
    }

    @Override
    public View getGroupView(int groupPosition, boolean isExpanded,
            View convertView, ViewGroup parent) {
        if(convertView == null){
            convertView = inflater.inflate(R.layout.dateresponderstype, null);
        }
        ((TextView)convertView).setText(AppUtil.getStringFromIdWithParams(group[groupPosition], getChildrenCount(groupPosition)));
        return convertView;
    }

    @Override
    public View getChildView(final int groupPosition, final int childPosition,
            boolean isLastChild, View convertView, ViewGroup parent) {
        final ChatItem tempItem = dateList.get(groupPosition).get(childPosition);
        final ViewHolder viewHolder;
        if (convertView == null) {
            convertView = inflater.inflate(R.layout.daterespondersitem, null);
            viewHolder = new ViewHolder();
            viewHolder.ivUserPhoto = (ImageView) convertView
                    .findViewById(R.id.ivUserProfilePhoto);
            viewHolder.tvUserName = (TextView) convertView
                    .findViewById(R.id.tvUserName);
            viewHolder.tvTime = (TextView) convertView
                    .findViewById(R.id.tvDateTimeInfo);
            viewHolder.tvLastestMessage = (TextView) convertView
                    .findViewById(R.id.tvLastestMessage);
            convertView.setTag(viewHolder);
        } else {
            viewHolder = (ViewHolder) convertView.getTag();
        }
        //Bitmap bm = tempItem.getBitmap();
        Bitmap bm = tempItem.getSmallBitmap();
        if (bm != null) {
            LogUtils.Logd(LocalLogTag, "DateResponderAdapter.getChildView, bm != null, getPhotoPath="+tempItem.getPhotoPath());
            viewHolder.ivUserPhoto.setImageBitmap(bm);
            viewHolder.ivUserPhoto.setTag(null);
        } else {
            String photoPath = tempItem.getSmallPhotoPath();
            LogUtils.Logd(LocalLogTag, "DateResponderAdapter.getChildView, before readBitmapAsync, photoPath="+photoPath);
            viewHolder.ivUserPhoto.setTag(photoPath);
            ImageLoadUtil.readBitmapAsync(photoPath,
                    new MethodHandler<Bitmap>() {
                        @Override
                        public void process(Bitmap para) {
                            Message msg = refreshImgHandler.obtainMessage(
                                    groupPosition, childPosition, 0, viewHolder.ivUserPhoto);
                            refreshImgHandler.sendMessage(msg);
                        }
                    });
        }
        viewHolder.ivUserPhoto
        .setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                ProfileFragment newFragment = ProfileFragment.newInstance(tempItem.getUserId(),R.string.date_responders);
                FragmentTransaction ft = frag.getFragmentManager().beginTransaction();

                ft.setCustomAnimations(R.anim.push_left_in,
                        R.anim.push_left_out,
                        R.anim.push_right_in,
                        R.anim.push_right_out);
                ft.replace(R.id.fragment01, newFragment);
                ft.addToBackStack(null);
                ft.commit();
            }
        });
        viewHolder.tvUserName
        .setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                ProfileFragment newFragment = ProfileFragment.newInstance(tempItem.getUserId(),R.string.date_responders);
                FragmentTransaction ft = frag.getFragmentManager().beginTransaction();

                ft.setCustomAnimations(R.anim.push_left_in,
                        R.anim.push_left_out,
                        R.anim.push_right_in,
                        R.anim.push_right_out);
                ft.replace(R.id.fragment01, newFragment);
                ft.addToBackStack(null);
                ft.commit();
            }
        });
        viewHolder.tvUserName.setText(tempItem.getName());
        viewHolder.tvTime.setText(AppUtil.getInterval(String.valueOf(tempItem.getLatestMessage().getCreateTime())));
        viewHolder.tvLastestMessage.setText(tempItem.getLatestMessage().getMessageText());
        return convertView;
    }

    @Override
    public boolean isChildSelectable(int groupPosition, int childPosition) {
        return true;
    }

    class ViewHolder {
        public TextView tvUserName;
        public TextView tvTime;
        public TextView tvLastestMessage;
        public ImageView ivUserPhoto;
    }

    Handler refreshImgHandler = new Handler() {
        @Override
        public void handleMessage(Message msg) {
            ImageView iv = (ImageView) msg.obj;
            int groupPosition = msg.what;
            int childPosition = msg.arg1;

            if (dateList == null || groupPosition >= dateList.size() || childPosition >= dateList.get(groupPosition).size() || childPosition < 0)
                return;
            ChatItem ci = dateList.get(groupPosition).get(childPosition);
            if (iv != null && ci != null && ci.getSmallPhotoPath() != null
                    && ci.getSmallPhotoPath().equals(iv.getTag())) {
                iv.setImageBitmap(ci.getSmallBitmap());
                iv.setTag(null);
            }
        };
    };

}
