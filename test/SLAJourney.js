sap.ui.require(
	[
		"sap/ui/test/Opa5"
	],
	function(Opa5) {
		"use strict";

		QUnit.module("SLA Step");
		opaTest("Should see the SLA Extensions list with all entries", function(Given, When, Then) {
			// Arrange
			Given.onSLAStep.iStartStep("sla");

			//Act
			When.onSLAStep.iLookAtTheScreen();

			// Assertions
			Then.onSLAStep.iShouldSeeTheSLAList().
			and.theListShouldHaveAllEntries();
		});

		opaTest("Select SLA Extension shows details", function(Given, When, Then) {
			// Actions
			When.onSLAStep.iSelectSubmissionPeriodRow().
			and.iSeeInputFieldsNotEditable();

			// Assertions
			Then.onSLAStep.theSubmissionPeriodRowShouldBeHighLighted().
			and.theDetailsShouldShowSubmissionPeriod();
		});

		opaTest("Filter SLA Extension by Reason", function(Given, When, Then) {
			// Actions
			When.onSLAStep.iPressTheFilterIcon().
			and.iCanSeeTheFilterDialog().
			and.iPressOnFilterByReason().
			and.iSelectPubliclyNotifiedHearing().
			and.iPressFilterDialogOK();

			// Assertions
			Then.onSLAStep.theListShouldHaveOneEntry().
			and.theItemsReasonIsPubliclyNotifiedHearing();
		});

		opaTest("SLA Extensions reset the list", function(Given, When, Then) {
			// Actions
			When.onSLAStep.iPressTheResetIcon();

			// Assertions
			Then.onSLAStep.theListShouldHaveAllEntries();
		});


		opaTest("SLA Extensions list Sorting Ascending on Reason", function(Given, When, Then) {
			// Actions
			When.onSLAStep.iSortTheListOnReason();

			// Assertions
			Then.onSLAStep.theListShouldBeSortedAscendingByReason();
		});

		opaTest("SLA Extensions list Sorting Descending on Reason", function(Given, When, Then) {
			// Actions
			When.onSLAStep.iSortTheListOnReason();

			// Assertions
			Then.onSLAStep.theListShouldBeSortedDescendingByReason();
		});

		opaTest("SLA Extensions list Sorting on Ascending Days Adjusted", function(Given, When, Then) {
			// Actions
			When.onSLAStep.iSortTheListOnDaysAdjusted();

			// Assertions
			Then.onSLAStep.theListShouldBeSortedAscendingByDaysAdjusted();
		});

		opaTest("SLA Extensions list Sorting on Descending Days Adjusted", function(Given, When, Then) {
			// Actions
			When.onSLAStep.iSortTheListOnDaysAdjusted();

			// Assertions
			Then.onSLAStep.theListShouldBeSortedAscendingByDaysAdjusted();
		});

		// dialog doesnt render quick enough if this step not there
		opaTest("SLA Extensions reset the list", function(Given, When, Then) {
			// Actions
			When.onSLAStep.iPressTheResetIcon();

			// Assertions
			Then.onSLAStep.theListShouldHaveAllEntries();
		});

		opaTest("Add new SLA Extension without duration", function(Given, When, Then) {
			// Actions
			When.onSLAStep.iPressThePlusIcon().
			and.iSelectNotifcationWithNoHearingReasonCode().
			and.iSeeDurationNotEditable().
			and.iEnterComments().
			and.iPressSave();

			// Assertions
			Then.onSLAStep.theListShouldHaveFiveEntries().
			and.theNewNNHRSLAExtensionIsInRowRepeater();
		});

		opaTest("Add new SLA Extension with duration", function(Given, When, Then) {
			// Actions
			When.onSLAStep.iPressThePlusIcon().
			and.iSelectApplicantAgreementReasonCode().
			and.iSeeDurationEditable().
			and.iEnterDurationFiftyFive().
			and.iEnterComments().
			and.iPressSave();

			// Assertions
			Then.onSLAStep.theListShouldHaveSixEntries().
			and.theNewAGARSLAExtensionIsInRowRepeater();
			// and.iTeardownMyAppFrame();
		});
	});
