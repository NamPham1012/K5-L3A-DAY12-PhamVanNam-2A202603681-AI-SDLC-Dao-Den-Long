# Phân tích Phase 1 — điểm mơ hồ & quyết định

Mỗi dòng: chỗ mơ hồ → vì sao rủi ro với bài chấm tự động → quyết định (✅ = đã chốt qua clarify 2026-11-20; ★ = giả định, chưa hỏi). Stack đã chốt: TypeScript + Three.js (web) + Node (headless). Kết quả được mã hoá vào `specs/001-phase1-night1/spec.md`.

## A. Mơ hồ ảnh hưởng trực tiếp tới test headless (rủi ro cao)

| # | Chỗ mơ hồ | Rủi ro | Quyết định |
|---|---|---|---|
| 1 | Nhặt đom đóm tự động hay bấm nút? | Test đi qua đom đóm mà không bấm sẽ kỳ vọng `mote_picked` | Tự động trong `pickup_radius` |
| 2 | Nạp đèn: nạp hết hay từng con, có cần đủ mới nạp? | `deposit.amount` sai | Một lần interact nạp `min(carried, cost − deposited)`; nạp từng phần được (scenario có trường `deposited`) |
| 3 | `pulse_cost` trừ vào cái gì? Contract chỉ có `flames` và `carried` | Test đặt `carried` rồi bấm pulse, kiểm tra `carried` sau | ✅ Trừ vào `carried`. Không đủ ⇒ không pulse (đã chốt) |
| 4 | `safe_radius` quanh mọi đèn hay chỉ đèn đã thắp? | Test đặt shade cạnh đèn chưa thắp | ✅ Chỉ đèn đã thắp (đã chốt) |
| 5 | `dropped` làm tròn thế nào, rơi đi đâu? | `dropped`, `motes_active` sai | ✅ `floor`; rơi ra vòng 3 m quanh người chơi, nhặt lại được (đã chốt) |
| 6 | Thứ tự xử lý trong 1 tick (nhặt/nạp/pulse/shade/va chạm) | Lệch 1 tick ⇒ trượt test so tick | Cố định 10 bước (FR-010); pulse trước va chạm |
| 7 | Tick ghi trên sự kiện | Contract đã nói `k+1` | Theo contract |
| 8 | Hết giờ: thắng hay thua? | `game_over.result` | Thua, `reason: dawn` |
| 9 | Ưu tiên khi nhiều điều kiện kết thúc cùng tick | `result` sai | `won` > `no_flames` > `dawn` |
| 10 | Thưởng thời gian: dùng `time_left_s` lẻ hay làm tròn? Có cộng khi thua? | `end.score` | `floor(time_left_s)`, chỉ khi thắng; `per_flame_left × flames` chỉ khi thắng |
| 11 | `per_stun` tính mỗi shade hay mỗi lần pulse? | `score` | Mỗi id trong `stunned_ids` |
| 12 | Đẩy lùi `pulse_push_m` tức thì hay trượt dần? | Vị trí shade ở snapshot | Tức thì trong tick pulse, hướng người chơi→shade (trùng vị trí ⇒ hướng +X) |
| 13 | Shade bị choáng có chặn đường/gây sát thương? | `player_hit` thừa | Không di chuyển, không gây sát thương |
| 14 | Nhiều shade chạm cùng tick | Số `player_hit` | Chỉ 1 lần, bất tử bật ngay |
| 15 | Snapshot cuối khi game kết thúc giữa chừng | Số dòng snapshot | Chỉ tại bội số của `--snapshot-every`; trạng thái cuối nằm trong `end` |
| 16 | Event và snapshot cùng tick: thứ tự dòng | Parser so tuần tự | Event trước snapshot |
| 17 | Inputs: thành phần `move` ngoài [−1,1], trường lạ | Mã thoát | Ngoài khoảng ⇒ mã 2; trường lạ bỏ qua |
| 18 | Scenario đặt sẵn mọi đèn `lit` | Thắng ở tick 0 hay 1? | Kết thúc kiểm ở bước ⇒ tick 1, không cộng `per_lantern` |
| 19 | Scenario `deposited ≥ lantern_cost` nhưng không `lit` | Trạng thái lạ | Kẹp về `cost`, coi là `lit`, không sự kiện |
| 20 | Rơi khỏi đảo | `fall_enabled`, sự kiện `by:"fall"` | ★ `false`, có tường vô hình ở mép đảo |
| 21 | Shade mới sinh khi `random_shades: true` có ghi `shade_spawned` cho đợt đầu? | Đếm sự kiện | Đợt đầu có sẵn lúc dựng ⇒ không sự kiện; chỉ shade sinh trong lúc chơi mới phát |
| 22 | `--night` ≠ 1, `--snapshot-every` ≤ 0 | Mã thoát | Lỗi tham số ⇒ mã 2 |

## B. Mơ hồ thiết kế (không ảnh hưởng test, ảnh hưởng chấm tay)

| Chỗ mơ hồ | Quyết định |
|---|---|
| Kích thước đảo, vị trí đèn | Bán kính 40 m; đèn trên vòng 25 m, L1 tại (0,0,25) khớp ví dụ contract |
| Số đom đóm | 50 ban đầu, tự sinh bù để tổng còn lại luôn ≥ đom đóm cần thắp hết |
| Nhịp sinh shade | 2 con lúc đầu, +1 mỗi 30 s, tối đa 6 |
| HUD tối thiểu | Lửa, carried/capacity, đèn x/5, thời gian, điểm, hồi chiêu pulse |
| Chơi lại | Phím R/nút trên màn kết thúc, seed mới |
| "Đảo sáng dần" | Mỗi đèn thắp tăng ánh sáng môi trường + quầng vàng-cam quanh đèn |

## C. Kiểm tra chéo các con số (cân bằng)

- Shade chậm hơn người chơi (3.5 < 6 m/s) ⇒ chạy thoát được nhưng phải tránh.
- `pickup_radius` 1.5 > `shade_hit_radius` 1.0; `interact_radius` 3 < `safe_radius` 6 ⇒ đứng nạp đèn đã thắp gần như an toàn.
- Cần 5 × 8 = 40 đom đóm; mang tối đa 10 ⇒ ít nhất 4 chuyến; 300 s đủ dư nếu không bị đánh nhiều.
- Điểm tối đa lý thuyết ≈ 40×10 + 5×100 + stun + thời gian còn lại×2 + 3×50.

## D. Rủi ro kỹ thuật

- Tất định với số thực: dùng cùng một runtime cho headless và test, không phụ thuộc thứ tự Map/Set; làm tròn chỉ khi xuất.
- Contract do giảng viên sinh test từ `tuning`: test tự động so `tuning` với config runtime (Constitution VI).
- Lệnh chạy trên máy giảng viên: tránh phụ thuộc engine phải cài tay.
