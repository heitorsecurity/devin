/*
Class:
    df.WebBaseForm
Extends:
    df.WebBaseDEO

Base class for text input data entry objects like WebForm and WebEdit. It implements the pbReadOnly 
property.
    
Revision:
    2011/08/26  (HW, DAW) 
        Initial version.
*/
df.WebBaseForm = function WebBaseForm(sName, oParent){
    df.WebBaseForm.base.constructor.call(this, sName, oParent);
    
    this.prop(df.tBool, "pbReadOnly", false);
};
df.defineClass("df.WebBaseForm", "df.WebBaseDEO",{

/* 
Augment the afterRender to execute setters.

@private
*/
afterRender : function(){
    df.WebBaseForm.base.afterRender.apply(this, arguments);
    
    this.set_piMaxLength(this.piMaxLength);
    this.set_pbReadOnly(this.pbReadOnly);
},

/* 
Implementation of the pbReadOnly property which maps to the DOM readOnly property and sets / removes
the Web_ReadOnly property.

@param  bVal    New value.
*/
set_pbReadOnly : function(bVal){
    if(this._eControl){
        this._eControl.readOnly = bVal;
        
        df.dom.toggleClass(this._eElem, "Web_ReadOnly", bVal);
    }
},

/*
Setter for piMaxLength that sets the maximum field length to the input control.

@param  iVal    New value.
*/
set_piMaxLength : function(iVal){
    if(this._eControl){
        if(this.peDataType === df.ciTypeText && !this.psMask){
            this._eControl.maxLength = (iVal > 0 ? iVal : 0);
        }else{
            this._eControl.maxLength = 1048576;
        }
    }
}

});