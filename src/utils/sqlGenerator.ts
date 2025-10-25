
import type { Node } from '@xyflow/react';
import type { TableAttribute } from '../types/index';

export const generateSQL = (nodes: Node[]): string => {
  const sqlType = (attr: TableAttribute) => attr.dataType || 'VARCHAR(255)';
  let sql = '';
  
  // Generate CREATE TABLE statements with inline foreign key constraints
  nodes.forEach((node) => {
    const label = typeof node.data.label === 'string' ? node.data.label : `Table_${node.id}`;
    const tableName = label.replace(/\s+/g, '_');
    const attrs = Array.isArray(node.data.attributes) ? node.data.attributes : [];
    if (!attrs.length) return;
    
    sql += `CREATE TABLE ${tableName} (\n`;
    
    // Add all columns
    const columnDefinitions = attrs.map((attr: TableAttribute) => {
      let line = `  ${attr.name} ${sqlType(attr)}`;
      
      if (attr.type === 'PK') {
        line += ' PRIMARY KEY';
      } else if (attr.type === 'FK') {
        line += ' NOT NULL';
      }
      
      return line;
    });
    
    sql += columnDefinitions.join(',\n');
    
    // Add foreign key constraints inline
    const fks = attrs.filter((a: TableAttribute) => a.type === 'FK' && a.refTable && a.refAttr);
    if (fks.length) {
      fks.forEach((fk: TableAttribute) => {
        sql += `,\n  FOREIGN KEY (${fk.name}) REFERENCES ${fk.refTable}(${fk.refAttr})`;
      });
    }
    
    sql += '\n);\n\n';
  });
  
  return sql || 'No tables to export!';
};

export const copyToClipboard = (text: string): void => {
  navigator.clipboard.writeText(text);
};
