//
//  ImageDownloaderDelegate.h
//
//  Created by Chenglei Shen on 1/17/12.

#import <UIKit/UIKit.h>
@class ImageDownloader;

@protocol ImageDownloaderDelegate <NSObject>

- (void) imageDidDownload :(ImageDownloader *)downloader;

@end