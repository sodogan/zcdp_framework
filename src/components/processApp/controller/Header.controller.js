sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function(Controller, MessageToast) {
    "use strict";
    return Controller.extend("aklc.cm.components.processApp.controller.Header", {
        sCurrentStepKey: "", // Current Task

        /**
         * on init
         */
        onInit: function() {

        },
        

        /**
         * This event hanler will launch crm web ui from Ux.
         */
        pressUrlOpen: function() {

            // Get the Application Link Url for CRM_UI component
            if (this.sCurrentStepKey) {

                var sQuery = "/ApplicationLinks(StepKey='" + this.sCurrentStepKey + "'," + "Component='CRM_UI')";
                this.getView().getModel().read(sQuery, {
                    success: function(oData) {

                        // Open the CRM Url for Application ID
                        window.open(oData.Url);
                    }
                });
            }
        },

        /**
         * Returns I18N text for the provided text key. Placeholders in the text will be replaced by parameters passed to this method.
         * 
         * @param {String} sTextKey The text key to get I18N text for.
         * @param {Array} aParameters The array of parameters for the text key.
         * @return {String} The text corresponding to the supplied key and parameters.
         * @public
         *
         */
        getI18NText: function(sTextKey, aParameters) {
            return this.getView().getModel("i18n").getResourceBundle().getText(sTextKey, aParameters);
        },

        /**
         * This event handler will attach tooltip for Edit icon
         */
        DescTooltip: function(oEvent) {
            var edit_icon = sap.ui.getCore().byId("workdescription_editicon");
            edit_icon.setTooltip(this.getI18NText("Edit"));
            var odelegateObj = edit_icon.aDelegates[0].oDelegate;
            edit_icon.removeEventDelegate(odelegateObj);
        },

        /**
         * This event handler will enable Update button and detach Listener for liveChange
         */
        onDescriptionChange: function(oEvent) {
            var workdescription = oEvent.getSource();
            var sEnabled = sap.ui.getCore().byId("UpdateDescription");
            if(sEnabled.getEnabled() == false) {
                sEnabled.setEnabled(true);
            }
            workdescription.detachLiveChange(this.onDescriptionChange,this);
        },

        /**
         * This event handler will open Edit Description Popup 
         */
        onEditDescription: function () {
            var sDescription = sap.ui.getCore().byId("idWorkDescription").getText();
            // create dialog lazily
            if (!this.oDialog) {
                //create Buttons for Dialog
                var oBtnCancel = new sap.m.Button({
                    text: "Close",
                    press: function() { 
                        workdescription.setValueState("None");
                        workdescription.detachLiveChange(this.onDescriptionChange,this);
                        this.oDialog.close();
                    }.bind(this)
                });
                var oBtnUpdate = new sap.m.Button({
                    text: "Update",
                    enabled: false,
                    id: "UpdateDescription",
                    press: function() {
                        var oController = this; 
                        var newworkdescription = workdescription.getValue();
                        sDescription = sap.ui.getCore().byId("idWorkDescription").getText();
                     
                        if (newworkdescription.trim().length == 0 ) {
                            workdescription.setValueState("Error");
                            workdescription.setValueStateText(oController.getI18NText("MandatoryField", oController.getI18NText("descriptionOfWork")));  
                        }
                        else
                        {
                            workdescription.setValueState("None");
                            if(newworkdescription.trim() != sDescription.trim()  )
                            {
                                this.oDialog.setBusy(true);
                                var currentmodel = this.getView().getBindingContext().getModel();
                                var currentBindingContext = this.getView().getBindingContext();
                                var currentPath = currentBindingContext.getPath();
                                var self=this;

                                //Set Data to be updated
                                var oEntry = {};
                                oEntry.DescriptionOfWork = newworkdescription;
                                
                                currentmodel.update(currentPath, oEntry, {
                                    success: function(oResponses) 
                                    {
                                        MessageToast.show(oController.getI18NText("UpdateSuccessMessage"));
                                        // Set Busy to False
                                        self.oDialog.setBusy(false);
                                        self.oDialog.close(); 
                                        currentmodel.setProperty(currentPath+"/DescriptionOfWork", newworkdescription);

                                    },
                                    error: function() {

                                        MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
                                        // Set Busy to False
                                        self.oDialog.setBusy(false);
                                        self.oDialog.close(); 
                                    }
                                });
                            }
                            else
                            {
                                MessageToast.show(this.getI18NText("NoChangeSaveMessage"));
                            }
                        }
                        workdescription.detachLiveChange(this.onDescriptionChange,this);
                    }.bind(this)
                });

                
                // create dialog via fragment factory
                this.oDialog = sap.ui.xmlfragment(this.createId("fragment_id1"), "aklc.cm.components.processApp.fragments.EditHeaderDescription");
                // connect dialog to view (models, lifecycle)
                this.getView().addDependent(this.oDialog)
                this.oDialog.addButton(oBtnUpdate);
                this.oDialog.addButton(oBtnCancel);
                
             } 
            
            var workdescription = this.byId(sap.ui.core.Fragment.createId("fragment_id1","workdescriptionarea"));
            workdescription.setValue(sDescription);
            workdescription.attachLiveChange(this.onDescriptionChange,this);
            sap.ui.getCore().byId("UpdateDescription").setEnabled(false);
            this.oDialog.open();
        }
    });
});
