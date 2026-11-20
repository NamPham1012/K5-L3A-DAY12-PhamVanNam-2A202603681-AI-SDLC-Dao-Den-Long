# Ma trận Truy vết Yêu cầu (Traceability Matrix) — Phase 1

Báo cáo đánh giá độc lập: xem chi tiết tại [review-blackbox.md](phase-1/review-blackbox.md).

| Mã FR | Yêu cầu tóm tắt | Cách kiểm chứng | File kiểm chứng / Bằng chứng | Kết quả |
|---|---|---|---|---|
| **FR-001** | Đảo tròn R=40m, kẹp mép | Unit & Contract test | `tests/contract/cases/FR-040-idle.test.ts` | **ĐẠT** |
| **FR-002** | 5 đèn L1..L5 trên vòng R=25m | Unit & Snapshot test | `tests/unit/world.test.ts` | **ĐẠT** |
| **FR-003** | 50 đom đóm, nhặt, nạp, sinh bù | Contract CLI test | `tests/contract/cases/FR-003-*.test.ts` | **ĐẠT** |
| **FR-004** | 2 shade ban đầu, sinh tick 1800 | Contract CLI test | `tests/contract/cases/FR-004-spawn.test.ts` | **ĐẠT** |
| **FR-010** | Thứ tự tick 1..10, event k+1 | Contract CLI test | `tests/contract/cases/FR-010-*.test.ts` | **ĐẠT** |
| **FR-011** | Di chuyển theo yaw, vận tốc 6m/s | Contract test | `tests/unit/parsers.test.ts`, CLI tests | **ĐẠT** |
| **FR-020** | 3 ngọn lửa máu | Scenario & Snapshot | `tests/unit/world.test.ts` | **ĐẠT** |
| **FR-021** | Cách tính điểm & thưởng thắng | Contract CLI test | `tests/contract/cases/FR-010-all-lit.test.ts` | **ĐẠT** |
| **FR-030** | Bóng Mực chase, safe_radius đèn | Contract CLI test | `tests/contract/cases/FR-030-safe-radius.test.ts` | **ĐẠT** |
| **FR-031** | Trúng đòn mất lửa, rơi đom đóm, bất tử | Contract CLI test | `tests/contract/cases/FR-031-hit-invuln.test.ts` | **ĐẠT** |
| **FR-032** | Đom đóm rơi vòng 3m quanh người | Contract CLI test | `tests/contract/cases/FR-032-drop.test.ts` | **ĐẠT** |
| **FR-040** | CLI cú pháp contract, tick 0..end | Contract CLI test | `tests/contract/cases/FR-040-*.test.ts` | **ĐẠT** |
| **FR-041** | Sự kiện đứng trước snapshot cùng tick | Contract CLI test | `tests/contract/cases/FR-003-pickup-deposit.test.ts` | **ĐẠT** |
| **FR-042** | Định dạng snapshot JSONL đầy đủ | Contract CLI test | `tests/contract/cases/FR-040-idle.test.ts` | **ĐẠT** |
| **FR-043** | Dựng scenario không phát event/điểm | Contract CLI test | `tests/contract/cases/FR-010-all-lit.test.ts` | **ĐẠT** |
| **FR-044** | Input timeline, validate, lỗi mã 2 | Contract CLI test | `tests/contract/cases/FR-044-invalid-input.test.ts` | **ĐẠT** |
| **FR-045** | Sáng tạo tắt ở headless | Code review | `src/headless/cli.ts` (lõi thuần) | **ĐẠT** |
| **FR-046** | `fall_enabled = false` không có fall hit | Code & Tuning | `tests/contract/cases/FR-061-tuning.test.ts` | **ĐẠT** |
| **FR-050** | Giao diện 3D, camera bám sau, WASD, E, Q, R | Web build & play | `src/web/`, `tests/contract/cases/FR-010-ui-win.test.ts` | **CHỜ KIỂM** (chơi thử + ảnh trong docs/proof/phase-1/) |
| **FR-051** | HUD đầy đủ lửa, carried, đèn, time, điểm | Web render | `src/web/hud.ts` | **CHỜ KIỂM** (chơi thử + ảnh trong docs/proof/phase-1/) |
| **FR-052** | Mây nón lá treo đèn, shade tím, đèn vàng | Web 3D models | `src/web/characters.ts` | **CHỜ KIỂM** (chơi thử + ảnh trong docs/proof/phase-1/) |
| **FR-060** | README đầy đủ ≤ 3 lệnh, điều khiển | Tài liệu repo | `README.md` | **ĐẠT** |
| **FR-061** | `npm test` 1 lệnh kiểm chứng | Harness script | `package.json`, `docs/proof/phase-1/test.log` | **ĐẠT** |
| **FR-062** | Bằng chứng kiểm thử trong docs/proof/ | Verify runner | `docs/proof/phase-1/` | **ĐẠT** |
| **FR-063** | Harness AGENTS.md, skill, hook, CI | Repo root | `AGENTS.md`, `.githooks/`, `.github/` | **ĐẠT** |
| **FR-064** | Ghi chép nhật ký, giả định, LICENSE | Tài liệu repo | `docs/notes/`, `LICENSE`, `CREDITS.md` | **ĐẠT** |
