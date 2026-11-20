# Contract v1.1 — phần thay đổi so với v1.0

Nguồn bắt buộc: `docs/ticket-02.md` phần 1–4; phần không bị thay thế tiếp tục theo `docs/prd-0.md` và [contract Phase 1](../../001-phase1-night1/contracts/cli.md). Các giả định ★ trong [spec.md](../spec.md) chưa được xác nhận.

- `game.contract.json`: `contract_version: "1.1"`; tuning theo số chuẩn, thêm `dash_speed`, `dash_duration_s`, `dash_cooldown_s`, `night2_duration_s`, `night3_duration_s`. `--night` nhận 1, 2, 3.
- Input frame thêm `dash`, `pause`, kích hoạt cạnh false→true. Khi pause, `tick` vẫn tăng, `sim_tick`, timer và spawn đứng yên; snapshot `state:"paused"`.
- Snapshot thêm `night`, `wind {active,dir_deg}`; player thêm `vel`, `grounded`, `invuln`, `dash_cd_s`, `pulse_cd_s`, `charm_s`. Các mảng bắt buộc: `motes[{id,pos,kind,ttl_s}]`, `drifters[{id,pos,state,stolen}]`, `charms[{id,available,respawn_s}]`. `invuln` là số giây theo giả định ★, random mote có ttl null theo spec.
- Scenario thêm `player.{invuln_ticks,dash_cd_ticks,pulse_cd_ticks,charm_ticks}`, `shades[].{state,state_ticks_left}`, `drifters`, `charms`, `random_drifters`, `wind_enabled`; mảng drifters/charms thay danh sách mặc định.
- Event thêm `dash {}`, `charm_picked {charm_id,charm_ticks}`, `drifter_steal {drifter_id,amount,carried}`, `drifter_drop {drifter_id,amount}`, `night_start {night}`, `paused {}`, `resumed {}`. `player_hit` do rơi thêm `lost`. Tick 0 của `night_start` là giả định ★.
- Shade state dùng đúng `spawning`, `wander`, `chase`, `recoil`, `stunned`. Thứ tự 12 bước và điều kiện thắng/thua theo Ticket-02; khi hết lửa thì thua trước mọi điều kiện khác.
- Headless tối đa 21.600 tick hoàn thành trong ≤ 30 giây; output tất định với cùng seed/scenario/inputs.
