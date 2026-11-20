# Performance Benchmark: Phase 2 — Headless 21.600 tick

- **Tiêu chuẩn**: FR2-056 / SC2-002 (chạy đủ 21.600 tick không kết thúc sớm trong ≤ 30 giây).
- **Lệnh đo**: `node dist/headless.js --seed 42 --night 3 --scenario <idle-400s> --ticks 21600 --snapshot-every 600`
- **Môi trường máy**: win32 10.0.26200 (x64), Node v24.22.1, CPU: AMD Ryzen 7 8745H with Radeon 780M Graphics
- **Kết quả thực tế**:
  - `end.ticks`: `21600`
  - `end.state`: `playing`
  - Thời gian chạy thực tế: **212.91 ms** (0.213 s)
- **Kết luận Headless**: **ĐẠT** (0.213 s ≤ 30 s).
- **Đo FPS Web (1280×720 trong 60s)**: **CHƯA ĐẠT** (chưa triển khai Nhóm C).
