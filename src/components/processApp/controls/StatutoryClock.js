sap.ui.define(["sap/ui/core/Control",
		"aklc/cm/components/processApp/thirdparty/d3",
		"aklc/cm/components/processApp/thirdparty/c3"
	],
	function(Control, d3, c3) {
		"use strict";

		c3 = window.c3;

		return Control.extend("aklc.cm.components.processApp.controls.StatutoryClock", {
			metadata: {
				properties: {
					"columns": {
						type: "object",
						bindable: "bindable",
						defaultValue: []
					},
					"clockColour": {
						type: "string",
						bindable: "bindable",
						defaultValue: []
					},
					"daysCompleted": {
						type: "int",
						group: "Data",
						bindable: "bindable",
						defaultValue: 0
					},
					"daysRemaining": {
						type: "int",
						group: "Data",
						bindable: "bindable",
						defaultValue: 0
					},
					"clockText1": {
						type: "string",
						bindable: "bindable"
					},
					"clockText2": {
						type: "string",
						bindable: "bindable"
					}
				}
			},
			/**
			* This function to render the content of Statutory Clock 
			* 
			* @param  {object} oRm event object
			* @param  {object} oControl event object
			*/			
			renderer: function(oRm, oControl) {
				oRm.write("<div ");
				oRm.writeControlData(oControl);
				oRm.addClass("donutWrap");
				oRm.writeClasses();
				oRm.write(">");

				oRm.write("<span ");
				oRm.addClass("donutTitle1");
				oRm.writeClasses();
				oRm.write(">");
				oRm.writeEscaped(oControl.getClockText1());
				oRm.write("</span>");

				oRm.write("<span ");
				oRm.addClass("donutTitle2");
				oRm.writeClasses();
				oRm.write(">");
				oRm.writeEscaped(oControl.getClockText2());
				oRm.write("</span>");

				oRm.write("<div ");
				oRm.writeAttribute("id", oControl.getId() + "-chart");
				oRm.write("</div>");

				oRm.write("</div>");
			},
			/**
			 * on init
			 */
			init: function() {
				this.sChartId = "#" + this.getId() + "-chart";
			},
			/**
			* This function to set the Completed Days
			* 
			* @param {integer} iValue completed days for setting it
			* 
			*/	
			setDaysCompleted: function(iValue) {
				this.setProperty("daysCompleted", iValue, true);
				this._updateColums();
			},
			/**
			* This function to set the Reamining Days
			* 
			* @param {integer} iValue completed days for setting it
			* 
			*/
			setDaysRemaining: function(iValue) {

				// Set the Remaining Days value as 0, if actual Remaining Days value is in minus(-) or less than 0
				if (iValue < 0) {
					iValue = 0;
				}
				this.setProperty("daysRemaining", iValue, true);
				this._updateColums();
			},
			/**
			* This function to update the columns in the statutory clock
			* 
			*/
			_updateColums: function() {
				// delay if updated through binding
				jQuery.sap.clearDelayedCall(this.delayedCallId);
				this.delayedCallId = jQuery.sap.delayedCall(0, this, function() {
					var iDaysCompleted = this.getDaysCompleted();
					var iDaysRemaining = this.getDaysRemaining();

					//leading wedge
					if (iDaysCompleted > 0 && iDaysCompleted < iDaysRemaining) {
						iDaysCompleted *= -1;
						iDaysRemaining *= -1;
					}

					var aVal1 = ["val1", iDaysCompleted];
					var aVal2 = ["val2", iDaysRemaining];

					this.setColumns([aVal1, aVal2]);
				});
			},
			/**
			* This function to get the columns in the statutory clock
			* @return {object} Property columns property
			*/
			getColumns: function() {
				return this.getProperty("columns");
			},
			/**
			* This function to set the columns in the statutory clock
			* @param {integer} aValue Value for cloumns
			*/
			setColumns: function(aValue) {
				this.setProperty("columns", aValue, true);
				if (this.oChart) {
					this.oChart.load({
						columns: aValue
					});
					this.setVisible(true);
				}
			},
			/**
			* This function to invalidate the statutory clock
			* 
			*/
			invalidate: function() {
				jQuery.sap.clearDelayedCall(this._sInvalidateDelay);
				this._sInvalidateDelay = jQuery.sap.delayedCall(200, this, Control.prototype.invalidate, arguments);
			},
			/**
			* This function to execute on After rendering
			* 
			*/
			onAfterRendering: function() {
				this.oChart = c3.generate({
					bindto: this.sChartId,
					size: {
						height: 150,
						width: 150
					},
					data: {
						columns: this.getColumns(),
						type: "donut"
					},
					color: {
						pattern: [this.getClockColour(), "#F2F1E6"]
					},
					legend: {
						show: false
					},
					tooltip: {
						show: false
					},
					donut: {
						label: {
							show: false
						}
					}
				});
			}
		});
	}, /* bExport= */ true);
