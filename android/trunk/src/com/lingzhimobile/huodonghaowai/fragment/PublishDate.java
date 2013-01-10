package com.lingzhimobile.huodonghaowai.fragment;

import java.io.File;
import java.io.IOException;
import java.util.Calendar;
import java.util.Date;
import java.util.Random;

import org.json.JSONException;
import org.json.JSONObject;

import android.R.integer;
import android.app.Activity;
import android.app.AlertDialog;
import android.app.Dialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.provider.MediaStore;
import android.support.v4.app.Fragment;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.AccelerateInterpolator;
import android.view.animation.Animation;
import android.view.animation.DecelerateInterpolator;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.CompoundButton;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RadioButton;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.activity.Login;
import com.lingzhimobile.huodonghaowai.activity.Settings;
import com.lingzhimobile.huodonghaowai.asynctask.Bind3rdPartAccountTask;
import com.lingzhimobile.huodonghaowai.asynctask.CreateDateTask;
import com.lingzhimobile.huodonghaowai.asynctask.PublishRenRenFeedTask;
import com.lingzhimobile.huodonghaowai.cons.MessageID;
import com.lingzhimobile.huodonghaowai.cons.RenRenLibConst;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.util.AppInfo;
import com.lingzhimobile.huodonghaowai.util.AppUtil;
import com.lingzhimobile.huodonghaowai.util.BitmapManager;
import com.lingzhimobile.huodonghaowai.util.DateTimeUtil;
import com.lingzhimobile.huodonghaowai.util.FileManager;
import com.lingzhimobile.huodonghaowai.util.GlobalValue;
import com.lingzhimobile.huodonghaowai.view.CustomizeDatePickerDialog;
import com.lingzhimobile.huodonghaowai.view.Rotate3dAnimation;
import com.lingzhimobile.huodonghaowai.view.myProgressDialog;
import com.lingzhimobile.huodonghaowai.view.CustomizeDatePickerDialog.OnCustomizeDateSetListener;
import com.renren.api.connect.android.Renren;
import com.renren.api.connect.android.exception.RenrenAuthError;
import com.renren.api.connect.android.view.RenrenAuthListener;
import com.umeng.analytics.MobclickAgent;

public class PublishDate extends Fragment {
    private final int TYPE_EDIT = 10;
    private final int TYPE_VIEW = 11;
    private int mCurrentType = 10;

    private static final String LocalLogTag = LogTag.ACTIVITY + " PublishDate";

    private Activity myAcitivity;
    private View currentView;

    private Calendar calendar;
    private TextView timeTextView, tvDatePhoto;
    private EditText dateDetail, dateTitle, wantPersonCount, existPersonCount,
            dateAddress;
    private OnCustomizeDateSetListener mDateSetListener;
    private Button btnPreview, btnSend, btnCancel;
    private RadioButton rbAA, rbMytreat, rbNone;
    private LinearLayout publishToRenRenLayout;
    private CheckBox cbPublishToRenRen;
    private int whoPay;
    private InputMethodManager m;
    private CreateDateTask createDateTask;

    private String filePath;
    private Bitmap originalBitmap;
    private Dialog dialog;
    private Dialog dialogAskBindWithRenren;
    private View.OnClickListener menuClickListener;

    private ViewGroup mContainer;
    private RelativeLayout rlDateEdit;
    private RelativeLayout rlDatePreview;

    private ImageView ivPreDatePhoto;
    private ImageView ivDatePhoto;
    private TextView tvPreTitle, tvPreAddress, tvPreTime, tvPrePersonNum,
            tvPreTreat, tvPreDetail;

    private myProgressDialog mProgressDialog;
    private myProgressDialog prgressDialog;
    private final int[] datePhotoIds = { R.drawable.date_pre_bg1,
            R.drawable.date_pre_bg2, R.drawable.date_pre_bg3,
            R.drawable.date_pre_bg4, R.drawable.date_pre_bg5,
            R.drawable.date_pre_bg6, R.drawable.date_pre_bg7,
            R.drawable.date_pre_bg8, R.drawable.date_pre_bg9,
            R.drawable.date_pre_bg10};

    private TextView tvTitle;



