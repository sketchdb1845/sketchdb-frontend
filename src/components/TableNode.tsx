import React from "react";
import { Handle, Position } from "@xyflow/react";
import type { TableAttribute } from "../types";

interface TableNodeProps {
  data: {
    label: string;
    attributes: TableAttribute[];
    color?: string;
  };
  id: string;
}

export const TableNode: React.FC<TableNodeProps> = ({ data, id }) => {
  const attributes = Array.isArray(data.attributes) ? data.attributes : [];

  return (
    <div 
      className="border-2 rounded-lg min-w-[200px] shadow-md relative bg-white border-blue-500"
    >
      {/* Table Header */}
      <div 
        className="text-white px-3 py-2 rounded-t-lg font-bold text-center bg-blue-500"
      >
        {typeof data.label === "string" ? data.label : `Table ${id}`}
      </div>

      {/* Attributes List */}
      <div className="py-2">
        {attributes.length > 0 ? (
          attributes.map((attr, idx) => (
            <div
              key={idx}
              className={`px-3 py-1 text-xs flex justify-between items-center relative min-h-[24px] ${
                idx < attributes.length - 1 ? "border-b border-gray-200" : ""
              } ${idx % 2 === 0 ? "bg-gray-50" : ""}`}
            >
              {/* Left handle (incoming connections) */}
              <Handle
                type="target"
                position={Position.Left}
                id={`${id}-${attr.name}-target`}
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: attr.type === "FK" ? "#FF6B6B" : "#0074D9",
                  position: 'absolute',
                  left: -4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  borderRadius: '50%',
                  border: '1px solid white'
                }}
              />

              {/* Right handle (outgoing connections) */}
              <Handle
                type="source"
                position={Position.Right}
                id={`${id}-${attr.name}-source`}
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: attr.type === "PK" ? "#FFD700" : "#0074D9",
                  position: 'absolute',
                  right: -4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  borderRadius: '50%',
                  border: '1px solid white'
                }}
              />

              <span className={attr.type === "PK" ? "font-bold" : ""}>
                {attr.name}
                {attr.type === "PK" && (
                  <span className="text-[#FFD700] ml-1">🔑</span>
                )}
                {attr.type === "FK" && (
                  <span className="text-[#FF6B6B] ml-1">🔗</span>
                )}
              </span>

              <span className="text-gray-500 text-[10px]">
                {attr.dataType || "VARCHAR(255)"}
              </span>
            </div>
          ))
        ) : (
          <div className="px-3 py-2 text-xs text-gray-400 italic">
            No attributes
          </div>
        )}
      </div>
    </div>
  );
};
