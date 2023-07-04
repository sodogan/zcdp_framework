sap.ui.define(["aklc/cm/library/common/controller/BaseController",
        "sap/ui/model/json/JSONModel"
    ],
    function(BaseController, JSONModel) {
        "use strict";
        return BaseController.extend("aklc.cm.components.Questionnaires.controller.Master", {
            _sSubStepsCollection: "/QSubSteps", // SubSteps collection
            _sQuestionnairesCollection: "QFormData", // Questionnaires Collection
            _sQuestionnairesLookupCollection: "/QFormDataLookup", // Questionnaires Lookup collection
            _sStepKey: "", // Current step key
            _oMainController: "",
            /**
             * on Init
             * @param  {object} oEvent event object
             */
            onInit: function(oEvent) {
                BaseController.prototype.onInit.apply(this);
                var oListSelector = this.getComponent().oListSelector;
                this._oList = this.byId("list");
                this.oTemplate = this.byId("listItem").clone();

                oListSelector.setBoundMasterList(this._oList);
                this.isfirst = true;
            },

            /**
             * on Context Changed is a base method called by the component, it sends context
             * @param  {string} sChannel channel ID
             * @param  {string} sEvent   event ID
             * @param  {object} oData    data object
             */
            onContextChanged: function(sChannel, sEvent, oData) {

                this._oMainController = oData.controller;
                this._sStepKey = this._oModel.getProperty("StepKey", oData.context);

                this.bindList();
            },

            /**
             * Bind master list
             */
            bindList: function() {
                this.aFilterBy = [];
                this.aFilterBy.push(new sap.ui.model.Filter("StepKey", sap.ui.model.FilterOperator.EQ, this._sStepKey));

                this._oMainController.setScreenBusyIndicator();
                this._oList.bindAggregation("items", {
                    path: this._sSubStepsCollection,
                    sorter: null,
                    parameters: {
                        expand: this._sQuestionnairesCollection + this._sQuestionnairesLookupCollection
                    },
                    template: this.oTemplate,
                    filters: this.aFilterBy
                });

                // Attach listener for OData request & completed to manage busy indicator
                this._oList.getBinding("items").attachEvent("dataRequested", this._oMainController.setScreenBusyIndicator, this._oMainController);
                this._oList.getBinding("items").attachEvent("dataReceived", this._oMainController.removeScreenBusyIndicator, this._oMainController);

                // try to suspend updates to avoid flicker
                var oBinding = this._oList.getBinding("items");
                oBinding.bSuspended = true;

                /*eslint-disable */
                var that = this;
                this._oList.addEventDelegate({
                    onAfterRendering: function() {

                          if(that.getComponent().oList){
                        that.getComponent().oList.getItems().forEach(function(oItem){

                            var oIconCell =  oItem.getCells()[1];
                            var Status = oItem.getModel().getObject(oItem.getBindingContextPath()).Completed;
                    if(oIconCell){
                                if (Status === "E") {
                                    oIconCell.setSrc("sap-icon://message-error");
                                    oIconCell.removeStyleClass("statusIcon");
                                    oIconCell.removeStyleClass("acklNoShowNavIcon1");
                                    oIconCell.addStyleClass("ackErrorstatusIcon");
                                } else if (Status === "S") {
                                    oIconCell.setSrc("sap-icon://accept");
                                    oIconCell.removeStyleClass("ackErrorstatusIcon");
                                    oIconCell.removeStyleClass("acklNoShowNavIcon1");
                                    oIconCell.addStyleClass("statusIcon");

                                } else {
                                    oIconCell.removeStyleClass("ackErrorstatusIcon");
                                    oIconCell.addStyleClass("acklNoShowNavIcon1");
                                    oIconCell.removeStyleClass("statusIcon");
                                }
                            }
                        });
                    }

                    }
                });
            },
            /*eslint-enable */

            onAfterRendering: function() {

            },

            formatIcon: function(status) {
                var icon;
                if (status === 'S') {
                    icon = 'sap-icon://accept';
                } else if (status === 'E') {
                    icon = 'sap-icon://message-error';
                }

                return icon;

            }

        });
    });