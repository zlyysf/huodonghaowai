//
//  DateActivityCell.m
//  PrettyRich
//
//  Created by liu miao on 10/31/12.
//
//

#import "DateActivityCell.h"

@implementation DateActivityCell

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

- (void)dealloc {
    [_activitylabel release];
    [super dealloc];
}
@end
