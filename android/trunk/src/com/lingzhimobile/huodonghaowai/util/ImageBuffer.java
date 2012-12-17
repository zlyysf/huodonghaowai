package com.lingzhimobile.huodonghaowai.util;

import java.io.File;
import java.io.FileOutputStream;
import java.io.FilenameFilter;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.lang.ref.SoftReference;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import android.graphics.Bitmap;

import com.lingzhimobile.huodonghaowai.comparator.FileTimeComparator;
import com.lingzhimobile.huodonghaowai.log.LogTag;
import com.lingzhimobile.huodonghaowai.log.LogUtils;

/**
 * images buffer.
 * 
 */
public class ImageBuffer {
//	private static Context context;
	private static String bufferFolderPath = FileManager.ImageBufferFolder
			.getAbsolutePath();
	private static File bufferFolder = FileManager.ImageBufferFolder;

	public final static int MaxBufferSize = (int) (5 * 1024 * 1024);
	private static List<File> bufferImgs;
	private static int curBufferSize;

//	public final static int MaxMemorySize = (int) (10 * 1024 * 1024);
//	private static List<SoftReference<UrlBitmap>> memoryImgs;
	private static Map<String, SoftReference<Bitmap>> memoryImgs ;
//	public static int curMemorySize;

	static {
		initBuffer();
	}

	private static void initBuffer() {
		bufferImgs = new ArrayList<File>();
		File[] imgs = bufferFolder.listFiles(new FilenameFilter() {
			@Override
			public boolean accept(File dir, String filename) {
				if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")
						|| filename.endsWith(".gif")
						|| filename.endsWith(".png")
						|| filename.endsWith(".bmp"))
					return true;
				return false;
			}
		});
		curBufferSize = 0;
		for (File f : imgs) {
			bufferImgs.add(f);
			curBufferSize += f.length();
		}
		Collections.sort(bufferImgs, new FileTimeComparator());
		memoryImgs = new HashMap<String, SoftReference<Bitmap>>();
//		curMemorySize = 0;
	}

	private static Object writeLock = new Object();

	public static void writeImg(String url, InputStream is) {
		synchronized (writeLock) {
			String path = getPathFromUrl(url);
			File file = new File(path);
			if (file.exists())
				return;
			byte[] buffer = new byte[1024];
			try {
				OutputStream writer = new FileOutputStream(file);
				int len;
				while ((len = is.read(buffer)) > 0)
					writer.write(buffer, 0, len);
				writer.flush();
				writer.close();
				addFile(file);
			} catch (IOException e) {
				LogUtils.Loge(LogTag.DATABASE, "Error in writing img: " + url);
			}
		}
	}

	/**
	 * add a file to buffer
	 */
	private static void addFile(File file) {
		bufferImgs.add(file);
		curBufferSize += file.length();
		if (curBufferSize > MaxBufferSize)
			deleteFileByTime();
		LogUtils.Logd(LogTag.DATABASE, "Img write to file : " + file.getName());
		LogUtils.Logd(LogTag.DATABASE, "Current img files size: " + curBufferSize
				/ 1024 + " KB");
	}

	/**
	 * add a bitmap to memory
	 */
	private static void addUrlBitmap(String url, Bitmap bt) {
		memoryImgs.put(url, new SoftReference<Bitmap>(bt));
//		curMemorySize += ub.getImgSize();
//		if (curMemorySize > MaxMemorySize)
//			deleteHalfMemoryImg();
	}

	/**
	 * delete half files in buffer
	 */
	private static void deleteFileByTime() {
		LogUtils.Logd(LogTag.DATABASE, "Delete half img files.");
		int halfCount = bufferImgs.size() / 2;
		for (int i = 0; i < halfCount; i++) {
			curBufferSize -= bufferImgs.get(0).length();
			bufferImgs.get(0).delete();
			bufferImgs.remove(0);
		}
	}