    public Handler myHandler = new Handler() {
        @Override
        public void handleMessage(Message msg) {
            super.handleMessage(msg);
            if(myAcitivity.isFinishing()){
                return;
            }
            if (mProgressDialog != null) {
                mProgressDialog.dismiss();
            }
            if (prgressDialog!=null){
                prgressDialog.dismiss();
            }
            switch (msg.what) {
            case MessageID.SERVER_RETURN_NULL:
                if (msg.obj!=null)
                    AppUtil.handleErrorCode(msg.obj.toString(), myAcitivity);
                btnSend.setEnabled(true);
                break;
            case MessageID.CREATE_DATE_OK:
                String dateId = msg.obj.toString();
                btnCancel.performClick();
                break;
            case MessageID.GET_LOCATION_FAIL:
                AppUtil.showErrToast(myAcitivity,
                        R.string.failed_retreive_location_alert,
                        Toast.LENGTH_SHORT);
                break;
            case MessageID.Bind3rdPartAccount_OK:
              //run to here, user info and renren auth info should already match because something done in Bind3rdPartAccountTask
                Renren renren = AppInfo.getRenrenSdkInstanceForCurrentUser(myAcitivity);
                LogUtils.Logd(LocalLogTag,"PublishDate, Bind3rdPartAccount_OK"+", getCurrentUid()="+renren.getCurrentUid()+", userId="+AppInfo.userId+", accountRenRen="+AppInfo.accountRenRen);
                break;
            case MessageID.Bind3rdPartAccount_FAIL:
                if (msg.obj!=null){
                    int errCode = ((Integer)msg.obj).intValue();
                    if (errCode == 21301){//userAlreadyBindThisRenRenAccount

                    }else if (errCode == 21304){//theRenRenAccountAlreadyBindOtherUser
                        cbPublishToRenRen.setChecked(false);
                        AppInfo.clearRenrenAuthInfo(myAcitivity);
                        AppUtil.handleErrorCode(msg.obj.toString(), myAcitivity);
                    }else{
                      //not clear renren auth info in AppInfo, let it be done in get
                        cbPublishToRenRen.setChecked(false);
                        AppUtil.handleErrorCode(msg.obj.toString(), myAcitivity);
                    }
                }
                break;
            case MessageID.RENRENSDK_publishFeed_Error:
                AppUtil.handleErrorCode("110000", myAcitivity);
                break;
            case MessageID.RENRENSDK_publishFeed_Fault:
              //not clear renren auth info in AppInfo, let it be done in get
                AppUtil.handleErrorCode("110001", myAcitivity);
                break;
            }

        }
    };

    public static PublishDate newInstance(int position) {
        PublishDate f = new PublishDate();
        Bundle args = new Bundle();
        args.putInt("position", position);
        f.setArguments(args);

        return f;
    }

