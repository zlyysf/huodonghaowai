//
//  LZActivityDetailViewController.m
//  oneplusone
//
//  Created by Dalei Li on 10/13/12.
//  Copyright (c) 2012 Dalei Li. All rights reserved.
//

#import "LZActivityDetailViewController.h"

@interface LZActivityDetailViewController ()

@end

@implementation LZActivityDetailViewController

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

@end
