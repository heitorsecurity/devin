Use Windows.pkg
Use DFClient.pkg
Use dbSuggestionForm.pkg
Use cDbCJGridColumnSuggestion.pkg

Use Customer.DD
Use Vendor.DD
Use dfTabDlg.pkg


Deferred_View Activate_oDemoSuggestionForm for ;
Object oDemoSuggestionForm is a dbView

    Set Border_Style to Border_Thick
    Set Size to 227 300
    Set Location to 2 2
    Set Label to "Suggestion Forms and Grids"

    Object oSuggestionsTP is a dbTabDialogView
        Set Size to 208 284
        Set Location to 10 7

        Object oVendor_DD is a Vendor_DataDictionary
        End_Object
    
        Object oCustomer_DD is a Customer_DataDictionary
            Procedure Field_defaults
                Forward Send Field_Defaults
                Set Field_Changed_Value   Field Customer.State to ""
            End_Procedure
        End_Object
    
        Set Main_DD to oCustomer_DD
        Set Server to oCustomer_DD

        Object oSuggestionForms is a dbTabView
            Set Label to 'dbSuggestionForm'

            Object oLabel1 is a TextBox
                Set Auto_Size_State to False
                Set Size to 10 237
                Set Location to 17 16
                Set Label to "Data bound, incremental, starting at character 1"
                Set FontWeight to fw_Bold
            End_Object
            Object oSuggestionForm2 is a dbSuggestionForm
                Set Location to 28 74
                Entry_Item Customer.Customer_Number
                Set size to 14 45
                Set Label to "Customer Num:"
                Set piStartAtChar to 1
            End_Object
            Object oSuggestionForm1 is a dbSuggestionForm
                Set Location to 44 74
                Entry_Item Customer.Name
                Set size to 14 146
                Set Label to "Customer Name:"
                Set piStartAtChar to 1
            End_Object
            Object oLabel3 is a TextBox
                Set Auto_Size_State to False
                Set Size to 9 211
                Set Location to 77 17
                Set Label to "Validation Table, incremental, starting at character 1"
                Set FontWeight to fw_Bold
            End_Object
            Object oSuggestionForm4 is a dbSuggestionForm
                Set Location to 89 74
                Entry_Item Customer.State
                Set Size to 14 50
                Set Label to "Customer State:"
                Set peSuggestionMode to smValidationTable
                Set piStartAtChar to 1
            End_Object
            Object oLabel2 is a TextBox
                Set Auto_Size_State to False
                Set Size to 10 199
                Set Location to 120 16
                Set Label to "Data bound, full text, starting at character 2"
                Set FontWeight to fw_Bold
            End_Object
            
            Object oSuggestionForm3 is a dbSuggestionForm
                Set Location to 137 74
                Entry_Item Vendor.Name
                Set Server to oVendor_DD
                Set Size to 14 100
                Set pbFullText to True
                Set Label to "Vendor name:"
            End_Object

            Object oLabel3 is a TextBox
                Set Auto_Size_State to False
                Set Size to 10 199
                Set Location to 158 16
                Set Label to "Custom Suggestion List"
                Set FontWeight to fw_Bold
            End_Object
            
            // this shows how to create you own custom suggestion list
            Object oSuggestionForm5 is a dbSuggestionForm
                Set Location to 175 74
                Set Label to "Custom Id:"
                Set Size to 14 100
                Set peSuggestionMode to smCustom
                Set piStartAtChar to 1

                // even though we handle searching manually in OnFindSuggestions, pbFullText
                // is still used to determine the display and bolding of matched text. Setting
                // this true tells it we are matching anywhere within the string.
                // Since this is a custom list, it is the developer's job to make sure that
                // OnFindSuggestions follows these rules as well.
                Set pbFullText to True
                
                // augment to create an arbitrary list of Ids to be used for our search
                Property String[] pCustomIds
                
                // augment to create a list of Ids
                Procedure Activating
                    String[] sIds
                    Forward Send Activating
                    Move "JSON" to sIds[0]
                    Move "XML" to sIds[1]
                    Move "SQL" to sIds[2]
                    Move "SQLExpress" to sIds[3]
                    Move "SQLServer" to sIds[4]
                    Move "DF" to sIds[5]
                    Move "XQuery" to sIds[6]
                    Move "JScript" to sIds[7]
                    Move "Java" to sIds[8]
                    Move "UTF-8" to sIds[9]
                    Move "UTF-16" to sIds[10]
                    Set pCustomIds to (SortArray(sIds,Desktop,RefFunc(DFSTRICMP)))
                End_Procedure
                
                // custom code to find all matches for the search
                // You can write whatever code you want here to find matched items
                Procedure OnFindSuggestions String sSearch tSuggestion[] ByRef aSuggestions
                    String[] sIds
                    Integer i iLen iIds iCount
                    Move (Lowercase(sSearch)) to sSearch
                    Move (Length(sSearch)) to iLen
                    Get pCustomIds to sIds
                    Move (SizeOfArray(sIds)-1) to iIds
                    For i from 0 to iIds
                        If (Lowercase(sIds[i]) contains sSearch) Begin
                            Move sIds[i] to aSuggestions[iCount].sRowId
                            Move sIds[i] to aSuggestions[iCount].aValues[0]
                            Increment iCount
                        End
                    Loop
                End_Procedure

                Procedure OnSelectSuggestion String sSearch tSuggestion Suggestion
                    Set Value to Suggestion.sRowId
                    Set Item_Changed_State to True
                End_Procedure

            
            End_Object
        End_Object

        Object oSuggestionGrid is a dbTabView

            Set Label to "cDbCJGridColumnSuggestion"

            Object oCustomer_DD is a Customer_DataDictionary
            End_Object
        
            Set Main_DD to oCustomer_DD
            Set Server to oCustomer_DD
        
            Object oDbCJGrid1 is a cDbCJGrid
                Set Size to 177 268
                Set Location to 7 7
                Set Ordering to 1
                Set Verify_Save_msg to (RefFunc(Save_Confirmation))
                
                Object oCustomer_Customer_Number is a cDbCJGridColumnSuggestion
                    Entry_Item Customer.Customer_Number
                    Set piWidth to 73
                    Set psCaption to "Number"
                    Set piStartAtChar to 1
                End_Object
        
                // normally you would not use a suggestion list with a grid's main 
                // file. It would be more useful when selecting a parent.
                Object oCustomer_Name is a cDbCJGridColumnSuggestion
                    Entry_Item Customer.Name
                    Set piWidth to 358
                    Set psCaption to "Customer Name"
                    Set pbFullText to True
                    Set piStartAtChar to 1
                End_Object
        
                Object oCustomer_State is a cDbCJGridColumnSuggestion
                    Entry_Item Customer.State
                    Set piWidth to 105
                    Set psCaption to "State"
                    Set peSuggestionMode to smValidationTable
                    Set piStartAtChar to 1
                End_Object
            End_Object

        End_Object
        
    End_Object
        
        
Cd_End_Object
