//
//  ImageDownloader.m
//
//  Created by Chenglei Shen on 1/17/12.
//

#import "ImageDownloader.h"


@implementation ImageDownloader
@synthesize imageUrl, indexPathInTableView, delegate, activeDownload, imageConnection, downloadImage, infoData;

- (void)dealloc
{
    //NSLog(@"ImageDownloader deallocated.");
    [imageUrl release];
    [indexPathInTableView release];
    [infoData release];
    [activeDownload release];
    
    [imageConnection cancel];
    [imageConnection release];
    
    [downloadImage release];
    //[delegate release];
    
    [super dealloc];
}


- (void)startDownload
{
    self.activeDownload = [NSMutableData data];

    //NSLog(@"imgurl%@",imageUrl);
    NSURLConnection *conn = [[NSURLConnection alloc] initWithRequest:
                             [NSURLRequest requestWithURL:
                              [NSURL URLWithString:imageUrl]] delegate:self];
                              
    self.imageConnection = conn;
    [conn release];
   // NSLog(@"start one image download progress. %@, the delegate is %@", imageUrl, delegate);
}

- (void)cancelDownload
{
    //NSLog(@"Canceled one image download progress. %@, the delegate is %@", imageUrl, delegate);
    [self.imageConnection cancel];
    self.imageConnection = nil;
    self.activeDownload = nil;
    delegate = nil;
}


- (void)connection:(NSURLConnection *)connection didReceiveData:(NSData *)data
{
    [self.activeDownload appendData:data];
}

- (void)connection:(NSURLConnection *)connection didFailWithError:(NSError *)error
{
    //NSLog(@"connection failed.");
	// Clear the activeDownload property to allow later attempts
    self.activeDownload = nil;
    
    // Release the connection now that it's finished
    self.imageConnection = nil;
    
    self.downloadImage = nil;
    
    // call our delegate and tell it that our icon is ready for display
    if ([delegate respondsToSelector:@selector(imageDidDownload:)] == TRUE)
    {
        [delegate imageDidDownload:self];        
    }    
}

- (void)connectionDidFinishLoading:(NSURLConnection *)connection
{
    //NSLog(@"Finished to download one image : %@",imageUrl);
    // Set appIcon and clear temporary data/image
    downloadImage = [[UIImage alloc] initWithData:self.activeDownload];
    //NSLog(@"downloadImageSize:%f,%f",downloadImage.size.width,downloadImage.size.height);
    
    self.activeDownload = nil;
    // Release the connection now that it's finished
    self.imageConnection = nil;
    
    // call our delegate and tell it that our icon is ready for display
    if (delegate != nil && [delegate respondsToSelector:@selector(imageDidDownload:)] == TRUE)
    {
        [delegate imageDidDownload:self];        
    }
}

@end
