package com.cts.regreportx.repository;

import com.cts.regreportx.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Integer> {

    List<Notification> findByUser_IdOrderByCreatedDateDesc(Long userId);

    List<Notification> findByUser_IdAndStatusOrderByCreatedDateDesc(Long userId, String status);

    long countByUser_IdAndStatus(Long userId, String status);

    @Modifying
    @Query("UPDATE Notification n SET n.status = 'READ' WHERE n.user.id = :userId AND n.status = 'UNREAD'")
    int markAllReadByUserId(Long userId);
}
