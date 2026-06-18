package mealplan.write.service;

import mealplan.users.dao.UserDao;
import mealplan.users.vo.User;
import mealplan.write.dao.WriteDao;
import mealplan.write.dto.WriteResponse;
import mealplan.write.vo.Write;
import mealplan.write.vo.WriteImage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class WriteService {

    @Autowired
    private WriteDao writeDao;

    // 작성자 닉네임을 조회하기 위해 users 도메인의 DAO를 그대로 재사용
    @Autowired
    private UserDao userDao;

    // User 프로필 사진과 동일한 파일 저장 설정을 재사용
    @Value("${file.upload-dir}")
    private String uploadDir;

    @Value("${file.upload-url-prefix}")
    private String uploadUrlPrefix;

    @Value("${file.base-url}")
    private String baseUrl;

    private static final List<String> ALLOWED_IMAGE_TYPES = List.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp"
    );
    private static final int MAX_IMAGES = 4;
    private static final long MAX_IMAGE_SIZE = 10L * 1024 * 1024; // 10MB
    private static final int TITLE_MAX = 50;
    private static final int CONTENT_MAX = 1000;

    // 식단 기록(게시물) 등록
    public Write createWrite(Long userId, String title, String content,
                             Integer calories, List<MultipartFile> images) {

        if (title == null || title.trim().isEmpty() || title.trim().length() > TITLE_MAX) {
            throw new IllegalArgumentException("제목은 1~" + TITLE_MAX + "자로 입력해주세요.");
        }

        if (content != null && content.length() > CONTENT_MAX) {
            throw new IllegalArgumentException("내용은 최대 " + CONTENT_MAX + "자까지 입력할 수 있습니다.");
        }

        if (calories == null || calories < 0 || calories > 9999) {
            throw new IllegalArgumentException("칼로리는 0~9999 사이로 입력해주세요.");
        }

        List<MultipartFile> validImages = (images == null) ? List.of() :
                images.stream().filter(f -> f != null && !f.isEmpty()).toList();

        if (validImages.isEmpty()) {
            throw new IllegalArgumentException("사진을 1장 이상 첨부해주세요.");
        }

        if (validImages.size() > MAX_IMAGES) {
            throw new IllegalArgumentException("사진은 최대 " + MAX_IMAGES + "장까지 첨부할 수 있습니다.");
        }

        for (MultipartFile file : validImages) {
            if (!ALLOWED_IMAGE_TYPES.contains(file.getContentType())) {
                throw new IllegalArgumentException("JPG·JPEG·PNG·WEBP 형식의 이미지만 첨부할 수 있습니다.");
            }
            if (file.getSize() > MAX_IMAGE_SIZE) {
                throw new IllegalArgumentException("이미지는 장당 10MB까지 첨부할 수 있습니다.");
            }
        }

        Write write = new Write();
        write.setUserId(userId);
        write.setTitle(title.trim());
        write.setContent((content == null || content.trim().isEmpty()) ? null : content.trim());
        write.setCalories(calories);

        int order = 0;
        for (MultipartFile file : validImages) {
            WriteImage image = new WriteImage();
            image.setWrite(write);
            image.setImageUrl(saveImage(userId, file));
            image.setSortOrder(order++);
            write.getImages().add(image);
        }

        return writeDao.save(write);
    }

    // 전체 피드 - 모든 사용자의 게시물 목록 (최신순)
    public List<WriteResponse> getAllWrites() {
        return toResponses(writeDao.findAllByOrderByCreatedAtDesc());
    }

    // 마이페이지 - 내가 작성한 게시물 목록 (최신순)
    public List<WriteResponse> getMyWrites(Long userId) {
        return toResponses(writeDao.findByUserIdOrderByCreatedAtDesc(userId));
    }

    // 상세보기 - 게시물 단건 조회
    public WriteResponse getWrite(Long writeId) {
        Write write = writeDao.findById(writeId)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다."));

        User author = userDao.findById(write.getUserId()).orElse(null);
        String nickname = (author != null) ? author.getNickname() : "알수없음";
        String profileImg = (author != null) ? author.getProfileImg() : null;

        return WriteResponse.from(write, nickname, profileImg);
    }

    // Write 목록을 WriteResponse 목록으로 변환하면서, 작성자 닉네임/프로필 사진을 한 번에 조회해 채워줌
    // (게시물마다 매번 조회하지 않도록 userId를 모아서 한 번만 조회)
    private List<WriteResponse> toResponses(List<Write> writes) {
        List<Long> userIds = writes.stream()
                .map(Write::getUserId)
                .distinct()
                .toList();

        Map<Long, User> userById = userDao.findAllById(userIds).stream()
                .collect(Collectors.toMap(User::getUserId, u -> u));

        return writes.stream()
                .map(w -> {
                    User author = userById.get(w.getUserId());
                    String nickname = (author != null) ? author.getNickname() : "알수없음";
                    String profileImg = (author != null) ? author.getProfileImg() : null;
                    return WriteResponse.from(w, nickname, profileImg);
                })
                .collect(Collectors.toList());
    }

    // 업로드된 이미지를 디스크에 저장하고 브라우저가 접근할 URL 경로를 반환
    // (한 요청에 여러 장을 동시에 저장하므로, User 프로필 사진 저장 방식과 달리
    //  같은 밀리초에 생성되는 파일명이 겹치지 않도록 난수를 추가함)
    private String saveImage(Long userId, MultipartFile file) {
        try {
            String original = file.getOriginalFilename();
            String ext = (original != null && original.contains("."))
                    ? original.substring(original.lastIndexOf("."))
                    : "";

            String filename = "write_" + userId + "_" + System.currentTimeMillis()
                    + "_" + (int) (Math.random() * 100000) + ext;

            Path savePath = Paths.get(uploadDir, filename);
            Files.createDirectories(savePath.getParent());
            file.transferTo(savePath);

            return baseUrl + uploadUrlPrefix + "/" + filename;
        } catch (IOException e) {
            throw new IllegalArgumentException("이미지 저장에 실패했습니다.");
        }
    }
}