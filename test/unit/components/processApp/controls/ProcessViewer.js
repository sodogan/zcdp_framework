sap.ui.define(
	[
		"aklc/cm/components/processApp/controls/ProcessViewer",
		"aklc/cm/components/processApp/controls/NavigationItem",
		"sap/ui/model/json/JSONModel",
		"sap/ui/core/message/Message",
		"sap/ui/commons/Button",
		"sap/ui/ux3/ThingGroup",
		"sap/ui/commons/RowRepeater",
		"sap/ui/commons/layout/MatrixLayout",
		"sap/ui/commons/layout/MatrixLayoutRow",
		"sap/ui/commons/layout/MatrixLayoutCell",
		"sap/ui/commons/Label",
		"aklc/cm/components/processApp/controls/VerticalNavigationBar",
		"sap/ui/thirdparty/sinon",
	    "sap/ui/thirdparty/sinon-qunit"
	],
	function(ProcessViewer, NavigationItem, JSONModel, Message, Button, ThingGroup, RowRepeater, MatrixLayout, MatrixLayoutRow, MatrixLayoutCell, Label) {
		"use strict";
		jQuery.sap.includeStyleSheet("../../src/components/processApp/css/ThreePanelViewer.css", "ThreePanelViewer");
		jQuery.sap.includeStyleSheet("../../src/components/processApp/css/VerticalNavigationBar.css", "VerticalNavigationBar");

		sinon.config.useFakeTimers = false;

		var oNavBarData = [{
			key: "overview",
			text: "Overview",
			icon: "sap-icon://overlay"
		}, {
			key: "contacts",
			text: "Contacts",
			icon: "sap-icon://citizen-connect"
		}, {
			key: "items",
			text: "Items",
			icon: "sap-icon://activity-items"
		}, {
			key: "related_documents",
			text: "Related Documents",
			icon: "sap-icon://documents"
		}, {
			key: "addresses",
			text: "Addresses",
			icon: "sap-icon://address-book"
		}, {
			key: "analytics",
			text: "Analytics",
			icon: "sap-icon://pipeline-analysis"
		}];

		var oNavBarItemTemplate = new NavigationItem({
			key: "{key}",
			text: "{text}",
			icon: "{icon}"
		});

		/*********************************************/

		var oContactsData = [{
			title: "Contacts",
			colspan: true,
			type: 2,
			content: [{
				name: "Jag, Mick",
				phone: "+1 (692) 742-2633"
			}, {
				name: "Bradford, John",
				phone: "+1 (635) 457-2875"
			}, {
				name: "Stiff, Clark",
				phone: "+1 (703) 515-8363"
			}]
		}];

		var oOverviewData = oContactsData;

		var oFacet = {};

		var oFacetContentTemplate = new ThingGroup({
			title: "{title}",
			colspan: "{colspan}",
			content: new RowRepeater({
				rows: {
					path: "content",
					factory: function(sId, oContext) {
						return new MatrixLayout({
							rows: [
								new MatrixLayoutRow({
									cells: new MatrixLayoutCell({
										content: new Label({
											text: "{name}"
										})
									})
								}),
								new MatrixLayoutRow({
									cells: new MatrixLayoutCell({
										content: new Label({
											text: "{phone}"
										})
									})
								})
							]
						});
					}
				}
			})
		});
		/******************************************************/
		var oData = {
			sidebarWidth: "160px",
			facets: oNavBarData,
			facetContent: oOverviewData
		};

		var oModel = new JSONModel();
		oModel.setData(oData);

		var oProcessViewer = new ProcessViewer({
			sidebarWidth: "{/sidebarWidth}",
			facets: {
				path: "/facets",
				template: oNavBarItemTemplate
			},
			facetContent: {
				path: "/facetContent",
				template: oFacetContentTemplate
			},
			facetSelected: facetSelectedEventHandler
		});

		//event handler for facet event, action and standard action events, for close and open event
		function facetSelectedEventHandler(oEvent) {

			ok(true, "facet select event handler has been executed."); // this test tests by just being counted in the respective test
			var sId = oEvent.getParameter("id");
			var sKey = oEvent.getParameter("key");
			equal(sKey, oFacet.key, oFacet.text + " Facet should be selected");
			var oTG1 = new sap.ui.ux3.ThingGroup({
				title: "Block1"
			});
			oTG1.addContent(new Button(oProcessViewer.getId() + sKey + "FacetButton", {
				text: sKey
			}));
			oProcessViewer.destroyFacetContent().addFacetContent(oTG1);
			oProcessViewer.setSelectedFacet(sId);
		}

		oProcessViewer.setModel(oModel);
		oProcessViewer.setActiveSteps(5);
		oProcessViewer.setSelectedFacet(oProcessViewer.getFacets()[0]);

		QUnit.module("ProcessViewer", {
			setup: function() {
				oProcessViewer.placeAt("qunit-fixture");
				sap.ui.getCore().applyChanges();
			},
			teardown: function() {}
		});

		QUnit.test("Control exists", function() {
			var oDomRef = jQuery.sap.domById(oProcessViewer.getId());
			ok(oDomRef, "Rendered ProcessViewer should exist in the page");
			equal(oDomRef.className, "sapUiUx3TV", "Rendered ProcessViewer should have the class 'sapUiUx3TV'");
		});

		//NavBar
		QUnit.test("Vertical navigation exists", function() {
			var oNavBar = jQuery.sap.domById(oProcessViewer.getId() + "-navigation");
			ok(oNavBar, "Vertical navigation should exist in the page");
			equal(oNavBar.className, "sapSuiteTvNav", "Rendered vertical navigation bar should have the class 'sapSuiteTvNav'");
		});

		QUnit.test("Navbar Items", function() {
			//number of navigation items must be the same as number of facets
			var facets = oProcessViewer.getFacets();
			equal(facets.length, oNavBarData.length, "Number of facets equals model data");
			// var $facets = jQuery(".sapSuiteTvNavBarList");
			for (var i = 0; i < facets.length; i++) {
				ok(jQuery.sap.domById(facets[i].sId), "Rendered ThingViewer Item " + facets[i].sId + " should exist in the page");
			}
		});

		//ActionBar
		QUnit.test("Toolbar", function() {
			var oActionBar = oProcessViewer.getActionBar();
			ok(oActionBar, "ActionBar should exist");
			ok(jQuery(".sapUiUx3ActionBar")[0], "ActionBar rendering ok");
			oProcessViewer.setActionBar();
			sap.ui.getCore().applyChanges();
			ok(!jQuery(".sapUiUx3ActionBar")[0], "ActionBar should be destroyed");
			oProcessViewer.setActionBar(oActionBar);
		});

		//Action check next and previous
		QUnit.test("Action - Next", function() {
			var aButtons = oProcessViewer.getActionBar().getAggregation("_businessActionButtons");
			var oPreviousBtn, oNextBtn;

			aButtons.forEach(function(oButton) {
				switch (oButton.getId()) {
					case "previous":
						oPreviousBtn = oButton;
						break;
					case "next":
						oNextBtn = oButton;
						break;
					default:
				}
			});

			ok(!oPreviousBtn.getVisible(), "Previous Button should not be visible");
			ok(oNextBtn.getVisible(), "Next Button should  be visible");

			ok(!jQuery.sap.domById(oPreviousBtn.getId()), "Previous Button was not rendered");
			ok(jQuery.sap.domById(oNextBtn.getId()), "Next Button was rendered");

			equal(oPreviousBtn.getText(), "", "first step no previous step");
			equal(oNextBtn.getText(), oNavBarData[1].text, "she be the second entries text");

		});

		QUnit.asyncTest("Reject Event", function() {
			expect(2);
			var aButtons = oProcessViewer.getActionBar().getAggregation("_businessActionButtons");
			var oRejectBtn, oCancelBtn, oDialog;


			aButtons.forEach(function(oButton) {
				switch (oButton.getId()) {
					case "reject":
						oRejectBtn = oButton;
						break;
					default:
				}
			});


			qutils.triggerMouseEvent(oRejectBtn.getDomRef(), "click", 1, 1, 1, 1);
			setTimeout(
				function() {
					oDialog = oProcessViewer.oDialog; //TODO what happens if multi dialogs?
					ok(oDialog.isOpen(), true);
					oCancelBtn = oDialog.getButtons()[1];
					qutils.triggerMouseEvent(oCancelBtn.getDomRef(), "click", 1, 1, 1, 1);
					setTimeout(
						function() {
							ok(oDialog.isOpen(), false);
							QUnit.start();
						}, 300);
				}, 300);

		});

		QUnit.test("Facet content exists", function() {
			var oFacetContent = jQuery.sap.domById(oProcessViewer.getId() + "-facetContent");
			ok(oFacetContent, "Facet content should exist in the page");
			equal(oFacetContent.className, "sapSuiteTvFacet", "Rendered facet content should have the class 'sapSuiteTvFacet'");

		});

		QUnit.asyncTest("FacetSelected Events", function() {
			expect(13);
			oFacet = oNavBarData[4];
			var oItem = oProcessViewer.getFacets().filter(function(o) {
				return o.getKey() === oFacet.key;
			})[0];
			qutils.triggerMouseEvent(jQuery.sap.domById(oItem.sId), "click", 1, 1, 1, 1);
			setTimeout(
				function() {
					ok(jQuery.sap.domById(oProcessViewer.getId() + oFacet.key + "FacetButton"), "Rendered Facet Content for facet " + oFacet.key + " should exist in the page");
					var iIndex = oNavBarData.indexOf(oFacet);
					var sPreviousTxt = oNavBarData[iIndex - 1].text;
					var sNextTxt = oNavBarData[iIndex + 1].text;
					var aButtons = oProcessViewer.getActionBar().getAggregation("_businessActionButtons");
					var oPreviousBtn, oNextBtn;

					aButtons.forEach(function(oButton) {
						switch (oButton.getId()) {
							case "previous":
								oPreviousBtn = oButton;
								break;
							case "next":
								oNextBtn = oButton;
								break;
							default:
						}
					});

					ok(oPreviousBtn.getVisible(), "Previous Button should be visible");
					ok(oNextBtn.getVisible(), "Next Button should  be visible");
					equal(oPreviousBtn.getText(), sPreviousTxt, "Previous button text should be" + sPreviousTxt);
					equal(oNextBtn.getText(), sNextTxt, "Previous button text should be" + sNextTxt);

					oFacet = oNavBarData[iIndex + 1];
					qutils.triggerMouseEvent(jQuery.sap.domById(oNextBtn.sId), "click", 1, 1, 1, 1);
					setTimeout(
						function() {
							ok(jQuery.sap.domById(oProcessViewer.getId() + oFacet.key + "FacetButton"), "Rendered Facet Content for facet " + oFacet.key + " should exist in the page");
							iIndex = oNavBarData.indexOf(oFacet);
							oFacet = oNavBarData[iIndex - 1];
							qutils.triggerMouseEvent(jQuery.sap.domById(oPreviousBtn.sId), "click", 1, 1, 1, 1);
							setTimeout(function() {
								ok(jQuery.sap.domById(oProcessViewer.getId() + oFacet.key + "FacetButton"), "Rendered Facet Content for facet " + oFacet.key + " should exist in the page");
								QUnit.start();
							}, 0);
						}, 0);
				}, 0);
		});


		QUnit.test("Add header content", function() {
			expect(1);
			var oThingGroup = new ThingGroup({
				content: [new Button(oProcessViewer.getId() + "HeaderButton", {
					text: "test"
				})]
			});

			oProcessViewer.addHeaderContent(oThingGroup);
			sap.ui.getCore().applyChanges();

			ok(jQuery.sap.domById(oProcessViewer.getId() + "HeaderButton"), "Rendered header content should exist in the page");
		});


		QUnit.asyncTest("Trigger Message Manager", function() {
			var oMessagesButton = oProcessViewer._oActionMessages;
			var oMessageManager = sap.ui.getCore().getMessageManager();
			oMessagesButton.placeAt("qunit-fixture");

			var oMessage = new Message({
				target: "/facets/1/key",
				message: "test message",
				processor: oModel,
				type: sap.ui.core.MessageType.Error
			});
			oMessageManager.addMessages(oMessage);
			sap.ui.getCore().applyChanges();

			ok(oMessagesButton.getVisible(), "Messages button visible");
			ok(oMessagesButton.getDomRef(), "Messages button on screen");

			// arrange
			var fnBeforeOpenSpy = sinon.spy(sap.m.MessagePopover.prototype, "fireBeforeOpen");

			//Act
			qutils.triggerMouseEvent(jQuery.sap.domById(oMessagesButton.sId), "click", 1, 1, 1, 1);

			setTimeout(function() {
				// assertions
				strictEqual(fnBeforeOpenSpy.callCount, 1, "The message popover was opened");
				// start the test
				start();
			}, 500);
		});

		QUnit.asyncTest("Destroy and remove control", function() {
			expect(1);

			setTimeout(
				function() {
					oProcessViewer.destroy();
					var oDomRef = jQuery.sap.domById(oProcessViewer.getId());
					ok(!oDomRef, "Rendered ProcessViewer should not exist in the page after destruction");
					QUnit.start();
				}, 1000);

		});

	});
