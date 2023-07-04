sap.ui.require([
		"sap/ui/test/Opa5",
		"test/integration/components/Common"
	],
	function(Opa5, Common) {
		"use strict";
		var sBaseViewPath = "aklc.cm.components.outcomes.view.";
		var sMasterView = sBaseViewPath + "Master";
		var sDetailView = sBaseViewPath + "Detail";

		var sRowRepeaterId = "outcomes";

		var sGRT = "Granted";
		var sAPO = "Appeal Overturned";

		var sHEARCOMM = "Hearing Commissioner";

		var sComment = "Changed Comment";

		Opa5.createPageObjects({
			onOutcomesStep: {
				baseClass: Common,
				///ACTIONS///
				actions: {
					iPressThePlusIcon: function() {
						return this.iPressTheIconButton(sMasterView, "Plus", "sap-icon://add");
					},

					iPressTheDeleteIcon: function() {
						return this.iPressAnIcon(sMasterView, "sap-icon://decline", "Delete");
					},

					iSelectGrantedRow: function() {
						return this.iPressARowRepeaterItem(sMasterView, sRowRepeaterId, "DecisionCodeText", sGRT);
					},

					iSelectAppealOverturnedDecisionCode: function() {
						return this.iSelectComboBoxItem(sDetailView, "decisionCode", sAPO);
					},

					iSelectHearingCommissionerDecisionMaker: function() {
						return this.iSelectComboBoxItem(sDetailView, "decisionMaker", sHEARCOMM);
					},

					iEnterComments: function() {
						return this.waitFor({
							id: "comments",
							viewName: sDetailView,
							success: function(oTextArea) {
								oTextArea.setValue(sComment);
								ok(oTextArea, "TextArea  changed.");
							},
							errorMessage: "Comments not found"
						});
					},

					iPressTheYesButton: function() {
						return this.iPressACommonsButton(undefined, "id", "YesBtn");
					},

					iPressAdd: function() {
						return this.iPressACommonsButton(sDetailView, "text", "Add");
					},

					iPressTheDeleteIconOnGrantedRow: function() {
						var oRowItem = null;

						return this.waitFor({
							id: sRowRepeaterId,
							viewName: sMasterView,
							check: function(oRowRepeater) {
								// find rows where value matches
								return oRowRepeater.getRows().some(function(oRow) {
									if (oRow.getBindingContext().getProperty("DecisionCodeText") === sGRT) {
										oRowItem = oRow;
										return true;
									}
									return false;
								});
							},
							success: function() {
								var oDeleteIcon = oRowItem.getContent()[oRowItem.getContent().length - 1];
								oDeleteIcon.$().focus().click().blur();
								ok(true, "Row Delete Pressed");
							},
							errorMessage: "Row Not Found"
						});
					},

					iSeeInputFieldsNotEditable: function() {
						this.iSeeFieldWithProperty(sDetailView, "decisionCode", "editable", false);
						this.iSeeFieldWithProperty(sDetailView, "decisionDate", "editable", false);
						this.iSeeFieldWithProperty(sDetailView, "comments", "editable", false);
						return this;
					}
				},

				///ASSERTIONS///
				assertions: {
					iShouldSeeTheOutcomesList: function() {
						return this.iShouldSeeTheRowRepeater(sMasterView, sRowRepeaterId);
					},

					theListShouldHaveAllEntries: function() {
						return this.theRowRepeaterShouldHaveAllEntries(sMasterView, sRowRepeaterId, "Outcomes");
					},

					theGrantedRowShouldBeHighLighted: function() {
						return this.theCorrectRowRepeaterRowIsSelected(sMasterView, sRowRepeaterId, "DecisionCodeText", sGRT);
					},

					theDetailsShouldShowGranted: function() {
						return this.waitFor({
							id: "decisionCode",
							viewName: sDetailView,
							success: function(oComboBox) {
								var sValue = oComboBox.getValue();
								ok(sValue.indexOf(sGRT) > -1, "The Details View shows the correct Reason Code '" + sValue + "'");
								strictEqual(oComboBox.getEditable(), false, "The Reson Code cannot be edtied");
							},
							errorMessage: "The row cannot be found."
						});
					},

					theListShouldHaveThreeEntries: function() {
						return this.theRowRepeaterShouldHaveNEntries(sMasterView, sRowRepeaterId, 3);
					},

					theListShouldHaveTwoEntries: function() {
						return this.theRowRepeaterShouldHaveNEntries(sMasterView, sRowRepeaterId, 2);
					},

					theNewOutcomesIsInRowRepeater: function() {
						this.theRowRepeaterFirstRow(sMasterView, sRowRepeaterId, "DecisionCodeText", sAPO);
						this.theRowRepeaterFirstRow(sMasterView, sRowRepeaterId, "DecisionMakerText", sHEARCOMM);
						this.theRowRepeaterFirstRow(sMasterView, sRowRepeaterId, "Comments", sComment);
						return this;
					}
				}
			}
		});
	});
