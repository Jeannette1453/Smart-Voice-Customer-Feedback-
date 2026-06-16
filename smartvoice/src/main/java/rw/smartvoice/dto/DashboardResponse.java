package rw.smartvoice.dto;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class DashboardResponse {

    public long unreadNotifications;
    public long totalFeedback;
    public long urgent;
    public long escalated;

    public long openCases;
    public long resolvedCases;
    public long overdueCases;

    public long resolutionRate;
    public double averageHandlingHours;

    public Map<String, Long> byStatus = new LinkedHashMap<>();
    public List<TrendPoint> trend = new ArrayList<>();
}