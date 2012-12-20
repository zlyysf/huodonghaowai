package com.lingzhimobile.huodonghaowai.fragment;

import java.io.File;
import java.io.IOException;
import java.util.Date;
import java.util.HashMap;
import java.util.Random;

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
import android.support.v4.app.Fragment;
import android.text.Editable;
import android.text.TextUtils;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.AccelerateInterpolator;
import android.view.animation.Animation;
import android.view.inputmethod.InputMethodManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.widget.TextView;
import android.widget.Toast;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.activity.Nearby;
import com.lingzhimobile.huodonghaowai.activity.ReportUser;
import com.lingzhimobile.huodonghaowai.asynctask.GetUserTask;
import com.lingzhimobile.huodonghaowai.asynctask.LogoutTask;
import com.lingzhimobile.huodonghaowai.asynctask.UpdateProfileTask;
import com.lingzhimobile.huodonghaowai.asynctask.UploadPhotoTask;
import com.lingzhimobile.huodonghaowai.cons.MessageID;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.model.UserItem;
import com.lingzhimobile.huodonghaowai.util.AppInfo;
import com.lingzhimobile.huodonghaowai.util.AppUtil;
import com.lingzhimobile.huodonghaowai.util.BitmapManager;
import com.lingzhimobile.huodonghaowai.util.FileManager;
import com.lingzhimobile.huodonghaowai.util.GlobalValue;
import com.lingzhimobile.huodonghaowai.util.MethodHandler;
import com.lingzhimobile.huodonghaowai.view.Rotate3dAnimation;
import com.lingzhimobile.huodonghaowai.view.myProgressDialog;

public class ProfileFragment extends Fragment {
    private final int TYPE_EDIT = 10;
    private final int TYPE_VIEW = 11;
    private int mCurrentType = 11;

    private Activity myAcitivity;
    private View currentView;
    private UserItem mProfileInfo;
    private UserItem tempProfileInfo;

    private ViewGroup mContainer;
    private Button btnCancel, btnEdit, btnConfirm;
    private TextView tvUserName, tvUserBasicInfo, tvUserEduStatus,
            tvUserDescription, tvTitle;
    private ImageView ivUserPhoto, ivUserEditPhoto;
    private EditText etUserHeight, etUserHomeTown, etUserDepartment,
            etUserDescription;
    private TextView tvUserBloodType, tvUserConstellation, tvUserEditEduStatus,
            tvUserSchool, tvUserEditName, tvAlertString;

    private RelativeLayout rlViewProfile, rlEditProfile, rlHeaderPhoto;

    private myProgressDialog mProgressDialog;
    private String filePath;
    private Bitmap originalBitmap;
    private Bitmap tempBitmap;
    private Dialog dialog;
    private View.OnClickListener menuClickListener;

    private LogoutTask logoutTask;
    // private String tempName, tempHeight, tempBloodType, tempDepartment,
    // tempDescription, tempEduStatus, tempConstellation, tempSchool,
    // tempHomeTown,tempPhotoId,tempPhotoPath;
    private final HashMap<String, String> values = new HashMap<String, String>();
    private int tempPosition = 0;
    private ProgressBar pbLoadImage;
    private boolean isRestricted;
    private InputMethodManager imm;
    private UpdateProfileTask updateProfileTask;
    private UploadPhotoTask uploadPhotoTask;

    public Handler myHandler = new Handler() {

        @Override
        public void handleMessage(Message msg) {
            if(myAcitivity.isFinishing()){
                return;
            }
            if (mProgressDialog != null) {
                mProgressDialog.dismiss();
            }
            super.handleMessage(msg);
            switch (msg.what) {
            case MessageID.GET_PROFILE_OK:
                mProfileInfo = (UserItem) msg.obj;
                tempProfileInfo = mProfileInfo.clone();
                initProfileData();
                break;
            case MessageID.LOGOUT_OK:
                myAcitivity.getSharedPreferences("UserInfo", 0).edit()
                        .remove("userId").commit();
                myAcitivity.getSharedPreferences("UserInfo", 0).edit()
                        .remove("sessionToken").commit();
                AppInfo.userId = null;
                AppInfo.sessionToken = null;
                GlobalValue.applyDates.clear();
                GlobalValue.sendDates.clear();
                GlobalValue.invitedDates.clear();
                GlobalValue.nearbyDates.clear();
                Intent intent = new Intent();
                intent.setClass(myAcitivity, Nearby.class);
                intent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
                startActivity(intent);
                myAcitivity.finish();
                break;
            case MessageID.UPDATE_PROFILE_OK:
                Toast.makeText(myAcitivity, R.string.edit_profile_ok,
                        Toast.LENGTH_SHORT).show();
                mProfileInfo = tempProfileInfo.clone();
                Bundle data = msg.getData();
                if (data.getString("photoId") != null
                        && data.getString("photoPath") != null) {
                    mProfileInfo.setPrimaryPhotoId(data.getString("photoId"));
                    mProfileInfo.setPrimaryPhotoPath(data
                            .getString("photoPath"));
                    tempBitmap = null;
                }

                saveProfileData();
                break;
            case MessageID.SERVER_RETURN_NULL:
                AppUtil.handleErrorCode(msg.obj.toString(), myAcitivity);
                break;

            }

        }

    };

