# Tasks: Phase 4 (90 phút, hạn 19:00) — thứ tự bắt buộc

## A. Bắt buộc chấm tự động (17:30–18:05) → tag phase-4 lần 1
- [ ] T001 Cờ lõi `bench` (tắt spawn/sát thương/nhặt/hao dầu/kết thúc) + test chứng minh mặc định không đổi JSONL.
- [ ] T002 `src/soak/soak.ts` → `dist/soak.js` (FR4-010) + test chạy `--nights 2`.
- [ ] T003 Electron: `electron/main.ts` (cửa sổ 1280×720, cờ vsync, đo RSS, userData), `npm run game`, `npm run bench`.
- [ ] T004 Cảnh bench + camera + đo (FR4-001..005); ghi bench.json; test đơn vị cho công thức avg/p1/p95.
- [ ] T005 `src/core/leaderboard.ts` (validate, sort, top 10) + unit test; lưu đĩa + `--export-leaderboard`.
- [ ] T006 `game.contract.json` v1.3 (bench_cmd, soak_cmd) + test khớp.
- [ ] T007 Chạy thật bench + soak, commit `docs/proof/phase-4/{bench,soak}.json`.
## B. Accessibility + màn hình (18:05–18:25)
- [ ] T008 Đổi phím + trùng phím + khôi phục mặc định (FR4-030).
- [ ] T009 Phụ đề/chỉ báo + mũi tên mép màn hình (FR4-031); giảm chuyển động; chữ ≥ 18 px, ×1.25.
- [ ] T010 Màn nhập tên + màn Bảng xếp hạng từ menu.
## C. Hình ảnh & sáng tạo (18:25–18:40) — chạy lại bench sau khi xong
- [ ] T011 Visual brief C3 (Mây) + C1 (trời/ánh sáng) + C4 (Bóng Mực instanced).
- [ ] T012 Ông Đăng & Đom Đóm Dẫn Đường (FR4-041).
## D. Phát hành (18:40–18:58)
- [ ] T013 README, CHANGELOG (4 phase), CREDITS, LICENSE, AGENTS.md v1.3, traceability Phase 4, retro-final.
- [ ] T014 `vite build` → zip web; Release v1.0.0; video ≤ 5 phút; tag phase-4 cuối.
