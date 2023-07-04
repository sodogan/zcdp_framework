/* globals $: false
 * jQuery: false
 * sap: false
 * window: false */
/*eslint-disable */
sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/ComponentContainer",
    "sap/ui/model/json/JSONModel",
    "sap/ui/ux3/ThingGroup",
    "sap/m/MessageToast",
    "aklc/cm/library/common/utils/Formatter",
    "sap/m/MessageBox",
  ],
  function (
    Controller,
    ComponentContainer,
    JSONModel,
    ThingGroup,
    MessageToast,
    Formatter,
    MsgBox
  ) {
    "use strict";
    return Controller.extend("aklc.cm.components.processApp.controller.Main", {
      _sProcessCollection: "/Application", //Process Collection
      _sStepsCollection: "ApplicationStep", //Step Collection
      _sPath: "", //Current context
      _sProcessKey: "", //Current Process
      _sStepKey: "", //Current Task
      _oProcessViewer: null, //Thing Inspector control
      _bNewProcess: false, // is new process
      _oViewModel: null, //View Model
      _sChannelId: "processApp", // Channel Id
      _sApplicationHold: "ApplicationHold", // ApplicationHold Entity
      _sApplicationButtons: "ApplicationButtons", // ApplicationButtons Entity
      _RejectionPopUp: "aklc.cm.components.processApp.fragments.RejectPopup", // Reject Fragment
      _RCOnHoldPopUp: "aklc.cm.components.processApp.fragments.RCOnHold", // RC On Hold Fragment
      _BCRFIOnHoldPopUp: "aklc.cm.components.processApp.fragments.BCRFIOnHold", // BC RFI On Hold Fragment
      _BCNonRFIOnHoldPopUp:
        "aklc.cm.components.processApp.fragments.BCNonRFIOnHold", // BC Non RFI On Hold
      _RCOffHoldPopUp: "aklc.cm.components.processApp.fragments.RCOffHold", // RC Off Hold Fragment
      _RCRFIOffHoldPopUp:
        "aklc.cm.components.processApp.fragments.RCRFIOffHold", // RC RFI Off Hold Fragment
      _BCNonRFIOffHold:
        "aklc.cm.components.processApp.fragments.BCNonRFIOffHold", // BC Non RFI Off Hold Fragment
      _AlertCriticalPopup:
        "aklc.cm.components.processApp.fragments.AlertCriticalPopup", // Alert Critical Pop up
      _sSAVE: "SAVE", // SAVE Action
      _sAccept: "ACCEPT", // ACCEPT Action
      _sReject: "REJECT", // REJECT Action
      _sOnHold: "ONHOLD", // ON HOLD Action
      _sOffHold: "OFFHOLD", // OFF HOLD Action
      _sRCApplicationType: "RM", // RC Application Type
      _sBCApplicationType: "BC", // BC Application Type
      _sSave: "Save", // Save Action
      _sCOMPLETE: "COMPLETE", // COMPLETE Action
      _sComplete: "Complete", // COMPLETE Action
      _sHTMLTag: "<HTML>", // HTML Tag for Alert Pop up message
      _oHeaderView: "", // Header View

      //R-UX Document Management - re-use correspondence
      _sPROPERTYCollection: "Correspondence",
      _sPartiesCollection: "AssignedPartners",
      _sApplicationLinksCollection: "ApplicationLinks",
      _sCORRESPONDENCE_ID: "correspondence",
      _aButtonIDs: ["TEMPLATE", "UPLOAD"],
      _sUpdate: "UPDATE",
      _sCreate: "CREATE",
      _sFilterFrag: "aklc.cm.components.correspond.fragments.Filter",
      _sAPSearchHelp:
        "aklc.cm.components.correspond.fragments.AssignedPartners",
      _aDocMgt: {
        docCount: 0,
        docCountChange: false,
        docUploaded: false,
        noCheckReqd: false,
        showRFIPopup: "",
      },
      //End RUX Document Management

      /**
       * on init
       **/
      onInit: function () {
        this._oComponent = sap.ui.component(
          sap.ui.core.Component.getOwnerIdFor(this.getView())
        );
        this._oRouter = sap.ui.core.UIComponent.getRouterFor(this);
        this._oRouter.attachRouteMatched(this.routeMatched.bind(this));
        this._oProcessViewer = this.getView().byId("ProcessViewer");
        this._oModel = this._oComponent.getModel();

        this._oContainer = new ComponentContainer(this.createId("CONTAINTER"), {
          handleValidation: true,
        });
        this._oViewModel = new JSONModel({});
        this.getView().setModel(this._oViewModel, "vm");

        var stepJson = new JSONModel({});
        sap.ui.getCore().setModel(stepJson, "stepmodel");

        // register the OData model as the message processor
        sap.ui
          .getCore()
          .getMessageManager()
          .registerMessageProcessor(this._oModel);

        this.getView().setBusy(true);

        // toolbar is set after rendering, need to set header after
        this._oProcessViewer.addDelegate({
          onAfterRendering: this.setHeaderContent.bind(this),
        });

        this._oProcessViewer.oMainController = this;
        this._oRejectPopup;
        this._oRCOnHoldPopup;
        this._oBCRFIOnHoldPopup;
        this._oBCNonRFIOnHoldPopup;
        this._oRCOffHoldPopup;
        this._oRCRFIOffHoldPopup;
        this._oBCNonRFIOffHoldPopup;
        this._oAlertMessagePopup;
        this.Formatter = Formatter;
        this._bValidationFailure = false;

        //RUX Document Management
        if (!this.oPSTemplate) {
          this.oPSTemplate = new sap.m.ColumnListItem({
            // Template used for Partner Search Dialog
            cells: [
              new sap.m.Text({
                text: "{PartnerFunctionText}",
              }),
              new sap.m.ObjectIdentifier({
                text: "{FirstName} {LastName}",
              }),
              new sap.m.Text({
                text: "{Address1}, {Address2}, {City}, {State}, {Country}, {Postcode}",
              }),
            ],
          });
          this.oPSTemplate.templateShareable = true;
        }
        //End RUX Document Management
      },

      /**
       * Route Matched
       * @param  {object} oEvent event object
       * @return {boolean} boolean
       */
      routeMatched: function (oEvent) {
        switch (oEvent.getParameter("name")) {
          case "empty":
            return this.onEmptyRoute(oEvent);
          case "process":
            return this.onProcessRoute(oEvent);
          default:
            return false;
        }
      },

      /**
       * Navigate to step via route
       * @param  {string} sProcesKey Process Key
       * @param  {string} sStepKey   Step Key
       */
      navToProcess: function (sProcesKey, sStepKey) {
        this._oRouter.navTo(
          "process",
          {
            processkey: sProcesKey,
            stepkey: sStepKey,
          },
          true
        );
      },

      /**
       * On empty route
       */
      onEmptyRoute: function () {
        //Empty Route
        this.navToProcess(
          "005056BC-09BD-1ED5-96E6-D431FFF31420",
          "MDA1MDU2QkMwOUJEMUVENTk2RTZENDMxRkZGMzE0MjAsREVU"
        );
      },

      /**
       * Process route
       * @param  {object} oEvent event object
       */
      onProcessRoute: function (oEvent) {
        var bReload = false;

        var oArguments = oEvent.getParameter("arguments");

        // this._sNextStep = undefined;

        // determine if new process
        if (this._sProcessKey !== oArguments.processkey) {
          this._sProcessKey = oArguments.processkey;
          bReload = true;
          this._bNewProcess = true;

          // Get the Critical Alert Pop up message and open the Pop up if message is exist
          this._getAlertMessages();

          //Get RFI Popup messages relevance and content
          this._getRFIPopup();
        } else {
          this._bNewProcess = false;
        }

        if (oArguments.stepkey !== "Default") {
          this._sStepKey = oArguments.stepkey;
        } else {
          bReload = true;
        }

        this.getData(bReload);
      },

      /**
       * Retrieve Process entity with Steps Entity Inline
       * @param  {boolean} bReload reload data
       */
      getData: function (bReload) {
        this._sPath =
          this._sProcessCollection + "(guid'" + this._sProcessKey + "')";
        var fnCallback = this.bindView.bind(this);
        var oParams = {
          expand: this._sStepsCollection,
        };
        this.getView().setBusy(true);
        this._oModel.createBindingContext(
          this._sPath,
          null,
          oParams,
          fnCallback,
          bReload
        );
      },

      /**
       * Return context path for step
       * @return {object}          Context context of current path
       */
      getStepPathContext: function () {
        var sPath =
          "/" +
          this._oModel.createKey(this._sStepsCollection, {
            ApplicationKey: this._sProcessKey,
            StepKey: this._sStepKey,
          });
        return this._oModel.getContext(sPath);
      },

      /**
       * Set the step key selected
       * @param {number} sStepKey Step Key
       */
      setSelectedFacet: function (sStepKey) {
        var fnFilter = function (item) {
          return item.getKey() === sStepKey;
        };
        var oItem = this._oProcessViewer.getFacets().filter(fnFilter)[0];
        this._oProcessViewer.setSelectedFacet(oItem);
      },

      /**
       * Find the next component
       * @param {object} oCompname - Current Component Name
       * @return {boolean}  true or false
       */
      isNextComp: function (oCompname) {
        var sPath =
          "/" +
          this._oModel.createKey(this._sStepsCollection, {
            ApplicationKey: this._sProcessKey,
            StepKey: this._sNextStep,
          });
        var sNextStep = this._oModel.getContext(sPath).getObject();

        if (oCompname === sNextStep.Component) {
          document.location.reload(true);
          return false;
        } else {
          return false;
        }
      },

      /**
       * bind view with the new context
       * @param  {object} oContext  Context oject
       * @return {object}           Navigation
       */
      bindView: function (oContext) {
        var sCurrentAppStepNo = oContext.getProperty("AzcstepNo");
        sap.ui
          .getCore()
          .getModel("stepmodel")
          .setProperty("/currentAppStepNo", sCurrentAppStepNo);
        //this.oComponent.getModel("vm").setProperty("/CurrentAppStepNo",sCurrentAppStepNo);
        // this.oComponent._setViewModelProperty("CurrentAppStepNo", sCurrentAppStepNo);

        this._oProcessViewer.setVisible(true);
        this.getView().setBusy(false);

        if (!oContext) {
          return false; //show error message
        }

        if (this._sNextStep) {
          //While navigating from one Questionnaire to other
          // Questionnaire destroy the current component
          if (this.isNextComp("Questionnaires")) {
            this._bNewProcess = true;
          }
        }

        // use view model to render menu - avoid rebindings
        if (this._bNewProcess) {
          this.newProcess(oContext);
        }

        // set the number of active steps
        this._oProcessViewer.setActiveSteps(this.getActiveSteps(oContext));

        // if step key wasnt provided navigate to the active step key
        if (!this._sStepKey) {
          return this.navToProcess(
            this._sProcessKey,
            this.getCurrentKey(oContext)
          );
        }

        this.setSelectedFacet(this._sStepKey);

        this.setContent(this.getStepPathContext());

        this._oComponent
          .getEventBus()
          .publish(this._sChannelId, "contextChanged", {
            context: oContext,
          });
      },

      /**
       * on process change rebuild icon menu
       * @param  {object} oContext   context object
       */
      newProcess: function (oContext) {
        var fnMap = function (obj) {
          return {
            Description: obj.Description,
            StepKey: obj.StepKey,
            Icon: obj.Icon,
          };
        };

        var aSteps = this._oModel
          .getProperty(null, oContext, true)
          [this._sStepsCollection].results.map(fnMap);
        this._oViewModel.setData({
          Steps: aSteps,
        });
      },

      /**
       * get the number of currently active steps
       * @param  {object} oContext  context
       * @return {number}     active steps
       */
      getActiveSteps: function (oContext) {
        var aSteps = this._oModel.getProperty(this._sStepsCollection, oContext);
        var fnFilter = function (sPath) {
          return this._oModel.getProperty("/" + sPath).Active;
        }.bind(this);

        return aSteps.filter(fnFilter).length;
      },

      /**
       * Get current the key of the current step
       * @param  {object} oContext context
       * @return {string}          step key
       */
      getCurrentKey: function (oContext) {
        var aSteps = this._oModel.getProperty(this._sStepsCollection, oContext);
        var sDefaultStepPath = "/" + aSteps[0];

        var fnFilter = function (sPath) {
          return this._oModel.getProperty("/" + sPath).Current;
        }.bind(this);

        var sCurrentStepPath = aSteps.filter(fnFilter)[0]
          ? "/" + aSteps.filter(fnFilter)[0]
          : "";
        if (!sCurrentStepPath) {
          sCurrentStepPath = sDefaultStepPath;
        }

        return this._oModel.getProperty(sCurrentStepPath).StepKey;
      },

      /**
       * check valid
       * @return {object} Promise
       */
      checkValid: function () {
        var oDefer = function () {
          var result = {};
          result.promise = new Promise(function (resolve, reject) {
            result.resolve = resolve;
            result.reject = reject;
          });
          return result;
        };

        var oData = {};
        oData.WhenValid = oDefer();
        if (this._oSubscription) {
          this._oComponent
            .getEventBus()
            .publish(
              this._oSubscription.channel,
              this._oSubscription.events.checkValid,
              oData
            );
        } else {
          oData.WhenValid.resolve("Success");
        }
        return oData.WhenValid.promise;
      },

      /**
       * Save changes
       * @param  {boolean} bValidationRequired  Validation flag
       * @return {object} Promise
       */
      _saveChanges: function (bValidationRequired) {
        var oDefer = function () {
          var result = {};
          result.promise = new Promise(function (resolve, reject) {
            result.resolve = resolve;
            result.reject = reject;
          });
          return result;
        };

        var oData = {};
        oData.WhenValid = oDefer();
        oData.ValidationRequired = "";
        oData.ValidationRequired = bValidationRequired;

        if (this._oSubscription) {
          this._oComponent
            .getEventBus()
            .publish(
              this._oSubscription.channel,
              this._oSubscription.events.submitChanges,
              oData
            );
        } else {
          oData.WhenValid.resolve("Success");
        }
        return oData.WhenValid.promise;
      },

      /**
       * check form data all fields validations
       * @return {object} Promise
       */
      formDataAllFieldsValidation: function () {
        var oDefer = function () {
          var result = {};
          result.promise = new Promise(function (resolve, reject) {
            result.resolve = resolve;
            result.reject = reject;
          });
          return result;
        };

        var oData = {};
        oData.WhenValid = oDefer();
        if (this._oSubscription) {
          this._oComponent
            .getEventBus()
            .publish(
              this._oSubscription.channel,
              this._oSubscription.events.formDataValidateAllFields,
              oData
            );
        } else {
          oData.WhenValid.resolve("Success");
        }
        return oData.WhenValid.promise;
      },
      /**
       * submit changes
       * @param  {function} fReturnValue   on Return Value
       * @return {object}             chainable promise object
       */
      _submitChanges: function (fReturnValue) {
        // Define deferred object to register callbacks
        var oDeferred = new jQuery.Deferred();

        // Set the Global flag based on the Validation status
        if (fReturnValue === "Error") {
          this._bValidationFailure = true;
        } else {
          this._bValidationFailure = false;
        }
        // return new Promise(function(fnResolve, fnReject) {

        var oContext = this.getStepPathContext();
        var bFlag = false;
        var sStatus = "";
        var bNextStepCrm = false;
        var bFormDataValidationFlag = false;

        if (this._bValidationFailure === false) {
          bFlag = true;
          sStatus = "S";
        } else {
          bFlag = false;
          sStatus = "E";
        }

        // set current step active
        if (!oContext.getProperty("Active", oContext)) {
          this._oModel.setProperty("Active", bFlag, oContext);
        }

        oContext.getObject().Status = sStatus;
        this._oModel.setProperty("Status", sStatus, oContext);

        if (
          this._bValidationFailure === true &&
          oContext.getProperty().Component === "formData"
        ) {
          // Change the _bValidationFailure as "false", since user can navigate it to next user story even in error sceanrio for "Form Data"
          this._bValidationFailure = false;
        }

        if (this._bValidationFailure === false) {
          var sPath =
            "/" +
            this._oModel.createKey(this._sStepsCollection, {
              ApplicationKey: this._sProcessKey,
              StepKey: this._sNextStep,
            });

          // Flag for to check whether Formdata validation needs to be done or not
          if (oContext.getProperty().Component === "formData") {
            bFormDataValidationFlag = true;
          }

          // Set the Success status for CrmUrl field
          if (this._oModel.getContext(sPath).getObject().CrmUrl !== "") {
            this._oModel.setProperty(
              "Active",
              true,
              this._oModel.getContext(sPath)
            );
            this._oModel.getContext(sPath).getObject().Status = "S";
            this._oModel.setProperty(
              "Status",
              "S",
              this._oModel.getContext(sPath)
            );
            bNextStepCrm = true;
          }
        }

        if (this._oModel.hasPendingChanges()) {
          var oController = this;

          // Set Busy Indicator
          this._oProcessViewer.setBusyIndicatorDelay(0);
          this._oProcessViewer.setBusy(true);

          this._oModel.submitChanges({
            success: function () {
              oController.getData(true);

              /*   var aFilterBy = [];
							     aFilterBy.push(new sap.ui.model.Filter("StepKey", sap.ui.model.FilterOperator.EQ, oController._sStepKey));

							       oController._oModel.read("/SubSteps", {
							         urlParameters: {
							             $expand: "FormData/FormDataLookup"
							         } ,
							         filters: aFilterBy
							     }); */

              // Rerender the NavBar Icons
              oController.refreshNavBarIcons();

              if (bNextStepCrm === true) {
                bNextStepCrm = false;
                // Set the Busy Indicator as false, only if next step is CRM UI
                oController._oProcessViewer.setBusy(false);
              }

              if (bFormDataValidationFlag === true) {
                // Validate all fields in Form Data user story
                oController.formDataAllFieldsValidation();
              }

              // Resolve promise
              oDeferred.resolve();
            },
            error: function () {
              if (bNextStepCrm === true) {
                bNextStepCrm = false;
                // Set the Busy Indicator as false, only if next step is CRM UI
                oController._oProcessViewer.setBusy(false);
              }
            },
          });
        } else {
          // fnResolve();
          // Resolve promise
          oDeferred.resolve();
        }

        // }.bind(this));
        // Return jQuery promise
        return oDeferred.promise();
      },

      /**
       * On Facet selected set the applicable content
       *  @param  {object} oEvent event object
       */
      onFacetSelected: function (oEvent) {
        var that = this;
        var oChangedEntities = this._oModel.mChangedEntities;
        var oChangedPath = {
          sPath: "",
          sValue: "",
        };
        var oRemoveEntity = [];

        for (var key in oChangedEntities) {
          oChangedPath = {};
          if (oChangedEntities.hasOwnProperty(key)) {
            oChangedPath.sPath = "/" + key;
            var oSubStep = key.split("(");

            if (oSubStep[0] === "QFormData") {
              oRemoveEntity.push(oChangedPath.sPath);
              if (oChangedEntities[key].String) {
                oChangedPath.sValue = oChangedEntities[key].String;
              } else {
                oChangedPath.sValue = "";
              }
              var oChangeData = that._oModel.getData(oChangedPath.sPath);
              oChangeData.String = oChangedPath.sValue;

              var oEntry = {
                Active: oChangeData.Active,
                Attribute: oChangeData.Attribute,
                Boolean: oChangeData.Boolean,
                Currency: oChangeData.Currency,
                Date: oChangeData.Date,
                Dependents: oChangeData.Dependents,
                DependentsValue: oChangeData.DependentsValue,
                Dirty: oChangeData.Dirty,
                Enabled: oChangeData.Enabled,
                Label: oChangeData.Label,
                Number: oChangeData.Number,
                Placeholder: oChangeData.Placeholder,
                Required: oChangeData.Required,
                StepKey: oChangeData.StepKey,
                String: oChangeData.String,
                SubStep: oChangeData.SubStep,
                Tooltip: oChangeData.Tooltip,
                Type: oChangeData.Type,
                ValuePath: oChangeData.ValuePath,
                Visible: oChangeData.Visible,
                Year: oChangeData.Year,
              };
              //  this._sStepKey = oChangeData.StepKey;
              that._oModel.update(oChangedPath.sPath, oEntry);
            }

            if (oSubStep[0] === "QSubSteps") {
              oRemoveEntity.push(oChangedPath.sPath);
              if (oChangedEntities[key].Selected) {
                oChangedPath.sValue = oChangedEntities[key].Selected;
              } else {
                oChangedPath.sValue = false;
              }
              var oChangeData = that._oModel.getData(oChangedPath.sPath);
              oChangeData.Selected = oChangedPath.sValue;
              var oEntry = {
                StepKey: oChangeData.StepKey,
                SubStep: oChangeData.SubStep,
                Label: oChangeData.Label,
                Active: oChangeData.Active,
                Selected: oChangeData.Selected,
                Completed: oChangeData.Completed,
                Dirty: oChangeData.Dirty,
                Visible: oChangeData.Visible,
              };
              //     this._sStepKey = oChangeData.StepKey;
              that._oModel.update(oChangedPath.sPath, oEntry);
            }
          }
        }
        this._oModel.resetChanges(oRemoveEntity);
        // get next step id from event
        this._sNextStep = oEvent.getParameter("key");

        var fnNav = function () {
          if (this._bValidationFailure === false) {
            // Remove UI messages if it not Form Data when navigate it to next user story
            var oMessageManager = sap.ui.getCore().getMessageManager();
            var iLength = oMessageManager.getMessageModel().oData.length;
            var sTarget = "";
            if (iLength > 0) {
              $.each(
                oMessageManager.getMessageModel().oData,
                function (index, value) {
                  sTarget = value.target;
                  // Remove UI messages if it not Form Data user story messages
                  if (sTarget && sTarget.indexOf("/FormData") === -1) {
                    sap.ui.getCore().getMessageManager().removeMessages(value);
                  }
                  // oMessageManager.removeAllMessages();
                }
              );
            }

            var sPath =
              "/" +
              this._oModel.createKey(this._sStepsCollection, {
                ApplicationKey: this._sProcessKey,
                StepKey: this._sNextStep,
              });

            var oCurrentContext = this._oModel.getContext(sPath).getObject();

            // Get the Next or Previous step from ProcessViewer for CRM URL scenarion and set it to _sNextStep
            if (oCurrentContext.CrmUrl !== "") {
              // To Open the New window for CRM Linked application
              window.open(oCurrentContext.CrmUrl, "_blank");
              this._oProcessViewer.sPressedButton = " ";
            }

            //Differentiate between nav to process and next step
            this.navToProcess(this._sProcessKey, this._sNextStep);
          } else {
            this.setContent(this.getStepPathContext());
            this._bValidationFailure = false;
          }
        }.bind(this);

        var fNSubmit = function (fReturnValue) {
          var that = this;
          // Submit the changes only if Success scenario
          this._submitChanges(fReturnValue).done(function () {
            // Navigate it to next user story if successful submit changes
            var oContext = that.getStepPathContext();
            var oAppChangeData = that._oModel.getData(oContext.sPath);
            var oAppEntry = {
              ApplicationKey: oAppChangeData.ApplicationKey,
              CrmUrl: oAppChangeData.CrmUrl,
              Status: oAppChangeData.Status,
              StepKey: oAppChangeData.StepKey,
              Description: oAppChangeData.Description,
              Icon: oAppChangeData.Icon,
              Component: oAppChangeData.Component,
              Active: oAppChangeData.Active,
              Current: oAppChangeData.Current,
              Dirty: oAppChangeData.Dirty,
            };

            that._oModel.update(oContext.sPath, oAppEntry);
            fnNav();
          });
        }.bind(this);

        // trigger validation on step, if successful save and navigate
        this.checkValid().then(fNSubmit); //.then(fnNav);
      },

      /**
       * Set the Header content based on the selected key
       *
       */
      setHeaderContent: function () {
        var oHeaderView = sap.ui.view({
          viewName: "aklc.cm.components.processApp.view.Header",
          type: sap.ui.core.mvc.ViewType.JS,
        });
        oHeaderView.setModel(this._oModel);
        oHeaderView.setModel(this._oComponent.getModel("i18n"), "i18n");

        //Upgrade to 1.44 date formatter isnot working
        var oJModel = new sap.ui.model.json.JSONModel();
        oHeaderView.setModel(oJModel, "oFDate");

        var sPath = this._oModel.createKey(this._sProcessCollection, {
          ApplicationKey: this._sProcessKey,
        });

        // Format the Header H Over Dates
        var oHeaderContext = this._oModel.getContext(sPath);
        var oData = this.formatHeaderDates(oHeaderContext);

        //Upgrade to 1.44 date formatter isnot working
        var oDate = this.formatHeaderDatesUpGrade(oHeaderContext);
        oJModel.setData(oDate);

        // Set the Application Header Title
        document.title = this.getI18NText(
          oHeaderContext.getObject().StepDescription
        );

        oHeaderView.setBindingContext(oData);

        this._oHeaderView = oHeaderView;

        if (this._oModel.getContext(sPath).getObject().NoClock === "X") {
          // Hide the Statutory Clock based on the Back end flag
          var oLayout = sap.ui.getCore().byId("idHeaderLayout");
          var aCells = oLayout.getRows()[0].getCells();
          oLayout.getRows()[0].removeCell(aCells[2]);

          // Hide the Days Icon based on the Back end flag
          var oDaysLayout = sap.ui.getCore().byId("idDaysLayout");
          var oRow = oDaysLayout.getAggregation("rows")[2];
          oDaysLayout.removeRow(oRow);
        }

        // Add the Tooltip for Step Status, if Step Status is "On Hold"
        var sStepStatus = this._oModel.getContext(sPath).getObject().StepStatus;
        if (sStepStatus === "On Hold") {
          var sToolTipText;
          var si18nText;
          if (this._oModel.getContext(sPath).getObject().OnHoldReason1 !== "") {
            si18nText = this.getI18NText("OnHoldReason1");
            sToolTipText =
              si18nText +
              this._oModel.getContext(sPath).getObject().OnHoldReason1;
          }
          if (this._oModel.getContext(sPath).getObject().OnHoldReason2 !== "") {
            si18nText = this.getI18NText("OnHoldReason2");
            sToolTipText =
              sToolTipText +
              "\n" +
              si18nText +
              this._oModel.getContext(sPath).getObject().OnHoldReason2;
          }

          if (this._oModel.getContext(sPath).getObject().OnHoldReason3 !== "") {
            si18nText = this.getI18NText("OnHoldReason3");
            sToolTipText =
              sToolTipText +
              "\n" +
              si18nText +
              this._oModel.getContext(sPath).getObject().OnHoldReason3;
          }

          if (this._oModel.getContext(sPath).getObject().OnHoldReason4 !== "") {
            si18nText = this.getI18NText("OnHoldReason4");
            sToolTipText =
              sToolTipText +
              "\n" +
              si18nText +
              this._oModel.getContext(sPath).getObject().OnHoldReason4;
          }

          if (this._oModel.getContext(sPath).getObject().OnHoldReason5 !== "") {
            si18nText = this.getI18NText("OnHoldReason5");
            sToolTipText =
              sToolTipText +
              "\n" +
              si18nText +
              this._oModel.getContext(sPath).getObject().OnHoldReason5;
          }

          var oRichTooltip = new sap.ui.commons.RichTooltip({
            text: sToolTipText,
            title: this.getI18NText("OnHoldTitle"),
          });

          if (sap.ui.getCore().byId("idStepStatus")) {
            sap.ui.getCore().byId("idStepStatus").setTooltip(oRichTooltip);
          }
        } else {
          var oStepStatus = sap.ui.getCore().byId("idStepStatus");
          if (oStepStatus) {
            // Remove the Tooltip for Step Status, if Step Status is not "On Hold"
            oStepStatus.setTooltip();
          }
        }

        var oHeaderContent = new ThingGroup({
          content: [oHeaderView, this._oProcessViewer._oActionMessages],
        });

        this._oProcessViewer.addHeaderContent(oHeaderContent);

        // Assign Current Step Key to Header View variable. since this will be used for getting Application Link  for  CRM_UI
        var oHeaderViewController = oHeaderView.getController();
        oHeaderViewController.sCurrentStepKey = this._sStepKey;

        // Set the On Hold Reason HOVer Visibility based on the On Hold Status
        // this._setOnHoldReasonHOverVisibility();
      },

      /**
       * Change the Reason On Hold HOver visibility based on the On Hold Status
       **/
      _setOnHoldReasonHOverVisibility: function () {
        // Get the Current Application entity path based on the Application Key
        var sPath = this._oModel.createKey(this._sProcessCollection, {
          ApplicationKey: this._sProcessKey,
        });

        // Add the Tooltip for Step Status, if Step Status is "On Hold"
        var sStepStatus = this._oModel.getContext(sPath).getObject().StepStatus;

        if (sStepStatus === this.getI18NText("StepStatusOnHold")) {
          var sToolTipText;
          var si18nText;
          if (this._oModel.getContext(sPath).getObject().OnHoldReason1 !== "") {
            si18nText = this.getI18NText("OnHoldReason1");
            sToolTipText =
              si18nText +
              this._oModel.getContext(sPath).getObject().OnHoldReason1;
          }
          if (this._oModel.getContext(sPath).getObject().OnHoldReason2 !== "") {
            si18nText = this.getI18NText("OnHoldReason2");
            sToolTipText =
              sToolTipText +
              "\n" +
              si18nText +
              this._oModel.getContext(sPath).getObject().OnHoldReason2;
          }

          if (this._oModel.getContext(sPath).getObject().OnHoldReason3 !== "") {
            si18nText = this.getI18NText("OnHoldReason3");
            sToolTipText =
              sToolTipText +
              "\n" +
              si18nText +
              this._oModel.getContext(sPath).getObject().OnHoldReason3;
          }

          if (this._oModel.getContext(sPath).getObject().OnHoldReason4 !== "") {
            si18nText = this.getI18NText("OnHoldReason4");
            sToolTipText =
              sToolTipText +
              "\n" +
              si18nText +
              this._oModel.getContext(sPath).getObject().OnHoldReason4;
          }

          if (this._oModel.getContext(sPath).getObject().OnHoldReason5 !== "") {
            si18nText = this.getI18NText("OnHoldReason5");
            sToolTipText =
              sToolTipText +
              "\n" +
              si18nText +
              this._oModel.getContext(sPath).getObject().OnHoldReason5;
          }

          var oRichTooltip = new sap.ui.commons.RichTooltip({
            text: sToolTipText,
            title: this.getI18NText("OnHoldTitle"),
          });

          if (sap.ui.getCore().byId("idStepStatus")) {
            sap.ui.getCore().byId("idStepStatus").setTooltip(oRichTooltip);
          }
        } else {
          var oStepStatus = sap.ui.getCore().byId("idStepStatus");
          if (oStepStatus) {
            // Remove the Tooltip for Step Status, if Step Status is not "On Hold"
            oStepStatus.setTooltip();
          }
        }
      },

      /**
       * Set the facet content based on the selected key
       * @param {object} oContext context
       */
      setContent: function (oContext) {
        var oStep = this._oModel.getProperty("", oContext);
        var sComponentPath = "aklc.cm.components.";

        //remove existing content
        this._oProcessViewer.removeAllFacetContent();

        var oFacetContent = new sap.ui.ux3.ThingGroup({
          title: oStep.Description,
        });

        // Create UI Component only for Non CRM UI, since CRM UI will be opened seperate browser
        if (oStep.CrmUrl === "") {
          var sId = this.createId("COMP_" + oStep.Component);
          var sCompName = sComponentPath + oStep.Component;
          var oComponent = this.getComponentById(sId, sCompName);

          //While navigating from one Questionnaire to other
          // Questionnaire destroy the current component
          if (this._sNextStep) {
            if (this.isNextComp("Questionnaires")) {
              oComponent.destroy();
              oComponent = this.getComponentById(sId, sCompName);
            }
          }

          this._oContainer.setComponent(oComponent);

          oFacetContent.bindElement(oContext.getPath());
          oFacetContent.addContent(this._oContainer);
          this._oProcessViewer.addFacetContent(oFacetContent);

          this._oSubscription = oComponent.getEventBusSubscription();
          this._oComponent
            .getEventBus()
            .publish(
              this._oSubscription.channel,
              this._oSubscription.events.contextChanged,
              {
                context: oContext,
                controller: this,
              }
            );

          // // Create ApplicationAction Sheet buttons
          // this.createActionSheetButtons();
        }

        // Set the On Hold Reason HOVer Visibility based on the On Hold Status
        this._setOnHoldReasonHOverVisibility();

        // Set the Dates HOVer in Header View
        if (this._oHeaderView) {
          var oHeaderContext = this._oHeaderView.getBindingContext();
          this.formatHeaderDates(oHeaderContext);
          this.formatHeaderDatesUpGrade(oHeaderContext);
        }

        return;
      },

      /**
       * Get Component By ID
       * @param  {string} sId        Component ID
       * @param  {string} sCompName  Component name
       * @return {object}            Component component found
       */
      getComponentById: function (sId, sCompName) {
        var oComponent = sap.ui.getCore().getComponent(sId);
        if (!oComponent) {
          oComponent = sap.ui.component({
            name: sCompName,
            id: sId,
            componentData: {
              model: this._oModel,
              eventBus: this._oComponent.getEventBus(),
            },
          });
        }
        return oComponent;
      },

      /**
       * Create Application Footer Action Sheet Buttons
       * @return {jQuery.Promise} <code>jQuery Promise</code> which is resolved once create operation is successful
       */
      createActionSheetButtons: function () {
        // Define deferred object to register callbacks
        var oDeferred = new jQuery.Deferred();

        var sQuery = "StepKey eq '" + this._sStepKey + "'";

        // Get the data
        var oController = this;
        this._oModel.read("/ApplicationButtons", {
          urlParameters: {
            $filter: sQuery,
          },
          success: function (oData) {
            var oActionButtons = {};
            oActionButtons.results = [];
            var i = 0;
            $.each(oData.results, function (index, value) {
              oActionButtons.results[i] = value;
              i++;
            });

            oController._oButtonsModel = new sap.ui.model.json.JSONModel({
              ApplicationButtons: oActionButtons,
            });

            oController
              .getView()
              .setModel(oController._oButtonsModel, "ApplicationButtons");

            // Resolve promise
            oDeferred.resolve();
          },
        });

        // Return jQuery promise
        return oDeferred.promise();
      },

      /**
       * Handle Footer Button actions
       * @param {object} oEvent Button action event
       */
      onPressActionSheetOptions: function (oEvent) {
        var that = this;
        var oChangedEntities = this._oModel.mChangedEntities;
        var oChangedPath = {
          sPath: "",
          sValue: "",
        };
        var oRemoveEntity = [];

        for (var key in oChangedEntities) {
          oChangedPath = {};
          if (oChangedEntities.hasOwnProperty(key)) {
            oChangedPath.sPath = "/" + key;
            var oSubStep = key.split("(");

            if (oSubStep[0] === "QFormData") {
              oRemoveEntity.push(oChangedPath.sPath);
              if (oChangedEntities[key].String) {
                oChangedPath.sValue = oChangedEntities[key].String;
              } else {
                oChangedPath.sValue = "";
              }
              var oChangeData = that._oModel.getData(oChangedPath.sPath);
              oChangeData.String = oChangedPath.sValue;

              var oEntry = {
                Active: oChangeData.Active,
                Attribute: oChangeData.Attribute,
                Boolean: oChangeData.Boolean,
                Currency: oChangeData.Currency,
                Date: oChangeData.Date,
                Dependents: oChangeData.Dependents,
                DependentsValue: oChangeData.DependentsValue,
                Dirty: oChangeData.Dirty,
                Enabled: oChangeData.Enabled,
                Label: oChangeData.Label,
                Number: oChangeData.Number,
                Placeholder: oChangeData.Placeholder,
                Required: oChangeData.Required,
                StepKey: oChangeData.StepKey,
                String: oChangeData.String,
                SubStep: oChangeData.SubStep,
                Tooltip: oChangeData.Tooltip,
                Type: oChangeData.Type,
                ValuePath: oChangeData.ValuePath,
                Visible: oChangeData.Visible,
                Year: oChangeData.Year,
              };
              //  this._sStepKey = oChangeData.StepKey;
              that._oModel.update(oChangedPath.sPath, oEntry);
            }

            if (oSubStep[0] === "QSubSteps") {
              oRemoveEntity.push(oChangedPath.sPath);
              if (oChangedEntities[key].Selected) {
                oChangedPath.sValue = oChangedEntities[key].Selected;
              } else {
                oChangedPath.sValue = false;
              }
              var oChangeData = that._oModel.getData(oChangedPath.sPath);
              oChangeData.Selected = oChangedPath.sValue;
              var oEntry = {
                StepKey: oChangeData.StepKey,
                SubStep: oChangeData.SubStep,
                Label: oChangeData.Label,
                Active: oChangeData.Active,
                Selected: oChangeData.Selected,
                Completed: oChangeData.Completed,
                Dirty: oChangeData.Dirty,
                Visible: oChangeData.Visible,
              };
              //     this._sStepKey = oChangeData.StepKey;
              that._oModel.update(oChangedPath.sPath, oEntry);
            }
          }
        }
        this._oModel.resetChanges(oRemoveEntity);

        var sQuery = "StepKey eq '" + this._sStepKey + "'";
        var sAction = oEvent.getSource().getInfo();
        var oController = this;
        var oMessageManager = sap.ui.getCore().getMessageManager();
        var iLength = oMessageManager.getMessageModel().oData.length;
        var bUIValidationFlag = false;
        var oContext = oEvent
          .getSource()
          .getBindingContext("ApplicationButtons");
        var oButtons = oContext.getObject();

        var sCurrentPath =
          "/" +
          this._oModel.createKey(this._sStepsCollection, {
            ApplicationKey: this._sProcessKey,
            StepKey: this._sStepKey,
          });

        var fNContinue = function (fReturnValue) {
          if (iLength > 0) {
            $.each(
              oMessageManager.getMessageModel().oData,
              function (index, value) {
                // check whether UI validation message found or not
                if (!value.code && value.technical === false) {
                  bUIValidationFlag = true;
                  return false;
                }
              }
            );
          }

          if (fReturnValue !== "Error" && bUIValidationFlag === false) {
            // Get the Footer Action button fragment reference
            var oFooterActionButtonFragment =
              this._oProcessViewer.getFooterActionButtonFragmentReference();

            // Get the Application Type
            var sPath = this._oModel.createKey(this._sProcessCollection, {
              ApplicationKey: this._sProcessKey,
            });

            var sApplicationType = this._oModel
              .getContext(sPath)
              .getObject().ApplicationType;

            switch (sAction) {
              case this._sAccept:
                // Update the Button into Application Buttons Model
                this._updateApplicationButtons("ACCEPT");

                this._oProcessViewer.setBusy(true);

                var fNAccept = function (fReturnValues) {
                  // Process further after OData call
                  if (fReturnValues === "Error") {
                    oController._oProcessViewer.setBusy(false);
                    MessageToast.show(
                      oController.getI18NText("UpdateFailedMessage")
                    );
                    jQuery.sap.log.error("Error on Save");
                  } else {
                    // Set Update Application Data
                    oController.getData(true);
                    oController._oProcessViewer.setBusy(false);
                    if (fReturnValues !== "Info") {
                      MessageToast.show(
                        oController.getI18NText("AcceptMessage")
                      );
                    }
                    oFooterActionButtonFragment.close();
                  }
                }.bind(this);

                if (
                  this._oModel.getContext(sCurrentPath).getObject()
                    .Component === "formData" ||
                  this._oModel.getContext(sCurrentPath).getObject()
                    .Component === "partners" ||
                  this._oModel.getContext(sCurrentPath).getObject()
                    .Component === "property" ||
                  this._oModel.getContext(sCurrentPath).getObject()
                    .Component === "notes" ||
                  this._oModel.getContext(sCurrentPath).getObject()
                    .Component === "outcomes"
                ) {
                  // Save
                  this._saveChanges(oButtons.ValidationRequired).then(fNAccept);
                } else if (this._oModel.hasPendingChanges()) {
                  // submit the changes (creates entity at the backend)
                  this._oModel.submitChanges({
                    success: function () {
                      // Get the updated Application Data
                      oController.getData(true);
                      oController._oProcessViewer.setBusy(false);
                      MessageToast.show(
                        oController.getI18NText("AcceptMessage")
                      );
                      oFooterActionButtonFragment.close();
                    },
                    error: function () {
                      oController._oProcessViewer.setBusy(false);
                      MessageToast.show(
                        oController.getI18NText("UpdateFailedMessage")
                      );
                      jQuery.sap.log.error("Error on Update");
                    },
                  });
                }
                break;

              case this._sReject:
                // Create reference for  Reject fragment if its not exist
                if (!this._oRejectPopup) {
                  this._oRejectPopup = sap.ui.xmlfragment(
                    this._RejectionPopUp,
                    this
                  );
                  this.getView().addDependent(this._oRejectPopup);
                }
                // Open the Reject in Pop up
                this._oRejectPopup.open();
                break;

              case this._sOnHold:
                /*begin RUX RFI Popup
							show RFI Popup*/
                this._showRFIPopup(this._sOnHold).then(
                  function (r) {
                    /*End RUX RFI Popup*/

                    if (sApplicationType === this._sRCApplicationType) {
                      // Get the data
                      this._oModel.read("/VH_RfiReason", {
                        urlParameters: {
                          $filter: sQuery,
                        },
                        success: function (oData) {
                          var oReason = {
                            Reason: "",
                            ReasonText: "",
                          };
                          var oRfiReason = {
                            Reason: "",
                            ReasonText: "",
                            ReasonValues: [],
                            OnHoldDate: "",
                          };
                          var aReasonField = [];
                          var aRfiReason = [];
                          oRfiReason = {};

                          // Get the  Reason Field values
                          $.each(oData.results, function (index, sReason) {
                            oReason = {};
                            oReason.Reason = sReason.Reason;
                            oReason.ReasonText =
                              sReason.Reason + " - " + sReason.ReasonText;
                            aReasonField.push(oReason);
                          });

                          // Get the data
                          oController._oModel.read("/ApplicationHold", {
                            urlParameters: {
                              $filter: sQuery,
                            },
                            success: function (onHoldData) {
                              // Form already existing Reason field values
                              $.each(
                                onHoldData.results,
                                function (i, sOnHoldData) {
                                  oRfiReason = {};
                                  oRfiReason.Reason = sOnHoldData.Reason;
                                  oRfiReason.ReasonText =
                                    sOnHoldData.ReasonText;
                                  oRfiReason.OnHoldDate =
                                    oController.formatOnHoldOffHoldDateForDisplay(
                                      sOnHoldData.OnHoldDate
                                    );
                                  oRfiReason.OnHoldtTme =
                                    sOnHoldData.OnHoldtTme;
                                  oRfiReason.ReasonValues = aReasonField;
                                  oRfiReason.SelectedReason =
                                    sOnHoldData.Reason;
                                  oRfiReason.SelectedReasonText =
                                    sOnHoldData.ReasonText;
                                  oRfiReason.Enabled = false;
                                  aRfiReason.push(oRfiReason);
                                }
                              );

                              var iLen = aRfiReason.length;
                              // Fill Empty reason fields till 5 recrods only
                              $.each(oData.results, function (index) {
                                if (iLen < 5) {
                                  oRfiReason = {};
                                  oRfiReason.Reason = "";
                                  oRfiReason.ReasonText = "";
                                  oRfiReason.OnHoldDate = new Date();
                                  oRfiReason.ReasonValues = aReasonField;
                                  oRfiReason.Enabled = true;
                                  aRfiReason.push(oRfiReason);
                                  iLen = iLen + 1;
                                }
                              });

                              var oRfiReasonModel =
                                new sap.ui.model.json.JSONModel({
                                  RfiReason: aRfiReason,
                                });

                              oController
                                .getView()
                                .setModel(oRfiReasonModel, "RfiReasons");
                              if (!oController._oRCOnHoldPopup) {
                                oController._oRCOnHoldPopup =
                                  sap.ui.xmlfragment(
                                    oController._RCOnHoldPopUp,
                                    oController
                                  );
                                oController
                                  .getView()
                                  .addDependent(oController._oRCOnHoldPopup);
                              }
                              // Open the RM On Hold Pop up
                              oController._oRCOnHoldPopup.open();
                            },
                          });
                        },
                      });
                    } else if (sApplicationType === this._sBCApplicationType) {
                      /*Start R-UX Document pointer
									Load Document count against this step*/
                      this._getDocList();
                      /*End R-UX Document pointer*/

                      // Get the data
                      this._oModel.read("/VH_RfiReason", {
                        urlParameters: {
                          $filter: sQuery,
                        },
                        success: function (oReasonData) {
                          var oBCReason = {
                            Reason: "",
                            ReasonText: "",
                          };
                          var oBCRFIReason = {
                            Reason: "",
                            ReasonText: "",
                            ReasonValues: [],
                            OnHoldDate: new Date(),
                            OnHoldtTme: "",
                          };
                          var aBCReasonField = [];
                          var aBCRFIReason = [];

                          // Get the  Reason Field values
                          $.each(
                            oReasonData.results,
                            function (index, sBCReason) {
                              oBCReason = {};
                              oBCReason.Reason = sBCReason.Reason;
                              oBCReason.ReasonText =
                                sBCReason.Reason + " - " + sBCReason.ReasonText;
                              aBCReasonField.push(oBCReason);
                            }
                          );

                          // Form the BC On Hold field values
                          oBCRFIReason.Reason = "";
                          oBCRFIReason.ReasonText = "";
                          oBCRFIReason.OnHoldDate = new Date();
                          oBCRFIReason.OnHoldtTme = oController.getCurrentTime(
                            oBCRFIReason.OnHoldDate
                          );
                          // oBCRFIReason.OnHoldtTme = "00:00:00";
                          oBCRFIReason.ReasonValues = aBCReasonField;
                          aBCRFIReason.push(oBCRFIReason);

                          var oBCRFIReasonModel =
                            new sap.ui.model.json.JSONModel({
                              BCRFIReason: aBCRFIReason,
                            });

                          oController
                            .getView()
                            .setModel(oBCRFIReasonModel, "BCRFIReasons");
                          oController
                            .getView()
                            .removeDependent(oController._oBCRFIOnHoldPopup);
                          oController._oBCRFIOnHoldPopup = "";
                          if (!oController._oBCRFIOnHoldPopup) {
                            oController._oBCRFIOnHoldPopup = sap.ui.xmlfragment(
                              oController._BCRFIOnHoldPopUp,
                              oController
                            );
                            oController
                              .getView()
                              .addDependent(oController._oBCRFIOnHoldPopup);
                          }
                          // Open the BC On Hold Pop up
                          oController._oBCRFIOnHoldPopup.open();
                        },
                      });
                    }
                  }.bind(this)
                );

                break;

              case this._sOffHold:
                /*Start R-UX Document pointer
							show RFI Popup*/
                this._showRFIPopup(this._sOffHold).then(
                  function (r) {
                    /*Load Document count against this step*/
                    if (sApplicationType === oController._sBCApplicationType) {
                      this._getDocList();
                    }
                    /*End R-UX Document pointer*/

                    // Get the data
                    this._oModel.read("/ApplicationHold", {
                      urlParameters: {
                        $filter: sQuery,
                      },
                      success: function (oData) {
                        var oRCOffHold = {};
                        var oRCOffHoldReason;
                        oRCOffHold.results = [];

                        var i = 0;
                        $.each(oData.results, function (index, value) {
                          oRCOffHold.results[i] = value;

                          oRCOffHold.results[i].OnHoldDate =
                            oController.formatOnHoldOffHoldDateForDisplay(
                              value.OnHoldDate
                            );

                          if (
                            sApplicationType === oController._sRCApplicationType
                          ) {
                            oRCOffHold.results[i].OffHoldDate = null;
                          } else {
                            //oRCOffHold.results[i].OffHoldDate = new Date();
                            oRCOffHold.results[i].OffHoldDate = null;
                          }
                          // Convert the Time format as per local
                          if (value.OnHoldtTme.ms !== 0) {
                            oRCOffHold.results[i].OnHoldtTme =
                              oController.formatTime(value.OnHoldtTme);
                          } else {
                            oRCOffHold.results[i].OnHoldtTme = "00:00:00";
                          }

                          if (value.OffHoldTime.ms !== 0) {
                            oRCOffHold.results[i].OffHoldtTme =
                              oController.formatTime(value.OffHoldtTme);
                          } else if (
                            sApplicationType !== oController._sRCApplicationType
                          ) {
                            //oRCOffHold.results[i].OffHoldtTme = oController.getCurrentTime(oRCOffHold.results[i].OffHoldDate);
                          }
                          i++;
                        });

                        if (
                          sApplicationType === oController._sRCApplicationType
                        ) {
                          oRCOffHoldReason = new sap.ui.model.json.JSONModel({
                            RCOffHoldReason: oRCOffHold,
                          });
                          oController
                            .getView()
                            .setModel(oRCOffHoldReason, "RCOffHoldReason");

                          if (!oController._oRCOffHoldPopup) {
                            oController._oRCOffHoldPopup = sap.ui.xmlfragment(
                              oController._RCOffHoldPopUp,
                              oController
                            );
                            oController
                              .getView()
                              .addDependent(oController._oRCOffHoldPopup);
                          }
                          // Open the RC Off Hold in Pop up
                          oController._oRCOffHoldPopup.open();
                        } else if (
                          sApplicationType === oController._sBCApplicationType
                        ) {
                          oRCOffHoldReason = new sap.ui.model.json.JSONModel({
                            RCRFIOffHold: oRCOffHold,
                          });
                          oController
                            .getView()
                            .setModel(oRCOffHoldReason, "RCRFIOffHold");
                          if (!oController._oRCRFIOffHoldPopup) {
                            oController._oRCRFIOffHoldPopup =
                              sap.ui.xmlfragment(
                                oController._RCRFIOffHoldPopUp,
                                oController
                              );
                            oController
                              .getView()
                              .addDependent(oController._oRCRFIOffHoldPopup);
                          }
                          // Open the RC RFI Off Hold in Pop up
                          oController._oRCRFIOffHoldPopup.open();
                        }
                      },
                    });
                  }.bind(this)
                );
                break;

              case this._sSAVE:
              case this._sSave:
                // Set the Busy Indicator
                this._oProcessViewer.setBusy(true);

                var fNSave = function (fReturn) {
                  // Process further after OData call
                  if (fReturn === "Error") {
                    oController._oProcessViewer.setBusy(false);
                    MessageToast.show(
                      oController.getI18NText("UpdateFailedMessage")
                    );
                    jQuery.sap.log.error("Error on Save");
                  } else {
                    // Set Update Application Data
                    oController.getData(true);
                    oController._oProcessViewer.setBusy(false);
                    if (fReturn !== "Info") {
                      MessageToast.show(oController.getI18NText("SaveMessage"));
                    }
                    oFooterActionButtonFragment.close();
                  }
                }.bind(this);

                if (
                  this._oModel.getContext(sCurrentPath).getObject()
                    .Component === "formData" ||
                  this._oModel.getContext(sCurrentPath).getObject()
                    .Component === "partners" ||
                  this._oModel.getContext(sCurrentPath).getObject()
                    .Component === "property" ||
                  this._oModel.getContext(sCurrentPath).getObject()
                    .Component === "notes" ||
                  this._oModel.getContext(sCurrentPath).getObject()
                    .Component === "outcomes"
                ) {
                  // Save
                  this._saveChanges(oButtons.ValidationRequired).then(fNSave);
                } else if (this._oModel.hasPendingChanges()) {
                  // Update the Save model from Screen
                  this._oModel.setProperty(
                    "Status",
                    this._oModel.getContext(sPath).getObject().Status,
                    this._oModel.getContext(sPath)
                  );

                  // submit the changes (creates entity at the backend)
                  this._oModel.submitChanges({
                    success: function () {
                      // Set Update Application Data
                      oController.getData(true);
                      oController._oProcessViewer.setBusy(false);
                      MessageToast.show(oController.getI18NText("SaveMessage"));
                      oFooterActionButtonFragment.close();
                    },
                    error: function () {
                      oController._oProcessViewer.setBusy(false);
                      MessageToast.show(
                        oController.getI18NText("UpdateFailedMessage")
                      );
                      jQuery.sap.log.error("Error on Save");
                    },
                  });
                } else {
                  if (oRemoveEntity) {
                    oController.getData(true);
                    oController._oProcessViewer.setBusy(false);
                    MessageToast.show(oController.getI18NText("SaveMessage"));
                    oFooterActionButtonFragment.close();
                  } else {
                    MessageToast.show(
                      oController.getI18NText("NoChangeSaveMessage")
                    );
                    this._oProcessViewer.setBusy(false);
                    oFooterActionButtonFragment.close();
                  }
                }

                break;

              case this._sCOMPLETE:
              case this._sComplete:
                // Update the Button into Application Buttons Model
                this._updateApplicationButtons(sAction);

                // Set the Busy Indicator
                this._oProcessViewer.setBusy(true);

                var fNComplete = function (fReturnVal) {
                  // Process further after OData call
                  if (fReturnVal === "Error") {
                    oController._oProcessViewer.setBusy(false);
                    MessageToast.show(
                      oController.getI18NText("UpdateFailedMessage")
                    );
                    jQuery.sap.log.error("Error on Save");
                  } else {
                    // Set Update Application Data
                    oController.getData(true);
                    oController._oProcessViewer.setBusy(false);
                    if (fReturnVal !== "Info") {
                      MessageToast.show(
                        oController.getI18NText("CompleteMessage")
                      );
                    }
                    oFooterActionButtonFragment.close();
                    window.close(true);
                  }
                }.bind(this);

                if (
                  this._oModel.getContext(sCurrentPath).getObject()
                    .Component === "formData" ||
                  this._oModel.getContext(sCurrentPath).getObject()
                    .Component === "partners" ||
                  this._oModel.getContext(sCurrentPath).getObject()
                    .Component === "property" ||
                  this._oModel.getContext(sCurrentPath).getObject()
                    .Component === "notes" ||
                  this._oModel.getContext(sCurrentPath).getObject()
                    .Component === "outcomes"
                ) {
                  // Save
                  this._saveChanges(oButtons.ValidationRequired).then(
                    fNComplete
                  );
                } else if (this._oModel.hasPendingChanges()) {
                  // submit the changes (creates entity at the backend)
                  this._oModel.submitChanges({
                    success: function () {
                      // Set updated Application Data
                      oController.getData(true);
                      // Set the Busy Indicator as false
                      oController._oProcessViewer.setBusy(false);
                      MessageToast.show(
                        oController.getI18NText("CompleteMessage")
                      );
                      oFooterActionButtonFragment.close();
                      window.close(true);
                    },
                    error: function () {
                      oController._oProcessViewer.setBusy(false);
                      MessageToast.show(
                        oController.getI18NText("UpdateFailedMessage")
                      );
                      jQuery.sap.log.error("Error on Complete");
                    },
                  });
                }

                break;

              default:
                // Update the Button into Application Buttons Model
                this._updateApplicationButtons(sAction);

                // Set the Busy Indicator
                this._oProcessViewer.setBusy(true);
                var fNProcess = function (fResult) {
                  // Process further after OData call
                  if (fResult === "Error") {
                    oController._oProcessViewer.setBusy(false);
                    MessageToast.show(
                      oController.getI18NText("UpdateFailedMessage")
                    );
                    jQuery.sap.log.error("Error on Save");
                  } else {
                    // Set Update Application Data
                    oController.getData(true);
                    oController._oProcessViewer.setBusy(false);
                    if (fResult !== "Info") {
                      MessageToast.show(
                        oController.getI18NText("CompleteMessage")
                      );
                    }
                    oFooterActionButtonFragment.close();
                  }
                }.bind(this);

                if (
                  this._oModel.getContext(sCurrentPath).getObject()
                    .Component === "formData" ||
                  this._oModel.getContext(sCurrentPath).getObject()
                    .Component === "partners" ||
                  this._oModel.getContext(sCurrentPath).getObject()
                    .Component === "property" ||
                  this._oModel.getContext(sCurrentPath).getObject()
                    .Component === "notes" ||
                  this._oModel.getContext(sCurrentPath).getObject()
                    .Component === "outcomes"
                ) {
                  // Save
                  this._saveChanges(oButtons.ValidationRequired).then(
                    fNProcess
                  );
                } else if (this._oModel.hasPendingChanges()) {
                  // submit the changes (creates entity at the backend)
                  this._oModel.submitChanges({
                    success: function () {
                      // Set updated Application Data
                      oController.getData(true);
                      // Set the Busy Indicator as false
                      oController._oProcessViewer.setBusy(false);
                      MessageToast.show(
                        oController.getI18NText("CompleteMessage")
                      );
                      oFooterActionButtonFragment.close();
                    },
                    error: function () {
                      oController._oProcessViewer.setBusy(false);
                      MessageToast.show(
                        oController.getI18NText("UpdateFailedMessage")
                      );
                      jQuery.sap.log.error("Error on Complete");
                    },
                  });
                }
            }
          } else {
            MessageToast.show(oController.getI18NText("UIValidationMessage"));
          }
        }.bind(this);

        if (oButtons.ValidationRequired === "X") {
          // Check the Mandatory field validations
          this.checkValid().then(fNContinue);
        } else {
          // No need to do validation
          iLength = 0;
          bUIValidationFlag = false;
          fNContinue();
        }
      },
      /**
       * Formats Header Dates for locale specific date display
       *
       * @param {object} oHeaderData object for Data
       * @returns {object} oHeaderData specific Data
       * @public
       */
      formatHeaderDates: function (oHeaderData) {
        if (
          oHeaderData.getObject().ReceivedDate === null ||
          oHeaderData.getObject().ReceivedDate === ""
        ) {
          // Format Lodged Dat
          oHeaderData.getObject().ReceivedDate = "N/A";
        } else if (
          oHeaderData.getObject().ReceivedDate instanceof Date ===
          true
        ) {
          // Format Recevied Date
          oHeaderData.getObject().ReceivedDate = this.formatDate(
            oHeaderData.getObject().ReceivedDate
          );
        }

        if (
          oHeaderData.getObject().LodgedDate === null ||
          oHeaderData.getObject().LodgedDate === ""
        ) {
          // Format Lodged Dat
          oHeaderData.getObject().LodgedDate = "N/A";
        } else if (
          oHeaderData.getObject().LodgedDate instanceof Date ===
          true
        ) {
          // Format Lodged Date
          oHeaderData.getObject().LodgedDate = this.formatDate(
            oHeaderData.getObject().LodgedDate
          );
        }

        if (
          oHeaderData.getObject().ProcessedDate === null ||
          oHeaderData.getObject().ProcessedDate === ""
        ) {
          // Format Lodged Dat
          oHeaderData.getObject().ProcessedDate = "N/A";
        } else if (
          oHeaderData.getObject().ProcessedDate instanceof Date ===
          true
        ) {
          // Format Processed Date
          oHeaderData.getObject().ProcessedDate = this.formatDate(
            oHeaderData.getObject().ProcessedDate
          );
        }

        if (
          oHeaderData.getObject().IssueDate === null ||
          oHeaderData.getObject().IssueDate === ""
        ) {
          // Format Lodged Date
          oHeaderData.getObject().IssueDate = "N/A";
        } else if (oHeaderData.getObject().IssueDate instanceof Date === true) {
          // Format Issue Date
          oHeaderData.getObject().IssueDate = this.formatDate(
            oHeaderData.getObject().IssueDate
          );
        }

        return oHeaderData;
      },
      //Upgrade to 1.44 date formatter isnot working
      formatHeaderDatesUpGrade: function (oHeaderData) {
        var oHeaderDate = [];
        if (
          oHeaderData.getObject().ReceivedDate === null ||
          oHeaderData.getObject().ReceivedDate === ""
        ) {
          // Format Lodged Dat
          oHeaderDate.ReceivedDate = "N/A";
        } else if (
          oHeaderData.getObject().ReceivedDate instanceof Date ===
          true
        ) {
          // Format Recevied Date
          oHeaderDate.ReceivedDate = this.formatDate(
            oHeaderData.getObject().ReceivedDate
          );
        }

        if (
          oHeaderData.getObject().LodgedDate === null ||
          oHeaderData.getObject().LodgedDate === ""
        ) {
          // Format Lodged Dat
          oHeaderDate.LodgedDate = "N/A";
        } else if (
          oHeaderData.getObject().LodgedDate instanceof Date ===
          true
        ) {
          // Format Lodged Date
          oHeaderDate.LodgedDate = this.formatDate(
            oHeaderData.getObject().LodgedDate
          );
        }

        if (
          oHeaderData.getObject().ProcessedDate === null ||
          oHeaderData.getObject().ProcessedDate === ""
        ) {
          // Format Lodged Dat
          oHeaderDate.ProcessedDate = "N/A";
        } else if (
          oHeaderData.getObject().ProcessedDate instanceof Date ===
          true
        ) {
          // Format Processed Date
          oHeaderDate.ProcessedDate = this.formatDate(
            oHeaderData.getObject().ProcessedDate
          );
        }

        if (
          oHeaderData.getObject().IssueDate === null ||
          oHeaderData.getObject().IssueDate === ""
        ) {
          // Format Lodged Date
          oHeaderDate.IssueDate = "N/A";
        } else if (oHeaderData.getObject().IssueDate instanceof Date === true) {
          // Format Issue Date
          oHeaderDate.IssueDate = this.formatDate(
            oHeaderData.getObject().IssueDate
          );
        }

        return oHeaderDate;
      },
      /**
       * Formats Date for locale specific date display
       *
       * @param {object} oDate object for On Hold
       * @returns {string} sDate specific date string
       * @public
       */
      formatDate: function (oDate) {
        var sDate = "";
        var oApplicationDate = new Date(oDate);
        var sMonth = "" + (oApplicationDate.getMonth() + 1);
        var sDay = "" + oApplicationDate.getDate();
        var sYear = oApplicationDate.getFullYear();

        if (sMonth.length < 2) {
          sMonth = "0" + sMonth;
        }
        if (sDay.length < 2) {
          sDay = "0" + sDay;
        }

        sDate = [sDay, sMonth, sYear].join("/");
        return sDate;
      },

      /**
       * Formats Time for locale specific Time display
       *
       * @param {object} oTime object for On Hold
       * @returns {string} sTime Locale specific Time string
       * @public
       */
      formatTime: function (oTime) {
        var sTime = "";

        // Get the Time as Hours,Minutes & Second
        var sHours = "" + new Date(oTime.ms).getUTCHours();
        var sMinutes = "" + new Date(oTime.ms).getUTCMinutes();
        var sSeconds = "" + new Date(oTime.ms).getUTCSeconds();

        if (sHours.length < 2) {
          sHours = "0" + sHours;
        }
        if (sMinutes.length < 2) {
          sMinutes = "0" + sMinutes;
        }
        if (sSeconds.length < 2) {
          sSeconds = "0" + sSeconds;
        }

        // Return as HH:MM:SS format
        sTime = [sHours, sMinutes, sSeconds].join(":");
        return sTime;
      },
      /**
       * Handle Reject Ok Button
       */
      handleRejectOk: function () {
        var oController = this;

        var sCurrentPath =
          "/" +
          oController._oModel.createKey(oController._sStepsCollection, {
            ApplicationKey: oController._sProcessKey,
            StepKey: oController._sStepKey,
          });

        var sPath =
          "/" +
          this._oModel.createKey(this._sApplicationButtons, {
            StepKey: this._sStepKey,
            ButtonId: this._sReject,
          });

        var bValidationRequired = this._oModel
          .getContext(sPath)
          .getObject().ValidationRequired;

        this._oRejectPopup.setBusy(true);

        // Update the Button into Application Buttons Model
        this._updateApplicationButtons("REJECT");

        var fNProcess = function (fReturnValue) {
          // Process further after OData call
          if (fReturnValue === "Error") {
            oController._oRejectPopup.setBusy(false);
            oController._oProcessViewer.setBusy(false);
            MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
            jQuery.sap.log.error("Error on Update");
          } else {
            // Set Update Application Data
            oController.getData(true);
            oController._oRejectPopup.setBusy(false);
            oController._oProcessViewer.setBusy(false);
            if (fReturnValue !== "Info") {
              MessageToast.show(oController.getI18NText("RejectMessage"));
            }
            oController._oRejectPopup.close();
          }
        }.bind(this);

        if (
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "formData" ||
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "partners" ||
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "property" ||
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "notes" ||
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "outcomes"
        ) {
          // Save
          this._saveChanges(bValidationRequired).then(fNProcess);
        } else if (this._oModel.hasPendingChanges()) {
          // submit the changes (creates entity at the backend)
          this._oModel.submitChanges({
            success: function () {
              // Get the updated Application Data
              oController.getData(true);
              oController._oRejectPopup.setBusy(false);
              MessageToast.show(oController.getI18NText("RejectMessage"));
              // Close the Reject in Pop up
              oController._oRejectPopup.close();
            },
            error: function () {
              oController._oRejectPopup.setBusy(false);
              MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
              jQuery.sap.log.error("Error on Update");
            },
          });
        }
      },
      /**
       * Handle Reject Close Button
       */
      handleRejectCancel: function () {
        // Open the Reject in Pop up
        this._oRejectPopup.close();
      },

      /**
       * Handle RC OnHold Ok Button
       * @returns {boolean} return from the function
       */
      handleRCONHoldOk: function () {
        // Get the RC ON Hold updated values from Screen
        var oController = this;
        var bValidationFlag = false;
        var bSubmitBackend = false;
        var oContext;
        var oProperties = {
          RecordId: "",
          Rfi: "",
          StepKey: this._sStepKey,
          Reason: "",
          ReasonText: "",
          OnHoldDate: null,
          OnHoldtTme: null,
          OffHoldDate: null,
          OffHoldTime: null,
          HoldOnOff: "",
        };

        var sCPath =
          "/" +
          this._oModel.createKey(this._sApplicationButtons, {
            StepKey: this._sStepKey,
            ButtonId: this._sOnHold,
          });

        var bValidationRequired = this._oModel
          .getContext(sCPath)
          .getObject().ValidationRequired;

        // // Get the Current Application entity path based on the Application Key
        // var sPath = this._oModel.createKey(this._sProcessCollection, {
        //      ApplicationKey: this._sProcessKey
        //    });

        // // Get the Application Object for Start Date and End Date
        // var oApplicationObject = this._oModel.getContext(sPath).getObject();

        var aItems = [];
        var oCell = {};

        // Get the Table reference for RC On Hold Reasons
        var oTable = this._oRCOnHoldPopup.getContent()[1];
        if (oTable) {
          aItems = oTable.getItems();

          $.each(aItems, function (index, oItem) {
            oCell = {};
            oCell = oItem.getCells()[0];

            // No need to excute the further processing
            if (
              oCell.mProperties.selectedKey === "" ||
              oCell.mProperties.editable === false
            ) {
              return;
            }

            // Raise error message if Reason is filled, but Date is empty
            if (
              oCell.mProperties.selectedKey !== "" &&
              oItem.getCells()[1].getDateValue() === null
            ) {
              MessageToast.show(oController.getI18NText("EmptyDate"));
              bValidationFlag = true;
              return false;
            }

            // //   OnHold Date validations with Checklist Step Start Date & End date
            // if (oController._onHoldOffHoldDateValidations( oController._sRCApplicationType, oApplicationObject.ChecklistStart, oApplicationObject.ChecklistEnd, oItem.getCells()[1].getDateValue()) === true) {
            //  bValidationFlag = true;
            //  return false;
            // }

            // Refresh the variable
            oProperties = {
              RecordId: "",
              Rfi: "",
              StepKey: oController._sStepKey,
              Reason: "",
              ReasonText: "",
              OnHoldDate: null,
              OnHoldtTme: null,
              OffHoldDate: null,
              OffHoldTime: null,
              HoldOnOff: "",
            };

            oProperties.RecordId = oController.Formatter.newGuid();
            oProperties.Reason = oCell.mProperties.selectedKey;
            oProperties.ReasonText = oCell.mProperties.value;
            oProperties.OnHoldtTme = "PT08H00M00S";
            //  oProperties.OnHoldtTme = oController.formatUITime(oController.getCurrentTime(oItem.getCells()[1].getDateValue()));
            oProperties.OnHoldDate = oController.formatOnHoldOffHoldDate(
              oItem.getCells()[1].getDateValue()
            );
            oContext = {};

            // create entry in  OData Model
            oContext = oController._oModel.createEntry(
              oController._sApplicationHold,
              {
                properties: oProperties,
              }
            );

            oController._oModel.setProperty(
              "RecordId",
              oProperties.RecordId,
              oContext
            );
            oController._oModel.setProperty(
              "Reason",
              oProperties.Reason,
              oContext
            );
            oController._oModel.setProperty(
              "ReasonText",
              oProperties.ReasonText,
              oContext
            );
            oController._oModel.setProperty(
              "OnHoldDate",
              oProperties.OnHoldDate,
              oContext
            );
            oController._oModel.setProperty(
              "OnHoldtTme",
              oProperties.OnHoldtTme,
              oContext
            );
            oController._oModel.setProperty(
              "StepKey",
              oController._sStepKey,
              oContext
            );
            oController._oModel.setProperty("Rfi", "X", oContext);
            oController._oModel.setProperty("OffHoldDate", null, oContext);
            oController._oModel.setProperty("OffHoldTime", null, oContext);
            oController._oModel.setProperty("HoldOnOff", "", oContext);
            bSubmitBackend = true;
          });
        }

        // No need to process it if any validation failure
        if (bValidationFlag === true) {
          return false;
        }

        if (bSubmitBackend === true) {
          oController._oRCOnHoldPopup.setBusy(true);
          // Update the Button into Application Buttons Model
          this._updateApplicationButtons("ONHOLD");

          var fNProcess = function (fReturnValue) {
            // Process further after OData call
            if (fReturnValue === "Error") {
              oController._oRCOnHoldPopup.setBusy(false);
              oController._oProcessViewer.setBusy(false);
              MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
              jQuery.sap.log.error("Error on Update");
              oController._oRCOnHoldPopup.close();
            } else {
              // Set Update Application Data
              oController.getData(true);
              oController._oRCOnHoldPopup.setBusy(false);
              oController._oProcessViewer.setBusy(false);
              if (fReturnValue !== "Info") {
                MessageToast.show(oController.getI18NText("OnHoldMessage"));
              }
              oController._oRCOnHoldPopup.close();
            }
          }.bind(this);

          var sCurrentPath =
            "/" +
            oController._oModel.createKey(oController._sStepsCollection, {
              ApplicationKey: oController._sProcessKey,
              StepKey: oController._sStepKey,
            });

          if (
            this._oModel.getContext(sCurrentPath).getObject().Component ===
              "formData" ||
            this._oModel.getContext(sCurrentPath).getObject().Component ===
              "partners" ||
            this._oModel.getContext(sCurrentPath).getObject().Component ===
              "property" ||
            this._oModel.getContext(sCurrentPath).getObject().Component ===
              "notes" ||
            this._oModel.getContext(sCurrentPath).getObject().Component ===
              "outcomes"
          ) {
            // Save
            this._saveChanges(bValidationRequired).then(fNProcess);
          } else if (this._oModel.hasPendingChanges()) {
            // submit the changes (creates entity at the backend)
            this._oModel.submitChanges({
              success: function (oResponses) {
                //Back end Error messages handling for Footer buttons
                var bErrorFlag = false;

                $.each(oResponses.__batchResponses, function (i, oResponse) {
                  if (oResponse.response) {
                    var sBody = oResponse.response.body;
                    var oErrors = JSON.parse(sBody);

                    $.each(
                      oErrors.error.innererror.errordetails,
                      function (j, oError) {
                        if (oError.severity === "error") {
                          bErrorFlag = true;
                          return false;
                        }
                      }
                    );

                    if (bErrorFlag === true) {
                      return false;
                    }
                  }
                });

                if (bErrorFlag === true) {
                  oController.deleteDuplicateMessages();
                  oController._oRCOnHoldPopup.setBusy(false);
                  MessageToast.show(
                    oController.getI18NText("UpdateFailedMessage")
                  );
                  jQuery.sap.log.error("Error on Update");
                  // Close the Pop up
                  oController._oRCOnHoldPopup.close();
                } else {
                  // Get the updated Application Data
                  oController.getData(true);
                  oController._oRCOnHoldPopup.setBusy(false);
                  MessageToast.show(oController.getI18NText("OnHoldMessage"));
                  // Close the Pop up
                  oController._oRCOnHoldPopup.close();
                }
              },
              error: function () {
                oController._oRCOnHoldPopup.setBusy(false);
                MessageToast.show(
                  oController.getI18NText("UpdateFailedMessage")
                );
                jQuery.sap.log.error("Error on Update");
                // Close the Pop up
                oController._oRCOnHoldPopup.close();
              },
            });
          }
        } else {
          // Close the Pop up
          oController._oRCOnHoldPopup.close();
        }
      },
      /**
       * Handle RC OnHold Close Button
       */
      handleRCONHoldCancel: function () {
        // Open the Reject in Pop up
        this._oRCOnHoldPopup.close();
      },
      /**
       * Handle BC RFI OnHold Ok Button
       * @returns {boolean} return from the function
       */
      handleBCRFIReasonOk: function () {
        var oContext = {};
        var oProperties = {
          RecordId: "",
          Rfi: "X",
          StepKey: this._sStepKey,
          Reason: "",
          ReasonText: "",
          OnHoldDate: null,
          OnHoldtTme: null,
          OffHoldDate: null,
          OffHoldTime: null,
          HoldOnOff: "",
        };

        var oController = this;
        var bValidationFlag = false;
        var aItems = [];
        var oCell = {};

        var sCPath =
          "/" +
          this._oModel.createKey(this._sApplicationButtons, {
            StepKey: this._sStepKey,
            ButtonId: this._sOnHold,
          });

        //date validation for document upload RT
        //if (oOnHold > new Date()) {
        //			MessageToast.show(oController.getI18NText("ON_HOLD_FUTURE"));
        //			bValidationFlag = true;
        //			return false;
        //		}

        var bValidationRequired = this._oModel
          .getContext(sCPath)
          .getObject().ValidationRequired;

        // // Get the Current Application entity path based on the Application Key
        // var sPath = this._oModel.createKey(this._sProcessCollection, {
        //      ApplicationKey: this._sProcessKey
        //    });

        // // Get the Application Object for Start Date and End Date
        // var oApplicationObject = this._oModel.getContext(sPath).getObject();

        // Get the Table reference for RC On Hold Reasons
        var oTable = this._oBCRFIOnHoldPopup.getContent()[1];
        if (oTable) {
          aItems = oTable.getItems();

          $.each(aItems, function (index, oItem) {
            oCell = {};
            oCell = oItem.getCells()[0];

            // No need to excute the further processing
            if (oCell.mProperties.selectedKey === "") {
              MessageToast.show(oController.getI18NText("EmptyOnHoldReason"));
              bValidationFlag = true;
              return false;
            }

            // Raise error message if Date is empty
            if (oItem.getCells()[1].getDateValue() === null) {
              MessageToast.show(oController.getI18NText("EmptyDate"));
              bValidationFlag = true;
              return false;
            }

            // Raise error message if Time is emtpy
            if (oItem.getCells()[2].getValue() === "") {
              MessageToast.show(oController.getI18NText("EmptyTime"));
              bValidationFlag = true;
              return false;
            }

            // //   OnHold Date validations with Checklist Step Start Date & End date
            // if (oController._onHoldOffHoldDateValidations(oController._sBCApplicationType, oApplicationObject.ChecklistStart, oApplicationObject.ChecklistEnd, oItem.getCells()[1].getDateValue(), "", oItem.getCells()[2].getValue()) === true) {
            //  bValidationFlag = true;
            //  return false;
            // }

            //Is on hold date/time in future?
            var oOnHold = new Date(
              oItem.getCells()[1].getDateValue().toDateString()
            );
            var oOnHold = oController._addSecondsToDate(
              oOnHold,
              oItem.getCells()[2].getValue()
            );

            if (oOnHold > new Date()) {
              MessageToast.show(oController.getI18NText("ON_HOLD_FUTURE"));
              bValidationFlag = true;
              return false;
            }

            //Is on hold date/time earlier than checklist start date?
            var appDate = oController._oModel.getData(oController._sPath);
            if (oOnHold < appDate.ChecklistStart) {
              MessageToast.show(oController.getI18NText("ON_HOLD_PAST"));
              bValidationFlag = true;
              return false;
            }
          });
        }

        // No need to process it if any validation failure
        if (bValidationFlag === true) {
          return false;
        }

        /*Start R-UX Document pointer
				Check if document added?*/
        this._getDocList().then(
          function (r) {
            if (
              this._aDocMgt.docCountChange === true ||
              this._aDocMgt.docUploaded === true
            ) {
              /*End R-UX Document pointer*/
              //Proceed

              // Get the RC RFI Off Hold updated values from Screen
              var sBCRFIOnHold = this.getView()
                .getModel("BCRFIReasons")
                .getData().BCRFIReason[0];

              oProperties.RecordId = this.Formatter.newGuid();
              oProperties.Reason = sBCRFIOnHold.Reason;
              oProperties.ReasonText = sBCRFIOnHold.ReasonText;
              sBCRFIOnHold.OnHoldDate = new Date(sBCRFIOnHold.OnHoldDate);
              oProperties.OnHoldDate = this.formatOnHoldOffHoldDate(
                sBCRFIOnHold.OnHoldDate
              );
              // Format the Time for OData Model
              oProperties.OnHoldtTme = this.formatUITime(
                sBCRFIOnHold.OnHoldtTme
              );

              // create entry in  OData Model
              oContext = this._oModel.createEntry(this._sApplicationHold, {
                properties: oProperties,
              });

              this._oBCRFIOnHoldPopup.setBusy(true);
              // Update the Button into Application Buttons Model
              this._updateApplicationButtons("ONHOLD");

              var fNProcess = function (fReturnValue) {
                // Process further after OData call
                if (fReturnValue === "Error") {
                  oController._oBCRFIOnHoldPopup.setBusy(false);
                  oController._oProcessViewer.setBusy(false);
                  MessageToast.show(
                    oController.getI18NText("UpdateFailedMessage")
                  );
                  jQuery.sap.log.error("Error on Update");
                  oController._oBCRFIOnHoldPopup.close();
                } else {
                  // Set Update Application Data
                  oController.getData(true);
                  oController._oBCRFIOnHoldPopup.setBusy(false);
                  oController._oProcessViewer.setBusy(false);
                  if (fReturnValue !== "Info") {
                    MessageToast.show(oController.getI18NText("OnHoldMessage"));
                  }
                  oController._oBCRFIOnHoldPopup.close();
                }
              }.bind(this);

              var sCurrentPath =
                "/" +
                oController._oModel.createKey(oController._sStepsCollection, {
                  ApplicationKey: oController._sProcessKey,
                  StepKey: oController._sStepKey,
                });

              if (
                this._oModel.getContext(sCurrentPath).getObject().Component ===
                  "formData" ||
                this._oModel.getContext(sCurrentPath).getObject().Component ===
                  "partners" ||
                this._oModel.getContext(sCurrentPath).getObject().Component ===
                  "property" ||
                this._oModel.getContext(sCurrentPath).getObject().Component ===
                  "notes" ||
                this._oModel.getContext(sCurrentPath).getObject().Component ===
                  "outcomes"
              ) {
                // Save
                this._saveChanges(bValidationRequired).then(fNProcess);
              } else if (this._oModel.hasPendingChanges()) {
                // submit the changes (creates entity at the backend)
                this._oModel.submitChanges({
                  success: function (oResponses) {
                    //Back end Error messages handling for Footer buttons
                    var bErrorFlag = false;

                    $.each(
                      oResponses.__batchResponses,
                      function (i, oResponse) {
                        if (oResponse.response) {
                          var sBody = oResponse.response.body;
                          var oErrors = JSON.parse(sBody);

                          $.each(
                            oErrors.error.innererror.errordetails,
                            function (j, oError) {
                              if (oError.severity === "error") {
                                bErrorFlag = true;
                                return false;
                              }
                            }
                          );

                          if (bErrorFlag === true) {
                            return false;
                          }
                        }
                      }
                    );

                    if (bErrorFlag === true) {
                      oController.deleteDuplicateMessages();
                      oController._oBCRFIOnHoldPopup.setBusy(false);
                      MessageToast.show(
                        oController.getI18NText("UpdateFailedMessage")
                      );
                      jQuery.sap.log.error("Error on Update");
                      oController._oBCRFIOnHoldPopup.close();
                    } else {
                      // Get the updated Application Data
                      oController.getData(true);
                      oController._oBCRFIOnHoldPopup.setBusy(false);
                      MessageToast.show(
                        oController.getI18NText("OnHoldMessage")
                      );

                      // Open the Reject in Pop up
                      oController._oBCRFIOnHoldPopup.close();
                    }
                  },
                  error: function () {
                    oController._oBCRFIOnHoldPopup.setBusy(false);
                    MessageToast.show(
                      oController.getI18NText("UpdateFailedMessage")
                    );
                    jQuery.sap.log.error("Error on Update");
                    oController._oBCRFIOnHoldPopup.close();
                  },
                });
              }
              /*Begin of Doc Check Change*/
            } else {
              //Raise Alert
              this._requestUpload(oController.getI18NText("ON_HOLD_NO_DOC"));
            }
          }.bind(this)
        );
        /*End of Doc Check Change*/
      },
      /**
       * Handle BC RFI OnHold Close Button
       */
      handleBCRFIReasonCancel: function () {
        // Open the Reject in Pop up
        this._oBCRFIOnHoldPopup.close();
      },
      /**
       * Handle BC Non RFI OnHold Ok Button
       */
      handleBCNonRFIOnHoldOk: function () {
        this._oBCNonRFIOnHoldPopup.setBusy(true);
        // Update the Button into Application Buttons Model
        this._updateApplicationButtons("ONHOLD");
        var oController = this;

        // Update the RC RFI Off Hold model from Screen
        if (this._oModel.hasPendingChanges()) {
          // submit the changes (creates entity at the backend)
          this._oModel.submitChanges({
            success: function () {
              oController.getData(true);
              oController._oBCNonRFIOnHoldPopup.setBusy(false);
              MessageToast.show(oController.getI18NText("OnHoldMessage"));
              // Open the BC Non RFI On Hold in Pop up
              oController._oBCNonRFIOnHoldPopup.close();
            },
            error: function () {
              oController._oBCNonRFIOnHoldPopup.setBusy(false);
              MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
              jQuery.sap.log.error("Error on Update");
            },
          });
        }
      },
      /**
       * Handle BC Non RFI OnHold Close Button
       */
      handleBCNonRFIOnHoldCancel: function () {
        // Open the Reject in Pop up
        this._oBCNonRFIOnHoldPopup.close();
      },
      /**
       * Handle RC Off Hold Ok Button
       * @returns {boolean} return from the function
       */
      handleRCOffHoldOk: function () {
        // Get the RC Off Hold updated values from Screen
        var aRCOffHold = this.getView().getModel("RCOffHoldReason").getData()
          .RCOffHoldReason.results;
        var sRCOffHoldPath;
        var oController = this;
        var oContext;
        var sRecordId = "";
        var bValidateSuccessFlag = false;
        var bDateValidationFlag = false;

        var sCPath =
          "/" +
          this._oModel.createKey(this._sApplicationButtons, {
            StepKey: this._sStepKey,
            ButtonId: this._sOffHold,
          });

        var bValidationRequired = this._oModel
          .getContext(sCPath)
          .getObject().ValidationRequired;

        // // Get the Current Application entity path based on the Application Key
        // var sPath = this._oModel.createKey(this._sProcessCollection, {
        //      ApplicationKey: this._sProcessKey
        //    });

        // // Get the Application Object for Start Date and End Date
        // var oApplicationObject = this._oModel.getContext(sPath).getObject();

        $.each(aRCOffHold, function (index, sRCOffHold) {
          sRecordId = "";

          // Process only if Off Hold Date is not null
          if (sRCOffHold.OffHoldDate === null) {
            return true;
          }

          // //   OnHold Date validations with Checklist Step Start Date & End date
          // if (oController._onHoldOffHoldDateValidations(oController._sRCApplicationType, oApplicationObject.ChecklistStart, oApplicationObject.ChecklistEnd, sRCOffHold.OnHoldDate, sRCOffHold.OffHoldDate) === true) {
          //  bDateValidationFlag = true;
          //  return false;
          // }

          // Fill sRecordId
          if (sRCOffHold.RecordId && sRCOffHold.RecordId !== "") {
            sRecordId = sRCOffHold.RecordId;
          } else {
            sRecordId = oController.Formatter.newGuid();
          }

          // Get the RC RFI Off Hold updated values from Model
          sRCOffHoldPath =
            "/" +
            oController._oModel.createKey(oController._sApplicationHold, {
              RecordId: sRecordId,
              StepKey: oController._sStepKey,
            });

          bValidateSuccessFlag = true;
          oContext = {};
          oContext = oController._oModel.getContext(sRCOffHoldPath);
          // if (sRecordId === "") {
          // sRCOffHold.RecordId = oController.Formatter.newGuid();
          // }
          oContext.getObject().RecordId = sRCOffHold.RecordId;
          sRCOffHold.OffHoldDate = new Date(sRCOffHold.OffHoldDate);
          sRCOffHold.OnHoldDate = new Date(sRCOffHold.OnHoldDate);
          // oContext.getObject().OffHoldTime = "PT18H00M00S";
          oContext.getObject().OffHoldTime = oController.formatUITime(
            oController.getCurrentTime(sRCOffHold.OffHoldDate)
          );
          // oContext.getObject().OnHoldtTme = oController.formatUITime(oController.getCurrentTime(sRCOffHold.OnHoldDate));
          oContext.getObject().OffHoldDate =
            oController.formatOnHoldOffHoldDate(sRCOffHold.OffHoldDate);
          oContext.getObject().OnHoldDate = oController.formatOnHoldOffHoldDate(
            sRCOffHold.OnHoldDate
          );
          oController._oModel.setProperty(
            "OffHoldDate",
            oController.formatOnHoldOffHoldDate(sRCOffHold.OffHoldDate),
            oContext
          );
          oController._oModel.setProperty(
            "OffHoldTime",
            "PT18H00M00S",
            oContext
          );
          oController._oModel.setProperty(
            "RecordId",
            sRCOffHold.RecordId,
            oContext
          );
          // oController._oModel.setProperty("OffHoldDate", oContext.getObject().OffHoldDate, oContext);
          oController._oModel.setProperty(
            "OnHoldDate",
            oContext.getObject().OnHoldDate,
            oContext
          );
          // oController._oModel.setProperty("OffHoldTime", oContext.getObject().OffHoldTime, oContext);
          oController._oModel.setProperty(
            "OnHoldtTme",
            oContext.getObject().OnHoldtTme,
            oContext
          );
          oController._oModel.setProperty("Rfi", " ", oContext);
        });

        if (bDateValidationFlag === true) {
          // No need to process if any Check list step date validation is failed
          return false;
        } else if (bValidateSuccessFlag === false) {
          // No need to process if none of the Off Hold is selected
          MessageToast.show(oController.getI18NText("SelectAtleastOneOffHold"));
          return false;
        }

        this._oRCOffHoldPopup.setBusy(true);
        // Update the Button into Application Buttons Model
        this._updateApplicationButtons("OFFHOLD");

        var fNProcess = function (fReturnValue) {
          // Process further after OData call
          if (fReturnValue === "Error") {
            oController._oRCOffHoldPopup.setBusy(false);
            oController._oProcessViewer.setBusy(false);
            MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
            jQuery.sap.log.error("Error on Update");
            oController._oRCOffHoldPopup.close();
          } else {
            // Set Update Application Data
            oController.getData(true);
            oController._oRCOffHoldPopup.setBusy(false);
            oController._oProcessViewer.setBusy(false);
            MessageToast.show(oController.getI18NText("OffHoldMessage"));
            oController._oRCOffHoldPopup.close();
          }
        }.bind(this);

        var sCurrentPath =
          "/" +
          oController._oModel.createKey(oController._sStepsCollection, {
            ApplicationKey: oController._sProcessKey,
            StepKey: oController._sStepKey,
          });

        if (
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "formData" ||
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "partners" ||
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "property" ||
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "notes" ||
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "outcomes"
        ) {
          // Save
          this._saveChanges(bValidationRequired).then(fNProcess);
        } else if (this._oModel.hasPendingChanges()) {
          // submit the changes (creates entity at the backend)
          this._oModel.submitChanges({
            success: function (oResponses) {
              //Back end Error messages handling for Footer buttons
              var bErrorFlag = false;

              $.each(oResponses.__batchResponses, function (i, oResponse) {
                if (oResponse.response) {
                  var sBody = oResponse.response.body;
                  var oErrors = JSON.parse(sBody);

                  $.each(
                    oErrors.error.innererror.errordetails,
                    function (j, oError) {
                      if (oError.severity === "error") {
                        bErrorFlag = true;
                        return false;
                      }
                    }
                  );

                  if (bErrorFlag === true) {
                    return false;
                  }
                }
              });

              if (bErrorFlag === true) {
                oController.deleteDuplicateMessages();
                oController._oRCOffHoldPopup.setBusy(false);
                MessageToast.show(
                  oController.getI18NText("UpdateFailedMessage")
                );
                jQuery.sap.log.error("Error on Update");
                oController._oRCOffHoldPopup.close();
              } else {
                // Get the updated Application Data
                oController.getData(true);
                oController._oRCOffHoldPopup.setBusy(false);
                MessageToast.show(oController.getI18NText("OffHoldMessage"));

                // Open the RC Off Hold in Pop up
                oController._oRCOffHoldPopup.close();
              }
            },
            error: function () {
              oController._oRCOffHoldPopup.setBusy(false);
              MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
              jQuery.sap.log.error("Error on Update");
              oController._oRCOffHoldPopup.close();
            },
          });
        }
      },
      /**
       * Handle RC Off Hold Close Button
       */
      handleRCOffHoldCancel: function () {
        // Open the Reject in Pop up
        this._oRCOffHoldPopup.close();
      },
      /**
       * Handle RC RFI Off Hold Ok Button
       * @returns {boolean} return from the function
       */
      handleRCRFIOffHoldOk: function () {
        //Check if BC application, moved the code to its own method to avoid confusion
        if (
          this._oModel.getData(this._sPath).ApplicationType ===
          this._sBCApplicationType
        ) {
          this.handleBCRFIOffHoldOk();
          return;
        }

        var bValidationFlag = false;
        var sRecordId = "";
        var sRCRFIOffHoldPath;
        var oController = this;
        var oContext;

        var sCPath =
          "/" +
          this._oModel.createKey(this._sApplicationButtons, {
            StepKey: this._sStepKey,
            ButtonId: this._sOffHold,
          });

        var bValidationRequired = this._oModel
          .getContext(sCPath)
          .getObject().ValidationRequired;

        // Get the RC RFI Off Hold updated values from Screen
        // var sRCRFIOffHold = this.getView().getModel("RCRFIOffHold").getData().RCRFIOffHold.results[0];
        var aBCOffHold = this.getView().getModel("RCRFIOffHold").getData()
          .RCRFIOffHold.results;

        // // Get the Current Application entity path based on the Application Key
        // var sPath = this._oModel.createKey(this._sProcessCollection, {
        //      ApplicationKey: this._sProcessKey
        //    });

        // // Get the Application Object for Start Date and End Date
        // var oApplicationObject = this._oModel.getContext(sPath).getObject();

        $.each(aBCOffHold, function (index, sRCRFIOffHold) {
          // Process only if Off Hold Date is not null & Raise error message if Date is empty
          if (sRCRFIOffHold.OffHoldDate === null) {
            MessageToast.show(oController.getI18NText("EmptyRFIDate"));
            bValidationFlag = true;
            return false;
          }

          // //   OnHold Date validations with Checklist Step Start Date & End date
          // if (oController._onHoldOffHoldDateValidations(oController._sBCApplicationType, oApplicationObject.ChecklistStart, oApplicationObject.ChecklistEnd, sRCRFIOffHold.OnHoldDate, sRCRFIOffHold.OffHoldDate, sRCRFIOffHold.OnHoldtTme,
          // sRCRFIOffHold.OffHoldtTme) === true) {
          //  bValidationFlag = true;
          //  return false;
          // }

          sRecordId = "";
          if (sRCRFIOffHold.RecordId && sRCRFIOffHold.RecordId !== "") {
            sRecordId = sRCRFIOffHold.RecordId;
          }

          // Get the RC RFI Off Hold updated values from Model
          sRCRFIOffHoldPath =
            "/" +
            oController._oModel.createKey(oController._sApplicationHold, {
              RecordId: sRecordId,
              StepKey: oController._sStepKey,
            });

          oContext = {};
          oContext = oController._oModel.getContext(sRCRFIOffHoldPath);

          if (sRecordId === "") {
            sRCRFIOffHold.RecordId = oController.Formatter.newGuid();
          }
          oContext.getObject().RecordId = sRCRFIOffHold.RecordId;
          sRCRFIOffHold.OffHoldDate = new Date(sRCRFIOffHold.OffHoldDate);
          oContext.getObject().OnHoldDate = oController.formatOnHoldOffHoldDate(
            sRCRFIOffHold.OnHoldDate
          );
          oContext.getObject().OffHoldDate =
            oController.formatOnHoldOffHoldDate(sRCRFIOffHold.OffHoldDate);
          // Format the Time for OData Model
          // sRCRFIOffHold.OffHoldTime = "PT18H00M00S";
          //   sRCRFIOffHold.OffHoldTime = oController.formatUITime(sRCRFIOffHold.OffHoldtTme);
          sRCRFIOffHold.OffHoldTime = oController.formatUITime(
            sRCRFIOffHold.OffHoldTme
          );

          /*var format1 = sap.ui.core.format.DateFormat.getDateInstance({pattern : "PTkk'H'mm'M'ss'S'"});
       //sRCRFIOffHold.OffHoldTime = format1.format(sRCRFIOffHold.OffHoldTme);*/
          // Raise error message if Time is emtpy
          if (
            sRCRFIOffHold.OffHoldTime === null ||
            sRCRFIOffHold.OffHoldTime === ""
          ) {
            MessageToast.show(oController.getI18NText("EmptyRFITime"));
            bValidationFlag = true;
            return false;
          }
          oContext.getObject().OffHoldTime = sRCRFIOffHold.OffHoldTime;

          oController._oModel.setProperty(
            "RecordId",
            sRCRFIOffHold.RecordId,
            oContext
          );
          oController._oModel.setProperty(
            "OnHoldDate",
            oContext.getObject().OnHoldDate,
            oContext
          );

          //  oController._oModel.setProperty("OffHoldDate", oContext.getObject().OffHoldDate, oContext);
          oController._oModel.setProperty(
            "OffHoldDate",
            oController.formatOnHoldOffHoldDate(sRCRFIOffHold.OffHoldDate),
            oContext
          );
          oController._oModel.setProperty(
            "OffHoldTime",
            sRCRFIOffHold.OffHoldTime,
            oContext
          );
        });

        // No need to process it if any validation failure
        if (bValidationFlag === true) {
          return false;
        }

        this._oRCRFIOffHoldPopup.setBusy(true);
        // Update the Button into Application Buttons Model
        this._updateApplicationButtons("OFFHOLD");

        var fNProcess = function (fReturnValue) {
          // Process further after OData call
          if (fReturnValue === "Error") {
            oController._oRCRFIOffHoldPopup.setBusy(false);
            oController._oProcessViewer.setBusy(false);
            MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
            jQuery.sap.log.error("Error on Update");
            oController._oRCRFIOffHoldPopup.close();
          } else {
            // Set Update Application Data
            oController.getData(true);
            oController._oRCRFIOffHoldPopup.setBusy(false);
            oController._oProcessViewer.setBusy(false);
            MessageToast.show(oController.getI18NText("OffHoldMessage"));
            oController._oRCRFIOffHoldPopup.close();
          }
        }.bind(this);

        var sCurrentPath =
          "/" +
          oController._oModel.createKey(oController._sStepsCollection, {
            ApplicationKey: oController._sProcessKey,
            StepKey: oController._sStepKey,
          });

        if (
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "formData" ||
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "partners" ||
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "property" ||
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "notes" ||
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "outcomes"
        ) {
          // Save
          this._saveChanges(bValidationRequired).then(fNProcess);
        } else if (this._oModel.hasPendingChanges()) {
          // submit the changes (creates entity at the backend)
          this._oModel.submitChanges({
            success: function (oResponses) {
              //Back end Error messages handling for Footer buttons
              var bErrorFlag = false;

              $.each(oResponses.__batchResponses, function (i, oResponse) {
                if (oResponse.response) {
                  var sBody = oResponse.response.body;
                  var oErrors = JSON.parse(sBody);

                  $.each(
                    oErrors.error.innererror.errordetails,
                    function (j, oError) {
                      if (oError.severity === "error") {
                        bErrorFlag = true;
                        return false;
                      }
                    }
                  );

                  if (bErrorFlag === true) {
                    return false;
                  }
                }
              });

              if (bErrorFlag === true) {
                oController.deleteDuplicateMessages();
                oController._oRCRFIOffHoldPopup.setBusy(false);
                MessageToast.show(
                  oController.getI18NText("UpdateFailedMessage")
                );
                jQuery.sap.log.error("Error on Update");
                oController._oRCRFIOffHoldPopup.close();
              } else {
                // Get the updated Application Data
                oController.getData(true);
                oController._oRCRFIOffHoldPopup.setBusy(false);
                MessageToast.show(oController.getI18NText("OffHoldMessage"));
                // Open the RC RFI Hold in Pop up
                oController._oRCRFIOffHoldPopup.close();
              }
            },
            error: function () {
              oController._oRCRFIOffHoldPopup.setBusy(false);
              MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
              jQuery.sap.log.error("Error on Update");
              oController._oRCRFIOffHoldPopup.close();
            },
          });
        }
      },
      /**
       * Handle RC RFI Off Hold Close Button
       */
      handleRCRFIOffHoldCancel: function () {
        // Open the RC RFI Off Hold in Pop up
        this._oRCRFIOffHoldPopup.close();
      },
      /**
       * Update the Application Buttons Model
       * @param {string} sButtonID Button ID
       */
      _updateApplicationButtons: function (sButtonID) {
        // Get the Application Button updated values from Model
        var sApplicationButtonsPath =
          "/" +
          this._oModel.createKey(this._sApplicationButtons, {
            StepKey: this._sStepKey,
            ButtonId: sButtonID,
          });

        var oApplicationButtonsContext = this._oModel.getContext(
          sApplicationButtonsPath
        );
        oApplicationButtonsContext.getObject().Icon = "";
        oApplicationButtonsContext.getObject().ButtonText = "";
        this._oModel.setProperty("Icon", "", oApplicationButtonsContext);
        this._oModel.setProperty("ButtonText", "", oApplicationButtonsContext);
      },
      /**
       * Handle BC Non RFI Off Hold Ok Button
       */
      handleBCNonRFIOffHoldOk: function () {
        var oController = this;
        this._oBCNonRFIOffHoldPopup.setBusy(true);
        // Update the Button into Application Buttons Model
        this._updateApplicationButtons("OFFHOLD");

        // Update the RC RFI Off Hold model from Screen
        if (this._oModel.hasPendingChanges()) {
          // submit the changes (creates entity at the backend)
          this._oModel.submitChanges({
            success: function () {
              // set updated applition data
              oController.getData(true);
              oController._oBCNonRFIOffHoldPopup.setBusy(false);
              MessageToast.show(oController.getI18NText("OffHoldMessage"));
              // Open the BC Non RFI Off Hold in Pop up
              oController._oBCNonRFIOffHoldPopup.close();
            },
            error: function () {
              oController._oBCNonRFIOffHoldPopup.setBusy(false);
              MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
              jQuery.sap.log.error("Error on Update");
            },
          });
        }
      },
      /**
       * Handle BC Non RFI OffHold Close Button
       */
      handleBCNonRFIOffHoldCancel: function () {
        // Open the BC Non RFI Off Hold in Pop up
        this._oBCNonRFIOffHoldPopup.close();
      },
      /**
       * Handle Alert Message Popup Ok Button
       */
      handleAlertClose: function () {
        // Close the Alert Message in Pop up
        this._oAlertMessagePopup.close();
      },
      /**
       * Get theAlert Message from Back end
       */
      _getAlertMessages: function () {
        var sQuery = "ApplicationKey eq guid'" + this._sProcessKey + "'";

        var oController = this;
        this._oModel.read("/ApplicationAlert", {
          // filter: ApplicationKey = this._sProcessKey {
          urlParameters: {
            $filter: sQuery,
          },
          success: function (oData) {
            var aApplicationAlert = oData.results;
            var iLength = aApplicationAlert.length;
            var aAlertMessage = [];
            var oAlertMessage = {
              MessageTitle: "",
              MessageText: "",
            };
            var iStartIndex;

            if (iLength > 0) {
              // Split the Alert Message Title & Alert Message
              $.each(oData.results, function (index, sAlertMessages) {
                oAlertMessage = {};
                iStartIndex = 0;
                iStartIndex = sAlertMessages.Message.indexOf(
                  oController._sHTMLTag
                );
                oAlertMessage.MessageTitle = sAlertMessages.Message.substring(
                  0,
                  iStartIndex
                );
                oAlertMessage.MessageText =
                  sAlertMessages.Message.substring(iStartIndex);
                aAlertMessage.push(oAlertMessage);
              });

              // Set the JSON model
              var oApplicationAlert = new sap.ui.model.json.JSONModel({
                AlertMessages: aAlertMessage,
              });

              oController
                .getView()
                .setModel(oApplicationAlert, "AlertMessages");
              if (!oController._oAlertMessagePopup) {
                oController._oAlertMessagePopup = sap.ui.xmlfragment(
                  oController._AlertCriticalPopup,
                  oController
                );
                oController
                  .getView()
                  .addDependent(oController._oAlertMessagePopup);
              }

              // Open the Alert Messages in Pop up
              oController._oAlertMessagePopup.open();
            }
          },
        });
      },

      /**
       * Set the Reason & Reason Text to Model
       * @param {object} oEvent The text key to get I18N text .
       */
      handleSelectionChange: function (oEvent) {
        var aItems = [];
        var oCell = {};
        // var iCount = 0;

        // Get the Table Reference
        var oTable = this._oRCOnHoldPopup.getContent()[1];
        if (oTable) {
          // Get the Items
          aItems = oTable.getItems();

          $.each(aItems, function (index, oItem) {
            oCell = {};
            oCell = oItem.getCells()[0];

            // Increase the count as one for duplicate reason
            if (
              oEvent.getParameter("selectedItem").getKey() ===
              oCell.mProperties.selectedKey
            ) {
              // Set the Tooltip
              oCell.setTooltip(oEvent.getParameter("selectedItem").getText());
            }
          });
        }
      },
      /**
       * Set the BC On Hold Reason & Reason Text to Model
       * @param {object} oEvent The text key to get I18N text .
       */
      handleBCOnHoldSelectionChange: function (oEvent) {
        var oController = this;

        // Update the OData Model based on the screen selection
        oController
          .getView()
          .getModel("BCRFIReasons")
          .getData().BCRFIReason[0].Reason = oEvent
          .getParameter("selectedItem")
          .getKey();
        oController
          .getView()
          .getModel("BCRFIReasons")
          .getData().BCRFIReason[0].ReasonText = oEvent
          .getParameter("selectedItem")
          .getText();

        // Get the Table Reference
        var oTable = this._oBCRFIOnHoldPopup.getContent()[1];
        if (oTable) {
          // Get the Item
          var oItems = oTable.getItems()[0];

          if (oItems) {
            var oCell = oItems.getCells()[0];
            // Set the Tooltip
            oCell.setTooltip(oEvent.getParameter("selectedItem").getText());
          }
        }
        return false;
      },

      /**
       * Format HTML string into Normal String
       * @param {string} sText
       * @return {string} sInnerText Text for condent
       */
      formatString: function (sText) {
        var sInnerText = "";
        if (sText) {
          var obj = $.parseHTML(sText);
          obj.forEach(function (entry) {
            sInnerText = sInnerText + " " + entry.textContent;
          });
          return sInnerText;
        }
        return sInnerText;
      },
      /**
       * Format Time for OData Model Update
       * @param {string} sTime text
       * @return {string} sFormatTime Current Time Stamp
       */
      formatUITime: function (sTime) {
        // Format the Time
        var sFormatTime = sTime.replace(":", "");
        sFormatTime = sFormatTime.replace(":", "");
        sFormatTime = sFormatTime.replace(":", "");

        var sHH = sFormatTime.substring(0, 2);
        var sMM = sFormatTime.substring(2, 4);
        var sSS = sFormatTime.substring(4, 6);

        sFormatTime = "PT" + sHH + "H" + sMM + "M" + sSS + "S"; // PT16H46M00S
        return sFormatTime;
      },
      /**
       * Get the Current Time in HH:MM:SS format
       * @param {object} oCurrentTimeStamp Current Time Stamp
       * @return {string} sCurrnetTime Current Time Stamp
       */
      getCurrentTime: function (oCurrentTimeStamp) {
        var sCurrnetTime = "00:00:00";

        var sHours = oCurrentTimeStamp.getHours();
        sHours = sHours.toString();
        if (sHours.length < 2) {
          sHours = "0" + sHours;
        }

        var sMinutes = oCurrentTimeStamp.getMinutes();
        sMinutes = sMinutes.toString();
        if (sMinutes.length < 2) {
          sMinutes = "0" + sMinutes;
        }
        var sSeconds = oCurrentTimeStamp.getSeconds();
        sSeconds = sSeconds.toString();
        if (sSeconds.length < 2) {
          sSeconds = "0" + sSeconds;
        }
        sCurrnetTime = sHours + ":" + sMinutes + ":" + sSeconds;
        return sCurrnetTime;
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
      getI18NText: function (sTextKey, aParameters) {
        return this.getView()
          .getModel("i18n")
          .getResourceBundle()
          .getText(sTextKey, aParameters);
      },
      /**
       * set the screen busy indicator for entire screen
       *
       */
      setScreenBusyIndicator: function () {
        // Set Busy Indicator
        this._oProcessViewer.setBusyIndicatorDelay(0);
        this._oProcessViewer.setBusy(true);
      },
      /**
       * Remove the screen busy indicator for entire screen
       *
       */
      removeScreenBusyIndicator: function () {
        // Remove the busy indicator
        this._oProcessViewer.setBusy(false);
      },
      /**
       * Refresh the Nav Bar Icon as either Error(Red) or Success(Green)
       *
       */
      refreshNavBarIcons: function () {
        // Navigation Bar Icon refresh
        this._oProcessViewer.rerenderNavBarContent();
      },
      /**
       * Delete duplicate messages
       */
      deleteDuplicateMessages: function () {
        var aFinalMessages = [];
        var bUpdate = false;

        var aMessages = sap.ui
          .getCore()
          .getMessageManager()
          .getMessageModel().oData;
        $.each(aMessages, function (i, oMessage) {
          if (aFinalMessages.length === 0) {
            // Add only Unique message
            aFinalMessages.push(oMessage);
            return true;
          }

          bUpdate = false;
          // Check for duplicate messages
          $.each(aFinalMessages, function (j, oFinalMessage) {
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
        sap.ui.getCore().getMessageManager().getMessageModel().oData =
          aFinalMessages;
        sap.ui.getCore().getMessageManager().getMessageModel().refresh();
      },
      /**
       * Formats Date for locale specific date display
       *
       * @param {object} oDate object for On Hold
       * @returns {string} sDate specific date string
       * @public
       */
      formatOnHoldOffHoldDate: function (oDate) {
        var sDate = "";
        var oApplicationDate = new Date(oDate);
        var sMonth = "" + (oApplicationDate.getMonth() + 1);
        var sDay = "" + oApplicationDate.getDate();
        var sYear = oApplicationDate.getFullYear();

        if (sMonth.length < 2) {
          sMonth = "0" + sMonth;
        }
        if (sDay.length < 2) {
          sDay = "0" + sDay;
        }

        sDate = [sYear, sMonth, sDay].join("");
        return sDate;
      },
      /**
       * Formats Date for locale specific date display
       *
       * @param {string} sDate object for On Hold
       * @returns {object} oDate Locale specific date string
       * @public
       */
      formatOnHoldOffHoldDateForDisplay: function (sDate) {
        // Split Year,Month & Day
        var sYear = sDate.slice(0, 4);
        var sMonth = sDate.slice(4, 6);
        var sDay = sDate.slice(6, 8);
        sDate = [sYear, sMonth, sDay].join("/");

        // Get the Date object
        var oDate = new Date(sDate);
        return oDate;

        // var oApplicationDate = new Date();
        // // Split Year,Month & Day
        // var sYear = sDate.slice(0, 4);
        // var iMonth = sDate.slice(4, 6);
        // iMonth = Number(iMonth);
        // // Need to decrement 1, since standard Date function giving one month advance
        // iMonth = iMonth - 1;
        // var sMonth = String(iMonth);
        // var sDay = sDate.slice(6, 8);
        // oApplicationDate.setDate(sDay);
        // oApplicationDate.setMonth(sMonth);
        // oApplicationDate.setFullYear(sYear);

        // // Get the Date object
        // var oDate = new Date(oApplicationDate);
        // return oDate;
      },
      /**
       * Convert the time format into Number
       *
       * @param {object} oDate Date.
       * @return {String} iTime for Converted Time
       * @private
       *
       */
      _convertTimeIntoNumberFormat: function (oDate) {
        var iTime = "";

        // Get the Time as Hours,Minutes & Second
        var sHours = oDate.getHours();
        var sMinutes = oDate.getMinutes();
        var sSeconds = oDate.getSeconds();

        if (sHours.length < 2) {
          sHours = "0" + sHours;
        }
        if (sMinutes.length < 2) {
          sMinutes = "0" + sMinutes;
        }
        if (sSeconds.length < 2) {
          sSeconds = "0" + sSeconds;
        }

        iTime = String(sHours) + String(sMinutes) + String(sSeconds);
        iTime = Number(iTime);

        // Return as HHMMSS format
        return iTime;
      },
      // R-UX document management on RFI pop up
      _getButtonPressed: function () {
        if (this.buttonId.indexOf(this._aButtonIDs[0]) > -1) {
          return this._aButtonIDs[0];
        } else if (this.buttonId.indexOf(this._aButtonIDs[1]) > -1) {
          return this._aButtonIDs[1];
        }
      },

      //can't work with control IDs - fails when open twice or more, therefore use text
      onLaunchURL: function (oEvent) {
        var bValidationFlag = false;
        var sOffHoldTitle = "OFF HOLD";

        if (oEvent.getSource().getText() === this.getI18NText("TEMPLATE_TXT")) {
          this.buttonId = "TEMPLATE";
        } else if (
          oEvent.getSource().getText() == this.getI18NText("UPLOAD_TXT")
        ) {
          this.buttonId = "UPLOAD_OTX";

          var popUpTitle = oEvent
            .getSource()
            .getParent()
            .getTitle()
            .toUpperCase();

          //if BC....
          if (
            this._oModel.getData(this._sPath).ApplicationType ===
            this._sBCApplicationType
          ) {
            if (popUpTitle.trim() === this._sOnHold) {
              if (this._validationsOnHold() === true) {
                bValidationFlag = true;
              }
            }
            if (popUpTitle.trim() === sOffHoldTitle) {
              if (this._validationsOffHold() === true) {
                bValidationFlag = true;
              }
            }
          }
        }

        if (bValidationFlag === false) {
          this._displayRedirectURL("");
        }
      },

      _validationsOnHold: function () {
        var oController = this;
        var bValidationFlag = false;
        var oContext;
        var aItems = [];
        var oCell = {};

        // Get the Table reference for RC On Hold Reasons
        var oTable = this._oBCRFIOnHoldPopup.getContent()[1];
        if (oTable) {
          aItems = oTable.getItems();

          $.each(aItems, function (index, oItem) {
            oCell = {};
            oCell = oItem.getCells()[0];

            // No need to excute the further processing
            if (oCell.mProperties.selectedKey === "") {
              MessageToast.show(oController.getI18NText("EmptyOnHoldReason"));
              bValidationFlag = true;
              return true;
            }

            // Raise error message if Date is empty
            if (oItem.getCells()[1].getDateValue() === null) {
              MessageToast.show(oController.getI18NText("EmptyDate"));
              bValidationFlag = true;
              return true;
            }

            // Raise error message if Time is emtpy
            if (oItem.getCells()[2].getValue() === "") {
              MessageToast.show(oController.getI18NText("EmptyTime"));
              bValidationFlag = true;
              return true;
            }

            //Is on hold date/time in future?
            var oOnHold = new Date(
              oItem.getCells()[1].getDateValue().toDateString()
            );
            var oOnHold = oController._addSecondsToDate(
              oOnHold,
              oItem.getCells()[2].getValue()
            );

            if (oOnHold > new Date()) {
              MessageToast.show(oController.getI18NText("ON_HOLD_FUTURE"));
              bValidationFlag = true;
              return true;
            }

            //Is on hold date/time earlier than checklist start date?
            var appDate = oController._oModel.getData(oController._sPath);
            if (oOnHold < appDate.ChecklistStart) {
              MessageToast.show(oController.getI18NText("ON_HOLD_PAST"));
              bValidationFlag = true;
              return true;
            }
          });
        }

        if (bValidationFlag === true) {
          return true;
        }
      },

      _validationsOffHold: function () {
        var oController = this;
        var bValidationFlag = false;
        var sRCRFIOffHoldPath;
        var sRecordId = "";
        var oContext;
        var aItems = [];
        var oCell = {};

        var aBCOffHold = this.getView().getModel("RCRFIOffHold").getData()
          .RCRFIOffHold.results;

        $.each(aBCOffHold, function (index, sRCRFIOffHold) {
          // Process only if Off Hold Date is not null & Raise error message if Date is empty
          if (
            sRCRFIOffHold.OffHoldDate === null ||
            sRCRFIOffHold.OffHoldTme === null ||
            sRCRFIOffHold.OffHoldTme === "" ||
            sRCRFIOffHold.OffHoldTme === undefined
          ) {
            MessageToast.show(oController.getI18NText("EmptyRFIDateTime"));
            bValidationFlag = true;
            return true;
          }

          var oOffHold = oController._addSecondsToDate(
            sRCRFIOffHold.OffHoldDate,
            sRCRFIOffHold.OffHoldTme
          );
          if (oOffHold > new Date()) {
            //Off hold date in future is wrong
            MessageToast.show(oController.getI18NText("OFF_HOLD_FUTURE"), {
              at: sap.ui.core.Popup.Dock.CenterCenter,
            });
            bValidationFlag = true;
            return true;
          }

          var oOnHold = oController._addSecondsToDate(
            sRCRFIOffHold.OnHoldDate,
            sRCRFIOffHold.OnHoldtTme
          );
          if (oOffHold < oOnHold) {
            //Off hold cant be before on hold date
            MessageToast.show(oController.getI18NText("OFF_HOLD_PAST"), {
              at: sap.ui.core.Popup.Dock.CenterCenter,
            });
            bValidationFlag = true;
            return true;
          }

          sRecordId = "";
          if (sRCRFIOffHold.RecordId && sRCRFIOffHold.RecordId !== "") {
            sRecordId = sRCRFIOffHold.RecordId;
          }

          // Get the RC RFI Off Hold updated values from Model
          sRCRFIOffHoldPath =
            "/" +
            oController._oModel.createKey(oController._sApplicationHold, {
              RecordId: sRecordId,
              StepKey: oController._sStepKey,
            });

          oContext = {};
          oContext = oController._oModel.getContext(sRCRFIOffHoldPath);

          if (sRecordId === "") {
            sRCRFIOffHold.RecordId = oController.Formatter.newGuid();
          }
          oContext.getObject().RecordId = sRCRFIOffHold.RecordId;
          sRCRFIOffHold.OffHoldDate = new Date(sRCRFIOffHold.OffHoldDate);
          oContext.getObject().OnHoldDate = oController.formatOnHoldOffHoldDate(
            sRCRFIOffHold.OnHoldDate
          );
          oContext.getObject().OffHoldDate =
            oController.formatOnHoldOffHoldDate(sRCRFIOffHold.OffHoldDate);
          // Format the Time for OData Model
          sRCRFIOffHold.OffHoldTime = oController.formatUITime(
            sRCRFIOffHold.OffHoldTme
          );

          //bValidateSuccessFlag = true;
          oContext.getObject().OffHoldTime = sRCRFIOffHold.OffHoldTime;

          oController._oModel.setProperty(
            "RecordId",
            sRCRFIOffHold.RecordId,
            oContext
          );
          oController._oModel.setProperty(
            "OnHoldDate",
            oContext.getObject().OnHoldDate,
            oContext
          );

          oController._oModel.setProperty(
            "OffHoldDate",
            oController.formatOnHoldOffHoldDate(sRCRFIOffHold.OffHoldDate),
            oContext
          );
          oController._oModel.setProperty(
            "OffHoldTime",
            sRCRFIOffHold.OffHoldTime,
            oContext
          );
        });

        if (bValidationFlag === true) {
          return true;
        }

        var bValidationRequired = this._oModel
          .getContext(sCPath)
          .getObject().ValidationRequired;

        // // Get the Current Application entity path based on the Application Key
        // var sPath = this._oModel.createKey(this._sProcessCollection, {
        //      ApplicationKey: this._sProcessKey
        //    });

        // // Get the Application Object for Start Date and End Date
        // var oApplicationObject = this._oModel.getContext(sPath).getObject();

        // Get the Table reference for RC On Hold Reasons
        var oTable = this._oBCRFIOnHoldPopup.getContent()[1];
        if (oTable) {
          aItems = oTable.getItems();

          $.each(aItems, function (index, oItem) {
            oCell = {};
            oCell = oItem.getCells()[0];

            // No need to excute the further processing
            if (oCell.mProperties.selectedKey === "") {
              MessageToast.show(oController.getI18NText("EmptyOnHoldReason"));
              bValidationFlag = true;
              return false;
            }

            // Raise error message if Date is empty
            if (oItem.getCells()[1].getDateValue() === null) {
              MessageToast.show(oController.getI18NText("EmptyDate"));
              bValidationFlag = true;
              return false;
            }

            // Raise error message if Time is emtpy
            if (oItem.getCells()[2].getValue() === "") {
              MessageToast.show(oController.getI18NText("EmptyTime"));
              bValidationFlag = true;
              return false;
            }

            // //   OnHold Date validations with Checklist Step Start Date & End date
            // if (oController._onHoldOffHoldDateValidations(oController._sBCApplicationType, oApplicationObject.ChecklistStart, oApplicationObject.ChecklistEnd, oItem.getCells()[1].getDateValue(), "", oItem.getCells()[2].getValue()) === true) {
            //  bValidationFlag = true;
            //  return false;
            // }

            //Is on hold date/time in future?
            var oOnHold = new Date(
              oItem.getCells()[1].getDateValue().toDateString()
            );
            var oOnHold = oController._addSecondsToDate(
              oOnHold,
              oItem.getCells()[2].getValue()
            );

            if (oOnHold > new Date()) {
              MessageToast.show(oController.getI18NText("ON_HOLD_FUTURE"));
              bValidationFlag = true;
              return false;
            }

            //Is on hold date/time earlier than checklist start date?
            var appDate = oController._oModel.getData(oController._sPath);
            if (oOnHold < appDate.ChecklistStart) {
              MessageToast.show(oController.getI18NText("ON_HOLD_PAST"));
              bValidationFlag = true;
              return false;
            }
          });
        }

        // No need to process it if any validation failure
        if (bValidationFlag === true) {
          return false;
        }

        /*Start R-UX Document pointer
				Check if document added?*/
        this._getDocList().then(
          function (r) {
            if (
              this._aDocMgt.docCountChange === true ||
              this._aDocMgt.docUploaded === true
            ) {
              /*End R-UX Document pointer*/
              //Proceed

              // Get the RC RFI Off Hold updated values from Screen
              var sBCRFIOnHold = this.getView()
                .getModel("BCRFIReasons")
                .getData().BCRFIReason[0];

              oProperties.RecordId = this.Formatter.newGuid();
              oProperties.Reason = sBCRFIOnHold.Reason;
              oProperties.ReasonText = sBCRFIOnHold.ReasonText;
              sBCRFIOnHold.OnHoldDate = new Date(sBCRFIOnHold.OnHoldDate);
              oProperties.OnHoldDate = this.formatOnHoldOffHoldDate(
                sBCRFIOnHold.OnHoldDate
              );
              // Format the Time for OData Model
              oProperties.OnHoldtTme = this.formatUITime(
                sBCRFIOnHold.OnHoldtTme
              );

              // create entry in  OData Model
              oContext = this._oModel.createEntry(this._sApplicationHold, {
                properties: oProperties,
              });

              this._oBCRFIOnHoldPopup.setBusy(true);
              // Update the Button into Application Buttons Model
              this._updateApplicationButtons("ONHOLD");

              var fNProcess = function (fReturnValue) {
                // Process further after OData call
                if (fReturnValue === "Error") {
                  oController._oBCRFIOnHoldPopup.setBusy(false);
                  oController._oProcessViewer.setBusy(false);
                  MessageToast.show(
                    oController.getI18NText("UpdateFailedMessage")
                  );
                  jQuery.sap.log.error("Error on Update");
                  oController._oBCRFIOnHoldPopup.close();
                } else {
                  // Set Update Application Data
                  oController.getData(true);
                  oController._oBCRFIOnHoldPopup.setBusy(false);
                  oController._oProcessViewer.setBusy(false);
                  if (fReturnValue !== "Info") {
                    MessageToast.show(oController.getI18NText("OnHoldMessage"));
                  }
                  oController._oBCRFIOnHoldPopup.close();
                }
              }.bind(this);

              var sCurrentPath =
                "/" +
                oController._oModel.createKey(oController._sStepsCollection, {
                  ApplicationKey: oController._sProcessKey,
                  StepKey: oController._sStepKey,
                });

              if (
                this._oModel.getContext(sCurrentPath).getObject().Component ===
                  "formData" ||
                this._oModel.getContext(sCurrentPath).getObject().Component ===
                  "partners" ||
                this._oModel.getContext(sCurrentPath).getObject().Component ===
                  "property" ||
                this._oModel.getContext(sCurrentPath).getObject().Component ===
                  "notes" ||
                this._oModel.getContext(sCurrentPath).getObject().Component ===
                  "outcomes"
              ) {
                // Save
                this._saveChanges(bValidationRequired).then(fNProcess);
              } else if (this._oModel.hasPendingChanges()) {
                // submit the changes (creates entity at the backend)
                this._oModel.submitChanges({
                  success: function (oResponses) {
                    //Back end Error messages handling for Footer buttons
                    var bErrorFlag = false;

                    $.each(
                      oResponses.__batchResponses,
                      function (i, oResponse) {
                        if (oResponse.response) {
                          var sBody = oResponse.response.body;
                          var oErrors = JSON.parse(sBody);

                          $.each(
                            oErrors.error.innererror.errordetails,
                            function (j, oError) {
                              if (oError.severity === "error") {
                                bErrorFlag = true;
                                return false;
                              }
                            }
                          );

                          if (bErrorFlag === true) {
                            return false;
                          }
                        }
                      }
                    );

                    if (bErrorFlag === true) {
                      oController.deleteDuplicateMessages();
                      oController._oBCRFIOnHoldPopup.setBusy(false);
                      MessageToast.show(
                        oController.getI18NText("UpdateFailedMessage")
                      );
                      jQuery.sap.log.error("Error on Update");
                      oController._oBCRFIOnHoldPopup.close();
                    } else {
                      // Get the updated Application Data
                      oController.getData(true);
                      oController._oBCRFIOnHoldPopup.setBusy(false);
                      MessageToast.show(
                        oController.getI18NText("OnHoldMessage")
                      );

                      // Open the Reject in Pop up
                      oController._oBCRFIOnHoldPopup.close();
                    }
                  },
                  error: function () {
                    oController._oBCRFIOnHoldPopup.setBusy(false);
                    MessageToast.show(
                      oController.getI18NText("UpdateFailedMessage")
                    );
                    jQuery.sap.log.error("Error on Update");
                    oController._oBCRFIOnHoldPopup.close();
                  },
                });
              }
              /*Begin of Doc Check Change*/
            } else {
              //Raise Alert
              this._requestUpload(oController.getI18NText("ON_HOLD_NO_DOC"));
            }
          }.bind(this)
        );
        /*End of Doc Check Change*/
      },
      /**
       * Handle BC RFI OnHold Close Button
       */
      handleBCRFIReasonCancel: function () {
        // Open the Reject in Pop up
        this._oBCRFIOnHoldPopup.close();
      },
      /**
       * Handle BC Non RFI OnHold Ok Button
       */
      handleBCNonRFIOnHoldOk: function () {
        this._oBCNonRFIOnHoldPopup.setBusy(true);
        // Update the Button into Application Buttons Model
        this._updateApplicationButtons("ONHOLD");
        var oController = this;

        // Update the RC RFI Off Hold model from Screen
        if (this._oModel.hasPendingChanges()) {
          // submit the changes (creates entity at the backend)
          this._oModel.submitChanges({
            success: function () {
              oController.getData(true);
              oController._oBCNonRFIOnHoldPopup.setBusy(false);
              MessageToast.show(oController.getI18NText("OnHoldMessage"));
              // Open the BC Non RFI On Hold in Pop up
              oController._oBCNonRFIOnHoldPopup.close();
            },
            error: function () {
              oController._oBCNonRFIOnHoldPopup.setBusy(false);
              MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
              jQuery.sap.log.error("Error on Update");
            },
          });
        }
      },
      /**
       * Handle BC Non RFI OnHold Close Button
       */
      handleBCNonRFIOnHoldCancel: function () {
        // Open the Reject in Pop up
        this._oBCNonRFIOnHoldPopup.close();
      },
      /**
       * Handle RC Off Hold Ok Button
       * @returns {boolean} return from the function
       */
      handleRCOffHoldOk: function () {
        // Get the RC Off Hold updated values from Screen
        var aRCOffHold = this.getView().getModel("RCOffHoldReason").getData()
          .RCOffHoldReason.results;
        var sRCOffHoldPath;
        var oController = this;
        var oContext;
        var sRecordId = "";
        var bValidateSuccessFlag = false;
        var bDateValidationFlag = false;

        var sCPath =
          "/" +
          this._oModel.createKey(this._sApplicationButtons, {
            StepKey: this._sStepKey,
            ButtonId: this._sOffHold,
          });

        var bValidationRequired = this._oModel
          .getContext(sCPath)
          .getObject().ValidationRequired;

        // // Get the Current Application entity path based on the Application Key
        // var sPath = this._oModel.createKey(this._sProcessCollection, {
        //      ApplicationKey: this._sProcessKey
        //    });

        // // Get the Application Object for Start Date and End Date
        // var oApplicationObject = this._oModel.getContext(sPath).getObject();

        $.each(aRCOffHold, function (index, sRCOffHold) {
          sRecordId = "";

          // Process only if Off Hold Date is not null
          if (sRCOffHold.OffHoldDate === null) {
            return true;
          }

          // //   OnHold Date validations with Checklist Step Start Date & End date
          // if (oController._onHoldOffHoldDateValidations(oController._sRCApplicationType, oApplicationObject.ChecklistStart, oApplicationObject.ChecklistEnd, sRCOffHold.OnHoldDate, sRCOffHold.OffHoldDate) === true) {
          //  bDateValidationFlag = true;
          //  return false;
          // }

          // Fill sRecordId
          if (sRCOffHold.RecordId && sRCOffHold.RecordId !== "") {
            sRecordId = sRCOffHold.RecordId;
          } else {
            sRecordId = oController.Formatter.newGuid();
          }

          // Get the RC RFI Off Hold updated values from Model
          sRCOffHoldPath =
            "/" +
            oController._oModel.createKey(oController._sApplicationHold, {
              RecordId: sRecordId,
              StepKey: oController._sStepKey,
            });

          bValidateSuccessFlag = true;
          oContext = {};
          oContext = oController._oModel.getContext(sRCOffHoldPath);
          // if (sRecordId === "") {
          // sRCOffHold.RecordId = oController.Formatter.newGuid();
          // }
          oContext.getObject().RecordId = sRCOffHold.RecordId;
          sRCOffHold.OffHoldDate = new Date(sRCOffHold.OffHoldDate);
          sRCOffHold.OnHoldDate = new Date(sRCOffHold.OnHoldDate);
          // oContext.getObject().OffHoldTime = "PT18H00M00S";
          oContext.getObject().OffHoldTime = oController.formatUITime(
            oController.getCurrentTime(sRCOffHold.OffHoldDate)
          );
          // oContext.getObject().OnHoldtTme = oController.formatUITime(oController.getCurrentTime(sRCOffHold.OnHoldDate));
          oContext.getObject().OffHoldDate =
            oController.formatOnHoldOffHoldDate(sRCOffHold.OffHoldDate);
          oContext.getObject().OnHoldDate = oController.formatOnHoldOffHoldDate(
            sRCOffHold.OnHoldDate
          );
          oController._oModel.setProperty(
            "OffHoldDate",
            oController.formatOnHoldOffHoldDate(sRCOffHold.OffHoldDate),
            oContext
          );
          oController._oModel.setProperty(
            "OffHoldTime",
            "PT18H00M00S",
            oContext
          );
          oController._oModel.setProperty(
            "RecordId",
            sRCOffHold.RecordId,
            oContext
          );
          // oController._oModel.setProperty("OffHoldDate", oContext.getObject().OffHoldDate, oContext);
          oController._oModel.setProperty(
            "OnHoldDate",
            oContext.getObject().OnHoldDate,
            oContext
          );
          // oController._oModel.setProperty("OffHoldTime", oContext.getObject().OffHoldTime, oContext);
          oController._oModel.setProperty(
            "OnHoldtTme",
            oContext.getObject().OnHoldtTme,
            oContext
          );
          oController._oModel.setProperty("Rfi", " ", oContext);
        });

        if (bDateValidationFlag === true) {
          // No need to process if any Check list step date validation is failed
          return false;
        } else if (bValidateSuccessFlag === false) {
          // No need to process if none of the Off Hold is selected
          MessageToast.show(oController.getI18NText("SelectAtleastOneOffHold"));
          return false;
        }

        this._oRCOffHoldPopup.setBusy(true);
        // Update the Button into Application Buttons Model
        this._updateApplicationButtons("OFFHOLD");

        var fNProcess = function (fReturnValue) {
          // Process further after OData call
          if (fReturnValue === "Error") {
            oController._oRCOffHoldPopup.setBusy(false);
            oController._oProcessViewer.setBusy(false);
            MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
            jQuery.sap.log.error("Error on Update");
            oController._oRCOffHoldPopup.close();
          } else {
            // Set Update Application Data
            oController.getData(true);
            oController._oRCOffHoldPopup.setBusy(false);
            oController._oProcessViewer.setBusy(false);
            MessageToast.show(oController.getI18NText("OffHoldMessage"));
            oController._oRCOffHoldPopup.close();
          }
        }.bind(this);

        var sCurrentPath =
          "/" +
          oController._oModel.createKey(oController._sStepsCollection, {
            ApplicationKey: oController._sProcessKey,
            StepKey: oController._sStepKey,
          });

        if (
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "formData" ||
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "partners" ||
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "property" ||
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "notes" ||
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "outcomes"
        ) {
          // Save
          this._saveChanges(bValidationRequired).then(fNProcess);
        } else if (this._oModel.hasPendingChanges()) {
          // submit the changes (creates entity at the backend)
          this._oModel.submitChanges({
            success: function (oResponses) {
              //Back end Error messages handling for Footer buttons
              var bErrorFlag = false;

              $.each(oResponses.__batchResponses, function (i, oResponse) {
                if (oResponse.response) {
                  var sBody = oResponse.response.body;
                  var oErrors = JSON.parse(sBody);

                  $.each(
                    oErrors.error.innererror.errordetails,
                    function (j, oError) {
                      if (oError.severity === "error") {
                        bErrorFlag = true;
                        return false;
                      }
                    }
                  );

                  if (bErrorFlag === true) {
                    return false;
                  }
                }
              });

              if (bErrorFlag === true) {
                oController.deleteDuplicateMessages();
                oController._oRCOffHoldPopup.setBusy(false);
                MessageToast.show(
                  oController.getI18NText("UpdateFailedMessage")
                );
                jQuery.sap.log.error("Error on Update");
                oController._oRCOffHoldPopup.close();
              } else {
                // Get the updated Application Data
                oController.getData(true);
                oController._oRCOffHoldPopup.setBusy(false);
                MessageToast.show(oController.getI18NText("OffHoldMessage"));

                // Open the RC Off Hold in Pop up
                oController._oRCOffHoldPopup.close();
              }
            },
            error: function () {
              oController._oRCOffHoldPopup.setBusy(false);
              MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
              jQuery.sap.log.error("Error on Update");
              oController._oRCOffHoldPopup.close();
            },
          });
        }
      },
      /**
       * Handle RC Off Hold Close Button
       */
      handleRCOffHoldCancel: function () {
        // Open the Reject in Pop up
        this._oRCOffHoldPopup.close();
      },
      /**
       * Handle RC RFI Off Hold Ok Button
       * @returns {boolean} return from the function
       */
      handleRCRFIOffHoldOk: function () {
        //Check if BC application, moved the code to its own method to avoid confusion
        if (
          this._oModel.getData(this._sPath).ApplicationType ===
          this._sBCApplicationType
        ) {
          this.handleBCRFIOffHoldOk();
          return;
        }

        var bValidationFlag = false;
        var sRecordId = "";
        var sRCRFIOffHoldPath;
        var oController = this;
        var oContext;

        var sCPath =
          "/" +
          this._oModel.createKey(this._sApplicationButtons, {
            StepKey: this._sStepKey,
            ButtonId: this._sOffHold,
          });

        var bValidationRequired = this._oModel
          .getContext(sCPath)
          .getObject().ValidationRequired;

        // Get the RC RFI Off Hold updated values from Screen
        // var sRCRFIOffHold = this.getView().getModel("RCRFIOffHold").getData().RCRFIOffHold.results[0];
        var aBCOffHold = this.getView().getModel("RCRFIOffHold").getData()
          .RCRFIOffHold.results;

        // // Get the Current Application entity path based on the Application Key
        // var sPath = this._oModel.createKey(this._sProcessCollection, {
        //      ApplicationKey: this._sProcessKey
        //    });

        // // Get the Application Object for Start Date and End Date
        // var oApplicationObject = this._oModel.getContext(sPath).getObject();

        $.each(aBCOffHold, function (index, sRCRFIOffHold) {
          // Process only if Off Hold Date is not null & Raise error message if Date is empty
          if (sRCRFIOffHold.OffHoldDate === null) {
            MessageToast.show(oController.getI18NText("EmptyRFIDate"));
            bValidationFlag = true;
            return false;
          }

          // //   OnHold Date validations with Checklist Step Start Date & End date
          // if (oController._onHoldOffHoldDateValidations(oController._sBCApplicationType, oApplicationObject.ChecklistStart, oApplicationObject.ChecklistEnd, sRCRFIOffHold.OnHoldDate, sRCRFIOffHold.OffHoldDate, sRCRFIOffHold.OnHoldtTme,
          // sRCRFIOffHold.OffHoldtTme) === true) {
          //  bValidationFlag = true;
          //  return false;
          // }

          sRecordId = "";
          if (sRCRFIOffHold.RecordId && sRCRFIOffHold.RecordId !== "") {
            sRecordId = sRCRFIOffHold.RecordId;
          }

          // Get the RC RFI Off Hold updated values from Model
          sRCRFIOffHoldPath =
            "/" +
            oController._oModel.createKey(oController._sApplicationHold, {
              RecordId: sRecordId,
              StepKey: oController._sStepKey,
            });

          oContext = {};
          oContext = oController._oModel.getContext(sRCRFIOffHoldPath);

          if (sRecordId === "") {
            sRCRFIOffHold.RecordId = oController.Formatter.newGuid();
          }
          oContext.getObject().RecordId = sRCRFIOffHold.RecordId;
          sRCRFIOffHold.OffHoldDate = new Date(sRCRFIOffHold.OffHoldDate);
          oContext.getObject().OnHoldDate = oController.formatOnHoldOffHoldDate(
            sRCRFIOffHold.OnHoldDate
          );
          oContext.getObject().OffHoldDate =
            oController.formatOnHoldOffHoldDate(sRCRFIOffHold.OffHoldDate);
          // Format the Time for OData Model
          // sRCRFIOffHold.OffHoldTime = "PT18H00M00S";
          //   sRCRFIOffHold.OffHoldTime = oController.formatUITime(sRCRFIOffHold.OffHoldtTme);
          sRCRFIOffHold.OffHoldTime = oController.formatUITime(
            sRCRFIOffHold.OffHoldTme
          );

          /*var format1 = sap.ui.core.format.DateFormat.getDateInstance({pattern : "PTkk'H'mm'M'ss'S'"});
       //sRCRFIOffHold.OffHoldTime = format1.format(sRCRFIOffHold.OffHoldTme);*/
          // Raise error message if Time is emtpy
          if (
            sRCRFIOffHold.OffHoldTime === null ||
            sRCRFIOffHold.OffHoldTime === ""
          ) {
            MessageToast.show(oController.getI18NText("EmptyRFITime"));
            bValidationFlag = true;
            return false;
          }
          oContext.getObject().OffHoldTime = sRCRFIOffHold.OffHoldTime;

          oController._oModel.setProperty(
            "RecordId",
            sRCRFIOffHold.RecordId,
            oContext
          );
          oController._oModel.setProperty(
            "OnHoldDate",
            oContext.getObject().OnHoldDate,
            oContext
          );

          //  oController._oModel.setProperty("OffHoldDate", oContext.getObject().OffHoldDate, oContext);
          oController._oModel.setProperty(
            "OffHoldDate",
            oController.formatOnHoldOffHoldDate(sRCRFIOffHold.OffHoldDate),
            oContext
          );
          oController._oModel.setProperty(
            "OffHoldTime",
            sRCRFIOffHold.OffHoldTime,
            oContext
          );
        });

        // No need to process it if any validation failure
        if (bValidationFlag === true) {
          return false;
        }

        this._oRCRFIOffHoldPopup.setBusy(true);
        // Update the Button into Application Buttons Model
        this._updateApplicationButtons("OFFHOLD");

        var fNProcess = function (fReturnValue) {
          // Process further after OData call
          if (fReturnValue === "Error") {
            oController._oRCRFIOffHoldPopup.setBusy(false);
            oController._oProcessViewer.setBusy(false);
            MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
            jQuery.sap.log.error("Error on Update");
            oController._oRCRFIOffHoldPopup.close();
          } else {
            // Set Update Application Data
            oController.getData(true);
            oController._oRCRFIOffHoldPopup.setBusy(false);
            oController._oProcessViewer.setBusy(false);
            MessageToast.show(oController.getI18NText("OffHoldMessage"));
            oController._oRCRFIOffHoldPopup.close();
          }
        }.bind(this);

        var sCurrentPath =
          "/" +
          oController._oModel.createKey(oController._sStepsCollection, {
            ApplicationKey: oController._sProcessKey,
            StepKey: oController._sStepKey,
          });

        if (
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "formData" ||
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "partners" ||
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "property" ||
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "notes" ||
          this._oModel.getContext(sCurrentPath).getObject().Component ===
            "outcomes"
        ) {
          // Save
          this._saveChanges(bValidationRequired).then(fNProcess);
        } else if (this._oModel.hasPendingChanges()) {
          // submit the changes (creates entity at the backend)
          this._oModel.submitChanges({
            success: function (oResponses) {
              //Back end Error messages handling for Footer buttons
              var bErrorFlag = false;

              $.each(oResponses.__batchResponses, function (i, oResponse) {
                if (oResponse.response) {
                  var sBody = oResponse.response.body;
                  var oErrors = JSON.parse(sBody);

                  $.each(
                    oErrors.error.innererror.errordetails,
                    function (j, oError) {
                      if (oError.severity === "error") {
                        bErrorFlag = true;
                        return false;
                      }
                    }
                  );

                  if (bErrorFlag === true) {
                    return false;
                  }
                }
              });

              if (bErrorFlag === true) {
                oController.deleteDuplicateMessages();
                oController._oRCRFIOffHoldPopup.setBusy(false);
                MessageToast.show(
                  oController.getI18NText("UpdateFailedMessage")
                );
                jQuery.sap.log.error("Error on Update");
                oController._oRCRFIOffHoldPopup.close();
              } else {
                // Get the updated Application Data
                oController.getData(true);
                oController._oRCRFIOffHoldPopup.setBusy(false);
                MessageToast.show(oController.getI18NText("OffHoldMessage"));
                // Open the RC RFI Hold in Pop up
                oController._oRCRFIOffHoldPopup.close();
              }
            },
            error: function () {
              oController._oRCRFIOffHoldPopup.setBusy(false);
              MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
              jQuery.sap.log.error("Error on Update");
              oController._oRCRFIOffHoldPopup.close();
            },
          });
        }
      },
      /**
       * Handle RC RFI Off Hold Close Button
       */
      handleRCRFIOffHoldCancel: function () {
        // Open the RC RFI Off Hold in Pop up
        this._oRCRFIOffHoldPopup.close();
      },
      /**
       * Update the Application Buttons Model
       * @param {string} sButtonID Button ID
       */
      _updateApplicationButtons: function (sButtonID) {
        // Get the Application Button updated values from Model
        var sApplicationButtonsPath =
          "/" +
          this._oModel.createKey(this._sApplicationButtons, {
            StepKey: this._sStepKey,
            ButtonId: sButtonID,
          });

        var oApplicationButtonsContext = this._oModel.getContext(
          sApplicationButtonsPath
        );
        oApplicationButtonsContext.getObject().Icon = "";
        oApplicationButtonsContext.getObject().ButtonText = "";
        this._oModel.setProperty("Icon", "", oApplicationButtonsContext);
        this._oModel.setProperty("ButtonText", "", oApplicationButtonsContext);
      },
      /**
       * Handle BC Non RFI Off Hold Ok Button
       */
      handleBCNonRFIOffHoldOk: function () {
        var oController = this;
        this._oBCNonRFIOffHoldPopup.setBusy(true);
        // Update the Button into Application Buttons Model
        this._updateApplicationButtons("OFFHOLD");

        // Update the RC RFI Off Hold model from Screen
        if (this._oModel.hasPendingChanges()) {
          // submit the changes (creates entity at the backend)
          this._oModel.submitChanges({
            success: function () {
              // set updated applition data
              oController.getData(true);
              oController._oBCNonRFIOffHoldPopup.setBusy(false);
              MessageToast.show(oController.getI18NText("OffHoldMessage"));
              // Open the BC Non RFI Off Hold in Pop up
              oController._oBCNonRFIOffHoldPopup.close();
            },
            error: function () {
              oController._oBCNonRFIOffHoldPopup.setBusy(false);
              MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
              jQuery.sap.log.error("Error on Update");
            },
          });
        }
      },
      /**
       * Handle BC Non RFI OffHold Close Button
       */
      handleBCNonRFIOffHoldCancel: function () {
        // Open the BC Non RFI Off Hold in Pop up
        this._oBCNonRFIOffHoldPopup.close();
      },
      /**
       * Handle Alert Message Popup Ok Button
       */
      handleAlertClose: function () {
        // Close the Alert Message in Pop up
        this._oAlertMessagePopup.close();
      },
      /**
       * Get theAlert Message from Back end
       */
      _getAlertMessages: function () {
        var sQuery = "ApplicationKey eq guid'" + this._sProcessKey + "'";

        var oController = this;
        this._oModel.read("/ApplicationAlert", {
          // filter: ApplicationKey = this._sProcessKey {
          urlParameters: {
            $filter: sQuery,
          },
          success: function (oData) {
            var aApplicationAlert = oData.results;
            var iLength = aApplicationAlert.length;
            var aAlertMessage = [];
            var oAlertMessage = {
              MessageTitle: "",
              MessageText: "",
            };
            var iStartIndex;

            if (iLength > 0) {
              // Split the Alert Message Title & Alert Message
              $.each(oData.results, function (index, sAlertMessages) {
                oAlertMessage = {};
                iStartIndex = 0;
                iStartIndex = sAlertMessages.Message.indexOf(
                  oController._sHTMLTag
                );
                oAlertMessage.MessageTitle = sAlertMessages.Message.substring(
                  0,
                  iStartIndex
                );
                oAlertMessage.MessageText =
                  sAlertMessages.Message.substring(iStartIndex);
                aAlertMessage.push(oAlertMessage);
              });

              // Set the JSON model
              var oApplicationAlert = new sap.ui.model.json.JSONModel({
                AlertMessages: aAlertMessage,
              });

              oController
                .getView()
                .setModel(oApplicationAlert, "AlertMessages");
              if (!oController._oAlertMessagePopup) {
                oController._oAlertMessagePopup = sap.ui.xmlfragment(
                  oController._AlertCriticalPopup,
                  oController
                );
                oController
                  .getView()
                  .addDependent(oController._oAlertMessagePopup);
              }

              // Open the Alert Messages in Pop up
              oController._oAlertMessagePopup.open();
            }
          },
        });
      },

      /**
       * Set the Reason & Reason Text to Model
       * @param {object} oEvent The text key to get I18N text .
       */
      handleSelectionChange: function (oEvent) {
        var aItems = [];
        var oCell = {};
        // var iCount = 0;

        // Get the Table Reference
        var oTable = this._oRCOnHoldPopup.getContent()[1];
        if (oTable) {
          // Get the Items
          aItems = oTable.getItems();

          $.each(aItems, function (index, oItem) {
            oCell = {};
            oCell = oItem.getCells()[0];

            // Increase the count as one for duplicate reason
            if (
              oEvent.getParameter("selectedItem").getKey() ===
              oCell.mProperties.selectedKey
            ) {
              // Set the Tooltip
              oCell.setTooltip(oEvent.getParameter("selectedItem").getText());
            }
          });
        }
      },
      /**
       * Set the BC On Hold Reason & Reason Text to Model
       * @param {object} oEvent The text key to get I18N text .
       */
      handleBCOnHoldSelectionChange: function (oEvent) {
        var oController = this;

        // Update the OData Model based on the screen selection
        oController
          .getView()
          .getModel("BCRFIReasons")
          .getData().BCRFIReason[0].Reason = oEvent
          .getParameter("selectedItem")
          .getKey();
        oController
          .getView()
          .getModel("BCRFIReasons")
          .getData().BCRFIReason[0].ReasonText = oEvent
          .getParameter("selectedItem")
          .getText();

        // Get the Table Reference
        var oTable = this._oBCRFIOnHoldPopup.getContent()[1];
        if (oTable) {
          // Get the Item
          var oItems = oTable.getItems()[0];

          if (oItems) {
            var oCell = oItems.getCells()[0];
            // Set the Tooltip
            oCell.setTooltip(oEvent.getParameter("selectedItem").getText());
          }
        }
        return false;
      },

      /**
       * Format HTML string into Normal String
       * @param {string} sText
       * @return {string} sInnerText Text for condent
       */
      formatString: function (sText) {
        var sInnerText = "";
        if (sText) {
          var obj = $.parseHTML(sText);
          obj.forEach(function (entry) {
            sInnerText = sInnerText + " " + entry.textContent;
          });
          return sInnerText;
        }
        return sInnerText;
      },
      /**
       * Format Time for OData Model Update
       * @param {string} sTime text
       * @return {string} sFormatTime Current Time Stamp
       */
      formatUITime: function (sTime) {
        // Format the Time
        var sFormatTime = sTime.replace(":", "");
        sFormatTime = sFormatTime.replace(":", "");
        sFormatTime = sFormatTime.replace(":", "");

        var sHH = sFormatTime.substring(0, 2);
        var sMM = sFormatTime.substring(2, 4);
        var sSS = sFormatTime.substring(4, 6);

        sFormatTime = "PT" + sHH + "H" + sMM + "M" + sSS + "S"; // PT16H46M00S
        return sFormatTime;
      },
      /**
       * Get the Current Time in HH:MM:SS format
       * @param {object} oCurrentTimeStamp Current Time Stamp
       * @return {string} sCurrnetTime Current Time Stamp
       */
      getCurrentTime: function (oCurrentTimeStamp) {
        var sCurrnetTime = "00:00:00";

        var sHours = oCurrentTimeStamp.getHours();
        sHours = sHours.toString();
        if (sHours.length < 2) {
          sHours = "0" + sHours;
        }

        var sMinutes = oCurrentTimeStamp.getMinutes();
        sMinutes = sMinutes.toString();
        if (sMinutes.length < 2) {
          sMinutes = "0" + sMinutes;
        }
        var sSeconds = oCurrentTimeStamp.getSeconds();
        sSeconds = sSeconds.toString();
        if (sSeconds.length < 2) {
          sSeconds = "0" + sSeconds;
        }
        sCurrnetTime = sHours + ":" + sMinutes + ":" + sSeconds;
        return sCurrnetTime;
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
      getI18NText: function (sTextKey, aParameters) {
        return this.getView()
          .getModel("i18n")
          .getResourceBundle()
          .getText(sTextKey, aParameters);
      },
      /**
       * set the screen busy indicator for entire screen
       *
       */
      setScreenBusyIndicator: function () {
        // Set Busy Indicator
        this._oProcessViewer.setBusyIndicatorDelay(0);
        this._oProcessViewer.setBusy(true);
      },
      /**
       * Remove the screen busy indicator for entire screen
       *
       */
      removeScreenBusyIndicator: function () {
        // Remove the busy indicator
        this._oProcessViewer.setBusy(false);
      },
      /**
       * Refresh the Nav Bar Icon as either Error(Red) or Success(Green)
       *
       */
      refreshNavBarIcons: function () {
        // Navigation Bar Icon refresh
        this._oProcessViewer.rerenderNavBarContent();
      },
      /**
       * Delete duplicate messages
       */
      deleteDuplicateMessages: function () {
        var aFinalMessages = [];
        var bUpdate = false;

        var aMessages = sap.ui
          .getCore()
          .getMessageManager()
          .getMessageModel().oData;
        $.each(aMessages, function (i, oMessage) {
          if (aFinalMessages.length === 0) {
            // Add only Unique message
            aFinalMessages.push(oMessage);
            return true;
          }

          bUpdate = false;
          // Check for duplicate messages
          $.each(aFinalMessages, function (j, oFinalMessage) {
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
        sap.ui.getCore().getMessageManager().getMessageModel().oData =
          aFinalMessages;
        sap.ui.getCore().getMessageManager().getMessageModel().refresh();
      },
      /**
       * Formats Date for locale specific date display
       *
       * @param {object} oDate object for On Hold
       * @returns {string} sDate specific date string
       * @public
       */
      formatOnHoldOffHoldDate: function (oDate) {
        var sDate = "";
        var oApplicationDate = new Date(oDate);
        var sMonth = "" + (oApplicationDate.getMonth() + 1);
        var sDay = "" + oApplicationDate.getDate();
        var sYear = oApplicationDate.getFullYear();

        if (sMonth.length < 2) {
          sMonth = "0" + sMonth;
        }
        if (sDay.length < 2) {
          sDay = "0" + sDay;
        }

        sDate = [sYear, sMonth, sDay].join("");
        return sDate;
      },
      /**
       * Formats Date for locale specific date display
       *
       * @param {string} sDate object for On Hold
       * @returns {object} oDate Locale specific date string
       * @public
       */
      formatOnHoldOffHoldDateForDisplay: function (sDate) {
        // Split Year,Month & Day
        var sYear = sDate.slice(0, 4);
        var sMonth = sDate.slice(4, 6);
        var sDay = sDate.slice(6, 8);
        sDate = [sYear, sMonth, sDay].join("/");

        // Get the Date object
        var oDate = new Date(sDate);
        return oDate;

        // var oApplicationDate = new Date();
        // // Split Year,Month & Day
        // var sYear = sDate.slice(0, 4);
        // var iMonth = sDate.slice(4, 6);
        // iMonth = Number(iMonth);
        // // Need to decrement 1, since standard Date function giving one month advance
        // iMonth = iMonth - 1;
        // var sMonth = String(iMonth);
        // var sDay = sDate.slice(6, 8);
        // oApplicationDate.setDate(sDay);
        // oApplicationDate.setMonth(sMonth);
        // oApplicationDate.setFullYear(sYear);

        // // Get the Date object
        // var oDate = new Date(oApplicationDate);
        // return oDate;
      },
      /**
       * Convert the time format into Number
       *
       * @param {object} oDate Date.
       * @return {String} iTime for Converted Time
       * @private
       *
       */
      _convertTimeIntoNumberFormat: function (oDate) {
        var iTime = "";

        // Get the Time as Hours,Minutes & Second
        var sHours = oDate.getHours();
        var sMinutes = oDate.getMinutes();
        var sSeconds = oDate.getSeconds();

        if (sHours.length < 2) {
          sHours = "0" + sHours;
        }
        if (sMinutes.length < 2) {
          sMinutes = "0" + sMinutes;
        }
        if (sSeconds.length < 2) {
          sSeconds = "0" + sSeconds;
        }

        iTime = String(sHours) + String(sMinutes) + String(sSeconds);
        iTime = Number(iTime);

        // Return as HHMMSS format
        return iTime;
      },
      // R-UX document management on RFI pop up
      _getButtonPressed: function () {
        if (this.buttonId.indexOf(this._aButtonIDs[0]) > -1) {
          return this._aButtonIDs[0];
        } else if (this.buttonId.indexOf(this._aButtonIDs[1]) > -1) {
          return this._aButtonIDs[1];
        }
      },
      //can't work with control IDs - fails when open twice or more, therefore use text
      onLaunchURL: function (oEvent) {
        if (oEvent.getSource().getText() === this.getI18NText("TEMPLATE_TXT")) {
          this.buttonId = "TEMPLATE";
        } else if (
          oEvent.getSource().getText() == this.getI18NText("UPLOAD_TXT")
        ) {
          this.buttonId = "UPLOAD_OTX";
        }
        // this.buttonId = oEvent.getSource().getId().toUpperCase();
        this._displayRedirectURL("");
      },

      _displayRedirectURL: function (partnerNumber, partnerFunction) {
        var aFilters = [];

        aFilters.push(
          new sap.ui.model.Filter(
            "Parameter1",
            sap.ui.model.FilterOperator.EQ,
            partnerNumber
          )
        );

        aFilters.push(
          new sap.ui.model.Filter(
            "Parameter3",
            sap.ui.model.FilterOperator.EQ,
            partnerFunction
          )
        );

        aFilters.push(
          new sap.ui.model.Filter(
            "StepKey",
            sap.ui.model.FilterOperator.EQ,
            this._sStepKey
          )
        );

        //var component = this._getButtonPressed(); //Get component name from button Id
        //var component = "UPLOAD";
        //note that a new entry in ZCDP_C_APLINK triggered by UPLOAD_OTX could point to OpenText directly
        var component = this.buttonId;
        aFilters.push(
          new sap.ui.model.Filter(
            "Component",
            sap.ui.model.FilterOperator.EQ,
            component
          )
        );

        var aFilter = [];

        aFilter.push(new sap.ui.model.Filter(aFilters, true));

        //sPath = "/" + this_sApplicationLinksCollection;
        var sPath = "/ApplicationLinks";

        sap.ui.core.BusyIndicator.show();
        this._oModel.read(sPath, {
          filters: aFilter,
          success: function (oEvent) {
            if (oEvent.results.length > 0) {
              /*Begin of RUX Mandatory upload
							Only for RUX Doc Management and running in IE, force URL to open in chrome
							This will only work in IE on pages served via HTTPS*/
              if (
                component === "UPLOAD_OTX" &&
                sap.ui.Device.browser.name ===
                  sap.ui.Device.browser.BROWSER.INTERNET_EXPLORER
              ) {
                var oShell = new ActiveXObject("WScript.Shell");
                var command = "Chrome --new-window " + oEvent.results[0].Url;
                oShell.run(command);
                MessageToast.show("R-UX DM opened in a new Chrome Window!");
              } else {
                /*End of RUX Mandatory upload*/

                window.open(oEvent.results[0].Url);
              }
            }
            sap.ui.core.BusyIndicator.hide();
          },
          error: function () {
            sap.ui.core.BusyIndicator.hide();
            jQuery.sap.log.error("Error retrieving URL");
          },
        });
      },
      //Template dialog

      onPSearchHelp: function (oEvent) {
        //this.buttonId = oEvent.getSource().getId().toUpperCase();
        if (oEvent.getSource().getText() === this.getI18NText("TEMPLATE_TXT")) {
          this.buttonId = "TEMPLATE";
        } else if (
          oEvent.getSource().getText() == this.getI18NText("UPLOAD_TXT")
        ) {
          this.buttonId = "UPLOAD_OTX";
        }

        if (!this._pasHelpDialog) {
          this._pasHelpDialog = sap.ui.xmlfragment(this._sAPSearchHelp, this);

          this._pasHelpDialog.setModel(this._oModel); //Required so table dialog shows data from service

          this._pasHelpDialog.setModel(this.getView().getModel("i18n"), "i18n");
          this.getView().addDependent(this._pasHelpDialog);
        }

        this.aFilterBy = [];
        this.aFilterBy.push(
          new sap.ui.model.Filter(
            "StepKey",
            sap.ui.model.FilterOperator.EQ,
            this._sStepKey
          )
        );
        this.aFilterBy.push(
          new sap.ui.model.Filter(
            "ActiveFilter",
            sap.ui.model.FilterOperator.EQ,
            "X"
          )
        );

        this._pasHelpDialog.bindAggregation("items", {
          path: "/" + this._sPartiesCollection,
          sorter: [new sap.ui.model.Sorter("FirstName", false)],
          parameters: {},
          template: this.oPSTemplate,
          filters: this.aFilterBy,
        });

        this._pasHelpDialog.open();
      },

      _handleValueHelpClose: function (oEvent) {
        var oSelectedItem = oEvent.getParameter("selectedItem");

        if (oSelectedItem) {
          var oContext = oSelectedItem.getBindingContext().getObject();
          this._displayRedirectURL(
            oContext.PartnerNumber,
            oContext.PartnerFunction
          );
        }
      },

      _getDocList: function () {
        if (this._aDocMgt.noCheckReqd === true) {
          //no check needed for this process
          this._aDocMgt.docUploaded = true;
          var promise = new Promise(function (resolve) {
            //return a fake promise,just like your ex
            resolve();
          });
        } else {
          this._aDocMgt.docCountChange = false;
          var aFilters = [];
          aFilters.push(
            new sap.ui.model.Filter({
              path: "ApplicationKey", //This is step guid
              operator: sap.ui.model.FilterOperator.EQ,
              value1: this._sProcessKey,
            })
          );
          var that = this;
          sap.ui.core.BusyIndicator.show();
          promise = new Promise(function (resolve) {
            that._oModel.read("/DocumentListSet", {
              filters: aFilters,
              success: function (data) {
                sap.ui.core.BusyIndicator.hide();
                if (data.results.length > 0) {
                  if (data.results[0].NoCheck === true) {
                    //If check not required set flag to avoid dupl check
                    that._aDocMgt.docUploaded =
                      that._aDocMgt.noCheckReqd = true;
                  }
                  if (that._aDocMgt.docCount < data.results.length) {
                    that._aDocMgt.docCountChange = true;
                  }
                  that._aDocMgt.docCount = data.results.length;
                }
                resolve(data);
              },
              error: function (data) {
                //An error occurred in reading the documents
                //Not sure how we should handle this? - Do we stop the user?
                sap.ui.core.BusyIndicator.hide();
                MessageToast.show(that.getI18NText("DOC_READ_ERR"));
              },
            });
          });
        }
        return promise;
      },

      _requestUpload: function (vMessage) {
        var that = this;
        var promise = new Promise(function (resolve, reject) {
          MsgBox.warning(vMessage, {
            title: "Alert", // default
            actions: [that.getI18NText("UPLOAD"), MsgBox.Action.CLOSE],
            emphasizedAction: that.getI18NText("UPLOAD"),
            onClose: function (oAction) {
              if (oAction === null || oAction === MsgBox.Action.CLOSE) {
                //etc
                reject(oAction); // or some other variable
              } else {
                //do something else
                that.buttonId = "UPLOAD_OTX";
                that._displayRedirectURL("");
                resolve(oAction); // or some other variable
              }
            },
          });
        });
        return promise;
      },

      /* The below method is a copy of handleRCRFIOffHoldOk
			it`s moved to its own method for BC to avoid confusion
			also added Document pointer specfic logic*/
      handleBCRFIOffHoldOk: function () {
        var bValidationFlag = false;
        var bValidateSuccessFlag = false;
        var sRecordId = "";
        var sRCRFIOffHoldPath;
        var oController = this;
        var oContext;

        var sCPath =
          "/" +
          this._oModel.createKey(this._sApplicationButtons, {
            StepKey: this._sStepKey,
            ButtonId: this._sOffHold,
          });

        var bValidationRequired = this._oModel
          .getContext(sCPath)
          .getObject().ValidationRequired;

        // Get the RC RFI Off Hold updated values from Screen
        // var sRCRFIOffHold = this.getView().getModel("RCRFIOffHold").getData().RCRFIOffHold.results[0];
        var aBCOffHold = this.getView().getModel("RCRFIOffHold").getData()
          .RCRFIOffHold.results;

        $.each(aBCOffHold, function (index, sRCRFIOffHold) {
          // Process only if Off Hold Date is not null & Raise error message if Date is empty
          /*Begin of clock management change
					//if ((sRCRFIOffHold.OffHoldDate === null)
					//MessageToast.show(oController.getI18NText("EmptyRFIDate"));
					//bValidationFlag = true;
					//return false; */
          if (
            sRCRFIOffHold.OffHoldDate === null ||
            sRCRFIOffHold.OffHoldTme === null ||
            sRCRFIOffHold.OffHoldTme === "" ||
            sRCRFIOffHold.OffHoldTme === undefined
          ) {
            return true;
          }

          var oOffHold = oController._addSecondsToDate(
            sRCRFIOffHold.OffHoldDate,
            sRCRFIOffHold.OffHoldTme
          );
          if (oOffHold > new Date()) {
            //Off hold date in future is wrong
            MessageToast.show(oController.getI18NText("OFF_HOLD_FUTURE"), {
              at: sap.ui.core.Popup.Dock.CenterCenter,
            });
            return true;
          }

          var oOnHold = oController._addSecondsToDate(
            sRCRFIOffHold.OnHoldDate,
            sRCRFIOffHold.OnHoldtTme
          );
          if (oOffHold < oOnHold) {
            //Off hold cant be before on hold date
            MessageToast.show(oController.getI18NText("OFF_HOLD_PAST"), {
              at: sap.ui.core.Popup.Dock.CenterCenter,
            });
            return true;
          }

          sRecordId = "";
          if (sRCRFIOffHold.RecordId && sRCRFIOffHold.RecordId !== "") {
            sRecordId = sRCRFIOffHold.RecordId;
          }

          // Get the RC RFI Off Hold updated values from Model
          sRCRFIOffHoldPath =
            "/" +
            oController._oModel.createKey(oController._sApplicationHold, {
              RecordId: sRecordId,
              StepKey: oController._sStepKey,
            });

          oContext = {};
          oContext = oController._oModel.getContext(sRCRFIOffHoldPath);

          if (sRecordId === "") {
            sRCRFIOffHold.RecordId = oController.Formatter.newGuid();
          }
          oContext.getObject().RecordId = sRCRFIOffHold.RecordId;
          sRCRFIOffHold.OffHoldDate = new Date(sRCRFIOffHold.OffHoldDate);
          oContext.getObject().OnHoldDate = oController.formatOnHoldOffHoldDate(
            sRCRFIOffHold.OnHoldDate
          );
          oContext.getObject().OffHoldDate =
            oController.formatOnHoldOffHoldDate(sRCRFIOffHold.OffHoldDate);
          // Format the Time for OData Model
          // sRCRFIOffHold.OffHoldTime = "PT18H00M00S";
          //   sRCRFIOffHold.OffHoldTime = oController.formatUITime(sRCRFIOffHold.OffHoldtTme);
          sRCRFIOffHold.OffHoldTime = oController.formatUITime(
            sRCRFIOffHold.OffHoldTme
          );

          // Raise error message if Time is emtpy
          /*begin of clock changes
					if ((sRCRFIOffHold.OffHoldTime === null) || (sRCRFIOffHold.OffHoldTime === "")) {
						MessageToast.show(oController.getI18NText("EmptyRFITime"));
						bValidationFlag = true;
						return false;
					}
					end of clock changes */
          bValidateSuccessFlag = true;
          oContext.getObject().OffHoldTime = sRCRFIOffHold.OffHoldTime;

          oController._oModel.setProperty(
            "RecordId",
            sRCRFIOffHold.RecordId,
            oContext
          );
          oController._oModel.setProperty(
            "OnHoldDate",
            oContext.getObject().OnHoldDate,
            oContext
          );

          //  oController._oModel.setProperty("OffHoldDate", oContext.getObject().OffHoldDate, oContext);
          oController._oModel.setProperty(
            "OffHoldDate",
            oController.formatOnHoldOffHoldDate(sRCRFIOffHold.OffHoldDate),
            oContext
          );
          oController._oModel.setProperty(
            "OffHoldTime",
            sRCRFIOffHold.OffHoldTime,
            oContext
          );
        });

        // No need to process it if any validation failure
        if (bValidationFlag === true) {
          return false;
          /*Begin of clock management change*/
        } else if (bValidateSuccessFlag === false) {
          // No need to process if none of the Off Hold is selected
          MessageToast.show(oController.getI18NText("EmptyRFIDateTime"));
          return false;
        }

        /*Begin of RUX Mandatory upload
				Check if document added?*/
        this._getDocList().then(
          function (r) {
            if (
              this._aDocMgt.docCountChange === true ||
              this._aDocMgt.docUploaded === true
            ) {
              /*End of RUX Mandatory upload*/
              this._oRCRFIOffHoldPopup.setBusy(true);
              // Update the Button into Application Buttons Model
              this._updateApplicationButtons("OFFHOLD");

              var fNProcess = function (fReturnValue) {
                // Process further after OData call
                if (fReturnValue === "Error") {
                  oController._oRCRFIOffHoldPopup.setBusy(false);
                  oController._oProcessViewer.setBusy(false);
                  MessageToast.show(
                    oController.getI18NText("UpdateFailedMessage")
                  );
                  jQuery.sap.log.error("Error on Update");
                  oController._oRCRFIOffHoldPopup.close();
                } else {
                  // Set Update Application Data
                  oController.getData(true);
                  oController._oRCRFIOffHoldPopup.setBusy(false);
                  oController._oProcessViewer.setBusy(false);
                  MessageToast.show(oController.getI18NText("OffHoldMessage"));
                  oController._oRCRFIOffHoldPopup.close();
                }
              }.bind(this);

              var sCurrentPath =
                "/" +
                oController._oModel.createKey(oController._sStepsCollection, {
                  ApplicationKey: oController._sProcessKey,
                  StepKey: oController._sStepKey,
                });

              if (
                this._oModel.getContext(sCurrentPath).getObject().Component ===
                  "formData" ||
                this._oModel.getContext(sCurrentPath).getObject().Component ===
                  "partners" ||
                this._oModel.getContext(sCurrentPath).getObject().Component ===
                  "property" ||
                this._oModel.getContext(sCurrentPath).getObject().Component ===
                  "notes" ||
                this._oModel.getContext(sCurrentPath).getObject().Component ===
                  "outcomes"
              ) {
                // Save
                this._saveChanges(bValidationRequired).then(fNProcess);
              } else if (this._oModel.hasPendingChanges()) {
                // submit the changes (creates entity at the backend)
                this._oModel.submitChanges({
                  success: function (oResponses) {
                    //Back end Error messages handling for Footer buttons
                    var bErrorFlag = false;

                    $.each(
                      oResponses.__batchResponses,
                      function (i, oResponse) {
                        if (oResponse.response) {
                          var sBody = oResponse.response.body;
                          var oErrors = JSON.parse(sBody);

                          $.each(
                            oErrors.error.innererror.errordetails,
                            function (j, oError) {
                              if (oError.severity === "error") {
                                bErrorFlag = true;
                                return false;
                              }
                            }
                          );

                          if (bErrorFlag === true) {
                            return false;
                          }
                        }
                      }
                    );

                    if (bErrorFlag === true) {
                      oController.deleteDuplicateMessages();
                      oController._oRCRFIOffHoldPopup.setBusy(false);
                      MessageToast.show(
                        oController.getI18NText("UpdateFailedMessage")
                      );
                      jQuery.sap.log.error("Error on Update");
                      oController._oRCRFIOffHoldPopup.close();
                    } else {
                      // Get the updated Application Data
                      oController.getData(true);
                      oController._oRCRFIOffHoldPopup.setBusy(false);
                      MessageToast.show(
                        oController.getI18NText("OffHoldMessage")
                      );
                      // Open the RC RFI Hold in Pop up
                      oController._oRCRFIOffHoldPopup.close();
                    }
                  },
                  error: function () {
                    oController._oRCRFIOffHoldPopup.setBusy(false);
                    MessageToast.show(
                      oController.getI18NText("UpdateFailedMessage")
                    );
                    jQuery.sap.log.error("Error on Update");
                    oController._oRCRFIOffHoldPopup.close();
                  },
                });
              }
            } else {
              //Raise Alert
              this._requestUpload(oController.getI18NText("OFF_HOLD_NO_DOC"));
            }
          }.bind(this)
        );
      },

      _getRFIPopup: function () {
        var oController = this;
        this._oModel.read("/RFIPopupSet(guid'" + this._sProcessKey + "')", {
          success: function (oData) {
            oController._aDocMgt.showRFIPopup = oData.clockImpact;
          },
          error: function (oData) {
            //Nothing to do
            oController._aDocMgt.showRFIPopup = "";
          },
        });
      },

      /* Calculates correct RFI Message based on clock impacting value
			returns a promise resolved */
      _showRFIPopup: function (sId) {
        var sText = this.getI18NText("COMMON_" + sId);
        switch (this._aDocMgt.showRFIPopup) {
          case "":
            return Promise.resolve(sId); //No RFI popup
            break;
          case "01":
            //Clock Impact
            return this._msgRFI(this.getI18NText("CLOCK_" + sId) + sText, sId);
          case "02":
            //Non-Clock Impact
            return this._msgRFI(
              this.getI18NText("NON_CLOCK_" + sId) + sText,
              sId
            );
          case "03":
            //No Clock Impact
            return this._msgRFI(
              this.getI18NText("NO_CLOCK_" + sId) + sText,
              sId
            );
          default:
            return Promise.resolve(sId); //No RFI popup
            break;
        }
      },

      /* Shows Actual RFI Wanrning popup based on incoming messagetype
			returns a promise */
      _msgRFI: function (sText, sTitle) {
        var formattedText = new sap.m.FormattedText({
          htmlText: sText,
        });
        var promise = new Promise(function (resolve, reject) {
          MsgBox.warning(formattedText, {
            actions: [MsgBox.Action.OK, MsgBox.Action.CANCEL],
            emphasizedAction: MsgBox.Action.OK,
            title: sTitle,

            onClose: function (oAction) {
              if (oAction === MsgBox.Action.OK) {
                resolve(oAction);
              }
            },
          });
        });
        return promise;
      },

      _convertTimeIntoSeconds: function (sTime) {
        var a = sTime.split(":");
        var seconds = +a[0] * 60 * 60 + +a[1] * 60 + +a[2];
        return seconds;
      },

      _addSecondsToDate: function (oDate, sTime) {
        var sSeconds = this._convertTimeIntoSeconds(sTime);
        var oNewDate = new Date(oDate);
        oNewDate.setSeconds(oDate.getSeconds() + sSeconds);
        return oNewDate;
      },

      //End R-UX document management on RFI pop up
    });
  }
);
