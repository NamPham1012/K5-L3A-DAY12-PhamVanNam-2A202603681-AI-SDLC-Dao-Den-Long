# Review hộp đen Phase 3 — Nhóm A (Claude, độc lập với Antigravity)

Ngày 2026-11-20 17:13. Kỳ vọng tính theo Ticket-03 và thứ tự tick (hao dầu ở bước 2, trước tương tác).

| # | Kiểm tra | Kỳ vọng | Thực tế | KQ |
|---|---|---|---|---|
| 1 | contract 1.2, thời lượng 240/270/300 | đúng | đúng | Đạt |
| 2 | L1 sáng fuel 100, không ai hút | fuel 90 @600; `lantern_out` @6000, deposited 0, ever_lit true | đúng | Đạt |
| 3 | Châm dầu fuel 50, carried 7 | sau hao 49.983 ⇒ used = ceil(50.017/10) = 6, fuel 100, +30 | refuel amount 6, fuel 100, score 30 | Đạt |
| 4 | Thắp lại (ever_lit), carried 5 | `lantern_lit relight:true`, +25+40 = 65, relit_count 1, capacity 12 | đúng | Đạt |
| 5 | Shade wander (0,0,20) → L1 fuel 29 | đi 2 m/s tới cách 2 m (≈ tick 90) → drain; fuel 27.5 − 6/s; `fuel_drain` @150 (21.5), mỗi 60 tick | drain @≤120, fuel 24.5 @120, fuel_drain 150/210/270/330 | Đạt |
| 6 | Bình minh 2/5 đèn sáng | `lost dawn` | đúng | Đạt |
| 7 | Bình minh 3 đèn (100/80/50), 3 lửa, 1 s | `won dawn_survived`, 150 + (99+79+49) + 150 = 527 | 527 | Đạt |
| 8 | 5 đèn sáng sớm | không kết thúc | 0 game_over trong 120 tick | Đạt |
| 9 | Tất định Đêm 2 đủ 16 200 tick | giống hệt | giống hệt, kết thúc dawn | Đạt |

Lỗi spec do Claude (ví dụ #3, #8 bỏ qua hao dầu bước 2) được agent implement phát hiện; spec đã sửa 17:10.
Giả định ★: tốc độ wander 2 m/s.
