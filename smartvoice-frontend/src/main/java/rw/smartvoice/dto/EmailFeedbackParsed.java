package rw.smartvoice.dto;

import rw.smartvoice.model.FeedbackType;
import rw.smartvoice.model.Priority;

public class EmailFeedbackParsed {
    public FeedbackType type;
    public Priority priority;
    public String category;
    public String subCategory;
    public String message;
    public String subject;
}