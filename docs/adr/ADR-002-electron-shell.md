# ADR-002: Bọc game web bằng Electron cho bench, soak, bảng xếp hạng

- Trạng thái: Chấp nhận · 2026-11-20 · Phase 4 (Ticket-04, Contract v1.3)

## Bối cảnh
Ticket-04 cần: cửa sổ đúng 1280×720 tự thoát với mã 0, tắt vsync, đo RSS tiến trình, bảng xếp hạng lưu trên đĩa, và lệnh `<run_cmd> --export-leaderboard out.json`. Trình duyệt + Vite dev server không đáp ứng được (không tự thoát, không đo RSS, localStorage không phải file đĩa, không nhận tham số CLI).

## Quyết định
Dùng Electron làm vỏ desktop cho cùng bản web. Main process: tạo cửa sổ 1280×720, `app.commandLine.appendSwitch('disable-gpu-vsync')` + `('disable-frame-rate-limit')`, lấy mẫu `app.getAppMetrics()` để tính peak RSS, đọc/ghi `userData/leaderboard.json`, xử lý `--export-leaderboard` mà không mở cửa sổ. Renderer dùng lại `src/web`. Soak chạy Node thuần (không Electron) vì là headless.

## Hệ quả
- `npm ci` tải Electron (~100 MB); chạy được macOS/Linux/Windows.
- Bản web tĩnh vẫn phát hành kèm (bảng xếp hạng dùng localStorage ở bản này).
- Logic lõi không đổi; cờ `bench` mặc định tắt nên JSONL headless không đổi.

## Phương án loại
- Playwright mở Chromium: thêm phụ thuộc trình duyệt, khó đo RSS và lưu đĩa.
- Viết lại bằng engine khác: không đủ thời gian.
