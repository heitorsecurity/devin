/*
Class:
    df.WebBaseUIObject
Extends:
    df.WebObject

The WebBaseUIObject is a central class in the inheritance structure of the webapp framework. It 
defines the interface/API for all objects having a user interface. All control classes inherit this 
interface. There is a standardized API for initializing the control by generating the HTML and later 
on attaching the events. Central methods are openHtml, closeHtml, render and afterRender. Properties 
that are standard for all controls are psCSSClass, psHtmlId, pbVisible, pbRender and pbEnabled.
    
Revision:
    2011/07/02  (HW, DAW) 
        Initial version.
*/

df.WebBaseUIObject = function WebBaseUIObject(sName, oParent){
    df.WebBaseUIObject.base.constructor.call(this, sName, oParent);
    
    //  Public properties for all UI Objects
    this.prop(df.tString, "psCSSClass", "");
    this.prop(df.tString, "psHtmlId", "");
    
    this.prop(df.tString, "psTextColor", "");
    this.prop(df.tString, "psBackgroundColor", "");
    
    this.prop(df.tBool, "pbRender", true);
    this.prop(df.tBool, "pbVisible", true);
    this.prop(df.tBool, "pbEnabled", true);
    
    this.event("OnRender", df.cCallModeDefault);
    
    //@privates
    this._eElem = null;                 //  Outermost DOM element
    
    this._bWrapDiv = false;             //  Enables generation of the wrapping DIV element
    this._bRenderChildren = false;      //  Enables rendering of child components (some controls support children)
    
    this._bFocusAble = false;           //  Determines if this control is capable of having the focus
    
    this._sControlClass = "";           //  CSS Class of the final control class
    this._sBaseClass = "WebUIObj";      //  CSS Class of the 'base' class
    
    this._aKeyHandlers = [];
    
    this._bShown = false;
    
};
df.defineClass("df.WebBaseUIObject", "df.WebObject",{


// - - - - - - - Rendering API - - - - - - -

/*
This function is responsible for generating the opening HTML during initialization. It is called by 
the framework and an array is passed as string builder. It will add its HTML to this string. The 
closeHtml function is responsible for closing the opened HTML tags. It is common practice that sub 
classes add their HTML before or after doing a forward send.

@param aHtml     Array that is used as string builder.
*/
openHtml : function(aHtml){
    if(this._bWrapDiv){
        aHtml.push('<div class="', this.genClass(), '"');
        if(this.psHtmlId){
            aHtml.push(' id="', this.psHtmlId, '"');
        }
        
        //  Insert the object name so the HTML element can be traced back to the right object
        aHtml.push(' data-dfobj="', this.getLongName(), '"' ); 
        
        aHtml.push(' tabindex="-1" style=" ',  (this.pbRender ? '' : 'display: none;'), (this.pbVisible ? '' : 'visibility: hidden;'), '"');
        aHtml.push('>');
    }

},

/*
This function is responsible for generating the HTML that closes the elements that are left open by 
the openHtml function. It is common practice that sub classes add their HTML before or after doing a 
forward send.

@param aHtml     Array that is used as string builder.
*/
closeHtml : function(aHtml){
    if(this._bWrapDiv){
        aHtml.push('</div>');
    }
},

/*
Main function of the rendering process. It calls openHtml, closeHtml and genets the DOM elements for 
them. If needed it will call renderChildren to render nested controls.

@return Reference to the outermost DOM element.
*/
render : function(){
    var aHtml = [];
    
    this.openHtml(aHtml);
    this.closeHtml(aHtml);
    
    this._eElem = df.dom.create(aHtml.join(""));
    
    this.getRef();
    
    if(this._bRenderChildren){
        this.renderChildren();
    }
    
    return this._eElem;
},

/* 
This function is part of the rendering process and is called after the DOM elements are created and 
before the child elements are rendering itself. Its purpose is to get references to DOM elements 
without nesting issues.
*/
getRef : function(){
    
},

/*
This function is part of the initialization process and is called after the DOM elements are 
created. Its main purpose is to get the needed references to the DOM elements, attach focus events 
and do further initialization (call setters for example). Most of the subclasses will augment this 
method for their initialization. If needed it calls the afterRenderChildren method to initialize 
nested controls.
*/
afterRender : function(){
    if(this._bRenderChildren){
        this.afterRenderChildren();
    }
    
    //  Add key listener if handlers are registered
    if(this._aKeyHandlers.length > 0){
        df.events.addDomListener("keydown", this._eElem, this.onKeyDownHandler, this);
    }
    
    this.fire("OnRender");
    
    this.attachFocusEvents();
        
    //  Apply properties
    this.set_psTextColor(this.psTextColor);
    if(this.psBackgroundColor){
        this.set_psBackgroundColor(this.psBackgroundColor);
    }
},

/* 
Destroy the DOM elements and remove all DOM Event handlers to prevent memory leaks.

@private
*/
destroy : function(){
    df.WebBaseUIObject.base.destroy.call(this);    
    
    if(this._eElem){
        df.events.clearDomListeners(this._eElem, true);
        if(this._eElem.parentNode){
            this._eElem.parentNode.removeChild(this._eElem);
        }
    }
    this._eElem = null;
},


/*
This function is called after this control is shown. It recursively calls its children if 
_bRenderChildren is true. It is triggered by the webapp, views, card container and the pbRender 
setter. It is meant to be augmented by controls when they need to execute special code when this 
happens.
*/
afterShow : function(){
    var i;
    
    this._bShown = true;
    
    if(this._bRenderChildren){
        for(i = 0; i < this._aChildren.length; i++){
            if(this._aChildren[i] instanceof df.WebBaseUIObject && this._aChildren[i].pbRender){
                this._aChildren[i].afterShow();
            }
        }
    }
},

/*
This function is called after this control is hidden. It recursively calls its children if 
_bRenderChildren is true. It is triggered by the webapp, views, card container and the pbRender 
setter. It is meant to be augmented by controls when they need to execute special code when this 
happens.
*/
afterHide : function(){
    var i;
    
    this._bShown = false;
    
    if(this._bRenderChildren){
        for(i = 0; i < this._aChildren.length; i++){
            if(this._aChildren[i] instanceof df.WebBaseUIObject && this._aChildren[i].pbRender){
                this._aChildren[i].afterHide();
            }
        }
    }
},


attachFocusEvents : function(){

},

renderChildren : function(eContainer){
    var i, eChild, oChild;
    
    eContainer = eContainer || this._eElem;

    //  Call children and append them to ourselves
    for(i = 0; i < this._aChildren.length; i++){
        oChild = this._aChildren[i];
        
        //  Check if we can actually render the object
        if(oChild instanceof df.WebBaseUIObject){
            eChild = oChild.render();
            
            if(eChild){
                eContainer.appendChild(eChild);
            }
        }
    }
    
},

afterRenderChildren : function(){
    var i;
    //  Call children
    for(i = 0; i < this._aChildren.length; i++){
        if(this._aChildren[i] instanceof df.WebBaseUIObject){
            this._aChildren[i].afterRender();
        }
    }
},

/* 
Determines if the UI object is active which means that it is visible and enabled. The previewer will 
override this function to enable functionality inside the previewer.  

@return True if the UI object is active.
@private
*/
isActive : function(){
    return this.pbRender && this.pbVisible && this.isEnabled();
},

/* 
Determines if the UI Object is enabled. As controls inside disabled containers should disable as 
well it also looks at the enabled state of the parents. 

@return True if the control is enabled.
*/
isEnabled : function(){
    if(!this.pbEnabled){
        return false;
    }else if(this._oParent instanceof df.WebBaseUIObject){
        return this._oParent.isEnabled();
    }
    
    return true;
},

/* 
Updates the enabled state of the control. It makes sure the right enabled state is applied and it 
notifies child controls to update their enabled state.
*/
updateEnabled : function(){
    var i;
    
    this.applyEnabled(this.isEnabled());
    
    if(this._bRenderChildren){
        for(i = 0; i < this._aChildren.length; i++){
            if(this._aChildren[i] instanceof df.WebBaseUIObject){
                this._aChildren[i].updateEnabled();
            }
        }
    }
},

/* 
Applies the current enabled state by setting / removing the "Web_Enabled" and "Web_Disabled" CSS 
classes. Subclasses will augment this function to properly disable the specific controls.

@param  bVal    The enabled state.
*/
applyEnabled : function(bVal){
    // df.debug("applyEnabled called on: (" + df.sys.ref.getConstructorName(this) + ") " + this.getLongName());
    if(this._eElem){
        df.dom.toggleClass(this._eElem, df.CssDisabled, !bVal);
        df.dom.toggleClass(this._eElem, df.CssEnabled, bVal);
    }
},

/*
This method generates the CSS classname that is applied to the outermost DOM element of this 
control. It combines _sBaseClass, _sControlClass, psCSSClass and pbEnabled. Subclasses that want to 
add more CSS classes will augment this method. It is called during initialization and when the 
psCSSClass is set.

Note: Changes made here should also be made in WebAppPreviewer.js!

@return String containing the CSS Classes.
@private
*/
genClass : function(){
    return this._sBaseClass + " " + this._sControlClass + " " + (this.isEnabled() ? df.CssEnabled : df.CssDisabled) + ( this.psCSSClass ? " " + this.psCSSClass : "");
},

// - - - - - - - Setters & Getters - - - - - - -

set_psTextColor : function(sVal){
    if(this._eElem){
        this._eElem.style.color = sVal || '';
    }
},

set_psBackgroundColor : function(sVal){
    if(this._eElem){
        this._eElem.style.background = sVal || '';
    }
},

set_pbVisible : function(bVal){
    if(this._eElem){
        this._eElem.style.visibility = (bVal ? '' : 'hidden');
    }
},

set_pbRender : function(bVal){
    if(this._eElem){
        this._eElem.style.display = (bVal ? '' : 'none');
        
        if(this.pbRender !== bVal){
            this.pbRender = bVal;
            
            //  Trigger after hide / show
            if(this.pbRender){
                this.afterShow();
            }else{
                this.afterHide();
            }
            
            //  The parent panel to recalculate its sizes
            this.sizeChanged(true);
        }
    }
},

/* 
Setter of pbEnabled which updates the enabled state (only if it actually changed).

@param  bVal    New value.
*/
set_pbEnabled : function(bVal){
    if(bVal !== this.pbEnabled){
        this.pbEnabled = bVal;
        
        this.updateEnabled();
    }
},

set_psCSSClass : function(sVal){
    this.psCSSClass = sVal;
    
    if(this._eElem){
        this._eElem.className = this.genClass();
    }
},

set_psHtmlId : function(sVal){
    if(this._eElem){
        this._eElem.id = sVal;
    }
},

// - - - - - - - Supportive - - - - - - -

/* 
Registers a key handler for the provided key combination. The key handlers are stored in an array 
and are accessed when a key event occurs. An array of messages that need to be triggered on the 
server is stored with the key information.

@param  sServerMsg  String message name of server-side handler message.
@param  iKeyCode    Integer key code (event.keyCode).
@param  bShift      Idicates if shift needs to be pressed.
@param  bAlt        Indicates if alt needs to be pressed.
@param  bCtrl       Indicates if ctrl needs to be pressed.

@client-action
*/
addKeyHandler : function(sServerMsg, iKeyCode, bShift, bAlt, bCtrl){
    var i, oKH;
    
    //  Convert to JS type
    iKeyCode    = df.toInt(iKeyCode);
    bShift      = df.toBool(bShift);
    bAlt        = df.toBool(bAlt);
    bCtrl       = df.toBool(bCtrl);
    
    //  Check if no key handler is defined for this key
    oKH = this.findKeyHandler(iKeyCode, bShift, bAlt, bCtrl);
    
    if(oKH){
        //  Add to existing handler if message isn't already registered
        for(i = 0; i < oKH.aMsg.length; i++){
            if(oKH.aMsg[i] === sServerMsg){
                return;
            }
        }
        
        oKH.aMsg.push(sServerMsg);
    }else{
        //  Add key handler if not already added
        if(this._aKeyHandlers.length === 0 && this._eElem){
            df.events.addDomListener("keydown", this._eElem, this.onKeyDownHandler, this);
        }
        
        //  Register new key handler
        this._aKeyHandlers.push({ 
            iKey : iKeyCode, 
            aMsg : [ sServerMsg ],
            bShift : bShift,
            bAlt : bAlt,
            bCtrl : bCtrl
        });
    }
},

/* 
Removes a registered key handler based on the details used when it is added. 

@param  sServerMsg  String message name of server-side handler message.
@param  iKeyCode    Integer key code (event.keyCode).
@param  bShift      Idicates if shift needs to be pressed.
@param  bAlt        Indicates if alt needs to be pressed.
@param  bCtrl       Indicates if ctrl needs to be pressed.

@client-action
*/
removeKeyHandler : function(sServerMsg, iKeyCode, bShift, bAlt, bCtrl){
    var i, oKH;
    
    //  Convert to JS types
    iKeyCode    = df.toInt(iKeyCode);
    bShift      = df.toBool(bShift);
    bAlt        = df.toBool(bAlt);
    bCtrl       = df.toBool(bCtrl);
    
    //  Search key handler
    oKH = this.findKeyHandler(iKeyCode, bShift, bAlt, bCtrl);
    
    if(oKH){
        //  Remove message
        for(i = 0; i < oKH.aMsg.length; i++){
            if(oKH.aMsg[i] === sServerMsg){
                oKH.aMsg.splice(i, 1);
                i--;
            }
        }
        
        //  Remove entire handler no more messages
        if(!oKH.aMsg.length){
            this._aKeyHandlers.slice(oKH.iIndex, 1);
        }
    }
    
    //  Remove DOM handler if no more handlers
    if(this._aKeyHandlers.length === 0 && this._eElem){
        df.events.removeDomListener("keydown", this._eElem, this.onKeyDownHandler);
    }
},

/* 
Searches the array of key handlers for a specific key and returns the handler object. It adds an 
extra property iIndex to the object that contains the array index of the key handler.

@param  iKeyCode    Integer key code (event.keyCode).
@param  bShift      Idicates if shift needs to be pressed.
@param  bAlt        Indicates if alt needs to be pressed.
@param  bCtrl       Indicates if ctrl needs to be pressed.

@return Key handler object (null if none found).
@private
*/
findKeyHandler : function(iKeyCode, bShift, bAlt, bCtrl, iIndexOut){
    var i, oH;
    
    //  Loop all handlers to find specific handler
    for(i = 0; i < this._aKeyHandlers.length; i++){
        oH = this._aKeyHandlers[i];
        
        if(oH.iKey === iKeyCode && oH.bShift === bShift && oH.bAlt === bAlt && oH.bCtrl === bCtrl){
            oH.iIndex = i;
            
            return oH;
        }
    }
    
    return null;
},

/* 
Event handler for the onkey event. It searches for a key handler and if found it triggers the server 
actions that belong to it. 

@param  oEvent  Event object.
*/
onKeyDownHandler : function(oEvent){
    var oKH, i;
    
    //  Search handler
    oKH = this.findKeyHandler(oEvent.getKeyCode(), oEvent.getShiftKey(), oEvent.getAltKey(), oEvent.getCtrlKey());
        
    if(oKH){
        //  Perform server actions if found
        for(i = 0; i < oKH.aMsg.length; i++){
            this.serverAction(oKH.aMsg[i], [ oKH.iKey, df.fromBool(oKH.bShift), df.fromBool(oKH.bAlt), df.fromBool(oKH.bCtrl) ]);
        }
        oEvent.stop();
    }
},

/*
This method is called by the server to pass the focus to this control.

@client-action
*/
svrFocus : function(){
    this.focus();
},

/* 
Listener of the onfocus event of the DOM element that keeps the focus. It registers this ui object 
as having the focus.

@param  oEvent  The event object (see: df.events.DOMEvent).
*/
onFocus : function(oEvent){
    this.objFocus();
},

/* 
Registers this ui object as having the focus at the view and the webapp.

@private
*/
objFocus : function(){
    var oV = this.getView(), oW = this.getWebApp();
    if(oV){
        oV.objFocus(this);
    }
    if(oW){
        oW.objFocus(this);
    }
},

/* 
Gives the focus to the control. It will give the focus to the DOM element. This function is 
overridden in sub classes if a different element actually holds the focus.

@return     True if the object successfully takes the focus (false if not enabled or focusable).
@private
*/
focus : function(bOptSelect){
    if(this._bFocusAble && this.isEnabled() && this._eElem && this._eElem.focus){
        this._eElem.focus();
        
        this.objFocus();
        return true;
    }
    
    return false;
},

/* 
The conditionalFocus only really gives the focus to an element on desktop browsers where on mobile 
browsers it only registers the object as having the focus without actually giving the focus to the 
DOM. It is used when the framework itself passes the focus to a control to prevent the on-screen 
keyboard from popping up.

@param  bOptSelect      Select the text in forms if true.
@return True if the focus is taken.
*/
conditionalFocus : function(bOptSelect){
    if(!df.sys.isMobile){
        return this.focus(bOptSelect);
    }
    if(this._bFocusAble && this.isEnabled()){
        this.objFocus();
        
        return true;
    }
    return false;
},

onBlur : function(oEvent){
    var oWebApp = this.getWebApp();
    if(oWebApp){
        oWebApp.objBlur(this);
    }
},

/*
This method is called by setters or by child controls when the size has changes which mean that 
everything might need to resize. We try to resize from the parent down but if no parent is available 
we start at this level.

@param  bPosition   True if the column layout positioning is affected by the size change and needs 
                    recalculation.
@private
*/
sizeChanged : function(bPosition){
    var oWebApp = this.getWebApp(), oObj = this;
    
    if(bPosition){
        //  Set switch to trigger a position resize
        if(this._bIsContainer){
            this._bPositionChanged = true;
        }
        if(this._oParent && this._oParent._bIsContainer){
            this._oParent._bPositionChanged = true;
        }
    }
    
    if(oWebApp){
        oWebApp.objSizeChanged(this);
        oWebApp.notifyLayoutChange(this);
    }else{
        //  Find view or webapp (we always want to start a resize there)
        while(oObj._oParent && !(oObj instanceof df.WebView || oObj instanceof df.WebApp)){
            oObj = oObj._oParent;
        }
        
        if(oObj && oObj.resize){
            oObj.resize();
        }
    }
},

fireSubmit : function(){
    return (this._oParent && this._oParent.fireSubmit && this._oParent.fireSubmit());
},


/* 
Makes sure that the control is visible by going up in the object structure looking for controls 
that can hide the current control (like WebCards / WebTabPages).

@private
*/
makeVisible : function(){
    var oControl = this;
    
    while(oControl){
        if(oControl instanceof df.WebCard){
            oControl.show();
        }
        
        oControl = oControl._oParent;
    }
}

});