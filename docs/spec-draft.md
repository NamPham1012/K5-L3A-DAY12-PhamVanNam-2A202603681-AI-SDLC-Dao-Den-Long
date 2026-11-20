# Feature Specification: Phase 1 — Đêm 1 · Đảo Bến

**Feature Branch**: `001-phase1-night1`

**Created**: 2026-11-20

**Status**: Clarified (sẵn sàng cho `/speckit-plan`)

**Input**: PRD-0 "Đảo Đèn Lồng" + Test Contract v1.0 (docs/prd-0.md) + RUBRIC/SUBMISSION của lab

## Clarifications

### Session 2026-11-20

- Q: Nhặt đom đóm cần bấm nút không? → A: Không. Tự nhặt khi khoảng cách XZ ≤ `pickup_radius` và còn chỗ (`carried < carry_capacity`).
- Q: Nạp đèn thế nào? → A: Nhấn `interact` (cạnh lên) trong `interact_radius` của một đèn **chưa thắp**: nạp `min(carried, lantern_cost − deposited)`. Cho phép nạp từng phần. Đủ `lantern_cost` ⇒ thắp ngay trong cùng tick.
- Q: "Tỏa sáng tốn ánh sáng" trừ vào đâu? → A: trừ `pulse_cost` đom đóm đang mang. Không đủ ⇒ không phát pulse, không sự kiện.
- Q: `safe_radius` áp cho đèn nào? → A: chỉ đèn **đã thắp**.
- Q: Đom đóm đánh rơi đi đâu? → A: rơi ra quanh chỗ bị chạm. `dropped = floor(carried × hit_drop_ratio)`; các con rơi được đặt trên vòng tròn bán kính 3 m quanh chân người chơi (> `pickup_radius`, nên không bị nhặt lại ngay trong tick đó), cách đều nhau, góc bắt đầu lấy từ PRNG; kẹp vào trong đảo; id mới tiếp bộ đếm `M…`; `motes_active` tăng tương ứng. Nhặt lại vẫn phát `mote_picked` và cộng `per_mote` như mọi đom đóm khác.
- Q: Hết giờ là thắng hay thua? → A: Thua, `reason = "dawn"` (bình minh đến khi đảo chưa sáng hết).
- Q: Rơi khỏi đảo? → A (giả định, chưa hỏi): `fall_enabled = false`; người chơi bị chặn ở mép đảo tròn bán kính 40 m.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Chạy headless theo Test Contract (Priority: P1)

Giảng viên chạy `<headless_cmd> --seed … --night 1 --ticks … --out …` (kèm scenario/inputs tuỳ chọn) và nhận JSONL đúng định dạng, tất định.

**Why this priority**: Bài được chấm tự động; sai contract là trượt dù game đẹp.

**Independent Test**: Chạy không scenario/inputs 600 tick, kiểm tra dòng đầu là snapshot tick 0, có snapshot mỗi 10 tick, dòng cuối là `end`, mã thoát 0; chạy lại cùng seed ⇒ `diff` rỗng.

**Acceptance Scenarios**:

1. **Given** không có inputs, **When** chạy `--ticks 120`, **Then** người chơi ở (0,0,0) suốt, có 13 snapshot (tick 0…120), dòng cuối `{"type":"end","ticks":120,...}`.
2. **Given** inputs có tick không tăng nghiêm ngặt hoặc JSON hỏng, **When** chạy, **Then** thoát mã 2, thông báo ra stderr, không coi là chạy thành công.
3. **Given** cùng seed/scenario/inputs, **When** chạy hai lần, **Then** hai file giống hệt từng byte (kể cả id tự sinh).
4. **Given** game kết thúc ở bước k, **When** `--ticks` lớn hơn k, **Then** dừng sau bước đó, `end.ticks = k`, mã thoát 0.

---

### User Story 2 — Thu đom đóm và thắp đèn (Priority: P1)

Mây chạy quanh đảo, nhặt đom đóm, mang về nạp vào Đèn Lồng Lớn; thắp đủ 5 đèn thì thắng.

**Why this priority**: Vòng lặp lõi và điều kiện thắng.

**Independent Test**: Scenario 1 đom đóm ở (0,0,5), L1 ở (0,0,25) với `deposited = lantern_cost − 1`; inputs đi thẳng +Z rồi bấm interact ⇒ có `mote_picked`, `deposit`, `lantern_lit`.

**Acceptance Scenarios**:

