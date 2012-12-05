//
//  PrettyUtility.m
//  PrettyRich
//
//  Created by miao liu on 5/31/12.
//  Copyright (c) 2012 __MyCompanyName__. All rights reserved.
//

#import "PrettyUtility.h"
static inline double radians (double degrees) {return degrees * M_PI/180;}
@implementation PrettyUtility

+ (NSString *)getPhotoUrl:(NSString *)photoPath :(NSString*)type
{
    // 75*75,112*112，分别用s(small),m(medium),l(large)
    NSString *prefix = @"http://s3.amazonaws.com/ysf1/";
    NSString *photoUrl;
    if ([type isEqualToString:@"s"]) 
    {
        NSArray *component = [photoPath componentsSeparatedByString:@"."];
        NSRange range = [photoPath rangeOfString:[component lastObject]];
        int index = range.location-1;
        NSMutableString *newPath = [NSMutableString stringWithString:photoPath];
        [newPath insertString:@"s" atIndex:index];
         photoUrl = [prefix stringByAppendingString:newPath];
        return photoUrl;
    }
    else if([type isEqualToString:@"fw"])
    {
//        NSArray *component = [photoPath componentsSeparatedByString:@"."];
//        NSRange range = [photoPath rangeOfString:[component lastObject]];
//        int index = range.location-1;
//        NSMutableString *newPath = [NSMutableString stringWithString:photoPath];
//        [newPath insertString:@"fw" atIndex:index];
//        photoUrl = [prefix stringByAppendingString:newPath];
        photoUrl = [prefix stringByAppendingString:photoPath];
        return photoUrl;
    }
    else
    {
        photoUrl = [prefix stringByAppendingString:photoPath];
        return photoUrl;
    }

}
+ (BOOL)isPastTime:(NSNumber *) seconds
{
    if ([[seconds stringValue] length] > 10) {
        seconds	 = [NSNumber numberWithInteger:[[[seconds stringValue] substringToIndex:10] intValue]];
    }
    NSDate* date=[NSDate dateWithTimeIntervalSince1970:[seconds intValue]];
    NSDate* currentDate = [NSDate date];
    if ([date compare:currentDate] == NSOrderedAscending)
    {
        return YES;
    }
    else
    {
        return NO;
    }
//    NSTimeInterval timeInterval = [date timeIntervalSinceNow];
//    if (timeInterval>=0)
//    {
//        return NO;
//    }
//    else {
//        return YES;
//    }
    
}
+ (NSString *)convertIntToInch:(NSInteger)number;
{
    int total = (number*100)/2.54;
    int foot = total/1200;
    int inch = ((total%1200))/100;
    return [NSString stringWithFormat:@"cm(%d'%d'')",foot,inch];
}
+ (NSString *) translateTime :(NSNumber *) seconds
{
    if(seconds == nil || [seconds intValue] == 0)
    return NSLocalizedString(@"",@"");
    // get the previous 10 entites
    if ([[seconds stringValue] length] > 10) {
        seconds	 = [NSNumber numberWithInteger:[[[seconds stringValue] substringToIndex:10] intValue]];
    }
    NSDate *date = [NSDate dateWithTimeIntervalSince1970:[seconds intValue]];
    NSTimeInterval timeInterval = - [date timeIntervalSinceNow];

    NSString *timeStr = @"";

    // in terms of minutes
    int minutes = nearbyint(timeInterval / 60.0);

    if (minutes < 60)
    {
        if (minutes <= 1)
        {
            timeStr = NSLocalizedString(@"1分钟前",@"");
        }
        else
        {
            timeStr = [NSString stringWithFormat:NSLocalizedString(@"%d分钟前",@""), minutes];
        }
        
        return timeStr;        
    }

    // in terms of hours
    int hours = nearbyint(minutes / 60.0);

    if (hours < 24)
    {
        if (hours <= 1)
        {
            timeStr = NSLocalizedString(@"1小时前",@"");
        }
        else 
        {
            timeStr = [NSString stringWithFormat:NSLocalizedString(@"%d小时前",@""), hours];
        }
        
        return timeStr;
    }

    // in terms of days or months
    int days = nearbyint(hours / 24.0);

    if (days < 30)
    {
        if (days <= 1)
        {
            timeStr = NSLocalizedString(@"1天前",@"");
        }
        else if (days < 30)
        {
            timeStr = [NSString stringWithFormat:NSLocalizedString(@"%d天前",@""), days];
        }
        
        return timeStr;
    }

    int months = nearbyint(days / 30);

    if (months <= 1)
    {
        timeStr = NSLocalizedString(@"1个月前",@"");
    }
    else 
    {
        timeStr = [NSString stringWithFormat:NSLocalizedString(@"%d个月前",@""), months];
    }

    return timeStr;
}
+ (NSString *) readString :(NSObject *) holder
{
    if (holder == nil || (NSNull *)holder == [NSNull null])
    {
        return @"";
    }
    else if ([holder isKindOfClass:[NSString class]])
    {
        return (NSString *)holder;
    }
    else if ([holder isKindOfClass:[NSNumber class]])
    {
        NSNumberFormatter * formatter = [[NSNumberFormatter alloc]init];
        [formatter setNumberStyle:NSNumberFormatterNoStyle];
        NSString *numStr = [formatter stringFromNumber:(NSNumber *)holder];
        [formatter release];
        return numStr;
    }
    else if ([holder isKindOfClass:[NSArray class]])
    {
        return [(NSArray *)holder componentsJoinedByString:@", "];
    }
    
    return @"";
}
+ (NSString *) readNumberString :(NSObject *) holder
{
    if (holder == nil || (NSNull *)holder == [NSNull null])
    {
        return @"0";
    }
    else if ([holder isKindOfClass:[NSString class]])
    {
        return (NSString *)holder;
    }
    else if ([holder isKindOfClass:[NSNumber class]])
    {
        NSNumberFormatter * formatter = [[NSNumberFormatter alloc]init];
        [formatter setNumberStyle:NSNumberFormatterNoStyle];
        NSString *numStr = [formatter stringFromNumber:(NSNumber *)holder];
        [formatter release];
        return numStr;
    }
    
    return @"0";
}

