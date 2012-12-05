//
//  NNProfileViewController.m
//  PrettyRich
//
//  Created by liu miao on 10/18/12.
//
//

#import "NNProfileViewController.h"
#import "PrettyGlobalService.h"
#import "PrettyUtility.h"
#import "AppDelegate.h"
#define kNumbers     @"0123456789"
#import "CustomAlertView.h"
#import "MobClick.h"
@interface NNProfileViewController ()

@end

@implementation NNProfileViewController
@synthesize curConnection,imageDownloadManager,userInfoDict,isFirstLoad,editVisible,tempDict,photoSelected,uploadPhoto,responderField,photoConnection;
@synthesize bloodArray,schoolArray,starArray,backViewSizeAdjusted,needUpdatePhoto;
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
    UIBarButtonItem *logout = [[UIBarButtonItem alloc]initWithTitle:@"退出" style:UIBarButtonItemStyleBordered target:self action:@selector(logoutClicked)];
    self.navigationItem.leftBarButtonItem = logout;
    [logout release];
    UIBarButtonItem *edit = [[UIBarButtonItem alloc]initWithTitle:@"编辑" style:UIBarButtonItemStyleBordered target:self action:@selector(flipView)];
    self.navigationItem.rightBarButtonItem = edit;
    [edit release];
    [self.navigationController.view setBackgroundColor:[UIColor blackColor]];
    userInfoDict = [[NSMutableDictionary alloc]init ];
    tempDict = [[NSMutableDictionary alloc]init ];
    NodeAsyncConnection * aConn = [[NodeAsyncConnection alloc] init];
	self.curConnection = aConn;
	[aConn release];
    NodeAsyncConnection * aConn1 = [[NodeAsyncConnection alloc] init];
	self.photoConnection = aConn1;
	[aConn1 release];
    imageDownloadManager = [[ImagesDownloadManager alloc] init];
    imageDownloadManager.imageDownloadDelegate = self;
    self.activityIndicator.hidden = YES;
    self.isFirstLoad = YES;
    self.editVisible = YES;
    backViewSizeAdjusted = NO;
    self.navigationItem.rightBarButtonItem.enabled = NO;
    self.navigationItem.title = @"个人资料";
    [self.view addSubview:self.profileView];
    [self.view bringSubviewToFront:self.activityIndicator];
    NSArray *bloodA = [[NSArray alloc]initWithObjects:@"A型",@"B型",@"AB型",@"O型",nil];
    self.bloodArray = bloodA;
    [bloodA release];
    NSArray *starA = [[NSArray alloc]initWithObjects:@"水瓶座",@"双鱼座",@"白羊座",
                      @"金牛座",@"双子座",@"巨蟹座",@"狮子座",@"处女座",@"天秤座",@"天蝎座",@"射手座",@"摩羯座",nil];
    self.starArray = starA;
    [starA release];
    NSArray *schoolA = [[NSArray alloc]initWithObjects:@"本科",@"硕士",@"博士",nil];
    self.schoolArray = schoolA;
    [schoolA release];
    self.photoSelected = NO;
    self.needUpdatePhoto = NO;
    self.nameTextField.tag = 101;
    self.heightTextField.tag = 102;
    self.bloodTextField.tag = 103;
    self.starTextField.tag = 104;
    self.homeTextField.tag = 105;
    self.educationTextField.tag = 106;
    self.departmentTextField.tag = 107;
    self.schoolTextField.tag = 108;
    self.descriptionTextView.tag = 109;
    self.bloodPicker.tag = 201;
    self.starPicker.tag = 202;
    self.schoolPicker.tag = 203;
    self.responderField = 0;
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillShow:) name:UIKeyboardWillShowNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillHide:) name:UIKeyboardWillHideNotification object:nil];
}
- (BOOL)textField:(UITextField *)textField
shouldChangeCharactersInRange:(NSRange)range
replacementString:(NSString *)string
{
    if (textField.tag == 102)
    {
        NSCharacterSet *cs;
        cs = [[NSCharacterSet characterSetWithCharactersInString:kNumbers] invertedSet];
        NSString *filtered =
        [[string componentsSeparatedByCharactersInSet:cs] componentsJoinedByString:@""];
        BOOL basic = [string isEqualToString:filtered];
        if (basic)
        {
            if ([string length]+[textField.text length]>3)
            {
                return NO;
            }
            return YES;
        }
        else {
            return NO;
        }
        
    }
    else {
        return YES;
    }
    
}

