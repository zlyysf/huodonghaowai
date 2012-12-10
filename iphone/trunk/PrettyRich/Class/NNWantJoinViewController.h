//
//  NNWantJoinViewController.h
//  PrettyRich
//
//  Created by liu miao on 10/23/12.
//
//

#import <UIKit/UIKit.h>
#import "NodeAsyncConnection.h"
typedef enum PostType
{
    PostTypeJoin = 0,//用户回复
    PostTypeReport = 1,//用户举报
}PostType;
@interface NNWantJoinViewController : UIViewController<UITextViewDelegate>
@property (retain, nonatomic) IBOutlet UILabel *placeholderLabel;
@property(nonatomic,retain) NodeAsyncConnection *curConnection;
@property (retain, nonatomic) IBOutlet UILabel *countLabel;
@property (retain, nonatomic) IBOutlet UIActivityIndicatorView *activityIndicator;
@property (retain, nonatomic) IBOutlet UITextView *messageTextView;
@property (retain,nonatomic)NSString *dateId;
@property (retain,nonatomic)NSString *targetUserId;
@property(nonatomic,readwrite)PostType postType;
@end
