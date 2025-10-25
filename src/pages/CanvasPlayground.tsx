import { useCallback, useState } from "react";
import {
  ReactFlow,
  addEdge,
  MiniMap,
  Controls,
  Background,
  useEdgesState,
} from "@xyflow/react";
import type {
  Connection,
  Edge,
  Node,
  NodeTypes,
  EdgeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

// Components
import {
  TableNode,
  Sidebar,
  SQLDialog,
  ImportDialog,
  DeleteConfirmDialog,
  Toolbar,
  LoadingDialog,
  ErrorDialog,
  CustomEdge,
} from "../components";

// Hooks
import { useTableManagement } from "../hooks/useTableManagement";

// Utils
import {
  parseConnectionHandles,
  createStyledEdge,
  isValidConnection,
} from "../utils/connectionUtils";
import { generateSQL, copyToClipboard } from "../utils/sqlGenerator";
import { parseSQLSchema } from "../utils/sqlParser";
import { exportCanvasAsPNG, exportCanvasAsPDF } from "../utils/canvasExport";
import { useErrorHandler } from "../utils/errorHandler";

// Node types configuration
const nodeTypes: NodeTypes = {
  tableNode: TableNode,
};

// Edge types configuration
const edgeTypes: EdgeTypes = {
  customEdge: CustomEdge,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function CanvasPlayground() {
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Error handling
  const { error, showError, clearError, retryOperation, hasError } = useErrorHandler();

  // Dialog states
  const [sqlDialogOpen, setSqlDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [loadingDialogOpen, setLoadingDialogOpen] = useState(false);
  const [sqlText, setSqlText] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [lastOperation, setLastOperation] = useState<(() => void) | null>(null);

  // Table management hook
  const {
    nodes,
    selectedTableId, // <-- add this
    selectedTable,
    attributes,
    isEditingTableName,
    editTableName,
    attrName,
    attrType,
    attrDataType,
    refTable,
    refAttr,

    setSelectedTableId,
    onNodesChange,
    addTable,
    deleteTable,
    addAttribute,
    startEditTableName,
    saveTableName,
    cancelEditTableName,

    // Attribute editing
    onStartAttrEdit,
    onAttrEditNameChange,
    onAttrEditDataTypeChange,
    onAttrEditTypeChange,
    onAttrEditRefTableChange,
    onAttrEditRefAttrChange,
    onSaveAttrName,
    onCancelAttrEdit,
    onDeleteAttribute,

    updateNodeAttributes,

    setEditTableName,
    setAttrName,
    setAttrType,
    setAttrDataType,
    setRefTable,
    setRefAttr,
    
    // FK Helper functions
    getAvailableTables,
    importNodes,
  } = useTableManagement(initialNodes, setEdges);

  // Import schema functionality
  const importSchema = useCallback((sqlText: string) => {
    try {
      // Parse SQL to nodes and edges
      const { nodes: parsedNodes, edges: parsedEdges } = parseSQLSchema(sqlText);
      
      // Replace all nodes and edges with imported ones
      importNodes(parsedNodes);
      setEdges(parsedEdges);
      
      console.log('Schema imported successfully:', { parsedNodes, parsedEdges });
    } catch (error) {
      console.error('Failed to import schema:', error);
      throw error; // Re-throw to be handled by ImportDialog
    }
  }, [importNodes, setEdges]);

  // Import dialog handlers
  const handleImportSchema = useCallback(() => {
    setImportDialogOpen(true);
  }, []);

  const handleImportClose = useCallback(() => {
    setImportDialogOpen(false);
  }, []);

  const handleImportError = useCallback((error: any) => {
    showError(error, 'import');
    setLastOperation(() => () => setImportDialogOpen(true));
  }, [showError]);

  // Canvas export handlers
  const handleExportPNG = useCallback(async () => {
    try {
      setLoadingDialogOpen(true);
      await exportCanvasAsPNG();
    } catch (error) {
      console.error("Export PNG failed:", error);
      showError(error, "export");
      setLastOperation(() => handleExportPNG);
    } finally {
      setLoadingDialogOpen(false);
    }
  }, [showError]);

  const handleExportPDF = useCallback(async () => {
    try {
      setLoadingDialogOpen(true);
      await exportCanvasAsPDF();
    } catch (error) {
      console.error("Export PDF failed:", error);
      showError(error, "export");
      setLastOperation(() => handleExportPDF);
    } finally {
      setLoadingDialogOpen(false);
    }
  }, [showError]);

  // Connection handling
  const onConnect = useCallback(
    (params: Edge | Connection) => {
      try {
        const connectionInfo = parseConnectionHandles(
          params.sourceHandle || null,
          params.targetHandle || null
        );

        if (connectionInfo) {
          updateNodeAttributes(connectionInfo);
        }

        const newEdge = createStyledEdge(params, nodes);
        setEdges((eds) => addEdge(newEdge as Connection, eds));
      } catch (error) {
        console.error("Failed to create connection:", error);
        showError(
          new Error(
            "Failed to create connection between tables. Please try again."
          ),
          "validation"
        );
      }
    },
    [setEdges, updateNodeAttributes, showError, nodes]
  );

  // Node selection
  const onNodeClick = useCallback(
    (_: any, node: Node) => {
      try {
        setSelectedTableId(node.id);
      } catch (error) {
        console.error("Failed to select node:", error);
        showError(
          new Error("Failed to select table. Please try again."),
          "validation"
        );
      }
    },
    [setSelectedTableId, showError]
  );

  // SQL Export with loading animation and error handling
  const exportToSQL = useCallback(() => {
    try {
      setLoadingDialogOpen(true);

      // Validate nodes before generation
      if (!nodes || nodes.length === 0) {
        throw new Error(
          "No tables available to export. Please create some tables first."
        );
      }

      const sql = generateSQL(nodes);

      const timeoutId = setTimeout(() => {
        setLoadingDialogOpen(false);
        setSqlText(sql);
        setSqlDialogOpen(true);
      }, 1500); // Reduced timeout for better UX

      return timeoutId;
    } catch (error) {
      setLoadingDialogOpen(false);
      console.error("SQL export failed:", error);
      showError(error, "export");
      setLastOperation(() => exportToSQL);
    }
  }, [nodes, showError]);

  const handleCancelLoading = useCallback(() => {
    setLoadingDialogOpen(false);
  }, []);

  const handleCopySQL = useCallback(() => {
    try {
      copyToClipboard(sqlText);
      // You could show a success toast here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showError(new Error('Failed to copy SQL to clipboard. Please try selecting and copying manually.'), 'export');
    }
  }, [sqlText, showError]);

  // Wrapped functions with error handling
  const handleAddAttribute = useCallback(() => {
    try {
      addAttribute();
    } catch (error) {
      console.error('Failed to add attribute:', error);
      showError(error, 'validation');
    }
  }, [addAttribute, showError]);

  const handleAddTable = useCallback(() => {
    try {
      addTable();
    } catch (error) {
      console.error('Failed to add table:', error);
      showError(error, 'validation');
    }
  }, [addTable, showError]);

  // Error handling
  const handleRetryOperation = useCallback(() => {
    if (lastOperation) {
      retryOperation(lastOperation);
      setLastOperation(null);
    } else {
      clearError();
    }
  }, [lastOperation, retryOperation, clearError]);

  // Delete handlers
  const handleDeleteTable = useCallback(() => {
    try {
      deleteTable();
      setDeleteConfirmOpen(false);
    } catch (error) {
      console.error('Failed to delete table:', error);
      showError(error, 'validation');
    }
  }, [deleteTable, showError]);

  return (
    <div className="w-screen h-screen flex">
      {/* Sidebar */}
      <Sidebar
        selectedTable={selectedTable}
        attributes={attributes}
        isEditingTableName={isEditingTableName}
        editTableName={editTableName}
        attrName={attrName}
        attrType={attrType}
        attrDataType={attrDataType}
        refTable={refTable}
        refAttr={refAttr}
        onStartEditTableName={startEditTableName}
        onSaveTableName={saveTableName}
        onCancelEditTableName={cancelEditTableName}
        onEditTableNameChange={setEditTableName}
        onDeleteTable={deleteTable}
        onAttrNameChange={setAttrName}
        onAttrDataTypeChange={setAttrDataType}
        onAttrTypeChange={setAttrType}
        onRefTableChange={setRefTable}
        onRefAttrChange={setRefAttr}
        onAddAttribute={handleAddAttribute}
        onStartAttrEdit={onStartAttrEdit}
        onAttrEditNameChange={onAttrEditNameChange}
        onAttrEditDataTypeChange={onAttrEditDataTypeChange}
        onAttrEditTypeChange={onAttrEditTypeChange}
        onAttrEditRefTableChange={onAttrEditRefTableChange}
        onAttrEditRefAttrChange={onAttrEditRefAttrChange}
        onSaveAttrName={onSaveAttrName}
        onCancelAttrEdit={onCancelAttrEdit}
        onDeleteAttribute={onDeleteAttribute}
        getAvailableTables={getAvailableTables}
      />

      {/* Main Canvas Area */}
      <div className="flex-1 relative">
        {/* Toolbar */}
        <Toolbar
          onAddTable={handleAddTable}
          onExportSQL={exportToSQL}
          onImportSchema={handleImportSchema}
          onExportPNG={handleExportPNG}
          onExportPDF={handleExportPDF}
        />

        {/* Loading Dialog */}
        <LoadingDialog
          isOpen={loadingDialogOpen}
          message="Parsing to SQL..."
          onCancel={handleCancelLoading}
        />

        {/* Import Dialog */}
        <ImportDialog
          isOpen={importDialogOpen}
          onClose={handleImportClose}
          onImport={importSchema}
          onError={handleImportError}
        />

        {/* SQL Dialog */}
        <SQLDialog
          isOpen={sqlDialogOpen}
          sqlText={sqlText}
          onClose={() => setSqlDialogOpen(false)}
          onCopy={handleCopySQL}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmDialog
          isOpen={deleteConfirmOpen}
          selectedTable={selectedTable}
          selectedTableId={selectedTableId}
          onConfirm={handleDeleteTable}
          onCancel={() => setDeleteConfirmOpen(false)}
        />

        {/* Error Dialog */}
        <ErrorDialog
          isOpen={hasError}
          title={error?.title || 'Error'}
          message={error?.message || 'An unexpected error occurred'}
          details={error?.details}
          onClose={clearError}
          onRetry={error?.retryable ? handleRetryOperation : undefined}
        />

        {/* React Flow */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          isValidConnection={isValidConnection}
          fitView
          connectionLineStyle={{ stroke: "#0074D9", strokeWidth: 3 }}
          defaultEdgeOptions={{
            type: "customEdge",
            style: { stroke: "#0074D9", strokeWidth: 2 },
            markerEnd: { type: "arrowclosed", color: "#0074D9" },
            labelBgStyle: { fill: "#ffffff", fillOpacity: 0.8 },
            labelStyle: { fill: "#0074D9", fontWeight: "bold" },
          }}
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}
