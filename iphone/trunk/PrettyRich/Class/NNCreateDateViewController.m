//
//  NNCreateDateViewController.m
//  PrettyRich
//
//  Created by liu miao on 10/19/12.
//
//

#import "NNCreateDateViewController.h"
#import "CustomAlertView.h"
#import "AppDelegate.h"
#import "PrettyUtility.h"
#define kNumbers     @"0123456789"
#import "MobClick.h"
@interface NNCreateDateViewController ()

@end

@implementation NNCreateDateViewController
@synthesize uploadImage,photoSelected;
@synthesize datePreViewViewController,flipItem,editVisible,datePicker;
@synthesize titleString,timeString,addressString,hasCountString,wantCountString,descripString,whoPayString,responderField,curConnection,selectedTopic,backViewSizeAdjusted;
@synthesize shareChecked;
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
    NNDatePreViewViewController *tempPreView = [[NNDatePreViewViewController alloc]initWithNibName:@"NNDatePreViewViewController" bundle:nil];
    self.datePreViewViewController = tempPreView;
    [tempPreView release];
    [self.navigationController.view setBackgroundColor:[UIColor blackColor]];
    self.navigationItem.title = @"发布活动";
    flipItem = [[UIBarButtonItem alloc]initWithTitle:@"预览" style:UIBarButtonItemStyleBordered target:self action:@selector(flipView)];
    self.navigationItem.rightBarButtonItem = flipItem;
    editVisible = YES;
    responderField = 0;
    NodeAsyncConnection * aConn = [[NodeAsyncConnection alloc] init];
	self.curConnection = aConn;
	[aConn release];
    srand((unsigned)time(0));
    int i = rand() %10;
    NSString *path = [[NSBundle mainBundle] pathForResource:[NSString stringWithFormat:@"dateDefaultImg%i",i] ofType:@"jpg"];
    self.uploadImage = [UIImage imageWithContentsOfFile:path];
    photoSelected = YES;
    if(self.uploadImage != nil)
    {
		[self.photoImageView setImage:self.uploadImage];
		self.photoSelected = YES;
	}
    if ([[Renren sharedRenren] isSessionValid])
    {
        self.shareChecked = YES;
        [self.renrenImage setImage:[UIImage imageNamed:@"share-checked.png"]];
    }
    else
    {
        self.shareChecked = NO;
        [self.renrenImage setImage:[UIImage imageNamed:@"share-unchecked.png"]];
    }
    backViewSizeAdjusted = NO;
    datePicker =  [[UIDatePicker alloc]init];
    self.desPlaceholderLabel.text = @"请填写活动细节, 吸引更多的同学来报名参加!";
    self.activityIndicator.hidden = YES;
    [datePicker setLocale:[[[NSLocale alloc] initWithLocaleIdentifier:@"zh_Hans"] autorelease]];
    [datePicker addTarget:self action:@selector(datePickerValueChanged) forControlEvents:UIControlEventValueChanged];
    self.titleTextField.tag = 201;
    self.timeTextField.tag = 202;
    self.addressTextFiled.tag = 203;
    self.hasCountTextField.tag = 204;
    self.wantCountTextField.tag = 205;
    self.descriptionTextView.tag = 206;
    if ([self.titleString length]!=0)
    {
        self.titleTextField.text = self.titleString;
    }
    if ([self.timeString length]!=0)
    {
        NSNumber *seconds = [NSNumber numberWithLongLong:[self.timeString longLongValue]];
        self.timeTextField.text = [PrettyUtility dateFromInterval:seconds];
    }
    else{
        self.timeString = @"";
        NSDateFormatter *formatter=[[NSDateFormatter alloc] init];
        [formatter setLocale:[[[NSLocale alloc] initWithLocaleIdentifier:@"zh_Hans"] autorelease]];
        [formatter setAMSymbol:@"上午"];
        [formatter setPMSymbol:@"下午"];
        [formatter setDateFormat:@"MM月dd日HH:mm"];
        //formatter.dateFormat = @"MMM dd h:mm a";
        NSDate *now = [NSDate date];
        self.timeTextField.placeholder = [formatter stringFromDate:now];
        [formatter release];

    }
    UIView *view = [[UIView alloc]init];
    [self.publishCell setBackgroundView:view];
    [view release];
    [self.publishCell setBackgroundColor:[UIColor clearColor]];
    if ([self.addressString length]!=0)
    {
        self.addressTextFiled.text = self.addressString;
    }
    if ([self.hasCountString length]!=0)
    {
        self.hasCountTextField.text = self.hasCountString;
    }
    if ([self.wantCountString length]!=0)
    {
        self.wantCountTextField.text = self.wantCountString;
    }
    if ([self.descripString length]!=0)
    {
        self.descriptionTextView.text = self.descripString;
    }
    if ([self.whoPayString length]!=0)
    {
        switch ([whoPayString intValue]) {
            case 0:
                [self.whoPaySegment setSelectedSegmentIndex:1];
                break;
            case 2:
                [self.whoPaySegment setSelectedSegmentIndex:0];
                break;
            case 3:
                [self.whoPaySegment setSelectedSegmentIndex:2];
                break;
            default:
                break;
        }
    }
    else
    {
        whoPayString = @"2";
        [self.whoPaySegment setSelectedSegmentIndex:0];
    }
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillShow:) name:UIKeyboardWillShowNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillHide:) name:UIKeyboardWillHideNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(textChanged:) name:UITextViewTextDidChangeNotification object:nil];
    //self.listView.hidden = YES;
}

