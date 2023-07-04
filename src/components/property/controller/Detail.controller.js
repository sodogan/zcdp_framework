sap.ui.define([
    "aklc/cm/library/common/controller/BaseController",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/ColumnListItem",
    "sap/m/ObjectIdentifier",
    "sap/m/Text",
    "sap/m/MessageToast",
    "aklc/cm/library/common/controller/Validation"
], function(BaseController, Fragment, Filter, FilterOperator, ColumnListItem, ObjectIdentifier, Text, MessageToast, Validation) {
    "use strict";

    return BaseController.extend("aklc.cm.components.property.controller.Detail", {
        _formFields: ["legalDescription"],
        _readonlyFormFields: ["address", "owner"],
        _sUpdate: "UPDATE",
        _sCreate: "CREATE",
        _sSaveId: "add",
        _sChannelId: "property",
        _sPSearchHelp: "aklc.cm.components.property.fragments.LegalDescription",
        _sFilterFragment: "aklc.cm.components.property.fragments.Filter",
        _oMainController: "",
        _sSearchValue: "",
        /**
         * on init
         *
         */
        onInit: function() {
            BaseController.prototype.onInit.apply(this);
            this._oForm = this._oView.byId("PROPERTY_FORM");
            this.oComponent = this.getOwnerComponent();

            this._oBundle = this.getComponent().getModel("i18n").getResourceBundle();

            this.oValidation = new Validation(this);

            this._oMessageManager = sap.ui.getCore().getMessageManager();
            this._oMessageManager.registerObject(this.getView(), true);

            var oController = this;

            this.getEventBus().subscribe(this._sChannelId, "refreshPropertyForm",

                function(sChannelId, sEventId, oData) {
                    oController._oContext = oData.context;
                    oController._oForm.setBindingContext(oData.context);

                    //Make form fields read-only
                    if (oData.action === oController._sUpdate) {
                        oController.toggleEditableFields(false);
                        oController.oComponent._setViewModelProperty("SaveBtn_Visible", false);
                    } else if (oData.action === oController._sCreate) {
                        oController.toggleEditableFields(true);
                        oController.oComponent._setViewModelProperty("SaveBtn_Visible", true);
                    }
                });

            this.oPSTemplate = new ColumnListItem({ // Template used for Partner Search Dialog
                cells: [
                    new ObjectIdentifier({
                        text: "{LegalDescription}"
                    }),
                    new Text({
                        text: "{Address}"
                    }), new sap.m.Text({
                        text: "{Owner}"
                    }), new sap.m.Text({
                        text: "{PropStatusText}"
                    })
                ]
            });
        },

        /**
         * set field visible or not using Id
         * @param  {string} id Id of the field
         * @param {boolean} visible for control visibility
         */
        setVisibleField: function(id, visible) {
            this.getView().byId(id).setVisible(visible);
        },

        onContextChanged: function(sChannel, sEvent, oData) {

            this._oMainController = oData.controller;
            this._sStepKey = this._oModel.getProperty("StepKey", oData.context);
        },

        cancelKeyPress: function(oEvent) {
            return oEvent.getSource().setValue(oEvent.getSource()._lastValue);
        },

        handlePSearchHelp: function(oEvent) {

            this.inputId = oEvent.getSource().getId();

            if (!this._psHelpDialog) {
                this._psHelpDialog = sap.ui.xmlfragment( "idPSHelp",
                    this._sPSearchHelp, this
                );

                this._psHelpDialog.setModel(this._oModel); //Required so table dialog shows data from service

                this._psHelpDialog.setModel(this.getView().getModel("i18n"), "i18n");
                this.getView().addDependent(this._psHelpDialog);
            }

            this.aFilterBy = [];
            this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));

            this._psHelpDialog.bindAggregation("items", {
                path: "/PropertySearch",
                sorter: null,
                parameters: {},
                template: this.oPSTemplate,
                filters: this.aFilterBy
            });

            // // Attach listener for OData request & completed to manage busy indicator
            // this._psHelpDialog.getBinding("items").attachEvent("dataRequested", this.handleRequested, this);
            // this._psHelpDialog.getBinding("items").attachEvent("dataReceived", this.handleRequestCompleted, this);

            this._psHelpDialog.open();
        },

        _handlePSValueHelpSearch: function(oEvent) {
            
            var sValue = oEvent.getParameter("value");
            var aFilters = [];

            this._sSearchValue = sValue;

            if (sValue !== "") {

                // Fill Filter with Contains, if Searched value is not initial
                aFilters.push(new Filter(
                    "SearchTerm",
                    FilterOperator.Contains, sValue
                ));

                var oMultiFilter = new Filter({
                    filters: aFilters
                });

                oEvent.getSource().getBinding("items").filter(oMultiFilter);
            
            } else {

                oEvent.getSource().getBinding("items").filter([]);

            } 
        },

        _handleValueHelpClose: function(oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");

            if (oSelectedItem) {
                var oContext = oSelectedItem.getBindingContext().getObject();

                this._setFormModelProperty("LegalDescription", oContext.LegalDescription);
                this._setFormModelProperty("PropertyId", oContext.PropertyId);
                this._setFormModelProperty("Address", oContext.Address);
                this._setFormModelProperty("Owner", oContext.Owner);
                this._setFormModelProperty("StatusText", oContext.PropStatusText);

                this.onValidateForm();
            }
        },

        _setFormModelProperty: function(property, value) {
            this._oModel.setProperty(property, value, this._oForm.getBindingContext());
        },

        _getFormModelProperty: function(property) {
            return this._oModel.getProperty(property, this._oForm.getBindingContext());
        },

        toggleEditableFields: function(editable) {
            this._formFields.forEach(
                function(obj) {
                    this.byId(obj).setEditable(editable);
                }.bind(this)
            );
        },

        resetDateField: function(date, id) {
            this.getView().byId(id).setDateValue(date);
        },

        /**
         * set field enabled/disabled using Id
         * @param {string} id Id of the field
         * @param {boolean} enable for control Enable
         */
        setEnabledField: function(id, enable) {
            this.getView().byId(id).setEnabled(enable);
        },

        /**
         * Validate Form
         */
        onValidateForm: function() {
            this.oValidation.validateForm();
        },
        /*eslint-disable */
        /**
         * changes are stored in a deferred batch call, here we submit them         
         */
        onAdd: function() {

            var oController = this;

            if ((this._oModel.hasPendingChanges()) || (this.oComponent._oViewModel.getProperty("/CreateMode") === false)) {

                if ((!this._oMainResolve) || (this._oMainResolve.ValidationRequired === "X")) {
                this.oValidation.validateForm();
                }
                
                if (!this.oValidation._oError) {

                    if (!this._oMainResolve) {
                    this._setFormModelProperty("PrimaryProperty", false);
                    oController._oForm.setBindingContext(null);
                    }

                    if (this._oModel.hasPendingChanges()) {
                        // Set Busy Indicator
                        this.getView().getParent().setBusyIndicatorDelay(0);
                        this.getView().getParent().setBusy(true);

                        // Refresh the Frame work Nav bar Icon refresh
                        var sPath = "/" + this._oModel.createKey(this._oMainController._sStepsCollection, {
                            ApplicationKey: this._oMainController._sProcessKey,
                            StepKey: this._oMainController._sStepKey
                        });

                        // submit the changes (creates entity at the backend)
                        this._oModel.submitChanges({
                            success: function(oResponses) {

                        //Back end Error messages handling for Footer buttons    
                        var bErrorFlag = false; 

                        $.each(oResponses.__batchResponses, function(i, oResponse) {  
                            if (oResponse.response) {
                                var sBody = oResponse.response.body;
                                var oErrors = JSON.parse(sBody);

                            $.each(oErrors.error.innererror.errordetails, function(j, oError) {  
                                if (oError.severity === "error") {
                                bErrorFlag = true;
                                return false;
                                }   
                            });  

                            if (bErrorFlag === true) {
                                return false;                                
                            } 
                            }
                        });     

                        if (bErrorFlag === true) {

                            // Delete the unwanted Duplicate messages
                            oController.deleteDuplicateMessages();

                            var aRemoveEntites = [];
                            $.each(oController._oModel.mChangedEntities, function(sChangedEntityPath, oEntity) { 
                                if ((sChangedEntityPath.substring(0, 16)) === "ApplicationHold(") {
                                    // Fill for Application Hold entities
                                    sChangedEntityPath = '/' + sChangedEntityPath;
                                    aRemoveEntites.push(sChangedEntityPath);
                                }
                            }); 

                            if (aRemoveEntites.length > 0) {
                                // Delete only Application Hold Entites changes
                                oController._oModel.resetChanges(aRemoveEntites);
                            }
                                                          
                            // Remove the busy Indicator
                            oController.getView().getParent().setBusy(false);
                            MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
                            jQuery.sap.log.error("Error adding new note");
                            if (oController._oMainResolve) {
                                oController._oMainResolve.WhenValid.resolve("Error");
                                oController._oMainResolve = "";
                            }
                        } else {  
                                // Set the Icon Status as "Success"
                                oController._oModel.getContext(sPath).getObject().Status = "S";
                                oController._oModel.setProperty("Status", "S", oController._oModel.getContext(sPath));
                                oController._oMainController.refreshNavBarIcons();
                                oController._oModel.submitChanges();

                                // Clear context for form
                                oController.deleteDuplicateMessages();
                                // Clear context for form
                                oController.toggleEditableFields(false);
                                oController.oComponent._setViewModelProperty("SaveBtn_Visible", false);

                                // Remove Busy Indicator
                                oController.getView().getParent().setBusy(false);

                                jQuery.sap.log.info("Added new Property");

                                if (oController._oMainResolve) {
                                    oController._oMainResolve.WhenValid.resolve("Success");
                                    oController._oMainResolve = "";
                                }
                            }
                            },
                            error: function() {

                                // Remove the busy Indicator
                                oController.getView().getParent().setBusy(false);
                                MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
                                jQuery.sap.log.error("Error adding new Property");

                                if (oController._oMainResolve) {
                                    oController._oMainResolve.WhenValid.resolve("Error");
                                    oController._oMainResolve = "";
                                }
                            }
                        });

                        this.oComponent._setViewModelProperty("CreateMode", true); // Make Add button enabled
                    } else {
                        MessageToast.show(this.getI18NText("NoChangeSaveMessage"));
                        this.getView().getParent().setBusy(false);

                        if (this._oMainResolve) {
                            this._oMainResolve.WhenValid.resolve("Info");
                            this._oMainResolve = "";
                        }
                    }
                } else {
                    if (this._oMainResolve) {
                        this._oMainResolve.WhenValid.resolve("Error");
                        this._oMainResolve = "";
                    }
                }
            } else {
                MessageToast.show(this.getI18NText("NoChangeSaveMessage"));
                this.getView().getParent().setBusy(false);

                if (this._oMainResolve) {
                    this._oMainResolve.WhenValid.resolve("Info");
                    this._oMainResolve = "";
                }

            }
        },

        /**
         * on Check Valid Event
         * @param  {string} sChannel [description]
         * @param  {string} sEvent   [description]
         * @param  {object} oData    [description]
         */
        onCheckValid: function(sChannel, sEvent, oData) {
             var oCreateMode = this.oComponent._oViewModel.getProperty("/CreateMode");
                        if (oCreateMode === false) {
                            this._oModel.deleteCreatedEntry(this._oContext);
                        }
            this.oComponent._oViewModel.setProperty("/CreateMode", true);
            oData.WhenValid.resolve();
        },

        /**
         * on Filter for Status         
        */
        handleFilter: function() {

            var aStatus = [];
            var aFilterStatus = [];
            var oFilterStatus = {};

            // Get the Status details
            $.each(this._oModel.oData, function(sEntity, oData) {
                                        
                if ((sEntity.substring(0,14) === "PropertySearch") && (aStatus.indexOf(oData.PropStatusText) === -1)) {                        
                        // Update only unique status
                        aStatus.push(oData.PropStatusText);
                }
            });

            // Get the Status for Filter fragment
            $.each(aStatus, function(index, sFilter) { 
                oFilterStatus = {};
                oFilterStatus.Status = sFilter;                                                                   
                aFilterStatus.push(oFilterStatus);                                            
            });

            if (aFilterStatus.length > 0) {

            if (!this._oFilterDialog) {

                this._oFilterDialog = sap.ui.xmlfragment( "idFilterFragment", this._sFilterFragment, this );                

                this._oFilterDialog.setModel(this.getView().getModel("i18n"), "i18n");
                this.getView().addDependent(this._oFilterDialog);

            // Set the JSON model
            var oStatusFilter = new sap.ui.model.json.JSONModel({
                FilterStatus: aFilterStatus
                });

                this.getView().setModel(oStatusFilter, "FilterStatus");                
            } 

            this._oFilterDialog.open();      
            }     
        },
        /*eslint-enable */
        /**
         * on OK action for Filter Pop up         
        */
        handleFilterOk: function() {

            var aFilters = [];
            
            if (this._sSearchValue !== "") {                

                // Fill Filter with Contains, if Searched value is not initial
                aFilters.push(new Filter(
                                    "SearchTerm",
                                    FilterOperator.Contains, this._sSearchValue
                ));

            }

            // Get the Selected Item from the status filter
            var oStatusFilterList = sap.ui.core.Fragment.byId("idFilterFragment", "idStatusFilter");
            var oSelectedItem = oStatusFilterList.getSelectedItem(); 

            if (oSelectedItem) {
            var sStatus = oStatusFilterList.getSelectedItem().getTitle();

            // Fill Filter with Contains, for Filtered value
            aFilters.push(new Filter(
                                "PropStatusText",
                                FilterOperator.EQ, sStatus
            ));

            var oMultiFilter = new Filter({
                filters: aFilters,
                bAnd: true
            });

            this._oFilterDialog.close();

            // Apply Filter
            this._psHelpDialog.getBinding("items").filter(oMultiFilter); 

            } else {
                // Display the information message
                MessageToast.show( this.getI18NText("FILTER_STATUS_MSG") );
            }                    
        },

        /**
         * on Close action for Filter Pop up
         * 
        */
        handleFilterClose: function() {

            this._oFilterDialog.close();
        },  
        /**
        * Set busy indicator for Legal Property table when request for data is completed
        * 
        * @public
        */
        handleRequested: function() {
      
            // Set Busy Indicator
            var oTable = sap.ui.core.Fragment.byId("idPSHelp", "legalDescriptionDialog");
            oTable.setBusy(true);

        },  
        /**
        * Disables busy indicator for Legal Property table when request for data is completed
        * 
        * @public
        */
        handleRequestCompleted: function() {

            // Remove Busy Indicator                      
             var oTable = sap.ui.core.Fragment.byId("idPSHelp", "legalDescriptionDialog");
             oTable.setBusy(false);
        },  

        /**
         * Reset Filter action
         */
        handleResetFilter: function() {

            var oMultiFilter = {};            

            // Get the Selected Item from the status filter
            var oStatusFilterList = sap.ui.core.Fragment.byId("idFilterFragment", "idStatusFilter");
            if (oStatusFilterList) {

            var aFilters = [];                        

            if (this._sSearchValue !== "") {                

                // Fill Filter with Contains, if Searched value is not initial
                aFilters.push(new Filter(
                                    "SearchTerm",
                                    FilterOperator.Contains, this._sSearchValue
                ));

                oMultiFilter = new Filter({
                    filters: aFilters
                });

                this._psHelpDialog.getBinding("items").filter(oMultiFilter);                
                
            } else {

                this._psHelpDialog.getBinding("items").filter([]);
            } 

            // Refresh the Filter Status 
            var oSelectedListItem = oStatusFilterList.getSelectedItem();
            oSelectedListItem.setSelected(false);
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
        * Delete duplicate messages                    
        */
        deleteDuplicateMessages: function() {

            var aFinalMessages = [];
            var bUpdate = false;

            var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().oData;
            $.each(aMessages, function(i, oMessage) {

                if (aFinalMessages.length === 0) {
                    // Add only Unique message
                    aFinalMessages.push(oMessage);
                    return true;
                }

                bUpdate = false;
                // Check for duplicate messages
                $.each(aFinalMessages, function(j, oFinalMessage) {
                    if (oFinalMessage.message === oMessage.message) {
                        bUpdate = true;
                        return false;
                    }   
                });

                if (bUpdate === false) {
                    // Add only Unique message
                    aFinalMessages.push(oMessage);
                }

            });

            // Replace duplicate messages and refresh it
            sap.ui.getCore().getMessageManager().removeAllMessages();
            sap.ui.getCore().getMessageManager().getMessageModel().oData = [];
            sap.ui.getCore().getMessageManager().getMessageModel().oData = aFinalMessages;
            sap.ui.getCore().getMessageManager().getMessageModel().refresh();
        },

        /**
         * on Submit Changes Event is a base controller event, it is triggered
         * by component, the components sends a deferred promise if the call
         * is valid, no errors, the promise is resolved
         * @param  {string} sChannel [description]
         * @param  {string} sEvent   [description]
         * @param  {object} oData    [description]
         */
        onSubmitChanges: function(sChannel, sEvent, oData) {
            this._oMainResolve = oData;
            // Get the Add Button reference
            var oAddButton = this.getView().byId("add");
            // Fire the Press event 
            oAddButton.firePress();
        }                   
    });
});