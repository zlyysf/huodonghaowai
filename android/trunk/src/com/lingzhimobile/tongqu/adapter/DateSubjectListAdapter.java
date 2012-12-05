package com.lingzhimobile.tongqu.adapter;

import java.util.ArrayList;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.TextView;

import com.lingzhimobile.tongqu.R;
import com.lingzhimobile.tongqu.model.SubjectItem;

public class DateSubjectListAdapter extends BaseAdapter {
    
    private ArrayList<SubjectItem> subjects;
    private LayoutInflater inflater;
    private Context context;
    
    public DateSubjectListAdapter(Context context, ArrayList<SubjectItem> subjects) {
        this.context = context;
        this.subjects = subjects;
        inflater = (LayoutInflater) context
                .getSystemService(Context.LAYOUT_INFLATER_SERVICE);
    }

    @Override
    public int getCount() {
        return subjects.size();
    }

    @Override
    public Object getItem(int position) {
        return subjects.get(position);
    }

    @Override
    public long getItemId(int position) {
        return position;
    }

    @Override
    public View getView(int position, View convertView, ViewGroup parent) {
        SubjectItem tempitem = subjects.get(position);
        if(convertView == null){
            convertView = inflater.inflate(R.layout.datetitlelistitem, null);
        }
        TextView tvSubject = (TextView) convertView.findViewById(R.id.tvDateTitle);
        TextView tvType = (TextView) convertView.findViewById(R.id.tvSubjectType);
        tvSubject.setText(tempitem.getValue());
        tvType.setText(tempitem.getType());
        if(position > 0){
            SubjectItem preitem = subjects.get(position-1);
            if(preitem.getType().equals(tempitem.getType())){
                tvType.setVisibility(View.GONE);
            }else{
                tvType.setVisibility(View.VISIBLE);
            }
        }else{
            tvType.setVisibility(View.VISIBLE);
        }
        return convertView;
    }

}
