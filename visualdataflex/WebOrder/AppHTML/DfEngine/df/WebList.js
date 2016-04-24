/*
Class:
    df.WebList
Extends:
    df.WebBaseControl

This is the client-side representation of the cWebList control which shows a multi column list of 
data. The nested cWebColumn objects represent the grid columns. The cWebCheckboxColumn and 
cWebComboColumn classes will represent different types of columns. The cWebList is readonly and only 
allows the users to select a row. The cWebList can be data bound and then it will automatically find 
 records.

Where the server-side is responsible for providing the data the client-side is only responsible for 
calling the server to load the data and rendering the list. It will also call the server when the 
current row is changed. The client works with a cache that is usually bigger than the displayed 
amount of rows. It loads chunks of data on the background while scrolling and renders only a part of 
the cached data to the DOM (usually the visible rows and a few above and below). The cache usually 
isn't cleared by scrolling (except when jumping to the end of the beginning of the list). For non 
data bound lists the entire set of data is usually loaded at once because that is easier to 
implement for the application developer.
    
Revision:
    2011/12/02  (HW, DAW) 
        Initial version.
*/

df.tWebRow = { 
    sRowID : df.tString, 
    sCssClassName : df.tString, 
    aCells : [ { 
        sValue : df.tString,  
        sTooltip : df.tString,
        sCssClassName : df.tString,
        aOptions : [ df.tString ]
    } ] 
};

