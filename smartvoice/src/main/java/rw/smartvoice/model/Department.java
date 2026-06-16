package rw.smartvoice.model;

import jakarta.persistence.*;

import java.util.UUID;

@Entity
@Table(name = "departments", uniqueConstraints = {
        @UniqueConstraint(name = "uk_department_name", columnNames = "name")
})
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
