//
//  MessageGetOperation.m
//  PrettyRich
//
//  Created by liu miao on 6/21/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "MessageGetOperation.h"

@implementation MessageGetOperation
@synthesize request,delegate,curConnection,endFlag,messageId;
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
                                    :@selector(didEndGetMessage:)];
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

- (void) didEndGetMessage:(NodeAsyncConnection *)connection
{
	if ([self isCancelled]) 
	{
		return;
	}
	if (self.delegate != nil) 
	{
		[self.delegate didFinishGetMessage:connection messageId:self.messageId];
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
