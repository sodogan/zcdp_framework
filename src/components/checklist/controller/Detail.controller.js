sap.ui.define([
	"aklc/cm/library/common/controller/BaseController",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"aklc/cm/library/common/controller/Validation",
	"sap/ui/model/odata/v2/ODataModel",
	"sap/m/Dialog",
	"sap/m/Button"
], function (BaseController, Fragment, Filter, FilterOperator, MessageToast, Validation, ODataModel, Dialog, Button) {
	// "use strict";

	return BaseController.extend("aklc.cm.components.checklist.controller.Detail", {
		_sChecklistCollection: "Checklist",
		_formFields: ["inputEmpResponsible", "inputTeamResponsible"],
		_sPSearchHelp: "aklc.cm.components.partners.fragments.PartnerSearch", // path to PSearch help fragment
		_sCreate: "CREATE",
		_sUpdate: "UPDATE",
		_sRefresh: "REFRESH",
		_sSaveId: "save",
		_sUpdateId: "update",
		_oMainController: "",
		_sChkListStepsFrag: "aklc.cm.components.checklist.fragments.ChecklistSteps",
		_sAssignFragDialog: "aklc.cm.components.checklist.fragments.Assign",
		_sCheckAssign: "AssignSearchSet",
		_aSplChklStep: ["Technical Decision", "Revised Technical Decision"],

		/**
		 * on init
		 * @param  {object} oEvent Event object
		 */
		onInit: function () {
			BaseController.prototype.onInit.apply(this);
			this._oForm = this._oView.byId("CHECKLIST_FORM");

			this.oComponent = this.getOwnerComponent();

			this._oBundle = this.getComponent().getModel("i18n").getResourceBundle();

			this.oValidation = new Validation(this);

			this._oMessageManager = sap.ui.getCore().getMessageManager();
			this._oMessageManager.registerObject(this.getView(), true);

			/*eslint-disable */
			var that = this;

			this.getEventBus().subscribe("checklist", "refreshChecklistForm",
				function (sChannelId, sEventId, oData) {
					that._oContext = oData.context;

					if (oData.action === that._sUpdate) {

						var oSelectedRowObj = oData.context.getParameters("listItem").listItem.getBindingContext().getObject();
						var sPath = oData.context.getParameters("listItem").listItem.getBindingContext().getPath();
						that.gSpath = sPath;
						that._oForm.bindElement(sPath);
						this._sCurrentAppStepno = sap.ui.getCore().getModel("stepmodel").getProperty("/currentAppStepNo").replace(/^0+/, '');
						this._sCurrentChkStatus = sap.ui.getCore().getModel("stepmodel").getProperty("/currentStepStatus");

						if (this._sCurrentChkStatus === "CUST") {

							that._oView.byId("chklistStatDD").setEnabled(false);
						} else {
							that._oView.byId("chklistStatDD").setEnabled(true);
						}

						if (this._sCurrentAppStepno === oSelectedRowObj.StepNo ||
							//_aSplChklStep.includes(oSelectedRowObj.ChklstDescr - does not work in IE
							that._aSplChklStep.indexOf(oSelectedRowObj.ChklstDescr) >= 0) {

							/*that._oView.byId("inputEmpResponsible").setEditable(false);
							that._oView.byId("inputTeamResponsible").setEditable(false);*/

							/*that._oView.byId("chklistStatDD").setEnabled(false);
							that._oView.byId("chklistOptDD").setEnabled(false);*/

							if (that._formFields.length < 3) {
								that._formFields.push("chklistStatDD");
								that._formFields.push("chklistOptDD");
							}
							that.toggleEditableFields(false, oData.context);
							that.oComponent._setViewModelProperty("AssignBtn_Visible", false);
						} else {

							// that._oView.byId("chklistStatDD").setEnabled(true);
							that._oView.byId("chklistOptDD").setEnabled(true);
							that.oComponent._setViewModelProperty("AssignBtn_Visible", true);
						}

						that.oComponent._setViewModelProperty("SaveBtn_Visible", false);
						that.oComponent._setViewModelProperty("UpdateBtn_Visible", true);

					} else if (oData.action === that._sCreate) {

						/*that._oView.byId("inputEmpResponsible").setEditable(true);
						that._oView.byId("inputTeamResponsible").setEditable(true);*/
						that._oView.byId("chklistStatDD").setEnabled(true);
						that._oView.byId("chklistOptDD").setEnabled(true);

						var sStepId = oData.context.StepId;
						var sStepKey = oData.context.StepKey;
						var sStepNo = oData.context.StepNo;

						var sPath = "/Checklist(StepId='" + sStepId + "',StepKey='" + sStepKey + "',StepNo='" + sStepNo + "')";
						that._oForm.bindElement(sPath);
						that.oComponent._setViewModelProperty("SaveBtn_Visible", true);
						that.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
						that.oComponent._setViewModelProperty("AssignBtn_Visible", true);
					}
				});

			this.getEventBus().subscribe("checklist", "populatechkStatus",
				function (sChannelId, sEventId, oData) {
					var oChkStatus = that._oView.byId("chklistStatDD");
					if (oData.action === "UPDATE") {
						oChkStatus.destroyItems();
						var currentStepStatus = that._oForm.getBindingContext().getObject("StepStatusId");
						var jModel = oData.jsonMdl;
						oChkStatus.setModel(jModel);

						var oCHkStatTemplate = new sap.ui.core.Item({
							key: "{Status}",
							text: "{StatusDescr}"
						});
						oChkStatus.bindItems("/results", oCHkStatTemplate);
						oChkStatus.setSelectedKey(currentStepStatus);
					} else {
						var newItem = new sap.ui.core.Item({
							key: "New",
							text: "New"
						});
						oChkStatus.destroyItems();
						oChkStatus.addItem(newItem);
						oChkStatus.setSelectedKey("New");
					}
					oChkStatus.setValueState(null);
					oChkStatus.setValueStateText(null);
				});

			this.getEventBus().subscribe("checklist", "populatechkOption",
				function (sChannelId, sEventId, oData) {
					var oChkOption = that._oView.byId("chklistOptDD");
					if (oData.action === "UPDATE") {
						oChkOption.destroyItems();
						var currentStepOption = that._oForm.getBindingContext().getObject("AzoptionDesc");
						var currentStepEnabled = that._oForm.getBindingContext().getObject("AzoptionId");
						var jModel = oData.jsonMdl;
						/*   if(currentStepEnabled !=null && currentStepEnabled != "")
						   {*/
						oChkOption.setModel(jModel);
						var oCHkOptTemplate = new sap.ui.core.Item({
							key: "{OptionId}",
							text: "{OptionDesc}"
						});
						oChkOption.bindItems("/results", oCHkOptTemplate);
						oChkOption.setSelectedKey(currentStepEnabled);
					} else {
						oChkOption.destroyItems();
					}
					// }

				});

			this.getEventBus().subscribe("checklist", "updateInitialDetailFormData",
				function (sChannelId, sEventId, oData) {
					if (oData.action === that._sRefresh) {
						that._oContext = oData.context;
						var oSelectedRowItem = oData.context.getSource().getSelectedItem();
						if (oSelectedRowItem) {
							var path = oSelectedRowItem.getBindingContext().getPath();
							var sFIlteredStepNo = oSelectedRowItem.getBindingContext().getObject().StepNo;
							var sCurrentStepNo = sap.ui.getCore().getModel("stepmodel").getProperty("/currentAppStepNo").replace(/^0+/, '');
							if (sFIlteredStepNo === sCurrentStepNo) {
								that._oView.byId("inputEmpResponsible").setEditable(false);
								that._oView.byId("inputTeamResponsible").setEditable(false);
								that._oView.byId("chklistStatDD").setEnabled(false);
								that._oView.byId("chklistOptDD").setEnabled(false);
							} else {
								if (oSelectedRowItem.getBindingContext().getObject().StepStatusId !== "CUST") {
									that._oView.byId("chklistStatDD").setEnabled(true);
								}
								that._oView.byId("chklistOptDD").setEnabled(true);
							}
							that.gSpath = path;
							//that.getView().bindElement(path);
							//  that._oView.byId("CHECKLIST_FORM").bindElement(path);
							that._oForm.bindElement(path);
						}
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
						text: "{Telephone}"
					}),
					new sap.m.Text({
						text: "{Email}"
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

			this.oAssignTemplate = new sap.m.StandardListItem({
				type: "Active",
				title: {
					path: 'Partnername',
					formatter: this.formatPname,
				},

				description: "{Teamname}"
			});
			// this.getEventBus().subscribe("checklist", "toggleEditable", this.toggleEditableFields,this);

			if (this.getView().byId("chkDetailScrollContainer")) {
				this.getView().byId("chkDetailScrollContainer").addEventDelegate({
					"onAfterRendering": function () {
						window.addEventListener("resize", this.resizeContainer.bind(this));
					}
				}, this);
			}
		},

		resizeContainer: function () {
			var elementToResize = this.getView().byId("chkDetailScrollContainer");
			var coord = $("#" + elementToResize.getId()).offset();
			var width_to_set = window.innerHeight - coord.top - 60;
			elementToResize.setHeight(width_to_set + "px");
		},

		/**
		 * Event Handler to implement launch of assign pop up                        
		 */
		handleAssignButton: function (oEvent) {
			//var that=this;
			var sStepStatus = oEvent.getSource().getBindingContext().getObject().StepStatus;
			if (!this._oAssign) {
				this._oAssign = sap.ui.xmlfragment("chkAssignFragId", "aklc.cm.components.checklist.fragments.Assign", this);

			}
			// toggle compact style
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oAssign);

			this._oAssign.setModel(this._oModel);
			this._oAssign.setModel(this.getComponent().getModel("i18n"), "i18n");

			this.oAssignDialog = sap.ui.core.Fragment.byId("chkAssignFragId", "assignCheckSelect");
			// this.oAssignTemplate= sap.ui.core.Fragment.byId("chkAssignFragId", "assignCheckTemp");
			this.oAssignDialog.bindAggregation("items", {
				path: "/" + this._sCheckAssign,
				template: this.oAssignTemplate
			});

			this.oAssignDialog.setModel(this._oModel);
			this.oAssignDialog.setModel(this.getComponent().getModel("i18n"), "i18n");
			var sChkAssignStatus = this.getI18NText("CHK_ASSIGN_STATUS");

			if (sStepStatus === "Completed" || sStepStatus === "Irrelevant" || sStepStatus === "New") {

				var dialog = new Dialog({
					title: 'Warning',
					type: 'Message',
					state: 'Warning',
					content: new sap.m.Text({
						text: sChkAssignStatus
					}),
					beginButton: new Button({
						text: 'OK',
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function () {
						dialog.destroy();

					}
				});

				dialog.open();

			} else {
				this._oAssign.open();
			}

		},
		/**
		 * Method to format partner name field in assign search pop up
		 * @param  {string} dPartnerName           
		 */
		formatPname: function (dPartnerName) {
			if (dPartnerName === "" || dPartnerName === null || dPartnerName === undefined) {
				return ' ';
			} else {
				return dPartnerName;
			}
		},

		/**
		 * Event Handler to implement search in assign partner pop up            
		 * @param  {object} oEvent                                
		 */
		handleAssignSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var aFilters = [];
			aFilters.push(new Filter(
				"Searchfield",
				FilterOperator.Contains, sValue
			));
			var oMultiFilter = new Filter({
				filters: aFilters,
				and: false
			});
			this._oAssign.getBinding("items").filter(oMultiFilter);
		},

		onChangeStatus: function (oEvent) {
			var oStatusSelect = oEvent.getSource().getSelectedKey();
			this._oModel.setProperty(this.gSpath + "/StepStatusId", oStatusSelect);
			var sChkStatusHoldMsg = this.getI18NText("CHK_STS_ONHOLD_MSG");

			var oChkStausErrorMsg = new sap.ui.core.message.Message({
				message: sChkStatusHoldMsg,
				type: sap.ui.core.MessageType.Error,
				processor: this._oModel
			});

			if (oStatusSelect === "CUST") {
				this._oView.byId("chklistStatDD").setValueState(sap.ui.core.ValueState.Error);
				this._oView.byId("chklistStatDD").setValueStateText(sChkStatusHoldMsg);
				// this._oMessageManager.addMessages(oChkStausErrorMsg);
				this._oModel.resetChanges();
				this._oForm.setBindingContext(null);
			} else {

				this._oView.byId("chklistStatDD").setValueState(null);
				this._oView.byId("chklistStatDD").setValueStateText(null);
			}
		},

		onChangeOption: function (oEvent) {
			var oOptionSelect = oEvent.getSource().getSelectedKey();
			this._oModel.setProperty(this.gSpath + "/AzoptionId", oOptionSelect);
		},

		/**
		 * Event Handler to implement confirm of assign search pop up
		 * the selected partner/team will be assigned to selected checklist
		 * @param  {object} oEvent                                
		 */
		handleAssignConfirm: function (oEvent) {

			var oSelectedItem = oEvent.getParameters("selectedItem").selectedItem;

			if (oSelectedItem) {
				var oContext = oSelectedItem.getBindingContext().getObject();

				if (oSelectedItem.getBindingContextPath().indexOf("Partnernumber") > -1) {

					this._setFormModelProperty("TeamResponsible", oContext.Teamname);
					this._setFormModelProperty("TeamNum", oContext.Teamnumber);
					this._setFormModelProperty("EmployeeResponsible", oContext.Partnername);
					this._setFormModelProperty("EmployeeNum", oContext.Partnernumber);
				}

			}

		},
		/**
		 * handlePS Value Help Search event
		 * @param oEvent
		 * opens fragment in a dialog box
		 */
		handleEmpRespPSearchHelp: function (oEvent) {

			this.inputId = oEvent.getSource().getId();

			if (!this._psHelpDialog) {
				this._psHelpDialog = sap.ui.xmlfragment("psFragId", this._sPSearchHelp, this);

				// this.partnerSearch = this.getView().byId('partnerSearchDialog');

				this._psHelpDialog.setModel(this._oModel); //Required so table dialog shows data from service

				this._psHelpDialog.setModel(this.getView().getModel("i18n"), "i18n");
				this.getView().addDependent(this._psHelpDialog);
			}

			this.aFilterBy = [];
			this.aFilterBy.push(new sap.ui.model.Filter("PartnerFunction", sap.ui.model.FilterOperator.EQ, "Z0000077"));
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

		handleTeamRespPSearchHelp: function (oEvent) {

			this.inputId = oEvent.getSource().getId();

			if (!this._psHelpDialog) {
				this._psHelpDialog = sap.ui.xmlfragment("psFragId", this._sPSearchHelp, this);

				// this.partnerSearch = this.getView().byId('partnerSearchDialog');

				this._psHelpDialog.setModel(this._oModel); //Required so table dialog shows data from service

				this._psHelpDialog.setModel(this.getView().getModel("i18n"), "i18n");
				this.getView().addDependent(this._psHelpDialog);
			}

			this.aFilterBy = [];

			this.aFilterBy.push(new sap.ui.model.Filter("PartnerFunction", sap.ui.model.FilterOperator.EQ, "Z0000003"));
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
		 * handle Value Help Close event for partner Search
		 * @param oEvent
		 */
		_handleValueHelpPSClose: function (oEvent) {
			var oSelectedItem = oEvent.getParameters("listItem").listItem;

			if (oSelectedItem) {
				var oContext = oSelectedItem.getBindingContext().getObject();

				var sSelectedPartnerNo = oContext.PartnerNumber;
				var input = this.byId(this.inputId);

				if (oSelectedItem.getBindingContextPath().indexOf("PartnerNumber") > -1) {
					input.setValue(oContext.FirstName + oContext.LastName);
					input.setSelectedKey(oContext.PartnerNumber);

				} else {

					this._setFormModelProperty("FirstName", oContext.FirstName);
					this._setFormModelProperty("LastName", oContext.LastName);
					this._setAddressDetails(oContext);
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
		handleChecklistDescVHEdit: function (oEvent) {

			this.getEventBus().publish("checklist", "callChecklistDescDialog", this);

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

		onExit: function () {
			if (this._oDialog) {
				this._oDialog.destroy();
			}
			/*if (this._psHelpDialog) {
			    this._psHelpDialog.destroy(true);
			}*/
		},
		onAfterClose: function (oEvent) {
			oEvent.getSource().destroy(true);
			this._psHelpDialog.destroy(true);
			this._psHelpDialog = undefined;
		},
		cancelKeyPress: function (oEvent) {
			return oEvent.getSource().setValue(oEvent.getSource()._lastValue);
		},

		_handlePSValueHelpSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var aFilters = [];

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

		_handleValueHelpClose: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");

			if (oSelectedItem) {
				var oContext = oSelectedItem.getBindingContext().getObject();

				this._setFormModelProperty("PartnerFullName", oContext.PartnerFullName);
				this._setFormModelProperty("LegalDescription", oContext.LegalDescription);
				this._setAddressDetails(oContext);

				this.onValidateForm();

			}
		},

		_setFormModelProperty: function (property, value) {
			this._oModel.setProperty(property, value, this._oForm.getBindingContext());
		},

		_setAddressDetails: function (oData) {
			this._setFormModelProperty("LegalDescription", oData.LegalDescription);
			this._setFormModelProperty("PropertyAddress", oData.PropertyAddress);
			this._setFormModelProperty("MailingAddress", oData.MailingAddress);
			this._setFormModelProperty("PropertyId", oData.PropertyId);
			this._setFormModelProperty("PartnerNumber", oData.PartnerNumber);

		},

		onContextChanged: function (sChannel, sEvent, oData) {

			this._oMainController = oData.controller;
			this._sStepKey = this._oModel.getProperty("StepKey", oData.context);

			var aFilterBy = [];
			aFilterBy.push(new sap.ui.model.Filter("StepKey", sap.ui.model.FilterOperator.EQ, this._sStepKey));

		},

		toggleEditableFields: function (bEditable, oContext) {

			if (oContext) {
				this._formFields.forEach(
					function (obj) {
						if (obj === this._formFields[2] || obj === this._formFields[3]) {
							this.byId(obj).setEnabled(bEditable);
						} else if (obj === this._formFields[0] || obj === this._formFields[1]) {
							this.byId(obj).setEditable(bEditable);
						} else {
							this.byId(obj).setEditable(bEditable);

						}
					}.bind(this)
				);
			}
		},

		resetDateField: function (date, id) {
			this.getView().byId(id).setDateValue(date);
		},

		formatResponseType: function (sResponseType) {
			var sPath = this._oModel.createKey("/VH_Response", {
				StepKey: this._sStepKey,
				ResponseType: sResponseType
			});

			var oContext = this._oModel.getContext(sPath);
			return this._oModel.getProperty("ResponseText", oContext);
		},
		/*eslint-disable */
		/**
		 * set field enabled/disabled using Id
		 * @param  {string} sId id of the field
		 * @return {object}     control
		 */
		setEnabledField: function (id, enable) {
			this.getView().byId(id).setEnabled(enable);
		},

		/**
		 * set field visible or not using Id
		 * @param  {string} sId id of the field
		 * @return {object}     control
		 */
		setVisibleField: function (id, visible) {
			this.getView().byId(id).setVisible(visible);
		},

		/**
		 * get Field By Id
		 * @param  {string} sId id of the field
		 * @return {object}     control
		 */
		getFieldById: function (sId) {
			return sap.ui.getCore().byId(sId);
		},

		onValidateForm: function () {
			this.oValidation.validateForm();
		},

		parseToBeHeard: function (sValue) {
			return (sValue === "true" || sValue === true) ? true : false;
		},
		/**
		 * changes are stored in a deferred batch call, here we submit them
		 * @return {[type]} [description]
		 */
		/**
		 * changes are stored in a deferred batch call, here we submit them
		 * @return {[type]} [description]
		 */
		onSave: function (oEvent) {
			var that = this;
			var oController = this;

			/* if ((!this._oMainResolve) || (this._oMainResolve.ValidationRequired === "X")) {
			 this.oValidation.validateForm();
			 }
			 */
			var oContext = oEvent.getSource().getBindingContext();
			var oEntryData = oContext.getObject();
			this.oComponent = this.getOwnerComponent();

			var oProperties = {
				ActulEndDate: oEntryData.ActulEndDate,
				ActulStaDate: oEntryData.ActulStaDate,
				StepNo: oEntryData.StepNo,
				ChklstDescr: oEntryData.ChklstDescr,
				EmployeeNum: oEntryData.EmployeeNum,
				EmployeeResponsible: oEntryData.EmployeeResponsible,
				PartnerFctDescr: oEntryData.PartnerFctDescr,
				PartnerFunc: oEntryData.PartnerFunc,
				StepId: oEntryData.StepId,
				StepKey: oEntryData.StepKey,
				StepStatus: oEntryData.StepStatus,
				TeamNum: oEntryData.TeamNum,
				TeamResponsible: oEntryData.TeamResponsible
			};

			// create entry
			var oPayloadContext = this._oModel.createEntry(
				this._sChecklistCollection, {
					properties: oProperties
				}
			);

			this._oContext = oPayloadContext;

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
							var sUpdateFailedMessage;
							$.each(oEvent.__batchResponses, function (i, oResponse) {
								if (oResponse.response) {
									var sBody = oResponse.response.body;
									var oError = JSON.parse(sBody);
									sUpdateFailedMessage = oError.error.innererror.errordetails[0].message;
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
										sPath = '/' + sPath;
										aRemoveEntites.push(sPath);
									}
								});

								if (aRemoveEntites.length > 0) {
									// Delete only Application Hold Entites changes
									oController._oModel.resetChanges(aRemoveEntites);
								}

								// Remove the busy Indicator
								oController.getView().getParent().setBusy(false);
								if (oController._oMainResolve) {
									oController._oMainResolve.WhenValid.resolve("Error");
									oController._oMainResolve = "";
								}
								oController._oMessageManager.addMessages(
									new sap.ui.core.message.Message({
										message: sUpdateFailedMessage,
										type: sap.ui.core.MessageType.Error,
										processor: oController._oModel
									})
								);
								MessageToast.show(oController.getI18NText("CHK_CREATE_FAILED"));
								oController.oComponent._setViewModelProperty("SaveBtn_Visible", false);
							} else {
								// Set the Icon Status as "Success"
								oController._oModel.getContext(sPath).getObject().Status = "S";
								oController._oModel.setProperty("Status", "S", oController._oModel.getContext(sPath));
								oController._oMainController.refreshNavBarIcons();
								oController._oModel.submitChanges();

								oController.toggleEditableFields(false, oContext);
								oController.oComponent._setViewModelProperty("SaveBtn_Visible", false);
								oController.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
								oController.oComponent._setViewModelProperty("AssignBtn_Visible", false);

								// Remove the busy Indicator
								oController.getView().getParent().setBusy(false);

								that._formFields.pop();
								MessageToast.show(oController.getI18NText("CHK_CREATE_SUCCESS"));
								// jQuery.sap.log.info("Added new partner");

								if (oController._oMainResolve) {
									oController._oMainResolve.WhenValid.resolve("Success");
									oController._oMainResolve = "";
								}

								oController.getEventBus().publish("checklist", "updateJSON", {});
							}
						},
						error: function (oEvent) {
							// Remove the busy Indicator
							oController.getView().getParent().setBusy(false);
							// MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
							// jQuery.sap.log.error("Error adding new partner");

							MessageToast.show(oController.getI18NText("CHK_CREATE_FAILED"));
							// MessageToast.show("Creating new Checklist failed ");

							if (oController._oMainResolve) {
								oController._oMainResolve.WhenValid.resolve("Error");
								oController._oMainResolve = "";
							}
						}
					});

					this.oComponent._setViewModelProperty("CreateMode", true); //Make Add button enabled

				} else {
					// oController._oModel.submitChanges();
					//MessageToast.show(this.getI18NText("NoChangeSaveMessage"));
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
		onCancel: function (oEvent) {

			this.oComponent._oViewModel.setProperty("/CreateMode", true);
			this.getEventBus().publish("checklist", "ResetOnCancel", this);
			this.oComponent._setViewModelProperty("SaveBtn_Visible", false);
			this._oView.byId("inputEmpResponsible").setEditable(false);
			this._oView.byId("inputTeamResponsible").setEditable(false);
			/* this.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
			 this.oComponent._setViewModelProperty("AssignBtn_Visible", false);*/
			if (this._oModel.hasPendingChanges) {
				this._oModel.resetChanges();
				this._oForm.setBindingContext(null);
			}
			this.getEventBus().publish("checklist", "setCancelFlag", this);
		},

		/**
		 * changes are stored in a deferred batch call, here we submit them
		 * @return {[type]} [description]
		 */
		onUpdate: function (oEvent) {

			var that = this;
			var oController = this;

			//  this.oValidation.validateForm();

			if (!this.oValidation._oError) {

				var oContext = oEvent.getSource().getBindingContext();
				var oData = oEvent.getSource().getBindingContext().getObject();

				/*oData.ResponseText = this.formatResponseType(oData.ResponseType);
				oData.ToBeHeard = this.parseToBeHeard(oData.ToBeHeard);*/

				this._oForm.setBindingContext(null);
				var sCurrentChkStatus = this._oView.byId("chklistStatDD").getSelectedKey();

				//  if (this._oModel.hasPendingChanges() && sCurrentChkStatus !== "CUST") {
				if ((this._oModel.hasPendingChanges() && sCurrentChkStatus !== "CUST") || (this._oModel.hasPendingChanges() && sCurrentChkStatus ===
						"CUST" && (this._oView.byId("chklistStatDD").getEnabled() === false))) {

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
									$.each(oError.error.innererror.errordetails, function (j, oError) {

										if (oError.severity === "error") {

											oController._oMessageManager.addMessages(
												new sap.ui.core.message.Message({
													message: sUpdateFailedMessage,
													type: sap.ui.core.MessageType.Error,
													processor: oController._oModel
												})
											);
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
								/* oController._oMessageManager.addMessages(
                                new sap.ui.core.message.Message({
                                message: sUpdateFailedMessage,
                                type: sap.ui.core.MessageType.Error,
                                processor: oController._oModel
                                 })
                             );*/

								MessageToast.show(oController.getI18NText("CHK_UPDATE_FAILED"));

							} else {
								if (oController._oMessageManager.getMessageModel().getData().length > 0 && !sUpdateFailedMessage) {
									oController._oMessageManager.removeAllMessages();

								}

								oController.getEventBus().publish("checklist", "setCurrentStepSelected", this);

								// Set the Icon Status as "Success"
								oController._oModel.getContext(sPath).getObject().Status = "S";
								oController._oModel.setProperty("Status", "S", oController._oModel.getContext(sPath));
								oController._oMainController.refreshNavBarIcons();
								// oController._oModel.submitChanges();

								oController.toggleEditableFields(false, oContext);
								oController.setVisibleField(that._sSaveId, false);
								oController.setVisibleField(that._sUpdateId, false);
								oController.oComponent._setViewModelProperty("SaveBtn_Visible", false);
								oController.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
								oController.oComponent._setViewModelProperty("AssignBtn_Visible", false);
								// Remove the busy Indicator
								oController.getView().getParent().setBusy(false);

								// jQuery.sap.log.info("Updated partner");
								MessageToast.show(oController.getI18NText("CHK_UPDATE_SUCCESS"));
							}

						},
						error: function () {
							// Remove the busy Indicator
							oController.getView().getParent().setBusy(false);
							MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
							// jQuery.sap.log.error("Error adding new affected partner");
							// MessageToast.show("Updating Checklist failed ");
						}
					});
				} else if (this._oModel.hasPendingChanges() && sCurrentChkStatus === "CUST") {
					MessageToast.show(this.getI18NText("CHK_STS_ONHOLD"));
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
			/*if (oCreateMode === false) {
			    this._oModel.deleteCreatedEntry(this._oContext);
			}*/
			this.oComponent._oViewModel.setProperty("/CreateMode", true);
			this.oComponent._setViewModelProperty("SaveBtn_Visible", false);
			this.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
			this.oComponent._setViewModelProperty("AssignBtn_Visible", false);
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
		/*eslint-enable */
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

		}

	});
});