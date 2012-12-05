//
//  ImagesDownloadManager.m
//
//  Created by Chenglei Shen on 1/17/12.
//

#import "ImagesDownloadManager.h"


@implementation ImagesDownloadManager

@synthesize downloadsInProgress,imageDownloadDelegate;


-(id) init
{
    if ((self = [super init]) != nil) 
    {
        downloadsInProgress = [[NSMutableDictionary alloc] init];
    }
    return self;
}
-(void) dealloc
{
    //NSLog(@"ImagesDownloadManager deallocated.");
    [self cancelAllDownloadInProgress];
    [downloadsInProgress release];
    [super dealloc];
}

-(void) cancelAllDownloadInProgress
{
    if (self.downloadsInProgress != nil && [self.downloadsInProgress count] != 0) 
    {
        NSArray * downloaders = nil;
        downloaders = [self.downloadsInProgress allValues];
        if (downloaders != nil) 
        {
            for (ImageDownloader * downloader in downloaders) 
            {
                if (downloader != nil && [downloader respondsToSelector:@selector(cancelDownload)]) 
                {
                    [downloader cancelDownload];
                    //downloader.delegate = nil;
                }
                
            }
        }
        [self.downloadsInProgress removeAllObjects];
    }
    
}

-(void) downloadImageWithUrl:(NSString * ) imageUrl
{
   
    ImageDownloader *downloader = [downloadsInProgress objectForKey:imageUrl];
    
    if (downloader == nil)
    {
        //NSLog(@"Start download pic with imageUrl");
        downloader = [[ImageDownloader alloc] init];
        downloader.imageUrl = imageUrl;
        downloader.delegate = self;
        [downloadsInProgress setObject:downloader forKey:imageUrl];
        [downloader startDownload];
        [downloader release];
    }
}

- (void) downloadImageWithUrl:(NSString *) imageUrl forIndexPath: (NSIndexPath *) indexPath
{
    ImageDownloader *downloader = [downloadsInProgress objectForKey:indexPath];
    
    
    if (downloader == nil )
    {
         //NSLog(@"Start download pic with indexpath");
		//1. first download cell image ,
		
        downloader = [[ImageDownloader alloc] init];
        downloader.imageUrl = imageUrl;
        downloader.indexPathInTableView = indexPath;
        downloader.delegate = self;
        [downloadsInProgress setObject:downloader forKey:indexPath];
        
        [downloader startDownload];
        [downloader release];
    }
	else if([downloader.imageUrl compare:imageUrl]!=NSOrderedSame)
	{
        //NSLog(@"Start download new pic %@ with indexpath %@, the old image is : %@",imageUrl, [indexPath description], downloader.imageUrl);
		//2. cell changing or changed, set to new .
		[downloader cancelDownload];
        // if you want to remove an object with the key indexPath, you can not directly use index as param, you should use [indexPath description]
        // because the mutable dictionary will release this indexPath once if it's not string. 
        //[downloadsInProgress removeObjectForKey:[indexPath description]];
		downloader = nil;
		
		downloader = [[ImageDownloader alloc] init];
        downloader.imageUrl = imageUrl;
        downloader.indexPathInTableView = indexPath;
        downloader.delegate = self;
        [downloader startDownload];
        [downloadsInProgress setObject:downloader forKey:indexPath];
        [downloader release];
	}
    
}


- (void) removeOneDownloaderWithIndexPath :(NSIndexPath *) indexPath
{
    if ([self.downloadsInProgress objectForKey:indexPath] != nil) 
    {
        [self.downloadsInProgress removeObjectForKey:indexPath];
    }
    
}

- (void) removeOneDownloadWithUrl: (NSString *) imageUrl
{
    if ([self.downloadsInProgress objectForKey:imageUrl] != nil) 
    {
        [self.downloadsInProgress removeObjectForKey:imageUrl];
    }
}

- (void) cancelOneDownloadWithUrl: (NSString *) imageUrl
{
    ImageDownloader * downloader = nil;
    downloader = (ImageDownloader * )[self.downloadsInProgress objectForKey:imageUrl];
    if (downloader != nil && [downloader respondsToSelector:@selector(cancelDownload)]) 
    {
        [downloader cancelDownload];
        //downloader.delegate = nil;
    }
}
- (void) cancelOneDownloadWithIndexPath: (NSIndexPath *) indexPath
{
    ImageDownloader * downloader = nil;
    downloader = (ImageDownloader * )[self.downloadsInProgress objectForKey:indexPath];
    if (downloader != nil && [downloader respondsToSelector:@selector(cancelDownload)]) 
    {
        [downloader cancelDownload];
        //downloader.delegate = nil;
    }
}
- (void) imageDidDownload :(ImageDownloader *)downloader
{
    if (imageDownloadDelegate != nil && [imageDownloadDelegate respondsToSelector:@selector(imageDidDownload:)]) 
    {
        // set the view controller ui when one of the downloader finish his job.
        //NSLog(@"did download call back from downloader");
        [imageDownloadDelegate imageDidDownload:downloader];
    }
}

- (void) removeAllDownloadInProgress
{
    [self.downloadsInProgress removeAllObjects];
}

- (BOOL) hasDownloaderForImageUrl: (NSString *) imageUrl
{
    return ([self.downloadsInProgress objectForKey:imageUrl]!=nil )? YES: NO;
}
- (BOOL) hasDownloaderForIndexPath: (NSIndexPath*) indexPath
{
    return ([self.downloadsInProgress objectForKey:indexPath]!=nil )? YES: NO;
}
@end
