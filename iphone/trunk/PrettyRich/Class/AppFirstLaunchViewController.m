//
//  AppFirstLaunchViewController.m
//  PrettyRich
//
//  Created by liu miao on 11/8/12.
//
//

#import "AppFirstLaunchViewController.h"
#import <QuartzCore/QuartzCore.h>
@interface AppFirstLaunchViewController ()

@end

@implementation AppFirstLaunchViewController

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
    // Do any additional setup after loading the view from its nib.
    self.guidePageControll.numberOfPages = 4;
    self.guidePageControll.currentPage = 0;
    
    self.guideScrollView.contentSize = CGSizeMake(self.view.frame.size.width * 4, self.view.frame.size.height);
    UIImage *sendBtnBackground = [[UIImage imageNamed:@"NNsend-button.png"] stretchableImageWithLeftCapWidth:13 topCapHeight:0];
    [self.startButton setBackgroundImage:sendBtnBackground forState:UIControlStateNormal];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}
- (IBAction)enterButtonClicked
{
    CATransition *animation = [CATransition animation];
    animation.delegate = self;
    animation.duration = 0.7 ;  // 动画持续时间(秒)
    animation.timingFunction = UIViewAnimationCurveEaseInOut;
    animation.type = kCATransitionFade;//淡入淡出效果
    self.view.alpha = 0;
    [[self.view layer] addAnimation:animation forKey:@"animation"];
    //[self performSelector:@selector(dismiss) withObject:nil afterDelay:0.7];
    
}
- (void)animationDidStop:(CAAnimation *)theAnimation finished:(BOOL)flag
{
    if (flag)
    {
        [[self.view layer]removeAnimationForKey:@"animation"];
        if (self.view.superview) {
            [self.view removeFromSuperview];
        }
    }
}
-(void)dismiss
{
    }
-(void)scrollViewDidScroll:(UIScrollView *)scrollView
{
    CGFloat pageWidth = self.view.frame.size.width;
    int page = floor((scrollView.contentOffset.x - pageWidth / 2) / pageWidth) + 1;
    self.guidePageControll.currentPage = page;
}

- (void)dealloc {
    [_guideScrollView release];
    [_guidePageControll release];
    [_startButton release];
    [super dealloc];
}
- (void)viewDidUnload {
    [self setGuideScrollView:nil];
    [self setGuidePageControll:nil];
    [self setStartButton:nil];
    [super viewDidUnload];
}
@end
