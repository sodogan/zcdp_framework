sap.ui.define(["aklc/cm/library/common/controller/BaseController",
        "sap/ui/commons/Dialog",
        "sap/ui/commons/TextView",
        "sap/ui/commons/RowRepeaterFilter",
        "sap/ui/commons/RowRepeaterSorter",
        "sap/ui/model/Sorter",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/m/MessageToast",
        "sap/ui/commons/Button"
    ],
    /*eslint-disable */
    function(BaseController, Dialog, TextView, RowRepeaterFilter, RowRepeaterSorter, Sorter, Filter, FilterOperator, MessageToast, Button) {
        "use strict";
        return BaseController.extend("aklc.cm.components.property.controller.Master", {
            _sPROPERTYCollection: "AdditionalProperty",
            _sAdditionalPropertyId: "additionalProperties",
            _sPrimaryPropertyId: "primaryProperties",
            _sUpdate: "UPDATE",
            _sCreate: "CREATE",
            _sFilterFrag: "aklc.cm.components.property.fragments.Filter",
            _sChannelId: "property",
            _oMainController: "",
    /*eslint-enable */            
            /**
             * on Init
             *
             */
            onInit: function() {
                BaseController.prototype.onInit.apply(this);

                this.oBundle = this.getComponent().getModel("i18n").getResourceBundle();
                this.oAdditionalProperty = this.oView.byId(this._sAdditionalPropertyId);
                this.oPrimaryProperty = this.oView.byId(this._sPrimaryPropertyId);
                this.oComponent = this.getOwnerComponent();
                var oController = this;

                if (!this.oTemplate) {
                    this.oPrimaryTemplate = this.byId("RowPrimaryTmpl").clone();
                    this.oAdditionalTemplate = this.byId("RowAdditionalTmpl").clone();
                    this._rowRepeatConfig();

                    var fnOnClick = function(oEvent) {
                         var oCreateMode = this.oComponent._oViewModel.getProperty("/CreateMode");
                        if (oCreateMode === false) {
                            oController._oModel.deleteCreatedEntry(oController._oContext);
                        }

                        //Higlight selected row in the list
                        var sSelectedRowId = jQuery(oEvent.target).closest(".npcRowRepeat").attr("id");
                        var oSelectedRow;

                        if (sSelectedRowId.indexOf("primaryProperties") > -1) {
                            this.removeAdditionalHighlighted();

                            this.oPrimaryProperty.getRows().forEach(function(oRow) {
                                var bSelected = sSelectedRowId === oRow.getId();
                                oRow.toggleStyleClass("npcSelectedRow", bSelected); //Remove highlighted class

                                if (bSelected) {
                                    oSelectedRow = oRow;
                                }
                            });
                        } else {
                            this.removePrimaryHighlighted();

                            this.oAdditionalProperty.getRows().forEach(function(oRow) {
                                var bSelected = sSelectedRowId === oRow.getId();
                                oRow.toggleStyleClass("npcSelectedRow", bSelected); //Remove highlighted class

                                if (bSelected) {
                                    oSelectedRow = oRow;
                                }
                            });
                        }

                        this.onRowSelect(oSelectedRow.getBindingContext(), this._sUpdate);
                        this.oComponent._oViewModel.setProperty("/CreateMode", true); //Make Add button enabled
                    }.bind(this);

                    this.oAdditionalTemplate.addEventDelegate({
                        onclick: fnOnClick
                    });

                    this.oPrimaryTemplate.addEventDelegate({
                        onclick: fnOnClick
                    });

                     this.oPrimaryTemplate.addEventDelegate({
                        onAfterRendering: function() {
                            var oFirstRow = oController.oPrimaryProperty.getRows()[0].getId();
                            var oStyle = oController.oPrimaryProperty.getRows()[0].aCustomStyleClasses.indexOf("npcSelectedRow");

                            if (oFirstRow && oStyle === -1) {
                                $("#" + oFirstRow).trigger("click");
                            }
                        }
                    });

                }
            },

            _rowRepeatConfig: function() {
                var oSorter1 = new RowRepeaterSorter("legalDescription", {
                    text: this.oBundle.getText("LEGAL_DESC_TXT"),
                    sorter: new Sorter("LegalDescription"),
                    tooltip: this.oBundle.getText("SORT_BY_LEGAL_DESC")
                });

                var oSorter2 = new RowRepeaterSorter("address", {
                    text: this.oBundle.getText("ADDRESS_TXT"),
                    sorter: new Sorter("Address"),
                    tooltip: this.oBundle.getText("SORT_BY_ADDRESS")
                });

                var oSorter3 = new RowRepeaterSorter("owner", {
                    text: this.oBundle.getText("OWNER_TXT"),
                    sorter: new Sorter("Owner"),
                    tooltip: this.oBundle.getText("SORT_BY_OWNER")
                });

                this.oAdditionalProperty.addSorter(oSorter1);
                this.oAdditionalProperty.addSorter(oSorter2);
                this.oAdditionalProperty.addSorter(oSorter3);
            },

            onHandleConfirm: function(oEvent) {
                if (oEvent.getParameters().filterString) {
                    var filterItems = oEvent.getParameter("filterItems");

                    this.aFilterBy = [];
                    this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));

                    filterItems.forEach(function(item) {
                        if (item.getId().indexOf("reason") > -1) {
                            this.aFilterBy.push(new Filter("ReasonCode", FilterOperator.EQ, item.getProperty("key")));
                        } else if (item.getId().indexOf("adjustment") > -1) {
                            this.aFilterBy.push(new Filter("AdjustmentCode", FilterOperator.EQ, item.getProperty("key")));
                        }
                    }.bind(this));

                    this.bindAdditionalRows();
                }
            },

            rowRepeatSort: function(oEvent) {
                // Set the Busy Indicator
                this.oAdditionalProperty.setBusyIndicatorDelay(0);
                this.oAdditionalProperty.setBusy(true);                
                var sortId = oEvent.getParameter("sorterId");
                var sorters = oEvent.getSource().getSorters();

                sorters.forEach(function(sorter) {
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

                this.oSorter = new sap.ui.model.Sorter("Address", false);
                this.bindAdditionalRows();
                this.bindPrimaryRows();
            },

            bindPrimaryRows: function() {

                this._oMainController.setScreenBusyIndicator();
                this.oPrimaryProperty.bindAggregation("rows", {
                    path: "/" + this._sPROPERTYCollection,
                    sorter: this.oSorter,
                    parameters: {},
                    template: this.oPrimaryTemplate,
                    filters: this.aFilterBy
                });

            // Attach listener for OData request & completed to manage busy indicator
            this.oPrimaryProperty.getBinding("rows").attachEvent("dataRequested", this._oMainController.setScreenBusyIndicator, this._oMainController);
            this.oPrimaryProperty.getBinding("rows").attachEvent("dataReceived", this._oMainController.removeScreenBusyIndicator, this._oMainController);

            },

            bindAdditionalRows: function() {

                // Set the Indicator
                this.oAdditionalProperty.setBusyIndicatorDelay(0);
                this.oAdditionalProperty.setBusy(true);
                this._oMainController.setScreenBusyIndicator();
                this.oAdditionalProperty.bindAggregation("rows", {
                    path: "/" + this._sPROPERTYCollection,
                    sorter: this.oSorter,
                    parameters: {},
                    template: this.oAdditionalTemplate,
                    filters: this.aFilterBy
                });
                // Attach event for Data Received
                this.oAdditionalProperty.getBinding("rows").attachDataReceived(this.handleDataReceived, this);
                // Attach listener for OData request & completed to manage busy indicator
                this.oAdditionalProperty.getBinding("rows").attachEvent("dataRequested", this._oMainController.setScreenBusyIndicator, this._oMainController);
                this.oAdditionalProperty.getBinding("rows").attachEvent("dataReceived", this._oMainController.removeScreenBusyIndicator, this._oMainController);

            },

            removeAdditionalHighlighted: function() {
                this._removeHiglightedRows(this.oAdditionalProperty);
            },

            removePrimaryHighlighted: function() {
                this._removeHiglightedRows(this.oPrimaryProperty);
            },

            _removeHiglightedRows: function(id) {
                var rows = id.getRows();

                rows.forEach(function(oRow) {
                    oRow.toggleStyleClass("npcSelectedRow", false); //Remove highlighted class
                });
            },

            onRowSelect: function(oContext, sAction) {
                this.getEventBus().publish(this._sChannelId, "refreshPropertyForm", {
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
                        title: this.oBundle.getText("PROPERTY_DELETE_TITLE"),
                        modal: true,
                        showCloseButton: false
                    });

                    var oTextView = new TextView({
                        text: this.oBundle.getText("PROPERTY_DELETE") 
                    });

                    var fnClose = function(oCloseEvent) {
                        this.oDeleteDialog.close();

                        if (oCloseEvent.getSource().getId() === "YesBtn") {

                            // Set Busy Indicator
                            this.getView().getParent().setBusyIndicatorDelay(0);
                            this.getView().getParent().setBusy(true);

                            this._oModel.remove(this.sDeletePath, {

                                success: function() {

                                    // Remove the busy Indicator
                                    oController.getView().getParent().setBusy(false);
                                    
                                    jQuery.sap.log.info("Deleted existing Property");
                                },
                                error: function() {
                                    // Remove the busy Indicator
                                    oController.getView().getParent().setBusy(false);
                                    MessageToast.show( oController.getI18NText("UpdateFailedMessage") );                                    
                                    jQuery.sap.log.error("Error Delete existing Property");
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

                this.removeAdditionalHighlighted();
                this.removePrimaryHighlighted();

                var oProperties = {
                    StepKey: this._sStepKey,
                    PropertyId: Math.floor((Math.random() * 100) + 1).toString(),
                    DateAdded: new Date(),
                    LegalDescription: "",
                    Owner: ""
                };

                // create entry
                var oContext = this._oModel.createEntry(
                    this._sPROPERTYCollection, {
                        properties: oProperties
                    }
                );
                this._oContext = oContext;
                this.onRowSelect(oContext, this._sCreate);
            },

            onResetFilters: function() {
                this.aFilterBy = [];
                this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));

                this.bindAdditionalRows();

                if (this._oFilterDialog) {
                    this._oFilterDialog.destroy();
                    this._oFilterDialog = null;
                }

                this.getEventBus().publish(this._sChannelId, "refreshPropertyForm", { //Clear form
                    context: null,
                    action: null
                });
            },

            /**
             * Disables busy indicator for product results table when request for data is completed
             * 
             * @public
             */
            handleDataReceived: function() {
                // Remove busy indicator
                this.oAdditionalProperty.setBusy(false);
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
