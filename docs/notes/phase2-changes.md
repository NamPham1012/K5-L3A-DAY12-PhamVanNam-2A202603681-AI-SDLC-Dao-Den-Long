# Thay đổi Phase 2 (Ticket-02 & Contract v1.1) so với Phase 1

## 1. Bảng đối chiếu luật & số liệu chuẩn (Phase 1 → Phase 2)

| Hạng mục | Phase 1 (v1.0) | Phase 2 (Ticket-02 / v1.1) | Lý do thay đổi |
|---|---|---|---|
| `contract_version` | `"1.0"` | `"1.1"` | Chuẩn hóa Contract v1.1 (Ticket-02 Phần 4) |
| `pickup_radius` | `1.5` (XZ) | `1.0` (XZ) + chênh cao `≤ 1.5` | Số liệu chuẩn Ticket-02 Phần 1 |
| `interact_radius` | `3.0` | `2.0` | Số liệu chuẩn Ticket-02 Phần 1 |
| `lantern_cost` | `8` | `10` | Số liệu chuẩn Ticket-02 Phần 1 |
| `pulse_cost` / `pulse_radius` / `pulse_cooldown_s` | `2` / `6.0` (XZ) / `2.0` s | `3` / `5.0` (3D từ `chân + 0.8`) / `3.0` s (180 tick) | Số liệu chuẩn Ticket-02 Phần 1 |
| `pulse_stun_s` / `pulse_push_m` | `3.0` s, đẩy tức thì `4.0` m | `2.0` s (120 tick), đẩy `4.0` m trải đều 15 tick đầu | Số liệu chuẩn Ticket-02 Phần 1 |
| `shade_speed` | `3.5` m/s | `4.0` m/s (Đêm 3: `4.5` m/s) | Số liệu chuẩn Ticket-02 Phần 1 |
| `fall_enabled` | `false` (kẹp tường r=40) | `true` (`Y < -10`, -1 lửa, mất hết đom đóm, chờ 60 tick hồi sinh, bất tử 90 tick) | Số liệu chuẩn Ticket-02 Phần 1 |
| Lướt (`dash`) | Chưa có | `14.0` m/s, `0.2` s (12 tick), cooldown `1.5` s (90 tick) | Tính năng mới Ticket-02 |
| Nhảy (`jump`) | `vy=5.0`, `g=-9.8` | `vy=7.0`, `g=-20.0`, chỉ nhảy khi `grounded` | Số liệu chuẩn Ticket-02 Phần 1 |
| Điểm `per_mote` | `+10` khi **nhặt** | `+10` khi **nạp** vào đèn | Chuẩn hóa điểm Ticket-02 Phần 1 |
| Điểm `per_stun` | `+25` | `+5` mỗi Bóng Mực trúng Tỏa Sáng (kể cả đang choáng) | Chuẩn hóa điểm Ticket-02 Phần 1 |
| Đom đóm ngẫu nhiên | 50 ngẫu nhiên, bù mỗi 120 tick | 20 trên 24 điểm sinh cố định (Đêm 1), trần 30, bù 1 con mỗi 240 tick | Chuẩn hóa Ticket-02 Phần 1 & 2 |
| Đom đóm rơi | Vòng 3m, vĩnh viễn | Vành 1.5–2.5 m, `kind: "dropped"`, TTL `480` tick, nhặt từ tick sau | Chuẩn hóa Ticket-02 Phần 1 |
| Bóng Mực | 2 lúc dựng, +1 mỗi 1800 tick, state `chase`/`stunned` | 2 tại tick 300, +1 mỗi 480 tick (Đêm 1), max 6; 5 state: `spawning`, `wander`, `chase`, `recoil`, `stunned`; phát hiện 12m / bỏ đuổi 18m; recoil 2m / 60 tick | Chuẩn hóa Ticket-02 Phần 1 & 4 |
| Đèn L1..L5 Đêm 1 | Công thức góc 72° làm tròn 3 chữ số | Đúng tọa độ Ticket-02: `(0,0,25)`, `(23.8,0,7.7)`, `(14.7,0,-20.2)`, `(-14.7,0,-20.2)`, `(-23.8,0,7.7)` | Bản đồ chuẩn Ticket-02 Phần 2 |
| Ưu tiên thắng/thua | `won` > `no_flames` > `dawn` | `no_flames` > `won/all_lit` > `dawn` | Luật kết thúc Ticket-02 Phần 1 |
| Thứ tự xử lý tick | 10 bước FR-010 | 12 bước bắt buộc của Ticket-02 | Ticket-02 Phần 1 |
| Sự kiện & Snapshot | v1.0 | v1.1: thêm `night_start {night}` tick 0, `dash`, `paused`, `resumed`, `night`, `wind`, `player.{vel,grounded,invuln,dash_cd_s,pulse_cd_s,charm_s}`, mảng `motes`, `drifters`, `charms` | Contract v1.1 |

