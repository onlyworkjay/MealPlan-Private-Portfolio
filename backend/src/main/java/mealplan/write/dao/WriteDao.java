package mealplan.write.dao;

import mealplan.write.vo.Write;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface WriteDao extends JpaRepository<Write, Long> {

    // 전체 피드 - 최신순
    List<Write> findAllByOrderByCreatedAtDesc();

    // 마이페이지 - 내가 작성한 게시물 목록 (최신순)
    List<Write> findByUserIdOrderByCreatedAtDesc(Long userId);

    // 하루 작성 횟수 제한 체크용 - 특정 유저가 주어진 기간(오늘 0시~다음날 0시) 내 작성한 게시물 수
    long countByUserIdAndCreatedAtBetween(Long userId, LocalDateTime start, LocalDateTime end);
}