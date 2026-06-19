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
import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private static final int DAILY_WRITE_LIMIT = 3; // 하루 최대 작성 가능 게시물 수

    // 식단 기록(게시물) 등록
    public Write createWrite(Long userId, String title, String content,
                             Integer calories, List<MultipartFile> images) {

        // 하루 작성 횟수 제한 (자정 기준 자동 초기화 - LocalDate.now()가 매번 그 시점의 날짜를 기준으로 계산하므로
        // 별도 스케줄러/배치 없이도 자정이 지나면 자동으로 카운트가 0부터 다시 시작됨)
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime startOfTomorrow = startOfToday.plusDays(1);
        long todayCount = writeDao.countByUserIdAndCreatedAtBetween(userId, startOfToday, startOfTomorrow);

        if (todayCount >= DAILY_WRITE_LIMIT) {
            throw new IllegalArgumentException("하루 최대 " + DAILY_WRITE_LIMIT + "개까지만 작성할 수 있습니다.");
        }

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

    // 게시물 수정 (본인 게시물만 가능, 제목/내용/칼로리 + 사진 추가·삭제)
    // existingImageUrls: 그대로 유지할 기존 사진들의 URL (남길 순서대로)
    // newImages: 새로 첨부한 사진 파일들 (existingImageUrls 뒤에 이어 붙임)
    public WriteResponse updateWrite(Long userId, Long writeId, String title, String content,
                                     Integer calories, List<String> existingImageUrls,
                                     List<MultipartFile> newImages) {

        Write write = writeDao.findById(writeId)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다."));

        if (!write.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 게시물만 수정할 수 있습니다.");
        }

        if (title == null || title.trim().isEmpty() || title.trim().length() > TITLE_MAX) {
            throw new IllegalArgumentException("제목은 1~" + TITLE_MAX + "자로 입력해주세요.");
        }

        if (content != null && content.length() > CONTENT_MAX) {
            throw new IllegalArgumentException("내용은 최대 " + CONTENT_MAX + "자까지 입력할 수 있습니다.");
        }

        if (calories == null || calories < 0 || calories > 9999) {
            throw new IllegalArgumentException("칼로리는 0~9999 사이로 입력해주세요.");
        }

        List<String> keepUrls = (existingImageUrls == null) ? List.of() :
                existingImageUrls.stream().filter(u -> u != null && !u.isBlank()).toList();

        List<MultipartFile> validNewImages = (newImages == null) ? List.of() :
                newImages.stream().filter(f -> f != null && !f.isEmpty()).toList();

        int totalCount = keepUrls.size() + validNewImages.size();
        if (totalCount == 0) {
            throw new IllegalArgumentException("사진을 1장 이상 첨부해주세요.");
        }
        if (totalCount > MAX_IMAGES) {
            throw new IllegalArgumentException("사진은 최대 " + MAX_IMAGES + "장까지 첨부할 수 있습니다.");
        }

        for (MultipartFile file : validNewImages) {
            if (!ALLOWED_IMAGE_TYPES.contains(file.getContentType())) {
                throw new IllegalArgumentException("JPG·JPEG·PNG·WEBP 형식의 이미지만 첨부할 수 있습니다.");
            }
            if (file.getSize() > MAX_IMAGE_SIZE) {
                throw new IllegalArgumentException("이미지는 장당 10MB까지 첨부할 수 있습니다.");
            }
        }

        // 더 이상 유지하지 않는 기존 사진은 디스크에서도 함께 삭제
        for (WriteImage img : write.getImages()) {
            if (!keepUrls.contains(img.getImageUrl())) {
                deleteImageFile(img.getImageUrl());
            }
        }

        // 기존 목록을 비우고 "유지할 기존 사진 + 새로 올린 사진" 순서로 다시 구성
        // (orphanRemoval=true라서 비워진 만큼 기존 WriteImage row는 자동으로 삭제됨)
        write.getImages().clear();

        int order = 0;
        for (String url : keepUrls) {
            WriteImage img = new WriteImage();
            img.setWrite(write);
            img.setImageUrl(url);
            img.setSortOrder(order++);
            write.getImages().add(img);
        }
        for (MultipartFile file : validNewImages) {
            WriteImage img = new WriteImage();
            img.setWrite(write);
            img.setImageUrl(saveImage(userId, file));
            img.setSortOrder(order++);
            write.getImages().add(img);
        }

        write.setTitle(title.trim());
        write.setContent((content == null || content.trim().isEmpty()) ? null : content.trim());
        write.setCalories(calories);

        Write saved = writeDao.save(write);

        User author = userDao.findById(userId).orElse(null);
        String nickname = (author != null) ? author.getNickname() : "알수없음";
        String profileImg = (author != null) ? author.getProfileImg() : null;

        return WriteResponse.from(saved, nickname, profileImg);
    }

    // 게시물 삭제 (본인 게시물만 가능, 연결된 이미지 파일도 디스크에서 함께 제거)
    public void deleteWrite(Long userId, Long writeId) {
        Write write = writeDao.findById(writeId)
                .orElseThrow(() -> new IllegalArgumentException("게시물을 찾을 수 없습니다."));

        if (!write.getUserId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 게시물만 삭제할 수 있습니다.");
        }

        for (WriteImage img : write.getImages()) {
            deleteImageFile(img.getImageUrl());
        }

        // cascade=ALL, orphanRemoval=true 설정으로 WriteImage row들도 함께 삭제됨
        writeDao.delete(write);
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

    // 이미지 URL에서 실제 파일명을 추출해 디스크에서 삭제 (게시물 수정/삭제 시 사용)
    // 파일이 이미 없거나 삭제에 실패해도 게시물 수정/삭제 자체를 막지는 않음
    private void deleteImageFile(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return;
        try {
            String filename = imageUrl.substring(imageUrl.lastIndexOf("/") + 1);
            Files.deleteIfExists(Paths.get(uploadDir, filename));
        } catch (IOException ignored) {
        }
    }
}