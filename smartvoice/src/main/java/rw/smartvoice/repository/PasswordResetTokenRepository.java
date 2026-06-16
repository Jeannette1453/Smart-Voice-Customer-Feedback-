package rw.smartvoice.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import rw.smartvoice.model.PasswordResetToken;

import java.util.Optional;
import java.util.UUID;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    @Query("select t from PasswordResetToken t join fetch t.user where t.token = :token")
    Optional<PasswordResetToken> findByToken(@Param("token") String token);

    void deleteByUser_Id(UUID userId);
}