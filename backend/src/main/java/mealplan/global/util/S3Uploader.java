package mealplan.global.util;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;

@Component
public class S3Uploader {

    @Value("${cloud.aws.credentials.access-key}")
    private String accessKey;

    @Value("${cloud.aws.credentials.secret-key}")
    private String secretKey;

    @Value("${cloud.aws.region.static}")
    private String region;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    private S3Client s3Client;

    @PostConstruct
    public void init() {
        s3Client = S3Client.builder()
                .region(Region.of(region))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)))
                .build();
    }

    // 파일을 S3에 업로드하고, 브라우저에서 바로 접근 가능한 공개 URL을 반환
    // keyPrefix: 파일명 앞에 붙일 구분자 (예: "write_3" -> 사용자 3번이 작성한 write 이미지)
    public String upload(MultipartFile file, String keyPrefix) {
        try {
            String original = file.getOriginalFilename();
            String ext = (original != null && original.contains("."))
                    ? original.substring(original.lastIndexOf("."))
                    : "";

            String key = keyPrefix + "_" + System.currentTimeMillis()
                    + "_" + (int) (Math.random() * 100000) + ext;

            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(request,
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
        } catch (IOException e) {
            throw new IllegalArgumentException("이미지 저장에 실패했습니다.");
        }
    }

    // 이미지 URL에서 key를 추출해 S3에서 삭제 (게시물 수정/삭제 시 사용)
    // 파일이 이미 없거나 삭제에 실패해도 게시물 수정/삭제 자체를 막지는 않음
    public void delete(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return;
        try {
            int idx = imageUrl.indexOf(".com/");
            if (idx == -1) return;
            String key = imageUrl.substring(idx + 5);

            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build());
        } catch (Exception ignored) {
        }
    }
}