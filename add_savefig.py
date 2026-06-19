
import json

with open('Hardware_failure.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

plot_counter = 1
for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        source_lines = []
        for line in cell['source']:
            if "plt.show()" in line:
                indent = line[:len(line) - len(line.lstrip())]
                source_lines.append(f"{indent}import os\n")
                source_lines.append(f"{indent}os.makedirs('Images', exist_ok=True)\n")
                source_lines.append(f"{indent}plt.savefig(f'Images/plot_{plot_counter:02d}.png', bbox_inches='tight', facecolor='white')\n")
                source_lines.append(line)
                plot_counter += 1
            else:
                source_lines.append(line)
        cell['source'] = source_lines

with open('Hardware_failure.ipynb', 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=1)

print("Added savefig to notebook.")
