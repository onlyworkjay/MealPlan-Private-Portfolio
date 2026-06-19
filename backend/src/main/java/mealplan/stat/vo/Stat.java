package mealplan.stat.vo;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "stats", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "date"}))
public class Stat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long statId; // 체중 기록 식별자

    // Write와 동일하게 users 테이블과 JPA 연관관계 없이 단순 컬럼으로만 보관
    @Column(name = "user_id", nullable = false)
    private Long userId; // 작성자 회원 식별자

    @Column(nullable = false)
    private LocalDate date; // 체중을 기록한 날짜 (하루에 한 건만 존재 - user_id + date 유니크)

    @Column(nullable = false)
    private Double weight; // 체중(kg), 소수점 둘째 자리까지 저장

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

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