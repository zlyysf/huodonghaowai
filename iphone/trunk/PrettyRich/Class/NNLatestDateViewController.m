//
//  NNLatestDateViewController.m
//  PrettyRich
//
//  Created by liu miao on 10/22/12.
//
//

#import "NNLatestDateViewController.h"
#import "AppDelegate.h"
#import "PrettyUtility.h"
#import "NNSecondProfileViewController.h"
#import "NNDateDisplayViewController.h"
#import "MobClick.h"
@interface NNLatestDateViewController ()

@end

@implementation NNLatestDateViewController
@synthesize isFirstLoad,refreshHeaderView,isRefreshing,loadFooterView,dateArray,imageDownloadManager,dateOption,curConnection,isReload,hasMore;
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
    self.navigationItem.title = @"最新活动";
    self.isFirstLoad = YES;
    refreshHeaderView = [[EGORefreshTableHeaderView alloc] initWithFrame:CGRectMake(0.0f,  -REFRESHINGVIEW_HEIGHT, self.listView.frame.size.width,REFRESHINGVIEW_HEIGHT)];
    loadFooterView = [[LoadingMoreFooterView alloc]initWithFrame:CGRectMake(0, 0, 320, 44.f)];
    [self.listView addSubview:self.refreshHeaderView];
    self.refreshHeaderView.delegate = self;
    self.isRefreshing = NO;
    dateArray = [[NSMutableArray alloc]init];
    imageDownloadManager = [[ImagesDownloadManager alloc] init];
    imageDownloadManager.imageDownloadDelegate = self;
    NodeAsyncConnection * aConn = [[NodeAsyncConnection alloc] init];
	self.curConnection = aConn;
	[aConn release];
    NSString *userId = [[NSUserDefaults standardUserDefaults] objectForKey:@"PrettyUserId"];
    NSMutableDictionary *option = [[NSMutableDictionary alloc]initWithObjectsAndKeys:userId,@"userId",@"0",@"start",@"10",@"count",nil];
    self.dateOption = option;
    [option release];
    self.hasMore = NO;

}
- (void)viewWillAppear:(BOOL)animated
{
    [MobClick beginLogPageView:@"LatestDateListView"];
    if (isFirstLoad)
    {
        [self autoRefresh];
        isFirstLoad = NO;
    }
    else
    {
        if (self.dateArray ==nil || [self.dateArray count]==0)
        {
            [self autoRefresh];
        }
    }
}
- (void)viewWillDisappear:(BOOL)animated
{
    [MobClick endLogPageView:@"LatestDateListView"];
}
- (void)autoRefresh
{
    [self.listView setContentOffset:CGPointMake(0, -REFRESHINGVIEW_HEIGHT) animated:NO];
    [self.refreshHeaderView egoRefreshScrollViewDidEndDragging:self.listView];
}
- (void)loadMore
{
    if(!self.isRefreshing)
    {
        self.isRefreshing = YES;
        self.loadFooterView.showActivityIndicator = YES;
        NSString *cutOffTime = [[self.dateArray lastObject] objectForKey:@"orderScore"];
        long long time = [cutOffTime longLongValue];
        time = time+1;
        cutOffTime = [NSString stringWithFormat:@"%lld",time];
        [self.dateOption setObject:cutOffTime forKey:@"cutOffTime"];
        //we need to update option here
        [self startGetLatestDates];
    }
}
- (void)refresh
{
    if (!self.isRefreshing)
    {
        self.isRefreshing = YES;
        isReload = YES;
        [self.dateOption removeObjectForKey:@"cutOffTime"];
        [self startGetLatestDates];
    }
}

