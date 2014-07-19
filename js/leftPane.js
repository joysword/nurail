//workspace: prefix of layer names
var workspace;
if (remote) workspace="nurail:";
else workspace="Nurail:";

//container that hold the names of WMS_layers that are clicked
var checkedLayers=[];

//following fields generated automatically using CreateTreeHierarchyData.java
var treeHierarchyData=[
	{ id: 'root', name:'Layers'},
		{id:'transit_routes', name:'Transit Routes', parent:'root'},
			{id:'cta_train_routes', name:'CTA Train Routes', parent:'transit_routes'},
				{id:'cta_blue_line', name:'CTA Blue Line', parent:'cta_train_routes', checked:true},
				{id:'cta_brown_line', name:'CTA Brown Line', parent:'cta_train_routes', checked:true},
				{id:'cta_green_line', name:'CTA Green Line', parent:'cta_train_routes', checked:true},
				{id:'cta_orange_line', name:'CTA Orange Line', parent:'cta_train_routes', checked:true},
				{id:'cta_pink_line', name:'CTA Pink Line', parent:'cta_train_routes', checked:true},
				{id:'cta_purple_line', name:'CTA Purple Line', parent:'cta_train_routes', checked:true},
				{id:'cta_red_line', name:'CTA Red Line', parent:'cta_train_routes', checked:true},
				{id:'cta_yellow_line', name:'CTA Yellow Line', parent:'cta_train_routes', checked:true},
			{id:'metra_lines', name:'Metra Lines', parent:'transit_routes', checked:true},
		{id:'rail_infrastructure', name:'Rail Infrastructure', parent:'root'},
			{id:'intermodal_terminal', name:'Intermodal Terminal', parent:'rail_infrastructure'},
			{id:'grade_crossing', name:'Grade Crossing', parent:'rail_infrastructure'},
			{id:'public_transit_facility', name:'Public Transit Facility', parent:'rail_infrastructure'},
			{id:'railroad_speed', name:'Railroad Speed', parent:'rail_infrastructure'},
		{id:'community_profile', name:'Community Profile', parent:'root'},
			{id:'county_boundary', name:'County Boundary', parent:'community_profile'},
			{id:'land_use', name:'Land Use', parent:'community_profile'},
				{id:'agriculture', name:'Agriculture', parent:'land_use'},
				{id:'commercial/office', name:'Commercial/Office', parent:'land_use'},
				{id:'forest/grassland', name:'Forest/Grassland', parent:'land_use'},
				{id:'industrial', name:'Industrial', parent:'land_use'},
				{id:'institutional', name:'Institutional', parent:'land_use'},
				{id:'open_space', name:'Open space', parent:'land_use'},
				{id:'residential', name:'Residential', parent:'land_use'},
				{id:'transportation', name:'Transportation', parent:'land_use'},
				{id:'vacant', name:'Vacant', parent:'land_use'},
				{id:'water', name:'Water', parent:'land_use'},
				{id:'wetland', name:'Wetland', parent:'land_use'},
		{id:'safety', name:'Safety', parent:'root'},
			{id:'rail_safety_performance', name:'Rail Safety Performance', parent:'safety'},
				{id:'derailment_accident', name:'Derailment Accident', parent:'rail_safety_performance'},
			{id:'natural_hazard_areas', name:'Natural Hazard Areas', parent:'safety'},
				{id:'flood_hazard', name:'Flood Hazard', parent:'natural_hazard_areas'},
				{id:'tornado_hazard', name:'Tornado Hazard', parent:'natural_hazard_areas'},
				{id:'seismic_hazard', name:'Seismic Hazard', parent:'natural_hazard_areas'},
		{id:'livable_communities', name:'Livable Communities', parent:'root'},
			{id:'transit_accessibility', name:'Transit Accessibility', parent:'livable_communities'},
				{id:'employment_density', name:'Employment Density', parent:'transit_accessibility'},
				{id:'population_density', name:'Population Density', parent:'transit_accessibility'},
			{id:'cultural_resources', name:'Cultural Resources', parent:'livable_communities'},
				{id:'archeologic_resource', name:'Archeologic Resource', parent:'cultural_resources'},
				{id:'historical_site', name:'Historical Site', parent:'cultural_resources'},
				{id:'trail', name:'Trail', parent:'cultural_resources'},
		{id:'transit_equity', name:'Transit Equity', parent:'root'},
			{id:'median_household_income', name:'Median Household Income', parent:'transit_equity'},
		{id:'environmental_sustainability', name:'Environmental Sustainability', parent:'root'},
			{id:'modeled_air_emissions', name:'Modeled Air Emissions', parent:'environmental_sustainability'},
				{id:'emission_hotspots', name:'Emission Hotspots', parent:'modeled_air_emissions'},
				{id:'carbon', name:'Carbon', parent:'modeled_air_emissions'},
				{id:'carbon_monoxide', name:'Carbon Monoxide', parent:'modeled_air_emissions'},
				{id:'nox', name:'NOx', parent:'modeled_air_emissions'},
				{id:'hydrocarbon', name:'Hydrocarbon', parent:'modeled_air_emissions'},
				{id:'pm10', name:'PM10', parent:'modeled_air_emissions'},
			{id:'groundwater', name:'Groundwater', parent:'environmental_sustainability'},
				{id:'alluvial/glacial_aquifer', name:'Alluvial/Glacial Aquifer', parent:'groundwater'},
				{id:'shallowest_principal_aquifer', name:'Shallowest Principal Aquifer', parent:'groundwater'},
			{id:'habitat', name:'Habitat', parent:'environmental_sustainability'},
				{id:'bird_presence', name:'Bird Presence', parent:'habitat'},
				{id:'critical_habitat', name:'Critical Habitat', parent:'habitat'},
				{id:'natural_area', name:'Natural Area', parent:'habitat'},
				{id:'riparian_zone', name:'Riparian Zone', parent:'habitat'},
];

