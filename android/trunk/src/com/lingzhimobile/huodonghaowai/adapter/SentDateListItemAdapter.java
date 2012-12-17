package com.lingzhimobile.huodonghaowai.adapter;

import java.util.List;

import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import android.os.Message;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.TextView;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.activity.DateDetail;
import com.lingzhimobile.huodonghaowai.fragment.DateListFragment;
import com.lingzhimobile.huodonghaowai.model.DateListItem;
import com.lingzhimobile.huodonghaowai.util.AppUtil;

public class SentDateListItemAdapter extends BaseAdapter {

    private List<DateListItem> messageItems;
    private Context context;
    private LayoutInflater inflater;
    public boolean isBusy;
    public boolean needRemoveBitmap;

    public SentDateListItemAdapter(Context context,
            List<DateListItem> messageItems) {
        this.context = context;
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
        if (convertView == null) {
            convertView = inflater.inflate(R.layout.datelistitemsend, null);
            viewHolder = new ViewHolder();
            viewHolder.tvDateBodyInfo = (TextView) convertView
                    .findViewById(R.id.tvDateBodyInfo);
            viewHolder.tvDateTitle = (TextView) convertView
                    .findViewById(R.id.tvDateTitle);
            viewHolder.tvDateAddPersonNum = (TextView) convertView
                    .findViewById(R.id.tvAddPersonNum);
            viewHolder.tvDateApplyPersonNum = (TextView) convertView.findViewById(R.id.tvApplyPersonNum);
            viewHolder.tvDatePersonNum = (TextView) convertView.findViewById(R.id.tvDatePersonNum);
            viewHolder.tvDateTime = (TextView) convertView.findViewById(R.id.tvDateTimeInfo);
            convertView.setTag(viewHolder);
        } else {
            viewHolder = (ViewHolder) convertView.getTag();
        }
        viewHolder.tvDateTitle.setText(tempItem.getDateTitle());
        viewHolder.tvDateBodyInfo.setText(tempItem.getDateDescription());
        viewHolder.tvDatePersonNum.setText(tempItem.getExistPersonCount()+"+"+tempItem.getWantPersonCount());
        viewHolder.tvDateAddPersonNum.setText(AppUtil.getStringFromIdWithParams(R.string.have_add, tempItem.getConfirmedPersonCount()));
        viewHolder.tvDateApplyPersonNum.setText(AppUtil.getStringFromIdWithParams(R.string.have_apply, tempItem.getDateResponderCount()-tempItem.getConfirmedPersonCount()));
        viewHolder.tvDateTime.setText(AppUtil.formatSimpleTime(context, tempItem.getDateDate()));
        viewHolder.tvDateTitle.setOnClickListener(new View.OnClickListener() {
            
            @Override
            public void onClick(View v) {
                Intent intent = new Intent();
                intent.setClass(context, DateDetail.class);
                intent.putExtra("position", position);
                intent.putExtra("type", DateListFragment.TYPE_SEND);
                context.startActivity(intent);
            }
        });
        
        return convertView;
    }

    class ViewHolder {
        public TextView tvDateBodyInfo;
        public TextView tvDateTitle;
        public TextView tvDateTime;
        public TextView tvDatePersonNum;
        public TextView tvDateAddPersonNum;
        public TextView tvDateApplyPersonNum;
    }
    

}
