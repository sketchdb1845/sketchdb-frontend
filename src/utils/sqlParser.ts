import type  { Node } from '@xyflow/react';
import type{AST} from 'node-sql-parser';
import { Parser } from 'node-sql-parser';
import type  { TableAttribute, AttributeType, DataType } from '../types';
import { createEdgesFromForeignKeys } from './connectionUtils';

interface ParsedTable {
  name: string;
  attributes: TableAttribute[];
}

interface ParsedForeignKey {
  table: string;
  column: string;
  referencedTable: string;
  referencedColumn: string;
}

// Initialize the SQL parser
const parser = new Parser();

export const parseSQLSchema = (sqlText: string): { nodes: Node[], edges: any[] } => {
  // Input validation
  if (!sqlText || typeof sqlText !== 'string') {
    throw new Error('Invalid input: SQL text is required and must be a string');
  }
  
  const trimmedSQL = sqlText.trim();
  if (!trimmedSQL) {
    throw new Error('Invalid input: SQL text cannot be empty');
  }
  
  // Check for basic SQL structure
  if (!trimmedSQL.toUpperCase().includes('CREATE TABLE')) {
    throw new Error('Invalid SQL: No CREATE TABLE statements found. Please ensure your SQL contains table definitions.');
  }
  
  const tables: ParsedTable[] = [];
  const foreignKeys: ParsedForeignKey[] = [];
  
  try {
    // Clean up the SQL text
    const cleanSQL = sqlText
      .replace(/--.*$/gm, '') // Remove line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
      .trim();

    // Validate that we still have content after cleanup
    if (!cleanSQL) {
      throw new Error('Invalid SQL: No valid SQL content found after removing comments');
    }

    // Split by semicolons to get individual statements
    const statements = cleanSQL.split(';').filter(stmt => stmt.trim());

    if (statements.length === 0) {
      throw new Error('Invalid SQL: No valid SQL statements found');
    }

    let successfulParses = 0;
    const parseErrors: string[] = [];

    statements.forEach((statement, index) => {
      const trimmedStmt = statement.trim();
      if (!trimmedStmt) return;

      try {
        // Parse the SQL statement using node-sql-parser
        const ast = parser.astify(trimmedStmt);
        
        if (Array.isArray(ast)) {
          // Handle multiple statements
          ast.forEach(singleAst => processStatement(singleAst, tables, foreignKeys));
        } else {
          // Handle single statement
          processStatement(ast, tables, foreignKeys);
        }
        successfulParses++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.warn(`Failed to parse statement ${index + 1}:`, trimmedStmt, error);
        parseErrors.push(`Statement ${index + 1}: ${errorMsg}`);
        
        // Fallback to manual parsing for problematic statements
        if (trimmedStmt.toUpperCase().startsWith('CREATE TABLE')) {
          try {
            parseCreateTableManual(trimmedStmt, tables, foreignKeys);
            successfulParses++;
          } catch (manualError) {
            const manualErrorMsg = manualError instanceof Error ? manualError.message : String(manualError);
            parseErrors.push(`Statement ${index + 1} (manual): ${manualErrorMsg}`);
          }
        }
      }
    });

    // Validate that we parsed at least some tables
    if (tables.length === 0) {
      const errorDetails = parseErrors.length > 0 
        ? `Parse errors encountered:\n${parseErrors.join('\n')}`
        : 'No CREATE TABLE statements could be parsed successfully';
      throw new Error(`No tables were successfully parsed from the SQL. ${errorDetails}`);
    }

    // Apply foreign key relationships to tables
    applyForeignKeys(tables, foreignKeys);

    // Validate table structure
    validateTables(tables);

    console.log('Parsed tables with FK relationships applied:', tables);
    console.log('All parsed foreign keys:', foreignKeys);

    // Convert to React Flow nodes
    const nodes = convertToNodes(tables);
    
    // Create edges from foreign key relationships
    const edges = createEdgesFromForeignKeys(nodes);
    
    console.log('Generated nodes:', nodes);
    console.log('Generated edges:', edges);

    // Final validation
    if (nodes.length === 0) {
      throw new Error('No valid table nodes were generated from the SQL');
    }

    return { nodes, edges };
  } catch (error) {
    console.error('Error parsing SQL:', error);
    
    // Re-throw with more context if needed
    if (error instanceof Error) {
      throw error;
    }
    
    throw new Error(`Failed to parse SQL schema: ${String(error)}`);
  }
};

