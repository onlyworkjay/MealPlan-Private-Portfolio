package mealplan.users.dao;

import mealplan.users.vo.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserDao extends JpaRepository<User, Long> {

    // 아이디 중복 체크용
    boolean existsByLoginId(String loginId);

    // 닉네임 중복 체크용
    boolean existsByNickname(String nickname);

    // 이메일 중복 체크용
    boolean existsByEmail(String email);

    // 로그인 시 아이디로 회원 조회
    Optional<User> findByLoginId(String loginId);

}