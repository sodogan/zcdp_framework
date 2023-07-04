sap.ui.require(
	[
		"sap/ui/test/Opa5"
	],
	function(Opa5) {
		"use strict";

		QUnit.module("Affected Parties Step");
		opaTest("Should see the Affected Parties list with all entries", function(Given, When, Then) {
			// Arrange
			Given.onAffectedPartiesStep.iStartStep("parties");

			//Act
			When.onAffectedPartiesStep.iLookAtTheScreen();

			// Assertions
			Then.onAffectedPartiesStep.iShouldSeeThePartnersList();
			
		});

		opaTest("Select Affected Parties shows details", function(Given, When, Then) {
			// Actions
			When.onAffectedPartiesStep.iSelectOwnerRow().
			and.iSeeInputFieldsNotEditable();

			// Assertions
			Then.onAffectedPartiesStep.theOwnerRowShouldBeHighLighted().
			and.theDetailsShouldShowOwner();
		});

		opaTest("Update Affected Parties", function(Given, When, Then) {
			// Actions
			When.onAffectedPartiesStep.iChangeResponse().
			and.iPressUpdate();

			// Assertions			
			Then.onAffectedPartiesStep.theUpdatedAffectedPartyIsInRowRepeater();
		});

			opaTest("Add new Partner", function(Given, When, Then) {
			// Actions
			When.onAffectedPartiesStep.iPressThePlusIcon().
			and.iSelectPartyName().			
			and.iPressSave();
			

			// Assertions
			Then.onAffectedPartiesStep.theNewAffectedPartyIsInRowRepeater();
			

		});

		opaTest("Delete existing Affected Party", function(Given, When, Then) {
			// Actions
			When.onAffectedPartiesStep.iPressTheDeleteIconOnGrantedRow().
			and.iPressTheYesButton();

			// Assertions
			Then.onAffectedPartiesStep.theListShouldNotContainThisRecord();			
		});

		opaTest("Affected Parties list Sorting Ascending on Party Name", function(Given, When, Then) {
			// Actions
			When.onAffectedPartiesStep.iSortTheListOnPartyName();

			// Assertions
			Then.onAffectedPartiesStep.theListShouldBeSortedAscendingByPartyName();
		});

		opaTest("Affected Parties list Sorting Descending on Party Name", function(Given, When, Then) {
			// Actions
			When.onAffectedPartiesStep.iSortTheListOnPartyName();

			// Assertions
			Then.onAffectedPartiesStep.theListShouldBeSortedDescendingByPartyName();
		});

		opaTest("Affected Parties list Sorting Ascending on Party Type", function(Given, When, Then) {
			// Actions
			When.onAffectedPartiesStep.iSortTheListOnPartyType();

			// Assertions
			Then.onAffectedPartiesStep.theListShouldBeSortedAscendingByPartyType();
		});

		opaTest("Affected Parties list Sorting Descending on Party Type", function(Given, When, Then) {
			// Actions
			When.onAffectedPartiesStep.iSortTheListOnPartyType();

			// Assertions
			Then.onAffectedPartiesStep.theListShouldBeSortedDescendingByPartyType();
		});

		opaTest("Affected Parties list Sorting Ascending on Response", function(Given, When, Then) {
			// Actions
			When.onAffectedPartiesStep.iSortTheListOnResponse();

			// Assertions
			Then.onAffectedPartiesStep.theListShouldBeSortedAscendingByResponse();
		});

		opaTest("Affected Parties list Sorting Descending on Response", function(Given, When, Then) {
			// Actions
			When.onAffectedPartiesStep.iSortTheListOnResponse();

			// Assertions
			Then.onAffectedPartiesStep.theListShouldBeSortedDescendingByResponse();
		});
        
        opaTest("Filter Affected Parties by Response", function(Given, When, Then) {
			// Actions
			When.onAffectedPartiesStep.iPressTheFilterIcon().
			and.iCanSeeTheFilterDialog().
			and.iPressOnFilterByResponse().
			and.iSelectSupport().
			and.iPressFilterDialogOK();

			// Assertions
			Then.onAffectedPartiesStep.theListShouldShowSupportRecords();
		});
        
        opaTest("Remove filters on the list of Affected Parties", function(Given, When, Then) {
			// Actions
			When.onAffectedPartiesStep.iRemoveFilters();

			// Assertions
			Then.onAffectedPartiesStep.theListShouldShowAllRecords();
		});
        
		opaTest("Filter Affected Parties by Owner", function(Given, When, Then) {
			// Actions
			When.onAffectedPartiesStep.iFilterTheListOwner();

			// Assertions
			Then.onAffectedPartiesStep.theListShouldShowOwnerRecords();
		});

		opaTest("Filter Affected Parties by Occupant", function(Given, When, Then) {
			// Actions
			When.onAffectedPartiesStep.iFilterTheListOccupant();

			// Assertions
			Then.onAffectedPartiesStep.theListShouldShowOccupantRecords();
		});

		opaTest("Filter Affected Parties by Other", function(Given, When, Then) {
			// Actions
			When.onAffectedPartiesStep.iFilterTheListOther();

			// Assertions
			Then.onAffectedPartiesStep.theListShouldShowOtherRecords();
		});


	});
