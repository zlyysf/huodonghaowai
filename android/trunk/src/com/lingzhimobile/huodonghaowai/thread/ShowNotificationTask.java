package com.lingzhimobile.huodonghaowai.thread;

import java.util.ArrayList;

import android.app.Activity;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.activity.DateChat;
import com.lingzhimobile.huodonghaowai.activity.MainTabActivity;
import com.lingzhimobile.huodonghaowai.activity.Splash;
import com.lingzhimobile.huodonghaowai.cons.MessageType;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.model.MessageItem;
import com.lingzhimobile.huodonghaowai.model.PushMessageInfo;
import com.lingzhimobile.huodonghaowai.util.AppInfo;
import com.lingzhimobile.huodonghaowai.util.GlobalValue;
import com.lingzhimobile.huodonghaowai.util.JSONParser;
import com.lingzhimobile.huodonghaowai.util.NotificationUtil;

public class ShowNotificationTask extends Thread {

    private final String message;
    private NotificationManager notificationManager;
    private Notification notification;
    private final Context context;
    private int push_flag = -1;
    private PushMessageInfo messageInfo;
    private String key;


    public ShowNotificationTask(Context context, String message) {
        this.message = message;
        this.context = context;
        this.notificationManager = (NotificationManager) context
                .getSystemService(Activity.NOTIFICATION_SERVICE);
    }

