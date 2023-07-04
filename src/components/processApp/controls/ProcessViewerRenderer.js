sap.ui.define([
	"sap/ui/ux3/ThingViewerRenderer", "sap/ui/core/Renderer"
], function(ThingViewerRenderer, Renderer) {
	"use strict";

	var ProcessViewerRenderer = Renderer.extend(ThingViewerRenderer);
	/**
	* This function to render the content of process app 
	* 
	* @param  {object} oRm event object
	* @param  {object} oControl event object
	*/
	ProcessViewerRenderer.renderContent = function(oRm, oControl) {
		oRm.write("<div");
		oRm.addClass("sapSuiteTvMinHeight");
		oRm.writeClasses();
		oRm.write(">");

		this.renderBanner(oRm, oControl);

		oRm.write("<div");
		oRm.writeAttribute("id", oControl.getId() + "-facetContent");
		oRm.addClass("sapSuiteTvFacet");
		oRm.writeClasses();
		oRm.write(">");
		this.renderNavBar(oRm, oControl);
		this.renderFacetContent(oRm, oControl);
		oRm.write("</div>");
		this.renderToolbar(oRm, oControl);

		this.renderFooter(oRm, oControl);
		oRm.write("</div>");
	};
	/**
	* This function to render the Footer content 
	* 
	* @param  {object} oRm event object
	* @param  {object} oControl event object
	*/
	ProcessViewerRenderer.renderFooter = function(oRm, oControl) {
		oRm.write("<footer");
		oRm.writeAttribute("id", oControl.getId() + "-footer");
		oRm.addClass("acFooter");
		oRm.writeClasses();

		oRm.write(">");
		oRm.renderControl(oControl.getFooterContent());
		oRm.write("</footer>");
	};
	/**
	* This function to render the Navigation Bar content 
	* 
	* @param  {object} oRm event object
	* @param  {object} oControl event object
	*/
	ProcessViewerRenderer.renderNavBar = function(oRm, oControl) {
		oRm.write("<nav");
		oRm.writeAttribute("id", oControl.getId() + "-navigation");
		oRm.addClass("sapSuiteTvNav");
		oRm.writeClasses();
		oRm.addStyle("width", oControl.getSidebarWidth());
		oRm.writeStyles();
		oRm.write(">");
		oRm.renderControl(oControl._getNavBar());
		oRm.write("</nav>");
	};
	/**
	* This function to render the Banner content 
	* 
	* @param  {object} oRm event object
	* @param  {object} oControl event object
	*/
	ProcessViewerRenderer.renderBanner = function(oRm, oControl) {
		
		// render Header Content
		oRm.write("<aside id='" + oControl.getId() + "-headerContent'");
		oRm.addClass("sapUiUx3TVBanner");
		oRm.addClass("aklcFrameworkHeader");
		oRm.writeClasses();
		oRm.write(">");
		this.renderHeaderContent(oRm, oControl);
		oRm.write("</aside>");

	};
	/**
	* This function to render the Header content 
	* 
	* @param  {object} oRm event object
	* @param  {object} oControl event object
	*/
	ProcessViewerRenderer.renderHeaderContent = function(oRm, oControl) {
		var headerContentList = oControl.getHeaderContent();

		for (var i = 0; i < headerContentList.length; i++) {
			var headerContent = headerContentList[i];
			oRm.write("<div class='sapUiUx3TVHeaderContainer");
			oRm.write("' role='form'>");
			oRm.write("<div class='sapUiUx3TVHeaderGroupContent'>");
			var childContent = headerContent.getContent();
			for (var j = 0; j < childContent.length; j++) {
				var childControl = childContent[j];
				oRm.renderControl(childControl);
			}
			oRm.write("</div>");
			oRm.write("</div>");
		}
	};
	/**
	* This function to render the Toolbar content 
	* 
	* @param  {object} oRm event object
	* @param  {object} oControl event object
	*/
	ProcessViewerRenderer.renderToolbar = function(oRm, oControl) {
		// render Toolbar
		if (oControl.getActionBar()) {
			oRm.write("<div id='" + oControl.getId() + "-toolbar' class='acUiUx3TVToolbar'>");
			oRm.renderControl(oControl.getActionBar());
			oRm.write("</div>");
		}
	};
	/**
	* This function to render the Facet content 
	* 
	* @param  {object} oRm event object
	* @param  {object} oControl event object
	*/
	ProcessViewerRenderer.renderFacetContent = function(oRm, oControl) {
		var aFacetContent = oControl.getFacetContent();
		for (var i = 0; i < aFacetContent.length; i++) {
			var oGroup = aFacetContent[i];

			oRm.write("<div");
			oRm.writeAttribute("role", "form");
			if (oGroup.getColspan()) {
				oRm.addClass("sapUiUx3TVFacetThingGroupSpan");
			} else {
				oRm.addClass("sapUiUx3TVFacetThingGroup");
				oRm.addClass("ackFacetContent");
			}
			oRm.writeClasses();
			oRm.write(">");
			oRm.write("<div");
			oRm.writeAttributeEscaped("title", oGroup.getTitle());
			oRm.addClass("sapUiUx3TVFacetThingGroupContentTitle");
			oRm.writeClasses();
			oRm.write(">");
			oRm.write("<span>");
			oRm.writeEscaped(oGroup.getTitle());
			oRm.write("</span>");
			oRm.write("</div>");

			oRm.write("<div");
			oRm.addClass("sapUiUx3TVFacetThingGroupContent");
			oRm.writeClasses();
			oRm.write(">");
			var oGroupContent = oGroup.getContent();
			for (var j = 0; j < oGroupContent.length; j++) {
				oRm.renderControl(oGroupContent[j]);
			}
			oRm.write("</div>");
			oRm.write("</div>");
		}
	};
	return ProcessViewerRenderer;
}, /* bExport= */true);