## 2. Xung đột dấu góc FR2-030 (đã chốt)
- Ticket-02 ghi "góc đo từ trục +X, ngược chiều kim đồng hồ khi nhìn từ trên xuống", nhưng đồng thời trong Đêm 3 quy định tầng 1 ở `z > 0`, điểm sinh đom đóm tầng 1 ở `20°..160°` và hai dốc lên tầng 1 ở `30°` và `150°`.
- Để `sin(α) > 0` tương ứng với `z > 0` khớp hình học Đêm 3, hệ tọa độ điểm sinh được chốt là **`(r · cos α, 0, r · sin α)`** (xác nhận trong `specs/002-phase2-three-nights/spec.md` FR2-030).

## 3. Danh sách test Phase 1 cần cập nhật kỳ vọng (không xoá)
Mọi test Phase 1 được giữ nguyên file; các test chịu ảnh hưởng bởi luật mới sẽ được cập nhật kỳ vọng tại T014 và ghi chi tiết dưới đây:

1. `tests/contract/cases/FR-061-tuning.test.ts`: cập nhật kiểm tra `contract_version: "1.1"` (thay vì `"1.0"`) và đối chiếu đầy đủ `TUNING` v1.1.
2. `tests/unit/world.test.ts`: cập nhật số lượng mặc định Đêm 1: 20 đom đóm ngẫu nhiên (thay vì 50), 0 shade lúc tick 0 (thay vì 2), tọa độ đèn L2–L5 theo Ticket-02, trường mới của snapshot v1.1.
3. `tests/contract/runner.test.ts`: cập nhật `--night 2` thành hợp lệ (test lỗi dùng `--night 4`); cập nhật `lines[0]` là event `night_start` tick 0 trước snapshot tick 0.
4. `tests/contract/cases/FR-003-pickup-deposit.test.ts`: cập nhật điểm số: `per_mote` cộng khi **nạp** (+10 cho 1 đom đóm nạp + 100 thắp đèn = 110; trùng tổng 110 nhưng kiểm tra thêm sự kiện `night_start` và `lantern_cost = 10`).
5. `tests/contract/cases/FR-003-replenish.test.ts`: luật mới sinh bù đom đóm mỗi **240 tick** (thay vì 120 tick) khi `random` motes < 30. Cập nhật kiểm tra mốc tick 239 và 240.
6. `tests/contract/cases/FR-004-spawn.test.ts`: luật mới Đêm 1 có **0 shade lúc tick 0**, sinh **2 shade tại tick 300** (`S1`, `S2`) và +1 mỗi **480 tick** (tick 780, ...), thay vì 2 lúc dựng và tick 1800.
7. `tests/contract/cases/FR-030-safe-radius.test.ts`: shade trong vùng an toàn khi đèn đã thắp bị đẩy dần ra mép 6m trong tối đa **30 tick** (thay vì tức thì trong 1 tick); kiểm tra sau 30 tick khoảng cách ≥ 6m và không gây sát thương trong lúc bị đẩy.
8. `tests/contract/cases/FR-031-hit-invuln.test.ts`: shade trong scenario cần `state: "chase"` (hoặc khoảng cách ≤ 12m để chuyển chase), và khi trúng đòn shade chuyển `recoil` 60 tick; bất tử 90 tick vẫn giữ nguyên.
9. `tests/contract/cases/FR-010-pulse-enough.test.ts`: cập nhật `pulse_cost = 3`, `per_stun = 5`, shade đẩy dần trong 15 tick đầu.
10. `tests/contract/cases/FR-010-pulse-insufficient.test.ts`: cập nhật `carried = 2 < pulse_cost (3)`.
11. `tests/contract/cases/FR-010-pulse-cooldown.test.ts`: cập nhật `pulse_cost = 3` (trừ 3 còn 7) và `pulse_cooldown_s = 3.0` (180 tick).
12. `tests/contract/cases/FR-010-all-lit.test.ts`: cập nhật `lines[0]` là `night_start`, snapshot tick 0 ở `lines[1]`.
13. `tests/contract/cases/FR-010-end-priority.test.ts`: luật mới ưu tiên **`no_flames` > `won/all_lit` > `dawn`**! Khi hết lửa và thắp đèn cuối cùng tick, kết quả phải là `lost / no_flames` (thay vì `won / all_lit` ở Phase 1).
14. `tests/contract/cases/FR-010-dawn.test.ts`: với bước 2 giảm thời gian trước, `time_left_s: 1/60` vẫn về 0 ở tick 1 và thua `dawn`.
15. `tests/contract/cases/FR-010-ui-win.test.ts`: tương thích v1.1 (`night_start` + `game_over won all_lit`).
