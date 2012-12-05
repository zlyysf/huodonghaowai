package com.lingzhimobile.tongqu.util;

import java.util.HashMap;

public class NotificationUtil {
    public static HashMap<String, Integer> NotificationFlag = new HashMap<String, Integer>();
    public static int Flags = 10000;
    public static int ResponseFlags = 100;
    
    public static int getFlag(String key){
        if(NotificationFlag.containsKey(key)){
            return NotificationFlag.get(key);
        }else{
            Flags++;
            NotificationFlag.put(key, Flags);
            return Flags;
        }
    }
    public static int getResponseFlag(){
        return ResponseFlags++;
    }

}
