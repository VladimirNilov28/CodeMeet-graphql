package com.codemeet.backend.dto;

import lombok.Data;

@Data
public class PrivacySettingsDto {
    private boolean hideAvatar;
    private boolean hideLocation;
    private boolean hideAge;
    private boolean hideLastSeen;
}