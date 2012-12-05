//
//  NewMessageCell.h
//  PrettyRich
//
//  Created by liu miao on 9/20/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface NewMessageCell : UITableViewCell
- (void)customCellWithInfo:(NSDictionary *)cellInfo;
@property (retain, nonatomic) IBOutlet UIView *cellBackView;
@end
