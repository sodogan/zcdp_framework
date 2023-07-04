sap.ui.define([
	"sap/ui/core/util/MockServer"
], function(MockServer) {
	"use strict";
	var oMockServer;
	var _sServiceUrl = "/sap/opu/odata/sap/ZCDP_PROCESS_APP_SRV/",
		_sModulePath = "test.service";


	return {


		/**
		 * Initializes the mock server. You can configure the delay with the URL parameter "serverDelay"
		 * The local mock data in this folder is returned instead of the real data for testing.
		 *
		 * @public
		 */
		init: function() {
			var oUriParameters = jQuery.sap.getUriParameters(),
				sPath = jQuery.sap.getModulePath(_sModulePath);

			oMockServer = new MockServer({
				rootUri: _sServiceUrl
			});

			// configure mock server with a delay of 1s
			MockServer.config({
				autoRespond: true,
				autoRespondAfter: (oUriParameters.get("serverDelay") || 0)
			});

			oMockServer.simulate(sPath + "/metadata.xml", sPath);
			oMockServer.setRequests(oMockServer.getRequests().concat(this.getMockRequests()));
			oMockServer.start();

			jQuery.sap.log.info("Running the app with mock data");
		},

		getSubSteps: function() {
			return {
				method: "GET",
				path: new RegExp("SubSteps?.*expand.*"),
				response: function(oXhr) {
					jQuery.sap.log.info("MockRequest: getSubSteps expand");
				}
			};
		},

		mergeSubSteps: function() {
			return {
				method: "MERGE",
				path: new RegExp("SubSteps(.*)"),
				response: function(oXhr, sUrl) {
					var oData = JSON.parse(oXhr.requestBody);
					jQuery.sap.log.info("MockRequest: mergeSubSteps " + oData.SubStep + " :" +
						oData.Label);

				}
			};
		},

		mergeFormData: function() {
			return {
				method: "MERGE",
				path: new RegExp("FormData(.*)"),
				response: function(oXhr) {
					var oData = JSON.parse(oXhr.requestBody);
					jQuery.sap.log.info("MockRequest: mergeFormData " + oData.Attribute);

					switch (oData.Attribute) {
						case "BUTTONS2":
							this.showHiddenSubStep(oData);
							break;
						case "CS_NEW":
							this.showHiddenAttribute(oData);
							break;
						default:
							break;
					}
				}.bind(this)
			};
		},

		showHiddenAttribute: function(oData) {
			//scenario toggle substep 2 based on result
			var sTarget = "FormData";
			var bVisible = oData.Boolean;

			var sKeyString = oMockServer._createKeysString(oMockServer._mEntitySets[sTarget], {
				"StepKey": "MDA1MDU2QkMwOUJEMUVENTk2RTZENDMxRkZGMzE0MjAsREVU",
				"SubStep": "00003",
				"Attribute": "BATHROOMS"
			});
			var sUrl = _sServiceUrl + sTarget + "(" + sKeyString + ")";

			var oResponseFormDataUpdate = jQuery.sap.sjax({
				url: sUrl,
				type: "PATCH",
				data: JSON.stringify({
					Visible: bVisible
				})
			});

			if (!oResponseFormDataUpdate.success) {
				jQuery.sap.log.error("FormData update failed");
			}
		},

		showHiddenSubStep: function(oData) {
			//scenario toggle substep 2 based on result
			var sTarget = "SubSteps";
			var bVisible = oData.String === "YES" ? true : false;

			var sKeyString = oMockServer._createKeysString(oMockServer._mEntitySets[sTarget], {
				"StepKey": "MDA1MDU2QkMwOUJEMUVENTk2RTZENDMxRkZGMzE0MjAsREVU",
				"SubStep": "00002"
			});

			var sUrl = _sServiceUrl + sTarget + "(" + sKeyString + ")";

			var oResponseSubStepUpdate = jQuery.sap.sjax({
				url: sUrl,
				type: "PATCH",
				data: JSON.stringify({
					Visible: bVisible
				})
			});

			if (!oResponseSubStepUpdate.success) {
				jQuery.sap.log.error("SubStep update failed");
			}
		},

		getMockRequests: function() {
			return [
				this.getSubSteps(),
				this.mergeSubSteps(),
				this.mergeFormData()
			];
		},

		/**
		 * @public returns the mockserver of the app, should be used in integration tests
		 * @returns {sap.ui.core.util.MockServer} the mockserver instance
		 */
		getMockServer: function() {
			return oMockServer;
		}
	};
});
