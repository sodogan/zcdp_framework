sap.ui.define(["aklc/cm/library/common/controller/BaseController",
        "sap/ui/commons/Dialog",
        "sap/ui/commons/TextView",
        "sap/ui/commons/RowRepeaterFilter",
        "sap/ui/commons/RowRepeaterSorter",
        "sap/ui/model/Sorter",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator"
    ],
    function(BaseController, Dialog, TextView, RowRepeaterFilter, RowRepeaterSorter, Sorter, Filter, FilterOperator) {
        "use strict";
        return BaseController.extend("aklc.cm.components.outcomes.controller.Master", {
            _sOutcomesCollection: "Outcomes", // path to outcomes entity
            _sUpdate: "UPDATE", // update
            _sCreate: "CREATE", //create
            _sFilterFrag: "aklc.cm.components.outcomes.fragments.Filter", // filter fragment path
            _sChannelId: "outcomes", // outcomes channel ID
            _oMainController: "",
            /**
             * on Init
             * @param  {object} oEvent event object
             */
            onInit: function(oEvent) {
                BaseController.prototype.onInit.apply(this);
                this.oOutcomes = this.oView.byId("outcomes");
                this.oBundle = this.getComponent().getModel("i18n").getResourceBundle();
                this.oComponent = this.getOwnerComponent();
                this._rowRepeatConfig();
                /*eslint-disable */                
                var oController = this;

                if (!this.oTemplate) {
                    this.oTemplate = this.byId("RowTemp").clone();

                    var fnOnClick = function(oEvents) {
                        var oCreateMode = this.oComponent._oViewModel.getProperty("/CreateMode");
                        if (oCreateMode === false) {
                            oController._oModel.deleteCreatedEntry(oController._oContext);
                        }
                        /*eslint-enable */

                        //Higlight selected row in the list
                        var sSelectedRowId = jQuery(oEvents.target).closest(".aklcOutcomesRowRepeat").attr("id");
                        // var sSelectedRowId = jQuery(oEvent.target).closest(".npcRowRepeat").attr("id");
                        var oSelectedRow;

                        this.oOutcomes.getRows().forEach(function(oRow, index) {
                            var bSelected = sSelectedRowId === oRow.getId();
                            oRow.toggleStyleClass("npcSelectedRow", bSelected); //Remove highlighted class

                            if (bSelected) {
                                oSelectedRow = oRow;
                            }
                        });

                        this.onRowSelect(oSelectedRow.getBindingContext(), this._sUpdate);
                        this.oComponent._oViewModel.setProperty("/CreateMode", true); //Make Add button disabled
                    }.bind(this);

                    this.oTemplate.addEventDelegate({
                        onclick: fnOnClick
                    });

                    this.oTemplate.addEventDelegate({
                        onAfterRendering: function() {
                            var oFirstRow = oController.oOutcomes.getRows()[0].getId();
                            var oStyle = oController.oOutcomes.getRows()[0].aCustomStyleClasses.indexOf("npcSelectedRow");

                            if (oFirstRow && oStyle === -1) {
                                $("#" + oFirstRow).trigger("click");
                            }
                        }
                    });

                }

            },

            _rowRepeatConfig: function() {
                var oSorter1 = new RowRepeaterSorter("decisionCode", {
                    text: this.oBundle.getText("DECISION_CODE_TXT"),
                    sorter: new Sorter("DecisionCodeText"),
                    tooltip: this.oBundle.getText("SORT_BY_DECISION_CODE")
                });

                var oSorter2 = new RowRepeaterSorter("decisionMaker", {
                    text: this.oBundle.getText("DECISION_MAKER_TXT"),
                    sorter: new Sorter("DecisionMakerText"),
                    tooltip: this.oBundle.getText("SORT_BY_MAKER")
                });

                var oSorter3 = new RowRepeaterSorter("decisionDate", {
                    text: this.oBundle.getText("DECISION_DATE_TXT"),
                    sorter: new Sorter("DecisionDate"),
                    tooltip: this.oBundle.getText("SORT_BY_DATE")
                });

                this.oOutcomes.addSorter(oSorter1);
                this.oOutcomes.addSorter(oSorter2);
                this.oOutcomes.addSorter(oSorter3);
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

            /*eslint-disable */
            onContextChanged: function(sChannel, sEvent, oData) {
                
                var oController = this;
                this._oMainController = oData.controller;
                this._sStepKey = this._oModel.getProperty("StepKey", oData.context);

                this.aFilterBy = [];
                this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));
                this.bindRows();
                var FilterBy = this.aFilterBy;
                this._oModel.read("/VH_DecisionMaker", {
                    filters: FilterBy,
                    success: function(oEvent) {
                        if (!oEvent.results.length) {
                            oController.oComponent._oViewModel.setProperty("/DecisionMaker_Visible", false);
                        }
                    },
                    error: function() {
                        jQuery.sap.log.error("Error in fetching Decision Maker value");
                    }
                });

            },

            onFilter: function(oEvent) {
                
                var oController = this;
                if (!this._oFilterDialog) {
                    this._oFilterDialog = sap.ui.xmlfragment(this._sFilterFrag, this);
                    /*eslint-enable */

                    this.aFilterBy = [];
                    this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));
                    this._oFilterDialog.setModel(this._oModel);

                    this._oFilterDialog.setModel(this.getComponent().getModel("i18n"), "i18n");

                    /* if(!this.oComponent._oViewModel.getProperty("/DecisionMaker_Visible")){
                         this._oFilterDialog.removeFilterItem("decisionMakerFilter");
                     }*/

                    var items = this._oFilterDialog.getFilterItems();

                    items.forEach(function(item, index) {
                        if (item.getId() === "decisionCodeFilter") {
                            oController._oFilterDialog.getFilterItems()[index].bindAggregation("items", {
                                path: "/VH_DecisionCode",
                                sorter: null,
                                parameters: {},
                                template: new sap.m.ViewSettingsItem({
                                    text: "{Description}",
                                    key: "{DecisionCode}"
                                }),
                                filters: oController.aFilterBy
                            });
                        } else if (item.getId() === "decisionMakerFilter") {
                            oController._oFilterDialog.getFilterItems()[index].bindAggregation("items", {
                                path: "/VH_DecisionMaker",
                                sorter: null,
                                parameters: {},
                                template: new sap.m.ViewSettingsItem({
                                    text: "{Description}",
                                    key: "{DecisionMaker}"
                                }),
                                filters: oController.aFilterBy
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
                        if (item.getId().indexOf("decisionCodeFilter") > -1) {
                            this.aFilterBy.push(new Filter("DecisionCode", FilterOperator.EQ, item.getProperty("key")));
                        } else if (item.getId().indexOf("decisionMakerFilter") > -1) {
                            this.aFilterBy.push(new Filter("DecisionMaker", FilterOperator.EQ, item.getProperty("key")));
                        }
                    }.bind(this));

                    this.bindRows();
                }
            },

            onResetFilter: function(oEvent) {
                this.aFilterBy = [];
                this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));

                this.bindRows();

                if (this._oFilterDialog) { //Destroyed since no way reseting filter at code level
                    this._oFilterDialog.destroy();
                    this._oFilterDialog = null;
                }
            },

            bindRows: function() {

                this._oMainController.setScreenBusyIndicator();
                this.oOutcomes.bindAggregation("rows", {
                    path: "/" + this._sOutcomesCollection,
                    sorter: new sap.ui.model.Sorter("DecisionDate", true),
                    parameters: {
                        //expand: "VH_DecisionCode,VH_DecisionMaker"
                    },
                    template: this.oTemplate,
                    filters: this.aFilterBy
                });

                // Attach listener for OData request & completed to manage busy indicator
                this.oOutcomes.getBinding("rows").attachEvent("dataRequested", this._oMainController.setScreenBusyIndicator, this._oMainController);
                this.oOutcomes.getBinding("rows").attachEvent("dataReceived", this._oMainController.removeScreenBusyIndicator, this._oMainController);

            },

            onAfterRendering: function() {},

            removeHiglightedRows: function() {
                var rows = this.oView.byId("outcomes").getRows();

                rows.forEach(function(oRow, index) {
                    oRow.toggleStyleClass("npcSelectedRow", false); //Remove highlighted class
                });
            },

            onRowSelect: function(oContext, sAction) {
                this.getEventBus().publish(this._sChannelId, "refreshOutcomesForm", {
                    context: oContext,
                    action: sAction
                });
            },

            onDeleteRow: function(oEvent) {

                var oController = this;

                this.sDeletePath = oEvent.getSource().getBindingContext().getPath();

                if (!this.oDialog) {
                    this.oDialog = new Dialog({
                        resizable: false,
                        title: this.oBundle.getText("OUTCOME_DELETE_TITLE"),
                        modal: true,
                        showCloseButton: false
                    });

                    var oTextView = new TextView({
                        text: this.oBundle.getText("OUTCOME_DELETE")
                    });
                    /*eslint-disable */
                    var fnClose = function(oEvent) {
                        this.oDialog.close();

                        if (oEvent.getSource().getId() === "YesBtn") {

                            // Set Busy Indicator
                            // this.getView().getParent().setBusyIndicatorDelay(0);
                            // this.getView().getParent().setBusy(true);

                            this._oModel.remove(this.sDeletePath, {

                                success: function(oEvent) {

                                    // Remove the busy Indicator
                                    // oController.getView().getParent().setBusy(false);

                                    jQuery.sap.log.info("Deleted existing Outcomes");
                                },
                                error: function(oEvent) {

                                    // Remove the busy Indicator
                                    // oController.getView().getParent().setBusy(false);
                                    MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
                                    jQuery.sap.log.error("Error Delete existing Outcomes");
                                }
                            });
                        }
                    }.bind(this);
                    /*eslint-enable */

                    this.oDialog.addContent(oTextView);

                    this.oDialog.addButton(new sap.ui.commons.Button({
                        id: "YesBtn",
                        text: this.oBundle.getText("YES_TXT"),
                        press: fnClose
                    }));

                    this.oDialog.addButton(new sap.ui.commons.Button({
                        text: this.oBundle.getText("NO_TXT"),
                        press: fnClose
                    }));
                }

                this.oDialog.open();
            },

            onAddRow: function() {
                this.oComponent._oViewModel.setProperty("/CreateMode", false); //Make Add button disabled
                this.removeHiglightedRows();

                var oProperties = {
                    StepKey: this._sStepKey,
                    RecordId: this.Formatter.newGuid(),
                    DecisionDate: new Date(),
                    CreatedAt: new Date()
                };

                // create entry
                var oContext = this._oModel.createEntry(
                    this._sOutcomesCollection, {
                        properties: oProperties
                    }
                );

                this._oContext = oContext;

                this.onRowSelect(oContext, this._sCreate);
            },

            formatDate: function(date) {
                return this.Formatter.formatDate(date, "dd/MM/yyyy");
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
