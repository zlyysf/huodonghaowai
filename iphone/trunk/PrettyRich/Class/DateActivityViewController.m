//
//  DateActivityViewController.m
//  PrettyRich
//
//  Created by liu miao on 9/22/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "DateActivityViewController.h"
#import "PrettyUtility.h"
#import "NNCreateDateViewController.h"
#import "DateActivityCell.h"
#import "MobClick.h"
@interface DateActivityViewController ()

@end

@implementation DateActivityViewController
@synthesize dateArray,curConnection,hasData,listView;
@synthesize refreshHeaderView,isRefreshing;
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
//    UIImage *buttonImage = [UIImage imageNamed:@"navigation-cancel-button.png"];
//    UIButton *button = [UIButton buttonWithType:UIButtonTypeCustom];
//    [button setImage:buttonImage forState:UIControlStateNormal];
//    button.frame = CGRectMake(0, 0, 28, 16);
//    [button addTarget:self action:@selector(backButtonClicked) forControlEvents:UIControlEventTouchUpInside];
//    UIBarButtonItem *customBarItem = [[UIBarButtonItem alloc] initWithCustomView:button];
//    self.navigationItem.leftBarButtonItem= customBarItem;
//    [customBarItem release];
    refreshHeaderView = [[EGORefreshTableHeaderView alloc] initWithFrame:CGRectMake(0.0f,  -REFRESHINGVIEW_HEIGHT, self.listView.frame.size.width,REFRESHINGVIEW_HEIGHT)];
    [self.listView addSubview:self.refreshHeaderView];
    self.refreshHeaderView.delegate = self;
    UIBarButtonItem *inviteButton = [[UIBarButtonItem alloc]initWithTitle:@"邀请" style:UIBarButtonItemStylePlain target:self action:@selector(inviteButtonClicked)];
    self.navigationItem.rightBarButtonItem = inviteButton;
    [inviteButton release];
    self.navigationItem.title = @"推荐活动";
    NodeAsyncConnection * aConn = [[NodeAsyncConnection alloc] init];
	self.curConnection = aConn;
	[aConn release];
    dateArray = [[NSMutableArray alloc]init];
    hasData = NO;
    self.isRefreshing = NO;
    self.activityIndicator.hidden = YES;
    // Do any additional setup after loading the view from its nib.
}
- (void)viewWillAppear:(BOOL)animated
{
    [MobClick beginLogPageView:@"DateActivityView"];
    if (!hasData)
    {
        [self autoRefresh];
        //[self startGetActivity];
    }
}
- (void)viewWillDisappear:(BOOL)animated
{
    [MobClick endLogPageView:@"DateActivityView"];
}

- (void)autoRefresh
{
    [self.listView setContentOffset:CGPointMake(0, -REFRESHINGVIEW_HEIGHT) animated:NO];
    [self.refreshHeaderView egoRefreshScrollViewDidEndDragging:self.listView];
}
- (void)refresh
{
    if (!self.isRefreshing)
    {
        self.isRefreshing = YES;
        [self startGetActivity];
    }
}
- (void)inviteButtonClicked
{
    Class messageClass = (NSClassFromString(@"MFMessageComposeViewController"));

    if ([messageClass canSendText])
    {
        [self startGenerateInviteCode];
        //[self displaySMSComposerSheet];
    }
    else
    {
        return;
        //feedbackMsg.hidden = NO;
        //feedbackMsg.text = @"Device not configured to send SMS.";
    }
}
- (void)startGenerateInviteCode
{
    self.activityIndicator.hidden = NO;
    [self.activityIndicator startAnimating];
    [self.navigationItem.rightBarButtonItem setEnabled:NO];
    NodeAsyncConnection *con = [[NodeAsyncConnection alloc]init];
    NSString *userId = [[NSUserDefaults standardUserDefaults] objectForKey:@"PrettyUserId"];
    NSDictionary *dict =[[NSDictionary alloc] initWithObjectsAndKeys:@"invite",@"type",userId,@"userId", nil];
    [con startDownload:[NodeAsyncConnection createNodeHttpRequest:@"/user/getSentingSMS" parameters:dict] :self :@selector(didEndGenerateInviteCode:)];
    [dict release];
}
- (void)didEndGenerateInviteCode:(NodeAsyncConnection *)connection
{
    self.activityIndicator.hidden = YES;
    [self.activityIndicator stopAnimating];
    [self.navigationItem.rightBarButtonItem setEnabled:YES];
    if (connection == nil ||connection.result == nil)
    {
        [connection release];
        return;
    }
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
    {
        NSDictionary *result = [connection.result objectForKey:@"result"];
        NSString *inviteCode = [result objectForKey:@"text"];
        if (![PrettyUtility isNull:inviteCode])
        {
            //NSLog(@"%@",inviteCode);
            [self displaySMSComposerSheet:inviteCode];
        }
    }
    [connection release];
}
-(void)displaySMSComposerSheet:(NSString *)body
{
	MFMessageComposeViewController *picker = [[MFMessageComposeViewController alloc] init];
	picker.messageComposeDelegate = self;
	picker.body = body;
    //[[UINavigationBar appearance] setTintColor:nil];
	[self presentModalViewController:picker animated:YES];
	[picker release];
}
- (void)messageComposeViewController:(MFMessageComposeViewController *)controller
                 didFinishWithResult:(MessageComposeResult)result
{
    //[[UINavigationBar appearance] setTintColor:[UIColor orangeColor]];
	[self dismissModalViewControllerAnimated:YES];
}

