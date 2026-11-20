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

---

# Nhật ký Sử dụng AI (AI Log) — Phase 2 (Ba hòn đảo · Contract v1.1)

## 1. Phân vai agent Phase 2
- **Claude (claude.ai)**: phân tích Ticket-02, soạn bản nháp đặc tả Phase 2 (`docs/spec-draft-phase2.md`), và thực hiện **review hộp đen độc lập** sau từng nhóm tại `docs/proof/phase-2/review-blackbox-A.md` và `docs/proof/phase-2/review-blackbox-B.md` (chỉ đọc đặc tả + chạy CLI/JSONL, không sửa code).
- **Codex**: chạy luồng Spec-Kit (`speckit-specify → plan → tasks`) sinh bộ tài liệu `specs/002-phase2-three-nights/{spec,plan,tasks,data-model,contracts/changes-v1.1}.md`.
- **Antigravity**: triển khai mã nguồn và test contract chạy CLI thật theo `tasks.md` (Nhóm A, Nhóm B, Nhóm D) và sửa lỗi từ báo cáo review.

## 2. Lời nhắc chính Phase 2
- Nâng cấp bản web Phase 1 (sửa bug trái/phải theo hệ quy chiếu camera, trang trí Đảo Bến bằng PRNG riêng, kiểm chứng SHA-256 JSONL bất biến).
- Triển khai Nhóm A (Contract v1.1, số liệu chuẩn Ticket-02, thứ tự tick 12 bước, Đêm 1 chuẩn hóa, sửa kỳ vọng test Phase 1 kèm `phase2-changes.md`).
- Sửa lỗi tích phân nhảy từ `review-blackbox-A.md` và triển khai Nhóm B (Đêm 2, Đêm 3, gió, Gió Lạc, Bùa Gió, pause).
- Triển khai Nhóm D (cập nhật `AGENTS.md`, skill `verify-game`, `scripts/verify.mjs`, `traceability.md`, `ai-log.md`, `retro.md`).

## 3. Các lỗi AI phát sinh trong Phase 2 và cách phát hiện
- **Lỗi 1: Sai số tích phân nhảy Euler bán ẩn (`vy += g·dt; y += vy·dt`)**:
  - *Hiện tượng*: Ở Nhóm A, dùng Euler bán ẩn làm đỉnh nhảy tụt xuống `~1.196 m` và chạm đất lệch tick thay vì quỹ đạo giải tích đúng (`đỉnh ≈ 1.225 m` tại tick 21, chạm đất đúng tick 42).
  - *Phát hiện*: Reviewer độc lập (Claude) chạy kiểm tra hộp đen CLI trong `docs/proof/phase-2/review-blackbox-A.md` và đối chiếu công thức vật lý.
  - *Khắc phục*: Đổi `src/core/physics.ts` sang tích phân chính xác `y += vy·dt + 0.5·g·dt²`, rồi `vy += g·dt`, đồng thời siết chặt assertion trong `tests/contract/cases/FR2-004-jump-dash-fall.test.ts` kiểm tra đỉnh `1.225 m` (tick 21) và chạm đất đúng tick 42.
- **Lỗi 2: Test `FR-010-end-priority.test.ts` cũ vô tình pass nhầm dưới luật mới**:
  - *Hiện tượng*: Khi thắp đèn L1 tại `(0,0,0)` ở Bước 5, vùng an toàn 6m đẩy shade ra ở Bước 6 nên shade không gây hit ở Bước 9, làm test cũ vẫn ra `won` dù luật mới ưu tiên `no_flames > won`.
  - *Phát hiện*: Kiểm tra lại kịch bản khi rà hồi quy T014.
  - *Khắc phục*: Đổi kịch bản test sang tình huống player thực sự mất lửa cuối (rơi `Y < -10`) trong cùng tick 5 đèn đã sáng để kiểm chứng đúng ưu tiên `no_flames > won/all_lit` của Ticket-02.

## 4. Ước tính Token Phase 2 (tính đến hết Nhóm A, B, D)
> TODO người làm: cập nhật số liệu thực tế từ thống kê phiên Codex / Antigravity / Claude.
- **Spec-Kit & Review độc lập (Codex + Claude)**: ~55.000 tokens
- **Implementation Nhóm A + B + D + Web polish (Antigravity)**: ~110.000 tokens
- **Tổng ước tính Phase 2 (chưa gồm Nhóm C)**: ~165.000 tokens.

---

# Nhật ký AI — Phase 3

- Claude soạn spec và ADR-001 trực tiếp từ Ticket-03 trong thời gian Phase 3 khoảng 30 phút; agent implement triển khai và chạy test CLI.

## Lỗi spec do Claude, agent implement phát hiện

- Spec do Claude soạn có ví dụ acceptance #3 và #8 bỏ qua dầu hao ở bước 2 trước tương tác và xét bình minh.
- Agent implement phát hiện khi chạy test CLI: đèn ban đầu đầy đã hao 1/60 trước tương tác; điểm bình minh phải tính theo dầu sau hao. Spec được sửa lúc 17:10; test CLI và unit test chọn đèn được cập nhật theo thứ tự tick của Ticket-03. Không bỏ qua test.
