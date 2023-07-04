/* globals $: false
 * jQuery: false
 * sap: false&nbsp;
 * window: false */
 /*eslint-disable */
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
        return BaseController.extend("aklc.cm.components.correspond.controller.Master", {
            _sPROPERTYCollection: "Correspondence",
            _sPartiesCollection: "AssignedPartners",
            _sApplicationLinksCollection: "ApplicationLinks",
            _sCORRESPONDENCE_ID: "correspondence",
            _aButtonIDs: ["TEMPLATE", "UPLOAD"],
            _sUpdate: "UPDATE",
            _sCreate: "CREATE",
            _sFilterFrag: "aklc.cm.components.correspond.fragments.Filter",
            _sAPSearchHelp: "aklc.cm.components.correspond.fragments.AssignedPartners",
            _sChannelId: "correspondence",
            _oMainController: "",
            /**
             * on Init
             * @param  {object} oEvent event object
             */
            onInit: function(oEvent) {
                BaseController.prototype.onInit.apply(this);

                this.oBundle = this.getComponent().getModel("i18n").getResourceBundle();
                this.oCORRESPONDENCE = this.oView.byId(this._sCORRESPONDENCE_ID);
                this.oComponent = this.getOwnerComponent();

                this._setupMimeObjects(); //Configure mimetypes 

                if (!this.oTemplate) {
                    this.oCorrespondenceTemplate = this.byId("RowCorrespondenceTmpl").clone();
                    this._rowRepeatConfig();

                    var fnOnClick = function(oEvent) {

                        //Higlight selected row in the list
                        var sSelectedRowId = jQuery(oEvent.target).closest(".npcRowRepeat").attr("id");
                        var oSelectedRow;

                        this.oCORRESPONDENCE.getRows().forEach(function(oRow, index) {
                            var bSelected = sSelectedRowId === oRow.getId();
                            oRow.toggleStyleClass("npcSelectedRow", bSelected); //Remove highlighted class

                            if (bSelected) {
                                oSelectedRow = oRow;
                            }
                        });

                        this.onRowSelect(oSelectedRow.getBindingContext(), this._sUpdate);
                    }.bind(this);

                    this.oCorrespondenceTemplate.addEventDelegate({
                        onclick: fnOnClick
                    });
                }
                

                this.oPSTemplate = new sap.m.ColumnListItem({ // Template used for Partner Search Dialog
                    cells: [
                        new sap.m.Text({
                            text: "{PartnerFunctionText}"
                        }),
                        new sap.m.ObjectIdentifier({
                            text: "{FirstName} {LastName}"
                        }),
                        new sap.m.Text({
                            text: "{Address1}, {Address2}, {City}, {State}, {Country}, {Postcode}"
                        })
                    ]
                });
            },

            _setupMimeObjects: function() { //Mime type configuration
                this._sMimeTypes = [{
                    mime: "application/msword",
                    icon: "sap-icon://doc-attachment",
                    color: "#297FA2",
                    tooltip: this.oBundle.getText("MSWORD_TXT")
                }, {
                    mime: "application/pdf",
                    icon: "sap-icon://pdf-attachment",
                    color: "#E94D4E",
                    tooltip: this.oBundle.getText("PDF_TXT")
                }, {
                    mime: "application/ms-excel",
                    icon: "sap-icon://excel-attachment",
                    color: "#016E3D",
                    tooltip: this.oBundle.getText("EXCEL_TXT")
                }, {
                    mime: "image/png",
                    icon: "sap-icon://attachment-photo",
                    color: "#8875E7",
                    tooltip: this.oBundle.getText("IMAGE_TXT")
                }, {
                    mime: "image/jpg",
                    icon: "sap-icon://attachment-photo",
                    color: "#8875E7",
                    tooltip: this.oBundle.getText("IMAGE_TXT")
                }, {
                    mime: "image/jpeg",
                    icon: "sap-icon://attachment-photo",
                    color: "#8875E7",
                    tooltip: this.oBundle.getText("IMAGE_TXT")
                }, {
                    mime: "text/plain",
                    icon: "sap-icon://document-text",
                    color: "#666666",
                    tooltip: this.oBundle.getText("TEXTFILE_TXT")
                }, {
                    mime: "application/vnd.ms-powerpointtd",
                    icon: "sap-icon://ppt-attachment",
                    color: "#DA4A10",
                    tooltip: this.oBundle.getText("PWRPNT_TXT")
                }, {
                    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
                    icon: "sap-icon://ppt-attachment",
                    color: "#DA4A10",
                    tooltip: this.oBundle.getText("PWRPNT_TXT")
                }];
            },

            _rowRepeatConfig: function() {
                var oSorter1 = new RowRepeaterSorter("DocumentType", {
                    text: this.oBundle.getText("DOC_TYPE_TXT"),
                    sorter: new Sorter("DocumentType"),
                    tooltip: this.oBundle.getText("SORT_BY_DOC_TYPE")
                });

                var oSorter2 = new RowRepeaterSorter("CreatedOn", {
                    text: this.oBundle.getText("CREATEDON_TXT"),
                    sorter: new Sorter("CreatedOn"),
                    tooltip: this.oBundle.getText("SORT_BY_CREATEDON")
                });

                var oSorter3 = new RowRepeaterSorter("PartnerName", {
                    text: this.oBundle.getText("PARTNERNAME_TXT"),
                    sorter: new Sorter("PartnerName"),
                    tooltip: this.oBundle.getText("SORT_BY_PARTNERNAME")
                });

                this.oCORRESPONDENCE.addSorter(oSorter1);
                this.oCORRESPONDENCE.addSorter(oSorter2);
                this.oCORRESPONDENCE.addSorter(oSorter3);
            },

            onPSearchHelp: function(oEvent) {

                this.buttonId = oEvent.getSource().getId().toUpperCase();

                if (!this._pasHelpDialog) {
                    this._pasHelpDialog = sap.ui.xmlfragment(
                        this._sAPSearchHelp, this
                    );

                    this._pasHelpDialog.setModel(this._oModel); //Required so table dialog shows data from service

                    this._pasHelpDialog.setModel(this.getView().getModel("i18n"), "i18n");
                    this.getView().addDependent(this._pasHelpDialog);
                }

                this.aFilterBy = [];
                this.aFilterBy.push(new sap.ui.model.Filter("StepKey", sap.ui.model.FilterOperator.EQ, this._sStepKey));
                this.aFilterBy.push(new sap.ui.model.Filter("ActiveFilter", sap.ui.model.FilterOperator.EQ, 'X'));

                this._pasHelpDialog.bindAggregation("items", {
                    path: "/" + this._sPartiesCollection,
                    sorter: [new Sorter("FirstName", false)],
                    parameters: {},
                    template: this.oPSTemplate,
                    filters: this.aFilterBy
                });

                this._pasHelpDialog.open();
            },


            _handleValueHelpClose: function(oEvent) {
                var oSelectedItem = oEvent.getParameter("selectedItem");

                if (oSelectedItem) {
                    var oContext = oSelectedItem.getBindingContext().getObject();
                    this._displayRedirectURL(oContext.PartnerNumber,oContext.PartnerFunction);
                }
            },

            _getButtonPressed: function() {
                if (this.buttonId.indexOf(this._aButtonIDs[0]) > -1) {
                    return this._aButtonIDs[0];
                } else if (this.buttonId.indexOf(this._aButtonIDs[1]) > -1) {
                    return this._aButtonIDs[1];
                }
            },

            onLaunchURL: function(oEvent) {
                this.buttonId = oEvent.getSource().getId().toUpperCase();
                this._displayRedirectURL("");
            },

            _displayRedirectURL: function(partnerNumber,partnerFunction) {
                var aFilters = [];

                aFilters.push(new Filter(
                    "Parameter1",
                    FilterOperator.EQ, partnerNumber
                ));

                aFilters.push(new Filter(
                    "Parameter3",
                    FilterOperator.EQ, partnerFunction
                ));

                aFilters.push(new Filter(
                    "StepKey",
                    FilterOperator.EQ, this._sStepKey
                ));

                var component = this._getButtonPressed(); //Get component name from button Id

                aFilters.push(new Filter(
                    "Component",
                    FilterOperator.EQ, component
                ));

                var aFilter = [];

                aFilter.push(new Filter(
                    aFilters, true
                ));

                var sPath = "/" + this._sApplicationLinksCollection;

                this._oModel.read(sPath, {
                    filters: aFilter,
                    success: function(oEvent) {
                        if (oEvent.results.length > 0) {
                            window.open(oEvent.results[0].Url);
                        }
                    },
                    error: function() {
                        jQuery.sap.log.error("Error retrieving URL");
                    }
                });
            },

            _handlePSValueHelpSearch: function(oEvent) {
                var sValue = oEvent.getParameter("value");
                var aFilters = [];

                /* aFilters.push(new Filter(
                    "FirstName",
                    FilterOperator.Contains, sValue
                ));

                aFilters.push(new Filter(
                    "LastName",
                    FilterOperator.Contains, sValue
                )); */

                aFilters.push(new Filter(
                    "SearchTerm",
                    FilterOperator.Contains, sValue
                ));

                var oMultiFilter = new Filter({
                    filters: aFilters,
                    and: false
                });

                oEvent.getSource().getBinding("items").filter(oMultiFilter);
            },

            onHandleConfirm: function(oEvent) {
                if (oEvent.getParameters().filterString) {
                    var filterItems = oEvent.getParameter("filterItems");

                    this.aFilterBy = [];
                    this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));

                    filterItems.forEach(function(item) {
                        var id = item.getParent().getId();

                        if (id.indexOf("documentStatusText") > -1) {
                            this.aFilterBy.push(new Filter("DocumentStatusText", FilterOperator.EQ, item.getProperty("text")));
                        } else if (id.indexOf("partnerFunctionText") > -1) {
                            this.aFilterBy.push(new Filter("PartnerFunctionText", FilterOperator.EQ, item.getProperty("text")));
                        } else if (id.indexOf("documentGroup") > -1) {
                            this.aFilterBy.push(new Filter("DocumentGroup", FilterOperator.EQ, item.getProperty("text")));
                        } else if (id.indexOf("documentType") > -1) {
                            this.aFilterBy.push(new Filter("DocumentType", FilterOperator.EQ, item.getProperty("text")));
                        } else if (id.indexOf("mimeType") > -1) {
                            this.aFilterBy.push(new Filter("MimeType", FilterOperator.EQ, item.getProperty("text")));
                        }
                    }.bind(this));
                }

                var sPath = oEvent.getParameter("sortItem").getProperty("key");
                var bDescending = oEvent.getParameters().sortDescending;
                this.oSorter = new Sorter(sPath, bDescending);

                this.bindRows();
            },


            rowRepeatSort: function(oEvent) {
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

                this.oSorter = new sap.ui.model.Sorter("CreatedOn", true);
                this.bindRows();
            },

            onRefresh: function(sChannel, sEvent) {
                this.aFilterBy = [];
                this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));

                this.oSorter = new sap.ui.model.Sorter("CreatedOn", true);
                this.bindRows();
            },

            bindRows: function() {

                this._oMainController.setScreenBusyIndicator();

                this.oCORRESPONDENCE.bindAggregation("rows", {
                    path: "/" + this._sPROPERTYCollection,
                    sorter: this.oSorter,
                    parameters: {},
                    template: this.oCorrespondenceTemplate,
                    filters: this.aFilterBy
                });

                // Attach listener for OData request & completed to manage busy indicator
                this.oCORRESPONDENCE.getBinding("rows").attachEvent("dataRequested", this._oMainController.setScreenBusyIndicator, this._oMainController);
                this.oCORRESPONDENCE.getBinding("rows").attachEvent("dataReceived", this._oMainController.removeScreenBusyIndicator, this._oMainController);

            },

            removeHiglightedRows: function() {
                var rows = this.oView.byId(this._sCORRESPONDENCE_ID).getRows();

                rows.forEach(function(oRow) {
                    oRow.toggleStyleClass("npcSelectedRow", false); //Remove highlighted class
                });
            },

            onResetFilters: function() {
                this.aFilterBy = [];
                this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));
                this.oSorter = new sap.ui.model.Sorter("CreatedOn", true);

                this.bindRows();

                if (this._oFilterDialog) { //Destroy dialog since cannot remove filter selected text
                    this._oFilterDialog.destroy();
                    this._oFilterDialog = null;
                }
            },

            getIconFromMimeType: function(sMimeType) {
                var sIcon = "sap-icon://document";

                this._sMimeTypes.forEach(function(type) {
                    if (sMimeType === type.mime) {
                        sIcon = type.icon;
                    }
                });

                return sIcon;
            },

            getIconColor: function(sMimeType) {
                var sColor = "#666666";

                this._sMimeTypes.forEach(function(type) {
                    if (sMimeType === type.mime) {
                        sColor = type.color;
                    }
                });

                return sColor;
            },

            getIconTooltip: function(sMimeType) {

                var sTooltip = this.oBundle.getText("DOCUMENT_TXT");

                this._sMimeTypes.forEach(function(type) {
                    if (sMimeType === type.mime) {
                        sTooltip = type.tooltip;
                    }
                });

                return sTooltip;
            },

            getDocumentStatusIcon: function(sDocumentStatus) {
                if (sDocumentStatus) {
                    if (sDocumentStatus === "Final") {
                        return "sap-icon://locked";
                    } else {
                        return "sap-icon://unlocked";
                    }
                }
            },

            getAuthorisationScopeIcon: function(sAuthorizationScope) {
                if (sAuthorizationScope) {
                    if (sAuthorizationScope === "Confidential") {
                        return "sap-icon://alert";
                    } else {
                        return "";
                    }
                }
            },

            formatDate: function(date) {
                return this.Formatter.formatDate(date, "dd/MM/yyyy");
            },

            formatDates: function(dCreateDate, dLegacyDate, dReceivedDate) {
                return "Created On: " + this.Formatter.formatDate(dCreateDate, "dd/MM/yyyy") + "\n" +
                    "Legacy Date: " + this.Formatter.formatDate(dLegacyDate, "dd/MM/yyyy") + "\n" +
                    "Received Date: " + this.Formatter.formatDate(dReceivedDate, "dd/MM/yyyy");
            },


            _applyFilter: function(sPath, text, key, index) {
                this._oFilterDialog.getFilterItems()[index].bindAggregation("items", {
                    path: sPath,
                    sorter: null,
                    parameters: {},
                    template: new sap.m.ViewSettingsItem({
                        text: "{" + text + "}",
                        key: "{" + key + "}"
                    }),
                    filters: this.aFilterBy
                });
            },

            /*eslint-disable */
            onFilter: function(oEvent) {

                var that = this;
                /*eslint-enable */

                if (!that._oFilterDialog) {
                    that._oFilterDialog = sap.ui.xmlfragment(that._sFilterFrag, that);

                    that.aFilterBy = [];
                    that.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, that._sStepKey));

                    that._oFilterDialog.setModel(that._oModel);

                    that._oFilterDialog.setModel(that.getComponent().getModel("i18n"), "i18n");

                    var items = that._oFilterDialog.getFilterItems();

                    items.forEach(function(item, index) {
                        var id = item.getId();

                        if (id === "documentStatusText") {
                            that._applyFilter("/VH_DocumentStatus", "DocumentStatusText", "StepKey", index);
                        } else if (id === "partnerFunctionText") {
                            that._applyFilter("/PartnerFunctions", "Description", "StepKey", index);
                        } else if (id === "documentGroup") {
                            that._applyFilter("/VH_DocumentGroup", "DocumentGroup", "StepKey", index);
                        } else if (id === "mimeType") {
                            that._applyFilter("/VH_DocumentFormat", "MimeType", "StepKey", index);
                        } else if (id === "documentType") {
                            that._applyFilter("/VH_DocumentType", "DocumentType", "StepKey", index);
                        }
                    });
                }

                if (oEvent.getParameter("id").indexOf("sort") > -1) {
                    that._oFilterDialog.open("sort");
                } else if (oEvent.getParameter("id").indexOf("filter") > -1) {
                    that._oFilterDialog.open("filter");
                }
            },
            /**
             * on Check Valid Event
             * @param  {string} sChannel [description]
             * @param  {string} sEvent   [description]
             * @param  {object} oData    [description]
             */
            onCheckValid: function(sChannel, sEvent, oData) {
                oData.WhenValid.resolve();
            }
        });
    });