var pathsOfAllLayers={'root':'root', 'CTA Blue Line':'Transit Routes -> CTA Train Routes -> CTA Blue Line', 'CTA Brown Line':'Transit Routes -> CTA Train Routes -> CTA Brown Line', 'CTA Green Line':'Transit Routes -> CTA Train Routes -> CTA Green Line', 'CTA Orange Line':'Transit Routes -> CTA Train Routes -> CTA Orange Line', 'CTA Pink Line':'Transit Routes -> CTA Train Routes -> CTA Pink Line', 'CTA Purple Line':'Transit Routes -> CTA Train Routes -> CTA Purple Line', 'CTA Red Line':'Transit Routes -> CTA Train Routes -> CTA Red Line', 'CTA Yellow Line':'Transit Routes -> CTA Train Routes -> CTA Yellow Line', 'Metra Lines':'Transit Routes -> Metra Lines', 'Intermodal Terminal':'Rail Infrastructure -> Intermodal Terminal', 'Grade Crossing':'Rail Infrastructure -> Grade Crossing', 'Public Transit Facility':'Rail Infrastructure -> Public Transit Facility', 'Railroad Speed':'Rail Infrastructure -> Railroad Speed', 'County Boundary':'Community Profile -> County Boundary', 'Agriculture':'Community Profile -> Land Use -> Agriculture', 'Commercial/Office':'Community Profile -> Land Use -> Commercial/Office', 'Forest/Grassland':'Community Profile -> Land Use -> Forest/Grassland', 'Industrial':'Community Profile -> Land Use -> Industrial', 'Institutional':'Community Profile -> Land Use -> Institutional', 'Open space':'Community Profile -> Land Use -> Open space', 'Residential':'Community Profile -> Land Use -> Residential', 'Transportation':'Community Profile -> Land Use -> Transportation', 'Vacant':'Community Profile -> Land Use -> Vacant', 'Water':'Community Profile -> Land Use -> Water', 'Wetland':'Community Profile -> Land Use -> Wetland', 'Derailment Accident':'Safety -> Rail Safety Performance -> Derailment Accident', 'Flood Hazard':'Safety -> Natural Hazard Areas -> Flood Hazard', 'Tornado Hazard':'Safety -> Natural Hazard Areas -> Tornado Hazard', 'Seismic Hazard':'Safety -> Natural Hazard Areas -> Seismic Hazard', 'Employment Density':'Livable Communities -> Transit Accessibility -> Employment Density', 'Population Density':'Livable Communities -> Transit Accessibility -> Population Density', 'Archeologic Resource':'Livable Communities -> Cultural Resources -> Archeologic Resource', 'Historical Site':'Livable Communities -> Cultural Resources -> Historical Site', 'Trail':'Livable Communities -> Cultural Resources -> Trail', 'Median Household Income':'Transit Equity -> Median Household Income', 'Emission Hotspots':'Environmental Sustainability -> Modeled Air Emissions -> Emission Hotspots', 'Carbon':'Environmental Sustainability -> Modeled Air Emissions -> Carbon', 'Carbon Monoxide':'Environmental Sustainability -> Modeled Air Emissions -> Carbon Monoxide', 'NOx':'Environmental Sustainability -> Modeled Air Emissions -> NOx', 'Hydrocarbon':'Environmental Sustainability -> Modeled Air Emissions -> Hydrocarbon', 'PM10':'Environmental Sustainability -> Modeled Air Emissions -> PM10', 'Alluvial/Glacial Aquifer':'Environmental Sustainability -> Groundwater -> Alluvial/Glacial Aquifer', 'Shallowest Principal Aquifer':'Environmental Sustainability -> Groundwater -> Shallowest Principal Aquifer', 'Bird Presence':'Environmental Sustainability -> Habitat -> Bird Presence', 'Critical Habitat':'Environmental Sustainability -> Habitat -> Critical Habitat', 'Natural Area':'Environmental Sustainability -> Habitat -> Natural Area', 'Riparian Zone':'Environmental Sustainability -> Habitat -> Riparian Zone'};

