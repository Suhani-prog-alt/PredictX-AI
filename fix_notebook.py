import json

with open('Hardware_failure.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        source = "".join(cell['source'])
        if "categorical_cols_telemetry = ['osVersion', 'usageType', 'diskType', 'riskLevel', 'rootCause']" in source:
            new_source = source.replace(
                "categorical_cols_telemetry = ['osVersion', 'usageType', 'diskType', 'riskLevel', 'rootCause']",
                "# Drop output/target columns to prevent data leakage\n"
                "leakage_cols = ['healthScore', 'failureProbability', 'riskLevel', 'rootCause']\n"
                "telemetry_fe_df.drop(columns=[col for col in leakage_cols if col in telemetry_fe_df.columns], inplace=True)\n\n"
                "categorical_cols_telemetry = ['osVersion', 'usageType', 'diskType']"
            )
            # Reconstruct source array
            cell['source'] = [line + '\n' if i < len(new_source.split('\n'))-1 else line for i, line in enumerate(new_source.split('\n'))]

with open('Hardware_failure.ipynb', 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=1)

print("Notebook updated successfully to fix data leakage.")
