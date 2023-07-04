sap.ui.require([
		"sap/ui/test/Opa5",
		"test/integration/components/Common"
	],
	function(Opa5, Common) {
		"use strict";

		var sViewName = "aklc.cm.components.processApp.view.Main",
			sAppControl = "ProcessViewer";

		Opa5.createPageObjects({
			onTheAppPage: {
				baseClass: Common,
				///ACTIONS///
				actions: {
					iWaitUntilTheBusyIndicatorIsGone: function() {
						return this.waitFor({
							id: sAppControl,
							viewName: sViewName,
							// inline-matcher directly as function
							matchers: function(oRootView) {
								// we set the view busy, so we need to query the parent of the app
								return oRootView.getParent().getBusy() === false;
							},
							success: function() {
								QUnit.ok(true, "The app is not busy busy anymore");
							},
							errorMessage: "The app is still busy."
						});
					},

					iPressOnNavBarIcon: function() {
						return this.waitFor({
							viewName: sViewName,
							controlType: "aklc.cm.components.processApp.controls.NavigationItem",
							matchers: new sap.ui.test.matchers.PropertyStrictEquals({
								name: "icon",
								value: "sap-icon://company-view"
							}),
							success: function(aItems) {
								aItems[0].$().trigger("click");
							},
							errorMessage: "Did not find the icon"
						});
					}
				},
				///ASSERTIONS///
				assertions: {
					iShouldSeeTheProcessViewer: function() {
						return this.waitFor({
							id: sAppControl,
							viewName: sViewName,
							success: function(oProcessViewer) {
								QUnit.ok(oProcessViewer, "Found the Process Viewer.");
							},
							errorMessage: "cannot see process viewer"
						});
					},

					iShouldSeeTheBusyIndicator: function() {
						return this.waitFor({
							id: sAppControl,
							viewName: sViewName,
							success: function(oRootView) {
								// we set the view busy, so we need to query the parent of the app
								QUnit.ok(oRootView.getParent().getBusy(), "The app is busy");
							},
							errorMessage: "The app is not busy."
						});
					},

					iShouldBeOnProcessStep: function(sProcess, sStep) {
						return this.waitFor({
							success: function() {
								var oHashChanger = Opa5.getHashChanger(),
									sHash = oHashChanger.getHash(),
									aSplit = sHash.split("/");

								QUnit.strictEqual(aSplit[1], sProcess, "The Process is correct");
								QUnit.strictEqual(aSplit[3], sStep, "The Step is correct");
							},
							errorMessage: "The Hash is not Correct!"
						});
					}
				}
			}
		});
	});
