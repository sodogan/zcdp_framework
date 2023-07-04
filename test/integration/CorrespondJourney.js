sap.ui.require(
	[
		"sap/ui/test/Opa5"
	],
	function(Opa5) {
		"use strict";

		QUnit.module("Correspondence Step");
		opaTest("Should see the Correspondence list with all entries", function(Given, When, Then) {
			// Arrange
			Given.onCorrespondenceStep
				.iStartStep("correspond");

			//Act
			When.onCorrespondenceStep.iLookAtTheScreen();

			// Assertions
			Then.onCorrespondenceStep.iShouldSeeTheCorrespondenceList().
			and.theListShouldHaveAllEntries();
		});

		opaTest("Correspondence reset the list", function(Given, When, Then) {
			// Actions
			When.onCorrespondenceStep.iPressTheResetIcon();

			// Assertions
			Then.onCorrespondenceStep.theListShouldHaveAllEntries();
		});


		opaTest("Correspondence  list Sorting Ascending on Document Type", function(Given, When, Then) {
			// Actions
			When.onCorrespondenceStep.iSortTheListOnDocType();

			// Assertions
			Then.onCorrespondenceStep.theListShouldBeSortedAscendingByDocType();
		});

		opaTest("Correspondence  list Sorting Descending on Document Type", function(Given, When, Then) {
			// Actions
			When.onCorrespondenceStep.iSortTheListOnDocType();

			// Assertions
			Then.onCorrespondenceStep.theListShouldBeSortedDescendingByDocType();
		});


		// opaTest("Correspondence  list Sorting Ascending on CreatedOn", function(Given, When, Then) {
		// 	// Actions
		// 	When.onCorrespondenceStep.iSortTheListOnCreatedOn();

		// 	// Assertions
		// 	Then.onCorrespondenceStep.theListShouldBeSortedAscendingByCreatedOn();
		// });

		// opaTest("Correspondence  list Sorting Descending on Created On", function(Given, When, Then) {
		// 	// Actions
		// 	When.onCorrespondenceStep.iSortTheListOnCreatedOn();

		// 	// Assertions
		// 	Then.onCorrespondenceStep.theListShouldBeSortedDescendingByCreatedOn();
		// });

		// opaTest("Correspondence  list Sorting Ascending on Partner Name", function(Given, When, Then) {
		// 	// Actions
		// 	When.onCorrespondenceStep.iSortTheListOnPartnerName();

		// 	// Assertions
		// 	Then.onCorrespondenceStep.theListShouldBeSortedAscendingByPartnerName();
		// });

		// opaTest("Correspondence  list Sorting Descending on Partner Name", function(Given, When, Then) {
		// 	// Actions
		// 	When.onCorrespondenceStep.iSortTheListOnPartnerName();

		// 	// Assertions
		// 	Then.onCorrespondenceStep.theListShouldBeSortedDescendingByPartnerName();
		// });


		// dialog doesnt render quick enough if this step not there
		opaTest("Correspondence  reset the list", function(Given, When, Then) {
			// Actions
			When.onCorrespondenceStep.iPressTheFilterIcon();

			// Assertions
			Then.onCorrespondenceStep.theListShouldHaveAllEntries();
		});

		opaTest("Filter Correspondence by Word Document", function(Given, When, Then) {
			// Actions
			When.onCorrespondenceStep.iPressTheFilterIcon().
			and.iCanSeeTheFilterDialog().
			and.iPressOnFilterByIconType().
			and.iSelectFilterItem("application/msword").
			and.iPressFilterDialogOK();

			// Assertions
			Then.onCorrespondenceStep.theListShouldHaveThirtyFourEntries().
			and.theItemsWordDoc();
		});

		opaTest("Correspondence reset the list", function(Given, When, Then) {
			// Actions
			When.onCorrespondenceStep.iPressTheResetIcon();

			// Assertions
			Then.onCorrespondenceStep.theListShouldHaveAllEntries();
		});

		opaTest("Filter Correspondence by Document Group", function(Given, When, Then) {
			// Actions
			When.onCorrespondenceStep.iPressTheFilterIcon().
			and.iCanSeeTheFilterDialog().
			and.iPressOnFilterByDocGroup().
			and.iSelectFilterItem("Correspondence").
			and.iPressFilterDialogOK();

			// Assertions
			Then.onCorrespondenceStep.theListShouldHaveTwelveEntries().
			and.theItemsDocGroup();
		});

		opaTest("Correspondence refresh the list", function(Given, When, Then) {
			// Actions
			When.onCorrespondenceStep.iPressTheRefreshIcon();

			// Assertions
			Then.onCorrespondenceStep.theListShouldHaveAllEntries();
		});

		opaTest("Dialog Sort Correspondence by Document Type", function(Given, When, Then) {
			// Actions
			When.onCorrespondenceStep.iPressTheSortIcon().
			and.iCanSeeTheSortDialog().
			and.iPressOnSortByDocType().
			and.iPressSortDialogOK();

			// Assertions
			Then.onCorrespondenceStep.theListShouldBeSortedAscendingByDocType();
		});
	});
