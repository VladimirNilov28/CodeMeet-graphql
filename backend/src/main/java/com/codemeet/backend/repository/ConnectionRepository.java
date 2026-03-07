package com.codemeet.backend.repository;

import com.codemeet.backend.model.Connection;
import com.codemeet.backend.model.ConnectionStatus;
import com.codemeet.backend.model.User;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConnectionRepository extends JpaRepository<Connection, UUID> {

    Optional<Connection> findByRequesterAndRecipient(User requester, User recipient);

    Optional<Connection> findByRequesterAndRecipientAndStatus(User requester, User recipient, ConnectionStatus status);

    @Query("SELECT c FROM Connection c WHERE (c.requester = :user OR c.recipient = :user) AND c.status = :status")
    List<Connection> findByUserAndStatus(@Param("user") User user, @Param("status") ConnectionStatus status);

    @Query("SELECT c FROM Connection c WHERE c.requester = :user OR c.recipient = :user")
    List<Connection> findAllForUser(@Param("user") User user);

        @Query("""
                        SELECT CASE
                                         WHEN c.requester.id = :userId THEN c.recipient.id
                                         ELSE c.requester.id
                                     END
                        FROM Connection c
                        WHERE (c.requester.id = :userId OR c.recipient.id = :userId)
                            AND c.status <> 'SKIPPED'
                        """)
        List<UUID> findRelatedUserIdsExcludingSkipped(@Param("userId") UUID userId);

        @Query("""
                        SELECT c.recipient.id
                        FROM Connection c
                        WHERE c.requester.id = :userId
                            AND c.status = 'SKIPPED'
                            AND c.createdAt >= :cutoff
                        """)
        List<UUID> findActiveSkippedRecipientIds(@Param("userId") UUID userId, @Param("cutoff") java.time.LocalDateTime cutoff);

    @Query("SELECT c FROM Connection c WHERE c.recipient = :user AND c.status = 'PENDING'")
    List<Connection> findPendingRequestsForUser(@Param("user") User user);

    @Query("SELECT c FROM Connection c WHERE c.requester = :user AND c.status = 'SKIPPED'")
    List<Connection> findSkippedRequestsForUser(@Param("user") User user);

    // Removes any existing relationship row between two users before a stronger state, such as BLOCKED, is saved.
    @Modifying
    @Transactional
    @Query("DELETE FROM Connection c WHERE ((c.requester = :user1 AND c.recipient = :user2) OR (c.requester = :user2 AND c.recipient = :user1))")
    void deleteConnectionsBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);
    
    // Returns the users actively blocked by the caller so the frontend can build the block list in Settings.
    @Query("SELECT c FROM Connection c WHERE c.requester = :user AND c.status = 'BLOCKED'")
    List<Connection> findBlockedUsersForUser(@Param("user") User user);

    // Returns only recent skips so dismissed users stay hidden for the configured cooldown window.
    @Query("SELECT c FROM Connection c WHERE c.requester = :user AND c.status = 'SKIPPED' AND c.createdAt >= :cutoff")
    List<Connection> findActiveSkipsForUser(@Param("user") User user, @Param("cutoff") java.time.LocalDateTime cutoff);

    // Checks blocking in both directions because either side should prevent recommendations, profiles, and chat.
    @Query("SELECT c FROM Connection c WHERE ((c.requester = :blocker AND c.recipient = :blocked) OR (c.requester = :blocked AND c.recipient = :blocker)) AND c.status = 'BLOCKED'")
    Optional<Connection> findBlockedConnectionEitherDirection(@Param("blocker") User blocker, @Param("blocked") User blocked);

    // Looks up an accepted or pending relationship regardless of which user initiated it.
    @Query("SELECT c FROM Connection c WHERE ((c.requester = :user1 AND c.recipient = :user2) OR (c.requester = :user2 AND c.recipient = :user1)) AND c.status = :status")
    Optional<Connection> findConnectionBetweenUsers(@Param("user1") User user1, @Param("user2") User user2, @Param("status") ConnectionStatus status);

    // Returns any relationship state between two users so controllers can avoid duplicate requests and conflicting actions.
    @Query("SELECT c FROM Connection c WHERE ((c.requester = :user1 AND c.recipient = :user2) OR (c.requester = :user2 AND c.recipient = :user1))")
    Optional<Connection> findAllConnectionsBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);

}
