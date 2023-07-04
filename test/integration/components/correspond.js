sap.ui.require([
		"sap/ui/test/Opa5",
		"test/integration/components/Common"
	],
	function(Opa5, Common) {
		"use strict";
		var sBaseViewPath = "aklc.cm.components.correspond.view.";
		var sMasterView = sBaseViewPath + "Master";

		var _sWordMime = "application/msword";
		var _sDocGroup = "Correspondence";

		var sRowRepeaterId = "correspondence";

		Opa5.createPageObjects({
			onCorrespondenceStep: {
				baseClass: Common,
				///ACTIONS///
				actions: {
					iSortTheListOnDocType: function() {
						return this.iPressACommonsButton(sMasterView, "text", "Document Type");
					},

					iSortTheListOnCreatedOn: function() {
						return this.iPressACommonsButton(sMasterView, "text", "Created On");
					},

					iSortTheListOnPartnerName: function() {
						return this.iPressACommonsButton(sMasterView, "text", "Partner Name");
					},

					iPressTheFilterIcon: function() {
						return this.iPressTheIconButton(sMasterView, "Reset", "sap-icon://filter");
					},

					iPressTheResetIcon: function() {
						return this.iPressTheIconButton(sMasterView, "Reset", "sap-icon://undo");
					},

					iPressTheRefreshIcon: function() {
						return this.iPressTheIconButton(sMasterView, "Reset", "sap-icon://refresh");
					},

					iPressTheSortIcon: function() {
						return this.iPressTheIconButton(sMasterView, "Reset", "sap-icon://sort");
					},

					iPressFilterDialogOK: function() {
						return this.iPressTheButton(undefined, "text", "OK", "OK");
					},

					iPressSortDialogOK: function() {
						return this.iPressTheButton(undefined, "text", "OK", "OK");
					},

					iPressOnFilterByIconType: function() {
						return this.iPressAnObjectListItem(undefined, "CorrespondenceFilters-filterlist", "Icon Type");
					},

					iPressOnFilterByDocGroup: function() {
						return this.iPressAnObjectListItem(undefined, "CorrespondenceFilters-filterlist", "Document Group");
					},

					iPressOnSortbyName: function() {
						return this.iPressAnObjectListItem(undefined, "CorrespondenceFilters-tersortlist", "Name");
					},

					iSelectFilterItem: function(sItem) {
						return this.iPressAStandardListItem("Title", sItem);
					},

					iPressOnSortByDocType: function(sItem) {
						return this.iPressAnObjectListItem(undefined, "CorrespondenceFilters-sortlist", "Document Type");
					},

					iCanSeeTheFilterDialog: function() {
						return this.waitFor({
							id: "CorrespondenceFilters", //-dialog",
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

					iCanSeeTheSortDialog: function() {
						return this.waitFor({
							id: "CorrespondenceFilters", //-dialog",
							viewName: undefined,
							check: function(oDialog) {
								return oDialog._dialog.isOpen();
							},
							success: function(oDialog) {
								ok(true, "Filter dialog is open");
							},
							errorMessage: "Filter dialog not found"
						});
					}

				},
				///ASSERTIONS///
				assertions: {
					iShouldSeeTheCorrespondenceList: function() {
						return this.iShouldSeeTheRowRepeater(sMasterView, sRowRepeaterId);
					},

					theListShouldHaveAllEntries: function() {
						return this.theRowRepeaterShouldHaveAllEntries(sMasterView, sRowRepeaterId, "Correspondence");
					},

					theListShouldHaveThirtyFourEntries: function() {
						return this.theRowRepeaterShouldHaveNEntries(sMasterView, sRowRepeaterId, 34);
					},

					theListShouldHaveTwelveEntries: function() {
						return this.theRowRepeaterShouldHaveNEntries(sMasterView, sRowRepeaterId, 12);
					},

					theListShouldHaveSixEntries: function() {
						return this.theRowRepeaterShouldHaveNEntries(sMasterView, sRowRepeaterId, 6);
					},

					theListShouldBeSortedAscendingByDocType: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "DocumentType", false);
					},

					theListShouldBeSortedDescendingByDocType: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "DocumentType", true);
					},

					theListShouldBeSortedAscendingByCreatedOn: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "CreatedOn");
					},

					theListShouldBeSortedDescendingByCreatedOn: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "CreatedOn", true);
					},

					theListShouldBeSortedAscendingByPartnerName: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "PartnerName");
					},

					theListShouldBeSortedAscendingByName: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "PartnerName");
					},

					theListShouldBeSortedDescendingByPartnerName: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "PartnerName", true);
					},

					theItemsWordDoc: function() {
						return this.theRowRepeaterShouldShowOnly(sMasterView, sRowRepeaterId, "MimeType", _sWordMime);
					},

					theItemsDocGroup: function() {
						return this.theRowRepeaterShouldShowOnly(sMasterView, sRowRepeaterId, "DocumentGroup", _sDocGroup);
					}
				}
			}
		});
	});
