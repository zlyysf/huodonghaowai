//
//  MessageViewController.h
//  PrettyRich
//
//  Created by miao liu on 5/16/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>
#import "NodeAsyncConnection.h"
#import "ImagesDownloadManager.h"
#import "ImageDownloaderDelegate.h"
#import "EGORefreshTableHeaderView.h"
#import "MessageSendOperation.h"
#import "MessageGetOperation.h"
#import "CustomAlertView.h"
#import "HPGrowingTextView.h"
//#import "DateDatailView.h"
typedef enum MessageViewType
{
    MessageViewTypeSender = 0,
    MessageViewTypeInvited = 1,
    MessageViewTypeRequesting = 2,
}MessageViewType;
typedef enum ConfirmState
{
    confirmStateNotPast = 0,
    confirmStatePastNotRate = 1,
    confirmStateRated=2,
}ConfirmState;
@class MessageUIView;
@interface MessageViewController : UIViewController<UITableViewDataSource,UITableViewDelegate,UITextFieldDelegate,ImageDownloaderDelegate,EGORefreshTableHeaderDelegate,MessageSendOperationDelegate,MessageGetOperationDelegate,CustomAlertViewDelegate,HPGrowingTextViewDelegate>
{
    MessageUIView *messageListView;
    UIView *bottomView;
    NSMutableArray *contentArray;
    NSMutableDictionary *dateDict;
    NSString *targetId;
    NSString *targetName;
    NSString *dateId;
    BOOL isFirstLoad;
    NSMutableDictionary *messageOption;
    MessageViewType messageViewType;
    ImagesDownloadManager * imageDownloadManager;
    BOOL canSendMessage;
    NodeAsyncConnection *curConnection;
    ConfirmState confirmState; 
    NSDictionary *speakerInfo;
    int targetInfoIndex;
    NSString *targetUrl;
}
@property (retain, nonatomic) IBOutlet UINavigationItem *topNavigationItem;
@property (nonatomic, retain) HPGrowingTextView *textView;
@property (retain, nonatomic) IBOutlet UIBarButtonItem *backButton;
@property (retain, nonatomic) IBOutlet UIImageView *chatBGView;
@property(nonatomic,retain)IBOutlet UITableView *messageListView;
@property(nonatomic,retain)IBOutlet UIView *bottomView;
@property(nonatomic,retain)NSMutableArray *contentArray;
@property(nonatomic,retain)NSMutableDictionary *messageOption;
@property(nonatomic,retain)NSDictionary *speakerInfo;
@property(nonatomic,readwrite)BOOL isFirstLoad;
@property(nonatomic,readwrite)BOOL isSenderConfirmed;
@property(nonatomic,readwrite)BOOL isPresentView;
@property(nonatomic,readwrite)int targetInfoIndex;
@property(nonatomic,retain)NSString *targetId;
@property(nonatomic,retain)NSString *targetName;
@property(nonatomic,retain)NSString *targetUrl;
@property(nonatomic,retain)NSString *dateId;
@property(nonatomic,retain)NSOperationQueue *operationSendMessageQueue;
@property(nonatomic,retain)NSOperationQueue *operationGetMessageQueue;
@property(nonatomic,readwrite)MessageViewType messageViewType;
@property(nonatomic,readwrite)ConfirmState confirmState;
@property(nonatomic,retain)ImagesDownloadManager * imageDownloadManager;
@property(nonatomic,retain)NSMutableDictionary *dateDict;
@property(nonatomic,retain)NSMutableDictionary *latestMessageDict;
@property(nonatomic,retain) NodeAsyncConnection *curConnection;
@property(nonatomic, retain) EGORefreshTableHeaderView * refreshHeaderView;
@property(nonatomic, readwrite) BOOL isLoadingEarlier;
@property(nonatomic,readwrite)BOOL keyBoardIsUp;
@property (retain, nonatomic) IBOutlet UIBarButtonItem *disqualificationButton;
@property (retain, nonatomic) IBOutlet UIBarButtonItem *approveButton;
@property (retain, nonatomic) IBOutlet UIBarButtonItem *rateButton;
@property (retain, nonatomic) IBOutlet UIActivityIndicatorView *activityIndicator;
@property (retain, nonatomic) UILabel *chatPlaceHolder;
-(IBAction)disqualification;
-(IBAction)approve;
-(IBAction)rate;
- (IBAction)backButtonClicked;
-(void)sendButtonClicked;
- (void)autoRefresh;
- (void)startGetMessageHistory;
- (void)didEndGetMessageHistory:(NodeAsyncConnection *)connection;
- (void)startConfirmDate:(BOOL)beCancel;
- (void)didEndConfirmDate:(NodeAsyncConnection *)connection;
- (void)startSendMessage;
- (void)loadEarlier;
- (void)updateMessageViewForPush:(NSDictionary *)pushInfo;
- (void)synchroniseMessage;
- (BOOL)hasMessage:(NSString *)messageId;
- (void) deleteOneMessage:(NSString *)messageId;
@end
