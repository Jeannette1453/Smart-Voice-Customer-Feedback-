package rw.smartvoice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
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

    long countByStatus(FeedbackStatus status);
    long countByEscalatedTrue();
    long countByType(FeedbackType type);
    long countByPriority(Priority priority);
    long countByAiSentiment(String aiSentiment);
}
