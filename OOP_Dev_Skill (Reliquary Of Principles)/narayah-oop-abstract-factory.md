The assembly of the **Sacred Assembly** continues. To produce families of related objects without exposing their concrete essence is the ritual of the **Abstract Factory**. This "Liturgy of Unified Creation" ensures that the DM Orchestrator remains agnostic of the specific vessels it summons, maintaining the isolation required for **Utilitarian Haste**.

Following the **Standard Execution Protocol**, here is the "mark" for the Abstract Factory skill package.

---

##### H1: narayah-creational-abstract-factory

###### H2: Overview

**Systemic Analysis:** This skill trains agents to implement the **Abstract Factory** pattern. While the Factory Method handles the manifestation of a single product, the Abstract Factory produces **families of related objects**. In the context of **01_Narrative_Orchestration**, this prevents the "sin of exposure," ensuring that the system can swap entire thematic or mechanical suites (e.g., changing a "Forest Biome" to an "Undead Blight") without altering the orchestrator's logic.

###### H2: Operational Constraints & Domain Scoping

|Constraint|Specification|
|---|---|
|**Target Domain**|01_Narrative_Orchestration|
|**Primary Agent**|System Architect|
|**Security Gate**|Public|

###### H2: Mandatory Frontmatter Schema

|Field|Value|
|---|---|
|**name**|narayah-creational-abstract-factory|
|**description**|Orchestrates the creation of related object families, shielding the system from concrete implementations.|
|**tags**|[narayah/skill, creational, pattern]|
|**category**|Creational Patterns|

###### H2: Package Architecture (Folder Structure)

To maintain the "Architecture of Form," these artifacts must be contained within the narayah-creational-abstract-factory folder:

1. **skill-manifest.md**: Core definition and frontmatter.
2. **pedagogical-rituals.md**: Theoretical guidance on "The Liturgy of Unified Creation," using examples such as a `BiomeFactory` that manifests matching Actors, Hazards, and Loot.
3. **execution-protocol.md**: Tactical instructions for grouping related factory methods into a single unified interface.
4. **verification-checks.json**: Validation logic to ensure no "illegal state transitions" occur by mixing objects from different families.

###### H2: Standard Execution Protocol

###### Step 1: Context Audit & Environment Check

1. Inspect the target domain (01) for clusters of related objects that are instantiated together (e.g., Orc Warriors always appearing with Orc Shaman and Orc Loot).
2. Identify the "product families" that need to be abstracted.

###### Step 2: Core Skill Execution

1. **Define Abstract Products:** Create interfaces for each distinct type of product in the family (e.g., `IActor`, `IHazard`).
2. **Define the Abstract Factory:** Create a primary interface that declares a set of creation methods for each abstract product.
3. **Implement Concrete Factories:** Create specialized factories (e.g., `ShadowfellFactory`, `CelestialFactory`) that implement these methods to return specific, themed concrete products.

###### Step 3: Verification & JSON Shadow State Sync

1. Verify the DM Orchestrator can call the factory methods without knowing which theme is currently active.
2. Ensure all mechanical variations are documented in **Markdown Tables**.
3. Synchronize the **JSON Shadow State** to track system "purity".

###### H2: Sample Use Case: The Biome Manifestation Ritual

When the **World Sentinel** shifts the environment, the DM Orchestrator must manifest a consistent set of entities that share a common theme.

|Biome Theme|Factory Class|Concrete Actor|Concrete Hazard|
|---|---|---|---|
|**Undead Blight**|`NecroticFactory`|`Skeleton`|`Desecrated Ground`|
|**Verdant Wilds**|`SylvanFactory`|`Dryad`|`Entangling Roots`|

###### H2: Pseudocode Boilerplate: The Abstract Assembly

```
# Abstract Products (The Vague Intent)
class Actor:
    def spawn(self): pass

class Hazard:
    def trigger(self): pass

# The Abstract Factory (The Unified Ritual)
class BiomeFactory:
    def create_actor(self) -> Actor: pass
    def create_hazard(self) -> Hazard: pass

# Concrete Factory: Shadowfell (The Dark Blessing)
class ShadowfellFactory(BiomeFactory):
    def create_actor(self):
        return Wraith()
    def create_hazard(self):
        return LifeDrainFog()

# Concrete Factory: Feywild (The Wild Blessing)
class FeywildFactory(BiomeFactory):
    def create_actor(self):
        return Satyr()
    def create_hazard(self):
        return PrimalGrowth()

# The Orchestrator (The Client)
def populate_zone(factory: BiomeFactory):
    actor = factory.create_actor()
    hazard = factory.create_hazard()
    # The system is indifferent to whether it is Fey or Shadow
    actor.spawn()
    hazard.trigger()
```

---

#### JSON Shadow State

```
{
  "skill_id": "narayah-creational-abstract-factory",
  "status": "codified",
  "purity_index": 1.0,
  "internal_motivations": [
    "Prevent thematic mixing of objects",
    "Uphold the mandate to produce families of related objects",
    "Ensure the DM Orchestrator is never uninitiated in the concrete class"
  ],
  "ancestral_theft_log": "Refined from the Sacred Assembly Pattern Mandates",
  "last_ritual_update": "2026-08-12"
}
```