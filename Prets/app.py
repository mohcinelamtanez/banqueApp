from flask import Flask, request, jsonify
import joblib
import numpy as np

app = Flask(__name__)

# Charger le modèle et le scaler
model = joblib.load("nn_model.pkl")
scaler = joblib.load("scaler.pkl")

@app.route("/predict", methods=["POST"])
def predict():
    data = request.json

    revenu = data["revenu"]
    remboursement = data["remboursement"]
    duree = data["duree"]
    taux = data["taux"]

    X = np.array([[revenu, remboursement, duree, taux]])
    X_scaled = scaler.transform(X)

    proba = model.predict_proba(X_scaled)[0][1]
    prediction = model.predict(X_scaled)[0]

    decision = "RISQUE_ELEVE" if prediction == 1 else "RISQUE_FAIBLE"

    return jsonify({
        "score_risque": round(float(proba), 2),
        "decision": decision
    })

if __name__ == "__main__":
    app.run(port=5000)