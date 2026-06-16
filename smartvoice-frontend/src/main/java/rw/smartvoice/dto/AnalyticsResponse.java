package rw.smartvoice.dto;

import java.util.Map;

public class AnalyticsResponse {
    public long total;
    public long escalated;
    public String health;

    public Map<String, Long> byStatus;
    public Map<String, Long> byType;
    public Map<String, Long> byPriority;
    public Map<String, Long> bySentiment;
}
