package mealplan.users.dto;

import lombok.Data;

@Data
public class JoinRequest {
    private String loginId;
    private String password;
    private String nickname;
    private String email;
}