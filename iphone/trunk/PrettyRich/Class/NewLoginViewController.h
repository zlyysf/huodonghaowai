//
//  NewLoginViewController.h
//  PrettyRich
//
//  Created by liu miao on 7/31/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "NodeAsyncConnection.h"
@interface NewLoginViewController : UIViewController<UITextFieldDelegate,UITableViewDataSource,UITableViewDelegate>
{
    NodeAsyncConnection *curConnection;
    UITextField *lastActiveField;
}
@property (retain, nonatomic) IBOutlet UITableViewCell *emailCell;
@property (retain, nonatomic) IBOutlet UITableViewCell *passwordCell;
@property (retain, nonatomic) IBOutlet UITableViewCell *resetPassCell;
@property (retain, nonatomic) IBOutlet UITableView *listView;
@property (retain, nonatomic) IBOutlet UITextField *emailTextField;
@property (retain, nonatomic) IBOutlet UITextField *passwordTextField;
@property (retain, nonatomic) IBOutlet UIButton *resetPasswordButton;
@property (retain, nonatomic) IBOutlet UIActivityIndicatorView *activityIndicator;
@property (retain, nonatomic) UITextField *lastActiveField;
@property(nonatomic,retain) NodeAsyncConnection *curConnection;
@property(nonatomic,retain) NSString *emailAccount;
- (IBAction)resetPassword;
- (void)backButtonClicked;
- (void)startLogin;
- (void)didEndLogin:(NodeAsyncConnection *)connection;
@end
