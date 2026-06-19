package mealplan.stat.dao;

import mealplan.stat.vo.Stat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface StatDao extends JpaRepository<Stat, Long> {

    // 마이페이지/통계 페이지 - 내 체중 기록 전체를 날짜 오름차순으로 (그래프용)
    List<Stat> findByUserIdOrderByDateAsc(Long userId);

    // 같은 날짜에 이미 기록이 있는지 확인 (있으면 덮어쓰기, 없으면 새로 생성)
    Optional<Stat> findByUserIdAndDate(Long userId, LocalDate date);
}