    @Override
    public void onAttach(Activity activity) {
        super.onAttach(activity);
        this.myAcitivity = activity;
    }

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container,
            Bundle savedInstanceState) {
        currentView = inflater.inflate(R.layout.proposedate, container, false);

        initView();
        initData();
        return currentView;
    }

    private void initView() {
        m = (InputMethodManager) myAcitivity
                .getSystemService(Context.INPUT_METHOD_SERVICE);
        dialog = new Dialog(myAcitivity, R.style.AlertDialog);
        dialogAskBindWithRenren = new Dialog(myAcitivity, R.style.AlertDialog);
        timeTextView = (TextView) currentView.findViewById(R.id.timeTextView);
        calendar = DateTimeUtil.getNextSlot(myAcitivity);
        timeTextView.setText(DateTimeUtil.getNextSlotInString(myAcitivity,
                calendar));
        wantPersonCount = (EditText) currentView
                .findViewById(R.id.wantPersonCountEditText);
        existPersonCount = (EditText) currentView
                .findViewById(R.id.existPersonCountEditText);
        dateAddress = (EditText) currentView.findViewById(R.id.localEditText);
        // dateAddress.requestFocus();
        btnPreview = (Button) currentView.findViewById(R.id.btnPreview);
        btnCancel = (Button) currentView.findViewById(R.id.btnCancel);
        dateDetail = (EditText) currentView
                .findViewById(R.id.detailPlanEditText);
        dateTitle = (EditText) currentView.findViewById(R.id.dateTitleEditText);
        int position = getArguments().getInt("position", 0);
        if (position != 0) {
            dateTitle.setText(GlobalValue.dateTitleList.get(position)
                    .getDetail());
        }
        tvDatePhoto = (TextView) currentView.findViewById(R.id.tvDatePhoto);
        rbAA = (RadioButton) currentView.findViewById(R.id.rbAA);
        rbMytreat = (RadioButton) currentView.findViewById(R.id.rbMyTreat);
        rbNone = (RadioButton) currentView.findViewById(R.id.rbNone);
        btnSend = (Button) currentView.findViewById(R.id.sendButton);
        mContainer = (ViewGroup) currentView.findViewById(R.id.container);
        rlDateEdit = (RelativeLayout) currentView.findViewById(R.id.rlEditDate);
        rlDatePreview = (RelativeLayout) currentView
                .findViewById(R.id.rlDatePreview);
        mContainer
                .setPersistentDrawingCache(ViewGroup.PERSISTENT_ANIMATION_CACHE);
        ivPreDatePhoto = (ImageView) currentView
                .findViewById(R.id.ivPreDatePhoto);
        ivDatePhoto = (ImageView) currentView.findViewById(R.id.ivDatePhoto);
        tvPreAddress = (TextView) currentView
                .findViewById(R.id.tvDateLocationInfo);
        tvPreTitle = (TextView) currentView.findViewById(R.id.tvDateTitle);
        tvPreDetail = (TextView) currentView.findViewById(R.id.tvDateBodyInfo);
        tvPrePersonNum = (TextView) currentView
                .findViewById(R.id.tvDatePersonNum);
        tvPreTreat = (TextView) currentView.findViewById(R.id.tvDateWhoPay);
        tvPreTime = (TextView) currentView.findViewById(R.id.tvDateTimeInfo);
        tvTitle = (TextView) currentView.findViewById(R.id.tvTitle);
        tvTitle.requestFocus();

        publishToRenRenLayout = (LinearLayout)currentView.findViewById(R.id.publishToRenRenLayout);
        cbPublishToRenRen = (CheckBox) currentView.findViewById(R.id.cbPublishToRenRen);
    }

    private void initData() {
        // dateAddress.setOnClickListener(new View.OnClickListener() {
        //
        // @Override
        // public void onClick(View v) {
        // m.toggleSoftInput(0, InputMethodManager.HIDE_NOT_ALWAYS);
        // }
        // });
        mDateSetListener = new CustomizeDatePickerDialog.OnCustomizeDateSetListener() {

            @Override
            public void onDateSet(String monthOfYear, String dayOfMonth,
                    String hour) {
                calendar.set(Calendar.MONTH, Integer.parseInt(monthOfYear));
                calendar.set(Calendar.DAY_OF_MONTH,
                        Integer.parseInt(dayOfMonth));
                calendar.set(Calendar.HOUR_OF_DAY, Integer.parseInt(hour)/2);
                if(Integer.parseInt(hour)%2 != 0){
                    calendar.set(Calendar.MINUTE, 30);
                }else{
                    calendar.set(Calendar.MINUTE, 0);
                }
                timeTextView.setText(DateTimeUtil.getNextSlotInString(
                        myAcitivity, calendar));
            }
        };
        timeTextView.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                m.hideSoftInputFromWindow(v.getApplicationWindowToken(), 0);
                CustomizeDatePickerDialog cd = new CustomizeDatePickerDialog(
                        myAcitivity, mDateSetListener, calendar);
                if (!cd.isShowing()) {
                    cd.show();
                }
            }
        });
        btnCancel.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                getFragmentManager().popBackStack();
            }
        });
        rbAA.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                whoPay = 2;
                tvPreTreat.setText(R.string.aa);
            }
        });
        rbAA.performClick();
        rbMytreat.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                whoPay = 0;
                tvPreTreat.setText(R.string.my_treat);
            }
        });
        rbNone.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                whoPay = 3;
                tvPreTreat.setText(R.string.free);
            }
        });
        tvDatePhoto.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                showMenuDialog();
            }
        });
        ivDatePhoto.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                showMenuDialog();
            }
        });
        btnPreview.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                if (mCurrentType == TYPE_EDIT) {
                    initPreviewData();
                    applyRotation(TYPE_EDIT, 0, -90);
                    mCurrentType = TYPE_VIEW;
                    btnPreview.setText(R.string.edit);
                } else {
                    applyRotation(TYPE_VIEW, 0, 90);
                    mCurrentType = TYPE_EDIT;
                    btnPreview.setText(R.string.preview);
                }
            }
        });

        publishToRenRenLayout.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                boolean checked = cbPublishToRenRen.isChecked();
                LogUtils.Logd(LocalLogTag, "publishToRenRenLayout onClick, checked=" + checked);
                cbPublishToRenRen.setChecked(!checked);
            }
        });

        boolean canDefaultPublishToRenren = existRenrenAuthInfoForCurrentUser();
        cbPublishToRenRen.setChecked(canDefaultPublishToRenren);

        cbPublishToRenRen.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {

            public void showChangeBindDialog() {
                View dialogview = myAcitivity.getLayoutInflater().inflate(R.layout.spendcreditsdialog, null);
                TextView tvNotify = (TextView) dialogview.findViewById(R.id.tvNotifyText);
                Button btnOK = (Button) dialogview.findViewById(R.id.btnOk);
                Button btnCancel = (Button) dialogview.findViewById(R.id.btnCancel);
                tvNotify.setText(R.string.to_bind_renren_alert);
                btnOK.setText(R.string.bindNow);
                btnCancel.setText(R.string.notBindNow);

                btnOK.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        dialogAskBindWithRenren.dismiss();
                        final RenrenAuthListener rrAuthlistener = new RenrenAuthListener() {
                            @Override
                            public void onComplete(Bundle values) {
                                LogUtils.Logd(LogTag.RENREN, "RenrenAuthListener.onComplete values=" + values.toString());
                              //can not use getRenrenSdkInstanceForCurrentUser because renren.logout in this function according to not-yet sync data
                                Renren renren = AppInfo.getNonEmptyRenrenSdkInstance(myAcitivity);//just get existing renren instance
                                LogUtils.Logd(LocalLogTag,"PublishDate, RenrenAuthListener.onComplete"+", getCurrentUid()="+renren.getCurrentUid()+", userId="+AppInfo.userId+", accountRenRen="+AppInfo.accountRenRen);
                                String currentUid = renren.getCurrentUid()+"";
                                String sessionKey = renren.getSessionKey();
                                String accessToken = renren.getAccessToken();
                                String secret = renren.getSecret();
                                String expireTime = renren.getExpireTime()+"";
                                JSONObject renrenAuthObj = new JSONObject();
                                try {
                                    renrenAuthObj.put(RenRenLibConst.fieldcommon_session_userId, currentUid);
                                    renrenAuthObj.put(RenRenLibConst.fieldcommon_session_key, sessionKey);
                                    renrenAuthObj.put(RenRenLibConst.fieldcommon_access_token, accessToken);
                                    renrenAuthObj.put(RenRenLibConst.fieldcommon_secret_key, secret);
                                    renrenAuthObj.put(RenRenLibConst.fieldcommon_expiration_date, expireTime);
                                } catch (JSONException e) {
                                    LogUtils.Loge(LogTag.RENREN,e.getMessage(), e);
                                    renrenAuthObj = null;
                                }
                                Bind3rdPartAccountTask bind3rdPartAccountTask = new Bind3rdPartAccountTask(AppInfo.userId, currentUid,renrenAuthObj, myHandler.obtainMessage());
                                bind3rdPartAccountTask.execute();
                                prgressDialog = myProgressDialog.show(myAcitivity, null, R.string.loading);
                            }

                            @Override
                            public void onRenrenAuthError(RenrenAuthError renrenAuthError) {
                                renrenAuthError.printStackTrace();
                                LogUtils.Loge(LogTag.RENREN, "onRenrenAuthError err=" + renrenAuthError.toString());
                                myAcitivity.runOnUiThread(new Runnable() {
                                    @Override
                                    public void run() {
                                        Toast.makeText(myAcitivity, "renren auth failed",Toast.LENGTH_SHORT).show();
                                    }
                                });
                                return;
                            }

                            @Override
                            public void onCancelLogin() {
                                cbPublishToRenRen.setChecked(false);
                            }

                            @Override
                            public void onCancelAuth(Bundle values) {
                                cbPublishToRenRen.setChecked(false);
                            }
                        };//rrAuthlistener
                        Renren renren = AppInfo.getRenrenSdkInstanceAtMostPossibleMatchUser(myAcitivity);//if renren auth info exist but not match current user, should be clear and this is done in the get function.
                        LogUtils.Logd(LocalLogTag,"PublishDate, before renren.authorize"+", getCurrentUid()="+renren.getCurrentUid()+", userId="+AppInfo.userId+", accountRenRen="+AppInfo.accountRenRen);
                        renren.authorize(myAcitivity, rrAuthlistener);
                    }//onClick
                });//btnOK.setOnClickListener
                btnCancel.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        dialogAskBindWithRenren.dismiss();
                        cbPublishToRenRen.setChecked(false);
                    }
                });
                if (!dialogAskBindWithRenren.isShowing()) {
                    dialogAskBindWithRenren.setContentView(dialogview);
                    dialogAskBindWithRenren.show();
                }
            }//showChangeBindDialog

            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                LogUtils.Logd(LocalLogTag, "cbPublishToRenRen onCheckedChanged isChecked=" + isChecked);

                if (isChecked){
                    if (existRenrenAuthInfoForCurrentUser()){
                      //suppose have done auth before, so not need to do auth here
                    }else{//not existRenrenAuthInfo, should do auth
                        showChangeBindDialog();

//                        AlertDialog.Builder askToBindRenrenDlgBuilder = new AlertDialog.Builder(myAcitivity);
//                        //askToBindRenrenDlgBuilder.setIcon(R.drawable.xxx);
//                        askToBindRenrenDlgBuilder.setTitle("绑定人人帐户，将来你便可以用人人帐户来登入活动号外");
//                        askToBindRenrenDlgBuilder.setPositiveButton("现在绑定", new DialogInterface.OnClickListener() {
//                            @Override
//                            public void onClick(DialogInterface dialog, int which) {
//                                final RenrenAuthListener rrAuthlistener = new RenrenAuthListener() {
//                                    @Override
//                                    public void onComplete(Bundle values) {
//                                        LogUtils.Logd(LogTag.RENREN, "RenrenAuthListener.onComplete values=" + values.toString());
//                                      //can not use getRenrenSdkInstanceForCurrentUser because renren.logout in this function according to not-yet sync data
//                                        Renren renren = AppInfo.getNonEmptyRenrenSdkInstance(myAcitivity);//just get existing renren instance
//                                        LogUtils.Logd(LocalLogTag,"PublishDate, RenrenAuthListener.onComplete"+", getCurrentUid()="+renren.getCurrentUid()+", userId="+AppInfo.userId+", accountRenRen="+AppInfo.accountRenRen);
//                                        String currentUid = renren.getCurrentUid()+"";
//                                        String sessionKey = renren.getSessionKey();
//                                        String accessToken = renren.getAccessToken();
//                                        String secret = renren.getSecret();
//                                        String expireTime = renren.getExpireTime()+"";
//                                        JSONObject renrenAuthObj = new JSONObject();
//                                        try {
//                                            renrenAuthObj.put(RenRenLibConst.fieldcommon_session_userId, currentUid);
//                                            renrenAuthObj.put(RenRenLibConst.fieldcommon_session_key, sessionKey);
//                                            renrenAuthObj.put(RenRenLibConst.fieldcommon_access_token, accessToken);
//                                            renrenAuthObj.put(RenRenLibConst.fieldcommon_secret_key, secret);
//                                            renrenAuthObj.put(RenRenLibConst.fieldcommon_expiration_date, expireTime);
//                                        } catch (JSONException e) {
//                                            LogUtils.Loge(LogTag.RENREN,e.getMessage(), e);
//                                            renrenAuthObj = null;
//                                        }
//                                        Bind3rdPartAccountTask bind3rdPartAccountTask = new Bind3rdPartAccountTask(AppInfo.userId, currentUid,renrenAuthObj, myHandler.obtainMessage());
//                                        bind3rdPartAccountTask.execute();
//                                        prgressDialog = myProgressDialog.show(myAcitivity, null, R.string.loading);
//                                    }
//
//                                    @Override
//                                    public void onRenrenAuthError(RenrenAuthError renrenAuthError) {
//                                        renrenAuthError.printStackTrace();
//                                        LogUtils.Loge(LogTag.RENREN, "onRenrenAuthError err=" + renrenAuthError.toString());
//                                        myAcitivity.runOnUiThread(new Runnable() {
//                                            @Override
//                                            public void run() {
//                                                Toast.makeText(myAcitivity, "renren auth failed",Toast.LENGTH_SHORT).show();
//                                            }
//                                        });
//                                        return;
//                                    }
//
//                                    @Override
//                                    public void onCancelLogin() {
//                                        cbPublishToRenRen.setChecked(false);
//                                    }
//
//                                    @Override
//                                    public void onCancelAuth(Bundle values) {
//                                        cbPublishToRenRen.setChecked(false);
//                                    }
//                                };//rrAuthlistener
//                                Renren renren = AppInfo.getRenrenSdkInstanceAtMostPossibleMatchUser(myAcitivity);//if renren auth info exist but not match current user, should be clear and this is done in the get function.
//                                LogUtils.Logd(LocalLogTag,"PublishDate, before renren.authorize"+", getCurrentUid()="+renren.getCurrentUid()+", userId="+AppInfo.userId+", accountRenRen="+AppInfo.accountRenRen);
//                                renren.authorize(myAcitivity, rrAuthlistener);
//                            }//onClick
//                        });//askToBindRenrenDlgBuilder.setPositiveButton
//                        askToBindRenrenDlgBuilder.setNegativeButton("暂不绑定", new DialogInterface.OnClickListener() {
//                            @Override
//                            public void onClick(DialogInterface dialog, int which) {
//                                cbPublishToRenRen.setChecked(false);
//                            }
//                        });
//                        askToBindRenrenDlgBuilder.show();
                    }//not existRenrenAuthInfo
                }//if (isChecked)
            }//onCheckedChanged
        });//setOnCheckedChangeListener

        btnSend.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                String description = dateDetail.getText().toString().trim();
                String title = dateTitle.getText().toString().trim();
                Calendar nowCalendar = Calendar.getInstance();
                Calendar dateDateCanlendar = (Calendar)calendar.clone();

                boolean validDate = true;
                if (nowCalendar.getTimeInMillis() > dateDateCanlendar.getTimeInMillis()) {
                    if (nowCalendar.get(Calendar.MONTH)==Calendar.DECEMBER &&
                            dateDateCanlendar.get(Calendar.MONTH) == Calendar.JANUARY){
                        //to support next year
                        dateDateCanlendar.add(Calendar.YEAR, 1);
                    }else {
                        validDate = false;
                    }
                }
                if (!validDate){
                    Toast.makeText(myAcitivity, R.string.time_is_wrong,
                            Toast.LENGTH_SHORT).show();
                    return;
                }
                if (description == null || "".equals(description)) {
                    Toast.makeText(myAcitivity, R.string.askfor_date_describe,
                            Toast.LENGTH_SHORT).show();
                    return;
                }
                if (TextUtils.isEmpty(title)) {
                    Toast.makeText(myAcitivity, R.string.title_is_empty,
                            Toast.LENGTH_SHORT).show();
                    return;
                }
                String address = dateAddress.getText().toString();
                if (TextUtils.isEmpty(address)) {
                    Toast.makeText(myAcitivity, R.string.location_is_empty,
                            Toast.LENGTH_SHORT).show();
                    return;
                }
                String wantPersonCountNum = wantPersonCount.getText()
                        .toString();
                if (TextUtils.isEmpty(wantPersonCountNum)) {
                    Toast.makeText(myAcitivity, R.string.wantNum_is_empty,
                            Toast.LENGTH_SHORT).show();
                    return;
                }
                String existPersonCountNum = existPersonCount.getText()
                        .toString();
                if (TextUtils.isEmpty(existPersonCountNum)) {
                    Toast.makeText(myAcitivity, R.string.firstNum_is_empty,
                            Toast.LENGTH_SHORT).show();
                    return;
                }
                File imgFile = null;
                int imgWidth = 0, imgHeight = 0;

                if (originalBitmap != null) {
                    FileManager.init(myAcitivity);
                    String pathWithTime = FileManager.UploadFolder
                            .getAbsolutePath()
                            + "/"
                            + "pretty_rich_android_"
                            + new Date().getTime() + ".jpg";
                    BitmapManager.saveBitmap(originalBitmap, pathWithTime);
                    imgFile = new File(pathWithTime);
                    imgWidth = originalBitmap.getWidth();
                    imgHeight = originalBitmap.getHeight();
                }
                createDateTask = new CreateDateTask(AppInfo.userId,dateDateCanlendar
                        .getTimeInMillis(), title, address, whoPay, Integer
                        .parseInt(wantPersonCountNum), Integer
                        .parseInt(existPersonCountNum), description,
                        imgFile, imgWidth, imgHeight, myHandler.obtainMessage());

                createDateTask.execute();
                btnSend.setEnabled(false);
                mProgressDialog = myProgressDialog.show(myAcitivity, null,
                        R.string.loading);

                if (cbPublishToRenRen.isChecked()){
                  //do auth by renren, publish to renren, bind renren to user in the listener
                    Bundle publishRenrenFeedData = new Bundle();
                    publishRenrenFeedData.putString("actionType", "PublishDate");
                    publishRenrenFeedData.putString("address", address);
                    publishRenrenFeedData.putString("title", title);
                    publishRenrenFeedData.putString("description", description);
                    publishRenrenFeedData.putLong("dateDate", dateDateCanlendar.getTimeInMillis());

                    Renren renren = AppInfo.getRenrenSdkInstanceForCurrentUser(myAcitivity);//at this time, need a strict match and need current renren auth info exist
                    PublishRenRenFeedTask publishRenRenFeedTask = new PublishRenRenFeedTask(publishRenrenFeedData,renren,myAcitivity, null);//myHandler.obtainMessage());
                    publishRenRenFeedTask.execute();
                }

                // if (cbSinaWeibo.isChecked()) {
                // if (weibo.isSessionValid()) {
                //
                // WeiboParameters bundle = new WeiboParameters();
                // bundle.add("source", weibo.getAppKey());
                // bundle.add("status", "test");
                // String url = Weibo.SERVER + "statuses/upload.json";
                // AsyncWeiboRunner weiboRunner = new AsyncWeiboRunner(
                // weibo);
                // weiboRunner
                // .request(
                // ProposeDate.this,
                // url,
                // bundle,
                // Utility.HTTPMETHOD_POST,
                // new com.weibo.net.AsyncWeiboRunner.RequestListener() {
                //
                // @Override
                // public void onComplete(
                // String response) {
                // LogUtils.Logd(
                // "SinaWeibo_PrettyRich_Share",
                // response);
                // }
                //
                // @Override
                // public void onIOException(
                // IOException e) {
                // LogUtils.Logd(
                // "SinaWeibo_PrettyRich_Share",
                // e.getMessage(), e);
                // }
                //
                // @Override
                // public void onError(WeiboException e) {
                // LogUtils.Logd(
                // "SinaWeibo_PrettyRich_Share",
                // e.getMessage(), e);
                // LogUtils.Logd(
                // "SinaWeibo_PrettyRich_Share",
                // e.getStatusCode() + "",
                // e);
                // }
                //
                // });
                // }
                // }
            }
        });//btnSend.setOnClickListener

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
                    filePath = FileManager.UploadFolder.getAbsolutePath()
                            + File.separator + sb.toString();
                    Intent i = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                    i.putExtra(MediaStore.EXTRA_OUTPUT, Uri.fromFile(new File(
                            FileManager.UploadFolder, sb.toString())));
                    try {
                        startActivityForResult(i, 3);
                    } catch (Exception e) {
                        LogUtils.Loge(LocalLogTag, e.getMessage(), e);
                        Toast.makeText(myAcitivity, R.string.no_camera_prompt,
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
                            myAcitivity.getString(R.string.photo_gallery)), 1);
                    dialog.dismiss();
                    break;
                }
            }
        };
        Random r = new Random();
        int temp = r.nextInt(9);
        originalBitmap = BitmapFactory.decodeResource(getResources(),
                datePhotoIds[temp]);
        ivDatePhoto.setImageBitmap(originalBitmap);

    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        switch (requestCode) {
        case 1:
            if (data == null || data.getData() == null)
                return;
            Uri selectedImage = data.getData();
            String[] filePathColumn = { MediaStore.Images.Media.DATA };
            Cursor cursor = myAcitivity.getContentResolver().query(
                    selectedImage, filePathColumn, null, null, null);
            cursor.moveToFirst();
            int columnIndex = cursor.getColumnIndex(filePathColumn[0]);
            filePath = cursor.getString(columnIndex);
            cursor.close();
            originalBitmap = BitmapManager
                    .getAppropriateBitmapFromFile(filePath);
            originalBitmap = modifyBitmap(filePath);
            ivDatePhoto.setImageBitmap(originalBitmap);
            break;
        case 3:
            if (resultCode == Activity.RESULT_OK) {
                try {
                    originalBitmap = BitmapManager
                            .getAppropriateBitmapFromFile(filePath);
                } catch (OutOfMemoryError err) {
                    LogUtils.Logd(LogTag.DATABASE, err.getMessage(), err);
                }
                if (originalBitmap != null) {
                    originalBitmap = modifyBitmap(filePath);
                    ivDatePhoto.setImageBitmap(originalBitmap);
                }

            }
            break;
        }

    }

    /**
     * valid when user is logged in.
     * when exist renren sdk auth info, and the auth info is belong to the user.
     * @param context
     * @return
     */
    private boolean existRenrenAuthInfoForCurrentUser(){
        Renren renren = AppInfo.getNonEmptyRenrenSdkInstance(myAcitivity);
        boolean exist = false;
        long lCurrentUid = renren.getCurrentUid();
        if (lCurrentUid != 0){
            String sCurrentUid = lCurrentUid + "";
            if (sCurrentUid.equals(AppInfo.accountRenRen)){
                exist = true;
            }
        }
        LogUtils.Logd(LocalLogTag,"PublishDate, existRenrenAuthInfoForCurrentUser, exist="+exist+
                ", CurrentUid="+lCurrentUid+", accountRenRen="+AppInfo.accountRenRen);
        return exist;
    }

    private void showMenuDialog() {
        View dialogview = myAcitivity.getLayoutInflater().inflate(
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
            Bitmap temp = Bitmap.createBitmap(originalBitmap, 0, 0,
                    originalBitmap.getWidth(), originalBitmap.getHeight(),
                    localMatrix, true);
            return temp;
        } else {
            return originalBitmap;
        }
    }

    /**
     * Setup a new 3D rotation on the container view.
     *
     * @param position
     *            the item that was clicked to show a picture, or -1 to show the
     *            list
     * @param start
     *            the start angle at which the rotation must begin
     * @param end
     *            the end angle of the rotation
     */
    private void applyRotation(int position, float start, float end) {
        // Find the center of the container
        final float centerX = mContainer.getWidth() / 2.0f;
        final float centerY = mContainer.getHeight() / 2.0f;

        // Create a new 3D rotation with the supplied parameter
        // The animation listener is used to trigger the next animation
        final Rotate3dAnimation rotation = new Rotate3dAnimation(start, end,
                centerX, centerY, 310.0f, true);
        rotation.setDuration(300);
        rotation.setFillAfter(true);
        rotation.setInterpolator(new AccelerateInterpolator());
        rotation.setAnimationListener(new DisplayNextView(position));

        mContainer.startAnimation(rotation);
    }

    /**
     * This class listens for the end of the first half of the animation. It
     * then posts a new action that effectively swaps the views when the
     * container is rotated 90 degrees and thus invisible.
     */
    private final class DisplayNextView implements Animation.AnimationListener {
        private final int mPosition;

        private DisplayNextView(int position) {
            mPosition = position;
        }

        @Override
        public void onAnimationStart(Animation animation) {
        }

        @Override
        public void onAnimationEnd(Animation animation) {
            mContainer.post(new SwapViews(mPosition));
        }

        @Override
        public void onAnimationRepeat(Animation animation) {
        }
    }

    /**
     * This class is responsible for swapping the views and start the second
     * half of the animation.
     */
    private final class SwapViews implements Runnable {
        private final int mType;

        public SwapViews(int type) {
            mType = type;
        }

        @Override
        public void run() {
            final float centerX = mContainer.getWidth() / 2.0f;
            final float centerY = mContainer.getHeight() / 2.0f;
            Rotate3dAnimation rotation;

            if (mType == TYPE_EDIT) {
                rlDateEdit.setVisibility(View.GONE);
                rlDatePreview.setVisibility(View.VISIBLE);
                // rlDatePreview.requestFocus();

                rotation = new Rotate3dAnimation(90, 0, centerX, centerY,
                        310.0f, false);
            } else {
                rlDatePreview.setVisibility(View.GONE);
                rlDateEdit.setVisibility(View.VISIBLE);
                // rlDateEdit.requestFocus();

                rotation = new Rotate3dAnimation(-90, 0, centerX, centerY,
                        310.0f, false);
            }

            rotation.setDuration(300);
            rotation.setFillAfter(true);
            rotation.setInterpolator(new DecelerateInterpolator());

            mContainer.startAnimation(rotation);
        }
    }

    private void initPreviewData() {
        if (originalBitmap == null) {
            originalBitmap = BitmapFactory.decodeResource(getResources(),
                    R.drawable.date_pre_bg1);
        }
        ivPreDatePhoto.setImageBitmap(originalBitmap);
        tvPreTime.setText(timeTextView.getText());
        tvPreAddress.setText(dateAddress.getText());
        if (!TextUtils.isEmpty(existPersonCount.getText())
                && !TextUtils.isEmpty(wantPersonCount.getText())) {
            tvPrePersonNum.setText(existPersonCount.getText() + "+"
                    + wantPersonCount.getText());
        }
        tvPreDetail.setText(dateDetail.getText());
        tvPreTitle.setText(dateTitle.getText());
    }

    @Override
    public void onResume() {
        super.onResume();
        if (cbPublishToRenRen.isChecked()){
            if (!existRenrenAuthInfoForCurrentUser()){
                cbPublishToRenRen.setChecked(false);
            }
        }
    }

}
