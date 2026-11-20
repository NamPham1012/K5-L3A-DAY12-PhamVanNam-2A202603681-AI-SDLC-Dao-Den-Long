# Đánh giá Đợt triển khai (Retrospective) — Phase 1

## Điều làm tốt
1. **Tuân thủ triệt để Test Contract**:
   - Viết test contract chạy thực tế qua CLI subprocess `node dist/headless.js`, đọc output JSONL, không mock hàm lõi.
   - 100% test contract đều gắn mã FR rõ ràng và độc lập.
2. **Kiến trúc lõi thuần (Clean Architecture)**:
   - Thư mục `src/core/` hoàn toàn độc lập, không phụ thuộc DOM hay Three.js hay thư viện ngoài.
   - Tuyệt đối không dùng `Math.random` hoặc `Date` trong lõi; sử dụng PRNG Mulberry32 có seed.
3. **Hiệu năng xuất sắc**:
   - Chạy 18.000 bước headless chỉ mất ~90-150 ms, nhanh gấp hơn 10 lần ngưỡng yêu cầu (< 2s).
4. **Trải nghiệm tích hợp web**:
   - Web 3D tái sử dụng chính xác cùng một hàm `core.step()` với vòng lặp fixed timestep 1/60s.

## Điểm cần cải thiện cho Phase sau
1. **Chia nhỏ các file kiểm thử**: Tiếp tục duy trì mỗi case test một file riêng để dễ dàng debug và cô lập lỗi.
2. **Đồ họa và hiệu ứng**: Cải thiện thêm hiệu ứng sương mù, hiệu ứng hạt đom đóm phát sáng mượt mà hơn khi vào các phase tiếp theo.