- (void)startGetActivity
{
    [curConnection cancelDownload];
    NSString *language = @"chinese";
    NSString *userId = [[NSUserDefaults standardUserDefaults] objectForKey:@"PrettyUserId"];
    NSDictionary *dict = [[NSDictionary alloc]initWithObjectsAndKeys:language,@"language",userId,@"userId", nil];
    [curConnection startDownload:[NodeAsyncConnection createNodeHttpRequest:@"/user/getActivityTypes" parameters:dict] :self :@selector(didEndGetActivity:)];
    [dict release];
}
- (void)didEndGetActivity:(NodeAsyncConnection *)connection
{
    if (self.isRefreshing)
    {
        self.isRefreshing = NO;
        [self.refreshHeaderView egoRefreshScrollViewDataSourceDidFinishedLoading:self.listView];
    }
    if (connection == nil ||connection.result == nil) {
        return;
    }
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
    {
        hasData = YES;
        NSDictionary *result = [connection.result objectForKey:@"result"];
        
        NSArray *types = [result objectForKey:@"types"];
        if (![PrettyUtility isNull:types])
        {
            self.dateArray = [NSMutableArray arrayWithArray:types];
            //NSLog(@"%@",self.dateArray);
            [self.listView reloadData];
            //[activityArray removeAllObjects];
            //[activityArray addObjectsFromArray:subjects];
        }
    }

}
//-(void)backButtonClicked
//{
//    [self.navigationController dismissModalViewControllerAnimated:YES];
//}
- (void)viewDidUnload
{
    [self setListView:nil];
    [self setActivityIndicator:nil];
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}
//- (CGFloat)tableView:(UITableView *)tableView heightForHeaderInSection:(NSInteger)section
//{
//    return 20;
//}
- (NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section
{
    return [[self.dateArray objectAtIndex:section]objectForKey:@"level1"];
}

//- (UIView *)tableView:(UITableView *)tableView viewForHeaderInSection:(NSInteger)section
//{
//
//        UIView *sectionView = [[[UIView alloc]initWithFrame:CGRectMake(0, 0, 320, 20)] autorelease];
//        sectionView.backgroundColor = [UIColor grayColor];
//        UILabel *level1 = [[UILabel alloc]initWithFrame:CGRectMake(20, 0, 280, 20)];
//        level1.font = [UIFont fontWithName:@"HelveticaNeue-Bold" size:15];
//        level1.text =[[self.dateArray objectAtIndex:section]objectForKey:@"level1"];
//        level1.textColor = [UIColor blackColor];
//        [sectionView addSubview:level1];
//        [level1 release];
//        return sectionView;
//
//}
- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    return (interfaceOrientation == UIInterfaceOrientationPortrait);
}
- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    return [self.dateArray count];
}
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{

    return [(NSArray*)[[self.dateArray objectAtIndex:section]objectForKey:@"level2"] count];

}
- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
    return 40;
}
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
//    if (indexPath.section == 0)
//    {
//        UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"CustomCell"];
//        if (cell == nil)
//        {
//            cell = [[[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:@"CustomCell"] autorelease];
//        }
//        [cell setSelectionStyle:UITableViewCellSelectionStyleNone];
//        UILabel *customLabel = [[UILabel alloc]initWithFrame:CGRectMake(0, 0, 320, 20)];
//        customLabel.text = @"自定义";
//        customLabel.textColor = [UIColor blackColor];
//        [cell.contentView addSubview:customLabel];
//        [customLabel release];
//        return cell;
//    }
//    else
//    {
    DateActivityCell *cell = (DateActivityCell *)[tableView dequeueReusableCellWithIdentifier:@"DateActivityCell"];
    if (cell == nil)
    {
        NSArray * array =[[NSBundle mainBundle]loadNibNamed:@"DateActivityCell" owner:nil options:nil ];
        cell = (DateActivityCell *)[array objectAtIndex:0];
    }
        //UILabel *contentLabel = [[UILabel alloc]init];
        NSArray *level2 = [[self.dateArray objectAtIndex:indexPath.section]objectForKey:@"level2"];
        NSString *content = [level2 objectAtIndex:indexPath.row];
