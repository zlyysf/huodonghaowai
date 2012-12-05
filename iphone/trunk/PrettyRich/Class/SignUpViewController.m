//
//  SignUpViewController.m
//  PrettyRich
//
//  Created by liu miao on 7/31/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "SignUpViewController.h"
#import "PrettyUtility.h"
#import "PrettyGlobalService.h"
#define kNumbers     @"0123456789"
#import "AppDelegate.h"
#import "CustomAlertView.h"
#import "NNMainTabViewController.h"
#import "MobClick.h"
@interface SignUpViewController ()

@end

@implementation SignUpViewController
@synthesize emailTextField;
@synthesize passwordTextField;
@synthesize firstnameTextField;
@synthesize heightTextField;
@synthesize photoImageView;
@synthesize femaleButton;
@synthesize maleButton;
@synthesize activityIndicator;
@synthesize photoButton,schoolArray;
@synthesize curConnection,name,height,gender,photoSelected,uploadImage,backViewSizeAdjusted,emailAccount,lastActiveField,password,inviteCode,codeTextField;
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
    NSArray *schoolA = [[NSArray alloc]initWithObjects:@"北京大学",nil];
    self.schoolArray = schoolA;
    [schoolA release];

    UIBarButtonItem *customBarItem = [[UIBarButtonItem alloc]initWithTitle:@"注册" style:UIBarButtonItemStyleBordered target:self action:@selector(startSignup)];
    self.navigationItem.rightBarButtonItem = customBarItem;
    [customBarItem release];
    photoSelected = NO;
    if(self.uploadImage != nil)
    {
		[self.photoImageView setImage:self.uploadImage];
		self.photoSelected = YES;
	}
    self.emailTextField.tag = 101;
    self.passwordTextField.tag = 102;
    self.firstnameTextField.tag = 103;
    self.heightTextField.tag = 104;
    self.codeTextField.tag = 105;
    UIView *tempView = [[UIView alloc] init];
    [self.genderCell setBackgroundView:tempView];
    [self.genderCell setBackgroundColor:[UIColor clearColor]];
    [tempView release];
    if ([self.name length]!=0)
    {
        self.firstnameTextField.text = self.name;
    }
    if ([self.emailAccount length]!=0)
    {
        self.emailTextField.text = self.emailAccount;
    }
    if ([self.password length]!=0)
    {
        self.passwordTextField.text = self.password;
    }
    if ([self.height length]!=0)
    {
        self.heightTextField.text = self.height;
//        self.inchLabel.text = [PrettyUtility convertIntToInch:[self.height intValue]];
//        self.inchLabel.textColor = [UIColor blackColor];
    }
    if ([self.inviteCode length]!= 0)
    {
        self.codeTextField.text = self.inviteCode;
    }
    UIView *paddingView1 = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 6, 34)];
    self.emailTextField.leftView = paddingView1;    
    self.emailTextField.leftViewMode = UITextFieldViewModeAlways;
    [paddingView1 release];
        UIView *paddingView2 = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 6, 34)];
    self.passwordTextField.leftView = paddingView2;    
    self.passwordTextField.leftViewMode = UITextFieldViewModeAlways;
    [paddingView2 release];
        UIView *paddingView3 = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 6, 34)];
    self.firstnameTextField.leftView = paddingView3;    
    self.firstnameTextField.leftViewMode = UITextFieldViewModeAlways;
    [paddingView3 release];
        UIView *paddingView4 = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 6, 34)];
    self.heightTextField.leftView = paddingView4;    
    self.heightTextField.leftViewMode = UITextFieldViewModeAlways;
    [paddingView4 release];
    UIView *paddingView5 = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 6, 34)];
    self.codeTextField.leftView = paddingView5;
    self.codeTextField.leftViewMode = UITextFieldViewModeAlways;
    [paddingView5 release];


    NodeAsyncConnection * aConn = [[NodeAsyncConnection alloc] init];
	self.curConnection = aConn;
	[aConn release];
    self.lastActiveField = nil;
    self.activityIndicator.hidden = YES;
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(textDidChanged:) name:UITextFieldTextDidChangeNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillShow:) name:UIKeyboardWillShowNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillHide:) name:UIKeyboardWillHideNotification object:nil];
    
    [self.maleButton addTarget:self action:@selector(maleButtonClicked) forControlEvents:UIControlEventTouchUpInside];
    [self.femaleButton addTarget:self action:@selector(femaleButtonClicked) forControlEvents:UIControlEventTouchUpInside];
    if (self.gender == nil ||[self.gender isEqualToString:@"female"]) 
    {
        
        [self.femaleButton setBackgroundImage:[[UIImage imageNamed:@"login-female-on.png"] stretchableImageWithLeftCapWidth:20 topCapHeight:17] forState:UIControlStateNormal];
        [self.maleButton setBackgroundImage:[[UIImage imageNamed:@"login-male-off.png"] stretchableImageWithLeftCapWidth:20 topCapHeight:17] forState:UIControlStateNormal];
    }
    else 
    {
        [self.maleButton setBackgroundImage:[[UIImage imageNamed:@"login-male-on.png"] stretchableImageWithLeftCapWidth:20 topCapHeight:17] forState:UIControlStateNormal];
        [self.femaleButton setBackgroundImage:[[UIImage imageNamed:@"login-female-off.png"] stretchableImageWithLeftCapWidth:20 topCapHeight:17] forState:UIControlStateNormal];
    }

    backViewSizeAdjusted = NO;
    self.navigationItem.title = @"新用户注册";
}
- (IBAction) clickAddPhoto
{
	self.emailAccount = self.emailTextField.text;
    self.password = self.passwordTextField.text;
    self.name = self.firstnameTextField.text;
    self.height = self.heightTextField.text;
    self.inviteCode = self.codeTextField.text;
	if ([UIImagePickerController isSourceTypeAvailable:UIImagePickerControllerSourceTypeCamera])
    {
        UIActionSheet *actionSheet;
        actionSheet = [[UIActionSheet alloc] initWithTitle:@"" delegate:self cancelButtonTitle:@"取消" destructiveButtonTitle:nil otherButtonTitles:@"拍摄一张", @"从相册选择", nil];
        [actionSheet showInView:self.view];
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
    //UIImage *gradientImage44 = [[UIImage imageNamed:@"top-bar-pretty-rich.png"]
    //                            resizableImageWithCapInsets:UIEdgeInsetsMake(0, 0, 0, 0)];
    
    // Set the background image for *all* UINavigationBars
    //[[UINavigationBar appearance] setBackgroundImage:gradientImage44
    //                                   forBarMetrics:UIBarMetricsDefault];

    [picker dismissModalViewControllerAnimated:YES];
    [[UIApplication sharedApplication]setStatusBarStyle:UIStatusBarStyleBlackOpaque];
}
- (void)imagePickerController:(UIImagePickerController *)picker
        didFinishPickingImage:(UIImage *)image
                  editingInfo:(NSDictionary *)editingInfo
{
    
    [picker dismissModalViewControllerAnimated:YES];
    [[UIApplication sharedApplication]setStatusBarStyle:UIStatusBarStyleBlackOpaque];
    //UIImage *image = [info objectForKey:UIImagePickerControllerOriginalImage];
    [NSThread detachNewThreadSelector:@selector(useImage:) toTarget:self withObject:image];
    
}
- (void)useImage:(UIImage *)image
{
    self.uploadImage = [PrettyUtility correctImageOrientation:image :480];
    self.photoSelected = YES;
    [self.photoImageView setImage:self.uploadImage];
}//- (void)imagePickerController:(UIImagePickerController *)picker
//        didFinishPickingImage:(UIImage *)image
//                  editingInfo:(NSDictionary *)editingInfo
//{
//    [[picker parentViewController] dismissModalViewControllerAnimated:YES];
//    [[UIApplication sharedApplication]setStatusBarStyle:UIStatusBarStyleBlackOpaque];
//    self.uploadImage = [PrettyUtility correctImageOrientation:image :960];
//    self.photoSelected = YES;
//    [self.photoImageView setImage:self.uploadImage];
//}
- (void)maleButtonClicked
{
    [self.maleButton setBackgroundImage:[[UIImage imageNamed:@"login-male-on.png"] stretchableImageWithLeftCapWidth:20 topCapHeight:17] forState:UIControlStateNormal];
    [self.femaleButton setBackgroundImage:[[UIImage imageNamed:@"login-female-off.png"] stretchableImageWithLeftCapWidth:20 topCapHeight:17] forState:UIControlStateNormal];
    self.gender = @"male";
}
- (void)femaleButtonClicked
{
    [self.maleButton setBackgroundImage:[[UIImage imageNamed:@"login-male-off.png"] stretchableImageWithLeftCapWidth:20 topCapHeight:17] forState:UIControlStateNormal];
    [self.femaleButton setBackgroundImage:[[UIImage imageNamed:@"login-female-on.png"] stretchableImageWithLeftCapWidth:20 topCapHeight:17] forState:UIControlStateNormal];
    self.gender = @"female";
}
-(BOOL)validateEmail:(NSString*)email
{
    NSString * regex = @"\\w+([-+.]\\w*)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*";
    NSPredicate * pred = [NSPredicate predicateWithFormat:@"SELF MATCHES %@", regex];
    return [pred evaluateWithObject:email];
//    if( (0 != [email rangeOfString:@"@"].length) &&  (0 != [email rangeOfString:@"."].length) )
//    {
//        NSMutableCharacterSet *invalidCharSet = [[[[NSCharacterSet alphanumericCharacterSet] invertedSet]mutableCopy]autorelease];
//        [invalidCharSet removeCharactersInString:@"_-+"];
//        
//        NSRange range1 = [email rangeOfString:@"@" options:NSCaseInsensitiveSearch];
//        
//        // If username part contains any character other than "."  "_" "-"
//        
//        NSString *usernamePart = [email substringToIndex:range1.location];
//        NSArray *stringsArray1 = [usernamePart componentsSeparatedByString:@"."];
//        for (NSString *string in stringsArray1) {
//            NSRange rangeOfInavlidChars=[string rangeOfCharacterFromSet: invalidCharSet];
//            if(rangeOfInavlidChars.length !=0 || [string isEqualToString:@""])
//                return NO;
//        }
//        
//        NSString *domainPart = [email substringFromIndex:range1.location+1];
//        NSArray *stringsArray2 = [domainPart componentsSeparatedByString:@"."];
//        
//        for (NSString *string in stringsArray2) {
//            NSRange rangeOfInavlidChars=[string rangeOfCharacterFromSet:invalidCharSet];
//            if(rangeOfInavlidChars.length !=0 || [string isEqualToString:@""])
//                return NO;
//        }
//        
//        return YES;
//    }
//    else // no ''@'' or ''.'' present
//        return NO;
}

- (void)startSignup
{
    if (self.lastActiveField != nil)
    {
        [self.lastActiveField resignFirstResponder];
    }
    self.emailAccount = emailTextField.text;
    BOOL emailValid = !(emailAccount == nil || [emailAccount length] == 0);
	if(emailValid == YES){
		//NSRange foundRange = [emailAccount rangeOfCharacterFromSet:[NSCharacterSet characterSetWithCharactersInString:@"@."]];
		//if(foundRange.location == NSNotFound || foundRange.location == [emailAccount length] - 1 || foundRange.location == 0)
        if(![self validateEmail:emailAccount])
        {
			CustomAlertView *errorAlert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:@"请填写正确的电子邮件." otherButton:nil cancelButton:nil delegate:nil duration:2.0];
            [errorAlert show];
            [errorAlert release];
            return;
		}
	}
	else 
    {
        //pop Please input your Email as your account
        CustomAlertView *errorAlert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:@"请输入你的电子邮件." otherButton:nil cancelButton:nil delegate:nil duration:2.0];
        [errorAlert show];
        [errorAlert release];
        return;
    }
    self.password = passwordTextField.text;
    if (password == nil || [password length]<6)
    {
        //pop Password should have at least 6 characters.
        CustomAlertView *errorAlert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:@"密码最少应有6位." otherButton:nil cancelButton:nil delegate:nil duration:2.0];
        [errorAlert show];
        [errorAlert release];
        return;
    }
    self.name = firstnameTextField.text;
    if (self.name == nil || [self.name length] == 0)
    {
        //pop Please input your First Name
        CustomAlertView *errorAlert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:@"请输入你的真实姓名." otherButton:nil cancelButton:nil delegate:nil duration:2.0];
        [errorAlert show];
        [errorAlert release];
        return;
    }
    self.height = self.heightTextField.text;
    if (self.height == nil || [self.height length] == 0) 
    {
        CustomAlertView *errorAlert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:@"请选择你的学校." otherButton:nil cancelButton:nil delegate:nil duration:2.0];
        [errorAlert show];
        [errorAlert release];
        return;

    }
    self.inviteCode = self.codeTextField.text;
    if (self.inviteCode == nil || [self.inviteCode length] == 0)
    {
        CustomAlertView *errorAlert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:@"请输入邀请码." otherButton:nil cancelButton:nil delegate:nil duration:2.0];
        [errorAlert show];
        [errorAlert release];
        return;
    }
    if (self.gender == nil)
    {
        self.gender = @"female";
    }
    if (self.photoSelected == NO)
    {
        CustomAlertView *errorAlert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:@"请上传个人照片." otherButton:nil cancelButton:nil delegate:nil duration:2.0];
        [errorAlert show];
        [errorAlert release];
        return;
    }
    NSString * deviceUID = [[UIDevice currentDevice] uniqueIdentifier];
    NSDictionary *dict =[[NSDictionary alloc]initWithObjectsAndKeys:
                        deviceUID,@"deviceId",
                       self.emailAccount,@"emailAccount",
                       self.password,@"password",
                       self.name,@"name",
                       self.gender,@"gender",
                       self.height,@"school",
                       self.inviteCode,@"inviteCode",
                       @"iphone",@"deviceType",
                       nil];
