# Đảo Đèn Lồng (Lantern Island) — Phase 1

Game 3D phong cách đêm ấm, cổ tích. Người chơi điều khiển Mây thu thập đom đóm, thắp sáng 5 Đèn Lồng Lớn và xua đuổi Bóng Mực.

## 1. Cài đặt và Chạy (≤ 3 lệnh)
```bash
# Lệnh 1: Cài đặt và build bản headless
npm ci && npm run build

# Lệnh 2: Chạy kiểm thử tự động (Unit test + Contract test CLI)
npm test

# Lệnh 3: Chạy bản chơi web giao diện 3D
npm run play
```

Lệnh chạy mô phỏng không giao diện (Headless):
```bash
node dist/headless.js --seed 42 --night 1 --ticks 120 --out output.jsonl --snapshot-every 10
```

## 2. Điều khiển (Web)
- **W, A, S, D**: Di chuyển theo hướng nhìn của camera
- **Chuột**: Click để khóa con trỏ và xoay góc nhìn camera
- **Space**: Nhảy
- **E**: Nạp đom đóm vào đèn gần nhất khi trong bán kính
- **Q**: Kỹ năng Tỏa Sáng làm choáng và đẩy lùi Bóng Mực (tốn 2 đom đóm)
- **R**: Chơi lại màn mới với seed ngẫu nhiên

## 3. Cách tính điểm
- Nhặt mỗi đom đóm: **+10 điểm**
- Thắp sáng mỗi ngọn đèn: **+100 điểm**
- Làm choáng mỗi Bóng Mực bằng Tỏa Sáng: **+25 điểm**
- Thưởng khi chiến thắng (thắp đủ 5 đèn): `floor(thời_gian_còn_lại) × 2 + số_lửa_còn_lại × 50`

## 4. Tham số Tuning & Giá trị đặc biệt
- Các thông số được quản lý duy nhất tại `src/core/tuning.ts` và khớp 100% với `game.contract.json`.
- `fall_enabled = false`: Người chơi bị chặn tại mép đảo bán kính 40m, không bị rơi hay phạt ngã.

## 5. Sáng tạo của tôi
Phase 1 chưa thêm cơ chế sáng tạo ngoài PRD-0 (ưu tiên lõi đúng + bằng chứng). Nón lá và đèn lồng của Mây là yêu cầu của PRD-0, không tính là sáng tạo. Mọi phần sáng tạo sau này sẽ tắt khi chạy headless và có test chứng minh JSONL không đổi.
