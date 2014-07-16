// This program is used to generate a color ramp that assign different colors to features based on the value of a specified field

package style;
import java.awt.Color;
import java.io.File;
import java.io.FileWriter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Random;

import org.jdom.Document;
import org.jdom.Element;
import org.jdom.Namespace;
import org.jdom.input.SAXBuilder;
import org.jdom.output.Format;
import org.jdom.output.XMLOutputter;
 
public class CreateCustomizedSLD{
    public static void main(String[] args){
        new CreateCustomizedSLD().main();
    }
    
    public double[] generateValueRange(double s, double e, double incr){
        double[] ret=new double[(int) ((e-s)/incr)+1];
        int idx=0;
        for(double v=s; v<=e; v+=incr){
            ret[idx++]=v;
        }
        System.out.println(ret[ret.length-1]);
        return ret;
    }
    
    /**
     * 
     * @param numOfColors: #number of colors
     * @return
     */
    public ArrayList<Integer> generateRandomPalette(int numOfColors){
        HashSet<Float> H=new HashSet<Float>();
        HashSet<Float> S=new HashSet<Float>();
        HashSet<Float> B=new HashSet<Float>();
        ArrayList<Integer> colors=new ArrayList<Integer>();
        Random rand=new Random();
        float h, s, b;
        for(int i=0;i<numOfColors;i++){
            //generate hue
            while(true){
                h=rand.nextFloat();
                if(!H.contains(h)){
                    H.add(h);
                    break;
                }
            }
            //generate saturation
            while(true){
                s=rand.nextFloat();
                if(!S.contains(s)){
                    S.add(s);
                    break;
                }
            }
            //generate bringthness
            while(true){
                b=rand.nextFloat();
                if(!B.contains(b)){
                    B.add(b);
                    break;
                }
            }
            colors.add(Color.HSBtoRGB(h ,s , b) );
        }
        return colors;
    }
    
    //Java Hue Chart http://stackoverflow.com/questions/340209/generate-colors-between-red-and-green-for-a-power-meter
    /**
     * 
     * @param valueRange:  range of the value of interest
     * @param sColorInHue: starting hue value
     * @param eColorInHue: ending hue value
     * @return
     */
    public ArrayList<ArrayList<Double>> generateColorRamp(double[] valueRange, double sColorInHue, double eColorInHue){
        ArrayList<ArrayList<Double>> colorRamp=new ArrayList<ArrayList<Double>>();
        double H, S , B;
        Color c;
        String hexColor;
        ArrayList<Double> entry;
        for(int i=0;i<=valueRange.length;i++){
            if(i<valueRange.length) H = ( (valueRange[i]-valueRange[0] )/(valueRange[valueRange.length-1]-valueRange[0] )) *(eColorInHue-sColorInHue)+sColorInHue;
            else H=0.0;
            S = 0.9; // Saturation
            B = 0.9; // Brightness
            c=new Color(Color.HSBtoRGB((float)H, (float)S, (float)B));
            hexColor = String.format("#%06X", (0xFFFFFF & c.getRGB()));
            if(i<valueRange.length)  System.out.println(valueRange[i]+" "+c.getRGB()+" "+ c.toString() +"  "+ hexColor);
            else System.out.println("Infinity  "+c.getRGB()+" "+ c.toString() +"  "+ hexColor);
            entry=new ArrayList<Double>();
            if(i<valueRange.length)  entry.add(valueRange[i]);
            else entry.add(Integer.MAX_VALUE+0.0);
            entry.add(c.getRGB()+0.0);
            colorRamp.add(entry);
        }
        return colorRamp; 
    }
    
    
    public static final String BASE_DIR="E:/Dropbox/NURail/help_program/src/style/style_files/";
    
    
    
