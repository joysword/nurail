package riskanalysis;

public class AnnualStat {

	int year;
	
	double totalTonnage;
	int derailmentCnt;
	boolean trafficDensityAboveThr;
	
	
	double risk;
	
	public AnnualStat(int year){
		this.year=year;			
		totalTonnage=0;
		derailmentCnt=0;
	}
	
	public String toString(){
		return String.valueOf(derailmentCnt);
	}

}
