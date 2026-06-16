package rw.smartvoice.dto;

import java.util.LinkedHashMap;
import java.util.Map;

public class AnalyticsResponse {
    public long total;
    public long escalated;
    public String health = "OK";

    public Map<String, Long> byStatus = new LinkedHashMap<>();
    public Map<String, Long> byType = new LinkedHashMap<>();
    public Map<String, Long> byPriority = new LinkedHashMap<>();
    public Map<String, Long> bySentiment = new LinkedHashMap<>();

    public Map<String, Long> byDepartment = new LinkedHashMap<>();
    public Map<String, Long> topCategories = new LinkedHashMap<>();

    public double averageRating = 0.0;

    // ✅ add these
    public long overdueCases = 0;
    public double averageHandlingHours = 0.0;
    public long openCases = 0;
    public long resolvedCases = 0;
    public long urgentCases = 0;
    public double resolutionRate = 0.0;
}