var layerNamesInTheLeftPane = ['Agriculture','Alluvial/Glacial Aquifer','Archeologic Resource','Bird Presence','CTA Blue Line','CTA Brown Line','CTA Green Line','CTA Orange Line','CTA Pink Line','CTA Purple Line','CTA Red Line','CTA Yellow Line','Carbon','Carbon Monoxide','Commercial/Office','County Boundary','Critical Habitat','Derailment Accident','Emission Hotspots','Employment Density','Flood Hazard','Forest/Grassland','Grade Crossing','Historical Site','Hydrocarbon','Industrial','Institutional','Intermodal Terminal','Median Household Income','Metra Lines','NOx','Natural Area','Open space','PM10','Population Density','Public Transit Facility','Railroad Speed','Residential','Riparian Zone','Seismic Hazard','Shallowest Principal Aquifer','Tornado Hazard','Trail','Transportation','Vacant','Water','Wetland'];

var WMSLayerNamesMapToTreeLayerNames={
	"Blue" : "CTA Blue Line",
	"Brown" : "CTA Brown Line",
	"Green" : "CTA Green Line",
	"Illinois_Grade_Crossings" : "Grade Crossing",
	"MetraLinesshp" : "Metra Lines",
	"Orange" : "CTA Orange Line",
	"Pink" : "CTA Pink Line",
	"Purple" : "CTA Purple Line",
	"Rail_Lines_w_Train_Speed" : "Railroad Speed",
	"Red" : "CTA Red Line",
	"Yellow" : "CTA Yellow Line",
	"accident" : "Derailment Accident",
	"agriculture" : "Agriculture",
	"alluvial_glacial_aquifers" : "Alluvial/Glacial Aquifer",
	"archeological" : "Archeologic Resource",
	"bird" : "Bird Presence",
	"carbon" : "Carbon",
	"chicago_landmark" : "Historical Site",
	"co" : "Carbon Monoxide",
	"commercial" : "Commercial/Office",
	"county" : "County Boundary",
	"employment" : "Employment Density",
	"flood" : "Flood Hazard",
	"forest" : "Forest/Grassland",
	"habitat" : "Critical Habitat",
	"hotspot_buffer" : "Emission Hotspots",
	"hydrocarbon" : "Hydrocarbon",
	"income" : "Median Household Income",
	"industrial" : "Industrial",
	"institutional" : "Institutional",
	"intermodal_facility" : "Intermodal Terminal",
	"natural_area" : "Natural Area",
	"no" : "NOx",
	"open_space" : "Open space",
	"pm" : "PM10",
	"population" : "Population Density",
	"residential" : "Residential",
	"riverine" : "Riparian Zone",
	"seismic" : "Seismic Hazard",
	"shallowest_principal_aquifers" : "Shallowest Principal Aquifer",
	"tornado" : "Tornado Hazard",
	"trails" : "Trail",
	"transit_station" : "Public Transit Facility",
	"transportation" : "Transportation",
	"vacant" : "Vacant",
	"water" : "Water",
	"wetland" : "Wetland",
};

