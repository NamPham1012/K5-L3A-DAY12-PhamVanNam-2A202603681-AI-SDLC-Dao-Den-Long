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

---

# Ma trận Truy vết Yêu cầu (Traceability Matrix) — Phase 2 (Ba hòn đảo · Contract v1.1)

Báo cáo đánh giá hộp đen độc lập:
- Nhóm A: [review-blackbox-A.md](phase-2/review-blackbox-A.md)
- Nhóm B: [review-blackbox-B.md](phase-2/review-blackbox-B.md)
- Log chạy thật & SHA-256 3 Đêm: [test.log](phase-2/test.log), [determinism-sha256.txt](phase-2/determinism-sha256.txt), [perf.md](phase-2/perf.md)

| Mã FR2 | Yêu cầu tóm tắt | Cách kiểm chứng | File kiểm chứng / Bằng chứng thật | Kết quả |
|---|---|---|---|---|
| **FR2-001** | Thứ tự tick đúng 12 bước Ticket-02 | Contract CLI test + Review A | `tests/contract/cases/FR2-*.test.ts`, `phase-2/review-blackbox-A.md` | **ĐẠT** |
| **FR2-002** | Pause/Resume (tick tăng, sim_tick & timer đứng) | Contract CLI test + Review B | `tests/contract/cases/FR2-002-pause.test.ts`, `phase-2/review-blackbox-B.md` | **ĐẠT** |
| **FR2-003** | Di chuyển 6.0 m/s (bùa 7.2), facing +Z | Contract CLI test | `tests/contract/cases/FR2-044-charm.test.ts` | **ĐẠT** |
| **FR2-004** | Nhảy vy=7, g=-20 (đỉnh 1.225m, chạm đất tick 42) | Contract CLI test + Review B | `tests/contract/cases/FR2-004-jump-dash-fall.test.ts`, `phase-2/review-blackbox-B.md` | **ĐẠT** |
| **FR2-005** | Lướt 14 m/s 12 tick, giữ Y, cd 90 tick | Contract CLI test | `tests/contract/cases/FR2-004-jump-dash-fall.test.ts` | **ĐẠT** |
| **FR2-006** | Rơi Y<-10 bỏ qua bất tử, chờ 60 tick hồi sinh + bất tử 90 | Contract CLI test | `tests/contract/cases/FR2-004-jump-dash-fall.test.ts` | **ĐẠT** |
| **FR2-010** | Nhặt XZ ≤ 1.0 & chênh cao ≤ 1.5, đầy 10 không nhặt | Contract CLI test | `tests/contract/cases/FR2-012-deposit-score.test.ts`, `FR-003-capacity.test.ts` | **ĐẠT** |
| **FR2-011** | 20 mote ban đầu trên điểm cố định, bù 240k, trần 30 | Contract CLI test | `tests/contract/cases/FR2-052-snapshot.test.ts`, `FR-003-replenish.test.ts` | **ĐẠT** |
| **FR2-012** | Nạp đèn cost 10, interact 2.0m, +10/mote nạp, +100 thắp | Contract CLI test | `tests/contract/cases/FR2-012-deposit-score.test.ts` | **ĐẠT** |
| **FR2-013** | Thưởng thắng `floor(time_left)*2 + 50*flames` | Contract CLI test | `tests/contract/cases/FR-010-all-lit.test.ts` | **ĐẠT** |
| **FR2-014** | Ưu tiên kết thúc `no_flames > won/all_lit > dawn` | Contract CLI test | `tests/contract/cases/FR-010-end-priority.test.ts` | **ĐẠT** |
| **FR2-020** | Shade sinh 2 lúc tick 300, +1 mỗi 480/420/360 tick | Contract CLI test | `tests/contract/cases/FR2-020-shades.test.ts`, `FR-004-spawn.test.ts` | **ĐẠT** |
| **FR2-021** | 5 trạng thái (`spawning/wander/chase/recoil/stunned`), 12m/18m | Contract CLI test | `tests/contract/cases/FR2-020-shades.test.ts` | **ĐẠT** |
| **FR2-022** | Chạm gây recoil 2m/60 tick, drop vành 1.5–2.5m TTL 480 | Contract CLI test | `tests/contract/cases/FR2-022-hit-drop.test.ts` | **ĐẠT** |
| **FR2-023** | Vùng an toàn 6m, đẩy shade trong tối đa 30 tick không hit | Contract CLI test | `tests/contract/cases/FR2-020-shades.test.ts`, `FR-030-safe-radius.test.ts` | **ĐẠT** |
| **FR2-024** | Pulse 3D từ chân+0.8, r=5m, 120 tick, đẩy 4m/15 tick, +5/con | Contract CLI test | `tests/contract/cases/FR2-024-pulse-score.test.ts` | **ĐẠT** |
| **FR2-030** | Bản đồ Đêm 1 chuẩn hóa (đèn, r12/r33/r37, góc cos/sin, rơi r40) | Contract CLI test | `tests/contract/cases/FR2-030-night1-map.test.ts` | **ĐẠT** |
| **FR2-031** | Bản đồ Đêm 2 (2 đảo, cầu tre, 2 bục nhảy, 6 đèn) | Contract CLI test + Review B | `tests/contract/cases/FR2-031-night2.test.ts`, `phase-2/review-blackbox-B.md` | **ĐẠT** |
| **FR2-032** | Bản đồ Đêm 3 (3 tầng, vách, dốc 30°/150°, bục, tháp r2, 7 đèn) | Contract CLI test + Review B | `tests/contract/cases/FR2-032-night3.test.ts`, `phase-2/review-blackbox-B.md` | **ĐẠT** |
| **FR2-033** | Gió Đêm 3 (1800k, 300 tick, đẩy 2 m/s, hướng PRNG) | Contract CLI test | `tests/contract/cases/FR2-033-wind.test.ts` | **ĐẠT** |
| **FR2-040..043** | Gió Lạc (spawn 1200k, idle/chase/flee/removed, cướp, pulse thả) | Contract CLI test + Review B | `tests/contract/cases/FR2-040-drifter.test.ts`, `FR2-043-drifter-pulse.test.ts` | **ĐẠT** |
| **FR2-044** | Bùa Gió (600 tick, 7.2 m/s, dash không cd, hồi 2700 tick) | Contract CLI test + Review B | `tests/contract/cases/FR2-044-charm.test.ts` | **ĐẠT** |
| **FR2-050..055** | Contract v1.1 (`game.contract.json`, `--night 1|2|3`, snapshot/scenario/event) | Contract CLI test + Verify | `tests/contract/cases/FR2-05*.test.ts`, `phase-2/determinism-sha256.txt` | **ĐẠT** |
| **FR2-056** | Headless 21.600 tick ≤ 30 giây | Benchmark chạy thật | `docs/proof/phase-2/perf.md` (~213 ms) | **ĐẠT** |
| **FR2-057** | Phần web/sáng tạo không đổi JSONL (so SHA-256) | Verify SHA-256 | `docs/proof/phase-2/determinism-sha256.txt` | **ĐẠT** |
| **FR2-060** | Web: Menu → giới thiệu → 3 Đêm → Bình Minh / tổng điểm | Chơi thử + clip | Chưa triển khai Nhóm C | **CHƯA ĐẠT** |
| **FR2-061** | Web: Pause menu (Esc/P) + Cài đặt lưu localStorage | Chơi thử + clip | Chưa triển khai Nhóm C | **CHƯA ĐẠT** |
| **FR2-062** | Web: Âm thanh WebAudio (nhạc nền + 10 hiệu ứng) | Chơi thử + clip có tiếng | Chưa triển khai Nhóm C | **CHƯA ĐẠT** |
| **FR2-063** | Web: HUD đầy đủ theo bố cục Ticket-02 (mm:ss đỏ, 10 ô, nhắc E, mũi tên) | Chơi thử + ảnh chụp | Chưa triển khai Nhóm C | **CHƯA ĐẠT** |
| **FR2-064** | Web: Bảng màu chuẩn ±10%/kênh + ambient `0.15 + 0.55 × tỉ lệ` | Đo màu + ảnh chụp | Chưa triển khai Nhóm C | **CHƯA ĐẠT** |
| **FR2-065** | Web: ≥ 30 FPS trung bình 60s ở 1280×720 | Đo bộ đếm FPS | Chưa triển khai Nhóm C (`docs/proof/phase-2/perf.md`) | **CHƯA ĐẠT** |

