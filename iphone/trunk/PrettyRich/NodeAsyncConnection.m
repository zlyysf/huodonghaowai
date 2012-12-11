//
//  NodeAsyncConnection.m


#import "CJSONDeserializer.h"
#import "NodeAsyncConnection.h"
#import "CJSONSerializer.h"
#import "CustomAlertView.h"
#import "PrettyGlobalService.h"
#import "TongQuConfig.h"
@implementation NodeAsyncConnection

@synthesize activeDownload, connection,result, customData, arrayResult;
@synthesize callbackDict;

- (id) init
{
    if (self = [super init])
    {
        callbackDict = [[NSMutableDictionary alloc] init];
    }
    
    return self;
}

- (void)dealloc
{

    [activeDownload release];
    [connection release];
    [result release];
    [customData release];
    [arrayResult release];
    
    [callbackDict release];
    [super dealloc];
}

- (void)startDownload :(NSMutableURLRequest *)httpRequest :(id)aCallbackTarget :(SEL)aCallbackMethod
{
    //self.callbackTarget = aCallbackTarget;
    //self.callbackMethod = aCallbackMethod;    
    if (aCallbackMethod != nil) 
    {
        [self.callbackDict setObject:NSStringFromSelector(aCallbackMethod) forKey:kCallBackMethodKey]; 
    }
    if (aCallbackTarget != nil) 
    {
        [self.callbackDict setObject:aCallbackTarget forKey:kCallBackTargetKey];
    }

    self.activeDownload = [NSMutableData data];
    connection = [[NSURLConnection alloc] initWithRequest:httpRequest delegate:self];
    
}
- (void)cancelDownload
{
    [self.connection cancel];
    self.connection = nil;
    self.activeDownload = nil;
    self.customData = nil;
	self.result = nil;
	self.arrayResult = nil;
    
    [self clearCallBackDict];
}

- (void)connection:(NSURLConnection *)connection didSendBodyData:(NSInteger)bytesWritten 
 totalBytesWritten:(NSInteger)totalBytesWritten totalBytesExpectedToWrite:(NSInteger)totalBytesExpectedToWrite
{
        id callbackTarget = [self.callbackDict objectForKey:kCallBackTargetKey];
        if (callbackTarget!= nil) 
        {
            if (totalBytesWritten == bytesWritten && [callbackTarget respondsToSelector:@selector(startProgressBarRun)]) 
            {
				[callbackTarget performSelectorOnMainThread:@selector(startProgressBarRun) withObject:self waitUntilDone:NO];
            }
        }

}

- (void)connection:(NSURLConnection *)connection didReceiveData:(NSData *)data
{
    [self.activeDownload appendData:data];
}

- (void)connection:(NSURLConnection *)connection didFailWithError:(NSError *)error
{
    // Clear the activeDownload property to allow later attempts
    self.activeDownload = nil;
    
    // Release the connection now that it's finished
    self.connection = nil;
    //NSLog(@"%@",[error localizedDescription]);
    if ([error code] == NSURLErrorNotConnectedToInternet ||[error code] == NSURLErrorCannotConnectToHost)
    {
        CustomAlertView *errorAlert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:@"网络连接失败, 请稍后再试." otherButton:nil cancelButton:nil delegate:nil duration:2.0];
        [errorAlert show];
        [errorAlert release];
    }
//    else {
//        CustomAlertView *errorAlert = [[CustomAlertView alloc]initWithFrame:CGRectMake(0, 0, 320, 480) messgage:@"There was an error, please try again later." otherButton:nil cancelButton:nil delegate:nil duration:2.0];
//        [errorAlert show];
//        [errorAlert release];
//    }

    id callbackTarget = [self.callbackDict objectForKey:kCallBackTargetKey];
    SEL callbackMethod = NSSelectorFromString([self.callbackDict objectForKey:kCallBackMethodKey]);
    
    // call our delegate and tell it that our icon is ready for display    
    if (callbackTarget != nil && callbackMethod != nil && [callbackTarget respondsToSelector:callbackMethod] == TRUE)
    {
        [callbackTarget performSelectorOnMainThread:callbackMethod withObject:nil waitUntilDone:NO];
    }	
    [self clearCallBackDict];
}

