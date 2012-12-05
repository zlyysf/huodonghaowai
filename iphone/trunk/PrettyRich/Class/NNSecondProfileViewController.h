//
//  NNSecondProfileViewController.h
//  PrettyRich
//
//  Created by liu miao on 10/25/12.
//
//

#import <UIKit/UIKit.h>
#import "ImagesDownloadManager.h"
#import "ImageDownloaderDelegate.h"
#import "NodeAsyncConnection.h"
@interface NNSecondProfileViewController : UIViewController<ImageDownloaderDelegate>
@property(nonatomic,readwrite)BOOL isFirstLoad;
@property (retain, nonatomic)ImagesDownloadManager * imageDownloadManager;
@property (retain, nonatomic) IBOutlet UILabel *hintLabel;
@property (retain, nonatomic)NSMutableDictionary *userInfoDict;
@property (retain, nonatomic) IBOutlet UILabel *nameLabel;
@property (retain, nonatomic)NSString *profileId;
@property (retain, nonatomic) IBOutlet UIImageView *userPhotoView;
@property (retain, nonatomic) IBOutlet UILabel *HeightABloodAStarlabel;
@property (retain, nonatomic) IBOutlet UILabel *EduADepartASchoolLabel;
@property (retain, nonatomic) IBOutlet UILabel *selfDescriptionlabel;
@property (retain, nonatomic) IBOutlet UIActivityIndicatorView *activityIndicator;
@property(nonatomic,retain) NodeAsyncConnection *curConnection;
@end
