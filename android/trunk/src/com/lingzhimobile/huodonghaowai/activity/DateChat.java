package com.lingzhimobile.huodonghaowai.activity;

import java.util.ArrayList;
import java.util.Date;

import android.app.Dialog;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Bitmap;
import android.os.Bundle;
import android.os.Handler;
import android.os.Message;
import android.text.TextUtils;
import android.view.View;
import android.view.inputmethod.InputMethodManager;
import android.widget.AbsListView;
import android.widget.AbsListView.OnScrollListener;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.TextView;

import com.lingzhimobile.huodonghaowai.R;
import com.lingzhimobile.huodonghaowai.adapter.ChatItemAdapter;
import com.lingzhimobile.huodonghaowai.asynctask.ConfirmDateTask;
import com.lingzhimobile.huodonghaowai.asynctask.GetMessageHistory;
import com.lingzhimobile.huodonghaowai.asynctask.RateUserTask;
import com.lingzhimobile.huodonghaowai.asynctask.SendMessageTask;
import com.lingzhimobile.huodonghaowai.cons.MessageID;
import com.lingzhimobile.huodonghaowai.fragment.DateListFragment;
import com.lingzhimobile.huodonghaowai.model.ConversationItem;
import com.lingzhimobile.huodonghaowai.model.DateListItem;
import com.lingzhimobile.huodonghaowai.model.MessageItem;
import com.lingzhimobile.huodonghaowai.pulltorefresh.PullToRefreshListView;
import com.lingzhimobile.huodonghaowai.pulltorefresh.PullToRefreshBase.Mode;
import com.lingzhimobile.huodonghaowai.pulltorefresh.PullToRefreshBase.OnRefreshListener;
import com.lingzhimobile.huodonghaowai.util.AppInfo;
import com.lingzhimobile.huodonghaowai.util.AppUtil;
import com.lingzhimobile.huodonghaowai.util.GlobalValue;
import com.lingzhimobile.huodonghaowai.util.ImageLoadUtil;
import com.lingzhimobile.huodonghaowai.util.MethodHandler;
import com.lingzhimobile.huodonghaowai.view.ResizableLayout;
import com.lingzhimobile.huodonghaowai.view.myProgressDialog;
import com.lingzhimobile.huodonghaowai.view.ResizableLayout.OnResizeListener;

