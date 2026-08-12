To issue a single command and witness a multitude of responses is the height of tactical efficiency. This is "Many Mouths, One Prayer"—the ritual of **Polymorphism**. It allows the system to remain flexible, ensuring that whether a machine calls upon a simple cantrip or a complex divine blessing, the execution remains seamless and the intent unified.

Following the **Standard Execution Protocol**, here is the "mark" for the polymorphism skill package.

---

### H1: narayah-oop-polymorphism

#### H2: Overview

**Systemic Analysis:** This skill trains agents to implement **Polymorphism**, allowing different classes to be treated as instances of the same parent class through a uniform interface. This ensures that the system can execute the same "ritual" (method) across diverse entities, with each fulfilling the command according to its unique nature. This "Many Mouths, One Prayer" approach minimizes complex branching logic and optimizes the **NPC Engine** for varied combat and narrative scenarios.

#### H2: Operational Constraints & Domain Scoping

|Constraint|Specification|
|---|---|
|**Target Domain**|03_Entity_Actors \|
|**Primary Agent**|System Architect \|
|**Security Gate**|Public|

#### H2: Mandatory Frontmatter Schema

|Field|Value|
|---|---|
|**name**|narayah-oop-polymorphism|
|**description**|Implements uniform interfaces for diverse object types to streamline execution and reduce logic redundancy.|
|**tags**|[narayah/skill, oop, polymorphism, flexibility]|
|**category**|Governance & Standardization|

#### H2: Package Architecture (Folder Structure)

The following artifacts must be contained within the `narayah-oop-polymorphism` folder to maintain containment:

1. **`skill-manifest.md`**: Core definition and frontmatter.
2. **`pedagogical-rituals.md`**: Theoretical guidance on "Many Mouths, One Prayer," using examples such as a list of `CombatAction` objects where each `.execute()` triggers a different effect (e.g., `MindSliver` vs. `TollTheDead`).
3. **`execution-protocol.md`**: Tactical instructions for replacing "if/else" or "switch" chains with polymorphic method overrides.
4. **`verification-checks.json`**: Logic to verify that objects correctly implement the shared interface without "state leakage".

#### H2: Standard Execution Protocol

##### Step 1: Context Audit & Environment Check

1. Inspect the directory for repetitive conditional logic (e.g., "if entity is A, do X; if B, do Y").
2. Identify opportunities to "mark the target" by standardizing the command interface.

##### Step 2: Core Skill Execution

1. **Define the Shared Ritual:** Create an interface or abstract base class with a common method (e.g., `perform_action()`).
2. **Implement Diverse Responses:** Ensure each derived class provides its own unique implementation of the ritual.
3. **Mechanical Standardization:** Ensure all damage types, saving throws, and effects are cataloged in **Markdown Tables** within the generated code comments.

##### Step 3: Verification & JSON Shadow State Sync

1. Test the system's ability to process a list of different objects through a single loop without specialized checks.
2. Append the **JSON Shadow State** to track the "divine subversion" of rigid logic into flexible interfaces.

---

```
{
  "skill_status": "template_defined",
  "focus": "Polymorphism",
  "ritual_type": "Many_Mouths_One_Prayer",
  "utilitarian_value": "Maximum",
  "shadow_state_sync": "pending_generation"
}
```

This template provides the necessary tactical precision for your future models to handle complexity with the calm, measured distance of a true professional.