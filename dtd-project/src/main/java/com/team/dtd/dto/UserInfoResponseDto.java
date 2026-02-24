package com.team.dtd.dto;

import com.team.dtd.entity.User;
import com.team.dtd.entity.UserStageClear;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Getter
@NoArgsConstructor
public class UserInfoResponseDto {
    private String username;
    private int gold;
    private int diamond;
    private int exp;

    private UserTowerResponseDto mainTower;

    private List<StageClearInfo> clearedStages = new ArrayList<>();

    public UserInfoResponseDto(User user, List<UserStageClear> stageClears) {
        this.username = user.getUsername();
        this.gold = user.getGold();
        this.diamond = user.getDiamond();
        this.exp = user.getExp();

        if (user.getMainTower() != null) {
            this.mainTower = new UserTowerResponseDto(user.getMainTower());
        }

        if (stageClears != null) {
            this.clearedStages = stageClears.stream()
                    .map(StageClearInfo::new)
                    .collect(Collectors.toList());
        }
    }

    @Getter
    @AllArgsConstructor
    public static class StageClearInfo {
        private int stageIdx;
        private int score;
        private boolean isCleared;

        public StageClearInfo(UserStageClear clear) {
            this.stageIdx = clear.getId().getStageIdx();
            this.score = clear.getScore();
            this.isCleared = clear.isCleared();
        }
    }
}