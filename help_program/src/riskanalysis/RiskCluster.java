package riskanalysis;

import java.util.ArrayList;
import java.util.HashMap;

public class RiskCluster {
	
	public String ID;
	
	//public int cnt;
	public HashMap<Integer,ArrayList<Track> > annualTracks;//String: year; tracks belong to the risk cluster
	
	public HashMap<Integer, Double> annualRisks;
	public double[] confidenceLevel;
	
	public RiskCluster(String ID){
		this.ID=ID;
		
		//this.cnt=0;
		annualRisks=new HashMap<Integer, Double>();
		annualTracks=new HashMap<Integer, ArrayList<Track >>();
	}
	
	
	public String toString(){
		int totCnt=0;
		for(ArrayList<Track> eachyear: annualTracks.values()){
			totCnt+=eachyear.size();
		}
		return "ID:"+ID+"	tracks size:"+totCnt; 
	}
	


}
