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
        return BaseController.extend("aklc.cm.components.notes.controller.Master", {
            _sNotesCollection: "Notes",
            _sUpdate: "UPDATE",
            _sCreate: "CREATE",
            _sFilterFrag: "aklc.cm.components.notes.fragments.Filter",
            _sChannelId: "notes",
            _oMainController: "",
            /**
             * on Init
             * @param  {object} oEvent event object
             */
            onInit: function(oEvent) {
                BaseController.prototype.onInit.apply(this);
                this.oNotes = this.oView.byId("notes");
                this.oBundle = this.getComponent().getModel("i18n").getResourceBundle();
                this.oComponent = this.getOwnerComponent();
                this.oComponent.oNotesMainController = this;
                this.oComponent.oNotesRepeater = this.oNotes;
                this._rowRepeatConfig();
                /*eslint-disable */
                var that = this;

                if (!this.oTemplate) {
                    this.oTemplate = this.byId("RowTemp").clone();

                    var fnOnClick = function(oEvent) { // eslint-disable-line no-use-before-define
                        var oCreateMode = this.oComponent._oViewModel.getProperty("/CreateMode");
                        if (oCreateMode === false) {
                            that._oModel.deleteCreatedEntry(that._oContext);
                        }
                        /*eslint-enable */

                        //Higlight selected row in the list
                        var sSelectedRowId = jQuery(oEvent.target).closest(".npcRowRepeat").attr("id");
                        var oSelectedRow;

                        this.oNotes.getRows().forEach(function(oRow, index) {
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
                            var oFirstRow = that.oNotes.getRows()[0].getId();
                            var oStyle = that.oNotes.getRows()[0].aCustomStyleClasses.indexOf("npcSelectedRow");
                            var oUpdate = that.oComponent._oViewModel.getProperty("/UpdateBtn_Visible");
                            if (oFirstRow && oStyle === -1 && oUpdate == false) {
                                $("#" + oFirstRow).trigger("click");
                            }
                        }
                    });
                }

            },
            removeHiglightedRows: function() {
                var rows = this.oView.byId("notes").getRows();

                rows.forEach(function(oRow, index) {
                    oRow.toggleStyleClass("npcSelectedRow", false); //Remove highlighted class
                });
            },
            onRowSelect: function(oContext, sAction) {
                this.getEventBus().publish(this._sChannelId, "refreshNotesForm", {
                    context: oContext,
                    action: sAction
                });
            },

            onContextChanged: function(sChannel, sEvent, oData) {

                this._oMainController = oData.controller;
                this._sStepKey = this._oModel.getProperty("StepKey", oData.context);
                this.aFilterBy = [];

                this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));
                this.oComponent._setViewModelProperty("UpdateBtn_Visible", false);

                this.bindRows();
            },
            _rowRepeatConfig: function() {

                var oTitle = new sap.ui.core.Title({
                    text: "Filter By:"
                });
                this.oNotes.setTitle(oTitle);

                var oFilter1 = new RowRepeaterFilter("Critical", {
                    text: "Critical",
                    filters: [new Filter("ImpactDesc", FilterOperator.EQ, "Critical")]

                });

                var oFilter2 = new RowRepeaterFilter("Urgent", {
                    text: "Urgent",
                    filters: [new Filter("ImpactDesc", FilterOperator.EQ, "Urgent")]

                });

                var oFilter3 = new RowRepeaterFilter("Normal", {
                    text: "Normal",
                    filters: [new Filter("ImpactDesc", FilterOperator.EQ, "Normal")]
                });

                this.oNotes.addFilter(oFilter1);
                this.oNotes.addFilter(oFilter2);
                this.oNotes.addFilter(oFilter3);

                var oSorter1 = new RowRepeaterSorter("Priority", {
                    text: this.oBundle.getText("PRIORITY_TXT"),
                    sorter: new Sorter("Impact", "1")
                });

                var oSorter2 = new RowRepeaterSorter("DateSystem", {
                    text: this.oBundle.getText("DATE_TXT"),
                    sorter: new Sorter("DateSystem")
                });

                var oSorter3 = new RowRepeaterSorter("TextType", {
                    text: this.oBundle.getText("TYPE_TXT"),
                    sorter: new Sorter("TextType")
                });
                var oSorter4 = new RowRepeaterSorter("Subject", {
                    text: this.oBundle.getText("SUBJECT_TXT"),
                    sorter: new Sorter("Subject")
                });

                this.oNotes.addSorter(oSorter1);
                this.oNotes.addSorter(oSorter2);
                this.oNotes.addSorter(oSorter3);
                this.oNotes.addSorter(oSorter4);

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
            onFilter: function(oEvent) {

                var that = this;
                /*eslint-enable */

                if (!this._oFilterDialog) {
                    this._oFilterDialog = sap.ui.xmlfragment(this._sFilterFrag, this);

                    this.aFilterBy = [];
                    this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));
                    this._oFilterDialog.setModel(this._oModel);

                    this._oFilterDialog.setModel(this.getComponent().getModel("i18n"), "i18n");

                    var items = this._oFilterDialog.getFilterItems();

                    items.forEach(function(item, index) {
                        if (item.getId() === "notesImpactFilter") {
                            that._oFilterDialog.getFilterItems()[index].bindAggregation("items", {
                                path: "/VH_NotesImpact",
                                sorter: null,
                                parameters: {},
                                template: new sap.m.ViewSettingsItem({
                                    text: "{Description}",
                                    key: "{Impact}"
                                }),
                                filters: that.aFilterBy
                            });
                        } else if (item.getId() === "notesTypeFilter") {
                            that._oFilterDialog.getFilterItems()[index].bindAggregation("items", {
                                path: "/VH_NotesType",
                                sorter: null,
                                parameters: {},
                                template: new sap.m.ViewSettingsItem({
                                    text: "{TextType}",
                                    key: "{TextId}"
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
                        if (item.getId().indexOf("notesImpactFilter") > -1) {
                            this.aFilterBy.push(new Filter("Impact", FilterOperator.EQ, item.getProperty("key")));
                        } else if (item.getId().indexOf("notesTypeFilter") > -1) {
                            this.aFilterBy.push(new Filter("TextId", FilterOperator.EQ, item.getProperty("key")));
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

            /*eslint-disable */
            onSearch: function(oEvent) {

                var sQuery = oEvent.getSource().getValue();
                if (sQuery && sQuery.length > 0) {

                    var oRows = this.oNotes.getRows();
                    var that = this;
                    oRows.forEach(function(oRow) {
                        var oText = that.formatString(that._oModel.getContext(oRow.getBindingContext().sPath).getObject().Text);
                        var oSubject = that.formatString(that._oModel.getContext(oRow.getBindingContext().sPath).getObject().Subject);
                        var oDate = that.formatDate(that._oModel.getContext(oRow.getBindingContext().sPath).getObject().DateSystem);

                        if (oText.indexOf(sQuery) > -1 || oSubject.indexOf(sQuery) > -1 || oDate.indexOf(sQuery) > -1) {

                            oRow.setVisible(true);
                        } else {

                            oRow.setVisible(false);

                        }

                    });
                }
            },
            /*eslint-enable */

            bindRows: function() {
                var oSorter = [];
                oSorter.push(new Sorter("Impact", "1"));
                oSorter.push(new Sorter("DateSystem", "1"));

                this._oMainController.setScreenBusyIndicator();
                this.oNotes.bindAggregation("rows", {
                    path: "/" + this._sNotesCollection,
                    // sorter: oSorter,

                    parameters: {

                    },
                    template: this.oTemplate,
                    filters: this.aFilterBy
                });

                // Attach listener for OData request & completed to manage busy indicator
                this.oNotes.getBinding("rows").attachEvent("dataRequested", this._oMainController.setScreenBusyIndicator, this._oMainController);
                this.oNotes.getBinding("rows").attachEvent("dataReceived", this._oMainController.removeScreenBusyIndicator, this._oMainController);

            },
            onAddRow: function() {
                this.oComponent._oViewModel.setProperty("/CreateMode", false); //Make Add button disabled
                this.removeHiglightedRows();

                var oProperties = {
                    StepKey: this._sStepKey,
                    //TextName: this.Formatter.newGuid(),
                    DateSystem: new Date()

                };

                // create entry
                var oContext = this._oModel.createEntry(
                    this._sNotesCollection, {
                        properties: oProperties
                    }
                );
                this._oContext = oContext;
                this.onRowSelect(oContext, this._sCreate);
            },

            formatString: function(text) {
                var innerText = "";
                if (text) {

                    var obj = $.parseHTML(text);
                    obj.forEach(function(entry) {
                        innerText = innerText + " " + entry.textContent;
                    });
                    return innerText;

                }
                return text;
            },

            formatDate: function(date) {
                return this.Formatter.formatDate(date, "dd/MM/yyyy");
            }

        });
    });
