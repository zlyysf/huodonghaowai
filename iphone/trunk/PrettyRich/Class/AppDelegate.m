//
//  AppDelegate.m
//  PrettyRich
//
//  Created by miao liu on 5/9/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "AppDelegate.h"
#import "DateListViewController.h"
#import "NodeAsyncConnection.h"
#import "PrettyUtility.h"
#import "CustomAlertView.h"
#import "MobClick.h"
#import "MessageViewController.h"
#import <AudioToolBox/AudioToolbox.h>
#import "BFLogginViewController.h"
#import "NNMainTabViewController.h"
#import "AppFirstLaunchViewController.h"
#import "MTStatusBarOverlay.h"
#define kUserName @"PrettyUserName"
#define kUserGender @"PrettyUserGender"
#define kUserId @"PrettyUserId"
#define kUserPhoto @"PrettyUserPhoto"
#define kUserEmail @"PrettyUserEmail"
#define kUserSession @"PrettyUserSession"
//#define kUserAutoShare @"PrettyAutoShare"
#define kAppId @"336893939727736"
#define kAppKey @"50ab13de52701571bd00003a"
#define kAppFirstLaunch @"AppFirstLaunch"

@interface AppDelegate()<MTStatusBarOverlayDelegate>
@property(nonatomic,retain)NSDictionary *pushInfo;
@end

@implementation AppDelegate

@synthesize window,mainNavController,imageCache,curConnection,pushInfo,firstLaunchController;

- (void)dealloc
{
    [firstLaunchController release];
    [window release];
    [imageCache release];
    [mainNavController release];
    [curConnection cancelDownload];
    [curConnection release];
    [pushInfo release];
    [super dealloc];
}
- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
    self.window = [[[UIWindow alloc] initWithFrame:[[UIScreen mainScreen] bounds]] autorelease];
    // Override point for customization after application launch.
    self.window.backgroundColor = [UIColor whiteColor];
    mainNavController = [[UINavigationController alloc]init];
    //facebook = [[Facebook alloc]initWithAppId:kAppId andDelegate:self];
    imageCache = [[NSMutableDictionary alloc] init];
    NodeAsyncConnection * aConn = [[NodeAsyncConnection alloc] init];
	self.curConnection = aConn;
	[aConn release];
    [MobClick startWithAppkey:kAppKey];
    //[MobClick startWithAppkey:kAppKey reportPolicy:REALTIME channelId:nil];
    //[MobClick checkUpdate];
    [MobClick checkUpdate:@"检测到新版本" cancelButtonTitle:@"下次再说" otherButtonTitles:@"去AppStore"];
    [UIApplication sharedApplication].statusBarStyle = UIStatusBarStyleBlackOpaque;
    [[UIApplication sharedApplication]setStatusBarHidden:NO];
    NSUserDefaults *accountDefaults = [NSUserDefaults standardUserDefaults];
    if ([PrettyUtility isNull:[accountDefaults objectForKey:kUserEmail]]||[PrettyUtility isNull:[accountDefaults objectForKey:kUserSession]]) 
    {
        [[NSUserDefaults standardUserDefaults]removeObjectForKey:kUserEmail];
        [[NSUserDefaults standardUserDefaults]removeObjectForKey:kUserSession];
        [[NSUserDefaults standardUserDefaults]removeObjectForKey:kUserName];
        [[NSUserDefaults standardUserDefaults]removeObjectForKey:kUserGender];
        [[NSUserDefaults standardUserDefaults]removeObjectForKey:kUserId];
        //[[NSUserDefaults standardUserDefaults]removeObjectForKey:kLastSign];
        [[NSUserDefaults standardUserDefaults]removeObjectForKey:@"PrettyUserInfo"];
        [[NSUserDefaults standardUserDefaults]removeObjectForKey:kUserPhoto];
        //[[NSUserDefaults standardUserDefaults]removeObjectForKey:@"PrettyFirstClickAdd"];
        //[[NSUserDefaults standardUserDefaults]removeObjectForKey:@"PrettyRegionData"];
        //[[NSUserDefaults standardUserDefaults]removeObjectForKey:@"PrettyRegionLastUpdate"];
        [[NSUserDefaults standardUserDefaults]synchronize];
        mainNavController.navigationBar.hidden = YES;

        BFLogginViewController *bfLogginViewController = [[BFLogginViewController alloc]initWithNibName:@"BFLogginViewController" bundle:nil];
        UINavigationController *bfNav = [[UINavigationController alloc]initWithRootViewController:bfLogginViewController];
        [bfLogginViewController release];
        [mainNavController setViewControllers:[NSArray arrayWithObject:bfNav]];
        [bfNav release];
    }
    else 
    {
        sleep(1);
        [[UIApplication sharedApplication] registerForRemoteNotificationTypes:UIRemoteNotificationTypeBadge | UIRemoteNotificationTypeAlert | UIRemoteNotificationTypeSound];
        NNMainTabViewController *mainTab = [[NNMainTabViewController alloc] init];
        mainNavController.navigationBar.hidden = YES;
        [mainNavController setViewControllers:[NSArray arrayWithObject:mainTab]];
        [mainTab release];
    }
    //NSLog(@"%@",[[NSUserDefaults standardUserDefaults] objectForKey:kUserEmail]);
