# Research: Phase 2

## Kiến trúc

- **Decision**: Giữ TypeScript strict, Three.js/Vite, Node/esbuild, Vitest và một lõi `step()` với mulberry32 của Phase 1; bổ sung map/vật lý/các thực thể như plan.
- **Rationale**: Hai chế độ cùng luật, tái sử dụng công cụ và kiểm thử đã có; đầu ra seed giống nhau.
- **Alternatives considered**: Viết mô phỏng riêng cho web hoặc đổi stack làm tăng rủi ro lệch contract và regression.

## Bản đồ và vật lý

- **Decision**: Tách cấu hình từng Đêm và truy vấn mặt đỡ theo vị trí, độ cao; kiểm tra vách, tháp, cầu, bục, rơi và gió trong core.
- **Rationale**: Hỗ trợ nhiều tầng mà không kéo thư viện đồ họa vào core; tránh dịch chuyển xuyên sàn hoặc đi xuyên vách.
- **Alternatives considered**: Chỉ dùng một hàm chiều cao tối đa tại XZ không phân biệt mặt có thể tiếp cận sẽ kéo người chơi xuyên tầng.

## Đồng hồ và thứ tự

- **Decision**: `tick` đếm bước bên ngoài, `sim_tick` chỉ tăng khi mô phỏng; giữ 12 bước Ticket-02 và các cạnh lên, thực thể mới không tương tác đến tick sau.
- **Rationale**: Pause không được làm trôi spawn, TTL hay cooldown; các tương tác đồng tick có thứ tự bắt buộc.
- **Alternatives considered**: Dùng thời gian hệ thống trong core hoặc gộp hai bộ đếm làm sai test tất định và pause.

## Kiểm chứng và giả định

- **Decision**: Mỗi tính năng mới trong lõi có scenario headless; kiểm tra trực tiếp web với ảnh/clip, đo FPS 60 giây, so byte và ghi lý do thay test Phase 1. Giữ nguyên ★ cho tới khi trợ giảng trả lời.
- **Rationale**: JSONL và bằng chứng nghe/nhìn chứng minh các khía cạnh khác nhau; kiểm thử biên spawn, timer và map bảo vệ contract.
- **Alternatives considered**: Chỉ dùng ảnh hoặc chỉ dùng JSONL bỏ sót hành vi; tự biến giả định ★ thành quyết định đã xác nhận có nguy cơ sai test ẩn.

Chưa có quyết định kỹ thuật mới cần hỏi; các giả định ★ về contract/gameplay vẫn chưa được xác nhận và được theo dõi trong spec.
