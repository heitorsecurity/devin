/*
Class:
    df.MobRuleController
Extends:
    Object

This class is the client-side handler of web property rules. While the rules are stored on the 
WebObject itself this class is responsible for enforcing modes and rules. It detects the initial 
mode and listens to the window resize to update the mode when needed. The WebApp class will 
initialize an instance of the class.
    
The web property rules are defined in DataFlex code using the WebSetRule command and send to the 
client as client actions on the WebObject. The WebObject stores them in its oPropRuleStore object so 
that this controller can use them. When a WebObject has rules defined it will register itself on 
this object as mode listener.
    
Revision:
    2014/12/09  (HW, DAW) 
        Initial version.
*/
df.MobRuleController = function(oWebApp){
    this._oWebApp = oWebApp;
    this.peMode = -1;
    this.pbActive = true;
    
    this._aWOs = [];
    
    this._aModes = [
        { eM : df.modeDesktop,         sCSS : "df-ModeDesktop" },          
        { eM : df.modeTablet,          sCSS : "df-ModeTablet" },          
        { eM : df.modeTabletLandscape, sCSS : "df-ModeTabletLandscape" }, 
        { eM : df.modeTabletPortrait,  sCSS : "df-ModeTabletPortrait" },  
        { eM : df.modeMobile,          sCSS : "df-ModeMobile" },
        { eM : df.modeMobileLandscape, sCSS : "df-ModeMobileLandscape " },
        { eM : df.modeMobilePortrait,  sCSS : "df-ModeMobilePortrait" }
    ];
    
    this.init();
};
df.defineClass("df.MobRuleController", {

/* 
Initialize when the DOM is ready.
*/
init : function(){
    this.detectMode();
    
    df.dom.ready(function(){
        df.events.addDomListener("resize", window, this.onWindowResize, this);
        df.events.addDomListener("orientationchange", document, this.onWindowResize, this);
        this.detectMode();
    }, this);
},

/* 
Clear event handlers when destroying the object.

@private
*/
destroy : function(){
    df.events.removeDomListener("resize", window, this.onWindowResize);
    df.events.removeDomListener("orientationchange", document, this.onWindowResize);
},

/* 
Called by the WebObject to register itself as mode listener when it gets its first rule.

@param  oWO     The web object.
*/
regWO : function(oWO){
    this._aWOs.push(oWO);
},

/* 
Unregisters a WebObject as mode listener.

@param  oWO     The web object.
*/
remWO : function(oWO){
    var i = this._aWOs.indexOf(oWO);
    if(i >= 0){
        this._aWOs.splice(i, 1);
    }
},

/* 
Enforces a specific mode.

@param  eMode   The mode constant.
*/
enforceMode : function(eMode){
    var i, oWO, sProp, that = this;
    
    //  Store the mode
    this.peMode = eMode;
    
    //  Update CSS classes on body element
    df.dom.ready(function(){
        var i, eMode = (that.pbActive ? that.peMode : 0);
        for(i = 0; i < that._aModes.length; i++){
            df.dom.toggleClass(document.body, that._aModes[i].sCSS, that._aModes[i].eM <= eMode);
        }
        
        that._oWebApp.sizeChanged();
    });
    
    //  Loop over objects with rules
    for(i = 0; i < this._aWOs.length; i++){
        oWO = this._aWOs[i];
        
        //  Loop over properties with rules of the object
        for(sProp in oWO._oPropRuleStore){
            if(oWO._oPropRuleStore.hasOwnProperty(sProp)){
                this.enforceRule(oWO, sProp);
            }
        }
    }
},

/* 
Enforces a property its rules based on the current mode.

@param  oWO     WebObject.
@param  sProp   Name of the property.
*/
enforceRule : function(oWO, sProp){
    var i, tDet, eMode = (this.pbActive ? this.peMode : 0);
    
    //  Check if mode set
    if(eMode >= 0){
        //  Get property rules
        tDet = oWO._oPropRuleStore[sProp];
        
        //  Only proceed if not synchronized
        if(!oWO._oSynced[sProp]){
        
            //  Store default value
            if(tDet.sDefault === null){
                tDet.sDefault = oWO.get(sProp);
            }
            
            //  Detect which rule to apply (loop over the sorted rules)
            for(i = 0; i < tDet.aRules.length; i++){
                if(tDet.aRules[i].eM <= eMode){
                    oWO._set(sProp, tDet.aRules[i].sV, true, false);
                    tDet.bActive = true;
                    return;
                }
            }
            
            //  If a rule was applied but the current mode doesn't apply a specific rule we reset the original rule.
            if(tDet.bActive){
                oWO.set(sProp, tDet.sDefault, true);
                tDet.bActive = false;
            }
        }
    }
},

/* 
Standard mode detect (works purely on screen size). Will update the mode if it actually changed.
*/
detectMode : function(){
    var eMode = df.modeDesktop, iWidth, iHeight, iTemp, bLandscape;
    
    df.sys.detectDevice();
    if(df.sys.isMobile){
        iWidth = screen.width;
        iHeight = screen.height;
        
        if(window.matchMedia){
            //  As on android the on-screen keyboard makes the browser size smaller we use a wider aspect ratio as the minimum to fetch this edge-case, on IOS this is no problem and we use the safer 4/3
            if(df.sys.isIOS){
                bLandscape = window.matchMedia("screen and (min-aspect-ratio: 4/3)").matches;
            }else{
                bLandscape = window.matchMedia("screen and (min-aspect-ratio: 13/9)").matches;
            }
            
            //  If we came in through the orientationchange event then the window sizes are usually not updated so we switch them ourselves
            if((bLandscape && iHeight > iWidth) || (!bLandscape && iWidth > iHeight)){
                iTemp = iHeight;
                iHeight = iWidth;
                iWidth = iTemp;
            }
        }else{
            bLandscape = screen.availWidth > screen.availHeight;
        }
    }else{
        //  On desktop browsers we use the screen size as this allows us to do good demo's
        iWidth = df.dom.windowWidth();
        iHeight =  df.dom.windowHeight();
        
        bLandscape =  iWidth > iHeight;
    }
        
    //  Now that we have established dimensions and landscape vs portrait we can us that to guess the device
    if(iWidth < 580 || (bLandscape && iHeight < 420)){
        eMode = (bLandscape ? df.modeMobileLandscape : df.modeMobilePortrait);
    }else if(iWidth < 1100 || df.sys.isMobile){
        eMode = (bLandscape ? df.modeTabletLandscape : df.modeTabletPortrait);
    }
    
    if(eMode !== this.peMode && this.pbActive){
        //alert("Detected mode: " + eMode + " Landscape: " + bLandscape + " Screenwidht: " + iWidth + " Screenheight: " + iHeight + " isMobile:  "+ df.sys.isMobile + " orientation: " + window.orientation);
        this.enforceMode(eMode);
    }

},

/*
Listens to the window resize event and calls the mode detection on resize.

@param  oEvent  See df.events.DomEvent.
*/
onWindowResize : function(oEvent){
    this.detectMode();
},

/* 
Activates the responsive system which means setting pbActive to true and reapplying the current 
mode.
*/
activate : function(){
    if(!this.pbActive){
        this.pbActive = true;
        
        this.enforceMode(this.peMode);
    }
},

/* 
Deactivates the responsive system which means setting pbActive to true and reapplying the mode where 
enforeMode will look at pbActive and use 0 as the mode when deactivated. 
*/
deactivate : function(){
    if(this.pbActive){
        this.pbActive = false;
        
        this.enforceMode(this.peMode);
    }
}

});