//WMS layers container
//WMS_Layer_Name: WMS_Layer_Object
var layers={
	"Blue" : "",
	"Brown" : "",
	"Green" : "",
	"Illinois_Grade_Crossings" : "",
	"MetraLinesshp" : "",
	"Orange" : "",
	"Pink" : "",
	"Purple" : "",
	"Rail_Lines_w_Train_Speed" : "",
	"Red" : "",
	"Yellow" : "",
	"accident" : "",
	"agriculture" : "",
	"alluvial_glacial_aquifers" : "",
	"archeological" : "",
	"bird" : "",
	"carbon" : "",
	"chicago_landmark" : "",
	"co" : "",
	"commercial" : "",
	"county" : "",
	"employment" : "",
	"flood" : "",
	"forest" : "",
	"habitat" : "",
	"hotspot_buffer" : "",
	"hydrocarbon" : "",
	"income" : "",
	"industrial" : "",
	"institutional" : "",
	"intermodal_facility" : "",
	"natural_area" : "",
	"no" : "",
	"open_space" : "",
	"pm" : "",
	"population" : "",
	"residential" : "",
	"riverine" : "",
	"seismic" : "",
	"shallowest_principal_aquifers" : "",
	"tornado" : "",
	"trails" : "",
	"transit_station" : "",
	"transportation" : "",
	"vacant" : "",
	"water" : "",
	"wetland" : "",
};

