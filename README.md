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
Tất cả các yếu tố sáng tạo dưới đây **chỉ nằm ở lớp hiển thị web (`src/web/`)**, hoàn toàn tách khỏi lõi mô phỏng `src/core/` và **tắt ở chế độ headless**:

- **Đèn lồng của Mây và đom đóm bay quanh**: Mây đội nón lá, cầm sào tre treo đèn lồng đỏ phát sáng ấm; độ sáng đèn tăng theo số đom đóm đang mang (`carried`) và đúng bằng đó con đom đóm bay vòng quanh đèn.
- **Bóng Mực sinh động & phản ứng với ánh sáng**: Bóng Mực tím-đen nhấp nhô, có 2 mắt trắng phát sáng và vệt khói tím phía sau; khi bị choáng (`stunned`) chuyển xám nhạt, co nhỏ và nhắm mắt; khi tiến gần vùng sáng của đèn đã thắp thì run rẩy sợ ánh sáng.
- **Đảo Bến sáng dần theo số đèn**: Khung cảnh đêm trăng sao, viền cát, cây cối/tre/đá/cỏ low-poly (đặt bằng PRNG riêng của web) và bến gỗ nhỏ ở mép đảo; mỗi khi thắp thêm đèn (0→5), ánh sáng môi trường (`HemisphereLight` & `AmbientLight`) tăng dần kèm quầng sáng vàng cam quanh đèn, đom đóm trên đất nhấp nháy bay lên xuống nhẹ.

**Bằng chứng phần lõi và Test Contract không bị ảnh hưởng**:
- `npm test`: **25/25 test files, 41/41 tests xanh** (100% pass).
- So byte JSONL chạy headless (`node dist/headless.js --seed 7 --night 1 --ticks 3000 --snapshot-every 10`) trước và sau khi cập nhật lớp web: **giống hệt từng byte** (`48557 bytes`, SHA-256: `e305decbf9d057cea6ed6af97a58296f7a5f97e428d3c86ee2c69dcec61de24d`).
