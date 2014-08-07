var map, locator;
var lastPopupGraphic, layerOfLastPopupGraphic; //when the layer it attaches to is removed, it should be also removed from the map

require([
    "esri/dijit/OverviewMap", "esri/map", "esri/dijit/BasemapGallery",
    "esri/tasks/locator", "esri/tasks/GeometryService", "esri/dijit/Geocoder",

    // "esri/InfoTemplate",

    "esri/toolbars/draw", "esri/graphic", "esri/Color",

    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",

    "esri/tasks/BufferParameters",

    "dijit/registry", "dojo/on", "dojo/_base/array",

    // "dijit/layout/BorderContainer", "dijit/layout/ContentPane", 
    // "dijit/form/Button"

    "dojo/parser", "dojo/ready"
    ], function(
    OverviewMap, Map, BasemapGallery,
    Locator, GeometryService, Geocoder, // InfoTemplate,
    
    Draw, Graphic, Color,

    SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol,

    BufferParameters,
    
    registry, on, array,
    parser, ready
    ) {

    var basemapGallery, gs, toolbarDraw, toolbarBuffer;

    function init() {
        map = new Map("map", {
            basemap : 'gray',
            center : [-87.651052, 41.872458],
            zoom : 10, //6
            sliderStyle : "large",
            logo: false,
            showAttribution: false
        });

        // map = L.mapbox.map('map', 'joysword.i6b4jale').setView([41.8910,-87.6839], 11);

        basemapGallery = new BasemapGallery({
            showArcGISBasemaps : true,
            map : map
        });

        gs = new GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");
      
        // geocoding function
        locator = new Locator("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
        on(locator, "address-to-locations-complete",
            //show a graphic at the location of geocoding
            function showLocatingResults(candidates) {

                var symbol = new SimpleMarkerSymbol().setStyle(SimpleMarkerSymbol.STYLE_SQUARE).setColor(new dojo.Color([153, 0, 51, 0.75]));
                var infoTemplate = new esri.InfoTemplate("Location", "Address: ${address}<br />Score: ${score}<br />Source locator: ${locatorName}");
                var geom;

                array.every(candidates.addresses, function(candidate) {
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
        
        // show popup information when click on a feature 
        /*require(["dojo/on"], function(on) {
            on(map, "click",
                //show the attribute information of a selected feature
                function (evt) {

                    var point = evt.mapPoint;
                    var symbol = new esri.symbol.SimpleMarkerSymbol().setStyle(esri.symbol.SimpleMarkerSymbol.STYLE_DIAMOND);
                    var graphic = new esri.Graphic(point, symbol);
                    
                    //retrieve the attribute info
                    gs.project([ point ], new esri.SpatialReference({wkid:3857}), function(projectedPoints) {
                        pt = projectedPoints[0]; //pt is in longi-lati coordinates
                        
                        //need an asynchronous loop here:
                        //ref http://stackoverflow.com/questions/11488014/asynchronous-process-inside-a-javascript-for-loop
                        //the selected feature may belong to any of the following layer
                        for(var idx in checkedLayers){
                            var layerName='nurail:'+checkedLayers[idx];
                            
                           (function(layerName){
                               //Restful url for WFS service  http://docs.geoserver.org/stable/en/user/services/wfs/reference.html
                               //geometry_name:"the_geom" https://wiki.state.ma.us/confluence/display/massgis/GeoServer+-+WFS+-+Filter+-+DWithin
                               //version must be 1.0.0 why?
                               var url='http://nurail.uic.edu/geoserver/nurail/ows?service=WFS&version=1.0.0&request=GetFeature&typeName='+layerName+'&cql_filter=DWITHIN(the_geom,POINT('+pt.x+' '+pt.y+'),0.01,meters)&propertyName='+popupAttributesForLayer[layerName]+'&outputFormat=application/json';
                                
                                //asynochronous function to deal with the response
                                $.getJSON(url, function(obj){
                                    var cloestFeature=obj.features[0];
                                    
                                    if (typeof cloestFeature === 'undefined') {
                                        //alert("cloestFeature is undefined");
                                        return;
                                    }
                                    
                                    //for popup infowindow reference: https://developers.arcgis.com/en/javascript/jssamples/gp_popuplink.html
                                    var popupContent="<b>Detail Feature Information: </b> </br><hr>"
                                    
                                    //add geo-coordinates 
                                    // popupContent+= "<p><font color=\"grey\"> Latitude</font>: " + pt.y + "<br/> <font color=\"grey\">Longitude</font>: " + pt.x  + "</p>";
                                    
                                    //add feature-dependent information
                                    for (var idx in popupAttributesForLayer[layerName]){
                                        var propertyValue=cloestFeature.properties[popupAttributesForLayer[layerName][idx]];
                                        if (typeof propertyValue === "string" || propertyValue instanceof String){                         
                                            propertyValue=propertyValue.replace(/\\/g, " ");
                                        }
                                        popupContent+="<font color=\"grey\">"+meaningfulAttributeNames[popupAttributesForLayer[layerName][idx]]+"</font>: "+ propertyValue;
                                        
                                        var unit=meaningfulAttributeNames[popupAttributesForLayer[layerName][idx]+"_unit"]
                                        if (!(unit == undefined)){
                                            popupContent+="  "+unit;
                                        }
                                        popupContent+="<br/>";
                                    }

                                    graphic.setInfoTemplate(new esri.InfoTemplate("",popupContent));   
                                        //+ "<input type='button' value='Convert back to LatLong' onclick='projectToLatLong();' />" 
                                        //+ "<div id='latlong'></div>"
                                    
                                    //remove the old graphic and show the new graphic
                                    map.graphics.remove(lastPopupGraphic);
                                    map.graphics.add(graphic);
                                    lastPopupGraphic=graphic;
                                    layerOfLastPopupGraphic=layerName;
                                    
                                    //show the infoWindow
                                    map.infoWindow
                                    .setTitle(graphic.getTitle())
                                    .setContent(graphic.getContent())
                                    .show(screenPoint, map.getInfoWindowAnchor(screenPoint));
                                   
                                });
                           })(layerName); //pass the layerName to the anonymous function
                           
                        }
                    });
                    
                    // json=json.replace(/\\/g, ""); //replace all '\' with empty string
                    // obj = JSON.parse(json);
                });
        });*/

        on(map, "load", function() {
            toolbarDraw = new Draw(map);
            on(toolbarDraw, "draw-end", addDrawToMap);

            toolbarBuffer = new Draw(map);
            on(toolbarBuffer, "draw-end", addBufferToMap);
            
            // add basemap gallery
            // reference: http://help.arcgis.com/en/webapi/javascript/arcgis/jssamples/map_agol.html
            // array.forEach(basemapGallery.basemaps, function(bmap) {
            //     //Add a menu item for each basemap, when the menu items are selected
            //     dijit.byId("basemapMenu").addChild(
            //         new dijit.MenuItem({
            //             label : bmap.title,
            //             onClick : dojo.hitch(this, function() {
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

        // graphics that are drawn on the map
        var drawnGeom = [];

        // loop through all dijits, connect onClick event
        // listeners for buttons to activate drawing tools
        registry.forEach(function(d) {
            // d is a reference to a dijit
            // could be a layout container or a button
            if ( d.declaredClass === "dijit.form.Button" ) {
                if (d.class == "bufferButton" ) {
                    on(d, "click", activateBufferTool);
                }
                else {
                    on(d, "click", activateDrawTool);
                }
            }
        });

        function activateDrawTool() {
            var tool = this.label.toUpperCase().replace(/ /g, "_");
            toolbarDraw.activate(Draw[tool]);
            map.hideZoomSlider();

            // remove previous drawn graphics
            for (var i in drawnGeom) {
                map.graphics.remove(drawnGeom[i]);
            }
        }

        function activateBufferTool() {
            var tool = this.label.toUpperCase().replace(/ /g, "_");
            toolbarBuffer.activate(Draw[tool]);
            map.hideZoomSlider();

            // remove previous drawn graphics
            for (var i in drawnGeom) {
                map.graphics.remove(drawnGeom[i]);
            }
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
                symbol = new SimpleMarkerSymbol();
                break;
              default: // polygon
                symbol = new SimpleFillSymbol();
                break;
            }
            var graphic = new Graphic(geometry, symbol);
            map.graphics.add(graphic);

            drawnGeom.push(graphic);

            if (geometry.type == 'polygon') {
                
                //retrieve the attribute info
                gs.project([ geometry ], new esri.SpatialReference({wkid:3857}), function(projectedPolygons) {
                    var ring = projectedPolygons[0].rings[0];

                    var strRing = 'POLYGON((';

                    for (var i in ring) {
                        strRing += ring[i][0].toString() + ' ' + ring[i][1].toString() + ',';
                    }

                    //console.log('strRing:', strRing);

                    strRing = strRing.substring(0, strRing.length-1);
                    strRing += '))';

                    //console.log('strRing:', strRing);
                    
                    //need an asynchronous loop here:
                    //ref http://stackoverflow.com/questions/11488014/asynchronous-process-inside-a-javascript-for-loop
                    //the selected feature may belong to any of the following layer
                    for(var idx in checkedLayers){
                        var layerName='nurail:'+checkedLayers[idx];
                        
                       (function(layerName){
                           //Restful url for WFS service  http://docs.geoserver.org/stable/en/user/services/wfs/reference.html
                           //geometry_name:"the_geom" https://wiki.state.ma.us/confluence/display/massgis/GeoServer+-+WFS+-+Filter+-+DWithin
                           //version must be 1.0.0 why?
                           var url='http://nurail.uic.edu/geoserver/nurail/ows?service=WFS&version=1.0.0&request=GetFeature&typeName='+layerName+'&cql_filter=INTERSECTS(the_geom,' + strRing + ')&propertyName='+popupAttributesForLayer[layerName]+'&outputFormat=application/json';

                           //console.log('url:', url);
                            
                            //asynochronous function to deal with the response
                            $.getJSON(url, function(obj){
                                console.log('obj:', obj);

                                var cloestFeature=obj.features[0];
                                
                                // if (typeof cloestFeature === 'undefined') {
                                //     //alert("cloestFeature is undefined");
                                //     return;
                                // }
                                
                                //for popup infowindow reference: https://developers.arcgis.com/en/javascript/jssamples/gp_popuplink.html
                                var popupContent="<b>Detail Feature Information: </b> </br><hr>"
                                
                                //add geo-coordinates 
                                popupContent+= "<p><font color=\"grey\"> Geometry</font>: " + strRing + "</p>";
                                
                                //add feature-dependent information
                                for (var idx in popupAttributesForLayer[layerName]){
                                    var propertyValue=cloestFeature.properties[popupAttributesForLayer[layerName][idx]];
                                    if (typeof propertyValue === "string" || propertyValue instanceof String){                         
                                        propertyValue=propertyValue.replace(/\\/g, " ");
                                    }
                                    popupContent+="<font color=\"grey\">"+meaningfulAttributeNames[popupAttributesForLayer[layerName][idx]]+"</font>: "+ propertyValue;
                                    
                                    var unit=meaningfulAttributeNames[popupAttributesForLayer[layerName][idx]+"_unit"]
                                    if (!(unit == undefined)){
                                        popupContent+="  "+unit;
                                    }
                                    popupContent+="<br/>";
                                }

                                graphic.setInfoTemplate(new esri.InfoTemplate("",popupContent));   
                                    //+ "<input type='button' value='Convert back to LatLong' onclick='projectToLatLong();' />" 
                                    //+ "<div id='latlong'></div>"
                                
                                //remove the old graphic and show the new graphic
                                map.graphics.remove(lastPopupGraphic);
                                map.graphics.add(graphic);
                                lastPopupGraphic=graphic;
                                layerOfLastPopupGraphic=layerName;

                                console.log('graphic.getContent():',graphic.getContent());

                                // console.log('map.infoWindow:', map.infoWindow);
                                
                                //show the infoWindow
                                map.infoWindow.setTitle(graphic.getTitle());
                                //.setTitle(graphic.getInfoTemplate().title)
                                map.infoWindow.setContent(graphic.getContent());
                                //.setContent(graphic.getInfoTemplate().content)
                                //map.infoWindow.show(screenPoint);//, map.getInfoWindowAnchor(screenPoint));
                               
                            });
                       })(layerName); //pass the layerName to the anonymous function
                       
                    }
                });
            }
            else {
                // TODO
            }
        }

        // will be executed after buffer graphics were drawn
        function addBufferToMap(evt) {
            var symbol;
            var geometry = evt.geometry;
            toolbarBuffer.deactivate();
            map.showZoomSlider();
            switch (geometry.type) {
                case 'point':
                case 'multipoint':
                    var symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 6, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,0,0]), 1), new Color([0,255,0,0.25]));
                    break;
                case 'polyline':
                    var symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASH, new Color([255,0,0]), 1);
                    break;
                case 'polygon':
                    var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_NULL, new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT, new Color([255,0,0]), 2), new Color([255,255,0,0.25]));
                    break;
            }

            var graphic = new Graphic(geometry, symbol);
            map.graphics.add(graphic);

            drawnGeom.push(graphic);

            var params = new BufferParameters();
            params.distances = [dojo.byId("distance").value];
            params.bufferSpatialReference = map.spatialReference;
            params.outSpatialReference = map.spatialReference;
            params.unit = GeometryService[dojo.byId("unit").value];

            console.log('params:', params);

            if (geometry.type === "polygon") {
                //if geometry is a polygon then simplify polygon. This will make the user drawn polygon topologically correct.
                gs.simplify([geometry], function(geometries) {
                    params.geometries = geometries;
                    gs.buffer(params, showBuffer);
                });
            } else {
                params.geometries = [geometry];
                gs.buffer(params, showBuffer);
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

            array.forEach(bufferedGeometries, function(geometry) {
                var graphic = new Graphic(geometry, symbol);
                map.graphics.add(graphic);
                drawnGeom.push(graphic);
            });
        }

        // Create the WMS_layer for each layer in layers
        for(var idx in layers){
            
            // console.log("layers["+idx+"]:", layers[idx]);

            layers[idx] = new dojo.declare(esri.layers.DynamicMapServiceLayer, {
                // Now for the constructor definition
                constructor: function(idx) {
                    this.spatialReference = new esri.SpatialReference({wkid:3857});
                    this.loaded = true;
                    this.onLoad(this);
                    this.id=idx;
                    //alert(this.id);
                },
        
                //
                //invoked when "map.addLayer" method is invoked
                //
                getImageUrl: function(extent, width, height, callback) {
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
                    
                    gs.project([ extent ], new esri.SpatialReference({wkid:3857}) , function(features) {
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
    }

    //translate the attribute name in the shapefile table into meaningful words
    var meaningfulAttributeNames={
        'STREET':'STREET',
        'DAYTHRU':'DAY TRAFFIC VOLUME',
        'NGHTTHRU':'NIGHT TRAFFIC VOLUME',
        'MAXSPD':'MAX SPEED',
        'MAXSPD':' km/h',
        'STATION':'STATION',
        'STR_ADD':'STREET ADDRESS',
        'Max_Speed':'Max_Speed', 
        
        'NAME':'NAME',
        'TYPE':'TYPE',
        'comname':'COMMON NAME',
        'sciname':'SCIENTIFIC NAME',
        'ACRES':'ACRES',
        
        'SHAPE_Leng':'LENGTH',
        'Shape_Leng':'LENGTH',
        'Shape_Area':'AREA',
        'Shape_Area_unit':' acres',
        
        'D1B':'POPULATION DENSITY',
        'D1B_unit':' person/acre',
                
        'D1C':'EMPLOYMENT DENSITY',
        'D1C_unit':' jobs/acre',
        
        'MEDHINC':'MEDIUM INCOME',
        'MEDHINC_unit':' dollars',
        
        'NAMELSAD10':'NAME',
        
        //emission
        'GiZScore':'GiZScore',
        'TOT_CO2':'TOTAL CO2',
        'TOT_PM':'TOTAL PM',
        'TOT_NO':'TOTAL NO',
        'TOT_CO':'TOTAL CO',
        'TOT_HC':'TOTAL hydrocarbon',
        
        //Culture and Social Resources
        'ADDRESS':'ADDRESS',
        'FACNAME':'TRAIL NAME',
        'STATUS':'STATUS',
        'CNTYNAME':'COUNTY NAME',

        //derailments:
        'sum':'TOTAL # OF ACCIDENTS (2009~2013)',
        'class':'TRACK CLASS',
        'signal':'SIGNALED',
        'risk':'RISK',
        'risk_unit':' accidents/billion gross ton-miles',        
        'confidence':'RISK 95% CONFIDENCE INTERVAL',
        
        'Maginitude':'MAGINITUDE',
        
        //areas to avoid
        'Species':'SPECIES NAME',
        'Population':'SPECIES POPULATION',
        'Field4':'LEVEL',
        'SoVI':'SOCIAL VULENERABILITY INDEX',
        'ROCK_NAME':'ROCK NAME',
        'AQ_NAME':'AQUIFIER NAME',
        'DATE_':'DATE',
        'DAMAGE':'DAMAGE',
        'F_SCALE':'FUJITA SCALE',
        'FLOODZONE':'FLOODZONE',
    };
    var popupAttributesForLayer={
            //transport
            'nurail:Illinois_Grade_Crossings':['STREET', 'DAYTHRU', 'NGHTTHRU', 'MAXSPD']
            ,'nurail:transit_station':['STATION', 'STR_ADD']
            ,'nurail:Rail_Lines_w_Train_Speed':['Max_Speed']  
            ,'nurail:intermodal_facility':['NAME', 'TYPE']
            
            //natural areas
            ,'nurail:habitat':['comname', 'sciname']
            ,'nurail:riverine':['ACRES']
            ,'nurail:CONUS_wet_poly':['ACRES','SHAPE_Leng']
            
            //landuse
            ,'nurail:agriculture':['Shape_Area']
            ,'nurail:commercial':['Shape_Area']
            ,'nurail:forest':['Shape_Area']
            ,'nurail:industrial':['Shape_Area']
            ,'nurail:institutional':['Shape_Area']
            ,'nurail:open_space':['Shape_Area']
            ,'nurail:residential':['Shape_Area']
            ,'nurail:transportation':['Shape_Area']
            ,'nurail:vacant':['Shape_Area']
            ,'nurail:water':['Shape_Area']
            ,'nurail:wetland':['Shape_Area']
            
            //demographic
            ,'nurail:population':['D1B']
            ,'nurail:employment':['D1C']
            ,'nurail:income':['NAME', 'MEDHINC']
            
            //boundary
            ,'nurail:county':['NAMELSAD10']
            
            //emissions
            ,'nurail:hotspots':['GiZScore']
            ,'nurail:carbon':['TOT_CO2']
            ,'nurail:hydrocarbon':['TOT_HC']
            ,'nurail:pm':['TOT_PM']
            ,'nurail:no':['TOT_NO']
            ,'nurail:co':['TOT_CO']
            
            //Culture and Social Resources
            ,'nurail:chicago_landmark':['NAME', 'ADDRESS']
            ,'nurail:trails':['FACNAME', 'STATUS','SHAPE_Leng','CNTYNAME']
            
            //derailments
            ,'nurail:accident':['sum', 'class', 'signal', 'risk', 'confidence']
            ,'nurail:flood':['FLOODZONE']
            
            //areas to avoid
            ,'nurail:bird':['Species','Population']
            ,'nurail:seismic':['Maginitude']
            ,'nurail:seismic_fine':['Field4']
            ,'nurail:social_vulnerability_idx':['SoVI']
            ,'nurail:shallowest_principal_aquifers':['ROCK_NAME','AQ_NAME','Shape_Leng', 'Shape_Area']
            ,'nurail:tornado':['DATE_', 'DAMAGE', 'F_SCALE']
    };

    ready(function(){
        parser.parse();
        init(); //this must be wrapped into ready function()

        var offset = $('.accordion-toggle').length * $('.accordion-toggle').outerHeight(true)
            + $('#header').outerHeight(true);

        console.log('offset:',offset);

        $('.accordion-content').css('height', $(window).height() - offset);
        $('.accordion-content').hide();
        $('.accordion-content.default').show();

        $('.accordion-toggle').on('click', function() {

            $(this).next().slideDown('fast');

            $('.accordion-content').not($(this).next()).slideUp('fast');
        });

        $(window).resize(function () {
            $('.accordion-content').css('height', ($(window).height() - offset));
        }).resize();

        console.log('done');
    });
});

(function() {
})()
