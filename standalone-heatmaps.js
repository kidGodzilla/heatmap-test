/**
 * A simple heatmap data collection and rendering library (rendering based on heatmap.js)
 * James Futhey (https://www.github.com/kidGodzilla)
 */
(function () {
    APIURL = 'https://spearmint.gumshoeanalytics.com/';
    window._ViewHeatmaps = true;
    window._GumshoeProject = 'test';
    var timer = new Date();
    var session, dateString, heatmapInstance, showingHeatmap, oldURL;
    var Heatmaps = window.Heatmaps = {};

    // We stick our data in here
    var currentData = {
        min: 0,
        max: 1,
        data: [],
        store: {}
    };

    /**
     * Load jQuery if it hasn't already been loaded
     */
    if (!window.jQuery) {
        var scriptTag = document.createElement('script');
        var firstScriptTag = document.getElementsByTagName('script')[0];
        scriptTag.src = 'https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.4/jquery.min.js'; // Replaces https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
        firstScriptTag.parentNode.insertBefore(scriptTag, firstScriptTag);
    }

    /**
     * Execute code when a condition evaluates to true
     */
    function onCondition (condition, callback, maximumTimeout, fail) {
        var s = setInterval(function () {

            // Early return if our condition is not a function
            if (!condition || !typeof(condition) === "function") {
                clearInterval(s);
                return false;
            }

            // Evaluate our condition. If true, perform callback & clear our interval, otherwise, do nothing.
            if (condition()) {
                if (callback && typeof(callback) === "function") callback();
                clearInterval(s);
            }

            // Set a failure condition after a specific time
            if (maximumTimeout && typeof(maximumTimeout) === "number") {
                setTimeout(function () {
                    clearInterval(s);
                    if (fail && typeof(fail) === "function") fail();
                }, maximumTimeout);
            }

        }, 100);
    }

    // Do a thing when a condition evaluates to true
    onCondition(function () {
        return window.jQuery;
    }, function () {
        // Get a hold of an md5 library!
        $.getScript('https://cdnjs.cloudflare.com/ajax/libs/blueimp-md5/2.7.0/js/md5.js');

        // Get a hold of our heatmap rendering library
        if (window._ViewHeatmaps) $.getScript('https://spearmint.gumshoeanalytics.com/heatmap.js');

        onCondition(function () {
            return window.md5;
        }, function () {
            // Kickoff the whole kit and caboodle
            $(document).ready(function () {
                init();
            });
        });

    });

    // Compress an md5 to pseudo-base64 (lossy 7-char output)
    function haft (str) {
        var l = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+=".split(''), m = str.match(/..../g), o = '';

        m.forEach(function (s) {
            p = 0;
            s.split('').forEach(function (t) { p += parseInt(t, 16) });
            o += l[p];
        });

        return o.substr(0,7);
    }

    // Pushes a new event to the heatmap data-store
    function pushData (obj) {
        // obj.x, obj.y, obj.value
        obj.x = "x" + obj.x;
        obj.y = "y" + obj.y;
        var oldVal, g;
        try {
            oldVal = currentData.store[obj.x][obj.y];
        } catch (e) {}
        var val = (oldVal || 0) + obj.value;

        try {
            g = currentData.store[obj.x];
        } catch (e) {
            currentData.store[obj.x] = {};
        }
        if (!g) currentData.store[obj.x] = {};

        currentData.store[obj.x][obj.y] = val;

        if (val > currentData.max) currentData.max = val;
    }

    // Reduce raw data from the datastore before transmitting it to the server
    function reduceData () {
        currentData.data = [];
        // Walk through all the nested keys in currentData.store and move into data[]
        for (var key in currentData.store) {
            for (var key2 in currentData.store[key]) {
                // console.log(key.substr(1), key2.substr(1), currentData.store[key][key2]);
                currentData.data.push({
                    x: key.substr(1),
                    y: key2.substr(1),
                    v: currentData.store[key][key2]
                });
            }
        }
    }

    // Walk through the current tree, and compact the data to a maximum value of 100
    function compactData () {
        var tmp = [];
        var max = currentData.max;

        if (max > 500) {
            var factor = Math.floor(max / 100);

            for (var key in currentData.store) {
                for (var key2 in currentData.store[key]) {

                    var val = currentData.store[key][key2];
                    var newValue = Math.floor(val / factor);

                    if (newValue) {
                        tmp.push({
                            x: key.substr(1),
                            y: key2.substr(1),
                            v: newValue
                        });
                    }

                }
            }

            // Reset data
            currentData = {
                min: 0,
                max: 1,
                data: [],
                store: {}
            };

            tmp.forEach(function (item) {
                if (item.v) {
                    pushData({
                        x: item.x,
                        y: item.y,
                        value: item.v
                    });
                }
            });

        }

    }

    // Move renderable data into an instantiated heatmap (renders the overlay)
    function renderData () {
        if (!heatmapInstance || !currentData.renderable) return;

        heatmapInstance.setData({
            data: currentData.renderable,
            min: currentData.min || 0,
            max: currentData.max || 1
        });
    }

    // Process heatmap data so it can be rendered
    function extractData () {
        currentData.renderable = [];
        currentData.data.forEach(function (item) {
            currentData.renderable.push({
                x: ((item.x / 100) * $(document).width()).toFixed(0),
                y: ((item.y / 100) * $(document).height()).toFixed(0),
                value: + (item.v),
                radius: 90
            });
        });
    }

    function getData () {
        console.log(currentData);
    }

    // Take the data for the current page and turn it into a heatmap
    function showHeatmap () {
        if (!heatmapInstance) {
            heatmapInstance = h337.create({
                container: document.body,
                radius: 90,
                width: $(document).width(),
                height: $(document).height()
            });
        }

        reduceData();
        extractData();
        renderData();
        showingHeatmap = true;
        $('canvas.heatmap-canvas').css('z-index', '99999999');
    }

    // Throttle events to max 1 per interval (takes the first one)
    function throttle (func, interval) {
        var ct = new Date();
        var td = parseInt(ct - timer);
        if (func && td > interval) {
            func();
            timer = ct;
        }
    }

    function cacheBuster () {
        return "v=" + Math.random();
    }

    function setup () {
        // Build the haft(md5())
        session = haft(md5(location.hostname + location.pathname));
        dateString = (timer).getMonth() + "-" + ((timer).getYear() + "").slice(1);

        currentData = {
            min: 0,
            max: 1,
            data: [],
            store: {}
        };

        // Get the latest JSON blob (or do nothing)
        var uri = APIURL + 'store-heatmap/view/?u=' + 'heatmap-' + window._GumshoeProject + '--' + session + '-' + dateString;
        $.get(uri+'&'+cacheBuster()).done(function (data) {
            if (!data) return; // Bail!

            (JSON.parse(data)).forEach(function (item) {
                pushData({
                    x: item.x,
                    y: item.y,
                    value: item.v || 1
                })
            });
        });
    }

    function urlHasChanged () {
        var currentURL = location.hostname+location.pathname;
        if (currentURL !== oldURL) {
            oldURL = currentURL;
            return true;
        }
        return false;
    }

    function toggleHeatmap () {
        if (showingHeatmap) {
            $('canvas.heatmap-canvas').remove();
            showingHeatmap = false;
            heatmapInstance = null;
        } else {
            showHeatmap();
        }
    }

    // Initialize it all
    function init () {

        // Reinitialize if the URL has changed (detect SPA navigation event)
        setInterval(function () {
            if (urlHasChanged()) setup();
        }, 500);

        setup(); // Initialize

        // Bind events to heatmap tracking
        $('html').on('mousemove touchstart click', function (ev) {
            throttle(function () {
                pushData({
                    x: ((ev.pageX / $(document).width())*100).toFixed(1),
                    y: ((ev.pageY / $(document).height())*100).toFixed(1),
                    value: 1
                });
            }, 100);
        });

        // Re-render our heatmap if we're showing it
        $(window).resize(function () {
            if (showingHeatmap) showHeatmap();
        });

        // Post data to server every 10s
        setInterval(function () {
            if (!session) return;
            compactData();
            reduceData();

            $.post(APIURL + "store-heatmap/", { document: JSON.stringify(currentData.data), ext: "json", session: session + '-' + dateString, user: 'heatmap-' + window._GumshoeProject });
        }, 10000);

        // Special key combo to toggle heatmap
        var map = {16: false, 72: false, 77: false}; // SHIFT + H+M
        $(document).keydown(function (e) {
            if (e.keyCode in map) {
                map[e.keyCode] = true;
                if (map[16] && map[72] && map[77]) { // SHIFT + H+M
                    throttle(function () {
                        toggleHeatmap();
                    }, 500);
                }
            }
        }).keyup(function (e) {
            if (e.keyCode in map) map[e.keyCode] = false;
        });

    }

    // Export Globals
    window.Heatmaps.toggleHeatmap = toggleHeatmap;
    window.Heatmaps.showHeatmap = showHeatmap;
    window.Heatmaps.getData = getData;
    window.Heatmaps.init = init;
})();
