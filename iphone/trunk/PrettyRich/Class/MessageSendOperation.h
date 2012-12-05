//
//  MessageSendOperation.h
//  PrettyRich
//
//  Created by liu miao on 6/15/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "NodeAsyncConnection.h"
@protocol MessageSendOperationDelegate
- (void) didFinishSendingMessage:(NodeAsyncConnection *) connection messageId:(NSString*)messageId;
@end
@interface MessageSendOperation : NSOperation
{
    NSMutableURLRequest *request;
    NSString *messageId;
    id<MessageSendOperationDelegate> delegate;
    NodeAsyncConnection *curConnection;
    BOOL endFlag;
}
@property(nonatomic,retain) NodeAsyncConnection *curConnection;
@property (nonatomic, retain) NSMutableURLRequest *request;
@property (nonatomic, retain) NSString *messageId;
@property (nonatomic, assign) id<MessageSendOperationDelegate> delegate;
@property BOOL endFlag;
- (void) didEndSendingMessage:(NodeAsyncConnection *)connection;
@end
