package com.lingzhimobile.tongqu.push;

import java.io.IOException;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import com.google.android.c2dm.C2DMBaseReceiver;
import com.lingzhimobile.tongqu.activity.MainTabActivity;
import com.lingzhimobile.tongqu.log.LogTag;
import com.lingzhimobile.tongqu.log.LogUtils;
import com.lingzhimobile.tongqu.net.HttpManager;
import com.lingzhimobile.tongqu.net.NetProtocol;
import com.lingzhimobile.tongqu.thread.ShowNotificationTask;
import com.lingzhimobile.tongqu.util.AppInfo;

/**
 * Broadcast receiver that handles Android Cloud to Data Messaging (AC2DM)
 * messages, initiated by the JumpNote App Engine server and routed/delivered by
 * Google AC2DM servers. The only currently defined message is 'sync'.
 */
public class C2DMReceiver extends C2DMBaseReceiver {
	public C2DMReceiver() {
		super(NetProtocol.C2DM_SENDER);
	}

	@Override
	public void onError(Context context, String errorId) {
	    LogUtils.Logd(LogTag.PUSH, errorId);
	}

	@Override
	protected void onMessage(Context context, Intent intent) {
	    AppInfo.init(context);
		String message = intent.getExtras().getString("message");
		LogUtils.Logd(LogTag.PUSH, "onMessage: " + message);
		SharedPreferences sp = getSharedPreferences(MainTabActivity.LOCAL_PUSH_FLAG, 0);
		if (sp.getBoolean("pushFlag", true)) {
			new ShowNotificationTask(context, message).start();
		}
	}

	public void onRegistered(Context context, String registrationId)
			throws IOException {
		LogUtils.Logd(LogTag.PUSH, "onRegistered()");
		AppInfo.init(context);
		MainTabActivity p = MainTabActivity.instance;
		// Object acc = p.selectedAccount;
		LogUtils.Logd(LogTag.PUSH,
				"onRegistered() sendRegistrationId");
		// NetworkCommunication.sendRegistrationId( acc, context, registrationId
		// );
		try {
			String result = HttpManager.registerDeviceToken(AppInfo.userId,
					registrationId);
			LogUtils.Logd(LogTag.PUSH, result);
			LogUtils.Logd(LogTag.PUSH,
					"onRegistered() p.onRegistered()");
			p.onRegistered();
			LogUtils.Logd(LogTag.PUSH, "onRegistered() done");
		} catch (Exception e) {
			LogUtils.Logd(LogTag.PUSH,
					"onRegistered() error:" + e.getMessage());
		}
	}

	public void onUnregistered(Context context) {
	    AppInfo.init(context);
		MainTabActivity.instance.onUnregistered();
	}

}
