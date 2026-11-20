# Tasks: Phase 3 — Đèn cạn dầu (30 phút)

Spec: `spec.md`. ADR: `docs/adr/ADR-001-lantern-fuel-dawn-win.md`. Thứ tự bắt buộc A → B → C. Mỗi nhóm xong: `npm test` xanh.

## Nhóm A — Lõi + contract v1.2 (P0)
- [X] T001 `src/core/tuning.ts` + `game.contract.json` v1.2 (khoá mới, thời lượng 240/270/300, score keys); cập nhật test tuning.
- [ ] T002 Đèn: `fuel_u`, `ever_lit`, `relit_count`; thắp (10/5), châm dầu, chọn đèn mới (FR3-001..005) — `src/core/lanterns.ts`.
- [X] T003 `step.ts` bước 2: hao + drain, ngay sau đó tắt đèn `lantern_out` (FR3-002).
- [ ] T004 Sức chứa động (FR3-030) — nhặt dùng capacity.
- [ ] T005 Bóng Mực: wander có mục tiêu 2 m/s, `drain`, chuyển trạng thái, vùng an toàn theo fuel ≥ 30, đẩy ra khi châm ≥ 30, `fuel_drain` mỗi 60 tick, `target_lantern_id` (FR3-010..015) — `src/core/shades.ts`.
- [ ] T006 Thắng/thua mới + điểm mới (FR3-020..021, FR3-040) — bỏ all_lit, thêm dawn_survived.
- [ ] T007 Snapshot/scenario/event v1.2 (FR3-050..053) — `src/headless/*`.
- [X] T008 Test Phase 1–2 bị thay: cập nhật hoặc xoá **kèm lý do** trong `docs/notes/phase3-changes.md` (không `skip`). Danh sách tối thiểu: all-lit, end-priority, ui-win, deposit-score, pulse-score, dawn, durations, tuning.
- [ ] T009 Mỗi acceptance 1–10 trong spec → `tests/contract/cases/FR3-*.test.ts` (chạy CLI thật).

## Nhóm B — Web (P1)
- [ ] T010 Thanh dầu trên đèn, nhấp nháy 1 Hz khi < 30, ambient theo đèn đang sáng.
- [ ] T011 Màn Cài đặt (âm lượng, độ nhạy chuột, Bảng màu dễ phân biệt) lưu localStorage; áp dụng đổi màu Bóng Mực, cảnh báo ⚠, đèn tắt xẹp 20% + rách.
- [ ] T012 HUD: carried/capacity, đèn sáng/ngưỡng thắng.

## Nhóm C — Bàn giao
- [ ] T013 AGENTS.md: contract v1.2, "luật thắng mới", "dầu là số nguyên 1/60"; skill verify chạy scenario FR3.
- [ ] T014 traceability Phase 3, ai-log (Claude soạn spec/ADR do 30 phút), retro Phase 3.