- (void)textChanged:(NSNotification *)notification
{
    if([self.descriptionTextView.text length] == 0)
    {
        self.desPlaceholderLabel.alpha = 1;
    }
    else
    {
        self.desPlaceholderLabel.alpha = 0;
    }
}

- (void)keyboardWillHide:(NSNotification *)notification {
    
    NSDictionary* userInfo = [notification userInfo];
    NSValue *animationDurationValue = [userInfo objectForKey:UIKeyboardAnimationDurationUserInfoKey];
    NSTimeInterval animationDuration;
    [animationDurationValue getValue:&animationDuration];
    
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
    if (backViewSizeAdjusted == NO)
    {
        backViewSizeAdjusted = YES;
        //CGRect frame = self.listView.frame;
        //frame.size.height -= keyboardHeight;
        [UIView beginAnimations:nil context:NULL];
        [UIView setAnimationDuration:animationDuration];
        self.listView.frame = CGRectMake(0, 0, 320, 200);
        if (responderField == 202)
        {
            [self.listView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:0 inSection:1] atScrollPosition:UITableViewScrollPositionTop animated:YES];
        }
        else if (responderField == 203)
        {
            [self.listView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:1 inSection:1] atScrollPosition:UITableViewScrollPositionTop animated:YES];
        }
        else if (responderField == 204)
        {
            [self.listView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:2 inSection:1] atScrollPosition:UITableViewScrollPositionTop animated:YES];
        }
        else if (responderField == 205)
        {
            //self.listView.contentOffset = CGPointMake(0, 170);
            [self.listView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:3 inSection:1] atScrollPosition:UITableViewScrollPositionTop animated:YES];
        }
        else if (responderField == 206)
        {
            //self.listView.contentOffset = CGPointMake(0,230);
            [self.listView scrollToRowAtIndexPath:[NSIndexPath indexPathForRow:5 inSection:1] atScrollPosition:UITableViewScrollPositionTop animated:YES];
        }
        //self.listView.frame = frame;
        [UIView commitAnimations];
    }
}

