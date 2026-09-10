import type { CustomAttributeDefinition, ProductType } from '../types';

export function applicableDefinitions(definitions: CustomAttributeDefinition[], productType: ProductType) {
  return definitions.filter((d) => !d.appliesToProductType || d.appliesToProductType === productType);
}

/** Mirrors the server-side required check in CustomAttributeServiceImpl, so the form can
 *  block the save with the same rule instead of round-tripping to find out. */
export function missingRequiredAttributes(
  definitions: CustomAttributeDefinition[],
  productType: ProductType,
  values: Record<string, unknown>
): string[] {
  return applicableDefinitions(definitions, productType)
    .filter((d) => d.required)
    .filter((d) => {
      const v = values[d.attributeKey];
      return v === undefined || v === null || v === '';
    })
    .map((d) => d.label);
}

export function CustomAttributeFields({
  definitions,
  productType,
  values,
  onChange,
}: {
  definitions: CustomAttributeDefinition[];
  productType: ProductType;
  values: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const applicable = applicableDefinitions(definitions, productType);
  if (applicable.length === 0) return null;

  const setValue = (key: string, value: unknown) => onChange({ ...values, [key]: value });

  return (
    <div style={{ borderTop: '1px solid var(--border-glass)', marginTop: '0.75rem', paddingTop: '1rem' }}>
      <p className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Custom Attributes
      </p>
      {applicable.map((def) => (
        <div className="form-group" key={def.attributeKey}>
          <label className="form-label">
            {def.label}
            {def.required && <span style={{ color: 'var(--danger)' }}> *</span>}
          </label>
          {def.dataType === 'BOOLEAN' ? (
            <input
              type="checkbox"
              checked={Boolean(values[def.attributeKey])}
              onChange={(e) => setValue(def.attributeKey, e.target.checked)}
            />
          ) : def.dataType === 'NUMBER' ? (
            <input
              type="number"
              className="form-input"
              value={values[def.attributeKey] === undefined || values[def.attributeKey] === null ? '' : String(values[def.attributeKey])}
              onChange={(e) => setValue(def.attributeKey, e.target.value === '' ? '' : Number(e.target.value))}
            />
          ) : def.dataType === 'DATE' ? (
            <input
              type="date"
              className="form-input"
              value={(values[def.attributeKey] as string) ?? ''}
              onChange={(e) => setValue(def.attributeKey, e.target.value)}
            />
          ) : (
            <input
              type="text"
              className="form-input"
              value={(values[def.attributeKey] as string) ?? ''}
              onChange={(e) => setValue(def.attributeKey, e.target.value)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
