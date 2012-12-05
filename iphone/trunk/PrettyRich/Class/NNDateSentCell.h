//
//  NNDateSentCell.h
//  PrettyRich
//
//  Created by liu miao on 10/26/12.
//
//

#import <UIKit/UIKit.h>
@protocol NNDateSentCellDelegate <NSObject>
- (void)dateTitleClickedForIndex:(NSIndexPath*)userIndex;
//- (void)dateClosedForIndex:(NSIndexPath *)userIndex;
@end

@interface NNDateSentCell : UITableViewCell
@property (retain, nonatomic) IBOutlet UIButton *titleButton;
@property (retain, nonatomic) IBOutlet UILabel *timeLabel;
@property (retain, nonatomic) IBOutlet UILabel *descriptionLabel;
@property (retain, nonatomic) IBOutlet UILabel *personCountLabel;
@property (retain, nonatomic) IBOutlet UILabel *confirmedCountLabel;
@property (retain, nonatomic) IBOutlet UILabel *respondCountLabel;
@property(nonatomic,retain)NSIndexPath *cellIndex;
@property (nonatomic ,assign)id<NNDateSentCellDelegate> delegate;
-(void)customCellWithInfo:(NSDictionary *)cellInfo;
-(IBAction)titleButtonClick;
@end
