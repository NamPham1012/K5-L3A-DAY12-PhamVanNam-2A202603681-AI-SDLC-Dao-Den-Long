# Spec nháp Phase 2 — "Ba hòn đảo" (Ticket-02, Contract v1.1)

Nguồn: `docs/ticket-02.md` (bắt buộc, chính xác) + `docs/prd-0.md`. Ticket-02 **thay** mọi số tự chọn ở Phase 1. Chỗ ticket im lặng: giả định dưới đây (★ = nên hỏi trợ giảng lab board; nếu không kịp hỏi thì dùng giả định này).

## 0. Ưu tiên (60 phút)

| Mức | Nội dung | Lý do |
|---|---|---|
| P0 | Số chuẩn + thứ tự tick mới + Contract v1.1 (snapshot/scenario/input/event) + Đêm 1 chuẩn hoá + nhảy/lướt/rơi + Bóng Mực 5 trạng thái + điểm mới; sửa test Phase 1 bị luật mới thay | Test ẩn + regression Phase 1 |
| P1 | Đêm 2 (2 đảo, cầu, bục nhảy), Đêm 3 (tầng, dốc, vách, tháp, gió), Gió Lạc, Bùa Gió, pause | Test ẩn tính năng mới |
| P2 | Web: menu → giới thiệu → chơi → kết quả → Bình Minh, pause menu, cài đặt lưu localStorage, âm thanh, HUD đầy đủ, bảng màu, ambient 0.15+0.55·tỉ lệ, ≥30 FPS | Chấm tay, F |

## 1. Thay đổi so với Phase 1 (test cũ phải sửa kèm lý do)

| Mục | Phase 1 | Phase 2 (chuẩn) |
|---|---|---|
| pickup_radius | 1.5 | 1.0 XZ + chênh cao ≤ 1.5 |
| interact_radius | 3.0 | 2.0 |
| lantern_cost | 8 | 10 |
| pulse cost/radius/cd | 2 / 6 / 2 s | 3 / 5 (3D, tâm chân+0.8) / 3 s |
| stun / push | 3 s, đẩy tức thì 4 m | 120 tick, đẩy 4 m trải đều 15 tick đầu |
| shade_speed | 3.5 | 4.0 (Đêm 3: 4.5) |
| drop | floor(c×0.5) ra vòng 3 m, vĩnh viễn | floor(c/2) ra vành 1.5–2.5 m, TTL 480 tick |
| motes | 50 ngẫu nhiên, bù mỗi 120 tick | 20 trên điểm sinh cố định, trần 30, bù 1 con tại 240k |
| shades | 2 lúc dựng, +1/30 s, tối đa 6 | 2 tại tick 300, +1 mỗi 480 tick (Đ1), tối đa 6, trạng thái spawning/wander/chase/recoil/stunned |
| fall | false, tường mép | true: Y < −10 |
| điểm per_mote | khi nhặt | **khi nạp** (+10 mỗi đom đóm nạp) |
| per_stun | 25 | 5 (mỗi con mỗi lần, kể cả đang choáng) |
| thứ tự tick | FR-010 cũ (đếm giờ cuối) | 12 bước của ticket (đếm giờ ở bước 2) |
| đèn L2/L5 | (23.776,0,7.725)… | (23.8,0,7.7), (−23.8,0,7.7)… đúng toạ độ ticket |

## 2. Yêu cầu chức năng (acceptance criteria)

### Lõi & tick
- **FR2-001** Thứ tự tick đúng 12 bước của ticket. Timer giảm ở bước 2 (trước di chuyển). Sự kiện trong bước k ghi tick k+1.
- **FR2-002** Pause: cạnh lên `pause` bật/tắt. Khi paused: `tick` tăng, `sim_tick`, thời gian, hồi chiêu, spawn, TTL đứng yên; snapshot `state:"paused"`; sự kiện `paused {}` / `resumed {}` ghi ở tick của bước xử lý. Bước vừa vào pause dừng ngay sau bước đọc input. `--ticks` đếm `tick` (kể cả lúc pause).
- **FR2-003** Di chuyển 6.0 m/s (bùa: 7.2), đổi vận tốc ngay (≤ 0.1 s thoả mãn), điều khiển trên không đầy đủ. Hướng mặt = hướng di chuyển gần nhất, khởi đầu +Z.
- **FR2-004** Nhảy: cạnh lên `jump` khi grounded → vy = 7.0; trọng lực −20 m/s²; tích phân Euler bán ẩn mỗi tick (vy += g·dt; y += vy·dt). Chạm đất: y = cao độ mặt đất, vy = 0, grounded = true.
- **FR2-005** Lướt: cạnh lên `dash`, hết hồi chiêu → 12 tick ở 14 m/s theo hướng di chuyển (move ≠ 0) hoặc hướng mặt; trên không giữ nguyên y (vy = 0, không trọng lực trong lúc lướt); hồi chiêu 90 tick tính từ lúc bắt đầu; không bất tử; sự kiện `dash {}`. Nhấn khi đang lướt: bỏ qua.
- **FR2-006** Rơi: sau di chuyển nếu y < −10 → `player_hit {by:"fall", flames, dropped:0, lost:carried}`, carried = 0, bỏ qua bất tử. 60 tick chờ (không nhặt, không bị chạm, không di chuyển), rồi hồi sinh tại điểm xuất phát của Đêm, vận tốc 0, bất tử 90 tick. Hết lửa → thua ngay `no_flames`.