//    UIImage *gradientImage44 = [[UIImage imageNamed:@"top-bar-pretty-rich.png"] 
//                                resizableImageWithCapInsets:UIEdgeInsetsMake(0, 0, 0, 0)];
//    
//    [[UINavigationBar appearance] setBackgroundImage:gradientImage44 
//                                       forBarMetrics:UIBarMetricsDefault];
//    [[UINavigationBar appearance] setTitleTextAttributes:
//     [NSDictionary dictionaryWithObjectsAndKeys:
//      [UIColor colorWithRed:0.0 green:0.0 blue:0.0 alpha:1.0], 
//      UITextAttributeTextColor, 
//      [UIColor colorWithRed:0.0 green:0.0 blue:0.0 alpha:1.0], 
//      UITextAttributeTextShadowColor, 
//      [NSValue valueWithUIOffset:UIOffsetMake(0, 0)], 
//      UITextAttributeTextShadowOffset, 
//      [UIFont fontWithName:@"HelveticaNeue-Bold" size:18.0], 
//      UITextAttributeFont, 
//      nil]];
    [[UINavigationBar appearance] setTintColor:[UIColor orangeColor]];
    [[UITabBar appearance] setSelectedImageTintColor:[UIColor orangeColor]];
    NSDictionary *remoteNotif = [launchOptions objectForKey: UIApplicationLaunchOptionsRemoteNotificationKey];
    [self.window setRootViewController:self.mainNavController];
    [self.window makeKeyAndVisible];
    [self handlePushInfo:remoteNotif];
    if (![[NSUserDefaults standardUserDefaults] boolForKey:kAppFirstLaunch])
    {
        [[NSUserDefaults standardUserDefaults] setBool:YES forKey:kAppFirstLaunch];
        firstLaunchController = [[AppFirstLaunchViewController alloc]initWithNibName:@"AppFirstLaunchViewController" bundle:nil];
        firstLaunchController.view.frame = self.window.frame;
        //[self.mainNavController presentModalViewController:firstLaunchController animated:NO];
        [self.window addSubview:firstLaunchController.view];
        //[firstLaunchController release];
    }

    return YES;
}
- (void)applicationWillResignActive:(UIApplication *)application
{
    /*
     Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
     Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
     */
}

- (void)applicationDidEnterBackground:(UIApplication *)application
{
    /*
     Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later. 
     If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
     */
}

- (void)applicationWillEnterForeground:(UIApplication *)application
{
    /*
     Called as part of the transition from the background to the inactive state; here you can undo many of the changes made on entering the background.
     */
}

- (void)applicationDidBecomeActive:(UIApplication *)application
{
    //NSLog(@"DidBecomeAvtive!");
    //[[self facebook] extendAccessTokenIfNeeded];
    application.applicationIconBadgeNumber = 0;

//    NSString *email = [[NSUserDefaults standardUserDefaults] objectForKey:kUserEmail];
//    if (![PrettyUtility isNull:email] && ![PrettyUtility isNull:[[NSUserDefaults standardUserDefaults]  objectForKey:kUserSession]]) 
//        {
//            NSDate *lastSign = [[NSUserDefaults standardUserDefaults] objectForKey:kLastSign];
//            if ([PrettyUtility isNull:lastSign]) 
//            {
//                [self startSignIn];
//            }
//            else {
//                NSDate *today = [NSDate date];
//                if (![PrettyUtility twoDateIsSameDay:lastSign second:today]) 
//                {
//                    [self startSignIn];
//                }
//            }
//        }

    /*
     Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
     */
}

