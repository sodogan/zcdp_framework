sap.ui.define([
    "aklc/cm/library/common/controller/BaseController",
    "aklc/cm/library/common/controller/Validation"
], function(BaseController, Validation) {
    "use strict";

    return BaseController.extend("aklc.cm.components.condition.controller.Monitor", {
        /**
         * on init
         * @param  {object} oEvent Event object
         */
        onInit: function(oEvent) {

        },

        setFinal: function(sFinal) {
            if (sFinal === true) {
                this.getView().byId("final").setSelectedKey("true");
            } else {
                this.getView().byId("final").setSelectedKey("false");
            }

        }

    });
});
