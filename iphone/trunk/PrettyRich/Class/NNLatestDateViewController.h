//
//  NNLatestDateViewController.h
//  PrettyRich
//
//  Created by liu miao on 10/22/12.
//
//

#import <UIKit/UIKit.h>
#import "NodeAsyncConnection.h"
#import "EGORefreshTableHeaderView.h"
#import "LoadingMoreFooterView.h"
#import "ImagesDownloadManager.h"
#import "ImageDownloaderDelegate.h"
#import "LatestDateCell.h"
@interface NNLatestDateViewController : UIViewController<UITableViewDataSource,UITableViewDelegate,EGORefreshTableHeaderDelegate,ImageDownloaderDelegate,LatestDateCellDelegate>
@property (retain, nonatomic) IBOutlet UITableView *listView;
@property(nonatomic,readwrite) BOOL isFirstLoad;
@property(nonatomic, retain) EGORefreshTableHeaderView * refreshHeaderView;  //下拉刷新
@property(nonatomic, readwrite) BOOL isRefreshing;
@property(nonatomic,retain) LoadingMoreFooterView *loadFooterView;
@property(nonatomic,retain)NSMutableArray *dateArray;
@property(nonatomic,retain)ImagesDownloadManager * imageDownloadManager;
@property(nonatomic,retain) NSMutableDictionary *dateOption;
@property(nonatomic,retain) NodeAsyncConnection *curConnection;
@property(nonatomic,readwrite) BOOL isReload;
@property(nonatomic,readwrite)BOOL hasMore;
- (void)startGetLatestDates;
- (void)didEndGetLatestDates:(NodeAsyncConnection *)connection;
- (void)autoRefresh;
- (void)loadMore;
- (void)refresh;
- (void)loadImagesForOnscreenRows;
@end
