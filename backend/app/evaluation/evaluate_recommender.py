import json
from pathlib import Path

from app.db.session import SessionLocal
from app.services.local_recommender import get_local_recommendation


DATA_FILE = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "evaluation_profiles.json"
)


def load_test_profiles():
    with open(DATA_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def normalize(value):
    return str(value).strip().lower()


def calculate_metrics(y_true, y_pred):
    labels = sorted(set(y_true) | set(y_pred))

    total = len(y_true)

    correct = sum(
        normalize(actual) == normalize(predicted)
        for actual, predicted in zip(y_true, y_pred)
    )

    accuracy = correct / total if total else 0

    per_class = {}

    for label in labels:
        label_norm = normalize(label)

        tp = sum(
            normalize(actual) == label_norm
            and normalize(predicted) == label_norm
            for actual, predicted in zip(y_true, y_pred)
        )

        fp = sum(
            normalize(actual) != label_norm
            and normalize(predicted) == label_norm
            for actual, predicted in zip(y_true, y_pred)
        )

        fn = sum(
            normalize(actual) == label_norm
            and normalize(predicted) != label_norm
            for actual, predicted in zip(y_true, y_pred)
        )

        precision = (
            tp / (tp + fp)
            if tp + fp
            else 0
        )

        recall = (
            tp / (tp + fn)
            if tp + fn
            else 0
        )

        f1 = (
            2 * precision * recall / (precision + recall)
            if precision + recall
            else 0
        )

        per_class[label] = {
            "precision": precision,
            "recall": recall,
            "f1": f1,
        }

    macro_precision = (
        sum(x["precision"] for x in per_class.values())
        / len(per_class)
        if per_class
        else 0
    )

    macro_recall = (
        sum(x["recall"] for x in per_class.values())
        / len(per_class)
        if per_class
        else 0
    )

    macro_f1 = (
        sum(x["f1"] for x in per_class.values())
        / len(per_class)
        if per_class
        else 0
    )

    return {
        "accuracy": accuracy,
        "precision": macro_precision,
        "recall": macro_recall,
        "f1": macro_f1,
        "per_class": per_class,
    }


def evaluate():
    profiles = load_test_profiles()

    db = SessionLocal()

    y_true = []
    y_pred = []

    top3_correct = 0
    details = []

    try:
        for profile in profiles:

            result = get_local_recommendation(
                db,
                profile["branch"],
                profile["skills"],
                profile["interests"],
            )

            expected = profile["expected_career"]
            predicted = result["recommendedCareer"]

            job_roles = result.get("jobRoles", [])

            ranked_roles = [
                role.get("job_role")
                for role in job_roles
                if isinstance(role, dict)
                and role.get("job_role")
            ]

            top3 = ranked_roles[:3]

            # Top-3 accuracy
            if any(
                normalize(role) == normalize(expected)
                for role in top3
            ):
                top3_correct += 1

            y_true.append(expected)
            y_pred.append(predicted)

            details.append(
                {
                    "expected": expected,
                    "predicted": predicted,
                    "top3": top3,
                    "correct": (
                        normalize(expected)
                        == normalize(predicted)
                    ),
                }
            )

    finally:
        db.close()

    metrics = calculate_metrics(
        y_true,
        y_pred,
    )

    total = len(profiles)

    metrics["total_profiles"] = total

    metrics["top1_accuracy"] = (
        metrics["accuracy"]
    )

    metrics["top3_accuracy"] = (
        top3_correct / total
        if total
        else 0
    )

    metrics["details"] = details

    return metrics


if __name__ == "__main__":

    results = evaluate()

    print("\n")
    print("=" * 55)
    print("        CAREER PATHFINDER MODEL EVALUATION")
    print("=" * 55)

    print(
        f"\nTest profiles:     "
        f"{results['total_profiles']}"
    )

    print(
        f"Top-1 Accuracy:    "
        f"{results['top1_accuracy'] * 100:.2f}%"
    )

    print(
        f"Top-3 Accuracy:    "
        f"{results['top3_accuracy'] * 100:.2f}%"
    )

    print(
        f"Precision:         "
        f"{results['precision']:.4f}"
    )

    print(
        f"Recall:            "
        f"{results['recall']:.4f}"
    )

    print(
        f"F1 Score:          "
        f"{results['f1']:.4f}"
    )

    print("\n")
    print("-" * 55)
    print("INDIVIDUAL PREDICTIONS")
    print("-" * 55)

    for item in results["details"]:

        status = "✓" if item["correct"] else "✗"

        print(
            f"{status} "
            f"Expected: {item['expected']} | "
            f"Predicted: {item['predicted']}"
        )

        print(
            f"   Top 3: {', '.join(item['top3'])}"
        )

    print("\n")
    print("=" * 55)