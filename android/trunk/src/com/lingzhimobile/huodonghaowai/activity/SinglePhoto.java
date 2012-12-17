package com.lingzhimobile.huodonghaowai.activity;

import java.util.ArrayList;
import java.util.List;

import android.app.Dialog;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.support.v4.view.ViewPager;
import android.support.v4.view.ViewPager.OnPageChangeListener;
import android.view.GestureDetector;
import android.view.GestureDetector.OnGestureListener;
import android.view.MotionEvent;
import android.view.View;
import android.view.View.OnTouchListener;
import android.view.ViewGroup.LayoutParams;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.ImageView.ScaleType;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.widget.TextView;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.adapter.ViewPagerAdapter;
import com.lingzhimobile.huodonghaowai.asynctask.DeletePhotoTask;
import com.lingzhimobile.huodonghaowai.asynctask.LikePhotoTask;
import com.lingzhimobile.huodonghaowai.asynctask.SetProfilePhotoTask;
import com.lingzhimobile.huodonghaowai.cons.MessageID;
import com.lingzhimobile.huodonghaowai.model.PhotoItem;
import com.lingzhimobile.huodonghaowai.model.UserItem;
import com.lingzhimobile.huodonghaowai.util.AppInfo;
import com.lingzhimobile.huodonghaowai.util.AppUtil;
import com.lingzhimobile.huodonghaowai.util.MethodHandler;
import com.lingzhimobile.huodonghaowai.view.FlowView;

public class SinglePhoto extends HuoDongHaoWaiActivity implements OnGestureListener{
	private ViewPager vpSinglePhoto;
	private List<View> viewPagerViews;
	private ViewPagerAdapter vpAdapter;
	private ArrayList<PhotoItem> photoItems;

    private LinearLayout ivUserProfilePhotoLL;
	private ImageView ivCurrentUserProfilePhoto;
	private ImageView ivBack;
	private ImageView ivLikeIcon;
	private TextView tvLikeCount;
	private TextView tvPhotoIndex;
	private Button btnMenu;
	private Dialog menuDialog;
	private View.OnClickListener menuClickListener;
	private GestureDetector detector; 

	private int fromType;
	private int index;
	private String userId;

	private UserItem photoOwner;
	private PhotoItem currentPhotoItem;
	private ProgressBar pbLoading;
	private RelativeLayout rlBottombar;
	
	private String userProfilePhotoId;
	private String userProfilePhotoPath;
	private String userProfilePhotoPathSmall;
	
	private DeletePhotoTask deletePhotoTask;
	private SetProfilePhotoTask setProfilePhotoTask;
	private LikePhotoTask likePhotoTask;
	
	public Handler myHandler = new Handler() {

		@Override
		public void handleMessage(Message msg) {
		    pbLoading.setVisibility(View.GONE);
			switch (msg.what) {
			case MessageID.PHOTO_OPERATE_FAIL:
			    AppUtil.handleErrorCode(msg.obj.toString(), SinglePhoto.this);
			    break;
			case MessageID.SERVER_RETURN_NULL:
			    AppUtil.handleErrorCode(msg.obj.toString(), SinglePhoto.this);
				break;
			case MessageID.DELETE_PHOTO_OK:
			    int tempIndex = msg.arg1;
			    int targetIndex = 0;
			    if (tempIndex == index) {
                    if(tempIndex >= viewPagerViews.size()){
                        break;
                    }else if(tempIndex == 0){
                        targetIndex = tempIndex+1;
                    }else if(tempIndex == viewPagerViews.size()-1){
                        targetIndex= tempIndex;
                    }else{
                        targetIndex = tempIndex+1;
                    }
                }
			    vpSinglePhoto.removeView((View) msg.obj);
			    viewPagerViews.remove(msg.obj);
                if (viewPagerViews.size() == 0) {
                    finish();
                } else {
                    if (tempIndex == index) {
                        vpSinglePhoto.setCurrentItem(tempIndex, true);
                        tvPhotoIndex.setText((targetIndex) + "/"
                                + viewPagerViews.size());
                    }else if(tempIndex < index){
                        tvPhotoIndex.setText((index) + "/"
                                + viewPagerViews.size());
                        vpSinglePhoto.setCurrentItem(index-1, true);
                    }else {
                        tvPhotoIndex.setText((index+1) + "/"
                                + viewPagerViews.size());
                        vpSinglePhoto.setCurrentItem(index, true);
                    }
                }
                vpAdapter.notifyDataSetChanged();
//                Profile.instance.myHandler.obtainMessage(MessageID.DELETE_PHOTO_OK,tempIndex).sendToTarget();
                break;
			case MessageID.SET_PROFILE_PHOTO_OK:
			    photoOwner.setPrimaryPhotoId(userProfilePhotoId);
			    photoOwner.setPrimaryPhotoPath(userProfilePhotoPath);
			    AppInfo.userPhoto = userProfilePhotoPath;
			    loadUserProfilePhoto();
//			    Profile.instance.myHandler.obtainMessage(MessageID.SET_PROFILE_PHOTO_OK).sendToTarget();
			    break;
			}

		}

	};

