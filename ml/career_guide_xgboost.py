import argparse
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import xgboost as xgb
from imblearn.over_sampling import RandomOverSampler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder


def preprocess_data(df: pd.DataFrame, target_col: str):
    ordinal_mappings = {
        "poor": 0,
        "medium": 1,
        "excellent": 2,
        "no": 0,
        "yes": 1,
        "stubborn": 0,
        "gentle": 1,
        "hard worker": 0,
        "smart worker": 1,
        "work": 0,
        "salary": 1,
        "management": 0,
        "technical": 1,
    }

    processed_df = df.copy()

    for col in processed_df.columns:
        if processed_df[col].dtype == "object":
            normalized_values = processed_df[col].astype(str).str.strip().str.lower()
            unique_values = set(normalized_values.unique())
            if unique_values and unique_values.issubset(set(ordinal_mappings.keys())):
                processed_df[col] = normalized_values.map(ordinal_mappings)

    if target_col not in processed_df.columns:
        raise ValueError(f"Target column '{target_col}' not found in CSV.")

    role_mappings = {
        "CRM Business Analyst": "CRM/Managerial",
        "CRM Technical Developer": "CRM/Managerial",
        "Project Manager": "CRM/Managerial",
        "Information Technology Manager": "CRM/Managerial",
        "Business Systems Analyst": "Analyst",
        "Business Intelligence Analyst": "Analyst",
        "E-Commerce Analyst": "Analyst",
        "Mobile Applications Developer": "Web/Mobile Dev",
        "Web Developer": "Web/Mobile Dev",
        "Applications Developer": "Web/Mobile Dev",
        "Software Quality Assurance (QA) / Testing": "QA/Testing",
        "Quality Assurance Associate": "QA/Testing",
        "UX Designer": "UX/Design",
        "Design & UX": "UX/Design",
        "Database Developer": "Databases",
        "Database Administrator": "Databases",
        "Database Manager": "Databases",
        "Portal Administrator": "Databases",
        "Programmer Analyst": "Systems Analyst",
        "Systems Analyst": "Systems Analyst",
        "Network Security Administrator": "Networks/Systems",
        "Network Security Engineer": "Networks/Systems",
        "Network Engineer": "Networks/Systems",
        "Systems Security Administrator": "Networks/Systems",
        "Software Systems Engineer": "Networks/Systems",
        "Information Security Analyst": "Networks/Systems",
        "Software Engineer": "SE/SDE",
        "Software Developer": "SE/SDE",
        "Technical Engineer": "Tech Support",
        "Technical Services/Help Desk/Tech Support": "Tech Support",
        "Technical Support": "Tech Support",
        "Solutions Architect": "Others",
        "Data Architect": "Others",
        "Information Technology Auditor": "Others",
    }
    processed_df[target_col] = processed_df[target_col].replace(role_mappings)

    categorical_cols = processed_df.select_dtypes(include=["object"]).columns.tolist()
    if target_col in categorical_cols:
        categorical_cols.remove(target_col)

    label_encoders = {}
    for col in categorical_cols:
        le = LabelEncoder()
        processed_df[col] = le.fit_transform(processed_df[col].astype(str))
        label_encoders[col] = le

    target_le = LabelEncoder()
    processed_df[target_col] = target_le.fit_transform(processed_df[target_col].astype(str))

    X = processed_df.drop(columns=[target_col])
    y = processed_df[target_col]

    return X, y, label_encoders, target_le


def train_model(X: pd.DataFrame, y: pd.Series):
    ros = RandomOverSampler(random_state=42)
    X_resampled, y_resampled = ros.fit_resample(X, y)

    X_train, X_test, y_train, y_test = train_test_split(
        X_resampled,
        y_resampled,
        test_size=0.2,
        random_state=42,
        stratify=y_resampled,
    )

    model = xgb.XGBClassifier(
        n_estimators=200,
        learning_rate=0.1,
        max_depth=8,
        subsample=0.8,
        colsample_bytree=0.8,
        objective="multi:softprob",
        num_class=len(np.unique(y_resampled)),
        n_jobs=-1,
        random_state=42,
        eval_metric="merror",
        reg_alpha=0.1,
        reg_lambda=2.0,
        gamma=0.2,
    )

    print("Training XGBoost...")
    eval_set = [(X_train, y_train), (X_test, y_test)]
    model.fit(
        X_train,
        y_train,
        eval_set=eval_set,
        verbose=10,
    )

    return model, X_train, X_test, y_train, y_test


def evaluate_and_plot(model, X_test, y_test, target_le: LabelEncoder, output_dir: Path):
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Final Accuracy: {accuracy * 100:.2f}%")

    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=target_le.classes_))

    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(12, 10))
    sns.heatmap(
        cm,
        annot=False,
        cmap="Blues",
        xticklabels=target_le.classes_,
        yticklabels=target_le.classes_,
    )
    plt.title("Confusion Matrix")
    plt.xlabel("Predicted")
    plt.ylabel("Actual")
    cm_path = output_dir / "confusion_matrix.png"
    plt.tight_layout()
    plt.savefig(cm_path)
    plt.close()

    results = model.evals_result()
    epochs = len(results["validation_0"]["merror"])
    x_axis = range(0, epochs)

    fig, ax = plt.subplots(figsize=(10, 6))
    ax.plot(x_axis, results["validation_0"]["merror"], label="Train")
    ax.plot(x_axis, results["validation_1"]["merror"], label="Test")
    ax.legend()
    plt.ylabel("Classification Error")
    plt.title("XGBoost Classification Error")
    lc_path = output_dir / "learning_curve.png"
    plt.tight_layout()
    plt.savefig(lc_path)
    plt.close(fig)

    print(f"Saved confusion matrix to: {cm_path}")
    print(f"Saved learning curve to: {lc_path}")


def save_artifacts(model, label_encoders, target_le, feature_columns, output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)

    joblib.dump(model, output_dir / "career_model.joblib")
    joblib.dump(label_encoders, output_dir / "feature_label_encoders.joblib")
    joblib.dump(target_le, output_dir / "target_label_encoder.joblib")
    joblib.dump(feature_columns, output_dir / "feature_columns.joblib")

    print(f"Saved model artifacts in: {output_dir}")


def main():
    parser = argparse.ArgumentParser(description="Train XGBoost model for career role prediction.")
    parser.add_argument("--data", default="roo_data.csv", help="Path to CSV training data.")
    parser.add_argument(
        "--target",
        default="Suggested Job Role",
        help="Target column name.",
    )
    parser.add_argument(
        "--out",
        default="artifacts",
        help="Directory for model and plots.",
    )
    args = parser.parse_args()

    data_path = Path(args.data)
    if not data_path.exists():
        raise FileNotFoundError(f"CSV not found: {data_path}")

    output_dir = Path(args.out)
    output_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(data_path)
    X, y, label_encoders, target_le = preprocess_data(df, args.target)
    model, _, X_test, _, y_test = train_model(X, y)

    evaluate_and_plot(model, X_test, y_test, target_le, output_dir)
    save_artifacts(model, label_encoders, target_le, list(X.columns), output_dir)


if __name__ == "__main__":
    main()
