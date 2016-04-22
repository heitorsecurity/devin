/*
Class:
    df.WebCard
Extends:
    df.WebBaseContainer

This class is the client-side representation of the cWebCard and is responsible for rendering the 
tab page. It works closely together with the WebTabPanel. The WebCard acts as a container and it 
inherits this functionality from the WebBaseContainer class.
    
Revision:
    2011/10/13  (HW, DAW) 
        Initial version.
    2012/10/02  (HW, DAW)
        Split into WebCard and WebTabPage.
*/
df.WebCard = function WebCard(sName, oParent){
    df.WebCard.base.constructor.call(this, sName, oParent);
    //  Assertions
    if(!(oParent && oParent instanceof df.WebCardContainer)){
        throw new df.Error(999, "WebCard object '{{0}}' should be placed inside a WebCardContainer object. Consider wrapping your card with a card container.", this, [ this.getLongName() ]);
    }
    
    //  Web Properties
    this.prop(df.tString, "psCaption", "");
    
    //  Events
    this.event("OnShow", df.cCallModeDefault);
    this.event("OnHide", df.cCallModeDefault);
    
    //@privates
    this._eBtn = null;
    this._eLbl = null;
    this._bCurrent = false;
    
    //  Configure super classes
    this._sControlClass = "WebCard";
    this._bWrapDiv = true;
};
df.defineClass("df.WebCard", "df.WebBaseContainer",{

// - - - - - Rendering - - - - -

/*
This method is called by the WebTabPanel to generate the HTML for the button representing this tab 
page.

@param  aHtml   Array string builder to add the HTML to.
@private
*/
tabButtonHtml : function(aHtml){
    aHtml.push('<div class="WebTab_Btn ', (this.isEnabled() ? df.CssEnabled : df.CssDisabled), '" style="', (!this.pbRender || !this.pbVisible ? 'display: none;' : ''), '" ', (!this.isEnabled() ? 'tabindex="-1"' : 'tabindex="0"'), '><span><label>', df.dom.encodeHtml(this.psCaption), '</label></span></div>');
},

/*
Augments the afterRender method to get references to DOM elements, attach event handlers and call 
setters.

@private
*/
afterRender : function(){
    df.WebCard.base.afterRender.call(this);
    
    //  Remove "display none" added by parent class if pbRender = false
    this._eElem.style.display = '';
},

/* 
Called by the card container when the tab button is rendered. Adds event handlers.

@param  eBtn    Button DOM element.
@private
*/
btnRendered : function(eBtn){
    this._eBtn = eBtn;
    
    this._eLbl = df.dom.query(this._eBtn, 'span > label'); //   WebTabPanel assings the _eBtn already
    df.events.addDomListener("click", this._eBtn, this.onBtnClick, this);
    df.events.addDomListener("click", this._eLbl, this.onBtnClick, this);
    df.events.addDomKeyListener(this._eBtn, this.onBtnKey, this);
},

attachFocusEvents : function(){
    //  We are attaching a DOM capture listener so we know when we get the focus
    if(window.addEventListener){
        df.events.addDomCaptureListener("focus", this._eBtn, this.onBtnFocus, this);
        df.events.addDomCaptureListener("blur", this._eBtn, this.onBtnBlur, this);
    }else{
        df.events.addDomListener("focusin", this._eBtn, this.onBtnFocus, this);
        df.events.addDomListener("focusout", this._eBtn, this.onBtnBlur, this);
    }
},

prepareSize : function(){
    var iResult = df.WebCard.base.prepareSize.call(this);
    
    this._bStretch = true;
    
    return iResult;
},

// - - - - - Internal - - - - -

/*
This event handler handles the click event of the tab button. 

@param  
*/
onBtnClick : function(oEvent){
    this.show();
    oEvent.stop();
},


/*
Handles the keypress event of the hidden focus anchor. Compares the event 
details to the oKeyActions and executes the action if a match is found.

@param  oEvent  Event object.
@private
*/
onBtnKey : function(oEvent){
    if(this.isEnabled()){
    
        if(oEvent.matchKey(df.settings.tabKeys.enter)){
            this.show();
            oEvent.stop();
        }
    }
},

onBtnFocus : function(oEvent){
    df.dom.addClass(this._eBtn, "WebTab_Focus");
},

onBtnBlur : function(oEvent){
    df.dom.removeClass(this._eBtn, "WebTab_Focus");
},

/*
This method is called by the WebTabPanel to hide this tab page. Note that switching a tab always 
causes this method to be called regardless whether it was already hidden.

@param  bFirst  True if this method is called during initialization.
@private
*/
_hide : function(bFirst){
    if(this._eElem){
        this._eElem.style.visibility = "hidden";
        df.dom.removeClass(this._eBtn, "WebTab_Current");
    }
    
    if(!bFirst && this._bCurrent){
        this.fire('OnHide');
    }
    
    this._bCurrent = false;
},

/*
This method is called by the WebTabPanel to show this tab page.

@param  bFirst  True if this method is called during initialization.
@private
*/
_show : function(bFirst){
    if(!this._eElem){
        //  We render the card if it wasn't rendered yet
        eElem = this.render();
        if(this._oParent._eControl.firstChild){
            this._oParent._eControl.insertBefore(eElem, this._oParent._eControl.firstChild);
        }else{
            this._oParent._eControl.appendChild(eElem);
        }
        
        this.afterRender();
        
        this.resizeHorizontal();
        this.resizeVertical();
    }else{
        if(this._eElem.parentNode.firstChild && this._eElem !== this._eElem.parentNode.firstChild){
            this._eElem.parentNode.insertBefore(this._eElem, this._eElem.parentNode.firstChild);
        }
    }
    
    this._eElem.style.visibility = "inherit";
    df.dom.addClass(this._eBtn, "WebTab_Current");
    
    
    if(!bFirst && !this._bCurrent){
        this.fire('OnShow');
    }
    this._bCurrent = true;
},

/*
This method shows this tabpage which might cause other tabpages to hide.
*/
show : function(){
    if(this.isActive()){
        this._oParent.showCard(this);
    }
},

/* 
Augments applyEnabled to update the CSS class and tabIndex of the tab button element.

@param  bVal    The enabled state.
*/
applyEnabled : function(bVal){
    df.WebCard.base.applyEnabled.call(this, bVal);
    
    if(this._eBtn){
        df.dom.toggleClass(this._eBtn, df.CssDisabled, !bVal);
        df.dom.toggleClass(this._eBtn, df.CssEnabled, bVal);
        this._eLbl.tabIndex = (bVal ? 0 : -1);
    }
},

// - - - - - Setters - - - - -

set_psCaption : function(sVal){
    if(this._eLbl){
        //  Update the card container label
        if(this._oParent._oCurrent === this && this._oParent._eLabel){
            df.dom.setText(this._oParent._eLabel, sVal);
        }
        
        //  Update the tab button label
        df.dom.setText(this._eLbl, sVal);
    }
},

set_pbVisible : function(bVal){
    if(this._eBtn){
        this._eBtn.style.display = (bVal && this.pbRender ? '' : 'none');
        
        //  Update property because it will be used by hideCard and showCard
        this.pbVisible = bVal;
        
        //  Make sure that we end up with a 'valid' situation
        if(!bVal){
            if(this._bCurrent){
                this._oParent.hideCard(this);
            }
        }else{
            if(!this._oParent._oCurrent){
                this._oParent.showCard(this);
            }
        }
    }
},

set_pbRender : function(bVal){
    if(this._eBtn){
        this._eBtn.style.display = (bVal && this.pbVisible ? '' : 'none');
        
        if(this.pbRender !== bVal){
            //  Update property because it will be used by hideCard and showCard
            this.pbRender = bVal;
            
            //  Make sure that we end up with a 'valid' situation
            if(!bVal){
                if(this._bCurrent){
                    this._oParent.hideCard(this);
                }
            }else{
                if(!this._oParent._oCurrent){
                    this._oParent.showCard(this);
                }
            }
        }
    }
},

set_psTextColor : function(sVal){
    if(this._eLbl){
        this._eLbl.style.color = sVal || '';
    }
    
    df.WebCard.base.set_psTextColor.call(this, sVal);
},

set_psBackgroundColor : function(sVal){
    if(this._eBtn){
        this._eBtn.style.background = sVal || '';
    }
    
    df.WebCard.base.set_psBackgroundColor.call(this, sVal);
}

});