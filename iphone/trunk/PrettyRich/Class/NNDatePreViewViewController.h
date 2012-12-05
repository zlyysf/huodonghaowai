//
//  NNDatePreViewViewController.h
//  PrettyRich
//
//  Created by liu miao on 10/19/12.
//
//

#import <UIKit/UIKit.h>
#import "ImagesDownloadManager.h"
#import "ImageDownloaderDelegate.h"
@interface NNDatePreViewViewController : UIViewController<ImageDownloaderDelegate>
@property (retain, nonatomic) IBOutlet UIImageView *datePicView;
@property (retain, nonatomic) IBOutlet UILabel *nameAndTitleLabel;
@property (retain, nonatomic) IBOutlet UILabel *timeAndLocationLabel;
@property (retain, nonatomic)ImagesDownloadManager * imageDownloadManager;
@property (retain, nonatomic) IBOutlet UILabel *countAndWhoPayLabel;
@property (retain, nonatomic) IBOutlet UILabel *dateDescriptionLabel;
@property (retain, nonatomic) IBOutlet UILabel *addressLabel;
@property (retain, nonatomic) IBOutlet UILabel *whoPayLabel;
- (void)displayDate:(NSDictionary *)dateInfo withSelectedPhoto:(UIImage *)dateImage;
@end
