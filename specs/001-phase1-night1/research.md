# Research: Phase 1

## Mô phỏng và tất định

- **Decision**: Lõi TypeScript strict dùng mulberry32 có seed và counter ID trong trạng thái; cả hai adapter gọi `step()` 1/60 giây.
- **Rationale**: Cùng logic cho game và headless; PRNG, thứ tự thực thể/sự kiện và serialize ổn định giúp tái lập đầu ra. Không làm tròn trạng thái nội bộ; chỉ làm tròn tọa độ khi xuất.
- **Alternatives considered**: Logic riêng cho mỗi adapter hoặc random toàn cục dễ lệch hành vi và không tái lập.

## Đóng gói và chạy

- **Decision**: CLI Node ≥ 20 build bằng esbuild, giao diện Three.js/Vite; `npm ci && npm run build`, `npm run play`, `node dist/headless.js`.
- **Rationale**: Theo lựa chọn đã cung cấp; lockfile và scripts đa nền tảng giúp clone sạch chạy trên macOS/Linux.
- **Alternatives considered**: Script phụ thuộc PowerShell bị loại vì máy chấm có thể không dùng Windows.

## Kiểm chứng

- **Decision**: Vitest unit + scenario gắn FR, so byte hai lần, kiểm tra tuning, đo hiệu năng và kiểm tra giao diện thủ công; `npm run verify` lưu kết quả thật.
- **Rationale**: JSONL chứng minh contract, còn hình ảnh và thao tác giao diện cần bằng chứng trực tiếp; hiệu năng phải chạy đủ số bước.
- **Alternatives considered**: Chỉ kiểm tra ảnh hoặc test unit không kiểm chứng contract đầu-cuối.

Các chi tiết tuning chưa được xác định sẽ chọn khi triển khai, công bố đúng giá trị và kiểm thử theo contract.
