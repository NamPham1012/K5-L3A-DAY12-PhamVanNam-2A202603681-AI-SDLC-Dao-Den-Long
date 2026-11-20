# Review hộp đen Phase 2 — Nhóm A (Claude, độc lập với Antigravity)

Ngày 2026-11-20 16:35. Chạy `dist/headless.js` (Linux, Node 22) với scenario/inputs trong `blackbox/`. Kỳ vọng tính tay từ số chuẩn Ticket-02 trước khi chạy.

| # | Kiểm tra | Kỳ vọng | Thực tế | KQ |
|---|---|---|---|---|
| 1 | Snapshot v1.1 | night, wind, player.{vel,grounded,invuln,dash_cd_s,pulse_cd_s,charm_s}, motes/drifters/charms | đủ khoá | Đạt |
| 2 | 20 đom đóm lúc dựng, kind random, ttl null | 20 | 20 | Đạt |
| 3 | Lịch Bóng Mực Đêm 1 | S1,S2 @300 (spawning), S3 @780 | đúng; tick 310 wander | Đạt |
| 4 | Nhặt r=1.0, đi +Z 6 m/s, mote (0,0,5) | tick 40 | 40 | Đạt |
| 5 | Nạp ở r=2.0, điểm khi nạp | deposit+lit tick 236, score 110 (0 khi nhặt) | đúng | Đạt |
| 6 | Nhảy vy 7, g −20 | đỉnh ≈1.2, chạm đất ≈ tick 42 | đỉnh 1.167, chạm đất 42 | Đạt (xem ghi chú) |
| 7 | Lướt đứng yên hướng +Z | 2.8 m sau 12 tick; nhấn lại tick 50 bỏ qua; tick 91 → dash @92 | đúng | Đạt |
| 8 | Rơi từ (39.5,0,0), carried 4 | player_hit fall lost 4, flames 2; hồi sinh (0,0,0) sau 60 tick, invuln 1.5 s | hit @64, hồi sinh @124 | Đạt |
| 9 | Shade chase (3,0,0) 4 m/s | hit @30, dropped 2 vành 1.5–2.5 TTL 8 s, recoil, invuln 1.5 | đúng (2.13 m, 2.03 m) | Đạt |
| 10 | Pulse carried 5, shade (4,0,0) | stunned S1, carried 2, +5, đẩy tới x=8 tại tick 16, cd 3 s; pulse lại @30 bị chặn | đúng | Đạt |
| 11 | Thắp đèn cuối đúng tick hết giờ | won all_lit @60, score 10+100+0+150 = 260 | 260 | Đạt |
| 12 | Shade trong 6 m khi đèn vừa thắp | đẩy ra mép ≤ 30 tick, không hit | ra 6.0 m trước tick 10, 0 hit | Đạt |
| 13 | Tất định + hiệu năng Đêm 1 21 600 tick | giống hệt; ≤ 30 s | dừng dawn @18000, 1.8 s | Đạt |

Ghi chú: đỉnh nhảy 1.167 m (Euler bán ẩn) thấp hơn lý thuyết 1.225 m. Đề xuất đổi sang cập nhật chính xác `y += vy·dt + ½·g·dt²` để khớp phép tính giải tích mà test ẩn có thể dùng.
