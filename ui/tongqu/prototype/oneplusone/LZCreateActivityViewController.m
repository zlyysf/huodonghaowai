//
//  LZCreateActivityViewController.m
//  oneplusone
//
//  Created by Dalei Li on 10/16/12.
//  Copyright (c) 2012 Dalei Li. All rights reserved.
//

#import "LZCreateActivityViewController.h"

@interface LZCreateActivityViewController ()

@end

@implementation LZCreateActivityViewController

NSArray *fieldArray;

- (id)initWithStyle:(UITableViewStyle)style
{
    self = [super initWithStyle:style];
    if (self) {
        // Custom initialization
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];

    // Uncomment the following line to preserve selection between presentations.
    // self.clearsSelectionOnViewWillAppear = NO;
 
    // Uncomment the following line to display an Edit button in the navigation bar for this view controller.
    // self.navigationItem.rightBarButtonItem = self.editButtonItem;
    
    fieldArray = [NSArray arrayWithObjects:@"CreateActivityTimeCell", @"CreateActivityPlaceCell", @"CreateActivityHavePeopleCell", @"CreateActivityNeedPeopleCell", @"CreateActivityCostCell",  @"CreateActivityDetailCell", nil];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

#pragma mark - Table view data source

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    // Return the number of sections.
    return 4;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    // Return the number of rows in the section.
    
    if (section == 0)
        return 1;
    else if (section == 1)
        return 6;
    else if (section == 2)
        return 1;
    else 
        return 1;
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
    
    if ([indexPath section] == 0)
        return 44.0;
    else if ([indexPath section] == 1) {
        
        if ([indexPath row] == 5)
            return 100.0;
        else
            return 44.0;
    }else if ([indexPath section] == 2) {
        return 80.0;
    }
    else
        return 44.0;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    
    if ([indexPath section] == 0) {
        UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"CreateActivityTitleCell" forIndexPath:indexPath];
        return cell;
    }
    else if ([indexPath section] == 1) {
        
        UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:[fieldArray objectAtIndex:[indexPath row]] forIndexPath:indexPath];
        return cell;
    }
    else if ([indexPath section] == 2) {
        UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"CreateActivityPhotoCell" forIndexPath:indexPath];
        return cell;
    }
    else {
        UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"CreateActivitySubmitCell" forIndexPath:indexPath];
        return cell;
    }
    
}

/*
// Override to support conditional editing of the table view.
- (BOOL)tableView:(UITableView *)tableView canEditRowAtIndexPath:(NSIndexPath *)indexPath
{
    // Return NO if you do not want the specified item to be editable.
    return YES;
}
*/

/*
// Override to support editing the table view.
- (void)tableView:(UITableView *)tableView commitEditingStyle:(UITableViewCellEditingStyle)editingStyle forRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (editingStyle == UITableViewCellEditingStyleDelete) {
        // Delete the row from the data source
        [tableView deleteRowsAtIndexPaths:@[indexPath] withRowAnimation:UITableViewRowAnimationFade];
    }   
    else if (editingStyle == UITableViewCellEditingStyleInsert) {
        // Create a new instance of the appropriate class, insert it into the array, and add a new row to the table view
    }   
}
*/

/*
// Override to support rearranging the table view.
- (void)tableView:(UITableView *)tableView moveRowAtIndexPath:(NSIndexPath *)fromIndexPath toIndexPath:(NSIndexPath *)toIndexPath
{
}
*/

/*
// Override to support conditional rearranging of the table view.
- (BOOL)tableView:(UITableView *)tableView canMoveRowAtIndexPath:(NSIndexPath *)indexPath
{
    // Return NO if you do not want the item to be re-orderable.
    return YES;
}
*/

#pragma mark - Table view delegate

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath *)indexPath
{
    // Navigation logic may go here. Create and push another view controller.
    /*
     <#DetailViewController#> *detailViewController = [[<#DetailViewController#> alloc] initWithNibName:@"<#Nib name#>" bundle:nil];
     // ...
     // Pass the selected object to the new view controller.
     [self.navigationController pushViewController:detailViewController animated:YES];
     */
}

@end
