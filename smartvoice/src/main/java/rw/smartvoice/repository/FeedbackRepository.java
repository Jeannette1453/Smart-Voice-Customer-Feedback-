package rw.smartvoice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rw.smartvoice.model.Feedback;
import rw.smartvoice.model.FeedbackStatus;
import rw.smartvoice.model.FeedbackType;
import rw.smartvoice.model.Priority;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {

    @Query("""
        select f from Feedback f
        left join fetch f.customer
        left join fetch f.assignedDepartment
        left join fetch f.assignedStaff
        where f.assignedStaff.id = :staffId
        order by f.createdAt desc
    """)
    List<Feedback> findAssignedToStaff(@Param("staffId") UUID staffId);

    @Query("""
        select f from Feedback f
        left join fetch f.customer
        left join fetch f.assignedDepartment
        left join fetch f.assignedStaff
        where f.customer.id = :customerId
        order by f.createdAt desc
    """)
    List<Feedback> findMine(@Param("customerId") UUID customerId);

    @Query("""
        select f from Feedback f
        left join fetch f.customer
        left join fetch f.assignedDepartment
        left join fetch f.assignedStaff
        order by f.createdAt desc
    """)
    List<Feedback> findAllWithJoins();

    @Query("""
        select f from Feedback f
        left join fetch f.customer
        left join fetch f.assignedDepartment
        left join fetch f.assignedStaff
        where f.id = :id
    """)
    Optional<Feedback> findByIdWithJoins(@Param("id") UUID id);

    @Query("""
        select cast(f.createdAt as date), count(f)
        from Feedback f
        where f.createdAt >= :from
        group by cast(f.createdAt as date)
        order by cast(f.createdAt as date)
    """)
    List<Object[]> trendRaw(@Param("from") Instant from);

    @Query("""
        select cast(f.createdAt as date), count(f)
        from Feedback f
        where f.createdAt >= :from and f.createdAt <= :to
        group by cast(f.createdAt as date)
        order by cast(f.createdAt as date)
    """)
    List<Object[]> trendRawBetween(@Param("from") Instant from, @Param("to") Instant to);

    long countByStatus(FeedbackStatus status);
    long countByEscalatedTrue();
    long countByType(FeedbackType type);
    long countByPriority(Priority priority);

    // ── Filtered counts for date range ──────────────────────────────────────
    long countByCreatedAtBetween(Instant from, Instant to);
    long countByEscalatedTrueAndCreatedAtBetween(Instant from, Instant to);
    long countByStatusAndCreatedAtBetween(FeedbackStatus status, Instant from, Instant to);
    long countByTypeAndCreatedAtBetween(FeedbackType type, Instant from, Instant to);
    long countByPriorityAndCreatedAtBetween(Priority priority, Instant from, Instant to);

    @Query("""
        select coalesce(f.aiSentiment, 'UNKNOWN'), count(f)
        from Feedback f
        where f.createdAt between :from and :to
        group by coalesce(f.aiSentiment, 'UNKNOWN')
        order by coalesce(f.aiSentiment, 'UNKNOWN')
    """)
    List<Object[]> countBySentimentRawBetween(@Param("from") Instant from, @Param("to") Instant to);

    @Query("""
        select coalesce(d.name, 'Unassigned'), count(f)
        from Feedback f
        left join f.assignedDepartment d
        where f.createdAt between :from and :to
        group by coalesce(d.name, 'Unassigned')
        order by count(f) desc
    """)
    List<Object[]> countByDepartmentRawBetween(@Param("from") Instant from, @Param("to") Instant to);

    @Query("""
        select coalesce(f.category, 'Unknown'), count(f)
        from Feedback f
        where f.createdAt between :from and :to
        group by coalesce(f.category, 'Unknown')
        order by count(f) desc
    """)
    List<Object[]> topCategoriesRawBetween(@Param("from") Instant from, @Param("to") Instant to);

    @Query("""
        select coalesce(f.aiSentiment, 'UNKNOWN'), count(f)
        from Feedback f
        group by coalesce(f.aiSentiment, 'UNKNOWN')
        order by coalesce(f.aiSentiment, 'UNKNOWN')
    """)
    List<Object[]> countBySentimentRaw();

    @Query("""
        select coalesce(d.name, 'Unassigned'), count(f)
        from Feedback f
        left join f.assignedDepartment d
        group by coalesce(d.name, 'Unassigned')
        order by count(f) desc
    """)
    List<Object[]> countByDepartmentRaw();

    @Query("""
        select coalesce(f.category, 'Unknown'), count(f)
        from Feedback f
        group by coalesce(f.category, 'Unknown')
        order by count(f) desc
    """)
    List<Object[]> topCategoriesRaw();

    // ✅ overdue
    long countByStatusInAndCreatedAtBefore(List<FeedbackStatus> statuses, Instant before);

    @Query("""
        select f from Feedback f
        left join fetch f.customer
        left join fetch f.assignedDepartment
        left join fetch f.assignedStaff
        where f.status in :statuses and f.createdAt < :before
        order by f.createdAt asc
    """)
    List<Feedback> findByStatusInAndCreatedAtBeforeWithJoins(
        @Param("statuses") List<FeedbackStatus> statuses,
        @Param("before") Instant before
    );

    // ✅ average handling
    List<Feedback> findByStatusIn(List<FeedbackStatus> statuses);

    List<Feedback> findByCustomer_Id(UUID customerId);

    List<Feedback> findByAssignedStaff_Id(UUID staffId);

    // Staff workload: count open cases per staff member
    @Query("""
        select f.assignedStaff.id, count(f)
        from Feedback f
        where f.assignedStaff is not null
        and f.status in ('NEW','ASSIGNED','IN_PROGRESS')
        group by f.assignedStaff.id
    """)
    List<Object[]> countOpenCasesByStaff();

    // ── User-filtered counts ─────────────────────────────────────────────────
    long countByCustomer_Id(UUID customerId);
    long countByAssignedStaff_Id(UUID staffId);
    long countByEscalatedTrueAndCustomer_Id(UUID customerId);
    long countByStatusAndCustomer_Id(FeedbackStatus status, UUID customerId);
    long countByTypeAndCustomer_Id(FeedbackType type, UUID customerId);
    long countByPriorityAndCustomer_Id(Priority priority, UUID customerId);

    @Query("""
        select coalesce(f.aiSentiment, 'UNKNOWN'), count(f)
        from Feedback f where f.customer.id = :uid
        group by coalesce(f.aiSentiment, 'UNKNOWN')
    """)
    List<Object[]> countBySentimentByCustomer(@Param("uid") UUID uid);

    @Query("""
        select coalesce(d.name, 'Unassigned'), count(f)
        from Feedback f left join f.assignedDepartment d
        where f.customer.id = :uid
        group by coalesce(d.name, 'Unassigned') order by count(f) desc
    """)
    List<Object[]> countByDepartmentByCustomer(@Param("uid") UUID uid);

    @Query("""
        select coalesce(f.category, 'Unknown'), count(f)
        from Feedback f where f.customer.id = :uid
        group by coalesce(f.category, 'Unknown') order by count(f) desc
    """)
    List<Object[]> topCategoriesByCustomer(@Param("uid") UUID uid);

    @Modifying
    @Query("update Feedback f set f.assignedStaff = null where f.assignedStaff.id = :staffId")
    void unassignStaff(@Param("staffId") UUID staffId);

    // Detailed list for PDF report
    @Query("""
        select f from Feedback f
        left join fetch f.customer
        left join fetch f.assignedDepartment
        left join fetch f.assignedStaff
        order by f.createdAt desc
    """)
    List<Feedback> findAllForReport();

    @Query("""
        select f from Feedback f
        left join fetch f.customer
        left join fetch f.assignedDepartment
        left join fetch f.assignedStaff
        where f.createdAt >= :from and f.createdAt <= :to
        order by f.createdAt desc
    """)
    List<Feedback> findForReportByDate(@Param("from") Instant from, @Param("to") Instant to);

    @Query("""
        select f from Feedback f
        left join fetch f.customer
        left join fetch f.assignedDepartment
        left join fetch f.assignedStaff
        where f.customer.id = :customerId
        order by f.createdAt desc
    """)
    List<Feedback> findForReportByCustomer(@Param("customerId") UUID customerId);

    @Query("""
        select f from Feedback f
        left join fetch f.customer
        left join fetch f.assignedDepartment
        left join fetch f.assignedStaff
        where f.customer.id = :customerId
        and f.createdAt >= :from and f.createdAt <= :to
        order by f.createdAt desc
    """)
    List<Feedback> findForReportByCustomerAndDate(
        @Param("customerId") UUID customerId,
        @Param("from") Instant from,
        @Param("to") Instant to
    );

    @Query("""
        select f from Feedback f
        left join fetch f.customer
        left join fetch f.assignedDepartment
        left join fetch f.assignedStaff
        where (:type is null or f.type = :type)
        and (:sentiment is null or f.aiSentiment = :sentiment)
        and (:department is null or f.assignedDepartment.name = :department)
        and (:from is null or f.createdAt >= :from)
        and (:to is null or f.createdAt <= :to)
        and (:customerId is null or f.customer.id = :customerId)
        order by f.createdAt desc
    """)
    List<Feedback> findForReportFiltered(
        @Param("type") FeedbackType type,
        @Param("sentiment") String sentiment,
        @Param("department") String department,
        @Param("from") Instant from,
        @Param("to") Instant to,
        @Param("customerId") UUID customerId
    );}