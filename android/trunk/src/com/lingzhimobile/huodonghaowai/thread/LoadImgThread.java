package com.lingzhimobile.huodonghaowai.thread;

import java.io.InputStream;
import java.io.Serializable;
import java.net.HttpURLConnection;
import java.net.URL;

import android.graphics.Bitmap;

import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.net.NetProtocol;
import com.lingzhimobile.huodonghaowai.util.ImageLoadUtil;
import com.lingzhimobile.huodonghaowai.util.MethodHandler;

public class LoadImgThread implements Runnable, Serializable {
    public final static int ConnectTimeOutTime = 30000;
    /**
     *
     */
    private static final long serialVersionUID = -5919639738216336319L;
    private final MethodHandler<Bitmap> handler;
    private String url;
    HttpURLConnection conn;
    InputStream is;

    public LoadImgThread(String url, MethodHandler<Bitmap> postHandler) {
        this.url = url;
        handler = postHandler;
    }


    public void cancel() {
        try {
            if (is != null) {
                is.close();
            }
            if (conn != null) {
                conn.disconnect();
            }
        } catch (Exception e) {
        } finally {
            is = null;
            conn = null;
        }
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || o.getClass() != this.getClass())
            return false;
        LoadImgThread t = (LoadImgThread) o;
        String u = t.getUrl();
        if (u == null || u.length() == 0)
            return false;
        return u.equals(url);
    }

    public String getUrl() {
        return url;
    }

    @Override
    public void run() {
        Bitmap bm = null;
        // if (isInterrupted())
        // return;
        if (url != null && url.length() > 0) {
            try {
                bm = ImageLoadUtil.readImg(url);
                // if (isInterrupted())
                // return;
                if (bm == null) {
                    String sUrl = url;
                    if (!sUrl.startsWith("http")){
                        sUrl = NetProtocol.IMAGE_BASE_URL+url;
                    }
                    LogUtils.Loge("ImageThread", sUrl);
                    URL mUrl = new URL(sUrl);
                    conn = (HttpURLConnection) mUrl
                            .openConnection();
                    conn.setConnectTimeout(ConnectTimeOutTime);
                    conn.setDoInput(true);
                    conn.connect();
                    // if (isInterrupted())
                    // return;
                    is = conn.getInputStream();
                    ImageLoadUtil.writeImg(url, is);
                    bm = ImageLoadUtil.readImg(url);
                    is.close();
                    LogUtils.Logd(LogTag.LOADIMAGE, url + " loaded.");
                }
            } catch (Exception e) {
                LogUtils.Loge(LogTag.LOADIMAGE, e.getMessage(), e);
            }
        }
        // if (isInterrupted())
        // return;
        if (bm != null && handler != null) {
            handler.process(bm);
        }
        // FIXME: set url to null in order to let clear it in ThreadPool.
        url = null;
    }

}
