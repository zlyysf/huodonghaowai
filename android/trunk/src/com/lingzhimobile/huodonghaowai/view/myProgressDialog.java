package com.lingzhimobile.huodonghaowai.view;

import android.app.AlertDialog;
import android.content.Context;
import android.os.Bundle;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.lingzhimobile.huodonghaowai.R;

public class myProgressDialog extends AlertDialog {
    private ProgressBar mProgress;
    private TextView mMessageView;
    private CharSequence mMessage;
    private boolean mIndeterminate;

    public myProgressDialog(Context context) {
        this(context,R.style.ProgressDialog);
    }
    
    public myProgressDialog(Context context, int theme) {
        super(context, theme);
    }
    public static myProgressDialog show(Context context, CharSequence title,
            int message) {
        return show(context, title, context.getText(message), false);
    }

    public static myProgressDialog show(Context context, CharSequence title,
            CharSequence message) {
        return show(context, title, message, false);
    }

    public static myProgressDialog show(Context context, CharSequence title,
            CharSequence message, boolean indeterminate) {
        return show(context, title, message, indeterminate, true, null);
    }

    public static myProgressDialog show(Context context, CharSequence title,
            CharSequence message, boolean indeterminate, boolean cancelable) {
        return show(context, title, message, indeterminate, cancelable, null);
    }
    
    public static myProgressDialog show(Context context, CharSequence title,
            CharSequence message, boolean indeterminate,
            boolean cancelable, OnCancelListener cancelListener) {
        myProgressDialog dialog = new myProgressDialog(context);
        dialog.setTitle(title);
        dialog.setMessage(message);
        dialog.setIndeterminate(indeterminate);
        dialog.setCancelable(cancelable);
        dialog.setOnCancelListener(cancelListener);
        dialog.show();
        return dialog;
    }
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.progress_dialog);
        mProgress = (ProgressBar) findViewById(R.id.progress);
        mMessageView = (TextView) findViewById(R.id.message);
       
        if (mMessage != null) {
            setMessage(mMessage);
        }
    }
    
    @Override
    public void setMessage(CharSequence message) {
        if (mProgress != null) {
            mMessageView.setText(message);
        } else {
            mMessage = message;
        }
    }
    public void setIndeterminate(boolean indeterminate) {
        if (mProgress != null) {
            mProgress.setIndeterminate(indeterminate);
        } else {
            mIndeterminate = indeterminate;
        }
    }

}
