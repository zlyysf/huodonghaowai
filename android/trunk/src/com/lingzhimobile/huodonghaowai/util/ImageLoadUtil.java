package com.lingzhimobile.huodonghaowai.util;

import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.HashMap;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;

import android.graphics.Bitmap;

import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;
import com.lingzhimobile.huodonghaowai.thread.LoadImgThread;

public class ImageLoadUtil {
    private static final String LocalLogTag = LogTag.UTIL + " ImageLoadUtil";

	// static HashMap<String,Bitmap> buffer = new HashMap<String,Bitmap>();
	static ThreadPoolExecutor threadPool = new ThreadPoolExecutor(20, 40, 3,TimeUnit.SECONDS, new ArrayBlockingQueue<Runnable>(50),new ThreadPoolExecutor.DiscardOldestPolicy());
	public static HashMap<String,LoadImgThread> urlPool = new HashMap<String,LoadImgThread>();
	public static Bitmap loadImageFromURL(String url) {
		Bitmap bitmap = null;
		if (url != null && url.trim().length() > 0) {
			bitmap = ImageLoadUtil.readImg(url);
		}

		if (bitmap != null) {
			return bitmap;
		}

		URL mUrl;

		try {
			mUrl = new URL(url);

			HttpURLConnection conn = (HttpURLConnection) mUrl.openConnection();
			conn.setDoInput(true);
			conn.connect();
			InputStream is = conn.getInputStream();
			ImageLoadUtil.writeImg(url, is);
			bitmap = ImageLoadUtil.readImg(url);
			is.close();
		} catch (MalformedURLException e) {
			LogUtils.Logd(LogTag.LOADIMAGE, e.getMessage(), e);
		} catch (IOException e) {
			LogUtils.Logd(LogTag.LOADIMAGE, e.getMessage(), e);
		} catch (Exception e) {
			LogUtils.Logd(LogTag.LOADIMAGE, e.getMessage(), e);
		}
		return bitmap;

	}

	public static void readBitmapAsync(String url,
			MethodHandler<Bitmap> handler) {
		if (url == null || url.length() == 0 ||"null".equals(url))
			return;
		LogUtils.Logd(LocalLogTag, "readBitmapAsync enter, url="+url);
		Bitmap bt = ImageLoadUtil.readImg(url);
		if (bt == null) {
                LoadImgThread thread = new LoadImgThread(url, handler);
                threadPool.execute(thread);
                if (!urlPool.containsKey(url)) {
                    urlPool.put(url, thread);
                }
		} else {
            if (handler != null) {
                handler.process(bt);
            }
        }
	}

	public static Bitmap readImg(String url) {
        return ImageBuffer.readImg(url);
	}

	public static void writeImg(String url, InputStream is) {
	    ImageBuffer.writeImg( url, is);
		urlPool.remove(url);
	}
	public static void removeThread(String url){
	    if(url != null && urlPool.get(url) != null){
	    	 LoadImgThread thread = urlPool.remove(url);
		     thread.cancel();
		     LogUtils.Logd(LogTag.LOADIMAGE,"Before purge ActiveCount:"+threadPool.getActiveCount()+" ---CompleteCount:"+threadPool.getCompletedTaskCount()+" ---TaskCount"+threadPool.getTaskCount() );
	    	 LogUtils.Loge(LogTag.LOADIMAGE, "removeThread"+url);
		     threadPool.remove(urlPool.get(url));
		     threadPool.purge();
		     LogUtils.Logd(LogTag.LOADIMAGE,"After purge ActiveCount:"+threadPool.getActiveCount()+" ---CompleteCount:"+threadPool.getCompletedTaskCount()+" ---TaskCount"+threadPool.getTaskCount() );
	    }
	}
}