### Đom đóm, đèn, điểm
- **FR2-010** Nhặt tự động: XZ ≤ 1.0 và |y_chân − y_mặt_đất_của_đom_đóm| ≤ 1.5; đầy 10 thì không nhặt. Duyệt theo id tăng dần.
- **FR2-011** Đom đóm ngẫu nhiên: lúc dựng chọn 20 điểm khác nhau trong tập điểm sinh của Đêm (PRNG). Tại tick 240, 480, … nếu tổng đom đóm `random` đang có < 30 và còn điểm sinh trống (không có đom đóm random nào đứng đó) thì sinh 1 tại điểm trống chọn bằng PRNG; không có thì bỏ lượt. Id `M1, M2…` theo thứ tự sinh. Đom đóm mới nhặt được từ tick sau.
- **FR2-012** Đèn: chi phí 10; interact 2.0 m; chỉ đèn chưa sáng; gần nhất, hoà thì id nhỏ; nạp min(carried, còn thiếu); +10 điểm mỗi đom đóm nạp; đủ → `lantern_lit`, +100.
- **FR2-013** Thắng thì cộng floor(giây còn lại)×2 + 50×lửa còn lại. Headless một Đêm: score = điểm Đêm đó.
- **FR2-014** Kết thúc sau mỗi tick: hết lửa → `lost no_flames`; còn sống và tất cả đèn sáng → `won all_lit` (kể cả đúng tick hết giờ); hết giờ → `lost dawn`.

### Bóng Mực
- **FR2-020** Lịch sinh: 2 con tại tick 300, sau đó 1 con tại 300 + I·k (I = 480/420/360 tick cho Đêm 1/2/3); tối đa 6/8/10 cùng lúc. Điểm sinh: tập điểm của Đêm, cách người chơi ≥ 15 m; chọn bằng PRNG trong các điểm hợp lệ; không còn điểm → bỏ lượt. Id S1, S2… theo thứ tự sinh; sự kiện `shade_spawned {id}`.
- **FR2-021** Trạng thái: `spawning` ★ (đúng 1 tick: tick sinh; từ tick sau mới di chuyển/chạm) → `wander` ★ (đứng yên tại chỗ, lơ lửng y = mặt đất + 1.0) → `chase` khi khoảng cách XZ ≤ 12 m; `chase` → `wander` khi > 18 m. Tốc độ chase 4.0 (Đêm 3: 4.5).
- **FR2-022** Chạm: XZ ≤ 1.0 và chênh cao ≤ 1.5, Mây không bất tử, shade ở `chase`/`wander` → −1 lửa, rơi floor(carried/2) ra vành 1.5–2.5 m (PRNG bán kính + góc, kind `dropped`, TTL 480 tick, nhặt từ tick sau), bất tử 90 tick; shade chuyển `recoil` 60 tick, lùi tổng 2 m theo phương ngang ra xa Mây (đều mỗi tick), không gây hit; hết recoil → `chase`/`wander` theo khoảng cách. Tối đa 1 hit mỗi tick, xét id tăng dần.
- **FR2-023** Vùng an toàn: đèn sáng chặn shade ngoài mép 6 m. Shade đang ở trong khi đèn vừa thắp: bị đẩy ra mép trong ≤ 30 tick (đều), không gây sát thương trong thời gian đó.
- **FR2-024** Tỏa Sáng: cạnh lên `pulse`, carried ≥ 3, hết hồi chiêu → trừ 3, hồi chiêu 180 tick; tâm = chân + (0,0.8,0); mục tiêu chốt ngay tick đó: shade có khoảng cách 3D ≤ 5. Mỗi shade trúng: `stunned` 120 tick (làm mới nếu đang choáng), đẩy lùi tổng 4 m ngang trong 15 tick đầu (dừng nếu bị chặn bởi vách/tháp/mép vùng an toàn; trùng vị trí đẩy +X); +5 điểm mỗi con. Sự kiện `pulse {stunned_ids}`. Không đủ 3 → không gì cả.

