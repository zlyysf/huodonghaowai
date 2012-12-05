//
//  LZActivityListViewController.m
//  oneplusone
//
//  Created by Dalei Li on 10/12/12.
//  Copyright (c) 2012 Dalei Li. All rights reserved.
//

#import "LZActivityListViewController.h"
#import "LZActivityListCell.h"


@interface LZActivityListViewController ()

@end

@implementation LZActivityListViewController

NSArray *sectionList;
NSArray *activityList;


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
    
    
    sectionList = [[NSArray alloc] initWithObjects:@"自定义", @"休闲娱乐", @"知性感性", @"体育修身", @"乡情校谊", nil];
    activityList = [[NSArray alloc] initWithObjects:
                        [[NSArray alloc] initWithObjects:@"自定义活动，招人，爱干嘛干嘛！", nil],
                        [[NSArray alloc] initWithObjects:@"卡拉OK（找人一起去K歌）", @"三国杀（征人一起玩三国杀）", @"吃货天地（一起当个快乐的吃货）", @"台球（我要找人打台球）", @"演出展览（想看演出展览）", @"博物馆（一起参观博物馆）", @"购物（有人一起购物吗）", @"吃货天地（一起当个快乐的吃货）", nil],
                        [[NSArray alloc] initWithObjects:@"郊游旅游（我要组人同游）", @"聊天（我想找人聊天）", @"喝酒（找人陪我喝酒）", nil],
                        [[NSArray alloc] initWithObjects:@"跑步（征人一起跑步）", @"羽毛球（征人打羽毛球）", @"网球（征人打网球）", @"乒乓球（征人打乒乓球）", @"舞伴（我要征舞伴）", nil],
                        [[NSArray alloc] initWithObjects:@"上自习（征人一起上自习）", @"拼车（有人一起拼车么）", @"征人同行（有人一起同行么）", @"同乡会（我要找同乡的同学）", nil],
                        nil];
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
    return [sectionList count];
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    // Return the number of rows in the section.
    return [[activityList objectAtIndex:section] count];
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    static NSString *CellIdentifier = @"RecommendActivityCell";
    LZActivityListCell *cell = (LZActivityListCell *)[tableView dequeueReusableCellWithIdentifier:CellIdentifier forIndexPath:indexPath];
    
    if (cell == nil) {
        cell = [[LZActivityListCell alloc] initWithStyle:UITableViewCellStyleDefault reuseIdentifier:CellIdentifier];
    }

    // Configure the cell...
    NSArray *aList = [activityList objectAtIndex:[indexPath section]];
    
    cell.descriptionLabel.text = [aList objectAtIndex:[indexPath row]];
    
    return cell;
}


- (NSString *)tableView:(UITableView *)tableView titleForHeaderInSection:(NSInteger)section
{
    return [sectionList objectAtIndex:section];
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
