//
//  BFLogginViewController.h
//  PrettyRich
//
//  Created by liu miao on 10/18/12.
//
//

#import <UIKit/UIKit.h>
#import "ImagesDownloadManager.h"
#import "ImageDownloaderDelegate.h"
//#import "PrettyLocationManager.h"
#import "NodeAsyncConnection.h"
@interface BFLogginViewController : UIViewController<ImageDownloaderDelegate>//PrettyLocationManagerDelegate>
@property (nonatomic,readwrite)BOOL isFirstLoad;
@property (retain, nonatomic)ImagesDownloadManager * imageDownloadManager;
@property (retain, nonatomic) IBOutlet UIActivityIndicatorView *activityIndicator;
@property (retain, nonatomic) IBOutlet UIImageView *datePhotoView;
@property (retain, nonatomic) IBOutlet UILabel *nameATopicLabel;
@property (retain, nonatomic) IBOutlet UILabel *timeAndLocationLabel;
@property (retain, nonatomic) IBOutlet UILabel *countAndCostLabel;
@property (retain, nonatomic) IBOutlet UILabel *dateDescripLabel;
@property(nonatomic,retain) NodeAsyncConnection *curConnection;
@property (retain, nonatomic) IBOutlet UILabel *whopayLabel;
@property(nonatomic,retain) NSMutableArray *dateArray;
@property (retain, nonatomic) IBOutlet UILabel *locationLabel;
@property(nonatomic,retain) NSMutableDictionary *dateOption;
//@property (nonatomic,assign)PrettyLocationManager *locationManager;
//@property (nonatomic,retain)NSDictionary *regionDict;
-(IBAction)signupClicked;
-(IBAction)logginClicked;
- (void)startGetBFDate;
- (void)didEndGetBFDate:(NodeAsyncConnection *)connection;
@end