    @Override
	public void run() {
        Intent intent = generateIntent(message);
        if (intent == null)
            return;
        PendingIntent contentIntent = PendingIntent.getActivity(context, NotificationUtil.getFlag(key),
                intent, PendingIntent.FLAG_UPDATE_CURRENT);
        notification = new Notification(R.drawable.notification_logo, messageInfo.getMessage(),
                System.currentTimeMillis());
        notification.flags |= Notification.FLAG_AUTO_CANCEL;
        notification.defaults = Notification.DEFAULT_SOUND;
        notification.setLatestEventInfo(context, context.getString(R.string.app_name), messageInfo.getMessage(), contentIntent);
        if (notificationManager == null) {
            notificationManager = (NotificationManager) context
                    .getSystemService(Activity.NOTIFICATION_SERVICE);
        }
        if (push_flag == MessageType.PUSH_SENDMESSAGE) {
            synchronized (GlobalValue.notificationLock) {
                notificationManager.notify(NotificationUtil.getFlag(key), notification);
            }
        } else if(push_flag == MessageType.PUSH_RESPONSE){
            notificationManager.notify(NotificationUtil.getResponseFlag(), notification);
        }else{
            notificationManager.notify(NotificationUtil.getFlag(key), notification);
        }
    }
    private Intent generateIntent(String message) {

        Intent result = null;
        messageInfo = JSONParser.getPushMessage(message);
        if(MessageType.TYPE_CONFIRMDATE.equals(messageInfo.getMessageType())){
            if(GlobalValue.currentChatUserAndDateId != null && (messageInfo.getUserId()+messageInfo.getDateId()).equals(GlobalValue.currentChatUserAndDateId)){
                ArrayList<MessageItem> tempMessage = GlobalValue.chatHistory.get(GlobalValue.currentChatUserAndDateId);
                synchronized (DateChat.chat_write_lock) {
                    for (int i = 0; i < tempMessage.size(); i++) {
                        MessageItem mi = tempMessage.get(i);
                        if (messageInfo.getMessageId()
                                .equals(mi.getMessageId())) {
                            return null;
                        }
                    }
                    MessageItem newItem = new MessageItem();
                    newItem.setMessageId(messageInfo.getMessageId());
                    newItem.setCreateTime(messageInfo.getCreateTime());
                    newItem.setMessageText(messageInfo.getMessage());
                    newItem.setSenderId("system");
                    newItem.setSenderName("HuoDongHaoWai");
                    tempMessage.add(newItem);
                }
                Intent i = new Intent();
                i.setAction("com.receiver.newdateconfirm");
                i.putExtra("currentChatUserAndDateId",messageInfo.getUserId()+messageInfo.getDateId());
                context.sendBroadcast(i);
                return null;
            }
            if (AppInfo.isInit()) {
                result = new Intent(context, MainTabActivity.class);
                result.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                result.putExtra("dateType", MessageType.DATE_INVITED);
            }
            push_flag = MessageType.PUSH_CONFRIMDATE;
            result.putExtra("notificationType", MessageType.PUSH_CONFRIMDATE);
//            GlobalValue.jumpFlagInPush = MessageType.PUSH_CONFRIMDATE;
        }else if(MessageType.TYPE_CANCELDATE.equals(messageInfo.getMessageType())){
            if(GlobalValue.currentChatUserAndDateId != null && (messageInfo.getUserId()+messageInfo.getDateId()).equals(GlobalValue.currentChatUserAndDateId)){
                ArrayList<MessageItem> tempMessage = GlobalValue.chatHistory.get(GlobalValue.currentChatUserAndDateId);
                synchronized (DateChat.chat_write_lock) {
                    for (int i = 0; i < tempMessage.size(); i++) {
                        MessageItem mi = tempMessage.get(i);
                        if (messageInfo.getMessageId()
                                .equals(mi.getMessageId())) {
                            return null;
                        }
                    }
                    MessageItem newItem = new MessageItem();
                    newItem.setMessageId(messageInfo.getMessageId());
                    newItem.setCreateTime(messageInfo.getCreateTime());
                    newItem.setMessageText(messageInfo.getMessage());
                    newItem.setSenderId("system");
                    newItem.setSenderName("HuoDongHaoWai");
                    tempMessage.add(newItem);
                }
                Intent i = new Intent();
                i.setAction("com.receiver.datecancel");
                i.putExtra("currentChatUserAndDateId",messageInfo.getUserId()+messageInfo.getDateId());
                context.sendBroadcast(i);
                return null;
            }
            if (AppInfo.isInit()) {
                result = new Intent(context, MainTabActivity.class);
                result.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                result.putExtra("dateType", MessageType.DATE_APPLY);
            }
            push_flag = MessageType.PUSH_CANCELDATE;
            result.putExtra("notificationType", MessageType.PUSH_CANCELDATE);
//            GlobalValue.jumpFlagInPush = MessageType.PUSH_CANCELDATE;
        }else if(MessageType.TYPE_SENDMESSAGE.equals(messageInfo.getMessageType())){
            if(GlobalValue.currentChatUserAndDateId != null && (messageInfo.getUserId()+messageInfo.getDateId()).equals(GlobalValue.currentChatUserAndDateId)){
                ArrayList<MessageItem> tempMessage = GlobalValue.chatHistory.get(GlobalValue.currentChatUserAndDateId);
                synchronized (DateChat.chat_write_lock) {
                    for (int i = 0; i < tempMessage.size(); i++) {
                        MessageItem mi = tempMessage.get(i);
                        if (messageInfo.getMessageId()
                                .equals(mi.getMessageId())) {
                            return null;
                        }
                    }
                    MessageItem newItem = new MessageItem();
                    newItem.setMessageId(messageInfo.getMessageId());
                    newItem.setCreateTime(System.currentTimeMillis());
                    newItem.setMessageText(messageInfo.getMessageText());
                    newItem.setSenderId(messageInfo.getUserId());
                    newItem.setSenderName(messageInfo.getUserName());
                    tempMessage.add(newItem);
                }
                Intent i = new Intent();
                i.setAction("com.receiver.newchatmessages");
                i.putExtra("currentChatUserAndDateId",messageInfo.getUserId()+messageInfo.getDateId());
                context.sendBroadcast(i);
                return null;
            }else{
                if (AppInfo.isInit()) {
                    result = new Intent(context, DateChat.class);
                    result.putExtra("dateId", messageInfo.getDateId());
                    if ("system".equals(messageInfo.getUserId())) {
                        result.putExtra("targetUserId",
                                messageInfo.getDateResponderId());
                    }else{
                        result.putExtra("targetUserId",
                                messageInfo.getUserId());
                    }
                    result.putExtra("targetUserName", messageInfo.getUserName());
                }
                if("system".equals(messageInfo.getUserId())){
                    push_flag = MessageType.PUSH_RESPONSE;
                }else{
                    push_flag = MessageType.PUSH_SENDMESSAGE;
                }
                result.putExtra("notificationType", MessageType.PUSH_SENDMESSAGE);
//                GlobalValue.jumpFlagInPush = MessageType.PUSH_SENDMESSAGE;
            }

        }else if(MessageType.TYPE_SYSTEM.equals(messageInfo.getMessageType())){
            if(AppInfo.isInit()){
                result = new Intent();
            }
            push_flag = MessageType.PUSH_SYSTEM;
        }
        // if the app is not initialized, the intent should open splash
        // activity.
        if (result != null) {
            result.putExtra("isJumpFromNotification", true);
        } else {
            result = new Intent(context, Splash.class);
        }
        key = messageInfo.getMessageType()+messageInfo.getDateId()+messageInfo.getUserId();
        LogUtils.Logi("dateType", result.getIntExtra("dateType", -1)+"");
        return result;
    }

}
