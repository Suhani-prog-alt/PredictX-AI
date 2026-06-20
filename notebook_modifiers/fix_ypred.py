import json

with open('Hardware_failure.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        source = "".join(cell['source'])
        
        # Telemetry Tuning Injection Fix
        if "xgb_telemetry_model = random_search.best_estimator_" in source and "y_pred_telemetry" not in source:
            source = source.replace(
                "xgb_telemetry_model = random_search.best_estimator_",
                "xgb_telemetry_model = random_search.best_estimator_\ny_pred_telemetry = xgb_telemetry_model.predict(X_test_telemetry)"
            )
            
        # AI4I Tuning Injection Fix
        if "xgb_ai4i_model = random_search_ai4i.best_estimator_" in source and "y_pred_ai4i" not in source:
            source = source.replace(
                "xgb_ai4i_model = random_search_ai4i.best_estimator_",
                "xgb_ai4i_model = random_search_ai4i.best_estimator_\ny_pred_ai4i = xgb_ai4i_model.predict(X_test_ai4i)"
            )
            
        cell['source'] = [line + '\n' if i < len(source.split('\n'))-1 else line for i, line in enumerate(source.split('\n'))]

with open('Hardware_failure.ipynb', 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=1)

print("Added y_pred definitions back into notebook.")
