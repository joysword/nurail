package riskanalysis;

import java.util.HashMap;
import java.util.List;


public class Track {
	
	public static String getID(String railClass, boolean signaled, boolean trafficDensityAboveThr){
		return (railClass)+(signaled==true?"1":"0")+(trafficDensityAboveThr==true?"1":"0");
	}
	
	public Track(String name, String railClass, boolean signaled, String lati, String longi){
		this.name=name;
		this.railClass=Integer.parseInt(railClass);
		this.signaled=signaled;
		coord=new double[2];
		if(lati.length()>0)	coord[0]=Double.parseDouble(lati);
		if(lati.length()>0) coord[1]=Double.parseDouble(longi);
		
		yearlyStats=new HashMap<Integer,AnnualStat>();
	}

	/*
	 * fixed fields, not change annually 
	 */
	public String name;
	public int railClass;
	public boolean signaled;
	public double[] coord;
	
	
	public HashMap<Integer,AnnualStat> yearlyStats;
	
	
	
	public String toString(){
		//name,lat,long,class,signal,cnt1,cnt2,cnt3,cnt4,cnt5,sum
		int sum=0;
		String ret=name+","+coord[0]+","+coord[1]+","+railClass+","+signaled+",";
		
		int startYear=9, endYear=13;
		
		//print out the accident sum
		for(int i=startYear;i<=endYear;i++){
			if(yearlyStats.containsKey((Integer)i)){
				sum+=yearlyStats.get((Integer)i).derailmentCnt;
				ret+=yearlyStats.get((Integer)i)+",";
			}
			else ret+="0,";//no accident in year i
		}
		ret+=String.valueOf(sum);
		
		//calculate the risk
		List<Double> riskAndConfidenceInterval;
		int cateogry=railClass*100+(signaled?1:0)*10;
		double tonnageSum=0;
		for(int i=startYear;i<=endYear;i++){
			if(yearlyStats.containsKey((Integer)i) ){
				tonnageSum+=yearlyStats.get((Integer)i).totalTonnage;
			}
		}
		if(tonnageSum>= Constants.TRAFFIC_DENSITY_THRESHOLD*(endYear-startYear+1)){
			cateogry+=1;
		}
		
		riskAndConfidenceInterval=Constants.risks.get(cateogry);
		ret+=","+riskAndConfidenceInterval.get(0);
		
		ret+=",["+riskAndConfidenceInterval.get(1)+"~"+riskAndConfidenceInterval.get(2)+"]";
		
		return ret;		
	}

}
