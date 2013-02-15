(function () {
    WinJS.Namespace.define("Geo", {
        //TODO: Extract out the key to the config file
        _bingGeoCodeUrl: 'http://dev.virtualearth.net/REST/v1/Locations/{0}?includeNeighborhood=1&maxresults=10&key=' + Finder.Config.bingMapsKey,
        
        geocode: function (query) {
                var url = this._bingGeoCodeUrl.replace("{0}", query);
            return new WinJS.Promise(function (c, e, p) {


                WinJS.xhr({
                    url: url,
                    headers: {
                        'Cache-Control': 'no-cache',
                        'If-Modified-Since': 'Mon, 27 Mar 1972 00:00:00 GMT',
                        'Content-type': 'application/json',
                        //'User-Agent': HiddenPennies.API._userAgent
                    }
                }).done(function (result) {
                    var res = JSON.parse(result.responseText);
                    var ret = [];
                    if (res.statusCode === 200) {
                        if (res.resourceSets.length > 0 && res.resourceSets[0].resources.length > 0) {
                            for (var i in res.resourceSets[0].resources) {
                                var point = res.resourceSets[0].resources[i];
                                ret.push({
                                    name: point.name,
                                    lat: point.point.coordinates[0],
                                    lon: point.point.coordinates[1]
                                });
                            }
                        }
                    }
                    //TODO: Add error Handling
                    c(ret);
                }, function (result) {
                    e(result);
                });

            });
        }

    });

    
})()