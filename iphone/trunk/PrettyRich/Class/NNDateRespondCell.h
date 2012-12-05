//
//  NNDateRespondCell.h
//  PrettyRich
//
//  Created by liu miao on 10/26/12.
//
//

#import <UIKit/UIKit.h>
@protocol NNDateRespondCellDelegate <NSObject>
- (void)dateTitleButtonClicked:(NSIndexPath*)cellIndex;
- (void)userInCellClicked:(NSIndexPath*)cellIndex;
@end
@interface NNDateRespondCell : UITableViewCell
@property (retain, nonatomic) IBOutlet UIImageView *userPhotoView;
@property (retain, nonatomic) IBOutlet UIButton *dateTitleButton;
@property (retain, nonatomic) IBOutlet UILabel *timeLabel;
@property (retain, nonatomic) IBOutlet UILabel *lastMessagelabel;
@property (retain, nonatomic) IBOutlet UIButton *userNameButton;
@property (nonatomic ,assign)id<NNDateRespondCellDelegate> delegate;
@property(nonatomic,retain)NSIndexPath *cellIndex;
@property (nonatomic,retain)NSString *imgUrl;
-(void)customCellWithInfo:(NSDictionary *)cellInfo;
-(IBAction)userButtonClick;
- (IBAction)titleButtonClicked;
@end
