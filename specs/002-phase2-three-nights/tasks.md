---
description: "Nhiệm vụ Phase 2 — Ba hòn đảo"
---

# Tasks: Phase 2 — Ba hòn đảo

**Nguồn**: [spec.md](spec.md), [plan.md](plan.md), [data-model.md](data-model.md), [contract v1.1](contracts/changes-v1.1.md), `docs/ticket-02.md`. Giữ stack và lõi dùng chung của Phase 1. `[P]` chỉ task độc lập, khác file và không phụ thuộc task chưa hoàn thành trong cùng đợt; `[USn]` gắn story trong spec. Các lệnh là cách kiểm chứng dự kiến khi code/test tương ứng đã được tạo.

**Quy ước góc Đêm 1**: `(r·cosα, 0, r·sinα)` — đã chốt trong spec FR2-030 (suy từ hình học Đêm 3 của ticket).

## Nhóm A — P0: nền tảng, Đêm 1 và Contract v1.1

**US6 — kiểm chứng độc lập**: chạy Đêm 1 headless, đối chiếu snapshot/event v1.1, mã lỗi, tuning, thứ tự tick; chạy hai lần cùng đầu vào so byte và chạy lại các test Phase 1 còn hiệu lực.

- [x] T001 [US6] Đối chiếu `docs/ticket-02.md`, `specs/002-phase2-three-nights/spec.md`, tuning và test hiện có; tạo `docs/notes/phase2-changes.md` ghi từng luật/test Phase 1 cần sửa, nguyên nhân, và xung đột dấu góc FR2-030. Kiểm chứng: `git diff --check` và đọc lại bảng truy vết.
- [x] T002 [P] [US6] Tạo `tests/contract/cases/FR2-050-tuning.test.ts`, `tests/contract/cases/FR2-052-snapshot.test.ts`, `tests/contract/cases/FR2-053-scenario-input.test.ts`: kiểm tra tuning, snapshot v1.1, scenario, input, mã 2, sự kiện và so byte; để riêng kiểm tra pause đầy đủ cho nhóm B. Kiểm chứng: `npm run contract -- FR2-05`.
- [x] T003 [US6] Cập nhật `src/core/tuning.ts`, `game.contract.json` theo §3 và Ticket-02, thêm khóa dash và Đêm 2/3, version 1.1; đối chiếu `tests/contract/cases/FR2-050-tuning.test.ts`. Kiểm chứng: `npm run contract -- FR2-050`.
- [x] T004 [US6] Mở rộng `src/core/entities.ts`, `src/core/world.ts` theo [data-model.md](data-model.md): `World.night`, `World.tick`, `World.sim_tick`, `World.state`, `World.time_left`, `World.score`, `World.rng`, `World.ID counters`, `World.wind`; `Player.pos`, `Player.vel`, `Player.grounded`, `Player.facing`, `Player.flames`, `Player.carried`, `Player.invuln`, `Player.dash/pulse cooldown`, `Player.charm`, `Player.fall/respawn timer`. Giữ tọa độ scenario theo tầng. Kiểm chứng: `npm test -- world`.
- [x] T005 [P] [US6] Tạo `tests/contract/cases/FR2-030-night1-map.test.ts`: kiểm tra tọa độ 5 đèn chính xác, spawn r12/r33/r37 và góc 0°/90° theo `(r·cosα,0,r·sinα)`, ngoài r40 có thể rơi. Kiểm chứng: `npm run contract -- FR2-030`.
- [x] T006 [US6] Tạo `src/core/maps/night1.ts`, cập nhật `src/core/world.ts` và `src/core/entities.ts` theo [data-model.md](data-model.md) cho `Map.start`, `Map.hình học sàn/vách/tháp`, `Map.đèn`, `Map.điểm sinh`, `Map.bục`, `Lantern.id`, `Lantern.pos`, `Lantern.deposited`, `Lantern.lit` và `Mote.id`, `Mote.pos`, `Mote.kind`, `Mote.ttl`, `Mote.thời điểm tương tác`; dùng góc mới nhất đã nêu. Kiểm chứng: `npm run contract -- FR2-030`.
- [x] T007 [P] [US6] Tạo `tests/contract/cases/FR2-004-jump-dash-fall.test.ts`: nhảy grounded/trọng lực, dash 12 tick và cooldown 90, rơi vượt bất tử, mất đồ, chờ/hồi sinh và thua khi hết lửa. Kiểm chứng: `npm run contract -- FR2-004`.
- [x] T008 [US6] Tạo `src/core/physics.ts` và tích hợp `src/core/step.ts` cho chuyển động, nhảy, dash, rơi/hồi sinh theo FR2-003–006; kiểm chứng: `npm run contract -- FR2-004`.
- [x] T009 [P] [US6] Tạo `tests/contract/cases/FR2-020-shades.test.ts`, `tests/contract/cases/FR2-022-hit-drop.test.ts`: spawn 300 + 480k, 5 trạng thái, recoil, id, bất tử, dropped TTL 480, vùng an toàn và chạm ở biên. Kiểm chứng: `npm run contract -- FR2-02`.
- [x] T010 [US6] Cập nhật `src/core/shades.ts`, `src/core/damage.ts`, `src/core/motes.ts` theo [data-model.md](data-model.md) cho `Shade.id`, `Shade.pos`, `Shade.state`, `Shade.state_ticks_left`, `Shade.recoil/push`, và `Mote.kind`, `Mote.ttl`, `Mote.thời điểm tương tác`; triển khai spawn, phát hiện, recoil và drop mới. Kiểm chứng: `npm run contract -- FR2-02`.
- [x] T011 [P] [US6] Tạo `tests/contract/cases/FR2-024-pulse-score.test.ts`, `tests/contract/cases/FR2-012-deposit-score.test.ts` kiểm tra pulse 3D, làm mới choáng, đẩy 15 tick, +5 mỗi shade và +10 mỗi đom đóm nạp. Kiểm chứng: `npm run contract -- FR2-0`.
- [x] T012 [US6] Cập nhật `src/core/pulse.ts`, `src/core/lanterns.ts`, `src/core/motes.ts` theo FR2-010–014/024, bao gồm spawn mote cố định 20 ban đầu, 240k, trần 30, và điểm mới. Kiểm chứng: `npm run contract -- FR2-0`.
- [x] T013 [US6] Viết lại `src/core/step.ts` theo 12 bước ticket, cập nhật `src/headless/inputs.ts`, `src/headless/scenario.ts`, `src/headless/jsonl.ts`, `src/headless/cli.ts` cho contract v1.1, `--night 1|2|3`, events và thứ tự snapshot; pause triển khai nhóm B. Theo [data-model.md](data-model.md), áp dụng `Input state.move`, `Input state.yaw`, `Input state.jump`, `Input state.interact`, `Input state.pulse`, `Input state.dash`, `Input state.pause`. Kiểm chứng: `npm run contract -- FR2-05`.
- [x] T014 [US6] Sửa các test tại `tests/contract/cases/FR-*.test.ts`, `tests/unit/` bị luật Phase 2 thay; ghi cụ thể từng test, luật cũ/mới và lý do vào `docs/notes/phase2-changes.md`, giữ test không bị thay. Kiểm chứng: `npm test` và đối chiếu diff test với ghi chép.
- [x] T015 [US6] Cổng nhóm A: chạy `npm run build && npm test` trên Đêm 1 và toàn bộ test đã cập nhật trong `tests/`; xác nhận contract v1.1 cho phạm vi A, tất định, mã lỗi và các luật còn hiệu lực. Kiểm chứng: `npm run build && npm test`; **phải xanh trước nhóm B**. Pause và nội dung Đêm 2/3 được kiểm thử bổ sung ở B.

