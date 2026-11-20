# Inputs và scenario v1.0

Nguồn chuẩn: `docs/prd-0.md`, mục C–D. Hai file là JSON; trường sai định dạng trả mã 2.

- **Inputs**: `frames[]` có tick tăng nghiêm ngặt; mặc định move `[0,0]`, yaw 0, các nút false. Frame chỉ thay trường có mặt; move mỗi thành phần trong [-1,1], chuẩn hóa nếu dài > 1. Hướng thế giới: `x'=x cosθ+z sinθ`, `z'=-x sinθ+z cosθ`. Jump/interact/pulse kích hoạt cạnh false→true. Không inputs thì đứng yên.
- **Scenario**: player có thể ghi đè pos, carried, flames; `motes`, `shades` thay danh sách; `random_motes:false` và `random_shades:false` tắt sinh tương ứng; `lanterns` cập nhật theo id L1–L5, đèn vắng giữ mặc định; `time_left_s` ghi đè thời lượng ban đầu. Trường vắng dùng mặc định; dựng không phát event, không cộng điểm.
- Khoảng cách đo XZ giữa các điểm quy định, bao gồm biên `≤ r`; đơn vị mét, Y hướng lên.
