# Giả định và chấp nhận — Phase 1

1. **Test Contract và chi tiết kỹ thuật**: Các mục checklist về không có chi tiết triển khai được chấp nhận chưa đạt vì yêu cầu bắt buộc Test Contract v1.0, headless JSONL và kiểm thử tự động.
2. **Lịch sinh bù (FR-003)**: Sinh bù đom đóm kiểm tra tại các tick là bội số của 120 (120, 240, ...); tick 0 chỉ dựng scenario ban đầu, không sinh bù.
3. **Lịch sinh Bóng Mực (FR-004)**: Ban đầu có sẵn 2 shade lúc dựng, không phát sự kiện `shade_spawned`; các shade sinh lúc runtime ở tick 1800, 3600... có phát sự kiện và giới hạn tối đa 6 shade.
4. **Cơ chế rơi khỏi đảo**: `fall_enabled = false`, người chơi bị kẹp trong bán kính 40 m của mặt đảo, không phát sự kiện `player_hit {by: "fall"}`.
5. **Đơn vị ánh sáng**: Sử dụng trực tiếp số đom đóm mang theo (`carried`) làm tài nguyên để nạp đèn và dùng kỹ năng Tỏa Sáng.
6. **Thưởng khi thắng**: Điểm cộng thêm khi thắng = `floor(time_left_s) * per_second_left + flames * per_flame_left`. Khi thua không cộng thưởng.
