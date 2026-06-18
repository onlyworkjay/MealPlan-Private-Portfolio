package mealplan.write.vo;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "write_images")
public class WriteImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long writeImageId; // 사진 식별자

    // ⚠️ Write <-> WriteImage가 서로를 참조하는 양방향 관계라서, @Data가 만드는
    // equals/hashCode/toString이 서로를 무한히 호출하지 않도록 이 역참조 필드는 제외함
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "write_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @JsonIgnore
    private Write write;

    @Column(name = "image_url", nullable = false, length = 500)
    private String imageUrl; // 저장된 이미지 URL

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder; // 업로드 순서 (0부터)
}