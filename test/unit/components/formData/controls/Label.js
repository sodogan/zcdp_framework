sap.ui.define(
	[
		"aklc/cm/components/formData/controls/Label"
	],
	function(Label) {
		"use strict";


		QUnit.module("Label");

		test("test label", function() {
			// Arrange
			var sText = "test";
			var oProperties = {
				text: sText,
				required: true,
				requiredAtBegin: true
			};

			// System under Test
			var oLabel = new Label(oProperties);
			oLabel.placeAt("qunit-fixture");
			sap.ui.getCore().applyChanges();

			// Act

			// Assert
			strictEqual(oLabel.getText(), sText, "label.getText() returns wrong result");

			// Cleanup
			oLabel.destroy();
		});


	});