//	/**
//	 * delete half reference in memory
//	 */
//	public static void deleteHalfMemoryImg() {
//		int halfCount = memoryImgs.size() / 2;
//		for (int i = 0; i < halfCount; i++) {
//		    if (memoryImgs.get(0).get() != null) {
//		        curMemorySize -= memoryImgs.get(0).get().getImgSize();
//	             SoftReference<UrlBitmap> sr = memoryImgs.remove(0);
//	             sr.get().getImg().recycle();
//            } else{
//                memoryImgs.remove(0);
//            }
//		}
//		LogUtils.Logd(LogTag.DATABASE, "Delete half memory imgs.");
//	}

	private static Object readLock = new Object();

	private static final int MaxSingleFileSize = 400 * 1024;
	
	private static final int MaxSingleGIFFileSize = 2 * 1024 * 1024;

	/***
	 * first try to read url from memory. if not exists then try to read it from
	 * buffer. if still not exists then return null.
	 */
	public static Bitmap readImg(String url) {
		if (url == null || url.length() == 0 ||"null".equals(url))
			return null;
		try {
			synchronized (readLock) {
				Bitmap ub = readImgFromMem(url);
				if (ub != null) {
					LogUtils.Logd(LogTag.DATABASE, "Read from memory: " + url);
					return ub;
				}
				String pathName = getPathFromUrl(url);
				File file = new File(pathName);
				if (!file.exists())
					return null;
				if (file.length() > MaxSingleFileSize
						&& !pathName.toLowerCase().endsWith("gif")
						|| file.length() > MaxSingleGIFFileSize) {
					LogUtils.Logd(
							LogTag.DATABASE,
							"File cannot be loaded, file size: "
									+ file.length() + ", file url:" + url);
					return null;
				}
				Bitmap bt = BitmapManager
						.getAppropriateBitmapFromFile(pathName);
				// Bitmap bt = BitmapFactory.decodeFile(pathName);

				if (bt != null) {
					if (bt.getWidth() <= 210) {
						addUrlBitmap(url, bt);
						LogUtils.Logd(LogTag.DATABASE, "Read from file: " + url);
					}
				} else {
					deleteFileFromBuffer(url);
					throw new Exception("Cannot decode " + url);
				}
				return bt;
			}
		} catch (OutOfMemoryError err) {
            LogUtils.Logd(LogTag.DATABASE, err.getMessage(), err);
		} catch (Exception e) {
			LogUtils.Loge(LogTag.DATABASE,
					"Error in reading " + url + ", Error: "
							+ e.getClass().toString() + " " + e.getMessage());
		}
		return null;
	}

	/**
	 * try to read img from memory
	 */
	private static Bitmap readImgFromMem(String url) {
	    SoftReference<Bitmap> res = memoryImgs.get(url);
		if (res == null) {
			 return null;
		}
		return res.get();
	}

//	/**
//	 * read img async, try to download it if the img doesn't exist in local.
//	 */
//	public static void readBitmapAsync(String url,
//			MethodHandler<UrlBitmap> handler) {
//		Bitmap bt = readImg(url);
//		if (bt == null) {
//			LoadImgThread thread = new LoadImgThread(url, handler);
//			thread.start();
//		} else
//			handler.process(new UrlBitmap(bt, url));
//	}

//	public static void deleteBitmap(String url) {
//		deleteFileFromMemory(url);
//		deleteFileFromBuffer(url);
//		String path = getPathFromUrl(url);
//		File file = new File(path);
//		file.delete();
//	}

//	private static void deleteFileFromMemory(String url) {
//		for (SoftReference<UrlBitmap> sr : memoryImgs) {
//			if (sr.get()!=null && sr.get().getUrl().equals(url)) {
//				memoryImgs.remove(sr);
//				curMemorySize -= sr.get().getImgSize();
//				sr.get().getImg().recycle();
//				sr.clear();
//				break;
//			}
//		}
//	}

	/**
	 * delete specified file by url.
	 * 
	 * @param url
	 */
	private static void deleteFileFromBuffer(String url) {
		String name = getNameFromUrl(url);
		File file = null;
		for (File f : bufferImgs)
			if (f.getName().equals(name)) {
				file = f;
				break;
			}
		if (file != null) {
			bufferImgs.remove(file);
			curBufferSize -= file.length();
			file.delete();
		}
	}

//	/**
//	 * read img async, try to download it if the img doesn't exist in local.
//	 */
	// public static void readSameBitmapAsync(String url,
	// MethodHandler<UrlBitmap> handler) {
	// Bitmap bt = readImg(url);
	// if (bt == null) {
	// LoadSameImgThread thread = new LoadSameImgThread(url, handler);
	// ThreadPool.execute(thread);
	// } else
	// handler.process(new UrlBitmap(bt, url));
	// }

	private static Pattern FileNamePattern = Pattern.compile("[^\\d\\w\\._]+");

	private static String getNameFromUrl(String url) {
		String res = url;
		Matcher m = FileNamePattern.matcher(res);
		res = m.replaceAll("_");
		return res;
	}

	public static String getPathFromUrl(String url) {
		// indicate the image is coming from upload firectory, not server
	    if (url.startsWith(FileManager.UploadFolder.getAbsolutePath()))
	        return url;
		return bufferFolderPath + "/" + getNameFromUrl(url);
	}
//	public static String getFilePathFromUrl(String url){
//	    return "file://" + getPathFromUrl(url);
//	}

}
