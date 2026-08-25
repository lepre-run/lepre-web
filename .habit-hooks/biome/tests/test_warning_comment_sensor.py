import json
import subprocess
import tempfile
import unittest
from pathlib import Path


SENSOR = Path(__file__).parents[1] / "sensors" / "warning_comment.cjs"
PROJECT_ROOT = Path(__file__).parents[3]


def run_sensor(source: str, suffix: str = ".ts") -> list[dict]:
    with tempfile.TemporaryDirectory() as temporary_directory:
        file = Path(temporary_directory) / f"example{suffix}"
        file.write_text(source)
        result = subprocess.run(
            ["node", str(SENSOR), str(file)],
            cwd=PROJECT_ROOT,
            capture_output=True,
            check=True,
            text=True,
        )
        return json.loads(result.stdout)


class WarningCommentSensorTest(unittest.TestCase):
    def test_reports_configured_terms_as_whole_words_anywhere(self) -> None:
        findings = run_sensor(
            """// Revisit this TODO before release.
const value = 1;
/* This remains a FiXmE and a HACK. */
// XXX
"""
        )

        self.assertEqual(findings[0]["smell"], "warning-comment")
        self.assertEqual(
            [issue["details"]["line"] for issue in findings[0]["issues"]],
            [1, 3, 4],
        )
        self.assertTrue(
            all(
                issue["details"]["source"] == "typescript:warning-comment"
                for issue in findings[0]["issues"]
            )
        )

    def test_ignores_terms_outside_comments_and_partial_words(self) -> None:
        findings = run_sensor(
            """const label = 'TODO';
// The hacker finished fixing this methodical task.
"""
        )

        self.assertEqual(findings, [])

    def test_reports_jsx_comments(self) -> None:
        findings = run_sensor("const view = <View>{/* TODO */}</View>;", ".tsx")

        self.assertEqual(findings[0]["smell"], "warning-comment")


if __name__ == "__main__":
    unittest.main()
