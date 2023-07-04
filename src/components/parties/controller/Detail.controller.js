sap.ui.define([
    "aklc/cm/library/common/controller/BaseController",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/commons/MessageToast",
    "aklc/cm/library/common/controller/Validation"
], function(BaseController, Fragment, Filter, FilterOperator, MessageToast, Validation) {
    "use strict";

    return BaseController.extend("aklc.cm.components.parties.controller.Detail", {
        _sPartiesCollection: "AffectedParties",
        _formFields: ["toBeHeard", "response", "responseDate", "partnerSearch"],
        _sPFSearchHelp: "aklc.cm.components.parties.fragments.PartnerFunctionSearch",
        _sPSearchHelp: "aklc.cm.components.parties.fragments.PartnerSearch",
        _sCreate: "CREATE",
        _sUpdate: "UPDATE",
        _sSaveId: "save",
        _sUpdateId: "update",
        _oMainController: "",

        /**
         * on init
         * @param  {object} oEvent Event object
         */
        onInit: function() {
            BaseController.prototype.onInit.apply(this);
            this._oForm = this._oView.byId("PARTIES_FORM");
            this.oComponent = this.getOwnerComponent();

            this._oBundle = this.getComponent().getModel("i18n").getResourceBundle();

            this.oValidation = new Validation(this);

            this._oMessageManager = sap.ui.getCore().getMessageManager();
            this._oMessageManager.registerObject(this.getView(), true);


            this.oRespTemplate = this.byId("responseItem").clone();
            /*eslint-disable */
            var that = this;

            this.getEventBus().subscribe("parties", "refreshPartiesForm",
                function(sChannelId, sEventId, oData) {
                    that._oContext = oData.context;
                    that._oForm.setBindingContext(oData.context);

                    //Make form fields read-only
                    if (oData.action === that._sUpdate) {

                        that.toggleEditableFields(true, oData.context);
                        that.setVisibleField(that._sSaveId, false);
                        that.setVisibleField(that._sUpdateId, true);
                        that.oComponent._setViewModelProperty("SaveBtn_Visible", false);
                        that.oComponent._setViewModelProperty("UpdateBtn_Visible", true);
                    } else if (oData.action === that._sCreate) {

                        if (that._formFields.length < 4) {
                            that._formFields.push("partnerSearch");
                        }

                        that.toggleEditableFields(true, oData.context);
                        that.setVisibleField(that._sUpdateId, false);
                        that.setVisibleField(that._sSaveId, true);
                        that.oComponent._setViewModelProperty("SaveBtn_Visible", false);
                        that.oComponent._setViewModelProperty("UpdateBtn_Visible", true);
                    }
                });

            this.oPSTemplate = new sap.m.ColumnListItem({ // Template used for Partner Search Dialog
                cells: [
                    new sap.m.ObjectIdentifier({
                        text: "{PartnerFullName}"
                    }),
                    new sap.m.Text({
                        text: "{PropertyAddress}"
                    }), new sap.m.Text({
                        text: "{Telephone}"
                    })
                ]
            });
        },

        onExit: function() {
            if (this._oDialog) {
                this._oDialog.destroy();
            }
        },

        cancelKeyPress: function(oEvent) {
            return oEvent.getSource().setValue(oEvent.getSource()._lastValue);
        },


        handlePSearchHelp: function(oEvent) {

            this.inputId = oEvent.getSource().getId();

            if (!this._psHelpDialog) {
                this._psHelpDialog = sap.ui.xmlfragment(
                    this._sPSearchHelp, this
                );

                this.partnerSearch = this.getView().byId("partySearchDialog");

                this._psHelpDialog.setModel(this._oModel); //Required so table dialog shows data from service

                this._psHelpDialog.setModel(this.getView().getModel("i18n"), "i18n");
                this.getView().addDependent(this._psHelpDialog);
            }

            this.aFilterBy = [];
            this.aFilterBy.push(new sap.ui.model.Filter("StepKey", sap.ui.model.FilterOperator.EQ, this._sStepKey));

            this._psHelpDialog.bindAggregation("items", {
                path: "/PartySearch",
                sorter: null,
                parameters: {},
                template: this.oPSTemplate,
                filters: this.aFilterBy
            });

            this._psHelpDialog.open();
        },

        _handlePSValueHelpSearch: function(oEvent) {
            var sValue = oEvent.getParameter("value");
            var aFilters = [];

            aFilters.push(new Filter(
                "SearchTerm",
                FilterOperator.Contains, sValue
            ));

            var oMultiFilter = new Filter({
                filters: aFilters,
                and: false
            });

            oEvent.getSource().getBinding("items").filter(oMultiFilter);
        },

        _handleValueHelpClose: function(oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");

            if (oSelectedItem) {
                var oContext = oSelectedItem.getBindingContext().getObject();

                this._setFormModelProperty("PartnerFullName", oContext.PartnerFullName);
                this._setFormModelProperty("LegalDescription", oContext.LegalDescription);
                this._setAddressDetails(oContext);

                this.onValidateForm();

            }
        },

        _setFormModelProperty: function(property, value) {
            this._oModel.setProperty(property, value, this._oForm.getBindingContext());
        },

        _setAddressDetails: function(oData) {
            this._setFormModelProperty("LegalDescription", oData.LegalDescription);
            this._setFormModelProperty("PropertyAddress", oData.PropertyAddress);
            this._setFormModelProperty("MailingAddress", oData.MailingAddress);
            this._setFormModelProperty("PropertyId", oData.PropertyId);
            this._setFormModelProperty("PartnerNumber", oData.PartnerNumber);

        },

        onContextChanged: function(sChannel, sEvent, oData) {

            this._oMainController = oData.controller;
            this._sStepKey = this._oModel.getProperty("StepKey", oData.context);

            var aFilterBy = [];
            aFilterBy.push(new sap.ui.model.Filter("StepKey", sap.ui.model.FilterOperator.EQ, this._sStepKey));

            this.byId("response").bindAggregation("items", {
                path: "/VH_Response",
                sorter: null,
                parameters: null,
                template: this.oRespTemplate,
                filters: aFilterBy
            });
        },

        toggleEditableFields: function(bEditable, oContext) {
            if (oContext) {

                this._formFields.forEach(
                    function(obj) {
                        if (bEditable && obj === this._formFields[3]) {
                            if (oContext.getObject().PartyType === "OWNER") {
                                this.byId(obj).setEditable(!bEditable);
                            } else {
                                this.byId(obj).setEditable(bEditable);
                            }
                        } else {
                            this.byId(obj).setEditable(bEditable);
                        }
                    }.bind(this)
                );
            }
        },

        resetDateField: function(date, id) {
            this.getView().byId(id).setDateValue(date);
        },


        formatResponseType: function(sResponseType) {
            var sPath = this._oModel.createKey("/VH_Response", {
                StepKey: this._sStepKey,
                ResponseType: sResponseType
            });

            var oContext = this._oModel.getContext(sPath);
            return this._oModel.getProperty("ResponseText", oContext);
        },
        /*eslint-disable */
        /**
         * set field enabled/disabled using Id
         * @param  {string} sId id of the field
         * @return {object}     control
         */
        setEnabledField: function(id, enable) {
            this.getView().byId(id).setEnabled(enable);
        },

        /**
         * set field visible or not using Id
         * @param  {string} sId id of the field
         * @return {object}     control
         */
        setVisibleField: function(id, visible) {
            this.getView().byId(id).setVisible(visible);
        },
        /**
         * get Field By Id
         * @param  {string} sId id of the field
         * @return {object}     control
         */
        getFieldById: function(sId) {
            return sap.ui.getCore().byId(sId);
        },

        onValidateForm: function() {
            this.oValidation.validateForm();
        },

        parseToBeHeard: function(sValue) {
            return (sValue === "true" || sValue === true) ? true : false;
        },

        /**
         * changes are stored in a deferred batch call, here we submit them
         * @return {[type]} [description]
         */
        onSave: function(oEvent) {
            var that = this;
            var oController = this;

            if ((!this._oMainResolve) || (this._oMainResolve.ValidationRequired === "X")) {
                this.oValidation.validateForm();
            }

            var oContext = oEvent.getSource().getBindingContext();
            var oData = oEvent.getSource().getBindingContext().getObject();

            oData.ResponseText = this.formatResponseType(oData.ResponseType);
            oData.ToBeHeard = this.parseToBeHeard(oData.ToBeHeard);


            if (!this.oValidation._oError) {
                this._oForm.setBindingContext(null);

                if (this._oModel.hasPendingChanges()) {

                    // Set Busy Indicator
                    this.getView().getParent().setBusyIndicatorDelay(0);
                    this.getView().getParent().setBusy(true);

                    // Refresh the Frame work Nav bar Icon Refresh
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
                                    var oError = JSON.parse(sBody);

                                    $.each(oError.error.innererror.errordetails, function(j, oError) {
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

                                oController.deleteDuplicateMessages();

                                var aRemoveEntites = [];
                                $.each(oController._oModel.mChangedEntities, function(sPath, oEntity) {
                                    if ((sPath.substring(0, 16)) === "ApplicationHold(") {
                                        // Fill for Application Hold entities
                                        sPath = '/' + sPath;
                                        aRemoveEntites.push(sPath);
                                    }
                                });

                                if (aRemoveEntites.length > 0) {
                                    // Delete only Application Hold Entites changes
                                    oController._oModel.resetChanges(aRemoveEntites);
                                }

                                // Remove the busy Indicator
                                oController.getView().getParent().setBusy(false);
                                MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
                                jQuery.sap.log.error("Error adding new affected partner");
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

                                oController.toggleEditableFields(false, oContext);
                                oController.setVisibleField(that._sSaveId, false);
                                oController.setVisibleField(that._sUpdateId, false);
                                oController.oComponent._setViewModelProperty("SaveBtn_Visible", false);
                                oController.oComponent._setViewModelProperty("UpdateBtn_Visible", false);

                                // Remove the busy Indicator
                                oController.getView().getParent().setBusy(false);

                                jQuery.sap.log.info("Added new affected partner");

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
                            jQuery.sap.log.error("Error adding new affected partner");

                            if (oController._oMainResolve) {
                                oController._oMainResolve.WhenValid.resolve("Error");
                                oController._oMainResolve = "";
                            }
                        }
                    });

                    this.oComponent._oViewModel.setProperty("/CreateMode", true); //Make Add button enabled

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

        },

        /**
         * changes are stored in a deferred batch call, here we submit them
         * @return {[type]} [description]
         */
        onUpdate: function(oEvent) {

            var that = this;
            var oController = this;

            this.oValidation.validateForm();

            if (!this.oValidation._oError) {

                var oContext = oEvent.getSource().getBindingContext();
                var oData = oEvent.getSource().getBindingContext().getObject();

                oData.ResponseText = this.formatResponseType(oData.ResponseType);
                oData.ToBeHeard = this.parseToBeHeard(oData.ToBeHeard);

                this._oForm.setBindingContext(null);

                if (this._oModel.hasPendingChanges()) {

                    // Set Busy Indicator
                    this.getView().getParent().setBusyIndicatorDelay(0);
                    this.getView().getParent().setBusy(true);

                    // Refresh the Frame work Nav bar Icon Refresh
                    var sPath = "/" + this._oModel.createKey(this._oMainController._sStepsCollection, {
                        ApplicationKey: this._oMainController._sProcessKey,
                        StepKey: this._oMainController._sStepKey
                    });

                    // submit the changes (updates entity at the backend)
                    this._oModel.submitChanges({
                        success: function() {

                            // Set the Icon Status as "Success"
                            oController._oModel.getContext(sPath).getObject().Status = "S";
                            oController._oModel.setProperty("Status", "S", oController._oModel.getContext(sPath));
                            oController._oMainController.refreshNavBarIcons();
                            oController._oModel.submitChanges();

                            oController.toggleEditableFields(false, oContext);
                            oController.setVisibleField(that._sSaveId, false);
                            oController.setVisibleField(that._sUpdateId, false);
                            oController.oComponent._setViewModelProperty("SaveBtn_Visible", false);
                            oController.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
                            // Remove the busy Indicator
                            oController.getView().getParent().setBusy(false);

                            jQuery.sap.log.info("Updated partner");

                        },
                        error: function() {
                            // Remove the busy Indicator
                            oController.getView().getParent().setBusy(false);
                            MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
                            jQuery.sap.log.error("Error adding new affected partner");
                        }
                    });
                } else {
                    MessageToast.show(this.getI18NText("NoChangeSaveMessage"));
                    this.getView().getParent().setBusy(false);
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
            this.oComponent._setViewModelProperty("SaveBtn_Visible", false);
            this.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
            oData.WhenValid.resolve();
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
        /*eslint-enable */
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
            var oAddButton = this.getView().byId("save");
            // Fire the Press event 
            oAddButton.firePress();
        }

    });
});