### Bản đồ
- **FR2-030** Đêm 1: đảo tròn r 40; xuất phát (0,0,0) mặt +Z; đèn đúng toạ độ ticket; điểm đom đóm 8 điểm r12 (0°,45°…) + 16 điểm r33 (0°,22.5°…); điểm Bóng Mực 12 điểm r37 tại 15°+30°k. Góc α từ +X: điểm = (r·cosα, 0, r·sinα) (đã chốt, không còn ★). Suy ra từ chính ticket: tầng 1 Đêm 3 nằm ở z > 0 và các điểm đom đóm tầng 1 ở 20°…160°, dốc 30°/150° phải lên tầng 1 ⇒ sinα > 0 ↔ z > 0.
- **FR2-031** Đêm 2: 2 đảo r 28 tâm (0,0,0) và (70,0,0); cầu x∈[26,44], z∈[−2,2] (y = 0); ngoài các vùng này là rơi. Bục nhảy r 1 tại (20,0,18), (50,0,−18): chân chạm bục (XZ ≤ 1, grounded) → vy = 14, vận tốc ngang 24 m/s hướng tâm đảo kia, giữ tới khi chạm đất (move không ghi đè, vẫn lướt được). Đèn L1…L6, điểm đom đóm 12/đảo, điểm Bóng Mực 8/đảo r 26 tại 22.5°+45°k. Xuất phát (0,0,0) ★.
- **FR2-032** Đêm 3: đảo r 45; tầng 1 y=3: 12 ≤ r ≤ 24 và z > 0; tầng 2 y=6: r ≤ 8; vách đứng: không đi lên được (chặn di chuyển ngang nếu mặt đất đích cao hơn chân > 0.01 m), bước ra khỏi mép thì rơi xuống tầng dưới. Dốc rộng 3 m dọc bán kính tại 30°/150°: r 30 → 24, y nội suy tuyến tính 0 → 3. Bục (0,3,13): vy 12, ngang 8 m/s hướng −Z. Tháp r 2 tại tâm, cao 8: va chạm hình trụ. Đèn L1…L7, 30 điểm đom đóm, 16 điểm Bóng Mực r 43. Xuất phát (0,0,0)? ★ — (0,0,0) nằm trong tháp; giả định xuất phát (0,0,−30) mặt +Z.
- **FR2-033** Gió (Đêm 3, `wind_enabled` mặc định true): cơn gió thứ k bắt đầu tại tick 1800k (k ≥ 1), kéo dài 300 tick, hướng `dir_deg` PRNG [0,360); đẩy người chơi 2 m/s theo hướng đó (cộng vào di chuyển). Snapshot `wind {active, dir_deg}` (dir_deg của cơn gần nhất, 0 nếu chưa có). Báo trước 2 s chỉ ở web.

### Gió Lạc & Bùa
- **FR2-040** Gió Lạc (Đêm 2, 3; `random_drifters` mặc định true): sinh tại tick 1200, 2400, … nếu đang có < 2 con chưa removed; vị trí: điểm sinh Bóng Mực chọn bằng PRNG ★; id D1, D2…
- **FR2-041** `idle`: lượn tròn bán kính 3 m quanh điểm sinh ở 2 m/s ★. `idle → chase` khi carried ≥ 5 và XZ ≤ 15; mất điều kiện → `idle`. Chase 7 m/s.
- **FR2-042** Chạm XZ ≤ 1.2 (bất tử không ngăn, vùng an toàn không chặn): cướp min(3, carried), `drifter_steal {drifter_id, amount, carried}`, chuyển `flee` (bay ra xa Mây 7 m/s, 240 tick) rồi `removed` (giữ trong snapshot với state `removed` ★). Mỗi con cướp tối đa 1 lần.
- **FR2-043** Pulse trúng (3D ≤ 5): đang `chase` → `flee` không cướp; đang `flee` có `stolen > 0` → thả toàn bộ thành đom đóm `dropped` tại vị trí nó (vành 0–0.5 m ★), `drifter_drop {drifter_id, amount}`, removed sau 120 tick. Không cộng điểm, không có trong `stunned_ids`.
- **FR2-044** Bùa Gió (`charms`): Đêm 2 C1 (35,0,0); Đêm 3 C1 (30,0,25), C2 (−30,0,25); Đêm 1 không có. Nhặt như đom đóm (không tốn sức chứa). Hiệu lực 600 tick (làm mới nếu nhặt lại): tốc độ 7.2, lướt không hồi chiêu. Bùa xuất hiện lại sau 2700 tick kể từ lúc nhặt. Sự kiện `charm_picked {charm_id, charm_ticks}`.