## Nhóm B — P1: hai đảo mới, tính năng lõi và pause

### Đêm 2 / Đêm 3 và gió — US6

**Kiểm chứng độc lập**: mỗi bản đồ có scenario riêng kiểm tra cầu, bục, tầng, dốc, vách, gió và các vị trí đèn/spawn; output xác nhận vị trí và trạng thái theo tick.

- [x] T016 [P] [US6] Tạo `tests/contract/cases/FR2-031-night2.test.ts` và `tests/contract/cases/FR2-032-night3.test.ts` kiểm tra hình học, cầu/vực, bục, dốc/tầng/tháp, đèn và spawn; kiểm chứng: `npm run contract -- FR2-03`.
- [x] T017 [US6] Tạo `src/core/maps/night2.ts`, `src/core/maps/night3.ts`, mở rộng `src/core/physics.ts` và `src/core/world.ts` cho `groundHeight(x,z,yHiện)`, chặn vách/tháp, bục và các trường Map theo [data-model.md](data-model.md); giữ giả định ★ của spec. Kiểm chứng: `npm run contract -- FR2-03`.
- [x] T018 [US6] Tạo `tests/contract/cases/FR2-033-wind.test.ts`; bổ sung gió Đêm 3 vào `src/core/physics.ts`, `src/core/world.ts`, `src/core/step.ts` theo FR2-033, kiểm tra tick 1800, 300 tick gió và seed. Kiểm chứng: `npm run contract -- FR2-033`.

### Gió Lạc — US1

**Kiểm chứng độc lập**: scenario chase/steal và pulse cho thấy sự kiện, số đom đóm và các trạng thái flee/drop/removed đúng.