//        CGSize size = [content sizeWithFont:[UIFont fontWithName:@"HelveticaNeue-Bold" size:15] constrainedToSize:CGSizeMake(290, 9999) lineBreakMode:UILineBreakModeWordWrap];
//        contentLabel.font = [UIFont fontWithName:@"HelveticaNeue-Bold" size:15];
//        contentLabel.textColor = [UIColor blackColor];
//        contentLabel.textAlignment = UITextAlignmentLeft;
//        contentLabel.lineBreakMode = UILineBreakModeWordWrap;
//        contentLabel.text = content;
//        contentLabel.frame = CGRectMake(0, 0, size.width, size.height);
//        [cell.contentView addSubview:contentLabel];
//        [contentLabel release];
    cell.activitylabel.text = content;
        return cell;
//    }

}
- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
    if([self.dateArray count] == 0)
        return;
    NNCreateDateViewController *createDateViewController = [[NNCreateDateViewController alloc]initWithNibName:@"NNCreateDateViewController" bundle:nil];
    if (indexPath.section == 0)
    {
        //createDateViewController.dateProposalType = DateProposalTypeCustom;
    }
    else
    {
        //createDateViewController.dateProposalType = DateProposalTypeSelected;
        NSArray *level2 = [[self.dateArray objectAtIndex:indexPath.section]objectForKey:@"level2Autotext"];
        NSString *content = [level2 objectAtIndex:indexPath.row];
        createDateViewController.selectedTopic = content;
    }
    [self.navigationController pushViewController:createDateViewController animated:YES];
    [tableView deselectRowAtIndexPath:indexPath animated:NO];
    [createDateViewController release];

}
- (float)getHeight:(NSString *)content
{
    float height = 0;
    CGSize size = [content sizeWithFont:[UIFont fontWithName:@"HelveticaNeue-Bold" size:15] constrainedToSize:CGSizeMake(290, 9999) lineBreakMode:UILineBreakModeWordWrap];
    height = size.height+10;
    return height;
}
- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
    [self.refreshHeaderView egoRefreshScrollViewDidScroll:scrollView];
}

- (void)scrollViewDidEndDragging:(UIScrollView *)scrollView willDecelerate:(BOOL)decelerate
{
    [self.refreshHeaderView egoRefreshScrollViewDidEndDragging:scrollView];
}
- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView
{
}
- (void)egoRefreshTableHeaderDidTriggerRefresh:(EGORefreshTableHeaderView*)view
{
    [self refresh];
}

- (BOOL)egoRefreshTableHeaderDataSourceIsLoading:(EGORefreshTableHeaderView*)view
{
	return self.isRefreshing; // should return if data source model is reloading
}
- (NSDate*)egoRefreshTableHeaderDataSourceLastUpdated:(EGORefreshTableHeaderView*)view
{
    return [NSDate date];
}

- (void)dealloc
{
    [refreshHeaderView release];
    [curConnection cancelDownload];
    [curConnection release];
    [dateArray release];
    [listView release];
    [_activityIndicator release];
    [super dealloc];
}
@end
