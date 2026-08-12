The final ritual of the **Sacred Assembly** is the most restrictive, yet the most vital for systemic stability. To permit more than one heart to beat within a critical system is to invite the god of chaos to tear the narrative asunder. We now codify the **Singleton**, ensuring there is but one point of truth, one global access point, and no redundant tithes of memory for the most sacred of our structures.

Following the **Standard Execution Protocol**, here is the "mark" for the Singleton skill package.

---

##### H1: narayah-creational-singleton

###### H2: Overview

**Systemic Analysis:** This skill trains agents to implement the **Singleton** pattern, enforcing a "Single Point of Truth" within the system. Its purpose is to ensure that a class has only one instance while providing a global point of access to it. In **01_Narrative_Orchestration**, this prevents the "sin of fragmentation," ensuring that global states like the **Narrative Clock** or the **World Sentinel's** core registry remain unified and singular.

###### H2: Operational Constraints & Domain Scoping

|Constraint|Specification|
|---|---|
|**Target Domain**|01_Narrative_Orchestration|
|**Primary Agent**|System Architect|
|**Security Gate**|Public|

###### H2: Mandatory Frontmatter Schema

|Field|Value|
|---|---|
|**name**|narayah-creational-singleton|
|**description**|Enforces a single instance of a class with a global access point to maintain state integrity.|
|**tags**|[narayah/skill, creational, singleton, integrity]|
|**category**|Creational Patterns|

###### H2: Package Architecture (Folder Structure)

To maintain the "Architecture of Form," these artifacts must be contained within the narayah-creational-singleton folder:

1. **skill-manifest.md**: Core definition and frontmatter.
2. **pedagogical-rituals.md**: Theoretical guidance on "The Unique Vessel," using examples such as a `NarrativeClock` where multiple instances would result in divergent timelines.
3. **execution-protocol.md**: Tactical instructions for hiding the constructor and implementing a static `getInstance()` method.
4. **verification-checks.json**: Validation logic to ensure that no secondary instances can be manifested through "Divine Subversion" or unintended logic paths.

###### H2: Standard Execution Protocol

###### Step 1: Context Audit & Environment Check

1. Inspect the target domain (01) for global managers or state holders that are currently instantiated multiple times.
2. Identify if the object truly requires a single instance or if it is merely a victim of "Technical Debt".

###### Step 2: Core Skill Execution

1. **Seal the Constructor:** Make the class constructor private to prevent direct instantiation from the public domain.
2. **Establish the Static Vessel:** Create a private static variable to hold the unique instance of the class.
3. **Implement the Access Ritual:** Define a public static method (e.g., `get_instance()`) that returns the existing instance or creates it if it does not yet exist.

###### Step 3: Verification & JSON Shadow State Sync

1. Verify that two separate calls for the instance return the exact same memory address.
2. Ensure all mechanical impacts on system performance are documented in **Markdown Tables**.
3. Synchronize the **JSON Shadow State** to track the "purity" of the singular instance.

###### H2: Sample Use Case: The Narrative Clock

When the **DM Orchestrator** tracks the passing of time, it must use a Singleton `NarrativeClock`. If multiple clocks existed, the world’s history would become a "cursed" sequence of conflicting events.

|Global System|Ritual Method|Purpose|Tactical Utility|
|---|---|---|---|
|**Narrative Clock**|`get_instance()`|Synchronizes all temporal events.|Prevents temporal paradoxes in the NPC Engine.|
|**World Registry**|`get_instance()`|Tracks all active entity IDs.|Eliminates the risk of ID collisions for actors.|

###### H2: Pseudocode Boilerplate: The Unique Vessel

```
# The Singleton Ritual (The One True Vessel)
class NarrativeClock:
    _instance = None

    def __new__(cls):
        # The constructor is gated; if the vessel exists, it is returned
        if cls._instance is None:
            cls._instance = super(NarrativeClock, cls).__new__(cls)
            cls._instance.time = 0
            cls._instance.is_initialized = True
        return cls._instance

    def advance_time(self, tithing_units):
        self.time += tithing_units
        return f"The clock advances. Current time: {self.time}"

# The Orchestrator (The Client)
def synchronize_world():
    # Both actors access the same point of truth
    clock_a = NarrativeClock()
    clock_b = NarrativeClock()

    # Verification: clock_a is clock_b
    return clock_a.advance_time(1)
```

---

#### JSON Shadow State

```
{
  "skill_id": "narayah-creational-singleton",
  "status": "codified",
  "purity_index": 1.0,
  "internal_motivations": [
    "Abolish the chaos of multiple global states",
    "Ensure the DM Orchestrator has one, and only one, source of narrative truth",
    "Frustrate the god of discord by enforcing absolute structural unity"
  ],
  "ancestral_theft_log": "Codified from the Mandates of the Sacred Assembly",
  "last_ritual_update": "2026-08-12"
}
```