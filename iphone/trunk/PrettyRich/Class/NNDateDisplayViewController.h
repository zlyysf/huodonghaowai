//
//  NNDateDisplayViewController.h
//  PrettyRich
//
//  Created by liu miao on 10/23/12.
//
//

#import <UIKit/UIKit.h>
#import "ImagesDownloadManager.h"
#import "ImageDownloaderDelegate.h"
@interface NNDateDisplayViewController : UIViewController<UIScrollViewDelegate,ImageDownloaderDelegate>
@property (retain, nonatomic) IBOutlet UIActivityIndicatorView *activityIndicator;
@property (retain, nonatomic) IBOutlet UIScrollView *photoScrollView;
@property (readwrite, nonatomic)int currentPhotoIndex;
@property (retain, nonatomic) NSMutableArray *dateArray;
@property (retain, nonatomic) NSMutableArray *imageViewArray;
@property (retain, nonatomic)ImagesDownloadManager * imageDownloadManager;
@property (readwrite,nonatomic)BOOL isFirstLoad;
- (void) displayPhoto :(int)photoIndex;
@end
