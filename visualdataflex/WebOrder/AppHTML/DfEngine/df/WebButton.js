/*
Class:
    df.WebButton
Extends:
    df.WebBaseControl

This class is the client-side implementation of the cWebButton. It renders a button using the 
<button html element. The OnClick is usually implemented on the server. Special support is available 
for showing a waiting dialog when the call is being sent (pbShowWaitDialog and pbWaitMessage).
    
Revision:
    2011/08/02  (HW, DAW) 
        Initial version.
*/
df.WebButton = function WebButton(oDef, oParent){
    df.WebButton.base.constructor.call(this, oDef, oParent);
    
    //  Web Properties
    this.prop(df.tString, "psCaption", "");
    this.prop(df.tString, "psTextColor", "");
    this.prop(df.tString, "psWaitMessage", "");
    this.prop(df.tBool, "pbShowWaitDialog", false);
    
    //  Events
    this.event("OnClick", df.cCallModeWait);
    
    
    
    //  Configure super classes
    this.pbShowLabel = false;
    
    // @privates
    this._sControlClass = "WebButton";
};
df.defineClass("df.WebButton", "df.WebBaseControl",{

create : function(){
    df.WebButton.base.create.apply(this, arguments);
    
    this.set_pbShowWaitDialog(this.pbShowWaitDialog);
},

/*
This method generates the HTML for the button.

@param  aHtml   Array used as string builder for the HTML.
@private
*/
openHtml : function(aHtml){
    df.WebButton.base.openHtml.call(this, aHtml);
    
    aHtml.push('<button id="', this._sControlId, '"', (!this.isEnabled() ? ' disabled="disabled"' : ''), '>', df.dom.encodeHtml(this.psCaption), '</button>'); 
},

/*
This method is called after the HTML is added to the DOM and provides a hook for doing additional implementation. It gets references to the DOM elements, adds event handlers and executes setters t

@private
*/
afterRender : function(){
    //  Get references
    this._eControl = df.dom.query(this._eElem, "button");
    
    df.WebButton.base.afterRender.call(this);
    
    //  Attach listeners
    df.events.addDomListener("click", this._eControl, this.onBtnClick, this);
    df.events.addDomKeyListener(this._eElem, this.onKey, this);
},

/*
Event handler for the OnClick event of the button. It fires the OnClick event of the framework which 
is usually handled on the server.

@param  oEvent  Event object (df.events.DOMEvent).
@private
*/
onBtnClick : function(oEvent){
    if(this.isEnabled()){
        this.fire('OnClick', [], function(oEvent){
            //  Determine if a view needs to be loaded
            if(!oEvent.bCancelled){
                if(this.psLoadViewOnClick){
                    this.getWebApp().showView(this.psLoadViewOnClick, false);
                }
            }
        });
        oEvent.stop();
    }
},

/*
Augments the applyEnabled method to disable the button by setting the disabled attribute of the 
button HTML element.

@param  bVal    The new value.
*/
applyEnabled : function(bVal){
    df.WebButton.base.applyEnabled.call(this, bVal);
    
    if(this._eControl){
        this._eControl.disabled = !bVal;
    }
},

/*
Setter method for psCaption which is the text shown on the button.

@param  sVal    The new value.
*/
set_psCaption : function(sVal){
    if(this._eControl){
        df.dom.setText(this._eControl, sVal);
        
        this.sizeChanged();
    }
},

/*
The setter method for pbShowWaitDialog which changes the action mode of the 'OnClick' from 
df.cCallModeWait to df.cCalModeProgress so that the framework will display the waiting dialog 
during the server call.

@param  bVal    The new value.
*/
set_pbShowWaitDialog : function(bVal){
    this.setActionMode("OnClick", (bVal ? df.cCallModeProgress : df.cCallModeWait), this.psWaitMessage);
},

/* 
Ther setter method for psWaitMessage which updates the action mode of the OnClick server call with 
the new wait message.

@param  sVal    The new value.
*/
set_psWaitMessage : function(sVal){
    this.setActionMode("OnClick", (this.pbShowWaitDialog ? df.cCallModeProgress : df.cCallModeWait), sVal);
},

/*
Handles the onKey event and makes sure that it doesn't propagate the enter key to stop the onsubmit 
event of the view / dialog.

@param  oEvent  Event object (see: df.events.DOMEvent).
@private
*/
onKey : function(oEvent){
    //  Make sure that the OnSubmit doesn't fire by canceling the propagation (but leaving the default behavior, OnClick intact)
    if(oEvent.matchKey(df.settings.formKeys.submit)){ 
        oEvent.stopPropagation();
    }
}
    

});