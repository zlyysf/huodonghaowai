package com.lingzhimobile.huodonghaowai.util;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.InputStream;

import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.BitmapFactory.Options;
import android.net.Uri;

public class BitmapManager {
	// For head img
	public static final int MAX_HEAD_SCALE = 256 * 256;
	// For status img
	public static final int MAX_STATUS_SCALE = 768 * 768;

	public static final int MAX_FILE_SIZE = 1024 * 100;

	public static final int compressRatio = 60;

	public static Bitmap getAppropriateBitmapFromStream(Context context, Uri uri)
			throws OutOfMemoryError, FileNotFoundException {
		InputStream input = context.getContentResolver().openInputStream(uri);
		BitmapFactory.Options opts = new BitmapFactory.Options();
		opts.inJustDecodeBounds = true;
		BitmapFactory.decodeStream(input, null, opts);

		opts.inSampleSize = computeSampleSize(opts, -1, 800 * 800);
		opts.inJustDecodeBounds = false;
		return BitmapFactory.decodeStream(context.getContentResolver()
				.openInputStream(uri), null, opts);
		/*
		 * int realWidth = opts.outWidth; int realHeight = opts.outHeight; int
		 * realSize = realWidth * realHeight;
		 * 
		 * int stepSize = maxScale; int sampleSize = 1; while (realSize >
		 * stepSize) { sampleSize <<= 1; stepSize <<= 2; }
		 * 
		 * opts.inJustDecodeBounds = false; opts.inSampleSize = sampleSize;
		 * 
		 * Bitmap bitmap = null; try { bitmap =
		 * BitmapFactory.decodeStream(context.getContentResolver()
		 * .openInputStream(uri), null, opts); } catch (FileNotFoundException e)
		 * { }
		 * 
		 * return new CompressedBitmap(bitmap, sampleSize);
		 */
	}

	public static Bitmap getAppropriateBitmapFromFile(String pathname)
			throws OutOfMemoryError {
		BitmapFactory.Options opts = new BitmapFactory.Options();
		opts.inJustDecodeBounds = true;
		BitmapFactory.decodeFile(pathname, opts);
		opts.inSampleSize = computeSampleSize(opts, -1, 800 * 800);
		opts.inJustDecodeBounds = false;
		Bitmap bm = BitmapFactory.decodeFile(pathname, opts);
		return bm;
	}

	private static int computeSampleSize(Options opts, int minSideLength,
			int maxNumOfPixels) {
		int initialSize = computeInitialSampleSize(opts, minSideLength,
				maxNumOfPixels);
		int roundedSize;
		if (initialSize < 8) {
			roundedSize = 1;
			while (roundedSize < initialSize) {
				roundedSize <<= 1;
			}
		} else {
			roundedSize = (initialSize + 7) / 8 * 8;
		}
		return roundedSize;
	}

	/*
	private static int newComputeSampleSize(Options opts, int minSideLength,
			int maxNumOfPixels) {
		int height = opts.outHeight;
		int width = opts.outWidth;
		int samplesize = (int) Math.ceil(Math.sqrt((height * width)
				/ maxNumOfPixels));
		return samplesize * samplesize;
	}
	*/

	private static int computeInitialSampleSize(Options opts,
			int minSideLength, int maxNumOfPixels) {
		double w = opts.outWidth;
		double h = opts.outHeight;
		int lowerBound = (maxNumOfPixels == -1) ? 1 : (int) Math.ceil(Math
				.sqrt(w * h / maxNumOfPixels));
		int upperBount = (minSideLength == -1) ? 128 : (int) Math.min(
				Math.floor(w / minSideLength), h / minSideLength);

		if (upperBount < lowerBound) {
			return upperBount;
		}

		if ((maxNumOfPixels == -1) && (minSideLength == -1)) {
			return 1;
		} else if (minSideLength == -1) {
			return lowerBound;
		} else {
			return upperBount;
		}
	}

	public static void saveBitmap(Bitmap bm, String path) {
		File img = new File(path);
		try {
			FileOutputStream fOut = null;
			fOut = new FileOutputStream(img);
			bm.compress(Bitmap.CompressFormat.JPEG, compressRatio, fOut);
			fOut.flush();
			fOut.close();
		} catch (Exception e) {
		}
	}

	public static class CompressedBitmap {
		private Bitmap compressedBitmap;
		private int sampleSize;

		public CompressedBitmap(Bitmap bt, int sample) {
			this.compressedBitmap = bt;
			this.sampleSize = sample;
		}

		public Bitmap getBitmap() {
			return compressedBitmap;
		}

		public int getSampleSize() {
			return sampleSize;
		}

	}
}
