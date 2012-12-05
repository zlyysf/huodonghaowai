//
//  CustomAlertView.h
//  PrettyRich
//
//  Created by miao liu on 5/21/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>
@class CustomAlertView;
@protocol CustomAlertViewDelegate<NSObject>
- (void)customAlert:(CustomAlertView*)alert DismissWithButtonTitle:(NSString *)buttonTitle;
@end
@interface CustomAlertView : UIView
{
    UIView *backView;
    UIImageView *imgView;
    UILabel *messageLabel;
    float delayTime;
    id<CustomAlertViewDelegate> delegate;
    BOOL automaticDisapper;
}
@property(nonatomic,retain)UIView *backView;
@property(nonatomic,retain)UIImageView *imgView;
@property(nonatomic,retain)UILabel *messageLabel;
@property(nonatomic,assign)id<CustomAlertViewDelegate> delegate;
@property(nonatomic,readwrite)BOOL automaticDisapper;
@property(nonatomic,readwrite)float delayTime;
- (id)initWithFrame:(CGRect)frame 
           messgage:(NSString *)message 
        otherButton:(NSString *)otherButtonTitle
       cancelButton:(NSString *)cancelButtonTitle
           delegate:(id)alertDelegate
           duration:(float)duration;
- (void)showOnView:(UIView *)targetView;
- (void)show;
- (void)alertFade;
- (void)buttonClicked:(UIButton*)sender;
@end