var TreeLayerNamesMapToWMSLayers={
	"Agriculture" : ["agriculture"],
	"Alluvial/Glacial Aquifer" : ["alluvial_glacial_aquifers"],
	"Archeologic Resource" : ["archeological"],
	"Bird Presence" : ["bird"],
	"CTA Blue Line" : ["Blue"],
	"CTA Brown Line" : ["Brown"],
	"CTA Green Line" : ["Green"],
	"CTA Orange Line" : ["Orange"],
	"CTA Pink Line" : ["Pink"],
	"CTA Purple Line" : ["Purple"],
	"CTA Red Line" : ["Red"],
	"CTA Train Routes" : ["Blue","Brown","Green","Orange","Pink","Purple","Red","Yellow"],
	"CTA Yellow Line" : ["Yellow"],
	"Carbon" : ["carbon"],
	"Carbon Monoxide" : ["co"],
	"Commercial/Office" : ["commercial"],
	"Community Profile" : ["county","agriculture","commercial","forest","industrial","institutional","open_space","residential","transportation","vacant","water","wetland"],
	"County Boundary" : ["county"],
	"Critical Habitat" : ["habitat"],
	"Cultural Resources" : ["archeological","chicago_landmark","trails"],
	"Derailment Accident" : ["accident"],
	"Emission Hotspots" : ["hotspot_buffer"],
	"Employment Density" : ["employment"],
	"Environmental Sustainability" : ["hotspot_buffer","carbon","co","no","hydrocarbon","pm","alluvial_glacial_aquifers","shallowest_principal_aquifers","bird","habitat","natural_area","riverine"],
	"Flood Hazard" : ["flood"],
	"Forest/Grassland" : ["forest"],
	"Grade Crossing" : ["Illinois_Grade_Crossings"],
	"Groundwater" : ["alluvial_glacial_aquifers","shallowest_principal_aquifers"],
	"Habitat" : ["bird","habitat","natural_area","riverine"],
	"Historical Site" : ["chicago_landmark"],
	"Hydrocarbon" : ["hydrocarbon"],
	"Industrial" : ["industrial"],
	"Institutional" : ["institutional"],
	"Intermodal Terminal" : ["intermodal_facility"],
	"Land Use" : ["agriculture","commercial","forest","industrial","institutional","open_space","residential","transportation","vacant","water","wetland"],
	"Livable Communities" : ["employment","population","archeological","chicago_landmark","trails"],
	"Median Household Income" : ["income"],
	"Metra Lines" : ["MetraLinesshp"],
	"Modeled Air Emissions" : ["hotspot_buffer","carbon","co","no","hydrocarbon","pm"],
	"NOx" : ["no"],
	"Natural Area" : ["natural_area"],
	"Natural Hazard Areas" : ["flood","tornado","seismic"],
	"Open space" : ["open_space"],
	"PM10" : ["pm"],
	"Population Density" : ["population"],
	"Public Transit Facility" : ["transit_station"],
	"Rail Infrastructure" : ["intermodal_facility","Illinois_Grade_Crossings","transit_station","Rail_Lines_w_Train_Speed"],
	"Rail Safety Performance" : ["accident"],
	"Railroad Speed" : ["Rail_Lines_w_Train_Speed"],
	"Residential" : ["residential"],
	"Riparian Zone" : ["riverine"],
	"Safety" : ["accident","flood","tornado","seismic"],
	"Seismic Hazard" : ["seismic"],
	"Shallowest Principal Aquifer" : ["shallowest_principal_aquifers"],
	"Tornado Hazard" : ["tornado"],
	"Trail" : ["trails"],
	"Transit Accessibility" : ["employment","population"],
	"Transit Equity" : ["income"],
	"Transit Routes" : ["Blue","Brown","Green","Orange","Pink","Purple","Red","Yellow","MetraLinesshp"],
	"Transportation" : ["transportation"],
	"Vacant" : ["vacant"],
	"Water" : ["water"],
	"Wetland" : ["wetland"],
};
//end of automatically generated fields


//layers that are checked at start
var initChecked = [
	"Blue","Brown","Green","Orange","Pink","Purple","Red","Yellow", "MetraLinesshp"
];

//find layers related to the search keyword
function findRelevantLayer(){
	//data structures for supporting the "layer search" function

	dojo.byId("layerSearchResult").style.visibility='visible';
	
	var keyword =dojo.byId("layerSearchKeyword").value.toLowerCase();
	dojo.byId("layerSearchResult").value="";
	for (var idx in layerNamesInTheLeftPane){
		if (layerNamesInTheLeftPane[idx].toLowerCase().indexOf(keyword) != -1){
				dojo.byId("layerSearchResult").value+=pathsOfAllLayers[layerNamesInTheLeftPane[idx]]+"\n\n";
		}
	}
	if(dojo.byId("layerSearchResult").value==""){
		dojo.byId("layerSearchResult").value="Not exists a layer whose name contains the input keyword";
	}
}

