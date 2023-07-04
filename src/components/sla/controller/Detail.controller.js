sap.ui.define([
    "aklc/cm/library/common/controller/BaseController",
    "sap/ui/commons/MessageToast",
    "aklc/cm/library/common/controller/Validation"
], function(BaseController, MessageToast, Validation) {
    "use strict";

    return BaseController.extend("aklc.cm.components.sla.controller.Detail", {
        _sSLACollection: "SlaExtensions",
        _formFields: ["reasonCode", "duration", "notes"],
        _sUpdate: "UPDATE",
        _sCreate: "CREATE",
        _sSaveId: "add",
        _sUpdateId: "update",
        _sChannelId: "sla",
        _oMainController: "",

        /**
         * on init
         * @param  {object} oEvent Event object
         */
        onInit: function(oEvent) {
            BaseController.prototype.onInit.apply(this);
            this._oForm = this._oView.byId("SLA_FORM");
            this.oComponent = this.getOwnerComponent();

            this._oBundle = this.getComponent().getModel("i18n").getResourceBundle();

            this.oValidation = new Validation(this);

            this._oMessageManager = sap.ui.getCore().getMessageManager();
            this._oMessageManager.registerObject(this.getView(), true);
            /*eslint-disable */
            var that = this;

            if (!this.oTemplate) {
                this.oAdjustCodeTemplate = this.byId("adjustCodeTmpl").clone();
                this.oReasonCodeTemplate = this.byId("reasonCodeTmpl").clone();
            }

            this.getEventBus().subscribe(this._sChannelId, "refreshSLAForm",
                function(sChannelId, sEventId, oData) {
                    that._oContext = oData.context;
                    that._oForm.setBindingContext(oData.context);

                    //Make form fields read-only
                    if (oData.action === that._sUpdate) {
                        that.toggleEditableFields(false);
                        that.oComponent._setViewModelProperty("SaveBtn_Visible", false);
                        that.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
                        that.getView().byId("adjustmentCode").setEditable(false);
                    } else if (oData.action === that._sCreate) {
                        that.toggleEditableFields(true);
                        that.oComponent._setViewModelProperty("SaveBtn_Visible", true);
                        that.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
                        that.getView().byId("adjustmentCode").setEditable(true);
                    }
                });
        },

        onAfterRendering: function() {},

        onSelectionChange: function(oEvent) {
            var sPath = this._oModel.createKey('/VH_ReasonCode', {
                StepKey: this._sStepKey,
                ReasonCode: oEvent.getSource().getSelectedKey()
            });

            var oContext = this._oModel.getContext(sPath);

            var iDuration = this._oModel.getProperty("Duration", oContext);

            if (iDuration !== 0) {
                this._setFormModelProperty("Duration", iDuration);
                this.oComponent._setViewModelProperty("Duration_Editable", false);
            } else {
                this.oComponent._setViewModelProperty("Duration_Editable", true);
                this._setFormModelProperty("Duration", null);
            }

            this.oValidation.validateForm();
        },

        onContextChanged: function(sChannel, sEvent, oData) {

            this._oMainController = oData.controller;
            this._sStepKey = this._oModel.getProperty("StepKey", oData.context);

            var aFilterBy = [];
            aFilterBy.push(new sap.ui.model.Filter("StepKey", sap.ui.model.FilterOperator.EQ, this._sStepKey));

            this.byId("reasonCode").bindAggregation("items", {
                path: '/VH_ReasonCode',
                sorter: null,
                parameters: null,
                template: this.oReasonCodeTemplate,
                filters: aFilterBy
            });

            this.byId("adjustmentCode").bindAggregation("items", {
                path: '/VH_SlaDirection',
                sorter: null,
                parameters: null,
                template: this.oAdjustCodeTemplate,
                filters: aFilterBy
            });
        },

        _setFormModelProperty: function(property, value) {
            this._oModel.setProperty(property, value, this._oForm.getBindingContext());
        },

        _getFormModelProperty: function(property) {
            return this._oModel.getProperty(property, this._oForm.getBindingContext());
        },

        setAllFormFields: function(sDecisionCode, sDecisionMaker, sDecisionDate, sComments, sDateCreated, sCreatedBy) {
            this.byId(this._formFields[0]).setValue(sDecisionCode);
            this.byId(this._formFields[1]).setValue(sDecisionMaker);
            this.byId(this._formFields[2]).setDateValue(sDecisionDate);
            this.byId(this._formFields[3]).setValue(sComments);

            this.byId(this._readOnlyFormFields[0]).setValue(sDateCreated);
            this.byId(this._readOnlyFormFields[1]).setValue(sCreatedBy);
        },

        toggleEditableFields: function(editable) {
            this._formFields.forEach(
                function(obj, i) {
                    this.byId(obj).setEditable(editable);
                }.bind(this)
            );
        },

        cancelKeyPress: function(oEvent) {
            return oEvent.getSource().setValue(oEvent.getSource()._lastValue);
        },

        /**
         * changes are stored in a deferred batch call, here we submit them
         * @return {[type]} [description]
         */
        onAdd: function(oEvent) {

            var that = this;
            var oController = this;

            if ((!this._oMainResolve) || (this._oMainResolve.ValidationRequired === "X")) {
                this.oValidation.validateForm();
            }

            if (!this.oValidation._oError) {

                this._setFormModelProperty("ReasonText", this.formatReasonCode(this._getFormModelProperty("ReasonCode")));
                this._setFormModelProperty("AdjustmentText", this.formatAdjustmentCode(this._getFormModelProperty("AdjustmentCode")));

                that._oForm.setBindingContext(null);

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
                        success: function(oEvent) {

                            //Back end Error messages handling for Footer buttons    
                            var bErrorFlag = false;

                            $.each(oEvent.__batchResponses, function(i, oResponse) {
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
                                jQuery.sap.log.error("Error adding new SLA");
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

                                //Clear context for form
                                oController.toggleEditableFields(false);
                                oController.oComponent._setViewModelProperty("SaveBtn_Visible", false);

                                // Remove the busy Indicator
                                oController.getView().getParent().setBusy(false);

                                jQuery.sap.log.info("Added new SLA");

                                if (oController._oMainResolve) {
                                    oController._oMainResolve.WhenValid.resolve("Success");
                                    oController._oMainResolve = "";
                                }
                            }
                        },
                        error: function(oEvent) {

                            // Remove the busy Indicator
                            oController.getView().getParent().setBusy(false);
                            MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
                            jQuery.sap.log.error("Error adding new SLA");

                            if (oController._oMainResolve) {
                                oController._oMainResolve.WhenValid.resolve("Error");
                                oController._oMainResolve = "";
                            }
                        }
                    });

                    this.oComponent._setViewModelProperty("CreateMode", true); //Make Add button enabled

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

        onValidateForm: function(oEvent) {
            this.oValidation.validateForm();
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
                    this._oModel.update({
                        success: function(oEvent) {

                            // Set the Icon Status as "Success"
                            oController._oModel.getContext(sPath).getObject().Status = "S";
                            oController._oModel.setProperty("Status", "S", oController._oModel.getContext(sPath));
                            oController._oMainController.refreshNavBarIcons();
                            oController._oModel.submitChanges();

                            oController.toggleEditableFields(false);
                            oController.oComponent._setViewModelProperty("SaveBtn_Visible", false);
                            oController.oComponent._setViewModelProperty("UpdateBtn_Visible", false);

                            // Remove the busy Indicator
                            oController.getView().getParent().setBusy(false);

                            jQuery.sap.log.info("Updated SLA");
                        },
                        error: function(oEvent) {
                            // Remove the busy Indicator
                            oController.getView().getParent().setBusy(false);
                            MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
                            jQuery.sap.log.error("Error updating SLA");
                        }
                    });
                } else {
                    MessageToast.show(this.getI18NText("NoChangeSaveMessage"));
                    this.getView().getParent().setBusy(false);
                }
            }
        },

        formatReasonCode: function(sReasonCode) {
            var sPath = this._oModel.createKey('/VH_ReasonCode', {
                StepKey: this._sStepKey,
                ReasonCode: sReasonCode
            });

            var oContext = this._oModel.getContext(sPath);

            return this._oModel.getProperty("ReasonText", oContext);
        },

        formatAdjustmentCode: function(sAdjustmentCode) {

            var sPath = this._oModel.createKey('/VH_SlaDirection', {
                StepKey: this._sStepKey,
                AdjustmentCode: sAdjustmentCode
            });

            var oContext = this._oModel.getContext(sPath);

            return this._oModel.getProperty("AdjustmentText", oContext);
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