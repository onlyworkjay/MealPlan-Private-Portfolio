package mealplan.users.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import mealplan.users.vo.User;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class UserResponse {

    private Long id;
    private String loginId;
    private String nickname;
    private String email;
    private LocalDateTime createdAt;
    private String profileImg;

    public static UserResponse from(User user) {
        return new UserResponse(
                user.getUserId(),
                user.getLoginId(),
                user.getNickname(),
                user.getEmail(),
                user.getCreatedAt(),
                user.getProfileImg()
        );
    }
}