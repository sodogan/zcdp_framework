sap.ui.define(
	[
		"aklc/cm/components/processApp/controls/StatutoryClock"
	],
	function(StatutoryClock) {
		"use strict";



		QUnit.module("Statutory Clock");

		asyncTest("test clock render", function() {
			expect(2);

			// Arrange
			var oData = {
				clockColour: "#FF0000",
				daysCompleted: 0,
				daysRemaining: 20,
				clockText1: "0",
				clockText2: "stat days"
			};

			// System under Test
			var oClock = new StatutoryClock(oData);
			oClock.placeAt("qunit-fixture");
			sap.ui.getCore().applyChanges();

			// Assert
			ok(jQuery.sap.domById(oClock.getId()), "Clock is rendered");

			// Act
			oClock.setDaysCompleted(10);
			sap.ui.getCore().applyChanges();
			setTimeout(function() {

				// Assert
				equal(oClock.getDaysCompleted(), 10, "setter works");
				QUnit.start();
				// Cleanup
				oClock.destroy();
			}, 0);

		});


	});
