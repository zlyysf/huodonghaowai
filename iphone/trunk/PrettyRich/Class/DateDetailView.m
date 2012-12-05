//
//  DateDetailView.m
//  PrettyRich
//
//  Created by liu miao on 11/12/12.
//
//

#import "DateDetailView.h"
#import "PrettyUtility.h"
@implementation DateDetailView
@synthesize datePicView,titleLabel,timeLabel,addressLabel,descriptionLabel,personCountLabel,whoPayLabel;
- (id)initWithFrame:(CGRect)frame
{
    self = [super initWithFrame:frame];
    if (self) {
        // Initialization code
        self.backgroundColor = [UIColor blackColor];
        
        UIImageView *temp = [[UIImageView alloc]initWithFrame:CGRectMake(0, 0, self.frame.size.width, self.frame.size.height)];
        temp.contentMode = UIViewContentModeScaleToFill;
        temp.backgroundColor = [UIColor blackColor];
        self.datePicView = temp;
        [temp release];
        [self addSubview:self.datePicView];
        
        
        UILabel *temp1 = [[UILabel alloc]initWithFrame:CGRectMake(10, 310, 300, 58)];
        temp1.backgroundColor = [UIColor clearColor];
        temp1.textColor = [UIColor whiteColor];
        temp1.font = [UIFont systemFontOfSize:14.0f];
        temp1.lineBreakMode = UILineBreakModeWordWrap;
        temp1.textAlignment = UITextAlignmentLeft;
        temp1.numberOfLines = 0;
        self.descriptionLabel = temp1;
        [temp1 release];
        [self addSubview:self.descriptionLabel];
        
        UILabel *temp2 = [[UILabel alloc]initWithFrame:CGRectMake(10, 282, 150, 19)];
        temp2.numberOfLines = 1;
        temp2.backgroundColor = [UIColor clearColor];
        temp2.textColor = [UIColor whiteColor];
        temp2.font = [UIFont systemFontOfSize:14.0f];
        temp2.lineBreakMode = UILineBreakModeTailTruncation;
        temp2.textAlignment = UITextAlignmentLeft;
        self.personCountLabel = temp2;
        [temp2 release];
        [self addSubview:self.personCountLabel];
        
        UILabel *temp3 = [[UILabel alloc]initWithFrame:CGRectMake(160, 282, 150, 19)];
        temp3.numberOfLines = 1;
        temp3.backgroundColor = [UIColor clearColor];
        temp3.textColor = [UIColor whiteColor];
        temp3.font = [UIFont systemFontOfSize:14.0f];
        temp3.lineBreakMode = UILineBreakModeTailTruncation;
        temp3.textAlignment = UITextAlignmentLeft;
        self.whoPayLabel = temp3;
        [temp3 release];
        [self addSubview:self.whoPayLabel];
        
        UILabel *temp4 = [[UILabel alloc]initWithFrame:CGRectMake(10, 250, 150, 19)];
        temp4.numberOfLines = 1;
        temp4.backgroundColor = [UIColor clearColor];
        temp4.textColor = [UIColor whiteColor];
        temp4.font = [UIFont systemFontOfSize:14.0f];
        temp4.lineBreakMode = UILineBreakModeTailTruncation;
        temp4.textAlignment = UITextAlignmentLeft;
        self.timeLabel = temp4;
        [temp4 release];
        [self addSubview:self.timeLabel];
        
        UILabel *temp5 = [[UILabel alloc]initWithFrame:CGRectMake(160, 250, 150, 19)];
        temp5.numberOfLines = 1;
        temp5.backgroundColor = [UIColor clearColor];
        temp5.textColor = [UIColor whiteColor];
        temp5.font = [UIFont systemFontOfSize:14.0f];
        temp5.lineBreakMode = UILineBreakModeTailTruncation;
        temp5.textAlignment = UITextAlignmentLeft;
        self.addressLabel = temp5;
        [temp5 release];
        [self addSubview:self.addressLabel];
        
        UILabel *temp6 = [[UILabel alloc]initWithFrame:CGRectMake(10, 204, 300, 38)];
        temp6.numberOfLines = 1;
        temp6.backgroundColor = [UIColor clearColor];
        temp6.textColor = [UIColor whiteColor];
        temp6.font = [UIFont systemFontOfSize:30.0f];
        temp6.lineBreakMode = UILineBreakModeTailTruncation;
        temp6.textAlignment = UITextAlignmentLeft;
        self.titleLabel = temp6;
        [temp6 release];
        [self addSubview:self.titleLabel];
        
    }
    return self;
}

/*
// Only override drawRect: if you perform custom drawing.
// An empty implementation adversely affects performance during animation.
- (void)drawRect:(CGRect)rect
{
    // Drawing code
}
*/
- (void)resizeSubviewForDateInfo:(NSDictionary*)dateInfo
{
    NSString *title = [dateInfo objectForKey:@"title"];
    titleLabel.text = title;
    NSNumber *seconds = [NSNumber numberWithLongLong:[[dateInfo objectForKey:@"dateDate"]longLongValue]];
    NSString *time = [PrettyUtility dateFromInterval:seconds];
    timeLabel.text = time;
    NSString *address = [dateInfo objectForKey:@"address"];
    addressLabel.text =address;
    NSString *description = [dateInfo objectForKey:@"description"];
    descriptionLabel.text = description;
    NSString *count = [NSString stringWithFormat:@"%@+%@",[dateInfo objectForKey:@"existPersonCount"],[dateInfo objectForKey:@"wantPersonCount"]];
    personCountLabel.text = count;
    NSString *whoPay = [dateInfo objectForKey:@"whoPay"];
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
    whoPayLabel.text = whoPayStr;
    
    CGSize descriptionSize = [descriptionLabel.text sizeWithFont:[UIFont systemFontOfSize:14]constrainedToSize:CGSizeMake(300, 9999) lineBreakMode:UILineBreakModeWordWrap];
    if (descriptionSize.height>90)
    {
        self.descriptionLabel.frame = CGRectMake(10, 362-90, 300, 90);
        self.descriptionLabel.lineBreakMode = UILineBreakModeWordWrap | UILineBreakModeTailTruncation;
    }
    else
    {
        self.descriptionLabel.frame = CGRectMake(10, 362-descriptionSize.height, 300, descriptionSize.height);
        self.descriptionLabel.lineBreakMode = UILineBreakModeWordWrap;
    }
    float y = descriptionLabel.frame.origin.y-5;
    
    CGRect countFrame = personCountLabel.frame;
    countFrame.origin.y = y-countFrame.size.height;
    personCountLabel.frame = countFrame;
    
    CGRect whoPayFrame = whoPayLabel.frame;
    whoPayFrame.origin.y = y-whoPayFrame.size.height;
    whoPayLabel.frame = whoPayFrame;
    
    y = whoPayLabel.frame.origin.y-5;
    CGRect timeFrame = timeLabel.frame;
    timeFrame.origin.y = y-timeFrame.size.height;
    timeLabel.frame = timeFrame;
    
    CGRect locationFrame = addressLabel.frame;
    locationFrame.origin.y = y-locationFrame.size.height;
    addressLabel.frame = locationFrame;
    
    y = addressLabel.frame.origin.y-5;
    CGRect titleFrame = titleLabel.frame;
    titleFrame.origin.y = y-titleFrame.size.height;
    titleLabel.frame = titleFrame;

}
- (void)dealloc
{
    [datePicView release];
    [timeLabel release];
    [titleLabel release];
    [addressLabel release];
    [descriptionLabel release];
    [personCountLabel release];
    [whoPayLabel release];
    [super dealloc];
}
@end
