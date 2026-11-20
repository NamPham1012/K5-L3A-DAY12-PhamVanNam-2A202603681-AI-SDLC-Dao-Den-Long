# Đảo Đèn Lồng Constitution

<!--
Sync Impact Report
- Version: 1.0.0 → 1.1.0 (bổ sung quy trình & bàn giao theo RUBRIC/SUBMISSION/GUIDE của lab)
- Nguyên tắc thêm mới: I–VI
- Templates cần rà: plan-template.md (Constitution Check) ✅ dùng 6 cổng dưới đây; tasks-template.md ✅ test contract trước
- TODO: không có
-->

## Core Principles

### I. Test Contract là luật tối cao (NON-NEGOTIABLE)
Test Contract v1.0 trong PRD-0 được coi là đặc tả chính xác, không được diễn giải lỏng. Mọi tên trường, tên sự kiện, mã thoát, mô hình tick, quy ước toạ độ phải khớp từng ký tự. Khi PRD-0 mơ hồ, contract thắng; khi contract mơ hồ, ta ghi giả định vào `spec.md › Clarifications` và README, không im lặng tự quyết.

### II. Lõi mô phỏng tách khỏi hiển thị
Toàn bộ luật chơi nằm trong một lõi mô phỏng thuần (không đồ hoạ, không âm thanh, không I/O ngoài tham số). Bản có giao diện và bản headless gọi **cùng một** lõi, cùng một hàm `step(input)`. Cấm viết luật chơi lần thứ hai trong lớp render.

### III. Tất định tuyệt đối
- Bước cố định 60 tick/giây; không dùng đồng hồ thực, `Math.random`/`random` toàn cục hay thứ tự duyệt không ổn định trong lõi.
- Một PRNG có seed duy nhất, do lõi sở hữu; id sinh theo bộ đếm (S1, S2…, M1, M2…).
- Thứ tự xử lý trong một tick được cố định và ghi trong spec; khi duyệt nhiều thực thể thì sắp theo id.
- Cùng seed + scenario + inputs ⇒ file JSONL giống hệt từng byte.

### IV. Bằng chứng trước khi tuyên bố xong
"Agent bảo chạy rồi" không phải bằng chứng. Mỗi yêu cầu chức năng phải có ít nhất một scenario/inputs JSON tự viết và một kiểm tra tự động trên JSONL. Chạy hai lần so `diff` cho tính tất định. Bằng chứng được lưu trong repo (`evidence/`).

### V. Đúng yêu cầu > phức tạp
Lõi đúng trước, sáng tạo sau. Mọi phần sáng tạo phải tắt được và **mặc định tắt khi headless**; không được làm đổi một byte nào của đầu ra contract. Ưu tiên một ý nhỏ chạy đúng hơn nhiều ý dở dang. Tiết kiệm token: không sinh code/ tài liệu thừa.

### VI. Một nguồn sự thật cho tham số
Mọi con số gameplay đọc từ một file cấu hình duy nhất và `game.contract.json › tuning` được sinh/kiểm tra từ chính file đó (có test so khớp). Không có "magic number" gameplay trong code.

## Ràng buộc kỹ thuật

- Chạy trên macOS/Linux, tối đa 3 lệnh từ clone tới chơi; Docker được phép nhưng không bắt buộc.
- Headless: không cửa sổ, không GPU, chạy nhanh nhất có thể; lỗi → stderr + mã ≠ 0; input/scenario sai định dạng → mã 2.
- Toạ độ xuất ra làm tròn 3 chữ số; khoảng cách gameplay đo trên mặt phẳng XZ.
- Phong cách: đêm, ấm, cổ tích; vàng-cam = tốt, tím-đen = nguy hiểm; không bạo lực, không máu me.

## Quy trình phát triển & bàn giao (theo RUBRIC/SUBMISSION của lab)

1. Phase 1 chỉ có 60 phút (gồm chuẩn bị): luồng rút gọn `speckit-specify → speckit-clarify → speckit-plan → speckit-tasks → speckit-implement`; `checklist`/`analyze`/`converge` chỉ chạy khi còn thời gian. Hết giờ thì tag `phase-1` dù chưa hoàn hảo, chỗ chưa đạt ghi trung thực.
2. Task contract/headless + test được làm và xanh **trước** task đồ hoạ.
3. **Một lệnh kiểm chứng**: `npm test` (unit + scenario headless + tất định); `npm run verify` chạy test và ghi bằng chứng vào `docs/proof/phase-N/`.
4. **Harness tối thiểu** (rubric C, B): `AGENTS.md` ngắn (< 40 dòng: lệnh build/test/headless, quy ước, điều cấm), cập nhật mỗi phase; skill `.agents/skills/verify-game/` (chạy verify, lưu bằng chứng); hook git `pre-push` chạy `npm test` — test đỏ thì không push/tag; CI GitHub Actions chạy `npm ci && npm test` mỗi lần push.
5. **Người đánh giá khác người viết**: sau implement, một agent/phiên riêng chỉ đọc spec + output headless để review, không sửa code.
6. **Ghi chép**: `docs/notes/assumptions.md`, `docs/notes/ai-log.md` (lời nhắc chính, lỗi AI và cách phát hiện, ước tính token mỗi phase), `docs/notes/retro.md` (đánh giá từng phase); `docs/proof/traceability.md` (yêu cầu → cách kiểm chứng → bằng chứng → đạt/chưa đạt).
7. **Trung thực bằng chứng**: cấm test luôn đạt, cấm sửa tay output; bằng chứng phải tái lập được ở đúng tag.
8. **Sẵn sàng đổi yêu cầu**: phase sau có thể thay luật; test gắn nhãn phase/FR; khi luật đổi thì sửa hoặc bỏ test kèm lý do, không tắt âm thầm. Không force-push sau khi tag; không xoá file harness.
9. Không commit `.env`/API key. Có `LICENSE`, `CREDITS.md` (ghi cả công cụ AI tạo nội dung).

## Governance

Constitution này đứng trên mọi quy ước khác trong repo. Plan phải có mục "Constitution Check" đi qua 6 nguyên tắc; vi phạm phải được ghi lý do trong "Complexity Tracking". Sửa đổi: tăng MINOR khi thêm nguyên tắc, MAJOR khi bỏ/đổi nghĩa nguyên tắc, PATCH khi sửa câu chữ.

**Version**: 1.1.0 | **Ratified**: 2026-11-20 | **Last Amended**: 2026-11-20
