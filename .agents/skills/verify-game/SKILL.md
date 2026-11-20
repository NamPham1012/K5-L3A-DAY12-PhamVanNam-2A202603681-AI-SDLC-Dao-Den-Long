---
name: verify-game
description: Chạy kiểm thử Contract v1.2, scenario FR3 và kiểm tra tính tất định của Đảo Đèn Lồng.
---

# Verify Game Skill (Phase 3 · Contract v1.2)

Skill này kiểm chứng Đảo Đèn Lồng Phase 3 và lưu bằng chứng thật vào `docs/proof/phase-3/`, giữ nguyên bằng chứng cũ.

## Các bước thực hiện
1. Chạy `npm test` (build, unit, contract v1.2 và hồi quy); lưu output thật vào `docs/proof/phase-3/test.log`.
2. Chạy riêng `npm run contract -- FR3-acceptance` để kiểm tra các scenario FR3 qua CLI thật; lưu output vào `docs/proof/phase-3/fr3-test.log`.
3. Chạy headless trên cả 3 Đêm hai lần cùng seed, scenario và inputs; so SHA-256 từng byte, lưu JSONL và bảng băm vào `docs/proof/phase-3/`.
4. Báo cáo trung thực: nếu kiểm tra thất bại phải trả mã khác 0, giữ stderr; không ghi ĐẠT khi chưa có bằng chứng. Không sửa `review-*.md`.

Lưu ý: `npm run verify` hiện vẫn ghi vào `docs/proof/phase-2/`; không dùng lệnh đó như bằng chứng verify Phase 3 cho tới khi script được cập nhật.