;
    //NSDictionary *region = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyRegionData"];
    //NSLog(@"%@,%@,%@,%@,%@,%@",emailAccount,password,name,gender,height,inviteCode);
//    if([PrettyUtility isNull:region])
//    {
//        dict = [[NSDictionary alloc]initWithObjectsAndKeys:
//                              self.emailAccount,@"emailAccount",
//                              self.password,@"password",
//                              self.name,@"name",
//                              self.gender,@"gender",
//                              self.height,@"school",
//                              self.inviteCode,@"inviteCode",
//                              @"iphone",@"deviceType",
//                              nil];
//    }
//    else {
//        dict = [[NSDictionary alloc]initWithObjectsAndKeys:
//                self.emailAccount,@"emailAccount",
//                self.password,@"password",
//                self.name,@"name",
//                self.gender,@"gender",
//                self.height,@"school",
//                self.inviteCode,@"inviteCode",
//                @"iphone",@"deviceType",
//                region,@"region",
//                @"googleV3",@"geolibType",
//                [PrettyUtility getlatlng:region],@"latlng",
//                nil];
//    }
//    self.emailTextField.userInteractionEnabled = NO;
//    self.passwordTextField.userInteractionEnabled = NO;
//    self.firstnameTextField.userInteractionEnabled = NO;
//    self.heightTextField.userInteractionEnabled = NO;
//    self.codeTextField.userInteractionEnabled = NO;
    self.view.userInteractionEnabled = NO;
    [curConnection cancelDownload];
    [curConnection startDownload:[NodeAsyncConnection createHttpsRequest:@"/user/register" parameters:dict] :self :@selector(didEndSignup:)];
    [dict release];
    [self.activityIndicator startAnimating];
    self.activityIndicator.hidden = NO;
    [self.navigationItem.rightBarButtonItem setEnabled:NO];
}
- (void)didEndSignup:(NodeAsyncConnection *)connection
{
//    self.emailTextField.userInteractionEnabled = YES;
//    self.passwordTextField.userInteractionEnabled = YES;
//    self.firstnameTextField.userInteractionEnabled = YES;
//    self.heightTextField.userInteractionEnabled = YES;
//    self.codeTextField.userInteractionEnabled = YES;
    self.view.userInteractionEnabled = YES;
    [self.activityIndicator stopAnimating];
    self.activityIndicator.hidden = YES;
    [self.navigationItem.rightBarButtonItem setEnabled:YES];
    //NSLog(@"%@",connection.result);
    if (connection == nil || connection.result == nil)
    {
        return;
    }
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
    {
        NSDictionary *result = [connection.result objectForKey:@"result"];
        NSString *userId = [result objectForKey:@"userId"];
        //NSString *userCredit = [result objectForKey:@"credit"];
        [[NSUserDefaults standardUserDefaults] setObject:userId forKey:@"PrettyUserId"];
        [[NSUserDefaults standardUserDefaults] setObject:self.name forKey:@"PrettyUserName"];
        [[NSUserDefaults standardUserDefaults] setObject:self.gender forKey:@"PrettyUserGender"];
        //[[NSUserDefaults standardUserDefaults] setObject:userCredit forKey:@"PrettyUserCredit"];
        [[NSUserDefaults standardUserDefaults] setObject:self.emailAccount forKey:@"PrettyUserEmail"];
        [[NSUserDefaults standardUserDefaults] setObject:self.emailAccount forKey:@"PreUserEmail"];
        NSDictionary *userInfo =[[NSDictionary alloc]initWithObjectsAndKeys:userId,@"userId",self.name,@"name",self.gender,@"gender",self.height,@"school", nil];
        [[NSUserDefaults standardUserDefaults] setObject:userInfo forKey:@"PrettyUserInfo"];
        [userInfo release];
        //NSDate *today = [NSDate date];
        //[[NSUserDefaults standardUserDefaults]setObject:today forKey:@"PrettyLastSign"];
        //[[NSUserDefaults standardUserDefaults] setObject:[NSNumber numberWithBool:YES] forKey:@"PrettyShowTutorial"];
        [[NSUserDefaults standardUserDefaults]synchronize];
        [self.navigationController dismissModalViewControllerAnimated:YES];
        [[UIApplication sharedApplication] registerForRemoteNotificationTypes:UIRemoteNotificationTypeBadge | UIRemoteNotificationTypeAlert | UIRemoteNotificationTypeSound];
        //UIImage *newImage = [PrettyUtility correctImageOrientation:self.uploadImage :480];
        PrettyGlobalService *globalService = [PrettyGlobalService shareInstance];
        [globalService startUploadPhoto:self.uploadImage forPrimaryPhoto:YES];
         NNMainTabViewController *mainTabViewController = [[NNMainTabViewController alloc]init];
        //navigationViewController.naviAutoType = NaviAutoTypeNearbyDate;
        AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
        appDelegate.mainNavController.navigationBar.hidden = YES;
        [appDelegate.mainNavController setViewControllers:[NSArray arrayWithObject:mainTabViewController]];
        [mainTabViewController release];
    }
}
- (IBAction)doneButtonClicked
{
    //if ([self.heightTextField.text length]==0)
    //{
        //self.heightTextField.text = [self.schoolArray objectAtIndex:0];
    //}
    int current = [self.schoolPicker selectedRowInComponent:0];
    if (current>=0 && current < [self.schoolArray count])
    {
        self.heightTextField.text = [self.schoolArray objectAtIndex:current];
    }
    [self.heightTextField resignFirstResponder];
    [self.codeTextField becomeFirstResponder];

}
- (void)viewWillAppear:(BOOL)animated
{
    [MobClick beginLogPageView:@"SignUpView"];
//    UIView *titleView = [[UIView alloc]initWithFrame:CGRectMake(0, 0, 113, 26)];
//    UIImageView *imgView = [[UIImageView alloc]initWithFrame:CGRectMake(0, 0, 113, 26)];
//    [imgView setImage:[UIImage imageNamed:@"prettyrich-title.png"]];
//    [titleView addSubview:imgView];
//    self.navigationItem.titleView = titleView;
}
- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    // Return the number of sections.
    return 3;
}
- (CGFloat)tableView:(UITableView *)tableView heightForHeaderInSection:(NSInteger)section
{
    if (section == 1)
    {
        return 1;
    }
    return 5;
}
- (CGFloat)tableView:(UITableView *)tableView heightForFooterInSection:(NSInteger)section
{
    if (section == 1)
    {
    return 1;
    }

    return 5;
}
- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    // Return the number of rows in the section.
    
    if (section == 0)
        return 5;
    else
        return 1;
}
- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (indexPath.section == 0)
    {
        return 44.0;
    }
    else if(indexPath.section ==1)
    {
        return 34.0;
    }
    else
    return 80.0;
}
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (indexPath.section == 0)
    {
        if (indexPath.row == 0)
        {
            return self.emailCell;
        }
        else if (indexPath.row == 1)
        {
            return self.passwordCell;
        }
        else if (indexPath.row == 2)
        {
            return self.nameCell;
        }
        else if (indexPath.row == 3)
        {
            return self.schoolCell;
        }
        else
        {
            return self.inviteCell;
        }

    }
    else if (indexPath.section == 1)
    {

        return self.genderCell;
    }
    else
    {
        return self.photoCell;
    }
}

