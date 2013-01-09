package com.lingzhimobile.huodonghaowai.activity;

import java.io.File;
import java.io.IOException;
import java.util.Date;
import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.json.JSONException;
import org.json.JSONObject;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.Matrix;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.provider.MediaStore;
import android.text.TextUtils;
import android.view.View;
import android.view.View.OnClickListener;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.asynctask.PublishRenRenFeedTask;
import com.lingzhimobile.huodonghaowai.asynctask.RegisterTask;
import com.lingzhimobile.huodonghaowai.asynctask.UploadPhotoTask;
import com.lingzhimobile.huodonghaowai.cons.MessageID;
import com.lingzhimobile.huodonghaowai.cons.RenRenLibConst;
import com.lingzhimobile.huodonghaowai.cons.RequestCode;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.util.AppInfo;
import com.lingzhimobile.huodonghaowai.util.AppUtil;
import com.lingzhimobile.huodonghaowai.util.BitmapManager;
import com.lingzhimobile.huodonghaowai.util.FileManager;
import com.lingzhimobile.huodonghaowai.util.ImageLoadUtil;
import com.lingzhimobile.huodonghaowai.util.MethodHandler;
import com.lingzhimobile.huodonghaowai.view.ProvinceUniversePickerDialog;
import com.lingzhimobile.huodonghaowai.view.ProvinceUniversePickerDialog.MyCloseListener;
import com.lingzhimobile.huodonghaowai.view.myProgressDialog;
import com.renren.api.connect.android.Renren;
import com.umeng.analytics.MobclickAgent;

public class AskInfo extends HuoDongHaoWaiActivity {

    private static final String LocalLogTag = LogTag.ACTIVITY + " AskInfo";

    private String fromActivityFlag;
    private String renrenUserName;
    private String renrenSex;
    private String renrenHometown;
    private String renrenUnverseName;
    private String renrenHeadUrl;

    public String userName;
    public String userGender;
    private String email, password, userSchool, hometown;
    private String userId;

    private ImageView ivPickPhoto;
    private LinearLayout llPickPhoto;
    EditText nameEditText,  emailEditText, passwordEditText,
        hometownEditText;
    Button femaleButton, maleButton, enterButton,btnBack;
    private TextView schoolTextView,tvNewUser;

    private RegisterTask registerTask;
    private View.OnClickListener menuClickListener;
    private String photoName;
    private Dialog dialog;
    private Bitmap bm;
    private UploadPhotoTask uploadPhotoTask;
    private myProgressDialog mProgressDialog;

