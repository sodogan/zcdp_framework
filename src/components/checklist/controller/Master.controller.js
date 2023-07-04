sap.ui.define(["aklc/cm/library/common/controller/BaseController",
        "sap/ui/commons/Dialog",
        "sap/ui/commons/TextView",
        "sap/ui/commons/RowRepeaterFilter",
        "sap/ui/model/Sorter",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/ui/model/json/JSONModel"
        
    ],
    function (BaseController, Dialog, TextView, RowRepeaterFilter, Sorter, Filter, FilterOperator,JSONModel) {
        "use strict";
        return BaseController.extend("aklc.cm.components.checklist.controller.Master", {
            _sChecklistCollection:"Checklist",
            _sChklistStatusCollection:"VH_ChklistStatusSet",
            _sChecklistStepID:"StepID",
            _sUpdate: "UPDATE",
            _sCreate: "CREATE",
            _sRefresh:"REFRESH",
            _sImagesPath: "aklc.cm.components.checklist.images",
            _sFilterFrag: "aklc.cm.components.checklist.fragments.Filter",
            _sChkListStepsFrag: "aklc.cm.components.checklist.fragments.ChecklistSteps",
            _oMainController: "",
            sortNoOrder: false,
            sortDescOrder: false,
            sortStatOrder: false,
            updateFlag: false,
            isStepSelected: false,


            /*eslint-disable */
            /**
             * on Init
             */
            onInit: function () {
                BaseController.prototype.onInit.apply(this);
                this.oChecklist = this.oView.byId("checklistTable");
                   this.oChecklistStatusDD = sap.ui.getCore().byId(this.createId("chklistStatDD"));
                //this.oChklistStepTable = this.oView.byId("chklistStepTable");
                //  this.oTemplate =this.byId("chklistTemplate");
                this.oBundle = this.getComponent().getModel("i18n").getResourceBundle();
                this.oComponent = this.getOwnerComponent();

                var that = this;

                this.getEventBus().subscribe("checklist", "updateJSON",
                function(sChannelId, sEventId, oData) {
                    that.refreshJsonModel();

                });

                this.oTemplate =new sap.m.ColumnListItem({
                        id:"chklistTemplate",
                        type:"Navigation",
                          cells:[             
                               new sap.m.Text({
                               text:"{StepNo}",
                               class:"formLabel"
                                }),
                                new sap.m.Text({
                                text:"{ChklstDescr}",
                                 class:"formLabel"
                                }),
                                new sap.m.Text({
                                text:"{StepStatus}",
                                 class:"formLabel"
                                })
                             ]
                          }),


                    this.oChkListTemplate = new sap.m.ColumnListItem({ 
                        type:"Active",
                        cells: [
                        new sap.m.ObjectIdentifier({
                            text: "{StepId}"
                        }),
                         new sap.m.Text({
                            text: "{Description}"
                        })
                ]
            })

            this.getEventBus().subscribe("checklist", "callChecklistDescDialog",this.onAddRow,this);
            this.getEventBus().subscribe("checklist", "ResetOnCancel", this.onResetFilter,this);
            this.getEventBus().subscribe("checklist", "setCancelFlag", this.onSetUpdateFlag,this);
            this.getEventBus().subscribe("checklist", "setCurrentStepSelected", this.onSetCurrentStepFlag,this);

                 if (this.getView().byId("chkMasterScrollContainer")) {
                   this.getView().byId("chkMasterScrollContainer").addEventDelegate({
                    "onAfterRendering": function () {
                        window.addEventListener("resize", this.resizeContainer.bind(this));
                    }
                }, this);
            }

            },

            resizeContainer: function() {
              var elementToResize = this.getView().byId("chkMasterScrollContainer");
              var coord = $("#" + elementToResize.sId).offset();
              //var coord = elementToResize.$().css('position');
              var width_to_set = window.innerHeight - coord.top -60;
              elementToResize.setHeight(width_to_set+ "px");
            },

            onSetCurrentStepFlag: function() {
              this.isStepSelected = true;
            },

            onSetUpdateFlag: function() {
                this.updateFlag = true;
            },

            refreshJsonModel: function() {
                var that=this;
                var firstItem = this.getView().byId("checklistTable").getItems()[0];
                if(this.isStepSelected === true)
                {
                  firstItem = this.oChecklist.getSelectedItem();
                }
                var oJsonModelOptions = new sap.ui.model.json.JSONModel();
                var oJsonModel = new sap.ui.model.json.JSONModel();

                if(firstItem!=null ) {
                    this._oMainController.setScreenBusyIndicator();
                    var aFilterByKey = []
                    aFilterByKey.push(new sap.ui.model.Filter("StepKey", sap.ui.model.FilterOperator.EQ, this._sStepKey));
                    this._oModel.read("/VH_ChklistStatusSet",{
                        filters: aFilterByKey,
                        success: function(oData, oResponse) {
                    
                            var newresults= [];
                            that.currchkStatusData = jQuery.extend({},oData);
                            if(oData.results == null)
                                return;

                            for( var i=0; i<oData.results.length;i++ )
                            {
                                if(that.fnTrimZero(oData.results[i].AzcstepNo) == firstItem.getBindingContext().getProperty("StepNo"))
                                {
                                    newresults.push(oData.results[i]);
                                }
                            }
                            oData.results = newresults;
                            oJsonModel.setData(oData);

                            that.getEventBus().publish("checklist", "populatechkStatus", {
                                jsonMdl: oJsonModel,
                                action: "UPDATE"
                            });
                            that._oMainController.removeScreenBusyIndicator();
                        },
                        error: function(oData, oResponse) {
                           that._oMainController.removeScreenBusyIndicator(); 
                        }

                 });

                 //this._oMainController.setScreenBusyIndicator();

                 // Get checkList Option Dropdown     
                 aFilterByKey = []
                 aFilterByKey.push(new sap.ui.model.Filter("Stepkey", sap.ui.model.FilterOperator.EQ, this._sStepKey)); 
                 this._oModel.read("/VH_ChklistOptionSet",{
                        filters: aFilterByKey,
                        success: function(oData, oResponse) {
                            var newresults= [];
                            that.currchkOptData = jQuery.extend({},oData);
                            //var firstItem = that.getView().byId("checklistTable").getItems()[0];

                            if(oData.results == null)
                                return;
                            for( var i=0; i<oData.results.length;i++ )
                            {
                                if(that.fnTrimZero(oData.results[i].AzcstepNo) == firstItem.getBindingContext().getProperty("StepNo"))
                                {
                                    newresults.push(oData.results[i]);
                                }
                            }
                            oData.results = newresults;
                            oJsonModelOptions.setData(oData);

                            that.getEventBus().publish("checklist", "populatechkOption", {
                                jsonMdl: oJsonModelOptions,
                                action: "UPDATE"
                            });
                            that._oMainController.removeScreenBusyIndicator();
                        },
                        error: function(oData, oResponse) {
                           that._oMainController.removeScreenBusyIndicator(); 
                        }

                 });
             }
            },

            onUpdateFinished:function(oContext,sAction){
                var that=this;
                var firstItem = this.getView().byId("checklistTable").getItems()[0];
                if(oContext != null && oContext.getParameters().reason !=="Change" && this.selectedChkRow == null){
                    this.getView().byId("checklistTable").setSelectedItem(firstItem,true); 
                }
                else
                {
                  this.getView().byId("checklistTable").setSelectedItem(this.selectedChkRow);
                }

                /*var oJsonModelOptions = new sap.ui.model.json.JSONModel();
                var oJsonModel = new sap.ui.model.json.JSONModel();*/
                
                this.oComponent._setViewModelProperty("UpdateBtn_Visible", true);
                 // this.oComponent._setViewModelProperty("AssignBtn_Visible", true);
                 this.getEventBus().publish("checklist", "updateInitialDetailFormData", {
                     context: oContext,
                     action: this._sRefresh
                 });

                 // Get Checklist Status Dropdown values
                if(firstItem!=null  && oContext.getParameters().reason !=="Change" && this.updateFlag == false) {
                    this.refreshJsonModel();
                }
                else if(firstItem!=null && this.updateFlag == true)
                {
                    this.updateFlag = false;
                    this.setJSONmodels(firstItem.getBindingContext().getProperty("StepNo"));
                }

                 if(this.oChecklistStatusDD){
                    this.oChecklistStatusDD.bindAggregation("items", {
                    path: "/" + this._sChklistStatusCollection,  
                    template: this.oTemplate,
                    filters: this.aFilterBy,
                  events:{
                        dataRequested : function (oEvent) {
                             that._oMainController.setScreenBusyIndicator();
                    
                            },
                        dataReceived: function (oEvent) {
                           that._oMainController.removeScreenBusyIndicator();

                             }
                        }
                }); 
                 }
        
            },

            onStepNoSort: function() {
                var oSorterNo = new sap.ui.model.Sorter("StepNo", this.sortNoOrder);
                this.oChecklist.getBinding("items").sort(oSorterNo);
                this.sortNoOrder = !this.sortNoOrder;
            },

            onStepDescSort: function() {
                var oSortDesc = new sap.ui.model.Sorter("ChklstDescr", this.sortDescOrder);
                this.oChecklist.getBinding("items").sort(oSortDesc);
                this.sortDescOrder = !this.sortDescOrder;
            },

            onStepStatSort: function() {
                var oSortStat = new sap.ui.model.Sorter("StepStatus", this.sortStatOrder);
                this.oChecklist.getBinding("items").sort(oSortStat);
                this.sortStatOrder = !this.sortStatOrder;
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
                 this.oComponent._setViewModelProperty("AssignBtn_Visible", false);
                this.bindRows();                       
            },

            
            /**
             * bind rows Event
             */
            bindRows: function() {
                var that=this;
                //this.defaultStepNoSort =new sap.ui.model.Sorter("AzcstepNo", true, null, this.defaultSortStepNumberComp);
               this._oMainController.setScreenBusyIndicator();
               this.oChecklist.bindAggregation("items", {
                    path: "/" + this._sChecklistCollection,  
                    template: this.oTemplate,
                    filters: this.aFilterBy
                });

                

            // Attach listener for OData request & completed to manage busy indicator
           this.oChecklist.getBinding("items").attachEvent("dataRequested", this._oMainController.setScreenBusyIndicator, this._oMainController);
           this.oChecklist.getBinding("items").attachEvent("dataReceived", this._oMainController.removeScreenBusyIndicator, this._oMainController);  
            },

            fnTrimZero: function(sValue) {
                return sValue.replace(/^0+/,'');
            },

            setJSONmodels: function(currentStepNo) {
                var oJsonModel = new sap.ui.model.json.JSONModel();
                var oData = jQuery.extend({},this.currchkStatusData);
                var newresults = [];
                for(var i=0; i<oData.results.length;i++ )
                {
                  if(this.fnTrimZero(oData.results[i].AzcstepNo) == currentStepNo)
                  {
                     newresults.push(oData.results[i]);
                  }
                }
              oData.results = newresults;
              oJsonModel.setData(oData);

              var JsonModelOptions = new sap.ui.model.json.JSONModel();
              var oDataOptions = jQuery.extend({},this.currchkOptData);
              newresults = [];
              for(var i=0; i<oDataOptions.results.length;i++ )
              {
                  if(this.fnTrimZero(oDataOptions.results[i].AzcstepNo) == currentStepNo)
                  {
                     newresults.push(oDataOptions.results[i]);
                  }
              }
              oDataOptions.results = newresults;
              JsonModelOptions.setData(oDataOptions);

              this.getEventBus().publish("checklist", "populatechkStatus", {
                jsonMdl: oJsonModel,
                action: "UPDATE"
              });
              this.getEventBus().publish("checklist", "populatechkOption", {
                jsonMdl: JsonModelOptions,
                action: "UPDATE"
              });

            } ,

            /*eslint-disable */
            /**
             * on row select Event
             */
        onSelectionChange: function(oContext, sAction) {

            // Store Selected Row
            this.selectedChkRow = this.getView().byId("checklistTable").getSelectedItem();

            var currentStepNo = this.oChecklist.getSelectedItem().getBindingContext().getProperty("StepNo");
            var currentStepStatus = this.oChecklist.getSelectedItem().getBindingContext().getProperty("StepStatusId");
            sap.ui.getCore().getModel("stepmodel").setProperty("/currentStepStatus",currentStepStatus);

            this.oComponent._oViewModel.setProperty("/CreateMode", true); //Make Add button enabled
                 this.getEventBus().publish("checklist", "refreshChecklistForm", {
                     context: oContext,
                     action: this._sUpdate
                 });

            this.setJSONmodels(currentStepNo);

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
                    //that._oMainController.setScreenBusyIndicator();
                    this._oFilterDialog.setBusy(true);
                       this._oModel.read("/Checklist",{
                        filters: this.aFilterBy,
                        success: this.chklistFilterCallback.bind(this),
                        error: function() {
                         this._oFilterDialog.setBusy(false);
                        }

                });

                 this._oFilterDialog.setModel(this._oModel);
                 this._oFilterDialog.setModel(this.getComponent().getModel("i18n"), "i18n");
                 var items = this._oFilterDialog.getFilterItems();

                    items.forEach(function(item, index) {
                        if (item.getId() === "stepDescFilter") {
                            that._oFilterDialog.getFilterItems()[index].bindAggregation("items", {
                                path: "filterModel>/uniqStepDesc",
                                sorter: null,
                                parameters: {},
                                template: new sap.m.ViewSettingsItem({
                                    text: "{filterModel>ChklstDescr}",
                                    key: "{filterModel>ChklstDescr}"
                                }),
                                filters: that.aFilterBy
                            });
                         }
                         if(item.getId()==="stepStatusFilter"){
                                that._oFilterDialog.getFilterItems()[index].bindAggregation("items", {
                                path: "filterModel>/uniqStepStatus",
                                sorter: null,
                                parameters: {},
                                template: new sap.m.ViewSettingsItem({
                                    key: "{filterModel>StepStatusId}",
                                    text:"{filterModel>StepStatus}"
                                }),
                            },this);

                        }
                    });
                }

                this._oFilterDialog.open();

            },

      chklistFilterCallback:function(oData){
            var that=this;
            var objStepStatus = {};
            var objStepDesc = {};
            var resultsArray=oData.results;
            for ( var i = 0, len = resultsArray.length; i < len; i++ ){
                if(!objStepStatus[resultsArray[i]['StepStatusId']]){
                    objStepStatus[resultsArray[i]['StepStatusId']] = resultsArray[i];
                }
            }
            var newArrObjStatus = [];
                for ( var key in objStepStatus ) {
                    newArrObjStatus.push(objStepStatus[key]);
                }

            var oFilterJson= new sap.ui.model.json.JSONModel({});
            oFilterJson.setProperty("/uniqStepStatus",newArrObjStatus);
                for ( var i = 0, len = resultsArray.length; i < len; i++ ){
                if(!objStepDesc[resultsArray[i]['StepId']]){
                 objStepDesc[resultsArray[i]['StepId']] = resultsArray[i];
                    }
                }
             var newArrObjDesc = [];
            
                for ( var key in objStepDesc ){
                     newArrObjDesc.push(objStepDesc[key]);
                    } 
                
                oFilterJson.setProperty("/uniqStepDesc",newArrObjDesc);

                this._oFilterDialog.setModel(oFilterJson,"filterModel");
                
                 this._oFilterDialog.setBusy(false);
           
        },

            
             /**
             * on handle confirm event
             */
            onHandleConfirm: function(oEvent) {
                this.selectedChkRow = null;
                if (oEvent.getParameters().filterString) {
                    var filterItems = oEvent.getParameter("filterItems");

                    this.aFilterBy = [];
                    this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));

                    filterItems.forEach(function(item, index) {
                        if (item.getId().indexOf("stepStatusFilter") > -1) {
                            this.aFilterBy.push(new Filter("StepStatusId", FilterOperator.EQ, item.getProperty("key")));
                        }
                        if (item.getId().indexOf("stepDescFilter") > -1) {
                            this.aFilterBy.push(new Filter("ChklstDescr", FilterOperator.EQ, item.getProperty("key")));
                        }
                    }.bind(this));

                    this.bindRows();
                    
                     
                }
            },
            onAddRow: function () {
                var that = this; 
                 this.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
                 this.oComponent._setViewModelProperty("AssignBtn_Visible", false);
                 this.oComponent._setViewModelProperty("SaveBtn_Visible", true);
                 
                if (!this._oChkListStepsDialog) {
                    this._oChkListStepsDialog = sap.ui.xmlfragment("chkFragId",this._sChkListStepsFrag, this);
                     this.getView().addDependent(this._oChkListStepsDialog);
                    }
                    this.aFilterBy = [];
                    this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));

                    this._oChkListStepsDialog.setModel(this._oModel);
                   
                    this._oChkListStepsDialog.setModel(this.getComponent().getModel("i18n"), "i18n");
             
                    this.oChklistStepTable=  sap.ui.core.Fragment.byId("chkFragId", "chklistStepTable");
                    this.oChklistStepTable.bindAggregation("items", {
                    path: "/" + this._sChecklistStepID,
                    template: this.oChkListTemplate,
                    filters: this.aFilterBy,
                    events:{
                        dataRequested : function (oEvent) {
                            var checklistDialog= sap.ui.core.Fragment.byId("chkFragId", "chklistStepDialog");
                            checklistDialog.setBusy(true);
                            //that._oMainController.setScreenBusyIndicator();
                            },
                        dataReceived: function (oEvent) {
                           // var that=this;
                           // that._oMainController.removeScreenBusyIndicator();
                           var checklistDialog= sap.ui.core.Fragment.byId("chkFragId", "chklistStepDialog");
                            checklistDialog.setBusy(false);
                            var sFormType= oEvent.getParameters("data").data.results[0].FormType;
                            var sProcessType= oEvent.getParameters("data").data.results[0].ProcessType;

                            var processTypeField =sap.ui.core.Fragment.byId("chkFragId", "idProcessType");
                            processTypeField.setProperty("text",sProcessType);
                            var formTypeField =sap.ui.core.Fragment.byId("chkFragId", "idFormType");
                            formTypeField.setProperty("text",sFormType);

                             }
                        }

                });                 

                    //var firstItem = this.getView().byId("checklistTable").getItems()[0]; 
                   // this.getView().byId("checklistTable").setSelectedItem(firstItem,false); 
               /*     var items=this.getView().byId("checklistTable").getItems();
                    items.forEach(function(item, index) {
                    this.oView.byId("checklistTable").setSelectedItem(items[index],false);
                    },this);*/
                 this._oChkListStepsDialog.open();

        },
    
        _handleChklistStepsDialogClose:function(oEvent){
            var that=this;
            var oSelectedItem = oEvent.getParameters("listItem").listItem;

                if (oSelectedItem) {
                //Populate Status ans Options Dropdowns  
                that.getEventBus().publish("checklist", "populatechkStatus", {
                  jsonMdl: null,
                  action: "CREATE"
                });
                that.getEventBus().publish("checklist", "populatechkOption", {
                  jsonMdl: null,
                  action: "CREATE"
                });
                this._oMainController.setScreenBusyIndicator();
                var oContext =oSelectedItem.getBindingContext().getObject();
              /*  var input = this.byId(this.inputId);*/
                this.aFilterBy = [];
                this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));
                var sStepId=oContext.StepId;
                var sStepKey=this._sStepKey;

               // var sPath = "/" + this._sChecklistCollection;

                var sPath ="/Checklist(StepId='" + sStepId + "',StepKey='" + sStepKey + "',StepNo='0000000000')";
             
                this._oModel.read(sPath,{
                   // filters: this.aFilterBy,
                    success: this.chklistSuccessCallback.bind(this),
                    error: function() {
                         that._oMainController.removeScreenBusyIndicator()
                    }

                });    
               this.oComponent._oViewModel.setProperty("/CreateMode", false); //Make Add button disabled
                var items=that.getView().byId("checklistTable").getItems();
                items.forEach(function(item, index) {
                that.oView.byId("checklistTable").setSelectedItem(items[index],false);
                    },this);
            
            }

                this.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
                this.oComponent._setViewModelProperty("AssignBtn_Visible", false);
                this.oComponent._setViewModelProperty("SaveBtn_Visible", true);
                this._oChkListStepsDialog.close();


        },
        chklistSuccessCallback:function(oData){
            var that=this;
          
            that._oMainController.removeScreenBusyIndicator();
            this.getEventBus().publish("checklist", "refreshChecklistForm", {
                     context: oData,
                     action: this._sCreate
                 });
        },
        
        /**
             * on reset filter event
             */
    onResetFilter: function() {
          this.selectedChkRow = null;

                this.aFilterBy = [];
                this.aFilterBy.push(new Filter("StepKey", FilterOperator.EQ, this._sStepKey));

                this.bindRows();

                if (this._oFilterDialog) { //Destroyed since no way reseting filter at code level
                    this._oFilterDialog.destroy();
                    this._oFilterDialog = null;
                }

                this.getEventBus().publish(this._sChannelId, "refreshChecklistForm", { 
                    context: null,
                    action: null
                });
                
            }

        });
    });