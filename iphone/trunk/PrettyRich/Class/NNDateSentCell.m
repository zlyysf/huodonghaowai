//
//  NNDateSentCell.m
//  PrettyRich
//
//  Created by liu miao on 10/26/12.
//
//

#import "NNDateSentCell.h"
#import "PrettyUtility.h"
@implementation NNDateSentCell
@synthesize cellIndex,delegate;
- (id)initWithStyle:(UITableViewCellStyle)style reuseIdentifier:(NSString *)reuseIdentifier
{
    self = [super initWithStyle:style reuseIdentifier:reuseIdentifier];
    if (self) {
        // Initialization code
    }
    return self;
}

- (void)setSelected:(BOOL)selected animated:(BOOL)animated
{
    [super setSelected:selected animated:animated];

    // Configure the view for the selected state
}
-(void)customCellWithInfo:(NSDictionary *)cellInfo
{
    NSString *title = [cellInfo  objectForKey:@"title"];
    [self.titleButton setTitle:title forState:UIControlStateNormal];
    NSString *description = [cellInfo objectForKey:@"description"];
    self.descriptionLabel.text = description;
    CGSize descriptionSize = [self.descriptionLabel.text sizeWithFont:[UIFont systemFontOfSize:12]constrainedToSize:CGSizeMake(290, 9999) lineBreakMode:UILineBreakModeWordWrap];
    if (descriptionSize.height>45)
    {
        self.descriptionLabel.frame = CGRectMake(10, 29, 290, 45);
        self.descriptionLabel.lineBreakMode = UILineBreakModeWordWrap | UILineBreakModeTailTruncation;
    }
    else
    {
        self.descriptionLabel.frame = CGRectMake(10, 29, descriptionSize.width, descriptionSize.height);
        self.descriptionLabel.lineBreakMode = UILineBreakModeWordWrap;
    }

    NSString *wantPersonCount = [cellInfo objectForKey:@"wantPersonCount"];
    NSString *existPersonCount = [cellInfo objectForKey:@"existPersonCount"];
    NSString *dateResponderCount = [cellInfo objectForKey:@"dateResponderCount"];
    NSString *confirmedPersonCount = [cellInfo objectForKey:@"confirmedPersonCount"];
    self.personCountLabel.text = [NSString stringWithFormat:@"%@+%@",existPersonCount,wantPersonCount];
    int responder = [dateResponderCount intValue]-[confirmedPersonCount intValue];
    self.confirmedCountLabel.text =[NSString stringWithFormat:@"加入%@人",confirmedPersonCount];
    self.respondCountLabel.text = [NSString stringWithFormat:@"申请%d人",responder];
    NSNumber *seconds = [NSNumber numberWithLongLong:[[cellInfo objectForKey:@"dateDate"]longLongValue]];
    NSString *time =[PrettyUtility stampFromInterval:seconds];
    self.timeLabel.text = time;
}
-(IBAction)titleButtonClick
{
    if (self.delegate && [self.delegate respondsToSelector:@selector(dateTitleClickedForIndex:)])
    {
        [self.delegate dateTitleClickedForIndex:cellIndex];
    }
}

- (void)dealloc {
    [cellIndex release];
    [_titleButton release];
    [_timeLabel release];
    [_descriptionLabel release];
    [_personCountLabel release];
    [_confirmedCountLabel release];
    [_respondCountLabel release];
    [super dealloc];
}
@end
