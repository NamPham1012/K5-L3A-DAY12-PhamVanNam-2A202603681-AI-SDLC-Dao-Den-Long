# JSONL output v1.0

Nguồn chuẩn: `docs/prd-0.md`, mục E. Mỗi dòng là một object JSON; thứ tự phải tất định.

- `snapshot`: tick 0 rồi các bội số snapshot-every; gồm `type,tick,sim_tick,state,time_left_s,score,player,lanterns,shades,motes_active`; player gồm `pos,flames,carried`; lantern gồm `id,pos,lit,deposited`; shade gồm `id,pos,state`. `motes` là khuyến nghị. Tọa độ làm tròn 3 chữ số thập phân.
- `event`: `type,tick,name,data`; cùng tick, sự kiện trước snapshot. Tên và data: `mote_picked {carried}`, `deposit {lantern_id,amount,deposited}`, `lantern_lit {lantern_id}`, `pulse {stunned_ids}`, `player_hit {by,flames,dropped}`, `shade_spawned {id}`, `game_over {result,reason}`. Giá trị result/reason và by theo PRD-0.
- `end`: dòng cuối bắt buộc `{type:"end",ticks,state,score}`; ticks là số bước thực sự đã chạy. State thuộc `playing`, `won`, `lost`; sim_tick bằng tick trong Phase 1.
- Không buộc thêm snapshot cuối nếu tick kết thúc không là bội số; cùng seed, scenario và inputs phải cho file giống hệt từng byte.
