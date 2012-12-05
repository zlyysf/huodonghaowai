package com.lingzhimobile.tongqu.model;


public class PushMessageInfo {
	private String messageType;
	private String messageText;
	private String dateId;
	private String userId;
	private String userName;
	private String message;
	private String messageId;
	private long createTime;
	private String dateSenderId;
	private String dateResponderId;
	
    public String getDateResponderId() {
        return dateResponderId;
    }
    public void setDateResponderId(String dateResponderId) {
        this.dateResponderId = dateResponderId;
    }
    public String getDateSenderId() {
        return dateSenderId;
    }
    public void setDateSenderId(String dateSenderId) {
        this.dateSenderId = dateSenderId;
    }
    public long getCreateTime() {
        return createTime;
    }
    public void setCreateTime(long createTime) {
        this.createTime = createTime;
    }
    public String getMessageId() {
        return messageId;
    }
    public void setMessageId(String messageId) {
        this.messageId = messageId;
    }
    public String getMessageText() {
        return messageText;
    }
    public void setMessageText(String messageText) {
        this.messageText = messageText;
    }
    public String getDateId() {
        return dateId;
    }
    public void setDateId(String dateId) {
        this.dateId = dateId;
    }
    public String getUserId() {
        return userId;
    }
    public void setUserId(String userId) {
        this.userId = userId;
    }
    public String getUserName() {
        return userName;
    }
    public void setUserName(String userName) {
        this.userName = userName;
    }
    public String getMessage() {
        return message;
    }
    public void setMessage(String message) {
        this.message = message;
    }
    public String getMessageType() {
		return messageType;
	}
	public void setMessageType(String messageType) {
		this.messageType = messageType;
	}


}
