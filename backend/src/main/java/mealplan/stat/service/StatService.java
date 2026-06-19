package mealplan.stat.service;

import mealplan.stat.dto.StatResponse;
import mealplan.stat.dao.StatDao;
import mealplan.stat.vo.Stat;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class StatService {

    @Autowired
    private StatDao statDao;

    // 날짜별 체중 입력 (같은 날짜에 이미 기록이 있으면 값만 덮어씀 - upsert)
    public StatResponse saveStat(Long userId, String dateStr, Double weight) {
        if (weight == null) {
            throw new IllegalArgumentException("체중 값을 입력해주세요.");
        }

        LocalDate date;
        try {
            date = LocalDate.parse(dateStr);
        } catch (Exception e) {
            throw new IllegalArgumentException("날짜 형식이 올바르지 않습니다.");
        }

        // 체중은 소수점 둘째 자리까지만 저장
        double rounded = Math.round(weight * 100) / 100.0;

        Stat stat = statDao.findByUserIdAndDate(userId, date)
                .orElse(new Stat());

        stat.setUserId(userId);
        stat.setDate(date);
        stat.setWeight(rounded);

        Stat saved = statDao.save(stat);
        return StatResponse.from(saved);
    }

    // 마이페이지/통계 페이지 - 내 체중 기록 전체 (날짜 오름차순, 그래프에 그대로 사용)
    public List<StatResponse> getMyStats(Long userId) {
        return statDao.findByUserIdOrderByDateAsc(userId)
                .stream()
                .map(StatResponse::from)
                .collect(Collectors.toList());
    }
}