    public String ignoreFractionIfValueIsInteger(double value){
		String ret="";
    	if(value-(int)value==0) 
			ret=String.valueOf((int)value);
		else
			ret=String.valueOf(value);
    	//System.out.println(ret);
    	return ret;
    }
    /**
     * @geometry: "Polygon" or "Line" or "Point"
     * if "Point" then use a sizeramp otherwise a colorramp
     * @colorForPoint only used when the geometry is "point"
     * 
     */
    public void generateSLDForColorOrSizeRamp(String layerName, String propertyName, String geometry, ArrayList<ArrayList<Double>> colorOrSizeRamp, String colorForPoint){
    	String monochromePolygonTemplateFilePath=BASE_DIR+"template/color_ramp_template.xml";
    	String outputStyleFilePath=BASE_DIR+layerName+".xml";
    	
    	Namespace sLDNamespace=Namespace.getNamespace(  "http://www.opengis.net/sld");
    	try{
    		System.out.println("Creating style file for "+layerName+" layer");
        	
    		SAXBuilder builder = new SAXBuilder();
    		Document doc = (Document) builder.build(new File(monochromePolygonTemplateFilePath));
    		Element namedLayerElement = doc.getRootElement().getChild("NamedLayer", sLDNamespace);
    		//System.out.println(namedLayerElement.getName());
    		
    		
    		// update the layer name 
    		Element layerNameElement = namedLayerElement.getChild("Name", sLDNamespace);
    		layerNameElement.setText(layerName);
     
    		// update the title and abstract
    		Element userStyle = namedLayerElement.getChild("UserStyle", sLDNamespace); 
    		userStyle.getChild("Title", sLDNamespace).setText(layerName+" layer");
    		userStyle.getChild("Abstract", sLDNamespace).setText("a style that draws a "+geometry+" for "+ layerName+" layer");
    		
    		Element featureTypeStylElement=userStyle.getChild("FeatureTypeStyle", sLDNamespace);
    		
    		int n=colorOrSizeRamp.size();
    		double lastValue=0, curValue;
    		for(int i=0;i<n;i++){
    			//add a rule
    			curValue=colorOrSizeRamp.get(i).get(0);
    			
    			double colorOrSize=colorOrSizeRamp.get(i).get(1);
    			
    			Element ruleElement=new Element("Rule", sLDNamespace);
    			featureTypeStylElement.addContent(ruleElement);
        		
    			Element ruleTitleElement=new Element("Title", sLDNamespace);
    			ruleElement.addContent(ruleTitleElement);
        		
    			if(i==0||i==n-1){
        			if(i==0){
        				ruleTitleElement.setText("Below "+ignoreFractionIfValueIsInteger(curValue));
        			}else{
        				ruleTitleElement.setText("Above "+ ignoreFractionIfValueIsInteger(lastValue));
        			}
        		}else{
        			ruleTitleElement.setText("Between "+ignoreFractionIfValueIsInteger(lastValue)
        					+" and "+ignoreFractionIfValueIsInteger(curValue));
        		}
        		
        		
        		//add the filter of the rule
        		Namespace ogcNamespace=Namespace.getNamespace(  "http://www.opengis.net/ogc");;
        		Element filterElement=new Element("Filter", ogcNamespace);
        		ruleElement.addContent(filterElement);
        		
        		Element propertyNameElement;
        		if(i==0||i==n-1){
        			String ogcFilter;
        			if(i==0){
        				ogcFilter="PropertyIsLessThan";
        			}else{
        				ogcFilter="PropertyIsGreaterThan";
        			}
        			Element lessOrGreaterThanElement=new Element(ogcFilter, ogcNamespace);
        			filterElement.addContent(lessOrGreaterThanElement);
        			
        			propertyNameElement=new Element("PropertyName", ogcNamespace);
        			lessOrGreaterThanElement.addContent(propertyNameElement);        			
        			propertyNameElement.setText(propertyName);
        			
        			Element propertyValueElement=new Element("Literal", ogcNamespace);
        			lessOrGreaterThanElement.addContent(propertyValueElement);
        			if(i==0) propertyValueElement.setText(String.valueOf(curValue));
        			else propertyValueElement.setText(String.valueOf(lastValue));
        		}else{
        			
        			Element isBetweenElement=new Element("PropertyIsBetween", ogcNamespace);
        			filterElement.addContent(isBetweenElement);
        			
        			propertyNameElement=new Element("PropertyName", ogcNamespace);
        			isBetweenElement.addContent(propertyNameElement);
        			propertyNameElement.setText(propertyName);
        			
        			Element lowerBoundaryElement=new Element("LowerBoundary",ogcNamespace);
        			isBetweenElement.addContent(lowerBoundaryElement);
        			Element literalElement=new Element("Literal" ,ogcNamespace).setText(String.valueOf(lastValue));
        			lowerBoundaryElement.addContent(literalElement);
        			
        			Element upperBoundaryElement=new Element("UpperBoundary",ogcNamespace);
        			isBetweenElement.addContent(upperBoundaryElement);
        			literalElement=new Element("Literal", ogcNamespace).setText(String.valueOf(curValue));
        			upperBoundaryElement.addContent(literalElement);
        		}
		
        		lastValue=curValue;
        		
        		// symbolizer elements
        		Element symbolizerElement=new Element(geometry+"Symbolizer", sLDNamespace);
        		ruleElement.addContent(symbolizerElement);
        		
        		Element markElement=null, graphicElement=null;
        		
        		if(geometry.equals("Point")){//if geometry is a point
        			graphicElement=new Element("Graphic");
        			symbolizerElement.addContent(graphicElement);
        			        			
        			markElement=new Element("Mark");
        			graphicElement.addContent(markElement);
        			Element graphicShapeElement=new Element("WellKnownName");
        			graphicShapeElement.setText("circle"); //draw a circle
        			markElement.addContent(graphicShapeElement);
        		}
        		        		
        		//color
        		Element fillOrStrokeElement;
        		if(geometry.equals("Line")){
        			fillOrStrokeElement=new Element("Stroke",sLDNamespace);
        		}else{        			// geometry is a ploygon
        			fillOrStrokeElement=new Element("Fill",sLDNamespace);
        		}
        		Element cssParameterElement=new Element("CssParameter", sLDNamespace);
        		fillOrStrokeElement.addContent(cssParameterElement);
        		if(geometry.equals("Point")){//if geometry is point, then color is fix, size varies
        			cssParameterElement.setText(colorForPoint); //red
        		}else{//otherwise color varies
        			cssParameterElement.setText(String.format("#%06X", (0xFFFFFF & ((int)colorOrSize) )));
        		}
        		if(geometry.equals("Line")){
        			cssParameterElement.setAttribute("name","stroke");
        		}else{        			
        			cssParameterElement.setAttribute("name", "fill");
        		}
        		
        		if(geometry.equals("Polygon")){
	        		cssParameterElement=new Element("CssParameter", sLDNamespace);
	        		cssParameterElement.setAttribute("name","fill-opacity");
	        		cssParameterElement.setText("0.3");
	        		fillOrStrokeElement.addContent(cssParameterElement);
	        	}
        		
        		if(geometry.equals("Point")){
        			markElement.addContent(fillOrStrokeElement);
        			Element graphicSizeElement=new Element("Size");
        			Element graphicSizeLiteralElement=new Element("Literal", ogcNamespace).setText(String.valueOf(colorOrSize));
        			graphicSizeElement.addContent(graphicSizeLiteralElement);
        			graphicElement.addContent(graphicSizeElement);
        		}else{
        			symbolizerElement.addContent(fillOrStrokeElement);
        		}
        		
        		// additional "vertline" symbolizer for "rail_roads"
        		if(layerName.equals("rail_speed")){
        			symbolizerElement=new Element(geometry+"Symbolizer", sLDNamespace);
            		ruleElement.addContent(symbolizerElement);
            		
            		Element strokeElement=new Element("Stroke", sLDNamespace);
        			symbolizerElement.addContent(strokeElement);
        			
        			Element graphicStrokeElement=new Element("GraphicStroke",sLDNamespace);
        			strokeElement.addContent(graphicStrokeElement);
        			
        			graphicElement=new Element("Graphic", sLDNamespace);
        			graphicStrokeElement.addContent(graphicElement);
        			        			
        			markElement=new Element("Mark", sLDNamespace);
        			graphicElement.addContent(markElement);
        			Element graphicShapeElement=new Element("WellKnownName", sLDNamespace);
        			graphicShapeElement.setText("shape://vertline"); 
        			markElement.addContent(graphicShapeElement);
        			fillOrStrokeElement=new Element("Stroke", sLDNamespace);
        			markElement.addContent(fillOrStrokeElement);
        			
        			cssParameterElement=new Element("CssParameter",sLDNamespace);
        			cssParameterElement.setAttribute("name","stroke");
        			cssParameterElement.setText(String.format("#%06X", (0xFFFFFF & ((int)colorOrSize) )));
            		fillOrStrokeElement.addContent(cssParameterElement);
        			cssParameterElement=new Element("CssParameter",sLDNamespace);
        			cssParameterElement.setAttribute("name","stroke-width");
        			cssParameterElement.setText("1");
            		fillOrStrokeElement.addContent(cssParameterElement);
        		}
        		
    			
    		}
    			
    		//output the update XML file
    		XMLOutputter xmlOutput = new XMLOutputter();
    		// display nice nice
    		xmlOutput.setFormat(Format.getPrettyFormat());
    		xmlOutput.output(doc, new FileWriter(outputStyleFilePath));
    		// xmlOutput.output(doc, System.out);
    		System.out.println("File saved to "+outputStyleFilePath);
    	}catch(Exception ex){
    		ex.printStackTrace();
    	}
    }
    
