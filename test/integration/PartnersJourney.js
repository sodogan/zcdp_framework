sap.ui.require(
	[
		"sap/ui/test/Opa5"
	],
	function(Opa5) {
		"use strict";

		QUnit.module("Assigned Partners Step");
		opaTest("Should see the Assigned Partners list with all entries", function(Given, When, Then) {
			// Arrange
			Given.onPartnersStep.iStartStep("partners");

			//Act
			When.onPartnersStep.iLookAtTheScreen();

			// Assertions
			Then.onPartnersStep.iShouldSeeThePartnersList().
			and.theListShouldHaveAllEntries();
		});

		opaTest("Select Assigned Partners shows details", function(Given, When, Then) {
			// Actions
			When.onPartnersStep.iSelectSoldToPartyRow().
			and.iSeeInputFieldsNotEditable();

			// Assertions
			Then.onPartnersStep.theSoldToPartyRowShouldBeHighLighted().
			and.theDetailsShouldShowSoldToParty();
		});

		opaTest("Assigned Partners list Sorting Ascending on First Name", function(Given, When, Then) {
			// Actions
			When.onPartnersStep.iSortTheListOnFirstName();

			// Assertions
			Then.onPartnersStep.theListShouldBeSortedAscendingByFirstName();
		});

		opaTest("Assigned Partners list Sorting Descending on First Name", function(Given, When, Then) {
			// Actions
			When.onPartnersStep.iSortTheListOnFirstName();

			// Assertions
			Then.onPartnersStep.theListShouldBeSortedDescendingByFirstName();
		});

		opaTest("Assigned Partners list Sorting Ascending on Last Name", function(Given, When, Then) {
			// Actions
			When.onPartnersStep.iSortTheListOnLastName();

			// Assertions
			Then.onPartnersStep.theListShouldBeSortedAscendingByLastName();
		});

		opaTest("Assigned Partners list Sorting Descending on Last Name", function(Given, When, Then) {
			// Actions
			When.onPartnersStep.iSortTheListOnLastName();

			// Assertions
			Then.onPartnersStep.theListShouldBeSortedDescendingByLastName();
		});


		opaTest("Assigned Partners list Sorting Ascending on Partner Type", function(Given, When, Then) {
			// Actions
			When.onPartnersStep.iSortTheListOnPartnerType();

			// Assertions
			Then.onPartnersStep.theListShouldBeSortedAscendingByPartnerType();
		});

		opaTest("Assigned Partners list Sorting Descending on Partner Type", function(Given, When, Then) {
			// Actions
			When.onPartnersStep.iSortTheListOnPartnerType();

			// Assertions
			Then.onPartnersStep.theListShouldBeSortedDescendingByPartnerType();
		});

		// opaTest("FilterAssigned Partners by All", function(Given, When, Then) {
		// 	// Actions
		// 	When.onPartnersStep.iFilterTheListAll();

		// 	// Assertions
		// 	Then.onPartnersStep.theListShouldHaveFourEntries().
		// 	and.theListShouldHaveAllEntries();
		// });

		opaTest("Filter Assigned Partners by Active", function(Given, When, Then) {
			// Actions
			When.onPartnersStep.iFilterTheListActive();

			// Assertions
			Then.onPartnersStep.theListShouldHaveTwoEntries().
			and.theListShouldShowActiveRecords();
		});

		opaTest("Filter Assigned Partners by Historic", function(Given, When, Then) {
			// Actions
			When.onPartnersStep.iFilterTheListHistoric();

			// Assertions
			Then.onPartnersStep.theListShouldHaveTwoEntries().
			and.theListShouldShowHistoricRecords();
		});

		opaTest("Add new Partner", function(Given, When, Then) {
			// Actions
			When.onPartnersStep.iPressThePlusIcon().
			and.iSelectServiceEmployeeGroupPartnerFunction().
			and.iSelectOrewaOrewaProcessingSupportPartner().
			and.iPressSave().
			and.iFilterTheListActive();

			// Assertions
			Then.onPartnersStep.theListShouldHaveThreeEntries().
			and.theNewServiceEmployeeGroupPartnerIsInRowRepeater().
			iTeardownMyAppFrame();
		});
	});
