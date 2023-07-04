sap.ui.require([
		"sap/ui/test/Opa5",
		"test/integration/components/Common"
	],
	function(Opa5, Common) {
		"use strict";
		var sBaseViewPath = "aklc.cm.components.sla.view.";
		var sMasterView = sBaseViewPath + "Master";
		var sDetailView = sBaseViewPath + "Detail";

		var sPNHR = "Publicly notified hearing";
		var sSUPR = "Submission period";
		var sNNHR = "Notification with no hearing";
		var sAGAR = "Applicant Agreement(S37A(5))";

		var sNotes = "Changed Comment";

		var sRowRepeaterId = "slas";

		Opa5.createPageObjects({
			onSLAStep: {
				baseClass: Common,
				///ACTIONS///
				actions: {
					iSortTheListOnReason: function() {
						return this.iPressACommonsButton(sMasterView, "text", "Reason");
					},

					iSortTheListOnDaysAdjusted: function() {
						return this.iPressACommonsButton(sMasterView, "text", "Days Adjusted");
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

					iPressOnFilterByReason: function() {
						return this.iPressAnObjectListItem(undefined, "SlaFilters-filterlist", "Reason");
					},

					iSelectPubliclyNotifiedHearing: function() {
						return this.iPressAStandardListItem("Title", sPNHR);
					},

					iPressFilterDialogOK: function() {
						return this.iPressTheButton(undefined, "text", "OK", "OK");
					},

					iSelectSubmissionPeriodRow: function() {
						return this.iPressARowRepeaterItem(sMasterView, sRowRepeaterId, "ReasonText", sSUPR);
					},

					iSelectNotifcationWithNoHearingReasonCode: function() {
						return this.iSelectComboBoxItem(sDetailView, "reasonCode", sNNHR);
					},

					iSelectApplicantAgreementReasonCode: function() {
						return this.iSelectComboBoxItem(sDetailView, "reasonCode", sAGAR);
					},

					iCanSeeTheFilterDialog: function() {
						return this.waitFor({
							id: "SlaFilters", //-dialog",
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

					iEnterComments: function() {
						return this.waitFor({
							id: "notes",
							viewName: sDetailView,
							success: function(oTextArea) {
								oTextArea.setValue(sNotes);
								ok(oTextArea, "TextArea  changed.");
							},
							errorMessage: "Comments not found"
						});
					},

					iPressSave: function() {
						return this.iPressACommonsButton(sDetailView, "text", "Save");
					},

					iSeeInputFieldsNotEditable: function() {
						this.iSeeFieldWithProperty(sDetailView, "reasonCode", "editable", false);
						this.iSeeFieldWithProperty(sDetailView, "duration", "editable", false);
						this.iSeeFieldWithProperty(sDetailView, "notes", "editable", false);
						return this;
					},

					iSeeDurationEditable: function() {
						return this.iSeeFieldWithProperty(sDetailView, "duration", "editable", true);
					},

					iSeeDurationNotEditable: function() {
						return this.iSeeFieldWithProperty(sDetailView, "duration", "editable", false);
					},

					iEnterDurationFiftyFive: function() {
						return this.waitFor({
							id: "duration",
							viewName: sDetailView,
							success: function(oInput) {
								oInput.setValue(55);
								ok(oInput, "Input changed.");
							},
							errorMessage: "Input not found"
						});
					}
				},
				///ASSERTIONS///
				assertions: {
					iShouldSeeTheSLAList: function() {
						return this.iShouldSeeTheRowRepeater(sMasterView, sRowRepeaterId);
					},

					theListShouldHaveAllEntries: function() {
						return this.theRowRepeaterShouldHaveAllEntries(sMasterView, sRowRepeaterId, "SlaExtensions");
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

					theItemsReasonIsPubliclyNotifiedHearing: function() {
						return this.theRowRepeaterShouldShowOnly(sMasterView, sRowRepeaterId, "ReasonText", sPNHR);
					},

					theListShouldBeSortedAscendingByReason: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "ReasonText");
					},

					theListShouldBeSortedDescendingByReason: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "ReasonText", true);
					},

					theListShouldBeSortedAscendingByDaysAdjusted: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "Days Adjusted");
					},

					theListShouldBeSortedDescendingByDaysAdjusted: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "Days Adjusted", true);
					},

					theSubmissionPeriodRowShouldBeHighLighted: function() {
						return this.theCorrectRowRepeaterRowIsSelected(sMasterView, sRowRepeaterId, "ReasonText", sSUPR);
					},

					theDetailsShouldShowSubmissionPeriod: function() {
						return this.waitFor({
							id: "reasonCode",
							viewName: sDetailView,
							success: function(oComboBox) {
								var sValue = oComboBox.getValue();
								ok(sValue.indexOf(sSUPR) > -1, "The Details View shows the correct Reason Code '" + sValue + "'");
								strictEqual(oComboBox.getEditable(), false, "The Reson Code cannot be edtied");
							},
							errorMessage: "The row cannot be found."
						});
					},

					theNewNNHRSLAExtensionIsInRowRepeater: function() {
						// Assumption being new record inserted into 1 space
						this.theRowRepeaterFirstRow(sMasterView, sRowRepeaterId, "ReasonText", sNNHR);
						this.theRowRepeaterFirstRow(sMasterView, sRowRepeaterId, "Notes", sNotes);
						return this;
					},

					theNewAGARSLAExtensionIsInRowRepeater: function() {
						this.theRowRepeaterFirstRow(sMasterView, sRowRepeaterId, "ReasonText", sAGAR);
						this.theRowRepeaterFirstRow(sMasterView, sRowRepeaterId, "Notes", sNotes);
						this.theRowRepeaterFirstRow(sMasterView, sRowRepeaterId, "Duration", 55);
						return this;
					}
				}
			}
		});
	});
