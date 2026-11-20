# Feature Specification: Phase 4 — Phát hành v1.0.0 (Ticket-04, Contract v1.3)

**Status**: Ready (Claude soạn từ ticket để tiết kiệm thời gian, ghi ai-log) · **Input**: `docs/ticket-04.md`. Luật/số liệu v1.0–v1.2 giữ nguyên.

## Quyết định kiến trúc (ADR-002, `docs/adr/ADR-002-electron-shell.md`)
Bọc bản web (Three.js + Vite) bằng **Electron** vì ticket cần: cửa sổ 1280×720 tự đóng, tắt vsync (`disable-gpu-vsync`, `disable-frame-rate-limit`), đo RSS tiến trình (`app.getAppMetrics`), lưu bảng xếp hạng **trên đĩa** (`app.getPath('userData')/leaderboard.json`), và lệnh CLI `--export-leaderboard`. Bản web tĩnh (`vite build` → `dist-web/`) vẫn chạy được trên trình duyệt (bảng xếp hạng dùng localStorage) và đính kèm Release.

## Lệnh (game.contract.json v1.3)
- `build_cmd`: `npm ci && npm run build` (build headless + soak + web + electron main)
- `run_cmd`: `npm run game --` (Electron; `npm run game -- --export-leaderboard out.json` xuất rồi thoát, không mở cửa sổ)
- `headless_cmd`: `node dist/headless.js` (không đổi)
- `bench_cmd`: `npm run bench --` → nhận `--seed 42 --duration 30 --out bench.json`
- `soak_cmd`: `node --expose-gc dist/soak.js` → nhận `--seed 7 --nights 10 --out soak.json`
★ Hỏi trợ giảng: `run_cmd` qua `npm run … --` có chấp nhận không; nếu không, dùng `node scripts/game.mjs`.

