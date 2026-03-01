package com.matchme.backend.controller;

import com.matchme.backend.dto.BioDto;
import com.matchme.backend.dto.ProfileDto;
import com.matchme.backend.dto.UserResponse;
import com.matchme.backend.model.Bio;
import com.matchme.backend.model.Profile;
import com.matchme.backend.model.User;
import com.matchme.backend.repository.BioRepository;
import com.matchme.backend.repository.ProfileRepository;
import com.matchme.backend.repository.UserRepository;
import com.matchme.backend.service.FileService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class UserController {
    
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final BioRepository bioRepository;
    private final FileService fileService;

    public UserController(UserRepository userRepository, ProfileRepository profileRepository, BioRepository bioRepository, FileService fileService) {
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.bioRepository = bioRepository;
        this.fileService = fileService;
    }
    // Core endpoints for fetching user data
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return ResponseEntity.ok(mapToResponse(user));
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return ResponseEntity.ok(mapToResponse(user));
    }

    // profile endpoints

    @GetMapping("/me/profile")
    public ResponseEntity<ProfileDto> getMyProfile(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        
        Profile profile = profileRepository.findByUser(user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not set up yet"));

        ProfileDto dto = new ProfileDto();
        dto.setAboutMe(profile.getAboutMe());
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/me/profile")
    public ResponseEntity<String> updateMyProfile(Authentication authentication, @RequestBody ProfileDto request
    ) {
        User user = getAuthenticatedUser(authentication);

        Profile profile = profileRepository.findByUser(user).orElse(new Profile());

        profile.setUser(user);
        profile.setAboutMe(request.getAboutMe());
        profileRepository.save(profile);

        return ResponseEntity.ok("Profile updated successfully");
    }

    // bio endpoints

    @GetMapping("/me/bio")
    public ResponseEntity<BioDto> getMyBio(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);

        Bio bio = bioRepository.findByUser(user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bio not set up yet"));

        BioDto dto = new BioDto();
        dto.setPrimaryLanguage(bio.getPrimaryLanguage());
        dto.setExperienceLevel(bio.getExperienceLevel());
        dto.setLookFor(bio.getLookFor());
        dto.setPreferredOs(bio.getPreferredOs());
        dto.setCodingStyle(bio.getCodingStyle());
        dto.setCity(bio.getCity());
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/me/bio")
    public ResponseEntity<String> updateMyBio(Authentication authentication, @RequestBody BioDto request) {
        User user = getAuthenticatedUser(authentication);

        Bio bio = bioRepository.findByUser(user).orElse(new Bio());
        bio.setUser(user);
        bio.setPrimaryLanguage(request.getPrimaryLanguage());
        bio.setExperienceLevel(request.getExperienceLevel());
        bio.setLookFor(request.getLookFor());
        bio.setPreferredOs(request.getPreferredOs());
        bio.setCodingStyle(request.getCodingStyle());
        bio.setCity(request.getCity());
        bioRepository.save(bio);

        return ResponseEntity.ok("Bio updated successfully");
    }

    // helpers

    @PostMapping("/me/profile-picture")
    public ResponseEntity<String> uploadProfilePicture(Authentication authentication, @RequestParam("file") MultipartFile file) {
        User user = getAuthenticatedUser(authentication);

        try {
            String fileUrl = fileService.saveFile(file);
            user.setProfilePicture(fileUrl);
            userRepository.save(user);
            return ResponseEntity.ok("Profile picture updated successfully: " + fileUrl);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload file");
        }
    }

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }
    private UserResponse mapToResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setName(user.getName());
        response.setProfilePicture(user.getProfilePicture());
        return response;
    }
}
