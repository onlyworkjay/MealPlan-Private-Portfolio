package mealplan.stat.controller;

import mealplan.stat.dto.StatRequest;
import mealplan.stat.dto.StatResponse;
import mealplan.stat.service.StatService;
import mealplan.users.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin("*")
@RestController
@RequestMapping("/stats")
public class StatController {

    @Autowired
    private StatService statService;

    // mealplan.users.util.JwtUtil을 그대로 재사용 (WriteController와 동일한 방식)
    @Autowired
    private JwtUtil jwtUtil;

    // 통계 페이지 - 날짜별 체중 입력 (마이페이지에서도 동일하게 재사용 가능)
    @PostMapping
    public ResponseEntity<?> saveStat(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody StatRequest request) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtUtil.getUserId(token);

            StatResponse response = statService.saveStat(userId, request.getDate(), request.getWeight());

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(401).body("인증에 실패했습니다. 다시 로그인해주세요.");
        }
    }

    // 통계 페이지 - 내 체중 변화 기록 전체 조회 (그래프용)
    @GetMapping("/my")
    public ResponseEntity<?> getMyStats(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtUtil.getUserId(token);

            return ResponseEntity.ok(statService.getMyStats(userId));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("인증에 실패했습니다. 다시 로그인해주세요.");
        }
    }
}