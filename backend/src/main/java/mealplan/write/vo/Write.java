package mealplan.write.vo;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "writes")
public class Write {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long writeId; // 게시물(식단 기록) 식별자

    // users 테이블과의 JPA 연관관계 없이 단순 컬럼으로만 보관
    // (UserService의 changePassword/withdraw 등도 동일하게 Long userId를 그대로 다루는 방식이라 통일)
    @Column(name = "user_id", nullable = false)
    private Long userId; // 작성자 회원 식별자

    @Column(nullable = false, length = 50)
    private String title; // 제목

    @Column(length = 1000)
    private String content; // 내용 (선택)

    @Column(nullable = false)
    private Integer calories; // 칼로리

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 사진 최대 4장 (1:N) - 슬롯 순서를 sortOrder로 보존
    @OneToMany(mappedBy = "write", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<WriteImage> images = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}