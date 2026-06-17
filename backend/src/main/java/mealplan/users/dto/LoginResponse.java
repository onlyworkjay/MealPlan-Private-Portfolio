package mealplan.users.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private Long userId;
    private String loginId;
    private String nickname;
    private String email;
    private String profileImg;
}