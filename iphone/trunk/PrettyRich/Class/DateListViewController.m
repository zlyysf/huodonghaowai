//
//  DateListViewController.m
//  PrettyRich
//
//  Created by miao liu on 5/16/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "DateListViewController.h"
#import "MessageViewController.h"
#import "AppDelegate.h"
#import "PrettyUtility.h"
#import "NNSecondProfileViewController.h"
#import "NNRespondListViewController.h"
#import "NNDateDetailViewController.h"
#import "MobClick.h"
@implementation DateListViewController
@synthesize confirmListView;
@synthesize isRefreshing,dateArray,listView,refreshHeaderView,loadFooterView,imageDownloadManager,isFirstLoad,curConnection,isReload,hasPast,pastCellIndex,dateOption,hasMore,calendarButton,activeButton,selfUserInfo,activeHasPast,confirmHasPast;
@synthesize activeListView,dateListType,activeRefreshHeaderView,activeDateOption,activeDateArray,activeHasMore,dateFilterButton,confirmRefreshHeaderView,confirmHasMore;
@synthesize confirmDateOption,confirmDateArray,activePastCellIndex,confirmPastCellIndex;
- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        // Custom initialization
    }
    return self;
}
- (void)viewDidUnload
{
    if (imageDownloadManager != nil) 
    {
        [imageDownloadManager cancelAllDownloadInProgress];
    }
    [self setConfirmListView:nil];
    [self setListView:nil];
    [self setActiveListView:nil];
    [self setTitleSegmentControl:nil];
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    return (interfaceOrientation == UIInterfaceOrientationPortrait);
}


- (void)viewDidLoad
{
    [super viewDidLoad];
    dateArray = [[NSMutableArray alloc]init];
    activeDateArray = [[NSMutableArray alloc]init];
    confirmDateArray = [[NSMutableArray alloc]init];
    refreshHeaderView = [[EGORefreshTableHeaderView alloc] initWithFrame:CGRectMake(0.0f,  -REFRESHINGVIEW_HEIGHT, self.listView.frame.size.width,REFRESHINGVIEW_HEIGHT)];
    activeRefreshHeaderView = [[EGORefreshTableHeaderView alloc] initWithFrame:CGRectMake(0.0f,  -REFRESHINGVIEW_HEIGHT, self.activeListView.frame.size.width,REFRESHINGVIEW_HEIGHT)];
    confirmRefreshHeaderView = [[EGORefreshTableHeaderView alloc] initWithFrame:CGRectMake(0.0f,  -REFRESHINGVIEW_HEIGHT, self.confirmListView.frame.size.width,REFRESHINGVIEW_HEIGHT)];
    loadFooterView = [[LoadingMoreFooterView alloc]initWithFrame:CGRectMake(0, 0, 320, 44.f)];
    [self.listView addSubview:self.refreshHeaderView];
    [self.activeListView addSubview:self.activeRefreshHeaderView];
    [self.confirmListView addSubview:self.confirmRefreshHeaderView];
    self.navigationItem.titleView = self.titleSegmentControl;
    self.refreshHeaderView.delegate = self;
    self.activeRefreshHeaderView.delegate = self;
    self.confirmRefreshHeaderView.delegate = self;
    self.isRefreshing = NO;
    self.isFirstLoad = YES;
    self.hasPast = NO;
    self.activeHasPast = NO;
    self.confirmHasPast = NO;
    self.hasMore = NO;
    self.activeHasMore = NO;
    self.confirmHasMore = NO;
    self.pastCellIndex = -1;
    self.activePastCellIndex = -1;
    self.confirmPastCellIndex = -1;
    imageDownloadManager = [[ImagesDownloadManager alloc] init];
    imageDownloadManager.imageDownloadDelegate = self;
    NodeAsyncConnection * aConn = [[NodeAsyncConnection alloc] init];
	self.curConnection = aConn;
	[aConn release];
    NSString *userId = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserId"];
    NSMutableDictionary *option= [[NSMutableDictionary alloc]initWithObjectsAndKeys:userId,@"userId",@"10",@"count",@"onlyActiveSend",@"type",nil];
    self.dateOption = option;
    [option release];
    
    NSMutableDictionary *option1= [[NSMutableDictionary alloc]initWithObjectsAndKeys:userId,@"userId",@"10",@"count",@"applying",@"type",nil];
    self.activeDateOption = option1;
    [option1 release];
    
    NSMutableDictionary *option2= [[NSMutableDictionary alloc]initWithObjectsAndKeys:userId,@"userId",@"10",@"count",@"invited",@"type",nil];
    self.confirmDateOption = option2;
    [option2 release];
    
    self.activeListView.tag = 201;////onlyActiveRespond
    self.listView.tag = 202;//onlyActiveSend
    self.confirmListView.tag = 203;//invited
    
       [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveUpdateDateListNotification:) name:@"UpdateDateListNotification" object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(didReceiveCreateDateNotification:) name:@"CreateDateNotification" object:nil];
    self.navigationItem.title = @"我的活动";
}
- (void) didReceiveCreateDateNotification:(NSNotification *)notification
{
    [self didSentDate];
}


