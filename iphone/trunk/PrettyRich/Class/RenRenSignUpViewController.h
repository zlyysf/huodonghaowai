//
//  RenRenSignUpViewController.h
//  PrettyRich
//
//  Created by liu miao on 12/12/12.
//
//

#import <UIKit/UIKit.h>
#import "NodeAsyncConnection.h"
@interface RenRenSignUpViewController : UIViewController
<UITextFieldDelegate,UIActionSheetDelegate, UIImagePickerControllerDelegate,UINavigationControllerDelegate,UITableViewDataSource,UITableViewDelegate,UIPickerViewDataSource,UIPickerViewDelegate>
{
    NodeAsyncConnection *curConnection;
    NSString *name;
    NSString *height;
    NSString *gender;
    NSString *emailAccount;
    NSString *password;
    NSString *inviteCode;
    UIImage *uploadImage;
    BOOL backViewSizeAdjusted;
    UITextField *lastActiveField;
}
@property (retain, nonatomic) IBOutlet UIToolbar *toolBar;
@property (retain,nonatomic)NSArray *schoolArray;
@property (retain, nonatomic) IBOutlet UIPickerView *schoolPicker;
@property (retain, nonatomic) IBOutlet UITableViewCell *photoCell;
@property (retain, nonatomic) IBOutlet UITableViewCell *genderCell;
@property (retain, nonatomic) IBOutlet UITableView *listView;
@property (retain, nonatomic) IBOutlet UITableViewCell *emailCell;
@property (retain, nonatomic) IBOutlet UITableViewCell *passwordCell;
@property (retain, nonatomic) IBOutlet UITableViewCell *nameCell;
@property (retain, nonatomic) IBOutlet UITableViewCell *inviteCell;
@property (retain, nonatomic) IBOutlet UITableViewCell *schoolCell;
@property (retain, nonatomic) IBOutlet UITextField *emailTextField;
@property (retain, nonatomic) IBOutlet UITextField *passwordTextField;
@property (retain, nonatomic) IBOutlet UITextField *firstnameTextField;
@property (retain, nonatomic) IBOutlet UITextField *heightTextField;
@property (retain, nonatomic) IBOutlet UIImageView *photoImageView;
@property (retain, nonatomic) IBOutlet UITextField *codeTextField;
@property (retain, nonatomic) IBOutlet UIButton *femaleButton;
@property (retain, nonatomic) IBOutlet UIButton *maleButton;
@property (retain, nonatomic) IBOutlet UIActivityIndicatorView *activityIndicator;
@property (retain, nonatomic) IBOutlet UIButton *photoButton;
@property(retain,nonatomic) NodeAsyncConnection *curConnection;
@property (retain, nonatomic) NSString *name;
@property (retain, nonatomic) NSString *height;
@property (retain, nonatomic) NSString *gender;
@property (retain, nonatomic) NSString *emailAccount;
@property (retain, nonatomic) NSString *password;
@property (retain, nonatomic) NSString *inviteCode;
@property (nonatomic, assign) BOOL photoSelected;
@property (nonatomic, assign) BOOL backViewSizeAdjusted;
@property (nonatomic, retain) UIImage *uploadImage;
@property (nonatomic, retain) UITextField *lastActiveField;
- (IBAction)doneButtonClicked;
- (void)backButtonClicked;
- (void)startSignup;
- (IBAction) clickAddPhoto;
- (void)didEndSignup:(NodeAsyncConnection *)connection;

@end
