//
//  SettingsViewController.m
//  PrettyRich
//
//  Created by liu miao on 12/18/12.
//
//

#import "SettingsViewController.h"
#import "PrettyGlobalService.h"
#import "CustomAlertView.h"
@interface SettingsViewController ()<CustomAlertViewDelegate>

@end

@implementation SettingsViewController
@synthesize curConnection,hasRenRenId;
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
    
    NodeAsyncConnection * aConn = [[NodeAsyncConnection alloc] init];
	self.curConnection = aConn;
	[aConn release];
    
    UIBarButtonItem *back = [[UIBarButtonItem alloc]initWithTitle:@"返回" style:UIBarButtonItemStyleBordered target:self action:@selector(backButtonClicked)];
    self.navigationItem.leftBarButtonItem = back;
    [back release];
    self.navigationItem.title = @"设置";
    self.activityIndicator.hidden = YES;
    
    UIView *logoutback = [[UIView alloc]init];
    [self.logoutCell setBackgroundView:logoutback];
    [self.logoutCell setBackgroundColor:[UIColor clearColor]];
    [logoutback release];
    
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveGetLoggedInUserIdNotification:) name:@"kNotificationDidGetLoggedInUserId" object:nil];
    NSString *renrenId = [[NSUserDefaults standardUserDefaults]objectForKey:@"session_UserId"];
    if(renrenId)
    {
        hasRenRenId = YES;
    }
    else
    {
        hasRenRenId = NO;
    }
    // Do any additional setup after loading the view from its nib.
}
//- (NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section
//{
//    if(section == 0)
//    return @"账号绑定";
//    return @"";
//}
- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    return 2;
}
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    return 1;
}
- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
    return 44;
}
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (indexPath.section == 1)
    {
        return self.logoutCell;
    }
    else
    {
        if ([[Renren sharedRenren]isSessionValid])
        {
            return self.shareCheckedCell;
        }
        else
        {
            return self.shareUncheckCell;
        }
    }
}
- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (indexPath.section == 0)
    {
        if ([[Renren sharedRenren]isSessionValid])
        {
            UIAlertView *alert = [[UIAlertView alloc]initWithTitle:nil message:@"该账号已经与你的活动号外账号绑定，如果你确认要停止使用，请到人人网取消授权." delegate:nil cancelButtonTitle:@"确定" otherButtonTitles:nil];
            [alert show];
            [alert release];
        }
        else
        {
            CustomAlertView *alert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:@"绑定人人账户，将来你便可以用人人账户来登入活动号外." otherButton:@"现在绑定" cancelButton:@"暂不绑定" delegate:self duration:0];
            alert.tag = 102;
            [alert show];
            [alert release];
        }
    }
    [tableView deselectRowAtIndexPath:indexPath animated:NO];
}
-(IBAction)logoutClicked
{
    CustomAlertView *alert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:@"你确定要退出么？" otherButton:@"确认" cancelButton:@"取消" delegate:self duration:0];
    alert.tag = 100;
    [alert show];
    [alert release];
    
}
- (void)customAlert:(CustomAlertView *)alert DismissWithButtonTitle:(NSString *)buttonTitle
{
    if (alert.tag == 100)
    {
        if ([buttonTitle isEqualToString:@"确认"])
        {
            [self startLogout];
        }
    }
    if (alert.tag == 102)
    {
        if ([buttonTitle isEqualToString:@"现在绑定"])
        {
            NSArray *permissions = [NSArray arrayWithObjects:@"read_user_album",@"status_update",@"photo_upload",@"publish_feed",@"create_album",@"operate_like",nil];
            [[Renren sharedRenren] authorizationInNavigationWithPermisson:permissions andDelegate:self];
        }
    }

}
-(void)startLogout
{
    [self.navigationItem.leftBarButtonItem setEnabled:NO];
    [self.view bringSubviewToFront:self.activityIndicator];
    [self.activityIndicator startAnimating];
    self.activityIndicator.hidden= NO;
    NSString *userId = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserId"];
    NSDictionary *dict = [[NSDictionary alloc]initWithObjectsAndKeys:
                          userId,@"userId",
                          nil];
    [curConnection cancelDownload];
    [curConnection startDownload:[NodeAsyncConnection createNodeHttpRequest:@"/user/logOut" parameters:dict] :self :@selector(didEndLogout:)];
    [dict release];
}
- (void)didEndLogout:(NodeAsyncConnection *)connection
{
    [self.navigationItem.leftBarButtonItem setEnabled:YES];
    self.activityIndicator.hidden= YES;
    [self.activityIndicator stopAnimating];
    if (connection == nil || connection.result == nil)
    {
        return;
    }
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
    {
        [self dismissModalViewControllerAnimated:YES];
        PrettyGlobalService *globalService = [PrettyGlobalService shareInstance];
        [globalService prettyRichLogOut];
    }
}
- (void)backButtonClicked
{
    [curConnection cancelDownload];
    [self dismissModalViewControllerAnimated:YES];
}
#pragma mark - RenrenDelegate methods
- (void) didReceiveGetLoggedInUserIdNotification:(NSNotification *)notification
{
    hasRenRenId = YES;
    //NSString *renrenId = [[NSUserDefaults standardUserDefaults]objectForKey:@"session_UserId"];
    [self startBindingRenRen];
}

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
    [self.listView reloadData];
}