    /**
     * 
     * @param layerName: name of WMS layer
     * @param color: color of WMS layer
     */
    public void generateSLDForMonochromePolygon(String layerName, String color){
    	String monochromePolygonTemplateFilePath=BASE_DIR+"template/monochrome_polygon_template.xml";
    	String outputStyleFilePath=BASE_DIR+layerName+".xml";

		Namespace namespace=Namespace.getNamespace(  "http://www.opengis.net/sld");
    	try{
    		System.out.println("Creating style file for "+layerName+" layer");
        	
    		SAXBuilder builder = new SAXBuilder();
    		Document doc = (Document) builder.build(new File(monochromePolygonTemplateFilePath));
    		Element namedLayerElement = doc.getRootElement().getChild("NamedLayer", namespace);
    		//System.out.println(namedLayerElement.getName());
    		
    		
    		// update the layer name 
    		Element layerNameElement = namedLayerElement.getChild("Name", namespace);
    		layerNameElement.setText(layerName);
     
    		// update the title and abstract
    		Element userStyle = namedLayerElement.getChild("UserStyle", namespace); 
    		userStyle.getChild("Title", namespace).setText(layerName+" layer");
    		userStyle.getChild("Abstract", namespace).setText("a style that draws a polygon for "+ layerName+" layer");
    		
    		
    		//update the rule
    		Element ruleElement=userStyle.getChild("FeatureTypeStyle", namespace)
    				.getChild("Rule", namespace);
    		ruleElement.getChild("Title", namespace).setText(layerName+" polygon");
    		ruleElement.getChild("Abstract", namespace).setText("a polygon with a "+color+" fill and a 1 pixel "+color+" outline");
    		
    		  	Element symbolizElement=new Element("PolygonSymbolizer",namespace);
    		  	ruleElement.addContent(symbolizElement);
    		  	
    			Element fillElement=new Element("Fill", namespace);
    			symbolizElement.addContent(fillElement);
    			
    			Element cssParameterElement=new Element("CssParameter", namespace);
        		cssParameterElement.setAttribute("name","fill");
        		cssParameterElement.setText(color);
        		fillElement.addContent(cssParameterElement);
    			
        		cssParameterElement=new Element("CssParameter", namespace);
        		cssParameterElement.setAttribute("name","fill-opacity");
        		cssParameterElement.setText("0.3");
        		fillElement.addContent(cssParameterElement);
    			
    			
    			Element strokeColorElement=new Element("Stroke", namespace);
    			symbolizElement.addContent(strokeColorElement);
    			
    			cssParameterElement=new Element("CssParameter", namespace);
    			cssParameterElement.setAttribute("name","stroke");
    			cssParameterElement.setText(color);
    			strokeColorElement.addContent(cssParameterElement);
    			//System.out.println(strokColorElement);
    			
    		//output the update XML file
    		XMLOutputter xmlOutput = new XMLOutputter();
    		// display nice nice
    		xmlOutput.setFormat(Format.getPrettyFormat());
    		xmlOutput.output(doc, new FileWriter(outputStyleFilePath));
    		// xmlOutput.output(doc, System.out);
    		System.out.println("File saved to "+outputStyleFilePath);
    	}catch(Exception ex){
    		ex.printStackTrace();
    	}
    	
    }
      
    
    public void generateSLDForRailRoadSpeedLayer(){
        double[] values=generateValueRange(20, 100, 20); //start, end, incr
        //Java Hue Chart http://stackoverflow.com/questions/340209/generate-colors-between-red-and-green-for-a-power-meter
        ArrayList<ArrayList<Double>> colorRamp=generateColorRamp(values, 0.0, 0.4);   // Hue (note 0=red, 0.4 = Green)
        //generateLineSymbolizer(colorRamp,"Max_Speed");
        generateSLDForColorOrSizeRamp("rail_speed", "Max_Speed", "Line", colorRamp, null);
    }
    
