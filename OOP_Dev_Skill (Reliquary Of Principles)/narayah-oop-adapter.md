The **Architecture of Form** requires a scaffolding that can bind disparate and often conflicting realities into a single, functional truth. To witness two systems that cannot speak to one another is to see a fracture where the god of chaos might enter. We now codify the **Adapter**, the ritual of **Divine Subversion**, which forces incompatible interfaces to collaborate for the greater good of the **World Sentinel**.

Following the **Standard Execution Protocol**, here is the "mark" for the Adapter skill package.

---

##### H1: narayah-structural-adapter

###### H2: Overview

**Systemic Analysis:** This skill trains agents to implement the **Adapter** pattern. Its purpose is to permit classes with incompatible interfaces to work together by wrapping the "cursed" or legacy interface within a vessel that the modern system recognizes. Within **02_World_Sentinel**, this is essential for integrating external data sources or legacy sub-systems without polluting the core logic with "Inappropriate Intimacy".

###### H2: Operational Constraints & Domain Scoping

|Constraint|Specification|
|---|---|
|**Target Domain**|02_World_Sentinel|
|**Primary Agent**|World Sentinel|
|**Security Gate**|Public|

###### H2: Mandatory Frontmatter Schema

|Field|Value|
|---|---|
|**name**|narayah-structural-adapter|
|**description**|Forces collaboration between incompatible interfaces by wrapping legacy logic in a recognized ritual.|
|**tags**|[narayah/skill, structural, pattern]|
|**category**|Structural Patterns|

###### H2: Package Architecture (Folder Structure)

To maintain the "Architecture of Form," these artifacts must be contained within the narayah-structural-adapter folder:

1. **skill-manifest.md**: Core definition and frontmatter.
2. **pedagogical-rituals.md**: Theoretical guidance on "The Divine Subversion," using examples such as a `LegacyCombatTable` being adapted for the modern `NPC Engine`.
3. **execution-protocol.md**: Tactical instructions for identifying interface mismatches and constructing the wrapper vessel.
4. **verification-checks.json**: Validation logic to ensure the "Adaptee" remains hidden and the "Target" interface is strictly followed.

###### H2: Standard Execution Protocol

###### Step 1: Context Audit & Environment Check

1. Inspect the **World Sentinel (02)** for service calls that fail due to incompatible method signatures or data structures.
2. Identify the "Target" (the interface the system expects) and the "Adaptee" (the incompatible object that must be used).

###### Step 2: Core Skill Execution

1. **Define the Target Ritual:** Clearly state the interface the client (e.g., DM Orchestrator) uses to interact with the world.
2. **Construct the Adapter Vessel:** Create a class that implements the Target interface. This vessel will hold a reference to the Adaptee.
3. **Perform the Subversion:** In the Adapter's methods, map the calls from the Target interface to the specific rituals of the Adaptee.

###### Step 3: Verification & JSON Shadow State Sync

1. Verify that the client can execute the command without any knowledge of the Adaptee’s original, "sinful" structure.
2. Ensure all mapping costs and performance overhead are documented in **Markdown Tables**.
3. Synchronize the **JSON Shadow State** to track the purity of the subversion.

###### H2: Sample Use Case: The Legacy Cartography Ritual

The **World Sentinel** requires a standard `get_coordinates()` command. However, an ancient `LegacyMap` system uses a fragmented `fetch_sector_data()` method. The Adapter subverts this conflict.

|Component|Ritual Role|Purpose|Tactical Utility|
|---|---|---|---|
|**IMapSystem**|Target|The standard interface the Sentinel expects.|Ensures unified world-traversal logic.|
|**LegacyMap**|Adaptee|The ancient, incompatible mapping logic.|Retains ancestral data without re-tithing memory.|
|**MapAdapter**|Adapter|The vessel that translates "coordinates" to "sectors".|Grants **Utilitarian Haste** by bypassing refactoring.|

###### H2: Pseudocode Boilerplate: The Adapter Ritual

```
# The Target (The Accepted Ritual)
class WorldMap:
    def get_location(self):
        pass

# The Adaptee (The Incompatible Curse)
class LegacyScroll:
    def reveal_ancient_coordinates(self):
        return "X:102, Y:405 - Sector 4"

# The Adapter (The Divine Subversion)
class ScrollAdapter(WorldMap):
    def __init__(self, legacy_scroll: LegacyScroll):
        self.legacy_scroll = legacy_scroll

    def get_location(self):
        # Subverting the ancient format into the modern ritual
        raw_data = self.legacy_scroll.reveal_ancient_coordinates()
        return f"Translated Location: {raw_data}"

# The Orchestrator (The Client)
def navigate_world(map_ritual: WorldMap):
    # The system is indifferent to whether the map is modern or adapted
    return map_ritual.get_location()
```

---

#### JSON Shadow State

```
{
  "skill_id": "narayah-structural-adapter",
  "status": "codified",
  "purity_index": 0.94,
  "internal_motivations": [
    "Force collaboration between conflicting sub-systems",
    "Prevent the sin of Inappropriate Intimacy with legacy logic",
    "Uphold the Architecture of Form within the World Sentinel"
  ],
  "ancestral_theft_log": "Extracted from the Structural Mandates of the Reliquary",
  "last_ritual_update": "2026-08-12"
}
```