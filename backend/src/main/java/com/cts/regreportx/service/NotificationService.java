package com.cts.regreportx.service;

import com.cts.regreportx.model.Notification;
import com.cts.regreportx.model.User;
import com.cts.regreportx.repository.NotificationRepository;
import com.cts.regreportx.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Autowired
    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    public void notifyRole(String role, String message, String category) {
        List<User> users = userRepository.findByRole(role);
        for (User user : users) {
            if (!"ACTIVE".equalsIgnoreCase(user.getStatus())) continue;
            createNotification(user, message, category);
        }
    }

    public void notifyUser(Long userId, String message, String category) {
        try {
            User user = userRepository.getReferenceById(userId);
            createNotification(user, message, category);
        } catch (Exception e) {
            // Notification should never block business logic
        }
    }

    private void createNotification(User user, String message, String category) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setMessage(message);
        notification.setCategory(category);
        notification.setStatus("UNREAD");
        notification.setCreatedDate(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    public List<Notification> getMyNotifications() {
        Long userId = getCurrentUserId();
        if (userId == null) return List.of();
        return notificationRepository.findByUser_IdOrderByCreatedDateDesc(userId);
    }

    public long getUnreadCount() {
        Long userId = getCurrentUserId();
        if (userId == null) return 0;
        return notificationRepository.countByUser_IdAndStatus(userId, "UNREAD");
    }

    @Transactional
    public void markAsRead(Integer notificationId) {
        Optional<Notification> opt = notificationRepository.findById(notificationId);
        if (opt.isPresent()) {
            Long userId = getCurrentUserId();
            Notification n = opt.get();
            if (n.getUser() != null && n.getUser().getId().equals(userId)) {
                n.setStatus("READ");
                notificationRepository.save(n);
            }
        }
    }

    @Transactional
    public void markAllAsRead() {
        Long userId = getCurrentUserId();
        if (userId != null) {
            notificationRepository.markAllReadByUserId(userId);
        }
    }

    private Long getCurrentUserId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
                String username = auth.getName();
                Optional<User> userOpt = userRepository.findByUsername(username);
                if (userOpt.isPresent()) {
                    return userOpt.get().getId();
                }
                Optional<User> emailOpt = userRepository.findByEmail(username);
                if (emailOpt.isPresent()) {
                    return emailOpt.get().getId();
                }
            }
        } catch (Exception e) {
            // Silently continue
        }
        return null;
    }
}
