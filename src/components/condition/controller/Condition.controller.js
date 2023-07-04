sap.ui.define([
    "aklc/cm/library/common/controller/BaseController",
    "aklc/cm/library/common/controller/Validation"
], function(BaseController, Validation) {
    "use strict";

    return BaseController.extend("aklc.cm.components.condition.controller.Condition", {
        /**
         * on init
         * @param  {object} oEvent Event object
         */
        /*eslint-disable */
        onInit: function(oEvent) {  
            var oController = this;
            var sRichtext;
            var sRichtextEdiotr= this.getView().byId("richtext");
            var sFontStyle = sRichtextEdiotr.getButtonGroups()[0];
            if(sFontStyle){
                if( sFontStyle.buttons.length === 4 ){
                       sFontStyle.buttons.pop();
                }
            }
        },
        
        /*eslint-enable */
        handleConditionEdit: function(sEditFlag) {
            if (sEditFlag === true) {
                return true;
            } else {
                return false;
            }
        },
        handleBeforeEditorInit: function(oEvent) {
        // Set the Rich Text editor as "One Way" binding
        var oSource = oEvent.getSource();
        var oBinding = oSource.getBinding("value");
        oBinding.setBindingMode("OneWay");
        }

    });
});
