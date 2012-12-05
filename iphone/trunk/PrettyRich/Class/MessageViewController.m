//
//  MessageViewController.m
//  PrettyRich
//
//  Created by miao liu on 5/16/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "MessageViewController.h"
#import "AppDelegate.h"
#import "PrettyUtility.h"
#import "NewMessageCell.h"
#import "MessageUIView.h"
#import "MobClick.h"
@interface MessageViewController ()

@end

@implementation MessageViewController
@synthesize chatBGView;
@synthesize isSenderConfirmed;
@synthesize messageListView,bottomView,contentArray,targetId,dateId,isFirstLoad,messageViewType,imageDownloadManager,dateDict,curConnection,isLoadingEarlier,refreshHeaderView,messageOption,confirmState,speakerInfo,operationSendMessageQueue,operationGetMessageQueue,targetInfoIndex,targetName,targetUrl,latestMessageDict,textView,keyBoardIsUp,isPresentView,chatPlaceHolder;

- (void)viewDidLoad
{
    [super viewDidLoad];

//    UIView *paddingView1 = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 10, 25)];
//    self.chatTextField.leftView = paddingView1;    
//    self.chatTextField.leftViewMode = UITextFieldViewModeAlways;
//    [paddingView1 release];
//    UIView *paddingView2 = [[UIView alloc] initWithFrame:CGRectMake(0, 0, 10, 25)];
//    self.chatTextField.rightView = paddingView2;
//    self.chatTextField.rightViewMode = UITextFieldViewModeAlways;
//    [paddingView2 release];
    //[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(textChanged:) name:UITextFieldTextDidChangeNotification object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillShow:) name:UIKeyboardWillShowNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(keyboardWillHide:) name:UIKeyboardWillHideNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(textChanged:) name:UITextViewTextDidChangeNotification object:nil];
//    [self.sendButton addTarget:self action:@selector(sendButtonClicked) forControlEvents:UIControlEventTouchUpInside];
//    [self.sendButton setTitle:@"发送" forState:UIControlStateNormal];
    contentArray = [[NSMutableArray alloc]init];
    self.isFirstLoad = YES;
    imageDownloadManager = [[ImagesDownloadManager alloc] init];
    imageDownloadManager.imageDownloadDelegate = self;
    NodeAsyncConnection * aConn = [[NodeAsyncConnection alloc] init];
	self.curConnection = aConn;
	[aConn release];
    refreshHeaderView = [[EGORefreshTableHeaderView alloc] initWithFrame:CGRectMake(0.0f,  -REFRESHINGVIEW_HEIGHT, self.messageListView.frame.size.width,REFRESHINGVIEW_HEIGHT)];
    [self.messageListView addSubview:self.refreshHeaderView];
    self.refreshHeaderView.refreshType = RefreshTypeMessage;
    self.refreshHeaderView.delegate = self;
    self.isLoadingEarlier = NO;
    NSString *userId = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserId"];
    self.activityIndicator.hidden = YES;
    NSMutableDictionary *option = [[NSMutableDictionary alloc]initWithObjectsAndKeys:userId,@"userId",dateId,@"dateId",targetId,@"targetUserId",@"20",@"count",@"",@"cutOffTime", nil];
    self.messageOption = option;
    [option release];
    self.topNavigationItem.title = targetName;
    //self.topNavigationItem.leftItemsSupplementBackButton = YES;
    //self.topNavigationItem.hidesBackButton = NO;
    //self.topNavigationItem.backBarButtonItem = self.backButton;
    operationSendMessageQueue = [[NSOperationQueue alloc] init];
	[operationSendMessageQueue setMaxConcurrentOperationCount:1];
    operationGetMessageQueue = [[NSOperationQueue alloc] init];
	[operationGetMessageQueue setMaxConcurrentOperationCount:1];
//    self.sendButton.enabled = NO;
    if (isPresentView)
    {
        self.topNavigationItem.rightBarButtonItem = nil;
    }
    else
    {
        if(self.messageViewType == MessageViewTypeSender)
        {
            if (confirmState == confirmStateNotPast)
            {
                if (isSenderConfirmed)
                {
                    self.topNavigationItem.rightBarButtonItem = self.disqualificationButton;
                }
                else
                {
                    self.topNavigationItem.rightBarButtonItem = self.approveButton;
                }
            }
            else if (confirmState == confirmStatePastNotRate)
            {
                
                if (isSenderConfirmed)
                {
                    self.topNavigationItem.rightBarButtonItem = self.rateButton;
                }
                else
                {
                    self.topNavigationItem.rightBarButtonItem = nil;
                }

            }
            else
            {
                if (isSenderConfirmed)
                {
                    self.topNavigationItem.rightBarButtonItem = self.rateButton;
                    [self.topNavigationItem.rightBarButtonItem setEnabled:NO];
                }
                else
                {
                    self.topNavigationItem.rightBarButtonItem = nil;
                }
                
            }
        }
        else if (self.messageViewType == MessageViewTypeInvited)
        {
    //self.textView =  c;
            if (confirmState == confirmStateNotPast)
            {
                self.topNavigationItem.rightBarButtonItem = self.rateButton;
                [self.topNavigationItem.rightBarButtonItem setEnabled:NO];
            }
            else if (confirmState == confirmStatePastNotRate)
            {
                self.topNavigationItem.rightBarButtonItem = self.rateButton;
            }
            else
            {
                self.topNavigationItem.rightBarButtonItem = self.rateButton;
                [self.topNavigationItem.rightBarButtonItem setEnabled:NO];
            }

        }
        else
        {
            //self.chatTextField.placeholder = @"聊天以了解详细活动安排...";
            self.topNavigationItem.rightBarButtonItem = nil;
        }
    }
    [self initialBottomView];
}
- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event
{
    //set down the keyboard
	UITouch *touch;
	touch = [touches anyObject];
	CGPoint point = [touch locationInView:self.view];
	CGRect rect = messageListView.frame;
	if (keyBoardIsUp == YES && CGRectContainsPoint(rect, point) && point.y < bottomView.frame.origin.y)
	{
		[self.textView resignFirstResponder];
	}
}
- (void)textChanged:(NSNotification *)notification
{
    if ([self.textView.text length]!= 0)
    {
        self.chatPlaceHolder.alpha = 0;
    }
    else
    {
        self.chatPlaceHolder.alpha = 1;
    }
}

