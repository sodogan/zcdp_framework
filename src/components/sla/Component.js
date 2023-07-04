sap.ui.define([
        "sap/ui/core/UIComponent"
    ],
    function(UIComponent, ListSelector) {
        "use strict";

        var Component = UIComponent.extend("aklc.cm.components.sla.Component", {

            metadata: {
                rootView: "aklc.cm.components.sla.view.Main",
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
                            channel: "outcomes", //need to overwrite
                            events: {
                                contextChanged: "contextChanged",
                                checkValid: "checkValid",
                                submitChanges: "submitChanges"
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

            this._oViewModel = new sap.ui.model.json.JSONModel({
                "CreateMode": true,
                "SaveBtn_Visible": false,
                "UpdateBtn_Visible": false,
                "Duration_Editable": false
            });

            this.setModel(this._oViewModel, "vm");

            var oComponentData = this.getComponentData();
            if (oComponentData) {
                this._oEventBus = oComponentData.eventBus;
                this.setModel(oComponentData.model);
            }

            UIComponent.prototype.init.apply(this);
        };

        Component.prototype._setViewModelProperty = function(property, value) {
            this._oViewModel.setProperty("/" + property, value);
        };

        Component.prototype.getRootPath = function() {
            if (!this.rootPath) {
                this.rootPath = jQuery.sap.getModulePath("aklc.cm.components.sla");
            }
            return this.rootPath;
        };

        return Component;
    });
