import json

with open('Hardware_failure.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        source = "".join(cell['source'])
        if "sample_telemetry_data[['cpuUsage', 'gpuUsage', 'ramUsage', 'fanRpm', 'healthScore']]" in source:
            source = source.replace(
                "sample_telemetry_data[['cpuUsage', 'gpuUsage', 'ramUsage', 'fanRpm', 'healthScore']]", 
                "sample_telemetry_data[['cpuUsage', 'gpuUsage', 'ramUsage', 'fanRpm']]"
            )
            cell['source'] = [line + '\n' if i < len(source.split('\n'))-1 else line for i, line in enumerate(source.split('\n'))]

with open('Hardware_failure.ipynb', 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=1)

print("Fixed healthScore key error.")
