package com.lingzhimobile.huodonghaowai.asynctask;

import java.util.ArrayList;


import android.app.Activity;

import android.os.Message;

import com.lingzhimobile.huodonghaowai.cons.MessageID;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.renren.api.connect.android.AsyncRenren;
import com.renren.api.connect.android.Renren;
import com.renren.api.connect.android.common.AbstractRequestListener;
import com.renren.api.connect.android.exception.RenrenError;
import com.renren.api.connect.android.users.UserInfo;
import com.renren.api.connect.android.users.UsersGetInfoRequestParam;
import com.renren.api.connect.android.users.UsersGetInfoResponseBean;

public class GetRenRenUserInfoTask {
    Message msg;
    private final Renren renren;
    private final String uid;

    public GetRenRenUserInfoTask(String uid, Renren renren, Message msg){
        this.uid = uid;
        this.renren = renren;
        this.msg = msg;
    }

    public void execute(){

        AsyncRenren asyncRenren = new AsyncRenren(renren);
        String[] uids = new String[1];
        uids[0] = uid;
        UsersGetInfoRequestParam param = new UsersGetInfoRequestParam(uids,UsersGetInfoRequestParam.FIELDS_ALL);
        AbstractRequestListener<UsersGetInfoResponseBean> renrenCallApiListener = new AbstractRequestListener<UsersGetInfoResponseBean>() {

            @Override
            public void onComplete(final UsersGetInfoResponseBean bean) {
                LogUtils.Logd(LogTag.RENREN, "GetRenRenUserInfoTask renrenCallApiListener onComplete bean=" + bean.toString()  );

                ArrayList<UserInfo> aryUser = bean.getUsersInfo();
                UserInfo renrenUser = aryUser.get(0);
                msg.what = MessageID.RENRENSDK_getUsersInfo_OK;
                msg.obj = renrenUser;
                msg.sendToTarget();

//                activity.runOnUiThread(new Runnable() {
//                    @Override
//                    public void run() {
//                        //LogUtils.Logd(LogTag.RENREN, "AbstractRequestListener<UsersGetInfoResponseBean>.onComplete bean=" + bean.toString());
//                        Intent intent = new Intent(activity, AskInfo.class);
//                        intent.putExtra(Renren.RENREN_LABEL, renren);
//
//                        ArrayList<UserInfo> aryUser = bean.getUsersInfo();
//                        UserInfo renrenUser = aryUser.get(0);
//                        LogUtils.Logd(LogTag.RENREN, "AbstractRequestListener<UsersGetInfoResponseBean>.onComplete user0=" + renrenUser.toString()  );
//                        String renrenUserName, renrenSex, renrenUserHometown=null, renrenUnverseName=null;
//                        renrenUserName = renrenUser.getName();
//                        intent.putExtra("renrenUserName", renrenUserName);
//                        renrenSex = renrenUser.getSex()+"";
//                        intent.putExtra("renrenSex", renrenSex);
//                        ArrayList<HomeTownLocation> homeTownLocAry = renrenUser.getHomeTownLocation();
//                        if (homeTownLocAry != null && homeTownLocAry.size()>0){
//                            HomeTownLocation homeTownLoc = homeTownLocAry.get(0);
//                            renrenUserHometown = homeTownLoc.getProvince();
//                            intent.putExtra("renrenHometown", renrenUserHometown);
//                        }
//                        ArrayList<UniversityInfo> aryUnv = renrenUser.getUniversityInfo();
//                        if (aryUnv != null && aryUnv.size() > 0){
//                            UniversityInfo unv = aryUnv.get(aryUnv.size()-1);
//                            renrenUnverseName = unv.getName();
//                            intent.putExtra("renrenUnverseName", renrenUnverseName);
//                        }
//
//                        //startActivityForResult(intent, RENRENSIGNUP);
//                    }
//                });
            }

            @Override
            public void onRenrenError(final RenrenError renrenError) {
                LogUtils.Logd(LogTag.RENREN, "AbstractRequestListener<UsersGetInfoResponseBean>.onRenrenError err=" + renrenError.toString());
//                activity.runOnUiThread(new Runnable() {
//                    @Override
//                    public void run() {
//                        Toast.makeText(activity, "renren api err",Toast.LENGTH_SHORT).show();
//                    }
//                });
                msg.what = MessageID.RENRENSDK_getUsersInfo_Error;
                msg.obj = renrenError;
                msg.sendToTarget();
            }

            @Override
            public void onFault(final Throwable fault) {
                LogUtils.Logd(LogTag.RENREN, "AbstractRequestListener<UsersGetInfoResponseBean>.onFault fault=" + fault.toString());
//                activity.runOnUiThread(new Runnable() {
//                    @Override
//                    public void run() {
//                        Toast.makeText(activity, "renren api fault",Toast.LENGTH_SHORT).show();
//                    }
//                });
                msg.what = MessageID.RENRENSDK_getUsersInfo_Fault;
                msg.obj = fault;
                msg.sendToTarget();
            }
        };
        asyncRenren.getUsersInfo(param, renrenCallApiListener);
    }
}
