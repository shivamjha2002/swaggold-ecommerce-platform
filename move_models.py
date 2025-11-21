"""Move models from scripts/models to models directory."""
import shutil
import os

source_dir = 'scripts/models'
dest_dir = 'models'

# Copy the main model files
files_to_copy = ['gold_model.pkl', 'diamond_model.pkl']

for filename in files_to_copy:
    source = os.path.join(source_dir, filename)
    dest = os.path.join(dest_dir, filename)
    
    if os.path.exists(source):
        shutil.copy2(source, dest)
        print(f"✓ Copied {filename} to {dest_dir}/")
    else:
        print(f"✗ {filename} not found in {source_dir}/")

print("\nDone! Models are now in the correct location.")