const processStatement = (ast: AST, tables: ParsedTable[], foreignKeys: ParsedForeignKey[]) => {
  if (!ast || typeof ast !== 'object') return;

  const astAny = ast as any; // Type assertion for accessing dynamic properties

  switch (astAny.type?.toLowerCase()) {
    case 'create':
      if (astAny.keyword === 'table' || astAny.resource === 'table') {
        parseCreateTableFromAST(astAny, tables, foreignKeys);
      }
      break;
    case 'alter':
      parseAlterTableFromAST(astAny, foreignKeys);
      break;
    default:
      console.log('Unsupported statement type:', astAny.type);
  }
};

const parseCreateTableFromAST = (ast: any, tables: ParsedTable[], foreignKeys: ParsedForeignKey[]) => {
  try {
    const tableName = ast.table?.[0]?.table || ast.table?.table;
    if (!tableName) {
      console.warn('Could not extract table name from AST');
      return;
    }

    console.log('Parsing table:', tableName);
    console.log('Table AST create_definitions:', JSON.stringify(ast.create_definitions, null, 2));

    const attributes: TableAttribute[] = [];
    const tableConstraints = ast.create_definitions || [];

    tableConstraints.forEach((def: any, index: number) => {
      console.log(`Processing definition ${index}:`, JSON.stringify(def, null, 2));
      
      if (def.resource === 'column') {
        // Parse column definition
        const attribute = parseColumnFromAST(def, tableName);
        if (attribute) {
          attributes.push(attribute);
        }
      } else if (def.resource === 'constraint') {
        // Parse table-level constraints
        console.log('Found constraint definition:', def);
        parseConstraintFromAST(def, tableName, attributes, foreignKeys);
      }
    });

    tables.push({ name: tableName, attributes });
    console.log(`Added table ${tableName} with ${attributes.length} attributes`);
  } catch (error) {
    console.error('Error parsing CREATE TABLE from AST:', error);
  }
};

const parseColumnFromAST = (columnDef: any, _tableName: string): TableAttribute | null => {
  try {
    const columnName = columnDef.column?.column;
    if (!columnName) return null;

    console.log('Parsing column:', columnName, 'Definition:', JSON.stringify(columnDef, null, 2));

    const dataTypeInfo = columnDef.definition;
    let attributeType: AttributeType = 'normal';
    let isNotNull = false;
    let isUnique = false;
    let defaultValue: string | undefined;
    let isAutoIncrement = false;
    let refTable: string | undefined;
    let refAttr: string | undefined;

    // Parse data type
    const dataType = normalizeDataType(dataTypeInfo?.dataType || 'VARCHAR(255)');

    // Check for primary key
    if (columnDef.primary_key === 'primary key') {
      attributeType = 'PK';
      isNotNull = true;
      console.log('Column', columnName, 'marked as PRIMARY KEY');
    }

    // Parse column constraints
    if (columnDef.nullable && columnDef.nullable.type === 'not null') {
      isNotNull = true;
    }

    if (columnDef.unique_or_primary === 'unique') {
      isUnique = true;
    }

    if (columnDef.auto_increment) {
      isAutoIncrement = true;
    }

    if (columnDef.default_val) {
      defaultValue = columnDef.default_val.value?.toString();
    }

    // Check for inline foreign key reference
    if (columnDef.reference_definition) {
      attributeType = 'FK';
      refTable = columnDef.reference_definition.table?.[0]?.table;
      refAttr = columnDef.reference_definition.definition?.[0]?.column;
    }

    const result = {
      name: columnName,
      type: attributeType,
      dataType,
      isNotNull,
      isUnique,
      defaultValue,
      isAutoIncrement,
      refTable,
      refAttr,
    };

    console.log('Parsed column result:', result);
    return result;
  } catch (error) {
    console.error('Error parsing column from AST:', error);
    return null;
  }
};