    public static ProfileFragment newInstance(String userId, int backStrId) {
        ProfileFragment f = new ProfileFragment();
        Bundle args = new Bundle();
        args.putString("userId", userId);
        args.putInt("backStrId", backStrId);
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
        currentView = inflater.inflate(R.layout.profile, container, false);
        initView();
        imm = (InputMethodManager) myAcitivity
                .getSystemService(Context.INPUT_METHOD_SERVICE);
        mProgressDialog = myProgressDialog.show(myAcitivity, null,
                R.string.loading);
        new GetUserTask(AppInfo.userId, getArguments().getString("userId"),
                myHandler.obtainMessage()).execute();
        return currentView;
    }

    private void initView() {
        dialog = new Dialog(myAcitivity, R.style.AlertDialog);
        tvTitle = (TextView) currentView.findViewById(R.id.tvTitle);
        tvTitle.requestFocus();
        mContainer = (ViewGroup) currentView.findViewById(R.id.container);
        rlViewProfile = (RelativeLayout) currentView
                .findViewById(R.id.rlViewProfile);
        rlEditProfile = (RelativeLayout) currentView
                .findViewById(R.id.rlEditProfile);
        pbLoadImage = (ProgressBar) currentView.findViewById(R.id.pbLoadImage);
        btnCancel = (Button) currentView.findViewById(R.id.btnCancel);
        btnEdit = (Button) currentView.findViewById(R.id.btnEdit);
        btnConfirm = (Button) currentView.findViewById(R.id.btnConfirm);
        tvUserName = (TextView) currentView.findViewById(R.id.tvUserName);
        tvUserBasicInfo = (TextView) currentView
                .findViewById(R.id.tvUserBasicInfo);
        tvUserEduStatus = (TextView) currentView
                .findViewById(R.id.tvUserEduInfo);
        tvUserDescription = (TextView) currentView
                .findViewById(R.id.tvUserDescription);
        ivUserPhoto = (ImageView) currentView
                .findViewById(R.id.ivUserProfilePhoto);
        ivUserEditPhoto = (ImageView) currentView
                .findViewById(R.id.ivEditUserPhoto);
        rlHeaderPhoto = (RelativeLayout) currentView
                .findViewById(R.id.rlHeaderPhoto);
        tvUserEditName = (TextView) currentView.findViewById(R.id.nameTextView);
        etUserHeight = (EditText) currentView.findViewById(R.id.heightEditText);
        etUserHomeTown = (EditText) currentView
                .findViewById(R.id.hometownEditText);
        etUserDepartment = (EditText) currentView
                .findViewById(R.id.departmentEditText);
        etUserDescription = (EditText) currentView
                .findViewById(R.id.descriptionEditText);
        tvUserBloodType = (TextView) currentView
                .findViewById(R.id.bloodTypeTextView);
        tvUserConstellation = (TextView) currentView
                .findViewById(R.id.constellationTextView);
        tvUserEditEduStatus = (TextView) currentView
                .findViewById(R.id.eduStatusTextView);
        tvUserSchool = (TextView) currentView.findViewById(R.id.schoolTextView);
        tvAlertString = (TextView) currentView.findViewById(R.id.tvAlertString);
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
                        LogUtils.Loge(LogTag.ACTIVITY, e.getMessage(), e);
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

        if (getArguments().getInt("backStrId") == R.string.logout) {
            btnCancel.setText(R.string.logout);
            btnCancel.setOnClickListener(new View.OnClickListener() {

                @Override
                public void onClick(View v) {
                    showLogoutAlertDialog();
                }
            });
            btnEdit.setOnClickListener(new View.OnClickListener() {

                @Override
                public void onClick(View v) {
                    if (mCurrentType == TYPE_EDIT) {
                        if (imm.isActive()) {
                            imm.hideSoftInputFromWindow(myAcitivity
                                    .getCurrentFocus().getWindowToken(), 0);
                        }
                        initProfileData();
                        applyRotation(TYPE_EDIT, 0, -90);
                        mCurrentType = TYPE_VIEW;
                        btnEdit.setText(R.string.edit);
                    } else {
                        initEditDate();
                        applyRotation(TYPE_VIEW, 0, 90);
                        mCurrentType = TYPE_EDIT;
                        btnEdit.setText(R.string.preview);
                    }
                }
            });
        } else {
            btnCancel.setText(getArguments().getInt("backStrId"));
            btnCancel.setBackgroundResource(R.drawable.btn_back_bg);
            //btnEdit.setVisibility(View.GONE);
            btnEdit.setText(R.string.report);
            btnEdit.setOnClickListener(new View.OnClickListener() {

                @Override
                public void onClick(View v) {
                    Intent intent = new Intent();
                    intent.setClass(myAcitivity, ReportUser.class);
                    intent.putExtra("targetUserId", getArguments().getString("userId"));
                    startActivity(intent);
                }
            });
            btnCancel.setOnClickListener(new View.OnClickListener() {

                @Override
                public void onClick(View v) {
                    getFragmentManager().popBackStack();
                }
            });
        }
    }

