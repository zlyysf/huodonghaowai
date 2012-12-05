//
//  NNDateRespondCell.m
//  PrettyRich
//
//  Created by liu miao on 10/26/12.
//
//

#import "NNDateRespondCell.h"
#import "PrettyUtility.h"
@implementation NNDateRespondCell
@synthesize cellIndex,delegate,imgUrl;
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
    NSString *name = [[cellInfo objectForKey:@"sender"] objectForKey:@"name"];
    [self.userNameButton setTitle:name forState:UIControlStateNormal];
    NSString *title = [cellInfo objectForKey:@"title"];
    [self.dateTitleButton setTitle:title forState:UIControlStateNormal];
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
    NSArray *responder = [cellInfo objectForKey:@"responders"];
    NSDictionary *respond = [responder objectAtIndex:0];
    NSDictionary *latestMessage = [respond objectForKey:@"latestMessage"];
    NSString *message = [latestMessage objectForKey:@"messageText"];
    self.lastMessagelabel.text = message;
    CGSize descriptionSize = [self.lastMessagelabel.text sizeWithFont:[UIFont systemFontOfSize:12]constrainedToSize:CGSizeMake(226, 9999) lineBreakMode:UILineBreakModeWordWrap];
    if (descriptionSize.height>45)
    {
        self.lastMessagelabel.frame = CGRectMake(74, 30, 226, 45);
        self.lastMessagelabel.lineBreakMode = UILineBreakModeWordWrap | UILineBreakModeTailTruncation;
    }
    else
    {
        self.lastMessagelabel.frame = CGRectMake(74, 30, descriptionSize.width, descriptionSize.height);
        self.lastMessagelabel.lineBreakMode = UILineBreakModeWordWrap;
    }

}
-(IBAction)userButtonClick
{
    if (self.delegate && [self.delegate respondsToSelector:@selector(userInCellClicked:)])
    {
        [self.delegate userInCellClicked:cellIndex];
    }
}
- (IBAction)titleButtonClicked
{
    if (self.delegate && [self.delegate respondsToSelector:@selector(dateTitleButtonClicked:)])
    {
        [self.delegate dateTitleButtonClicked:cellIndex];
    }
}
- (void)dealloc {
    [imgUrl release];
    [cellIndex release];
    [_userPhotoView release];
    [_dateTitleButton release];
    [_timeLabel release];
    [_lastMessagelabel release];
    [_userNameButton release];
    [super dealloc];
}
@end
