import json

with open('Hardware_failure.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        source = "".join(cell['source'])
        if "rf_telemetry_model" in source:
            source = source.replace("rf_telemetry_model", "xgb_telemetry_model")
        if "rf_ai4i_model" in source:
            source = source.replace("rf_ai4i_model", "xgb_ai4i_model")
            
        cell['source'] = [line + '\n' if i < len(source.split('\n'))-1 else line for i, line in enumerate(source.split('\n'))]

with open('Hardware_failure.ipynb', 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=1)

print("Replaced random forest variable names with xgboost variable names.")
