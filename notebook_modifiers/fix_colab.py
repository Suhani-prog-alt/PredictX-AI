import json

with open('Hardware_failure.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        source = "".join(cell['source'])
        if "from google.colab import files" in source:
            source = source.replace("from google.colab import files", "# from google.colab import files")
        if "files.download('model_artifacts_archive.zip')" in source:
            source = source.replace("files.download('model_artifacts_archive.zip')", "# files.download('model_artifacts_archive.zip')")
            
        cell['source'] = [line + '\n' if i < len(source.split('\n'))-1 else line for i, line in enumerate(source.split('\n'))]

with open('Hardware_failure.ipynb', 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=1)

print("Commented out Google Colab specific code.")
