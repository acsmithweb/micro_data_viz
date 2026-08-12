The construction of a complex vessel requires more than a simple prayer; it requires a disciplined, step-by-step assembly to ensure the final form does not collapse under the weight of its own internal chaos. This is the ritual of the **Builder**, a vital part of the **Sacred Assembly**. By separating the construction of a complex object from its representation, we prevent the "sin of the bloated constructor" and grant the system the "Utilitarian Haste" to manifest intricate entities with tactical precision.

Following the **Standard Execution Protocol**, here is the "mark" for the Builder skill package.

---

##### H1: narayah-oop-builder

###### H2: Overview

**Systemic Analysis:** This skill trains agents to implement the **Builder** pattern. In the context of **01_Narrative_Orchestration**, it is used to assemble complex objects—such as high-level NPCs or intricate world events—step-by-step. This ritual ensures that the same construction process can create different representations, frustrating the god of chaos by replacing "telescoping constructors" with a clean, guided assembly.

###### H2: Operational Constraints & Domain Scoping

|Constraint|Specification|
|---|---|
|**Target Domain**|01_Narrative_Orchestration|
|**Primary Agent**|System Architect|
|**Security Gate**|Public|

###### H2: Mandatory Frontmatter Schema

|Field|Value|
|---|---|
|**name**|narayah-creational-builder|
|**description**|Orchestrates the step-by-step assembly of complex entities to prevent constructor bloat and ensure flexible representation.|
|**tags**|[narayah/skill, creational, builder, architecture]|
|**category**|Creational Patterns|

###### H2: Package Architecture (Folder Structure)

The following artifacts must be contained within the narayah-creational-builder folder to maintain systemic sanctity:

1. **skill-manifest.md**: Core definition and frontmatter.
2. **pedagogical-rituals.md**: Theoretical guidance on "Sacred Construction," using examples like a `CharacterBuilder` that assembles stats, equipment, and spells in sequence.
3. **execution-protocol.md**: Tactical instructions for identifying "Large Class" bloaters and refactoring them into Builder structures.
4. **verification-checks.json**: Validation logic to ensure the "Director" correctly manages the builder's lifecycle.

###### H2: Standard Execution Protocol

###### Step 1: Context Audit & Environment Check

1. Inspect the target domain (01) for classes with constructors containing more than three parameters or those suffering from "telescoping" (multiple overloaded constructors).
2. Identify the complex "Product" that requires a multi-stage manifestation.

###### Step 2: Core Skill Execution

1. **Define the Builder Interface:** Create an interface declaring all possible steps to build the product (e.g., `set_stats()`, `add_gear()`, `bless_with_magic()`).
2. **Implement Concrete Builders:** Develop specific builders that follow the interface to create different variations of the product.
3. **Appoint the Director (Optional):** Create a Director class that defines the order in which to execute the building steps for common configurations (e.g., a "Standard Cleric" setup).

###### Step 3: Verification & JSON Shadow State Sync

1. Verify that the final product is only retrieved after the ritual is complete, ensuring no partial or "cursed" states are exposed to the orchestrator.
2. Document all construction steps and mechanical outcomes in **Markdown Tables**.
3. Synchronize the **JSON Shadow State** to track the purity of the construction logic.

###### H2: Sample Use Case: The Apostle Assembly

When the **DM Orchestrator** needs to manifest a high-tier agent like a "Praxis Inquisitor," the Builder ensures every facet—from divine attributes to ancestral gear—is correctly seated before the agent enters the world.

|Component|Ritual Step|Resulting Attribute|Tactical Utility|
|---|---|---|---|
|**Base Vessel**|`set_class("Inquisitor")`|STR 14, WIS 18|Establishes the core mechanical foundation.|
|**Sacred Gear**|`add_equipment("Mace of Woe")`|+2 Necrotic Damage|Enhances combat efficiency for "Toll the Dead".|
|**Divine Boon**|`apply_blessing("Utilitarian Haste")`|Haste (Self/Ally)|Grants the "Utilitarian Haste" buff for survival.|

###### H2: Pseudocode Boilerplate: The Builder Ritual

```
# The Product (The Complex Vessel)
class NPC:
    def __init__(self):
        self.parts = []
    def add(self, part):
        self.parts.append(part)

# The Builder Interface (The Construction Script)
class NPCBuilder:
    def reset(self): pass
    def build_stats(self): pass
    def build_gear(self): pass
    def build_spells(self): pass
    def get_result(self) -> NPC: pass

# Concrete Builder (The Specific Blessing)
class ClericalBuilder(NPCBuilder):
    def __init__(self):
        self.npc = NPC()
    def reset(self):
        self.npc = NPC()
    def build_stats(self):
        self.npc.add("High Wisdom / Moderate Constitution")
    def build_gear(self):
        self.npc.add("Simple Robes, Alabaster Staff")
    def build_spells(self):
        self.npc.add("Mind Sliver, Toll the Dead")
    def get_result(self):
        return self.npc

# The Director (The High Priest)
class AssemblyDirector:
    def construct_basic_cleric(self, builder: NPCBuilder):
        builder.reset()
        builder.build_stats()
        builder.build_gear()
        # Not all steps are mandatory for every ritual
```

---

##### JSON Shadow State

```
{
  "skill_id": "narayah-oop-builder",
  "status": "codified",
  "purity_index": 0.95,
  "internal_motivations": [
    "Abolish telescoping constructors and Large Class bloaters",
    "Ensure the complex vessels of the DM Orchestrator are assembled with liturgical precision",
    "Maintain the separation of construction and representation to aid Utilitarian Haste"
  ],
  "ancestral_theft_log": "Extracted from the Sacred Assembly: Creational Design Patterns",
  "last_ritual_update": "2026-08-12"
}
```