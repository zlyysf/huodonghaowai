//
//  LoadingMoreFooterView.h
//  PrettyRich
//
//  Created by miao liu on 5/9/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#define LOADINGVIEW_HEIGHT 44
@interface LoadingMoreFooterView : UIView
@property(nonatomic, readwrite) BOOL showActivityIndicator;
@property(nonatomic, readwrite, getter = isRefreshing) BOOL refreshing;
@property(nonatomic, readwrite) BOOL enabled;
@property(nonatomic, readwrite) UITextAlignment textAlignment;
@property(nonatomic, retain) UILabel * textLabel;
@property(nonatomic, retain) UIActivityIndicatorView * activityView;
@property(nonatomic, readwrite) CGRect savedFrame;
@end