- (void)connectionDidFinishLoading:(NSURLConnection *)connection
{	
    if (self.activeDownload != nil && [self.activeDownload length] != 0) 
    {
		CJSONDeserializer * deserializer = [[CJSONDeserializer alloc] init];
		NSError *error = nil;
		NSObject *unkownTypeResult = [deserializer deserialize:self.activeDownload error:&error];
		//NSString *descriptionString = [[NSString alloc] initWithData:self.activeDownload encoding:NSUTF8StringEncoding];
		//NSLog(descriptionString);
            
		if ([unkownTypeResult isKindOfClass:[NSMutableDictionary class]]) {
			self.result = (NSMutableDictionary *)unkownTypeResult;
		}
		else if ([unkownTypeResult isKindOfClass:[NSMutableArray class]])
		{
			self.arrayResult = (NSMutableArray * )unkownTypeResult;
			
		}

		[deserializer release];
        NSLog(@"%@", [self.result description]);
    }

    // Release the connection now that it's finished
    self.activeDownload = nil;

    self.connection = nil;
	
    id callbackTarget = [self.callbackDict objectForKey:kCallBackTargetKey];
    SEL callbackMethod = NSSelectorFromString([self.callbackDict objectForKey:kCallBackMethodKey]);
    
    // call our delegate and tell it that our icon is ready for display
    if (callbackTarget != nil && callbackMethod != nil && [callbackTarget respondsToSelector:callbackMethod] == TRUE)
    {
        if ([[self.result objectForKey:@"status"]isEqualToString:@"fail"])
        {
            NSString *errorCode = [self.result objectForKey:@"code"];
            if (errorCode != nil)
            {
                PrettyGlobalService *globalService = [PrettyGlobalService shareInstance];
                [globalService handleError:errorCode];
            }

        }
        [callbackTarget performSelectorOnMainThread:callbackMethod withObject:self waitUntilDone:NO]; 
    }
    [self clearCallBackDict];
}

- (BOOL)connection:(NSURLConnection *)connection canAuthenticateAgainstProtectionSpace:(NSURLProtectionSpace *)space 
{
    return YES;
}

- (void)connection:(NSURLConnection *)connection didReceiveAuthenticationChallenge:(NSURLAuthenticationChallenge *)challenge 
{
    if ([challenge.protectionSpace.authenticationMethod isEqualToString:NSURLAuthenticationMethodServerTrust])
    {
        [challenge.sender useCredential:[NSURLCredential credentialForTrust:challenge.protectionSpace.serverTrust] forAuthenticationChallenge:challenge];
    }
    
    [challenge.sender continueWithoutCredentialForAuthenticationChallenge:challenge];
}

- (void)connection:(NSURLConnection *)connection didReceiveResponse:(NSHTTPURLResponse *)response
{
	// process cookies from response headers, look for L and S
	NSArray *all = [NSHTTPCookie cookiesWithResponseHeaderFields:[response allHeaderFields] forURL:[NSURL URLWithString:@""]];
	
		self.result = [NSMutableDictionary dictionary];
	
	
	for (NSHTTPCookie *cookie in all)
	{           
		//NSLog(@"Total cookie count %d Name: %@ : Value: %@, Expires: %@, Domain:%@",[all count], cookie.name, cookie.value, cookie.expiresDate, cookie.domain);
         if (cookie.value!=nil &&[cookie.value compare:@"" options:NSCaseInsensitiveSearch]!=NSOrderedSame)
        {
            [[NSUserDefaults standardUserDefaults]setObject:cookie.value forKey:@"PrettyUserSession"];
            [[NSUserDefaults standardUserDefaults]synchronize];
        }
        
	}    
}

- (void)clearCallBackDict
{
    // this method is for break the reference count circle about async and callbacktarget.
    [self.callbackDict removeAllObjects];
}

