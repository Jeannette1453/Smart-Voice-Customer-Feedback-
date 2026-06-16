package rw.smartvoice.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import rw.smartvoice.dto.DepartmentRequest;
import rw.smartvoice.model.Department;
import rw.smartvoice.service.DepartmentService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {

    private final DepartmentService departmentService;

    public DepartmentController(DepartmentService departmentService) {
        this.departmentService = departmentService;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<Department> create(@Valid @RequestBody DepartmentRequest req) {
        return ResponseEntity.status(201).body(departmentService.create(req.name));
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @GetMapping
    public ResponseEntity<List<Department>> getAll() {
        return ResponseEntity.ok(departmentService.getAll());
    }

    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    @GetMapping("/{id}")
    public ResponseEntity<Department> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(departmentService.getById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<Department> update(@PathVariable UUID id, @Valid @RequestBody DepartmentRequest req) {
        return ResponseEntity.ok(departmentService.update(id, req.name));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        departmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
