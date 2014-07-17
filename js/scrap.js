//NON_USE CODE

// sending asynchronous XML request for WFS
var xmlhttp;
        if (window.XMLHttpRequest)
        {// code for IE7+, Firefox, Chrome, Opera, Safari
            xmlhttp=new XMLHttpRequest();
        }else{// code for IE6, IE5
            xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
        }
        
var precision=3;
        //alert(pt.x+" "+pt.y);
        var spatialOp='Within';
        var postData =
              '<wfs:GetFeature\n'
              + '  service="WFS"\n'
              + '  version="1.0.0"\n'
              + '  outputFormat="application/json"\n'
              + '  xmlns:wfs="http://www.opengis.net/wfs" \n'
              + '  xmlns:ogc="http://www.opengis.net/ogc" \n'
              + '  xmlns:gml="http://www.opengis.net/gml/3.2" \n'
              + '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n'
              + '  xsi:schemaLocation="http://www.opengis.net/wfs \n'
              + '  http://schemas.opengis.net/wfs/1.0.0/WFS-basic.xsd" > \n'
              + '  <wfs:Query typeName="'+layerName+ '"> \n'
              //only retrive the following Property
              + '       <PropertyName>'+popupAttributesForLayer[layerName][0]+' </PropertyName>\n'
              
            + ' <ogc:Filter>\n'
            //+ '      <ogc:FeatureId fid="transit_sta.1"/>\n' 
            + '     <ogc:DWithin>\n'
            + '         <ogc:PropertyName>the_geom</ogc:PropertyName>\n'
            + '         <gml:Point srsName="http://www.opengis.net/gml/srs/epsg.xml#4269" > \n'
            + '             <gml:coordinates>'+pt.x+','+pt.y+'</gml:coordinates>\n'
            + '         </gml:Point>\n'
            + '         <ogc:Distance units="meter">1</ogc:Distance>\n'
            + '     </ogc:DWithin>\n'
            + ' </ogc:Filter>\n'
        
              //+ '       <'+spatialOp+'>\n'
              // + '           <PropertyName>GEOMETRY</PropertyName>\n'
              
              // + '           <gml:Box srsName="http://www.opengis.net/gml/srs/epsg.xml#4269" >\n'
              //pay attention to the longi/lati order
              // + '               <gml:coord>\n'
              // + '                   <gml:X>'+bbox[0]+'</gml:X> <gml:Y>'+bbox[1]+'</gml:Y>\n'
              // + '               </gml:coord>\n'
              // + '               <gml:coord>\n'
              // + '                   <gml:X>'+bbox[2]+'</gml:X> <gml:Y>'+bbox[3]+'</gml:Y>\n'
              // + '               </gml:coord>\n'
              // + '           </gml:Box>\n'
              

              // + '      </'+spatialOp+'>\n'
              + '  </wfs:Query>\n'
              + '</wfs:GetFeature>\n';
        
        //alert(postData);
        xmlhttp.open("POST","http://nurail.uic.edu/geoserver/wfs",true);
        xmlhttp.setRequestHeader('User-Agent', 'XMLHTTP/1.0');
        xmlhttp.setRequestHeader("Content-type","application/xml"); //application type must be xml
        xmlhttp.onreadystatechange = function () {
            if (xmlhttp.readyState != 4) return;
            if (xmlhttp.status != 200 && xmlhttp.status != 304) {
                alert('HTTP error ' + xmlhttp.status);
                return;
            }
            //dojo.byId("xmlResponse").value=xmlhttp.responseText; //this line freezes the browser; why?
            alert(xmlhttp.responseText);
            var obj = jQuery.parseJSON(xmlhttp.responseText);
            
            graphic.setInfoTemplate(new esri.InfoTemplate("Info.",
                "<p> Latitude: " + pt.y
                + "<br/> Longitude: " + pt.x  + "</p>" 
                + "Station Name: " + obj.features[0].properties[popupAttributesForLayer[layerName][0]]//.replace(/\\/g, " ") + "</br>"
                //+ "<input type='button' value='Convert back to LatLong' onclick='projectToLatLong();' />" 
                //+ "<div id='latlong'></div>"
            ));
            showPopup(graphic, evt.screenpoint);
        }
        //xmlhttp.send(postData);