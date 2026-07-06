// createPalletEntity.ts

import { PartData, getPivot } from "../../core/utils/svgUtils";

export const createPalletEntity = (base: any, palletData: PartData) => {
  return {
    ...base,

    getPivots() {
      const { x, y } = this.transform;
      const scale: number = this.props?.scale ?? 1;

      // pivot_ground is the anchor — it sits at (x, y) in world space.
      const groundPivot = getPivot(palletData, 'pivot_ground');
      const gx = groundPivot.x;
      const gy = groundPivot.y;

      const world = (svgX: number, svgY: number) => ({
        x: x + (svgX - gx) * scale,
        y: y + (svgY - gy) * scale,
      });

      return {
        pivot_ground:         world(gx, gy),
        pivot_fork_root:      world(getPivot(palletData, 'pivot_fork_root').x,      getPivot(palletData, 'pivot_fork_root').y),
        pivot_fork_tip:       world(getPivot(palletData, 'pivot_fork_tip').x,       getPivot(palletData, 'pivot_fork_tip').y),
        pivot_top_left_edge:  world(getPivot(palletData, 'pivot_top_left_edge').x,  getPivot(palletData, 'pivot_top_left_edge').y),
        pivot_top_right_edge: world(getPivot(palletData, 'pivot_top_right_edge').x, getPivot(palletData, 'pivot_top_right_edge').y),
      };
    },
  };
};