- (void)keyboardWillHide:(NSNotification *)notification {
    
    NSDictionary* userInfo = [notification userInfo];
    NSValue *animationDurationValue = [userInfo objectForKey:UIKeyboardAnimationDurationUserInfoKey];
    NSTimeInterval animationDuration;
    [animationDurationValue getValue:&animationDuration];
//    CGRect keyboardBounds;
//    [[notification.userInfo valueForKey:UIKeyboardFrameEndUserInfoKey] getValue: &keyboardBounds];
//    CGFloat keyboardHeight = keyboardBounds.size.height;
    //NSLog(@"%f",keyboardHeight);
    if (backViewSizeAdjusted == YES)
    {
        backViewSizeAdjusted = NO;
        //CGRect frame = self.listView.frame;
        //frame.size.height += keyboardHeight;
        [UIView beginAnimations:nil context:NULL];
        [UIView setAnimationDuration:animationDuration];
        //self.listView.frame = frame;
        self.listView.frame = CGRectMake(0, 0, 320, 367);
        [UIView commitAnimations];
    }
}
- (void)keyboardWillShow:(NSNotification *)notification {
    
    NSDictionary *userInfo = [notification userInfo];
    
    NSValue *animationDurationValue = [userInfo objectForKey:UIKeyboardAnimationDurationUserInfoKey];
    NSTimeInterval animationDuration;
    [animationDurationValue getValue:&animationDuration];
//    CGRect keyboardBounds;
//    [[notification.userInfo valueForKey:UIKeyboardFrameEndUserInfoKey] getValue: &keyboardBounds];
//    CGFloat keyboardHeight = keyboardBounds.size.height;
    //NSLog(@"%f",keyboardHeight);
    if (backViewSizeAdjusted == NO)
    {
        backViewSizeAdjusted = YES;
        //CGRect frame = self.listView.frame;
        //frame.size.height -= keyboardHeight;
        [UIView beginAnimations:nil context:NULL];
        [UIView setAnimationDuration:animationDuration];
        self.listView.frame = CGRectMake(0, 0, 320, 200);
        switch (responderField) {
            case 102:
                [self.listView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:1 inSection:1] atScrollPosition:UITableViewScrollPositionTop animated:YES];
                break;
            case 103:
                [self.listView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:2 inSection:1] atScrollPosition:UITableViewScrollPositionTop animated:YES];
                break;
            case 104:
                [self.listView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:3 inSection:1] atScrollPosition:UITableViewScrollPositionTop animated:YES];
                break;
            case 105:
                [self.listView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:4 inSection:1] atScrollPosition:UITableViewScrollPositionTop animated:YES];
                break;
            case 106:
                [self.listView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:5 inSection:1] atScrollPosition:UITableViewScrollPositionTop animated:YES];
                break;
            case 107:
                [self.listView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:6 inSection:1] atScrollPosition:UITableViewScrollPositionTop animated:YES];
                break;
            case 109:
                [self.listView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:2] atScrollPosition:UITableViewScrollPositionMiddle animated:YES];
                break;
            default:
                break;
        }
        [UIView commitAnimations];
    }
}

- (void)viewWillAppear:(BOOL)animated
{
    [MobClick beginLogPageView:@"PrimaryProfileView"];
    if (self.isFirstLoad)
    {
        [self startGetUser];
    }
    else
    {
        [self displayUserInfo];
    }
}
- (void)viewWillDisappear:(BOOL)animated
{
    [MobClick endLogPageView:@"PrimaryProfileView"];
}
- (void)startGetUser
{
    self.navigationItem.rightBarButtonItem.enabled = NO;
    NSString *userId = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserId"];
    [curConnection cancelDownload];
    NSDictionary *dict = [[NSDictionary alloc]initWithObjectsAndKeys:userId,@"userId",userId,@"targetUserId",nil];
    [self.view bringSubviewToFront:self.activityIndicator];
    [self.activityIndicator startAnimating];
    self.activityIndicator.hidden = NO;
    [curConnection startDownload:[NodeAsyncConnection createNodeHttpRequest:@"/user/getUser" parameters:dict] :self :@selector(didEndGetUser:)];
    [dict release];
}
- (void)didEndGetUser:(NodeAsyncConnection *)connection
{

    self.navigationItem.rightBarButtonItem.enabled = YES;
    self.activityIndicator.hidden = YES;
    [self.activityIndicator stopAnimating];
    if (connection == nil || connection.result == nil)
    {
        return;
    }
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
    {
        NSDictionary *result = [connection.result objectForKey:@"result"];
        NSMutableDictionary *userInfo = [[NSMutableDictionary alloc]initWithDictionary:result];
        [[NSUserDefaults standardUserDefaults]setObject:userInfo forKey:@"PrettyUserInfo"];
        [userInfo release];
        [[NSUserDefaults standardUserDefaults]synchronize];
        [self.userInfoDict removeAllObjects];
        [self.userInfoDict addEntriesFromDictionary:result];
        [self.tempDict removeAllObjects];
        [self.tempDict addEntriesFromDictionary:result];
        NSString *profilePath = [self.userInfoDict objectForKey:@"primaryPhotoPath"];
        if (![PrettyUtility isNull:profilePath])
        {
            [[NSUserDefaults standardUserDefaults]setObject:profilePath forKey:@"PrettyUserPhoto"];
            [[NSUserDefaults standardUserDefaults]synchronize];
        }
        [self displayUserInfo];
        self.isFirstLoad = NO;
    }
}

