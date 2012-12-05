//
//  NodeAsyncConnection.h
//
//

#import <Foundation/Foundation.h>

#define kCallBackTargetKey @"callbackTarget"
#define kCallBackMethodKey @"callbackMethod"

@interface NodeAsyncConnection : NSObject 
{

    NSMutableData *activeDownload;
    NSURLConnection *connection;

    
    NSMutableDictionary *result;    
	NSMutableArray * arrayResult;

    id customData;
    
    NSMutableDictionary * callbackDict;
}


@property (nonatomic, retain) NSMutableData *activeDownload;
@property (nonatomic, retain) NSURLConnection *connection;
@property (nonatomic, retain) NSMutableDictionary *result;
@property (nonatomic, retain) NSMutableArray * arrayResult;
@property (nonatomic, retain) id customData;
@property (nonatomic, retain) NSMutableDictionary * callbackDict;

- (void)startDownload :(NSMutableURLRequest *)httpRequest :(id)aCallbackTarget :(SEL)aCallbackMethod;
- (void)cancelDownload;
- (void)clearCallBackDict;
+ (NSMutableURLRequest *) createNodeHttpRequest :(NSString *)apiName parameters:(NSDictionary *)parameters;
+ (NSMutableURLRequest *) createUploadPhotoRequest :(NSString *)apiName parameters:(NSDictionary *)parameters;
+ (NSMutableURLRequest *) createHttpsRequest :(NSString *)apiName parameters:(NSDictionary *)parameters;
@end
