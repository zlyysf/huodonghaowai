//
//  NewLoginViewController.m
//  PrettyRich
//
//  Created by liu miao on 7/31/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "NewLoginViewController.h"
#import "AppDelegate.h"
#import "NNMainTabViewController.h"
#import "RenRenSignUpViewController.h"
#import "PrettyUtility.h"
#import "MobClick.h"
#import "TongQuConfig.h"
@interface NewLoginViewController ()

@end

@implementation NewLoginViewController
@synthesize emailTextField;
@synthesize passwordTextField;
@synthesize resetPasswordButton;
@synthesize activityIndicator;
@synthesize curConnection,emailAccount,lastActiveField,hasRenRenId,backViewSizeAdjusted;
- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        // Custom initialization
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    // Do any additional setup after loading the view from its nib.
//    UIImage *buttonImage = [UIImage imageNamed:@"navigation-cancel-button.png"];
//    UIButton *button = [UIButton buttonWithType:UIButtonTypeCustom];
//    [button setImage:buttonImage forState:UIControlStateNormal];
//    button.frame = CGRectMake(0, 0, 28, 16);
//    [button addTarget:self action:@selector(backButtonClicked) forControlEvents:UIControlEventTouchUpInside];
//    UIBarButtonItem *customBarItem = [[UIBarButtonItem alloc] initWithCustomView:button];
    //UIBarButtonItem *customBarItem = [[UIBarButtonItem alloc]initWithTitle:@"登录" style:UIBarButtonItemStyleBordered target:self action:@selector(startLogin)];
    //self.navigationItem.rightBarButtonItem = customBarItem;
    //[customBarItem release];
    UIView *tempView = [[UIView alloc] init];
    [self.resetPassCell setBackgroundView:tempView];
    [tempView release];
    [self.resetPassCell setBackgroundColor:[UIColor clearColor]];
    UIView *tempView1= [[UIView alloc] init];
    [self.renrenCell setBackgroundView:tempView1];
    [tempView1 release];
    [self.renrenCell setBackgroundColor:[UIColor clearColor]];

    [self.loginButton addTarget:self action:@selector(startLogin) forControlEvents:UIControlEventTouchUpInside];
    self.emailTextField.tag = 201;
    self.passwordTextField.tag = 202;
    //[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(textDidChanged:) name:UITextFieldTextDidChangeNotification object:nil];
    UIView *paddingView1 = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 6, 34)];
    self.emailTextField.leftView = paddingView1;    
    self.emailTextField.leftViewMode = UITextFieldViewModeAlways;
    [paddingView1 release];
    UIView *paddingView2 = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 6, 34)];
    self.passwordTextField.leftView = paddingView2;    
    self.passwordTextField.leftViewMode = UITextFieldViewModeAlways;
    [paddingView2 release];
    NodeAsyncConnection * aConn = [[NodeAsyncConnection alloc] init];
	self.curConnection = aConn;
	[aConn release];
    self.activityIndicator.hidden = YES;
    if([[Renren sharedRenren]isSessionValid])
    {
        [[Renren sharedRenren]logout:self];
    }
    hasRenRenId = NO;
    backViewSizeAdjusted = NO;
    //[self.loginButton setEnabled:NO];
    self.navigationItem.title = @"已注册用户";
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillShow:) name:UIKeyboardWillShowNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillHide:) name:UIKeyboardWillHideNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveGetLoggedInUserIdNotification:) name:@"kNotificationDidGetLoggedInUserId" object:nil];
}
- (void)keyboardWillShow:(NSNotification *)notification {
    NSDictionary* userInfo = [notification userInfo];
    NSValue *animationDurationValue = [userInfo objectForKey:UIKeyboardAnimationDurationUserInfoKey];
    NSTimeInterval animationDuration;
    [animationDurationValue getValue:&animationDuration];
    //CGFloat keyboardHeight = keyboardBounds.size.height;
    if (backViewSizeAdjusted == NO)
    {
        backViewSizeAdjusted = YES;
        //CGRect frame = self.listView.frame;
        //frame.size.height -= keyboardHeight;
        [UIView beginAnimations:nil context:NULL];
        [UIView setAnimationBeginsFromCurrentState:YES];
        [UIView setAnimationDuration:animationDuration];
        self.listView.frame = CGRectMake(self.listView.frame.origin.x, self.listView.frame.origin.y,320 , 200);
        if (self.lastActiveField.tag == 201)
        {
            //self.listView.contentOffset = CGPointMake(0, 100);
            [self.listView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:1] atScrollPosition:UITableViewScrollPositionTop animated:YES];
        }
        else if (self.lastActiveField.tag == 202)
        {
            [self.listView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:1 inSection:1] atScrollPosition:UITableViewScrollPositionTop animated:YES];
        }
        [UIView commitAnimations];
    }
    
}
- (void)keyboardWillHide:(NSNotification *)notification {
    NSDictionary* userInfo = [notification userInfo];
    NSValue *animationDurationValue = [userInfo objectForKey:UIKeyboardAnimationDurationUserInfoKey];
    NSTimeInterval animationDuration;
    [animationDurationValue getValue:&animationDuration];
    //CGFloat keyboardHeight = keyboardBounds.size.height;
    if (backViewSizeAdjusted == YES)
    {
        backViewSizeAdjusted = NO;
        //CGRect frame = self.listView.frame;
        //frame.size.height += keyboardHeight;
        [UIView beginAnimations:nil context:NULL];
        [UIView setAnimationBeginsFromCurrentState:YES];
        [UIView setAnimationDuration:animationDuration];
        self.listView.frame = CGRectMake(self.listView.frame.origin.x, self.listView.frame.origin.y,320 , 416);
        [UIView commitAnimations]; 
    } 
    
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    // Return the number of sections.
    return 3;
}
- (CGFloat)tableView:(UITableView *)tableView heightForHeaderInSection:(NSInteger)section
{
    if (section == 0)
        return 36;
    else if (section == 1)
        return 10;
    else
        return 0;
}
- (CGFloat)tableView:(UITableView *)tableView heightForFooterInSection:(NSInteger)section
{
    if (section == 0)
        return 26;
    else if (section == 1)
        return 26;
    else
        return 0;
}
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    // Return the number of rows in the section.
    if (section == 0)
    {
        return 1;
    }
    else if (section == 1)
        return 2;
    else
        return 1;
}
- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (indexPath.section == 0)
    {
        return 91;
    }
    else if (indexPath.section == 1)
    {
        return 44.0;
    }
    else
    {
        return 70;
    }
}
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (indexPath.section == 0)
    {
        return self.renrenCell;
    }
    else if (indexPath.section == 1)
    {
        if (indexPath.row == 0)
        {
            return self.emailCell;
        }
        else
            return self.passwordCell;
    }
    else
    {
        return self.resetPassCell;
    }
}
//- (void)textDidChanged:(NSNotification *)notification
//{
//    if ([self.emailTextField.text length]!=0 && [self.passwordTextField.text length]!=0)
//    {
//        //[self.loginButton setEnabled:YES];
//    }
//    else {
//        //[self.loginButton setEnabled:NO];
//    }
//}
- (void)backButtonClicked
{
    [curConnection cancelDownload];
    [self.navigationController popViewControllerAnimated:YES];
}
- (IBAction)resetPassword
{
    NSString *host;
    if (ServerProd)
    {
        host = @"http://42.121.122.47:3000";//prod
    }
    else
    {
        host = @"http://42.121.122.47:4000";//stage
    }
    NSLog(@"%@",host);
    //static NSString *host = @"http://ec2-23-21-136-120.compute-1.amazonaws.com:4000";//stage
    NSString *openUrl = [host stringByAppendingString:@"/web/requestResetPassword"];
    [[UIApplication sharedApplication] openURL:[NSURL URLWithString:openUrl]];
}
- (void)viewWillAppear:(BOOL)animated
{
//    UIView *titleView = [[UIView alloc]initWithFrame:CGRectMake(0, 0, 113, 26)];
//    UIImageView *imgView = [[UIImageView alloc]initWithFrame:CGRectMake(0, 0, 113, 26)];
//    [imgView setImage:[UIImage imageNamed:@"prettyrich-title.png"]];
//    [titleView addSubview:imgView];
//    self.navigationItem.titleView = titleView;
    [MobClick beginLogPageView:@"LoginView"];
    NSString *preEmail = [[NSUserDefaults standardUserDefaults]objectForKey:@"PreUserEmail"];
    if (![PrettyUtility isNull:preEmail])
    {
        self.emailTextField.text = preEmail;
    }
    //[self.emailTextField becomeFirstResponder];
}
- (BOOL)textFieldShouldBeginEditing:(UITextField *)textField
{
    self.lastActiveField = textField;
    return YES;
}
- (BOOL)textFieldShouldReturn:(UITextField *)textField
{
    if (textField.tag == 201)
    {   
        [passwordTextField becomeFirstResponder];           
    }
    if (textField.tag == 202)
    {
        [passwordTextField resignFirstResponder];
        [self startLogin];
    }
	
    return YES;
}
- (IBAction)renrenLogin
{
    if (lastActiveField != nil)
    {
        [lastActiveField resignFirstResponder];
    }
    if(![[Renren sharedRenren]isSessionValid])
    {
        NSArray *permissions = [NSArray arrayWithObjects:@"read_user_album",@"status_update",@"photo_upload",@"publish_feed",@"create_album",@"operate_like",nil];
        [[Renren sharedRenren] authorizationInNavigationWithPermisson:permissions andDelegate:self];
    }
    else
    {
        if (hasRenRenId)
            [self startRenRenLogin];
        else
            [[Renren sharedRenren]getLoggedInUserId];
    }
}
#pragma mark - RenrenDelegate methods

