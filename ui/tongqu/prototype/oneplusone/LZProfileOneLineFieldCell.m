//
//  LZProfileOneLineFieldCell.m
//  oneplusone
//
//  Created by Dalei Li on 10/14/12.
//  Copyright (c) 2012 Dalei Li. All rights reserved.
//

#import "LZProfileOneLineFieldCell.h"

@implementation LZProfileOneLineFieldCell

@synthesize fieldLabel;

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
