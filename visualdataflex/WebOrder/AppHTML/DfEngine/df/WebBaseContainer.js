/*
Class:
    df.WebBaseContainer
Extends:
    df.WebBaseUIObject

This class is the client-side representation of the WebBaseContainer class. It is implemented as a 
mixing (WebBaseContainer_mixin) but usually the WebBaseContainer inheriting from WebBaseUIObject is 
used by (WebPanel, WebApp, WebWindow..). The WebGroup uses the mixin and there WebBaseControl is 
used as the main class.

Revision:
    2011/08/01  (HW, DAW) 
        Initial version.
    2011/10/06  (HW, DAW)
        Rewrote the sizing.
    2013/11/11  (HW, DAW)
        Refactored into a mixin to support the new WebGroup.
*/
df.WebBaseContainer_mixin = function WebBaseContainer_mixin(sName, oParent){
    this.getBase("df.WebBaseContainer_mixin").constructor.call(this, sName, oParent);
    
    this.prop(df.tInt, "piColumnCount", 1);
    this.prop(df.tInt, "piWidth", 0);
    this.prop(df.tInt, "piMinWidth", 0);
    this.prop(df.tInt, "piHeight", 0);
    this.prop(df.tInt, "piMinHeight", 0);
    this.prop(df.tBool, "pbScroll", false);
    
    // @privates
    this._oRegionTop = null;
    this._oRegionLeft = null;
    this._oRegionCenter = null;
    this._oRegionRight = null;
    this._oRegionBottom = null;    
    
    this._eRegionTop = null;
    this._eMainArea = null;
    this._eRegionLeft = null;
    this._eRegionCenter = null;
    this._eContent = null;
    this._eRegionRight = null;
    this._eRegionBottom = null;
    this._eContainer = null;
    
    this._aUIObjects = [];
    this._aPanels = [];
    
    this._bHasFill = false;
    this._iContentHeight = null;
    this._bRendered = false;
    this._bPanels = false;
    
    this._bPositionChanged = true;  //  Switch indicating that the column / panel layout positioning has changed and needs to be reapplied
    this._bIsContainer = true;      //  Indicator used to recognize containers as instanceof won't always work for mixins
    this._iWantedHeight = null;
    this._bWantedChanged = false;
    
    //  Configure super classes
    this._bRenderChildren = true;
    this._sBaseClass = "WebContainer";
};
df.defineClass("df.WebBaseContainer_mixin",{

// - - - - Rendering - - - -

/*
Augment the openHtml method and add the HTML with the panel wrapper DIV elements.

@private
*/
openHtml : function(aHtml){
    //  Call the super
    this.getBase("df.WebBaseContainer_mixin").openHtml.call(this, aHtml);
    
    //  Allow subclass to slip in HTML
    this.wrpOpenHtml(aHtml);
    
    aHtml.push('<div class="WebCon_Sizer">');
    
    
},

/*
Augment the closeHtml method and add the HTML with the panel wrapper DIV elements.

@private
*/
closeHtml : function(aHtml){
    
    if(this._bPanels){
        aHtml.push('<div class="WebCon_Main">');
    }else{
		aHtml.push('<div class="WebCon_Content">');
	}
    
    aHtml.push('</div></div>');
    
    //  Allow subclass to slip in HTML
    this.wrpCloseHtml(aHtml);
    
    //  Call the super
    this.getBase("df.WebBaseContainer_mixin").closeHtml.call(this, aHtml);
},

/* 
Empty stub allowing sub classes to slip in HTML.

@private
*/
wrpOpenHtml : function(aHtml){

},

/* 
Empty stub allowing sub classes to slip in HTML.

@private
*/
wrpCloseHtml : function(aHtml){

},


/*
Augment afterRender to call setters.

@private
*/
afterRender : function(){
    this.getBase("df.WebBaseContainer_mixin").afterRender.call(this);
    
    this._bRendered = true;
    
    df.events.addDomListener("scroll", this._eElem, this.onScroll, this);
},

/*
Panels are containers so we have to call our child components to render themselves.

@private
*/
render : function(){
    var eElem;
    
    //  Call super (make sure that it doesn't render children right away
    this._bRenderChildren = false;
    eElem = this.getBase("df.WebBaseContainer_mixin").render.call(this);
    this._bRenderChildren = true;
    
    //  Get references to the regions
    this._eSizer = df.dom.query(this._eElem, "div.WebCon_Sizer");
    
    if(this._bPanels){
        this._eMainArea = df.dom.query(this._eElem, "div.WebCon_Main");
    }else{
		this._eContent = df.dom.query(this._eElem, "div.WebCon_Content");
	}
	
	//	Also get reference to container already (when doing that later there are multiple containers inside while for WebWindow the container is a sub element as well)
    this._eContainer = df.dom.query(this._eElem, "div.WebContainer") || this._eElem;
    
    
        
    //  Render children
    this.renderChildren();
    
    //  Call positioning system
    this.position();
    
    return eElem;
},

/*
Override the renderChildren method with support for panels.

@private
*/
renderChildren : function(){
    var i, eChild;
    
    //  Call children and append them to ourselves
    
    if(this._bPanels){
        //  Give a nice error when controls and panels are mixed up
        if(this._aUIObjects.length > 0){
            throw new df.Error(999, "Web controls and panels cannot be siblings within the same container object '{{0}}'. Consider placing them within a panel.", this, [ (this.getLongName() || 'oWebApp') ]);
        }

        this._eMainArea.style.position = "relative";
        this._eMainArea.appendChild(df.dom.create('<div style="clear: both;"></div>'));
        
        //  Render the panels
        for(i = 0; i < this._aPanels.length; i++){
            eChild = this._aPanels[i].render();
        }
        
        //  Place the panels in the DOM
        this.placePanels();
        this._bPositionChanged = false;
    }else{
        //  Render children and append them to the DOM
        for(i = 0; i < this._aUIObjects.length; i++){
            eChild = this._aUIObjects[i].render();
            
            if(eChild){
                this._eContent.appendChild(eChild);
            }
        }
        
        //  Append clear element
        this._eContent.appendChild(df.dom.create('<div style="clear: both;"></div>'));
    }
},

/*
Augmenting the addChild method to register UIObjects and panels separately.

@private
*/
addChild : function(oChild){
    if(oChild instanceof df.WebBaseUIObject){
        if(oChild.peRegion !== undefined){
            this._bPanels = true;
            
            this._aPanels.push(oChild);
        }else{
            this._aUIObjects.push(oChild);
        }
    }
    
    this.getBase("df.WebBaseContainer_mixin").addChild.call(this, oChild);
},

/* 
Loops over the panels and assigns them to the proper regions moving their DOM elements to the right 
place. Is called from preparesize when positioning has changed and during initialization.

@private
*/
placePanels : function(){
    var i, oPnl, ePnl;
    
    this._oRegionTop = null;
    this._oRegionLeft = null;
    this._oRegionCenter = null;
    this._oRegionRight = null;
    this._oRegionBottom = null;    
    
    this._eRegionTop = null;
    this._eRegionLeft = null;
    this._eRegionCenter = null;
    this._eRegionRight = null;
    this._eRegionBottom = null;
    
    for(i = 0; i < this._aPanels.length; i++){
        oPnl = this._aPanels[i];
        
        if(oPnl.peRegion === df.ciRegionCenter){ 
            if(this._oRegionCenter){
                throw new df.Error(999, "The region setting (peRegion) in panel '{{0}}' is already used by panel '{{1}}'. Sibling panels may not share the same region setting.", this, [ oPnl._sName, this._oRegionCenter._sName ]);
            }
            
            this._oRegionCenter = oPnl;
            
            this._eRegionCenter = ePnl = oPnl._eElem;
            this._eMainArea.appendChild(ePnl);
            
            ePnl.style.position = "absolute";
            ePnl.style.top = "0px";
            ePnl.style.right = "0px";
            ePnl.style.left = "0px";
            ePnl.style.bottom = "0px";
        }else if(oPnl.peRegion === df.ciRegionTop){  
            if(this._oRegionTop){
                throw new df.Error(999, "The region setting (peRegion) in panel '{{0}}' is already used by panel '{{1}}'. Sibling panels may not share the same region setting.", this, [ oPnl._sName, this._oRegionTop._sName ]);
            }
        
            this._oRegionTop = oPnl;
            
            this._eRegionTop = ePnl = oPnl._eElem;
            this._eMainArea.parentNode.insertBefore(ePnl, this._eMainArea);
            
            ePnl.style.position = "";
            ePnl.style.top = "";
            ePnl.style.left = "";
            ePnl.style.right = "";
            ePnl.style.bottom = "";
        }else if(oPnl.peRegion === df.ciRegionLeft){  
            if(this._oRegionLeft){
                throw new df.Error(999, "The region setting (peRegion) in panel '{{0}}' is already used by panel '{{1}}'. Sibling panels may not share the same region setting.", this, [ oPnl._sName, this._oRegionLeft._sName ]);
            }
        
            this._oRegionLeft = oPnl;
            this._eRegionLeft = ePnl = oPnl._eElem;
            this._eMainArea.appendChild(ePnl);
            
            ePnl.style.position = "absolute";
            ePnl.style.top = "0px";
            ePnl.style.left = "0px";
            ePnl.style.right = "";
            ePnl.style.bottom = "0px";
        }else if(oPnl.peRegion === df.ciRegionRight){ 
            if(this._oRegionRight){
                throw new df.Error(999, "The region setting (peRegion) in panel '{{0}}' is already used by panel '{{1}}'. Sibling panels may not share the same region setting.", this, [ oPnl._sName, this._oRegionRight._sName ]);
            }
        
            this._oRegionRight = oPnl;
            
            this._eRegionRight = ePnl = oPnl._eElem;
            this._eMainArea.appendChild(ePnl);

            ePnl.style.position = "absolute";
            ePnl.style.top = "0px";
            ePnl.style.left = "";
            ePnl.style.right = "0px";
            ePnl.style.bottom = "0px";
        }else if(oPnl.peRegion === df.ciRegionBottom){ 
            if(this._oRegionBottom){
                throw new df.Error(999, "The region setting (peRegion) in panel '{{0}}' is already used by panel '{{1}}'. Sibling panels may not share the same region setting.", this, [ oPnl._sName, this._oRegionBottom._sName ]);
            }
        
            this._oRegionBottom = oPnl;
            
            this._eRegionBottom = ePnl = oPnl._eElem;
            this._eMainArea.parentNode.appendChild(ePnl);
            
            ePnl.style.position = "";
            ePnl.style.top = "";
            ePnl.style.left = "";
            ePnl.style.right = "";
            ePnl.style.bottom = "";
        }else{
            throw new df.Error(999, "Invalid value for peRegion of '{{0}}'", this, [ oPnl._sName ]);
        }    
    }
},

/* 
Extend the element class with the WebScroll classname if pbScroll is true.
*/
genClass : function(){
    var sClass = this.getBase("df.WebBaseContainer_mixin").genClass.apply(this, arguments);

    if(this.pbScroll){
        sClass += " WebScroll";
    }
    
    return sClass;
},

// - - - - Sizing - - - -

/*
This recursive method is called as the start of a resize action. It calculates the minimal height 
that a container needs and it determines if the panel wants to stretch or not. Center, left and 
right panels can stretch and if they stretch then their parent wants to stretch as well. The 
resizeHorizontal and resizeVertical methods depend on the results of this method.

@private
*/
prepareSize : function(){
    var iHeight = 0, iMiddle = 0, iCur, i, iPrevWanted = this._iWantedHeight;
    
    this._bStretch = false;
   
    
    //  Determine content size
    if(this._bPanels){
        //  Recalculate positioning if switch is set
        if(this._bPositionChanged){
            this.placePanels();
            
            this._bPositionChanged = false;
        }
        
        //  Visit all panels and determine what height they want
        if(this._oRegionTop && this._oRegionTop.pbRender){
            iHeight += this._oRegionTop.prepareSize();
        }
        
        //  We take the highest of left, right and center
        if(this._oRegionCenter && this._oRegionCenter.pbRender){
            iMiddle = this._oRegionCenter.prepareSize();
            
            this._bStretch = this._oRegionCenter._bStretch || this._bStretch;
        }
        if(this._oRegionLeft && this._oRegionLeft.pbRender){
            iCur = this._oRegionLeft.prepareSize();
            
            iMiddle = (iCur > iMiddle ? iCur : iMiddle);
            
            //  Stretch if left panel wants to stretch
            this._bStretch = this._oRegionLeft._bStretch || this._bStretch;
        }
        if(this._oRegionRight && this._oRegionRight.pbRender){
            iCur = this._oRegionRight.prepareSize();
            
            iMiddle = (iCur > iMiddle ? iCur : iMiddle);
            
            //  Stretch if right panel wants to stretch
            this._bStretch = this._oRegionRight._bStretch || this._bStretch;
        }
        iHeight += iMiddle;
        
        if(this._oRegionBottom && this._oRegionBottom.pbRender){
            iHeight += this._oRegionBottom.prepareSize();
        }
        
         iHeight += this.getHeightDiff(true, true, true, true);
    }else{
        for(i = 0; i < this._aChildren.length; i++){
            if(this._aChildren[i].prepareSize && !(this._aChildren[i] instanceof df.WebView)){ //  Skip views, they are called by the WebApp
                this._aChildren[i].prepareSize();
            }
        }
        
        //  Recalculate positioning if switch is set
        if(this._bPositionChanged){
            this.position();
            this._iContentHeight = null;
            
            this._bPositionChanged = false;
        }
    
        if(this._bHasFill){
            if(!this._iContentHeight){
                this.resizeColumnLayout();
            }   
            iHeight += this._iContentHeight + this.getHeightDiff(true, true, true, true);
        }else{
            iHeight += this._eContent.clientHeight + this.getHeightDiff(true, true, true, false);    //this.getContentHeightDiff(true);// + 1;    //   We take one pixel extra due to pixel rounding
        }
    }
    
    //  Determine _iWantedHeight & _iMinHeight
    this._iMinHeight = iHeight;
    if(this.piHeight > 0){
        this._iWantedHeight = this.piHeight;
    }else{
        this._iWantedHeight = (iHeight > this.piMinHeight ? iHeight : this.piMinHeight);
    }
    //  Indicate if the size changed (so parents like the tab container can respond)
    this._bWantedChanged = iPrevWanted !== this._iWantedHeight;
    
    //  Determine if we want to stretch
    if(this.peRegion !== df.ciRegionTop && this.peRegion !== df.ciRegionBottom){
        if((this.piHeight <= 0 && this._bHasFill) || (this instanceof df.WebView && this.pbFillHeight)){
            this._bStretch = true;
        }        
    }
    
    //  Mark ourself as prepared for sizing
    this._bSizePrep = true;
    return this._iWantedHeight;
},

/*
This recursive method performs the horizontal size actions that are needed. It sizes left and right 
panels and sets the inner width (based on piMinWidth) which might cause a scrollbar. Horizontal 
sizing is done first so that vertical sizing can handle scrollbars that might appear.

@private
*/
resizeHorizontal : function(){
    var i, iWidth = 0, iSpaceTaken = 0;
    
    if(this._eElem){
		if(this._bPanels){
            //  Size the middle panels
            if(this._oRegionLeft){
                //  Determine width (use piWidth or calculate if not set)
                if(this._oRegionLeft.piWidth > 0){
                    iWidth = this._oRegionLeft.piWidth;
                }else if(this._oRegionRight && this._oRegionRight.pbRender){
                    iWidth = (this._eMainArea.clientWidth - (this._oRegionRight.piWidth || this._eMainArea.clientWidth / 3)) / 2;
                }else{
                    iWidth = (this._eMainArea.clientWidth / 2);
                }
                
                //  Apply the width
                this._oRegionLeft.setOuterWidth(iWidth);
                if(this._eRegionCenter){
                    this._eRegionCenter.style.left = (this._oRegionLeft.pbRender ? iWidth + "px" : "0px"); 
                }
            }
            if(this._oRegionRight){
                //  Determine width (use piWidth or calculate if not set)
                if(this._oRegionRight.piWidth > 0){
                    iWidth = this._oRegionRight.piWidth;
                }else if(this._oRegionLeft && this._oRegionLeft.pbRender){
                    iWidth = (this._eMainArea.clientWidth - (this._oRegionLeft.piWidth || this._eMainArea.clientWidth / 3)) / 2;
                }else{
                    iWidth = (this._eMainArea.clientWidth / 2);
                }
                
                //  Apply width
                this._oRegionRight.setOuterWidth(iWidth);
                if(this._eRegionCenter){
                    this._eRegionCenter.style.right = (this._oRegionRight.pbRender ? iWidth + "px" : "0px");
                }
            }
        }
        
	
        //  Call children
        for(i = 0; i < this._aChildren.length; i++){
            if(this._aChildren[i] instanceof df.WebBaseUIObject && !(this._aChildren[i] instanceof df.WebView)){ //  Skip views, they are called by the WebApp
                if(this._aChildren[i].pbRender && this._aChildren[i].resizeHorizontal){
                    
                    this._aChildren[i].resizeHorizontal();
                }
            }
        }
    }
},

/*
This recursive method performs the vertical sizing. It determines the size of sub panels and sets 
the inner size when needed. The height of the top and bottom panels is determined by their piHeight 
or their pre-calculated _iWantedHeight. Height of the middle area (left, center and right panels) is 
determined by the available space and whether they are set to stretch or not.

@private
*/
resizeVertical : function(){
    var iHeight, iMiddle, iMiddleSpace = 0, iMiddleWanted = 0, iCenter = 0, iLeft = 0, iRight = 0, iVSpace, iPanelHeight, bStretch = false, i;
    
    if(this._eElem){
		//  Make sure we are prepared for sizing (pre calculations are done)
        if(!this._bSizePrep){
            this.prepareSize();
        }
        
        if(this.piHeight > 0){
            iHeight = this.piHeight + this.getHeightDiff(true, false, false, false);
            
            bStretch = true;
        }else if(this._bStretch || (this instanceof df.WebPanel && (this.peRegion === df.ciRegionLeft || this.peRegion === df.ciRegionCenter || this.peRegion === df.ciRegionRight))){
            iHeight = this._eContainer.clientHeight + this.getHeightDiff(true, false, false, false);
            bStretch = true;
            
            //  This is needed to make oOrder function when rendered into a div with no height using displayView (pbFillHeight inside a panel)
            if(iHeight < this._iMinHeight){
                iHeight = this._iMinHeight;
            }
        }else{
            iHeight = this._iWantedHeight;
        }
        
		if(iHeight < this.piMinHeight){
            iHeight = this.piMinHeight;
            bStretch = true;
        }

        if(this._bPanels){
            iVSpace = iHeight;
            if(this._oRegionTop && this._oRegionTop.pbRender){
                iPanelHeight = this._oRegionTop._iWantedHeight;
            
                //  We need to stretch ourself if more space is required
                if(iPanelHeight > iVSpace){
                    iHeight = iHeight + this._oRegionTop._iWantedHeight - iVSpace;
                    iVSpace = iPanelHeight;
                }
                iVSpace -= iPanelHeight;
                
                this._oRegionTop.setOuterHeight(iPanelHeight);
            }
            
            if(this._oRegionBottom && this._oRegionBottom.pbRender){
                iPanelHeight = this._oRegionBottom._iWantedHeight;
            
                //  We need to stretch ourself if more space is required
                if(iPanelHeight > iVSpace){
                    iHeight = iHeight + iPanelHeight - iVSpace;                
                    iVSpace = iPanelHeight;
                }
                iVSpace -= iPanelHeight;
                
                this._oRegionBottom.setOuterHeight(iPanelHeight);
            }
            
            //  Determine the available space for the middle section
            iMiddleSpace = iVSpace - this.getHeightDiff(true, true, true, true);
            
            //  Determine the wanted height of the middle section
            if(this._oRegionLeft && this._oRegionLeft.pbRender){
                iLeft = this._oRegionLeft._iWantedHeight;
            }
            if(this._oRegionCenter && this._oRegionCenter.pbRender){
                iCenter = this._oRegionCenter._iWantedHeight;
            }
            if(this instanceof df.WebApp){
                iCenter = (this._oCurrentView && this._oCurrentView._iWantedHeight) || 0;
            }
            if(this._oRegionRight && this._oRegionRight.pbRender){
                iRight = this._oRegionRight._iWantedHeight;
            }
            iMiddleWanted = Math.max(iLeft, iCenter, iRight);
            
            //  Determine if we should stretch to occupy the available space or if we only take whats needed
            if(bStretch || (this._oRegionLeft && this._oRegionLeft._bStretch) || (this._oRegionCenter) || (this._oRegionRight && this._oRegionRight._bStretch)){
                iMiddle = iMiddleSpace;
            }else{
                iMiddle = iMiddleWanted;
            }

            
            //  Apply middle height to the main area
            if(iMiddle > 0){
                this._eMainArea.style.height = iMiddle + "px";
            }
            
            //  Provide a hook for the webapp to size the view
            this._iMiddleHeight = iMiddle;
        }else{
            this.resizeColumnLayout();
            
            //  Scrollbars
            this.setInnerHeight(iHeight);
        }
        

        
        //  Call children
        for(i = 0; i < this._aChildren.length; i++){
            if(this._aChildren[i] instanceof df.WebBaseUIObject && !(this._aChildren[i] instanceof df.WebView)){  //  Skip views, they are called by the WebApp
                if(this._aChildren[i].pbRender){
                    if(this._aChildren[i].resizeVertical){
                        this._aChildren[i].resizeVertical();
                    }else if(this._aChildren[i].resize){
                        this._aChildren[i].resize();
                    }
                }
            }
        }
        
        this._bSizePrep = false;
    }
},

setOuterHeight : function(iHeight){
    iHeight -= this.getHeightDiff(true, false, false, false);
    this._eElem.style.height = (iHeight > 0 ? iHeight + "px" : "");
},

setInnerHeight : function(iHeight){
    if(iHeight > 0){
        if(iHeight !== this._iLastInnerHeight){
            this._iLastInnerHeight = iHeight;
            
            iHeight -= this.getHeightDiff(true, true, false, false);
            this._eSizer.style.minHeight = (iHeight > 0 ? iHeight + "px" : "");
        }
    }else if(this._iLastInnerHeight > 0){
        this._eSizer.style.minHeight = "";
    }
},

setOuterWidth : function(iWidth){
    iWidth -= df.sys.gui.getHorizBoxDiff(this._eElem, 1);
    this._eElem.style.width = (iWidth > 0 ? iWidth + "px" : "");
},

setInnerWidth : function(iWidth){
    iWidth -= df.sys.gui.getHorizBoxDiff(this._eElem, 0);
    iWidth -= df.sys.gui.getHorizBoxDiff(this._eSizer, 1);
    this._eSizer.style.width = (iWidth > 0 ? iWidth + "px" : "");
},

/*
This method is called by the resize method to calculate to resize controls inside this container. It 
calculates the heights of the controls with pbFillHeight set to true.

@private
*/
resizeColumnLayout : function(){
    var oChild, i, x, iHeight = 0, iRow = 0, iCol = 0, iRowHeight = 0, iMinHeight, iSpace, aStretch = [], iSize, oStretch, iCount = this.piColumnCount, iIndex, iSpan;

    //  FIX: On IE8 we are missing three pixels (don't know why)
    if(df.sys.isIE && df.sys.iVersion <= 8){
        iHeight = 3;
    }
    
    //  Only do this if there are stretching controls
    if(this._bHasFill){
        //  Loop through children
        for(i = 0; i < this._aUIObjects.length; i++){
            oChild = this._aUIObjects[i];
            
            if(oChild.pbRender){
                //  Determine child index and span
                iIndex = (oChild.piColumnIndex + oChild.piColumnSpan <= iCount ? oChild.piColumnIndex : 0);
                if(iIndex + oChild.piColumnSpan > iCount || oChild.piColumnSpan <= 0){
                    iSpan = iCount - iIndex;
                }else{
                    iSpan = oChild.piColumnSpan;
                }
                
                //  Detect that we move to the next row
                if(iCol > iIndex || iCol + iSpan > iCount){
                    //  Switch between stretch row
                    if(oStretch){
                        oStretch.iHeight = iRowHeight;
                        aStretch.push(oStretch);
                        oStretch = null;
                    }else{
                        iHeight = iHeight + iRowHeight;
                    }
                    
                    //  Reset values
                    iRowHeight = 0;
                    iRow++;
                    iCol = 0;
                }
                
                //  Check if this is a stretcher
                if(oChild.pbFillHeight){
                    //  Remember stretcher
                    if(oStretch){
                        oStretch.aItems.push(oChild);
                    }else{
                        oStretch = {
                            aItems : [ oChild ],
                            iHeight : 0
                        };
                    }
                    
                    //  Obey minimum height
                    if(oChild.getMinHeight){
                        iMinHeight = oChild.getMinHeight();
                    }else{
                        iMinHeight = oChild.piMinHeight;
                    }
                    
                    if(iRowHeight < iMinHeight){
                        iRowHeight = iMinHeight;
                    }
                }else{
                    //  Check if this is the highest item in this row, if so we count this one
                    if(oChild._eElem.offsetHeight > iRowHeight){
                        iRowHeight = oChild._eElem.offsetHeight;
                    }
                }
                
                //  Remember current pos
                iCol = iIndex + (iSpan || 1);
            }
        }
        
        //  Update administration for the last row
        if(oStretch){
            oStretch.iHeight = iRowHeight;
            aStretch.push(oStretch);
        }else{
            iHeight += iRowHeight;
        }
        
        this._iContentHeight = iHeight;
        
        //  Determine available space
        iSpace = this._eContainer.clientHeight + this.getHeightDiff(true, false, false, false);
		if(iSpace < this.piMinHeight){
            iSpace = this.piMinHeight;
        }
        iSpace = iSpace - this.getHeightDiff(true, true, true, true);
        
        iSpace = iSpace - iHeight;
        
        //  Loop through stretch rows
        for(i = 0; i < aStretch.length; i++){
            oStretch = aStretch[i];
            
            //  Calculate height for this stretch row
            iSize =  iSpace / (aStretch.length - i);
            iSize--;    // FIX: Take an extra pixel here (don't know why, needed for firefox)
            
            //  Obey minimum row height
            this._iContentHeight = this._iContentHeight + oStretch.iHeight;
            
            if(iSize < oStretch.iHeight){
                iSize = oStretch.iHeight;
            }
            
            //  Set heights
            for(x = 0; x < oStretch.aItems.length; x++){
                oStretch.aItems[x].sizeHeight(iSize);
            }
            
            //  Space is now taken
            iSpace -= iSize;
        }
    }
},

/*
This method calculates and sets the positioning CSS attributes for controls inside this container 
based on the column layout system. The horizontal positioning is done in percentages where the 
number of columns determines the precision that is used.

@private
*/
position : function(){
    var i, oChild, iCol = 0, iCount = this.piColumnCount, iIndex, iSpan;

    if(iCount <= 0){
        throw new df.Error(999, "Invalid column count on '{{0}}'", this, [ this.getLongName() || "oWebApp" ]);
    }
    
    //  Reset indicator for fill height components
    this._bHasFill = false;
    
    //  Loop through children
    for(i = 0; i < this._aUIObjects.length; i++){
        oChild = this._aUIObjects[i];
        
        if(oChild._eElem && oChild.pbRender && oChild instanceof df.WebBaseControl){
            //  Determine child index and span
            iIndex = (oChild.piColumnIndex + (oChild.piColumnSpan || 1) <= iCount ? oChild.piColumnIndex : 0);
            if(iIndex + oChild.piColumnSpan > iCount || oChild.piColumnSpan <= 0){
                iSpan = iCount - iIndex;
            }else{
                iSpan = oChild.piColumnSpan;
            }
            
            //  All controls float
            oChild._eElem.style.styleFloat = "left";    // IE8 FIX
            oChild._eElem.style.cssFloat = "left";
            
            //  Detect new row
            if(iCol > iIndex || iCol + iSpan > iCount){
                oChild._eElem.style.clear = "left";
                iCol = 0;
            }else{
                oChild._eElem.style.clear = "none";
            }
            
            //  Calculate whitespace on the left
            oChild._eElem.style.marginLeft = ((Math.floor((10000 / iCount)) / 100) * (iIndex - iCol)) + "%";
            
            //  Remember current pos
            iCol = iIndex + (iSpan || 1);
            
            //  Calculate width
            if(iSpan === iCount){
                oChild._eElem.style.width = "100%";
            }else{
                oChild._eElem.style.width =((Math.floor((10000 / iCount) ) / 100) * iSpan) + "%";
            }
        }
        
        //  Indicate when we find a fill height component (that means we need to resize it)
        this._bHasFill = this._bHasFill || oChild.pbFillHeight;
    }
            
            
},

/*
This method determines the 'minimal height' required by this panel and its children. If there are 
nested panels it will return the sum of the content height of these panels. If this panel has 
controls it will measure the total size of these. When stretching controls are there 
(with pbFillHeight) set to true it uses the _iContentHeight property which is calculated by the 
resizeColumnLayout method. Else it simply takes the height of the content div element.

@private
*/
getRequiredHeight : function(){
    //  Make sure we are prepared for sizing (pre calculations are done)
    if(!this._bSizePrep){
        this.prepareSize();
    }
    
    this._bSizePrep = false;
    
    return this._iWantedHeight;
},

getAvailableHeight : function(){
    return (this._eSizer.clientHeight > this._eElem.clientHeight ? this._eSizer.clientHeight : this._eElem.clientHeight);
},

/*
Calculates the height differences between the elements of the container. These are margins, paddings 
and borders. The parameter Booleans indicate which parts should be included. The illustration shows  
the different parts.

bOut        Container
            +------
bIn         |  Sizer
            |  +------
bContentOut |  |  Content
            |  |  +------
bContentIn  |  |  |

@param  bOut        Margin & border of the container element.
@param  bIn         Padding of the container + margin & border of the sizer.
@param  bContentOut Padding of the sizer + margin & border of the content element.
@param  bCOntentIn  Padding of the content element.
@private
*/
getHeightDiff : function(bOut, bIn, bContentOut, bContentIn){
    var iHeight = 0;
    
    if(bOut){
        if(this._eContainer){
            iHeight += df.sys.gui.getVertBoxDiff(this._eContainer, 1);
        }
    }
    if(bIn){
        if(this._eContainer){
            iHeight += df.sys.gui.getVertBoxDiff(this._eContainer, 2);
        }
        if(this._eSizer){
            iHeight += df.sys.gui.getVertBoxDiff(this._eSizer, 1);
        }
    }
    if(bContentOut){
        if(this._eSizer){
            iHeight += df.sys.gui.getVertBoxDiff(this._eSizer, 2);
        } 
        if(this._eMainArea){//  Allow paddings on the main area, even while this space will be below the top panel it still needs to be recogned with
            iHeight += df.sys.gui.getVertBoxDiff(this._eMainArea, 2);
        } 
        if(this._eContent){
            iHeight += df.sys.gui.getVertBoxDiff(this._eContent, 1);
        }
    }
    if(bContentIn){
        if(this._eContent){
            iHeight += df.sys.gui.getVertBoxDiff(this._eContent, 2);
            iHeight += 1; // Always add 1 pixel for pixel rounding issues
        }
    }
    
    return iHeight;
},

/*
Calculates the width differences between the elements of the container. These are margins, paddings 
and borders. The parameter Booleans indicate which parts should be included. The illustration shows  
the different parts.

bOut        Container
            +------
bIn         |  Sizer
            |  +------
bContentOut |  |  Content
            |  |  +------
bContentIn  |  |  |

@param  bOut        Margin & border of the container element.
@param  bIn         Padding of the container + margin & border of the sizer.
@param  bContentOut Padding of the sizer + margin & border of the content element.
@param  bCOntentIn  Padding of the content element.
@private
*/
getWidthDiff : function(bOut, bIn, bContentOut, bContentIn){
    var iWidth = 0;
    
    if(bOut && this._eElem){
        iWidth += df.sys.gui.getHorizBoxDiff(this._eElem, 0);
    }
    if((bOut || bIn) && this._eContainer){
        iWidth += df.sys.gui.getHorizBoxDiff(this._eContainer, (bOut && bIn ? 0 : (bOut ? 1 : 2)));
    }
    if((bIn || bContentOut) && this._eSizer){
        iWidth += df.sys.gui.getHorizBoxDiff(this._eSizer, (bIn && bContentOut ? 0 : (bIn ? 1 : 2)));
    }
    if(bContentOut && this._eMainArea){//  Allow paddings on the main area, even while this space will be below the top panel it still needs to be recognized with
        iWidth += df.sys.gui.getHorizBoxDiff(this._eMainArea, 2);
    }
    if((bContentOut || bContentIn) && this._eContent){
        iWidth += df.sys.gui.getHorizBoxDiff(this._eContent, (bContentOut && bContentIn ? 0 : (bContentOut ? 1 : 2)));
    }
    
    return iWidth;
},

/*
This method determines the vertical space taken by the container component itself. It only 
calculates the space that is inside the element that is actually sized.

@return Amount of pixels taken.
*/
getContentWidthDiff : function(){
    var iWidth = 0;
    
    if(this._eContent){
        iWidth += df.sys.gui.getHorizBoxDiff(this._eContent);
    }
    
    return iWidth;
},

onScroll : function(oEvent){
    var oWebApp = this.getWebApp();
    if(oWebApp){
        oWebApp.notifyScroll(this);
    }
},

// - - - - Special - - - -

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

// - - - - Setters - - - - 

set_piWidth : function(iVal){
    this.piWidth = iVal;
    
    if(this._eElem){
        this.sizeChanged();
    }
},

set_piHeight : function(iVal){
    this.piHeight = iVal;
    
    if(this._eElem){
        this.sizeChanged();
    }
},

set_piMinHeight : function(iVal){
    this.piMinHeight = iVal;
    
    if(this._eElem){
        this.sizeChanged();
    }
},

set_piMinWidth : function(iVal){
    this.piMinWidth = iVal;
    
    if(this._eElem){
        this.sizeChanged();
    }
},

set_piColumnCount : function(iVal){
    this.piColumnCount = iVal;
    
    if(this._eElem){
        this.sizeChanged(true);
    }
},

set_psBackgroundColor : function(sVal){
	if(this._eContainer){
        this._eContainer.style.background = sVal || '';
    }
},

/* 
Enables / disables scrolling by toggling the WebScroll CSS class on the main element.

@param  bVal    The new value.
@private
*/
set_pbScroll : function(bVal){
    if(this._eElem){
        df.dom.toggleClass(this._eElem, "WebScroll", bVal);
    }
}

});

//  Generate the actuall class based on WebBaseUIObject using the mixin
df.WebBaseContainer = df.mixin("df.WebBaseContainer_mixin", "df.WebBaseUIObject");