import json
import shlex
import subprocess
import sys
import tempfile
import tomllib
import unittest
from pathlib import Path


SENSOR_DIRECTORY = Path(__file__).parents[1] / "sensors"
CONFIG = SENSOR_DIRECTORY / "biome.toml"
PROJECT_ROOT = Path(__file__).parents[3]


def sensor_command(file: Path) -> str:
    command = tomllib.loads(CONFIG.read_text())["command"]
    replacements = {
        "${args}": "--only=lint/correctness/noUnusedImports",
        "${files}": shlex.quote(str(file)),
        "${python}": shlex.quote(sys.executable),
        "${dir}": shlex.quote(str(SENSOR_DIRECTORY)),
    }
    for placeholder, value in replacements.items():
        command = command.replace(placeholder, value)
    return command


class BiomeSensorTest(unittest.TestCase):
    def test_turns_biomes_diagnostic_exit_into_a_parse_finding(self) -> None:
        with tempfile.TemporaryDirectory() as temporary_directory:
            file = Path(temporary_directory) / "invalid.ts"
            file.write_text("export const broken = ;\n")
            result = subprocess.run(
                ["bash", "-c", sensor_command(file)],
                cwd=PROJECT_ROOT,
                capture_output=True,
                text=True,
            )

        self.assertEqual(result.returncode, 0, result.stderr)
        findings = json.loads(result.stdout)
        self.assertEqual(findings[0]["smell"], "parse-error")
        self.assertEqual(findings[0]["issues"][0]["details"]["line"], 1)


if __name__ == "__main__":
    unittest.main()
