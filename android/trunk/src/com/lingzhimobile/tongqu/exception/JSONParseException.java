package com.lingzhimobile.tongqu.exception;

public class JSONParseException extends AppException {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;


	public JSONParseException(int code, String msg, Throwable cause) {
		super(code, msg, cause);
	}

	public JSONParseException(int code) {
		super(code);
	}

	public JSONParseException(int code, String msg) {
		super(code, msg);
	}
}
