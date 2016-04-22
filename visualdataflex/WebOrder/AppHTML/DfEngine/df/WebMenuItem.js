﻿/*
Class:
    df.WebMenuItem
Extends:
    df.WebBaseUIObject

This class represents a static menu item. These menu item doesn’t have any rendering logic which is 
in the menu classes. Through a system with a menu hub, menu listeners and menu providers the menu 
classes know which items it needs to render.
    
Revision:
    2011/10/04  (HW, DAW) 
        Initial version.
    2015/01/19  (HW, DAW)
        Re factored into new menu model where the DOM element doesn't know anything about its own 
        rendering. The menu class now perform the rendering and passes menu items around as data 
        elements.
*/

df.WebMenuItem = function WebMenuItem(oDef, oParent){
    df.WebMenuItem.base.constructor.call(this, oDef, oParent);
    
    this.prop(df.tString, "psCaption", "");
    this.prop(df.tString, "psTextColor", "");
    this.prop(df.tBool, "pbBeginGroup", false);
    this.prop(df.tString, "psGroupCaption", "");
    this.prop(df.tString, "psImage", "");
    this.prop(df.tString, "psToolTip", "");
    this.prop(df.tInt, "peActionDisplay", df.adBoth);
    
    this.event("OnClick", df.cCallModeWait);
    this.prop(df.tString, "psLoadViewOnClick", "");
    
    // @privates
    this._bShown = true;
    this._oProv = null;
};
/*
This class represents a menu item inside a menu or a toolbar. It belongs to the server-side 
cWebMenuItem class and implements its functionality on the client. It has support for icons a 
caption and sub menus. The submenu's are shown when hovering the element and hidden after a timeout 
(or a click). The CSS (class: WebMenuItem & WebMenuBar & WebToolBar) heavily determines the looks of 
the control.

@code
<li class="WebUIObj WebMenuItem">
    <div title="Order Entry View">
        <span class="WebItm_Icon" style="background-image: url(&quot;Images/Order.png&quot;);">&nbsp;</span>
        <a href="javascript: void(0);">Order Entry View</a>
    </div>
</li>
@code
*/
df.defineClass("df.WebMenuItem", "df.WebBaseUIObject",{

/* 
Called by a menu engine when this menu item is clicked. It triggers the OnClick event and if needed 
performs a load view (psLoadViewOnClick).
*/
itemClick : function(tItem, fReturn, oEnv){
    
    this.fire('OnClick', [], function(oEvent){
        //  Determine if a view needs to be loaded
        if(!oEvent.bCancelled){
            if(this.psLoadViewOnClick){
                this.getWebApp().showView(this.psLoadViewOnClick);
            }
        }
        
        fReturn.call(oEnv, (oEvent.bClient || oEvent.bServer || this.psLoadViewOnClick));
    });
},

//  - - - Setters - - - 

/*
This setter method updates the DOM with the new caption.

@param  sVal   The new value.
@private
*/
set_psCaption : function(sVal){
    this.psCaption = sVal;
    
    this.notifyChange();
},

/*
Setter method that notifies the menu provider of a this change.

@param  sVal   The new value.
@private
*/
set_psToolTip : function(sVal){
    this.psToolTip = sVal;
    
    this.notifyChange();
},

/*
Setter method that notifies the menu provider of a this change.

@param  bVal   The new value.
@private
*/
set_pbBeginGroup : function(bVal){
    this.pbBeginGroup = bVal;
    
    this.notifyChange();
},

/*
Setter method that notifies the menu provider of a this change.

@param  sVal   The new value.
@private
*/
set_psImage : function(sVal){
    this.psImage = sVal;
    
    this.notifyChange();
},

/*
Setter method that notifies the menu provider of a this change.

@param  sVal   The new value.
@private
*/
set_psHtmlId : function(sVal){
    this.psHtmlId = sVal;
    
    this.notifyChange();
},

/*
Setter method that notifies the menu provider of a this change.

@param  sVal   The new value.
@private
*/
set_psCSSClass : function(sVal){
    this.psCSSClass = sVal;
    
    this.notifyChange();
},

/*
Setter method that notifies the menu provider of a this change.

@param  sVal   The new value.
@private
*/
set_psTextColor : function(sVal){
    this.psTextColor = sVal;
    
    this.notifyChange();
},

/*
Setter method that notifies the menu provider of a this change.

@param  sVal   The new value.
@private
*/
set_psBackgroundColor : function(sVal){
    this.psBackgroundColor = sVal;
    
    this.notifyChange();
},

/* 
Setter method that notifies the menu provider of this change.

@param  eVal    The new value.
@private
*/
set_peActionDisplay : function(eVal){
    this.peActionDisplay = eVal;
    
    this.notifyChange();
},

/* 
Setter method that notifies the menu provider of a this change. Optimized for being set to the same 
value.

@param  bVal    The new value.
*/
set_pbVisible : function(bVal){
    if(this.pbVisible !== bVal){
        this.pbVisible = bVal;
        
        this.notifyChange();
    }
},

/* 
Setter method that notifies the menu provider of a this change. Optimized for being set to the same 
value.

@param  bVal    The new value.
*/
set_pbRender : function(bVal){
    if(this.pbRender !== bVal){
        this.pbRender = bVal;
            
        //  Trigger after hide / show
        if(this.pbRender){
           this.afterShow();
        }else{
            this.afterHide();
        }
    
        this.notifyChange();
    }
},

show : function(){
    // ToDo: Implement
    //  Used by the previewer to show items when selecting them
},

hide : function(){
    // ToDo: Implement
    //  Used by the previewer to hide items when deselecting them
},


/* 
Overrides applyEnabled and notifies the change in the enabled state to the menu system so it can 
update itself.

@param  bVal    The new value.
*/
applyEnabled : function(bVal){
    this.notifyChange();
},

/* 
Triggers the menu provider (the wrapping class) of a change to the menu item. The provider is then 
responsible for updating the UI by triggering the menu renderer.
*/
notifyChange : function(){
    this.getProv().notifyChange();
},

getProv : function(){
    var oWO;
    
    if(!this._oProv){
        oWO = this;

        while(oWO && !oWO._bIsMenuProv){
            oWO = oWO._oParent;
        }
        
        if(oWO && oWO._bIsMenuProv){
            this._oProv = oWO;
        }else{
            throw new df.Error(999, "Menu item '{{0}}' should be wrapped by a menu object.", this, [this._sName])
        }
    }
    
    return this._oProv;
}

});