- (void) didReceiveUpdateDateListNotification:(NSNotification *)notification
{
	if (dateListType == DateListTypeRespond)
    {
        [self.activeListView reloadData];
    }
    else if(dateListType == DateListTypeSent)
    {
        [self.listView reloadData];
    }
    else {
        [self.confirmListView reloadData];
    }
}
- (void)didSentDate
{
    if (self.dateListType == DateListTypeSent)
    {
        [self autoRefresh];
    }
    else 
    {
        [curConnection cancelDownload];
        if (imageDownloadManager != nil) 
        {
            [imageDownloadManager cancelAllDownloadInProgress];
        }
        if (self.isRefreshing)
        {
            self.isRefreshing = NO;
            [self.activeRefreshHeaderView egoRefreshScrollViewDataSourceDidFinishedLoading:activeListView];
            [self.confirmRefreshHeaderView egoRefreshScrollViewDataSourceDidFinishedLoading:confirmListView];
            self.loadFooterView.showActivityIndicator = NO;
        }
        dateListType = DateListTypeSent;
        self.isReload = NO;
        [self.view bringSubviewToFront:self.listView];
        [self autoRefresh];
    }
}
-(IBAction)segmentSelected:(id)sender
{
    UISegmentedControl *myUISegmentedControl=(UISegmentedControl *)sender;
    int index = myUISegmentedControl.selectedSegmentIndex;
    if (index == 0)
    {
        if (dateListType == DateListTypeSent)
        {
            return;
        }
        [curConnection cancelDownload];
        if (imageDownloadManager != nil) 
        {
            [imageDownloadManager cancelAllDownloadInProgress];
        }
        if (self.isRefreshing)
        {
            self.isRefreshing = NO;
            [self.activeRefreshHeaderView egoRefreshScrollViewDataSourceDidFinishedLoading:activeListView];
            [self.confirmRefreshHeaderView egoRefreshScrollViewDataSourceDidFinishedLoading:confirmListView];
            self.loadFooterView.showActivityIndicator = NO;
        }
        dateListType = DateListTypeSent;
        self.isReload = NO;
        //[dateFilterButton setImage:[UIImage imageNamed:@"date-sent-off.png"] forState:UIControlStateNormal];
        
        [self.view bringSubviewToFront:self.listView];
        //NSArray *buttonTitle = [NSArray arrayWithObjects:@"Received",@"Confirmed", nil];
        if (self.dateArray ==nil || [self.dateArray count]==0)
        {
            [self autoRefresh];
        }
    }
    else if(index == 1)
    {
        if (dateListType == DateListTypeConfirmed)
        {
            return;
        }
        [curConnection cancelDownload];
        if (imageDownloadManager != nil)
        {
            [imageDownloadManager cancelAllDownloadInProgress];
        }
        if (self.isRefreshing)
        {
            self.isRefreshing = NO;
            [self.refreshHeaderView egoRefreshScrollViewDataSourceDidFinishedLoading:listView];
            [self.activeRefreshHeaderView egoRefreshScrollViewDataSourceDidFinishedLoading:activeListView];
            self.loadFooterView.showActivityIndicator = NO;
        }
        dateListType = DateListTypeConfirmed;
        self.isReload = NO;
        //[dateFilterButton setImage:[UIImage imageNamed:@"date-confirmed-off.png"] forState:UIControlStateNormal];
        [self.view bringSubviewToFront:self.confirmListView];
        //NSArray *buttonTitle = [NSArray arrayWithObjects:@"Sent",@"Received", nil];
        if (self.confirmDateArray ==nil || [self.confirmDateArray count]==0)
        {
            [self autoRefresh];
        }
    }
    else 
    {

        if (dateListType == DateListTypeRespond)
        {
            return;
        }
        [curConnection cancelDownload];
        if (imageDownloadManager != nil)
        {
            [imageDownloadManager cancelAllDownloadInProgress];
        }
        if (self.isRefreshing)
        {
            self.isRefreshing = NO;
            [self.refreshHeaderView egoRefreshScrollViewDataSourceDidFinishedLoading:listView];
            [self.confirmRefreshHeaderView egoRefreshScrollViewDataSourceDidFinishedLoading:confirmListView];
            self.loadFooterView.showActivityIndicator = NO;
        }
        dateListType = DateListTypeRespond;
        self.isReload = NO;
        //[dateFilterButton setImage:[UIImage imageNamed:@"date-received-off.png"] forState:UIControlStateNormal];
        
        [self.view bringSubviewToFront:self.activeListView];
        if (self.activeDateArray ==nil || [self.activeDateArray count]==0)
        {
            [self autoRefresh];
        }


    }
}
- (void)viewWillAppear:(BOOL)animated
{
    [MobClick beginLogPageView:@"DateListView"];
    if (self.dateListType == DateListTypeSent)
    {
        //[dateFilterButton setImage:[UIImage imageNamed:@"date-sent-off.png"] forState:UIControlStateNormal];
        [self.view bringSubviewToFront:self.listView];
        //NSArray *buttonTitle = [NSArray arrayWithObjects:@"Received",@"Confirmed", nil];
    }
    else if(self.dateListType == DateListTypeRespond)
    {
        //[dateFilterButton setImage:[UIImage imageNamed:@"date-received-off.png"] forState:UIControlStateNormal];
        [self.view bringSubviewToFront:self.activeListView];
        //NSArray *buttonTitle = [NSArray arrayWithObjects:@"Sent",@"Confirmed", nil];
    }
    else {
        //[dateFilterButton setImage:[UIImage imageNamed:@"date-confirmed-off.png"] forState:UIControlStateNormal];
        [self.view bringSubviewToFront:self.confirmListView];
        //NSArray *buttonTitle = [NSArray arrayWithObjects:@"Sent",@"Received", nil];

    }
    if (isFirstLoad)
    {
        [self autoRefresh];
        isFirstLoad = NO;
    }
}
//-(void)calendarButtonClicked
//{
//    if (dateListType == DateListTypeCalendar) 
//    {
//        return;
//    }
//    [curConnection cancelDownload];
//    if (imageDownloadManager != nil) 
//    {
//        [imageDownloadManager cancelAllDownloadInProgress];
//    }
//    if (self.isRefreshing)
//    {
//        self.isRefreshing = NO;
//        [self.activeRefreshHeaderView egoRefreshScrollViewDataSourceDidFinishedLoading:activeListView];
//        self.loadFooterView.showActivityIndicator = NO;
//    }
//    dateListType = DateListTypeCalendar;
//    self.isReload = NO;
//    [calendarButton setBackgroundImage:[UIImage imageNamed:@"calender-button-on.png"] forState:UIControlStateNormal];
//    [activeButton setBackgroundImage:[UIImage imageNamed:@"target-button-off.png"] forState:UIControlStateNormal];
//    [self.view bringSubviewToFront:self.listView];
//    if (self.dateArray ==nil || [self.dateArray count]==0)
//    {
//        [self autoRefresh];
//    }
//}
-(void)viewWillDisappear:(BOOL)animated
{
    [MobClick endLogPageView:@"DateListView"];
}
//-(void)activeButtonClicked
//{
//    if (dateListType == DateListTypeActive) 
//    {
//        return;
//    }
//    [curConnection cancelDownload];
//    if (imageDownloadManager != nil) 
//    {
//        [imageDownloadManager cancelAllDownloadInProgress];
//    }
//    if (self.isRefreshing)
//    {
//        self.isRefreshing = NO;
//        [self.refreshHeaderView egoRefreshScrollViewDataSourceDidFinishedLoading:listView];
//        self.loadFooterView.showActivityIndicator = NO;
//    }
//    dateListType = DateListTypeActive;
//    self.isReload = NO;
//    [calendarButton setBackgroundImage:[UIImage imageNamed:@"calender-button-off.png"] forState:UIControlStateNormal];
//    [activeButton setBackgroundImage:[UIImage imageNamed:@"target-button-on.png"] forState:UIControlStateNormal];
//    [self.view bringSubviewToFront:self.activeListView];
//    if (self.activeDateArray ==nil || [self.activeDateArray count]==0)
//    {
//        [self autoRefresh];
//    }
//}
- (void)autoRefresh
{
    if(dateListType == DateListTypeSent)
    {
        [self.listView setContentOffset:CGPointMake(0, -REFRESHINGVIEW_HEIGHT) animated:NO]; 
        [self.refreshHeaderView egoRefreshScrollViewDidEndDragging:self.listView];
    }
    else if(dateListType == DateListTypeRespond)
    {
        [self.activeListView setContentOffset:CGPointMake(0, -REFRESHINGVIEW_HEIGHT) animated:NO]; 
        [self.activeRefreshHeaderView egoRefreshScrollViewDidEndDragging:self.activeListView];

    }
    else {
        [self.confirmListView setContentOffset:CGPointMake(0, -REFRESHINGVIEW_HEIGHT) animated:NO]; 
        [self.confirmRefreshHeaderView egoRefreshScrollViewDidEndDragging:self.confirmListView];

    }
}

