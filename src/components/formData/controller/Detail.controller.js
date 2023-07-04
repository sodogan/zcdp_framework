sap.ui.define([
    "aklc/cm/library/common/controller/BaseController",
    "aklc/cm/components/formData/controls/FieldFactory",
    "aklc/cm/components/formData/controls/Label",
    "sap/ui/layout/form/FormContainer",
    "sap/ui/layout/form/FormElement",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
], function(BaseController, FieldFactory, Label, FormContainer, FormElement, JSONModel, MessageToast) {
    "use strict";

    return BaseController.extend("aklc.cm.components.formData.controller.Detail", {
        _sFormDataCollection: "FormData", // path to form data entity
        _sFormDataLookupCollection: "FormDataLookup", // path of field lookup entity
        _sSelectedStepPath: null, // Select Step Path
        _oViewModel: null, //View Model
        _sStepKey: "",
        _oMainController: "",

        /**
         * on init
         * @param  {object} oEvent Event object
         */
        onInit: function(oEvent) {
            BaseController.prototype.onInit.apply(this);
            this.oListSelector = this.getComponent().oListSelector;
            this.oRowRepeater = this.byId("rowRepeater");
            this.oRowRepeater.getAggregation("footerPager").setVisible(false);
            this._oForm = this._oView.byId("DETAIL_FORM");
            this.oListSelector.oWhenListLoadingIsDone.then(this.onStepsLoaded.bind(this));
            this.oListSelector.attachListSelectionChange(this.onMasterListSelect, this);
            this.getComponent().listIds = [];
            this.oFields = [];
            /*eslint-disable */
            var that = this;
            this._oForm.addEventDelegate({
                onAfterRendering: function() {
                    that.validateAllFields();

                }
            });
            /*eslint-enable */

            //use ViewModel to control "Next" button
            this._oViewModel = new JSONModel({
                nextButtonVisible: false,
                nextButtonText: ""
            });
            this.getView().setModel(this._oViewModel, "vm");
        },

        /**
         * on Steps Loaded we build the complete FormData
         * including rendering controls which are invisible or disabled
         * some of these controls will become visible and enabled in real time
         * based on user input, others will be come active via the roundtrip after
         * each step
         * @param  {object} oParams paramaters object
         */
        onStepsLoaded: function(oParams) {
            jQuery.sap.log.info("MockRequest:FormData:Detail:onStepsLoaded");
            var fnMap = function(oItem) {
                return oItem.getBindingContext();
            };
            var aStepsPath = oParams.list.getItems().map(fnMap);

            // default first step, overwrite if other found
            this._sSelectedStepPath = aStepsPath[0].getPath();

            this.oItemlist = oParams.list.getItems();
            this.getOwnerComponent().oList = oParams.list;

            this.setIconClass(this.oItemlist);

            this.oRowRepeater.removeAllRows();

            // for each step path render a new Row/Page of the row repeater
            aStepsPath.forEach(function(oContext, index) {
                var oForm = this._oForm.clone();
                oForm.setBindingContext(oContext);
                this.createFormContent(oContext, oForm);
                this.oRowRepeater.addRow(oForm);

                // there should only be one "Selected" store the path when found
                if (this._oModel.getProperty("Selected", oContext)) {
                    this._sSelectedStepPath = oContext.getPath();
                }
            }.bind(this));

            // set the selected step on both master and detail views
            this.oListSelector.selectAListItem(this._sSelectedStepPath);
            this.selectPageByPath(this._sSelectedStepPath);
        },

        /**
         * create a form container for each Form Data attribute
         * @param  {object} oContext context
         * @param  {object} oForm    Form Object container
         */
        createFormContent: function(oContext, oForm) {
            var aFormData = this._oModel.getProperty(this._sFormDataCollection, oContext);

            aFormData.forEach(function(sPath, index) {
                var oContainer = this.createFormContainer(this._oModel.getContext("/" + sPath));
                oForm.insertFormContainer(oContainer, index);
            }.bind(this));
        },

        /**
         * Check that inputs are not empty or space.
         * @return {boolean} errors occured
         */
        checkAndMarkEmptyMandatoryFields: function() {
            var fnMap = function(oRow) {
                return this._oModel.getProperty(this._sFormDataCollection, oRow.getBindingContext());
            }.bind(this);

            var fnReduce = function(aPath, bPath) {
                return aPath.concat(bPath);
            };

            // use mapReduce to flatten paths to an array
            var aVisiblePaths = this.oListSelector.getVisibleItems().map(fnMap).reduce(fnReduce);

            // collect the control paths for each step
            var aControls = aVisiblePaths.map(function(sPath) {
                return this.getFieldById(this._oModel.getProperty("/" + sPath).Attribute);
            }.bind(this));

            // check the visible controls for error
            return this.checkClientError(aControls);
        },

        /**
         * get Field By Id, controls too deep for this.byID to work
         * @param  {string} sId id of the field
         * @return {object}     control
         */
        getFieldById: function(sId) {
            return sap.ui.getCore().byId(sId);
        },

        /**
         * check Client for Errors, loop at the array of controls and
         * test one by one, all or nothing on errors
         * @param  {array} aControls an array of controls to check
         * @return {boolean}           has errors
         */
        checkClientError: function(aControls) {
            var bErrors = false;
            aControls.forEach(function(oControl) {
                if (oControl.checkClientError()) {
                    bErrors = true;
                }
            });

            return bErrors;
        },

        /**
         * on Check Valid Event is a base controller event, it is triggered
         * by component, the components sends a deferred promise if the call
         * is valid, no errors, the promise is resolved
         * @param  {string} sChannel [description]
         * @param  {string} sEvent   [description]
         * @param  {object} oData    [description]
         */
        onCheckValid: function(sChannel, sEvent, oData) {

            if (!this.checkAndMarkEmptyMandatoryFields()) {
                oData.WhenValid.resolve("Success");
            } else {
                oData.WhenValid.resolve("Error");
                jQuery.sap.log.info("Dynamic View - validation errors");
            }
        },

        /**
         * Select Page by Path
         * @param  {string} sPath context path
         */
        selectPageByPath: function(sPath) {
            var aRowPaths = this.oRowRepeater.getRows().map(function(oItem) {
                return oItem.getBindingContext().getPath();
            });

            this.oRowRepeater.setCurrentPage(aRowPaths.indexOf(sPath) + 1);
            this.setNextButtonVisible();
        },

        /**
         * on Next Step - vaidate first on client, then on the server, if valid
         * then navigate to next step
         * @param  {object} oEvent event object
         */
        onNextStep: function(oEvent) {
            var oContext = this._oModel.getContext(this._sSelectedStepPath);
            var fnSubmit = this._submitChanges.bind(this);
            var fnNextStep = this.oListSelector.selectNextStep.bind(this.oListSelector);

           // this.oListSelector.setBusy(true);
             this._oBusyDialog;
            if(!this._oBusyDialog){
            this._oBusyDialog = new sap.m.BusyDialog();
            }
            this._oBusyDialog .open()

            this.validateSubStep(oContext).then(fnSubmit).then(fnNextStep);
        },

        /**
         * changes are stored in a deferred batch call, here we submit them
         * @return {[type]} [description]
         */
        _submitChanges: function() {

            var oController = this;
            return new Promise(function(fnResolve, fnReject) {
                var fnSuccess = function(oResponses) {
                 var aFilterBy = [];
                aFilterBy.push(new sap.ui.model.Filter("StepKey", sap.ui.model.FilterOperator.EQ, oController._oMainController._sStepKey));

                  oController._oModel.read("/SubSteps", {
                    urlParameters: {
                        $expand: "FormData/FormDataLookup"
                    } ,
                    filters: aFilterBy,
                   success: function(){
                    oController.validateAllFields();
                oController._oBusyDialog .close();

                   },
                   error: function(){
                    oController.validateAllFields();
                oController._oBusyDialog .close();

                   }
                });
                    //Back end Error messages handling for Footer buttons
                    var bErrorFlag = false;

                    $.each(oResponses.__batchResponses, function(i, oResponse) {
                        if (oResponse.response) {
                            var sBody = oResponse.response.body;
                            var oError = JSON.parse(sBody);

                            /*eslint-disable */
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

                        /*eslint-enable */
                        if (aRemoveEntites.length > 0) {
                            // Delete only Application Hold Entites changes
                            oController._oModel.resetChanges(aRemoveEntites);
                        }

                        // Remove the busy Indicator
                        oController.oListSelector.setBusy(false);
                        jQuery.sap.log.error("Error adding new note");
                        if (oController._oMainResolve) {
                            oController._oMainResolve.WhenValid.resolve("Error");
                            oController._oMainResolve = "";
                        } else {
                            MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
                        }
                        fnResolve();
                    } else {
          var oManager = sap.ui.getCore().getMessageManager();
            var oMessageModel = oManager.getMessageModel();
            var aMessages = oMessageModel.getProperty("/");
            // Set messages to non-persistent
            aMessages.forEach(function(oMessage) {
                oMessage.setPersistent(false);
            });
            // Tell the MessageManager to remove them from the model and all Bindings/DataStates
            oManager.removeMessages(aMessages);
                        var buttonText = oController._oViewModel.getProperty("/nextButtonText");
                        if (buttonText === "Complete") {
                            MessageToast.show(oController.getI18NText("SuccessfullySubmitted"));
                        }
                        // Create Framework ApplicationAction Sheet buttons 
                        oController._oMainController.createActionSheetButtons();
                        jQuery.sap.log.info("MockRequest:FormData:Detail:_submitChanges");
                        fnResolve();
                        oController.oListSelector.setBusy(false);

                        if (oController._oMainResolve) {
                            oController._oMainResolve.WhenValid.resolve("Success");
                            oController._oMainResolve = "";
                        }
                    }
                };

                var fnError = function() {
                    if (oController._oMainResolve) {
                        oController._oMainResolve.WhenValid.resolve("Error");
                        oController._oMainResolve = "";
                    }
                    fnReject();
                };

             //   if (this._oModel.hasPendingChanges()) {

                    // Set the Icon Status as "Error" or "Success" for Form Data user story icon in the Nav Bar
                    var sPath = "/" + this._oModel.createKey(this._oMainController._sStepsCollection, {
                        ApplicationKey: this._oMainController._sProcessKey,
                        StepKey: this._oMainController._sStepKey
                    });

                    // Setting same application step status for triggering $batch call for this entity
                  //  this._oModel.getContext(sPath).getObject().Status = this._oModel.getContext(sPath).getObject().Status;
                    this._oModel.getData(sPath).Status = this._oModel.getContext(sPath).getObject().Status;
                    this._oModel.setProperty("Status", this._oModel.getContext(sPath).getObject().Status, this._oModel.getContext(sPath));
                    var oAppChangeData = this._oModel.getData(sPath);
             var oAppEntry = {
                            ApplicationKey: oAppChangeData.ApplicationKey,
                            CrmUrl:         oAppChangeData.CrmUrl,
                            Status:oAppChangeData.Status,
                            StepKey:oAppChangeData.StepKey,
                            Description:oAppChangeData.Description,
                            Icon:oAppChangeData.Icon,
                            Component:oAppChangeData.Component,
                            Active:oAppChangeData.Active,
                            Current:oAppChangeData.Current,
                            Dirty:oAppChangeData.Dirty
                        };


                    this._oModel.update(sPath, oAppEntry);
                    this._oModel.read(sPath);
                    if (this._oModel.hasPendingChanges()) {
                var oChangedEntities = this._oModel.mChangedEntities;
                var oChangedPath = {sPath : "",sValue : ""};
                var sStepKey ;
                var oRemoveEntity = [];

    for (var key in oChangedEntities) {
                        oChangedPath = {};
         if (oChangedEntities.hasOwnProperty(key)) {
                oChangedPath.sPath = "/" + key ;
                var oSubStep = key.split('(');

                if(oSubStep[0] === "SubSteps"){
                     oRemoveEntity.push(oChangedPath.sPath);
                    if(oChangedEntities[key].Selected){
                        oChangedPath.sValue = oChangedEntities[key].Selected;
                        }
                    else{
                        oChangedPath.sValue = false;
                        }


                        var oChangeData = this._oModel.getData(oChangedPath.sPath);
                        oChangeData.Selected = oChangedPath.sValue;

                      if(oChangedEntities[key].Active){
                         oChangeData.Active = oChangedEntities[key].Active;
                        }
                      if(oChangedEntities[key].Completed){
                         oChangeData.Completed = oChangedEntities[key].Completed;
                        }

                        var oEntry = {
                            StepKey:    oChangeData.StepKey,
                            SubStep:    oChangeData.SubStep,
                            Label:      oChangeData.Label,
                            Active:     oChangeData.Active,
                            Selected:   oChangeData.Selected,
                            Completed:  oChangeData.Completed,
                            Dirty:      oChangeData.Dirty,
                            Visible:    oChangeData.Visible
                        };

                          this._sStepKey = oChangeData.StepKey;
                         this._oModel.update(oChangedPath.sPath, oEntry);
                    }

                 }
            }
                    this._oModel.submitChanges({
                        success: function(oEvent) {
                            fnSuccess(oEvent);
                        },
                        error: fnError
                    });
                } else {
 oController._oBusyDialog .close()
                    if (this._oMainResolve) {
                        MessageToast.show(this.getI18NText("NoChangeSaveMessage"));
                        this._oMainResolve.WhenValid.resolve("Info");
                        this._oMainResolve = "";
                    }
                    fnResolve();
                }
            }.bind(this));
        },

        /**
         * get an array of visible controls for the current subStep check them for
         * errors, if no errors set step completed, then resolve promise, else, stop
         * busy indicator and return to screen
         * @param  {object} oContext context of current step
         * @return {promise} promise
         */
        validateSubStep: function(oContext) {
            return new Promise(function(fnResolve, fnReject) {

                // No need to validate 
                if ((this._oMainResolve) && (this._oMainResolve.ValidationRequired !== "X")) {
                    // if(this._oMainResolve) {
                    fnResolve();
                }

                // set current step completed
                var aControls = this._oModel.getProperty(this._sFormDataCollection, oContext).map(function(sPath) {
                    return this.getFieldById(this._oModel.getProperty("/" + sPath).Attribute);
                }.bind(this));

                if (!this.checkClientError(aControls)) {
                    //this._oModel.setProperty("Completed", "S", oContext, true);
                    fnResolve();
                } else {

                    this._oModel.setProperty("Completed", "E", oContext, true);

                    fnResolve();

                }

            }.bind(this));
        },

        /**
         * on Master List Select
         * @param  {object} oEvent event object
         */
        onMasterListSelect: function(oEvent) {
            var oContext = oEvent.getParameters().listItem.getBindingContext();
            var sNewStepPath = oContext.getPath();

            // Get the selected Step Key
            this._sStepKey = oContext.getObject().StepKey;

            // do nothing if already selected
            if (this._sSelectedStepPath === sNewStepPath) {
                return;
            }

            // only navigate to next step if it is active
            if (this._oModel.getProperty("Active", oContext)) {
                // unset current select
                var oSelectedContext = this._oModel.getContext(this._sSelectedStepPath);

               var oItems = oEvent.getSource().getItems();
               var oItemslen = oItems.length;
               for(var i = 0; i < oItemslen ; i++){
                    var oItemContext = oItems[i].getBindingContext();
                 this._oModel.setProperty("Selected", false, oItemContext, true);
               }

                this._oModel.setProperty("Selected", false, oSelectedContext, true);
                this._oModel.setProperty("Selected", true, oContext, true);
                this._sSelectedStepPath = sNewStepPath;
                this.selectPageByPath(sNewStepPath);
            } else {
                // revert back to previous selection and reset focus
                this.oListSelector.selectAListItem(this._sSelectedStepPath);
            }

            this.oListSelector.setBusy(false);
        },

        /**
         * set "Next" button, if last step, change text to "Complete"
         */
        setNextButtonVisible: function() {
            var fnMap = function(oItem) {
                return oItem.getBindingContext().getPath();
            };
            var aListPaths = this.oListSelector.getVisibleItems().map(fnMap);
            var iSelectedIndex = aListPaths.indexOf(this._sSelectedStepPath) + 1;
            var sButtonText = (aListPaths.length > iSelectedIndex) ? "Next" : "Complete";

            this._oViewModel.setProperty("/nextButtonText", sButtonText);
            this._oViewModel.setProperty("/nextButtonVisible", true);
        },

        /**
         * the form container is made up of a label and input control, the type of control
         * is dynamic and derived via a control factory, place both the controls label and
         * input into a form container and bind Attributes context
         * @param  {object} oContext context going to be bound
         * @return {object} form container
         */
        createFormContainer: function(oContext) {
            var oData = this._oModel.getProperty(null, oContext);

            // label
            var oLabel = new Label({
                text: oData.Label,
                required: oData.Required,
                requiredAtBegin: true,
                wrapping: false,
                layoutData: new sap.ui.layout.GridData({
                    span: "L7 M5 S7"
                })
            });

            // Input Field
            var oField = new FieldFactory({
                id: oData.Attribute,
                mvaluePath: oData.String,
                reverseButtons: oData.ReverseButtons,
                valuePath: oData.ValuePath,
                lookupPath: this._sFormDataLookupCollection,
                controlType: oData.Type,
                label: oData.Label,
                enabled: oData.Enabled,
                visible: "{Visible}",
                dependencies: "{Dependents}",
                mandatory: oData.Required
            });

            oField.parentViewControl = this;
            oField.SubStep = oData.SubStep;
            this.oFields.push(oField);

            return new FormContainer({
                formElements: new FormElement({
                    fields: [oLabel, oField],
                    visible: {
                        path: "Visible"
                    }
                }).setBindingContext(oContext)
            });
        },

        /*eslint-disable */
        setIconClass: function(olist) {
            var that = this;

            olist.forEach(function(oItem) {
                /*eslint-enable */
                if (oItem.getCells().length !== 0) {

                    var a = {
                        SubStep: "",
                        iconcellId: "",
                        Status: ""
                    };
                    a.SubStep = oItem.getModel().getData(oItem.getBindingContextPath()).SubStep;
                    a.iconcellId = oItem.getCells()[1].getId();
                    a.Status = oItem.getModel().getData(oItem.getBindingContextPath()).Completed;

                    that.getComponent().listIds.push(a);

                    if (oItem.getModel().getData(oItem.getBindingContextPath()).Completed === "E") {
                        oItem.getCells()[1].setSrc("sap-icon://message-error");
                        oItem.getCells()[1].addStyleClass("ackErrorstatusIcon");
                        oItem.getCells()[1].addStyleClass("ackErrorstatusIcon");
                        oItem.getCells()[1].removeStyleClass("statusIcon");
                        oItem.getCells()[1].removeStyleClass("acklNoShowNavIcon1");

                    } else if (oItem.getModel().getData(oItem.getBindingContextPath()).Completed === "S") {
                        oItem.getCells()[1].setSrc("sap-icon://accept");

                        oItem.getCells()[1].addStyleClass("statusIcon");
                        oItem.getCells()[1].removeStyleClass("ackErrorstatusIcon");
                        oItem.getCells()[1].removeStyleClass("acklNoShowNavIcon1");

                    } else {

                        oItem.getCells()[1].addStyleClass("acklNoShowNavIcon1");
                        oItem.getCells()[1].removeStyleClass("statusIcon");
                        oItem.getCells()[1].removeStyleClass("ackErrorstatusIcon");

                    }

                }
            });
        },

        /**
         * on Context Changed is a base method called by the component, it sends context
         * @param  {string} sChannel channel ID
         * @param  {string} sEvent   event ID
         * @param  {object} oData    data object
         */
        onContextChanged: function(sChannel, sEvent, oData) {
            // set the Main controller reference, since this reference will be used it later for set the Nav Bar Icon status based on the Form data validation
            this._oMainController = oData.controller;
        },
        getI18NText: function(sTextKey, aParameters) {
            return this.getView().getModel("i18n").getResourceBundle().getText(sTextKey, aParameters);
        },

        setApplicationstepStatus: function(oController, sStatus) {

            // Set the Icon Status as "Error" for Form Data user story icon in the Nav Bar
            var sPath = "/" + oController._oModel.createKey(oController._oMainController._sStepsCollection, {
                ApplicationKey: oController._oMainController._sProcessKey,
                StepKey: oController._oMainController._sStepKey
            });

            if (oController._oModel.getContext(sPath).getObject().Component === "formData") {
              //  oController._oModel.getContext(sPath).getObject().Status = sStatus;
                oController._oModel.getData(sPath).Status = sStatus;
                oController._oMainController.refreshNavBarIcons();
            }
        },

        subStepisVisible: function(sSubStep) {

            var bVisible = true;

            var sPath = "/" + this._oModel.createKey("SubSteps", {
                StepKey: this._sStepKey,
                SubStep: sSubStep
            });
            if (this._oModel.getContext(sPath).getObject()) {
                bVisible = this._oModel.getContext(sPath).getObject().Visible;
            }
            return bVisible;

        },

        /*eslint-disable */
        validateAllFields: function() {
            var that = this;
            /*eslint-enable */
            this.oFields.forEach(function(oCurrfield) {
                    if (!oCurrfield.getVisible() && oCurrfield._oError !== null) {
                        if (oCurrfield._oModel) {
                            var aMessage = oCurrfield._oModel.getMessagesByPath(oCurrfield._getFullValuePath()) || [];
                            oCurrfield._oMessageManager.removeMessages(aMessage);
                            oCurrfield._oError = null;
                        }
                    } else if (oCurrfield.getVisible() && that.subStepisVisible(oCurrfield.SubStep)) {
                        oCurrfield.checkClientError();
                    }
                }

            );
        },
        /**
         * Form Data All fields validation event
         * @param  {[type]} sChannel [description]
         * @param  {[type]} sEvent   [description]
         * @param  {[type]} oData    [description]
         */
        onFormDataValidateAllFields: function(sChannel, sEvent, oData) {
            this.validateAllFields();
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

            var oManager = sap.ui.getCore().getMessageManager();
            var oMessageModel = oManager.getMessageModel();
            var aMessages = oMessageModel.getProperty("/");
            // Set messages to non-persistent
            aMessages.forEach(function(oMessage) {
                oMessage.setPersistent(false);
            });
            // Tell the MessageManager to remove them from the model and all Bindings/DataStates
            oManager.removeMessages(aMessages);
            // Add your ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“finalÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â messages
            aFinalMessages.forEach(function(oMessage) {
                   oMessage.setPersistent(true);
              });
            oManager.addMessages(aFinalMessages);

            // Replace duplicate messages and refresh it
          //  sap.ui.getCore().getMessageManager().removeAllMessages();
          //  sap.ui.getCore().getMessageManager().getMessageModel().oData = [];
           // sap.ui.getCore().getMessageManager().getMessageModel().oData = aFinalMessages;
         //  sap.ui.getCore().getMessageManager().addMessages(aFinalMessages);
          //  sap.ui.getCore().getMessageManager().getMessageModel().refresh();

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
            this.oListSelector.bMainResolve = true;
            // Get the Add Button reference
            var oAddButton = this.getView().byId("next");
            // Fire the Press event 
            oAddButton.firePress();
        }

    });
});