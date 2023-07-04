sap.ui.define([
    "aklc/cm/library/common/controller/BaseController",
    "sap/ui/commons/MessageToast",
    "aklc/cm/library/common/controller/Validation"

], function(BaseController, MessageToast, Validation) {
    "use strict";

    return BaseController.extend("aklc.cm.components.condition.controller.Detail", {
        _formFields: [],
        _sUpdate: "UPDATE",
        _oMainController: "",

        /**
         * on init
         * @param  {object} oEvent Event object
         */
         /*eslint-disable */
        onInit: function(oEvent) {
            BaseController.prototype.onInit.apply(this);
            this._oForm = this._oView.byId("oh");
            this.oComponent = this.getOwnerComponent();

            this._oBundle = this.getComponent().getModel("i18n").getResourceBundle();

            this.oValidation = new Validation(this);

            this._oMessageManager = sap.ui.getCore().getMessageManager();
            this._oMessageManager.registerObject(this.getView(), true);

            this._oMonitorView = this.byId("MonitorView");
            this._oConditionView = this.byId("conditionView");
            this._oHelpView = this.byId("HelpView");
            this.oComplianceTemplate = this._oMonitorView.byId("complianceDrp").clone();

            var that = this;  

            this.getEventBus().subscribe("condition", "refreshconditionForm",
                function(sChannelId, sEventId, oData) {
                    that._oForm.setBindingContext(oData.context);
                    //Make form fields read-only
                    if (oData.action === that._sUpdate) {
                        that.oComponent._setViewModelProperty("UpdateBtn_Visible", true);
                    } else if (oData.action === that._sCreate) {
                        that.oComponent._setViewModelProperty("UpdateBtn_Visible", true);
                    }
                });
            this._oIcontabBar = this.getView().byId("itb1");
        },

        onContextChanged: function(sChannel, sEvent, oData) {

            this._oMainController = oData.controller;
            this._sLinkCond = null;
            this._sStepKey = this._oModel.getProperty("StepKey", oData.context);

            var aFilterBy = [];
            aFilterBy.push(new sap.ui.model.Filter("StepKey", sap.ui.model.FilterOperator.EQ, this._sStepKey));
            var sCancelIcon = this.getView().byId("cancelId");
            var sHelpIcon = this.getView().byId("helpId");
            var sMonitorIcon = this.getView().byId("monitorId");
            if (!this.getView().byId("cancelId")._oImageControl) {
                if (sCancelIcon) {
                    sCancelIcon.setIcon("sap-icon://cancel-maintenance");

                }
            } else {
                sCancelIcon._getImageControl().attachBrowserEvent("click", this.handleIconTabBarSelect, this);
            }


            if (!this.getView().byId("helpId")._oImageControl) {

                if (sHelpIcon) {
                    sHelpIcon.setIcon("sap-icon://sys-help");
                }
            } else {
                sHelpIcon._getImageControl().attachBrowserEvent("click", this.handleIconTabBarSelect, this);
            }

            if (!this.getView().byId("monitorId")._oImageControl) {

                if (sMonitorIcon) {
                    sMonitorIcon.setIcon("sap-icon://sys-monitor");
                }
            } else {
                sMonitorIcon._getImageControl().attachBrowserEvent("click", this.handleIconTabBarSelect, this);
            }

            this._oMonitorView.byId("compliance").bindAggregation("items", {
                path: '/VH_ConditionStatus',
                sorter: null,
                parameters: null,
                template: this.oComplianceTemplate,
                filters: aFilterBy
            });

            this._sLinkCond = "/" + this._oModel.createKey("ApplicationLinks", {
                "StepKey": this._sStepKey,
                "Component": "CONDHLINK"
            });


            var fnCallback = function(oContext) {
                if (oContext) {
                    this._sLinkCond = oContext.getObject().Url;
                    this.oComponent._sLinkCond = this._sLinkCond;
                }
            }.bind(this);

            this._oModel.createBindingContext(this._sLinkCond, null, null, fnCallback, true);

        },

        VisibilityLink: function(conditionLink) {
            if (conditionLink === true) {
                this.getView().byId("linkCondition").setText("Link to condition document");
                return true;

            } else {
                return false;
            }
        },


        onLinkPress: function() {
            if (this._sLinkCond) {
                window.open(this._sLinkCond, "Newwindow", "width=1400,height=900,resizable=1");
            }
        },
        /**
         * changes are stored in a deferred batch call, here we submit them
         * @return {[type]} [description]
         * It updates the condition information entered on detail page 
         */
        onUpdate: function(oEvent) {

            var that = this;

            var oContext = oEvent.getSource().getBindingContext();
            var oData = oEvent.getSource().getBindingContext().getObject();

            // Get the value from Rich Text editor. since this is one way binding
            var oRichTextEditor = that._oConditionView.byId("richtext");
            var oBinding = oRichTextEditor.getBinding("value");

            // Check whether Condition Text is changed or not
            var sConditionText = oRichTextEditor.getValue();
            if (oData.ConditionText !== sConditionText) {
                oData.ConditionText = sConditionText;
            }

            var sFinal = this._oMonitorView.byId("final").getSelectedKey();
            var oController = this;

            if (sFinal === "true") {
                oData.Final = true;
            } else if (sFinal === "false") {
                oData.Final = false;
            }

            if (oData.ConditionText.search("<HTML>") === -1) {
                var prefixValue = "<HTML><HEAD><TITLE>X</TITLE></HEAD><BODY>";
                var midValue = oData.ConditionText;
                var postfixValue = "</BODY></HTML>";
                oData.ConditionText = prefixValue + midValue + postfixValue;
                this._oModel.setProperty("ConditionText", oData.ConditionText, oBinding.getContext());
            }

            if (oData.ConditionHelpText.search("<HTML>") === -1) {
                var prefixValue1 = "<HTML><HEAD><TITLE>X</TITLE></HEAD><BODY>";
                var midValue1 = oData.ConditionHelpText;
                var postfixValue1 = "</BODY></HTML>";
                oData.ConditionHelpText = prefixValue1 + midValue1 + postfixValue1;
            }

            if ((!this._oMainResolve) || (this._oMainResolve.ValidationRequired === "X")) {
                this.oValidation.validateForm();
            }

            if (!this.oValidation._oError) {

                if (this._oModel.hasPendingChanges()) {

                    // Set Busy Indicator
                    this.getView().getParent().setBusyIndicatorDelay(0);
                    this.getView().getParent().setBusy(true);

                    this._oForm.setBindingContext(null);

                    // Refresh the Frame work Nav bar Icon Refresh
                    var sPath = "/" + this._oModel.createKey(this._oMainController._sStepsCollection, {
                        ApplicationKey: this._oMainController._sProcessKey,
                        StepKey: this._oMainController._sStepKey
                    });

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
                                // Remove Busy Indicator
                                oController.getView().getParent().setBusy(false);
                                oController.oComponent._setViewModelProperty("UpdateBtn_Visible", true);
                                jQuery.sap.log.info("Updated Condition");


                                if (oController._oMainResolve) {
                                    oController._oMainResolve.WhenValid.resolve("Success");
                                    oController._oMainResolve = "";
                                }
                            }
                        },
                        error: function(oEvent) {
                            // Remove Busy Indicator
                            oController.getView().getParent().setBusy(false);
                            jQuery.sap.log.error("Error while updating Condition");

                            if (oController._oMainResolve) {
                                oController._oMainResolve.WhenValid.resolve("Error");
                                oController._oMainResolve = "";
                            }
                        }
                    });

                } else {
                    this.getView().getParent().setBusy(false);
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

        handleIconTabBarSelect: function(oEvent) {
            var oIcontabBar = this.getView().byId("itb1");
            if (oEvent.type !== "click") {
                var tabSelected = oEvent.getParameter("key");
            } else {
                if (oEvent.target.id.indexOf("cancelId") !== -1) {
                    oIcontabBar.setSelectedKey("Condition");
                    tabSelected = "Condition";
                } else if (oEvent.target.id.indexOf("helpId") !== -1) {
                    oIcontabBar.setSelectedKey("Help");
                    tabSelected = "Help";
                } else if (oEvent.target.id.indexOf("monitorId") !== -1) {
                    oIcontabBar.setSelectedKey("Monitor");
                    tabSelected = "Monitor";
                }
            }

            if (tabSelected === "Help") {
                this._oHelpView.byId("helpRichtext").setEditable(false);
            } else if (tabSelected === "Condition") {
                //Commented because configuration is missing in quality
                if (this._oForm.getBindingContext()) {
                    var sFlag = this._oForm.getBindingContext().getObject().EditFlag;
                    this._oConditionView.byId("richtext").setEditable(sFlag);
                }
            }
        },

        /*eslint-enable */
        onAfterRendering: function() {

        },

        /**
         * on Check Valid Event
         * @param  {string} sChannel [description]
         * @param  {string} sEvent   [description]
         * @param  {object} oData    [description]
         */
        onCheckValid: function(sChannel, sEvent, oData) {
            if (this.getView().byId("cancelId")) {
                this.getView().byId("cancelId")._oImageControl.destroy();
            }
            if (this.getView().byId("helpId")) {
                this.getView().byId("helpId")._oImageControl.destroy();
            }
            if (this.getView().byId("monitorId")) {
                this.getView().byId("monitorId")._oImageControl.destroy();
            }

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
            var oAddButton = this.getView().byId("update");
            // Fire the Press event 
            oAddButton.firePress();
        }

    });
});