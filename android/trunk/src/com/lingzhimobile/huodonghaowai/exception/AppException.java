package com.lingzhimobile.huodonghaowai.exception;

public class AppException extends Exception {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	private int code;

	public int getCode() {
		return code;
	}

	public void setCode(int code) {
		this.code = code;
	}


	public AppException(int code, String msg, Throwable cause) {
		super(msg, cause);

		this.code = code;
	}


	public AppException(int code) {
		super("");
		this.code = code;
	}

	public AppException(int code, Throwable e) {
		super(e.getMessage(), e);
		this.code = code;
	}

	public AppException(int code, String msg) {
		super(msg);
		this.code = code;
	}
}
