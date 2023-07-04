sap.ui.define([
    "aklc/cm/library/common/controller/BaseController",
    "sap/ui/commons/MessageToast",
    "aklc/cm/library/common/controller/Validation"
], function(BaseController, MessageToast, Validation) {
    "use strict";

    return BaseController.extend("aklc.cm.components.stw.controller.Detail", {
        _sSTWCollection: "StormwaterDischargePoints",
        _formFields: ["dischargePointNo", "location", "easting", "northing", "contributionArea", "erosionProtDev", "outletType", "size", "treatmentType", "volResidenceTime", "stormwaterUnit", "efficiency"],
        _sUpdate: "UPDATE",
        _sDelete: "DELETE",
        _sCreate: "CREATE",
        _sSaveId: "add",
        _sUpdateId: "update",
        _sChannelId: "stw",
        _oMainController: "",

        /**
         * on init
         * @param  {object} oEvent Event object
         */
        onInit: function(oEvent) {
            BaseController.prototype.onInit.apply(this);
            this._oForm = this._oView.byId("STW_FORM");
            this.oComponent = this.getOwnerComponent();

            this._oBundle = this.getComponent().getModel("i18n").getResourceBundle();

            this.oValidation = new Validation(this);

            this._oMessageManager = sap.ui.getCore().getMessageManager();
            this._oMessageManager.registerObject(this.getView(), true);
            /*eslint-disable */
            var that = this;

            that.toggleEditableFields(false);
            // that.getView().byId("locationType").setEditable(false);
            // that.getView().byId("collectionMethod").setEditable(false);
            
            if (!this.oTemplate) {
                this.oTreatmentTypeTemplate = this.byId("treatmentTypeVal").clone();
                this.oOutletTypeTemplate = this.byId("outletTypeVal").clone();
                this.oErosionProtDevTemplate = this.byId("erosionProtDevVal").clone();
                this.oStormwaterUnitTemplate = this.byId("stormwaterUnitVal").clone();
            }

            this.getEventBus().subscribe(this._sChannelId, "refreshSTWForm",
                function(sChannelId, sEventId, oData) {
                    that._oContext = oData.context;
                    that._oForm.setBindingContext(oData.context);

                    //Make form fields read-only
                    if (oData.action === that._sUpdate) {
                        that.toggleEditableFields(true);
                        that.oComponent._setViewModelProperty("SaveBtn_Visible", false);
                        that.oComponent._setViewModelProperty("UpdateBtn_Visible", true);
                    } else if (oData.action === that._sCreate) {
                        that.toggleEditableFields(true);
                        that.oComponent._setViewModelProperty("SaveBtn_Visible", true);
                        that.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
                    } else {
                        that.toggleEditableFields(false);
                        that.oComponent._setViewModelProperty("SaveBtn_Visible", false);
                        that.oComponent._setViewModelProperty("UpdateBtn_Visible", false);                    	
                    }
                });
        },

        onAfterRendering: function() {},

        onSelectionChange: function(oEvent) {
            var sPath = this._oModel.createKey('/VH_LocationType', {
                StepKey: this._sStepKey,
                LocationType: oEvent.getSource().getSelectedKey()
            });

            this.oValidation.validateForm();
        },

        onContextChanged: function(sChannel, sEvent, oData) {

            this._oMainController = oData.controller;
            this._sStepKey = this._oModel.getProperty("StepKey", oData.context);

            var aFilterBy = [];
            aFilterBy.push(new sap.ui.model.Filter("StepKey", sap.ui.model.FilterOperator.EQ, this._sStepKey));

            this.byId("treatmentType").bindAggregation("items", {
                path: '/VH_TreatmentType',
                sorter: null,
                parameters: null,
                template: this.oTreatmentTypeTemplate,
                filters: aFilterBy
            });

            this.byId("outletType").bindAggregation("items", {
                path: '/VH_OutletType',
                sorter: null,
                parameters: null,
                template: this.oOutletTypeTemplate,
                filters: aFilterBy
            });

            this.byId("erosionProtDev").bindAggregation("items", {
                path: '/VH_ErosionProtDev',
                sorter: null,
                parameters: null,
                template: this.oErosionProtDevTemplate,
                filters: aFilterBy
            });

            this.byId("stormwaterUnit").bindAggregation("items", {
                path: '/VH_StormwaterUnit',
                sorter: null,
                parameters: null,
                template: this.oStormwaterUnitTemplate,
                filters: aFilterBy
            });            
        },

        _setFormModelProperty: function(property, value) {
            this._oModel.setProperty(property, value, this._oForm.getBindingContext());
        },

        _getFormModelProperty: function(property) {
            return this._oModel.getProperty(property, this._oForm.getBindingContext());
        },

        setAllFormFields: function(sDischargePointNo, sLocation, sContributionArea, sErosionProtDev, sOutletType, sEasting, sNorthing, sSize, sTreatmentType, sVolResidenceTime, sStormwaterUnit, sEfficiency) {
            this.byId(this._formFields[0]).setValue(sDischargePointNo);
            this.byId(this._formFields[1]).setValue(sLocation);
            this.byId(this._formFields[2]).setValue(sContributionArea);
            this.byId(this._formFields[3]).setValue(sErosionProtDev);
            this.byId(this._formFields[4]).setValue(sOutletType);
            this.byId(this._formFields[5]).setValue(sEasting);
            this.byId(this._formFields[6]).setValue(sNorthing);
            this.byId(this._formFields[7]).setValue(sSize);
            this.byId(this._formFields[8]).setValue(sTreatmentType);
            this.byId(this._formFields[9]).setValue(sVolResidenceTime);
            this.byId(this._formFields[10]).setValue(sStormwaterUnit);
            this.byId(this._formFields[11]).setValue(sEfficiency);

            // this.byId(this._readOnlyFormFields[0]).setValue(sCreatedOn);
            // this.byId(this._readOnlyFormFields[1]).setValue(sChangedOn);
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

                // this._setFormModelProperty("LocationTypeText", this.formatLocationType(this._getFormModelProperty("LocationType")));
                // this._setFormModelProperty("CollectionMethodText", this.formatCollectionMethod(this._getFormModelProperty("CollectionMethod")));

                this._setFormModelProperty("ErosionProtDevText", this.formatErosionProtDev(this._getFormModelProperty("ErosionProtDev")));
                this._setFormModelProperty("OutletTypeText", this.formatOutletType(this._getFormModelProperty("OutletType")));
                this._setFormModelProperty("TreatmentTypeText", this.formatTreatmentType(this._getFormModelProperty("TreatmentType")));
                this._setFormModelProperty("StormwaterUnitText", this.formatStormwaterUnit(this._getFormModelProperty("StormwaterUnit")));

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
                                jQuery.sap.log.error("Error adding new Stormwater Discharge Point");
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

                                jQuery.sap.log.info("Added new GIS Location");

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
                            jQuery.sap.log.error("Error adding new Stormwater Discharge Point");

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

				var oContext = oEvent.getSource().getBindingContext();
				var oData = oEvent.getSource().getBindingContext().getObject();
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

                            jQuery.sap.log.info("Updated Stormwater Discharge Point");
                        },
                        error: function(oEvent) {
                            // Remove the busy Indicator
                            oController.getView().getParent().setBusy(false);
                            MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
                            jQuery.sap.log.error("Error updating Stormwater Discharge Point");
                        }
                    });
                } else {
                    MessageToast.show(this.getI18NText("NoChangeSaveMessage"));
                    this.getView().getParent().setBusy(false);
                }
            }
        },

        // formatLocationType: function(sLocationType) {
        //     var sPath = this._oModel.createKey('/VH_LocationType', {
        //         StepKey: this._sStepKey,
        //         LocationType: sLocationType
        //     });

        //     var oContext = this._oModel.getContext(sPath);

        //     return this._oModel.getProperty("LocaitonTypeText", oContext);
        // },

        // formatCollectionMethod: function(sCollectionMethod) {

        //     var sPath = this._oModel.createKey('/VH_CollectionMethod', {
        //         StepKey: this._sStepKey,
        //         CollectionMethod: sCollectionMethod
        //     });

        //     var oContext = this._oModel.getContext(sPath);

        //     return this._oModel.getProperty("CollectionMethodText", oContext);
        // },

        formatErosionProtDev: function(sErosionProtDev) {
            var sPath = this._oModel.createKey('/VH_ErosionProtDev', {
                StepKey: this._sStepKey,
                ErosionProtDev: sErosionProtDev
            });

            var oContext = this._oModel.getContext(sPath);

            return this._oModel.getProperty("ErosionProtDevText", oContext);
        },

        formatOutletType: function(sOutletType) {

            var sPath = this._oModel.createKey('/VH_OutletType', {
                StepKey: this._sStepKey,
                OutletType: sOutletType
            });

            var oContext = this._oModel.getContext(sPath);

            return this._oModel.getProperty("OutletTypeText", oContext);
        },

        formatTreatmentType: function(sTreatmentType) {
            var sPath = this._oModel.createKey('/VH_TreatmentType', {
                StepKey: this._sStepKey,
                TreatmentType: sTreatmentType
            });

            var oContext = this._oModel.getContext(sPath);

            return this._oModel.getProperty("TreatmentTypeText", oContext);
        },

        formatStormwaterUnit: function(sStormwaterUnit) {

            var sPath = this._oModel.createKey('/VH_StormwaterUnit', {
                StepKey: this._sStepKey,
                StormwaterUnit: sStormwaterUnit
            });

            var oContext = this._oModel.getContext(sPath);

            return this._oModel.getProperty("StormwaterUnitText", oContext);
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