# Data Model: Phase 1

| Thực thể | Trường chính | Quy tắc |
|---|---|---|
| World | tick, thời lượng ban đầu, time_left_s, score, state, PRNG, counter ID, lịch sinh | `playing → won/lost`; tick 0 sau dựng; mỗi bước tăng một; `time_left_s = initial − tick/60`. |
| Player | pos chân, vận tốc Y, flames, carried, thời gian bất tử/hồi chiêu, nút trước | Trên XZ bị kẹp bán kính 40 m; carried không vượt capacity; flames về 0 có thể kết thúc thua. |
| Mote | id M…, pos mặt đất, active | Nhặt khi khoảng cách XZ ≤ pickup_radius và còn chỗ; ID tăng, thứ tự xử lý ổn định. |
| Lantern | id L1–L5, pos chân, deposited, lit | Nạp từng phần; khi đủ cost chuyển lit, không cộng điểm cho trạng thái dựng sẵn. |
| Shade | id S…, pos tâm, state, thời gian choáng | Chase hoặc stunned; không gây sát thương khi choáng; vùng an toàn chỉ quanh đèn đã thắp. |
| Input state | move, cam_yaw_deg, jump, interact, pulse | Frame chỉ thay trường có mặt; nút kích hoạt cạnh lên; tick frame tăng nghiêm ngặt. |

World sở hữu player và danh sách mote/lantern/shade; scenario thay thế danh sách mote/shade và cập nhật đèn theo id. `needed = Σ(cost − deposited)` cho đèn chưa thắp; `available = active + carried`; sinh bù tại tick 120, 240, … nếu thiếu và `random_motes` bật. Tuning duy nhất tại `src/core/tuning.ts`; `game.contract.json` phải khớp.
