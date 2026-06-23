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

    private static final long CODE_TTL_MILLIS = 3 * 60 * 1000;

    private final ConcurrentHashMap<String, CodeEntry> codeStore = new ConcurrentHashMap<>();

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

        long expiresAt = System.currentTimeMillis() + CODE_TTL_MILLIS;
        codeStore.put(email, new CodeEntry(authCode, expiresAt));

        System.out.println("=====================================");
        System.out.println("[TEST] " + email + " 인증번호: " + authCode);
        System.out.println("=====================================");

        String title = "MealPlan 이메일 인증번호";
        String content =
                "<div style='font-family: Arial, sans-serif; max-width: 500px; width: 100%; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(14,165,233,0.12);'>" +

                        "<div style='background: linear-gradient(135deg, #38bdf8, #0284c7); padding: 30px; text-align: center;'>" +
                        "<h1 style='color: white; margin: 0; font-size: 26px; letter-spacing: 2px;'>🥗 MealPlan</h1>" +
                        "<p style='color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;'>이메일 인증</p>" +
                        "</div>" +

                        "<div style='padding: 40px 30px; background: #ffffff;'>" +
                        "<p style='color: #0f172a; font-size: 15px; margin: 0 0 24px;'>안녕하세요!<br>아래 인증번호를 입력해 인증을 완료해주세요.</p>" +

                        "<div style='background: #e0f4fd; border: 2px solid #38bdf8; border-radius: 10px; padding: 24px; text-align: center;'>" +
                        "<p style='margin: 0 0 8px; color: #475569; font-size: 13px;'>인증번호</p>" +
                        "<div style='font-size: 38px; font-weight: bold; letter-spacing: 10px; color: #0284c7;'>" + authCode + "</div>" +
                        "</div>" +

                        "<p style='color: #94a3b8; font-size: 12px; margin: 20px 0 0; text-align: center;'>" +
                        "⏱ 인증번호는 <b>3분</b> 이내에 입력해주세요.<br>" +
                        "본인이 요청하지 않았다면 이 메일을 무시하세요." +
                        "</p>" +
                        "</div>" +

                        "<div style='background: #f8fbff; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;'>" +
                        "<p style='color: #94a3b8; font-size: 11px; margin: 0;'>© 2026 MealPlan. All rights reserved.</p>" +
                        "</div>" +

                        "</div>";

        emailSender.sendMail(title, email, content);

        return ResponseEntity.ok("인증번호가 전송되었습니다.");
    }

    // 인증번호 확인
    @PostMapping("/email-verification/confirm")
    public ResponseEntity<?> confirmCode(@RequestBody EmailVerifyRequest request) {
        String email = request.getEmail();
        String code  = request.getCode();

        CodeEntry entry = codeStore.get(email);

        if (entry == null) {
            return ResponseEntity.badRequest().body("인증번호를 먼저 요청해주세요.");
        }

        if (System.currentTimeMillis() > entry.expiresAt()) {
            codeStore.remove(email);
            return ResponseEntity.badRequest().body("인증번호가 만료되었습니다. 다시 요청해주세요.");
        }

        if (!entry.code().equals(code)) {
            return ResponseEntity.badRequest().body("인증번호가 일치하지 않습니다.");
        }

        codeStore.remove(email);
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

    private record CodeEntry(String code, long expiresAt) {}
}