var numberOfCheckedLandUseCategory=0;

function hideLegend(label){
	var layerNameHTMLNode, legendURLHTMLNode;
	switch(label){     
		case "Railroad Speed":
			dojo.byId("railSpeedLegendLabel").innerHTML="";
			dojo.byId("railSpeedLegendPicture").innerHTML="";
			break;   
		
		//landuse
		case "Land Use": 
		case "Agriculture":
		case "Commercial/Office":
		case "Forest/Grassland":
		case "Industrial":
		case "Institutional":
		case "Open space":
		case "Transportation":
		case "Residential":
		case "Vacant":
		case "Water":
		case "Wetland":
			if(label!="Land Use"){
				numberOfCheckedLandUseCategory=numberOfCheckedLandUseCategory-1;
			}
			if(label=="Land Use" || numberOfCheckedLandUseCategory==0){
				dojo.byId("landuseLegendLabel").innerHTML="";
				dojo.byId("landuseLegendPicture").innerHTML="";
				numberOfCheckedLandUseCategory=0;
			}
			break;
		
		//demographics
		case "Transit Accessibility":
			dojo.byId("incomeLegendLabel").innerHTML="";
			dojo.byId("incomeLegendPicture").innerHTML="";
			dojo.byId("employmentLegendLabel").innerHTML="";
			dojo.byId("employmentLegendPicture").innerHTML="";
			dojo.byId("populationLegendLabel").innerHTML="";
			dojo.byId("populationLegendPicture").innerHTML="";
			break;                    
		case "Population Density":
		case "Employment Density":
		case "Median Household Income":
			var fields=label.split(" ");
			dojo.byId(fields[0]+"LegendLabel").innerHTML="";
			dojo.byId(fields[0]+"LegendPicture").innerHTML="";
			break;
			
		//emissions    
		case "Modeled Air Emissions":
			dojo.byId("allPollutantsLegendLabel").innerHTML="";
			dojo.byId("allPollutantsLegendPicture").innerHTML="";
			break;
		case "Carbon":
	   
		case "Hydrocarbon":
		case "NOx":
		case "PM10":
		case "Seismic Hazard":
		case "social vulnerability index":
			var fields=label.split(" ");
			dojo.byId(fields[0]+"LegendLabel").innerHTML="";
			dojo.byId(fields[0]+"LegendPicture").innerHTML="";
			break;
		case "Carbon Monoxide":
			dojo.byId("COLegendLabel").innerHTML="";
			dojo.byId("COLegendPicture").innerHTML="";
			break;
	} 
}

