//
//  NNSecondProfileViewController.m
//  PrettyRich
//
//  Created by liu miao on 10/25/12.
//
//

#import "NNSecondProfileViewController.h"
#import "PrettyUtility.h"
#import "AppDelegate.h"
#import "MobClick.h"
@interface NNSecondProfileViewController ()

@end

@implementation NNSecondProfileViewController
@synthesize isFirstLoad,profileId,userInfoDict,imageDownloadManager,curConnection;
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
    userInfoDict = [[NSMutableDictionary alloc]init ];
    imageDownloadManager = [[ImagesDownloadManager alloc] init];
    imageDownloadManager.imageDownloadDelegate = self;
    self.activityIndicator.hidden = YES;
    NodeAsyncConnection * aConn = [[NodeAsyncConnection alloc] init];
	self.curConnection = aConn;
	[aConn release];
    self.navigationItem.title = @"个人资料";
    
}
- (void)viewWillAppear:(BOOL)animated
{
    [MobClick beginLogPageView:@"SecondryProfileView"];
    if (self.isFirstLoad)
    {
        self.isFirstLoad = NO;
        [self startGetUser];
    }

}
- (void)viewWillDisappear:(BOOL)animated
{
    [MobClick endLogPageView:@"SecondryProfileView"];
}
- (void)startGetUser
{
    [self.curConnection cancelDownload];
    NSString *userId = [[NSUserDefaults standardUserDefaults] objectForKey:@"PrettyUserId"];
    NSDictionary *dict = [[NSDictionary alloc]initWithObjectsAndKeys:userId,@"userId",self.profileId,@"targetUserId",nil];
    [self.activityIndicator startAnimating];
    self.activityIndicator.hidden = NO;
    [self.curConnection startDownload:[NodeAsyncConnection createNodeHttpRequest:@"/user/getUser" parameters:dict] :self :@selector(didEndGetUser:)];
    [dict release];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}
