package com.codemeet.backend.dto;

import lombok.Data;

@Data
public class BioDto {
    private String primaryLanguage;
    private String experienceLevel;
    private String lookFor;
    private String preferredOs;
    private String codingStyle;
    private Double latitude;
    private Double longitude;
    private Integer maxDistanceKm;
    private boolean locationVisible = true;
    private Integer age;
    private boolean ageVisible = true;
}
