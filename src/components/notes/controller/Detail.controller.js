sap.ui.define([
    "aklc/cm/library/common/controller/BaseController",
    "sap/m/MessageToast",
    "aklc/cm/library/common/controller/Validation"
], function(BaseController, MessageToast, Validation) {
    "use strict";

    return BaseController.extend("aklc.cm.components.notes.controller.Detail", {
        _sNotesCollection: "Notes",
        _formFields: ["type", "priority", "subject"],
        _readOnlyFormFields: ["entryDate", "createdBy"],
        _sUpdate: "UPDATE",
        _sCreate: "CREATE",
        _sSaveId: "add",
        _sChannelId: "notes",
        _oMainController: "",

        /**
         * on init
         *
         */
        onInit: function() {
            BaseController.prototype.onInit.apply(this);
            this._oForm = this._oView.byId("NOTES_FORM");
            this.oComponent = this.getOwnerComponent();

            this._oBundle = this.getComponent().getModel("i18n").getResourceBundle();

            this.oValidation = new Validation(this);

            this._oMessageManager = sap.ui.getCore().getMessageManager();
            this._oMessageManager.registerObject(this.getView(), true);

            /*eslint-disable */
            var that = this;
            /*eslint-enable */

            that.toggleEditableFields(false);
            that.getView().byId("notes").setEditable(false);
            that.getView().byId("add").setVisible(false);
            if (!this.oTemplate) {
                this.oTypeTemplate = this.byId("typeItem").clone();
                this.oImpactTemplate = this.byId("impactItem").clone();
            }

            this.getEventBus().subscribe("notes", "refreshNotesForm",
                function(sChannelId, sEventId, oData) {

                    that._oContext = oData.context;
                    that._oForm.setBindingContext(oData.context);

                    that.currentValueNotes = that.getView().byId("notes").getValue();
                    //that.getView().getModel().refresh(true);

                    //Make form fields read-only
                    if (oData.action === that._sUpdate) {
                        that.oComponent._setViewModelProperty("UpdateBtn_Visible", true);

                        var flag = false; //not a migrated note  
                        flag = that.getView().getModel().getProperty("MigratedFlag", oData.context);
                        if (!flag) {

                            that.toggleEditableFields(true);
                            that.getView().byId("notes").setEditable(true);
                               if (oData.context.getObject().TextType === "") {
                                        that.getView().byId("type").setEditable(true);
                                } else {
                            that.getView().byId("type").setEditable(false);
                            };
                            that.getView().byId("add").setVisible(true);

                        } else {
                            that.toggleEditableFields(false);
                            that.getView().byId("notes").setEditable(false);
                            that.getView().byId("add").setVisible(false);
                        }

                    } else if (oData.action === that._sCreate) {

                        that.getView().byId("notes").setEditable(true);
                        that.toggleEditableFields(true);
                        that.getView().byId("add").setVisible(true);

                    }
                });
        },

        afterAdd: function() {
            this.toggleEditableFields(false);
            this.getView().byId("notes").setEditable(false);
            this.getView().byId("add").setVisible(false);
        },
        toggleEditableFields: function(editable) {
            var edit = editable;
            this._formFields.forEach(
                function(obj) {
                    this.getView().byId(obj).setEditable(edit);

                }.bind(this)
            );
        },

        // Get Application ID and pass it to source which will return url
        onPressApplicationID: function(oEvent) {
            var sStepGuid = oEvent.getSource().getBindingContext().getProperty("NotesGuid");
            var sQuery = "Component eq 'NOTES' and Parameter2 eq guid'" + sStepGuid + "'";
            if (sStepGuid != null) { // eslint-disable-line no-use-before-define
                this._oModel.read("/ApplicationLinks", {
                    urlParameters: {
                        "$filter": sQuery
                    },

                    success: function(oData) {
                        window.open(oData.results[0].Url);
                    }
                });
            }
        },

        formatNotesLog: function(NotesLogValue) {
            if ((NotesLogValue) && (NotesLogValue === "X")) {
                return true;
            } else {
                return false;
            }
        },


        onContextChanged: function(sChannel, sEvent, oData) {
            this._oMainController = oData.controller;
            this._sStepKey = this._oModel.getProperty("StepKey", oData.context);

            var aFilterBy = [];
            aFilterBy.push(new sap.ui.model.Filter("StepKey", sap.ui.model.FilterOperator.EQ, this._sStepKey));

            this.byId("type").bindAggregation("items", {
                path: "/VH_NotesType",
                sorter: null,
                parameters: null,
                template: this.oTypeTemplate,
                filters: aFilterBy
            });

            this.byId("priority").bindAggregation("items", {
                path: "/VH_NotesImpact",
                sorter: null,
                parameters: null,
                template: this.oImpactTemplate,
                filters: aFilterBy
            });
            this._oMainController = oData.controller;
        },

        resetDateField: function(date, id) {
            this.getView().byId(id).setDateValue(date);
        },

        /**
         * get Field By Id
         * @param  {string} sId id of the field
         * @return {object}     control
         */
        getFieldById: function(sId) {
            return sap.ui.getCore().byId(sId);
        },

        /**
         * changes are stored in a deferred batch call, here we submit them
         * @return {[type]} [description]
         */

        /**
         * on Check Valid Event
         * @param  {string} sChannel [description]
         * @param  {string} sEvent   [description]
         * @param  {object} oData    [description]
         */
        onCheckValid: function(sChannel, sEvent, oData) {
            var oCreateMode = this.oComponent._oViewModel.getProperty("/CreateMode");
            if (oCreateMode === false) {
                this._oModel.deleteCreatedEntry(this._oContext);
            }

            this.oComponent._oViewModel.setProperty("/CreateMode", true);
            this.oComponent._setViewModelProperty("SaveBtn_Visible", false);
            this.oComponent._setViewModelProperty("UpdateBtn_Visible", false);
            this.formatValues(true);
            oData.WhenValid.resolve();
        },

        /*eslint-disable */
        onAdd: function() {

            var that = this;
            var oController = this;
    var oSubject = this.getView().byId("subject");
oSubject.setValueState("None");
            if ((!this._oMainResolve) || (this._oMainResolve.ValidationRequired === "X")) {
                if (this.byId("notes").getBindingContext()) {
                    this.oValidation.validateForm();
                    this.validateNotes();
                }
            }

            if (!this.oValidation._oError) {

                this.formatValues(false);

                if (this._oModel.hasPendingChanges()) {

                    // Set Busy Indicator
                    this.getView().getParent().setBusyIndicatorDelay(0);
                    this.getView().getParent().setBusy(true);

                    //Refresh the frame work Nav Bar Icon Refresh
                    var sPath = "/" + this._oModel.createKey(this._oMainController._sStepsCollection, {
                        ApplicationKey: this._oMainController._sProcessKey,
                        StepKey: this._oMainController._sStepKey
                    });

                    // submit the changes (creates entity at the backend)
                    this._oModel.submitChanges({
                        success: function(oResponses) {

                            //Back end Error messages handling for Footer buttons    
                            var bErrorFlag = false;

                            $.each(oResponses.__batchResponses, function(i, oResponse) {
                                if (oResponse.response) {
                                    var sBody = oResponse.response.body;
                                    var oError = JSON.parse(sBody);

                                    $.each(oError.error.innererror.errordetails, function(j, oError) {
                                        if (oError.severity === "error") {
                                            bErrorFlag = true;
                                            return false;
                                        }
                                    });

                                    if (bErrorFlag === true) {
                                        return false;
                                    }
                                }
                            });

                            if (bErrorFlag === true) {

                                oController.deleteDuplicateMessages();

                                var aRemoveEntites = [];
                                $.each(oController._oModel.mChangedEntities, function(sPath, oEntity) {
                                    if ((sPath.substring(0, 16)) === "ApplicationHold(") {
                                        // Fill for Application Hold entities
                                        sPath = '/' + sPath;
                                        aRemoveEntites.push(sPath);
                                    }
                                });
                                /*eslint-enable */

                                if (aRemoveEntites.length > 0) {
                                    // Delete only Application Hold Entites changes
                                    oController._oModel.resetChanges(aRemoveEntites);
                                }
                                // Remove the busy Indicator
                                oController.getView().getParent().setBusy(false);
                                MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
                                jQuery.sap.log.error("Error adding new note");
                                if (oController._oMainResolve) {
                                    oController._oMainResolve.WhenValid.resolve("Error");
                                    oController._oMainResolve = "";
                                }
                            } else {
                                //Clear context for form
                                that.afterAdd();
                                //that.byId("add").setVisible(false);
                                that._oModel.getContext(sPath).getObject().Status = "S";
                                that._oModel.setProperty("Status", "S", that._oModel.getContext(sPath));
                                that._oMainController.refreshNavBarIcons();
                                that._oModel.submitChanges();
                                oController.oComponent._setViewModelProperty("UpdateBtn_Visible", false);

                                // Remove the busy Indicator
                                oController.getView().getParent().setBusy(false);
                                if (that.oComponent.oNotesMainController) {
                                    that.oComponent.oNotesMainController.bindRows();
                                }
                                //that.oComponent.oNotesRepeater.getBinding("rows").refresh();
                                //that.getView().getModel().refresh(true);

                                if (that._oMainResolve) {
                                    that._oMainResolve.WhenValid.resolve("Success");
                                    that._oMainResolve = "";
                                }
                            }
                        },
                        error: function() {
                            // Remove the busy Indicator
                            oController.getView().getParent().setBusy(false);
                            MessageToast.show(oController.getI18NText("UpdateFailedMessage"));
                            jQuery.sap.log.error("Error adding new note");
                            if (that._oMainResolve) {
                                that._oMainResolve.WhenValid.resolve("Error");
                                that._oMainResolve = "";
                            }
                        }
                    });
                    // Set the Icon Status as "Error" for Form Data user story icon in the Nav Bar        

                    this.oComponent._setViewModelProperty("CreateMode", true);
                    /*eslint-disable */
                } else {
                    MessageToast.show(this.getI18NText("NoChangeSaveMessage"));
                    this.getView().getParent().setBusy(false);
                    if (this._oMainResolve) {
                        this._oMainResolve.WhenValid.resolve("Info");
                        this._oMainResolve = "";
                    }
                }

            } else {
                if (this._oMainResolve) {
                    this._oMainResolve.WhenValid.resolve("Error");
                    this._oMainResolve = "";
                }
            }
            /*eslint-enable */
        },
        _setFormModelProperty: function(property, value) {
            this._oModel.setProperty(property, value, this._oForm.getBindingContext());
        },

        _getFormModelProperty: function(property) {
            return this._oModel.getProperty(property, this._oForm.getBindingContext());
        },

        formatType: function(sType) {
            var sPath = this._oModel.createKey("/VH_NotesType", {
                StepKey: this._sStepKey,
                TextId: sType,
                Language: "E",
                TextObject: "CRM_ORDERH"

            });

            var oContext = this._oModel.getContext(sPath);
            return this._oModel.getProperty("TextType", oContext);
        },

        formatImpact: function(sImpact) {
            var sPath = this._oModel.createKey("/VH_NotesImpact", {
                StepKey: this._sStepKey,
                Impact: sImpact
            });

            var oContext = this._oModel.getContext(sPath);
            return this._oModel.getProperty("Description", oContext);
        },
        formatString: function(text) {

            var innerText = "";
            var isFirst = true;
            var isTitle = true;
            if (text) {

                var obj = $.parseHTML(text);
                obj.forEach(function(entry) {
                    if (!isTitle) {
                        if (isFirst) {
                            innerText = entry.textContent;
                        } else {
                            innerText = innerText + "\n" + entry.textContent;
                        }
                        isFirst = false;
                    }
                    isTitle = false;
                });
                return innerText;

            }
            return text;

        },
        formatDate: function(date) {
            return this.Formatter.formatDate(date, "dd/MM/yyyy");
        },

        validateNotes: function() {

            //validate notes field and add message
            var oNotes = this.byId("notes");
            if (oNotes) {

                var valuepath = oNotes.getBindingContext().getPath() + "/" + oNotes.getBindingInfo("value").binding.getPath();

                var value = this.getView().byId("notes").getValue();
                if (!value) {
                    var label;
                    try {
                        label = this._oModel.getProperty(valuepath + "/#sap:label").value;
                    } catch (e) {
                        label = " ";
                    }
                    var sMsg = this._oBundle.getText("MANDATORY_FIELD", [label]);

                    this._oMessageManager.addMessages(
                        new sap.ui.core.message.Message({
                            message: sMsg,
                            type: sap.ui.core.MessageType.Error,
                            target: valuepath,
                            processor: this._oModel
                        })
                    );
                    this.oValidation._oError = true;
                }
            }

        },
        parseStringtoHtml: function(oValue) {

            var oFormatedString = "";
            var first = true;
            var oNotesArray = oValue.split("\n");

            oNotesArray.forEach(function(oline) {
                if (first) {

                    oFormatedString = "<p>" + oline + "</p>";

                } else {

                    oFormatedString = oFormatedString + "<p>" + oline + "</p>";
                }

                first = false;
            });

            return oFormatedString;

        },
        formatValues: function(onNext) {
            if (this.currentValueNotes !== this.getView().byId("notes").getValue()) {
                var prefixValue = "<HTML><HEAD><TITLE></TITLE></HEAD><BODY>";
                var midValue = this.parseStringtoHtml(this.byId("notes").getValue());

                var postfixValue = "</BODY></HTML>";
                var finalValue = prefixValue + midValue + postfixValue;
                this._setFormModelProperty("Text", finalValue);
                if (!onNext) {

                    this._setFormModelProperty("TextType", this.formatType(this._getFormModelProperty("TextId")));
                    this._setFormModelProperty("ImpactDesc", this.formatImpact(this._getFormModelProperty("Impact")));

                    this._oForm.setBindingContext(null);
                }
            }
        },

        /**
         * Returns I18N text for the provided text key. Placeholders in the text will be replaced by parameters passed to this method.
         * 
         * @param {String} sTextKey The text key to get I18N text for.
         * @param {Array} aParameters The array of parameters for the text key.
         * @return {String} The text corresponding to the supplied key and parameters.
         * @public
         *
         */
        getI18NText: function(sTextKey, aParameters) {
            return this.getView().getModel("i18n").getResourceBundle().getText(sTextKey, aParameters);
        },
        /**
         * Delete duplicate messages                    
         */
        deleteDuplicateMessages: function() {

            var aFinalMessages = [];
            var bUpdate = false;

            var aMessages = sap.ui.getCore().getMessageManager().getMessageModel().oData;
            $.each(aMessages, function(i, oMessage) {

                if (aFinalMessages.length === 0) {
                    // Add only Unique message
                    aFinalMessages.push(oMessage);
                    return true;
                }

                bUpdate = false;
                // Check for duplicate messages
                $.each(aFinalMessages, function(j, oFinalMessage) {
                    if (oFinalMessage.message === oMessage.message) {
                        bUpdate = true;
                        return false;
                    }
                });

                if (bUpdate === false) {
                    // Add only Unique message
                    aFinalMessages.push(oMessage);
                }

            });

            // Replace duplicate messages and refresh it
            sap.ui.getCore().getMessageManager().removeAllMessages();
            sap.ui.getCore().getMessageManager().getMessageModel().oData = [];
            sap.ui.getCore().getMessageManager().getMessageModel().oData = aFinalMessages;
            sap.ui.getCore().getMessageManager().getMessageModel().refresh();

        },
        /**
         * on Submit Changes Event is a base controller event, it is triggered
         * by component, the components sends a deferred promise if the call
         * is valid, no errors, the promise is resolved
         * @param  {string} sChannel [description]
         * @param  {string} sEvent   [description]
         * @param  {object} oData    [description]
         */
        onSubmitChanges: function(sChannel, sEvent, oData) {
            this._oMainResolve = oData;
            // Get the Add Button reference
            var oAddButton = this.getView().byId("add");
            // Fire the Press event 
            oAddButton.firePress();
        },
        onSubjectLC: function(oEvent){
            var oSubject = this.getView().byId("subject");
            if(oEvent.getParameters().value.length === 40){
          oSubject.setValueState("Error");
        //  oSubject.setValueStateText("Allowed Maximum 40 Characters");
            }
            else{
               oSubject.setValueState("None");
        }
             }
    });
});