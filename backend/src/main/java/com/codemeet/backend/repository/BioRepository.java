package com.codemeet.backend.repository;

import com.codemeet.backend.model.Bio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface BioRepository extends JpaRepository<Bio, UUID> {
    java.util.Optional<com.codemeet.backend.model.Bio> findByUser(com.codemeet.backend.model.User user);

    List<Bio> findByUserIdIn(Collection<UUID> userIds);

    @Query(value = """
            SELECT b.id AS id,
                   b.user_id AS userId,
                   ST_Distance(
                       b.location,
                       ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography
                   ) AS distanceMeters
            FROM bios b
            WHERE b.user_id <> :currentUserId
              AND b.location IS NOT NULL
              AND b.max_distance_km IS NOT NULL
              AND ST_DWithin(
                    b.location,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                    :maxDistanceMeters
              )
              AND ST_DWithin(
                    b.location,
                    ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                    b.max_distance_km * 1000.0
              )
            """, nativeQuery = true)
    List<NearbyBioProjection> findNearbyCandidateDistances(
            @Param("currentUserId") UUID currentUserId,
            @Param("latitude") double latitude,
            @Param("longitude") double longitude,
            @Param("maxDistanceMeters") double maxDistanceMeters
    );
}