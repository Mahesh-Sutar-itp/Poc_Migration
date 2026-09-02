package fr.formcraft.repo.notification.impl;

import fr.formcraft.common.exception.EntityNotFoundException;
import fr.formcraft.model.entity.Notification;
import fr.formcraft.model.entity.User;
import fr.formcraft.model.enums.NotificationCategory;
import fr.formcraft.model.enums.UserRole;
import fr.formcraft.repo.jpa.NotificationRepository;
import fr.formcraft.repo.jpa.UserRepository;
import fr.formcraft.repo.notification.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service("notificationService")
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Autowired
    public NotificationServiceImpl(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public Notification notifyUser(String username, String title, String message, String link,
                                    NotificationCategory category) {
        Notification notification = new Notification();
        notification.setRecipientUsername(username);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setLink(link);
        notification.setCategory(category);
        return notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void notifyRole(UserRole role, String title, String message, String link, NotificationCategory category) {
        List<User> users = userRepository.findByRole(role);
        for (User user : users) {
            notifyUser(user.getUsername(), title, message, link, category);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notification> getForUser(String username) {
        return notificationRepository.findByRecipientUsernameOrderByCreatedAtDesc(username);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Notification> getUnreadForUser(String username) {
        return notificationRepository.findByRecipientUsernameAndReadFalseOrderByCreatedAtDesc(username);
    }

    @Override
    @Transactional(readOnly = true)
    public long countUnread(String username) {
        return notificationRepository.countByRecipientUsernameAndReadFalse(username);
    }

    @Override
    @Transactional
    public Notification markRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Notification", id));
        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllRead(String username) {
        List<Notification> unread = notificationRepository.findByRecipientUsernameAndReadFalseOrderByCreatedAtDesc(username);
        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }
}
