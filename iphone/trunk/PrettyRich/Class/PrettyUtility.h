//
//  PrettyUtility.h
//  PrettyRich
//
//  Created by miao liu on 5/31/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import <Foundation/Foundation.h>
#define kPastCellHeaderHeight 20
@interface PrettyUtility : NSObject
+ (NSString *)convertIntToInch:(NSInteger)number;
+ (NSString *) translateTime :(NSNumber *) seconds;
+ (NSString *) readString :(NSObject *) holder;
+ (BOOL) isNull :(NSObject *)object;
+ (BOOL) isEmpty :(NSObject *)object;
+ (NSString *) readNumberString :(NSObject *) holder;
+ (NSString *)dateFromInterval:(NSNumber *) seconds;
+ (NSString *)stampFromInterval:(NSNumber *) seconds;
+ (float) calculateHeight :(NSString*)text :(UILabel *)sampleLabel;
+ (float) calculateHeight:(NSString*) text: (UIFont*)withFont: (float)width :(UILineBreakMode)lineBreakMode;
+ (UIImage *)correctImageOrientation:(UIImage *)image :(uint)newImageSize;
+ (UIImage *)correctImageOrientation: (UIImage *)image  withScale: (double) scale;
+ (BOOL)isPastTime:(NSNumber *) seconds;
+ (BOOL)twoDateIsSameDay:(NSDate *)fist second:(NSDate *)second;
+ (NSString *)getCity:(NSString*)location;
+ (NSString *)getPhotoUrl:(NSString *)photoPath :(NSString*)type;
+ (NSString *)getlatlng:(NSDictionary *)regionData;
+ (NSString *)getCounty:(NSDictionary *)region;
+ (BOOL)isInterval1:(NSNumber *) second1 andInterval2:(NSNumber *) second2 largerThan:(int)seconds;
+(UIImage *)cropImage:(UIImage *)originImg forWitdh:(float)rectWidth andHeight:(float)rectHeight;
+(NSString *)cutWhiteAndNewLine:(NSString *)originString;
@end
