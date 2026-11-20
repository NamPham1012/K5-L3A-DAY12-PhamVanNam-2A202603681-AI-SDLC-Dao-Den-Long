# Data Model: Phase 2

| Thực thể | Trường | Ràng buộc / chuyển trạng thái |
|---|---|---|
| World | night, tick, sim_tick, state, score, time_left, rng, ID counters, wind | Night 1–3; state playing/paused/won/lost; tick tiếp tục khi paused, sim_tick và timer không tăng. |
| Player | pos chân, vel, grounded, facing, flames, carried, invuln, dash/pulse cooldown, charm, fall/respawn timer | 3 flames đầu Đêm; carried 0–10; Y < −10 rơi, chờ 60 tick hoặc thua ngay; đầu vào cạnh lên. |
| Mote | id, pos, kind, ttl, thời điểm tương tác | random hoặc dropped; random có ttl null; dropped hết hạn sau 480 tick và nhặt từ tick sau. |
| Lantern | id, pos, deposited, lit | Cost 10, chỉ nạp đèn chưa sáng; lit tạo vùng an toàn 6 m cho shade. |
| Shade | id, pos, state, state_ticks_left, recoil/push | spawning/wander/chase/recoil/stunned; hit tối đa một lần/tick; vùng an toàn và pulse theo FR2-020–024. |
| Drifter | id, pos, state, stolen, timer, điểm sinh | idle/chase/flee/removed; tối đa 2 đang hoạt động, mỗi con cướp tối đa một lần; hành vi ★ giữ nguyên spec. |
| Charm | id, pos, available, respawn | Nhặt theo luật mote, hiệu lực 600 tick và xuất hiện lại sau 2700 tick. |
| Map | start, hình học sàn/vách/tháp, đèn, điểm sinh, bục | Ba map chuẩn; groundHeight xét độ cao để không đi xuyên tầng; các điểm ★ giữ như spec. |
| Input state | move, yaw, jump, interact, pulse, dash, pause | Tick frame tăng nghiêm ngặt; nút kích hoạt cạnh false→true; trường thiếu giữ giá trị cũ. |
| Campaign/settings (web) | current night, điểm các Đêm thắng, âm lượng, độ nhạy | Chuyển menu → giới thiệu → chơi → kết quả; lưu cài đặt giữa các lần mở, thua chơi lại Đêm đó. |

Tất cả timer gameplay và lịch sinh do core quản lý theo sim_tick; timer hiển thị hoặc snapshot quy đổi giây theo contract. Không làm tròn tọa độ nội bộ; làm tròn ở biên xuất JSONL theo contract.
