package mealplan.write.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import mealplan.write.vo.Write;
import mealplan.write.vo.WriteImage;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class WriteResponse {

    private Long writeId;
    private Long userId;
    private String nickname; // 작성자 닉네임
    private String profileImg; // 작성자 프로필 사진 (피드/상세보기에서 헤더와 동일하게 표시)
    private String title;
    private String content;
    private Integer calories;
    private List<String> imageUrls;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // 작성자 정보가 필요 없는 경우 (예: 등록 직후 응답)
    public static WriteResponse from(Write write) {
        return from(write, null, null);
    }

    public static WriteResponse from(Write write, String nickname, String profileImg) {
        List<String> imageUrls = write.getImages().stream()
                .map(WriteImage::getImageUrl)
                .collect(Collectors.toList());

        return new WriteResponse(
                write.getWriteId(),
                write.getUserId(),
                nickname,
                profileImg,
                write.getTitle(),
                write.getContent(),
                write.getCalories(),
                imageUrls,
                write.getCreatedAt(),
                write.getUpdatedAt()
        );
    }
}