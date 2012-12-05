package com.lingzhimobile.tongqu.activity;

import java.io.ByteArrayOutputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.MalformedURLException;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.view.View;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.CompoundButton;
import android.widget.CompoundButton.OnCheckedChangeListener;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.Toast;

import com.facebook.android.AsyncFacebookRunner;
import com.facebook.android.AsyncFacebookRunner.RequestListener;
import com.facebook.android.DialogError;
import com.facebook.android.Facebook;
import com.facebook.android.Facebook.DialogListener;
import com.facebook.android.FacebookError;
import com.lingzhimobile.tongqu.R;
import com.lingzhimobile.tongqu.asynctask.UploadPhotoTask;
import com.lingzhimobile.tongqu.cons.MessageID;
import com.lingzhimobile.tongqu.log.LogUtils;
import com.lingzhimobile.tongqu.model.PhotoItem;
import com.lingzhimobile.tongqu.util.AppUtil;
import com.lingzhimobile.tongqu.util.GlobalValue;
import com.lingzhimobile.tongqu.util.SessionStore;
import com.weibo.net.AccessToken;
import com.weibo.net.AsyncWeiboRunner;
import com.weibo.net.Utility;
import com.weibo.net.Weibo;
import com.weibo.net.WeiboDialogListener;
import com.weibo.net.WeiboException;
import com.weibo.net.WeiboParameters;

public class Share extends Activity {
    final int AUTHORIZE_ACTIVITY_RESULT_CODE = 100;
    static final int UPLOAD = 100;
    private Button btnUpload;
    private ImageView ivCancel;
    private LinearLayout llFacebook,llSinaWeibo;
    private CheckBox cbFacebook,cbSinaWeibo;
    private Bitmap bm;
    private String photoPath;
    private String photoPathWithTime;
    private byte[] bMapArray;
    String[] permissions = { "offline_access", "publish_stream", "user_photos",
            "publish_checkins", "photo_upload" };

    private UploadPhotoTask uploadPhotoTask;
    Weibo weibo;

