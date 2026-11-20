# Quickstart và kiểm chứng Phase 1

Tài liệu này là kế hoạch chạy **sau khi triển khai**, chưa khẳng định các lệnh hoặc game đã tồn tại.

1. Cài Node.js ≥ 20 trên macOS/Linux, clone repo sạch. Chạy `npm ci && npm run build`.
2. Chạy `npm test`: unit, scenario contract, so byte và tuning đều đạt. Chạy `npm run verify` để lưu log và JSONL thật vào `docs/proof/phase-1/`.
3. Chạy `npm run play`, chơi đến thắng/thua, quan sát HUD, ánh sáng và chơi lại; lưu ảnh/video làm bằng chứng. Kiểm tra README và `game.contract.json` trong clone sạch.
4. Dùng [CLI](contracts/cli.md), scenario và inputs trong `tests/contract/cases/`; kiểm tra tick 0, biên sinh bù 119/120/121, tắt sinh bù, shade tick 1800, sự kiện, mã lỗi và dòng end theo [JSONL](contracts/jsonl.md). So byte hai lần cùng seed.
5. Đo 18.000 bước bằng scenario không thắng/thua sớm, `time_left_s > 300`, tắt sinh ngẫu nhiên; xác nhận `end.ticks = 18000`, ghi thời gian thực và cấu hình máy vào `docs/proof/phase-1/perf.md`. Không sửa tay kết quả.

Trước khi báo hoàn tất chạy `npm test`; xác nhận hook pre-push đã được cài và CI chạy trên push. Kiểm tra traceability từ từng FR tới bằng chứng phù hợp, ghi trung thực các mục chưa đạt.
