package com.lingzhimobile.huodonghaowai.util;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import android.content.Context;
import android.content.SharedPreferences;

import com.lingzhimobile.huodonghaowai.cons.MessageType;
import com.lingzhimobile.huodonghaowai.cons.RenRenLibConst;
import com.lingzhimobile.huodonghaowai.exception.JSONParseException;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.model.ChatItem;
import com.lingzhimobile.huodonghaowai.model.ConversationItem;
import com.lingzhimobile.huodonghaowai.model.DateListItem;
import com.lingzhimobile.huodonghaowai.model.MessageItem;
import com.lingzhimobile.huodonghaowai.model.PhotoItem;
import com.lingzhimobile.huodonghaowai.model.PushMessageInfo;
import com.lingzhimobile.huodonghaowai.model.SubjectItem;
import com.lingzhimobile.huodonghaowai.model.UserItem;

public class JSONParser {

    private static final String LocalLogTag = LogTag.UTIL + " JSONParser";

    public static JSONObject getJsonObject(String strData){
        if (strData == null)  return null;
        JSONObject jsonObject = null;
        try {
            jsonObject = new JSONObject(strData);
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return jsonObject;
    }
    public static boolean checkServerApiSucceed(JSONObject jsonObj){
        boolean isSucceed = false;
        if (jsonObj != null){
            if ("success".equals(jsonObj.optString("status"))){
                isSucceed = true;
            }
        }
        return isSucceed;
    }

    public static JSONObject checkSucceed(String result) throws JSONParseException {
        if (result == null) {
            throw AppUtil.getJSONParseExceptionError();
        }
        JSONObject resultObj=null;
        int errorCode;
        String errorMsg;
        try {
            resultObj = new JSONObject(result);
            if ("success".equals(resultObj.getString("status"))) {
            } else {
                errorCode = resultObj.optInt("code");
                errorMsg = resultObj.optString("message");
                throw new JSONParseException(errorCode, errorMsg);
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return resultObj;
    }



    /*
     * here just save to memory. let AppInfo provide function to save to SharedPreferences
     */
    public static void saveLoginInfo(JSONObject apiRetData){
        LogUtils.Logd(LocalLogTag, "saveLoginInfo enter");
        if (apiRetData == null) return;
        JSONObject resultPartObj = apiRetData.optJSONObject("result");
        if (resultPartObj == null) return;
        JSONObject userObj = resultPartObj.optJSONObject("user");
        JSONObject renrenAccountObj = resultPartObj.optJSONObject("renrenAccount");
        saveLoginUserInfo(userObj);
        saveRenrenAccountInfo(renrenAccountObj);
    }
    /*
     * here just save to memory. let AppInfo provide function to save to SharedPreferences
     */
    public static void saveLoginUserInfo(JSONObject userObj){
        LogUtils.Logd(LocalLogTag, "saveLoginUserInfo enter");
        if (userObj == null) return;

        AppInfo.userId = userObj.optString("userId");
        AppInfo.gender = userObj.optString("gender");
        AppInfo.userName = userObj.optString("name");
        AppInfo.userPhoto = userObj.optString("primaryPhotoPath");
        AppInfo.constellation = userObj.optString("constellation");
        AppInfo.hometown = userObj.optString("hometown");
        AppInfo.bloodType = userObj.optString("bloodGroup");
        AppInfo.department = userObj.optString("department");
        AppInfo.school = userObj.optString("school");
        AppInfo.description = userObj.optString("description");
        AppInfo.educationalStatus = userObj.optString("educationalStatus");
        AppInfo.height = userObj.optInt("height");
        //emailAccount may not exist in some data because it was input, but still can set here to clear old email, and should save it in outer ui
        AppInfo.emailAccount = userObj.optString("emailAccount");
        LogUtils.Logd(LocalLogTag, "saveLoginUserInfo exit, userId="+AppInfo.userId+", emailAccount="+AppInfo.emailAccount);
    }
    /*
     * here just save to memory. let AppInfo provide function to save to SharedPreferences
     */
    public static void saveRenrenAccountInfo(JSONObject renrenAccountObj){
        LogUtils.Logd(LocalLogTag, "saveRenrenAccountInfo enter");
        if (renrenAccountObj == null) return;
        AppInfo.accountRenRen = renrenAccountObj.optString("accountRenRen");
        LogUtils.Logd(LocalLogTag, "saveRenrenAccountInfo exit, accountRenRen="+AppInfo.accountRenRen);
//        JSONObject renrenAuthObj = renrenAccountObj.optJSONObject("renrenAuthObj");
//        if (renrenAuthObj == null) return;
//        AppInfo.renrenSessionUserId = renrenAuthObj.optString(RenRenLibConst.fieldcommon_session_userId);
//        AppInfo.renrenAccessToken = renrenAuthObj.optString(RenRenLibConst.fieldcommon_access_token);
//        AppInfo.renrenExpirationDate = renrenAuthObj.optString(RenRenLibConst.fieldcommon_expiration_date);
//        AppInfo.renrenSessionKey = renrenAuthObj.optString(RenRenLibConst.fieldcommon_session_key);
//        AppInfo.renrenSecretKey = renrenAuthObj.optString(RenRenLibConst.fieldcommon_secret_key);
//        LogUtils.Logd(LocalLogTag, "saveRenrenAccountInfo end : renrenAccessToken="+AppInfo.renrenAccessToken+
//                ", renrenSessionKey="+AppInfo.renrenSessionKey+
//                ", renrenSecretKey="+AppInfo.renrenSecretKey+
//                ", renrenSessionUserId="+AppInfo.renrenSessionUserId+
//                ", renrenExpirationDate="+AppInfo.renrenExpirationDate);
    }

    public static String getReportUserResult(String result)
            throws JSONParseException {
        checkSucceed(result);
        String reportId = null;
        try {
            JSONObject jo = new JSONObject(result).getJSONObject("result");
            reportId = jo.optString("reportId");
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return reportId;
    }

    public static String getCreateDateResult(String result)
            throws JSONParseException {
        checkSucceed(result);
        String dateResult = null;
        try {
            JSONObject jo = new JSONObject(result).getJSONObject("result");
            if (jo == null) {
                return dateResult;
            }
            dateResult = jo.optString("dateId");
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return dateResult;
    }

    public static List<String> getSendMessageResult(String result)
            throws JSONParseException {
        checkSucceed(result);
        ArrayList<String> al = null;
        al = new ArrayList<String>();
        try {
            JSONObject jo = new JSONObject(result);
            al.add(jo.getJSONObject("result").optString("messageId"));
            al.add(jo.getJSONObject("result").optString("createTime"));
            return al;
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return null;
    }

    public static MessageItem getConfirmDateResult(String result)
            throws JSONParseException {
        checkSucceed(result);
        MessageItem messageItem = null;
        try {
            JSONObject jo = new JSONObject(result).getJSONObject("result");
            JSONObject msg = jo.getJSONObject("sysMessageToResponder");
            if(msg == null)
                return null;
            messageItem = new MessageItem();
            messageItem.setMessageId(msg.optString("messageId"));
            messageItem.setCreateTime(msg.optLong("createTime"));
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return messageItem;
    }

    public static List<PhotoItem> getNearbyPhotos(String result)
            throws JSONParseException {
        checkSucceed(result);
        ArrayList<PhotoItem> photos = null;
        photos = new ArrayList<PhotoItem>();
        try {
            JSONObject jo = new JSONObject(result);
            JSONArray ja = jo.getJSONObject("result").optJSONArray("photos");
            if (ja == null) {
                return photos;
            }
            for (int i = 0; i < ja.length(); i++) {
                JSONObject item = ja.getJSONObject(i);
                PhotoItem pi = new PhotoItem();
                pi.setFeedId(item.optString("feedId"));
                pi.setHeight(item.optInt("height"));
                pi.setCreateTime(item.optLong("createTime"));
                pi.setLikeCount(item.optInt("likeCount"));
                pi.setPhotoId(item.optString("photoId"));
                pi.setWidth(item.optInt("width"));
                pi.setState(item.optString("state"));
                pi.setPhotoPath(item.optString("photoPath"));
                pi.setSmallPhotoPath(AppUtil.getSmallPhoto(item
                        .optString("photoPath")));
                pi.setFixPhotoPath(AppUtil.getFixWidthPhoto(item
                        .optString("photoPath")));
                pi.setAlreadyLiked(item.optBoolean("alreadyLiked", false));
                UserItem ui = new UserItem();
                JSONObject user = item.getJSONObject("user");
                ui.setCreateTime(user.optString("createTime"));
                ui.setName(user.optString("name"));
                ui.setUserId(user.optString("userId"));
                ui.setGender(user.optString("gender"));
                ui.setDeviceId(user.optString("deviceId"));
                ui.setPrimaryPhotoPath(AppUtil.getSmallPhoto(user
                        .optString("primaryPhotoPath")));
                pi.setUser(ui);
                photos.add(pi);
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }

        return photos;

    }



    public static UserItem getUser(String result) throws JSONParseException {
        checkSucceed(result);
        UserItem user = null;
        user = new UserItem();
        try {
            JSONObject jo = new JSONObject(result).optJSONObject("result");
            if (jo == null) {
                return null;
            }
            user.setUserId(jo.optString("userId"));
            user.setGender(jo.optString("gender"));
            user.setName(jo.optString("name"));
            user.setPrimaryPhotoId(jo.optString("primaryPhotoId"));
            user.setPrimaryPhotoPath(jo
                    .optString("primaryPhotoPath"));
            user.setPhotoCount(jo.optInt("photoCount"));
            user.setLikeCount(jo.optInt("likeCount"));
            user.setConstellation(jo.optString("constellation"));
            user.setDepartment(jo.optString("department"));
            user.setEducationalStatus(jo.optString("educationalStatus"));
            user.setHometown(jo.optString("hometown"));
            user.setGoodRateCount(jo.optInt("goodRateCount"));
            user.setSchool(jo.optString("school"));
            user.setStudentNo(jo.optString("studentNO"));
            user.setDescription(jo.optString("description"));
            user.setBloodType(jo.optString("bloodGroup"));
            user.setHeight(jo.optInt("height"));
        } catch (JSONException e) {
            e.printStackTrace();
            user = null;
        }
        return user;
    }

    public static ArrayList<PhotoItem> getPhotos(String result)
            throws JSONParseException {
        checkSucceed(result);
        ArrayList<PhotoItem> photos = null;
        photos = new ArrayList<PhotoItem>();
        try {
            JSONObject jo = new JSONObject(result).optJSONObject("result");
            if (jo == null) {
                return photos;
            }
            JSONArray ja = jo.optJSONArray("photos");
            for (int i = 0; i < ja.length(); i++) {
                JSONObject item = ja.getJSONObject(i);
                PhotoItem photo = new PhotoItem();
                photo.setPhotoId(item.optString("photoId"));
                photo.setCreateTime(item.optLong("createTime"));
                photo.setPhotoPath(item.optString("photoPath"));
                photo.setWidth(item.optInt("width"));
                photo.setHeight(item.optInt("height"));
                photo.setLikeCount(item.optInt("likeCount"));
                photo.setAlreadyLiked(item.optBoolean("alreadyLiked", false));
                photo.setFixPhotoPath(AppUtil.getFixWidthPhoto(item
                        .optString("photoPath")));
                photo.setSmallPhotoPath(AppUtil.getSmallPhoto(item
                        .optString("photoPath")));
                photos.add(photo);
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }
        return photos;
    }

    public static ArrayList<DateListItem> getDateItems(String result)
            throws JSONParseException {
        checkSucceed(result);
        ArrayList<DateListItem> dateItems = null;
        dateItems = new ArrayList<DateListItem>();
        try {
            JSONObject jo = new JSONObject(result).optJSONObject("result");
            if (jo == null) {
                return dateItems;
            }
            JSONObject user = jo.optJSONObject("user");
            if (user != null) {
                AppInfo.userName = user.optString("name");
                AppInfo.userPhoto = AppUtil.getSmallPhoto(user
                        .optString("primaryPhotoPath"));
            }
            JSONArray ja = jo.optJSONArray("dates");
            if (ja == null) {
                return dateItems;
            }
            for (int i = 0; i < ja.length(); i++) {
                JSONObject item = ja.getJSONObject(i);
                DateListItem date = new DateListItem();
                date.setDateId(item.optString("dateId"));
                date.setDateDate(item.optLong("dateDate"));
                date.setOrderScore(item.optLong("orderScore"));
                date.setDateDescription(item.optString("description"));
                date.setWhoPay(item.optInt("whoPay"));
                date.setDateTitle(item.optString("title"));
                date.setAlreadyStop(item.optBoolean("alreadyStopped"));
                date.setAddress(item.optString("address"));
                date.setWantPersonCount(item.optInt("wantPersonCount"));
                date.setExistPersonCount(item.optInt("existPersonCount"));
                date.setPhotoId(item.optString("photoId"));
                date.setPhotoPath(item.optString("photoPath"));
                date.setDateResponderCount(item.optInt("dateResponderCount"));
                date.setConfirmedPersonCount(item.optInt("confirmedPersonCount"));
                date.setSenderId(item.optString("senderId"));
                try {
                    JSONObject senderJo = item.getJSONObject("sender");
                    UserItem sender = new UserItem();
                    sender.setPrimaryPhotoId(senderJo
                            .optString("primaryPhotoId"));
                    sender.setPrimaryPhotoPath(senderJo
                            .optString("primaryPhotoPath"));
                    sender.setName(senderJo.optString("name"));
                    sender.setUserId(senderJo.optString("userId"));
                    date.setSender(sender);
                    date.setDateType("receiver");
                    date.setReceiveTime(item.optLong("receiveTime"));
                } catch (Exception e) {
                    date.setDateType("creater");
                    date.setReceiveTime(item.optLong("sendTime"));
                }
                ArrayList<ChatItem> responses = new ArrayList<ChatItem>();
                try {
                    JSONArray responders = item.optJSONArray("responders");
                    if (responders!=null){
                        for (int k = 0; k < responders.length(); k++) {
                            ChatItem chatitem = new ChatItem();
                            JSONObject responder = responders.getJSONObject(k);
                            chatitem.setUserId(responder.optString("userId"));
                            chatitem.setName(responder.optString("name"));
                            chatitem.setPhotoId(responder
                                    .optString("primaryPhotoId"));
                            chatitem.setPhotoPath(responder
                                    .optString("primaryPhotoPath"));
                            chatitem.setSenderConfirmed(responder
                                    .optBoolean("senderConfirmed"));
                            chatitem.setHaveUnViewedMessage(responder.optBoolean("haveUnViewedMessage",false));
                            chatitem.setHaveRated(responder.optBoolean("haveRate"));
                            chatitem.setHaveBeenRated(responder.optBoolean("haveBeenRated"));
                            MessageItem mi = new MessageItem();
                            JSONObject latestMsg = responder
                                    .getJSONObject("latestMessage");
                            mi.setMessageId(latestMsg.optString("messageId"));
                            mi.setCreateTime(latestMsg.optLong("createTime"));
                            mi.setReceiverId(latestMsg.optString("receiverId"));
                            mi.setMessageText(latestMsg.optString("messageText"));
                            mi.setSenderId(latestMsg.optString("senderId"));
                            chatitem.setLatestMessage(mi);
                            responses.add(chatitem);
                        }
                    }
                } catch (Exception e) {
                    LogUtils.Logd("JSONParserException", e.getMessage(), e);
                }
                date.setResponses(responses);
                date.setResponders(AppUtil.sortConversationList(responses));

                dateItems.add(date);
            }
        } catch (JSONException e) {
            e.printStackTrace();
        } catch (Exception e) {
        }
        return dateItems;
    }

    public static ArrayList<MessageItem> getHistoryMessage(String result)
            throws JSONParseException {
        checkSucceed(result);
        ArrayList<MessageItem> messages = null;
        try {
            JSONObject jo = new JSONObject(result).optJSONObject("result");
            JSONArray ja = jo.optJSONArray("messages");
            if (ja == null) {
                return messages;
            }
            messages = new ArrayList<MessageItem>();
            for (int i = 0; i < ja.length(); i++) {
                JSONObject item = ja.getJSONObject(i);
                MessageItem mi = new MessageItem();
                mi.setMessageId(item.optString("messageId"));
                mi.setMessageText(item.optString("messageText"));
                mi.setCreateTime(item.optLong("createTime"));
                JSONObject sender = item.optJSONObject("sender");
                mi.setSenderId(sender.optString("userId"));
                mi.setSenderName(sender.optString("name"));
                mi.setSenderPhotoPath(AppUtil.getSmallPhoto(sender
                        .optString("primaryPhotoPath")));
                messages.add(0, mi);
            }
        } catch (JSONException e) {
            LogUtils.Loge(LogTag.EXCEPTION, e.fillInStackTrace().toString());
        } catch (Exception e) {
            e.printStackTrace();
        }
        return messages;
    }

    public static HashMap<String, Integer> getCreditDelta(String result)
            throws JSONParseException {
        checkSucceed(result);
        HashMap<String, Integer> credit = null;
        credit = new HashMap<String, Integer>();
        try {
            JSONObject jo = new JSONObject(result).optJSONObject("result");
            int creditDelta = jo.optInt("creditDelta");
            credit.put("creditDelta", creditDelta);
            int creditCount = jo.optInt("credit");
            credit.put("creditCount", creditCount);
        } catch (JSONException e) {
            e.printStackTrace();
        } catch (Exception e) {

        }
        return credit;
    }

    public static PushMessageInfo getPushMessage(String result) {
        PushMessageInfo pmi = null;
        if (result != null) {
            JSONObject jo;
            try {
                jo = new JSONObject(result);
                pmi = new PushMessageInfo();
                pmi.setMessageType(jo.optString("type"));
                pmi.setUserId(jo.optString("userId"));
                pmi.setMessage(jo.optString("message"));
                if(MessageType.TYPE_CONFIRMDATE.equals(pmi
                        .getMessageType())){
                    pmi.setDateId(jo.optString("dateId"));
                    pmi.setUserName(jo.optString("userName"));
                    pmi.setMessageId(jo.optString("messageId"));
                    pmi.setCreateTime(jo.optLong("createTime"));
                    pmi.setDateSenderId(jo.optString("dateSenderId"));
                } else if (MessageType.TYPE_SENDMESSAGE.equals(pmi
                        .getMessageType())) {
                    pmi.setDateId(jo.optString("dateId"));
                    pmi.setUserName(jo.optString("userName"));
                    pmi.setMessageId(jo.optString("messageId"));
                    pmi.setMessageText(jo.optString("messageText"));
                    pmi.setDateSenderId(jo.optString("dateSenderId"));
                    pmi.setDateResponderId(jo.optString("dateResponderId"));
                } else if(MessageType.TYPE_CANCELDATE.equals(pmi.getMessageType())){
                    pmi.setDateId(jo.optString("dateId"));
                    pmi.setUserName(jo.optString("userName"));
                    pmi.setMessageId(jo.optString("messageId"));
                    pmi.setCreateTime(jo.optLong("createTime"));
                }
            } catch (JSONException e) {
                e.printStackTrace();
            }
        }
        return pmi;
    }

    public static void getUploadPhotoResult(String result, HashMap<String, String> values) throws JSONParseException{
        checkSucceed(result);
        try {
            JSONObject jo = new JSONObject(result).optJSONObject("result");
            String photoId = jo.optString("photoId");
            String photoPath = jo.optString("photoPath");
            values.put("photoId", photoId);
            values.put("photoPath", photoPath);
        } catch (JSONException e) {
            e.printStackTrace();
        } catch (Exception e) {
        }
    }

    public static ArrayList<ConversationItem> getConversations(String result) throws JSONParseException{
        checkSucceed(result);
        ArrayList<ConversationItem> conversations = null;

        try {
            JSONObject jo = new JSONObject(result).optJSONObject("result");
            JSONArray ja = jo.optJSONArray("conversations");
            if (ja == null) {
                return conversations;
            }
            conversations = new ArrayList<ConversationItem>();
            for (int i = 0; i < ja.length(); i++) {
                ConversationItem conversation = new ConversationItem();
                JSONObject item = ja.getJSONObject(i);
                conversation.setHaveUnViewedMessage(item.optBoolean("haveUnViewedMessage", false));
                conversation.setSenderConfirmed(item.optBoolean("senderConfirmed", false));
                conversation.setHaveBeenRated(item.optBoolean("haveBeenRated", false));
                conversation.setHaveRated(item.optBoolean("haveRated", false));
                JSONObject joDate = item.getJSONObject("date");
                DateListItem date = new DateListItem();
                date.setDateId(joDate.optString("dateId"));
                date.setSenderId(joDate.optString("senderId"));
                date.setCountryLocation(joDate.optString("countryLocation"));
                date.setDateDate(joDate.optLong("dateDate"));
                date.setWhoPay(joDate.optInt("whoPay"));
//                date.setDateMoney(joDate.optInt("money"));
//                date.setMonetaryunit(joDate.optString("monetaryunit"));
                date.setDateTitle(joDate.optString("title"));
                date.setDateDescription(joDate.optString("description"));
                conversation.setDate(date);
                JSONObject joTargetUser = item.getJSONObject("targetUser");
                UserItem targetUser = new UserItem();
                targetUser.setUserId(joTargetUser.optString("userId"));
                targetUser.setName(joTargetUser.optString("name"));
                targetUser.setPrimaryPhotoId(joTargetUser.optString("primaryPhotoId"));
                targetUser.setPrimaryPhotoPath(joTargetUser.optString("primaryPhotoPath"));
                conversation.setTargetUser(targetUser);
                JSONObject joLatestMessage = item.getJSONObject("latestMessage");
                MessageItem latestMessage = new MessageItem();
                latestMessage.setMessageId(joLatestMessage.optString("messageId"));
                latestMessage.setMessageText(joLatestMessage.optString("messageText"));
                latestMessage.setCreateTime(joLatestMessage.optLong("createTime"));
                latestMessage.setSenderId(joLatestMessage.optString("senderId"));
                latestMessage.setReceiverId(joLatestMessage.optString("receiverId"));
                conversation.setLatestmessage(latestMessage);
                conversations.add(conversation);
            }
        } catch (JSONException e) {
            LogUtils.Loge(LogTag.EXCEPTION, e.fillInStackTrace().toString());
        } catch (Exception e) {
            e.printStackTrace();
        }
        return conversations;
    }

    public static ArrayList<SubjectItem> getDateSubjects(String result) throws JSONParseException{
        checkSucceed(result);
        ArrayList<SubjectItem> event = null;
        try {
            JSONObject jo = new JSONObject(result).optJSONObject("result");
            JSONArray ja = jo.optJSONArray("types");
            if (ja == null) {
                return event;
            }
            event = new ArrayList<SubjectItem>();
            JSONObject item;
            JSONArray values;
            JSONArray details;
            for (int i = 0; i < ja.length(); i++) {
                item = ja.getJSONObject(i);
                details = item.getJSONArray("level2Autotext");
                values = item.getJSONArray("level2");
                String type = item.optString("level1");
                for(int j = 0;j<values.length();j++){
                    SubjectItem subject = new SubjectItem();
                    subject.setType(type);
                    subject.setValue(values.optString(j));
                    subject.setDetail(details.optString(j));
                    event.add(subject);
                }
            }
        } catch (JSONException e) {
            LogUtils.Loge(LogTag.EXCEPTION, e.fillInStackTrace().toString());
        } catch (Exception e) {
            e.printStackTrace();
        }
        return event;

    }

    public static int getRateResult(String result) throws JSONParseException{
        checkSucceed(result);
        int targetUserGoodRateCount = 0;
        try {
            JSONObject jo = new JSONObject(result);
            targetUserGoodRateCount = jo.getJSONObject("result").optInt("targetUserGoodRateCount");
        } catch (JSONException e) {
        }
        return targetUserGoodRateCount;
    }

    public static String getInviteCode(String result) throws JSONParseException{
        checkSucceed(result);
        String event = null;
        try {
            JSONObject jo = new JSONObject(result);
            event = jo.getJSONObject("result").optString("text");
        } catch (JSONException e) {
        }
        return event;
    }

}
