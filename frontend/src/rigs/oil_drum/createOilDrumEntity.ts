// createOilDrumEntity.ts

import { PartData, getPivot } from "../../core/utils/svgUtils";

export const createOilDrumEntity = (base: any, oilDrumData: PartData) => {
  return {
    ...base,

    getPivots() {
      const { x, y } = this.transform;
      const scale: number = this.props?.scale ?? 1;

      // pivot_ground is the anchor — it sits at (x, y) in world space.
      const groundPivot = getPivot(oilDrumData, 'pivot_ground');
      const gx = groundPivot.x;
      const gy = groundPivot.y;

      const world = (svgX: number, svgY: number) => ({
        x: x + (svgX - gx) * scale,
        y: y + (svgY - gy) * scale,
      });

      return {
        pivot_ground:            world(gx, gy),
        pivot_bottom_left_edge:  world(getPivot(oilDrumData, 'pivot_bottom_left_edge').x,  getPivot(oilDrumData, 'pivot_bottom_left_edge').y),
        pivot_bottom_right_edge: world(getPivot(oilDrumData, 'pivot_bottom_right_edge').x, getPivot(oilDrumData, 'pivot_bottom_right_edge').y),
      };
    },
  };
};