const parseConstraintFromAST = (
  constraintDef: any, 
  tableName: string, 
  attributes: TableAttribute[], 
  foreignKeys: ParsedForeignKey[]
) => {
  try {
    const constraintType = constraintDef.constraint_type?.toLowerCase();
    console.log('Processing constraint type:', constraintType, 'for table:', tableName);
    console.log('Constraint definition:', JSON.stringify(constraintDef, null, 2));

    switch (constraintType) {
      case 'primary key':
        // Mark columns as primary key
        const pkColumns = constraintDef.definition || [];
        pkColumns.forEach((col: any) => {
          const columnName = col.column;
          const attr = attributes.find(a => a.name === columnName);
          if (attr) {
            attr.type = 'PK';
            attr.isNotNull = true;
          }
        });
        break;

      case 'foreign key':
        // Add foreign key relationship
        const fkColumns = constraintDef.definition || [];
        const refTableArray = constraintDef.reference_definition?.table || [];
        const refTable = refTableArray[0]?.table; // Get table name from array
        const refColumns = constraintDef.reference_definition?.definition || [];

        console.log('FK processing:', {
          fkColumns,
          refTable,
          refColumns
        });

        fkColumns.forEach((col: any, index: number) => {
          const columnName = col.column;
          const referencedColumn = refColumns[index]?.column;
          
          console.log('Processing FK relationship:', {
            table: tableName,
            column: columnName,
            referencedTable: refTable,
            referencedColumn
          });
          
          if (columnName && refTable && referencedColumn) {
            // Mark the column as FK
            const attr = attributes.find(a => a.name === columnName);
            if (attr) {
              attr.type = 'FK';
              attr.refTable = refTable;
              attr.refAttr = referencedColumn;
            }

            // Add to foreign keys list
            foreignKeys.push({
              table: tableName,
              column: columnName,
              referencedTable: refTable,
              referencedColumn,
            });
            
            console.log('Added FK relationship:', {
              table: tableName,
              column: columnName,
              referencedTable: refTable,
              referencedColumn
            });
          }
        });
        break;

      case 'unique':
        // Mark columns as unique
        const uniqueColumns = constraintDef.definition || [];
        uniqueColumns.forEach((col: any) => {
          const columnName = col.column;
          const attr = attributes.find(a => a.name === columnName);
          if (attr) {
            attr.isUnique = true;
          }
        });
        break;
    }
  } catch (error) {
    console.error('Error parsing constraint from AST:', error);
  }
};

const parseAlterTableFromAST = (ast: any, foreignKeys: ParsedForeignKey[]) => {
  try {
    const tableName = ast.table?.[0]?.table || ast.table?.table;
    if (!tableName) return;

    const alterItems = ast.expr || [];
    
    alterItems.forEach((item: any) => {
      if (item.action === 'add' && item.resource === 'constraint') {
        const constraint = item.create_definitions?.[0];
        if (constraint?.constraint_type?.toLowerCase() === 'foreign key') {
          const fkColumns = constraint.definition || [];
          const refTable = constraint.reference_definition?.table?.table;
          const refColumns = constraint.reference_definition?.definition || [];

          fkColumns.forEach((col: any, index: number) => {
            const columnName = col.column;
            const referencedColumn = refColumns[index]?.column;
            
            if (columnName && refTable && referencedColumn) {
              foreignKeys.push({
                table: tableName,
                column: columnName,
                referencedTable: refTable,
                referencedColumn,
              });
            }
          });
        }
      }
    });
  } catch (error) {
    console.error('Error parsing ALTER TABLE from AST:', error);
  }
};

