import json
import subprocess
import tempfile
import unittest
from pathlib import Path


SENSOR = Path(__file__).parents[1] / "sensors" / "max_depth.cjs"
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


class MaxDepthSensorTest(unittest.TestCase):
    def test_reports_control_flow_nested_beyond_four_levels(self) -> None:
        findings = run_sensor(
            """function nested() {
  for (;;) {
    while (ready) {
      if (first) {
        try {
          switch (value) {
            default: break;
          }
        } catch (error) {
          report(error);
        }
      }
    }
  }
}
"""
        )

        self.assertEqual(findings[0]["smell"], "deep-nesting")
        self.assertEqual(findings[0]["issues"][0]["details"]["line"], 6)
        self.assertEqual(findings[0]["issues"][0]["details"]["depth"], 5)

    def test_does_not_add_depth_for_else_if(self) -> None:
        findings = run_sensor(
            """if (first) {
  run();
} else if (second) {
  run();
} else if (third) {
  run();
}
"""
        )

        self.assertEqual(findings, [])

    def test_resets_depth_inside_nested_functions(self) -> None:
        findings = run_sensor(
            """if (first) {
  if (second) {
    if (third) {
      if (fourth) {
        const nested = () => {
          if (one) {
            if (two) {
              if (three) {
                if (four) {
                  run();
                }
              }
            }
          }
        };
      }
    }
  }
}
"""
        )

        self.assertEqual(findings, [])


if __name__ == "__main__":
    unittest.main()
