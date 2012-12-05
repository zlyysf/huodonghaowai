//
//  NewMessageCell.m
//  PrettyRich
//
//  Created by liu miao on 9/20/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "NewMessageCell.h"
#import "PrettyUtility.h"
@implementation NewMessageCell
@synthesize cellBackView;

- (id)initWithStyle:(UITableViewCellStyle)style reuseIdentifier:(NSString *)reuseIdentifier
{
    self = [super initWithStyle:style reuseIdentifier:reuseIdentifier];
    if (self) {
        // Initialization code
    }
    return self;
}
- (void)customCellWithInfo:(NSDictionary *)cellInfo
{
    float cellHeight = [[cellInfo objectForKey:@"cellHeight"]floatValue];
    self.frame = CGRectMake(0, 0, 320, cellHeight);
    self.cellBackView.frame = CGRectMake(0, 0, 320, cellHeight);
    float startY;
    if ([[cellInfo objectForKey:@"hasTime"]boolValue])
    {
        startY = 38;
        UILabel *timeLabel = [[UILabel alloc]initWithFrame:CGRectMake(16, 16, 288, 16)];
        timeLabel.textAlignment  = UITextAlignmentCenter;
        timeLabel.backgroundColor = [UIColor clearColor];
        timeLabel.font = [UIFont fontWithName:@"HelveticaNeue-Light" size:12];
        timeLabel.textColor = [UIColor colorWithRed:0.f green:0.f blue:0.f alpha:0.75];
        NSNumber *seconds = [NSNumber numberWithLongLong:[[cellInfo objectForKey:@"createTime"]longLongValue]];
        NSString *time;
        if(seconds == nil || [seconds intValue] == 0)
            time = @"";
        else
        {
        if ([[seconds stringValue] length] > 10) {
            seconds	 = [NSNumber numberWithInteger:[[[seconds stringValue] substringToIndex:10] intValue]];
        }
        NSDate *_data = [NSDate dateWithTimeIntervalSince1970:[seconds doubleValue]];
        NSDate *current = [NSDate date];

        if ([PrettyUtility twoDateIsSameDay:_data second:current])
        {
            NSDateFormatter *formatter= [[NSDateFormatter alloc] init];
            [formatter setLocale:[[[NSLocale alloc] initWithLocaleIdentifier:@"zh_Hans"] autorelease]];
            [formatter setAMSymbol:@"上午"];
            [formatter setPMSymbol:@"下午"];
            [formatter setDateFormat:@"HH:mm"];
            time = [formatter stringFromDate:_data];
            [formatter release];
        }
        else
        {
            NSDateFormatter *formatter= [[NSDateFormatter alloc] init];
            [formatter setLocale:[[[NSLocale alloc] initWithLocaleIdentifier:@"zh_Hans"] autorelease]];
            [formatter setDateFormat:@"MM月dd日HH:mm"];
            time = [formatter stringFromDate:_data];
            [formatter release];
        }
        }
        timeLabel.text = time;
        [self.cellBackView addSubview:timeLabel];
        [timeLabel release];
    }
    else {
        startY = 12;
    }
    
    NSString *text = [cellInfo objectForKey:@"messageText"];
    CGSize textSize = [text sizeWithFont:[UIFont fontWithName:@"HelveticaNeue-Light" size:12] constrainedToSize:CGSizeMake(187, 9999) lineBreakMode:UILineBreakModeWordWrap];
    //NSLog(@"%f",textSize.height);
    UIImageView *bubbleImage = [[UIImageView alloc]init];;
    if ([[cellInfo objectForKey:@"cellType"]isEqualToString:@"typeSelf"])
    {
        bubbleImage.image = [[UIImage imageNamed:@"bubbleMine.png"] stretchableImageWithLeftCapWidth:15 topCapHeight:13];
        bubbleImage.frame = CGRectMake(271-textSize.width, startY, textSize.width + 33, textSize.height + 14);
        if (![PrettyUtility isNull:[cellInfo objectForKey:@"state"]])
        {
            if (![[cellInfo objectForKey:@"state"] isEqualToString:@"success"])
            {
                UIActivityIndicatorView *indicator = [[UIActivityIndicatorView alloc]initWithActivityIndicatorStyle:UIActivityIndicatorViewStyleGray];
                indicator.frame = CGRectMake(bubbleImage.frame.origin.x-30, bubbleImage.frame.origin.y+(bubbleImage.frame.size.height/2)-10, 20, 20);
                [indicator startAnimating];
                [self.cellBackView addSubview:indicator];
                [indicator release];
            }
        }
        UILabel *textLabel = [[UILabel alloc]initWithFrame:CGRectMake(bubbleImage.frame.origin.x+12,startY+7, textSize.width, textSize.height)];
        textLabel.font = [UIFont fontWithName:@"HelveticaNeue-Light" size:12];
        textLabel.lineBreakMode = UILineBreakModeWordWrap;
        textLabel.numberOfLines = 0;
        textLabel.backgroundColor = [UIColor clearColor];
        textLabel.textColor = [UIColor blackColor];
        textLabel.text = text;
        [self.cellBackView addSubview:bubbleImage];
        [bubbleImage release];
        [self.cellBackView addSubview:textLabel];
        [textLabel release];
    }
    else
    {
        bubbleImage.image = [[UIImage imageNamed:@"bubbleSomeone.png"] stretchableImageWithLeftCapWidth:21 topCapHeight:13];
        bubbleImage.frame = CGRectMake(16, startY, textSize.width + 33, textSize.height + 14);
        UILabel *textLabel = [[UILabel alloc]initWithFrame:CGRectMake(36,startY+7, textSize.width, textSize.height)];
        textLabel.font = [UIFont fontWithName:@"HelveticaNeue-Light" size:12];
        textLabel.lineBreakMode = UILineBreakModeWordWrap;
        textLabel.numberOfLines = 0;
        textLabel.textColor = [UIColor blackColor];
        textLabel.backgroundColor = [UIColor clearColor];
        textLabel.text = text;
        [self.cellBackView addSubview:bubbleImage];
        [bubbleImage release];
        [self.cellBackView addSubview:textLabel];
        [textLabel release];
    }
    if (![PrettyUtility isNull:[cellInfo objectForKey:@"state"]])
    {
        if (![[cellInfo objectForKey:@"state"] isEqualToString:@"success"])
        {
            //add activity indicator
        }
    }
    
}
- (void)setSelected:(BOOL)selected animated:(BOOL)animated
{
    [super setSelected:selected animated:animated];

    // Configure the view for the selected state
}
- (void)prepareForReuse
{
    for(UIView *views in self.cellBackView.subviews)
    {
        [views removeFromSuperview];
    }
    [super prepareForReuse];
}
- (void)dealloc {
    [cellBackView release];
    [super dealloc];
}
@end
