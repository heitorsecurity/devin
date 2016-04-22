Use Windows.pkg
Use DFClient.pkg
Use cImageList32.pkg
Use cSplitButton.pkg
Use cCommandLinkButton.pkg
Use cCJStandardMenuItemClasses.pkg


Deferred_View Activate_oButtonTest for ;
Object oButtonTest is a dbView

    Set Border_Style to Border_Thick
    Set Size to 212 300
    Set Location to 2 3
    Set Label to "Button Samples"

    Object oTextBox1 is a TextBox
        Set Size to 9 110
        Set Location to 8 10
        Set Label to 'Buttons that use Text and Images'
    End_Object

    Object oTextButton is a Button
        Set Location to 20 11
        Set Label to 'Save'
    
        Procedure OnClick
        End_Procedure
    
    End_Object

    Object oTextAndImageButton is a Button
        Set Location to 20 71
        Set Label to 'Save'
        Set psImage to "ActionSave.ico"

        Procedure OnClick
        End_Procedure
    
    End_Object

    Object oImageButton is a Button
        Set Size to 14 27
        Set Location to 20 131
        Set psImage to "ActionSave.ico"
        Set peImageAlign to Button_ImageList_Align_Center

        Procedure OnClick
        End_Procedure
    
    End_Object

    Object oTextAndImageTopButton is a Button
        Set Size to 26 50
        Set Location to 20 168
        Set Label to 'Save'
        Set psImage to "ActionSave.ico"
        Set peImageAlign to Button_ImageList_Align_Top
        Set piImageMarginTop to 10

        Procedure OnClick
        End_Procedure
    
    End_Object

    Object oTextAndImageBottomButton is a Button
        Set Size to 26 50
        Set Location to 20 226
        Set Label to 'Save'
        Set psImage to "ActionSave.ico"
        Set peImageAlign to Button_ImageList_Align_Bottom
        Set piImageMarginBottom to 10

        Procedure OnClick
        End_Procedure
    
    End_Object

    Object oTextBox1 is a TextBox
        Set Size to 9 110
        Set Location to 51 10
        Set Label to 'Buttons with drop down menus'
    End_Object

    // this is a button with down arrow button on the right that invokes
    // a context menu inside of OnClick
    Object oDropDownButton is a Button
        Set Size to 14 58
        Set Location to 65 10
        Set Label to "Select"
        Set psImage to "Down16.bmp"
        Set peImageAlign to Button_ImageList_Align_Right

        Procedure OnClick
            // OnDropDown is defined to popup menu in phoButtonPopup
            Send OnDropDown
        End_Procedure
        
        Object oButtonMenu is a cCJContextMenu
            
            Object oMenuItem1 is a cCJMenuItem
                Set psCaption to "Save"
                Set psImage to "ActionSaveRecord.ico"
                Procedure OnExecute Variant vCommandBarControl
                End_Procedure
            End_Object
            
            Object oMenuItem2 is a cCJMenuItem
                Set psCaption to "Clear"
                Set psImage to "ActionClear.ico"
                Procedure OnExecute Variant vCommandBarControl
                End_Procedure
            End_Object
            
            Object oMenuItem3 is a cCJMenuItem
                Set psCaption to "Delete"
                Set psImage to "ActionDeleteRecord.ico"
                Procedure OnExecute Variant vCommandBarControl
                End_Procedure
            End_Object

        End_Object
        // Binds OnDropDown to this menu
        Set phoButtonPopup to oButtonMenu 

    End_Object

    // this is split button (Vista or greater required), where OnClick and
    // OnDropDown are two events. OnDropDown automatically invokes phoButtonPopup
    
    Object oSplitButton is a cSplitButton
        Set Size to 14 53
        Set Location to 65 76
        Set Label to 'Save'
        Set psImage to "ActionSaveRecord.ico"
    
        Procedure OnClick
        End_Procedure
        
        Object oButtonMenu is a cCJContextMenu
            
            Object oMenuItem1 is a cCJMenuItem
                Set psCaption to "Set to Save"
                Procedure OnExecute Variant vCommandBarControl
                    Delegate Set label to "Save"
                    Delegate Set psImage to "ActionSaveRecord.ico"
                End_Procedure
            End_Object
            
            Object oMenuItem2 is a cCJMenuItem
                Set psCaption to "Set to Clear"
                Procedure OnExecute Variant vCommandBarControl
                    Delegate Set label  to "Clear"
                    Delegate Set psImage to  "ActionClear.ico"
                End_Procedure
            End_Object
            
            Object oMenuItem3 is a cCJMenuItem
                Set psCaption to "Set to Delete"
                Procedure OnExecute Variant vCommandBarControl
                    Delegate Set label  to "Delete"
                    Delegate Set psImage to  "ActionDeleteRecord.ico"
                End_Procedure
            End_Object

            Object oMenuItem4 is a cCJMenuItem
                Set psCaption to "Set to Select"
                Procedure OnExecute Variant vCommandBarControl
                    Delegate Set label  to "Select"
                    Delegate Set psImage to  ""
                End_Procedure
            End_Object

        End_Object

        Set phoButtonPopup to oButtonMenu 

    End_Object

    Object oTextBox2 is a TextBox
        Set Size to 9 115
        Set Location to 51 166
        Set Label to "Button using an external image list"
    End_Object
    
    // button have 6 image states. We will provide a different image
    // for each of these states
    Object oImageList is a cImageList32
        Set piMaxImages to 6
        Set piImageHeight to 16
        Set piImageWidth to 16
        Procedure OnCreate
            Integer iIndex
            // for buttons either create 1 image or 6
            // if 6, they are normal, hot, pressed, disabled, defaulted, stylus-hot
            Get AddImage "ClosFold.bmp" to iIndex
            Get AddImage "OpenFold.bmp" to iIndex
            Get AddImage "OpenFold.bmp" to iIndex
            Get AddImage "ClosFold.bmp" to iIndex
            Get AddImage "OpenFold.bmp" to iIndex
            Get AddImage "ClosFold.bmp" to iIndex
        End_Procedure
    End_Object

    // this attaches to an external imageist with 6 images. Because this
    // uses an external imagelist you will not see the image modeled in the Studio
    Object oMultiImageButton is a Button
        Set Location to 65 194
        Set phoExternalButtonImageList to oImageList
        Set peImageAlign to Button_ImageList_Align_Center
        
        Procedure OnClick
        End_Procedure

    End_Object

    // CommandLinkButtons work with Vista or greater required
    Object oCommandLinkButtonGroup is a Group
        Set Size to 115 258
        Set Location to 90 10
        Set Label to "CommandLink Buttons"

        Object oCommandLinkStandard is a cCommandLinkButton
            Set Location to 11 9
            Set Size to 34 239
            Set Label to 'CommandLink Choice 1'
            Set psNote to "This is a normal command link button with the standard command link image"
    
            Procedure OnClick
            End_Procedure
            
        End_Object

        Object oCommandLinkShield is a cCommandLinkButton
            Set Location to 44 9
            Set Size to 34 239
            Set Label to 'CommandLink Choice 2'
            Set psNote to "This is a command link button using the Windows elevated shield image"
            Set pbShield to True
    
            Procedure OnClick
            End_Procedure
            
        End_Object

        Object oCommandLinkCustom is a cCommandLinkButton
            Set Location to 78 9
            Set Size to 34 239
            Set Label to 'CommandLink Choice 3'
            Set psNote to "This is a command link with a custom image. This image just happens to be larger"
            Set psImage to "DF32.bmp"
            Set piImageSize to 48

            Procedure OnClick
            End_Procedure
            
        End_Object

    End_Object


Cd_End_Object
