sap.ui.require([
		"sap/ui/test/Opa5",
		"test/integration/components/Common"
	],
	function(Opa5, Common) {
		"use strict";
		var sBaseViewPath = "aklc.cm.components.transact.view.";
		var sMasterView = sBaseViewPath + "Master";
		var sDetailView = sBaseViewPath + "Detail";

		var sSUBJECT = "BWF20000105";
		var sORDER_TYPE = "CRM Service Request";
		var sSUBJECT_SELECT = "IQP110162";

		var sSTATUS_ADDED = "New";
		var sSUBJECT_ADDED = "8700002572";

		var sRowRepeaterId = "relatedTransaction";

		Opa5.createPageObjects({
			onTransactionStep: {
				baseClass: Common,
				///ACTIONS///
				actions: {
					iSortTheListOnSubject: function() {
						return this.iPressACommonsButton(sMasterView, "text", "Subject");
					},

					iSortTheListOnStatus: function() {
						return this.iPressACommonsButton(sMasterView, "text", "Status");
					},

					iPressTheFilterIcon: function() {
						return this.iPressTheIconButton(sMasterView, "Reset", "sap-icon://filter");
					},

					iPressTheResetIcon: function() {
						return this.iPressTheIconButton(sMasterView, "Reset", "sap-icon://undo");
					},

					iPressThePlusIcon: function() {
						return this.iPressTheIconButton(sMasterView, "Plus", "sap-icon://add");
					},

					iPressFilterDialogOK: function() {
						return this.iPressTheButton(undefined, "text", "OK", "OK");
					},

					iSelectSubjectRow: function() {
						return this.iPressARowRepeaterItem(sMasterView, sRowRepeaterId, "ApplicationText", sSUBJECT);
					},

					iSelectOrderType: function() {
						this.iClickInputValueHelp(sDetailView, "orderType__vhi");
						this.iTapObjectIdentifier(sORDER_TYPE);
						return this;
					},

					iSelectSubject: function() {
						this.iClickInputValueHelp(sDetailView, "subject__vhi");
						this.iTapObjectIdentifier(sSUBJECT_SELECT);
						return this;
					},

					iCanSeeTheFilterDialog: function() {
						return this.waitFor({
							id: "PropertyFilters", //-dialog",
							viewName: undefined,
							check: function(oDialog) {
								return oDialog._dialog.isOpen();
							},
							success: function(oDialog) {
								ok(true, "Filter dialog is open");
							},
							errorMessage: "Filter dialog not found"
						});
					},

					iPressSave: function() {
						return this.iPressACommonsButton(sDetailView, "text", "Save");
					},

					iSeeInputFieldsNotEditable: function() {
						this.iSeeFieldWithProperty(sDetailView, "subject", "editable", false);
						this.iSeeFieldWithProperty(sDetailView, "category", "editable", false);
						return this;
					}
				},
				///ASSERTIONS///
				assertions: {
					iShouldSeeTheTransactionList: function() {
						return this.iShouldSeeTheRowRepeater(sMasterView, sRowRepeaterId);
					},

					theListShouldHaveAllEntries: function() {
						return this.theRowRepeaterShouldHaveAllEntries(sMasterView, sRowRepeaterId, "RelatedTransaction");
					},

					theListShouldHaveOneEntry: function() {
						return this.theRowRepeaterShouldHaveNEntries(sMasterView, sRowRepeaterId, 1);
					},

					theListShouldHaveFiveEntries: function() {
						return this.theRowRepeaterShouldHaveNEntries(sMasterView, sRowRepeaterId, 5);
					},

					theListShouldHaveSixEntries: function() {
						return this.theRowRepeaterShouldHaveNEntries(sMasterView, sRowRepeaterId, 6);
					},

					theListShouldBeSortedAscendingBySubject: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "ApplicationText");
					},

					theListShouldBeSortedDescendingBySubject: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "ApplicationText", true);
					},

					theListShouldBeSortedAscendingByStatus: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "StatusText");
					},

					theListShouldBeSortedDescendingByStatus: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "StatusText", true);
					},

					theSubjectRowShouldBeHighLighted: function() {
						return this.theCorrectRowRepeaterRowIsSelected(sMasterView, sRowRepeaterId, "ApplicationText", sSUBJECT);
					},

					theDetailsShouldShowSubject: function() {
						return this.waitFor({
							id: "subject",
							viewName: sDetailView,
							success: function(oComboBox) {
								var sValue = oComboBox.getValue();
								ok(sValue.indexOf(sSUBJECT) > -1, "The Details View shows the correct Owner '" + sValue + "'");
								strictEqual(oComboBox.getEditable(), false, "The  cannot be edtied");
							},
							errorMessage: "The row cannot be found."
						});
					},

					theNewPropertyExtensionIsInRowRepeater: function() {
						this.theRowRepeaterFirstRow(sMasterView, sRowRepeaterId, "ApplicationText", sSUBJECT_ADDED);
						this.theRowRepeaterFirstRow(sMasterView, sRowRepeaterId, "StatusText", sSTATUS_ADDED);
						return this;
					},

					theOrderTypeFieldHighlitedRed: function() {
						return this.checkMandatoryStatus(sDetailView, "orderType", "Order Type is in error state", "Order Type not in error state");
					},

					theSubjectFieldHighlitedRed: function() {
						return this.checkMandatoryStatus(sDetailView, "subject", "Order Type is in error state", "Order Type not in error state");
					}
				}
			}
		});
	});
