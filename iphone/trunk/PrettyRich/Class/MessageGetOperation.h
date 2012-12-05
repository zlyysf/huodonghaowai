//
//  MessageGetOperation.h
//  PrettyRich
//
//  Created by liu miao on 6/21/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "NodeAsyncConnection.h"
@protocol MessageGetOperationDelegate
- (void) didFinishGetMessage:(NodeAsyncConnection *) connection messageId:(NSString*)messageId;
@end
@interface MessageGetOperation : NSOperation
{
    NSMutableURLRequest *request;
    id<MessageGetOperationDelegate> delegate;
    NodeAsyncConnection *curConnection;
    NSString *messageId;
    BOOL endFlag;

}
@property(nonatomic,retain) NodeAsyncConnection *curConnection;
@property (nonatomic, retain) NSMutableURLRequest *request;
@property (nonatomic, assign) id<MessageGetOperationDelegate> delegate;
@property (nonatomic, retain) NSString *messageId;
@property BOOL endFlag;
- (void) didEndGetMessage:(NodeAsyncConnection *)connection;

@end