-(void)flipView
{
    // disable user interaction during the flip
    
    //self.view.userInteractionEnabled = NO;
    [self.activityIndicator stopAnimating];
    self.activityIndicator.hidden = YES;
    // setup the animation group and creates it
    responderField = 0;
    [UIView beginAnimations:nil context:nil];
    [UIView setAnimationDuration:0.5];
    [UIView setAnimationDelegate:self];
    [UIView setAnimationDidStopSelector:@selector(flipViewsAnimationStop:finished:context:)];
    
    if (editVisible)
    {
        [UIView setAnimationTransition:UIViewAnimationTransitionFlipFromRight forView:self.view cache:YES];
        
        [self.profileView removeFromSuperview];
        [self.view addSubview:self.listView];
    }
    else
    {
        [UIView setAnimationTransition:UIViewAnimationTransitionFlipFromLeft forView:self.view cache:YES];
        
        [self.listView removeFromSuperview];
        [self.view addSubview:self.profileView];
    }
    [UIView commitAnimations];


    editVisible = !editVisible;
    if (editVisible)
    {
        NSString *height =[PrettyUtility cutWhiteAndNewLine:self.heightTextField.text];
        if (![PrettyUtility isNull:height])
        {
             [tempDict setObject:height forKey:@"height"];
        }
        else
        {
            [tempDict setObject:@"" forKey:@"height"];
        }
        NSString *blood = [PrettyUtility cutWhiteAndNewLine:self.bloodTextField.text];
        if (![PrettyUtility isNull:blood])
        {
             [tempDict setObject:blood forKey:@"bloodGroup"];
        }
        else
        {
            [tempDict setObject:@"" forKey:@"bloodGroup"];
        }
        NSString *star = [PrettyUtility cutWhiteAndNewLine:self.starTextField.text];
        if (![PrettyUtility isNull:star])
        {
            [tempDict setObject:star forKey:@"constellation"];
        }
        else
        {
            [tempDict setObject:@"" forKey:@"constellation"];
        }
        NSString *hometown = [PrettyUtility cutWhiteAndNewLine:self.homeTextField.text];//[tempDict objectForKey:@"hometown"];
        if (![PrettyUtility isNull:hometown])
        {
            [tempDict setObject:hometown forKey:@"hometown"];
        }
        else
        {
            [tempDict setObject:@"" forKey:@"hometown"];
        }
        NSString *education = [PrettyUtility cutWhiteAndNewLine:self.educationTextField.text];//[tempDict objectForKey:@"educationalStatus"];
        if (![PrettyUtility isNull:education])
        {
            [tempDict setObject:education forKey:@"educationalStatus"];
        }
        else
        {
            [tempDict setObject:@"" forKey:@"educationalStatus"];
        }
        NSString *department = [PrettyUtility cutWhiteAndNewLine:self.departmentTextField.text];//[tempDict objectForKey:@"department"];
        if (![PrettyUtility isNull:department])
        {
            [tempDict setObject:department forKey:@"department"];
        }
        else
        {
            [tempDict setObject:@"" forKey:@"department"];
        }
//        NSString *school = [tempDict objectForKey:@"school"];
//        if (![PrettyUtility isNull:school])
//        {
//            self.schoolTextField.text = school;
//        }
        NSString *description =[PrettyUtility cutWhiteAndNewLine:self.descriptionTextView.text];// [tempDict objectForKey:@"description"];
        if (![PrettyUtility isNull:description])
        {
            [tempDict setObject:description forKey:@"description"];
        }
        else
        {
            [tempDict setObject:@"" forKey:@"description"];
        }
    }
    [self displayUserInfo];
    self.navigationItem.rightBarButtonItem.title = editVisible ? @"编辑" : @"预览";
}
- (void)flipViewsAnimationStop:(NSString *)animationID finished:(NSNumber *)finished context:(void *)context {
    //self.view.userInteractionEnabled = YES;
}
-(void)logoutClicked
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
        if (imageDownloadManager != nil)
        {
            [imageDownloadManager cancelAllDownloadInProgress];
        }
        PrettyGlobalService *globalService = [PrettyGlobalService shareInstance];
        [globalService prettyRichLogOut];
    }
}

