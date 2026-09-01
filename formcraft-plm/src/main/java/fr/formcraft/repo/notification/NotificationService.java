package fr.formcraft.repo.notification;

import fr.formcraft.model.entity.Notification;
import fr.formcraft.model.enums.NotificationCategory;
import fr.formcraft.model.enums.UserRole;

import java.util.List;

public interface NotificationService {

    Notification notifyUser(String username, String title, String message, String link, NotificationCategory category);

    void notifyRole(UserRole role, String title, String message, String link, NotificationCategory category);

    List<Notification> getForUser(String username);

    List<Notification> getUnreadForUser(String username);

    long countUnread(String username);

    Notification markRead(Long id);

    void markAllRead(String username);
}