- (IBAction)startDatePost
{
    self.hasCountString = self.hasCountTextField.text;
    self.wantCountString = self.wantCountTextField.text;
    if ([self.timeString isEqualToString:@""])
    {
        CustomAlertView *warningAlert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 320) messgage:@"请说明活动时间" otherButton:nil cancelButton:nil delegate:nil duration:2.0];
        [warningAlert show];
        [warningAlert release];
        return;
    }
    NSNumber *seconds = [NSNumber numberWithLongLong:[self.timeString longLongValue]];
    if ([PrettyUtility isPastTime:seconds])
    {
        CustomAlertView *warningAlert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 320) messgage:@"请选择一个未来的活动时间" otherButton:nil cancelButton:nil delegate:nil duration:2.0];
        [warningAlert show];
        [warningAlert release];
        return;
    }
    self.descripString = [self.descriptionTextView.text stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
    if ([self.descripString length]==0)
    {
        CustomAlertView *warningAlert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 320) messgage:@"请说明活动详情" otherButton:nil cancelButton:nil delegate:nil duration:2.0];
        [warningAlert show];
        [warningAlert release];
        self.descriptionTextView.text = @"";
        //self.placeHolderLabel.alpha = 1;
        return;
    }
    self.titleString = [self.titleTextField.text stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
    if ([self.titleString length]==0)
    {
        CustomAlertView *warningAlert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 320) messgage:@"请说明活动主题" otherButton:nil cancelButton:nil delegate:nil duration:2.0];
        [warningAlert show];
        [warningAlert release];
        self.titleTextField.text = @"";
        return;
    }
    self.addressString = [self.addressTextFiled.text stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
    if ([self.addressString length]==0)
    {
        CustomAlertView *warningAlert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 320) messgage:@"请说明活动地点" otherButton:nil cancelButton:nil delegate:nil duration:2.0];
        [warningAlert show];
        [warningAlert release];
        self.addressTextFiled.text = @"";
        return;
    }
    if ([self.wantCountString length]==0)
    {
        CustomAlertView *warningAlert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 320) messgage:@"请说明邀请的人数" otherButton:nil cancelButton:nil delegate:nil duration:2.0];
        [warningAlert show];
        [warningAlert release];
        return;
    }
    if ([self.hasCountString length]==0)
    {
        CustomAlertView *warningAlert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 320) messgage:@"请说明已有的人数" otherButton:nil cancelButton:nil delegate:nil duration:2.0];
        [warningAlert show];
        [warningAlert release];
        return;
    }
    NSString *userId = [[NSUserDefaults standardUserDefaults] objectForKey:@"PrettyUserId"];
    if (self.photoSelected)
    {
        //NSLog(@"time %@",self.timeString);
        NSData *imageData = UIImageJPEGRepresentation(self.uploadImage, 0.6);
        NSDictionary *dict = [[NSDictionary alloc]initWithObjectsAndKeys:
                              userId,@"userId",
                              self.timeString,@"dateDate",
                              self.descripString,@"description",
                              self.whoPayString,@"whoPay",
                              self.titleString,@"title",
                              self.addressString,@"address",
                              self.wantCountString,@"wantPersonCount",
                              self.hasCountString,@"existPersonCount",
                              imageData,@"image",
                              [NSNumber numberWithFloat:uploadImage.size.width],@"width",
                              [NSNumber numberWithFloat:uploadImage.size.height],@"height",
                              nil];
        [curConnection cancelDownload];
        [curConnection startDownload:[NodeAsyncConnection createUploadPhotoRequest:@"/user/createDateWithPhoto" parameters:dict] :self :@selector(didEndDatePost:)];
        [dict release];

    }
    else
    {
        //NSLog(@"time %@",self.timeString);
        NSDictionary *dict = [[NSDictionary alloc]initWithObjectsAndKeys:
                              userId,@"userId",
                              self.timeString,@"dateDate",
                              self.descripString,@"description",
                              self.whoPayString,@"whoPay",
                              self.titleString,@"title",
                              self.addressString,@"address",
                              self.wantCountString,@"wantPersonCount",
                              self.hasCountString,@"existPersonCount",
                              nil];
        [curConnection cancelDownload];
        [curConnection startDownload:[NodeAsyncConnection createNodeHttpRequest:@"/user/createDateWithPhoto" parameters:dict] :self :@selector(didEndDatePost:)];
        [dict release];

    }
    [self.activityIndicator startAnimating];
    self.activityIndicator.hidden = NO;
    self.view.userInteractionEnabled = NO;
}
-(void)viewWillAppear:(BOOL)animated
{
    [MobClick beginLogPageView:@"CreateDateView"];
    if (self.selectedTopic != nil)
    {
        self.titleTextField.text = self.selectedTopic;
        self.selectedTopic =nil;
    }
}
- (void)viewWillDisappear:(BOOL)animated
{
    [MobClick endLogPageView:@"CreateDateView"];
}
- (void)didEndDatePost:(NodeAsyncConnection *)connection
{
    self.activityIndicator.hidden = YES;
    [self.activityIndicator stopAnimating];
    self.view.userInteractionEnabled = YES;
    if (connection == nil ||connection.result == nil) {
        return;
    }
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
    {
        //[[NSNotificationCenter defaultCenter] postNotificationName:@"CreateDateNotification" object:nil];
        [self.navigationController popViewControllerAnimated:YES];
    }
}

