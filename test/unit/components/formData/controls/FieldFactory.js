sap.ui.define(
	[
		"aklc/cm/components/formData/controls/FieldFactory",
		"aklc/cm/components/formData/controls/ControlTypes",
		"sap/ui/model/odata/v2/ODataModel",
		"sap/ui/core/util/MockServer",
		"sap/ui/model/resource/ResourceModel",
		"sap/ui/thirdparty/sinon",
		"sap/ui/thirdparty/sinon-qunit"
	],
	function(FieldFactory, ControlTypes, ODataModel, MockServer, ResourceModel, sinon) {
		"use strict";

		if (sinon === undefined) {
			sinon = window.sinon;
		}

		sinon.config.useFakeTimers = false;
		// QUnit.config.autostart = false;
		// sap.ui.test.qunit.delayTestStart();


		var oi18nModel = new sap.ui.model.resource.ResourceModel({
			bundleUrl: jQuery.sap.getModulePath("aklc.cm.components.formData.i18n") + "/i18n.properties"
		});

		var sServiceUri = "/sap/opu/odata/sap/ZCDP_PROCESS_APP_SRV/";
		var sDataRootPath = jQuery.sap.getModulePath("test.service.unit");
		var sFormDataCollection = "FormData";
		var sFormDataLookupCollection = "FormDataLookup";

		var oModel;
		var oMockServer = new MockServer({
			rootUri: sServiceUri
		});

		function initModel(bJSON) {
			bJSON = bJSON !== false;
			oModel = new ODataModel(sServiceUri, {
				json: bJSON,
				defaultBindingMode: "TwoWay"
			});
			return oModel;
		}

		function removeSharedMetadata() {
			var sURI = sServiceUri.replace(/\/$/, "");
			if (ODataModel.mServiceData && ODataModel.mServiceData[sURI]) {
				delete ODataModel.mServiceData[sURI].oMetadata;
			}
		}

		function initServer() {
			oMockServer.simulate(sDataRootPath + "/metadata.xml", sDataRootPath);
			oMockServer.start();
			// sinon.clock.tick(11);
		}

		function stopServer() {
			oMockServer.stop();
		}

		module("FieldFactory OData Tests", {
			setup: function() {
				initServer();
				oModel = initModel(true);
			},
			teardown: function() {
				oModel = undefined;
				sap.ui.getCore().setModel(oModel);
				removeSharedMetadata();
				stopServer();
			}
		});

		var fnCallback = function(oOptions, fnTest) {
			var sPath = "/" + oModel.createKey(sFormDataCollection, {
				"StepKey": oOptions.StepKey,
				"SubStep": oOptions.SubStep,
				"Attribute": oOptions.Attribute
			});

			var oParams = {
				expand: sFormDataLookupCollection
			};

			oModel.createBindingContext(sPath, null, oParams, fnTest);
		};

		var fnSut = function(oContext) {
			// System under Test
			var oData = oModel.getProperty(null, oContext);

			var oFieldFactory = new FieldFactory({
				id: oData.Attribute,
				valuePath: oData.ValuePath,
				lookupPath: sFormDataLookupCollection,
				controlType: oData.Type,
				label: oData.Label,
				visible: "{Visible}",
				dependencies: "{Dependents}",
				mandatory: oData.Required
			});
			oFieldFactory.setModel(oModel);
			oFieldFactory.setModel(oi18nModel, "i18n");

			oFieldFactory.setBindingContext(oContext);
			oFieldFactory.placeAt("qunit-fixture");
			sap.ui.getCore().applyChanges();
			return oFieldFactory;
		};

		QUnit.asyncTest("Combo Validation", function() {
			var fnTest = function(oContext) {
				var oFieldFactory = fnSut(oContext);

				// Act
				var bError = oFieldFactory.checkClientError();

				// Assert
				QUnit.ok(bError, "Should have error");

				start(); // resume normal testing
				// Cleanup
				oFieldFactory.destroy();
			};

			oModel.attachMetadataLoaded(this, function() {
				fnCallback({
					"StepKey": "MDA1MDU2QkMwOUJEMUVENTk2RTZENDMxRkZGMzE0MjAsREVU",
					"SubStep": "00001",
					"Attribute": "COMBO"
				}, fnTest);
			});

		});

		QUnit.asyncTest("MutiCombo Validation", function() {
			expect(4);
			var fnTest = function(oContext) {
				var oFieldFactory = fnSut(oContext);

				setTimeout(
					function() {
						var oControl = oFieldFactory._oControl;
						// Act
						var aKeys = oControl.getSelectedKeys();
						var bError = oFieldFactory.checkClientError();
						// Assert
						QUnit.ok((aKeys.length === 0), "String to Array no entries");
						QUnit.ok(bError, "Should have errors");

						// oControl.onfocusin(); // for some reason this is not triggered when calling focus via API
						oControl.setValue("Stream Work");
						qutils.triggerKeyboardEvent(oControl.$(), jQuery.sap.KeyCodes.ENTER, false, false, false);
						setTimeout(
							function() {
								aKeys = oControl.getSelectedKeys();
								bError = oFieldFactory.checkClientError();
								QUnit.ok((aKeys.length > 0), "String to Array has entries");
								QUnit.ok(!bError, "Should not have errors");
								start(); // resume normal testing

								// Cleanup
								oFieldFactory.destroy();
							}, 100);
					}, 1000);
			};

			oModel.attachMetadataLoaded(this, function() {
				fnCallback({
					"StepKey": "MDA1MDU2QkMwOUJEMUVENTk2RTZENDMxRkZGMzE0MjAsREVU",
					"SubStep": "00001",
					"Attribute": "MCOMBO"
				}, fnTest);
			});
		});

		QUnit.asyncTest("CheckBox Validation", function() {
			expect(1);
			var fnTest = function(oContext) {
				var oFieldFactory = fnSut(oContext);

				// Act
				setTimeout(
					function() {
						var oControl = oFieldFactory._oControl;

						// Assert
						var oYesButton = oControl.getButtons()[1];
						oYesButton.$().click();
						qutils.triggerMouseEvent(oYesButton.getDomRef(), "tap", 1, 1, 1, 1);
						setTimeout(
							function() {
								var bError = oFieldFactory.checkClientError();
								QUnit.ok(!bError, "Should not have errors");
								start();

								// Cleanup
								oFieldFactory.destroy();
							}, 100);

					}, 100);
			};

			oModel.attachMetadataLoaded(this, function() {
				fnCallback({
					"StepKey": "MDA1MDU2QkMwOUJEMUVENTk2RTZENDMxRkZGMzE0MjAsREVU",
					"SubStep": "00001",
					"Attribute": "CBOX"
				}, fnTest);
			});
		});

		QUnit.asyncTest("Buttons Validation", function() {
			expect(2);
			var fnTest = function(oContext) {
				var oFieldFactory = fnSut(oContext);

				// Act
				setTimeout(
					function() {
						var oControl = oFieldFactory._oControl;

						var bError = oFieldFactory.checkClientError();

						// Assert
						QUnit.ok(bError, "Should have errors");

						var oYesButton = oControl.getButtons()[1];
						oYesButton.$().click();
						qutils.triggerMouseEvent(oYesButton.getDomRef(), "tap", 1, 1, 1, 1);
						setTimeout(
							function() {
								bError = oFieldFactory.checkClientError();
								QUnit.ok(!bError, "Should not have errors");
								start();

								// Cleanup
								oFieldFactory.destroy();
							}, 100);

					}, 100);
			};

			oModel.attachMetadataLoaded(this, function() {
				fnCallback({
					"StepKey": "MDA1MDU2QkMwOUJEMUVENTk2RTZENDMxRkZGMzE0MjAsREVU",
					"SubStep": "00001",
					"Attribute": "BUTTONS"
				}, fnTest);
			});
		});

		QUnit.asyncTest("Input Integer Validation", function() {
			var fnTest = function(oContext) {
				var oFieldFactory = fnSut(oContext);
				var oControl = oFieldFactory._oControl;

				// Act
				var bError = oFieldFactory.checkClientError();

				// Assert
				QUnit.ok(bError, "Should have errors");

				bError = oFieldFactory.checkClientError();
				QUnit.ok(bError, "Should still have errors");

				sap.ui.test.qunit.triggerCharacterInput(oControl.getFocusDomRef(), "2b");
				oControl._onInput(); // simulate input event

				QUnit.equals(oControl.getValue(), 2, "only digits entered");

				bError = oFieldFactory.checkClientError();
				QUnit.ok(!bError, "Should not have errors");
				start(); // resume normal testing
				// Cleanup
				oFieldFactory.destroy();
			};
			oModel.attachMetadataLoaded(this, function() {
				fnCallback({
					"StepKey": "MDA1MDU2QkMwOUJEMUVENTk2RTZENDMxRkZGMzE0MjAsREVU",
					"SubStep": "00001",
					"Attribute": "YEAR"
				}, fnTest);
			});

		});


		QUnit.asyncTest("Input Number Validation", function() {
			var fnTest = function(oContext) {
				var oFieldFactory = fnSut(oContext);
				var oControl = oFieldFactory._oControl;

				// Act
				var bError = oFieldFactory.checkClientError();

				// Assert
				QUnit.ok(bError, "Should have errors");

				bError = oFieldFactory.checkClientError();
				QUnit.ok(bError, "Should still have errors");

				sap.ui.test.qunit.triggerCharacterInput(oControl.getFocusDomRef(), "2b");
				oControl._onInput(); // simulate input event

				QUnit.equals(oControl.getValue(), 2, "only digits entered");

				bError = oFieldFactory.checkClientError();
				QUnit.ok(!bError, "Should not have errors");
				start(); // resume normal testing
				// Cleanup
				oFieldFactory.destroy();
			};
			oModel.attachMetadataLoaded(this, function() {
				fnCallback({
					"StepKey": "MDA1MDU2QkMwOUJEMUVENTk2RTZENDMxRkZGMzE0MjAsREVU",
					"SubStep": "00001",
					"Attribute": "NUMBER"
				}, fnTest);
			});

		});

		QUnit.asyncTest("Input Text Validation", function() {
			var fnTest = function(oContext) {
				var oFieldFactory = fnSut(oContext);
				var oControl = oFieldFactory._oControl;

				// Act
				var bError = oFieldFactory.checkClientError();

				// Assert
				QUnit.ok(bError, "Should have errors");

				bError = oFieldFactory.checkClientError();
				QUnit.ok(bError, "Should still have errors");

				sap.ui.test.qunit.triggerCharacterInput(oControl.getFocusDomRef(), "some text");
				oControl._onInput(); // simulate input event

				bError = oFieldFactory.checkClientError();
				QUnit.ok(!bError, "Should not have errors");
				start(); // resume normal testing
				// Cleanup
				oFieldFactory.destroy();
			};
			oModel.attachMetadataLoaded(this, function() {
				fnCallback({
					"StepKey": "MDA1MDU2QkMwOUJEMUVENTk2RTZENDMxRkZGMzE0MjAsREVU",
					"SubStep": "00001",
					"Attribute": "TEXT"
				}, fnTest);
			});

		});

		QUnit.module("Field Factory");

		function renderControlType(sTestName, oOptions, sClassName) {
			QUnit.test(sTestName, function() {
				// System under Test
				var oFieldFactory = new FieldFactory({
					id: oOptions.id,
					valuePath: oOptions.valuePath,
					lookupPath: oOptions.lookupPath,
					controlType: oOptions.controlType,
					label: oOptions.Label,
					mandatory: oOptions.mandatory
				});

				oFieldFactory.placeAt("qunit-fixture");
				sap.ui.getCore().applyChanges();

				// Assert
				var oMeta = oFieldFactory._oControl.getMetadata();
				strictEqual(oMeta._sClassName, oOptions.expectedClassName, "Field Is " + oOptions.expectedClassName);

				// Cleanup
				oFieldFactory.destroy();

			});
		}

		renderControlType("Should render SegmentedButton Control", {
			id: "TEST",
			valuePath: "Value/Boolean",
			lookupPath: "dummy",
			controlType: ControlTypes.CHECKBOX,
			label: "Test",
			mandatory: true,
			expectedClassName: "sap.m.SegmentedButton"
		});

		renderControlType("Should render ComboBox Control", {
			id: "TEST",
			valuePath: "Value/Sting",
			lookupPath: "dummy",
			controlType: ControlTypes.COMBO,
			label: "Test",
			mandatory: true,
			expectedClassName: "sap.m.ComboBox"
		});

		renderControlType("Should render MultiComboBox Control", {
			id: "TEST",
			valuePath: "Value/Sting",
			lookupPath: "dummy",
			controlType: ControlTypes.MULTI_COMBO,
			label: "Test",
			mandatory: true,
			expectedClassName: "sap.m.MultiComboBox"
		});

		renderControlType("Should render DatePicker Control", {
			id: "TEST",
			valuePath: "Value/Date",
			lookupPath: "dummy",
			controlType: ControlTypes.DATE,
			label: "Test",
			mandatory: true,
			expectedClassName: "sap.m.DatePicker"
		});

		renderControlType("Should render Number Control", {
			id: "TEST",
			valuePath: "Value/Number",
			lookupPath: "dummy",
			controlType: ControlTypes.NUMBER,
			label: "Test",
			mandatory: true,
			expectedClassName: "sap.m.Input"
		});

		renderControlType("Should render Currency Control", {
			id: "TEST",
			valuePath: "Value/Currency",
			lookupPath: "dummy",
			controlType: ControlTypes.CURRENCY,
			label: "Test",
			mandatory: true,
			expectedClassName: "sap.m.Input"
		});

		renderControlType("Should render Text Control", {
			id: "TEST",
			valuePath: "Value/String",
			lookupPath: "dummy",
			controlType: ControlTypes.TEXT,
			label: "Test",
			mandatory: true,
			expectedClassName: "sap.m.Input"
		});

		renderControlType("Should render Year Control", {
			id: "TEST",
			valuePath: "Value/Number",
			lookupPath: "dummy",
			controlType: ControlTypes.YEAR,
			label: "Test",
			mandatory: true,
			expectedClassName: "sap.m.Input"
		});
	});
