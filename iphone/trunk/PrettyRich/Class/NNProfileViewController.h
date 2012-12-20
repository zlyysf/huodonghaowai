//
//  NNProfileViewController.h
//  PrettyRich
//
//  Created by liu miao on 10/18/12.
//
//

#import <UIKit/UIKit.h>
#import "NodeAsyncConnection.h"
#import "ImagesDownloadManager.h"
#import "ImageDownloaderDelegate.h"
#import "CustomAlertView.h"
@interface NNProfileViewController : UIViewController<ImageDownloaderDelegate,UITableViewDataSource,UITableViewDelegate,UINavigationControllerDelegate,UIImagePickerControllerDelegate,UIActionSheetDelegate,UIPickerViewDataSource,UIPickerViewDelegate,UITextFieldDelegate,UITextViewDelegate>
@property (readwrite,nonatomic)BOOL photoSelected;
@property (readwrite,nonatomic)BOOL needUpdatePhoto;
@property (retain,nonatomic)UIImage *uploadPhoto;
@property (retain,nonatomic)NSArray *bloodArray;
@property (retain,nonatomic)NSArray *starArray;
@property (retain,nonatomic)NSArray *schoolArray;
@property (readwrite, nonatomic) BOOL backViewSizeAdjusted;
@property (retain, nonatomic) IBOutlet UITableView *listView;
@property (retain, nonatomic) IBOutlet UIActivityIndicatorView *activityIndicator;
@property (retain, nonatomic) IBOutlet UIView *profileView;
@property (retain, nonatomic) IBOutlet UIImageView *primaryPhotoView;
@property (retain,nonatomic)NSMutableDictionary *tempDict;
@property (retain, nonatomic)ImagesDownloadManager * imageDownloadManager;
@property (nonatomic,readwrite)BOOL editVisible;
@property (retain, nonatomic)NSMutableDictionary *userInfoDict;
@property (readwrite,nonatomic)BOOL isFirstLoad;
@property(nonatomic,retain) NodeAsyncConnection *curConnection;
@property(nonatomic,retain) NodeAsyncConnection *photoConnection;
@property (retain, nonatomic) IBOutlet UILabel *nameLabel;
@property (retain, nonatomic) IBOutlet UILabel *HeightABloodAStarlabel;
@property (retain, nonatomic) IBOutlet UILabel *EduADepartASchoolLabel;
@property (retain, nonatomic) IBOutlet UILabel *selfDescriptionlabel;
@property (retain, nonatomic) IBOutlet UITableViewCell *userHomeCell;
@property (retain, nonatomic) IBOutlet UITextField *homeTextField;
@property (retain, nonatomic) IBOutlet UITableViewCell *saveChangeCell;
@property (retain, nonatomic) IBOutlet UITableViewCell *userPhotoCell;
@property (retain, nonatomic) IBOutlet UIImageView *userPhotoView;
@property (retain, nonatomic) IBOutlet UIButton *addPhotoButton;
@property (retain, nonatomic) IBOutlet UITableViewCell *userHeightCell;
@property (retain, nonatomic) IBOutlet UITextField *heightTextField;
@property (retain, nonatomic) IBOutlet UITableViewCell *userSchoolCell;
@property (retain, nonatomic) IBOutlet UITextField *schoolTextField;
@property (retain, nonatomic) IBOutlet UITableViewCell *userBloodCell;
@property (retain, nonatomic) IBOutlet UITextField *bloodTextField;
@property (retain, nonatomic) IBOutlet UITableViewCell *userDepartmentCell;
@property (retain, nonatomic) IBOutlet UITextField *departmentTextField;
@property (retain, nonatomic) IBOutlet UITableViewCell *userEducationCell;
@property (retain, nonatomic) IBOutlet UITextField *educationTextField;
@property (retain, nonatomic) IBOutlet UITableViewCell *userDescriptionCell;
@property (retain, nonatomic) IBOutlet UITextView *descriptionTextView;
@property (retain, nonatomic) IBOutlet UITableViewCell *userNameCell;
@property (retain, nonatomic) IBOutlet UITextField *nameTextField;
@property (retain, nonatomic) IBOutlet UITableViewCell *userStarCell;
@property (retain, nonatomic) IBOutlet UITextField *starTextField;
@property (retain, nonatomic) IBOutlet UIPickerView *schoolPicker;
@property (retain, nonatomic) IBOutlet UIPickerView *bloodPicker;
@property (retain, nonatomic) IBOutlet UIPickerView *starPicker;
@property (retain, nonatomic) IBOutlet UIToolbar *toolBar;
@property (nonatomic,readwrite)int responderField;
- (IBAction) clickAddPhoto;
- (IBAction)doneButtonClicked;
- (IBAction)cancelButtonClicked;
-(IBAction)startUpdateProfileWithPhoto;
@end
