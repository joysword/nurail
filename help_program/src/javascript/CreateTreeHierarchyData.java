package javascript;
import java.io.File;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Scanner;

public class CreateTreeHierarchyData{
    private static int leafLvl=3;
	private static Scanner sc; 
    
    public static void main(String[] args){
        try{
        	sc = new Scanner(new File("src/javascript/tree_hierarchy.txt"));
            String line;
            
            StringBuilder treeHierarchy=new StringBuilder();
            treeHierarchy.append("var treeHierarchyData=[\n");
            treeHierarchy.append("\t{ id: 'root', name:'Layers'},\n");
            String id="", parent="";
            String [] labelFields;
            int i, lvl=0; //indent level
            String lastLvl1="", lastLvl2="";
            HashSet<String> layerIDs=new HashSet<String>();
            
            ArrayList<String> layerLabels=new ArrayList<String>();
            ArrayList<String> layerPath=new ArrayList<String>();
            
            StringBuilder initChecked = new StringBuilder();
            initChecked.append("//layers that are checked at start\n");
            initChecked.append("var initChecked = [\n\t");
            
            HashMap<String, String> WMSLayerNameMappedToLayerLabel=new HashMap<String, String>();
            HashMap<String, ArrayList<String>> layerLabelMappedToWMSLayers=new HashMap<String, ArrayList<String>>();
            
            StringBuilder pathsOfAllLayers=new StringBuilder("var pathsOfAllLayers={'root':'root'");
            
            boolean firstCheckedLayer = true;
            
            while(sc.hasNextLine()){
                line=sc.nextLine();
                if(line.contains("//")) continue;//comment line skip it
                lvl=1;
                if(line.startsWith("    ")){ //one tab
                    lvl+=1;
                    if(line.startsWith("        ")){ //two tabs
                        lvl+=1;
                    }                    
                }
                line=line.trim();
                String WMSLayerName="", layerLabel;
                if(line.contains(" ")){
                	if(line.contains(":")){
                		String[] tempFields=line.split(":");
                		WMSLayerName=tempFields[1].trim();
                		layerLabel=tempFields[0].trim();
                		if (tempFields.length == 3) {
                			if (firstCheckedLayer) {
                				initChecked.append("\"" + WMSLayerName + "\"");
                				firstCheckedLayer = false;
               				}
               				else {
               					initChecked.append(",\"" + WMSLayerName + "\"");
               				}
                		}
                		labelFields=layerLabel.split(" ");
                		WMSLayerNameMappedToLayerLabel.put(WMSLayerName, layerLabel);
                	}
                	else{
                		layerLabel=line.trim();
                		labelFields=line.split(" ");
                	}
                }else{
                    labelFields=new String[1];
                    labelFields[0]=line;
                    layerLabel=line;
                }
                //id of a layer
                id="";
                for(i=0;i<labelFields.length-1;i++){
                    id+=labelFields[i].toLowerCase()+'_';
                }
                id+=labelFields[labelFields.length-1].toLowerCase();
                if(lvl!=leafLvl){
                    if(layerIDs.contains(id)){ 
                        System.out.println("ERROR, Duplicate Group ID: "+id+ "  "+ line);                    
                    }
                    layerIDs.add(id); 
                }
                //determine parent and output the path to the layer
                switch(lvl){
                    case 1:
                        parent="root";
                        lastLvl1=id;
                        layerPath.clear();
                        layerPath.add(layerLabel);
                        break;
                    case 2:
                        lastLvl2=id;
                        parent=lastLvl1;
                        String layer1=layerPath.get(0);
                        layerPath.clear();
                        layerPath.add(layer1);
                        layerPath.add(layerLabel);                        
                        break;
                    case 3: 
                        parent=lastLvl2;
                        if(layerPath.size()>2) layerPath.remove(layerPath.size()-1); 
                        layerPath.add(layerLabel);
                    default:
                        break;
                }
              //this line is a leaf in the tree hierarchy
               if(line.contains(":")){
                	String path="";
                    for(i=0;i<layerPath.size();i++){
                    	String lLayerLabel=layerPath.get(i);
                    	if(!layerLabelMappedToWMSLayers.containsKey(lLayerLabel)){
                    		layerLabelMappedToWMSLayers.put(lLayerLabel, new ArrayList<String>());
                    	}
                    	if(WMSLayerName.length()>0)
                    		layerLabelMappedToWMSLayers.get(lLayerLabel).add(WMSLayerName);
                    	
                        path+=lLayerLabel;
                        if(i<layerPath.size()-1) path+=" -> ";
                    }
                    pathsOfAllLayers.append(", '"+layerLabel+"':'"+path+"'");//add this path                        
                    layerLabels.add(layerLabel);//add the layer label
                }
                
                //indent
                for(i=0;i<=lvl;i++) treeHierarchy.append("\t");
                if (line.contains(": check")) {
                	treeHierarchy.append("{id:'"+id+"', name:'"+layerLabel+"', parent:'"+parent+"', checked:true},\n");
                }
                else {
                	treeHierarchy.append("{id:'"+id+"', name:'"+layerLabel+"', parent:'"+parent+"'},\n");
                }
            }
            treeHierarchy.append("];\n");
            System.out.println("//following fields are automatically generated by CreateTreeHierarchyData.java");
            System.out.println(treeHierarchy);
            //System.out.println();            
            
            //print out layer paths
            pathsOfAllLayers.append("};\n");
            System.out.println(pathsOfAllLayers);
            //System.out.println();            
            
            Collections.sort(layerLabels);
            //Print out all layer labels 
            System.out.print("var layerNamesInTheLeftPane = [");
            for(int j=0;j<layerLabels.size();j++){
            	if(j>0) System.out.print(",");
            	System.out.print("'"+layerLabels.get(j)+"'");
            }
            System.out.println("];");
            System.out.println();
            
            
            ArrayList<String> WMSLayerNames=new ArrayList<String>(WMSLayerNameMappedToLayerLabel.keySet());
            Collections.sort(WMSLayerNames);
            System.out.println("var WMSLayerNamesMapToTreeLayerNames={");
            for(String WMSLayerName: WMSLayerNames){
            	System.out.println("\t\""+WMSLayerName+"\" : \""+WMSLayerNameMappedToLayerLabel.get(WMSLayerName)+"\",");
            }
            System.out.println("};");            
            System.out.println();
            
            System.out.println("//WMS layers container\n//WMS_Layer_Name: WMS_Layer_Object");
            System.out.println("var layers={");
            for(String WMSLayerName: WMSLayerNames){
            	System.out.println("\t\""+WMSLayerName+"\" : \"\",");
            }
            System.out.println("};");            
            System.out.println();
            
            //System.out.println(layerLabelMappedToWMSLayers);
            System.out.println("var TreeLayerNamesMapToWMSLayers={");
            ArrayList<String> allLabels=new ArrayList<String>(layerLabelMappedToWMSLayers.keySet());
            Collections.sort(allLabels);
            for(String layerLabel: allLabels){    
            	
            	System.out.print("\t\""+layerLabel+"\" : [");
            	ArrayList<String> containedWMSLayers=layerLabelMappedToWMSLayers.get(layerLabel);
            	for(int j=0;j<containedWMSLayers.size();j++){
            		if(j>0) System.out.print(",");
            		System.out.print("\""+containedWMSLayers.get(j)+"\"");            		
            	}
            	System.out.println("],");
            }
            System.out.println("};\n");
            System.out.println(initChecked+"\n];");
            System.out.println("//end of automatically generated fields");
            
            
        }catch(Exception ex){
            ex.printStackTrace();
        }
    }
    

}