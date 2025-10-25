export interface TableAttribute {
  name: string;
  type: 'PK' | 'FK' | 'normal';
  dataType: string;
  refTable?: string;
  refAttr?: string;
  isEditing?: boolean;
  editName?: string;
  editDataType?: DataType;
  editType?: AttributeType;
  editRefTable?: string;
  editRefAttr?: string;
  // Additional SQL constraints
  isNotNull?: boolean;
  isUnique?: boolean;
  defaultValue?: string;
  isAutoIncrement?: boolean;
}

export interface TableData {
  label: string;
  attributes: TableAttribute[];
  color?: string; // Visual color for the table (doesn't affect SQL)
  [key: string]: unknown;
}

export interface TableNodeData extends TableData {
  id?: string;
}

export type AttributeType = 'PK' | 'FK' | 'normal';

export type DataType = 
  | 'VARCHAR(255)' 
  | 'VARCHAR(100)' 
  | 'VARCHAR(50)' 
  | 'TEXT' 
  | 'INTEGER' 
  | 'BIGINT' 
  | 'DECIMAL(10,2)' 
  | 'FLOAT' 
  | 'DOUBLE' 
  | 'BOOLEAN' 
  | 'DATE' 
  | 'DATETIME' 
  | 'TIMESTAMP' 
  | 'TIME' 
  | 'CHAR(10)' 
  | 'JSON' 
  | 'BLOB';

export const DATA_TYPES: DataType[] = [
  'VARCHAR(255)',
  'VARCHAR(100)',
  'VARCHAR(50)',
  'TEXT',
  'INTEGER',
  'BIGINT',
  'DECIMAL(10,2)',
  'FLOAT',
  'DOUBLE',
  'BOOLEAN',
  'DATE',
  'DATETIME',
  'TIMESTAMP',
  'TIME',
  'CHAR(10)',
  'JSON',
  'BLOB'
];