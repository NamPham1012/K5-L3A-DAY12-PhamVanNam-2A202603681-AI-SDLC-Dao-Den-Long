# Implementation Plan: Phase 2 — Ba hòn đảo

**Branch**: `main` | **Date**: 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: `docs/ticket-02.md`, đặc tả Phase 2 và mã Phase 1 hiện có. Ticket-02 và Contract v1.1 thay luật v1.0 khi quy định khác.

## Summary

Giữ kiến trúc Phase 1: lõi TypeScript thuần dùng chung bởi web Three.js và headless Node. Chuẩn hóa số liệu, bản đồ, thứ tự tick và contract; thêm hai Đêm, vật lý, pause, Gió Lạc, Bùa Gió, luồng chơi và kiểm chứng hồi quy. Các giả định ★ trong spec là tạm thời, không đổi cho tới khi trợ giảng trả lời.

## Technical Context

**Language/Version**: TypeScript strict; Node ≥ 20. **Dependencies**: Three.js, Vite, esbuild, Vitest và mulberry32 đã có.

**Storage**: JSON scenario/inputs, JSONL; cài đặt âm lượng/độ nhạy lưu localStorage ở web. **Testing**: `npm test`, `npm run contract`, `npm run verify`; mỗi tính năng mới trong lõi có ít nhất một scenario headless, so byte hai lần, so `game.contract.json.tuning` với runtime.

**Target Platform**: Windows phát triển; macOS/Linux chạy web và headless; script npm đa nền tảng. **Type**: game web 3D và CLI.

**Performance Goals**: 21.600 tick headless ≤ 30 giây; web ≥ 30 FPS trung bình trong 60 giây tại 1280×720, lưu kết quả và cấu hình vào `docs/proof/phase-2/perf.md`.

**Constraints**: 60 tick mô phỏng/giây; pause tăng tick nhưng đóng băng sim_tick và mọi timer; core không DOM, Three.js, I/O, Date hay Math.random; không đổi output headless bởi sáng tạo; contract chính xác, kể cả thứ tự event/snapshot và lỗi.

**Scale/Scope**: 3 Đêm; 5/6/7 đèn; shade tối đa 6/8/10; tối đa 2 Gió Lạc hoạt động ở Đêm 2–3. Các số khác theo Ticket-02 và spec §3.

## Constitution Check

| Nguyên tắc | Trước nghiên cứu và sau thiết kế |
|---|---|
| I. Test Contract | Thiết kế theo v1.1 và luật Ticket-02 thay thế v1.0; hồi quy các yêu cầu cũ còn hiệu lực. Các giả định ★ tạm giữ, không được trình bày như xác nhận từ giảng viên. |
| II. Lõi thuần | Cùng `src/core/step.ts` cho CLI/web; bản đồ, vật lý và các trạng thái không nhập thư viện hiển thị. |
| III. Tất định | PRNG seed và counter thuộc world; thứ tự theo id, thời gian theo tick, serialize ổn định; so output byte. Pause phân biệt tick và sim_tick. |
| IV. Bằng chứng | Kế hoạch có scenario/JSONL cho từng tính năng lõi, ảnh/clip/log cho web. Yêu cầu mọi FR đều có JSONL của constitution không thể chứng minh riêng phần giao diện/âm thanh/tài liệu; xem Complexity Tracking. |
| V. Lõi trước sáng tạo | Contract và hồi quy trước đồ họa; sáng tạo tắt headless. |
| VI. Nguồn tham số | `src/core/tuning.ts` là nguồn gameplay; test đối chiếu mọi khóa contract v1.1. |

Các cổng trên là đánh giá thiết kế, không phải kết quả kiểm thử. Constitution còn mô tả v1.0 và khoảng cách XZ tổng quát; v1.1 quy định khác, đặc biệt pulse dùng 3D, nên áp dụng yêu cầu mới được chỉ định và ghi sai lệch ở dưới.

## Project Structure

### Documentation (this feature)

```text
specs/002-phase2-three-nights/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/changes-v1.1.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
src/core/
├── maps/{night1,night2,night3}.ts  # địa hình, va chạm, sinh, đèn, bục, start
├── physics.ts, drifters.ts, charms.ts, pause.ts
├── step.ts, tuning.ts, entities.ts, world.ts, rng.ts
└── motes.ts, lanterns.ts, shades.ts, pulse.ts, damage.ts
src/headless/                         # CLI, scenario/inputs, JSONL v1.1
src/web/                              # ba Đêm, UI, âm thanh, FPS
tests/unit/, tests/contract/cases/    # FR2 và hồi quy Phase 1
docs/notes/phase2-changes.md          # luật/test cũ và lý do thay
docs/proof/phase-2/                   # JSONL/log, ảnh/clip, perf.md
```

**Structure Decision**: `groundHeight(x,z,yHiện)` chọn mặt đỡ có thể tiếp cận từ độ cao hiện tại, không tự nâng người chơi xuyên vách; xử lý va chạm ngang vách/tháp và điểm không có mặt đất riêng, không nhầm với Y=0. Mỗi map cung cấp spawn, đèn, bục và start; core duy trì thứ tự ID và một nguồn PRNG. Kết quả web và CLI dùng cùng cấu trúc world và cùng `step()`.

**Điểm cần sửa trong mã hiện có**: `step.ts` Phase 1 khóa mép đảo, dùng luật nhảy cũ và ưu tiên thắng trước hết lửa; `world.ts` hiện chuẩn hóa độ cao scenario về mặt đất Phase 1. Khi nâng cấp phải thay các hành vi này theo Ticket-02, giữ tọa độ scenario hợp lệ ở các tầng và không áp lại độ cao Đêm 1 lên Đêm 2–3. Điểm cộng dồn ba Đêm thuộc luồng web; score headless là điểm của một Đêm.

**Trình tự**: (1) đối chiếu bảng thay đổi với tuning/test Phase 1 và ghi `docs/notes/phase2-changes.md`; (2) cập nhật tuning, model, contract v1.1, tick và pause; (3) map/vật lý, spawn, shade/pulse; (4) drifter/charm/gió; (5) chạy scenario và regression xanh; (6) web, menu, HUD, audio, đo FPS; (7) cập nhật harness, bằng chứng và đo hiệu năng. Test bị thay luật phải sửa kèm lý do, không xóa âm thầm.

## Complexity Tracking

| Violation / xung đột | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Constitution I và ràng buộc XZ nêu contract v1.0; Ticket-02 yêu cầu v1.1, pulse đo 3D | Yêu cầu phase mới và chỉ đạo người dùng thay các luật cũ; giữ v1.0 nguyên vẹn sẽ sai ticket. Ghi rõ sai lệch; chưa sửa constitution. | Dùng XZ cho pulse không đáp ứng Ticket-02. |
| Constitution IV đòi JSONL cho mỗi FR, gồm cả âm thanh/giao diện | JSONL không chứng minh màu, âm thanh hoặc bố cục; người dùng yêu cầu ảnh/clip, và âm thanh cần clip có tiếng. Ghi rõ sai lệch; chưa sửa constitution. | Chỉ dựa vào JSONL sẽ không chứng minh được trải nghiệm web. |

**Giới hạn còn lại**: DoD ticket ghi scenario headless cho mỗi tính năng mới, trong khi chỉ đạo yêu cầu scenario cho mỗi tính năng lõi và bằng chứng trực tiếp cho tính năng chỉ web. Kế hoạch giữ cả truy vết DoD lẫn giới hạn này; không tự tuyên bố đạt DoD nếu thiếu scenario tương ứng. Các giả định ★ chưa được xác nhận là rủi ro cho test ẩn.
