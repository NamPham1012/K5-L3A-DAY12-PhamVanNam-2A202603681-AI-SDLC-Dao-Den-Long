# Hướng dẫn Agent — Đảo Đèn Lồng (Phase 2 · Contract v1.1)

## Lệnh vận hành
- Cài đặt & Build: `npm ci && npm run build`
- Kiểm thử hồi quy & contract: `npm test` (tự build trước khi chạy Vitest)
- Chạy headless (3 Đêm): `node dist/headless.js --seed <int> --night 1|2|3 [--scenario <file.json>] [--inputs <file.json>] --ticks <int> --out <file.jsonl> [--snapshot-every 10]`
- Chạy web: `npm run play` · Thu thập bằng chứng: `npm run verify`

## Quy ước lõi thuần (src/core/)
- `src/core/` thuần TypeScript: không Three.js, không DOM, không I/O ngoài tham số.
- CẤM dùng `Math.random` hay `Date` trong `src/core/`. Dùng PRNG mulberry32 có seed thuộc `World`.
- 60 tick/giây, đúng thứ tự 12 bước của `docs/ticket-02.md`; duyệt thực thể theo ID tăng dần.
- Số liệu chỉ lấy từ `docs/ticket-02.md`; nguồn duy nhất là `src/core/tuning.ts`, khớp `game.contract.json` (Contract v1.1).
- Góc điểm sinh cố định theo `(r·cosα, 0, r·sinα)`.

## Nguyên tắc hoàn thành
- Luôn chạy `npm test` (100% xanh) trước khi báo xong.
- Cùng seed, night, scenario, inputs phải sinh JSONL giống hệt từng byte (SHA-256 trùng khớp).
- Sửa test Phase 1 bị luật mới thay phải ghi lý do vào `docs/notes/phase2-changes.md`, không xoá âm thầm.

## Điều cấm
- KHÔNG sửa `docs/proof/**/review-*.md` (do reviewer độc lập viết).
- KHÔNG ghi ĐẠT trong `docs/proof/traceability.md` nếu chưa có bằng chứng chạy thật.
