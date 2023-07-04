sap.ui.define([
        "jquery.sap.global",
        "sap/ui/core/Control",
        "sap/m/ComboBox",
        "sap/m/MultiComboBox",
        "sap/m/DatePicker",
        "sap/m/Input",
        "sap/m/SegmentedButton",
        "sap/m/SegmentedButtonItem",
        "sap/ui/core/Item",
        "sap/m/TextArea",
        "sap/ui/layout/GridData",
        "./ControlTypes"
    ],
    function(jQuery, Control, ComboBox, MultiComboBox, DatePicker, Input, SegmentedButton, SegmentedButtonItem, Item, TextArea, GridData,
        ControlTypes) {
        "use strict";
        return Control.extend("aklc.cm.components.Questionnaires.controls.FieldFactory", {
            metadata: {
                properties: {
                    valuePath: "string",
                    lookupPath: "string",
                    controlType: "string",
                    label: "string",
                    visible: "boolean",
                    enabled: "boolean",
                    dependencies: "string", //dependents is already taken
                    mandatory: "boolean"

                },
                aggregations: {
                    _content: {
                        type: "sap.ui.core.Control",
                        multiple: false
                    }
                },
                events: {
                    change: {}
                }
            },
            renderer: function(oRm, oControl) {
                oRm.write("<div ");
                oRm.writeControlData(oControl);
                if (oControl.getControlType() !== ControlTypes.MULTI_COMBO) {
                    oRm.addClass("rrFormInput");
                    oRm.writeClasses();
                }
                if (oControl.getControlType() === ControlTypes.MULTI_COMBO) {
                    oRm.addClass("ackmultisapMTokenizer");
                    oRm.writeClasses();
                }

                oRm.write(">");
                oRm.renderControl(oControl.getAggregation("_content"));
                oRm.write("</div>");
            },

            /**
             * init
             */
            init: function() {
                this._oControl = null;
                this._oError = null;
                this._oMessageManager = sap.ui.getCore().getMessageManager();
            },

            /**
             * on after rendering, set model and resource bundle
             */
            onAfterRendering: function() {
                if (!this._oModel && this.getBindingContext()) {
                    this._oModel = this.getBindingContext().getModel();

                    if (!this._oBundle) {
                        this._oBundle = this.getModel("i18n").getResourceBundle();
                    }
                }
            },

            /**
             * Set Mandatory, mandatory is the last field bound
             * @param {boolean} bValue is control mandatory
             * @return {boolean} mandatory value
             */
            setMandatory: function(bValue) {
                //the last property set
                var oReturnValue = this.setProperty("mandatory", bValue);
                this._createControl();
                return oReturnValue;
            },

            /**
             * create control, determine which control to create from the "Type"
             */
            _createControl: function() {
                this._oLayoutData = new GridData({
                    span: "L7 M7 S12"
                });

                this._fnChange = this._onInputChange.bind(this);

                this._oLookupTemplate = {
                    path: this.getLookupPath(),
                    template: new Item({
                        key: "{Key}",
                        text: "{Value}"
                    })
                };

                switch (this.getControlType()) {
                    case ControlTypes.CHECKBOX:
                        this._oControl = this._createCheckBox();
                        break;
                    case ControlTypes.COMBO:
                        this._oControl = this._createComboBox();
                        break;
                    case ControlTypes.MULTI_COMBO:
                        this._oControl = this._createMultiCombo();
                        break;
                    case ControlTypes.DATE:
                        this._oControl = this._createDatePicker();
                        break;
                    case ControlTypes.NUMBER:
                        this._oControl = this._createInputNumber();
                        break;
                    case ControlTypes.CURRENCY:
                        this._oControl = this._createInputCurrency();
                        break;
                    case ControlTypes.YEAR:
                        this._oControl = this._createInputYear();
                        break;
                    case ControlTypes.BUTTONS:
                        this._oControl = this._createSegmentedButton();
                        break;
                    case ControlTypes.TEXTAREA:
                        this._oControl = this._createTextArea();
                        break;
                    default: //ControlTypes.TEXT:
                        this._oControl = this._createInputString();
                        break;
                }

                this._oMessageManager.registerObject(this._oControl, true);
                this.setAggregation("_content", this._oControl);
            },

            /**
             * create SegmentedButton control
             * @return {control} SegmentedButton control
             */
            _createCheckBox: function() {
                var oAttributes = {
                    select: this._fnChange,
                    selectedKey: {
                        path: this.getValuePath()
                    },
                    items: [
                        new sap.m.SegmentedButtonItem({
                            key: false,
                            text: "No"
                        }),
                        new sap.m.SegmentedButtonItem({
                            key: true,
                            text: "Yes"
                        })
                    ],
                    layoutData: this._oLayoutData
                };

                return new SegmentedButton(oAttributes);
            },

            /**
             * create combo box control
             * @return {control} combobox control
             */
            _createComboBox: function() {
                var oAttributes = {
                    selectionChange: this._fnChange,
                    width: "100%",
                    selectedKey: {
                        path: this.getValuePath()
                    },
                    items: this._oLookupTemplate,
                    layoutData: this._oLayoutData
                };
                return new ComboBox(oAttributes);
            },

            /**
             * create multi combo box control
             * @return {control} multicombo box
             */
            _createMultiCombo: function() {
                var oAttributes = {
                    selectionChange: this._fnChange,
                    width: "100%",
                    selectedKeys: {
                        path: this.getValuePath(),
                        formatter: this.parseStringArray
                    },
                    items: this._oLookupTemplate,
                    layoutData: this._oLayoutData
                };
                return new MultiComboBox(oAttributes);
            },

            /**
             * create Date picker control
             * @return {control} date picker
             */
            _createDatePicker: function() {
                var oAttributes = {
                    value: {
                        path: this.getValuePath(),
                        type: "sap.ui.model.type.Date",
                        formatOptions: {
                            style: "medium",
                            strictParsing: true
                        }
                    },
                    change: this._fnChange,
                    layoutData: this._oLayoutData
                };

                return new DatePicker(oAttributes);
            },

            /**
             * create input control with number constraints
             * @return {control} input field
             */
            _createInputNumber: function() {
                var oAttributes = {
                    value: {
                        path: this.getValuePath(),
                        type: "sap.ui.model.odata.type.Int64",
                        constraints: {
                            nullable: !this.getMandatory(),
                            maxlength: 10
                        }
                    },
                    liveChange: this._fnChange,
                    layoutData: this._oLayoutData
                };

                return new Input(oAttributes);
            },

            /**
             * create input string
             * @return {string} control input string
             */
            _createInputString: function() {
                var oAttributes = {
                    width: "100%",
                    value: {
                        path: this.getValuePath(),
                        type: "sap.ui.model.odata.type.String",
                        constraints: {
                            nullable: !this.getMandatory()
                        }

                    },
                    liveChange: this._fnChange,
                    layoutData: this._oLayoutData

                };

                return new Input(oAttributes);
            },

            /**
             * create input string
             * @return {string} control input string
             */
            _createTextArea: function() {
                var oAttributes = {
                    width: "100%",
                    value: {
                        path: this.getValuePath(),
                        type: "sap.ui.model.odata.type.String",
                        constraints: {
                            nullable: !this.getMandatory()
                        }
                    },
                    liveChange: this._fnChange,
                    layoutData: this._oLayoutData,
                    rows: 5
                };

                return new TextArea(oAttributes);
            },

            /**
             * create input field with currency constraints
             * @return {control} input field
             */
            _createInputCurrency: function() {
                var oAttributes = {
                    description: "NZD",
                    value: {
                        path: this.getValuePath(),
                        type: "sap.ui.model.odata.type.Decimal",
                        constraints: {
                            nullable: !this.getMandatory()
                        }
                    },
                    liveChange: this._fnChange,
                    layoutData: this._oLayoutData
                };

                return new Input(oAttributes);
            },

            /**
             * crete input field for Year Values
             * @return {control} input control
             */
            _createInputYear: function() {
                var oAttributes = {
                    width: "4rem",
                    value: {
                        path: this.getValuePath(),
                        type: "sap.ui.model.type.Integer"
                    },
                    liveChange: this._fnChange,
                    layoutData: this._oLayoutData
                };

                if (this.getMandatory()) {
                    oAttributes.value.constraints = {
                        nullable: false,
                        minimum: 1800,
                        maximum: 9999
                    };
                }
                return new Input(oAttributes);
            },

            /**
             * create segmented button - used for No/Yes buttons
             * @return {object} segmented button control
             */
            _createSegmentedButton: function() {
                var oTemplate = {
                    path: this.getLookupPath(),
                    template: new SegmentedButtonItem({
                        key: "{Key}",
                        text: "{Value}"
                    })
                };

                var oAttributes = {
                    select: this._fnChange,
                    selectedKey: {
                        path: this.getValuePath()
                    },
                    items: oTemplate,
                    layoutData: this._oLayoutData
                };

                oAttributes.selectedButton = "UNSELECTED";

                return new SegmentedButton(oAttributes);
            },

            /**
             * Parse string to array
             * @param  {string} sArray string to parse
             * @return {array}        array to return
             */
            parseStringArray: function(sArray) {
                return sArray ? sArray.split(",") : [];
            },

            /**
             * [parseBooleanNoYes description]
             * @param  {[type]} sBoolean [description]
             * @return {[type]}          [description]
             */
            parseBooleanNoYes: function(sBoolean) {
                return (sBoolean === "true") ? true : false;
            },

            /**
             * [parseNoYesBoolean description]
             * @param  {[type]} oValue [description]
             * @return {[type]}        [description]
             */
            parseNoYesBoolean: function(oValue) {
                if (typeof oValue === "string") {
                    return oValue === "YES";
                }

                return oValue;
            },

            /**
             * has client errors
             * @return {Boolean} client has errors
             */
            _hasClientError: function() {
                return this._oError;
            },

            /**
             * check for client errors
             */
            _checkClientError: function() {
                if (this.getMandatory() && this.getVisible()) {
                    if (!this.mandatoryCheck()) {
                        this.addMandatoryMessage();
                    } else {
                        var aMessage = this._oModel.getMessagesByPath(this._getFullValuePath()) || [];
                        this._oMessageManager.removeMessages(aMessage);
                        this._oError = null;
                    }
                }
                this.setSubstepIconStatus(this);
            },

            /**
             * Check client errors
             * @return {boolean} has errors
             */
            checkClientError: function() {
                this._checkClientError();
                return this._oError;
            },

            /**
             * derive relatvie path for context
             * @return {string} full value path
             */
            _getFullValuePath: function() {
                return this._oControl.getBindingContext().getPath() + "/" + this.getValuePath();
            },

            /**
             * On input change event handler for control
             * @param  {object} oEvent  event object
             * @return {boolean}        has errors
             */
            _onInputChange: function(oEvent) {
                if (this._hasClientError()) {
                    var aMessage = this._oModel.getMessagesByPath(this._getFullValuePath()) || [];
                    this._oMessageManager.removeMessages(aMessage);
                    this._oError = null;
                }

                this.checkNumber(oEvent);

                this._updateBinding();
                this.updateDependents();
                return this._checkClientError();
            },

            /**
             * formatting breaks two way binding need to update on change
             */
            _updateBinding: function() {
                var sValue;
                var oContext = this.getBindingContext();
                switch (this.getControlType()) {
                    case ControlTypes.MULTI_COMBO:
                        sValue = this._oControl.getSelectedKeys().toString();
                        this._oModel.setProperty(this.getValuePath(), sValue, oContext);
                        break;
                    case ControlTypes.CHECKBOX:
                        sValue = this.parseBooleanNoYes(this._oControl.getSelectedKey());
                        this._oModel.setProperty(this.getValuePath(), sValue, oContext);
                        break;
                    case ControlTypes.NUMBER:
                        var slValue = this._oControl.getValue().toString();
                        sValue = slValue.replace(/,/g, "");
                        this._oModel.setProperty(this.getValuePath(), sValue, oContext);
                        break;
                    case ControlTypes.YEAR:
                        sValue = this._oControl.getValue().toString();
                        this._oModel.setProperty(this.getValuePath(), sValue, oContext);
                        break;
                    default:
                        break;
                }
            },

            /**
             * has error message
             * @return {Boolean} determine if there is a current message
             */
            hasErrorMessage: function() {
                var aMessage = this._oModel.getMessagesByPath(this._getFullValuePath()) || [];
                var fnSome = function(oMessage) {
                    return oMessage.type === sap.ui.core.MessageType.Error;
                };

                return aMessage.some(fnSome);
            },

            /**
             * Add message to message manager
             * @param {string} sMsg message to add
             */
            addMessage: function(sMsg) {
                if (this.hasErrorMessage()) {
                    return;
                }

                this._oMessageManager.addMessages(
                    new sap.ui.core.message.Message({
                        message: sMsg,
                        type: sap.ui.core.MessageType.Error,
                        target: this._getFullValuePath(),
                        processor: this._oModel
                    })
                );
            },

            /**
             * Add mandatory check failed message
             */
            addMandatoryMessage: function() {
                var sMsg = this._oBundle.getText("MANDATORY_FIELD", [this.getLabel()]);
                this.addMessage(sMsg);
                this._oError = true;
            },

            /**
             * Mandatory check, determine if valid entry for control
             * @return {boolean} is valid
             */
            mandatoryCheck: function() {
                var sValue;
                switch (this.getControlType()) {
                    case ControlTypes.BUTTONS:
                        sValue = this._oControl.getSelectedKey();
                        var bValid = (!!sValue.trim());
                        this._oControl.$().toggleClass("rrSegmentError", !bValid);
                        return bValid;
                    case ControlTypes.COMBO:
                        sValue = this._oControl.getSelectedKey();
                        return (!!sValue.trim());
                    case ControlTypes.MULTI_COMBO:
                        return (!!this._oControl.getSelectedKeys().length);
                    case ControlTypes.DATE:
                    case ControlTypes.TEXT:
                        sValue = this._oControl.getValue();
                        return (!!sValue.trim());
                    case ControlTypes.NUMBER:
                    case ControlTypes.YEAR:
                    case ControlTypes.CURRENCY:
                        sValue = this._oControl.getValue();
                        return (!!parseInt(sValue, 10));
                    default:
                        return true;
                }
            },

            /**
             * Check value is a number
             * @param  {string}  sValue value
             * @return {Boolean}        is a number
             */
            isNumber: function(sValue) {
                return /^-?\d+(?:\.\d+)?$/.test(sValue.toString());
            },

            /**
             * is value an integer
             * @param  {string}  sValue number input
             * @return {Boolean}        is a valid integer
             */
            isInteger: function(sValue) {
                return /^[0-9]*$/.test(sValue.toString());
            },

            /**
             * Parse string to integer
             * @param  {string} sValue [description]
             * @return {string}        formatted string
             */
            parseInteger: function(sValue) {
                return parseInt(sValue, 10) || "";
            },

            /**
             * parse number from string
             * @param  {sting} sValue value
             * @return {number}        pased value
             */
            parseNumber: function(sValue) {
                return sValue.match(/[0-9.,]+/);
                // return sValue.match(/\d+\,?\d+\,?\d+\,?\d+\.?\d{0,2}/);
            },

            /**
             * check number
             * @param  {object} oEvent [description]
             */
            checkNumber: function(oEvent) {
                if (oEvent.getId() === "liveChange") {
                    var sValue = oEvent.getParameters().newValue;
                    switch (this.getControlType()) {
                        case ControlTypes.YEAR:
                            if (sValue !== "" && !this.isInteger(sValue)) {
                                oEvent.getSource().setValue(this.parseInteger(sValue));
                            }
                            break;
                        case ControlTypes.NUMBER:

                        case ControlTypes.CURRENCY:

                            if (sValue !== "" && !this.isNumber(sValue)) {
                                //update DOM without triggering format
                                oEvent.getSource()._$input.val(this.parseNumber(sValue));
                            }
                            break;
                        default:
                    }
                }
            },

            /**
             * based on value update visibility of dependencies
             */
            updateDependents: function() {
                if (this.getDependencies()) {
                    var oContext = this.getBindingContext();
                    var oData = this._oModel.getProperty("", oContext);
                    var oValue = oData[this.getValuePath()];
                    var bVisible = this.parseNoYesBoolean(oValue);
                    var aAttributes = this.parseStringArray(this.getDependencies());

                    var i, sPath, oDependentContext;
                    var ilen = aAttributes.length;
                    for (i = 0; i < ilen; i++) {
                        //swap attributes on the context path "same key otherwise"
                        sPath = oContext.getPath().replace(oData.Attribute, aAttributes[i]);
                        oDependentContext = this._oModel.getContext(sPath);
                        this._oModel.setProperty("Visible", bVisible, oDependentContext);
                        if (!bVisible) {
                            this.clearDepenMessages(aAttributes[i]);
                        }
                    }
                }
            },

            /*eslint-disable */
            setSubstepIconStatus: function(oField) {
                var that = this;
                var sStatus = "S";

                oField.parentViewControl.oFields.forEach(function(oCurrfield) {

                    if (oField.SubStep === oCurrfield.SubStep) {

                        if (oCurrfield.getMandatory() && oCurrfield.getVisible()) {
                            if (!oCurrfield.mandatoryCheck()) {
                                oCurrfield.addMandatoryMessage();
                                sStatus = "E";
                            } else {
                                if (oCurrfield._oModel) {
                                    var aMessage = oCurrfield._oModel.getMessagesByPath(oCurrfield._getFullValuePath()) || [];
                                    oCurrfield._oMessageManager.removeMessages(aMessage);
                                    oCurrfield._oError = null;
                                }
                            }
                        }

                    }
                });

                oField.parentViewControl.oItemlist.forEach(function(oItem) {
                    if (oItem.getModel().getData(oItem.getBindingContextPath()).SubStep === oField.SubStep) {

                        var oItemContext = oItem.getBindingContext();
                        oItem.getModel().setProperty("Completed", sStatus, oItemContext);

                        that.modifyliststatus(oItem.getModel().getData(oItem.getBindingContextPath()).SubStep, oField.parentViewControl, oItem.getModel()
                            .getData(oItem.getBindingContextPath()).Completed);

                        that.setIconbyId(oItem.getModel().getData(oItem.getBindingContextPath()).SubStep, oField.parentViewControl, oItem.getModel().getData(
                            oItem.getBindingContextPath()).Completed);

                    }
                });

            },

            setIconbyId: function(oSubstep, oviewControl, oStatus) {
                  if(oviewControl.getComponent().oList){
                       oviewControl.getComponent().oList.getItems().forEach(function(oItem){
                       var oIconCell =  oItem.getCells()[1];
                if(oIconCell){
                    if (oSubstep === oItem.getModel().getObject(oItem.getBindingContextPath()).SubStep) {

                        if (oStatus === "E") {
                            oIconCell.setSrc("sap-icon://message-error");
                            oIconCell.removeStyleClass("statusIcon");
                            oIconCell.removeStyleClass("acklNoShowNavIcon1");
                            oIconCell.addStyleClass("ackErrorstatusIcon");
                        }

                        if (oStatus === "S") {
                            oIconCell.setSrc("sap-icon://accept");
                            oIconCell.removeStyleClass("ackErrorstatusIcon");
                            oIconCell.removeStyleClass("acklNoShowNavIcon1");
                            oIconCell.addStyleClass("statusIcon");

                                }
                            }
                        }
                    });
                    }
            },

            modifyliststatus: function(oSubstep, oviewControl, oStatus) {
                oviewControl.getComponent().listIds.forEach(function(item) {

                    if (oSubstep === item.SubStep) {

                        item.Status = oStatus;
                    }

                });
            },

            /*** In case of hidden dependents Remove the Dependent Error message if any , */
            clearDepenMessages: function(oId) { // eslint-disable-line no-use-before-define
                var oField = sap.ui.getCore().byId(oId);
                if (oField) {
                    if (oField._oModel) {
                        var aMessage = oField._oModel.getMessagesByPath(oField._getFullValuePath()) || [];
                        oField._oMessageManager.removeMessages(aMessage);
                        oField._oError = null;
                    }
                }
            }
        });
    }, true);