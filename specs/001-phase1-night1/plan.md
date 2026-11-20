# Implementation Plan: Phase 1 — Đêm 1 · Đảo Bến

**Branch**: `main` | **Date**: 2026-11-20 | **Spec**: [spec.md](spec.md)

**Input**: `specs/001-phase1-night1/spec.md`; Test Contract v1.0 trong `docs/prd-0.md`.

## Summary

Làm một màn 3D chơi được và mô phỏng headless tất định theo contract. Hai chế độ gọi cùng lõi TypeScript thuần `step()` ở 60 tick/giây; ưu tiên hoàn thành và kiểm thử contract trước giao diện.

## Technical Context

**Language/Version**: TypeScript strict; Node.js ≥ 20 cho headless và công cụ.

**Primary Dependencies**: Three.js, Vite, esbuild, Vitest.

**Storage**: JSON đầu vào, JSONL đầu ra, `game.contract.json` ở gốc; không cần cơ sở dữ liệu.

**Testing**: Vitest unit và scenario contract; `npm test` chạy tất cả, gồm so byte hai lần và so tuning; `npm run verify` chạy test và ghi bằng chứng thật.

**Target Platform**: trình duyệt, Node trên macOS/Linux; phát triển Windows, script package đa nền tảng.

**Project Type**: game web 3D + CLI headless.

**Performance Goals**: 18.000 bước thực tế dưới 2 giây trên máy phát triển, ghi cấu hình và kết quả trong `docs/proof/phase-1/perf.md`; không coi thời gian kết thúc sớm là phép đo hợp lệ.

**Constraints**: 60 bước/giây mô phỏng; headless không cửa sổ/GPU; cùng seed/scenario/inputs ra JSONL giống byte; tối đa 3 lệnh từ clone đến chơi; tuân thủ Test Contract v1.0.

**Scale/Scope**: một đảo, 5 đèn, 50 đom đóm ban đầu, tối đa 6 shade; không quyết định nội dung các phase sau.

## Constitution Check

| Cổng | Trước nghiên cứu và sau thiết kế |
|---|---|
| I. Test Contract | Đạt về thiết kế: CLI, input, scenario, JSONL và lỗi truy vết về PRD-0; kiểm thử sau triển khai. |
| II. Lõi tách hiển thị | Đạt về thiết kế: `src/core/` thuần; CLI và web gọi cùng `step()`. |
| III. Tất định | Đạt về thiết kế: mulberry32 có seed thuộc world, id và thứ tự duyệt ổn định, bước cố định, so output byte. |
| IV. Bằng chứng | Có sai lệch: constitution yêu cầu mỗi FR có scenario JSON và kiểm tra JSONL, nhưng các FR về giao diện, tài liệu, hook và CI không thể chứng minh chỉ bằng JSONL. Xem Complexity Tracking. |
| V. Đúng yêu cầu trước sáng tạo | Đạt về thiết kế: lõi và test trước giao diện; phần sáng tạo tắt ở headless. |
| VI. Một nguồn tham số | Đạt về thiết kế: `src/core/tuning.ts` là nguồn duy nhất; test đối chiếu `game.contract.json.tuning`. |

## Project Structure

### Documentation (this feature)

```text
specs/001-phase1-night1/
├── spec.md, plan.md, research.md, data-model.md, quickstart.md
├── contracts/cli.md, inputs-scenario.md, jsonl.md
└── checklists/requirements.md
```

### Source Code (repository root)

```text
src/core/                 # mô phỏng, PRNG, tuning; không DOM/Three.js/I/O/đồng hồ
src/headless/cli.ts       # tham số, xác thực, xuất JSONL
src/web/                  # Three.js, input, HUD, vòng lặp cố định
tests/unit/               # Vitest cho lõi
tests/contract/cases/     # scenario/inputs theo FR, kết quả mong đợi
tests/contract/           # CLI, sự kiện, tất định, tuning
docs/proof/phase-1/       # output, log, ảnh, perf.md từ chạy thật
docs/notes/               # giả định, nhật ký AI, retro
.agents/skills/verify-game/SKILL.md
.github/workflows/ci.yml
AGENTS.md
game.contract.json
```

**Structure Decision**: Một dự án với lõi duy nhất, hai adapter; esbuild tạo `dist/headless.js`, Vite phục vụ bản chơi. Giữ `package-lock.json` để `npm ci` chạy được; không dùng PowerShell trong scripts. Hook `pre-push` cần hướng dẫn cài/kích hoạt trong clone; nó chặn push khi test lỗi, không tự chặn tạo tag cục bộ. `AGENTS.md` dưới 40 dòng ghi lệnh build/test/headless, quy ước, điều cấm và yêu cầu chạy `npm test` trước khi báo xong. CI chạy `npm ci && npm test`.

**Thứ tự thực hiện**: (1) tuning, PRNG, lõi và test unit; (2) CLI/contract, kịch bản biên và bằng chứng; (3) web sử dụng cùng lõi; (4) harness, CI, tài liệu, đo hiệu năng và kiểm tra clone sạch. `game.contract.json` dùng `build_cmd: "npm ci && npm run build"`, `run_cmd: "npm run play"`, `headless_cmd: "node dist/headless.js"`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Constitution IV yêu cầu JSONL tự động cho từng FR, kể cả giao diện và bàn giao | JSONL chỉ mô tả trạng thái/sự kiện mô phỏng; ảnh HUD, README, hook và CI cần bằng chứng riêng. Sai lệch này chưa được sửa trong constitution. | Chỉ chạy JSONL không chứng minh được các yêu cầu đó. Dùng JSONL cho phần quan sát được, kết hợp ảnh/log/kiểm tra file thực cho phần còn lại. |
