package mealplan.write.controller;

import mealplan.users.util.JwtUtil;
import mealplan.write.dto.WriteResponse;
import mealplan.write.service.WriteService;
import mealplan.write.vo.Write;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@CrossOrigin("*")
@RestController
@RequestMapping("/writes")
public class WriteController {

    @Autowired
    private WriteService writeService;

    // mealplan.users.util.JwtUtil을 그대로 재사용 (인증/토큰 관련 공통 유틸이라 도메인 간 공유)
    @Autowired
    private JwtUtil jwtUtil;

    // 식단 기록(게시물) 등록
    @PostMapping
    public ResponseEntity<?> createWrite(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam String title,
            @RequestParam(required = false) String content,
            @RequestParam Integer calories,
            @RequestParam(required = false) List<MultipartFile> images) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtUtil.getUserId(token);

            Write saved = writeService.createWrite(userId, title, content, calories, images);

            return ResponseEntity.ok(WriteResponse.from(saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(401).body("인증에 실패했습니다. 다시 로그인해주세요.");
        }
    }

    // 전체 피드 - 모든 사용자의 게시물 목록 (로그인 여부와 관계없이 누구나 조회 가능)
    @GetMapping
    public ResponseEntity<?> getAllWrites() {
        return ResponseEntity.ok(writeService.getAllWrites());
    }

    // 마이페이지 - 내가 작성한 게시물 목록
    @GetMapping("/my")
    public ResponseEntity<?> getMyWrites(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtUtil.getUserId(token);

            return ResponseEntity.ok(writeService.getMyWrites(userId));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("인증에 실패했습니다. 다시 로그인해주세요.");
        }
    }

    // 상세보기 - 게시물 단건 조회 (로그인 여부와 관계없이 누구나 조회 가능)
    @GetMapping("/{writeId}")
    public ResponseEntity<?> getWrite(@PathVariable Long writeId) {
        try {
            return ResponseEntity.ok(writeService.getWrite(writeId));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}