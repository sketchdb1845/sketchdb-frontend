import React from 'react';
import type { EdgeProps } from '@xyflow/react';
import {
  getSmoothStepPath,
  Position,
  BaseEdge,
  EdgeLabelRenderer,
} from '@xyflow/react';


interface CustomEdgeProps extends EdgeProps {}

const CustomEdge: React.FC<CustomEdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  markerStart,
  label,
  labelStyle,
  labelShowBg,
  labelBgPadding,
  labelBgBorderRadius,
}) => {
  // Determine the best source and target positions based on node positions
  // This mimics ChartDB's logic for choosing the shortest path
  const getOptimalPositions = () => {
    // Calculate horizontal distance to determine which sides to connect
    const horizontalDistance = Math.abs(targetX - sourceX);
    const verticalDistance = Math.abs(targetY - sourceY);
    
    let optimalSourcePosition: Position;
    let optimalTargetPosition: Position;
    
    // If target is to the right of source, connect from right to left
    if (targetX > sourceX) {
      optimalSourcePosition = Position.Right;
      optimalTargetPosition = Position.Left;
    } 
    // If target is to the left of source, connect from left to right
    else {
      optimalSourcePosition = Position.Left;
      optimalTargetPosition = Position.Right;
    }
    
    // For very close vertical alignment, prefer top/bottom connections
    if (horizontalDistance < 100 && verticalDistance > horizontalDistance) {
      if (targetY > sourceY) {
        optimalSourcePosition = Position.Bottom;
        optimalTargetPosition = Position.Top;
      } else {
        optimalSourcePosition = Position.Top;
        optimalTargetPosition = Position.Bottom;
      }
    }
    
    return {
      sourcePos: sourcePosition || optimalSourcePosition,
      targetPos: targetPosition || optimalTargetPosition,
    };
  };

  const { sourcePos, targetPos } = getOptimalPositions();

  // Calculate the path using getSmoothStepPath for 90-degree corners
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition: sourcePos,
    targetX,
    targetY,
    targetPosition: targetPos,
    borderRadius: 8, // Controls corner rounding (0 = sharp 90°, higher = more rounded)
    offset: 20, // Offset for the step
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        markerStart={markerStart}
        className="stroke-blue-600"
        style={{
          strokeWidth: 2,
          ...style,
        }}
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: labelShowBg ? '#ffffff' : 'transparent',
              padding: labelBgPadding?.[0] || 2,
              borderRadius: labelBgBorderRadius || 2,
              ...labelStyle,
            }}
            className="text-xs font-bold text-blue-600 nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default CustomEdge;