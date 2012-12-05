//
//  LZProfileViewController.m
//  oneplusone
//
//  Created by Dalei Li on 10/13/12.
//  Copyright (c) 2012 Dalei Li. All rights reserved.
//

#import "LZProfileViewController.h"

@interface LZProfileViewController ()

@end

@implementation LZProfileViewController

@synthesize displayController, flipButtonItem, updateController;

BOOL displayVisible;

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
    
    UIStoryboard *storyboard = [UIStoryboard storyboardWithName:[[NSBundle mainBundle].infoDictionary objectForKey:@"UIMainStoryboardFile"] bundle:[NSBundle mainBundle]];
    
    displayController = [storyboard instantiateViewControllerWithIdentifier:@"DisplayController"];
    updateController = (LZProfileEditViewController *)[storyboard instantiateViewControllerWithIdentifier:@"UpdateController"];
    
    [self.view addSubview:self.displayController.view];
    displayVisible = TRUE;
    flipButtonItem.title = @"编辑";
    
    
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}


-(IBAction)doFlip:(id)sender
{
    // disable user interaction during the flip
    
    self.view.userInteractionEnabled = NO;
    
    // setup the animation group and creates it
    
    [UIView beginAnimations:nil context:nil];
    [UIView setAnimationDuration:0.5];
    [UIView setAnimationDelegate:self];
    [UIView setAnimationDidStopSelector:@selector(flipViewsAnimationStop:finished:context:)];
    
    if (displayVisible){
        
        // If view one is visible, hides it and add the new one with the "Flip" style transition
        [UIView setAnimationTransition:UIViewAnimationTransitionFlipFromRight forView:self.view cache:YES];
        
        [self.displayController.view removeFromSuperview];
        [self.view addSubview:self.updateController.view];
        
    } else {
        
        // If the view two is visible, hides it and display the one with the "Flip" transition.
        
        [UIView setAnimationTransition:UIViewAnimationTransitionFlipFromLeft forView:self.view cache:YES];
        
        [self.updateController.view removeFromSuperview];
        [self.view addSubview:self.displayController.view];
        
    }
    
    // Commit animations to show the effect
    [UIView commitAnimations];
    
    // Register the current visible view
    displayVisible = !displayVisible;

    flipButtonItem.title = displayVisible ? @"编辑" : @"预览";


}

- (void)flipViewsAnimationStop:(NSString *)animationID finished:(NSNumber *)finished context:(void *)context {
    
    self.view.userInteractionEnabled = YES;
    
}

-(IBAction)doLogout:(id)sender
{
    [self.tabBarController dismissViewControllerAnimated:FALSE completion:nil];
}

@end
