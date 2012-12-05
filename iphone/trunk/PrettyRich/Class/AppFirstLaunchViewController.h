//
//  AppFirstLaunchViewController.h
//  PrettyRich
//
//  Created by liu miao on 11/8/12.
//
//

#import <UIKit/UIKit.h>

@interface AppFirstLaunchViewController : UIViewController<UIScrollViewDelegate>
@property (retain, nonatomic) IBOutlet UIScrollView *guideScrollView;
@property (retain, nonatomic) IBOutlet UIButton *startButton;
@property (retain, nonatomic) IBOutlet UIPageControl *guidePageControll;
- (IBAction)enterButtonClicked;
@end
