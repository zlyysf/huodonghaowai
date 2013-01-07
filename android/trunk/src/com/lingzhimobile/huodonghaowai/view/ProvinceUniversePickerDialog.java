package com.lingzhimobile.huodonghaowai.view;

import java.text.DateFormatSymbols;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.HashMap;
import java.util.List;

import android.app.Dialog;
import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AbsListView;
import android.widget.AbsListView.OnScrollListener;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.ArrayAdapter;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.ListView;
import android.widget.TextView;

import com.lingzhimobile.huodonghaowai.R;

import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.util.AppInfo;

public class ProvinceUniversePickerDialog extends Dialog {

    private static final String LocalLogTag = LogTag.ACTIVITY + " ProvinceUniversePickerDialog";

    View contentView;
    TextView textviewChooseUniverse;
    ListView provListView, unvListView;
    Button btnCancel, btnOk;

    HashMap<String,ArrayList<String>> hashmapProvUnv;
    int mProvPos, mUnvPos;
    String mProv, mUnv;


    private final MyCloseListener mCallBackListener;

    public interface MyCloseListener {
        void onOK(String prov, String unv);
        void onCancel();
    }

    public ProvinceUniversePickerDialog(Context context, MyCloseListener callBackListener) {
        super(context, R.style.AlertDialog);
        mCallBackListener = callBackListener;
        Context themeContext = getContext();//themeContext ==?  context
        LayoutInflater inflater = (LayoutInflater) themeContext
                .getSystemService(Context.LAYOUT_INFLATER_SERVICE);
        contentView = inflater.inflate(R.layout.provinceuniversepicker, null);
        setContentView(contentView);

        initViewFields();
        hashmapProvUnv = AppInfo.getUniversesData(context);
        setAdapter();
        setListener();
        //monthListView.setSelection(monthOfYear);
    }

    void initViewFields() {
        textviewChooseUniverse = (TextView) contentView.findViewById(R.id.textviewChooseUniverse);
        provListView = (ListView) contentView.findViewById(R.id.provListView);
        unvListView = (ListView) contentView.findViewById(R.id.unvListView);
        btnCancel = (Button) contentView.findViewById(R.id.btnCancel);
        btnOk = (Button) contentView.findViewById(R.id.btnOk);
    }

    void setAdapter() {
        String[] provAry = new String[0];
        provAry = hashmapProvUnv.keySet().toArray(provAry);
        ProvinceAdapter provAdapter = new ProvinceAdapter(this.getContext(), provAry);
        provListView.setAdapter(provAdapter);

        mProvPos = 0;
        provListView.setSelection(mProvPos);
        UniverseAdapter universeAdapter = new UniverseAdapter(this.getContext(),mProvPos);
        unvListView.setAdapter(universeAdapter);
    }

    void setListener() {

        OnItemClickListener onProvItemClickListener = new OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> av, View v, int pos, long id) {
                mProvPos = pos;
                //av.setSelection(pos);
                UniverseAdapter universeAdapter = new UniverseAdapter(
                        ProvinceUniversePickerDialog.this.getContext(),pos);
                unvListView.setAdapter(universeAdapter);
            }
        };
        OnItemClickListener onUnvItemClickListener = new OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> av, View v, int pos, long id) {
                mUnvPos = pos;
                //av.setSelection(pos);
                //LogUtils.Logd(LocalLogTag, "");
                TextView tvItemUnv = (TextView) v.findViewById(R.id.stringTextView);
                mUnv = tvItemUnv.getText().toString();
                textviewChooseUniverse.setText(mUnv);

//                String[] provAry = hashmapProvUnv.keySet().toArray(new String[0]);
//                String prov = provAry[mProvPos];
//                ArrayList<String> unvs = hashmapProvUnv.get(prov);
//                mUnv = unvs.get(pos);
            }
        };

        provListView.setOnItemClickListener(onProvItemClickListener);
        unvListView.setOnItemClickListener(onUnvItemClickListener);

        btnOk.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                if (mCallBackListener != null) {
                    mCallBackListener.onOK(mProv, mUnv);
                }
                dismiss();
            }
        });
        btnCancel.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                if (mCallBackListener != null) {
                    mCallBackListener.onCancel();
                }
                dismiss();
            }
        });
    }//setListener


    public class ProvinceAdapter extends BaseAdapter {

        public String[] provinces;
        private LayoutInflater layoutInflater=null;


        public ProvinceAdapter(Context context, String[] provinces) {
            super();
            this.provinces = provinces;
            layoutInflater = (LayoutInflater) context
            .getSystemService(Context.LAYOUT_INFLATER_SERVICE);
        }

        @Override
        public int getCount() {
            return provinces.length;
        }

        @Override
        public Object getItem(int pos) {
            return provinces[pos];
        }

        @Override
        public long getItemId(int pos) {
            return pos;
        }

        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            if (convertView == null) {
                convertView = layoutInflater.inflate(R.layout.listitemtext, null);
            }
            TextView tvProv = (TextView) convertView.findViewById(R.id.stringTextView);
            tvProv.setText(getItem(position).toString());
            return convertView;
        }
    }// class ProvinceAdapter


    public class UniverseAdapter extends BaseAdapter {

        public ArrayList<String> universes;
        private LayoutInflater layoutInflater=null;

        public UniverseAdapter(Context context, int provPos) {
            super();
            init(context,provPos);
        }
        public UniverseAdapter(Context context, String province) {
            super();
            init(context,province);
        }
        public UniverseAdapter(Context context, ArrayList<String> universes) {
            super();
            init(context,universes);
        }
        private void init(Context context, int provPos){
            String[] provAry = hashmapProvUnv.keySet().toArray(new String[0]);
            String prov = provAry[provPos];
            init(context, prov);
        }
        private void init(Context context, String province){
            ArrayList<String> unvs = hashmapProvUnv.get(province);
            init(context,unvs);
        }
        private void init(Context context, ArrayList<String> universes){
            this.universes = universes;
            layoutInflater = (LayoutInflater) context
                    .getSystemService(Context.LAYOUT_INFLATER_SERVICE);
        }

        @Override
        public int getCount() {
            return universes.size();
        }

        @Override
        public Object getItem(int pos) {
            return universes.get(pos);
        }

        @Override
        public long getItemId(int pos) {
            return pos;
        }

        @Override
        public View getView(int position, View convertView, ViewGroup parent) {
            if (convertView == null) {
                convertView = layoutInflater.inflate(R.layout.listitemtext, null);
            }
            TextView tvUnv = (TextView) convertView.findViewById(R.id.stringTextView);
            tvUnv.setText(getItem(position).toString());
            return convertView;
        }

    }// class UniverseAdapter

}