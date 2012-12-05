package com.lingzhimobile.tongqu.model;

import java.util.ArrayList;

import android.graphics.Bitmap;

import com.lingzhimobile.tongqu.util.AppUtil;
import com.lingzhimobile.tongqu.util.ImageLoadUtil;
import com.lingzhimobile.tongqu.util.MethodHandler;

public class UserItem implements Cloneable{
	private String userId;
	private String deviceId;
	private String createTime;
	private int height;
	private String name;
	private String gender;
	private String primaryPhotoId;
	private String primaryPhotoPath;
	private String smallPhotoPath;
	private int photoCount;
	private int likeCount;
	private String school;
	private String studentNo;
	private String bloodType;
	private String department;
	private String constellation;
	private String hometown;
	private String educationalStatus;
	private String description;
	public int getHeight() {
        return height;
    }
    public void setHeight(int height) {
        this.height = height;
    }
    public String getBloodType() {
        return bloodType;
    }
    public void setBloodType(String bloodType) {
        this.bloodType = bloodType;
    }
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }

    private int goodRateCount;
	
	public String getSchool() {
        return school;
    }
    public void setSchool(String school) {
        this.school = school;
    }
    public String getStudentNo() {
        return studentNo;
    }
    public void setStudentNo(String studentNo) {
        this.studentNo = studentNo;
    }
    public String getDepartment() {
        return department;
    }
    public void setDepartment(String department) {
        this.department = department;
    }
    public String getConstellation() {
        return constellation;
    }
    public void setConstellation(String constellation) {
        this.constellation = constellation;
    }
    public String getHometown() {
        return hometown;
    }
    public void setHometown(String hometown) {
        this.hometown = hometown;
    }
    public String getEducationalStatus() {
        return educationalStatus;
    }
    public void setEducationalStatus(String educationalStatus) {
        this.educationalStatus = educationalStatus;
    }
    public int getGoodRateCount() {
        return goodRateCount;
    }
    public void setGoodRateCount(int goodRateCount) {
        this.goodRateCount = goodRateCount;
    }
    public String getSmallPhotoPath() {
        return smallPhotoPath;
    }
    public void setSmallPhotoPath(String smallPhotoPath) {
        this.smallPhotoPath = smallPhotoPath;
    }
	public int getLikeCount() {
		return likeCount;
	}
	public void setLikeCount(int likeCount) {
		this.likeCount = likeCount;
	}
	public String getPrimaryPhotoId() {
		return primaryPhotoId;
	}
	public void setPrimaryPhotoId(String primaryPhotoId) {
		this.primaryPhotoId = primaryPhotoId;
	}
	public String getPrimaryPhotoPath() {
		return primaryPhotoPath;
	}
	public void setPrimaryPhotoPath(String primaryPhotoPath) {
		this.primaryPhotoPath = primaryPhotoPath;
		this.smallPhotoPath = AppUtil.getSmallPhoto(primaryPhotoPath);
	}
	public int getPhotoCount() {
		return photoCount;
	}
	public void setPhotoCount(int photoCount) {
		this.photoCount = photoCount;
	}
	public String getUserId() {
		return userId;
	}
	public void setUserId(String userId) {
		this.userId = userId;
	}
	public String getDeviceId() {
		return deviceId;
	}
	public void setDeviceId(String deviceId) {
		this.deviceId = deviceId;
	}
	public String getCreateTime() {
		return createTime;
	}
	public void setCreateTime(String createTime) {
		this.createTime = createTime;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getGender() {
		return gender;
	}
	public void setGender(String gender) {
		this.gender = gender;
	}
	
	public Bitmap getBitmap() {
		return ImageLoadUtil.readImg(getPrimaryPhotoPath());
	}
	public Bitmap getSmallBitmap() {
        return ImageLoadUtil.readImg(getSmallPhotoPath());
    }
	
	public void getPostBitmapAsync(final MethodHandler<Bitmap> handler) {
		ImageLoadUtil.readBitmapAsync(getPrimaryPhotoPath(),
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
	
	public UserItem clone(){
	    UserItem self = null;
        try {
            self = (UserItem) super.clone();
        } catch (CloneNotSupportedException e) {
        }
          return self;      
    }
	

}
