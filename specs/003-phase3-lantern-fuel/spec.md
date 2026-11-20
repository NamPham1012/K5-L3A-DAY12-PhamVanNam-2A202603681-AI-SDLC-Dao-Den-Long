# Feature Specification: Phase 3 — Đèn cạn dầu (Ticket-03, Contract v1.2)

**Feature Branch**: `003-phase3-lantern-fuel` · **Created**: 2026-11-20 · **Status**: Ready (spec do Claude soạn trực tiếp từ ticket vì Phase 3 chỉ 30 phút; ghi trong ai-log)
**Input**: `docs/ticket-03.md` (bắt buộc chính xác). Phần không bị thay giữ nguyên theo `specs/002-phase2-three-nights/spec.md`.
**Quyết định thiết kế**: `docs/adr/ADR-001-lantern-fuel-dawn-win.md`. **Breaking changes**: `CHANGELOG.md`.

## Clarifications (Session 2026-11-20)
- Q: Lưu dầu thế nào để không sai số? → A: số nguyên đơn vị 1/60: `fuel_u` (100 dầu = 6000 u). Hao 1 u/tick; mỗi Bóng Mực drain 5 u/tick; mỗi đom đóm châm +600 u. Xuất `fuel = round(fuel_u/60, 1)`.
- Q: Bóng Mực `wander` di chuyển thế nào? → A (★, ticket nói "đi về đèn tắt gần nhất như trước"): wander đi về mục tiêu với tốc độ 2.0 m/s (½ tốc độ chase): mục tiêu = đèn sáng fuel < 30 gần nhất (hoà → id nhỏ), không có thì đèn tắt gần nhất, không có thì đứng yên. Dừng khi cách mục tiêu ≤ 2 m.
- Q: `fuel_drain` ghi khi nào? → A (★): mỗi Bóng Mực đang drain ghi 1 sự kiện mỗi 60 tick kể từ tick vào drain (tick vào + 60, +120…), `fuel` = dầu sau khi trừ ở tick đó.
- Q: `deposited` của đèn đang sáng? → A: = chi phí đã dùng để thắp (10 hoặc 5); tắt → 0.
- Q: Scenario đèn `lit:true` không có `ever_lit`? → A: `ever_lit = true`.

## Functional Requirements

### Dầu đèn (THAY luật "đèn sáng không nhận thêm đom đóm")
- **FR3-001** Thắp (lần đầu hoặc lại) → `fuel = 100`, `lit = true`, `ever_lit = true`. Lần đầu cần 10 đom đóm, thắp lại (ever_lit) cần 5 (`relight_cost`). Nạp từng phần vẫn được.
- **FR3-002** Bước 2 của tick: mỗi đèn sáng trừ 1 u + 5 u × số Bóng Mực đang drain đèn đó. Ngay sau bước 2: `fuel_u ≤ 0` → `lit=false`, `fuel=0`, `deposited=0`, sự kiện `lantern_out {lantern_id}`.
- **FR3-003** Châm dầu: interact ở đèn sáng chưa đầy: `used = min(carried, ceil((6000 − fuel_u)/600))`, `fuel_u = min(6000, fuel_u + 600·used)`, carried −= used, sự kiện `refuel {lantern_id, amount: used, fuel}`.
- **FR3-004** Chọn đèn khi interact: chỉ đèn nhận được (chưa sáng, hoặc sáng và fuel < 100) trong 2 m; gần nhất, hoà → id nhỏ. Đèn đầy dầu bị bỏ qua (không sự kiện, không điểm). carried = 0 → không gì.
- **FR3-005** `lantern_lit` thêm `relight: true|false`; `relit_count` +1 mỗi lần thắp lại.

### Bóng Mực hút dầu (THAY luật "không bao giờ vào vùng an toàn")
- **FR3-010** Vùng an toàn 6 m chỉ có ở đèn sáng có fuel ≥ 30 (đúng 30 vẫn còn).
- **FR3-011** Chỉ `wander` chọn đèn yếu (xem Clarifications). `chase` không đổi mục tiêu.
- **FR3-012** `wander` cách đèn mục tiêu (sáng, fuel < 30) ≤ 2 m XZ → `drain`: đứng yên, hút 5/s. Nhiều con cộng dồn.
- **FR3-013** Rời `drain`: → `chase` nếu Mây ≤ 6 m; → `stunned` nếu trúng Tỏa Sáng; → `wander` nếu đèn tắt, fuel ≥ 30 (sau châm), hoặc cách > 2 m. Hết choáng → `wander`.
- **FR3-014** Châm dầu làm fuel ≥ 30 khi có Bóng Mực trong 6 m → đẩy ra mép trong ≤ 30 tick, không gây sát thương lúc đó.
- **FR3-015** Scenario `shades[].target_lantern_id` đặt mục tiêu ban đầu.

### Thắng/thua (THAY "thắng ngay khi tất cả đèn sáng")
- **FR3-020** Thời gian 240 / 270 / 300 s. Không còn thắng sớm.
- **FR3-021** Xét sau mọi cập nhật của tick: hết lửa → `lost no_flames` (kể cả tick bình minh); hết giờ: số đèn sáng ≥ ceil(0.6·N) (3/5, 4/6, 5/7) → `won dawn_survived`, ngược lại `lost dawn`. `all_lit` bỏ.

