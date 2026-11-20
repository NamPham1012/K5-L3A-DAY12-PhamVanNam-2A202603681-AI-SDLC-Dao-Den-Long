# Các bước spec-kit tiếp theo

Cài và khởi tạo (một lần, trong repo game):

```bash
uv tool install specify-cli
specify init . --integration claude     # hoặc copilot/cursor… tuỳ agent bạn dùng
```

Sau đó chép đè các file trong gói này vào repo (`.specify/memory/constitution.md`, `specs/001-phase1-night1/spec.md`, `docs/`, `game.contract.json`). Nếu `/speckit-specify` đã tạo branch khác tên, đổi tên thư mục spec cho khớp.

Chạy lần lượt trong chat của agent, đọc kết quả từng bước trước khi đi tiếp:

1. `/speckit-clarify` — nên chạy lại 1 lần để agent xác nhận không còn chỗ mơ hồ lớn (đã chốt 4 câu; còn `fall_enabled` là giả định).
2. `/speckit-plan` với nội dung:

   > TypeScript strict. Lõi mô phỏng thuần trong `src/core/` (không import three, không DOM, không Date/Math.random; PRNG mulberry32 có seed). `src/headless/cli.ts` chạy trên Node ≥ 20, build bằng esbuild ra `dist/headless.js`. `src/web/` dùng Three.js + Vite, gọi cùng `core.step()` với bước cố định 1/60 s và nội suy khi render. Cấu hình duy nhất `src/core/tuning.ts`; script `npm run contract` sinh/kiểm `game.contract.json`. Test bằng Vitest: unit cho lõi, test contract chạy CLI với scenario/inputs trong `tests/contract/cases/`, test tất định chạy 2 lần so byte. Lệnh: `npm ci && npm run build`, `npm run play`, `node dist/headless.js`.

3. `/speckit-tasks` — kiểm tra các task contract/headless đứng trước task đồ hoạ (Constitution, mục Quy trình).
4. `/speckit-analyze` — bắt chỗ lệch giữa spec, plan, tasks.
5. `/speckit-implement` rồi `/speckit-converge`, lặp đến khi báo `Converged`.

Trước khi tag `phase-1`: README (≤ 3 lệnh, điều khiển, cách tính điểm, giải thích `fall_enabled=false`, mục "Sáng tạo của tôi"), thư mục `evidence/` (JSONL + kết quả test + ảnh/GIF), `docs/ai-log.md`, `docs/assumptions.md`, và điền `team` thật trong `game.contract.json`.
