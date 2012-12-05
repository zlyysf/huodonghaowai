//
//  NNDatePreViewViewController.m
//  PrettyRich
//
//  Created by liu miao on 10/19/12.
//
//

#import "NNDatePreViewViewController.h"
#import "PrettyUtility.h"
#import "AppDelegate.h"
#import "MobClick.h"
@interface NNDatePreViewViewController ()

@end

@implementation NNDatePreViewViewController
@synthesize imageDownloadManager;
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
    // Do any additional setup after loading the view from its nib.
}
- (void)viewWillAppear:(BOOL)animated
{
    [MobClick beginLogPageView:@"DatePreviewView"];
}
- (void)viewWillDisappear:(BOOL)animated
{
    [MobClick endLogPageView:@"DatePreviewView"];
}

- (void)displayDate:(NSDictionary *)dateInfo withSelectedPhoto:(UIImage *)dateImage
{
    if (dateImage != nil)
    {
        [self.datePicView setImage:dateImage];
    }
    else
    {
        AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
        NSString *profilePath = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserPhoto"];
        if (![PrettyUtility isNull:profilePath])
        {
            NSString *datePhotoUrl = [PrettyUtility getPhotoUrl:profilePath :@"fw"];
            UIImage *dateImage = [appDelegate.imageCache objectForKey:datePhotoUrl];
            if (dateImage != nil)
            {
                [self.datePicView setImage:dateImage];
            }
            else
            {
                [self.imageDownloadManager downloadImageWithUrl:datePhotoUrl];
            }

        }        
    }
    //NSString *name = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserName"];
    NSString *title = [dateInfo objectForKey:@"title"];
    self.nameAndTitleLabel.text = title;//[NSString stringWithFormat:@"%@: %@",name,title];
    //NSNumber *seconds = [NSNumber numberWithLongLong:[[dateInfo objectForKey:@"dateDate"]longLongValue]];
    NSString *timeValue = [dateInfo objectForKey:@"dateDate"];
    NSNumber *seconds = [NSNumber numberWithLongLong:[timeValue longLongValue]];
    NSString *time = [PrettyUtility dateFromInterval:seconds];

    //NSString *time = [dateInfo objectForKey:@"dateDate"];
    NSString *address = [dateInfo objectForKey:@"address"];
    self.timeAndLocationLabel.text = time;
    self.addressLabel.text = address;//[NSString stringWithFormat:@"%@, %@",time,address];
    NSString *description = [dateInfo objectForKey:@"description"];
    self.dateDescriptionLabel.text = description;
    NSString *count = [NSString stringWithFormat:@"%@+%@",[dateInfo objectForKey:@"existPersonCount"],[dateInfo objectForKey:@"wantPersonCount"]];
    if (![PrettyUtility isNull:[dateInfo objectForKey:@"existPersonCount"]]&&![PrettyUtility isNull:[dateInfo objectForKey:@"wantPersonCount"]])
    {
        self.countAndWhoPayLabel.text = count;
    }
    else
    {
        self.countAndWhoPayLabel.text = @"";
    }
    
    NSString *whoPay = [dateInfo objectForKey:@"whoPay"];
    NSString *whoPayStr;
    if ([whoPay isEqualToString:@"0"])
    {
        whoPayStr = @"我请了";
    }
    else if([whoPay isEqualToString:@"2"])
    {
        whoPayStr = @"AA吧";
    }
    else
    {
        whoPayStr = @"不花钱";
    }
    self.whoPayLabel.text = whoPayStr;
    CGSize descriptionSize = [self.dateDescriptionLabel.text sizeWithFont:[UIFont systemFontOfSize:14]constrainedToSize:CGSizeMake(300, 9999) lineBreakMode:UILineBreakModeWordWrap];
    if (descriptionSize.height>90)
    {
        self.dateDescriptionLabel.frame = CGRectMake(10, 362-90, 300, 90);
        self.dateDescriptionLabel.lineBreakMode = UILineBreakModeWordWrap | UILineBreakModeTailTruncation;
    }
    else
    {
        self.dateDescriptionLabel.frame = CGRectMake(10, 362-descriptionSize.height, 300, descriptionSize.height);
        self.dateDescriptionLabel.lineBreakMode = UILineBreakModeWordWrap;
    }
    float y = self.dateDescriptionLabel.frame.origin.y-5;
    
    CGRect countFrame = self.countAndWhoPayLabel.frame;
    countFrame.origin.y = y-countFrame.size.height;
    self.countAndWhoPayLabel.frame = countFrame;
    
    CGRect whoPayFrame = self.whoPayLabel.frame;
    whoPayFrame.origin.y = y-whoPayFrame.size.height;
    self.whoPayLabel.frame = whoPayFrame;
    
    y = self.whoPayLabel.frame.origin.y-5;
    CGRect timeFrame = self.timeAndLocationLabel.frame;
    timeFrame.origin.y = y-timeFrame.size.height;
    self.timeAndLocationLabel.frame = timeFrame;
    
    CGRect locationFrame = self.addressLabel.frame;
    locationFrame.origin.y = y-locationFrame.size.height;
    self.addressLabel.frame = locationFrame;
    
    y = self.addressLabel.frame.origin.y-5;
    CGRect titleFrame = self.nameAndTitleLabel.frame;
    titleFrame.origin.y = y-titleFrame.size.height;
    self.nameAndTitleLabel.frame = titleFrame;
}
- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}
#pragma mark- ImageDownloaderDelegate
- (void) imageDidDownload:(ImageDownloader *)downloader
{
    if (downloader.downloadImage != nil)
    {
        AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
        [appDelegate.imageCache setObject:downloader.downloadImage forKey:downloader.imageUrl];
        NSString *profilePath = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserPhoto"];
        NSString *datePhotoUrl = [PrettyUtility getPhotoUrl:profilePath :@"fw"];

        if ([datePhotoUrl isEqualToString:downloader.imageUrl])
        {
            [self.datePicView setImage:downloader.downloadImage];
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
    [imageDownloadManager release];
    [_datePicView release];
    [_nameAndTitleLabel release];
    [_timeAndLocationLabel release];
    [_countAndWhoPayLabel release];
    [_dateDescriptionLabel release];
    [_addressLabel release];
    [_whoPayLabel release];
    [super dealloc];
}
- (void)viewDidUnload {
    if (imageDownloadManager != nil)
    {
        [imageDownloadManager cancelAllDownloadInProgress];
    }
    [self setDatePicView:nil];
    [self setNameAndTitleLabel:nil];
    [self setTimeAndLocationLabel:nil];
    [self setCountAndWhoPayLabel:nil];
    [self setDateDescriptionLabel:nil];
    [self setAddressLabel:nil];
    [self setWhoPayLabel:nil];
    [super viewDidUnload];
}
@end
