package com.lingzhimobile.tongqu.comparator;

import java.io.File;
import java.util.Comparator;

public class FileTimeComparator implements Comparator<File> {

	public int compare(File object1, File object2) {
		long i1 = object1.lastModified();
		long i2 = object2.lastModified();
		if(i1 > i2)
			return -1;
		else if(i1 < i2)
			return 1;
		return 0;
	}
}
