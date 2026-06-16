package rw.smartvoice.dto;

import java.util.List;
import java.util.Map;

public class DashboardReportResponse {
    public long unreadNotifications;

    public long totalFeedback;
    public long escalated;
    public long urgent;
    public long openCases;
    public long resolvedCases;
    public long overdueCases;

    public double resolutionRate;
    public double averageHandlingHours;

    public Map<String, Long> byStatus;
    public List<TrendPoint> trend;
}