-(void)renrenDidLogin:(Renren *)renren
{
    if (!hasRenRenId)
    {
        [[Renren sharedRenren]getLoggedInUserId];
    }
    
}
- (void)renrenDidLogout:(Renren *)renren
{
    hasRenRenId = NO;
}
- (void)renren:(Renren *)renren loginFailWithError:(ROError*)error{
	NSString *title = [NSString stringWithFormat:@"Error code:%d", [error code]];
	NSString *description = [NSString stringWithFormat:@"%@", [error localizedDescription]];
	NSLog(@"loginfail:%@ %@",title,description);
}
-(void)startQuearyRenRenUserInfo
{
    ROUserInfoRequestParam *requestParam = [[[ROUserInfoRequestParam alloc] init] autorelease];
    requestParam.fields = @"uid,name,sex,star,zidou,vip,birthday,tinyurl,headurl,mainurl,hometown_location,work_history,university_history";
    [[Renren sharedRenren] getUsersInfo:requestParam andDelegate:self];
    self.view.userInteractionEnabled = NO;
    [self.activityIndicator startAnimating];
    self.activityIndicator.hidden = NO;
}
- (void)renren:(Renren *)renren requestDidReturnResponse:(ROResponse*)response
{
    [self.activityIndicator stopAnimating];
    self.activityIndicator.hidden = YES;
    self.view.userInteractionEnabled = YES;
    if ([response.rootObject isKindOfClass:[NSArray class]])
    {
        if ([(NSArray *)response.rootObject count] == 0) {
            return;
        }
        NSArray *usersInfo = (NSArray *)(response.rootObject);
        NSLog(@"%@",[usersInfo description]);
        NSString *outText = [NSString stringWithFormat:@""];
        NSString *photoUrl;
        NSString *name;
        NSString *gender;
        NSString *school;
        NSString *hometown;
        int year = 0;
        ROUserResponseItem *item = [usersInfo objectAtIndex:0];
        outText = [outText stringByAppendingFormat:@"UserID:%@\n Name:%@\n Sex:%@\n Birthday:%@\n HeadURL:%@\n",item.userId,item.name,item.sex,item.brithday,item.headUrl];
        if (item.universityHistory != nil && [item.universityHistory count]!= 0)
        {
            for (ROUserUniversityInfoItem *uItem in item.universityHistory)
            {
                if ([uItem.year intValue]>year)
                {
                    year = [uItem.year intValue];
                    school = uItem.name;
                }
            }
        }
        if (item.hometownLocation != nil)
        {
            hometown = item.hometownLocation.province;
        }
        
        photoUrl = item.mainUrl;
        name = item.name;
        gender = [item.sex isEqualToString:@"1"]?@"male":@"female";
        NSDictionary *infoJson = [NSDictionary dictionaryWithObjectsAndKeys:item.starUser,@"star",item.vipUser,@"vip", nil];
        RenRenSignUpViewController *signUpViewController =[[RenRenSignUpViewController alloc]initWithNibName:@"RenRenSignUpViewController" bundle:nil];
        signUpViewController.renrenPhotoUrl = photoUrl;
        signUpViewController.name = name;
        signUpViewController.gender = gender;
        if (school != nil)
        {
            signUpViewController.height = school;
        }
        if (hometown != nil)
        {
            signUpViewController.inviteCode = hometown;
        }
        signUpViewController.accountInfoJson = infoJson;
        [self.navigationController pushViewController:signUpViewController animated:YES];
        [signUpViewController release];
    }
}
- (void)renren:(Renren *)renren requestFailWithError:(ROError*)error
{
    [self.activityIndicator stopAnimating];
    self.activityIndicator.hidden = YES;
    self.view.userInteractionEnabled = YES;
	NSString *title = [NSString stringWithFormat:@"Error code:%d", [error code]];
	NSString *description = [NSString stringWithFormat:@"%@", [error.userInfo objectForKey:@"error_msg"]];
	NSLog(@"loginfail:%@ %@",title,description);
}
- (void) didReceiveGetLoggedInUserIdNotification:(NSNotification *)notification
{
    hasRenRenId = YES;
    //NSString *renrenId = [[NSUserDefaults standardUserDefaults]objectForKey:@"session_UserId"];
    [self startRenRenLogin];
}
- (void)startRenRenLogin
{
    NSString *renrenId = [[NSUserDefaults standardUserDefaults]objectForKey:@"session_UserId"];
    NSString * deviceUID = [[UIDevice currentDevice] uniqueIdentifier];
    NSString * accessToken = [Renren sharedRenren].accessToken;
    NSDictionary *dict = [[NSDictionary alloc]initWithObjectsAndKeys:
                          deviceUID,@"deviceId",
                          renrenId,@"accountRenRen",
                          accessToken,@"accessTokenRenRen",
                          @"iphone",@"deviceType",
                          nil];
    [curConnection cancelDownload];
    [curConnection startDownload:[NodeAsyncConnection createHttpsRequest:@"/user/logInFromRenRen" parameters:dict] :self :@selector(didEndRenRenLogin:)];
    [dict release];
    self.view.userInteractionEnabled = NO;
    [self.activityIndicator startAnimating];
    self.activityIndicator.hidden = NO;

}
- (void)didEndRenRenLogin:(NodeAsyncConnection *)connection
{
    [self.activityIndicator stopAnimating];
    self.activityIndicator.hidden = YES;
    self.view.userInteractionEnabled = YES;
    if (connection == nil || connection.result == nil)
    {
        return;
    }
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
    {
        NSDictionary *results = [connection.result objectForKey:@"result"];
        if ([[results objectForKey:@"userExist"]boolValue])
        {
            NSDictionary *result = [results objectForKey:@"user"];
            NSString *userId = [result objectForKey:@"userId"];
            NSString *userName = [result objectForKey:@"name"];
            NSString *userGender = [result objectForKey:@"gender"];
            NSString *userPhoto = [result objectForKey:@"primaryPhotoPath"];
            NSString *userEmail = [result objectForKey:@"emailAccount"];
            NSDictionary *userInfo = [[NSDictionary alloc]initWithDictionary:result];
            [[NSUserDefaults standardUserDefaults] setObject:userInfo forKey:@"PrettyUserInfo"];
            [userInfo release];
            [[NSUserDefaults standardUserDefaults] setObject:userId forKey:@"PrettyUserId"];
            [[NSUserDefaults standardUserDefaults] setObject:userName forKey:@"PrettyUserName"];
            [[NSUserDefaults standardUserDefaults] setObject:userGender forKey:@"PrettyUserGender"];
            [[NSUserDefaults standardUserDefaults] setObject:userPhoto forKey:@"PrettyUserPhoto"];
            [[NSUserDefaults standardUserDefaults] setObject:userEmail forKey:@"PrettyUserEmail"];
            [[NSUserDefaults standardUserDefaults] setObject:userEmail forKey:@"PreUserEmail"];
            [[NSUserDefaults standardUserDefaults]synchronize];
            [self.navigationController dismissModalViewControllerAnimated:YES];
            [[UIApplication sharedApplication] registerForRemoteNotificationTypes:UIRemoteNotificationTypeBadge | UIRemoteNotificationTypeAlert | UIRemoteNotificationTypeSound];
            NNMainTabViewController *mainTabViewController = [[NNMainTabViewController alloc]init];
            AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
            appDelegate.mainNavController.navigationBar.hidden = YES;
            [appDelegate.mainNavController setViewControllers:[NSArray arrayWithObject:mainTabViewController]];
            [mainTabViewController release];
        }
        else
        {
            [self publishFirstRenRenConnectFeed];
            [self startQuearyRenRenUserInfo];
        }
    }

}
-(void)publishFirstRenRenConnectFeed
{
    NSMutableDictionary *params = [NSMutableDictionary dictionaryWithObjectsAndKeys:
                                   @"feed.publishFeed",@"method",
                                   @"http://www.huodonghaowai.com",@"url",
                                   @"活动号外",@"name",
                                   @"我加入了活动号外",@"message",
                                   @"加入活动号外",@"action_name",
                                   @"http://www.huodonghaowai.com",@"action_link",
                                   @"中国第一个为大学生组织个性化活动的手机平台!",@"description",
                                   @"http://oss.aliyuncs.com/ysf1/resource/app-icon.png",@"image",
                                   nil];
    
    [[Renren sharedRenren] requestWithParams:params andDelegate:self];

}
- (void)startLogin
{
    if (lastActiveField != nil)
    {
        [lastActiveField resignFirstResponder];
    }
    NSString *email = emailTextField.text;
    self.emailAccount = email;
    NSString *password = passwordTextField.text;
    if (email == nil || password == nil || email.length == 0 || password.length == 0)
    {
        return;
    }
    NSString * deviceUID = [[UIDevice currentDevice] uniqueIdentifier];
    NSDictionary *dict = [[NSDictionary alloc]initWithObjectsAndKeys:
                          deviceUID,@"deviceId",
                          email,@"emailAccount",
                          password,@"password",
                          @"iphone",@"deviceType",
                        nil];
    [curConnection cancelDownload];
    [curConnection startDownload:[NodeAsyncConnection createHttpsRequest:@"/user/logIn" parameters:dict] :self :@selector(didEndLogin:)];
    [dict release];
    self.view.userInteractionEnabled = NO;
    [self.activityIndicator startAnimating];
    self.activityIndicator.hidden = NO;
}
- (void)didEndLogin:(NodeAsyncConnection *)connection
{
    [self.activityIndicator stopAnimating];
    self.activityIndicator.hidden = YES;
    self.view.userInteractionEnabled = YES;
    if (connection == nil || connection.result == nil)
    {
        return;
    }
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
    {
        NSDictionary *result = [connection.result objectForKey:@"result"];
        NSString *userId = [result objectForKey:@"userId"];
        NSString *userName = [result objectForKey:@"name"];
        NSString *userGender = [result objectForKey:@"gender"];
        NSString *userPhoto = [result objectForKey:@"primaryPhotoPath"];
        NSDictionary *userInfo = [[NSDictionary alloc]initWithDictionary:result];
        [[NSUserDefaults standardUserDefaults] setObject:userInfo forKey:@"PrettyUserInfo"];
        [userInfo release];
        [[NSUserDefaults standardUserDefaults] setObject:userId forKey:@"PrettyUserId"];
        [[NSUserDefaults standardUserDefaults] setObject:userName forKey:@"PrettyUserName"];
        [[NSUserDefaults standardUserDefaults] setObject:userGender forKey:@"PrettyUserGender"];
        [[NSUserDefaults standardUserDefaults] setObject:userPhoto forKey:@"PrettyUserPhoto"];
        
        [[NSUserDefaults standardUserDefaults] setObject:self.emailAccount forKey:@"PrettyUserEmail"];
        [[NSUserDefaults standardUserDefaults] setObject:self.emailAccount forKey:@"PreUserEmail"];
        [[NSUserDefaults standardUserDefaults]synchronize];
        [self.navigationController dismissModalViewControllerAnimated:YES];
        [[UIApplication sharedApplication] registerForRemoteNotificationTypes:UIRemoteNotificationTypeBadge | UIRemoteNotificationTypeAlert | UIRemoteNotificationTypeSound];
        NNMainTabViewController *mainTabViewController = [[NNMainTabViewController alloc]init];
        AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
        appDelegate.mainNavController.navigationBar.hidden = YES;
        [appDelegate.mainNavController setViewControllers:[NSArray arrayWithObject:mainTabViewController]];
        [mainTabViewController release];
    }
}
- (void)viewDidUnload
{
    [self setEmailTextField:nil];
    [self setPasswordTextField:nil];
    [self setResetPasswordButton:nil];
    [self setActivityIndicator:nil];
    [self setListView:nil];
    [self setEmailCell:nil];
    [self setPasswordCell:nil];
    [self setResetPassCell:nil];
    [self setRenrenCell:nil];
    [self setLoginButton:nil];
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    return (interfaceOrientation == UIInterfaceOrientationPortrait);
}
- (void)viewWillDisappear:(BOOL)animated
{
    [MobClick endLogPageView:@"LoginView"];
    if (lastActiveField != nil)
    {
        [lastActiveField resignFirstResponder];
    }
    [curConnection cancelDownload];
}
- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillShowNotification object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillHideNotification object:nil];
    //[[NSNotificationCenter defaultCenter] removeObserver:self name:UITextFieldTextDidChangeNotification object:nil];
    [[NSNotificationCenter defaultCenter]removeObserver:self name:@"UpdateDateListNotification" object:nil];
    [curConnection cancelDownload];
    [curConnection release];
    [emailTextField release];
    [passwordTextField release];
    [resetPasswordButton release];
    [activityIndicator release];
    [emailAccount release];
    [lastActiveField release];
    [_listView release];
    [_emailCell release];
    [_passwordCell release];
    [_resetPassCell release];
    [_renrenCell release];
    [_loginButton release];
    [super dealloc];
}
@end
