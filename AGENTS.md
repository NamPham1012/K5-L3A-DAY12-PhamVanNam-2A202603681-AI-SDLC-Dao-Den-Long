# Hướng dẫn Agent — Đảo Đèn Lồng (Phase 1)

## Lệnh vận hành
- Cài đặt & Build: `npm ci && npm run build`
- Chạy kiểm thử: `npm test`
- Chạy headless: `node dist/headless.js --seed <int> --night 1 [--scenario <file.json>] [--inputs <file.json>] --ticks <int> --out <file.jsonl> [--snapshot-every 10]`
- Chạy web: `npm run play`

## Quy ước lõi thuần (src/core/)
- `src/core/` là mô phỏng thuần túy: không Three.js, không DOM, không I/O ngoài tham số.
- CẤM dùng `Math.random` hay `Date` trong `src/core/`. Dùng PRNG mulberry32 có seed.
- Bước thời gian cố định 60 tick/giây. Mọi thứ tự duyệt thực thể phải sắp theo ID tăng dần.
- Nguồn sự thật duy nhất cho thông số là `src/core/tuning.ts`, khớp `game.contract.json`.

## Nguyên tắc hoàn thành
- Luôn chạy `npm test` và đảm bảo 100% test xanh trước khi báo xong.
- Cùng seed, scenario, inputs phải sinh file JSONL giống hệt từng byte.
