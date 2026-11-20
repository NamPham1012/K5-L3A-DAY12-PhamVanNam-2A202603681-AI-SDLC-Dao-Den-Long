# CLI contract v1.0

Nguồn chuẩn: `docs/prd-0.md`, mục A–B; [spec.md](../spec.md).

```text
node dist/headless.js --seed <int> --night 1 [--scenario <file.json>] [--inputs <file.json>] --ticks <int> --out <file.jsonl> [--snapshot-every <int>]
```

- Snapshot interval mặc định 10 và phải dương; `--night` chỉ nhận 1. Input/scenario sai định dạng và tham số sai: mã 2, lỗi ra stderr; lỗi khác mã khác 0. Chạy thành công mã 0.
- Tick 0 là trạng thái sau dựng; bước k đọc input tick k và tạo trạng thái/sự kiện tick k+1. Dừng khi đủ số bước hoặc thắng/thua; không mở cửa sổ hay dùng GPU.
- `game.contract.json` ở gốc có contract_version `1.0`, team, build_cmd `npm ci && npm run build`, run_cmd `npm run play`, headless_cmd `node dist/headless.js` và đầy đủ tuning theo PRD-0, khớp runtime.