    /**
     * generate SLF files for polygon layers where
     * polygons are colored based on the value of certain field
     */
    public void generateSLDForColorRampedPolygons(){
    	String[] layers={"population","employment", "social_vulnerability_idx", "seismic", "income"};
    	String[] propertyNames={"D1B", "D1C", "SoVI", "Maginitude", "MEDHINC"};
    	
    	
    	double[][] values={
    			{0.01, 0.03, 0.05, 0.08, 0.12, 0.3, 0.5, 0.8, 1.2, 5, 8}
    			,{0.01, 0.03, 0.05, 0.08, 0.12, 0.3, 0.5, 0.8, 1.2, 5, 8}
    			,{-10, -5, 0, 5, 10, 15, 20, 25}
    			,{2,3,4,5,6,7,8,9,10,11,12,13,20,30,40,50,60,70,80,90}
    			,{25000, 40000, 60000, 90000, 140000, 200000, 260000}
    	};
    	
    	for(int i=0;i<layers.length;i++){
	        ArrayList<ArrayList<Double>> colorRamp=generateColorRamp(values[i], 0.4, 0.06);   // Hue (note 0=red, 0.4 = Green)        
	        generateSLDForColorOrSizeRamp(layers[i], propertyNames[i], "Polygon", colorRamp, null);
    	}
    }
    
