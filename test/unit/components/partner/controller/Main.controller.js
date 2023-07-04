sap.ui.define(
	[
		"aklc/cm/components/partner/controller/Main.controller",
		"sap/ui/thirdparty/sinon",
		"sap/ui/thirdparty/sinon-qunit"
	],
	function(MainController) {
		"use strict";
		QUnit.module("partner validation");

		QUnit.test("calculate todo data", function() {
			var PartnerFunctions = [
				{
					"PartnerFunctionCode": 11,
					"Description": "Owner",
					"CountLow": 1,
					"CountHigh": 1
				}, {
					"PartnerFunctionCode": 12,
					"Description": "Applicant",
					"CountLow": 1,
					"CountHigh": 2
				}, {
					"PartnerFunctionCode": 13,
					"Description": "Agent",
					"CountLow": 0,
					"CountHigh": 1
				}
			];
			var AssignedPartners = [
				{
					"PartnerFunctionCode": 11,
					"Unassigned": false
				}, {
					"PartnerFunctionCode": 11,
					"Unassigned": false
				}
			];
			var todoData = MainController.prototype.calculateTodoData(PartnerFunctions, AssignedPartners);
			QUnit.assert.strictEqual(todoData.toFill.length, 1, "one toFill data");
			QUnit.assert.strictEqual(todoData.exceeded.length, 1, "one exceeded data");
		});
	}
);
