


df.WebFloatingPanel = function(sName, oPrnt){
    df.WebFloatingPanel.base.constructor.apply(this, arguments);
    
    this.prop(df.tInt, "piWidth", 0);
    this.prop(df.tInt, "piHeight", 0);
    
    this.prop(df.tString, "psFloatByControl", "");
    this.prop(df.tBool, "pbHideOnBlur", false);
    
    this._eMask = null;
    
    this.pbScroll = true;
    this.pbVisible = false;
    this._bWrapDiv = false;
    this._sControlClass = "WebFlPnl";
};
df.defineClass("df.WebFloatingPanel", "df.WebBaseContainer", {

render : function(){
    var eViewPort, eElem;
    
    eElem = df.WebFloatingPanel.base.render.apply(this, arguments);
    
    //document.body.appendChild(eElem);
    eViewPort = document.body;
    eViewPort.appendChild(eElem);
    
    return null;
},
 
openHtml : function(aHtml){
    aHtml.push('<div class="', this.genClass(), ' WebFP_Hidden', (this.psFloatByControl ? ' WebFP_ArrowTop' : ''), '"');
    if(this.psHtmlId){
        aHtml.push(' id="', this.psHtmlId, '"');
    }
    
    //  Insert the object name so the HTML element can be traced back to the right object
    aHtml.push(' data-dfobj="', this.getLongName(), '"' ); 
    
    aHtml.push(' tabindex="0" style=" ',  (this.pbRender ? '' : 'display: none;'), '"'); //'visibility: hidden;"');
    aHtml.push('>');
    
    aHtml.push('<div class="WebContainer">');
    
    df.WebFloatingPanel.base.openHtml.apply(this, arguments);
    
},

closeHtml : function(aHtml){
    df.WebFloatingPanel.base.closeHtml.apply(this, arguments);
    aHtml.push('</div>');
    aHtml.push('<div class="WebFP_Arrow"></div>');
    aHtml.push('</div>');
    

},

afterRender : function(){
    this._eArrow = df.dom.query(this._eElem, "div.WebFP_Arrow");

    df.WebFloatingPanel.base.afterRender.apply(this, arguments);
    
    df.events.addDomCaptureListener("focus", this._eElem, this.onCaptureFocus, this);
    df.events.addDomCaptureListener("blur", this._eElem, this.onCaptureBlur, this);
},


show : function(){
    var that = this;
    
    //  Generate a mask to intercept clicks outside to hide the menu (mobile only)
    if(this.pbHideOnBlur && df.sys.isMobile){
        this._eMask = df.dom.create('<div class="WebMenu_Mask">&nbsp;</div>');
        
        this._eElem.parentNode.insertBefore(this._eMask, this._eElem);
        df.events.addDomListener("click", this._eMask, this.onMaskTouch, this);
    }
    
    
    //this._eElem.style.visibility = "";
    this.positionPnl();
    this.pbVisible = true;
    
    if(this._tHideBlurTimeout){
        clearTimeout(this._tHideBlurTimeout);
        this._tHideBlurTimeout = null;
    }
    
    
    df.dom.removeClass(that._eElem, "WebFP_Hidden");
    df.dom.addClass(that._eElem, "WebFP_Visible");
    
    setTimeout(function(){
        if(!that.focus()){
            that._eElem.focus();
        }
    }, 20);

    this.addSync("pbVisible");
},

positionPnl : function(){
    var oObj, oRect, eRef, iTop = 0, iLeft = 0, iRight = -1, iArrow = 0, iScreenWidth, iScreenHeight, iWidth, iHeight;
    
    iWidth = this.piWidth;
    iHeight = this.piHeight;
    
    iScreenWidth = df.dom.windowWidth();
    iScreenHeight =  df.dom.windowHeight();
     
    if(this.psFloatByControl){  //  Position relative to a control (usually below the control)
        oObj = this.getWebApp().findObj(this.psFloatByControl);
        
        if(oObj){
            eRef = oObj._eElem;
            if(oObj.getTooltipElem){
                eRef = oObj.getTooltipElem() || eRef;
            }
            
            oRect = df.sys.gui.getBoundRect(eRef);
            
            iTop = oRect.bottom;
            iLeft = oRect.left + (oRect.width / 2) - (this.piWidth / 2);
            
            if(iLeft < 5){
                iLeft = 5;
            }
            
            //  Position Arrow
            iArrow = oRect.left + oRect.width / 2 - iLeft;
            
        }else{
            iTop = this.piTop;
            iLeft = this.piLeft;
        }
        
        df.dom.addClass(this._eElem, "WebFP_ArrowTop");
    }
    
    if(iLeft + iWidth > iScreenWidth){
        iLeft = -1;
        iRight = 10;
    }
    
    if(iTop + iHeight > iScreenHeight){
        if(iHeight > 0){
            iHeight = iScreenHeight - iTop - 30;
            //(iScreenHeight - iTop > 0 ? iScreenHeight - iTop : 0);
        }else{
            iTop = (iScreenHeight - iHeight > 0 ? iScreenHeight - iHeight : 0);
        }
    }
    
    this._eElem.style.top = iTop + "px";
    if(iLeft >= 0){
        this._eElem.style.left = iLeft + "px";
    }
    if(iRight >= 0){
        this._eElem.style.right = iRight + "px";
    }
    this._eArrow.style.left = iArrow + "px";
    
    this.setOuterWidth(this.piWidth);
    if(iHeight > 0){
        this._eContainer.style.height = iHeight + "px";
        this._eElem.style.maxHeight = "";
    }else{
        iHeight = iScreenHeight - iTop - 30;// - this.getHeightDiff(true, false, false, false);
        this._eContainer.style.height = "";
        this._eElem.style.maxHeight = iHeight + "px";
    }
    
    
    
     //	Call standard resize procedures
    this.resizeHorizontal();
    this.resizeVertical();
},

setInnerHeight : function(iHeight){
    //  ToDo: This is probably not the best way of doing this as the case where a scrollbar would actually be needed might be ruined by this
    if(iHeight > this._eContainer.clientHeight){
        iHeight = this._eContainer.clientHeight;
    }
    
    df.WebFloatingPanel.base.setInnerHeight.call(this, iHeight);
    
},


hide : function(){
    var that = this;
    df.dom.addClass(that._eElem, "WebFP_Hidden");
    df.dom.removeClass(that._eElem, "WebFP_Visible");
    this.pbVisible = false;
    
    //  Remove mobile mask that might have been created
    if(this._eMask){
        df.events.removeDomListener("click", this._eMask, this.onMaskTouch);
        this._eMask.parentNode.removeChild(this._eMask);
        this._eMask = null;
    }
    
    this.addSync("pbVisible");
},

onCaptureFocus : function(oEvent){
    if(this._tHideBlurTimeout){
        clearTimeout(this._tHideBlurTimeout);
        this._tHideBlurTimeout = null;
    }
},

onCaptureBlur : function(oEvent){
    var that = this;
    
    if(this._tHideBlurTimeout){
        clearTimeout(this._tHideBlurTimeout);
    }
    
    this._tHideBlurTimeout = setTimeout(function(){
        if(that.pbHideOnBlur){
            that.hide();
        }
        that._tHideBlurTimeout = null;
        
    }, 150);
},

/* 
Handles the click on the mask behind the floating panel and hides the panel.

@param  oEvent  See df.events.DOMEvent.
*/
onMaskTouch : function(oEvent){
    if(this.pbHideOnBlur){
        this.hide();
    }
},

resize : function(){
    this.positionPnl();
    
    this.resizeHorizontal();
    this.resizeVertical();
}

});



