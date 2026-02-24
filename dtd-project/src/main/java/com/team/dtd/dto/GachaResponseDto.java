package com.team.dtd.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GachaResponseDto {
    private List<ObtainedItem> results;
    private int totalQuantity;

    @Getter
    @AllArgsConstructor
    public static class ObtainedItem {
        private Integer itemIdx;
        private String itemName;
        private int quantity;
        private int targetTowerTier;
    }
}