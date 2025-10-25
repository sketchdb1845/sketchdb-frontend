import React from "react";

interface ToolbarProps {
  onAddTable: () => void;
  onExportSQL: () => void;
  onImportSchema: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  onAddTable, 
  onExportSQL, 
  onImportSchema,
  onExportPNG,
  onExportPDF 
}) => {
  return (
    <div className="absolute top-4 left-4 flex space-x-4 z-10">
      <button
        onClick={onAddTable}
        className="cursor-pointer w-[200px] h-[75px] bg-yellow-400 hover:bg-yellow-500 rounded-md font-bold"
      >
        Add Table
      </button>
      <button
        onClick={onImportSchema}
        className="cursor-pointer w-[200px] h-[75px] bg-green-500 hover:bg-green-600 text-white rounded-md font-bold"
      >
        Import Schema
      </button>
      <button
        onClick={onExportSQL}
        className="cursor-pointer w-[200px] h-[75px] bg-[#0074D9] hover:bg-blue-600 text-white rounded-md font-bold"
      >
        Export to SQL
      </button>
      <button
        onClick={onExportPNG}
        className="cursor-pointer w-[200px] h-[75px] bg-purple-500 hover:bg-purple-600 text-white rounded-md font-bold"
      >
        Export as PNG
      </button>
      <button
        onClick={onExportPDF}
        className="cursor-pointer w-[200px] h-[75px] bg-red-500 hover:bg-red-600 text-white rounded-md font-bold"
      >
        Export as PDF
      </button>
    </div>
  );
};
