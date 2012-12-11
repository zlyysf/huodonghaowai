//
//  BFLogginViewController.m
//  PrettyRich
//
//  Created by liu miao on 10/18/12.
//
//

#import "BFLogginViewController.h"
#import "NewLoginViewController.h"
#import "SignUpViewController.h"
#import "PrettyUtility.h"
#import "AppDelegate.h"
#import "MobClick.h"
//#import <CoreLocation/CoreLocation.h>
//#import <MapKit/MapKit.h>
//#import "SVGeocoder.h"
//#import "CustomAlertView.h"
@interface BFLogginViewController ()

@end
@implementation BFLogginViewController
@synthesize isFirstLoad,imageDownloadManager,curConnection,dateArray,dateOption;
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
    isFirstLoad = YES;
    dateArray = [[NSMutableArray alloc]init];
//    self.locationManager = [PrettyLocationManager sharedInstance];
    imageDownloadManager = [[ImagesDownloadManager alloc] init];
    imageDownloadManager.imageDownloadDelegate = self;
    NodeAsyncConnection * aConn = [[NodeAsyncConnection alloc] init];
	self.curConnection = aConn;
	[aConn release];
    NSMutableDictionary *option = [[NSMutableDictionary alloc]initWithObjectsAndKeys:
                                   @"1",@"count",
                                   @"0",@"start",
                                   nil];
    self.dateOption = option;
    [option release];
    self.navigationItem.title = @"活动号外";
    self.activityIndicator.hidden = YES;
}
-(void)viewWillAppear:(BOOL)animated
{
    [MobClick beginLogPageView:@"PreLoginDateView"];
    if ([self.dateArray count]==0)
    {
//        NSDictionary *region = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyRegionData"];
//        
//        if([PrettyUtility isNull:region])
//        {
//            [self.locationManager requestForCurrentLocation:self];
//        }
//        else
//        {
//            self.regionDict = [NSDictionary dictionaryWithDictionary:region];
            [self startGetBFDate];
//        }
    }
    else
    {
        [self displayDate];
    }
}
- (void)viewWillDisappear:(BOOL)animated
{
    [MobClick endLogPageView:@"PreLoginDateView"];
}
- (void)startGetBFDate
{
    [curConnection cancelDownload];
    [self.activityIndicator startAnimating];
    self.activityIndicator.hidden = NO;
//    [self.dateOption setObject:self.regionDict forKey:@"region"];
//    [self.dateOption setObject:[PrettyUtility getlatlng:self.regionDict] forKey:@"latlng"];
    //NSLog(@"%@",self.dateOption);
    [curConnection startDownload:[NodeAsyncConnection createNodeHttpRequest:@"/user/getNearbyDates" parameters:self.dateOption]:self :@selector(didEndGetBFDate:)];
}

