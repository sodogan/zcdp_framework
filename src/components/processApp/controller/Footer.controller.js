sap.ui.define(["sap/ui/core/mvc/Controller",
    "sap/ui/commons/Dialog",
    "sap/ui/commons/TextView",
    "sap/ui/commons/ComboBox",
    "sap/ui/commons/Button",
    "sap/ui/core/ListItem",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"

  ],
  function(Controller, Dialog, TextView, ComboBox, Button, ListItem, Filter, FilterOperator) {
    "use strict";
    return Controller.extend("aklc.cm.components.processApp.controller.Footer", {
      _sApplicationLinksCollection: "ApplicationLinks",
      _sChannelId: "processApp",
      _sTimesheet: "TIMESHEET",
      /**
       * on init
       */
      onInit: function() {
        // Get and set it to Global variable references
        this._oComponent = sap.ui.component(sap.ui.core.Component.getOwnerIdFor(this.getView()));
        this._oComponent.getEventBus().subscribe(this._sChannelId, "contextChanged", this.onContextChanged.bind(this));

        this._oModel = this._oComponent.getModel();

        this._oActionBar = this.getView().byId("ActionBar");
      },

      /**
       * This function get triggered automatically when Contexxt changed
       * @param  {string} sChannelId Channel Id 
       * @param  {object} sEventId event object
       * @param  {object} oData Required Date further processing
       */
      onContextChanged: function(sChannelId, sEventId, oData) {
      //  this._oActionBar.destroy_businessActionButtons();
        var sPath = this._oModel.createKey("/ApplicationLinks", {
          StepKey: "",
          Component: this._sTimesheet
        });

        var fnCallback = function(oContext) {
          if (oContext) {
          /*  var oButton = new Button({
              icon: "{Icon}",
              lite: true,
              press: this.onActionPress.bind(this),
              tooltip: "{Description}"
            });*/
          var oButton = this.getView().byId("oButton");

            oButton.addStyleClass("acActionBarBtn");
            oButton.setBindingContext(oContext);

            this._oActionBar.addBusinessActionButton(oButton);
          }
        }.bind(this);

        this._oModel.createBindingContext(sPath, null, null, fnCallback, true);
      },
      /**
       * This function get triggered automatically when click on Footer button
       * 
       * @param  {object} oEvent event object
       * 
       */
      onActionPress: function(oEvent) {
        // Get the Binding context object
        var oData = oEvent.getSource().getBindingContext().getObject();

        // Open the URL based on the component
        switch (oData.Component) {
          case this._sTimesheet:
            this.onTSActionPress(oData.Url);
            break;
          default:
            this.onTSActionPress(oData.Url);
        }
      },
      /**
       * This function get triggered automatically when click on Time sheet button
       * 
       * @param  {string} sUrl Application URL
       * 
       */
      onTSActionPress: function(sUrl) {
        window.open(sUrl, "_blank");
      }
    });
  });