- [x] T019 [P] [US1] Tạo `tests/contract/cases/FR2-040-drifter.test.ts`, `tests/contract/cases/FR2-043-drifter-pulse.test.ts` cho spawn, idle/chase, cướp, flee, pulse thả đồ và biên bất tử/vùng an toàn. Kiểm chứng: `npm run contract -- drifter`.
- [x] T020 [US1] Tạo `src/core/drifters.ts`, cập nhật `src/core/entities.ts`, `src/core/step.ts`, `src/headless/scenario.ts`, `src/headless/jsonl.ts` theo [data-model.md](data-model.md) `Drifter.id`, `Drifter.pos`, `Drifter.state`, `Drifter.stolen`, `Drifter.timer`, `Drifter.điểm sinh`; cướp xử lý trước shade, giữ giả định ★. Kiểm chứng: `npm run contract -- drifter`.

### Bùa Gió — US2

**Kiểm chứng độc lập**: nhặt bùa → `charm_picked`, 600 tick hiệu lực, chạy 7,2 và dash không cooldown; bùa hồi sinh sau 2700 tick.

- [x] T021 [P] [US2] Tạo `tests/contract/cases/FR2-044-charm.test.ts` cho vị trí, nhặt, làm mới, dash, hồi sinh và trạng thái snapshot; kiểm chứng: `npm run contract -- FR2-044`.
- [x] T022 [US2] Tạo `src/core/charms.ts`, cập nhật `src/core/entities.ts`, `src/core/step.ts`, `src/headless/scenario.ts`, `src/headless/jsonl.ts` theo [data-model.md](data-model.md) `Charm.id`, `Charm.pos`, `Charm.available`, `Charm.respawn` và FR2-044. Kiểm chứng: `npm run contract -- FR2-044`.

### Pause — US3

**Kiểm chứng độc lập**: input pause/resume trên nhiều tick cho thấy `tick` tăng, `sim_tick` và timer đứng yên trong pause, event và snapshot chính xác.

- [x] T023 [P] [US3] Tạo `tests/contract/cases/FR2-002-pause.test.ts` kiểm tra cạnh lên, paused/resumed, đóng băng timer, spawn, TTL và tiếp tục mô phỏng; kiểm chứng: `npm run contract -- FR2-002`.
- [x] T024 [US3] Tạo `src/core/pause.ts`, cập nhật `src/core/step.ts`, `src/headless/inputs.ts`, `src/headless/jsonl.ts` theo FR2-002 và [data-model.md](data-model.md) `World.tick`, `World.sim_tick`, `World.state`; kiểm chứng: `npm run contract -- FR2-002`.
- [x] T025 [US6] Hoàn thiện `tests/contract/cases/FR2-051-all-nights.test.ts`, chạy tất cả scenario mới và test hồi quy; kiểm chứng: `npm run build && npm test`, chỉ chuyển nhóm C khi xanh.

## Nhóm C — P2: web

### Chuỗi ba Đêm và pause menu — US3

**Kiểm chứng độc lập**: `npm run play`, thắng qua ba Đêm, quan sát tổng điểm; thử thua/chơi lại và bốn lựa chọn pause.

- [ ] T026 [US3] Cập nhật `src/web/main.ts`, tạo `src/web/campaign.ts`, `src/web/menu.ts` cho menu → giới thiệu → chơi → kết quả → Đêm tiếp, Bình Minh/tổng điểm, thua chơi lại và pause; theo [data-model.md](data-model.md) `Campaign/settings (web).current night`, `Campaign/settings (web).điểm các Đêm thắng`. Kiểm chứng: `npm run play` và ghi clip vào `docs/proof/phase-2/campaign.mp4`.

### Cài đặt và âm thanh — US4

**Kiểm chứng độc lập**: đổi giá trị, mở lại để kiểm tra lưu; thao tác đủ các sự kiện, nghe nhạc và hiệu ứng.

- [ ] T027 [P] [US4] Tạo `src/web/settings.ts` lưu âm lượng và độ nhạy qua localStorage, theo [data-model.md](data-model.md) `Campaign/settings (web).âm lượng`, `Campaign/settings (web).độ nhạy`. Kiểm chứng: `npm run play`, thay đổi và mở lại, lưu clip `docs/proof/phase-2/settings.mp4`.
- [ ] T028 [P] [US4] Tạo `src/web/audio.ts` dùng WebAudio cho nhạc và hiệu ứng theo Ticket-02; kiểm chứng: `npm run play` và lưu clip có tiếng `docs/proof/phase-2/audio.mp4`.

### HUD, bảng màu và FPS — US5

**Kiểm chứng độc lập**: quan sát đủ HUD, cảnh báo ≤30 s, mũi tên/nhắc nạp; đo màu và FPS 60 s ở 1280×720.