- (void)didEndGetBFDate:(NodeAsyncConnection *)connection
{
    [self.activityIndicator stopAnimating];
    self.activityIndicator.hidden = YES;
    if (connection == nil || connection.result == nil)
    {
        return;
    }
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
    {
        NSDictionary *result = [connection.result objectForKey:@"result"];
        [self.dateArray addObjectsFromArray:[result objectForKey:@"dates"]];
        //NSLog(@"%@",self.dateArray);
        [self displayDate];
    }
}
-(void)displayDate
{
    if ([self.dateArray count]!=0)
    {
        NSDictionary *date = [self.dateArray objectAtIndex:0];
        NSString *profilePath = [date objectForKey:@"photoPath"];
        if ([PrettyUtility isNull:profilePath])
        {
            profilePath = [[date objectForKey:@"sender"] objectForKey:@"primaryPhotoPath"];
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
                [self.datePhotoView setImage:dateImage];
            }
            else
            {
                [self.imageDownloadManager downloadImageWithUrl:datePhotoUrl];
                [self.activityIndicator startAnimating];
                self.activityIndicator.hidden = NO;
            }
            
        }
        //NSString *name = [[date objectForKey:@"sender"]objectForKey:@"name"];
        NSString *title = [date objectForKey:@"title"];
        self.nameATopicLabel.text = title;//[NSString stringWithFormat:@"%@: %@",name,title];
        NSNumber *seconds = [NSNumber numberWithLongLong:[[date objectForKey:@"dateDate"]longLongValue]];
        NSString *time = [PrettyUtility dateFromInterval:seconds];
        NSString *address = [date objectForKey:@"address"];
        self.timeAndLocationLabel.text = time;//[NSString stringWithFormat:@"%@, %@",time,address];
        self.locationLabel.text = address;
        NSString *description = [date objectForKey:@"description"];
        self.dateDescripLabel.text = description;
        NSString *count = [NSString stringWithFormat:@"%@+%@",[date objectForKey:@"existPersonCount"],[date objectForKey:@"wantPersonCount"]];
        NSString *whoPay = [date objectForKey:@"whoPay"];
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
        self.countAndCostLabel.text = count;
        self.whopayLabel.text = whoPayStr;
        CGSize descriptionSize = [self.dateDescripLabel.text sizeWithFont:[UIFont systemFontOfSize:14]constrainedToSize:CGSizeMake(300, 9999) lineBreakMode:UILineBreakModeWordWrap];
        //self.dateDescripLabel.frame = CGRectMake(10, 367-descriptionSize.height, 300, descriptionSize.height);
        if (descriptionSize.height>90)
        {
            self.dateDescripLabel.frame = CGRectMake(10, 367-90, 300, 90);
            self.dateDescripLabel.lineBreakMode = UILineBreakModeWordWrap | UILineBreakModeTailTruncation;
        }
        else
        {
            self.dateDescripLabel.frame = CGRectMake(10, 367-descriptionSize.height, 300, descriptionSize.height);
            self.dateDescripLabel.lineBreakMode = UILineBreakModeWordWrap;
        }

        float y = self.dateDescripLabel.frame.origin.y-5;
        
        CGRect countFrame = self.countAndCostLabel.frame;
        countFrame.origin.y = y-countFrame.size.height;
        self.countAndCostLabel.frame = countFrame;
        
        CGRect whoPayFrame = self.whopayLabel.frame;
        whoPayFrame.origin.y = y-whoPayFrame.size.height;
        self.whopayLabel.frame = whoPayFrame;
        
        y = self.whopayLabel.frame.origin.y-5;
        CGRect timeFrame = self.timeAndLocationLabel.frame;
        timeFrame.origin.y = y-timeFrame.size.height;
        self.timeAndLocationLabel.frame = timeFrame;
        
        CGRect locationFrame = self.locationLabel.frame;
        locationFrame.origin.y = y-locationFrame.size.height;
        self.locationLabel.frame = locationFrame;
        
        y = self.locationLabel.frame.origin.y-5;
        CGRect titleFrame = self.nameATopicLabel.frame;
        titleFrame.origin.y = y-titleFrame.size.height;
        self.nameATopicLabel.frame = titleFrame;
        
    }

}
-(IBAction)signupClicked
{
    SignUpViewController *signUpViewController = [[SignUpViewController alloc]initWithNibName:@"SignUpViewController" bundle:nil];
    [self.navigationController pushViewController:signUpViewController animated:YES];
    [signUpViewController release];
}
-(IBAction)logginClicked
{
    NewLoginViewController *newLoginViewController = [[NewLoginViewController alloc]initWithNibName:@"NewLoginViewController" bundle:nil];
    [self.navigationController pushViewController:newLoginViewController animated:YES];
    [newLoginViewController release];
}
- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (void)dealloc
{
    if (imageDownloadManager != nil)
    {
        [imageDownloadManager cancelAllDownloadInProgress];
        imageDownloadManager.imageDownloadDelegate = nil;
    }
    [imageDownloadManager release];
    [curConnection cancelDownload];
    [curConnection release];
    [dateOption release];
//    [regionDict release];
    [dateArray release];
    [_datePhotoView release];
    [_nameATopicLabel release];
    [_timeAndLocationLabel release];
    [_countAndCostLabel release];
    [_dateDescripLabel release];
    [_activityIndicator release];
    [_locationLabel release];
    [_whopayLabel release];
    [super dealloc];
}
- (void)viewDidUnload {
    if (imageDownloadManager != nil)
    {
        [imageDownloadManager cancelAllDownloadInProgress];
    }
    [self setDatePhotoView:nil];
    [self setNameATopicLabel:nil];
    [self setTimeAndLocationLabel:nil];
    [self setCountAndCostLabel:nil];
    [self setDateDescripLabel:nil];
    [self setActivityIndicator:nil];
    [self setLocationLabel:nil];
    [self setWhopayLabel:nil];
    [super viewDidUnload];
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
        NSString *photoPath =[[self.dateArray objectAtIndex:0] objectForKey:@"photoPath"];
        if ([PrettyUtility isNull:photoPath])
        {
            photoPath = [[[self.dateArray objectAtIndex:0] objectForKey:@"sender"] objectForKey:@"primaryPhotoPath"];
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
                [self.datePhotoView setImage:downloader.downloadImage];
            }
        }
    }
    [imageDownloadManager removeOneDownloadWithUrl:downloader.imageUrl];
}

//#pragma mark- PrettyLocationManagerDelegate
//- (void)didFailUpdatingLocation:(NSError *)error
//{
//
//}
//- (void)didQueryNewLocation:(CLLocation *) newLocation
//{
//    [SVGeocoder reverseGeocode:newLocation.coordinate
//                    completion:^(NSArray *placemarks, NSError *error) {
//                        
//                        if(!error && placemarks) {
//                            //SVPlacemark *placemark = [placemarks objectAtIndex:0];
//                            NSDictionary *region = [[NSDictionary alloc]initWithDictionary:[placemarks objectAtIndex:0]];
//                            [[NSUserDefaults standardUserDefaults]setObject:region forKey:@"PrettyRegionData"];
//                            NSDate *date = [NSDate date];
//                            [[NSUserDefaults standardUserDefaults]setObject:date forKey:@"PrettyRegionLastUpdate"];
//                            [[NSUserDefaults standardUserDefaults]synchronize];
//                            self.regionDict = [NSDictionary dictionaryWithDictionary:region];
//                            [region release];
//                            [self startGetBFDate];
//                            
//                        } else
//                        {
//                            CustomAlertView *errorAlert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:@"Your current location cannot be determined. Please go to an area with stronger signal and try again." otherButton:nil cancelButton:nil delegate:nil duration:2.0];
//                            [errorAlert show];
//                            [errorAlert release];
//                        }
//                    }];
//    
//}

@end
