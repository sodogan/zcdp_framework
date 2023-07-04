sap.ui.define([
    "aklc/cm/library/common/controller/BaseController",
    "sap/m/MessageToast",
    "aklc/cm/library/common/controller/Validation"
], function(BaseController, MessageToast, Validation) {
    "use strict";

    return BaseController.extend("aklc.cm.components.outcomes.controller.Detail", {
        _sOutcomesCollection: "Outcomes", // path for outcomes
        _formFields: ["decisionCode", "decisionMaker", "decisionDate", "comments"], // form field types
        _readOnlyFormFields: ["dateCreated", "createdBy"], // read only form field types
        _sUpdate: "UPDATE", // update
        _sCreate: "CREATE", //create
        _sSaveId: "add", // add
        _sChannelId: "outcomes", // channel ID path
        _oMainController: "",

        /**
         * on init
         * @param  {object} oEvent Event object
         */
        onInit: function(oEvent) {
            BaseController.prototype.onInit.apply(this);
            this._oForm = this._oView.byId("OUTCOMES_FORM");
            this.oComponent = this.getOwnerComponent();

            this._oBundle = this.getComponent().getModel("i18n").getResourceBundle();

            this.oValidation = new Validation(this);

            this._oMessageManager = sap.ui.getCore().getMessageManager();
            this._oMessageManager.registerObject(this.getView(), true);

            /*eslint-disable */
            var oController = this;

            /*eslint-enable */
            if (!this.oTemplate) {
                this.oDecCodeTemplate = this.byId("decCodeListTemp").clone();
                this.oDecMakerTemplate = this.byId("decMakerListTemp").clone();
            }

            this.getEventBus().subscribe(this._sChannelId, "refreshOutcomesForm",

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
        },

        onAfterRendering: function() {

        },

        _setFormModelProperty: function(property, value) {
            this._oModel.setProperty(property, value, this._oForm.getBindingContext());
        },

        _getFormModelProperty: function(property) {
            return this._oModel.getProperty(property, this._oForm.getBindingContext());
        },

        /**
         * on ContextChanged Event
         * @param  {string} sChannel [description]
         * @param  {string} sEvent   [description]
         * @param  {object} oData    [description]
         */
        onContextChanged: function(sChannel, sEvent, oData) {

            this._oMainController = oData.controller;
            this._sStepKey = this._oModel.getProperty("StepKey", oData.context);

            var aFilterBy = [];
            aFilterBy.push(new sap.ui.model.Filter("StepKey", sap.ui.model.FilterOperator.EQ, this._sStepKey));

            this.byId("decisionCode").bindAggregation("items", {
                path: '/VH_DecisionCode',
                sorter: null,
                parameters: null,
                template: this.oDecCodeTemplate,
                filters: aFilterBy
            });

            this.byId("decisionMaker").bindAggregation("items", {
                path: '/VH_DecisionMaker',
                sorter: null,
                parameters: null,
                template: this.oDecMakerTemplate,
                filters: aFilterBy
            });
        },
        /**
         * toggle Editable Fields event
         * @param  {string} editable [description]
         */
        toggleEditableFields: function(editable) {

            this._formFields.forEach(
                function(obj, i) {
                    this.byId(obj).setEditable(editable);
                }.bind(this)
            );
        },

        resetDateField: function(date, id) {
            this.getView().byId(id).setDateValue(date);
        },

        /**
         * get Field By Id
         * @param  {string} sId id of the field
         * @return {object}     control
         */
        getFieldById: function(sId) {
            return sap.ui.getCore().byId(sId);
        },

        onValidateForm: function(oEvent) {
            this.oValidation.validateForm();
        },

        /*eslint-disable */
        /**
         * changes are stored in a deferred batch call, here we submit them
         * @parameter {obejct} oEvent
         */
        onAdd: function(oEvent) {
            
            var oController = this;
            var bFlag = false;
            /*eslint-enable */

            // Get the Outcome entity details
            $.each(this._oModel.oData, function(sEntity, oData) {

                if (sEntity.substring(0, 8) === "Outcomes") {
                    bFlag = true;
                }
            });

            if (bFlag === false) {

                MessageToast.show(this.getI18NText("NoChangeSaveMessage"));
                if (this._oMainResolve) {
                    this._oMainResolve.WhenValid.resolve("Info");
                    this._oMainResolve = "";
                    return false;
                }
            }

            if ((!this._oMainResolve) || (this._oMainResolve.ValidationRequired === "X")) {
                this.oValidation.validateForm();
            }

            if (!this.oValidation._oError) {


                this._setFormModelProperty("DecisionCodeText", this.formatDecisionCode(this._getFormModelProperty("DecisionCode")));
                if (this.oComponent._oViewModel.getProperty("/DecisionMaker_Visible")) {
                    this._setFormModelProperty("DecisionMakerText", this.formatDecisionMaker(this._getFormModelProperty("DecisionMaker")));
                }
                oController._oForm.setBindingContext(null);

                if (this._oModel.hasPendingChanges()) {
                    // Set Busy Indicator
                    // this.getView().getParent().setBusyIndicatorDelay(0);
                    // this.getView().getParent().setBusy(true);   

                    // Refresh the Frame work Nav bar Icon Refresh
                    var sPath = "/" + this._oModel.createKey(this._oMainController._sStepsCollection, {
                        ApplicationKey: this._oMainController._sProcessKey,
                        StepKey: this._oMainController._sStepKey
                    });

                    /*eslint-disable */
                    // submit the changes (creates entity at the backend)
                    this._oModel.submitChanges({
                        success: function(oSuccessEvent) {

                            //Back end Error messages handling for Footer buttons    
                            var bErrorFlag = false;

                            $.each(oSuccessEvent.__batchResponses, function(i, oResponse) {
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
                                // oController.getView().getParent().setBusy(false);
                                MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
                                jQuery.sap.log.error("Error adding new outcome");
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
                                // oController.getView().getParent().setBusy(false);                        
                                jQuery.sap.log.info("Added new outcome");

                                if (oController._oMainResolve) {
                                    oController._oMainResolve.WhenValid.resolve("Success");
                                    oController._oMainResolve = "";
                                }
                            }
                        },
                        error: function(oErrorEvent) {

                            // Remove the busy Indicator
                            // oController.getView().getParent().setBusy(false);
                            MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
                            jQuery.sap.log.error("Error adding new outcome");

                            if (oController._oMainResolve) {
                                oController._oMainResolve.WhenValid.resolve("Error");
                                oController._oMainResolve = "";
                            }
                        }
                    });

                    this.oComponent._setViewModelProperty("CreateMode", true);

                } else {
                    MessageToast.show(this.getI18NText("NoChangeSaveMessage"));
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
         *format Decision Code event
         * @param {string} sDecisionCode
         */
        formatDecisionCode: function(sDecisionCode) {
            var sPath = this._oModel.createKey('/VH_DecisionCode', {
                StepKey: this._sStepKey,
                DecisionCode: sDecisionCode
            });

            var oContext = this._oModel.getContext(sPath);
            return this._oModel.getProperty("Description", oContext);
        },

        /**
         *format Decision Maker event
         * @param {string} sDecisionMaker Description Maker
         * @return {obejct} Property property for Description
         */
        formatDecisionMaker: function(sDecisionMaker) {
            var sPath = this._oModel.createKey('/VH_DecisionMaker', {
                StepKey: this._sStepKey,
                DecisionMaker: sDecisionMaker
            });

            var oContext = this._oModel.getContext(sPath);
            return this._oModel.getProperty("Description", oContext);
        },
        /*eslint-enable */

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