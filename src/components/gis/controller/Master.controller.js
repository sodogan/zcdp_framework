sap.ui.define(["aklc/cm/library/common/controller/BaseController",
        "sap/ui/commons/TextView",
        "sap/ui/commons/RowRepeaterFilter",
        "sap/ui/commons/RowRepeaterSorter",
        "sap/ui/model/Sorter",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
		"sap/m/Dialog",
		"sap/m/Button",
		"sap/m/Label",
		"sap/m/library",
		"sap/m/MessageBox",
		"sap/m/MessageToast",
		"sap/m/Text",
		"sap/m/TextArea"        
    ],
    function(BaseController, TextView, RowRepeaterFilter, RowRepeaterSorter, Sorter, Filter, FilterOperator, Dialog, Button, Label, mobileLibrary, MessageBox, MessageToast, Text, TextArea) {
        "use strict";
        return BaseController.extend("aklc.cm.components.gis.controller.Master", {
            _sGISCollection: "GisLocationSet",
            _sGIS_ID: "giss",
            _sUpdate: "UPDATE",
            _sDelete: "DELETE",
            _sCreate: "CREATE",
            _sFilterFrag: "aklc.cm.components.gis.fragments.Filter",

            _sChannelId: "gis",
            _oMainController: "",
            _selectedRowRepeater: "",
            /**
             * on Init
             * @param  {object} oEvent event object
             */
            onInit: function(oEvent) {
                BaseController.prototype.onInit.apply(this);
                this.oBundle = this.getComponent().getModel("i18n").getResourceBundle();
                this.oGISS = this.oView.byId(this._sGIS_ID);
                this.oComponent = this.getOwnerComponent();
                var that = this;

                if (!this.oTemplate) {
                    this.oTemplate = this.byId("RowTmpl").clone();

                    var fnOnClick = function(oEvent) {
                        var oCreateMode = this.oComponent._oViewModel.getProperty("/CreateMode");
                        if (oCreateMode === false) {
                            that._oModel.deleteCreatedEntry(that._oContext);
                        }
                        
                        //Higlight selected row in the list
                        var sSelectedRowId = jQuery(oEvent.target).closest(".npcRowRepeat").attr("id");
                        var oSelectedRow;
                        that._selectedRowRepeater = sSelectedRowId;

                        this.oGISS.getRows().forEach(function(oRow, index) {
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
                            var oFirstRow = that.oGISS.getRows()[0].getId();
                            var oStyle = that.oGISS.getRows()[0].aCustomStyleClasses.indexOf("npcSelectedRow");
                            var oUpdate = that.oComponent._oViewModel.getProperty("/UpdateBtn_Visible");
                            if (oFirstRow && oStyle == -1 && oUpdate == false) {
                                if(that._selectedRowRepeater && that._updateFlag === true)
                                {
                                    $("#" + that._selectedRowRepeater).trigger("click");
                                    that._updateFlag = false;
                                }
                                else
                                {
                                    var selectedflag = false;
                                    that.oGISS.getRows().forEach(function(oRow, index) {
                                        if(oRow.hasStyleClass("npcSelectedRow"))
                                        {
                                            selectedflag = true;
                                        }
                                    });
                                    if(selectedflag === false)
                                        $("#" + oFirstRow).trigger("click");
                                }
                            }
                            else if(oFirstRow && oStyle === -1 && oUpdate === true) {
                                selectedflag = false;
                                that.oGISS.getRows().forEach(function(oRow, index) {
                                    if(oRow.hasStyleClass("npcSelectedRow"))
                                    {
                                        selectedflag = true;
                                    }
                                });

                                if(selectedflag === false)
                                {
                                    // Click previously selected row
                                    $("#" + that._selectedRowRepeater).trigger("click");
                                }
                                
                            }
                        }                    
                });
            }
        },

            _rowRepeatConfig: function() {   },

            onFilter: function(oEvent) {  },

            onHandleConfirm: function(oEvent) {  },

            rowRepeatSort: function(oEvent) { },

            onContextChanged: function(sChannel, sEvent, oData) {
            	
            	this._oMainController = oData.controller;
                this._sStepKey = this._oModel.getProperty("StepKey", oData.context);
                this.aFilterBy = [];
                this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));
                this.oSorter = new sap.ui.model.Sorter("CreatedOn", true);
                this.bindRows();
            },

            bindRows: function() {
                this.oGISS.bindAggregation("rows", {
                    path: "/" + this._sGISCollection,
                    sorter: this.oSorter,
                    parameters: {},
                    template: this.oTemplate,
                    filters: this.aFilterBy
                });
                
                // Attach listener for OData request & completed to manage busy indicator
                this.oGISS.getBinding("rows").attachEvent("dataRequested", this._oMainController.setScreenBusyIndicator, this._oMainController);
                this.oGISS.getBinding("rows").attachEvent("dataReceived", this._oMainController.removeScreenBusyIndicator, this._oMainController);                
            },

            removeHiglightedRows: function() {
                var rows = this.oView.byId(this._sGIS_ID).getRows();

                rows.forEach(function(oRow, index) {
                    oRow.toggleStyleClass("npcSelectedRow", false); //Remove highlighted class
                });
            },

            onRowSelect: function(oContext, sAction) {
                this.getEventBus().publish(this._sChannelId, "refreshGISForm", {
                    context: oContext,
                    action: sAction
                });
            },

            onDeleteRow: function(oEvent) {
            	
            	var oController = this;
            	
                this.sDeletePath = oEvent.getSource().getBindingContext().getPath();

                MessageBox.confirm(this.oBundle.getText("GIS_DELETE"), {
                	//icon: sap-icon://delete,
                	title: this.oBundle.getText("GIS_DELETE_TITLE"),
                	actions: [MessageBox.Action.YES, MessageBox.Action.NO],
					emphasizedAction: MessageBox.Action.NO,
					onClose: function (oAction) { 
						if(oAction === MessageBox.Action.YES){
                            // Set Busy Indicator
                            oController.getView().getParent().setBusyIndicatorDelay(0);
                            oController.getView().getParent().setBusy(true);

                            oController._oModel.remove(oController.sDeletePath, {
                                success: function(oEvent) {

                                    // Remove the busy Indicator
                                    oController.getView().getParent().setBusy(false);
                                    MessageToast.show("Deleted existing record");
						            oController.getEventBus().publish(oController._sChannelId, "refreshGISForm", {
						                context: null,
						                action: oController._sDelete
						            });                               
                                },
                                error: function(oEvent) {
                                    // Remove the busy Indicator
                                    oController.getView().getParent().setBusy(false);
                                    MessageToast.show("Error deleting existing record");
                                }
                            });							
						}
					}
                });

                     
                
/*                //-----------------
				// shortcut for sap.m.ButtonType
				var ButtonType = mobileLibrary.ButtonType;
			
				// shortcut for sap.m.DialogType
				var DialogType = mobileLibrary.DialogType;
	
                if (!this.oDeleteDialog) {
                    this.oDeleteDialog = new Dialog({
                    	type: DialogType.Message,
                    	title: this.oBundle.getText("GIS_DELETE_TITLE"),
                    	content: new Text({ text: this.oBundle.getText("GIS_DELETE")}),
                    	
                    	beginButton: new Button({
                    		text: this.oBundle.getText("YES_TXT"),
                    		type: ButtonType.Emphasized, // sap.m.ButtonType
                    		icon: undefined, // sap.ui.core.URI
                    		press: function () {
		                        this.oDeleteDialog.close();
		                        
	                            // Set Busy Indicator
	                            this.getView().getParent().setBusyIndicatorDelay(0);
	                            this.getView().getParent().setBusy(true);
	
	                            this._oModel.remove(this.sDeletePath, {
	
	                                success: function(oEvent) {
	
	                                    // Remove the busy Indicator
	                                    oController.getView().getParent().setBusy(false);
	
	                                    MessageToast.show("Deleted existing record");
	                                },
	                                error: function(oEvent) {
	
	                                    // Remove the busy Indicator
	                                    oController.getView().getParent().setBusy(false);
	                                    MessageToast.show("Error deleting existing record");
	                                }
	                            });
 
                    		}. bind(this)
                    	}),

						endButton: new Button({
							text: this.oBundle.getText("NO_TXT"),
							press: function () {
								this.oDeleteDialog.close();
							}.bind(this)
						})                    	
                    });
                }
                this.oDeleteDialog.open();*/
            },

            onAddRow: function() {
                this.oComponent._oViewModel.setProperty("/CreateMode", false); //Make Add button disabled

                this.removeHiglightedRows();

                var oProperties = {
                    StepKey: this._sStepKey,
                    RecordId: this.Formatter.newGuid(),
                    LocationType: "",
                    CollectionMethod: "",
                    CreatedOn: new Date()
                };

                // create entry
                var oContext = this._oModel.createEntry(
                    this._sGISCollection, {
                        properties: oProperties
                    }
                );

                this.onRowSelect(oContext, this._sCreate);
            },

            onResetFilter: function(oEvent) { }
        });
    });
