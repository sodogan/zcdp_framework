sap.ui.define(["aklc/cm/library/common/controller/BaseController",
        "sap/ui/commons/Dialog",
        "sap/ui/commons/TextView",
        "sap/ui/commons/RowRepeaterFilter",
        "sap/ui/commons/RowRepeaterSorter",
        "sap/ui/model/Sorter",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/commons/Button"
    ],
    function(BaseController, Dialog, TextView, RowRepeaterFilter, RowRepeaterSorter, Sorter, Filter, FilterOperator, Button) {
        "use strict";
        return BaseController.extend("aklc.cm.components.sla.controller.Master", {
            _sSLACollection: "SlaExtensions",/*eslint-disable */
            _sSLA_ID: "slas",
            _sUpdate: "UPDATE",
            _sCreate: "CREATE",
            _sFilterFrag: "aklc.cm.components.sla.fragments.Filter",

            _sAdjustCode_INCR: "INCR",
            _sChannelId: "sla",
            _oMainController: "",
            /**
             * on Init
             * @param  {object} oEvent event object
             */
            onInit: function() {
                BaseController.prototype.onInit.apply(this);
                this.oBundle = this.getComponent().getModel("i18n").getResourceBundle();
                this.oSLAS = this.oView.byId(this._sSLA_ID);
                this.oComponent = this.getOwnerComponent();
                var that = this;

                if (!this.oTemplate) {
                    this.oTemplate = this.byId("RowTmpl").clone();
                    this._rowRepeatConfig();

                    var fnOnClick = function(oEvent) {
                        var oCreateMode = this.oComponent._oViewModel.getProperty("/CreateMode");
                        if (oCreateMode === false) {
                            that._oModel.deleteCreatedEntry(that._oContext);
                        }

                        //Higlight selected row in the list
                        var sSelectedRowId = jQuery(oEvent.target).closest(".npcRowRepeat").attr("id");
                        var oSelectedRow;

                        this.oSLAS.getRows().forEach(function(oRow, index) {
                            var bSelected = sSelectedRowId === oRow.getId();
                            oRow.toggleStyleClass("npcSelectedRow", bSelected); //Remove highlighted class

                            if (bSelected) {
                                oSelectedRow = oRow;
                            }
                        });

                        this.onRowSelect(oSelectedRow.getBindingContext(), this._sUpdate);
                        this.oComponent._oViewModel.setProperty("/CreateMode", true); //Make Add button enabled
                    }.bind(this);

                    this.oTemplate.addEventDelegate({
                        onclick: fnOnClick
                    });

                    this.oTemplate.addEventDelegate({
                        onAfterRendering: function() {
                            var oFirstRow = that.oSLAS.getRows()[0].getId();
                            var oStyle = that.oSLAS.getRows()[0].aCustomStyleClasses.indexOf("npcSelectedRow");

                            if (oFirstRow && oStyle === -1) {
                                $("#" + oFirstRow).trigger("click");
                            }
                        }
                    });
                }
            },

            _rowRepeatConfig: function() {
                var oSorter1 = new RowRepeaterSorter("reasonCode", {
                    text: this.oBundle.getText("REASON_TXT"),
                    sorter: new Sorter("ReasonText"),
                    tooltip: this.oBundle.getText("SORT_BY_REASON")
                });

                var oSorter2 = new RowRepeaterSorter("adjustmentCode", {
                    text: this.oBundle.getText("ADJUSTMENT_DIRECTION_TXT"),
                    sorter: new Sorter("AdjustmentText"),
                    tooltip: this.oBundle.getText("SORT_BY_ADJUSTMENT")
                });

                var oSorter3 = new RowRepeaterSorter("duration", {
                    text: this.oBundle.getText("DAYS_ADJUSTED"),
                    sorter: new Sorter("Duration"),
                    tooltip: this.oBundle.getText("SORT_BY_DURATION")
                });

                this.oSLAS.addSorter(oSorter1);
                this.oSLAS.addSorter(oSorter2);
                this.oSLAS.addSorter(oSorter3);
            },

            onFilter: function() {

                var that = this;

                if (!this._oFilterDialog) {
                    this._oFilterDialog = sap.ui.xmlfragment(this._sFilterFrag, this);

                    this.aFilterBy = [];
                    this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));
                    this._oFilterDialog.setModel(this._oModel);

                    this._oFilterDialog.setModel(this.getComponent().getModel("i18n"), "i18n");

                    var items = this._oFilterDialog.getFilterItems();

                    items.forEach(function(item, index) {
                        if (item.getId() === "reason") {
                            that._oFilterDialog.getFilterItems()[index].bindAggregation("items", {
                                path: "/VH_ReasonCode",
                                sorter: null,
                                parameters: {},
                                template: new sap.m.ViewSettingsItem({
                                    text: "{ReasonText}",
                                    key: "{ReasonCode}"
                                }),
                                filters: that.aFilterBy
                            });
                        } else if (item.getId() === "adjustment") {
                            that._oFilterDialog.getFilterItems()[index].bindAggregation("items", {
                                path: "/VH_SlaDirection",
                                sorter: null,
                                parameters: {},
                                template: new sap.m.ViewSettingsItem({
                                    text: "{AdjustmentText}",
                                    key: "{AdjustmentCode}"
                                }),
                                filters: that.aFilterBy
                            });
                        }
                    });
                }

                this._oFilterDialog.open();
            },

            onHandleConfirm: function(oEvent) {
                if (oEvent.getParameters().filterString) {
                    var filterItems = oEvent.getParameter("filterItems");

                    this.aFilterBy = [];
                    this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));

                    filterItems.forEach(function(item, index) {
                        if (item.getId().indexOf("reason") > -1) {
                            this.aFilterBy.push(new Filter("ReasonCode", FilterOperator.EQ, item.getProperty("key")));
                        } else if (item.getId().indexOf("adjustment") > -1) {
                            this.aFilterBy.push(new Filter("AdjustmentCode", FilterOperator.EQ, item.getProperty("key")));
                        }
                    }.bind(this));

                    this.bindRows();
                }
            },

            rowRepeatSort: function(oEvent) {
                var sortId = oEvent.getParameter("sorterId");
                var sorters = oEvent.getSource().getSorters();

                sorters.forEach(function(sorter, index) {
                    if (sorter.getId() === sortId) {
                        sorter.getSorter().bDescending = !sorter.getSorter().bDescending;
                    }
                });
            },

            onContextChanged: function(sChannel, sEvent, oData) {

                this._oMainController = oData.controller;
                this._sStepKey = this._oModel.getProperty("StepKey", oData.context);
                this.aFilterBy = [];
                this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));
                this.oSorter = new sap.ui.model.Sorter("CreatedAt", true);
                this.bindRows();
            },

            bindRows: function() {

                this._oMainController.setScreenBusyIndicator();
                this.oSLAS.bindAggregation("rows", {
                    path: "/" + this._sSLACollection,
                    sorter: this.oSorter,
                    parameters: {},
                    template: this.oTemplate,
                    filters: this.aFilterBy
                });

                // Attach listener for OData request & completed to manage busy indicator
                this.oSLAS.getBinding("rows").attachEvent("dataRequested", this._oMainController.setScreenBusyIndicator, this._oMainController);
                this.oSLAS.getBinding("rows").attachEvent("dataReceived", this._oMainController.removeScreenBusyIndicator, this._oMainController);

            },

            onAfterRendering: function() {},

            removeHiglightedRows: function() {
                var rows = this.oView.byId(this._sSLA_ID).getRows();

                rows.forEach(function(oRow, index) {
                    oRow.toggleStyleClass("npcSelectedRow", false); //Remove highlighted class
                });
            },

            onRowSelect: function(oContext, sAction) {
                this.getEventBus().publish(this._sChannelId, "refreshSLAForm", {
                    context: oContext,
                    action: sAction
                });
            },

            onDeleteRow: function(oEvent) {

                var oController = this;

                this.sDeletePath = oEvent.getSource().getBindingContext().getPath();

                if (!this.oDeleteDialog) {
                    this.oDeleteDialog = new Dialog({
                        resizable: false,
                        title: this.oBundle.getText("SLA_DELETE_TITLE"),
                        modal: true,
                        showCloseButton: false
                    });

                    var oTextView = new TextView({
                        text: this.oBundle.getText("SLA_DELETE") 
                    });

                    var fnClose = function(oEvent) {     
                        this.oDeleteDialog.close();

                        if (oEvent.getSource().getId() === "YesBtn") {

                            // Set Busy Indicator
                            this.getView().getParent().setBusyIndicatorDelay(0);
                            this.getView().getParent().setBusy(true);

                            this._oModel.remove(this.sDeletePath, {

                                success: function() {

                                    // Remove the busy Indicator
                                    oController.getView().getParent().setBusy(false);
                                    jQuery.sap.log.info("Deleted existing SLA");
                                },
                                error: function() {
                                    // Remove the busy Indicator
                                    oController.getView().getParent().setBusy(false);
                                    jQuery.sap.log.error("Error Delete existing SLA");
                                }
                            });
                        }
                    }.bind(this);

                    this.oDeleteDialog.addContent(oTextView);

                    this.oDeleteDialog.addButton(new Button({
                        text: this.oBundle.getText("YES_TXT"),
                        press: fnClose
                    }));

                    this.oDeleteDialog.addButton(new Button({
                        text: this.oBundle.getText("NO_TXT"),
                        press: fnClose
                    }));
                }

                this.oDeleteDialog.open();
            },

            onAddRow: function() {
                this.oComponent._oViewModel.setProperty("/CreateMode", false); //Make Add button disabled

                this.removeHiglightedRows();

                var oProperties = {
                    StepKey: this._sStepKey,
                    RecordId: this.Formatter.newGuid(),
                    ReasonCode: "",
                    AdjustmentCode: this._sAdjustCode_INCR,
                    CreatedAt: new Date()
                };

                // create entry
                var oContext = this._oModel.createEntry(
                    this._sSLACollection, {
                        properties: oProperties
                    }
                );

                this._oContext = oContext;

                this.onRowSelect(oContext, this._sCreate);
            },

            onResetFilter: function() {
                this.aFilterBy = [];
                this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));

                this.bindRows();

                if (this._oFilterDialog) {
                    this._oFilterDialog.destroy();
                    this._oFilterDialog = null;
                }

                this.getEventBus().publish(this._sChannelId, "refreshSLAForm", { //Clear form
                    context: null,
                    action: null
                });
            }
        });
    });
