// eslint-disable-next-line no-restricted-imports

import {isCanonicalColumnSchemaEntry} from '../metadata/TableSchema';
import {AssetColumnLineageQuery} from './lineage/types/useColumnLineageDataForAssets.types';

type AssetDefinitionWithMetadata = AssetColumnLineageQuery['assetNodes'][0];

/**
 * This helper pulls the `columns` metadata entry from the most recent materialization
 * and the asset definition, blending the two together to produce the most current
 * representation. (Sometimes descriptions are only in the definition-time version)
 */
export function buildConsolidatedColumnSchema({
  materialization,
  definition,
  definitionLoadTimestamp,
}: {
  materialization:
    | Pick<AssetDefinitionWithMetadata['assetMaterializations'][0], 'metadataEntries' | 'timestamp'>
    | undefined;
  definition: Pick<AssetDefinitionWithMetadata, 'metadataEntries'> | null | undefined;
  definitionLoadTimestamp: number | undefined;
}) {
  const materializationTableSchema = materialization?.metadataEntries?.find(
    isCanonicalColumnSchemaEntry,
  );
  const materializationTimestamp = materialization ? Number(materialization.timestamp) : undefined;
  const definitionTableSchema = definition?.metadataEntries?.find(isCanonicalColumnSchemaEntry);
  let tableSchema = materializationTableSchema ?? definitionTableSchema;
  const tableSchemaLoadTimestamp = materializationTimestamp ?? definitionLoadTimestamp;

  // Merge the descriptions from the definition table schema with the materialization table schema
  if (materializationTableSchema && definitionTableSchema) {
    const definitionsTableColumnsByName = Object.fromEntries(
      definitionTableSchema.schema.columns.map((column) => [column.name.toLowerCase(), column]),
    );
    const mergedColumns = materializationTableSchema.schema.columns.map((column) => {
      const definitionsCol = definitionsTableColumnsByName[column.name.toLowerCase()];

      const description = definitionsCol?.description || column.description;
      const tags = definitionsCol?.tags || column.tags;

      return {...column, name: column.name.toLowerCase(), description, tags};
    });

    tableSchema = {
      ...materializationTableSchema,
      schema: {...materializationTableSchema.schema, columns: mergedColumns},
    };
  }

  return {tableSchema, tableSchemaLoadTimestamp};
}
