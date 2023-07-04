sap.ui.define([
		"jquery.sap.global",
		"sap/ui/commons/Label",
		"sap/ui/commons/LabelRenderer",
		"sap/ui/commons/RichTooltip",
		"sap/ui/commons/TextView"
	],
	function(jQuery, Label, LabelRenderer, RichTooltip, TextView) {
		"use strict";
		var CSS_CLASS = "rrFormLabel";

		return Label.extend("aklc.cm.components.Questionnaires.controls.Label", {

			/**
			 * renderer
			 * @param  {object} oRm      Render Manager
			 * @param  {object} oControl Control
			 */
			renderer: function(oRm, oControl) {
				LabelRenderer.render.call("", oRm, oControl);

			},

			/**
			 * init
			 */
			init: function() {
				this._sImageSrc = jQuery.sap.getModulePath("aklc.cm.components.formData.images", "/") + "information.gif";
				this._oRichToolTip = null;
				// this.setWidth("25em");
				this.setWrapping(true);
				this.addStyleClass(CSS_CLASS);
			},

			/**
			 * On Before Rendering
			 */
			onBeforeRendering: function() {

				if (!this._oRichToolTip) {
					this._oRichToolTip = new RichTooltip({
						text: this.getText(),
						imageSrc: this._sImageSrc
					});

					this.setTooltip(this._oRichToolTip);
				}
			}
		});
	}, /* bExport= */ true);