# Feature Specification: Phase 1 — Đêm 1 · Đảo Bến

**Feature Branch**: `main`

**Created**: 2026-11-20

**Status**: Draft (xem checklist chất lượng)

**Input**: PRD-0 "Đảo Đèn Lồng" + Test Contract v1.0 (docs/prd-0.md) + RUBRIC/SUBMISSION của lab

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Chạy headless theo Test Contract (Priority: P1)

Giảng viên chạy `<headless_cmd> --seed … --night 1 --ticks … --out …` (kèm scenario/inputs tuỳ chọn) và nhận JSONL đúng định dạng, tất định.

**Why this priority**: Bài được chấm tự động; sai contract là trượt dù game đẹp.

**Independent Test**: Scenario JSON `{"random_motes":false,"random_shades":false,"motes":[],"shades":[]}` và inputs JSON `{"frames":[]}`; chạy 120 tick với thời lượng mặc định đủ lớn. JSONL có snapshot tick 0 và mỗi 10 tick đến 120, `player.pos` là `[0,0,0]`, dòng cuối có `type:"end", ticks:120, state:"playing"`; mã thoát 0. Chạy lại cùng seed ⇒ hai file giống hệt từng byte.

**Acceptance Scenarios**:

1. **Given** scenario tắt sinh ngẫu nhiên, không có shade và không có inputs, thời lượng đủ cho 120 tick, **When** chạy `--ticks 120`, **Then** người chơi ở (0,0,0) suốt, có 13 snapshot (tick 0…120), dòng cuối `{"type":"end","ticks":120,...}`.
2. **Given** inputs có tick không tăng nghiêm ngặt hoặc JSON hỏng, **When** chạy, **Then** thoát mã 2, thông báo ra stderr, không coi là chạy thành công.
3. **Given** cùng seed/scenario/inputs, **When** chạy hai lần, **Then** hai file giống hệt từng byte (kể cả id tự sinh).
4. **Given** game kết thúc ở bước k, **When** `--ticks` lớn hơn k, **Then** dừng sau bước đó, `end.ticks = k`, mã thoát 0.

---

### User Story 2 — Thu đom đóm và thắp đèn (Priority: P1)

Mây chạy quanh đảo, nhặt đom đóm, mang về nạp vào Đèn Lồng Lớn; thắp đủ 5 đèn thì thắng.

**Why this priority**: Vòng lặp lõi và điều kiện thắng.

**Independent Test**: Scenario JSON `{"random_motes":false,"random_shades":false,"motes":[[0,0,0]],"shades":[],"lanterns":[{"id":"L1","pos":[0,0,0],"deposited":C-1}]}` với `C-1` thay bằng số bằng `lantern_cost − 1` thực tế; inputs JSON `{"frames":[{"tick":0,"interact":true}]}`. JSONL tick 1 có lần lượt `mote_picked` với `carried:1`, `deposit` với `lantern_id:"L1", amount:1, deposited:C` (C là `lantern_cost`), rồi `lantern_lit` với `lantern_id:"L1"`; snapshot tick 1 (dùng `--snapshot-every 1`) có L1 `lit:true`.

**Acceptance Scenarios**:

1. **Given** đom đóm trong `pickup_radius` và còn chỗ, **When** tick tiếp theo, **Then** `carried` +1, sự kiện `mote_picked {carried}`, điểm `+per_mote`, `motes_active` −1.
2. **Given** `carried = carry_capacity`, **When** đi qua đom đóm, **Then** không nhặt, đom đóm vẫn còn.
3. **Given** trong `interact_radius` của đèn chưa thắp và `carried > 0`, **When** interact chuyển false→true, **Then** sự kiện `deposit {lantern_id, amount, deposited}`; nếu đủ `lantern_cost` thì tiếp `lantern_lit` cùng tick và `+per_lantern`.
4. **Given** interact giữ true liên tục, **When** nhiều tick trôi qua, **Then** chỉ nạp một lần (kích hoạt theo cạnh lên).
5. **Given** đèn cuối được thắp, **When** cuối bước, **Then** `game_over {won, all_lit}`, cộng thưởng thời gian và lửa còn lại.

---

### User Story 3 — Bóng Mực đuổi và gây sát thương (Priority: P1)

Bóng Mực đuổi Mây; chạm vào thì mất 1 lửa (máu) và rơi đom đóm; hết lửa thì thua.

**Independent Test**: Scenario JSON `{"player":{"pos":[0,0,0],"carried":0,"flames":1},"random_motes":false,"random_shades":false,"motes":[],"shades":[{"id":"S1","pos":[0,0,0]}]}`; inputs JSON `{"frames":[]}`. JSONL tick 1 có `player_hit` với `by:"shade", flames:0, dropped:0`, tiếp đó `game_over` với `result:"lost", reason:"no_flames"`, và dòng cuối `end` có `ticks:1, state:"lost"`.

**Acceptance Scenarios**:

