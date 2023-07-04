sap.ui.define([
        "jquery.sap.global",
        "sap/ui/core/Control",
        "sap/m/ComboBox",
        "sap/m/MultiComboBox",
        "sap/m/DatePicker",
        "sap/m/DateTimePicker", // inserted: CHG0039779 25.10.2019
        "sap/m/Input",
        "sap/m/SegmentedButton",
        "sap/m/SegmentedButtonItem",
        "sap/ui/core/Item",
        "sap/m/TextArea",
        "sap/ui/layout/GridData",
        "./ControlTypes",
        "sap/ui/model/type/Date",
        "sap/ui/model/type/DateTime", // inserted: CHG0039779 25.10.2019
        "sap/m/MultiInput",
        "sap/ui/model/json/JSONModel",
        "sap/ui/commons/RowRepeater",
        "sap/ui/layout/HorizontalLayout",
        "sap/m/Label",
        "sap/m/Token",
        "sap/m/Button"
    ],
    function(jQuery, Control, ComboBox, MultiComboBox, DatePicker, DateTimePicker, Input, SegmentedButton, SegmentedButtonItem, Item, TextArea,
        GridData, ControlTypes, ModelDate, ModelDateTime, MultiInput, JSONModel, RowRepeater, HorizontalLayout, Label, Token, Button) {
        "use strict";
        return Control.extend("aklc.cm.components.formData.controls.FieldFactory", {
            metadata: {
                properties: {
                    valuePath: "string",
                    mvaluePath: "string",
                    reverseButtons: "boolean",
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
                switch (oControl.getControlType()) {
                    case ControlTypes.MULTI_COMBO:
                        oRm.addClass('ackmultisapMTokenizer');
                        oRm.writeClasses();
                        break;
                    case ControlTypes.MDATE:
                        oRm.addClass('ackmultisapMTokenizer');
                        oRm.writeClasses();
                        break;
                    case ControlTypes.MTEXT:
                        oRm.addClass('ackmultisapMTokenizer');
                        oRm.writeClasses();
                        break;
                    case ControlTypes.MCURRENCY:
                        oRm.addClass('ackmultisapMTokenizer');
                        oRm.writeClasses();
                        break;
                    case ControlTypes.MNUMBER:
                        oRm.addClass('ackmultisapMTokenizer');
                        oRm.writeClasses();
                        break;
                    case ControlTypes.MYEAR:
                        oRm.addClass('ackmultisapMTokenizer');
                        oRm.writeClasses();
                        break;
                    default:
                        oRm.addClass("rrFormInput");
                        oRm.writeClasses();
                        break;
                }

                /*eslint-disable */
                /**if (oControl.getControlType() !== ControlTypes.MULTI_COMBO &&
                    oControl.getControlType() !== ControlTypes.MDATE ) {
                    oRm.addClass("rrFormInput");
                    oRm.writeClasses();
                }
                if (oControl.getControlType() === ControlTypes.MULTI_COMBO) {
                    oRm.addClass('ackmultisapMTokenizer');
                    oRm.writeClasses();
                }
                if (oControl.getControlType() === ControlTypes.MDATE) {
                    oRm.addClass('ackmultisapMTokenizer');
                    oRm.writeClasses();
                }**/
                /*eslint-enable */

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
                this._onValueHelpRequest = this._onValueHelp.bind(this);
                this._onChangeofTokens = this.onChangeofTokens.bind(this);

                this._oLookupTemplate = {
                    path: this.getLookupPath(),
                    template: new Item({
                        key: "{Key}",
                        text: "{Value}",
                        tooltip: "{Value}"
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
                    case ControlTypes.DATETIME:
                        this._oControl = this._createDateTimePicker();
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
                    case ControlTypes.MDATE:
                        this._oControl = this._createMDatePicker();
                        break;
                    case ControlTypes.MTEXT:
                        this._oControl = this._createMInputText();
                        break;
                    case ControlTypes.MCURRENCY:
                        this._oControl = this._createMInputCurrency();
                        break;
                    case ControlTypes.MNUMBER:
                        this._oControl = this._createMInputNumber();
                        break;
                    case ControlTypes.MYEAR:
                        this._oControl = this._createMInputYear();
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
                    width: "100%",
                    selectionChange: this._fnChange,
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
                    width: "100%",
                    selectionChange: this._fnChange,

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
                var oDatetype = new ModelDate({
                    pattern: "dd/MM/yyyy",
                    strictParsing: true
                });
                var oAttributes = {
                    value: {
                        path: this.getValuePath(),
                        type: oDatetype
                    },
                    placeholder: "dd/mm/yyyy",
                    change: this._fnChange,
                    layoutData: this._oLayoutData
                };

                return new DatePicker(oAttributes);
            },
            
			/**
             * create Date Time picker control
             * @return {control} date time picker
             */
            _createDateTimePicker: function() {
                var oDateTimetype = new ModelDateTime({
                    pattern: "dd/MM/yyyy HH:mm:ss",
                    strictParsing: true
                });
                var oAttributes = {
                    value: {
                        path: this.getValuePath(),
                        type: oDateTimetype
                    },
                    placeholder: "dd/mm/yyyy hh:mm:ss",
                    change: this._fnChange,
                    layoutData: this._oLayoutData
                };

                return new DateTimePicker(oAttributes);
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
             * create input control with number constraints
             * @return {control} input field
             */
            _createInputNumber: function() {
                var oAttributes = {
                    value: {
                        path: this.getValuePath(),
                        type: "sap.ui.model.odata.type.String",
                        constraints: {
                            nullable: !this.getMandatory(),
                            maxlength: 10
                        }
                    },
                    width: "100%",
                    enabled: this.getEnabled(),
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
                    value: {
                        path: this.getValuePath(),
                        type: "sap.ui.model.odata.type.String",
                        constraints: {
                            nullable: !this.getMandatory()
                        }
                    },
                    width: "100%",
                    enabled: this.getEnabled(),
                    liveChange: this._fnChange,
                    layoutData: this._oLayoutData
                };

                return new Input(oAttributes);
            },

            /**
             * create input field with currency constraints
             * @return {control} input field
             */
            _createInputCurrency: function() {
                var oAttributes = {
                    description: "NZD",
                    width: "100%",
                    value: {
                        path: this.getValuePath(),
                        type: "sap.ui.model.odata.type.String",
                        constraints: {
                            nullable: !this.getMandatory()
                        }
                    },
                    enabled: this.getEnabled(),
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
                        type: "sap.ui.model.type.String"
                    },
                    enabled: this.getEnabled(),
                    liveChange: this._fnChange,
                    layoutData: this._oLayoutData,
                    maxLength: 4
                };

                /*eslint-disable */
                /*if (this.getMandatory()) {
                    oAttributes.value.constraints = {
                        nullable: false,
                        minimum: 1800,
                        maximum: 9999
                    };
                }*/
                /*eslint-enable */
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

                if (this.getMandatory()) {
                    oAttributes.selectedButton = "UNSELECTED";
                }
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
            /*eslint-disable */
            _checkClientError: function() {
                if (this.getMandatory() && this.getVisible()) {
                    if (!this.mandatoryCheck()) {
                        this.addMandatoryMessage();
                    } else {
                        if (this._oModel) {
                            var aMessage = this._oModel.getMessagesByPath(this._getFullValuePath()) || [];
                            this._oMessageManager.removeMessages(aMessage);
                            this._oError = null;
                        }
                    }
                }

                this.setSubstepIconStatus(this);
            },
            /*eslint-enable */

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
                    case ControlTypes.CURRENCY:
                        slValue = this._oControl.getValue().toString();
                        sValue = slValue.replace(/,/g, "");
                        this._oModel.setProperty(this.getValuePath(), sValue, oContext);
                        break;
                    case ControlTypes.YEAR:
                        sValue = this._oControl.getValue().toString();
                        this._oModel.setProperty(this.getValuePath(), sValue, oContext);
                        break;
                    case ControlTypes.TEXT:
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
                //In case of Dependent mandatory fields this method wil be called..
                //before onAfterRendering. we need the Bundle & Model to set the..
                //Error message
                if (!this._oModel && this.getBindingContext()) {
                    this._oModel = this.getBindingContext().getModel();

                    if (!this._oBundle) {
                        this._oBundle = this.getModel("i18n").getResourceBundle();
                    }
                }
                if (this._oBundle) {
                    var sMsg = this._oBundle.getText("MANDATORY_FIELD", [this.getLabel()]);
                    this.addMessage(sMsg);
                    this._oError = true;
                }
            },

            /**
             * Mandatory check, determine if valid entry for control
             * @return {boolean} is valid
             */
            mandatoryCheck: function() {
                var sValue;
                switch (this.getControlType()) {
                    case ControlTypes.BUTTONS:
                        sValue = this.getModel().getObject(this.getBindingContext().sPath).String;
                        var bValid = (!!sValue.trim());
                        if (bValid) {
                            this._oControl.removeStyleClass("rrSegmentError");
                        } else {
                            this._oControl.addStyleClass("rrSegmentError");
                        }
                        return bValid;
                    case ControlTypes.COMBO:
                        sValue = this._oControl.getSelectedKey();
                        return (!!sValue.trim());
                    case ControlTypes.MULTI_COMBO:
                        return (!!this._oControl.getSelectedKeys().filter(function(v) {
                            return v !== '';
                        }).length);
                    case ControlTypes.DATE:
                    case ControlTypes.TEXT:
                        sValue = this._oControl.getValue();
                        return (!!sValue.trim());
                    case ControlTypes.NUMBER:
                        return (!!this._oControl.getValue());
                    case ControlTypes.YEAR:
                    case ControlTypes.CURRENCY:
                        return (!!this._oControl.getValue());
                        /*eslint-disable */
                    case ControlTypes.MDATE:
                        return this._oControl.getTokens().length;
                        break;
                    case ControlTypes.MTEXT:
                        return this._oControl.getTokens().length;
                        break;
                    case ControlTypes.MCURRENCY:
                        return this._oControl.getTokens().length;
                        break;
                    case ControlTypes.MNUMBER:
                        return this._oControl.getTokens().length;
                        break;
                    case ControlTypes.MYEAR:
                        return this._oControl.getTokens().length;
                        break;

                    default:
                        return true;
                }
            },
            /*eslint-enable */

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
             * parse number from string with allowing ,
             * @param  {sting} sValue value
             * @return {number}        pased value
             */
            parseNumber1: function(sValue) {
                return sValue.match(/[0-9.]+/);
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

                            if (sValue !== "" && !this.isNumber(sValue)) {
                                //update DOM without triggering format
                                oEvent.getSource()._$input.val(this.parseNumber1(sValue));
                            }
                            break;

                        case ControlTypes.CURRENCY:

                            if (sValue !== "" && !this.isNumber(sValue)) {
                                //update DOM without triggering format
                                oEvent.getSource()._$input.val(this.parseNumber1(sValue));
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
                    
                    if (this.getControlType() === ControlTypes.BUTTONS && this.getReverseButtons()) {
                        if (!bVisible) {
                           bVisible = true;
                           } else {
                           bVisible = false;
                          }
                        
                      }
                    var i, oDependentContext;
                    var ilen = aAttributes.length;
                    for (i = 0; i < ilen; i++) {
                        if (aAttributes[i] && sap.ui.getCore().byId(aAttributes[i])) {
                            oDependentContext = sap.ui.getCore().byId(aAttributes[i]).getBindingContext();
                            this._oModel.setProperty("Visible", bVisible, oDependentContext);
                            if (!bVisible) {
                                this.clearDepenMessages(aAttributes[i]);
                            }
                        }
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
                                if (oCurrfield._oModel) { // eslint-disable-line no-use-before-define
                                    var aMessage = oCurrfield._oModel.getMessagesByPath(oCurrfield._getFullValuePath()) || [];
                                    oCurrfield._oMessageManager.removeMessages(aMessage);
                                    oCurrfield._oError = null;
                                }
                            }
                        }

                    }
                });
                /*eslint-enable */

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
                var sListStatus = "S";
                oviewControl.getComponent().listIds.forEach(function(item) {

                    if (oSubstep === item.SubStep) {

                        item.Status = oStatus;
                    }
                    if (item.Status === "E") {
                        sListStatus = "E";
                    }

                });

                oviewControl.setApplicationstepStatus(oviewControl, sListStatus);
            },

            /*eslint-disable */
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
            },
            /*eslint-enable */
            /**
             * create Multi Date picker control
             * @return {control} date picker
             */
            _createMDatePicker: function() {
                var aArray = this._stringtoArray(this.getMvaluePath(), "/");
                var aTokens = [];
                if (aArray) {
                    aTokens = this._arraytoTokens(aArray);
                }

                var oAttributes = {
                    layoutData: this._oLayoutData,
                    valueHelpRequest: this._onValueHelpRequest,
                    tokens: aTokens,
                    tokenChange: this._onChangeofTokens,
                    width: "100%"
                };

                return new MultiInput(oAttributes);
            },

            /**
             * create Multi Input Control
             * @return {control} date picker
             */
            _createMInputText: function() {
                var aArray = this._stringtoArray(this.getMvaluePath(), "");
                var aTokens = [];
                if (aArray) {
                    aTokens = this._arraytoTokens(aArray);
                }

                var oAttributes = {
                    layoutData: this._oLayoutData,
                    valueHelpRequest: this._onValueHelpRequest,
                    tokens: aTokens,
                    tokenChange: this._onChangeofTokens,
                    width: "100%"
                };

                return new MultiInput(oAttributes);
            },

            /**
             * create Multi InputControl
             * @return {control} Multi Input
             */
            _createMInputNumber: function() {

                var aArray = this._stringtoArray(this.getMvaluePath(), "");
                var aTokens = [];
                if (aArray) {
                    aTokens = this._arraytoTokens(aArray);
                }

                var oAttributes = {
                    layoutData: this._oLayoutData,
                    valueHelpRequest: this._onValueHelpRequest,
                    tokens: aTokens,
                    tokenChange: this._onChangeofTokens,
                    width: "100%"
                };

                return new MultiInput(oAttributes);
            },

            /**
             * create Multi Date picker control
             * @return {control} date picker
             */
            _createMInputCurrency: function() {

                var aArray = this._stringtoArray(this.getMvaluePath(), "");
                var aTokens = [];
                if (aArray) {
                    aTokens = this._arraytoTokens(aArray);
                }

                var oAttributes = {
                    layoutData: this._oLayoutData,
                    valueHelpRequest: this._onValueHelpRequest,
                    tokens: aTokens,
                    tokenChange: this._onChangeofTokens,
                    width: "100%"
                };

                return new MultiInput(oAttributes);
            },

            /**
             * create Multi Date picker control
             * @return {control} date picker
             */
            _createMInputYear: function() {

                var aArray = this._stringtoArray(this.getMvaluePath(), "");
                var aTokens = [];
                if (aArray) {
                    aTokens = this._arraytoTokens(aArray, "");
                }

                var oAttributes = {
                    layoutData: this._oLayoutData,
                    valueHelpRequest: this._onValueHelpRequest,
                    tokens: aTokens,
                    tokenChange: this._onChangeofTokens,
                    width: "100%"
                };

                return new MultiInput(oAttributes);
            },

            /*eslint-disable */
            _stringtoArray: function(sValues, sDseperator) {
                var aData;
                var oProp = {};
                var that = this;
                var fDate;
                if (sValues) {
                    aData = sValues.split(ControlTypes.SEPERATOR);

                    var oJsonData = [];
                    aData.forEach(function(oValue) {
                        oProp = {};
                        var sYear;
                        var sMonth;
                        var sDay;
                        switch (that.getControlType()) {
                            case ControlTypes.MDATE:
                                sYear = oValue.slice(0, 4);
                                sMonth = oValue.slice(4, 6);
                                sDay = oValue.slice(6, 8);
                                if (sDseperator === "/") {
                                    oProp.value = sDay + sDseperator + sMonth + sDseperator + sYear;
                                }
                                if (sDseperator === "-") {
                                    fDate = sYear + "-" + sMonth + "-" + sDay;
                                    oProp.value = new Date(fDate);
                                }
                                break;
                            default: //ControlTypes.MTEXT:
                                oProp.value = oValue;
                                break;
                        }

                        oJsonData.push(oProp);
                    });

                    return oJsonData;
                }
            },
            /*eslint-enable */

            _arraytoTokens: function(oValues) {

                var oToken;
                var aTokens = [];
                var iIndex = 0;
                oValues.forEach(function(dDate) {
                    iIndex = iIndex + 1;
                    oToken = {};
                    oToken = new Token({
                        key: iIndex,
                        text: dDate.value
                    });
                    aTokens.push(oToken);
                });
                return aTokens;

            },

            onChangeofTokens: function() {
                var aTokens = this._oControl.getTokens();

                this._updateMBinding(this._tokenstoString(aTokens));

                if (this._hasClientError()) {
                    var aMessage = this._oModel.getMessagesByPath(this._getFullValuePath()) || [];
                    this._oMessageManager.removeMessages(aMessage);
                    this._oError = null;
                }
                this._checkClientError();
                if (this._oError) {
                    this._oControl.addStyleClass("rrSegmentError");

                } else {

                    this._oControl.removeStyleClass("rrSegmentError");
                }
            },

            _updateMBinding: function(sValue) {
                var oContext = this.getBindingContext();
                this._oModel.getContext(oContext.sPath).getObject().String = sValue;
                this._oModel.setProperty("String", sValue, oContext, true);
            },

            /*eslint-disable */
            _tokenstoString: function(oTokens) {

                var that = this;
                var sValue;
                var oValue;
                var bFirst = true;
                oTokens.forEach(function(oToken) {
                    oValue = "";

                    switch (that.getControlType()) {
                        case ControlTypes.MDATE:
                            oValue = that._formatStringtoDate(oToken.getText());
                            break;
                        default:
                            oValue = oToken.getText();
                            break;
                    }
                    if (bFirst) {
                        sValue = oValue;
                        bFirst = false;
                    } else {
                        sValue = sValue + ControlTypes.SEPERATOR + oValue;
                    }

                });
                return sValue;

            },
            /*eslint-enable */

            _formatStringtoDate: function(sDate) {

                var aValues = sDate.split("/");
                return aValues[2] + aValues[1] + aValues[0];

            },
            _parseDatetoyyyymmdd: function(oDate) {
                var sMonth = oDate.getMonth() + 1;

                var sString = this._formatDateValue(oDate.getFullYear().toString()) +
                    this._formatDateValue(sMonth.toString()) +
                    this._formatDateValue(oDate.getDate().toString());
                return sString;
            },

            /*eslint-disable */
            /**
             * Append Zero if the length of value is 1.
             * @public
             * @param {String} [sValue] value
             */
            _formatDateValue: function(sValue) {
                var sTime = sValue;
                if (sTime.toLocaleString().length === 1) {
                    return "0" + sTime;
                }
                return sTime;
            },

            _onValueHelp: function() {

                var oMvalueModel = this._getVModel();
                var oField = {};
                var that = this;
                var sFieldId = this.getId();
                var sFragmentId = "idFragmentId" + sFieldId;
                this._oValueHelpDialog = sap.ui.xmlfragment(sFragmentId, "aklc.cm.components.formData.view.ValueHelp", this);
                var sValuepath = "{mValues" + ">" + "value" + "}";
                var sValuepath1 = "mValues" + ">/" + sFieldId;
                this._oValueHelpDialog.setModel(oMvalueModel, "mValues");
                switch (this.getControlType()) {
                    case ControlTypes.MDATE:
                        oField = new DatePicker({
                            displayFormat: "dd/MM/yyyy",
                            dateValue: sValuepath
                        });

                        break;
                    case ControlTypes.MTEXT:
                        oField = new Input({
                            value: sValuepath
                        });
                        break;
                    case ControlTypes.MCURRENCY:
                        oField = new Input({
                            value: sValuepath,
                            liveChange: function(oEvent) {
                                that.parseMnumber(oEvent);
                            }
                        });
                        break;
                    case ControlTypes.MNUMBER:
                        oField = new Input({
                            value: sValuepath,
                            liveChange: function(oEvent) {
                                that.parseMnumber(oEvent);
                            }
                        });
                        break;
                    case ControlTypes.MYEAR:
                        oField = new Input({
                            value: sValuepath,
                            maxLength: 4,
                            liveChange: function(oEvent) {
                                that.parseMyear(oEvent);
                            }
                        });
                        break;
                }
                /*eslint-enable */
                var oScrollContainer = this._oValueHelpDialog.getContent()[1];
                var oRowRepeater = new RowRepeater({
                    design: "Transparent",
                    currentPage: 1
                });
                var oLabel = new Label({
                    text: this.getLabel(),
                    design: "Bold",
                    tooltip: this.getLabel()
                });

                var oDelButton = new Button({
                    icon: "sap-icon://sys-cancel",
                    type: "Transparent",
                    tooltip: "{i18n>Delete}",
                    press: function(oEvent) {
                        that.onDeleteRow(oEvent);
                    }
                });

                oDelButton.addStyleClass("sapUiSmallMarginBegin");
                oDelButton.addStyleClass("sapUiSmallMarginEnd");

                oLabel.addStyleClass("sapUiSmallMarginEnd");
                oLabel.addStyleClass("sapUiSmallMarginTop");
                var oLayout = new HorizontalLayout({
                    content: [
                        oLabel, oField, oDelButton
                    ]
                });
                oLayout.addStyleClass("LayoutStyle");

                // attach data to the RowRepeater
                oRowRepeater.setModel(oMvalueModel).bindRows({
                    path: sValuepath1,
                    template: oLayout
                });
                this._oRowRepeater = oRowRepeater;
                oScrollContainer.addContent(oRowRepeater);
                this._oValueHelpDialog.setContentWidth("25%");
                this._oValueHelpDialog.open();

            },

            _getVModel: function() {
                var sString = this._oModel.getContext(this.getBindingContext().sPath).getObject().String;
                var oValueHelpModel = this.getModel("mValues");
                if (!oValueHelpModel) {
                    oValueHelpModel = new JSONModel();
                    this.setModel(oValueHelpModel, "mValues");
                }
                var aData;
                switch (this.getControlType()) {
                    case ControlTypes.MDATE:
                        aData = this._stringtoArray(sString, "-");
                        break;
                    default:
                        aData = this._stringtoArray(sString, "");

                }

                oValueHelpModel.oData[this.getId()] = [];
                if (aData) {
                    oValueHelpModel.oData[this.getId()] = aData;
                }

                return oValueHelpModel;
            },

            onAddRow: function() {
                var oMultiInput = {};
                var oModel = this.getModel("mValues");
                switch (this.getControlType()) {
                    case ControlTypes.MDATE:
                        oMultiInput.value = new Date();
                        break;
                    default:
                        oMultiInput.value = "";
                        break;
                }
                oModel.oData[this.getId()].push(oMultiInput);
                oModel.refresh(true);
            },

            /*eslint-disable */
            onDeleteRow: function(oEvent) {
                oEvent.getSource().getParent().destroy();
                var oModel = oEvent.getSource().getModel("mValues");
                var that = this;
                var oProp = {};
                var aArray = [];
                /*eslint-enable */
                this._oRowRepeater.getRows().forEach(function(oRow) {
                    oProp = {};
                    switch (that.getControlType()) {
                        case ControlTypes.MDATE:
                            oProp.value = oRow.getContent()[1].getDateValue();
                            break;
                        default:

                            oProp.value = oRow.getContent()[1].getValue();

                    }
                    aArray.push(oProp);
                });
                oModel.oData[this.getId()] = aArray;
                oModel.refresh(true);

            },

            handleClose: function() {

                this._oValueHelpDialog.destroy();

            },

            _handleOk: function() {

                var sValue = this._getStringFromRowRep();
                this._updateMBinding(sValue);

                var aArray;

                switch (this.getControlType()) {
                    case ControlTypes.MDATE:
                        aArray = this._stringtoArray(sValue, "/");
                        break;
                    default:
                        aArray = this._stringtoArray(sValue, "");
                        break;
                }

                var aTokens = [];
                if (aArray) {
                    aTokens = this._arraytoTokens(aArray);
                }
                this._oControl.setTokens(aTokens);
                this._oValueHelpDialog.destroy();

            },

            /*eslint-disable */
            _getStringFromRowRep: function() {

                var sString;
                var bisFirst = true;
                var that = this;
                this._oRowRepeater.getRows().forEach(function(oRow) {

                    switch (that.getControlType()) {
                        case ControlTypes.MDATE:
                            if (bisFirst) {
                                sString = that._parseDatetoyyyymmdd(oRow.getContent()[1].getDateValue());
                                bisFirst = false;
                            } else {
                                sString = sString + ControlTypes.SEPERATOR + that._parseDatetoyyyymmdd(oRow.getContent()[1].getDateValue());
                            }
                            break;
                        default:
                            if (bisFirst) {
                                sString = oRow.getContent()[1].getValue();
                                bisFirst = false;
                            } else {
                                sString = sString + ControlTypes.SEPERATOR + oRow.getContent()[1].getValue();
                            }
                            break;
                    }
                });
                return sString;

            },
            /*eslint-enable */

            parseMyear: function(oEvent) {
                if (oEvent.getId() === "liveChange") {
                    var sValue = oEvent.getParameters().newValue;
                    if (sValue !== "" && !this.isInteger(sValue)) {
                        oEvent.getSource().setValue(this.parseInteger(sValue));
                    }
                }
            },
            parseMnumber: function(oEvent) {
                if (oEvent.getId() === "liveChange") {
                    var sValue = oEvent.getParameters().newValue;
                    if (sValue !== "" && !this.isInteger(sValue)) {
                        oEvent.getSource().setValue(this.parseNumber1(sValue));
                    }
                }
            }

        });
    }, true);