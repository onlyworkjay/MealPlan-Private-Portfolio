package mealplan.stat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import mealplan.stat.vo.Stat;

@Data
@AllArgsConstructor
public class StatResponse {
    private Long statId;
    private String date; // "yyyy-MM-dd" 형식
    private Double weight;

    public static StatResponse from(Stat stat) {
        return new StatResponse(
                stat.getStatId(),
                stat.getDate().toString(),
                stat.getWeight()
        );
    }
}