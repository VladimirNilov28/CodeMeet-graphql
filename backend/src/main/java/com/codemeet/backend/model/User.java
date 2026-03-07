package com.codemeet.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name="users")
@Data
@NoArgsConstructor

public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(unique = true)
    private String name;

    private String profilePicture;

    private Instant lastSeenAt;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean hideAvatar = false;

    @Column(name = "hide_location", nullable = false, columnDefinition = "boolean default false")
    private boolean hideLocation = false;

    @Column(name = "hide_age", nullable = false, columnDefinition = "boolean default false")
    private boolean hideAge = false;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean hideLastSeen = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(255) default 'USER'")
    private Role role = Role.USER;

    public enum Role {
        USER, ADMIN
    }
}
