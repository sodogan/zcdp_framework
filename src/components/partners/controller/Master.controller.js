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
        return BaseController.extend("aklc.cm.components.partners.controller.Master", {
            _sPartiesCollection: "AssignedPartners", // path of assigned partners
            _sUpdate: "UPDATE", // update
            _sCreate: "CREATE", //create
            _sImagesPath: "aklc.cm.components.partners.images", // path of images
            _sFilterFrag: "aklc.cm.components.partners.fragments.Filter", //path of filter fragment
            _oMainController: "",
            _selectedRowRepeater: "",
            _updateFlag: false,
            _createFlag: false,
            _addrnum: "",
            _partnum: "",
            _partfunc: "",
            /*eslint-disable */
            /**
             * on Init
             */
            onInit: function() {
                BaseController.prototype.onInit.apply(this);
                this.oParties = this.oView.byId("parties");
                var oScrollContainer = this.oView.byId("scrollrow");
                this.oBundle = this.getComponent().getModel("i18n").getResourceBundle();
                this.oComponent = this.getOwnerComponent();

                this._rowRepeatConfig(); //Set filter and sort features to RowRepeater
                var that = this;

                that.getEventBus().subscribe("partners", "setUpdateRow",
                function(sChannelId, sEventId, oData) {
                    that._updateFlag = oData.updateflag;
                    that._createFlag = oData.createflag;
                    that._addrnum = oData.addrnum;
                    that._partnum = oData.partnum;
                    that._partfunc = oData.partfunc;
                });

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
                        that._selectedRowRepeater = sSelectedRowId;

                        this.oParties.getRows().forEach(function(oRow, index) {
                            var bSelected = sSelectedRowId === oRow.getId();
                            oRow.toggleStyleClass("npcSelectedRow", bSelected); //Remove highlighted class

                            if (bSelected) {
                                oSelectedRow = oRow;
                            }
                        });

                        this.onRowSelect(oSelectedRow.getBindingContext(), this._sUpdate);
                        this.oComponent._setViewModelProperty("CreateMode", true);
                    }.bind(this);

                    this.oTemplate.addEventDelegate({
                        onclick: fnOnClick
                    });

                    this.oTemplate.addEventDelegate({
                        onAfterRendering: function() {
                            var oFirstRow = that.oParties.getRows()[0].getId();
                            var oStyle = that.oParties.getRows()[0].aCustomStyleClasses.indexOf("npcSelectedRow");
                            var oUpdate = that.oComponent._oViewModel.getProperty("/UpdateBtn_Visible");
                            if (oFirstRow && oStyle == -1 && oUpdate == false) {
                                if(that._selectedRowRepeater && that._updateFlag === true)
                                {
                                    $("#" + that._selectedRowRepeater).trigger("click");

                                    var  docViewTop = $(window).scrollTop();
                                    var docViewBottom = docViewTop + $(window).height();

                                    var elemTop = $('#'+that._selectedRowRepeater).offset().top;
                                    var elemBottom = elemTop + $('#'+that._selectedRowRepeater).height();

                                    //Check if scrolling required
                                    if(elemBottom > docViewBottom)
                                    {
                                        oScrollContainer.scrollToElement(document.getElementById(that._selectedRowRepeater));
                                    }

                                    that._updateFlag = false;
                                }
                                else if(that._createFlag === true)
                                {
                                    var allRows = that.oParties.getRows();
                                    var current_row;
                                    for(var iterator_i = 0; iterator_i < that.oParties.getRows().length ; iterator_i++)
                                    {
                                        current_row = allRows[iterator_i];
                                        if((that._createFlag === true) && (current_row.getBindingContext().getProperty("AddressNumber") == that._addrnum ) && (current_row.getBindingContext().getProperty("PartnerNumber") == that._partnum ) && (current_row.getBindingContext().getProperty("PartnerFunction") == that._partfunc ))
                                        {
                                            $("#" + current_row.sId).trigger("click");
                                            oScrollContainer.scrollToElement(document.getElementById(current_row.sId));
                                            break;
                                        }
                                    }
                                    that._createFlag = false;
                                }
                                else
                                {
                                    var selectedflag = false;
                                    that.oParties.getRows().forEach(function(oRow, index) {
                                        if(oRow.hasStyleClass("npcSelectedRow"))
                                        {
                                            selectedflag = true;
                                        }
                                    });
                                    if(selectedflag === false)
                                        $("#" + oFirstRow).trigger("click");
                                }
                            }
                            else if(oFirstRow && oStyle == -1 && oUpdate == true) {
                                var selectedflag = false;
                                that.oParties.getRows().forEach(function(oRow, index) {
                                    if(oRow.hasStyleClass("npcSelectedRow"))
                                    {
                                        selectedflag = true;
                                    }
                                });

                                if(selectedflag === false)
                                {
                                    // Click previously selected row
                                    $("#" + that._selectedRowRepeater).trigger("click");

                                    var  docViewTop = $(window).scrollTop();
                                    var docViewBottom = docViewTop + $(window).height();

                                    var elemTop = $('#'+that._selectedRowRepeater).offset().top;
                                    var elemBottom = elemTop + $('#'+that._selectedRowRepeater).height();
                                    //Check if scrolling required
                                    if(elemBottom > docViewBottom)
                                    {
                                        oScrollContainer.scrollToElement(document.getElementById(that._selectedRowRepeater));
                                    }
                                }
                                
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
                    text: "{i18n>FILTER_BY}"
                });
                this.oParties.setTitle(oTitle);

                var oFilter1 = new RowRepeaterFilter("active_filter", {
                    text: this.oBundle.getText("ACTIVE"),
                    filters: [new Filter("ActiveFilter", FilterOperator.EQ, "X")],
                    tooltip: this.oBundle.getText("ACTIVE_FILTER_TOOLTIP")
                });

                var oFilter2 = new RowRepeaterFilter("historic_filter", {
                    text: this.oBundle.getText("HISTORIC"),
                    filters: [new Filter("ActiveFilter", FilterOperator.NE, "X")],
                    tooltip: this.oBundle.getText("HISTORIC_FILTER_TOOLTIP")
                });

                this.oParties.addFilter(oFilter1);
                this.oParties.addFilter(oFilter2);

                var oSorter1 = new RowRepeaterSorter("firstName", {
                    text: this.oBundle.getText("FIRST_NAME"),
                    sorter: new Sorter("FirstName"),
                    tooltip: this.oBundle.getText("SORT_BY_FIRSTNAME")
                });

                var oSorter2 = new RowRepeaterSorter("lastName", {
                    text: this.oBundle.getText("LAST_NAME"),
                    sorter: new Sorter("LastName"),
                    tooltip: this.oBundle.getText("SORT_BY_LASTNAME")
                });

                var oSorter3 = new RowRepeaterSorter("partnerFunc", {
                    text: this.oBundle.getText("PARTNER_TYPE"),
                    sorter: new Sorter("PartnerFunctionText"),
                    tooltip: this.oBundle.getText("SORT_BY_PARTNRFUNC")
                });

                this.oParties.addSorter(oSorter1);
                this.oParties.addSorter(oSorter2);
                this.oParties.addSorter(oSorter3);
            },

            /**
             * on ContextChanged Event
             * @param  {object} oData    [description]
             */
            onContextChanged: function(sChannelId, sEventId, oData) {

                this._oMainController = oData.controller;
                this._sStepKey = this._oModel.getProperty("StepKey", oData.context);
                this.aFilterBy = [];

                this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));
                this.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
                this.bindRows();                       
            },

            formatStatusBar: function(sActiveFilter) {
                if (sActiveFilter === "X") {
                    return jQuery.sap.getModulePath(this._sImagesPath, "/") + "blue.png";
                } else {
                    return jQuery.sap.getModulePath(this._sImagesPath, "/") + "grey.png";
                }
            },

            /**
             * bind rows Event
             */
            bindRows: function() {

                this._oMainController.setScreenBusyIndicator();
                this.oParties.bindAggregation("rows", {
                    path: "/" + this._sPartiesCollection,
                    sorter: [new Sorter("PartnerFunctionText", false),
                        new Sorter("FirstName", false)
                    ],
                    parameters: {

                    },
                    template: this.oTemplate,
                    filters: this.aFilterBy
                });

            // Attach listener for OData request & completed to manage busy indicator
            this.oParties.getBinding("rows").attachEvent("dataRequested", this._oMainController.setScreenBusyIndicator, this._oMainController);
            this.oParties.getBinding("rows").attachEvent("dataReceived", this._oMainController.removeScreenBusyIndicator, this._oMainController);                
            },

            removeHiglightedRows: function() {
                var rows = this.oView.byId("parties").getRows();

                rows.forEach(function(oRow, index) {
                    oRow.toggleStyleClass("npcSelectedRow", false); //Remove highlighted class
                });
            },

            /**
             * on row select Event
             */
            onRowSelect: function(oContext, sAction) {
                this.getEventBus().publish("partners", "refreshPartiesForm", {
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
                this.oComponent._setViewModelProperty("CreateMode", false);
                this.removeHiglightedRows();

                var oProperties = {
                    StepKey: this._sStepKey,
                    RecordId: this.Formatter.newGuid(),
                    LastName: null,
                    FirstName: null,
                    ValidFrom: new Date(),
                    ActiveFilter: "X"
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

            /**
             * on filter active event
             *set active filter
             */
            filterActive: function() {
                var aFilterBy = [];
                aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));
                aFilterBy.push(new Filter("ActiveFilter", FilterOperator.EQ, "X"));

                this.oParties.getBinding("rows").filter(aFilterBy);
            },

            /**
             * on filter Historic event
             * set historic filter
             */
            filterHistoric: function() {
                this.aFilterBy = [];
                this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));
                this.aFilterBy.push(new Filter("ActiveFilter", FilterOperator.NE, "X"));

                this.bindRows();
            },

            /**
             * on filter event
             * opens new filter dialog box
             */
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
                        if (item.getId() === "partnerFunction") {
                            that._oFilterDialog.getFilterItems()[index].bindAggregation("items", {
                                path: "/PartnerFunctions",
                                sorter: null,
                                parameters: {},
                                template: new sap.m.ViewSettingsItem({
                                    text: "{Description}",
                                    key: "{PartnerFunction}"
                                }),
                                filters: that.aFilterBy
                            });
                        }
                    });
                }

                this._oFilterDialog.open();
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
                        if (item.getId().indexOf("partnerFunction") > -1) {
                            this.aFilterBy.push(new Filter("PartnerFunction", FilterOperator.EQ, item.getProperty("key")));
                        }
                    }.bind(this));

                    this.bindRows();
                }
            },

            onAfterRendering: function() {
            },

            /**
             * on reset filter event
             */
            onResetFilter: function() {
                this.aFilterBy = [];
                this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));

                this.bindRows();

                if (this._oFilterDialog) { //Destroyed since no way reseting filter at code level
                    this._oFilterDialog.destroy();
                    this._oFilterDialog = null;
                }

                this.getEventBus().publish(this._sChannelId, "refreshPartiesForm", { //Clear form
                    context: null,
                    action: null
                });
            },
            
          formatTeleandEmail:  function(sData)
            {
                if(sData)
                {
                    var semicount=0;
                    for( var i=0; i<sData.length; i++)
                    {
                        if(sData.charAt(i) == ';')
                            semicount++;
                        if(semicount == 4)
                            return sData.substring(0,i);
                    }
                }
                return sData;
            }
        });
    });
