//
//  PrettyGlobalService.m
//  PrettyRich
//
//  Created by liu miao on 6/28/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "PrettyGlobalService.h"
#import "CustomAlertView.h"
#import "AppDelegate.h"
#import "BFLogginViewController.h" 
#import "PrettyUtility.h"
@implementation PrettyGlobalService
static PrettyGlobalService *instance;
+(PrettyGlobalService *) shareInstance
{
    if (instance == nil) 
    {
        instance = [[PrettyGlobalService alloc] init];
    }
    return instance;
}

- (void)startUploadPhoto:(UIImage*)uploadImage forUrl:(NSString *)photoUrl;
{
    NodeAsyncConnection *asyConnection = [[NodeAsyncConnection alloc]init];
    NSData *imageData = UIImageJPEGRepresentation(uploadImage, 0.6);
    NSString *userId = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserId"];
    NSDictionary *dict = [[NSDictionary alloc]initWithObjectsAndKeys:imageData,@"image",userId,@"userId",[NSNumber numberWithFloat:uploadImage.size.width],@"width",[NSNumber numberWithFloat:uploadImage.size.height],@"height",nil];
    NSMutableURLRequest *request = [NodeAsyncConnection createUploadPhotoRequest:@"/user/uploadPhoto" parameters:dict];
    asyConnection.customData = photoUrl;
    [asyConnection startDownload:request :self :@selector(didEndUploadPhoto:)];
    [dict release];

}
- (void)didEndUploadPhoto:(NodeAsyncConnection *)connection
{
    if (connection == nil || connection.result == nil)
    {
        [connection release];
        return;
    }
    
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
    {
        NSDictionary *result = [connection.result objectForKey:@"result"];
        if ([[result objectForKey:@"firstUpload"] boolValue])
        {
            CustomAlertView *alert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:@"Congratulations on your first photo upload. You will earn 1 credit, once this photo is approved. Every time you upload a photo, you will earn 1 credit." otherButton:nil cancelButton:@"Ok" delegate:nil duration:0];
            [alert show];
            [alert release];
        }
        NSString *photoUrl = (NSString *)connection.customData;
        NSString *photoId = [result objectForKey:@"photoId"];
        NSDictionary *photoUploadNotificationInfo = [[NSDictionary alloc] initWithObjectsAndKeys:photoId,@"photoId",photoUrl,@"photoUrl", nil];
        [[NSNotificationCenter defaultCenter] postNotificationName:@"PhotoUploadPhotoNotification" object:nil userInfo:photoUploadNotificationInfo];
        [photoUploadNotificationInfo release];
        [connection release];
    }

}
- (void)startUploadPhoto:(UIImage*)uploadImage forPrimaryPhoto:(BOOL)setPrimary;
{
    //NodeAsyncConnection *asyConnection = [[NodeAsyncConnection alloc]init];
    //UIImage *newImage = [PrettyUtility correctImageOrientation:self.uploadImage :960];
    NodeAsyncConnection *asyConnection = [[NodeAsyncConnection alloc]init];
    NSData *imageData = UIImageJPEGRepresentation(uploadImage, 0.6);
    NSString *forPrimary;
    if (setPrimary) {
        forPrimary = @"1";
    }
    else
    {
        forPrimary = @"0";
    }
    NSString *userId = [[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserId"];
    NSDictionary *dict = [[NSDictionary alloc]initWithObjectsAndKeys:imageData,@"image",userId,@"userId",[NSNumber numberWithFloat:uploadImage.size.width],@"width",[NSNumber numberWithFloat:uploadImage.size.height],@"height",[NSNumber numberWithBool:setPrimary],@"setPrimary",nil];
    NSMutableURLRequest *request = [NodeAsyncConnection createUploadPhotoRequest:@"/user/uploadPhoto" parameters:dict];
    asyConnection.customData = forPrimary;
    [asyConnection startDownload:request :self :@selector(endUploadPhoto:)];
    [dict release];
    
}
- (void)endUploadPhoto:(NodeAsyncConnection *)connection
{
    [connection release];
    if (connection == nil || connection.result == nil)
    {
        [connection release];
        return;
    }
    
    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
    {
        NSDictionary *result = [connection.result objectForKey:@"result"];
        NSString *forPrimary = (NSString *)connection.customData;
        if ([forPrimary isEqualToString:@"1"])
        {
            NSString *primaryPhotoPath = [result objectForKey:@"photoPath"];
            if (![PrettyUtility isNull:primaryPhotoPath])
            {
                [[NSUserDefaults standardUserDefaults] setObject:primaryPhotoPath forKey:@"PrettyUserPhoto"];
                NSDictionary *preUserInfo = [[NSUserDefaults standardUserDefaults]dictionaryForKey:@"PrettyUserInfo"];
                NSMutableDictionary *userInfo = [[NSMutableDictionary alloc]initWithDictionary:preUserInfo];
                [userInfo setObject:primaryPhotoPath forKey:@"primaryPhotoPath"];
                [[NSUserDefaults standardUserDefaults] setObject:userInfo forKey:@"PrettyUserInfo"];
                [userInfo release];
                [[NSUserDefaults standardUserDefaults] synchronize];
            }
        }
    }

//    NSLog(@"%@",connection.result);
//    //    if (connection == nil || connection.result == nil)
//    //    {
//    //        [connection release];
//    //        return;
//    //    }
//    //    
//    //    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
//    //    {
//    //        NSDictionary *result = [connection.result objectForKey:@"result"];
//    //        if ([[result objectForKey:@"firstUpload"] boolValue])
//    //        {
//    //            CustomAlertView *alert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:@"Congratulations on your first photo upload. You will earn 1 credit, once this photo is approved. Every time you upload a photo, you will earn 1 credit." otherButton:nil cancelButton:@"Ok" delegate:nil duration:0];
//    //            [alert show];
//    //            [alert release];
//    //        }
//        //[connection release];
//    //}
//    
}

- (void)handleError:(NSString *)errorCode
{
    NSString *errorMessage;
    BOOL useDialog = NO;
    BOOL shouldPop = YES;
    switch ([errorCode intValue]) {
        case 21010:case 21011:case 21012:case 21013:case 21020:case 21021:case 21022:case 21023:case 21024:case 21030:case 21031:case 21033:case 21034:case 21035:case 21050:case 21051:case 21070:case 21071:case 21072:case 21202:
            shouldPop = NO;
            break;
        case 21032:
            errorMessage = @"这个活动不存在.";
            break;
        case 21036:
            errorMessage = @"这个活动不存在这个响应者.";
            break;
        case 21040:
            errorMessage = @"不能删除自己的头像!";
            break;
        case 21041:
            errorMessage = @"照片已经被删除.";
            break;
        case 21042:
            errorMessage = @"只有照片所有人才能删除这照片.";
            break;
        case 21043:
            errorMessage = @"你不是照片的所有人，不能把它设置为主照片.";
            break;
        case 21044:
            errorMessage = @"这张照片涉及到不合适的内容，不能设置成您的个人头像.";
            break;
        case 21045:
            errorMessage = @"抱歉，该照片正在等待审核，请稍等.";
            break;
        case 21060:
            errorMessage = @"你没有权限做这个操作，因为你没有审核通过的照片.";
            useDialog = YES;
            break;
        case 21073:
            errorMessage = @"此照片不存在.";
            break;
        case 21080:
            errorMessage = @"取不到用户性别信息，请登录.";
            break;
        case 21081:
            errorMessage = @"此用户不存在.";
            break;
        case 21082:
            errorMessage = @"该电子邮件地址已经被使用，请重新选择新的电子邮件地址进行注册.";
            break;
        case 21083:case 21084:
            errorMessage = @"用户名或密码错误.";
            break;
        case 21085:
            errorMessage = @"用户未登陆.";
            [self prettyRichLogOut];
            break;
        case 21086:
            shouldPop = NO;
            [self prettyRichLogOut];
            break;
        case 21087:
            errorMessage = @"由于您的不合规使用，该账号已经被停用.";
            break;
        case 21088:
            errorMessage = @"请重新登录.";
            [self prettyRichLogOut];
            break;
        case 21090:
            errorMessage = @"不存在这条消息.";
            break;
        case 21091:
            errorMessage = @"不能自己给自己发消息.";
            break;
        case 21092:
            errorMessage = @"对话中不能没有活动的创建者.";
            break;
        case 21093:
            errorMessage = @"两方用户间需要有聚会的创建者.";
            break;
        case 21100:
            errorMessage = @"密码太短.";
            break;
        case 21200:
            errorMessage = @"只有活动的发起者才能批准对方加入.";
            break;
        case 21201:
            errorMessage = @"你已经批准了同一个响应者加入这个聚会.";
            break;
        case 21203:
            errorMessage = @"只有聚会的发起者才能取消对方加入.";
            break;
        case 21220:
            errorMessage = @"你已经评价了活动的参与者.";
            break;
        case 21221:
            errorMessage = @"你已经评价了活动的发起者.";
            break;
        case 21230:
            errorMessage = @"你已经批准了这个响应者加入这个活动.";
            break;
        case 21231:
            errorMessage = @"活动已经停止.";
            break;
        case 21232:
            errorMessage = @"你不是活动的发起者.";
            break;
        case 21233:
            errorMessage = @"你还没有批准这个活动响应者.";
            break;
        case 21240:
            errorMessage = @"不能修改学号.";
            break;
        case 21250:
            errorMessage = @"没有这个学校.";
            break;
        case 21300:
            errorMessage = @"这个人人帐号已经被注册.";
            break;
        case 21301:
            errorMessage = @"用户已经与这个人人帐号绑定.";
            break;
        case 21302:
            errorMessage = @"用户已经与其它的人人帐号绑定.";
            break;
        case 21303:
            errorMessage = @"这个人人帐号已经与这个用户绑定.";
            break;
        case 21304:
            errorMessage = @"这个人人帐号已经与其他的用户绑定.";
            break;
        case 21305:
            errorMessage = @"这个人人帐号尚未与任何用户绑定.";
            break;
        default:
            errorMessage = @"内部错误. 请检查您的网络设置或者稍后重试.";
            break;
    }
    if (shouldPop)
    {
        if (!useDialog)
        {
            CustomAlertView *errorAlert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:errorMessage otherButton:nil cancelButton:nil delegate:nil duration:3.5];
            [errorAlert show];
            [errorAlert release];
        }
        else {
            CustomAlertView *errorAlert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:errorMessage otherButton:nil cancelButton:@"确定" delegate:nil duration:0];
            [errorAlert show];
            [errorAlert release];
        }
    }
    
    
}
- (void)prettyRichLogOut
{
    AppDelegate *appDelegate = [[UIApplication sharedApplication]delegate];
    for(UIView *view in appDelegate.window.subviews){
        if([view isKindOfClass:[CustomAlertView class]]){
            [view removeFromSuperview];
            break;
        }
    }
    [appDelegate.imageCache removeAllObjects];
    [[Renren sharedRenren]logout:self];
    //UIImage *gradientImage44 = [[UIImage imageNamed:@"top-bar-pretty-rich.png"]
                                //resizableImageWithCapInsets:UIEdgeInsetsMake(0, 0, 0, 0)];
    //[[UINavigationBar appearance] setBackgroundImage:gradientImage44
                                       //forBarMetrics:UIBarMetricsDefault];
    //NSLog(@"%@",[NSUserDefaults standardUserDefaults]);
    //[[NSUserDefaults standardUserDefaults]removeObjectForKey:@"PrettyUserCredit"];
    [[NSUserDefaults standardUserDefaults]removeObjectForKey:@"PrettyUserName"];
    [[NSUserDefaults standardUserDefaults]removeObjectForKey:@"PrettyUserGender"];
    [[NSUserDefaults standardUserDefaults]removeObjectForKey:@"PrettyUserId"];
    //[[NSUserDefaults standardUserDefaults]removeObjectForKey:@"PrettyLastSign"];
    //[[NSUserDefaults standardUserDefaults]removeObjectForKey:@"PrettyFirstClickAdd"];
    [[NSUserDefaults standardUserDefaults]removeObjectForKey:@"PrettyUserEmail"];
    //[[NSUserDefaults standardUserDefaults]removeObjectForKey:@"PrettyAutoShare"];
    [[NSUserDefaults standardUserDefaults]removeObjectForKey:@"PrettyUserSession"];
    [[NSUserDefaults standardUserDefaults]removeObjectForKey:@"PrettyUserPhoto"];
    [[NSUserDefaults standardUserDefaults]removeObjectForKey:@"PrettyUserInfo"];
    [[NSUserDefaults standardUserDefaults]synchronize];
    BFLogginViewController *bfLogginViewController = [[BFLogginViewController alloc]initWithNibName:@"BFLogginViewController" bundle:nil];
    UINavigationController *bfNav = [[UINavigationController alloc]initWithRootViewController:bfLogginViewController];
    [bfLogginViewController release];
    [appDelegate.mainNavController setViewControllers:[NSArray arrayWithObject:bfNav]];
    [bfNav release];
}
-(void)publishFirstRenRenConnectFeed
{
    NSMutableDictionary *params = [NSMutableDictionary dictionaryWithObjectsAndKeys:
                                   @"feed.publishFeed",@"method",
                                   @"http://www.huodonghaowai.com",@"url",
                                   @"活动号外",@"name",
                                   @"我加入了活动号外",@"message",
                                   @"加入活动号外",@"action_name",
                                   @"http://www.huodonghaowai.com",@"action_link",
                                   @"中国第一个为大学生组织个性化活动的手机平台!",@"description",
                                   @"http://oss.aliyuncs.com/ysf1/resource/app-icon.png",@"image",
                                   nil];
    
    [[Renren sharedRenren] requestWithParams:params andDelegate:self];
    
}
- (void)renren:(Renren *)renren requestDidReturnResponse:(ROResponse*)response
{
    
}
- (void)renren:(Renren *)renren requestFailWithError:(ROError*)error
{
//	NSString *title = [NSString stringWithFormat:@"Error code:%d", [error code]];
//	NSString *description = [NSString stringWithFormat:@"%@", [error.userInfo objectForKey:@"error_msg"]];
//	NSLog(@"loginfail:%@ %@",title,description);
}

- (void)dealloc
{
    [super dealloc];
}
@end
