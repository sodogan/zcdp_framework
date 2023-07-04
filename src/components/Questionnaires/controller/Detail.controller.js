sap.ui.define([
    "aklc/cm/library/common/controller/BaseController",
    "aklc/cm/components/Questionnaires/controls/FieldFactory",
    "aklc/cm/components/Questionnaires/controls/Label",
    "sap/ui/layout/form/FormContainer",
    "sap/ui/layout/form/FormElement",
    "sap/ui/model/json/JSONModel"
], function(BaseController, FieldFactory, Label, FormContainer, FormElement, JSONModel) {
    "use strict";

    return BaseController.extend("aklc.cm.components.Questionnaires.controller.Detail", {
        _sQuestionnairesCollection: "QFormData", // path to form data entity
        _sQuestionnairesLookupCollection: "QFormDataLookup", // path of field lookup entity
        _sSelectedStepPath: null, // Select Step Path
        _oViewModel: null, //View Model
        _sStepKey: "", // Current step key
        _sStepFlag: null, // flag for refresh sub steps

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


            //use ViewModel to control "Next" button
            this._oViewModel = new JSONModel({
                nextButtonVisible: false,
                nextButtonText: ""
            });
            this.getView().setModel(this._oViewModel, "vm");

        },

        /**
         * on Steps Loaded we build the complete Questionnaires
         * including rendering controls which are invisible or disabled
         * some of these controls will become visible and enabled in real time
         * based on user input, others will be come active via the roundtrip after
         * each step
         * @param  {object} oParams paramaters object
         */
        onStepsLoaded: function(oParams) {
            jQuery.sap.log.info("MockRequest:Questionnaires:Detail:onStepsLoaded");
            var fnMap = function(oItem) {
                return oItem.getBindingContext();
            };

            this.oRowRepeater.removeAllRows();
            var aStepsPath = oParams.list.getItems().map(fnMap);

            // default first step, overwrite if other found
            this._sSelectedStepPath = aStepsPath[0].getPath();

            this.oItemlist = oParams.list.getItems();
            this.getOwnerComponent().oList = oParams.list;

            this.setIconClass(this.oItemlist);

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
            var aQuestionnaires = this._oModel.getProperty(this._sQuestionnairesCollection, oContext);

            aQuestionnaires.forEach(function(sPath, index) {
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
                return this._oModel.getProperty(this._sQuestionnairesCollection, oRow.getBindingContext());
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
            var fnRecall = this._subStepRefresh.bind(this);
            this.oListSelector.setBusy(true);

    /*        this._oBusyDialog;
            if(!this._oBusyDialog){
            this._oBusyDialog = new sap.m.BusyDialog();
            }
            this._oBusyDialog .open();*/

            var that =  this;
            that._sStepFlag = true;
            this._oModel.attachBatchRequestCompleted(this, function(oEvent){
            if(that._sStepFlag){
            that._subStepRefresh();
            } });
            this.validateSubStep(oContext).then(fnSubmit).then(fnNextStep);


        },
        _subStepRefresh: function(){

       this._sStepFlag = false;
       var aFilterBy = [];
       var that = this;
        aFilterBy.push(new sap.ui.model.Filter("StepKey", sap.ui.model.FilterOperator.EQ,  this._sStepKey));

                  this._oModel.read("/QSubSteps", {
                    urlParameters: {
                        $expand: "QFormData/QFormDataLookup"
                    },
                    filters: aFilterBy,
                     success: function(){
                that._oBusyDialog .close();

                   },
                   error: function(){
                that._oBusyDialog .close();

                   } });
        },

        /**
         * changes are stored in a deferred batch call, here we submit them
         * @return {[type]} [description]
         */
        _submitChanges: function() {
            var that =  this;
            return new Promise(function(fnResolve, fnReject) {
                var fnSuccess = function() {
                    jQuery.sap.log.info("MockRequest:Questionnaires:Detail:_submitChanges");
                    fnResolve();
                };

                var fnError = function() {
                    fnReject();
                };

                var oChangedEntities = this._oModel.mChangedEntities;
                var oChangedPath = {sPath : "",sValue : ""};
                var sStepKey ;
                var oRemoveEntity = [];

    for (var key in oChangedEntities) {
                        oChangedPath = {};
         if (oChangedEntities.hasOwnProperty(key)) {
                oChangedPath.sPath = "/" + key ;
                var oSubStep = key.split('(');

                if(oSubStep[0] === "QFormData"){
                     oRemoveEntity.push(oChangedPath.sPath);
                     if(oChangedEntities[key].String){
                        oChangedPath.sValue = oChangedEntities[key].String;
                         }
                     else{
                        oChangedPath.sValue = '';
                        }
                    var oChangeData = that._oModel.getData(oChangedPath.sPath);
                    oChangeData.String = oChangedPath.sValue;

                    var oEntry = {
                       Active :          oChangeData.Active,
                       Attribute:        oChangeData.Attribute,
                       Boolean:          oChangeData.Boolean,
                       Currency:         oChangeData.Currency,
                       Date:             oChangeData.Date,
                       Dependents:       oChangeData.Dependents,
                       DependentsValue:  oChangeData.DependentsValue,
                       Dirty:            oChangeData.Dirty,
                       Enabled:          oChangeData.Enabled,
                       Label:            oChangeData.Label,
                       Number:           oChangeData.Number,
                       Placeholder:      oChangeData.Placeholder,
                       Required:         oChangeData.Required,
                       StepKey:          oChangeData.StepKey,
                       String:           oChangeData.String,
                       SubStep:          oChangeData.SubStep,
                       Tooltip:          oChangeData.Tooltip,
                       Type:             oChangeData.Type,
                       ValuePath:        oChangeData.ValuePath,
                       Visible:          oChangeData.Visible,
                       Year:             oChangeData.Year
                    };
                    this._sStepKey = oChangeData.StepKey;
                    that._oModel.update(oChangedPath.sPath, oEntry);
               }

                if(oSubStep[0] === "QSubSteps"){
                     oRemoveEntity.push(oChangedPath.sPath);
                    if(oChangedEntities[key].Selected){
                        oChangedPath.sValue = oChangedEntities[key].Selected;
                        }
                    else{
                        oChangedPath.sValue = false;
                        }
                        var oChangeData = that._oModel.getData(oChangedPath.sPath);
                        oChangeData.Selected = oChangedPath.sValue;
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
                         that._oModel.update(oChangedPath.sPath, oEntry);
                    }

                 }
            }
         if (oRemoveEntity.length !== 0) {
                this._oBusyDialog;
                if(!this._oBusyDialog){
                    this._oBusyDialog = new sap.m.BusyDialog();
                         }
                this._oBusyDialog .open();
                    }
                this._oModel.resetChanges();
                if (this._oModel.hasPendingChanges()) {
                    this._oModel.submitChanges({
                        success: fnSuccess,
                        error: fnError
                    });
                } else {
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
                // set current step completed
                var aControls = this._oModel.getProperty(this._sQuestionnairesCollection, oContext).map(function(sPath) {
                    return this.getFieldById(this._oModel.getProperty("/" + sPath).Attribute);
                }.bind(this));

                if (!this.checkClientError(aControls)) {
                    this._oModel.setProperty("Completed", "S", oContext, true);
                    fnResolve();
                } else {
                    this.oListSelector.setBusy(false);
                    this._oBusyDialog.busy();
                    // fnReject();
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
                    span: "L4 M5 S7"
                })
            });

            oLabel.addStyleClass("elipses");

            // Input Field
            var oField = new FieldFactory({
                id: oData.Attribute,
                valuePath: oData.ValuePath,
                lookupPath: this._sQuestionnairesLookupCollection,
                controlType: oData.Type,
                label: oData.Label,
                visible: "{Visible}",
                enabled: oData.Enabled,
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
        }
    });
});