// Fallback manual parsing for problematic statements
const parseCreateTableManual = (statement: string, tables: ParsedTable[], foreignKeys: ParsedForeignKey[]) => {
  console.log('Fallback: Parsing CREATE TABLE manually:', statement);
  
  // Extract table name
  const tableNameMatch = statement.match(/CREATE\s+TABLE\s+(\w+)\s*\(/i);
  if (!tableNameMatch) return;
  
  const tableName = tableNameMatch[1];
  console.log('Manual parsing - Table name:', tableName);
  
  // Extract the content between parentheses
  const contentMatch = statement.match(/\(([\s\S]*)\)/);
  if (!contentMatch) return;
  
  const content = contentMatch[1];
  const attributes: TableAttribute[] = [];
  
  // Split by commas, but be careful with nested parentheses
  const parts = splitByCommas(content);
  console.log('Manual parsing - Split parts:', parts);
  
  parts.forEach(part => {
    const trimmedPart = part.trim();
    console.log('Manual parsing - Parsing part:', trimmedPart);
    
    if (trimmedPart.toUpperCase().includes('FOREIGN KEY')) {
      // Parse table-level foreign key constraint: FOREIGN KEY (user_id) REFERENCES users(id)
      const fkMatch = trimmedPart.match(/FOREIGN\s+KEY\s*\(\s*(\w+)\s*\)\s+REFERENCES\s+(\w+)\s*\(\s*(\w+)\s*\)/i);
      if (fkMatch) {
        console.log('Manual parsing - Found FK constraint:', fkMatch);
        foreignKeys.push({
          table: tableName,
          column: fkMatch[1],
          referencedTable: fkMatch[2],
          referencedColumn: fkMatch[3],
        });
        
        // Also mark the column as FK if it exists
        const fkAttr = attributes.find(attr => attr.name === fkMatch[1]);
        if (fkAttr) {
          fkAttr.type = 'FK';
          fkAttr.refTable = fkMatch[2];
          fkAttr.refAttr = fkMatch[3];
        }
      }
    } else if (trimmedPart.toUpperCase().includes('PRIMARY KEY') && !trimmedPart.match(/^\w+\s+/)) {
      // Handle separate primary key constraints like "PRIMARY KEY (id)"
      const pkMatch = trimmedPart.match(/PRIMARY\s+KEY\s*\(\s*(\w+)\s*\)/i);
      if (pkMatch) {
        // Mark the specified column as PK
        const pkColumnName = pkMatch[1];
        const existingAttr = attributes.find(attr => attr.name === pkColumnName);
        if (existingAttr) {
          existingAttr.type = 'PK';
        }
      }
    } else if (trimmedPart.match(/^\w+\s+/)) {
      // Parse column definition - must start with a word (column name) followed by space
      const columnMatch = trimmedPart.match(/^(\w+)\s+([^,\s]+(?:\s*\([^)]*\))?)(.*)/i);
      if (columnMatch) {
        const columnName = columnMatch[1];
        let dataType = columnMatch[2].trim();
        const constraints = columnMatch[3].trim().toUpperCase();
        
        console.log('Manual parsing - Parsed column:', { columnName, dataType, constraints });
        
        let attributeType: AttributeType = 'normal';
        let isNotNull = false;
        let isUnique = false;
        let defaultValue: string | undefined;
        let isAutoIncrement = false;
        
        // Check for inline REFERENCES (foreign key)
        const inlineFkMatch = constraints.match(/REFERENCES\s+(\w+)\s*\(\s*(\w+)\s*\)/i);
        if (inlineFkMatch) {
          attributeType = 'FK';
          foreignKeys.push({
            table: tableName,
            column: columnName,
            referencedTable: inlineFkMatch[1],
            referencedColumn: inlineFkMatch[2],
          });
        }
        
        // Check for PRIMARY KEY
        if (constraints.includes('PRIMARY KEY')) {
          attributeType = 'PK';
        }
        
        // Check for NOT NULL
        if (constraints.includes('NOT NULL')) {
          isNotNull = true;
        }
        
        // Check for UNIQUE
        if (constraints.includes('UNIQUE')) {
          isUnique = true;
        }
        
        // Check for IDENTITY (auto-increment)
        if (constraints.includes('IDENTITY')) {
          isAutoIncrement = true;
        }
        
        // Extract DEFAULT value
        const defaultMatch = constraints.match(/DEFAULT\s+([^,\s]+(?:\([^)]*\))?)/i);
        if (defaultMatch) {
          defaultValue = defaultMatch[1];
        }
        
        // Normalize data type
        const normalizedDataType = normalizeDataType(dataType);
        
        attributes.push({
          name: columnName,
          type: attributeType,
          dataType: normalizedDataType,
          isNotNull,
          isUnique,
          defaultValue,
          isAutoIncrement,
        });
      }
    }
  });
  
  console.log('Manual parsing - Final attributes for table', tableName, ':', attributes);
  tables.push({ name: tableName, attributes });
};

const splitByCommas = (content: string): string[] => {
  const parts: string[] = [];
  let current = '';
  let parentheses = 0;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    if (char === '(') {
      parentheses++;
    } else if (char === ')') {
      parentheses--;
    } else if (char === ',' && parentheses === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    
    current += char;
  }
  
  if (current.trim()) {
    parts.push(current.trim());
  }
  
  return parts;
};

