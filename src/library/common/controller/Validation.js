sap.ui.define([
	"sap/ui/base/Object"
], function(BaseObject) {
	"use strict";
	return BaseObject.extend("aklc.cm.library.common.controller.Validation", {

		/**
		 * Constructor
		 * @param {objet} oController message to add
		 */
		constructor: function(oController) {
			this.oController = oController;
		},
		/*eslint-disable */
		/**
		 * Validate the Form
		 * 
		 */
		validateForm: function() {
			this.oController._oMessageManager.removeAllMessages();
			this._oError = false;

			var oControl = this;

			this.oController._formFields.forEach(
				function(obj, i) {
					oControl._oControl = oControl.oController.byId(obj);

					if (oControl._checkMandatory()) {
						if (oControl._getValuePath()) {
							var value = oControl.oController._oModel.getProperty(oControl._getFullValuePath());

							if (!value) {
								oControl._addMandatoryMessage();
							}
						}
					}
				}
			);
		},

		/**
		 * Add message to message manager
		 * @param {string} sMsg message to add
		 */
		_addValidationMessage: function(sMsg) {
			
			var oControl = this;
			this.oController._oMessageManager.addMessages(
				new sap.ui.core.message.Message({
					message: sMsg,
					type: sap.ui.core.MessageType.Error,
					target: oControl._getFullValuePath(),
					processor: this.oController._oModel
				})
			);
		},
		/*eslint-enable */
		_checkMandatory: function() {
			return this.oController.byId(this._oControl.getId() + "Label").getRequired();
		},

		/**
		 * derive relatvie path for context
		 * @return {string} full value path
		 */
		_getFullValuePath: function() {
			return this._oControl.getBindingContext().getPath() + "/" + this._getValuePath();
			//return (this._oControl.getRequired() && this._oControl.getVisibile() ? true : false);
		},

		_getValuePath: function() {
			if (this._oControl instanceof(sap.m.ComboBox)) {
				return this._oControl.getBindingInfo("selectedKey").binding.getPath();
			} else if (this._oControl instanceof(sap.m.Input)) {				
				return this._oControl.getBindingInfo("value").parts[0].path;
			} else if (this._oControl instanceof(sap.m.TextArea)) {
				return this._oControl.getBindingInfo("value").binding.getPath();
			} else if (this._oControl instanceof(sap.m.DatePicker)) {
				return this._oControl.getBindingInfo("dateValue").binding.getPath();
			} else if (this._oControl instanceof(sap.ui.richtexteditor.RichTextEditor)) {
				return this._oControl.getBindingInfo("value").binding.getPath();
			} 

		},
		/**
		 * Add mandatory check failed message
		 * @param {objet} property Message text property
		 */
		_addMandatoryMessage: function(property) {
			var sMsg = this.oController._oBundle.getText("MANDATORY_FIELD", [this._getPropertyLabel()]);
			this._addValidationMessage(sMsg, property);
			this._oError = true;
		},

		_getPropertyLabel: function() {
			try {
				return this.oController._oModel.getProperty(this._getFullValuePath() + "/#sap:label").value;
			} catch (e) {

			}
		}
	});
});
