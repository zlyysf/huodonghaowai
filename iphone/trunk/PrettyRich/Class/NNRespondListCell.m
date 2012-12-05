//
//  NNRespondListCell.m
//  PrettyRich
//
//  Created by liu miao on 10/26/12.
//
//

#import "NNRespondListCell.h"
#import "PrettyUtility.h"
@implementation NNRespondListCell
@synthesize delegate,cellIndex,imgUrl;
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
    NSString *name = [cellInfo objectForKey:@"name"];
    [self.userNameButton setTitle:name forState:UIControlStateNormal];
    NSDictionary *lastMessage = [cellInfo objectForKey:@"latestMessage"];
    self.lastMessagelabel.text = [lastMessage objectForKey:@"messageText"];
    CGSize descriptionSize = [self.lastMessagelabel.text sizeWithFont:[UIFont systemFontOfSize:12]constrainedToSize:CGSizeMake(226, 9999) lineBreakMode:UILineBreakModeWordWrap];
    if (descriptionSize.height>45)
    {
        self.lastMessagelabel.frame = CGRectMake(74, 21, 226, 45);
        self.lastMessagelabel.lineBreakMode = UILineBreakModeWordWrap | UILineBreakModeTailTruncation;
    }
    else
    {
        self.lastMessagelabel.frame = CGRectMake(74, 21, descriptionSize.width, descriptionSize.height);
        self.lastMessagelabel.lineBreakMode = UILineBreakModeWordWrap;
    }

    NSNumber *time = [NSNumber numberWithLongLong:[[lastMessage objectForKey:@"createTime"]longLongValue]];
    self.timestamplabel.text = [PrettyUtility translateTime:time];
}
-(IBAction)userNameClicked
{
    if (self.delegate && [self.delegate respondsToSelector:@selector(userInCellClick:)])
    {
        [self.delegate userInCellClick:cellIndex];
    }
}
- (void)dealloc {
    [imgUrl release];
    [cellIndex release];
    [_userPhotoView release];
    [_userNameButton release];
    [_timestamplabel release];
    [_lastMessagelabel release];
    [super dealloc];
}
@end