- (void)loadMore
{
    if(!self.isRefreshing)
    {
        self.isRefreshing = YES;
        self.loadFooterView.showActivityIndicator = YES;
        if (dateListType == DateListTypeSent) {
            NSString *cutOffTime = [[self.dateArray lastObject] objectForKey:@"orderScore"];
            long long time = [cutOffTime longLongValue];
            time = time-1;
            cutOffTime = [NSString stringWithFormat:@"%lld",time];
            [self.dateOption setObject:cutOffTime forKey:@"cutOffTime"];
        }
        else if(dateListType == DateListTypeRespond)
        {
            NSString *cutOffTime = [[self.activeDateArray lastObject] objectForKey:@"orderScore"];
            long long time = [cutOffTime longLongValue];
            time = time-1;
            cutOffTime = [NSString stringWithFormat:@"%lld",time];
            [self.activeDateOption setObject:cutOffTime forKey:@"cutOffTime"];
        }
        else {
            NSString *cutOffTime = [[self.confirmDateArray lastObject] objectForKey:@"orderScore"];
            long long time = [cutOffTime longLongValue];
            time = time+1;
            cutOffTime = [NSString stringWithFormat:@"%lld",time];
            [self.confirmDateOption setObject:cutOffTime forKey:@"cutOffTime"];

        }
        //we need to update option here
        [self startGetDates];
    }
}
- (void)refresh
{
    if (!self.isRefreshing)
    {
        self.isRefreshing = YES;
        isReload = YES;
        if (dateListType == DateListTypeSent) {
            [self.dateOption removeObjectForKey:@"cutOffTime"];
           
        }
        else if (dateListType == DateListTypeRespond) {
            [self.activeDateOption removeObjectForKey:@"cutOffTime"];
            
        }
        else {
            [self.confirmDateOption removeObjectForKey:@"cutOffTime"];
        }
        [self startGetDates];
    }
    
}
- (void)startCloseDate:(NSString *)dateId
{
    [curConnection cancelDownload];
    NSDictionary *dict = [NSDictionary dictionaryWithObject:dateId forKey:@"dateId"];
    [curConnection startDownload:[NodeAsyncConnection createNodeHttpRequest:@"/user/stopDate" parameters:dict] :self :@selector(didEndCloseDate:)];
    
}
- (void)didEndCloseDate:(NodeAsyncConnection *)connection
{
    //NSLog(@"%@",connection.result);
}
- (void)startGetDates
{
    [curConnection cancelDownload];
    if (dateListType == DateListTypeSent)
    {
        [curConnection startDownload:[NodeAsyncConnection createNodeHttpRequest:@"/user/getDates" parameters:dateOption] :self :@selector(didEndGetDates:)];
    }
    else if (dateListType == DateListTypeRespond)
    {
        [curConnection startDownload:[NodeAsyncConnection createNodeHttpRequest:@"/user/getDates" parameters:activeDateOption] :self :@selector(didEndGetDates:)];
    }
    else {
        [curConnection startDownload:[NodeAsyncConnection createNodeHttpRequest:@"/user/getDates" parameters:confirmDateOption] :self :@selector(didEndGetDates:)];
    }


}
- (void)didEndGetDates:(NodeAsyncConnection *)connection;
{
    if (self.isRefreshing)
    {
        self.isRefreshing = NO;
        [self.refreshHeaderView egoRefreshScrollViewDataSourceDidFinishedLoading:listView];
        [self.activeRefreshHeaderView egoRefreshScrollViewDataSourceDidFinishedLoading:activeListView];
        [self.confirmRefreshHeaderView egoRefreshScrollViewDataSourceDidFinishedLoading:confirmListView];
        self.loadFooterView.showActivityIndicator = NO;
    }
    if (connection == nil ||connection.result == nil) {
        return;
    }
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
    {
        NSDictionary *result = [connection.result objectForKey:@"result"];
        self.selfUserInfo = [NSDictionary dictionaryWithDictionary:[result objectForKey:@"user"]];
        if (dateListType == DateListTypeSent)
        {
            NSArray *dates = [result objectForKey:@"dates"];
            if ([dates count]<10)
            {
                hasMore = NO;
            }
            else {
                hasMore = YES;
            }
            
            if (isReload)
            {
                
                [self.dateArray removeAllObjects];
                isReload = NO;
            }
            
            for (int i=0; i<[dates count]; i++)
            {
                NSMutableDictionary *date = [NSMutableDictionary dictionaryWithDictionary:[dates objectAtIndex:i]];
                //coming date add
                NSDictionary *sender = [date objectForKey:@"sender"];
                if ([PrettyUtility isNull:sender]) 
                {
                    [date setObject:@"send" forKey:@"dateType"];
                }
                else {
                    [date setObject:@"receive" forKey:@"dateType"];
                }
                NSString *confirmCount = [date objectForKey:@"confirmedPersonCount"];
                if ([PrettyUtility isNull:confirmCount])
                {
                    [date setObject:@"0" forKey:@"confirmedPersonCount"];
                }
                NSNumber *seconds = [NSNumber numberWithLongLong:[[date objectForKey:@"dateDate"]longLongValue]];
                if([PrettyUtility isPastTime:seconds])
                {
                    [date setObject:[NSNumber numberWithBool:YES] forKey:@"alreadyPast"];
                }
                else
                {
                    [date setObject:[NSNumber numberWithBool:NO] forKey:@"alreadyPast"];
                }

                [self.dateArray addObject:date];
            }
            //NSLog(@"%@",self.dateArray);
            [self.listView reloadData];

        }
        else if (dateListType == DateListTypeRespond)
        {
            NSArray *dates = [result objectForKey:@"dates"];
            if ([dates count]<10)
            {
                activeHasMore = NO;
            }
            else {
                activeHasMore = YES;
            }
            
            if (isReload)
            {
                
                [self.activeDateArray removeAllObjects];
                isReload = NO;
            }
            
            for (int i=0; i<[dates count]; i++)
            {
                NSMutableDictionary *date = [NSMutableDictionary dictionaryWithDictionary:[dates objectAtIndex:i]];
                //coming date add
                NSDictionary *sender = [date objectForKey:@"sender"];
                if ([PrettyUtility isNull:sender]) 
                {
                    [date setObject:@"send" forKey:@"dateType"];
                }
                else {
                    [date setObject:@"receive" forKey:@"dateType"];
                }
                NSString *confirmCount = [date objectForKey:@"confirmedPersonCount"];
                if ([PrettyUtility isNull:confirmCount])
                {
                    [date setObject:@"0" forKey:@"confirmedPersonCount"];
                }
                NSNumber *seconds = [NSNumber numberWithLongLong:[[date objectForKey:@"dateDate"]longLongValue]];
                if([PrettyUtility isPastTime:seconds])
                {
                    [date setObject:[NSNumber numberWithBool:YES] forKey:@"alreadyPast"];
                }
                else
                {
                    [date setObject:[NSNumber numberWithBool:NO] forKey:@"alreadyPast"];
                }

                [self.activeDateArray addObject:date];
            }
            //NSLog(@"%@",self.activeDateArray);
            [self.activeListView reloadData];

        }
        else {
            NSArray *dates = [result objectForKey:@"dates"];
            if ([dates count]<10)
            {
                confirmHasMore = NO;
            }
            else {
                confirmHasMore = YES;
            }
            
            if (isReload)
            {
                
                [self.confirmDateArray removeAllObjects];
                isReload = NO;
            }
            
            for (int i=0; i<[dates count]; i++)
            {
                NSMutableDictionary *date = [NSMutableDictionary dictionaryWithDictionary:[dates objectAtIndex:i]];
                //coming date add
                NSDictionary *sender = [date objectForKey:@"sender"];
                if ([PrettyUtility isNull:sender]) 
                {
                    [date setObject:@"send" forKey:@"dateType"];
                }
                else {
                    [date setObject:@"receive" forKey:@"dateType"];
                }
                NSString *confirmCount = [date objectForKey:@"confirmedPersonCount"];
                if ([PrettyUtility isNull:confirmCount])
                {
                    [date setObject:@"0" forKey:@"confirmedPersonCount"];
                }
                NSNumber *seconds = [NSNumber numberWithLongLong:[[date objectForKey:@"dateDate"]longLongValue]];
                if([PrettyUtility isPastTime:seconds])
                {
                    [date setObject:[NSNumber numberWithBool:YES] forKey:@"alreadyPast"];
                }
                else
                {
                    [date setObject:[NSNumber numberWithBool:NO] forKey:@"alreadyPast"];
                }
                //NSLog(@"%@",self.confirmDateArray);
                [self.confirmDateArray addObject:date];
            }

            [self.confirmListView reloadData];
        }
    }
    //we need a processing to generate the result what we want
}
- (float)getCellHeight:(NSDictionary *)cellDict
{
    NSString *cellType = [cellDict objectForKey:@"dateType"];
    if ([cellType isEqualToString:@"receive"])
    {
        return 119.5;
    }
    else
    {
        float height = 45.5;
        NSString *description = [cellDict objectForKey:@"description"];
        if ([[cellDict objectForKey:@"isDesOpen"] boolValue]) {
            height += (10+[PrettyUtility calculateHeight:description :[UIFont fontWithName:@"Arial" size:12]  :274 :UILineBreakModeWordWrap]);
        }
        else {
            height += 25;
        }
        NSArray *responders = [cellDict objectForKey:@"responders"];
        if ([PrettyUtility isNull:responders])
        {
            return  height;
        }
        else {
            height += 35;
            if (![PrettyUtility isNull:[cellDict objectForKey:@"doubleConfirmed"]]&&[[cellDict objectForKey:@"doubleConfirmed"]boolValue]) 
            {
                height += 84;
            }
            if ([[cellDict objectForKey:@"isResOpen"] boolValue])
            {
                height += 74*[responders count];
            }
            return  height;
        }
        
    }
}
//- (void)reloadIndexPath:(NSIndexPath *)indexPath withCell:(NSMutableDictionary*)cellDict
//{
//    if (dateListType == DateListTypeSent) 
//    {
//        float height = [self getCellHeight:cellDict];
//        [cellDict setValue:[NSNumber numberWithFloat:height] forKey:@"cellHeight"];
//        
//        [self.dateArray replaceObjectAtIndex:indexPath.row withObject:cellDict];
//        
//        [self.listView reloadData];
//    }
//    else if (dateListType == DateListTypeReceived)
//    {
//        float height = [self getCellHeight:cellDict];
//        [cellDict setValue:[NSNumber numberWithFloat:height] forKey:@"cellHeight"];
//        
//        [self.activeDateArray replaceObjectAtIndex:indexPath.row withObject:cellDict];
//        
//        [self.activeListView reloadData];
//    }
//    else {
//        float height = [self getCellHeight:cellDict];
//        [cellDict setValue:[NSNumber numberWithFloat:height] forKey:@"cellHeight"];
//        
//        [self.confirmDateArray replaceObjectAtIndex:indexPath.row withObject:cellDict];
//        
//        [self.confirmListView reloadData];
//    }
//
//}
- (void) imageDidDownload:(ImageDownloader *)downloader
{
    if (downloader.downloadImage != nil)
    {
        AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
        [appDelegate.imageCache setObject:downloader.downloadImage forKey:downloader.imageUrl];
        NSIndexPath * imageIndexPath = downloader.indexPathInTableView;
        if ([imageIndexPath length] == 2) 
        {
            NNDateRespondCell *cell;
            if (dateListType == DateListTypeSent)
            {
                return;
            }
            else if (dateListType == DateListTypeRespond)
            {
                cell = (NNDateRespondCell*)[activeListView cellForRowAtIndexPath:imageIndexPath];
            }
            else {
                cell = (NNDateRespondCell*)[confirmListView cellForRowAtIndexPath:imageIndexPath];
            }
            if (cell != nil) 
            {
                if ([cell.imgUrl isEqualToString:downloader.imageUrl])
                {
                    [cell.userPhotoView setImage:downloader.downloadImage];
                }
                
            }
            
        }
//        if ([imageIndexPath length] == 3)
//        {
//            int tagOfImageView = [imageIndexPath indexAtPosition:2]+100;
//            NSUInteger indexArr[] = {[imageIndexPath indexAtPosition:0],[imageIndexPath indexAtPosition:1]};
//            NSIndexPath *rowIndexPath = [[NSIndexPath alloc] initWithIndexes:indexArr length:2];
//            DateSentCell *cell;
//            if (dateListType == DateListTypeSent)
//            {
//                cell = (DateSentCell*)[listView cellForRowAtIndexPath:rowIndexPath];
//            }
//            else if (dateListType == DateListTypeRespond){
//                cell = (DateSentCell*)[activeListView cellForRowAtIndexPath:rowIndexPath];
//            }
//            else {
//                cell = (DateSentCell*)[confirmListView cellForRowAtIndexPath:rowIndexPath];
//            }
//
//            [rowIndexPath release];
//            if (cell != nil)
//            {
//                UIImageView *imgView = (UIImageView*)[cell.respondScrollView viewWithTag:tagOfImageView];
//                if (imgView != nil)
//                {
//                    imgView.image = downloader.downloadImage;
//                }
//            }
//        }
    }
    [imageDownloadManager removeOneDownloaderWithIndexPath:downloader.indexPathInTableView];
    
}
#pragma mark - DateRespondCellDelegate
- (void)dateTitleButtonClicked:(NSIndexPath*)cellIndex
{
    //enter date datail
    NSMutableDictionary *dateInfo;
    if (dateListType == DateListTypeSent)
    {
        dateInfo = [self.dateArray objectAtIndex:cellIndex.row];
    }
    else if (dateListType == DateListTypeRespond)
    {
        dateInfo = [self.activeDateArray objectAtIndex:cellIndex.row];
    }
    else {
        dateInfo = [self.confirmDateArray objectAtIndex:cellIndex.row];
    }
    NNDateDetailViewController *detail = [[NNDateDetailViewController alloc]initWithNibName:@"NNDateDetailViewController" bundle:nil];
    detail.dateDict = dateInfo;
    [self.navigationController pushViewController:detail animated:YES];
    [detail release];
}
//{
//    NSString *date;
//    NSString *target;
//    NSString *targetName;
//    NSString *targetUrl;
//    MessageViewController *messageViewController = [[MessageViewController alloc]initWithNibName:@"MessageViewController" bundle:nil];
//    NSMutableDictionary *dateInfo;
//    if (dateListType == DateListTypeSent)
//    {
//        dateInfo = [self.dateArray objectAtIndex:cellIndex.row];
//    }
//    else if (dateListType == DateListTypeRespond)
//    {
//        dateInfo = [self.activeDateArray objectAtIndex:cellIndex.row];
//    }
//    else {
//        dateInfo = [self.confirmDateArray objectAtIndex:cellIndex.row];
//    }
//    date = [dateInfo objectForKey:@"dateId"];
//    target = [[dateInfo objectForKey:@"sender"] objectForKey:@"userId"];
//    targetName = [[dateInfo objectForKey:@"sender"] objectForKey:@"name"];
//    NSString *profileUrl = [[dateInfo objectForKey:@"sender"] objectForKey:@"primaryPhotoPath"];
//    if (![PrettyUtility isNull:profileUrl])
//    {
//    targetUrl = [PrettyUtility getPhotoUrl:profileUrl :@"fw"];
//    messageViewController.targetUrl = targetUrl;
//    }
//    messageViewController.dateDict = dateInfo;
//    //messageViewController.confirmState = confirmStateHide;
//    messageViewController.dateId = date;
//    messageViewController.targetId = target;
//    messageViewController.targetName = targetName;
//    messageViewController.speakerInfo = self.selfUserInfo;
//    messageViewController.needSycMeesage = NO;
//    
//    messageViewController.messageViewType = MessageViewTypeReceiver;
//    [self.navigationController pushViewController:messageViewController animated:YES];
//    [messageViewController release];
//}
- (void)userInCellClicked:(NSIndexPath*)cellIndex
{
    //enter profile
        NSMutableDictionary *dateInfo;
        if (dateListType == DateListTypeSent)
        {
            return;
        }
        else if (dateListType == DateListTypeRespond)
        {
            dateInfo = [self.activeDateArray objectAtIndex:cellIndex.row];
        }
        else {
            dateInfo = [self.confirmDateArray objectAtIndex:cellIndex.row];
        }
    NSDictionary *sender = [dateInfo objectForKey:@"sender"];
    NSString *target = [sender objectForKey:@"userId"];
    //NSString *name = [sender objectForKey:@"name"];
    NNSecondProfileViewController *profileViewController = [[NNSecondProfileViewController alloc]initWithNibName:@"NNSecondProfileViewController" bundle:nil];
    profileViewController.profileId = target;
    [self.navigationController pushViewController:profileViewController animated:YES];
    [profileViewController release];
}
#pragma mark - DateSentCellDelegate
- (void)dateTitleClickedForIndex:(NSIndexPath*)userIndex
{
    //enter date detail
    NSMutableDictionary *dateInfo;
    if (dateListType == DateListTypeSent)
    {
        dateInfo = [self.dateArray objectAtIndex:userIndex.row];
    }
    else if (dateListType == DateListTypeRespond)
    {
        dateInfo = [self.activeDateArray objectAtIndex:userIndex.row];
    }
    else {
        dateInfo = [self.confirmDateArray objectAtIndex:userIndex.row];
    }
    NNDateDetailViewController *detail = [[NNDateDetailViewController alloc]initWithNibName:@"NNDateDetailViewController" bundle:nil];
    detail.dateDict = dateInfo;
    [self.navigationController pushViewController:detail animated:YES];
    [detail release];
}
//- (void)userPhotoClickedForIndex:(NSIndexPath*)userIndex tag:(int)photoTag
//{
//    //enter 1-1 msg 
//    NSString *date;
//    NSString *target;
//    NSString *targetName;
//    NSMutableDictionary *dateInfo;
//    NSString *targetUrl;
//    if (dateListType == DateListTypeSent)
//    {
//        dateInfo = [self.dateArray objectAtIndex:userIndex.row];
//    }
//    else if (dateListType == DateListTypeRespond)
//    {
//        dateInfo = [self.activeDateArray objectAtIndex:userIndex.row];
//    }
//    else {
//        dateInfo = [self.confirmDateArray objectAtIndex:userIndex.row];
//    }
//
//    date = [dateInfo objectForKey:@"dateId"];
//    NSDictionary *responder = [[dateInfo objectForKey:@"responders"] objectAtIndex:photoTag];
//    target = [responder objectForKey:@"responderId"];
//    targetName = [responder objectForKey:@"name"];
//    NSString *profileUrl = [responder objectForKey:@"primaryPhotoPath"];
//    
//    MessageViewController *messageViewController = [[MessageViewController alloc]initWithNibName:@"MessageViewController" bundle:nil];
//    if (![PrettyUtility isNull:profileUrl])
//    {
//        targetUrl = [PrettyUtility getPhotoUrl:profileUrl :@"fw"];
//        messageViewController.targetUrl = targetUrl;
//    }
//
//    messageViewController.dateDict = dateInfo;
//    messageViewController.dateId = date;
//    messageViewController.targetId = target;
//    messageViewController.targetName = targetName;
//    messageViewController.targetInfoIndex = photoTag;
//    messageViewController.speakerInfo = self.selfUserInfo;
//    messageViewController.messageViewType = MessageViewTypeSender;
//    messageViewController.needSycMeesage = NO;
//
//    if ([PrettyUtility isNull:[dateInfo objectForKey:@"finalCandidateId"]]) 
//    {
//        messageViewController.confirmState = confirmStateActive;
//    }
//    else {
//
//        messageViewController.confirmState = confirmStateConfirmed;
//    }
//    
//    //AppDelegate *delegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
//    [self.navigationController pushViewController:messageViewController animated:YES];
//    [messageViewController release];
//
//}
//- (void)dateClosedForIndex:(NSIndexPath *)userIndex
//{
//    NSString *date;
//    NSMutableDictionary *dateInfo;
//    if (dateListType == DateListTypeSent)
//    {
//        dateInfo = [self.dateArray objectAtIndex:userIndex.row];
//    }
//    else if (dateListType == DateListTypeRespond)
//    {
//        dateInfo = [self.activeDateArray objectAtIndex:userIndex.row];
//    }
//    else {
//        dateInfo = [self.confirmDateArray objectAtIndex:userIndex.row];
//    }
//    [dateInfo setObject:[NSNumber numberWithBool:YES] forKey:@"alreadyStopped"];
//    date = [dateInfo objectForKey:@"dateId"];
//    [self startCloseDate:date];
//    NSArray *reloadArr = [NSArray arrayWithObject:userIndex];
//    if (dateListType == DateListTypeSent)
//    {
//        [self.listView reloadRowsAtIndexPaths:reloadArr withRowAnimation:UITableViewRowAnimationFade];
//    }
//    else if (dateListType == DateListTypeRespond)
//    {
//        [self.activeListView reloadRowsAtIndexPaths:reloadArr withRowAnimation:UITableViewRowAnimationFade];
//    }
//    else {
//        [self.confirmListView reloadRowsAtIndexPaths:reloadArr withRowAnimation:UITableViewRowAnimationFade];
//    }
//
//}