+ (BOOL) isEmpty :(NSObject *)object
{
    return  (object == nil) || ([object isKindOfClass:[NSString class]] && [(NSString *)object compare:@""] == NSOrderedSame);
}
+ (BOOL) isNull :(NSObject *)object
{
    if (object == nil || (NSNull *)object == [NSNull null])
    {
        return TRUE;
    }
    else if ([object isKindOfClass:[NSString class]] && [(NSString *)object compare:@""] == NSOrderedSame)
    {
        return TRUE;
    }
    else
    {
        return FALSE;
    }
    
}
+ (float) calculateHeight:(NSString*) text: (UIFont*)withFont: (float)width :(UILineBreakMode)lineBreakMode
{
    [text retain];
    [withFont retain];
    
    CGSize suggestedSize = [text sizeWithFont:withFont constrainedToSize:CGSizeMake(width, 9999) lineBreakMode:lineBreakMode];
    [text release];
    [withFont release];
    return suggestedSize.height;
}
+ (float) calculateHeight :(NSString*)text :(UILabel *)sampleLabel
{
    CGSize originSize = sampleLabel.frame.size;
    originSize.height = 9999;
    
    CGSize rectSize = [text sizeWithFont:sampleLabel.font constrainedToSize:originSize lineBreakMode:sampleLabel.lineBreakMode];
    
    return rectSize.height;
}
+ (NSString *)dateFromInterval:(NSNumber *) seconds
{
    if(seconds == nil || [seconds intValue] == 0)
        return @"";
    if ([[seconds stringValue] length] > 10) {
        seconds	 = [NSNumber numberWithInteger:[[[seconds stringValue] substringToIndex:10] intValue]];
    }
    NSDate *_data = [NSDate dateWithTimeIntervalSince1970:[seconds doubleValue]];
    NSDate *current = [NSDate date];
    NSString *time;
    if ([self twoDateIsSameDay:_data second:current])
    {
        NSDateFormatter *formatter= [[NSDateFormatter alloc] init];
        [formatter setLocale:[[[NSLocale alloc] initWithLocaleIdentifier:@"zh_Hans"] autorelease]];
        [formatter setAMSymbol:@"上午"];
        [formatter setPMSymbol:@"下午"];
        [formatter setDateFormat:@"HH:mm"];
        time = [formatter stringFromDate:_data];
        [formatter release];
    }
    else
    {
        NSDateFormatter *formatter= [[NSDateFormatter alloc] init];
        [formatter setLocale:[[[NSLocale alloc] initWithLocaleIdentifier:@"zh_Hans"] autorelease]];
        [formatter setDateFormat:@"MM月dd日HH:mm"];
        time = [formatter stringFromDate:_data];
        [formatter release];
    }
    //MMM dd h:mm a
    return time;

}
+ (NSString *)stampFromInterval:(NSNumber *) seconds
{
    if(seconds == nil || [seconds intValue] == 0)
        return @"";
    if ([[seconds stringValue] length] > 10) {
        seconds	 = [NSNumber numberWithInteger:[[[seconds stringValue] substringToIndex:10] intValue]];
    }
    NSDate *_data = [NSDate dateWithTimeIntervalSince1970:[seconds doubleValue]];
    NSDate *current = [NSDate date];
    NSString *time;
    if ([self twoDateIsSameDay:_data second:current])
    {
        NSDateFormatter *formatter= [[NSDateFormatter alloc] init];
        [formatter setLocale:[[[NSLocale alloc] initWithLocaleIdentifier:@"zh_Hans"] autorelease]];
        [formatter setAMSymbol:@"上午"];
        [formatter setPMSymbol:@"下午"];
        [formatter setDateFormat:@"HH:mm"];
        time = [formatter stringFromDate:_data];
        [formatter release];
    }
    else
    {
        NSDateFormatter *formatter= [[NSDateFormatter alloc] init];
        [formatter setLocale:[[[NSLocale alloc] initWithLocaleIdentifier:@"zh_Hans"] autorelease]];
        [formatter setDateFormat:@"MM月dd日"];
        time = [formatter stringFromDate:_data];
        [formatter release];
    }
    //MMM dd h:mm a
    return time;
}

