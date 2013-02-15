(function () {
    WinJS.Namespace.define("Finder.Config", {
        /**
        Hero Config
        **/
        appName: "Hero Application",
        staticUrl: "http://hero-server.azurewebsites.net/api/hero/issue",
        settingsUrl: "http://hero-server.azurewebsites.net/api/hero/settings",
        //staticUrl: "http://localhost:3000/api/hero/issue",
        //settingsUrl: "http://localhost:3000/api/hero/settings",
        latitudeField: "latitude",
        longidudeField: "longitude",
        nameField: "title",
        secondaryField: "description",
        imageField: "imgUrl",
        objectParser: function (object) {
            if(!object.latitude)
                object.latitude = 0;
            if(!object.longitude)
                object.longitude = 0;
            return object;
        },

        /***************************************************
         * Login functionality - here you just setup what type of login to use
         * options are : facebook, windowsLive and you will find the logic if auth.js login()
         ***************************************************/
        oAuthLoginProvider: 'facebook',
        // get key at developers.facebook.com
        oAuthKey: 'YOUR-KEY-HERE', // key to use for api access. currently only used by facebook

        /***************************************************
         * Various helper text
         ***************************************************/
        waitText: "Finding issues near you ...",
        poiDataAvailable: "Found {0} issues!",
        noPoiData: "Unable to find issues :(",
        noPoiDataMessage: "We could not locate any issues near your location.",
        noPoiDataMessageTitle: "Issues Unavailble",
        includeUserLocationOnPoiSelected: false,
        includeUserLocationOnPoiDisplayed: false,

        /***************************************************
         * Categories (Comma Seperated)
         ***************************************************/
         categories: "Broken,Worn Down, Other Category",


        /**************************************************
        * SHARING CONFIGURATION
        *
        * available tokens:
        *  nameField: this is the nameField element of the given point.
        ***************************************************/
        shareTitle: "Finder App",
        shareText: "I'm at {{nameField}}",
        shareDescription: "Finder Share Description",

        shareListTitle: "Hero App",
        shareListText: "Issue: {{nameField}}",
        shareListDescription: "List of issue from the Hero App",

        /***************************************************
         * Info section on the details page. Configuration
         ***************************************************/
        infoFormat: "<h4>{{description}}.<h4>",

        /***************************************************
         * About Flyout text
         ***************************************************/
        aboutText: "This application is built on top of the <b>Finder App Template</b>",
        copyright: "RedBit Development © {0}".format(new Date().getFullYear()),
        version: RedBit.Utilities.appVersion(),
        versionFriendly: RedBit.Utilities.appVersionFriendly(false),
        contactUsText: 'If you have any comments or suggestions for {0}, email us at <a href="mailto:support@redbitdev.com">support@redbitdev.com</a>'.format('Finder.Config.appName'),

        
        /***************************************************
         * Bing Maps Key - to get a key visit http://www.bingmapsportal.com/
         ***************************************************/
        bingMapsKey: "YOUR-KEY-HERE",
        routeUrl: 'http://dev.virtualearth.net/REST/V1/Routes/Driving?o=json&wp.0={0}&wp.1={1}&rpo=points&optmz=timeWithTraffic&avoid=minimizeTolls&key={2}',

    });
})();