- (void)initialBottomView
{
	bottomView = [[UIView alloc] initWithFrame:CGRectMake(0, self.view.frame.size.height - 40, 320, 40)];
	[self.view addSubview:bottomView];
	textView = [[HPGrowingTextView alloc] initWithFrame:CGRectMake(6, 3, 240, 40)];
    textView.contentInset = UIEdgeInsetsMake(0, 5, 0, 5);
    
	textView.minNumberOfLines = 1;
	textView.maxNumberOfLines = 5;
	textView.returnKeyType = UIReturnKeyDefault;
	textView.font = [UIFont systemFontOfSize:15.0];
	textView.delegate = self;
    textView.internalTextView.scrollIndicatorInsets = UIEdgeInsetsMake(5, 0, 5, 0);
    textView.internalTextView.alwaysBounceVertical = YES;
    textView.backgroundColor = [UIColor whiteColor];
	
	UIImage *rawEntryBackground = [UIImage imageNamed:@"MessageEntryInputField.png"];
    UIImage *entryBackground = [rawEntryBackground stretchableImageWithLeftCapWidth:13 topCapHeight:22];
    UIImageView *entryImageView = [[[UIImageView alloc] initWithImage:entryBackground] autorelease];
    entryImageView.frame = CGRectMake(5, 0, 248, 40);
    entryImageView.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
	
    UIImage *rawBackground = [UIImage imageNamed:@"MessageEntryBackground.png"];
    UIImage *background = [rawBackground stretchableImageWithLeftCapWidth:13 topCapHeight:22];
    UIImageView *imageView = [[[UIImageView alloc] initWithImage:background] autorelease];
    imageView.frame = CGRectMake(0, 0, bottomView.frame.size.width, bottomView.frame.size.height);
    imageView.autoresizingMask = UIViewAutoresizingFlexibleHeight | UIViewAutoresizingFlexibleWidth;
	
	UIImage *sendBtnBackground = [[UIImage imageNamed:@"NNsend-button.png"] stretchableImageWithLeftCapWidth:13 topCapHeight:0];
    //UIImage *selectedSendBtnBackground = [[UIImage imageNamed:@"MessageEntrySendButtonPressed.png"] stretchableImageWithLeftCapWidth:13 topCapHeight:0];
    
	UIButton *doneBtn = [UIButton buttonWithType:UIButtonTypeCustom];
	doneBtn.frame = CGRectMake(bottomView.frame.size.width - 66,8, 59, 26);
    doneBtn.autoresizingMask = UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleLeftMargin;
	[doneBtn setTitle:@"发送" forState:UIControlStateNormal];
    doneBtn.titleLabel.lineBreakMode = UILineBreakModeTailTruncation;
    [doneBtn setTitleShadowColor:[UIColor colorWithWhite:0 alpha:0.4] forState:UIControlStateNormal];
    doneBtn.titleLabel.shadowOffset = CGSizeMake (0.0, -1.0);
    doneBtn.titleLabel.font = [UIFont boldSystemFontOfSize:14.0f];
    
    [doneBtn setTitleColor:[UIColor whiteColor] forState:UIControlStateNormal];
	[doneBtn addTarget:self action:@selector(sendButtonClicked) forControlEvents:UIControlEventTouchUpInside];
    [doneBtn setBackgroundImage:sendBtnBackground forState:UIControlStateNormal];
    //[doneBtn setBackgroundImage:selectedSendBtnBackground forState:UIControlStateSelected];
	
    textView.autoresizingMask = UIViewAutoresizingFlexibleWidth;
    chatPlaceHolder = [[UILabel alloc]initWithFrame:CGRectMake(19, 10, 220, 20)];
    chatPlaceHolder.textColor = [UIColor lightGrayColor];
    chatPlaceHolder.backgroundColor = [UIColor clearColor];
    chatPlaceHolder.font = [UIFont systemFontOfSize:15.0];
    if(self.messageViewType == MessageViewTypeSender)
    {
        chatPlaceHolder.text = @"";
        chatPlaceHolder.alpha = 0;
    }
    else
    {
        chatPlaceHolder.text = @"聊天以了解详细活动安排...";
        chatPlaceHolder.alpha = 1;
    }
	[bottomView addSubview:imageView];
    [bottomView addSubview:textView];
    [bottomView addSubview:chatPlaceHolder];
    [bottomView addSubview:entryImageView];
	[bottomView addSubview:doneBtn];
	bottomView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleTopMargin;
}
- (void)growingTextView:(HPGrowingTextView *)growingTextView willChangeHeight:(float)height
{
    float diff = (growingTextView.frame.size.height - height);
	
	CGRect r = bottomView.frame;
    r.size.height -= diff;
    r.origin.y += diff;
	bottomView.frame = r;
    
    CGRect tableViewFrame = messageListView.frame;
    if (isPresentView)
    {
        tableViewFrame.size.height = r.origin.y - self.view.frame.origin.y-24;
    }
    else
    {
        tableViewFrame.size.height = r.origin.y - self.view.frame.origin.y-44;
    }
	messageListView.frame = tableViewFrame;
	if (messageListView.contentSize.height > r.origin.y)
	{
		messageListView.contentOffset = CGPointMake(0.0f, messageListView.contentSize.height - r.origin.y+44);
	}
    
}

-(IBAction)disqualification
{
    [self.textView resignFirstResponder];
    CustomAlertView *alert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:@"你确定要取消对方得活动资格吗？" otherButton:@"确认" cancelButton:@"取消" delegate:self duration:0];
    alert.tag = 101;
    [alert show];
    [alert release];
    
}
-(IBAction)approve
{
    [self.textView resignFirstResponder];
    CustomAlertView *alert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:@"你确定要将对方加入到此活动吗？" otherButton:@"确认" cancelButton:@"取消" delegate:self duration:0];
    alert.tag = 100;
    [alert show];
    [alert release];
    
}
-(IBAction)rate
{
    [self.textView resignFirstResponder];
    CustomAlertView *alert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:@"你觉得对方靠谱么？" otherButton:@"靠谱" cancelButton:@"暂不评价" delegate:self duration:0];
            alert.tag = 102;
            [alert show];
            [alert release];
}
- (void)customAlert:(CustomAlertView *)alert DismissWithButtonTitle:(NSString *)buttonTitle
{
    if (alert.tag == 100)
    {
        if ([buttonTitle isEqualToString:@"确认"])
        {
            [self startConfirmDate:NO];
        }
    }
    else if (alert.tag == 101)
    {
        if ([buttonTitle isEqualToString:@"确认"])
        {
            [self startConfirmDate:YES];
        }
    }
    else if (alert.tag == 102)
    {
        if ([buttonTitle isEqualToString:@"靠谱"])
        {
            [self startRateUser:YES];
        }
    }
}

- (void)autoRefresh
{
    [self.messageListView setContentOffset:CGPointMake(0, -REFRESHINGVIEW_HEIGHT) animated:NO]; 
    [self.refreshHeaderView egoRefreshScrollViewDidEndDragging:self.messageListView];
}
//- (void)textChanged:(NSNotification *)notification
//{
//    if([self.textView.text length] == 0)
//    {
//        self.sendButton.enabled = NO;
//    }
//    else
//    {
//        self.sendButton.enabled = YES;
//    }
//    
//}
//- (IBAction)detailButtonClicked
//{
//    if (!self.isDetailOpen)
//    {
//        self.isDetailOpen = YES;
//        [self.dateDetailButton setImage:[UIImage imageNamed:@"arrow-hidden.png"] forState:UIControlStateNormal];
//        DateDatailView *detailView = [[DateDatailView alloc]initWithFrameForChat:CGRectMake(0,self.view.frame.origin.y, self.view.frame.size.width, self.view.frame.size.height) delegate:self dateInfo:self.dateDict];
//        [self.view addSubview:detailView];
//        [detailView release];
//
//    }
//    else {
//        self.isDetailOpen = NO;
//        [self.dateDetailButton setImage:[UIImage imageNamed:@"arrow-expansion.png"] forState:UIControlStateNormal];
//    }
//}
//- (void)closeButtonClicked
//{
//    self.isDetailOpen = NO;
//    [self.dateDetailButton setImage:[UIImage imageNamed:@"arrow-expansion.png"] forState:UIControlStateNormal];
//}
- (void)loadEarlier
{
    if (!self.isLoadingEarlier)
    {
        self.isLoadingEarlier = YES;
        //update option
        [self startGetMessageHistory];
    }

}
//-(IBAction)confirmClicked
//{   
//    [self.chatTextField resignFirstResponder];
//    if (self.messageViewType == MessageViewTypeSender)
//    {
//        CustomAlertView *alert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:[NSString stringWithFormat:@"Sending rose to %@ means you are serious about this date. Send now?",targetName] otherButton:@"Yes" cancelButton:@"No" delegate:self duration:0];
//        alert.tag = 101;
//        [alert show];
//        [alert release];
//    }
//    else
//    {
//        CustomAlertView *alert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:@"Do you want to spend 10 credits, to show the other you are serious about this date?" otherButton:@"Yes" cancelButton:@"No" delegate:self duration:0];
//        alert.tag = 101;
//        [alert show];
//        [alert release];
//    }
    //if sender,set candidateId = target ,reload date list