    public Handler myHandler = new Handler() {

        @Override
        public void handleMessage(Message msg) {
            if (AskInfo.this.isFinishing()) {
                return;
            }
            if (mProgressDialog!=null)
                mProgressDialog.dismiss();
            switch (msg.what) {
            case MessageID.SERVER_RETURN_NULL:
                if (msg.obj!=null)
                    AppUtil.handleErrorCode(msg.obj.toString(), AskInfo.this);
                break;
            case MessageID.REGISTER_Fail:
                if (msg.obj==null){
                    AppUtil.handleErrorCode(MessageID.SERVER_RETURN_NULL+"", AskInfo.this);
                }else{
                    LogUtils.Logd(LogTag.ACTIVITY, "AskInfo handleMessage msg.obj=" + msg.obj
                            + ", fromActivityFlag="+fromActivityFlag );
                    if ("21082".equals(msg.obj.toString())){//emailAlreadyRegistered
                        if(RequestCode.fromActivity_Login.equals(fromActivityFlag)){
                            //from register from renren
                            AppUtil.handleErrorCode("10021082", AskInfo.this);
                        }else{
                            AppUtil.handleErrorCode(msg.obj.toString(), AskInfo.this);
                        }
                    }else{
                        AppUtil.handleErrorCode(msg.obj.toString(), AskInfo.this);
                    }
                }
                break;
            case MessageID.REGISTER_OK:
                userId = (String)msg.obj;
                savePrefrerence();
                FileManager.init(AskInfo.this);
                String path = FileManager.UploadFolder.getAbsolutePath() + "/"
                        + "pretty_rich_android.jpg";
                // need to distinge each files to upload
                String pathWithTime = FileManager.UploadFolder
                        .getAbsolutePath()
                        + "/"
                        + "pretty_rich_android_"
                        + new Date().getTime() + ".jpg";
                BitmapManager.saveBitmap(bm, path);
                BitmapManager.saveBitmap(bm, pathWithTime);
                uploadPhotoTask = new UploadPhotoTask(
                         bm.getWidth(), bm.getHeight(), new File(
                                path), true,myHandler.obtainMessage());
                uploadPhotoTask.execute();
                setResult(MessageID.REGISTER_OK);

                if (RequestCode.fromActivity_Login.equals(fromActivityFlag)){
                    Bundle publishRenrenFeedData = new Bundle();
                    publishRenrenFeedData.putString("actionType", "Register");
                    Renren renren = AppInfo.getRenrenSdkInstanceForCurrentUser(AskInfo.this);//at this time, can use a strict get
                    PublishRenRenFeedTask publishRenRenFeedTask = new PublishRenRenFeedTask(publishRenrenFeedData,renren,AskInfo.this, null);//myHandler.obtainMessage());
                    publishRenRenFeedTask.execute();
                }

                finish();
                break;
            }
        }
    };

//    Handler getWebImageHandler = new Handler() {
//        @Override
//        public void handleMessage(android.os.Message msg) {
//
//        };
//    };

    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.askinfo);
        setView();
        setListener();
        setViewData();
    }

    void setViewData(){
        Intent intent1 = getIntent();

        if (intent1 != null){
            //LogUtils.Logd(LogTag.ACTIVITY, "AskInfo onCreate getIntent=" + intent1.toString());
            fromActivityFlag = intent1.getStringExtra(RequestCode.fromActivityField);
            renrenUserName = intent1.getStringExtra("renrenUserName");
            renrenSex = intent1.getStringExtra("renrenSex");
            renrenHometown = intent1.getStringExtra("renrenHometown");
            renrenUnverseName = intent1.getStringExtra("renrenUnverseName");
            renrenHeadUrl = intent1.getStringExtra("renrenHeadUrl");
            LogUtils.Logd(LogTag.ACTIVITY, "AskInfo onCreate UserName=" + renrenUserName
                    + ", Hometown="+renrenHometown  + ", UnverseName="+renrenUnverseName
                    + ", Sex="+renrenSex + ", HeadUrl="+renrenHeadUrl );
            if (!TextUtils.isEmpty(renrenHeadUrl) && !RenRenLibConst.DefaultMainHeadUrl.equals(renrenHeadUrl)){
                LogUtils.Logd(LogTag.ACTIVITY, "AskInfo setViewData begin ImageLoadUtil.readBitmapAsync");
                //http://oss.aliyuncs.com/ysf1/http://hdn.xnimg.cn/photos/hdn421/20130102/2115/h_main_BVuj_7b3e000064001375.jpg ..........
                // LoadImgThread.run ...... to be fix
                ImageLoadUtil.readBitmapAsync(renrenHeadUrl,
                        new MethodHandler<Bitmap>() {
                            @Override
                            public void process(Bitmap renrenHeadBmp) {
                                LogUtils.Logd(LogTag.ACTIVITY, "AskInfo setViewData, ImageLoadUtil.readBitmapAsync, process, renrenHeadBmp==null?="+(renrenHeadBmp==null));
//                                Message msg = getWebImageHandler.obtainMessage(0,renrenHeadBmp);
//                                getWebImageHandler.sendMessage(msg);
                                bm = renrenHeadBmp;
                                //ivPickPhoto.setImageBitmap(bm);//a exception sometimes occur: android.view.ViewRootImpl$CalledFromWrongThreadException: Only the original thread that created a view hierarchy can touch its views
                                runOnUiThread(new Runnable() {
                                    @Override
                                    public void run() {
                                        ivPickPhoto.setImageBitmap(bm);
                                    }
                                });
                            }
                        });
            }
        }
        if (!TextUtils.isEmpty(renrenUserName)) {
            nameEditText.setText(renrenUserName);
        }
        if (!TextUtils.isEmpty(renrenUnverseName)) {
            schoolTextView.setText(renrenUnverseName);
        }
        if (!TextUtils.isEmpty(renrenHometown)) {
            hometownEditText.setText(renrenHometown);
        }
        if ("1".equals(renrenSex)){
            maleButton.performClick();
        }else if ("0".equals(renrenSex)){
            femaleButton.performClick();
        }else{
            femaleButton.performClick();
        }

        //when go from PreLogin, clear renren auth for register the new user
        //LogUtils.Logd(LocalLogTag,"in setViewData end, fromActivityFlag="+fromActivityFlag);
        if (RequestCode.fromActivity_PreLogin.equals(fromActivityFlag)){
            AppInfo.clearRenrenAuthInfo(AskInfo.this);
        }else if(RequestCode.fromActivity_Login.equals(fromActivityFlag)){
            btnBack.setText(R.string.back);
            tvNewUser.setText(R.string.activiteAccount);
            enterButton.setText(R.string.activite);
        }
    }

    void setView() {
        tvNewUser = (TextView) findViewById(R.id.tvNewUser);
        nameEditText = (EditText) findViewById(R.id.nameEditText);
        emailEditText = (EditText) findViewById(R.id.emailEditText);
        schoolTextView = (TextView) findViewById(R.id.schoolTextView);
        passwordEditText = (EditText) findViewById(R.id.passwordEditText);
        hometownEditText = (EditText) findViewById(R.id.hometownEditText);
        femaleButton = (Button) findViewById(R.id.femaleButton);
        maleButton = (Button) findViewById(R.id.maleButton);
        enterButton = (Button) findViewById(R.id.enterButton);
        btnBack = (Button) findViewById(R.id.btnCancel);
        ivPickPhoto = (ImageView) findViewById(R.id.ivPickPhoto);
        llPickPhoto = (LinearLayout) findViewById(R.id.llPickPhoto);
        dialog = new Dialog(this, R.style.AlertDialog);
    }
    @Override
    protected void onPause() {
        super.onPause();
        MobclickAgent.onPause(this);
    }

    @Override
    protected void onResume() {
        super.onResume();
        MobclickAgent.onResume(this);
    }

    void setListener() {
        // InputFilter[] inputFilter = new InputFilter[1];
        // inputFilter[0] = new InputFilter(){
        //
        // @Override
        // public CharSequence filter(CharSequence source, int start, int end,
        // Spanned dest, int dstart, int dend) {
        // return source.toString().substring(source.length()-2).trim();
        // }
        //
        // };
        // nameEditText.setFilters(inputFilter);
        //
        btnBack.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                //when go to PreLogin, clear renren auth here
                if (RequestCode.fromActivity_PreLogin.equals(fromActivityFlag)){
                    AppInfo.clearRenrenAuthInfo(AskInfo.this);
                }
                if (mProgressDialog != null){
                    mProgressDialog.dismiss();
                    mProgressDialog.dismiss();
                }

                finish();
            }
        });

        maleButton.setOnClickListener(new OnClickListener() {

            @Override
            public void onClick(View v) {
                maleButton.requestFocus();
                userGender = "male";
            }
        });

        femaleButton.setOnClickListener(new OnClickListener() {

            @Override
            public void onClick(View v) {
                femaleButton.requestFocus();
                userGender = "female";
            }
        });

        enterButton.setOnClickListener(new OnClickListener() {

            @Override
            public void onClick(View arg0) {
                email = emailEditText.getText().toString();
                if (!checkEmail(email)) {
                    Toast.makeText(AskInfo.this, R.string.email_wrong,
                            Toast.LENGTH_SHORT).show();
                    return;
                }
                password = passwordEditText.getText().toString();
                if (TextUtils.isEmpty(password)) {
                    Toast.makeText(AskInfo.this, R.string.password_wrong,
                            Toast.LENGTH_SHORT).show();
                    return;
                }
                if (password.length() < 6) {
                    Toast.makeText(AskInfo.this, R.string.password_wrong,
                            Toast.LENGTH_SHORT).show();
                    return;
                }
                userName = nameEditText.getText().toString();
                if (userName == null || userName.equals("")) {
                    Toast.makeText(AskInfo.this, R.string.name_empty,
                            Toast.LENGTH_SHORT).show();
                    return;
                }
                userSchool = schoolTextView.getText().toString();
                if (TextUtils.isEmpty(userSchool)) {
                    Toast.makeText(AskInfo.this, R.string.school_empty,
                            Toast.LENGTH_SHORT).show();
                    return;
                }
                hometown = hometownEditText.getText().toString();
                if (TextUtils.isEmpty(hometown)) {
                    Toast.makeText(AskInfo.this, R.string.hometown_empty,
                            Toast.LENGTH_SHORT).show();
                    return;
                }
//                invitationCode = "";
//                invitationCode = invitationEditText.getText().toString();
//                if (TextUtils.isEmpty(invitationCode)) {
//                    Toast.makeText(AskInfo.this, R.string.invite_code_empty,
//                            Toast.LENGTH_SHORT).show();
//                    return;
//                }
                String accountRenRen = null;
                JSONObject renrenAuthObj = null;
                if (AppInfo.existRenrenAuthInfo(AskInfo.this)){
                    Renren renren = AppInfo.getNonEmptyRenrenSdkInstance(AskInfo.this);
                    String currentUid = renren.getCurrentUid()+"";
                    String sessionKey = renren.getSessionKey();
                    String accessToken = renren.getAccessToken();
                    String secret = renren.getSecret();
                    String expireTime = renren.getExpireTime()+"";
                    LogUtils.Logd(LogTag.ACTIVITY, "AskInfo.setViewData sessionKey=" + sessionKey
                        +" accessToken="+accessToken+" currentUid="+currentUid+" secret="+secret+" expireTime="+expireTime);
                    renrenAuthObj = new JSONObject();
                    try {
                        renrenAuthObj.put(RenRenLibConst.fieldcommon_session_userId, currentUid);
                        renrenAuthObj.put(RenRenLibConst.fieldcommon_session_key, sessionKey);
                        renrenAuthObj.put(RenRenLibConst.fieldcommon_access_token, accessToken);
                        renrenAuthObj.put(RenRenLibConst.fieldcommon_secret_key, secret);
                        renrenAuthObj.put(RenRenLibConst.fieldcommon_expiration_date, expireTime);
                    } catch (JSONException e) {
                        LogUtils.Loge(LogTag.ACTIVITY,e.getMessage(), e);
                        renrenAuthObj = null;
                    }
                    accountRenRen = currentUid;
                }

                if (bm == null) {
                    Toast.makeText(AskInfo.this, R.string.no_photo,Toast.LENGTH_SHORT).show();
                    return;
                }
                mProgressDialog = myProgressDialog.show(AskInfo.this, null, R.string.loading);
                registerTask = new RegisterTask(email, password, userName, userSchool, userGender, hometown,
                        accountRenRen, renrenAuthObj, myHandler.obtainMessage());
                registerTask.execute();
            }
        });

        menuClickListener = new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                int id = v.getId();
                switch (id) {
                case R.id.tvCancel:
                    dialog.cancel();
                    break;
                case R.id.tvNewDate:
                    // camera
                    StringBuffer sb = new StringBuffer();
                    for (int k = 0; k < 3; k++) {
                        sb.append(Integer.toHexString(new Random().nextInt()));
                    }
                    sb.append(".jpg");
                    photoName = FileManager.UploadFolder.getAbsolutePath()
                            + File.separator + sb.toString();
                    Intent i = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                    i.putExtra(MediaStore.EXTRA_OUTPUT, Uri.fromFile(new File(
                            FileManager.UploadFolder, sb.toString())));
                    try {
                        startActivityForResult(i, 3);
                    } catch (Exception e) {
                        LogUtils.Loge(LogTag.ACTIVITY, e.getMessage(), e);
                        Toast.makeText(AskInfo.this, R.string.no_camera_prompt,
                                Toast.LENGTH_SHORT).show();
                    }
                    dialog.dismiss();
                    break;
                case R.id.tvCurrentDate:
                    // gallery
                    Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                    intent.addCategory(Intent.CATEGORY_OPENABLE);
                    intent.setType("image/*");
                    startActivityForResult(Intent.createChooser(intent,
                            AskInfo.this.getString(R.string.photo_gallery)), 1);
                    dialog.dismiss();
                    break;
                }
            }
        };
        llPickPhoto.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                showMenuDialog();
            }
        });
        schoolTextView.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
