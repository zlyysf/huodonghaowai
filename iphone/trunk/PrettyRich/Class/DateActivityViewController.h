//
//  DateActivityViewController.h
//  PrettyRich
//
//  Created by liu miao on 9/22/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "NodeAsyncConnection.h"
#import "EGORefreshTableHeaderView.h"
#import <MessageUI/MessageUI.h>
//@protocol DateActivityViewDelegate <NSObject>
//-(void)userSelectedTopic:(NSString *)topic;
//@end

@interface DateActivityViewController : UIViewController<UITableViewDataSource,UITableViewDelegate,EGORefreshTableHeaderDelegate,MFMessageComposeViewControllerDelegate>
@property(nonatomic, retain) EGORefreshTableHeaderView * refreshHeaderView;  //下拉刷新
@property (retain, nonatomic) IBOutlet UIActivityIndicatorView *activityIndicator;
@property(nonatomic, readwrite) BOOL isRefreshing;
@property (retain, nonatomic) IBOutlet UITableView *listView;
@property (nonatomic,readwrite)BOOL hasData;
//@property (nonatomic,assign)id<DateActivityViewDelegate>delegate;
@property(nonatomic,retain)NSMutableArray *dateArray;
@property(nonatomic,retain) NodeAsyncConnection *curConnection;
- (void)startGetActivity;
- (void)didEndGetActivity:(NodeAsyncConnection *)connection;
- (void)autoRefresh;
- (void)refresh;
@end
