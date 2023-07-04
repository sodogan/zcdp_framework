sap.ui.define(["sap/ui/core/routing/Router", "sap/ui/core/routing/History"], 
    function(Router, History) {
    "use strict";
    return Router.extend("aklc.cm.components.processApp.Router", {
        myNavBack: function(route, data) {
            var history = sap.ui.core.routing.History.getInstance();
            var url = this.getURL(route, data);
            var direction = history.getDirection(url);
            if (direction === "Backwards") {
                window.history.go(-1);
            } else {
                var replace = true; // otherwise we go backwards with a forward history
                this.navTo(route, data, replace);
            }
        }
    });
});
