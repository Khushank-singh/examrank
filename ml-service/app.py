from flask import Flask, request, jsonify
import joblib
import pandas as pd
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

print("Loading ML model...")

# Load trained model
model = joblib.load("rank_model.pkl")

print("Model loaded successfully")


@app.route("/predict", methods=["POST"])
def predict():

    try:
        data = request.json

        # Get inputs safely
        physics = float(data.get("physics", 0))
        chemistry = float(data.get("chemistry", 0))
        maths = float(data.get("maths", 0))
        biology = float(data.get("biology", 0))
        stream = data.get("stream", "PCM")

        # Encode stream
        if stream == "PCM":
            stream_encoded = 0
            total = physics + chemistry + maths
            biology = 0

        elif stream == "PCB":
            stream_encoded = 1
            total = physics + chemistry + biology
            maths = 0

        else:
            return jsonify({
                "error": "Invalid stream"
            }), 400

        # Create dataframe with SAME feature names as training
        input_df = pd.DataFrame([{
            "physics": physics,
            "chemistry": chemistry,
            "maths": maths,
            "biology": biology,
            "total": total,
            "stream": stream_encoded
        }])

        print("Prediction request:", input_df.to_dict())

        # Predict rank
        predicted_rank = model.predict(input_df)[0]

        return jsonify({
            "physics": physics,
            "chemistry": chemistry,
            "maths": maths,
            "biology": biology,
            "total": total,
            "stream": stream,
            "predicted_rank": int(predicted_rank)
        })

    except Exception as e:

        print("ERROR:", str(e))

        return jsonify({
            "error": str(e)
        }), 500


@app.route("/")
def home():
    return "ExamRank ML Service Running"


if __name__ == "__main__":
    app.run(port=5001, debug=True)
