package rw.smartvoice.service;

import org.springframework.stereotype.Service;
import rw.smartvoice.model.Department;
import rw.smartvoice.repository.DepartmentRepository;

import java.util.List;
import java.util.UUID;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;

    public DepartmentService(DepartmentRepository departmentRepository) {
        this.departmentRepository = departmentRepository;
    }

    public Department create(String name) {
        departmentRepository.findByNameIgnoreCase(name).ifPresent(d -> {
            throw new IllegalArgumentException("Department already exists");
        });
        Department d = new Department();
        d.setName(name.trim());
        return departmentRepository.save(d);
    }

    public List<Department> getAll() {
        return departmentRepository.findAll();
    }

    public Department getById(UUID id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found"));
    }

    public Department update(UUID id, String name) {
        Department d = getById(id);
        d.setName(name.trim());
        return departmentRepository.save(d);
    }

    public void delete(UUID id) {
        Department d = getById(id);
        departmentRepository.delete(d);
    }
}
