sap.ui.define(["sap/ui/core/mvc/Controller", "aklc/cm/library/common/utils/Formatter"],
	function(Controller, Formatter) {
		"use strict";

		var BaseController = Controller.extend("aklc.cm.library.common.controller.BaseController", {
			onInit: function() {
				this._oView = this.getView();
				this._oModel = this.getComponent().getModel();
				this.Formatter = Formatter;

				var oSubscription = this.getComponent().getEventBusSubscription();
				this.getEventBus().subscribe(oSubscription.channel, oSubscription.events.contextChanged, this.onContextChanged, this);
				this.getEventBus().subscribe(oSubscription.channel, oSubscription.events.checkValid, this.onCheckValid, this);
				this.getEventBus().subscribe(oSubscription.channel, oSubscription.events.submitChanges, this.onSubmitChanges, this);
				this.getEventBus().subscribe(oSubscription.channel, oSubscription.events.formDataValidateAllFields, this.onFormDataValidateAllFields, this);
			},

			/**
			 * [getComponent description]
			 * @return {[type]} [description]
			 */
			getComponent: function() {
				var sComponentId = sap.ui.core.Component.getOwnerIdFor(this.getView());
				return sap.ui.component(sComponentId);
			},

			/**
			 * [getEventBus description]
			 * @return {[type]} [description]
			 */
			getEventBus: function() {
				return this.getComponent().getEventBus();
			},

			/**
			 * Empty handler for context change event
			 * @param  {[type]} sChannel [description]
			 * @param  {[type]} sEvent   [description]
			 * @param  {[type]} oData    [description]
			 */
			onContextChanged: function(sChannel, sEvent, oData) {
				//default behviour
				//this.getView().setBindingContext(oData.context);
			},

			/**
			 * Empty handler for check valid event
			 * @param  {[type]} sChannel [description]
			 * @param  {[type]} sEvent   [description]
			 * @param  {[type]} oData    [description]
			 */
			onCheckValid: function(sChannel, sEvent, oData) {
				//default behaviour
				//oData.WhenValid.resolve();
			},
			/**
			 * Empty handler for Submit Changes event
			 * @param  {[type]} sChannel [description]
			 * @param  {[type]} sEvent   [description]
			 * @param  {[type]} oData    [description]
			 */
			onSubmitChanges: function(sChannel, sEvent, oData) {
				//default behaviour
				//oData.WhenValid.resolve();
			},
			/**
			 * Empty handler for Form Data All fields validation event
			 * @param  {[type]} sChannel [description]
			 * @param  {[type]} sEvent   [description]
			 * @param  {[type]} oData    [description]
			 */
			onFormDataValidateAllFields: function(sChannel, sEvent, oData) {
				//default behaviour
				//oData.WhenValid.resolve();
			}			
		});

		return BaseController;
	},
	true);