## FR4 — Benchmark
- **FR4-001** Cửa sổ 1280×720 không fullscreen, vsync tắt (ghi `vsync_off: true`), Đêm 1 đủ hiệu ứng/ánh sáng như chơi thật; **phần sáng tạo thêm tắt**.
- **FR4-002** Cảnh: đúng 200 Bóng Mực `wander` rải đều trên đảo (PRNG seed 42; vị trí đồng đều theo diện tích trong r ≤ 38, cách đèn ≥ 6 m), đúng 100 đom đóm, L1–L3 sáng fuel 100. Cờ lõi `bench` (mặc định tắt, không ảnh hưởng headless): tắt spawn, sát thương, nhặt, hao dầu, kết thúc Đêm; Bóng Mực wander theo luật bình thường. Không input, Mây ở (0,0,0).
- **FR4-003** Camera: θ(t) = 2π·t/15 (t giây kể từ khung đầu cảnh bench), vị trí (30cosθ, 15, 30sinθ), nhìn (0,0,0) — cùng quy ước góc ngược chiều kim đồng hồ như bản đồ (z = r·sinα).
- **FR4-004** 3 s khởi động không đo, sau đó đo đúng `--duration` giây, ghi bench.json, thoát mã 0. Công thức avg_fps, p1_low_fps (k = max(1, ceil(0.01N)), frame_ms_p95 (phân vị 95, nearest-rank), frames, load_ms (từ lúc tiến trình bắt đầu tới khung đầu cảnh bench), peak_mem_mb (tổng RSS các tiến trình Electron, lấy mẫu mỗi 500 ms), renderer (Three.js r… + WebGL renderer string), os.
- **FR4-005** Mục tiêu tự đo: avg ≥ 60, p1 ≥ 30, load ≤ 10 000 ms. Kỹ thuật: InstancedMesh cho Bóng Mực/đom đóm/cỏ, không PointLight trên Bóng Mực, bloom tự tắt nếu vượt ngân sách.

## FR4 — Soak
- **FR4-010** `dist/soak.js`: 10 Đêm trong 1 tiến trình, Đêm i (i = 0..9) = night (i mod 3) + 1, seed 7 + i, chạy tới kết thúc hoặc hết thời lượng chuẩn; input ngẫu nhiên theo seed: mỗi 30 tick chọn lại hướng (vector đơn vị, góc PRNG), mỗi tick xác suất 5% jump, 3% dash, 2% pulse, 10% interact (cạnh lên: frame sau trả false). mem_start_mb sau khi tải Đêm đầu; mem_end_mb sau reset Đêm cuối (gọi `global.gc()` trước khi đo nếu có). Output `{nights, crashes, results[10], mem_start_mb, mem_end_mb, duration_s}`; mỗi Đêm bọc try/catch đếm crash. Ngưỡng: crashes 0, mem_end ≤ 1.2 × mem_start.

## FR4 — Bảng xếp hạng
- **FR4-020** Sau Bình Minh (thắng Đêm 3) hoặc khi thua ở bất kỳ Đêm nào: nhập tên 3–12 ký tự `[A-Za-z0-9_]` (cộng: chữ tiếng Việt có dấu `\p{L}`), báo lỗi khi sai.
- **FR4-021** Mục: `{name, score, nights_won, achieved_at (ISO 8601 có múi giờ, vd 2026-11-20T18:05:00+07:00), seed}`; top 10; score giảm dần, bằng điểm thì achieved_at sớm hơn đứng trên.
- **FR4-022** Lưu đĩa (Electron userData), còn sau khi tắt/mở; menu chính có màn Bảng xếp hạng.
- **FR4-023** `--export-leaderboard out.json` → `{"entries":[…]}` đúng thứ tự, thoát 0, không mở cửa sổ. Logic sắp xếp/validate là module thuần `src/core/leaderboard.ts` có unit test.

## FR4 — Accessibility
- **FR4-030** Đổi phím cho: tiến, lùi, trái, phải, nhảy, lướt, tương tác, tỏa sáng, tạm dừng; phát hiện trùng phím và báo; "Khôi phục mặc định"; lưu.
- **FR4-031** Phụ đề/chỉ báo: "Bóng Mực xuất hiện" + mũi tên ở mép màn hình chỉ hướng; "Gió sắp thổi" (2 s trước); "10 giây cuối"; "Đèn Lx sắp cạn dầu" khi fuel < 30.
- **FR4-032** Giảm chuyển động: tắt rung camera và chớp màn hình.
- **FR4-033** Chữ UI ≥ 18 px ở 1280×720; tùy chọn chữ lớn ×1.25. Tất cả lưu trong Cài đặt.

## FR4 — Sáng tạo & hình ảnh (rubric F, tắt ở headless/bench/soak)
- **FR4-040** Cập nhật Mây và giao diện theo `docs/design/visual-brief.md` (C1, C3, C4 ưu tiên), giữ bench ≥ 60 FPS.
- **FR4-041** Ý sáng tạo chính "**Ông Đăng & Đom Đóm Dẫn Đường**": ông Đăng (người giữ hải đăng già, NPC ở bến) nói lời gợi ý ngắn đầu mỗi Đêm; nhấn phím Gợi ý (mặc định H) thì một vệt đom đóm bay từ Mây tới đèn sáng có fuel thấp nhất (hoặc đèn tắt gần nhất). Thuần hiển thị, không đổi luật; tắt trong headless/bench/soak. Bằng chứng: SHA256 JSONL trước/sau giống hệt + ảnh.

## FR4 — Đóng gói & tài liệu
- **FR4-050** README: mô tả, ảnh/GIF, yêu cầu hệ thống (Node ≥ 20, macOS/Linux/Windows, GPU WebGL2), cài đặt ≤ 3 lệnh, điều khiển, test, headless, bench, soak, xuất bảng xếp hạng, mục Sáng tạo của tôi, link video ở đầu.
- **FR4-051** CHANGELOG có mục cả 4 phase; CREDITS (Three.js MIT, Electron MIT, công cụ AI: Claude, Codex, Antigravity, công cụ tạo ảnh concept nếu có); LICENSE MIT.
- **FR4-052** Release v1.0.0: `dao-den-long-web-v1.0.0.zip` (thư mục web tĩnh) + hướng dẫn chạy từ mã nguồn; tag `phase-4`.
- **FR4-053** `docs/proof/phase-4/bench.json`, `soak.json` (tự chạy, commit), `docs/notes/retro-final.md` (1–2 trang), video `docs/demo/demo.mp4` hoặc gắn Release.
- **FR4-054** Mọi test v1.0–v1.2 vẫn xanh; contract 1.3 + test khớp tuning.