+ (BOOL)isInterval1:(NSNumber *) second1 andInterval2:(NSNumber *) second2 largerThan:(int)seconds
{
    int number1;
    if ([[second1 stringValue] length] > 10)
    {
        number1= [[[second1 stringValue] substringToIndex:10] intValue];
    }
    else {
        number1 = [second1 intValue];
    }
   
    int number2;
    if ([[second2 stringValue] length] > 10)
    {
        number2= [[[second2 stringValue] substringToIndex:10] intValue];
    }
    else {
        number2 = [second2 intValue];
    }

    if ((number2 - number1) > seconds)
    {
        return YES;
    }
    else {
        return NO;
    }

}
+ (UIImage *)correctImageOrientation:(UIImage *)image :(uint)newImageSize
{
	if (image == nil || newImageSize == 0)
    {
        return nil;
    }
	
    // scale down image, if the image size is larger than maximum size allowed for photo uploading
    double scaleWidth = newImageSize / image.size.width;
    double scaleHeight = newImageSize / image.size.height;
    double properScale;
    
    if (scaleWidth < 1.0 || scaleHeight < 1.0)
    { 
        if (scaleWidth < scaleHeight)
        {
            properScale = scaleWidth;
        }
        else 
        {
            properScale = scaleHeight;
        }
    }
    else 
    {
        // no need to scale down image, if the image is already smaller than max size
        properScale = 1.0;
    }
    
    UIImage *result = [PrettyUtility correctImageOrientation:image withScale:properScale];
	
	return result;	
}
+ (UIImage *)correctImageOrientation: (UIImage *)image  withScale: (double) scale
{
    CGImageRef imageRef = [image CGImage];
	CGImageAlphaInfo alphaInfo = CGImageGetAlphaInfo(imageRef);
	CGColorSpaceRef colorSpaceInfo = (CGColorSpaceRef)[(id)CGColorSpaceCreateDeviceRGB() autorelease];
	
	if (alphaInfo == kCGImageAlphaNone)
		alphaInfo = kCGImageAlphaNoneSkipLast;
    CGContextRef bitmap;
    
	bitmap = CGBitmapContextCreate(NULL, image.size.width * scale, image.size.height * scale, CGImageGetBitsPerComponent(imageRef), CGImageGetBytesPerRow(imageRef), colorSpaceInfo, alphaInfo);
    
    if (bitmap == nil)
    {
        // given image format is not supported
        return nil;
    }
    
    double width, height;
    if (image.imageOrientation == UIImageOrientationUp | image.imageOrientation == UIImageOrientationDown) 
    {
        width = image.size.width;
        height = image.size.height;
	} 
    else 
    {
        width = image.size.height;
        height = image.size.width;
	}
    
    width = width * scale;
    height = height * scale;
    
    if (image.imageOrientation == UIImageOrientationLeft) 
    {
		CGContextRotateCTM (bitmap, radians(90));
		CGContextTranslateCTM (bitmap, 0, -height);
		
	} 
    else if (image.imageOrientation == UIImageOrientationRight) 
    {
		CGContextRotateCTM (bitmap, radians(-90.));
        CGContextTranslateCTM (bitmap, -width, 0);
        
	} 
    else if (image.imageOrientation == UIImageOrientationUp) 
    {
	} 
    else if (image.imageOrientation == UIImageOrientationDown) 
    {
		CGContextTranslateCTM (bitmap, width,height);
		CGContextRotateCTM (bitmap, radians(-180.));
	}
    
    CGContextDrawImage(bitmap, CGRectMake(0, 0, width, height), imageRef);
    
	CGImageRef ref = CGBitmapContextCreateImage(bitmap);
	UIImage *result = [UIImage imageWithCGImage:ref];
    
	CGContextRelease(bitmap);
	CGImageRelease(ref);
    
    return result;
    
}
+ (BOOL)twoDateIsSameDay:(NSDate *)fist second:(NSDate *)second
{
    NSCalendar* calendar = [NSCalendar currentCalendar];
    unsigned unitFlags = NSYearCalendarUnit | NSMonthCalendarUnit |  NSDayCalendarUnit;
    NSDateComponents* comp1 = [calendar components:unitFlags fromDate:fist];
    NSDateComponents* comp2 = [calendar components:unitFlags fromDate:second];
    return [comp1 day]   == [comp2 day] &&
    
    [comp1 month] == [comp2 month] &&
    
    [comp1 year]  == [comp2 year];

}
+ (NSString *)getCity:(NSString*)location
{
    NSArray *citypart = [location componentsSeparatedByString:@"+"];
    NSString *city = (NSString *)[citypart lastObject];
    return  city;
}
+ (NSString *)getlatlng:(NSDictionary *)regionData
{
    NSDictionary *coordinateDict = [[regionData valueForKey:@"geometry"] valueForKey:@"location"];
                        
    float lat = [[coordinateDict valueForKey:@"lat"] floatValue];
    float lng = [[coordinateDict valueForKey:@"lng"] floatValue];
    NSString *latlng = [NSString stringWithFormat:@"%f,%f",lat,lng];
    return latlng;

}
+ (NSString *)getCounty:(NSDictionary *)region
{
    NSDictionary *addressDict = [region valueForKey:@"address_components"];
    NSString *city = nil;
    NSString *county = nil;
    for(NSDictionary *component in addressDict) 
    {
        NSArray *types = [component valueForKey:@"types"];
        
        if([types containsObject:@"sublocality"])
            county=[component valueForKey:@"long_name"];
        
        if([types containsObject:@"locality"])
            city = [component valueForKey:@"long_name"];
        else if([types containsObject:@"natural_feature"])
           city = [component valueForKey:@"long_name"];
    }
    if (county != nil)
    {
        return county;
    }else {
        return city;
    }
}
+(UIImage *)cropImage:(UIImage *)originImg forWitdh:(float)rectWidth andHeight:(float)rectHeight
{ 
    float imgWidth = originImg.size.width;
    //NSLog(@"witdh:%f",imgWidth);
    float imgHeight = originImg.size.height;
    //NSLog(@"height :%f",imgHeight);
    if (imgHeight/imgWidth > rectHeight/rectWidth)
    {
        float cropHeight = imgWidth *(rectHeight / rectWidth);
        //NSLog(@"cropHeight: %f",cropHeight);
        float y = (imgHeight - cropHeight)/2;
        CGRect rect = CGRectMake(0, y, imgWidth, cropHeight);
        CGImageRef cgImageRefNew = CGImageCreateWithImageInRect(originImg.CGImage, rect);
        UIImage *cropedImage = [UIImage imageWithCGImage:cgImageRefNew];
        CGImageRelease(cgImageRefNew);
        return  cropedImage;
    }
    else 
    {
        float cropWitdh = imgHeight * (rectWidth/rectHeight);
        //NSLog(@"cropWitdh: %f",cropWitdh);
        float x = (imgWidth - cropWitdh)/2;
        CGRect rect = CGRectMake(x, 0, cropWitdh, imgHeight);
        CGImageRef cgImageRefNew = CGImageCreateWithImageInRect(originImg.CGImage, rect);
        UIImage *cropedImage = [UIImage imageWithCGImage:cgImageRefNew];
        CGImageRelease(cgImageRefNew);
        return  cropedImage;
    }
}
+(NSString *)cutWhiteAndNewLine:(NSString *)originString
{
    return [originString stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
}

@end