#pragma mark - Table view data source

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    // Return the number of sections.
    return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    // Return the number of rows in the section.
    if (tableView.tag == 202) {
        int num = [self.dateArray count];
        if (hasMore) 
        {
            return  num+1;
        }
        else {
            return num;
        }
    }
    else if (tableView.tag == 201)
    {
        int num = [self.activeDateArray count];
        if (activeHasMore) 
        {
            return  num+1;
        }
        else {
            return num;
        }

    }
    else {
        int num = [self.confirmDateArray count];
        if (confirmHasMore) 
        {
            return  num+1;
        }
        else {
            return num;
        }
    }


}
- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (tableView.tag == 202) 
    {
        if (indexPath.row == [self.dateArray count])
        {
            return 44.0;
        }
        else
        {
            return 91.0;
        }
    }
    else if (tableView.tag == 201)
    {
        if (indexPath.row == [self.activeDateArray count])
        {
            return 44.0;
        }
        else
        {
            return 91.0;
        }
    }
    else
    {
        if (indexPath.row == [self.confirmDateArray count])
        {
            return 44.0;
        }
        else
        {
            return 91.0;
        }
        
    }

}
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    //self.activeListView.tag = 201;////onlyActiveRespond
    //self.listView.tag = 202;//onlyActiveSend
    //self.confirmListView.tag = 203;//invited

    AppDelegate *appDelegate = [[UIApplication sharedApplication]delegate];
    if (tableView.tag == 202)
    {
        if (hasMore && indexPath.row == [self.dateArray count])
        {
            UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"LoadMoreCell"];
            if (cell == nil) 
            {
                cell = [[[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:@"LoadMoreCell"] autorelease];
            }
            [cell.contentView addSubview:self.loadFooterView];
            [cell setSelectionStyle:UITableViewCellSelectionStyleNone];
            return cell;
        }
        if (indexPath.row >=0 && indexPath.row <[self.dateArray count])
        {
            //if ([[[self.dateArray objectAtIndex:indexPath.row]objectForKey:@"dateType"]isEqualToString:@"send"])
            //{
                NSDictionary *dateInfo = [self.dateArray objectAtIndex:indexPath.row];
                NNDateSentCell *cell = (NNDateSentCell *)[tableView dequeueReusableCellWithIdentifier:@"NNDateSentCell"];
                if (cell == nil)
                {
                    NSArray * array =[[NSBundle mainBundle]loadNibNamed:@"NNDateSentCell" owner:nil options:nil ];
                    cell = (NNDateSentCell *)[array objectAtIndex:0];     
                }
                cell.cellIndex = indexPath;
                cell.delegate= self;
                [cell customCellWithInfo:dateInfo];
                return cell;
//                NSArray * responders = [dateInfo objectForKey:@"responders"];
//                if (![PrettyUtility isNull:responders]) 
//                {
//                    for (int i=0; i< [responders count]; i++)
//                    {
//                        UIImageView *imgView = (UIImageView*)[cell.respondScrollView viewWithTag:100+i];
//                        NSString *photoPath = [[responders objectAtIndex:i]objectForKey:@"primaryPhotoPath"];
//                        NSString *photoUrl = [PrettyUtility getPhotoUrl:photoPath :@"s"];
//                        UIImage *photo = [appDelegate.imageCache objectForKey:photoUrl];
//                        if (photo == nil)
//                        {
//                            if (tableView.dragging == NO && tableView.decelerating == NO)
//                            {
//                                NSIndexPath * orignIndex = [indexPath copy];
//                                NSIndexPath *photoIndexPath = [orignIndex indexPathByAddingIndex:i];
//                                [orignIndex release];                         
//                                [imageDownloadManager downloadImageWithUrl:photoUrl forIndexPath:photoIndexPath];
//                            }                
//                        }
//                        else 
//                        {
//                            imgView.image = photo;
//                        }
//                    }
//                }
                
            //}
//            else {
//                NSDictionary *dateInfo = [self.dateArray objectAtIndex:indexPath.row];
//                DateResponCell *cell = (DateResponCell *)[tableView dequeueReusableCellWithIdentifier:@"DateResponCell"];
//                if (cell == nil)
//                {
//                    NSArray * array =[[NSBundle mainBundle]loadNibNamed:@"DateResponCell" owner:nil options:nil ];
//                    cell = (DateResponCell *)[array objectAtIndex:0];     
//                }
//                cell.index = indexPath;
//                cell.delegate= self;
//                [cell customCellWithInfo:dateInfo];
//                NSDictionary *sender = [dateInfo objectForKey:@"sender"];
//                NSString *photoPath = [sender objectForKey:@"primaryPhotoPath"];
//                NSString *photoUrl = [PrettyUtility getPhotoUrl:photoPath :@"s"];
//                UIImage *photo = [appDelegate.imageCache objectForKey:photoUrl];
//                if (photo == nil)
//                {
//                    if (tableView.dragging == NO && tableView.decelerating == NO)
//                    {                       
//                        [imageDownloadManager downloadImageWithUrl:photoUrl forIndexPath:indexPath];
//                    }                
//                }
//                else 
//                {
//                    cell.userImageView.image = photo;
//                }
//                return cell;
//            }
        }
        else {
            UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"EmptyCell"];
            if (cell == nil) 
            {
                cell = [[[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:@"EmptyCell"] autorelease];
            }
            [cell setSelectionStyle:UITableViewCellSelectionStyleNone];
            return cell;
        }
    }
    else if (tableView.tag == 201)
    {
        if (activeHasMore && indexPath.row == [self.activeDateArray count])
        {
            UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"LoadMoreCell"];
            if (cell == nil) 
            {
                cell = [[[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:@"LoadMoreCell"] autorelease];
            }
            [cell.contentView addSubview:self.loadFooterView];
            [cell setSelectionStyle:UITableViewCellSelectionStyleNone];
            return cell;
        }
        if (indexPath.row >=0 && indexPath.row <[self.activeDateArray count]) 
        {
            //if ([[[self.activeDateArray objectAtIndex:indexPath.row]objectForKey:@"dateType"]isEqualToString:@"receive"])
            //{
//                NSDictionary *dateInfo = [self.activeDateArray objectAtIndex:indexPath.row];
//                DateSentCell *cell = (DateSentCell *)[tableView dequeueReusableCellWithIdentifier:@"DateSentCell"];
//                
//                
//                if (cell == nil)
//                {
//                    NSArray * array =[[NSBundle mainBundle]loadNibNamed:@"DateSentCell" owner:nil options:nil ];
//                    cell = (DateSentCell *)[array objectAtIndex:0];     
//                }
//                cell.index = indexPath;
//                cell.delegate= self;
//
//                [cell customCellWithInfo:dateInfo];
//                NSArray * responders = [dateInfo objectForKey:@"responders"];
//                if (![PrettyUtility isNull:responders]) 
//                {
//                    for (int i=0; i< [responders count]; i++)
//                    {
//                        UIImageView *imgView = (UIImageView*)[cell.respondScrollView viewWithTag:100+i];
//                        NSString *photoPath = [[responders objectAtIndex:i]objectForKey:@"primaryPhotoPath"];
//                        NSString *photoUrl = [PrettyUtility getPhotoUrl:photoPath :@"s"];
//                        UIImage *photo = [appDelegate.imageCache objectForKey:photoUrl];
//                        if (photo == nil)
//                        {
//                            if (tableView.dragging == NO && tableView.decelerating == NO)
//                            {
//                                NSIndexPath * orignIndex = [indexPath copy];
//                                NSIndexPath *photoIndexPath = [orignIndex indexPathByAddingIndex:i];
//                                [orignIndex release];                         
//                                [imageDownloadManager downloadImageWithUrl:photoUrl forIndexPath:photoIndexPath];
//                            }                
//                        }
//                        else 
//                        {
//                            imgView.image = photo;
//                        }
//                    }
//                }
//                return cell;
//            }
//            else {
                NSDictionary *dateInfo = [self.activeDateArray objectAtIndex:indexPath.row];
                NNDateRespondCell *cell = (NNDateRespondCell *)[tableView dequeueReusableCellWithIdentifier:@"NNDateRespondCell"];
                
                if (cell == nil)
                {
                    NSArray * array =[[NSBundle mainBundle]loadNibNamed:@"NNDateRespondCell" owner:nil options:nil ];
                    cell = (NNDateRespondCell *)[array objectAtIndex:0];     
                }
                cell.cellIndex = indexPath;
                cell.delegate= self;
                
                [cell customCellWithInfo:dateInfo];
                NSDictionary *sender = [dateInfo objectForKey:@"sender"];
                NSString *photoPath = [sender objectForKey:@"primaryPhotoPath"];
                NSString *photoUrl = [PrettyUtility getPhotoUrl:photoPath :@"s"];
                UIImage *photo = [appDelegate.imageCache objectForKey:photoUrl];
                cell.imgUrl = photoUrl;
                if (photo == nil)
                {
                    cell.userPhotoView.image = [UIImage imageNamed:@"user-head.png"];
                    if (tableView.dragging == NO && tableView.decelerating == NO)
                    {                       
                        [imageDownloadManager downloadImageWithUrl:photoUrl forIndexPath:indexPath];
                    }                
                }
                else 
                {
                    cell.userPhotoView.image = photo;
                }

                return cell;
            //}
        }
        else {
            UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"EmptyCell"];
            if (cell == nil) 
            {
                cell = [[[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:@"EmptyCell"] autorelease];
            }
            [cell setSelectionStyle:UITableViewCellSelectionStyleNone];
            return cell;
        }
    }
    else
    {
        if (confirmHasMore && indexPath.row == [self.confirmDateArray count])
        {
            UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"LoadMoreCell"];
            if (cell == nil) 
            {
                cell = [[[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:@"LoadMoreCell"] autorelease];
            }
            [cell.contentView addSubview:self.loadFooterView];
            [cell setSelectionStyle:UITableViewCellSelectionStyleNone];
            return cell;
        }
        if (indexPath.row >=0 && indexPath.row <[self.confirmDateArray count]) 
        {
            //if ([[[self.confirmDateArray objectAtIndex:indexPath.row]objectForKey:@"dateType"]isEqualToString:@"receive"])
            //{
//                NSDictionary *dateInfo = [self.confirmDateArray objectAtIndex:indexPath.row];
//                DateSentCell *cell = (DateSentCell *)[tableView dequeueReusableCellWithIdentifier:@"DateSentCell"];
//                
//                
//                if (cell == nil)
//                {
//                    NSArray * array =[[NSBundle mainBundle]loadNibNamed:@"DateSentCell" owner:nil options:nil ];
//                    cell = (DateSentCell *)[array objectAtIndex:0];     
//                }
//                cell.index = indexPath;
//                cell.delegate= self;
//                
//                [cell customCellWithInfo:dateInfo];
//                NSArray * responders = [dateInfo objectForKey:@"responders"];
//                if (![PrettyUtility isNull:responders]) 
//                {
//                    for (int i=0; i< [responders count]; i++)
//                    {
//                        UIImageView *imgView = (UIImageView*)[cell.respondScrollView viewWithTag:100+i];
//                        NSString *photoPath = [[responders objectAtIndex:i]objectForKey:@"primaryPhotoPath"];
//                        NSString *photoUrl = [PrettyUtility getPhotoUrl:photoPath :@"s"];
//                        UIImage *photo = [appDelegate.imageCache objectForKey:photoUrl];
//                        if (photo == nil)
//                        {
//                            if (tableView.dragging == NO && tableView.decelerating == NO)
//                            {
//                                NSIndexPath * orignIndex = [indexPath copy];
//                                NSIndexPath *photoIndexPath = [orignIndex indexPathByAddingIndex:i];
//                                [orignIndex release];                         
//                                [imageDownloadManager downloadImageWithUrl:photoUrl forIndexPath:photoIndexPath];
//                            }                
//                        }
//                        else 
//                        {
//                            imgView.image = photo;
//                        }
//                    }
//                }
//                return cell;
//            }
//            else {
                NSDictionary *dateInfo = [self.confirmDateArray objectAtIndex:indexPath.row];
                NNDateRespondCell *cell = (NNDateRespondCell *)[tableView dequeueReusableCellWithIdentifier:@"NNDateRespondCell"];
                
                if (cell == nil)
                {
                    NSArray * array =[[NSBundle mainBundle]loadNibNamed:@"NNDateRespondCell" owner:nil options:nil ];
                    cell = (NNDateRespondCell *)[array objectAtIndex:0];     
                }
                cell.cellIndex = indexPath;
                cell.delegate= self;
                [cell customCellWithInfo:dateInfo];
                NSDictionary *sender = [dateInfo objectForKey:@"sender"];
                NSString *photoPath = [sender objectForKey:@"primaryPhotoPath"];
                NSString *photoUrl = [PrettyUtility getPhotoUrl:photoPath :@"s"];
                UIImage *photo = [appDelegate.imageCache objectForKey:photoUrl];
                cell.imgUrl = photoUrl;
                if (photo == nil)
                {
                    cell.userPhotoView.image = [UIImage imageNamed:@"user-head.png"];
                    if (tableView.dragging == NO && tableView.decelerating == NO)
                    {                       
                        [imageDownloadManager downloadImageWithUrl:photoUrl forIndexPath:indexPath];
                    }                
                }
                else 
                {
                    cell.userPhotoView.image = photo;
                }

                return cell;
            //}
        }
        else {
            UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"EmptyCell"];
            if (cell == nil) 
            {
                cell = [[[UITableViewCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:@"EmptyCell"] autorelease];
            }
            [cell setSelectionStyle:UITableViewCellSelectionStyleNone];
            return cell;
        }
    }

}
-(void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (tableView.tag == 202)
    {
        if (indexPath.row >=0 && indexPath.row <[self.dateArray count])
        {
            NSMutableDictionary * dateInfo = [self.dateArray objectAtIndex:indexPath.row];
            NNRespondListViewController *respondList = [[NNRespondListViewController alloc]initWithNibName:@"NNRespondListViewController" bundle:nil];
            respondList.dateDict = dateInfo;
            [self.navigationController pushViewController:respondList animated:YES];
            [respondList release];
        }
       
    }
    else if (tableView.tag == 201)
    {
        if (indexPath.row >=0 && indexPath.row <[self.activeDateArray count])
        {
            MessageViewController *messageViewController = [[MessageViewController alloc]initWithNibName:@"MessageViewController" bundle:nil];
            
            NSString *targetUrl;
            NSMutableDictionary *dateInfo = [self.activeDateArray objectAtIndex:indexPath.row];
            NSMutableDictionary *responderDict = [[dateInfo objectForKey:@"responders"] objectAtIndex:0];
            NSNumber *seconds = [NSNumber numberWithLongLong:[[dateInfo objectForKey:@"dateDate"]longLongValue]];
            if([PrettyUtility isPastTime:seconds])
            {
                [dateInfo setObject:[NSNumber numberWithBool:YES] forKey:@"alreadyPast"];
            }
            else
            {
                [dateInfo setObject:[NSNumber numberWithBool:NO] forKey:@"alreadyPast"];
            }

            NSString *dateId = [dateInfo objectForKey:@"dateId"];
            NSDictionary *sender = [dateInfo objectForKey:@"sender"];
            NSString *targetId = [sender objectForKey:@"userId"];
            NSString *targetName = [sender objectForKey:@"name"];
            NSString *profileUrl = [sender objectForKey:@"primaryPhotoPath"];
            
            if (![PrettyUtility isNull:profileUrl])
            {
                targetUrl = [PrettyUtility getPhotoUrl:profileUrl :@"fw"];
                messageViewController.targetUrl = targetUrl;
            }
            else
            {
                NSString *datePhoto = [dateInfo objectForKey:@"photoPath"];
                if (![PrettyUtility isNull:datePhoto])
                {
                    targetUrl = [PrettyUtility getPhotoUrl:datePhoto :@"fw"];
                    messageViewController.targetUrl = targetUrl;
                }
            }

            messageViewController.dateDict = dateInfo;
            messageViewController.dateId = dateId;
            messageViewController.targetId = targetId;
            messageViewController.targetName = targetName;
            messageViewController.messageViewType = MessageViewTypeRequesting;
            messageViewController.latestMessageDict = responderDict;
            if ([[dateInfo objectForKey:@"alreadyPast"]boolValue])
            {
                if([[responderDict objectForKey:@"haveRate"] boolValue])
                {
                    messageViewController.confirmState = confirmStateRated;
                }
                else
                {
                    messageViewController.confirmState = confirmStatePastNotRate;
                }
            }
            else
            {
                messageViewController.confirmState = confirmStateNotPast;
            }
            AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
            [appDelegate.mainNavController pushViewController:messageViewController animated:YES];
            [messageViewController release];
        }
    }
    else
    {
        if (indexPath.row >=0 && indexPath.row <[self.confirmDateArray count])
        {
            MessageViewController *messageViewController = [[MessageViewController alloc]initWithNibName:@"MessageViewController" bundle:nil];
            
            NSString *targetUrl;
            NSMutableDictionary *dateInfo = [self.confirmDateArray objectAtIndex:indexPath.row];
            NSNumber *seconds = [NSNumber numberWithLongLong:[[dateInfo objectForKey:@"dateDate"]longLongValue]];
            if([PrettyUtility isPastTime:seconds])
            {
                [dateInfo setObject:[NSNumber numberWithBool:YES] forKey:@"alreadyPast"];
            }
            else
            {
                [dateInfo setObject:[NSNumber numberWithBool:NO] forKey:@"alreadyPast"];
            }

            NSMutableDictionary *responderDict = [[dateInfo objectForKey:@"responders"] objectAtIndex:0];
            
            NSString *dateId = [dateInfo objectForKey:@"dateId"];
            NSDictionary *sender = [dateInfo objectForKey:@"sender"];
            NSString *targetId = [sender objectForKey:@"userId"];
            NSString *targetName = [sender objectForKey:@"name"];
            NSString *profileUrl = [sender objectForKey:@"primaryPhotoPath"];
            
            if (![PrettyUtility isNull:profileUrl])
            {
                targetUrl = [PrettyUtility getPhotoUrl:profileUrl :@"fw"];
                messageViewController.targetUrl = targetUrl;
            }
            else
            {
                NSString *datePhoto = [dateInfo objectForKey:@"photoPath"];
                if (![PrettyUtility isNull:datePhoto])
                {
                    targetUrl = [PrettyUtility getPhotoUrl:datePhoto :@"fw"];
                    messageViewController.targetUrl = targetUrl;
                }
            }

            messageViewController.dateDict = dateInfo;
            messageViewController.dateId = dateId;
            messageViewController.targetId = targetId;
            messageViewController.targetName = targetName;
            messageViewController.messageViewType = MessageViewTypeInvited;
            messageViewController.latestMessageDict = responderDict;
            if ([[dateInfo objectForKey:@"alreadyPast"]boolValue])
            {
                if([[responderDict objectForKey:@"haveRate"] boolValue])
                {
                    messageViewController.confirmState = confirmStateRated;
                }
                else
                {
                    messageViewController.confirmState = confirmStatePastNotRate;
                }
            }
            else
            {
                messageViewController.confirmState = confirmStateNotPast;
            }
            AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
            [appDelegate.mainNavController pushViewController:messageViewController animated:YES];
            [messageViewController release];

        }
    }
    [tableView deselectRowAtIndexPath:indexPath animated:YES];
}
- (void)loadImagesForOnscreenRows
{
    AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
    if (dateListType == DateListTypeSent)
    {
        return;
        NSArray *visiblePaths = [self.listView indexPathsForVisibleRows];
        for (NSIndexPath *indexPath in visiblePaths)
        {
            if ([[[self.dateArray objectAtIndex:indexPath.row]objectForKey:@"dateType"]isEqualToString:@"send"])
            {
                NSDictionary *dateInfo = [self.dateArray objectAtIndex:indexPath.row];
                NSArray * responders = [dateInfo objectForKey:@"responders "];
                if (![PrettyUtility isNull:responders]) 
                {
                    for (int i=0; i< [responders count]; i++)
                    {
                        NSString *photoPath = [[responders objectAtIndex:i]objectForKey:@"primaryPhotoPath"];
                        NSString *photoUrl = [PrettyUtility getPhotoUrl:photoPath :@"s"];
                        UIImage *photo = [appDelegate.imageCache objectForKey:photoUrl];
                        if (photo == nil)
                        {
                            
                            NSIndexPath * orignIndex = [indexPath copy];
                            NSIndexPath *photoIndexPath = [orignIndex indexPathByAddingIndex:i];
                            [orignIndex release];                         
                            [imageDownloadManager downloadImageWithUrl:photoUrl forIndexPath:photoIndexPath];              
                        }
                        else 
                        {
                            break;
                        }
                    }
                }
            }
            else 
            {
                NSDictionary *dateInfo = [self.dateArray objectAtIndex:indexPath.row];
                NSDictionary *sender = [dateInfo objectForKey:@"sender"];
                NSString *photoPath = [sender objectForKey:@"primaryPhotoPath"];
                NSString *photoUrl = [PrettyUtility getPhotoUrl:photoPath :@"s"];
                UIImage *photo = [appDelegate.imageCache objectForKey:photoUrl];
                if (photo == nil)
                {                     
                    [imageDownloadManager downloadImageWithUrl:photoUrl forIndexPath:indexPath];               
                }
                else 
                {
                    break;
                }

            }              
        }
    }
    else if(dateListType == DateListTypeRespond)
    {
        NSArray *visiblePaths = [self.activeListView indexPathsForVisibleRows];
        for (NSIndexPath *indexPath in visiblePaths)
        {
            int index = indexPath.row;
            if (index< 0 || index >= [self.activeDateArray count])
            {
                break;
            }
            if ([[[self.activeDateArray objectAtIndex:indexPath.row]objectForKey:@"dateType"]isEqualToString:@"send"])
            {
                NSDictionary *dateInfo = [self.activeDateArray objectAtIndex:indexPath.row];
                NSArray * responders = [dateInfo objectForKey:@"responders "];
                if (![PrettyUtility isNull:responders]) 
                {
                    for (int i=0; i< [responders count]; i++)
                    {
                        NSString *photoPath = [[responders objectAtIndex:i]objectForKey:@"primaryPhotoPath"];
                        NSString *photoUrl = [PrettyUtility getPhotoUrl:photoPath :@"s"];
                        UIImage *photo = [appDelegate.imageCache objectForKey:photoUrl];
                        if (photo == nil)
                        {
                            
                            NSIndexPath * orignIndex = [indexPath copy];
                            NSIndexPath *photoIndexPath = [orignIndex indexPathByAddingIndex:i];
                            [orignIndex release];                         
                            [imageDownloadManager downloadImageWithUrl:photoUrl forIndexPath:photoIndexPath];              
                        }
                        else 
                        {
                            break;
                        }
                    }
                }
            }
            else 
            {
                NSDictionary *dateInfo = [self.activeDateArray objectAtIndex:indexPath.row];
                NSDictionary *sender = [dateInfo objectForKey:@"sender"];
                NSString *photoPath = [sender objectForKey:@"primaryPhotoPath"];
                NSString *photoUrl = [PrettyUtility getPhotoUrl:photoPath :@"s"];
                UIImage *photo = [appDelegate.imageCache objectForKey:photoUrl];
                if (photo == nil)
                {                     
                    [imageDownloadManager downloadImageWithUrl:photoUrl forIndexPath:indexPath];               
                }
                else 
                {
                    NNDateRespondCell *cell = (NNDateRespondCell*)[self.activeListView cellForRowAtIndexPath:indexPath];
                    if ([cell.imgUrl isEqualToString:photoUrl])
                    {
                        [cell.userPhotoView setImage:photo];
                    }

                    //break;
                }
                
            }              
        }

    }
    else {
        NSArray *visiblePaths = [self.confirmListView indexPathsForVisibleRows];
        for (NSIndexPath *indexPath in visiblePaths)
        {
            int index = indexPath.row;
            if (index< 0 || index >= [self.confirmDateArray count])
            {
                break;
            }
            if ([[[self.confirmDateArray objectAtIndex:indexPath.row]objectForKey:@"dateType"]isEqualToString:@"send"])
            {
                NSDictionary *dateInfo = [self.confirmDateArray objectAtIndex:indexPath.row];
                NSArray * responders = [dateInfo objectForKey:@"responders "];
                if (![PrettyUtility isNull:responders]) 
                {
                    for (int i=0; i< [responders count]; i++)
                    {
                        NSString *photoPath = [[responders objectAtIndex:i]objectForKey:@"primaryPhotoPath"];
                        NSString *photoUrl = [PrettyUtility getPhotoUrl:photoPath :@"s"];
                        UIImage *photo = [appDelegate.imageCache objectForKey:photoUrl];
                        if (photo == nil)
                        {
                            
                            NSIndexPath * orignIndex = [indexPath copy];
                            NSIndexPath *photoIndexPath = [orignIndex indexPathByAddingIndex:i];
                            [orignIndex release];                         
                            [imageDownloadManager downloadImageWithUrl:photoUrl forIndexPath:photoIndexPath];              
                        }
                        else 
                        {
                            break;
                        }
                    }
                }
            }
            else 
            {
                NSDictionary *dateInfo = [self.confirmDateArray objectAtIndex:indexPath.row];
                NSDictionary *sender = [dateInfo objectForKey:@"sender"];
                NSString *photoPath = [sender objectForKey:@"primaryPhotoPath"];
                NSString *photoUrl = [PrettyUtility getPhotoUrl:photoPath :@"s"];
                UIImage *photo = [appDelegate.imageCache objectForKey:photoUrl];
                if (photo == nil)
                {                     
                    [imageDownloadManager downloadImageWithUrl:photoUrl forIndexPath:indexPath];               
                }
                else 
                {
                    NNDateRespondCell *cell = (NNDateRespondCell*)[self.activeListView cellForRowAtIndexPath:indexPath];
                    if ([cell.imgUrl isEqualToString:photoUrl])
                    {
                        [cell.userPhotoView setImage:photo];
                    }

                    //break;
                }
                
            }              
        }

    }
}

