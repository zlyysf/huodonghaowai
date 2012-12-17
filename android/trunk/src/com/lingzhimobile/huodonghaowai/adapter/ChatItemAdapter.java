package com.lingzhimobile.huodonghaowai.adapter;

import java.util.List;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.model.MessageItem;
import com.lingzhimobile.huodonghaowai.util.AppInfo;
import com.lingzhimobile.huodonghaowai.util.AppUtil;

public class ChatItemAdapter extends BaseAdapter {

    private LayoutInflater inflater;
    private List<MessageItem> chatItems;
    private Context context;

    public ChatItemAdapter(Context context, List<MessageItem> chatItems) {
        this.context = context;
        this.chatItems = chatItems;
        inflater = (LayoutInflater) context
                .getSystemService(Context.LAYOUT_INFLATER_SERVICE);
    }

    @Override
    public int getCount() {
        return chatItems.size();
    }

    @Override
    public Object getItem(int arg0) {
        return chatItems.get(arg0);
    }

    @Override
    public long getItemId(int arg0) {
        return arg0;
    }

    @Override
    public View getView(final int arg0, View arg1, ViewGroup arg2) {
        final ViewHolder viewHolder;
        MessageItem tempItem = chatItems.get(arg0);
        if (arg1 == null) {
            arg1 = inflater.inflate(R.layout.chat_detail_item, null);
            viewHolder = new ViewHolder();
            viewHolder.llLeftItem = (LinearLayout) arg1.findViewById(R.id.llLeftChatItem);
            viewHolder.llRightItem = (LinearLayout) arg1.findViewById(R.id.llRightChatItem);
            viewHolder.tvMessageLeft = (TextView) arg1.findViewById(R.id.tvLeftChatItem);
            viewHolder.tvMessageRight = (TextView) arg1.findViewById(R.id.tvRightChatItem);
            viewHolder.pbSending = (ProgressBar) arg1.findViewById(R.id.progressBar1);
            viewHolder.tvTimeLine = (TextView) arg1.findViewById(R.id.tvTimeLine);
            arg1.setTag(viewHolder);

        } else {
            viewHolder = (ViewHolder) arg1.getTag();
        }
        if (AppInfo.userId.equals(tempItem.getSenderId())) {
            viewHolder.llRightItem.setVisibility(View.VISIBLE);
            viewHolder.llLeftItem.setVisibility(View.GONE);
            viewHolder.tvMessageRight.setText(tempItem.getMessageText());
            if (tempItem.getCreateTime() == -1) {
                viewHolder.pbSending.setVisibility(View.VISIBLE);
            } else {
                viewHolder.pbSending.setVisibility(View.GONE);
            }
        }else{
            viewHolder.llRightItem.setVisibility(View.GONE);
            viewHolder.llLeftItem.setVisibility(View.VISIBLE);
            viewHolder.tvMessageLeft.setText(tempItem.getMessageText());
        }
        if(arg0 >0){
            MessageItem preItem = chatItems.get(arg0-1);
            if(tempItem.getCreateTime() - preItem.getCreateTime() > 300000l){
                viewHolder.tvTimeLine.setText(AppUtil.formatTime(context, preItem.getCreateTime()));
                viewHolder.tvTimeLine.setVisibility(View.VISIBLE);
            }else{
                viewHolder.tvTimeLine.setVisibility(View.GONE);
            }
        }
        return arg1;
    }
}

class ViewHolder {
    public TextView tvMessageLeft;
    public TextView tvMessageRight;
    public LinearLayout llLeftItem;
    public LinearLayout llRightItem;
    public ProgressBar pbSending;
    public TextView tvTimeLine;
}
