import json

with open('Hardware_failure.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        source = "".join(cell['source'])
        # Replace the direct filenames with Dataset/ prefix
        if "'telemetry_health_dataset_v3.csv'" in source:
            source = source.replace("'telemetry_health_dataset_v3.csv'", "'Dataset/telemetry_health_dataset_v3.csv'")
        if "'ai4i2020.csv'" in source:
            source = source.replace("'ai4i2020.csv'", "'Dataset/ai4i2020.csv'")
            
        cell['source'] = [line + '\n' if i < len(source.split('\n'))-1 else line for i, line in enumerate(source.split('\n'))]

with open('Hardware_failure.ipynb', 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=1)

print("Updated dataset paths in notebook.")
