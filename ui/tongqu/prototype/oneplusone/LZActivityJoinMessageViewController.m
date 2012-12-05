//
//  LZActivityJoinMessageViewController.m
//  oneplusone
//
//  Created by Dalei Li on 10/16/12.
//  Copyright (c) 2012 Dalei Li. All rights reserved.
//

#import "LZActivityJoinMessageViewController.h"

@interface LZActivityJoinMessageViewController ()

@end

@implementation LZActivityJoinMessageViewController

@synthesize textView;

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
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (IBAction)doCancel:(id)sender
{
    [self dismissViewControllerAnimated:TRUE completion:nil];
}

- (void) viewWillAppear:(BOOL)animated
{
    [self.textView becomeFirstResponder];
}

@end
