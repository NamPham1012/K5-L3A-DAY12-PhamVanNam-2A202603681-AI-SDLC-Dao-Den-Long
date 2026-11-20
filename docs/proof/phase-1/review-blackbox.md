# Review hộp đen Phase 1 (nhóm 2 – headless)

Reviewer: Claude (phiên riêng, không viết code; code do Antigravity viết). Ngày 2026-11-20.
Cách làm: chạy `node dist/headless.js` (Node 22, Linux) với scenario/inputs trong `blackbox/`, so với giá trị **tính tay trước khi chạy** từ tuning.

| # | Kiểm tra | Kỳ vọng tính tay | Thực tế | KQ |
|---|---|---|---|---|
| 1 | Đứng yên `--ticks 120` | 13 snapshot, tick 0 đầu, `end.ticks=120`, exit 0 | đúng | Đạt |
| 2 | Tất định seed 7, 3000 tick, chạy 2 lần | `cmp` giống hệt | giống hệt | Đạt |
| 3 | inputs JSON hỏng / tick trùng / `--night 2` | exit 2 + stderr | exit 2 cả 3 | Đạt |
| 4 | s1+i1: đi +Z 6 m/s, mote (0,0,5), r=1.5 | `mote_picked` tick 35 (3.5 m / 0.1 m) | tick 35 | Đạt |
| 5 | s1+i1: L1 deposited 7, interact tick 230 | `deposit` amount 1 → 8 + `lantern_lit` tick 231, score 110 | đúng | Đạt |
| 6 | i2: move [0,1], yaw 90°, 60 tick | pos (6,0,0) | (6,0,0) | Đạt |
| 7 | i3: move [1,1] chuẩn hoá | (4.243,0,4.243) | đúng | Đạt |
| 8 | s3: shade (3,0,0), 3.5 m/s, hit r=1, carried 5 | `player_hit` tick 35, dropped 2, 2 mote rơi ra | tick 35, dropped 2, motes_active 2 | Đạt |
| 9 | s4+i4: pulse, shade (4,0,0) | tick 1 stunned [S1], carried 3, shade x=8, score 25 | đúng | Đạt |
| 10 | s5: 5 đèn lit sẵn | `game_over won all_lit` tick 1, không +per_lantern; score = 299×2+3×50 = 748 | 748 | Đạt |
| 11 | s6: time_left_s 1 | `game_over lost dawn` tick 60 | tick 60 | Đạt |
| 12 | s7: L1 lit, shade đuổi 600 tick | khoảng cách min tới L1 ≥ 6 | 6.000, không hit | Đạt |
| 13 | s8: random mặc định, flames 99, 4000 tick | S1,S2 lúc dựng; `shade_spawned` S3@1800, S4@3600; 50 mote | đúng | Đạt |

Nhận xét: chưa thấy lệch Test Contract ở nhóm 2. Chưa kiểm: hiệu năng (SC-002), giao diện (nhóm 3).
