package mealplan.users.service;

import mealplan.global.util.S3Uploader;
import mealplan.stat.dao.StatDao;
import mealplan.stat.vo.Stat;
import mealplan.users.dao.UserDao;
import mealplan.users.dto.JoinRequest;
import mealplan.users.dto.LoginRequest;
import mealplan.users.dto.LoginResponse;
import mealplan.users.dto.UserResponse;
import mealplan.users.util.JwtUtil;
import mealplan.users.vo.User;
import mealplan.write.dao.WriteDao;
import mealplan.write.vo.Write;
import mealplan.write.vo.WriteImage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class UserService {

    @Autowired
    private UserDao userDao;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // 탈퇴 시 작성한 게시물/체중기록까지 함께 정리하기 위해 추가
    @Autowired
    private WriteDao writeDao;

    @Autowired
    private StatDao statDao;

    @Autowired
    private S3Uploader s3Uploader;

    private static final Pattern ID_PATTERN = Pattern.compile("^[a-zA-Z0-9]{6,16}$");
    private static final Pattern PW_PATTERN = Pattern.compile("^[a-zA-Z0-9!@#$%]{8,16}$");
    private static final Pattern NICKNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9가-힣]{2,8}$");
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");

    // ⬇️ 수정된 부분: 하드 삭제로 바꾸면서 deletedAt 필터링이 필요 없어져 원래 방식으로 복원
    public boolean checkLoginId(String loginId) {
        return userDao.existsByLoginId(loginId);
    }

    public boolean checkNickname(String nickname) {
        return userDao.existsByNickname(nickname);
    }

    public boolean checkEmail(String email) {
        return userDao.existsByEmail(email);
    }

    public User join(JoinRequest req) {

        if (req.getLoginId() == null || !ID_PATTERN.matcher(req.getLoginId()).matches()) {
            throw new IllegalArgumentException("아이디는 영문+숫자 혼합 6~16자여야 합니다.");
        }

        if (checkLoginId(req.getLoginId())) {
            throw new IllegalArgumentException("이미 사용중인 아이디입니다.");
        }

        if (req.getPassword() == null || !PW_PATTERN.matcher(req.getPassword()).matches()) {
            throw new IllegalArgumentException("비밀번호는 영문+숫자+특수문자(!@#$%) 조합 8~16자여야 합니다.");
        }

        if (req.getNickname() == null || !NICKNAME_PATTERN.matcher(req.getNickname()).matches()) {
            throw new IllegalArgumentException("닉네임은 영문·숫자·한글 2~8자여야 합니다.");
        }

        if (checkNickname(req.getNickname())) {
            throw new IllegalArgumentException("이미 사용중인 닉네임입니다.");
        }

        String email = req.getEmail();
        if (email != null && !email.trim().isEmpty()) {
            email = email.trim();

            if (!EMAIL_PATTERN.matcher(email).matches()) {
                throw new IllegalArgumentException("올바르지 않은 이메일 형식입니다.");
            }

            if (checkEmail(email)) {
                throw new IllegalArgumentException("이미 사용중인 이메일입니다.");
            }
        } else {
            email = null;
        }

        User user = new User();
        user.setLoginId(req.getLoginId());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setNickname(req.getNickname());
        user.setEmail(email);

        return userDao.save(user);
    }

    @Autowired
    private JwtUtil jwtUtil;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Value("${file.upload-url-prefix}")
    private String uploadUrlPrefix;

    @Value("${file.base-url}")
    private String baseUrl;

    // ⬇️ 수정된 부분: 행이 진짜로 삭제되므로 같은 login_id가 두 개 존재할 일이 없어 원래 조회 방식으로 복원
    public LoginResponse login(LoginRequest req) {
        User user = userDao.findByLoginId(req.getLoginId())
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 일치하지 않습니다."));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("아이디 또는 비밀번호가 일치하지 않습니다.");
        }

        String token = jwtUtil.generateToken(user.getUserId(), user.getLoginId());

        return new LoginResponse(
                token,
                user.getUserId(),
                user.getLoginId(),
                user.getNickname(),
                user.getEmail(),
                user.getProfileImg()
        );
    }

    // 마이페이지 - 닉네임/이메일/프로필 사진 수정
    public UserResponse updateProfile(Long userId, String nickname, String email,
                                      MultipartFile profileImage, boolean clearProfileImage) {
        User user = userDao.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (nickname != null && !nickname.trim().isEmpty()) {
            String trimmed = nickname.trim();

            if (!NICKNAME_PATTERN.matcher(trimmed).matches()) {
                throw new IllegalArgumentException("닉네임은 영문·숫자·한글 2~8자여야 합니다.");
            }

            if (!trimmed.equals(user.getNickname()) && checkNickname(trimmed)) {
                throw new IllegalArgumentException("이미 사용중인 닉네임입니다.");
            }

            user.setNickname(trimmed);
        }

        if (email != null && !email.trim().isEmpty()) {
            String trimmed = email.trim();

            if (!EMAIL_PATTERN.matcher(trimmed).matches()) {
                throw new IllegalArgumentException("올바르지 않은 이메일 형식입니다.");
            }

            if (!trimmed.equals(user.getEmail()) && checkEmail(trimmed)) {
                throw new IllegalArgumentException("이미 사용중인 이메일입니다.");
            }

            user.setEmail(trimmed);
        }

        if (clearProfileImage) {
            user.setProfileImg(null);
        } else if (profileImage != null && !profileImage.isEmpty()) {
            user.setProfileImg(saveProfileImage(userId, profileImage));
        }

        return UserResponse.from(userDao.save(user));
    }

    // 마이페이지 - 비밀번호 변경
    public void changePassword(Long userId, String currentPassword, String newPassword) {
        User user = userDao.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }

        if (newPassword == null || !PW_PATTERN.matcher(newPassword).matches()) {
            throw new IllegalArgumentException("비밀번호는 영문+숫자+특수문자(!@#$%) 조합 8~16자여야 합니다.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userDao.save(user);
    }

    // 아이디 찾기 - 닉네임 + 이메일이 일치하는 회원 정보 반환
    public User findAccountByNicknameAndEmail(String nickname, String email) {
        if (nickname == null || nickname.trim().isEmpty()
                || email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("닉네임과 이메일을 모두 입력해주세요.");
        }

        return userDao.findByNicknameAndEmail(nickname.trim(), email.trim())
                .orElseThrow(() -> new IllegalArgumentException("일치하는 회원 정보가 없습니다."));
    }

    // 비밀번호 찾기 - 아이디 + 이메일이 일치하면 새 비밀번호로 직접 변경
    public void resetPassword(String loginId, String email, String newPassword) {
        if (loginId == null || loginId.trim().isEmpty()
                || email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("아이디와 이메일을 모두 입력해주세요.");
        }

        User user = userDao.findByLoginIdAndEmail(loginId.trim(), email.trim())
                .orElseThrow(() -> new IllegalArgumentException("일치하는 회원 정보가 없습니다."));

        if (newPassword == null || !PW_PATTERN.matcher(newPassword).matches()) {
            throw new IllegalArgumentException("비밀번호는 영문+숫자+특수문자(!@#$%) 조합 8~16자여야 합니다.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userDao.save(user);
    }

    // 업로드된 프로필 사진을 서버 디스크에 저장하고, 브라우저가 접근할 URL 경로를 반환
    private String saveProfileImage(Long userId, MultipartFile file) {
        try {
            String original = file.getOriginalFilename();
            String ext = (original != null && original.contains("."))
                    ? original.substring(original.lastIndexOf("."))
                    : "";

            String filename = userId + "_" + System.currentTimeMillis() + ext;

            Path savePath = Paths.get(uploadDir, filename);
            Files.createDirectories(savePath.getParent());
            file.transferTo(savePath);

            return baseUrl + uploadUrlPrefix + "/" + filename;
        } catch (IOException e) {
            throw new IllegalArgumentException("프로필 사진 저장에 실패했습니다.");
        }
    }

    // 프로필 사진 파일을 디스크에서 삭제 (탈퇴 시 사용, 실패해도 탈퇴 자체를 막지 않음)
    private void deleteProfileImageFile(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return;
        try {
            String filename = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
            Files.deleteIfExists(Paths.get(uploadDir, filename));
        } catch (IOException ignored) {
        }
    }

    // 회원 탈퇴 - 하드 삭제로 전환하면서, 작성한 게시물(+S3 사진)과
    // 체중기록까지 함께 완전히 삭제한 뒤 마지막으로 회원 행 자체를 삭제 (FK 제약 위반 방지)
    @Transactional
    public void withdraw(Long userId) {
        User user = userDao.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 1) 작성한 게시물에 달린 사진을 S3에서 먼저 제거
        List<Write> writes = writeDao.findByUserIdOrderByCreatedAtDesc(userId);
        for (Write write : writes) {
            for (WriteImage img : write.getImages()) {
                s3Uploader.delete(img.getImageUrl());
            }
        }
        // cascade=ALL, orphanRemoval=true 설정으로 write_images row들도 함께 삭제됨
        writeDao.deleteAll(writes);

        // 2) 체중 기록 삭제
        List<Stat> stats = statDao.findByUserIdOrderByDateAsc(userId);
        statDao.deleteAll(stats);

        // 3) 프로필 사진 파일 삭제 (로컬 디스크)
        deleteProfileImageFile(user.getProfileImg());

        // 4) 마지막으로 회원 행 자체를 완전히 삭제
        userDao.delete(user);
    }
}