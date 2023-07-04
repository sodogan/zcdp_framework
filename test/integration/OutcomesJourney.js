sap.ui.require(
	[
		"sap/ui/test/Opa5"
	],
	function(Opa5) {
		"use strict";

		QUnit.module("Outcomes Step");
		opaTest("Should see the Outcomes list with all entries", function(Given, When, Then) {
			// Arrange
			Given.onOutcomesStep.iStartStep("outcomes");

			//Act
			When.onOutcomesStep.iLookAtTheScreen();

			// Assertions
			Then.onOutcomesStep.iShouldSeeTheOutcomesList().
			and.theListShouldHaveAllEntries();
		});

		opaTest("Select Outcomes shows details", function(Given, When, Then) {
			// Actions
			When.onOutcomesStep.iSelectGrantedRow().
			and.iSeeInputFieldsNotEditable();

			// Assertions
			Then.onOutcomesStep.theGrantedRowShouldBeHighLighted().
			and.theDetailsShouldShowGranted();
		});

		opaTest("Add new Outcomes", function(Given, When, Then) {
			// Actions
			When.onOutcomesStep.iPressThePlusIcon().
			and.iSelectAppealOverturnedDecisionCode().
			and.iSelectHearingCommissionerDecisionMaker().
			and.iEnterComments().
			and.iPressAdd();

			// Assertions
			Then.onOutcomesStep.theListShouldHaveThreeEntries().
			and.theNewOutcomesIsInRowRepeater();
		});

		opaTest("Delete existing Outcomes", function(Given, When, Then) {
			// Actions
			When.onOutcomesStep.iPressTheDeleteIconOnGrantedRow().
			and.iPressTheYesButton();

			// Assertions
			Then.onOutcomesStep.theListShouldHaveTwoEntries();
			// and.iTeardownMyAppFrame();
		});

	});
