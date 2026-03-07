package com.codemeet.backend.service;

import com.codemeet.backend.model.Bio;
import com.codemeet.backend.model.Connection;
import com.codemeet.backend.model.ConnectionStatus;
import com.codemeet.backend.model.User;
import com.codemeet.backend.repository.BioRepository;
import com.codemeet.backend.repository.ConnectionRepository;
import com.codemeet.backend.repository.NearbyBioProjection;
import com.codemeet.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class RecommendationService {
    // Centralizes recommendation scoring plus skip/block rules so every controller applies the same visibility logic.

    private static final int SKIP_EXCLUSION_DAYS = 7;
    private static final double METERS_PER_KILOMETER = 1000.0;
    private static final int MAX_DISTANCE_SCORE = 25;
    private static final int MIN_RECOMMENDATION_SCORE = 10;

    private final BioRepository bioRepository;
    private final UserRepository userRepository;
    private final ConnectionRepository connectionRepository;

    public RecommendationService(BioRepository bioRepository, UserRepository userRepository, ConnectionRepository connectionRepository) {
        this.bioRepository = bioRepository;
        this.userRepository = userRepository;
        this.connectionRepository = connectionRepository;
    }

    public void skipUser(UUID currentUserId, UUID skippedUserId) {
        User currentUser = requireUser(currentUserId, "Current user not found");
        User skippedUser = requireUser(skippedUserId, "User to skip not found");

        if (currentUserId.equals(skippedUserId)) {
            throw new RuntimeException("Cannot skip yourself");
        }
        if (isBlockedEitherDirection(currentUser, skippedUser)) {
            throw new RuntimeException("Cannot skip a blocked user");
        }

        Connection existingSkip = connectionRepository
                .findByRequesterAndRecipientAndStatus(currentUser, skippedUser, ConnectionStatus.SKIPPED)
                .orElse(null);
        if (existingSkip != null) {
            existingSkip.setCreatedAt(LocalDateTime.now());
            connectionRepository.save(existingSkip);
            return;
        }

        Connection existingRelationship = connectionRepository.findAllConnectionsBetweenUsers(currentUser, skippedUser)
                .orElse(null);
        if (existingRelationship != null) {
            throw new RuntimeException("Cannot skip a user you already have a connection or request with");
        }

        // Persist skips as Connection rows so the same relationship table can drive moderation and discovery rules.
        Connection skippedConnection = new Connection();
        skippedConnection.setRequester(currentUser);
        skippedConnection.setRecipient(skippedUser);
        skippedConnection.setStatus(ConnectionStatus.SKIPPED);
        connectionRepository.save(skippedConnection);
    }

    public void undoSkip(UUID currentUserId, UUID skippedUserId) {
        User currentUser = requireUser(currentUserId, "Current user not found");
        User skippedUser = requireUser(skippedUserId, "User to unskip not found");

        // Removing the SKIPPED row makes the user eligible for recommendations again immediately.
        connectionRepository.findByRequesterAndRecipientAndStatus(currentUser, skippedUser, ConnectionStatus.SKIPPED)
                .ifPresent(connectionRepository::delete);
    }

    public void blockUser(UUID currentUserId, UUID blockedUserId) {
        User currentUser = requireUser(currentUserId, "Current user not found");
        User blockedUser = requireUser(blockedUserId, "User to block not found");

        if (currentUserId.equals(blockedUserId)) {
            throw new RuntimeException("Cannot block yourself");
        }

        Connection existingBlock = connectionRepository.findBlockedConnectionEitherDirection(currentUser, blockedUser)
                .orElse(null);
        if (existingBlock != null && existingBlock.getRequester().getId().equals(currentUserId)) {
            return;
        }
        if (existingBlock != null) {
            throw new RuntimeException("Cannot block a user who has already blocked you");
        }

        // Blocking overrides weaker relationship states, so existing requests, connections, and skips are cleared first.
        connectionRepository.deleteConnectionsBetweenUsers(currentUser, blockedUser);

        Connection blockedConnection = new Connection();
        blockedConnection.setRequester(currentUser);
        blockedConnection.setRecipient(blockedUser);
        blockedConnection.setStatus(ConnectionStatus.BLOCKED);
        connectionRepository.save(blockedConnection);
    }

    public void unblockUser(UUID currentUserId, UUID blockedUserId) {
        User currentUser = requireUser(currentUserId, "Current user not found");
        User blockedUser = requireUser(blockedUserId, "User to unblock not found");

        // Only the blocker's own row is removed here; a reciprocal block by the other user remains in force.
        connectionRepository.findByRequesterAndRecipientAndStatus(currentUser, blockedUser, ConnectionStatus.BLOCKED)
            .ifPresent(connectionRepository::delete);
        }

        public boolean isBlockedEitherDirection(User userA, User userB) {
        return connectionRepository.findBlockedConnectionEitherDirection(userA, userB).isPresent();
        }

        public List<UUID> getActiveSkippedUserIds(User currentUser) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(SKIP_EXCLUSION_DAYS);
        return connectionRepository.findActiveSkipsForUser(currentUser, cutoff).stream()
            .map(Connection::getRecipient)
            .map(User::getId)
            .toList();
    }

        public List<User> getBlockedUsers(User currentUser) {
            return connectionRepository.findBlockedUsersForUser(currentUser).stream()
                    .map(Connection::getRecipient)
                    .toList();
        }

    public List<UUID> getRecommendationsForUser(User currentUser, int limit) {
        Bio currentUserBio = bioRepository.findByUser(currentUser).orElse(null);

        // Recommendations depend on profile data from at least five bio fields, so incomplete users get no matches yet.
        if (currentUserBio == null || currentUserBio.getLatitude() == null || currentUserBio.getLongitude() == null || currentUserBio.getMaxDistanceKm() == null) {
            return new ArrayList<>();
        }

        LocalDateTime skipCutoff = LocalDateTime.now().minusDays(SKIP_EXCLUSION_DAYS);
        Set<UUID> excludedUserIds = new HashSet<>();
        excludedUserIds.add(currentUser.getId());
        excludedUserIds.addAll(connectionRepository.findRelatedUserIdsExcludingSkipped(currentUser.getId()));
        excludedUserIds.addAll(connectionRepository.findActiveSkippedRecipientIds(currentUser.getId(), skipCutoff));
    
        List<NearbyBioProjection> nearbyCandidates = bioRepository.findNearbyCandidateDistances(
            currentUser.getId(),
            currentUserBio.getLatitude(),
            currentUserBio.getLongitude(),
            currentUserBio.getMaxDistanceKm() * METERS_PER_KILOMETER
        );

        if (nearbyCandidates.isEmpty()) {
            return new ArrayList<>();
        }

        Map<UUID, Double> distanceKmByUserId = nearbyCandidates.stream()
            .collect(Collectors.toMap(NearbyBioProjection::getUserId, projection -> projection.getDistanceMeters() / METERS_PER_KILOMETER));

        List<Bio> eligibleBios = bioRepository.findByUserIdIn(distanceKmByUserId.keySet()).stream()
            .filter(bio -> !excludedUserIds.contains(bio.getUser().getId()))
            .filter(bio -> bio.getLatitude() != null && bio.getLongitude() != null && bio.getMaxDistanceKm() != null)
            .collect(Collectors.toList());

        // Score every remaining candidate and keep the strongest matches first, as required by the task specification.
        List<Map.Entry<Bio, Integer>> scoredBios = eligibleBios.stream()
            .map(bio -> Map.entry(bio, calculateScore(currentUserBio, bio, distanceKmByUserId.getOrDefault(bio.getUser().getId(), Double.MAX_VALUE))))
            .filter(entry -> entry.getValue() >= MIN_RECOMMENDATION_SCORE)
            .sorted(Comparator.<Map.Entry<Bio, Integer>>comparingInt(Map.Entry::getValue).reversed()) // Highest-scoring matches should appear before weaker ones.
                .collect(Collectors.toList());

        // The REST contract exposes recommendation ids only, capped by the caller-provided limit.
        return scoredBios.stream()
                .limit(limit)
                .map(entry -> entry.getKey().getUser().getId())
                .collect(Collectors.toList());
    }

    private User requireUser(UUID userId, String message) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException(message));
    }

    private int calculateScore(Bio current, Bio candidate, double distanceKm) {
        int score = 0;

        // Primary language is the strongest signal because the platform is designed to connect technically compatible peers.
        if (current.getPrimaryLanguage() != null && current.getPrimaryLanguage().equalsIgnoreCase(candidate.getPrimaryLanguage())) {
            score += 30;
        }

        score += calculateDistanceScore(current.getMaxDistanceKm(), distanceKm);

        // Matching intent helps pair users who want the same kind of connection.
        if (current.getLookFor() != null && current.getLookFor().equalsIgnoreCase(candidate.getLookFor())) {
            score += 20;
        }

        // Similar experience levels can produce more balanced conversations and expectations.
        if (current.getExperienceLevel() != null && current.getExperienceLevel().equalsIgnoreCase(candidate.getExperienceLevel())) {
            score += 15;
        }

        // Age is a softer compatibility signal, so close age ranges add a modest bonus instead of dominating the score.
        score += calculateAgeScore(current.getAge(), candidate.getAge());

        // Preferred OS is a lighter signal that still helps when users want similar tooling environments.
        if (current.getPreferredOs() != null && current.getPreferredOs().equalsIgnoreCase(candidate.getPreferredOs())) {
            score += 5;
        }

        // Coding style is intentionally low weight: useful for tie-breaking, not for dominating the match.
        if (current.getCodingStyle() != null && current.getCodingStyle().equalsIgnoreCase(candidate.getCodingStyle())) {
            score += 5;
        }

        return score;
    }

    private int calculateAgeScore(Integer currentAge, Integer candidateAge) {
        if (currentAge == null || candidateAge == null) {
            return 0;
        }

        int ageDifference = Math.abs(currentAge - candidateAge);
        if (ageDifference <= 2) {
            return 10;
        }
        if (ageDifference <= 5) {
            return 5;
        }
        return 0;
    }

    private int calculateDistanceScore(Integer maxDistanceKm, double distanceKm) {
        if (maxDistanceKm == null || maxDistanceKm <= 0 || !Double.isFinite(distanceKm) || distanceKm < 0 || distanceKm > maxDistanceKm) {
            return 0;
        }

        double closeness = 1 - (distanceKm / maxDistanceKm);
        return (int) Math.round(Math.max(0, closeness) * MAX_DISTANCE_SCORE);
    }
}