#pragma mark - Table view delegate

- (void)dealloc
{
    if (imageDownloadManager != nil) 
    {
        [imageDownloadManager cancelAllDownloadInProgress];
        imageDownloadManager.imageDownloadDelegate = nil;
    }
    [[NSNotificationCenter defaultCenter]removeObserver:self name:@"CreateDateNotification" object:nil];
    [[NSNotificationCenter defaultCenter]removeObserver:self name:@"UpdateDateListNotification" object:nil];
    [activeDateOption release];
    [activeDateArray release];
    [curConnection cancelDownload];
    [curConnection release];
    [refreshHeaderView release];
    [activeRefreshHeaderView release];
    [dateOption release];
    [loadFooterView release];
    [imageDownloadManager release];
    [dateArray release];
    [listView release];
    [calendarButton release];
    [activeButton release];
    [selfUserInfo release];
    [activeListView release];
    [dateFilterButton release];
    [confirmListView release];
    [confirmRefreshHeaderView release];
    [confirmDateArray release];
    [confirmDateOption release];
    [_titleSegmentControl release];
    [super dealloc];
}
- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
    if (dateListType == DateListTypeSent)
    {
        [self.refreshHeaderView egoRefreshScrollViewDidScroll:scrollView];
    }
    else if (dateListType == DateListTypeRespond)
    {
        [self.activeRefreshHeaderView egoRefreshScrollViewDidScroll:scrollView];
    }
    else 
    {
        [self.confirmRefreshHeaderView egoRefreshScrollViewDidScroll:scrollView];
    }

}

