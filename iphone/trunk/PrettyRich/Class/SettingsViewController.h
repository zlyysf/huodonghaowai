//
//  SettingsViewController.h
//  PrettyRich
//
//  Created by liu miao on 12/18/12.
//
//

#import <UIKit/UIKit.h>
#import "NodeAsyncConnection.h"
#import "CustomAlertView.h"
@interface SettingsViewController : UIViewController<UITableViewDataSource,UITableViewDelegate,CustomAlertViewDelegate,RenrenDelegate>
@property (retain, nonatomic) IBOutlet UITableView *listView;
@property (readwrite,nonatomic)BOOL hasRenRenId;
@property (retain, nonatomic) IBOutlet UIActivityIndicatorView *activityIndicator;
@property (retain, nonatomic) IBOutlet UITableViewCell *logoutCell;
@property (retain, nonatomic) IBOutlet UITableViewCell *shareCheckedCell;
@property(nonatomic,retain) NodeAsyncConnection *curConnection;
@property (retain, nonatomic) IBOutlet UITableViewCell *shareUncheckCell;
-(IBAction)logoutClicked;
@end
