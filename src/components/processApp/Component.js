sap.ui.define(["sap/ui/core/UIComponent", "./Router", "sap/ui/model/odata/v2/ODataModel", "sap/ui/model/resource/ResourceModel"],
	function (UIComponent, Router, ODataModel, ResourceModel) {
		"use strict";
		return UIComponent.extend("aklc.cm.components.processApp.Component", {
			metadata: {
				version: "1.0",
				includes: ["css/ThreePanelViewer.css", "css/VerticalNavigationBar.css", "../../library/common/css/library.css"],
				dependencies: {
					libs: ["sap.m",
						"sap.ui.layout",
						"sap.ui.commons",
						"sap.ui.ux3",
						"aklc.cm.library.common"
					],
					components: []
				},

				rootView: "aklc.cm.components.processApp.view.Main",

				config: {
					resourceBundle: "i18n/i18n.properties",
					serviceConfig: {
						serviceUrl: "/sap/opu/odata/sap/ZCDP_PROCESS_APP_SRV/"
							//docMgt: "/sap/opu/odata/sap/ZPNC_REG_UX_DOC_MANAGEMENT_SRV/"
					}
				},
				routing: {
					config: {
						routerClass: "aklc.cm.components.processApp.Router"
					},
					"routes": [{
						"pattern": "",
						"name": "empty"
					}, {
						"pattern": "process/{processkey}/step/{stepkey}",
						"name": "process"
					}]

				}
			},

			/**
			 * [init description]
			 */
			init: function () {
				var mConfig = this.getMetadata().getConfig();

				var oModel = new ODataModel(
					mConfig.serviceConfig.serviceUrl, {
						"defaultBindingMode": "TwoWay",
						"useBatch": true,
						"disableHeadRequestForToken": "true"
					});

				this.setModel(oModel);

				//Init doc management service url and store model
				/*oModel = new ODataModel(
					mConfig.serviceConfig.docMgt, {
						"defaultBindingMode": "OneWay",
						"useBatch": true,
						"disableHeadRequestForToken": "true"
					});
				this.setModel(oModel, "docMgt");*/

				// resource bundle
				var i18nModel = new ResourceModel({
					bundleUrl: [this.getRootPath(), mConfig.resourceBundle].join("/")
				});

				this.setModel(i18nModel, "i18n");

				UIComponent.prototype.init.apply(this, arguments);
				var fnCallBack = function () {
					this.getRouter().initialize();
				}.bind(this);
				oModel.attachMetadataLoaded(fnCallBack);
			},

			getRootPath: function () {
				if (!this.rootPath) {
					this.rootPath = jQuery.sap.getModulePath("aklc.cm.components.processApp");
				}
				return this.rootPath;
			}
		});
	});