- (void)scrollViewDidEndDragging:(UIScrollView *)scrollView willDecelerate:(BOOL)decelerate
{
    if (decelerate == NO)
	{
        // scroll stopped
        [self loadImagesForOnscreenRows];
    }
    if (dateListType == DateListTypeSent) 
    {
        
        [self.refreshHeaderView egoRefreshScrollViewDidEndDragging:scrollView];
        float bottomEdge = scrollView.contentOffset.y + scrollView.frame.size.height;
        float compareEdge = scrollView.frame.size.height>scrollView.contentSize.height?scrollView.frame.size.height:scrollView.contentSize.height;
        if (bottomEdge >= compareEdge) 
        {
            if ([self.dateArray count]!=0 && hasMore) 
            {
                [self loadMore];
            }
            
        }
    }
    else if (dateListType == DateListTypeRespond)
    {
        [self.activeRefreshHeaderView egoRefreshScrollViewDidEndDragging:scrollView];
        float bottomEdge = scrollView.contentOffset.y + scrollView.frame.size.height;
        float compareEdge = scrollView.frame.size.height>scrollView.contentSize.height?scrollView.frame.size.height:scrollView.contentSize.height;
        if (bottomEdge >= compareEdge) 
        {
            if ([self.activeDateArray count]!=0 && activeHasMore) 
            {
                [self loadMore];
            }
        }
    }
    else
    {
        [self.confirmRefreshHeaderView egoRefreshScrollViewDidEndDragging:scrollView];
        float bottomEdge = scrollView.contentOffset.y + scrollView.frame.size.height;
        float compareEdge = scrollView.frame.size.height>scrollView.contentSize.height?scrollView.frame.size.height:scrollView.contentSize.height;
        if (bottomEdge >= compareEdge) 
        {
            if ([self.confirmDateArray count]!=0 && confirmHasMore) 
            {
                [self loadMore];
            }
        }

    }
}
- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView
{
    [self loadImagesForOnscreenRows];
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

@end
