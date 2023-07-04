sap.ui.require(
	[
		"sap/ui/test/Opa5"
	],
	function(Opa5) {
		"use strict";

		QUnit.module("Transaction Step");
		opaTest("Should see the Transaction list with all entries", function(Given, When, Then) {
			// Arrange
			Given.onTransactionStep
				.iStartStep("transact");

			//Act
			When.onTransactionStep.iLookAtTheScreen();

			// Assertions
			Then.onTransactionStep.iShouldSeeTheTransactionList().
			and.theListShouldHaveAllEntries();
		});

		opaTest("Select Transaction shows details", function(Given, When, Then) {
			// Actions
			When.onTransactionStep.iSelectSubjectRow().
			and.iSeeInputFieldsNotEditable();

			// Assertions
			Then.onTransactionStep.theSubjectRowShouldBeHighLighted().
			and.theDetailsShouldShowSubject();
		});

		opaTest("Transaction reset the list", function(Given, When, Then) {
			// Actions
			When.onTransactionStep.iPressTheResetIcon();

			// Assertions
			Then.onTransactionStep.theListShouldHaveAllEntries();
		});


		opaTest("Transaction  list Sorting Ascending on Subject", function(Given, When, Then) {
			// Actions
			When.onTransactionStep.iSortTheListOnSubject();

			// Assertions
			Then.onTransactionStep.theListShouldBeSortedAscendingBySubject();
		});

		opaTest("Transaction  list Sorting Descending on Subject", function(Given, When, Then) {
			// Actions
			When.onTransactionStep.iSortTheListOnSubject();

			// Assertions
			Then.onTransactionStep.theListShouldBeSortedDescendingBySubject();
		});

		opaTest("Transaction  list Sorting Ascending on Status", function(Given, When, Then) {
			// Actions
			When.onTransactionStep.iSortTheListOnStatus();

			// Assertions
			Then.onTransactionStep.theListShouldBeSortedAscendingByStatus();
		});

		opaTest("Transaction  list Sorting Descending on Status", function(Given, When, Then) {
			// Actions
			When.onTransactionStep.iSortTheListOnStatus();

			// Assertions
			Then.onTransactionStep.theListShouldBeSortedDescendingByStatus();
		});

		// dialog doesnt render quick enough if this step not there
		opaTest("Transaction  reset the list", function(Given, When, Then) {
			// Actions
			When.onTransactionStep.iPressTheResetIcon();

			// Assertions
			Then.onTransactionStep.theListShouldHaveAllEntries();
		});

		opaTest("Add new Transaction without Order Type", function(Given, When, Then) {
			// Actions
			When.onTransactionStep.iPressThePlusIcon().
			and.iPressSave();

			// Assertions
			Then.onTransactionStep.theOrderTypeFieldHighlitedRed();
		});

		opaTest("Add new Transaction with Order Type", function(Given, When, Then) {
			// Actions
			When.onTransactionStep.iPressThePlusIcon().
			and.iSelectOrderType().
			and.iPressSave();

			// Assertions
			Then.onTransactionStep.theSubjectFieldHighlitedRed();
			// and.iTeardownMyAppFrame();
		});

		opaTest("Add new Transaction without Subject", function(Given, When, Then) {
			// Actions
			When.onTransactionStep.iPressThePlusIcon().
			and.iPressSave();

			// Assertions
			Then.onTransactionStep.theSubjectFieldHighlitedRed();
			// and.iTeardownMyAppFrame();
		});

		opaTest("Add new Transaction with Subject", function(Given, When, Then) {
			// Actions
			When.onTransactionStep.iPressThePlusIcon().
			and.iSelectSubject().
			and.iPressSave();

			// Assertions
			Then.onTransactionStep.theListShouldHaveFiveEntries().and.
			theNewPropertyExtensionIsInRowRepeater();
			// and.iTeardownMyAppFrame();
		});
	});
