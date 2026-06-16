package rw.smartvoice.dto;

import java.util.ArrayList;
import java.util.List;

public class PerformanceResponse {

    public long totalCases;
    public long openCases;
    public long resolvedCases;
    public long escalatedCases;
    public long overdueCases;

    public double resolutionRate;
    public double averageHandlingHours;

    public List<DepartmentPerformanceRow> departments = new ArrayList<>();
    public List<StaffPerformanceRow> staff = new ArrayList<>();

    public List<DepartmentPerformanceRow> topDepartments = new ArrayList<>();
    public List<StaffPerformanceRow> topStaff = new ArrayList<>();

    public List<String> recommendations = new ArrayList<>();

    public static class DepartmentPerformanceRow {
        public String departmentName;
        public long totalCases;
        public long resolvedCases;
        public long escalatedCases;
        public double resolutionRate;
        public String benchmark;
    }

    public static class StaffPerformanceRow {
        public String staffName;
        public String staffEmail;
        public long assignedCases;
        public long resolvedCases;
        public long inProgressCases;
        public double resolutionRate;
        public String benchmark;
    }
}