1. **Given** đom đóm trong `pickup_radius` và còn chỗ, **When** tick tiếp theo, **Then** `carried` +1, sự kiện `mote_picked {carried}`, điểm `+per_mote`, `motes_active` −1.
2. **Given** `carried = carry_capacity`, **When** đi qua đom đóm, **Then** không nhặt, đom đóm vẫn còn.
3. **Given** trong `interact_radius` của đèn chưa thắp và `carried > 0`, **When** interact chuyển false→true, **Then** sự kiện `deposit {lantern_id, amount, deposited}`; nếu đủ `lantern_cost` thì tiếp `lantern_lit` cùng tick và `+per_lantern`.
4. **Given** interact giữ true liên tục, **When** nhiều tick trôi qua, **Then** chỉ nạp một lần (kích hoạt theo cạnh lên).
5. **Given** đèn cuối được thắp, **When** cuối bước, **Then** `game_over {won, all_lit}`, cộng thưởng thời gian và lửa còn lại.

---

### User Story 3 — Bóng Mực đuổi và gây sát thương (Priority: P1)

Bóng Mực đuổi Mây; chạm vào thì mất 1 lửa (máu) và rơi đom đóm; hết lửa thì thua.

**Independent Test**: Scenario 1 shade ở (3,0,0), người chơi đứng yên ⇒ `player_hit` ở tick tính được từ `shade_speed`, `shade_hit_radius`.

**Acceptance Scenarios**:

1. **Given** shade không bị choáng, người chơi không bất tử, khoảng cách ≤ `shade_hit_radius`, **When** bước xử lý va chạm, **Then** `player_hit {by:"shade", flames, dropped}`, bất tử `invuln_s` giây.
2. **Given** đang bất tử, **When** shade chạm, **Then** không mất lửa, không sự kiện.
3. **Given** `flames` về 0, **When** cuối bước, **Then** `game_over {lost, no_flames}`.
4. **Given** đèn đã thắp, **When** shade đuổi, **Then** shade không bao giờ có khoảng cách < `safe_radius` tới chân cột đèn đó.

---

### User Story 4 — Tỏa sáng xua Bóng Mực (Priority: P2)

**Acceptance Scenarios**:

1. **Given** `carried ≥ pulse_cost`, hết hồi chiêu, **When** pulse false→true, **Then** trừ `pulse_cost`, mọi shade trong `pulse_radius` bị `stunned` `pulse_stun_s` giây và đẩy ra xa thêm `pulse_push_m` theo hướng người chơi→shade; sự kiện `pulse {stunned_ids}` (có thể rỗng); điểm `+per_stun × số id`.
2. **Given** đang hồi chiêu hoặc không đủ đom đóm, **When** bấm pulse, **Then** không có gì xảy ra.
3. **Given** shade đang stunned, **When** chạm người chơi, **Then** không gây sát thương, không di chuyển.

---

### User Story 5 — Chơi bản có giao diện, thắng/thua, chơi lại (Priority: P2)

Cửa sổ 3D, camera theo sau, HUD hiển thị lửa, đom đóm đang mang/sức chứa, số đèn đã thắp/5, thời gian, điểm, hồi chiêu pulse; màn hình thắng/thua có nút/ phím chơi lại.

**Acceptance Scenarios**:

1. **Given** màn thắng hoặc thua, **When** nhấn phím chơi lại, **Then** màn reset về trạng thái đầu (seed mới hoặc cũ, ghi rõ).
2. **Given** thắp một đèn, **When** nhìn cảnh, **Then** vùng quanh đèn sáng vàng-cam rõ rệt (đảo sáng dần).

---

### Edge Cases

- Nhiều đom đóm trong bán kính cùng tick: nhặt theo thứ tự id tăng dần tới khi đầy; mỗi con một sự kiện `mote_picked`.
- Hai đèn cùng trong `interact_radius`: chọn đèn gần nhất; hoà thì id nhỏ hơn.
- Interact khi `carried = 0` hoặc chỉ gần đèn đã thắp: không sự kiện.
- Bị chạm khi `carried = 1`: `dropped = 0`, không sinh đom đóm.
- Nhiều shade chạm cùng tick: chỉ 1 lần trúng (bất tử bắt đầu ngay), `by:"shade"`.
- Pulse và va chạm cùng tick: pulse xử lý trước ⇒ shade bị choáng không gây sát thương.
- Đèn cuối được thắp và hết giờ/hết lửa cùng tick: ưu tiên `won` > `no_flames` > `dawn`.
- Scenario đặt cả 5 đèn `lit:true`: không sự kiện khi dựng; `game_over won all_lit` ở tick 1, không cộng `per_lantern`.
- Shade đang trong `safe_radius` lúc đèn vừa thắp: đẩy ra mép vùng an toàn ở bước shade kế tiếp.
- `move` dài > 1: chuẩn hoá; thành phần ngoài [−1,1]: coi là sai định dạng ⇒ mã 2.
- Frame inputs có tick ≥ `--ticks`: bỏ qua.
- `--snapshot-every` ≤ 0, thiếu `--ticks`/`--out`, `--night` ≠ 1: lỗi tham số ⇒ mã 2.

