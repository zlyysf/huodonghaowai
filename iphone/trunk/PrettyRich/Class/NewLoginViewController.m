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
@synthesize curConnection,emailAccount,lastActiveField;
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
    UIBarButtonItem *customBarItem = [[UIBarButtonItem alloc]initWithTitle:@"登录" style:UIBarButtonItemStyleBordered target:self action:@selector(startLogin)];
    self.navigationItem.rightBarButtonItem = customBarItem;
    [customBarItem release];
    self.emailTextField.tag = 201;
    self.passwordTextField.tag = 202;
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(textDidChanged:) name:UITextFieldTextDidChangeNotification object:nil];
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
    [self.navigationItem.rightBarButtonItem setEnabled:NO];
    self.navigationItem.title = @"已注册用户";
}
- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    // Return the number of sections.
    return 2;
}
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    // Return the number of rows in the section.
    
    if (section == 0)
        return 2;
    else
        return 1;
}
- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
    return 44.0;
}
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (indexPath.section == 0)
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

- (void)textDidChanged:(NSNotification *)notification
{
    if ([self.emailTextField.text length]!=0 && [self.passwordTextField.text length]!=0)
    {
        [self.navigationItem.rightBarButtonItem setEnabled:YES];
    }
    else {
        [self.navigationItem.rightBarButtonItem setEnabled:NO];
    }
}
- (void)backButtonClicked
{
    [curConnection cancelDownload];
    [self.navigationController popViewControllerAnimated:YES];
}
- (IBAction)resetPassword
{
    NSString *host;
    if (NewServer)
    {
        host = @"http://42.121.122.47:4000";//prod
    }
    else
    {
        host = @"http://ec2-23-23-144-110.compute-1.amazonaws.com:4000";//prod
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
    [self.emailTextField becomeFirstResponder];
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
    //self.emailTextField.userInteractionEnabled = NO;
    //self.passwordTextField.userInteractionEnabled = NO;
    self.view.userInteractionEnabled = NO;
    [self.activityIndicator startAnimating];
    self.activityIndicator.hidden = NO;
    [self.navigationItem.rightBarButtonItem setEnabled:NO];
}
- (void)didEndLogin:(NodeAsyncConnection *)connection
{
    [self.activityIndicator stopAnimating];
    self.activityIndicator.hidden = YES;
    [self.navigationItem.rightBarButtonItem setEnabled:YES];
    //self.emailTextField.userInteractionEnabled = YES;
    //self.passwordTextField.userInteractionEnabled = YES;
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
        //NSString *userCredit = [result objectForKey:@"credit"];
        [[NSUserDefaults standardUserDefaults] setObject:userId forKey:@"PrettyUserId"];
        [[NSUserDefaults standardUserDefaults] setObject:userName forKey:@"PrettyUserName"];
        [[NSUserDefaults standardUserDefaults] setObject:userGender forKey:@"PrettyUserGender"];
        [[NSUserDefaults standardUserDefaults] setObject:userPhoto forKey:@"PrettyUserPhoto"];
        
        //[[NSUserDefaults standardUserDefaults] setObject:userCredit forKey:@"PrettyUserCredit"];
        [[NSUserDefaults standardUserDefaults] setObject:self.emailAccount forKey:@"PrettyUserEmail"];
        [[NSUserDefaults standardUserDefaults] setObject:self.emailAccount forKey:@"PreUserEmail"];
        //NSDate *today = [NSDate date];
        //[[NSUserDefaults standardUserDefaults]setObject:today forKey:@"PrettyLastSign"];
        [[NSUserDefaults standardUserDefaults]synchronize];
        [self.navigationController dismissModalViewControllerAnimated:YES];
        [[UIApplication sharedApplication] registerForRemoteNotificationTypes:UIRemoteNotificationTypeBadge | UIRemoteNotificationTypeAlert | UIRemoteNotificationTypeSound];
        NNMainTabViewController *mainTabViewController = [[NNMainTabViewController alloc]init];
        //navigationController.naviAutoType = NaviAutoTypeNearbyDate;
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
    [curConnection cancelDownload];
}
- (void)dealloc {
        [[NSNotificationCenter defaultCenter] removeObserver:self name:UITextFieldTextDidChangeNotification object:nil];
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
    [super dealloc];
}
@end
