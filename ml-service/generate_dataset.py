import pandas as pd
import random
import math

rows = []

TOTAL_STUDENTS = 15000

# Maximum rank limits (approx realistic)
MAX_RANK_JEE = 120000
MAX_RANK_NEET = 180000

for i in range(TOTAL_STUDENTS):

    # Randomly choose stream
    stream = random.choice(["PCM", "PCB"])

    physics = random.randint(20, 100)
    chemistry = random.randint(20, 100)

    if stream == "PCM":
        maths = random.randint(20, 100)
        biology = 0
        total = physics + chemistry + maths
        max_rank = MAX_RANK_JEE

    else:
        biology = random.randint(20, 100)
        maths = 0
        total = physics + chemistry + biology
        max_rank = MAX_RANK_NEET

    # Normalize score
    score_ratio = total / 300

    # Logistic rank curve (very realistic)
    difficulty_factor = 12

    rank_ratio = 1 / (1 + math.exp(difficulty_factor * (score_ratio - 0.5)))

    rank = int(rank_ratio * max_rank)

    # Add realistic noise
    noise_range = int(max_rank * 0.01)
    noise = random.randint(-noise_range, noise_range)

    rank += noise

    if rank < 1:
        rank = 1

    rows.append([
        physics,
        chemistry,
        maths,
        biology,
        total,
        stream,
        rank
    ])

df = pd.DataFrame(rows, columns=[
    "physics",
    "chemistry",
    "maths",
    "biology",
    "total",
    "stream",
    "rank"
])

df.to_csv("dataset.csv", index=False)

print("Realistic JEE + NEET dataset created:", len(df), "rows")
