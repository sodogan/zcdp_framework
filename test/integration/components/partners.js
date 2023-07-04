sap.ui.require([
		"sap/ui/test/Opa5",
		"test/integration/components/Common"
	],
	function(Opa5, Common) {
		"use strict";
		var sBaseViewPath = "aklc.cm.components.partners.view.";
		var sMasterView = sBaseViewPath + "Master";
		var sDetailView = sBaseViewPath + "Detail";

		var sRowRepeaterId = "parties";

		var sSoldToParty = "Sold-to Party";
		var sServiceEmployeeGroup = "Service Employee Group";
		var sOrewa = "Orewa";
		var sOrewaProcessingSupport = "Orewa Processing Support";

		Opa5.createPageObjects({
			onPartnersStep: {
				baseClass: Common,
				///ACTIONS///
				actions: {
					iSelectSoldToPartyRow: function() {
						return this.iPressARowRepeaterItem(sMasterView, sRowRepeaterId, "PartnerFunctionText", sSoldToParty);
					},

					iSeeInputFieldsNotEditable: function() {
						this.iSeeFieldWithProperty(sDetailView, "partnerFunctionText", "editable", false);
						this.iSeeFieldWithProperty(sDetailView, "partnerSearch", "editable", false);
						this.iSeeFieldWithProperty(sDetailView, "validFrom", "editable", false);
						return this;
					},

					iSortTheListOnFirstName: function() {
						return this.iPressACommonsButton(sMasterView, "text", "First Name");
					},

					iSortTheListOnLastName: function() {
						return this.iPressACommonsButton(sMasterView, "text", "Last Name");
					},

					iSortTheListOnPartnerType: function() {
						return this.iPressACommonsButton(sMasterView, "text", "Partner Type");
					},

					iFilterTheListAll: function() {
						return this.iPressACommonsButton(sMasterView, "text", "All");
					},

					iFilterTheListActive: function() {
						return this.iPressACommonsButton(sMasterView, "text", "Active");
					},

					iFilterTheListHistoric: function() {
						return this.iPressACommonsButton(sMasterView, "text", "Historic");
					},

					iPressThePlusIcon: function() {
						return this.iPressTheIconButton(sMasterView, "Plus", "sap-icon://add");
					},

					iSelectServiceEmployeeGroupPartnerFunction: function() {
						this.iClickInputValueHelp(sDetailView, "partnerFunctionText__vhi");
						this.iTapObjectIdentifier(sServiceEmployeeGroup);
						return this;
					},

					iSelectOrewaOrewaProcessingSupportPartner: function() {
						this.iClickInputValueHelp(sDetailView, "partnerSearch__vhi");
						this.iTapObjectIdentifier(sOrewa + " " + sOrewaProcessingSupport);
						return this;
					},

					iPressSave: function() {
						return this.iPressACommonsButton(sDetailView, "text", "Add");
					}

				},

				///ASSERTIONS///
				assertions: {
					iShouldSeeThePartnersList: function() {
						return this.iShouldSeeTheRowRepeater(sMasterView, sRowRepeaterId);
					},

					theListShouldHaveAllEntries: function() {
						return this.theListShouldHaveFourEntries();
						// return this.theRowRepeaterShouldHaveAllEntries(sMasterView, sRowRepeaterId, "AssignedPartners");
					},

					theSoldToPartyRowShouldBeHighLighted: function() {
						return this.theCorrectRowRepeaterRowIsSelected(sMasterView, sRowRepeaterId, "PartnerFunctionText", sSoldToParty);
					},

					theDetailsShouldShowSoldToParty: function() {
						return this.waitFor({
							id: "partnerFunctionText",
							viewName: sDetailView,
							success: function(oInput) {
								var sValue = oInput.getValue();
								ok(sValue.indexOf(sSoldToParty) > -1, "The Details View shows the correct Partner Function '" + sValue + "'");
							},
							errorMessage: "The row cannot be found."
						});
					},

					theListShouldBeSortedAscendingByFirstName: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "FirstName");
					},

					theListShouldBeSortedDescendingByFirstName: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "FirstName", true);
					},

					theListShouldBeSortedAscendingByLastName: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "LastName");
					},

					theListShouldBeSortedDescendingByLastName: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "LastName", true);
					},

					theListShouldBeSortedAscendingByPartnerType: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "PartnerFunctionText");
					},

					theListShouldBeSortedDescendingByPartnerType: function() {
						return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "PartnerFunctionText", true);
					},

					theListShouldHaveFourEntries: function() {
						return this.theRowRepeaterShouldHaveNEntries(sMasterView, sRowRepeaterId, 4);
					},

					theListShouldHaveTwoEntries: function() {
						return this.theRowRepeaterShouldHaveNEntries(sMasterView, sRowRepeaterId, 2);
					},

					theListShouldShowActiveRecords: function() {
						return this.theRowRepeaterShouldShowOnly(sMasterView, sRowRepeaterId, "ActiveFilter", "X");
					},

					theListShouldShowHistoricRecords: function() {
						return this.theRowRepeaterShouldShowOnly(sMasterView, sRowRepeaterId, "ActiveFilter", "");
					},

					theRowRepeaterShouldShowOnly: function(sViewName, sId, sPropertyName, sPropertyValue) {
						return this.waitFor({
							id: sId,
							viewName: sViewName,
							check: function(oRowRepeater) {
								return oRowRepeater.getRows().every(function(oRow) {
									var oContext = oRow.getBindingContext();
									return oContext.getProperty(sPropertyName) === sPropertyValue;
								});
							},
							success: function(oRowRepeater) {
								ok(true, "The list contains values where " + sPropertyName + " equals " + sPropertyValue);
							},
							errorMessage: "The List contains invalid entries."
						});
					},

					theListShouldHaveThreeEntries: function() {
						return this.theRowRepeaterShouldHaveNEntries(sMasterView, sRowRepeaterId, 3);
					},

					theNewServiceEmployeeGroupPartnerIsInRowRepeater: function() {
						return this.waitFor({
							id: sRowRepeaterId,
							viewName: sMasterView,
							check: function(oRowRepeater) {
								return oRowRepeater.getRows().some(function(oRow) {
									var oData = oRow.getBindingContext().getObject();
									return ((oData.PartnerFunctionText === sServiceEmployeeGroup) && (oData.FirstName === sOrewa) && (oData.LastName === sOrewaProcessingSupport));
								});
							},
							success: function(oRowRepeater) {
								ok(true, "PartnerFunctionText equals " + sServiceEmployeeGroup);
								ok(true, "First Name equals" + sOrewa);
								ok(true, "LastName equals" + sOrewaProcessingSupport);
							},
							errorMessage: "The List contains invalid entries."
						});

					}

				}
			}
		});
	});
