package rw.smartvoice.model;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "feedback_categories", uniqueConstraints = {
        @UniqueConstraint(name = "uk_feedback_category_name", columnNames = "name")
})
public class FeedbackCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}