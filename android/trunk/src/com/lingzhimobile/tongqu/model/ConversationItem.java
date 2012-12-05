package com.lingzhimobile.tongqu.model;

public class ConversationItem {
    
    private DateListItem date;
    private UserItem targetUser;
    private MessageItem latestmessage;
    private boolean haveUnViewedMessage;
    private boolean senderConfirmed;
    private boolean haveBeenRated;
    private boolean haveRated;
    
    public boolean isHaveRated() {
        return haveRated;
    }
    public void setHaveRated(boolean haveRated) {
        this.haveRated = haveRated;
    }
    public boolean isSenderConfirmed() {
        return senderConfirmed;
    }
    public void setSenderConfirmed(boolean senderConfirmed) {
        this.senderConfirmed = senderConfirmed;
    }
    public boolean isHaveBeenRated() {
        return haveBeenRated;
    }
    public void setHaveBeenRated(boolean haveBeenRated) {
        this.haveBeenRated = haveBeenRated;
    }
    public DateListItem getDate() {
        return date;
    }
    public void setDate(DateListItem date) {
        this.date = date;
    }
    public UserItem getTargetUser() {
        return targetUser;
    }
    public void setTargetUser(UserItem targetUser) {
        this.targetUser = targetUser;
    }
    public MessageItem getLatestmessage() {
        return latestmessage;
    }
    public void setLatestmessage(MessageItem latestmessage) {
        this.latestmessage = latestmessage;
    }
    public boolean isHaveUnViewedMessage() {
        return haveUnViewedMessage;
    }
    public void setHaveUnViewedMessage(boolean haveUnViewedMessage) {
        this.haveUnViewedMessage = haveUnViewedMessage;
    }
    

}
