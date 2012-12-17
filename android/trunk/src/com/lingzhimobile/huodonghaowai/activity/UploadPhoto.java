package com.lingzhimobile.huodonghaowai.activity;

import java.io.IOException;
import java.io.InputStream;
import java.util.Date;

import android.content.Intent;
import android.content.res.AssetManager;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.Bitmap.Config;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.View;
import android.widget.HorizontalScrollView;
import android.widget.ImageButton;
import android.widget.ImageView;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.util.BitmapManager;
import com.lingzhimobile.huodonghaowai.util.FileManager;

public class UploadPhoto extends HuoDongHaoWaiActivity {

    static final int MULTIPLY = 3;
    static final int OVERLAY = 4;
    static final int COLORDODGE = 5;
    static final int COLORBURN = 6;
    static final int LIGHTEN = 7;
    static final int UPLOAD = 100;
    
	private ImageView photo;
	private ImageView ivBack,ivFilter,ivCommit;
	private HorizontalScrollView hsvFilter;

	private Bitmap filteredBitmap;
	private Bitmap originalBitmap;
	
	// filters
	Config config = Config.ARGB_8888;//Config.RGB_565;

	ImageButton previousFilter;
    Bitmap mergeBmp;
    ImageButton reset,filter_black_white, filter4,  filter6,
             filter9, filter12,
            filter14, filter16;
    View.OnClickListener onclick;
    int width;
    int height;
    int[] merge;
    int[] result;
    int[] src;
    AssetManager localAssetManager;
	//end of filters
	
	private String photo_from_type;
	
	
	

	/** Called when the activity is first created. */
	@Override
	public void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.uploadphoto);
		photo = (ImageView) findViewById(R.id.ivUploadPhoto);
		photo_from_type = getIntent().getStringExtra("type");
		if("gallery".equals(photo_from_type)){
			Uri selectedImage = getIntent().getData();
            String[] filePathColumn = {MediaStore.Images.Media.DATA};
            Cursor cursor = getContentResolver().query(selectedImage, filePathColumn, null, null, null);
            cursor.moveToFirst();
            int columnIndex = cursor.getColumnIndex(filePathColumn[0]);
            String filePath = cursor.getString(columnIndex);
            cursor.close();
			originalBitmap = BitmapManager.getAppropriateBitmapFromFile(filePath);
			originalBitmap = modifyBitmap(filePath);
		}else{
			String photoName = getIntent().getStringExtra("name");
			try {
				originalBitmap = BitmapManager
						.getAppropriateBitmapFromFile(photoName);
			} catch (OutOfMemoryError err) {
				LogUtils.Logd(LogTag.DATABASE, err.getMessage(), err);
			}
			if (originalBitmap != null) {
				originalBitmap = modifyBitmap(photoName);
			}
		}
		filteredBitmap = originalBitmap;
		localAssetManager = getBaseContext().getAssets();
