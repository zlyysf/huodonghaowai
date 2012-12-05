//
//  LatestDateCell.m
//  PrettyRich
//
//  Created by liu miao on 10/22/12.
//
//

#import "LatestDateCell.h"
#import "PrettyUtility.h"
@implementation LatestDateCell
@synthesize dateIndex,imgUrl,delegate;
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
    NSDictionary *sender = [cellInfo objectForKey:@"sender"];
    NSString *senderName = [sender objectForKey:@"name"];
    [self.nameButton setTitle:senderName forState:UIControlStateNormal];
    self.userPhotoView.userInteractionEnabled = YES;
    UITapGestureRecognizer *tap = [[UITapGestureRecognizer alloc]initWithTarget:self action:@selector(userNameClicked)];
    [self.userPhotoView addGestureRecognizer:tap];
    [tap release];
    self.titleLabel.text = [cellInfo objectForKey:@"title"];
    self.descriptionLabel.text = [cellInfo objectForKey:@"description"];
    CGSize descriptionSize = [self.descriptionLabel.text sizeWithFont:[UIFont systemFontOfSize:12]constrainedToSize:CGSizeMake(226, 9999) lineBreakMode:UILineBreakModeWordWrap];
    if (descriptionSize.height>45)
    {
        self.descriptionLabel.frame = CGRectMake(74, 28, 226, 45);
        self.descriptionLabel.lineBreakMode = UILineBreakModeWordWrap | UILineBreakModeTailTruncation;
    }
    else
    {
        self.descriptionLabel.frame = CGRectMake(74, 28, descriptionSize.width, descriptionSize.height);
        self.descriptionLabel.lineBreakMode = UILineBreakModeWordWrap;
    }

    NSString *count = [NSString stringWithFormat:@"%@+%@",[cellInfo objectForKey:@"existPersonCount"],[cellInfo objectForKey:@"wantPersonCount"]];
    self.personCountLabel.text = count;
    NSString *whoPay = [cellInfo objectForKey:@"whoPay"];
    NSString *whoPayStr;
    if ([whoPay isEqualToString:@"0"])
    {
        whoPayStr = @"我请了";
    }
    else if([whoPay isEqualToString:@"2"])
    {
        whoPayStr = @"AA吧";
    }
    else
    {
        whoPayStr = @"不花钱";
    }
    self.whoPayLabel.text = whoPayStr;
    NSNumber *seconds = [NSNumber numberWithLongLong:[[cellInfo objectForKey:@"dateDate"]longLongValue]];
    NSString *time = [PrettyUtility stampFromInterval:seconds];
//    if(seconds == nil || [seconds intValue] == 0)
//    {
//        time = @"无";
//    }
//    else
//    {
//        if ([[seconds stringValue] length] > 10)
//        {
//            seconds	 = [NSNumber numberWithInteger:[[[seconds stringValue] substringToIndex:10] intValue]];
//        }
//        NSDateFormatter *formatter= [[NSDateFormatter alloc] init];
//        [formatter setLocale:[[[NSLocale alloc] initWithLocaleIdentifier:@"zh_Hans"] autorelease]];
//        [formatter setDateFormat:@"MM月dd日"];
//        NSDate *_data = [NSDate dateWithTimeIntervalSince1970:[seconds doubleValue]];
//        time = [formatter stringFromDate:_data];
//        [formatter release];
//    }
    self.timeLabel.text = time;
}
-(IBAction)userNameClicked
{
    //NSLog(@"userClicked");
    if (self.delegate && [self.delegate respondsToSelector:@selector(userClickedForIndex:)])
    {
        [self.delegate userClickedForIndex:self.dateIndex];
    }
}
- (void)prepareForReuse
{
    [super prepareForReuse];
}
- (void)dealloc {
    [dateIndex release];
    [imgUrl release];
    [_userPhotoView release];
    [_nameButton release];
    [_titleLabel release];
    [_descriptionLabel release];
    [_personCountLabel release];
    [_timeLabel release];
    [_whoPayLabel release];
    [super dealloc];
}
@end