    private void initProfileData() {

        if (originalBitmap == null) {
            Bitmap bm = mProfileInfo.getBitmap();
            if (bm != null) {
                ivUserPhoto.setImageBitmap(bm);
            } else {
                pbLoadImage.setVisibility(View.VISIBLE);
                ivUserPhoto.setTag(mProfileInfo.getPrimaryPhotoPath());
                mProfileInfo.getPostBitmapAsync(new MethodHandler<Bitmap>() {
                    @Override
					public void process(Bitmap para) {
                        Message msg = refreshImgHandler.obtainMessage(0,
                                ivUserPhoto);
                        refreshImgHandler.sendMessage(msg);
                    }
                });
            }
        }
        tvUserName.setText(tempProfileInfo.getName());

        if (getArguments().getInt("backStrId") == R.string.logout) {
            StringBuffer sb = new StringBuffer();
            if ("female".equals(tempProfileInfo.getGender())) {
                sb.append(getResources().getString(R.string.female));
            } else {
                sb.append(getResources().getString(R.string.male));
            }
            if (tempProfileInfo.getHeight() != 0) {
                sb.append(", ");
                sb.append(tempProfileInfo.getHeight());
                sb.append("CM");
            }
            if (!TextUtils.isEmpty(tempProfileInfo.getBloodType())) {
                sb.append(", ");
                sb.append(tempProfileInfo.getBloodType());

            }
            if (!TextUtils.isEmpty(tempProfileInfo.getConstellation())) {
                sb.append(", ");
                sb.append(tempProfileInfo.getConstellation());

            }
            if (!TextUtils.isEmpty(tempProfileInfo.getHometown())) {
                sb.append(", ");
                sb.append(getResources().getString(R.string.hometown));
                sb.append(tempProfileInfo.getHometown());
            }
            tvUserBasicInfo.setText(sb.toString());
            StringBuffer sb1 = new StringBuffer();
            if (!TextUtils.isEmpty(tempProfileInfo.getEducationalStatus())) {
                sb1.append(tempProfileInfo.getEducationalStatus());
                sb1.append(", ");
            }
            if (!TextUtils.isEmpty(tempProfileInfo.getDepartment())) {
                sb1.append(tempProfileInfo.getDepartment());
                sb1.append(", ");
            }
            sb1.append(tempProfileInfo.getSchool());
            sb1.append(", ");
            sb1.append(AppUtil.getStringFromIdWithParams(
                    R.string.good_rate_count,
                    tempProfileInfo.getGoodRateCount()));
            tvUserEduStatus.setText(sb1.toString());
            tvUserDescription.setText(tempProfileInfo.getDescription());
        } else {
            StringBuffer sb = new StringBuffer();
            if ("female".equals(tempProfileInfo.getGender())) {
                sb.append(myAcitivity.getString(R.string.female));
            } else {
                sb.append(myAcitivity.getString(R.string.male));
            }

            if (tempProfileInfo.getHeight() != 0) {
                if (AppInfo.height == 0) {
                    sb.append(", ");
                    sb.append(myAcitivity.getString(R.string.height));
                    sb.append("XX");
                    isRestricted = true;
                } else {
                    sb.append(", ");
                    sb.append(tempProfileInfo.getHeight());
                    sb.append("CM");
                }
            }
            if (!TextUtils.isEmpty(tempProfileInfo.getBloodType())) {
                if (TextUtils.isEmpty(AppInfo.bloodType)) {
                    sb.append(", XX");
                    sb.append(myAcitivity.getString(R.string.bloodtype));
                    isRestricted = true;
                } else {
                    sb.append(", ");
                    sb.append(tempProfileInfo.getBloodType());
                }
            }

            if (!TextUtils.isEmpty(tempProfileInfo.getConstellation())) {
                if (TextUtils.isEmpty(AppInfo.constellation)) {
                    sb.append(", XX");
                    sb.append(myAcitivity.getString(R.string.constellation));
                    isRestricted = true;
                } else {
                    sb.append(", ");
                    sb.append(tempProfileInfo.getConstellation());
                }
            }
            if (!TextUtils.isEmpty(tempProfileInfo.getHometown())) {
                if (TextUtils.isEmpty(AppInfo.hometown)) {
                    sb.append(", ");
                    sb.append(myAcitivity.getString(R.string.hometown));
                    sb.append("XX");
                    isRestricted = true;
                } else {
                    sb.append(", ");
                    sb.append(myAcitivity.getString(R.string.hometown));
                    sb.append(tempProfileInfo.getHometown());
                }
            }
            tvUserBasicInfo.setText(sb.toString());
            StringBuffer sb1 = new StringBuffer();
            if (!TextUtils.isEmpty(tempProfileInfo.getEducationalStatus())) {
                if (TextUtils.isEmpty(AppInfo.educationalStatus)) {
                    sb1.append("XX");
                    sb1.append(myAcitivity.getString(
                            R.string.educationalStatus));
                    isRestricted = true;
                } else {
                    sb1.append(tempProfileInfo.getEducationalStatus());
                }
                sb1.append(", ");
            }
            if (!TextUtils.isEmpty(tempProfileInfo.getDepartment())) {
                if (TextUtils.isEmpty(AppInfo.department)) {
                    sb1.append("XX");
                    sb1.append(myAcitivity.getString(R.string.department));
                    isRestricted = true;
                } else {
                    sb1.append(tempProfileInfo.getDepartment());
                }
                sb1.append(", ");
            }
            sb1.append(tempProfileInfo.getSchool());
            if (tempProfileInfo.getGoodRateCount() > 0) {
                sb1.append(", ");
                sb1.append(AppUtil.getStringFromIdWithParams(
                        R.string.good_rate_count,
                        tempProfileInfo.getGoodRateCount()));
            }
            tvUserEduStatus.setText(sb1.toString());
            if (!TextUtils.isEmpty(mProfileInfo.getDescription())) {
                if (TextUtils.isEmpty(AppInfo.description)) {
                    tvUserDescription.setText(R.string.iam);
                    isRestricted = true;
                } else {
                    tvUserDescription.setText(mProfileInfo.getDescription());
                }
            } else {
                tvUserDescription.setVisibility(View.GONE);
            }
            if (isRestricted) {
                tvAlertString.setVisibility(View.VISIBLE);
            }
        }
    }