1. **Given** shade không bị choáng, người chơi không bất tử, khoảng cách ≤ `shade_hit_radius`, **When** bước xử lý va chạm, **Then** `player_hit {by:"shade", flames, dropped}`, bất tử `invuln_s` giây.
2. **Given** đang bất tử, **When** shade chạm, **Then** không mất lửa, không sự kiện.
3. **Given** `flames` về 0, **When** cuối bước, **Then** `game_over {lost, no_flames}`.
4. **Given** đèn đã thắp, **When** shade đuổi, **Then** shade không bao giờ có khoảng cách < `safe_radius` tới chân cột đèn đó.

---

### User Story 4 — Tỏa sáng xua Bóng Mực (Priority: P2)

**Independent Test**: Scenario JSON `{"player":{"pos":[0,0,0],"carried":C},"random_motes":false,"random_shades":false,"motes":[],"shades":[{"id":"S1","pos":[0,0,0]}]}` với `C` là giá trị số `pulse_cost` thực tế; inputs JSON `{"frames":[{"tick":0,"pulse":true}]}`. JSONL tick 1 có `pulse` với `stunned_ids:["S1"]`, không có `player_hit`; snapshot tick 1 (dùng `--snapshot-every 1`) có `player.carried:0`, shade S1 `state:"stunned"` và điểm `per_stun`.

**Acceptance Scenarios**:

1. **Given** `carried ≥ pulse_cost`, hết hồi chiêu, **When** pulse false→true, **Then** trừ `pulse_cost`, mọi shade trong `pulse_radius` bị `stunned` `pulse_stun_s` giây và đẩy ra xa thêm `pulse_push_m` theo hướng người chơi→shade; sự kiện `pulse {stunned_ids}` (có thể rỗng); điểm `+per_stun × số id`.
2. **Given** đang hồi chiêu hoặc không đủ đom đóm, **When** bấm pulse, **Then** không có gì xảy ra.
3. **Given** shade đang stunned, **When** chạm người chơi, **Then** không gây sát thương, không di chuyển.

---

### User Story 5 — Chơi bản có giao diện, thắng/thua, chơi lại (Priority: P2)

Cửa sổ 3D, camera theo sau, HUD hiển thị lửa, đom đóm đang mang/sức chứa, số đèn đã thắp/5, thời gian, điểm, hồi chiêu pulse; màn hình thắng/thua có nút/ phím chơi lại.

**Independent Test**: Dùng scenario JSON `{"random_motes":false,"random_shades":false,"motes":[],"shades":[],"lanterns":[{"id":"L1","lit":true},{"id":"L2","lit":true},{"id":"L3","lit":true},{"id":"L4","lit":true},{"id":"L5","lit":true}]}` và inputs JSON `{"frames":[]}`; JSONL mong đợi có `game_over` tick 1 với `result:"won", reason:"all_lit"` và `end` có `ticks:1, state:"won"`. Kiểm chứng riêng bằng chơi bản giao diện: thắp đèn, quan sát ánh sáng và HUD, thắng hoặc thua rồi nhấn R để chơi lại; JSONL không chứng minh được hiển thị hay thao tác chơi lại.

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
- **FR-001**: Đảo tròn tâm (0,0,0), bán kính 40 m, mặt đất Y=0; người chơi xuất phát (0,0,0) và bị kẹp ở mép đảo bán kính 40 m.
- **FR-002**: 5 đèn L1…L5 trên vòng bán kính 25 m, L1 tại (0,0,25), các đèn sau xoay 72° (theo chiều kim đồng hồ nhìn từ trên). Mỗi đèn: `id, pos, lit, deposited`.
- **FR-003**: Khi `random_motes` mặc định/true: sinh 50 đom đóm ban đầu. `needed = Σ (lantern_cost − deposited)` trên các đèn chưa thắp; `available = số đom đóm active trên đảo + player.carried`. Nếu `available < needed`, cứ mỗi 120 tick tính từ tick 0 sinh 1 đom đóm (tại tick 120, 240, …). Khi `random_motes=false` không bao giờ sinh bù. Vị trí sinh do PRNG có seed chọn trong bán kính 38 m, cách mỗi đèn và người chơi ≥ 3 m. Id `M1, M2…` tăng dần.
- **FR-004**: Khi `random_shades` mặc định/true: có sẵn 2 shade lúc dựng, không phát `shade_spawned`; sau đó sinh 1 shade mỗi 30 giây tại tick 1800, 3600, …, tối đa 6 shade cùng lúc. Vị trí sinh trên vòng bán kính 38 m, góc do PRNG chọn, cách người chơi ≥ 15 m; thử lại tối đa 8 lần, nếu vẫn không đạt thì lấy điểm xa nhất trong các lần thử. Mỗi shade sinh trong lúc chơi phát `shade_spawned {id}`; id `S1, S2…` tăng dần. Shade ở trạng thái `chase` (hoặc `stunned`).

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

### Measurable Outcomes

