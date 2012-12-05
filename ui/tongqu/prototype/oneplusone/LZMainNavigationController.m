//
//  LZMainNavigationController.m
//  oneplusone
//
//  Created by Dalei Li on 10/14/12.
//  Copyright (c) 2012 Dalei Li. All rights reserved.
//

#import "LZMainNavigationController.h"

@interface LZMainNavigationController ()

@end

@implementation LZMainNavigationController

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
	// Do any additional setup after loading the view.
    
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(doLoginOrRegister) name:@"LZUserDoLoginOrRegister" object:nil];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (void)doLoginOrRegister
{
     [self popToRootViewControllerAnimated:FALSE];
     
     UIStoryboard *storyboard = [UIStoryboard storyboardWithName:[[NSBundle mainBundle].infoDictionary objectForKey:@"UIMainStoryboardFile"] bundle:[NSBundle mainBundle]];
     UITabBarController *mainController = [storyboard instantiateViewControllerWithIdentifier:@"MainTabBarController"];
    
     [self presentViewController:mainController animated:FALSE completion:nil];
}

@end
