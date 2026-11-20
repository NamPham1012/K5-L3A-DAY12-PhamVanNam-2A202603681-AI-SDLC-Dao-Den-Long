# Quickstart và kiểm chứng Phase 2

Đây là kế hoạch sau triển khai, không phải bằng chứng các kiểm tra đã đạt. Cài Node ≥ 20, clone sạch và chạy `npm ci && npm run build`, sau đó `npm test` và `npm run verify`. Tài liệu `README.md` cần ghi cách gọi CLI cụ thể cho từng Đêm.

1. Chạy scenario headless riêng cho dash, rơi/hồi sinh, pause/resume, Gió Lạc, Bùa Gió, gió, bục nhảy, Đêm 2 và Đêm 3. Kiểm tra JSONL, event, tick/sim_tick, timer và vị trí/va chạm ở biên: 239/240 spawn mote, 299/300 spawn shade, vùng an toàn, hết bất tử, cầu/dốc/vách/tầng, rơi và các điều kiện kết thúc đồng tick. Chạy lại cùng đầu vào và so byte.
2. Chạy lại test Phase 1 còn hiệu lực với số chuẩn. Với mỗi test sửa/bỏ do luật đổi, ghi tên, luật cũ/mới và lý do tại `docs/notes/phase2-changes.md`; không tắt âm thầm. Xác nhận test so tuning runtime với contract v1.1.
3. Chạy từng Đêm headless theo [contract v1.1](contracts/changes-v1.1.md); dùng scenario không kết thúc sớm và thời gian đủ để xác nhận `end.ticks=21600`, đo thời gian thực ≤ 30 giây; lưu lệnh, kết quả và cấu hình máy. Nếu không đạt ghi rõ.
4. Chạy `npm run play`; kiểm tra chuỗi menu/giới thiệu/kết quả, pause, lưu cài đặt sau mở lại, HUD, bảng màu và nhạc/hiệu ứng. Lưu ảnh hoặc clip có âm thanh khi cần vào `docs/proof/phase-2/`.
5. Đặt viewport 1280×720, dùng bộ đếm FPS của web đo 60 giây và ghi FPS trung bình, cấu hình máy, trình duyệt và phương pháp trong `docs/proof/phase-2/perf.md`; so với ngưỡng ≥ 30 FPS.
6. Cập nhật `AGENTS.md`, skill kiểm chứng, traceability và nhật ký AI; chạy lại `npm test`, lưu bằng chứng thật, ghi rõ phần chưa đạt và các giả định ★ chưa xác nhận. Nhờ người hoặc phiên độc lập review kết quả.