const normalizeDataType = (dataType: string): DataType => {
  const lowerType = dataType.toLowerCase();
  
  if (lowerType.includes('int') || lowerType.includes('identity')) {
    if (lowerType.includes('big')) return 'BIGINT';
    return 'INTEGER';
  } else if (lowerType.includes('varchar')) {
    // Extract length from VARCHAR(n) or default to VARCHAR(255)
    const lengthMatch = lowerType.match(/varchar\((\d+)\)/);
    if (lengthMatch) {
      const length = parseInt(lengthMatch[1]);
      if (length <= 50) return 'VARCHAR(50)';
      if (length <= 100) return 'VARCHAR(100)';
      return 'VARCHAR(255)';
    }
    return 'VARCHAR(255)';
  } else if (lowerType.includes('char')) {
    const lengthMatch = lowerType.match(/char\((\d+)\)/);
    if (lengthMatch) {
      return 'CHAR(10)';
    }
    return 'CHAR(10)';
  } else if (lowerType.includes('text')) {
    return 'TEXT';
  } else if (lowerType.includes('date')) {
    if (lowerType.includes('time')) return 'DATETIME';
    return 'DATE';
  } else if (lowerType.includes('time')) {
    if (lowerType.includes('stamp')) return 'TIMESTAMP';
    return 'TIME';
  } else if (lowerType.includes('decimal') || lowerType.includes('numeric')) {
    return 'DECIMAL(10,2)';
  } else if (lowerType.includes('float')) {
    return 'FLOAT';
  } else if (lowerType.includes('double')) {
    return 'DOUBLE';
  } else if (lowerType.includes('bool')) {
    return 'BOOLEAN';
  } else if (lowerType.includes('json')) {
    return 'JSON';
  } else if (lowerType.includes('blob')) {
    return 'BLOB';
  }
  
  return 'VARCHAR(255)'; // Default fallback
};

const applyForeignKeys = (tables: ParsedTable[], foreignKeys: ParsedForeignKey[]) => {
  foreignKeys.forEach(fk => {
    const table = tables.find(t => t.name === fk.table);
    if (table) {
      const attribute = table.attributes.find(attr => attr.name === fk.column);
      if (attribute) {
        attribute.type = 'FK';
        attribute.refTable = fk.referencedTable;
        attribute.refAttr = fk.referencedColumn;
      }
    }
  });
};

const validateTables = (tables: ParsedTable[]) => {
  const tableNames = new Set<string>();
  const errors: string[] = [];
  
  tables.forEach((table) => {
    // Check for duplicate table names
    if (tableNames.has(table.name)) {
      errors.push(`Duplicate table name: ${table.name}`);
    }
    tableNames.add(table.name);
    
    // Check for empty tables
    if (!table.attributes || table.attributes.length === 0) {
      errors.push(`Table ${table.name} has no columns defined`);
    }
    
    // Check for duplicate column names within table
    const columnNames = new Set<string>();
    table.attributes.forEach(attr => {
      if (columnNames.has(attr.name)) {
        errors.push(`Duplicate column name '${attr.name}' in table ${table.name}`);
      }
      columnNames.add(attr.name);
      
      // Validate foreign key references
      if (attr.type === 'FK') {
        if (!attr.refTable || !attr.refAttr) {
          errors.push(`Foreign key ${table.name}.${attr.name} is missing reference information`);
        } else {
          // Check if referenced table exists
          const referencedTable = tables.find(t => t.name === attr.refTable);
          if (!referencedTable) {
            errors.push(`Foreign key ${table.name}.${attr.name} references non-existent table ${attr.refTable}`);
          } else {
            // Check if referenced column exists
            const referencedColumn = referencedTable.attributes.find(a => a.name === attr.refAttr);
            if (!referencedColumn) {
              errors.push(`Foreign key ${table.name}.${attr.name} references non-existent column ${attr.refTable}.${attr.refAttr}`);
            }
          }
        }
      }
    });
    
    // Check for at least one primary key (warning, not error)
    const hasPrimaryKey = table.attributes.some(attr => attr.type === 'PK');
    if (!hasPrimaryKey) {
      console.warn(`Table ${table.name} has no primary key defined`);
    }
  });
  
  if (errors.length > 0) {
    throw new Error(`Schema validation failed:\n${errors.join('\n')}`);
  }
};

const convertToNodes = (tables: ParsedTable[]): Node[] => {
  return tables.map((table, index) => ({
    id: table.name,
    type: 'tableNode',
    position: { x: index * 400, y: index * 200 },
    data: {
      label: table.name,  // Add label for SQL export compatibility
      table: table.name,  // Keep table for backward compatibility
      attributes: table.attributes,
    },
  }));
};