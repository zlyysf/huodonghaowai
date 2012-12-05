//
//  NNMainTabViewController.m
//  PrettyRich
//
//  Created by liu miao on 10/18/12.
//
//

#import "NNMainTabViewController.h"
#import "NNLatestDateViewController.h"
#import "DateListViewController.h"
#import "DateActivityViewController.h"
#import "NNProfileViewController.h"
@interface NNMainTabViewController ()

@end

@implementation NNMainTabViewController
@synthesize datelist,pushType;
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
    self.pushType = @"";
    NNLatestDateViewController *recentActivityViewController = [[NNLatestDateViewController alloc]initWithNibName:@"NNLatestDateViewController" bundle:nil];
    UINavigationController *nav = [[ UINavigationController alloc] initWithRootViewController:recentActivityViewController];
    UITabBarItem *recentItem = [[UITabBarItem alloc]initWithTitle:@"最新活动" image:[UIImage imageNamed:@"leaf.png"] tag:0];
    nav.tabBarItem = recentItem;
    [recentItem release];
    [recentActivityViewController release];
    
    DateActivityViewController *dateActivityViewController = [[DateActivityViewController alloc]initWithNibName:@"DateActivityViewController" bundle:nil];
    UINavigationController *nav1 = [[ UINavigationController alloc] initWithRootViewController:dateActivityViewController];
    UITabBarItem *publishItem = [[UITabBarItem alloc]initWithTitle:@"发布活动" image:[UIImage imageNamed:@"bulb.png"] tag:1];
    nav1.tabBarItem = publishItem;
    [publishItem release];
    [dateActivityViewController release];
    
    DateListViewController *myActivityListViewController = [[DateListViewController alloc]initWithNibName:@"DateListViewController" bundle:nil];
    UINavigationController *nav2 = [[ UINavigationController alloc] initWithRootViewController:myActivityListViewController];
    self.datelist = nav2;
    [nav2 release];
    UITabBarItem *myactivItem = [[UITabBarItem alloc]initWithTitle:@"我的活动" image:[UIImage imageNamed:@"home.png"] tag:2];
    self.datelist.tabBarItem = myactivItem;
    [myactivItem release];
    [myActivityListViewController release];
    
    NNProfileViewController *profileViewController = [[NNProfileViewController alloc]initWithNibName:@"NNProfileViewController" bundle:nil];
    UINavigationController *nav3 = [[ UINavigationController alloc] initWithRootViewController:profileViewController];
    UITabBarItem *profileItem = [[UITabBarItem alloc]initWithTitle:@"我的资料" image:[UIImage imageNamed:@"tag.png"] tag:3];
    nav3.tabBarItem = profileItem;
    [profileItem release];
    [profileViewController release];

	
	NSMutableArray *controllers = [NSMutableArray arrayWithObjects: nav,nav1,self.datelist,nav3,nil];
    self.viewControllers = controllers;
    [nav release];
    [nav1 release];
    //[nav2 release];
    [nav3 release];

    self.selectedIndex =0;
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(NewPushReceived:) name:@"NewPushReceived" object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(ClearPushReceived:) name:@"ClearPushReceived" object:nil];
    // Do any additional setup after loading the view from its nib.
}
- (void)tabBar:(UITabBar *)tabBar didSelectItem:(UITabBarItem *)item
{
    if (item == self.datelist.tabBarItem)
    {
        [self.datelist.tabBarItem setBadgeValue:nil];
        if ([self.pushType isEqualToString:@""])
        {
            return;
        }
        else
        {
            [self.datelist popToRootViewControllerAnimated:NO];
            DateListViewController *controller = (DateListViewController *)self.datelist.topViewController;
            [controller autoRefresh];
            self.pushType = @"";
            
        }
    }
}
- (void) NewPushReceived:(NSNotification *)notification
{
    NSDictionary *pushInfo = [notification userInfo];
    NSString *type = [pushInfo objectForKey:@"pushType"];
    self.pushType = type;
	[self.datelist.tabBarItem setBadgeValue:@"new"];
}
- (void) ClearPushReceived:(NSNotification *)notification
{
    [self.datelist.tabBarItem setBadgeValue:nil];
    self.pushType = @"";
}
- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}
- (void)dealloc
{
    [[NSNotificationCenter defaultCenter]removeObserver:self name:@"NewPushReceived" object:nil];
    [[NSNotificationCenter defaultCenter]removeObserver:self name:@"ClearPushReceived" object:nil];
    [pushType release];
    [datelist release];
    [super dealloc];
}
@end