---

# Ma trận truy vết — Phase 3 (Contract v1.2)

Đánh giá hộp đen Nhóm A: [review-blackbox.md](phase-3/review-blackbox.md). Kết quả dưới đây chỉ phản ánh phạm vi mà báo cáo hoặc lần chạy test đã kiểm chứng; không suy rộng sang mọi trường hợp của từng FR.

| Mã FR3 | Phạm vi | Bằng chứng | Kết quả |
|---|---|---|---|
| FR3-001–005 | Hao dầu, tắt đèn, châm dầu và thắp lại | [Review hộp đen, mục 2–4](phase-3/review-blackbox.md); `tests/contract/cases/FR3-acceptance.test.ts`, `tests/unit/lanterns.test.ts` | Các kịch bản trong review **ĐẠT**; không khẳng định toàn bộ biên |
| FR3-010–015 | Wander tới đèn yếu, drain và vùng an toàn | [Review hộp đen, mục 5](phase-3/review-blackbox.md); `tests/contract/cases/FR3-acceptance.test.ts` | Kịch bản trong review **ĐẠT**; các chuyển trạng thái khác cần bằng chứng bổ sung |
| FR3-020–021, FR3-040 | Thắng/thua và điểm bình minh | [Review hộp đen, mục 6–8](phase-3/review-blackbox.md); `tests/contract/cases/FR3-acceptance.test.ts` | Các kịch bản trong review **ĐẠT** |
| FR3-030 | Sức chứa tăng khi thắp lại | [Review hộp đen, mục 4](phase-3/review-blackbox.md) | Kịch bản thắp lại **ĐẠT**; giới hạn tối đa cần bằng chứng bổ sung |
| FR3-050–053 | Contract v1.2, snapshot, scenario và event | [Review hộp đen, mục 1, 4–5, 9](phase-3/review-blackbox.md); `tests/contract/cases/FR3-acceptance.test.ts` | Các trường hợp trong review **ĐẠT**; toàn bộ contract chưa được chứng minh bởi các mục này |
| FR3-060 | Thanh dầu, nhấp nháy và ambient | Chưa có bằng chứng giao diện Phase 3 | **CHƯA ĐẠT** |
| FR3-061 | Bảng màu dễ phân biệt và phân biệt đèn không cần màu | Chưa có bằng chứng giao diện Phase 3 | **CHƯA ĐẠT** |
| FR3-062 | HUD carried/capacity và đèn sáng/ngưỡng thắng | Chưa có bằng chứng giao diện Phase 3 | **CHƯA ĐẠT** |

Các bảng Phase 1–2 phía trên lưu kết quả theo phase tương ứng; các luật bị Ticket-03 thay thế không còn mô tả hành vi hiện tại. Xem `docs/notes/phase3-changes.md`.
