import os
import glob
import pandas as pd
import warnings
warnings.filterwarnings('ignore')

source_dir = r"d:\My_Documents\Internships projects\Dell2\Dataset"
output_file = r"d:\My_Documents\Internships projects\Dell2\Dataset\backblaze_sampled.csv"

# Find all CSVs recursively (excluding the ones we already know aren't backblaze or the output itself)
all_files = glob.glob(os.path.join(source_dir, "**", "*.csv"), recursive=True)
backblaze_files = [f for f in all_files if 'telemetry' not in f and 'ai4i' not in f and 'sampled' not in f]

print(f"Found {len(backblaze_files)} Backblaze CSV files. Starting extraction...")

sampled_chunks = []
total_failures = 0
total_healthy_sampled = 0

for file in backblaze_files:
    print(f"Processing: {os.path.basename(file)}...")
    try:
        # Read in chunks to save memory
        chunk_iter = pd.read_csv(file, chunksize=100000, low_memory=False)
        for chunk in chunk_iter:
            # 1. Get all failures
            failures = chunk[chunk['failure'] == 1]
            
            # 2. Get a tiny 0.5% random sample of healthy drives
            healthy = chunk[chunk['failure'] == 0].sample(frac=0.005, random_state=42)
            
            # Append to our list
            if not failures.empty:
                sampled_chunks.append(failures)
                total_failures += len(failures)
            if not healthy.empty:
                sampled_chunks.append(healthy)
                total_healthy_sampled += len(healthy)
                
    except Exception as e:
        print(f"Error reading {file}: {e}")

print("Concatenating chunks...")
final_df = pd.concat(sampled_chunks, ignore_index=True)

# Drop columns that are completely empty (all NaN) across the entire sampled dataset
final_df = final_df.dropna(axis=1, how='all')

print(f"Final Dataset Shape: {final_df.shape}")
print(f"Total Failures: {total_failures}")
print(f"Total Healthy (Sampled): {total_healthy_sampled}")

final_df.to_csv(output_file, index=False)
print(f"Saved optimized dataset to {output_file}")
