package com.codemeet.backend.controller;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.codemeet.backend.model.User;
import com.codemeet.backend.repository.UserRepository;
import com.codemeet.backend.service.RecommendationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/block")
public class BlockController {
    private final RecommendationService recommendationService;
    private final UserRepository userRepository;

    public BlockController(RecommendationService recommendationService, UserRepository userRepository) {
        this.recommendationService = recommendationService;
        this.userRepository = userRepository;
     }

    @GetMapping
    public ResponseEntity<List<Map<String, String>>> getBlockedUsers(Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        List<Map<String, String>> response = recommendationService.getBlockedUsers(currentUser).stream()
                .map(user -> {
                    Map<String, String> entry = new HashMap<>();
                    entry.put("id", user.getId().toString());
                    String displayName = (user.getName() != null && !user.getName().trim().isBlank())
                            ? user.getName().trim()
                            : "User-" + user.getId().toString().substring(0, 8);
                    entry.put("name", displayName);
                    return entry;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{userId}")
    public ResponseEntity<Void> blockUser(@PathVariable UUID userId, Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        

        recommendationService.blockUser(currentUser.getId(), userId);
        return ResponseEntity.ok().build();
    }
    @DeleteMapping("/{userId}")
    public ResponseEntity<Void> unblockUser(@PathVariable UUID userId, Authentication authentication) {
        User currentUser = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        recommendationService.unblockUser(currentUser.getId(), userId);
        return ResponseEntity.ok().build();
    }
}