- (void)applicationWillTerminate:(UIApplication *)application
{
    /*
     Called when the application is about to terminate.
     Save data if appropriate.
     See also applicationDidEnterBackground:.
     */
    [self.imageCache removeAllObjects];
}
- (void)applicationDidReceiveMemoryWarning:(UIApplication *)application
{
    // clean photo cache
    [self.imageCache removeAllObjects];
}
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
	NodeAsyncConnection *asyConnection = [[NodeAsyncConnection alloc]init];
    NSString *deviceTokenStr = [[deviceToken description] stringByTrimmingCharactersInSet:[NSCharacterSet characterSetWithCharactersInString:@"<>"]];
	deviceTokenStr = [deviceTokenStr stringByReplacingOccurrencesOfString:@" " withString:@""];
    //NSLog(@"device token: %@", deviceTokenStr);
    NSString *userId = [[NSUserDefaults standardUserDefaults] objectForKey:kUserId];
    NSDictionary *dict = [[NSDictionary alloc]initWithObjectsAndKeys:userId,@"userId",deviceTokenStr,@"appToken", nil];
    [asyConnection startDownload:[NodeAsyncConnection createNodeHttpRequest:@"/user/updateAppToken" parameters:dict] :self :@selector(didEndUpdateAppToken:)];
    [dict release];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
	//NSLog(@"notification error %@",error);
}
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
{
    if ([application respondsToSelector:@selector(applicationState)] && application.applicationState != UIApplicationStateActive) 
    {
        [self handlePushInfo:userInfo];
    }
    else
    {
        if([application enabledRemoteNotificationTypes] & UIRemoteNotificationTypeSound)
        {
        AudioServicesPlaySystemSound(kSystemSoundID_Vibrate);
        }
        NSString *type = [[userInfo objectForKey:@"data"]objectForKey:@"type"];
        if ([type isEqualToString:@"sendMessage"] || [type isEqualToString:@"confirmDate"]|| [type isEqualToString:@"cancelDate"])
        {
            BOOL hasFoundMessageView = NO;
            //for(UIViewController *controller in mainNavController.viewControllers)
            //{
                NSString * className = NSStringFromClass([mainNavController.visibleViewController class]);
                if ([className isEqualToString:@"MessageViewController"]) 
                {
                    NSString *dateId = [[userInfo objectForKey:@"data"]objectForKey:@"dateId"];
                    NSString *targetId = [[userInfo objectForKey:@"data"]objectForKey:@"userId"];
                    MessageViewController *messageViewController = (MessageViewController *)mainNavController.visibleViewController;
                    if (messageViewController.dateId!=nil && [messageViewController.dateId isEqualToString:dateId] && messageViewController.targetId != nil && [messageViewController.targetId isEqualToString:targetId]) 
                    {
                        hasFoundMessageView = YES;
                        if ([messageViewController respondsToSelector:@selector(updateMessageViewForPush:)])
                        {
                            NSDictionary *dateDict = [[NSDictionary alloc]initWithDictionary:userInfo];
                            [messageViewController updateMessageViewForPush:dateDict];
                            [dateDict release];
                        }
                        //break;
                    }
                }
            //}
            if (!hasFoundMessageView)
            {
                NSDictionary *pushNotificationInfo = [[NSDictionary alloc] initWithObjectsAndKeys:type,@"pushType", nil];
                [[NSNotificationCenter defaultCenter] postNotificationName:@"NewPushReceived" object:nil userInfo:pushNotificationInfo];
                [pushNotificationInfo release];
                //[[NSNotificationCenter defaultCenter]postNotificationName:@"NewPushReceived" object:nil];
                NSString *content = [[userInfo objectForKey:@"aps"]objectForKey:@"alert"];
                self.pushInfo = [NSDictionary dictionaryWithDictionary:userInfo];
                MTStatusBarOverlay *overlay = [MTStatusBarOverlay sharedInstance];
                overlay.delegate = self;
                [overlay postFinishMessage:content duration:7.0 animated:YES];

            }
        }
        else if ([type isEqualToString:@"systemBroadMessage"])
        {
            NSString *content = [[userInfo objectForKey:@"aps"]objectForKey:@"alert"];
            CustomAlertView *alert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:content otherButton:nil cancelButton:@"确定" delegate:nil duration:0];
            [alert show];
            [alert release];
        }
        else 
        {
            NSString *content = [[userInfo objectForKey:@"aps"]objectForKey:@"alert"];
            self.pushInfo = [NSDictionary dictionaryWithDictionary:userInfo];
            MTStatusBarOverlay *overlay = [MTStatusBarOverlay sharedInstance];
            overlay.delegate = self;
            [overlay postFinishMessage:content duration:7.0 animated:YES];
        }
    }
      
}
- (void)handlePushInfo:(NSDictionary *)info
{
    //NSLog(@"%@",[info description]);
    if (info == nil)
    {
        return;
    }
    NSString *type = [[info objectForKey:@"data"]objectForKey:@"type"];
    if ([type isEqualToString:@"sendMessage"] || [type isEqualToString:@"confirmDate"]|| [type isEqualToString:@"cancelDate"])
    {
        BOOL hasFoundMessageView = NO;
        //for(UIViewController *controller in mainNavController.viewControllers)
        //{
            NSString * className = NSStringFromClass([mainNavController.visibleViewController class]);
            if ([className isEqualToString:@"MessageViewController"]) 
            {
                NSString *dateId = [[info objectForKey:@"data"]objectForKey:@"dateId"];
                NSString *targetId = [[info objectForKey:@"data"]objectForKey:@"userId"];
                MessageViewController *messageViewController = (MessageViewController *)mainNavController.visibleViewController;
                if (messageViewController.dateId!=nil && [messageViewController.dateId isEqualToString:dateId]&& messageViewController.targetId != nil && [messageViewController.targetId isEqualToString:targetId]) 
                {
                    hasFoundMessageView = YES;
                    if ([messageViewController respondsToSelector:@selector(updateMessageViewForPush:)])
                    {
                        NSDictionary *dateDict = [[NSDictionary alloc]initWithDictionary:info];
                        [messageViewController updateMessageViewForPush:dateDict];
                        [dateDict release];
                    }
                    //break;
                }
            }
        //}
        if (!hasFoundMessageView)
        {
//doubleconfirm true ->refresh confirm false(empty)-> datesenderid 1.self->refresh sent 2.not self ->refresh receive
            NSDictionary *pushNotificationInfo = [[NSDictionary alloc] initWithObjectsAndKeys:type,@"pushType", nil];
            [[NSNotificationCenter defaultCenter] postNotificationName:@"NewPushReceived" object:nil userInfo:pushNotificationInfo];
            [pushNotificationInfo release];
            MessageViewController *messageViewController = [[MessageViewController alloc]initWithNibName:@"MessageViewController" bundle:nil];
            
            //NSString *targetUrl;
            //NSMutableDictionary *dateInfo = [self.activeDateArray objectAtIndex:indexPath.row];
            //NSMutableDictionary *responderDict = [[dateInfo objectForKey:@"responders"] objectAtIndex:0];
            NSString *dateId = [[info objectForKey:@"data"]objectForKey:@"dateId"];
            NSString *targetId = [[info objectForKey:@"data"]objectForKey:@"userId"];
           
            //NSDictionary *sender = [dateInfo objectForKey:@"sender"];
            
            NSString *targetName = [[info objectForKey:@"data"]objectForKey:@"userName"];
            //NSString *profileUrl = [sender objectForKey:@"primaryPhotoPath"];
            
//            if (![PrettyUtility isNull:profileUrl])
//            {
//                targetUrl = [PrettyUtility getPhotoUrl:profileUrl :@"fw"];
//                messageViewController.targetUrl = targetUrl;
//            }
            
            //messageViewController.dateDict = dateInfo;
            messageViewController.isPresentView = YES;
            messageViewController.dateId = dateId;
            messageViewController.targetId = targetId;
            messageViewController.targetName = targetName;
            [mainNavController.visibleViewController presentModalViewController:messageViewController animated:YES];
            [messageViewController release];
            [[NSNotificationCenter defaultCenter] postNotificationName:@"ClearPushReceived" object:nil userInfo:nil];
//            CustomTabbarViewController *tabbar = [[CustomTabbarViewController alloc]init];
//            if (![PrettyUtility isNull:[[info objectForKey:@"data"]objectForKey:@"doubleConfirmed"]]&&[[[info objectForKey:@"data"]objectForKey:@"doubleConfirmed"]boolValue])
//            {
//                tabbar.dateListController.dateListType = DateListTypeConfirmed;
//            }
//            else {
//                NSString *dateSenderId = [[info objectForKey:@"data"]objectForKey:@"dateSenderId"];
//                if ([dateSenderId isEqualToString:[[NSUserDefaults standardUserDefaults]objectForKey:kUserId]]) 
//                {
//                    tabbar.dateListController.dateListType = DateListTypeSent;
//                }
//                else 
//                {
//                    tabbar.dateListController.dateListType = DateListTypeConfirmed;
//                }
//            }
//                    
//            for(UIView *view in self.window.subviews){
//                if([view isKindOfClass:[CustomAlertView class]] || [view isKindOfClass:[CustomActionSheetView class]]||[view isKindOfClass:[CustomPopoverView class]]){
//                    [view removeFromSuperview];
//                    break;
//                }
//            }
//            UIImage *gradientImage44 = [[UIImage imageNamed:@"top-bar-pretty-rich.png"] 
//                                        resizableImageWithCapInsets:UIEdgeInsetsMake(0, 0, 0, 0)];
//            [[UINavigationBar appearance] setBackgroundImage:gradientImage44 
//                                               forBarMetrics:UIBarMetricsDefault];
//            [mainNavController dismissModalViewControllerAnimated:YES];
//            [tabbar selectedTab:tabbar.dateListButton];
//            mainNavController.navigationBar.hidden = YES;
//            [mainNavController setViewControllers:[NSArray arrayWithObject:tabbar]];
//            [tabbar release];
        }
    }
//    else if ([type isEqualToString:@"firstGetCreditForPhotoBeLiked"] || [type isEqualToString:@"photoFirstApproved"]) 
//    {
//        CustomTabbarViewController *tabbar = [[CustomTabbarViewController alloc]init];
//        for(UIView *view in self.window.subviews){
//            if([view isKindOfClass:[CustomAlertView class]] || [view isKindOfClass:[CustomActionSheetView class]]||[view isKindOfClass:[CustomPopoverView class]]){
//                [view removeFromSuperview];
//                break;
//            }
//        }
//        UIImage *gradientImage44 = [[UIImage imageNamed:@"top-bar-pretty-rich.png"] 
//                                    resizableImageWithCapInsets:UIEdgeInsetsMake(0, 0, 0, 0)];
//        [[UINavigationBar appearance] setBackgroundImage:gradientImage44 
//                                           forBarMetrics:UIBarMetricsDefault];
//        [mainNavController dismissModalViewControllerAnimated:YES];
//        [tabbar selectedTab:tabbar.profileButton];
//        mainNavController.navigationBar.hidden = YES;
//        [mainNavController setViewControllers:[NSArray arrayWithObject:tabbar]];
//        [tabbar release];
//        
//    }
//    else if ([type isEqualToString:@"sendDate"])
//    {
//        CustomTabbarViewController *tabbar = [[CustomTabbarViewController alloc]init];
//        tabbar.dateListController.dateListType = DateListTypeReceived;
//        for(UIView *view in self.window.subviews){
//            if([view isKindOfClass:[CustomAlertView class]] || [view isKindOfClass:[CustomActionSheetView class]]||[view isKindOfClass:[CustomPopoverView class]]){
//                [view removeFromSuperview];
//                break;
//            }
//        }
//        UIImage *gradientImage44 = [[UIImage imageNamed:@"top-bar-pretty-rich.png"] 
//                                    resizableImageWithCapInsets:UIEdgeInsetsMake(0, 0, 0, 0)];
//        [[UINavigationBar appearance] setBackgroundImage:gradientImage44 
//                                           forBarMetrics:UIBarMetricsDefault];
//        [mainNavController dismissModalViewControllerAnimated:YES];
//        [tabbar selectedTab:tabbar.dateListButton];
//        mainNavController.navigationBar.hidden = YES;
//        [mainNavController setViewControllers:[NSArray arrayWithObject:tabbar]];
//        [tabbar release];
//        
//    }
//    else if ([type isEqualToString:@"notifyDateInAdvance"])
//    {
//        CustomTabbarViewController *tabbar = [[CustomTabbarViewController alloc]init];
//        tabbar.dateListController.dateListType = DateListTypeConfirmed;
//        for(UIView *view in self.window.subviews){
//            if([view isKindOfClass:[CustomAlertView class]] || [view isKindOfClass:[CustomActionSheetView class]]||[view isKindOfClass:[CustomPopoverView class]]){
//                [view removeFromSuperview];
//                break;
//            }
//        }
//        UIImage *gradientImage44 = [[UIImage imageNamed:@"top-bar-pretty-rich.png"] 
//                                    resizableImageWithCapInsets:UIEdgeInsetsMake(0, 0, 0, 0)];
//        [[UINavigationBar appearance] setBackgroundImage:gradientImage44 
//                                           forBarMetrics:UIBarMetricsDefault];
//        [mainNavController dismissModalViewControllerAnimated:YES];
//        [tabbar selectedTab:tabbar.dateListButton];
//        mainNavController.navigationBar.hidden = YES;
//        [mainNavController setViewControllers:[NSArray arrayWithObject:tabbar]];
//        [tabbar release];
//
//    }

}
- (void)statusBarOverlayDidRecognizeGesture:(UIGestureRecognizer *)gestureRecognizer
{
    MTStatusBarOverlay *overlay = [MTStatusBarOverlay sharedInstance];
    [overlay hide];
    [self handlePushInfo:pushInfo];
}
- (void)didEndUpdateAppToken:(NodeAsyncConnection *)connection
{
    [connection release];
}
//- (void)startSignIn
//{
//    //NSLog(@"start sign in");
//    [curConnection cancelDownload];
//    NSString *userId = [[NSUserDefaults standardUserDefaults] objectForKey:kUserId];
//    NSDictionary *dict = [[NSDictionary alloc]initWithObjectsAndKeys:userId,@"userId", nil];
//    [curConnection startDownload:[NodeAsyncConnection createNodeHttpRequest:@"/user/signIn" parameters:dict] :self :@selector(didEndSignIn:)];
//    [dict release];
//
//}
//- (void)didEndSignIn:(NodeAsyncConnection *)connection
//{
//    if (connection ==nil || connection.result == nil) {
//        return;
//    }
//    if ([[connection.result objectForKey:@"status"]isEqualToString:@"success"])
//    {
//        NSDictionary *result = [connection.result objectForKey:@"result"];
//        BOOL dailyFirst = [[result objectForKey:@"beDailyFirst"] boolValue];
//        if (dailyFirst) 
//        {
//            NSDate *today = [NSDate date];
//            [[NSUserDefaults standardUserDefaults]setObject:today forKey:kLastSign];
//            [[NSUserDefaults standardUserDefaults]synchronize];
//            CustomAlertView *alert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:@"Welcome back to PrettyRich. We deeply appreciate the time of loyal users. Hope you will find your perfect date!" otherButton:nil cancelButton:@"Ok" delegate:nil duration:0];
//            [alert show];
//            [alert release];
//        }
//    }
//}
//- (void)didFailUpdatingLocation:(NSError *)error
//{
//    //NSLog(@"%@",[error description]);
//}
//- (void)didQueryNewLocation:(CLLocation *) newLocation
//{
//    [SVGeocoder reverseGeocode:newLocation.coordinate
//                    completion:^(NSArray *placemarks, NSError *error) {
//                        
//                        if(!error && placemarks) {
//                            NSDictionary *region = [[NSDictionary alloc]initWithDictionary:[placemarks objectAtIndex:0]];
//                            [[NSUserDefaults standardUserDefaults]setObject:region forKey:@"PrettyRegionData"];
//                            NSDate *date = [NSDate date];
//                            [[NSUserDefaults standardUserDefaults]setObject:date forKey:@"PrettyRegionLastUpdate"];
//                            [[NSUserDefaults standardUserDefaults]synchronize];
//                            [self startUpdateLocation:region];
//                            [region release];
//                            
//                        } else 
//                        {
//                            //should we still use the old region data?
//                        }
//                    }];
//
//}

//- (void)startUpdateLocation:(NSDictionary *)region
//{
//    NodeAsyncConnection *asyConnection = [[NodeAsyncConnection alloc]init];
//    NSString *userId = [[NSUserDefaults standardUserDefaults] objectForKey:kUserId];
//    NSDictionary *dict = [[NSDictionary alloc]initWithObjectsAndKeys:userId,@"userId",region,@"region",@"googleV3",@"geolibType",[PrettyUtility getlatlng:region],@"latlng", nil];
//    [asyConnection startDownload:[NodeAsyncConnection createNodeHttpRequest:@"/user/updateLocation" parameters:dict] :self :@selector(didEndUpdateLocation:)];
//    [dict release];
//
//}
//- (void)didEndUpdateLocation:(NodeAsyncConnection *)connection
//{
//    [connection release];
//}
@end
