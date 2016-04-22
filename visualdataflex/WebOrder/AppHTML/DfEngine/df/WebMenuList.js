/* 
Class:
    df.WebMenuList
Extends:
    df.WebBaseMenu
    
This menu class represents a mobile style menu inspired on IOS style menu’s. It behaves as a multi 
level list with submenu’s sliding in from the right. It can be positioned like a control and is used 
by the WebMenuButton class to display its menu. Most menu logic is (being a menu provider / 
listener) is inherited from df.WebBaseMenu.

Revisions:
    2014/09/05  Initial version (HW, DAW).
    2015/01/19  Refactored into new model with menu providers and listeners. Removed the menu 
                crawler and changed base class from WebBaseControl to WebBaseMenu. This makes the 
                WebMenuList compatible with the other refactored menu classes allowing menu groups
                to be used. (HW, DAW)
*/
df.WebMenuList = function WebMenuList(sName, oPrnt){
    df.WebMenuList.base.constructor.apply(this, arguments);
    
    this.prop(df.tString, "psRootCaption", "");
    this.prop(df.tBool, "pbShowCaption", true);
    this.prop(df.tBool, "pbShowBackItem", true);
    this.prop(df.tBool, "pbShowIcons", false);

    // @privates
    this._sCurrentMenu = "";
    this._eCurrentMenu = null;
    this._oMenuBtn = null;
    
    //  Configure base classes
    this._bIsMenuListener = true;
    
    this.pbShowLabel = false;
    this._bRenderChildren = false;
    this._sControlClass = "WebMenuList";
};
df.defineClass("df.WebMenuList", "df.WebBaseMenu", {

/* 
Generates the static wrapping HTML and includes the initial root level menu.

@param  aHtml   Array used as string builder.
@private
*/
openHtml : function(aHtml){
    var aMenu;
    
    df.WebMenuList.base.openHtml.apply(this, arguments);
    
    aHtml.push('<div class="WebMenuWrp" tabindex="0">',
                    '<div class="WebML_Title"', (this.pbShowCaption ? '' : ' style="display: none"'), '>',
                        '<span class="WebML_Caption">', this.psRootCaption, '</span>',
                    '</div>',
                    '<div class="WebML_Panel', (this.pbShowIcons ? ' WebML_ShowIcons' : ''), '">',
                        '<div class="WebML_Mnu WebML_Current" data-dfmenu-path="">');
    
    aMenu = this.getMenu();
    
    this.genMenuHtml(aHtml, aMenu, false);
    
    
    aHtml.push(         '</div>',
                    '</div>');
    
},

/* 
Closes the wrapping HTML elements.

@param  aHtml   Array used as string builder.
@private
*/
closeHtml : function(aHtml){
    aHtml.push('</div>');

    df.WebMenuList.base.closeHtml.apply(this, arguments);

},

/* 
Called after the HTML is inserted into the DOM during the initial render process. We make sure here 
that we get references to the important elements and attach event listeners.

@private
*/
afterRender : function(){
    var that = this, eMnu, ePnl;
    
    //  Get references
    this._eControl = df.dom.query(this._eElem, "div.WebMenuWrp");
    this._eMenuPanel = ePnl = df.dom.query(this._eElem, "div.WebML_Panel");
    this._eMenuTitle = df.dom.query(this._eElem, "div.WebML_Title");
    this._eMenuCaption = df.dom.query(this._eElem, "span.WebML_Caption");
    eMnu = this._eCurrentMenu = df.dom.query(ePnl, "div.WebML_Mnu");
    
    //  Forward send
    df.WebMenuList.base.afterRender.apply(this, arguments);
    
    //  Add event handlers
    df.events.addDomListener("click", ePnl, this.onMenuClick, this);
    
    //  Perform initial sizing if sizing based on its content
    if(this.piHeight <= 0 && !this.pbFillHeight){
        setTimeout(function(){
            if(eMnu.firstChild){
                ePnl.style.height = that.getMenuHeight(eMnu.firstChild) + "px";
            }
        }, 20);        
    }
},

/* 
Generates the HTML for a single level of the menu.

@param  aHtml   (byref) String builder array.
@param  aMenu   Array with the menu items.
@param  bSub    If true a back button will be generated.
*/
genMenuHtml : function(aHtml, aMenu, bSub){
    var i, aClasses, tItem;

    aHtml.push('<ul>');
    
    //  Generate back button
    if(bSub && this.pbShowBackItem){
        aHtml.push('<li class="WebML_Item WebML_Back" data-df-path="go-back"><a href="javascript:void(0);">', this.getWebApp().getTrans("back"), '</a></li>');
    }
    
    //  Loop over items
    for(i = 0; i < aMenu.length; i++){
        tItem = aMenu[i];
        
        //  Determine classnames
        aClasses = [ "WebML_Item", tItem.sCSSClass, (tItem.bEnabled ? df.CssEnabled : df.CssDisabled) ];
        if(tItem.aChildren.length > 0){
            aClasses.push("WebML_HasSub");
        }
        
        //  Generate group devider
        if(tItem.bBeginGroup){
            aHtml.push('<li class="WebML_Devider">', (tItem.sGroupCaption || "&nbsp;"), '</li>');
        }
        
        //  Generate item elements
        this.genItemHtml(aHtml, tItem, false);
        //aHtml.push('<li data-df-path="', tItem._sPath, '" class="', aClasses.join(" "), '"><a href="#">', tItem.sCaption , '</a></li>');
    }
    
    aHtml.push('</ul>');
},

/* 
Handles click events on the menu. It determines which element is clicked and performs the right 
action (drill-down / go back) and triggers the click action on the item handler.

@param  oEvent  DOM Event (see: df.events.DOMEvent).
@private
*/
onMenuClick : function(oEvent){
    var sID = null, tItem, eElem = oEvent.getTarget(), eMnu, ePrnt, aHtml;
    
    //  Determine the clicked element by bubbling up the DOM structure
    while(!tItem && eElem && eElem !== this._eElem){
        if(eElem.hasAttribute("data-df-path")){
            sID = eElem.getAttribute("data-df-path");
            
            if(sID === "go-back"){
                //  If go back button is clicked we go one level up
                this.levelUp();
                oEvent.stop();
                return;
            }
            tItem = this.getItemByPath(sID);
        }else{
            eElem = eElem.parentNode;
        }
    }
    
    if(tItem){
        if(tItem.bEnabled){
            if(tItem.aChildren.length > 0){
                //  Perform drilldown
                
                //  Get reference to the menu DOM element
                eMnu = df.dom.query(this._eMenuPanel, 'div.WebML_Mnu[data-dfmenu-path="' + tItem._sPath + '"]'); 
                if(!eMnu){
                    //  Generate a new menu element if it wasn't created yet
                    aHtml = [];
                    aHtml.push('<div class="WebML_Mnu WebML_HiddenSub" data-dfmenu-path="', tItem._sPath, '">');
                    this.genMenuHtml(aHtml, tItem.aChildren, true);
                    aHtml.push('</div>');
                    eMnu = df.dom.create(aHtml.join(""));
                    
                    this._eMenuPanel.appendChild(eMnu);
                }
                
                ePrnt = this._eCurrentMenu;
                
                //  Update caption
                df.dom.setText(this._eMenuCaption, tItem.sCaption);
                
                //  Change CSS classes after a timeout (animation doesn't work properly on newly generated elements)
                setTimeout(function fTimeout(){
                    if(ePrnt){
                        df.dom.addClass(ePrnt, "WebML_HiddenParent");
                        df.dom.removeClass(ePrnt, "WebML_Current");
                    }
                    df.dom.addClass(eMnu, "WebML_Current");
                    df.dom.removeClass(eMnu, "WebML_HiddenSub");
                }, 20);
                
                //  Update administration
                this._sCurrentMenu = tItem._sPath;
                this._eCurrentMenu = eMnu;
            }
            
            //  Trigger click event on the item its handler
            tItem._oHandler.itemClick(tItem, function(bExec){
                if(bExec){
                    //  Notify menu button class of the action
                    if(this._oMenuBtn){
                        this._oMenuBtn.hideMenu();
                    }
                }
            }, this);
            
        }
        oEvent.stop();
    }
},

expandItem : function(tItem){
    if(tItem.aChildren.length > 0){
        this._sCurrentMenu = tItem._sPath;
    }else{
        this._sCurrentMenu = "";
    }
    this.refreshMenu();
},

collapseAll : function(){
    this._sCurrentMenu = "";
    this.refreshMenu();
},

/* 
Navigates one level up in the menu structure. It makes sure that the menu slides in from the level.
*/
levelUp : function(){
    var eMnu, eSub, tItem = null, aMenu, aHtml;
    
    if(this._sCurrentMenu){
        //  Determine where to go based on the current menu id (if the current menu item is not found we go back to the root)
        if(this._sCurrentMenu.indexOf(".") > 0){
            this._sCurrentMenu = this._sCurrentMenu.substr(0, this._sCurrentMenu.lastIndexOf("."));
            tItem = this.getItemByPath(this._sCurrentMenu);
        }
        if(tItem){
            aMenu = tItem.aChildren;
        }else{
            this._sCurrentMenu = "";
            aMenu = this.getMenu();
        }
    
        //  Get reference to the menu its DOM element
        eMnu = df.dom.query(this._eMenuPanel, 'div.WebML_Mnu[data-dfmenu-path="' + this._sCurrentMenu + '"]'); 
        if(!eMnu){
            //  Generate menu elements if unavailable
            aHtml = [];
            aHtml.push('<div class="WebML_Mnu WebML_HiddenParent" data-dfmenu-path="', this._sCurrentMenu, '">');
            this.genMenuHtml(aHtml, aMenu, !!this._sCurrentMenu);
            aHtml.push('</div>');
            eMnu = df.dom.create(aHtml.join(""));
            
            this._eMenuPanel.appendChild(eMnu);
        }
        
        eSub = this._eCurrentMenu;
        
        //  Update caption
        if(tItem){
            df.dom.setText(this._eMenuCaption, tItem.sCaption);
        }else{
            df.dom.setText(this._eMenuCaption, this.psRootCaption);
        }
        
        //  Update CSS classes after timeout (timeout is needed for smooth animation)
        setTimeout(function fTimeout(){
            if(eSub){
                df.dom.addClass(eSub, "WebML_HiddenSub");
                df.dom.removeClass(eSub, "WebML_Current");
            }
            df.dom.addClass(eMnu, "WebML_Current");
            df.dom.removeClass(eMnu, "WebML_HiddenParent");
        }, 20);
        
        this._eCurrentMenu = eMnu;
        
    }
},

/* 
Is called by the WebBaseMenu class when the menu needs to update itself (something changed regarding 
the menu its content).
*/
refreshMenu : function(){
    var that = this, tItem, aMenu, aHtml = [], eMnu;
    
    if(this._eMenuPanel){
        //  Determine if our current menu still exists (go back to root if not)
        if(this._sCurrentMenu){
            tItem = this.getItemByPath(this._sCurrentMenu); 
        }
        
        if(tItem){
            aMenu = tItem.aChildren;
        }else{
            this._sCurrentMenu = "";
            aMenu = this.getMenu();
        }
        
        //  Generate menu elements (we throw away all old menu elements by setting innerHTML)
        aHtml.push('<div class="WebML_Mnu WebML_Current" data-dfmenu-path="', this._sCurrentMenu, '">');
        this.genMenuHtml(aHtml, aMenu, !!this._sCurrentMenu);
        aHtml.push('</div>');
        this._eMenuPanel.innerHTML = aHtml.join("");
        eMnu = this._eMenuPanel.firstChild;
        
        //  Update caption
        if(tItem){
            df.dom.setText(this._eMenuCaption, tItem.sCaption);
        }else{
            df.dom.setText(this._eMenuCaption, this.psRootCaption);
        }
        
        this._eCurrentMenu = eMnu;
        
        //  Set height if needed
        if(this.piHeight <= 0 && !this.pbFillHeight){
            setTimeout(function(){
                if(eMnu.firstChild){
                    that._eMenuPanel.style.height = that.getMenuHeight(eMnu.firstChild) + "px";
                }
            }, 20);        
        }
    }
},

/* 
Implements the setHeight (part of the WebBaseControl API) and updates the height if needed.

@param  iHeight     The height that the outermost div should get.
@private
*/
setHeight : function(iHeight){
    if(this._eMenuPanel){
        
        if(iHeight <= 0 && this._eCurrentMenu){
            this._eMenuPanel.style.height = this.getMenuHeight(this._eCurrentMenu) + "px";
        }        
        
        //  The list has a hard-coded minimum of 80px
        if(iHeight <= 80){
            iHeight = 80;
        }
    
       
        //  Reduce the grid header
        iHeight -= this._eMenuTitle.offsetHeight;
        
        //  Reduce the margins, paddings and border widths of the wrapping elements
        iHeight -= df.sys.gui.getVertBoxDiff(this._eMenuPanel);
        
        iHeight -= df.sys.gui.getVertBoxDiff(this._eInner);
        iHeight -= df.sys.gui.getVertBoxDiff(this._eControlWrp);

        //iHeight -= 4;
        //  Set the height on the grid body
        this._eMenuPanel.style.height = iHeight + "px";
            
        
        
    }
},

/* 
Determines the height of a specific menu element.

@param  eElem   DOM element for a menu.
*/
getMenuHeight : function(eElem){
    var iHeight = eElem.offsetHeight;
    
    iHeight += df.sys.gui.getVertBoxDiff(eElem);
    
    return iHeight;
},

/* 
Shows / hides the icons by adding / removing the ShowIcons CSS class based on the new value.

@param  bVal    New value.
@private
*/
set_pbShowIcons : function(bVal){
    if(this._eMenuPanel){
        df.dom.toggleClass(this._eMenuPanel, "WebML_ShowIcons", bVal);
    }
}

});