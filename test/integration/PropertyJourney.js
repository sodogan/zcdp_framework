sap.ui.require(
	[
		"sap/ui/test/Opa5"
	],
	function(Opa5) {
		"use strict";

		QUnit.module("Property Step");
		opaTest("Should see the Property list with all entries", function(Given, When, Then) {
			// Arrange
			Given.onPropertyStep.iStartStep("property");

			//Act
			When.onPropertyStep.iLookAtTheScreen();

			// Assertions
			Then.onPropertyStep.iShouldSeeThePropertyList().
			and.theListShouldHaveAllEntries();
		});

		opaTest("Select Property shows details", function(Given, When, Then) {
			// Actions
			When.onPropertyStep.iSelectOwnerRow().
			and.iSeeInputFieldsNotEditable();

			// Assertions
			Then.onPropertyStep.theOwnerRowShouldBeHighLighted().
			and.theDetailsShouldShowOwner();
		});

		opaTest("Property reset the list", function(Given, When, Then) {
			// Actions
			When.onPropertyStep.iPressTheResetIcon();

			// Assertions
			Then.onPropertyStep.theListShouldHaveAllEntries();
		});


		opaTest("Property  list Sorting Ascending on Legal Description", function(Given, When, Then) {
			// Actions
			When.onPropertyStep.iSortTheListOnLegalDesc();

			// Assertions
			Then.onPropertyStep.theListShouldBeSortedAscendingByLegalDesc();
		});

		opaTest("Property  list Sorting Descending on Legal Description", function(Given, When, Then) {
			// Actions
			When.onPropertyStep.iSortTheListOnLegalDesc();

			// Assertions
			Then.onPropertyStep.theListShouldBeSortedDescendingByLegalDesc();
		});

		opaTest("Property  list Sorting Ascending on Address", function(Given, When, Then) {
			// Actions
			When.onPropertyStep.iSortTheListOnAddress();

			// Assertions
			Then.onPropertyStep.theListShouldBeSortedAscendingByAddress();
		});

		opaTest("Property  list Sorting Descending on Address", function(Given, When, Then) {
			// Actions
			When.onPropertyStep.iSortTheListOnAddress();

			// Assertions
			Then.onPropertyStep.theListShouldBeSortedDescendingByAddress();
		});

		opaTest("Property  list Sorting on Ascending on Owner", function(Given, When, Then) {
			// Actions
			When.onPropertyStep.iSortTheListOnOwner();

			// Assertions
			Then.onPropertyStep.theListShouldBeSortedAscendingByOwner();
		});

		opaTest("Property  list Sorting on Descending on Owner", function(Given, When, Then) {
			// Actions
			When.onPropertyStep.iSortTheListOnOwner();

			// Assertions
			Then.onPropertyStep.theListShouldBeSortedDescendingByOwner();
		});

		// dialog doesnt render quick enough if this step not there
		opaTest("Property  reset the list", function(Given, When, Then) {
			// Actions
			When.onPropertyStep.iPressTheResetIcon();

			// Assertions
			Then.onPropertyStep.theListShouldHaveAllEntries();
		});

		opaTest("Add new Property without Legal Description", function(Given, When, Then) {
			// Actions
			When.onPropertyStep.iPressThePlusIcon().
			and.iPressSave();

			// Assertions
			Then.onPropertyStep.theLegalDescriptionFieldHighlitedRed();
		});

		opaTest("Add new Property with Legal Description", function(Given, When, Then) {
			// Actions
			When.onPropertyStep.iPressThePlusIcon().
			and.iSelectLegalDescription().
			and.iPressSave();

			// Assertions
			Then.onPropertyStep.theListShouldHaveFiveEntries().
			and.theNewPropertyExtensionIsInRowRepeater();
			// and.iTeardownMyAppFrame();
		});
	});
