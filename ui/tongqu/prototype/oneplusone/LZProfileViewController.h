//
//  LZProfileViewController.h
//  oneplusone
//
//  Created by Dalei Li on 10/13/12.
//  Copyright (c) 2012 Dalei Li. All rights reserved.
//

#import <UIKit/UIKit.h>
#import "LZProfileEditViewController.h"

@interface LZProfileViewController : UIViewController

@property (nonatomic, strong) IBOutlet UIViewController *displayController;
@property (nonatomic, strong) IBOutlet LZProfileEditViewController *updateController;

@property (nonatomic, strong) IBOutlet UIBarButtonItem *flipButtonItem;



-(IBAction)doFlip:(id)sender;
-(IBAction)doLogout:(id)sender;

@end
