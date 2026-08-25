import json
import subprocess
import tempfile
import unittest
from pathlib import Path


SENSOR = Path(__file__).parents[1] / "sensors" / "swallowed_exception.cjs"
PROJECT_ROOT = Path(__file__).parents[3]


def run_sensor(source: str) -> list[dict]:
    with tempfile.TemporaryDirectory() as temporary_directory:
        file = Path(temporary_directory) / "example.ts"
        file.write_text(source)
        result = subprocess.run(
            ["node", str(SENSOR), str(file)],
            cwd=PROJECT_ROOT,
            capture_output=True,
            check=True,
            text=True,
        )
        return json.loads(result.stdout)


class SwallowedExceptionSensorTest(unittest.TestCase):
    def test_reports_empty_and_comment_only_catches(self) -> None:
        findings = run_sensor(
            """try {
  work();
} catch {
}

try {
  work();
} catch (error) {
  // Intentionally ignored.
}
"""
        )

        self.assertEqual(findings[0]["smell"], "swallowed-exception")
        self.assertEqual(
            [issue["details"]["line"] for issue in findings[0]["issues"]],
            [3, 8],
        )
        self.assertTrue(
            all(
                issue["details"]["source"] == "typescript:swallowed-exception"
                for issue in findings[0]["issues"]
            )
        )

    def test_ignores_handled_catches_and_other_empty_blocks(self) -> None:
        findings = run_sensor(
            """function empty() {}
try {
  work();
} catch (error) {
  report(error);
}
"""
        )

        self.assertEqual(findings, [])


if __name__ == "__main__":
    unittest.main()