- (BOOL)textFieldShouldReturn:(UITextField *)textField
{
    [textField resignFirstResponder];
    if (textField.tag == 101)
    {   
        [passwordTextField becomeFirstResponder];
        return YES;            
    }
    else if(textField.tag == 102)
    {
        [firstnameTextField becomeFirstResponder];
        return YES; 
    }
    else if(textField.tag == 103)
    {
        [heightTextField becomeFirstResponder];
        return YES; 
    }
    else
    {
    [codeTextField resignFirstResponder];
    }
	
    return YES;
}
- (BOOL)textFieldShouldBeginEditing:(UITextField *)textField
{
    if(textField.tag == 104)
    {
        //[self setMyTreatOn];
        textField.inputAccessoryView = self.toolBar;
        textField.inputView = self.schoolPicker;
    }
        self.lastActiveField = textField;
    return YES;
}

- (BOOL)textField:(UITextField *)textField shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string
{
//    if (textField.tag == 104)
//    {
//
//        NSCharacterSet *cs;
//        cs = [[NSCharacterSet characterSetWithCharactersInString:kNumbers] invertedSet];
//        NSString *filtered =
//        [[string componentsSeparatedByCharactersInSet:cs] componentsJoinedByString:@""];
//        BOOL basic = [string isEqualToString:filtered];
//        if (basic) 
//        {
//            if ([string length]+[self.heightTextField.text length]>3)
//            {
//                return NO;
//            }
//
//            return YES;
//        }
//        else {
//            return NO;
//        }
//    }
    if(textField.tag == 103)
    {
        NSCharacterSet *cs;
        cs = [NSCharacterSet characterSetWithCharactersInString:@" "];
        NSString *filtered =
        [[string componentsSeparatedByCharactersInSet:cs] componentsJoinedByString:@""];
        BOOL basic = [string isEqualToString:filtered];
        return basic;
    }
    else {
        return YES;
    }
}
- (void)textDidChanged:(NSNotification *)notification
{
//    if ([self.heightTextField.text length]==0)
//    {
//        self.inchLabel.text = @"cm(5'10'')";
//        self.inchLabel.textColor = [UIColor lightGrayColor];
//    }
//    else {
//        self.inchLabel.text = [PrettyUtility convertIntToInch:[self.heightTextField.text intValue]];
//        self.inchLabel.textColor = [UIColor blackColor];
//    }
}
- (NSInteger)numberOfComponentsInPickerView:(UIPickerView *)pickerView
{
    return 1;
}
- (NSInteger)pickerView:(UIPickerView *)pickerView numberOfRowsInComponent:(NSInteger)component
{
        return [self.schoolArray count];
}
- (NSString *)pickerView:(UIPickerView *)pickerView titleForRow:(NSInteger)row forComponent:(NSInteger)component
{
        return [self.schoolArray objectAtIndex:row];
}
- (void)pickerView:(UIPickerView *)pickerView didSelectRow:(NSInteger)row inComponent:(NSInteger)component
{
    self.heightTextField.text =  [self.schoolArray objectAtIndex:row];
}

