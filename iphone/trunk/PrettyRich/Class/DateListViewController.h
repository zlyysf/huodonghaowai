//
//  DateListViewController.h
//  PrettyRich
//
//  Created by miao liu on 5/16/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>
#import "EGORefreshTableHeaderView.h"
#import "LoadingMoreFooterView.h"
#import "ImagesDownloadManager.h"
#import "ImageDownloaderDelegate.h"
#import "NodeAsyncConnection.h"
#import "NNDateSentCell.h"
#import "NNDateRespondCell.h"
typedef enum DateListType  
{
    DateListTypeSent = 0,//onlyActiveSend
    DateListTypeRespond = 1,//onlyActiveRespond
    DateListTypeConfirmed =2,//invited
}DateListType;
@interface DateListViewController : UIViewController<UITableViewDataSource,UITableViewDelegate,EGORefreshTableHeaderDelegate,ImageDownloaderDelegate,NNDateRespondCellDelegate,NNDateSentCellDelegate>
{
    UITableView *activeListView;
    NSMutableDictionary *activeDateOption;
    NSMutableArray *activeDateArray;
    
    UITableView *listView;
    NSMutableArray *dateArray;
    NSMutableDictionary *dateOption;
    
    UITableView *confirmListView;
    NSMutableArray *confirmDateArray;
    NSMutableDictionary *confirmDateOption;
    BOOL hasPast;
    BOOL isFirstLoad;
    ImagesDownloadManager * imageDownloadManager;
    NodeAsyncConnection *curConnection;
    BOOL isReload;
    BOOL hasMore;
    int pastCellIndex;
    NSDictionary *selfUserInfo;
    DateListType dateListType;
    BOOL isFilterOn;
}
@property(nonatomic,retain)NSMutableArray *dateArray;
@property(nonatomic,retain)NSMutableArray *activeDateArray;
@property(nonatomic,retain)NSMutableArray *confirmDateArray;
@property(nonatomic,retain)NSMutableDictionary *dateOption;
@property(nonatomic,retain)NSMutableDictionary *activeDateOption;
@property(nonatomic,retain)NSMutableDictionary *confirmDateOption;
@property(nonatomic,retain)IBOutlet UITableView *listView;
@property(nonatomic,retain)IBOutlet UITableView *activeListView;;
@property (retain, nonatomic) IBOutlet UITableView *confirmListView;
@property(nonatomic,readwrite)DateListType dateListType;
@property(nonatomic,readwrite)BOOL hasPast;
@property(nonatomic,readwrite)BOOL activeHasPast;
@property(nonatomic,readwrite)BOOL confirmHasPast;
@property(nonatomic,readwrite)BOOL hasMore;
@property(nonatomic,readwrite)BOOL activeHasMore;
@property(nonatomic,readwrite)BOOL confirmHasMore;
@property(nonatomic, retain) EGORefreshTableHeaderView * refreshHeaderView;  
@property(nonatomic, retain) EGORefreshTableHeaderView * activeRefreshHeaderView;
@property(nonatomic, retain) EGORefreshTableHeaderView * confirmRefreshHeaderView;
@property(nonatomic, readwrite) BOOL isRefreshing;
@property(nonatomic,retain) LoadingMoreFooterView *loadFooterView; 
@property(nonatomic,retain)ImagesDownloadManager * imageDownloadManager;
@property (retain, nonatomic) IBOutlet UISegmentedControl *titleSegmentControl;
@property(nonatomic,readwrite) BOOL isFirstLoad;
@property(nonatomic,readwrite) BOOL isReload;
@property(nonatomic,retain) NodeAsyncConnection *curConnection;
@property(nonatomic,readwrite)int pastCellIndex;
@property(nonatomic,readwrite)int activePastCellIndex;
@property(nonatomic,readwrite)int confirmPastCellIndex;
@property(nonatomic,retain)UIButton *calendarButton;
@property(nonatomic,retain)UIButton *activeButton;
@property(nonatomic,retain)UIButton *dateFilterButton;
@property(nonatomic,retain)NSDictionary *selfUserInfo;
-(IBAction)segmentSelected:(id)sender;
- (float)getCellHeight:(NSDictionary *)cellDict;
- (void)autoRefresh;
- (void)loadMore;
- (void)refresh;
- (void)startGetDates;
- (void)didEndGetDates:(NodeAsyncConnection *)connection;
- (void)startCloseDate:(NSString *)dateId;
- (void)didEndCloseDate:(NodeAsyncConnection *)connection;
- (void)didSentDate;
@end
