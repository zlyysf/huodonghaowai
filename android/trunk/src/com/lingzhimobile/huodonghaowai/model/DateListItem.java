package com.lingzhimobile.huodonghaowai.model;

import java.util.ArrayList;
import java.util.List;

import org.json.JSONObject;

import android.graphics.Bitmap;

import com.lingzhimobile.huodonghaowai.util.ImageLoadUtil;
import com.lingzhimobile.huodonghaowai.util.MethodHandler;

public class DateListItem {
    public int selectedIndex;
	private List<ChatItem> Responses;
	private List<ArrayList<ChatItem>> Responders;
	public List<ArrayList<ChatItem>> getResponders() {
        return Responders;
    }
    public void setResponders(List<ArrayList<ChatItem>> responders) {
        Responders = responders;
    }
    private String dateType;
	private long receiveTime;
	private String senderId;
	private UserItem sender;
	private JSONObject region;
	private String dateDescription;
	private String dateId;
	private int whoPay;
	private long dateDate;
	private String countryLocation;
	private long orderScore;
	private String dateTitle;
	private int dateResponderCount;
	private boolean alreadyStop;
	private int wantPersonCount;
	private int existPersonCount;
	private int confirmedPersonCount;
	public int getConfirmedPersonCount() {
        return confirmedPersonCount;
    }
    public void setConfirmedPersonCount(int confirmedPersonCount) {
        this.confirmedPersonCount = confirmedPersonCount;
    }
    private String photoId;
	private String photoPath;
	private String address;

	
	public String getAddress() {
        return address;
    }
    public void setAddress(String address) {
        this.address = address;
    }
    public String getPhotoId() {
        return photoId;
    }
    public void setPhotoId(String photoId) {
        this.photoId = photoId;
    }
    public String getPhotoPath() {
        return photoPath;
    }
    public void setPhotoPath(String photoPath) {
        this.photoPath = photoPath;
    }
    public int getWantPersonCount() {
        return wantPersonCount;
    }
    public void setWantPersonCount(int wantPersonCount) {
        this.wantPersonCount = wantPersonCount;
    }
    public int getExistPersonCount() {
        return existPersonCount;
    }
    public void setExistPersonCount(int existPersonCount) {
        this.existPersonCount = existPersonCount;
    }
    public boolean isAlreadyStop() {
        return alreadyStop;
    }
    public void setAlreadyStop(boolean alreadyStop) {
        this.alreadyStop = alreadyStop;
    }
    public DateListItem(String dateId){
	    this.dateId = dateId;
	}
	public DateListItem(){
	    
	}
	
	public String getSenderId() {
        return senderId;
    }
    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }
    public int getDateResponderCount() {
        return dateResponderCount;
    }
    public void setDateResponderCount(int dateResponderCount) {
        this.dateResponderCount = dateResponderCount;
    }
    public String getDateTitle() {
        return dateTitle;
    }
    public void setDateTitle(String dateTitle) {
        this.dateTitle = dateTitle;
    }
    public long getOrderScore() {
        return orderScore;
    }
    public void setOrderScore(long orderScore) {
        this.orderScore = orderScore;
    }
	public String getCountryLocation() {
        return countryLocation;
    }
    public void setCountryLocation(String countyLocation) {
        this.countryLocation = countyLocation;
    }
    public long getReceiveTime() {
		return receiveTime;
	}
	public void setReceiveTime(long receiveTime) {
		this.receiveTime = receiveTime;
	}
	public List<ChatItem> getResponses() {
		return Responses;
	}
	public void setResponses(List<ChatItem> responses) {
		Responses = responses;
	}
	public String getDateType() {
		return dateType;
	}
	public void setDateType(String dateType) {
		this.dateType = dateType;
	}
	public UserItem getSender() {
		return sender;
	}
	public void setSender(UserItem sender) {
		this.sender = sender;
	}
	public JSONObject getRegion() {
		return region;
	}
	public void setRegion(JSONObject region) {
		this.region = region;
	}
	public String getDateDescription() {
		return dateDescription;
	}
	public void setDateDescription(String dateDescription) {
		this.dateDescription = dateDescription;
	}
	public String getDateId() {
		return dateId;
	}
	public void setDateId(String dateId) {
		this.dateId = dateId;
	}
	public int getWhoPay() {
		return whoPay;
	}
	public void setWhoPay(int whoPay) {
		this.whoPay = whoPay;
	}
	public long getDateDate() {
		return dateDate;
	}
	public void setDateDate(long dateDate) {
		this.dateDate = dateDate;
	}
	public Bitmap getBitmap() {
        return ImageLoadUtil.readImg(getPhotoPath());
    }
	public void getPostBitmapAsync(final MethodHandler<Bitmap> handler) {
        ImageLoadUtil.readBitmapAsync(getPhotoPath(),
                new MethodHandler<Bitmap>() {
                    public void process(Bitmap para) {
                        if (handler != null)
                            handler.process(para);
                    }
                });
    }
}
