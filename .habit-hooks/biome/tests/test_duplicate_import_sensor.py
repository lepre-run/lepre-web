import json
import subprocess
import tempfile
import unittest
from pathlib import Path


SENSOR = Path(__file__).parents[1] / "sensors" / "duplicate_import.cjs"
PROJECT_ROOT = Path(__file__).parents[3]


def run_sensor(source: str) -> tuple[Path, list[dict]]:
    temporary_directory = tempfile.TemporaryDirectory()
    file = Path(temporary_directory.name) / "example.ts"
    file.write_text(source)
    result = subprocess.run(
        ["node", str(SENSOR), str(file)],
        cwd=PROJECT_ROOT,
        capture_output=True,
        check=True,
        text=True,
    )
    findings = json.loads(result.stdout)
    temporary_directory.cleanup()
    return file, findings


class DuplicateImportSensorTest(unittest.TestCase):
    def test_reports_each_repeated_static_import(self) -> None:
        file, findings = run_sensor(
            """import type { User } from './models';
import { createUser } from './models';
import { render } from './view';
import { updateUser } from './models';
"""
        )

        self.assertEqual(findings[0]["smell"], "duplicate-import")
        self.assertEqual(
            [issue["details"]["line"] for issue in findings[0]["issues"]],
            [2, 4],
        )
        self.assertEqual(
            [issue["details"]["module"] for issue in findings[0]["issues"]],
            ["./models", "./models"],
        )
        self.assertTrue(
            all(issue["details"]["file"] == str(file) for issue in findings[0]["issues"])
        )

    def test_ignores_distinct_and_dynamic_imports(self) -> None:
        _, findings = run_sensor(
            """import { createUser } from './models';
import { render } from './view';
const models = import('./models');
"""
        )

        self.assertEqual(findings, [])


if __name__ == "__main__":
    unittest.main()
