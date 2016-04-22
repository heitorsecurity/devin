/*
Name:
    df
Type:
    Namespace

Revisions:
    2007/12/14  Created the initial structure and the first edition of dynamic
    library loading using the df.require method. (HW, DAE)
    
    2008/03/19  Removed dynamic library loading. (HW, DAE)
    
    2011/06/28  Refactored for usage in the new Visual DataFlex 17.1 Web Framework (HW, DAW)
    
    2013/03/04  Renamed from vdf to df in preparation of the upcoming name change and to allow the 
    17.1 framework to run side by side with the AJAX Library. (HW, DAW)
*/

/* 
This is the main namespace where the entire JavaScript engine of the web application framework 
resides under. It is the only global object of the framework itself other than any application 
objects that may be created. It contains classes, other namespaces and constants.
*/
var df = {

//  GLOBALS
/*
String containing the actual version number of the library. The df-include.js places it in the 
temporary df object.
*/
psVersionId : ((df && df.psVersionId) || ""),

/* 
Number containing the DataFlex revision (Major and Minor like 18.2). This can be used for hot 
fixes to make sure that they do not override the actual fix.
*/
pnDataFlexVersion : (function(){
    var aV;
    
    if(df.psVersionId){
        aV = df.psVersionId.split(".");
        if(aV.length > 1){
            return parseFloat(aV[0] + "." + aV[1]);
        }else{
            return 0.0;
        }
    }
}()),

//  CONSTANTS

//  piDataType  (df.WebBaseDEO)
ciTypeText      : 0,
ciTypeBCD       : 1,
ciTypeDate      : 2,
ciTypeDateTime  : 3,

//  peRegion    (df.WebPanel)
ciRegionCenter  : 0,
ciRegionLeft    : 1,
ciRegionRight   : 2,
ciRegionTop     : 3,
ciRegionBottom  : 4,

//  peLabelAlign (df.WebControl)
ciLabelLeft     : 0,
ciLabelTop      : 1,
ciLabelRight    : 2,

//  peAlign      (df.WebLabel, df.WebBaseDEO)
ciAlignLeft     : 0,
ciAlignCenter   : 1,
ciAlignRight    : 2,

//  Server communication (df.WebList)
ciDirGT         : 0,
ciDirLT         : 1,

//  Modes for opening a new page (df.WebApp:navigateToPage)
ciOpenSameWindow    : 0,
ciOpenNewTab        : 1,
ciOpenNewWindow     : 2,

//  pePosition of cWebImage
cwiActual            : 0,
cwiStretch           : 1,
cwiStretchHoriz      : 2,
cwiCenter            : 3,
cwiFit               : 4,
cwiCover             : 5,

//  peSortItems of cWebCombo
csUnsorted      : 0,
csDescription   : 1,
csValue         : 2,

//  peBreadcrumbStyle of cWebBreadcrumb
cCrumbHorizontal  :0,
cCrumbDropDown    :1,
cCrumbCaption     :2,

// web property data types
tUnknown            : 0,
tString             : 1,
tInt                : 2,
tNumber             : 3,
tDate               : 4,
tBool               : 5,
tAdv                : 6,

//  WebList.peDbGridType
gtAutomatic         : 0,
gtAllData           : 1,
gtManual            : 2,

//  Server call modes
cCallModeDefault    : 1,
cCallModeWait       : 2,
cCallModeProgress   : 3,

//  WebSuggestionForm.peSuggestionMode
smFind              : 0,
smValidationTable   : 1,
smCustom            : 2,

//  Client action modes
ctExecDefault       : 0,    // Regular client actions
ctExecEarly         : 1,    // Early client actions that need to be executed before web property values are applied
ctExecViewLoad      : 2,    // Client actions that are part of the loading / initialization of a view

modeDesktop         : 10,   // This is the default mode (i.e. desktop mode). This mode is not normally explicitly used.
modeTablet          : 20,   // Default Tablet mode
modeTabletLandscape : 21,   // Tablet mode when in landscape orientation
modeTabletPortrait  : 22,   // Tablet mode when in portrait
modeMobile          : 30,   // Default Mobile mode
modeMobileLandscape : 31,   // Mobile mode when in landscape
modeMobilePortrait  : 32,   // Mobile mode when in portrait

//  WebMenuItem.peActionDisplay (used by cWebActionBar)
adActionBar  : 1,
adMenu       : 2,
adBoth       : 3,

//  Generic CSS classnames used throughout the framework, the designer might change these to disable specific behavior
CssEnabled : 'Web_Enabled',
CssDisabled : 'Web_Disabled',

//  GLOBALS
/*
Will contain the url from where this script is included (determined at global execution).
*/
psIncludeLocation : (function(){
    var aScripts;
    
    //  Determine current include location
    aScripts = document.getElementsByTagName("script");
    return aScripts[aScripts.length - 1].src;
}()),

/*
Will contain the root path based on the include location of this script.
*/
psRootPath : (function(){
    var aScripts, sPath;
    
    //  Determine current include location
    aScripts = document.getElementsByTagName("script");
    sPath = aScripts[aScripts.length - 1].src;
    
    //  Remove DfEngine.. so we keep the root path
    if(sPath && sPath.indexOf('DfEngine') > 0){
        return sPath.substr(0, sPath.indexOf('DfEngine'));
    }
    
    return null;
}()),


//  NAMESPACES
/*
Namespace that contains components used for communication with the server. 
Important are the HttpRequest inheritantance tree and and the xmlSerialize 
object.
*/
ajax : {},

/* 
Namespace that contains translations. These translations are shared between different instances of 
applications and contain things like the dates. 
*/
lang : {
    monthsLong : ["January","February","March","April","May","June","July","August","September","October","November","December"],
    monthsShort : ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
    daysShort : ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],
    daysLong : ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
},

