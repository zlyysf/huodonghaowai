//
//  ImagesDownloadManager.h
//
//  Created by Chenglei Shen on 1/17/12.
//

#import <Foundation/Foundation.h>
#import "ImageDownloader.h"
#import "ImageDownloaderDelegate.h"

@interface ImagesDownloadManager : NSObject <ImageDownloaderDelegate>{
    
    NSMutableDictionary * downloadsInProgress;
    id<ImageDownloaderDelegate> imageDownloadDelegate;
}
@property (nonatomic, retain) NSMutableDictionary * downloadsInProgress;
@property (nonatomic, assign) id<ImageDownloaderDelegate> imageDownloadDelegate;

- (void) downloadImageWithUrl:(NSString *) imageUrl;
- (void) downloadImageWithUrl:(NSString *) imageUrl forIndexPath: (NSIndexPath *) indexPath;
- (void) removeOneDownloaderWithIndexPath:(NSIndexPath *) indexPath;
- (void) removeOneDownloadWithUrl: (NSString *) imageUrl;
- (void) cancelOneDownloadWithUrl: (NSString *) imageUrl;
- (void) cancelOneDownloadWithIndexPath: (NSIndexPath *) indexPath;
- (void) cancelAllDownloadInProgress;
- (void) removeAllDownloadInProgress;
- (BOOL) hasDownloaderForImageUrl: (NSString *) imageUrl;
- (BOOL) hasDownloaderForIndexPath: (NSIndexPath*) indexPath;
@end
