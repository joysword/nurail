package layercontent;

import java.io.File;
import java.io.FileWriter;
import java.util.Arrays;
import java.util.Scanner;

import com.sun.corba.se.spi.orb.StringPair;

import sun.net.www.content.text.plain;

public class FileProcessing {
	public static void main(String[] args){
		new FileProcessing().main();
	}
	
	public static double[][] ILLINOIS_BOUNDARY={{-91.513078, -87.495}, {36.97029,42.508338}};
	
	public void main(){
		//extractIllinoisSeismicData();
		convertLatLongForBirdPresenceLayer();
	}
	
	public void extractIllinoisSeismicData(){
		try{
			String folder="E:/program_data/ArcGIS/NURail/Clean Layers/Illinois_only/seismic/";
			Scanner sc=new Scanner(new File(folder+"seismic.txt"));
			
			FileWriter fw=new FileWriter(folder+"illinois.txt");
			
			int fid=0;
			while(sc.hasNextLine()){
				String line=sc.nextLine().trim().replaceAll(" +", " ");
				String[] fields=line.split(" ");
				double lon=Double.parseDouble(fields[0]);
				double lat=Double.parseDouble(fields[1]);
				//System.out.println(lon+" "+lat);
				if(ILLINOIS_BOUNDARY[0][0]<=lon
						&&ILLINOIS_BOUNDARY[0][1]>=lon
						&&ILLINOIS_BOUNDARY[1][0]<=lat
						&&ILLINOIS_BOUNDARY[1][1]>=lat)
					fw.write(++fid+" "+lon+" "+lat+" "+Double.parseDouble(fields[2])+"\n");
				
			}
			sc.close();
			fw.close();
		}catch(Exception ex){
			ex.printStackTrace();
		}		
	}
	
	/**
	 * @param: csv file for the bird presence layer
	 * @return: convert coordinates from degree+minute with fraction to degree with fraction
	 */
	public static void convertLatLongForBirdPresenceLayer(){
		try{
			String dirString="C:/Users/Shuo/Desktop/";
			Scanner sc=new Scanner(new File(dirString+"bird_presence.txt"));
			FileWriter fw=new FileWriter("E:/program_data/ArcGIS/NURail/Clean Layers/Illinois_only/bird/"+"bird_presence.txt");
			
			fw.write(sc.nextLine()+"\n");//read off the header line
			while(sc.hasNextLine()){
				String line=sc.nextLine();
				String[] fields=line.split(",");
				fields[1]=convertCoord(fields[1]);
				fields[2]=convertCoord(fields[2]);
				
				for(int i=0;i<fields.length;i++){
					if(i>0) fw.write(",");
					fw.write(fields[i].trim());
				}
				
				fw.write("\n");
				//System.out.println(Arrays.toString(fields));
			}
			fw.close();
			sc.close();
		}catch(Exception ex){
			ex.printStackTrace();
		}
	}
	
	private static String convertCoord(String coord){
		String[] fields=coord.split("\\.");
		double fraction=0;
		//System.out.println(coord+" "+Arrays.toString(fields) );
		fraction+=Integer.parseInt(fields[1])/60.0;
		if(fields.length>2)
			fraction+=Integer.parseInt(fields[2])/100/60.0;
		
		if(Integer.parseInt(fields[0])>0)
			return String.format("%.6f",
				Integer.parseInt(fields[0])+fraction
			);
		else 		
			return String.format("%.6f",
				Integer.parseInt(fields[0])-fraction
			);
	}
	
	
}
