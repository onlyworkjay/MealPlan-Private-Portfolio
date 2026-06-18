package mealplan.users.vo;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId; // 회원 식별자 --> 여기에서의 userId는 null (자동 생성)

    // ⬇️ 수정된 부분: 하드 삭제로 전환하면서 unique 제약 복원
    // -> 행이 완전히 삭제되므로 DB의 UNIQUE 제약만으로 동시성 안전하게 중복 방지 가능
    @Column(name = "login_id", unique = true, nullable = false, length = 16)
    private String loginId; // 로그인 아이디

    @Column(nullable = false, length = 255)
    private String password; // 로그인 비밀번호 (암호화 저장)

    @Column(unique = true, nullable = false, length = 8)
    private String nickname; // 닉네임

    @Column(unique = true, length = 100)
    private String email; // 이메일 (선택)

    @Column(name = "created_at")
    private LocalDateTime createdAt; // 가입일

    @Column(name = "updated_at")
    private LocalDateTime updatedAt; // 수정일

    // 참고: 하드 삭제로 전환하면서 더 이상 코드에서 값을 채우지 않음 (남겨두되 비활성 컬럼)
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt; // 탈퇴일 (현재 미사용)

    @Column(name = "profile_img", length = 500)
    private String profileImg; // 프로필 이미지 (기본값 없음, null이면 프론트에서 defaultProfile 사용)

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