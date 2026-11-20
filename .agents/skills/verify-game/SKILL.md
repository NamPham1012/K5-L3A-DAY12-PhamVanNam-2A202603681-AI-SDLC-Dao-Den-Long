---
name: verify-game
description: Chạy kiểm thử tự động và thu thập bằng chứng thực tế cho Đảo Đèn Lồng Phase 1
---

# Verify Game Skill

Skill này thực hiện quy trình kiểm tra toàn bộ game và thu thập bằng chứng tự động.

## Các bước thực hiện:
1. Chạy `npm test` để xác nhận tất cả unit test và contract test đều pass.
2. Chạy `npm run verify` để sinh báo cáo và các file bằng chứng vào thư mục `docs/proof/phase-1/`.
3. Kiểm tra tính tất định: chạy 2 lần cùng seed, scenario, inputs và so sánh diff byte của output JSONL.
4. Báo cáo trung thực kết quả: nếu có lỗi thì hiển thị chi tiết stderr và exit code, tuyệt đối không che giấu lỗi.
