var map, locator;
var lastPopupGraphic, layerOfLastPopupGraphic; //when the layer it attaches to is removed, it should be also removed from the map

require([
    "esri/dijit/OverviewMap", "esri/map", "esri/dijit/BasemapGallery",
    "esri/tasks/locator", "esri/tasks/GeometryService", "esri/dijit/Geocoder",

    "esri/tasks/AreasAndLengthsParameters",

    // "esri/InfoTemplate",

    "esri/toolbars/draw", "esri/graphic", "esri/Color",

    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",

    "esri/tasks/BufferParameters",

    "dojo/store/Memory",
    "dojo/store/Observable",
    "cbtree/Tree",                 // Checkbox tree
    "cbtree/model/TreeStoreModel",  // ObjectStoreModel

    "dijit/registry", "dojo/on", "dojo/_base/array",

    "dojo/_base/lang",

    "dojo/parser", "dojo/ready"
    ], function (
    OverviewMap, Map, BasemapGallery,
    Locator, GeometryService, Geocoder, // InfoTemplate,

    AreasAndLengthsParameters,

    Draw, Graphic, Color,

    SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol,

    BufferParameters,

    Memory, Observable, Tree, ObjectStoreModel,

    registry, on, array,

    lang,

    parser, ready
    ) {
    //Checkbox tree reference:
    //http://thejekels.com/dojo/cbtree_AMD.html
    //https://github.com/pjekel/cbtree/wiki
    //http://thejekels.com/cbtree/demos/ArcGIS.php
    store = Observable( new Memory( { data:
        treeHierarchyData }));

    cbTreeModel = new ObjectStoreModel({
        store: store,
        query: {id: "root"},
        rootLabel: "",
        checkedRoot: true
    });

    function checkBoxClicked( item, nodeWidget, evt ) {
        console.log('checkbox clicked');

        var checked = nodeWidget.get("checked");

        //get the text of the checked box
        var label = this.model.getLabel(item);

        var ChildrenLayers=TreeLayerNamesMapToWMSLayers[label]; // the children layers of a layer

        //layers in loadMap.js is the container of true WMS layers
        if(checked){
            for(var layerIdx in ChildrenLayers){ //in JS, layer is an index of ChildrenLayers, i.e. 0, 1, ......
                var WMSLayerName=ChildrenLayers[layerIdx];
                map.addLayer(layers[WMSLayerName]);
                checkedLayers.push(WMSLayerName); //add the layer to the checked layer group, clearMap()
                showLegend(WMSLayerNamesMapToTreeLayerNames[WMSLayerName]); //show the legend
            }
        }
        else{ //uncheck a layer
            for(var layerIdx in ChildrenLayers){
                var WMSLayerName=ChildrenLayers[layerIdx];
                map.removeLayer(layers[WMSLayerName]);

                //remove the layer from the checked layer group, clearMap()
                var index = checkedLayers.indexOf(WMSLayerName);
                checkedLayers.splice(index, 1);

                //alert(WMSLayerNamesMapToTreeLayerNames[WMSLayerName]);
                hideLegend(WMSLayerNamesMapToTreeLayerNames[WMSLayerName]); //hide the legend

                //handle the dangling popup graphic
                var fullLayerName="nurail:"+WMSLayerName;
                if(fullLayerName==layerOfLastPopupGraphic){
                    map.graphics.remove(lastPopupGraphic);
                }
            }
        }
       /*
        if( checked ) {
            tree.set("iconStyle", {border:"solid"}, item );
            tree.set("labelStyle",{color:"red"}, item );
        } else {
            tree.set("iconStyle", {border:"none"}, item );
            tree.set("labelStyle",{color:"black"}, item );
        }
        alert( "The new state for " + label + " is: " + checked );
         */
    }

/****************** end of leftPane.js
*******************
******************/

    //identify proxy page to use if the toJson payload to the geometry service is greater than 2000 characters.
    //If this null or not available the project and lengths operation will not work.  Otherwise it will do a http post to the proxy.
    //esriConfig.defaults.io.proxyUrl = "PHP/proxy.php";
    //esriConfig.defaults.io.alwaysUseProxy = false;

    var basemapGallery, gs, toolbarDraw, toolbarBuffer;

    var drawnGraphics = [];

    function init() {
        map = new Map("map", {
            basemap : 'gray',
            center : [-87.651052, 41.872458],
            zoom : 10, //6
            sliderStyle : "large",
            logo: false
            //showAttribution: false
        });

        // map = L.mapbox.map('map', 'joysword.i6b4jale').setView([41.8910,-87.6839], 11);

        basemapGallery = new BasemapGallery({
            showArcGISBasemaps : true,
            map : map
        });

        //gs = new GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
        gs = new GeometryService("http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer");

        /* note:
        if using tasks.arcgisonline.com {
            if the proxy is set {
                error, code 500
            }
            else {
                error, saying that proxy is missing
            }
        }
        else {  // using sampleserver6.arcgisonline.com
            if the proxy is set {
                works
            }
            else {
                works too
            }
        }
        */
        gs.on("areas-and-lengths-complete",
            function showAreasAndLengths(evt) {
                var html = "";
                for (var i=0;i<evt.result.areas.length;i++) {
                    if (i==0) {
                        html += "Selected Area:<br />"
                    }
                    else {
                        html += "Buffered Area:<br />"
                    }
                    html += "Area: " + evt.result.areas[i] + " km<sup>2</sup><br />"
                    + "Length: " + evt.result.lengths[i] + " km<br /><br />";
                }
                $('#areas-and-lengths').html(html);
            });

        // geocoding function
        locator = new Locator("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
        locator.on("address-to-locations-complete",
            //show a graphic at the location of geocoding
            function showLocatingResults(candidates) {

                var symbol = new SimpleMarkerSymbol().setStyle(SimpleMarkerSymbol.STYLE_SQUARE).setColor(new dojo.Color([153, 0, 51, 0.75]));
                var infoTemplate = new esri.InfoTemplate("Location", "Address: ${address}<br />Score: ${score}<br />Source locator: ${locatorName}");
                var geom;

                array.every(candidates.addresses, function (candidate) {
                    console.log("candidate: ", candidate);
                    console.log("score:", candidate.score);
                    if (candidate.score > 80) {
                        console.log(candidate.location);
                        var attributes = {
                            address : candidate.address,
                            score : candidate.score,
                            locatorName : candidate.attributes.Loc_name
                        };
                        geom = candidate.location;
                        var graphic = new esri.Graphic(geom, symbol, attributes, infoTemplate);
                        //add a graphic to the map at the geocoded location
                        map.graphics.add(graphic);

                        //add a text symbol to the map listing the location of the matched address.
                        var displayText = candidate.address;
                        var font = new esri.symbol.Font("16pt", esri.symbol.Font.STYLE_NORMAL, esri.symbol.Font.VARIANT_NORMAL, esri.symbol.Font.WEIGHT_BOLD, "Helvetica");
                        var textSymbol = new esri.symbol.TextSymbol(displayText, font, new dojo.Color("#666633")).setOffset(0, 10);

                        //            map.graphics.add(new esri.Graphic(geom, textSymbol));
                        return false;
                        //break out of loop after one candidate with score greater  than 80 is found.
                    }
                });

                if (geom !== undefined) {
                    map.centerAndZoom(geom, 13);
                }

            }
        );

        map.on("load", function () {
            toolbarDraw = new Draw(map);
            toolbarDraw.on("draw-end", addDrawToMap);

            // add basemap gallery
            // reference: http://help.arcgis.com/en/webapi/javascript/arcgis/jssamples/map_agol.html
            // array.forEach(basemapGallery.basemaps, function (bmap) {
            //     //Add a menu item for each basemap, when the menu items are selected
            //     dijit.byId("basemapMenu").addChild(
            //         new dijit.MenuItem({
            //             label : bmap.title,
            //             onClick : dojo.hitch(this, function () {
            //                 this.basemapGallery.select(bmap.id);
            //             })
            //         })
            //     );
            // });

            // initialize overview map
            // var overviewMapDijit = new OverviewMap({
            //     map : map,
            //     visible : true
            // });
            // overviewMapDijit.startup();
        });

        $(".draw-button").on("click", activateDrawTool);

        function activateDrawTool() {
            var tool = $(this).text().toUpperCase().replace(/ /g, "_");
            toolbarDraw.activate(Draw[tool]);
            map.hideZoomSlider();

            // remove previous drawn graphics
            for (var i in drawnGraphics) {
                map.graphics.remove(drawnGraphics[i]);
            }
            drawnGraphics.splice(0, drawnGraphics.length);

            // reset Buffer-related options
            $('#select-buffer').removeClass('hide');
            $('#draw-buffer').addClass('hide');
        }

        // will be executed after draw graphics were drawn
        function addDrawToMap(evt) {
            var symbol;
            var geometry = evt.geometry;
            toolbarDraw.deactivate();
            map.showZoomSlider();
            switch (geometry.type) {
                case 'point':
                case 'multipoint':
                    symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 6, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]), 1), new Color([0,255,0,0.25]));
                    break;
                case 'polyline':
                    symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color([255,0,0]), 1);
                    break;
                case 'polygon':
                    symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new Color([255,0,0]), 2), new Color([255,255,0,0.25]));
                    break;
            }
            var graphic = new Graphic(geometry, symbol);
            map.graphics.add(graphic);

            drawnGraphics.push(graphic);

            // show next step (step 3)
            openAccordion('#step3');

        }

        // will be executed after graphics were drawn
        function addBuffer(yes) {
            if (yes) {
                console.log('addBuffer true');
                var params = new BufferParameters();
                params.distances = [$("#distance").val()];
                params.bufferSpatialReference = map.spatialReference;
                params.outSpatialReference = map.spatialReference;
                params.unit = GeometryService[$("#unit").val()];

                $.each(drawnGraphics, function (i, graphic) {
                    var geometry = graphic.geometry;
                    if (geometry.type === "polygon") {
                        //if geometry is a polygon then simplify polygon. This will make the user drawn polygon topologically correct.
                        gs.simplify([geometry], function (geometries) {
                            params.geometries = geometries;
                            gs.buffer(params, showBuffer);
                        });
                    } else {
                        params.geometries = [geometry];
                        gs.buffer(params, showBuffer);
                    }
                    console.log('here 1111');
                });

                console.log('here 2222');
            }
            else {
                console.log('here 3333');
                getArea();
                loadFeatureData(drawnGraphics[drawnGraphics.length-1].geometry);
                openAccordion('#step4');
            }
        }

        function showBuffer(bufferedGeometries) {
            var symbol = new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(
                    SimpleLineSymbol.STYLE_SOLID,
                    new Color([255,0,0,0.65]), 2
                ),
                new Color([255,0,0,0.35])
            );

            $.each(bufferedGeometries, function (i, geometry) {
                var graphic = new Graphic(geometry, symbol);
                map.graphics.add(graphic);
                drawnGraphics.push(graphic);
            });

            console.log('here 4444');
            getArea();
            loadFeatureData(drawnGraphics[drawnGraphics.length-1].geometry);
            openAccordion('#step4');

        }

        function openAccordion(selector) {
            $(selector).next().slideDown('fast');
            $('.accordion-content').not($(selector).next()).slideUp('fast');
        }

        // Create the WMS_layer for each layer in layers
        for(var idx in layers){

            // console.log("layers["+idx+"]:", layers[idx]);

            layers[idx] = new dojo.declare(esri.layers.DynamicMapServiceLayer, {
                // Now for the constructor definition
                constructor: function (idx) {
                    this.spatialReference = new esri.SpatialReference({wkid:3857});
                    this.loaded = true;
                    this.onLoad(this);
                    this.id=idx;
                    //alert(this.id);
                },

                //
                //invoked when "map.addLayer" method is invoked
                //
                getImageUrl: function (extent, width, height, callback) {
                    // ***** PAY ATTENTION HERE ******************//
                    // * The ESRI Example uses a JSON Object which works
                    // * fine with an ESRIgenerated WMS, but not with
                    // * WMS’es created by other software. I had change
                    // * the parameters to a string this section up a bit.
                    // **********************************************//

                    var params =
                        "service="+"WMS"+
                        "&version=" + "1.1.0" +
                        "&request=" + "GetMap" +
                        "&transparent="+ "true" +
                        "&layers="+workspace+this.id+
                        "&srs=EPSG:3857" +
                        "&width=" + width +
                        "&height=" + height +
                        "&styles=" +
                        "&format=" + "image/png";

                    gs.project([ extent ], new esri.SpatialReference({wkid:3857}) , function (features) {
                        var translatedExtent = features[0];
                        //alert(translatedExtent.spatialReference.wkid+","+translatedExtent.xmin);
                        params +="&bbox=" + translatedExtent.xmin+","+translatedExtent.ymin+","+translatedExtent.xmax+","+translatedExtent.ymax;
                        //"&bbox=" + "-87.7575678843978,41.8509798545157,-87.5445361155993,41.893928932665";
                        // "&exceptions=" + "application/vnd.ogc.se_xml"

                        if (remote) callback("http://nurail.uic.edu/geoserver/nurail/wms?" + params );
                        else callback("http://localhost:8088/geoserver/NURail/wms?" + params );
                    });

                } //end of method getImageUrl()

            })(idx); //end of declare

            //console.log("layers["+idx+"]:", layers[idx]);
        }

        var headHeight = $('#header').outerHeight(true);
        var offset = $('.accordion-toggle').length * $('.accordion-toggle').outerHeight(true)
            + headHeight;

        $('.accordion-content').hide();
        $('.accordion-content.default').show();

        $('.accordion-content').css('height', $(window).height() - offset);
        $('#map_root').css('height', $(window).height() - headHeight);
        //console.log($('#map').attr())

        $('.accordion-toggle').on('click', function () {
            $(this).next().slideDown('fast');
            $('.accordion-content').not($(this).next()).slideUp('fast');
        });

        $(window).resize(function () {
            $('.accordion-content').css('height', ($(window).height() - offset));
            $('#map').css('height', $(window).height() - headHeight);
        }).resize();

        // if choose to buffer, show options
        $('#yes').on('click', function () {
            $('#select-buffer').addClass('hide');
            $('#draw-buffer').removeClass('hide');
        });

        // if choose not to buffer, go to step 4
        $('#no').on('click', function () {
            addBuffer(false);
        });

        // if apply buffer to map, add buffer and go to step 4
        $('#apply-buffer').on('click', function () {
            addBuffer(true);
        });

        // if cancel buffering, hide options
        $('#cancel-buffer').on('click', function () {
            $('#select-buffer').removeClass('hide');
            $('#draw-buffer').addClass('hide');
        });

        function getArea() {
            var params = new AreasAndLengthsParameters();
            params.lengthUnit = GeometryService.UNIT_KILOMETER;
            params.areaUnit = GeometryService.UNIT_SQUARE_KILOMETERS;
            params.calculationType = "geodesic";
            var polygons = [];
            for (var i in drawnGraphics) {
                polygons.push(drawnGraphics[i].geometry);
                console.log('pushed',i);
            }
            //console.log(drawnGraphics);
            params.polygons = polygons;
            //console.log(params.polygons);
            gs.areasAndLengths(params);
        }

        function loadFeatureData(geom) {
            console.log("in loadFeatureData");

            var drawnShape = "";

            if (geom.type === "polygon") {
                drawnShape += "POLYGON((";

                for (var i in geom.rings[0]) {
                    if (i!=geom.rings[0].length-1) {
                        drawnShape += geom.rings[0][i][0] + ' ' + geom.rings[0][i][1] + ',';
                    }
                    else {
                        drawnShape += geom.rings[0][i][0] + ' ' + geom.rings[0][i][1] + '))';
                    }
                }
            }
            else if (geom.type === "polyline") {
                drawnShape += "POLYLINE()";
            }
            else if (geom.type === "multipoint") {
                drawnShape += "MULTIPOINT()";
            }
            else { // geom.type === "point"
                drawnShape += "POINT()";
            }

            console.log("checkedLayers:", checkedLayers);

            $("#feature-data").html("");

            for (var idx in checkedLayers) {
                (function (idx) {
                    console.log('~~~~~in ', idx);
                    var myTable = {};

                    var layerName = 'nurail:'+checkedLayers[idx];

                    if (checkedLayers[idx] == 'Blue'
                        || checkedLayers[idx] == 'Brown'
                        || checkedLayers[idx] == 'Green'
                        || checkedLayers[idx] == 'Orange'
                        || checkedLayers[idx] == 'Pink'
                        || checkedLayers[idx] == 'Purple'
                        || checkedLayers[idx] == 'Red'
                        || checkedLayers[idx] == 'Yellow'
                        || checkedLayers[idx] == 'MetroLinssshp') {
                    }
                    else {

                        console.log(layerName);
                        console.log(popupAttributesForLayer[layerName]);

                        myTable.title = WMSLayerNamesMapToTreeLayerNames[checkedLayers[idx]];
                        myTable.data = [];

                        //Restful url for WFS service  http://docs.geoserver.org/stable/en/user/services/wfs/reference.html
                        //geometry_name:"the_geom" https://wiki.state.ma.us/confluence/display/massgis/GeoServer+-+WFS+-+Filter+-+DWithin
                        //version must be 1.0.0 why?
                        var url = "";
                        if (geom.type === "polygon") {
                            url='http://nurail.uic.edu/geoserver/nurail/ows?service=WFS&version=1.0.0&request=GetFeature&typeName='+layerName+'&cql_filter=INTERSECTS(the_geom,' + drawnShape + ')&propertyName='+popupAttributesForLayer[layerName]+'&outputFormat=application/json';
                        }
                        else if (geom.type === "polyline") {
                            console.log(geom.type);
                        }
                        else if (geom.type === "multipoint") {
                            console.log(geom.type);
                        }
                        else { // geom.type === "point"
                            console.log(geom.type);
                        }

                        //asynochronous function to deal with the response
                        $.getJSON(url, function (obj) {
                            console.log('~~~~~in ', idx, "'s getJSON");

                            var myFeatures = obj.features;

                            for (var ii in myFeatures) {

                                var myRow = {};

                                var myProperties = myFeatures[ii].properties;

                                for (var prop in myProperties) {
                                    myRow[meaningfulAttributeNames[prop]] = myProperties[prop];
                                }

                                myTable.data.push(myRow);

                                console.log('myRow:', myRow);
                            }

                            myTable.html = ConvertJsonToTable(myTable.data, 'jsonTable', null, 'Download');

                            console.log("myTable:", myTable);

                            console.log("html:", myTable.html);

                            $("#feature-data").html(function (idx, html) {
                                return html + "<h5>" + myTable.title + "</h5>" + myTable.html;
                            });

                            console.log('~~~~~out', idx, "'s getJSON");

                        });

                    }

                })(idx);
            }

        }

        // https://kopepasah.com/tutorial/awesome-overlays-with-simple-css-javascript-html/
        $( '.overlay-trigger' ).on( 'click', function( event ) {

            console.log('clicked');
            event.preventDefault();

            /**
             * Set the overlay variable based on the data provided
             * by the overlay trigger.
             */
            var overlay = $( this ).data( 'overlay' );

            /**
             * If the overlay variable is not defined, give a message
             * and return.
            */
            if ( ! overlay ) {
                console.log( 'You must provide the overlay id in the trigger. (data-overlay="overlay-id").' );
                return;
            }

            /**
             * If we've made it this far, we should have the data
             * needed to open a overlay. Here we set the id variable
             * based on overlay variable.
             */
            var id = '#' + overlay;

            /**
             * Let's open up the overlay and prevent the body from
             * scrolling, both by adding a simple class. The rest
             * is handled by CSS (awesome).
             */
            $( id ).addClass( 'overlay-open' );
            $( 'body' ).addClass( 'overlay-view' );

            /**
             * When the overlay outer wrapper or `overlay-close`
             * triger is clicked, lets remove the classes from
             * the current overlay and body. Removal of these
             * classes restores the current state of the user
             * experience. Again, all handled by CSS (awesome).
             */
            $( id ).on( 'click', function( event ) {
                // Verify that only the outer wrapper was clicked.
                if ( event.target.id == overlay ) {
                    $( id ).removeClass( 'overlay-open' );
                    $( 'body' ).removeClass( 'overlay-view' );
                }
            });

            /**
             * Closes the overlay when the esc key is pressed. See
             * comment above on closing the overlay for more info
             * on how this is accomplished.
             */
            $( document ).keyup( function( event ) {
                // Verify that the esc key was pressed.
                if ( event.keyCode == 27 ) {
                    $( id ).removeClass( 'overlay-open' );
                    $( 'body' ).removeClass( 'overlay-view' );
                }
            });
        });

    } // end of init()

    //translate the attribute name in the shapefile table into meaningful words
    var meaningfulAttributeNames = {
        // Intermodal Terminal
        'NAME':'Name',
        'MODE_TYPE':'Mode Type',

        // Grade Crossing
        'DAYTHRU': 'Day Thru Train',
        'NGHTTHRU': 'Night Thru Train',
        'RAILROAD': 'Railroad Operating Company',
        'BRANCH': 'Branch or Line Name',
        'DEVELTYP': 'Type of Development',
        'MAXTTSPD': 'Maximum Timetable Speed',
        'PRVIND': 'Signs / Signals',
        'PCTTRUK': 'Estimate Percent Trucks',
        'SCHLBUS': 'Avg. No of School Buses Passing Over the Crossing on a School Day',
        'WHISTBAN': 'Whistle Ban- Quiet Zone',
        'TYPEXING': 'Type of Crossing',

        // Public transit Facility
        'STATION': 'Station',
        'STR_ADD': 'Street Address',
        'RTS_SRVD': 'RTS_SRVD', // CHANGE

        // Railroad Speed
        'Max_Speed': 'Max Speed',

        // County Boundary
        'NAMELSAD10': 'Name',

        // Land Use
        'LANDUSE3': 'LANDUSE3', // CHANGE
        'Shape_Area': 'Shape_Area', // CHANGE // need to know whether it's acre or sq ft

        // Derailment Accident Risk

        // Flood Hazard
        'FLOODZONE': 'FLOODZONE', // CHANGE

        // Tornado Hazard
        'DATE_': 'Date',
        'FATAL': 'FATAL', // CHANGE
        'INJ': 'INJ', // CHANGE
        'DAMAGE': 'Damage',

        // Seismic Hazard
        'Maginitude':'Maginitude',

        // Employment Density
        'D1C': 'Employment Density (jobs/acre)',

        // Population Density
        'D1B': 'Population Density (person/acre)',

        // Archeologic Resource
        'AREA': 'Area (acres)',

        // Historical Site
        'ADDRESS': 'Address',
        //'NAME': 'Name',

        // Trail
        'FACNAME': 'Trail Name',
        'STATUS': 'Status',
        'GRNWYTrail': 'GRNWYTrail', // CHANGE
        'Shape_Leng': 'Shape_Leng', // CHANGE

        // Median Household Income
        //'NAME': 'Name',
        'MEDHINC': 'Medium Income (dollars)',

        // Modeled Air Emissions
        'TOT_CO2': 'Total CO2',
        'TOT_CO': 'Total CO',
        'TOT_NO': 'Total NO',
        'TOT_HC':'Total hydrocarbon',
        'TOT_PM':'Total PM',

        // Alluvial/Glacial Aquifer
        //'AREA': 'Area (acres)'

        // Shallowest Principal Aquifer
        'ROCK_NAME': 'Rock Name',
        'AQ_NAME': 'Aquifer Name',
        //'Shape_Leng': 'Shape_Leng', // CHANGE
        //'Shape_Area': 'Shape_Area', // CHANGE // need to know whether it's acre or sq ft

        // Bird Presence
        'Species': 'Species Name',
        'Population': 'Species Population',
        'IUCN_Categ': 'IUCN Category',

        // Critical Habitat

        // Natural Area
        'ACRES': 'Acres',
        //'NAME': 'Name',

        // Riparian Zone
        //'ACRES': 'Acres',

// below are not in use
//
//
        'MAXSPD':'MAX SPEED',
        'MAXSPD':' km/h',

        'comname':'COMMON NAME',
        'sciname':'SCIENTIFIC NAME',

        'SHAPE_Leng':'LENGTH',
        'Shape_Leng':'LENGTH',
        'Shape_Area':'AREA',
        'Shape_Area_unit':' acres',

        //emission
        'GiZScore':'GiZScore',

        //derailments:
        'sum':'TOTAL # OF ACCIDENTS (2009~2013)',
        'class':'TRACK CLASS',
        'signal':'SIGNALED',
        'risk':'RISK',
        'risk_unit':' accidents/billion gross ton-miles',
        'confidence':'RISK 95% CONFIDENCE INTERVAL',

        //areas to avoid
        'Field4':'LEVEL',
        'SoVI':'SOCIAL VULENERABILITY INDEX'
    };
    var popupAttributesForLayer = {
            // Transit Routes
                // CTA Train Routes
                'nurail:Blue':[]
                ,'nurail:Brown':[]
                ,'nurail:Green':[]
                ,'nurail:Orange':[]
                ,'nurail:Pink':[]
                ,'nurail:Purple':[]
                ,'nurail:Red':[]
                ,'nurail:Yellow':[]
            ,'nurail:MetroLinssshp':[]

            // Rail Infrastructure
            ,'nurail:intermodal_facility':['NAME', 'MODE_TYPE']
            ,'nurail:Illinois_Grade_Crossings':['DAYTHRU', 'NGHTTHRU', 'RAILROAD', 'BRANCH', 'DEVELTYP', 'MAXTTSPD', 'PRVIND', 'PCTTRUK', 'SCHLBUS', 'WHISTBAN', 'TYPEXING']
            ,'nurail:transit_station':['STATION', 'STR_ADD', 'RTS_SRVD']
            ,'nurail:Rail_Lines_w_Train_Speed':['Max_Speed']

            // Community Profile
            ,'nurail:county':['NAMELSAD10']
                // Land Use
                ,'nurail:agriculture':['LANDUSE3', 'Shape_Area']
                ,'nurail:commercial':['LANDUSE3', 'Shape_Area']
                ,'nurail:forest':['LANDUSE3', 'Shape_Area']
                ,'nurail:industrial':['LANDUSE3', 'Shape_Area']
                ,'nurail:institutional':['LANDUSE3', 'Shape_Area']
                ,'nurail:open_space':['LANDUSE3', 'Shape_Area']
                ,'nurail:residential':['LANDUSE3', 'Shape_Area']
                ,'nurail:transportation':['LANDUSE3', 'Shape_Area']
                ,'nurail:vacant':['LANDUSE3', 'Shape_Area']
                ,'nurail:water':['LANDUSE3', 'Shape_Area']
                ,'nurail:wetland':['LANDUSE3', 'Shape_Area']

            // Safety
                // Rail Safety Performance
                ,'nurail:accident':[] // CHANGE
                // Natural Hazard Areas
                ,'nurail:flood':['FLOODZONE']
                ,'nurail:tornado':['DATE_', 'FATAL', 'INJ', 'DAMAGE']
                ,'nurail:seismic':['Maginitude']

            // Livable Communities
                // Transit Accessibility
                ,'nurail:employment':['D1C']
                ,'nurail:population':['D1B']
                // Cultural Resources
                ,'nurail:archeological':['AREA']
                ,'nurail:chicago_landmark':['ADDRESS', 'NAME']
                ,'nurail:trails':['FACNAME', 'STATUS', 'GRNWYTrail', 'SHAPE_Leng']

            // Transit Equity
            ,'nurail:income':['NAME', 'MEDHINC']

            // Environmental Sustainability
                // Modeled Air Emissions
                ,'nurail:hotspot_buffer':[]
                ,'nurail:carbon':['TOT_CO2']
                ,'nurail:co':['TOT_CO']
                ,'nurail:no':['TOT_NO']
                ,'nurail:hydrocarbon':['TOT_HC']
                ,'nurail:pm':['TOT_PM']
                // Groundwater
                ,'nurail:alluvial_glacial_aquifers':['AREA']
                ,'nurail:shallowest_principal_aquifers':['ROCK_NAME', 'AQ_NAME', 'Shape_Leng', 'Shape_Area']
                // Habitat
                ,'nurail:bird':['Species', 'Population', 'IUCN_Categ']
                ,'nurail:habitat':[] // CHANGE
                ,'nurail:natural_area':['ACRES', 'NAME']
                ,'nurail:riverine':['ACRES']
    };

    ready(function (){
        parser.parse();
        init(); //this must be wrapped into ready function ()

        //start left pane
        var tree= new Tree( {
            model: cbTreeModel,
            id:"MapLayerTree"
        }, "CheckboxTree" );

        // Establish listener and start the tree.
        tree.on("checkBoxClick", checkBoxClicked);

        // Add initial layers
        for (var idx in initChecked) {
            var label = initChecked[idx];
            map.addLayer(layers[label]);
            checkedLayers.push(label);
            showLegend(WMSLayerNamesMapToTreeLayerNames[label]);
        }

        tree.startup();

        $('#MapLayerTree').css('overflow', 'hidden');

        console.log('done');
    });
});
