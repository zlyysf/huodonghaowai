package com.lingzhimobile.tongqu.net;

public class NetProtocol {

    private static final String DOMAIN_URL_PROD = "42.121.122.47";//"ec2-23-23-144-110.compute-1.amazonaws.com";
    private static final String DOMAIN_URL_STAGE = "42.121.122.47";// "ec2-23-21-136-120.compute-1.amazonaws.com";

    private static final String DOMAIN_URL = DOMAIN_URL_PROD;

    public static final String HTTP_REQUEST_URL = "http://" + DOMAIN_URL
            + ":4000/";
    public static final String HTTPS_REQUEST_URL = "https://" + DOMAIN_URL
            + ":4010/";

    public static final String IMAGE_BASE_URL = "http://oss.aliyuncs.com/ysf1/";//"http://s3.amazonaws.com/ysf1/";

    public static final String C2DM_SENDER = "lingzhimobile@gmail.com";

    //    private static final String DOMAIN_URL_OFFICE = "120.72.49.66";
    //    private static final String DOMAIN_URL_SG = "ec2-175-41-184-239.ap-southeast-1.compute.amazonaws.com";
    //    public static final String WEB_SOCKET_URL = "ws://" + DOMAIN_URL + ":4000";
    
}
