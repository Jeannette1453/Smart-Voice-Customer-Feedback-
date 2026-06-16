package rw.smartvoice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rw.smartvoice.model.LoginOtp;

import java.util.Optional;
import java.util.UUID;

public interface LoginOtpRepository extends JpaRepository<LoginOtp, UUID> {

    @Query("select o from LoginOtp o join fetch o.user where o.user.email = :email order by o.expiresAt desc limit 1")
    Optional<LoginOtp> findTopByUser_EmailOrderByExpiresAtDesc(@Param("email") String email);

    void deleteByUser_Id(UUID userId);
}
