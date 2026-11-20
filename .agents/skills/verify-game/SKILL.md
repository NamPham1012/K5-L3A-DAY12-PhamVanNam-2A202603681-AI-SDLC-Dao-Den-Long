---
name: verify-game
description: Chạy kiểm thử tự động 3 Đêm (Contract v1.1), so SHA-256 tất định và lưu bằng chứng thật vào docs/proof/phase-2/
---

# Verify Game Skill (Phase 2 · Contract v1.1)

Skill này thực hiện kiểm chứng tự động cho Đảo Đèn Lồng Phase 2 (3 Đêm, Contract v1.1) và ghi bằng chứng thật vào `docs/proof/phase-2/` mà không xoá bằng chứng Phase 1.

## Các bước thực hiện
1. Chạy `npm run build` và `npm test` (unit + contract v1.1 + hồi quy Phase 1), lưu log đầy đủ vào `docs/proof/phase-2/test.log`.
2. Chạy headless trên cả 3 Đêm (`--night 1`, `--night 2`, `--night 3`) hai lần cùng seed, so SHA-256 từng byte và lưu JSONL mẫu + bảng băm vào `docs/proof/phase-2/night{1,2,3}.jsonl` và `docs/proof/phase-2/determinism-sha256.txt`.
3. Chạy benchmark 21.600 tick không kết thúc sớm (Đêm 3) và ghi thời gian thực, `end.ticks` cùng cấu hình máy vào `docs/proof/phase-2/perf.md` (ngưỡng ≤ 30 giây).
4. Báo cáo trung thực: nếu bất kỳ kiểm tra nào thất bại phải trả mã thoát khác 0, in đầy đủ stderr và không ghi ĐẠT cho mục chưa có bằng chứng.
