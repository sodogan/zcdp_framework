sap.ui.define(["sap/ui/ux3/ActionBar", "sap/ui/ux3/ActionBarRenderer"],
	function(UX3ActionBar, UX3ActionBarRenderer) {
		"use strict";
		return UX3ActionBar.extend("aklc.cm.components.processApp.controls.ActionBar", {
			metadata: {
				aggregations: {
					_businessActionButtons: {
						type: "sap.ui.commons.Button",
						multiple: true,
						singularName: "businessActionButton"
					}
				}
			},
			renderer: UX3ActionBarRenderer.render
		});
	}, /* bExport= */ true);
