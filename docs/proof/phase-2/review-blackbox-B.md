# Review hộp đen Phase 2 — Nhóm B (Claude, độc lập với Antigravity)

Ngày 2026-11-20 16:45. Kỳ vọng tính tay từ Ticket-02 trước khi chạy; file trong `blackbox/`.

| # | Kiểm tra | Kỳ vọng | Thực tế | KQ |
|---|---|---|---|---|
| 1 | Sửa nhảy (review A) | đỉnh 7²/40 = 1.225, chạm đất tick 42 | 1.225 / 42 | Đạt |
| 2 | Pause tick 10, bỏ pause tick 20 | `paused` @11, `resumed` @21; tick 11–20 state paused, sim_tick 10, time_left đứng; tick 40 → sim_tick 30 | đúng | Đạt |
| 3 | Đêm 2 cầu tre (24,0,0) → +X 5 s | không rơi, tới (54,0,0) rồi sang đảo B | (58,0,0), 0 hit | Đạt |
| 4 | Đêm 2 bước ngang khỏi cầu (35,0,0) → +Z | rơi, `player_hit fall` | @76 | Đạt |
| 5 | Đêm 2 bục (20,0,18) | bay ≈ 1.4 s (84 tick), đỉnh 14²/40 = 4.9, đáp trong đảo B | 84 tick, 4.9, đáp (51.6,0,5.7) | Đạt |
| 6 | Đêm 3 vách tầng 1 từ (0,0,28) đi −Z | bị chặn ở r ≈ 24 | z = 24.1, y 0 | Đạt |
| 7 | Đêm 3 dốc 30° đi vào tâm | lên y = 3 trên tầng 1 | (19.9,3,11.5) | Đạt |
| 8 | Gió Lạc idle (6,0,0), carried 6 | chase, cướp 3 tại tick ≈ 42 ((6−1.2)/(7/60)), flee 240 tick → removed | steal @42, carried 3, removed, stolen 3 | Đạt |
| 9 | Bùa C1 (35,0,0) Đêm 2 | nhặt @10, 7.2 m/s, charm_s 9.167 @60, respawn 44.167 s | đúng | Đạt |
| 10 | Gió Đêm 3 | active 1800–2099, đẩy 2 m/s × 5 s = 10 m | dịch 10.0 m, tắt @2100 | Đạt |

Giả định ★ đang dùng (chưa có xác nhận trợ giảng): Gió Lạc `removed` vẫn nằm trong snapshot; xuất phát Đêm 3 (0,0,−30).
