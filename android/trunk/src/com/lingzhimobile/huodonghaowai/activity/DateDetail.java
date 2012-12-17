package com.lingzhimobile.huodonghaowai.activity;

import android.app.Activity;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.fragment.DateListFragment;
import com.lingzhimobile.huodonghaowai.model.DateListItem;
import com.lingzhimobile.huodonghaowai.util.AppUtil;
import com.lingzhimobile.huodonghaowai.util.GlobalValue;
import com.lingzhimobile.huodonghaowai.util.ImageLoadUtil;
import com.lingzhimobile.huodonghaowai.util.MethodHandler;
import com.umeng.analytics.MobclickAgent;

public class DateDetail extends Activity {
    private String type;
    private int position;
    
    private Button btnBack;
    private TextView tvDateTitle;
    private TextView tvDateTime;
    private TextView tvDateAddress,tvDatePersonNum,tvDateTreat,tvDateDescription;
    private ImageView ivDatePhoto;
    
    private DateListItem tempItem;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.detaildate);
        initView();
        initData();
    }
    @Override
    protected void onPause() {
        super.onPause();
        MobclickAgent.onPause(this);
    }

    @Override
    protected void onResume() {
        super.onResume();
        MobclickAgent.onResume(this);
    }
    
    private void initView(){
        btnBack = (Button) findViewById(R.id.btnCancel);
        tvDateTitle = (TextView) findViewById(R.id.tvDateTitle);
        tvDateAddress = (TextView) findViewById(R.id.tvDateLocationInfo);
        tvDateDescription = (TextView) findViewById(R.id.tvDateBodyInfo);
        tvDatePersonNum = (TextView) findViewById(R.id.tvDatePersonNum);
        tvDateTreat = (TextView) findViewById(R.id.tvDateWhoPay);
        tvDateTime = (TextView) findViewById(R.id.tvDateTimeInfo);
        ivDatePhoto = (ImageView) findViewById(R.id.ivDatePhoto);
    }
    
    private void initData(){
        type = getIntent().getStringExtra("type");
        position = getIntent().getIntExtra("position", 0);
        if(type == null)
            return;
        if(type.equals(DateListFragment.TYPE_INVITED)){
            tempItem = GlobalValue.invitedDates.get(position);
        }else if(type.equals(DateListFragment.TYPE_APPLY)){
            tempItem = GlobalValue.applyDates.get(position);
        }else{
            tempItem = GlobalValue.sendDates.get(position);
        }
        tvDateTitle.setText(tempItem.getDateTitle());
        tvDateAddress.setText(tempItem.getAddress());
        tvDatePersonNum.setText(tempItem.getExistPersonCount()+"+"+tempItem.getWantPersonCount());
        tvDateTime.setText(AppUtil.formatTime(this, tempItem.getDateDate()));
        tvDateDescription.setText(tempItem.getDateDescription());
        switch(tempItem.getWhoPay()){
        case 0:
            tvDateTreat.setText(R.string.my_treat);
            break;
        case 2:
            tvDateTreat.setText(R.string.aa);
            break;
        case 3:
            tvDateTreat.setText(R.string.free);
        }
        btnBack.setOnClickListener(new View.OnClickListener() {
            
            @Override
            public void onClick(View v) {
                finish();
            }
        });
        Bitmap bm = tempItem.getBitmap();
        if(bm != null){
            ivDatePhoto.setImageBitmap(bm);
        }else{
            ivDatePhoto.setTag(tempItem.getPhotoPath());
            ImageLoadUtil.readBitmapAsync(tempItem.getPhotoPath(), new MethodHandler<Bitmap>() {
                public void process(Bitmap para) {
                    Message msg = refreshImgHandler
                            .obtainMessage(
                                    0,
                                    ivDatePhoto);
                    refreshImgHandler
                            .sendMessage(msg);
                }
            });
        }
        
    }
    
    Handler refreshImgHandler = new Handler() {
        public void handleMessage(Message msg) {
            ImageView iv = (ImageView) msg.obj;
            if (iv != null
                    && tempItem.getPhotoPath()
                            .equals(iv.getTag())) {
                iv.setImageBitmap(tempItem.getBitmap());
                iv.setTag(null);
            }
        };
    };

}