    public Handler myHandler = new Handler() {
        @Override
        public void handleMessage(Message msg) {
            super.handleMessage(msg);
            switch (msg.what) {
            case MessageID.SERVER_RETURN_NULL:
                AppUtil.handleErrorCode(msg.obj.toString(), Share.this);
                break;
            case MessageID.UPLOAD_PHOTO_OK:
                Bundle data = msg.getData();
                String pathWithTime = data.getString("pathWithTime");
                String photoId = data.getString("photoId");
                String feedId = data.getString("feedId");
                PhotoItem quickUploadedPhoto = GlobalValue.cachedQuickUploadedPhoto
                        .get(pathWithTime);
                if (quickUploadedPhoto != null) {
                    quickUploadedPhoto.setPhotoId(photoId);
                    quickUploadedPhoto.setFeedId(feedId);
                    quickUploadedPhoto.isFaked = false;
                    GlobalValue.cachedQuickUploadedPhoto.remove(pathWithTime);
                }
                break;
            case MessageID.UPLOAD_PHOTO_QUICK_RETURN:
                boolean flag = (Boolean) msg.obj;
                data = msg.getData();
                // generate a faked photo item
                PhotoItem uploadedPhoto = new PhotoItem();
                uploadedPhoto.isFaked = true;
                uploadedPhoto.setHeight(data.getInt("height"));
                uploadedPhoto.setWidth(data.getInt("width"));
                // use same file for fixed-width image, and the full sized image
                uploadedPhoto.setFixPhotoPath(data.getString("filename"));
                uploadedPhoto.setPhotoPath(data.getString("filename"));
                GlobalValue.cachedQuickUploadedPhoto.put(
                        data.getString("filename"), uploadedPhoto);
//                if (Profile.instance != null) {
//                    // add this faked item as the first one
//                    Profile.instance.userPhotos.add(0, uploadedPhoto);
//                    Profile.instance.fakePhoto = true;
//                }
                break;

            }

        }
    };

    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.share);
        photoPath = getIntent().getStringExtra("path");
        photoPathWithTime = getIntent().getStringExtra("pathWithTime");
        bm = BitmapFactory.decodeFile(photoPath);
        if (bm != null) {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            bm.compress(Bitmap.CompressFormat.JPEG, 100, baos);
            bMapArray = baos.toByteArray();
        }
        btnUpload = (Button) findViewById(R.id.btnUpload);
        ivCancel = (ImageView) findViewById(R.id.ivCancel);
        cbFacebook = (CheckBox) findViewById(R.id.cbFacebook);
        llFacebook = (LinearLayout) findViewById(R.id.llFacebook);
        llSinaWeibo = (LinearLayout) findViewById(R.id.llSinaWeibo);
        cbSinaWeibo = (CheckBox) findViewById(R.id.cbSinaWeibo);
        if (!AppUtil.facebook.isSessionValid()) {
            cbFacebook.setChecked(false);
        }
        weibo = Weibo.getInstance();
        if(!weibo.isSessionValid()){
            cbSinaWeibo.setChecked(false);
        }
        btnUpload.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                if (cbFacebook.isChecked()) {
                    if (AppUtil.facebook.isSessionValid()) {
                        if (bMapArray == null) {
                            return;
                        }
                        Bundle params = new Bundle();
                        params.putByteArray("photo", bMapArray);
                        AppUtil.mAsyncRunner = new AsyncFacebookRunner(
                                AppUtil.facebook);
                        AppUtil.mAsyncRunner.request("me/photos", params,
                                "POST", new RequestListener() {

                                    @Override
                                    public void onComplete(String response,
                                            Object state) {
                                        LogUtils.Logd("Facebook_PrettyRich_Share", response);

                                    }

                                    @Override
                                    public void onIOException(IOException e,
                                            Object state) {
                                        // TODO Auto-generated method stub
                                        LogUtils.Loge("Facebook_PrettyRich_Share", e.getMessage(), e);
                                    }

                                    @Override
                                    public void onFileNotFoundException(
                                            FileNotFoundException e,
                                            Object state) {
                                        // TODO Auto-generated method stub
                                        LogUtils.Loge("Facebook_PrettyRich_Share", e.getMessage(), e);
                                    }

                                    @Override
                                    public void onMalformedURLException(
                                            MalformedURLException e,
                                            Object state) {
                                        // TODO Auto-generated method stub
                                        LogUtils.Loge("Facebook_PrettyRich_Share", e.getMessage(), e);
                                    }

                                    @Override
                                    public void onFacebookError(
                                            FacebookError e, Object state) {
                                        // TODO Auto-generated method stub
                                        LogUtils.Loge("Facebook_PrettyRich_Share", e.getMessage(), e);
                                    }
                                }, null);
                    }
                }
                if(cbSinaWeibo.isChecked()){
                    if(weibo.isSessionValid()){
                        
                        WeiboParameters bundle = new WeiboParameters();
                        bundle.add("source", weibo.getAppKey());
                        bundle.add("pic", photoPath);
                        bundle.add("status", "test");
                        String url = Weibo.SERVER + "statuses/upload.json";
                        AsyncWeiboRunner weiboRunner = new AsyncWeiboRunner(weibo);
                        weiboRunner.request(Share.this, url, bundle, Utility.HTTPMETHOD_POST, new com.weibo.net.AsyncWeiboRunner.RequestListener(){

                            @Override
                            public void onComplete(String response) {
                                LogUtils.Logd("SinaWeibo_PrettyRich_Share", response);
                            }

                            @Override
                            public void onIOException(IOException e) {
                                LogUtils.Logd("SinaWeibo_PrettyRich_Share", e.getMessage(), e);
                            }

                            @Override
                            public void onError(WeiboException e) {
                                LogUtils.Logd("SinaWeibo_PrettyRich_Share", e.getMessage(), e);
                                LogUtils.Logd("SinaWeibo_PrettyRich_Share", e.getStatusCode()+"", e);
                            }

                          });
                    }
                }
