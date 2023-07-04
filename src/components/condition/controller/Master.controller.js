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
        return BaseController.extend("aklc.cm.components.condition.controller.Master", {
            _sConditionCollection: "Conditions",
            _sUpdate: "UPDATE",
            _sCreate: "CREATE",
            _sFilterFrag: "aklc.cm.components.condition.fragments.Filter",
            _sAddCondition: "aklc.cm.components.condition.fragments.AddCondition",
            _oMainController: "",
            /**
             * on Init
             * @param  {object} oEvent event object
             */
            onInit: function(oEvent) {
                BaseController.prototype.onInit.apply(this);
                this.oCondition = this.oView.byId("condition");
                this.oBundle = this.getComponent().getModel("i18n").getResourceBundle();
                this.oComponent = this.getOwnerComponent();
                this._rowRepeatConfig(); //Set filter and sort features to RowRepeater
                /*eslint-disable */
                var that = this;

                if (!this.oTemplate) {
                    this.oTemplate = this.byId("RowTemp").clone();

                    var fnOnClick = function(oEvent) {
                        //Higlight selected row in the list
                        var sSelectedRowId = jQuery(oEvent.target).closest(".npcRowRepeat").attr("id");
                        this.oSelectedId = sSelectedRowId;
                        var oSelectedRow;

                        this.oCondition.getRows().forEach(function(oRow, index) {
                            var bSelected = sSelectedRowId === oRow.getId();
                            oRow.toggleStyleClass("npcSelectedRow", bSelected); //Remove highlighted class

                            if (bSelected) {
                                oSelectedRow = oRow;
                            }
                        });

                        this.onRowSelect(oSelectedRow.getBindingContext(), this._sUpdate);

                    }.bind(this);

                    this.oTemplate.addEventDelegate({
                        onclick: fnOnClick
                    });

                    this.oTemplate.addEventDelegate({
                        onAfterRendering: function() {
                            var oFirstRow = that.oCondition.getRows()[0].getId();
                            var oStyle = that.oCondition.getRows()[0].aCustomStyleClasses.indexOf("npcSelectedRow");
                            var oUpdate = that.oComponent._oViewModel.getProperty("/UpdateBtn_Visible");
                            if (oFirstRow && oStyle === -1 && oUpdate == false) {
                                $("#" + oFirstRow).trigger("click");
                            } else if (that.oSelectedId && oUpdate == true) {
                                $("#" + that.oSelectedId).trigger("click");
                            }
                        }
                    });

                }

                this.oPSTemplate = new sap.m.ColumnListItem({ // Template used for Condition Search Dialog
                    type: "Active",
                    cells: [
                        new sap.m.Text({
                            text: "{ConditionGrpname}"

                        }),
                        new sap.m.ObjectIdentifier({
                            text: "{ConditionTitle}"
                        }),
                        new sap.m.Text({
                            text: "{ConditionTypeDesc}"
                        })
                    ]
                });
            },

            _rowRepeatConfig: function() {

                var oSorter1 = new RowRepeaterSorter("ConditionTitle", {
                    text: "Condition Title",
                    sorter: new Sorter("ConditionTitle")

                });

                var oSorter2 = new RowRepeaterSorter("ConditionTypeDesc", {
                    text: "Condition Type",
                    sorter: new Sorter("ConditionTypeDesc")

                });

                var oSorter3 = new RowRepeaterSorter("ConditionGroup", {
                    text: "Condition Group",
                    sorter: new Sorter("ConditionGrpname")
                });

                this.oCondition.addSorter(oSorter1);
                this.oCondition.addSorter(oSorter2);
                this.oCondition.addSorter(oSorter3);
            },

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

            onContextChanged: function(sChannel, sEvent, oData) {

                this._oMainController = oData.controller;
                this._sStepKey = this._oModel.getProperty("StepKey", oData.context);
                this.aFilterBy = [];
                this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));
                this.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
                this.bindRows();

                this._sPreview = "/" + this._oModel.createKey("ApplicationLinks", {
                    "StepKey": this._sStepKey,
                    "Component": "CONDLINK"
                });

                var fnCallback = function(oContext) {
                    if (oContext) {
                        this._sPreview = oContext.getObject().Url;
                    }
                }.bind(this);

                this._oModel.createBindingContext(this._sPreview, null, null, fnCallback, true);

            },

            bindRows: function() {

                this._oMainController.setScreenBusyIndicator();

                this.oCondition.bindAggregation("rows", {
                    path: "/" + this._sConditionCollection,
                    parameters: {

                    },
                    template: this.oTemplate,
                    filters: this.aFilterBy

                });

                // Attach listener for OData request & completed to manage busy indicator
                this.oCondition.getBinding("rows").attachEvent("dataRequested", this._oMainController.setScreenBusyIndicator, this._oMainController);
                this.oCondition.getBinding("rows").attachEvent("dataReceived", this._oMainController.removeScreenBusyIndicator, this._oMainController);

            },

            onRowSelect: function(oContext, sAction) {
                // if (this._oModel.mChangedEntities){
                //     this._oModel.resetChanges();
                // }
                this.getEventBus().publish("condition", "refreshconditionForm", {
                    context: oContext,
                    action: sAction
                });
                 this.deleteDuplicateMessages();
            },

            //Preview Condition
            onPreview: function() {
                if (this._sPreview) {
                    window.open(this._sPreview, "Newwindow", "width=1400,height=900,resizable=1");
                }
            },

            onFilter: function(oEvent) {

                var that = this;
                this.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
                if (!this._oFilterDialog) {
                    this._oFilterDialog = sap.ui.xmlfragment(this._sFilterFrag, this);

                    this.aFilterBy = [];
                    this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));
                    this._oFilterDialog.setModel(this._oModel);

                    this._oFilterDialog.setModel(this.getComponent().getModel("i18n"), "i18n");

                    var items = this._oFilterDialog.getFilterItems();

                    items.forEach(function(item, index) {
                        if (item.getId() === "ConditionGrp") {
                            that._oFilterDialog.getFilterItems()[index].bindAggregation("items", {
                                path: "/VH_ConditionGrp",
                                sorter: null,
                                parameters: {},
                                template: new sap.m.ViewSettingsItem({
                                    text: "{ConditionGrpname}",
                                    key: "{ConditionGroup}"
                                }),
                                filters: that.aFilterBy
                            });
                        } else if (item.getId() === "ConditionTypes") {
                            that._oFilterDialog.getFilterItems()[index].bindAggregation("items", {
                                path: "/VH_ConditionType",
                                sorter: null,
                                parameters: {},
                                template: new sap.m.ViewSettingsItem({
                                    text: "{ConditionTypeDesc}",
                                    key: "{ConditionType}"
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
                        if (item.getParent().getId().indexOf("ConditionGrp") > -1) {
                            this.aFilterBy.push(new Filter("ConditionGroup", FilterOperator.EQ, item.getProperty("key")));
                        } else if (item.getParent().getId().indexOf("ConditionTypes") > -1) {
                            this.aFilterBy.push(new Filter("ConditionType", FilterOperator.EQ, item.getProperty("key")));
                        }
                    }.bind(this));

                    this.bindRows();
                }
            },

            onAddRow: function() {
                /*if (this._oModel.mChangedEntities) {
                    this._oModel.resetChanges();
                }*/
                this.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
                if (!this._pAddCondDialog) {
                    this._pAddCondDialog = sap.ui.xmlfragment("AddCond",
                        this._sAddCondition, this
                    );

                    this._pAddCondDialog.setModel(this._oModel); //Required so table dialog shows data from service

                    this._pAddCondDialog.setModel(this.getView().getModel("i18n"), "i18n");
                    this.getView().addDependent(this._pAddCondDialog);
                    this.partnerSearch = sap.ui.core.Fragment.byId("AddCond", "partySearchDialog");

                }

                this.partnerSearch.bindAggregation("items", {
                    path: "/ConditionSearch",
                    sorter: null,
                    parameters: {},
                    template: this.oPSTemplate,
                    filters: this.aFilterBy
                });

                this._pAddCondDialog.open();
            },

            onPress: function(oEvent) {

                var sContext = oEvent.getParameter("listItem").getBindingContext();
                this.page2 = sap.ui.core.Fragment.byId("AddCond", "page2");
                this.page1 = sap.ui.core.Fragment.byId("AddCond", "page1");
                this.page2.setBindingContext(sContext);
                this.navContainer = sap.ui.core.Fragment.byId("AddCond", "navCon");
                this.backButton = sap.ui.core.Fragment.byId("AddCond", "back");
                this.addButton = sap.ui.core.Fragment.byId("AddCond", "addBtn");
                this.addButton.setVisible(false);
                this.backButton.setVisible(true);
                this.navContainer.to(this.page2);
            },

            onBack: function(oEvent) {
                this.backButton.setVisible(false);
                this.navContainer.to(this.page1);
                this.addButton.setVisible(true);
            },

            onClose: function(oEvent) {
                this._pAddCondDialog.close();
                if (this._pAddCondDialog) {
                    this._pAddCondDialog.destroy();
                    this._pAddCondDialog = null;
                }
            },

            // for Refresh Filter
            onResetFilter: function(oEvent) {
                this.aFilterBy = [];
                this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));
                this.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
                this.bindRows();

                if (this._oFilterDialog) { //Destroyed since no way reseting filter at code level
                    this._oFilterDialog.destroy();
                    this._oFilterDialog = null;
                }
            },

          onAdd: function(oEvent) {
              if(this._oModel.mChangedEntities)	{
                     this._oModel.resetChanges();
                }
                var that = this;
                var selectedCondition = this.partnerSearch.getSelectedItems();

                /*** Added code for duplicat econditions *****/
                var aSelectedConditions = [];
                var aSelectedConditionsProperty = [];
                var aTableDataConditions = [];
                var aTableDataConditionsProperty = [];
                var aSelectedDuplicateConditions = [];

                var oTableData = this.getView().byId("condition").getRows();

                oTableData.forEach(function(data){
                    var oObj= data.getBindingContext().getObject();
                    aTableDataConditions.push(oObj);
                    aTableDataConditionsProperty.push(oObj.ConditionTypeDesc);

                });

               selectedCondition.forEach(function(data){
                    var oObj= data.getBindingContext().getObject();
                    aSelectedConditions.push(oObj);
                    aSelectedConditionsProperty.push(oObj.ConditionTypeDesc);

                });

               aSelectedConditionsProperty = aSelectedConditionsProperty.filter(function(val) {
                  return aTableDataConditionsProperty.indexOf(val) !== -1;
                });

                aSelectedConditions = aSelectedConditions.filter(function(o1){
                // Instead of using find() method used filter() because IE does not find() method
                            return !aTableDataConditions.filter(function(o2){
                                return o2.ConditionTypeDesc == o1.ConditionTypeDesc;
                            })[0];
                        });
                /*****end ......................*/

                aSelectedConditions.forEach(function(data) {
                   // var itemPath = that.partnerSearch.getSelectedItems()[index].getBindingContext().sPath;
                   // var oItem = that.partnerSearch.getSelectedItems()[index].getBindingContext().getObject(itemPath);

                    var oProperties = {
                        StepKey: that._sStepKey,
                        ConditionTitle: data.ConditionTitle,
                        ConditionGroup: data.ConditionGroup,
                        ConditionGrpname: data.ConditionGrpname,
                        ConditionType: data.ConditionType,
                        ConditionTypeDesc: data.ConditionTypeDesc,
                        ValidFrom: new Date(),
                        ValidTo: data.ValidTo,
                        ConditionSeq: data.ConditionSeq,
                        ConditionStat: data.ConditionStat,
                        ConditionStatDesc: data.ConditionStatDesc,
                        TextId: data.CondTextId,
                        Parameter1: data.Parameter1,
                        Parameter2: data.Parameter2,
                        ConditionText: data.ConditionText,
                        ConditionHelpText: data.ConditionHelpText,
                        Comments: data.Comments
                    };

                    var oContext = that._oModel.createEntry(
                        that._sConditionCollection, {
                            properties: oProperties
                        }
                    );

                });
                this._pAddCondDialog.close();
                if (this._pAddCondDialog) {
                    this._pAddCondDialog.destroy();
                    this._pAddCondDialog = null;
                }

                // Set Busy Indicator

                if(aSelectedConditionsProperty.length){
                    sap.m.MessageToast.show("Duplicate conditions will be ignored and non duplicate conditions will be saved.");

                    that._oMessageManager = sap.ui.getCore().getMessageManager();
                    $.each(aSelectedConditionsProperty, function(i,value) {

                        that._oMessageManager.addMessages(
                        new sap.ui.core.message.Message({
                            message:"Conditions error: Overlapping conditions not allowed("+aSelectedConditionsProperty[i]+")",
                            type: sap.ui.core.MessageType.Error,
                            processor: that._oModel
                        })
                        );
                    });
                }

                this._oMainController.setScreenBusyIndicator();
                this._oModel.submitChanges({
                    success: function(oEvent) {
                        try {
                            var oMessage = JSON.parse(oEvent.__batchResponses[0].response.body);
                            that._oMessageManager = sap.ui.getCore().getMessageManager();
                            $.each(oMessage.error.innererror.errordetails, function(i,value) {

                            that._oMessageManager.addMessages(
                            new sap.ui.core.message.Message({
                                message:value.message,
                                type: sap.ui.core.MessageType.Error,
                                processor: that._oModel
                            })
                            );
                        });
                     }
                    catch(err){}

                        // Remove the busy Indicator
                        that._oMainController.removeScreenBusyIndicator();
                        jQuery.sap.log.info("Added Condtion");
                        that.onResetFilter();
                    },
                    error: function(oEvent) {
                        // Remove the busy Indicator
                        that._oMainController.removeScreenBusyIndicator();
                        jQuery.sap.log.error("Error adding new condition");
                        that.onResetFilter();
                    }
                });

            },

            _handleCondtionSearch: function(oEvent) {
                var sValue = oEvent.getParameters().newValue;
                var aFilters = [];

                aFilters.push(new Filter(
                    "SearchTerm",
                    FilterOperator.Contains, sValue
                ));

                var oMultiFilter = new Filter({
                    filters: aFilters,
                    and: false
                });

                this.partnerSearch.getBinding("items").filter(oMultiFilter);
            },

            // Delete Condition
            onDeleteRow: function(oEvent) {

                var oController = this;
                this.sDeletePath = oEvent.getSource().getBindingContext().getPath();

                if (!this.oDialog) {
                    this.oDialog = new Dialog({
                        resizable: false,
                        title: this.oBundle.getText("CONDITION_DELETE_TITLE"),
                        modal: true,
                        showCloseButton: false
                    });

                    var oTextView = new TextView({
                        text: this.oBundle.getText("CONDITION_DELETE")
                    });

                    var fnClose = function(oEvent) {
                        this.oDialog.close();

                        if (oEvent.getSource().getId() === "YesBtnCon") {

                            // Set Busy Indicator
                            this.getView().getParent().setBusyIndicatorDelay(0);
                            this.getView().getParent().setBusy(true);

                            this._oModel.remove(this.sDeletePath, {

                                success: function(oEvent) {

                                    // Remove the busy Indicator
                                    oController.getView().getParent().setBusy(false);
                                    oController.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
                                    oController.onResetFilter();
                                    jQuery.sap.log.info("Deleted existing Condition");
                                },
                                error: function(oEvent) {
                                    oController.getView().getParent().setBusy(false);
                                    oController.onResetFilter();
                                    jQuery.sap.log.error("Error Delete existing Condition");
                                }
                            });
                        }
                    }.bind(this);

                    this.oDialog.addContent(oTextView);

                    this.oDialog.addButton(new sap.ui.commons.Button({
                        id: "YesBtnCon",
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
            /*eslint-enable */
            VisibilityLink: function(conditionLink) {
                if (conditionLink === true) {
                    sap.ui.core.Fragment.byId("AddCond", "linkCondition1").setText("Link to condition document");
                    return true;

                } else {
                    return false;
                }
            },

            onLinkPress: function() {
                if (this.oComponent._sLinkCond) {
                    window.open(this.oComponent._sLinkCond, "Newwindow", "width=1400,height=900,resizable=1");
                }
            },

            handleBeforeEditorInit: function(oEvent) {
                // Set the Rich Text editor as "One Way" binding
                var oSource = oEvent.getSource();
                var oBinding = oSource.getBinding("value");
                oBinding.setBindingMode("OneWay");
            },
            onValidateForm: function(oEvent) {
                this.oValidation.validateForm();
            },
            /**
             * Delete duplicate messages                    
             */
            deleteDuplicateMessages: function() {
                var aFinalMessages = [];
                var bUpdate = false;

                var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().oData;
                $.each(aMessages, function(i, oMessage) {

                    if (aFinalMessages.length === 0) {
                        // Add only Unique message
                        aFinalMessages.push(oMessage);
                        return true;
                    }

                    bUpdate = false;
                    // Check for duplicate messages
                    $.each(aFinalMessages, function(j, oFinalMessage) {
                        if (oFinalMessage.message === oMessage.message) {
                            bUpdate = true;
                            return false;
                        }
                    });

                    if (bUpdate === false) {
                        // Add only Unique message
                        aFinalMessages.push(oMessage);
                    }

                });

                // Replace duplicate messages and refresh it
                sap.ui.getCore().getMessageManager().removeAllMessages();
                sap.ui.getCore().getMessageManager().getMessageModel().oData = [];
                sap.ui.getCore().getMessageManager().getMessageModel().oData = aFinalMessages;
                sap.ui.getCore().getMessageManager().getMessageModel().refresh();
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
            },

            VisibilityRich: function(conditionLink) {
            if (conditionLink) {
                return false;
            } else {
                return false;
            }
            }

        });
    });