/*
Namespace containing graphical components for building interactive user interfaces.
*/
gui : {

/*
Array with Z-Index reservations.

@private
@deprecated
*/
aZReservations : [true],

/*
Used to reserve a new z-index which is always on top of all other components 
that have reserved their z-index.

@return Z-Index number.
@deprecated
*/
reserveZIndex : function(){
    return this.aZReservations.push(true) - 1;
},

/*
Releases a z-index reservation.

@param iIndex  The index to free.
@deprecated
*/
freeZIndex : function(iIndex){
    var iRes;

    this.aZReservations[iIndex] = false;

    for(iRes = this.aZReservations.length - 1; iRes >= 0; iRes--){
        if(!this.aZReservations[iRes]){
            this.aZReservations.pop();
        }else{
            break;
        }
    }
},

/*
Creates a div with the classname "WebApp_DragMask" and inserts it directly into the DOM. This mask 
is used in the implementation of drag and resize actions to make sure no other elements interfere.

@return Div mask element
*/
dragMask : function(){
	var eMask;
	
	eMask = df.dom.create('<div class="WebApp_DragMask"></div>');
    
    document.body.appendChild(eMask);
	
	return eMask;
}

},

/*
JavaScript is a prototypal language with lots of different types of notations. 
Within the AJAX Library we decided that we needed a more easy form of 
inheritance with a more readable notation. This method makes it easy to define 
prototypes with inheritance. Note that throughout the documentation prototypes 
will be called classes for the convenience of developers moving from classical 
programming languages.

This method is called with a reference to the constructor an optional super 
constructor (to inherit from) and an object with the prototype definition. The 
prototype.constructor reference is set correctly and a reference to the super 
constructor is stored in prototype[<supername>] so it can be called from the 
sub constructor.

Example of how a prototype should be defined inside the AJAX Library:
@code
df.gui.List = function List(oForm){
    this.oForm = oForm;
}
df.defineClass(df.gui.List, {

displayRow : function(oRow){
    ..
},

scroll : function(iDirection){
    ..
}
});
@code

Example of how a prototype that extends another prototype should be defined
inside the AJAX Library:
@code
df.gui.Grid = function Grid(oForm){
    this.List(oForm);
    this.aFields = [];
}
df.defineClass("df.gui.Grid", "df.gui.List", {

save : function(){
    ..
}

});
@code

@param  constructor Reference to the constructor function (a string name is 
                    also allowed).
@param  sSuper      (optional)  String name of constructor of the object to 
                    inherit (a string name is also allowed).
@param  oProto      Reference to the object with the new prototype content.
*/
defineClass : function(constructor, sSuper, oProto){
    var fConstructor, fSuper, oPrototype, FTemp, sProp;

    //  Constructor can be given as string or as reference
    if(typeof(constructor) === "string"){
        if(df.sys){
            fConstructor = df.sys.ref.getNestedProp(constructor);
        }else{
            fConstructor = eval(constructor);
        }
    }else{
        fConstructor = constructor;
    }

    //  Three parameters means the second points to prototype to extend
    if(arguments.length > 2){ // Three or more parameters means a Prototype to extend is given
        oPrototype = arguments[arguments.length - 1];


        //  The inherited constructor can be given by name in string
        if(typeof(arguments[1]) === "string"){
            //  Get a reference to the constructor using eval
            if(df.sys){
                fSuper = df.sys.ref.getNestedProp(arguments[1]);
            }else{
                fSuper = eval(arguments[1]);
            }
        }else{
            //  The reference can also be given directly
            fSuper = arguments[1];
        }
        
        //  Check if super exists
        if(typeof fSuper !== 'function'){
            alert("Super class for '" + constructor + "' must be defined first ('" + arguments[1] + "')");
        }

        //  The third parameter is the prototype object
        oPrototype = arguments[2];

        //  Do the inheritance thing
        FTemp = function(){};
        FTemp.prototype = fSuper.prototype;
        fConstructor.prototype = new FTemp();

        //  Copy in the new methods
        for(sProp in oPrototype){
            if(oPrototype.hasOwnProperty(sProp)){
                fConstructor.prototype[sProp] = oPrototype[sProp];
            }
        }

        // sSuperName = fSuper.toString();
        // sSuperName = sSuperName.substring(sSuperName.indexOf("function") + 8, sSuperName.indexOf('(')).replace(/ /g,'');
        // fConstructor.prototype[sSuperName] = fSuper.prototype;
        fConstructor.base = fSuper.prototype;
    }if(arguments.length === 2){
        oPrototype = arguments[1];

        fConstructor.prototype = oPrototype;
    }

    fConstructor.prototype.constructor = fConstructor;
},

