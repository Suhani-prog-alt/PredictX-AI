import json

with open('Hardware_failure.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        source = "".join(cell['source'])
        if "'/content/telemetry_health_dataset_v3.csv'" in source:
            source = source.replace("'/content/telemetry_health_dataset_v3.csv'", "'telemetry_health_dataset_v3.csv'")
        if "'/content/ai4i2020.csv'" in source:
            source = source.replace("'/content/ai4i2020.csv'", "'ai4i2020.csv'")
            
        cell['source'] = [line + '\n' if i < len(source.split('\n'))-1 else line for i, line in enumerate(source.split('\n'))]

with open('Hardware_failure.ipynb', 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=1)

print("Notebook paths fixed.")
