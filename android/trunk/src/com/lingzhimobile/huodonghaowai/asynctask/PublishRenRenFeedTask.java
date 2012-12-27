package com.lingzhimobile.huodonghaowai.asynctask;


import java.util.Calendar;


import android.app.Activity;

import android.os.Bundle;
import android.os.Message;
import android.widget.Toast;

import com.lingzhimobile.huodonghaowai.cons.MessageID;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.util.DateTimeUtil;
import com.renren.api.connect.android.AsyncRenren;
import com.renren.api.connect.android.Renren;
import com.renren.api.connect.android.common.AbstractRequestListener;
import com.renren.api.connect.android.exception.RenrenError;
import com.renren.api.connect.android.feed.FeedPublishRequestParam;
import com.renren.api.connect.android.feed.FeedPublishResponseBean;


public class PublishRenRenFeedTask {
    Message msg;
    private final Activity activity;
    private final Renren renren;
    private final Bundle publishRenrenFeedData;

    public PublishRenRenFeedTask(Bundle publishRenrenFeedData, Renren renren, Activity activity, Message msg){
        this.publishRenrenFeedData = publishRenrenFeedData;
        this.renren = renren;
        this.activity = activity;
        this.msg = msg;
    }

    public void execute(){
        long dateDate = publishRenrenFeedData.getLong("dateDate");
        String dateAddress = publishRenrenFeedData.getString("address");
        String dateTitle = publishRenrenFeedData.getString("title");
        String dateDescription = publishRenrenFeedData.getString("description");

        Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(dateDate);
        String strDateDate = DateTimeUtil.getNextSlotInString(activity, calendar).toString();
        String renrenDescription = String.format("时间:%s  地点:%s  详情:%s", strDateDate,dateAddress,dateDescription) ;

        FeedPublishRequestParam feed = new FeedPublishRequestParam(
                    "来活动号外加入吧",
                    renrenDescription,
                    "http://www.huodonghaowai.com",
                    "http://oss.aliyuncs.com/ysf1/resource/app-icon.png",
                    "副标题",
                    "",
                    "http://www.huodonghaowai.com",
                    dateTitle);
        AsyncRenren asyncRenren = new AsyncRenren(renren);
        AbstractRequestListener<FeedPublishResponseBean> listener =
                new AbstractRequestListener<FeedPublishResponseBean>() {
            @Override
            public void onRenrenError(RenrenError err) {
                LogUtils.Loge(LogTag.RENREN, "publishFeed onRenrenError err=" + err.getMessage(), err);
                if (activity != null){
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            Toast.makeText(activity, "renren publishFeed err",Toast.LENGTH_SHORT).show();
                        }
                    });
                }
                if (msg != null){
                    msg.what = MessageID.RENRENSDK_publishFeed_Error;
                    msg.obj = err;
                    msg.sendToTarget();
                }
            }

            @Override
            public void onFault(Throwable fault) {
                LogUtils.Loge(LogTag.RENREN, "publishFeed onFault fault=" + fault.getMessage(),fault);

                if (activity != null){
                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            Toast.makeText(activity, "renren publishFeed fault",Toast.LENGTH_SHORT).show();
                        }
                    });
                }
                if (msg != null){
                    msg.what = MessageID.RENRENSDK_publishFeed_Fault;
                    msg.obj = fault;
                    msg.sendToTarget();
                }
            }

            @Override
            public void onComplete(FeedPublishResponseBean bean) {
                LogUtils.Logd(LogTag.RENREN, "PublishRenRenFeedTask onComplete bean=" + bean.toString()  );
                if (activity != null){

                    //Toast.makeText(activity, "renren publishFeed OK",Toast.LENGTH_SHORT).show();
                    //will cause fault=Can't create handler inside thread that has not called Looper.prepare()

                    activity.runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            Toast.makeText(activity, "renren publishFeed OK",Toast.LENGTH_SHORT).show();
                        }
                    });
                }
                if (msg != null){
                    msg.what = MessageID.RENRENSDK_publishFeed_OK;
                    msg.obj = bean;
                    msg.sendToTarget();
                }
            }
        };
        asyncRenren.publishFeed(feed, listener, true);

    }
}