- (BOOL)textField:(UITextField *)textField
shouldChangeCharactersInRange:(NSRange)range
replacementString:(NSString *)string
{
    if (textField.tag == 204 || textField.tag == 205)
    {
        NSCharacterSet *cs;
        cs = [[NSCharacterSet characterSetWithCharactersInString:kNumbers] invertedSet];
        NSString *filtered =
        [[string componentsSeparatedByCharactersInSet:cs] componentsJoinedByString:@""];
        BOOL basic = [string isEqualToString:filtered];
        if (basic)
        {
            if ([string length]+[textField.text length]>2)
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
- (BOOL)textFieldShouldBeginEditing:(UITextField *)textField
{
    if (textField.tag == 202)
    {
        self.datePicker.datePickerMode = UIDatePickerModeDateAndTime;
        //self.datePicker.date = self.datePicker.date;
        NSDateFormatter *formatter=[[NSDateFormatter alloc] init];
        [formatter setLocale:[[[NSLocale alloc] initWithLocaleIdentifier:@"zh_Hans"] autorelease]];
        [formatter setAMSymbol:@"上午"];
        [formatter setPMSymbol:@"下午"];
        [formatter setDateFormat:@"MM月dd日HH:mm"];
        self.timeTextField.placeholder = [formatter stringFromDate:self.datePicker.date];
        [formatter release];
        self.datePicker.minimumDate = [NSDate date];
        self.datePicker.minuteInterval = 30;
        //textField.text = @"";
        textField.inputView = self.datePicker;
        textField.inputAccessoryView = self.toolBar;
    }
    else if (textField.tag == 204 ||textField.tag == 205)
    {
        textField.inputAccessoryView = self.toolBar;
    }
    responderField = textField.tag;
    return YES;
}
- (BOOL)textFieldShouldReturn:(UITextField *)textField
{
    [textField resignFirstResponder];
    if (textField.tag == 201)
    {
        [self.timeTextField becomeFirstResponder];
        return YES;
    }
    else if (textField.tag == 202)
    {
        [self.addressTextFiled becomeFirstResponder];
        return YES;
    }
    else if (textField.tag == 203)
    {
        [self.hasCountTextField becomeFirstResponder];
        return YES;
    }
    else if(textField.tag == 204)
    {
        [self.wantCountTextField becomeFirstResponder];
        return YES;
    }
    else if (textField.tag == 205)
    {
        [self.descriptionTextView becomeFirstResponder];
        return YES;
    }
    //[self.wantCountTextField resignFirstResponder];
    return YES;
}
- (BOOL)textViewShouldBeginEditing:(UITextView *)textView
{
    if (textView.tag == 206)
    {
        textView.inputAccessoryView = self.toolbar1;
    }
    responderField = textView.tag;
    return YES;
}
- (IBAction)doneButtonClicked
{
    if (responderField == 202)
    {
        NSDateFormatter *formatter=[[NSDateFormatter alloc] init];
        [formatter setLocale:[[[NSLocale alloc] initWithLocaleIdentifier:@"zh_Hans"] autorelease]];
        //formatter.dateFormat = @"MMM dd',' h:mma";
        [formatter setAMSymbol:@"上午"];
        [formatter setPMSymbol:@"下午"];
        [formatter setDateFormat:@"MM月dd日HH:mm"];
        //formatter.dateFormat = @"MMM dd h:mm a";
        [self.timeTextField resignFirstResponder];
        self.timeTextField.text = [formatter stringFromDate:self.datePicker.date];
        [formatter release];
        
        NSTimeInterval howRecent = [self.datePicker.date timeIntervalSince1970];
        self.timeString = [NSString stringWithFormat:@"%d000",(int)howRecent];
        //NSLog(@"time %@",self.timeString);
        [self.addressTextFiled becomeFirstResponder];
    }
    else if(responderField == 204)
    {
        [self.hasCountTextField resignFirstResponder];
        [self.wantCountTextField becomeFirstResponder];
    }
    else if(responderField == 205)
    {
        [self.wantCountTextField resignFirstResponder];
        [self.descriptionTextView becomeFirstResponder];
    }
    else if(responderField == 206)
    {
        [self.descriptionTextView resignFirstResponder];
        responderField = 0;
    }
}
-(void)datePickerValueChanged
{
    NSDateFormatter *formatter=[[NSDateFormatter alloc] init];
    [formatter setLocale:[[[NSLocale alloc] initWithLocaleIdentifier:@"zh_Hans"] autorelease]];
    //formatter.dateFormat = @"MMM dd',' h:mma";
    [formatter setAMSymbol:@"上午"];
    [formatter setPMSymbol:@"下午"];
    [formatter setDateFormat:@"MM月dd日HH:mm"];
    //NSLog(@"%@",[self.datePicker.date description]);
    //formatter.dateFormat = @"MMM dd h:mm a";
    self.timeTextField.text = [formatter stringFromDate:self.datePicker.date];
    [formatter release];
    NSTimeInterval howRecent = [self.datePicker.date timeIntervalSince1970];
    self.timeString = [NSString stringWithFormat:@"%d000",(int)howRecent];

}
- (IBAction)cancelButtonClicked
{
    if (responderField == 202)
    {
        self.timeString = @"";
        [self.timeTextField resignFirstResponder];
    }
    else if(responderField == 206)
    {
        [self.descriptionTextView resignFirstResponder];
        self.descriptionTextView.text = @"";
        self.desPlaceholderLabel.alpha = 1;
    }
    responderField = 0;
}

-(IBAction)segmentSelected:(id)sender
{
    UISegmentedControl *myUISegmentedControl=(UISegmentedControl *)sender;
    switch (myUISegmentedControl.selectedSegmentIndex)
    {
        case 0:
            self.whoPayString = @"2";
            break;
        case 1:
            self.whoPayString = @"0";
            break;
        case 2:
            self.whoPayString = @"3";
            break;
        default:
            break;

    }
}
-(void)flipView
{
    // disable user interaction during the flip
    
    self.view.userInteractionEnabled = NO;
    responderField = 0;
    // setup the animation group and creates it
    [UIView beginAnimations:nil context:nil];
    [UIView setAnimationDuration:0.5];
    [UIView setAnimationDelegate:self];
    [UIView setAnimationDidStopSelector:@selector(flipViewsAnimationStop:finished:context:)];
    
    if (editVisible){
        
        // If view one is visible, hides it and add the new one with the "Flip" style transition
        [UIView setAnimationTransition:UIViewAnimationTransitionFlipFromRight forView:self.view cache:YES];
        
        [self.listView removeFromSuperview];
        [self.view addSubview:datePreViewViewController.view];
        [self.view bringSubviewToFront:self.activityIndicator];
        
    } else {
        
        // If the view two is visible, hides it and display the one with the "Flip" transition.
        
        [UIView setAnimationTransition:UIViewAnimationTransitionFlipFromLeft forView:self.view cache:YES];
        
        [datePreViewViewController.view removeFromSuperview];
        [self.view addSubview:self.listView];
        [self.view bringSubviewToFront:self.activityIndicator];
        
    }
    
    // Commit animations to show the effect
    [UIView commitAnimations];
    if (editVisible)
    {
        self.titleString = self.titleTextField.text;
        self.addressString = self.addressTextFiled.text;
        self.hasCountString = self.hasCountTextField.text;
        self.wantCountString = self.wantCountTextField.text;
        self.descripString = self.descriptionTextView.text;
        NSDictionary *dateInfo = [[NSDictionary alloc]initWithObjectsAndKeys:self.titleString,@"title",
                                  self.timeString,@"dateDate",
                                  self.addressString,@"address",
                                  self.hasCountString,@"existPersonCount",
                                  self.wantCountString,@"wantPersonCount",
                                  self.descripString,@"description",
                                  self.whoPayString,@"whoPay",
                                  nil];
        if (self.photoSelected)
        {
            [datePreViewViewController displayDate:dateInfo withSelectedPhoto:self.uploadImage];
        }
        else
        {
            [datePreViewViewController displayDate:dateInfo withSelectedPhoto:nil];
        }
        [dateInfo release];

    }
    
    // Register the current visible view
    editVisible = !editVisible;
    
    flipItem.title = editVisible ? @"预览" : @"编辑";
    
    
}
- (void)flipViewsAnimationStop:(NSString *)animationID finished:(NSNumber *)finished context:(void *)context {
    
    self.view.userInteractionEnabled = YES;
    
}

- (IBAction) uploadPhotoClicked
{
    self.titleString = self.titleTextField.text;
    self.addressString = self.addressTextFiled.text;
    self.hasCountString = self.hasCountTextField.text;
    self.wantCountString = self.wantCountTextField.text;
    self.descripString = self.descriptionTextView.text;

	if ([UIImagePickerController isSourceTypeAvailable:UIImagePickerControllerSourceTypeCamera])
    {
        UIActionSheet *actionSheet;
        actionSheet = [[UIActionSheet alloc] initWithTitle:@"" delegate:self cancelButtonTitle:@"取消" destructiveButtonTitle:nil otherButtonTitles:@"拍摄一张", @"从相册选择", nil];
        //AppDelegate *appDelegate = [[UIApplication sharedApplication] delegate];
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


#pragma -mark ImagePickerDelegate
- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker
{
//    UIImage *gradientImage44 = [[UIImage imageNamed:@"top-bar-pretty-rich.png"]
//                                resizableImageWithCapInsets:UIEdgeInsetsMake(0, 0, 0, 0)];
//    
//    // Set the background image for *all* UINavigationBars
//    [[UINavigationBar appearance] setBackgroundImage:gradientImage44
//                                       forBarMetrics:UIBarMetricsDefault];
    
    [picker dismissModalViewControllerAnimated:YES];
    [[UIApplication sharedApplication]setStatusBarStyle:UIStatusBarStyleBlackOpaque];
}
- (void)imagePickerController:(UIImagePickerController *)picker
        didFinishPickingImage:(UIImage *)image
                  editingInfo:(NSDictionary *)editingInfo
{
    
    [picker dismissModalViewControllerAnimated:YES];
    [[UIApplication sharedApplication]setStatusBarStyle:UIStatusBarStyleBlackOpaque];
    [NSThread detachNewThreadSelector:@selector(useImage:) toTarget:self withObject:image];
    
}
- (void)useImage:(UIImage *)image
{
    self.uploadImage = [PrettyUtility correctImageOrientation:image :480];
    self.photoSelected = YES;
    [self.photoImageView setImage:self.uploadImage];
}

//- (void)imagePickerController:(UIImagePickerController *)picker
//        didFinishPickingImage:(UIImage *)image
//                  editingInfo:(NSDictionary *)editingInfo
//{
//    [[picker parentViewController] dismissModalViewControllerAnimated:YES];
//    [[UIApplication sharedApplication]setStatusBarStyle:UIStatusBarStyleBlackOpaque];
//    self.uploadImage = [PrettyUtility correctImageOrientation:image :960];
//    self.photoSelected = YES;
//    [self.photoImageView setImage:self.uploadImage];
//}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}
- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    // Return the number of sections.
    return 5;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    // Return the number of rows in the section.
    
    if (section == 0)
        return 1;
    else if (section == 1)
        return 6;
    else if (section == 2)
        return 1;
    else
        return 1;
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
    
    if ([indexPath section] == 0)
        return 44.0;
    else if ([indexPath section] == 1) {
        
        if ([indexPath row] == 5)
            return 90.0;
        else
            return 44.0;
    }else if ([indexPath section] == 2) {
        return 70.0;
    }
    else
        return 44.0;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    
    if (indexPath.section == 0)
    {
        return self.titleCell;
    }
    else if (indexPath.section == 1)
    {
        if (indexPath.row == 0)
        {
            return self.timeCell;
        }
        else if (indexPath.row == 1)
        {
            return self.addressCell;
        }
        else if (indexPath.row == 2)
        {
            return self.hasCountCell;
        }
        else if (indexPath.row == 3)
        {
            return self.wantCountCell;
        }
        else if (indexPath.row == 4)
        {
            return self.whoPayCell;
        }
        else
        {
            return self.descriptionCell;
        }
        
    }
    else if(indexPath.section == 2)
    {
        //UIView *tempView = [[[UIView alloc] init] autorelease];
        //[self.photoUploadCell setBackgroundView:tempView];
        //[self.photoUploadCell setBackgroundColor:[UIColor clearColor]];
        return self.photoUploadCell;
    }
    else if(indexPath.section == 3)
    {
        return self.publishCell;
    }
    else
    {
        return self.renrenCell;
    }
}
- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (indexPath.section == 4)
    {
        [self changeShareStatus];
    }
    [tableView deselectRowAtIndexPath:indexPath animated:YES];
}
-(void)changeShareStatus
{
    if ([[Renren sharedRenren]isSessionValid])
    {
        if(self.shareChecked)
        {
            self.shareChecked = NO;
            [self.renrenImage setImage:[UIImage imageNamed:@"share-unchecked.png"]];
        }
        else
        {
            self.shareChecked = YES;
            [self.renrenImage setImage:[UIImage imageNamed:@"share-checked.png"]];
        }
    }
    else
    {
        NSArray *permissions = [NSArray arrayWithObjects:@"read_user_album",@"status_update",@"photo_upload",@"publish_feed",@"create_album",@"operate_like",nil];
        [[Renren sharedRenren] authorizationInNavigationWithPermisson:permissions andDelegate:self];
    }
}
#pragma mark - RenrenDelegate methods

-(void)renrenDidLogin:(Renren *)renren
{
    self.shareChecked = YES;
    [self.renrenImage setImage:[UIImage imageNamed:@"share-checked.png"]];
}
- (void)renren:(Renren *)renren loginFailWithError:(ROError*)error{
	NSString *title = [NSString stringWithFormat:@"Error code:%d", [error code]];
	NSString *description = [NSString stringWithFormat:@"%@", [error localizedDescription]];
	NSLog(@"loginfail:%@ %@",title,description);
}
- (void)renren:(Renren *)renren requestDidReturnResponse:(ROResponse*)response
{
    [self.activityIndicator stopAnimating];
    self.activityIndicator.hidden = YES;
    self.view.userInteractionEnabled = YES;
	NSArray *usersInfo = (NSArray *)(response.rootObject);
	NSString *outText = [NSString stringWithFormat:@""];
	
	for (ROUserResponseItem *item in usersInfo) {
		outText = [outText stringByAppendingFormat:@"UserID:%@\n Name:%@\n Sex:%@\n Birthday:%@\n HeadURL:%@\n",item.userId,item.name,item.sex,item.brithday,item.headUrl];
	}
    NSLog(@"%@",outText);
}
- (void)renren:(Renren *)renren requestFailWithError:(ROError*)error
{
    [self.activityIndicator stopAnimating];
    self.activityIndicator.hidden = YES;
    self.view.userInteractionEnabled = YES;
	NSString *title = [NSString stringWithFormat:@"Error code:%d", [error code]];
	NSString *description = [NSString stringWithFormat:@"%@", [error.userInfo objectForKey:@"error_msg"]];
	NSLog(@"loginfail:%@ %@",title,description);
}

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillShowNotification object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillHideNotification object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UITextViewTextDidChangeNotification object:nil];
    //[curConnection cancelDownload];
    [curConnection release];
    [selectedTopic release];
    [_titleCell release];
    [_timeCell release];
    [_addressCell release];
    [_hasCountCell release];
    [_wantCountCell release];
    [_whoPayCell release];
    [_descriptionCell release];
    [_photoUploadCell release];
    [_publishCell release];
    [_listView release];
    [_titleTextField release];
    [_timeTextField release];
    [_addressTextFiled release];
    [_hasCountTextField release];
    [_wantCountTextField release];
    [_whoPaySegment release];
    [_descriptionTextView release];
    [_uploadPhotoButton release];
    [_photoImageView release];
    [uploadImage release];
    [datePreViewViewController release];
    [flipItem release];
    [datePicker release];
    [titleString release];
    [timeString release];
    [addressString release];
    [hasCountString release];
    [wantCountString release];
    [descripString release];
    [_toolBar release];
    [whoPayString release];
    [_desPlaceholderLabel release];
    [_activityIndicator release];
    [_toolbar1 release];
    [_renrenCell release];
    [_renrenImage release];
    [super dealloc];
}
- (void)viewDidUnload {
    [self setTitleCell:nil];
    [self setTimeCell:nil];
    [self setAddressCell:nil];
    [self setHasCountCell:nil];
    [self setWantCountCell:nil];
    [self setWhoPayCell:nil];
    [self setDescriptionCell:nil];
    [self setPhotoUploadCell:nil];
    [self setPublishCell:nil];
    [self setListView:nil];
    [self setTitleTextField:nil];
    [self setTimeTextField:nil];
    [self setAddressTextFiled:nil];
    [self setHasCountTextField:nil];
    [self setWantCountTextField:nil];
    [self setWhoPaySegment:nil];
    [self setDescriptionTextView:nil];
    [self setUploadPhotoButton:nil];
    [self setPhotoImageView:nil];
    [self setToolBar:nil];
    [self setDesPlaceholderLabel:nil];
    [self setActivityIndicator:nil];
    [self setToolbar1:nil];
    [self setRenrenCell:nil];
    [self setRenrenImage:nil];
    [super viewDidUnload];
}
@end
