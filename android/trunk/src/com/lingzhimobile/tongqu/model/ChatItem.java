package com.lingzhimobile.tongqu.model;

import android.graphics.Bitmap;

import com.lingzhimobile.tongqu.util.AppUtil;
import com.lingzhimobile.tongqu.util.ImageLoadUtil;
import com.lingzhimobile.tongqu.util.MethodHandler;

public class ChatItem {
    private String photoPath;
    private String smallPhotoPath;
    private String photoId;
    private String userId;
    private String name;
    private MessageItem latestMessage;
    private boolean senderConfirmed;
    private boolean haveUnViewedMessage;
    private boolean haveRated;
    private boolean haveBeenRated;
    
	public boolean isHaveBeenRated() {
        return haveBeenRated;
    }
    public void setHaveBeenRated(boolean haveBeenRated) {
        this.haveBeenRated = haveBeenRated;
    }
    public boolean isHaveRated() {
        return haveRated;
    }
    public void setHaveRated(boolean haveRated) {
        this.haveRated = haveRated;
    }
    public boolean isHaveUnViewedMessage() {
        return haveUnViewedMessage;
    }
    public void setHaveUnViewedMessage(boolean haveUnViewedMessage) {
        this.haveUnViewedMessage = haveUnViewedMessage;
    }
    public boolean isSenderConfirmed() {
        return senderConfirmed;
    }
    public void setSenderConfirmed(boolean senderConfirmed) {
        this.senderConfirmed = senderConfirmed;
    }
	public String getPhotoPath() {
		return photoPath;
	}
	public void setPhotoPath(String photoPath) {
		this.photoPath = photoPath;
		this.smallPhotoPath = AppUtil.getSmallPhoto(photoPath);
	}
	public String getPhotoId() {
		return photoId;
	}
	public void setPhotoId(String photoId) {
		this.photoId = photoId;
	}
	public String getSmallPhotoPath() {
        return smallPhotoPath;
    }
    public void setSmallPhotoPath(String smallPhotoPath) {
        this.smallPhotoPath = smallPhotoPath;
    }
    public String getUserId() {
		return userId;
	}
	public void setUserId(String userId) {
		this.userId = userId;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public MessageItem getLatestMessage() {
		return latestMessage;
	}
	public void setLatestMessage(MessageItem latestMessage) {
		this.latestMessage = latestMessage;
	}
	public Bitmap getBitmap() {
		return ImageLoadUtil.readImg(getPhotoPath());
	}
	public Bitmap getSmallBitmap() {
        return ImageLoadUtil.readImg(getSmallPhotoPath());
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
	public void getPostSmallBitmapAsync(final MethodHandler<Bitmap> handler) {
        ImageLoadUtil.readBitmapAsync(getSmallPhotoPath(),
                new MethodHandler<Bitmap>() {
                    public void process(Bitmap para) {
                        if (handler != null)
                            handler.process(para);
                    }
                });
    }
    
}