- (void)backButtonClicked
{
    [curConnection cancelDownload];
    [self.navigationController popViewControllerAnimated:YES];
}
- (void)keyboardWillShow:(NSNotification *)notification {
	
//    NSDictionary *userInfo = [notification userInfo];
//    NSValue *animationDurationValue = [userInfo objectForKey:UIKeyboardAnimationDurationUserInfoKey];
//    NSTimeInterval animationDuration;
//    [animationDurationValue getValue:&animationDuration];
//    
//    [UIView beginAnimations:nil context:NULL];
//    [UIView setAnimationDuration:animationDuration];
//   	self.backView.frame = CGRectMake(0, 0, 320, 290);
//    //self.backView.contentOffset = CGPointMake(0.0f,170);
//    [UIView commitAnimations];
//    CGRect keyboardBounds; 
//    [[notification.userInfo valueForKey:UIKeyboardFrameEndUserInfoKey] getValue: &keyboardBounds];
    NSDictionary* userInfo = [notification userInfo];
    NSValue *animationDurationValue = [userInfo objectForKey:UIKeyboardAnimationDurationUserInfoKey];
    NSTimeInterval animationDuration;
    [animationDurationValue getValue:&animationDuration];
    //CGFloat keyboardHeight = keyboardBounds.size.height;
    if (backViewSizeAdjusted == NO) 
    { 
        backViewSizeAdjusted = YES; 
        //CGRect frame = self.listView.frame;
        //frame.size.height -= keyboardHeight;
        [UIView beginAnimations:nil context:NULL]; 
        [UIView setAnimationBeginsFromCurrentState:YES]; 
        [UIView setAnimationDuration:animationDuration]; 
        self.listView.frame = CGRectMake(self.listView.frame.origin.x, self.listView.frame.origin.y,320 , 200);
        if (self.lastActiveField.tag == 104 || self.lastActiveField.tag == 105)
        {
            //self.listView.contentOffset = CGPointMake(0, 100);
            [self.listView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:3 inSection:0] atScrollPosition:UITableViewScrollPositionTop animated:YES];
        }
        [UIView commitAnimations];
    } 

}
- (void)keyboardWillHide:(NSNotification *)notification {
    
//    NSDictionary* userInfo = [notification userInfo];
//	NSValue *animationDurationValue = [userInfo objectForKey:UIKeyboardAnimationDurationUserInfoKey];
//    NSTimeInterval animationDuration;
//    [animationDurationValue getValue:&animationDuration];
//    
//    [UIView beginAnimations:nil context:NULL];
//    [UIView setAnimationDuration:animationDuration];
//    self.backView.frame = CGRectMake(0, 0, 320, 460);
//    [UIView commitAnimations];
//    CGRect keyboardBounds;
//    [[notification.userInfo valueForKey:UIKeyboardFrameEndUserInfoKey] getValue: &keyboardBounds];
    NSDictionary* userInfo = [notification userInfo];
    NSValue *animationDurationValue = [userInfo objectForKey:UIKeyboardAnimationDurationUserInfoKey];
    NSTimeInterval animationDuration;
    [animationDurationValue getValue:&animationDuration];
    //CGFloat keyboardHeight = keyboardBounds.size.height;
    if (backViewSizeAdjusted == YES) 
    { 
        backViewSizeAdjusted = NO; 
        //CGRect frame = self.listView.frame;
        //frame.size.height += keyboardHeight;
        [UIView beginAnimations:nil context:NULL]; 
        [UIView setAnimationBeginsFromCurrentState:YES]; 
        [UIView setAnimationDuration:animationDuration]; 
        self.listView.frame = CGRectMake(self.listView.frame.origin.x, self.listView.frame.origin.y,320 , 416);
        [UIView commitAnimations]; 
    } 

}
- (void)viewDidUnload
{
    [self setEmailTextField:nil];
    [self setPasswordTextField:nil];
    [self setFirstnameTextField:nil];
    [self setHeightTextField:nil];
    [self setFemaleButton:nil];
    [self setMaleButton:nil];
    [self setActivityIndicator:nil];
    [self setPhotoButton:nil];
    [self setPhotoImageView:nil];
    [self setCodeTextField:nil];
    [self setListView:nil];
    [self setEmailCell:nil];
    [self setPasswordCell:nil];
    [self setNameCell:nil];
    [self setSchoolCell:nil];
    [self setInviteCell:nil];
    [self setGenderCell:nil];
    [self setPhotoCell:nil];
    [self setSchoolPicker:nil];
    [self setToolBar:nil];
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    return (interfaceOrientation == UIInterfaceOrientationPortrait);
}
- (void)viewWillDisappear:(BOOL)animated
{
    [MobClick endLogPageView:@"SignUpView"];
    [curConnection cancelDownload];
}
- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillShowNotification object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillHideNotification object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UITextFieldTextDidChangeNotification object:nil];
    [emailTextField release];
    [passwordTextField release];
    [firstnameTextField release];
    [heightTextField release];
    [femaleButton release];
    [maleButton release];
    [activityIndicator release];
    [photoButton release];
    [curConnection cancelDownload];
    [curConnection release];
    [name release];
    [password release];
    [height release];
    [gender release];
    [inviteCode release];
    [emailAccount release];
    [lastActiveField release];
    [photoImageView release];
    [codeTextField release];
    [_listView release];
    [_emailCell release];
    [_passwordCell release];
    [_nameCell release];
    [_schoolCell release];
    [_inviteCell release];
    [_genderCell release];
    [_photoCell release];
    [_schoolPicker release];
    [_toolBar release];
    [schoolArray release];
    [super dealloc];
}
@end
