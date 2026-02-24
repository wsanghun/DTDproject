package com.team.dtd.dto;

import com.team.dtd.enums.PaymentType;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class GachaRequestDto {
    private Integer capsuleItemId;
    private PaymentType paymentType;
}