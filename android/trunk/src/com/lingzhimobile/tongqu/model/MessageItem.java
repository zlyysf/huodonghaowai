package com.lingzhimobile.tongqu.model;


public class MessageItem {
	private String senderId;
	private String messageId;
	private String receiverId;
	private String messageText;
	private long createTime;
	private String senderName;
	private String senderPhotoPath;
	private String briefMessage;
	public String getBriefMessage() {
		return briefMessage;
	}
	public void setBriefMessage(String briefMessage) {
		this.briefMessage = briefMessage;
	}
	public String getSenderId() {
		return senderId;
	}
	public String getSenderName() {
		return senderName;
	}
	public void setSenderName(String senderName) {
		this.senderName = senderName;
	}
	public String getSenderPhotoPath() {
		return senderPhotoPath;
	}
	public void setSenderPhotoPath(String senderPhotoPath) {
		this.senderPhotoPath = senderPhotoPath;
	}
	public void setSenderId(String senderId) {
		this.senderId = senderId;
	}
	public String getMessageId() {
		return messageId;
	}
	public void setMessageId(String messageId) {
		this.messageId = messageId;
	}
	public String getReceiverId() {
		return receiverId;
	}
	public void setReceiverId(String receiverId) {
		this.receiverId = receiverId;
	}
	public String getMessageText() {
		return messageText;
	}
	public void setMessageText(String messageText) {
		this.messageText = messageText;
	}
	public long getCreateTime() {
		return createTime;
	}
	public void setCreateTime(long createTime) {
		this.createTime = createTime;
	}
}
