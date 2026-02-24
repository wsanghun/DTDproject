package com.team.dtd.service;

import com.team.dtd.dto.*;
import com.team.dtd.entity.*;
import com.team.dtd.enums.PaymentType;
import com.team.dtd.enums.RewardType;
import com.team.dtd.repository.*;
import com.team.dtd.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserTowerRepository userTowerRepository;
    private final UserInventoryRepository userInventoryRepository;
    private final TowerRepository towerRepository;
    private final ItemRepository itemRepository;
    private final ShopProductRepository shopProductRepository;
    private final UserStageClearRepository userStageClearRepository;

    private final Random random = new Random();

    @Transactional(readOnly = true)
    public UserInfoResponseDto getMyInfo() {
        String userid = SecurityUtil.getCurrentUserid();
        User user = userRepository.findByUserid(userid)
                .orElseThrow(() -> new RuntimeException("로그인 유저 정보가 없습니다."));

        List<UserStageClear> stageClears = userStageClearRepository.findAllByUser(user);

        return new UserInfoResponseDto(user, stageClears);
    }

    @Transactional(readOnly = true)
    public List<UserInventoryResponseDto> getMyInventory() {
        String userid = SecurityUtil.getCurrentUserid();
        User user = userRepository.findByUserid(userid)
                .orElseThrow(() -> new RuntimeException("로그인 유저 정보가 없습니다."));

        List<UserInventory> inventory = userInventoryRepository.findAllByUserOrderById_ItemIdxAsc(user);

        return inventory.stream()
                .map(UserInventoryResponseDto::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public GachaResponseDto drawGacha(GachaRequestDto request) {
        String userid = SecurityUtil.getCurrentUserid();
        User user = userRepository.findByUserid(userid)
                .orElseThrow(() -> new RuntimeException("유저 정보가 없습니다."));

        Item capsuleItem = itemRepository.findById(request.getCapsuleItemId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 캡슐입니다."));

        if (request.getPaymentType() == PaymentType.ITEM) {
            UserInventory.UserInventoryId invId = new UserInventory.UserInventoryId(user.getIdx(), capsuleItem.getIdx());
            UserInventory inventory = userInventoryRepository.findById(invId)
                    .orElseThrow(() -> new IllegalArgumentException("보유한 캡슐이 없습니다."));

            if (inventory.getQuantity() < 1) {
                throw new IllegalArgumentException("캡슐 수량이 부족합니다.");
            }
            inventory.deductQuantity(1);

        } else if (request.getPaymentType() == PaymentType.GOLD) {
            user.deductGold(capsuleItem.getPriceGold());
        } else if (request.getPaymentType() == PaymentType.DIAMOND) {
            user.deductDiamond(capsuleItem.getPriceDiamond());
        } else {
            throw new IllegalArgumentException("유효하지 않은 결제 방식입니다.");
        }

        int targetTier = capsuleItem.getEffectValue();

        List<Tower> targetTowers = towerRepository.findAllByTier(targetTier);
        if (targetTowers.isEmpty()) {
            throw new RuntimeException("해당 티어(" + targetTier + ")의 타워 데이터가 없습니다.");
        }

        List<GachaResponseDto.ObtainedItem> results = new ArrayList<>();
        int loopCount = 10;
        int amountPerLoop = 5;

        for (int i = 0; i < loopCount; i++) {
            Tower selectedTower = targetTowers.get(random.nextInt(targetTowers.size()));

            Item dataItem = itemRepository.findById(selectedTower.getIdx())
                    .orElseThrow(() -> new RuntimeException("타워 ID(" + selectedTower.getIdx() + ")에 해당하는 데이터 아이템이 없습니다."));

            addInventoryItem(user, dataItem, amountPerLoop);

            results.add(new GachaResponseDto.ObtainedItem(
                    dataItem.getIdx(),
                    dataItem.getItemName(),
                    amountPerLoop,
                    selectedTower.getTier()
            ));
        }

        return GachaResponseDto.builder()
                .results(results)
                .totalQuantity(loopCount * amountPerLoop)
                .build();
    }

    @Transactional
    public void enhanceTower(EnhanceTowerRequestDto request) {
        String userid = SecurityUtil.getCurrentUserid();
        User user = userRepository.findByUserid(userid)
                .orElseThrow(() -> new RuntimeException("유저 정보 없음"));

        Tower tower = towerRepository.findById(request.getTowerIdx())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 타워입니다."));

        UserTower userTower = userTowerRepository.findByUserAndTower_Idx(user, tower.getIdx())
                .orElse(null);

        int currentLevel = (userTower != null) ? userTower.getLevel() : 0;

        int goldCost = (int) (tower.getBaseUpgradeCost() * Math.pow(tower.getCostGrowth(), currentLevel));

        int dataItemCost = 10 + (currentLevel * 5);

        if (user.getGold() < goldCost) {
            throw new IllegalArgumentException("골드가 부족합니다. 필요: " + goldCost);
        }

        UserInventory.UserInventoryId dataInvId = new UserInventory.UserInventoryId(user.getIdx(), tower.getIdx());
        UserInventory dataInv = userInventoryRepository.findById(dataInvId)
                .orElseThrow(() -> new IllegalArgumentException("강화에 필요한 데이터 아이템이 없습니다."));

        if (dataInv.getQuantity() < dataItemCost) {
            throw new IllegalArgumentException("데이터 아이템이 부족합니다. (보유: " + dataInv.getQuantity() + ", 필요: " + dataItemCost + ")");
        }

        user.deductGold(goldCost);
        dataInv.deductQuantity(dataItemCost);

        if (userTower == null) {
            userTower = UserTower.builder().user(user).tower(tower).level(1).build();
            userTowerRepository.save(userTower);
        } else {
            userTower.levelUp();
        }
    }

    private void addInventoryItem(User user, Item item, int quantity) {
        UserInventory.UserInventoryId id = new UserInventory.UserInventoryId(user.getIdx(), item.getIdx());
        UserInventory inventory = userInventoryRepository.findById(id).orElse(null);

        if (inventory != null) {
            inventory.addQuantity(quantity);
        } else {
            inventory = UserInventory.builder()
                    .id(id)
                    .user(user)
                    .item(item)
                    .quantity(quantity)
                    .build();
            userInventoryRepository.save(inventory);
        }
    }

    @Transactional
    public void setMainTower(SetMainTowerRequestDto request) {
        String userid = SecurityUtil.getCurrentUserid();
        User user = userRepository.findByUserid(userid)
                .orElseThrow(() -> new RuntimeException("유저 정보가 없습니다."));

        UserTower targetTower = userTowerRepository.findByUserAndTower_Idx(user, request.getUserTowerIdx().intValue())
                .orElse(null);

        if (targetTower == null) {
            Tower tower = towerRepository.findById(request.getUserTowerIdx().intValue())
                    .orElseThrow(()->new IllegalArgumentException("존재하지 않는 타워"));
            targetTower = UserTower.builder().user(user).tower(tower).level(0).build();
            userTowerRepository.save(targetTower);
        }

        user.updateMainTower(targetTower);
    }

    @Transactional
    public void buyShopProduct(BuyProductRequestDto request) {
        String userid = SecurityUtil.getCurrentUserid();
        User user = userRepository.findByUserid(userid)
                .orElseThrow(() -> new RuntimeException("유저 정보가 없습니다."));

        ShopProduct product = shopProductRepository.findById(request.getProductIdx())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상품입니다."));

        if (product.getRewardType() == RewardType.DIAMOND) {
            user.addDiamond(product.getRewardValue());
        } else if (product.getRewardType() == RewardType.GOLD) {
            user.addGold(product.getRewardValue());
        }
    }
}