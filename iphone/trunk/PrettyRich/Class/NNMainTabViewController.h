//
//  NNMainTabViewController.h
//  PrettyRich
//
//  Created by liu miao on 10/18/12.
//
//

#import <UIKit/UIKit.h>

@interface NNMainTabViewController : UITabBarController<UITabBarDelegate>
@property(nonatomic,retain)UINavigationController *datelist;
@property(nonatomic,retain)NSString *pushType;
@end
