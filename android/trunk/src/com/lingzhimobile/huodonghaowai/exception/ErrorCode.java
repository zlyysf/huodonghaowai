package com.lingzhimobile.huodonghaowai.exception;

import android.util.SparseArray;

import com.lingzhimobile.huodonghaowai.R;

public class ErrorCode {

    public final static SparseArray<Integer> errorMap = new SparseArray<Integer>();

    public final static int SERVER_RETURN_ERROR = 1100;





    static{
        errorMap.put(21010, R.string.err21010);
        errorMap.put(21011, R.string.err21010);
        errorMap.put(21012, R.string.err21010);
        errorMap.put(21013, R.string.err21010);
        errorMap.put(21020, R.string.err21020);
        errorMap.put(21021, R.string.err21021);
        errorMap.put(21022, R.string.err21022);
        errorMap.put(21023, R.string.err21023);
        errorMap.put(21024, R.string.err21024);
        errorMap.put(21030, R.string.err21030);
        errorMap.put(21040, R.string.err21040);
        errorMap.put(21041, R.string.err21041);
        errorMap.put(21042, R.string.err21042);
        errorMap.put(21043, R.string.err21043);
        errorMap.put(21050, R.string.err21050);
        errorMap.put(21051, R.string.err21051);
        errorMap.put(21060, R.string.err21060);
        errorMap.put(21070, R.string.err21070);
        errorMap.put(21071, R.string.err21071);
        errorMap.put(21072, R.string.err21072);
        errorMap.put(21044, R.string.err21044);
        errorMap.put(21045, R.string.err21045);
        errorMap.put(21082, R.string.err21082);
        errorMap.put(10021082, R.string.err10021082);

        errorMap.put(21083, R.string.err21083);
        errorMap.put(21084, R.string.err21083);
        errorMap.put(21087, R.string.err21087);
        errorMap.put(21211, R.string.err21211);
        errorMap.put(21210, R.string.err21210);
        errorMap.put(21212, R.string.err21212);

        errorMap.put(21300, R.string.err21300);
        errorMap.put(21301, R.string.err21301);
        errorMap.put(21302, R.string.err21302);
        errorMap.put(21303, R.string.err21303);
        errorMap.put(21304, R.string.err21304);
        errorMap.put(21305, R.string.err21305);
        errorMap.put(21306, R.string.err21306);

        errorMap.put(110000, R.string.terr110000);
        errorMap.put(110001, R.string.terr110001);
    }

}
