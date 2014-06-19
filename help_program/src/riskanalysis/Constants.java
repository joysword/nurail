package riskanalysis;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;

public class Constants {

	public static final String RAW_DATA_DIR="E:/program_data/ArcGIS/NURail/Clean Layers/Illinois_only/derailment_risk/byYear/";
	
	
	public static final int TRAFFIC_DENSITY_THRESHOLD=2000;
	
	public static final int NO_OF_RAIL_CLASS=5;
	
	
	//data range
	public static final int LATEST_YEAR=2013;
	public static final int OLDEST_YEAR=1995;
	
	
	public static final int NO_OF_FIELDS=146;
	//indices of needed fields
	public static final int ACCIDENT_TYPE_FIELD_INDEX=21;
	public static final int STATE_FIELD_INDEX=29;
	
	public static final int TRAFFIC_DENSITY_FIELD_INDEX=42;
	
	public static final int TRACK_NAME_FIELD_INDEX=40;
	
	public static final int RAIL_CLASS_FIELD_INDEX=41;
	
	public static final int LATITUDE_FIELD_INDEX=138;
	public static final int LONGITUDE_FIELD_INDEX=139;
	
	public static final int SIGNALED_FIELD_INDEX=140;
	
	
	//reference :[1].	Xiang Liu, M. Rapik Saat, Christopher P. L. Barkan. ¡°Analysis of Freight-Train Derailment Rates in the United States¡±. (Draft on July 23, 2013) 
	public static final HashMap<Integer, List<Double>> risks=new HashMap<Integer, List<Double>>();
	static {
		risks.put(100, Arrays.asList(new Double[]{1.29, 1.086, 1.534}));
		risks.put(110, Arrays.asList(new Double[]{.92, .0737, 1.151}));
		risks.put(101, Arrays.asList(new Double[]{.61, .495, .747}));
		risks.put(111, Arrays.asList(new Double[]{.43, .361, .521}));
		risks.put(200, Arrays.asList(new Double[]{.66, .574, .768}));
		risks.put(210, Arrays.asList(new Double[]{.47, .395, .568}));
		risks.put(201, Arrays.asList(new Double[]{.31, .260, .376}));
		risks.put(211, Arrays.asList(new Double[]{.22, .195, .255}));
		risks.put(300, Arrays.asList(new Double[]{.34, .295, .395}));
		risks.put(310, Arrays.asList(new Double[]{.24, .208, .286}));
		risks.put(301, Arrays.asList(new Double[]{.16, .134, .194}));
		risks.put(311, Arrays.asList(new Double[]{.11, .104, .127}));
		risks.put(400, Arrays.asList(new Double[]{.18, .148, .209}));
		risks.put(410, Arrays.asList(new Double[]{.13, .106, .147}));
		risks.put(401, Arrays.asList(new Double[]{.08, .0067, .102}));
		risks.put(411, Arrays.asList(new Double[]{.06, .0053, .066}));
		risks.put(500, Arrays.asList(new Double[]{0.0, .0, .0}));
		risks.put(510, Arrays.asList(new Double[]{.06, .053, .078}));
		risks.put(501, Arrays.asList(new Double[]{.04, .033, .055}));
		risks.put(511, Arrays.asList(new Double[]{.03, .026, .035}));
	}
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	

}
