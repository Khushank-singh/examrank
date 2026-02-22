from flask import Flask, request, jsonify

app = Flask(__name__)

# =====================================================
# TOTAL CANDIDATES (REALISTIC NUMBERS)
# =====================================================

TOTAL_NEET_STUDENTS = 2300000
TOTAL_JEE_STUDENTS = 1200000


# =====================================================
# NEET MARKS VS RANK TABLE
# =====================================================

NEET_TABLE = [
    (720, 1),
    (710, 20),
    (700, 100),
    (690, 400),
    (680, 1000),
    (670, 3000),
    (660, 7000),
    (650, 13000),
    (640, 22000),
    (630, 35000),
    (620, 52000),
    (600, 95000),
    (580, 150000),
    (560, 230000),
    (540, 320000),
    (520, 450000),
    (500, 620000),
    (480, 800000),
    (460, 1000000),
    (440, 1200000),
    (420, 1400000),
    (400, 1600000),
    (380, 1800000),
    (360, 1950000),
    (340, 2100000),
    (300, 2200000),
]


# =====================================================
# JEE MARKS VS RANK TABLE
# =====================================================

JEE_TABLE = [
    (300, 1),
    (290, 50),
    (280, 200),
    (270, 600),
    (260, 1500),
    (250, 3200),
    (240, 6000),
    (230, 10000),
    (220, 16000),
    (210, 24000),
    (200, 35000),
    (190, 48000),
    (180, 65000),
    (170, 85000),
    (160, 110000),
    (150, 140000),
    (140, 180000),
    (130, 220000),
    (120, 270000),
    (110, 320000),
    (100, 380000),
]


# =====================================================
# INTERPOLATION ENGINE
# =====================================================

def interpolate(marks, table):

    if marks >= table[0][0]:
        return table[0][1]

    if marks <= table[-1][0]:
        return table[-1][1]

    for i in range(len(table) - 1):

        m1, r1 = table[i]
        m2, r2 = table[i + 1]

        if m1 >= marks >= m2:

            ratio = (marks - m2) / (m1 - m2)
            rank = r2 + ratio * (r1 - r2)

            return int(rank)

    return table[-1][1]


# =====================================================
# PERCENTILE CALCULATION
# =====================================================

def calculate_percentile(rank, total_students):

    percentile = ((total_students - rank) / total_students) * 100

    return round(percentile, 2)


# =====================================================
# CONFIDENCE SCORE
# =====================================================

def calculate_confidence(marks, table):

    max_marks = table[0][0]
    min_marks = table[-1][0]

    normalized = (marks - min_marks) / (max_marks - min_marks)

    confidence = 70 + (normalized * 29)

    return round(confidence, 2)


# =====================================================
# MAIN PREDICTION ENGINE
# =====================================================

def predict_rank(stream, physics, chemistry, maths, biology):

    if stream == "PCM":

        total = physics + chemistry + maths

        rank = interpolate(total, JEE_TABLE)

        percentile = calculate_percentile(rank, TOTAL_JEE_STUDENTS)

        confidence = calculate_confidence(total, JEE_TABLE)

    elif stream == "PCB":

        total = physics + chemistry + biology

        rank = interpolate(total, NEET_TABLE)

        percentile = calculate_percentile(rank, TOTAL_NEET_STUDENTS)

        confidence = calculate_confidence(total, NEET_TABLE)

    else:

        raise ValueError("Invalid stream")

    return {
        "total_marks": total,
        "predicted_rank": rank,
        "percentile": percentile,
        "confidence": confidence
    }


# =====================================================
# API ROUTE
# =====================================================

@app.route("/predict", methods=["POST"])
def predict():

    try:

        data = request.json

        stream = data.get("stream")

        physics = float(data.get("physics", 0))
        chemistry = float(data.get("chemistry", 0))
        maths = float(data.get("maths", 0))
        biology = float(data.get("biology", 0))

        result = predict_rank(
            stream,
            physics,
            chemistry,
            maths,
            biology
        )

        print(f"Prediction: {result}")

        return jsonify(result)

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 400


# =====================================================

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