//}
-(void)sendButtonClicked
{
    [self.textView resignFirstResponder];
    [self startSendMessage];

}
- (void) viewWillAppear:(BOOL)animated
{
    //NSLog(@"latestMessageDict %@",self.latestMessageDict);

    //hide or disable confirmbutton
//    if (self.messageViewType == MessageViewTypeReceiver)
//    {
//        self.chatTextField.placeholder = @"Ask details of this dating plan...";
//    }
//    else {
//        self.chatTextField.placeholder = @"";
//    }
    [MobClick beginLogPageView:@"ChatView"];
    if (targetUrl != nil)
    {
        AppDelegate *appDelegate = [[UIApplication sharedApplication]delegate];
        UIImage *photo = [appDelegate.imageCache objectForKey:targetUrl];
        if (photo == nil)
        {
                        
            [imageDownloadManager downloadImageWithUrl:targetUrl];
              
        }
        else 
        {
            self.chatBGView.image = photo;
        }

    }
    if (isFirstLoad) 
    {
//        self.navTitleLabel.text = self.targetName;
        isFirstLoad = NO;
        [self autoRefresh];
    }
    
}
- (BOOL)hasMessage:(NSString *)messageId;
{
    BOOL exsisted = NO;
    @synchronized(self.contentArray)
	{
        for (int i=[self.contentArray count]-1; i>=0; i--)
        {
            NSString *currentId = [[self.contentArray objectAtIndex:i] objectForKey:@"messageId"];
            if ([messageId isEqualToString:currentId])
            {
                exsisted = YES;
                break;
            }
        }
    }
    return exsisted;
}
- (void)updateMessageViewForPush:(NSDictionary *)pushInfo
{
    NSDictionary *data = [pushInfo objectForKey:@"data"];
    NSString *type = [data objectForKey:@"type"];
    if ([type isEqualToString:@"sendMessage"])
    {
        NSString *messageId = [data objectForKey:@"messageId"];
        if(self.contentArray != nil)
        {
            if ([self hasMessage:messageId])
            {
                return;
            }
            else {
                NSString *messageText = [data objectForKey:@"messageText"];
                if ([messageText rangeOfString:@"..."].location == NSNotFound) 
                {
                    
                    //for not truncated situation,we just make a dict and insert to the array
                    NSString *userId = [data objectForKey:@"userId"];
                    NSString *createTime = [data objectForKey:@"createTime"];
                    if([userId isEqualToString:targetId])
                    {
//                        if (self.messageViewType == MessageViewTypeReceiver)
//                        {
//                            senderInfo = [NSDictionary dictionaryWithDictionary:[dateDict objectForKey:@"sender"]];
//                        }
//                        else 
//                        {
//                            NSArray *responders = [self.dateDict objectForKey:@"responders"];
//                            if (targetInfoIndex >=0 && targetInfoIndex<[responders count])
//                            {
//                                NSDictionary *responderRelated = [responders objectAtIndex:targetInfoIndex];
//                                senderInfo = [NSDictionary dictionaryWithObjectsAndKeys:[data objectForKey:@"userName"],@"name",[responderRelated objectForKey:@"primaryPhotoId"],@"primaryPhotoId",[responderRelated objectForKey:@"primaryPhotoPath"],@"primaryPhotoPath",userId,@"userId",nil];
//                            }
//                            
//                        }
                        NSDictionary *senderInfo = [NSDictionary dictionaryWithObjectsAndKeys:targetName,@"name",targetId,@"userId", nil];
                        NSMutableDictionary *messageInfoDict = [[NSMutableDictionary alloc]initWithObjectsAndKeys:senderInfo, @"sender",messageId,@"messageId",messageText,@"messageText",createTime,@"createTime",@"success",@"state",nil];
                        [self insertOneMessage:messageInfoDict];
                        [messageInfoDict release];
                        [self synchroniseMessage];
                        [self adjustMessageInfo];
                        [self.messageListView reloadData];
                        if (messageListView.contentSize.height > messageListView.frame.size.height)
                        {
                            [self.messageListView setContentOffset:CGPointMake(0.0f, messageListView.contentSize.height - messageListView.frame.size.height) animated:YES];
                        }

                    }
                                       
                }
                else 
                {
                    MessageGetOperation *operation = [[MessageGetOperation alloc]init];
                     NSString *userId = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserId"];
                    NSMutableDictionary *option = [[NSMutableDictionary alloc]initWithObjectsAndKeys:userId,@"userId",dateId,@"dateId",targetId,@"targetUserId",messageId,@"messageId", nil];
                    NSMutableURLRequest * request = [NodeAsyncConnection createNodeHttpRequest:@"/user/getMessage" parameters:option];
                    [option release];
                    operation.delegate = self;
                    operation.request = request;
                    operation.messageId = messageId;
                    [operationGetMessageQueue addOperation:operation];
                    [operation release];
                }

            }
        }
               
    }
    else if ([type isEqualToString:@"confirmDate"])
    {
        
        NSString *actionId = [data objectForKey:@"userId"];
        NSString *messageId = [data objectForKey:@"messageId"];
        NSString *createTime = [data objectForKey:@"createTime"];
        NSString *messageText = [[pushInfo objectForKey:@"aps"]objectForKey:@"alert"];
//        if (self.messageViewType == MessageViewTypeSender)
//        {//sender get confirm
//            if ([actionId isEqualToString:targetId])
//            {
//                //set double confirm true and insert a candidateId = userId,then datelist reload table;
//                [self.dateDict setObject:[NSNumber numberWithBool:YES] forKey:@"doubleConfirmed"];
//                if (![self hasMessage:messageId])
//                {
//                    NSDictionary *senderInfo = [[NSDictionary alloc]initWithObjectsAndKeys:@"PrettyRich",@"name",@"system",@"userId", nil];
//                    NSString *messageText = [NSString stringWithFormat:@"Hi, %@. %@ has sent you a rose to show he/she is serious about this date. Your date is on! Please dress neat and be on time.",[[NSUserDefaults standardUserDefaults] objectForKey:@"PrettyUserName"],targetName];
//                    NSMutableDictionary *messageInfoDict = [[NSMutableDictionary alloc]initWithObjectsAndKeys:senderInfo, @"sender",messageId,@"messageId",messageText,@"messageText",createTime,@"createTime",@"success",@"state",nil];
//                    [senderInfo release];
//                    [self insertOneMessage:messageInfoDict];
//                    [messageInfoDict release];
//                    [self synchroniseMessage];
//                    [self adjustMessageInfo];
//                    [self.messageListView reloadData];
//                    if (messageListView.contentSize.height >= messageListView.frame.size.height) 
//                    {
//                        self.messageListView.contentOffset = CGPointMake(0.0f, messageListView.contentSize.height - messageListView.frame.size.height);
//                    }
//
//                }
//
//            }
//        }
//#        if (self.messageViewType == MessageViewTypeReceiver)
        {
            //receiver get confirm
            if ([actionId isEqualToString:targetId])
            {
//                if(self.confirmState == confirmStateHide)
//                {
                    //set candidateId = selfId, then datelist reload table;
                [self.latestMessageDict setObject:[NSNumber numberWithBool:YES] forKey:@"senderConfirmed"];
                //if confirm success set double confirm true , then datelist reload table;
//                self.confirmState = confirmStateActive;
//                UIButton *newButton = [UIButton buttonWithType:UIButtonTypeCustom];
//                newButton.frame = CGRectMake(0,0, 70, 29);
//                [newButton setBackgroundImage:[UIImage imageNamed:@"chat-confirm-button.png"] forState:UIControlStateNormal];
//                [newButton addTarget:self action:@selector(confirmClicked) forControlEvents:UIControlEventTouchUpInside];
//                UIBarButtonItem *confirmBarItem = [[UIBarButtonItem alloc] initWithCustomView:newButton];
//                self.topNavigationItem.rightBarButtonItem = confirmBarItem;
//                [confirmBarItem release];
                
//                }
                if (![self hasMessage:messageId])
                {
                    NSDictionary *senderInfo = [[NSDictionary alloc]initWithObjectsAndKeys:@"PrettyRich",@"name",@"system",@"userId", nil];
                    //NSString *messageText =@"恭喜，你已被发起人批准参加此项活动。";// [NSString stringWithFormat:@"Hi, %@. %@ has sent you a rose to show he/she is serious about this date. Your date is on! Please dress neat and be on time.",[[NSUserDefaults standardUserDefaults] objectForKey:@"PrettyUserName"],targetName];
                    NSMutableDictionary *messageInfoDict = [[NSMutableDictionary alloc]initWithObjectsAndKeys:senderInfo, @"sender",messageId,@"messageId",messageText,@"messageText",createTime,@"createTime",@"success",@"state",nil];
                    [senderInfo release];
                    [self insertOneMessage:messageInfoDict];
                    [messageInfoDict release];
                    [self synchroniseMessage];
                    [self adjustMessageInfo];
                    [self.messageListView reloadData];
                    if (messageListView.contentSize.height >= messageListView.frame.size.height) 
                    {
                        self.messageListView.contentOffset = CGPointMake(0.0f, messageListView.contentSize.height - messageListView.frame.size.height);
                    }

                }
            }
        }
    }
    else if([type isEqualToString:@"cancelDate"])
    {
        NSString *actionId = [data objectForKey:@"userId"];
        NSString *messageId = [data objectForKey:@"messageId"];
        NSString *createTime = [data objectForKey:@"createTime"];
        NSString *messageText = [[pushInfo objectForKey:@"aps"]objectForKey:@"alert"];
        //        if (self.messageViewType == MessageViewTypeSender)
        //        {//sender get confirm
        //            if ([actionId isEqualToString:targetId])
        //            {
        //                //set double confirm true and insert a candidateId = userId,then datelist reload table;
        //                [self.dateDict setObject:[NSNumber numberWithBool:YES] forKey:@"doubleConfirmed"];
        //                if (![self hasMessage:messageId])
        //                {
        //                    NSDictionary *senderInfo = [[NSDictionary alloc]initWithObjectsAndKeys:@"PrettyRich",@"name",@"system",@"userId", nil];
        //                    NSString *messageText = [NSString stringWithFormat:@"Hi, %@. %@ has sent you a rose to show he/she is serious about this date. Your date is on! Please dress neat and be on time.",[[NSUserDefaults standardUserDefaults] objectForKey:@"PrettyUserName"],targetName];
        //                    NSMutableDictionary *messageInfoDict = [[NSMutableDictionary alloc]initWithObjectsAndKeys:senderInfo, @"sender",messageId,@"messageId",messageText,@"messageText",createTime,@"createTime",@"success",@"state",nil];
        //                    [senderInfo release];
        //                    [self insertOneMessage:messageInfoDict];
        //                    [messageInfoDict release];
        //                    [self synchroniseMessage];
        //                    [self adjustMessageInfo];
        //                    [self.messageListView reloadData];
        //                    if (messageListView.contentSize.height >= messageListView.frame.size.height)
        //                    {
        //                        self.messageListView.contentOffset = CGPointMake(0.0f, messageListView.contentSize.height - messageListView.frame.size.height);
        //                    }
        //
        //                }
        //
        //            }
        //        }
        //#        if (self.messageViewType == MessageViewTypeReceiver)
        {
            //receiver get confirm
            if ([actionId isEqualToString:targetId])
            {
                //                if(self.confirmState == confirmStateHide)
                //                {
                //set candidateId = selfId, then datelist reload table;
                [self.latestMessageDict setObject:[NSNumber numberWithBool:NO] forKey:@"senderConfirmed"];
                //if confirm success set double confirm true , then datelist reload table;
                //                self.confirmState = confirmStateActive;
                //                UIButton *newButton = [UIButton buttonWithType:UIButtonTypeCustom];
                //                newButton.frame = CGRectMake(0,0, 70, 29);
                //                [newButton setBackgroundImage:[UIImage imageNamed:@"chat-confirm-button.png"] forState:UIControlStateNormal];
                //                [newButton addTarget:self action:@selector(confirmClicked) forControlEvents:UIControlEventTouchUpInside];
                //                UIBarButtonItem *confirmBarItem = [[UIBarButtonItem alloc] initWithCustomView:newButton];
                //                self.topNavigationItem.rightBarButtonItem = confirmBarItem;
                //                [confirmBarItem release];
                
                //                }
                if (![self hasMessage:messageId])
                {
                    NSDictionary *senderInfo = [[NSDictionary alloc]initWithObjectsAndKeys:@"PrettyRich",@"name",@"system",@"userId", nil];
                    //NSString *messageText = @"发起人取消了你参加此项活动的资格";//[NSString stringWithFormat:@"Hi, %@. %@ has cancel the date",[[NSUserDefaults standardUserDefaults] objectForKey:@"PrettyUserName"],targetName];
                    NSMutableDictionary *messageInfoDict = [[NSMutableDictionary alloc]initWithObjectsAndKeys:senderInfo, @"sender",messageId,@"messageId",messageText,@"messageText",createTime,@"createTime",@"success",@"state",nil];
                    [senderInfo release];
                    [self insertOneMessage:messageInfoDict];
                    [messageInfoDict release];
                    [self synchroniseMessage];
                    [self adjustMessageInfo];
                    [self.messageListView reloadData];
                    if (messageListView.contentSize.height >= messageListView.frame.size.height) 
                    {
                        self.messageListView.contentOffset = CGPointMake(0.0f, messageListView.contentSize.height - messageListView.frame.size.height);
                    }
                    
                }
            }
        }

    }
}
- (IBAction)backButtonClicked
{
    if (isPresentView)
    {
        [self dismissModalViewControllerAnimated:YES];
    }
    else
    {
        [self.navigationController popViewControllerAnimated:YES];
    }
    
}

