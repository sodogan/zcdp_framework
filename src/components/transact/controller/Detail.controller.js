sap.ui.define([
    "aklc/cm/library/common/controller/BaseController",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/m/ColumnListItem",
    "sap/m/ObjectIdentifier",
    "sap/m/Text",
    "sap/ui/commons/MessageToast",
    "aklc/cm/library/common/controller/Validation",
    "sap/ui/core/format/DateFormat"
], function(BaseController, Fragment, Filter, FilterOperator, ColumnListItem, ObjectIdentifier, Text, MessageToast, Validation, DateFormat) {
    "use strict";

    return BaseController.extend("aklc.cm.components.transact.controller.Detail", {
        _formFields: ["orderType"],
        _readonlyFormFields: ["category", "status"],
        _sUpdate: "UPDATE",
        _sCreate: "CREATE",
        _sSaveId: "add",
        _sChannelId: "transaction",
        _sFormId: "Transaction_Form",
        _sObjectSearchHelp: "aklc.cm.components.transact.fragments.ObjectTypeSearch",
        _sTransactionSearchHelp: "aklc.cm.components.transact.fragments.TransactionSearch",
        _oMainController: "",

        /**
         * on init
         * @param  {object} oEvent Event object
         */
         /*eslint-disable */
        onInit: function(oEvent) {
            BaseController.prototype.onInit.apply(this);
            this._oForm = this._oView.byId(this._sFormId);
            this.oComponent = this.getOwnerComponent();

            this._oBundle = this.getComponent().getModel("i18n").getResourceBundle();

            this.oValidation = new Validation(this);

            this._oMessageManager = sap.ui.getCore().getMessageManager();
            this._oMessageManager.registerObject(this.getView(), true);
            var that = this;

            this.getEventBus().subscribe(this._sChannelId, "refreshTransactionForm",

                function(sChannelId, sEventId, oData) {
                    that._oContext = oData.context;
                    that._oForm.setBindingContext(oData.context);

                    if (that._formFields.length > 1) {
                        that._formFields.pop();
                    }

                    //Make form fields read-only
                    if (oData.action === that._sUpdate) {
                        that.toggleEditableFields(false);
                        that.oComponent._setViewModelProperty("SaveBtn_Visible", false);
                        that.oComponent._oViewModel.setProperty("/SubjectEditable", false); //Make Subject field button editable
                    } else if (oData.action === that._sCreate) {
                        that.toggleEditableFields(true);
                        that.oComponent._setViewModelProperty("SaveBtn_Visible", true);
                        that.oComponent._oViewModel.setProperty("/SubjectEditable", true); //Make Subject field button editable
                    }
                });

            this.oTransactionTemplate = new sap.m.ColumnListItem({ // Template used for Transaction Search Dialog
                cells: [
                    new sap.m.ObjectIdentifier({
                        text: "{ApplicationText}"
                    }),
                    new sap.m.ObjectIdentifier({
                        text: "{WorkDescription}"
                    }),
                    new sap.m.ObjectIdentifier({
                        text: "{CategoryText}"
                    }),
                    new sap.m.ObjectIdentifier({
                        text: "{PropertAddress}"
                    }),
                    new sap.m.Text({
                        text: {
                            path: 'DateReceived',
                            formatter: function(dDate) {
                                if (dDate) {
                                    /* var value = JSON.stringify(dDate);
                                     var value1 = value.substring(7, 20);*/
                                    var oDateFormat = DateFormat.getDateInstance({ pattern: "dd/MM/yyyy" });
                                    var RecDate = oDateFormat.format(new Date(Number(dDate)));
                                    return RecDate;
                                }
                            }
                        }

                    }),
                    new sap.m.Text({
                        text: "{StatusText}"
                    })
                ]
            });

            this.oObjectTemplate = new sap.m.ColumnListItem({ // Template used for Order Type Search Dialog
                cells: [
                    new sap.m.ObjectIdentifier({
                        text: "{OrderTypeText}"
                    })
                ]
            });
        },
        onAfterRendering: function() {},

        /**
         * set field visible or not using Id
         * @param  {string}  sId of the field
         * @param  {boolean}  bVisible visibility
         */
        setVisibleField: function(sId, bVisible) {
            this.getView().byId(sId).setVisible(bVisible);
        },

        onContextChanged: function(sChannel, sEvent, oData) {

            this._oMainController = oData.controller;
            this._sStepKey = this._oModel.getProperty("StepKey", oData.context);
        },

        cancelKeyPress: function(oEvent) {
            return oEvent.getSource().setValue(oEvent.getSource()._lastValue);
        },

        handleObjectSearchHelp: function(oEvent) {

            this.inputId = oEvent.getSource().getId();

            if (!this._objectHelpDialog) {
                this._objectHelpDialog = sap.ui.xmlfragment(
                    this._sObjectSearchHelp, this
                );

                this._objectHelpDialog.setModel(this.getView().getModel("i18n"), "i18n");
                this._objectHelpDialog.setModel(this._oModel); //Required so table dialog shows data from service
                this.getView().addDependent(this._objectHelpDialog);

                this.aFilterBy = [];
                this.aFilterBy.push(new sap.ui.model.Filter("StepKey", sap.ui.model.FilterOperator.EQ, this._sStepKey));

                this._objectHelpDialog.bindAggregation("items", {
                    path: "/VH_OrderType",
                    sorter: null,
                    parameters: {},
                    template: this.oObjectTemplate,
                    filters: this.aFilterBy
                });
            }

            this._objectHelpDialog.open();
        },

        handleTransactionSearchHelp: function(oEvent) {

            this.inputId = oEvent.getSource().getId();

            if (!this._transactionHelpDialog) {
                this._transactionHelpDialog = sap.ui.xmlfragment(
                    this._sTransactionSearchHelp, this
                );

                this.objectSearch = this.getView().byId("objectSearchDialog");
                this._transactionHelpDialog.setModel(this._oModel); //Required so table dialog shows data from service

                this._transactionHelpDialog.setModel(this.getView().getModel("i18n"), "i18n");
                this.getView().addDependent(this._transactionHelpDialog);
            }

            this.aFilterBy = [];
            this.aFilterBy.push(new sap.ui.model.Filter("OrderType", sap.ui.model.FilterOperator.EQ, this._oModel.getProperty("OrderType", this._oForm.getBindingContext())));
            this.aFilterBy.push(new sap.ui.model.Filter("StepKey", sap.ui.model.FilterOperator.EQ, this._sStepKey));
            this._transactionHelpDialog.bindAggregation("items", {
                path: "/TransactionSearch",
                sorter: null,
                parameters: {},
                template: this.oTransactionTemplate,
                filters: this.aFilterBy
            });

            this._transactionHelpDialog.open();
        },

        _handleObjectValueHelpSearch: function(oEvent) {
            var sValue = oEvent.getParameter("value");
            var aFilters = [];

            aFilters.push(new Filter(
                "OrderTypeText",
                FilterOperator.Contains, sValue
            ));

            oEvent.getSource().getBinding("items").filter(aFilters);
        },

        _handleTransValueHelpSearch: function(oEvent) {
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

                if (oSelectedItem.getBindingContextPath().indexOf("OrderType") > -1) {
                    this._setFormModelProperty("OrderTypeText", oContext.OrderTypeText);
                    this._setFormModelProperty("OrderType", oContext.OrderType);

                    this.oComponent._oViewModel.setProperty("/SubjectEditable", true); //Make Subject field button editable
                    this.oValidation.validateForm();
                    this._formFields.push("subject");
                } else {
                    this._setFormModelProperty("ApplicationText", oContext.ApplicationText);
                    this._setFormModelProperty("ApplicationKey", oContext.ApplicationKey);
                    this._setFormModelProperty("TransactionType", oContext.TransactionType);
                    this._setFormModelProperty("TransactionTypeText", oContext.TransactionTypeText);
                    this._setFormModelProperty("StatusText", oContext.StatusText);
                    this._setFormModelProperty("Status", oContext.Status);
                    this._setFormModelProperty("CategoryText", oContext.CategoryText);

                    this.oValidation.validateForm();
                }
            }
        },

        _setFormModelProperty: function(property, value) {
            this._oModel.setProperty(property, value, this._oForm.getBindingContext());
        },

        toggleEditableFields: function(editable) {
            this._formFields.forEach(
                function(obj, i) {
                    this.byId(obj).setEditable(editable);
                }.bind(this)
            );
        },

        onValidateForm: function(oEvent) {
            this.oValidation.validateForm();
        },

        /**
         * changes are stored in a deferred batch call, here we submit them
         */
        onAdd: function(oEvent) {

            var that = this;
            var oController = this;

            if ((!this._oMainResolve) || (this._oMainResolve.ValidationRequired === "X")) {
                that.oValidation.validateForm();
            }

            if (!that.oValidation._oError) {

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
                    that._oModel.submitChanges({
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
                                jQuery.sap.log.error("Error adding new Transact");
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
                                oController.deleteDuplicateMessages();
                                oController.toggleEditableFields(false);
                                oController.oComponent._setViewModelProperty("SaveBtn_Visible", false);
                                /*oController._formFields.pop();*/

                                // Remove the busy Indicator
                                oController.getView().getParent().setBusy(false);
                                jQuery.sap.log.info("Added new Property");

                                oController._oModel.resetChanges();

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

                    that.oComponent._setViewModelProperty("CreateMode", true); //Make Add button enabled

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
