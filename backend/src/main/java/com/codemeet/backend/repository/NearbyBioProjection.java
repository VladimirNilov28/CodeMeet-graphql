package com.codemeet.backend.repository;

import java.util.UUID;

public interface NearbyBioProjection {
    UUID getId();
    UUID getUserId();
    double getDistanceMeters();
}