- (void)viewDidUnload
{
    if (imageDownloadManager != nil) 
    {
        [imageDownloadManager cancelAllDownloadInProgress];
    }
    [self setChatBGView:nil];
    [self setDisqualificationButton:nil];
    [self setApproveButton:nil];
    [self setRateButton:nil];
    [self setActivityIndicator:nil];
    [self setTopNavigationItem:nil];
    [self setBackButton:nil];
    [super viewDidUnload];
    // Release any retained subviews of the main view.
    // e.g. self.myOutlet = nil;
}

- (BOOL)shouldAutorotateToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation
{
    return (interfaceOrientation == UIInterfaceOrientationPortrait);
}
- (BOOL)textFieldShouldBeginEditing:(UITextField *)textField
{
	return YES;
}
- (BOOL)textField:(UITextField *)textField shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string
{
    return YES;
}
- (BOOL)textFieldShouldReturn:(UITextField *)textField
{
    [textField resignFirstResponder];
    return YES;
}
#pragma mark - Table view data source

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    // Return the number of sections.
    return 1;
}
- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{

    return [[[self.contentArray objectAtIndex:indexPath.row]objectForKey:@"cellHeight"] floatValue];//[self getCellHeight:[self.contentArray objectAtIndex:indexPath.row] isHeader:NO];
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{

    // Return the number of rows in the section.

    return [self.contentArray count];
    
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{

        NewMessageCell *cell = (NewMessageCell *)[tableView dequeueReusableCellWithIdentifier:@"NewMessageCell"];
        if (cell == nil)
        {
            NSArray * array =[[NSBundle mainBundle]loadNibNamed:@"NewMessageCell" owner:nil options:nil ];
            cell = (NewMessageCell *)[array objectAtIndex:0];     
        }
        [cell customCellWithInfo:[self.contentArray objectAtIndex:indexPath.row]];
        return cell;
//        int num = indexPath.row;
//        float height = [self tableView:self.messageListView heightForRowAtIndexPath:indexPath];
//        NSString *primaryPhotoPath;
//        NSString *talkerId;
//        if (indexPath.row == 0)
//        {
//            if (self.messageViewType == MessageViewTypeReceiver)
//            {
//                NSDictionary *sender = [dateDict objectForKey:@"sender"];
//                primaryPhotoPath = [sender objectForKey:@"primaryPhotoPath"];
//                talkerId = [sender objectForKey:@"userId"];
//                [cell customCellWithInfo:dateDict withHeader:YES height:height senderName:[sender objectForKey:@"name"] timeStamp:[dateDict objectForKey:@"receiveTime"]];
//            }
//            else {
//                primaryPhotoPath = [speakerInfo objectForKey:@"primaryPhotoPath"];
//                talkerId = [speakerInfo objectForKey:@"userId"];
//                [cell customCellWithInfo:dateDict withHeader:YES height:height senderName:[speakerInfo objectForKey:@"name"] timeStamp:[dateDict objectForKey:@"sendTime"]];
//            }
//        }
//        else {
//            primaryPhotoPath = [[[self.contentArray objectAtIndex:num-1]objectForKey:@"sender"]objectForKey:@"primaryPhotoPath"];
//            [cell customCellWithInfo:[self.contentArray objectAtIndex:num-1] withHeader:NO height:height senderName:nil timeStamp:nil];
//            talkerId = [[[self.contentArray objectAtIndex:num-1]objectForKey:@"sender"]objectForKey:@"userId"];
//
//        }
//        NSString *selfId = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserId"];
//        NSString *selfGender = [[NSUserDefaults standardUserDefaults] objectForKey:@"PrettyUserGender"];
//        if ([PrettyUtility isNull:primaryPhotoPath])
//        {
//            if ([talkerId isEqualToString:selfId])
//            {
//                if ([selfGender isEqualToString:@"male"])
//                {
//                    cell.profilePhoto.image = [UIImage imageNamed:@"head-male.png"];
//                }
//                else 
//                {
//                    cell.profilePhoto.image = [UIImage imageNamed:@"head-female.png"];
//                }
//            }
//            else if([talkerId isEqualToString:@"system"])
//            {
//                cell.profilePhoto.image = [UIImage imageNamed:@"system-photo.png"];
//            }
//            else {
//                if ([selfGender isEqualToString:@"male"])
//                {
//                    cell.profilePhoto.image = [UIImage imageNamed:@"head-female.png"];
//                }
//                else 
//                {
//                    cell.profilePhoto.image = [UIImage imageNamed:@"head-male.png"];
//                }
//
//            }
//        }
//        else {
//            NSString *photoUrl = [PrettyUtility getPhotoUrl:primaryPhotoPath :@"s"];
//            AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
//            UIImage *photo = [appDelegate.imageCache objectForKey:photoUrl];
//            if (photo == nil)
//            {
//                if ([talkerId isEqualToString:selfId])
//                {
//                    if ([selfGender isEqualToString:@"male"])
//                    {
//                        cell.profilePhoto.image = [UIImage imageNamed:@"head-male.png"];
//                    }
//                    else 
//                    {
//                        cell.profilePhoto.image = [UIImage imageNamed:@"head-female.png"];
//                    }
//                }
//                else {
//                    if ([selfGender isEqualToString:@"male"])
//                    {
//                        cell.profilePhoto.image = [UIImage imageNamed:@"head-female.png"];
//                    }
//                    else 
//                    {
//                        cell.profilePhoto.image = [UIImage imageNamed:@"head-male.png"];
//                    }
//                    
//                }
//                if (messageListView.dragging == NO && messageListView.decelerating == NO)
//                {
//                    [imageDownloadManager downloadImageWithUrl:photoUrl forIndexPath:indexPath];
//                }                
//            }
//            else 
//            {
//                cell.profilePhoto.image = photo;
//            }
//            cell.imgUrl = photoUrl;
//        }
//        cell.index = indexPath;

}
- (float)getCellHeight:(NSDictionary *)cellDict isHeader:(BOOL)isHeader
{
    if (!isHeader)
    {
        NSString *messageText = [cellDict objectForKey:@"messageText"];
        float height = [PrettyUtility calculateHeight:messageText :[UIFont fontWithName:@"Arial" size:11] :240 :UILineBreakModeWordWrap];
        if (height > 42)
        {
            return height+37;
        }
        else {
            return 79;
        }
    }
    else {
        NSString *messageText = [cellDict objectForKey:@"description"];
        float height = [PrettyUtility calculateHeight:messageText :[UIFont fontWithName:@"Arial" size:11] :240 :UILineBreakModeWordWrap];
        if (height > 28.5) {
            return height + 50.5;
        }
        else
        {
            return  79;
        }
    }
}
-(void)startRateUser:(BOOL)isGood
{
    NSString *rateType;
    if (isGood)
    {
        rateType = @"good";
    }
    else
    {
        rateType = @"bad";
    }
    NodeAsyncConnection *curnnection = [[NodeAsyncConnection alloc]init];
    NSString *userId = [[NSUserDefaults standardUserDefaults] objectForKey:@"PrettyUserId"];
    NSDictionary *dict = [[NSDictionary alloc]initWithObjectsAndKeys:userId,@"userId",dateId,@"dateId",targetId,@"targetUserId",rateType,@"type", nil];
    [curnnection startDownload:[NodeAsyncConnection createNodeHttpRequest:@"/user/rate" parameters:dict] :self :@selector(didEndRateUser:)];
    [dict release];
    [self.activityIndicator startAnimating];
    self.activityIndicator.hidden = NO;
    [self.topNavigationItem.rightBarButtonItem setEnabled:NO];

}
- (void)didEndRateUser:(NodeAsyncConnection *)connection
{
    self.activityIndicator.hidden = YES;
    [self.activityIndicator stopAnimating];
    if (connection == nil || connection.result == nil)
    {
        [self.topNavigationItem.rightBarButtonItem setEnabled:YES];
        [connection release];
        return;
    }
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
    {
        if (messageViewType == MessageViewTypeSender)
        {
            [self.latestMessageDict setObject:[NSNumber numberWithBool:YES] forKey:@"haveBeenRated"];
        }
        else
        {
            [self.latestMessageDict setObject:[NSNumber numberWithBool:YES] forKey:@"haveRate"];
        }
        [self.topNavigationItem.rightBarButtonItem setEnabled:NO];
        self.confirmState = confirmStateRated;
    
    }
    else
    {
       [self.topNavigationItem.rightBarButtonItem setEnabled:YES]; 
    }
    [connection release];
}
- (void)startConfirmDate:(BOOL)beCancel
{
    NSString *userId = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserId"];
    
    //[curConnection cancelDownload];
    NodeAsyncConnection *curnnection = [[NodeAsyncConnection alloc]init];
    NSDictionary *dict = [[NSDictionary alloc]initWithObjectsAndKeys:userId,@"userId",dateId,@"dateId",targetId,@"targetUserId",[NSNumber numberWithBool:beCancel],@"beCancel", nil];
    NSString *isCancel;
    if (beCancel) {
        isCancel = @"1";
    }
    else
    {
        isCancel = @"0";
    }
    curnnection.customData = isCancel;
    [curnnection startDownload:[NodeAsyncConnection createNodeHttpRequest:@"/user/confirmDate" parameters:dict] :self :@selector(didEndConfirmDate:)];
    [dict release];
    [self.activityIndicator startAnimating];
    self.activityIndicator.hidden = NO;
    [self.topNavigationItem.rightBarButtonItem setEnabled:NO];

}
- (void)didEndConfirmDate:(NodeAsyncConnection *)connection
{
    [self.activityIndicator stopAnimating];
    self.activityIndicator.hidden = YES;
    [self.topNavigationItem.rightBarButtonItem setEnabled:YES];
    if (connection == nil || connection.result == nil)
    {
        [connection release];
        return;
    }
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
    {
        //NSDictionary *result = [connection.result objectForKey:@"result"];
        if (self.messageViewType == MessageViewTypeSender)
        {
//#            self.confirmState = confirmStateConfirmed;
            NSString *isCancel = (NSString *)connection.customData;
            if ([isCancel isEqualToString:@"1"])
            {
                self.isSenderConfirmed = NO;
                self.topNavigationItem.rightBarButtonItem = self.approveButton;
                [self.latestMessageDict setObject:[NSNumber numberWithBool:NO] forKey:@"senderConfirmed"];
            }
            else
            {
                self.isSenderConfirmed = YES;
                self.topNavigationItem.rightBarButtonItem = self.disqualificationButton;
                [self.latestMessageDict setObject:[NSNumber numberWithBool:YES] forKey:@"senderConfirmed"];
            }
            //[self.dateDict setObject:targetId forKey:@"finalCandidateId"];
        }
    }
    [connection release];
//            NSString *messageId = [[result objectForKey:@"sysMessageToSelf"] objectForKey:@"messageId"];
//            NSString *createTime = [[result objectForKey:@"sysMessageToSelf"] objectForKey:@"createTime"];
//            [self.dateDict setObject:targetId forKey:@"finalCandidateId"];
//            if (![self hasMessage:messageId])
//            {
//                NSDictionary *senderInfo = [[NSDictionary alloc]initWithObjectsAndKeys:@"PrettyRich",@"name",@"system",@"userId", nil];
//                NSString *messageText = [NSString stringWithFormat:@"You have confirmed this date with %@. We will ask %@ to confirm back as well, then your date will be on!",targetName,targetName];
//                NSMutableDictionary *messageInfoDict = [[NSMutableDictionary alloc]initWithObjectsAndKeys:senderInfo, @"sender",messageId,@"messageId",messageText,@"messageText",createTime,@"createTime",@"success",@"state",nil];
//                [senderInfo release];
//                [self insertOneMessage:messageInfoDict];
//                [messageInfoDict release];
//                [self synchroniseMessage];
//                [self adjustMessageInfo];
//                [self.messageListView reloadData];
//                if (messageListView.contentSize.height >= messageListView.frame.size.height)
//                {
//                    self.messageListView.contentOffset = CGPointMake(0.0f, messageListView.contentSize.height - messageListView.frame.size.height);
//                }
//            }
//        }
//    }
    
//        if (messageViewType == MessageViewTypeReceiver)
//        {
//            [self.dateDict setObject:[NSNumber numberWithBool:YES] forKey:@"doubleConfirmed"];
//            if (![self hasMessage:messageId])
//            {
//                NSDictionary *senderInfo = [[NSDictionary alloc]initWithObjectsAndKeys:@"PrettyRich",@"name",@"system",@"userId", nil];
//                NSString *messageText = @"Congratulations. Your date is on! Please dress neat and be on time.";
//                NSMutableDictionary *messageInfoDict = [[NSMutableDictionary alloc]initWithObjectsAndKeys:senderInfo, @"sender",messageId,@"messageId",messageText,@"messageText",createTime,@"createTime",@"success",@"state",nil];
//                [senderInfo release];
//                [self insertOneMessage:messageInfoDict];
//                [messageInfoDict release];
//                [self synchroniseMessage];
//                [self.messageListView reloadData];
//                if (messageListView.contentSize.height >= messageListView.frame.size.height) 
//                {
//                    self.messageListView.contentOffset = CGPointMake(0.0f, messageListView.contentSize.height - messageListView.frame.size.height);
//                }
//                
//            }

//        }
//        else {

//    }
    //pop message,also add system message;
}
- (void)startGetMessageHistory
{
    NSString *cutOffTime;
    if ([self.contentArray count]!=0)
    {
        cutOffTime = [[self.contentArray objectAtIndex:0]objectForKey:@"createTime"];
        long long time = [cutOffTime longLongValue];
        time = time-1;
        cutOffTime = [NSString stringWithFormat:@"%lld",time];
        [messageOption setObject:cutOffTime forKey:@"cutOffTime"];
    }
    else {
        //NSDate *now = [NSDate date];
        //NSTimeInterval timeInterval = [now timeIntervalSince1970];
        //cutOffTime = @"";//[NSString stringWithFormat:@"%d000",(int)timeInterval];
        [messageOption removeObjectForKey:@"cutOffTime"];
    }

    [curConnection cancelDownload];
    [curConnection startDownload:[NodeAsyncConnection createNodeHttpRequest:@"/user/getMessageHistory" parameters:messageOption] :self :@selector(didEndGetMessageHistory:)];
}
- (void)didEndGetMessageHistory:(NodeAsyncConnection *)connection
{
    if (self.isLoadingEarlier)
    {
        self.isLoadingEarlier = NO;
        [self.refreshHeaderView egoRefreshScrollViewDataSourceDidFinishedLoading:self.messageListView];
    }
    if (connection==nil || connection.result == nil) return;
    BOOL needScrollToEnd = NO;
    if (self.contentArray == nil || self.contentArray.count==0)
    {
        needScrollToEnd = YES;
    }
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
    {
        @synchronized(self.contentArray)
        {
            NSDictionary *result = [connection.result objectForKey:@"result"];
            NSMutableArray *messageArray =[NSMutableArray arrayWithArray:[result objectForKey:@"messages"]] ;
            for(int i=0;i< [messageArray count];i++)
            {
                NSMutableDictionary *message = [messageArray objectAtIndex:i];
                [message setObject:@"success" forKey:@"state"];
                [self.contentArray insertObject:message atIndex:0];
            }
        }
        [self adjustMessageInfo];
        [self.messageListView reloadData];
        [self synchroniseMessage];
        //NSLog(@"content %@",self.contentArray);
        if (needScrollToEnd) {
            if (messageListView.contentSize.height > messageListView.frame.size.height) 
            {
                [self.messageListView setContentOffset:CGPointMake(0.0f, messageListView.contentSize.height - messageListView.frame.size.height) animated:NO];
            }

        }
    }
    //refresh the message list
}
- (void)adjustMessageInfo
{
    @synchronized(self.contentArray)
	{
        NSString *selfId = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserId"];
		for (int i=0; i<[self.contentArray count]; i++)
        {
            NSMutableDictionary *dict = [self.contentArray objectAtIndex:i];
            NSString *senderId = [[dict objectForKey:@"sender"]objectForKey:@"userId"];
            BOOL hasTime = NO;
            if([selfId isEqualToString:senderId])
            {
                [dict setObject:@"typeSelf" forKey:@"cellType"];
            }
            else {
                [dict setObject:@"typeOther" forKey:@"cellType"];
            }
            if (i == 0)
            {
                hasTime = YES;
                [dict setObject:[NSNumber numberWithBool:YES] forKey:@"hasTime"];
            }
            else
            {
                NSNumber *number2 = [NSNumber numberWithLongLong:[[dict objectForKey:@"createTime"]longLongValue]];
                NSNumber *number1 = [NSNumber numberWithLongLong:[[[self.contentArray objectAtIndex:i-1] objectForKey:@"createTime"]longLongValue]];
                if ([PrettyUtility isInterval1:number1 andInterval2:number2 largerThan:300])
                {
                    hasTime = YES;
                    [dict setObject:[NSNumber numberWithBool:YES] forKey:@"hasTime"];
                }
                else {
                    [dict setObject:[NSNumber numberWithBool:NO] forKey:@"hasTime"];
                }
            }
            NSString *text = [dict objectForKey:@"messageText"];
            CGSize textSize = [text sizeWithFont:[UIFont fontWithName:@"HelveticaNeue-Light" size:12] constrainedToSize:CGSizeMake(187, 9999) lineBreakMode:UILineBreakModeWordWrap];
            float height = 0;
            if (hasTime)
            {
                height = 38+14+textSize.height;
            }
            else {
                height = 12+14+textSize.height;
            }
            [dict setObject:[NSNumber numberWithFloat:height] forKey:@"cellHeight"];
        }
	}
}
- (void) insertOneMessage:(NSMutableDictionary *)messageInfoDic
{
	@synchronized(self.contentArray)
	{
		[self.contentArray addObject:messageInfoDic];
	}
}
- (void) deleteOneMessage:(NSString *)messageId
{
    @synchronized(self.contentArray)
    {
        for (int i=[self.contentArray count]-1; i>=0; i--)
        {
            NSString *currentId = [[self.contentArray objectAtIndex:i] objectForKey:@"messageId"];
            if ([messageId isEqualToString:currentId])
            {
                [[self.contentArray objectAtIndex:i]setObject:@"failed" forKey:@"state"];
                break;
            }
        }
    }
}
- (void)synchroniseMessage
{
    NSMutableDictionary *messageDict;
    BOOL findSuccessMessage = NO;
    @synchronized(self.contentArray)
    {
        for (int i=[self.contentArray count]-1; i>=0; i--)
        {
            NSString *state = [[self.contentArray objectAtIndex:i] objectForKey:@"state"];
            if ([state isEqualToString:@"success"])
            {
                messageDict = [self.contentArray objectAtIndex:i];
                findSuccessMessage = YES;
                break;
            }
        }
    }
    if (!findSuccessMessage)
    {
        return;
    }
    NSString *selfId = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserId"];
    //if (self.messageViewType == MessageViewTypeReceiver)
    //{
        if (![PrettyUtility isNull:self.latestMessageDict])
        {
            NSMutableDictionary *latestMessage = [self.latestMessageDict objectForKey:@"latestMessage"];
            [latestMessage setObject:[messageDict objectForKey:@"createTime"] forKey:@"createTime"];
            [latestMessage setObject:[messageDict objectForKey:@"messageId"] forKey:@"messageId"];
            [latestMessage setObject:[messageDict objectForKey:@"messageText"] forKey:@"messageText"];
            NSString *senderId = [[messageDict objectForKey:@"sender"] objectForKey:@"userId"];
            NSString *receiverId;
            if ([senderId isEqualToString:selfId])
            {
                receiverId = targetId;
            }
            else {
                receiverId = selfId;
            }

            [latestMessage setObject:receiverId forKey:@"receiverId"];
            [latestMessage setObject:senderId forKey:@"senderId"];
            
        }
//    {
//        if (![PrettyUtility isNull:[self.dateDict objectForKey:@"responders"]]) 
//        {
//            NSMutableArray *responders = [self.dateDict objectForKey:@"responders"];
//            NSMutableDictionary *responder = [responders objectAtIndex:0];
//            NSMutableDictionary *latestMessage = [responder objectForKey:@"latestMessage"];
//            NSString *createTime = [messageDict objectForKey:@"createTime"];
//            NSString *messageId = [messageDict objectForKey:@"messageId"];
//            NSString *messageText = [messageDict objectForKey:@"messageText"];
//            NSString *senderId = [[messageDict objectForKey:@"sender"] objectForKey:@"userId"];
//            NSString *receiverId;
//            if ([senderId isEqualToString:selfId])
//            {
//                receiverId = targetId;
//            }
//            else {
//                receiverId = selfId;
//            }
//            [latestMessage setObject:createTime forKey:@"createTime"];
//            [latestMessage setObject:messageId forKey:@"messageId"];
//            [latestMessage setObject:messageText forKey:@"messageText"];
//            [latestMessage setObject:senderId forKey:@"senderId"];
//            [latestMessage setObject:receiverId forKey:@"receiverId"];
//        }
//        else {
//            NSMutableDictionary *latestMessage = [[NSMutableDictionary alloc]init];
//            NSString *createTime = [messageDict objectForKey:@"createTime"];
//            NSString *messageId = [messageDict objectForKey:@"messageId"];
//            NSString *messageText = [messageDict objectForKey:@"messageText"];
//            NSString *senderId = [[messageDict objectForKey:@"sender"] objectForKey:@"userId"];
//            NSString *receiverId;
//            if ([senderId isEqualToString:selfId])
//            {
//                receiverId = targetId;
//            }
//            else {
//                receiverId = selfId;
//            }
//            [latestMessage setObject:createTime forKey:@"createTime"];
//            [latestMessage setObject:messageId forKey:@"messageId"];
//            [latestMessage setObject:messageText forKey:@"messageText"];
//            [latestMessage setObject:senderId forKey:@"senderId"];
//            [latestMessage setObject:receiverId forKey:@"receiverId"];
//            
//            NSMutableDictionary *responder = [[NSMutableDictionary alloc]initWithObjectsAndKeys:
//                                              latestMessage,@"latestMessage",
//                                              [self.speakerInfo objectForKey:@"userId"],@"responderId",
//                                              [NSNumber numberWithBool:NO],@"confirmed",
//                                              [NSNumber numberWithBool:NO],@"senderConfirmed",
//                                              [self.speakerInfo objectForKey:@"userId"],@"userId",
//                                              [self.speakerInfo objectForKey:@"name"],@"name",
//                                              [self.speakerInfo objectForKey:@"primaryPhotoId"],@"primaryPhotoId",
//                                              [self.speakerInfo objectForKey:@"primaryPhotoPath"],@"primaryPhotoPath",
//                                              nil];
//            
//            [latestMessage release];
//            NSMutableArray *responders = [[NSMutableArray alloc]init];
//            [responders addObject:responder];
//            [responder release];
//            [self.dateDict setObject:responders forKey:@"responders"];
//            [responders release];
//        }
        
//    }
//    else
//    {
//        NSMutableArray *responders = [self.dateDict objectForKey:@"responders"];
//        NSMutableDictionary *responder = [responders objectAtIndex:targetInfoIndex];
//        NSMutableDictionary *latestMessage = [responder objectForKey:@"latestMessage"];
//        NSString *createTime = [messageDict objectForKey:@"createTime"];
//        NSString *messageId = [messageDict objectForKey:@"messageId"];
//        NSString *messageText = [messageDict objectForKey:@"messageText"];
//        NSString *senderId = [[messageDict objectForKey:@"sender"] objectForKey:@"userId"];
//        NSString *receiverId;
//        if ([senderId isEqualToString:selfId])
//        {
//            receiverId = targetId;
//        }
//        else {
//            receiverId = selfId;
//        }
//        [latestMessage setObject:createTime forKey:@"createTime"];
//        [latestMessage setObject:messageId forKey:@"messageId"];
//        [latestMessage setObject:messageText forKey:@"messageText"];
//        [latestMessage setObject:senderId forKey:@"senderId"];
//        [latestMessage setObject:receiverId forKey:@"receiverId"];
//    }
    
}
- (void)startSendMessage
{

    NSString *messageText = self.textView.text;
    messageText = [messageText stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
    if ([messageText length]==0)
    {
        self.textView.text = @"";
        //self.sendButton.enabled = NO;
        self.chatPlaceHolder.alpha = 1;
        return;
    }
    self.textView.text = @"";
    self.chatPlaceHolder.alpha = 1;
    //self.sendButton.enabled = NO;
    MessageSendOperation *operation = [[MessageSendOperation alloc]init];
    NSString *userId = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserId"];
    NSDictionary *dict = [[NSDictionary alloc]initWithObjectsAndKeys:userId,@"userId",dateId,@"dateId",targetId,@"targetUserId",messageText,@"messageText", nil];
    NSMutableURLRequest * request = [NodeAsyncConnection createNodeHttpRequest:@"/user/sendMessage" parameters:dict];
    [dict release];
    operation.delegate = self;
    operation.request = request;
    NSTimeInterval interval = [[NSDate date] timeIntervalSince1970];
    NSString *createTime = [NSString stringWithFormat:@"%d",(int)interval];
    NSString *messageId = createTime;
    NSDictionary *sen = [[NSDictionary alloc]initWithObjectsAndKeys:userId,@"userId", nil];
    NSMutableDictionary *messageInfoDict = [[NSMutableDictionary alloc]initWithObjectsAndKeys:sen, @"sender",messageId,@"messageId",messageText,@"messageText",createTime,@"createTime",@"sending",@"state",nil];
    [sen release];
    //NSLog(@"%@",messageInfoDict);
    [self insertOneMessage:messageInfoDict];
    [messageInfoDict release];
    operation.messageId = messageId;
    [self adjustMessageInfo];
	[self.messageListView reloadData];
	if (messageListView.contentSize.height > messageListView.frame.size.height) 
	{
		[self.messageListView setContentOffset:CGPointMake(0.0f, messageListView.contentSize.height - messageListView.frame.size.height) animated:YES];
	}

    [operationSendMessageQueue addOperation:operation];
    [operation release];
}
- (void) didFinishSendingMessage:(NodeAsyncConnection *) connection messageId:(NSString *)messageId
{
    if (connection == nil || connection.result == nil)
    {
        return;
    }
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
    {
        NSDictionary *result = [connection.result objectForKey:@"result"];
        NSString *newID = [result objectForKey:@"messageId"];
        NSString *createTime = [result objectForKey:@"createTime"];

        @synchronized(self.contentArray)
        {
            for (int i = [self.contentArray count]-1; i>=0; i--)
            {
                NSMutableDictionary *dict = [self.contentArray objectAtIndex:i];
                NSString *mID = [dict objectForKey:@"messageId"];
                if ([mID isEqualToString:messageId])
                {
                    [dict setObject:@"success" forKey:@"state"];
                    [dict setObject:newID forKey:@"messageId"];
                    [dict setObject:createTime forKey:@"createTime"];
                    [self synchroniseMessage];
                    break;
                }
            }
        }
        [self adjustMessageInfo];
        [self.messageListView reloadData];
        if (messageListView.contentSize.height >= messageListView.frame.size.height) 
        {
            self.messageListView.contentOffset = CGPointMake(0.0f, messageListView.contentSize.height - messageListView.frame.size.height);
        }
        
    }
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"fail"])
    {
        [self deleteOneMessage:messageId];
        [self adjustMessageInfo];
        [self.messageListView reloadData];
        if (messageListView.contentSize.height >= messageListView.frame.size.height) 
        {
            self.messageListView.contentOffset = CGPointMake(0.0f, messageListView.contentSize.height - messageListView.frame.size.height);
        }
    }
}
- (void) didFinishGetMessage:(NodeAsyncConnection *) connection messageId:(NSString*)messageId
{
    if (connection == nil || connection.result == nil)
    {
        return;
    }
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
    {
        NSDictionary *result = [connection.result objectForKey:@"result"];
        NSString *aMessageId = [result objectForKey:@"messageId"];
        if ([aMessageId isEqualToString:messageId])
        {
            if (![self hasMessage:messageId]) 
            {
                NSMutableDictionary *messageToAdd = [[NSMutableDictionary alloc]initWithDictionary:result];
                [messageToAdd setObject:@"success" forKey:@"state"];
                [self insertOneMessage:messageToAdd];
                [messageToAdd release];
                [self synchroniseMessage];
                [self adjustMessageInfo];
                [self.messageListView reloadData];
                if (messageListView.contentSize.height >= messageListView.frame.size.height) 
                {
                    self.messageListView.contentOffset = CGPointMake(0.0f, messageListView.contentSize.height - messageListView.frame.size.height);
                }
            }
        }
    }
}
#pragma mark - Table view delegate

- (void)viewWillDisappear:(BOOL)animated
{
    [MobClick endLogPageView:@"ChatView"];
    if (messageViewType == MessageViewTypeSender)
    {
        [[NSNotificationCenter defaultCenter] postNotificationName:@"UpdateRespondListNotification" object:nil];
    }
    else
    {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"UpdateDateListNotification" object:nil];
    }
    [curConnection cancelDownload];

}
- (void)keyboardWillShow:(NSNotification *)notification {
	
    NSDictionary *userInfo = [notification userInfo];

    NSValue *boundsValue = [userInfo objectForKey:UIKeyboardFrameEndUserInfoKey];
	CGRect keyboardRect = [boundsValue CGRectValue];

    CGFloat keyboardTop = self.view.frame.size.height - keyboardRect.size.height;
    CGRect bottomViewFrame = bottomView.frame;
	
	bottomViewFrame.origin.y = keyboardTop - bottomViewFrame.size.height;
    NSValue *animationDurationValue = [userInfo objectForKey:UIKeyboardAnimationDurationUserInfoKey];
    NSTimeInterval animationDuration;
    [animationDurationValue getValue:&animationDuration];
    [UIView beginAnimations:nil context:NULL];
    [UIView setAnimationDuration:animationDuration];
    bottomView.frame = bottomViewFrame;
    [UIView commitAnimations];
	CGRect tableViewFrame = messageListView.frame;
    if (isPresentView)
    {
        tableViewFrame.size.height = bottomViewFrame.origin.y - self.view.frame.origin.y-24;
    }
    else
    {
        tableViewFrame.size.height = bottomViewFrame.origin.y - self.view.frame.origin.y-44;
    }
	messageListView.frame = tableViewFrame;
	if (messageListView.contentSize.height > bottomViewFrame.origin.y)
	{
		messageListView.contentOffset = CGPointMake(0.0f, messageListView.contentSize.height - bottomViewFrame.origin.y+44);
	}
    keyBoardIsUp = YES;
    
}


