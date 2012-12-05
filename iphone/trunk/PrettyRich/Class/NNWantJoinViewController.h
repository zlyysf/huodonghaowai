//
//  NNWantJoinViewController.h
//  PrettyRich
//
//  Created by liu miao on 10/23/12.
//
//

#import <UIKit/UIKit.h>
#import "NodeAsyncConnection.h"
@interface NNWantJoinViewController : UIViewController<UITextViewDelegate>
@property(nonatomic,retain) NodeAsyncConnection *curConnection;
@property (retain, nonatomic) IBOutlet UILabel *countLabel;
@property (retain, nonatomic) IBOutlet UIActivityIndicatorView *activityIndicator;
@property (retain, nonatomic) IBOutlet UITextView *messageTextView;
@property (retain,nonatomic)NSString *dateId;
@property (retain,nonatomic)NSString *targetUserId;
@end