-(void)startUpdateProfileWithPhoto
{
    [self.view bringSubviewToFront:self.activityIndicator];
    [self.activityIndicator startAnimating];
    self.activityIndicator.hidden = NO;
    //NodeAsyncConnection *asyConnection = [[NodeAsyncConnection alloc]init];
    NSMutableDictionary *dict = [[NSMutableDictionary alloc]init];
    NSString *height =[PrettyUtility cutWhiteAndNewLine:self.heightTextField.text];
    //NSLog(@"%@",height);
    if (![PrettyUtility isNull:height])
    {
        [tempDict setObject:height forKey:@"height"];
        [dict setObject:height forKey:@"height"];
    }
    else
    {
        [tempDict setObject:@"" forKey:@"height"];
        [dict setObject:@"" forKey:@"height"];
    }
    NSString *blood = [PrettyUtility cutWhiteAndNewLine:self.bloodTextField.text];
    if (![PrettyUtility isNull:blood])
    {
        [tempDict setObject:blood forKey:@"bloodGroup"];
        [dict setObject:blood forKey:@"bloodGroup"];
    }
    else
    {
        [tempDict setObject:@"" forKey:@"bloodGroup"];
        [dict setObject:@"" forKey:@"bloodGroup"];
    }
    NSString *star = [PrettyUtility cutWhiteAndNewLine:self.starTextField.text];
    if (![PrettyUtility isNull:star])
    {
        [tempDict setObject:star forKey:@"constellation"];
        [dict setObject:star forKey:@"constellation"];
    }
    else
    {
        [tempDict setObject:@"" forKey:@"constellation"];
        [dict setObject:@"" forKey:@"constellation"];
    }
    NSString *hometown = [PrettyUtility cutWhiteAndNewLine:self.homeTextField.text];//[tempDict objectForKey:@"hometown"];
    if (![PrettyUtility isNull:hometown])
    {
        [tempDict setObject:hometown forKey:@"hometown"];
        [dict setObject:hometown forKey:@"hometown"];
    }
    else
    {
        [tempDict setObject:@"" forKey:@"hometown"];
        [dict setObject:@"" forKey:@"hometown"];
    }
    NSString *education = [PrettyUtility cutWhiteAndNewLine:self.educationTextField.text];//[tempDict objectForKey:@"educationalStatus"];
    if (![PrettyUtility isNull:education])
    {
        [tempDict setObject:education forKey:@"educationalStatus"];
        [dict setObject:education forKey:@"educationalStatus"];
    }
    else
    {
        [tempDict setObject:@"" forKey:@"educationalStatus"];
        [dict setObject:@"" forKey:@"educationalStatus"];
    }
    NSString *department = [PrettyUtility cutWhiteAndNewLine:self.departmentTextField.text];//[tempDict objectForKey:@"department"];
    if (![PrettyUtility isNull:department])
    {
        [tempDict setObject:department forKey:@"department"];
        [dict setObject:department forKey:@"department"];
    }
    else
    {
        [tempDict setObject:@"" forKey:@"department"];
        [dict setObject:@"" forKey:@"department"];
    }
    NSString *description =[PrettyUtility cutWhiteAndNewLine:self.descriptionTextView.text];// [tempDict objectForKey:@"description"];
    if (![PrettyUtility isNull:description])
    {
        [tempDict setObject:description forKey:@"description"];
        [dict setObject:description forKey:@"description"];
    }
    else
    {
        [tempDict setObject:@"" forKey:@"description"];
        [dict setObject:@"" forKey:@"description"];
    }
    NSString *userId = [[NSUserDefaults standardUserDefaults] objectForKey:@"PrettyUserId"];
    [dict setObject:userId forKey:@"userId"];
    if (needUpdatePhoto)
    {
        NSData *imageData = UIImageJPEGRepresentation(self.uploadPhoto, 0.6);
        [dict setObject:imageData forKey:@"image"];
        [dict setObject:[NSNumber numberWithFloat:uploadPhoto.size.width] forKey:@"imgWidth"];
        [dict setObject:[NSNumber numberWithFloat:uploadPhoto.size.height] forKey:@"imgHeight"];
        [curConnection cancelDownload];
        [curConnection startDownload:[NodeAsyncConnection createUploadPhotoRequest:@"/user/updateProfileWithPhoto" parameters:dict] :self :@selector(didEndUpdateProfileWithPhoto:)];
        [dict release];
    }
    else
    {
        [curConnection cancelDownload];
        [curConnection startDownload:[NodeAsyncConnection createNodeHttpRequest:@"/user/updateProfileWithPhoto" parameters:dict] :self :@selector(didEndUpdateProfileWithPhoto:)];
        [dict release];
    }
}
-(void)didEndUpdateProfileWithPhoto:(NodeAsyncConnection *)connection
{
    self.activityIndicator.hidden = YES;
    [self.activityIndicator stopAnimating];
    //NSLog(@"%@",connection.result);
    if (connection == nil || connection.result == nil)
    {
        return;
    }
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
    {
        CustomAlertView *errorAlert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:@"资料保存完毕" otherButton:nil cancelButton:nil delegate:nil duration:2.0];
        [errorAlert show];
        [errorAlert release];
        [self.userInfoDict removeAllObjects];
        [self.userInfoDict addEntriesFromDictionary:self.tempDict];
        
        NSDictionary *result = [connection.result objectForKey:@"result"];
        NSString *primaryPhotoPath = [result objectForKey:@"photoPath"];
        if (![PrettyUtility isNull:primaryPhotoPath])
        {
            [self.userInfoDict setObject:primaryPhotoPath forKey:@"primaryPhotoPath"];
            [self.tempDict setObject:primaryPhotoPath forKey:@"primaryPhotoPath"];
            [[NSUserDefaults standardUserDefaults] setObject:primaryPhotoPath forKey:@"PrettyUserPhoto"];
//            NSDictionary *preUserInfo = [[NSUserDefaults standardUserDefaults]dictionaryForKey:@"PrettyUserInfo"];
//            NSLog(@"pre info %@",[preUserInfo description]);
//            NSMutableDictionary *userInfo = [[NSMutableDictionary alloc]initWithDictionary:preUserInfo];
//            [userInfo setObject:primaryPhotoPath forKey:@"primaryPhotoPath"];
//            [[NSUserDefaults standardUserDefaults] setObject:userInfo forKey:@"PrettyUserInfo"];
//            [userInfo release];
//            [[NSUserDefaults standardUserDefaults] synchronize];
//            NSLog(@"after %@",[[[NSUserDefaults standardUserDefaults]dictionaryForKey:@"PrettyUserInfo"] description]);
        }

        //NSLog(@"userInfo %@",self.userInfoDict);
        NSMutableDictionary *userInfo = [[NSMutableDictionary alloc]initWithDictionary:self.userInfoDict];
        [[NSUserDefaults standardUserDefaults]setObject:userInfo forKey:@"PrettyUserInfo"];
        [userInfo release];
        [[NSUserDefaults standardUserDefaults]synchronize];
        if (needUpdatePhoto)
        {
            needUpdatePhoto = NO;
        }
    }
}
//-(void)didEndUpdateProfile:(NodeAsyncConnection *)connection
//{
//    self.activityIndicator.hidden = YES;
//    [self.activityIndicator stopAnimating];
//    if (connection == nil || connection.result == nil)
//    {
//        return;
//    }
//    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
//    {
//        [self.userInfoDict removeAllObjects];
//        [self.userInfoDict addEntriesFromDictionary:self.tempDict];
//        NSMutableDictionary *userInfo = [[NSMutableDictionary alloc]initWithDictionary:self.userInfoDict];
//        [[NSUserDefaults standardUserDefaults]setObject:userInfo forKey:@"PrettyUserInfo"];
//        [userInfo release];
//        [[NSUserDefaults standardUserDefaults]synchronize];
//    }
//}
//-(void)updatePrimaryPhoto
//{
//    //NodeAsyncConnection *asyConnection = [[NodeAsyncConnection alloc]init];
//    //UIImage *newImage = [PrettyUtility correctImageOrientation:self.uploadPhoto :480];
//    NSData *imageData = UIImageJPEGRepresentation(self.uploadPhoto, 0.6);
//    NSString *userId = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserId"];
//    NSDictionary *dict = [[NSDictionary alloc]initWithObjectsAndKeys:imageData,@"image",userId,@"userId",[NSNumber numberWithFloat:self.uploadPhoto.size.width],@"width",[NSNumber numberWithFloat:self.uploadPhoto.size.height],@"height",[NSNumber numberWithBool:YES],@"setPrimary",nil];
//    NSMutableURLRequest *request = [NodeAsyncConnection createUploadPhotoRequest:@"/user/uploadPhoto" parameters:dict];
//    [photoConnection cancelDownload];
//    [photoConnection startDownload:request :self :@selector(didEndUpdatePrimaryPhoto:)];
//    [dict release];
//}
//-(void)didEndUpdatePrimaryPhoto:(NodeAsyncConnection *)connection
//{
//    self.activityIndicator.hidden = YES;
//    [self.activityIndicator stopAnimating];
//    if (connection == nil || connection.result == nil)
//    {
//        return;
//    }
//    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
//    {
//        NSDictionary *result = [connection.result objectForKey:@"result"];
//        
//
//        NSString *primaryPhotoPath = [result objectForKey:@"photoPath"];
//        if (![PrettyUtility isNull:primaryPhotoPath])
//        {
//            [self.userInfoDict setObject:primaryPhotoPath forKey:@"primaryPhotoPath"];
//            [self.tempDict setObject:primaryPhotoPath forKey:@"primaryPhotoPath"];
//            [[NSUserDefaults standardUserDefaults] setObject:primaryPhotoPath forKey:@"PrettyUserPhoto"];
//            NSDictionary *preUserInfo = [[NSUserDefaults standardUserDefaults]dictionaryForKey:@"PrettyUserInfo"];
//            NSLog(@"pre info %@",[preUserInfo description]);
//            NSMutableDictionary *userInfo = [[NSMutableDictionary alloc]initWithDictionary:preUserInfo];
//            [userInfo setObject:primaryPhotoPath forKey:@"primaryPhotoPath"];
//            [[NSUserDefaults standardUserDefaults] setObject:userInfo forKey:@"PrettyUserInfo"];
//            [userInfo release];
//            [[NSUserDefaults standardUserDefaults] synchronize];
//            NSLog(@"after %@",[[[NSUserDefaults standardUserDefaults]dictionaryForKey:@"PrettyUserInfo"] description]);
//        }
//        needUpdatePhoto = NO;
//
//    }
//}
-(void)displayUserInfo
{
    if (self.tempDict == nil)
    {
        return;
    }

    if (editVisible)
    {
        //display info in profileview
        if (photoSelected)
        {
            [self.primaryPhotoView setImage:self.uploadPhoto];
        }
        else
        {
            NSString *profilePath= [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserPhoto"];
            if (![PrettyUtility isNull:profilePath])
            {
                NSString *datePhotoUrl = [PrettyUtility getPhotoUrl:profilePath :@"fw"];
                AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
                UIImage *dateImage = [appDelegate.imageCache objectForKey:datePhotoUrl];
                if (dateImage != nil)
                {
                    [self.activityIndicator stopAnimating];
                    self.activityIndicator.hidden = YES;
                    [self.primaryPhotoView setImage:dateImage];
                }
                else
                {
                    NSUInteger indexArr[] = {0,0};
                    NSIndexPath *rowIndexPath = [[NSIndexPath alloc] initWithIndexes:indexArr length:2];
                    [self.imageDownloadManager downloadImageWithUrl:datePhotoUrl forIndexPath:rowIndexPath];
                    [rowIndexPath release];
                    [self.view bringSubviewToFront:self.activityIndicator];
                    [self.activityIndicator startAnimating];
                    self.activityIndicator.hidden = NO;
                }
            }
        }

        NSString *name = [self.tempDict objectForKey:@"name"];
        self.nameLabel.text = name;
        NSString *info1=@"";
        NSString *gender = [self.tempDict objectForKey:@"gender"];
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
        NSString *height = [tempDict objectForKey:@"height"];
        if(![PrettyUtility isNull:height])
        {
            if([info1 isEqualToString:@""])
            {
                info1 = [NSString stringWithFormat:@"%@CM",height];
            }
            else
            {
                info1 = [info1 stringByAppendingFormat:@", %@CM",height];
            }

            //info1 = [info1 stringByAppendingFormat:@"%@CM",height];
        }
        NSString *blood = [tempDict objectForKey:@"bloodGroup"];
        if(![PrettyUtility isNull:blood])
        {
            if([info1 isEqualToString:@""])
            {
                info1 = blood;
            }
            else
            {
                info1 = [info1 stringByAppendingFormat:@", %@",blood];
            }
        }
        NSString *star = [tempDict objectForKey:@"constellation"];
        if(![PrettyUtility isNull:star])
        {
            if([info1 isEqualToString:@""])
            {
                info1 = star;
            }
            else
            {
                info1 = [info1 stringByAppendingFormat:@", %@",star];
            }
        }
        NSString *hometown = [tempDict objectForKey:@"hometown"];
        if(![PrettyUtility isNull:hometown])
        {
            if([info1 isEqualToString:@""])
            {
                info1 = hometown;
            }
            else
            {
                info1 = [info1 stringByAppendingFormat:@", 家乡%@",hometown];
            }
        }
        self.HeightABloodAStarlabel.text = info1;
        NSString *info2=@"";
        NSString *education = [tempDict objectForKey:@"educationalStatus"];
        if(![PrettyUtility isNull:education])
        {
            info2 = [info2 stringByAppendingString:education];
        }
        NSString *department = [tempDict objectForKey:@"department"];
        if(![PrettyUtility isNull:department])
        {
            if([info2 isEqualToString:@""])
            {
                info2 = department;
            }
            else
            {
                info2 = [info2 stringByAppendingFormat:@", %@",department];
            }
        }
        NSString *school = [tempDict objectForKey:@"school"];
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
        NSString *goodRate = [PrettyUtility readNumberString:[tempDict objectForKey:@"goodRateCount"]];
        if(![PrettyUtility isNull:goodRate])
        {
            if([info2 isEqualToString:@""])
            {
                info2 = school;
            }
            else
            {
                info2 = [info2 stringByAppendingFormat:@", 靠谱指数%@",goodRate];
            }
        }
        self.EduADepartASchoolLabel.text = info2;
        
        NSString *description = [tempDict objectForKey:@"description"];
        if(![PrettyUtility isNull:description])
        {
            self.selfDescriptionlabel.text = description;
        }
        else
        {
            self.selfDescriptionlabel.text = @"";
        }
        CGSize descriptionSize = [self.selfDescriptionlabel.text sizeWithFont:[UIFont systemFontOfSize:14]constrainedToSize:CGSizeMake(280, 9999) lineBreakMode:UILineBreakModeWordWrap];
        if (descriptionSize.height>90)
        {
            self.selfDescriptionlabel.frame = CGRectMake(20, 362-90, 280, 90);
            self.selfDescriptionlabel.lineBreakMode = UILineBreakModeWordWrap | UILineBreakModeTailTruncation;
        }
        else
        {
            self.selfDescriptionlabel.frame = CGRectMake(20, 362-descriptionSize.height, 280, descriptionSize.height);
            self.selfDescriptionlabel.lineBreakMode = UILineBreakModeWordWrap;
        }

        //self.selfDescriptionlabel.frame = CGRectMake(20, 362-descriptionSize.height, 280, descriptionSize.height);
        CGSize eduSize = [self.EduADepartASchoolLabel.text sizeWithFont:[UIFont systemFontOfSize:14]constrainedToSize:CGSizeMake(280, 9999) lineBreakMode:UILineBreakModeWordWrap];
        float y = self.selfDescriptionlabel.frame.origin.y-10-eduSize.height;
        self.EduADepartASchoolLabel.frame = CGRectMake(20, y, eduSize.width, eduSize.height);
        
        CGSize heiSize = [self.HeightABloodAStarlabel.text sizeWithFont:[UIFont systemFontOfSize:14]constrainedToSize:CGSizeMake(280, 9999) lineBreakMode:UILineBreakModeWordWrap];
        y = y-5-heiSize.height;
        self.HeightABloodAStarlabel.frame = CGRectMake(20, y, heiSize.width, heiSize.height);
        
        y = y-5-self.nameLabel.frame.size.height;
        self.nameLabel.frame = CGRectMake(self.nameLabel.frame.origin.x,y, self.nameLabel.frame.size.width, self.nameLabel.frame.size.height);

    }
    else
    {
        
        //display info in listview
        if (photoSelected)
        {
            [self.userPhotoView setImage:self.uploadPhoto];
        }
        else
        {
            NSString *profilePath= [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserPhoto"];
            if (![PrettyUtility isNull:profilePath])
            {
                NSString *datePhotoUrl = [PrettyUtility getPhotoUrl:profilePath :@"s"];
                AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
                UIImage *dateImage = [appDelegate.imageCache objectForKey:datePhotoUrl];
                if (dateImage != nil)
                {
                    [self.activityIndicator stopAnimating];
                    self.activityIndicator.hidden = YES;
                    [self.userPhotoView setImage:dateImage];
                }
                else
                {
                    NSUInteger indexArr[] = {0};
                    NSIndexPath *rowIndexPath = [[NSIndexPath alloc] initWithIndexes:indexArr length:1];
                    [self.imageDownloadManager downloadImageWithUrl:datePhotoUrl forIndexPath:rowIndexPath];
                    [rowIndexPath release];
                    [self.view bringSubviewToFront:self.activityIndicator];
                    [self.activityIndicator startAnimating];
                    self.activityIndicator.hidden = NO;
                }
            }
        }
        NSString *name = [tempDict objectForKey:@"name"];
        if (![PrettyUtility isNull:name])
        {
            self.nameTextField.text = name;
        }
        NSString *height = [tempDict objectForKey:@"height"];
        if (![PrettyUtility isNull:height])
        {
            self.heightTextField.text = height;
        }
        NSString *blood = [tempDict objectForKey:@"bloodGroup"];
        if (![PrettyUtility isNull:blood])
        {
            self.bloodTextField.text = blood;
        }
        NSString *star = [tempDict objectForKey:@"constellation"];
        if (![PrettyUtility isNull:star])
        {
            self.starTextField.text = star;
        }
        NSString *hometown = [tempDict objectForKey:@"hometown"];
        if (![PrettyUtility isNull:hometown])
        {
            self.homeTextField.text = hometown;
        }
        NSString *education = [tempDict objectForKey:@"educationalStatus"];
        if (![PrettyUtility isNull:education])
        {
            self.educationTextField.text = education;
        }
        NSString *department = [tempDict objectForKey:@"department"];
        if (![PrettyUtility isNull:department])
        {
            self.departmentTextField.text = department;
        }
        NSString *school = [tempDict objectForKey:@"school"];
        if (![PrettyUtility isNull:school])
        {
            self.schoolTextField.text = school;
        }
        NSString *description = [tempDict objectForKey:@"description"];
        if (![PrettyUtility isNull:description])
        {
            self.descriptionTextView.text = description;
        }

    }
}
- (BOOL)textFieldShouldBeginEditing:(UITextField *)textField
{
    if (textField.tag == 103)
    {
        textField.inputView = self.bloodPicker;
        textField.inputAccessoryView = self.toolBar;
    }
    else if(textField.tag == 104)
    {
        //[self setMyTreatOn];
        textField.inputAccessoryView = self.toolBar;
        textField.inputView = self.starPicker;
        
    }
    else if(textField.tag == 106)
    {
        //[self setMyTreatOff];
        textField.inputAccessoryView = self.toolBar;
        textField.inputView = self.schoolPicker;
    }
    else if(textField.tag == 102)
    {
        textField.inputAccessoryView = self.toolBar;
    }
    responderField = textField.tag;
    return YES;
}
- (BOOL)textFieldShouldReturn:(UITextField *)textField
{
    [textField resignFirstResponder];
    return YES;
}
- (BOOL)textViewShouldBeginEditing:(UITextView *)textView
{
    if (textView.tag == 109)
    {
        textView.inputAccessoryView = self.toolBar;
    }
    responderField = textView.tag;
    return YES;
}
- (IBAction)doneButtonClicked
{
    if (responderField == 103)
    {
        int current = [self.bloodPicker selectedRowInComponent:0];
        if (current>=0 && current < [self.bloodArray count])
        {
            self.bloodTextField.text = [self.bloodArray objectAtIndex:current];
        }

        [self.bloodTextField resignFirstResponder];
    }
    else if(responderField == 104)
    {
        int current = [self.starPicker selectedRowInComponent:0];
        if (current>=0 && current < [self.starArray count])
        {
            self.starTextField.text = [self.starArray objectAtIndex:current];
        }
        [self.starTextField resignFirstResponder];
    }
    else if(responderField == 106)
    {
        int current = [self.schoolPicker selectedRowInComponent:0];
        if (current>=0 && current < [self.schoolArray count])
        {
            self.educationTextField.text = [self.schoolArray objectAtIndex:current];
        }
        [self.educationTextField resignFirstResponder];
    }
    else if(responderField == 109)
    {
        [self.descriptionTextView resignFirstResponder];
    }
    else if (responderField == 102)
    {
        [self.heightTextField resignFirstResponder];
    }
    responderField = 0;
}
- (IBAction)cancelButtonClicked
{
    if (responderField == 103)
    {
        [self.bloodTextField resignFirstResponder];
    }
    else if(responderField == 104)
    {
        [self.starTextField resignFirstResponder];
    }
    else if(responderField == 106)
    {
        [self.educationTextField resignFirstResponder];
    }
    else if(responderField == 109)
    {
        [self.descriptionTextView resignFirstResponder];
    }
    responderField = 0;
    
}

- (IBAction) clickAddPhoto
{
	if ([UIImagePickerController isSourceTypeAvailable:UIImagePickerControllerSourceTypeCamera])
    {
        UIActionSheet *actionSheet;
        actionSheet = [[UIActionSheet alloc] initWithTitle:@"" delegate:self cancelButtonTitle:@"取消" destructiveButtonTitle:nil otherButtonTitles:@"拍摄一张", @"从相册选择", nil];
        [actionSheet showInView:self.view.superview];
        [actionSheet release];
        
    }
    else
    {
        [self showModalImagePicker:UIImagePickerControllerSourceTypePhotoLibrary];
    }
}
- (void)actionSheet:(UIActionSheet *)actionSheet clickedButtonAtIndex:(NSInteger)buttonIndex
{
    if (buttonIndex == 0)
    {
        [self showModalImagePicker:UIImagePickerControllerSourceTypeCamera];
    }
    else if (buttonIndex == 1)
    {
        [self showModalImagePicker:UIImagePickerControllerSourceTypePhotoLibrary];
    }
}

- (void) showModalImagePicker :(UIImagePickerControllerSourceType) sourceType
{
//    [[UINavigationBar appearance] setBackgroundImage:nil
//                                       forBarMetrics:UIBarMetricsDefault];
	UIImagePickerController *imagePicker =  [[UIImagePickerController alloc] init];
    imagePicker.sourceType = sourceType;
    imagePicker.delegate = self;
	imagePicker.allowsEditing = YES;
    [self presentModalViewController:imagePicker animated:YES];
    [imagePicker release];
}
- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker
{
    [picker dismissModalViewControllerAnimated:YES];
    [[UIApplication sharedApplication]setStatusBarStyle:UIStatusBarStyleBlackOpaque];
}
- (void)imagePickerController:(UIImagePickerController *)picker
        didFinishPickingImage:(UIImage *)image
                  editingInfo:(NSDictionary *)editingInfo
{
    
    [picker dismissModalViewControllerAnimated:YES];
    [[UIApplication sharedApplication]setStatusBarStyle:UIStatusBarStyleBlackOpaque];
    //NSLog(@"witdh %f height %f",image.size.width,image.size.height);
    [NSThread detachNewThreadSelector:@selector(useImage:) toTarget:self withObject:image];
    
}
- (void)useImage:(UIImage *)image
{
    self.uploadPhoto = [PrettyUtility correctImageOrientation:image :480];
    self.photoSelected = YES;
    self.needUpdatePhoto = YES;
    [self.userPhotoView setImage:self.uploadPhoto];
}

//- (void)imagePickerController:(UIImagePickerController *)picker
//        didFinishPickingImage:(UIImage *)image
//                  editingInfo:(NSDictionary *)editingInfo
//{
//    
//    [[picker parentViewController] dismissModalViewControllerAnimated:YES];
//    [[UIApplication sharedApplication]setStatusBarStyle:UIStatusBarStyleBlackOpaque];
//    self.uploadPhoto = [PrettyUtility correctImageOrientation:image :960];
//    self.photoSelected = YES;
//    [self.userPhotoView setImage:self.uploadPhoto];
//}

#pragma mark- ImageDownloaderDelegate
- (void) imageDidDownload:(ImageDownloader *)downloader
{
    [self.activityIndicator stopAnimating];
    self.activityIndicator.hidden = YES;
    if (downloader.downloadImage != nil)
    {
        AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
        [appDelegate.imageCache setObject:downloader.downloadImage forKey:downloader.imageUrl];
        NSIndexPath * imageIndexPath = downloader.indexPathInTableView;
        if (!photoSelected)
        {
            if ([imageIndexPath length] == 2 && editVisible)
            {
                [self.primaryPhotoView setImage:downloader.downloadImage];
            }
            if ([imageIndexPath length] == 1 && !editVisible)
            {
                [self.userPhotoView setImage:downloader.downloadImage];
            }
        }
     }
    [imageDownloadManager removeOneDownloaderWithIndexPath:downloader.indexPathInTableView];
}

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    // Return the number of sections.
    return 4;
}
- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (indexPath.section == 0 )
    {
        return 70;
    }
    else if(indexPath.section == 2)
    {
        return 90;
    }
    else
    {
        return 44;
    }
}
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    if (section == 0)
    {
        return 1;
        
    }
    else if (section == 1)
    {
        return 8;
    }
    else if (section == 2)
    {
        return 1;
    }
    else
        return 1;
    
}
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (indexPath.section == 0)
    {
        return self.userPhotoCell;
    }
    else if (indexPath.section == 1)
    {
        if (indexPath.row == 0)
        {
            return self.userNameCell;
        }
        else if(indexPath.row == 1)
        {
            return self.userHeightCell;
        }
        else if(indexPath.row == 2)
        {
            return self.userBloodCell;
        }
        else if(indexPath.row == 3)
        {
            return self.userStarCell;
        }
        else if(indexPath.row == 4)
        {
            return self.userHomeCell;
        }
        else if(indexPath.row == 5)
        {
            return self.userEducationCell;
        }
        else if(indexPath.row == 6)
        {
            return self.userDepartmentCell;
        }
        else
        {
            return self.userSchoolCell;
        }
    }
    else if(indexPath.section == 2)
    {
        return self.userDescriptionCell;
    }
    else
    {
        return self.saveChangeCell;
    }
    
    //Configure the cell...
}
-(void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (indexPath.section == 3)
    {
        [self startUpdateProfileWithPhoto];
    }
    [tableView deselectRowAtIndexPath:indexPath animated:YES];
}
- (NSInteger)numberOfComponentsInPickerView:(UIPickerView *)pickerView
{
    return 1;
}
- (NSInteger)pickerView:(UIPickerView *)pickerView numberOfRowsInComponent:(NSInteger)component
{
    if (pickerView.tag == 201)
    {
        return [self.bloodArray count];
    }
    else if (pickerView.tag == 202)
    {
        return [self.starArray count];
    }
    else
        return [self.schoolArray count];
}
- (NSString *)pickerView:(UIPickerView *)pickerView titleForRow:(NSInteger)row forComponent:(NSInteger)component
{
    if (pickerView.tag == 201)
    {
        return [self.bloodArray objectAtIndex:row];
    }
    else if (pickerView.tag == 202)
    {
        return [self.starArray objectAtIndex:row];
    }
    else
        return [self.schoolArray objectAtIndex:row];
}
- (void)pickerView:(UIPickerView *)pickerView didSelectRow:(NSInteger)row inComponent:(NSInteger)component
{
    if (pickerView.tag == 201)
    {
        self.bloodTextField.text = [self.bloodArray objectAtIndex:row];
    }
    else if (pickerView.tag == 202)
    {
        self.starTextField.text =  [self.starArray objectAtIndex:row];
    }
    else
        self.educationTextField.text =  [self.schoolArray objectAtIndex:row];
}
- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}
- (void)viewDidUnload
{
    if (imageDownloadManager != nil)
    {
        [imageDownloadManager cancelAllDownloadInProgress];
    }
    [self setPrimaryPhotoView:nil];
    [self setActivityIndicator:nil];
    [self setProfileView:nil];
    [self setListView:nil];
    [self setUserHomeCell:nil];
    [self setHomeTextField:nil];
    [self setSaveChangeCell:nil];
    [self setUserPhotoCell:nil];
    [self setUserPhotoView:nil];
    [self setAddPhotoButton:nil];
    [self setUserHeightCell:nil];
    [self setHeightTextField:nil];
    [self setUserBloodCell:nil];
    [self setBloodTextField:nil];
    [self setDepartmentTextField:nil];
    [self setUserDepartmentCell:nil];
    [self setUserEducationCell:nil];
    [self setEducationTextField:nil];
    [self setUserDescriptionCell:nil];
    [self setDescriptionTextView:nil];
    [self setUserNameCell:nil];
    [self setNameTextField:nil];
    [self setUserStarCell:nil];
    [self setStarTextField:nil];
    [self setSchoolPicker:nil];
    [self setBloodPicker:nil];
    [self setStarPicker:nil];
    [self setToolBar:nil];
    [self setNameLabel:nil];
    [self setHeightABloodAStarlabel:nil];
    [self setEduADepartASchoolLabel:nil];
    [self setSelfDescriptionlabel:nil];
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}

