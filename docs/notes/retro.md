# Đánh giá Đợt triển khai (Retrospective) — Phase 1

## Điều làm tốt
1. **Tuân thủ triệt để Test Contract**:
   - Viết test contract chạy thực tế qua CLI subprocess `node dist/headless.js`, đọc output JSONL, không mock hàm lõi.
   - 100% test contract đều gắn mã FR rõ ràng và độc lập.
2. **Kiến trúc lõi thuần (Clean Architecture)**:
   - Thư mục `src/core/` hoàn toàn độc lập, không phụ thuộc DOM hay Three.js hay thư viện ngoài.
   - Tuyệt đối không dùng `Math.random` hoặc `Date` trong lõi; sử dụng PRNG Mulberry32 có seed.
3. **Hiệu năng xuất sắc**:
   - Chạy 18.000 bước headless chỉ mất ~90-150 ms, nhanh gấp hơn 10 lần ngưỡng yêu cầu (< 2s).
4. **Trải nghiệm tích hợp web**:
   - Web 3D tái sử dụng chính xác cùng một hàm `core.step()` với vòng lặp fixed timestep 1/60s.

## Điểm cần cải thiện cho Phase sau
1. **Chia nhỏ các file kiểm thử**: Tiếp tục duy trì mỗi case test một file riêng để dễ dàng debug và cô lập lỗi.
2. **Đồ họa và hiệu ứng**: Cải thiện thêm hiệu ứng sương mù, hiệu ứng hạt đom đóm phát sáng mượt mà hơn khi vào các phase tiếp theo.

---

# Đánh giá Đợt triển khai (Retrospective) — Phase 2 (Nhóm A, B, D)

## Điều làm tốt
1. **Quy trình phân vai rõ ràng (Spec → Implement → Blackbox Review độc lập)**:
   - Reviewer độc lập phát hiện sớm lỗi tích phân nhảy Euler bán ẩn trong `review-blackbox-A.md` trước khi mở rộng sang Đêm 2/3, giúp bục nhảy ở Đêm 2 và Đêm 3 đạt độ chính xác quỹ đạo ngay lần chạy đầu.
2. **Bảo toàn tính hồi quy và minh bạch thay đổi**:
   - Không xoá âm thầm bất kỳ test Phase 1 nào; toàn bộ 15 thay đổi kỳ vọng theo Ticket-02 được ghi rõ nguyên nhân tại `docs/notes/phase2-changes.md`.
   - Toàn bộ 42 file test (71 tests) chạy qua CLI thật (`spawnSync`) đều xanh 100%, SHA-256 trùng khớp trên cả 3 Đêm.
3. **Hiệu năng và kiến trúc lõi**:
   - 21.600 tick Đêm 3 hoàn thành chỉ trong ~213 ms (nhanh gấp >100 lần ngưỡng 30 giây).
   - Toàn bộ timer lõi chuyển sang số nguyên tick nên loại bỏ hoàn toàn sai số dấu phẩy động tích lũy và giúp `pause` đóng băng tuyệt đối `sim_tick`.

## Hạn chế & Việc còn lại
1. **Nhóm C (Web Phase 2) chưa triển khai**: Menu chuỗi 3 Đêm, Pause menu, cài đặt lưu `localStorage`, âm thanh WebAudio, HUD bố cục mới, bảng màu chuẩn và đo FPS ≥ 30 ở 1280×720 hiện đang ghi trung thực là **CHƯA ĐẠT** trong `docs/proof/traceability.md`.
2. **Giả định ★ chưa xác nhận**: Các điểm đánh dấu ★ trong `specs/002-phase2-three-nights/spec.md` (như thời lượng `spawning`, kiểu `invuln`, điểm xuất phát Đêm 3, `night_start` tick 0) cần đối chiếu nếu giảng viên công bố bản đính chính.