    private void initEditDate() {
        if (originalBitmap == null) {
            Bitmap bm = mProfileInfo.getSmallBitmap();
            if (bm != null) {
                ivUserEditPhoto.setImageBitmap(bm);
            } else {
                ivUserEditPhoto.setTag(mProfileInfo.getSmallPhotoPath());
                mProfileInfo
                        .getSmallPostBitmapAsync(new MethodHandler<Bitmap>() {
                            @Override
							public void process(Bitmap para) {
                                Message msg = refreshImgHandler1.obtainMessage(
                                        0, ivUserEditPhoto);
                                refreshImgHandler1.sendMessage(msg);
                            }
                        });
            }
        }
        ivUserEditPhoto.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                showMenuDialog();
            }
        });
        rlHeaderPhoto.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                showMenuDialog();
            }
        });
        tvUserEditName.setText(tempProfileInfo.getName());
        if (tempProfileInfo.getHeight() != 0) {
            etUserHeight.setText(String.valueOf(tempProfileInfo.getHeight()));
        }
        tvUserBloodType.setText(tempProfileInfo.getBloodType());
        tvUserConstellation.setText(tempProfileInfo.getConstellation());
        etUserHomeTown.setText(tempProfileInfo.getHometown());
        tvUserEditEduStatus.setText(tempProfileInfo.getEducationalStatus());
        etUserDepartment.setText(tempProfileInfo.getDepartment());
        tvUserSchool.setText(tempProfileInfo.getSchool());
        etUserDescription.setText(tempProfileInfo.getDescription());
        etUserHeight.addTextChangedListener(new TextWatcher() {

            @Override
            public void onTextChanged(CharSequence s, int start, int before,
                    int count) {

            }

            @Override
            public void beforeTextChanged(CharSequence s, int start, int count,
                    int after) {

            }

            @Override
            public void afterTextChanged(Editable s) {
                if (!TextUtils.isEmpty(s)) {
                    tempProfileInfo.setHeight(Integer.parseInt(s.toString()));
                } else {
                    tempProfileInfo.setHeight(0);
                }
            }
        });
        etUserHomeTown.addTextChangedListener(new TextWatcher() {

            @Override
            public void onTextChanged(CharSequence s, int start, int before,
                    int count) {

            }

            @Override
            public void beforeTextChanged(CharSequence s, int start, int count,
                    int after) {

            }

            @Override
            public void afterTextChanged(Editable s) {
                tempProfileInfo.setHometown(s.toString());
            }
        });
        etUserDepartment.addTextChangedListener(new TextWatcher() {

            @Override
            public void onTextChanged(CharSequence s, int start, int before,
                    int count) {

            }

            @Override
            public void beforeTextChanged(CharSequence s, int start, int count,
                    int after) {

            }

            @Override
            public void afterTextChanged(Editable s) {
                tempProfileInfo.setDepartment(s.toString());
            }
        });
        etUserDescription.addTextChangedListener(new TextWatcher() {

            @Override
            public void onTextChanged(CharSequence s, int start, int before,
                    int count) {

            }

            @Override
            public void beforeTextChanged(CharSequence s, int start, int count,
                    int after) {

            }

            @Override
            public void afterTextChanged(Editable s) {
                tempProfileInfo.setDescription(s.toString());
            }
        });
        tvUserBloodType.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                tempPosition = 0;
                AlertDialog dialog = new AlertDialog.Builder(myAcitivity)
                        .setTitle(R.string.bloodtype)
                        .setSingleChoiceItems(R.array.blood_type_values, 0,
                                new DialogInterface.OnClickListener() {

                                    @Override
                                    public void onClick(DialogInterface dialog,
                                            int which) {
                                        tempPosition = which;
                                    }
                                })
                        .setPositiveButton(R.string.OK,
                                new DialogInterface.OnClickListener() {

                                    @Override
                                    public void onClick(DialogInterface dialog,
                                            int which) {
                                        tvUserBloodType
                                                .setText(getResources()
                                                        .getStringArray(
                                                                R.array.blood_type_values)[tempPosition]);
                                        tempProfileInfo
                                                .setBloodType(tvUserBloodType
                                                        .getText().toString());
                                    }
                                }).setNegativeButton(R.string.Cancel, null)
                        .create();
                dialog.show();

            }
        });
        tvUserEditEduStatus.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                tempPosition = 0;
                AlertDialog dialog = new AlertDialog.Builder(myAcitivity)
                        .setTitle(R.string.educationalStatus)
                        .setSingleChoiceItems(R.array.edu_status_values, 0,
                                new DialogInterface.OnClickListener() {

                                    @Override
                                    public void onClick(DialogInterface dialog,
                                            int which) {
                                        tempPosition = which;
                                    }
                                })
                        .setPositiveButton(R.string.OK,
                                new DialogInterface.OnClickListener() {

                                    @Override
                                    public void onClick(DialogInterface dialog,
                                            int which) {
                                        tvUserEditEduStatus
                                                .setText(getResources()
                                                        .getStringArray(
                                                                R.array.edu_status_values)[tempPosition]);
                                        tempProfileInfo
                                                .setEducationalStatus(tvUserEditEduStatus
                                                        .getText().toString());
                                    }
                                }).setNegativeButton(R.string.Cancel, null)
                        .create();
                dialog.show();
            }
        });
        tvUserConstellation.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                tempPosition = 0;
                AlertDialog dialog = new AlertDialog.Builder(myAcitivity)
                        .setTitle(R.string.constellation)
                        .setSingleChoiceItems(R.array.constellation_values, 0,
                                new DialogInterface.OnClickListener() {

                                    @Override
                                    public void onClick(DialogInterface dialog,
                                            int which) {
                                        tempPosition = which;
                                    }
                                })
                        .setPositiveButton(R.string.OK,
                                new DialogInterface.OnClickListener() {

                                    @Override
                                    public void onClick(DialogInterface dialog,
                                            int which) {
                                        tvUserConstellation
                                                .setText(getResources()
                                                        .getStringArray(
                                                                R.array.constellation_values)[tempPosition]);
                                        tempProfileInfo
                                                .setConstellation(tvUserConstellation
                                                        .getText().toString());
                                    }
                                }).setNegativeButton(R.string.Cancel, null)
                        .create();
                dialog.show();

            }
        });
        // tvUserSchool.setOnClickListener(new View.OnClickListener() {
        //
        // @Override
        // public void onClick(View v) {
        // tempSchool = getResources().getStringArray(
        // R.array.school_values)[0];
        // AlertDialog dialog = new AlertDialog.Builder(myAcitivity)
        // .setTitle(R.string.school)
        // .setSingleChoiceItems(R.array.school_values, 0,
        // new DialogInterface.OnClickListener() {
        //
        // @Override
        // public void onClick(DialogInterface dialog,
        // int which) {
        // tempSchool = getResources()
        // .getStringArray(
        // R.array.school_values)[which];
        // }
        // })
        // .setPositiveButton(R.string.OK,
        // new DialogInterface.OnClickListener() {
        //
        // @Override
        // public void onClick(DialogInterface dialog,
        // int which) {
        // tvUserSchool.setText(tempSchool);
        // }
        // }).setNegativeButton(R.string.Cancel, null)
        // .create();
        // dialog.show();
        //
        // }
        // });
        btnConfirm.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                values.clear();
                if (tempProfileInfo.getHeight() != mProfileInfo.getHeight()) {
                    values.put("height",
                            String.valueOf(tempProfileInfo.getHeight()));
                }
                if (!tempProfileInfo.getBloodType().equals(
                        mProfileInfo.getBloodType())) {
                    values.put("bloodGroup", tempProfileInfo.getBloodType());
                }
                if (!tempProfileInfo.getConstellation().equals(
                        mProfileInfo.getConstellation())) {
                    values.put("constellation",
                            tempProfileInfo.getConstellation());
                }
                if (!tempProfileInfo.getDepartment().equals(
                        mProfileInfo.getDepartment())) {
                    values.put("department", tempProfileInfo.getDepartment());
                }
                if (!tempProfileInfo.getDescription().equals(
                        mProfileInfo.getDescription())) {
                    values.put("description", tempProfileInfo.getDescription());
                }
                if (!tempProfileInfo.getEducationalStatus().equals(
                        mProfileInfo.getEducationalStatus())) {
                    values.put("educationalStatus",
                            tempProfileInfo.getEducationalStatus());
                }
                if (!tempProfileInfo.getHometown().equals(
                        mProfileInfo.getHometown())) {
                    values.put("hometown", tempProfileInfo.getHometown());
                }
                if (tempBitmap != null) {
                    mProgressDialog = myProgressDialog.show(myAcitivity, null,
                            R.string.loading);
                    String pathWithTime = FileManager.UploadFolder
                            .getAbsolutePath()
                            + "/"
                            + "pretty_rich_android_"
                            + new Date().getTime() + ".jpg";
                    BitmapManager.saveBitmap(tempBitmap, pathWithTime);
                    if (updateProfileTask != null) {
                        updateProfileTask.cancel(true);
                    }

                    updateProfileTask = new UpdateProfileTask(AppInfo.userId,
                            values, tempBitmap.getWidth(), tempBitmap
                                    .getHeight(), new File(pathWithTime),
                            myHandler.obtainMessage());
                    updateProfileTask.execute();
                } else if (!values.isEmpty()) {
                    mProgressDialog = myProgressDialog.show(myAcitivity, null,
                            R.string.loading);
                    updateProfileTask = new UpdateProfileTask(AppInfo.userId,
                            values, 0, 0, null, myHandler.obtainMessage());
                    updateProfileTask.execute();
                }
            }
        });
    }

    Handler refreshImgHandler = new Handler() {
        @Override
		public void handleMessage(android.os.Message msg) {
            ImageView iv = (ImageView) msg.obj;
            if (iv != null
                    && mProfileInfo.getPrimaryPhotoPath().equals(iv.getTag())) {
                iv.setImageBitmap(mProfileInfo.getBitmap());
                pbLoadImage.setVisibility(View.GONE);
                iv.setTag(null);
            }
        };
    };
    Handler refreshImgHandler1 = new Handler() {
        @Override
		public void handleMessage(android.os.Message msg) {
            ImageView iv = (ImageView) msg.obj;
            if (iv != null
                    && mProfileInfo.getSmallPhotoPath().equals(iv.getTag())) {
                iv.setImageBitmap(mProfileInfo.getSmallBitmap());
                iv.setTag(null);
            }
        };
    };

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
            tempBitmap = originalBitmap;
            ivUserEditPhoto.setImageBitmap(originalBitmap);
            ivUserPhoto.setImageBitmap(originalBitmap);
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
                    tempBitmap = originalBitmap;
                    ivUserEditPhoto.setImageBitmap(originalBitmap);
                    ivUserPhoto.setImageBitmap(originalBitmap);
                }

            }
            break;
        }

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
                rlViewProfile.setVisibility(View.VISIBLE);
                rlEditProfile.setVisibility(View.GONE);
                // rlDatePreview.requestFocus();

                rotation = new Rotate3dAnimation(90, 0, centerX, centerY,
                        310.0f, false);
            } else {
                rlEditProfile.setVisibility(View.VISIBLE);
                rlViewProfile.setVisibility(View.GONE);
                // rlDateEdit.requestFocus();

                rotation = new Rotate3dAnimation(-90, 0, centerX, centerY,
                        310.0f, false);
            }

            rotation.setDuration(300);
            rotation.setFillAfter(true);
            // rotation.setInterpolator(new DecelerateInterpolator());

            mContainer.startAnimation(rotation);
        }
    }

    private void saveProfileData() {
        AppInfo.bloodType = mProfileInfo.getBloodType();
        AppInfo.constellation = mProfileInfo.getConstellation();
        AppInfo.department = mProfileInfo.getDepartment();
        AppInfo.description = mProfileInfo.getDescription();
        AppInfo.educationalStatus = mProfileInfo.getEducationalStatus();
        AppInfo.height = mProfileInfo.getHeight();
        AppInfo.hometown = mProfileInfo.getHometown();
        AppInfo.userPhoto = mProfileInfo.getPrimaryPhotoPath();
        SharedPreferences userInfo = myAcitivity.getSharedPreferences(
                "UserInfo", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = userInfo.edit();
        editor.putString("userPhoto", AppInfo.userPhoto);
        editor.putString("constellation", AppInfo.constellation);
        editor.putString("hometown", AppInfo.hometown);
        editor.putString("bloodType", AppInfo.bloodType);
        editor.putString("department", AppInfo.department);
        editor.putInt("height", AppInfo.height);
        editor.putString("educationalStatus", AppInfo.educationalStatus);
        editor.putString("description", AppInfo.description);
        editor.putString("userPhoto", AppInfo.userPhoto);
        editor.commit();
    }

    public void showLogoutAlertDialog() {
        View dialogview = myAcitivity.getLayoutInflater().inflate(
                R.layout.spendcreditsdialog, null);
        TextView tvNotify = (TextView) dialogview
                .findViewById(R.id.tvNotifyText);
        tvNotify.setText(R.string.logout_alert);
        Button btnOK = (Button) dialogview.findViewById(R.id.btnOk);
        Button btnCancel = (Button) dialogview.findViewById(R.id.btnCancel);
        btnOK.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                logoutTask = new LogoutTask(AppInfo.userId, myHandler
                        .obtainMessage());
                logoutTask.execute();
                dialog.dismiss();
                mProgressDialog = myProgressDialog.show(myAcitivity, null,
                        R.string.loading);
            }
        });
        btnCancel.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                dialog.dismiss();
            }
        });
        if (!dialog.isShowing()) {
            dialog.setContentView(dialogview);
            dialog.show();
        }
    }

}