- (void)keyboardWillHide:(NSNotification *)notification {
    
    NSDictionary* userInfo = [notification userInfo];
    /*
     Restore the size of the text view (fill self's view).
     Animate the resize so that it's in sync with the disappearance of the keyboard.
     */
    CGRect bottomViewFrame = bottomView.frame;
	bottomViewFrame.origin.y = self.view.frame.size.height - bottomViewFrame.size.height;
	
	NSValue *animationDurationValue = [userInfo objectForKey:UIKeyboardAnimationDurationUserInfoKey];
    NSTimeInterval animationDuration;
    [animationDurationValue getValue:&animationDuration];
    
    [UIView beginAnimations:nil context:NULL];
    [UIView setAnimationDuration:animationDuration];
    bottomView.frame = bottomViewFrame;
    [UIView commitAnimations];
	messageListView.frame = CGRectMake(self.messageListView.frame.origin.x, self.messageListView.frame.origin.y,messageListView.frame.size.width, self.view.frame.size.height - bottomView.frame.size.height-44);
	if (messageListView.contentSize.height > messageListView.frame.size.height) 
	{
		self.messageListView.contentOffset = CGPointMake(0.0f, messageListView.contentSize.height - messageListView.frame.size.height);
    }
    keyBoardIsUp = NO;
}

