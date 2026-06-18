package mealplan.write.dao;

import mealplan.write.vo.Write;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WriteDao extends JpaRepository<Write, Long> {

    // 전체 피드 - 최신순
    List<Write> findAllByOrderByCreatedAtDesc();

    // 마이페이지 - 내가 작성한 게시물 목록 (최신순)
    List<Write> findByUserIdOrderByCreatedAtDesc(Long userId);
}