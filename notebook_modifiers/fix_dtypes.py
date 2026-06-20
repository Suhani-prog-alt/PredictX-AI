import json

with open('Hardware_failure.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        source = "".join(cell['source'])
        if "telemetry_data_point_aligned = telemetry_data_point_aligned[telemetry_feature_columns].fillna(0)" in source:
            source = source.replace(
                "telemetry_data_point_aligned = telemetry_data_point_aligned[telemetry_feature_columns].fillna(0)",
                "telemetry_data_point_aligned = telemetry_data_point_aligned[telemetry_feature_columns].fillna(0).astype(float)"
            )
        if "ai4i_data_point_aligned = ai4i_data_point_aligned[ai4i_feature_columns].fillna(0)" in source:
            source = source.replace(
                "ai4i_data_point_aligned = ai4i_data_point_aligned[ai4i_feature_columns].fillna(0)",
                "ai4i_data_point_aligned = ai4i_data_point_aligned[ai4i_feature_columns].fillna(0).astype(float)"
            )
        cell['source'] = [line + '\n' if i < len(source.split('\n'))-1 else line for i, line in enumerate(source.split('\n'))]

with open('Hardware_failure.ipynb', 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=1)

print("Fixed dtypes in inference pipeline.")
