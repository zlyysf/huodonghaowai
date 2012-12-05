//
//  ImageDownloader.h
//
//  Created by Chenglei Shen on 1/17/12.
//

#import <Foundation/Foundation.h>
#import "ImageDownloaderDelegate.h"
@class ImageDownloader;

@interface ImageDownloader : NSObject {

    NSString *imageUrl;
    NSIndexPath *indexPathInTableView;
    NSDictionary *infoData;
    
    id<ImageDownloaderDelegate> delegate;
    
    NSMutableData *activeDownload;
    NSURLConnection *imageConnection;
    
    UIImage *downloadImage;
}

@property (nonatomic, retain) NSString *imageUrl;
@property (nonatomic, retain) NSIndexPath *indexPathInTableView;
@property (nonatomic, retain) NSDictionary *infoData;
@property (nonatomic, assign) id <ImageDownloaderDelegate> delegate;

@property (nonatomic, retain) NSMutableData *activeDownload;
@property (nonatomic, retain) NSURLConnection *imageConnection;
@property (nonatomic, retain) UIImage *downloadImage;

- (void)startDownload;
- (void)cancelDownload;

@end
