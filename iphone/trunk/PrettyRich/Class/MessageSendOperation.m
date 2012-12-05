//
//  MessageSendOperation.m
//  PrettyRich
//
//  Created by liu miao on 6/15/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "MessageSendOperation.h"

@implementation MessageSendOperation
@synthesize request,messageId,delegate,curConnection,endFlag;
- (id) init
{
	if (self = [super init]) 
	{
		curConnection = [[NodeAsyncConnection alloc] init];
		endFlag = NO;
	}
	return self;
}

- (void)main 
{
	NSAutoreleasePool* pool = [[NSAutoreleasePool alloc] init];
	if (![self isCancelled]) 
	{
		[curConnection startDownload:self.request 
									  :self 
									  :@selector(didEndSendingMessage:)];
		// keep this thread until the callback method involked.
		while(self.endFlag == NO) 
		{
			if ([self isCancelled]) 
			{
				[self.curConnection cancelDownload];
				self.endFlag = YES;
			}
			[[NSRunLoop currentRunLoop] runMode:NSDefaultRunLoopMode 
									 beforeDate:[NSDate distantFuture]];   
		}
	}
	[self cancel];
	[pool release];
}

- (void) didEndSendingMessage:(NodeAsyncConnection *)connection
{
	if ([self isCancelled]) 
	{
		return;
	}
	if (self.delegate != nil) 
	{
		[self.delegate didFinishSendingMessage:connection 
								 messageId:self.messageId
         ];
	}
	self.endFlag = YES;
}


- (BOOL)isConcurrent
{
	return YES;
}

- (void) dealloc
{
    [curConnection cancelDownload];
	self.curConnection =nil;
	self.request =nil;
    self.messageId =nil;
	[super dealloc];
}

@end
