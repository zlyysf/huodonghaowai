//
//  NNCreateDateViewController.h
//  PrettyRich
//
//  Created by liu miao on 10/19/12.
//
//

#import <UIKit/UIKit.h>
#import "NNDatePreViewViewController.h"
#import "NodeAsyncConnection.h"
@interface NNCreateDateViewController : UIViewController<UITableViewDataSource,UITableViewDelegate,UIImagePickerControllerDelegate,UIActionSheetDelegate,UINavigationControllerDelegate,UITextFieldDelegate,UITextViewDelegate>
@property (retain, nonatomic) IBOutlet UIToolbar *toolbar1;
@property (retain, nonatomic) IBOutlet UIToolbar *toolBar;
@property (retain, nonatomic) IBOutlet UILabel *desPlaceholderLabel;
@property (retain, nonatomic) IBOutlet UITextField *titleTextField;
@property (retain, nonatomic) IBOutlet UITextField *timeTextField;
@property (retain, nonatomic) IBOutlet UITextField *addressTextFiled;
@property (retain, nonatomic) IBOutlet UITextField *hasCountTextField;
@property (retain, nonatomic) IBOutlet UITextField *wantCountTextField;
@property (retain, nonatomic) IBOutlet UISegmentedControl *whoPaySegment;
@property (retain, nonatomic) IBOutlet UITextView *descriptionTextView;
@property (retain, nonatomic) IBOutlet UIImageView *photoImageView;
@property (retain, nonatomic) IBOutlet UIButton *uploadPhotoButton;
@property (retain, nonatomic) IBOutlet UITableViewCell *titleCell;
@property (retain, nonatomic) IBOutlet UITableViewCell *timeCell;
@property (retain, nonatomic) IBOutlet UITableViewCell *addressCell;
@property (retain, nonatomic) IBOutlet UITableViewCell *hasCountCell;
@property (retain, nonatomic) IBOutlet UITableViewCell *wantCountCell;
@property (retain, nonatomic) IBOutlet UITableViewCell *whoPayCell;
@property (retain, nonatomic) IBOutlet UITableViewCell *descriptionCell;
@property (retain, nonatomic) IBOutlet UITableViewCell *photoUploadCell;
@property (retain, nonatomic) IBOutlet UITableView *listView;
@property (retain, nonatomic) IBOutlet UITableViewCell *publishCell;
@property (nonatomic, assign) BOOL photoSelected;
@property (nonatomic, retain) UIImage *uploadImage;
@property (retain, nonatomic) IBOutlet UIActivityIndicatorView *activityIndicator;
@property (nonatomic,retain)NNDatePreViewViewController *datePreViewViewController;
@property (nonatomic,retain)UIBarButtonItem *flipItem;
@property (nonatomic,readwrite)BOOL editVisible;
@property(nonatomic,retain)UIDatePicker *datePicker;
@property(nonatomic,retain)NSString *titleString;
@property(nonatomic,retain)NSString *timeString;
@property(nonatomic,retain)NSString *addressString;
@property(nonatomic,retain)NSString *hasCountString;
@property(nonatomic,retain)NSString *wantCountString;
@property(nonatomic,retain)NSString *descripString;
@property(nonatomic,retain)NSString *whoPayString;
@property(nonatomic,retain)NSString *selectedTopic;
@property (readwrite, nonatomic) BOOL backViewSizeAdjusted;
@property (nonatomic,readwrite)int responderField;
@property(nonatomic,retain) NodeAsyncConnection *curConnection;
- (IBAction) uploadPhotoClicked;
-(IBAction)segmentSelected:(id)sender;
- (IBAction)doneButtonClicked;
- (IBAction)cancelButtonClicked;
- (void)startDatePost;
- (void)didEndDatePost:(NodeAsyncConnection *)connection;
@end
