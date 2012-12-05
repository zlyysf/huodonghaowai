package com.lingzhimobile.tongqu.activity;

import java.io.File;
import java.io.IOException;
import java.util.Date;
import java.util.Random;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.lingzhimobile.tongqu.R;
import com.lingzhimobile.tongqu.asynctask.RegisterTask;
import com.lingzhimobile.tongqu.asynctask.UploadPhotoTask;
import com.lingzhimobile.tongqu.cons.MessageID;
import com.lingzhimobile.tongqu.log.LogTag;
import com.lingzhimobile.tongqu.log.LogUtils;
import com.lingzhimobile.tongqu.util.AppInfo;
import com.lingzhimobile.tongqu.util.AppUtil;
import com.lingzhimobile.tongqu.util.BitmapManager;
import com.lingzhimobile.tongqu.util.FileManager;
import com.lingzhimobile.tongqu.view.myProgressDialog;
import com.umeng.analytics.MobclickAgent;

public class AskInfo extends TongQuActivity {

    public String userName;
    public String userGender;
    private String email, password, userSchool, invitationCode;
    private ImageView ivPickPhoto;
    private LinearLayout llPickPhoto;
    EditText nameEditText,  emailEditText, passwordEditText,
            invitationEditText;
    Button femaleButton, maleButton, enter,btnBack;
    private TextView schoolTextView;

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
            switch (msg.what) {
            case MessageID.SERVER_RETURN_NULL:
                mProgressDialog.dismiss();
                AppUtil.handleErrorCode(msg.obj.toString(), AskInfo.this);
                break;
            case MessageID.REGISTER_OK:
                mProgressDialog.dismiss();
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
                finish();
                break;
            }
        }

    };

    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.askinfo);
        setView();
        setListener();
        femaleButton.performClick();
    }

    void setView() {
        nameEditText = (EditText) findViewById(R.id.nameEditText);
        emailEditText = (EditText) findViewById(R.id.emailEditText);
        schoolTextView = (TextView) findViewById(R.id.schoolTextView);
        passwordEditText = (EditText) findViewById(R.id.passwordEditText);
        femaleButton = (Button) findViewById(R.id.femaleButton);
        invitationEditText = (EditText) findViewById(R.id.invitationEditText);
        maleButton = (Button) findViewById(R.id.maleButton);
        enter = (Button) findViewById(R.id.enterButton);
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

        enter.setOnClickListener(new OnClickListener() {

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
                invitationCode = invitationEditText.getText().toString();
                if (TextUtils.isEmpty(invitationCode)) {
                    Toast.makeText(AskInfo.this, R.string.invite_code_empty,
                            Toast.LENGTH_SHORT).show();
                    return;
                }
                if (bm == null) {
                    Toast.makeText(AskInfo.this, R.string.no_photo,
                            Toast.LENGTH_SHORT).show();
                    return;
                }
                mProgressDialog = myProgressDialog.show(AskInfo.this, null,
                        R.string.loading);
                registerTask = new RegisterTask(email, password, userName,
                        userSchool, userGender, invitationCode, myHandler.obtainMessage());
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
                userSchool = getResources()
                        .getStringArray(
                                R.array.school_values)[0];
                AlertDialog dialog = new AlertDialog.Builder(AskInfo.this)
                        .setTitle(R.string.school)
                        .setSingleChoiceItems(R.array.school_values, 0,
                                new DialogInterface.OnClickListener() {

                                    @Override
                                    public void onClick(DialogInterface dialog,
                                            int which) {
                                        userSchool = getResources()
                                                .getStringArray(
                                                        R.array.school_values)[which];
                                    }
                                })
                        .setPositiveButton(R.string.OK,
                                new DialogInterface.OnClickListener() {

                                    @Override
                                    public void onClick(DialogInterface dialog,
                                            int which) {
                                        schoolTextView
                                                .setText(userSchool);
                                    }
                                }).setNegativeButton(R.string.Cancel, null)
                        .create();
                dialog.show();

            }
        });
    }

    protected void savePrefrerence() {
        SharedPreferences userInfo = getSharedPreferences("UserInfo",
                Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = userInfo.edit();
        editor.putString("userName", userName);
        editor.putString("userId", AppInfo.userId);
        editor.putString("userGender", userGender);
        editor.putString("email", email);
        editor.putString("sessionToken", AppInfo.sessionToken);
        AppInfo.gender = userGender;
        editor.putString("userSchool", userSchool);
        editor.commit();
    }

    private String getUserId() {
        SharedPreferences userInfo = getSharedPreferences("UserInfo",
                Context.MODE_PRIVATE);
        return userInfo.getString("userId", "");
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
