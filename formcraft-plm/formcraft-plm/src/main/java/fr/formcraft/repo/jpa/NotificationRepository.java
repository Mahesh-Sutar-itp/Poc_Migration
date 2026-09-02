package fr.formcraft.repo.jpa;

import fr.formcraft.model.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientUsernameOrderByCreatedAtDesc(String username);

    List<Notification> findByRecipientUsernameAndReadFalseOrderByCreatedAtDesc(String username);

    long countByRecipientUsernameAndReadFalse(String username);
}
