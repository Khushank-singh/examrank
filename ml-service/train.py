import pandas as pd
import joblib

from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

print("Loading dataset...")

# Load dataset
data = pd.read_csv("dataset.csv")

# Convert stream to numeric encoding
# PCM = 0, PCB = 1
data["stream"] = data["stream"].map({
    "PCM": 0,
    "PCB": 1
})

# Ensure no missing values
data = data.fillna(0)

print("Dataset loaded:", len(data), "rows")

# Feature selection
X = data[[
    "physics",
    "chemistry",
    "maths",
    "biology",
    "total",
    "stream"
]]

# Target
y = data["rank"]

print("Splitting dataset...")

# Split dataset
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

print("Training RandomForest model...")

# Create optimized RandomForest model
model = RandomForestRegressor(
    n_estimators=300,     # more trees = better accuracy
    max_depth=15,         # prevents overfitting
    min_samples_split=5,
    min_samples_leaf=2,
    random_state=42,
    n_jobs=-1             # use all CPU cores
)

# Train model
model.fit(X_train, y_train)

print("Model trained successfully")

# Predict test data
predictions = model.predict(X_test)

# Evaluate performance
mae = mean_absolute_error(y_test, predictions)
r2 = r2_score(y_test, predictions)

print("\nModel Performance:")
print("------------------")
print("MAE:", round(mae, 2))
print("R2 Score:", round(r2, 5))

# Save trained model
joblib.dump(model, "rank_model.pkl")

print("\nModel saved as rank_model.pkl")
print("Training complete.")
