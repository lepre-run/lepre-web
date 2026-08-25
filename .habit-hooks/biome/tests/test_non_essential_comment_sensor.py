import json
import subprocess
import tempfile
import unittest
from pathlib import Path


SENSOR = Path(__file__).parents[1] / "sensors" / "non_essential_comment.cjs"
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


class NonEssentialCommentSensorTest(unittest.TestCase):
    def test_reports_single_block_and_jsdoc_comments_at_the_thresholds(self) -> None:
        findings = run_sensor(
            """// explain
const value = 1;
/* long enough */
/** documentation */
"""
        )

        self.assertEqual(findings[0]["smell"], "non-essential-comment")
        self.assertEqual(
            [issue["details"]["line"] for issue in findings[0]["issues"]],
            [1, 3, 4],
        )
        self.assertEqual(
            [issue["details"]["message"].split("-line")[0] for issue in findings[0]["issues"]],
            ["single", "block", "JSDoc"],
        )

    def test_ignores_short_comments_directives_and_comment_like_strings(self) -> None:
        findings = run_sensor(
            """// short
// eslint-disable-next-line lint/style/useConst
const text = '// this is not a comment';
"""
        )

        self.assertEqual(findings, [])

    def test_reports_jsx_comments(self) -> None:
        findings = run_sensor(
            "const view = <View>{/* explanatory comment */}</View>;",
            ".tsx",
        )

        self.assertEqual(findings[0]["smell"], "non-essential-comment")


if __name__ == "__main__":
    unittest.main()