	private Handler handler = new Handler() {

		@Override
		public void handleMessage(Message msg) {

			FlowView fv = (FlowView) msg.obj;
			int position = msg.what;
			if (position >= photoItems.size() || position < 0)
				return;
			PhotoItem pi = photoItems.get(position);
			if (fv != null && pi != null && pi.getPhotoPath() != null
					&& pi.getPhotoPath().equals(fv.getTag())) {
				fv.setImageBitmap(pi.getBitmap());
				fv.setTag(null);
			}

		}
	};

	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.singlephoto);
		findView();
		fromType = getIntent().getIntExtra("type", 0);
		index = getIntent().getIntExtra("index", 1);
		userId = getIntent().getStringExtra("userId");
		switch (fromType) {
		
		case MessageID.FROM_PROFILE:
//			photoOwner = Profile.instance.currentUser;
//			photoItems = photoOwner.getPhotos();
//			if (photoItems == null){
//			    photoItems = Profile.instance.userPhotos;
//			}
//			if (userId == null) {
//			    btnMenu.setVisibility(View.VISIBLE);
//                ivLikeIcon.setClickable(false);
//                ivLikeIcon.setEnabled(false);
//            }
//            break;
		}
		for (int i = 0; i < photoItems.size(); i++) {
			FlowView fv = new FlowView(this);
			LayoutParams lp = new LayoutParams(LayoutParams.MATCH_PARENT,
					LayoutParams.MATCH_PARENT);
			fv.setLayoutParams(lp);
			fv.setPi(photoItems.get(i));
			fv.setId(i);
			fv.setScaleType(ScaleType.FIT_CENTER);
			fv.setViewHandler(handler);
			viewPagerViews.add(fv);
		}
		currentPhotoItem = photoItems.get(index);
		setData();
		vpSinglePhoto.setCurrentItem(index);
		((FlowView) viewPagerViews.get(index)).LoadOriginalImage();

	}

	public void findView() {
	    ivUserProfilePhotoLL = (LinearLayout) findViewById(R.id.ivUserProfilePhotoLL);
		ivCurrentUserProfilePhoto = (ImageView) findViewById(R.id.ivUserProfilePhoto);
		rlBottombar = (RelativeLayout) findViewById(R.id.rlBottombar);
		viewPagerViews = new ArrayList<View>();
		vpSinglePhoto = (ViewPager) findViewById(R.id.vpSinglePhoto);
		ivBack = (ImageView) findViewById(R.id.ivBack);
		ivLikeIcon = (ImageView) findViewById(R.id.ivLikeIcon);
		btnMenu = (Button) findViewById(R.id.btnMenu);
		tvLikeCount = (TextView) findViewById(R.id.tvLikerCount);
		tvPhotoIndex = (TextView) findViewById(R.id.tvPhotoIndex);
		menuDialog = new Dialog(this, R.style.AlertDialog);
		detector = new GestureDetector(this);  
	}

	public void setData() {
	    if (fromType != MessageID.FROM_PROFILE || userId != null) {
            if (currentPhotoItem.isAlreadyLiked()) {
                ivLikeIcon.setImageResource(R.drawable.icon_heart_click);
                tvLikeCount.setTextColor(0xfffc7cb3);
                ivLikeIcon.setTag("like");
            } else {
                ivLikeIcon.setImageResource(R.drawable.icon_heart);
                tvLikeCount.setTextColor(0xffc2c2c2);
                ivLikeIcon.setTag("unlike");
            }
        }else{
            ivLikeIcon.setImageResource(R.drawable.icon_heart_click);
            tvLikeCount.setTextColor(0xfffc7cb3);
        }
        tvLikeCount.setText(String.valueOf(currentPhotoItem.getLikeCount()));
	    tvPhotoIndex.setText((index+1)+"/"+photoItems.size());
		vpAdapter = new ViewPagerAdapter(viewPagerViews);
		vpSinglePhoto.setAdapter(vpAdapter);
		vpSinglePhoto.setOnTouchListener(new OnTouchListener() {
            
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                detector.onTouchEvent(event);  
                return false;
            }
        });
		vpSinglePhoto.setOnPageChangeListener(new OnPageChangeListener() {

			@Override
			public void onPageSelected(final int arg0) {
                FlowView fv = (FlowView) viewPagerViews.get(arg0);
                if (((FlowView) viewPagerViews.get(arg0)).bitmap == null) {
                    ((FlowView) viewPagerViews.get(arg0)).LoadOriginalImage();
                }
                if(arg0 <= viewPagerViews.size()-4){
                    if(((FlowView) viewPagerViews.get(arg0+3)).bitmap != null){
                        ((FlowView) viewPagerViews.get(arg0+3)).recycle();
                    }
                }
                if(arg0 >= 3){
                    if(((FlowView) viewPagerViews.get(arg0-3)).bitmap != null){
                        ((FlowView) viewPagerViews.get(arg0-3)).recycle();
                    }
				}
				index = arg0;
                currentPhotoItem = fv.getPi();//photoItems.get(arg0);
				tvLikeCount.setText(String.valueOf(currentPhotoItem.getLikeCount()));
				tvPhotoIndex.setText((arg0+1)+"/"+viewPagerViews.size());
				if (fromType != MessageID.FROM_PROFILE || userId != null) {
                    if (currentPhotoItem.isAlreadyLiked()) {
                        ivLikeIcon
                                .setImageResource(R.drawable.icon_heart_click);
                        ivLikeIcon.setTag("like");
                        tvLikeCount.setTextColor(0xfffc7cb3);
                    } else {
                        ivLikeIcon.setImageResource(R.drawable.icon_heart);
                        ivLikeIcon.setTag("unlike");
                        tvLikeCount.setTextColor(0xffc2c2c2);
                    }
                }
                if (fromType == MessageID.FROM_NEARBY_NEW
						|| fromType == MessageID.FROM_NEARBY_HOT) {
					photoOwner = photoItems.get(arg0).getUser();
					Bitmap ownerPhotoBitmap = photoOwner
							.getBitmap();
					if (ownerPhotoBitmap != null) {
						ivCurrentUserProfilePhoto
								.setImageBitmap(ownerPhotoBitmap);
						ivCurrentUserProfilePhoto.setTag(null);
					} else {
						ivCurrentUserProfilePhoto.setTag(photoOwner
								.getPrimaryPhotoPath());
						photoOwner.getPostBitmapAsync(
								new MethodHandler<Bitmap>() {
									public void process(Bitmap para) {
										Message msg = refreshImgHandler
												.obtainMessage(arg0,
														ivCurrentUserProfilePhoto);
										refreshImgHandler.sendMessage(msg);
									}
								});
					}
				}
			}

			@Override
			public void onPageScrolled(int arg0, float arg1, int arg2) {

			}

			@Override
			public void onPageScrollStateChanged(int arg0) {

			}
		});
		loadUserProfilePhoto();

		ivCurrentUserProfilePhoto
				.setOnClickListener(new View.OnClickListener() {

					@Override
					public void onClick(View v) {
						if (fromType == MessageID.FROM_PROFILE) {
							finish();
							return;
						}
						Intent intent = new Intent();
						intent.setClass(SinglePhoto.this, Profile.class);
						intent.putExtra("userId", photoOwner.getUserId());
						SinglePhoto.this.startActivity(intent);

					}
				});

		ivBack.setOnClickListener(new View.OnClickListener() {

			@Override
			public void onClick(View v) {
				SinglePhoto.this.finish();
			}
		});

		ivLikeIcon.setOnClickListener(new View.OnClickListener() {

			@Override
			public void onClick(View v) {
				if ("like".equals(v.getTag())) {
					ivLikeIcon.setImageResource(R.drawable.icon_heart);
					v.setTag("unlike");
					currentPhotoItem.setAlreadyLiked(false);
                    currentPhotoItem.setLikeCount(currentPhotoItem.getLikeCount()-1);
                    tvLikeCount.setText(String.valueOf(currentPhotoItem.getLikeCount()));
                    tvLikeCount.setTextColor(0xffc2c2c2);
                    likePhotoTask = new LikePhotoTask(AppInfo.userId, currentPhotoItem.getPhotoId(), "unlike", myHandler.obtainMessage());
                    likePhotoTask.execute();
				} else {
				    currentPhotoItem.setAlreadyLiked(true);
                    currentPhotoItem.setLikeCount(currentPhotoItem.getLikeCount()+1);
                    tvLikeCount.setText(String.valueOf(currentPhotoItem.getLikeCount()));
					ivLikeIcon.setImageResource(R.drawable.icon_heart_click);
					tvLikeCount.setTextColor(0xfffc7cb3);
					v.setTag("like");
					likePhotoTask = new LikePhotoTask(AppInfo.userId, currentPhotoItem.getPhotoId(), "like", myHandler.obtainMessage());
					likePhotoTask.execute();
				}
			}
		});
		
		rlBottombar.setOnClickListener(new View.OnClickListener() {
            
            @Override
            public void onClick(View arg0) {
                // Do nothing here
            }
        });
		
		btnMenu.setOnClickListener(new View.OnClickListener() {

			@Override
			public void onClick(View v) {
				showMenuDialog();
			}
		});
		menuClickListener = new View.OnClickListener() {

			@Override
			public void onClick(View v) {
				int id = v.getId();
				switch (id) {
				case R.id.tvCancel:
					break;
				case R.id.tvNewDate:
				    if (currentPhotoItem.getPhotoId()!=null){
				        // delete current photo
				        deletePhotoTask = new DeletePhotoTask(AppInfo.userId,
				                currentPhotoItem.getPhotoId(),viewPagerViews.get(index),index,
				                myHandler.obtainMessage());
				        deletePhotoTask.execute();
				        pbLoading.setVisibility(View.VISIBLE);
				    }
					break;
				case R.id.tvCurrentDate:
				    if (currentPhotoItem.getPhotoId()!=null){
				        // set current photo to profile photo
				        setProfilePhotoTask = new SetProfilePhotoTask(AppInfo.userId, currentPhotoItem.getPhotoId(),
				                myHandler.obtainMessage());
				        setProfilePhotoTask.execute();
				        userProfilePhotoId = currentPhotoItem.getPhotoId();
				        userProfilePhotoPathSmall = currentPhotoItem.getSmallPhotoPath();
				        userProfilePhotoPath = currentPhotoItem.getPhotoPath();
				        pbLoading.setVisibility(View.VISIBLE);
				    }
					break;
				}
				menuDialog.dismiss();
			}
		};

	}

	private void showMenuDialog() {
		View dialogview = this.getLayoutInflater().inflate(
				R.layout.selectdatedialog, null);
		TextView tvDelete = (TextView) dialogview.findViewById(R.id.tvNewDate);
		TextView tvSetProfilePhoto = (TextView) dialogview
				.findViewById(R.id.tvCurrentDate);
		TextView tvCancel = (TextView) dialogview.findViewById(R.id.tvCancel);
		tvDelete.setText(R.string.delete);
		tvSetProfilePhoto.setText(R.string.set_profile_photo);
		tvDelete.setOnClickListener(menuClickListener);
		tvSetProfilePhoto.setOnClickListener(menuClickListener);
		tvCancel.setOnClickListener(menuClickListener);
		menuDialog.setContentView(dialogview);
		if (!menuDialog.isShowing()) {
			menuDialog.show();
		}
	}

	Handler refreshImgHandler = new Handler() {
		public void handleMessage(android.os.Message msg) {
			ImageView iv = (ImageView) msg.obj;
			if (iv != null && photoOwner.getPrimaryPhotoPath().equals(iv.getTag())) {
				iv.setImageBitmap(photoOwner.getBitmap());
				iv.setTag(null);
			}
		};
	};
	
	private void loadUserProfilePhoto(){
	    Bitmap ownerPhotoBitmap = photoOwner.getSmallBitmap();
        if (ownerPhotoBitmap != null) {
            ivCurrentUserProfilePhoto.setImageBitmap(ownerPhotoBitmap);
            ivCurrentUserProfilePhoto.setTag(null);
        } else {
            ivCurrentUserProfilePhoto.setImageResource(R.drawable.profile_photo);
            ivCurrentUserProfilePhoto.setTag(photoOwner
                    .getSmallPhotoPath());
            photoOwner.getSmallPostBitmapAsync(
                    new MethodHandler<Bitmap>() {
                        public void process(Bitmap para) {
                            Message msg = refreshImgHandler.obtainMessage(
                                    index, ivCurrentUserProfilePhoto);
                            refreshImgHandler.sendMessage(msg);
                        }
                    });
        }
	}

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if(deletePhotoTask != null){
            deletePhotoTask.cancel(true);
            deletePhotoTask = null;
        }
        if(likePhotoTask != null){
            likePhotoTask.cancel(true);
            likePhotoTask = null;
        }
        if(setProfilePhotoTask != null){
            setProfilePhotoTask.cancel(true);
            setProfilePhotoTask = null;
        }
    }
  

    @Override
    public boolean onDown(MotionEvent e) {
        return false;
    }

    @Override
    public void onShowPress(MotionEvent e) {
        
    }

    @Override
    public boolean onSingleTapUp(MotionEvent e) {
        if(rlBottombar.getVisibility() == View.VISIBLE){
            rlBottombar.setVisibility(View.GONE);
            ivUserProfilePhotoLL.setVisibility(View.GONE);
        }else{
            rlBottombar.setVisibility(View.VISIBLE);
            ivUserProfilePhotoLL.setVisibility(View.VISIBLE);
        }
        return true;
    }

    @Override
    public boolean onScroll(MotionEvent e1, MotionEvent e2, float distanceX,
            float distanceY) {
        return false;
    }

    @Override
    public void onLongPress(MotionEvent e) {
        
    }

    @Override
    public boolean onFling(MotionEvent e1, MotionEvent e2, float velocityX,
            float velocityY) {
        return false;
    }


}
