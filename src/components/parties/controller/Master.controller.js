sap.ui.define(["aklc/cm/library/common/controller/BaseController",
        "sap/ui/commons/Dialog",
        "sap/ui/commons/TextView",
        "sap/ui/commons/RowRepeaterFilter",
        "sap/ui/model/Sorter",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/commons/RowRepeaterSorter"
    ],
    function(BaseController, Dialog, TextView, RowRepeaterFilter, Sorter, Filter, FilterOperator, RowRepeaterSorter) {
        "use strict";
        return BaseController.extend("aklc.cm.components.parties.controller.Master", {
            _sPartiesCollection: "AffectedParties",
            _sUpdate: "UPDATE",
            _sCreate: "CREATE",
            _sImagesPath: "aklc.cm.components.parties.images",
            _sFilterFrag: "aklc.cm.components.parties.fragments.Filter",
            _oMainController: "",
            /*eslint-disable */
            /**
             * on Init
             */
            onInit: function() {
                BaseController.prototype.onInit.apply(this);
                this.oParties = this.oView.byId("parties");
                this.oBundle = this.getComponent().getModel("i18n").getResourceBundle();
                this.oComponent = this.getOwnerComponent();
                this._rowRepeatConfig(); //Set filter and sort features to RowRepeater
                var that = this;

                if (!this.oTemplate) {
                    this.oTemplate = this.byId("RowTemp").clone();

                    var fnOnClick = function(oEvent) {
                        var oCreateMode = this.oComponent._oViewModel.getProperty("/CreateMode");
                        if (oCreateMode === false) {
                            that._oModel.deleteCreatedEntry(that._oContext);
                        }


                        //Higlight selected row in the list
                        var sSelectedRowId = jQuery(oEvent.target).closest(".npcRowRepeat").attr("id");
                        var oSelectedRow;

                        this.oParties.getRows().forEach(function(oRow, index) {
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
                            var oFirstRow = that.oParties.getRows()[0].getId();
                            var oStyle = that.oParties.getRows()[0].aCustomStyleClasses.indexOf("npcSelectedRow");
                            var oUpdate = that.oComponent._oViewModel.getProperty("/UpdateBtn_Visible");
                            if (oFirstRow && oStyle === -1 && oUpdate == false) {
                                $("#" + oFirstRow).trigger("click");
                            }
                        }
                    });

                }
            },

            /**
             * on row repeat config event
             * set the filters and sorters here
             */
            _rowRepeatConfig: function() {
                var oTitle = new sap.ui.core.Title({
                    text: "Filter By:"
                });
                this.oParties.setTitle(oTitle);

                var oFilter1 = new RowRepeaterFilter("Owner_filter", {
                    text: "Owner",
                    filters: [new Filter("PartyType", "EQ", "OWNER")]

                });

                var oFilter2 = new RowRepeaterFilter("Occupant_filter", {
                    text: "Occupant",
                    filters: [new Filter("PartyType", "EQ", "OCCUP")]

                });

                var oFilter3 = new RowRepeaterFilter("Other_filter", {
                    text: "Other",
                    filters: [new Filter("PartyType", "EQ", "OTHER")]
                });

                this.oParties.addFilter(oFilter1);
                this.oParties.addFilter(oFilter2);
                this.oParties.addFilter(oFilter3);

                var oSorter1 = new RowRepeaterSorter("partyName", {
                    text: "Party Name",
                    sorter: new Sorter("PartnerFullName")

                });

                var oSorter2 = new RowRepeaterSorter("partyType", {
                    text: "Party Type",
                    sorter: new Sorter("PartyTypeText")

                });

                var oSorter3 = new RowRepeaterSorter("response", {
                    text: "Response",
                    sorter: new Sorter("ResponseText")
                });

                this.oParties.addSorter(oSorter1);
                this.oParties.addSorter(oSorter2);
                this.oParties.addSorter(oSorter3);
            },

            /**
             * on Context Changed is a base method called by the component, it sends context
             * @param  {string} sChannel channel ID
             * @param  {string} sEvent   event ID
             * @param  {object} oData    data object
             */
            onContextChanged: function(sChannel, sEvent, oData) {

                this._oMainController = oData.controller;
                this.sGISUrl = null;
                this._sStepKey = this._oModel.getProperty("StepKey", oData.context);
                this.aFilterBy = [];
                this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));
                this.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
                this.bindRows();

                this._sGISPath = "/" + this._oModel.createKey("ApplicationLinks", {
                    "StepKey": this._sStepKey,
                    "Component": "GIS"
                });

                var fnCallback = function(oContext) {
                    if (oContext) {
                        this.sGISUrl = oContext.getObject().Url;
                    }
                }.bind(this);

                this._oModel.createBindingContext(this._sGISPath, null, null, fnCallback, true);

            },

            //get Map icon if flag is true
            VisibilityFromGIS: function(sFromGIS) {
                if (sFromGIS === true) {
                    var oIcon = "sap-icon://map";
                    return oIcon;
                }
            },

            //get Decline icon if flag is true
            VisibilityOnDelete: function(sDeleteFlag) {
                if (sDeleteFlag === true) {
                    var oIcon = "sap-icon://decline";
                    return oIcon;
                }

            },

            /**
             * bind rows Event
             */
            bindRows: function() {

                this._oMainController.setScreenBusyIndicator();
                this.oParties.bindAggregation("rows", {
                    path: "/" + this._sPartiesCollection,
                    parameters: {

                    },
                    template: this.oTemplate,
                    filters: this.aFilterBy

                });

                // Attach listener for OData request & completed to manage busy indicator
                this.oParties.getBinding("rows").attachEvent("dataRequested", this._oMainController.setScreenBusyIndicator, this._oMainController);
                this.oParties.getBinding("rows").attachEvent("dataReceived", this._oMainController.removeScreenBusyIndicator, this._oMainController);

            },

            //remove the highlighted rows
            removeHiglightedRows: function() {
                var rows = this.oView.byId("parties").getRows();

                rows.forEach(function(oRow, index) {
                    oRow.toggleStyleClass("npcSelectedRow", false); //Remove highlighted class
                });
            },
            /*eslint-disable */
            /**
             * on row select Event
             */
            onRowSelect: function(oContext, sAction) {
                this.getEventBus().publish("parties", "refreshPartiesForm", {
                    context: oContext,
                    action: sAction
                });
            },

            /**
             * row repeat sort Event
             * apply rowrepeater sort
             * @param oEvent
             */
            rowRepeatSort: function(oEvent) {
                this.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
                var sortId = oEvent.getParameter("sorterId");
                var sorters = oEvent.getSource().getSorters();

                sorters.forEach(function(sorter, index) {
                    if (sorter.getId() === sortId) {
                        sorter.getSorter().bDescending = !sorter.getSorter().bDescending;
                    }
                });
            },

            /**
             * on addrow Event
             * used to add a new row
             */
            onAddRow: function() {
                this.oComponent._oViewModel.setProperty("/CreateMode", false); //Make Add button disabled
                this.removeHiglightedRows();

                var oProperties = {
                    StepKey: this._sStepKey,
                    RecordId: this.Formatter.newGuid(),
                    PartnerFullName: null,
                    PartyType: "OTHER",
                    PartyTypeText: "Other (Non-Property)",
                    ResponseType: "",
                    ResponseText: "Not Recorded",
                    ToBeHeard: false,
                    ResponseDate: null,
                    CanBeDeleted: true,
                    FromGIS: false

                };

                // create entry
                var oContext = this._oModel.createEntry(
                    this._sPartiesCollection, {
                        properties: oProperties
                    }
                );

                this._oContext = oContext;

                this.onRowSelect(oContext, this._sCreate);
            },

            //Add/Remove Affected Parties through GIS
            onAddGIS: function() {
                if (this.sGISUrl) {
                    window.open(this.sGISUrl, "Newwindow", "width=1400,height=900,resizable=1");
                }
            },

            // for Refresh Filter
            onResetFilter: function(oEvent) {
                this.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
                this.aFilterBy = [];
                this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));

                this.bindRows();

                if (this._oFilterDialog) { //Destroyed since no way reseting filter at code level
                    this._oFilterDialog.destroy();
                    this._oFilterDialog = null;
                }
            },

            // Delete Affected Partners
            onDeleteRow: function(oEvent) {
                var oController = this;

                this.sDeletePath = oEvent.getSource().getBindingContext().getPath();

                if (!this.oDialog) {
                    this.oDialog = new Dialog({
                        resizable: false,
                        title: this.oBundle.getText("AFFECTED_DELETE_TITLE"),
                        modal: true,
                        showCloseButton: false
                    });

                    var oTextView = new TextView({
                        text: this.oBundle.getText("AFFECTED_DELETE")
                    });

                    var fnClose = function(oEvent) {
                        this.oDialog.close();

                        if (oEvent.getSource().getId() === "YesBtnAff") {

                            // Set Busy Indicator
                            this.getView().getParent().setBusyIndicatorDelay(0);
                            this.getView().getParent().setBusy(true);

                            this._oModel.remove(this.sDeletePath, {

                                success: function(oEvent) {

                                    // Remove the busy Indicator
                                    oController.getView().getParent().setBusy(false);
                                    oController.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
                                    jQuery.sap.log.info("Deleted existing AffectedParties");
                                },
                                error: function(oEvent) {

                                    // Remove the busy Indicator
                                    oController.getView().getParent().setBusy(false);
                                    MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
                                    jQuery.sap.log.error("Error Delete existing AffectedParties");
                                }
                            });
                        }
                    }.bind(this);

                    this.oDialog.addContent(oTextView);

                    this.oDialog.addButton(new sap.ui.commons.Button({
                        id: "YesBtnAff",
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

            //Filter on Affected Parties            
            onFilter: function(oEvent) {
                this.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
                var that = this;

                if (!this._oFilterDialog) {
                    this._oFilterDialog = sap.ui.xmlfragment(this._sFilterFrag, this);

                    this.aFilterBy = [];
                    this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));
                    this._oFilterDialog.setModel(this._oModel);

                    this._oFilterDialog.setModel(this.getComponent().getModel("i18n"), "i18n");

                    var items = this._oFilterDialog.getFilterItems();

                    items.forEach(function(item, index) {
                        if (item.getId() === "ResponseFilter") {
                            that._oFilterDialog.getFilterItems()[index].bindAggregation("items", {
                                path: "/VH_Response",
                                sorter: null,
                                parameters: {},
                                template: new sap.m.ViewSettingsItem({
                                    text: "{ResponseText}",
                                    key: "{ResponseType}"
                                }),
                                filters: that.aFilterBy
                            });
                        }
                    });
                }

                this._oFilterDialog.open();
            },

            onAfterRendering: function() {

            },

            /**
             * on handle confirm event
             */
            onHandleConfirm: function(oEvent) {
                if (oEvent.getParameters().filterString) {
                    var filterItems = oEvent.getParameter("filterItems");

                    this.aFilterBy = [];
                    this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));

                    filterItems.forEach(function(item, index) {
                        if (item.getParent().getId().indexOf("ResponseFilter") > -1) {
                            this.aFilterBy.push(new Filter("ResponseType", FilterOperator.EQ, item.getProperty("key")));
                        } else if (item.getParent().getId().indexOf("ToBeHeardFilter") > -1) {
                            this.aFilterBy.push(new Filter("ToBeHeard", FilterOperator.EQ, item.getProperty("key")));
                        } else if (item.getParent().getId().indexOf("GISOrManualFilter") > -1) {
                            this.aFilterBy.push(new Filter("FromGIS", FilterOperator.EQ, item.getProperty("key")));
                        }
                    }.bind(this));



                    this.bindRows();
                }
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
