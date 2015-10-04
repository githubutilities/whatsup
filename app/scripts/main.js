// crawling data minutely and hourly
(function() {
    var timeInSecond = Math.floor((new Date()).getTime() / 1000),
        currentTimeInSecond = timeInSecond;
    var apiKey = "58150f7a0e5c13c0fd2eed55ce17884e";
    var urlPrefix = "https://api.forecast.io/forecast/" + apiKey + "/";

    function updateHourly(latitude, longitude) {
        var params = [latitude, longitude].join(",");
        var url = urlPrefix + params;

        function onDataReceived(data) {
            var dailyData = data["daily"]["data"];
            var hourlyData = data["hourly"]["data"];
            var hourlyDataArray = [];
            hourlyData.sort(function(a, b) {
                return a["time"] - b["time"];
            });
            for (var i = 0; i < hourlyData.length; i++) {
                var hourlyDatum = hourlyData[i];
                var timeInSecond = hourlyDatum["time"];
                var timeInMilli = timeInSecond * 1000;
                var time = new Date(timeInMilli);
                var precipIntensity = hourlyDatum["precipIntensity"];

                hourlyDataArray.push([i, precipIntensity]);
            }

            var options = {
                xaxis: {
                    tickLength: 1,
                    mode: "time",minTickSize: [1, "hour"],
                        min: (new Date()).getTime(),
                },
                yaxis: {
                    max: dailyData["precipIntensityMax"]
                }
            };

            $('#hourly-chart').css({
                'width': '600px',
                'height': '300px'
            });
            $.plot($("#hourly-chart"), [hourlyDataArray]);
        }

        $.ajax({
            url: url,
            dataType: "jsonp",
            success: onDataReceived
        });
    }

    function updateMinutely(latitude, longitude) {
        var minutelyDataArray = [];

        function onDataReceived(data) {
            var currentData = data["currently"];
            var timeInSecond = currentData["time"];
            var currentPrecipIntensity = currentData["precipIntensity"];
            var xaxis = (timeInSecond - currentTimeInSecond) / 60;
            minutelyDataArray.push([xaxis, currentPrecipIntensity]);

            minutelyDataArray.sort(function(a, b) {
                return a[0] - b[0];
            });

            $('#minutely-chart').css({
                'width': '600px',
                'height': '300px'
            });
            $.plot($("#minutely-chart"), [minutelyDataArray]);
        }

        for (var i = 0; i <= 60; i++, timeInSecond += 60) {
            var params = [latitude, longitude, timeInSecond].join(",");
            var url = urlPrefix + params;

            $.ajax({
                url: url,
                dataType: "jsonp",
                success: onDataReceived
            });
        }
    }

    function getGeoLocation(callbacks) {
        function getGeoLocationFromQuery() {
            function getQuery() {
                // removing the `?` mark at the beginning
                var queryString = window.location.search.substring(1);
                var query = {};
                var params;
                if(-1 !== queryString.search("&")) {
                    params = queryString.split("&");
                    for (var i = 0; i < params.length; i++) {
                        var param = params[i].split("=");
                        var key = param[0];
                        var value = decodeURIComponent(param[1]);
                        if (typeof query[key] === "undefined") {
                            query[key] = value;
                        } else if (typeof query[key] === "string") {
                            var arr = [query[key], value];
                        } else {
                            query[key].push(value);
                        }
                    }
                } else if(-1 !== queryString.search(",")){
                    params = queryString.split(",");
                    if (!isNaN(params[0]) && !isNaN(params[1])) {
                        query["latitude"] = params[0];
                        query["longitude"] = params[1];
                    }
                }

                return query;
            }

            function isValid(queryValue) {
                function isNumber(numString) {
                    return !isNaN(numString);
                }
                return (typeof queryValue !== "undefined") && isNumber(queryValue);
            }

            var query = getQuery();
            var latitude;
            var longitude;
            var keys = [["lat", "long"], ["latitude", "longitude"]];
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var lat = key[0];
                var log = key[1];
                if (isValid(query[lat]) && isValid(query[log])) {
                    latitude = query[lat];
                    longitude = query[log];
                }
            }

            if (typeof latitude === "undefined" &&
                typeof longitude === "undefined")
                return undefined;
            else return {
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude)
                };
        }

        var waysToGetGeo = [getGeoLocationFromQuery];
        
        for (var i = 0; i < waysToGetGeo.length; i++) {
            var wayToGetGeo = waysToGetGeo[i];
            var geoLocation = wayToGetGeo();

            if (typeof geoLocation !== "undefined") {
                for (var j = 0; j < callbacks.length; j++) {
                    var callback = callbacks[j];
                    callback(geoLocation["latitude"], geoLocation["longitude"]);
                }
                return;
            }
        }
        alert("Sorry, we can not retrieve your current location.");
    }

    var callbacksOnGeoUpdated = [updateHourly, updateMinutely];
    getGeoLocation(callbacksOnGeoUpdated);

})();