- [ ] T029 [P] [US5] Cập nhật `src/web/hud.ts`, `src/web/style.css` theo FR2-063, gồm đồng hồ nhấp nháy, 10 ô, cooldown, nhắc E và mũi tên; kiểm chứng: `npm run play` và lưu ảnh `docs/proof/phase-2/hud.png`.
- [ ] T030 [P] [US5] Cập nhật `src/web/scene.ts`, `src/web/characters.ts` và tạo `src/web/palette.ts` để dựng ba bản đồ, bảng màu ±10%/kênh và ambient theo tỷ lệ đèn; kiểm chứng: `npm run play`, đo màu/ánh sáng và lưu ảnh `docs/proof/phase-2/palette.png`.
- [ ] T031 [US5] Tạo `src/web/fps.ts`, tích hợp `src/web/main.ts` bộ đếm FPS; đo 60 giây ở 1280×720, ghi kết quả, cấu hình máy và trình duyệt vào `docs/proof/phase-2/perf.md`. Kiểm chứng: `npm run play`, xác nhận ≥30 FPS trung bình hoặc ghi chưa đạt.
- [ ] T032 [US3] Tích hợp `src/web/main.ts`, `src/web/menu.ts`, `src/web/settings.ts`, `src/web/audio.ts`, `src/web/hud.ts`, `src/web/scene.ts` với cùng `core.step()`, bảo đảm pause và UI hiển thị dữ liệu core. Kiểm chứng: `npm run build && npm test`, sau đó `npm run play` và thử luồng end-to-end.

## Nhóm D — Harness, bằng chứng và ghi chép

- [x] T033 [P] Cập nhật `AGENTS.md`, `.agents/skills/verify-game/SKILL.md` cho contract v1.1, 3 Đêm, regression và `npm run verify`; giữ AGENTS dưới 40 dòng. Kiểm chứng: `node -e "const f=require('fs').readFileSync('AGENTS.md','utf8');if(f.trimEnd().split(/\r?\n/).length>=40)process.exit(1)"` và đọc skill.
- [x] T034 Cập nhật `scripts/verify.mjs` để `npm run verify` chạy test và lưu log/JSONL thật vào `docs/proof/phase-2/`, giữ lại bằng chứng Phase 1; kiểm chứng: `npm run verify` và xem kết quả cùng mã thoát.
- [x] T035 [P] Cập nhật `docs/proof/traceability.md` và tạo `docs/proof/phase-2/` liên kết từng FR2 với JSONL/test, ảnh/clip có tiếng hoặc kết quả đo; nêu rõ DoD headless cho tính năng chỉ web còn giới hạn. Kiểm chứng: `npm run verify` và đối chiếu thủ công đường dẫn bằng chứng.
- [x] T036 [P] Cập nhật `docs/notes/phase2-changes.md`, `docs/notes/assumptions.md`, `docs/notes/ai-log.md`, `docs/notes/retro.md`, `README.md` cho Phase 2, giả định ★, xung đột góc, điều khiển, cách test và token; kiểm chứng: `git diff --check` và rà từng test được sửa.
- [x] T037 Đo headless 21.600 tick trên scenario không kết thúc sớm, lưu lệnh, `end.ticks`, thời gian, cấu hình máy vào `docs/proof/phase-2/perf.md`; kiểm chứng: `npm run contract -- performance` và xác nhận ≤30 giây hoặc ghi chưa đạt.
- [ ] T038 Chạy clone sạch theo `README.md`, `npm ci && npm run build && npm test && npm run verify`; rà `docs/proof/phase-2/`, `docs/proof/traceability.md`, CI và nhờ người/phiên khác review độc lập. Kiểm chứng: các lệnh trên và kết quả review lưu `docs/proof/phase-2/review.md`.

## Phụ thuộc và cơ hội song song

Nhóm A → T015 xanh → nhóm B → T025 xanh → nhóm C → nhóm D. Tests `[P]` trong A có thể viết độc lập trước mã tương ứng; T016/T019/T021/T023 là các test riêng trong B sau T015. Các task cùng sửa `src/core/step.ts`, `src/core/world.ts` hoặc `src/web/main.ts` phải nối tiếp khi tích hợp. Trong C, T027–T030 có thể làm song song sau cổng B; T032 tích hợp sau các thành phần. Trong D, T033/T035/T036 có thể thực hiện độc lập, nhưng T035 cần đối chiếu kết quả thực tế của T034 trước khi đánh dấu hoàn tất.

MVP của lượt này là **nhóm A xanh**: Đêm 1 chuẩn hóa, contract v1.1 trong phạm vi A và regression liên quan. Nhóm B hoàn tất các trường hợp pause và ba Đêm trước khi đánh giá toàn bộ contract. Test mới có thể viết trước implementation và phải thất bại vì thiếu hành vi trước khi sửa code.
