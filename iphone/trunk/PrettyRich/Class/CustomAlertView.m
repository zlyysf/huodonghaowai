//
//  CustomAlertView.m
//  PrettyRich
//
//  Created by miao liu on 5/21/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "CustomAlertView.h"
#import "PrettyUtility.h"
#import "AppDelegate.h"
#define kAlertMessageWidth 210
#define kAlertBackWidth 250
@implementation CustomAlertView
@synthesize backView,imgView,messageLabel,delegate,automaticDisapper,delayTime;
- (id)initWithFrame:(CGRect)frame 
           messgage:(NSString *)message 
        otherButton:(NSString *)otherButtonTitle
       cancelButton:(NSString *)cancelButtonTitle
           delegate:(id)alertDelegate
           duration:(float)duration
{
    //fc7cb3
    self = [super initWithFrame:frame];
    if (self) {
        if (alertDelegate != nil)
        {
            self.delegate = alertDelegate;
        }

        self.automaticDisapper = NO;
        float height = [PrettyUtility calculateHeight:message :[UIFont systemFontOfSize:15.0f] :kAlertMessageWidth :UILineBreakModeWordWrap];
        CGPoint center = self.center;
        if (cancelButtonTitle !=nil || otherButtonTitle != nil)
        {
            //has button
            if (otherButtonTitle == nil && cancelButtonTitle != nil)
            {
                //
                backView = [[UIView alloc]initWithFrame:CGRectMake(0, 0, kAlertBackWidth, height+65)];
                backView.backgroundColor = [UIColor clearColor];
                backView.center = center;
                imgView = [[UIImageView alloc]initWithFrame:CGRectMake(0, 0, kAlertBackWidth, height+65)];
                UIImage*backImage = [UIImage imageNamed:@"alert-background.png"];
                [imgView setImage:[backImage stretchableImageWithLeftCapWidth:15 topCapHeight:10]];
                [backView addSubview:imgView];
                messageLabel = [[UILabel alloc]initWithFrame:CGRectMake(20, 20, kAlertMessageWidth, height)] ;
                messageLabel.numberOfLines = 0;
                messageLabel.font = [UIFont systemFontOfSize:15.0f];
                messageLabel.lineBreakMode = UILineBreakModeWordWrap;
                messageLabel.backgroundColor = [UIColor clearColor];
                messageLabel.text = message;
                [backView addSubview:messageLabel];
                UIButton *cancelButton = [UIButton buttonWithType:UIButtonTypeCustom];
                [cancelButton setTitle:cancelButtonTitle forState:UIControlStateNormal];
                cancelButton.titleLabel.font = [UIFont systemFontOfSize:15.0f];
                cancelButton.frame = CGRectMake(90, height+25, 70, 25);
                [cancelButton addTarget:self action:@selector(alertFade) forControlEvents:UIControlEventTouchUpInside];
                
                [cancelButton setBackgroundImage:[[UIImage imageNamed:@"NNsend-button.png"] stretchableImageWithLeftCapWidth:15 topCapHeight:10] forState:UIControlStateNormal];
                [backView addSubview:cancelButton];
            }
            else if(otherButtonTitle != nil && cancelButtonTitle != nil)
            {
                backView = [[UIView alloc]initWithFrame:CGRectMake(0, 0, kAlertBackWidth, height+75)];
                backView.backgroundColor = [UIColor clearColor];
                backView.center = center;
                imgView = [[UIImageView alloc]initWithFrame:CGRectMake(0, 0, kAlertBackWidth, height+75)];
                UIImage*backImage = [UIImage imageNamed:@"alert-background.png"];
                [imgView setImage:[backImage stretchableImageWithLeftCapWidth:15 topCapHeight:10]];
                [backView addSubview:imgView];
                messageLabel = [[UILabel alloc]initWithFrame:CGRectMake(20, 20, kAlertMessageWidth, height)];
                messageLabel.numberOfLines = 0;
                messageLabel.font = [UIFont systemFontOfSize:15.0f];
                messageLabel.lineBreakMode = UILineBreakModeWordWrap;
                messageLabel.backgroundColor = [UIColor clearColor];
                messageLabel.text = message;
                [backView addSubview:messageLabel];
                UIButton *cancelButton = [UIButton buttonWithType:UIButtonTypeCustom];
                [cancelButton setTitle:cancelButtonTitle forState:UIControlStateNormal];
                [cancelButton setTitleColor:[UIColor blackColor] forState:UIControlStateNormal];
                [cancelButton setBackgroundImage:[UIImage imageNamed:@"alert-cancel.png"] forState:UIControlStateNormal];
                cancelButton.titleLabel.font = [UIFont systemFontOfSize:15.0f];
                cancelButton.frame = CGRectMake(30, height+35, 70, 25);
                [cancelButton addTarget:self action:@selector(alertFade) forControlEvents:UIControlEventTouchUpInside];
                [backView addSubview:cancelButton];
                UIButton *otherButton = [UIButton buttonWithType:UIButtonTypeCustom];
                [otherButton setTitle:otherButtonTitle forState:UIControlStateNormal];
                [otherButton setTitleColor:[UIColor whiteColor] forState:UIControlStateNormal];
                [otherButton setBackgroundImage:[[UIImage imageNamed:@"NNsend-button.png"] stretchableImageWithLeftCapWidth:15 topCapHeight:10] forState:UIControlStateNormal];
                otherButton.titleLabel.font = [UIFont systemFontOfSize:15.0f];
                otherButton.frame = CGRectMake(150, height+35, 70, 25);
                [otherButton addTarget:self action:@selector(buttonClicked:) forControlEvents:UIControlEventTouchUpInside];
                [backView addSubview:otherButton];
                
            }
            else {
                backView = [[UIView alloc]initWithFrame:CGRectMake(0, 0, kAlertBackWidth, height+75)];
                backView.backgroundColor = [UIColor clearColor];
                backView.center = center;
                imgView = [[UIImageView alloc]initWithFrame:CGRectMake(0, 0, kAlertBackWidth, height+75)];
                UIImage*backImage = [UIImage imageNamed:@"alert-background.png"];
                [imgView setImage:[backImage stretchableImageWithLeftCapWidth:15 topCapHeight:10]];
                [backView addSubview:imgView];
                messageLabel = [[UILabel alloc]initWithFrame:CGRectMake(20, 20, kAlertMessageWidth, height)] ;
                messageLabel.numberOfLines = 0;
                messageLabel.font = [UIFont systemFontOfSize:15.0f];
                messageLabel.lineBreakMode = UILineBreakModeWordWrap;
                messageLabel.backgroundColor = [UIColor clearColor];
                messageLabel.text = message;
                [backView addSubview:messageLabel];
                UIButton *otherButton = [UIButton buttonWithType:UIButtonTypeCustom];
                [otherButton setTitle:otherButtonTitle forState:UIControlStateNormal];
                otherButton.titleLabel.font = [UIFont systemFontOfSize:15.0f];
                otherButton.frame = CGRectMake(90, height+35, 70, 25);
                [otherButton addTarget:self action:@selector(buttonClicked:) forControlEvents:UIControlEventTouchUpInside];
                [otherButton setBackgroundImage:[[UIImage imageNamed:@"NNsend-button.png"] stretchableImageWithLeftCapWidth:15 topCapHeight:10] forState:UIControlStateNormal];
                [backView addSubview:otherButton];
            }
        
        }
        else 
        {
             //just alert
            if (duration != 0)
            {
                self.delayTime = duration;
            }
            self.automaticDisapper =YES;
            backView = [[UIView alloc]initWithFrame:CGRectMake(0, 0, kAlertBackWidth, height+40)];
            backView.backgroundColor = [UIColor clearColor];
            backView.center = center;
            imgView = [[UIImageView alloc]initWithFrame:CGRectMake(0, 0, kAlertBackWidth, height+40)];
            UIImage*backImage = [UIImage imageNamed:@"alert-background.png"];
            [imgView setImage:[backImage stretchableImageWithLeftCapWidth:15 topCapHeight:10]];
            [backView addSubview:self.imgView];
            messageLabel = [[UILabel alloc]initWithFrame:CGRectMake(20, 20, kAlertMessageWidth, height)];
            messageLabel.numberOfLines = 0;
            messageLabel.font = [UIFont systemFontOfSize:15.0f];
            messageLabel.lineBreakMode = UILineBreakModeWordWrap;
            messageLabel.backgroundColor = [UIColor clearColor];
            messageLabel.text = message;
            [backView addSubview:messageLabel];
        }
        [self addSubview:backView];
    }
    return self;
}
- (void)showOnView:(UIView *)targetView
{
    [targetView addSubview:self];
    if (self.automaticDisapper)
    {
        [UIView beginAnimations:nil context:nil];
        [UIView setAnimationDuration:self.delayTime];
        [UIView setAnimationDelegate:self];
        [UIView setAnimationDidStopSelector:@selector(alertFade)];
        self.alpha =0.99;
        [UIView commitAnimations];
        //[self performSelector:@selector(alertFade) withObject:nil afterDelay:self.delayTime];
    }
}
- (void)show
{
    AppDelegate *appDelegate = [[UIApplication sharedApplication]delegate];
    [appDelegate.window addSubview:self];
    if (self.automaticDisapper)
    {
        [UIView beginAnimations:nil context:nil];
        [UIView setAnimationDuration:self.delayTime];
        [UIView setAnimationDelegate:self];
        [UIView setAnimationDidStopSelector:@selector(alertFade)];   
        self.alpha = 0.99;
        [UIView commitAnimations];
        //[self performSelector:@selector(alertFade) withObject:nil afterDelay:self.delayTime];
    }
}
- (void)alertFade
{
    if (self.superview)
    {
        [self removeFromSuperview];
    }
}
/*
// Only override drawRect: if you perform custom drawing.
// An empty implementation adversely affects performance during animation.
- (void)drawRect:(CGRect)rect
{
    // Drawing code
}
*/
- (void)buttonClicked:(UIButton *)sender
{
    NSString *title = sender.titleLabel.text;

    if (self.delegate && [self.delegate respondsToSelector:@selector(customAlert: DismissWithButtonTitle:)])
    {
        [self.delegate customAlert:self DismissWithButtonTitle:title];
    }
    if (self.superview)
    {
        [self removeFromSuperview];
    }
}
- (void)dealloc
{
    self.backView =nil;
    self.imgView =nil;
    self.messageLabel =nil;
    [super dealloc];
}
@end