- (void)didEndGetUser:(NodeAsyncConnection *)connection
{
    self.activityIndicator.hidden = YES;
    [self.activityIndicator stopAnimating];
    if (connection == nil || connection.result == nil)
    {
        return;
    }
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
    {
        NSDictionary *result = [connection.result objectForKey:@"result"];
        [self.userInfoDict removeAllObjects];
        [self.userInfoDict addEntriesFromDictionary:result];
        [self displayUserInfo];
    }
}
-(void)displayUserInfo
{
    NSString *profilePath= [self.userInfoDict objectForKey:@"primaryPhotoPath"];
    if (![PrettyUtility isNull:profilePath])
    {
        NSString *datePhotoUrl = [PrettyUtility getPhotoUrl:profilePath :@"fw"];
        AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
        UIImage *dateImage = [appDelegate.imageCache objectForKey:datePhotoUrl];
        if (dateImage != nil)
        {
            [self.userPhotoView setImage:dateImage];
        }
        else
        {
            [self.imageDownloadManager downloadImageWithUrl:datePhotoUrl];
            [self.activityIndicator startAnimating];
            self.activityIndicator.hidden = NO;
        }
    }
    BOOL needDisplayHint = NO;
    NSDictionary *selfInfo = [[NSUserDefaults standardUserDefaults]dictionaryForKey:@"PrettyUserInfo"];
    //NSLog(@"info %@",[selfInfo description]);
    NSString *name = [self.userInfoDict objectForKey:@"name"];
    self.nameLabel.text = name;
    NSString *info1=@"";
    NSString *gender = [self.userInfoDict objectForKey:@"gender"];
    if (![PrettyUtility isNull:gender])
    {
        if ([gender isEqualToString:@"male"])
        {
            info1 = @"男性";
        }
        else
        {
            info1 = @"女性";
        }
    }
    NSString *height = [userInfoDict objectForKey:@"height"];
    if(![PrettyUtility isNull:height])
    {
        if([info1 isEqualToString:@""])
        {
            if ([PrettyUtility isNull:[selfInfo objectForKey:@"height"]])
            {
                info1 = @"身高XX";
                needDisplayHint = YES;
            }
            else
            {
                info1 = [NSString stringWithFormat:@"%@CM",height];
            }
        }
        else
        {
            if ([PrettyUtility isNull:[selfInfo objectForKey:@"height"]])
            {
                info1 = [info1 stringByAppendingString:@", 身高XX"];
                needDisplayHint = YES;
            }
            else
            {
                info1 = [info1 stringByAppendingFormat:@", %@CM",height];
            }
        }
        
        //info1 = [info1 stringByAppendingFormat:@"%@CM",height];
    }
    NSString *blood = [userInfoDict objectForKey:@"bloodGroup"];
    if(![PrettyUtility isNull:blood])
    {
        if([info1 isEqualToString:@""])
        {
            if ([PrettyUtility isNull:[selfInfo objectForKey:@"bloodGroup"]])
            {
                info1 = @"XX血型";
                needDisplayHint = YES;
            }
            else
            {
                info1 = blood;
            }
        }
        else
        {
            if ([PrettyUtility isNull:[selfInfo objectForKey:@"bloodGroup"]])
            {
                info1 = [info1 stringByAppendingString:@", XX血型"];
                needDisplayHint = YES;
            }
            else
            {
                info1 = [info1 stringByAppendingFormat:@", %@",blood];
            }
        }
    }
    NSString *star = [userInfoDict objectForKey:@"constellation"];
    if(![PrettyUtility isNull:star])
    {
        if([info1 isEqualToString:@""])
        {
            if ([PrettyUtility isNull:[selfInfo objectForKey:@"constellation"]])
            {
                info1 = @"XX星座";
                needDisplayHint = YES;
            }
            else
            {
                info1 = star;
            }
        }
        else
        {
            if ([PrettyUtility isNull:[selfInfo objectForKey:@"constellation"]])
            {
                info1 = [info1 stringByAppendingString:@", XX星座"];
                needDisplayHint = YES;
            }
            else
            {
                info1 = [info1 stringByAppendingFormat:@", %@",star];  
            }
        }
    }
    NSString *hometown = [userInfoDict objectForKey:@"hometown"];
    if(![PrettyUtility isNull:hometown])
    {
        if([info1 isEqualToString:@""])
        {
            if ([PrettyUtility isNull:[selfInfo objectForKey:@"hometown"]])
            {
                info1 = @"家乡XX";
                needDisplayHint = YES;
            }
            else
            {
               info1 = info1 = [info1 stringByAppendingFormat:@"家乡%@",hometown]; 
            }
        }
        else
        {
            if ([PrettyUtility isNull:[selfInfo objectForKey:@"hometown"]])
            {
                info1 = [info1 stringByAppendingString:@", 家乡XX"];
                needDisplayHint = YES;
            }
            else
            {
                info1 = [info1 stringByAppendingFormat:@", 家乡%@",hometown];
            }
        
        }
    }
    self.HeightABloodAStarlabel.text = info1;
    NSString *info2=@"";
    NSString *education = [userInfoDict objectForKey:@"educationalStatus"];
    if(![PrettyUtility isNull:education])
    {
        if ([PrettyUtility isNull:[selfInfo objectForKey:@"educationalStatus"]])
        {
            info2 = [info2 stringByAppendingString:@"XX学历"];
            needDisplayHint = YES;
        }
        else
        {
            info2 = [info2 stringByAppendingString:education];
        }
    }
    NSString *department = [userInfoDict objectForKey:@"department"];
    if(![PrettyUtility isNull:department])
    {
        if([info2 isEqualToString:@""])
        {
            if ([PrettyUtility isNull:[selfInfo objectForKey:@"department"]])
            {
                info2 = @"XX院系";
                needDisplayHint = YES;
            }
            else
            {
                info2 = department;
            }
        }
        else
        {
            if ([PrettyUtility isNull:[selfInfo objectForKey:@"department"]])
            {
                info2 = [info2 stringByAppendingString:@", XX院系"];
                needDisplayHint = YES;
            }
            else
            {
                info2 = [info2 stringByAppendingFormat:@", %@",department];
            }
        }
    }
    NSString *school = [userInfoDict objectForKey:@"school"];
    if(![PrettyUtility isNull:school])
    {
        if([info2 isEqualToString:@""])
        {
            info2 = school;
        }
        else
        {
        info2 = [info2 stringByAppendingFormat:@", %@",school];
        }
    }
    NSString *goodRate = [PrettyUtility readNumberString:[userInfoDict objectForKey:@"goodRateCount"]];
    if(![PrettyUtility isNull:goodRate])
    {
        NSString *userId = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserId"];
        
        if ([userId isEqualToString:profileId])
        {
            if([info2 isEqualToString:@""])
            {
                info2 = [info2 stringByAppendingFormat:@"靠谱指数%@",goodRate];
            }
            else
            {
                info2 = [info2 stringByAppendingFormat:@", 靠谱指数%@",goodRate];
            }
        }
        else
        {
            if (![goodRate isEqualToString:@"0"])
            {
                if([info2 isEqualToString:@""])
                {
                    info2 = [info2 stringByAppendingFormat:@"靠谱指数%@",goodRate];
                }
                else
                {
                    info2 = [info2 stringByAppendingFormat:@", 靠谱指数%@",goodRate];
                }

            }
           
        }
    }

    self.EduADepartASchoolLabel.text = info2;

    NSString *description = [userInfoDict objectForKey:@"description"];
    if(![PrettyUtility isNull:description])
    {
        if ([PrettyUtility isNull:[selfInfo objectForKey:@"description"]])
        {
            self.selfDescriptionlabel.text = @"我是XX";
            needDisplayHint = YES;
        }
        else
        {
            self.selfDescriptionlabel.text = description;
        }
    }
    int baseHeight = 362;
    if (needDisplayHint)
    {
        self.hintLabel.alpha = 1;
        CGSize hintSize = [self.hintLabel.text sizeWithFont:[UIFont systemFontOfSize:14]constrainedToSize:CGSizeMake(280, 9999) lineBreakMode:UILineBreakModeWordWrap];
        self.hintLabel.frame = CGRectMake(20, baseHeight-hintSize.height, 280, hintSize.height);
        baseHeight = baseHeight-hintSize.height-5;
    }
    else
    {
        self.hintLabel.alpha = 0;
        baseHeight = 362;
    }
    CGSize descriptionSize = [self.selfDescriptionlabel.text sizeWithFont:[UIFont systemFontOfSize:14]constrainedToSize:CGSizeMake(280, 9999) lineBreakMode:UILineBreakModeWordWrap];
    if (descriptionSize.height>90)
    {
        self.selfDescriptionlabel.frame = CGRectMake(20, baseHeight-90, 280, 90);
        self.selfDescriptionlabel.lineBreakMode = UILineBreakModeWordWrap | UILineBreakModeTailTruncation;
    }
    else
    {
        self.selfDescriptionlabel.frame = CGRectMake(20, baseHeight-descriptionSize.height, 280, descriptionSize.height);
        self.selfDescriptionlabel.lineBreakMode = UILineBreakModeWordWrap;
    }
    //self.selfDescriptionlabel.frame = CGRectMake(20, baseHeight-descriptionSize.height, 280, descriptionSize.height);
    
    
    CGSize eduSize = [self.EduADepartASchoolLabel.text sizeWithFont:[UIFont systemFontOfSize:14]constrainedToSize:CGSizeMake(280, 9999) lineBreakMode:UILineBreakModeWordWrap];
    float y = self.selfDescriptionlabel.frame.origin.y-5-eduSize.height;
    self.EduADepartASchoolLabel.frame = CGRectMake(20, y, eduSize.width, eduSize.height);
    
    CGSize heiSize = [self.HeightABloodAStarlabel.text sizeWithFont:[UIFont systemFontOfSize:14]constrainedToSize:CGSizeMake(280, 9999) lineBreakMode:UILineBreakModeWordWrap];
    y = y-5-heiSize.height;
    self.HeightABloodAStarlabel.frame = CGRectMake(20, y, heiSize.width, heiSize.height);
    
    y = y-5-self.nameLabel.frame.size.height;
    self.nameLabel.frame = CGRectMake(self.nameLabel.frame.origin.x,y, self.nameLabel.frame.size.width, self.nameLabel.frame.size.height);
}
- (void) imageDidDownload:(ImageDownloader *)downloader
{
    [self.activityIndicator stopAnimating];
    self.activityIndicator.hidden = YES;
    if (downloader.downloadImage != nil)
    {
        AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
        [appDelegate.imageCache setObject:downloader.downloadImage forKey:downloader.imageUrl];
        NSString *profilePath= [self.userInfoDict objectForKey:@"primaryPhotoPath"];
        NSString *datePhotoUrl = [PrettyUtility getPhotoUrl:profilePath :@"fw"];
        if ([datePhotoUrl isEqualToString:downloader.imageUrl]) 
        {
            [self.userPhotoView setImage:downloader.downloadImage];
        }
    }
    [imageDownloadManager removeOneDownloadWithUrl:downloader.imageUrl];
}

- (void)dealloc
{
    [curConnection cancelDownload];
    if (imageDownloadManager != nil)
    {
        [imageDownloadManager cancelAllDownloadInProgress];
        imageDownloadManager.imageDownloadDelegate = nil;
    }
    [curConnection release];
    [imageDownloadManager release];

    [userInfoDict release];
    [profileId release];
    [_userPhotoView release];
    [_activityIndicator release];
    [_nameLabel release];
    [_HeightABloodAStarlabel release];
    [_EduADepartASchoolLabel release];
    [_selfDescriptionlabel release];
    [_hintLabel release];
    [super dealloc];
}
- (void)viewDidUnload {
    if (imageDownloadManager != nil)
    {
        [imageDownloadManager cancelAllDownloadInProgress];
    }
    [self setUserPhotoView:nil];
    [self setActivityIndicator:nil];
    [self setNameLabel:nil];
    [self setHeightABloodAStarlabel:nil];
    [self setEduADepartASchoolLabel:nil];
    [self setSelfDescriptionlabel:nil];
    [self setHintLabel:nil];
    [super viewDidUnload];
}
@end