## Requirements *(mandatory)*

### Functional Requirements

**Thế giới**
- **FR-001**: Đảo tròn tâm (0,0,0), bán kính 40 m, mặt đất Y=0; người chơi xuất phát (0,0,0).
- **FR-002**: 5 đèn L1…L5 trên vòng bán kính 25 m, L1 tại (0,0,25), các đèn sau xoay 72° (theo chiều kim đồng hồ nhìn từ trên). Mỗi đèn: `id, pos, lit, deposited`.
- **FR-003**: Khi `random_motes` mặc định/true: sinh N đom đóm ban đầu bằng PRNG có seed, ngoài 3 m quanh đèn và người chơi; tự sinh bù để luôn đủ đom đóm thắp các đèn còn lại. Id `M1, M2…` tăng dần.
- **FR-004**: Khi `random_shades` mặc định/true: shade xuất hiện theo lịch cố định ở mép đảo (vị trí từ PRNG, cách người chơi ≥ 15 m), phát `shade_spawned {id}`; id `S1, S2…`; số shade tối đa giới hạn. Shade ở trạng thái `chase` (hoặc `stunned`).

**Mô hình tick (thứ tự cố định trong bước k → k+1)**
- **FR-010**: 1) áp frame input của tick k, tính cạnh lên; 2) di chuyển/nhảy người chơi, chặn mép đảo; 3) nhặt đom đóm; 4) interact/nạp/thắp; 5) pulse; 6) cập nhật shade (giảm thời gian choáng, đuổi theo, tôn trọng `safe_radius`); 7) va chạm shade→người chơi; 8) giảm bộ đếm bất tử/hồi chiêu, sinh shade/đom đóm theo lịch; 9) `time_left_s = thời_lượng_ban_đầu − (k+1)/60`; 10) kiểm tra kết thúc. Mọi sự kiện trong bước ghi `tick = k+1`.
- **FR-011**: Di chuyển: hướng thế giới theo công thức xoay `cam_yaw_deg` của contract; vận tốc `player_speed` m/s; độ dời mỗi tick = vận tốc/60. Nhảy chỉ ảnh hưởng Y.

**Tài nguyên & điểm**
- **FR-020**: `flames` là máu, khởi đầu = `tuning.flames` (scenario ghi đè được).
- **FR-021**: Điểm: `per_mote` mỗi lần nhặt; `per_lantern` mỗi đèn được thắp trong lúc chơi; `per_stun` mỗi id trong `stunned_ids`; khi **thắng** cộng `floor(time_left_s) × per_second_left + flames × per_flame_left`. Thua không cộng thưởng. Không có điểm âm.

**Bóng Mực**
- **FR-030**: Shade `chase` đi thẳng về phía người chơi trên XZ với `shade_speed`; không vào `safe_radius` của đèn đã thắp (bị chiếu ra mép vòng tròn an toàn).
- **FR-031**: Trúng đòn: `flames −1`, `dropped = floor(carried × hit_drop_ratio)`, `carried −= dropped`, bất tử `invuln_s`.
- **FR-032**: Đom đóm rơi được sinh lại trên vòng 3 m quanh vị trí trúng đòn (xem Clarifications), trong cùng bước 7, trước bước nhặt của tick sau.