public class DateChat extends HuoDongHaoWaiActivity {
    public static Object chat_write_lock = new Object();
    private BroadcastReceiver mInternalReceiver;
    private GetMessageHistory getMessageHistory;
    ArrayList<MessageItem> messages;
    PullToRefreshListView bouncyRefreshViewChat;
    ChatItemAdapter chatItemAdapter;
    private Button btnSend;
    private Button btnConfirm;
    private EditText etMessage;
    private ResizableLayout llDateChat;
    private String targetUserId;
    private String targetUserName;
    private String dateId;
    private int parentIndex;
    private int childIndex;
    private int groupPosition;
    private int childPosition;
    private DateListItem dateItem;
    private ConversationItem conversationItem;
    private String fromType;
    private boolean inBottom = false;
    private boolean statusLoadMore;
    private Dialog dialog;
    private Button btnBack;
    private TextView tvUserName;
    private ImageView ivDatePhoto;
    private ArrayList<DateListItem> tempDates;
    private myProgressDialog mProgressDialog;
    private MessageItem temp;
    public Handler myHandler = new Handler() {
        @SuppressWarnings("unchecked")
        @Override
        public void handleMessage(Message msg) {
            super.handleMessage(msg);
            if (DateChat.this.isFinishing()) {
                return;
            }
            switch (msg.what) {
            case MessageID.SERVER_RETURN_NULL:
                bouncyRefreshViewChat.onRefreshComplete();
                AppUtil.handleErrorCode(msg.obj.toString(), DateChat.this);
                break;
            case MessageID.GET_HISTORY_MESSAGES_OK:
                messages.addAll(0,(ArrayList<MessageItem>) msg.obj);
                chatItemAdapter.notifyDataSetChanged();
                bouncyRefreshViewChat.onRefreshComplete();
                if (!statusLoadMore) {
                    bouncyRefreshViewChat.getRefreshableView().setSelection(
                            messages.size() - 1);
                }
                inBottom = true;
                break;
            case MessageID.SEND_MESSAGE_OK:
                int itemIndex = msg.arg1;
                ArrayList<String> result = (ArrayList<String>) msg.obj;
                if (itemIndex < messages.size()) {
                    temp.setMessageId(result.get(0));
                    temp.setCreateTime(Long.parseLong(result.get(1)));
                    chatItemAdapter.notifyDataSetChanged();
                }
                if (DateListFragment.TYPE_SEND.equals(fromType)) {
                    dateItem.getResponders().get(groupPosition)
                            .get(childPosition).setLatestMessage(temp);
                } else if (DateListFragment.TYPE_INVITED.equals(fromType)) {
                    dateItem.getResponses().get(0).setLatestMessage(temp);
                } else if (DateListFragment.TYPE_APPLY.equals(fromType)) {
                    dateItem.getResponses().get(0).setLatestMessage(temp);
                }
                break;
            case 100:
                bouncyRefreshViewChat.getRefreshableView().setSelection(
                        chatItemAdapter.getCount() - 1);
                break;
            case MessageID.CONFIRM_DATE_OK:
                // showAlertDialog();
                mProgressDialog.dismiss();
                boolean flag = (Boolean) msg.obj;
                if (flag) {
                    dateItem.setConfirmedPersonCount(dateItem
                            .getConfirmedPersonCount() - 1);
                } else {
                    dateItem.setConfirmedPersonCount(dateItem
                            .getConfirmedPersonCount() + 1);
                }
                dateItem.getResponders().get(groupPosition).get(childPosition)
                        .setSenderConfirmed(!flag);
                setConfirmButton();
                break;

            case MessageID.RATE_USER_OK:
                mProgressDialog.dismiss();
                btnConfirm.setEnabled(false);
                if (DateListFragment.TYPE_SEND.equals(fromType)) {
                    dateItem.getResponders().get(groupPosition)
                            .get(childPosition).setHaveBeenRated(true);
                } else if (DateListFragment.TYPE_INVITED.equals(fromType)) {
                    dateItem.getResponses().get(0).setHaveRated(true);
                }
                break;

            }

        }
    };

    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.datechat);
        prepareData();
        setView();
        setListener();
        // initPopupWindow();
    }

    private void prepareData() {
        btnConfirm = (Button) findViewById(R.id.btnConfirm);
        etMessage = (EditText) findViewById(R.id.editText1);
        mInternalReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if ("com.receiver.newchatmessages".equals(intent.getAction())) {
                    chatItemAdapter.notifyDataSetChanged();
                    bouncyRefreshViewChat.getRefreshableView().setSelection(
                            messages.size() - 1);
                } else if ("com.receiver.newdateconfirm".equals(intent
                        .getAction())) {
                    chatItemAdapter.notifyDataSetChanged();
                    bouncyRefreshViewChat.getRefreshableView().setSelection(
                            messages.size() - 1);
                    if (dateItem != null) {
                        dateItem.getResponses().get(0).setSenderConfirmed(true);
                        setCommentButton();
                    }

                } else if ("com.receiver.datecancel".equals(intent.getAction())) {
                    chatItemAdapter.notifyDataSetChanged();
                    bouncyRefreshViewChat.getRefreshableView().setSelection(
                            messages.size() - 1);
                    if (dateItem != null) {
                        dateItem.getResponses().get(0)
                                .setSenderConfirmed(false);
                        setCommentButton();
                    }
                }
            }
        };
        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction("com.receiver.newchatmessages");
        intentFilter.addAction("com.receiver.newdateconfirm");
        intentFilter.addAction("com.receiver.datecancel");
        registerReceiver(mInternalReceiver, intentFilter);

        messages = new ArrayList<MessageItem>();
        if (getIntent().getBooleanExtra("isJumpFromNotification", false)) {
            dateId = getIntent().getStringExtra("dateId");
            targetUserId = getIntent().getStringExtra("targetUserId");
            targetUserName = getIntent().getStringExtra("targetUserName");
            btnConfirm.setVisibility(View.GONE);
        } else {
            fromType = getIntent().getStringExtra("fromType");
            if (DateListFragment.TYPE_SEND.equals(fromType)) {
                tempDates = GlobalValue.sendDates;
                parentIndex = getIntent().getIntExtra("parentIndex", 0);
                groupPosition = getIntent().getIntExtra("groupPosition", 0);
                childPosition = getIntent().getIntExtra("childPosition", 0);
                dateItem = tempDates.get(parentIndex);
                targetUserId = dateItem.getResponders().get(groupPosition)
                        .get(childPosition).getUserId();
                targetUserName = dateItem.getResponders().get(groupPosition)
                        .get(childPosition).getName();
                setConfirmButton();
                etMessage.setHint("");
            } else if (DateListFragment.TYPE_INVITED.equals(fromType)) {
                tempDates = GlobalValue.invitedDates;
                childIndex = getIntent().getIntExtra("itemIndex", 0);
                dateItem = tempDates.get(childIndex);
                targetUserId = dateItem.getSender().getUserId();
                targetUserName = dateItem.getSender().getName();
                setCommentButton();

            } else if (DateListFragment.TYPE_APPLY.equals(fromType)) {
                tempDates = GlobalValue.applyDates;
                childIndex = getIntent().getIntExtra("itemIndex", 0);
                dateItem = tempDates.get(childIndex);
                targetUserId = dateItem.getSender().getUserId();
                targetUserName = dateItem.getSender().getName();
                btnConfirm.setVisibility(View.GONE);

            }
            // else if (Conversations.TYPE_CONVERSATIONS.equals(fromType)) {
            // childIndex = getIntent().getIntExtra("itemIndex", 0);
            // conversationItem = GlobalValue.conversationList.get(childIndex);
            // dateItem = conversationItem.getDate();
            // targetUserId = conversationItem.getTargetUser().getUserId();
            // targetUserName = conversationItem.getTargetUser().getName();
            // if (dateItem.getSenderId().equals(AppInfo.userId)) {
            // if (conversationItem.isSenderConfirmed()) {
            // setCommentButton();
            // if (conversationItem.isHaveRated()) {
            // btnConfirm.setEnabled(false);
            // }
            // } else {
            // setConfirmButton();
            // }
            // } else {
            // setCommentButton();
            // if (conversationItem.isHaveRated()) {
            // btnConfirm.setEnabled(false);
            // }
            // }
            // } else if (Nearby.TYPE_NEARBY.equals(fromType)) {
            // childIndex = getIntent().getIntExtra("itemIndex", 0);
            // dateItem = GlobalValue.nearbyDates.get(childIndex);
            // targetUserId = dateItem.getSender().getUserId();
            // targetUserName = dateItem.getSender().getName();
            // setCommentButton();
            // btnConfirm.setEnabled(false);
            // }
            dateId = dateItem.getDateId();
        }
        getMessageHistory = new GetMessageHistory(AppInfo.userId, -1, 10,
                dateId, targetUserId, myHandler.obtainMessage());
        getMessageHistory.execute();

        GlobalValue.currentChatUserAndDateId = targetUserId + dateId;
        if (GlobalValue.chatHistory
                .containsKey(GlobalValue.currentChatUserAndDateId)) {
            GlobalValue.chatHistory
                    .remove(GlobalValue.currentChatUserAndDateId);
        }
        GlobalValue.chatHistory.put(GlobalValue.currentChatUserAndDateId,
                messages);
    }

    void setView() {
        dialog = new Dialog(this, R.style.AlertDialog);
        btnBack = (Button) findViewById(R.id.btnCancel);
        tvUserName = (TextView) findViewById(R.id.tvUserName);
        tvUserName.setText(targetUserName);
        bouncyRefreshViewChat = (PullToRefreshListView) findViewById(R.id.chathistoryListView);
        bouncyRefreshViewChat.setMode(Mode.PULL_DOWN_TO_REFRESH);
        bouncyRefreshViewChat.setPullLabel(
                getString(R.string.pull_to_load_earlier_pull_label), null,
                Mode.PULL_DOWN_TO_REFRESH);
        bouncyRefreshViewChat.setLoadingLayoutBg(R.color.transparent);
        bouncyRefreshViewChat.setReleaseLabel(
                getString(R.string.pull_to_load_earlier_release_label),
                Mode.PULL_DOWN_TO_REFRESH);

        bouncyRefreshViewChat.setLastUpdatedLabel(AppUtil
                .getStringFromId(R.string.last_update)
                + new Date().toLocaleString());
        chatItemAdapter = new ChatItemAdapter(this, messages);
        llDateChat = (ResizableLayout) findViewById(R.id.llDateChat);
        bouncyRefreshViewChat.getRefreshableView().setAdapter(chatItemAdapter);
        btnSend = (Button) findViewById(R.id.btnSend);
        ivDatePhoto = (ImageView) findViewById(R.id.ivDatePhoto);
        if (!getIntent().getBooleanExtra("isJumpFromNotification", false)) {
            if (dateItem.getSenderId().equals(AppInfo.userId)) {
                if (TextUtils.isEmpty(dateItem.getResponders()
                        .get(groupPosition).get(childPosition).getPhotoPath())) {
                    if (!TextUtils.isEmpty(dateItem.getPhotoPath())) {
                        Bitmap bmDatePhoto = dateItem.getBitmap();
                        if (bmDatePhoto != null) {
                            ivDatePhoto.setImageBitmap(bmDatePhoto);
                        } else {
                            ivDatePhoto.setTag(dateItem.getPhotoPath());
                            dateItem.getPostBitmapAsync(new MethodHandler<Bitmap>() {
                                public void process(Bitmap para) {
                                    Message msg = refreshImgHandler
                                            .obtainMessage(0, ivDatePhoto);
                                    refreshImgHandler.sendMessage(msg);
                                }
                            });
                        }
                    }
                } else {
                    Bitmap bmDatePhoto = ImageLoadUtil.readImg(dateItem
                            .getResponders().get(groupPosition)
                            .get(childPosition).getPhotoPath());
                    if (bmDatePhoto != null) {
                        ivDatePhoto.setImageBitmap(bmDatePhoto);
                    } else {
                        ivDatePhoto.setTag(dateItem.getResponders()
                                .get(groupPosition).get(childPosition)
                                .getPhotoPath());
                        ImageLoadUtil.readBitmapAsync(dateItem.getResponders()
                                .get(groupPosition).get(childPosition)
                                .getPhotoPath(), new MethodHandler<Bitmap>() {
                            public void process(Bitmap para) {
                                Message msg = refreshImgHandler1.obtainMessage(
                                        0, ivDatePhoto);
                                refreshImgHandler1.sendMessage(msg);
                            }
                        });
                    }
                }

            } else {
                if (!TextUtils.isEmpty(dateItem.getSender()
                        .getPrimaryPhotoPath())) {
                    Bitmap bmDatePhoto = dateItem.getSender().getBitmap();
                    if (bmDatePhoto != null) {
                        ivDatePhoto.setImageBitmap(bmDatePhoto);
                    } else {
                        ivDatePhoto.setTag(dateItem.getSender()
                                .getPrimaryPhotoPath());
                        dateItem.getSender().getPostBitmapAsync(
                                new MethodHandler<Bitmap>() {
                                    public void process(Bitmap para) {
                                        Message msg = refreshImgHandler2
                                                .obtainMessage(0, ivDatePhoto);
                                        refreshImgHandler2.sendMessage(msg);
                                    }
                                });
                    }
                } else {
                    if (!TextUtils.isEmpty(dateItem.getPhotoPath())) {
                        Bitmap bmDatePhoto = dateItem.getBitmap();
                        if (bmDatePhoto != null) {
                            ivDatePhoto.setImageBitmap(bmDatePhoto);
                        } else {
                            ivDatePhoto.setTag(dateItem.getPhotoPath());
                            dateItem.getPostBitmapAsync(new MethodHandler<Bitmap>() {
                                public void process(Bitmap para) {
                                    Message msg = refreshImgHandler
                                            .obtainMessage(0, ivDatePhoto);
                                    refreshImgHandler.sendMessage(msg);
                                }
                            });
                        }
                    }
                }
            }
        }
    }

    void setListener() {
        btnSend.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                String datePlan = etMessage.getText().toString();
                if (datePlan != null)
                    datePlan = datePlan.trim();
                if (TextUtils.isEmpty(datePlan)) {
                    return;
                }
                // if ("".equals(etMessage.getText().toString())) {
                // return;
                // }
                ((InputMethodManager) getSystemService(INPUT_METHOD_SERVICE))
                        .hideSoftInputFromWindow(DateChat.this
                                .getCurrentFocus().getWindowToken(),
                                InputMethodManager.HIDE_NOT_ALWAYS);
                synchronized (chat_write_lock) {
                    temp = new MessageItem();
                    temp.setMessageText(datePlan);
                    temp.setSenderId(AppInfo.userId);
                    temp.setSenderName(AppInfo.userName);
                    temp.setSenderPhotoPath(AppInfo.userPhoto);
                    temp.setCreateTime(-1);
                    messages.add(temp);
                    chatItemAdapter.notifyDataSetChanged();
                    bouncyRefreshViewChat.getRefreshableView().setSelection(
                            messages.size() - 1);
                    new SendMessageTask(AppInfo.userId, datePlan, dateId, targetUserId,
                            messages.size() - 1, myHandler.obtainMessage())
                            .execute();
                    etMessage.setText(null);
                }
            }
        });

        llDateChat.setOnResizeListener(new OnResizeListener() {

            @Override
            public void OnActionResize() {
                if (inBottom) {
                    myHandler.sendEmptyMessage(100);
                }
            }
        });
        bouncyRefreshViewChat.getRefreshableView().setOnScrollListener(
                new OnScrollListener() {

                    @Override
                    public void onScrollStateChanged(AbsListView view,
                            int scrollState) {

                    }

                    @Override
                    public void onScroll(AbsListView view,
                            int firstVisibleItem, int visibleItemCount,
                            int totalItemCount) {
                        inBottom = (bouncyRefreshViewChat.getRefreshableView()
                                .getLastVisiblePosition() + 1 == totalItemCount);
                    }
                });
        bouncyRefreshViewChat.setOnRefreshListener(new OnRefreshListener() {

            @Override
            public void onRefresh() {
                if (messages.size() > 1) {
                    bouncyRefreshViewChat
                            .setLastUpdatedLabel(getString(R.string.last_update)
                                    + new Date().toLocaleString());
                    statusLoadMore = true;
                    getMessageHistory = new GetMessageHistory(AppInfo.userId,
                            messages.get(0).getCreateTime() - 1, 10, dateId,
                            targetUserId, myHandler.obtainMessage());
                    getMessageHistory.execute();
                } else {
                    bouncyRefreshViewChat.onRefreshComplete();
                }
            }
        });
        btnBack.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                finish();
            }
        });
    }

    public void showAlertDialog() {
        View dialogview = this.getLayoutInflater().inflate(
                R.layout.spendcreditsdialog, null);
        Button btnOK = (Button) dialogview.findViewById(R.id.btnOk);
        Button btnCancel = (Button) dialogview.findViewById(R.id.btnCancel);
        btnCancel.setVisibility(View.GONE);
        TextView tvNotify = (TextView) dialogview
                .findViewById(R.id.tvNotifyText);
        tvNotify.setText(R.string.receiver_confirmed);
        btnOK.setOnClickListener(new View.OnClickListener() {

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

    public void showConfirmAlertDialog(final boolean beCancel) {
        View dialogview = this.getLayoutInflater().inflate(
                R.layout.spendcreditsdialog, null);
        TextView tvNotify = (TextView) dialogview
                .findViewById(R.id.tvNotifyText);
        if (beCancel) {
            tvNotify.setText(R.string.cancel_date_alert);
        } else {
            tvNotify.setText(R.string.confirm_date_alert);
        }
        Button btnOK = (Button) dialogview.findViewById(R.id.btnOk);
        Button btnCancel = (Button) dialogview.findViewById(R.id.btnCancel);
        btnOK.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                mProgressDialog = myProgressDialog.show(DateChat.this, null,
                        R.string.loading);
                new ConfirmDateTask(AppInfo.userId, dateId, targetUserId, beCancel, myHandler
                        .obtainMessage()).execute();
                dialog.dismiss();
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

    public void showCommentAlertDialog() {
        View dialogview = this.getLayoutInflater().inflate(
                R.layout.spendcreditsdialog, null);
        TextView tvNotify = (TextView) dialogview
                .findViewById(R.id.tvNotifyText);
        tvNotify.setText(R.string.comment_alert);
        Button btnOK = (Button) dialogview.findViewById(R.id.btnOk);
        Button btnCancel = (Button) dialogview.findViewById(R.id.btnCancel);
        btnOK.setText(R.string.comment_good);
        btnCancel.setText(R.string.comment_next_time);
        btnOK.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                mProgressDialog = myProgressDialog.show(DateChat.this, null,
                        R.string.loading);
                new RateUserTask(AppInfo.userId, dateId, targetUserId, "good", myHandler
                        .obtainMessage()).execute();
                dialog.dismiss();
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

    @Override
    protected void onStop() {
        super.onStop();
        GlobalValue.currentChatUserAndDateId = null;
    }

    @Override
    protected void onStart() {
        super.onStart();
        GlobalValue.currentChatUserAndDateId = this.targetUserId + dateId;
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (getMessageHistory != null) {
            getMessageHistory.cancel(true);
            getMessageHistory = null;
        }
        try {
            unregisterReceiver(mInternalReceiver);
        } catch (Exception e) {

        }
    }

    private void setConfirmButton() {
        if (dateItem.getResponders().get(groupPosition).get(childPosition)
                .isSenderConfirmed()) {
            btnConfirm.setText(R.string.cancel_add);
            if (System.currentTimeMillis() > dateItem.getDateDate()) {
                btnConfirm.setText(R.string.rate);
                if (dateItem.getResponders().get(groupPosition)
                        .get(childPosition).isHaveBeenRated()) {
                    btnConfirm.setEnabled(false);
                    return;
                } else {
                    btnConfirm.setOnClickListener(new View.OnClickListener() {

                        @Override
                        public void onClick(View v) {
                            showCommentAlertDialog();
                        }
                    });
                    return;
                }
            }
        } else {
            btnConfirm.setText(R.string.confirm_add);
            if (System.currentTimeMillis() > dateItem.getDateDate()) {
                btnConfirm.setVisibility(View.GONE);
            }
        }

        btnConfirm.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                showConfirmAlertDialog(dateItem.getResponders().get(groupPosition)
                        .get(childPosition).isSenderConfirmed());
            }
        });
    }

    private void setCommentButton() {
        if (!dateItem.getResponses().get(0).isSenderConfirmed()
                || System.currentTimeMillis() < dateItem.getDateDate()) {
            btnConfirm.setEnabled(false);
            return;
        }
        btnConfirm.setText(R.string.rate);
        if (dateItem.getResponses().get(0).isHaveRated()) {
            btnConfirm.setEnabled(false);
            return;
        } else {
            btnConfirm.setEnabled(true);
        }
        btnConfirm.setOnClickListener(new View.OnClickListener() {

            @Override
            public void onClick(View v) {
                showCommentAlertDialog();
            }
        });
    }

    Handler refreshImgHandler = new Handler() {
        public void handleMessage(android.os.Message msg) {
            ImageView iv = (ImageView) msg.obj;
            if (iv != null && dateItem.getPhotoPath().equals(iv.getTag())) {
                iv.setImageBitmap(dateItem.getBitmap());
            }
        };
    };
    Handler refreshImgHandler1 = new Handler() {
        public void handleMessage(android.os.Message msg) {
            ImageView iv = (ImageView) msg.obj;
            if (iv != null
                    && dateItem.getResponders().get(groupPosition)
                            .get(childPosition).getPhotoPath()
                            .equals(iv.getTag())) {
                iv.setImageBitmap(dateItem.getResponders().get(groupPosition)
                        .get(childPosition).getBitmap());
            }
        };
    };
    Handler refreshImgHandler2 = new Handler() {
        public void handleMessage(android.os.Message msg) {
            ImageView iv = (ImageView) msg.obj;
            if (iv != null
                    && dateItem.getSender().getPrimaryPhotoPath()
                            .equals(iv.getTag())) {
                iv.setImageBitmap(dateItem.getSender().getBitmap());
            }
        };
    };

}
