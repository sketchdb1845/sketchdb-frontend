import React, { useState } from "react";

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (sqlText: string) => void;
  onError: (error: any) => void;
}

export const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
  onImport,
  onError,
}) => {
  const [sqlText, setSqlText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async () => {
    if (!sqlText.trim()) {
      onError(new Error("Please enter some SQL code to import"));
      return;
    }

    setIsLoading(true);
    try {
      await onImport(sqlText);
      setSqlText("");
      onClose();
    } catch (error) {
      console.error("Import failed:", error);
      onError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSqlText("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-lg p-6 max-w-[80%] max-h-[80%] w-[600px] flex flex-col shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="m-0 text-blue-600">Import SQL Schema</h2>
          <button
            onClick={handleClose}
            className="bg-transparent border-none text-xl cursor-pointer text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-bold text-gray-800">
            Paste your SQL schema here:
          </label>
          <textarea
            value={sqlText}
            onChange={(e) => setSqlText(e.target.value)}
            placeholder="CREATE TABLE users (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255)
);

CREATE TABLE posts (
  id INT PRIMARY KEY,
  title VARCHAR(255),
  user_id INT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);"
            className="w-full h-75 p-3 border border-gray-300 rounded font-mono text-sm resize-y outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className={`px-4 py-2 border border-gray-300 rounded bg-white ${
              isLoading
                ? "cursor-not-allowed opacity-60"
                : "cursor-pointer hover:bg-gray-50"
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!sqlText.trim() || isLoading}
            className={`px-4 py-2 border-none rounded text-white font-bold ${
              !sqlText.trim() || isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 cursor-pointer hover:bg-blue-700"
            }`}
          >
            {isLoading ? "Importing..." : "Import Schema"}
          </button>
        </div>
      </div>
    </div>
  );
};