//                uploadPhotoTask = new UploadPhotoTask(AppInfo.userId,
//                        photoPathWithTime, bm.getWidth(), bm.getHeight(),
//                        new File(photoPath), myHandler.obtainMessage());
//                uploadPhotoTask.execute();
                Message msg = myHandler.obtainMessage(
                        MessageID.UPLOAD_PHOTO_QUICK_RETURN, false);
                Bundle data = new Bundle();
                data.putInt("width", bm.getWidth());
                data.putInt("height", bm.getHeight());
                data.putString("filename", photoPathWithTime);
                msg.setData(data);
                msg.sendToTarget();
                setResult(UPLOAD);
                finish();
            }
        });
        ivCancel.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                finish();

            }
        });
        cbFacebook.setOnCheckedChangeListener(new OnCheckedChangeListener() {

            @Override
            public void onCheckedChanged(CompoundButton buttonView,
                    boolean isChecked) {
                if (isChecked) {
                    if(AppUtil.facebook ==null){
                        AppUtil.facebook = new Facebook(MainTabActivity.APP_ID);
                    }
                    if (!AppUtil.facebook.isSessionValid()) {
                        AppUtil.facebook.authorize(Share.this, permissions,
                                AUTHORIZE_ACTIVITY_RESULT_CODE,
                                new DialogListener() {
                                    @Override
                                    public void onComplete(Bundle values) {
                                        SessionStore.saveFacebook(AppUtil.facebook,
                                                Share.this);
                                    }

                                    @Override
                                    public void onCancel() {
                                        LogUtils.Logi("FB", "cancel");
                                    }

                                    @Override
                                    public void onFacebookError(FacebookError e) {
                                        // TODO Auto-generated method stub
                                        LogUtils.Logi("FB", e.getMessage());
                                    }

                                    @Override
                                    public void onError(DialogError e) {
                                        // TODO Auto-generated method stub
                                        LogUtils.Logi("FB", e.getMessage());
                                    }
                                });
                    }
                }

            }
        });
        cbSinaWeibo.setOnCheckedChangeListener(new OnCheckedChangeListener() {
            
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if(isChecked){
                    if(!weibo.isSessionValid()){
                        weibo.setupConsumerConfig(GlobalValue.CONSUMER_KEY,
                                GlobalValue.CONSUMER_SECRET);
                        weibo.setRedirectUrl(GlobalValue.REDIRECT_RUL);
                        weibo.authorize(Share.this, new AuthDialogListener());
                    }
                }
            }
        });
        llFacebook.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                if (cbFacebook.isChecked()) {
                    cbFacebook.setChecked(false);
                } else {
                    cbFacebook.setChecked(true);
                }
            }
        });
        llSinaWeibo.setOnClickListener(new View.OnClickListener() {
            
            @Override
            public void onClick(View v) {
                if (cbSinaWeibo.isChecked()) {
                    cbSinaWeibo.setChecked(false);
                } else {
                    cbSinaWeibo.setChecked(true);
                }
            }
        });
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == AUTHORIZE_ACTIVITY_RESULT_CODE) {
            AppUtil.facebook.authorizeCallback(requestCode, resultCode, data);
        }
    }
    
    class AuthDialogListener implements WeiboDialogListener {

        @Override
        public void onComplete(Bundle values) {
            String token = values.getString("access_token");
            String expires_in = values.getString("expires_in");
            AccessToken accessToken = new AccessToken(token, GlobalValue.CONSUMER_SECRET);
            accessToken.setExpiresIn(expires_in);
            Weibo.getInstance().setAccessToken(accessToken);
            SessionStore.saveSinaWeibo(Weibo.getInstance(), Share.this);
        }


        @Override
        public void onCancel() {
            Toast.makeText(getApplicationContext(), "Auth cancel",
                    Toast.LENGTH_SHORT).show();
        }

        @Override
        public void onWeiboException(WeiboException e) {
            Toast.makeText(getApplicationContext(),
                    "Auth exception : " + e.getMessage(), Toast.LENGTH_SHORT)
                    .show();
        }

        @Override
        public void onError(com.weibo.net.DialogError e) {
            
        }

    }

}
