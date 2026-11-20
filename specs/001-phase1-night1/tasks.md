---
description: "Nhiệm vụ triển khai Phase 1 — Đêm 1 · Đảo Bến"
---

# Tasks: Phase 1 — Đêm 1 · Đảo Bến

**Input**: [spec.md](spec.md), [plan.md](plan.md), [data-model.md](data-model.md), [research.md](research.md), [contracts/](contracts/), [quickstart.md](quickstart.md), `docs/prd-0.md`.

**Quy ước**: `[P]` chỉ các task độc lập trong cùng giai đoạn, khác file, không phụ thuộc task chưa hoàn thành; `[USn]` truy vết user story. Mỗi case headless là một file riêng trong `tests/contract/cases/`, tên gắn mã FR; runner phải kiểm tra giá trị JSONL và mã thoát thực tế. Với test viết trước code, lệnh kiểm chứng ban đầu phải thất bại đúng lý do, sau triển khai phải xanh. Lệnh trong tài liệu là mục tiêu sau khi script được tạo.

## Nhóm 1 — Setup & harness

- [x] T001 Tạo `package.json`, `package-lock.json` với TypeScript strict, Three.js, Vite, esbuild, Vitest, scripts `build`, `test`, `verify`, `play`, `contract`; các script đa nền tảng, build headless `dist/headless.js`, `npm test` tự chuẩn bị build cần thiết và `prepare` cài hook. Kiểm chứng: `npm ci` và `npm run`.
- [x] T002 [P] Tạo `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `esbuild.config.mjs` với kiểm tra TypeScript strict và cấu hình build/test; kiểm chứng: `npm run build` sau khi có entry point nhóm 2 và 3.
- [x] T003 [P] Tạo `AGENTS.md` dưới 40 dòng, có lệnh build/test/headless, quy ước lõi thuần và yêu cầu chạy `npm test` trước khi báo xong; kiểm chứng: `node -e "const f=require('fs').readFileSync('AGENTS.md','utf8');if(f.trimEnd().split(/\r?\n/).length>=40)process.exit(1)"`.
- [x] T004 [P] Tạo `.agents/skills/verify-game/SKILL.md` mô tả chạy verify, thu thập bằng chứng thật và báo lỗi; kiểm chứng: `node -e "require('fs').accessSync('.agents/skills/verify-game/SKILL.md')"`.
- [x] T005 [P] Tạo `.githooks/pre-push` chạy `npm test` và `scripts/install-hooks.mjs` cấu hình `core.hooksPath=.githooks`, bảo đảm hook thực thi được trên macOS/Linux/Windows; kiểm chứng: `node scripts/install-hooks.mjs` rồi `git config --get core.hooksPath`; sau nhóm 2 kiểm tra test lỗi chặn push và test xanh cho push.
- [x] T006 [P] Tạo `.github/workflows/ci.yml` chạy Ubuntu, Node 20, `npm ci` và `npm test`; kiểm chứng: `npm ci && npm test` cục bộ sau nhóm 2 và xem kết quả CI sau push.

## Nhóm 2 — MVP headless: phải xanh trước nhóm 3

### Nền tảng và hợp đồng — US1 (P1)

**Kiểm chứng độc lập US1**: scenario tắt sinh ngẫu nhiên và inputs rỗng, 120 tick → 13 snapshot, vị trí không đổi, `end.ticks=120`; input sai mã 2; hai lần cùng đầu vào giống byte.

- [ ] T007 [US1] Tạo `src/core/tuning.ts`, `game.contract.json` với tuning duy nhất, lệnh build/run/headless theo plan và team thật; tạo `tests/contract/cases/FR-061-tuning.test.ts` đối chiếu mọi trường tuning với runtime. Kiểm chứng: `npm run contract -- FR-061-tuning`.
- [ ] T008 [P] [US1] Tạo `src/core/rng.ts` mulberry32 có seed và `tests/unit/rng.test.ts` xác nhận chuỗi lặp lại, độc lập với `Math.random`; kiểm chứng: `npm test -- rng`.
- [ ] T009 [US1] Tạo `src/core/entities.ts`, `src/core/world.ts` với quan hệ và các trường ràng buộc theo [data-model.md](data-model.md): `World.tick`, `World.time_left_s`, `World.state`, `Player.pos`, `Player.carried`, `Player.flames`, `Mote.id`, `Mote.pos`, `Mote.active`, `Lantern.id`, `Lantern.deposited`, `Lantern.lit`, `Shade.id`, `Shade.state`, `Input state.move`; PRNG và bộ đếm thuộc world. Kiểm chứng: `npm test -- world` với `tests/unit/world.test.ts`.
- [ ] T010 [P] [US1] Tạo từng case `tests/contract/cases/FR-040-idle.test.ts`, `FR-044-invalid-input.test.ts`, `FR-040-determinism.test.ts` cho tick 0–120, input/JSON lỗi mã 2, so byte hai lần; kiểm chứng: `npm run contract -- FR-040` và `npm run contract -- FR-044`.
- [ ] T011 [US1] Tạo `src/headless/inputs.ts`, `src/headless/scenario.ts` và `tests/unit/parsers.test.ts`: validate schema, giữ giá trị vắng, tick tăng nghiêm ngặt, scenario theo `contracts/inputs-scenario.md`, lỗi mã 2; kiểm chứng: `npm test -- parsers`.
- [ ] T012 [US1] Tạo `src/headless/jsonl.ts`, `src/headless/cli.ts`, `tests/contract/runner.test.ts` với cú pháp/exit code contract, tick 0, event trước snapshot, end cuối, dừng khi kết thúc; kiểm chứng: `npm run build` và `npm run contract -- FR-040`.

### Thu thập và thắp đèn — US2 (P1)

**Kiểm chứng độc lập US2**: scenario đặt mote và L1 gần người chơi, nạp còn thiếu một; JSONL tick 1 lần lượt có `mote_picked`, `deposit`, `lantern_lit`.

- [ ] T013 [P] [US2] Tạo các case riêng `tests/contract/cases/FR-003-pickup-deposit.test.ts`, `FR-003-capacity.test.ts`, `FR-010-interact-edge.test.ts`, `FR-003-replenish.test.ts`: nhặt+nạp+thắp, đầy carry, giữ interact, sinh bù tick 119/120/121 và `random_motes=false`. Kiểm chứng: `npm run contract -- FR-003` và `npm run contract -- FR-010`.
- [ ] T014 [US2] Tạo `src/core/step.ts`, `src/core/motes.ts`, `src/core/lanterns.ts` thực hiện chuyển động, nhảy, nhặt, nạp, tính điểm, spawn theo FR-001–003/010/011/021; lắp thứ tự bước FR-010. Kiểm chứng: `npm test` và các case T013.

### Bóng Mực và sát thương — US3 (P1)

**Kiểm chứng độc lập US3**: một shade chạm player có một flame → `player_hit` rồi `game_over lost/no_flames` tick 1; thêm scenario xác nhận bất tử và vùng an toàn.

- [ ] T015 [P] [US3] Tạo các case riêng `tests/contract/cases/FR-031-hit-invuln.test.ts`, `FR-030-safe-radius.test.ts`, `FR-032-drop.test.ts`, `FR-004-spawn.test.ts` xác nhận va chạm/bất tử, safe_radius đèn đã thắp, rơi vòng 3 m, hai shade ban đầu và sinh tick 1800 cùng giới hạn 6; kiểm chứng: `npm run contract -- FR-03` và `npm run contract -- FR-004`.
- [ ] T016 [US3] Tạo `src/core/shades.ts`, `src/core/damage.ts` và tích hợp vào `src/core/step.ts` để chase, vùng an toàn, trúng đòn, rơi, bất tử và sinh shade theo FR-004/030–032. Kiểm chứng: `npm test` và các case T015.

### Tỏa sáng — US4 (P2)

**Kiểm chứng độc lập US4**: shade trong pulse_radius, carried bằng pulse_cost; tick 1 có pulse chứa S1, carried 0, S1 stunned và không có player_hit.

- [ ] T017 [P] [US4] Tạo các case riêng `tests/contract/cases/FR-010-pulse-enough.test.ts`, `FR-010-pulse-insufficient.test.ts`, `FR-010-pulse-cooldown.test.ts` xác nhận chi phí, choáng/đẩy/điểm, không đủ và hồi chiêu; kiểm chứng: `npm run contract -- pulse`.
- [ ] T018 [US4] Tạo `src/core/pulse.ts` và kết nối `src/core/step.ts` để xử lý pulse cạnh lên trước va chạm, đúng bán kính, điểm và hồi chiêu; kiểm chứng: `npm run contract -- pulse`.

### Kết thúc, hợp đồng và cổng MVP

- [ ] T019 [P] [US2] Tạo case riêng `tests/contract/cases/FR-010-all-lit.test.ts` kiểm tra đèn dựng sẵn không cộng điểm, thắng tick 1 và thưởng thắng; kiểm chứng: `npm run contract -- all-lit`.
- [ ] T020 [P] [US3] Tạo case riêng `tests/contract/cases/FR-010-no-flames.test.ts`, `FR-010-dawn.test.ts`, `FR-010-end-priority.test.ts` kiểm tra thua hết lửa, hết giờ và thứ tự ưu tiên; kiểm chứng: `npm run contract -- FR-010`.
- [ ] T021 [US1] Hoàn thiện `src/core/step.ts`, `src/core/world.ts` và `src/headless/cli.ts` cho điều kiện thắng/thua, thời gian, event/end và thứ tự cố định; kiểm chứng: `npm run build && npm test`.
- [ ] T022 [US1] Chạy toàn bộ các case độc lập và unit tại `tests/contract/`, `tests/unit/`, xác nhận tối thiểu 15 scenario, tuning khớp và test so byte; kiểm chứng: `npm run build && npm test`. **Cổng bắt buộc**: mọi test xanh trước bất kỳ task nhóm 3.

## Nhóm 3 — Web (sau T022) — US5 (P2)

**Kiểm chứng độc lập US5**: scenario 5 đèn đã thắp tạo JSONL `won/all_lit` tick 1; chạy giao diện, quan sát HUD/ánh sáng, chơi đến kết thúc và nhấn R để reset seed mới.

- [ ] T023 [P] [US5] Tạo `src/web/scene.ts`, `src/web/characters.ts` dựng đảo, Mây nón lá treo đèn, shade tím đen, đèn vàng cam và ánh sáng đảo tăng khi thắp; kiểm chứng: `npm run play` và quan sát cảnh trên trình duyệt.
- [ ] T024 [P] [US5] Tạo `src/web/input.ts`, `src/web/camera.ts` cho camera theo sau/xoay, WASD theo camera, Space/E/Q và R; kiểm chứng: `npm run play` và thao tác từng phím.
- [ ] T025 [P] [US5] Tạo `src/web/hud.ts`, `src/web/style.css` cho lửa, carried/capacity, đèn, thời gian, điểm, hồi chiêu và màn thắng/thua, nút chơi lại; kiểm chứng: `npm run play` và quan sát đủ trạng thái.
- [ ] T026 [US5] Tạo `src/web/main.ts`, `index.html` tích hợp cảnh, input, HUD với cùng `core.step()` mỗi bước 1/60 giây, chơi lại seed mới; tạo `tests/contract/cases/FR-010-ui-win.test.ts` cho scenario 5 đèn lit. Kiểm chứng: `npm run build && npm test`, sau đó `npm run play` và chơi đến thắng/thua, nhấn R.

## Nhóm 4 — Bàn giao

- [ ] T027 Tạo `scripts/verify.mjs` và kết nối `package.json` để `npm run verify` chạy test và lưu log/JSONL thật vào `docs/proof/phase-1/`, mã lỗi khác 0 khi test lỗi; kiểm chứng: `npm run verify` và xem log thực tế.
- [ ] T028 [P] Tạo `docs/proof/traceability.md` liên kết từng FR tới scenario/test hoặc ảnh, thao tác kiểm tra và kết quả đạt/chưa đạt; kiểm chứng: `npm run verify` rồi đối chiếu các đường dẫn bằng chứng và kiểm tra thủ công các FR giao diện/bàn giao.
- [ ] T029 [P] Bổ sung `docs/notes/ai-log.md`, `docs/notes/retro.md`, cập nhật `docs/notes/assumptions.md` với giả định, lỗi AI, ước tính token/chi phí, đánh giá Phase 1; kiểm chứng: `node -e "for(const f of ['ai-log.md','retro.md','assumptions.md'])require('fs').accessSync('docs/notes/'+f)"` và đọc nội dung.
- [ ] T030 [P] Viết `README.md` với cài/chạy ≤ 3 lệnh, điều khiển, cách tính điểm, test/headless, `fall_enabled=false`, giá trị null/false, mục “Sáng tạo của tôi” và bằng chứng; kiểm chứng: clone sạch theo README, chạy `npm ci && npm run build`, `npm run play`, `npm test` trên macOS/Linux.
- [ ] T031 [P] Tạo `LICENSE`, `CREDITS.md` ghi giấy phép và nguồn asset/công cụ AI thực tế; kiểm chứng: `node -e "for(const f of ['LICENSE','CREDITS.md'])require('fs').accessSync(f)"` và đối chiếu nguồn.
- [ ] T032 Đo đúng 18.000 bước không kết thúc sớm, ghi thời gian thực và cấu hình máy tại `docs/proof/phase-1/perf.md`; kiểm chứng: `npm run contract -- performance`, xác nhận `end.ticks=18000` và thời gian < 2 s; ghi chưa đạt trung thực nếu vượt.
- [ ] T033 Kiểm tra đầy đủ `docs/proof/traceability.md`, output của `npm run verify`, `README.md`, CI và hook từ clone sạch; kiểm chứng: `npm ci && npm run build && npm test && npm run verify`; yêu cầu người hoặc phiên review khác kiểm tra kết quả, ghi rõ sai lệch constitution và mục chưa đạt.
- [ ] T034 [US5] **Tùy chọn, cuối cùng**: thêm một điểm sáng tạo gọn trong `src/web/` và mô tả/bằng chứng trong `README.md`; đảm bảo không ảnh hưởng headless. Kiểm chứng: `npm test` và so byte JSONL cùng seed/scenario/inputs trước và sau thay đổi.

## Phụ thuộc và thứ tự

Nhóm 1 → nền tảng US1 (T007–T012) → gameplay US2/US3/US4 và kết thúc (T013–T021) → T022 xanh → nhóm 3 US5 → nhóm 4. Các case kiểm thử có thể viết trước phần code tương ứng và ban đầu phải thất bại. Không bắt đầu nhóm 3 trước T022. T027 hoàn tất trước T033; T028–T031 có thể làm song song sau nhóm 3. T034 là tùy chọn và chỉ sau bàn giao chính.

**Cơ hội song song theo story**: sau nền tảng, các case T013, T015 và T017 độc lập; T019 và T020 là hai file/cụm test riêng. T023–T025 có thể song song sau T022, sau đó T026 tích hợp. Các task chỉnh cùng `src/core/step.ts` phải nối tiếp; không đánh `[P]` cho chúng.

## Chiến lược triển khai

MVP của yêu cầu này là **toàn bộ nhóm 2 headless xanh**, gồm US1–US4 và các điều kiện kết thúc, không chỉ US1. Dùng test độc lập của từng story để kiểm tra tăng dần, sau đó mới dựng web; `npm run verify` lưu bằng chứng thật, SC-004 kiểm tra thủ công không chặn.