df.WebList = function WebList(sName, oParent){
    df.WebList.base.constructor.call(this, sName, oParent);
    
    this.prop(df.tString, "psCurrentRowID", "");
    this.prop(df.tInt, "piCurrentRowIndex", -1);
    this.prop(df.tInt, "piRowCount", 0);
    
    this.prop(df.tBool, "pbShowHeader", true);
    this.prop(df.tBool, "pbShowSelected", true);
    
    this.prop(df.tBool, "pbDataAware", true);
    this.prop(df.tInt, "peDbGridType", df.gtAutomatic);
    this.prop(df.tBool, "pbOfflineEditing", false);
    
    this.prop(df.tBool, "pbAutoSearch", true);
    this.prop(df.tBool, "pbColumnSortable", true);
    this.prop(df.tBool, "pbReverseOrdering", true);
    this.prop(df.tInt, "piSortColumn", 0);
    
    this.prop(df.tInt, "piMinHeight", 0);
    this.prop(df.tInt, "piHeight", 0);
    this.prop(df.tBool, "pbColumnsResizable", true);
    this.prop(df.tString, "psPlaceHolder", "");


    
    // @privates
    this._aColumns = [];        //  References to the column objects
    this._aCache = [];          //  Array with the rows

    this._bFirst = false;       //  Indicates if we have the first record in cache
    this._bLast = false;        //  Indicates if we have the last record in cache
    this._bLoading = false;     //  Indicates if the grid is already loading records    
    this._bNoRender = false;    //  Tempolary disables the rendering while initializing or updating the cache
    
    this._bZebraTop = false;    //  Indicates wether the next row inserted on top should be a 'Odd' colored row
    this._bZebraBottom = false; //  Indicates wether the next row inserted at the bottom should be a 'Odd' colored row
    
    this._iScrollOffsetPx = 0;  //  The number of (virtual) pixels from the top of the list to the displayed part
    this._iRowDispOffset = 0;   //  The first row that is currently rendered
    this._iViewOffset = 0;      //  The number of rows rendered above the first visible row
    this._iRowsDispOffset = 0;  //  The total offset from the top of the cache to the first rendered row
    this._iRowDispLast = 0;     //  The last displayed row
    
    this._iLastScrollbarSet = 0;    //  The last scrollTop set to the scrollbar so we know if we need to redraw on this event
    this._bScrollbarDirty = false;  //  Sometimes when not rendered yet the scrollbar doesn't update properly, this property indicates that it is still off and needs to be corrected
    
    this._iRowHeight = 0;       //  The height of a row in pixels
    this._iTableHeight = 0;     //  The height of the table in pixels
    
    this._iPrefViewOffset = 8;      //  The preferred view offset (amount of rows rendered that are not visible)
    this._iMaxViewOffsetDiff = this._iPrefViewOffset / 2;      //  The preferred view offset (amount of rows rendered that are not visible)
    this._iPrevCacheOffset = 25;    //  The preferred amount of rows in the cache above and below the rendered rows
    
    this._bLozingFocus = false;     //  There is a short timeout when lozing the focus before really lozing it
    this._bPreventSubmit = false;   //  If true the double click will not triger the onsubmit. This is used by OnTableClick to explicitly prevent the OnSubmit if OnRowClick is fired.
    
    this._iRowChangeCount = 0;      //  Used to determine if we are still on the same rowchange
    
    this._iRound = (df.sys.isIE && df.sys.iVersion <= 8 ? 1 : 100);    //    This determines the decimals used (1 is none, 100 is 2) when rounding column widths (IE8 has issues with decimals on table cells)
    this._iColMin = 20;            //    Determines the minimum percentage available
    
    this._bNoSearch = false;         //  If set to true the auto search will not respond on keypress events (usually temporary set from onKeyDown for FireFox)
    
    this._aColWidths = [];
    this._iAutoScroll = 0;      //  Used by the kinetic scrolling system to indicate that we are still "scrolling"
    this._iAutoScrollIncr = 1;
    this._bFirstDraw = false;   //  Indicates if we drawed the list content for the first time
    
    this._eBody = null;
    this._eTableWrp = null;
    this._eTable = null;
    this._eScrollbar = null;
    this._eScrollStretch = null;
    this._eBodyWrp = null;
    this._eHead = null;
    this._eHeadWrp = null;

    this.event("OnRowClick", df.cCallModeWait);
    
    //  Configure super classes
    this.piMinHeight = 200;
    this.pbShowLabel = false;
    this.addSync("piCurrentRowIndex");
    this.addSync("psCurrentRowID");
    this.addSync("piRowCount");
    
    //  Actions we need to wait for due to integrety
    this.setActionMode("HandleProcessDataSet", df.cCallModeWait);
    this.setActionMode("ChangeCurrentRow", df.cCallModeWait);
    
    this._sControlClass = "WebList";
    
    
};
df.defineClass("df.WebList", "df.WebBaseControl",{


// - - - - - - - Initialization (Control API) - - - - - - -

openHtml : function(aHtml){
    df.WebList.base.openHtml.call(this,aHtml);
    
    this.prepareLayout();
    
    
    aHtml.push('<div class="WebList_Head"', (this.pbShowHeader ? '' : ' style="display:none"'), '>');
    aHtml.push('<div class="WebList_HeadWrp', (this.pbColumnsResizable ? ' WebList_ColResizable' : ''), '">');
    this.headerHtml(aHtml);
    aHtml.push('</div>');
    aHtml.push('</div>');
    aHtml.push('<div class="WebList_BodyWrp" tabindex="0">');
    
    aHtml.push('<div class="WebList_Scroll" tabindex="-1"><div class="WebList_Stretcher" style="width: 1px;"></div></div>');
    
    aHtml.push('<div class="WebList_Body', (this.pbShowSelected ? ' WebList_ShowSelected' : ''), '">');
    
    
    
    aHtml.push('<div class="WebList_TableWrp">');
    
    aHtml.push('<div class="WebList_Table">');
    
    aHtml.push('</div></div></div>');
    
    aHtml.push('<div style="clear: both"></div>');
    
},

headerHtml : function(aHtml){
    var sCssClass, i, oCol, oCurCol, oPrevCol;
    
    aHtml.push('<table>');
    this.resizeRowHtml(aHtml);
    aHtml.push('<tr>');
    
    for(i = 0; i < this._aColumns.length; i++){
        
        oCol = this._aColumns[i];
        
        if(oCol.pbRender){
            oPrevCol = oCurCol;
            oCurCol = oCol;
            
            if(oCol.pbNewLine){
                aHtml.push('</tr><tr>');
            }
        
            //  Determine column CSS class
            sCssClass = "WebList_ColHead";
            if(i === this.piSortColumn){
                sCssClass += (this.pbReverseOrdering ? " WebList_SortedReverse" : " WebList_Sorted");
            }
            if(this.pbColumnSortable && oCol.pbSortable){
                sCssClass += " WebList_Sortable";
            }
            sCssClass += " " + this.cellClass(oCol, null);
                    
            
            aHtml.push('<th class="', sCssClass, '" data-dfcol="', i, '"');
            if(oCol.piListRowSpan > 1){
                aHtml.push(' rowspan="', oCol.piListRowSpan, '"');
            }
            if(oCol.piListColSpan > 1){
                aHtml.push(' colspan="', oCol.piListColSpan, '"');
            }
            if(oCol.psToolTip){
                aHtml.push(' title="', df.dom.encodeHtml(oCol.psToolTip), '"');
            }
            
            aHtml.push('><div>');
            if(oPrevCol && oPrevCol.pbResizable){
                aHtml.push('<div class="WebList_ColSep" data-dfcol="', (oCol._iCol - 1), '"></div>');
            }
            aHtml.push('<div class="WebList_ColCap">', (oCol.psCaption || '&nbsp;'), '</div>');
            aHtml.push('</div></th>');

        }
        
    }
    aHtml.push('</tr></table>');
    
},

resizeRowHtml : function(aHtml){
    var i, aCols = this._aColWidths;
    
    aHtml.push('<colgroup>');
    
    
    for(i = 0; i < aCols.length; i++){
        if(aCols[i].bFixed){
            aHtml.push('<col style="width: ', aCols[i].iPixels, 'px"></col>');
        }else{
            aHtml.push('<col style="width: ', aCols[i].iPercent, '%"></col>');
        }
    }
    
    
    aHtml.push('</colgroup>');
},

closeHtml : function(aHtml){
    
    aHtml.push('</div>');
    
    df.WebList.base.closeHtml.call(this,aHtml);
},

afterRender : function(){
    var fHandler;

    //this._eTable = df.dom.query(this._eElem, "div.WebList_TableWrp > table");
    this._eBody = df.dom.query(this._eElem, "div.WebList_Body");
    this._eTableWrp = df.dom.query(this._eElem, "div.WebList_TableWrp");
    this._eTable = df.dom.query(this._eElem, "div.WebList_Table");
    this._eScrollbar = df.dom.query(this._eElem, "div.WebList_Scroll");
    this._eScrollStretch = df.dom.query(this._eElem, "div.WebList_Scroll > div.WebList_Stretcher");
    this._eBodyWrp = df.dom.query(this._eElem, "div.WebList_BodyWrp");
    this._eHead = df.dom.query(this._eElem, "div.WebList_Head");
    this._eHeadWrp = df.dom.query(this._eElem, "div.WebList_HeadWrp");
    this._eControl = this._eFocus = this._eBodyWrp; // df.dom.query(this._eElem, "a.WebList_FocusHolder");
    
    df.WebList.base.afterRender.call(this);
    
    df.events.addDomListener("scroll", this._eScrollbar, this.onScrollbarScroll, this);
    df.events.addDomMouseWheelListener(this._eBody, this.onMouseWheelScroll, this);
    
    if(window.PointerEvent){    //  Microsofts new standard adopted by W3C for touch / mouse & pen events as of IE11
        df.events.addDomListener("pointerdown", this._eBody, this.onPointerDown, this);
    }else{
        df.events.addDomListener("touchstart", this._eBody, this.onTouchStart, this);
    }
    
    df.events.addDomListener("click", this._eTableWrp, this.onTableClick, this);
    df.events.addDomListener("dblclick", this._eTableWrp, this.onTableDblClick, this);
    df.events.addDomListener("click", this._eElem, this.onListClick, this);
    df.events.addDomListener("click", this._eHead, this.onHeadClick, this);
    df.events.addDomListener("mousedown", this._eHead, this.onHeadMouseDown, this);
    
    df.events.addDomListener("keydown", this._eFocus, this.onKeyDown, this);
    df.events.addDomListener("keypress", this._eFocus, this.onKeyPress, this);
    
    if(!df.sys.gui.getTransformProp()){
        this._eTable.style.position = "absolute";
    }
    
    //  We set _bRenderChildren to true so that events like afterShow properly reach columns components (needed for previewer as well)
    this._bRenderChildren = true;
},

/* 
Augment destroy to remove the rendered list before the base class will visit all elements.

@private
 */
destroy : function(){
    //  Remove rendered data to optimize clearing of DOM handlers`
    if(this._eTable){
        this._eTable.innerHTML = "";
    }
    
    df.WebList.base.destroy.call(this);
    
    this._eBody = null;
    this._eTableWrp = null;
    this._eTable = null;
    this._eScrollbar = null;
    this._eScrollStretch = null;
    this._eBodyWrp = null;
    this._eHead = null;
    this._eHeadWrp = null;
    
    this._aColumns = null;
},

afterRenderChildren : function(){

},

// - - - - - - - Display & scroll - - - - - - -

getScrollOffsetPx : function(){
    return this._iScrollOffsetPx;
    
    //return this._eScrollbar.scrollTop;
},

scroll : function(iDelta, bSnap, bFromScrollbar){
    var iMaxPX, iOffset;
    
    //  Determine new offset
    iOffset = this.getScrollOffsetPx();
    iOffset += iDelta;
    
    //  Check boundaries (if not snapping because if snapping scrollTo will check the boundaries)
    if(!bSnap){
        iMaxPX = this.getMaxPX();
        
        if(iOffset > iMaxPX){
            iOffset = iMaxPX;
        }
        if(iOffset < 0){
            iOffset = 0;
        }
    }
    
    //  Perform actual scrolling
    this.scrollTo(iOffset, bSnap, bFromScrollbar);
},

scrollTo : function(iOffset, bSnap, bFromScrollbar){
    var iRowOffset, iMaxPX;
    
    if(iOffset !== this._iScrollOffsetPx){
        iMaxPX = this.getMaxPX();
    
        //  Snap to row
        if(bSnap){
            iRowOffset = Math.round(iOffset / (this._iRowHeight || 20));
            
            if(iRowOffset > this._aCache.length){
                iRowOffset = this._aCache.length;
            }
            
            iOffset = iRowOffset * (this._iRowHeight || 20);
            
            //  Check boundaries
            if(iOffset > iMaxPX){
                iOffset = iMaxPX;
            }
            if(iOffset < 0){
                iOffset = 0;
            }
        }
        
        this._iScrollOffsetPx = iOffset;
    
        //  Update scrollbar 
        iOffset =  Math.round(iOffset);
        if(!bFromScrollbar && iOffset >= 0 && iOffset <= iMaxPX){
            this.updateScrollbarPos(iOffset);
        }

        this.updatePosition();
        this.updateCache();
    }
},

aniScroll : function(iDelta, iLengthMS){
    var that = this, iFrom, tStart, tEnd, iAuto;
     // t: current time, b: begInnIng value, c: change In value, d: duration
    function easeInOutSine(t, b, c, d) {
        return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
    }
    
    function animate(){
        var tCur, iStep;
        
        if(that._iAutoScroll === iAuto){
            tCur = Math.min(Date.now(), tEnd);
            
            iStep = easeInOutSine(tCur - tStart, iFrom, iDelta, tEnd - tStart);
            
            that.scrollTo(iStep, false, false);

            if(tCur <= tEnd){
                requestAnimationFrame(animate);
            }
        }
    }
    
    
    if(iDelta !== 0){
        this._iAutoScroll = iAuto = this._iAutoScrollIncr++;
        
        iFrom = this._iScrollOffsetPx;
        
        tStart = Date.now();
        tEnd = tStart + iLengthMS;
        
       
        animate();
    }
},

updatePosition : function(bForceRedraw){
    var iRealDisplaySize, iViewOffsetPx, iMaxPX, iScrollOffsetPx, iRowViewLast, iRowDispLast, iRowDispOffset, iRowScrollOffset, iPrefDisplaySize, iPrefViewSize;
    
    if(!this._eElem){
        return;
    }
    
    if(!this._bNoRender){
        iPrefDisplaySize = this.getDisplaySize();
        iPrefViewSize = this.getViewSize();
        iScrollOffsetPx = this.getScrollOffsetPx();
        bForceRedraw = !!bForceRedraw;
        
        //  Calculate the target row offset
        iRowScrollOffset = Math.floor(iScrollOffsetPx / (this._iRowHeight || 20));
        iRowDispOffset = Math.max(iRowScrollOffset - this._iPrefViewOffset, 0);
        iRowDispLast = Math.min(iRowDispOffset + iPrefDisplaySize, this._aCache.length - 1);
        iRowViewLast = Math.min(iRowScrollOffset + iPrefViewSize, this._aCache.length - 1);
        
        iRealDisplaySize = this._iRowDispLast - this._iRowDispOffset;
        
        iMaxPX = this.getMaxPX();
        
        if(bForceRedraw || (iScrollOffsetPx >= 0 && iScrollOffsetPx <= iMaxPX)){
            //  Choose between full redraw and adjustment. Adjustment is possible if the rows are already in the rendered area. 
            //  For IE8 there is an exception where adjustment doesn't remove rows and the read displaysize grows, there we refresh if there are 5 rows too much
            if(bForceRedraw || (iRowScrollOffset < this._iRowDispOffset) || (iRowViewLast > this._iRowDispLast) || (iRealDisplaySize > (iPrefDisplaySize + 5))){
                // df.debug("refresh list! " + iRowDispOffset + " --> " + iRowDispLast);
                this.refreshDisplay(iRowDispOffset);
            }else{
                // df.debug("adjust list! " + iRowDispOffset + " --> " + iRowDispLast);
                this.adjustDisplay(iRowDispOffset, iRowDispLast);
            }
        }
        
        //  Calculate and update view offset
        iViewOffsetPx = iScrollOffsetPx - this._iRowDispOffset * this._iRowHeight;
        this._iViewOffset = Math.floor(iViewOffsetPx / this._iRowHeight);
        
        this.updateScrollPos(iViewOffsetPx);
    }
},

/*
Refreshes the display entirely based on this._iRowDispOffset & this._iViewOffset
*/
refreshDisplay : function(iRowDispOffset){
    var i, aHtml = [], iDisplaySize = this.getDisplaySize(true), bZebra = !this._bZebraTop;
    
    //  Loop rows
    this._iRowDispOffset = iRowDispOffset;
    
    for(i = iRowDispOffset; i <= iRowDispOffset + iDisplaySize && i < this._aCache.length; i++){
        this.rowHtml(this._aCache[i], aHtml, bZebra);
        
        this._iRowDispLast = i;
        bZebra = !bZebra;
    }
    
    //  Generate "empty" rows
    for(i; i < iDisplaySize; i++){
        this.rowHtml(null, aHtml, bZebra);
        
        bZebra = !bZebra;
    }
    
    this._eTable.innerHTML = aHtml.join('');
    this._bZebraBottom = bZebra;
    
    
    this.updatePlaceHolder();
},


adjustDisplay : function(iRowDispOffset, iRowDispLast){
    var iAllowedDiff = this._iMaxViewOffsetDiff;
    
    if(this._iRowDispOffset > iRowDispOffset){
        //  Add rows on top
        if(this._iRowDispOffset > (iRowDispOffset + iAllowedDiff)){
            while(this._iRowDispOffset > iRowDispOffset){
                this._iRowDispOffset--;
                this.insertRow(this._aCache[this._iRowDispOffset], true);
                // df.debug("Insert top row!");
            }
        }
        
        //  Remove rows on the bottom
        if(!df.sys.isIE || df.sys.iVersion > 8){  //  FIX: We don't remove rows like this in IE8, it causes input elements to dissapear, IE8 refreshes every now and then
            if(this._iRowDispLast > (iRowDispLast + iAllowedDiff)){
                while(this._iRowDispLast > iRowDispLast){
                    this.removeBottomRow();
                    // df.debug("Remove bottom row!");
                }
            }
        }
    }else{
                
        //  Add rows on the bottom
        if(this._iRowDispLast < (iRowDispLast - iAllowedDiff)){
            while(this._iRowDispLast < iRowDispLast){
                this._iRowDispLast++;
                this.insertRow(this._aCache[this._iRowDispLast], false);
                
                // df.debug("Insert bottom row!");
            }
        }
        
        // Remove rows on top
        if(!df.sys.isIE || df.sys.iVersion > 8){  //  FIX: We don't remove rows like this in IE8, it causes input elements to dissapear, IE8 refreshes every now and then
            if(this._iRowDispOffset < (iRowDispOffset - iAllowedDiff)){
                while(this._iRowDispOffset < iRowDispOffset){
                    this.removeTopRow();
                    
                    // df.debug("Remove top row!");
                }
            }
        }
    }
},

/*
This method removes a single row from the display table. It makes sure the _iRowDispOffset and 
_iViewOffset are properly updated. It is called by the adjustDisplay method.

@private
*/
removeTopRow : function(){
    this._iRowDispOffset++;
    this._bZebraTop = !this._bZebraTop;
    this._eTable.removeChild(this._eTable.firstChild);
},

/*
This method removes a single row from the top of the display table. It is called by the 
adjustDisplay method.

@private
*/
removeBottomRow : function(){
    this._iRowDispLast--;
    this._eTable.removeChild(this._eTable.lastChild);
    this._bZebraBottom = !this._bZebraBottom;
},

updateScrollPos : function(iOffset){
    if(this._eTable){
        df.dom.translateY(this._eTable, -iOffset, true);
        
        if(this._eTableWrp.scrollTop > 0){
            this._eTableWrp.scrollTop = 0;  //  Reset this as it somehow gets scrolled :S
        }
    }
},

/* 
This function inserts a single row into the list using DOM object creation. This is slower as using 
innerHTML but is faster as refreshing the entire table (which needs to be done using innerHTML).

@param  tRow    Row data.
@param  bTop    True if the row needs to be inserted at the top, false for the bottom.
@private
*/
insertRow : function(tRow, bTop){
    var eRow, bZebra, aHtml = [];
    
    //  Assertion
    if(tRow && tRow.aCells.length < this._aColumns.length){
        throw new df.Error(999, "List data is not containing enough columns ({{0}} / {{1}}).", this, [ tRow.aCells.length , this._aColumns.length ]);
    }
    
    //  Determine row zebra
    if(bTop){
        bZebra = this._bZebraTop;
        this._bZebraTop = !this._bZebraTop;
    }else{
        bZebra = this._bZebraBottom;
        this._bZebraBottom = !this._bZebraBottom;
    }
    
    //  Generate row element
    this.rowHtml(tRow, aHtml, bZebra); 
    eRow = df.dom.create(aHtml.join(''));
    if(bTop && this._eTable.firstChild){
        this._eTable.insertBefore(eRow, this._eTable.firstChild);
    }else{
        this._eTable.appendChild(eRow);
    }
},

/* 
This function generates the HTML for a single row and appends it to the string builder array that is 
passed.

@param  tRow    Row data.
@param  aHtml   String builder to which html is appended.
@param  bZebra  True for an odd row.
@private
*/
rowHtml : function(tRow, aHtml, bZebra){
    var sTooltip, i, oCol;
    
    //  Assertion
    if(tRow && tRow.aCells.length < this._aColumns.length){
        throw new df.Error(999, "List data is not containing enough columns ({{0}} / {{1}}).", this, [ tRow.aCells.length , this._aColumns.length ]);
    }
    
    aHtml.push('<table data-dfrowid="', (tRow && tRow.sRowID), '" class="',  this.rowClass(tRow, bZebra),'">');
    
    this.resizeRowHtml(aHtml);
    
    //  Loop cells
    for(i = 0; i < this._aColumns.length; i++){
        oCol = this._aColumns[i];
        
        if(oCol.pbRender){
            if(oCol.pbNewLine){
                aHtml.push('</tr><tr>');
            }
        
            sTooltip = (tRow && (tRow.aCells[i].sTooltip || (oCol.pbValueAsTooltip && oCol.tooltipValue(tRow.aCells[i])))) || "";
            aHtml.push('<td data-dfcol="', i, '" class="', this.cellClass(oCol, (tRow && tRow.aCells[i]) || null), '" title="', df.dom.encodeAttr(sTooltip), '"');
            
            if(oCol.piListRowSpan > 1){
                aHtml.push(' rowspan="', oCol.piListRowSpan, '"');
            }
            if(oCol.piListColSpan > 1){
                aHtml.push(' colspan="', oCol.piListColSpan, '"');
            }
                
            aHtml.push('>', (tRow ? this.cellHtml(oCol, tRow.aCells[i]) : '&nbsp;'), '</td>');
        }
    }
    
    aHtml.push('</tr></table>');
},

/* 
This function determines the CSS classnames applied to a cell within the list. This is done based on 
several column properties including the data type.

@param  oCol    The column object.
@param  tCell    Row data.
@private
*/
cellClass : function(oCol, tCell){
    var aClasses =  [ ];
    
    aClasses.push(oCol._sCellClass);
    
    aClasses.push(oCol.isEnabled() ? df.CssEnabled : df.CssDisabled);
    
    aClasses.push(oCol.peAlign === df.ciAlignLeft ? "WebList_AlignLeft" : (oCol.peAlign === df.ciAlignCenter ? "WebList_AlignCenter" : (oCol.peAlign === df.ciAlignRight ? "WebList_AlignRight" : "")));
    
    if(oCol.peDataType === df.ciTypeBCD){
        aClasses.push("dfData_BCD");
    }else if(oCol.peDataType === df.ciTypeDate){
        aClasses.push("dfData_Date");
    }else{
        aClasses.push("dfData_Text");
    }
    
    if(oCol.psCSSClass){
        aClasses.push(oCol.psCSSClass);
    }
    
    if(tCell && tCell.sCssClassName){
        aClasses.push(tCell.sCssClassName);
    }
    
    return aClasses.join(" ");
},

/* 
This function determines the classnames that are set on a list row. If an additional data member is 
available in the row data that is used as CSS classname as well.

@param  tRow    Row data.
@param  bZebra  True if this is an odd row, false for an even row.
@private
*/
rowClass : function(tRow, bZebra){
    var aClasses = ["WebList_Row"];
    
    if((tRow && tRow.sRowID) === this.psCurrentRowID){
        aClasses.push("WebList_Selected");
    }
    
    aClasses.push((bZebra ? ' WebList_RowOdd' : ' WebList_RowEven'));
    
    if(!tRow){
        aClasses.push("WebList_RowEmpty");
    }
    
    if(tRow && tRow.sCssClassName){
        aClasses.push(tRow.sCssClassName);
    }
    
    return aClasses.join(" ");
},

cellHtml : function(oCol, tCell){
    var bFocus, sHtml;
    
    tCell = tCell || { sValue : "", sTooltip : "", sCssClassName : "", aOptions : [] };
    
    //  We need to tempolary set the focus to false because we always want the masked value
    bFocus = oCol._bHasFocus;
    oCol._bHasFocus = false;
    
    sHtml = oCol.cellHtml(tCell);
    
    //  Restore the focus
    oCol._bHasFocus = bFocus;
    
    return sHtml;
},



onScrollbarScroll : function(){
    var iOffset = this._eScrollbar.scrollTop;
    
    if(iOffset !== this._iLastScrollbarSet && !this._bScrollbarDirty){
        this._iAutoScroll = 0;
        this._iLastScrollbarSet = iOffset;
        // df.debug("scrollbar interfered!");
        this.scrollTo(iOffset, true, true);
    }
},

onMouseWheelScroll : function(oEvent){
    var iDelta = oEvent.getMouseWheelDelta();
    
    // this._iAutoScroll = 0;
    
    // df.debug("onMouseWheelScroll");
    if(iDelta > 0){
        //  Scroll up
        this.scroll(-((this._iRowHeight || 20) * 2), true);
        
    }else if(iDelta < 0){
        //  Scroll down
        this.scroll((this._iRowHeight || 20) * 2, true);
    }
    
    oEvent.stop();
    // this.updateCache();
},

/*
This event handler handles the touch event on mobile devices. It will scroll list if the touch is a 
vertical sliding touch.

@param  oEvent     Event object (df.events.DOMEvent)
@private
*/
onTouchStart : function(oEvent){
    //  Only respond to single finger swipes
    if(oEvent.e.targetTouches.length === 1){
        this.touchScroll(false, oEvent);
    }
},

onPointerDown : function(oEvent){
    if(oEvent.e.pointerType === "pen" || oEvent.e.pointerType === "touch"){
        this.touchScroll(true, oEvent);
    }
},

touchScroll : function(bPointer, oEvent){
    var that = this, iY, iPrevY, iStartY, iVelocity = 0, iAmplitude = 0, iTimestamp = Date.now(), iFrame, tTracker, iTarget, iTimeConstant = 325, iPrefViewSize, iMaxPX, iBounce, iBounceTime = 0, iStartOffset, iAuto;
    
    //  Stop running scroll animations
    this._iAutoScroll = 0;
    
    //  Initialize variables
    iStartY = iFrame = iPrevY = iY = (bPointer ? oEvent.e.clientY : oEvent.e.targetTouches[0].pageY);
    iStartOffset = this._iScrollOffsetPx;
    
    iPrefViewSize = this.getViewSize();
    iMaxPX = this.getMaxPX();
    iBounce = this._iTableHeight * 0.1;
    
    
    //  Handles the move event and recalculates the scrollbar position accordingly
    function touchMove(oEvent){
        var iOffset, iDiff;
        
        //  Determine new touch position
        iY = (bPointer ? oEvent.e.clientY : oEvent.e.targetTouches[0].pageY);
        
        //  Calculate new offset
        iOffset = this._iScrollOffsetPx + (iPrevY - iY);
        
        //  Use elastic logic outside boundaries
        if(iOffset < 0){
            iDiff = iStartOffset + (iStartY - iY);
            iOffset = iDiff * 0.3;
        }else if(iOffset > iMaxPX){
            iDiff = iStartOffset + (iStartY - iY) - iMaxPX;
            iOffset = iMaxPX + iDiff * 0.3;
        }
        
        //  Perform scroll
        this.scrollTo(iOffset, false);
        
        //  Update administration
        iPrevY = iY;
        
        oEvent.stop();
    }
    
    //
    //  Performs the kinetic scrolling animiation. Adjusts animation for bounce when outside of boundaries.
    //
    function autoScroll(){
        var iElapsed, iDelta, iOffset, iDone;
        
        if(that._iAutoScroll === iAuto && iAmplitude){
            iElapsed = Date.now() - iTimestamp;
            
            //  Detect when outside boundaries
            if(that._iScrollOffsetPx < 0 || that._iScrollOffsetPx > iMaxPX){
                //  For the first time we need to calculate bounce values (target & time)
                if(!iBounceTime){
                    //  Determine how far we where with the autoscroll animation
                    iDone = Math.abs((-iAmplitude * Math.exp(-iElapsed / iTimeConstant)) / iAmplitude);
                    
                    //  Calculate bouncetime & amplitude based on current amplitude and done value
                    iBounceTime = iDone * 100;
                    iAmplitude = (Math.max(-iAmplitude / 2000, 1) * (that._iScrollOffsetPx > iMaxPX ? iBounce : -iBounce)) * iDone;
                    iTarget = that._iScrollOffsetPx + iAmplitude;
                    
                    //  Reset counters
                    iTimestamp = Date.now();
                    iElapsed = Date.now() - iTimestamp;
                }
                
                iDelta = -iAmplitude * Math.exp(-iElapsed / iBounceTime);
            }else{
                iDelta = -iAmplitude * Math.exp(-iElapsed / iTimeConstant);
            }
            iOffset = iTarget + iDelta;
            
            //  Perform actuall scroll
            if(iDelta > 0.5 || iDelta < -0.5){
                that.scrollTo(iOffset, false);
                requestAnimationFrame(autoScroll);
            }else{
                //  If there isn't enough speed anymore we end the animation
                that.scrollTo(iTarget, false);
                
                //  Perform animation back to limit when outside of boundaries
                if(iTarget < 0){
                    that.aniScroll(-that._iScrollOffsetPx, ((iOffset / -iBounce) * 80));                
                }else if(iTarget > iMaxPX){
                    that.aniScroll(iMaxPX - that._iScrollOffsetPx, (((iOffset - iMaxPX) / iBounce) * 80));                
                }
            }
        }
    
    }
    
    
    //
    //  Handles the touch end and initiates scroll animations if needed.
    //
    function touchEnd(oEvent){
        var that = this;
        
        if(bPointer){
            df.events.removeDomListener("pointerup", window, touchEnd, this);
            df.events.removeDomListener("pointermove", window, touchMove, this);
        }else{
            df.events.removeDomListener("touchend", window, touchEnd, this);
            df.events.removeDomListener("touchmove", window, touchMove, this);
        }
        
        clearInterval(tTracker);
        
        //  Animate going back when outside of boundaries
        if(this._iScrollOffsetPx < 0){  
            this.aniScroll(-this._iScrollOffsetPx, ((this._iScrollOffsetPx / -iBounce) * 80));
        }else if(this._iScrollOffsetPx > iMaxPX){
            this.aniScroll(iMaxPX - this._iScrollOffsetPx, (((this._iScrollOffsetPx - iMaxPX) / iBounce) * 80));
        }else{
            
            //  Determine if there is enough energy to do a kinetic scroll
            if(iVelocity > 10 || iVelocity < -10){
                //  Calculate amplitude and target
                iAmplitude = 1.9 * iVelocity;
                iTarget = Math.round(this._iScrollOffsetPx + iAmplitude);
                
                //  Round target on a full row
                iTarget = Math.round(iTarget / this._iRowHeight) * this._iRowHeight;
                
                //  Initiate the autoscrolling animation
                this._iAutoScroll = iAuto = this._iAutoScrollIncr++;
                iTimestamp = Date.now();
                requestAnimationFrame(autoScroll);
            }
        }
        
        if(Math.abs(iPrevY - iStartY) > 15){
            oEvent.stop();
            
            //  Explicitly block click using _bCancelClick if scrolling from a pointer as stopping the event won't stop the click event (Windows)
            if(bPointer){
                this._bCancelClick = true;
                setTimeout(function(){
                    that._bCancelClick = false;
                }, 200);
            }
        }
    }
    
    //
    //  The tracker is executed on an interval and calculates the velocity based on the changed touch position.
    //
    function track(){
        var iNow, iElapsed, iDelta, v;
        
        //  Update administration
        iNow = Date.now();
        iElapsed = iNow - iTimestamp;
        iTimestamp = iNow;
        iDelta = iFrame - iY;
        iFrame = iY;
        
        //  Update velocity
        v = 500 * iDelta / (1 + iElapsed);
        iVelocity = 0.8 * v + 0.2 * iVelocity;  //  Use the previous velocity to smoothen excesses
    }
    
    if(bPointer){
        df.events.addDomListener("pointerup", window, touchEnd, this);
        df.events.addDomListener("pointermove", window, touchMove, this);
    }else{
        df.events.addDomListener("touchend", window, touchEnd, this);
        df.events.addDomListener("touchmove", window, touchMove, this);
    }
    tTracker = setInterval(track, 50);
},


getViewSize : function(bOptFull){
    //  Determine the amount of rows that should be visible
    var iViewSize = 0, iTableHeight;
    
    if(this._eTableWrp){
        if(this._iTableHeight > 0){
            iTableHeight = this._iTableHeight;
        }else{
            this._iTableHeight = iTableHeight = this._eTableWrp.clientHeight;
        }
        
        iViewSize = Math.floor(iTableHeight / (this._iRowHeight || 20)) + 1;
        if(!bOptFull && iViewSize > this._aCache.length){
            iViewSize = this._aCache.length;
        }
    }
    
    return iViewSize;
},

getDisplaySize : function(bOptFull){
    //  Determine the amount of rows that we want rendered
    var iDisplaySize = this.getViewSize(bOptFull) + (this._iPrefViewOffset * 2);
    if(!bOptFull && iDisplaySize > this._aCache.length){
        iDisplaySize = this._aCache.length;
    }
    
    return iDisplaySize;
},

getMaxPX : function(){
    return Math.max((this._aCache.length * (this._iRowHeight || 20)) - this._iTableHeight, 0);
},

/*
Updates the size of the stretch element defining the size of the scrollbar thingy based on the 
current cache.
*/
updateScrollbarSize : function(){
    var iHeight = this._aCache.length * (this._iRowHeight || 20) + (this._iRowHeight || 20);
    
    if(this._eScrollStretch && this._eScrollStretch.clientHeight !== iHeight){
        this._eScrollStretch.style.height = iHeight + "px";
    }
},

/* 
Updates the position displayed by the scrollbar.

@param  iOffset     Offset in pixels from the top of the cache to the first displayed row.
*/
updateScrollbarPos : function(iOffset){
    var bDirty, that = this;
    
    if(this._eScrollbar){
        this._eScrollbar.scrollTop = this._iLastScrollbarSet = iOffset;
        this._bScrollbarDirty = bDirty = (this._eScrollbar.scrollTop !== this._iLastScrollbarSet);
        
        if(bDirty){
            setTimeout(function(){
                if(that._bScrollbarDirty && that._eScrollbar.scrollTop !== that._iLastScrollbarSet){
                    that._eScrollbar.scrollTop = that._iLastScrollbarSet;
                }
                
                that._bScrollbarDirty = false;
            }, 300);
        }  
    }
},

updateRowHeight : function(){
    if(this._eTable && this._eTable.firstChild){
        //  Determine height
        this._iRowHeight = this._eTable.firstChild.offsetHeight; // + df.sys.gui.getVertBoxDiff(this._eTable.rows[1]);
    }
},

/* 
Centers the currently selected row on the screen.
*/
centerCurrentRow : function(){
    var iOffset, iStart;
    
    iStart = this.findRowByRowId(this.psCurrentRowID);
    if(iStart >= 0){
        if(iStart > 0){
            iStart = iStart - ((this.getViewSize() - 2) / 2);
            if(iStart < 0){
                iStart = 0;
            }
        }
        
        iOffset = (this._iRowHeight || 20) * iStart;
        
        this.scrollTo(iOffset, true, false);
    }
},

/* 
Scrolls to the currently selected row. Note that if the row is already on the screen it does nothing 
so it doesn't always refresh the display.
*/
scrollToCurrentRow : function(){
    var iRow = this.findRowByRowId(this.psCurrentRowID), 
        iViewSize = this.getViewSize() - 1;
    
    if(iRow <= this._iRowDispOffset + this._iViewOffset){
        this.scrollTo((this._iRowHeight || 20) * (iRow), true, false);
    }else{
        if(iRow + 1 > this._iRowDispOffset + this._iViewOffset + iViewSize){
            this.scrollTo((this._iRowHeight || 20) * (iRow - iViewSize + 1), true, false);
        }
    }
    
},

/*
@param  sGotoRow    String describing the row that will be selected ("new", "first", "last", "row").
@param  iRow        When sGotoRow indicates "row" then this is the cache row number to select.
*/
selectRow : function(sGotoRow, iRow, fOptHandler, tOptSelectRowData){
    var sPrevRowID = this.psCurrentRowID, bContinue = true, sTargetRowID = "", iPrevRow, tSelectRowData = tOptSelectRowData || null, iRowChange;
    
    iPrevRow = this.findRowByRowId(sPrevRowID);
    
    //  Make sure there are no outstanding ChangeCurrentRow calls
    this.cancelServerAction("ChangeCurrentRow");
    
    //  Determine if row change is needed & translate specific row nr into rowid
    if(sGotoRow === "row"){
        sTargetRowID = this._aCache[iRow].sRowID;
        bContinue = (sTargetRowID !== this.psCurrentRowID);
        
        //  For non data-aware grids / lists we send a copy of the row we are going to as action data to the server
        if(!this.pbDataAware){
            tSelectRowData = this._aCache[iRow];
        }
    }
    
    //  Update counter and remember number in local variable
    this._iRowChangeCount++;
    iRowChange = this._iRowChangeCount;
    
    function handleRowChange(bResult){
        var eRow, iPrevRow, ePrevRow, iRow, bOverridden;
        
        //  Check if row change is overtaken by another row change
        bOverridden = (iRowChange !== this._iRowChangeCount);
        
        if(this.pbOfflineEditing || df.toBool(bResult)){
            //  Find and deselect previously selected row
            iPrevRow = this.findRowByRowId(sPrevRowID);
            if(iPrevRow >= 0){
                if(this._eTable && iPrevRow >= this._iRowDispOffset && iPrevRow < this._iRowDispOffset + this.getDisplaySize()){
                    ePrevRow = this._eTable.childNodes[iPrevRow - this._iRowDispOffset];
                    df.dom.removeClass(ePrevRow, "WebList_Selected");
                }
            }

            //  We do this so that handlers that scroll the screen are executed before we add the class
            if(fOptHandler){
                fOptHandler.call(this, true, bOverridden);
            }
            
            //  Select the newly selected row (goto new row is handled by the handler)
            iRow = this.findRowByRowId(this.psCurrentRowID);
            if(this._eTable && iRow >= 0 && iRow - this._iRowDispOffset >= 0 && iRow - this._iRowDispOffset < this._eTable.childNodes.length){
                eRow = this._eTable.childNodes[iRow - this._iRowDispOffset];
                
                df.dom.addClass(eRow, "WebList_Selected");
            }
        }else{
            fOptHandler.call(this, false, bOverridden);
        }
    }
    
    if(bContinue){
        if(!this.pbOfflineEditing){
            //  Set handler function so it can be called as client-action
            this.handleRowChange = handleRowChange;
            this.serverAction("ChangeCurrentRow", [ sGotoRow, sTargetRowID ], (tSelectRowData && this.serializeVT([ tSelectRowData ])) || null);
        }else{
            //  When working offline we manually load the row into the columns and set it as current
            if(sGotoRow === "row"){
                this.set('psCurrentRowID', sTargetRowID);
                this.updateColumnsFromCache(true);
            }
                        
            handleRowChange.call(this);
        }
    }else{
        if(fOptHandler){
            fOptHandler.call(this, false);
        }
    }
},

/* 
This function is called from the server after a rowchange initiated by the client. It is replaced at 
runtime with a function inside a closure holding the context needed to handle the rowchange.

@param  bResult     True if the rowchange is succesfull. 

@client-action
*/
handleRowChange : function(bResult){
    //  Empty placeholder
},

/*
This method updates the column DEO objects with the data in the cache for the current row. It does 
nothing if pbNonDataAware is false. It will reset the changed-states if bResetChange is true.

@param  bResetChange    If true the changed-state is reset.
@private
*/
updateColumnsFromCache : function(bResetChange){
    var iRow, iCol;
    
    //  Update the column value's
    if(!this.pbDataAware){
        iRow = this.findRowByRowId(this.psCurrentRowID);
        
        if(iRow >= 0){
            for(iCol = 0; iCol < this._aColumns.length; iCol++){
                this._aColumns[iCol].set('psValue', this._aCache[iRow].aCells[iCol].sValue);
                if(bResetChange){
                    this._aColumns[iCol].set('pbChanged', false);
                }
            }
            this._bUpdatedColumnsFromCache = true;
        }
    }
},

/* 
This method prepares the layout before rendering. Its main task is to calculate the column widths 
which can be fairly complicated with the support for multiline rows and fixed widths. It is a three 
step process where first the row layout is calculated in memory and then the column widths are 
determined and they are finally converted into percentages or pixels and stored.

@private
*/
prepareLayout : function(){
    var aTable = [], iCol, i, iCols = 0, iRow = 0, iCell = 0, aColWidths = [], iFixed = 0, iRatio = 0, oCol, x, y;
    
    
    //  Determine table layout
    for(i = 0; i < this._aColumns.length; i++){
        oCol = this._aColumns[i];
        
        //  We do not support a colspan or rowspan of 0 so we correct that first
        oCol.piListColSpan = Math.max(oCol.piListColSpan, 1);
        oCol.piListRowSpan = Math.max(oCol.piListRowSpan, 1);
        
        if(oCol.pbRender){
            if(oCol.pbNewLine && aTable.length > 0){
                if(aTable[iRow].length > iCols){
                    iCols = aTable[iRow].length;
                }
                iRow++;
                iCell = 0;
            }
            
            //  Jump over cols already in use
            while(aTable[iRow] && aTable[iRow][iCell]){
                iCell++;
            }
            
            oCol._iCol = iCell;
            
            //  Mark cells
            for(x = 0; x < oCol.piListRowSpan; x++){
                if(!aTable[iRow + x]){
                    aTable[iRow + x] = [];
                }
                
                // TODO: Jump over cells here
                for(y = 0; y < oCol.piListColSpan; y++){
                    aTable[iRow + x][iCell + y] = oCol;
                }
            }
            
            iCell += oCol.piListColSpan;
            
        }
    }
    
    //  Check if the last row is the longest
    if(aTable[iRow] && aTable[iRow].length > iCols){
        iCols = aTable[iRow].length;
    }
    
    //  Determine width for each column
    for(iCol = 0; iCol < iCols; iCol++){
        aColWidths[iCol] = { bDef : false, bGues : false, bFixed : false, iWidth : 0, oCol : null };
        
        for(iRow = 0; iRow < aTable.length; iRow++){
            oCol = aTable[iRow][iCol];
            if(oCol){
                if(oCol.piListColSpan === 1){
                    aColWidths[iCol].bDef = true;
                    aColWidths[iCol].bFixed = oCol.pbFixedWidth;
                    aColWidths[iCol].iWidth = oCol.piWidth;
                    aColWidths[iCol].oCol = oCol;
                    
                    break;
                }else if(!aColWidths[iCol].bGues){
                    aColWidths[iCol].bGues = true;
                    aColWidths[iCol].bFixed = oCol.pbFixedWidth;
                    aColWidths[iCol].iWidth = oCol.piWidth / oCol.piListColSpan;
                    aColWidths[iCol].oCol = oCol;
                }
            }
        }

        if(aColWidths[iCol].bFixed){
            iFixed += aColWidths[iCol].iWidth;
        }else{
            iRatio += aColWidths[iCol].iWidth;
        }        
    }
    
    
    //  Store / convert column widths
    for(iCol = 0; iCol < aColWidths.length; iCol++){
        if(aColWidths[iCol].bFixed){
            aColWidths[iCol].iPixels = aColWidths[iCol].iWidth;
        }else{
            // Pixel width or percentage?
            aColWidths[iCol].iPercent = Math.floor((aColWidths[iCol].iWidth * (100 / iRatio)) * this._iRound) / this._iRound;
        }
    }
    
    this._aColWidths = aColWidths;
    
    

},

resizeColumn : function(oEvent, iCol){
    var eMask, eGhost, iLeft = 0, iRatio, iPX = 0, iStartX, iDiff = 0, iMin, iMax = 0, i;
    
    //  First create our drag mask
    eMask = df.gui.dragMask();
    eMask.style.cursor = "e-resize";
    
    
    //  Determine percentage to pixel ratio
    iRatio = this.calcPixelRatio(this.findColNr(this._aColWidths[iCol].oCol));
    
    //  Determine current position and maximum
    for(i = 0; i < this._aColWidths.length; i++){
        if(this._aColWidths[i].bFixed){
            iPX = this._aColWidths[i].iPixels;
        }else{
            iPX = (this._aColWidths[i].iPercent * iRatio);
        }
        
        if(i <= iCol){
            iLeft += iPX;
        }else{
            if(this._aColWidths[i].oCol.pbResizable){   //  Do not increase maximum with columns that are not resizable so they never get smaller
                //    Determine minimum
                iMax += iPX - this._iColMin;
            }
        }
    }
    iStartX = oEvent.getMouseX();
    
    //    Determine minimum
    if(this._aColWidths[iCol].bFixed){
        iMin = -this._aColWidths[iCol].iPixels + this._iColMin;
    }else{
        iMin = -(this._aColWidths[iCol].iPercent * iRatio) + this._iColMin;
    }
    
    //    Create ghost separator
    eGhost = df.dom.create('<div class="WebList_ColResizer"></div>');
    this._eHeadWrp.appendChild(eGhost);
    eGhost.style.left = iLeft + "px";
    eGhost.style.height = (this._eHead.clientHeight + this._eBody.clientHeight) + "px";
    
    //  Resizer function that handles the mousemove and calculates the pixel difference and moves the ghost separator
    function onResize(oEvent){
        var iNewX = oEvent.getMouseX(), iNewLeft;
        
        //  Calculate new difference
        iDiff = iNewX - iStartX;
        
        //  Check against min and max
        if(iDiff < iMin){
            iDiff = iMin;
        }
        if(iDiff > iMax){
            iDiff = iMax;
        }
        
        // df.debug("iDiff (" + iDiff + ") = iNewX(" + iNewX + " - iStartX(" + iStartX + ");");
        //  Apply to ghost
        iNewLeft = iLeft + iDiff;
        eGhost.style.left = iNewLeft + "px";
    }
    
    //  Handles the events that should stop the drag and 
    function onStopResize(oEvent){
        
        //  Remove event handlers
        df.events.removeDomListener("mouseup", eMask, onStopResize);
        df.events.removeDomListener("mouseup", window, onStopResize);
        //df.events.removeDomListener("mouseout", eMask, onStopResize);
        df.events.removeDomListener("mousemove", eMask, onResize);
        
        //  Remove ghost & mask
        eGhost.parentNode.removeChild(eGhost);
        eMask.parentNode.removeChild(eMask);
        
        //  Update column sizes
        this.recalcColumnSizes(iCol, iDiff, false);
        this.updateHeader();
        this.updatePosition(true);
    }
    
    //  Attach event handlers
    df.events.addDomListener("mouseup", eMask, onStopResize, this);
    df.events.addDomListener("mouseup", window, onStopResize, this);
    //df.events.addDomListener("mouseout", eMask, onStopDrag, this);
    df.events.addDomListener("mousemove", eMask, onResize, this);
},

calcPixelRatio : function(){
    var i, iFullWidth;
    
    iFullWidth = this._eTable.offsetWidth;
    for(i = 0; i < this._aColWidths.length; i++){
        if(this._aColWidths[i].bFixed){
            iFullWidth -= this._aColWidths[i].iPixels;
        }
    }
    
    //  Calculate & return ratio
    return iFullWidth / 100;
},

recalcColumnSizes : function(iVCol, iDiff, bOverrideResizable){
    var i, iTotal = 0, iColDiff, iColls = 0, iLast, iRatio, iPixels, iChanged;
    
    //  Determine percentage to pixel ratio
    iRatio = this.calcPixelRatio();
    
    //  Determine total space behind column
    for(i = iVCol + 1; i < this._aColWidths.length; i++){
        if(this._aColWidths[i].bFixed){
            iTotal += this._aColWidths[i].iPixels;
        }else{
            iTotal += (this._aColWidths[i].iPercent * iRatio);
        }
        
        if(this._aColWidths[i].oCol.pbResizable || bOverrideResizable){
            iColls++;
        }
    }
    
    if(this._aColWidths[iVCol].bFixed){
        this._aColWidths[iVCol].iPixels = this._aColWidths[iVCol].iPixels + iDiff;
    }else{
        this._aColWidths[iVCol].iPercent = ((this._aColWidths[iVCol].iPercent * iRatio) + iDiff) / iRatio;
    }
    
    
    while(Math.round(iDiff || 0) !== 0 && iDiff !== iLast){
        iColDiff = iDiff / iColls;
        iLast = iDiff;
        
        for(i = iVCol + 1; i < this._aColWidths.length; i++){
            if(this._aColWidths[i].oCol.pbResizable || bOverrideResizable){
                iPixels = (this._aColWidths[i].bFixed ? this._aColWidths[i].iPixels : this._aColWidths[i].iPercent * iRatio);
                iChanged = iPixels - iColDiff;
                if(iChanged < this._iColMin){
                    iChanged = this._iColMin;
                }
                
                if(this._aColWidths[i].bFixed){
                    this._aColWidths[i].iPixels = iChanged;
                }else{
                    this._aColWidths[i].iPercent = iChanged / iRatio;
                }
                
                iDiff -= (iPixels - iChanged);
            }
        }
    }
    
    for(i = 0; i < this._aColWidths.length; i++){
        if(this._aColWidths[i].bFixed){
            this._aColWidths[i].oCol.piWidth = this._aColWidths[i].iPixels;
        }else{
            this._aColWidths[i].oCol.piWidth = this._aColWidths[i].iPercent * 10;
        }
    }
    
    
    this.prepareLayout();
},

roundColSize : function(iVal){
    return Math.round(iVal * this._iRound) / this._iRound;
},

// - - - - - - - Cache - - - - - - -

deserializeVT : df.sys.vt.generateDeserializer([ df.tWebRow ]),
serializeVT : df.sys.vt.generateSerializer([ df.tWebRow ]),

/* 
Appends the received row (action data) to the list. Should only be used on non data aware lists.

@client-action
*/
dataSetAppendRow : function(){
    var aRows = this.deserializeVT(this._tActionData);
    
    if(aRows.length > 0){
        this._bNoRender = true;
        
        //  Check if last row is a new row
        if(this._aCache.length > 0 && this._aCache[this._aCache.length - 1].sRowID === ""){
            //  Insert before the new row
            this._aCache.splice(this._aCache.length - 1, 0, aRows[0]);
        }else{
            //  Insert at the end
            this._aCache.push(aRows[0]);
        }
        
        this.sortData();
                                
        //  Update display
        this.updateScrollbarSize();
        this._bNoRender = false;
        this.updatePosition(true);
    }
},

/* 
Inserts the received row (action data) to the list. Should only be used on non data aware lists.

@param  sBeforeRowID    RowID of the row indicating the position where the row should be inserted 
                        into the list.
@client-action
*/
dataSetInsertRowBefore : function(sBeforeRowID){
    var iRow, aRows = this.deserializeVT(this._tActionData);
    
    if(aRows.length > 0){
        this._bNoRender = true;
        
        iRow = this.findRowByRowId(sBeforeRowID);
        
        if(iRow < 0){
            iRow = this._aCache.length;
        }
        
        //  Insert before the found row
        this._aCache.splice(iRow, 0, aRows[0]);
        
        
        this.sortData();
                                
        //  Update display
        this.updateScrollbarSize();
        this._bNoRender = false;
        this.updatePosition(true);
    }
},

/* 
Removes a row from the list. Should only be used on non data aware lists.

@param  sRowID  RowID indicating which row to remove.
@client-action
*/
dataSetRemoveRow : function(sRowID){
    var iRow;
    
    iRow = this.findRowByRowId(sRowID);
    
    if(iRow >= 0){
        this.onBeforeCacheUpdate();
        
        //  TODO: What to do with the current row? Select next one?
        if(sRowID === this.psCurrentRowID){
            this.psCurrentRowID = "";
        }
    
        //  Insert before the found row
        this._aCache.splice(iRow, 1);
        
        
        this.sortData();
                                
        //  Update display
        this.updateScrollbarSize();
        this._bNoRender = false;
        this.updatePosition(true);
        
        this.onAfterCacheUpdate();
    }else{
        throw new df.Error(999, "Row with ID '{{0}}' not found!", this, [ sRowID ]);
    }
},

/* 
Updates a row in the list based on the row passed in the action data.

@param  sRowID  RowID indicating which row needs to be updated.
@client-action
*/
dataSetUpdateRow : function(sRowID){
    var iRow, aRows = this.deserializeVT(this._tActionData);
    
    if(aRows.length > 0){
        this._bNoRender = true;
        
        iRow = this.findRowByRowId(sRowID);
        
        if(iRow >= 0){
            this.onBeforeCacheUpdate();
            
            this._aCache[iRow] = aRows[0];
            
            this.sortData();
                                
            //  Update display
            this.updateScrollbarSize();
            this._bNoRender = false;
            this.updatePosition(true);
            
            this.onAfterCacheUpdate();
        }else{
            throw new df.Error(999, "Row with ID '{{0}}' not found!", this, [ sRowID ]);
        }
    }
},

updateCache : function(){
    // var sLog = "(first: " + this._bFirst + ", before : " + this._iRowDispOffset + ", cache size : " + this._aCache.length + ", display:  " + this.getDisplaySize() + ", after : " + (this._aCache.length  - this._iRowDispOffset - this.getDisplaySize()) + ", last: " + this._bLast + ")";
    
    if(!this._bNoRender){
        if(!this._bLast){
            if((this._aCache.length  - this._iRowDispOffset - this.getDisplaySize()) < this._iPrevCacheOffset){
                this.loadCachePage("next", function(){
                    // this.adjustDisplay();
                    this.updateCache();
                }, this);
            }
        }
        if(!this._bFirst){
            if(this._iRowDispOffset - this._iPrevCacheOffset < 0){
                this.loadCachePage("prev", function(){
                    // this.adjustDisplay();
                    this.updateCache();
                }, this);
            }
        }
    }
},

loadCachePage : function(sType, fOptHandler, oOptEnv){
    var sStartRowID = "";
    
    if(this._bLoading){
        return;
    }
    this._bLoading = true;
    
     // Determine start rowid
    if(sType === "next"){
        if(this._aCache.length){
            sStartRowID = this._aCache[this._aCache.length - 1].sRowID;
        }
    }else if(sType === "prev"){
        if(this._aCache.length){
            sStartRowID = this._aCache[0].sRowID;
        }
    }else{
        this._bNoRender = true;
    }
    
    // Create action
    this.serverAction("LoadDataPage", [ sType, sStartRowID ], null, function(oEvent){
        this._bLoading = false;
        
        if(!oEvent.bError){
            if(fOptHandler){
                fOptHandler.call(oOptEnv || this);
            }
        }
    });
},

/*
This function handles a new page of data and adds it to the cache. Depending on the sType parameter 
it will add or replace the cache. After this it will refresh the display.

@client-action
*/
handleDataPage : function(sType, sStartRowId, bFirst, bLast){
    var iPageCount, aRows = this.deserializeVT(this._tActionData);
    
    //  Convert from string to boolean
    bFirst = (bFirst === "1");
    bLast = (bLast === "1");
    
    this.onBeforeCacheUpdate();

    //  Make sure the rowheight we calculate with is determined
    if(this._iRowHeight < 1){
        this.updateRowHeight();
    }
    
    if(sType === "page"){
        //  Update cache
        this._aCache = aRows;
        this._bLast = bLast;
        this._bFirst = bFirst;
        
        this.sortData();
        
        //  Update display (center selected record)
        this.updateScrollbarSize();
        this.centerCurrentRow();
        this._bNoRender = false;
        this.updatePosition(true);
        
        //  If there are now rows we might try to move to a new row (grids only)
        if(this._aCache.length === 0){
            this.appendNewRow();
        }
    }
    
    
    if(sType === "first"){
        //  Update cache
        this._aCache = aRows;
        this._bLast = bLast;
        this._bFirst = bFirst;
        this.sortData();
                            
        //  Update  display (scroll to top)
        this.updateScrollbarSize();
        this.scrollTo(0, false, false);
        this._bNoRender = false;
        this.updatePosition();
    }
    
    if(sType === "last"){
        //  Update cache
        aRows.reverse();
        this._aCache = aRows;
        this._bLast = bLast;
        this._bFirst = bFirst;
        this.sortData();
                            
        //  Update display
        this.updateScrollbarSize();
        this.scrollTo(this.getMaxPX(), false, false);
        this._bNoRender = false;
        this.updatePosition();
    }
    
    if(sType === "next"){
        //  Update cache
        this._aCache = this._aCache.concat(aRows);
        this._bLast = bLast;
        
        //  Update display
        this.updateScrollbarSize();
    }
    
    if(sType === "prev"){
        //  Update cache
        aRows.reverse();
        this._aCache = aRows.concat(this._aCache);
        this._bFirst = bFirst;
        this._iRowDispOffset += aRows.length;
        
        //  Update display
        this.updateScrollbarSize();
        this._eScrollbar.scrollTop = this._eScrollbar.scrollTop  + aRows.length * (this._iRowHeight || 20);
        this.updatePosition();
    }
    
    this.onAfterCacheUpdate();
},

/*
Clears the cache and the displayed table.

@private
*/
clearCache : function(){
    this.scrollTo(0);
    
    //  Throw away displayed HTML
    if(this._eTable){
        this._eTable.innerHTML = "";
    }
    
    //  Clear cache
    this._aCache = [];
    this._bFirst = false;
    this._bLast = false;
    this._iRowDispOffset = 0;
    this._iViewOffset = 0;
},

refreshData : function(){
    this.clearCache();
    this.showLoading();
    
    this.loadCachePage("page", "", function(oEvent){
        this.hideLoading();
    
    });
},

/* 
Function that is called mainly by columns if their properties have changed. Forces a full redraw of 
the grid after a short timeout. This timeout is added so that call handlers (like HandleChangeRow) 
are not disturbed.
*/
redraw : function(){
    var that = this;
    
    if(this._tRedraw){
        clearTimeout(this._tRedraw);
    }
    
    this._tRedraw = setTimeout(function(){
        var iHeight;
        
        if(that._eTableWrp){
            that.prepareLayout();
            that.updateHeader();
            that.updatePosition(true);
            
            iHeight = that._iRowHeight;
            that.updateRowHeight();
            if(iHeight !== that._iRowHeight){
                that.updateScrollbarSize();
                that.updatePosition();
            }
        }
        that._tRedraw = null;
    }, 10);
},

/*
Implementation of the client-side sorting for non-data-bound lists / grids. It uses the JavaScript 
sort function with a custom comparison function. It uses special comparison functions for special 
columns. If the values of the sort column are equal it will start looking at other columns. 

@private
*/
sortData : function(){
    //  Only do client sorting for non data aware grid and a sort column is set
    if((!this.pbDataAware || this.peDbGridType !== df.gtAutomatic) && this.piSortColumn >= 0){
        var iCol, bRev, aCompare, i;
        
        this.onBeforeCacheUpdate();
        
        //  Determine sort column & order
        iCol = this.piSortColumn;
        bRev = this.pbReverseOrdering;
        
        //  Generate array of comparison methods for each column based on the type
        aCompare = [];
        for(i = 0; i < this._aColumns.length; i++){
            aCompare[i] = df.sys.data.compareFunction(this._aColumns[i].peDataType);
        }
        
        //  Sort the cache using the standard JS sort algoritm
        this._aCache.sort(function(oItem1, oItem2){
            var i, x;
            
            
            if(oItem1.aCells[iCol].sValue !== oItem2.aCells[iCol].sValue){  //  If the sort column values are different we only compare those
                //  Call comparison function for this column
                x = aCompare[iCol](oItem1.aCells[iCol].sValue, oItem2.aCells[iCol].sValue);
                
                return (bRev ? -x : x);
            }  
            //  If the sort column values are equal we are going to look at other columns starting at the first column
            for(i = 0; i < oItem1.aCells.length; i++){
                if(oItem1.aCells[i].sValue !== oItem2.aCells[i].sValue){
                    x = aCompare[i](oItem1.aCells[i].sValue, oItem2.aCells[i].sValue);
            
                    return (bRev ? -x : x);
                }
            }
            return 0;
        });
        
        this.onAfterCacheUpdate();
    }
},



onBeforeCacheUpdate : function(){

},

onAfterCacheUpdate : function(){

},

// - - - - - - - Supportive - - - - - - -

/* 
Finds the cell element that belongs to this column for the current row.

@param  oCol    Column object (df.WebColumn).
@return DOM element (TD) for the column (null if not found / available).
*/
getColCell : function(oCol){
    var iCol, iRow;
    
    //  Determine row & cell number
    iRow = this.findRowByRowId(this.psCurrentRowID);
    iCol = this.findColNr(oCol);
    
    return this.getCell(iRow, iCol);
},

/* 
Finds the cell element for the specified row and column.

@param  iRow    Row number for which we want the cell element.
@param  iCol    Column number for the cell.
@return DOM element (TD) for the column (null if not found / available).
*/
getCell : function(iRow, iCol){
    var eTable;
    
    eTable = this._eTable && this._eTable.childNodes[iRow - this._iRowDispOffset];
    if(eTable){
        return df.dom.query(eTable, "td[data-dfcol='" + iCol + "']");
    }
    return null;
},

/* 
Finds the header cell for the specified column.

@param  oCol    Column object (df.WebColumn).
@return DOM element (TH) for the column header (null if not found / available).
*/
getColHead : function(oCol){
    var iCol;
    
    if(this._eHeadWrp){
        //  Determine row & cell number
        iCol = this.findColNr(oCol);
        
        return df.dom.query(this._eHeadWrp, "th.WebList_ColHead[data-dfcol='" + iCol + "']");
    }
    return null;
},

/* 
Hook that is called before loading data from the server.
*/
showLoading : function(){

},

/* 
Hook that is called when finished loading from the server.
*/
hideLoading : function(){

},

/* 
Determines the row number of the row with the specified row id by going through the cache.

@param  sRowID  RowID of the row we are looking for.
@return Number of the row (-1 if not found).
*/
findRowByRowId : function(sRowID){
    var i;
    
    for(i = 0; i < this._aCache.length; i++){
        if(this._aCache[i].sRowID === sRowID){
            return i;
        }
    }
    
    return -1;
},

/*
Augmenting the addChild method to filter out columns.

@private
*/
addChild : function(oChild){
    if(oChild._bIsColumn){
        this._aColumns.push(oChild);
    }
    
    df.WebList.base.addChild.call(this, oChild);
},

loopCols : function(fHandler, bOptHidden){
    var i, x, iCount = 0, oCol, bLast;
    for(i = 0; i < this._aColumns.length; i++){
        oCol = this._aColumns[i];
        
        //    Skip hidden columns (unless bOptHidden)
        if(oCol.pbRender || bOptHidden){
            //    Determine bLast
            bLast = true;
            for(x = i + 1; x < this._aColumns.length && bLast; x++){
                bLast = !(this._aColumns[x].pbRender || bOptHidden);
            }
            
            if(fHandler.call(this, oCol, i, bLast, iCount) === false){
                return false;
            }
            
            iCount++;
        }
    }
    
    return true;
},

/*
Translates a column number into a cell number. The column number is the index in the array of column 
objects (_aColumns) where the cell number is the index of the visual cell in the rendered table.

@param  iCol    Number of the child column object.
@return Index of the cell in the rendered table.
@private
*/
colNrToCell : function(iCol){
    var i, iCount = 0;
    for(i = 0; i < this._aColumns.length; i++){
        //    Skip hidden columns (unless bOptHidden)
        if(this._aColumns[i].pbRender){
            if(iCol === i){
                return iCount;
            }
            
            iCount++;
        }
    }
    
    return -1;
},

/*
Translates a cell index into a culumn number. The cell index is the number of the rendered cell 
within the table (doesn't include hidden columns) where the column number is the index in the array 
of child column objects (_aColumns).

@param  iCell   Cell index in the rendered table.
@return Column number in the _aColumns array.
@private
*/
cellToColNr : function(iCell){
    var i, iCount = 0;
    
    for(i = 0; i < this._aColumns.length; i++){
        //    Skip hidden columns (unless bOptHidden)
        if(this._aColumns[i].pbRender){
            if(iCell === iCount){
                return i;
            }
            
            iCount++;
        }
    }
    
    return -1;
},

/* 
Translates a column object into a column number by searching the _aColumns array.

@param  oCol    Column object.
@return Column number (zero based, -1 if not found).
@private
 */
findColNr : function(oCol){
    var iCol;
    
    //  Determine column number
    for(iCol = 0; iCol < this._aColumns.length; iCol++){
        if(this._aColumns[iCol] === oCol){
            return iCol;
        }
    }
    
    return -1;
},

findVColNr : function(oCol){
    var iVCol = 0, i, oCur;
    
    for(i = 0; i < this._aColumns.length; i++){
        oCur = this._aColumns[i];
        
        if(oCur.pbRender){
            if(oCur.pbNewLine){
                iVCol = 0;
            }
            if(oCur === oCol){
                return iVCol;
            }
            iVCol += oCur.piListColSpan;
        }
    }
    
    return -1;
},

/*
This function performs an incremental search on the column that the list is currently sorted on. In 
case of a static list (pbDataAware is false or peDbGridType is not gtAutomatic) it will perform the 
search completely on the client and select the row. The search on the client is performed as a 
binary search for optimal performance. If piSortColumn is not set nothing will be done.

@param sSearch   The search string.


@client-action
*/
search : function(sSearch){
    var fComp, aData = this._aCache, iCol = this.piSortColumn, iLow = 0, iHigh = aData.length - 1, iMid, iRes, iRow = null, bRev = this.pbReverseOrdering;
    
    if(iCol < 0){
        return;
    }
    
    if((!this.pbDataAware || this.peDbGridType !== df.gtAutomatic)){
        //  Determine comparison function
        if(this._aColumns[iCol].peDataType === df.ciTypeText){
            //  For text we do a case insensitive comparison of the first characters
            fComp = function(sVal1, sVal2){
                sVal1 = sVal1.substr(0, sVal2.length).toLowerCase();
               
                return sVal1.localeCompare(sVal2);
            };
            
            sSearch = sSearch.toLowerCase();
        }else if(this._aColumns[iCol].peDataType === df.ciTypeBCD){
            fComp = this.compareBCD;
        }else if(this._aColumns[iCol].peDataType === df.ciTypeDate || this._aColumns[iCol].peDataType === df.ciTypeDateTime){
            fComp = this.compareDate;
        }
        
        //  Debugging
        // var fPrevComp = fComp, iCount = 0;
        // fComp = function(sVal1, sVal2){
            // var iRes = fPrevComp(sVal1, sVal2);
            
            // df.debug("Comparing: sVal1='" + sVal1 + "', sVal2='" + sVal2 + "', iRes=" + iRes + ", iLow=" + iLow + ", iMid=" + iMid + ", iHigh=" + iHigh); 
            
            // iCount++;
            
            // return iRes;
        // };
        
        //  Do a binary search
        while(iLow < iHigh){
            iMid = Math.floor((iLow + iHigh) / 2);
            iRes = fComp(aData[iMid].aCells[iCol].sValue, sSearch);
            iRes = (bRev ? -iRes : iRes);
            
            if(iRes < 0){
                iLow = iMid + 1;
            }else if(iRes > 0){
                iHigh = iMid - 1;
            }else{
                iRow = iMid;
                break;
            }
        }
        
        if(iRes === 0){
            //  We want the first full hit
            if(iRow > 0){
                iRes = fComp(aData[iRow - 1].aCells[iCol].sValue, sSearch);
                iRes = (bRev ? -iRes : iRes);
                
                while(iRes === 0 && iRow > 0){
                    iRow--;
                    if(iRow > 0){
                        iRes = fComp(aData[iRow - 1].aCells[iCol].sValue, sSearch);
                    }
                }
            }
        }else{
            //  If we didn't find a full hit and iMid is outside range we assume that the range is right
            if(iMid < iLow){
                iRow = iLow;
            }else if(iMid > iLow){
                iRow = iHigh;
            }else{
                iRow = iMid;
            }
        }
    
        //  Move to the row
        this.moveToRow(iRow);
    }else{
        //  For automatic data aware grids we send the search action to the server
        this.serverAction("OnSearch", [ sSearch ]);
    }
},

/*
This function displays the search dialog for doing an incremental search on the list. It creates a 
dialog that has an input form and data settings are based on the current sort column.

@param sOptSearch   The search string.

@client-action
*/
showSearch : function(sOptSearch){
    var oDialog, oContentPnl, oForm, oButtonPnl, oOKBtn, oCancelBtn, iWindowWidth = df.dom.windowWidth(), iCol = this.piSortColumn;
    
    if(iCol < 0){
        return;
    }
    
    //  Create dialog with panel
    oDialog = new df.WebModalDialog(null, this);
    oDialog.psCaption = this.getWebApp().getTrans("search") + ": " + this._aColumns[iCol].psCaption;
    oDialog.pbShowClose = true;
    oDialog.pbDDHotKeys = false;
    oDialog.pbResizable = false;
    oDialog.piMinWidth = (iWindowWidth > 390 ? 370 : iWindowWidth - 20);
    oDialog.psCSSClass = "WebMsgBox";
    
    //  Create input form
    oContentPnl = new df.WebPanel(null, oDialog);
    oContentPnl.peRegion = df.ciRegionCenter;

    oDialog.addChild(oContentPnl);

    oForm = new df.WebForm(null, oDialog);
    oForm.psLabel = "";
    oForm.pbShowLabel = false;
    oForm.psValue     = sOptSearch || "";
    oForm.peDataType  = this._aColumns[iCol].peDataType;
    oForm.psMask      = this._aColumns[iCol].psMask;
    oForm.piPrecision = this._aColumns[iCol].piPrecision;
    oForm.piMaxLength = this._aColumns[iCol].piMaxLength;
    oForm.pbCapslock  = this._aColumns[iCol].pbCapslock;
    oForm.peAlign     = df.ciAlignLeft;

    oContentPnl.addChild(oForm);
    
    // Create close button
    oButtonPnl = new df.WebPanel(null, oDialog);
    oButtonPnl.peRegion = df.ciRegionBottom;
    oButtonPnl.piColumnCount = 3;
    oButtonPnl.psCSSClass = "WebMsgBoxOneBtn";

    oDialog.addChild(oButtonPnl);
    
    oOKBtn = new df.WebButton(null, oDialog);
    oOKBtn.psCaption = this.getWebApp().getTrans("ok");
    oOKBtn.piColumnIndex = 1;
    oOKBtn.pbShowLabel = false;
    oOKBtn.OnClick.addListener(function(oEvent){
        oDialog.fire('OnSubmit');
    }, this);

    oButtonPnl.addChild(oOKBtn);
    
    oCancelBtn = new df.WebButton(null, oDialog);
    oCancelBtn.psCaption = this.getWebApp().getTrans("cancel");
    oCancelBtn.piColumnIndex = 2;
    oCancelBtn.pbShowLabel = false;
    oCancelBtn.OnClick.addListener(function(oEvent){
        oDialog.hide();
    }, this);

    oButtonPnl.addChild(oCancelBtn);
    
    //  Add submit listener
    oDialog.OnSubmit.addListener(function(oEvent){
        var sVal = oForm.get("psValue");
        oDialog.hide();
               
        this.objFocus();
        
        this.search(sVal);
        
        if(this._eFocus){
            this._eFocus.focus();
        }
    }, this);
    
    oDialog.show();
    
    if(!df.sys.isMobile){
        df.dom.setCaretPosition(oForm._eControl, oForm._eControl.value.length);
    }
},

/*
Handles the keypress event and will initiate the auto search if needed. The keypress is used because 
we need the character code and are not interested in special keys anyway. 

@param  oEvent  The event object.
@private
*/
onKeyPress : function(oEvent){
    var sChar, iKey, iChar;
    
    //  Check enabled state
    if(!this.isEnabled()){
        return;
    }
    
    //  Auto search
    if(this.pbAutoSearch && this.piSortColumn >= 0 && !this._bNoSearch){
        iKey = oEvent.getKeyCode();
        iChar = oEvent.getCharCode();
        
        //  Check if we where really typing a character (33 is the first sensible character in the ASCII table that should popup the search)
        if(iChar > 32 && !oEvent.isSpecialKey()){ // && (iKey === 0 || (iKey > 48 && iKey < 123)) 

            sChar = String.fromCharCode(oEvent.getCharCode());
            
            //  Filter character based on data type (this is done pretty raw)
            if(this._aColumns[this.piSortColumn].peDataType === df.ciTypeBCD){
                if(("0123456789,.-").indexOf(sChar) < 0){
                    sChar = "";
                }
            }else if(this._aColumns[this.piSortColumn].peDataType === df.ciTypeDate){
                if(("0123456789-").indexOf(sChar) < 0){
                    sChar = "";
                }
            }
            
            //  Display search dialog
            this.showSearch(sChar);
            
            oEvent.stop();
            return false;
        }
    }
    
    return true;
},

/*
This method handles the keypress event and initiates the actions bound to it. The 
df.settings.listKeys define the exact key code's / combinations for the different actions.

@param  oEvent  The event object.
@return False if we did handle the event and performed an action, true if we didn't do anything.
*/
onKeyDown : function(oEvent){
    var that = this;
    
    //  Check enabled state
    if(!this.isEnabled()){
        return;
    }
    
    if(oEvent.matchKey(df.settings.listKeys.scrollUp)){ 
        this.moveUpRow();
    }else if(oEvent.matchKey(df.settings.listKeys.scrollDown)){ 
        this.moveDownRow();
    }else if(oEvent.matchKey(df.settings.listKeys.scrollPageUp)){ 
        this.movePageUp();
    }else if(oEvent.matchKey(df.settings.listKeys.scrollPageDown)){ 
        this.movePageDown();
    }else if(oEvent.matchKey(df.settings.listKeys.scrollTop)){ 
        this.moveToFirstRow();
    }else if(oEvent.matchKey(df.settings.listKeys.scrollBottom)){ 
        this.moveToLastRow();
    }else if(oEvent.matchKey(df.settings.formKeys.submit)){ 
        //  The OnRowClick event is also fired on enter and overrides the OnSubmit if it is handled.
        if(this.psCurrentRowID){
            if(!this.fire("OnRowClick", [ this.psCurrentRowID ])){
                return true;
            }
        }else{
            return true;
        }
    }else{
        return true;
    }
    
    //  Temporary block search on key press (stopping onKeyDown doesn't cancel onKeyPress in firefox)
    this._bNoSearch = true;
    setTimeout(function(){
        that._bNoSearch = false;
    }, 50);
    
    oEvent.stop();
    return false;
},

/* 
This function handles the click event on the list table. It determines which row and which column is 
clicked. It will trigger the cellClick on the column object and change row if needed.

@param  oEvent  Event object.
@private
*/
onTableClick : function(oEvent){
    var eElem = oEvent.getTarget(), iCol = -1, iRow, that = this;
    
    //  Check enabled state
    if(!this.isEnabled() || this._bCancelClick){
        return;
    }
    
    this._bHasFocus = true;
    
    //  We need to determine if and which row was clicked so we start at the clicked element and move up untill we find the row
    while(eElem.parentNode && eElem !== this._eBody){
        //  Check if we found the tr element and if it is part of the table
        if(eElem.tagName === "TD" && eElem.hasAttribute("data-dfcol")){
            
            iCol = eElem.getAttribute("data-dfcol");
            
        }else if(eElem.tagName === "TABLE" && eElem.hasAttribute("data-dfrowid")){
            iRow = this.findRowByRowId(eElem.getAttribute("data-dfrowid"));
            
            if(iRow >= 0){
                
                //  Notify column of (before)click
                if(iCol >= 0){
                    if(this._aColumns[iCol].cellClickBefore(oEvent, this._aCache[iRow].sRowID, this._aCache[iRow].aCells[iCol].sValue)){
                        this.focus();
                        return;
                    }
                }
                
                //  Perform the rowchange
                this.selectRow("row", iRow, function(){
                    this.focus();
                });
                
                //  Notify column of (after)click
                if(iCol >= 0){
                    if(this._aColumns[iCol].cellClickAfter(oEvent, this._aCache[iRow].sRowID, this._aCache[iRow].aCells[iCol].sValue)){
                        this.focus();
                        return;
                    }
                }
                
                if(this.fire("OnRowClick", [ this._aCache[iRow].sRowID ])){
                    this._bPreventSubmit = true;
                    setTimeout(function(){
                        that._bPreventSubmit = false;
                    }, 250);
                    oEvent.stop();
                }
            }
            // oEvent.stop();
            return;
        }
        
        eElem = eElem.parentNode;
    }

},

/*
Handles the onclick event on the list header. It will determine which column is clicked and if 
pbColumnSortable is true and pbSortable of the column is true it will update the sorting by calling 
the changeSorting method.

@param  oEvent  The event object (df.events.DOMEvent).
@return
*/
onHeadClick : function(oEvent){
    var eElem = oEvent.getTarget(), iCol;
    
    //  Check enabled state
    if(!this.isEnabled()){
        return;
    }
    
    if(this.pbColumnSortable){
        //  Find the column header div
        while(eElem.parentNode && eElem !== this._eHead){
            if(eElem.tagName === "TH" && eElem.hasAttribute("data-dfcol")){
                //  Determine the column
                iCol = parseInt(eElem.getAttribute("data-dfcol"), 10);
                if(this._aColumns[iCol]){
                    
                    this._aColumns[iCol].fire("OnHeaderClick", [], function(oEvent){
                        if(!oEvent.bServer && !oEvent.bClient){
                            if(this._aColumns[iCol].pbSortable){
                                //  Update the sortcolumn property
                                if(this.piSortColumn === iCol){
                                    this.changeSorting(iCol, !this.pbReverseOrdering);
                                }else{
                                    this.changeSorting(iCol, false);
                                }
                            }
                        }
                    }, this);
                }
                
                
                return;
            }
            
            eElem = eElem.parentNode;
        }
    }
},

updateHeader : function(){
    var aHtml = [];
    
    if(this._eHeadWrp){
        this.headerHtml(aHtml);
        this._eHeadWrp.innerHTML = aHtml.join("");
    }
},


/*
This method changes the sorting order to the supplied column and direction. It will update 
piSortColumn and pbReverseOrdering properties and send ChangeSorting to the server. The header is 
also updated.

@param  iCol        Column number to sort on.
@param  bReverse    If true the order will be reversed.
*/
changeSorting : function(iCol, bReverse){
    var iPrevCol = this.piSortColumn, bPrevReverse = this.pbReverseOrdering;
    
    this.addSync('piSortColumn');
    this.addSync('pbReverseOrdering');
    
    this.piSortColumn = iCol;
    this.pbReverseOrdering = bReverse;
    
    //  Data aware grids set to automatic sort on the server
    if(this.pbDataAware && this.peDbGridType === df.gtAutomatic){
        this.serverAction("ChangeSorting", [ iCol, bReverse, iPrevCol, bPrevReverse ]);
    }else{
        this.sortData();
        this.scrollToCurrentRow();        
        this.updatePosition(true);
    }
    
    this.updateHeader();
},

onHeadMouseDown : function(oEvent){
    var eTarget = oEvent.getTarget();
    
    //  Check enabled state
    if(!this.isEnabled()){
        return;
    }

    //    Check if it is the resize div
    if(eTarget.className === 'WebList_ColSep' && this.pbColumnsResizable){
        this.resizeColumn(oEvent, parseInt(eTarget.getAttribute('data-dfcol'), 10));
        
        oEvent.stop();
        return false;
    }
    
    return true;
},

onTableDblClick : function(oEvent){
    //  Check enabled state
    if(!this.isEnabled() || this._bPreventSubmit){
        return;
    }
    
    this.fireSubmit();
},

// - - - - - - - Public API - - - - - - -

/*

@client-action
*/
gridRefresh : function(bFirst, bLast){
    this._bNoRender = true;
    
    //  Cancel row change and row click because we are going to refresh the data set and the row might not exist any more
    this.cancelServerAction("ChangeCurrentRow");
    this.cancelServerAction("OnRowClick");  //  Also cancel onclick as this causes problems because of the assumption that the ChangeCurrentRow has been executed
    
    this.clearCache();
    
    this.handleDataPage("page", "", bFirst, bLast);
    
    if(this.psCurrentRowID === ""){
        if(this._aCache.length > 0){
            this.selectRow("row", 0, function(){
                this.scrollToCurrentRow();
            });
        }else{
            this.appendNewRow();
        }
    }
},

/*
Scrolls to the first record and selects it. It is called by the keyboard handler or from the server. 
In case of a static grid it will directly call the selectRow function to select the first row, for a 
non-static grid (pbDataAware is true or peDbGridType is not gtAutomatic) it will always refresh the 
cache by loading the first page of records. Note that when pbOfflineEditing is true we need to load 
the first cache page before changing rows.

@client-action
*/
moveToFirstRow : function(){
    var fSelect, sRowID = this.psCurrentRowID, iRow; 
    
    iRow = this.findRowByRowId(sRowID);
    
    fSelect = function(){
        if(this._aCache.length > 0){
            this.selectRow("row", 0, function(bChanged){
                if(bChanged){
                    this.scrollToCurrentRow();
                }
            });
        }else{
            this.appendNewRow();
        }        
    };
    
    if(!this.pbDataAware || this.peDbGridType !== df.gtAutomatic){
        fSelect.call(this);
    }else{
        if(this.pbOfflineEditing || (iRow === 0 && sRowID === "")){
            this.loadCachePage("first", function(){
                fSelect.call(this);
            });
        }else{
            this.selectRow("first", -1, function(bChanged){
                if(bChanged){
                    //this.loadCachePage("last"); // This is now done by the server!
                    this.scrollToCurrentRow();
                }
            });
        }
    }
},

/*
Scrolls to the last record and selects it. It is called by the keyboard handler or from the server. 
In case of a static grid it will directly call the selectRow function to select the last row, for a 
non-static grid (pbDataAware is true or peDbGridType is not gtAutomatic) it will always refresh the 
cache by loading the last page of records. Note that when pbOfflineEditing is true we need to load 
the last cache page before changing rows.

@client-action
*/
moveToLastRow : function(){
    var fSelect, sRowID = this.psCurrentRowID, iRow; 
    
    iRow = this.findRowByRowId(sRowID);
    
    fSelect = function(){
        if(this._aCache.length > 0){
            this.selectRow("row", this._aCache.length - 1, function(bChanged){
                if(bChanged){
                    this.scrollToCurrentRow();
                }
            });
        }else{
            this.appendNewRow();
        }   
    };
    
    if(!this.pbDataAware || this.peDbGridType !== df.gtAutomatic){
        fSelect.call(this);
    }else{
        if(this.pbOfflineEditing || (iRow === 0 && sRowID === "")){
            this.loadCachePage("last", function(){
                fSelect.call(this);
            });
        }else{
            this.selectRow("last", -1, function(bChanged){
                if(bChanged){
                    //this.loadCachePage("last"); // This is now done by the server!
                    this.scrollToCurrentRow();
                }
            });
        }
    }
},

/*
This method selects the next row available in the cache and returns true if successful. It is called 
by the key handler or the server.

@return True if a next row is available.
@client-action
*/
moveDownRow : function(){
    var iRow = this.findRowByRowId(this.psCurrentRowID);
    if(iRow >= 0 && iRow < this._aCache.length - 1){
        iRow++;
        
        this.selectRow("row", iRow, function(bChanged){
            if(bChanged){
                this.scrollToCurrentRow();
            }
        });
        
        return true;
    }
    
    return false;
},

/*
This method selects the previous row available in the cache and returns true if successful. It is 
called by the key handler or the server.

@return True if a previous row is available.
@client-action
*/
moveUpRow : function(){
    var iRow = this.findRowByRowId(this.psCurrentRowID);

    if(iRow > 0){
        iRow--;
        
        this.selectRow("row", iRow, function(bChanged){
            if(bChanged){
                this.scrollToCurrentRow();
            }
        });
    }
},

/*
This method performs a page down which means that it select the record one page down in the cache 
and scrolls to it. A page in this context means the amount of rows that fit inside the grid view. It 
is called by the key handler or the server.

@client-action
*/
movePageDown : function(){
    var iRow = this.findRowByRowId(this.psCurrentRowID);
    
    iRow = iRow + this.getViewSize() - 1;
    if(iRow >= this._aCache.length){
        iRow = this._aCache.length - 1;
    }
    
    this.selectRow("row", iRow, function(bChanged){
        if(bChanged){
            this.scrollToCurrentRow();
        }
    });
},

/*
This method performs a page up which means that it select the record one page up in the cache and 
scrolls to it. A page in this context means the amount of rows that fit inside the grid view. It is 
called by the key handler or the server.

@client-action
*/
movePageUp : function(){
    var iRow = this.findRowByRowId(this.psCurrentRowID);
    
    iRow = iRow - this.getViewSize() + 1;
    if(iRow < 0){
        iRow = 0;
    }
    
    this.selectRow("row", iRow, function(bChanged){
        if(bChanged){
            this.scrollToCurrentRow();
        }
    });
},

/*
This method moves to a specific row based on its row index.

@client-action
*/
moveToRow : function(iRowIndex){
    //  Since this method can be called from the server the parameter might still be a string
    iRowIndex = parseInt(iRowIndex, 10);

    if(iRowIndex >= 0 && iRowIndex < this._aCache.length){
        this.selectRow("row", iRowIndex, function(bChanged){
            if(bChanged){
                this.scrollToCurrentRow();
            }
        });
    }
},

/*
This method moves to a specific row based on its unique row ID.

@client-action
*/
moveToRowByID : function(sRowID){
    var iRowIndex = this.findRowByRowId(sRowID);
    
    if(iRowIndex >= 0){
        this.moveToRow(iRowIndex);
    }
},

/*
@client-action
*/
processDataSet : function(eOperation){
    var iRow = this.findRowByRowId(this.psCurrentRowID);

    this.serverAction("HandleProcessDataSet", [ eOperation, iRow ], this.serializeVT(this._aCache));
},

/* 
Updates the placeholder by inserting / removing the placeholder element and updating its text.
*/
updatePlaceHolder : function(){
    if(this._eTable){
        if(!this._aCache.length && this.psPlaceHolder){
            if(!this._ePlaceHolder){
                this._ePlaceHolder = df.dom.create('<div class="WebList_PlaceHolder"></div>');
                // this._eTable.parentNode.insertBefore(this._ePlaceHolder, this._eTable);
                this._eTableWrp.appendChild(this._ePlaceHolder);
            }
            df.dom.setText(this._ePlaceHolder, this.psPlaceHolder);
        }else   if(this._ePlaceHolder){
            this._ePlaceHolder.parentNode.removeChild(this._ePlaceHolder);
            this._ePlaceHolder = null;
        }
    }
},

/* 
Augments applyEnabled to set the tabindex attribute of the control element.

@param  bVal    The enabled state.
*/
applyEnabled : function(bVal){
    this._eFocus.tabIndex = (bVal ? 0 : -1);

    df.WebList.base.applyEnabled.call(this, bVal);
},

/* 
Setter that updates the placeholder text.

@param  sVal    New value.
*/
set_psPlaceHolder : function(sVal){
    this.psPlaceHolder = sVal;
    this.updatePlaceHolder();
},

/*
Setter method for the pbColumnSortable property that updates the header so it displays the columns 
as sortable or not.

@param  bVal    The new value.
*/
set_pbColumnSortable : function(bVal){
    if(this._eElem){
        this.pbColumnSortable = bVal;
        this.updateHeader();
    }
},

set_pbColumnsResizable : function(bVal){
    df.dom.toggleClass(this._eHeadWrp, "WebList_ColResizable", bVal);
    
    //  Reset column sizes to orrigional when resetting
    if(!bVal){
        this.prepareLayout();
        if(this._eElem){
            this.updateHeader();
            this.updatePosition(true);
        }
    }
},

get_piCurrentRowIndex : function(){
    return this.findRowByRowId(this.psCurrentRowID);
},

get_piRowCount : function(){
    return this._aCache.length;
},

set_pbShowSelected : function(bVal){
    if(this._eBody){
        df.dom.toggleClass(this._eBody, "WebList_ShowSelected", bVal);
    }
},

/* 
Setter method that updates the header to reflect the current sorting.

@param  iVal    The new value.
*/
set_piSortColumn : function(iVal){
    if(this._eTableWrp && this.piSortColumn !== iVal){
        if(this.piSortColumn !== iVal){
            this.changeSorting(iVal, this.pbReverseOrdering);
        }
        
         // Refresh the header
        this.updateHeader();
    }
},

/* 
Setter method that updates the header to reflect the current sorting.

@param  bVal    The new value.
*/
set_pbReverseOrdering : function(bVal){
    if(this._eTableWrp && this.pbReverseOrdering !== bVal){
        if(this.pbReverseOrdering !== bVal){
            this.changeSorting(this.piSortColumn, bVal);
        }
        
         // Refresh the header
        this.updateHeader();
    }
},

set_pbShowHeader : function(bVal){
    if(this._eHead){
        this._eHead.style.display = (bVal ? "" : "none");
        
        if(bVal !== this.pbShowHeader){
            this.sizeChanged();
        }
    }
},



// - - - - - - - Grid API Stubs - - - - - - -
appendNewRow : function(){
    return false;
},

// - - - - - - - Focus - - - - - - -
/*
We override the focus method and make it give the focus to the hidden focus holder element.

@return True if the List can take the focus.
*/
focus : function(){
    if(this._bFocusAble && this.isEnabled() && this._eFocus){
        this._eFocus.focus();
        
        this.objFocus();
        return true;
    }

    return false;
},

onListClick : function(oEvent){
    this.focus();
},

onFocus : function(oEvent){
    if(!this._bHasFocus){
        df.WebList.base.onFocus.call(this, oEvent);
    }
    
    this._bLozingFocus = false;
},

onBlur : function(oEvent){
    var that = this;
    
    this._bLozingFocus = true;
    
    setTimeout(function(){
        if(that._bLozingFocus){
            df.WebList.base.onBlur.call(that, oEvent);
            
            that._bLozingFocus = false;
        }
    }, 100);
},

// - - - - - - - Sizing - - - - - - -

/* 
Called by the WebBaseControl sizing logic when the height of the control changes and during i
nitialization.

@param  iHeight     The height in pixels (0 if it should size naturally).
@param  bSense      If false the size is expected to not be the final size.
*/
setHeight : function(iHeight, bSense){
    if(this._eBody){
        //  The list has a hard-coded minimum of 80px
        if(iHeight <= 80){
            iHeight = 80;
        }
    
        //  If the label is on top we reduce that (note that this means that piMinHeight and piHeight are including the label)
        if(this._eLbl && this.peLabelPosition === df.ciLabelTop){
            iHeight -= this._eLbl.offsetHeight;
        }
        
        //  Reduce the grid header
        iHeight -= this._eHead.offsetHeight;
        
        //  Reduce the margins, paddings and border widths of the wrapping elements
        iHeight -= df.sys.gui.getVertBoxDiff(this._eBody);
        iHeight -= df.sys.gui.getVertBoxDiff(this._eBodyWrp);
        iHeight -= df.sys.gui.getVertBoxDiff(this._eInner);
        iHeight -= df.sys.gui.getVertBoxDiff(this._eControlWrp);

        //iHeight -= 4;
        //  Set the height on the grid body
        this._eBody.style.height = iHeight + "px";
        this._eScrollbar.style.height = iHeight + "px";
        
        if(bSense && !this._bFirstDraw){
            this._iTableHeight = iHeight;
            
            try{
                this.updatePosition(true);
                this.updateRowHeight();
                this.centerCurrentRow();
            }catch (oErr){
                df.handleError(oErr, this);
            }
            this._bFirstDraw = true;
        }else if(this._iTableHeight !== iHeight){
            this._iTableHeight = iHeight;
            this.updatePosition(false);
        }
    }
},

resize : function(){
    var iWidth, iScrollbarWidth;
    
    if(!this._iScrollbarWidth){
        this._iScrollbarWidth = this._eBody.clientWidth - this._eTableWrp.clientWidth;
        
        //  Adjust the margin for the scrollbar
        if(this._iScrollbarWidth > 0){
            this._eHead.style.paddingRight = this._iScrollbarWidth + "px";
        }
    }
    
    this.updateRowHeight();
    this.updateScrollbarSize();
    this.updateHeader();
}

});