+ (NSMutableURLRequest *) createNodeHttpRequest :(NSString *)apiName parameters:(NSDictionary *)parameters
{
    NSString *host;
    if (ServerProd)
    {
        host = @"http://42.121.122.47:3000";//prod
    }
    else
    {
        host = @"http://42.121.122.47:4000";//stage
    }
    NSLog(@"%@",host);
    //static NSString *host = @"http://ec2-23-21-136-120.compute-1.amazonaws.com:4000";//stage
	if (apiName == nil)
    {
        return nil;
    }

	NSURL *appUrl = [NSURL URLWithString:[host stringByAppendingString:apiName]];
	NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:appUrl];
	[request setHTTPMethod:@"POST"];
	
	[request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
	CJSONSerializer *serializer = [CJSONSerializer serializer];
	NSString *parameterString = [serializer serializeObject:parameters];
	NSData *bodyData = [parameterString dataUsingEncoding:NSUTF8StringEncoding ];
	[request setHTTPBody:bodyData];
    NSString *prettyCookie = [NSString stringWithFormat:@"connect.sid=%@",[[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserSession"]];
	[request setValue:prettyCookie forHTTPHeaderField:@"Cookie"];
    return request;    
}
+ (NSMutableURLRequest *) createHttpsRequest :(NSString *)apiName parameters:(NSDictionary *)parameters
{
    NSString *host;
    if (ServerProd)
    {
        host = @"https://42.121.122.47:3010";//prod
    }
    else
    {
        host = @"https://42.121.122.47:4010";//stage
    }
    NSLog(@"%@",host);
    //static NSString *host = @"https://ec2-23-21-136-120.compute-1.amazonaws.com:4010";//stage
	if (apiName == nil)
    {
        return nil;
    }
    
	NSURL *appUrl = [NSURL URLWithString:[host stringByAppendingString:apiName]];
	NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:appUrl];
	[request setHTTPMethod:@"POST"];
	
	[request setValue:@"application/json" forHTTPHeaderField:@"Content-Type"];
	CJSONSerializer *serializer = [CJSONSerializer serializer];
	NSString *parameterString = [serializer serializeObject:parameters];
	NSData *bodyData = [parameterString dataUsingEncoding:NSUTF8StringEncoding ];
	[request setHTTPBody:bodyData];
    
    return request; 
}
+ (NSMutableURLRequest *) createUploadPhotoRequest :(NSString *)apiName parameters:(NSDictionary *)parameters
{
    NSString *host;
    if (ServerProd)
    {
        host = @"http://42.121.122.47:3000";//prod
    }
    else
    {
        host = @"http://42.121.122.47:4000";//stage
    }
    NSLog(@"%@",host);
    //static NSString *host = @"http://ec2-23-21-136-120.compute-1.amazonaws.com:4000";//stage
	if (apiName == nil)
    {
        return nil;
    }

	NSURL *appUrl = [NSURL URLWithString:[host stringByAppendingString:apiName]];
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:appUrl];

    NSString *TWITTERFON_FORM_BOUNDARY = @"AaB03x";

    
    NSString *MPboundary=[NSString stringWithFormat:@"--%@",TWITTERFON_FORM_BOUNDARY];

    NSString *endMPboundary=[NSString stringWithFormat:@"%@--",MPboundary];


    NSData* data = [parameters objectForKey:@"image"];

    NSMutableString *body=[[NSMutableString alloc]init];

    NSArray *keys= [parameters allKeys];
    

    for(int i=0;i<[keys count];i++)
    {

        NSString *key=[keys objectAtIndex:i];

        if(![key isEqualToString:@"image"])
        {

            [body appendFormat:@"%@\r\n",MPboundary];

            [body appendFormat:@"Content-Disposition: form-data; name=\"%@\"\r\n\r\n",key];

            [body appendFormat:@"%@\r\n",[parameters objectForKey:key]];            
        }
    }
    

    [body appendFormat:@"%@\r\n",MPboundary];

    [body appendFormat:@"Content-Disposition: form-data; name=\"image\"; filename=\"iphone.jpg\"\r\n"];

    [body appendFormat:@"Content-Type: image/x-png\r\n\r\n"];
    

    NSString *end=[NSString stringWithFormat:@"\r\n%@",endMPboundary];

    NSMutableData *myRequestData=[NSMutableData data];

    [myRequestData appendData:[body dataUsingEncoding:NSUTF8StringEncoding]];
    [body release];

    [myRequestData appendData:data];

    [myRequestData appendData:[end dataUsingEncoding:NSUTF8StringEncoding]];
    

    NSString *content=[NSString stringWithFormat:@"multipart/form-data; boundary=%@",TWITTERFON_FORM_BOUNDARY];

    [request setValue:content forHTTPHeaderField:@"Content-Type"];

    [request setValue:[NSString stringWithFormat:@"%d", [myRequestData length]] forHTTPHeaderField:@"Content-Length"];
    
    NSString *prettyCookie = [NSString stringWithFormat:@"connect.sid=%@",[[NSUserDefaults standardUserDefaults]objectForKey:@"PrettyUserSession"]];

	[request setValue:prettyCookie forHTTPHeaderField:@"Cookie"];

    [request setHTTPBody:myRequestData];

    [request setHTTPMethod:@"POST"];  


    return request;    
}


@end
