sap.ui.define([
		"sap/ui/core/UIComponent",
		"aklc/cm/components/Questionnaires/controller/ListSelector"
	],
	function(UIComponent, ListSelector) {
		"use strict";

		var Component = UIComponent.extend("aklc.cm.components.Questionnaires.Component", {

			metadata: {
				rootView: "aklc.cm.components.Questionnaires.view.Main",
				dependencies: {
					version: "1.8",
					libs: ["sap.ui.core"]
				},
				config: {
					resourceBundle: "i18n/i18n.properties"
				},
				properties: {
					componentData: "",
					eventBusSubscription: {
						name: "eventBusSubscription",
						type: "object",
						defaultValue: {
							channel: "Questionnaires",
							events: {
								contextChanged: "contextChanged",
								checkValid: "checkValid"
							}
						}
					}
				}
			}
		});

		Component.prototype.init = function() {
			var mConfig = this.getMetadata().getConfig();
			var i18nModel = new sap.ui.model.resource.ResourceModel({
				bundleUrl: [this.getRootPath(), mConfig.resourceBundle].join("/")
			});

			this.setModel(i18nModel, "i18n");
			this.listIds = [];

			var oComponentData = this.getComponentData();
			if (oComponentData) {
				this._oEventBus = oComponentData.eventBus;
				this.setModel(oComponentData.model);
			}

			this.oListSelector = new ListSelector(this);

			UIComponent.prototype.init.apply(this);
		};

		Component.prototype.getRootPath = function() {
			if (!this.rootPath) {
				this.rootPath = jQuery.sap.getModulePath("aklc.cm.components.Questionnaires");
			}
			return this.rootPath;
		};

		return Component;

	});
