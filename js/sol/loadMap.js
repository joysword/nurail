require(["esri/dijit/OverviewMap", "esri/map", "esri/dijit/BasemapGallery", "esri/tasks/locator",
 // "esri/tasks/Print" file brings js errors
 "esri/tasks/PrintTask", "esri/tasks/PrintTemplate", "esri/tasks/PrintParameters", "esri/tasks/GeometryService",
"dijit/Menu", "dijit/form/DropDownButton", "dijit/TooltipDialog","esri/dijit/Geocoder", "cbtree/util/QueryEngine", "dijit/DropDownMenu", "dijit/MenuItem"]);

var map, locator, basemapGallery, printer, gs;

//no codes before init() or outside a function ?
// var extent = new esri.geometry.Extent(-122.68,45.53,-122.45,45.60, new esri.SpatialReference({ wkid:4326 }));
          

function init() {
    
    map = new esri.Map("map", {
        basemap : 'gray',
        center : [-87.651052, 41.872458],
        zoom : 10, //6
        sliderStyle : "small"
    });

    basemapGallery = new esri.dijit.BasemapGallery({
        showArcGISBasemaps : true,
        map : map
    });
    
    
    //create the geocoder widget
    // var geocoder = new esri.dijit.Geocoder({ 
      // autoNavigate: true, // do not zoom to best result
      // maxLocations: 20, // increase number of results returned
      // map: map,
     // //filter: QueryEngine( {"feature.attributes.Score":100}, {sort:[{property:"name"}]}), // Add a custom filter...
      // //filter: QueryEngine( {"feature.attributes.Score":100}), // Add a custom filter...
      // arcgisGeocoder: {
        // url: "http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer",
        // name: "Esri World Geocoder",
        // placeholder: "Find a location",
        // sourceCountry: "USA" // limit search to the United States
      // }
    // }, "search");
    // geocoder.startup();
    // geocoder.focus();
  
    // geocoding function
    locator = new esri.tasks.Locator("http://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer");
    dojo.connect(locator, "onAddressToLocationsComplete", showLocatingResults);
    
    // show popup information when click on a feature 
    dojo.connect(map, "onClick", showPopup);

    // printer  task    
    var printUrl="http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task";
    //printer=new esri.tasks.PrintTask(printUrl);
    
    var template = new esri.tasks.PrintTemplate();
        template.exportOptions = {
            width: 500,
            height: 400,
            dpi: 96
        };
        template.format = "PDF";
        template.layout = "MAP_ONLY";
        //template.preserveScale = false;
        
    // printer = new esri.dijit.Print({
        // "map": map,
        // "templates": template,
        // url: printUrl
    // }, dojo.byId("print"));
    // printer.startup();
    
    require(["dojo/on"], function(on) {
        
        //register onLoad function
        on(map, "Load", function() {
            
            // // add basemap gallery
            // //reference: http://help.arcgis.com/en/webapi/javascript/arcgis/jssamples/map_agol.html
            dojo.forEach(basemapGallery.basemaps, function(bmap) {
                //Add a menu item for each basemap, when the menu items are selected
                dijit.byId("basemapMenu").addChild(
                    new dijit.MenuItem({
                        label : bmap.title,
                        onClick : dojo.hitch(this, function() {
                            this.basemapGallery.select(bmap.id);
                        })
                    })
                );
            });
            
            // initialize overview map
            var overviewMapDijit = new esri.dijit.OverviewMap({
                map : map,
                visible : true
            });
            overviewMapDijit.startup();
        });

        //register onMouseMove function
        on(map, "MouseMove", function(evt) {
            var mp = evt.mapPoint;
            //dojo.byId("coord").innerHTML = mp.x + ", " + mp.y;
        });// end of onMouseMove function
        
    }); //end of function(on)
    
    // Save time by declaring your start extent up front 
    // this is the full extent for the state of Louisiana
    //var extent = new esri.geometry.Extent(-122.68,45.53,-122.45,45.60, new esri.SpatialReference({ wkid:4326 }));
    
    // Create the WMS_layer for each layer in layers
    for(var idx in layers){
        
        //alert(idx+" "+layers[idx]);

        layers[idx]=new dojo.declare(esri.layers.DynamicMapServiceLayer, {
            // Now for the constructor definition
            constructor: function(idx) {
                this.spatialReference = new esri.SpatialReference({wkid:4269});
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
              
                //alert("NULL,"+extent.spatialReference.wkid+","+map.extent.xmin);
                var params =
                    "service="+"WMS"+
                    "&version=" + "1.1.0" +
                    "&request=" + "GetMap" +
                    "&transparent="+ "true" +
                    "&layers="+workspace+this.id+
                    "&srs=EPSG:" + "4269" + // You need to use the WMS’s spatial wkid
                    "&width=" + width +  //441
                    "&height=" + height +  //512
                    "&styles=" +
                    "&format=" + "image/png"; 
                
                //alert("params:"+params); 
                
                gs = new esri.tasks.GeometryService("http://tasks.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer");               
                
                gs.project([ extent ], new esri.SpatialReference({ wkid:4269}) , function(features) {
                    var translatedExtent =  features[0];    
                    //alert(translatedExtent.spatialReference.wkid+","+translatedExtent.xmin);  
                    params +="&bbox=" + translatedExtent.xmin+","+translatedExtent.ymin+","+translatedExtent.xmax+","+translatedExtent.ymax;
                    //"&bbox=" + "-87.7575678843978,41.8509798545157,-87.5445361155993,41.893928932665";
                    // "&exceptions=" + "application/vnd.ogc.se_xml"

                    if(remote) callback("http://nurail.uic.edu/geoserver/nurail/wms?" + params );
                    else callback("http://localhost:8088/geoserver/NURail/wms?" + params );
                });//end of anonymous function
                
            } //end of method getImageUrl()
            
        })(idx); //end of declare    
        
    }
 
}

//show a graphic at the location of geocoding
function showLocatingResults(candidates) {
    var candidate;
    var symbol = new esri.symbol.SimpleMarkerSymbol().setStyle(esri.symbol.SimpleMarkerSymbol.STYLE_SQUARE).setColor(new dojo.Color([153, 0, 51, 0.75]));

    var infoTemplate = new esri.InfoTemplate("Location", "Address: ${address}<br />Score: ${score}<br />Source locator: ${locatorName}");
    var geom;

    dojo.every(candidates, function(candidate) {
        console.log(candidate.score);
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


var lastPopupGraphic, layerOfLastPopupGraphic; //when the layer it attaches to is removed, it should be also remove from the map
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

    }
    
    
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

//show the attribute information of a selected feature
function showPopup(evt){

    var point = evt.mapPoint;
    var symbol = new esri.symbol.SimpleMarkerSymbol().setStyle(esri.symbol.SimpleMarkerSymbol.STYLE_DIAMOND);
    
    var graphic = new esri.Graphic(point, symbol);

    
    //alert(checkedLayers);
    
       
    
   //retrieve the attribute info.
   
    gs.project([ point ], new esri.SpatialReference({ wkid:4269}), function(projectedPoints) {
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
}
                                
require(["dojo/ready"], function(ready){
    ready(function(){
        init(); //this must be wrapped into ready function()
    });
});