//                userSchool = getResources()
//                        .getStringArray(
//                                R.array.school_values)[0];
//                AlertDialog dialog = new AlertDialog.Builder(AskInfo.this)
//                        .setTitle(R.string.school)
//                        .setSingleChoiceItems(R.array.school_values, 0,
//                                new DialogInterface.OnClickListener() {
//
//                                    @Override
//                                    public void onClick(DialogInterface dialog,
//                                            int which) {
//                                        userSchool = getResources()
//                                                .getStringArray(
//                                                        R.array.school_values)[which];
//                                    }
//                                })
//                        .setPositiveButton(R.string.OK,
//                                new DialogInterface.OnClickListener() {
//
//                                    @Override
//                                    public void onClick(DialogInterface dialog,
//                                            int which) {
//                                        schoolTextView
//                                                .setText(userSchool);
//                                    }
//                                }).setNegativeButton(R.string.Cancel, null)
//                        .create();
//                dialog.show();
                InputMethodManager m = (InputMethodManager) AskInfo.this.getSystemService(Context.INPUT_METHOD_SERVICE);
                m.hideSoftInputFromWindow(v.getApplicationWindowToken(), 0);
                MyCloseListener provUnvDialogCloseListener = new MyCloseListener(){
                    @Override
                    public void onOK(String prov, String unv){
                        if (!TextUtils.isEmpty(unv))
                            schoolTextView.setText(unv);
                    }
                    @Override
                    public void onCancel(){

                    }
                };
                ProvinceUniversePickerDialog provUnvDialog = new ProvinceUniversePickerDialog(
                        AskInfo.this, provUnvDialogCloseListener);
                if (!provUnvDialog.isShowing()) {
                    provUnvDialog.show();
                }
            }
        });//schoolTextView.setOnClickListener
    }

    protected void savePrefrerence() {
        AppInfo.clearUserInfo();
        AppInfo.userId = userId;
        AppInfo.userName = userName;
        AppInfo.gender = userGender;
        AppInfo.emailAccount = email;
        //AppInfo.userPhoto = userObj.optString("primaryPhotoPath");
        AppInfo.school = userSchool;
        AppInfo.hometown = hometown;
        AppInfo.accountRenRen = null;

        if (AppInfo.existRenrenAuthInfo(this)){
          //can not use getRenrenSdkInstanceForCurrentUser because renren.logout in this function according to conditions
            Renren renren = AppInfo.getNonEmptyRenrenSdkInstance(AskInfo.this);//just get
            String currentUid = renren.getCurrentUid()+"";
            AppInfo.accountRenRen = currentUid;
        }

        SharedPreferences userInfo = getSharedPreferences("UserInfo",
                Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = userInfo.edit();
        editor.putString("userId", AppInfo.userId);
        editor.putString("userName", userName);
        editor.putString("userGender", userGender);
        editor.putString("email", email);
        editor.putString("userSchool", userSchool);
        editor.putString("hometown", hometown);
        editor.putString("sessionToken", AppInfo.sessionToken);
        editor.putString("accountRenRen", AppInfo.accountRenRen);
        editor.commit();
    }


    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (registerTask != null) {
            registerTask.cancel(true);
            registerTask = null;
        }
    }

    public boolean checkEmail(String mail) {
        String regex = "\\w+([-+.]\\w*)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*";
        Pattern p = Pattern.compile(regex);
        Matcher m = p.matcher(mail);
        return m.find();
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        switch (requestCode) {
        case 10:
            AppUtil.openGPSSettings(this, myHandler.obtainMessage());
            break;
        case 1:
            if (data == null || data.getData() == null)
                return;

            Uri selectedImage = data.getData();
            String[] filePathColumn = { MediaStore.Images.Media.DATA };
            Cursor cursor = getContentResolver().query(selectedImage,
                    filePathColumn, null, null, null);
            cursor.moveToFirst();
            int columnIndex = cursor.getColumnIndex(filePathColumn[0]);
            String filePath = cursor.getString(columnIndex);
            cursor.close();
            bm = BitmapManager.getAppropriateBitmapFromFile(filePath);
            bm = modifyBitmap(filePath);
            ivPickPhoto.setImageBitmap(bm);

            break;
        case 3:
            if (resultCode == Activity.RESULT_OK) {
                try {
                    bm = BitmapManager.getAppropriateBitmapFromFile(photoName);
                } catch (OutOfMemoryError err) {
                    LogUtils.Logd(LogTag.DATABASE, err.getMessage(), err);
                }
                if (bm != null) {
                    bm = modifyBitmap(photoName);
                    ivPickPhoto.setImageBitmap(bm);
                }
            }
            break;
        }
    }

    private void showMenuDialog() {
        View dialogview = this.getLayoutInflater().inflate(
                R.layout.selectdatedialog, null);
        TextView tvCamera = (TextView) dialogview.findViewById(R.id.tvNewDate);
        TextView tvGallery = (TextView) dialogview
                .findViewById(R.id.tvCurrentDate);
        TextView tvCancel = (TextView) dialogview.findViewById(R.id.tvCancel);
        tvCamera.setText(R.string.camera);
        tvGallery.setText(R.string.Gallery);
        tvCamera.setOnClickListener(menuClickListener);
        tvGallery.setOnClickListener(menuClickListener);
        tvCancel.setOnClickListener(menuClickListener);
        if (!dialog.isShowing()) {
            dialog.setContentView(dialogview);
            dialog.show();
        }
    }

    private Bitmap modifyBitmap(String filePath) {
        int orientation = 1;
        try {
            orientation = new ExifInterface(filePath).getAttributeInt(
                    "Orientation", 1);
        } catch (IOException e) {
            e.printStackTrace();
        }
        LogUtils.Loge("Orientation", orientation + "");
        Matrix localMatrix = new Matrix();
        switch (orientation) {
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
        if (orientation == 3 || orientation == 6 || orientation == 8) {
            Bitmap temp = Bitmap.createBitmap(bm, 0, 0, bm.getWidth(),
                    bm.getHeight(), localMatrix, true);
            return temp;
        } else {
            return bm;
        }
    }

}
