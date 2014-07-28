package riskanalysis;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Scanner;

import org.apache.commons.math3.stat.correlation.PearsonsCorrelation;


public class RiskAnalysis {

	public static HashMap<String, RiskCluster> riskClusters=new HashMap<String, RiskCluster>();
	public static HashMap<String, Track> tracks=new HashMap<String, Track>();
	private static Scanner sc;
	private static BufferedReader reader;
	
	public static void main(String[] args) {
		new RiskAnalysis().main();
		
		//unitTest();
	}
	
	
	public boolean parseMethodOfOperation(String methodOfOperation){
		switch(methodOfOperation){
		case "1":
			return true;
		default:
			return false;
		}
	}
	
	//default split does not work because some field may contains ","
	public String[] split(String line){
		String[] fields=new String[Constants.NO_OF_FIELDS];
		for(int j=0;j<fields.length;j++) fields[j]="";
		
		int j=0;
		boolean quoteOpen=false;
		for(int i=0;i<line.length();i++){
			char c=line.charAt(i);
			if(c==','){
				if(!quoteOpen) j++; //only increase j when find a pair of quotes
				continue;
			}
			if(c=='"'){
				quoteOpen^=true;
				continue; 
			}
			fields[j]+=String.valueOf(c);
		}
		return fields;
	}
	
	/**
	 * 
	 * @param fileName
	 * @return build information about all tracks
	 */
	public void initializeTracks(String fileName){
		try{
			File f=new File(fileName);
			reader =new BufferedReader(new FileReader(fileName));

			System.out.println(Arrays.toString(f.getName().split("\\.") ));
			int year=Integer.parseInt( f.getName().split("\\.")[0] );
			
			String line;
			String[] fields;
			reader.readLine(); //read off the header;
			
			int noOfLines=1 , noOfAccidents=0;
			while( (line=reader.readLine())!=null){
				noOfLines+=1;
				fields=split(line);

				//not a derailment accident in Illinois and the track class does not fall in 1~5
				if(!fields[Constants.ACCIDENT_TYPE_FIELD_INDEX].equals("01")
						||!fields[Constants.STATE_FIELD_INDEX].equals("17")
						||!(
							fields[Constants.RAIL_CLASS_FIELD_INDEX].equals("1")
							|| fields[Constants.RAIL_CLASS_FIELD_INDEX].equals("2")
							|| fields[Constants.RAIL_CLASS_FIELD_INDEX].equals("3")
							|| fields[Constants.RAIL_CLASS_FIELD_INDEX].equals("4")
							|| fields[Constants.RAIL_CLASS_FIELD_INDEX].equals("5")
						)
				){
					continue;
				}
				noOfAccidents+=1;
				//System.out.println(fields.length);
				

				String railClass=fields[Constants.RAIL_CLASS_FIELD_INDEX];
				//System.out.println(railClass);
				boolean signaled=parseMethodOfOperation(fields[Constants.SIGNALED_FIELD_INDEX]);
				
				
				Track track;
				//a new track
				if(!tracks.containsKey(fields[Constants.TRACK_NAME_FIELD_INDEX])){
					track=new Track(fields[Constants.TRACK_NAME_FIELD_INDEX], railClass, signaled, 
							fields[Constants.LATITUDE_FIELD_INDEX], fields[Constants.LONGITUDE_FIELD_INDEX]);
					tracks.put(fields[Constants.TRACK_NAME_FIELD_INDEX], track);
				}else{
					track=tracks.get(fields[Constants.TRACK_NAME_FIELD_INDEX]);
				}
				//update annual stat
				if(!track.yearlyStats.containsKey(year)){ // a new year for the track
					track.yearlyStats.put(year, new AnnualStat(year));
				}
				AnnualStat as=track.yearlyStats.get(year); 
				try{
					as.totalTonnage+=Double.parseDouble(fields[Constants.TRAFFIC_DENSITY_FIELD_INDEX]); //ton
				}catch(Exception ex){
					as.totalTonnage+=0;
				}
				//System.out.println(fields[Constants.TRAFFIC_DENSITY_FIELD_INDEX]);
				as.derailmentCnt+=1; //cnt			
			}
			System.out.println("noOfLines in file: "+noOfLines + "  noOfAccident lines: "+noOfAccidents);
			System.out.println("no of tracks involved in accidents: "+ tracks.size());
			reader.close();
		}catch(Exception ex){
			ex.printStackTrace();
		}
	}
	
	
	/**
	 * build information about all clusters using tracks information
	 */
	public void computeRiskClusters(){
		//initialize
		boolean[] trueAndFalse={true, false};
		for(int railClass=1;railClass<=Constants.NO_OF_RAIL_CLASS;railClass++){
			for(boolean signaled: trueAndFalse){
				for(boolean trafficDensityAboveThr: trueAndFalse){
					RiskCluster rc=new RiskCluster(Track.getID(String.valueOf(railClass), signaled, trafficDensityAboveThr));
					riskClusters.put(rc.ID, rc);
					
				}
			}
		}
		
		//update
		try{
			for(Track track: tracks.values()){
				for(AnnualStat as: track.yearlyStats.values()){
					as.trafficDensityAboveThr=as.totalTonnage>=Constants.TRAFFIC_DENSITY_THRESHOLD?true:false;
					
					String key=Track.getID(String.valueOf(track.railClass), track.signaled, as.trafficDensityAboveThr);
					//System.out.println(key);
					RiskCluster rc=riskClusters.get(key);					
					if(rc!=null){
						//update the selected risk cluster
						if(!rc.annualTracks.containsKey(as.year)){
							rc.annualTracks.put(as.year, new ArrayList<Track>());
						}
						rc.annualTracks.get(as.year).add(track);
					}else{
						System.out.println(key+" not exists  "+track.railClass);
					}
				}
			}
		}catch(Exception ex){
			ex.printStackTrace();
		}

	}
	
