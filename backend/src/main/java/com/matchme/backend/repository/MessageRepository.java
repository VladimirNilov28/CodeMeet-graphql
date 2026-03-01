package com.matchme.backend.repository;

import com.matchme.backend.model.Message;
import com.matchme.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    // Get all messages between two users representing a single "Chat History"
    @Query("SELECT m FROM Message m WHERE (m.sender = :user1 AND m.recipient = :user2) OR (m.sender = :user2 AND m.recipient = :user1) ORDER BY m.timestamp DESC")
    Page<Message> findChatHistory(@Param("user1") User user1, @Param("user2") User user2, Pageable pageable);

    // Get unread message count from a specific user
    @Query("SELECT COUNT(m) FROM Message m WHERE m.sender = :sender AND m.recipient = :recipient AND m.isRead = false")
    long countUnreadMessages(@Param("sender") User sender, @Param("recipient") User recipient);

    // Get all recent chats for a user (Subquery to get latest message per distinct chat partner)
    // Here we're fetching distinct users the current user interacts with. 
    // Usually easier to query it by logic in a service or simple native query.
    @Query(value = "SELECT DISTINCT CASE WHEN sender_id = :userId THEN recipient_id ELSE sender_id END AS chat_partner_id FROM messages m WHERE m.sender_id = :userId OR m.recipient_id = :userId", nativeQuery = true)
    List<UUID> findActiveChatPartners(@Param("userId") UUID userId);

    List<Message> findBySenderAndRecipientAndIsReadFalse(User sender, User recipient);
}