**Headless / I/O**
- **FR-040**: CLI đúng cú pháp mục B; tick 0 snapshot sau dựng scenario; snapshot mỗi `--snapshot-every` (mặc định 10) tại các tick là bội số; dòng `end` bắt buộc cuối file.
- **FR-041**: Trong cùng một tick, các dòng `event` đứng trước dòng `snapshot` của tick đó.
- **FR-042**: Snapshot gồm `type, tick, sim_tick, state, time_left_s, score, player{pos,flames,carried}, lanterns[], shades[{id,pos,state}], motes_active`, và khuyến nghị `motes[{id,pos}]`. Toạ độ 3 chữ số thập phân.
- **FR-043**: Scenario: đúng ngữ nghĩa mục D; dựng scenario không phát sự kiện, không cộng điểm; `time_left_s` ghi đè thời lượng ban đầu.
- **FR-044**: Inputs: mặc định move [0,0], yaw 0, nút false; frame chỉ đổi trường có mặt; tick tăng nghiêm ngặt; sai ⇒ mã 2.
- **FR-045**: Mọi thực thể/ hiệu ứng sáng tạo thêm bị tắt ở headless.
- **FR-046**: Không phát `player_hit {by:"fall"}` khi `fall_enabled = false`.

**Bản có giao diện**
- **FR-050**: Camera 3D bám sau, xoay được (chuột/ phím); WASD theo hướng camera; Space nhảy; E nạp; Q/chuột phải tỏa sáng; R chơi lại.
- **FR-051**: HUD: lửa, carried/capacity, đèn x/5, thời gian còn lại, điểm, trạng thái hồi chiêu pulse.
- **FR-052**: Mây đội nón lá treo đèn lồng nhỏ; shade màu tím-đen; đèn thắp tỏa sáng vàng-cam.

**Bàn giao & kiểm chứng (theo SUBMISSION/RUBRIC)**
- **FR-060**: README: mô tả ngắn; cài & chạy ≤ 3 lệnh; điều khiển; cách tính điểm; cách chạy test và headless; giải thích các giá trị `null/false` trong tuning; mục "Sáng tạo của tôi" kèm bằng chứng phần cũ vẫn đúng.
- **FR-061**: `npm test` chạy được bằng một lệnh: unit test lõi, các scenario headless tự viết (mỗi scenario gắn FR), kiểm tra tất định (chạy 2 lần so byte), kiểm tra `game.contract.json › tuning` khớp cấu hình runtime.
- **FR-062**: `docs/proof/traceability.md` liệt kê mỗi FR → cách kiểm chứng → file bằng chứng → đạt/chưa đạt; bằng chứng (JSONL, log test, ảnh HUD/thắp đèn/thắng-thua) nằm trong `docs/proof/phase-1/`.
- **FR-063**: Harness: `AGENTS.md`, skill verify-game, hook `pre-push` chạy `npm test`, CI GitHub Actions.
- **FR-064**: `docs/notes/` có giả định, nhật ký dùng AI (gồm ước tính token), đánh giá Phase 1; có `LICENSE`, `CREDITS.md`.

### Key Entities

- **Player**: pos, vel Y, flames, carried, invuln_timer, pulse_cooldown_timer, trạng thái nút trước đó.
- **Mote**: id, pos (trên mặt đất), active.
- **Lantern**: id (L1–L5), pos, deposited, lit.
- **Shade**: id, pos (tâm, Y = 1.0 hiển thị), state (`chase` | `stunned`), stun_timer.
- **World**: tick, time_left_s, score, state (`playing|won|lost`), rng, bộ đếm id, lịch sinh.

## Success Criteria *(mandatory)*

- **SC-001**: 100% bộ test contract tự viết (≥ 15 scenario) qua; hai lần chạy cùng tham số cho `diff` rỗng.
- **SC-002**: Headless 18 000 tick (5 phút game) chạy < 2 s trên laptop.
- **SC-003**: Từ clone sạch, ≤ 3 lệnh để chạy được bản có giao diện trên macOS và Linux.
- **SC-004**: Một người chơi mới thắng được Đêm 1 trong khoảng 3–5 phút ở lần thứ 2–3 (cân bằng không quá khó).
- **SC-006**: Clone sạch sang thư mục khác, chạy theo README được game và `npm test` xanh.
- **SC-005**: `game.contract.json › tuning` khớp 100% với cấu hình runtime (test tự động).

## Assumptions

- Đơn vị "ánh sáng" là số đom đóm đang mang; không có thanh năng lượng riêng.
- `hit_drop_ratio` làm tròn xuống; đom đóm rơi nằm lại trên đảo và nhặt lại được (ăn điểm lại; hit tốn 1 lửa nên không thành chiêu cày điểm).
- Sau khi thắp hết, thời gian còn lại tính `floor` khi quy điểm.
- Chơi lại trong bản giao diện dùng seed mới (headless luôn dùng `--seed`).
- Phase 1 chỉ 1 màn; `--night` khác 1 là lỗi tham số.
