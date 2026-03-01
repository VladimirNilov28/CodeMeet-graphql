package com.matchme.backend.repository;

import com.matchme.backend.model.Bio;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;

public interface BioRepository extends JpaRepository<Bio, UUID> {
    java.util.Optional<com.matchme.backend.model.Bio> findByUser(com.matchme.backend.model.User user);
}