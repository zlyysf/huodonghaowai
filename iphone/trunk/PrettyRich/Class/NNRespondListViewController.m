//
//  NNRespondListViewController.m
//  PrettyRich
//
//  Created by liu miao on 10/26/12.
//
//

#import "NNRespondListViewController.h"
#import "AppDelegate.h"
#import "NNSecondProfileViewController.h"
#import "PrettyUtility.h"
#import "MessageViewController.h"
#import "MobClick.h"
@interface NNRespondListViewController ()

@end

@implementation NNRespondListViewController
@synthesize dateDict,imageDownloadManager,confirmArray,respondArray;
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
    imageDownloadManager = [[ImagesDownloadManager alloc] init];
    imageDownloadManager.imageDownloadDelegate = self;
    confirmArray = [[NSMutableArray alloc]init];
    respondArray = [[NSMutableArray alloc]init];
    self.navigationItem.title = @"响应人";
    //UIBarButtonItem *backButton = [[UIBarButtonItem alloc]initWithTitle:@"返回" style:UIBarButtonItemStylePlain target:self action:@selector(backButtonClicked)];
    //self.navigationItem.leftBarButtonItem = backButton;
    //[backButton release];
    
    // Do any additional setup after loading the view from its nib.
}
- (void)backButtonClicked
{
    [self.navigationController popViewControllerAnimated:YES];
}
- (void)viewWillAppear:(BOOL)animated
{
    [MobClick beginLogPageView:@"DateResponderListView"];
    [self sortRespond];
    [self.listView reloadData];
}
- (void)viewWillDisappear:(BOOL)animated
{
    [MobClick endLogPageView:@"DateResponderListView"];
    [[NSNotificationCenter defaultCenter] postNotificationName:@"UpdateDateListNotification" object:nil];
}
- (void)sortRespond
{
    [confirmArray removeAllObjects];
    [respondArray removeAllObjects];
    NSArray *responder = [self.dateDict objectForKey:@"responders"];
    for (NSDictionary *respond in responder)
    {
        if ([[respond objectForKey:@"senderConfirmed"]boolValue])
        {
            [confirmArray addObject:respond];
        }
        else
        {
            [respondArray addObject:respond];
        }
    }
    [self.dateDict setObject:[NSString stringWithFormat:@"%d",[confirmArray count]] forKey:@"confirmedPersonCount"];
    [self.dateDict setObject:[NSString stringWithFormat:@"%d",[respondArray count]+[confirmArray count]] forKey:@"dateResponderCount"];
    
}
- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}
- (NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section
{
    if (section == 0)
    {
        //NSString *confirmed = [self.dateDict objectForKey:@"confirmedPersonCount"];
        return [NSString stringWithFormat:@"已批准加入的(%d)",[self.confirmArray count]];
    }
    else
    {
        //NSString *confirmed = [self.dateDict objectForKey:@"dateResponderCount"];
        return [NSString stringWithFormat:@"申请中的(%d)",[self.respondArray count]];
    }
    
}
- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    return 2;
}
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    if(section == 0)
    {
        return [self.confirmArray count];
    }
    else
    {
        return [self.respondArray count];
    }
    
}
- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
    return 70;
}
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    AppDelegate *appDelegate = [[UIApplication sharedApplication]delegate];
    NSDictionary *dateInfo;
    if (indexPath.section == 0)
    {
        dateInfo = [self.confirmArray objectAtIndex:indexPath.row];
    }
    else
    {
        dateInfo = [self.respondArray objectAtIndex:indexPath.row];
    }
    NNRespondListCell *cell = (NNRespondListCell *)[tableView dequeueReusableCellWithIdentifier:@"NNRespondListCell"];
    if (cell == nil)
    {
        NSArray * array =[[NSBundle mainBundle]loadNibNamed:@"NNRespondListCell" owner:nil options:nil ];
        cell = (NNRespondListCell *)[array objectAtIndex:0];
    }
    cell.cellIndex = indexPath;
    cell.delegate= self;
    [cell customCellWithInfo:dateInfo];
    //NSDictionary *sender = [dateInfo objectForKey:@"sender"];
    NSString *photoPath = [dateInfo objectForKey:@"primaryPhotoPath"];
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
-(void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
    
    
    NSString *targetUrl;
    NSString *targetId;
    if (indexPath.section == 0)
    {
        targetId = [[self.confirmArray objectAtIndex:indexPath.row] objectForKey:@"responderId"];
    }
    else
    {
        targetId = [[self.respondArray objectAtIndex:indexPath.row]objectForKey:@"responderId"];
    }
    NSArray *responder = [self.dateDict objectForKey:@"responders"];
    int index;
    BOOL hasFound = NO;
    for (NSDictionary *respond in responder)
    {
        if ([[respond objectForKey:@"responderId"] isEqualToString:targetId])
        {
            hasFound = YES;
            index = [responder indexOfObject:respond];
            break;
        }
    }
    
    if (hasFound)
    {
        MessageViewController *messageViewController = [[MessageViewController alloc]initWithNibName:@"MessageViewController" bundle:nil];
        NSMutableDictionary *responderDict = [[self.dateDict objectForKey:@"responders"] objectAtIndex:index];
        
        NSString *dateId = [self.dateDict objectForKey:@"dateId"];
        NSString *targetName = [responderDict objectForKey:@"name"];
        NSString *profileUrl = [responderDict objectForKey:@"primaryPhotoPath"];
        
        if (![PrettyUtility isNull:profileUrl])
        {
            targetUrl = [PrettyUtility getPhotoUrl:profileUrl :@"fw"];
            messageViewController.targetUrl = targetUrl;
        }
        else
        {
            NSString *datePhoto = [self.dateDict objectForKey:@"photoPath"];
            if (![PrettyUtility isNull:datePhoto])
            {
                targetUrl = [PrettyUtility getPhotoUrl:datePhoto :@"fw"];
                messageViewController.targetUrl = targetUrl;
            }
        }
        
        messageViewController.dateDict = self.dateDict;
        messageViewController.dateId = dateId;
        messageViewController.targetId = targetId;
        messageViewController.targetName = targetName;
        messageViewController.messageViewType = MessageViewTypeSender;
        messageViewController.latestMessageDict = responderDict;
        messageViewController.isSenderConfirmed = [[responderDict objectForKey:@"senderConfirmed"] boolValue];
        NSNumber *seconds = [NSNumber numberWithLongLong:[[self.dateDict objectForKey:@"dateDate"]longLongValue]];
        if([PrettyUtility isPastTime:seconds])
        {
            [self.dateDict setObject:[NSNumber numberWithBool:YES] forKey:@"alreadyPast"];
        }
        else
        {
            [self.dateDict setObject:[NSNumber numberWithBool:NO] forKey:@"alreadyPast"];
        }
        
        if ([[self.dateDict objectForKey:@"alreadyPast"]boolValue])
        {
            if([[responderDict objectForKey:@"haveBeenRated"] boolValue])
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
- (void)userInCellClick:(NSIndexPath*)cellIndex
{
    NSDictionary *dateInfo;
    if (cellIndex.section == 0)
    {
        dateInfo = [self.confirmArray objectAtIndex:cellIndex.row];
    }
    else
    {
        dateInfo = [self.respondArray objectAtIndex:cellIndex.row];
    }
    NSString *target = [dateInfo objectForKey:@"responderId"];
    //NSString *name = [dateInfo objectForKey:@"name"];
    NNSecondProfileViewController *profileViewController = [[NNSecondProfileViewController alloc]initWithNibName:@"NNSecondProfileViewController" bundle:nil];
    profileViewController.profileId = target;
    [self.navigationController pushViewController:profileViewController animated:YES];
    [profileViewController release];
}
- (void)loadImagesForOnscreenRows
{
    NSArray *visiblePaths = [self.listView indexPathsForVisibleRows];
    for (NSIndexPath *indexPath in visiblePaths)
    {
        int index = indexPath.row;
        if (indexPath.section == 0)
        {
            if (index>=0 && index< [confirmArray count])
            {
                NSDictionary *followDict = [self.confirmArray objectAtIndex:index];
                NSString *primaryPhotoPath = [followDict objectForKey:@"primaryPhotoPath"];
                if ([PrettyUtility isNull:primaryPhotoPath]) {
                    break;
                }
                NSString *photoUrl =[PrettyUtility getPhotoUrl:primaryPhotoPath :@"s"];
                AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
                UIImage *photo = [appDelegate.imageCache objectForKey:photoUrl];
                if (photo == nil)
                {
                    [imageDownloadManager downloadImageWithUrl:photoUrl forIndexPath:indexPath];
                }
                else
                {
                    NNRespondListCell *cell = (NNRespondListCell *)[self.listView cellForRowAtIndexPath:indexPath];
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
        else
        {
            if (index>=0 && index< [respondArray count])
            {
                NSDictionary *followDict = [self.respondArray objectAtIndex:index];
                NSString *primaryPhotoPath = [followDict objectForKey:@"primaryPhotoPath"];
                if ([PrettyUtility isNull:primaryPhotoPath]) {
                    break;
                }
                NSString *photoUrl =[PrettyUtility getPhotoUrl:primaryPhotoPath :@"s"];
                AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
                UIImage *photo = [appDelegate.imageCache objectForKey:photoUrl];
                if (photo == nil)
                {
                    [imageDownloadManager downloadImageWithUrl:photoUrl forIndexPath:indexPath];
                }
                else
                {
                    NNRespondListCell *cell = (NNRespondListCell *)[self.listView cellForRowAtIndexPath:indexPath];
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
        NNRespondListCell *cell = (NNRespondListCell *)[self.listView cellForRowAtIndexPath:imageIndexPath];
        if ([cell.imgUrl isEqualToString:downloader.imageUrl])
        {
            cell.userPhotoView.image = downloader.downloadImage;
        }
    }
    [imageDownloadManager removeOneDownloaderWithIndexPath:downloader.indexPathInTableView];
}
- (void)scrollViewDidEndDragging:(UIScrollView *)scrollView willDecelerate:(BOOL)decelerate
{
    if (decelerate == NO)
	{
        // scroll stopped
        [self loadImagesForOnscreenRows];
    }
}
- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView
{
    [self loadImagesForOnscreenRows];
}

- (void)dealloc {
    if (imageDownloadManager != nil)
    {
        [imageDownloadManager cancelAllDownloadInProgress];
        imageDownloadManager.imageDownloadDelegate = nil;
    }
    [confirmArray release];
    [respondArray release];
    [dateDict release];
    [_listView release];
    [super dealloc];
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
