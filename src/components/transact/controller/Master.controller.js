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
    /*eslint-disable */
    function(BaseController, Dialog, TextView, RowRepeaterFilter, RowRepeaterSorter, Sorter, Filter, FilterOperator, Button) {
        "use strict";
        return BaseController.extend("aklc.cm.components.transact.controller.Master", {
            _sTRANSACTIONCollection: "RelatedTransaction",
            _sRelated_Transaction_Id: "relatedTransaction",
            _sUpdate: "UPDATE",
            _sCreate: "CREATE",
            _sFilterFrag: "aklc.cm.components.transact.fragments.Filter",
            _sChannelId: "transaction",
            _oMainController: "",
            /**
             * on Init
             * @param  {object} oEvent event object
             */             
            onInit: function(oEvent) {
                BaseController.prototype.onInit.apply(this);

                this.oBundle = this.getComponent().getModel("i18n").getResourceBundle();
                this.oRelated_Transaction = this.oView.byId(this._sRelated_Transaction_Id);
                this.oComponent = this.getOwnerComponent();
                var that = this;


                if (!this.oTemplate) {
                    this.oTransactionTemplate = this.byId("RowTransactionTmpl").clone();
                    this._rowRepeatConfig();

                    var fnOnClick = function(oEvent) {
                        var oCreateMode = this.oComponent._oViewModel.getProperty("/CreateMode");
                        if (oCreateMode === false) {
                            that._oModel.deleteCreatedEntry(that._oContext);
                        }

                        //Higlight selected row in the list
                        var sSelectedRowId = jQuery(oEvent.target).closest(".npcRowRepeat").attr("id");
                        var oSelectedRow;

                        this.oRelated_Transaction.getRows().forEach(function(oRow, index) {
                            var bSelected = sSelectedRowId === oRow.getId();
                            oRow.toggleStyleClass("npcSelectedRow", bSelected); //Remove highlighted class

                            if (bSelected) {
                                oSelectedRow = oRow;
                            }
                        });

                        this.onRowSelect(oSelectedRow.getBindingContext(), this._sUpdate);
                        this.oComponent._oViewModel.setProperty("/CreateMode", true); //Make Add button enabled

                    }.bind(this);

                    this.oTransactionTemplate.addEventDelegate({
                        onclick: fnOnClick
                    });

                    this.oTransactionTemplate.addEventDelegate({
                        onAfterRendering: function() {
                            var oFirstRow = that.oRelated_Transaction.getRows()[0].getId();
                            var oStyle = that.oRelated_Transaction.getRows()[0].aCustomStyleClasses.indexOf("npcSelectedRow");

                            if (oFirstRow && oStyle === -1) {
                                $("#" + oFirstRow).trigger("click");
                            }
                        }
                    });
                }
            },

            _rowRepeatConfig: function() {
                var oSorter1 = new RowRepeaterSorter("subject", {
                    text: this.oBundle.getText("SUBJECT_TXT"),
                    sorter: new Sorter("ApplicationText"),
                    tooltip: this.oBundle.getText("SORT_BY_SUBJECT")
                });

                var oSorter2 = new RowRepeaterSorter("Status", {
                    text: this.oBundle.getText("STATUS_TXT"),
                    sorter: new Sorter("StatusText"),
                    tooltip: this.oBundle.getText("SORT_BY_STATUS")
                });

                this.oRelated_Transaction.addSorter(oSorter1);
                this.oRelated_Transaction.addSorter(oSorter2);
            },

            onHandleConfirm: function(oEvent) {
                if (oEvent.getParameters().filterString) {
                    var filterItems = oEvent.getParameter("filterItems");

                    this.aFilterBy = [];
                    this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));

                    filterItems.forEach(function(item, index) {
                        if (item.getId().indexOf("status") > -1) {
                            this.aFilterBy.push(new Filter("StatusText", FilterOperator.EQ, item.getProperty("text")));
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

                this.bindRows();
            },

            bindRows: function() {

                this._oMainController.setScreenBusyIndicator();
                this.oRelated_Transaction.bindAggregation("rows", {
                    path: "/" + this._sTRANSACTIONCollection,
                    sorter: this.oSorter,
                    parameters: {},
                    template: this.oTransactionTemplate,
                    filters: this.aFilterBy
                });

                // Attach listener for OData request & completed to manage busy indicator
                this.oRelated_Transaction.getBinding("rows").attachEvent("dataRequested", this._oMainController.setScreenBusyIndicator, this._oMainController);
                this.oRelated_Transaction.getBinding("rows").attachEvent("dataReceived", this._oMainController.removeScreenBusyIndicator, this._oMainController);

            },


            onAfterRendering: function() {},

            removeHiglightedRows: function() {
                var rows = this.oView.byId(this._sRelated_Transaction_Id).getRows();

                rows.forEach(function(oRow, index) {
                    oRow.toggleStyleClass("npcSelectedRow", false); //Remove highlighted class
                });
            },

            onRowSelect: function(oContext, sAction) {
                this.getEventBus().publish(this._sChannelId, "refreshTransactionForm", {
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
                        title: this.oBundle.getText("TRANSACTION_DELETE_TITLE"),
                        modal: true,
                        showCloseButton: false
                    });

                    var oTextView = new TextView({
                        text: this.oBundle.getText("TRANSACTION_DELETE") //TODO bundle
                    });

                    var fnClose = function(oEvent) {
                        this.oDeleteDialog.close();

                        if (oEvent.getSource().getId() === "YesBtn") {

                            // Set Busy Indicator
                            this.getView().getParent().setBusyIndicatorDelay(0);
                            this.getView().getParent().setBusy(true);

                            this._oModel.remove(this.sDeletePath, {

                                success: function(oEvent) {

                                    // Remove the busy Indicator
                                    oController.getView().getParent().setBusy(false);

                                    jQuery.sap.log.info("Deleted existing Transaction");
                                },
                                error: function(oEvent) {

                                    // Remove the busy Indicator
                                    oController.getView().getParent().setBusy(false);
                                    jQuery.sap.log.error("Error Delete existing Transaction");
                                }
                            });
                        }
                    }.bind(this);

                    this.oDeleteDialog.addContent(oTextView);

                    this.oDeleteDialog.addButton(new Button("YesBtn", {
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
                    ApplicationKey: this.Formatter.newGuid(),
                    OrderTypeText: "CRM Service Request",
                    OrderType: "BUS2000223"
                };

                // create entry
                var oContext = this._oModel.createEntry(
                    this._sTRANSACTIONCollection, {
                        properties: oProperties
                    }
                );
                this._oContext = oContext;

                this.onRowSelect(oContext, this._sCreate);
            },

            onResetFilters: function(oEvent) {
                this.aFilterBy = [];
                this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));

                this.bindRows();

                if (this._oFilterDialog) {
                    this._oFilterDialog.destroy();
                    this._oFilterDialog = null;
                }

                this.getEventBus().publish(this._sChannelId, "refreshTransactionForm", { //Clear form
                    context: null,
                    action: null
                });
            },

            onFilter: function(oEvent) {

                var that = this;

                if (!this._oFilterDialog) {
                    this._oFilterDialog = sap.ui.xmlfragment(this._sFilterFrag, this);

                    this.aFilterBy = [];
                    this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));

                    this._oFilterDialog.setModel(this._oModel);

                    this._oFilterDialog.setModel(this.getComponent().getModel("i18n"), "i18n");

                    var items = this._oFilterDialog.getFilterItems();

                    items.forEach(function(item, index) {
                        if (item.getId() === "status") {
                            that._oFilterDialog.getFilterItems()[index].bindAggregation("items", {
                                path: "/VH_TransactionStatus",
                                sorter: null,
                                parameters: {},
                                template: new sap.m.ViewSettingsItem({
                                    text: "{StatusText}",
                                    key: "{Status}"
                                }),
                                filters: that.aFilterBy
                            });
                        }
                    });
                }

                this._oFilterDialog.open();
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
            }
        });
    });
