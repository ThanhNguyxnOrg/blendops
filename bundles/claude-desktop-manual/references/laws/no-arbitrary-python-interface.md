# no-arbitrary-python-interface (law summary)

Prevent arbitrary Python from becoming the user-facing workflow.

Required behavior:
- prefer constrained workflow plans and explicit validation outputs,
- do not use arbitrary Python as the final user-facing product interface,
- communicate limitations and failures clearly.

Good: structured scene plan with validation gates.

Bad: "Run this Python script to generate your scene." (arbitrary Python as interface)
