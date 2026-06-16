package rw.smartvoice.dto;

import java.time.LocalDate;

public class TrendPoint {
    public LocalDate date;
    public long count;

    public TrendPoint() {
    }

    public TrendPoint(LocalDate date, long count) {
        this.date = date;
        this.count = count;
    }
}
