package com.lingzhimobile.huodonghaowai.view;

import java.text.DateFormatSymbols;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.List;

import android.app.Dialog;
import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AbsListView;
import android.widget.AbsListView.OnScrollListener;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemClickListener;
import android.widget.BaseAdapter;
import android.widget.Button;
import android.widget.ListView;
import android.widget.TextView;

import com.lingzhimobile.huodonghaowai.R;

public class CustomizeDatePickerDialog extends Dialog {

	// Plan to adjust the order of the five lists based on locale
	private static final String MONTH = "month";
	private static final String DAY = "day";
	private static final String HOUR = "hour";

	View contentView;
	ListView monthListView, dayListView, hourListView;
	NumberAdapter monthAdapter, dayAdapter, hourAdapter;
	Button btnCancel, btnOk;
	
	Calendar calendar;

	private final OnCustomizeDateSetListener mCallBack;

	public interface OnCustomizeDateSetListener {
		void onDateSet(String monthOfYear, String dayOfMonth, String hour);
	}

    public CustomizeDatePickerDialog(Context context,
            OnCustomizeDateSetListener callBack, Calendar calendar) {
        this(context, 0, callBack, calendar);
    }

	void setView() {
		monthListView = (ListView) contentView.findViewById(R.id.monthListView);
		dayListView = (ListView) contentView.findViewById(R.id.dayListView);
		hourListView = (ListView) contentView.findViewById(R.id.hourListView);
		btnCancel = (Button) contentView.findViewById(R.id.btnCancel);
		btnOk = (Button) contentView.findViewById(R.id.btnOk);
	}

	void setAdapter() {

	    DateFormatSymbols d = new DateFormatSymbols();
	    List<String> monthList = new ArrayList<String>();
	    monthList.addAll(Arrays.asList(d.getShortMonths()));
	    monthList.add(0, "");
	    // some calendars have 13 months, so remove the last one if it is ""
	    if (!"".equals(monthList.get(monthList.size()-1)))
	            monthList.add("");
	    monthAdapter = new NumberAdapter(getContext(), monthList);
		monthListView.setAdapter(monthAdapter);

        if (calendar.getActualMaximum(Calendar.DAY_OF_MONTH) == 31) {
            dayAdapter = new NumberAdapter(getContext(), R.array.day_values_31);
        } else if (calendar.getActualMaximum(Calendar.DAY_OF_MONTH) == 30) {
            dayAdapter = new NumberAdapter(getContext(), R.array.day_values_30);
        } else if (calendar.getActualMaximum(Calendar.DAY_OF_MONTH) == 28) {
            dayAdapter = new NumberAdapter(getContext(), R.array.day_values_28);
        } else if (calendar.getActualMaximum(Calendar.DAY_OF_MONTH) == 29) {
            dayAdapter = new NumberAdapter(getContext(), R.array.day_values_29);
        }
		dayListView.setAdapter(dayAdapter);

		hourAdapter = new NumberAdapter(getContext(), R.array.hour_values);
		hourListView.setAdapter(hourAdapter);

	}

	void setListener() {

		OnItemClickListener onItemClickListener = new OnItemClickListener() {

			@Override
			public void onItemClick(AdapterView<?> arg0, View arg1, int arg2,
					long arg3) {
				arg0.setSelection(arg2 - 1);
				if (arg0 == monthListView){
				    updateDayList(arg2);
				} 
			}
		};

		OnScrollListener onScrollListener = new OnScrollListener() {

			@Override
			public void onScrollStateChanged(AbsListView arg0, int arg1) {
				switch (arg1) {
				case OnScrollListener.SCROLL_STATE_IDLE:
					int alignIndex = getIndex(arg0);
					arg0.setSelection(alignIndex
							+ arg0.getFirstVisiblePosition() - 1);
					int arg2 = alignIndex
                    + arg0.getFirstVisiblePosition();
		               if (arg0 == monthListView){
		                   updateDayList(arg2);
		                } 

					break;
				case OnScrollListener.SCROLL_STATE_FLING:
					break;
				case OnScrollListener.SCROLL_STATE_TOUCH_SCROLL:
					break;
				}
			}

			@Override
			public void onScroll(AbsListView arg0, int arg1, int arg2, int arg3) {
			}
		};

		monthListView.setOnItemClickListener(onItemClickListener);
		monthListView.setOnScrollListener(onScrollListener);

		dayListView.setOnItemClickListener(onItemClickListener);
		dayListView.setOnScrollListener(onScrollListener);

		hourListView.setOnItemClickListener(onItemClickListener);
		hourListView.setOnScrollListener(onScrollListener);
		btnOk.setOnClickListener(new View.OnClickListener() {

			@Override
			public void onClick(View v) {
				if (mCallBack != null) {
				    // for month, do not plus 1
                    String monthOfYear = monthListView
                            .getFirstVisiblePosition() + "";
                    String dayOfMonth = dayListView.getFirstVisiblePosition()
                            + 1 + "";
                    String hour = hourListView.getFirstVisiblePosition()
                            + "";
					mCallBack.onDateSet(monthOfYear, dayOfMonth, hour);
				}
				dismiss();
			}
		});
		btnCancel.setOnClickListener(new View.OnClickListener() {
			
			@Override
			public void onClick(View v) {
				// TODO Auto-generated method stub
				dismiss();
			}
		});
	}

