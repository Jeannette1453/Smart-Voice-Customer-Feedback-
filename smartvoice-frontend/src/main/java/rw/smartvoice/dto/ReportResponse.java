package rw.smartvoice.dto;

import java.util.List;
import java.util.Map;

public class ReportResponse {
    public long totalFeedback;
    public long escalatedCount;
    public String health;

    public Map<String, Long> byStatus;
    public Map<String, Long> byType;
    public Map<String, Long> byPriority;
    public Map<String, Long> bySentiment;

    public List<TrendPoint> trend;

    public static class TrendPoint {
        public String date;
        public long count;

        public TrendPoint(String date, long count) {
            this.date = date;
            this.count = count;
        }
    }
}
