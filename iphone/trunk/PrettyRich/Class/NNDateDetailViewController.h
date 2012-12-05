//
//  NNDateDetailViewController.h
//  PrettyRich
//
//  Created by liu miao on 10/27/12.
//
//

#import <UIKit/UIKit.h>
#import "ImagesDownloadManager.h"
#import "ImageDownloaderDelegate.h"
@interface NNDateDetailViewController : UIViewController<ImageDownloaderDelegate>
@property (retain, nonatomic) IBOutlet UIImageView *datePicView;
@property (retain, nonatomic) IBOutlet UIActivityIndicatorView *activityIndicator;
@property (retain, nonatomic) IBOutlet UILabel *titleLabel;
@property (retain, nonatomic) IBOutlet UILabel *timeLabel;
@property (retain, nonatomic) IBOutlet UILabel *addressLabel;
@property (retain, nonatomic) IBOutlet UILabel *personLabel;
@property (retain, nonatomic) IBOutlet UILabel *whoPayLabel;
@property (retain, nonatomic) IBOutlet UILabel *descriptionlabel;
@property (retain, nonatomic)ImagesDownloadManager * imageDownloadManager;
@property (retain, nonatomic)NSMutableDictionary *dateDict;
@end
