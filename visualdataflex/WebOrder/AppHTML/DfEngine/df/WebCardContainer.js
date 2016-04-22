/*
Class:
    df.WebCardContainer
Extends:
    df.WebBaseControl

This class is the client-side representation of the cWebCardContainer and is responsible for rendering 
this tab dialog. It can only contain cWebTabPage objects as children.
    
Revision:
    2011/10/13  (HW, DAW) 
        Initial version.
    2012/10/02  (HW, DAW)
        Split into WebCardContainer and WebTabContainer.
*/
df.WebCardContainer = function WebCardContainer(sName, oParent){
    df.WebCardContainer.base.constructor.call(this, sName, oParent);
    
    //  Web Properties
    this.prop(df.tBool, "pbFillHeight", false);
    this.prop(df.tInt, "piMinHeight", 0);
    this.prop(df.tInt, "piHeight", 0);
    
    this.prop(df.tBool, "pbShowBorder", false);
    this.prop(df.tBool, "pbShowCaption", false);
    
    this.prop(df.tString, "psCurrentCard", "");
    this.addSync("psCurrentCard");
    
    //  Events
    this.event("OnCardChange", df.cCallModeWait);
    
    //@privates
    this._iHeightSet = null;
    this._aCards = [];
    this._eHead = null;
    this._oCurrent = null;
    this._bRendered = false;
    
    //  Configure super classes
    this._bWrapDiv = true;
    this._bRenderChildren = true;
    this._sControlClass = "WebCardContainer";
    this._sCardClass = "WebCC";
};
df.defineClass("df.WebCardContainer", "df.WebBaseControl",{

// - - - - Rendering - - - - 

openHtml : function(aHtml){
    var i;
    
    df.WebCardContainer.base.openHtml.call(this, aHtml);
    
    //  Generate header HTML
    aHtml.push('<div class="', this._sCardClass, '_LabelSpacer" style="', (this.pbShowCaption ? '' : 'display: none'), '"><label></label></div>');
    aHtml.push('<div class="', this._sCardClass, '_Head">');
    
    for(i = 0; i < this._aCards.length; i++){
        this._aCards[i].tabButtonHtml(aHtml);
    }
    
    aHtml.push('<div style="clear: both"></div></div>');
    
    //  Generate body HTML
    aHtml.push('<div class="', this._sCardClass, '_Body ', (this.pbShowBorder ? 'WebCC_BodyBorder' : 'WebCC_BodyNoBorder') , (this.pbShowCaption ? ' WebCC_HasCaption' : '') ,'" style="overflow: hidden">');
},

closeHtml : function(aHtml){
    aHtml.push('</div>');
    
    df.WebCardContainer.base.closeHtml.call(this, aHtml);
},

afterRender : function(){
    var i, aButtons;
    
    this._eHead = df.dom.query(this._eElem, 'div.' + this._sCardClass + '_Head');
    this._eLabelSpacer = df.dom.query(this._eElem, 'div.' + this._sCardClass + '_LabelSpacer');
    this._eLabel = df.dom.query(this._eElem, 'div.' + this._sCardClass + '_LabelSpacer > label');
    
    //  Get references to the button elements
    aButtons = df.dom.query(this._eElem, 'div.' + this._sCardClass + '_Head > div.WebTab_Btn', true);
    
    //  Pass references to the button elements to the corresponding tab pages
    for(i = 0; i < this._aCards.length; i++){
        if(i < aButtons.length){
            this._aCards[i].btnRendered(aButtons[i]);
        }
    }
    
    df.WebCardContainer.base.afterRender.call(this);
    
    //  Display the current tab
    this.showCard(this._oCurrent, true);

    
    this._bRendered = true;
},

/* 
Override the renderChildren procedure to determine the initial card (we need to know now) and to 
optimize by only rendering the cards that are needed.

@param  eRenderTo   DOM element to render children into (not used by current implementation).
@private
*/
renderChildren : function(eRenderTo){
    var oChild, eChild, i;
    
    //  Determine initial current card
    if(this.psCurrentCard){
        this._oCurrent = this.getWebApp().findObj(this.psCurrentCard);
    }
    
    for(i = 0; i < this._aCards.length && !this._oCurrent; i++){
        if(this._aCards[i].isActive()){
            this._oCurrent = this._aCards[i];
        }
    }
    
    //  Get reference to wrapping div
    eRenderTo = this._eControl = df.dom.query(this._eElem, 'div.' + this._sCardClass + '_Body');
    
    if(this.hasDynamicHeight()){    //  If the height is influenced by the card height we need to render all cards on intiialization
        //  Call children and append them to ourselves
        for(i = 0; i < this._aChildren.length; i++){
            oChild = this._aChildren[i];
            
            //  Check if we can actually render the object
            if(oChild instanceof df.WebBaseUIObject){
                eChild = oChild.render();
                
                if(eChild){
                    eRenderTo.appendChild(eChild);
                }
            }
        }
    }else if(this._oCurrent){   //  If the height is fixed (pbFillHeight / piHeight is set) then we only have to render the current card
        eChild = this._oCurrent.render();
                
        if(eChild){
            eRenderTo.appendChild(eChild);
        }
    }
},

/* 
We override this procedure as we do not always render all cards. So we only want to call afterRender 
on the rendered cards.

@private
*/
afterRenderChildren : function(){
    if(this.hasDynamicHeight()){
        df.WebCardContainer.base.afterRenderChildren.apply(this, arguments);
    }else if(this._oCurrent){
        this._oCurrent.afterRender();
    }
      
},

/* 
Determines if the card content can influence the height. Is called to see if we need to render all 
cards on initialization or just the current card.

@return True if the container is sized by the card content.
@private
*/
hasDynamicHeight : function(){
    return (!this.pbFillHeight && this.piHeight <= 0);
},

/*
Augmenting the addChild method to filter out tabs.

@private
*/
addChild : function(oChild){
    if(oChild instanceof df.WebCard){
        this._aCards.push(oChild);
    }else if(oChild instanceof df.WebBaseUIObject){
        throw new df.Error(999, "WebCardContainer objects cannot have controls as direct children '{{0}}'. Consider placing them within a WebCard.", this, [ (oChild.getLongName() || 'oWebApp') ]);
    }    
    
    
    df.WebCardContainer.base.addChild.call(this, oChild);
},

/*
Override the bubbling afterShow message and only send it to the currently shown card.
*/
afterShow : function(){
    this._bShown = true;
    
    if(this._oCurrent){
        this._oCurrent.afterShow();
    }
},

/*
Override the bubbling afterHide message and only send it to the currently shown card.
*/
afterHide : function(){
    this._bShown = false;

    if(this._oCurrent){
        this._oCurrent.afterHide();
    }
},


// - - - - Sizing  - - - - 

/*
This method determines the natural height of the card container. It does this by visiting all the 
cards and calling their getRequiredHeight method which returns height required by the 
components inside that card.

@return The natural height needed (based on the highest card).
*/
getNaturalHeight : function(){
    var iHeight = 0, i, iTab;
    
    //  Determine highest tab page
    for(i = 0; i < this._aCards.length; i++){
        if(this._aCards[i].pbRender && this._aCards[i]._eElem){
            iTab = this._aCards[i].getRequiredHeight();
            if(iTab > iHeight){
                iHeight = iTab;
            }
        }
    }
    
    //  Take the height that we loze
    iHeight += this.getHeightDiff();
    
    return iHeight;
},

/*
The sizeHeight method is called by the WebBaseContainer and WebBaseControl to size the control. We 
override the default implementation because the WebCardContainer has special logic when sizing 
'naturally'. Other controls have the natural size determined by their CSS but the we need to 
determine it based on the controls embedded inside the WebCards.

@param  iExtHeight  The height determined by the container (-1 means suite yourself).
@return The height that is actually applied.
*/
sizeHeight : function(iExtHeight){
    var iHeight = -1;

    //  Determine which height to use
    if(this.pbFillHeight){
        iHeight = iExtHeight;
    }else{
        if(this.piHeight > 0){
            iHeight = this.piHeight;
        }else{
            iHeight = this.getNaturalHeight();
        }
    }
    
    //  Respect minimal height
    if(iHeight < this.piMinHeight){
        iHeight = this.piMinHeight;
    }
    
    //  Update the height
    this.setHeight(iHeight);
    
    //  Return the final height
    if(iHeight > 0){
        return iHeight;
    }
},

/*
The setHeight method is called by the sizeHeight method to actually apply the determined height. We 
do this by setting the height on the body element.

@param  iHeight     The height in pixels.
*/
setHeight : function(iHeight){
    if(this._eControl){
        //  If a negative value is given we should size 'naturally'
        if(iHeight > 0){
            //  If the label is on top we reduce that (note that this means that piMinHeight and piHeight are including the label)
            if(this.peLabelPosition === df.ciLabelTop){
                iHeight -= this._eLbl.offsetHeight;
            }
            
            //  Reduce the header and borders, paddings and margins
            iHeight -= this.getHeightDiff();
        
            //  Set the height on the body element
            this._eControl.style.height = iHeight + "px";
        }
    }
},

/* 
Make sure that the cards prepare for the sizing process as well. Also check if the size of card 
changed as this might mean that the control needs to resize which is important for the parent 
container its sizing logic.

@private
*/
/* prepareSize : function(){
    var i, bChanged = false;

    if(this._eElem && this._bRendered){
        //  Resize the tabpages
        for(i = 0; i < this._aCards.length; i++){
            if(this._aCards[i]._eElem){
                this._aCards[i].prepareSize();
                bChanged = bChanged || this._aCards[i]._bWantedChanged;
            }
        }
        
        //  If the wanted size changed we do need to resize the card container itself
        if(bChanged && !this.pbFillHeight){
            this.sizeHeight(-1);
        }
    }
}, */

/*
The resize method is called when the view / application resizes and during initialization. We call 
the resize methods of the WebCards.

@private
*/
resize : function(){
    var i;

    if(this._eElem && this._bRendered){
        //  Resize the tabpages
        for(i = 0; i < this._aCards.length; i++){
            if(this._aCards[i]._eElem){
                this._aCards[i].resizeHorizontal();
                this._aCards[i].resizeVertical();
            }
        }
        
        //  A resize can also mean that the tab page size changed, if pbFillHeight is true sizeHeight will be called by container, if not we force it here!
        if(!this.pbFillHeight){
            this.sizeHeight(-1);
        }
    }
},

/*
This method determines the height that is lost. For the tab panel this is the space that the buttons 
take.

@return The amount of pixels that can't be used by the content.
@private
*/
getHeightDiff : function(){
    var iHeight = 0;
    
    if(this._eHead){
        iHeight += this._eHead.clientHeight;
        iHeight += df.sys.gui.getVertBoxDiff(this._eHead, 1);  //  Outside difference
    }
    
    if(this.pbShowCaption && this._eLabelSpacer){
        iHeight += this._eLabelSpacer.clientHeight;
        iHeight += df.sys.gui.getVertBoxDiff(this._eHead, 1);  //  Outside difference
    }
    
    
    if(this._eControl){
        iHeight += df.sys.gui.getVertBoxDiff(this._eControl);
        iHeight += df.sys.gui.getVertBoxDiff(this._eInner);
        iHeight += df.sys.gui.getVertBoxDiff(this._eControlWrp);
    }
    
    return iHeight;
},

/*
The getMinHeight function is called by the column layout resize system implemented in 
WebBaseContainer. It determines the minimal height that the control needs to render itself. The 
WebCardContainer uses the getNaturalHeight method to determine the required height and respects the 
piMinHeight property.

@return The minimal height needed in pixels.
*/
getMinHeight : function(){
    var iHeight = 0;
    
   
    //  If we have a static height then that is the required height
    if(this.piHeight > 0){
        return this.piHeight;
    }
    if(this.pbFillHeight){
        return this.piMinHeight;
    }

    //  Give child containers a chance to resize
    this.resize();
    
    //  Determine natural height
    iHeight = this.getNaturalHeight();
    
    //  Respect piMinHeight
    if(iHeight < this.piMinHeight){
        iHeight = this.piMinHeight;
    }
    
    return iHeight;
},


/* 
Makes sure that all cards are rendered. 

@private
*/
renderAllCards : function(){
    var i, eElem;
    
    for(i = 0; i < this._aCards.length; i++){
        if(!this._aCards[i]._eElem){
            eElem = this._aCards[i].render();
            this._eControl.appendChild(eElem);
            this._aCards[i].afterRender();
        }
    }
},

/* 
Augment piHeight setter and make sure that all cards are rendered if it is set to 0.

@param  iVal    New value.
@private
*/
set_piHeight : function(iVal){
    if(iVal <= 0){
        this.renderAllCards();
    }
    
    df.WebCardContainer.base.set_piHeight.call(this, iVal);
},

/* 
Augment pbFillHeight setter and make sure that all cards are rendered if it is set to false.

@param  iVal    New value.
@private
*/
set_pbFillHeight : function(bVal){
    if(!bVal){
        this.renderAllCards();
    }
    
    df.WebCardContainer.base.set_pbFillHeight.call(this, bVal);
},


// - - - - Focus  - - - - 

/*
We attach the focus events to the header of the tab container because that is the part that takes 
the focus.

@private
*/
attachFocusEvents : function(){
    //  We are attaching a DOM capture listener so we know when we get the focus
    if(this._eHead){
        if(window.addEventListener){
            df.events.addDomCaptureListener("focus", this._eHead, this.onFocus, this);
            df.events.addDomCaptureListener("blur", this._eHead, this.onBlur, this);
        }else{
            df.events.addDomListener("focusin", this._eHead, this.onFocus, this);
            df.events.addDomListener("focusout", this._eHead, this.onBlur, this);
        }
    }
},

/*
Pass the focus on to the children like a container.
*/
focus : function(bOptSelect){
    var i;
    
    for(i = 0; i < this._aChildren.length; i++){
        if(this._aChildren[i].focus){
            if(this._aChildren[i].focus(bOptSelect)){
                return true;
            }
        }
    }
    
    return false;
},

/* 
The conditionalFocus only really gives the focus to an element on desktop browsers where on mobile 
browsers it only registers the object as having the focus without actually giving the focus to the 
DOM. 

@param  bOptSelect      Select the text in forms if true.
@return True if the focus is taken.
*/
conditionalFocus : function(bOptSelect){
    var i;
    
    for(i = 0; i < this._aChildren.length; i++){
        if(this._aChildren[i].conditionalFocus){
            if(this._aChildren[i].conditionalFocus(bOptSelect)){
                return true;
            }
        }
    }
    
    return false;
},

/*
Make sure that we only forward focus events if we don't already have the focus. Also cancel the blur 
timeout.

@param  oEvent  Event object.
@private
*/
onFocus : function(oEvent){
    if(!this._bHasFocus){
        df.WebCardContainer.base.onFocus.call(this, oEvent);
    }
    
    this._bLozingFocus = false;
},

/*
Since the focus can change within the control we only forward the blur after a small timeout. If 
focus events occur within this timeout we know that the control still has the focus so we don't 
perform the blur.

@param  oEvent  Event object.
@private
*/
onBlur : function(oEvent){
    var that = this;
    
    this._bLozingFocus = true;
    
    setTimeout(function(){
        if(that._bLozingFocus){
            df.WebCardContainer.base.onBlur.call(that, oEvent);
            
            that._bLozingFocus = false;
        }
    }, 100);
},


// - - - - Generic - - - - 

/*
This method loops over the tabs and makes sure all of them are hidden and the right one is shown.

@private
*/
showCard : function(oDisplay, bOptFirst){
    var i, oTab;
    if(this.isEnabled() || bOptFirst){   // TODO: Check if this is the right place to do this thing (should a disabled card container not be able to change cards dynamically?)
        if(oDisplay && oDisplay.isActive()){
            //  Fire cardchange event if needed
            if(!bOptFirst && oDisplay !== this._oCurrent){
                this.fireCardChange(oDisplay._sName, (this._oCurrent && this._oCurrent._sName) || "");
            }
            
            //  Visit all tabs showing / hiding them
            if(this._eElem){
                for(i = 0; i < this._aCards.length; i++){
                    oTab = this._aCards[i];
                    
                    if(oTab === oDisplay){
                        oTab._show(!!bOptFirst);
                        
                        if(this._eLabel){
                            df.dom.setText(this._eLabel, oTab.psCaption);
                        }
                    }else{
                        oTab._hide(!!bOptFirst);
                    }
                }
            }
            
            //  Trigger afterHide
            if(!bOptFirst && this._oCurrent){
                this._oCurrent.afterHide();
            }
            
            this._oCurrent = oDisplay;
            
            //  Trigger afterShow
            if(!bOptFirst){
                this._oCurrent.afterShow();
            }
            
            if(this.getWebApp()){
                this.getWebApp().notifyLayoutChange(this);
            }
        }
    }
},

fireCardChange : function(sTo, sFrom){
    this.fire('OnCardChange', [ sTo, sFrom ]);
},

hideCard : function(oHide){
    var i, oTab, oLast = null, bFound = false;
    if(oHide === this._oCurrent){
        //  Find the next tab to display
        for(i = 0; i < this._aCards.length; i++){
            oTab = this._aCards[i];
            
            if(oTab.isActive()){
                if(bFound){
                    this.showCard(oTab);
                    return;
                }
                oLast = oTab;
            }
            
            if(oTab === oHide){
                bFound = true;
            }
        }
        
        this.showCard(oLast);
    }
},

nextCard : function(){
    var i, bFound = false, oTab;
    
    for(i = 0; i < this._aCards.length; i++){
        oTab = this._aCards[i];
        
        if(!bFound){
            bFound = (oTab === this._oCurrent);
        }else{
            if(oTab.isActive()){
                this.showCard(oTab);
                return;
            }
        }
    }
},

previousCard : function(){
    var i, bFound = false, oTab;
    
    for(i = this._aCards.length - 1; i >= 0; i--){
        oTab = this._aCards[i];
        
        if(!bFound){
            bFound = (oTab === this._oCurrent);
        }else{
            if(oTab.isActive()){
                this.showCard(oTab);
                return;
            }
        }
    }
},

get_psCurrentCard : function(){
    return (this._oCurrent && this._oCurrent.getLongName()) || "";
},

set_pbShowBorder : function(bVal){
    if(this._eControl){
        df.dom.toggleClass(this._eControl, this._sCardClass + "_BodyBorder", bVal);
        df.dom.toggleClass(this._eControl, this._sCardClass + "_BodyNoBorder", !bVal);
        
        this.sizeChanged();
    }
},

set_pbShowCaption : function(bVal){
    if(this._eLabel){
        this._eLabelSpacer.style.display = (bVal ? '' : 'none');
        
        df.dom.toggleClass(this._eControl, this._sCardClass + "_HasCaption", bVal);
        
        this.sizeChanged();
    }
},

set_psBackgroundColor : function(sVal){
    if(this._eElem){
        this._eElem.style.background = sVal || '';
    }
}

});