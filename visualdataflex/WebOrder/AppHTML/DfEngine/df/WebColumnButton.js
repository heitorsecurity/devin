/*
Class:
    df.WebColumnButton
Mixin:
    df.WebColumn_mixin (df.WebColumnButtonBase)
Extends:
    df.WebBaseDEO

This column type can show one or multiple buttons in a list / grid of which the onclick can be 
handled on the server. The buttons are dynamically determined for each row.
    
Revision:
    2013/07/12  (HW, DAW) 
        Initial version.
*/

//  Generate base class using WebColumn_mixin inheriting from WebBaseDEO
df.WebColumnButtonBase = df.mixin("df.WebColumn_mixin", "df.WebBaseDEO");



df.WebColumnButton = function WebColumnButton(sName, oParent){
    df.WebColumnButton.base.constructor.call(this, sName, oParent);
    
    this.prop(df.tString, "psBtnCssClass", "");
    this.prop(df.tBool, "pbDynamic", false);
    
    this.event("OnClick", df.cCallModeWait); //  Keep this as default because usually there will be a OnRowChange right behind it
    
    
    this._sControlClass = "";
    this._sCellClass = "WebColBtn";
    this._bCellEdit = false;
};
df.defineClass("df.WebColumnButton", "df.WebColumnButtonBase", {

/* 
Augments the openHtml to add a div element that acts as the control. We'll add the buttons to this
div.

@param  aHtml   Array used a string builder to which the HTML is added.
*/
openHtml : function(aHtml){
    df.WebColumnButton.base.openHtml.call(this, aHtml);
    
    aHtml.push('<div>');
},

/* 
Augments the closeHtml to add a div element that acts as the control.

@param  aHtml   Array used a string builder to which the HTML is added.
*/
closeHtml : function(aHtml){
    aHtml.push('</div>');
    
    df.WebColumnButton.base.closeHtml.call(this, aHtml);
},

/*
Augment afterRender to get a reference to the div element that will act as control.
*/
afterRender : function(){
    this._eControl = df.dom.query(this._eElem, "div");
    
    df.WebColumnButton.base.afterRender.call(this);
},

/* 
Setter method for the psBtnCssClass property. The list is triggered to redraw if the new value is 
actually different. 

@param  sVal    New classname.
*/
set_psBtnCssClass : function(sVal){
    var bCS = this.psBtnCssClass !== sVal;
    
    this.psBtnCssClass = sVal;
    
    if(bCS){
        this._oParent.redraw();
    }
},

// - - - - - - - - - DEO Implemnetation - - - - - - - - - 
/*
This method reads the current value from the user interface. It will be overridden by the different 
type of Data Entry Objects. The default implementation reads the value property of the control DOM 
element.

@return The currently displayed value.
@private
*/
getControlValue : function(){
    return this.psValue;
},


// - - - - - - - - - WebColumn Stuff - - - - - - - - - - -

/* 
Triggered by the List / Grid when a cell of this column is clicked. Checks if a button is clicked 
and if so it will fire the OnClick event.

@param  oEvent  Event object.
@param  sRowId  RowId of the clicked row.
@param  sVal    Value of the clicked cell.

@param  True if this column handled the click and the list should ignore it (stops the ChangeCurrentRow).
*/
cellClickAfter : function(oEvent, sRowId, sVal){
    var eBtn = oEvent.getTarget();
    
    if(eBtn.tagName === "BUTTON" && eBtn.hasAttribute("data-dfbtnid") && this.isEnabled()){
        this.fire("OnClick", [ eBtn.getAttribute("data-dfbtnid"), sRowId ]);
        
        return true;
    }
    
    return false;
},

/*
This method determines the HTML that is displayed within a cell. It gets the value as a parameter 
and uses the column context properties (like masks) to generate the value to display. For default 
grid columns it simply displays the properly masked value.

@param  tCell   Data object reprecenting the cell data.
@return The HTML representing the display value.
*/
cellHtml : function(tCell){
    var i, aButtons, aHtml = [], sAttributes = "";
    
    if(!this.isEnabled()){
        sAttributes += ' disabled="disabled"';
    }
    
    if(this.pbDynamic){
        aButtons = tCell.aOptions;
        
        for(i = 0; i < aButtons.length; i+=3){
            if(aButtons[i]){
                aHtml.push('<button data-dfbtnid="', aButtons[i], '" class="', aButtons[i + 1], '"', sAttributes, '>', aButtons[i + 2], '</button>');
            }
        }
    }else{
        aHtml.push('<button data-dfbtnid="DEFAULT"', sAttributes, ' class="', this.psBtnCssClass, '">', this.psButtonCaption, '</button>');
    }
    return aHtml.join('');
},

/*
Override the focus method as the focus needs to go to the the first button element.

@return True if the focus is taken.
*/
focus : function(){
    var eBtn;
    
    if(this._bFocusAble && this.isEnabled() && this._eControl && this._eControl.focus){
        eBtn = df.dom.query(this._eControl, "button");
        
        if(eBtn){
            eBtn.focus();
            
            this.objFocus();
            return true;
        }
    }
    
    return false;
}



});
