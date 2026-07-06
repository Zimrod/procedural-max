// createForkliftEntity.ts
import { PartData, getPivot } from "../../core/utils/svgUtils";

export const createForkliftEntity = (base: any, bodyData: PartData, forkData: PartData) => {
  return {
    ...base,
    getPivots() {
      const { x, y } = this.transform;
      const scale: number = this.props?.scale ?? 1;

      const bodyGround  = getPivot(bodyData, 'pivot_ground');
      const forkMinBody = getPivot(bodyData, 'pivot_fork_min');
      const forkMinFork = getPivot(forkData, 'pivot_fork_min');

      // forkCarriageOffsetY is the FULL Y offset from pivot_ground to carriage
      // in world pixels — not a delta on top of the rest position.
      // Matches how ForkliftScene computes it:
      //   carriageY = bodyGroundWorld.y + forkCarriageOffsetY
      const forkCarriageOffsetY: number =
        this.props?.forkCarriageOffsetY ??
        (forkMinBody.y - bodyGround.y) * scale; // default: rest position

      const carriageWorldX = x + (forkMinBody.x - bodyGround.x) * scale;
      const carriageWorldY = y + forkCarriageOffsetY;

      // Fork pivots offset from fork SVG's own pivot_fork_min
      const forkToWorld = (fX: number, fY: number) => ({
        x: carriageWorldX + (fX - forkMinFork.x) * scale,
        y: carriageWorldY + (fY - forkMinFork.y) * scale,
      });

      return {
        pivot_ground:    { x, y },
        pivot_fork_tip:  forkToWorld(getPivot(forkData, 'pivot_fork_tip').x,  getPivot(forkData, 'pivot_fork_tip').y),
        pivot_fork_root: forkToWorld(getPivot(forkData, 'pivot_fork_root').x, getPivot(forkData, 'pivot_fork_root').y),
      };
    },
  };
};