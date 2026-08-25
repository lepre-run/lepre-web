import importlib.util
import unittest
from pathlib import Path
from types import ModuleType


def load_adapter() -> ModuleType:
    adapter_path = Path(__file__).parents[1] / "sensors" / "biome_adapter.py"
    spec = importlib.util.spec_from_file_location("biome_adapter", adapter_path)
    if spec is None or spec.loader is None:
        raise RuntimeError("Unable to load the Biome adapter")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class BiomeAdapterTest(unittest.TestCase):
    def setUp(self) -> None:
        self.adapter = load_adapter()

    def test_maps_cognitive_complexity_to_a_habit_hooks_finding(self) -> None:
        report = {
            "diagnostics": [
                {
                    "code": {
                        "value": "lint/complexity/noExcessiveCognitiveComplexity"
                    },
                    "location": {
                        "path": "src/domain/order.ts",
                        "range": {"start": {"line": 5, "column": 9}},
                    },
                    "message": "Excessive complexity of 18 detected.",
                }
            ]
        }

        self.assertEqual(
            self.adapter.adapt_report(report),
            [
                {
                    "smell": "high-complexity",
                    "details": {},
                    "issues": [
                        {
                            "key": "src/domain/order.ts",
                            "details": {
                                "file": "src/domain/order.ts",
                                "line": 5,
                                "column": 9,
                                "message": "Excessive complexity of 18 detected.",
                                "source": "biome:lint/complexity/noExcessiveCognitiveComplexity",
                            },
                        }
                    ],
                }
            ],
        )

    def test_maps_nested_test_suites_to_a_habit_hooks_finding(self) -> None:
        report = {
            "diagnostics": [
                {
                    "code": {
                        "value": "lint/complexity/noExcessiveNestedTestSuites"
                    },
                    "location": {
                        "path": "src/domain/order.test.ts",
                        "range": {"start": {"line": 13, "column": 5}},
                    },
                    "message": "Excessive describe() nesting detected.",
                }
            ]
        }

        self.assertEqual(
            self.adapter.adapt_report(report),
            [
                {
                    "smell": "deep-nesting",
                    "details": {},
                    "issues": [
                        {
                            "key": "src/domain/order.test.ts",
                            "details": {
                                "file": "src/domain/order.test.ts",
                                "line": 13,
                                "column": 5,
                                "message": "Excessive describe() nesting detected.",
                                "source": "biome:lint/complexity/noExcessiveNestedTestSuites",
                            },
                        }
                    ],
                }
            ],
        )

    def test_maps_size_rules_to_habit_hooks_findings(self) -> None:
        mappings = {
            "lint/complexity/noExcessiveLinesPerFunction": "oversized-function",
            "lint/style/noExcessiveLinesPerFile": "oversized-file",
        }

        for code, smell in mappings.items():
            with self.subTest(code=code):
                report = {
                    "diagnostics": [
                        {
                            "code": {"value": code},
                            "location": {
                                "path": "src/presentation/App.tsx",
                                "range": {"start": {"line": 0, "column": 0}},
                            },
                            "message": "Size limit exceeded.",
                        }
                    ]
                }

                findings = self.adapter.adapt_report(report)

                self.assertEqual(findings[0]["smell"], smell)
                self.assertEqual(findings[0]["issues"][0]["details"]["source"], f"biome:{code}")

    def test_maps_parameter_limit_to_a_habit_hooks_finding(self) -> None:
        code = "lint/complexity/useMaxParams"
        report = {
            "diagnostics": [
                {
                    "code": {"value": code},
                    "location": {
                        "path": "src/domain/order.ts",
                        "range": {"start": {"line": 7, "column": 2}},
                    },
                    "message": "This function has too many parameters (4).",
                }
            ]
        }

        findings = self.adapter.adapt_report(report)

        self.assertEqual(findings[0]["smell"], "too-many-parameters")
        self.assertEqual(findings[0]["issues"][0]["details"]["source"], f"biome:{code}")

    def test_maps_unused_import_to_a_habit_hooks_finding(self) -> None:
        code = "lint/correctness/noUnusedImports"
        report = {
            "diagnostics": [
                {
                    "code": {"value": code},
                    "location": {
                        "path": "src/domain/order.ts",
                        "range": {"start": {"line": 0, "column": 9}},
                    },
                    "message": "This import is unused.",
                }
            ]
        }

        findings = self.adapter.adapt_report(report)

        self.assertEqual(findings[0]["smell"], "unused-import")
        self.assertEqual(findings[0]["issues"][0]["details"]["source"], f"biome:{code}")

    def test_maps_unused_variable_to_a_habit_hooks_finding(self) -> None:
        code = "lint/correctness/noUnusedVariables"
        report = {
            "diagnostics": [
                {
                    "code": {"value": code},
                    "location": {
                        "path": "src/domain/order.ts",
                        "range": {"start": {"line": 11, "column": 6}},
                    },
                    "message": "This variable is unused.",
                }
            ]
        }

        findings = self.adapter.adapt_report(report)

        self.assertEqual(findings[0]["smell"], "unused-variable")
        self.assertEqual(findings[0]["issues"][0]["details"]["source"], f"biome:{code}")

    def test_maps_const_preference_to_a_habit_hooks_finding(self) -> None:
        code = "lint/style/useConst"
        report = {
            "diagnostics": [
                {
                    "code": {"value": code},
                    "location": {
                        "path": "src/domain/order.ts",
                        "range": {"start": {"line": 11, "column": 4}},
                    },
                    "message": "This let declares a variable that is never reassigned.",
                }
            ]
        }

        findings = self.adapter.adapt_report(report)

        self.assertEqual(findings[0]["smell"], "non-const-binding")
        self.assertEqual(findings[0]["issues"][0]["details"]["source"], f"biome:{code}")

    def test_maps_var_declaration_to_a_habit_hooks_finding(self) -> None:
        code = "lint/suspicious/noVar"
        report = {
            "diagnostics": [
                {
                    "code": {"value": code},
                    "location": {
                        "path": "src/domain/order.ts",
                        "range": {"start": {"line": 11, "column": 4}},
                    },
                    "message": "Use let or const instead of var.",
                }
            ]
        }

        findings = self.adapter.adapt_report(report)

        self.assertEqual(findings[0]["smell"], "var-declaration")
        self.assertEqual(findings[0]["issues"][0]["details"]["source"], f"biome:{code}")

    def test_maps_explicit_any_to_a_habit_hooks_finding(self) -> None:
        code = "lint/suspicious/noExplicitAny"
        report = {
            "diagnostics": [
                {
                    "code": {"value": code},
                    "location": {
                        "path": "src/domain/order.ts",
                        "range": {"start": {"line": 11, "column": 18}},
                    },
                    "message": "Unexpected any. Specify a different type.",
                }
            ]
        }

        findings = self.adapter.adapt_report(report)

        self.assertEqual(findings[0]["smell"], "explicit-any")
        self.assertEqual(findings[0]["issues"][0]["details"]["source"], f"biome:{code}")

    def test_maps_loose_equality_to_a_habit_hooks_finding(self) -> None:
        code = "lint/suspicious/noDoubleEquals"
        report = {
            "diagnostics": [
                {
                    "code": {"value": code},
                    "location": {
                        "path": "src/domain/order.ts",
                        "range": {"start": {"line": 11, "column": 12}},
                    },
                    "message": "Use === instead of ==.",
                }
            ]
        }

        findings = self.adapter.adapt_report(report)

        self.assertEqual(findings[0]["smell"], "loose-equality")
        self.assertEqual(findings[0]["issues"][0]["details"]["source"], f"biome:{code}")

    def test_maps_non_null_assertion_to_a_habit_hooks_finding(self) -> None:
        code = "lint/style/noNonNullAssertion"
        report = {
            "diagnostics": [
                {
                    "code": {"value": code},
                    "location": {
                        "path": "src/domain/order.ts",
                        "range": {"start": {"line": 11, "column": 20}},
                    },
                    "message": "Forbidden non-null assertion.",
                }
            ]
        }

        findings = self.adapter.adapt_report(report)

        self.assertEqual(findings[0]["smell"], "non-null-assertion")
        self.assertEqual(findings[0]["issues"][0]["details"]["source"], f"biome:{code}")

    def test_maps_inferrable_type_to_a_habit_hooks_finding(self) -> None:
        code = "lint/style/noInferrableTypes"
        report = {
            "diagnostics": [
                {
                    "code": {"value": code},
                    "location": {
                        "path": "src/domain/order.ts",
                        "range": {"start": {"line": 11, "column": 14}},
                    },
                    "message": "This type annotation is trivially inferred.",
                }
            ]
        }

        findings = self.adapter.adapt_report(report)

        self.assertEqual(findings[0]["smell"], "redundant-type-annotation")
        self.assertEqual(findings[0]["issues"][0]["details"]["source"], f"biome:{code}")

    def test_maps_parse_error_and_preserves_one_based_position(self) -> None:
        report = {
            "diagnostics": [
                {
                    "code": {"value": "parse"},
                    "location": {
                        "path": "src/domain/order.ts",
                        "range": {"start": {"line": 2, "column": 23}},
                    },
                    "message": "Expected an expression.",
                }
            ]
        }

        findings = self.adapter.adapt_report(report)

        self.assertEqual(findings[0]["smell"], "parse-error")
        self.assertEqual(findings[0]["issues"][0]["details"]["line"], 2)
        self.assertEqual(findings[0]["issues"][0]["details"]["column"], 23)
        self.assertEqual(
            findings[0]["issues"][0]["details"]["source"], "biome:parse"
        )

    def test_groups_issues_and_ignores_unmapped_diagnostics(self) -> None:
        diagnostic = {
            "code": {"value": "lint/complexity/noExcessiveCognitiveComplexity"},
            "location": {
                "path": "src/domain/order.ts",
                "range": {"start": {"line": 0, "column": 0}},
            },
            "message": "Complex function.",
        }
        report = {
            "diagnostics": [
                diagnostic,
                diagnostic,
                {
                    "code": {"value": "lint/style/noDefaultExport"},
                    "location": {
                        "path": "src/domain/order.ts",
                        "range": {"start": {"line": 0, "column": 0}},
                    },
                    "message": "Avoid default exports.",
                },
            ]
        }

        findings = self.adapter.adapt_report(report)

        self.assertEqual(len(findings), 1)
        self.assertEqual(len(findings[0]["issues"]), 2)

    def test_rejects_a_malformed_report(self) -> None:
        with self.assertRaisesRegex(ValueError, "diagnostics array"):
            self.adapter.adapt_report({})

    def test_rejects_a_mapped_diagnostic_without_a_position(self) -> None:
        report = {
            "diagnostics": [
                {
                    "code": {
                        "value": "lint/complexity/noExcessiveCognitiveComplexity"
                    },
                    "location": {"path": "src/domain/order.ts"},
                    "message": "Complex function.",
                }
            ]
        }

        with self.assertRaisesRegex(ValueError, "start position"):
            self.adapter.adapt_report(report)


if __name__ == "__main__":
    unittest.main()
