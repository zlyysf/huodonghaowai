package com.lingzhimobile.huodonghaowai.util;

import java.io.File;

import android.content.Context;
import android.os.Environment;

public class FileManager {
	public static final File EmptyFile = new File("/empty/");

	private static String FileFolderName = ".prettyrichtemp";
	public static boolean avaiableMedia() {
		String status = Environment.getExternalStorageState();
		if (status.equals(Environment.MEDIA_MOUNTED)) {
			return true;
		} else {
			return false;
		}
	}
	private static boolean hasSDCard = avaiableMedia();

	public static File DownloadFolder;
	private static String DownloadFolderName = "download";

	public static File ImageBufferFolder;
	private static String ImageBufferFolderName = "imgbuffer";

	public static File UploadFolder;
	private static String UploadFolderName = "upload";

	public static void init(Context context) {
		if (null != DownloadFolder && DownloadFolder.exists()
				&& null != ImageBufferFolder && ImageBufferFolder.exists()
				&& null != UploadFolder && UploadFolder.exists()) {
			return;
		}
		if (hasSDCard) {
			File FileFolder = new File(
					Environment.getExternalStorageDirectory(), FileFolderName);
			if (!FileFolder.exists())
				FileFolder.mkdir();
			DownloadFolder = new File(
					Environment.getExternalStorageDirectory(), FileFolderName
							+ File.separator + DownloadFolderName);
			ImageBufferFolder = new File(
					Environment.getExternalStorageDirectory(), FileFolderName
							+ File.separator + ImageBufferFolderName);
			UploadFolder = new File(Environment.getExternalStorageDirectory(),
					FileFolderName + File.separator + UploadFolderName);
		} else {
			DownloadFolder = EmptyFile;
			ImageBufferFolder = context.getDir(ImageBufferFolderName,
					Context.MODE_PRIVATE);
			UploadFolder = context.getDir(UploadFolderName,
					Context.MODE_PRIVATE);
		}

		if (DownloadFolder != null && !DownloadFolder.exists()) {
			DownloadFolder.mkdir();
			// initNoMedia(DownloadFolder);
		}
		if (ImageBufferFolder != null && !ImageBufferFolder.exists()) {
			ImageBufferFolder.mkdir();
			// initNoMedia(ImageBufferFolder);
		}
		if (UploadFolder != null && !UploadFolder.exists()) {
			UploadFolder.mkdir();
			// initNoMedia(UploadFolder);
		}

	}

	/*
	private static void initNoMedia(File folder) {
		File nomedia = new File(folder, "/.nomedia");
		try {
			if (!nomedia.exists())
				nomedia.createNewFile();
		} catch (IOException e) {
		}
	}
	*/

//	private static final int MAX_BUFFER_SIZE = 64 * 1024;
//	private static final int BUFFE_LEN = 10 * 1024;
//	private static byte[] buffer = new byte[MAX_BUFFER_SIZE];
//	private static Object readFileLock = new Object();

//	public static String readFileContent(InputStream in) {
//		synchronized (readFileLock) {
//			int len = 0, totalLen = 0;
//			try {
//				while ((len = in.read(buffer, len, BUFFE_LEN)) > 0)
//					totalLen += len;
//				return new String(buffer, 0, totalLen);
//			} catch (IOException e) {
//			}
//		}
//		return null;
//	}

//	public static String readFileContent(File file) {
//		try {
//			return readFileContent(new FileInputStream(file));
//		} catch (FileNotFoundException e) {
//		}
//		return null;
//	}


}
