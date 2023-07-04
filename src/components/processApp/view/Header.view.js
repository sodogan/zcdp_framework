sap.ui.define([
  "sap/ui/core/mvc/JSView", "aklc/cm/components/processApp/controls/StatutoryClock"
], function(JSView, StatutoryClock) {
  "use strict";
  return sap.ui.jsview("aklc.cm.components.processApp.view.Header", {
    getControllerName: function() {
      return "aklc.cm.components.processApp.controller.Header";
    },

    /**
     * Get the Staturory Clock
    */
    // Get the Clock Details
    getClock: function() {
      return new StatutoryClock({
        clockColour: "{ClockColour}",
        daysCompleted: "{DaysCompleted}",
        daysRemaining: "{DaysRemaining}",
        clockText1: "{ClockText1}",
        clockText2: "{ClockText2}"
      });
    },
    /*eslint-disable */
    /**
     * Get the Application Description
     * @return {object} oLayout
    */
    getAppDescription: function() {
      var oLayout = new sap.ui.commons.layout.MatrixLayout({
        layoutFixed: true,
        columns: 1,
        width: "100%"
      });
      var oController = this.getController();
      oLayout.createRow(new sap.ui.layout.VerticalLayout({
        content: [

            new sap.ui.commons.Link({
                            text: "{Description}",
                            tooltip: "{Description}",
                            press: function(oEvent) {
                              oController.pressUrlOpen(oEvent);
                            }
                            }).addStyleClass("aklcApplicationId"),
            new sap.ui.commons.TextView({
            text: "{StatusText}",
            design: sap.ui.commons.LabelDesign.Bold
            //width: "100%"
          }).addStyleClass("acFormLabel")

        ]
      }));

      oLayout.createRow({
        height: "7.8em"
      }, new sap.ui.commons.layout.MatrixLayoutCell({
        content: [
          new sap.ui.layout.HorizontalLayout({
            content: [
              new sap.ui.commons.TextView({
                text: "{CustomField}",
                design: sap.ui.commons.LabelDesign.Bold
              }).addStyleClass("acFormLabel")
            ]
          })
        ]
      }));

      // oLayout.createRow({
      //  height: "1.1em"
      // }, new sap.ui.commons.layout.MatrixLayoutCell({
      //  content: [
      //    new sap.ui.layout.HorizontalLayout({
      //      content: [
      //        new sap.ui.commons.TextView({
      //          text: "OC - Account",
      //          design: sap.ui.commons.LabelDesign.Bold,
      //        }).addStyleClass("acFormLabel")
      //      ]
      //    })
      //  ]
      // }));

      return oLayout;
    },
    /*eslint-enable */
    /**
     * Get the Application Status
     * @return {object} oLayout
    */
    getAppStatus: function() {
      var oLayout = new sap.ui.commons.layout.MatrixLayout({
        layoutFixed: true,
        columns: 1,
        width: "100%"
      });

      oLayout.createRow(new sap.ui.commons.layout.MatrixLayoutCell({
        content: [
          new sap.ui.layout.VerticalLayout({
            content: [
              new sap.ui.commons.TextView({
                text: "{i18n>PropertyAddress}"
              }).addStyleClass("acFormLabel"), new sap.ui.commons.Label({
                text: "{PropertyAddress}",
                design: sap.ui.commons.LabelDesign.Bold,
                wrapping: false
              }).addStyleClass("acFormLabel")
            ]
          })
        ]
      }));
      oLayout.createRow({
        height: "8em"
      }, this.getWorkDescription());
      return oLayout;
    },
    /**
     * Get the Work Description
     * @return {object} oLayout
    */
    getWorkDescription: function() {
      var oController = this.getController();

      var oRichTooltip = new sap.ui.commons.RichTooltip({
        text: "{DescriptionOfWork}",
        title: "{i18n>descriptionOfWork}"
      });


      var oTextView = new sap.ui.commons.TextView({
        id: "idWorkDescription",
        text: "{DescriptionOfWork}",
        design: sap.ui.commons.LabelDesign.Bold,
        wrapping: false
      }).addStyleClass("acWorkDescriptionLabel");
      oTextView.setTooltip(oRichTooltip);

      var edit_icon = new sap.ui.core.Icon({
            size:"16px",
            id: "workdescription_editicon",
            src:"sap-icon://edit",
            color: "#0099FF",
            press: function (oEvent) {
                  oController.onEditDescription(oEvent);
              }
          }).addStyleClass("acWorkDescriptionIcon");
      
      edit_icon.addEventDelegate({
        onmouseover: function(oEvent){oController.DescTooltip(oEvent);}
      });

      var editablebtn = new sap.ui.layout.HorizontalLayout({
        content: [
          new sap.ui.commons.TextView({
            text: "{i18n>descriptionOfWork}"
            }).addStyleClass("acFormLabel"),edit_icon 
        ]
      });
      return new sap.ui.layout.VerticalLayout({
        content: [
          editablebtn, oTextView
        ]
      });

      //return new sap.ui.layout.VerticalLayout({
      //  content: [
      //    new sap.ui.commons.TextView({
      //      text: "{i18n>descriptionOfWork}"
      //    }).addStyleClass("acFormLabel"), oTextView
      //  ]
      //});
    },
    /**
     * Get the Days, Dates and Team&Step Status
     * @return {object} oLayout
    */
    getDaysDatesTeamAndStepStatus: function() {
      var oLayout = new sap.ui.commons.layout.MatrixLayout({
        layoutFixed: true,
        columns: 5,
        width: "100%"
      });

      oLayout.createRow(new sap.ui.commons.layout.MatrixLayoutCell({
        colSpan: 1,
        content: [
          this.getDaysDatesTeam()
        ]
      }), new sap.ui.commons.layout.MatrixLayoutCell({
        colSpan: 4,
        hAligh: "Center",
        separation: "LargeWithLine",
        content: [
          this.getStepNameAndStatus()

        ]
      }));
      oLayout.createRow({
        height: "1em"
      });

      return oLayout;
    },
    /**
     * Get the Days & Dates Details
     * @return {object} oLayout
    */
    getDaysDatesTeam: function() {

      var oLayout = new sap.ui.commons.layout.MatrixLayout("idDaysLayout", {
        layoutFixed: true,
        columns: 1,
        width: "100%"
      });

      oLayout.createRow(new sap.ui.commons.layout.MatrixLayoutCell({

        content: [
          new sap.ui.layout.VerticalLayout({
            content: [
              new sap.ui.commons.TextView({
                text: "{i18n>ImpactUrgency}"
              }).addStyleClass("acFormLabel"), new sap.ui.commons.Label({
                text: "{ImpactUrgency}",
                design: sap.ui.commons.LabelDesign.Bold,
                wrapping: false
              }).addStyleClass("acFormLabel")
            ]
          })
        ]
      }));
      oLayout.createRow({
        height: "0.5em"
      });
      oLayout.createRow(this.getDaysHOverDetails());
      oLayout.createRow(this.getDatesHOverDetails());
      oLayout.createRow(this.getOfficerAndTeamHOverDetails());
      return oLayout;
    },
    /**
     * Get the Days details for HOver
     * @return {object} oLayout
    */
    getDaysHOverDetails: function() {

      var oRichTooltip = new sap.ui.commons.RichTooltip({
        text: "{i18n>ProcessingDays}" + "{DaysProcessing}" + "\n" + "{i18n>PlannedDays}" + "{DaysPlanned}" + "\n" + "{i18n>RemainingDays}" + "{DaysRemaining}" + "\n" + "{i18n>OnHoldDays}" + "{DaysOnHold}" + "\n" + "{i18n>WorkingDays}" + "{DaysCompleted}",
        title: "{i18n>Days}"
      });

      var oImage = new sap.ui.core.Icon({
        src: "sap-icon://pie-chart",// "{i18n>processStatus}",
        Height: "1.25em"
      }).addStyleClass("acHOverIcons");

      oImage.setTooltip(oRichTooltip);
      return new sap.ui.layout.HorizontalLayout({
        content: [
          oImage, new sap.ui.commons.Label({
            text: "{i18n>Days}"
          })
        ]
      });
    },
    /**
     * Get the Dates details for HOver
     * @return {object} oLayout
    */
    getDatesHOverDetails: function() {
    var oRichTooltip = new sap.ui.commons.RichTooltip({
        text: "{i18n>Recevied}" + "{oFDate>/ReceivedDate}" + "\n" + "{i18n>Lodged}" + "{oFDate>/LodgedDate}" + "\n" + "{i18n>Processed}" + "{oFDate>/ProcessedDate}" + "\n" + "{i18n>Issued}" + "{oFDate>/IssueDate}",
        title: "{i18n>Dates}"
      });

      var oImage = new sap.ui.core.Icon({
        src: "sap-icon://calendar",
        Height: "1.25em"
      }).addStyleClass("acHOverIcons");

      oImage.setTooltip(oRichTooltip);
      return new sap.ui.layout.HorizontalLayout({
        content: [
          oImage, new sap.ui.commons.Label({
            text: "{i18n>Dates}"
          })
        ]
      });
    },
    /**
     * Get the Oficer and Team details for HOver
     * @return {object} oLayout
    */
    getOfficerAndTeamHOverDetails: function() {
      var oRichTooltip = new sap.ui.commons.RichTooltip({
        text: "{i18n>ResponsibleOfficer}" + "{Officer}" + "\n" + "{i18n>ServiceTeam}" + "{ServiceTeam}",
        title: "{i18n>OfficerTeam}"
      });

      var oImage = new sap.ui.core.Icon({
        src: "sap-icon://employee",
        Height: "1.25em"
      }).addStyleClass("acHOverIcons");

      oImage.setTooltip(oRichTooltip);
      return new sap.ui.layout.HorizontalLayout({
        content: [
          oImage, new sap.ui.commons.Label({
            text: "{i18n>OfficerTeam}"
          })
        ]
      });
    },
    /**
     * Get theStep Name Status Details
     * @return {object} oLayout
    */
    getStepNameAndStatus: function() {
      var oLayout = new sap.ui.commons.layout.MatrixLayout({
        layoutFixed: true,
        columns: 1,
        width: "100%"
      });

      oLayout.createRow(new sap.ui.commons.layout.MatrixLayoutCell({

        content: [
          new sap.ui.commons.TextView({
            text: "{StepDescription}",
            width: "100%",
            wrapping: false,
            design: sap.ui.commons.TextViewDesign.H2
          }).addStyleClass("acApplicationId")
        ]
      }));

      oLayout.createRow({
        height: "0.5em"
      });

      var oTextView = new sap.ui.commons.TextView({
              id: "idStepStatus",
              text: "{StepStatus}",
              design: sap.ui.commons.LabelDesign.Bold,
              wrapping: false
              }).addStyleClass("acFormLabel");

      var oRichTooltip = new sap.ui.commons.RichTooltip({
        text: "{i18n>OnHoldReason1}" + "{OnHoldReason1}" + "\n" + "{i18n>OnHoldReason2}" + "{OnHoldReason2}" + "\n" + "{i18n>OnHoldReason3}" + "{OnHoldReason3}" + "\n" + "{i18n>OnHoldReason4}" + "{OnHoldReason4}" + "\n" + "{i18n>OnHoldReason5}" +
"{OnHoldReason5}",
        title: "{i18n>OnHoldReasonTitle}"
      });

      oTextView.setTooltip(oRichTooltip);
      oLayout.createRow(new sap.ui.commons.layout.MatrixLayoutCell({

        content: [
          new sap.ui.layout.HorizontalLayout({
            content: [
            oTextView
            ]
          })
        ]
      }));
      oLayout.createRow({
        height: "0.5em"
      });
      oLayout.createRow(new sap.ui.commons.layout.MatrixLayoutCell({
        content: [
          new sap.ui.layout.HorizontalLayout({
            content: [
              new sap.ui.commons.TextView({
                text: "{TeamResponsible}",
                design: sap.ui.commons.LabelDesign.Bold,
                wrapping: false
              }).addStyleClass("acFormLabel")
            ]
          })
        ]
      }));

      oLayout.createRow({
        height: "0.5em"
      });
      oLayout.createRow(new sap.ui.commons.layout.MatrixLayoutCell({
        content: [
          new sap.ui.layout.HorizontalLayout({
            content: [
              new sap.ui.commons.TextView({
                text: "{EmpResponsible}",
                design: sap.ui.commons.LabelDesign.Bold,
                wrapping: false
              }).addStyleClass("acFormLabel")
            ]
          })
        ]
      }));
      return oLayout;
    },
	
	
    /**
     * Create the Header Content
     * @return {object} oLayout
    */
    createContent: function() {

      var oLayout = new sap.ui.commons.layout.MatrixLayout("idHeaderLayout", {
        layoutFixed: true,
        columns: 19

      });

      oLayout.createRow(new sap.ui.commons.layout.MatrixLayoutCell({
        colSpan: 3,
        content: [
          this.getAppDescription()
        ]
      }), new sap.ui.commons.layout.MatrixLayoutCell({
        colSpan: 6,
        content: [
          this.getAppStatus()
        ]
      }), new sap.ui.commons.layout.MatrixLayoutCell({
        colSpan: 2,
        content: [
          this.getClock()
        ]
      }), new sap.ui.commons.layout.MatrixLayoutCell({
        colSpan: 8,
        content: [
          this.getDaysDatesTeamAndStepStatus()
        ]
      }));

      oLayout.createRow({
        height: "0.1em"
      });
      return oLayout;
    }
  });
});