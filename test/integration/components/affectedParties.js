sap.ui.require([
        "sap/ui/test/Opa5",
        "test/integration/components/Common"
    ],
    function(Opa5, Common) {
        "use strict";

        var sBaseViewPath = "aklc.cm.components.parties.view.";
        var sMasterView = sBaseViewPath + "Master";
        var sDetailView = sBaseViewPath + "Detail";

        var sRowRepeaterId = "parties";

        var sSupport = "Support";
        var sOwner = "Owner";

        Opa5.createPageObjects({
            onAffectedPartiesStep: {
                baseClass: Common,
                ///ACTIONS///
                actions: {
                    iSelectOwnerRow: function() {
                        return this.iPressARowRepeaterItem(sMasterView, sRowRepeaterId, "PartyTypeText", sOwner);
                    },

                    iSeeInputFieldsNotEditable: function() {
                        this.iSeeFieldWithProperty(sDetailView, "partyTypeText", "editable", false);
                        this.iSeeFieldWithProperty(sDetailView, "legalDescription", "editable", false);
                        this.iSeeFieldWithProperty(sDetailView, "propertyAddress", "editable", false);
                        this.iSeeFieldWithProperty(sDetailView, "mailingAddress", "editable", false);
                        return this;
                    },


                    iChangeResponse: function() {
                        return this.iSelectComboBoxItem(sDetailView, "response", sSupport);
                    },

                    iSortTheListOnPartyName: function() {
                        return this.iPressACommonsButton(sMasterView, "text", "Party Name");
                    },

                    iSortTheListOnPartyType: function() {
                        return this.iPressACommonsButton(sMasterView, "text", "Party Type");
                    },

                    iSortTheListOnResponse: function() {
                        return this.iPressACommonsButton(sMasterView, "text", "Response");
                    },

                    iFilterTheListOwner: function() {
                        return this.iPressACommonsButton(sMasterView, "text", "Owner");
                    },

                    iFilterTheListOccupant: function() {
                        return this.iPressACommonsButton(sMasterView, "text", "Occupant");
                    },

                    iFilterTheListOther: function() {
                        return this.iPressACommonsButton(sMasterView, "text", "Other");
                    },

                    iPressThePlusIcon: function() {
                        return this.iPressTheIconButton(sMasterView, "Plus", "sap-icon://add");
                    },

                    iRemoveFilters: function() {
                        return this.iPressTheIconButton(sMasterView, "Refresh", "sap-icon://refresh");
                    },

                    iPressTheFilterIcon: function() {
                        return this.iPressTheIconButton(sMasterView, "Reset", "sap-icon://filter");
                    },

                    iSelectSupport: function() {
                        return this.iPressAStandardListItem("Title", sSupport);
                    },

                    iCanSeeTheFilterDialog: function() {
                        return this.waitFor({
                            id: "PartyFilters", //-dialog",
                            viewName: undefined,
                            check: function(oDialog) {
                                return oDialog._dialog.isOpen();
                            },
                            success: function(oDialog) {
                                ok(true, "Filter dialog is open");
                            },
                            errorMessage: "Filter dialog not found"
                        });

                    },

                    iPressOnFilterByResponse: function() {
                        return this.iPressAnObjectListItem(undefined, "PartyFilters-filterlist", "Response");
                    },

                    iPressFilterDialogOK: function() {
                        return this.iPressTheButton(undefined, "text", "OK", "OK");
                    },

                    iSelectPartyName: function() {
                        this.iClickInputValueHelp(sDetailView, "partnerSearch__vhi");
                        this.iTapObjectIdentifier("Amanaki & Christine Tupou");
                        return this;
                    },


                    iPressUpdate: function() {
                        return this.iPressACommonsButton(sDetailView, "text", "Update");
                    },

                    iPressSave: function() {
                        return this.iPressACommonsButton(sDetailView, "text", "Save");
                    },

                    iPressTheDeleteIconOnGrantedRow: function() {
                        var oRowItem = null;

                        return this.waitFor({
                            id: sRowRepeaterId,
                            viewName: sMasterView,
                            check: function(oRowRepeater) {
                                // find rows where value matches
                                return oRowRepeater.getRows().some(function(oRow) {
                                    if (oRow.getBindingContext().getProperty("CanBeDeleted") === true) {
                                        oRowItem = oRow;
                                        return true;
                                    }
                                    return false;
                                });
                            },
                            success: function() {
                                var oDeleteIcon = oRowItem.getContent()[oRowItem.getContent().length - 1];
                                oDeleteIcon.$().focus().click().blur();
                                ok(true, "Row Delete Pressed");
                            },
                            errorMessage: "Row Not Found"
                        });
                    },

                    iPressTheYesButton: function() {
                        return this.iPressACommonsButton(undefined, "id", "YesBtn");
                    }


                },

                ///ASSERTIONS///
                assertions: {
                    iShouldSeeThePartnersList: function() {
                        return this.iShouldSeeTheRowRepeater(sMasterView, sRowRepeaterId);
                    },

                    theOwnerRowShouldBeHighLighted: function() {
                        return this.theCorrectRowRepeaterRowIsSelected(sMasterView, sRowRepeaterId, "PartyTypeText", sOwner);
                    },

                    theDetailsShouldShowOwner: function() {
                        return this.waitFor({
                            id: "partyTypeText",
                            viewName: sDetailView,
                            success: function(oInput) {
                                var sValue = oInput.getValue();
                                ok(sValue.indexOf(sOwner) > -1, "The Details View shows the correct Partner Function '" + sValue + "'");
                            },
                            errorMessage: "The row cannot be found."
                        });
                    },

                    theListShouldBeSortedAscendingByPartyName: function() {
                        return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "PartyName");
                    },

                    theListShouldBeSortedDescendingByPartyName: function() {
                        return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "PartyName", true);
                    },

                    theListShouldBeSortedAscendingByPartyType: function() {
                        return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "PartyType");
                    },

                    theListShouldBeSortedDescendingByPartyType: function() {
                        return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "PartyType", true);
                    },

                    theListShouldBeSortedAscendingByResponse: function() {
                        return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "Response");
                    },

                    theListShouldBeSortedDescendingByResponse: function() {
                        return this.theRowRepeatedShouldBeSortedByField(sMasterView, sRowRepeaterId, "Response", true);
                    },

                    theListShouldShowOwnerRecords: function() {
                        return this.theRowRepeaterShouldShowOnly(sMasterView, sRowRepeaterId, "PartyType", "OWNER");
                    },

                    theListShouldShowOccupantRecords: function() {
                        return this.theRowRepeaterShouldShowOnly(sMasterView, sRowRepeaterId, "PartyType", "OCCUP");
                    },

                    theListShouldShowOtherRecords: function() {
                        return this.theRowRepeaterShouldShowOnly(sMasterView, sRowRepeaterId, "PartyType", "OTHER");
                    },

                    theListShouldShowSupportRecords: function() {
                        return this.theRowRepeaterShouldShowOnly(sMasterView, sRowRepeaterId, "ResponseText", sSupport);
                    },

                    theListShouldShowAllRecords: function() {
                        return this.iShouldSeeTheRowRepeater(sMasterView, sRowRepeaterId);
                    },

                    theNewAffectedPartyIsInRowRepeater: function() {
                        return this.waitFor({
                            id: sRowRepeaterId,
                            viewName: sMasterView,
                            check: function(oRowRepeater) {
                                return oRowRepeater.getRows().some(function(oRow) {
                                    var oData = oRow.getBindingContext().getObject();
                                    return ((oData.PartnerFullName === "Amanaki & Christine Tupou"));
                                });
                            },
                            success: function(oRowRepeater) {
                                ok(true, "New Affected PartnerFullName equals " + "Amanaki & Christine Tupou");

                            },
                            errorMessage: "The List contains invalid entries."
                        });

                    },

                    theUpdatedAffectedPartyIsInRowRepeater: function() {
                        return this.waitFor({
                            id: sRowRepeaterId,
                            viewName: sMasterView,
                            check: function(oRowRepeater) {
                                return oRowRepeater.getRows().some(function(oRow) {
                                    var oData = oRow.getBindingContext().getObject();
                                    return ((oData.PartnerFullName === "Abdullah Jabbar") && (oData.ResponseText === "Support"));
                                });
                            },
                            success: function(oRowRepeater) {
                                ok(true, "Updated Affected PartnerFullName equals " + "Abdullah Jabbar");

                            },
                            errorMessage: "The List contains invalid entries."
                        });

                    },

                    theListShouldNotContainThisRecord: function() {
                        return this.iShouldSeeTheRowRepeater(sMasterView, sRowRepeaterId);
                    }

                }
            }
        });
    });
