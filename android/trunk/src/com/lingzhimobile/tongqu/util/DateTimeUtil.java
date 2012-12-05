package com.lingzhimobile.tongqu.util;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

import android.content.Context;
import android.content.res.Resources;
import android.text.format.DateUtils;

import com.lingzhimobile.tongqu.R;

public class DateTimeUtil {

    public static CharSequence getNextSlotInString(Context context, Calendar calendar) {
        Date newTime = calendar.getTime();
        
        Resources res = context.getResources();
        SimpleDateFormat df;
        df = new SimpleDateFormat(
                    res.getString(R.string.time_differentday_withminutes));
        return df.format(newTime);
    }

    public static Calendar getNextSlot(Context context) {
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(new Date());
        calendar.add(Calendar.MINUTE, 60-calendar.get(Calendar.MINUTE));
        return calendar;
    }
    
    public static String formatTime(Context context, long timeMillis){
        return DateUtils
        .formatDateTime(context,
                timeMillis,
                DateUtils.FORMAT_SHOW_TIME
                        | DateUtils.FORMAT_SHOW_DATE
                        | DateUtils.FORMAT_ABBREV_ALL);
    }

}
