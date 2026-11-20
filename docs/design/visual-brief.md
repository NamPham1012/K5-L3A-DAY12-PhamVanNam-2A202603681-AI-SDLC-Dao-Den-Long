# Design brief — Giao diện Đảo Đèn Lồng (Phase 2, nhóm C)

Tham chiếu phong cách: `docs/design/concept-phase2.png` (ảnh concept, không phải asset). Mục tiêu: **cổ tích, ấm, dễ thương, đêm lung linh**: ánh sáng đến từ đèn lồng, đom đóm, trăng, không phải từ ánh sáng môi trường.

## 0. Luật bất di bất dịch
- Chỉ sửa `src/web/`, `index.html`, `src/web/*.css`. Không sửa `src/core`, `src/headless`, `tests/contract`, `game.contract.json`.
- Mọi đồ hoạ tạo bằng code (geometry + material + shader nhỏ). Không tải asset ngoài; nếu buộc phải dùng thì chỉ CC0 và ghi `CREDITS.md`.
- Không dùng biểu tượng văn hoá nước khác (không torii, không đèn kiểu Nhật). Bối cảnh làng chài/đảo Việt Nam.
- Màu theo bảng chuẩn Ticket-02 (±10%/kênh RGB) cho các thành phần được liệt kê; ambient = `0.15 + 0.55 × đèn_sáng / tổng_đèn`.
- ≥ 30 FPS trung bình ở 1280×720. Có hệ thống chất lượng: `high` (bloom + bóng đổ), `low` (tắt bloom, giảm hạt). Tự hạ xuống `low` nếu FPS trung bình 3 s < 30.
- Sau mỗi bước: `npm test` xanh, SHA256 JSONL seed 7 3000 tick không đổi, chụp ảnh vào `docs/proof/phase-2/visual-<bước>.png`.

## 1. Render & ánh sáng (bước C1)
- `renderer.toneMapping = ACESFilmic`, `outputColorSpace = SRGB`, exposure ~1.1; `EffectComposer` + `UnrealBloomPass` (strength 0.8, radius 0.6, threshold 0.75): chỉ vật phát sáng (emissive) mới "bloom".
- Trời: shader gradient `#0E1430` (đỉnh) → `#1B2350` (chân trời); 1500 sao `Points` nhấp nháy; dải ngân hà là một băng sprite mờ; trăng tròn emissive kèm quầng.
- Sương: `Fog` màu `#1B2350`, gần 30, xa 140. Biển mây `#12384A` là mặt phẳng lớn dưới đảo, sóng nhẹ bằng vertex shader, vài cụm mây trôi chậm.
- Núi xa: 3–4 dải núi low-poly phẳng (silhouette) tím xanh ở chân trời.
- Ánh trăng: DirectionalLight trắng xanh, có bóng đổ ở `high` (shadow map 1024).
- Đảo sáng dần: ambient/hemisphere theo công thức; mỗi đèn thắp thì nảy một làn sóng sáng vàng lan ra (vòng tròn emissive mở rộng 1 s).

## 2. Đảo & trang trí (bước C2)
- Mặt đảo: cỏ `#2F5D50` có biến thiên màu nhẹ (vertex color), viền cát `#C9B48A`, mép đảo có vách đất nâu rũ xuống biển mây.
- Lối mòn đất nối các đèn (dải đường cong mềm).
- Cây "đa/bàng" tán tròn bồng bềnh (cụm 4–6 cầu dẹt, màu xanh đậm có điểm sáng), mỗi cây treo 3–6 **đèn lồng Hội An** (đỏ, vàng, xanh ngọc) và vài **đèn ông sao** 5 cánh, đung đưa nhẹ, emissive.
- Rặng tre (cụm 5–9 cây đốt xanh), **đèn đá** ven lối, đá tròn phát sáng nhẹ ở khe, cụm hoa nhỏ (hồng, cam, tím), cỏ dài đung đưa (instancing).
- **Cổng làng kiểu Việt** (hai trụ + mái cong ngói nâu) ở đầu lối mòn; **bến gỗ** `#6B4A2F` có thuyền thúng ở mép Đảo Bến.
- Dùng `InstancedMesh` cho cỏ/hoa/đá để giữ FPS. Mọi vị trí bằng PRNG seed riêng của web; tránh 4 m quanh đèn, điểm xuất phát, điểm sinh.
- Đêm 2: hai đảo + **cầu tre** (ván + cọc, không lan can), bục nhảy là đài tròn có hoa văn sáng vàng phát xung.
- Đêm 3: tầng đá có vách đứng, dốc lát đá, **tháp chuông** (trụ gạch + mái + chuông đồng emissive nhẹ), lá bay báo trước gió 2 s.

