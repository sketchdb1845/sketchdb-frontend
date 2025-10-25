import { useState, useCallback } from 'react';
import { useNodesState } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import type { TableAttribute, AttributeType, DataType, TableData } from '../types';

export const useTableManagement = (
  initialNodes: Node[], 
  setEdges?: React.Dispatch<React.SetStateAction<Edge[]>>
) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  
  // Table name editing state
  const [isEditingTableName, setIsEditingTableName] = useState(false);
  const [editTableName, setEditTableName] = useState("");
  
  // Attribute form state
  const [attrName, setAttrName] = useState("");
  const [attrType, setAttrType] = useState<AttributeType>('normal');
  const [attrDataType, setAttrDataType] = useState<DataType>("VARCHAR(255)");
  const [refTable, setRefTable] = useState("");
  const [refAttr, setRefAttr] = useState("");
  
  const selectedTable = nodes.find((n) => n.id === selectedTableId);
  const attributes = Array.isArray(selectedTable?.data?.attributes) ? selectedTable.data.attributes : [];

  // Helper functions for FK relationships
  const getAvailableTables = useCallback(() => {
    return nodes
      .filter(node => node.id !== selectedTableId) // Exclude current table
      .map(node => ({
        id: node.id,
        label: typeof node.data?.label === 'string' ? node.data.label : `Table ${node.id}`,
        attributes: Array.isArray(node.data?.attributes) ? node.data.attributes : []
      }));
  }, [nodes, selectedTableId]);

  const getAttributesForTable = useCallback((tableId: string) => {
    const table = nodes.find(node => node.id === tableId);
    if (!table || !Array.isArray(table.data?.attributes)) return [];
    
    return table.data.attributes
      .filter((attr: TableAttribute) => attr.type === 'PK' || attr.type === 'normal')
      .map((attr: TableAttribute) => ({
        name: attr.name,
        type: attr.type,
        dataType: attr.dataType
      }));
  }, [nodes]);

  const validateFKReference = useCallback((refTableId: string, refAttrName: string) => {
    const refTable = nodes.find(node => node.id === refTableId);
    if (!refTable || !Array.isArray(refTable.data?.attributes)) return false;
    
    return refTable.data.attributes.some((attr: TableAttribute) => 
      attr.name === refAttrName && (attr.type === 'PK' || attr.type === 'normal')
    );
  }, [nodes]);

  // Edge management functions
  const createFKEdge = useCallback((sourceTableId: string, sourceAttrName: string, targetTableId: string, targetAttrName: string) => {
    if (!setEdges) return;
    
    const sourceHandle = `${sourceTableId}-${sourceAttrName}-source`;
    const targetHandle = `${targetTableId}-${targetAttrName}-target`;
    const edgeId = `${sourceTableId}-${sourceAttrName}-to-${targetTableId}-${targetAttrName}`;
    
    setEdges((edges) => {
      // Remove any existing edge with the same source/target handles or ID
      const filteredEdges = edges.filter(edge => {
        return !(
          (edge.source === sourceTableId && edge.target === targetTableId && 
           edge.sourceHandle === sourceHandle && edge.targetHandle === targetHandle) ||
          edge.id === edgeId
        );
      });
      
      const newEdge: Edge = {
        id: edgeId,
        source: sourceTableId,
        target: targetTableId,
        sourceHandle,
        targetHandle,
        style: {
          stroke: '#0074D9',
          strokeWidth: 2,
        },
        markerEnd: {
          type: 'arrowclosed' as const,
          color: '#0074D9',
        },
        label: 'FK Relationship',
        labelStyle: { fill: '#0074D9', fontWeight: 'bold', fontSize: 10 },
      };
      
      return [...filteredEdges, newEdge];
    });
  }, [setEdges]);

  const removeFKEdge = useCallback((sourceTableId: string, sourceAttrName: string, targetTableId: string, targetAttrName: string) => {
    if (!setEdges) return;
    
    const sourceHandle = `${sourceTableId}-${sourceAttrName}-source`;
    const targetHandle = `${targetTableId}-${targetAttrName}-target`;
    
    setEdges((edges) => 
      edges.filter(edge => {
        // Remove edge if it matches the FK relationship being removed
        return !(
          (edge.source === sourceTableId && edge.target === targetTableId && 
           edge.sourceHandle === sourceHandle && edge.targetHandle === targetHandle) ||
          // Also check for the custom ID format we create
          edge.id === `${sourceTableId}-${sourceAttrName}-to-${targetTableId}-${targetAttrName}`
        );
      })
    );
  }, [setEdges]);

  const removeEdgesByAttribute = useCallback((tableId: string, attrName: string) => {
    if (!setEdges) return;
    
    setEdges((edges) => 
      edges.filter(edge => {
        // Remove edges where this attribute is involved (as source or target)
        const sourceHandle = `${tableId}-${attrName}-source`;
        const targetHandle = `${tableId}-${attrName}-target`;
        
        return !(
          edge.sourceHandle === sourceHandle || 
          edge.targetHandle === targetHandle ||
          // Also check for edges that involve this table and attribute in any way
          (edge.source === tableId && edge.sourceHandle?.includes(`-${attrName}-`)) ||
          (edge.target === tableId && edge.targetHandle?.includes(`-${attrName}-`))
        );
      })
    );
  }, [setEdges]);

  const importNodes = useCallback((newNodes: Node[]) => {
    setNodes(newNodes);
    setSelectedTableId(null);
  }, [setNodes, setSelectedTableId]);

  // Add Table
  const addTable = useCallback(() => {
    setNodes((nds) => [
      ...nds,
      {
        id: `table-${nds.length + 1}`,
        data: {
          label: `Table ${nds.length + 1}`,
          attributes: [],
        },
        position: { x: 100 + nds.length * 50, y: 100 + nds.length * 50 },
        type: 'tableNode',
      },
    ]);
  }, [setNodes]);

  // Delete Table
  const deleteTable = useCallback(() => {
    if (!selectedTableId) return;
    
    // Remove all edges associated with this table
    if (setEdges) {
      setEdges((edges) => 
        edges.filter(edge => 
          edge.source !== selectedTableId && edge.target !== selectedTableId
        )
      );
    }
    
    setNodes((nds) => nds.filter((node) => node.id !== selectedTableId));
    setSelectedTableId(null);
  }, [selectedTableId, setNodes, setEdges]);

  // Add Attribute
  const addAttribute = useCallback(() => {
    if (!selectedTableId || !attrName) {
      throw new Error('Please select a table and provide an attribute name');
    }
    
    // Validate attribute name
    if (attrName.trim().length === 0) {
      throw new Error('Attribute name cannot be empty');
    }
    
    // Check for duplicate attribute names
    const existingAttr = attributes.find(attr => attr.name.toLowerCase() === attrName.toLowerCase());
    if (existingAttr) {
      throw new Error(`An attribute named '${attrName}' already exists in this table`);
    }
    
    // Validate FK reference if adding FK attribute
    if (attrType === 'FK') {
      if (!refTable || !refAttr) {
        throw new Error('Foreign key reference is incomplete. Please select both reference table and attribute.');
      }
      
      // Find the referenced table by label
      const refTableNode = nodes.find(n => 
        typeof n.data?.label === 'string' && n.data.label === refTable
      );
      
      if (!refTableNode) {
        throw new Error(`Referenced table "${refTable}" not found`);
      }
      
      // Check if referenced attribute exists
      const refAttrExists = Array.isArray(refTableNode.data?.attributes) && 
        refTableNode.data.attributes.some((a: TableAttribute) => a.name === refAttr);
      
      if (!refAttrExists) {
        throw new Error(`Referenced attribute "${refAttr}" not found in table "${refTable}"`);
      }
      
      // Create FK edge if validation passes
      if (setEdges) {
        createFKEdge(refTableNode.id, refAttr, selectedTableId, attrName);
      }
    }
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        const oldAttrs = Array.isArray(node.data.attributes) ? node.data.attributes : [];
        const newAttr: TableAttribute = { 
          name: attrName, 
          type: attrType, 
          dataType: attrDataType,
          refTable: attrType === 'FK' ? refTable : undefined, 
          refAttr: attrType === 'FK' ? refAttr : undefined,
          isEditing: false,   
          editName: ""        
        };
        return {
          ...node,
          data: {
            ...node.data,
            attributes: [...oldAttrs, newAttr],
          },
        };
      })
    );
    
    // Reset form
    setAttrName("");
    setAttrType('normal');
    setAttrDataType("VARCHAR(255)");
    setRefTable("");
    setRefAttr("");
  }, [selectedTableId, attrName, attrType, attrDataType, refTable, refAttr, setNodes, nodes, setEdges, createFKEdge, attributes]);

  // Start Editing Table Name
  const startEditTableName = useCallback(() => {
    if (selectedTable) {
      const currentLabel = typeof selectedTable.data.label === 'string' 
        ? selectedTable.data.label 
        : `Table ${selectedTable.id}`;
      setEditTableName(currentLabel);
      setIsEditingTableName(true);
    }
  }, [selectedTable]);

  // Save Table Name
  const saveTableName = useCallback(() => {
    if (!selectedTableId || !editTableName.trim()) return;
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        return {
          ...node,
          data: {
            ...node.data,
            label: editTableName.trim(),
          },
        };
      })
    );
    setIsEditingTableName(false);
    setEditTableName("");
  }, [selectedTableId, editTableName, setNodes]);

  const cancelEditTableName = useCallback(() => {
    setIsEditingTableName(false);
    setEditTableName("");
  }, []);

  // Attribute Editing Functions
  const onStartAttrEdit = useCallback((idx: number) => {
    if (!selectedTableId) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        const nodeData = node.data as TableData;
        const updatedAttrs = nodeData.attributes.map((attr: TableAttribute, i: number) =>
          i === idx ? { 
            ...attr, 
            isEditing: true, 
            editName: attr.name,
            editDataType: attr.dataType as DataType,
            editType: attr.type,
            editRefTable: attr.refTable || "",
            editRefAttr: attr.refAttr || ""
          } : attr
        );
        return { ...node, data: { ...nodeData, attributes: updatedAttrs } };
      })
    );
  }, [selectedTableId, setNodes]);

  const onAttrEditNameChange = useCallback((idx: number, value: string) => {
    if (!selectedTableId) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        const nodeData = node.data as TableData;
        const updatedAttrs = nodeData.attributes.map((attr: TableAttribute, i: number) =>
          i === idx ? { ...attr, editName: value } : attr
        );
        return { ...node, data: { ...nodeData, attributes: updatedAttrs } };
      })
    );
  }, [selectedTableId, setNodes]);

  const onAttrEditDataTypeChange = useCallback((idx: number, value: DataType) => {
    if (!selectedTableId) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        const nodeData = node.data as TableData;
        const updatedAttrs = nodeData.attributes.map((attr: TableAttribute, i: number) =>
          i === idx ? { ...attr, editDataType: value } : attr
        );
        return { ...node, data: { ...nodeData, attributes: updatedAttrs } };
      })
    );
  }, [selectedTableId, setNodes]);

  const onAttrEditTypeChange = useCallback((idx: number, value: AttributeType) => {
    if (!selectedTableId) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        const nodeData = node.data as TableData;
        const updatedAttrs = nodeData.attributes.map((attr: TableAttribute, i: number) =>
          i === idx ? { ...attr, editType: value } : attr
        );
        return { ...node, data: { ...nodeData, attributes: updatedAttrs } };
      })
    );
  }, [selectedTableId, setNodes]);

  const onAttrEditRefTableChange = useCallback((idx: number, value: string) => {
    if (!selectedTableId) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        const nodeData = node.data as TableData;
        const updatedAttrs = nodeData.attributes.map((attr: TableAttribute, i: number) =>
          i === idx ? { ...attr, editRefTable: value } : attr
        );
        return { ...node, data: { ...nodeData, attributes: updatedAttrs } };
      })
    );
  }, [selectedTableId, setNodes]);

  const onAttrEditRefAttrChange = useCallback((idx: number, value: string) => {
    if (!selectedTableId) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        const nodeData = node.data as TableData;
        const updatedAttrs = nodeData.attributes.map((attr: TableAttribute, i: number) =>
          i === idx ? { ...attr, editRefAttr: value } : attr
        );
        return { ...node, data: { ...nodeData, attributes: updatedAttrs } };
      })
    );
  }, [selectedTableId, setNodes]);

  const onSaveAttrName = useCallback((idx: number) => {
    if (!selectedTableId) return;
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        const nodeData = node.data as TableData;
        const attr = nodeData.attributes[idx];
        const oldType = attr.type;
        const newType = attr.editType || attr.type;
        const oldRefTable = attr.refTable;
        const oldRefAttr = attr.refAttr;
        const newRefTable = attr.editRefTable || attr.refTable;
        const newRefAttr = attr.editRefAttr || attr.refAttr;
        
        // Handle edge management for FK changes
        if (setEdges) {
          // If changing FROM FK to something else, remove the old edge
          if (oldType === 'FK' && newType !== 'FK') {
            // Remove any edge involving this attribute
            removeEdgesByAttribute(selectedTableId, attr.name);
          }
          
          // If changing FK reference (but staying FK), remove old edge first
          if (oldType === 'FK' && newType === 'FK' && 
              (oldRefTable !== newRefTable || oldRefAttr !== newRefAttr)) {
            removeEdgesByAttribute(selectedTableId, attr.name);
          }
          
          // If changing TO FK, validate and create new edge
          if (newType === 'FK') {
            const refTableName = newRefTable;
            const refAttrName = newRefAttr;
            
            if (!refTableName || !refAttrName) {
              console.warn('Foreign key reference is incomplete');
              return node; // Don't save if FK reference is incomplete
            }
            
            // Find the referenced table by label
            const refTable = nds.find(n => 
              typeof n.data?.label === 'string' && n.data.label === refTableName
            );
            
            if (!refTable) {
              console.warn(`Referenced table "${refTableName}" not found`);
              return node; // Don't save if referenced table doesn't exist
            }
            
            // Check if referenced attribute exists
            const refAttrExists = Array.isArray(refTable.data?.attributes) && 
              refTable.data.attributes.some((a: TableAttribute) => a.name === refAttrName);
            
            if (!refAttrExists) {
              console.warn(`Referenced attribute "${refAttrName}" not found in table "${refTableName}"`);
              return node; // Don't save if referenced attribute doesn't exist
            }
            
            // Create the FK edge
            createFKEdge(refTable.id, refAttrName, selectedTableId, attr.name);
          }
        }
        
        const updatedAttrs = nodeData.attributes.map((attr: TableAttribute, i: number) =>
          i === idx ? { 
            ...attr, 
            name: attr.editName || attr.name, 
            dataType: attr.editDataType || attr.dataType,
            type: attr.editType || attr.type,
            refTable: attr.editType === 'FK' ? (attr.editRefTable || attr.refTable) : undefined,
            refAttr: attr.editType === 'FK' ? (attr.editRefAttr || attr.refAttr) : undefined,
            isEditing: false, 
            editName: "",
            editDataType: undefined,
            editType: undefined,
            editRefTable: "",
            editRefAttr: ""
          } : attr
        );
        return { ...node, data: { ...nodeData, attributes: updatedAttrs } };
      })
    );
  }, [selectedTableId, setNodes, setEdges, createFKEdge, removeFKEdge]);

  const onCancelAttrEdit = useCallback((idx: number) => {
    if (!selectedTableId) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        const nodeData = node.data as TableData;
        const updatedAttrs = nodeData.attributes.map((attr: TableAttribute, i: number) =>
          i === idx ? { 
            ...attr, 
            isEditing: false, 
            editName: "",
            editDataType: undefined,
            editType: undefined,
            editRefTable: "",
            editRefAttr: ""
          } : attr
        );
        return { ...node, data: { ...nodeData, attributes: updatedAttrs } };
      })
    );
  }, [selectedTableId, setNodes]);

  const onDeleteAttribute = useCallback((idx: number) => {
    if (!selectedTableId) return;
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== selectedTableId) return node;
        const nodeData = node.data as TableData;
        const attrToDelete = nodeData.attributes[idx];
        
        // Remove any edges involving this attribute
        if (setEdges) {
          removeEdgesByAttribute(selectedTableId, attrToDelete.name);
        }
        
        const updatedAttrs = nodeData.attributes.filter((_: TableAttribute, i: number) => i !== idx);
        return { ...node, data: { ...nodeData, attributes: updatedAttrs } };
      })
    );
  }, [selectedTableId, setNodes, setEdges, removeEdgesByAttribute]);

  // Connection handling
  const updateNodeAttributes = useCallback((connectionInfo: any) => {
    const { sourceTableId, sourceAttrName, targetTableId, targetAttrName } = connectionInfo;
    
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === sourceTableId) {
          const updatedAttributes = Array.isArray(node.data.attributes) 
            ? node.data.attributes.map((attr: TableAttribute) => 
                attr.name === sourceAttrName 
                  ? { ...attr, type: 'PK' as const }
                  : attr
              )
            : [];
          return {
            ...node,
            data: {
              ...node.data,
              attributes: updatedAttributes,
            },
          };
        } else if (node.id === targetTableId) {
          const sourceTable = nds.find(n => n.id === sourceTableId);
          const sourceTableLabel = typeof sourceTable?.data?.label === 'string' 
            ? sourceTable.data.label 
            : `Table_${sourceTableId}`;
          
          const updatedAttributes = Array.isArray(node.data.attributes) 
            ? node.data.attributes.map((attr: TableAttribute) => 
                attr.name === targetAttrName 
                  ? { 
                      ...attr, 
                      type: 'FK' as const, 
                      refTable: sourceTableLabel.replace(/\s+/g, '_'),
                      refAttr: sourceAttrName 
                    }
                  : attr
              )
            : [];
          return {
            ...node,
            data: {
              ...node.data,
              attributes: updatedAttributes,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  return {
    // State
    nodes,
    selectedTableId,
    selectedTable,
    attributes,
    isEditingTableName,
    editTableName,
    attrName,
    attrType,
    attrDataType,
    refTable,
    refAttr,
    
    // Actions
    setSelectedTableId,
    onNodesChange,
    addTable,
    deleteTable,
    addAttribute,
    startEditTableName,
    saveTableName,
    cancelEditTableName,
    updateNodeAttributes,

    // Attribute Editing
    onStartAttrEdit,
    onAttrEditNameChange,
    onAttrEditDataTypeChange,
    onAttrEditTypeChange,
    onAttrEditRefTableChange,
    onAttrEditRefAttrChange,
    onSaveAttrName,
    onCancelAttrEdit,
    onDeleteAttribute,
    
    // Form setters
    setEditTableName,
    setAttrName,
    setAttrType,
    setAttrDataType,
    setRefTable,
    setRefAttr,
    
    // FK Helper functions
    getAvailableTables,
    getAttributesForTable,
    validateFKReference,
    createFKEdge,
    removeFKEdge,
    removeEdgesByAttribute,
    importNodes,
  };
};
