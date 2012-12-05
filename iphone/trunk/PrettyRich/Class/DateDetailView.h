//
//  DateDetailView.h
//  PrettyRich
//
//  Created by liu miao on 11/12/12.
//
//

#import <UIKit/UIKit.h>

@interface DateDetailView : UIView
@property (nonatomic,retain)UIImageView *datePicView;
@property (nonatomic,retain)UILabel * titleLabel;
@property (nonatomic,retain)UILabel * timeLabel;
@property (nonatomic,retain)UILabel * addressLabel;
@property (nonatomic,retain)UILabel * descriptionLabel;
@property (nonatomic,retain)UILabel * personCountLabel;
@property (nonatomic,retain)UILabel * whoPayLabel;
- (void)resizeSubviewForDateInfo:(NSDictionary*)dateInfo;
@end
