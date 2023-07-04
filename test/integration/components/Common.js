sap.ui.define([
		"sap/ui/test/Opa5",
		"sap/ui/test/matchers/AggregationLengthEquals",
		"sap/ui/test/matchers/PropertyStrictEquals"
	],
	function(Opa5, AggregationLengthEquals, PropertyStrictEquals) {
		"use strict";

		var oApplicationStep = jQuery.sap.sjax({
			url: jQuery.sap.getResourcePath("test/service/ApplicationStep", ".json")
		});

		var aSteps = oApplicationStep.data;
		var sSelectedRowClass = "npcSelectedRow";

		// some utility functionality for all Page Objects deriving from it
		return Opa5.extend("test.integration.components.Common", {
			constructor: function(oConfig) {
				Opa5.apply(this, arguments);
				this._oConfig = oConfig;
			},

			_getFrameUrl: function(sHash, sUrlParameters) {
				sHash = sHash || "";
				var sUrl = jQuery.sap.getResourcePath("aklc/cm/index", ".html");

				sUrlParameters = "?" + (sUrlParameters ? sUrlParameters + "&" : "");
				return sUrl + sUrlParameters + sHash;
			},

			iStartTheApp: function(sHash) {
				this.iStartMyAppInAFrame(this._getFrameUrl(sHash));
			},

			iStartStep: function(sStep) {
				var oStep = aSteps.filter(function(oData) {
					return oData.Component === sStep;
				})[0];

				var sHash = "#/process/" + oStep.ApplicationKey + "/step/" + oStep.StepKey;

				if (Opa5.getWindow()) {
					Opa5.getHashChanger().setHash(sHash);
				} else {
					this.iStartTheApp(sHash);
				}

			},

			iStartTheAppWithDelay: function(sHash, iDelay) {
				this.iStartMyAppInAFrame(this._getFrameUrl(sHash, "serverDelay=" + iDelay));
			},

			iLookAtTheScreen: function() {
				return this;
			},

			getMockServer: function() {
				return new Promise(function(success) {
					Opa5.getWindow().sap.ui.require(["test/service/server"],
						function(oMockserver) {
							success(oMockserver.getMockServer());
						});
				});
			},

			createAWaitForAnEntitySet: function(oOptions) {
				var bMockServerAvailable = false,
					aEntitySet;
				return {
					success: function() {
						this.getMockServer().then(function(oMockServer) {
							aEntitySet = oMockServer.getEntitySetData(oOptions.entitySet);
							bMockServerAvailable = true;
						});

						return this.waitFor({
							check: function() {
								return bMockServerAvailable;
							},
							success: function() {
								oOptions.success.call(this, aEntitySet);
							},
							errorMessage: "was not able to retireve the entity set " + oOptions.entitySet
						});
					}
				};
			},

			iPressTheButton: function(sViewName, sPropertyName, sPropertyValue, sName) {
				var bSearchOpenDialogs = !sViewName ? true : false;
				return this.waitFor({
					controlType: "sap.m.Button",
					viewName: sViewName,
					searchOpenDialogs: bSearchOpenDialogs, //static search
					matchers: [new Opa5.matchers.PropertyStrictEquals({
						name: sPropertyName,
						value: sPropertyValue
					})],
					success: function(aButtons) {
						Opa5.getUtils().triggerTouchEvent("tap", aButtons[0].getDomRef());
					},
					errorMessage: "'" + sName + "' button not found."
				});
			},

			iPressTheIconButton: function(sViewName, sName, sIcon) {
				return this.iPressTheButton(sViewName, "icon", sIcon, sName);
			},

			iPressACommonsButton: function(sViewName, sPropertyName, sPropertyValue, sName) {
				if (!sName) {
					sName = sPropertyValue;
				}

				return this.waitFor({
					controlType: "sap.ui.commons.Button",
					viewName: sViewName,
					matchers: [new Opa5.matchers.PropertyStrictEquals({
						name: sPropertyName,
						value: sPropertyValue
					})],
					success: function(aButtons) {
						aButtons[0].$().focus().click();
					},
					errorMessage: "'" + sName + "' button not found."
				});
			},

			iPressAnIcon: function(sViewName, sPropertyValue, sName) {
				if (!sName) {
					sName = sPropertyValue;
				}

				return this.waitFor({
					controlType: "sap.ui.core.Icon",
					viewName: sViewName,
					matchers: [new Opa5.matchers.PropertyStrictEquals({
						name: "src",
						value: sPropertyValue
					})],
					success: function(aIcon) {
						var oIcon = aIcon[0];
						oIcon._bPressFired = false;
						oIcon.$().focus().click().blur();
					},
					errorMessage: "'" + sName + "' Icon not found."
				});
			},

			iShouldSeeTheRowRepeater: function(sViewName, sRowRepeaterId) {
				return this.waitFor({
					id: sRowRepeaterId,
					viewName: sViewName,
					success: function(oList) {
						QUnit.ok(oList, "Found the row repeater");
					},
					errorMessage: "Can't see the " + sRowRepeaterId + " list."
				});
			},

			theRowRepeatedShouldBeSortedByField: function(sViewName, sRowRepeaterId, sField, bDescending) {
				function fnCheckSort(oRowRepeater) {
					var oPreviousValue = null;
					// can reuse for any aggregation binding
					var fnIsOrdered = function(oElement) {
						var oCurrentValue = oElement.getBindingContext().getProperty(sField);
						if (oPreviousValue) {
							var iComparison = oPreviousValue.localeCompare(oCurrentValue);

							if ((bDescending && iComparison < 0) || (!bDescending && iComparison > 0)) {
								return false;
							}
						}
						oPreviousValue = oCurrentValue;
						return true;
					};
					return oRowRepeater.getRows().every(fnIsOrdered);
				}
				return this.waitFor({
					id: sRowRepeaterId,
					viewName: sViewName,
					matchers: [fnCheckSort],
					success: function() {
						QUnit.ok(true, "Row Repeater has been sorted correctly for field '" + sField + "'.");
					},
					errorMessage: "Row Repeater has not been sorted correctly for field '" + sField + "'."
				});
			},

			theCorrectRowRepeaterRowIsSelected: function(sViewName, sRowRepeaterId, sPropertyName, sPropertyValue) {
				var fnGetSelectedRow = function(oRowRepeater) {
					var fnFilter = function(oRow) {
						return oRow.hasStyleClass(sSelectedRowClass);
					};
					return oRowRepeater.getRows().filter(fnFilter);
				};

				return this.waitFor({
					id: sRowRepeaterId,
					viewName: sViewName,
					matchers: [fnGetSelectedRow],
					success: function(aSelectedRows) {
						var oContext = aSelectedRows[0].getBindingContext();
						var sValue = oContext.getProperty(sPropertyName);
						QUnit.strictEqual(sPropertyValue, sValue, "Selected Row has '" + sPropertyName + "'' value '" + sPropertyValue + "'");
					},
					errorMessage: "Cannot find selected row where " + sPropertyName + " value equals " + sPropertyValue
				});
			},

			iPressAStandardListItem: function(sPropertyName, sPropertyValue) {
				return this.waitFor({
					controlType: "sap.m.StandardListItem",
					matchers: [
						new PropertyStrictEquals({
							name: sPropertyName,
							value: sPropertyValue
						})
					],
					success: function(aListItems) {
						aListItems[0].$().trigger("tap");
					},
					errorMessage: "The list item was not found"
				});
			},

			iPressAnObjectListItem: function(sViewName, sListId, sObjectTitle) {
				var oObjectListItem = null;

				return this.waitFor({
					id: sListId,
					viewName: sViewName,
					check: function(oList) {
						return oList.getItems().some(function(oItem) {
							if (oItem.getTitle() === sObjectTitle) {
								oObjectListItem = oItem;
								return true;
							}
							return false;
						});
					},
					success: function(oList) {
						oObjectListItem.$().trigger("tap");
						ok(oList, "Pressed ObjectListItem '" + sObjectTitle + "' in list '" + sListId + "' in view '" + sViewName + "'.");
					},
					errorMessage: "List '" + sListId + "' in view '" + sViewName + "' does not contain an ObjectListItem with title '" + sObjectTitle + "'"
				});
			},

			iPressARowRepeaterItem: function(sViewName, sRowRepeaterId, sPropertyName, sPropertyValue) {
				var oRowItem = null;

				return this.waitFor({
					id: sRowRepeaterId,
					viewName: sViewName,
					check: function(oRowRepeater) {
						// find rows where value matches
						return oRowRepeater.getRows().some(function(oRow) {
							if (oRow.getBindingContext().getProperty(sPropertyName) === sPropertyValue) {
								oRowItem = oRow;
								return true;
							}
							return false;
						});
					},
					success: function() {
						oRowItem.$().trigger("click");
						ok(oRowItem, "Pressed Row '" + sPropertyValue + "' in list '" + sRowRepeaterId);
					},
					errorMessage: "List '" + sRowRepeaterId + "' in view '" + sViewName + "' does not contain a value '" + sPropertyValue + "'"
				});
			},

			iSeeFieldWithProperty: function(sViewName, sId, sPropertyName, sPropertyValue) {
				return this.waitFor({
					viewName: sViewName,
					id: sId,
					matchers: [
						new PropertyStrictEquals({
							name: sPropertyName,
							value: sPropertyValue
						})
					],
					success: function() {
						ok(true, "Field '" + sId + "' property '" + sPropertyName + "' has value " + sPropertyValue);
					},
					errorMessage: "Field '" + sId + "' not found"
				});
			},

			iSelectComboBoxItem: function(sViewName, sId, sText) {
				var oComboBoxItem = null;
				// find the combobox and trigger open
				this.waitFor({
					viewName: sViewName,
					id: sId,
					success: function(oComboBox) {
						Opa5.getUtils().triggerTouchEvent("tap", oComboBox.getOpenArea());
					},
					errorMessage: "oComboBox '" + sId + "' in view " + sViewName + " does not contain an item with text '" + sText + "'"
				});

				return this.waitFor({
					viewName: sViewName,
					id: sId,
					// check open and find the item with corresponding value
					check: function(oComboBox) {
						if (!oComboBox.isOpen()) {
							return false;
						}
						return oComboBox.getPicker().getContent()[0].getItems().some(function(oItem) {
							if (oItem.getTitle().indexOf(sText) > -1) {
								oComboBoxItem = oItem;
								return true;
							}
							return false;
						});
					},
					success: function() {
						// select the value
						oComboBoxItem.$().tap();
						ok(oComboBoxItem, "Selected ComboBox item '" + sText + "'.");
					}
				});
			},

			theRowRepeaterShouldHaveNEntries: function(sViewName, sRowRepeaterId, iEntries) {
				return this.waitFor({
					id: sRowRepeaterId,
					viewName: sViewName,
					matchers: new AggregationLengthEquals({
						name: "rows",
						length: iEntries
					}),
					success: function() {
						QUnit.ok(true, "The row repeater has " + iEntries + " entries");
					},
					errorMessage: "Row Repeater does not have all entries."
				});
			},

			theRowRepeaterShouldHaveAllEntries: function(sViewName, sRowRepeaterId, sEntitySet) {
				var aAllEntities;

				// retrieve all Objects to be able to check for the total amount
				this.waitFor(this.createAWaitForAnEntitySet({
					entitySet: sEntitySet,
					success: function(aEntityData) {
						aAllEntities = aEntityData;
					}
				}));

				return this.waitFor({
					id: sRowRepeaterId,
					viewName: sViewName,
					matchers: function(oRowRepeater) {
						return new AggregationLengthEquals({
							name: "rows",
							length: aAllEntities.length
						}).isMatching(oRowRepeater);
					},
					success: function(oRowRepeater) {
						strictEqual(oRowRepeater.getRows().length, aAllEntities.length, "The Row Repeater has " + aAllEntities.length + " rows");
					},
					errorMessage: "Row Repeater does not have all entries."
				});
			},

			theRowRepeaterFirstRow: function(sViewName, sId, sPropertyName, sPropertyValue) {
				return this.waitFor({
					id: sId,
					viewName: sViewName,
					success: function(oRowRepeater) {
						var oFirstItem = oRowRepeater.getRows()[0];
						var oContext = oFirstItem.getBindingContext();
						strictEqual(oContext.getProperty(sPropertyName), sPropertyValue, "The row has the correct " + sPropertyName);
					},
					errorMessage: "The row cannot be found."
				});
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
						ok(true, "The list contains values where '" + sPropertyName + "'' equals '" + sPropertyValue + "'.");
					},
					errorMessage: "The List contains invalid entries."
				});
			},

			iShouldSeeTheDefaultHash: function() {
				return this.waitFor({
					success: function() {
						var oHashChanger = Opa5.getHashChanger(),
							sHash = oHashChanger.getHash();
						strictEqual(sHash, "process/P1/step/Default", "The Hash should be empty");
					},
					errorMessage: "The Hash is not Correct!"
				});
			},

			iPressNextAction: function() {
				return this.waitFor({
					id: "next",
					success: function(oButton) {
						oButton.$().trigger("click");
					},
					errorMessage: "Did not find the next button"
				});
			},

			iPressPreviousAction: function() {
				return this.waitFor({
					id: "previous",
					success: function(oButton) {
						oButton.$().trigger("click");
					},
					errorMessage: "Did not find the previous button"
				});
			},

			checkMandatoryStatus: function(sDetailView, sId, sSuccessMsg, sErrorMsg) {
				return this.waitFor({
					id: sId,
					viewName: sDetailView,
					check: function(oInput) {
						if (oInput.getValueState() === 'Error') {
							return true;
						} else {
							return false;
						}
					},
					success: function(oInput) {
						ok(true, sSuccessMsg);
					},
					errorNessage: sErrorMsg
				});
			},

			iTapObjectIdentifier: function(sText) {
				return this.waitFor({
					controlType: "sap.m.ObjectIdentifier",
					searchOpenDialogs: true, //static search
					matchers: [new Opa5.matchers.PropertyStrictEquals({
						name: "text",
						value: sText
					})],
					success: function(aText) {
						aText[0].$().tap();
					},
					errorMessage: sText + " not found."
				});
			},

			iClickInputValueHelp: function(sViewName, sId) {
				this.waitFor({
					id: sId,
					viewName: sViewName,
					success: function(oValueHelpIcon) {
						oValueHelpIcon._bPressFired = false;
						oValueHelpIcon.$().focus().click().blur();
					},
					errorMessage: "Value help icon not found"
				});
			}
		});
	});