### Contract v1.1
- **FR2-050** `game.contract.json`: `contract_version "1.1"`; tuning theo số chuẩn (bảng §3) + `dash_speed, dash_duration_s, dash_cooldown_s, night2_duration_s, night3_duration_s`.
- **FR2-051** `--night 1|2|3`.
- **FR2-052** Snapshot thêm `night`, `wind{active,dir_deg}`; `player.{vel[3], grounded, invuln ★(số giây còn lại, 0 nếu không), dash_cd_s, pulse_cd_s, charm_s}`; mảng bắt buộc `motes[{id,pos,kind,ttl_s(null với random)}]`, `drifters[{id,pos,state,stolen}]`, `charms[{id,available,respawn_s}]`.
- **FR2-053** Scenario thêm `player.{invuln_ticks,dash_cd_ticks,pulse_cd_ticks,charm_ticks}`, `shades[].{state,state_ticks_left}`, `drifters`, `charms`, `random_drifters`, `wind_enabled`. `drifters`, `charms` thay danh sách mặc định. Shade trong scenario mặc định state `chase`? ★ — giả định `wander` nếu không ghi (luật chuyển trạng thái quyết định từ tick sau).
- **FR2-054** Input thêm `dash`, `pause` (cạnh lên).
- **FR2-055** Sự kiện mới: `dash {}`, `charm_picked`, `drifter_steal`, `drifter_drop`, `night_start {night}` ★ (ghi 1 lần ở tick 0, trước snapshot tick 0), `paused {}`, `resumed {}`; `player_hit` do rơi có `lost`.
- **FR2-056** Một Đêm đầy đủ (≤ 21 600 tick) chạy headless ≤ 30 s.
- **FR2-057** Mọi phần sáng tạo/web không đổi JSONL (so SHA256).

### Web (P2)
- **FR2-060** Luồng: Menu → giới thiệu Đêm (tên đảo + lời Ông Đăng) → chơi → kết quả → Đêm kế; thắng Đêm 3 → màn Bình Minh + tổng điểm; thua → chơi lại Đêm đó.
- **FR2-061** Pause Esc/P: Tiếp tục / Chơi lại Đêm / Cài đặt / Về menu. Cài đặt âm lượng + độ nhạy chuột lưu localStorage.
- **FR2-062** Âm thanh (WebAudio tổng hợp, không cần asset): nhạc nền + 10 hiệu ứng theo ticket.
- **FR2-063** HUD đúng bố cục ticket (lửa trên trái; mm:ss trên giữa, đỏ nhấp nháy ≤ 30 s; đèn k/n + điểm trên phải; thanh 10 ô dưới giữa; icon hồi chiêu Lướt/Tỏa Sáng dưới phải; nhắc "E — Nạp ánh sáng (x/10)"; mũi tên tới đèn chưa sáng gần nhất khi ngoài màn hình).
- **FR2-064** Bảng màu chuẩn (±10%/kênh) + ambient = 0.15 + 0.55 × đèn sáng/tổng.
- **FR2-065** ≥ 30 FPS trung bình ở 1280×720 (đo bằng bộ đếm FPS trong web, ghi `docs/proof/phase-2/perf.md`).

## 3. Tuning v1.1 (đề xuất giá trị)

player_speed 6.0, carry_capacity 10, lantern_cost 10, lantern_count_night1 5, pickup_radius 1.0, interact_radius 2.0, pulse_cost 3, pulse_radius 5.0, night1_duration_s 300, flames 3, invuln_s 1.5, hit_drop_ratio 0.5, pulse_stun_s 2.0, pulse_push_m 4.0, pulse_cooldown_s 3.0, safe_radius 6.0, shade_speed 4.0, shade_hit_radius 1.0, fall_enabled true, dash_speed 14.0, dash_duration_s 0.2, dash_cooldown_s 1.5, night2_duration_s 330, night3_duration_s 360, score {per_mote 10 (khi nạp), per_lantern 100, per_stun 5, per_second_left 2, per_flame_left 50}.

## 4. Câu hỏi nên gửi trợ giảng lab board (★)
1. Bóng Mực ở `spawning` bao lâu, `wander` di chuyển thế nào?
2. `player.invuln` trong snapshot là boolean hay số giây?
4. Xuất phát Đêm 2, Đêm 3 ở đâu ((0,0,0) Đêm 3 nằm trong tháp)?
5. `night_start` ghi ở tick 0 hay tick 1? Gió Lạc `removed` còn trong mảng snapshot không?