/*
This function generates a new class based on a super class and a mixin class. A mixin class is a 
regular class that does not inherit from other classes. The function returns the new constructor 
function. The mixin class can use the 'getBase' method to get the base class prototype. The getBase 
method takes the classname of the mixin as a parameter which is needed when multiple mixins are used 
in the inheritance tree.

@code
function MyExtra_mixin(sSomething){
    this.getBase("MyExtra_mixin").constructor.call(this, sSomething);
    
    this.sProp = "";
}
df.defineClass("MyExtra_mixin", {

doSomething : function(){
    // Forward send
    this.getBase("MyExtra_mixin").doSomething.call(this);
    
    this.sProp = "Something";
}

});

MyClass = df.mixin("MyExtra_mixin", "MySuperClass");
@code

This is used with the columns of the df.WebList where the df.WebColumn_mixin is used on all column 
types providing a generic API for the list to talk to. 

@param  sMixin  String name of the mixin class (like "df.WebColumn_mixin").
@param  sSuper  String name of the super class (like "df.WebForm").
*/
mixin : function(sMixin, sSuper){
    var fSuper, fMixin, fConstructor, FTemp, sProp, sMixinName = sMixin;

    //  Find mixin and super classes
    fSuper = df.sys.ref.getNestedProp(sSuper);
    fMixin = df.sys.ref.getNestedProp(sMixin);
    
    if(typeof fSuper !== 'function'){
        alert("Super class for new mixed base class must be defined first ('" + sSuper + "')");
        return;
    }
    if(typeof fMixin !== 'function'){
        alert("Mixin class for new mixed base class must be defined first ('" + sMixin + "')");
        return;
    }
    
    //  Create new constructor
    fConstructor = function(){
        fMixin.apply(this, arguments);
    };
    
    //  Do regular inheritance
    FTemp = function(){};
    FTemp.prototype = fSuper.prototype;
    fConstructor.prototype = new FTemp();
    
    //  Copy in mixin methods (including constructor property)
    for(sProp in fMixin.prototype){
        if(fMixin.prototype.hasOwnProperty(sProp)){
            fConstructor.prototype[sProp] = fMixin.prototype[sProp];
        }
    }
    
    //  Set the base
    fConstructor.prototype.getBase = function(sOptClass){
        if(!sOptClass || sOptClass === sMixinName){
            return fSuper.prototype;
        }
        fSuper.prototype.getBase.call(this, sOptClass);
    };
    
    fConstructor.prototype.constructor = fMixin; // We need to set this manually for IE8 on WinXP
    
    
    return fConstructor;
},


//  DataFlex TYPE CONVERSION

/*
This method converts a string value to a boolean where it converts "0" and "-1" to false which is 
against the regular JavaScript behavior. Reason for doing this is because booleans received from the 
server are sent by Visual DataFlex as string "1" (true) and "0" (false). Then there is are the 
'three state booleans' for Data Dictionary properties that can be "-1" which means that they are not 
determined which is interpreted as false.

@param  val     The value (usually a string).
@return The value as a boolean.
*/
toBool : function(val){
    //  Booleans come from the server as "1" or "0" where "0" evaluates to true
    //  Booleans can have -1 as value when they support the C_WebDefault value which always evaluates to false
    return (val === "0" || val === "-1" || val === "false" ? false : !!val);
},

