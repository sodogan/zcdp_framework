sap.ui.define([
  "aklc/cm/library/common/controller/BaseController",
  "sap/ui/core/Fragment",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/m/MessageToast",
  "aklc/cm/library/common/controller/Validation"
], function (BaseController, Fragment, Filter, FilterOperator, MessageToast, Validation) {
  "use strict";

  return BaseController.extend("aklc.cm.components.partners.controller.Detail", {
    _sPartiesCollection: "AssignedPartners", //path to assigned partner entity
    _formFields: ["partnerFunctionText", "validFrom", "validTo"], // form field types
    _sPFSearchHelp: "aklc.cm.components.partners.fragments.PartnerFunctionSearch", // path to PF Search help fragment
    _sPSearchHelp: "aklc.cm.components.partners.fragments.PartnerSearch", // path to PSearch help fragment
    _sPAddSearchHelp: "aklc.cm.components.partners.fragments.PartnerAddressSearch",
    _sCreate: "CREATE", // create
    _sUpdate: "UPDATE", // update
    _sSaveId: "save", // save
    _sUpdateId: "update",
    _oMainController: "",
    /*eslint-disable */
    /**
     * on init
     * @param  {object} oEvent Event object
     */
    onInit: function (oEvent) {
      BaseController.prototype.onInit.apply(this);
      this._oForm = this._oView.byId("PARTIES_FORM");
      this.oComponent = this.getOwnerComponent();

      this._oBundle = this.getComponent().getModel("i18n").getResourceBundle();

      this.oValidation = new Validation(this);

      this._oMessageManager = sap.ui.getCore().getMessageManager();
      this._oMessageManager.registerObject(this.getView(), true);
      var that = this;

      this.getEventBus().subscribe("partners", "refreshPartiesForm",
        function (sChannelId, sEventId, oData) {
          that._oContext = oData.context;
          that._oForm.setBindingContext(oData.context);

          //Make form fields read-only
          if (oData.action === that._sUpdate) {
            if (that._formFields.length <= 3) {
              that._formFields.push("partnerSearch");
              that._formFields.push("addressLine1");
            }

            that.toggleEditableFields(false, oData.context);
            that.oComponent._setViewModelProperty("SaveBtn_Visible", false);
            that.oComponent._setViewModelProperty("UpdateBtn_Visible", true);
          } else if (oData.action === that._sCreate) {
            /*if (that._formFields.length > 3) {
                that._formFields.pop();
            }*/

            that.toggleEditableFields(true, oData.context);
            that.oComponent._setViewModelProperty("SaveBtn_Visible", true);
            that.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
          }
        });

      this.oPSTemplate = new sap.m.ColumnListItem({ // Template used for Partner Search Dialog
        type: "Active",

        cells: [

          new sap.m.ObjectIdentifier({
            text: "{FirstName} {LastName}"
          }),
          new sap.m.Text({
            text: "{PartnerNumber}"
          }),
          new sap.m.Text({
            text: "{Address1}, {Address2}, {City}, {State}, {Country}, {Postcode}"
          }),
          new sap.m.Text({
            text: {
              path: 'Telephone',
              formatter: this.formatTeleandEmail
            }
          }),
          new sap.m.Text({
            text: {
              path: 'Email',
              formatter: this.formatTeleandEmail
            }
          }),
          new sap.m.Text({
            text: {
              parts: [{
                'path': 'OnlineCustomer'
              }, {
                'path': 'CreditApproved'
              }, {
                'path': 'STP'
              }],
              formatter: this.formatAttributes
            }

          }),
          new sap.ui.core.Icon({
            src: "sap-icon://accept",
            visible: "{= ${ADR_KIND} === 'XXDEFAULT' }"
          })
        ]
      });

      this.oPFTemplate = new sap.m.ColumnListItem({ // Template used for Partner Search Dialog
        cells: [
          new sap.m.ObjectIdentifier({
            text: "{Description}"
          })
        ]
      });
    },

    onAfterRendering: function () {
      this.byId(this._formFields[1]).setValue("");
    },
    onAfterClose: function (oEvent) {
      oEvent.getSource().destroy(true);
      this._psHelpDialog.destroy(true);
      this._psHelpDialog = undefined;
    },

    /**
     *on exit event
     */
    onExit: function () {
      if (this._oDialog) {
        this._oDialog.destroy();
      }
      /*if (this._psHelpDialog) {
                this._psHelpDialog.destroy(true);
            }*/

    },

    /**
     *on cancel key press event
     */
    cancelKeyPress: function (oEvent) {
      return oEvent.getSource().setValue(oEvent.getSource()._lastValue);
    },

    /**
     * handle PF Value Help Search event
     * @param oEvent
     * opens fragment in a dialog box
     */
    handlePFSearchHelp: function (oEvent) {

      this.inputId = oEvent.getSource().getId();

      if (!this._pfHelpDialog) {
        this._pfHelpDialog = sap.ui.xmlfragment(
          this._sPFSearchHelp, this
        );

        this._pfHelpDialog.setModel(this.getView().getModel("i18n"), "i18n");
        this._pfHelpDialog.setModel(this._oModel); //Required so table dialog shows data from service
        this.getView().addDependent(this._pfHelpDialog);
      }

      this.aFilterBy = [];
      this.aFilterBy.push(new sap.ui.model.Filter("StepKey", sap.ui.model.FilterOperator.EQ, this._sStepKey));

      this._pfHelpDialog.bindAggregation("items", {
        path: "/PartnerFunctions",
        sorter: null,
        parameters: {},
        template: this.oPFTemplate,
        filters: this.aFilterBy
      });

      this._pfHelpDialog.open();
    },

    /**
     * handlePS Value Help Search event
     * @param oEvent
     * opens fragment in a dialog box
     */
    handlePSearchHelp: function (oEvent) {

      this.inputId = oEvent.getSource().getId();

      if (!this._psHelpDialog) {
        this._psHelpDialog = sap.ui.xmlfragment("psFragId", this._sPSearchHelp, this);

        this.partnerSearch = this.getView().byId('partnerSearchDialog');

        this._psHelpDialog.setModel(this._oModel); //Required so table dialog shows data from service

        // this._pfHelpDialog.setModel(this.getView().getModel("i18n"), "i18n");
        this.getView().addDependent(this._psHelpDialog);
      }

      this.aFilterBy = [];
      //logic for Partner name editable and pass existing input partner function to backend to filter values
      var pfInputkey = this.byId("partnerFunctionText").getSelectedKey();
      if (pfInputkey !== "" && pfInputkey != undefined) {
        //this.aFilterBy.push(new sap.ui.model.Filter("PartnerFunction", sap.ui.model.FilterOperator.EQ, pfInputkey));
        this.partnerFunction = pfInputkey;
      }
      this.aFilterBy.push(new sap.ui.model.Filter("PartnerFunction", sap.ui.model.FilterOperator.EQ, this.partnerFunction));

      this._oModel.setSizeLimit(200);
      var oTableId = this._psHelpDialog.getContent()[0].getId();
      sap.ui.getCore().byId(oTableId).bindAggregation("items", {
        path: "/PartnerSearch",
        sorter: null,
        parameters: {},
        template: this.oPSTemplate,
        filters: this.aFilterBy
      });

      this._psHelpDialog.open();
    },

    /**
     * handle PF Value Help Search event
     * @param oEvent
     */
    _handlePFValueHelpSearch: function (oEvent) {
      var sValue = oEvent.getParameter("value");
      var aFilters = [];

      aFilters.push(new Filter(
        "Description",
        FilterOperator.Contains, sValue
      ));

      oEvent.getSource().getBinding("items").filter(aFilters);
    },

    /**
     * handlePS Value Help Search event
     * @param oEvent
     */
    _handlePSValueHelpSearch: function (oEvent) {
      var that = this;

      var oNameRadio = sap.ui.core.Fragment.byId("psFragId", "nameSelect");
      var bNameSelected = oNameRadio.getSelected();

      var oPartnerNoRadio = sap.ui.core.Fragment.byId("psFragId", "partnerNoSelect");
      var bPartnerNoSelected = oPartnerNoRadio.getSelected();

      var oAddressRadio = sap.ui.core.Fragment.byId("psFragId", "addressSelect");
      var bAddressSelected = oAddressRadio.getSelected();

      var oTelephoneRadio = sap.ui.core.Fragment.byId("psFragId", "telephoneSelect");
      var bTelephoneSelected = oTelephoneRadio.getSelected();

      var oEmailRadio = sap.ui.core.Fragment.byId("psFragId", "emailSelect");
      var bEmailSelected = oEmailRadio.getSelected();

      // Code for live change search in Partner search -commented
      /* var sValue;
       if(oEvent.getId() ==="liveChange"){
              sValue = oEvent.getParameters("newValue").newValue;
          }else{
          sValue = oEvent.getParameters("query").query;
          }*/

      var sValue = oEvent.getParameters("query").query;
      var aFilters = [];
      aFilters.push(new Filter("SearchTerm", FilterOperator.Contains, sValue));

      if (bNameSelected) {
        var partnerNameFilter = new Filter("SearchBy", FilterOperator.Contains, "PARTNER_NAME");
        aFilters.push(partnerNameFilter);

      } else if (bPartnerNoSelected) {

        var partnerNoFilter = new Filter("SearchBy", FilterOperator.Contains, "PARTNER_NUM");
        aFilters.push(partnerNoFilter);

      } else if (bAddressSelected) {
        var partnerNameFilter = new Filter("SearchBy", FilterOperator.Contains, "ADDRESS");
        aFilters.push(partnerNameFilter);

      } else if (bTelephoneSelected) {
        var telephoneFilter = new Filter("SearchBy", FilterOperator.Contains, "TELEPHONE");
        aFilters.push(telephoneFilter);

      } else if (bEmailSelected) {
        var emailFilter = new Filter("SearchBy", FilterOperator.Contains, "EMAIL");
        aFilters.push(emailFilter);

      } else {

        var sSerachByAll = "NONE";
        var allSearch = new Filter("SearchBy", FilterOperator.Contains, sSerachByAll);
        aFilters.push(allSearch);
      }

      var oMultiFilter = new Filter({
        filters: aFilters,
        and: true
      });
      var sTableId = oEvent.getSource().getParent().getParent().getId();
      sap.ui.getCore().byId(sTableId).getBinding("items").filter(oMultiFilter);
      // oEvent.getSource().getBinding("items").filter(oMultiFilter);

      var oTable = sap.ui.core.Fragment.byId("psFragId", "partnersTable");
      var oBindings = oTable.getBinding("items");
      oBindings.attachChange(function (oEvent) {
        var iVisibleRowsCount = oEvent.getSource().iLastEndIndex;
        var iTotalSearchResultsCount = oEvent.getSource().getLength();
        var sPartnerSearchMessage = that.getI18NText("PARTNER_SEARCH_RESULTS_MSG", [iVisibleRowsCount, iTotalSearchResultsCount]);
        if (iTotalSearchResultsCount > iVisibleRowsCount) {
          MessageToast.show(sPartnerSearchMessage, {
            duration: 5000,
            width: "45em",
            my: "center center",
            at: "center center",
          });

        }
      });

    },

    /**
     * handle Value Help Close event
     * @param oEvent
     */
    _handleValueHelpClose: function (oEvent) {

      var oSelectedItem = oEvent.getParameter("selectedItem");

      if (oSelectedItem) {
        var oContext = oSelectedItem.getBindingContext().getObject();

        var input = this.getView().byId(this.inputId);

        if (oSelectedItem.getBindingContextPath().indexOf("PartnerFunction") > -1) {
          input.setValue(oContext.Description);

          this.partnerFunction = oContext.PartnerFunction;

          if (this.partnerFunction !== null || this.partnerFunction !== "") {

            this.byId("partnerSearch").setEditable(true);
          }

          this.onValidateForm();
          this._formFields.push("partnerSearch");
        } else {

          this._setFormModelProperty("FirstName", oContext.FirstName);
          this._setFormModelProperty("LastName", oContext.LastName);
          this._setAddressDetails(oContext);
          this._formFields.push("addressLine1");
          this.byId("validFrom").setEditable(true);

          this.onValidateForm();
        }
      }

    },

    /**
     * handle Value Help Close event for partner Search
     * @param oEvent
     */
    _handleValueHelpPSClose: function (oEvent) {

      var oSelectedItem = oEvent.getParameters("listItem").listItem;

      if (oSelectedItem) {
        var oContext = oSelectedItem.getBindingContext().getObject();
        var input = this.byId(this.inputId);

        //  productInput.setValue(oSelectedItem.listItem.getBindingContext().getProperty("Name"));
        // productInput.setValue(oContext.Name);

        if (oSelectedItem.getBindingContextPath().indexOf("PartnerFunction") > -1) {
          input.setValue(oContext.Description);

          this.partnerFunction = oContext.PartnerFunction;

          if (this.partnerFunction !== null || this.partnerFunction !== "") {

            this.byId("partnerSearch").setEditable(true);
          }

          this.onValidateForm();
          this._formFields.push("partnerSearch");
        } else {

          this._setFormModelProperty("FirstName", oContext.FirstName);
          this._setFormModelProperty("LastName", oContext.LastName);
          this.byId("addressLine1").setEditable(true);
          this._setAddressDetails(oContext);
          this._formFields.push("addressLine1");

          this.byId("validFrom").setEditable(true);

          this.onValidateForm();
        }

      }

      //Code for resetting column search selected paramaterts - search text,radio button
      var oEnableColSearchCheck = oEvent.getSource().getParent().getCustomHeader().getContentRight()[0];;

      if (oEnableColSearchCheck.getSelected()) {
        oEnableColSearchCheck.setSelected(false);
        this.onColumnSearchSelect(oEvent);
        // this.byId(sap.ui.getCore().Fragment().createId("psFragId", "idPartnerSearchBar")).setValue ="";

      }
      var searchField = sap.ui.core.Fragment.byId("psFragId", "idPartnerSearchBar");
      searchField.setProperty("value", "");

      this._psHelpDialog.close();

    },

    /**
     * handle PAddress Value Help Search event
     * @param oEvent
     * opens fragment in a dialog box
     */
    handlePAddSearchHelp: function (oEvent) {

      this.partnernumber = this.byId("partnerNumber").getValue();
      this.partnerFunction = this.byId("partnerFunctionText").getValue();
      var that = this;
      var oPATemplate = new sap.m.ColumnListItem({
        type: "Active",
        cells: [
          new sap.ui.core.Icon({
            src: "sap-icon://accept",
            visible: "{= ${AddressKind} === 'XXDEFAULT' }"
          }),
          new sap.m.ObjectIdentifier({
            text: "{FullName}"
          }),
          new sap.m.Text({
            text: that.partnerFunction
          }),
          new sap.m.Text({
            text: "{Address1}, {Address2}, {City}, {State}, {Country}, {Postcode}"
          }),
          new sap.m.Text({
            text: {
              path: 'Telephone',
              formatter: this.formatTeleandEmail
            }
          }),
          new sap.m.Text({
            text: {
              path: 'Email',
              formatter: this.formatTeleandEmail
            }
          }),
        ]
      });

      if (!this._pAddHelpDialog) {
        this._pAddHelpDialog = sap.ui.xmlfragment("psAddressFrag",
          this._sPAddSearchHelp, this
        );

        this._pAddHelpDialog.setModel(this.getView().getModel("i18n"), "i18n");
        this._pAddHelpDialog.setModel(this._oModel); //Required so table dialog shows data from service
        this.getView().addDependent(this._pAddHelpDialog);
      }

      this.aFilterBy = [];
      this.aFilterBy.push(new sap.ui.model.Filter("PartnerNumber", sap.ui.model.FilterOperator.EQ, this.partnernumber));

      this.tableAddressProposal = sap.ui.core.Fragment.byId("psAddressFrag", "addressProposalDialog");
      this.tableAddressProposal.bindAggregation("items", {
        path: "/AddressSearchSet",
        sorter: null,
        parameters: {},
        template: oPATemplate,
        filters: this.aFilterBy,
      });
      this._pAddHelpDialog.open();
    },

    /**
     * Handle value help close event for Address Proposal
     * @param oEvent
     */
    _handleValueHelpPAddressClose: function (oEvent) {
      var oSelectedItem = oEvent.getParameters("listItem").listItem;
      if (oSelectedItem) {
        var oContext = oSelectedItem.getBindingContext().getObject();
        this.addressnumber = oContext.AddressNumber;
        this._setOnlyAddressDetails(oContext);
      }
      this._pAddHelpDialog.close();

    },

    /**
     * Set Address details form address proposal
     * @param oData
     */
    _setOnlyAddressDetails: function (oData) {
      this._setFormModelProperty("Telephone", oData.Telephone);
      this._setFormModelProperty("Email", oData.Email);
      this._setFormModelProperty("Address1", oData.Address1);
      this._setFormModelProperty("Address2", oData.Address2);
      this._setFormModelProperty("City", oData.City);
      this._setFormModelProperty("State", oData.State);
      this._setFormModelProperty("Country", oData.Country);
      this._setFormModelProperty("Postcode", oData.Postcode);
      this._setFormModelProperty("AddressNumber", oData.AddressNumber);
    },

    onColumnSearchSelect: function (oEvent) {

      var oNameRadio = sap.ui.core.Fragment.byId("psFragId", "nameSelect");
      var oPartnerNoRadio = sap.ui.core.Fragment.byId("psFragId", "partnerNoSelect");
      var oAddressRadio = sap.ui.core.Fragment.byId("psFragId", "addressSelect");
      var oTelephoneRadio = sap.ui.core.Fragment.byId("psFragId", "telephoneSelect");
      var oEmailRadio = sap.ui.core.Fragment.byId("psFragId", "emailSelect");
      var oNameCol = sap.ui.core.Fragment.byId("psFragId", "idNameCol");
      var oPartnerNoCol = sap.ui.core.Fragment.byId("psFragId", "idPartnerNoCol");
      var oAddressCol = sap.ui.core.Fragment.byId("psFragId", "idAddressCol");
      var oTeleCol = sap.ui.core.Fragment.byId("psFragId", "idTeleCol");
      var oEmailCol = sap.ui.core.Fragment.byId("psFragId", "idEmailCol");

      if (oEvent.getParameters().selected) {

        oNameRadio.setVisible(true);
        oNameRadio.setSelected(true);
        oPartnerNoRadio.setVisible(true);
        oAddressRadio.setVisible(true);
        oTelephoneRadio.setVisible(true);
        oEmailRadio.setVisible(true);
        oNameCol.setVisible(false);
        oPartnerNoCol.setVisible(false);
        oAddressCol.setVisible(false);
        oTeleCol.setVisible(false);
        oEmailCol.setVisible(false);

      } else {

        oNameRadio.setVisible(false);
        oNameRadio.setSelected(false);
        oPartnerNoRadio.setVisible(false);
        oPartnerNoRadio.setSelected(false);
        oAddressRadio.setVisible(false);
        oAddressRadio.setSelected(false);
        oTelephoneRadio.setVisible(false);
        oTelephoneRadio.setSelected(false);
        oEmailRadio.setVisible(false);
        oNameCol.setVisible(true);
        oPartnerNoCol.setVisible(true);
        oAddressCol.setVisible(true);
        oTeleCol.setVisible(true);
        oEmailCol.setVisible(true);

      }

    },

    _setFormModelProperty: function (property, value) {
      this._oModel.setProperty(property, value, this._oForm.getBindingContext());
    },

    /**
     * set address details event
     * @param {object} oData
     */
    _setAddressDetails: function (oData) {
      this._setFormModelProperty("Telephone", oData.Telephone);
      this._setFormModelProperty("Email", oData.Email);
      this._setFormModelProperty("Address1", oData.Address1);
      this._setFormModelProperty("Address2", oData.Address2);
      this._setFormModelProperty("City", oData.City);
      this._setFormModelProperty("State", oData.State);
      this._setFormModelProperty("Country", oData.Country);
      this._setFormModelProperty("Postcode", oData.Postcode);
      this._setFormModelProperty("PartnerNumber", oData.PartnerNumber);
      this._setFormModelProperty("PartnerFunction", oData.PartnerFunction);
      this._setFormModelProperty("AddressNumber", oData.AddressNumber);
    },

    /**
     * on Context Changed event
     * @param {object} oData
     */
    onContextChanged: function (sChannel, sEvent, oData) {

      this._oMainController = oData.controller;
      this._sStepKey = this._oModel.getProperty("StepKey", oData.context);

      var aFilterBy = [];
      aFilterBy.push(new sap.ui.model.Filter("StepKey", sap.ui.model.FilterOperator.EQ, this._sStepKey));
    },

    /**
     *toggle editable fields
     */
    toggleEditableFields: function (bEditable, oContext) {
      if (oContext) {
        this._formFields.forEach(
          function (obj, i) {
            if (bEditable && obj === this._formFields[1]) {
              this.byId(obj).setEditable(bEditable);
            } else if (!bEditable && (obj === this._formFields[1] || obj === this._formFields[2])) { //Check ValidTo Date
              if (oContext.getObject().ActiveFilter === "X") {
                this.byId(obj).setEditable(!bEditable);
              } else {
                this.byId(obj).setEditable(bEditable);
              }
            } else if (bEditable && (obj === this._formFields[2])) { //Check ValidTo Date
              this.byId(obj).setEditable(!bEditable);
            } else if (obj === this._formFields[3] || obj === this._formFields[4]) { //Check Partner Name and Address Line1
              if (bEditable) {
                this.byId(obj).setEditable(!bEditable);
              } else {
                this.byId(obj).setEditable(!bEditable);
              }
            } else {
              this.byId(obj).setEditable(bEditable);
            }
          }.bind(this)
        );
      }
    },

    /**
     *reset the date field
     */
    resetDateField: function (date, id) {
      this.getView().byId(id).setDateValue(date);
    },

    /**
     * set field enabled/disabled using Id
     * @param  {string} sId id of the field
     * @return {object}     control
     */
    setEnabledField: function (id, enable) {
      this.getView().byId(id).setEnabled(enable);
    },

    onValidateForm: function () {
      this.oValidation.validateForm();
    },

    /**
     * changes are stored in a deferred batch call, here we submit them
     * @return {[type]} [description]
     */
    onSave: function (oEvent) {
      var that = this;
      var oController = this;

      if ((!this._oMainResolve) || (this._oMainResolve.ValidationRequired === "X")) {
        this.oValidation.validateForm();
      }

      var oContext = oEvent.getSource().getBindingContext();
      this.oComponent = this.getOwnerComponent();

      if (!this.oValidation._oError) {
        this._oForm.setBindingContext(null);

        if (this._oModel.hasPendingChanges()) {
          // Set Busy Indicator
          this.getView().getParent().setBusyIndicatorDelay(0);
          this.getView().getParent().setBusy(true);

          // Refresh the Frame work Nav bar Icon Refresh
          var sPath = "/" + this._oModel.createKey(this._oMainController._sStepsCollection, {
            ApplicationKey: this._oMainController._sProcessKey,
            StepKey: this._oMainController._sStepKey
          });

          // submit the changes (creates entity at the backend)
          this._oModel.submitChanges({
            success: function (oEvent) {

              //Back end Error messages handling for Footer buttons
              var bErrorFlag = false;

              $.each(oEvent.__batchResponses, function (i, oResponse) {
                if (oResponse.response) {
                  var sBody = oResponse.response.body;
                  var oError = JSON.parse(sBody);

                  $.each(oError.error.innererror.errordetails, function (j, oError) {
                    if (oError.severity === "error") {
                      bErrorFlag = true;
                      return false;
                    }
                  });

                  if (bErrorFlag === true) {
                    return false;
                  }
                }
              });

              if (bErrorFlag === true) {

                oController.deleteDuplicateMessages();
                var aRemoveEntites = [];
                $.each(oController._oModel.mChangedEntities, function (sPath, oEntity) {
                  if (((sPath.substring(0, 16)) === "ApplicationHold(") || ((sPath.substring(0, 17)) === "AssignedPartners(")) {
                    // Fill for Application Hold entities
                    aRemoveEntites.push(sPath);
                  }
                });
                // Remove the busy Indicator
                oController.getView().getParent().setBusy(false);
                MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
                if (aRemoveEntites.length > 0) {
                  // Delete only Application Hold Entites changes
                  oController._oModel.resetChanges(aRemoveEntites);
                }

                /* // Remove the busy Indicator
                 oController.getView().getParent().setBusy(false);*/
                /* MessageToast.show(oController.getI18NText("UpdateFailedMessage"));*/
                jQuery.sap.log.error("Error adding new partner");
                if (oController._oMainResolve) {
                  oController._oMainResolve.WhenValid.resolve("Error");
                  oController._oMainResolve = "";
                }
              } else {
                // Set the Icon Status as "Success"
                oController._oModel.getContext(sPath).getObject().Status = "S";
                oController._oModel.setProperty("Status", "S", oController._oModel.getContext(sPath));
                oController._oMainController.refreshNavBarIcons();
                oController._oModel.submitChanges();

                oController.toggleEditableFields(false, oContext);
                oController.oComponent._setViewModelProperty("SaveBtn_Visible", false);
                oController.oComponent._setViewModelProperty("UpdateBtn_Visible", false);

                // Remove the busy Indicator
                oController.getView().getParent().setBusy(false);

                that._formFields.pop();
                jQuery.sap.log.info("Added new partner");
                MessageToast.show(oController.getI18NText("PARTNER_CREATE_SUCCESS"));

                if (oController._oMainResolve) {
                  oController._oMainResolve.WhenValid.resolve("Success");
                  oController._oMainResolve = "";
                }

                that.getEventBus().publish("partners", "setUpdateRow", {
                  updateflag: false,
                  createflag: true,
                  addrnum: oController.addressnumber,
                  partnum: oController.partnernumber,
                  partfunc: oController.partnerFunction,
                });
              }
            },
            error: function (oEvent) {
              // Remove the busy Indicator
              oController.getView().getParent().setBusy(false);
              MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
              jQuery.sap.log.error("Error adding new partner");

              if (oController._oMainResolve) {
                oController._oMainResolve.WhenValid.resolve("Error");
                oController._oMainResolve = "";
              }
            }
          });

          this.oComponent._setViewModelProperty("CreateMode", true); //Make Add button enabled

        } else {
          MessageToast.show(this.getI18NText("NoChangeSaveMessage"));
          // this.getView().getParent().setBusy(false);
          if (this._oMainResolve) {
            this._oMainResolve.WhenValid.resolve("Info");
            this._oMainResolve = "";
          }
        }
      } else {
        if (this._oMainResolve) {
          this._oMainResolve.WhenValid.resolve("Error");
          this._oMainResolve = "";
        }
      }
    },

    /**
     * changes are stored in a deferred batch call, here we submit them
     * @return {[type]} [description]
     */
    onUpdate: function (oEvent) {

      var that = this;
      var oController = this;
      var sFormPath = oController._oForm.getBindingContext().getPath();
      var oCurrentFormData = oController._oForm.getBindingContext().getObject();
      var sTeledata = oCurrentFormData.Telephone;
      var sEmaildata = oCurrentFormData.Email;

      var aSplitTeleData = sTeledata.split(";");
      var aSplitEmailData = sEmaildata.split(";")

      var oFinalTeleData;
      var oFinalEmailData;

      if (aSplitTeleData.length > 2 || aSplitEmailData.length > 2) {
        oFinalTeleData = sTeledata.split(";").slice(0, 2).join(";");
        oFinalEmailData = sEmaildata.split(";").slice(0, 2).join(";");
        this._oModel.setProperty(sFormPath + "/Telephone", oFinalTeleData);
        this._oModel.setProperty(sFormPath + "/Email", oFinalEmailData);
      }

      this.oValidation.validateForm();

      if (!this.oValidation._oError) {

        // this._oForm.setBindingContext(null);

        if (this._oModel.hasPendingChanges()) {

          // Set Busy Indicator
          this.getView().getParent().setBusyIndicatorDelay(0);
          this.getView().getParent().setBusy(true);

          // Refresh the Frame work Nav bar Icon Refresh
          var sPath = "/" + this._oModel.createKey(this._oMainController._sStepsCollection, {
            ApplicationKey: this._oMainController._sProcessKey,
            StepKey: this._oMainController._sStepKey
          });

          // submit the changes (updates entity at the backend)
          this._oModel.submitChanges({
            success: function (oEvent) {

              var bErrorFlag = false;
              var sUpdateFailedMessage;

              $.each(oEvent.__batchResponses, function (i, oResponse) {
                if (oResponse.response) {
                  var sBody = oResponse.response.body;
                  var oError = JSON.parse(sBody);
                  sUpdateFailedMessage = oError.error.innererror.errordetails[0].message;

                  oController._oMessageManager.addMessages(
                    new sap.ui.core.message.Message({
                      message: sUpdateFailedMessage,
                      type: sap.ui.core.MessageType.Error,
                      processor: oController._oModel
                    })
                  );

                  $.each(oError.error.innererror.errordetails, function (j, oError) {

                    if (oError.severity === "error") {
                      bErrorFlag = true;
                      return false;
                    }
                  });

                  if (bErrorFlag === true) {
                    return false;
                  }
                }
              });

              if (bErrorFlag === true) {
                oController.getView().getParent().setBusy(false);
                MessageToast.show(oController.getI18NText("UpdateFailedMessage"));

              } else {

                // Set the Icon Status as "Success"
                oController._oModel.getContext(sPath).getObject().Status = "S";
                oController._oModel.setProperty("Status", "S", oController._oModel.getContext(sPath));
                oController._oMainController.refreshNavBarIcons();
                oController._oModel.submitChanges();

                //Clear context for form
                oController.toggleEditableFields(false, null);

                oController.oComponent._setViewModelProperty("SaveBtn_Visible", false);
                oController.oComponent._setViewModelProperty("UpdateBtn_Visible", false);

                // Remove the busy Indicator
                oController.getView().getParent().setBusy(false);
                MessageToast.show(oController.getI18NText("PARTNER_UPDATE_SUCCESS"));

                jQuery.sap.log.info("Updated partner");

                that.getEventBus().publish("partners", "setUpdateRow", {
                  updateflag: true,
                  createflag: false,
                  addrnum: "",
                  partnum: "",
                  partfunc: "",
                });
              }
            },
            error: function (oEvent) {
              // Remove the busy Indicator
              oController.getView().getParent().setBusy(false);
              MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
              jQuery.sap.log.error("Error updating partner");
            }
          });

        } else {
          this.getView().getParent().setBusy(false);
          MessageToast.show(this.getI18NText("NoChangeSaveMessage"));

        }
      }
    },
    /**
     * on Check Valid Event
     * @param  {string} sChannel [description]
     * @param  {string} sEvent   [description]
     * @param  {object} oData    [description]
     */
    onCheckValid: function (sChannel, sEvent, oData) {
      var oCreateMode = this.oComponent._oViewModel.getProperty("/CreateMode");
      if (oCreateMode === false) {
        this._oModel.deleteCreatedEntry(this._oContext);
      }
      this.oComponent._oViewModel.setProperty("/CreateMode", true);
      this.oComponent._setViewModelProperty("SaveBtn_Visible", false);
      this.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
      oData.WhenValid.resolve();
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
      return this.getView().getModel("i18n").getResourceBundle().getText(sTextKey, aParameters);
    },

    /**
     * Delete duplicate messages
     */
    deleteDuplicateMessages: function () {

      var aFinalMessages = [];
      var bUpdate = false;

      var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().oData;
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
      sap.ui.getCore().getMessageManager().getMessageModel().oData = aFinalMessages;
      sap.ui.getCore().getMessageManager().getMessageModel().refresh();

    },
    /**
     * on Submit Changes Event is a base controller event, it is triggered
     * by component, the components sends a deferred promise if the call
     * is valid, no errors, the promise is resolved
     * @param  {string} sChannel [description]
     * @param  {string} sEvent   [description]
     * @param  {object} oData    [description]
     */
    onSubmitChanges: function (sChannel, sEvent, oData) {
      this._oMainResolve = oData;
      // Get the Add Button reference
      var oAddButton = this.getView().byId("save");
      // Fire the Press event
      oAddButton.firePress();
    },

    /** Text Formatter For field Address Line 2
     * @param {string} sValue1 [State]
     * @param {string} sValue2 [Postcode]
     * @param {string} sValue2 [Country]
     */
    FormatAddLine2: function (sValue1, sValue2, sValue3) {
      return [sValue1, sValue2, sValue3].filter(Boolean).join(" ");
    },
    formatAttributes: function (sOnlineCustomer, screditApproved, sSTP) {
      var attributeArr = [];

      if (sOnlineCustomer === "" || sOnlineCustomer === null || sOnlineCustomer === undefined) {
        sOnlineCustomer = '';
      } else {
        attributeArr.push(sOnlineCustomer);
      }

      if (screditApproved === "" || screditApproved === null || screditApproved === undefined) {
        screditApproved = '';
      } else {
        attributeArr.push(screditApproved);
      }

      if (sSTP === "" || sSTP === null || sSTP === undefined) {
        sSTP = '';
      } else {
        attributeArr.push(sSTP);
      }

      return attributeArr.join('\r\n');

    },

    formatMultipleItems: function (sData) {
      if (sData) {
        var sOutput = "";
        var dataArray = sData.split(';');
        var count = 0;
        for (var i = 0; i < dataArray.length; i++) {
          if (dataArray[i] && dataArray[i].length > 0) {
            count = count + 1;
            sOutput = sOutput + dataArray[i] + "\n";

            if (count == 2)
              return sOutput;
          }
        }
        return sOutput;
      }
      return sData;
    },

    formatTeleandEmail: function (sData) {
      if (sData) {
        var semicount = 0;
        for (var i = 0; i < sData.length; i++) {
          if (sData.charAt(i) == ';')
            semicount++;
          if (semicount == 4)
            return sData.substring(0, i);
        }
      }
      return sData;
    }
  });
});