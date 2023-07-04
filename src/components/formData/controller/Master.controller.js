sap.ui.define(["aklc/cm/library/common/controller/BaseController"

    ],
    function(BaseController) {
        "use strict";
        return BaseController.extend("aklc.cm.components.formData.controller.Master", {
            _sSubStepsCollection: "/SubSteps", // SubSteps collection
            _sFormDataCollection: "FormData", // FormData Collection
            _sFormDataLookupCollection: "/FormDataLookup", // FormData Lookup collection
            _sStepKey: "", // Current step key
            _oMainController: "",
            _oListSelector: "",
            /**
             * on Init
             * 
             */
            onInit: function() {
                BaseController.prototype.onInit.apply(this);
                var oListSelector = this.getComponent().oListSelector;
                this._oListSelector = oListSelector;
                this._oList = this.byId("list");
                this.oTemplate = this.byId("listItem").clone();

                oListSelector.setBoundMasterList(this._oList);
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

                // 
                if (this._oListSelector.bMainResolve === false) {

                    this.aFilterBy = [];
                    this.aFilterBy.push(new sap.ui.model.Filter("StepKey", sap.ui.model.FilterOperator.EQ, this._sStepKey));

                    this._oMainController.setScreenBusyIndicator();
                    this._oList.bindAggregation("items", {
                        path: this._sSubStepsCollection,
                        sorter: null,
                        parameters: {
                            expand: this._sFormDataCollection + this._sFormDataLookupCollection
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
                }

                this._oListSelector.bMainResolve = false;

                /*eslint-disable */
                var that = this;
                /*eslint-enable */
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

            formatIcon: function(status) {
                var icon;
                if (status === "S") {
                    icon = "sap-icon://accept";
                } else if (status === "E") {
                    icon = "sap-icon://message-error";
                }

                return icon;

            }
        });
    });