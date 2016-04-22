/*
Class:
    df.WebView
Extends:
    df.WebWindow

This class represents a view within in Visual DataFlex Web Application. It inherits from WebWindow 
but it doesn't have the be a floating window. This inheritance structure is chosen because of the 
WebModalDialog class that inherits from WebView and the possible future support of MDI.

The WebView is managed by the df.WebApp class which maintains a set of views. It has support for 
handling a DDO structure and is a scope in the synchronized properties system. This means that only 
synchronized properties from the current view and optionally its invoking view will be synchronized 
within a single call.
    
Revision:
    2011/07/11  (HW, DAW) 
        Initial version.
*/
df.WebView = function WebView(sName, oParent){
    df.WebView.base.constructor.call(this, sName, oParent);
    
    //  Web Properties
    this.prop(df.tBool, "pbFillHeight", false);
    
    //  Events
    this.event("OnSubmit", df.cCallModeWait);
    this.event("OnShow", df.cCallModeWait);
    this.event("OnHide", df.cCallModeDefault); // Note that OnHide must be a default call because it is usually followed by an OnShow that should not be cancelled
    this.event("OnResizeWindow", df.cCallModeDefault);
    
    //  Set action modes
    this.setActionMode("HandleDeleteKey", df.cCallModeWait);
    this.setActionMode("HandleSaveKey", df.cCallModeWait);
    
    //  @privates
    this._bFireOnResize = false;
    
    this._oCurrentObj = null;               // The (last) object inside the view that currently had / has the focus
    
    //  Configure parents
    this.pbScroll = true;
    this._sControlClass = "WebView";
};
df.defineClass("df.WebView", "df.WebWindow",{

_show : function(eRenderTo){
    var oWebApp = this.getWebApp();

    this.fire("OnShow");
    if(this._bFireOnResize){
        this.fire("OnResizeWindow", [ oWebApp.get_piWindowWidth(), oWebApp.get_piWindowHeight() ]);
    }
    
    df.WebView.base._show.call(this,eRenderTo);
},

_hide : function(bNoServerEvents){
    if(this._bRendered && !bNoServerEvents){
        this.fire("OnHide", []);
    }
    
    df.WebView.base._hide.call(this, bNoServerEvents);
},

show : function(){
    if(this._bStandalone){
        this._show();
    }else{
        this.getWebApp().showView(this._sName, false);
    }
},

hide : function(){
    if(this._bStandalone){
        this._hide(false);
    }else{
        this.getWebApp().hideView(this._sName);
    }
},

/* 
@client-action

Called by the server from the new drill-down system when navigating up multiple levels. In that case 
the view being navigated too (this view) is not in sync and an extra round trip is needed to finish 
that operation. Note that we are relying on oWebApp._oCurrentWindow to be pointing to the top view 
of the view stack so that it is automatically being synchronized as well.

@param  bCancel     Is it a cancel operation or not (passed back to the server).
@param  bCallback   Is there are callback object (passed back to the server).
@param  sCallback   Name of the callback object (passed back to the server).
@private
*/
navigateBackToHere : function(bCancel, bCallback, sCallback){
    this.serverAction("NavigateBackToHere_Callback", [ bCancel, bCallback, sCallback ], this._tActionData);
},


/* 
Augment destroy to remove view from the view array and to clear its DDO data kept by the WebApp 
object.

@private
*/
destroy : function(){
    var i, oWebApp = this.getWebApp();
    
    if(oWebApp){
        //  Remove from views array
        i = oWebApp._aViews.indexOf(this);
        if(i >= 0){
            oWebApp._aViews.splice(i, 1);
        }
        
        //  Clear DDO data
        if(oWebApp._oDDODataStore[this._sName]){
            delete oWebApp._oDDODataStore[this._sName];
        }
    }
    
    df.WebView.base.destroy.call(this);
},

/*
This method implements the action method that is called from the server. It will close the view.
*/
closePanel : function(){
    this.close();
},

/*
Override the resize method and only forward the call if we are actually rendered.
*/
resize : function(){
    if(this._bRendered){
        df.WebView.base.resize.call(this);
    }
},

/*
This method handles the keypress event of the window. It will initiate actions that belong to the pressed key if needed.

@param  oEvent  The event object with event details.
@private
*/
onKey : function(oEvent){
    if(oEvent.matchKey(df.settings.formKeys.submit)){ 
        if(this.fire('OnSubmit')){
            oEvent.stop();
        }
    }else{
        df.WebView.base.onKey.call(this, oEvent);
    }
},

fireSubmit : function(){
    return this.fire('OnSubmit');
},

set_pbFillHeight : function(bVal){
    this.pbFillHeight = bVal;
    this.sizeChanged();
},

/* 
Determines the invoking view based on the psInvokingView web property. It makes sure that the object 
exists and is a valid view.

@return Reference to the invoking view object (null if not set / available).
*/
getInvoking : function(){
    var oWebApp;
    
    if(this.psInvokingView){
        oWebApp = this.getWebApp();
        
        if(oWebApp[this.psInvokingView] instanceof df.WebView){
            return oWebApp[this.psInvokingView];
        }
    }
    return null;
},


windowResize : function(iBrowserWidth, iBrowserHeight){
    if(this._bRendered){
        this.fire("OnResizeWindow", [ iBrowserWidth, iBrowserHeight ], function(){ 
            this.centerWindow();
        });
    }else{
        this._bFireOnResize = true;
    }
    
    df.WebView.base.windowResize.apply(this, arguments);
},

/* 
Called by WebBaseUIObject whenever an object receives the focus. The view remembers this object so 
that returnFocus can return the focus to the right object.

@param  oObj    The object that now has the focus.
@private
*/
objFocus : function(oObj){
    this._oCurrentObj = oObj;
},

/* 
Returns the focus to this view, to the last object that had the focus. This method is called by 
WebWindow when a modal window is closed and this is the invoking view.

@private
*/
returnFocus : function(){
    if(this._oCurrentObj){
        this._oCurrentObj.conditionalFocus();
    }else{
        this.conditionalFocus();
    }
}


});