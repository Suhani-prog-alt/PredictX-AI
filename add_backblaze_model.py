import json
import nbformat as nbf

notebook_path = 'Hardware_failure.ipynb'

with open(notebook_path, 'r', encoding='utf-8') as f:
    nb = json.load(f)

# Add Markdown Header for Backblaze
nb['cells'].append({
    "cell_type": "markdown",
    "metadata": {},
    "source": [
        "# Model 3: Backblaze Hard Drive Failure Prediction\n",
        "This section trains an XGBoost model on the down-sampled Backblaze hard drive dataset."
    ]
})

# Add Code Cell for Loading and Preprocessing Backblaze
backblaze_load_code = """
import pandas as pd
from sklearn.model_selection import train_test_split

print("Loading optimized Backblaze dataset...")
df_bb = pd.read_csv('Dataset/backblaze_sampled.csv')

# Drop non-numeric columns that aren't useful for pure numerical modeling
cols_to_drop = ['date', 'serial_number', 'model', 'datacenter', 'cluster_id', 'vault_id', 'pod_id', 'pod_slot_num']
df_bb = df_bb.drop(columns=[c for c in cols_to_drop if c in df_bb.columns])

# The target is 'failure'
X_bb = df_bb.drop('failure', axis=1)
y_bb = df_bb['failure']

# Get dummies for any remaining categorical (if any)
X_bb = pd.get_dummies(X_bb, drop_first=True)

# XGBoost handles missing values natively, but we ensure float types
X_bb = X_bb.astype(float)

X_train_bb, X_test_bb, y_train_bb, y_test_bb = train_test_split(X_bb, y_bb, test_size=0.2, random_state=42, stratify=y_bb)
print(f"Backblaze Training Set: {X_train_bb.shape[0]} rows")
print(f"Backblaze Test Set: {X_test_bb.shape[0]} rows")
"""
nb['cells'].append({
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [line + '\n' for line in backblaze_load_code.split('\n')]
})

# Add Code Cell for Training Backblaze Model
backblaze_train_code = """
from xgboost import XGBClassifier
from sklearn.model_selection import RandomizedSearchCV
import joblib

print("Starting RandomizedSearchCV for Backblaze Model...")

neg_count_bb = sum(y_train_bb == 0)
pos_count_bb = sum(y_train_bb == 1)
scale_weight_bb = neg_count_bb / pos_count_bb if pos_count_bb > 0 else 1

param_grid_bb = {
    'max_depth': [3, 5, 7],
    'learning_rate': [0.05, 0.1, 0.2],
    'n_estimators': [100, 200],
    'subsample': [0.8, 1.0],
    'colsample_bytree': [0.8, 1.0],
    'scale_pos_weight': [scale_weight_bb]
}

xgb_base_bb = XGBClassifier(random_state=42, use_label_encoder=False, eval_metric='logloss')

random_search_bb = RandomizedSearchCV(
    estimator=xgb_base_bb,
    param_distributions=param_grid_bb,
    n_iter=10,
    scoring='f1',
    cv=3,
    verbose=1,
    random_state=42,
    n_jobs=-1
)

random_search_bb.fit(X_train_bb, y_train_bb)
print(f"Best parameters found for Backblaze: {random_search_bb.best_params_}")

xgb_bb_model = random_search_bb.best_estimator_
y_pred_bb = xgb_bb_model.predict(X_test_bb)

joblib.dump(xgb_bb_model, 'model_artifacts/xgb_backblaze_model.joblib')
joblib.dump(X_bb.columns.tolist(), 'model_artifacts/backblaze_feature_columns.joblib')
print("Backblaze model saved!")
"""
nb['cells'].append({
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [line + '\n' for line in backblaze_train_code.split('\n')]
})

# Add Code Cell for Evaluating Backblaze Model
backblaze_eval_code = """
from sklearn.metrics import roc_curve, auc, confusion_matrix, precision_recall_curve, average_precision_score
import matplotlib.pyplot as plt
import seaborn as sns
import os

print("### Backblaze Hard Drive Model Evaluation ###")

# Confusion Matrix
cm_bb = confusion_matrix(y_test_bb, y_pred_bb)
plt.figure(figsize=(6, 5))
sns.heatmap(cm_bb, annot=True, fmt='d', cmap='Reds', xticklabels=['Healthy', 'Failed'], yticklabels=['Healthy', 'Failed'])
plt.title('Confusion Matrix (Backblaze)')
plt.xlabel('Predicted')
plt.ylabel('Actual')
os.makedirs('Images', exist_ok=True)
plt.savefig('Images/plot_bb_01.png', bbox_inches='tight', facecolor='white')
plt.show()

# ROC Curve
y_prob_bb = xgb_bb_model.predict_proba(X_test_bb)[:, 1]
fpr_bb, tpr_bb, _ = roc_curve(y_test_bb, y_prob_bb)
roc_auc_bb = auc(fpr_bb, tpr_bb)

plt.figure(figsize=(7, 6))
plt.plot(fpr_bb, tpr_bb, color='darkred', lw=2, label=f'ROC curve (area = {roc_auc_bb:.2f})')
plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--')
plt.xlim([0.0, 1.0])
plt.ylim([0.0, 1.05])
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate')
plt.title('ROC Curve (Backblaze)')
plt.legend(loc='lower right')
plt.savefig('Images/plot_bb_02.png', bbox_inches='tight', facecolor='white')
plt.show()

print(f"Backblaze Model ROC AUC: {roc_auc_bb:.2f}")

# Feature Importances
importances_bb = xgb_bb_model.feature_importances_
feature_names_bb = X_bb.columns
feature_imp_bb = pd.DataFrame({'Feature': feature_names_bb, 'Importance': importances_bb}).sort_values(by='Importance', ascending=False)

plt.figure(figsize=(10, 8))
sns.barplot(x='Importance', y='Feature', data=feature_imp_bb.head(15), palette='Reds_r')
plt.title('Top 15 Feature Importances (Backblaze)')
plt.savefig('Images/plot_bb_03.png', bbox_inches='tight', facecolor='white')
plt.show()
"""
nb['cells'].append({
    "cell_type": "code",
    "execution_count": None,
    "metadata": {},
    "outputs": [],
    "source": [line + '\n' for line in backblaze_eval_code.split('\n')]
})

with open(notebook_path, 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=1)

print("Backblaze modeling pipeline successfully appended to the notebook.")
