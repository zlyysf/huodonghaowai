//
//  NNWantJoinViewController.m
//  PrettyRich
//
//  Created by liu miao on 10/23/12.
//
//

#import "NNWantJoinViewController.h"
#import "MobClick.h"
@interface NNWantJoinViewController ()

@end

@implementation NNWantJoinViewController
@synthesize dateId,targetUserId,curConnection;
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
    UIBarButtonItem *reply = [[UIBarButtonItem alloc]initWithTitle:@"回复" style:UIBarButtonItemStyleBordered target:self action:@selector(replyButtonClicked)];
    self.navigationItem.rightBarButtonItem = reply;
    [reply release];
    UIBarButtonItem *cancel = [[UIBarButtonItem alloc]initWithTitle:@"取消" style:UIBarButtonItemStyleBordered target:self action:@selector(cancelButtonClicked)];
    self.navigationItem.leftBarButtonItem = cancel;
    [cancel release];
    self.navigationItem.title = @"我要加入";
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(textChanged:) name:UITextViewTextDidChangeNotification object:nil];
    NodeAsyncConnection *cur = [[NodeAsyncConnection alloc]init];
    self.curConnection = cur;
    [cur release];
    self.activityIndicator.hidden = YES;
}
- (void)textChanged:(NSNotification *)notification
{
    int length = [self.messageTextView.text length];
    self.countLabel.text = [NSString stringWithFormat:@"%i/140",length];
}
- (BOOL)textView:(UITextView *)textView shouldChangeTextInRange:(NSRange)range replacementText:(NSString *)text
{
//    NSCharacterSet *cs;
//    cs = [[NSCharacterSet characterSetWithCharactersInString:] invertedSet];
//    NSString *filtered =
//    [[string componentsSeparatedByCharactersInSet:cs] componentsJoinedByString:@""];
//    BOOL basic = [string isEqualToString:filtered];
//    if (basic)
//    {
        if ([text length]+[textView.text length]>140)
        {
            return NO;
        }
        return YES;
//    }
//    else {
//        return NO;
//    }
    
}

-(void)replyButtonClicked
{
    NSString *message = [self.messageTextView.text stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
    if ([message length]!=0)
    {
        [self startReplyDate:message];
    }
}
- (void)startReplyDate:(NSString *)message
{
    NSString *userId = [[NSUserDefaults standardUserDefaults] objectForKey:@"PrettyUserId"];
    NSDictionary *dict = [[NSDictionary alloc]initWithObjectsAndKeys:userId,@"userId",self.dateId,@"dateId",self.targetUserId,@"targetUserId",message,@"messageText", nil];
    [curConnection cancelDownload];
    [self.activityIndicator startAnimating];
    self.activityIndicator.hidden = NO;
    self.navigationItem.rightBarButtonItem.enabled = NO;
    [curConnection startDownload:[NodeAsyncConnection createNodeHttpRequest:@"/user/sendMessage" parameters:dict] :self :@selector(didEndReplyDate:)];
    [dict release];
}
- (void)didEndReplyDate:(NodeAsyncConnection *)connection
{
    self.activityIndicator.hidden = YES;
    [self.activityIndicator stopAnimating];
    self.navigationItem.rightBarButtonItem.enabled = YES;
    if (connection==nil || connection.result == nil) return;
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
    {
        [self.navigationController dismissModalViewControllerAnimated:YES];
    }
}
-(void)cancelButtonClicked
{
    self.activityIndicator.hidden = YES;
    [self.activityIndicator stopAnimating];
    [self.navigationController dismissModalViewControllerAnimated:YES];
}
- (void)viewWillAppear:(BOOL)animated
{
    [MobClick beginLogPageView:@"WantJoinDateView"];
    [self.messageTextView becomeFirstResponder];
}
- (void)viewWillDisappear:(BOOL)animated
{
    [MobClick endLogPageView:@"WantJoinDateView"];
}
- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (void)dealloc {
    [[NSNotificationCenter defaultCenter] removeObserver:self name:UITextViewTextDidChangeNotification object:nil];
    [curConnection release];
    [_messageTextView release];
    [dateId release];
    [targetUserId release];
    [_activityIndicator release];
    [_countLabel release];
    [super dealloc];
}
- (void)viewDidUnload {
    [self setMessageTextView:nil];
    [self setActivityIndicator:nil];
    [self setCountLabel:nil];
    [super viewDidUnload];
}
@end
