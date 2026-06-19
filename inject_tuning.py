import json

with open('Hardware_failure.ipynb', 'r', encoding='utf-8') as f:
    nb = json.load(f)

for cell in nb['cells']:
    if cell['cell_type'] == 'code':
        source = "".join(cell['source'])
        
        # Telemetry Tuning Injection
        if "xgb_telemetry_model = XGBClassifier" in source and "fit" in source:
            new_source = """# Model Training with Hyperparameter Tuning for Telemetry Health Model
from xgboost import XGBClassifier
from sklearn.model_selection import RandomizedSearchCV

print("Starting RandomizedSearchCV for Telemetry Model (this may take a few minutes)...")

# Calculate scale_pos_weight for imbalanced dataset
# scale_pos_weight = count(negative examples) / count(Positive examples)
neg_count = sum(y_train_telemetry_resampled == 0)
pos_count = sum(y_train_telemetry_resampled == 1)
scale_weight = neg_count / pos_count if pos_count > 0 else 1

# Define parameter grid
param_grid = {
    'max_depth': [3, 5, 7, 9],
    'learning_rate': [0.01, 0.05, 0.1, 0.2],
    'n_estimators': [100, 200, 300],
    'subsample': [0.6, 0.8, 1.0],
    'colsample_bytree': [0.6, 0.8, 1.0],
    'scale_pos_weight': [scale_weight, scale_weight * 1.5]
}

# Base model
xgb_base = XGBClassifier(random_state=42, use_label_encoder=False, eval_metric='logloss')

# Randomized Search
random_search = RandomizedSearchCV(
    estimator=xgb_base,
    param_distributions=param_grid,
    n_iter=10, # Keep to 10 iterations so it doesn't take hours
    scoring='f1', # Optimizing for F1 score since we care about false positives/negatives
    cv=3,
    verbose=2,
    random_state=42,
    n_jobs=-1 # Use all CPU cores
)

# Fit the random search model
random_search.fit(X_train_telemetry_resampled, y_train_telemetry_resampled)

print(f"Best parameters found: {random_search.best_params_}")

# Assign the best model to our variable
xgb_telemetry_model = random_search.best_estimator_
"""
            cell['source'] = [line + '\n' if i < len(new_source.split('\n'))-1 else line for i, line in enumerate(new_source.split('\n'))]
            
        # AI4I Tuning Injection
        if "xgb_ai4i_model = XGBClassifier" in source and "fit" in source:
            new_source = """# Model Training with Hyperparameter Tuning for AI4I Thermal Failure Model
from xgboost import XGBClassifier
from sklearn.model_selection import RandomizedSearchCV

print("Starting RandomizedSearchCV for AI4I Model...")

neg_count_ai4i = sum(y_train_ai4i_resampled == 0)
pos_count_ai4i = sum(y_train_ai4i_resampled == 1)
scale_weight_ai4i = neg_count_ai4i / pos_count_ai4i if pos_count_ai4i > 0 else 1

param_grid_ai4i = {
    'max_depth': [3, 5, 7],
    'learning_rate': [0.05, 0.1, 0.2],
    'n_estimators': [100, 200],
    'subsample': [0.8, 1.0],
    'colsample_bytree': [0.8, 1.0],
    'scale_pos_weight': [scale_weight_ai4i]
}

xgb_base_ai4i = XGBClassifier(random_state=42, use_label_encoder=False, eval_metric='logloss')

random_search_ai4i = RandomizedSearchCV(
    estimator=xgb_base_ai4i,
    param_distributions=param_grid_ai4i,
    n_iter=10,
    scoring='f1',
    cv=3,
    verbose=1,
    random_state=42,
    n_jobs=-1
)

random_search_ai4i.fit(X_train_ai4i_resampled, y_train_ai4i_resampled)

print(f"Best parameters found for AI4I: {random_search_ai4i.best_params_}")

xgb_ai4i_model = random_search_ai4i.best_estimator_
"""
            cell['source'] = [line + '\n' if i < len(new_source.split('\n'))-1 else line for i, line in enumerate(new_source.split('\n'))]

with open('Hardware_failure.ipynb', 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=1)

print("Injected Hyperparameter tuning into the notebook.")
