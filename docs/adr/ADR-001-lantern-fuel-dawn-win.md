# ADR-001: Đèn có nhiên liệu và luật thắng "sống tới bình minh"

- Trạng thái: Chấp nhận · Ngày: 2026-11-20 · Phase 3 (Ticket-03, Contract v1.2)

## Bối cảnh
Playtest: người chơi giỏi thắp hết đèn trong ~2 phút, Đêm kết thúc sớm, thiếu căng thẳng cuối Đêm. Ticket-03 đổi mục tiêu từ "thắp hết" sang "giữ đảo sáng tới bình minh".

## Quyết định
1. **Mô hình trạng thái đèn**: trước đây `unlit → lit` (một chiều, `lit` là trạng thái cuối). Nay là vòng: `unlit(ever_lit=false) → lit(fuel) → out(ever_lit=true) → lit(fuel=100) …`. Thêm trường `fuel_u` (số nguyên, đơn vị 1/60 dầu), `ever_lit`, `relit_count`. Chi phí thắp phụ thuộc `ever_lit` (10 / 5).
2. **Dầu là số nguyên 1/60**: hao 1 u/tick, drain 5 u/tick/Bóng Mực, châm 600 u/đom đóm ⇒ tất định tuyệt đối, không sai số số thực; chỉ làm tròn khi xuất JSONL.
3. **Luật thắng**: bỏ thắng sớm `all_lit`. Kết thúc chỉ do hết lửa (`no_flames`, luôn ưu tiên) hoặc hết giờ: đủ ceil(0.6·N) đèn sáng → `dawn_survived`, thiếu → `dawn`.
4. **Bóng Mực có mục tiêu**: thêm trạng thái `drain` và mục tiêu đèn cho `wander`; vùng an toàn phụ thuộc `fuel ≥ 30`.
5. **Thứ tự tick**: giữ 12 bước Ticket-02; bước 2 trừ dầu (hao + hút) và ngay sau đó xử lý đèn tắt; xét thắng/thua sau mọi cập nhật.

## Hệ quả
- Test cũ dựa trên `all_lit`, thưởng thời gian, điểm +10/mote, thời lượng 300/330/360 bị thay: cập nhật hoặc xoá kèm lý do (xem `docs/notes/phase3-changes.md`).
- Interact giờ có thể nhắm đèn đang sáng (châm dầu) ⇒ hàm chọn đèn đổi điều kiện ứng viên.
- HUD/web phải hiển thị dầu và ngưỡng thắng; chế độ mù màu đổi màu Bóng Mực/cảnh báo.

## Phương án đã loại
- Lưu dầu số thực + epsilon: dễ lệch giữa nền tảng.
- Giữ `all_lit` như thắng phụ: trái ticket.
