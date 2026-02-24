package com.team.dtd.repository;

import com.team.dtd.entity.User;
import com.team.dtd.entity.UserStageClear;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserStageClearRepository extends JpaRepository<UserStageClear, UserStageClear.UserStageClearId> {
    Optional<UserStageClear> findByUserAndId_StageIdx(User user, Integer stageIdx);
    List<UserStageClear> findAllByUser(User user);
}