	public void printTracks(){
		ArrayList<String> trackIDs=new ArrayList<String>(tracks.keySet());
		Collections.sort(trackIDs);
		System.out.println("**************** list of tracks *********************");		
		for(String trackId: trackIDs){
			String line=tracks.get(trackId).toString();
			if(!line.contains("0.0"))//if the track has longitude and latitude
				System.out.println(line);
		}
		System.out.println();
	}
	
	
	public void printRiskClusters(){
		ArrayList<String> clusterIDs=new ArrayList<String>(riskClusters.keySet());
		Collections.sort(clusterIDs);
		
		System.out.println("**************** list of risk clusters *********************");
		for(String clusterID: clusterIDs){
			System.out.println(riskClusters.get(clusterID));
		}
		System.out.println();
	}
	
	public void main(){		
		String[] years={"09","10", "11","12","13"};
		for(String year: years){
			System.out.println("****************** analysis of year "+year+" **********************");
			String fileName=Constants.RAW_DATA_DIR+year+".txt";
			initializeTracks(fileName);		
		}
		computeRiskClusters();		
		printRiskClusters();
		printTracks();
		System.out.println();
		
		//calculateCoefficients();
		
		

	}
	
	public static void unitTest(){
		String line=",12,07,IC,752002,,,,,12,07,IC,752002,,,12,07,15,2,50,AM,12,0,0,0,0,,HOMEWOOD,23.00,17,73,4,1,003,E,,1,2535,6,N,TRACK MA02,1,,2,ITLX,030717,001,Y,,,000,,0,0,0,0,0,0,0,0,0,0,14,0,1,0,0,0,0,0,0,0,1500,0,H020,,0,0,0,0,H020,2,1,005,12600,,17C031,0,000000,0,0,0,0,0,,,,,3,4,,1L,,,,402,,2012,0,0,0,0,0,0,COOK,031,00,00,,N,OTH,,\"R97291-14 WAS IN THE PROCESS OF SWITCHING TRACK MA17.  AFTER COMPLETING THE TRACK, THE CREW WENT DOW\",\"N WITH LIGHT POWER TO SHOVE TRACK MA01 IN THE CLEAR.  WHILE IN THE PROCESS OF SHOVING THE TRACK, A C\",UT OF 15 CARS THAT WAS PREVIOUSLY SWITCHED INTO TRACK MA02 ROLLED OUT CAUSING ITLX 30717 FROM MA02 I,\"MPACT TO TILX 318091 ON THE LEAD.  NO CARS WERE DERAILED.  CREW WAS TESTED, ALL RESULTS WERE NEGATIV\",E.,,,,,,,,,,,0,46.577732,-87.656178,2,5,,,,CHICAGO";
		//header
		//String line="AMTRAK,IYR,IMO,RAILROAD,INCDTNO,IYR2,IMO2,RR2,INCDTNO2,IYR3,IMO3,RR3,INCDTNO3,DUMMY1,GXID,YEAR,MONTH,DAY,TIMEHR,TIMEMIN,AMPM,TYPE,CARS,CARSDMG,CARSHZD,EVACUATE,DIVISION,STATION,MILEPOST,STATE,TEMP,VISIBLTY,WEATHER,TRNSPD,TYPSPD,TRNNBR,TRNDIR,TONS,TYPEQ,EQATT,TRKNAME,TRKCLAS,TRKDNSTY,TYPTRK,RRCAR1,CARNBR1,POSITON1,LOADED1,RRCAR2,CARNBR2,POSITON2,LOADED2,HEADEND1,MIDMAN1,MIDREM1,RMAN1,RREM1,HEADEND2,MIDMAN2,MIDREM2,RMAN2,RREM2,LOADF1,LOADP1,EMPTYF1,EMPTYP1,CABOOSE1,LOADF2,LOADP2,EMPTYF2,EMPTYP2,CABOOSE2,EQPDMG,TRKDMG,CAUSE,CAUSE2,CASKLDRR,CASINJRR,CASKLD,CASINJ,ACCAUSE,ACCTRK,ACCTRKCL,HIGHSPD,ACCDMG,DUMMY2,STCNTY,TOTINJ,DUMMY3,TOTKLD,ENGRS,FIREMEN,CONDUCTR,BRAKEMEN,ENGHR,ENGMIN,CDTRHR,CDTRMIN,JOINTCD,REGION,DUMMY4,TYPRR,DUMMY5,RRDIV,METHOD,NARRLEN,DUMMY6,YEAR4,RREMPKLD,RREMPINJ,PASSKLD,PASSINJ,OTHERKLD,OTHERINJ,COUNTY,CNTYCD,ALCOHOL,DRUG,DUMMY7,PASSTRN,SSB1,SSB2,NARR1,NARR2,NARR3,NARR4,NARR5,NARR6,NARR7,NARR8,NARR9,NARR10,NARR11,NARR12,NARR13,NARR14,NARR15,RCL,Latitude,Longitud,SIGNAL,MOPERA,ADJUNCT1,ADJUNCT2,ADJUNCT3,SUBDIV";
		
		/*
		 * Scanner doesnot work, but BufferedReader works
		 */
		try{
			sc = new Scanner(new File(Constants.RAW_DATA_DIR+"12.txt"));
			int cnt=0;
			//sc.nextLine();
			while (true) {
				if(sc.hasNextLine()) line=sc.nextLine();
				else break;
				String[]field=line.split(",");
				//System.out.println(field.length);
				for(int i=0;i<field.length;i++){
					//System.out.println(i+" "+field[i]);
				}
				System.out.println(++cnt+": ");
			}
			
			
			reader = new BufferedReader(new FileReader(Constants.RAW_DATA_DIR+"11.txt"));
		    cnt=0;
			while ((line = reader.readLine()) != null) {
		        //process each line in some way
				System.out.println(++cnt+": ");
		    }      
			
		}catch(Exception ex){
			ex.printStackTrace();
		}
	}
	

	//calculate the pearson coefficient between
	// the track class variable and the signal varible
	public static void calculateCoefficients(){
		int noOfVariables=3;
		double[][] data=new double[tracks.size()][];
		
		ArrayList<Track> trackList=new ArrayList<Track>(tracks.values());
		for(int i=0;i<trackList.size();i++){
			Track track=trackList.get(i);
			data[i]=new double[noOfVariables];
			data[i][0]=track.railClass;
			data[i][1]=track.signaled?1:0;
			if(track.yearlyStats.containsKey(13))
				data[i][2]=track.yearlyStats.get(13).totalTonnage;
			else 
				data[i][2]=0;
		}
		PearsonsCorrelation pc=new PearsonsCorrelation(data);
		System.out.println("***** Correlatio Matrix ***********\n"+pc.getCorrelationMatrix());
	}
	
	

}
