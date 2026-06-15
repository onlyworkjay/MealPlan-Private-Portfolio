package mealplan.users.controller;

import mealplan.global.util.EmailSender;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@CrossOrigin("*")
@RestController
@RequestMapping("/users")
public class EmailController {

    @Autowired
    private EmailSender emailSender;

    // 이메일 -> 인증코드 임시 저장 (실제 서비스라면 Redis 권장)
    private final ConcurrentHashMap<String, String> codeStore = new ConcurrentHashMap<>();

    // 인증번호 전송
    @PostMapping("/email-verification")
    public ResponseEntity<?> sendCode(@RequestBody EmailRequest request) {
        String email = request.getEmail();
        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("이메일을 입력해주세요.");
        }

        Random random = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            sb.append(random.nextInt(10));
        }
        String authCode = sb.toString();

        codeStore.put(email, authCode); // 코드 저장

        String title = "MealPlan 이메일 인증번호";
        String content = "<h3>인증번호는 <b>" + authCode + "</b> 입니다.</h3>";
        emailSender.sendMail(title, email, content);

        return ResponseEntity.ok("인증번호가 전송되었습니다.");
    }

    // 인증번호 확인
    @PostMapping("/email-verification/confirm")
    public ResponseEntity<?> confirmCode(@RequestBody EmailVerifyRequest request) {
        String email = request.getEmail();
        String code  = request.getCode();

        String savedCode = codeStore.get(email);

        if (savedCode == null) {
            return ResponseEntity.badRequest().body("인증번호를 먼저 요청해주세요.");
        }
        if (!savedCode.equals(code)) {
            return ResponseEntity.badRequest().body("인증번호가 일치하지 않습니다.");
        }

        codeStore.remove(email); // 인증 성공 시 삭제
        return ResponseEntity.ok("이메일 인증이 완료되었습니다.");
    }

    public static class EmailRequest {
        private String email;
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    public static class EmailVerifyRequest {
        private String email;
        private String code;
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getCode() { return code; }
        public void setCode(String code) { this.code = code; }
    }
}