### Sức chứa
- **FR3-030** `capacity = min(20, 10 + 2·successful_lights)`; successful_lights đếm thắp thành công trong Đêm (cả thắp lại; đèn đặt sẵn scenario không tính; scenario có thể đặt `player.successful_lights`). Reset mỗi Đêm. Nhặt dùng capacity.

### Điểm (THAY toàn bộ)
- **FR3-040** +5 mỗi đom đóm nạp (thắp mới, thắp lại, châm dầu); +100 thắp lần đầu; +40 thắp lại; Tỏa Sáng +5 mỗi Bóng Mực, +15 nếu ngay trước đó nó đang `drain`; khi thắng: mỗi đèn đang sáng +50 + floor(fuel), mỗi Ngọn Lửa +50. Bỏ thưởng thời gian. Tổng điểm game / chơi lại như Ticket-02.

### Contract v1.2
- **FR3-050** `contract_version "1.2"`; tuning thêm `fuel_max 100, fuel_decay_per_s 1.0, fuel_per_mote 10, relight_cost 5, win_ratio 0.6, drain_per_s 5, low_fuel_threshold 30, capacity_max 20`; `night1/2/3_duration_s = 240/270/300`; score keys cập nhật (per_mote 5, per_lantern 100, thêm per_relight 40, per_stun 5, per_stun_drain 15, per_second_left 0, per_flame_left 50, per_lit_lantern_dawn 50).
- **FR3-051** Snapshot: đèn thêm `fuel` (1 chữ số thập phân, tắt = 0), `ever_lit`, `relit_count`; player thêm `capacity`; shade state thêm `drain`.
- **FR3-052** Scenario: đèn `lit, fuel, ever_lit`; `player.successful_lights`; `shades[].target_lantern_id`; `lit:true` không có fuel → 100.
- **FR3-053** Sự kiện mới `refuel`, `lantern_out`, `fuel_drain {lantern_id, shade_id, fuel}`; `lantern_lit.relight`; `game_over.reason` thêm `dawn_survived`.

### Web
- **FR3-060** Thanh dầu trên đèn sáng; fuel < 30 → đèn và thanh nhấp nháy 1 Hz. Ambient giảm khi đèn tắt.
- **FR3-061** Màn Cài đặt (lưu localStorage): âm lượng, độ nhạy chuột, **Bảng màu dễ phân biệt**: viền + mắt Bóng Mực #7A3CFF → #00B3FF; cảnh báo UI #FF5A5F → #FFFFFF + ⚠; đèn tắt xẹp 20% + giấy rách; đèn sắp hết dầu nhấp nháy.
- **FR3-062** HUD: đang mang / capacity; số đèn đang sáng / ngưỡng thắng.

## Acceptance (scenario headless, mỗi FR3 ≥ 1)
1. Đèn L1 sáng fuel 100, không ai hút, 600 tick → fuel 90.0. 6000 tick → `lantern_out` ở tick 6000, deposited 0, ever_lit true.
2. L1 sáng fuel 50, carried 7, interact → used = ceil(50/10) = 5, fuel 100, carried 2, `refuel {amount 5, fuel 100}`, +25.
3. (Sửa 17:10, theo thứ tự tick: dầu hao ở bước 2 TRƯỚC tương tác, nên đèn đặt fuel 100 đã còn 99.98 khi tương tác.) L1 sáng fuel 100 gần hơn, L2 chưa sáng cùng trong 2 m, carried 5 → `refuel L1 amount 1 fuel 100` (ceil(0.017/10)=1). Luật "đèn đầy (used=0) bị bỏ qua" kiểm bằng **unit test** hàm chọn đèn với fuel_u = 6000 (không tạo được qua CLI vì dầu luôn hao trước tương tác).
4. L1 ever_lit tắt, carried 5 → thắp lại `lantern_lit relight:true`, +25 +40, relit_count 1, capacity 12 nếu successful_lights trước = 0.
5. L1 sáng fuel 29, shade wander ở (0,0,22) → tới ≤ 2 m, `drain`, fuel giảm 6/s, `fuel_drain` mỗi 60 tick.
6. Shade drain, pulse trúng → stunned, +15.
7. L1 fuel 30 + shade ở 4 m → shade bị chặn/đẩy ra 6 m (30 vẫn có vùng an toàn); fuel 29.9 → mất vùng an toàn.
8. (Sửa 17:10) Bình minh Đêm 1 với 3 đèn sáng đặt fuel 100/80/50, 3 lửa → `won dawn_survived`; thưởng tính trên fuel **tại tick bình minh sau khi hao**: 3·50 + Σ floor(fuel_i − T/60) + 3·50 (T = số tick chạy). Ví dụ time_left 1 s ⇒ 150 + (99+79+49) + 150 = 527.
9. Bình minh với 2 đèn sáng → `lost dawn`. Hết lửa đúng tick bình minh → `lost no_flames`.
10. Thắp đủ 5 đèn sớm → không kết thúc.
