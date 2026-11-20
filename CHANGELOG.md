# Changelog

## [phase-3] — 2026-11-20 — Contract v1.2 "Đèn cạn dầu"
### BREAKING
- `contract_version` 1.1 → **1.2**; `night{1,2,3}_duration_s` 300/330/360 → **240/270/300**.
- **Bỏ thắng sớm** `game_over.reason = "all_lit"`; thêm `dawn_survived` (thắng khi hết giờ với ≥ ceil(0.6·N) đèn sáng).
- **Điểm**: +10/đom đóm nạp → **+5**; thêm +40 thắp lại; Tỏa Sáng +15 nếu Bóng Mực đang `drain`; **bỏ thưởng thời gian**; thưởng bình minh mỗi đèn sáng +50 + floor(fuel).
- Đèn đã sáng **nhận đom đóm** (châm dầu, sự kiện `refuel`); đèn có thể **tắt** (`lantern_out`, `deposited` về 0).
- Vùng an toàn chỉ còn ở đèn fuel ≥ 30; Bóng Mực có trạng thái mới **`drain`**.
- Sức chứa không cố định 10: `capacity = min(20, 10 + 2·successful_lights)`.
### Added
- Snapshot: `lanterns[].fuel, ever_lit, relit_count`; `player.capacity`. Sự kiện `refuel`, `lantern_out`, `fuel_drain`; `lantern_lit.relight`.
- Scenario: `lanterns[].lit/fuel/ever_lit`, `player.successful_lights`, `shades[].target_lantern_id`.
- Tuning: `fuel_max, fuel_decay_per_s, fuel_per_mote, relight_cost, win_ratio, drain_per_s, low_fuel_threshold, capacity_max`.
- Web: thanh dầu, nhấp nháy khi < 30, màn Cài đặt + chế độ "Bảng màu dễ phân biệt".

## [phase-2] — Contract v1.1 "Ba hòn đảo"
- Số liệu chuẩn, 3 Đêm, lướt/nhảy/rơi, Bóng Mực 5 trạng thái, Gió Lạc, Bùa Gió, pause.

## [phase-1] — Contract v1.0
- Đêm 1, headless theo Test Contract v1.0.