//		originalBitmap = AssertFile("originalimg/photo.png", localAssetManager);
		if(originalBitmap != null){
			photo.setImageBitmap(originalBitmap);
			width = originalBitmap.getWidth();
	        height = originalBitmap.getHeight();
	        // int[] dst = new int[width * height];
//	        merge = new int[width * height];
//	        result = new int[width * height];
	        src = new int[width * height];
		}else{
			finish();
			return;
		}
		ivCommit = (ImageView) findViewById(R.id.ivCommit);
		ivCommit.setOnClickListener(new View.OnClickListener() {

			@Override
			public void onClick(View v) {
				if (filteredBitmap == null)
					return;
				FileManager.init(UploadPhoto.this);
				String path = FileManager.UploadFolder.getAbsolutePath() + "/"
						+ "pretty_rich_android.jpg";
				// need to distinge each files to upload
                String pathWithTime = FileManager.UploadFolder.getAbsolutePath() + "/"
                + "pretty_rich_android_"+new Date().getTime()+".jpg";
				BitmapManager.saveBitmap(filteredBitmap, path);
				BitmapManager.saveBitmap(filteredBitmap, pathWithTime);
				
				Intent intent = new Intent();
				intent.setClass(UploadPhoto.this, Share.class);
				intent.putExtra("path", path);
				intent.putExtra("pathWithTime", pathWithTime);
				startActivityForResult(intent, UPLOAD);
			}
		});
		ivBack = (ImageView) findViewById(R.id.ivBack);
		ivBack.setOnClickListener(new View.OnClickListener() {
			
			@Override
			public void onClick(View v) {
				finish();
			}
		});
		hsvFilter = (HorizontalScrollView) findViewById(R.id.horizontalScrollView);
		ivFilter = (ImageView) findViewById(R.id.ivFilter);
		ivFilter.setOnClickListener(new View.OnClickListener() {
            
            @Override
            public void onClick(View v) {
                if(hsvFilter.getVisibility() == View.VISIBLE){
                    hsvFilter.setVisibility(View.INVISIBLE);
                    ivFilter.setImageResource(R.drawable.icon_show);
                }else{
                    hsvFilter.setVisibility(View.VISIBLE);
                    ivFilter.setImageResource(R.drawable.icon_hide);
                }
            }
        });
		
		reset= (ImageButton) findViewById(R.id.reset);
		previousFilter = reset;
		reset.setBackgroundResource(R.drawable.border);
		reset.setOnClickListener(new View.OnClickListener() {
            
            @Override
            public void onClick(View v) {
                photo.setImageBitmap(originalBitmap);
                filteredBitmap.recycle();
                filteredBitmap = originalBitmap;
                if (previousFilter == v)
                    return;
                if (previousFilter!=null){
                    previousFilter.setBackgroundResource(android.R.color.transparent);
                }
                v.setBackgroundResource(R.drawable.border);
                previousFilter = (ImageButton)v;
            }
        });

	      onclick = new View.OnClickListener() {
	            
	            @Override
	            public void onClick(View v) {
	                if (previousFilter == v)
	                    return;
	                if (previousFilter!=null){
	                    previousFilter.setBackgroundResource(android.R.color.transparent);
	                }
	                v.setBackgroundResource(R.drawable.border);
	                previousFilter = (ImageButton)v;
	                switch(v.getId()){
                    case R.id.filter4:
                        mergeBmp = AssertFile("filters/4.png", localAssetManager);
                        break;
                    case R.id.filter6:
                        mergeBmp = AssertFile("filters/6.png", localAssetManager);
                        break;
                    case R.id.filter9:
                        mergeBmp = AssertFile("filters/9.png", localAssetManager);
                        break;
                    case R.id.filter12:
                        mergeBmp = AssertFile("filters/12.png", localAssetManager);
                        break;
                    case R.id.filter14:
                        mergeBmp = AssertFile("filters/14.png", localAssetManager);
                        break;
                    case R.id.filter16:
                        mergeBmp = AssertFile("filters/16.png", localAssetManager);
                        break;
	                }
//                if (v.getId() == R.id.filter_black_white) {
//                    originalBitmap
//                            .getPixels(src, 0, width, 0, 0, width, height);
//                    int result[] = imageEngine.toHeibai(src, width,
//                            height);
//                    filteredBitmap = Bitmap.createBitmap(result, width, height,
//                            config);
//                    photo.setImageBitmap(filteredBitmap);
//                } else if (v.getId() == R.id.filter_fudiao) {
//                    originalBitmap
//                            .getPixels(src, 0, width, 0, 0, width, height);
//                    int result[] = imageEngine.toFudiao(src, width, height);
//                    filteredBitmap = Bitmap.createBitmap(result, width, height,
//                            config);
//                    photo.setImageBitmap(filteredBitmap);
//                } else if (v.getId() == R.id.filter_dipian) {
//                    originalBitmap
//                            .getPixels(src, 0, width, 0, 0, width, height);
//                    int result[] = imageEngine.toDipian(src, width, height);
//                    filteredBitmap = Bitmap.createBitmap(result, width, height,
//                            config);
//                    photo.setImageBitmap(filteredBitmap);
//                } else if (v.getId() == R.id.filter_sunshine) {
//                    originalBitmap
//                            .getPixels(src, 0, width, 0, 0, width, height);
//                    int result[] = imageEngine.toSunshine(src, width, height, width, width, width, 150);
////                    int result[] = imageEngine.toSunshine(src, width, height, width/2/*(photo.getRight()+photo.getLeft())/2*/, height/2/*(photo.getBottom()+photo.getTop())/2*/, width/4, 150);
//                    filteredBitmap = Bitmap.createBitmap(result, width, height,
//                            config);
//                    photo.setImageBitmap(filteredBitmap);
//                } else {
//                    if (merge == null){
//                        merge = new int[width * height];
//                    }
//                    float scaleWidth = ((float) width) / mergeBmp.getWidth();
//                    float scaleHeight = ((float) height) / mergeBmp.getHeight();
//                    Matrix matrix = new Matrix();
//                    matrix.postScale(scaleWidth, scaleHeight);
//                    Bitmap resizedBitmap = Bitmap.createBitmap(mergeBmp, 0, 0,
//                            mergeBmp.getWidth(), mergeBmp.getHeight(), matrix,
//                            true);
//                    resizedBitmap.getPixels(merge, 0, width, 0, 0, width,
//                            height);
//                    resizedBitmap.recycle();
//                    originalBitmap
//                            .getPixels(src, 0, width, 0, 0, width, height);
//                    int type = OVERLAY;
//                    if (v.getId() == R.id.filter14) {
//                        type = MULTIPLY;
//                    }
//                    int result[] = imageEngine.toMultiply(src, merge, width,
//                            height, type);
//                    filteredBitmap = Bitmap.createBitmap(result, width, height,
//                            config);
////                    originalBitmap.setPixels(result, 0, width, 0, 0, width, height);
////                    filteredBitmap = originalBitmap;
//                    photo.setImageBitmap(filteredBitmap);
//                }
	            }
	      };
		filter_black_white= (ImageButton) findViewById(R.id.filter_black_white);
		filter4= (ImageButton) findViewById(R.id.filter4);
        filter6= (ImageButton) findViewById(R.id.filter6);
        filter9= (ImageButton) findViewById(R.id.filter9);
        filter12= (ImageButton) findViewById(R.id.filter12);
        filter14= (ImageButton) findViewById(R.id.filter14);
        filter16= (ImageButton) findViewById(R.id.filter16);
		
        filter_black_white.setOnClickListener(onclick);
		filter4.setOnClickListener(onclick);
		filter6.setOnClickListener(onclick);
		filter9.setOnClickListener(onclick);
		filter12.setOnClickListener(onclick);
		filter14.setOnClickListener(onclick);
		filter16.setOnClickListener(onclick);
	}
	
    public Bitmap AssertFile(String paramString, AssetManager paramAssetManager) {
        InputStream localInputStream;
        Bitmap localObject3 = null;
        try {

            new StringBuilder("LoadAssertsPic path=").append(paramString)
                    .toString();
            localInputStream = paramAssetManager.open(paramString);
            localObject3 = BitmapFactory.decodeStream(localInputStream, null,
                    new BitmapFactory.Options());
        } catch (IOException localIOException2) {

        }
        return localObject3;
    }

    static {
        System.loadLibrary("JNITest");
    }
	
	private Bitmap modifyBitmap(String filePath){
			int orientation = 1;
			try {
				orientation = new ExifInterface(filePath).getAttributeInt("Orientation", 1);
			} catch (IOException e) {
				e.printStackTrace();
			}
			LogUtils.Loge("Orientation", orientation+"");
			Matrix localMatrix = new Matrix();
			switch(orientation){
			case 3:
				localMatrix.postRotate(180);
				break;
			case 6:
				localMatrix.postRotate(90);
				break;
			case 8:
				localMatrix.postRotate(270);
				break;
			}
			// avoid unnecessary API call
			if (orientation == 3 || orientation == 6 || orientation == 9) {
			    Bitmap temp = Bitmap.createBitmap(originalBitmap, 0, 0, originalBitmap.getWidth(),
			            originalBitmap.getHeight(), localMatrix, true);
			    return temp;
			} else {
			    return originalBitmap;
			}
		}

    @Override
    protected void onDestroy() {
        super.onDestroy();
		// do not cancel the task now
//        if(uploadPhotoTask != null){
//            uploadPhotoTask.cancel(true);
//            uploadPhotoTask = null;
//        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if(requestCode == UPLOAD && resultCode == UPLOAD){
            setResult(11);
            finish();
        }
    }



}