- (void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillShowNotification object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillHideNotification object:nil];
    [curConnection cancelDownload];
    [photoConnection cancelDownload];
    if (imageDownloadManager != nil)
    {
        [imageDownloadManager cancelAllDownloadInProgress];
        imageDownloadManager.imageDownloadDelegate = nil;
    }
    [photoConnection release];
    [curConnection release];
    [imageDownloadManager release];
    [userInfoDict release];
    [_primaryPhotoView release];
    [_activityIndicator release];
    [_profileView release];
    [_listView release];
    [_userHomeCell release];
    [_homeTextField release];
    [_saveChangeCell release];
    [_userPhotoCell release];
    [_userPhotoView release];
    [_addPhotoButton release];
    [_userHeightCell release];
    [tempDict release];
    [_heightTextField release];
    [_userNameCell release];
    [_nameTextField release];
    [_userBloodCell release];
    [_bloodTextField release];
    [_departmentTextField release];
    [_userDepartmentCell release];
    [_userEducationCell release];
    [_educationTextField release];
    [_userDescriptionCell release];
    [_descriptionTextView release];
    [_userStarCell release];
    [_starTextField release];
    [uploadPhoto release];
    [_schoolPicker release];
    [_bloodPicker release];
    [_starPicker release];
    [_toolBar release];
    [bloodArray release];
    [starArray release];
    [schoolArray release];
    [_nameLabel release];
    [_HeightABloodAStarlabel release];
    [_EduADepartASchoolLabel release];
    [_selfDescriptionlabel release];
    [super dealloc];
}

@end
