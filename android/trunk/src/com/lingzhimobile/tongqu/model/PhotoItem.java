package com.lingzhimobile.tongqu.model;

import android.graphics.Bitmap;

import com.lingzhimobile.tongqu.util.ImageLoadUtil;
import com.lingzhimobile.tongqu.util.MethodHandler;

public class PhotoItem {
    public boolean isFaked = false;
    
	private String feedId;
	private long createTime;
	private int height;
	private int width;
	private int likeCount;
	private String photoId;
	private String state;
	private UserItem user;
	private String photoPath;
	private String smallPhotoPath;
	private String fixPhotoPath;
	public String getSmallPhotoPath() {
        return smallPhotoPath;
    }
    public void setSmallPhotoPath(String smallPhotoPath) {
        this.smallPhotoPath = smallPhotoPath;
    }
    public String getFixPhotoPath() {
        return fixPhotoPath;
    }
    public void setFixPhotoPath(String fixPhotoPath) {
        this.fixPhotoPath = fixPhotoPath;
    }

    private boolean alreadyLiked;
	public boolean isAlreadyLiked() {
		return alreadyLiked;
	}
	public void setAlreadyLiked(boolean alreadyLiked) {
		this.alreadyLiked = alreadyLiked;
	}
	public String getFeedId() {
		return feedId;
	}
	public void setFeedId(String feedId) {
		this.feedId = feedId;
	}
	public long getCreateTime() {
		return createTime;
	}
	public void setCreateTime(long createTime) {
		this.createTime = createTime;
	}
	public int getHeight() {
		return height;
	}
	public void setHeight(int height) {
		this.height = height;
	}
	public int getWidth() {
		return width;
	}
	public void setWidth(int width) {
		this.width = width;
	}
	public int getLikeCount() {
		return likeCount;
	}
	public void setLikeCount(int likeCount) {
		this.likeCount = likeCount;
	}
	public String getPhotoId() {
		return photoId;
	}
	public void setPhotoId(String photoId) {
		this.photoId = photoId;
	}
	public String getState() {
		return state;
	}
	public void setState(String state) {
		this.state = state;
	}
	public UserItem getUser() {
		return user;
	}
	public void setUser(UserItem user) {
		this.user = user;
	}
	public String getPhotoPath() {
		return photoPath;
	}
	public void setPhotoPath(String photoPath) {
		this.photoPath = photoPath;
	}
	public Bitmap getBitmap() {
		return ImageLoadUtil.readImg(getPhotoPath());
	}
	public Bitmap getSmallBitmap() {
        return ImageLoadUtil.readImg(getSmallPhotoPath());
    }
	public Bitmap getFwBitmap() {
        return ImageLoadUtil.readImg(getFixPhotoPath());
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
	public void getSmallPostBitmapAsync(final MethodHandler<Bitmap> handler) {
        ImageLoadUtil.readBitmapAsync(getSmallPhotoPath(),
                new MethodHandler<Bitmap>() {
                    public void process(Bitmap para) {
                        if (handler != null)
                            handler.process(para);
                    }
                });
    }
	public void getFwPostBitmapAsync(final MethodHandler<Bitmap> handler) {
        ImageLoadUtil.readBitmapAsync(getFixPhotoPath(),
                new MethodHandler<Bitmap>() {
                    public void process(Bitmap para) {
                        if (handler != null)
                            handler.process(para);
                    }
                });
    }
	

}
