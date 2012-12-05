//
//  NNDateDisplayViewController.m
//  PrettyRich
//
//  Created by liu miao on 10/23/12.
//
//

#import "NNDateDisplayViewController.h"
#import "AppDelegate.h"
#import "PrettyUtility.h"
#import "NNWantJoinViewController.h"
#import "DateDetailView.h"
#import "MobClick.h"
@interface NNDateDisplayViewController ()

@end

@implementation NNDateDisplayViewController
@synthesize dateArray,imageViewArray,currentPhotoIndex,imageDownloadManager,isFirstLoad;
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
    imageViewArray = [[NSMutableArray alloc]init];
    for(int i = 0; i < 10; i++)
    {
        CGRect viewFrame = self.view.bounds;
        
        DateDetailView *aPhotoImageView = [[DateDetailView alloc] initWithFrame:viewFrame];
        [imageViewArray addObject:aPhotoImageView];
        [aPhotoImageView release];
    }
    UIBarButtonItem *join = [[UIBarButtonItem alloc]initWithTitle:@"我要加入" style:UIBarButtonItemStyleBordered target:self action:@selector(joinButtonClicked)];
    self.navigationItem.rightBarButtonItem = join;
    [join release];
    imageDownloadManager = [[ImagesDownloadManager alloc] init];
    imageDownloadManager.imageDownloadDelegate = self;
    self.navigationItem.title = @"活动详情";
    self.activityIndicator.hidden = YES;
    self.isFirstLoad = YES;
    [self.navigationItem.rightBarButtonItem setEnabled:YES];

}
-(void)joinButtonClicked
{
    if (currentPhotoIndex < 0 || currentPhotoIndex >= [self.dateArray count]) return;
    NSDictionary *aDate = [dateArray objectAtIndex:currentPhotoIndex];
    NSString *dateId = [aDate objectForKey:@"dateId"];
    NSString *targetUserId = [aDate objectForKey:@"senderId"];
    NNWantJoinViewController *joinController = [[NNWantJoinViewController alloc]initWithNibName:@"NNWantJoinViewController" bundle:nil];
    joinController.dateId = dateId;
    joinController.targetUserId = targetUserId;
    UINavigationController *nav = [[UINavigationController alloc]initWithRootViewController:joinController];
    [joinController release];
    [self presentModalViewController:nav animated:YES];
    [nav release];

}
-(void)viewWillAppear:(BOOL)animated
{
    [MobClick beginLogPageView:@"LatestDateScrollView"];
    if (isFirstLoad)
    {
        for (DateDetailView *aPhotoImageView in self.imageViewArray)
        {
            if (aPhotoImageView.superview)
            {
                [aPhotoImageView removeFromSuperview];
            }
            
        }
    }
    
}
- (void)viewWillDisappear:(BOOL)animated
{
    [MobClick endLogPageView:@"LatestDateScrollView"];
}
- (void) viewDidAppear:(BOOL)animated
{
    if (isFirstLoad)
    {
        isFirstLoad = NO;
        CGRect viewFrame = self.view.bounds;
        self.photoScrollView.frame = viewFrame;
        self.photoScrollView.contentSize = CGSizeMake(viewFrame.size.width * [self.dateArray count], viewFrame.size.height);
        
        [self displayPhoto:currentPhotoIndex];
        
        // scroll to target photo
        CGRect scrollFrame = self.view.bounds;
        self.photoScrollView.contentOffset = CGPointMake(currentPhotoIndex * scrollFrame.size.width, 0);
    }
    
    
}
- (void) displayPhoto :(int)photoIndex
{
    if (photoIndex < 0 || photoIndex >= [self.dateArray count]) return;
    NSDictionary *aDate = [dateArray objectAtIndex:photoIndex];
    NSString *senderId = [aDate objectForKey:@"senderId"];
    NSString *selfId = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserId"];
    if ([senderId isEqualToString:selfId])
    {
        [self.navigationItem.rightBarButtonItem setEnabled:NO];
    }
    else
    {
        [self.navigationItem.rightBarButtonItem setEnabled:YES];
    }
    AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
    NSString *datePhotoPath = [aDate objectForKey:@"photoPath"];
    DateDetailView *aPhotoImageView = [self.imageViewArray objectAtIndex:photoIndex % 10];
    if (aPhotoImageView.superview == nil)
    {
        aPhotoImageView.datePicView.image = nil;
        [self.photoScrollView addSubview:aPhotoImageView];
    }
    CGRect scrollFrame = self.view.bounds;
    scrollFrame.origin.x = scrollFrame.size.width * photoIndex;
    aPhotoImageView.frame = scrollFrame;
    aPhotoImageView.datePicView.image = nil;

    if ([PrettyUtility isNull:datePhotoPath])
    {
        datePhotoPath = [[aDate objectForKey:@"sender"] objectForKey:@"primaryPhotoPath"];
    }
    if ([PrettyUtility isNull:datePhotoPath])
    {
        datePhotoPath = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserPhoto"];
    }
    if (![PrettyUtility isNull:datePhotoPath])
    {
        NSString *datePhotoUrl = [PrettyUtility getPhotoUrl:datePhotoPath :@"fw"];
        UIImage *originalImage = [appDelegate.imageCache objectForKey:datePhotoUrl];
        if (originalImage != nil)
        {
            if (aPhotoImageView.datePicView.image != originalImage)
            {
                
                aPhotoImageView.datePicView.image  = [PrettyUtility cropImage:originalImage forWitdh:self.view.bounds.size.width andHeight:self.view.bounds.size.height];
                self.activityIndicator.hidden = YES;
                [self.activityIndicator stopAnimating];
            }
        }
        
        else
        {
            if(self.photoScrollView.dragging == NO && self.photoScrollView.decelerating == NO)
            {
                [imageDownloadManager downloadImageWithUrl:datePhotoUrl forIndexPath:[NSIndexPath indexPathWithIndex:photoIndex]];
                self.activityIndicator.hidden = NO;
                [self.activityIndicator startAnimating];
            }
        }

    }
    else
    {
        aPhotoImageView.datePicView.image = nil;
    }
    [aPhotoImageView resizeSubviewForDateInfo:aDate];
    

}
- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView
{
    CGSize pageSize = scrollView.frame.size;
    currentPhotoIndex = floor(scrollView.contentOffset.x / pageSize.width);
    if (currentPhotoIndex < 0 || currentPhotoIndex >= [self.dateArray count])
    {
        return;
    }
    [self displayPhoto:currentPhotoIndex];
    [self.photoScrollView setContentOffset:CGPointMake(self.view.bounds.size.width  * currentPhotoIndex, 0)];
}
- (void) imageDidDownload:(ImageDownloader *)downloader
{
    if (downloader.downloadImage != nil)
    {
        AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
        [appDelegate.imageCache setObject:downloader.downloadImage forKey:downloader.imageUrl];
        
        NSIndexPath * imageIndexPath = downloader.indexPathInTableView;
        int downloadedPhotoIndex = [imageIndexPath indexAtPosition:0];
        
        if (currentPhotoIndex == downloadedPhotoIndex)
        {
            [self displayPhoto:currentPhotoIndex];
        }
    }
    
    [imageDownloadManager removeOneDownloaderWithIndexPath:downloader.indexPathInTableView];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (void)dealloc {
    if (imageDownloadManager != nil)
    {
        [imageDownloadManager cancelAllDownloadInProgress];
        imageDownloadManager.imageDownloadDelegate = nil;
    }
    [imageDownloadManager release];
    [_activityIndicator release];
    [_photoScrollView release];
    [dateArray release];
    [imageViewArray release];
    [super dealloc];
}
- (void)viewDidUnload {
    if (imageDownloadManager != nil)
    {
        [imageDownloadManager cancelAllDownloadInProgress];
    }
    [self setPhotoScrollView:nil];
    [self setActivityIndicator:nil];
    [super viewDidUnload];
}
@end
