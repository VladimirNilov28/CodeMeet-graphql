package com.matchme.backend.repository;

import com.matchme.backend.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface ProfileRepository extends JpaRepository<Profile, UUID> {
    java.util.Optional<com.matchme.backend.model.Profile> findByUser(com.matchme.backend.model.User user);
}