	protected void updateDayList(int arg2) {
        int dayPos = dayListView.getFirstVisiblePosition();
        if (arg2  >=1 && arg2  <=12){
            calendar.set(Calendar.MONTH, arg2 - 1);
        }
        if (calendar.getActualMaximum(Calendar.DAY_OF_MONTH) == 31) {
            dayAdapter = new NumberAdapter(getContext(), R.array.day_values_31);
        } else if (calendar.getActualMaximum(Calendar.DAY_OF_MONTH) == 30) {
            dayAdapter = new NumberAdapter(getContext(), R.array.day_values_30);
        } else if (calendar.getActualMaximum(Calendar.DAY_OF_MONTH) == 28) {
            dayAdapter = new NumberAdapter(getContext(), R.array.day_values_28);
        } else if (calendar.getActualMaximum(Calendar.DAY_OF_MONTH) == 29) {
            dayAdapter = new NumberAdapter(getContext(), R.array.day_values_29);
        }
        dayListView.setAdapter(dayAdapter);
        if (dayPos<=calendar.getActualMaximum(Calendar.DAY_OF_MONTH)){
            dayListView.setSelection(dayPos);
        } else{
            dayListView.setSelection(calendar.getActualMaximum(Calendar.DAY_OF_MONTH));
        }
    }

    private int getIndex(AbsListView yearListView) {
		double middleHeight = (yearListView.getTop() + yearListView.getBottom()) / 2.0;
		int closedIndex = 0;
		double distance = yearListView.getHeight();
		int count = yearListView.getChildCount();
		for (int i = 0; i < count; i++) {
			View v = yearListView.getChildAt(i);
			double subY = (v.getTop() + v.getBottom()) / 2.0;
			double dis = Math.abs(subY - middleHeight);
			if (dis < distance) {
				distance = dis;
				closedIndex = i;
			}
		}
		return closedIndex;
	}

	public CustomizeDatePickerDialog(final Context context, int theme,
			OnCustomizeDateSetListener callBack, Calendar calendar) {
	    super(context, R.style.AlertDialog);
        
	    this.calendar = calendar;
	    int monthOfYear = calendar.get(Calendar.MONTH);
        int dayOfMonth = calendar.get(Calendar.DAY_OF_MONTH);
        int hour = calendar.get(Calendar.HOUR_OF_DAY);
        int minute =  calendar.get(Calendar.MINUTE);
        
		mCallBack = callBack;

		Context themeContext = getContext();
		// setButton(BUTTON_POSITIVE, themeContext.getText(android.R.string.ok),
		// this);
		// setButton(BUTTON_NEGATIVE,
		// themeContext.getText(android.R.string.cancel),
		// (OnClickListener) null);
		// setIcon(0);

		LayoutInflater inflater = (LayoutInflater) themeContext
				.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
		contentView = inflater.inflate(R.layout.datepicker, null);
		setContentView(contentView);

		setView();
		setAdapter();
		setListener();
		monthListView.setSelection(monthOfYear);
		dayListView.setSelection(dayOfMonth-1);
		if (minute == 0) {
            hourListView.setSelection(hour * 2);
        }else{
            hourListView.setSelection(hour * 2+1);
        }
	}

//	public void onClick(DialogInterface dialog, int which) {
//		if (mCallBack != null) {
//			int monthOfYear = Integer.parseInt(monthListView.getItemAtPosition(
//					monthListView.getFirstVisiblePosition() + 1).toString());
//			int dayOfMonth = Integer.parseInt(dayListView.getItemAtPosition(
//					dayListView.getFirstVisiblePosition() + 1).toString());
//			int hour = Integer.parseInt(hourListView.getItemAtPosition(
//					hourListView.getFirstVisiblePosition() + 1).toString());
//			mCallBack.onDateSet(monthOfYear, dayOfMonth, hour);
//		}
//	}

	public class NumberAdapter extends BaseAdapter {

		public List<String> values;
		private LayoutInflater layoutInflater;

		public NumberAdapter(Context context, int id) {
			super();
			values = new ArrayList<String>();
			String[] strs = context.getResources().getStringArray(id);
			values.addAll(Arrays.asList(strs));
			layoutInflater = (LayoutInflater) context
					.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
		}
		
		public NumberAdapter(Context context, List<String> strs) {
            super();
            values = strs;
            layoutInflater = (LayoutInflater) context
                    .getSystemService(Context.LAYOUT_INFLATER_SERVICE);
        }

		@Override
		public int getCount() {
			return values.size();
		}

		@Override
		public Object getItem(int arg0) {
			return values.get(arg0);
		}

		@Override
		public long getItemId(int arg0) {
			return arg0;
		}

		@Override
		public View getView(int arg0, View arg1, ViewGroup arg2) {
			if (arg1 == null) {
				arg1 = layoutInflater.inflate(R.layout.numberitem, null);
			}
			TextView number = (TextView) arg1.findViewById(R.id.numberTextView);
			number.setText(getItem(arg0).toString());
			return arg1;
		}
	}

}