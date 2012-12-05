//
//  NNRespondListCell.h
//  PrettyRich
//
//  Created by liu miao on 10/26/12.
//
//

#import <UIKit/UIKit.h>
@protocol NNRespondListCellDelegate <NSObject>
- (void)userInCellClick:(NSIndexPath*)cellIndex;
@end
@interface NNRespondListCell : UITableViewCell
@property (retain, nonatomic) IBOutlet UIImageView *userPhotoView;
@property (retain, nonatomic) IBOutlet UIButton *userNameButton;
@property (retain, nonatomic) IBOutlet UILabel *timestamplabel;

@property (retain, nonatomic) IBOutlet UILabel *lastMessagelabel;
@property (nonatomic ,assign)id<NNRespondListCellDelegate> delegate;
@property (nonatomic,retain)NSString *imgUrl;
@property(nonatomic,retain)NSIndexPath *cellIndex;
-(void)customCellWithInfo:(NSDictionary *)cellInfo;
-(IBAction)userNameClicked;
@end
