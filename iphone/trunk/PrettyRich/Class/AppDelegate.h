//
//  AppDelegate.h
//  PrettyRich
//
//  Created by miao liu on 5/9/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
@class CustomTabbarViewController,NodeAsyncConnection,AppFirstLaunchViewController;
@interface AppDelegate : UIResponder <UIApplicationDelegate>
{
    UIWindow *window;
    UINavigationController *mainNavController;
    NSMutableDictionary *imageCache;
    NodeAsyncConnection *curConnection;
}
@property (nonatomic,retain) AppFirstLaunchViewController *firstLaunchController;
@property (retain, nonatomic) UIWindow *window;
@property (retain, nonatomic) UINavigationController * mainNavController;
@property (nonatomic, retain) NSMutableDictionary *imageCache;
@property(nonatomic,retain) NodeAsyncConnection *curConnection;
- (void)didEndUpdateAppToken:(NodeAsyncConnection *)connection;
- (void)handlePushInfo:(NSDictionary *)info;
@end
