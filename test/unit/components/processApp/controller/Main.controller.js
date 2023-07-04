sap.ui.define(
	[
		"aklc/cm/components/processApp/controller/Main.controller",
		"sap/ui/thirdparty/sinon",
		"sap/ui/thirdparty/sinon-qunit"
	],
	function(MainController) {
		"use strict";
		QUnit.module("initialization");

		QUnit.test("dummy test", function() {
			// Assert
			QUnit.assert.strictEqual(1, 1, "dummy test");
		});
	}
);
