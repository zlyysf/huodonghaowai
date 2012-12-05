package com.lingzhimobile.tongqu.fragment;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.support.v4.app.Fragment;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.ExpandableListView;
import android.widget.ExpandableListView.OnChildClickListener;
import android.widget.ExpandableListView.OnGroupClickListener;
import android.widget.ListView;

import com.lingzhimobile.tongqu.R;
import com.lingzhimobile.tongqu.activity.DateChat;
import com.lingzhimobile.tongqu.adapter.DateResponderAdapter;
import com.lingzhimobile.tongqu.model.DateListItem;
import com.lingzhimobile.tongqu.util.AppUtil;
import com.lingzhimobile.tongqu.util.GlobalValue;

public class DateResponderList extends Fragment {
    private Activity myAcitivity;
    private View currentView;
    private ListView lvDateResponders;
    
    private Button btnBack;
    private ExpandableListView lvResponders;
    private DateResponderAdapter dateResponderAdapter;
    private DateListItem tempItem;
    
    public static DateResponderList newInstance(int position) {
        DateResponderList f = new DateResponderList();
        Bundle args = new Bundle();
        args.putInt("position", position);
        f.setArguments(args);

        return f;
    }
    
    @Override
    public void onAttach(Activity activity) {
        super.onAttach(activity);
        this.myAcitivity = activity;
    }
    
    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
            Bundle savedInstanceState) {
        currentView = inflater.inflate(R.layout.dateresponders, container,
                false);
        initView();
        initData();
        return currentView;
    }
    
    
    @Override
    public void onResume() {
        super.onResume();
        if(dateResponderAdapter != null){
            tempItem.setResponders(AppUtil.sortConversationList(tempItem.getResponses()));
            dateResponderAdapter.setListData(tempItem.getResponders());
            dateResponderAdapter.notifyDataSetChanged();
        }
    }

    private void initView(){
        btnBack = (Button) currentView.findViewById(R.id.btnCancel);
        lvResponders = (ExpandableListView) currentView.findViewById(R.id.lvDateRespondersList);
    }
    
    private void initData(){
        tempItem = GlobalValue.sendDates.get(getArguments().getInt("position"));
//        dateResponderAdapter = new DateRespondersAdapter(myAcitivity, tempItem);
//        lvDateResponders.setAdapter(dateResponderAdapter);
//        lvDateResponders.setOnItemClickListener(new OnItemClickListener() {
//
//            @Override
//            public void onItemClick(AdapterView<?> parent, View view,
//                    int position, long id) {
//                Intent intent = new Intent();
//                intent.setClass(myAcitivity, DateChat.class);
//                intent.putExtra("itemIndex", position);
//                intent.putExtra("parentIndex", getArguments().getInt("position"));
//                intent.putExtra("fromType", DateListFragment.TYPE_SEND);
//                startActivity(intent);
//            }
//        });
        dateResponderAdapter = new DateResponderAdapter(myAcitivity, this, tempItem.getResponders());
        lvResponders.setAdapter(dateResponderAdapter);
        lvResponders.setGroupIndicator(null);
        lvResponders.expandGroup(0);
        lvResponders.expandGroup(1);
        lvResponders.setOnGroupClickListener(new OnGroupClickListener() {
            
            @Override
            public boolean onGroupClick(ExpandableListView parent, View v,
                    int groupPosition, long id) {
                return true;
            }
        });
        lvResponders.setOnChildClickListener(new OnChildClickListener() {
            
            @Override
            public boolean onChildClick(ExpandableListView parent, View v,
                    int groupPosition, int childPosition, long id) {
                Intent intent = new Intent();
                intent.setClass(myAcitivity, DateChat.class);
                intent.putExtra("groupPosition", groupPosition);
                intent.putExtra("childPosition", childPosition);
                intent.putExtra("parentIndex", getArguments()
                        .getInt("position"));
                intent.putExtra("fromType", DateListFragment.TYPE_SEND);
                startActivity(intent);
                return false;
            }
        });
        btnBack.setOnClickListener(new View.OnClickListener() {
            
            @Override
            public void onClick(View v) {
                getFragmentManager().popBackStack();
            }
        });
    }

}
