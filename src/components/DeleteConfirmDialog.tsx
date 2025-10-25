import React from 'react';
import type { Node } from '@xyflow/react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  selectedTable: Node | undefined;
  selectedTableId: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  selectedTable,
  selectedTableId,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const tableName =
    typeof selectedTable?.data.label === 'string'
      ? selectedTable.data.label
      : `Table ${selectedTableId}`;

  return (
    <div
      className="
        absolute top-[150px] left-1/2 -translate-x-1/2 
        z-[100] bg-white border-2 border-red-500 
        rounded-lg shadow-lg p-6 min-w-[300px]
      "
    >
      <h3 className="mt-0 text-red-500 font-semibold text-lg">Delete Table</h3>
      <p>Are you sure you want to delete "{tableName}"?</p>
      <p className="text-sm text-gray-600">This action cannot be undone.</p>
      <div className="flex justify-between mt-4">
        <button
          onClick={onConfirm}
          className="cursor-pointer bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
        >
          Delete
        </button>
        <button
          onClick={onCancel}
          className="cursor-pointer bg-gray-400 text-white px-4 py-2 rounded-md hover:bg-gray-500"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};