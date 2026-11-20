# Phase 3 — thay đổi test và luật

- `FR-003-pickup-deposit`: event `lantern_lit` thêm `relight:false` theo contract 1.2.
- `FR2-012-deposit-score`: điểm mỗi đom đóm nạp giảm từ 10 xuống 5; vẫn kiểm tra không cộng khi nhặt và +100 lần đầu.
- `FR2-031-night2`, `FR2-051-all-nights`, `FR2-050-tuning`: thời gian Đêm đổi từ 300/330/360 sang 240/270/300 giây; tuning và điểm thay theo Ticket-03.
- `FR2-030-night1-map`: snapshot đèn có thêm fuel, ever_lit, relit_count; tiếp tục đối chiếu tọa độ và các trường cũ.
- `FR-061-tuning`, `FR2-050-tuning`: phiên bản contract chuyển 1.1 → 1.2 và kiểm tra tuning khớp runtime.
- `FR-010-all-lit`, `FR-010-ui-win`: bỏ thắng ngay khi đủ đèn; giữ kiểm tra không cộng điểm khi dựng và trạng thái đang chơi. Thắng được kiểm tra ở bình minh bằng test FR3.
- `FR-010-end-priority`, `FR-010-dawn`, `FR-010-no-flames`, `FR2-024-pulse-score`: được giữ khi các khẳng định vẫn đúng; test FR3 bổ sung ưu tiên bình minh và điểm pulse khi drain. Không skip.
- Acceptance #3 và #8 được sửa trong spec lúc 17:10: ví dụ cũ bỏ qua dầu hao ở bước 2. Test CLI #3 nay kiểm tra L1 được châm 1 đom đóm sau khi hao; unit test riêng xác nhận đèn có `fuel_u=6000` thực sự bị bỏ qua khi chọn. Test CLI #8 tính thưởng từ dầu sau 60 tick: `3×50 + floor(100−1) + floor(80−1) + floor(50−1) + 3×50 = 527`. Không skip test.
