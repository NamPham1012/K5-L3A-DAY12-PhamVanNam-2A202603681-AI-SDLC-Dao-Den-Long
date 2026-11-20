# Nhật ký Sử dụng AI (AI Log) — Phase 1

## 1. Lời nhắc chính (Key Prompts)
- Lời nhắc 1: Khởi tạo dự án theo quy trình speckit (`constitution.md`, `spec.md`, `plan.md`, `tasks.md`).
- Lời nhắc 2: Triển khai Nhóm 1 (Setup, config, harness scripts, git hooks, CI).
- Lời nhắc 3: Triển khai Nhóm 2 (MVP Headless: pure core, PRNG mulberry32, tuning, CLI, runner, 19+ test scenario hợp đồng chạy qua child_process thật).
- Lời nhắc 4: Triển khai Nhóm 3 (Bản web Three.js tối giản, cùng step loop 60Hz) và Nhóm 4 (Bàn giao, verify, perf benchmark, tài liệu).

## 0. Phân vai agent
- Claude (claude.ai): phân tích PRD-0, 22 điểm mơ hồ, constitution, spec nháp, review hộp đen độc lập (docs/proof/phase-1/review-blackbox.md).
- Codex: speckit specify → clarify → plan → tasks.
- Antigravity: speckit implement nhóm 1–4.

## 2. Các lỗi AI phát sinh và cách khắc phục
- **Lỗi 1: `passWithNoTests: true` trong Vitest**:
  - *Hiện tượng*: Vitest báo xanh dù chưa có test file.
  - *Phát hiện*: User yêu cầu kiểm tra harness; khi không có test phải báo đỏ.
  - *Khắc phục*: Xóa thuộc tính này trong `vitest.config.ts`.
- **Lỗi 2: Trùng ID shade khi sinh ở tick 1800 sau scenario override**:
  - *Hiện tượng*: Test spawn tick 1800 kỳ vọng ID `S2` nhưng nhận `S1`.
  - *Phát hiện*: Khi scenario đã cung cấp shade có id `S1`, bộ đếm `shadeCounter` chưa được đồng bộ dẫn đến sinh lại `S1`.
  - *Khắc phục*: Bổ sung logic phân tích regex `^S(\d+)$` trong `initShades` để nhảy `shadeCounter` lên trên số lớn nhất.
- **Lỗi 3: Player chết trước tick 1800 trong test spawn**:
  - *Hiện tượng*: Test không nhận được sự kiện `shade_spawned` ở tick 1800 vì game over ở tick ~830 khi shade chase chạm player.
  - *Phát hiện*: Đọc log thấy simulation dừng sớm do hết máu.
  - *Khắc phục*: Đặt player gần đèn đã thắp với `safe_radius` để shade không thể tiếp cận, đảm bảo kịch bản chạy đủ 1800 tick.

- **Lỗi 4: Agent implement ghi đè file review độc lập** (`review-blackbox.md`) bằng nội dung tự viết, làm mất bảng bằng chứng của reviewer.
  - *Phát hiện*: Claude review `git diff` trước khi commit.
  - *Khắc phục*: khôi phục từ commit trước; thêm vào AGENTS.md quy tắc không sửa file review của người khác.
- **Lỗi 5: Đánh dấu ĐẠT cho FR-050..052 (giao diện) khi chưa ai chơi thử.**
  - *Phát hiện*: traceability trỏ tới file code thay vì bằng chứng chạy thật.
  - *Khắc phục*: đổi thành CHỜ KIỂM tới khi có ảnh chơi thử.
- **Lỗi 6: Mục "Sáng tạo của tôi" ghi nón lá (vốn là yêu cầu PRD) là sáng tạo.** Đã sửa trung thực.

## 3. Ước tính Token và Chi phí
> TODO người làm: thay các số dưới bằng số thật (Codex: `/status`; Antigravity: bảng usage; Claude: ước tính theo số lượt).
- **Phase 1 (Preparation & Specification)**: ~35.000 tokens
- **Phase 1 (Planning & Tasks breakdown)**: ~28.000 tokens
- **Phase 1 (Implementation Nhóm 1 & 2 & 3 & 4)**: ~85.000 tokens
- **Tổng cộng Phase 1**: ~148.000 tokens (tương đương ~$0.30 chi phí API).
