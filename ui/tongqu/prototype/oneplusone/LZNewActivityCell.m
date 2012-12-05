//
//  LZNewActivityCell.m
//  oneplusone
//
//  Created by Dalei Li on 10/11/12.
//  Copyright (c) 2012 Dalei Li. All rights reserved.
//

#import "LZNewActivityCell.h"

@implementation LZNewActivityCell

@synthesize userImageView;


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

@end