- (void)renren:(Renren *)renren loginFailWithError:(ROError*)error{
	NSString *title = [NSString stringWithFormat:@"Error code:%d", [error code]];
	NSString *description = [NSString stringWithFormat:@"%@", [error localizedDescription]];
	NSLog(@"loginfail:%@ %@",title,description);
}
- (void)startBindingRenRen
{
    NSString *sessionId = [[NSUserDefaults standardUserDefaults]objectForKey:@"session_UserId"];
    Renren *renren = [Renren sharedRenren];
    NSMutableDictionary *renrenAuthJson = [[NSMutableDictionary alloc]initWithCapacity:5];
    if (renren.accessToken) {
        [renrenAuthJson setObject:renren.accessToken forKey:@"access_Token"];
    }
	if (renren.expirationDate) {
		NSTimeInterval time = [renren.expirationDate timeIntervalSince1970];
        NSNumber *timeNumber = [NSNumber numberWithDouble:time];
		[renrenAuthJson setObject:timeNumber forKey:@"expiration_Date"];
	}
    if (renren.sessionKey) {
        [renrenAuthJson setObject:renren.sessionKey forKey:@"session_Key"];
    }
    if (renren.secret) {
        [renrenAuthJson setObject:renren.secret forKey:@"secret_Key"];
    }
	[renrenAuthJson setObject:sessionId forKey:@"session_UserId"];
    
    NSString * selfId = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserId"];
    NSDictionary *dict = [[NSDictionary alloc]initWithObjectsAndKeys:
                          selfId,@"userId",
                          sessionId,@"accountRenRen",
                          renrenAuthJson,@"renrenAuthObj",
                          @"renren",@"typeOf3rdPart",
                          nil];
    [renrenAuthJson release];
    [curConnection cancelDownload];
    [curConnection startDownload:[NodeAsyncConnection createNodeHttpRequest:@"/user/bind3rdPartAccount" parameters:dict] :self :@selector(didEndBindingRenRen:)];
    [dict release];
    self.view.userInteractionEnabled = NO;
    [self.activityIndicator startAnimating];
    self.activityIndicator.hidden = NO;

}
- (void)didEndBindingRenRen:(NodeAsyncConnection *)connection
{
    [self.activityIndicator stopAnimating];
    self.activityIndicator.hidden = YES;
    self.view.userInteractionEnabled = YES;
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
    {
        [[PrettyGlobalService shareInstance]publishFirstRenRenConnectFeed];
        [self.listView reloadData];
    }
    else
    {
        [[Renren sharedRenren]logout:self];
    }
    
}
- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (void)dealloc {
    [[NSNotificationCenter defaultCenter]removeObserver:self name:@"kNotificationDidGetLoggedInUserId" object:nil];
    [curConnection cancelDownload];
    [curConnection release];
    [_listView release];
    [_activityIndicator release];
    [_logoutCell release];
    [_shareUncheckCell release];
    [_shareCheckedCell release];
    [super dealloc];
}
- (void)viewDidUnload {
    [self setListView:nil];
    [self setActivityIndicator:nil];
    [self setLogoutCell:nil];
    [self setShareUncheckCell:nil];
    [self setShareCheckedCell:nil];
    [super viewDidUnload];
}
@end
