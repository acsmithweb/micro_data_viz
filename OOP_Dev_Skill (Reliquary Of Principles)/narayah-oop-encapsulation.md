Following the **Standard Execution Protocol**, here is the general outline for the `narayah-oop-encapsulation` skill package. This outline provides the "mark" for a future machine to populate with specific logic and files.

---

### H1: narayah-oop-encapsulation

#### H2: Overview

**Systemic Analysis:** This skill trains agents to implement **Encapsulation**, ensuring that an object’s internal data (the "reliquary") is protected from external interference. It focuses on the ritual of restricting direct access to components and providing controlled interfaces (getters/setters) to maintain the sanctity of the system's state [Conversation History].

#### H2: Operational Constraints & Domain Scoping

|Constraint|Specification|
|---|---|
|**Target Domain**|03_Entity_Actors|
|**Primary Agent**|System Architect|
|**Security Gate**|Public|

#### H2: Mandatory Frontmatter Schema

|Field|Value|
|---|---|
|**name**|narayah-oop-encapsulation|
|**description**|Enforces data hiding and state protection via private attributes and public interfaces.|
|**tags**|[narayah/skill, oop, encapsulation, governance]|
|**category**|Governance & Standardization|

#### H2: Package Architecture (Folder Structure)

To maintain containment, the following files will be generated within the single skill folder:

1. **`skill-manifest.md`**: The core definition and frontmatter.
2. **`pedagogical-rituals.md`**: The theory of the "Sealed Reliquary," including practical examples like a `BankAccount` with private balances [Conversation History].
3. **`execution-protocol.md`**: Step-by-step instructions for the LLM to audit code for "state leakage" and refactor it into encapsulated structures.
4. **`verification-checks.json`**: A shadow state template to ensure the LLM's output conforms to Project Narayah standards.

#### H2: Standard Execution Protocol

##### Step 1: Context Audit & Environment Check

1. Inspect the target codebase for public variables that should be private.
2. Confirm that the **CONTAINMENT_ROOT** is respected to prevent spreading logic outside the designated folder.

##### Step 2: Core Skill Execution

1. Apply "The Sealed Reliquary" workflow: identify state variables, convert to private/protected, and generate access rituals (methods) [7, Conversation History].
2. Maintain strict **Markdown hierarchy** (H1, H2, H3) in all generated documentation.

##### Step 3: Verification & JSON Shadow State Sync

1. Ensure all mechanical attributes of the new code are placed in **Markdown Tables**.
2. Append the **JSON Shadow State** to track the "sanctity" of the encapsulated object.

---

This outline is the "target" for the next phase of development. Once you provide this to a future instance, it will have the necessary boundaries to build out the full contents of the `narayah-oop-encapsulation` folder without deviating from the path.

Is this structure sufficient for your library, or shall we refine the **Operational Constraints** further before the ritual begins?