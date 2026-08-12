The most effective tools are those that provide a simple interface for a complex reality. This is **The Divine Veil**—the ritual of **Abstraction**. By hiding the "messy" implementation details, we allow the user to focus on the tactical outcome, much like how one needs only the prayer to trigger a _Guiding Bolt_ without understanding the celestial mechanics behind it.

Following the **Standard Execution Protocol**, here is the "mark" for the abstraction skill package, structured for your library.

---

### H1: narayah-oop-abstraction

#### H2: Overview

**Systemic Analysis:** This skill trains agents to implement **Abstraction**, creating a "Divine Veil" that separates _what_ an object does from _how_ it does it. It focuses on defining clear interfaces and abstract classes, ensuring the system remains swappable and resistant to the rot of technical debt. By masking complexity, it provides a simple "ritual" (interface) for a complex reality (implementation).

#### H2: Operational Constraints & Domain Scoping

|Constraint|Specification|
|---|---|
|**Target Domain**|03_Entity_Actors \|
|**Primary Agent**|System Architect \|
|**Security Gate**|Public|

#### H2: Mandatory Frontmatter Schema

|Field|Value|
|---|---|
|**name**|narayah-oop-abstraction|
|**description**|Enforces the use of abstract interfaces to decouple system logic from specific implementation details.|
|**tags**|[narayah/skill, oop, abstraction, architecture]|
|**category**|Governance & Standardization|

#### H2: Package Architecture (Folder Structure)

The following artifacts must be contained within the `narayah-oop-abstraction` folder to maintain containment and systemic sanctity:

1. **`skill-manifest.md`**: Core definition and frontmatter.
2. **`pedagogical-rituals.md`**: Theoretical guidance on "The Divine Veil," using examples such as a `DatabaseConnector` interface where the LLM only needs `save()` and `load()` commands, regardless of the storage medium.
3. **`execution-protocol.md`**: Tactical instructions for identifying "messy" logic and refactoring it behind an abstract interface.
4. **`verification-checks.json`**: Validation logic to ensure implementation details do not "leak" into the higher-level logic.

#### H2: Standard Execution Protocol

##### Step 1: Context Audit & Environment Check

1. Inspect the target directory for high-level logic that is overly dependent on specific low-level details.
2. Confirm that the **CONTAINMENT_ROOT** is respected to prevent logic from bleeding into the mundane layers of the system.

##### Step 2: Core Skill Execution

1. **Apply the Divine Veil:** Identify the core "ritual" required by the system (e.g., `process_payment()` or `log_event()`).
2. **Define the Interface:** Create an abstract class or interface that contains only these essential commands.
3. **Hide the Mundane:** Ensure all complex implementation logic is contained within concrete classes that are hidden from the primary orchestrator.

##### Step 3: Verification & JSON Shadow State Sync

1. Verify that the system can swap underlying implementations (e.g., moving from a `FileStore` to a `CloudStore`) without altering the primary logic.
2. Append the **JSON Shadow State** to track the "purity" of the abstraction layer.

---

```
{
  "skill_status": "template_defined",
  "focus": "Abstraction",
  "ritual_type": "The_Divine_Veil",
  "utilitarian_value": "High",
  "shadow_state_sync": "pending_generation"
}
```

