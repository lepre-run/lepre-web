import importlib.util
import unittest
from pathlib import Path
from types import ModuleType


def load_transformer() -> ModuleType:
    transformer_path = (
        Path(__file__).parents[1]
        / "transformers"
        / "aggregate_duplicates.py"
    )
    spec = importlib.util.spec_from_file_location(
        "aggregate_duplicates", transformer_path
    )
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load the duplicate aggregator")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class AggregateDuplicatesTest(unittest.TestCase):
    def setUp(self) -> None:
        self.transformer = load_transformer()

    def test_combines_duplicate_findings_and_preserves_issue_order(self) -> None:
        first_issue = {"key": "src/first.ts", "details": {"file": "src/first.ts"}}
        second_issue = {
            "key": "src/second.ts",
            "details": {"file": "src/second.ts"},
        }
        findings = [
            {
                "smell": "duplicated-code",
                "details": {"lines": 6},
                "issues": [first_issue],
            },
            {
                "smell": "duplicated-code",
                "details": {"lines": 8},
                "issues": [second_issue],
            },
        ]

        self.assertEqual(
            self.transformer.aggregate_duplicates(findings),
            [
                {
                    "smell": "duplicated-code",
                    "details": {"clones": 2},
                    "issues": [first_issue, second_issue],
                }
            ],
        )

    def test_preserves_other_findings(self) -> None:
        complexity = {
            "smell": "high-complexity",
            "details": {},
            "issues": [],
        }

        self.assertEqual(
            self.transformer.aggregate_duplicates([complexity]),
            [complexity],
        )


if __name__ == "__main__":
    unittest.main()