- (void)startGetLatestDates
{
    [curConnection cancelDownload];
    [curConnection startDownload:[NodeAsyncConnection createNodeHttpRequest:@"/user/getNearbyDates" parameters:dateOption] :self :@selector(didEndGetLatestDates:)];
}
- (void)didEndGetLatestDates:(NodeAsyncConnection *)connection
{
    if (self.isRefreshing)
    {
        self.isRefreshing = NO;
        [self.refreshHeaderView egoRefreshScrollViewDataSourceDidFinishedLoading:self.listView];
        self.loadFooterView.showActivityIndicator = NO;
    }
    if (connection == nil ||connection.result == nil) {
        return;
    }
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
    {
        NSDictionary *result = [connection.result objectForKey:@"result"];
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
        [self.dateArray addObjectsFromArray:dates];
        [self.listView reloadData];

    }

}
- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}
- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    // Return the number of sections.
    return 1;
}
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    // Return the number of rows in the section.
    int num = [self.dateArray count];
    if (hasMore)
    {
        return  num+1;
    }
    else {
        return num;
    }
}
- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{

    if (indexPath.row == [self.dateArray count])
    {
        return 44;
    }
    else
    {
        return 91;
    }
}
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    //NSLog(@"datelist %@",[tableView description]);
    AppDelegate *appDelegate = [[UIApplication sharedApplication]delegate];
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
    else
    {
        NSDictionary *dateInfo = [self.dateArray objectAtIndex:indexPath.row];
        LatestDateCell *cell = (LatestDateCell *)[tableView dequeueReusableCellWithIdentifier:@"LatestDateCell"];
        if (cell == nil)
        {
            NSArray * array =[[NSBundle mainBundle]loadNibNamed:@"LatestDateCell" owner:nil options:nil ];
            cell = (LatestDateCell *)[array objectAtIndex:0];
        }
        cell.dateIndex = indexPath;
        cell.delegate= self;
        [cell customCellWithInfo:dateInfo];
        NSDictionary *sender = [dateInfo objectForKey:@"sender"];
        NSString *photoPath = [sender objectForKey:@"primaryPhotoPath"];
        NSString *photoUrl = [PrettyUtility getPhotoUrl:photoPath :@"s"];
        cell.imgUrl = photoUrl;
        UIImage *photo = [appDelegate.imageCache objectForKey:photoUrl];
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

    }

}
- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (indexPath.row == [self.dateArray count])
    {
        return;
    }
    else
    {
        NNDateDisplayViewController *display = [[NNDateDisplayViewController alloc]initWithNibName:@"NNDateDisplayViewController" bundle:nil];
        display.currentPhotoIndex = indexPath.row;
        display.dateArray = self.dateArray;
        //NSDictionary *dateInfo = [self.dateArray objectAtIndex:indexPath.row];
        //NSString *senderId = [dateInfo objectForKey:@"senderId"];
        //NSLog(@"%@",senderId);
        [self.navigationController pushViewController:display animated:YES];
        [display release];
    }
    [tableView deselectRowAtIndexPath:indexPath animated:YES];
}
- (void)userClickedForIndex:(NSIndexPath*)userIndex
{
    NSDictionary *dateInfo = [self.dateArray objectAtIndex:userIndex.row];
    NSString *senderId = [dateInfo objectForKey:@"senderId"];
    //NSString *senderName = [[dateInfo objectForKey:@"sender"]objectForKey:@"name"];
    NNSecondProfileViewController *profile = [[NNSecondProfileViewController alloc]initWithNibName:@"NNSecondProfileViewController" bundle:nil];
    profile.profileId = senderId;
    [self.navigationController pushViewController:profile animated:YES];
    [profile release];
    //NSLog(@"%@",senderId);

}
- (void)loadImagesForOnscreenRows
{
    AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
    {
        NSArray *visiblePaths = [self.listView indexPathsForVisibleRows];
        for (NSIndexPath *indexPath in visiblePaths)
        {
            int index = indexPath.row;
            if (index>=0 && index< [self.dateArray count])
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
                    //break;
                    LatestDateCell *cell = (LatestDateCell *)[self.listView cellForRowAtIndexPath:indexPath];
                    if (cell!= nil)
                    {
                        if ([cell.imgUrl isEqualToString:photoUrl])
                        {
                            [cell.userPhotoView setImage:photo];
                        }
                    }
                }
            }

        }

    }
}
- (void) imageDidDownload:(ImageDownloader *)downloader
{
    if (downloader.downloadImage != nil)
    {
        AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
        [appDelegate.imageCache setObject:downloader.downloadImage forKey:downloader.imageUrl];
        NSIndexPath * imageIndexPath = downloader.indexPathInTableView;
        LatestDateCell* cell = (LatestDateCell*)[self.listView cellForRowAtIndexPath:imageIndexPath];
        if (cell != nil && [cell.imgUrl isEqualToString:downloader.imageUrl])
        {
            cell.userPhotoView.image = downloader.downloadImage;
        }
    }
    [imageDownloadManager removeOneDownloaderWithIndexPath:downloader.indexPathInTableView];
}
- (void)dealloc {
    if (imageDownloadManager != nil)
    {
        [imageDownloadManager cancelAllDownloadInProgress];
        imageDownloadManager.imageDownloadDelegate = nil;
    }
    [curConnection cancelDownload];
    [curConnection release];
    [refreshHeaderView release];
    [loadFooterView release];
    [dateArray release];
    [imageDownloadManager release];
    [dateOption release];
    [_listView release];
    [super dealloc];
}
- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
    [self.refreshHeaderView egoRefreshScrollViewDidScroll:scrollView];
}

- (void)scrollViewDidEndDragging:(UIScrollView *)scrollView willDecelerate:(BOOL)decelerate
{
    [self.refreshHeaderView egoRefreshScrollViewDidEndDragging:scrollView];
    if (decelerate == NO)
	{
        // scroll stopped
        [self loadImagesForOnscreenRows];
    }
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

- (void)viewDidUnload {
    if (imageDownloadManager != nil)
    {
        [imageDownloadManager cancelAllDownloadInProgress];
    }
    [self setListView:nil];
    [super viewDidUnload];
}
@end
