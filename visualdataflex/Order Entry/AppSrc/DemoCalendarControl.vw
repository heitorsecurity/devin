Use Windows.pkg
Use DFClient.pkg

Use MonthCalendarPrompt.dg
Use cTextEdit.pkg

Activate_View Activate_oDemoCalendarControl for oDemoCalendarControl
Object oDemoCalendarControl is a dbView

    Set Border_Style to Border_Thick
    Set Size to 148 196
    Set Location to 2 2
    Set Label to "Calendar Control Sample"

    // Simplest case example, just set the prompt_object
    Object oDateFormTest is a Form
        Set Location to 16 89
        Set Size to 13 66
        Set Label to "Date Select Test:"

        Set Prompt_Object to oMonthCalendarPrompt
        Set Prompt_Button_Mode to PB_PromptOn

    End_Object

    Object oDateRangeGroup is a Group

        Set Label to "Selecting Date Range"
        Set Size to 74 165
        Set Location to 39 23
        
        Object oFromDate is a Form
            Set Label to "From:"
            Set Location to 29 66
            Set Size to 13 66
            Set Prompt_Button_Mode to PB_PromptOn
            Set Prompt_Object to oMonthCalendarPrompt
            
            Procedure Prompt_Callback Integer hoPrompt
                Send DateRangeCallback hoPrompt
            End_Procedure
        End_Object
        
        Object oToDate is a Form
            Set Label to "To:"
            Set Location to 50 66
            Set Size to 13 66
            Set Prompt_Button_Mode to PB_PromptOn
            
            Procedure Prompt
                Send Popup to oMonthCalendarPrompt
            End_Procedure
            
            Procedure Prompt_Callback Integer hoPrompt
                Send DateRangeCallback hoPrompt
            End_Procedure
        End_Object

              Object oTextBox1 is a TextBox
                        Set Size to 10 154
                        Set Location to 11 3
                        Set Label to "(select initial date and drag the mouse to end date)"
              End_Object
        
        
        // Since these two date forms are using the same logic, we delegate to here
        // and let the group handle the inititalization and update
        
        // this is the callback set in DateRangeCallback
        Procedure DoDateUpdate Integer hoSel Date dDate1 Date dDate2
            Set Value of oFromDate to dDate1
            Set Value of oToDate to dDate2
        End_Procedure
        
        // This is the first callback. Make this multi-select, 
        // no click select, show week numbers, don't show today stuff.   
        // also set the callback to call DoDateUpdate (which will delegate to here)
        Procedure DateRangeCallback Integer hoPrompt
            Date dDate1 dDate2
            
            Set pbMultiSelect of hoPrompt to True
            Set peMouseSelectOk of hoPrompt to msoNone
            Set phmPromptUpdateCallback of hoPrompt to (RefProc(DoDateUpdate))
            
            Set pbWeekNumbers of hoPrompt to True
            Set pbNoToday of hoPrompt to True
            Set pbNoTodayCircle of hoPrompt to True
            
            Get Value of oFromDate to dDate1
            Get Value of oToDate to dDate2
            Set pdSeedValue of hoPrompt to dDate1 
            Set pdSeedValue2 of hoPrompt to dDate2 
        End_Procedure
    End_Object

    Object oDateTextBox is a TextBox
        Set Size to 10 34
        Set Location to 123 56
        Set Label to '1/30/2016'
        Procedure Activating 
            Set Label to (Date(CurrentDateTime()))
            Forward Send Activating
        End_Procedure
    End_Object

    Object oButton1 is a Button
        Set Location to 121 100
        Set Label to 'Change'
        
        Procedure Prompt_Callback Integer hoPrompt
            Date dDate
            Get Value of oDateTextBox to dDate
            Set peUpdateMode of hoPrompt to umPromptCustom
            Set pdSeedValue of hoPrompt to dDate
            Set phmPromptUpdateCallback of hoPrompt to (RefProc(DoDateUpdate))
        End_Procedure

        Procedure DoDateUpdate Integer hoSel Date dDate1 Date dDate2
            Set Value of oDateTextBox to dDate1
        End_Procedure
    
        Procedure OnClick
            Send Popup of oMonthCalendarPrompt
        End_Procedure
    
    End_Object
    
End_Object
