//
//  LZCreateActivityBaseViewController.m
//  oneplusone
//
//  Created by Dalei Li on 10/16/12.
//  Copyright (c) 2012 Dalei Li. All rights reserved.
//

#import "LZCreateActivityBaseViewController.h"
#import "LZCreateActivityViewController.h"

@interface LZCreateActivityBaseViewController ()

@end

@implementation LZCreateActivityBaseViewController

@synthesize flipButtonItem;

LZCreateActivityViewController *updateController;
UIViewController *previewController;
bool editVisible;

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
    
    updateController = (LZCreateActivityViewController *)[storyboard instantiateViewControllerWithIdentifier:@"CreateActivityDataController"];
    previewController = [storyboard instantiateViewControllerWithIdentifier:@"ActivityPreviewController"];
    
    [self.view addSubview:updateController.view];
    flipButtonItem.title = @"预览";
    editVisible = true;
    
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
    
    if (editVisible){
        
        // If view one is visible, hides it and add the new one with the "Flip" style transition
        [UIView setAnimationTransition:UIViewAnimationTransitionFlipFromRight forView:self.view cache:YES];
        
        [updateController.view removeFromSuperview];
        [self.view addSubview:previewController.view];
        
    } else {
        
        // If the view two is visible, hides it and display the one with the "Flip" transition.
        
        [UIView setAnimationTransition:UIViewAnimationTransitionFlipFromLeft forView:self.view cache:YES];
        
        [previewController.view removeFromSuperview];
        [self.view addSubview:updateController.view];
        
    }
    
    // Commit animations to show the effect
    [UIView commitAnimations];
    
    // Register the current visible view
    editVisible = !editVisible;
    
    flipButtonItem.title = editVisible ? @"预览" : @"编辑";
    
    
}

- (void)flipViewsAnimationStop:(NSString *)animationID finished:(NSNumber *)finished context:(void *)context {
    
    self.view.userInteractionEnabled = YES;
    
}

@end