    /**
     * Generate SLD for emission category data
     */
    public void generateSLDForEmissionCategory(){
    	String[] layers={"hotspots","PM", "NO", "carbon", "hydrocarbon", "CO"};
    	String[] propertyName={"GiZScore", "TOT_PM", "TOT_NO", "TOT_CO2", "TOT_HC", "TOT_CO"};
    	double[][] sizeRamps={
    			{-2.0, -1.0, 1.0, 2.0},  //hotspots 
    			{150, 500, 1000, 2000},  //PM
    			{6500, 20000, 40000, 75000}, //NO
    			{673000, 1900000, 3800000, 7000000},  //carbon
    			{250, 800, 1600, 3000}, //hydrocarbon
    			{1300, 3800, 7500, 15000}, //CO
    	};
    	double [] size={5, 7, 9, 11};
    	String[] colors={"#FFFF66", "#00FFFF", "#6600CC",	 "#FF3399", "#FF99FF",  "#0000CC"};
    	
    	for(int i=0;i<layers.length; i++){
    		String layer=layers[i];
    		
    		//build the sizeramp
    		ArrayList<ArrayList<Double>> sizeRamp=new ArrayList<ArrayList<Double>>();
    		for(int j=0;j<size.length;j++){
    			sizeRamp.add(new ArrayList<Double>());
    			sizeRamp.get(j).add(sizeRamps[i][j]); // the threshold value
    			sizeRamp.get(j).add(size[j]); // the size value
    		}
    		
    		generateSLDForColorOrSizeRamp(layer, propertyName[i], "Point", sizeRamp, colors[i]);
    	}
    }
    
    
    /**
     * Generate SLD files for land use category
     */
    public void generateSLDForLanduseCategory(){
    	String[] layers={"agriculture" , "commercial",   "forest",   "industrial",
    		    "institutional",	    "open_space",    "residential",
    		    "transportation",    "vacant",    "water",    "wetland"};
    	String[] colors={"#58DA00", "#E23352", "#00CF00", "#A121F0",
    			 "#65C7EA", "#96E78A", "#F0ED17",
    			 "#E8C7CC", "#E8FCD7",  "#97DBF2", "#64966A"};
    	
    	for(int i=0;i<layers.length;i++){
    		String R=colors[i].substring(1, 3);
    		String G=colors[i].substring(3, 5);
    		String B=colors[i].substring(5);
    		System.out.println(Integer.parseInt(R, 16)+" "+Integer.parseInt(G, 16)+" "+Integer.parseInt(B, 16)) ;
    		generateSLDForMonochromePolygon(layers[i],colors[i]);
    	}
    }
    
    public void main(){
    	
    	//generateSLDForEmissionCategory();
    	//generateSLDForColorRampedPolygons();
    	//generateSLDForRailRoadSpeedLayer();
       //generateSLDForWetlandsLayer();
    generateSLDForLanduseCategory();
    }
}
