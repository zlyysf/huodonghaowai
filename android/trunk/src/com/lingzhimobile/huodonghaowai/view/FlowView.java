package com.lingzhimobile.huodonghaowai.view;

import android.content.Context;
import android.graphics.Bitmap;
import android.os.Handler;
import android.os.Message;
import android.util.AttributeSet;
import android.widget.ImageView;

import com.lingzhimobile.huodonghaowai.model.PhotoItem;

public class FlowView extends ImageView {

    private PhotoItem pi;
    private Context context;
    public Bitmap bitmap;
    private int columnIndex;// 图片属于第几列
    private int rowIndex;// 图片属于第几行
    private Handler viewHandler;
    private String dataType;

    public String getDataType() {
        return dataType;
    }

    public void setDataType(String dataType) {
        this.dataType = dataType;
    }

    public FlowView(Context c, AttributeSet attrs, int defStyle) {
        super(c, attrs, defStyle);
        this.context = c;
        Init();
    }

    public FlowView(Context c, AttributeSet attrs) {
        super(c, attrs);
        this.context = c;
        Init();
    }

    public FlowView(Context c) {
        super(c);
        this.context = c;
        Init();
    }

    private void Init() {

        setAdjustViewBounds(true);

    }

    /**
     * 加载图片
     */
    public void LoadOriginalImage() {
        if (getPi() != null) {
            bitmap = pi.getBitmap();
            if (bitmap != null) {
                setImageBitmap(bitmap);
            } else {
                Bitmap temp = pi.getFwBitmap();
                if(temp != null){
                    setImageBitmap(temp);
                }else{
                    temp = pi.getSmallBitmap();
                    if(temp != null){
                        setImageBitmap(temp);
                    }
                }
                this.setTag(pi.getPhotoPath());
                pi.getPostBitmapAsync(new com.lingzhimobile.huodonghaowai.util.MethodHandler<Bitmap>() {
                    public void process(Bitmap para) {
                        Message msg = viewHandler.obtainMessage(getId(),
                                FlowView.this);
                        msg.getData().putString("dataType", dataType);
                        viewHandler.sendMessage(msg);
                    }
                });
            }

        }
    }

    /**
     * 加载图片
     */
    public void LoadImage() {
        if (getPi() != null) {
            bitmap = pi.getFwBitmap();
            if (bitmap != null) {
                setImageBitmap(bitmap);
            } else {
                this.setTag(pi.getFixPhotoPath());
                pi.getFwPostBitmapAsync(new com.lingzhimobile.huodonghaowai.util.MethodHandler<Bitmap>() {
                    public void process(Bitmap para) {
                        Message msg = viewHandler.obtainMessage(getId(),
                                FlowView.this);
                        msg.getData().putString("dataType", dataType);
                        viewHandler.sendMessage(msg);
                    }
                });
            }

        }
    }

    /**
     * 重新加载图片
     */
    public void Reload() {
        if (this.bitmap == null && getPi() != null) {
            bitmap = pi.getFwBitmap();
            if (bitmap != null) {
                setImageBitmap(bitmap);
            } else {
                this.setTag(pi.getFixPhotoPath());
                pi.getFwPostBitmapAsync(new com.lingzhimobile.huodonghaowai.util.MethodHandler<Bitmap>() {
                    public void process(Bitmap para) {
                        Message msg = viewHandler.obtainMessage(getId(),
                                FlowView.this);
                        msg.getData().putString("dataType", dataType);
                        viewHandler.sendMessage(msg);
                    }
                });
            }
        }
    }

    /**
     * 回收内存
     */
    public void recycle() {
        setImageBitmap(null);
        if ((this.bitmap == null) || (this.bitmap.isRecycled()))
            return;
        // this.bitmap.recycle();
        this.bitmap = null;
    }

    public PhotoItem getPi() {
        return pi;
    }

    public void setPi(PhotoItem pi) {
        this.pi = pi;
    }

    public int getColumnIndex() {
        return columnIndex;
    }

    public void setColumnIndex(int columnIndex) {
        this.columnIndex = columnIndex;
    }

    public int getRowIndex() {
        return rowIndex;
    }

    public void setRowIndex(int rowIndex) {
        this.rowIndex = rowIndex;
    }

    public Handler getViewHandler() {
        return viewHandler;
    }

    public FlowView setViewHandler(Handler viewHandler) {
        this.viewHandler = viewHandler;
        return this;
    }

}
