//
//  NNDateDetailViewController.m
//  PrettyRich
//
//  Created by liu miao on 10/27/12.
//
//

#import "NNDateDetailViewController.h"
#import "PrettyUtility.h"
#import "AppDelegate.h"
#import "MobClick.h"
@interface NNDateDetailViewController ()

@end

@implementation NNDateDetailViewController
@synthesize imageDownloadManager,dateDict;
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
    self.activityIndicator.hidden = YES;
    imageDownloadManager = [[ImagesDownloadManager alloc] init];
    imageDownloadManager.imageDownloadDelegate = self;
    
}

- (void)viewWillAppear:(BOOL)animated
{
    [MobClick beginLogPageView:@"DateDetailView"];
    self.navigationItem.title = @"活动详情";
    [self displayDateDetail];
}
- (void)viewWillDisappear:(BOOL)animated
{
    [MobClick endLogPageView:@"DateDetailView"];
}
-(void)displayDateDetail
{
    
    NSString *profilePath = [self.dateDict objectForKey:@"photoPath"];
    if ([PrettyUtility isNull:profilePath])
    {
        profilePath = [[self.dateDict objectForKey:@"sender"] objectForKey:@"primaryPhotoPath"];
    }
    if ([PrettyUtility isNull:profilePath])
    {
        profilePath = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserPhoto"];
    }
    if (![PrettyUtility isNull:profilePath])
    {
        NSString *datePhotoUrl = [PrettyUtility getPhotoUrl:profilePath :@"fw"];
        AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
        UIImage *dateImage = [appDelegate.imageCache objectForKey:datePhotoUrl];
        if (dateImage != nil)
        {
            [self.datePicView setImage:dateImage];
        }
        else
        {
            [self.imageDownloadManager downloadImageWithUrl:datePhotoUrl];
            [self.activityIndicator startAnimating];
            self.activityIndicator.hidden = NO;
        }
        
    }
    //NSString *name = [[self.dateDict objectForKey:@"sender"]objectForKey:@"name"];
    NSString *title = [self.dateDict objectForKey:@"title"];
    self.titleLabel.text = title;//[NSString stringWithFormat:@"%@: %@",name,title];
    NSNumber *seconds = [NSNumber numberWithLongLong:[[self.dateDict objectForKey:@"dateDate"]longLongValue]];
    NSString *time = [PrettyUtility dateFromInterval:seconds];
    NSString *address = [self.dateDict objectForKey:@"address"];
    self.timeLabel.text =time;// [NSString stringWithFormat:@"%@, %@",time,address];
    self.addressLabel.text = address;
    NSString *description = [self.dateDict objectForKey:@"description"];
    self.descriptionlabel.text = description;
    NSString *count = [NSString stringWithFormat:@"%@+%@",[self.dateDict objectForKey:@"existPersonCount"],[self.dateDict objectForKey:@"wantPersonCount"]];
    self.personLabel.text = count;
    NSString *whoPay = [self.dateDict objectForKey:@"whoPay"];
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
    
    CGSize descriptionSize = [self.descriptionlabel.text sizeWithFont:[UIFont systemFontOfSize:14]constrainedToSize:CGSizeMake(300, 9999) lineBreakMode:UILineBreakModeWordWrap];
    if (descriptionSize.height>90)
    {
        self.descriptionlabel.frame = CGRectMake(10, 362-90, 300, 90);
        self.descriptionlabel.lineBreakMode = UILineBreakModeWordWrap | UILineBreakModeTailTruncation;
    }
    else
    {
        self.descriptionlabel.frame = CGRectMake(10, 362-descriptionSize.height, 300, descriptionSize.height);
        self.descriptionlabel.lineBreakMode = UILineBreakModeWordWrap;
    }

    //self.descriptionlabel.frame = CGRectMake(10, 362-descriptionSize.height, 300, descriptionSize.height);
    float y = self.descriptionlabel.frame.origin.y-5;
    
    CGRect countFrame = self.personLabel.frame;
    countFrame.origin.y = y-countFrame.size.height;
    self.personLabel.frame = countFrame;
    
    CGRect whoPayFrame = self.whoPayLabel.frame;
    whoPayFrame.origin.y = y-whoPayFrame.size.height;
    self.whoPayLabel.frame = whoPayFrame;
    
    y = self.whoPayLabel.frame.origin.y-5;
    CGRect timeFrame = self.timeLabel.frame;
    timeFrame.origin.y = y-timeFrame.size.height;
    self.timeLabel.frame = timeFrame;
    
    CGRect locationFrame = self.addressLabel.frame;
    locationFrame.origin.y = y-locationFrame.size.height;
    self.addressLabel.frame = locationFrame;
    
    y = self.addressLabel.frame.origin.y-5;
    CGRect titleFrame = self.titleLabel.frame;
    titleFrame.origin.y = y-titleFrame.size.height;
    self.titleLabel.frame = titleFrame;


}
#pragma mark- ImageDownloaderDelegate
- (void) imageDidDownload:(ImageDownloader *)downloader
{
    [self.activityIndicator stopAnimating];
    self.activityIndicator.hidden = YES;
    if (downloader.downloadImage != nil)
    {
        AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
        [appDelegate.imageCache setObject:downloader.downloadImage forKey:downloader.imageUrl];
        NSString *photoPath =[self.dateDict objectForKey:@"photoPath"];
        if ([PrettyUtility isNull:photoPath])
        {
            photoPath = [[self.dateDict objectForKey:@"sender"] objectForKey:@"primaryPhotoPath"];
        }
        if ([PrettyUtility isNull:photoPath])
        {
            photoPath = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserPhoto"];
        }
        if (![PrettyUtility isNull:photoPath])
        {
            NSString *datePhotoUrl = [PrettyUtility getPhotoUrl:photoPath :@"fw"];
            if ([datePhotoUrl isEqualToString:downloader.imageUrl])
            {
                [self.datePicView setImage:downloader.downloadImage];
            }
        }
    }
    [imageDownloadManager removeOneDownloadWithUrl:downloader.imageUrl];
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
    [dateDict release];
    [_datePicView release];
    [_activityIndicator release];
    [_titleLabel release];
    [_timeLabel release];
    [_addressLabel release];
    [_personLabel release];
    [_whoPayLabel release];
    [_descriptionlabel release];
    [super dealloc];
}
- (void)viewDidUnload {
    if (imageDownloadManager != nil)
    {
        [imageDownloadManager cancelAllDownloadInProgress];
    }
    [self setDatePicView:nil];
    [self setActivityIndicator:nil];
    [self setTitleLabel:nil];
    [self setTimeLabel:nil];
    [self setAddressLabel:nil];
    [self setPersonLabel:nil];
    [self setWhoPayLabel:nil];
    [self setDescriptionlabel:nil];
    [super viewDidUnload];
}
@end