/* 
This method converts a boolean value to the DataFlex string representation "1" or "0".

@param  bVal    The boolean value.
@return String "1" for true and "0" for false.
*/
fromBool : function(bVal){
    return (bVal ? "1" : "0");
},

fromDate : function(dDate){
    return df.sys.data.dateToString(dDate, "yyyy/mm/dd", "-");
},

/*
This method converts a string value to an integer.

@param  val     The value (usually a string).
@return The value as an integer.
*/
toInt : function(val){
    return parseInt(val, 10);
},

/*
This method converts a string value to a number (JavaScript float).

@param  val     The value (usually a string).
@return The value as a float.
*/
toNumber : function(val){
    return parseFloat(val);
},

toDate : function(val){
    return df.sys.data.stringToDate(val, "yyyy/mm/dd", "-");
},

toDateTime : function(val){
    return df.sys.data.stringToDate(val, "yyyy/mm/ddThh:mm:ss.fff");
},

fromDateTime : function(dDate){
    return df.sys.data.dateToString(this._tValue, "yyyy/mm/ddThh:mm:ss.fff", "-", ":");
},

//  LOGGING
/*
@private
*/
timeValues : {},

timeStart : function(sLbl, sLog){
    sLog = sLbl + ":: Timing Start * " + sLog;
    
    df.log(sLog);
    
    this.timeValues[sLbl] = new Date().getTime();
},


timeStop : function(sLbl, sLog){
    var time = new Date().getTime();
    
    if(this.timeValues[sLbl]){
        time = (time - this.timeValues[sLbl]) / 1000;
        sLog = sLbl + ":: " + time + " * Timing Stop * " + sLog;
    }else{
        sLog = sLbl + ":: <NAV> * Timing Stop * " + sLog;
    }
    
    df.log(sLog);
},

/*
Log method used for development usage. The log is shown on the FireBug console 
with some extra information.

@param  sLog    Text to log.
*/
log : function(sLog){


    
    //  Console object is not always available in IE
    if(typeof(console) === "object" && console.log){
        console.log(sLog);
    }
},

/*
Logging method that only outputs when running in debug mode (dfdebug=true get parameter of 
bDfDebug global).

@param  sLog    Text to write to the log.
*/
debug : function(sLog){
    if((typeof(bDfDebug) === "boolean" && bDfDebug) || document.location.href.toLowerCase().indexOf('dfdebug=true') > 0){
        df.log(sLog);
    }
},

/*
This is the global handler method that can be called to handle errors. If possible it is adviced to 
call the error handler of the WebApp object. If an source object is passed of the WebObject type 
then it will try to forward this error to the WebApp object anyway.

@param  oError      The error object (instance of df.Error)
@param  oOptSource  (optional) The source object that caused the error.
*/
handleError : function(oError, oOptSource){
    var oWebApp = null, oSource;
    
    //  We only handle it if it is a framework error (JS Debuggers are made to handle script errors)
    if(oError instanceof df.Error){
        oSource = oOptSource || oError.oSource || null;
    
        //  We search for a webapp object based on the source
        if(oSource && oSource.getWebApp){
            oSource = oSource.getWebApp();
        }
        if(oSource && (oSource instanceof df.WebApp)){
            oWebApp = oSource;
        }
        
        //  Pass to the webapp
        if(oWebApp){
            oWebApp.handleError(oError);
        }else{
            //  Give ugly alert
            alert(oError.iNumber + ": " + oError.sText + "\n\r Line: " + oError.iLine + "\n\r Target: " + oError.sTarget + "\n\r User error: " + oError.bUserError);
        }
    }else{
        throw oError;
    }
}

};


/*
Dumb error class that represents errors within the framework. It doesn�t have any functionality but 
its format is known by the error handling methods.
*/
df.Error = function Error(iNumber, sText, oOptSource, aOptReplacements, sOptDetailHtml, bOptSrv, bOptUsr, sOptCaption, oOptTarget, iOptLine){
    this.iNumber = iNumber;
    this.sText = sText;
    this.bUserError = !!bOptUsr;
    this.sCaption = sOptCaption || null;
    this.oSource = oOptSource || null;
    this.oTarget = oOptTarget || null;
    this.bServer = !!bOptSrv;
    this.iLine = iOptLine;
    this.sDetailHtml = sOptDetailHtml || null;
    
    
    if(aOptReplacements){
        this.sText = df.sys.data.format(this.sText, aOptReplacements);
    }
};