sap.ui.require([
		"sap/ui/test/Opa5",
		"test/integration/components/Common"
	],
	function(Opa5, Common) {
		"use strict";
		var sBaseViewPath = "aklc.cm.components.property.view.";
		var sMasterView = sBaseViewPath + "Master";
		var sDetailView = sBaseViewPath + "Detail";

		var sOWNER = "James Brown";
		var sLegalDescription = "Lot 22 DP 3546764";
		var sNEW_OWNER = "Borat Itchyballski";
		var sNEW_ADDRESS = "22 Bright Terrrace, Grey Lynn, Auckland";
		var sRowRepeaterId = "additionalProperties";

		Opa5.createPageObjects({
			onPropertyStep: {
				baseClass: Common,
				///ACTIONS///
				actions: {
					iSortTheListOnLegalDesc: function() {
						return this.iPressACommonsButton(sMasterView, "text", "Legal Description");
					},

					iSortTheListOnAddress: function() {
						return this.iPressACommonsButton(sMasterView, "text", "Address");
					},

					iSortTheListOnOwner: function() {
						return this.iPressACommonsButton(sMasterView, "text", "Owner");
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

					iSelectOwnerRow: function() {
						return this.iPressARowRepeaterItem(sMasterView, sRowRepeaterId, "Owner", sOWNER);
					},

					iSelectLegalDescription: function() {
						this.iClickInputValueHelp(sDetailView, "legalDescription__vhi");
						this.iTapObjectIdentifier(sLegalDescription);
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
						this.iSeeFieldWithProperty(sDetailView, "owner", "editable", false);
						this.iSeeFieldWithProperty(sDetailView, "address", "editable", false);
						return this;
					}
				},
				///ASSERTIONS///
				assertions: {
					iShouldSeeThePropertyList: function() {
						return this.iShouldSeeTheRowRepeater(sMasterView, sRowRepeaterId);
					},

					theListShouldHaveAllEntries: function() {
						return this.theRowRepeaterShouldHaveAllEntries(sMasterView, sRowRepeaterId, "AdditionalProperty");
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

					theListShouldBeSortedAscendingByLegalDesc: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "Legal Description");
					},

					theListShouldBeSortedDescendingByLegalDesc: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "Legal Description", true);
					},

					theListShouldBeSortedAscendingByAddress: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "Address");
					},

					theListShouldBeSortedDescendingByAddress: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "Address", true);
					},

					theListShouldBeSortedAscendingByOwner: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "Owner");
					},

					theListShouldBeSortedDescendingByOwner: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "Owner", true);
					},

					theOwnerRowShouldBeHighLighted: function() {
						return this.theCorrectRowRepeaterRowIsSelected(sMasterView, sRowRepeaterId, "Owner", sOWNER);
					},

					theDetailsShouldShowOwner: function() {
						return this.waitFor({
							id: "owner",
							viewName: sDetailView,
							success: function(oComboBox) {
								var sValue = oComboBox.getValue();
								ok(sValue.indexOf(sOWNER) > -1, "The Details View shows the correct Owner '" + sValue + "'");
								strictEqual(oComboBox.getEditable(), false, "The  cannot be edtied");
							},
							errorMessage: "The row cannot be found."
						});
					},

					theNewPropertyExtensionIsInRowRepeater: function() {
						this.theRowRepeaterFirstRow(sMasterView, sRowRepeaterId, "LegalDescription", sLegalDescription);
						this.theRowRepeaterFirstRow(sMasterView, sRowRepeaterId, "Address", sNEW_ADDRESS);
						this.theRowRepeaterFirstRow(sMasterView, sRowRepeaterId, "Owner", sNEW_OWNER);
						return this;
					},

					theLegalDescriptionFieldHighlitedRed: function() {
						return this.checkMandatoryStatus(sDetailView, "legalDescription", "Legal Description is in error state", "Legal Description not in error state");
					}
				}
			}
		});
	});
