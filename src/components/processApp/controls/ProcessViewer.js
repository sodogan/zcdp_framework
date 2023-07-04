sap.ui.define([
    "sap/ui/ux3/ThingViewer",
    "sap/ui/ux3/ActionBar",
    "./ProcessViewerRenderer",
    "./VerticalNavigationBar",
    "sap/m/MessagePopover",
    "sap/m/MessagePopoverItem",
    "sap/ui/commons/Button",
    "sap/ui/ux3/ThingGroup",
    "sap/ui/commons/Dialog",
    "sap/ui/commons/TextView",
    "sap/ui/commons/TextArea",
    "sap/ui/layout/VerticalLayout"
  ], function(ThingViewer, ActionBar, ProcessViewerRenderer, VerticalNavigationBar, MessagePopover, MessagePopoverItem, Button, ThingGroup, Dialog, TextView, TextArea, VLayout) {
    "use strict";

    return ThingViewer.extend("aklc.cm.components.processApp.controls.ProcessViewer", {
      metadata: {

        // ---- object ----
        publicMethods: [
          // methods
          "selectDefaultFacet"
        ],

        // ---- control specific ----
        properties: {
          sidebarWidth: {
            type: "sap.ui.core.CSSSize",
            group: "Misc",
            defaultValue: "224px"
          }
        },
        aggregations: {
          footerContent: {
            type: "sap.ui.core.Control",
            multiple: false
          }
        }
      },

      /**
       * init method
       */
      init: function() {
        ThingViewer.prototype.init.apply(this);
        // this.fAnyEventHandlerProxy = this.onAnyEvent.bind(this);

        //NavBar
        this._oNavBar = new VerticalNavigationBar();
        this.setAggregation("navBar", this._oNavBar);

        //callback for item select
        var fnAttachSelect = function(oEvent) {
          var oItem = oEvent.getParameters().item;
          this._fireFacetSelected(oItem);
        }.bind(this);

        this._getNavBar().attachSelect(fnAttachSelect);

        var fnAfterRendering = function() {
          this._setActions();
        }.bind(this);

        //needs a DOM for setting actions
        this._getNavBar().addDelegate({
          onAfterRendering: fnAfterRendering
        });

        //ActionBar
        var oActionBar = new ActionBar({
          showUpdate: false,
          showFollow: false,
          showFlag: false,
          showFavorite: false,
          showOpen: false
        });

        this.setAggregation("actionBar", oActionBar);

        this._oActionNext = new Button({
          id: "next",
          icon: "sap-icon://navigation-right-arrow",
          iconFirst: false,
          tooltip: "Next",
          press: this.gotoNextStep.bind(this),
          visible: false
        }).addStyleClass("acActionBarBtn");

        this._oActionPrevious = new Button({
          id: "previous",
          icon: "sap-icon://navigation-left-arrow",
          tooltip: "Previous",
          press: this.gotoPreviousStep.bind(this),
          visible: false
        }).addStyleClass("acActionBarBtn");

        this._oActionSheet = new Button({
          id: "actionSheet",
          icon: "sap-icon://action",
          tooltip: "Finish Task",
          press: this.handleActionSheetPress.bind(this),
          enabled: true,
          visible: true
        }).addStyleClass("acActionBarBtn");

        this._oActionAccept = new Button({
          id: "accept",
          text: "Accept",
          enabled: false,
          visible: false,
          style: sap.ui.commons.ButtonStyle.Accept
        }).addStyleClass("acActionBarBtn");

        this._oActionReject = new Button({
          id: "reject",
          text: "Reject",
          press: this._onActionReject.bind(this),
          visible: false,
          style: sap.ui.commons.ButtonStyle.Reject
        }).addStyleClass("acActionBarBtn");

        this._oActionMessages = new Button({
          id: "messages",
          icon: "sap-icon://alert",
          text: {
            path: "msg>/",
            formatter: function(aMsg) {
              return aMsg.length;
            }
          },
          visible: {
            path: "msg>/",
            formatter: function(aMsg) {
              return aMsg.length > 0;
            }
          },
          press: this.showMessages.bind(this)
        }).addStyleClass("acMessageBtn");
        this._oActionMessages.setModel(sap.ui.getCore().getMessageManager().getMessageModel(), "msg");
        this.addNavigationActions();

        this.sPressedButton = " ";
        this.oMainController = "";
      },


      /**
       * exit
       */
      exit: function() {
        this._getNavBar().destroy();
        this.getActionBar().destroy();
        this._oActionNext.destroy();
        this._oActionPrevious.destroy();
        this._oActionSheet.destroy();
        if (this.oMessagePopover){
          this.oMessagePopover.destroy();
        }
        // jQuery.sap.unbindAnyEvent(this.fAnyEventHandlerProxy);
      },

      addHeaderContent: function(oHeaderContent) {
        this.addAggregation("headerContent", oHeaderContent, true);
        this._rerenderHeaderContent();
        return this;
      },

      _rerenderHeaderContent: function() {
        var $content = this.$("headerContent");
        if ($content.length > 0) {
          var rm = sap.ui.getCore().createRenderManager();
          ProcessViewerRenderer.renderHeaderContent(rm, this);
          rm.flush($content[0]);
          rm.destroy();
        }
      },

      /**
       * set selected factet
       * @param {string} sSelectedFacet Selected Facet
       */
      setSelectedFacet: function(sSelectedFacet) {
        var oldSelectedFacet = this.getSelectedFacet();
        this.setAssociation("selectedFacet", sSelectedFacet, true);
        var newSelectedFacet = this.getSelectedFacet();

        if (oldSelectedFacet !== newSelectedFacet) {
          this._getNavBar().setSelectedItem(newSelectedFacet);
          this._setActions();
        }
      },

      /**
       * Add Navigation Actions
       */
      addNavigationActions: function() {
        if (this.getActionBar()) {
          var oActionBar = this.getActionBar();

          oActionBar.insertAggregation("_businessActionButtons", this._oActionNext, 0, true);
          oActionBar.insertAggregation("_businessActionButtons", this._oActionPrevious, 0, true);
          oActionBar.insertAggregation("_businessActionButtons", this._oActionSheet, 0, true);
          oActionBar.insertAggregation("_businessActionButtons", this._oActionAccept, 0, true);
          oActionBar.insertAggregation("_businessActionButtons", this._oActionReject, 0, true);

        }
      },


      /**
       * Get Next Action Text
       * @return {string} text for next action
       */
      _getNextAction: function() {
        var oItem = this._getNavBar().getNextItem();
        return (oItem) ? oItem.getText() : undefined;
      },

      /**
       * Get Previous Action Text
       * @return {string} text for previous action
       */
      _getPreviousAction: function() {
        var oItem = this._getNavBar().getPreviousItem();
        return (oItem) ? oItem.getText() : undefined;
      },

      /**
       * goto next step
       */
      gotoNextStep: function() {
        this.sPressedButton = "Next";
        var oItem = this._getNavBar().getNextItem();
        if (oItem) {
          this._fireFacetSelected(oItem);
        }
      },

      /**
       * goto previous step
       */
      gotoPreviousStep: function() {
        this.sPressedButton = "Previous";
        var oItem = this._getNavBar().getPreviousItem();
        if (oItem) {
          this._fireFacetSelected(oItem);
        }
      },

      /**
       * Fire Facet selected
       * @param  {object} oItem Item Selected
       */
      _fireFacetSelected: function(oItem) {
        this.fireFacetSelected({
          id: oItem.getId(),
          key: oItem.getKey(),
          item: oItem
        });
      },

      /**
       * Set Active Steps
       * @param {integer} iSteps number of steps to set active
       */
      setActiveSteps: function(iSteps) {
        this._getNavBar().setActiveSteps(iSteps);
      },


      /**
       * Set Actions
       */
      _setActions: function() {
        if (this._getNextAction()) {
          this._oActionNext.setVisible(true);
        } else {
          this._oActionNext.setVisible(false);
        }

        if (this._getPreviousAction()) {
          this._oActionPrevious.setVisible(true);
        } else {
          this._oActionPrevious.setVisible(false);
        }
      },

      /**
       * Render facet content
       */
      _rerenderFacetContent: function() {
        var $content = jQuery.sap.byId(this.getId() + "-facetContent");
        if ($content.length > 0) {
          var oRm = sap.ui.getCore().createRenderManager();
          ProcessViewerRenderer.renderNavBar(oRm, this);
          ProcessViewerRenderer.renderFacetContent(oRm, this);
          oRm.flush($content[0]);
          oRm.destroy();
          this._resize = false;
          this._setTriggerValue();
          this._onresize();
        }
      },

      /**
       * get Navigation bar
       * @return {object} navigation bar control
       */
      _getNavBar: function() {
        return this._oNavBar;
      },

      /**
       * Show Messages
       * @param  {object} oEvent event
       */
      showMessages: function(oEvent) {
        var oMessageTemplate = new MessagePopoverItem({
          type: "{msg>type}",
          title: "{msg>message}",
          description: "{msg>description}"
        });

        if (!this.oMessagePopover) {
          this.oMessagePopover = new MessagePopover({
            items: {
              path: "msg>/",
              template: oMessageTemplate
            }
          });
          this.oMessagePopover.setModel(sap.ui.getCore().getMessageManager().getMessageModel(), "msg");
        }

        this.oMessagePopover.openBy(oEvent.getSource());
      },

      _onActionReject: function() {
        if (!this.oDialog) {

          this.oDialog = new Dialog({
            resizable: false,
            title: "Reject Application",
            modal: true,
            showCloseButton: false
          });

          var oVLayout = new VLayout();

          var sHeaderText = new TextView({
            text: "Please enter reason for rejection:"
          });

          var oTextArea = new TextArea({
            cols: 50,
            rows: 5
          });

          var fnClose = function() {
            this.oDialog.close();
          }.bind(this);

          oVLayout.addContent(sHeaderText);
          oVLayout.addContent(oTextArea);

          this.oDialog.addContent(oVLayout);

          this.oDialog.addButton(new sap.ui.commons.Button({
            text: "Submit",
            press: fnClose
          }));

          this.oDialog.addButton(new sap.ui.commons.Button({
            text: "Cancel",
            press: fnClose
          }));
        }

        this.oDialog.open();
      },

      /**
       * Get Next Action step
       * @return {object} Next Step for next action
       */
      getNextStep: function() {
        var sCurrentKey = this._getNavBar().getNextItem().getKey();

        var aItems = this._getNavBar().getItems();
        var bflag = false;
        var oNextStep;
        $.each(aItems, function(i, oStep){

          // No need to process it, once we get the Next step
          if (bflag === true) {
            oNextStep = oStep;
            return false;
          }

        /*eslint-disable */
        if (oStep.getKey() === sCurrentKey) {
            // Set the flag, so that it will be used next step
            bflag = true;
          }
        });
        return oNextStep;
      },

      /**
       * Get Previous Action step
       * @return {object} Previous Step for Previous action
       */
      getPreviousStep: function() {
        var sCurrentKey = this._getNavBar().getPreviousItem().getKey();
        var aItems = this._getNavBar().getItems();
        var oPreviousStep;
        // Get the Previous step item
        $.each(aItems, function(i, oStep){

          if (oStep.getKey() === sCurrentKey) {

            return false;
          }

          oPreviousStep = oStep;

        });
        return oPreviousStep;
      },

      /**
       * Handle action for Action sheet press
       * @param {object} oEvent Action Sheet Button's action event
       */
      handleActionSheetPress: function(oEvent) {
   //  sap.ui.getCore().getMessageManager().removeAllMessages();

        var oButton = oEvent.getSource();
        var oController = this;

        // Create ApplicationAction Sheet buttons 
        this.oMainController.createActionSheetButtons().done(function() {

        // Create reference for  Footer Button fragment if its not exist
        if (!oController._oFooterActionButtonFragment) {

          oController._oFooterActionButtonFragment = sap.ui.xmlfragment("idFooterActionSheetFragment", "aklc.cm.components.processApp.fragments.FooterActionSheet", oController.oMainController);
          oController.addDependent(oController._oFooterActionButtonFragment);
        }

        // Open the Action sheet in Pop over
        oController._oFooterActionButtonFragment.openBy(oButton);

        });
      },

      /**
       * Get the Footer Action Sheet  button fragment reference
       * @return {object} _oFooterActionButtonFragment  - Action Sheet Button's action reference
       */
      getFooterActionButtonFragmentReference: function() {
        return this._oFooterActionButtonFragment;
      },

      /**
       * Render Nav Bar content for set the Nav Bar icon based on the Form Data validations
       */
      rerenderNavBarContent: function() {
        // Refresh the Face content and Nav Bar 
            var $content = jQuery.sap.byId(this.getId() + "-facetContent");
                if ($content.length > 0) {

                  // Refresh only Nav Bar
                  var oNavBar = $content[0].childNodes[0];
                  var oRm = sap.ui.getCore().createRenderManager();
                  ProcessViewerRenderer.renderNavBar(oRm, this);
                  oRm.flush(oNavBar);
                }

      }
    });
  },
  /* bExport= */
  true);