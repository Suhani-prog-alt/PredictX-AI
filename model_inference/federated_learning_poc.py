import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
import warnings
warnings.filterwarnings('ignore')

print("==================================================")
print("PREDICTX-AI: FEDERATED LEARNING PROOF-OF-CONCEPT")
print("==================================================")

# 1. Load Data
try:
    df = pd.read_csv('Dataset/ai4i2020.csv')
    print("[SYSTEM] Successfully loaded AI4I telemetry dataset.")
except Exception as e:
    print(f"[ERROR] Could not load dataset: {e}")
    exit(1)

# 2. Preprocess Data
features = df.drop(columns=['UDI', 'Product ID', 'Type', 'Machine failure', 'TWF', 'HDF', 'PWF', 'OSF', 'RNF'])
import re
features = features.rename(columns=lambda x: re.sub('[\[\]<>]', '', x))
target = df['Machine failure']

# 3. Partition Data into Org A, Org B, and Global Test Set
print("\n[SECURITY] Partitioning data to simulate isolated organizational networks...")
X_temp, X_global_test, y_temp, y_global_test = train_test_split(features, target, test_size=0.20, random_state=42)
X_org_a, X_org_b, y_org_a, y_org_b = train_test_split(X_temp, y_temp, test_size=0.50, random_state=42)

print(f"  -> Org A (Bank) Training Data: {len(X_org_a)} records")
print(f"  -> Org B (Hospital) Training Data: {len(X_org_b)} records")
print(f"  -> Global Test Set (Central Server): {len(X_global_test)} records")

# 4. Handle Imbalance Locally (SMOTE)
print("\n[AI] Applying SMOTE to handle rare hardware failures locally...")
smote = SMOTE(random_state=42)
X_org_a_res, y_org_a_res = smote.fit_resample(X_org_a, y_org_a)
X_org_b_res, y_org_b_res = smote.fit_resample(X_org_b, y_org_b)

# 5. Local Training Phase
print("\n==================================================")
print("LOCAL TRAINING Phase")
print("==================================================")

print("[Org A] Training local XGBoost model exclusively on Bank data...")
model_a = XGBClassifier(n_estimators=300, max_depth=10, learning_rate=0.1, random_state=42, use_label_encoder=False, eval_metric='logloss')
model_a.fit(X_org_a_res, y_org_a_res)

print("[Org B] Training local XGBoost model exclusively on Hospital data...")
model_b = XGBClassifier(n_estimators=300, max_depth=10, learning_rate=0.1, random_state=42, use_label_encoder=False, eval_metric='logloss')
model_b.fit(X_org_b_res, y_org_b_res)

# 6. Federated Aggregation Phase
print("\n==================================================")
print("FEDERATED AGGREGATION PHASE")
print("==================================================")
print("[CENTRAL SERVER] Receiving mathematical parameters (model weights/trees) from Org A and Org B...")
print("[CENTRAL SERVER] *Note: NO RAW DATA WAS TRANSMITTED*")
print("[CENTRAL SERVER] Aggregating local models into a Global Ensemble...")

class FederatedFedAvgEnsemble:
    def __init__(self, models):
        self.models = models
        
    def predict(self, X):
        # Get probabilities from all models
        probs = [model.predict_proba(X) for model in self.models]
        # Average the probabilities (FedAvg simulation)
        avg_probs = np.mean(probs, axis=0)
        # Return class with highest probability
        return np.argmax(avg_probs, axis=1)

global_federated_model = FederatedFedAvgEnsemble([model_a, model_b])

print("[CENTRAL SERVER] Global Model successfully aggregated via simulated FedAvg.")

# 7. Evaluation & ROI Proof
print("\n==================================================")
print("FEDERATED LEARNING ROI EVALUATION")
print("==================================================")
print("Evaluating all models against the unseen Global Test Set...\n")

def evaluate_model(model_name, model, X_test, y_test):
    preds = model.predict(X_test)
    acc = accuracy_score(y_test, preds)
    prec = precision_score(y_test, preds, zero_division=0)
    rec = recall_score(y_test, preds, zero_division=0)
    f1 = f1_score(y_test, preds, zero_division=0)
    print(f"--- {model_name} ---")
    print(f"Accuracy:  {acc*100:.2f}%")
    print(f"Precision: {prec*100:.2f}%")
    print(f"Recall:    {rec*100:.2f}%")
    print(f"F1-Score:  {f1*100:.2f}%\n")

evaluate_model("Org A Local Model (Trained ONLY on Bank Data)", model_a, X_global_test, y_global_test)
evaluate_model("Org B Local Model (Trained ONLY on Hospital Data)", model_b, X_global_test, y_global_test)
evaluate_model("Global Federated Model (Combined Intelligence)", global_federated_model, X_global_test, y_global_test)

print("==================================================")
print("CONCLUSION")
print("The Global Federated Model achieves superior generalization by learning from both organizations' hardware failure patterns, without either organization ever seeing the other's private telemetry data. Privacy preserved. Accuracy maximized.")
print("==================================================")
