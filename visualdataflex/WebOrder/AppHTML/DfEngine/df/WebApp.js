/*
Class:
    df.WebApp
Extends:
    df.WebBaseContainer

This class is the main class of the DataFlex Engine that has the logic for loading application 
definitions of the server and creation of the Web Objects. An instance of this class should be 
created for every application within the page. It will act as the main API to initialize and render 
web applications and views. A lot of global logic like error handling and server actions are 
implemented in this class.

It inherits from df.WebBaseContainer because it can contain and manage visual controls (panels and 
mainly views). Views are a special case when rendering since they render to the center panel area by 
default.

@code
var oWebApp = new df.WebApp("WebService.wso");

oWebApp.displayApp("#viewport");
@code
The example above shows how to create a webapp object that will communicate with the 
'WebService.wso' web-service and it will render to the '#viewport' element within the page. This 
renders the entire webapp including global panels en menu's.

@code
var oWebApp = new df.WebApp("WebService.wso");

oWebApp.displayView("oOrderView", "#viewport");
@code
The example above shows how to create a webapp object but only render a single view.
    
Revision:
    2011/06/26  (HW, DAW) 
        Initial version.
*/
df.WebApp = function WebApp(sOptWebService){
    df.WebApp.base.constructor.call(this, "oWebApp", null);
    
    //  Local properties
    this.psWebService = sOptWebService || "WebServiceDispatcher.wso";
    this.pbXHRWithCredentials = false;

    //  Server properties
    this.prop(df.tString, "psTheme", (typeof(sDfPreloadTheme) === "string" && sDfPreloadTheme) || "Df_Web_Creme");
    this.prop(df.tString, "psVersionID", "");
    
    //  Localization properties
    this.prop(df.tString, "psDecimalSeparator", ",");
    this.prop(df.tString, "psThousandsSeparator", ".");
    this.prop(df.tString, "psDateFormat", "dd/mm/yyyy");
    this.prop(df.tString, "psDateSeparator", "-");
    this.prop(df.tString, "psDateTimeFormat", "dd/mm/yyyy hh:mm:ss");
    this.prop(df.tString, "psTimeSeparator", ":");
    this.prop(df.tString, "psCurrencySymbol", "&euro;");
    this.prop(df.tInt, "peAlignView", df.ciAlignCenter);

    //  Client Details
    this.prop(df.tInt, "piScreenWidth", screen.width);
    this.prop(df.tInt, "piScreenHeight", screen.height);
    
    this.prop(df.tInt, "piWindowWidth", 0);
    this.prop(df.tInt, "piWindowHeight", 0);
    
    this.prop(df.tInt, "peMode", 0);
    this.prop(df.tBool, "pbResponsive", true);
    this.prop(df.tBool, "pbIsMobile", true);
    
    this.event("OnOrientationChange", df.cCallModeWait);
    this.event("OnResizeWindow", df.cCallModeDefault);
    
    //  Client-side Events
    this.OnError = new df.events.JSHandler();
    this.OnShowProgress = new df.events.JSHandler();
    this.OnShowWindow = new df.events.JSHandler();
    this.OnHideWindow = new df.events.JSHandler();
    this.OnHideProgress = new df.events.JSHandler();
    
    // @privates
    this._oPreLoaded = {};          //  Administration of views that are preloaded. Will be filled with arrays of queued actions.
    
    this._oModeControl = new df.MobRuleController(this);    //  Controller for the mobile modes (web property rules)
    this._oMenuHub = null;                                  //  Hub for menu groups (created on first usage)
    
    // this.pbMDI = false;
    
    this._aSyncPropCache = [];      //  Cache of synchronized property values for objects that aren't loaded yet
    this._aAdvSyncPropCache = [];   //  Cache of advanced synchronized properties for objects that aren't loaded yet
    this._oDDODataStore = { };      //  Global store of DDO states
    this._oWODefStore = { };        //  Store view definitions so we can reset them later in the process
    this._oLoadViewActStore = { };  //  Store of actions executed during the view load so we can use them to reinitialize the view
    
    this._oCurrentWindow = null;
    this._oCurrentView = null;
    this._oCurrentObj = null;
    this._aViews = [];
    this._aFocussed = [];
    
    this._bReady = false;           
    this._aLoadQueue = [];          //  Queue of functions to be called after initialization
    this._oLoadViewQueue = {};      //  Queue of functions to be called when a view is loaded
    this._aPreLoadViewActions = [];     //  Array with queued actions performed on a view that isn't loaded yet 
    this._bInitStarted = false;     //  Indicate used by the ready function to see if initialize was already called
    
    
    this._bCallTimeout = false;     //  Determines if server actions are delayed with a timeout (usually true after initialization)
    this._oPendingCall = null;      //  Call waiting to be sent
    this._oSendingCall = null;      //  Call currently being sent / processed
    
    this._eLocked = -1;
    this._aLockwaiters = [];
    
    this._eStyleSystem = null;
    this._eStyleTheme = null;
    this._eStyleApplication = null;
    this._sRootPath = df.psRootPath;
    
    this._oTranslations = {};
    
    this._aModalQueue = [];         //  Queue of modal dialogs waiting for previous one to close
    
    this._tResizeTimer = null;      //  Timeout set to queue a resize
    this._bSizeChanged = false;     //  Switch indicating that a resize is needed after processing the call.
    this._bContainerStretch = false;    //  Switch that determines if the webapp should stretch to fill its container or if it should determine its own size
    
    
    //  Configure super classes
    this._bWrapDiv = true;
    this._sControlClass = "WebApp";
    this._bPanels = true;
    
    this._eViewPort = null;
    
    this.addSync("peMode");
    this.addSync("pbIsMobile");
    this.addSync("piScreenWidth");
    this.addSync("piScreenHeight");
    this.addSync("piWindowWidth");
    this.addSync("piWindowHeight");
    
    this.setActionMode("loadView", df.cCallModeWait);
    
    this.ready(this.attachGlobalHandlers);
};
df.defineClass("df.WebApp", "df.WebBaseContainer", {

/* 
Called after the initial web property values are set and performs non UI related initialization.

@private
*/
create : function(){
    df.WebApp.base.create.apply(this, arguments);
    
    //  Activate / deactivate the responsive system
    this.set_pbResponsive(this.pbResponsive);
},

//  - - - - - - - - - Rendering - - - - - - - - -

placePanels : function(){
    df.WebApp.base.placePanels.call(this);
    
    if(!this._eViewRegion){
        this._eViewRegion = df.dom.create('<div class="WebApp_ViewRegion" style="position: absolute; left: 0px; right: 0px; top: 0px; bottom: 0px"></div>');
    }
    this._eRegionCenter = this._eViewRegion;
    
    //  Make sure that we insert the viewregion before the clear div created by WebBaseContainer
    this._eMainArea.insertBefore(this._eRegionCenter, this._eMainArea.lastChild);
},

attachGlobalHandlers : function(){
    df.events.addDomListener("resize", window, this.onWindowResize, this);
    df.events.addDomListener("scroll", window, this.onScroll, this);
    df.events.addDomListener("orientationchange", window, this.onOrientationChange, this);
    
    //  Update screen height and width as some browsers now that browsers are further initialized
    this.piScreenHeight = screen.height;
    this.piScreenWidth = screen.width;
},

/* 
Augment destroy to destroy the mode controller object and remove global event handlers.

@private
*/
destroy : function(){
    df.events.removeDomListener("resize", window, this.onWindowResize, this);
    df.events.removeDomListener("scroll", window, this.onScroll, this);
    df.events.removeDomListener("orientationchange", window, this.onOrientationChange, this);

    df.WebApp.base.destroy.call(this);
    
    if(this._oModeControl){
        this._oModeControl.destroy();
        this._oModeControl = null;
    }
    
},

/*
Child objects register themselves at their parents. Views are not considered to be regular children.

@private
*/
addChild : function(oChild){
    //  Filter out child components since they are not considered regular children
    if(!(oChild instanceof df.WebView)){
        if(oChild.peRegion === df.ciRegionCenter){
            throw new df.Error(999, "The 'oWebApp' object should not have panels set to the center region, this space is reserved for the WebView.", this, [oChild.getLongName()]);
        }
        
        df.WebApp.base.addChild.call(this, oChild);
    }else{
        this._aViews.push(oChild);
    }
},

/* 
Augment the updateEnabled function to notify views of the change in enabled state as well.
*/
updateEnabled : function(){
    var i;
    
    df.WebApp.base.updateEnabled.call(this);
    
    for(i = 0; i < this._aViews.length; i++){
        if(this._aViews[i] instanceof df.WebBaseUIObject){
            this._aViews[i].updateEnabled();
        }
    }
},

//  - - - - - - - - - Initialization - - - - - - - - -

/*
This method initializes the webapp by making the LoadWebApp call to the server. This will return the 
definition of the global objects including the webapp itself and the session key. Optionally there 
can be a startup view returned. After this call is returned the proper CSS is included and we wait 
for the DOM and the CSS to become finished. Finally the waiting handlers are called (usually 
displayView or displayApp). 

@private
*/
initialize : function(bLoadDefault){
    this._bInitStarted = true;
    
    try{
        if(this.checkBrowser()){
            this.serverAction("LoadWebApp", [ df.fromBool(!!bLoadDefault) ], null, function(oEvent){
                //  Make sure the proper CSS is included
                this.updateCSS(false);
                
                //  Check if DOM is ready
                df.dom.ready(function(){
                    //  Check is CSS is ready
                    this.testCSS(function(){
                        var i;
                        
                        this._bCallTimeout = true;
                        
                        try{
                            //  Do version check
                            this.checkVersion();
                                                
                            //  Mark ready
                            this._bReady = true;
                            
                            //  Call waiters
                            for(i = 0; i < this._aLoadQueue.length; i++){
                                this._aLoadQueue[i].fHandler.call(this._aLoadQueue[i].oEnv || this);
                            }
                        }catch(oErr){
                            this.handleError(oErr);
                        }
                    });
                }, this);
            });
        }
    }catch(oErr){
        this.handleError(oErr);
    }
},

checkBrowser : function(){
    if(df.sys.isIE && df.sys.iVersion < 8){
        alert("Unfortunately the browser you are using is not supported by this framework. Please upgrade to a more modern browser.\n\r\n\rThe minimal version required is Internet Explorer 8. We advise to use the latest version of Google Chrome or Mozilla FireFox.");
        return false;
    }   

    return true;
},

checkVersion : function(){
    var aPartsServer, aPartsClient, i;

    if(this.psVersionID !== df.psVersionId){
        aPartsServer = (this.psVersionID || "").split(".");
        aPartsClient = (df.psVersionId || "").split(".");
        
        if(aPartsServer.length === aPartsClient.length){
            for(i = 0; i < aPartsServer.length; i++){
                if(parseInt(aPartsServer[i], 10) < parseInt(aPartsClient[i], 10)){
                    this.handleError(new df.Error(999, "The server application ('{{1}}') is running an older version than the javascript-engine ('{{0}}'). Consider recompiling the server application.", this, [ df.psVersionId, this.psVersionID ]));
                    return false;
                }
                
                if(parseInt(aPartsServer[i], 10) > parseInt(aPartsClient[i], 10)){
                    this.handleError(new df.Error(999, "The server application ('{{1}}') is running a newer version than the javascript-engine ('{{0}}'). This might be a caching issue, consider clearing your browser cache.", this, [ df.psVersionId, this.psVersionID ]));
                    return false;
                }
                
            }
        }else{
            throw new df.Error(999, "There is a version number mismatch between the javascript-engine ('{{0}}') and the server application ('{{1}}') version numbers.", this, [ df.psVersionId, this.psVersionID ]);
        }
    }
    
    return true;
},

/*
The method passed to this function will be called when the webapp is initialized. Initialization is 
an asynchronous process which requires other functionality to wait. Optionally the name of a view 
can be passed when waiting for a specific view to be synchronized.

The example below waits for the webapp to be synchronized before manipulating global objects.
@code
oWebApp.ready(function(){
    oWebApp.oCommandbar.oMenuBar.oDemoMenu.set("pbRender", false);
});
@code

The example below waits for the oWebCustomer view to be initialized before manipulating objects 
inside the view.
@code
oWebApp.ready("oWebCustomer", function(){
    oWebApp.oWebCustomer.oTabContainer.oBalancesTabPage.set('pbRender', false);
});
@code

@param  sOptView    (optional) Objects name of the view to wait for.
@param  fHandler    Function that needs to be called when ready.
@param  sOptEnv     (optional) Environment object when the handler is called.
*/
ready : function(sView, fHandler, oOptEnv){
    if(typeof(sView) === "string"){
        this.ready(function(){
            if(this[sView] instanceof df.WebView){
                fHandler.call(oOptEnv || this);
            }else{
                if(!this._oLoadViewQueue[sView]){
                    this._oLoadViewQueue[sView] = {
                        aWaiters : [],
                        bLoading : false
                    };
                }
                this._oLoadViewQueue[sView].aWaiters.push({
                    fHandler : fHandler,
                    oEnv : oOptEnv
                });
            }        
        });
    }else{
        oOptEnv = fHandler;
        fHandler = sView;
        
        
        if(!this._bReady){
            this._aLoadQueue.push({
                fHandler : fHandler,
                oEnv : oOptEnv
            });
        }else{
            fHandler.call(oOptEnv || this);
        }
    }
},

/*
This method should be called to render the application. It will render the application as soon as 
the initialization finished to the passed DOM element. The DOM element can be passed as an object 
reference or as a query selector string (like '#viewport'). Using a query selector string allows to 
call this method before the DOM is initialized. The application will render itself inside the 
provided DOM element. 

@code
var oWebApp = new df.WebApp('WebService.wso');
oWebApp.displayApp('#viewport');

...

<div id="viewport"></div>
@code

@param  oRenderTo   The DOM element to render to (object reference or query selector string).
*/
displayApp : function(oRenderTo){
    
    if(!this._bInitStarted){
        this.initialize(true);
    }
    
    this.ready(function(){
        var eContent, eRenderTo;
        
        try{
            //  Get reference to element
            if(typeof(oRenderTo) === "string"){
                eRenderTo = df.dom.query(document.body, oRenderTo);
            }else{
                eRenderTo = oRenderTo;
            }
            if(!eRenderTo){
                throw new df.Error(999, "No proper element passed", this);
            }
            
            //  Determine if the renderto element has a defined height
            this._bContainerStretch = !df.sys.gui.isSizedByContent(eRenderTo);
            
            //  Start rendering the application
            this._eViewPort = eContent = this.render();
            this.afterRender();
            eContent.style.visibility = "hidden";
            eRenderTo.appendChild(eContent);
            this.afterShow();
            this.resize();
            eContent.style.visibility = "";
        }catch(oErr){
            this.handleError(oErr);
        }
    });
},

/*
This method should be called to render a single view of the application. It will make sure that the 
view is or gets loaded and render it to the passed DOM element. The DOM element can be passed as 
object reference or as a query selector string (like '#viewport'). This method should only be used 
when rendering a view separate of the rest of the application. The view will render itself inside 
the provided DOM element. This is the adviced method to integrate a single view inside an existing 
web page. To show a view within the rendered application please use the showView method.

@code
var oWebApp = new df.WebApp('WebService.wso');
oWebApp.displayView('oCustomerView', '#customerdiv');

...

<div id="customerdiv"></div>
@code

@param  sView       Name of the view.
@param  oRenderTo   DOM element to render to (object reference or query selector string).
*/
displayView : function(sView, oRenderTo){
    if(!this._bInitStarted){
        this.initialize(false);
    }
    
    this.ready(function(){
        var eRenderTo;
        
        try{
            //  Get reference to element
            if(typeof(oRenderTo) === "string"){
                eRenderTo = df.dom.query(document.body, oRenderTo);
            }else{
                eRenderTo = oRenderTo;
            }
            if(!eRenderTo){
                throw new df.Error(999, "No proper element passed", this);
            }
            
            //  Create a viewport if we didn't have one already
            // if(!this._eViewPort){
                // eRenderTo = this._eViewPort = this.renderViewPort(eRenderTo);
            // }
            
            //  Check if view is already loaded loaded (might be the default view)
            if(this[sView] && this[sView] instanceof df.WebView){
                this.renderView(this[sView], eRenderTo, true);
            }else{
                this.loadView(sView, false, null, function(){
                    this.renderView(this[sView], eRenderTo, true);
                    this.sizeChanged();
                });
            }
            
        }catch(oErr){
            this.handleError(oErr);
        }
    });
},

//  - - - - - - - - - View logic - - - - - - - - - - -

/*
This method renders a view onto the provided element. It is called by the several different ways to 
display a view.

@param  oView           The view object.
@param  eRenderTo       The DOM element to render the view into.
@param  bOptNoOnShow    If true the OnShow event won't be fired to the server separately.
@private
*/
renderView : function(oView, eRenderTo){
    if(!oView._bRendered){
        // df.timeStart("renderView", "Start rendering!");
    
        if(oView instanceof df.WebModalDialog){
            //  For a dialog the current view becomes the invoker
            oView.psInvokingView = (this._oCurrentWindow && this._oCurrentWindow._sName) || "";
            if(oView.psInvokingView){
                oView.addSync("psInvokingView");
            }
        }
        
        //  Make sure to clear psPreLoadView as it is now certainly loaded
        if(this.psPreLoadView === oView._sName){
            this.psPreLoadView = "";
            this.unSync("psPreLoadView");
        }
        
        oView._show(eRenderTo);
        this.sizeChanged(); // Make sure a second resize gets triggered after timeout
        
        // df.timeStop("renderView", "Finish rendering!");
    }
},

/*
This method shows a view or a dialog. It starts by making sure if the dialog is loaded and then it 
will render the view. It will hide the currently visible view if needed. The view is shown within 
the application. To render a view separately the displayView method should be used.

@param  sName       The object name of the view (case sensitive).
@param  bPreLoaded  Should only be sent as true if the view has been initialized already. Used by 
                    the server for the pbOverrideStateOnShow logic.

@client-action
*/
showView : (function(){
    var aShowQueue = [];
    
    function _showView(sName, bPreLoaded){
        bPreLoaded = df.toBool(bPreLoaded); //  Parse because client action parameters are passed as string
        aShowQueue.push(sName);
        
        
        function doShow(){
            var oView;
            
            if(aShowQueue[0] === sName){
                while(aShowQueue.length > 0 && this[aShowQueue[0]] && this[aShowQueue[0]] instanceof df.WebView){
                    oView = this[aShowQueue[0]];
                    
                    if(oView instanceof df.WebModalDialog){
                    
                        //  Modal dialogs are queued using the 'modal queue' to prevent them from showing on top of errors or info boxes displayed before the dialog.
                        this.queueModal(function(){
                            this.renderView(oView, this._eRegionCenter);
                        }, this);
                    }else{
                        this.hideView(this._oCurrentView, (oView === this._oCurrentView));
                        
                        this.renderView(oView, this._eRegionCenter);
                        this._oCurrentView = oView;
                    }
                    this._oCurrentWindow = oView;
                    
                    aShowQueue.shift();
                }
            }
        }
        
        //  If pbOverrideStateOnShow is true (bPreLoaded) and the view is not initialized but we have the definition we recreate it using the definition
        if(bPreLoaded && this._oWODefStore[sName] && !this[sName]){
            this.reinitializeView(sName);
        }
        
        //  If it is already loaded we can use it, else we have to call loadView to load it
        if(this[sName] && this[sName] instanceof df.WebView){
            this.ready(function(){
                doShow.call(this);
            });
        }else{
            this.loadView(sName, bPreLoaded, ((this._oCurrentWindow && this._oCurrentWindow._sName) || ""), doShow);
        }
    }
    return _showView;
}()),

/* 
Called when client actions come in with eType set to df.ctExecViewLoad which means that they are 
part of the view loading process and need to be stored so they can be used during the view 
loading process. We store them per view under this._oLoadViewActStore.

@param  tAct    Client action struct / object.
@private
*/
storeViewLoadAction : function(tAct){
    var iPos, sView;
    
    //  Determine view name
    iPos = tAct.sTarget.indexOf(".");
    if(iPos >= 0){
        sView = tAct.sTarget.substr(0, iPos);
    }else{
        sView = tAct.sTarget;
    }
    
    //  Store action
    if(sView){
        if(!this._oLoadViewActStore[sView]){
            this._oLoadViewActStore[sView] = [];
        }
        this._oLoadViewActStore[sView].push(tAct);
    }
},

/* 
Reinitializes a view based on the stored view definition. This happens when a view is overridden 
using pbOverrideStateOnShow. It also applies cached synchronized properties (set on the server when 
the view is shown a second time). And it executes client actions that where executed when the view 
was initially loaded.

@param sName    Name of the view.
@private
*/
reinitializeView : function(sName){
    var i, aActs, aSyncP = [], aAdvSyncP = [];
    
    //  Rebuild Web Objects based on definitions
    this.initJSON(this._oWODefStore[sName]);
    
    
    //  Apply synchronized properties that already in the cache
    this.getCachedSyncProps(sName, aSyncP, aAdvSyncP);
    this.handleSyncProps(aSyncP);
    this.handleAdvSyncProps(aAdvSyncP);
    
    //  See if we have any client actions stored that should be executed during initialization
    if(this._oLoadViewActStore[sName]){
        aActs = this._oLoadViewActStore[sName];
        
        //  Call the action methods
        for(i = 0; i < aActs.length; i++){
            this.execClientAction(aActs[i]);
        }
    }
},

/*
This function closes a view or a dialog. That means that it stops rendering the view and with MDI or 
a modal dialog it determines which view will be the new current view.

@param  sView   String with the name of the view.
@param  bOptNoServerEvents  If true no server calls like OnHide will be executed.
@client-action
*/
hideView : function(sView, bOptNoServerEvents){
    var oView, oInvoking;
    
    //  Param can be name or object
    oView = (typeof sView === "string" ? this[sView] : sView);
        
    //  Make sure we are dealing with a view here
    if(oView instanceof df.WebView){
        oInvoking = oView.getInvoking();
        oView._hide(df.toBool(bOptNoServerEvents));

        if(this._oCurrentWindow === oView){
            this._oCurrentWindow = null;
        }
        if(this._oCurrentView === oView){
            this._oCurrentView = null;
        }
        
        if(oView instanceof df.WebModalDialog){
            if(oInvoking){
                this._oCurrentWindow = oInvoking;
            }
        }
    }
},

/*
This method loads a view from the server by making an AJAX Call.

@param  sName       The name of the view.
@param  bPreLoaded  Should only be sent as true if the view has been initialized already. Used by 
                    the server for the pbOverrideStateOnShow logic.
@param  fHandler    Handler method that is called when the view is loaded.
@param  oEnv        (Optional) Object used as context when calling the handler method.
*/
loadView : function(sName, bPreLoaded, sOptInvoker, fHandler, oEnv){
    
    //  Register as preloaded view
    if(bPreLoaded){
        this._oPreLoaded[sName] = [];
    }
    
    this.ready(function(){
        //  Load a view
        if(this[sName] && this[sName] instanceof df.WebView){
            if(fHandler){
                fHandler.call(oEnv || this, this[sName]);
            }
        }else{
            //  Register view loading
            if(!this._oLoadViewQueue[sName]){
                this._oLoadViewQueue[sName] = {
                    aWaiters : [],
                    bLoading : false
                };
            }
            if(this._oLoadViewQueue[sName].bLoading){
                return;
            }
            this._oLoadViewQueue[sName].bLoading = true;
            
            //  Add handler method to waiting queue
            if(fHandler){
                this._oLoadViewQueue[sName].aWaiters.push({
                    fHandler : fHandler,
                    oEnv : oEnv
                });
            }
            
            //  Fire the loadView action
            var oAction = new df.ServerAction();
            oAction.oWO     = this;
            oAction.sAction = "loadView";
            oAction.aParams = [ sName, sOptInvoker || "", df.fromBool(bPreLoaded) ];
            
            oAction.eCallMode = df.cCallModeWait;
    
            oAction.fHandler = function(oEvent){
                var tAct, aWaiters, i, oView = this[sName];
                
                if(df.toBool(oEvent.sReturnValue)){
                
                    try{
                        if(oView instanceof df.WebView){
                            //  If this is a preloaded view this view is already initialized so there can be queued client actions under _oPreLoaded which we need to execute and then clear
                            if(bPreLoaded && this._oPreLoaded[sName]){
                                while(tAct = this._oPreLoaded[sName].shift()){
                                    this.execClientAction(tAct);
                                }
                                delete this._oPreLoaded[sName];
                            }
                        
                        
                            //  Call handlers
                            aWaiters = this._oLoadViewQueue[sName].aWaiters;
                            for(i = 0; i < aWaiters.length; i++){
                                aWaiters[i].fHandler.call(aWaiters[i].oEnv || this, oView);
                            }
                            
                            //  Remove from registration
                            this._oLoadViewQueue[sName] = null;
                        }else{
                            this._oLoadViewQueue[sName].bLoading = false;
                            throw new df.Error(999, "No view definition received for '{{0}}'", this, [sName]);
                            
                        }
                    }catch(oErr){
                        this.handleError(oErr);
                    }
                }
            };
            oAction.oHandlerEnv = this;
            
            oAction.aViews.push(sOptInvoker || null);
            oAction.aViews.push(sName);
            
            this.handleAction(oAction);
        }
    }, this);
},

/* 
@client-action

Called to make sure that a view is being synchronized. It checks if the view is already loaded on 
the client and if so it just performs a server action to the provided callback function. If not it 
calls loadView and then sends a server-action to callback function on the webapp object itself (as 
we can't call server actions on views that are not loaded yet).

@param	sView		Name of the view to be synchronized.
@param	sCallback	Name of the callback procedure.
@private
*/
loadViewCallBack : function(sView, sCallback){
	if(this[sView] && this[sView] instanceof df.WebView){
		this[sView].serverAction(sCallback);
	}else{
		this.loadView(sView, false);
		this.serverAction("LoadViewCallBack_CallBack", [ sView, sCallback ]);
	}
},

/*
This method unloads a view completely by destroying the associated objects. It will make sure that 
the view has to be loaded freshly from the server when it is opened the next time.

@param  sView       The object name of the view to unload.
@param  bDefinition If true then the cached view definition should be removed as well.

@client-action
*/
unloadView : function(sView, bDefinition){
    var oView, i;
    
    bDefinition = df.toBool(bDefinition);
    
    if(this[sView] && this[sView] instanceof df.WebView){
        //  Get reference
        oView = this[sView];
        
        //  Make sure it is hidden
        if(oView._bRendered){
            this.hideView(sView, true);
        }
        
        //  Clear focussed object if inside view
        if(this._oCurrentObj && this._oCurrentObj.getView() === oView){
            this._oCurrentObj = null;
        }
        
        //  Destroy
        oView.destroy();
        
        //  Remove from WebObject children array
        i = this._aChildren.indexOf(oView);
        if(i >= 0){
            this._aChildren.splice(i, 1);
        }
    }        
    
    if(bDefinition && this._oWODefStore[sView]){
        delete this._oWODefStore[sView];
    }
},

//  - - - - - - - - - Window logic - - - - - - - - - - -

/* 
This method is called by WebBaseUIObject to register that it has received the focus. The name of the 
focused object is passed to the server during server actions and is sometimes used to determine 
where to return to the focus to.

@param  oObj    The object that has received the focus.
@private
*/
objFocus : function(oObj){
    var oWin = oObj.getView();
    
    //  Update the current window if this object is inside a window. This is needed when using the displayview api, especially with multiple views
    if(oWin && !oWin._bStandalone){
        this._oCurrentWindow = oWin;
    }
    
    this._oCurrentObj = oObj;
},

/*  
This method is called by WebBaseUIObject to register that an object has lost the focus.

@param  oObj    The object that lost the focus.
@private
*/
objBlur : function(oObj){

},

/* 
This method returns the focus to the object that is known to have focus. The WebMenuItem class uses 
it to return the focus when a menu item is clicked.

@private
*/
returnFocus : function(){
    if(this._oCurrentObj){
        this._oCurrentObj.conditionalFocus();
    }
},

getFocusObjName : function(){
    if(this._oCurrentObj instanceof df.WebBaseUIObject && !this._oCurrentObj._bStandalone){
        return this._oCurrentObj.getLongName();
    }
    return "";
},

set_pbMDI : function(bVal){
    if(this._eRegionCenter){
        this._eRegionCenter.style.position = (bVal ? "relative" : "");
    }
},

notifyScroll : function(oWO){
    this.notifyPosChange(oWO);
},

notifyLayoutChange : function(oWO){
    this.notifyPosChange(oWO);
},

notifyPosChange : function(oWO){
    
},

//  - - - - - - - - - Object creation - - - - - - - - - - -

/*
Method that creates the instances of the JavaScript objects based on the JSON description. It will 
walk through the structure and instantiates all the objects. The resulting objects structure will be 
equal to the nested object structure on the server.

@param  tDef    JSON data objects containing object definitions.
@private
*/
initJSON : function(tDef){
    
    function initObj(tDef, oContext){
        var i, sP, oObj, FConstructor;
        
        //  If no name is given it must be the global webapp object
        if(tDef.sType === "df.WebApp"){
            oObj = this;
        }else{
            //  Check for name conflict
            if(!oContext[tDef.sName]){
                
                //  Find constructor
                FConstructor = this.getConstructor(tDef.sType, tDef);
                if(typeof(FConstructor) === "function"){
                    
                    //  Create new instance
                    oContext[tDef.sName] = oObj = new FConstructor(tDef.sName, oContext);
                }else{
                    throw new df.Error(999, "Could not find class '{{0}}'", this, [tDef.sType]);
                }
            }else{
                throw new df.Error(999, "Naming conflict with child object '{{0}}'", this, [tDef.sName]);
            }
        }
        
        //  Set the published property values
        for(i = 0; i < tDef.aProps.length; i++){
            sP = tDef.aProps[i].sN;
            
            //  Check naming convention
            if(sP.charAt(0) !== "_"){
                //  Check if not conficting with child object or function
                if(!oObj[sP] || (typeof(oObj[sP]) !== "object" && typeof(oObj[sP]) !== "function")){
                    oObj._set(sP, tDef.aProps[i].sV, false, false);
                }else{
                    throw new df.Error(999, "Naming conflict with property '{{0}}' of object '{{1}}'", this, [ sP,  tDef.sName ] );
                }
            }else{
                throw new df.Error(999, "Published property '{{0}}' of object '{{1}}' properties should not start with an '_'", this, [tDef.aProps[i].sV, tDef.sName ]);
            }
        }
        
        //  Set the advanced typed published property values
        if(tDef.aAdvP){
            for(i = 0; i < tDef.aAdvP.length; i++){
                sP = tDef.aAdvP[i].sN;
                        
                //  Check naming convention
                if(sP.charAt(0) !== "_"){
                    if(!oObj[sP] || (typeof(oObj[sP]) !== "object" && typeof(oObj[sP]) !== "function")){
                        //  Make sure to mark it as advanced (this is used to determine this when sending a call
                        if(!oObj._oTypes[sP]){
                            oObj._oTypes[sP] = df.tAdv;
                        }
                        
                        //  Actually set the property value
                        oObj._set(sP, tDef.aAdvP[i].tV, false, false);
                    }else{
                        throw new df.Error(999, "Naming conflict with property '{{0}}' of object '{{1}}'", this, [ sP,  tDef.sName ] );
                    }
                }else{
                    throw new df.Error(999, "Published property '{{0}}' of object '{{1}}' properties should not start with an '_'", this, [tDef.aAdvP[i].sV, tDef.sName ]);
                }
            }
        }
            
        //  Register the object
        this.newWebObject(oObj, oContext, tDef);
        
        //  Call create
        oObj.create(tDef);
        
        //  Create children
        for(i = 0; i < tDef.aObjs.length; i++){
            initObj.call(this, tDef.aObjs[i], oObj);
        }
        
        return oObj;
    }
    
    //  Store the definition (later used to reset a view)
    if(tDef.sName){
        this._oWODefStore[tDef.sName] = tDef;
    }
    
    return initObj.call(this, tDef, this);
},

/*
Called whenever a new Web Object is created. Registers the Web Object with its parent.

@param  oObj    The newly created web object.
@param  oParent The parent of the new web object.
@param  tDef    The JSON definition received from the server.
*/
newWebObject : function(oObj, oParent, tDef){
    //  Register new child control
    if(oParent.addChild && oParent !== oObj){
        oParent.addChild(oObj);
    }
},

getConstructor : function(sType){
    return df.sys.ref.getNestedProp(sType);
},

findObj : function(sName){
    var i, aParts, oObj;
    
    if(sName === ""){
        return this;
    }

    aParts = sName.split(".");

    oObj = this;
    for(i = 0; i < aParts.length && oObj; i++){
        oObj = oObj[aParts[i]];
    }
    
    return (typeof oObj === "object" && oObj) || null;
},


//  - - - - - - - - - Server actions - - - - - - - - - - -

waitForCall : function(fFunc, oEnv){
    var i;
    
    if(this._eLocked >= df.cCallModeDefault){
        for(i = 0; i < this._aLockwaiters.length; i++){
            if(this._aLockwaiters[i].fFunc === fFunc && this._aLockwaiters[i].oEnv === oEnv){
                return;
            }
        }
        
        this._aLockwaiters.push({ fFunc : fFunc, oEnv : oEnv });
    }else{
        fFunc.call(oEnv);
    }
},

/*
This function locks a webapp during a call. It generates the locking mask and optionally generates a 
waiting dialog. Key entry is blocked by intercepting the keydown event at document level. The 
function can be called multiple times without problems and will upgrade the lock with a waiting 
dialog when needed.

@param  bWaitDialog     If true a waiting dialog will be shown.
@param  sWaitMessage    String with message shown in the waiting dialog.
*/
lock : function(eCallMode, sWaitMessage){
    var oDialog, oLabel, that = this;
    
    this._eLocked = eCallMode;
    
    if(document && document.body){  //  Check if the DOM is ready
    
        // Lock the webapp
        if(eCallMode >= df.cCallModeWait){
            if(!this._eLockMask){
                this._eLockMask = df.gui.dragMask();
                this._tLockCursor = setTimeout(function(){
                    if(that._eLockMask){
                        that._eLockMask.style.cursor = "wait";
                    }
                    that._tLockCursor = null;
                }, 140);
            }
            df.events.addDomCaptureListener("keydown", document.body, this.onBlockKey, this);
        }
        
        // Show wait dialog
        if((eCallMode >= df.cCallModeProgress) && !this._bLockWait){
            this._bLockWait = true;
            if(this.OnShowProgress.fire(this, { sMessage : sWaitMessage })){
                
                //  Block the modal queue (due to focus issues)
                this._aModalQueue.push(this._oLockModalBlock = {
                    fFunc : null,
                    bFinished : false,
                    bDisplayed : true
                });
                
                //  Create waiting dialog
                this._oLockDialog = oDialog = new df.WebModalDialog(null, this);
                oDialog.psCaption = "";
                oDialog.pbResizable = false;
                oDialog.pbShowClose = false;
                oDialog.psCSSClass = "WebMsgBox WebMsgBoxProgress";
                
                oLabel = new df.WebLabel(null, oDialog);
                oLabel.psCaption = sWaitMessage || this.getTrans("loading") + "..";
                oLabel.psCSSClass = "WebMsgBoxProgress";
                oDialog.addChild(oLabel);
                
                oDialog.show();
                oDialog._oPrevFocus = null; //  Stop dialog from messing with the focus
            }    
        }
    }
},

/* 
This function unlocks the webapp removing the mask, wait dialog and keydown interception handler. It 
belongs to the lock function. Note that calling lock multiple times doesn�t mean that unlock needs 
to be called multiple times.
*/
unlock : function(){
    var oHandler;
    
    this._eLocked = -1;
    
    //  Unlock the webapp
    if(this._eLockMask){
        this._eLockMask.style.cursor = "";
        this._eLockMask.parentNode.removeChild(this._eLockMask);
        this._eLockMask = null;
        if(this._tLockCursor){
            clearTimeout(this._tLockCursor);
            this._tLockCursor = null;
        }
    }
    if(document && document.body){  //  Check if the DOM is ready
        df.events.removeDomCaptureListener("keydown", document.body, this.onBlockKey);
    }
    
    //  Hide the wait dialog
    if(this._bLockWait){
        this._bLockWait = false;
        
        this.OnHideProgress.fire(this, { });
        
        if(this._oLockDialog){
            this._oLockDialog.hide();
            this._oLockDialog = null;
            
             // Unblock the modal queue
            this._oLockModalBlock.bFinished = true;
            this.processModal();
        }
    }
    
    //  Call functions waiting for call to finish processing
    while(oHandler = this._aLockwaiters.pop()){
        oHandler.fFunc.call(oHandler.oEnv);
    }
},

/* 
Event handler that will cancel the event if the webapp is in locked state. Is used by the lock 
system to intercept key events at the highest level.

@param  oEvent  Event object (df.events.DOMEvent).
@private
*/
onBlockKey : function(oEvent){
    if(this._eLocked >= df.cCallModeWait){
        oEvent.stop();
        return false;
    }
},

/* 
This function initiates the proper handling of an action by creating a call or adding it to an 
existing call. It will lock the application and initiate the server call process.

@param  oAction     Action object (df.ServerAction).
@private
*/
handleAction : function(oAction){
    //  Immediately lock the webapp

    this.lock(oAction.eCallMode, oAction.sProcessMessage);
    
    //  Always add the current view
    oAction.aViews.push(this._oCurrentWindow);
    
    //  Add action to queue (no actions are ignored any more)
    if(this._oPendingCall){
        this._oPendingCall.aActions.push(oAction);
        if(this._oPendingCall.eCallMode < oAction.eCallMode){
            this._oPendingCall.eCallMode =  oAction.eCallMode;
        }
    }else{
        this._oPendingCall = new df.ServerCall();
            
        this._oPendingCall.aActions.push(oAction);
        this._oPendingCall.sFocus = this.getFocusObjName();
        this._oPendingCall.eCallMode = oAction.eCallMode;
    }
    
    //  Process calls
    this.processCall();
},

/*
Cancels an action based on its name of web object. It will remove all matching actions from the 
pending call and from the call that is being sent but didn't start processing yet.

@param  oWO     Web object.
@param  sAction Action name.
@private
*/
cancelAction : function(oWO, sAction){
    var aActions, i;
    
    //  For a pending call we remove the entire action if found and cancel the call if empty
    if(this._oPendingCall){
        aActions = this._oPendingCall.aActions;
        
        for(i = 0; i < aActions.length; i++){
            if(aActions[i].oWO === oWO && aActions[i].sAction === sAction){
                aActions.splice(i, 1);
                i--;
            }
            if(aActions.length === 0){
                this._oPendingCall = null;
                break;
            }
        }
    }
},

/*
Checks if a pending call is available and can be sent. This happens after a short timeout so that 
actions can still be added to the pending call from the current execution flow. This method is 
called after processing a call or when a new action is registered.

@private
*/
processCall : function(){
    var that = this;
    
    function process(){
        try{
            if(that._oPendingCall){
                if(!that._oSendingCall){
                    that.sendCall(that._oPendingCall);
                    that._oPendingCall = null;
                }
            }
        }catch(oErr){
            //  Make sure that we always unlock!!!
            that.unlock();
            that._oPendingCall = null;
            that._oSendingCall = null;
                    
            that.handleError(oErr);
        }
    }
    
    if(this._bCallTimeout){
        setTimeout(process, 10);
    }else{
        process();
    }
},

sendCall : function(oCall){
    var aViews, aActions, oAction, oData, tResponse, i, oRequest;

    //  Register as the call currently being sent
    this._oSendingCall = oCall;
    
    //  Generate request data
    aViews = [];
    aActions = [];
    for(i = 0; i < oCall.aActions.length; i++){
        oAction = oCall.aActions[i];
        
        aActions.push({
            sTarget : oAction.oWO.getLongName(),
            sAction : oAction.sAction,
            aParams : oAction.aParams,
            tData   : oAction.tData
        });
        
        aViews = aViews.concat(oAction.aViews);
    }
    
    //  Assemble request data
    oData = {
        ActionRequest : {
            Header : this.getHeader(aViews, oCall.sFocus),
            aActions : aActions
        }
    };
    
    
    
    function handleCall(oEvent, bSuccess){
        try{
            //  Parse response
            tResponse = oEvent.oSource.getResponseValue();
            
            if(tResponse && tResponse.Header){
                //  Handle header
                this.handleHeader(tResponse.Header);
                            
                //  Call handlers
                if(oCall.aActions.length === tResponse.asReturnValues.length){
                    for(i = 0; i < oCall.aActions.length; i++){
                        oEvent.sReturnValue = tResponse.asReturnValues[i];
                        
                        if(oCall.aActions[i].fHandler){
                            oCall.aActions[i].fHandler.call(oCall.aActions[i].oHandlerEnv || null, oEvent);
                        }
                    }
                }// else{ Error? }
            }
            
            if(this._bSizeChanged){
                this.resize();
            }
        }catch(oErr){
            this.handleError(oErr);
        }finally{
            //  Make sure that we always unlock!!!
            if(!this._oPendingCall){
                this.unlock();
            }
            this._oSendingCall = null;
            
            //  Initiate next call if needed
            this.processCall();
        }
    
    }
    
     //  Create & send the call
    oRequest = new df.ajax.JSONCall("CallAction", oData, this.psWebService, this);
    oRequest.pbWithCredentials = this.pbXHRWithCredentials;
    oRequest.onFinished.addListener(function(oEvent){
        oEvent.bError = false;
        
        handleCall.call(this, oEvent, true);
    }, this);
    
    oRequest.onError.addListener(function(oEvent){
        oEvent.bError = true;
        
        handleCall.call(this, oEvent, false);
    }, this);
    
    oRequest.send(true);

},

/*
This core method of the framework is responsible for generating the header of a call that is sent to 
the server. This header consists of the session key, name of the focused object, DDO definitions per 
view and the set of synchronized properties. It gets a list of views (or a single view) that 
determines which views are involved in the call. For each view it will add the DDO definitions and 
the synchronized properties.  To get the synchronized properties the recursive getSynched method is 
called.

@param  oView       The view(s) that need to be incorporated. Can be an array of views or a single 
                    view. A view can be passed as a string name or an object reference. May contian 
                    duplicates.
@param  sFocus      Name of the currently focussed object.
@private
*/
getHeader : function(oView, sFocus){
    var oDone = {}, tHead, i;
    
    tHead = {
        sFocus : sFocus,
        aDDODefs : [],
        aSyncProps : [],
        aAdvSyncP : []
    };
    
    //  Gather global synchronized properties
    this.getSynced(tHead.aSyncProps, tHead.aAdvSyncP);
    
    function addView(oView){
        var oViewObj, oInvoking, sViewName;
        
        //  Try to find the view object
        if(typeof(oView) === "string"){
            oViewObj = this.findObj(oView);
            sViewName = oView;
        }else{
            oViewObj = oView;
            sViewName = oViewObj._sName;
        }
    
        if(!oDone[sViewName]){
            oDone[sViewName] = true; //  Make sure that we don't add views twice
        
        
            if(oViewObj instanceof df.WebView){
                //  Add invoker view
                oInvoking = oViewObj.getInvoking();
                if(oInvoking){
                    addView.call(this, oInvoking);
                }
                
                //  Get synchonized props
                oViewObj.getSynced(tHead.aSyncProps, tHead.aAdvSyncP);
                
                //  Add DDO details
                if(this._oDDODataStore[sViewName]){
                    tHead.aDDODefs.push(this._oDDODataStore[sViewName]);
                }else{
                    throw new df.Error(999, "View {{0}} doesn't have DDO data yet!", this, [ sViewName ]);
                }
            }else{
                //  This means that the view doesn't exist yet so we load synchronized properties from the cache
                this.getCachedSyncProps(oView, tHead.aSyncProps, tHead.aAdvSyncP);
                
                //  With the pbOverrideStateOnShow property it can be that we are loading a view that already has a DDO state
                if(this._oDDODataStore[sViewName]){
                    tHead.aDDODefs.push(this._oDDODataStore[sViewName]);
                }
            }
        }
    }
    
    if(oView instanceof Array){
        for(i = 0; i < oView.length; i++){
            if(oView[i]){
                addView.call(this, oView[i]);
            }
        }
    }else if(oView){
        addView.call(this, oView);
    }
    
    return tHead;
},

/*
This is one of the most important methods of the framework as it handles the header section received 
back from the server after a call. This header section can contain object definitions of new 
objects, updates synchronized properties, updated DDO definitions, client actions that need to be 
executed and possible errors.

@param  oHeader     The header data.
@private
*/
handleHeader : function(oHeader){
    var i;
    
    //  Execute early client actions
    for(i = 0; i < oHeader.aActions.length; i++){
        if(oHeader.aActions[i].eType === df.ctExecEarly){
            this.execClientAction(oHeader.aActions[i]);
        }
    }
    
    //  Create objects if a definition has returned
    for(i = 0; i < oHeader.aObjectDefs.length; i++){
        this.initJSON(oHeader.aObjectDefs[i]);
    }
    
    //  Process synchronized properties
    this.handleSyncProps(oHeader.aSyncProps);
    this.handleAdvSyncProps(oHeader.aAdvSyncP);
    
    //  Store the DD States received for one or more views
    for(i = 0; i < oHeader.aDDODefs.length; i++){
        this._oDDODataStore[oHeader.aDDODefs[i].sView] = oHeader.aDDODefs[i];
    }

    //  Call the action methods
    for(i = 0; i < oHeader.aActions.length; i++){
        if(oHeader.aActions[i].eType === df.ctExecViewLoad){
            this.storeViewLoadAction(oHeader.aActions[i]);
        }
        
        if(oHeader.aActions[i].eType !== df.ctExecEarly){ 
            this.execClientAction(oHeader.aActions[i]);
        }
    }
},

/* 
Updates web properties based on the set of web property values provided. It expects the web property 
values to be provided in the format they are received from the server.

@param  aProps  Array of web property values.
@private
*/
handleSyncProps : function(aProps){
    var i, oWO, tObj, x;
    
    //  Loop through objects with synced props
    for(i = 0; i < aProps.length; i++){
        tObj = aProps[i];

        //  Find WebObject
        oWO = this.findObj(tObj.sO);
        if(oWO){
            //  Loop through props and set them
            for(x = 0; x < tObj.aP.length; x++){
                oWO._set(tObj.aP[x].sN, tObj.aP[x].sV, true, true);
            }
        
        }else{
            //  We place it in the cache
            this.cacheSyncProps(tObj);
        }
    } 
},

/* 
Updates advanced web properties based on the set of web property values provided. It expects the web 
property values to be provided in the format they are received from the server.

@param  aProps  Array of web property values.
@private
*/
handleAdvSyncProps : function(aAdvSyncP){
    var i, tP, oWO;
    
    //  Store advanced sync props
    for(i = 0; i < aAdvSyncP.length; i++){
        tP = aAdvSyncP[i];
        //  Find WebObject
        oWO = this.findObj(tP.sO);
        
        if(oWO){
            //  Loop through props and set them
            oWO._set(tP.sP, tP.tV, true, true);
        }else{
            //  We place it in the cache
            this.cacheAdvProp(tP);
        }
    }
},

/* 
Executes a single client action based on the passed information.

@param tAct Details of the client-action.
@private
*/
execClientAction : function(tAct){
    //  Find object and function
    var oFunc, oWO = this.findObj(tAct.sTarget), sViewName;
    
    if(oWO){
        oFunc = oWO.findFunc(tAct.sName);
        if(typeof oFunc.fFunc === "function"){
            
            //  Make action data available as property
            oWO._tActionData = tAct.tData;
            
            //  Call client action
            try{
                
                oFunc.fFunc.apply(oFunc.oEnv, tAct.aParams);
            }catch(oErr){
                this.handleError(oErr);
            }
            
            //  Clear action data
            oWO._tActionData = null;
            
        }else{
            throw new df.Error(999, "Action method not found '{{0}}' on object '{{1}}'", this, [ tAct.sName, tAct.sTarget ]);
        }
    }else{
        //  Determine the view name by parsing it out of the full target object
        sViewName = tAct.sTarget;
        if(sViewName.indexOf('.') > 0){
            sViewName = sViewName.substr(0, sViewName.indexOf('.'));
        }
        
        //  Queue client actions performed on a view that is "preloaded" (pbOverrideStateOnShow functionality)
        if(this._oPreLoaded[sViewName]){
            this._oPreLoaded[sViewName].push(tAct);
        }else{
            throw new df.Error(999, "Could not find object '{{0}}'", this, [ tAct.sTarget ]);
        }
    }

},

/*
This method puts new synchronized property values in the cache. This cache has the same structure as 
in which the synchronized properties are sent. If properties where already in the cache it will 
merge them and update to the new value. The cache is allows synchronized properties to be set on 
views before they are loaded. The synchronized loading of views creates a need for this. This method 
is called when synchronized properties are received for objects that don't exist.

@param  tObj    The struct / JSON object representing the synchronized properties.
@private
*/
cacheSyncProps : function(tObj){
    var i, x, y, tCacheObj, bFound;
    
    //  See if we already have this object in cache
    for(i = 0; i < this._aSyncPropCache.length; i++){
        if(this._aSyncPropCache[i].sO === tObj.sO){
            
            //  Now we need to merge the synced props into the existing cache object
            tCacheObj = this._aSyncPropCache[i];
            
            for(x = 0; x < tObj.aP.length; x++){
                bFound = false;
                
                for(y = 0; y < tCacheObj.aP.length && !bFound; y++){
                    if(tCacheObj.aP[y].sN === tObj.aP[x].sN){
                        tCacheObj.aP[y].sV = tObj.aP[x].sV;
                        
                        bFound = true;
                    }                
                }
                if(!bFound){
                    tCacheObj.aP.push(tObj.aP[x]);
                }
            }
        
            return;
        }
    }
    
    //  Else we can simply add the new object
    this._aSyncPropCache.push(tObj);
},

/* 
This method puts a new advanced synchronized property in the cache. This cache has a flat structure 
as in which advanced sync props are sent. If the property is already in the cache it will override 
its value. This cache allows advanced synchronized properties to be set before their view is loaded 
to the client.

@param  tP      The struct / JSON object representing a single synchronized property..
@private
*/
cacheAdvProp : function(tP){
    var i;
    
    for(i = 0; i < this._aAdvSyncPropCache.length; i++){
        if(this._aAdvSyncPropCache[i].sO === tP.sO && this._aAdvSyncPropCache[i].sP === tP.sP){
            this._aAdvSyncPropCache[i].tV = tP.tV;
            return;
        }
    }
    
    this._aAdvSyncPropCache.push(tP);
},

/*
This method gets cached synchronized properties for a specific view. It goes through the cache and 
returns and removes all the synchronized properties for that view. This happens when loading a view 
and the caching of synchronized properties allows developers to WebSet on views before they are on 
the client (the ASynchronized loading creates a need for this).

@param  sView       The object name of the view.
@param  aSyncProps  Reference to the synchronized properties array to which the result is added.
@private
*/
getCachedSyncProps : function(sView, aSyncProps, aAdvSyncP){
    var i, sStart, iLen;
    
    sStart = sView + '.';
    iLen = sStart.length;
    for(i = 0; i < this._aSyncPropCache.length; i++){
        //  Check if part of the view
        if(this._aSyncPropCache[i].sO === sView || this._aSyncPropCache[i].sO.substr(0, iLen) === sStart){
            //  Add to result
            aSyncProps.push(this._aSyncPropCache[i]);
            
            //  Remove from cache
            this._aSyncPropCache.splice(i, 1);
            i--;
        }
    }
    
    for(i = 0; i < this._aAdvSyncPropCache.length; i++){
        //  Check if part of the view
        if(this._aAdvSyncPropCache[i].sO === sView || this._aAdvSyncPropCache[i].sO.substr(0, iLen) === sStart){
            aAdvSyncP.push(this._aAdvSyncPropCache[i]);
            
            //  Remove from cache
            this._aAdvSyncPropCache.splice(i, 1);
            i--;
        }
    }
},


// - - - - - - -  Positioning and styling - - - - - - - - 

position : function(){

},

set_psTheme : function(sVal){
    if(this.psTheme !== sVal){
        //  Remove the old theme from the body element
        if(document.body){
            df.dom.removeClass(document.body, this.psTheme);
        }
    
        this.psTheme = sVal;
        this.updateCSS(true);
    }
},

/* 
Setter for pbResponsive which will activate or deactivate the responsive system. It forwards this 
call to the separate mode controller object.

@param  bVal    The new value.
@private
*/
set_pbResponsive : function(bVal){
    if(this._oModeControl){
        if(bVal){
            this._oModeControl.activate();
        }else{
            this._oModeControl.deactivate();
        }
    }
},

/* 
Setter for the view alignment. The view is aligned during the resize process so just sending a 
resize should do the job after the property is updated.

@param  iVal    The new value.
 */
set_peAlignView : function(iVal){
    this.peAlignView = iVal;

    this.sizeChanged();
},

updateCSS : function(bResize){
    var aStyles, i, eHead, that = this, sV, sTheme = df.sys.string.trim(this.psTheme);
    
    
    if(!this._eStyleSystem || !this._eStyleTheme || !this._eStyleApplication){
        //  Determine version GET parameter
        sV = "?v=" + df.psVersionId;
        if(typeof(sDfBuildNr) === "string" && sDfBuildNr){  //  Add a custom string to the version GET parameter of the URL
            sV += "." + sDfBuildNr;
        }
        
        //  Get references to existing CSS elements
        aStyles = df.dom.query(document, "link", true);
        for(i = 0; i < aStyles.length; i++){
            if(aStyles[i].href.indexOf("DfEngine/system.css") > 0){
                this._eStyleSystem = aStyles[i];
            }
            if(aStyles[i].href.indexOf("CssThemes/") > 0 && aStyles[i].href.indexOf("theme.css") > 0){
                this._eStyleTheme = aStyles[i];
            }
            if(aStyles[i].href.indexOf("CssStyle/application.css") > 0){
                this._eStyleApplication = aStyles[i];
            }
        }
        
        //  Create system CSS include if needed
        if(!this._eStyleSystem){
            this._eStyleSystem = df.dom.createCSSElem(this._sRootPath + "DfEngine/system.css" + sV);
            
            eHead = document.head || document.getElementsByTagName("head")[0];
            if(eHead.firstChild){
                eHead.insertBefore(this._eStyleSystem, eHead.firstChild);
            }else{
                eHead.appendChild(this._eStyleSystem);
            }
        }
        
        //  Create theme CSS include if needed
        if(!this._eStyleTheme){
            this._eStyleTheme = df.dom.createCSSElem(this._sRootPath + "CssThemes/" + sTheme + "/theme.css" + sV);
            df.dom.insertAfter(this._eStyleTheme, this._eStyleSystem);
            // document.body.appendChild(this._eStyleTheme);
        }
        
        //  Create applciation CSS include if needed
        if(!this._eStyleApplication){
            this._eStyleApplication = df.dom.createCSSElem(this._sRootPath + "CssStyle/application.css" + sV);
            df.dom.insertAfter(this._eStyleApplication, this._eStyleTheme);
        }
        
        if(document.body){
            document.body.id = "OWEBAPP";
        }
        
        
        
    }
    
    //  Set theme classname on the body element
    if(document.body){
        df.dom.addClass(document.body, this.psTheme);
    }
    
    //  Update theme path if needed
    if(this._eStyleTheme.href.indexOf(this._sRootPath + "CssThemes/" + sTheme + "/theme.css") < 0){
        this._eStyleTheme.href = this._sRootPath + "CssThemes/" + sTheme + "/theme.css";
    }
    
    //  Call resize method after 'CSS Test' has finished
    if(bResize){
        this.testCSS(function(){
            this.resize();
            
            setTimeout(function(){
				try{
					that.resize();
				}catch(oErr){
					that.handleError(oErr);
				}
            }, 200);
        });
    }
},

testCSS : function(fHandler){
    var eTest, that = this, iCount = 0;
    
    eTest = df.dom.create('<div id="df_load_test" style="position: absolute"></div>');
    document.body.appendChild(eTest);
    
    function check(){
        if((eTest && eTest.clientHeight >= 1) || iCount > 100){
            document.body.removeChild(eTest);
            fHandler.call(that);
        }else{
            setTimeout(check, 20);
            iCount++;
        }
    }
    
    check();
},

/* 
Handles the resize event of the browser window. It triggers the layout systems to recalculate sizes 
and fires the OnResizeWindow and OnOrientationChange events to the server if needed. A small timeout 
is used to reduce the number of times this process is performed as browsers might throw the resize
event very often.

@param  oEvent  Event object (see: df.events.DOMEvent)
@private
*/
onWindowResize : function(oEvent){
    var that = this;
        
    if(this._tResizeTimeout){
        clearTimeout(this._tResizeTimeout);
        this._tResizeTimeout = null;
    }
    
    this._tResizeTimeout = setTimeout(function(){
        try{
            that._tResizeTimeout = null;
            that.resize();
            that.windowResize();
        }catch(oErr){
            that.handleError(oErr);
        }
    }, 50);
    // this.resize();
    
    //  Manually trigger the orientationchange event for internet explorer
    if(this.piScreenHeight === screen.width && this.piScreenWidth === screen.height){
        if(df.sys.isIE){
            this.onOrientationChange(oEvent);
        }
    }
},

/* 
Triggers the OnResizeWindow event and notifies the views that they should trigger this event as 
well.

@private
*/
windowResize : function(){
    var i;
    
     //  Trigger OnResize events (on window and and views)
    this.fire("OnResizeWindow", [ this.get_piWindowWidth(), this.get_piWindowHeight() ]);
    
    for(i = 0; i < this._aViews.length; i++){
        this._aViews[i].windowResize(this.get_piWindowWidth(), this.get_piWindowHeight());
    }
},

onScroll : function(oEvent){
    this.notifyScroll(this);
},

prepareSize : function(){
    var iRes = df.WebApp.base.prepareSize.call(this);
    
    this._bStretch = this._bContainerStretch;
    
    return iRes;
},

/* 
Customized resize procedure that determines the space avialable for the view and then triggers the 
view to resize itself.

@private
*/
resize : function(){
    var iMxVwH, i, oView;
    
    //	Call standard resize procedures
    this.resizeHorizontal();
    this.resizeVertical();
    
    //  Determine viewport size
    if(this._eElem){
        iMxVwH = this._iMiddleHeight - df.sys.gui.getVertBoxDiff(this._eRegionCenter, 0);
    }
        
    for(i = 0; i < this._aViews.length; i++){
        oView = this._aViews[i];
        
        //  Views can be rendered without the webapp, so then we use the _eRenderTo element.
        if(!this._eElem && oView._eRenderTo){
            iMxVwH = oView._eRenderTo.clientHeight - df.sys.gui.getVertBoxDiff(oView._eRenderTo, 2);
        }
        
        
        if(oView._bRendered){
            oView.viewResize(iMxVwH);
        }
    }
     
    this.notifyPosChange(this);
    
    // df.timeStop("resize", "Finished resizing!");
    //  Turn off size change switch
    this._bSizeChanged = false;
},

/* 
Called by WebBaseUIObject to notify that a resize is needed because of a size change within the 
control or container. As this usually occurs from within setters it is not uncommon for this to 
occur multiple times the resize is not performed immediately but when the processing of the current 
call is completed (using the _bSizeChanged switch). Another resize is performed after a small 
timeout as there are still some unexplainable cases where a second resize causes a better result 
than the first.

@param  oSrcWO  The Web Object notifying the size change.
@private
*/
objSizeChanged : function(oSrcWO){
    var that = this;
    
    this._bSizeChanged = true;
    
    if(!this._tResizeTimer){
        that._tResizeTimer = setTimeout(function(){
            try{
                that.resize();
                that._tResizeTimer = null;
            }catch(oErr){
                that.handleError(oErr);
            }
        }, 30);
    }
},

/* 
This method is called from the server when a resize needs to be forced somehow. It uses the 
sizeChanged method which will force a resize after processing the call is finished and sets a timer 
for a delayed resize.

@client-action
*/
forceResize : function(){
    this.sizeChanged(true);
},

/* 
Handles the browsers OrientationChange event and triggers the server event. Note that for Internet 
Explorer this method is called manually.

@param  oEvent  Event object (see: df.events.DOMEvent)
@private
*/
onOrientationChange : function(oEvent){
    var iOrientation;
    
    //  Update screen dimensions (these most likely changed!)
    this.piScreenHeight = screen.height;
    this.piScreenWidth = screen.width;
    
    //  Determine orientation (use own logic if DOM doesn't provide)
    if(typeof window.orientation === "number"){
        iOrientation = window.orientation;
    }else{
        iOrientation = (screen.height > screen.width ? 90 : 0);
    }
    
    //  Fire event to the server
    this.fire("OnOrientationChange", [ iOrientation ]);
    
},


// - - - - - - -  Generic framework functions - - - - - - - - 

/*
This method shows an info box with a message and a title. It tempolary uses the alert but will use 
the WebModalDialog later.

@param  sMessage   The message to display.
@param  sCaption          Text displayed in the title bar.

@client-action
*/
showInfoBox : function(sMessage, sCaption){
    function showInfo(tDetails){
        var that = this, oDialog, oLabel, oCloseBtn, oContentPnl, oButtonPnl, iWindowWidth = this.get_piWindowWidth();
        
        oDialog = new df.WebModalDialog(null, this);
        oDialog.psCaption = sCaption;
        oDialog.piMinWidth = (iWindowWidth > 420 ? 400 : iWindowWidth - 20);
        oDialog.piMinHeight = 80;   // 150;
        oDialog.psCSSClass = "WebMsgBox WebMsgBoxInfo";
        
        oDialog.OnSubmit.addListener(function(oEvent){
            oDialog.hide();
        }, this);
        
        oDialog.OnHide.addListener(function(oEvent){
            tDetails.bFinished = true;
            setTimeout(function(){
				try{
					that.processModal();
				}catch(oErr){
					that.handleError(oErr);
				}
                
                oDialog.destroy();
            }, 20);
            
        }, this);
        
        oContentPnl = new df.WebPanel(null, oDialog);
        oContentPnl.peRegion = df.ciRegionCenter;

        oDialog.addChild(oContentPnl);
        
        oLabel = new df.WebLabel(null, oDialog);
        oLabel.psCaption = sMessage;
        oLabel.psCSSClass = "WebMsgBox_Text";
        oContentPnl.addChild(oLabel);
        
        oButtonPnl = new df.WebPanel(null, oDialog);
        oButtonPnl.peRegion = df.ciRegionBottom;
        oButtonPnl.piColumnCount = 3;
        oButtonPnl.psCSSClass = "WebMsgBoxOneBtn";
        
        oDialog.addChild(oButtonPnl);
        
        oCloseBtn = new df.WebButton(null, oDialog);
        oCloseBtn.psCaption = this.getTrans("ok");
        oCloseBtn.piColumnIndex = 2;
        oCloseBtn.pbShowLabel = false;
        oCloseBtn.OnClick.addListener(function(oEvent){
            oDialog.hide();
        }, this);
        oButtonPnl.addChild(oCloseBtn);
        
        
        oDialog.show();
        
        this.ready(function(){
            oDialog.resize();
            oCloseBtn.focus();
        });
    }
    
    this._aModalQueue.push({
        fFunc : showInfo,
        bFinished : false,
        bDisplayed : false
    });
    
    this.processModal();
},

/*
This method shows a message box with a message, title and a set of buttons. After a button is 
clicked it will fire a server action to the provided object & message to handle the response. It 
receives the message, title and list of buttons from the server. Note that the message box will be 
queued in the alert queue so it will wait for other alerts to be closed before displaying. 

@param  sMessage   The message to display.
@param  sCaption   Text displayed in the title bar.

@client-action
*/
showMessageBox : function(sReturnObj, sReturnMsg, sMessage, sCaption, sLabelCSSClass, iDefaultButton){
    var oReturnObj, aButtons;
    
    //  Search for return object
    oReturnObj = this.findObj(sReturnObj);
    if(!oReturnObj){
        throw new df.Error(999, "Return WebObject not found '{{0}}'", this, [ sReturnObj ]);
    }
    
    //  Get reference to action data specifying the buttons
    aButtons = df.sys.vt.deserialize(this._tActionData, [ df.tString ]);
    if(!aButtons){
        throw new df.Error(999, "No buttons specified", this);
    }
    
    //  Call the real message box function
    this.showMsgBox(sMessage, sCaption, sLabelCSSClass, aButtons, iDefaultButton, function(iBtn, oDialog){
        //  Make sure that the action mode for there return call is at least mode wait
        if(oReturnObj.getActionMode(sReturnMsg) < df.cCallModeWait){
            oReturnObj.setActionMode(sReturnMsg, df.cCallModeWait);
        }
    
        //  Call the return message
        oReturnObj.serverAction(sReturnMsg, [ iBtn ], null, function(){ 
            oDialog.hide();
        });
    });
},

showMsgBox : function(sMessage, sCaption, sLabelCSSClass, aButtons, iDefaultButton, fHandler){
    
    

    function showInfo(tDetails){
        var that = this, oDialog, oLabel, oBtn,  oContentPnl, oButtonPnl, i, oDefaultBtn = null, iWindowWidth = this.get_piWindowWidth();
        
        //  Create dialog with panel
        oDialog = new df.WebModalDialog(null, this);
        oDialog.psCaption = sCaption;
        oDialog.piMinWidth = (iWindowWidth > 500 ? 480 : iWindowWidth - 20);
        oDialog.piMinHeight = 80;    // 150;
        oDialog.pbShowClose = false;
        oDialog.psCSSClass = ("WebMsgBox " + sLabelCSSClass);
        
        oDialog.OnHide.addListener(function(oEvent){
            tDetails.bFinished = true;
            setTimeout(function(){
				try{
					that.processModal();
				}catch(oErr){
					that.handleError(oErr);
				}
                
                oDialog.destroy();
            }, 20);
            
        }, this);
        
        //  Create content panel with message
        oContentPnl = new df.WebPanel(null, oDialog);
        oContentPnl.peRegion = df.ciRegionCenter;

        oDialog.addChild(oContentPnl);
        
        oLabel = new df.WebLabel(null, oDialog);
        oLabel.psCaption = sMessage;
        oLabel.psCSSClass = "WebMsgBox_Text";
        oContentPnl.addChild(oLabel);
        
        //  Create button panel
        oButtonPnl = new df.WebPanel(null, oDialog);
        oButtonPnl.peRegion = df.ciRegionBottom;
        oButtonPnl.piColumnCount = (aButtons.length * 2) + 2;
        
        // Mobile Adjustments....
        if (df.sys.isMobile) {
            if (aButtons.length === 2) {
                // if two buttons let them occupy the entire width of the panel
                oButtonPnl.piColumnCount = (aButtons.length * 2);
            } 
            else if (aButtons.length > 2) {
                oButtonPnl.piColumnCount = 1;
            }
        }
        
        // Set the panel's CSS class if there is only one button
        if (aButtons.length === 1) {
            oButtonPnl.psCSSClass = "WebMsgBoxOneBtn";
        }else if(aButtons.length === 2){
            oButtonPnl.psCSSClass = "WebMsgBoxTwoButtons";
        }else{
            oButtonPnl.psCSSClass = "WebMsgBoxButtons";
        }
        
        oDialog.addChild(oButtonPnl);
        
        //  Handler executed when a button is clicked
        function handleBtnClick(oEvent){
            fHandler.call(this, oEvent.oSource._iConfirmId, oDialog);
        }
        
        //  Generate buttons
        iDefaultButton = parseInt(iDefaultButton, 10);
        
        for(i = 0; i < aButtons.length; i++){
            oBtn = new df.WebButton(null, oDialog);
            oBtn.psCaption = aButtons[i];
            oBtn.piColumnIndex = ((i * 2) + 1);
            oBtn.piColumnSpan = 2;
            oBtn.pbShowLabel = false;
            oBtn._iConfirmId = (i + 1);
            oBtn.OnClick.addListener(handleBtnClick);
            
            // Handle Mobile Adjustments....
            if (df.sys.isMobile) {
                if (aButtons.length === 2) {
                    // if two buttons let them occupy the entire width of the panel
                    oBtn.piColumnIndex = (i * 2);
                } 
                else if (aButtons.length > 2) {
                    oBtn.piColumnIndex = 0;
                    oBtn.piColumnSpan = 0;
                }
            }
            else {
                if (i === 0) {
                    oBtn.psCSSClass = "WebMsgBoxFirstBtn";
                }
                else if (i === (aButtons.length-1)) {
                    oBtn.psCSSClass = "WebMsgBoxLastBtn";
                }
            }

            oButtonPnl.addChild(oBtn);
            
            if(oBtn._iConfirmId === iDefaultButton){
                oDefaultBtn = oBtn;
            }
        }
        
        oDialog.show();
        
        //  Resize and give focus when application is ready
        this.ready(function(){
            oDialog.resize();
            if(oDefaultBtn){
                oDefaultBtn.focus();
            }
        });
            
    }
    
    this._aModalQueue.push({
        fFunc : showInfo,
        bFinished : false,
        bDisplayed : false
    });
    
    this.processModal();
},

/*
This method will process the next item in the modal queue. It starts by removing dialogs marked as 
finished from the queue. Then it will display the next dialog in the queue (if there is one and it 
isn't already displayed). The modal queue contains dialogs that need to be displayed modally. We 
don't want to display them on top of each other and since they are not really modal we will have to 
queue them. In practice the queue contains methods that will display the dialog.
*/
processModal : function(){
    if(this._aModalQueue.length > 0){
        //  Clear finished alerts from the queue
        while(this._aModalQueue[0] && this._aModalQueue[0].bFinished){
            this._aModalQueue.shift();
        }
        
        //  Display next (if needed)
        if(this._aModalQueue.length > 0 && !this._aModalQueue[0].bDisplayed){
            this._aModalQueue[0].bDisplayed = true;
            this._aModalQueue[0].fFunc.call(this, this._aModalQueue[0]);
        }
    }
},

/* 
Used to queue an action in the modal queue. Note that this action won't be blocking the modal queue 
once it is finished. Examples of usage are showView, navigateToPage, navigateRefresh and 
navigateOpenWindow.

@param  fFunc   Function that executes the action.
@param  oEnv    Environment used to execute the function (this).
@private
*/
queueModal : function(fFunc, oEnv){
    this._aModalQueue.push({
        fFunc : function(tDetails){
            fFunc.call(oEnv || null);
            
            //  We don't want to hold up other dialogs in the queue
            tDetails.bFinished = true;
            this.processModal();
        },
        bFinished : false,
        bDisplayed : false
    });
    
    this.processModal();
},

/*
This method writes text to the console of JavaScript debuggers. This can be used for debugging 
purposes. A singleton method df.log is used to do this which adds timing and checks if the console 
is available. 

@param  sText   String with text to show on the console.
@client-action
*/
log : function(sText){
    df.log(sText);
},

/*
This method determines the translation based on a label.

@param  sLbl        The label of the translation.
@param  bOptNull    If true then null is returned if the translation is not found, else it returns
                    the label wrapped by {{ ... }}.
@return The translation.
@private
*/
getTrans : function(sLbl, bOptNull){
    if(this._oTranslations[sLbl]){
        return this._oTranslations[sLbl];
    }
    if(bOptNull){
        return null;
    }
    return "{{" + sLbl + "}}";
},

/*
Initializes the translation system. The translations are delivered as name value pairs and we store 
them as object properties for quick access. Translations for dates are stored globally because they 
are also accessed by some of the global date formatting functions in the system library.

@client-action
@private
*/
initTranslations : function(){
    var aTrans;
    
    aTrans = df.sys.vt.deserialize(this._tActionData, [{ sN : df.tString, sV : df.tString }]);
    
    this.initTrans(aTrans);
},

/* 
Initializes the translation system based on the array of translations.

@param  aTrans  Array of translations [{ sN : "label", sV : "translation" }].
@private
*/
initTrans : function(aTrans){
    var i;
    //  Store tanslations in quick access object
    for(i = 0; i < aTrans.length; i++){
        this._oTranslations[aTrans[i].sN] = aTrans[i].sV;
    }
    
    //  We store the dates globally
    df.lang = {
        monthsLong : [
            this.getTrans("january"),
            this.getTrans("february"),
            this.getTrans("march"),
            this.getTrans("april"),
            this.getTrans("may"),
            this.getTrans("june"),
            this.getTrans("july"),
            this.getTrans("august"),
            this.getTrans("september"),
            this.getTrans("october"),
            this.getTrans("november"),
            this.getTrans("december")
        ],
        monthsShort : [
            this.getTrans("jan"),
            this.getTrans("feb"),
            this.getTrans("mar"),
            this.getTrans("apr"),
            this.getTrans("mayShort"),
            this.getTrans("jun"),
            this.getTrans("jul"),
            this.getTrans("aug"),
            this.getTrans("sep"),
            this.getTrans("oct"),
            this.getTrans("nov"),
            this.getTrans("dec")
        ],
        daysShort : [
            this.getTrans("sun"),
            this.getTrans("mon"),
            this.getTrans("tue"),
            this.getTrans("wed"),
            this.getTrans("thu"),
            this.getTrans("fri"),
            this.getTrans("sat")
        ],
        daysLong : [
            this.getTrans("sunday"),
            this.getTrans("monday"),
            this.getTrans("tuesday"),
            this.getTrans("wednesda"),
            this.getTrans("thursday"),
            this.getTrans("friday"),
            this.getTrans("saturday")
        ]
    };
},

// - - - - - - -  Error handling - - - - - - - - 

showError : function(iErrNum, iErrLine, sErrText, sCaption, bUserError){
    //  Create error object and call default handler function
    this.handleError(new df.Error(
        df.toInt(iErrNum), 
        sErrText,
        this, 
        null,
        null,
        true,
        df.toBool(bUserError), 
        sCaption,
        null,
        df.toInt(iErrLine)
    ));
},


/*
df.Error = function Error(iNumber, sText, bOptUsr, oOptSource, oOptTarget, bOptSrv){
    this.iNumber = iNumber;
    this.sText = sText;
    this.bUserError = !!bOptUsr;
    this.oSource = oOptSource || null;
    this.oTarget = oOptTarget || null;
    this.bServer = !!bOptSrv;
    this.iLine = iOptLine;
    this.sDetailHtml = sOptDetailHtml || null;
}
*/

/*
Handles a single error and displays it in a modal dialog unless it is a JavaScript error which it 
leaves to the JavaScript debuggers. The modal queue is used to make sure that we don't display 
dialogs on top of each other.

@param  oError  The error object.
*/
handleError : function(oError){
    function displayError(tDetails){
        var that = this, oLabel, oDialog, oCloseBtn, oContentPnl, oButtonPnl, aDetails = [], oDetailsBox, sCaption, iWindowWidth = this.get_piWindowWidth();
        
        //  Determine title
        if(!oError.bServer){
            sCaption = oError.sCaption || this.getTrans("error_title_client", true) || "Unhandled Program Error on the client";
        }else{
            sCaption = oError.sCaption || this.getTrans("error_title_server");
        }
            
        
        //  Create dialog
        oDialog = new df.WebModalDialog(null, this);
        oDialog.psCaption = sCaption;
        oDialog.piMinWidth = (iWindowWidth > 520 ? 500 : iWindowWidth - 20);
        oDialog.piMinHeight = (oError.bUserError ? 80 : 180);    // (oError.bUserError ? 150 : 240);
        oDialog.psCSSClass = (oError.bUserError ? "WebMsgBox WebMsgBoxWarning" : "WebMsgBox WebMsgBoxError");
        
        oDialog.OnSubmit.addListener(function(oEvent){
			try{
				oDialog.hide();
			}catch(oErr){
				that.handleError(oErr);
			}
        }, this);
        
        oDialog.OnHide.addListener(function(oEvent){
            tDetails.bFinished = true;
            setTimeout(function(){
                that.processModal();
            }, 20);
        }, this);
        
        oContentPnl = new df.WebPanel(null, oDialog);
        oContentPnl.peRegion = df.ciRegionCenter;

        oDialog.addChild(oContentPnl);
        
        //  Create label
        oLabel = new df.WebLabel(null, oContentPnl);
        oLabel.psCaption = oError.sText;
        oLabel.psCSSClass = "WebMsgBox_Text";
        oContentPnl.addChild(oLabel);
        
        //  Create error details
        if(!oError.bUserError){
            oLabel = new df.WebLabel(null, oContentPnl);
            aDetails.push('Error:', oError.iNumber);
            
            if(oError.bServer){
                if(oError.iLine){
                    aDetails.push('\nLine:', oError.iLine);
                }
            }else{
                if(oError.oSource){
                    if(oError.oSource instanceof df.WebObject){
                        aDetails.push('\nObject:', oError.oSource.getLongName());
                    }
                }
            }   
            oLabel.psCaption = aDetails.join("");
            oContentPnl.addChild(oLabel);
            
            //  Add details field
            if(oError.sDetailHtml){
                oDialog.piMinHeight = 300;
                oDialog.piHeight = 300;
            
                oDetailsBox = new df.WebHtmlBox(null, oContentPnl);
                oDetailsBox.pbFillHeight = true;
                oDetailsBox.pbShowBox = true;
                oDetailsBox.pbScroll = true;
                oDetailsBox.pbShowLabel = false;
                oDetailsBox.psCSSClass = "WebErrorDetails"; 
                oDetailsBox.psHtml = oError.sDetailHtml;
                
                oContentPnl.addChild(oDetailsBox);
            }
        }
        
        
        //  Create buttons
        oButtonPnl = new df.WebPanel(null, oDialog);
        oButtonPnl.peRegion = df.ciRegionBottom;
        oButtonPnl.piColumnCount = 3;
        oButtonPnl.psCSSClass = "WebMsgBoxOneBtn";
        
        oDialog.addChild(oButtonPnl);
        
        oCloseBtn = new df.WebButton(null, oDialog);
        oCloseBtn.psCaption = this.getTrans("ok", true) || "OK";
        oCloseBtn.piColumnIndex = 2;
        oCloseBtn.pbShowLabel = false;
        oCloseBtn.OnClick.addListener(function(oEvent){
            oDialog.hide();
        }, this);
        oButtonPnl.addChild(oCloseBtn);
        
        
        oDialog.show();
        this.ready(function(){
            oDialog.resize();
            oCloseBtn.focus();
        });
            
    }

    //  We only handle our own errors, we throw the others 
    if(oError instanceof df.Error){
       
        //  Fire user event for custom display
        if(this.OnError.fire(this, { oError : oError })){
            //  See if the object has custom error handling (usually DEO's)
            if(oError.oTarget && oError.oTarget.displayError && oError.oTarget.pbRender && oError.oTarget.pbVisible){
                oError.oTarget.displayError(oError.iNumber, oError.sText);
            }else{
                 // Queue a special alert
                this._aModalQueue.push({
                    fFunc : displayError,
                    bFinished : false,
                    bDisplayed : false
                });
                this.processModal();
            } 
        }
    }else{
        throw oError;
    }
},


// - - - - - - -  Generic web functionallity - - - - - - - - 

/* 
Updates the title of the page.

@param  sTitle  The new title for the page.
@client-action
*/
setPageTitle : function(sTitle){
    document.title = sTitle;
},

/*
Lets the browser navigate to a different page. The mode determines if the page is opened in a new 
window / new tab or the current window.

@param  sUrl    The URL to open.
@param  eMode   The mode to upen the URL (df.ciOpenNewWindow, df.ciOpenNewTab or 
                df.ciOpenCurrentWindow).

@client-action
*/
navigateToPage : function(sUrl, eMode){
    this.queueModal(function(){
        var eWin;

        eMode = parseInt(eMode, 10); // Convert from string

        if(eMode === df.ciOpenSameWindow){
            window.location.href = sUrl;
        }else{
            if(eMode === df.ciOpenNewWindow){
                eWin = window.open(sUrl, '_blank_' + df.dom.piDomCounter++, 'width=700, height=500, resizable=yes');
            }else{ // df.ciOpenNewTab
                eWin = window.open(sUrl, '_blank');// +  df.dom.piDomCounter++);
            }
        }
    }, this);
},

/*
Opens a new window that will load the specified URL. Note that popup blockers might block this new window.

@param  sUrl     The URL to open.
@param  iWidth   The width of the window in pixels.
@param  iHeight  The height of the window in pixels.

@client-action
*/
navigateNewWindow : function(sUrl, iWidth, iHeight){
    this.queueModal(function(){
        window.open(sUrl, '_blank_' + df.dom.piDomCounter++, 'width=' + iWidth + ', height=' + iHeight + ', resizable=yes, location=yes');
    });
},

/*
Reloads the current page. This is usually done after a logout.

@client-action
*/
navigateRefresh : function(){
    this.queueModal(function(){
        window.location.reload();
    });
},

/* 
Getter function that reads the current window width.

@return The current window width in (virtual) pixels.
 */
get_piWindowWidth : function(){
    return df.dom.windowWidth();
},

/* 
Getter function that reads the current window height.

@return The current window height in (virtual) pixels.
 */
get_piWindowHeight : function(){
    return df.dom.windowHeight();
},

/* 
Getter function that reads the current mode directly of the mode controller.

@return Current mode in which we are running.
*/
get_peMode : function(){
    if(this._oModeControl){
        return this._oModeControl.peMode;
    }
},

/* 
Getter function that reads the result of the device detection isMobile check.

@return True if this device is detected as a mobile device.
*/
get_pbIsMobile : function(){
    return df.sys.isMobile;
}

});