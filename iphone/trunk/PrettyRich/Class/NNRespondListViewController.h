//
//  NNRespondListViewController.h
//  PrettyRich
//
//  Created by liu miao on 10/26/12.
//
//

#import <UIKit/UIKit.h>
#import "NNRespondListCell.h"
#import "ImagesDownloadManager.h"
#import "ImageDownloaderDelegate.h"
@interface NNRespondListViewController : UIViewController<UITableViewDataSource,UITableViewDelegate,NNRespondListCellDelegate,ImageDownloaderDelegate>
@property(nonatomic,retain)ImagesDownloadManager * imageDownloadManager;
@property (retain, nonatomic) IBOutlet UITableView *listView;
@property (retain, nonatomic)NSMutableDictionary *dateDict;
@property(nonatomic,retain)NSMutableArray *confirmArray;
@property(nonatomic,retain)NSMutableArray *respondArray;
- (void)loadImagesForOnscreenRows;
@end