## 3. Nhân vật Mây (bước C3)
- Dáng chibi: thân tròn mềm như cục mây/marshmallow trắng sữa, đầu to, mắt to đen bóng có điểm sáng, má hồng, miệng cười.
- Áo bà ba `#E8E2D0`, **khăn đỏ** `#C8102E` buộc cổ, đuôi khăn bay theo hướng chạy (chuỗi 4 đoạn mô phỏng lò xo đơn giản).
- **Nón lá** to, hơi nghiêng, có quai đỏ, vân nan tre.
- Tay cầm **sào tre** treo **đèn lồng nhỏ** đỏ-vàng (PointLight ấm, cường độ tăng theo `carried`); đom đóm đang mang bay quỹ đạo quanh đèn (số con = carried).
- Hoạt ảnh: đứng (thở nhún), chạy (nhún + nghiêng người + chân bước), nhảy (co người, bung ra khi đáp, bụi nhỏ), lướt (vệt sáng vàng + kéo dãn thân), bị đánh (nhấp nháy trong thời gian bất tử + rung), rơi (xoay), tỏa sáng (vòng sáng vàng nở ra bán kính 5 m).
- Quay mặt mượt theo hướng di chuyển (lerp góc).

## 4. Bóng Mực & Gió Lạc (bước C4)
- Bóng Mực: dáng hồn ma giọt nước có 2 sừng nhỏ; thân `#120A1A`, **viền phát sáng** `#7A3CFF` (fresnel shader), mắt trắng phát sáng hình trăng khuyết, đuôi khói mực uốn lượn (ribbon), hạt mực rơi.
  - Theo trạng thái: `spawning` trồi lên từ vũng mực tím; `wander` lơ lửng chậm; `chase` nghiêng về trước, mắt nheo, viền sáng hơn; `recoil` bật lùi; `stunned` thân `#3A3450`, mắt nhắm, sao xoay trên đầu. Run rẩy khi gần đèn sáng.
- Gió Lạc: dải lụa `#8FA3B8` bay uốn lượn (ribbon dài), có mắt nhỏ tinh nghịch; khi cướp thì mang theo cụm đom đóm.
- Bùa Gió: lá bùa đỏ `#C8102E` viền vàng `#F2C14E`, xoay và bồng bềnh, quầng sáng.

## 5. Đom đóm & hiệu ứng (bước C4)
- Đom đóm lõi `#FFF6C2`, quầng `#FFE58A` (sprite additive), nhấp nháy lệch pha, bay lượn nhỏ; đom đóm rơi (dropped) nhấp nháy nhanh dần khi sắp hết TTL.
- Hạt bụi sáng lơ lửng trong không khí gần đèn đã thắp.
- Nạp đèn: dòng đom đóm bay từ Mây vào đèn; thắp đèn: bùng sáng + pháo hoa nhỏ vàng cam.

## 6. HUD & màn hình (bước C5)
- Khung gỗ `#6B4A2F` bo góc, viền vàng `#F2C14E`, chữ `#F5F1E6`, font tròn thân thiện (font hệ thống hoặc Google Font có giấy phép OFL → ghi CREDITS).
- Bố cục đúng ticket: Ngọn Lửa (trên trái, icon ngọn lửa), đồng hồ mm:ss (trên giữa, `#FF5A5F` nhấp nháy khi ≤ 30 s), đèn k/n + điểm (trên phải), thanh đom đóm 10 ô (dưới giữa), icon hồi chiêu Lướt/Tỏa Sáng dạng vòng tròn quét (dưới phải), nhắc "E — Nạp ánh sáng (x/10)" khi gần đèn, mũi tên chỉ đèn chưa sáng gần nhất khi ngoài màn hình.
- Menu chính: tên game, Mây đứng trên đảo nhỏ xoay chậm, nút Chơi / Cài đặt. Giới thiệu Đêm: tên đảo + lời Ông Đăng (khung thoại). Kết quả, Bình Minh (trời chuyển hồng cam, tổng điểm). Pause: Tiếp tục / Chơi lại Đêm / Cài đặt / Về menu. Cài đặt: âm lượng, độ nhạy chuột, chất lượng (lưu localStorage).

## 7. Thứ tự làm & tiêu chí xong
C1 render/trời → C2 đảo → C3 Mây → C4 kẻ địch/hiệu ứng → C5 HUD/màn hình. Mỗi bước xong là một commit riêng, kèm ảnh. Hết giờ thì dừng ở bước đang xong, không để dở.
