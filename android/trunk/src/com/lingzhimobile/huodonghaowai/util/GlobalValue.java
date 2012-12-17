package com.lingzhimobile.huodonghaowai.util;

import java.util.ArrayList;
import java.util.HashMap;

import org.json.JSONObject;

import com.lingzhimobile.huodonghaowai.model.ConversationItem;
import com.lingzhimobile.huodonghaowai.model.DateListItem;
import com.lingzhimobile.huodonghaowai.model.MessageItem;
import com.lingzhimobile.huodonghaowai.model.PhotoItem;
import com.lingzhimobile.huodonghaowai.model.SubjectItem;

public class GlobalValue {
	
	public static ArrayList<DateListItem> sendDates = new ArrayList<DateListItem>();
	public static ArrayList<DateListItem> invitedDates = new ArrayList<DateListItem>();
	public static ArrayList<DateListItem> applyDates = new ArrayList<DateListItem>();
	public static ArrayList<DateListItem> nearbyDates = new ArrayList<DateListItem>();
//	public static DateListItem nearbyDateLoadMore = new DateListItem("0000");
	public static ArrayList<ConversationItem> conversationList = new ArrayList<ConversationItem>();
	public static ArrayList<SubjectItem> dateTitleList = new ArrayList<SubjectItem>();

	public static HashMap<String, PhotoItem> cachedQuickUploadedPhoto = new HashMap<String, PhotoItem>();
	
	public static HashMap<String, ArrayList<MessageItem>> chatHistory = new HashMap<String,ArrayList<MessageItem>>();
	
	public static Object notificationLock = new Object();
    public static boolean pushFlag;
    public static int jumpFlagInPush = -1;
    public static String currentChatUserAndDateId = null;
    
    public static String geolibType = "android";
    public static JSONObject region;
    
    public static String inviteSMS;
    
    public static final String CONSUMER_KEY = "1722622338";// sina weibo;
    public static final String CONSUMER_SECRET = "58b7cc614adcf878dd7bb8f366ad4ba2";//sina weibo
    public static final String REDIRECT_RUL = "http://www.lingzhimobile.com";//sina weibo
}
