// For an introduction to the Page Control template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232511
(function () {
    "use strict";

    WinJS.UI.Pages.define("/pages/settings/settings.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            this.loadSettings();
            this.wireEvents();
        },

        // wire up event handlers
        wireEvents: function () {
            miles.onchange = function () {
                RedBit.Settings.instance.unitOfMeasure = RedBit.Settings.UnitOfMeasureType.imperial;
            };

            km.onchange = function (e) {
                RedBit.Settings.instance.unitOfMeasure = RedBit.Settings.UnitOfMeasureType.metric;
            };
        },

        // loads the settings initially
        loadSettings: function () {
            var settings = RedBit.Settings.instance;
            // init the settings
            if (settings.unitOfMeasure === RedBit.Settings.UnitOfMeasureType.metric) {
                km.checked = true;
            }
            else {
                miles.checked = true;
            }
        },

        unload: function () {
            // TODO: Respond to navigations away from this page.
        },

        updateLayout: function (element, viewState, lastViewState) {
            /// <param name="element" domElement="true" />

            // TODO: Respond to changes in viewState.
        }
    });
})();
