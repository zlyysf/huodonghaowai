package com.lingzhimobile.huodonghaowai.adapter;

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

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.model.ChatItem;
import com.lingzhimobile.huodonghaowai.model.DateListItem;
import com.lingzhimobile.huodonghaowai.util.AppUtil;
import com.lingzhimobile.huodonghaowai.util.ImageLoadUtil;
import com.lingzhimobile.huodonghaowai.util.MethodHandler;

public class DateRespondersAdapter extends BaseAdapter {
    private static final String LocalLogTag = LogTag.ACTIVITY + " DateRespondersAdapter";

    private final DateListItem item;
    private List<ChatItem> messages;
    private final LayoutInflater inflater;
    private final Context context;

    public DateRespondersAdapter(Context context, DateListItem item) {
        this.context = context;
        this.item = item;
//        messages = item.getResponses();
        inflater = (LayoutInflater) context
                .getSystemService(Context.LAYOUT_INFLATER_SERVICE);
    }

    @Override
    public int getCount() {
        return messages.size();
    }

    @Override
    public Object getItem(int position) {
        return messages.get(position);
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public View getView(final int position, View convertView, ViewGroup parent) {
        final ChatItem tempItem = messages.get(position);
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
            viewHolder.tvUserType = (TextView) convertView
                    .findViewById(R.id.tvResponderType);
            convertView.setTag(viewHolder);
        } else {
            viewHolder = (ViewHolder) convertView.getTag();
        }
        Bitmap bm = tempItem.getBitmap();
        if (bm != null) {
            viewHolder.ivUserPhoto.setImageBitmap(bm);
            viewHolder.ivUserPhoto.setTag(null);
        } else {
            String photoPath = tempItem.getSmallPhotoPath();
            viewHolder.ivUserPhoto.setTag(photoPath);
            LogUtils.Logd(LocalLogTag, "before readBitmapAsync, photoPath="+photoPath);
            ImageLoadUtil.readBitmapAsync(photoPath,
                new MethodHandler<Bitmap>() {
                    @Override
                    public void process(Bitmap para) {
                        Message msg = refreshImgHandler.obtainMessage(
                                position, viewHolder.ivUserPhoto);
                        refreshImgHandler.sendMessage(msg);
                    }
                });
        }
        viewHolder.tvUserName.setText(tempItem.getName());
        viewHolder.tvTime.setText(AppUtil.getInterval(String.valueOf(tempItem.getLatestMessage().getCreateTime())));
        viewHolder.tvLastestMessage.setText(tempItem.getLatestMessage().getMessageText());
        if(position == 0){
            viewHolder.tvUserType.setText(AppUtil.getStringFromIdWithParams(R.string.have_add, item.getConfirmedPersonCount()));
        }else{
            ChatItem preItem = messages.get(position-1);
            if(preItem.isSenderConfirmed() == tempItem.isSenderConfirmed()){
                viewHolder.tvUserType.setVisibility(View.GONE);
            }else{
                viewHolder.tvUserType.setText(AppUtil.getStringFromIdWithParams(R.string.have_apply, item.getDateResponderCount()-item.getConfirmedPersonCount()));
            }
        }

        return convertView;
    }

    class ViewHolder {
        public TextView tvUserName;
        public TextView tvUserType;
        public TextView tvTime;
        public TextView tvLastestMessage;
        public ImageView ivUserPhoto;
    }

    Handler refreshImgHandler = new Handler() {
        @Override
        public void handleMessage(Message msg) {
            ImageView iv = (ImageView) msg.obj;
            int position = msg.what;
            if (messages == null || position >= messages.size() || position < 0)
                return;
            ChatItem ci = messages.get(position);
            if (iv != null && ci != null && ci.getSmallPhotoPath() != null
                    && ci.getSmallPhotoPath().equals(iv.getTag())) {
                iv.setImageBitmap(ci.getSmallBitmap());
                iv.setTag(null);
            }
        };
    };

}