function showLegend(label){
	var layerName, legendURL;
	switch(label){
		case "Railroad Speed":
			legendURL="\/img\/legends\/rail_speed.png";
			dojo.byId("railSpeedLegendLabel").innerHTML="Rail Speed (km/h) </br>";
			dojo.byId("railSpeedLegendPicture").innerHTML="<img style=\"border:none;\" src="+legendURL+">";
			break; 
		
		case "Land Use": 
		case "Agriculture":
		case "Commercial/Office":
		case "Forest/Grassland":
		case "Industrial":
		case "Institutional":
		case "Open space":
		case "Transportation":
		case "Residential":
		case "Vacant":
		case "Water":
		case "Wetland":
			legendURL="\/img\/legends\/landuse.png";
			dojo.byId("landuseLegendLabel").innerHTML="Land Use  </br>";
			dojo.byId("landuseLegendPicture").innerHTML="<img height=\"180\" width=\"160\" style=\"border:none;\" src="+legendURL+">";
			if(label=="Land Use"){
				numberOfCheckedLandUseCategory=11;
			}else{
				numberOfCheckedLandUseCategory=numberOfCheckedLandUseCategory+1;
			}
			break;
			
		case "Transit Accessibility":
			legendURL="\/img\/legends\/population.png";
			dojo.byId("populationLegendLabel").innerHTML="Population Density \</br> (persons/acre) </br>";
			dojo.byId("populationLegendPicture").innerHTML="<img height=\"180\" width=\"160\" style=\"border:none;\" src="+legendURL+">";
			
			legendURL="\/img\/legends\/income.png";
			dojo.byId("incomeLegendLabel").innerHTML="Income Level \</br> (dollar/year) </br>";
			dojo.byId("incomeLegendPicture").innerHTML="<img height=\"120\" width=\"160\" style=\"border:none;\" src="+legendURL+">";
			break;
		case "Median Household Income":
			legendURL="\/img\/legends\/income.png";
			dojo.byId("MedianLegendLabel").innerHTML="Median Household Income \</br> (dollar/year) </br>";
			dojo.byId("MedianLegendPicture").innerHTML="<img height=\"120\" width=\"160\" style=\"border:none;\" src="+legendURL+">";
			break;
		case "Employment Density":
			legendURL="\/img\/legends\/employment.png";
			dojo.byId("EmploymentLegendLabel").innerHTML="Employment Density \</br> (jobs/acre) </br>";
			dojo.byId("EmploymentLegendPicture").innerHTML="<img height=\"180\" width=\"160\" style=\"border:none;\" src="+legendURL+">";
			break;
		case "Population Density":
			legendURL="\/img\/legends\/population.png";
			dojo.byId("PopulationLegendLabel").innerHTML="Population Density \</br> (persons/acre) </br>";
			dojo.byId("PopulationLegendPicture").innerHTML="<img height=\"180\" width=\"160\" style=\"border:none;\" src="+legendURL+">";
			break;
		
			
		case "all pollutants emissions":
			legendURL="\/img\/legends\/hotspots.png";
			dojo.byId("allPollutantsLegendLabel").innerHTML=label+ " \</br> ";
			dojo.byId("allPollutantsLegendPicture").innerHTML="<img height=\"120\" width=\"160\" style=\"border:none;\" src="+legendURL+">";
			break;
		
		case "Carbon":
		case "Hydrocarbon":
		case "NOx":
		case "PM10":
		case "Seismic Hazard":
		case "social vulnerability index":
			var fields=label.split(" ");
			//alert(fields[0]+"LegendLabel");
			legendURL="\/img\/legends\/"+fields[0]+".png";
			dojo.byId(fields[0]+"LegendLabel").innerHTML=label+ " \</br> ";
			dojo.byId(fields[0]+"LegendPicture").innerHTML="<img height=\"120\" width=\"180\" style=\"border:none;\" src="+legendURL+">";
			break;
		 case "Carbon Monoxide":
			//alert(fields[0]+"LegendLabel");
			legendURL="\/img\/legends\/CO.png";
			dojo.byId("COLegendLabel").innerHTML=label+ " \</br> ";
			dojo.byId("COLegendPicture").innerHTML="<img height=\"120\" width=\"180\" style=\"border:none;\" src="+legendURL+">";
			break;
	}
}

var cbTreeModel;
var store;

require(["dojo/ready",
"dojo/store/Memory",
"dojo/store/Observable",
"cbtree/Tree",                 // Checkbox tree
"cbtree/model/TreeStoreModel"  // ObjectStoreModel
], function(ready, Memory, Observable, Tree, ObjectStoreModel) {
  
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

	ready(function(){
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
		
		//start right pane
		// no need for dynamic legend anymore
		// var legend = new esri.dijit.Legend({
			  // map  : map,
			  // layerInfos : legendLayers
			// }, "legendPane");
		// for(var idx in legendLayers) alert(lengendLayers[idx].title);
		// legend.startup();

		
		//$("#MapLayerTree").css("overflow", "hidden");

		var node = dojo.byId("MapLayerTree");
		// console.log('node:', node);
		dojo.style(node, "overflow", "hidden");
		// console.log('node:', node);
 
	});
});