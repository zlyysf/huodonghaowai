//
//  LZMyActivityViewController.m
//  oneplusone
//
//  Created by Dalei Li on 10/12/12.
//  Copyright (c) 2012 Dalei Li. All rights reserved.
//

#import "LZMyActivityViewController.h"
#import "LZPostActivityCell.h"
#import "LZReceivedActivityCell.h"
#import "LZMessageViewController.h"


@interface LZMyActivityViewController ()

@end

@implementation LZMyActivityViewController

@synthesize segmentedControl;

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
    
    [segmentedControl addTarget:self
                         action:@selector(doRefreshList:)
               forControlEvents:UIControlEventValueChanged];
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
    return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    // Return the number of rows in the section.
    return 8;
}
 


- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{

    static NSString *CellIdentifier;
    UITableViewCell *cell;
    
    if (segmentedControl.selectedSegmentIndex == 0) {
        CellIdentifier = @"PostActivityCell";
        cell = (LZPostActivityCell *)[tableView dequeueReusableCellWithIdentifier:CellIdentifier forIndexPath:indexPath];
    }
    else if (segmentedControl.selectedSegmentIndex == 1) {
        CellIdentifier = @"InvitedActivityCell";
        cell = (LZReceivedActivityCell *)[tableView dequeueReusableCellWithIdentifier:CellIdentifier forIndexPath:indexPath];
        
    }
    else {
        CellIdentifier = @"AppliedActivityCell";
        cell = [tableView dequeueReusableCellWithIdentifier:CellIdentifier forIndexPath:indexPath];
    }
    
    // Configure the cell...
    return cell;
}


- (void)doRefreshList :(id)sender
{
    [self.tableView reloadData];
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
}

- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender
{
   
    
    if ([segue.identifier isEqualToString:@"PostActivityToUserList"]) {
    }
    else if ([segue.identifier isEqualToString:@"InvitedActivityToMessage"] || [segue.identifier isEqualToString:@"AppliedActivityToMessage"]) {
        
        LZMessageViewController *messageController = (LZMessageViewController *)segue.destinationViewController;
        messageController.hidesBottomBarWhenPushed = TRUE;
        messageController.buttonItem.title = @"评价";

    }
    else if ([segue.identifier isEqualToString:@"ActivityTitleToDetail"]) {
    }
}

@end
