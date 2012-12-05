//
//  LatestDateCell.h
//  PrettyRich
//
//  Created by liu miao on 10/22/12.
//
//

#import <UIKit/UIKit.h>
@protocol LatestDateCellDelegate <NSObject>
- (void)userClickedForIndex:(NSIndexPath*)userIndex;
@end

@interface LatestDateCell : UITableViewCell
@property (nonatomic ,assign)id<LatestDateCellDelegate> delegate;
@property (retain, nonatomic) IBOutlet UIImageView *userPhotoView;
@property (retain, nonatomic) IBOutlet UIButton *nameButton;
@property (retain, nonatomic) IBOutlet UILabel *titleLabel;
@property (retain, nonatomic) IBOutlet UILabel *descriptionLabel;
@property (retain, nonatomic) IBOutlet UILabel *personCountLabel;
@property (retain, nonatomic) IBOutlet UILabel *timeLabel;
@property (retain, nonatomic) IBOutlet UILabel *whoPayLabel;
@property (retain, nonatomic) NSIndexPath *dateIndex;
@property (retain, nonatomic) NSString *imgUrl;
-(void)customCellWithInfo:(NSDictionary *)cellInfo;
-(IBAction)userNameClicked;
@end
