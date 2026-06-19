package mealplan.stat.dto;

import lombok.Data;

@Data
public class StatRequest {
    private String date; // "yyyy-MM-dd" 형식
    private Double weight; // kg, 소수점 둘째 자리까지
}