- **SC-001**: 100% bộ test contract tự viết (≥ 15 scenario) qua; hai lần chạy cùng tham số cho `diff` rỗng.
- **SC-002**: Headless 18 000 tick (5 phút game) chạy < 2 s trên máy của người phát triển, cấu hình ghi trong `docs/proof/phase-1/perf.md`.
- **SC-003**: Từ clone sạch, ≤ 3 lệnh để chạy được bản có giao diện trên macOS và Linux.
- **SC-004**: Kiểm chứng thủ công, không phải tiêu chí chặn: quan sát một người chơi mới có thắng được Đêm 1 trong khoảng 3–5 phút ở lần thứ 2–3 hay không (cân bằng không quá khó).
- **SC-006**: Clone sạch sang thư mục khác, chạy theo README được game và `npm test` xanh.
- **SC-005**: `game.contract.json › tuning` khớp 100% với cấu hình runtime (test tự động).

## Assumptions

- Đơn vị "ánh sáng" là số đom đóm đang mang; không có thanh năng lượng riêng.
- `hit_drop_ratio` làm tròn xuống; đom đóm rơi nằm lại trên đảo và nhặt lại được (ăn điểm lại; hit tốn 1 lửa nên không thành chiêu cày điểm).
- Sau khi thắp hết, thời gian còn lại tính `floor` khi quy điểm.
- Chơi lại trong bản giao diện dùng seed mới (headless luôn dùng `--seed`).
- Phase 1 chỉ 1 màn; `--night` khác 1 là lỗi tham số.

## Clarifications

### Session 2026-11-20

- Q: Nhặt đom đóm cần bấm nút không? → A: Không. Tự nhặt khi khoảng cách XZ ≤ `pickup_radius` và còn chỗ (`carried < carry_capacity`).
- Q: Nạp đèn thế nào? → A: Nhấn `interact` (cạnh lên) trong `interact_radius` của một đèn **chưa thắp**: nạp `min(carried, lantern_cost − deposited)`. Cho phép nạp từng phần. Đủ `lantern_cost` ⇒ thắp ngay trong cùng tick.
- Q: "Tỏa sáng tốn ánh sáng" trừ vào đâu? → A: trừ `pulse_cost` đom đóm đang mang. Không đủ ⇒ không phát pulse, không sự kiện.
- Q: `safe_radius` áp cho đèn nào? → A: chỉ đèn **đã thắp**.
- Q: Đom đóm đánh rơi đi đâu? → A: rơi ra quanh chỗ bị chạm. `dropped = floor(carried × hit_drop_ratio)`; các con rơi được đặt trên vòng tròn bán kính 3 m quanh chân người chơi (> `pickup_radius`, nên không bị nhặt lại ngay trong tick đó), cách đều nhau, góc bắt đầu lấy từ PRNG; kẹp vào trong đảo; id mới tiếp bộ đếm `M…`; `motes_active` tăng tương ứng. Nhặt lại vẫn phát `mote_picked` và cộng `per_mote` như mọi đom đóm khác.
- Q: Hết giờ là thắng hay thua? → A: Thua, `reason = "dawn"` (bình minh đến khi đảo chưa sáng hết).
- Q: Rơi khỏi đảo? → A (giả định, chưa hỏi): `fall_enabled = false`; người chơi bị chặn ở mép đảo tròn bán kính 40 m.
- Q: Sinh đom đóm mặc định và sinh bù thế nào? → A: 50 con ban đầu; `needed = Σ (lantern_cost − deposited)` của đèn chưa thắp, `available = số đom đóm active trên đảo + player.carried`. Khi `available < needed`, sinh 1 con mỗi 120 tick tính từ tick 0 (tick 120, 240, …); `random_motes=false` thì không sinh bù. Vị trí do PRNG chọn trong bán kính 38 m, cách đèn và người chơi ≥ 3 m.
- Q: Sinh Bóng Mực mặc định thế nào? → A: 2 con có sẵn khi dựng, không phát sự kiện; sau đó thêm 1 con mỗi 30 giây ở tick 1800, 3600, …, tối đa 6 con cùng lúc. Sinh trên vòng bán kính 38 m theo góc PRNG, cách người chơi ≥ 15 m; thử lại tối đa 8 lần, nếu không đạt lấy điểm xa nhất. Sinh trong lúc chơi phát `shade_spawned {id}`.
- Q: Kích thước đảo và vị trí đèn? → A: Đảo bán kính 40 m, người chơi bị kẹp tại mép; L1–L5 trên vòng 25 m, L1 tại (0,0,25), mỗi đèn xoay 72° theo chiều kim đồng hồ nhìn từ trên.
- Q: SC-004 có chặn hoàn thành không? → A: Không; giữ SC-004 như kiểm chứng thủ công, cùng các tiêu chí SC-001 đến SC-006.
- Q: Kiểm thử độc lập từng user story cần gì? → A: Mỗi story chỉ rõ scenario/inputs JSON và JSONL mong đợi; các hành vi giao diện còn cần kiểm chứng trực tiếp.