- (void) imageDidDownload:(ImageDownloader *)downloader
{
    if (downloader.downloadImage != nil) 
    {
        AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
        [appDelegate.imageCache setObject:downloader.downloadImage forKey:downloader.imageUrl];
        if ([targetUrl isEqualToString:downloader.imageUrl])
        {
            chatBGView.image = downloader.downloadImage;
        }
    }
    [imageDownloadManager removeOneDownloadWithUrl:downloader.imageUrl];
}

-(void)dealloc
{
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillShowNotification object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UIKeyboardWillHideNotification object:nil];
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UITextViewTextDidChangeNotification object:nil];
    [textView release];
    if (imageDownloadManager != nil) 
    {
        [imageDownloadManager cancelAllDownloadInProgress];
        imageDownloadManager.imageDownloadDelegate = nil;
    }
    self.messageListView = nil;
    self.speakerInfo = nil;
    self.bottomView = nil;
    //self.sendButton = nil;
    self.contentArray= nil;
    self.targetId = nil;
    self.dateId = nil;
    self.targetName = nil;
    self.imageDownloadManager = nil;
    [operationSendMessageQueue cancelAllOperations];
    self.operationSendMessageQueue = nil;
    [operationGetMessageQueue cancelAllOperations];
    self.operationGetMessageQueue = nil;
    self.dateDict = nil;
    self.latestMessageDict = nil;
    [curConnection cancelDownload];
    self.messageOption = nil;
    self.curConnection = nil;
    self.refreshHeaderView = nil;
    [chatPlaceHolder release];
    [chatBGView release];
    [targetUrl release];
    [_disqualificationButton release];
    [_approveButton release];
    [_rateButton release];
    [_activityIndicator release];
    [_topNavigationItem release];
    [_backButton release];
    [super dealloc];
}
- (void)scrollViewDidScroll:(UIScrollView *)scrollView
{
    [self.refreshHeaderView egoRefreshScrollViewDidScroll:scrollView];
}

- (void)scrollViewDidEndDragging:(UIScrollView *)scrollView willDecelerate:(BOOL)decelerate
{
	[self.refreshHeaderView egoRefreshScrollViewDidEndDragging:scrollView];
}
- (void)scrollViewDidEndDecelerating:(UIScrollView *)scrollView
{
}
- (void)egoRefreshTableHeaderDidTriggerRefresh:(EGORefreshTableHeaderView*)view
{
    [self loadEarlier];
}

- (BOOL)egoRefreshTableHeaderDataSourceIsLoading:(EGORefreshTableHeaderView*)view
{
	return self.isLoadingEarlier; // should return if data source model is reloading
}
- (NSDate*)egoRefreshTableHeaderDataSourceLastUpdated:(EGORefreshTableHeaderView*)view
{
    return [NSDate date];
}

@end
