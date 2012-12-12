//
//  PrettyGlobalService.h
//  PrettyRich
//
//  Created by liu miao on 6/28/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//
#import <Foundation/Foundation.h>
#import "NodeAsyncConnection.h"
@interface PrettyGlobalService : NSObject<RenrenDelegate>

+(PrettyGlobalService *)shareInstance;
- (void)startUploadPhoto:(UIImage*)uploadImage forUrl:(NSString *)photoUrl;
- (void)startUploadPhoto:(UIImage*)uploadImage forPrimaryPhoto:(BOOL)setPrimary;
- (void)didEndUploadPhoto:(NodeAsyncConnection *)connection;
- (void)handleError:(NSString *)errorCode;
- (void)prettyRichLogOut;
@end
