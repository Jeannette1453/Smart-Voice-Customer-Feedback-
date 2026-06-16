package rw.smartvoice.dto;

import rw.smartvoice.model.FeedbackStatus;
import rw.smartvoice.model.FeedbackType;
import rw.smartvoice.model.Priority;

import java.util.Map;

public class ReportSummaryResponse {
    public long total;
    public long escalated;

    public Map<FeedbackStatus, Long> byStatus;
    public Map<FeedbackType, Long> byType;
    public Map<Priority, Long> byPriority;

    public ReportSummaryResponse(long total, long escalated,
                                 Map<FeedbackStatus, Long> byStatus,
                                 Map<FeedbackType, Long> byType,
                                 Map<Priority, Long> byPriority) {
        this.total = total;
        this.escalated = escalated;
        this.byStatus = byStatus;
        this.byType = byType;
        this.byPriority = byPriority;
    }
}
