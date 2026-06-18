package mealplan.users.controller;

import mealplan.users.dto.*;
import mealplan.users.service.UserService;
import mealplan.users.vo.User;
import mealplan.users.util.JwtUtil;

import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@CrossOrigin("*")
@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtUtil jwtUtil;

    // 회원가입
    @PostMapping("/join")
    public ResponseEntity<?> join(@RequestBody JoinRequest request) {
        try {
            User saved = userService.join(request);
            return ResponseEntity.ok(UserResponse.from(saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 아이디 중복 확인
    @GetMapping("/check-id")
    public ResponseEntity<?> checkId(@RequestParam String loginId) {
        return ResponseEntity.ok(userService.checkLoginId(loginId));
    }

    // 닉네임 중복 확인
    @GetMapping("/check-nickname")
    public ResponseEntity<?> checkNickname(@RequestParam String nickname) {
        return ResponseEntity.ok(userService.checkNickname(nickname));
    }

    // 이메일 중복 확인
    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
        return ResponseEntity.ok(userService.checkEmail(email));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            LoginResponse response = userService.login(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body(e.getMessage());
        }
    }

    // 세션 연장 (토큰 재발급)
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtUtil.getUserId(token);
            String loginId = jwtUtil.getLoginId(token);
            String newToken = jwtUtil.generateToken(userId, loginId);
            return ResponseEntity.ok(Map.of("token", newToken));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("세션 연장에 실패했습니다. 다시 로그인해주세요.");
        }
    }

    // 아이디 찾기
    @PostMapping("/find-id")
    public ResponseEntity<?> findId(@RequestBody FindIdRequest request) {
        try {
            User user = userService.findAccountByNicknameAndEmail(
                    request.getNickname(), request.getEmail());
            return ResponseEntity.ok(Map.of(
                    "loginId", user.getLoginId(),
                    "createdAt", user.getCreatedAt()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 비밀번호 찾기 - 아이디 + 이메일 확인 후 새 비밀번호로 직접 변경
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPwRequest request) {
        try {
            userService.resetPassword(
                    request.getLoginId(), request.getEmail(), request.getNewPassword());
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 마이페이지 - 내 정보 수정 (닉네임 / 이메일 / 프로필 사진)
    @PostMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(required = false) String nickname,
            @RequestParam(required = false) String email,
            @RequestParam(required = false, defaultValue = "false") boolean clearProfileImage,
            @RequestPart(required = false) MultipartFile profileImage) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtUtil.getUserId(token);

            UserResponse updated = userService.updateProfile(
                    userId, nickname, email, profileImage, clearProfileImage);

            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(401).body("인증에 실패했습니다. 다시 로그인해주세요.");
        }
    }

    @PostMapping("/password")
    public ResponseEntity<?> changePassword(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ChangePasswordRequest request) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtUtil.getUserId(token);

            userService.changePassword(userId, request.getCurrentPassword(), request.getNewPassword());

            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(401).body("인증에 실패했습니다. 다시 로그인해주세요.");
        }
    }

    // 마이페이지 - 회원 탈퇴
    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Long userId = jwtUtil.getUserId(token);

            userService.withdraw(userId);

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(401).body("인증에 실패했습니다. 다시 로그인해주세요.");
        }
    }
}