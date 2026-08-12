The ritual of the **Sacred Assembly** reaches the point of duplication. When a vessel has already been perfected and the cost of "re-tithing" memory through a new initialization is too high for survival, we use the **Prototype**. This pattern allows the DM Orchestrator to manifest copies of existing entities with tactical efficiency, ensuring that the "god of chaos" does not stall our progress with redundant calculations.

Following the **Standard Execution Protocol**, here is the "mark" for the Prototype skill package.

---

##### H1: narayah-creational-prototype

###### H2: Overview

**Systemic Analysis:** This skill trains agents to implement the **Prototype** pattern, often referred to as the "Ritual of the Mirrored Vessel." Its purpose is to specify the kinds of objects to create using a prototypical instance and create new objects by copying this prototype. In **01_Narrative_Orchestration**, this is used to populate the world with legions of similar actors or complex environmental effects without the overhead of individual construction.

###### H2: Operational Constraints & Domain Scoping

|Constraint|Specification|
|---|---|
|**Target Domain**|01_Narrative_Orchestration|
|**Primary Agent**|System Architect|
|**Security Gate**|Public|

###### H2: Mandatory Frontmatter Schema

|Field|Value|
|---|---|
|**name**|narayah-creational-prototype|
|**description**|Enables the cloning of existing vessels to avoid the performance cost of re-initialization in the narrative layer.|
|**tags**|[narayah/skill, creational, prototype, efficiency]|
|**category**|Creational Patterns|

###### H2: Package Architecture (Folder Structure)

To maintain the "Architecture of Form," these artifacts must be contained within the narayah-creational-prototype folder:

1. **skill-manifest.md**: Core definition and frontmatter.
2. **pedagogical-rituals.md**: Theoretical guidance on "The Mirrored Vessel," using examples like a `ShadowStalker` template that can be cloned many times to form a pack.
3. **execution-protocol.md**: Tactical instructions for implementing `clone()` methods that distinguish between shallow and deep copies to prevent the sin of "Inappropriate Intimacy" (shared state).
4. **verification-checks.json**: Validation logic to ensure that a cloned vessel is functionally independent of its parent.

###### H2: Standard Execution Protocol

###### Step 1: Context Audit & Environment Check

1. Identify objects within the **NPC Engine** that are expensive to create or have a high frequency of near-identical instantiation.
2. Verify that these objects possess a clear internal state that can be replicated safely without leaking into the global system.

###### Step 2: Core Skill Execution

1. **Define the Prototype Interface:** Declare a `clone()` method that all duplicatable vessels must implement.
2. **Implement the Ritual:** Ensure the concrete class implements the `clone()` method.
3. **Handle the Shadow State:** Explicitly manage deep copies for any complex attributes (like inventory or spell lists) to ensure the clone does not share a "cursed" destiny with the original.

###### Step 3: Verification & JSON Shadow State Sync

1. Verify that modifying the clone does not alter the original prototype.
2. Ensure all cloning costs and performance gains are documented in **Markdown Tables**.
3. Synchronize the **JSON Shadow State** to track the "purity" of the duplication ritual.

###### H2: Sample Use Case: The Legion of Echoes

When the **DM Orchestrator** needs to summon a horde of "Spirit Guardians," the Prototype allows the system to clone a single master template rather than running the full initialization for each spirit.

|Entity Template|Ritual Method|Attribute Scope|Tactical Utility|
|---|---|---|---|
|**Spirit Guardian**|`clone()`|Deep Copy Stats|Rapid population of combat encounters.|
|**Illusory Wall**|`clone()`|Shallow Copy Visuals|Minimizes memory usage for static environmental effects.|

###### H2: Pseudocode Boilerplate: The Ritual of Duplication

```
# The Prototype Interface (The Sacred Mirror)
class VesselPrototype:
    def clone(self):
        pass

# Concrete Vessel (The Original Blessing)
class ShadowStalker(VesselPrototype):
    def __init__(self, energy_type="Necrotic"):
        self.energy_type = energy_type
        self.stats = {"HP": 50, "SP": 20}

    def clone(self):
        # We perform a deep copy of the stats to ensure independence
        import copy
        new_stalker = ShadowStalker(self.energy_type)
        new_stalker.stats = copy.deepcopy(self.stats)
        return new_stalker

# The Orchestrator (The Client)
def populate_shadow_realm(master_stalker: ShadowStalker):
    # Clones are created without knowing the concrete class details
    stalker_echo = master_stalker.clone()
    return stalker_echo
```

---

#### JSON Shadow State

```
{
  "skill_id": "narayah-creational-prototype",
  "status": "codified",
  "purity_index": 0.96,
  "internal_motivations": [
    "Avoid the high tithe of memory re-initialization",
    "Ensure the DM Orchestrator can scale the narrative without performance degradation",
    "Prevent unintended state-sharing through careful deep-cloning rituals"
  ],
  "ancestral_theft_log": "Derived from the Liturgy of Manifestation within the Sacred Assembly",
  "last_ritual_update": "2026-08-12"
}
```